# Research: Coordinate Validation Hardening

**Date**: 2026-03-06

## R1: Coordinate Validation Approach

**Decision**: Pure functions with early-return validation — no external validation libraries.

**Rationale**: The validation rules are simple (type checks, range checks, equality check). Adding a library like `class-validator` or `joi` would be overkill and would introduce a new dependency. NestJS pipes/DTOs with `class-validator` are an option but the project doesn't currently use them, and adding that pattern for two endpoints is premature.

**Alternatives considered**:
- `class-validator` + `class-transformer` DTOs: Heavier setup, requires decorators and transformation pipeline. Better for projects with many endpoints and complex DTOs. Not justified here.
- NestJS `ValidationPipe` with Zod: Would require adding `zod` as a dependency. Powerful but overkill for coordinate tuples.
- Inline validation in each controller: Duplicates logic across rides and avoid-zones controllers. Rejected per DRY.

## R2: Error Message Granularity

**Decision**: Return the index of the first invalid coordinate point and the specific validation failure reason.

**Rationale**: Helps the client identify exactly which point caused the rejection. Returning all errors at once was considered but adds complexity without clear user value (the client typically fixes and resubmits).

**Alternatives considered**:
- Return all validation errors at once: More complex, and the client UI doesn't currently support multi-error display for coordinates.
- Return only a generic "invalid coordinates" message: Too vague, contradicts constitution principle III (actionable error messages).

## R3: Where to Place Validation Logic

**Decision**: `apps/api/src/common/validation/coordinates.ts` — a shared utility within the API app.

**Rationale**: Both controllers need the same validation. Placing it in a common directory makes it importable by any controller without creating a NestJS module. It's pure functions with no dependencies on NestJS or Firestore.

**Alternatives considered**:
- NestJS custom pipe: Would require creating a pipe class, registering it, and handling the transformation. More ceremony than needed for a simple function call.
- Validation in the service layer: Controllers are the right place for input validation (services handle business logic). The validation utility is called from controllers.
- `packages/shared`: Validation logic uses `BadRequestException` from NestJS, which is backend-specific. Only the type definitions belong in shared.

## R4: Polygon Closure Check

**Decision**: Strict equality check — first point must exactly equal last point (`[lng1, lat1] === [lng2, lat2]` by value).

**Rationale**: GeoJSON spec requires the first and last positions to be equivalent. Floating-point epsilon comparison is unnecessary since the client sends the exact same point (copy of first point appended).

**Alternatives considered**:
- Epsilon-based comparison (e.g., within 1e-10): Adds complexity for a case that shouldn't occur (client sends exact coordinates, not computed approximations).
- Auto-close the polygon by appending the first point: Changes the semantics of the input silently. Rejected — explicit is better than implicit, and the client should be aware of the requirement.
