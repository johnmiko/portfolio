# Development Environment Scripts

This directory contains scripts to easily start all development servers for the portfolio project.

## Windows Usage

### Option 1: PowerShell Script (Recommended)
```powershell
.\runlocal.ps1
```

### Option 2: Batch File
```cmd
runlocal
```

Or simply:
```cmd
.\runlocal.bat
```

## What It Does

The script will start the following servers in separate terminal windows:

1. **Portfolio Frontend** (Vite dev server)
   - Running on: http://localhost:5173
   - Command: `npm run dev`

2. **Crib Backend** (FastAPI)
   - Running on: http://localhost:8001
   - API Docs: http://localhost:8001/docs
   - Command: `uvicorn app:app --reload --port 8001`

3. **Dota Backend** (FastAPI) - *Currently commented out*
   - Will run on: http://localhost:8000
   - Uncomment the dota section in `runlocal.ps1` when ready

## Prerequisites

Before running the script for the first time, ensure:

1. **Portfolio Frontend**: Dependencies installed
   ```bash
   npm install
   ```

2. **Crib Backend**: Virtual environment and dependencies set up
   ```bash
   cd ../crib
   python -m venv .venv
   .venv\Scripts\pip install -r requirements.txt
   ```

3. **Dota Backend**: (When you create it)
   ```bash
   cd ../dota
   python -m venv .venv
   .venv\Scripts\pip install -r requirements.txt
   ```

## Stopping Servers

Press `Ctrl+C` in each terminal window to stop the respective server.

## Troubleshooting

### PowerShell Execution Policy Error

If you get an error about execution policy, run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try running the script again.

### Virtual Environment Not Found

If you see warnings about missing virtual environments, follow the prerequisite steps above for the respective backend.
