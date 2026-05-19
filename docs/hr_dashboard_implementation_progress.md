# 人事模块看板实施进度

更新时间：2026-03-09

## 已完成

### 1. 后端统一基础能力
- 新增 `scope` 归属解析：
  - `backend/app/crud/human_resources/dashboard_scope.py`
  - 统一支持 `hq`、`offline`、`online`
  - 提供总部部门、线下校区、别名归一化和归属判断
- 新增看板/事实层模型：
  - `DashboardManualRecruitmentDaily`
  - `SalaryWelfareFact`
  - `PerformanceFact`
  - `EmployeeArchiveSnapshot`
  - `DashboardDailyAggregate`
  - `DashboardMonthlyAggregate`
  - `DashboardYearlyAggregate`
- 新增对应 schema、CRUD、API 路由：
  - `/api/v1/human-resources/dashboard/employee-archive`
  - `/api/v1/human-resources/dashboard/employee-archive/options`
  - `/api/v1/human-resources/dashboard/daily`
  - `/api/v1/human-resources/dashboard/monthly`
  - `/api/v1/human-resources/dashboard/annual`
  - `/api/v1/human-resources/dashboard/manual/recruitment-daily`
  - `/api/v1/human-resources/salary-welfare-facts`
  - `/api/v1/human-resources/performance-facts`
- 已新增数据库迁移脚本：
  - `backend/migrations/add_hr_dashboard_tables.py`

### 2. 员工档案
- 员工档案 CRUD 已扩成 `scope` 版。
- `HQ 005 员工档案表` 已切到真实接口。
- `OFFLINE 005 员工档案表` 已直接复用同一套真实接口。

### 3. HQ 看板
- `HQ 004 日度核心数据看板`
  - 已迁移到统一 `/dashboard/daily` 读接口。
  - 招聘及入职、培训已对接真实基础表。
  - 招聘手填列已落到后端表。
  - 当前页面已直接消费统一日聚合结果，不再在页面内拼跨表计算。
- `HQ 003 月度核心数据看板`
  - 已切到统一月度接口。
- `HQ 002 年度核心数据看板`
  - 已切到统一年度接口。

### 4. OFFLINE 看板
- `OFFLINE 004 日度核心数据看板`
  - 已切到统一 `/dashboard/daily` 读接口。
  - 招聘、培训、薪酬福利、社保四个 TAB 已接到真实数据。
  - 薪酬及福利支持单行事实维护；同日同校区存在多条事实记录时只展示聚合结果，不允许看板内覆盖编辑。
- `OFFLINE 005 员工档案表`
  - 已切到真实员工档案接口。
- `OFFLINE 003 月度核心数据看板`
  - 已切到统一月度接口。
- `OFFLINE 002 年度核心数据看板`
  - 已切到统一年度接口。

### 5. ONLINE 看板
- `ONLINE 002 年度核心数据看板`
  - 已切到统一年度接口。
  - 当前前端已按线上事业部原型改为单页连续多表展示，不再沿用 HQ Tabs 年度页布局。
  - 前端已增加第一版线上组织显示映射：`线上咨询师 -> 线上咨询部`、`线上主任 -> 线上班主任`、`组员 -> 组品`。
- `ONLINE 003 月度核心数据看板`
  - 已切到统一月度接口。
  - 继续复用 HQ 月度页 Tabs 壳子，但共享组件已改为按 `scope` 切换组织维度、列标题与默认占位行结构。
  - `scope=online` 时前端不再回落为 HQ 部门维度，而是使用线上事业部组织列表进行展示。
- `ONLINE 004 日度核心数据看板`
  - 已切到统一日度接口。
  - 先复用 HQ 日度页壳子，并支持线上组织归一化展示。
- `ONLINE 005 员工档案表`
  - 已切到真实员工档案接口。
  - 员工档案 scope 过滤已支持 online。

### 6. 统一刷新链（已覆盖统一入口与现有业务源表）
- 以下统一写接口已经会在写入后同步刷新当期快照与日/月/年聚合：
  - 员工档案更新
  - 招聘手填日事实
  - 薪酬福利事实
  - 绩效事实
- 以下基础业务表保存点也已挂上同步刷新链：
  - 招聘需求
  - 面试登记
  - 转正
  - 调岗
  - 晋升申请（作为职级变更事件入口）
  - 离职
  - 停薪留职
  - 培训申请
  - 培训成绩
  - 培训满意度
  - 社保审批

### 7. 前端 services
- 已新增：
  - `frontend/services/humanresources/dashboardDaily.ts`
  - `frontend/services/humanresources/dashboardMonthly.ts`
  - `frontend/services/humanresources/dashboardAnnual.ts`
  - `frontend/services/humanresources/salaryWelfareFacts.ts`
  - `frontend/services/humanresources/performanceFacts.ts`
- 上述 services 与 `frontend/services/humanresources/employeeArchive.ts` 已扩展为 `hq / offline / online` 三 scope 版。

### 8. 基础校验
- 新增后端文件已通过 `py_compile` 语法校验。
- 前端 `npm run -s build` 已通过。
- 当前前端仍存在项目原有 `QTapi` chunk 循环 warning，与本次人事模块改动无关。

