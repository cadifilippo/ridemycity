# AGENTS.md — RideMyCity (Guide to work with IA as copilot)

## Architecture Guidelines

- Follow pragmatic clean architecture.
- Keep clear separation between:
  - UI (React)
  - Business logic (Nest services)
  - Infrastructure (Firebase, Map, external APIs)
- Do not put business logic in controllers.
- Avoid `any`.
- Prefer small modules and explicit naming.
- Shared types must live in `packages/shared`.

---

## Testing Standards

### Test Location

- Unit tests must live next to the file being tested.
- Example:
  - geo.service.ts
  - geo.service.spec.ts

No global `tests/` folder for unit tests.

---

### Test Naming (3-Part Rule – Mandatory)

Each test name must include:

1. What is being tested
2. Under which scenario
3. What is the expected result

Example:

```typescript
it('GeoService.calculateDistance when the route contains two valid coordinates should return a positive distance in kilometers', () => {});
```

### Tests must read like documentation.

### AAA Pattern (Mandatory)

### Test Rules

- Use realistic data (realistic lat/lng, real names).
- Do not use foo, bar, or fake placeholders.
- Do not use global fixtures or shared seeded data.
- Each test must define its own data.
- Do not catch errors — expect them.
- Use at least 2 describe levels:
  - Unit under test
  - Scenario grouping

## Security (OWASP Top 10 Aligned)

- Validate all inputs in the backend
- Never trust client-provided IDs
- Use guards for protected endpoints
- Never store secrets in the repo
- Use environment variables
- Enable CORS and security headers
- Do not expose stack traces in production
- Log errors but never log tokens or secrets
