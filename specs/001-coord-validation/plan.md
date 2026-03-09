# Implementation Plan: Coordinate Validation Hardening

**Branch**: `001-coord-validation` | **Date**: 2026-03-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-coord-validation/spec.md`

## Summary

The backend currently validates only that `coordinates` is an array with a minimum length. This plan adds structural validation (each point is a `[lng, lat]` tuple of finite numbers), geographic range validation (lng ∈ [-180, 180], lat ∈ [-90, 90]), and polygon closure validation (first point === last point for avoid zones). Validation logic lives in a shared utility consumed by both controllers.

## Technical Context

**Language/Version**: TypeScript (strict mode), Node.js, ES2023 target
**Primary Dependencies**: NestJS (controllers, guards, exceptions)
**Storage**: Firestore (no schema changes needed — this is input validation before persistence)
**Testing**: Jest (co-located `.spec.ts` files, AAA pattern, 3-part naming)
**Target Platform**: Linux server / Node.js runtime
**Project Type**: Web service (backend API)
**Performance Goals**: Write endpoints < 500ms p95 (validation adds negligible overhead)
**Constraints**: No new dependencies; pure TypeScript validation functions
**Scale/Scope**: 2 endpoints affected (`POST /rides`, `POST /avoid-zones`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality & Type Safety — No `any`, strict mode | PASS | Validation uses explicit types |
| I. Controllers delegate to services | PASS | Validation runs in controller layer (input validation is controller responsibility per NestJS convention); business logic stays in services |
| I. Feature module structure | PASS | No new module needed — extends existing controllers |
| I. Shared types in `packages/shared` | PASS | Coordinate types will be defined in shared package |
| I. All inputs validated on backend | PASS | This feature's entire purpose |
| II. Co-located tests | PASS | Validation utility gets co-located spec file |
| II. 3-part test naming, AAA, realistic data | PASS | Plan follows these standards |
| III. Actionable error messages | PASS | FR-005 requires descriptive errors |
| IV. Write endpoint < 500ms p95 | PASS | Pure in-memory validation, negligible overhead |

No violations. Gate passes.

## Project Structure

### Documentation (this feature)

```text
specs/001-coord-validation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── endpoints.md     # Updated endpoint contracts
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
apps/api/src/
├── common/
│   └── validation/
│       ├── coordinates.ts          # Shared validation functions
│       └── coordinates.spec.ts     # Unit tests
├── rides/
│   └── rides.controller.ts         # Updated with validation calls
├── avoid-zones/
│   └── avoid-zones.controller.ts   # Updated with validation calls
packages/shared/
└── src/
    └── types/
        └── coordinates.ts          # Coordinate type definitions
```

**Structure Decision**: Validation functions live in `apps/api/src/common/validation/` as a shared utility within the API app. Type definitions go in `packages/shared` per constitution. No new NestJS module is needed since this is cross-cutting input validation, not a new domain feature.

## Complexity Tracking

No violations to justify. The implementation is minimal: one utility file with pure functions, consumed by two existing controllers.
