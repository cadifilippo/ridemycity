# Quickstart: E2E Tests for Rides and Avoid Zones

## What this feature does

Adds Playwright-based E2E tests that verify ride creation and avoid zone creation through the full stack (browser → frontend → API → Firestore).

## Directory to create

- `e2e/` at repo root — Playwright config, fixtures, and test files

## Files to create

- `e2e/package.json` — Playwright dependency
- `e2e/playwright.config.ts` — config with webServer for API + frontend
- `e2e/fixtures/auth.ts` — Firebase test user authentication fixture
- `e2e/smoke.spec.ts` — page loads, map renders
- `e2e/rides.spec.ts` — ride creation flow tests
- `e2e/avoid-zones.spec.ts` — avoid zone creation flow tests

## Files to modify

- `package.json` (root) — add `test:e2e` script

## Prerequisites

- A Firebase test user (email/password) configured in the Firebase console
- Environment variables: `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `FIREBASE_API_KEY`

## How to run

```bash
# Install Playwright
cd e2e && pnpm install && npx playwright install chromium

# Run all E2E tests (starts servers automatically)
pnpm test:e2e

# Run in headed mode for debugging
pnpm test:e2e -- --headed

# Run a specific test file
pnpm test:e2e -- e2e/rides.spec.ts
```

## Key decisions

- Playwright over Cypress for better canvas/MapLibre support
- Firebase Auth REST API for deterministic login (no Google OAuth UI)
- `page.mouse.click()` + `map.project()` for map interactions
- Each test creates and deletes its own data via API
- `webServer` config auto-starts API + frontend
