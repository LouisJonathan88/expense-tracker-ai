import asyncpg
from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user_id,get_db
from app.repositories import user_repository
from app.schemas import GoogleLoginRequest, TokenResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/google", response_model=TokenResponse)
async def google_login(
    body: GoogleLoginRequest, pool: asyncpg.Pool = Depends(get_db)
):
    try:
        info = await auth_service.verify_google_token(body.id_token)
    except auth_service.InvalidGoogleToken:
        raise HTTPException(status_code=401, detail="token Google tidak valid")

    if not info.get("email_verified"):
        raise HTTPException(status_code=401, detail="email Google belum terverifikasi")

    user = await user_repository.upsert_google_user(
        pool,
        google_id=info["sub"],
        email=info["email"],
        name=info.get("name", info["email"]),
    )
    token = auth_service.create_access_token(user["id"])
    return TokenResponse(access_token=token)

@router.get("/me")
async def me(
    user_id: int = Depends(get_current_user_id),
    pool: asyncpg.Pool = Depends(get_db),
):
    user = await user_repository.get_user_by_id(pool, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="user tidak ditemukan")
    return dict(user)