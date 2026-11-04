from functools import wraps

from flask import g, request

from app.services import auth_service
from app.services.errors import ServiceError


def require_auth(role=None):
    """Loads the user from the Bearer JWT into g.user and optionally enforces a role."""

    def decorator(view):
        @wraps(view)
        def wrapper(*args, **kwargs):
            header = request.headers.get("Authorization", "")
            token = header[7:] if header.startswith("Bearer ") else ""
            user = auth_service.user_from_token(token) if token else None
            if not user:
                raise ServiceError(401, "Tu sesión expiró. Inicia sesión de nuevo.")
            if role and user.role != role:
                raise ServiceError(403, "Tu tipo de cuenta no puede hacer esta acción.")
            g.user = user
            return view(*args, **kwargs)

        return wrapper

    return decorator
