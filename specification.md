# QM System Specification

Last updated: 2026-03-11

## 1. Purpose

This document is the source-level testing specification for the QM System repository.

It serves three purposes:

1. Define the real system boundaries from code, not from memory.
2. Separate current implemented capabilities from target full-coverage goals.
3. Provide a stable contract for expanding `Vitest`, `Pytest`, and `Playwright` coverage without mixing their responsibilities.

The testing rule for this repository is:

- `Vitest` covers frontend source code behavior.
- `Pytest` covers backend source code behavior and all HTTP API contracts.
- `Playwright` covers only real end-to-end system behavior on top of a running backend, frontend, and test database.

## 2. Repository Reality Snapshot

The repository already contains a substantial part of the originally proposed test infrastructure.

### 2.1 Frontend route inventory

Canonical source:

- `frontend/config/router/routes.ts`

Source-derived facts:

- `148` route path definitions exist in `ALL_ROUTES`.
- `5` routes are explicitly marked `hidden: true`.
- `2` routes are explicitly public with `requiresAuth: false`.
- `CORE_DATA_ROUTES` is currently empty.
- The operational route inventory is therefore driven by `STANDALONE_ROUTES`.

### 2.2 Frontend test inventory

Canonical sources:

- `vitest.config.ts`
- `tests/helpers/route-groups.ts`
- `tests/pages/*.spec.ts`

Source-derived facts:

- `11` frontend unit/integration test files currently exist under `frontend/**`.
- `7` Playwright page-group specs currently exist under `tests/pages/`.
- `4` Playwright helper files currently exist under `tests/helpers/`.

### 2.3 Backend API inventory

Canonical sources:

- `main.py`
- `backend/main.py`
- `backend/app/api/v1/__init__.py`
- `backend/app/api/v1/endpoints/**`
- `backend/app/services/market/baidu_marketing/routes.py`
- `backend/app/teaching_quality/*_api.py`

Source-derived facts:

- `backend/app/api/v1/__init__.py` currently contains `137` `api_router.include_router(...)` registrations.
- Repository-wide backend endpoint decorators currently total about `1340` (`@router.get/post/put/delete/patch`) across `backend/app/api/v1`, `backend/app/services/market/baidu_marketing/routes.py`, and `backend/app/teaching_quality`.
- `backend/main.py` also dynamically loads every `backend/app/teaching_quality/*_api.py` module at startup and mounts them under `/api/v1/teaching-quality`.

### 2.4 Backend test inventory

Canonical sources:

- `backend/test/**`
- `backend/requirements.txt`

Source-derived facts:

- `48` pytest test files currently exist under `backend/test/`.
- Current coverage is uneven and heavily concentrated in human resources, integration helpers, and manual/debug test assets.

### 2.5 Existing E2E infrastructure

Already implemented in source:

- `scripts/db/export_multi_db.py`
- `scripts/db/merge_exports.py`
- `scripts/db/import_for_e2e.py`
- `backend/test/start_full_e2e_backend.py`
- `playwright.config.ts` with a `full-e2e` project
- `tests/helpers/auth.ts`
- `tests/helpers/page-check.ts`
- `tests/helpers/console-errors.ts`
- `tests/pages/{academic,teaching-quality,market,consult,humanresources,config,management}.spec.ts`
- `scripts/e2e/run_full_e2e.sh`

This means the repository is not starting from zero. The remaining work is to turn partial test scaffolding into full test coverage with stable manifests and stronger assertions.

## 3. System Topology

### 3.1 Runtime architecture

The repository is a full-stack monorepo with:

- Frontend: React + Vite + TypeScript
- Backend: FastAPI + SQLAlchemy + PostgreSQL
- Test runner layers:
  - `Vitest` for frontend source
  - `Pytest` for backend source and API
  - `Playwright` for browser-based E2E

### 3.2 Request flow

Normal runtime flow:

1. Browser loads frontend via Vite dev server or built assets.
2. Frontend uses `VITE_API_BASE_URL=/api/v1`.
3. Vite proxy forwards `/api/v1` requests to a FastAPI backend.
4. Backend reads and writes PostgreSQL data across multiple schemas.

### 3.3 Backend entrypoints

Primary runtime entry:

- `python main.py`

Relevant behavior from source:

- repository root `main.py` is the stable launcher
- root `main.py` re-execs into `.venv` when needed and then delegates to `backend/main.py`
- `main.py` sets environment mode early.
- `main.py` enables cached dynamic imports via `app.core.dynamic_import.enable_importlib_cache()`.
- `main.py` imports `app.api.v1.api_router`.
- `main.py` also mounts dynamic teaching-quality routers discovered from `backend/app/teaching_quality/*_api.py`.

## 4. Auth, Roles, and Cross-Cutting State

### 4.1 Auth model

Canonical sources:

- `backend/app/api/v1/endpoints/auth.py`
- `frontend/stores/authStore.ts`
- `tests/helpers/auth.ts`

