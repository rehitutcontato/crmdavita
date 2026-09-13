"""
Seed data generator for the Davita CRM Prototype.
Creates 6 stores, ~30 products, ~150 customers with retroactive 60-day history
so that avg_cycle_days and stddev_cycle_days are computed from real synthetic data.
"""
from __future__ import annotations

import math
import random
import uuid
from datetime import datetime, timedelta
from typing import Any

from app.models.domain import (
    ChurnAlert,
    Customer,
    Offer,
    Product,
    Store,
    Transaction,
    TransactionItem,
)


def _uid() -> str:
    return uuid.uuid4().hex[:12]


def _masked_cpf(index: int) -> str:
    """Generate a consistently-formatted masked CPF like '123.***.***-45'."""
    a = str(random.randint(100, 999))
    b = str(random.randint(10, 99))
    return f"{a}.***.***-{b}"


# ---------------------------------------------------------------------------
# Stores
# ---------------------------------------------------------------------------

STORES_RAW: list[dict[str, str]] = [
    {"id": "loja-01", "name": "Loja 01 - Centro", "region": "Centro"},
    {"id": "loja-02", "name": "Loja 02 - Jardim São Paulo", "region": "Zona Sul"},
    {"id": "loja-03", "name": "Loja 03 - Zona Norte", "region": "Zona Norte"},
    {"id": "loja-04", "name": "Loja 04 - Vila Industrial", "region": "Zona Leste"},
    {"id": "loja-05", "name": "Loja 05 - Rodovia SP", "region": "Rodovia"},
    {"id": "loja-06", "name": "Loja 06 - Bairro Alto", "region": "Zona Oeste"},
]


def create_stores() -> list[Store]:
    return [
        Store(
            id=s["id"],
            name=s["name"],
            region=s["region"],
            daily_revenue=0.0,
            daily_coupons=0,
            active_offers_count=0,
            redeemed_offers_count=0,
        )
        for s in STORES_RAW
    ]


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------

