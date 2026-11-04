import logging
from pathlib import Path

from flask import Flask, request, send_from_directory
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from app import config
from app.controllers import alerts, auth, health, links
from app.extensions import db, limiter
from app.services.errors import ServiceError

STATIC_DIR = Path(__file__).parent / "static"
log = logging.getLogger(__name__)

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
    "Content-Security-Policy": (
        "default-src 'self'; "
        "script-src 'self' https://maps.googleapis.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https://tile.openstreetmap.org https://*.googleapis.com "
        "https://*.gstatic.com https://*.google.com; "
        "connect-src 'self' https://nominatim.openstreetmap.org https://*.googleapis.com; "
        "frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    ),
}

HTTP_MESSAGES = {
    404: "No encontramos lo que buscas.",
    405: "Esta acción no está permitida.",
    413: "La solicitud es demasiado grande.",
    429: "Hiciste demasiados intentos. Espera un minuto y vuelve a intentarlo.",
}


def create_app(overrides=None):
    app = Flask(__name__, static_folder=None)
    app.config.update(
        SQLALCHEMY_DATABASE_URI=config.database_url(),
        SQLALCHEMY_ENGINE_OPTIONS={"pool_pre_ping": True},
        SECRET_KEY=config.secret_key(),
        MAX_CONTENT_LENGTH=16 * 1024,
    )
    if overrides:
        app.config.update(overrides)

    db.init_app(app)
    limiter.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": config.cors_origins()}})
    for module in (health, auth, links, alerts):
        app.register_blueprint(module.bp)
    _register_errors(app)
    _register_security_headers(app)
    _register_spa(app)

    with app.app_context():
        db.create_all()
    return app


def _register_errors(app):
    @app.errorhandler(ServiceError)
    def service_error(error):
        return {"error": error.message}, error.status

    @app.errorhandler(HTTPException)
    def http_error(error):
        message = HTTP_MESSAGES.get(error.code, "No pudimos procesar la solicitud.")
        return {"error": message}, error.code

    @app.errorhandler(Exception)
    def unexpected_error(error):
        log.exception("Unhandled error")
        db.session.rollback()
        return {"error": "Ocurrió un problema en el servidor. Intenta de nuevo."}, 500


def _register_security_headers(app):
    @app.after_request
    def add_headers(response):
        response.headers.update(SECURITY_HEADERS)
        if request.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response


def _register_spa(app):
    @app.get("/", defaults={"path": ""})
    @app.get("/<path:path>")
    def spa(path):
        if path.startswith("api/"):
            return {"error": HTTP_MESSAGES[404]}, 404
        if path and (STATIC_DIR / path).is_file():
            return send_from_directory(STATIC_DIR, path)
        if (STATIC_DIR / "index.html").is_file():
            return send_from_directory(STATIC_DIR, "index.html")
        return {"error": HTTP_MESSAGES[404]}, 404
