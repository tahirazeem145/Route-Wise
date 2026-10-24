# SmartRoute AI — Intelligent Traffic-Aware Route Recommendation API

> **Developer-focused traffic intelligence API and interactive dashboard for evaluating, ranking, and visualizing route alternatives with live congestion delays.**

Built for hackathons, logistics platforms, and mobility integrations.

---

## 1. Project Overview

SmartRoute AI is an API-first service that solves a fundamental challenge for developers: choosing between route alternatives based on **customizable, multi-criteria ranking** rather than blindly taking the default provider recommendation.

Given an origin and a destination, SmartRoute AI:
1. Geocodes locations into coordinates (via TomTom or fallback dictionary).
2. Queries the routing provider for up to 3 driving alternatives with real-time traffic delay metrics.
3. Normalizes geometry and delay data into standard GeoJSON and metric formats.
4. Ranks candidate routes using configurable weights (travel time, traffic delay penalty, distance).
5. Categorizes traffic severity (Green = Low, Yellow = Moderate, Red = Heavy) independently of recommendation ranking.
6. Returns structured JSON with explicit recommendation reasons.
7. Displays routes on an interactive Leaflet map canvas with a live 60-second auto-refresh countdown.

---

## 2. Technology Stack

* **Backend:** Node.js, Express.js, native `fetch`, crypto (SHA-256 for API keys)
* **Frontend:** React 18, Vite, Bootstrap 5, Leaflet, OpenStreetMap tiles
* **Provider:** TomTom Routing & Search APIs (with high-fidelity offline/transparent demo fallback)
* **Testing:** Node.js native test runner (`node --test`), Supertest
* **Data Persistence:** File-based cryptographic key store (`server/data/keys.json`), `localStorage` for client preferences

---

## 3. Project Directory Structure

```text
smart-route-ai/
├── client/                      # React + Vite Frontend
│   ├── src/
│   │   ├── components/          # UI Components
│   │   │   ├── ApiDocsModal.jsx     # Interactive cURL & schema modal
│   │   │   ├── ApiKeyModal.jsx      # API key manager modal
│   │   │   ├── MapView.jsx          # Leaflet map with colored polylines & pins
│   │   │   ├── Navbar.jsx           # Top navigation & system health badge
│   │   │   ├── RouteCard.jsx        # Route card with duration, delay & reasons
│   │   │   ├── RouteCardList.jsx    # Ranked alternative card list
│   │   │   ├── RouteSearchForm.jsx  # Origin/dest inputs, swap & presets
│   │   │   ├── StatusBanner.jsx     # Stale data & demo mode alerts
│   │   │   └── TrafficLegend.jsx    # Map color legend explanation
│   │   ├── services/
│   │   │   └── api.js               # Frontend fetch wrapper with X-API-Key
│   │   ├── utils/
│   │   │   └── formatters.js        # Formatting for duration, km, delay
│   │   ├── App.jsx                  # Root dashboard component & refresh timer
│   │   ├── App.css                  # Custom styling
│   │   └── main.jsx                 # Client entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                      # Express Backend API
│   ├── src/
│   │   ├── config/
│   │   │   └── index.js             # Environment variable loader
│   │   ├── controllers/
│   │   │   ├── developerController.js # GET /api/developer/status
│   │   │   ├── healthController.js    # GET /api/health
│   │   │   └── routeController.js     # POST /recommend, POST /refresh
│   │   ├── middleware/
│   │   │   ├── auth.js              # X-API-Key validation middleware
│   │   │   ├── rateLimiter.js       # Sliding-window rate limiter
│   │   │   └── validate.js          # Request body & coordinate validator
│   │   ├── routes/
│   │   │   ├── developerRoutes.js
│   │   │   ├── healthRoutes.js
│   │   │   └── routeRoutes.js
│   │   ├── services/
│   │   │   ├── geocodingService.js  # TomTom & offline city geocoding
│   │   │   ├── keyManagerService.js # Cryptographic SHA-256 key manager
│   │   │   ├── routeRankingService.js # Multi-criteria ranking engine
│   │   │   ├── tomtomService.js     # TomTom Routing API client
│   │   │   └── trafficSeverityService.js # Green/Yellow/Red classifier
│   │   ├── utils/
│   │   │   ├── logger.js            # Secret-safe console logger
│   │   │   └── response.js          # Standardized JSON response helpers
│   │   ├── app.js                   # Express app setup & middleware
│   │   └── server.js                # Server listener
│   ├── data/
│   │   └── keys.json                # SHA-256 hashes of authorized API keys
│   ├── scripts/
│   │   └── generate-dev-key.js      # CLI tool to generate new development keys
│   ├── tests/                       # Automated test suite (22 tests)
│   │   ├── auth.test.js
│   │   ├── health.test.js
│   │   ├── routeController.test.js
│   │   ├── routeRanking.test.js
│   │   └── trafficSeverity.test.js
│   ├── .env.example
│   └── package.json
├── package.json                 # Monorepo root scripts
├── .gitignore
└── README.md
```

