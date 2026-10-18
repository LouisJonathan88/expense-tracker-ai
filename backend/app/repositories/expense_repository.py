from datetime import date
from decimal import Decimal

import asyncpg

SELECT_BASE = """
    SELECT e.id AS expense_id, e.expense_date, e.adjustment,
           i.id AS item_id, i.item_name, i.price, i.quantity
    FROM expenses e
    JOIN expense_items i ON i.expense_id = e.id
    WHERE e.user_id = $1
"""


def _group_rows(rows: list[asyncpg.Record]) -> list[dict]:
    expenses: dict[int, dict] = {}
    for r in rows:
        exp = expenses.setdefault(
            r["expense_id"],
            {
                "id": r["expense_id"],
                "expense_date": r["expense_date"],
                "adjustment": r["adjustment"],
                "items_total": Decimal(0),
                "total": Decimal(0),
                "items": [],
            },
        )
        subtotal = r["price"] * r["quantity"]
        exp["items"].append(
            {
                "id": r["item_id"],
                "item_name": r["item_name"],
                "price": r["price"],
                "quantity": r["quantity"],
                "subtotal": subtotal,
            }
        )
        exp["items_total"] += subtotal

    result = list(expenses.values())
    for exp in result:
        exp["total"] = exp["items_total"] + exp["adjustment"]
    return result

async def create_expense(
    pool: asyncpg.Pool, user_id: int, expense_date: date, adjustment: Decimal, items: list
) -> int:
    async with pool.acquire() as conn:
        async with conn.transaction():
            expense_id = await conn.fetchval(
                """
                INSERT INTO expenses (user_id, expense_date, adjustment)
                VALUES ($1, $2, $3) RETURNING id
                """,
                user_id,
                expense_date,
                adjustment,
            )
            await conn.executemany(
                """
                INSERT INTO expense_items (expense_id, item_name, price, quantity)
                VALUES ($1, $2, $3, $4)
                """,
                [(expense_id, i.item_name, i.price, i.quantity) for i in items],
            )
    return expense_id

_FILTERS = """
    e.user_id = $1
    AND ($2::date IS NULL OR e.expense_date >= $2)
    AND ($3::date IS NULL OR e.expense_date <= $3)
"""


async def list_expenses(
    pool: asyncpg.Pool,
    user_id: int,
    start: date | None = None,
    end: date | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[dict], int]:
    args = (user_id, start, end)

    total = await pool.fetchval(
        f"SELECT count(*) FROM expenses e WHERE {_FILTERS}", *args
    )

    # Pagination dilakukan pada transaksi, bukan pada baris hasil JOIN
    rows = await pool.fetch(
        f"""
        WITH page AS (
            SELECT e.id FROM expenses e
            WHERE {_FILTERS}
            ORDER BY e.expense_date DESC, e.id DESC
            LIMIT $4 OFFSET $5
        )
        SELECT e.id AS expense_id, e.expense_date, e.adjustment,
               i.id AS item_id, i.item_name, i.price, i.quantity
        FROM page p
        JOIN expenses e ON e.id = p.id
        JOIN expense_items i ON i.expense_id = e.id
        ORDER BY e.expense_date DESC, e.id DESC, i.id
        """,
        *args,
        limit,
        offset,
    )
    return _group_rows(rows), total


async def get_expense(pool: asyncpg.Pool, user_id: int, expense_id: int) -> dict | None:
    rows = await pool.fetch(
        SELECT_BASE + " AND e.id = $2 ORDER BY i.id",
        user_id,
        expense_id,
    )
    grouped = _group_rows(rows)
    return grouped[0] if grouped else None

_EXPENSE_TOTALS = """
    SELECT e.id, e.expense_date,
           e.adjustment + COALESCE(SUM(i.price * i.quantity), 0) AS total
    FROM expenses e
    LEFT JOIN expense_items i ON i.expense_id = e.id
    WHERE e.user_id = $1
      AND ($2::date IS NULL OR e.expense_date >= $2)
      AND ($3::date IS NULL OR e.expense_date <= $3)
    GROUP BY e.id
"""

SUMMARY_QUERIES = {
    "month": f"""
        SELECT date_trunc('month', t.expense_date)::date AS period,
               SUM(t.total) AS total
        FROM ({_EXPENSE_TOTALS}) t
        GROUP BY period
        ORDER BY period DESC
    """,
    "day": f"""
        SELECT t.expense_date AS period,
               SUM(t.total) AS total
        FROM ({_EXPENSE_TOTALS}) t
        GROUP BY period
        ORDER BY period DESC
    """,
}

async def update_expense(
    pool: asyncpg.Pool,
    user_id: int,
    expense_id: int,
    expense_date: date,
    adjustment: Decimal,
    items: list,
) -> bool:
    async with pool.acquire() as conn:
        async with conn.transaction():
            result = await conn.execute(
                """
                UPDATE expenses SET expense_date = $1, adjustment = $2
                WHERE id = $3 AND user_id = $4
                """,
                expense_date,
                adjustment,
                expense_id,
                user_id,
            )
            if result == "UPDATE 0":
                return False

            await conn.execute(
                "DELETE FROM expense_items WHERE expense_id = $1", expense_id
            )
            await conn.executemany(
                """
                INSERT INTO expense_items (expense_id, item_name, price, quantity)
                VALUES ($1, $2, $3, $4)
                """,
                [(expense_id, i.item_name, i.price, i.quantity) for i in items],
            )
    return True

async def delete_expense(pool: asyncpg.Pool, user_id: int, expense_id: int) -> bool:
    result = await pool.execute(
        "DELETE FROM expenses WHERE id = $1 AND user_id = $2", expense_id, user_id
    )
    return result == "DELETE 1"


async def get_summary(
    pool: asyncpg.Pool,
    user_id: int,
    group_by: str,
    start: date | None,
    end: date | None,
) -> list[dict]:
    rows = await pool.fetch(
        SUMMARY_QUERIES[group_by],
        user_id,
        start,
        end,
    )

    return [dict(row) for row in rows]