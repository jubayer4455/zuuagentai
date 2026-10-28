@echo off
title রাস্তার রাজা - Rastar Raja (Offline Game)
cd /d "%~dp0"
echo ========================================================
echo   👑 রাস্তার রাজা (Rastar Raja) - ১০০%% অফলাইন গেম
echo   নির্মাতা: আব্দুল আল যুবায়ের (Abdul Al Jubayer)
echo   ইন্টারনেট ছাড়াই সম্পূর্ণ গেমটি খেলা যাবে!
echo ========================================================
echo   ব্রাউজারে http://localhost:3000 চালু হচ্ছে...
start "" http://localhost:3000
node server.js
pause
