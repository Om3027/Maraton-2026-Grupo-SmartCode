import pytest

from app.extensions import db, limiter
from app.factory import create_app

PASSWORD = "Segura123"


@pytest.fixture
def app():
    app = create_app({"SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:", "TESTING": True})
    limiter.reset()
    yield app
    with app.app_context():
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def register(client):
    def _register(email, role="user", phone=None):
        body = {"email": email, "password": PASSWORD, "full_name": "Ana Pérez", "role": role}
        if phone:
            body["phone"] = phone
        response = client.post("/api/auth/register", json=body)
        assert response.status_code == 201, response.json
        return response.json

    return _register


def bearer(session):
    return {"Authorization": f"Bearer {session['token']}"}
