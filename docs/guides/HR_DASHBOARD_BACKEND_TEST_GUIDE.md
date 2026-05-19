# 人事模块全量测试指南

这份文档给 Copilot 和人工排障都适用。目标不是“猜怎么启动”，而是按固定命令，把 `human_resources` 模块的后端、前端 services、真实前后端 E2E 都跑通。

## 1. 先决条件

- 当前仓库根目录是 `/home/user/Workspace/qm-system`
- Python 虚拟环境已存在：`.venv`
- Node 依赖已安装
- PostgreSQL 本地可用，`.env.test` 里的连接参数可连通
- 默认不要手工先启动后端或前端，除非你在跑“附着式旧 HTTP 套件”

## 2. 推荐执行顺序

### 2.1 后端自启动 cold-start 套件

```bash
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q backend/test/test_human_resources_dashboard_integration.py -s
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q backend/test/test_human_resources_employee_archive_integration.py
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q backend/test/test_human_resources_dashboard_rules.py -s
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q backend/test/test_human_resources_endpoint_http_smoke.py -s
```

用途：

- 第 1 条：冷启动 test DB、后端自启动、登录、dashboard/employee archive 真实 API 联调
- 第 2 条：employee archive 直连 CRUD、派生字段、权限边界
- 第 3 条：`scope resolver`、聚合幂等、社保金额口径、OFFLINE 多薪酬事实
- 第 4 条：人事模块主要接口簇的广域 HTTP smoke

实测结果：

- `test_human_resources_dashboard_integration.py`：`4 passed`
- `test_human_resources_employee_archive_integration.py`：`4 passed`
- `test_human_resources_dashboard_rules.py`：`4 passed`
- `test_human_resources_endpoint_http_smoke.py`：`4 passed`

### 2.2 旧附着式 HTTP 套件

先手工启动一个 attached backend：

```bash
PYTHONDONTWRITEBYTECODE=1 APP_ENV=test DB_NAME=qmjy_test_hr_attached .venv/bin/python backend/test/start_human_resources_e2e_backend.py --port 48082 --db qmjy_test_hr_attached
```

再跑旧 HTTP 套件：

```bash
PYTHONDONTWRITEBYTECODE=1 APP_ENV=test DB_NAME=qmjy_test_hr_attached TEST_BASE_URL=http://127.0.0.1:48082 .venv/bin/python -m pytest -q backend/test/test_human_resources_dashboard_http_attached.py -s
```

用途：

- 保留“先起服务，再附着跑 HTTP 回归”的旧测试语义
- 验证 attached 环境下的 dashboard 读取和写回

实测结果：

- `test_human_resources_dashboard_http_attached.py`：`3 passed`

### 2.3 前端 services 契约测试

```bash
PYTHONDONTWRITEBYTECODE=1 npm test -- --run frontend/test/humanresources-services.test.ts
```

用途：

- 验证 `frontend/services/humanresources/*.ts` 的 URL、method、query/body 结构
- 覆盖 dashboard 三个聚合接口、employee archive、legacy manual、salary/performance facts、招聘/培训/社保/调岗/晋升/离职/交接等 service 入口

实测结果：

- `frontend/test/humanresources-services.test.ts`：`7 passed`

### 2.4 Playwright 真实前后端 E2E

先跑看板页面真实加载烟测：

```bash
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python backend/test/run_human_resources_playwright.py tests/human-resources.spec.ts --project=chromium --grep "loads HQ dashboard pages with real backend data|loads offline dashboard pages with real backend data"
```

再跑写回与基础页场景：

```bash
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python backend/test/run_human_resources_playwright.py tests/human-resources.spec.ts --project=chromium --grep "persists employee archive edits after refresh"
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python backend/test/run_human_resources_playwright.py tests/human-resources.spec.ts --project=chromium --grep "persists daily dashboard manual recruitment edits after refresh|loads base-006 human resources pages with live tabs"
```

用途：

- 真实启动 test backend + Vite
- 真实登录
- 验证 HQ/OFFLINE 看板页加载
- 验证员工档案写回并刷新回显
- 验证 HQ 日看板招聘手填写回并刷新回显
- 验证 `006` 培训管理、招聘入职、社保基础页真实加载

已确认通过的场景：

- `loads HQ dashboard pages with real backend data`
- `loads offline dashboard pages with real backend data`
- `persists employee archive edits after refresh`
- `persists daily dashboard manual recruitment edits after refresh`
- `loads base-006 human resources pages with live tabs`

说明：

- 这 5 个场景为节省时间，是按 route smoke、员工档案写回、日看板写回与 006 基础页分批重跑确认的
- Playwright 产物默认在 `playwright-report/` 和 `test-results/`

## 3. 不要这样跑

- 不要直接执行 `pytest` 或 `.venv/bin/pytest` 不带文件名跑全仓库
- 不要把 `PLAYWRIGHT_PORT` 改成非 `5173` 的随机端口后又忘了同步 CORS
- 不要把人事写接口恢复成 Axios 默认 `10s` 超时
- 不要在自启动套件前手工先起一个后端，除非你明确在跑 attached 套件
- 不要让本地请求走系统代理

## 4. 常见失败与排查

