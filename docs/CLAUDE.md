# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QM-System (清美教育管理系统) is a full-stack education management system for managing campuses, teaching quality, student employment, and academic operations across 8 campuses (盛邦, 冀美, 石美, 晋美, 原美, 太美, 桂美, 黔美).

**Tech Stack:**
- Frontend: React 19 + TypeScript + Vite 7 + Ant Design 5
- Backend: FastAPI (Python 3.12+) + PostgreSQL + SQLAlchemy 2.0
- State: Zustand (stores), Direct Axios (no React Query despite dependency)
- Auth: JWT with HttpOnly cookies
- Testing: Vitest (unit), Playwright (E2E)

## Common Commands

### Development

```bash
# Backend (from project root)
python backend/main.py              # Default mode (.env)
python backend/main.py --mode dev   # Development (.env.development)
python backend/main.py --mode test  # Test server (.env.test)

# Frontend
npm run dev              # Development mode (localhost)
npm run dev:test         # Test server proxy mode
npm run dev:prod         # Production mode locally

# API docs: http://localhost:8000/docs
# Frontend: http://localhost:5173
```

### Building & Testing

```bash
# Build
npm run build                    # Production build
npm run build:test               # Test environment build
npm run build:production         # Production environment build

# Testing
npm run test                     # Unit tests (Vitest)
npm run test:ui                  # Unit tests with UI
npm run test:e2e                 # E2E tests (Playwright)
npm run test:e2e:ui              # E2E tests with UI

# Linting & Formatting
npm run lint                     # Check code style
npm run lint:fix                 # Auto-fix linting issues
npm run format                   # Format with Prettier
npm run typecheck                # TypeScript type checking
```

### Database

```bash
# Migrations (from project root)
alembic upgrade head             # Apply all migrations
alembic downgrade -1             # Rollback one migration
alembic revision --autogenerate -m "description"  # Create migration

# Note: Database uses multiple schemas (public, academic, teaching_quality)
# Schema search path: teaching_quality,academic,public
```

## Architecture

### Frontend Structure (`/frontend/`)

**Configuration-Driven Routing** (`/frontend/config/router/`):
- `routes.ts`: Route definitions with metadata (title, auth, type)
- `routeComponents.ts`: Lazy-loaded component mappings
- `routesGenerator.tsx`: Generates React Router config from declarative routes
- Route types: `standalone` (dedicated page), `core-data` (tabbed), `external` (links)

**State Management** (`/frontend/stores/`):
- `authStore.ts`: JWT tokens (HttpOnly cookies), user profile, role, campus, department
- `campusStore.ts`: Current campus selection (persisted), campus list from API or fallback
- `appStore.ts`: UI state (sidebar collapsed, current page, search terms)
- Uses Zustand with `persist` middleware for localStorage

**API Integration** (`/frontend/services/`):
- `api.ts`: Base Axios client with interceptors
  - Auto-injects JWT from HttpOnly Cookie or Authorization header
  - Auto-injects campus context via `X-Campus` header (base64-encoded)
  - Token auto-refresh on 401 with retry
  - Global error handling with Ant Design messages
- 80+ service modules: Domain-specific wrappers (e.g., `auth.ts`, `campusEmployment.ts`)

**Feature Modules** (`/frontend/pages/`):
- Organized by department: `academic/`, `teaching-quality/`, `human-resources/`, `market/`
- Numbered prefixes for ordered features (e.g., `01-core-data/`, `02-stu-employment/`)
- Common patterns: DataTable, DataForm, campus selectors, Excel export

### Backend Structure (`/backend/app/`)

**Layered Architecture:**
```
API (/api/v1/endpoints/) → CRUD (/crud/) → Models (/models/) → PostgreSQL
                        ↘ Services (/services/) ↗
```

