# RouteWise Implementation Change Specification

## 1. Document purpose

This specification defines the product, engineering, and validation changes for adding community incident reporting, an authority hotspot view, and a Google Maps handoff to RouteWise. It also corrects the route-ranking rule so verified incidents do not distort or double-count route ETAs.

The existing RouteWise PRD and MRD remain the product baseline. This specification is the change set to apply to them and to the implementation backlog.

## 2. Decision summary

| Decision | Direction |
|---|---|
| Core commuter flow | Keep alternative discovery, recommendation, and explanation as the primary product flow. |
| Community reports (F4) | Add after the core route flow is stable. Keep Should-Have for the hackathon unless the full report lifecycle is implemented and verified. |
| Authority hotspot view (F5) | Add after reports persist and verification works. Treat as post-demo or Should-Have. |
| Google Maps handoff | Add a separate action on each route card. The action must correspond to that specific selected route. |
| Exact Google Maps path | Do not promise this from a TomTom route and a standard Google Maps URL. A link can guide Google Maps through route anchors, but Google recalculates between them. |
| Exact-route navigation option | If exact-route fidelity is mandatory, evaluate Google Routes API plus native Navigation SDK as a separate architecture change. It requires Google-generated route tokens and a native app; traffic or off-route conditions may still cause changes. |

For the current hackathon version, the Google Maps link and F4/F5 must not displace the tested F1–F3 flow. If a waypoint link does not preserve the selected route's corridor in manual testing, leave it out of the demo rather than claim exact navigation.

## 3. Scope

### In scope

- Structured reports for congestion, roadblock, roadwork, procession, signal failure, and waterlogging.
- Verification, expiry, duplicate handling, and route impact for verified reports.
- A protected authority view of active verified incidents and recurring hotspots.
- A route-specific Google Maps directions link for each displayed alternative, including the recommended route.
- Requirements for route ranking, source/freshness labels, privacy, security, and acceptance testing.

### Out of scope for the first version

- Public free-text comments or incident chat.
- Reporter reputation, points, or rewards.
- Automatic traffic-signal control or incident dispatch.
- City-wide authority analytics before sufficient corridor history exists.
- A guarantee that a standard Google Maps URL follows the exact RouteWise polyline.
- Native Google Navigation SDK integration unless separately approved and planned.

## 4. Product requirements

### F1–F3: Preserve the core route advisory

RouteWise must continue to:

1. Show the main route and up to two alternatives.
2. Compare routes using a consistent traffic snapshot and travel mode.
3. Recommend a route only when the expected benefit clears the defined switch threshold.
4. Explain ETA difference, distance difference, congestion evidence, data age, and verified incidents used.
5. Let the user choose any route, even when it is not the recommended route.

### F4: Community incident reports

Users can submit one structured incident type: congestion, roadblock, roadwork, procession, signal failure, or waterlogging. Capture location and time only after user action and consent. A new report starts as `Unverified` and must not independently force a route change.

#### Verification lifecycle

| Condition | State/action |
|---|---|
| Valid new report | `Unverified`; show type and age. |
| One report plus a matching traffic-speed drop greater than 30% on the affected segment | Mark `Verified`; reason `telemetry_match`. |
| At least two distinct nearby confirmations | Mark `Verified`; reason `community_confirmations`. |
| More denials than confirmations | Keep unverified; do not use as confirmed route evidence. |
| Expiry passes without reconfirmation or evidence indicates the incident cleared | Mark `Expired`. |
| Authorized authority user marks the incident cleared | Mark `Resolved`; retain in history. |

Initial expiry values are tunable parameters:

| Type | Default lifetime |
|---|---:|
| Congestion | 15 minutes |
| Signal failure | 60 minutes |
| Roadblock or procession | Until resolved; recheck every 30 minutes |
| Waterlogging | 90 minutes; recheck |
| Roadwork | 24 hours; require reconfirmation |

Use distinct anonymous or pseudonymous user keys for votes. Permit one vote per user per report. Merge likely duplicate reports of the same type within about 100 metres and a short time window, while retaining the original report and vote history. Apply reporting rate limits.

### F5: Authority hotspot view

An authorized authority user can view active verified incidents in a ranked list and on a map. Each item shows type, approximate location, status, report age, confirmation count, estimated route impact where available, and recurrence during the last seven days. The user can mark an incident resolved.

