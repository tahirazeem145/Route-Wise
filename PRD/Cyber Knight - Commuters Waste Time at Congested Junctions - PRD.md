# Route Wise — Product Requirements Document (PRD)

**DOCUMENT:** PRD-v2.0  
**TEAM:** Cyber Knight  
**AUDIENCE:** Engineers & Mentors  
**STATUS:** Production Ready  

---

### Product Overview & Goal
Commuters waste 30 to 45 minutes at congested junction bottlenecks without knowing which nearby route is less crowded. **Route Wise** is an intelligent, traffic-aware routing system composed of an Express REST API and an interactive React/Leaflet dashboard. Given any origin and destination, it retrieves up to 3 driving alternatives, ranks them mathematically using customizable penalty weights for traffic delay, predicts future velocity trends via an **ARIMA (1,0,1)** machine learning model, and provides transparent side-by-side explanations for every recommendation.

---

## 1. How It Works in Real-Time: Step-by-Step Flow

To easily explain how the system works to mentors and judges, here is the exact 5-step journey of a single user request:

| Step | System Action | Real-Time Example (Trichy: Central Bus Stand to Coimbatore) |
| :--- | :--- | :--- |
| **Step 1: Input** | **Geocodes Locations** | User enters origin 'Tiruchirappalli' and destination 'Coimbatore'. Geocoding service converts them to GPS coordinates via TomTom (with instant offline dictionary fallback). |
| **Step 2: Ingest** | **Fetches 3 Paths** | Queries TomTom Routing API for all candidate driving alternatives. Ingests distance (km), baseline free-flow travel time (s), and real-time live traffic congestion delay (s). |
| **Step 3: Forecast** | **ARIMA ML Prediction** | Feeds 12-step rolling velocity series into open-source **ARIMA (1,0,1)** model from GitHub to project speed changes and delay spikes at +15m, +30m, and +45m horizons. |
| **Step 4: Score** | **Applies Scoring Formula** | Applies composite weighting: `Score = (50% × Time) + (35% × Delay) + (15% × Distance)`. Heavily penalizes stop-and-go junction gridlock and ranks Route #1 as top pick. |
| **Step 5: Display** | **Interactive Dashboard** | Draws color-coded polyline paths on Leaflet map. Displays pitch-black glass route cards, 15-minute ARIMA forecast HUD, and side-by-side comparison matrix with 60s auto-refresh. |

---

## 2. Core Functional Requirements (What We Built)

| Feature ID | Module Name | What It Does (Simple English) | Status |
| :--- | :--- | :--- | :---: |
| **FR-1** | **Smart Geocoder** | Converts plain text city/street names to coordinates. If internet or API fails, instantly switches to offline dictionary so demo never crashes. | Complete |
| **FR-2** | **Multi-Route Fetcher** | Requests candidate driving routes from TomTom Routing API with real-time live traffic delay metrics and polyline geometry. | Complete |
| **FR-3** | **ARIMA Traffic Forecast** | Integrates public open-source `zemlyansky/arima` WebAssembly ML model from GitHub to project speed and transit delay over 15m, 30m, and 45m horizons. | Complete |
| **FR-4** | **Weighted Scoring Engine** | Ranks routes mathematically based on Time, Delay Penalty, and Distance. The route with the highest overall score (0-100) is recommended as #1. | Complete |
| **FR-5** | **Explainable Comparison** | Generates human-readable trade-off reasons (e.g. *"Saves 14m travel time & 37.1 km shorter vs Alt #2"*) and a full side-by-side comparison matrix. | Complete |
| **FR-6** | **API Key Security** | Requires `X-API-Key` header. Keys are cryptographically hashed using SHA-256 with rate-limiting (100 req/min) and developer status endpoint. | Complete |
| **FR-7** | **Leaflet Map Dashboard** | Interactive React 18 map showing colored polylines, start/end pins, route summary cards, and quick city preset buttons (Trichy, Salem, Chennai). | Complete |
| **FR-8** | **Live Auto-Refresh (60s)** | A visual 60-second countdown timer that automatically refreshes delay metrics and re-evaluates ranking without reloading the page. | Complete |

---

## 3. Technical Architecture, APIs, NFRs & Roadmap

### 3.1 System Architecture: Clean 3-Tier Design
- **Frontend:** React 18 + Vite + Leaflet maps + Bootstrap 5 dark glassmorphism.
- **Backend:** Node.js + Express.js REST API with input validation & SHA-256 authentication.
- **AI/ML Layer:** Public open-source **ARIMA (1,0,1)** time-series model (`zemlyansky/arima`) + TomTom Traffic Flow & Routing API with resilient coordinate dictionary fallback.

### 3.2 REST API Endpoints Specification

| Endpoint | Method & Auth | What It Does & Expected Response | Response Time |
| :--- | :--- | :--- | :--- |
| `/api/routes/recommend` | **POST**<br/>`X-API-Key` required | Accepts origin & destination. Returns ranked routes with GeoJSON coordinates, duration, traffic delay, ARIMA 15m forecast, and comparative trade-off rationale. | < 350ms (Live)<br/>< 30ms (Fallback) |
| `/api/routes/refresh` | **POST**<br/>`X-API-Key` required | Refreshes live traffic delay and re-computes ranking scores for existing routes without re-geocoding locations. | < 250ms (Live)<br/>< 20ms (Fallback) |
| `/api/health` | **GET**<br/>Public (No auth) | Returns system status, TomTom connectivity state, ARIMA model readiness, and server uptime. | < 15ms |
| `/api/developer/status` | **GET**<br/>`X-API-Key` required | Validates API key and returns remaining quota and rate-limit status. | < 20ms |

### 3.3 Performance, Security & Automated Test Coverage

- **API Speed (Latency):** < 450 ms response time with streamlined native fetch and local cache.
- **Zero-Crash Reliability:** Built-in coordinate dictionary and network timeout fallback ensure routes display even if internet or TomTom quota fails.
- **Automated Test Suite:** Followed Addy Osmani's `test-driven-development` skill from GitHub. **40 automated tests** (11 client tests + 29 backend tests) passing at 100%.

### 3.4 Product Roadmap (Now vs Next)

| Phase | Timeline | Key Features & Deliverables |
| :--- | :--- | :--- |
| **Phase 1: Hackathon MVP** | Current (Q4 2026) | Core 3-route ranking engine, Leaflet map, ARIMA 15m traffic forecast, comparative matrix, dark glass cards, 40 automated tests. |
| **Phase 2: Multi-Stop Fleet** | Q1 2027 | Multi-stop traveling salesperson delivery sequencing, automated webhook alerts on unexpected congestion spikes, Python SDK. |
| **Phase 3: Smart EV Fleet** | Q2 2027 | Electric Vehicle (EV) battery consumption optimization, hill-incline factor, weather condition overlays, enterprise fleet portal. |

### 3.5 2-Minute Live Demo Script for Judges

- **Step 1 (Open Dashboard):** Show the clean pitch-black dark glass dashboard, Leaflet map, and 'AI Engine Live' badge.
- **Step 2 (Click Preset):** Click 'Trichy → Coimbatore' preset pill. Origin and destination populate automatically and 3 routes calculate instantly.
- **Step 3 (Explain the Ranking):** Point out how Route #1 is recommended because it saves 14 minutes and bypasses junction gridlock. Show the Side-by-Side Comparison Matrix.
- **Step 4 (Show 15-Min ARIMA Forecast & Tests):** Point to the 15-Min ARIMA ML forecast HUD and mention our 40 automated tests passing at 100%.
