# Feature Specification: E2E Tests for Rides and Avoid Zones

**Feature Branch**: `002-e2e-tests`
**Created**: 2026-03-06
**Status**: Draft
**Input**: User description: "Agreguemos playwright y test e2e para la creación de rides y avoid-zones"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - E2E test infrastructure setup (Priority: P1)

As a developer, I need an E2E testing framework configured and ready to run so that I can write browser-based tests that exercise the full application stack (frontend + backend + database). The framework must be able to authenticate users, interact with the map UI, and verify data persistence through the API.

**Why this priority**: Without the infrastructure (test runner, authentication helpers, server orchestration), no E2E tests can be written. This is the foundation for all other stories.

**Independent Test**: The test runner can be invoked, launch a browser, navigate to the application, and complete a basic health check (page loads, map renders).

**Acceptance Scenarios**:

1. **Given** a developer with the project cloned, **When** they run the E2E test command, **Then** the test runner starts the backend and frontend, launches a browser, and executes at least one passing smoke test.
2. **Given** the E2E test environment, **When** tests need an authenticated user, **Then** a reusable authentication helper logs in the user without manual interaction.
3. **Given** the E2E test environment, **When** all tests complete, **Then** the browser closes, test servers shut down, and results are reported with pass/fail status.

---

### User Story 2 - E2E test for ride creation (Priority: P1)

As a developer, I need an E2E test that verifies the complete ride creation flow: an authenticated user draws a route on the map, submits it, and the ride appears in their ride list. This validates that frontend map interactions, API coordinate submission, and data persistence all work together correctly.

**Why this priority**: Ride creation is the core feature of the app. Verifying it end-to-end catches integration bugs that unit tests miss (serialization issues, auth token handling, map interaction to API payload mapping).

**Independent Test**: Run only the ride creation test suite and verify it passes in isolation.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the map page, **When** they trace a route by clicking/interacting with the map and submit it, **Then** the ride is created successfully and appears in the user's ride list.
2. **Given** an authenticated user, **When** they submit a ride with valid coordinates through the UI, **Then** the API responds with success and the ride is persisted.
3. **Given** an authenticated user, **When** they submit a ride and then refresh the page, **Then** the previously created ride is still visible (data persisted).
4. **Given** an authenticated user, **When** they attempt to create a ride with invalid data (e.g., fewer than 2 points), **Then** the system shows an appropriate error message.

---

### User Story 3 - E2E test for avoid zone creation (Priority: P2)

As a developer, I need an E2E test that verifies the complete avoid zone creation flow: an authenticated user draws a polygon on the map, submits it, and the avoid zone appears in their zone list. This validates polygon drawing, closure enforcement, and persistence.

**Why this priority**: Avoid zones are secondary to rides in the core user loop but still critical for correct spatial behavior. Testing them E2E ensures polygon closure validation works through the full stack.

**Independent Test**: Run only the avoid zone creation test suite and verify it passes in isolation.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the map page, **When** they draw a polygon on the map and submit it, **Then** the avoid zone is created successfully and appears in the user's zone list.
2. **Given** an authenticated user, **When** they submit an avoid zone with a valid closed polygon, **Then** the API responds with success and the zone is persisted.
3. **Given** an authenticated user, **When** they submit an avoid zone and refresh the page, **Then** the zone is still visible (data persisted).
4. **Given** an authenticated user, **When** they attempt to create an avoid zone with fewer than 4 points or an unclosed polygon, **Then** the system shows an appropriate error message.

---

### Edge Cases

- What happens when the backend is down while running E2E tests? Tests fail with a clear connection error, not a cryptic timeout.
- What happens when the test user's authentication token expires mid-test? The auth helper refreshes or re-authenticates transparently.
- What happens when a previous test run left stale data? Each test cleans up its own data (rides/zones created during the test are deleted after).
- What happens when the map takes too long to load tiles? Tests wait for the map to be interactive before proceeding, with a reasonable timeout.
- What happens when tests are run in CI without a display? Tests run in headless mode by default.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The E2E test suite MUST be runnable with a single command from the project root.
- **FR-002**: The E2E test suite MUST start the backend and frontend servers automatically before tests run and shut them down after.
- **FR-003**: The E2E test suite MUST support authenticated user sessions without requiring manual login during test execution.
- **FR-004**: The E2E test suite MUST include at least one test for the complete ride creation flow (authenticate, interact with map, submit, verify persistence).
- **FR-005**: The E2E test suite MUST include at least one test for the complete avoid zone creation flow (authenticate, draw polygon, submit, verify persistence).
- **FR-006**: The E2E test suite MUST run in headless mode by default (suitable for CI environments) with an option for headed mode during debugging.
- **FR-007**: Each test MUST clean up data it creates (delete rides/zones after test completion) to prevent test pollution.
- **FR-008**: The E2E test suite MUST produce clear pass/fail output with error screenshots on failure.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The complete E2E test suite runs and passes in under 2 minutes on a development machine.
- **SC-002**: 100% of ride creation happy-path scenarios are covered by at least one E2E test.
- **SC-003**: 100% of avoid zone creation happy-path scenarios are covered by at least one E2E test.
- **SC-004**: Failed tests produce a screenshot or trace artifact that allows debugging without re-running.
- **SC-005**: The E2E suite can run in CI without manual intervention or external service dependencies beyond the application itself.

## Assumptions

- E2E tests will use a test-specific user account (not production credentials).
- The test environment uses the same Firestore instance (or emulator) as the development environment.
- Map interactions can be simulated programmatically (clicking coordinates on the map canvas).
- The E2E tests do not replace existing unit tests; they complement them by testing integration across the full stack.
- The frontend must be running alongside the backend for E2E tests to work.