Testing assumptions already encoded in source:

- Full Playwright E2E uses administrator credentials:
  - username: `admin`
  - password: `qingmeijiaoyu123..`
- The login flow is expected to redirect away from `/login` and render the main layout header.

### 4.2 Campus context

Canonical sources:

- `frontend/stores/campusStore.ts`
- `tests/helpers/auth.ts`

Important invariant:

- Many pages require campus context even for administrator users.
- Existing E2E helpers currently inject campus context through `localStorage` under `campus-storage`.
- Full E2E coverage must preserve this behavior or replace it with a better system-level setup, but not silently drop it.

### 4.3 Health contract

Canonical sources:

- `backend/app/api/v1/endpoints/health.py`
- `backend/test/start_full_e2e_backend.py`
- `backend/test/start_human_resources_e2e_backend.py`

Invariant:

- Backend readiness for browser E2E is defined by a healthy `/health` endpoint.

## 5. Frontend Functional Surface

### 5.1 Route model

Canonical source:

- `frontend/config/router/routes.ts`

Each route is defined by:

- `key`
- `path`
- `type`
- `menuKey` for future core-data routes
- `meta.title`
- `meta.requiresAuth`
- optional permission/roles/hidden metadata

### 5.2 Current route grouping for Playwright

Canonical source:

- `tests/helpers/route-groups.ts`

Current source-driven route groups:

- `management`
  - approval center
  - management-center paths
  - `-mgnt-` paths
- `academic`
  - `/academic*`
  - `/employment*`
  - `/campus*`
  - excluding management
- `teachingQuality`
  - `/teaching-quality*`
  - excluding management
- `market`
  - `/market*`
  - excluding management
- `consult`
  - `/consult*`
  - `/consulting*`
  - excluding management
- `humanresources`
  - `/humanresources*`
  - excluding management
- `config`
  - `/system*`
  - `/logs`
  - excluding management

### 5.3 Frontend module families that must be covered by Vitest

`Vitest` must cover source behavior, not just routed pages.

Minimum frontend source coverage families:

- `frontend/api/**`
- `frontend/services/**`
- `frontend/stores/**`
- `frontend/hooks/**`
- `frontend/components/**`
- `frontend/pages/**` page-level view logic where isolated rendering is feasible
- `frontend/config/router/routes.ts`
- layout and auth guards:
  - `frontend/components/layout/**`
  - `frontend/components/auth/**`

### 5.4 Frontend non-functional invariants

Every authenticated page should satisfy:

- correct route transition
- visible application root container
- visible main header after login
- visible page heading or equivalent title content
- no `404`
- no `500`
- no `console.error`
- no `pageerror`

These are already encoded by:

- `tests/helpers/page-check.ts`
- `tests/helpers/console-errors.ts`

## 6. Backend Functional Surface

### 6.1 API inventory source of truth

The authoritative backend API inventory is not a hand-written spreadsheet. It comes from code:

- static router registration in `backend/app/api/v1/__init__.py`
- dynamic teaching-quality router discovery in `backend/main.py`
- router decorators in endpoint modules

### 6.2 Backend domain groups

The API surface is broad and at minimum includes:

- auth
- health
- market
- baidu marketing
- academic
- teaching quality
- consult
- human resources
- config / permissions
- campus / employment / reputation / stability
- logs / audit
- approval workflows and interview flows

### 6.3 Backend source layers that must be covered by Pytest

`Pytest` owns backend source and API coverage.

Minimum backend coverage families:

- `backend/app/api/v1/endpoints/**`
- `backend/app/services/**`
- `backend/app/crud/**`
- `backend/app/core/**` where behavior is non-trivial
- selected `backend/app/schemas/**` validation behavior
- start/seed flows used by E2E bootstrap:
  - `backend/test/start_full_e2e_backend.py`
  - `backend/test/start_human_resources_e2e_backend.py`

### 6.4 API coverage rule

“All API coverage” in this repository means:

1. Every routable backend endpoint must be discoverable from code.
2. Every endpoint must have at least one success-path test.
3. Every protected endpoint must have auth/permission coverage.
4. Validation-heavy endpoints must have request error coverage.
5. Business-critical endpoints must have state-changing assertions against the test DB.

This coverage belongs in `Pytest`, not `Playwright`.

## 7. Data Model and E2E Dataset Pipeline

### 7.1 Production-like test data objective

The full E2E target state is:

1. Export multiple local PostgreSQL databases.
2. Merge and deduplicate them into a unified dataset.
3. Import that dataset into an isolated browser E2E database.
4. Seed only minimal time-sensitive runtime data on top.
5. Run Playwright against the real stack.

### 7.2 Implemented data pipeline components

Source-confirmed components:

- `scripts/db/export_multi_db.py`
  - exports multiple databases to `data/raw/{db}/{schema}/{table}.json`
  - can reuse `data/20260127_151218` as a `qmjy` baseline
