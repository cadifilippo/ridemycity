# Quickstart: Coordinate Validation Hardening

## What this feature does

Adds robust coordinate validation to `POST /rides` and `POST /avoid-zones` endpoints. Validates point structure, geographic ranges, and polygon closure before data reaches Firestore.

## Files to create

- `apps/api/src/common/validation/coordinates.ts` — validation functions
- `apps/api/src/common/validation/coordinates.spec.ts` — unit tests

## Files to modify

- `apps/api/src/rides/rides.controller.ts` — call validation before service
- `apps/api/src/avoid-zones/avoid-zones.controller.ts` — call validation before service

## How to verify

```bash
cd apps/api
pnpm test -- --testPathPattern=coordinates
```

## Key decisions

- Pure functions, no new NestJS modules or external dependencies
- Fail-fast: stop at first invalid coordinate, return its index
- Strict polygon closure (exact equality, no epsilon)
- Types in `packages/shared`, validation logic in `apps/api`
