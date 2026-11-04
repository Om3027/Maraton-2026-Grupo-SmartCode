from flask import Blueprint, g

from app.controllers.auth_guard import require_auth
from app.extensions import limiter
from app.models.user import ROLE_GUARDIAN
from app.services import link_service
from app.views import serializers, validators as v

bp = Blueprint("links", __name__, url_prefix="/api/links")


@bp.post("")
@limiter.limit("5 per minute;30 per day")
@require_auth(ROLE_GUARDIAN)
def create_link():
    user = link_service.link_guardian(g.user, v.invite_code(v.json_body()))
    return serializers.user_public(user), 201


@bp.get("")
@require_auth(ROLE_GUARDIAN)
def list_links():
    return {
        "users": [
            {**serializers.user_public(user), "has_active_alert": has_alert}
            for user, has_alert in link_service.linked_users(g.user)
        ]
    }