### 4.1 数据库连接失败

检查：

- PostgreSQL 是否启动
- `.env.test` 中的 `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME`

快速检查：

```bash
sed -n '1,80p' .env.test
```

### 4.2 cold-start 卡在 `/health`

这是测试后端没有成功启动。优先看：

- 数据库建表失败
- 历史 migration 异常
- 端口占用
- Python 导入异常

如果是自启动 pytest 套件，日志一般会在 stdout 直接打印；如果是 Playwright runner，失败时也会在 runner 输出里带上后端启动日志。

### 4.3 浏览器写请求被中断

人事模块的这些写接口会同步触发：

- `employee archive snapshot`
- `dashboard daily`
- `dashboard monthly`
- `dashboard annual`

所以浏览器端必须给长超时。当前已统一走：

- `frontend/services/api.ts`
  - `HR_HEAVY_WRITE_TIMEOUT_MS = 120_000`

如果你又看到了：

- `AxiosError`
- `net::ERR_ABORTED`
- 或 PUT/POST 在 10 秒左右中断

先检查是不是把长超时删掉了。

### 4.4 Playwright 卡在本地跨域

默认 E2E 端口口径是：

- 前端：`http://127.0.0.1:5173`
- 后端：`http://127.0.0.1:49081`

当前后端默认已放行 `http://127.0.0.1:5173`。如果你把前端改跑到 `5175` 之类，又没改 CORS，就会出现跨域阻断。

### 4.5 本地代理劫持 `127.0.0.1`

所有测试支持层都已经清掉：

- `HTTP_PROXY`
- `HTTPS_PROXY`
- `ALL_PROXY`

如果你自己写脚本调试，也必须禁用代理，否则会出现请求被打到 `127.0.0.1:7890` 之类端口的假故障。

### 4.6 E2E 里找不到日看板编辑按钮

`HQ 004` 招聘及入职页默认展示的是汇总层，不是部门可编辑层。正确层级是：

1. 先展开月汇总
2. 再展开某一天
3. 再进入部门子行点击编辑

不要假设默认首行就有编辑按钮。

## 5. 现在仓库里的测试支撑文件

- `backend/test/hr_test_support.py`
  - 自启动测试的共用夹具、DB 重建、登录辅助
- `backend/test/start_human_resources_e2e_backend.py`
  - Playwright / attached HTTP 的 deterministic backend seed 入口
- `backend/test/run_human_resources_playwright.py`
  - 一键拉起后端 + Vite + Playwright
- `backend/test/test_human_resources_dashboard_http_attached.py`
  - 旧附着式 HTTP 套件
- `backend/test/test_human_resources_dashboard_integration.py`
  - 自启动 cold-start API 集成
- `backend/test/test_human_resources_dashboard_rules.py`
  - 规则与幂等专项
- `backend/test/test_human_resources_endpoint_http_smoke.py`
  - 人事接口广域 smoke
- `frontend/test/humanresources-services.test.ts`
  - 前端 services 契约
- `tests/human-resources.spec.ts`
  - 真实前后端 E2E

## 6. 当前已知非阻塞 warning

- 外部 `font-awesome` CDN 在 headless 环境里偶发 `ERR_TIMED_OUT`
- antd v5 / React 19 兼容 warning
- 这些 warning 不影响当前人事模块接口、页面和断言结果

## 7. Copilot 最低执行清单

如果只让 Copilot 做一次“按命令跑，不做额外猜测”的完整回归，直接让它执行：

```bash
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q backend/test/test_human_resources_dashboard_integration.py -s
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q backend/test/test_human_resources_employee_archive_integration.py
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q backend/test/test_human_resources_dashboard_rules.py -s
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q backend/test/test_human_resources_endpoint_http_smoke.py -s
PYTHONDONTWRITEBYTECODE=1 APP_ENV=test DB_NAME=qmjy_test_hr_attached .venv/bin/python backend/test/start_human_resources_e2e_backend.py --port 48082 --db qmjy_test_hr_attached
PYTHONDONTWRITEBYTECODE=1 APP_ENV=test DB_NAME=qmjy_test_hr_attached TEST_BASE_URL=http://127.0.0.1:48082 .venv/bin/python -m pytest -q backend/test/test_human_resources_dashboard_http_attached.py -s
PYTHONDONTWRITEBYTECODE=1 npm test -- --run frontend/test/humanresources-services.test.ts
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python backend/test/run_human_resources_playwright.py tests/human-resources.spec.ts --project=chromium --grep "loads HQ dashboard pages with real backend data|loads offline dashboard pages with real backend data"
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python backend/test/run_human_resources_playwright.py tests/human-resources.spec.ts --project=chromium --grep "persists employee archive edits after refresh"
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python backend/test/run_human_resources_playwright.py tests/human-resources.spec.ts --project=chromium --grep "persists daily dashboard manual recruitment edits after refresh|loads base-006 human resources pages with live tabs"
```

执行要求：

- 严格按顺序
- 不额外切端口
- 不手动起多余服务
- 不省略 `PYTHONDONTWRITEBYTECODE=1`
- attached backend 启动后，不要关掉，直到 attached HTTP 套件跑完
