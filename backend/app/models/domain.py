"""
Pydantic v2 domain schemas for the Davita CRM Prototype.
All data flowing through the API is validated against these models.
"""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Sub-models
# ---------------------------------------------------------------------------

class TransactionItem(BaseModel):
    product_id: str
    qty: int
    unit_price: float


class ProductSummary(BaseModel):
    nome: str
    unidades: int


class StoreSummary(BaseModel):
    nome: str
    total_promocoes: int


class FunnelCounts(BaseModel):
    disparadas: int
    ativadas: int
    resgatadas: int


# ---------------------------------------------------------------------------
# Core entities
# ---------------------------------------------------------------------------

class Store(BaseModel):
    id: str
    name: str
    region: str
    daily_revenue: float = 0.0
    daily_coupons: int = 0
    active_offers_count: int = 0
    redeemed_offers_count: int = 0


class Product(BaseModel):
    id: str
    name: str
    category: str
    price: float
    margin_pct: float
    sponsor_brand: str | None = None


class Customer(BaseModel):
    cpf: str
    name: str
    segment: Literal["alto_valor", "regular", "risco_churn"]
    club_member: bool = True
    last_purchase_by_category: dict[str, datetime] = Field(default_factory=dict)
    avg_cycle_days_by_category: dict[str, float] = Field(default_factory=dict)
    stddev_cycle_days_by_category: dict[str, float] = Field(default_factory=dict)
    total_spent: float = 0.0
    purchase_count: int = 0


class Offer(BaseModel):
    id: str
    customer_cpf: str
    category: str
    sponsor_brand: str
    discount_pct: float
    status: Literal["disparada", "ativada", "resgatada", "expirada"]
    created_at: datetime
    activated_at: datetime | None = None
    redeemed_at: datetime | None = None
    store_id: str | None = None
    incremental_value: float | None = None


class MobileActivation(BaseModel):
    id: str
    customer_cpf: str
    customer_name: str = ""
    product_id: str
    product_name: str
    category: str
    sponsor_brand: str
    discount_pct: float
    store_id: str
    store_name: str
    neighborhood: str
    distance_km: float
    timestamp: datetime


class Transaction(BaseModel):
    id: str
    store_id: str
    pos_id: str | None = None
    customer_cpf: str | None = None
    items: list[TransactionItem]
    total_value: float
    used_club_cpf: bool
    linked_offer_id: str | None = None
    linked_activation_id: str | None = None
    timestamp: datetime


class ChurnAlert(BaseModel):
    id: str
    customer_cpf: str
    customer_name: str = ""
    category: str
    days_since_last_purchase: int
    expected_cycle_days: float
    deviation_ratio: float
    status: Literal["ativo", "campanha_disparada", "resolvido"]
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Dashboard response schemas
# ---------------------------------------------------------------------------

class TradicionalMetrics(BaseModel):
    faturamento_total_dia: float
    cupons_emitidos_dia: int
    ticket_medio_geral: float
    margem_operacional_pct: float


class CRMRetailMediaMetrics(BaseModel):
    receita_incremental_ofertas: float
    ticket_medio_sem_oferta: float
    ticket_medio_com_oferta: float
    aumento_cesta_pct: float
    volume_financiado_industria: float
    pessoas_compraram_a_mais_hoje: int
    ofertas_ativadas_hoje: int
    produto_mais_vendido: ProductSummary
    loja_com_mais_promocoes: StoreSummary
    funil: FunnelCounts


class ChurnRadarMetrics(BaseModel):
    alertas_ativos: int
    campanhas_disparadas_hoje: int


class DashboardSummary(BaseModel):
    tradicional: TradicionalMetrics
    crm_preditivo_retail_media: CRMRetailMediaMetrics
    churn_radar: ChurnRadarMetrics


class StorePerformance(BaseModel):
    store_id: str
    store_name: str
    faturamento: float
    cupons: int
    promocoes_ativas: int
    promocoes_resgatadas: int


# ---------------------------------------------------------------------------
# WebSocket event schema
# ---------------------------------------------------------------------------

class WSEvent(BaseModel):
    type: str
    payload: dict  # type: ignore[type-arg]  # dynamic payload per event type
    timestamp: str
