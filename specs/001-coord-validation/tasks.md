# Tasks: Coordinate Validation Hardening

**Input**: Design documents from `/specs/001-coord-validation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included — constitution requires unit tests for new logic (Section II).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the validation utility structure and shared types

- [x] T001 Create coordinate type definitions in `packages/shared/src/types/coordinates.ts`
- [x] T002 Create validation utility file `apps/api/src/common/validation/coordinates.ts` with `validateCoordinatePoint` and `validateCoordinates` functions (structural check: each point is a 2-element array of finite numbers)
- [x] T003 Create test file `apps/api/src/common/validation/coordinates.spec.ts` with tests for structural validation (invalid tuple sizes, non-numeric values, NaN, Infinity, null, valid points)

**Checkpoint**: Validation utility exists and tests pass for point structure validation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No additional foundational work needed — the project structure, NestJS, auth guards, and controllers already exist.

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 — Reject malformed coordinate points (Priority: P1) 🎯 MVP

**Goal**: Every coordinate point submitted to `/rides` or `/avoid-zones` must be a valid `[lng, lat]` pair of finite numbers. Invalid points are rejected with a 400 error indicating the index and reason.

**Independent Test**: `cd apps/api && pnpm test -- --testPathPattern=coordinates`

### Implementation for User Story 1

- [x] T004 [US1] Add `validateCoordinatePoint` function in `apps/api/src/common/validation/coordinates.ts` — checks: is array, length === 2, both elements are `typeof number` and `Number.isFinite`
- [x] T005 [US1] Add `validateCoordinates` function in `apps/api/src/common/validation/coordinates.ts` — iterates all points, calls `validateCoordinatePoint`, throws `BadRequestException` with index of first invalid point
- [x] T006 [US1] Write unit tests in `apps/api/src/common/validation/coordinates.spec.ts` for structural validation: point with 1 element, point with 3 elements, point with string, null, NaN, Infinity, -Infinity, valid point passes
- [x] T007 [US1] Update `apps/api/src/rides/rides.controller.ts` — call `validateCoordinates` after the existing array/length check
- [x] T008 [US1] Update `apps/api/src/avoid-zones/avoid-zones.controller.ts` — call `validateCoordinates` after the existing array/length check

**Checkpoint**: Malformed coordinate points are rejected on both endpoints with descriptive errors. All tests pass.

---

## Phase 4: User Story 2 — Reject out-of-range geographic coordinates (Priority: P1)

**Goal**: Longitude must be in [-180, 180] and latitude in [-90, 90]. Out-of-range values are rejected with a 400 error.

**Independent Test**: `cd apps/api && pnpm test -- --testPathPattern=coordinates`

### Implementation for User Story 2

- [x] T009 [US2] Add geographic range validation to `validateCoordinatePoint` in `apps/api/src/common/validation/coordinates.ts` — check lng ∈ [-180, 180] and lat ∈ [-90, 90]
- [x] T010 [US2] Write unit tests in `apps/api/src/common/validation/coordinates.spec.ts` for range validation: lng > 180, lng < -180, lat > 90, lat < -90, boundary values (180, -180, 90, -90) pass

**Checkpoint**: Out-of-range coordinates are rejected. Boundary values accepted. All tests pass.

---

## Phase 5: User Story 3 — Enforce polygon closure for avoid zones (Priority: P2)

**Goal**: Avoid zone polygons must be closed (first point === last point). Rides are not affected.

**Independent Test**: `cd apps/api && pnpm test -- --testPathPattern=coordinates`

### Implementation for User Story 3

- [x] T011 [US3] Add `validatePolygonClosure` function in `apps/api/src/common/validation/coordinates.ts` — checks `coordinates[0][0] === coordinates[last][0] && coordinates[0][1] === coordinates[last][1]`
- [x] T012 [US3] Write unit tests in `apps/api/src/common/validation/coordinates.spec.ts` for polygon closure: unclosed polygon rejected, closed polygon accepted, minimum 4-point closed polygon accepted
- [x] T013 [US3] Call `validatePolygonClosure` in `apps/api/src/avoid-zones/avoid-zones.controller.ts` after `validateCoordinates`
- [x] T014 [US3] Verify rides controller does NOT enforce closure (negative test: open polyline with 2+ points is accepted)

**Checkpoint**: Unclosed avoid zone polygons are rejected. Rides unaffected. All tests pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across all stories

- [x] T015 Run full test suite `cd apps/api && pnpm test` to verify no regressions
- [x] T016 Run linter `cd apps/api && pnpm lint` and fix any issues
- [x] T017 Verify existing ride and avoid-zone controller tests still pass (regression check)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: N/A (no foundational work needed)
- **US1 (Phase 3)**: Depends on Setup (T001-T003)
- **US2 (Phase 4)**: Depends on US1 (extends the same validation function)
- **US3 (Phase 5)**: Depends on US1 (uses validateCoordinates, adds closure on top)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Setup — no dependencies on other stories
- **US2 (P1)**: Depends on US1 (extends `validateCoordinatePoint` with range checks)
- **US3 (P2)**: Depends on US1 (adds closure check after point validation). Independent of US2.

### Within Each User Story

- Tests written alongside implementation (same files)
- Validation logic before controller integration
- Verify after each story checkpoint

### Parallel Opportunities

- T001 (types) and T002-T003 (validation utility + tests) can be done in parallel
- US2 and US3 are independent of each other (both depend on US1 only)
- T015, T016 can run in parallel in Polish phase

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 3: US1 (T004-T008)
3. **STOP and VALIDATE**: Malformed points rejected on both endpoints
4. This alone blocks the most common data corruption vector

### Incremental Delivery

1. Setup → US1 → validate (MVP: structural validation)
2. Add US2 → validate (range checks added)
3. Add US3 → validate (polygon closure for avoid zones)
4. Polish → full regression check

---

## Notes

- All validation lives in one file (`coordinates.ts`) with one test file (`coordinates.spec.ts`)
- Controllers only call the validation functions — no business logic in controllers
- US2 extends the same function from US1 (not a separate function), so it depends on US1
- US3 adds a new function but is independent of US2
- Total: 17 tasks across 6 phases
