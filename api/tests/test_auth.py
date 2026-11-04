from datetime import datetime, timedelta, timezone

import jwt

from app.extensions import db
from app.models import User
from tests.conftest import PASSWORD, bearer


def test_register_returns_token_and_invite_code(register):
    session = register("ana@example.com")
    assert session["token"]
    assert len(session["user"]["invite_code"]) == 8


def test_guardian_has_no_invite_code(register):
    assert register("papa@example.com", role="guardian")["user"]["invite_code"] is None


def test_password_is_stored_as_bcrypt_hash(app, register):
    register("ana@example.com")
    with app.app_context():
        user = db.session.execute(db.select(User)).scalar_one()
        assert user.password_hash.startswith("$2b$")
        assert PASSWORD not in user.password_hash


def test_phone_is_encrypted_at_rest(app, client, register):
    session = register("ana@example.com", phone="+573001234567")
    with app.app_context():
        stored = db.session.execute(db.select(User)).scalar_one().phone_encrypted
        assert "3001234567" not in stored
    assert client.get("/api/auth/me", headers=bearer(session)).json["phone"] == "+573001234567"


def test_login_ok(client, register):
    register("ana@example.com")
    response = client.post("/api/auth/login", json={"email": "ANA@example.com", "password": PASSWORD})
    assert response.status_code == 200
    assert response.json["token"]


def test_login_error_is_generic(client, register):
    register("ana@example.com")
    wrong_password = client.post("/api/auth/login", json={"email": "ana@example.com", "password": "x1234567"})
    unknown_user = client.post("/api/auth/login", json={"email": "no@example.com", "password": "x1234567"})
    assert wrong_password.status_code == unknown_user.status_code == 401
    assert wrong_password.json == unknown_user.json


def test_login_is_rate_limited(client):
    body = {"email": "ana@example.com", "password": "x1234567"}
    codes = [client.post("/api/auth/login", json=body).status_code for _ in range(6)]
    assert codes[:5] == [401] * 5
    assert codes[5] == 429


def test_duplicate_email_rejected(client, register):
    register("ana@example.com")
    body = {"email": "ana@example.com", "password": PASSWORD, "full_name": "Otra", "role": "user"}
    assert client.post("/api/auth/register", json=body).status_code == 409


def test_register_validates_input(client):
    bad_bodies = [
        {"email": "no-es-correo", "password": PASSWORD, "full_name": "Ana", "role": "user"},
        {"email": "a@example.com", "password": "corta", "full_name": "Ana", "role": "user"},
        {"email": "a@example.com", "password": PASSWORD, "full_name": "Ana", "role": "admin"},
        {"email": "a@example.com", "password": PASSWORD, "full_name": "Ana", "role": "user", "phone": "abc"},
    ]
    for body in bad_bodies:
        assert client.post("/api/auth/register", json=body).status_code == 400
    assert client.post("/api/auth/register", data="no json").status_code == 400


def test_sql_injection_in_login_is_harmless(client, register):
    register("ana@example.com")
    body = {"email": "' OR '1'='1' --", "password": "' OR '1'='1"}
    assert client.post("/api/auth/login", json=body).status_code == 401


def test_requires_token(client):
    assert client.get("/api/auth/me").status_code == 401


def test_tampered_token_rejected(client, register):
    token = register("ana@example.com")["token"]
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}x"}).status_code == 401


def test_expired_token_rejected(app, client, register):
    user_id = register("ana@example.com")["user"]["id"]
    past = datetime.now(timezone.utc) - timedelta(hours=2)
    token = jwt.encode(
        {"sub": str(user_id), "role": "user", "iat": past, "exp": past + timedelta(minutes=60)},
        app.config["SECRET_KEY"],
        algorithm="HS256",
    )
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_token_with_none_algorithm_rejected(client, register):
    user_id = register("ana@example.com")["user"]["id"]
    token = jwt.encode({"sub": str(user_id), "role": "user"}, key=None, algorithm="none")
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401
