import base64
import hashlib
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from cryptography.fernet import Fernet, InvalidToken
from flask import current_app

TOKEN_TTL = timedelta(minutes=60)
JWT_ALGORITHM = "HS256"
_DUMMY_HASH = bcrypt.hashpw(b"timing-equalizer", bcrypt.gensalt()).decode()


def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password, password_hash):
    """Always runs bcrypt so the response time does not reveal whether the account exists."""
    matches = bcrypt.checkpw(password.encode(), (password_hash or _DUMMY_HASH).encode())
    return matches and password_hash is not None


def create_token(user):
    now = datetime.now(timezone.utc)
    payload = {"sub": str(user.id), "role": user.role, "iat": now, "exp": now + TOKEN_TTL}
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm=JWT_ALGORITHM)


def decode_token(token):
    """Returns the payload, or None if the token is invalid, tampered with or expired."""
    try:
        return jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


def _fernet():
    digest = hashlib.sha256(("fernet:" + current_app.config["SECRET_KEY"]).encode()).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def encrypt(text):
    return _fernet().encrypt(text.encode()).decode()


def decrypt(token):
    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken:
        return None