Sort order must be explicit and stable: estimated route impact descending, then report age ascending, then confirmation count descending. If impact cannot be estimated, show it as unavailable instead of inventing a value.

## 5. Route-ranking rule

The current formula `Time + (Delay * 1.5) + (Distance * 0.05)` is not sufficiently defined: units and weights are unspecified, and it may count traffic twice if provider ETA already includes delay.

Use this initial rule:

1. Request candidate ETAs with the same departure time, travel mode, and traffic snapshot.
2. Determine whether each verified incident is already reflected in provider ETA. Never apply the same incident penalty twice.
3. If the provider ETA does not reflect a verified incident, apply one documented adjustment only to routes that cross its affected segment. Exclude a road-closure route only when the closure is verified and the routing provider supports a reliable avoidance request.
4. Rank by adjusted ETA. Use congestion ratio as a tie-breaker and explanatory evidence, not an undocumented ETA multiplier.
5. Recommend switching only when the best qualifying alternative saves at least `max(3 minutes, 10% of the main-route ETA)`. Otherwise recommend the main route.
6. Show unverified reports separately and state that they did not determine the recommendation.

If the team retains a weighted score, the PRD must state units, weights, calibration evidence, representative worked examples, and why the score does not double-count congestion.

## 6. Google Maps handoff requirements

### Route selection behavior

- Put **Open this route in Google Maps** on each alternative route card, including the recommended card.
- Build the link from the route object belonging to that card. Preserve its route ID, origin, destination, travel mode, ordered geometry, provider, and calculation time until handoff.
- If the user accepts the recommendation, open the recommended route's link. If the user chooses another alternative, open that alternative's link. Never silently substitute the default or recommended route.
- Label the web link as a best-effort route handoff. Explain that Google Maps may select different roads between the route anchors.

### Web/PWA link behavior

For the existing Vite + React and TomTom architecture:

1. Decode the selected alternative's road-following polyline.
2. Choose ordered anchors at route decision points and where that route differs from the other alternatives. Do not use straight-line points between origin and destination.
3. Use no more than three waypoints for mobile-browser Maps URLs. Google documents a 2,048-character URL limit; encode coordinates and separators with a standard URL builder.
4. Include `api=1`, explicit origin, destination, and a supported travel mode. If two-wheeler mode is unavailable, provide a clear fallback.
5. Open only after the user taps the action. If geometry is invalid or a safe link cannot be made, keep the selected route visible in RouteWise and explain why handoff is unavailable.
6. Never use report text or report-provided URLs to build a navigation link.

Example shape (coordinates are placeholders):

```text
https://www.google.com/maps/dir/?api=1&origin=10.0000%2C78.0000&destination=10.1000%2C78.1000&travelmode=two-wheeler&waypoints=10.0300%2C78.0300%7C10.0600%2C78.0600
```

### Exact-route option

A standard Maps URL accepts origins, destinations, and waypoints; it does not accept an arbitrary TomTom polyline as a route to follow. If exact-route navigation is required, investigate generating alternatives with Google Routes API, retaining the selected route's route token, and passing it to Google's native Navigation SDK. This changes the provider and requires Android/iOS native work. The Navigation SDK attempts to follow the planned route but can recalculate as conditions change or when the user deviates, so do not promise an immutable path.

Do not mix TomTom ETAs/geometry with a Google-generated navigation path without disclosing that the map may differ. Either keep RouteWise as the advisory and label the link approximate, or make Google the source for the route being navigated.

## 7. Architecture and data changes

Keep the current Vite + React client and Node.js + Express API unless a documented decision changes them. Incident reporting, voting, expiry, and recurrence require persistent storage. In-memory storage may be used only for a disposable demo and must be labelled; it cannot support reliable multi-user history or recurrence.

### Data entities

**IncidentReport**

| Field | Description |
|---|---|
| `id` | Stable report ID |
| `type` | One of the six supported types |
| `latitude`, `longitude` | Validated, appropriately rounded report location |
| `createdAt`, `updatedAt`, `expiresAt` | Lifecycle timestamps |
| `status` | `Unverified`, `Verified`, `Resolved`, or `Expired` |
| `verificationReason` | `telemetry_match`, `community_confirmations`, or null |
| `confirmationCount`, `denialCount` | Aggregates only |
| `estimatedImpactMinutes` | Optional; only when supported by a defined calculation |
| `resolvedAt`, `resolvedBy` | Private audit fields |
| `source` | `user`, `seeded`, or `simulated` |

