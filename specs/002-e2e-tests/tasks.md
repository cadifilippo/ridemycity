# Tasks: E2E Tests for Rides and Avoid Zones

**Input**: Design documents from `/specs/002-e2e-tests/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: This feature IS the tests. Each user story produces test files.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the E2E project structure, install Playwright, configure the test runner

- [x] T001 Create `e2e/package.json` with Playwright dependency and TypeScript config
- [x] T002 Install Playwright and Chromium browser: `cd e2e && pnpm install && npx playwright install chromium`
- [x] T003 Create `e2e/tsconfig.json` with strict mode enabled
- [x] T004 Create `e2e/playwright.config.ts` with webServer config for API (port 3000) and frontend (port 5173), headless by default, screenshot on failure, trace on first-retry
- [x] T005 Add `test:e2e` script to root `package.json`

**Checkpoint**: `pnpm test:e2e` can be invoked from root (will fail because no tests exist yet, but Playwright starts)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the auth fixture and map interaction helpers that all test stories depend on

- [x] T006 Create `e2e/fixtures/auth.ts` — Playwright fixture that authenticates a test user via Firebase Auth REST API (email/password), stores the auth token, and injects it into browser localStorage before each test
- [x] T007 Create `e2e/.env.example` with required environment variables (`E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `FIREBASE_API_KEY`, `API_BASE_URL`, `WEB_BASE_URL`)
- [x] T008 Create `e2e/helpers/map.ts` — helper functions for map interactions: `waitForMapReady(page)` (waits for canvas + tiles loaded), `clickOnMap(page, lng, lat)` (uses `map.project()` to convert geo coords to pixels, then `page.mouse.click()`)
- [x] T009 Create `e2e/helpers/api.ts` — helper functions for API cleanup: `deleteRide(token, rideId)`, `deleteAvoidZone(token, zoneId)` using fetch against the API

**Checkpoint**: Auth fixture can log in a test user and helpers are importable. No tests run yet.

---

## Phase 3: User Story 1 — E2E test infrastructure setup (Priority: P1) 🎯 MVP

**Goal**: A smoke test that verifies the full infrastructure works: servers start, browser opens, page loads, map renders, auth works.

**Independent Test**: `cd e2e && npx playwright test smoke.spec.ts`

### Implementation for User Story 1

- [x] T010 [US1] Create `e2e/smoke.spec.ts` — smoke test: navigate to app, verify page loads (title or heading visible), verify map canvas is present and interactive
- [x] T011 [US1] Create `e2e/smoke.spec.ts` — authenticated smoke test: use auth fixture to log in, verify user is authenticated (e.g., user menu visible or API call with token succeeds)
- [ ] T012 [US1] Run `pnpm test:e2e -- e2e/smoke.spec.ts` and verify both tests pass

**Checkpoint**: Smoke tests pass — servers start, browser launches, page loads, map renders, auth works.

---

## Phase 4: User Story 2 — E2E test for ride creation (Priority: P1)

**Goal**: Test the complete ride creation flow through the browser: authenticate, interact with map, submit ride, verify persistence, clean up.

**Independent Test**: `cd e2e && npx playwright test rides.spec.ts`

### Implementation for User Story 2

- [x] T013 [US2] Create `e2e/rides.spec.ts` — happy path test: authenticate, navigate to map, click multiple points on the map to trace a route (using `clickOnMap` helper with Buenos Aires coordinates), submit the ride, verify it appears in the ride list
- [x] T014 [US2] Add persistence test in `e2e/rides.spec.ts` — after creating a ride, reload the page and verify the ride is still visible
- [x] T015 [US2] Add cleanup in `e2e/rides.spec.ts` — `afterEach` hook that deletes any rides created during the test via API helper
- [ ] T016 [US2] Run `pnpm test:e2e -- e2e/rides.spec.ts` and verify all tests pass

**Checkpoint**: Ride creation E2E tests pass — full flow from auth to map interaction to persistence verified.

---

## Phase 5: User Story 3 — E2E test for avoid zone creation (Priority: P2)

**Goal**: Test the complete avoid zone creation flow: authenticate, draw a polygon on the map, submit, verify persistence, clean up.

**Independent Test**: `cd e2e && npx playwright test avoid-zones.spec.ts`

### Implementation for User Story 3

- [x] T017 [US3] Create `e2e/avoid-zones.spec.ts` — happy path test: authenticate, navigate to map, click 4+ points to draw a closed polygon (using `clickOnMap` helper with Buenos Aires coordinates), submit the avoid zone, verify it appears in the zone list
- [x] T018 [US3] Add persistence test in `e2e/avoid-zones.spec.ts` — after creating an avoid zone, reload the page and verify it is still visible
- [x] T019 [US3] Add cleanup in `e2e/avoid-zones.spec.ts` — `afterEach` hook that deletes any zones created during the test via API helper
- [ ] T020 [US3] Run `pnpm test:e2e -- e2e/avoid-zones.spec.ts` and verify all tests pass

**Checkpoint**: Avoid zone creation E2E tests pass — full flow from auth to polygon drawing to persistence verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Full suite verification, CI readiness, documentation

- [ ] T021 Run full E2E suite `pnpm test:e2e` and verify all tests pass end-to-end
- [ ] T022 Verify screenshot/trace artifacts are generated on test failure (intentionally fail a test, check output)
- [x] T023 Add `e2e/` to root `.gitignore` for test artifacts (`test-results/`, `playwright-report/`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (Playwright installed)
- **US1 (Phase 3)**: Depends on Foundational (auth fixture, map helpers)
- **US2 (Phase 4)**: Depends on US1 (smoke test proves infrastructure works)
- **US3 (Phase 5)**: Depends on US1 (same infrastructure). Independent of US2.
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — proves infrastructure works
- **US2 (P1)**: Depends on US1 (infrastructure verified). Uses auth fixture and map helpers.
- **US3 (P2)**: Depends on US1 (infrastructure verified). Independent of US2.

### Within Each User Story

- Test files are the deliverable (no separate "implementation" vs "test")
- Each test must pass in isolation
- Verify after each story checkpoint

### Parallel Opportunities

- T006, T007, T008, T009 in Foundational phase can be done in parallel (different files)
- US2 and US3 are independent of each other (both depend on US1 only)
- T021, T022, T023 can run in parallel in Polish phase

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T009)
3. Complete Phase 3: US1 — Smoke test (T010-T012)
4. **STOP and VALIDATE**: Infrastructure works, servers start, auth works
5. This alone proves the E2E framework is ready

### Incremental Delivery

1. Setup + Foundational → infrastructure ready
2. Add US1 → smoke tests pass (MVP)
3. Add US2 → ride creation E2E verified
4. Add US3 → avoid zone creation E2E verified
5. Polish → CI-ready with artifacts

---

## Notes

- E2E tests live in `e2e/` at repo root (cross-app)
- Auth uses Firebase REST API (no Google OAuth UI interaction)
- Map interactions use `page.mouse.click()` + `map.project()` for geo-to-pixel conversion
- Each test creates and deletes its own data via API helpers
- Headless by default, `--headed` flag for debugging
- Total: 23 tasks across 6 phases
