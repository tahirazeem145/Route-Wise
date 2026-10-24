# Product Requirements Document (PRD)

**Document Title:** Cyber Knight - Commuters Waste Time at Congested Junctions - PRD  
**Team Name:** Cyber Knight  
**Problem Statement:** Commuters waste time at congested junctions without knowing which nearby route is less crowded. Build a traffic advisory tool that suggests alternative routes based on congestion.  
**Project Name:** RouteWise - Junction-Centric Adaptive Traffic Advisory System  
**Hackathon:** JJCET AI-PDLC Hackathon 2026 | Gate 3 (Form 3 - 20 Marks)  
**Document Version:** 1.0 (Final Deliverable)  
**Date:** October 24, 2026  
**Target Reviewer / Mentor:** Mr. Vetri Sir & Hackathon Evaluation Jury  

---

## Executive Summary & Alignment to MRD

RouteWise addresses the systemic issue of urban junction gridlock in dense Tier-2 corridors (e.g., Tiruchirappalli, Coimbatore, Madurai). While legacy mapping tools optimize solely for end-to-end trip duration—often funneling thousands of drivers simultaneously into the same major bottlenecks—RouteWise focuses on **junction-level micro-telemetry**, **transparent multi-criteria alternative route ranking**, and **cross-route comparative reasoning**.

This PRD formalizes the requirements for Gate 3, strictly adhering to the **Scope Discipline** mandate: **Maximum 3 Must-Have features** that guarantee a compelling, end-to-end working demo by the 3:30 PM milestone.

---

## 1. Persona & Friction Recap (From MRD)

| Persona | Primary Goal | Pain Point / Friction | Root Cause |
|---|---|---|---|
| **Karthik Sundaram (28)**<br>IT Analyst, daily 2W commuter | Reach office before 9:00 AM biometric cutoff | Gets trapped at Central Bus Stand & Junction Flyover for 22+ mins | Legacy GPS reroutes him 3 km further or notifies him too late once inside the bottleneck |
| **Selvi Murugan (34)**<br>Last-mile Quick Commerce Courier | Deliver 8 orders/hr to maintain on-time incentive | Sudden 15-min queue at Thillai Nagar 11th Cross ruins batch delivery SLA | No visibility into cross-route trade-offs (e.g., "+400m distance saves 12 min queue delay") |

---

## 2. MoSCoW Feature Prioritization

The feature list is categorized below with the strict rule: *"If this fails, is there still a working demo?"*

### 2.1 Must-Have (Maximum 3 - Core Demo)

#### Feature 1 (F1): Real-Time Junction Alternative Discovery & Live Flow Telemetry
- **Description:** Automatically retrieves multi-path routing options between selected origin-destination pairs around congested urban junctions, extracting live traffic speeds, free-flow baseline speeds, real-time delay (seconds), and geometric length.
- **Why Must-Have:** Without live multi-route discovery and congestion telemetry, no comparative routing can occur. If F1 fails, there is no demo.
- **Provider Support:** Live TomTom Routing & Traffic Flow APIs with a zero-latency, realistic local synthetic generator fallback for offline resilience.

#### Feature 2 (F2): Multi-Criteria Heuristic Ranking Engine
- **Description:** Evaluates each candidate route against a holistic penalty score combining:
  1. Base Travel Time (seconds)
  2. Congestion Delay Penalty ($Delay 	imes 1.5$)
  3. Distance Friction / Fuel Penalty ($Distance 	imes 0.05$)
  4. Real-time Congestion Factor ($CurrentSpeed / FreeFlowSpeed$)
- **Output:** Categorizes routes into `Fastest & Smoothest` (Rank 1 - Recommended), `Scenic / Secondary Alternative`, or `Avoid - Bottleneck Trap`.
- **Why Must-Have:** Directly solves the problem of selecting which nearby route is *truly* less crowded rather than just shortest distance.

#### Feature 3 (F3): Transparent Cross-Route Comparative Explanation Box & Metric Matrix
- **Description:** A dedicated explainability engine that computes delta comparisons across all alternative routes. Displays:
  - **Badges:** e.g., *"Saves 12 min delay"*, *"Bypasses 2 choke points"*, *"1.2 km longer but 9 min faster"*.
  - **Comparative Sentence:** *"Why this route? Route 1 saves 11 mins compared to Route 2 by bypassing the Central Junction bottleneck, despite being 400m longer."*
  - **Side-by-side Matrix:** Comparison table highlighting time delta, congestion index, junction count, and road conditions.