**IncidentVote**

| Field | Description |
|---|---|
| `reportId` | Incident being voted on |
| `anonymousUserKey` | Pseudonymous key for one-vote enforcement |
| `vote` | `yes`, `no`, or `not_sure` |
| `createdAt` | Vote timestamp |

Enforce a unique database constraint on `(reportId, anonymousUserKey)`. A relational database is sufficient for a single-corridor pilot; use a geospatial index if supported and needed for nearby lookups.

### API endpoints

| Method/path | Access | Purpose |
|---|---|---|
| `POST /api/reports` | Commuter | Submit a structured report. |
| `GET /api/reports/nearby?lat=...&lng=...&radiusM=...` | Commuter | Return nearby reports with status, source, and age. |
| `POST /api/reports/:id/votes` | Commuter | Confirm, deny, or mark not sure; one vote per user key. |
| `GET /api/authority/hotspots?windowDays=7` | Authority | Return ranked active verified incidents and recurrence. |
| `POST /api/authority/reports/:id/resolve` | Authority | Resolve an incident and write audit fields. |

Clients must not set status, verification reason, counts, or resolution fields. Validate all input on the server.

## 8. User experience, privacy, and security

### Commuter UI

- Add one-tap **Report an incident** with six structured type buttons.
- Capture location only after explicit action and consent.
- Show a receipt with `Unverified` status and report age.
- Use distinct icons and labels for verified and unverified map reports; do not rely on color alone.
- Allow nearby users to select `Yes`, `No`, or `Not sure` once per report.
- Explain verified incident impact on route cards. Keep unverified reports separate from ranking.
- Show live/replay/simulated data source and age.
- Do not require typing while the vehicle is moving; show a reminder not to report while driving.

### Authority UI

- Protect the authority view and resolve action with an authority role or secured demo login.
- Include map/list view, type and status filters, last-updated time, recurrence period, and an empty state.
- Show active verified incidents first using the documented sort order.
- Keep reporter identity private; record resolution for audit.

### Security and privacy

- Do not store user location trails. Store only report location and minimum verification/abuse metadata.
- Use anonymous or pseudonymous IDs; do not expose reporter identity to authorities.
- Keep API credentials server-side; validate coordinates, type, request size, and rate.
- Do not add public free text in the first version.
- Label every live, replayed, simulated, or seeded item.

## 9. Acceptance criteria

### F4 reports

| ID | Given | When | Then |
|---|---|---|---|
| F4-AC1 | User is within configured reporting radius and selects a type | User submits | Store type, approximate location, time, and `Unverified`; return receipt. |
| F4-AC2 | Report is unverified | Advisory is requested | Show it as unverified; do not treat it as a confirmed closure or force a route switch. |
| F4-AC3 | Telemetry matches or enough distinct users confirm | Verification runs | Set `Verified` with reason and show it in the verified list. |
| F4-AC4 | Verified incident affects a candidate route | Ranking runs | Apply the incident at most once and explain its type and age. |
| F4-AC5 | Report expires or receives sufficient denials | Lifecycle updates | Stop using it as verified evidence and show its current state. |
| F4-AC6 | User exceeds rate limit or submits a duplicate | Report is submitted | Reject or merge it and return a clear, non-sensitive response. |

### F5 authority view

| ID | Given | When | Then |
|---|---|---|---|
| F5-AC1 | Verified active incidents exist | Authorized user opens dashboard | Show ranked list/map with age, type, confirmations, and supported impact estimate. |
| F5-AC2 | Incident becomes verified | Dashboard refreshes | Show it within 30 seconds. |
| F5-AC3 | A location has multiple verified reports in seven days | Recurrence is calculated | Show count and stated time range. |
| F5-AC4 | Authority user resolves an incident | Update is saved | Remove from active list, retain in history, and stop using it in route advice. |
| F5-AC5 | Non-authority user requests authority endpoint | Request is made | Return authorization error without revealing dashboard data. |

### Google Maps handoff

