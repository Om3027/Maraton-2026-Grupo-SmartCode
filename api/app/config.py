import os

DEV_SECRET_KEY = "dev-only-secret-key-change-me"


def database_url():
    url = os.environ.get("DATABASE_URL")
    if not url:
        return "sqlite:///./local.db"
    for prefix in ("postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


def secret_key():
    return os.environ.get("SECRET_KEY", DEV_SECRET_KEY)
