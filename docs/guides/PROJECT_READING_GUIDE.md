# 项目阅读指南

本文档面向两类人：

- 新加入项目、需要快速建立全局认识的开发者
- 休假或隔了一段时间没维护此仓库、需要快速恢复上下文的开发者

目标不是一次读完所有文档，而是用最短时间找到正确入口、恢复代码地图、重新具备改动能力。

## 1. 10 分钟快速恢复

适用于：先把项目跑起来、知道入口在哪、知道最近文档怎么找。

### 第一步：看总入口

1. 阅读 `README.md`
2. 阅读 `docs/README.md`
3. 阅读 `docs/CODE_INDEX.md`

这三份文档解决三个问题：

- 项目现在是什么结构
- 文档按什么分类存放
- 代码主要从哪里进入

### 第二步：确认运行方式

按需阅读：

- `docs/ENV_STARTUP.md`
- `docs/DB_SETUP.md`
- `scripts/deployment/`

如果只是本地开发，先记住两个入口：

- 后端：`python main.py --mode dev`
- 前端：`npm run dev`

### 第三步：看最近整理规则

阅读：

- `docs/guides/REPOSITORY_MIGRATION_MAP.md`

这一步的作用是避免你继续去根目录找旧文档、旧脚本名。

## 2. 30 分钟模块恢复

适用于：准备动代码，但还不确定应该从前端还是后端切入。

### 2.1 先建立代码地图

依次查看：

1. `frontend/config/router/routes.ts`
2. `frontend/services/api.ts`
3. `frontend/stores/authStore.ts`
4. `frontend/stores/campusStore.ts`
5. `backend/app/api/v1/__init__.py`
6. `backend/app/api/v1/endpoints/`
7. `backend/app/models/`
8. `backend/app/schemas/`
9. `backend/app/crud/`

### 2.2 记住三个项目级约定

1. 多校区通过 `X-Campus` 请求头隔离，前端注入，后端读取。
2. 前端主数据流是服务函数 + Zustand，不是 React Query 驱动。
3. 后端大量业务表使用多 schema，常见为 `academic` 和 `teaching_quality`。

### 2.3 文档查找顺序

当你遇到一个功能名时，按下面顺序查：

1. 先看 `docs/CODE_INDEX.md`
2. 再看 `docs/guides/`
3. 再看 `docs/handover/`
4. 最后看 `docs/troubleshooting/`

经验上：

- 想知道“怎么用”或“怎么配置”，优先看 `guides`
- 想知道“之前怎么实现的”，优先看 `handover`
- 想知道“哪里出过坑”，优先看 `troubleshooting`

## 3. 2 小时深入复习

适用于：休假回来要接手需求，或者新人准备独立改一块模块。

### 阶段 A：项目与基础设施

按顺序阅读：

1. `README.md`
2. `docs/README.md`
3. `docs/CODE_INDEX.md`
4. `docs/ENV_STARTUP.md`
5. `docs/DB_SETUP.md`
6. `CLAUDE.md`
7. `.claude-summary.md`

重点关注：

- 当前项目结构
- 启动方式
- 文档和脚本的新目录规则
- 最近会话里沉淀的历史上下文

### 阶段 B：前端主链路

按顺序阅读：

1. `frontend/main.tsx`
2. `frontend/App.tsx`
3. `frontend/config/router/routes.ts`
4. `frontend/config/router/routeComponents.ts`
5. `frontend/services/api.ts`
6. `frontend/services/` 里与你目标模块最接近的服务文件
7. `frontend/stores/`
8. `frontend/pages/` 里对应模块目录

目标：

- 知道页面如何挂路由
- 知道接口如何调用
- 知道校区上下文如何透传
- 知道状态落在哪个 store

### 阶段 C：后端主链路

按顺序阅读：

1. `backend/main.py`
2. `backend/app/api/v1/__init__.py`
3. 对应的 `backend/app/api/v1/endpoints/*.py`
4. 对应的 `backend/app/schemas/*.py`
5. 对应的 `backend/app/models/*.py`
6. 对应的 `backend/app/crud/*.py`

目标：

- 知道接口注册位置
- 知道请求参数和响应结构
- 知道模型所在 schema
- 知道数据真正从哪里查、写、聚合

## 4. 按任务类型的阅读入口

### 4.1 我要新增一个页面

先看：

1. `docs/CODE_INDEX.md`
2. `frontend/config/router/routes.ts`
3. `frontend/pages/` 目标目录
4. `frontend/services/` 对应服务文件
5. `docs/handover/` 里同类页面的历史实现总结

### 4.2 我要新增一个后端接口

先看：

1. `backend/app/api/v1/__init__.py`
2. `backend/app/api/v1/endpoints/` 同类接口
3. `backend/app/schemas/`
4. `backend/app/models/`
5. `backend/app/crud/`

### 4.3 我要排查线上或历史问题

先看：

1. `docs/troubleshooting/`
2. `docs/handover/`
3. `scripts/development/` 里相关测试脚本
4. `exports/diagnostics/` 里的诊断输出

### 4.4 我要理解某个业务模块的来龙去脉

推荐顺序：

1. 先在 `docs/guides/` 找操作说明
2. 再在 `docs/handover/` 找实现总结
3. 再去 `frontend/pages/` 和 `backend/app/api/v1/endpoints/` 对应目录读代码

## 5. 返岗复习清单

如果你休假回来，只做下面这些也能很快恢复状态：

1. 重新看 `README.md`、`docs/README.md`、`docs/CODE_INDEX.md`
2. 看 `docs/guides/REPOSITORY_MIGRATION_MAP.md`，避免按旧路径找文件
3. 看 `.claude-summary.md` 了解最近会话背景
4. 看 `.tasks/current.md` 了解当前任务状态
5. 进入你负责的模块，先看 `guides`，再看 `handover`，最后看代码
6. 真正动手前，先确认脚本已经迁移到 `scripts/` 子目录，不要再使用根目录旧命令

## 6. 文档维护规则

从本轮整理开始，文档维护遵循下面的规则：

1. 新文档必须先分类，再创建，不能直接堆到根目录。
2. 新文档创建后，至少更新 `docs/README.md`。
3. 如果文档会影响新人入门、返岗复习、代码入口定位，还要更新 `docs/CODE_INDEX.md` 或本文档。
4. 新脚本必须进入 `scripts/` 对应子目录，不能回流到根目录。
5. 如果移动了已有文档或脚本，要同步修复引用，不把旧路径遗留给后来者。

## 7. 建议的复习节奏

### 新人

1. 第一天：只读 `README.md`、`docs/README.md`、`docs/CODE_INDEX.md`
2. 第二天：把本地环境跑起来，读 `ENV_STARTUP` 和 `DB_SETUP`
3. 第三天：挑一个具体模块，从路由、页面、service、endpoint、model 走一遍

### 返岗开发者

1. 前 15 分钟：看入口文档和迁移清单
2. 前 30 分钟：恢复自己负责模块的代码地图
3. 前 60 分钟：阅读最近相关的 `handover` 和 `troubleshooting`
4. 动手前：先确认旧路径和旧脚本名没有混入你的操作习惯
