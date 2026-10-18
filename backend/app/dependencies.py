import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import config

bearer_scheme = HTTPBearer()


def get_db(request: Request):
    return request.app.state.db


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> int:
    try:
        payload = jwt.decode(
            credentials.credentials, config.JWT_SECRET, algorithms=["HS256"]
        )
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="token tidak valid atau kedaluwarsa")

    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="token tidak valid")
    return user_id