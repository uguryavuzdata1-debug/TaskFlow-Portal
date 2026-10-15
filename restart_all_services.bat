@echo off
chcp 65001 >nul
echo ===================================================
echo     TaskFlow Servisleri Yeniden Başlatılıyor
echo ===================================================
echo.

echo 1. Mevcut servisler durduruluyor...
powershell -Command "Stop-Process -Name 'node' -ErrorAction SilentlyContinue; Get-CimInstance Win32_Process -Filter \"Name = 'python.exe'\" | Where-Object { $_.CommandLine -like '*sync_all_turso.py*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"

timeout /t 2 /nobreak >nul

echo 2. Servisler arka planda başlatılıyor...
powershell -ExecutionPolicy Bypass -File "h:\UGUR AI\Unfinished Work\TO DO\run_services.ps1"

echo.
echo ===================================================
echo      Servisler başarıyla başlatıldı!
echo ===================================================
pause
