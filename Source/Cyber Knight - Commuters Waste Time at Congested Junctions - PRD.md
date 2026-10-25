# Route Wise — Product Requirements Document (PRD)

**DOCUMENT ID:** PRD-v2.6-GOLD-STANDARD  
**PROJECT NAME:** Route Wise (SmartRoute AI)  
**TEAM:** Cyber Knight  
**AUTHORS:** Lead Software Engineer & Quality Analyst  
**AUDIENCE:** Engineers, Mentors, Evaluators & Evaluator Panel  
**STATUS:** Complete, Approved & Production Verified (99 Automated Tests Passing)  

---

## 1. Product Overview, Goals & Non-Goals

### 1.1 Product Vision
Commuters waste 30 to 45 minutes daily at congested junction bottlenecks without visibility into alternative corridors or transparent trade-offs. **Route Wise** is an intelligent, traffic-aware routing platform and Progressive Web App (PWA) composed of a high-performance Node.js / Express REST API and an obsidian dark glass React 18 / Leaflet web interface. Given any origin and destination, it ingests candidate driving alternatives, ranks them using an Adjusted ETA engine with an anti-flapping switch threshold, incorporates community-verified incidents and 15-minute ML congestion trends, provides municipal authority triage tools, and enables 1-tap handoff to native Google Maps navigation while strictly preserving the chosen corridor.

### 1.2 Product Goals
- **G-1 (Sub-Second Routing & Zero Crashes):** Return ranked driving alternatives within $<450\text{ms}$ under live conditions and $<30\text{ms}$ under offline fail-safe mode with 100% demo availability.
- **G-2 (Anti-Flapping Route Stability):** Prevent erratic GPS route switching by enforcing a strict mathematical hysteresis threshold ($\text{Time Saved} \ge \max(180\text{s}, 10\% \text{ETA})$).
- **G-3 (Community Consensus & Hotspot Triage):** Validate commuter incident reports via a 2-vote consensus engine cross-referenced with $>30\%$ speed-drop telemetry, providing municipal authorities with a 7-day recurrent bottleneck heatmap.
- **G-4 (Corridor-Preserving GMaps Handoff):** Inject non-straight-line decision anchors ($\le 3$ waypoints) into Google Maps directions URLs so commuters do not revert to congested arterials.
- **G-5 (Mobile PWA Readiness):** Deliver an installable Progressive Web App with offline shell caching, native theme coloring (`#0b0f19`), and decoupled 120 FPS search typing.

### 1.3 Non-Goals (Explicitly Out of Scope)
- **NG-1:** Developing a proprietary turn-by-turn spoken audio guidance navigation engine (delegated via verified anchor URLs to Google Maps).
- **NG-2:** Interfacing with physical municipal traffic signal controllers or physical roadside IoT actuator hardware.
- **NG-3:** Supporting pedestrian, bicycle, or transit timetables (focus is strictly on two-wheeler and four-wheeler urban driving corridors).

---

## 2. End-to-End User Experience & Interaction Flows

