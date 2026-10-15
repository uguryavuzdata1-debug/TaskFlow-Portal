# ============================================================
# TaskFlow Background Services Guardian
# Checks and starts server.js and sync_all_turso.py silently
# ============================================================

$serverDir = "h:\UGUR AI\Unfinished Work\TO DO"
$crmDir = "D:\AI\AI WORKS\Works_CRM\Source"
$pythonExe = "D:\AI\AI WORKS\Works_CRM\.venv\Scripts\python.exe"

# 1. Check Node server (Port 3000)
$portInUse = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if (-not $portInUse) {
    Write-Output "Starting TaskFlow API Server (node server.js)..."
    Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $serverDir -WindowStyle Hidden
    Start-Sleep -Seconds 2
} else {
    Write-Output "TaskFlow API Server is already running on port 3000."
}

# 2. Check Python CRM Sync Daemon
$pySync = Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" | Where-Object { $_.CommandLine -like "*sync_all_turso.py*" }
if (-not $pySync) {
    Write-Output "Starting CRM Sync Daemon (sync_all_turso.py)..."
    Start-Process -FilePath $pythonExe -ArgumentList "sync_all_turso.py" -WorkingDirectory $crmDir -WindowStyle Hidden
} else {
    Write-Output "CRM Sync Daemon is already running."
}
