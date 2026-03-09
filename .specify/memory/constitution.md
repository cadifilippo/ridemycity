<!--
  Sync Impact Report
  ==================================================================
  Version change: 0.0.0 (template) -> 1.0.0 (initial ratification)
  Modified principles: N/A (first version)
  Added sections:
    - I. Code Quality & Type Safety
    - II. Testing Standards (NON-NEGOTIABLE)
    - III. User Experience Consistency
    - IV. Performance Requirements
    - Performance Budgets (Section 2)
    - Development Workflow (Section 3)
    - Governance
  Removed sections: None
  Templates requiring updates:
    - plan-template.md: ✅ No changes needed (Constitution Check
      section already references constitution file generically)
    - spec-template.md: ✅ No changes needed (success criteria
      already support measurable performance metrics)
    - tasks-template.md: ✅ No changes needed (test-first pattern
      already present, polish phase covers performance)
  Follow-up TODOs: None
  ==================================================================
-->
# RideMyCity Constitution

## Core Principles

### I. Code Quality & Type Safety

- All code MUST be written in TypeScript strict mode. The `any`
  type is forbidden; use explicit types or generics instead.
- Backend (NestJS) controllers MUST NOT contain business logic.
  Controllers delegate to services; services encapsulate all
  domain logic and infrastructure access.
- Each NestJS feature MUST have its own module, controller, and
  service. Feature modules are imported by `app.module.ts`.
- Shared types MUST live in `packages/shared`. Duplicating types
  across `apps/api` and `apps/web` is prohibited.
- Layer boundaries MUST be respected: React components communicate
  with the API via HTTP only; services own infrastructure calls
  (Firebase, Maps, Turf, external APIs).
- All inputs MUST be validated on the backend. Client-provided IDs
  and payloads are never trusted.

### II. Testing Standards (NON-NEGOTIABLE)

- Test files MUST be co-located with their source file
  (e.g., `geo.service.ts` -> `geo.service.spec.ts`). No global
  `tests/` directory for unit tests.
- Test names MUST follow the 3-part format:
  `[Unit] [scenario] [expected result]`.
- Tests MUST follow the AAA pattern: Arrange, Act, Assert.
  Each section is clearly separated.
- Test data MUST be realistic (real coordinates, real city names).
  Placeholder values like `foo`, `bar`, or `test123` are
  prohibited.
- Each test MUST define its own data. Shared fixtures and global
  seeds are not allowed.
- Errors MUST NOT be caught in tests. Use
  `expect(...).rejects.toThrow(...)` instead.
- Every `describe` block MUST have at least 2 nesting levels:
  unit under test and scenario grouping.
- New services and non-trivial logic MUST have corresponding unit
  tests before the code is considered complete.

### III. User Experience Consistency

- The map view is the primary interface. All navigation flows
  MUST return the user to the map as their home state.
- Map interactions (pan, zoom, route tracing) MUST remain
  responsive during data loading. Heavy operations MUST NOT
  block the main thread.
- Error states MUST provide actionable feedback to the user
  (e.g., "Could not load routes. Tap to retry."). Generic
  messages like "Something went wrong" are prohibited.
- UI components MUST use consistent spacing, typography, and
  color tokens. Ad-hoc inline styles for layout properties
  are prohibited when a design token exists.
- Loading states MUST be shown for any operation that takes
  longer than 300ms. Skeleton screens are preferred over
  spinners for content areas.

### IV. Performance Requirements

- Map tile rendering MUST maintain 60fps during pan and zoom
  on target devices (modern mobile browsers, desktop Chrome/
  Firefox/Safari).
- API responses MUST complete within 200ms at p95 for read
  endpoints. Write endpoints MUST complete within 500ms at p95.
- Frontend bundle size MUST NOT exceed 300KB gzipped for the
  initial load (excluding map tiles).
- Geospatial calculations using Turf.js MUST be profiled when
  operating on datasets exceeding 1000 features. Operations
  exceeding 100ms MUST be moved to a Web Worker or debounced.
- Images and static assets MUST use appropriate compression
  and lazy loading.

## Performance Budgets

| Metric | Budget | Measurement |
|--------|--------|-------------|
| First Contentful Paint | < 1.5s | Lighthouse on 4G throttle |
| Largest Contentful Paint | < 2.5s | Lighthouse on 4G throttle |
| Initial JS bundle (gzipped) | < 300KB | Vite build output |
| API read latency (p95) | < 200ms | Server-side metrics |
| API write latency (p95) | < 500ms | Server-side metrics |
| Map interaction framerate | 60fps | Chrome DevTools Performance |

## Development Workflow

- Every feature branch MUST pass `pnpm lint` and `pnpm build`
  before merge.
- Backend changes MUST pass `pnpm test` (Jest) with no
  regressions.
- Commits MUST use conventional commit format
  (e.g., `feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
- Pull requests MUST include a description of what changed
  and why. Reviewers MUST verify compliance with this
  constitution.
- Environment secrets MUST use environment variables. Committing
  `.env` files or logging tokens/secrets is prohibited.

## Governance

- This constitution is the highest-authority document for
  development decisions in RideMyCity. It supersedes ad-hoc
  practices and informal conventions.
- Amendments require: (1) a written proposal describing the
  change, (2) rationale for why the current principle is
  insufficient, and (3) a migration plan if existing code
  must change.
- All pull requests and code reviews MUST verify compliance
  with these principles. Non-compliance MUST be flagged and
  resolved before merge.
- Versioning follows semver: MAJOR for principle removals or
  redefinitions, MINOR for new principles or material
  expansions, PATCH for wording clarifications.
- Refer to `CLAUDE.md` for runtime development guidance,
  commands, and tooling details.

**Version**: 1.0.0 | **Ratified**: 2026-03-06 | **Last Amended**: 2026-03-06
