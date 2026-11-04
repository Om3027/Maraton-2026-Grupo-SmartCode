from flask import Blueprint, g

from app.controllers.auth_guard import require_auth
from app.extensions import limiter
from app.services import auth_service, security
from app.views import serializers, validators as v

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.post("/register")
@limiter.limit("10 per minute")
def register():
    data = v.json_body()
    user = auth_service.register(
        email=v.email(data),
        password=v.password(data),
        full_name=v.text(data, "full_name", 2, 80),
        role=v.role(data),
        phone=v.optional_phone(data),
    )
    return _session(user), 201


@bp.post("/login")
@limiter.limit("5 per minute")
def login():
    data = v.json_body()
    email = data.get("email")
    password = data.get("password")
    if not isinstance(email, str) or not isinstance(password, str) or len(password) > 72:
        raise v.invalid("Escribe tu correo y tu contraseña.")
    user = auth_service.authenticate(email.strip().lower(), password)
    return _session(user)


@bp.get("/me")
@require_auth()
def me():
    return serializers.user_private(g.user)


def _session(user):
    return {"token": security.create_token(user), "user": serializers.user_private(user)}
