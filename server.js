const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cron = require('node-cron');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const moment = require('moment');
const _ = require('lodash');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static('.'));

// Global data storage
let flightData = {
  adsb: [],
  flightradar: [],
  opensky: [],
  military: [],
  drones: [],
  lastUpdate: null
};

// Enhanced headers for API requests
const apiHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Cache-Control': 'no-cache'
};

// Fetch ADS-B data with enhanced error handling
async function fetchAdsbData() {
  try {
    const response = await axios.get('https://api.adsb.lol/v2/mil', {
      headers: apiHeaders,
      timeout: 10000
    });
    
    if (response.data && response.data.ac) {
      return response.data.ac.map(aircraft => ({
        icao24: aircraft.hex,
        callsign: aircraft.flight?.trim() || 'N/A',
        lat: aircraft.lat,
        lon: aircraft.lon,
        altitude: aircraft.alt_baro,
        velocity: aircraft.gs,
        heading: aircraft.track,
        vertical_rate: aircraft.baro_rate,
        squawk: aircraft.squawk,
        type: 'military',
        source: 'adsb',
        timestamp: Date.now()
      }));
    }
    return [];
  } catch (error) {
    console.error('ADS-B API Error:', error.message);
    return [];
  }
}

// Fetch FlightRadar24 data
async function fetchFlightradarData() {
  try {
    const response = await axios.get('https://data-cloud.flightradar24.com/zones/fcgi/js', {
      headers: apiHeaders,
      timeout: 10000
    });
    
    // Parse FlightRadar24 data (simplified)
    const data = response.data;
    if (data && data.full_count) {
      return Object.values(data).filter(item => 
        item && typeof item === 'object' && item.lat && item.lon
      ).map(flight => ({
        icao24: flight.icao || 'N/A',
        callsign: flight.flight || 'N/A',
        lat: flight.lat,
        lon: flight.lon,
        altitude: flight.altitude,
        velocity: flight.speed,
        heading: flight.track,
        type: 'civilian',
        source: 'flightradar',
        timestamp: Date.now()
      }));
    }
    return [];
  } catch (error) {
    console.error('FlightRadar24 API Error:', error.message);
    return [];
  }
}

// Fetch OpenSky Network data
async function fetchOpenSkyData() {
  try {
    const response = await axios.get('https://opensky-network.org/api/states/all', {
      headers: apiHeaders,
      timeout: 10000
    });
    
    if (response.data && response.data.states) {
      return response.data.states.map(state => ({
        icao24: state[0],
        callsign: state[1]?.trim() || 'N/A',
        lat: state[6],
        lon: state[5],
        altitude: state[7],
        velocity: state[9],
        heading: state[10],
        vertical_rate: state[11],
        squawk: state[4],
        type: 'civilian',
        source: 'opensky',
        timestamp: Date.now()
      }));
    }
    return [];
  } catch (error) {
    console.error('OpenSky API Error:', error.message);
    return [];
  }
}

// Fetch FAA limited flights
async function fetchFaaLimitedData() {
  try {
    const response = await axios.get('https://api.adsb.lol/v2/ladd', {
      headers: apiHeaders,
      timeout: 10000
    });
    
    if (response.data && response.data.ac) {
      return response.data.ac.map(aircraft => ({
        icao24: aircraft.hex,
        callsign: aircraft.flight?.trim() || 'N/A',
        lat: aircraft.lat,
        lon: aircraft.lon,
        altitude: aircraft.alt_baro,
        velocity: aircraft.gs,
        heading: aircraft.track,
        type: 'faa_limited',
        source: 'adsb_faa',
        timestamp: Date.now()
      }));
    }
    return [];
  } catch (error) {
    console.error('FAA Limited API Error:', error.message);
    return [];
  }
}

