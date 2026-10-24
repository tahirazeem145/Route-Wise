# Route Wise — Market Requirements Document (MRD)

**DOCUMENT:** MRD-v2.0  
**TEAM:** Cyber Knight  
**AUDIENCE:** Mentors & Judges  
**STATUS:** Final Pitch Ready  

---

### The 30-Second Elevator Pitch for Judges
Most navigation apps blindly suggest the shortest route, even if it leads straight into heavy traffic gridlock. **Route Wise (Team Cyber Knight)** is an intelligent traffic advisory platform and live dashboard that evaluates multiple driving alternatives, penalizes severe junction bottlenecks, and predicts 15-minute congestion trends using an official public **ARIMA (1,0,1)** ML model from GitHub. It explains *why* it chose the route in plain words (e.g. *"Saves 14 mins travel time and 37 km shorter vs Route #2"*), saving time, fuel, and driver frustration for daily commuters and couriers.

---

## 1. Real-World Story: Why Traditional GPS Fails Drivers

### The Scenario (Meet Karthik the Daily Commuter & Courier)
It is 5:15 PM peak evening rush hour in Tiruchirappalli. Karthik has an urgent trip / package delivery from Central Bus Stand to Cantonment & Thillai Nagar.

- **What Traditional GPS Does:** Recommends Route A (Direct City Arterial) because it is only **10.0 km**. However, City Arterial has an unexpected bottleneck with **18 minutes of bumper-to-bumper traffic delay**. Total travel time: **42 minutes**. Karthik arrives late, fuel is wasted idling, and stress peaks.
- **What Route Wise Does:** Analyzes 3 alternatives simultaneously. It recognizes that Route B (Outer Ring Corridor) is **12.5 km** (2.5 km longer), but has almost zero congestion (only **2 minutes of delay**). Total travel time: **26 minutes**. Route Wise recommends Route B, explaining: *"Fastest path — Avoids 16 minutes of traffic jam"*. Karthik arrives 16 minutes early!

| Navigation Strategy | Distance | Traffic Delay | Total Time | Driver & Commuter Outcome |
| :--- | :---: | :---: | :---: | :--- |
| **Standard Navigation App**<br/>*(Picks shortest distance)* | 10.0 km<br/>*(Shortest)* | **+18 mins**<br/>*(Heavy gridlock)* | **42 mins** | Late delivery, high stress, fuel wasted idling in junction bottleneck. |
| **Route Wise (Cyber Knight)**<br/>*(Multi-criteria AI + ARIMA)* | 12.5 km<br/>*(+2.5 km)* | **+2 mins**<br/>*(Smooth flowing)* | **26 mins**<br/>*(16m faster!)* | On-time delivery, clear trade-off explanation, fuel-efficient constant speed. |

---

## 2. The Big Market Problem We Solve

1. **Opaque "Black-Box" Algorithms:** Current mapping APIs provide a single route without explaining why it was picked, leaving dispatchers and commuters blind.
2. **Inability to Predict Traffic Spikes:** Existing maps show current delay, but cannot tell if congestion will clear or worsen in 15 minutes.
3. **Demo & Network Fragility:** Traditional routing APIs break when offline or over quota. Developers need high-reliability fail-safes.

---

## 3. Market Size: Multi-Billion Dollar Opportunity

| Metric | Valuation | Focus Area |
| :--- | :--- | :--- |
| **TAM** | **$14.2 Billion** | Global GIS, Navigation & Fleet Logistics API Market |
| **SAM** | **$2.8 Billion** | Urban Last-Mile Delivery & Commuter Routing Software |
| **SOM** | **$350 Million** | Tier-2 & Tier-1 Indian Logistics SaaS, Startups & Commuters |

---

## 4. Target Audience, Competition & Revenue Model

### 4.1 Who Needs This? (Target Customer Segments)
- **Daily Urban Commuters (2W & 4W):** Need to bypass known junction bottlenecks during 8:00 AM – 10:00 AM and 5:00 PM – 7:30 PM peak commutes.
- **On-Demand Couriers & Delivery Platforms:** Under strict SLAs (8 deliveries/hr). A 15-minute junction delay causes missed order deadlines and penalties.
- **Fleet & Logistics Dispatchers:** Managing delivery vans. A 15-minute delay per driver compounds into thousands of wasted fuel rupees weekly.

### 4.2 Why Route Wise Wins Against Big Tech APIs

| Feature / Capability | Google Maps API | Mapbox Navigation | Route Wise (Cyber Knight) |
| :--- | :--- | :--- | :--- |
| **Configurable Scoring Weights** | No (Fixed default algorithm) | Partial (Limited vehicle profiles) | **Yes** — Customize Time, Delay Penalty & Distance |
| **Transparent "Why" Rationale** | No (Opaque black-box route) | No (No explanation given) | **Yes** — Clear tags like *"Saves 14m & 37 km shorter"* |
| **15-Min ML Traffic Forecast** | No (Live conditions only) | No (Historical averages only) | **Yes** — Public ARIMA(1,0,1) model for +15m, +30m, +45m |
| **Traffic Severity Badges** | Partial (Visual map lines only) | Partial (Generic speed colors) | **Yes** — Green / Yellow / Red delay classifier |
| **Offline Demo Fail-Safe** | No (Fails if internet drops) | No (Requires paid offline packs) | **Yes** — High-fidelity local coordinate dictionary |
| **Side-by-Side Comparison Matrix** | No (Must switch back & forth) | No (Single route view) | **Yes** — Simultaneous comparison table |

### 4.3 How We Monetize (Simple Tiered Model)

| Tier | Price | Included Quota & Capabilities | Target Customer |
| :--- | :---: | :--- | :--- |
| **Free Developer** | **$0 / mo** | 1,000 queries/month, 60 req/min rate limit, full dashboard access, offline mock mode. | Hackathons, student projects, prototyping. |
| **Growth Fleet** | **$0.003 / query** | Up to 250,000 queries/month, custom scoring presets, 60-second live refresh API, ARIMA forecast. | Courier startups, local delivery fleets. |
| **Enterprise** | **Custom SLA** | Unlimited queries, multi-stop TSP route optimization, dedicated container hosting, 99.9% uptime SLA. | Logistics corporations, mobility providers. |

### 4.4 Top 3 Takeaways to Explain to Judges

1. **Not Just Another Map:** We don't reinvent map tiles; we solve the intelligence layer that evaluates multiple alternatives and tells you *why* Route #1 is the best.
2. **Tangible Commuter ROI:** Saving 15 minutes of junction delay per trip directly reduces fuel consumption, vehicle wear, late penalties, and driver burnout.
3. **Production-Ready Tech:** Powered by TomTom live traffic, public **ARIMA (1,0,1)** ML forecasting, resilient fail-safes, and **40 automated tests** passed at 100%.
