# Implementation Plan: E2E Tests for Rides and Avoid Zones

**Branch**: `002-e2e-tests` | **Date**: 2026-03-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-e2e-tests/spec.md`

## Summary

Add Playwright-based E2E tests that exercise the full stack (React frontend + NestJS backend + Firestore) for ride creation and avoid zone creation flows. Tests authenticate a test user, interact with the map UI, submit data, and verify persistence. The test suite runs with a single command, starts/stops servers automatically, and works headless in CI.

## Technical Context

**Language/Version**: TypeScript (strict mode), Node.js
**Primary Dependencies**: Playwright (browser automation + test runner), NestJS, React 19, Vite, MapLibre GL JS
**Storage**: Firestore (test data created and cleaned up per test)
**Testing**: Playwright Test (E2E), Jest (existing unit tests unchanged)
**Target Platform**: Chromium headless (default), optional headed mode for debugging
**Project Type**: Web application (monorepo: `apps/api` + `apps/web`)
**Performance Goals**: Full E2E suite completes in under 2 minutes
**Constraints**: No external services beyond Firestore; headless-compatible for CI
**Scale/Scope**: 2 features tested (rides, avoid zones), ~4-6 test cases total

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality — No `any`, strict mode | PASS | Playwright tests use TypeScript strict |
| I. Controllers delegate to services | N/A | No controller changes |
| II. Co-located tests | PASS | E2E tests live in dedicated `e2e/` directory at repo root (standard for cross-app tests) |
| II. 3-part test naming, AAA, realistic data | PASS | E2E tests follow same naming convention with realistic Buenos Aires coordinates |
| II. Each test defines own data | PASS | Tests create and clean up their own rides/zones |
| III. Actionable error feedback | N/A | No UI changes |
| IV. Performance | PASS | E2E suite under 2 minutes |
| Dev Workflow — lint and build before merge | PASS | E2E tests added to CI pipeline |

No violations. Gate passes.

## Project Structure

### Documentation (this feature)

```text
specs/002-e2e-tests/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
e2e/
├── playwright.config.ts     # Playwright configuration (webServer, projects, timeouts)
├── fixtures/
│   └── auth.ts              # Authentication fixture (Firebase test user login)
├── rides.spec.ts            # Ride creation E2E tests
├── avoid-zones.spec.ts      # Avoid zone creation E2E tests
├── smoke.spec.ts            # Basic smoke test (page loads, map renders)
└── package.json             # Playwright dependency (isolated from app deps)
```

**Structure Decision**: E2E tests live in a top-level `e2e/` directory because they span both `apps/api` and `apps/web`. This is standard for cross-app integration tests in monorepos. The `e2e/` directory has its own `package.json` to keep Playwright isolated from app dependencies.

## Complexity Tracking

No violations to justify.
