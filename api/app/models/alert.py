from app.extensions import db
from app.models.time import utcnow

STATUS_ACTIVE = "active"
STATUS_CLOSED = "closed"


class Alert(db.Model):
    __tablename__ = "alerts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    status = db.Column(db.String(10), nullable=False, default=STATUS_ACTIVE)
    started_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    closed_at = db.Column(db.DateTime)


class LocationPoint(db.Model):
    __tablename__ = "location_points"
    __table_args__ = (db.Index("ix_points_alert_time", "alert_id", "recorded_at"),)

    id = db.Column(db.Integer, primary_key=True)
    alert_id = db.Column(db.Integer, db.ForeignKey("alerts.id"), nullable=False)
    coords_encrypted = db.Column(db.Text, nullable=False)
    recorded_at = db.Column(db.DateTime, nullable=False, default=utcnow)
