from tests.conftest import TEST_PASSWORD, login, register

ACCESS_TOKEN_LIFETIME_SECONDS = 60 * 60


def test_register_returns_public_user_with_lowercased_email(client):
    response = register(client, "Misty@Example.com")

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "misty@example.com"
    assert set(body) == {"id", "email"}


def test_register_rejects_duplicate_email_case_insensitively(client):
    register(client, "brock@example.com")

    response = register(client, "BROCK@example.com")

    assert response.status_code == 409


def test_register_validates_email_and_password_length(client):
    assert register(client, "not-an-email").status_code == 422
    assert register(client, "gary@example.com", password="short").status_code == 422


def test_login_returns_bearer_token(client):
    register(client, "may@example.com")

    response = login(client, "MAY@example.com")

    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    assert response.json()["access_token"]


def test_login_gives_the_same_error_for_unknown_email_and_wrong_password(client):
    register(client, "dawn@example.com")

    wrong_password = login(client, "dawn@example.com", password="WrongPassword")
    unknown_email = login(client, "nobody@example.com", password=TEST_PASSWORD)

    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json()


def test_protected_routes_require_a_token(client):
    assert client.get("/api/pokemon").status_code == 401


def test_invalid_token_is_rejected(client):
    response = client.get("/api/pokemon", headers={"Authorization": "Bearer not-a-jwt"})

    assert response.status_code == 401


def test_token_expires_after_its_lifetime(client, auth_headers, clock):
    clock.advance(ACCESS_TOKEN_LIFETIME_SECONDS + 1)

    response = client.get("/api/pokemon", headers=auth_headers)

    assert response.status_code == 401


def test_logout_revokes_the_token(client, auth_headers):
    assert client.post("/auth/logout", headers=auth_headers).status_code == 204

    response = client.get("/api/pokemon", headers=auth_headers)

    assert response.status_code == 401
    assert response.json()["detail"] == "Token has been revoked"
