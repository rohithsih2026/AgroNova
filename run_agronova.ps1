$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$Python = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $Python) { $Python = (Get-Command py -ErrorAction SilentlyContinue).Source }
if (-not $Python) { throw "Python 3.10+ was not found. Install Python and try again." }
$Npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (-not $Npm) { throw "npm was not found. Install Node.js 18+ and try again." }

$Venv = Join-Path $Backend ".venv"
$VenvPython = Join-Path $Venv "Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
  Write-Host "Creating Python virtual environment..."
  & $Python -m venv $Venv
}
Write-Host "Installing/checking backend dependencies..."
& $VenvPython -m pip install -r (Join-Path $Backend "requirements.txt")
if (-not (Test-Path (Join-Path $Frontend "node_modules"))) {
  Write-Host "Installing frontend dependencies..."
  Push-Location $Frontend
  try { & $Npm install } finally { Pop-Location }
}

Write-Host "Starting AgroNova API on http://127.0.0.1:8000 ..."
$Api = Start-Process -FilePath $VenvPython -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000") -WorkingDirectory $Backend -PassThru
Write-Host "Starting AgroNova web app on http://127.0.0.1:5173 ..."
$Web = Start-Process -FilePath $Npm -ArgumentList @("run", "dev", "--", "--host", "127.0.0.1") -WorkingDirectory $Frontend -PassThru
Start-Process "http://127.0.0.1:5173"
Write-Host ""
Write-Host "AgroNova is opening in your default browser."
Write-Host "Keep this window open. Press Ctrl+C to stop both services."
try {
  while (-not $Api.HasExited -and -not $Web.HasExited) { Start-Sleep -Seconds 2 }
} finally {
  foreach ($process in @($Api, $Web)) { if ($process -and -not $process.HasExited) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue } }
}
