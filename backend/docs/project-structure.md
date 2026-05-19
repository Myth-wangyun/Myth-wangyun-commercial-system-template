# 项目目录整理方案

本方案在不破坏现有功能的前提下，对当前目录进行命名统一、分层清晰化与运维脚本化整理。先给出现状与目标结构，再给出安全的迁移步骤清单与检查要点。

## 现状概览（简）

根目录（system/qm-mang-sys）下主要包含：
- backend/（后端 FastAPI）
- fronted/（前端静态页面与 JS，注意：命名为 fronted）
- docs/、sql/、tools/、logs/、uploads/ 等
- 根级还有 package.json、start.ps1、部分测试与脚本

惯例问题：
- “fronted” 拼写应为 “frontend”，建议统一。
- 前后端杂糅在同一子目录 `qm-mang-sys` 下，根级也有 package.json，建议显式分模块。
- 日志、上传目录建议集中在根级并由配置统一。

## 目标目录结构（建议）

```
qm-mang-sys/
├─ backend/                     # 后端服务（FastAPI）
│  ├─ app/                      # 源码（当前保持）
│  ├─ main.py                   # 入口
│  ├─ requirements.txt          # 依赖
│  └─ ...
├─ frontend/                    # 前端（原 fronted 重命名）
│  ├─ index.html
│  ├─ js/
│  ├─ css/
│  └─ assets/
├─ docs/                        # 文档（维持）
│  ├─ README.md
│  └─ project-structure.md      # 本文档
├─ sql/                         # SQL 脚本（维持）
├─ scripts/                     # 维护脚本（PowerShell/Node/Python）
│  ├─ dev.ps1                   # 开发启动一键脚本（可选）
│  └─ rename-fronted.ps1        # 目录重命名辅助脚本（可选）
├─ tools/                       # 自用工具脚本（维持）
├─ logs/                        # 统一的日志存储（后端/前端构建日志）
├─ uploads/                     # 统一上传目录
├─ .editorconfig                # 统一编码/缩进
├─ .gitignore
└─ README.md                    # 根级说明与快捷入口
```

## 迁移与重命名步骤（安全清单）

> 说明：以下步骤默认在 Windows PowerShell 执行，建议先创建新分支并完成一次完整测试后再合并。

1) 创建备份分支
- 新建分支：`git checkout -b chore/structure-refactor`

2) 重命名 fronted → frontend（核心变更）
- 将 `qm-mang-sys/fronted/` 重命名为 `qm-mang-sys/frontend/`。
- 全局检索替换静态引用路径：
  - HTML 中 `<script src="/fronted/...">`、`<link href="/fronted/...">`
  - 文档或脚本中的 `fronted` 字面文本
- 注意：若通过相对路径引用（如 `./js/main.js`），通常无需修改；若在服务器配置里写死了路径，需同步调整。

3) 统一上传与日志目录
- 后端 `settings` 中已指定 `UPLOAD_DIR=uploads`、日志目录为 `logs`，建议继续沿用。
- 确保后端写路径均使用配置项（不要写死相对路径）。

4) 脚本化与任务
- 在 `scripts/` 中准备开发调试脚本（可选）：
  - `dev.ps1`：同时启动后端（uvicorn）与一个静态服务器（如 `live-server` 或 `http-server`）
  - `rename-fronted.ps1`：一次性完成重命名与引用检查（可选）

5) Git 忽略规则
- 确保根级 `.gitignore` 忽略：
  - `logs/`, `uploads/`, `**/__pycache__/`, `**/.pytest_cache/`, `**/*.pyc`, `node_modules/`（如有）

6) 验证清单（必做）
- 后端：
  - `GET /api/v1/market/daily`、`DELETE /api/v1/market/daily/{id}` 等核心路由可用
  - Swagger UI `/docs` 正常
- 前端：
  - 页面能正常加载静态资源（JS/CSS）
  - 与后端接口连通（列表、删除、分页、统计）
- 构建/启动：
  - 本地开发一键脚本可执行并打印访问地址

## 命名/组织约定（建议）
- 目录名：全部小写、用横杠或不带分隔，跨语言通用（frontend, backend, scripts）
- 文件名：JS/CSS 使用短横线命名（partner-management.js），Python 使用下划线（snake_case）
- 环境配置：
  - 后端 `.env` 放在 `backend/`，通过 `pydantic-settings` 加载
  - 前端如需环境变量，使用 `.env.*`（若使用打包工具）或在 `config.js` 中统一管理

## 风险与回滚
- 重命名目录会影响硬编码路径引用，务必全局搜索 `fronted` 并替换。
- 建议在 PR 中分为两次提交：
  1. 仅目录移动与路径替换
  2. 后续小问题修复（引用遗漏、脚本补充）
- 如出现问题，直接回滚到迁移前的提交即可。

---

如需要，我可以：
- 直接提交 `scripts/rename-fronted.ps1` 重命名脚本
- 补充 `.gitignore`、`.editorconfig`、根级 `README.md` 模板
- 提交一个 `scripts/dev.ps1` 一键启动（后端 + 静态文件服务）
