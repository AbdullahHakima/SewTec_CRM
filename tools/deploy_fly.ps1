# SewTec CRM - Fly.io Automated Deployment Helper
$ErrorActionPreference = "Stop"

$fly = "$env:USERPROFILE\.fly\bin\flyctl.exe"
if (-not (Test-Path $fly)) {
    Write-Host "Installing flyctl..." -ForegroundColor Cyan
    iwr https://fly.io/install.ps1 -useb | iex
}

Write-Host "Checking Fly.io authentication..." -ForegroundColor Cyan
try {
    & $fly auth whoami | Out-Null
    Write-Host "Fly.io authenticated successfully." -ForegroundColor Green
} catch {
    Write-Host "Please log in to Fly.io in the browser window that opens..." -ForegroundColor Yellow
    & $fly auth login
}

Set-Location "d:\SewTec_CRM\backend"

Write-Host "`nCreating Fly.io app and persistent volume 'crm_data'..." -ForegroundColor Cyan
& $fly launch --no-deploy --name sewtec-crm-api --region ams 2>$null
& $fly volumes create crm_data --size 1 --region ams -y 2>$null

Write-Host "`nSetting production environment secrets..." -ForegroundColor Cyan
& $fly secrets set `
  Jwt__Key="my-super-secret-random-32-character-jwt-key-2026" `
  Bootstrap__Username="admin" `
  Bootstrap__Password="AdminPassword123!" `
  Bootstrap__FullName="System Admin" `
  Bootstrap__BranchId="B1"

Write-Host "`nDeploying Backend to Fly.io..." -ForegroundColor Cyan
& $fly deploy

Write-Host "`n✅ Backend deployment complete!" -ForegroundColor Green
Write-Host "Check health at: https://sewtec-crm-api.fly.dev/health" -ForegroundColor Yellow