**Key Directories:**
- `api/v1/endpoints/`: 80+ endpoint modules (auth, campus_*, teacher_*, student_*, etc.)
- `api/v1/__init__.py`: Router registration hub (495 lines)
- `core/`: Config, database sessions, security (JWT, bcrypt), auth dependencies
- `models/`: 70+ SQLAlchemy models (many use Chinese table names)
- `schemas/`: 80+ Pydantic request/response schemas
- `crud/`: Database operations (static methods pattern)
- `services/`: Business logic (aggregation, synchronization)
- `teaching-quality/`: Massive standalone module (100+ files, TQ*_api.py pattern)

**Database Design:**
- Multi-schema: `public` (users, config), `academic` (70+ tables), `teaching_quality` (50+ tables)
- Chinese table/column names for domain clarity
- Declarative bases: AccountBase (public), TQBase (teaching_quality)
- Connection pooling: pool_size=5, max_overflow=10

**Authentication Flow:**
1. POST `/api/v1/auth/login` → JWT access + refresh tokens in HttpOnly cookies
2. Middleware validates JWT on all requests (except public routes)
3. Token expiry → Frontend auto-calls `/api/v1/auth/refresh` → Retry original request
4. Password hashing: bcrypt with salt, strength validation (6+ chars, letters + numbers)

**Middleware Stack** (main.py):
- CORSMiddleware: Configurable origins, credentials support
- SecurityHeadersMiddleware: XSS protection, CSP, frame options
- SecurityMiddleware: JWT validation on protected routes
- RateLimitMiddleware: Sliding window (100 req/min default)
- AuditLogMiddleware: Request/response logging to database

### Backend Startup And Reload Rules

- Do not call `init_db()` during module import. Import-time initialization runs in both the WatchFiles reloader process and the worker process, which doubles startup cost and makes hot reload logs look like a loop.
- The only supported runtime initialization entry is `ensure_runtime_db_ready()` inside `backend/main.py`'s `lifespan()`.
- `teaching_quality` routers are loaded dynamically in `backend/main.py`. If a module needs startup-time local initialization, define a plain module function named `_startup_init()` without any FastAPI decorator. `backend/main.py` will collect and run these functions centrally during `lifespan()`.
- Do not add `@router.on_event("startup")` in `backend/app/teaching_quality/*_api.py`. That pattern is intentionally retired to keep reload behavior deterministic.
- In dev/test mode, bytecode generation is disabled and `__pycache__` is excluded from reload watching. If reload starts looping again, check for new import-time side effects before changing WatchFiles settings.

### Critical Patterns

**Campus Context Injection:**
- Frontend: `useCampusStore` provides current campus
- API client: Auto-injects `X-Campus` header (base64)
- Backend: Middleware extracts campus for multi-tenant filtering

**Data Flow:**
```
Component → Store (optional) → Service (*.ts) → Axios + Interceptors
  → Backend Endpoint → CRUD → Model → PostgreSQL
```

**Error Handling:**
- Frontend: Axios interceptors → Ant Design messages, auto-retry on 401
- Backend: Global exception handler with debug mode (stacktraces in dev only)

**File Naming:**
- Components: PascalCase (`CampusCoreDataSummary.tsx`)
- Services: camelCase (`campusEmployment.ts`)
- Backend: snake_case (`campus_employment.py`)
- Teaching Quality: TQ prefix (`TQ_campus_api.py`)

### Environment Configuration

**Backend** (.env files):
```bash
# Key variables
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
SECRET_KEY                          # JWT signing
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ALLOWED_ORIGINS                     # CORS whitelist
DEBUG=True/False
DISABLE_API_DOCS=1                  # Production only
```

**Frontend** (Vite env vars):
```bash
VITE_API_BASE_URL                   # Backend endpoint
VITE_ENABLE_CAPTCHA                 # Captcha toggle
VITE_ENABLE_REACT_SCAN              # Dev performance monitoring
```

**API Base URL Resolution** (priority order):
1. `VITE_API_BASE_URL` env var
2. Auto-detection based on hostname
3. Fallback to `/api/v1` (reverse proxy)

