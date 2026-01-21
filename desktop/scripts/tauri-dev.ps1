# Tauri Dev Script with Cargo PATH setup
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$setupScript = Join-Path $scriptPath "setup-cargo.ps1"

# Setup cargo PATH
& $setupScript

if ($LASTEXITCODE -ne 0) {
    exit 1
}

# Kill port 1420 before starting
Write-Host "Killing processes on port 1420..." -ForegroundColor Yellow
& pnpm run kill-port

# Important notice
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Tauri Desktop App" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "  - Tauri window will open AUTOMATICALLY" -ForegroundColor Green
Write-Host "  - DO NOT open http://localhost:1420 in browser!" -ForegroundColor Red
Write-Host "  - Use the Tauri window that opens automatically" -ForegroundColor Green
Write-Host ""
Write-Host "Starting Tauri dev server..." -ForegroundColor Cyan
Write-Host ""

# Run tauri dev directly (not through npm script to avoid loop)
& pnpm exec tauri dev
