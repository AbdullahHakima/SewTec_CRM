#!/bin/sh
set -e

echo "[SewTec] Ensuring data directory exists..."
mkdir -p /app/data

echo "[SewTec] Checking and running database migrations..."
dotnet SewTec.CRM.Api.dll --migrate || echo "[SewTec] Notice: Database migration executed."

if [ -n "$Bootstrap__Password" ] && [ -n "$Bootstrap__Username" ]; then
  echo "[SewTec] Attempting admin bootstrap..."
  dotnet SewTec.CRM.Api.dll --bootstrap-admin || echo "[SewTec] Admin bootstrap skipped (user accounts already exist)."
fi

echo "[SewTec] Starting SewTec CRM API server..."
exec dotnet SewTec.CRM.Api.dll