### Key Business Features

**Academic Module** (largest):
- Teacher performance: KPI tracking, function analysis, lecture scores
- Student employment: Job placement tracking, salary prediction
- Reputation enrollment: Word-of-mouth tracking
- Training plans & courseware management

**Teaching Quality Module** (100+ files):
- Quality metrics aggregation across campuses
- Student satisfaction surveys
- Multi-level dashboards (campus, group HQ)

**Management Center:**
- Cross-campus data aggregation
- 3-tier HR hierarchy dashboards
- Core business data summaries

**System Features:**
- Role-based access: Admin, Manager, Teacher, Staff, Viewer
- Audit logging for compliance
- Excel export (XLSX)
- Real-time data sync

## Development Conventions

### When Adding Features

1. **Frontend Route**: Add to `frontend/config/router/routes.ts` with metadata
2. **Component**: Create in appropriate `frontend/pages/[department]/` subdirectory
3. **Service**: Add API wrapper in `frontend/services/[domain].ts`
4. **Backend Endpoint**: Create in `backend/app/api/v1/endpoints/[resource].py`
5. **Register Route**: Import and include router in `backend/app/api/v1/__init__.py`
6. **CRUD**: Add operations in `backend/app/crud/[resource].py`
7. **Model**: Define in `backend/app/models/[resource].py` (use Chinese names for domain tables)
8. **Schema**: Add Pydantic schemas in `backend/app/schemas/[resource].py`
9. **Migration**: Run `alembic revision --autogenerate -m "Add [resource] table"`

### When Modifying API

- Always update both request and response Pydantic schemas
- Maintain type safety between frontend TypeScript and backend Pydantic
- Campus context injection is automatic via middleware
- Auth is automatic via dependencies (`Depends(get_current_active_user)`)

### When Working with Database

- Use SQLAlchemy 2.0 syntax (no legacy Session patterns)
- Chinese table/column names are intentional for business clarity
- Always specify `__table_args__ = {"schema": "..."}` for non-public schemas
- Connection is pooled; avoid manual session management
- Use CRUD classes for all database operations

### Common Gotchas

- React Query is in dependencies but NOT used; use direct Axios calls
- Frontend "services" are not React hooks; they're plain async functions
- Teaching Quality module has its own API structure (TQ prefix)
- Campus context must be set before calling most APIs
- Token refresh is automatic; don't manually handle 401s in components
- Database schema search path affects table resolution order

### Security Considerations

- Never log JWT tokens or passwords
- HttpOnly cookies prevent XSS token theft
- Rate limiting is enabled by default
- Audit logging captures all API requests
- CORS origins are whitelist-only
- CSP headers block inline scripts in production
- Password validation requires 6+ chars with letters + numbers

## Deployment

### Production Deployment

```bash
# Frontend build
npm run build:production          # Outputs to dist/

# Backend startup
python backend/main.py --mode production

# Typical setup: Nginx reverse proxy
# / → Frontend static files (dist/)
# /api/v1 → Backend (FastAPI on :8000)
```

### Docker

```bash
docker-compose up -d --build      # Frontend container configured
# Backend/database services need configuration in docker-compose.yml
```

## Testing Conventions

- Unit tests use Vitest with jsdom
- E2E tests use Playwright
- Test data seeding scripts in `backend/test/`
- Integration tests set `VITE_API_BASE_URL=http://localhost:8000/api/v1`
- Run backend tests directly or use pytest (if configured)

## Important Files to Review

- `frontend/config/router/routes.ts`: All route definitions
- `frontend/services/api.ts`: Base API client with interceptors
- `frontend/stores/authStore.ts`: Authentication state machine
- `backend/app/api/v1/__init__.py`: API router registration
- `backend/app/core/security.py`: JWT token logic
- `backend/app/core/database.py`: Database session management
- `backend/main.py`: Application entry point, middleware stack
- `vite.config.ts`: Frontend build configuration
- `alembic/env.py`: Migration configuration
