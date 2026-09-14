/**
 * TypeScript API client for the Davita Intelligence Suite backend.
 * All types match the Pydantic schemas defined in backend/app/models/domain.py
 */

const rawApiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE = rawApiBase.replace(/\/+$/, "");

const getWsBase = () => {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL.replace(/\/+$/, "");
  }
  if (API_BASE.startsWith("https://")) {
    return API_BASE.replace(/^https:\/\//, "wss://");
  }
  return API_BASE.replace(/^http:\/\//, "ws://");
};

const WS_BASE = getWsBase();

// ---------------------------------------------------------------------------
// Domain types (mirror of Pydantic schemas)
// ---------------------------------------------------------------------------

export interface TransactionItem {
  product_id: string;
  qty: number;
  unit_price: number;
}

export interface ProductSummary {
  nome: string;
  unidades: number;
}

export interface StoreSummaryInfo {
  nome: string;
  total_promocoes: number;
}

export interface FunnelCounts {
  disparadas: number;
  ativadas: number;
  resgatadas: number;
}

export interface Store {
  id: string;
  name: string;
  region: string;
  daily_revenue: number;
  daily_coupons: number;
  active_offers_count: number;
  redeemed_offers_count: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  margin_pct: number;
  sponsor_brand: string | null;
}

export interface Customer {
  cpf: string;
  name: string;
  segment: "alto_valor" | "regular" | "risco_churn";
  club_member: boolean;
  total_spent: number;
  purchase_count: number;
}

export interface Offer {
  id: string;
  customer_cpf: string;
  category: string;
  sponsor_brand: string;
  discount_pct: number;
  status: "disparada" | "ativada" | "resgatada" | "expirada";
  created_at: string;
  activated_at: string | null;
  redeemed_at: string | null;
  store_id: string | null;
  incremental_value: number | null;
}

export interface MobileActivation {
  id: string;
  customer_cpf: string;
  customer_name: string;
  product_id: string;
  product_name: string;
  category: string;
  sponsor_brand: string;
  discount_pct: number;
  store_id: string;
  store_name: string;
  neighborhood: string;
  distance_km: number;
  timestamp: string;
  liquidated?: boolean;
}

export interface Transaction {
  id: string;
  store_id: string;
  pos_id?: string | null;
  customer_cpf: string | null;
  items: TransactionItem[];
  total_value: number;
  used_club_cpf: boolean;
  linked_offer_id: string | null;
  linked_activation_id?: string | null;
  timestamp: string;
}

export interface ChurnAlert {
  id: string;
  customer_cpf: string;
  customer_name: string;
  category: string;
  days_since_last_purchase: number;
  expected_cycle_days: number;
  deviation_ratio: number;
  status: "ativo" | "campanha_disparada" | "resolvido";
  created_at: string;
}

// Dashboard
export interface TradicionalMetrics {
  faturamento_total_dia: number;
  cupons_emitidos_dia: number;
  ticket_medio_geral: number;
  margem_operacional_pct: number;
}

export interface CRMRetailMediaMetrics {
  receita_incremental_ofertas: number;
  ticket_medio_sem_oferta: number;
  ticket_medio_com_oferta: number;
  aumento_cesta_pct: number;
  volume_financiado_industria: number;
  pessoas_compraram_a_mais_hoje: number;
  ofertas_ativadas_hoje: number;
  produto_mais_vendido: ProductSummary;
  loja_com_mais_promocoes: StoreSummaryInfo;
  funil: FunnelCounts;
}

export interface ChurnRadarMetrics {
  alertas_ativos: number;
  campanhas_disparadas_hoje: number;
}

export interface DashboardSummary {
  tradicional: TradicionalMetrics;
  crm_preditivo_retail_media: CRMRetailMediaMetrics;
  churn_radar: ChurnRadarMetrics;
}

export interface StorePerformance {
  store_id: string;
  store_name: string;
  faturamento: number;
  cupons: number;
  promocoes_ativas: number;
  promocoes_resgatadas: number;
}

// WebSocket event
export interface WSEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// API Client
// ---------------------------------------------------------------------------

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Health
  health: () => fetchJSON<{ status: string }>("/health"),

  // Dashboard
  getDashboardSummary: () => fetchJSON<DashboardSummary>("/dashboard/summary"),
  getStorePerformance: () => fetchJSON<StorePerformance[]>("/dashboard/store-performance"),
  getFunnel: () => fetchJSON<FunnelCounts>("/dashboard/funnel"),

  // Stores & Products
  getStores: () => fetchJSON<Store[]>("/stores"),
  getProducts: () => fetchJSON<Product[]>("/products"),

  // Customers
  getDemoCustomerCPF: () => fetchJSON<{ demo_cpf: string }>("/customers"),
  getCustomer: (cpf: string) => fetchJSON<Customer>(`/customers/${encodeURIComponent(cpf)}`),
  simulatePurchase: (cpf: string) =>
    fetchJSON<{ status: string; transaction_id: string; total_value: number }>(
      `/customers/${encodeURIComponent(cpf)}/simulate-purchase`,
      { method: "POST" }
    ),

  // Offers
  getOffers: (customerCPF?: string) =>
    fetchJSON<Offer[]>(`/offers${customerCPF ? `?customer_cpf=${encodeURIComponent(customerCPF)}` : ""}`),
  activateOffer: (offerId: string) =>
    fetchJSON<{ status: string; offer_id: string; new_status: string }>(
      `/offers/${offerId}/activate`,
      { method: "POST" }
    ),

  // Churn alerts
  getChurnAlerts: () => fetchJSON<ChurnAlert[]>("/churn-alerts"),
  triggerCampaign: (alertId: string) =>
    fetchJSON<{ status: string; offer_id: string }>(
      `/churn-alerts/${alertId}/trigger-campaign`,
      { method: "POST" }
    ),

  // Transactions & Activations
  getRecentTransactions: (limit = 5) =>
    fetchJSON<Transaction[]>(`/transactions/recent?limit=${limit}`),
  getRecentActivations: () =>
    fetchJSON<MobileActivation[]>("/simulation/activations/recent"),

  // Simulation control
  pauseSimulation: () => fetchJSON<{ status: string }>("/simulation/pause", { method: "POST" }),
  resumeSimulation: () => fetchJSON<{ status: string }>("/simulation/resume", { method: "POST" }),
  setSimulationSpeed: (multiplier: number) =>
    fetchJSON<{ status: string }>("/simulation/speed", {
      method: "POST",
      body: JSON.stringify({ multiplier }),
    }),
  resetSimulation: () => fetchJSON<{ status: string }>("/simulation/reset", { method: "POST" }),
  getSimulationStatus: () => fetchJSON<{ paused: boolean; multiplier: number }>("/simulation/status"),
};

export { WS_BASE };
