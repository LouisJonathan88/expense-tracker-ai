import asyncio
from datetime import datetime, timedelta, timezone

import jwt
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.config import config


class InvalidGoogleToken(Exception):
    pass


def _verify_google_token(token: str) -> dict:
    try:
        return id_token.verify_oauth2_token(
            token, google_requests.Request(), config.GOOGLE_CLIENT_ID
        )
    except ValueError as e:
        raise InvalidGoogleToken(str(e))


async def verify_google_token(token: str) -> dict:
    return await asyncio.to_thread(_verify_google_token, token)


def create_access_token(user_id: int) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm="HS256")