const express = require('express');
const fetch = require('node-fetch');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');
const NodeCache = require('node-cache');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8787;

const cache = new NodeCache({ stdTTL: 2, checkperiod: 10, useClones: false });

app.use(compression());
app.use(cors({ origin: true }));
app.use(morgan('tiny'));

// Serve static client from repo root for same-origin API
app.use(express.static(path.join(__dirname, '..')));

function makeHeaders() {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://www.flightradar24.com',
    'Referer': 'https://www.flightradar24.com/'
  };
}

async function cachedGet(key, url, opts = {}) {
  const fromCache = cache.get(key);
  if (fromCache) return fromCache;
  const res = await fetch(url, { headers: { ...makeHeaders(), ...(opts.headers || {}) }, timeout: 8000 });
  const text = await res.text();
  // Some endpoints may prefix while(1);
  const cleaned = text.replace(/^while\(1\);/, '').trim();
  cache.set(key, cleaned);
  return cleaned;
}

function parseFr24(jsonText) {
  try {
    const raw = JSON.parse(jsonText);
    const flights = [];
    for (const [key, value] of Object.entries(raw)) {
      if (!Array.isArray(value)) continue;
      flights.push({
        id: key,
        lat: value[1],
        lon: value[2],
        track: value[3] || 0,
        alt_baro: value[4] || null,
        gs: value[5] || null,
        model: value[8] || null,
        r: value[9] || null,
        category: value[11] || null,
        flight: value[13] || null,
        hex: value[0] || null,
        source: 'fr24',
        type: 'civilian'
      });
    }
    return flights;
  } catch (_) {
    return [];
  }
}

function parseAdsb(jsonText) {
  try {
    const data = JSON.parse(jsonText);
    const arr = Array.isArray(data) ? data : (data.aircraft || data.ac || []);
    return arr.map(a => ({
      id: a.hex || a.icao || a.flight || a.id,
      lat: a.lat,
      lon: a.lon,
      track: a.track || a.heading || 0,
      alt_baro: a.alt_baro || a.alt_geom || null,
      gs: a.gs || a.velocity || null,
      model: a.t || a.type || null,
      r: a.r || null,
      category: a.category || null,
      flight: a.flight || a.callsign || null,
      hex: a.hex || a.icao,
      source: 'adsb',
      type: 'military'
    }));
  } catch (_) {
    return [];
  }
}

function parseOpenSky(jsonText) {
  try {
    const data = JSON.parse(jsonText);
    const states = data.states || [];
    return states.map(s => ({
      icao24: s[0],
      callsign: s[1] ? s[1].trim() : null,
      lon: s[5],
      lat: s[6],
      alt_baro: s[7] || null,
      velocity: s[9] || null,
      heading: s[10] || 0,
      hex: s[0],
      source: 'opensky',
      type: 'aircraft'
    }));
  } catch (_) {
    return [];
  }
}

function withinBbox(p, bbox) {
  if (!bbox) return true;
  const [west, south, east, north] = bbox;
  if (p.lat == null || p.lon == null) return false;
  return p.lon >= west && p.lon <= east && p.lat >= south && p.lat <= north;
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/fr24', async (req, res) => {
  try {
    const { bounds } = req.query; // format: south,west,north,east used by FR24; we will just pass through if provided
    const url = bounds
      ? `https://data-cloud.flightradar24.com/zones/fcgi/feeds.js?bounds=${encodeURIComponent(bounds)}`
      : 'https://data-cloud.flightradar24.com/zones/fcgi/feeds.js';
    const text = await cachedGet(`fr24:${bounds || 'all'}`, url);
    res.set('Cache-Control', 'public, max-age=2');
    res.type('application/json').send(text);
  } catch (e) {
    res.status(502).json({ error: 'fr24_failed' });
  }
});

app.get('/api/adsb/mil', async (req, res) => {
  try {
    const text = await cachedGet('adsb:mil', 'https://api.adsb.lol/v2/mil');
    res.set('Cache-Control', 'public, max-age=2');
    res.type('application/json').send(text);
  } catch (e) {
    res.status(502).json({ error: 'adsb_failed' });
  }
});

app.get('/api/adsb/ladd', async (req, res) => {
  try {
    const text = await cachedGet('adsb:ladd', 'https://api.adsb.lol/v2/ladd');
    res.set('Cache-Control', 'public, max-age=2');
    res.type('application/json').send(text);
  } catch (e) {
    res.status(502).json({ error: 'adsb_ladd_failed' });
  }
});

app.get('/api/opensky', async (req, res) => {
  try {
    const { bbox } = req.query; // bbox=west,south,east,north
    const url = bbox
      ? `https://opensky-network.org/api/states/all?bbox=${encodeURIComponent(bbox)}`
      : 'https://opensky-network.org/api/states/all';
    const text = await cachedGet(`opensky:${bbox || 'all'}`, url);
    res.set('Cache-Control', 'public, max-age=2');
    res.type('application/json').send(text);
  } catch (e) {
    res.status(502).json({ error: 'opensky_failed' });
  }
});

app.get('/api/aggregate', async (req, res) => {
  try {
    const bboxParam = req.query.bbox; // west,south,east,north
    const bbox = bboxParam ? bboxParam.split(',').map(Number) : null;

    const [fr24Text, adsbText, openskyText] = await Promise.all([
      cachedGet(`fr24:${bboxParam || 'all'}`, bbox ? `https://data-cloud.flightradar24.com/zones/fcgi/feeds.js?bounds=${encodeURIComponent(`${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]}`)}` : 'https://data-cloud.flightradar24.com/zones/fcgi/feeds.js'),
      cachedGet('adsb:mil', 'https://api.adsb.lol/v2/mil'),
      cachedGet(`opensky:${bboxParam || 'all'}`, bbox ? `https://opensky-network.org/api/states/all?bbox=${encodeURIComponent(bboxParam)}` : 'https://opensky-network.org/api/states/all')
    ]);

    const fr24 = parseFr24(fr24Text);
    const adsb = parseAdsb(adsbText);
    const opensky = parseOpenSky(openskyText);

    const merged = [...fr24, ...adsb, ...opensky].filter(p => withinBbox(p, bbox));

    res.set('Cache-Control', 'public, max-age=2');
    res.json({ count: merged.length, flights: merged });
  } catch (e) {
    res.status(502).json({ error: 'aggregate_failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server listening on http://localhost:${PORT}`);
});