---

## 4. Getting Started & Installation

### Prerequisites
* Node.js v18.0.0 or higher
* npm v9.0.0 or higher

### Quick Start (Under 2 Minutes)

1. **Install dependencies:**
   ```bash
   # From root directory:
   npm install --prefix server
   npm install --prefix client
   ```

2. **Start the backend server (Port 5000):**
   ```bash
   npm run dev:server
   # or: node server/src/server.js
   ```

3. **In a second terminal, start the frontend (Port 5173):**
   ```bash
   npm run dev:client
   # or: npm run dev --prefix client
   ```

4. **Open your browser:**
   Visit **`http://localhost:5173`**. The dashboard will load with an initial route between **Tiruchirappalli** and **Coimbatore** already evaluated and drawn on the map!

---

## 5. Environment Variables & TomTom API Key Configuration

The backend reads configuration from `server/.env`. A pre-configured `.env` is already created with safe development defaults.

```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

# TomTom Routing & Traffic API Credentials
# Get your free API key at https://developer.tomtom.com
TOMTOM_API_KEY=your_actual_tomtom_key_here
TOMTOM_BASE_URL=https://api.tomtom.com
TIMEOUT_MS=8000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=60

# Configurable Ranking Weights
WEIGHT_TIME=0.5
WEIGHT_DELAY=0.3
WEIGHT_DISTANCE=0.2
```

