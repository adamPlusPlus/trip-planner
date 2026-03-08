# PowerShell script to start both servers
# Start file server in background
Write-Host "Starting file server on port 8000..." -ForegroundColor Green
$fileServer = Start-Process python -ArgumentList "-m", "http.server", "8000" -PassThru -WindowStyle Hidden

Start-Sleep -Seconds 2

Write-Host "Starting Vite dev server..." -ForegroundColor Green
Set-Location road-trip-planner
npm run dev

# Cleanup
Stop-Process -Id $fileServer.Id -ErrorAction SilentlyContinue

