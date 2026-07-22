import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.dependencies import get_db
from app.models.base import Base
from app.models.category import Category
from app.models.user import User

# Use in-memory SQLite for self-contained, fast testing
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(name="db_session")
def fixture_db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Seed default categories
    default_categories = ["Tools", "Skills", "Outdoors", "Electronics", "Home"]
    for name in default_categories:
        db.add(Category(name=name))
    db.commit()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(name="client")
def fixture_client(db_session):
    return TestClient(app)

# Helper to register and login a user, returning headers with the Bearer token
def get_auth_headers(client, email: str, name: str, password: str = "password123"):
    client.post(
        "/auth/register",
        json={"email": email, "name": name, "password": password}
    )
    login_res = client.post(
        "/auth/login",
        json={"email": email, "password": password}
    )
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_auth_flow(client):
    # 1. Register
    reg_response = client.post(
        "/auth/register",
        json={"email": "alice@example.com", "name": "Alice", "password": "alicepassword"}
    )
    assert reg_response.status_code == 201
    assert "access_token" in reg_response.json()

    # 2. Login
    login_response = client.post(
        "/auth/login",
        json={"email": "alice@example.com", "password": "alicepassword"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    # 3. Me
    headers = {"Authorization": f"Bearer {token}"}
    me_response = client.get("/auth/me", headers=headers)
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "alice@example.com"
    assert me_response.json()["name"] == "Alice"


def test_listings_crud(client):
    alice_headers = get_auth_headers(client, "alice@example.com", "Alice")
    bob_headers = get_auth_headers(client, "bob@example.com", "Bob")

    # 1. Create Listing (Alice)
    listing_data = {
        "title": "Drill Press",
        "description": "Heavy duty bench drill press",
        "type": "item",
        "category_id": 1,  # Tools
        "availability": True
    }
    create_res = client.post("/listings", json=listing_data, headers=alice_headers)
    assert create_res.status_code == 201
    listing = create_res.json()
    assert listing["title"] == "Drill Press"
    assert listing["owner_id"] == 1  # Alice is first user registered

    # 2. Public Read
    get_res = client.get(f"/listings/{listing['id']}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Drill Press"

    # 3. Edit Permission: Bob trying to edit Alice's listing (Forbidden)
    update_data = {"title": "Bob's Drill"}
    edit_res_bob = client.put(f"/listings/{listing['id']}", json=update_data, headers=bob_headers)
    assert edit_res_bob.status_code == 403

    # 4. Edit Permission: Alice editing own listing (Success)
    edit_res_alice = client.put(f"/listings/{listing['id']}", json=update_data, headers=alice_headers)
    assert edit_res_alice.status_code == 200
    assert edit_res_alice.json()["title"] == "Bob's Drill"

    # 5. Delete Permission: Bob trying to delete Alice's listing (Forbidden)
    delete_res_bob = client.delete(f"/listings/{listing['id']}", headers=bob_headers)
    assert delete_res_bob.status_code == 403

    # 6. Delete Permission: Alice deleting own listing (Success)
    delete_res_alice = client.delete(f"/listings/{listing['id']}", headers=alice_headers)
    assert delete_res_alice.status_code == 204


def test_borrow_requests_and_double_booking(client):
    owner_headers = get_auth_headers(client, "owner@example.com", "Owner")
    requester1_headers = get_auth_headers(client, "req1@example.com", "Requester 1")
    requester2_headers = get_auth_headers(client, "req2@example.com", "Requester 2")

    # Create listing
    listing_res = client.post(
        "/listings",
        json={"title": "Lawnmower", "description": "Electric mower", "type": "item", "category_id": 1},
        headers=owner_headers
    )
    listing_id = listing_res.json()["id"]

    # Requester 1 requests Lawnmower for next week
    start1 = date.today() + timedelta(days=2)
    end1 = date.today() + timedelta(days=6)
    
    req1_res = client.post(
        "/requests",
        json={"listing_id": listing_id, "start_date": str(start1), "end_date": str(end1)},
        headers=requester1_headers
    )
    assert req1_res.status_code == 201
    request1_id = req1_res.json()["id"]
    assert req1_res.json()["status"] == "pending"

    # Requester 2 requests overlapping dates (overlaps with request 1 dates, but request 1 is pending, so it should succeed)
    start2 = date.today() + timedelta(days=4)
    end2 = date.today() + timedelta(days=8)
    req2_res = client.post(
        "/requests",
        json={"listing_id": listing_id, "start_date": str(start2), "end_date": str(end2)},
        headers=requester2_headers
    )
    assert req2_res.status_code == 201
    request2_id = req2_res.json()["id"]

    # Owner approves Requester 1 request
    approve_res = client.patch(
        f"/requests/{request1_id}/status",
        json={"status": "approved"},
        headers=owner_headers
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "approved"

    # Now, owner tries to approve Requester 2 request (which overlaps with approved request 1) -> Should reject!
    approve_res_fail = client.patch(
        f"/requests/{request2_id}/status",
        json={"status": "approved"},
        headers=owner_headers
    )
    assert any(w in approve_res_fail.json()["detail"].lower() for w in ["overlap", "booked", "available"])

    # Requester 3 tries to submit a new request that overlaps with approved request 1 -> Should reject immediately!
    requester3_headers = get_auth_headers(client, "req3@example.com", "Requester 3")
    req3_res = client.post(
        "/requests",
        json={"listing_id": listing_id, "start_date": str(start1 + timedelta(days=1)), "end_date": str(end1 - timedelta(days=1))},
        headers=requester3_headers
    )
    assert any(w in req3_res.json()["detail"].lower() for w in ["booked", "available"])


def test_request_state_transitions_and_reviews(client):
    owner_headers = get_auth_headers(client, "owner2@example.com", "Owner 2")
    requester_headers = get_auth_headers(client, "req_review@example.com", "Requester Review")

    # Create listing
    listing_res = client.post(
        "/listings",
        json={"title": "Lawnmower", "description": "Electric mower", "type": "item", "category_id": 1},
        headers=owner_headers
    )
    listing_id = listing_res.json()["id"]

    # Request
    req_res = client.post(
        "/requests",
        json={"listing_id": listing_id, "start_date": str(date.today()), "end_date": str(date.today() + timedelta(days=1))},
        headers=requester_headers
    )
    request_id = req_res.json()["id"]

    # Try reviewing pending request -> Should fail
    review_fail1 = client.post(
        "/reviews",
        json={"request_id": request_id, "rating": 5, "comment": "Excellent!"},
        headers=requester_headers
    )
    assert review_fail1.status_code == 400

    # Owner approves
    client.patch(f"/requests/{request_id}/status", json={"status": "approved"}, headers=owner_headers)
    
    # Owner marks active
    client.patch(f"/requests/{request_id}/status", json={"status": "active"}, headers=owner_headers)

    # Try reviewing active request -> Should fail
    review_fail2 = client.post(
        "/reviews",
        json={"request_id": request_id, "rating": 5, "comment": "Excellent!"},
        headers=requester_headers
    )
    assert review_fail2.status_code == 400

    # Owner marks returned
    client.patch(f"/requests/{request_id}/status", json={"status": "returned"}, headers=owner_headers)

    # Submit review (Success)
    review_success = client.post(
        "/reviews",
        json={"request_id": request_id, "rating": 5, "comment": "Excellent!"},
        headers=requester_headers
    )
    assert review_success.status_code == 201
    assert review_success.json()["rating"] == 5
    assert review_success.json()["comment"] == "Excellent!"

    # Double review check -> Should fail
    review_dup = client.post(
        "/reviews",
        json={"request_id": request_id, "rating": 4, "comment": "Duplicate"},
        headers=requester_headers
    )
    assert review_dup.status_code == 400
