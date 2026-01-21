#!/bin/bash

# Function to kill process by port using PowerShell
kill_port() {
    local port=$1
    echo "Checking port $port..."
    powershell -Command "
        \$ErrorActionPreference = 'SilentlyContinue'
        \$tcp = Get-NetTCPConnection -LocalPort $port
        if (\$tcp) {
            \$pids = \$tcp | Select-Object -ExpandProperty OwningProcess -Unique
            foreach (\$p in \$pids) {
                if (\$p -ne 0) {
                    Write-Host \"Killing PID \$p on port $port\"
                    Stop-Process -Id \$p -Force
                }
            }
        } else {
            Write-Host \"Port $port is free.\"
        }
    "
}

# Cleanup ports first
kill_port 8080
kill_port 3000

# Start Backend
echo "Starting Backend..."
cd backend || exit
go run ./cmd/api/main.go &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "Starting Frontend..."
cd web || exit
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Backend (PID: $BACKEND_PID) and Frontend (PID: $FRONTEND_PID) started."
echo "Press Ctrl+C to stop both."

# Cleanup function
cleanup() {
    echo ""
    echo "Stopping services..."
    # Win32 apps often need taskkill to force kill tree
    taskkill //F //PID $BACKEND_PID //T > /dev/null 2>&1
    taskkill //F //PID $FRONTEND_PID //T > /dev/null 2>&1
    exit
}

# Trap signal
trap cleanup SIGINT

# Wait for processes
wait $FRONTEND_PID
wait $BACKEND_PID
