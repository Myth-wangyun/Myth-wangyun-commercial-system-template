# 环境变量与启动方式（Windows/本地开发）

## 1) 后端如何加载 `.env.*`

后端入口是 `backend/main.py`，支持参数 `--mode`，会在项目根目录按模式加载对应文件：

- `--mode dev` / `--mode development` → `qm-system/.env.development`
- `--mode test` → `qm-system/.env.test`
- `--mode prod` / `--mode production` → `qm-system/.env.production`

加载逻辑在 `backend/main.py -> setup_environment()`，会把 env 文件里的 `KEY=VALUE` 写进进程环境变量。

## 2) 一键启动脚本（推荐）

使用部署脚本：`scripts/deployment/start-backend-env.ps1`

```powershell
# 开发（免登录）
.\scripts\deployment\start-backend-env.ps1 -Mode dev -BindHost 127.0.0.1 -Port 8000

# 测试（免登录，默认 8001）
.\scripts\deployment\start-backend-env.ps1 -Mode test -BindHost 127.0.0.1 -Port 8001

# 生产（强制认证）
.\scripts\deployment\start-backend-env.ps1 -Mode prod -BindHost 0.0.0.0 -Port 8000
```

## 3) 认证策略（开发免登录 / 生产强制认证）

- 开发/测试：`.env.development` / `.env.test` 已设置 `REQUIRE_AUTH=false` 且 `DEV_NO_AUTH=true`
- 生产：`.env.production` 必须 `REQUIRE_AUTH=true`

覆盖方式：
- 在任意环境强制开启认证：设置 `REQUIRE_AUTH=true`
- 在 development/test 强制免登录：设置 `DEV_NO_AUTH=true`（生产环境不会自动降级）

## 4) curl 测试示例

开发环境启动后（免登录）：

```bash
curl 'http://127.0.0.1:8000/api/v1/campus-core-data-summary?campus=%E5%B9%BF%E8%A5%BF%E6%A1%82%E7%BE%8E%E6%A0%A1%E5%8C%BA&year=2026'
```

> 注意：如果你 curl 的是线上域名 `https://data.qingmei.co/...`，那取决于线上部署是否启用了 `REQUIRE_AUTH`。
