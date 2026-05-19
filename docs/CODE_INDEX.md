# 代码索引

本索引用于快速定位清美教育管理系统的核心代码目录、运行入口和架构约定。它不是全量文件清单，而是按“先知道去哪里，再深入阅读”的方式组织。

## 0. 配套文档

| 路径 | 说明 |
| ---- | ---- |
| `docs/guides/PROJECT_READING_GUIDE.md` | 新手入门、返岗复习与模块复盘顺序 |
| `docs/guides/REPOSITORY_MIGRATION_MAP.md` | 根目录整理后的迁移清单 |
| `docs/guides/HR_DASHBOARD_BACKEND_TEST_GUIDE.md` | 人事模块全量测试指南，含双 HTTP、pytest、services、Playwright 命令 |
| `docs/README.md` | 文档目录导航 |

## 1. 仓库入口

| 路径 | 说明 |
| ---- | ---- |
| `main.py` | 项目统一 Python 启动入口，按 `--mode` 加载 `.env.*` |
| `frontend/` | React 19 + TypeScript + Vite 7 前端工程 |
| `backend/` | FastAPI + SQLAlchemy 2.0 后端工程 |
| `docs/` | 文档总目录 |
| `scripts/` | 运行、开发、数据库辅助脚本 |
| `tests/` | Playwright E2E 测试 |

## 2. 前端索引

### 2.1 应用入口

| 路径 | 说明 |
| ---- | ---- |
| `frontend/main.tsx` | 前端应用挂载入口 |
| `frontend/App.tsx` | 顶层应用组件 |
| `frontend/config/router/routes.ts` | 路由主配置，新增页面先看这里 |
| `frontend/config/router/routeComponents.ts` | 路由组件映射 |

### 2.2 页面与业务模块

| 路径 | 说明 |
| ---- | ---- |
| `frontend/pages/` | 业务页面主目录，按部门和功能拆分 |
| `frontend/components/` | 复用 UI 组件 |
| `frontend/hooks/` | 复用 Hook |
| `frontend/utils/` | 通用工具函数 |
| `frontend/types/` | 前端类型定义 |

### 2.3 数据访问与状态管理

| 路径 | 说明 |
| ---- | ---- |
| `frontend/services/api.ts` | Axios 基础客户端、拦截器、多校区请求头注入 |
| `frontend/services/` | 各业务域服务封装，项目默认使用直接 Axios 调用 |
| `frontend/stores/authStore.ts` | 登录态与用户信息 |
| `frontend/stores/campusStore.ts` | 当前校区上下文，驱动 `X-Campus` |
| `frontend/stores/appStore.ts` | UI 级全局状态 |

### 2.4 前端关键约定

1. 多校区上下文通过 `X-Campus` 请求头传递，前端注入逻辑在 `frontend/services/api.ts`。
2. 状态管理以 Zustand 为主，不把 React Query 当作主数据流。
3. 新增功能一般遵循“页面 + service + 路由配置”的路径落位。

## 3. 后端索引

### 3.1 API 与应用层

| 路径 | 说明 |
| ---- | ---- |
| `backend/app/api/v1/__init__.py` | API 路由注册入口 |
| `backend/app/api/v1/endpoints/` | 常规业务 API 端点 |
| `backend/app/api/v1/market/` | 市场相关接口子目录 |
| `backend/app/core/` | 配置、认证、依赖注入等基础设施 |
| `backend/app/services/` | 服务层逻辑 |
| `backend/app/tasks/` | 后台任务与调度相关代码 |
| `backend/scripts/` | 后端手工脚本容器，已按 deployment / database / maintenance / debug 拆分 |
| `backend/test/manual/` | 根目录迁入的手工测试与临时验证脚本 |

### 3.2 数据模型与持久层

| 路径 | 说明 |
| ---- | ---- |
| `backend/app/models/` | SQLAlchemy 模型定义 |
| `backend/app/schemas/` | Pydantic Schema |
| `backend/app/crud/` | 数据访问封装 |
| `migrations/` | 迁移与结构变更相关文件 |

### 3.3 教学质量模块

| 路径 | 说明 |
| ---- | ---- |
| `backend/app/teaching_quality/` | 下划线命名的教质模块目录 |
| `backend/app/teaching-quality/` | 历史兼容目录，检查改造时需要注意 |

### 3.4 后端关键约定

1. 多校区隔离通过 `get_campus_from_header` 读取 `X-Campus` 实现。
2. 非 `public` 表默认使用 PostgreSQL 多 schema 设计，常见 schema 为 `academic` 与 `teaching_quality`。
3. 新增接口通常需要同时落位 endpoint、schema、model、crud，并在 `backend/app/api/v1/__init__.py` 注册。

## 4. 脚本索引

| 路径 | 说明 |
| ---- | ---- |
| `scripts/deployment/` | 启动、预览、测试环境启动、重启等脚本 |
| `scripts/development/` | 开发辅助、接口验证、临时测试脚本 |
| `scripts/database/` | 数据库建表、结构辅助脚本 |
| `scripts/db/` | 已存在的数据库 SQL 与初始化脚本 |

### 常用脚本

| 路径 | 说明 |
| ---- | ---- |
| `scripts/deployment/start-backend-env.ps1` | 按 mode 启动后端 |
| `scripts/deployment/start-backend.ps1` | 开发模式快速启动后端 |
| `scripts/deployment/start-production-preview.ps1` | 构建并预览前端生产版本 |
| `scripts/deployment/start-test.sh` | Linux 测试环境一键启动 |
| `scripts/development/generate-routes.cjs` | 路由索引辅助生成 |
| `backend/scripts/deployment/start-server.ps1` | Windows 单机启动 backend 的 PowerShell 入口 |
| `backend/scripts/deployment/start-production.ps1` | Windows 生产启动包装脚本 |
| `backend/scripts/maintenance/fix_null_campus_production.py` | 生产环境 NULL 校区数据修复工具 |

## 5. 测试与产物

| 路径 | 说明 |
| ---- | ---- |
| `backend/test/hr_test_support.py` | 人事模块测试共享支撑：test DB、后端自启动、登录、seed |
| `backend/test/start_human_resources_e2e_backend.py` | Playwright / attached HTTP 的 deterministic backend 启动与 seed |
| `backend/test/run_human_resources_playwright.py` | 一键拉起后端 + Vite + Playwright 的人事模块 runner |
| `backend/test/manual/` | 历史手工 API / DB /功能验证脚本，已从 backend 根目录收敛 |
| `tests/` | Playwright E2E 测试 |
| `frontend/test/` | 前端测试相关目录 |
| `exports/diagnostics/` | 诊断结果、对比输出等导出产物 |
| `temp/` | 临时文件与本地调试产物 |

## 6. 建议阅读顺序

1. 想看整体结构：先看 `README.md` 和 `docs/README.md`。
2. 想加页面或接口：先看 `frontend/config/router/routes.ts`、`frontend/services/`、`backend/app/api/v1/endpoints/`。
3. 想排查多校区问题：先看 `frontend/services/api.ts`、`frontend/stores/campusStore.ts` 和后端读取 header 的依赖。
4. 想部署或启动：先看 `docs/ENV_STARTUP.md`、`docs/DB_SETUP.md` 与 `scripts/deployment/`。
5. 想追溯历史实现：到 `docs/handover/` 和 `docs/troubleshooting/` 查对应主题文档。
