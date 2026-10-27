@echo off
title Baper Rasta - বাপের রাস্তা
cd /d "%~dp0"
echo ========================================================
echo   🚗 বাপের রাস্তা (Baper Rasta) চালু হচ্ছে...
echo   ব্রাউজারে http://localhost:3000 ওপেন হবে
echo ========================================================
start "" http://localhost:3000
node server.js
pause
