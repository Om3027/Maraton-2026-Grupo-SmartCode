from flask import Blueprint

bp = Blueprint("health", __name__, url_prefix="/api")


@bp.get("/health")
def health():
    return {"status": "ok"}
