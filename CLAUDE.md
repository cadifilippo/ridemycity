# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RideMyCity is a full-stack TypeScript monorepo using pnpm workspaces. The backend is NestJS (port 3000), and the frontend is React 19 + Vite. Shared types live in `packages/shared` (to be created).

## Commands

### Root (run all apps)
```bash
pnpm dev       # Start all apps in watch mode
pnpm build     # Build all apps
```

### API (`apps/api`)
```bash
pnpm dev               # NestJS watch mode (hot reload)
pnpm build             # Compile to dist/
pnpm start:prod        # Run compiled production build
pnpm test              # Unit tests (Jest)
pnpm test:watch        # Unit tests in watch mode
pnpm test:e2e          # E2E tests (Supertest, config: test/jest-e2e.json)
pnpm test:cov          # Coverage report
pnpm lint              # ESLint --fix
pnpm format            # Prettier
```

### Web (`apps/web`)
```bash
pnpm dev       # Vite dev server (HMR)
pnpm build     # tsc type-check + Vite bundle
pnpm preview   # Preview production build
pnpm lint      # ESLint (flat config)
```

To run a single test file:
```bash
# From apps/api
pnpm test -- --testPathPattern=geo.service
```

## Architecture

```
apps/
  api/      # NestJS backend — controllers, services, modules
  web/      # React 19 frontend — components, pages
packages/
  shared/   # Shared TypeScript types (planned)
```

**Layer boundaries (do not cross):**
- React components → API via HTTP only
- NestJS controllers → delegate immediately to services (no business logic in controllers)
- Services → infrastructure (Firebase, Maps, external APIs)

NestJS modules are feature-scoped. Each feature gets its own module, controller, and service. The `app.module.ts` imports feature modules.

## Testing Standards (from AGENTS.md)

**Test file location:** Co-located with source (`geo.service.ts` → `geo.service.spec.ts`). No global `tests/` folder.

**3-Part test naming (mandatory):**
```typescript
it('GeoService.calculateDistance when the route contains two valid coordinates should return a positive distance in kilometers', () => {});
```
Format: `[Unit under test] [scenario] [expected result]`

**AAA pattern (mandatory):** Arrange → Act → Assert.

**Test rules:**
- Use realistic data (real lat/lng, real names). No `foo`, `bar`, or fake placeholders.
- Each test defines its own data — no shared fixtures or global seeds.
- Do not catch errors — use `expect(...).rejects.toThrow(...)`.
- Minimum 2 `describe` levels: unit under test + scenario grouping.

## Security

- Validate all inputs on the backend; never trust client-provided IDs.
- Use NestJS guards for protected endpoints.
- Use environment variables for secrets; never commit `.env` files.
- Enable CORS and security headers; do not expose stack traces in production.
- Log errors but never log tokens or secrets.

## TypeScript Conventions

- Avoid `any` — prefer explicit types or generics.
- Backend: decorators enabled (NestJS), target ES2023, `nodenext` module resolution.
- Frontend: strict mode, bundler module resolution, no unused locals/parameters.
- Shared types must live in `packages/shared`, not duplicated across apps.
