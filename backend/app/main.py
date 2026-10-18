from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.database import create_pool
from app.routers import auth, expenses

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db = await create_pool()
    yield
    await app.state.db.close()

app = FastAPI(lifespan=lifespan)
app.include_router(auth.router)
app.include_router(expenses.router)