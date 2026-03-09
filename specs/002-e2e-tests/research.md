# Research: E2E Tests for Rides and Avoid Zones

**Date**: 2026-03-06

## R1: E2E Test Framework Choice

**Decision**: Playwright Test.

**Rationale**: The user explicitly requested Playwright. Playwright has first-class TypeScript support, built-in test runner, auto-waiting, trace/screenshot on failure, and `webServer` config to auto-start dev servers. It's the best fit for testing MapLibre GL JS interactions since it supports canvas-based interactions.

**Alternatives considered**:
- Cypress: Popular but weaker TypeScript integration, no native multi-tab/multi-origin support. Doesn't handle canvas interactions as well.
- Supertest (existing): Already used for API-level E2E in `apps/api/test/`. Great for API-only tests but can't test browser interactions (map drawing, UI flows).

## R2: Authentication Strategy for E2E Tests

**Decision**: Use Firebase Auth REST API to sign in a test user programmatically, then inject the token into the browser context via localStorage/cookies before navigating to the app.

**Rationale**: Avoids clicking through the Google OAuth UI (which is flaky and may require CAPTCHA). Firebase Auth supports email/password sign-in via REST API, which is deterministic and fast. A test-only email/password user can be created in the Firebase console.

**Alternatives considered**:
- Mock the auth guard in the backend: Would bypass real auth, defeating the E2E purpose.
- Use Playwright to click through Google OAuth: Flaky, requires real Google credentials, may trigger bot detection.
- Service account tokens: Firebase Admin SDK can create custom tokens, but these require the backend to verify them, adding complexity.

## R3: Map Interaction Strategy

**Decision**: Use Playwright's `page.mouse.click()` to simulate clicks on the map canvas at specific pixel coordinates. Use `page.evaluate()` to call MapLibre GL JS methods directly when needed (e.g., `map.getCenter()`, `map.project(lngLat)`).

**Rationale**: MapLibre renders to a `<canvas>` element, so standard DOM selectors don't work for map features. Pixel-based clicks are reliable when combined with `map.project()` to convert geographic coordinates to screen coordinates. This approach tests the real UI interaction path.

**Alternatives considered**:
- Direct API calls only (skip UI): Faster but doesn't test the frontend map interaction layer, which is the whole point of E2E testing.
- Synthetic DOM events: Canvas doesn't respond to synthetic click events in the same way; Playwright's mouse events are more realistic.

## R4: Test Data Cleanup Strategy

**Decision**: Each test creates its data, captures the created resource ID, and deletes it in an `afterEach` or `test.afterAll` hook via the API (DELETE /rides/:id, DELETE /avoid-zones/:id).

**Rationale**: Ensures test isolation without needing a separate test database. The delete endpoints already exist and are authenticated. This approach is simple and doesn't require database-level access.

**Alternatives considered**:
- Firestore emulator: Would provide full isolation but requires additional setup (Java runtime, emulator config). Overkill for a few E2E tests.
- Truncate collections after tests: Dangerous — could delete non-test data if run against a shared environment.
- Unique test user per run: Would isolate data but creates user management overhead.

## R5: Server Orchestration

**Decision**: Use Playwright's `webServer` config to start both the API (`pnpm dev` in `apps/api`) and the frontend (`pnpm dev` in `apps/web`) before tests, and auto-kill them after.

**Rationale**: Playwright natively supports starting multiple web servers with health check URLs. No custom scripts needed. The servers start only if not already running (useful for local development where servers are already up).

**Alternatives considered**:
- Manual server start in CI scripts: Fragile, platform-dependent, harder to maintain.
- Docker Compose: Heavier setup, unnecessary for a dev-focused E2E suite.
