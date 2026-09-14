"use client";

/**
 * useLiveStore — Singleton WebSocket hook via React Context.
 *
 * Maintains a persistent WebSocket connection to /ws/live.
 * Auto-reconnects on disconnect. Reducer-based state updates from events.
 * Provides initial data fetch via REST on mount, then incremental updates.
 *
 * This is the ONLY point of WebSocket connection in the entire application.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";

import {
  api,
  WS_BASE,
  type ChurnAlert,
  type DashboardSummary,
  type MobileActivation,
  type Offer,
  type StorePerformance,
  type Transaction,
  type WSEvent,
} from "@/lib/api";

// ---------------------------------------------------------------------------
// Initial Seed Activations for Immediate Visual Richness
// ---------------------------------------------------------------------------

const INITIAL_ACTIVATIONS: MobileActivation[] = [
  {
    id: "ACT-8492",
    customer_cpf: "342.***.***-89",
    customer_name: "Mariana O.",
    product_id: "prod-1",
    product_name: "Cerveja Brahma Lata 350ml",
    category: "bebidas",
    sponsor_brand: "Ambev",
    discount_pct: 15,
    store_id: "loja-01",
    store_name: "Loja 01 - Centro",
    neighborhood: "Bela Vista",
    distance_km: 0.8,
    timestamp: new Date(Date.now() - 3500).toISOString(),
    liquidated: true,
  },
  {
    id: "ACT-7319",
    customer_cpf: "198.***.***-34",
    customer_name: "Rodrigo M.",
    product_id: "prod-18",
    product_name: "Sabão em Pó OMO 1.6kg",
    category: "limpeza",
    sponsor_brand: "Unilever",
    discount_pct: 20,
    store_id: "loja-02",
    store_name: "Loja 02 - Jardim São Paulo",
    neighborhood: "Vila Mariana",
    distance_km: 1.2,
    timestamp: new Date(Date.now() - 8000).toISOString(),
    liquidated: true,
  },
  {
    id: "ACT-6204",
    customer_cpf: "512.***.***-71",
    customer_name: "Carla S.",
    product_id: "prod-6",
    product_name: "Leite Integral Ninho 1L",
    category: "laticínios",
    sponsor_brand: "Nestlé",
    discount_pct: 12,
    store_id: "loja-03",
    store_name: "Loja 03 - Zona Norte",
    neighborhood: "Santana",
    distance_km: 0.6,
    timestamp: new Date(Date.now() - 14000).toISOString(),
    liquidated: false,
  },
  {
    id: "ACT-5182",
    customer_cpf: "784.***.***-22",
    customer_name: "Lucas P.",
    product_id: "prod-3",
    product_name: "Red Bull Energy 250ml",
    category: "bebidas",
    sponsor_brand: "Red Bull",
    discount_pct: 18,
    store_id: "loja-06",
    store_name: "Loja 06 - Bairro Alto",
    neighborhood: "Perdizes",
    distance_km: 2.1,
    timestamp: new Date(Date.now() - 21000).toISOString(),
    liquidated: true,
  },
  {
    id: "ACT-4091",
    customer_cpf: "903.***.***-55",
    customer_name: "Fernanda T.",
    product_id: "prod-7",
    product_name: "Iogurte Danone Natural 170g",
    category: "laticínios",
    sponsor_brand: "Danone",
    discount_pct: 15,
    store_id: "loja-04",
    store_name: "Loja 04 - Vila Industrial",
    neighborhood: "Tatuapé",
    distance_km: 3.4,
    timestamp: new Date(Date.now() - 29000).toISOString(),
    liquidated: false,
  },
];

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface LiveState {
  dashboard: DashboardSummary | null;
  storePerformance: StorePerformance[];
  churnAlerts: ChurnAlert[];
  recentTransactions: Transaction[];
  customerOffers: Offer[];
  liveActivations: MobileActivation[];
  demoCPF: string;
  connected: boolean;
  loading: boolean;
  pushNotification: Offer | null;
}

const initialState: LiveState = {
  dashboard: null,
  storePerformance: [],
  churnAlerts: [],
  recentTransactions: [],
  customerOffers: [],
  liveActivations: INITIAL_ACTIVATIONS,
  demoCPF: "",
  connected: false,
  loading: true,
  pushNotification: null,
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type Action =
  | { type: "SET_INITIAL_DATA"; payload: Partial<LiveState> }
  | { type: "SET_DASHBOARD"; payload: DashboardSummary }
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "ADD_ACTIVATION"; payload: MobileActivation }
  | { type: "SET_ACTIVATIONS"; payload: MobileActivation[] }
  | { type: "ADD_CHURN_ALERT"; payload: ChurnAlert }
  | { type: "SET_CHURN_ALERTS"; payload: ChurnAlert[] }
  | { type: "ADD_OFFER"; payload: Offer }
  | { type: "UPDATE_OFFER"; payload: Offer }
  | { type: "SET_OFFERS"; payload: Offer[] }
  | { type: "SET_STORE_PERFORMANCE"; payload: StorePerformance[] }
  | { type: "SET_CONNECTED"; payload: boolean }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SHOW_PUSH"; payload: Offer }
  | { type: "DISMISS_PUSH" };

function reducer(state: LiveState, action: Action): LiveState {
  switch (action.type) {
    case "SET_INITIAL_DATA":
      return { ...state, ...action.payload, loading: false };

    case "SET_DASHBOARD":
      return { ...state, dashboard: action.payload };

    case "ADD_TRANSACTION": {
      const txn = action.payload;
      const txns = [txn, ...state.recentTransactions].slice(0, 15);
      // Correlate: if transaction has linked_activation_id, mark that activation as liquidated
      let acts = state.liveActivations;
      if (txn.linked_activation_id) {
        acts = acts.map((a) =>
          a.id === txn.linked_activation_id ? { ...a, liquidated: true } : a
        );
      }
      return { ...state, recentTransactions: txns, liveActivations: acts };
    }

    case "ADD_ACTIVATION": {
      const exists = state.liveActivations.some((a) => a.id === action.payload.id);
      if (exists) return state;
      return {
        ...state,
        liveActivations: [action.payload, ...state.liveActivations].slice(0, 25),
      };
    }

    case "SET_ACTIVATIONS":
      return { ...state, liveActivations: action.payload };

    case "ADD_CHURN_ALERT": {
      const exists = state.churnAlerts.some((a) => a.id === action.payload.id);
      if (exists) return state;
      return { ...state, churnAlerts: [action.payload, ...state.churnAlerts].slice(0, 8) };
    }

    case "SET_CHURN_ALERTS":
      return { ...state, churnAlerts: action.payload };

    case "ADD_OFFER": {
      const exists = state.customerOffers.some((o) => o.id === action.payload.id);
      if (exists) return state;
      return { ...state, customerOffers: [action.payload, ...state.customerOffers] };
    }

    case "UPDATE_OFFER": {
      const updated = state.customerOffers.map((o) =>
        o.id === action.payload.id ? action.payload : o
      );
      return { ...state, customerOffers: updated };
    }

    case "SET_OFFERS":
      return { ...state, customerOffers: action.payload };

    case "SET_STORE_PERFORMANCE":
      return { ...state, storePerformance: action.payload };

    case "SET_CONNECTED":
      return { ...state, connected: action.payload };

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SHOW_PUSH":
      return { ...state, pushNotification: action.payload };

    case "DISMISS_PUSH":
      return { ...state, pushNotification: null };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface LiveStoreContextValue {
  state: LiveState;
  dispatch: React.Dispatch<Action>;
  refreshDashboard: () => Promise<void>;
  refreshOffers: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  refreshStorePerformance: () => Promise<void>;
}

const LiveStoreContext = createContext<LiveStoreContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function LiveStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const demoCPFRef = useRef<string>("");

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      const [dashRes, storePerf, alerts, txns, demoRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getStorePerformance(),
        api.getChurnAlerts(),
        api.getRecentTransactions(10),
        api.getDemoCustomerCPF(),
      ]);

      demoCPFRef.current = demoRes.demo_cpf;

      const [offers, acts] = await Promise.all([
        api.getOffers(demoRes.demo_cpf),
        api.getRecentActivations().catch(() => []),
      ]);

      dispatch({
        type: "SET_INITIAL_DATA",
        payload: {
          dashboard: dashRes,
          storePerformance: storePerf,
          churnAlerts: alerts,
          recentTransactions: txns,
          customerOffers: offers,
          liveActivations: acts && acts.length > 0 ? acts : INITIAL_ACTIVATIONS,
          demoCPF: demoRes.demo_cpf,
        },
      });
    } catch (err) {
      console.error("Failed to fetch initial data:", err);
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  // WebSocket connection with auto-reconnect
  const connectWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_BASE}/ws/live`);
    wsRef.current = ws;

    ws.onopen = () => {
      dispatch({ type: "SET_CONNECTED", payload: true });
      console.log("[WS] Connected");
    };

    ws.onmessage = (event) => {
      try {
        const data: WSEvent = JSON.parse(event.data);
        handleWSEvent(data);
      } catch (err) {
        console.error("[WS] Parse error:", err);
      }
    };

    ws.onclose = () => {
      dispatch({ type: "SET_CONNECTED", payload: false });
      console.log("[WS] Disconnected, reconnecting in 2s...");
      reconnectTimerRef.current = setTimeout(connectWS, 2000);
    };

    ws.onerror = (err) => {
      console.error("[WS] Error:", err);
      ws.close();
    };
  }, []);

  const handleWSEvent = useCallback((event: WSEvent) => {
    const { type, payload } = event;

    switch (type) {
      case "transaction.created":
        dispatch({ type: "ADD_TRANSACTION", payload: payload as unknown as Transaction });
        break;

      case "activation.created":
        dispatch({ type: "ADD_ACTIVATION", payload: payload as unknown as MobileActivation });
        break;

      case "dashboard.summary_updated":
        dispatch({ type: "SET_DASHBOARD", payload: payload as unknown as DashboardSummary });
        break;

      case "churn_alert.created":
        dispatch({ type: "ADD_CHURN_ALERT", payload: payload as unknown as ChurnAlert });
        break;

      case "offer.created": {
        const offer = payload as unknown as Offer;
        // Add to customer offers if it belongs to the demo customer
        if (offer.customer_cpf === demoCPFRef.current) {
          dispatch({ type: "ADD_OFFER", payload: offer });
          // Show push notification
          dispatch({ type: "SHOW_PUSH", payload: offer });
          // Auto-dismiss after 6 seconds
          setTimeout(() => dispatch({ type: "DISMISS_PUSH" }), 6000);
        }
        break;
      }

      case "offer.activated": {
        const offer = payload as unknown as Offer;
        dispatch({ type: "UPDATE_OFFER", payload: offer });
        break;
      }

      case "offer.redeemed": {
        const offer = payload as unknown as Offer;
        dispatch({ type: "UPDATE_OFFER", payload: offer });
        break;
      }

      default:
        break;
    }
  }, []);

  // Refresh helpers for manual re-fetches
  const refreshDashboard = useCallback(async () => {
    const data = await api.getDashboardSummary();
    dispatch({ type: "SET_DASHBOARD", payload: data });
  }, []);

  const refreshOffers = useCallback(async () => {
    if (!demoCPFRef.current) return;
    const data = await api.getOffers(demoCPFRef.current);
    dispatch({ type: "SET_OFFERS", payload: data });
  }, []);

  const refreshAlerts = useCallback(async () => {
    const data = await api.getChurnAlerts();
    dispatch({ type: "SET_CHURN_ALERTS", payload: data });
  }, []);

  const refreshStorePerformance = useCallback(async () => {
    const data = await api.getStorePerformance();
    dispatch({ type: "SET_STORE_PERFORMANCE", payload: data });
  }, []);

  // Initialize on mount
  useEffect(() => {
    fetchInitialData();
    connectWS();

    // Periodic refresh of store performance (every 10s)
    const interval = setInterval(async () => {
      try {
        const perf = await api.getStorePerformance();
        dispatch({ type: "SET_STORE_PERFORMANCE", payload: perf });
      } catch {
        // silently ignore refresh errors
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [fetchInitialData, connectWS]);

  const value: LiveStoreContextValue = {
    state,
    dispatch,
    refreshDashboard,
    refreshOffers,
    refreshAlerts,
    refreshStorePerformance,
  };

  return (
    <LiveStoreContext.Provider value={value}>
      {children}
    </LiveStoreContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLiveStore(): LiveStoreContextValue {
  const ctx = useContext(LiveStoreContext);
  if (!ctx) {
    throw new Error("useLiveStore must be used within a LiveStoreProvider");
  }
  return ctx;
}
