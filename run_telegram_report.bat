@echo off
cd /d "h:\UGUR AI\Unfinished Work\TO DO"
echo ==================================================== >> telegram_report.log
echo [RUN] %date% %time% Gün sonu raporu başlatıldı... >> telegram_report.log
node telegram_reporter.js >> telegram_report.log 2>&1
echo [DONE] %date% %time% Tamamlandı. >> telegram_report.log
