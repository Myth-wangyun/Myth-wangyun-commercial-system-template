# 咨询量保护期机制说明（生产环境）

## 是否会执行？
会执行，前提是通过 production.py 启动了 FastAPI 应用，并且应用生命周期中的调度器已启动。
系统在 [backend/main.py](backend/main.py#L146) 的生命周期里调用调度器初始化，调度器里注册了“保护期状态自动更新”任务。

## 任务来源与职责
- 调度器入口：`app.core.scheduler.init_scheduler()`
- 具体任务：`_run_protection_period_update()`
- 业务逻辑：`app.services.consult.protection_period.保护期服务.批量更新保护期状态()`
- 计划：每天凌晨 2:00 运行一次（Asia/Shanghai）
- 手动脚本：`app.tasks.protection_period_task` 仅用于人工执行，不会自动触发

## 多进程重复执行的风险
当使用多进程（如 Hypercorn/Uvicorn/Gunicorn 的 workers > 1）启动时，
**每个进程都会启动调度器**，导致同一个定时任务被并发执行多次。

## 避免重复执行的推荐方案
### 方案 A：生产单进程（最简单）
将 workers 设为 1，只启动一个进程，调度器自然不会重复。

### 方案 B：将定时任务独立为单独服务（推荐）
把保护期任务单独做成一个 systemd 服务/cron，Web 服务保持多进程。
- Web 服务：正常多进程处理请求
- 任务服务：单进程只负责定时任务

### 方案 C：加“只在主进程启动调度器”的开关
通过环境变量控制调度器启动，比如：
- 仅在 `SCHEDULER_ENABLED=1` 的进程中调用 `init_scheduler()`
- 其他 worker 不启动调度器

### 方案 D：使用分布式锁/任务队列
使用数据库锁、Redis 锁或 APScheduler 的持久化 JobStore + 单实例锁，确保同一时间只有一个实例执行。

## 当前建议
若你用 production.py 启动并要求保护期任务可靠执行，
**请优先采用方案 A（单进程）或方案 B（独立任务服务）**。