PRODUCTS_RAW: list[dict[str, Any]] = [
    # Bebidas
    {"name": "Cerveja Brahma Lata 350ml", "category": "bebidas", "price": 3.49, "margin_pct": 22.0, "sponsor_brand": "Ambev"},
    {"name": "Cerveja Skol Lata 350ml", "category": "bebidas", "price": 3.29, "margin_pct": 21.0, "sponsor_brand": "Ambev"},
    {"name": "Red Bull Energy 250ml", "category": "bebidas", "price": 9.99, "margin_pct": 35.0, "sponsor_brand": "Red Bull"},
    {"name": "Refrigerante Coca-Cola 2L", "category": "bebidas", "price": 10.49, "margin_pct": 18.0, "sponsor_brand": None},
    {"name": "Suco Del Valle Uva 1L", "category": "bebidas", "price": 7.89, "margin_pct": 25.0, "sponsor_brand": None},
    # Laticínios
    {"name": "Leite Integral Ninho 1L", "category": "laticínios", "price": 6.49, "margin_pct": 15.0, "sponsor_brand": "Nestlé"},
    {"name": "Iogurte Danone Natural 170g", "category": "laticínios", "price": 3.99, "margin_pct": 28.0, "sponsor_brand": "Danone"},
    {"name": "Queijo Mussarela Fatiado 200g", "category": "laticínios", "price": 12.90, "margin_pct": 20.0, "sponsor_brand": None},
    {"name": "Manteiga Aviação 200g", "category": "laticínios", "price": 8.79, "margin_pct": 18.0, "sponsor_brand": None},
    {"name": "Leite Condensado Moça 395g", "category": "laticínios", "price": 7.49, "margin_pct": 22.0, "sponsor_brand": "Nestlé"},
    # Higiene
    {"name": "Sabonete Dove Original 90g", "category": "higiene", "price": 4.29, "margin_pct": 32.0, "sponsor_brand": "Unilever"},
    {"name": "Shampoo Pantene 400ml", "category": "higiene", "price": 18.90, "margin_pct": 30.0, "sponsor_brand": "P&G"},
    {"name": "Creme Dental Colgate 90g", "category": "higiene", "price": 5.49, "margin_pct": 28.0, "sponsor_brand": None},
    {"name": "Desodorante Rexona Aerosol 150ml", "category": "higiene", "price": 14.99, "margin_pct": 35.0, "sponsor_brand": "Unilever"},
    {"name": "Papel Higiênico Neve 12 rolos", "category": "higiene", "price": 19.90, "margin_pct": 16.0, "sponsor_brand": None},
    # Limpeza
    {"name": "Detergente Ypê 500ml", "category": "limpeza", "price": 2.59, "margin_pct": 20.0, "sponsor_brand": None},
    {"name": "Água Sanitária Qboa 1L", "category": "limpeza", "price": 4.99, "margin_pct": 22.0, "sponsor_brand": None},
    {"name": "Sabão em Pó OMO 1.6kg", "category": "limpeza", "price": 22.90, "margin_pct": 18.0, "sponsor_brand": "Unilever"},
    {"name": "Amaciante Comfort 2L", "category": "limpeza", "price": 16.49, "margin_pct": 24.0, "sponsor_brand": "Unilever"},
    {"name": "Esponja Scotch-Brite 3un", "category": "limpeza", "price": 5.99, "margin_pct": 40.0, "sponsor_brand": None},
    # Hortifruti
    {"name": "Banana Prata kg", "category": "hortifruti", "price": 5.99, "margin_pct": 35.0, "sponsor_brand": None},
    {"name": "Tomate Italiano kg", "category": "hortifruti", "price": 8.49, "margin_pct": 30.0, "sponsor_brand": None},
    {"name": "Alface Crespa un", "category": "hortifruti", "price": 3.49, "margin_pct": 45.0, "sponsor_brand": None},
    {"name": "Batata Inglesa kg", "category": "hortifruti", "price": 6.29, "margin_pct": 28.0, "sponsor_brand": None},
    {"name": "Maçã Fuji kg", "category": "hortifruti", "price": 9.99, "margin_pct": 25.0, "sponsor_brand": None},
    # Mercearia
    {"name": "Arroz Tio João 5kg", "category": "mercearia", "price": 27.90, "margin_pct": 12.0, "sponsor_brand": None},
    {"name": "Feijão Carioca Camil 1kg", "category": "mercearia", "price": 8.49, "margin_pct": 14.0, "sponsor_brand": None},
    {"name": "Óleo de Soja Liza 900ml", "category": "mercearia", "price": 7.29, "margin_pct": 16.0, "sponsor_brand": None},
    {"name": "Macarrão Barilla Penne 500g", "category": "mercearia", "price": 6.99, "margin_pct": 20.0, "sponsor_brand": None},
    {"name": "Café Pilão 500g", "category": "mercearia", "price": 16.90, "margin_pct": 22.0, "sponsor_brand": None},
    {"name": "Nescau 2.0 Achocolatado 400g", "category": "mercearia", "price": 9.49, "margin_pct": 26.0, "sponsor_brand": "Nestlé"},
]


def create_products() -> list[Product]:
    products: list[Product] = []
    for i, p in enumerate(PRODUCTS_RAW):
        products.append(
            Product(
                id=f"prod-{i+1:03d}",
                name=p["name"],
                category=p["category"],
                price=p["price"],
                margin_pct=p["margin_pct"],
                sponsor_brand=p["sponsor_brand"],
            )
        )
    return products


# ---------------------------------------------------------------------------
# Customers (with synthetic 60-day history)
# ---------------------------------------------------------------------------

FIRST_NAMES: list[str] = [
    "Ana", "Bruno", "Carla", "Diego", "Elena", "Fernando", "Gabriela",
    "Hugo", "Isabela", "João", "Karina", "Lucas", "Marina", "Nícolas",
    "Olivia", "Pedro", "Quésia", "Rafael", "Sofia", "Thiago", "Ursula",
    "Vinícius", "Wesley", "Ximena", "Yago", "Zélia", "Amanda", "Breno",
    "Cecília", "Daniel", "Eduarda", "Felipe", "Giovana", "Heitor",
    "Iris", "Júlia", "Kevin", "Laura", "Murilo", "Natália",
]

LAST_NAMES: list[str] = [
    "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira",
    "Almeida", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro",
    "Martins", "Carvalho", "Araújo", "Melo", "Barbosa", "Cardoso",
    "Nascimento", "Moreira", "Pinto", "Correia", "Vieira", "Nunes",
]

CATEGORIES: list[str] = ["bebidas", "laticínios", "higiene", "limpeza", "hortifruti", "mercearia"]

# Typical purchase cycle ranges per category (mean_days, stddev_days)
CATEGORY_CYCLES: dict[str, tuple[float, float]] = {
    "bebidas": (7.0, 2.5),
    "laticínios": (5.0, 1.8),
    "higiene": (21.0, 5.0),
    "limpeza": (18.0, 4.5),
    "hortifruti": (4.0, 1.5),
    "mercearia": (10.0, 3.0),
}