### 9. 2026-03-08 冷启动联调与自动化测试
- 已用 `.venv` + `main.py --mode test` 完成 fresh test DB 冷启动验证。
- 已确认 `qmjy_test` 在全新库场景下可以自动建库、初始化、启动并通过 `/health` 检查。
- 已修复 fresh DB 冷启动的两个真实阻塞：
  - `backend/app/core/database.py`
    - 建表顺序调整为 `config -> humanresources -> remaining`，避免 `config.campuses` 缺失导致的人资表批量回滚。
  - PostgreSQL 63 字符索引名限制：
    - `backend/app/models/human_resources/appointment_interview_record.py`
    - `backend/app/models/human_resources/social_insurance_application.py`
- 已修复统一年度看板接口真实运行错误：
  - `backend/app/crud/human_resources/dashboard.py`
  - 补齐 `performance_rows` 初始化，解决 `/dashboard/annual` 的 `NameError`。
- 已新增并跑通统一看板集成测试：
  - `backend/test/test_human_resources_dashboard_integration.py`
  - 已改为“自启动后端 + 自建/自清理 test DB”的自包含测试，不再要求手工先起服务。
  - 覆盖：冷启动建表、登录、employee archive API 读写/权限、dashboard 读接口、招聘/薪酬/绩效写后回刷。
- 已跑通员工档案专项集成测试：
  - `backend/test/test_human_resources_employee_archive_integration.py`
  - 覆盖：HQ 员工档案列表、候选项、HR 编辑、自编辑、越权控制、`users` 同步、社保/转正/停薪留职/离职派生字段。

### 10. 2026-03-09 二次联调、性能与幂等修复
- 已修复 fresh DB 下 employee archive 首次创建会触发 `config.campuses` 外键错误的问题：
  - `backend/app/core/database.py`
  - 冷启动创建 `config` 表后会自动补齐 HQ/线下默认校区主数据，保证 `humanresources.employees.campus_name` 可落库。
- 已修复统一刷新链的快照幂等问题：
  - `backend/app/crud/human_resources/dashboard.py`
  - `refresh_employee_archive_snapshot()` 从“批量删后重插”改为按 `scope + snapshot_date + user_id` 幂等更新，解决唯一键冲突。
- 已降低同步刷新链的重复重算：
  - `backend/app/crud/human_resources/dashboard.py`
  - `refresh_scope_dashboard_chain()` 生成年度聚合时复用已生成的月度结果，不再在同一请求里重复重算整年月份。
- 已修复测试在本地代理环境下被 `127.0.0.1:7890` 劫持导致的假超时：
  - `backend/test/test_human_resources_dashboard_integration.py`
  - 集成测试客户端默认 `trust_env = False`，本地回环请求不再走系统代理。
- 已完成当前轮完整后端测试：
  - `PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q backend/test/test_human_resources_dashboard_integration.py -s`
    - 结果：`4 passed`，耗时约 `4m22s`
  - `PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q backend/test/test_human_resources_employee_archive_integration.py`
    - 结果：`4 passed`，耗时约 `15.61s`
- 已新增可交给 Copilot 直接执行的测试指南：
  - `docs/guides/HR_DASHBOARD_BACKEND_TEST_GUIDE.md`

### 11. 2026-03-09 全量测试矩阵与缺陷收敛
- 已补齐共享测试支持层：
  - `backend/test/hr_test_support.py`
  - 统一处理 test DB 重建、后端自启动/停止、测试用户、登录、禁用系统代理。
- 已保留并恢复“附着到已启动服务”的旧 HTTP 套件：
  - `backend/test/test_human_resources_dashboard_http_attached.py`
  - 语义保持为：手工预启动后端，默认连 `http://127.0.0.1:8000`，也支持 `TEST_BASE_URL` 覆盖。
- 已新增人事后端专项测试：
  - `backend/test/test_human_resources_dashboard_rules.py`
  - 覆盖 `scope resolver`、社保金额口径、聚合幂等、OFFLINE 多薪酬事实聚合。
- 已新增人事接口广域 HTTP smoke：
  - `backend/test/test_human_resources_endpoint_http_smoke.py`
  - 覆盖 dashboard / employee archive / recruitment / training / social insurance / transfer / unpaid leave / promotion / appointment interview / work handover / approval workflow / legacy manual 接口簇。
- 已新增前端 services 契约测试：
  - `frontend/test/humanresources-services.test.ts`
  - 覆盖 dashboard 三个聚合接口、employee archive、legacy manual、salary/performance facts、招聘/培训/社保/调岗/晋升/离职/交接等 services 的 URL、method、payload 结构。
- 已新增真实前后端联动 Playwright 支撑：
  - `backend/test/start_human_resources_e2e_backend.py`
  - `backend/test/run_human_resources_playwright.py`
  - `tests/human-resources.spec.ts`
  - 已覆盖 HQ/OFFLINE 看板页真实加载、HQ 员工档案写回并刷新回显、HQ 日看板招聘手填写回并刷新回显、`006` 培训/招聘/社保基础页真实加载。