The end-to-end journey of a commuter or dispatcher using Route Wise proceeds through 7 deterministic steps:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 1. Clean     │ ──> │ 2. Live      │ ──> │ 3. Community │ ──> │ 4. Adjusted  │
│    Input /   │     │    Ingestion │     │    Telemetry │     │    ETA       │
│    Presets   │     │    (TomTom)  │     │    Overlay   │     │    Ranking   │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                       │
┌──────────────┐     ┌──────────────┐     ┌──────────────┐             │
│ 7. Authority │ <── │ 6. GMaps     │ <── │ 5. Glass     │ <───────────┘
│    Hotspot   │     │    Anchor    │     │    PWA UI &  │
│    Triage    │     │    Handoff   │     │    ARIMA HUD │
└──────────────┘     └──────────────┘     └──────────────┘
```

| Step | Interaction Phase | System Action & Technical Detail | Example (Trichy Corridor: CBS ⇄ Thillai Nagar) |
| :---: | :--- | :--- | :--- |
| **1** | **Input & Geocoding** | User opens app in clean idle state centered on Trichy (`[10.8100, 78.6920]`, zoom 13). User clicks a quick preset badge or types a custom location. Autocomplete queries 12 known collision junctions with 0ms delay and 5-min memory caching. | Clicks `CBS ⇄ Chathiram` preset. Origin and destination fields populate instantly with coordinates. |
| **2** | **Multi-Route Ingestion** | Express server queries TomTom Routing API requesting candidate driving paths. Ingests distance (m), baseline travel time (s), real-time live traffic delay (s), and GeoJSON polylines. | Ingests Route #1 (City Arterial: 10.0 km, +18m delay) and Route #2 (Collector Bypass: 12.5 km, +2m delay). |
| **3** | **Incident & ML Overlay** | Queries native SQLite store (`node:sqlite` WAL mode) for active incident reports within the route corridor. Ingests speed-drop telemetry correlation and runs ARIMA (1,0,1) model for +15m, +30m, and +45m horizons. | Detects unverified `signal_failure` report at HPO Junction; correlates with 72% speed drop on TomTom corridor. |
| **4** | **Adjusted ETA Ranking** | Ranks candidate routes primarily by Adjusted ETA without double-counting delay. Applies Switch Threshold: Alternative route recommended only if `timeSaved >= max(180s, 0.10 * mainRouteEta)`. | Evaluates Route #2: saves 16 minutes ($>180\text{s}$ and $>10\%$). Route #2 promoted to Recommended #1 pick! |
| **5** | **Reactive Visualization** | Renders color-coded polylines on Leaflet map. Displays obsidian dark glass route cards, comparative trade-off tags, 15-minute velocity sparklines, and verified incident pulse markers. | Commuter reviews Route #2 card: *"Fastest path — Avoids 16 mins of junction delay"*. |
| **6** | **Navigation Handoff** | User clicks *"Start Navigation in Google Maps"*. Route Wise extracts up to 3 non-straight-line decision anchors ($\le 3$ waypoints, $< 2,048$ chars) preserving the bypass corridor on external navigation. | Launches Google Maps with waypoints forcing navigation along Collector Bypass instead of reverting to HPO Junction. |
| **7** | **Authority Triage** | Municipal traffic dispatchers access `/api/authority/hotspots` (`X-Authority-Role: admin`) to view 7-day recurrent collision bottlenecks and log 1-click resolution audit trails. | Traffic police clears resolved signal failure; status updates across all connected clients on next 60s cycle. |

---

## 3. Epics & Functional Requirements (FR-1 to FR-13)

### Epic 1: Resilient Geocoding & Route Ingestion
- **FR-1: Smart Geocoder & Resilient Dictionary [Must Have]**
  - *Description:* Converts plain text street/city names into latitude/longitude pairs. Includes a verified dictionary of 12 Tiruchirappalli collision junctions and key Tamil Nadu corridors. Automatically falls back to offline dictionary if network fails or API quota is exceeded.
  - *Acceptance Criteria:* Returns coordinates in $<300\text{ms}$ live and $<5\text{ms}$ fallback. Never throws unhandled exception on invalid query.
- **FR-2: Multi-Route Ingestion Engine [Must Have]**
  - *Description:* Requests candidate driving routes from TomTom Routing API with real-time live traffic delay metrics and GeoJSON polyline geometry.
  - *Acceptance Criteria:* Retrieves up to 3 viable alternatives with separate distance (km), baseline duration (s), and traffic delay (s).

### Epic 2: Intelligent Ranking & Machine Learning
- **FR-3: Adjusted ETA & Anti-Flapping Ranking Engine [Must Have]**
  - *Description:* Ranks candidate alternatives primarily by Adjusted ETA without double-counting delay. Applies strict hysteresis switch threshold: `timeSaved >= max(180s, 0.10 * mainRouteEta)`.
  - *Acceptance Criteria:* Alternative route is only promoted if it saves at least 3 minutes (180s) or 10% of main ETA. Prevents route flapping.
- **FR-4: ARIMA (1,0,1) Time-Series Traffic Forecasting [Should Have]**
  - *Description:* Integrates public open-source `zemlyansky/arima` WebAssembly ML model to forecast velocity trends and delay spikes across +15m, +30m, and +45m horizons.
  - *Acceptance Criteria:* Computes 3-horizon prediction array in $<20\text{ms}$ using rolling 12-interval velocity history.

### Epic 3: High-Performance Data Persistence
- **FR-5: Native SQLite WAL Store [Should Have]**
  - *Description:* Stores community reports, user votes, authority audit records, and spatial index using Node 24 native SQLite (`node:sqlite`). Operates in Write-Ahead Logging (`PRAGMA journal_mode = WAL`) mode with automated migrations.
  - *Acceptance Criteria:* Zero native C++ compilation dependencies; concurrent reads never block writes; automated transactions ensure data integrity.

### Epic 4: Crowd Consensus & Incident Intelligence
- **FR-6: Structured Community Incident Reporting [Should Have]**
  - *Description:* Commuters report 6 structured incident categories (`congestion`, `roadblock`, `roadwork`, `procession`, `signal_failure`, `waterlogging`). Merges duplicate reports within 100 meters.
  - *Acceptance Criteria:* Rate-limited to 10 reports per 15 minutes per pseudonymous user key. Merges duplicates and increments report count.
- **FR-7: Dual-Gate Verification Consensus Engine [Should Have]**
  - *Description:* Auto-verifies unverified reports when $\ge 2$ positive community votes arrive OR when TomTom telemetry detects a $>30\%$ speed-drop correlation.
  - *Acceptance Criteria:* Auto-transitions status from `unverified` to `verified` when consensus condition is met.
- **FR-8: Interactive Leaflet Markers & Voting HUD [Should Have]**
  - *Description:* Renders verified incidents with solid halo + checkmark badge; renders unverified incidents with dashed yellow border + question mark. Commuters cast 1-tap "Still Active" or "Cleared" votes in popup.
  - *Acceptance Criteria:* Voting updates live count immediately; prevents duplicate votes by the same pseudonymous user.

### Epic 5: Municipal Authority Operations
- **FR-9: Municipal Authority Hotspot Triage & Audit Portal [Should Have]**
  - *Description:* Protected console (`X-Authority-Role: admin`) ranking active incidents by severity and 7-day spatial recurrence within 150m. Enables 1-click resolution with officer audit logging.
  - *Acceptance Criteria:* Rejects non-admin requests with `403 Forbidden`. Logs `resolvedAt` and `resolvedBy` timestamped audit records.

### Epic 6: Navigation Interoperability
- **FR-10: Google Maps Corridor-Preserving Handoff [Should Have]**
  - *Description:* Extracts up to 3 non-straight-line decision anchors ($\le 3$ waypoints) from the chosen route polyline and builds a verified Google Maps universal directions URL ($<2,048$ characters) with travel mode selection (`driving`, `two-wheeler`).
  - *Acceptance Criteria:* URL opens Google Maps app directly without reverting to congested primary arterial.

### Epic 7: Real-Time Telemetry & PWA Experience
- **FR-11: 60-Second Live Auto-Refresh & Heatmap [Could Have]**
  - *Description:* Visual circular countdown timer automatically triggers `POST /api/routes/refresh` every 60 seconds. Renders TomTom raster traffic flow tiles and regional congestion corridor heatmap.
  - *Acceptance Criteria:* In-memory caching for raster tiles (1-hour TTL, 1ms response). Polling pauses when browser tab is inactive.
- **FR-12: Progressive Web App (PWA) Shell Caching [Could Have]**
  - *Description:* W3C manifest (`display: standalone`, `#0b0f19` theme) and Service Worker (`sw.js`) implementing Network-First navigation with fallback cache for static assets.
  - *Acceptance Criteria:* Installs to home screen on mobile browsers; shell loads offline with zero crash.
