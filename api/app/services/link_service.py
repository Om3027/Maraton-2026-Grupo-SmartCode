from app.extensions import db
from app.models import Alert, GuardianLink, User
from app.models.alert import STATUS_ACTIVE
from app.models.user import ROLE_USER
from app.services.errors import ServiceError


def link_guardian(guardian, invite_code):
    user = db.session.execute(
        db.select(User).filter_by(invite_code=invite_code, role=ROLE_USER)
    ).scalar_one_or_none()
    if not user:
        raise ServiceError(404, "El código de invitación no es válido.")
    if not is_linked(guardian.id, user.id):
        db.session.add(GuardianLink(guardian_id=guardian.id, user_id=user.id))
        db.session.commit()
    return user


def is_linked(guardian_id, user_id):
    query = db.select(GuardianLink.id).filter_by(guardian_id=guardian_id, user_id=user_id)
    return db.session.execute(query).first() is not None


def linked_users(guardian):
    """Linked users paired with a flag telling whether each one has an active alert."""
    active = db.select(Alert.user_id).filter_by(status=STATUS_ACTIVE)
    rows = db.session.execute(
        db.select(User, User.id.in_(active))
        .join(GuardianLink, GuardianLink.user_id == User.id)
        .filter(GuardianLink.guardian_id == guardian.id)
        .order_by(User.full_name)
    ).all()
    return [(user, bool(has_alert)) for user, has_alert in rows]