- 本轮修复的真实问题：
  - `backend/app/core/config.py`
    - CORS 默认放行补齐 `http://127.0.0.1:5173`，修复 Vite 本地 E2E 的跨域阻断。
  - `backend/app/crud/human_resources/dashboard.py`
    - `create_performance_fact()` 改为按自然键幂等 upsert，修复重复 POST 的唯一键冲突。
    - `list_salary_welfare_facts()` 排序稳定化，避免 OFFLINE 多事实场景结果漂移。
    - 聚合 `recalculated_at` 改为 `datetime.now(UTC)`，收敛时区/弃用告警。
  - `frontend/services/api.ts`
    - 新增 `HR_HEAVY_WRITE_TIMEOUT_MS = 120_000`。
  - `frontend/services/humanresources/employeeArchive.ts`
  - `frontend/services/humanresources/dashboardDaily.ts`
  - `frontend/services/humanresources/managementCenterDailyRecruitmentManual.ts`
  - `frontend/services/humanresources/salaryWelfareFacts.ts`
  - `frontend/services/humanresources/performanceFacts.ts`
    - 人事重写接口统一切到长超时，解决浏览器真实写入时被 Axios 默认 10 秒超时中断的问题。
  - `tests/human-resources.spec.ts`
    - 员工档案写回场景改为断言“对话框关闭 + 刷新后回显”，不依赖瞬时 toast。
    - 日看板写回场景改为按“月汇总 -> 日汇总 -> 部门子行”两层展开后再定位编辑按钮，修复对默认汇总行的错误假设。
    - 模态框关闭动作改为使用右上角关闭按钮，避免 Ant Design footer 按钮在 E2E 中偶发不可定位。
- 2026-03-09 已实跑通过的命令与结果：
  - `PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q backend/test/test_human_resources_dashboard_integration.py -s`
    - `4 passed`
  - `PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q backend/test/test_human_resources_employee_archive_integration.py`
    - `4 passed`
  - `PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q backend/test/test_human_resources_dashboard_rules.py -s`
    - `4 passed`
  - `PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q backend/test/test_human_resources_endpoint_http_smoke.py -s`
    - `4 passed`
  - `PYTHONDONTWRITEBYTECODE=1 APP_ENV=test DB_NAME=qmjy_test_hr_attached .venv/bin/python backend/test/start_human_resources_e2e_backend.py --port 48082 --db qmjy_test_hr_attached`
    - 预启动旧式 attached backend 成功
  - `PYTHONDONTWRITEBYTECODE=1 APP_ENV=test DB_NAME=qmjy_test_hr_attached TEST_BASE_URL=http://127.0.0.1:48082 .venv/bin/python -m pytest -q backend/test/test_human_resources_dashboard_http_attached.py -s`
    - `3 passed`
  - `PYTHONDONTWRITEBYTECODE=1 npm test -- --run frontend/test/humanresources-services.test.ts`
    - `7 passed`
  - Playwright 场景级通过：
    - `loads HQ dashboard pages with real backend data`
    - `loads offline dashboard pages with real backend data`
    - `persists employee archive edits after refresh`
    - `persists daily dashboard manual recruitment edits after refresh`
    - `loads base-006 human resources pages with live tabs`
    - 说明：为节省时间，5 个场景是按 route smoke、员工档案写回、日看板写回与 006 基础页分批重跑确认的。

## 当前状态

### 1. 功能接入
- HQ / OFFLINE / ONLINE 的 `002 / 003 / 004 / 005` 已接入统一接口。
- 其中 ONLINE 当前为第一版：页面壳子与 scope 链路已打通，优先覆盖年度/月度/日度/员工档案真实加载。
- `006` 基础页已纳入真实 E2E 加载验证。

### 2. 测试状态
- 双 HTTP 套件、直连 CRUD、规则/幂等专项、前端 services 契约、真实前后端 Playwright 场景均已落地并实跑。
- 当前没有新的阻塞性缺陷。

### 3. 剩余非阻塞项
- 测试仍较慢：
  - Playwright 单 worker + fresh DB 场景耗时较长，属当前设计预期。
- 仍有非阻塞 warning：
  - 外部 `font-awesome` CDN 在 headless 环境里偶发 `ERR_TIMED_OUT`
  - antd v5 / React 19 兼容 warning
  - 这些不影响人事模块接口和页面断言结果

## 现阶段口径说明
- `离职人数` 包含停薪留职。
- 干部/基层人数从员工档案快照统计。
- 社保费用类指标只从社保模块或社保聚合来源取值。
- HQ 招聘、培训继续沿用已落地的真实业务口径，并向统一聚合层迁移。

## 推荐后续工作
1. 继续压缩 Playwright 冷启动耗时，优先减少重复 fresh DB 重建。
2. 评估将外部 `font-awesome` CDN 改为本地依赖，消除 headless 环境偶发超时噪音。
3. 视团队计划再决定是否补更细的口径数据夹具，不影响当前人事模块功能与测试闭环。