- **Why Must-Have:** Bridges the trust gap. Competitors fail because users do not understand *why* an alternative was suggested. This directly fulfills user requirement #1.

---

### 2.2 Should-Have (Important Enhancements)

#### Feature 4 (F4): 15-Minute ML Predictive Traffic Trend Strip
- Mini sparkline / trend strip displaying anticipated congestion level for the next 15–45 minutes using historical time-of-day decay models.

#### Feature 5 (F5): User Preference Weighting Sliders
- Interactive controls enabling users to dynamically prioritize **Time Priority vs. Fuel/Distance vs. Choke-Point Avoidance**.

---

### 2.3 Could-Have (Delighters & Polish)

#### Feature 6 (F6): Multi-Palette Accessible Design Switcher
- Instant toggle between **High-Contrast Dark (OLED)**, **Emerald Traffic Flow**, **Cyber Knight Blue/Indigo**, and **Sunset Amber** using modern CSS color-mix tokens and accessible typography.

#### Feature 7 (F7): TomTom Raster Incident & Jam Flow Tile Overlay
- Interactive Leaflet map layer rendering heat-mapped traffic flow lines and incident warning markers.

---

### 2.4 Won't-Have / Out of Scope (For 3:30 PM Demo)

- **Turn-by-turn Voice Audio Guidance:** Handled by OS-level turn engines; unnecessary for advisory route selection.
- **In-App Toll & Parking Wallet:** Outside traffic advisory scope.
- **Crowdsourced Social Chat / Cop Spotting:** High moderation overhead, irrelevant to core junction telemetry.
- **Hardware OBD-II Vehicle Sensor Integration:** Focus is browser-first accessibility on commuter smartphones/desktops.

---

## 3. Persona to Feature Traceability Matrix

| Feature ID | Feature Name | Karthik Sundaram (Daily 2W Commuter) | Selvi Murugan (Last-Mile Courier) | Gate 3 Rubric Alignment |
|---|---|---|---|---|
| **F1** | Junction Alternative Discovery | Discovers 2–3 alternate bypass lanes around Central Bus Stand | Identifies secondary ring roads around delivery hubs | Problem-Solution Fit |
| **F2** | Multi-Criteria Ranking | Avoids high-risk choke points that cause missed 9 AM punch-in | Ranks routes by reliable travel time to protect batch SLA | Scope Discipline (Core) |
| **F3** | Comparative Explanation Box | Instantly sees why Route 1 saves 11 mins over Route 2 | Clear proof: "+400m distance = 14 mins saved" | Trust & Decision Support |
| **F5** | Preference Sliders | Set "Strict Avoid Delays" during morning rush hour | Balances fuel consumption with delivery deadlines | User Personalization |
| **F6** | Multi-Palette UI Switcher | High-contrast readability under bright sunlight on 2W mount | Dark mode preserves battery during 8-hr shifts | UI/UX Polish |

---

## 4. Technical Architecture & Data Pipeline

```
[ Commuter Browser / Client (Vite + React + CSS Design System) ]
                            │
               REST / JSON (Port 5000)
                            ▼
[ Express API Gateway (Node.js) ]
       │                                         │
       ▼                                         ▼
[ Live TomTom Routing & Flow API ]    [ Local Synthetic Fallback ]
(Real-time speeds, incidents)         (100% reliable offline demo)
       │                                         │
       └────────────────────┬────────────────────┘
                            ▼
[ Route Ranking & Comparative Analytics Service ]
  - Calculates Total Penalty Score: Time + (Delay * 1.5) + (Dist * 0.05)
  - Computes Delta Matrices (Route A vs Route B time & distance diff)
  - Generates Plain-English Explainability Badges & Summary Sentences
                            │
                            ▼
[ Interactive Advisory UI: Map + Route Cards + Comparison Matrix ]
```

### 4.1 Technology Stack Table

