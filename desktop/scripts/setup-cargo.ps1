# Setup Cargo PATH for current session
$cargoPath = "$env:USERPROFILE\.cargo\bin"
if (Test-Path $cargoPath) {
    if ($env:Path -notlike "*$cargoPath*") {
        $env:Path += ";$cargoPath"
        Write-Host "Added Cargo to PATH for this session" -ForegroundColor Green
    }
    
    # Verify cargo is available
    $cargoVersion = & cargo --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Cargo found: $cargoVersion" -ForegroundColor Green
        return $true
    }
}

Write-Host "Cargo not found. Please install Rust from https://rustup.rs/" -ForegroundColor Red
return $false
