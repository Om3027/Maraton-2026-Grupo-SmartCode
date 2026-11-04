from datetime import timedelta

from app.extensions import db
from app.models import Alert, LocationPoint, User
from app.models.alert import STATUS_ACTIVE, STATUS_CLOSED
from app.models.time import utcnow
from app.services import link_service, security
from app.services.errors import ServiceError

SIGNAL_LOST_AFTER = timedelta(seconds=30)
TRAIL_LENGTH = 30


def start_alert(user):
    """Idempotent: a repeated trigger returns the alert that is already active."""
    alert = _active_alert(user.id)
    if alert:
        return alert
    alert = Alert(user_id=user.id)
    db.session.add(alert)
    db.session.commit()
    return alert


def close_alert(user, alert_id):
    alert = _owned_alert(user, alert_id)
    if alert.status == STATUS_ACTIVE:
        alert.status = STATUS_CLOSED
        alert.closed_at = utcnow()
        db.session.commit()
    return alert


def add_location(user, alert_id, lat, lng):
    alert = _owned_alert(user, alert_id)
    if alert.status != STATUS_ACTIVE:
        raise ServiceError(409, "La alerta ya fue cerrada.")
    point = LocationPoint(alert_id=alert.id, coords_encrypted=security.encrypt(f"{lat},{lng}"))
    db.session.add(point)
    db.session.commit()
    return point


def live_status(viewer, user_id):
    """Latest alert and trail of a user, visible to herself or to a linked guardian."""
    if viewer.id != user_id and not link_service.is_linked(viewer.id, user_id):
        raise ServiceError(403, "No tienes permiso para ver esta información.")
    user = db.session.get(User, user_id)
    alert = db.session.execute(
        db.select(Alert).filter_by(user_id=user_id).order_by(Alert.id.desc()).limit(1)
    ).scalar_one_or_none()
    trail = _trail(alert.id) if alert else []
    return {
        "user": user,
        "alert": alert,
        "trail": trail,
        "signal_lost": _signal_lost(alert, trail),
    }


def _signal_lost(alert, trail):
    if not alert or alert.status != STATUS_ACTIVE:
        return False
    if not trail:
        return utcnow() - alert.started_at > SIGNAL_LOST_AFTER
    return utcnow() - trail[-1]["recorded_at"] > SIGNAL_LOST_AFTER


def _trail(alert_id):
    points = db.session.execute(
        db.select(LocationPoint)
        .filter_by(alert_id=alert_id)
        .order_by(LocationPoint.id.desc())
        .limit(TRAIL_LENGTH)
    ).scalars().all()
    return [_decode_point(p) for p in reversed(points)]


def _decode_point(point):
    lat, lng = security.decrypt(point.coords_encrypted).split(",")
    return {"lat": float(lat), "lng": float(lng), "recorded_at": point.recorded_at}


def _active_alert(user_id):
    return db.session.execute(
        db.select(Alert).filter_by(user_id=user_id, status=STATUS_ACTIVE)
    ).scalar_one_or_none()


def _owned_alert(user, alert_id):
    alert = db.session.get(Alert, alert_id)
    if not alert or alert.user_id != user.id:
        raise ServiceError(404, "No encontramos esa alerta.")
    return alert