- **FR-13: Trichy Junction Presets & Decoupled UX [Could Have]**
  - *Description:* 6 compact corridor presets (`CBS ⇄ Chathiram`, `Chathiram ⇄ Srirangam`, `NIT Trichy ⇄ Central Bus Stand`, etc.), 120 FPS decoupled typing with 300ms debounce, and quick swap controls.
  - *Acceptance Criteria:* Input field typing remains fluid at 120 FPS; preset click executes geocoding in 0ms.

---

## 4. Technical Architecture, REST API Contracts & Data Schema

### 4.1 System Architecture
```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER (Vite / React 18)                   │
│  • PWA Shell & Service Worker (sw.js)  • Leaflet Interactive Map       │
│  • Obsidian Glassmorphic Dashboard     • Decoupled Search Typing (120 FPS)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ JSON / REST (X-API-Key)
┌───────────────────────────────────▼────────────────────────────────────┐
│                    API SERVICE TIER (Node.js / Express)                │
│  • SHA-256 API Key Auth (100 req/min) • Input Sanitization Middleware  │
│  • Multi-Criteria Adjusted ETA Engine • Anti-Flapping Hysteresis Logic │
│  • Authority Admin Guard Middleware   • Raster Tile Cache (1-hr TTL)   │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │                               │
┌───────────────────▼─────────────┐   ┌─────────────▼────────────────────┐
│    DATA PERSISTENCE LAYER       │   │      AI & TELEMETRY LAYER        │
│ • Native Node 24 SQLite Store   │   │ • TomTom Live Routing & Flow API │
│ • WAL Mode & Transactions       │   │ • Public ARIMA (1,0,1) ML Engine │
│ • Reports, Votes & Audit Tables │   │ • Offline Coordinate Dictionary  │
└─────────────────────────────────┘   └──────────────────────────────────┘
```

