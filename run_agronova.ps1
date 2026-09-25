$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$Venv = Join-Path $Backend ".venv"
$VenvPython = Join-Path $Venv "Scripts\python.exe"
$Python = if (Test-Path $VenvPython) { $VenvPython } else { (Get-Command python -ErrorAction SilentlyContinue).Source }
if (-not $Python) { $Python = (Get-Command py -ErrorAction SilentlyContinue).Source }
if (-not $Python) { throw "Python 3.10+ was not found. Install Python and try again." }
$Npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (-not $Npm) { throw "npm was not found. Install Node.js 18+ and try again." }

if (-not (Test-Path $VenvPython)) {
  Write-Host "Creating Python virtual environment..."
  & $Python -m venv $Venv
}

Write-Host "Checking backend dependencies..."
& $VenvPython -c "import fastapi, uvicorn, sklearn" 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Installing backend dependencies..."
  & $VenvPython -m pip install -r (Join-Path $Backend "requirements.txt")
  if ($LASTEXITCODE -ne 0) {
    $Uv = (Get-Command uv -ErrorAction SilentlyContinue).Source
    if (-not $Uv) { throw "Backend dependencies are missing and pip is unavailable. Reinstall Python with pip or install uv." }
    & $Uv pip install --python $VenvPython -r (Join-Path $Backend "requirements.txt")
    if ($LASTEXITCODE -ne 0) { throw "Backend dependency installation failed." }
  }
}
if (-not (Test-Path (Join-Path $Frontend "node_modules"))) {
  Write-Host "Installing frontend dependencies..."
  Push-Location $Frontend
  try { & $Npm install; if ($LASTEXITCODE -ne 0) { throw "Frontend dependency installation failed." } } finally { Pop-Location }
}

function Test-Port([int]$Port) {
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $task = $client.ConnectAsync("127.0.0.1", $Port)
    if ($task.Wait(300)) { return $client.Connected }
    return $false
  } catch { return $false } finally { $client.Dispose() }
}

Write-Host "Starting AgroNova API on http://127.0.0.1:8000 ..."
$Api = Start-Process -FilePath $VenvPython -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000") -WorkingDirectory $Backend -PassThru
Write-Host "Starting AgroNova web app on http://127.0.0.1:5173 ..."
$Web = Start-Process -FilePath $Npm -ArgumentList @("run", "dev", "--", "--host", "127.0.0.1") -WorkingDirectory $Frontend -PassThru

try {
  $deadline = (Get-Date).AddSeconds(30)
  while ((-not (Test-Port 8000) -or -not (Test-Port 5173)) -and (Get-Date) -lt $deadline) {
    if ($Api.HasExited -or $Web.HasExited) { throw "AgroNova services exited before startup completed. Check the terminal output." }
    Start-Sleep -Seconds 1
  }
  if (-not (Test-Port 8000) -or -not (Test-Port 5173)) { throw "AgroNova services did not become ready within 30 seconds." }
  Start-Process "http://127.0.0.1:5173"
  Write-Host ""
  Write-Host "AgroNova is open at http://127.0.0.1:5173"
  Write-Host "Keep this window open. Press Ctrl+C to stop both services."
  while (-not $Api.HasExited -and -not $Web.HasExited) { Start-Sleep -Seconds 2 }
} finally {
  foreach ($process in @($Api, $Web)) { if ($process -and -not $process.HasExited) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue } }
}
