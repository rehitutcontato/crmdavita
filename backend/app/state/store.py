"""
In-memory state store — single source of truth for all live data.
Backed by Python data structures (dict/list) for fast access.
Thread-safe via asyncio (single-threaded event loop).
"""
from __future__ import annotations

import uuid
from collections import defaultdict
from datetime import datetime
from typing import Literal

from app.data.seed import SeedData
from app.models.domain import (
    ChurnAlert,
    ChurnRadarMetrics,
    CRMRetailMediaMetrics,
    Customer,
    DashboardSummary,
    FunnelCounts,
    Offer,
    Product,
    ProductSummary,
    Store,
    StorePerformance,
    StoreSummary,
    TradicionalMetrics,
    Transaction,
    TransactionItem,
)


def _uid() -> str:
    return uuid.uuid4().hex[:12]


class AppState:
    """
    Centralized mutable state for the simulation.
    All reads and writes go through this object.
    """

    def __init__(self) -> None:
        self._seed: SeedData | None = None
        # Core data indexed by ID/key
        self.stores: dict[str, Store] = {}
        self.products: dict[str, Product] = {}
        self.products_by_category: dict[str, list[Product]] = {}
        self.sponsored_products: list[Product] = []
        self.customers: dict[str, Customer] = {}  # keyed by CPF
        self.offers: dict[str, Offer] = {}
        self.transactions: list[Transaction] = []
        self.churn_alerts: dict[str, ChurnAlert] = {}

        # Daily aggregates
        self.total_revenue_today: float = 0.0
        self.total_coupons_today: int = 0
        self.total_transactions_today: int = 0
        self.total_items_sold_today: int = 0

        # CRM/Retail Media aggregates
        self.incremental_revenue: float = 0.0
        self.volume_financed_by_industry: float = 0.0
        self.industry_finance_by_brand: dict[str, float] = defaultdict(float)
        self.people_bought_more_today: int = 0
        self.offers_activated_today: int = 0
        self.campaigns_triggered_today: int = 0
        self.product_units_sold: dict[str, int] = defaultdict(int)

        # Ticket tracking for with/without offer comparison
        self._tickets_with_offer: list[float] = []
        self._tickets_without_offer: list[float] = []

    def initialize(self, seed: SeedData) -> None:
        """Load seed data into state."""
        self._seed = seed
        self.stores = {s.id: s.model_copy() for s in seed.stores}
        self.products = {p.id: p.model_copy() for p in seed.products}
        self.products_by_category = {
            cat: list(prods) for cat, prods in seed.products_by_category.items()
        }
        self.sponsored_products = list(seed.sponsored_products)
        self.customers = {c.cpf: c.model_copy(deep=True) for c in seed.customers}
        self.offers = {o.id: o.model_copy() for o in seed.offers}
        self.churn_alerts = {a.id: a.model_copy() for a in seed.churn_alerts}
        self.transactions = []

        # Reset aggregates
        self.total_revenue_today = 0.0
        self.total_coupons_today = 0
        self.total_transactions_today = 0
        self.total_items_sold_today = 0
        self.incremental_revenue = 0.0
        self.volume_financed_by_industry = 0.0
        self.industry_finance_by_brand = defaultdict(float)
        self.people_bought_more_today = 0
        self.offers_activated_today = 0
        self.campaigns_triggered_today = 0
        self.product_units_sold = defaultdict(int)
        self._tickets_with_offer = []
        self._tickets_without_offer = []

        # Pre-seed metrics from initial offers
        self.offers_activated_today = sum(
            1 for o in self.offers.values() if o.status in ("ativada", "resgatada")
        )
        self.campaigns_triggered_today = sum(
            1 for a in self.churn_alerts.values() if a.status == "campanha_disparada"
        )
        for o in self.offers.values():
            if o.status == "resgatada":
                if o.incremental_value:
                    self.incremental_revenue += o.incremental_value
                    self.people_bought_more_today += 1
                # Estimate sponsored discount (avg ~R$ 68.68 to match ~R$ 9,410 total)
                disc = round(o.incremental_value * 0.52 if o.incremental_value else 18.0, 2)
                self.volume_financed_by_industry += disc
                self.industry_finance_by_brand[o.sponsor_brand] += disc
            
            if o.store_id and o.store_id in self.stores:
                st = self.stores[o.store_id]
                if o.status == "ativada":
                    st.active_offers_count += 1
                elif o.status == "resgatada":
                    st.redeemed_offers_count += 1

        # Replay initial transactions through record_transaction
        for txn in seed.transactions:
            self.record_transaction(txn)

    def reset(self) -> None:
        """Reset to initial seed state."""
        if self._seed is not None:
            self.initialize(self._seed)

    @property
    def demo_customer_cpf(self) -> str:
        """CPF of the demo customer (first in list)."""
        if self._seed:
            return self._seed.demo_customer.cpf
        return list(self.customers.keys())[0]

    # ------------------------------------------------------------------
    # Transaction recording
    # ------------------------------------------------------------------

    def record_transaction(self, txn: Transaction) -> None:
        """Record a new transaction and update all aggregates."""
        self.transactions.append(txn)
        self.total_revenue_today += txn.total_value
        self.total_coupons_today += 1
        self.total_transactions_today += 1

        # Update store metrics
        store = self.stores.get(txn.store_id)
        if store:
            store.daily_revenue += txn.total_value
            store.daily_coupons += 1

        # Track items sold
        for item in txn.items:
            self.total_items_sold_today += item.qty
            product = self.products.get(item.product_id)
            if product:
                self.product_units_sold[product.name] += item.qty

        # Track ticket with/without offer
        if txn.linked_offer_id:
            self._tickets_with_offer.append(txn.total_value)
        else:
            self._tickets_without_offer.append(txn.total_value)

        # Update customer history
        if txn.customer_cpf and txn.customer_cpf in self.customers:
            customer = self.customers[txn.customer_cpf]
            customer.total_spent += txn.total_value
            customer.purchase_count += 1
            # Update last_purchase_by_category
            for item in txn.items:
                product = self.products.get(item.product_id)
                if product:
                    customer.last_purchase_by_category[product.category] = txn.timestamp

    def record_offer_activation(self, offer: Offer) -> None:
        """Record an offer activation."""
        self.offers_activated_today += 1
        store_id = offer.store_id
        if store_id:
            store = self.stores.get(store_id)
            if store:
                store.active_offers_count += 1

    def record_offer_redemption(self, offer: Offer, discount_amount: float) -> None:
        """Record an offer redemption."""
        if offer.incremental_value and offer.incremental_value > 0:
            self.incremental_revenue += offer.incremental_value
            self.people_bought_more_today += 1

        if offer.sponsor_brand:
            self.volume_financed_by_industry += discount_amount
            self.industry_finance_by_brand[offer.sponsor_brand] += discount_amount

        if offer.store_id:
            store = self.stores.get(offer.store_id)
            if store:
                store.redeemed_offers_count += 1

    # ------------------------------------------------------------------
    # Query methods for dashboard
    # ------------------------------------------------------------------

    def get_dashboard_summary(self) -> DashboardSummary:
        """Compute the full dashboard summary from live state."""
        # Traditional metrics
        ticket_medio = (
            self.total_revenue_today / self.total_transactions_today
            if self.total_transactions_today > 0
            else 0.0
        )
        avg_margin = self._compute_avg_margin()

        tradicional = TradicionalMetrics(
            faturamento_total_dia=round(self.total_revenue_today, 2),
            cupons_emitidos_dia=self.total_coupons_today,
            ticket_medio_geral=round(ticket_medio, 2),
            margem_operacional_pct=round(avg_margin, 1),
        )

        # CRM / Retail Media metrics
        ticket_sem = (
            sum(self._tickets_without_offer) / len(self._tickets_without_offer)
            if self._tickets_without_offer
            else 0.0
        )
        ticket_com = (
            sum(self._tickets_with_offer) / len(self._tickets_with_offer)
            if self._tickets_with_offer
            else 0.0
        )
        aumento_pct = (
            ((ticket_com - ticket_sem) / ticket_sem * 100) if ticket_sem > 0 else 0.0
        )

        # Best selling product
        best_product_name = "—"
        best_product_units = 0
        if self.product_units_sold:
            best_product_name = max(
                self.product_units_sold, key=self.product_units_sold.get  # type: ignore[arg-type]
            )
            best_product_units = self.product_units_sold[best_product_name]

        # Store with most promotions
        best_store_name = "—"
        best_store_promos = 0
        for store in self.stores.values():
            total_promos = store.active_offers_count + store.redeemed_offers_count
            if total_promos > best_store_promos:
                best_store_promos = total_promos
                best_store_name = store.name

        # Funnel
        disparadas = sum(1 for o in self.offers.values() if o.status in ("disparada", "ativada", "resgatada", "expirada"))
        ativadas = sum(1 for o in self.offers.values() if o.status in ("ativada", "resgatada"))
        resgatadas = sum(1 for o in self.offers.values() if o.status == "resgatada")

        crm = CRMRetailMediaMetrics(
            receita_incremental_ofertas=round(self.incremental_revenue, 2),
            ticket_medio_sem_oferta=round(ticket_sem, 2),
            ticket_medio_com_oferta=round(ticket_com, 2),
            aumento_cesta_pct=round(aumento_pct, 1),
            volume_financiado_industria=round(self.volume_financed_by_industry, 2),
            pessoas_compraram_a_mais_hoje=self.people_bought_more_today,
            ofertas_ativadas_hoje=self.offers_activated_today,
            produto_mais_vendido=ProductSummary(
                nome=best_product_name, unidades=best_product_units
            ),
            loja_com_mais_promocoes=StoreSummary(
                nome=best_store_name, total_promocoes=best_store_promos
            ),
            funil=FunnelCounts(
                disparadas=disparadas, ativadas=ativadas, resgatadas=resgatadas
            ),
        )

        # Churn radar
        active_alerts = sum(
            1 for a in self.churn_alerts.values() if a.status == "ativo"
        )
        churn = ChurnRadarMetrics(
            alertas_ativos=active_alerts,
            campanhas_disparadas_hoje=self.campaigns_triggered_today,
        )

        return DashboardSummary(
            tradicional=tradicional,
            crm_preditivo_retail_media=crm,
            churn_radar=churn,
        )

    def get_store_performance(self) -> list[StorePerformance]:
        """Performance breakdown per store."""
        result: list[StorePerformance] = []
        for store in self.stores.values():
            result.append(
                StorePerformance(
                    store_id=store.id,
                    store_name=store.name,
                    faturamento=round(store.daily_revenue, 2),
                    cupons=store.daily_coupons,
                    promocoes_ativas=store.active_offers_count,
                    promocoes_resgatadas=store.redeemed_offers_count,
                )
            )
        return result

    def get_funnel(self) -> FunnelCounts:
        disparadas = sum(1 for o in self.offers.values() if o.status in ("disparada", "ativada", "resgatada", "expirada"))
        ativadas = sum(1 for o in self.offers.values() if o.status in ("ativada", "resgatada"))
        resgatadas = sum(1 for o in self.offers.values() if o.status == "resgatada")
        return FunnelCounts(disparadas=disparadas, ativadas=ativadas, resgatadas=resgatadas)

    def get_active_churn_alerts(self) -> list[ChurnAlert]:
        return [a for a in self.churn_alerts.values() if a.status == "ativo"]

    def get_customer_offers(self, cpf: str) -> list[Offer]:
        return [o for o in self.offers.values() if o.customer_cpf == cpf]

    def get_recent_transactions(self, limit: int = 5) -> list[Transaction]:
        return list(reversed(self.transactions[-limit:]))

    def _compute_avg_margin(self) -> float:
        """Weighted average margin based on items sold today."""
        if not self.transactions:
            return 3.1  # realistic default for supermarket
        total_value = 0.0
        weighted_margin = 0.0
        for txn in self.transactions:
            for item in txn.items:
                product = self.products.get(item.product_id)
                if product:
                    val = item.unit_price * item.qty
                    total_value += val
                    weighted_margin += val * product.margin_pct / 100.0
        if total_value == 0:
            return 3.1
        gross_margin = (weighted_margin / total_value) * 100.0
        # Operational margin after deducting retail OPEX (~19.5% in supermarket chains)
        op_margin = max(2.8, min(4.5, gross_margin - 19.5))
        return round(op_margin, 1)


# Global singleton
app_state = AppState()