### 4.2 REST API Specification Table

| Endpoint | Method | Authentication | Payload / Parameters | Success Response | Latency Target |
| :--- | :---: | :---: | :--- | :--- | :---: |
| `/api/routes/recommend` | **POST** | `X-API-Key` | `{ origin, destination, weights? }` | `200 OK`: Ranked routes array with GeoJSON, Adjusted ETA, delay, and trade-off rationale. | $< 350\text{ms}$ |
| `/api/routes/refresh` | **POST** | `X-API-Key` | `{ routeIds: [...] }` | `200 OK`: Fresh delay metrics and recalculated scores without re-geocoding coordinates. | $< 250\text{ms}$ |
| `/api/routes/locations/search`| **GET** | Public | `?query=trichy` | `200 OK`: Typeahead autocomplete array with 0ms verified junction matching and `isJunction` tag. | $< 15\text{ms}$ |
| `/api/reports` | **POST** | Pseudonymous Key | `{ category, lat, lon, description }`| `201 Created`: Incident record ID, merged status, and verification state. | $< 50\text{ms}$ |
| `/api/reports/nearby` | **GET** | Public | `?lat=10.8&lon=78.6&radiusM=5000` | `200 OK`: Active verified and unverified reports within radius. | $< 30\text{ms}$ |
| `/api/reports/:id/votes` | **POST** | Pseudonymous Key | `{ vote: 'yes' \| 'no' }` | `200 OK`: Updated vote tally; auto-transitions to `verified` at 2 votes. | $< 35\text{ms}$ |
| `/api/authority/hotspots` | **GET** | `X-Authority-Role`| None | `200 OK`: Ranked active incidents with 7-day spatial recurrence count. | $< 40\text{ms}$ |
| `/api/authority/reports/:id/resolve`| **POST**| `X-Authority-Role`| `{ officerNotes?: string }` | `200 OK`: Resolved incident object with `resolvedAt` audit timestamp. | $< 40\text{ms}$ |
| `/api/traffic/tiles/:z/:x/:y.png`| **GET** | Public | Path parameters: z, x, y | `200 OK`: In-memory cached TomTom PNG traffic flow tile. | $< 5\text{ms}$ |
| `/api/health` | **GET** | Public | None | `200 OK`: System status, TomTom connectivity, SQLite health, uptime. | $< 15\text{ms}$ |

### 4.3 SQLite Database Schema (Production Schema)
- `reports (id TEXT PK, category TEXT, lat REAL, lon REAL, description TEXT, status TEXT, votes_yes INT, votes_no INT, reporter_key TEXT, created_at INT)`
- `votes (id TEXT PK, report_id TEXT FK, user_key TEXT, vote TEXT, created_at INT, UNIQUE(report_id, user_key))`
- `incident_resolutions (id TEXT PK, report_id TEXT FK, resolved_by TEXT, notes TEXT, resolved_at INT)`
- `spatial_index`: Indexes on `reports(lat, lon)` and `reports(status, created_at)` ensuring sub-millisecond proximity queries.