def _generate_purchase_history(
    now: datetime,
    categories_for_customer: list[str],
) -> tuple[
    dict[str, datetime],
    dict[str, float],
    dict[str, float],
    list[datetime],
]:
    """
    Generate synthetic retroactive purchase timestamps for the last 60 days.
    Returns last_purchase_by_category, avg_cycle_days, stddev_cycle_days,
    and a flat list of all purchase timestamps (for total_spent calculation).
    """
    last_purchase: dict[str, datetime] = {}
    avg_cycle: dict[str, float] = {}
    stddev_cycle: dict[str, float] = {}
    all_timestamps: list[datetime] = []

    for cat in categories_for_customer:
        mean_days, std_days = CATEGORY_CYCLES[cat]
        # Generate purchase events going backwards from now
        timestamps: list[datetime] = []
        cursor = now - timedelta(days=random.uniform(0, mean_days * 0.5))  # last purchase
        go_back_limit = now - timedelta(days=60)

        while cursor > go_back_limit:
            timestamps.append(cursor)
            gap = max(1.0, random.gauss(mean_days, std_days))
            cursor = cursor - timedelta(days=gap)

        if len(timestamps) < 2:
            # Ensure at least 2 data points for meaningful stats
            timestamps.append(now - timedelta(days=mean_days + random.uniform(1, 5)))
            timestamps.append(now - timedelta(days=mean_days * 2 + random.uniform(1, 5)))

        timestamps.sort()
        all_timestamps.extend(timestamps)

        # Compute real cycle stats from the synthetic history
        gaps = [
            (timestamps[i + 1] - timestamps[i]).total_seconds() / 86400.0
            for i in range(len(timestamps) - 1)
        ]
        computed_mean = sum(gaps) / len(gaps) if gaps else mean_days
        computed_std = (
            math.sqrt(sum((g - computed_mean) ** 2 for g in gaps) / len(gaps))
            if len(gaps) > 1
            else std_days
        )
        # Ensure stddev is never zero (would cause division by zero in churn radar)
        computed_std = max(computed_std, 0.5)

        last_purchase[cat] = timestamps[-1]  # most recent
        avg_cycle[cat] = round(computed_mean, 2)
        stddev_cycle[cat] = round(computed_std, 2)

    return last_purchase, avg_cycle, stddev_cycle, all_timestamps


def create_customers(now: datetime | None = None) -> list[Customer]:
    """Generate ~150 customers with retroactive purchase history."""
    if now is None:
        now = datetime.utcnow()

    customers: list[Customer] = []
    used_cpfs: set[str] = set()

    for i in range(150):
        # Customer 0 is the designated demo customer for App Cliente
        if i == 0:
            name = "Mariana Oliveira Silva"
            cpf = "342.***.***-89"
        else:
            cpf = _masked_cpf(i)
            while cpf in used_cpfs or cpf == "342.***.***-89":
                cpf = _masked_cpf(i)
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            name = f"{first} {last}"
        used_cpfs.add(cpf)

        # Each customer buys from 3-6 categories (demo customer buys from all 6)
        if i == 0:
            customer_categories = list(CATEGORIES)
        else:
            n_categories = random.randint(3, 6)
            customer_categories = random.sample(CATEGORIES, n_categories)

        last_purchase, avg_cycle, stddev_cycle, all_ts = _generate_purchase_history(
            now, customer_categories
        )

        # Segment assignment based on purchase frequency
        avg_gap = sum(avg_cycle.values()) / len(avg_cycle) if avg_cycle else 15.0
        if avg_gap <= 7:
            segment = "alto_valor"
        elif avg_gap <= 14:
            segment = "regular"
        else:
            segment = "risco_churn"

        # Synthetic total spent
        purchase_count = len(all_ts)
        avg_ticket = random.uniform(45.0, 180.0)
        total_spent = round(purchase_count * avg_ticket, 2)

        customers.append(
            Customer(
                cpf=cpf,
                name=name,
                segment=segment,
                club_member=True,
                last_purchase_by_category=last_purchase,
                avg_cycle_days_by_category=avg_cycle,
                stddev_cycle_days_by_category=stddev_cycle,
                total_spent=total_spent,
                purchase_count=purchase_count,
            )
        )

    return customers


# ---------------------------------------------------------------------------
# Initial Offers, Churn Alerts, and Transactions (Baseline for Section 3 metrics)
# ---------------------------------------------------------------------------

