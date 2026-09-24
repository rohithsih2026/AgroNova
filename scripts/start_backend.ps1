$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location (Join-Path $Root "backend")
python -m uvicorn app.main:app --reload --port 8000
