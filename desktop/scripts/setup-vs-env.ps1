# Setup Visual Studio Build Tools Environment
# This script sets up the environment variables needed for Rust to compile on Windows

$vs2019Path = "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools"
$vs2022BuildPath = "C:\Program Files\Microsoft Visual Studio\2022\BuildTools"
$vs2022CommunityPath = "C:\Program Files\Microsoft Visual Studio\2022\Community"

$vcvarsPath = $null

if (Test-Path "$vs2022BuildPath\VC\Auxiliary\Build\vcvars64.bat") {
    $vcvarsPath = "$vs2022BuildPath\VC\Auxiliary\Build\vcvars64.bat"
    Write-Host "Found Visual Studio 2022 Build Tools" -ForegroundColor Green
} elseif (Test-Path "$vs2022CommunityPath\VC\Auxiliary\Build\vcvars64.bat") {
    $vcvarsPath = "$vs2022CommunityPath\VC\Auxiliary\Build\vcvars64.bat"
    Write-Host "Found Visual Studio 2022 Community" -ForegroundColor Green
} elseif (Test-Path "$vs2019Path\VC\Auxiliary\Build\vcvars64.bat") {
    $vcvarsPath = "$vs2019Path\VC\Auxiliary\Build\vcvars64.bat"
    Write-Host "Found Visual Studio 2019 Build Tools" -ForegroundColor Yellow
    Write-Host "Note: Visual Studio 2022 is recommended for better compatibility" -ForegroundColor Yellow
} else {
    Write-Host "Visual Studio Build Tools not found!" -ForegroundColor Red
    Write-Host "Please install Visual Studio Build Tools 2019 or 2022 with C++ workload" -ForegroundColor Red
    Write-Host "Download from: https://visualstudio.microsoft.com/downloads/" -ForegroundColor Cyan
    return $false
}

# Export the path for use in parent process
$env:VS_ENV_SETUP = $vcvarsPath
Write-Host "Visual Studio environment path: $vcvarsPath" -ForegroundColor Cyan
return $true
