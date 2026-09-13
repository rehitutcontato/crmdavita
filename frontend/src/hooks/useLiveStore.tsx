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
  type Offer,
  type StorePerformance,
  type Transaction,
  type WSEvent,
} from "@/lib/api";

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface LiveState {
  dashboard: DashboardSummary | null;
  storePerformance: StorePerformance[];
  churnAlerts: ChurnAlert[];
  recentTransactions: Transaction[];
  customerOffers: Offer[];
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
      const txns = [action.payload, ...state.recentTransactions].slice(0, 10);
      return { ...state, recentTransactions: txns };
    }

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

      const offers = await api.getOffers(demoRes.demo_cpf);

      dispatch({
        type: "SET_INITIAL_DATA",
        payload: {
          dashboard: dashRes,
          storePerformance: storePerf,
          churnAlerts: alerts,
          recentTransactions: txns,
          customerOffers: offers,
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