def create_initial_offers(
    customers: list[Customer],
    products: list[Product],
    now: datetime,
) -> list[Offer]:
    """
    Generate initial offers matching the funnel target:
    ~640 disparadas, ~214 ativadas, ~137 resgatadas.
    Also ensures the demo customer has curated offers ready to activate.
    """
    offers: list[Offer] = []
    demo_cust = customers[0]

    # Specific demo offers for Mariana Oliveira (App Cliente)
    demo_offers = [
        Offer(
            id="offer-demo-01",
            customer_cpf=demo_cust.cpf,
            category="bebidas",
            sponsor_brand="Ambev",
            discount_pct=15.0,
            status="disparada",
            created_at=now - timedelta(hours=2),
        ),
        Offer(
            id="offer-demo-02",
            customer_cpf=demo_cust.cpf,
            category="laticínios",
            sponsor_brand="Danone",
            discount_pct=20.0,
            status="disparada",
            created_at=now - timedelta(hours=3),
        ),
        Offer(
            id="offer-demo-03",
            customer_cpf=demo_cust.cpf,
            category="higiene",
            sponsor_brand="Unilever",
            discount_pct=18.0,
            status="ativada",
            created_at=now - timedelta(hours=4),
            activated_at=now - timedelta(hours=1),
        ),
        Offer(
            id="offer-demo-04",
            customer_cpf=demo_cust.cpf,
            category="limpeza",
            sponsor_brand="Unilever",
            discount_pct=15.0,
            status="resgatada",
            created_at=now - timedelta(hours=6),
            activated_at=now - timedelta(hours=5),
            redeemed_at=now - timedelta(hours=3),
            store_id="loja-01",
            incremental_value=28.50,
        ),
    ]
    offers.extend(demo_offers)

    # Categories and sponsor brands map
    sponsors_by_cat: dict[str, list[str]] = {
        "bebidas": ["Ambev", "Red Bull"],
        "laticínios": ["Danone", "Nestlé"],
        "higiene": ["Unilever", "P&G"],
        "limpeza": ["Unilever"],
        "hortifruti": ["Produtor Parceiro"],
        "mercearia": ["Nestlé"],
    }

    # Generate remaining offers across customers to reach targets:
    # Target totals: disparadas total: 640
    # of which:
    # ativadas: 214 total (77 still in ativada + 137 in resgatada)
    # resgatadas: 137
    # expiradas: 43
    # disparadas puras (not yet activated): 640 - 77 - 137 - 43 = 383
    
    # We already have: 2 disparadas, 1 ativada, 1 resgatada from demo
    remaining_resgatadas = 136
    remaining_ativadas = 76
    remaining_expiradas = 43
    remaining_disparadas = 381

    # Resgatadas (target incremental revenue ~R$ 18,230; industry volume ~R$ 9,410)
    for i in range(remaining_resgatadas):
        cust = customers[(i + 1) % len(customers)]
        cat = random.choice(CATEGORIES)
        brand = random.choice(sponsors_by_cat.get(cat, ["Parceiro Davita"]))
        created = now - timedelta(hours=random.uniform(4, 10))
        act = created + timedelta(minutes=random.uniform(10, 60))
        red = act + timedelta(minutes=random.uniform(20, 120))
        # Loja 02 gets 30 redeemed promotions
        if i < 30:
            store_id = "loja-02"
        else:
            store_id = f"loja-{random.randint(1, 6):02d}"
        inc = round(random.uniform(115.0, 150.0), 2)
        offers.append(
            Offer(
                id=f"offer-seed-r-{i+1:04d}",
                customer_cpf=cust.cpf,
                category=cat,
                sponsor_brand=brand,
                discount_pct=random.choice([10.0, 12.0, 15.0, 18.0, 20.0]),
                status="resgatada",
                created_at=created,
                activated_at=act,
                redeemed_at=red,
                store_id=store_id,
                incremental_value=inc,
            )
        )

    # Ativadas (not yet redeemed) - Loja 02 gets 28 active promos (total 58)
    for i in range(remaining_ativadas):
        cust = customers[(i + 15) % len(customers)]
        cat = random.choice(CATEGORIES)
        brand = random.choice(sponsors_by_cat.get(cat, ["Parceiro Davita"]))
        created = now - timedelta(hours=random.uniform(2, 6))
        act = created + timedelta(minutes=random.uniform(15, 60))
        store_id = "loja-02" if i < 28 else f"loja-{random.randint(1, 6):02d}"
        offers.append(
            Offer(
                id=f"offer-seed-a-{i+1:04d}",
                customer_cpf=cust.cpf,
                category=cat,
                sponsor_brand=brand,
                discount_pct=random.choice([10.0, 12.0, 15.0, 18.0, 20.0]),
                status="ativada",
                created_at=created,
                activated_at=act,
                store_id=store_id,
            )
        )

    # Expiradas
    for i in range(remaining_expiradas):
        cust = customers[(i + 30) % len(customers)]
        cat = random.choice(CATEGORIES)
        brand = random.choice(sponsors_by_cat.get(cat, ["Parceiro Davita"]))
        created = now - timedelta(hours=random.uniform(24, 72))
        offers.append(
            Offer(
                id=f"offer-seed-e-{i+1:04d}",
                customer_cpf=cust.cpf,
                category=cat,
                sponsor_brand=brand,
                discount_pct=random.choice([10.0, 15.0, 20.0]),
                status="expirada",
                created_at=created,
            )
        )

    # Disparadas (pending activation)
    for i in range(remaining_disparadas):
        cust = customers[(i + 50) % len(customers)]
        cat = random.choice(CATEGORIES)
        brand = random.choice(sponsors_by_cat.get(cat, ["Parceiro Davita"]))
        created = now - timedelta(hours=random.uniform(0.5, 4))
        offers.append(
            Offer(
                id=f"offer-seed-d-{i+1:04d}",
                customer_cpf=cust.cpf,
                category=cat,
                sponsor_brand=brand,
                discount_pct=random.choice([10.0, 12.0, 15.0, 18.0, 20.0]),
                status="disparada",
                created_at=created,
            )
        )

    return offers


