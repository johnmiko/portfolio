#!/usr/bin/env pwsh
# runlocal.ps1 - Start all development servers for the portfolio project
# Usage: .\runlocal.ps1

Write-Host "🚀 Starting Portfolio Development Environment..." -ForegroundColor Cyan

# Get the script directory and parent directory
$portfolioDir = $PSScriptRoot
$parentDir = Split-Path $portfolioDir -Parent
$cribDir = Join-Path $parentDir "crib"
$dotaDir = Join-Path $parentDir "dota"

# Function to start a process in a new window
function Start-DevServer {
    param(
        [string]$Title,
        [string]$WorkingDir,
        [string]$Command,
        [string]$Color = "Green"
    )
    
    Write-Host "  ▸ Starting $Title..." -ForegroundColor $Color
    
    # Start a new PowerShell window with the command
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$WorkingDir'; Write-Host '[$Title] Running in: $WorkingDir' -ForegroundColor $Color; $Command"
}

# Start Portfolio Frontend (Vite dev server)
Start-DevServer -Title "Portfolio Frontend" -WorkingDir $portfolioDir -Command "npm run dev" -Color "Magenta"

# Wait a bit for the first server to initialize
Start-Sleep -Seconds 2

# Start Crib Backend (FastAPI on port 8001)
if (Test-Path $cribDir) {
    $cribPython = Join-Path $cribDir ".venv\Scripts\python.exe"
    
    if (Test-Path $cribPython) {
        Start-DevServer -Title "Crib Backend (8001)" -WorkingDir $cribDir -Command "$cribPython -m uvicorn app:app --reload --port 8001" -Color "Green"
    } else {
        Write-Host "  ⚠ Crib virtual environment not found. Run: cd $cribDir && python -m venv .venv && .venv\Scripts\pip install -r requirements.txt" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠ Crib directory not found at: $cribDir" -ForegroundColor Yellow
}

# Start Dota Backend (FastAPI on port 8000) - Uncomment when ready
if (Test-Path $dotaDir) {
    $dotaPython = Join-Path $dotaDir ".venv\Scripts\python.exe"
    
    if (Test-Path $dotaPython) {
        Start-DevServer -Title "Dota Backend (8000)" -WorkingDir $dotaDir -Command "$dotaPython -m uvicorn app:app --reload --port 8000" -Color "Blue"
    } else {
        Write-Host "  ⚠ Dota virtual environment not found. Run: cd $dotaDir && python -m venv .venv && .venv\Scripts\pip install -r requirements.txt" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠ Dota directory not found at: $dotaDir" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Development servers started!" -ForegroundColor Green
Write-Host ""
Write-Host "  Portfolio Frontend: " -NoNewline; Write-Host "http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Crib Backend:       " -NoNewline; Write-Host "http://localhost:8001/docs" -ForegroundColor Cyan
# Write-Host "  Dota Backend:       " -NoNewline; Write-Host "http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C in each terminal window to stop servers" -ForegroundColor Gray
