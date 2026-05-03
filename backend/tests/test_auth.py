import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User


@pytest.fixture
def login_user(db: Session):
    password = "valid-password"
    user = User(
        email=f"login_{uuid.uuid4()}@example.com",
        password_hash=hash_password(password),
        full_name="Login User",
        role="faculty",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, password


def test_login_valid(client: TestClient, login_user):
    user, password = login_user

    response = client.post(
        "/auth/login",
        json={"email": user.email, "password": password},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["access_token"]
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == user.email


def test_login_wrong_password(client: TestClient, login_user):
    user, _password = login_user

    response = client.post(
        "/auth/login",
        json={"email": user.email, "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_login_unknown_email(client: TestClient):
    response = client.post(
        "/auth/login",
        json={"email": "missing@example.com", "password": "password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_me_authenticated(client: TestClient, login_user):
    user, password = login_user
    login_response = client.post(
        "/auth/login",
        json={"email": user.email, "password": password},
    )
    token = login_response.json()["access_token"]

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["email"] == user.email


def test_me_unauthenticated(client: TestClient):
    response = client.get("/auth/me")

    assert response.status_code == 401
    assert response.json()["detail"] == "Missing or invalid authentication token"
