# 清美教育管理系统

清美教育管理系统是一个前后端分离的多校区教育管理系统。前端采用 React 19、TypeScript、Vite 7 与 Ant Design 5，后端采用 FastAPI、SQLAlchemy 2.0 与 PostgreSQL。

## 项目结构

```
qm-system/
├── frontend/                 # 前端业务页面、服务、状态管理
├── backend/                  # 后端 API、模型、Schema、CRUD
├── docs/                     # 文档总目录
│   ├── README.md             # 文档分类入口
│   ├── CODE_INDEX.md         # 代码索引
│   ├── deployment/           # 启动、部署、发布说明
│   ├── guides/               # 操作手册与快速参考
│   ├── troubleshooting/      # 排障与修复记录
│   ├── handover/             # 实现总结与交接文档
│   └── archive/              # 历史文档与旧资产
├── scripts/
│   ├── deployment/           # 启动与运维脚本
│   ├── development/          # 开发辅助脚本
│   └── database/             # 数据库辅助脚本
├── tests/                    # Playwright E2E
├── docker-compose.yml
├── Dockerfile
└── main.py                   # 统一 Python 启动入口
```

## 快速开始

### 后端

```bash
python main.py --mode dev
```

也可以使用部署脚本：

```powershell
.\scripts\deployment\start-backend-env.ps1 -Mode dev -BindHost 127.0.0.1 -Port 8000
```

### 前端

```bash
npm install
npm run dev
```

### 测试

```bash
npm run test
npm run test:e2e
```

## 关键文档

- 启动与环境变量：`docs/ENV_STARTUP.md`
- 数据库初始化：`docs/DB_SETUP.md`
- 文档目录：`docs/README.md`
- 代码索引：`docs/CODE_INDEX.md`
- 项目阅读指南：`docs/guides/PROJECT_READING_GUIDE.md`
- 仓库迁移清单：`docs/guides/REPOSITORY_MIGRATION_MAP.md`
- 生产部署：`docs/deployment/PRODUCTION_DEPLOYMENT_GUIDE.md`

## 项目约定

- 前端接口通过 `frontend/services/api.ts` 注入多校区 `X-Campus` 请求头。
- 状态管理使用 Zustand，不以 React Query 作为主数据流。
- 非 `public` 表默认使用 PostgreSQL 多 schema 设计，主要包含 `academic` 与 `teaching_quality`。
- 运行、部署、测试相关脚本统一归档到 `scripts/` 下的分类目录。
- 新增文档必须按用途归入 `docs/` 子目录，并同步更新索引入口。

## 许可证

Private
