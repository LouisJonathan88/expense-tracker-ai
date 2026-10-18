import os
from dotenv import load_dotenv

load_dotenv("../.env")

class Config:
    DB_HOST: str = os.getenv("DB_HOST", "")
    DB_USER: str = os.getenv("DB_USER", "")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_NAME: str = os.getenv("DB_NAME", "")
    DB_PORT: str = os.getenv("DB_PORT", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "")
    GEMINI_FALLBACK_MODEL: str = os.getenv("GEMINI_FALLBACK_MODEL", "")

config = Config()

REQUIRED = [
    "DB_HOST",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
    "DB_PORT",
    "JWT_SECRET",
    "GOOGLE_CLIENT_ID",
    "GEMINI_API_KEY",
    "GEMINI_MODEL",
]

missing = [
    name for name in REQUIRED
    if not getattr(config, name)
]

if missing:
    raise RuntimeError(
        f"Variabel wajib diisi: {', '.join(missing)}"
    )