# AEGIS C4ISR Proxy + Client

## Run proxy server

```
cd server
npm install
npm start
```

This starts the proxy on http://localhost:8787

## Serve static client
Use any static server from the repo root (so the HTML can call `/api/...`). Example:

```
# from repo root
python3 -m http.server 8080
```

Open http://localhost:8080/index.html and ensure the proxy is running on http://localhost:8787. If hosting behind a reverse proxy, route `/api` to the Node server.

## Notes
- Proxy caches responses for ~2 seconds to reduce latency and avoid CORS.
- Endpoints:
  - `/api/fr24`
  - `/api/opensky`
  - `/api/adsb/mil`
  - `/api/adsb/ladd`
  - `/api/aggregate?bbox=west,south,east,north`