// Generate sample drone data for testing
function generateDroneData() {
  const drones = [];
  const middleEastBounds = {
    lat: { min: 25, max: 40 },
    lon: { min: 35, max: 65 }
  };
  
  for (let i = 0; i < 15; i++) {
    drones.push({
      icao24: `DRONE${Math.random().toString(16).substr(2, 6).toUpperCase()}`,
      callsign: `UAV-${Math.floor(Math.random() * 1000)}`,
      lat: middleEastBounds.lat.min + Math.random() * (middleEastBounds.lat.max - middleEastBounds.lat.min),
      lon: middleEastBounds.lon.min + Math.random() * (middleEastBounds.lon.max - middleEastBounds.lon.min),
      altitude: Math.floor(Math.random() * 5000) + 100,
      velocity: Math.floor(Math.random() * 100) + 20,
      heading: Math.floor(Math.random() * 360),
      type: 'drone',
      source: 'simulated',
      timestamp: Date.now(),
      threat_level: Math.random() > 0.7 ? 'high' : 'low'
    });
  }
  return drones;
}

// Update all flight data
async function updateFlightData() {
  try {
    console.log('Updating flight data...');
    
    const [adsbData, flightradarData, openskyData, faaLimitedData] = await Promise.allSettled([
      fetchAdsbData(),
      fetchFlightradarData(),
      fetchOpenSkyData(),
      fetchFaaLimitedData()
    ]);
    
    flightData = {
      adsb: adsbData.status === 'fulfilled' ? adsbData.value : [],
      flightradar: flightradarData.status === 'fulfilled' ? flightradarData.value : [],
      opensky: openskyData.status === 'fulfilled' ? openskyData.value : [],
      military: faaLimitedData.status === 'fulfilled' ? faaLimitedData.value : [],
      drones: generateDroneData(),
      lastUpdate: Date.now()
    };
    
    // Emit updated data to connected clients
    io.emit('flightDataUpdate', flightData);
    
    console.log(`Data updated: ${flightData.adsb.length} ADS-B, ${flightData.flightradar.length} FlightRadar, ${flightData.opensky.length} OpenSky, ${flightData.military.length} Military, ${flightData.drones.length} Drones`);
    
  } catch (error) {
    console.error('Error updating flight data:', error);
  }
}

// API Routes
app.get('/api/flights', (req, res) => {
  res.json(flightData);
});

app.get('/api/flights/adsb', (req, res) => {
  res.json(flightData.adsb);
});

app.get('/api/flights/middle-east', (req, res) => {
  const middleEastBounds = {
    lat: { min: 25, max: 40 },
    lon: { min: 35, max: 65 }
  };
  
  const allFlights = [
    ...flightData.adsb,
    ...flightData.flightradar,
    ...flightData.opensky,
    ...flightData.military,
    ...flightData.drones
  ];
  
  const middleEastFlights = allFlights.filter(flight => 
    flight.lat >= middleEastBounds.lat.min && 
    flight.lat <= middleEastBounds.lat.max &&
    flight.lon >= middleEastBounds.lon.min && 
    flight.lon <= middleEastBounds.lon.max
  );
  
  res.json(middleEastFlights);
});

app.get('/api/stats', (req, res) => {
  const stats = {
    total: flightData.adsb.length + flightData.flightradar.length + flightData.opensky.length + flightData.military.length + flightData.drones.length,
    adsb: flightData.adsb.length,
    flightradar: flightData.flightradar.length,
    opensky: flightData.opensky.length,
    military: flightData.military.length,
    drones: flightData.drones.length,
    lastUpdate: flightData.lastUpdate
  };
  res.json(stats);
});

// GPX file generation for location spoofing
app.post('/api/gpx/generate', (req, res) => {
  const { lat, lon, altitude, speed } = req.body;
  
  const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="AEGIS C4ISR System">
  <trk>
    <name>Emergency Location</name>
    <trkseg>
      <trkpt lat="${lat}" lon="${lon}">
        <ele>${altitude || 0}</ele>
        <speed>${speed || 0}</speed>
        <time>${new Date().toISOString()}</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;
  
  res.setHeader('Content-Type', 'application/gpx+xml');
  res.setHeader('Content-Disposition', 'attachment; filename="emergency_location.gpx"');
  res.send(gpxContent);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send initial data
  socket.emit('flightDataUpdate', flightData);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
  
  socket.on('requestUpdate', () => {
    updateFlightData();
  });
});

// Schedule data updates
cron.schedule('*/15 * * * * *', updateFlightData); // Every 15 seconds

// Initial data load
updateFlightData();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`AEGIS C4ISR Server running on port ${PORT}`);
  console.log(`Access the system at: http://localhost:${PORT}`);
});