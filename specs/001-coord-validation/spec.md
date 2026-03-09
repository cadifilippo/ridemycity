# Feature Specification: Coordinate Validation Hardening

**Feature Branch**: `001-coord-validation`
**Created**: 2026-03-06
**Status**: Draft
**Input**: User description: "Validación backend insuficiente de coordenadas (riesgo de datos corruptos y abuso de payloads). Solo validas 'array y longitud mínima', pero no validas estructura de cada punto ([lng, lat]), rangos geográficos, NaN/Infinity, ni cierre real del polígono en backend. Eso permite persistir geometrías inválidas."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reject malformed coordinate points (Priority: P1)

When a user submits a ride or an avoid zone, each coordinate point must be a valid `[longitude, latitude]` pair. Currently, the backend only checks that coordinates is an array with a minimum length, but individual points can be strings, nested arrays, missing values, or have wrong tuple sizes. This allows corrupted geometry data to be persisted.

**Why this priority**: Malformed points are the most basic validation gap and the easiest vector for data corruption. Every other validation depends on points being structurally valid first.

**Independent Test**: Send a POST request to `/rides` or `/avoid-zones` with coordinates containing invalid point structures and verify they are rejected with a clear error message.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they submit coordinates where a point has fewer than 2 elements (e.g., `[[10]]`), **Then** the system rejects the request with a 400 error describing the invalid point.
2. **Given** an authenticated user, **When** they submit coordinates where a point has more than 2 elements (e.g., `[[10, 20, 30]]`), **Then** the system rejects the request with a 400 error.
3. **Given** an authenticated user, **When** they submit coordinates containing non-numeric values (e.g., `[["abc", 20]]`, `[[null, 20]]`, `[[NaN, 20]]`, `[[Infinity, 20]]`), **Then** the system rejects the request with a 400 error.
4. **Given** an authenticated user, **When** they submit coordinates where all points are valid `[lng, lat]` pairs with finite numbers, **Then** the system accepts the request and processes it normally.

---

### User Story 2 - Reject out-of-range geographic coordinates (Priority: P1)

Longitude must be in the range [-180, 180] and latitude in [-90, 90]. Currently there is no range check, so values like `[999, 999]` are accepted and persisted, producing nonsensical geometries that break map rendering and spatial calculations.

**Why this priority**: Out-of-range coordinates are the second most common corruption vector and can silently break downstream geo computations (Turf.js intersections, buffers, etc.).

**Independent Test**: Send coordinates with out-of-range values and verify they are rejected; send coordinates at geographic boundaries and verify they are accepted.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they submit a ride with a point where longitude exceeds 180 or is below -180 (e.g., `[[200, 45]]`), **Then** the system rejects the request with a 400 error indicating the coordinate is out of range.
2. **Given** an authenticated user, **When** they submit an avoid zone with a point where latitude exceeds 90 or is below -90 (e.g., `[[-70, 95]]`), **Then** the system rejects the request with a 400 error.
3. **Given** an authenticated user, **When** they submit coordinates at valid boundary values (e.g., `[[180, 90]]`, `[[-180, -90]]`), **Then** the system accepts the request.

---

### User Story 3 - Enforce polygon closure for avoid zones (Priority: P2)

Avoid zones represent polygons. A valid GeoJSON polygon requires that the first and last coordinate be identical (the ring must be closed). Currently there is no closure check, which can produce open geometries that behave unpredictably in spatial operations.

**Why this priority**: Polygon closure is specific to avoid zones and is important for correct spatial queries, but rides (polylines) do not require closure, so this is secondary to universal point validation.

**Independent Test**: Send an avoid zone with coordinates where the first and last points differ, and verify it is rejected; send one where they match, and verify it is accepted.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they submit an avoid zone where the first and last coordinates are not identical (e.g., `[[0,0],[1,0],[1,1],[0,1]]`), **Then** the system rejects the request with a 400 error indicating the polygon must be closed.
2. **Given** an authenticated user, **When** they submit an avoid zone where the first and last coordinates are identical (e.g., `[[0,0],[1,0],[1,1],[0,1],[0,0]]`), **Then** the system accepts the request.

---

### Edge Cases

- What happens when coordinates is an empty array `[]`? → Rejected (existing min-length check covers this).
- What happens when a point contains `-0`? → Accepted, as `-0 === 0` in IEEE 754 and is a valid geographic coordinate.
- What happens when coordinates contain duplicate consecutive points (e.g., `[[10,20],[10,20],[11,21]]`)? → Accepted; deduplication is not a validation concern at this layer.
- What happens when the payload is extremely large (e.g., 100,000 points)? → Accepted by coordinate validation, but handled by existing payload size limits or a separate concern.
- What happens when a polygon has exactly 4 points but the first and last differ? → Rejected (closure check fails).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST validate that every element in the coordinates array is a two-element array of finite numbers.
- **FR-002**: System MUST validate that longitude values are within [-180, 180] and latitude values are within [-90, 90] for every coordinate point.
- **FR-003**: System MUST reject coordinates containing `NaN`, `Infinity`, `-Infinity`, `null`, `undefined`, strings, or any non-finite-number value with a 400 error.
- **FR-004**: System MUST validate that avoid zone polygons are closed (first point equals last point).
- **FR-005**: System MUST return descriptive error messages that indicate which validation rule failed.
- **FR-006**: System MUST apply these validations to both the rides endpoint (`POST /rides`) and the avoid-zones endpoint (`POST /avoid-zones`).
- **FR-007**: System MUST preserve existing minimum-length validations (at least 2 points for rides, at least 4 points for avoid zones).

### Key Entities

- **Coordinate Point**: A two-element array `[longitude, latitude]` where both values are finite numbers within geographic bounds.
- **Ride Coordinates**: An ordered list of at least 2 valid coordinate points representing a polyline.
- **Avoid Zone Coordinates**: An ordered list of at least 4 valid coordinate points representing a closed polygon (first point equals last point).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of requests with structurally invalid coordinate points (wrong tuple size, non-numeric values, NaN, Infinity) are rejected before data is persisted.
- **SC-002**: 100% of requests with out-of-range coordinates (longitude outside [-180, 180], latitude outside [-90, 90]) are rejected before data is persisted.
- **SC-003**: 100% of avoid zone requests with unclosed polygons are rejected before data is persisted.
- **SC-004**: All valid coordinate payloads that previously succeeded continue to succeed without regression.
- **SC-005**: Error responses clearly describe the validation failure so the client can correct the request.

## Assumptions

- Coordinate order follows the GeoJSON convention: `[longitude, latitude]` (not `[lat, lng]`).
- Payload size limiting (max number of points) is a separate concern and not in scope for this feature.
- The frontend may also validate coordinates, but the backend is the authoritative validation layer.
- Polygon winding order (clockwise vs counter-clockwise) is not validated at this layer.
