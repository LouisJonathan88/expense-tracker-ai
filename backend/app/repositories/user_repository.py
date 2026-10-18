from datetime import date
from decimal import Decimal

import asyncpg

SELECT_BASE = """
    SELECT e.id AS expense_id, e.expense_date,
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
        exp["total"] += subtotal
    return list(expenses.values())


async def create_expense(
    pool: asyncpg.Pool, user_id: int, expense_date: date, items: list
) -> int:
    async with pool.acquire() as conn:
        async with conn.transaction():
            expense_id = await conn.fetchval(
                "INSERT INTO expenses (user_id, expense_date) VALUES ($1, $2) RETURNING id",
                user_id,
                expense_date,
            )
            await conn.executemany(
                """
                INSERT INTO expense_items (expense_id, item_name, price, quantity)
                VALUES ($1, $2, $3, $4)
                """,
                [(expense_id, i.item_name, i.price, i.quantity) for i in items],
            )
    return expense_id


async def list_expenses(pool: asyncpg.Pool, user_id: int) -> list[dict]:
    rows = await pool.fetch(
        SELECT_BASE + " ORDER BY e.expense_date DESC, e.id DESC, i.id",
        user_id,
    )
    return _group_rows(rows)


async def get_expense(pool: asyncpg.Pool, user_id: int, expense_id: int) -> dict | None:
    rows = await pool.fetch(
        SELECT_BASE + " AND e.id = $2 ORDER BY i.id",
        user_id,
        expense_id,
    )
    grouped = _group_rows(rows)
    return grouped[0] if grouped else None

async def upsert_google_user(
    pool: asyncpg.Pool, google_id: str, email: str, name: str
) -> asyncpg.Record:
    return await pool.fetchrow(
        """
        INSERT INTO users (google_id, email, name)
        VALUES ($1, $2, $3)
        ON CONFLICT (google_id)
        DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name
        RETURNING id, google_id, email, name, created_at
        """,
        google_id,
        email,
        name,
    )


async def get_user_by_id(pool: asyncpg.Pool, user_id: int) -> asyncpg.Record | None:
    return await pool.fetchrow(
        "SELECT id, email, name FROM users WHERE id = $1", user_id
    )