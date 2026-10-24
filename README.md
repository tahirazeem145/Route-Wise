# RouteWise (SmartRoute AI) — Intelligent Traffic-Aware Route Recommendation & Community Advisory Platform

> **Developer-focused traffic intelligence API and interactive commuter dashboard for evaluating, ranking, and visualizing route alternatives with live congestion delays, community incident verification, municipal authority hotspot triage, and native Google Maps navigation handoff.**

Built for hackathons, municipal transport dispatchers, commuters, and logistics fleet integrations.

---

## 1. Project Overview & Capabilities

RouteWise is an API-first routing and traffic advisory platform that solves junction bottlenecks and congested arterial delays through:
1. **Multi-Route Ingestion & Geocoding:** Converts location queries or map pins to coordinates via TomTom Routing and Search APIs (with resilient offline dictionary fallback).
2. **Route-Ranking Overhaul & Switch Threshold:** Ranks primarily by Adjusted ETA without double-counting provider delay. Applies a strict Switch Threshold (`timeSaved >= max(180s, 0.10 * mainRouteEta)`) to prevent erratic recommendation flapping.
3. **F4 Community Incident Reporting:** Commuters report 6 structured conditions (`congestion`, `roadblock`, `roadwork`, `procession`, `signal_failure`, `waterlogging`). Automatic deduplication within 100 meters.
4. **2-Vote Verification & Telemetry Engine:** Reports automatically transition from *Unverified* to *Verified* upon 2 community confirmations or when correlated with a TomTom speed-drop (&gt;30%).
5. **Interactive Leaflet Map with One-Tap Voting:** Verified incidents render with solid pulses and green checkmarks; unverified incidents render with dashed outlines and warning symbols. Commuters can confirm or deny conditions directly inside Leaflet popups.
6. **F5 Municipal Authority Console:** Protected dashboard (`X-Authority-Role: admin`) ranking active corridor hotspots by impact and age, calculating 7-day spatial recurrence within 150m, and enabling 1-click incident resolution with officer audit trails.
7. **Google Maps Corridor Handoff:** Extracts up to 3 non-straight-line decision anchors ($\le 3$ waypoints, safe URL length $< 2,048$ characters) to guarantee Google Maps directions retain RouteWise's bypass corridor with driving and two-wheeler support.
8. **Persistent Native SQLite Storage:** Built on Node 24's native `node:sqlite` (`DatabaseSync`) with Write-Ahead Logging (WAL) and spatial bounding-box Haversine indexing. Zero external C++ compilation dependencies.

---

## 2. Technology Stack

* **Backend:** Node.js 24, Express.js, native `node:sqlite` (`DatabaseSync`), native `fetch`, crypto (SHA-256 for API keys)
* **Frontend:** React 18, Vite, Leaflet, OpenStreetMap tiles, Lucide React icons, Bootstrap 5 dark glassmorphism
* **Routing Telemetry Provider:** TomTom Routing & Traffic Flow Raster Tile APIs (with high-fidelity offline/transparent demo fallback)
* **Automated Testing:** Node.js native test runner (`node --test`), Supertest
* **Data Persistence:** Native SQLite database (`server/data/routewise.db`), SHA-256 key store (`server/data/keys.json`), `localStorage` for pseudonymous UUID user keys

---

## 3. Project Directory Structure

```text
Route-Wise/
├── client/                               # React 18 + Vite Frontend
│   ├── src/
│   │   ├── components/                   # UI Components
│   │   │   ├── ApiDocsModal.jsx          # Interactive cURL & schema modal
│   │   │   ├── ApiKeyModal.jsx           # API key manager modal
│   │   │   ├── AuthorityDashboard.jsx    # F5 Municipal Authority Console modal
│   │   │   ├── MapView.jsx               # Leaflet map, traffic flow tiles & interactive pins
│   │   │   ├── Navbar.jsx                # Top nav, theme selector, health badge & triggers
│   │   │   ├── ReportIncidentModal.jsx   # F4 accessible <dialog> crowd report modal
│   │   │   ├── RouteCard.jsx             # Card with duration, delay, tags & Google Maps button
│   │   │   ├── RouteCardList.jsx         # Ranked alternative card list
│   │   │   ├── RouteSearchForm.jsx       # Origin/dest inputs, swap & presets
│   │   │   ├── StatusBanner.jsx          # Stale data & demo mode alerts
│   │   │   └── TrafficLegend.jsx         # Legend explaining tiers, flow & F4 indicators
│   │   ├── services/
│   │   │   └── api.js                    # Fetch wrapper with API keys, reports & authority
│   │   ├── utils/
│   │   │   ├── formatters.js             # Formatting for duration, km, delay & comparison
│   │   │   ├── googleMapsHandoff.js      # Anchor extraction algorithm & handoff URL builder
│   │   │   └── userKey.js                # Pseudonymous UUID in localStorage
│   │   ├── App.jsx                       # Root dashboard component & state orchestrator
│   │   ├── App.css                       # Obsidian glass design system & custom markers
│   │   └── main.jsx                      # Client entry point
│   ├── tests/                            # 24 Automated Frontend Unit Tests
│   │   ├── formatters.test.js
│   │   ├── googleMapsHandoff.test.js
│   │   └── userKey.test.js
│   └── package.json
├── server/                               # Express 4 Backend API
│   ├── src/
│   │   ├── config/                       # Environment configuration
│   │   ├── controllers/
│   │   │   ├── authorityController.js    # F5 Hotspots & incident resolution
│   │   │   ├── developerController.js    # Developer status & key validation
│   │   │   ├── healthController.js       # Health endpoint & uptime
│   │   │   ├── incidentController.js     # F4 Reporting, deduplication & voting
│   │   │   └── routeController.js        # Recommendation, ranking & refresh
│   │   ├── middleware/
│   │   │   ├── auth.js                   # X-API-Key SHA-256 validator
│   │   │   ├── authorityAuth.js          # X-Authority-Role: admin validator
│   │   │   ├── rateLimiter.js            # Sliding-window rate limiter
│   │   │   └── validate.js               # Coordinate & body schema validation
│   │   ├── models/
│   │   │   └── db.js                     # Native Node 24 SQLite DatabaseSync layer
│   │   ├── routes/                       # Express route routers
│   │   ├── services/
│   │   │   ├── geocodingService.js       # Geocoding & coordinate dictionary
│   │   │   ├── routeRankingService.js    # Adjusted ETA & switch threshold ranking
│   │   │   ├── tomtomService.js          # TomTom Routing API client & proxy
│   │   │   └── trafficSeverityService.js # Green/Yellow/Red traffic classifier
│   │   ├── app.js                        # Express application setup & middleware
│   │   └── server.js                     # Server entry point
│   ├── data/
│   │   ├── routewise.db                  # Native SQLite database (WAL mode)
│   │   └── keys.json                     # SHA-256 hashes of authorized API keys
│   ├── tests/                            # 75 Automated Backend Tests
│   │   ├── auth.test.js
│   │   ├── authority.test.js
│   │   ├── db.test.js
│   │   ├── health.test.js
│   │   ├── incidentController.test.js
│   │   ├── routeController.test.js
│   │   ├── routeRanking.test.js
│   │   ├── trafficSeverity.test.js
│   │   └── trafficTiles.test.js
│   └── package.json
└── package.json                          # Monorepo orchestrator
```