| Layer | Technology | Justification |
|---|---|---|
| **Frontend Framework** | React 18 + Vite | Sub-second hot reload, lightweight bundle (2.7s production build) |
| **Styling & Theming** | Vanilla Modern CSS (OKLab, CSS custom properties) | Zero Tailwind bloat; satisfies modern-web-guidance skill rules |
| **Mapping Engine** | Leaflet.js + OpenStreetMap / TomTom Tiles | Smooth panning, multi-polyline color encoding by congestion |
| **Backend Framework** | Node.js + Express.js | Non-blocking async I/O for concurrent telemetry calls |
| **Traffic Telemetry** | TomTom Routing API v1 + Flow API | Real-time traffic speeds, delays, and incident metadata |
| **Resilience Engine** | In-Memory Deterministic Traffic Simulator | Zero runtime failure during live jury evaluation if WiFi drops |

---

## 5. Functional Requirements & Acceptance Criteria (Gherkin BDD)

### F1: Junction Alternative Discovery
- **Scenario 1: Fetching routes for congested junction**
  - **Given** the commuter selects origin `"Junction Railway Station"` and destination `"Central Bus Stand"`,
  - **When** the commuter clicks `"Search Live Alternatives"`,
  - **Then** the system returns at least 2 distinct routing candidates within 1200ms, displaying travel time, free-flow time, delay (min), and distance (km).

### F2: Multi-Criteria Heuristic Ranking Engine
- **Scenario 2: Congested primary route vs. clear secondary bypass**
  - **Given** Route 1 has 3.2 km with 18 mins delay (total 27 mins), and Route 2 has 4.1 km with 1 min delay (total 13 mins),
  - **When** the ranking algorithm executes,
  - **Then** Route 2 is designated as `"Rank 1: Recommended Alternative"`, and Route 1 receives `"Avoid: Bottleneck Trap"` badge.

### F3: Cross-Route Comparative Explanation Box
- **Scenario 3: Displaying comparative trade-offs**
  - **Given** multiple routes are displayed on screen,
  - **When** the commuter inspects the Route 2 card,
  - **Then** an highlighted explainability box shows:
    - Headline: *"Recommended Over Alternative 1"*
    - Summary: *"Saves 14 mins by bypassing Central Flyover, despite 0.9 km extra distance."*
    - Badges: `[Saves 14m delay]`, `[+0.9 km extra]`, `[Low Congestion]`.

---

## 6. Live Demo Measurable Success Metrics

To satisfy Gate 3's requirement for metrics that can be validated live in under 5 minutes:

| Metric ID | Metric Name | Target Value | How It Is Verified Live in Demo |
|---|---|---|---|
| **M1** | Decision Latency | $\le 10$ seconds | Commuter understands which route to pick within 10 seconds of clicking search |
| **M2** | Time Savings Delta | $\ge 20\%$ time saved | Route 1 recommendation demonstrates at least 20% lower travel time during peak congestion |
| **M3** | Query Response Time | $\le 1.5$ seconds | API latency from click to rendering comparison cards and map polyline |
| **M4** | Explanation Transparency | $100\%$ route cards | Every single alternative route card contains an explicit comparative breakdown against alternatives |

---

## 7. Edge Cases & Graceful Degradation Plan

1. **Third-Party API Rate Limit (HTTP 429) or Network Drop:**
   - *Mitigation:* The backend automatically catches network errors and seamlessly switches to the high-fidelity Tier-2 Junction Synthetic Generator without crashing or showing blank screens.
2. **All Routes Saturated (Gridlock across all junction arteries):**
   - *Mitigation:* System warns user: *"Heavy saturation detected on all arterial links. Route 3 has lowest incident probability (Delay: 14m)."*
3. **Identical Travel Time on Two Alternatives:**
   - *Mitigation:* Tie-breaker defaults to the route with shorter distance, fewer intersections, and smoother road quality index.

---

## 8. Hackathon Submission & Deliverables Checklist

- [x] **MRD Completed** and saved in `e:\project\Route Wise\MRD\Cyber Knight - Commuters Waste Time at Congested Junctions - MRD` (PDF, DOCX, MD).
- [x] **PRD Completed** and saved in `e:\project\Route Wise\PRD\Cyber Knight - Commuters Waste Time at Congested Junctions - PRD` (PDF, DOCX, MD).
- [x] Scope strictly constrained to **3 Must-Haves** (F1 Discovery, F2 Multi-Criteria Ranking, F3 Cross-Route Explanation).
- [x] All unverified assumptions flagged and documented.
- [x] Responsive Web Application running on `http://localhost:5173` with backend on `http://localhost:5000`.
- [x] Public shareable links configured for mentor and jury access before 3:30 PM deadline.
