@echo off
chcp 65001 >nul
title AEGIS C4ISR System

echo 🚀 Starting AEGIS C4ISR System...
echo 🚀 در حال راه‌اندازی سامانه AEGIS C4ISR...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo ❌ Node.js نصب نشده است. لطفاً ابتدا Node.js را نصب کنید.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    echo ❌ npm نصب نشده است. لطفاً ابتدا npm را نصب کنید.
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version
echo ✅ npm version: 
npm --version

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    echo 📦 در حال نصب وابستگی‌ها...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies.
        echo ❌ نصب وابستگی‌ها ناموفق بود.
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully.
    echo ✅ وابستگی‌ها با موفقیت نصب شدند.
) else (
    echo ✅ Dependencies already installed.
    echo ✅ وابستگی‌ها قبلاً نصب شده‌اند.
)

REM Check if port 3000 is available
netstat -an | find "3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Port 3000 is already in use. Trying to kill existing process...
    echo ⚠️  پورت ۳۰۰۰ در حال استفاده است. در حال تلاش برای پایان دادن به فرآیند موجود...
    for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000"') do taskkill /f /pid %%a >nul 2>&1
    timeout /t 2 /nobreak >nul
)

REM Set environment variables
set NODE_ENV=production
set PORT=3000

REM Start the server
echo 🌐 Starting server on port 3000...
echo 🌐 در حال راه‌اندازی سرور روی پورت ۳۰۰۰...

npm start

echo.
echo 🎉 AEGIS C4ISR System is now running!
echo 🎉 سامانه AEGIS C4ISR اکنون در حال اجرا است!
echo.
echo 📱 Access the system at:
echo 📱 دسترسی به سامانه از طریق:
echo    🌐 Main Interface: http://localhost:3000/aegis-c4isr.html
echo    🌐 Legacy UAV: http://localhost:3000/uav.html
echo    🌐 Legacy Military: http://localhost:3000/mil.html
echo    🌐 Legacy TAR: http://localhost:3000/tar.html
echo.
echo 📊 API Endpoints:
echo 📊 نقاط پایانی API:
echo    🔗 Flight Data: http://localhost:3000/api/flights
echo    🔗 Statistics: http://localhost:3000/api/stats
echo    🔗 Middle East: http://localhost:3000/api/flights/middle-east
echo.
echo 🛑 To stop the server, press Ctrl+C
echo 🛑 برای توقف سرور، Ctrl+C را فشار دهید
echo.

pause