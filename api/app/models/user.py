from app.extensions import db
from app.models.time import utcnow

ROLE_USER = "user"
ROLE_GUARDIAN = "guardian"


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(254), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(60), nullable=False)
    full_name = db.Column(db.String(80), nullable=False)
    role = db.Column(db.String(10), nullable=False)
    phone_encrypted = db.Column(db.Text)
    invite_code = db.Column(db.String(8), unique=True, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)


class GuardianLink(db.Model):
    __tablename__ = "guardian_links"
    __table_args__ = (db.UniqueConstraint("guardian_id", "user_id"),)

    id = db.Column(db.Integer, primary_key=True)
    guardian_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
