"""
Simulation engine — three async loops that continuously generate data.

Loop A: Transaction generation (every 3-4s)
Loop B: Churn radar (every 15-20s)
Loop C: Offer expiration (every 10s)
"""
from __future__ import annotations

import asyncio
import logging
import random
import uuid
from datetime import datetime, timedelta

from app.models.domain import (
    ChurnAlert,
    Customer,
    MobileActivation,
    Offer,
    Transaction,
    TransactionItem,
)
from app.simulation.clock import simulation_clock
from app.state.store import app_state
from app.ws.manager import ws_manager

logger = logging.getLogger("simulation")
logging.basicConfig(level=logging.INFO)

_tasks: list[asyncio.Task[None]] = []

STORE_NEIGHBORHOODS: dict[str, list[dict[str, Any]]] = {
    "loja-01": [
        {"name": "Centro Histórico", "dist": 0.4},
        {"name": "Bela Vista", "dist": 0.8},
        {"name": "República", "dist": 1.2},
        {"name": "Consolação", "dist": 2.1},
        {"name": "Higienópolis", "dist": 3.4},
    ],
    "loja-02": [
        {"name": "Jardim São Paulo", "dist": 0.5},
        {"name": "Vila Mariana", "dist": 0.9},
        {"name": "Saúde", "dist": 1.8},
        {"name": "Moema", "dist": 2.7},
        {"name": "Brooklin", "dist": 3.8},
    ],
    "loja-03": [
        {"name": "Santana", "dist": 0.6},
        {"name": "Tucuruvi", "dist": 1.3},
        {"name": "Parada Inglesa", "dist": 1.9},
        {"name": "Vila Guilherme", "dist": 2.6},
        {"name": "Mandaqui", "dist": 3.5},
    ],
    "loja-04": [
        {"name": "Vila Industrial", "dist": 0.5},
        {"name": "Tatuapé", "dist": 1.4},
        {"name": "Mooca", "dist": 2.2},
        {"name": "Anália Franco", "dist": 2.9},
        {"name": "Água Rasa", "dist": 3.6},
    ],
    "loja-05": [
        {"name": "Alphaville", "dist": 0.7},
        {"name": "Tamboré", "dist": 1.6},
        {"name": "Granja Viana", "dist": 2.8},
        {"name": "Carapicuíba", "dist": 3.7},
    ],
    "loja-06": [
        {"name": "Bairro Alto", "dist": 0.5},
        {"name": "Perdizes", "dist": 1.1},
        {"name": "Pompeia", "dist": 1.8},
        {"name": "Sumaré", "dist": 2.5},
        {"name": "Pinheiros", "dist": 3.4},
    ],
}

_recent_activations: list[MobileActivation] = []
_pending_cause_effect_queue: list[MobileActivation] = []


def get_recent_activations() -> list[MobileActivation]:
    """Return in-memory recent mobile activations."""
    return list(_recent_activations)


def _uid() -> str:
    return uuid.uuid4().hex[:12]


# ---------------------------------------------------------------------------
# Loop A — Transaction Generation (with Mirrored Cause & Effect)
# ---------------------------------------------------------------------------

