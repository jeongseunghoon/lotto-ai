@echo off
title Lotto Proxy Server
cd /d "%~dp0proxy-server"
echo Starting Lotto Proxy Server...
echo.
node server.js
pause
