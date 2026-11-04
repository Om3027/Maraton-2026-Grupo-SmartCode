def test_security_headers_present(client):
    headers = client.get("/api/health").headers
    assert headers["X-Content-Type-Options"] == "nosniff"
    assert headers["X-Frame-Options"] == "DENY"
    assert "frame-ancestors 'none'" in headers["Content-Security-Policy"]
    assert "max-age" in headers["Strict-Transport-Security"]


def test_cors_rejects_unknown_origin(client):
    response = client.get("/api/health", headers={"Origin": "https://evil.example"})
    assert "Access-Control-Allow-Origin" not in response.headers


def test_cors_allows_dev_origin(client):
    response = client.get("/api/health", headers={"Origin": "http://localhost:5173"})
    assert response.headers["Access-Control-Allow-Origin"] == "http://localhost:5173"


def test_unknown_api_route_returns_generic_json(client):
    response = client.get("/api/does-not-exist")
    assert response.status_code == 404
    assert response.json == {"error": "No encontramos lo que buscas."}


def test_unexpected_errors_hide_details(app, client):
    @app.get("/api/boom")
    def boom():
        raise RuntimeError("database password is hunter2")

    response = client.get("/api/boom")
    assert response.status_code == 500
    assert "hunter2" not in response.get_data(as_text=True)


def test_oversized_body_rejected(client):
    response = client.post("/api/auth/login", data="x" * 20000, content_type="application/json")
    assert response.status_code == 413


def test_api_responses_are_not_cached(client):
    assert client.get("/api/health").headers["Cache-Control"] == "no-store"