async def _loop_transaction_generation() -> None:
    """Generate transactions every 3-4 seconds (adjusted by clock)."""
    logger.info("Loop A (Transaction Generation) started")
    while True:
        try:
            base_interval = random.uniform(3.0, 4.0)
            await simulation_clock.sleep(base_interval)

            if simulation_clock.paused:
                continue

            now = datetime.utcnow()

            # Check if there is a pending correlated activation to liquidate
            correlated_act: MobileActivation | None = None
            if _pending_cause_effect_queue and random.random() < 0.75:
                oldest = _pending_cause_effect_queue[0]
                if (now - oldest.timestamp).total_seconds() >= 1.0:
                    correlated_act = _pending_cause_effect_queue.pop(0)

            if correlated_act:
                # Correlated Cause-and-Effect Transaction at POS
                store_id = correlated_act.store_id
                customer_cpf = correlated_act.customer_cpf
                used_club_cpf = True
                linked_activation_id = correlated_act.id
                linked_offer_id = f"OFF-{correlated_act.id}"
                pos_id = f"PDV #{random.randint(1, 8):02d}"

                items: list[TransactionItem] = []
                act_prod = app_state.products.get(correlated_act.product_id)
                discount_amount = 0.0
                total_value = 0.0

                if act_prod:
                    qty = random.randint(1, 3)
                    item_base = act_prod.price * qty
                    disc = item_base * (correlated_act.discount_pct / 100.0)
                    discount_amount += disc
                    total_value += item_base - disc
                    items.append(
                        TransactionItem(
                            product_id=act_prod.id,
                            qty=qty,
                            unit_price=act_prod.price,
                        )
                    )

                # Complementary basket items (Basket lift demo)
                other_prods = [
                    p for p in app_state.products.values() if p.id != correlated_act.product_id
                ]
                if other_prods:
                    n_extra = random.randint(1, 3)
                    for ep in random.sample(other_prods, min(n_extra, len(other_prods))):
                        eqty = random.randint(1, 2)
                        items.append(
                            TransactionItem(
                                product_id=ep.id,
                                qty=eqty,
                                unit_price=ep.price,
                            )
                        )
                        total_value += ep.price * eqty
            else:
                # 1. Pick a random store
                store_ids = list(app_state.stores.keys())
                store_id = random.choice(store_ids)
                pos_id = f"PDV #{random.randint(1, 8):02d}"

                # 2. Pick 1-5 products for the cart
                all_products = list(app_state.products.values())
                n_items = random.randint(1, 5)
                selected_products = random.sample(
                    all_products, min(n_items, len(all_products))
                )

                items = []
                cart_categories: set[str] = set()
                total_value = 0.0

                for prod in selected_products:
                    qty = random.randint(1, 4)
                    items.append(
                        TransactionItem(
                            product_id=prod.id,
                            qty=qty,
                            unit_price=prod.price,
                        )
                    )
                    total_value += prod.price * qty
                    cart_categories.add(prod.category)

                # 3. ~72% chance of CPF identification
                used_club_cpf = random.random() < 0.72
                customer_cpf = None
                linked_offer_id = None
                linked_activation_id = None
                discount_amount = 0.0

                if used_club_cpf:
                    customer_list = list(app_state.customers.values())
                    customer = random.choice(customer_list)
                    customer_cpf = customer.cpf

                    # 4. Check if customer has an activated offer matching cart categories
                    customer_offers = [
                        o
                        for o in app_state.offers.values()
                        if o.customer_cpf == customer_cpf
                        and o.status == "ativada"
                        and o.category in cart_categories
                    ]

                    if customer_offers:
                        offer = customer_offers[0]
                        for item in items:
                            product = app_state.products.get(item.product_id)
                            if product and product.category == offer.category:
                                item_discount = (
                                    item.unit_price * item.qty * (offer.discount_pct / 100.0)
                                )
                                discount_amount += item_discount
                                total_value -= item_discount

                        avg_ticket = (
                            customer.total_spent / customer.purchase_count
                            if customer.purchase_count > 0
                            else total_value
                        )
                        incremental = max(0.0, total_value - avg_ticket)

                        offer.status = "resgatada"
                        offer.redeemed_at = now
                        offer.store_id = store_id
                        offer.incremental_value = round(incremental, 2)
                        linked_offer_id = offer.id

                        app_state.record_offer_redemption(offer, discount_amount)
                        await ws_manager.broadcast(
                            "offer.redeemed",
                            offer.model_dump(mode="json"),
                        )

            # 5. Create and persist the transaction
            txn = Transaction(
                id=_uid(),
                store_id=store_id,
                pos_id=pos_id,
                customer_cpf=customer_cpf,
                items=items,
                total_value=round(total_value, 2),
                used_club_cpf=used_club_cpf,
                linked_offer_id=linked_offer_id,
                linked_activation_id=linked_activation_id,
                timestamp=now,
            )

            app_state.record_transaction(txn)

            # 6. Broadcast transaction event
            await ws_manager.broadcast(
                "transaction.created",
                txn.model_dump(mode="json"),
            )

            # Also broadcast updated dashboard summary periodically
            if app_state.total_transactions_today % 3 == 0:
                summary = app_state.get_dashboard_summary()
                await ws_manager.broadcast(
                    "dashboard.summary_updated",
                    summary.model_dump(mode="json"),
                )

        except asyncio.CancelledError:
            logger.info("Loop A cancelled")
            break
        except Exception as e:
            logger.error(f"Loop A error: {e}", exc_info=True)
            await asyncio.sleep(1)


