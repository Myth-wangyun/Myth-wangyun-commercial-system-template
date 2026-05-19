# Backend Testing Policy

`pytest` is the canonical backend runtime validation layer. Static checks are not accepted as a substitute for executable tests.

## Goals

- Keep the default backend pytest gate self-contained and repeatable.
- Detect import, startup, routing, database, and HTTP regressions with real assertions.
- Separate trustworthy automated suites from manual or operator-driven probes.

## Test Layers

- `smoke`
  - Fast import, route-registration, startup-wiring, and focused regression checks.
  - Must run on every backend change.
- `integration`
  - Real persistence, CRUD, and multi-layer behavior checks.
  - May create or reset a dedicated test database.
- `http`
  - End-to-end API checks against a backend process started by the test itself.
- `db`
  - Tests that seed, migrate, or reset a test database.

## Default Automated Gate

- Canonical config: `pytest.ini`
- Canonical command:
  - `node scripts/development/repo_python.mjs -m pytest -q backend/test/units`
- The default gate only includes tests that:
  - manage their own setup and teardown
  - do not require a manually started backend
  - do not depend on a fixed localhost service outside the test
  - contain assertions that fail on real regressions
  - do not perform real database or outbound HTTP I/O

## Coverage Baseline

- The units-first gate reports coverage for `backend/app`.
- The current enforced fail-under is the honest baseline of the implemented units suite, not the long-term target.
- Raising this gate requires adding real tests, not excluding large code areas or weakening assertions.

## Excluded From The Default Gate

- Ad-hoc probe scripts that only print output.
- Tests that hardcode `http://127.0.0.1:8000` or similar external dependencies without starting the server themselves.
- Manual, operator-attached, or browser-driven suites.
- Current examples:
  - `backend/test/test_api.py`
  - `backend/test/test_all_routes.py`
  - `backend/test/test_routes.py`
  - `backend/test/test_human_resources_dashboard_http_attached.py`
  - `backend/test/manual/`
  - `backend/test/puppeteer/`

## Hard Rules

- No import-time network calls, writes, or destructive side effects in `test_*.py`.
- Every test must assert on behavior; printing alone is not a test.
- Backend HTTP tests must either:
  - start their own server, or
  - stay outside the default automated gate and be documented as attached/manual.
- Database tests must use `.env.test` or a dedicated test database and must not hit production data.
- Changes to imports, route registration, startup hooks, dependency injection, or settings wiring must include a smoke test.
- Changes to DB-backed behavior must include either an integration test or a documented reason why the existing suite already covers it.

## Execution Order

1. Targeted smoke tests for the touched area.
2. Targeted integration tests for the touched area.
3. Full automated backend pytest gate.
4. Optional attached/manual suites only when the change needs them.

## Standard Commands

- Smoke:
  - `node scripts/development/repo_python.mjs -m pytest -q -m smoke backend/test/units`
- Full automated backend units suite:
  - `node scripts/development/repo_python.mjs -m pytest -q backend/test/units`
- Integration suite:
  - `node scripts/development/repo_python.mjs -m pytest -q -c pytest.integration.ini -m integration backend/test`
- Example attached/manual suite:
  - `set TEST_BASE_URL=http://127.0.0.1:8000`
  - `node scripts/development/repo_python.mjs -m pytest -q backend/test/test_human_resources_dashboard_http_attached.py -s`

## Acceptance Rule

A backend batch is not accepted until:

- touched files pass `ruff + pyrefly + mypy + py_compile`
- targeted pytest coverage for the touched area passes
- the full automated backend pytest gate passes

If a suite is intentionally excluded from the default gate, the reason must be explicit in this document or in the owning test module docstring.