---

## 5. Non-Functional Requirements (NFRs)

| NFR Category | Requirement Specification | Architecture Implementation & Verification |
| :--- | :--- | :--- |
| **NFR-1: Performance** | p95 API response $< 450\text{ms}$; 1-hr raster tile cache $< 5\text{ms}$. | In-memory tile cache, decoupled client typing, and native SQLite WAL mode. |
| **NFR-2: Security** | Cryptographic SHA-256 API key hashing; sliding rate-limiting (100 req/min). | Keys hashed via `node:crypto`; secrets redacted from logs; `X-Authority-Role` guard. |
| **NFR-3: Zero-Crash Availability** | 100% demo availability even if external TomTom API or network drops. | High-fidelity coordinate dictionary fallback; Service Worker offline shell cache. |
| **NFR-4: Usability & CWV** | 120 FPS fluid search typing; Cumulative Layout Shift (CLS) $< 0.05$. | 300ms search debounce; fixed container map aspect ratios; obsidian glass UI. |
| **NFR-5: Compliance** | WCAG 2.1 AA compliant contrast; zero telemetry tracking of user identity. | Contrast ratios $> 4.8:1$ across all text; pseudonymous client keys stored in `localStorage`. |

---

## 6. Automated Test Coverage & Verification

Route Wise enforces 100% test pass verification across the monorepo via standard Node test runners (`node --test`):

```
======================================================================
TEST SUITE SUMMARY: 99 / 99 TESTS PASSING (100% SUCCESS RATE)
======================================================================
• Backend Test Suite (server/test/):  75 Passing  |  0 Failing  |  0 Skipped
  - SQLite WAL schema & migrations (12 tests)
  - 2-vote consensus engine & speed-drop correlation (18 tests)
  - Adjusted ETA & anti-flapping threshold (14 tests)
  - Municipal authority role guards & resolution audit (11 tests)
  - TomTom traffic tile proxy & caching (8 tests)
  - Route recommendation controllers & geocoder fallback (12 tests)

• Frontend Test Suite (client/test/): 24 Passing  |  0 Failing  |  0 Skipped
  - Google Maps decision-anchor waypoint extraction (7 tests)
  - URL length compliance (<2048 chars) (5 tests)
  - Anonymous pseudonymous user key storage (4 tests)
  - Route card formatters & severity color-coding (8 tests)
======================================================================
```

---

## 7. Release Criteria & 2-Minute Judge Live Demo Script

### 7.1 Release Criteria (Definition of Done)
1. **Automated Verification:** 100% of 99 unit/integration tests must pass without skips or warnings.
2. **Build Integrity:** `npm run build` in `client/` compiles cleanly in $< 2.0\text{s}$ with zero lint or TypeScript errors.
3. **PWA Compliance:** Service worker registers cleanly; W3C manifest passes audit; offline shell loads when disconnected.
4. **Documentation Sync:** MRD, PRD, and combined master PDF documents generated and synchronized across `client/public/`.

### 7.2 2-Minute Live Demo Walkthrough for Evaluators
- **Step 1 (Launch & PWA Showcase — 20s):** Open the application. Highlight the clean startup state centered on Trichy, the obsidian dark glassmorphism, and the installable PWA badge.
- **Step 2 (Select Preset Corridor — 30s):** Click the compact `CBS ⇄ Chathiram` corridor preset. Note 0ms autocomplete matching. The system ingests candidate routes from TomTom live telemetry.
- **Step 3 (Explain Adjusted ETA & Trade-Offs — 40s):** Show how Route #2 is recommended because it saves 16 minutes of junction delay despite being 2.5 km longer. Point out the anti-flapping threshold tag and the ARIMA 15-minute forecasting HUD.
- **Step 4 (Community Verification, Handoff & Tests — 30s):** Point out active incident markers (verified solid pulse vs unverified dashed). Click *"Start Navigation in Google Maps"* to demonstrate decision-anchor corridor preservation. Conclude by highlighting our **99 automated tests passing at 100%**.
