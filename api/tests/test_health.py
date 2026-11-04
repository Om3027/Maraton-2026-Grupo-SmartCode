import pytest

from app import factory


def test_health_ok(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json == {"status": "ok"}


@pytest.fixture
def built_frontend(tmp_path, monkeypatch):
    (tmp_path / "index.html").write_text("<div id=\"root\"></div>", encoding="utf-8")
    monkeypatch.setattr(factory, "STATIC_DIR", tmp_path)


def test_test_guide_is_served_by_spa_fallback(client, built_frontend):
    guide = client.get("/guia")
    assert guide.status_code == 200
    assert b'id="root"' in guide.data
    health = client.get("/api/health")
    assert health.json == {"status": "ok"}
    assert client.get("/api/guia").status_code == 404