# ---------------------------------------------------------------------------
# Loop B — Churn Radar
# ---------------------------------------------------------------------------

MAX_ACTIVE_ALERTS = 8

async def _loop_churn_radar() -> None:
    """Scan for churn risk every 15-20 seconds (adjusted by clock)."""
    logger.info("Loop B (Churn Radar) started")
    while True:
        try:
            base_interval = random.uniform(15.0, 20.0)
            await simulation_clock.sleep(base_interval)

            if simulation_clock.paused:
                continue

            now = datetime.utcnow()

            # Clean up old resolved/expired alerts to keep list manageable
            resolved_ids = [
                aid
                for aid, alert in app_state.churn_alerts.items()
                if alert.status in ("resolvido", "campanha_disparada")
                and (now - alert.created_at).total_seconds() > 120
            ]
            for aid in resolved_ids:
                del app_state.churn_alerts[aid]

            # Count current active alerts
            active_count = sum(
                1 for a in app_state.churn_alerts.values() if a.status == "ativo"
            )

            # Scan customers — pick a subset to avoid overwhelming
            customers_to_scan = random.sample(
                list(app_state.customers.values()),
                min(30, len(app_state.customers)),
            )

            for customer in customers_to_scan:
                if active_count >= MAX_ACTIVE_ALERTS:
                    break

                for category, last_purchase_dt in customer.last_purchase_by_category.items():
                    if active_count >= MAX_ACTIVE_ALERTS:
                        break

                    days_since = (now - last_purchase_dt).total_seconds() / 86400.0
                    avg_cycle = customer.avg_cycle_days_by_category.get(category, 10.0)
                    stddev = customer.stddev_cycle_days_by_category.get(category, 3.0)

                    if stddev <= 0:
                        stddev = 1.0

                    deviation_ratio = (days_since - avg_cycle) / stddev

                    if deviation_ratio > 1.0:
                        # Check if alert already exists for this customer+category
                        existing = any(
                            a.customer_cpf == customer.cpf
                            and a.category == category
                            and a.status == "ativo"
                            for a in app_state.churn_alerts.values()
                        )
                        if existing:
                            continue

                        alert = ChurnAlert(
                            id=_uid(),
                            customer_cpf=customer.cpf,
                            customer_name=customer.name,
                            category=category,
                            days_since_last_purchase=int(days_since),
                            expected_cycle_days=round(avg_cycle, 1),
                            deviation_ratio=round(deviation_ratio, 2),
                            status="ativo",
                            created_at=now,
                        )

                        app_state.churn_alerts[alert.id] = alert
                        active_count += 1

                        # Broadcast churn alert
                        await ws_manager.broadcast(
                            "churn_alert.created",
                            alert.model_dump(mode="json"),
                        )

        except asyncio.CancelledError:
            logger.info("Loop B cancelled")
            break
        except Exception as e:
            logger.error(f"Loop B error: {e}", exc_info=True)
            await asyncio.sleep(2)


# ---------------------------------------------------------------------------
# Loop C — Offer Expiration
# ---------------------------------------------------------------------------

