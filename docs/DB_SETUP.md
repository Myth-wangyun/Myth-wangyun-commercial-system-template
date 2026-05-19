# 数据库创建/权限/初始化流程（无需 alembic 迁移）

## 目标

- 首次部署时，不跑 alembic 迁移也能达到“最新可运行结构”。
- 由后端启动逻辑负责 `CREATE SCHEMA/TABLE/INDEX/VIEW IF NOT EXISTS`；
- 由 SQL 脚本负责“数据库/用户/权限”。

## 1) 创建数据库用户与数据库

执行脚本：`scripts/db/bootstrap.sql`

- 会创建：
  - `qm_app`（应用读写用户）
  - `qm_readonly`（只读用户）
  - `qmjy` 数据库（默认）
  - `teaching_quality` schema（教质模块）

你需要做的修改：
- 把脚本中的 `CHANGE_ME` 密码替换成真实强密码

## 2) 配置 `.env.production`

生产环境建议：
- `DB_USER=qm_app`
- `DB_PASSWORD=<你的强密码>`
- `APP_ENV=production`
- `REQUIRE_AUTH=true`

## 3) 初始化到最新结构

启动后端即可：

```powershell
.\scripts\deployment\start-backend-env.ps1 -Mode prod -BindHost 0.0.0.0 -Port 8000
```

项目当前的结构策略是：启动时会自动创建大量教质相关表/索引/视图（`IF NOT EXISTS` 形式）。

## 4) 关于数据清理（来自 .claude-summary.md）

有一类是“历史脏数据修复”，不属于 schema 迁移，通常不建议自动在生产启动时执行。
例如：教质经理/副经理功能分析表数据需要清理时，请按需执行 `backend/clean_manager_data_simple.sql`。
