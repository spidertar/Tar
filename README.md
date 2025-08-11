# AEGIS C4ISR System

## سامانه یکپارچه رصد و فرماندهی AEGIS

A comprehensive C4ISR (Command, Control, Communications, Computers, Intelligence, Surveillance, and Reconnaissance) system for monitoring and tracking drones and aircraft in real-time.

## Features / ویژگی‌ها

### 🚁 Real-time Flight Tracking
- **ADS-B Integration**: Real-time military aircraft data from `api.adsb.lol/v2/mil`
- **FlightRadar24**: Civilian flight data from `data-cloud.flightradar24.com`
- **OpenSky Network**: Global flight tracking from `opensky-network.org/api/states/all`
- **FAA Limited Flights**: Restricted flight data from `api.adsb.lol/v2/ladd`

### 🎯 Advanced Monitoring
- **Middle East Focus**: Specialized tracking for Middle Eastern airspace
- **Drone Detection**: Simulated drone tracking with threat level assessment
- **Military Aircraft**: Enhanced tracking of military and fighter aircraft
- **Iranian Aircraft**: Special identification for Iranian flights

### 🤖 AI-Powered Intelligence
- **Real-time Analysis**: AI notifications for unusual flight patterns
- **Threat Assessment**: Automatic threat level evaluation
- **Pattern Recognition**: Detection of suspicious flight behaviors
- **Smart Alerts**: Contextual notifications based on flight data

### 🛡️ Emergency Features
- **Location Spoofing**: Generate GPX files for emergency location changes
- **GPS Mocking**: Support for location spoofing in mobile applications
- **Emergency Protocols**: Quick response to drone threats

### 📱 Mobile Optimization
- **Responsive Design**: Optimized for mobile devices
- **Touch Interface**: Touch-friendly controls and navigation
- **Offline Capability**: Works with local Node.js server
- **Progressive Web App**: Can be converted to Android APK

### 🗺️ Advanced Mapping
- **3D Flight View**: Direct links to FlightRadar24 3D visualization
- **Satellite Imagery**: High-resolution satellite basemaps
- **Clustering**: Smart clustering for dense flight areas
- **Custom Icons**: Realistic aircraft and drone icons

### 🔧 Technical Features
- **Node.js Backend**: Local server for data processing
- **Socket.IO**: Real-time data updates
- **CORS Bypass**: Enhanced API access with proper headers
- **High Performance**: Optimized for speed and reliability

## Installation / نصب

### Prerequisites / پیش‌نیازها
- Node.js (v14 or higher)
- npm or yarn
- Modern web browser

### Setup / راه‌اندازی

1. **Clone the repository**
```bash
git clone <repository-url>
cd aegis-c4isr-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the server**
```bash
npm start
```

4. **Access the system**
Open your browser and navigate to: `http://localhost:3000/aegis-c4isr.html`

### Development Mode
```bash
npm run dev
```

## Usage / استفاده

### Main Interface
1. **Flight Statistics**: View real-time statistics in the right sidebar
2. **Filters**: Use checkboxes to filter different types of flights
3. **Emergency Button**: Generate GPX file for location spoofing
4. **AI Notifications**: Monitor AI-generated alerts and warnings

### Flight Information
- **Click on aircraft**: View detailed flight information
- **3D View**: Click "نمایش سه بعدی" to open 3D visualization
- **Real-time Updates**: Data updates every 15 seconds

### Mobile Usage
- **Sidebar Toggle**: Use the menu button on mobile devices
- **Touch Navigation**: Swipe and tap to navigate the map
- **Responsive Design**: Automatically adapts to screen size

## API Endpoints / نقاط پایانی API

### Flight Data
- `GET /api/flights` - All flight data
- `GET /api/flights/adsb` - ADS-B data only
- `GET /api/flights/middle-east` - Middle East flights
- `GET /api/stats` - Flight statistics

### Emergency Features
- `POST /api/gpx/generate` - Generate emergency GPX file

## Configuration / پیکربندی

### Server Configuration
Edit `server.js` to modify:
- Update intervals (default: 15 seconds)
- API endpoints
- Data processing logic
- CORS settings

### Frontend Configuration
Edit `aegis-c4isr.html` to modify:
- Map center coordinates
- Icon styles and sizes
- Notification settings
- Filter options

## Mobile App Conversion / تبدیل به اپلیکیشن موبایل

### Using Website to APK Builder
1. Start the Node.js server locally
2. Use Website to APK Builder with these settings:
   - **URL**: `http://localhost:3000/aegis-c4isr.html`
   - **Cross Origin**: Enabled
   - **Deep Linking**: Enabled
   - **High Cache**: Enabled
   - **Permissions**: Location, Internet

### Cordova Integration
For advanced features like GPS spoofing:
```bash
npm install -g cordova
cordova create AegisC4ISR
cd AegisC4ISR
cordova platform add android
cordova plugin add cordova-plugin-geolocation
```

## Security Features / ویژگی‌های امنیتی

### Data Protection
- **Local Processing**: All data processed locally
- **No Data Storage**: No persistent data storage
- **Secure Headers**: Enhanced API request headers
- **CORS Management**: Proper cross-origin handling

### Emergency Protocols
- **Location Spoofing**: Generate fake GPS coordinates
- **Threat Response**: Quick response to detected threats
- **Alert System**: Real-time threat notifications

## Technical Specifications / مشخصات فنی

### Backend (Node.js)
- **Express.js**: Web server framework
- **Socket.IO**: Real-time communication
- **Axios**: HTTP client for API requests
- **Node-cron**: Scheduled data updates
- **Compression**: Response compression
- **Helmet**: Security headers

### Frontend (HTML/JavaScript)
- **ArcGIS API**: Advanced mapping
- **Socket.IO Client**: Real-time updates
- **Font Awesome**: Icons
- **Responsive CSS**: Mobile optimization

### Data Sources
- **ADS-B Exchange**: Military aircraft data
- **FlightRadar24**: Civilian flight data
- **OpenSky Network**: Global flight tracking
- **FAA**: Restricted flight information

## Troubleshooting / عیب‌یابی

### Common Issues
1. **CORS Errors**: Ensure server is running and CORS is enabled
2. **No Flight Data**: Check API endpoints and network connectivity
3. **Mobile Issues**: Verify responsive design and touch events
4. **Performance**: Reduce update frequency if needed

### Performance Optimization
- **Clustering**: Enable for dense flight areas
- **Icon Size**: Adjust based on zoom level
- **Update Frequency**: Modify in server.js
- **Data Filtering**: Use filters to reduce displayed flights

## Contributing / مشارکت

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License / مجوز

This project is licensed under the MIT License - see the LICENSE file for details.

## Support / پشتیبانی

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## Acknowledgments / تشکر

- **ADS-B Exchange** for military flight data
- **FlightRadar24** for civilian flight tracking
- **OpenSky Network** for global flight data
- **ArcGIS** for mapping technology
- **Socket.IO** for real-time communication

---

**Developed by Cinascorp © 2024**

*سامانه AEGIS C4ISR - پیشرفته‌ترین سیستم رصد و فرماندهی*