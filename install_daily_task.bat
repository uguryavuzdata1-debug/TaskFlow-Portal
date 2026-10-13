@echo off
:: Check for admin permissions
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo Yonetici izinleri isteniyor...
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"
echo ================================================================
echo   TaskFlow Portal - Gun Sonu Telegram Bildirimi Zamanlayicisi
echo   Hedef Saat: 17:50 (Her Gun)
echo ================================================================
echo.

set "TASK_NAME=TaskFlow_Daily_Telegram_Report"
set "BAT_PATH=%~dp0run_telegram_report.bat"

echo Gorev olusturuluyor: %TASK_NAME%
echo Calistirilacak dosya: %BAT_PATH%
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument '/c \"\"%BAT_PATH%\"\"'; " ^
  "$trigger = New-ScheduledTaskTrigger -Daily -At 17:50; " ^
  "$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries; " ^
  "Register-ScheduledTask -TaskName '%TASK_NAME%' -Action $action -Trigger $trigger -Settings $settings -Force"

if %errorlevel% equ 0 (
    echo.
    echo ================================================================
    echo  [BASARILI] Gorev Windows Zamanlayiciya eklendi!
    echo  Her gun saat 17:50'de otomatik olarak calisacaktir.
    echo ================================================================
) else (
    echo.
    echo [HATA] Gorev olusturulamadi. Lutfen komutu kontrol edin.
)

echo.
pause
