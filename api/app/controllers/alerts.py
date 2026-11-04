from flask import Blueprint, g

from app.controllers.auth_guard import require_auth
from app.extensions import limiter
from app.models.user import ROLE_USER
from app.services import alert_service
from app.views import serializers, validators as v

bp = Blueprint("alerts", __name__, url_prefix="/api")


@bp.post("/alerts")
@require_auth(ROLE_USER)
def start_alert():
    return serializers.alert(alert_service.start_alert(g.user)), 201


@bp.post("/alerts/<int:alert_id>/close")
@require_auth(ROLE_USER)
def close_alert(alert_id):
    return serializers.alert(alert_service.close_alert(g.user, alert_id))


@bp.post("/alerts/<int:alert_id>/locations")
@limiter.limit("30 per minute")
@require_auth(ROLE_USER)
def add_location(alert_id):
    data = v.json_body()
    alert_service.add_location(
        g.user, alert_id, v.coordinate(data, "lat", 90), v.coordinate(data, "lng", 180)
    )
    return {"status": "ok"}, 201


@bp.get("/users/<int:user_id>/live")
@require_auth()
def live(user_id):
    return serializers.live_status(alert_service.live_status(g.user, user_id))