async def _loop_offer_expiration() -> None:
    """Expire stale offers every ~10 seconds (adjusted by clock)."""
    logger.info("Loop C (Offer Expiration) started")
    while True:
        try:
            await simulation_clock.sleep(10.0)

            if simulation_clock.paused:
                continue

            now = datetime.utcnow()

            for offer in list(app_state.offers.values()):
                age_seconds = (now - offer.created_at).total_seconds()

                # "disparada" without activation after ~60s simulated (represents 48h in simulation)
                if offer.status == "disparada" and age_seconds > 60:
                    offer.status = "expirada"

                # "ativada" without redemption after ~120s simulated
                elif offer.status == "ativada" and offer.activated_at:
                    activated_age = (now - offer.activated_at).total_seconds()
                    if activated_age > 120:
                        offer.status = "expirada"

        except asyncio.CancelledError:
            logger.info("Loop C cancelled")
            break
        except Exception as e:
            logger.error(f"Loop C error: {e}", exc_info=True)
            await asyncio.sleep(2)


# ---------------------------------------------------------------------------
# Loop D — Mobile Offer Activations
# ---------------------------------------------------------------------------

async def _loop_mobile_activations() -> None:
    """Simulate real-time mobile app offer activations every 2.5 - 3.5 seconds."""
    logger.info("Loop D (Mobile Activations) started")
    while True:
        try:
            base_interval = random.uniform(2.5, 3.5)
            await simulation_clock.sleep(base_interval)

            if simulation_clock.paused:
                continue

            now = datetime.utcnow()
            store_ids = list(app_state.stores.keys())
            if not store_ids or not app_state.products or not app_state.customers:
                continue

            store_id = random.choice(store_ids)
            store = app_state.stores[store_id]
            customer = random.choice(list(app_state.customers.values()))

            eligible_products = app_state.sponsored_products or list(app_state.products.values())
            product = random.choice(eligible_products)
            sponsor = product.sponsor_brand or random.choice(
                ["Ambev", "Nestlé", "Unilever", "Danone", "Red Bull"]
            )

            # Realistic geodistribution: 42% < 1km, 38% 1-3km, 20% > 3km
            roll = random.random()
            nh_options = STORE_NEIGHBORHOODS.get(
                store_id, [{"name": store.region, "dist": 1.2}]
            )
            if roll < 0.42:
                candidates = [nh for nh in nh_options if nh["dist"] < 1.0]
            elif roll < 0.80:
                candidates = [nh for nh in nh_options if 1.0 <= nh["dist"] <= 3.0]
            else:
                candidates = [nh for nh in nh_options if nh["dist"] > 3.0]

            chosen_nh = random.choice(candidates if candidates else nh_options)
            act_id = f"ACT-{random.randint(1000, 9999)}"
            discount_pct = random.choice([10.0, 15.0, 18.0, 20.0, 25.0])

            act = MobileActivation(
                id=act_id,
                customer_cpf=customer.cpf,
                customer_name=customer.name,
                product_id=product.id,
                product_name=product.name,
                category=product.category,
                sponsor_brand=sponsor,
                discount_pct=discount_pct,
                store_id=store_id,
                store_name=store.name,
                neighborhood=chosen_nh["name"],
                distance_km=chosen_nh["dist"],
                timestamp=now,
            )

            _recent_activations.insert(0, act)
            if len(_recent_activations) > 30:
                _recent_activations.pop()

            # Broadcast activation event
            await ws_manager.broadcast(
                "activation.created",
                act.model_dump(mode="json"),
            )

            # 70% chance to queue for simulated checkout liquidation (cause & effect)
            if random.random() < 0.70:
                _pending_cause_effect_queue.append(act)
                if len(_pending_cause_effect_queue) > 15:
                    _pending_cause_effect_queue.pop(0)

        except asyncio.CancelledError:
            logger.info("Loop D cancelled")
            break
        except Exception as e:
            logger.error(f"Loop D error: {e}", exc_info=True)
            await asyncio.sleep(1)


# ---------------------------------------------------------------------------
# Engine control
# ---------------------------------------------------------------------------

def start_simulation() -> None:
    """Launch all simulation loops as background tasks."""
    loop = asyncio.get_event_loop()
    _tasks.clear()
    _tasks.append(loop.create_task(_loop_transaction_generation()))
    _tasks.append(loop.create_task(_loop_churn_radar()))
    _tasks.append(loop.create_task(_loop_offer_expiration()))
    _tasks.append(loop.create_task(_loop_mobile_activations()))
    logger.info("All simulation loops started")