### How to configure a TomTom API Key locally:
1. Register for a free developer account at [developer.tomtom.com](https://developer.tomtom.com).
2. Go to **Dashboard > Keys** and copy your API Key.
3. Paste it into `server/.env`:
   ```env
   TOMTOM_API_KEY=your_copied_key
   ```
4. Restart the backend server.
5. **Note on fallback:** If `TOMTOM_API_KEY` is not provided or runs out of credits, the server runs in a transparent demo mode (`dataSource: "tomtom-fallback-demo"`) with high-fidelity curved road polylines and traffic delays so development is never blocked.

---

## 6. API Key Authentication & Security

All route-related endpoints require the `X-API-Key` HTTP header.

### Security Principles:
* **Hashed Storage:** The server **never** stores plaintext keys. Only cryptographic SHA-256 hashes (`crypto.createHash('sha256')`) are persisted in `server/data/keys.json`.
* **Pre-bootstrapped Key:** For instant testing, a default local hackathon key is automatically provisioned:
  * **Key:** `sra_dev_hackathon_demo_key_2026`
  * Pre-loaded in both the client and server.
* **Issuing New Keys:** You can generate new keys via the CLI anytime:
  ```bash
  npm run generate:key --prefix server "Judge Demo Key"
  ```
  The script displays the key **once** in your terminal and saves its SHA-256 hash.

---

## 7. API Reference

### 1. `GET /api/health`
Public health probe returning service status and provider connectivity.

```bash
curl -X GET http://localhost:5000/api/health
```

**Response (200 OK):**
```json
{
  "success": true,
  "status": "healthy",
  "service": "SmartRoute AI Backend API",
  "version": "1.0.0",
  "uptimeSeconds": 142,
  "provider": {
    "name": "TomTom Routing & Traffic",
    "connected": true,
    "hasRealKey": false
  },
  "timestamp": "2026-10-23T07:15:30.000Z"
}
```

---

### 2. `POST /api/routes/recommend`
Calculates, ranks, and returns route recommendations.

```bash
curl -X POST http://localhost:5000/api/routes/recommend \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sra_dev_hackathon_demo_key_2026" \
  -d '{
    "source": "Tiruchirappalli",
    "destination": "Coimbatore"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "source": {
    "name": "Tiruchirappalli, Tamil Nadu, India",
    "coordinates": { "lat": 10.7905, "lng": 78.7047 }
  },
  "destination": {
    "name": "Coimbatore, Tamil Nadu, India",
    "coordinates": { "lat": 11.0168, "lng": 76.9558 }
  },
  "recommendedRouteId": "route-1",
  "totalAlternativesFound": 3,
  "dataSource": "tomtom-fallback-demo",
  "updatedAt": "2026-10-23T07:15:32.110Z",
  "routes": [
    {
      "id": "route-1",
      "rank": 1,
      "isRecommended": true,
      "rankingScore": 88,
      "distanceMeters": 262500,
      "estimatedDurationSeconds": 15810,
      "trafficDelaySeconds": 360,
      "trafficSeverity": "low",
      "trafficColor": "#22c55e",
      "trafficLabel": "Low Traffic",
      "recommendationReasons": [
        "Fastest estimated travel time among all candidate routes",
        "Lowest traffic congestion delay (+6 mins)"
      ],
      "geometry": [
        [10.7905, 78.7047],
        [10.8251, 78.6412]
      ]
    }
  ]
}
```

---

### 3. `POST /api/routes/refresh`
Polls for updated traffic delays on active endpoints without resetting map viewport.

```bash
curl -X POST http://localhost:5000/api/routes/refresh \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sra_dev_hackathon_demo_key_2026" \
  -d '{
    "source": "Salem",
    "destination": "Bangalore"
  }'
```

---

### 4. `GET /api/developer/status`
Returns safe configuration status for authorized API keys.

```bash
curl -X GET http://localhost:5000/api/developer/status \
  -H "X-API-Key: sra_dev_hackathon_demo_key_2026"
```

---

## 8. Route Ranking Engine & Traffic Severity

### Multi-Criteria Ranking Algorithm
Unlike basic mapping services that merely sort by raw distance, SmartRoute AI computes a normalized multi-criteria cost:

$$\text{Composite Cost} = (w_{\text{time}} \cdot \bar{T}) + (w_{\text{delay}} \cdot \bar{D}) + (w_{\text{dist}} \cdot \bar{L})$$

* $\bar{T}$: Normalized estimated travel time ($[0, 1]$)
* $\bar{D}$: Normalized traffic delay ($[0, 1]$)
* $\bar{L}$: Normalized route distance ($[0, 1]$)
* Default weights: $w_{\text{time}} = 0.5$, $w_{\text{delay}} = 0.3$, $w_{\text{dist}} = 0.2$ (adjustable via UI or request payload)

The candidate with the **lowest composite cost** is assigned **Rank #1 (Recommended Route)**.

### Traffic Severity Thresholds
Congestion severity is computed independently from route rank:

$$\text{Delay Ratio} = \frac{\text{trafficDelaySeconds}}{\text{freeFlowTravelTimeSeconds}}$$

* **Low Traffic (Green `#22c55e`):** $\text{Delay Ratio} < 0.15$
* **Moderate Traffic (Yellow `#eab308`):** $0.15 \le \text{Delay Ratio} < 0.40$
* **Heavy Congestion (Red `#ef4444`):** $\text{Delay Ratio} \ge 0.40$

> **Important Concept:** Recommendation status is decoupled from traffic severity. The recommended route may still experience moderate traffic if all alternative paths are significantly worse.

---

## 9. Automated Testing

The backend includes a comprehensive automated test suite covering all 15 required business logic & API validation scenarios:

```bash
# Run tests:
npm test --prefix server
# or from root:
npm run test:server
```

### Test Suite Results:
* **Total Tests:** 22 passing tests
* **Total Suites:** 5 test files
* **Execution Time:** ~0.75 seconds
* **Coverage:**
  * `health.test.js`: Health status, metadata & uptime
  * `auth.test.js`: Missing header, invalid key, valid key
  * `trafficSeverity.test.js`: Green/Yellow/Red thresholds, zero delay, negative inputs
  * `routeRanking.test.js`: Different travel times, high congestion penalty, missing traffic data, missing geometry, single route edge case, determinism
  * `routeController.test.js`: Missing source, missing destination, empty body, identical locations, end-to-end recommendation, refresh endpoint, direct coordinate objects

---

## 10. Hackathon Demo Walkthrough (3-Minute Script)

1. **Dashboard Overview:** Open `http://localhost:5173`. Show the clean transportation developer UI with the route between Tiruchirappalli and Coimbatore already rendered on the map.
2. **Interactive Map & Polylines:** Click the **Rank #1 (Green)** and **Rank #2 (Yellow/Red)** route cards; point out how the map polyline highlights and tooltips reflect actual travel time differences.
3. **Traffic Legend:** Explain how Rank #1 recommendation status is separated from segment congestion severity.
4. **Custom Ranking Weights:** Click **Configurable Ranking Weights** in the search form, adjust the **Traffic Delay Penalty** slider to maximum, and click **Find & Rank Best Route** to show how routing prioritization dynamically shifts.
5. **Periodic Auto-Refresh:** Toggle the **Auto-refresh (60s)** switch; point out the live countdown timer and the timestamp update when manual refresh is triggered.
6. **API Key Security & Docs:** Click **API Keys** in the navbar to demonstrate SHA-256 key testing. Click **API Docs** to copy a live cURL request and execute it in terminal to show third-party integration capability.

---

## 11. Known Limitations & Technical Scope

* **No User Accounts / Persistent Database:** Designed as an API-first hackathon prototype; uses `localStorage` for demo key caching and file-based SHA-256 hashes for API key authorization.
* **Deterministic Baseline Engine:** The ranking engine is a transparent, deterministic multi-criteria weighted cost model. It does not falsely claim unverified machine learning predictions.
* **Max Alternatives:** Returns up to 3 driving alternatives, which aligns with TomTom Routing API limits.
* **No Turn-by-Turn GPS Navigation:** Built for route recommendation and developer API integration, not turn-by-turn mobile navigation.
