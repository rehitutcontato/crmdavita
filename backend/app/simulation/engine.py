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


def _uid() -> str:
    return uuid.uuid4().hex[:12]


# ---------------------------------------------------------------------------
# Loop A — Transaction Generation
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

            # 1. Pick a random store
            store_ids = list(app_state.stores.keys())
            store_id = random.choice(store_ids)

            # 2. Pick 1-5 products for the cart
            all_products = list(app_state.products.values())
            n_items = random.randint(1, 5)
            selected_products = random.sample(
                all_products, min(n_items, len(all_products))
            )

            items: list[TransactionItem] = []
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
            customer_cpf: str | None = None
            linked_offer_id: str | None = None
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
                    offer = customer_offers[0]  # redeem the first matching offer

                    # Apply discount to items in that category
                    for item in items:
                        product = app_state.products.get(item.product_id)
                        if product and product.category == offer.category:
                            item_discount = item.unit_price * item.qty * (offer.discount_pct / 100.0)
                            discount_amount += item_discount
                            total_value -= item_discount

                    # Compute incremental value
                    avg_ticket = (
                        customer.total_spent / customer.purchase_count
                        if customer.purchase_count > 0
                        else total_value
                    )
                    incremental = max(0.0, total_value - avg_ticket)

                    # Mark offer as redeemed
                    offer.status = "resgatada"
                    offer.redeemed_at = now
                    offer.store_id = store_id
                    offer.incremental_value = round(incremental, 2)
                    linked_offer_id = offer.id

                    # Record redemption in state
                    app_state.record_offer_redemption(offer, discount_amount)

                    # Broadcast offer redemption event
                    await ws_manager.broadcast(
                        "offer.redeemed",
                        offer.model_dump(mode="json"),
                    )

            # 5. Create and persist the transaction
            txn = Transaction(
                id=_uid(),
                store_id=store_id,
                customer_cpf=customer_cpf,
                items=items,
                total_value=round(total_value, 2),
                used_club_cpf=used_club_cpf,
                linked_offer_id=linked_offer_id,
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
# Engine control
# ---------------------------------------------------------------------------

def start_simulation() -> None:
    """Launch all three simulation loops as background tasks."""
    loop = asyncio.get_event_loop()
    _tasks.clear()
    _tasks.append(loop.create_task(_loop_transaction_generation()))
    _tasks.append(loop.create_task(_loop_churn_radar()))
    _tasks.append(loop.create_task(_loop_offer_expiration()))
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
