# [Script untuk mengirim gambar ke TimeTrack API]
# Script ini melakukan login dan upload screenshot activity
import requests
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8080/api/v1"
EMAIL = "pile@timetrack.local"
PASSWORD = "Kerja123!"
IMAGE_FILE = "image.txt"

def login():
    """Login dan dapatkan token JWT"""
    print(f"[INFO] Logging in as {EMAIL}...")
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": EMAIL, "password": PASSWORD}
    )
    
    if response.status_code != 200:
        print(f"[ERROR] Login failed: {response.status_code}")
        print(response.text)
        sys.exit(1)
    
    data = response.json()
    if not data.get("success"):
        print(f"[ERROR] Login failed: {data}")
        sys.exit(1)
    
    token = data["data"]["token"]
    user = data["data"]["user"]
    print(f"[OK] Logged in as {user['name']} ({user['email']})")
    return token

def read_image():
    """Baca image base64 dari file"""
    print(f"[INFO] Reading image from {IMAGE_FILE}...")
    
    with open(IMAGE_FILE, "r") as f:
        image_data = f.read().strip()
    
    print(f"[OK] Image loaded ({len(image_data)} characters)")
    return image_data

def upload_activity(token, image_data):
    """Upload activity dengan screenshot"""
    print("[INFO] Uploading activity...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "image": image_data,
        "captured_at": datetime.now().isoformat()
    }
    
    response = requests.post(
        f"{BASE_URL}/activity/upload",
        json=payload,
        headers=headers
    )
    
    print(f"[INFO] Response status: {response.status_code}")
    print(f"[INFO] Response: {response.text}")
    
    if response.status_code == 201:
        data = response.json()
        if data.get("success"):
            activity = data["data"]
            print(f"\n[SUCCESS] Activity uploaded!")
            print(f"  - ID: {activity['id']}")
            print(f"  - App: {activity.get('app_name', 'N/A')}")
            print(f"  - Category: {activity.get('category', 'N/A')}")
            print(f"  - AI Status: {activity.get('ai_status', 'N/A')}")
            return True
    
    print("[ERROR] Upload failed!")
    return False

def main():
    # Step 1: Login
    token = login()
    
    # Step 2: Read image
    image_data = read_image()
    
    # Step 3: Upload activity
    success = upload_activity(token, image_data)
    
    if success:
        print("\n✅ Image sent successfully!")
    else:
        print("\n❌ Failed to send image")
        sys.exit(1)

if __name__ == "__main__":
    main()
