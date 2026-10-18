import asyncpg
from app.config import config


async def create_pool() -> asyncpg.Pool:
    dsn = (
        f"postgresql://{config.DB_USER}:{config.DB_PASSWORD}"
        f"@{config.DB_HOST}:{config.DB_PORT}/{config.DB_NAME}"
    )
    pool = await asyncpg.create_pool(dsn)
    return pool