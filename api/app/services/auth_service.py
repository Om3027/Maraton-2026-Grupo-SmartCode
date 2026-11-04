import secrets

from app.extensions import db
from app.models import User
from app.models.user import ROLE_USER
from app.services import security
from app.services.errors import ServiceError

INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def register(email, password, full_name, role, phone=None):
    if db.session.execute(db.select(User.id).filter_by(email=email)).first():
        raise ServiceError(409, "No fue posible crear la cuenta con esos datos.")
    user = User(
        email=email,
        password_hash=security.hash_password(password),
        full_name=full_name,
        role=role,
        phone_encrypted=security.encrypt(phone) if phone else None,
        invite_code=_new_invite_code() if role == ROLE_USER else None,
    )
    db.session.add(user)
    db.session.commit()
    return user


def authenticate(email, password):
    user = db.session.execute(db.select(User).filter_by(email=email)).scalar_one_or_none()
    if not security.verify_password(password, user.password_hash if user else None):
        raise ServiceError(401, "Correo o contraseña incorrectos.")
    return user


def user_from_token(token):
    payload = security.decode_token(token)
    if not payload:
        return None
    return db.session.get(User, int(payload["sub"]))


def phone_of(user):
    return security.decrypt(user.phone_encrypted) if user.phone_encrypted else None


def _new_invite_code():
    while True:
        code = "".join(secrets.choice(INVITE_ALPHABET) for _ in range(8))
        if not db.session.execute(db.select(User.id).filter_by(invite_code=code)).first():
            return code
