# Copilot Instructions for QM-System

## Project Overview
清美教育管理系统 (QM-System) is a full-stack education management system for managing 8 campuses: 盛邦, 冀美, 石美, 晋美, 原美, 太美, 桂美, 黔美.

**Stack**: React 19 + TypeScript + Vite 7 + Ant Design 5 (frontend) | FastAPI + PostgreSQL + SQLAlchemy 2.0 (backend)

## Critical Architecture Patterns

### Multi-Tenant Campus Context
Campus isolation is enforced via `X-Campus` header (base64-encoded). Frontend auto-injects this from `useCampusStore` in [frontend/services/api.ts](frontend/services/api.ts#L91). Backend reads via `Depends(get_campus_from_header)` - see [backend/app/api/v1/endpoints/campus_employment.py](backend/app/api/v1/endpoints/campus_employment.py#L73).

### Database Multi-Schema Design
Three schemas: `public` (users/config), `academic` (70+ tables), `teaching_quality` (50+ tables). Always specify `__table_args__ = {"schema": "academic"}` for non-public models. Chinese table/column names are intentional for domain clarity.

### State Management (NOT React Query)
Despite `@tanstack/react-query` in dependencies, use **direct Axios calls** via services. State flows through Zustand stores:
- `authStore.ts`: Auth state (JWT in HttpOnly cookies)
- `campusStore.ts`: Current campus selection (persisted)
- `appStore.ts`: UI state

## Developer Commands

```bash
# Backend (from root)
python backend/main.py --mode dev   # Dev mode, .env.development
python backend/main.py --mode test  # Test server (116.255.152.27)

# Frontend
npm run dev                         # Dev (localhost:5173)
npm run dev:test                    # Proxy to test server

# Testing
npm run test                        # Vitest unit tests
npm run test:e2e                    # Playwright E2E
```

## Adding New Features - Checklist

1. **Route**: Add to [frontend/config/router/routes.ts](frontend/config/router/routes.ts) with `type: 'standalone' | 'core-data'`
2. **Component**: Create in `frontend/pages/[department]/` (numbered prefixes for ordering)
3. **Service**: Add wrapper in `frontend/services/[domain].ts` (plain async, NOT hooks)
4. **Endpoint**: Create in `backend/app/api/v1/endpoints/[resource].py`
5. **Register**: Import router in [backend/app/api/v1/__init__.py](backend/app/api/v1/__init__.py)
6. **CRUD/Model/Schema**: Add in respective `backend/app/` subdirectories

## File Naming Conventions

| Layer | Pattern | Example |
|-------|---------|---------|
| Components | PascalCase | `CampusCoreDataSummary.tsx` |
| Services | camelCase | `campusEmployment.ts` |
| Backend | snake_case | `campus_employment.py` |
| Teaching Quality | TQ prefix | `TQ_campus_api.py` |

## Common Gotchas

- **Auth is automatic**: Use `Depends(get_current_active_user)` in endpoints; frontend handles 401 refresh
- **Campus header skipping**: Some endpoints like `/class-employment-summary` use query params instead of header - see [api.ts#L88](frontend/services/api.ts#L88)
- **Teaching Quality module**: Separate API structure in `backend/app/teaching-quality/` with `TQ*_api.py` pattern
- **PowerShell encoding**: Use UTF-8 for Chinese output: `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8`

## Key Files for Context

- [frontend/config/router/routes.ts](frontend/config/router/routes.ts) - All route definitions
- [frontend/services/api.ts](frontend/services/api.ts) - Base API client + interceptors
- [backend/app/api/v1/__init__.py](backend/app/api/v1/__init__.py) - Router registration hub
- [backend/main.py](backend/main.py) - Entry point, middleware stack
- [docs/CLAUDE.md](docs/CLAUDE.md) - Extended architecture documentation
