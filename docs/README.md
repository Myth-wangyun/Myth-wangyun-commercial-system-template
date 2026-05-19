# 文档目录说明

## 源码事实版业务数据关系

- `docs/数据关系说明.md`：五部门总览、跨模块主链路、统一检查方法。
- `docs/guides/学术部数据关系与检查清单.md`：学术部当前可见桌面端路由、表格依赖、录入顺序、检查步骤。
- `docs/guides/教质部数据关系与检查清单.md`：教质部核心表、月度个人表、汇总表、跨模块同步链路。
- `docs/guides/市场部数据关系与检查清单.md`：市场部 5 类源表、计划表、月度/年度/阶段汇总关系。
- `docs/guides/咨询部数据关系与检查清单.md`：咨询量录入、汇总、交接、缴费、财务页与教质同步链路。
- `docs/guides/人事部数据关系与检查清单.md`：基础申请表、员工档案、日/月/年看板与集团看板链路。
- `docs/guides/前端桥接迁移到后端真源方案.md`：清理 bridge/localStorage 依赖、迁移到后端真源的实施顺序。

`docs/` 现在按用途分层：当前使用中的说明放在顶层，历史交付和排障文档分别放入子目录，避免根目录和 `docs/` 顶层继续堆积同类文件。

## 1. 目录导航

| 路径 | 用途 |
| ---- | ---- |
| `README.md` | 文档总入口与分类说明 |
| `CODE_INDEX.md` | 代码目录索引、关键模块入口与常用跳转 |
| `guides/PROJECT_READING_GUIDE.md` | 项目阅读与复习指南 |
| `guides/REPOSITORY_MIGRATION_MAP.md` | 本轮目录整理迁移清单 |
| `deployment/` | 启动、部署、发布相关文档 |
| `guides/` | 操作手册、快速参考、实施指南 |
| `troubleshooting/` | 排障、修复记录、诊断说明 |
| `handover/` | 阶段性交付、实现总结、工作记录 |
| `handover/work-reports/` | 日报、周报等工作记录归档，便于后续追溯 |
| `archive/` | 历史页面、备份入口、旧任务清单 |

`archive/` 下面当前重点包含两类历史内容：
- `archive/campus-sorting/`：已完成的校区排序专题历史文档
- `archive/troubleshooting-history/`：一次性排障、修复复盘与历史问题记录
- `archive/deployment-notes/`：被正式 deployment 文档替代的旧部署补充说明
- `archive/legacy-system-analysis/`：旧系统结构分析与历史调研材料
- `archive/project-intro/`：项目介绍、简历/面试/PPT 等对外展示材料

## 2. 关键入口

- 环境变量与启动方式：`ENV_STARTUP.md`
- 数据库初始化：`DB_SETUP.md`
- 前端生产构建：`FRONTEND_PRODUCTION_DEPLOYMENT.md`
- 后端 Windows 启动：`deployment/backend_DEPLOYMENT_WINDOWS.md`
- 后端生产部署：`deployment/backend_PRODUCTION_DEPLOYMENT.md`
- 路由索引：`ROUTES.md`
- 代码目录索引：`CODE_INDEX.md`
- 项目阅读指南：`guides/PROJECT_READING_GUIDE.md`
- 迁移清单：`guides/REPOSITORY_MIGRATION_MAP.md`
- 日报周报归档：`handover/work-reports/`

## 3. 当前仓库结构

```
qm-system/
├── frontend/                 # React 19 + TypeScript + Vite 7 前端
├── backend/                  # FastAPI + SQLAlchemy 2.0 后端
├── docs/                     # 文档目录
│   ├── deployment/           # 部署与启动文档
│   ├── guides/               # 操作手册与参考
│   ├── troubleshooting/      # 问题定位与修复记录
│   ├── handover/             # 实现总结与交接文档
│   └── archive/              # 历史文档与旧资产
├── scripts/
│   ├── deployment/           # 启动、预览、运维脚本
│   ├── development/          # 开发辅助与临时验证脚本
│   └── database/             # 数据库辅助脚本
└── ...
```

## 4. 使用约定

- 新增部署说明，优先放到 `deployment/`。
- 新增操作指引或快速参考，优先放到 `guides/`。
- 阶段性交付、实现总结放到 `handover/`；日报、周报等工作记录统一放到 `handover/work-reports/`。
- 临时修复、问题诊断、故障复盘，放到 `troubleshooting/`。
- 旧入口页、废弃方案、历史任务池，放到 `archive/`。

## 5. 维护建议

1. 新文档尽量写清楚适用范围、依赖路径和对应模块。
2. 如果文档引用脚本，请使用 `scripts/...` 的新路径。
3. 如果文档引用总结或交付物，请优先链接到 `handover/` 或 `archive/` 中的实际文件。
4. 如果要快速定位代码入口，先看 `CODE_INDEX.md`，再进入对应目录。
5. 任何新增文档都必须先放入正确分类目录，再同步更新 `docs/README.md`；若属于代码入口、阅读路径或新人常用资料，还要同步更新 `docs/CODE_INDEX.md` 或阅读指南。
6. `docs/` 顶层只保留当前有效的核心入口和长期说明，不再放日报、周报、临时排障草稿、日志、截图、脚本输出或重复版本文件；日报和周报统一归档到 `handover/work-reports/`，不要直接删除。
