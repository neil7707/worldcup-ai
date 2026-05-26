# 世足 AI 預測網站啟動腳本
# 在兩個終端視窗分別執行，或使用此腳本同時啟動

$ErrorActionPreference = "Stop"

Write-Host "啟動 FastAPI 後端..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; python -m uvicorn main:app --reload --port 8000"

Start-Sleep -Seconds 2

Write-Host "啟動 Next.js 前端..." -ForegroundColor Green
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = [System.Environment]::GetEnvironmentVariable('PATH', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('PATH', 'User'); cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "網站已啟動！" -ForegroundColor Yellow
Write-Host "前端: http://localhost:3000" -ForegroundColor Cyan
Write-Host "後端: http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "記得先在 backend\.env 設定你的 ANTHROPIC_API_KEY" -ForegroundColor Red
