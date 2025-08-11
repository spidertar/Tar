// AEGIS C4ISR System Configuration
// پیکربندی سامانه AEGIS C4ISR

module.exports = {
  // Server Configuration / پیکربندی سرور
  server: {
    port: process.env.PORT || 3000,
    host: 'localhost',
    updateInterval: 15000, // 15 seconds / ۱۵ ثانیه
    timeout: 10000, // API timeout / زمان انتظار API
    maxRetries: 3
  },

  // API Configuration / پیکربندی API
  apis: {
    adsb: {
      url: 'https://api.adsb.lol/v2/mil',
      enabled: true,
      priority: 'high'
    },
    flightradar: {
      url: 'https://data-cloud.flightradar24.com/zones/fcgi/js',
      enabled: true,
      priority: 'medium'
    },
    opensky: {
      url: 'https://opensky-network.org/api/states/all',
      enabled: true,
      priority: 'medium'
    },
    faaLimited: {
      url: 'https://api.adsb.lol/v2/ladd',
      enabled: true,
      priority: 'high'
    }
  },

  // Geographic Boundaries / مرزهای جغرافیایی
  regions: {
    middleEast: {
      lat: { min: 25, max: 40 },
      lon: { min: 35, max: 65 },
      name: 'خاورمیانه',
      priority: 'high'
    },
    iran: {
      lat: { min: 25, max: 40 },
      lon: { min: 44, max: 64 },
      name: 'ایران',
      priority: 'critical'
    },
    persianGulf: {
      lat: { min: 24, max: 30 },
      lon: { min: 48, max: 56 },
      name: 'خلیج فارس',
      priority: 'high'
    }
  },

  // Flight Type Classification / طبقه‌بندی انواع پرواز
  flightTypes: {
    civilian: {
      icon: 'https://img.icons8.com/color/48/airplane-mode-on.png',
      color: '#00ff41',
      priority: 'low'
    },
    military: {
      icon: 'https://img.icons8.com/color/48/fighter-jet.png',
      color: '#ff0000',
      priority: 'high'
    },
    drone: {
      icon: 'https://img.icons8.com/color/48/drone.png',
      color: '#ff8800',
      priority: 'critical'
    },
    fighter: {
      icon: 'https://img.icons8.com/color/48/fighter-jet.png',
      color: '#ff4444',
      priority: 'high'
    },
    iranian: {
      icon: 'https://img.icons8.com/color/48/iran-flag.png',
      color: '#00ff00',
      priority: 'critical'
    }
  },

  // AI Configuration / پیکربندی هوش مصنوعی
  ai: {
    enabled: true,
    notificationInterval: 30000, // 30 seconds / ۳۰ ثانیه
    threatLevels: {
      low: { color: '#00ff41', icon: 'info-circle' },
      medium: { color: '#ffaa00', icon: 'exclamation-triangle' },
      high: { color: '#ff0000', icon: 'exclamation-triangle' },
      critical: { color: '#ff0000', icon: 'radiation' }
    },
    patterns: {
      highAltitude: 30000, // feet / فوت
      suspiciousSpeed: 800, // knots / گره
      unusualPattern: true
    }
  },

  // Emergency Configuration / پیکربندی اضطراری
  emergency: {
    gpxGeneration: true,
    locationSpoofing: true,
    defaultLocation: {
      lat: 35.6892, // Tehran / تهران
      lon: 51.3890,
      altitude: 1000,
      speed: 30
    },
    safeZones: [
      { lat: 35.6892, lon: 51.3890, radius: 50, name: 'تهران' },
      { lat: 32.0853, lon: 34.7818, radius: 30, name: 'تل آویو' },
      { lat: 25.2048, lon: 55.2708, radius: 40, name: 'دبی' }
    ]
  },

  // Map Configuration / پیکربندی نقشه
  map: {
    defaultCenter: [51.3890, 35.6892], // Tehran / تهران
    defaultZoom: 6,
    basemap: 'satellite',
    clustering: {
      enabled: true,
      maxZoom: 10,
      radius: 50
    },
    icons: {
      small: 12,
      medium: 16,
      large: 20,
      extraLarge: 24
    }
  },

  // Performance Configuration / پیکربندی عملکرد
  performance: {
    maxFlights: 1000,
    clusteringThreshold: 10,
    updateBatchSize: 100,
    cacheTimeout: 30000 // 30 seconds / ۳۰ ثانیه
  },

  // Security Configuration / پیکربندی امنیتی
  security: {
    cors: {
      enabled: true,
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    headers: {
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
    }
  },

  // Mobile Configuration / پیکربندی موبایل
  mobile: {
    responsive: true,
    touchEnabled: true,
    sidebarBreakpoint: 768,
    iconSize: {
      mobile: 16,
      tablet: 20,
      desktop: 24
    }
  },

  // Notification Configuration / پیکربندی اعلان‌ها
  notifications: {
    enabled: true,
    duration: 10000, // 10 seconds / ۱۰ ثانیه
    maxNotifications: 5,
    position: 'top-left',
    sound: false
  },

  // 3D View Configuration / پیکربندی نمایش سه بعدی
  threeD: {
    enabled: true,
    baseUrl: 'https://www.flightradar24.com',
    format: '{flightId}/{hex}/3d'
  },

  // Logging Configuration / پیکربندی ثبت رویدادها
  logging: {
    enabled: true,
    level: 'info', // debug, info, warn, error
    file: 'aegis-c4isr.log',
    maxSize: '10m',
    maxFiles: 5
  }
};