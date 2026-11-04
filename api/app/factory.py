from pathlib import Path

from flask import Flask, send_from_directory

from app import config
from app.controllers import health
from app.extensions import db, limiter

STATIC_DIR = Path(__file__).parent / "static"


def create_app(overrides=None):
    app = Flask(__name__, static_folder=None)
    app.config.update(
        SQLALCHEMY_DATABASE_URI=config.database_url(),
        SQLALCHEMY_ENGINE_OPTIONS={"pool_pre_ping": True},
        SECRET_KEY=config.secret_key(),
    )
    if overrides:
        app.config.update(overrides)

    db.init_app(app)
    limiter.init_app(app)
    app.register_blueprint(health.bp)
    _register_spa(app)

    with app.app_context():
        db.create_all()
    return app


def _register_spa(app):
    @app.get("/", defaults={"path": ""})
    @app.get("/<path:path>")
    def spa(path):
        target = STATIC_DIR / path
        if path and target.is_file():
            return send_from_directory(STATIC_DIR, path)
        if (STATIC_DIR / "index.html").is_file():
            return send_from_directory(STATIC_DIR, "index.html")
        return {"error": "No encontrado."}, 404
