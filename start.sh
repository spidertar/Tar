#!/bin/bash

# AEGIS C4ISR System Startup Script
# اسکریپت راه‌اندازی سامانه AEGIS C4ISR

echo "🚀 Starting AEGIS C4ISR System..."
echo "🚀 در حال راه‌اندازی سامانه AEGIS C4ISR..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "❌ Node.js نصب نشده است. لطفاً ابتدا Node.js را نصب کنید."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    echo "❌ npm نصب نشده است. لطفاً ابتدا npm را نصب کنید."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "❌ Node.js version 14 or higher is required. Current version: $(node -v)"
    echo "❌ نسخه Node.js ۱۴ یا بالاتر مورد نیاز است. نسخه فعلی: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ npm version: $(npm -v)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    echo "📦 در حال نصب وابستگی‌ها..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies."
        echo "❌ نصب وابستگی‌ها ناموفق بود."
        exit 1
    fi
    echo "✅ Dependencies installed successfully."
    echo "✅ وابستگی‌ها با موفقیت نصب شدند."
else
    echo "✅ Dependencies already installed."
    echo "✅ وابستگی‌ها قبلاً نصب شده‌اند."
fi

# Check if port 3000 is available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3000 is already in use. Trying to kill existing process..."
    echo "⚠️  پورت ۳۰۰۰ در حال استفاده است. در حال تلاش برای پایان دادن به فرآیند موجود..."
    lsof -ti:3000 | xargs kill -9
    sleep 2
fi

# Start the server
echo "🌐 Starting server on port 3000..."
echo "🌐 در حال راه‌اندازی سرور روی پورت ۳۰۰۰..."

# Set environment variables
export NODE_ENV=production
export PORT=3000

# Start the server
npm start &

# Wait a moment for the server to start
sleep 3

# Check if server is running
if curl -s http://localhost:3000/api/stats > /dev/null; then
    echo ""
    echo "🎉 AEGIS C4ISR System is now running!"
    echo "🎉 سامانه AEGIS C4ISR اکنون در حال اجرا است!"
    echo ""
    echo "📱 Access the system at:"
    echo "📱 دسترسی به سامانه از طریق:"
    echo "   🌐 Main Interface: http://localhost:3000/aegis-c4isr.html"
    echo "   🌐 Legacy UAV: http://localhost:3000/uav.html"
    echo "   🌐 Legacy Military: http://localhost:3000/mil.html"
    echo "   🌐 Legacy TAR: http://localhost:3000/tar.html"
    echo ""
    echo "📊 API Endpoints:"
    echo "📊 نقاط پایانی API:"
    echo "   🔗 Flight Data: http://localhost:3000/api/flights"
    echo "   🔗 Statistics: http://localhost:3000/api/stats"
    echo "   🔗 Middle East: http://localhost:3000/api/flights/middle-east"
    echo ""
    echo "🛑 To stop the server, press Ctrl+C"
    echo "🛑 برای توقف سرور، Ctrl+C را فشار دهید"
    echo ""
    
    # Keep the script running
    wait
else
    echo "❌ Failed to start server. Please check the logs."
    echo "❌ راه‌اندازی سرور ناموفق بود. لطفاً لاگ‌ها را بررسی کنید."
    exit 1
fi