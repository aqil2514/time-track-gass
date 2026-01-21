# Test upload image to timetrack backend

$API_URL = "http://localhost:8080/api/v1"
$EMAIL = "pile@timetrack.local"
$PASSWORD = "Kerja123!"
$IMAGE_FILE = "image.txt"

# Read image data (assuming base64)
$imageData = Get-Content $IMAGE_FILE -Raw

# 1. Login to get token
Write-Host "Login..."
$loginBody = @{
    email = $EMAIL
    password = $PASSWORD
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.data.token
Write-Host "Token: $token"

# 2. Upload image
Write-Host "Uploading image..."
$uploadBody = @{
    image = $imageData
} | ConvertTo-Json

$headers = @{
    Authorization = "Bearer $token"
}

$uploadResponse = Invoke-RestMethod -Uri "$API_URL/activities/upload" -Method Post -Body $uploadBody -ContentType "application/json" -Headers $headers
Write-Host "Upload response: $($uploadResponse | ConvertTo-Json -Depth 10)"