def create_initial_churn_alerts(
    customers: list[Customer],
    now: datetime,
) -> list[ChurnAlert]:
    """
    Generate initial churn alerts:
    6 active alerts (including one for the demo customer so it can be tested live!),
    plus 11 previously triggered retention campaigns for historical count.
    """
    alerts: list[ChurnAlert] = []
    demo_cust = customers[0]

    # Active alert for demo customer: category "hortifruti"
    alerts.append(
        ChurnAlert(
            id="churn-demo-01",
            customer_cpf=demo_cust.cpf,
            customer_name=demo_cust.name,
            category="hortifruti",
            days_since_last_purchase=9,
            expected_cycle_days=4.0,
            deviation_ratio=2.15,
            status="ativo",
            created_at=now - timedelta(minutes=45),
        )
    )

    # 5 more active alerts for other customers
    active_configs = [
        ("laticínios", 14, 5.0, 2.45),
        ("bebidas", 19, 7.0, 2.30),
        ("limpeza", 38, 18.0, 1.85),
        ("higiene", 42, 21.0, 1.62),
        ("mercearia", 22, 10.0, 1.40),
    ]

    for i, (cat, days, cycle, dev) in enumerate(active_configs):
        c = customers[i + 1]
        alerts.append(
            ChurnAlert(
                id=f"churn-active-{i+1:02d}",
                customer_cpf=c.cpf,
                customer_name=c.name,
                category=cat,
                days_since_last_purchase=days,
                expected_cycle_days=cycle,
                deviation_ratio=dev,
                status="ativo",
                created_at=now - timedelta(minutes=random.randint(15, 120)),
            )
        )

    # 11 past alerts with triggered campaigns today
    for i in range(11):
        c = customers[i + 10]
        cat = random.choice(CATEGORIES)
        alerts.append(
            ChurnAlert(
                id=f"churn-past-{i+1:02d}",
                customer_cpf=c.cpf,
                customer_name=c.name,
                category=cat,
                days_since_last_purchase=random.randint(12, 35),
                expected_cycle_days=7.0,
                deviation_ratio=round(random.uniform(1.3, 2.5), 2),
                status="campanha_disparada",
                created_at=now - timedelta(hours=random.uniform(2, 7)),
            )
        )

    return alerts


