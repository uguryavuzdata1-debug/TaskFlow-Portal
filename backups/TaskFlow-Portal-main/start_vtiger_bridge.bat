@echo off
cd /d "%~dp0"
echo ==============================================
echo TaskFlow vTiger Bridge Server Starting...
echo ==============================================
node vtiger_bridge.js
pause
