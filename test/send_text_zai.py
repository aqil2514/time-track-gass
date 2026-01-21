# [ZAI GLM Text Analysis Script]
# Script ini mensimulasikan prompt backend untuk generate summary

import os
import json
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path(__file__).parent.parent / "backend" / ".env")

# Config
ZAI_API_KEY = os.getenv("ZAI_API_KEY")
# Menggunakan endpoint yang terbukti berhasil dari test image sebelumnya
ZAI_BASE_URL = "https://api.z.ai/api/coding/paas/v4/chat/completions" 
MODEL = "glm-4.7" # User requested GLM-4.7 (assuming standard naming, or could be 'glm-4-flash' if 4.7 is unavailable)

def build_session_summary_prompt(activity_count: int) -> str:
    """
    Mimics backend/internal/services/ai_service.go buildSessionSummaryPrompt
    """
    return f"""Generate a concise work session summary based on {activity_count} activities.
Provide:
1. A brief overview (1-2 sentences)
2. Main categories worked on
3. Key accomplishments

Respond in JSON format:
{{
  "overview": "brief overview",
  "categories": ["category1", "category2"],
  "key_points": ["accomplishment1", "accomplishment2"]
}}"""

def send_chat_completion(prompt: str) -> dict:
    """Kirim prompt ke Z.AI GLM (OpenAI-compatible format)"""
    headers = {
        "Authorization": f"Bearer {ZAI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.7
    }
    
    print(f"Sending request to {ZAI_BASE_URL}...")
    print(f"Model: {MODEL}")
    
    response = requests.post(
        ZAI_BASE_URL,
        headers=headers,
        json=payload,
        timeout=60
    )
    
    if response.status_code != 200:
        print(f"Error: API returned status {response.status_code}")
        print(response.text)
        response.raise_for_status()
        
    return response.json()

if __name__ == "__main__":
    # 1. Simulate Input Data (Mock Activities)
    # Backend logic uses length of activities slice
    mock_activities_count = 12 
    
    print(f"--- Simulating Backend Prompt for {mock_activities_count} activities ---")
    
    # 2. Build Prompt
    prompt = build_session_summary_prompt(mock_activities_count)
    print(f"\nPrompt Sent:\n{prompt}\n")
    
    # 3. Call API
    try:
        result = send_chat_completion(prompt)
        
        # 4. Parse Response
        choices = result.get("choices", [])
        if not choices:
            print("No choices in response")
        else:
            content = choices[0].get("message", {}).get("content", "")
            print("--- API Response ---")
            print(content)
            
            # Validasi JSON output (karena instruksi prompt minta JSON)
            try:
                # Membersihkan markdown code block jika ada
                clean_content = content.replace("```json", "").replace("```", "").strip()
                parsed_json = json.loads(clean_content)
                print("\n[SUCCESS] Response valid JSON:")
                print(json.dumps(parsed_json, indent=2))
            except json.JSONDecodeError:
                print("\n[WARNING] Response is not valid JSON string directly.")
                
    except Exception as e:
        print(f"\n[ERROR] Failed to run test: {e}")