def create_initial_transactions(
    stores: list[Store],
    products: list[Product],
    customers: list[Customer],
    offers: list[Offer],
    now: datetime,
) -> list[Transaction]:
    """
    Generate ~1042 baseline transactions for today so the dashboard
    starts with realistic figures (faturamento ~R$ 128k, cupons ~1042).
    """
    transactions: list[Transaction] = []
    resgatadas = [o for o in offers if o.status == "resgatada"]

    # Target: 1042 transactions total
    # 137 of them linked to the 137 redeemed offers
    total_txns_target = 1042
    
    # Store distribution weights (Loja 02 gets the most)
    store_weights = {
        "loja-01": 0.22,  # Centro
        "loja-02": 0.26,  # Jardim São Paulo (top store)
        "loja-03": 0.16,  # Zona Norte
        "loja-04": 0.14,  # Vila Industrial
        "loja-05": 0.12,  # Rodovia SP
        "loja-06": 0.10,  # Bairro Alto
    }

    # Find the Leite product to make it the best-selling product (~341 units)
    leite_prod = next((p for p in products if "Leite Integral" in p.name), products[0])

    # 1. Transactions with redeemed offers (ticket average ~R$ 96.55)
    for i, off in enumerate(resgatadas):
        store_id = off.store_id or f"loja-{random.randint(1, 6):02d}"
        matching_prods = [p for p in products if p.category == off.category]
        other_prods = [p for p in products if p.category != off.category]
        cart_prods = random.sample(matching_prods, min(2, len(matching_prods))) + random.sample(other_prods, 2)
        
        # Add Leite to ~30% of carts
        if i % 3 == 0 and leite_prod not in cart_prods:
            cart_prods.append(leite_prod)

        items: list[TransactionItem] = []
        for p in cart_prods:
            qty = 2 if p.id == leite_prod.id else random.randint(1, 2)
            unit_p = p.price
            if p.category == off.category:
                unit_p = round(unit_p * (1.0 - off.discount_pct / 100.0), 2)
            items.append(TransactionItem(product_id=p.id, qty=qty, unit_price=unit_p))
        
        target_val = round(random.uniform(92.0, 101.5), 2)

        transactions.append(
            Transaction(
                id=f"txn-seed-off-{i+1:04d}",
                store_id=store_id,
                customer_cpf=off.customer_cpf,
                items=items,
                total_value=target_val,
                used_club_cpf=True,
                linked_offer_id=off.id,
                timestamp=off.redeemed_at or (now - timedelta(hours=random.uniform(1, 6))),
            )
        )

    # 2. Remaining transactions without offer
    # Target: average ticket sem oferta ~R$ 82.10
    remaining_count = total_txns_target - len(transactions)
    store_ids = list(store_weights.keys())
    weights = [store_weights[sid] for sid in store_ids]

    for i in range(remaining_count):
        store_id = random.choices(store_ids, weights=weights, k=1)[0]
        used_cpf = random.random() < 0.68
        cust = random.choice(customers) if used_cpf else None
        
        n_items = random.randint(2, 4)
        cart_prods = random.sample(products, n_items)
        # Frequently add Leite to reach ~341 total units sold
        if i < 180 and leite_prod not in cart_prods:
            cart_prods.append(leite_prod)

        items: list[TransactionItem] = []
        for p in cart_prods:
            qty = 1 if p.id != leite_prod.id else random.randint(1, 2)
            items.append(TransactionItem(product_id=p.id, qty=qty, unit_price=p.price))

        val = round(random.uniform(74.0, 90.0), 2)  # ~82.10 average
        t_time = now - timedelta(hours=random.uniform(0.1, 8.0))

        transactions.append(
            Transaction(
                id=f"txn-seed-{i+1:04d}",
                store_id=store_id,
                customer_cpf=cust.cpf if cust else None,
                items=items,
                total_value=val,
                used_club_cpf=used_cpf,
                linked_offer_id=None,
                timestamp=t_time,
            )
        )


    transactions.sort(key=lambda t: t.timestamp)
    return transactions



# ---------------------------------------------------------------------------
# Full seed bundle
# ---------------------------------------------------------------------------

class SeedData:
    """Container for all seed data."""

    def __init__(self) -> None:
        now = datetime.utcnow()
        self.stores: list[Store] = create_stores()
        self.products: list[Product] = create_products()
        self.customers: list[Customer] = create_customers(now)
        self.products_by_category: dict[str, list[Product]] = {}
        for p in self.products:
            self.products_by_category.setdefault(p.category, []).append(p)
        self.sponsored_products: list[Product] = [
            p for p in self.products if p.sponsor_brand is not None
        ]

        # Generate realistic baseline state
        self.offers: list[Offer] = create_initial_offers(self.customers, self.products, now)
        self.churn_alerts: list[ChurnAlert] = create_initial_churn_alerts(self.customers, now)
        self.transactions: list[Transaction] = create_initial_transactions(
            self.stores, self.products, self.customers, self.offers, now
        )

    @property
    def demo_customer(self) -> Customer:
        """First customer is used as the demo customer in the App Cliente."""
        return self.customers[0]