---

## 4. API Specification & Endpoints

### 4.1 Route Recommendations & Navigation
* `POST /api/routes/recommend` — Takes `source` and `destination` (names or `{ lat, lng }`), returns candidate driving routes ranked by Adjusted ETA with switch threshold reasons.
* `POST /api/routes/refresh` — Fast re-evaluation of traffic delays on existing corridors without re-geocoding.
* `GET /api/routes/locations/search?q=query` — Search autocomplete for Tamil Nadu and national cities.

### 4.2 F4 Community Incident Reporting
* `POST /api/reports` — Commuters submit structured reports (`congestion`, `roadblock`, `roadwork`, `procession`, `signal_failure`, `waterlogging`). Duplicates within 100m are automatically merged as confirmation votes.
* `GET /api/reports/nearby?lat=...&lng=...&radiusM=...` — Returns active verified and unverified reports within specified radius.
* `POST /api/reports/:id/votes` — Commuters vote `yes` (Still Active) or `no` (Cleared). Two confirmations auto-verify the report.

### 4.3 F5 Municipal Authority Console
* `GET /api/authority/hotspots?windowDays=7` (Requires `X-Authority-Role: admin`) — Returns active verified incidents ranked by delay impact and age, enriched with 7-day spatial recurrence counts within 150m.
* `POST /api/authority/reports/:id/resolve` (Requires `X-Authority-Role: admin`) — Marks incident as `Resolved` and records `resolvedAt` and `resolvedBy` audit fields.

### 4.4 Traffic Flow & Telemetry
* `GET /api/traffic/tiles/:z/:x/:y.png` — Proxies live TomTom raster traffic flow tiles to keep API keys secure.
* `GET /api/traffic/status` — Checks live TomTom connectivity and key validity.
* `GET /api/health` — System status, uptime, and database health.

---

## 5. Automated Testing (99 Tests Passing at 100%)

The test suite runs with Node.js native test runner:

```bash
# Run server test suite (75 tests):
cd server && npm test

# Run client test suite (24 tests):
cd client && npm test

# Build client production bundle:
cd client && npm run build
```

### Test Coverage Highlights:
- **Server (75 tests):**
  - `routeRanking.test.js` (15 tests): Adjusted ETA ranking, no delay double-counting, switch threshold `max(180s, 0.10 * mainRouteEta)`, edge cases.
  - `db.test.js` (15 tests): SQLite schema, constraints, duplicate merging, voting lifecycle, 7-day recurrence.
  - `authority.test.js` (6 tests): Auth enforcement, 401s, hotspot ranking, resolution audit fields.
  - `incidentController.test.js` (10 tests): Submission validation, duplicate merging, 2-vote verification, voting deduplication.
  - `routeController.test.js` (14 tests): Geocoding, coordinates, recommendation, refresh, autocomplete.
  - `trafficSeverity.test.js` (5 tests): Severity categorization.
  - `trafficTiles.test.js` (3 tests): Proxy status and image endpoints.
  - `auth.test.js` & `health.test.js` (7 tests): API key authentication and health status.
- **Client (24 tests):**
  - `googleMapsHandoff.test.js` (8 tests): Decision anchor extraction ($\le 3$ waypoints), URL generation, 2048 char safety limit, two-wheeler mode.
  - `formatters.test.js` (14 tests): Duration, distance, delay formatters, cross-route comparison text.
  - `userKey.test.js` (2 tests): Anonymous user key generation and `localStorage` persistence.

---

## 6. How to Run Locally

### Prerequisites
- Node.js 20 or 24 LTS

### Setup & Launch
```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Start backend server (Port 5000)
cd server && npm run dev

# 3. Start frontend dev server (Port 5173)
cd client && npm run dev
```

Open `http://localhost:5173` in your browser.
