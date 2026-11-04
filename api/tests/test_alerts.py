from datetime import timedelta

import pytest

from app.extensions import db
from app.models import LocationPoint
from tests.conftest import bearer


@pytest.fixture
def woman(register):
    return register("ana@example.com")


@pytest.fixture
def guardian(client, register, woman):
    session = register("papa@example.com", role="guardian")
    code = woman["user"]["invite_code"]
    assert client.post("/api/links", json={"invite_code": code}, headers=bearer(session)).status_code == 201
    return session


def start(client, session):
    return client.post("/api/alerts", headers=bearer(session)).json["id"]


def send(client, session, alert_id, lat=4.7110, lng=-74.0721):
    return client.post(f"/api/alerts/{alert_id}/locations", json={"lat": lat, "lng": lng}, headers=bearer(session))


def live(client, session, user_id):
    return client.get(f"/api/users/{user_id}/live", headers=bearer(session))


def test_full_alert_flow(client, woman, guardian):
    alert_id = start(client, woman)
    assert send(client, woman, alert_id).status_code == 201
    status = live(client, guardian, woman["user"]["id"]).json
    assert status["alert"]["status"] == "active"
    assert status["last_location"]["lat"] == pytest.approx(4.711)
    assert status["signal_lost"] is False

    assert client.post(f"/api/alerts/{alert_id}/close", headers=bearer(woman)).json["status"] == "closed"
    assert send(client, woman, alert_id).status_code == 409


def test_start_alert_is_idempotent(client, woman):
    assert start(client, woman) == start(client, woman)


def test_guardian_lists_linked_users(client, woman, guardian):
    start(client, woman)
    users = client.get("/api/links", headers=bearer(guardian)).json["users"]
    assert users == [{"id": woman["user"]["id"], "full_name": "Ana Pérez", "role": "user", "has_active_alert": True}]


def test_signal_lost_after_30_seconds(app, client, woman, guardian):
    alert_id = start(client, woman)
    send(client, woman, alert_id)
    with app.app_context():
        point = db.session.execute(db.select(LocationPoint)).scalar_one()
        point.recorded_at -= timedelta(seconds=31)
        db.session.commit()
    status = live(client, guardian, woman["user"]["id"]).json
    assert status["signal_lost"] is True
    assert status["last_location"]["recorded_at"].endswith("Z")


def test_coordinates_encrypted_at_rest(app, client, woman):
    send(client, woman, start(client, woman), lat=4.711, lng=-74.0721)
    with app.app_context():
        stored = db.session.execute(db.select(LocationPoint)).scalar_one().coords_encrypted
        assert "4.711" not in stored and "74.0721" not in stored


def test_unlinked_guardian_cannot_see_location(client, register, woman):
    stranger = register("extrano@example.com", role="guardian")
    assert live(client, stranger, woman["user"]["id"]).status_code == 403


def test_user_cannot_touch_another_users_alert(client, register, woman):
    alert_id = start(client, woman)
    other = register("otra@example.com")
    assert send(client, other, alert_id).status_code == 404
    assert client.post(f"/api/alerts/{alert_id}/close", headers=bearer(other)).status_code == 404


def test_guardian_cannot_start_alert(client, guardian):
    assert client.post("/api/alerts", headers=bearer(guardian)).status_code == 403


def test_user_cannot_link_as_guardian(client, register, woman):
    other = register("otra@example.com")
    body = {"invite_code": woman["user"]["invite_code"]}
    assert client.post("/api/links", json=body, headers=bearer(other)).status_code == 403


def test_invalid_invite_code(client, register):
    session = register("papa@example.com", role="guardian")
    assert client.post("/api/links", json={"invite_code": "ZZZZZZZZ"}, headers=bearer(session)).status_code == 404
    assert client.post("/api/links", json={"invite_code": "x"}, headers=bearer(session)).status_code == 400


@pytest.mark.parametrize("lat,lng", [(91, 0), (0, -181), ("4.7", 0), (True, 0), (None, 0)])
def test_location_validation(client, woman, lat, lng):
    assert send(client, woman, start(client, woman), lat=lat, lng=lng).status_code == 400
