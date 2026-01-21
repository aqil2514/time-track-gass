$ErrorActionPreference = "Stop"

# Ports to check
$backendPort = 8080
$frontendPort = 3000

# Function to kill process by port
function Kill-ProcessByPort {
    param([int]$port)
    Write-Host "Checking port $port..." -ForegroundColor Cyan
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connections) {
            $pidsToKill = $connections | Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($pidToKill in $pidsToKill) {
                if ($pidToKill -ne 0) {
                    try {
                        $proc = Get-Process -Id $pidToKill -ErrorAction SilentlyContinue
                        if ($proc) {
                            Write-Host "Killing process '$($proc.ProcessName)' (PID: $pidToKill) on port $port" -ForegroundColor Yellow
                            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                        }
                    } catch {
                        Write-Host ("Could not kill PID {0} on port {1}: {2}" -f $pidToKill, $port, $_) -ForegroundColor Red
                    }
                }
            }
        } else {
            Write-Host ("Port {0} is free." -f $port) -ForegroundColor Green
        }
    } catch {
        Write-Host ("Error checking port {0}: {1}" -f $port, $_) -ForegroundColor Red
    }
}

# Kill existing processes
Kill-ProcessByPort $backendPort
Kill-ProcessByPort $frontendPort

# Get script directory
$scriptDir = $PSScriptRoot

# Start Backend
Write-Host "Starting Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend'; go run ./cmd/api/main.go"

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\web'; npm run dev"

Write-Host "Services started in new windows." -ForegroundColor Cyan
