# Test Login & Upload Activity ke Backend
# Backend: http://localhost:8080

import os
import json
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path(__file__).parent.parent / "backend" / ".env")

# Config
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")
API_BASE = f"{BACKEND_URL}/api/v1"

# Test credentials (register dulu jika user belum ada)
TEST_EMAIL = "pile@timetrack.local"
TEST_PASSWORD = "Kerja123!"


def print_json(label, data):
    print(f"\n{'=' * 50}")
    print(f" {label}")
    print(f"{'=' * 50}")
    print(json.dumps(data, indent=2))


def register_user():
    """Register user baru jika belum ada"""
    print("\n[1] REGISTER USER")
    response = requests.post(
        f"{API_BASE}/auth/register",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD, "name": "Test User"},
        timeout=10,
    )

    if response.status_code == 201:
        print_json("Register Success", response.json())
        return True
    elif response.status_code in [400, 409] and (
        "already exists" in response.text.lower()
        or "already registered" in response.text.lower()
    ):
        print("User already exists - proceed to login")
        return True
    else:
        print_json("Register Failed", response.json())
        return False


def login_user():
    """Login dan dapatkan JWT token"""
    print("\n[2] LOGIN")
    response = requests.post(
        f"{API_BASE}/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        timeout=10,
    )

    if response.status_code == 200:
        data = response.json()
        print_json("Login Success", data)
        return data.get("data", {}).get("token")
    else:
        print_json("Login Failed", response.json())
        return None


def get_me(token):
    """Test endpoint /me untuk verifikasi token"""
    print("\n[3] GET USER INFO (Token Verification)")
    response = requests.get(
        f"{API_BASE}/auth/me", headers={"Authorization": f"Bearer {token}"}, timeout=10
    )

    if response.status_code == 200:
        print_json("User Info", response.json())
        return True
    else:
        print_json("Failed", response.json())
        return False


def upload_image(token, image_base64):
    """Upload image untuk activity capture"""
    print("\n[4] UPLOAD IMAGE ACTIVITY")

    payload = {
        "image": image_base64,
        "captured_at": None,  # Gunakan server time
    }

    response = requests.post(
        f"{API_BASE}/activity/upload",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=30,  # AI analysis butuh waktu lebih lama
    )

    if response.status_code == 201:
        print_json("Upload Success", response.json())
        return response.json().get("data")
    else:
        print_json("Upload Failed", response.json())
        return None


def list_activities(token):
    """List semua activities"""
    print("\n[5] LIST ACTIVITIES")
    response = requests.get(
        f"{API_BASE}/activity",
        headers={"Authorization": f"Bearer {token}"},
        params={"page": 1, "per_page": 5},
        timeout=10,
    )

    if response.status_code == 200:
        print_json("Activities", response.json())
        return True
    else:
        print_json("Failed", response.json())
        return False


def load_test_image():
    """Baca image.txt untuk test"""
    image_path = Path(__file__).parent.parent / "image.txt"

    if not image_path.exists():
        print(f"[ERROR] {image_path} tidak ditemukan")
        print("Buat file image.txt dengan isi base64 image")
        return None

    with open(image_path, "r") as f:
        return f.read().strip()


if __name__ == "__main__":
    print(f"""
╔═══════════════════════════════════════════════════════╗
║     TIME TRACK BACKEND - LOGIN & UPLOAD TEST         ║
╚═══════════════════════════════════════════════════════╝

Backend URL: {BACKEND_URL}
Test Email:  {TEST_EMAIL}
    """)

    # 1. Register (atau skip jika sudah ada)
    if not register_user():
        exit(1)

    # 2. Login
    token = login_user()
    if not token:
        exit(1)

    # 3. Verify token dengan /me
    if not get_me(token):
        exit(1)

    # 4. Load test image
    print("\n" + "=" * 50)
    print(" LOAD TEST IMAGE")
    print("=" * 50)
    image_base64 = load_test_image()
    if not image_base64:
        exit(1)

    print(f"Image loaded: {len(image_base64)} chars (base64)")

    # 5. Upload image
    activity = upload_image(token, image_base64)
    if not activity:
        exit(1)

    # 6. List activities untuk verifikasi
    list_activities(token)

    print("\n" + "=" * 50)
    print(" [SUCCESS] ALL TESTS PASSED!")
    print("=" * 50)
