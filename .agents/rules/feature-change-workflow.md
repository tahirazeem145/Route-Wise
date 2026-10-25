# Feature Modification & Deletion Protocol

Whenever the user requests to **modify**, **add**, or **delete** any feature, the following strict protocol MUST be followed before writing or modifying any code:

## Phase 1: Product & Requirements Analysis (MRD, PRD, Epics & Stories)
1. **Analyze PRD & MRD**:
   - Inspect [PRD.md](file:///e:/project/Route%20Wise/PRD/Cyber%20Knight%20-%20Commuters%20Waste%20Time%20at%20Congested%20Junctions%20-%20PRD.md) and [MRD.md](file:///e:/project/Route%20Wise/MRD/Cyber%20Knight%20-%20Commuters%20Waste%20Time%20at%20Congested%20Junctions%20-%20MRD.md).
   - Locate the exact Feature ID (e.g., FR-1 to FR-8), user stories, target persona, and product goals affected.
   - Check if removing or changing the feature breaks any documented promise, API endpoint, or evaluation criteria.
2. **Clarify Trade-offs**:
   - Assess business and technical impact (e.g., impact on 2-minute judge pitch, offline fail-safe, latency).

## Phase 2: Full Codebase & Dependency Impact Analysis
1. **Trace Frontend Impact**:
   - Identify affected components in `client/src/components/`, styling in `client/src/App.css`, state in `client/src/App.jsx`, API helpers in `client/src/services/api.js`.
2. **Trace Backend Impact**:
   - Check routes (`server/src/routes/`), controllers (`server/src/controllers/`), services (`server/src/services/`), middleware (`server/src/middleware/`), and config.
3. **Trace Test Suite Impact**:
   - Check affected unit and integration tests in `server/tests/` and frontend test specs.
   - Note which tests will fail, need updates, or need deletion.

## Phase 3: Mandatory Skill Execution
1. **`modern-web-guidance`**:
   - Mandatory trigger for any HTML/CSS or client-side JavaScript changes.
2. **`ui-ux-design-system`**:
   - Mandatory for UI layout, Leaflet maps, dark glassmorphism, or card component design.
3. **`test-driven-development`**:
   - Mandatory red-green-refactor workflow. Update tests first, verify failure, implement change, verify all 40+ tests pass.

## Phase 4: Systematic Execution & Documentation Update
1. Update backend and/or frontend code.
2. Run test suites (`npm test --prefix server`, etc.) to verify 100% pass rate.
3. Synchronize PRD/MRD documentation and `README.md` if feature specifications change.
