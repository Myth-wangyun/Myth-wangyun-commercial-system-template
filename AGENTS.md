# 诸神殿管理系统 (ZhuShenDian) AGENTS

## 项目概述

诸神殿管理系统是一个神秘而庄严的神祇管理系统，供奉三位至高神祇：永恒之王、吴来佛祖、李大菩萨。系统采用深紫色神秘主题，带有金色点缀，营造神圣庄严的氛围。

## 技术栈

- **前端**: React 19 + TypeScript + Vite 7 + Ant Design 5 + Zustand
- **后端**: FastAPI + SQLAlchemy 2.0 + PostgreSQL + Python 3.12
- **Node.js**: 22.x
- **包管理器**: pnpm
- **数据库**: PostgreSQL (postgres/postgres@localhost:5432/qmjy)

## 目录结构

```
qm-system-67fc19767ef4efe27e7555b0f892fd95cedc746d/
├── frontend/          # 前端业务页面、服务、状态管理
├── backend/          # 后端 API、模型、Schema、CRUD
├── docs/             # 文档总目录
├── scripts/          # 脚本目录
│   ├── init_gods.py  # 神祇和数据库初始化脚本
│   └── ...
├── tests/            # Playwright E2E 测试
├── dist/             # 前端构建产物
├── package.json
├── vite.config.ts
└── main.py           # Python 统一启动入口
```

## 核心模块

### 神祇管理 (God)
- **Model**: `backend/app/models/god.py`
- **Schema**: `backend/app/models/god.py`
- **CRUD**: `backend/app/crud/god.py`
- **API**: `backend/app/api/v1/endpoints/god.py`
- **前端页面**: `frontend/pages/god/GodTemple.tsx`

### 管理员认证
- **管理员登录页面**: `frontend/pages/admin/AdminLogin.tsx`
- **原始数据页面**: `frontend/pages/admin/RawData.tsx`
- **管理员账号**: admin
- **管理员密码**: admin123

### 数据库表
- `gods`: 神祇信息表
- `admin_users`: 管理员用户表

## 运行与预览

### 本地开发
```bash
# 初始化数据库（首次运行）
python -m scripts.init_gods

# 前端
pnpm install
pnpm exec vite --host 0.0.0.0 --port 5000

# 后端
python main.py --mode dev
```

### Coze 预览
- **项目类型**: web
- **预览端口**: 5000
- **预览入口**: 
  - Build: `scripts/coze-preview-build.sh`
  - Run: `scripts/coze-preview-run.sh`

### Coze 部署
- **Kind**: service
- **Flavor**: web
- **端口**: 5000
- **Build**: `scripts/build.sh`
- **Run**: `scripts/run.sh`

## 数据库初始化

```bash
# 初始化神祇数据和管理员账号
python -m scripts.init_gods
```

**初始化内容**:
- 神祇数据: 永恒之王、吴来佛祖、李大菩萨
- 管理员账号: admin / admin123456

## 用户偏好与长期约束

1. 前端接口通过 `frontend/services/api.ts` 注入多校区 `X-Campus` 请求头
2. 状态管理使用 Zustand，不以 React Query 作为主数据流
3. 数据库使用 PostgreSQL，需要先启动数据库服务
4. Node.js 项目必须使用 `pnpm` 管理依赖，禁止 npm 或 yarn
5. 数据库连接信息: admin/admin123..@localhost:5432/zhuushendian

## 常见问题和预防

1. **端口冲突**: 5000 端口为 Coze 预览/部署专用端口
2. **后端依赖**: 后端需要 PostgreSQL 数据库，确保数据库服务运行
3. **环境变量**: 项目使用 `.env` 文件管理环境变量
4. **数据库未启动**: 使用 `service postgresql start` 启动数据库