| ID | Given | When | Then |
|---|---|---|---|
| MAP-AC1 | Three route cards are shown and one may be recommended | User taps the handoff on any card | Build the link from that card's route ID, origin, destination, mode, and ordered anchors only. |
| MAP-AC2 | User accepts the recommendation | User taps the recommended card's action | Open the link generated from the recommended route's geometry. |
| MAP-AC3 | User chooses a non-recommended alternative | User taps that card's action | Open that alternative's link, not the recommended route's link. |
| MAP-AC4 | Route geometry is valid | URL is generated | Validate coordinates, order, supported waypoint count, and 2,048-character limit. |
| MAP-AC5 | Google calculates the directions | Link opens | Explain that roads may differ between anchors; do not claim exact geometry. |
| MAP-AC6 | Geometry is missing, stale, or cannot safely fit the URL | User taps the action | Do not open a misleading link; keep the selected route visible and explain the fallback. |
| MAP-AC7 | Product later claims native same-route navigation | Navigation starts | Pass the selected Google route token to the Navigation SDK and disclose rerouting behavior. |

## 10. Success metrics and demo checks

Keep RouteWise's existing route-decision and query-latency targets. Add these checks only when the corresponding feature is implemented:

| Metric | Proposed target | Check |
|---|---:|---|
| Valid report receipt | 10/10 valid reports receive ID and `Unverified` state | Submit 10 valid reports. |
| False verification | 0/10 unsupported reports become verified | Test without votes or matching telemetry. |
| Verification latency | Supported seeded report verifies within 60 seconds | Time telemetry and community-confirmation paths. |
| Authority freshness | Verified incident appears within 30 seconds | Time verification to dashboard. |
| Data honesty | 100% of cards show source/state and age | Inspect live, replay, simulated, and report states. |
| Recommendation consistency | Every recommendation matches the written ranking rule | Compare route inputs with displayed result. |
| Handoff route identity | 3/3 route cards open their own route-specific link | Select each route and inspect generated origin, destination, and anchors. |
| Handoff usability | Selected corridor matches the intended route in manual checks | Test Android, iOS, and desktop; record differences. |

Do not claim real-world congestion reduction or proven commuter savings from a seeded demo. Separate observed demo results from pilot outcomes.

## 11. Implementation sequence

1. Stabilize and verify F1–F3, including errors, stale data, and live/replay/simulated labels.
2. Correct the route-ranking rule and add no-switch behavior.
3. Implement F4 persistence, API validation, rate limits, duplicate handling, and lifecycle.
4. Implement F4 commuter reporting and confirmation UI.
5. Apply verified incidents to routing and explain their effect without double-counting ETA.
6. Implement F5 authorization, ranking, recurrence, and resolution history.
7. Add route-specific Maps links and test all three alternatives independently; omit from demo if the corridor match is poor.
8. Run the acceptance checks, then update README and demo instructions.

If time is constrained, finish F1–F3 and F4 reporting/verification before F5. Do not present an unprotected or empty authority dashboard as complete.

## 12. Existing documents to update

1. **Cyber Knight PRD:** summary, MoSCoW, architecture, F4/F5 requirements, route-ranking rule, Google Maps handoff, acceptance criteria, metrics, risks, and out-of-scope list.
2. **Cyber Knight MRD:** local reporting differentiator, authority customer hypothesis, competitor analysis, assumptions, risks, and validation tests. Treat reporter adoption and authority willingness as unvalidated until measured.
3. **README/demo guide:** setup, environment variables, corridor, data source/fallback labels, demo roles, seed data, handoff limitations, and known issues.
4. **Backlog/test checklist:** create implementation tasks from F4, F5, and MAP acceptance criteria.

## 13. Decisions required before implementation

- Which corridor and junctions are supported in the demo?
- Which provider is authoritative for live ETA, traffic speed, and closure handling?
- What database exists in the RouteWise implementation?
- How are anonymous voter keys created and rate limits applied?
- Who gets authority access, and how is the demo role protected?
- Are F4/F5 working demo features or roadmap items?
- Is a best-effort Maps link acceptable, or is native route-token navigation a future requirement?

Record decisions in the PRD and README before marking these features complete.

## 14. References

- [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started): supported directions parameters, waypoint limits, URL encoding, and URL length.
- [Google Navigation SDK route planning](https://developers.google.com/maps/documentation/navigation/android-sdk/customize-route): route tokens, planned-route navigation, and reasons the route may change.