- `scripts/db/merge_exports.py`
  - merges `data/raw`
  - uses PK lookup first, then fallback key inference
  - writes merged result to `data/merged/{timestamp}`
- `scripts/db/import_for_e2e.py`
  - imports latest merged dataset into `qmjy_test_e2e_all` by default
  - ensures an administrator user exists
- `scripts/e2e/run_full_e2e.sh`
  - orchestrates export, merge, import, and Playwright execution

### 7.3 Full E2E backend bootstrap

Canonical source:

- `backend/test/start_full_e2e_backend.py`

Current source behavior:

- targets `qmjy_test_e2e_all` by default
- does not reset the DB on every run unless upstream import does so
- ensures admin user exists
- seeds minimum human resources dashboard runtime data
- waits for `/health`

## 8. Testing Layer Responsibilities

### 8.1 Vitest

Vitest is responsible for fast, deterministic frontend source testing.

It should cover:

- component rendering logic
- store state transitions
- hooks and utility behavior
- API client adapters and response mapping
- route metadata and permission rules
- page-level rendering logic with mocked network where needed

Vitest should not be used as the primary mechanism for real backend API coverage.

### 8.2 Pytest

Pytest is responsible for backend source and HTTP API coverage.

It should cover:

- CRUD and service logic
- schema validation
- permissions and workflow branching
- HTTP endpoint behavior through FastAPI test clients or attached test backends
- DB state transitions
- regression tests for typing/hardening fixes

Pytest should own “all API coverage”.

### 8.3 Playwright

Playwright is responsible for real system E2E coverage only.

It should cover:

- login flows
- cross-module navigation
- page accessibility and rendering
- core user journeys on top of a real backend and real database
- browser/runtime regressions such as console errors and broken navigation

Playwright should not be the only layer covering API correctness or isolated business logic.

## 9. Current Gaps vs Target State

### 9.1 What already exists

Already present:

- full-e2e database pipeline scripts
- full-e2e backend bootstrap
- Playwright full-e2e project
- route-group-based page smoke tests
- admin login helper

### 9.2 What is still missing for true full coverage

Still missing:

1. A machine-readable frontend route manifest for coverage accounting.
2. A machine-readable backend API manifest derived from endpoint decorators.
3. A route-to-endpoint-to-data-domain mapping ledger.
4. Broad frontend source coverage beyond the current `11` Vitest test files.
5. Broad backend API coverage beyond the current `48` pytest files.
6. Playwright user-journey coverage beyond page smoke/accessibility checks.

## 10. Acceptance Criteria for the Full Test Program

The target “full test” state should satisfy all of the following:

### 10.1 Frontend

- Every significant frontend source area has Vitest coverage.
- Route configuration changes are validated by tests.
- Shared helpers, stores, hooks, and services have deterministic unit coverage.

### 10.2 Backend

- Every API endpoint is mapped to Pytest coverage.
- Auth, validation, and success-path behavior are all exercised.
- Business-critical state transitions are verified against a test DB.

### 10.3 E2E

- Every authenticated non-hidden frontend route has at least page-accessibility coverage.
- Cross-module core user journeys are covered in Playwright.
- Full E2E runs against the isolated `qmjy_test_e2e_all` data path.

### 10.4 Operational

- Test bootstrap depends on `/health`, not fixed sleeps.
- E2E data remains isolated from existing HR-specific test DBs.
- Non-desensitized local test data is treated as local-only test asset.

## 11. Immediate Next Steps

The next implementation steps should be:

1. Generate a machine-readable frontend route manifest from `frontend/config/router/routes.ts`.
2. Generate a machine-readable backend API manifest from router decorators and `include_router(...)` registrations.
3. Create a coverage ledger that maps:
   - frontend route
   - frontend page/component/service
   - backend endpoint prefix
   - pytest test file
   - playwright spec
4. Expand Vitest until all major frontend source families are covered.
5. Expand Pytest until every backend endpoint has explicit coverage.
6. Keep Playwright focused on integrated behavior and real user flows only.

## 12. Canonical Source Files

Primary system specification sources in this repository:

- `frontend/config/router/routes.ts`
- `tests/helpers/route-groups.ts`
- `tests/helpers/auth.ts`
- `tests/helpers/page-check.ts`
- `tests/pages/*.spec.ts`
- `playwright.config.ts`
- `vitest.config.ts`
- `vite.config.ts`
- `main.py`
- `backend/app/api/v1/__init__.py`
- `backend/app/api/v1/endpoints/**`
- `backend/app/services/market/baidu_marketing/routes.py`
- `backend/app/teaching_quality/*_api.py`
- `backend/test/**`
- `scripts/db/export_multi_db.py`
- `scripts/db/merge_exports.py`
- `scripts/db/import_for_e2e.py`
- `backend/test/start_full_e2e_backend.py`
- `scripts/e2e/run_full_e2e.sh`

This document should be updated whenever any of the source-of-truth files above changes in a way that affects coverage boundaries, system topology, or test orchestration.
