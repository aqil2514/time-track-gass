# [ZAI GLM Vision - Simple Image Analysis Script]
# Kirim image.txt ke Z.AI GLM dan minta summary

import os
import json
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path(__file__).parent.parent / "backend" / ".env")

# Config
ZAI_API_KEY = os.getenv("ZAI_API_KEY")
ZAI_BASE_URL = "https://api.z.ai/api/coding/paas/v4/chat/completions"
MODEL = "glm-4.6v"


def analyze_image(data_url: str, prompt: str) -> str:
    """Kirim gambar dan dapatkan analisis dari GLM (OpenAI-compatible format)"""
    response = requests.post(
        ZAI_BASE_URL,
        headers={
            "Authorization": f"Bearer {ZAI_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": MODEL,
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": data_url}},
                    {"type": "text", "text": prompt}
                ]
            }]
        },
        timeout=120
    )
    
    # Debug print payload
    print(f"\n[DEBUG] Python Payload: {json.dumps({
        'model': MODEL,
        'messages': [{
            'role': 'user',
            'content': [
                {'type': 'image_url', 'image_url': {'url': data_url}},
                {'type': 'text', 'text': prompt}
            ]
        }]
    })}")

    response.raise_for_status()
    return response.json().get("choices", [{}])[0].get("message", {}).get("content", "No response")


if __name__ == "__main__":
    # Baca image.txt
    image_path = Path(__file__).parent.parent / "image.txt"
    
    if not image_path.exists():
        print(f"Error: {image_path} tidak ditemukan")
        exit(1)
    
    print(f"Model: {MODEL}")
    print(f"Endpoint: {ZAI_BASE_URL}")
    print("Loading image.txt...")
    
    with open(image_path, "r") as f:
        data_url = f.read().strip()
    
    print("Mengirim ke Z.AI GLM...")
    
    try:
        result = analyze_image(data_url, "Berikan summary singkat isi gambar ini dalam 2-3 kalimat bahasa Indonesia.")
        print(f"\n=== SUMMARY ===\n{result}")
    except Exception as e:
        print(f"Error: {e}")