def stop_simulation() -> None:
    """Cancel all simulation tasks."""
    for task in _tasks:
        task.cancel()
    _tasks.clear()
    logger.info("All simulation loops stopped")


async def create_offer_for_customer(
    customer_cpf: str,
    category: str,
    sponsor_brand: str | None = None,
    discount_pct: float | None = None,
) -> Offer:
    """
    Create and dispatch a new offer for a customer.
    Used by the churn campaign trigger and automatic generation.
    """
    # Find a sponsor brand for this category if not specified
    if sponsor_brand is None:
        sponsored = [
            p
            for p in app_state.sponsored_products
            if p.category == category and p.sponsor_brand
        ]
        if sponsored:
            sponsor_brand = sponsored[0].sponsor_brand or "Parceiro"
        else:
            sponsor_brand = "Parceiro"

    if discount_pct is None:
        discount_pct = random.choice([10.0, 12.0, 15.0, 18.0, 20.0])

    offer = Offer(
        id=_uid(),
        customer_cpf=customer_cpf,
        category=category,
        sponsor_brand=sponsor_brand,
        discount_pct=discount_pct,
        status="disparada",
        created_at=datetime.utcnow(),
    )

    app_state.offers[offer.id] = offer

    # Update store counts (assign to a random store for tracking)
    store_ids = list(app_state.stores.keys())
    if store_ids:
        store = app_state.stores[random.choice(store_ids)]
        store.active_offers_count += 1

    # Broadcast to all connected clients
    await ws_manager.broadcast("offer.created", offer.model_dump(mode="json"))

    return offer


async def simulate_purchase_for_customer(customer_cpf: str) -> Transaction | None:
    """
    Force an immediate transaction for a specific customer.
    Used by the "Simular Compra Agora" button in the App Cliente.
    """
    customer = app_state.customers.get(customer_cpf)
    if not customer:
        return None

    now = datetime.utcnow()
    store_id = random.choice(list(app_state.stores.keys()))

    # Build a cart from 2-4 products
    all_products = list(app_state.products.values())
    selected = random.sample(all_products, min(random.randint(2, 4), len(all_products)))

    items: list[TransactionItem] = []
    cart_categories: set[str] = set()
    total_value = 0.0

    for prod in selected:
        qty = random.randint(1, 3)
        items.append(
            TransactionItem(product_id=prod.id, qty=qty, unit_price=prod.price)
        )
        total_value += prod.price * qty
        cart_categories.add(prod.category)

    linked_offer_id: str | None = None
    discount_amount = 0.0

    # Check for activated offers
    customer_offers = [
        o
        for o in app_state.offers.values()
        if o.customer_cpf == customer_cpf
        and o.status == "ativada"
        and o.category in cart_categories
    ]

    if customer_offers:
        offer = customer_offers[0]
        for item in items:
            product = app_state.products.get(item.product_id)
            if product and product.category == offer.category:
                item_discount = item.unit_price * item.qty * (offer.discount_pct / 100.0)
                discount_amount += item_discount
                total_value -= item_discount

        avg_ticket = (
            customer.total_spent / customer.purchase_count
            if customer.purchase_count > 0
            else total_value
        )
        incremental = max(0.0, total_value - avg_ticket)

        offer.status = "resgatada"
        offer.redeemed_at = now
        offer.store_id = store_id
        offer.incremental_value = round(incremental, 2)
        linked_offer_id = offer.id

        app_state.record_offer_redemption(offer, discount_amount)
        await ws_manager.broadcast("offer.redeemed", offer.model_dump(mode="json"))

    txn = Transaction(
        id=_uid(),
        store_id=store_id,
        customer_cpf=customer_cpf,
        items=items,
        total_value=round(total_value, 2),
        used_club_cpf=True,
        linked_offer_id=linked_offer_id,
        timestamp=now,
    )

    app_state.record_transaction(txn)
    await ws_manager.broadcast("transaction.created", txn.model_dump(mode="json"))

    # Broadcast summary update
    summary = app_state.get_dashboard_summary()
    await ws_manager.broadcast("dashboard.summary_updated", summary.model_dump(mode="json"))

    return txn
