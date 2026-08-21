# Store Finder Native Windows Silent Launcher
$ErrorActionPreference = 'SilentlyContinue'

$root = $PSScriptRoot
if (-not $root) { $root = Split-Path -Parent $MyInvocation.MyCommand.Definition }
$frontend = Join-Path $root "frontend"
$backend = Join-Path $root "backend"

# 1. Locate Node.js executable
$nodeExe = "F:\Node.js\node.exe"
if (-not (Test-Path $nodeExe)) {
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCmd) { $nodeExe = $nodeCmd.Source } else { $nodeExe = "node" }
}

# 2. Check if Next.js on port 5199 is already listening
$isListening = $false
try {
    $res = Invoke-WebRequest -Uri "http://127.0.0.1:5199/api/v1/health" -UseBasicParsing -TimeoutSec 1
    if ($res.StatusCode -eq 200) { $isListening = $true }
} catch {}

if (-not $isListening) {
    # 3. Launch Next.js in background
    $nextBin = Join-Path $frontend "node_modules\next\dist\bin\next"
    Start-Process -FilePath $nodeExe -ArgumentList $nextBin, "start", "-p", "5199", "-H", "127.0.0.1" -WorkingDirectory $frontend -WindowStyle Hidden

    # 4. Launch optional FastAPI backend
    Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000" -WorkingDirectory $backend -WindowStyle Hidden

    # 5. Wait and poll until http://127.0.0.1:5199 is ready
    for ($i = 0; $i -lt 35; $i++) {
        Start-Sleep -Milliseconds 250
        try {
            $res = Invoke-WebRequest -Uri "http://127.0.0.1:5199/api/v1/health" -UseBasicParsing -TimeoutSec 1
            if ($res.StatusCode -eq 200) { break }
        } catch {}
    }
}

# 6. Open default browser directly to http://127.0.0.1:5199
Start-Process "http://127.0.0.1:5199"
