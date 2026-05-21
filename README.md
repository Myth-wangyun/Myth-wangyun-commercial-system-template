# 诸神殿神祇管理系统

> 基于 React + FastAPI 的现代化企业管理系统模板

## 项目简介

诸神殿神祇管理系统是一套通用的商业化企业管理平台，采用前后端分离架构，支持快速二次开发。系统包含完整的用户认证、权限管理、数据管理等功能，适用于各类企业和组织的管理需求。

## 技术栈

### 前端
- **框架**: React 19 + TypeScript
- **构建工具**: Vite 7
- **路由**: React Router 7
- **状态管理**: Zustand
- **HTTP 客户端**: Axios
- **UI 组件**: Headless UI + 自定义组件
- **样式**: Tailwind CSS
- **图表**: ECharts

### 后端
- **框架**: FastAPI
- **语言**: Python 3.12
- **数据库**: PostgreSQL
- **ORM**: SQLAlchemy 2.0
- **认证**: JWT (OAuth2 Password Flow)
- **数据验证**: Pydantic v2

## 功能特性

- **用户认证**: 支持用户名密码登录、JWT Token 认证、自动刷新 Token
- **权限管理**: 基于角色的权限控制 (RBAC)，灵活的权限分配
- **神殿管理**: 完整的增删改查功能，支持数据导入导出
- **神祇档案**: 详细的神祇信息管理，包含多维度数据展示
- **数据统计**: 可视化数据看板，实时掌握运营数据
- **响应式设计**: 完美适配桌面端和移动端

## 系统预览

### 登录界面
![登录界面](login-preview.png)

### 管理后台
```
┌─────────────────────────────────────────────────────────────┐
│  诸神殿 神祇管理系统                                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────────────────────────────────────┐  │
│  │ 侧边栏  │  │                                         │  │
│  │         │  │              主内容区域                  │  │
│  │ - 首页  │  │                                         │  │
│  │ - 神祇  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │  │
│  │ - 神殿  │  │  │ 数据卡片 │ │ 数据卡片 │ │ 数据卡片 │   │  │
│  │ - 部门  │  │  └─────────┘ └─────────┘ └─────────┘   │  │
│  │ - 统计  │  │                                         │  │
│  │ - 设置  │  │  ┌─────────────────────────────────┐   │  │
│  │         │  │  │         图表展示区域              │   │  │
│  └─────────┘  │  └─────────────────────────────────┘   │  │
│               └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- Python >= 3.12
- PostgreSQL >= 14
- pnpm >= 8.0.0

### 1. 克隆项目

```bash
git clone https://github.com/Myth-wangyun/commercial-system-template.git
cd commercial-system-template
```

### 2. 配置后端

```bash
# 进入后端目录
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp ../.env.example .env
# 编辑 .env 文件，配置数据库连接

# 初始化数据库
python main.py --mode=dev
```

### 3. 配置前端

```bash
# 新开终端，进入前端目录
cd frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev
```

### 4. 访问系统

- 前端地址: http://localhost:5000
- 后端地址: http://localhost:8000
- API 文档: http://localhost:8000/docs

**默认管理员账号**:
- 用户名: `admin`
- 密码: `admin123`

## 项目结构

```
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── components/     # 公共组件
│   │   ├── pages/          # 页面组件
│   │   ├── stores/         # 状态管理
│   │   ├── services/       # API 服务
│   │   ├── hooks/          # 自定义 Hooks
│   │   ├── utils/          # 工具函数
│   │   └── types/          # TypeScript 类型
│   ├── public/             # 静态资源
│   └── package.json
│
├── backend/                 # 后端项目
│   ├── app/
│   │   ├── api/            # API 路由
│   │   ├── core/           # 核心配置
│   │   ├── models/         # 数据模型
│   │   ├── schemas/        # Pydantic 模型
│   │   ├── services/       # 业务逻辑
│   │   └── utils/          # 工具函数
│   ├── migrations/          # 数据库迁移
│   ├── scripts/             # 脚本文件
│   ├── main.py             # 应用入口
│   └── requirements.txt
│
├── public/                  # 根目录静态资源
├── .env.example             # 环境变量示例
├── .coze                   # Coze 配置
├── AGENTS.md               # AI Agent 规范
├── Dockerfile              # Docker 配置
└── README.md
```

## Docker 部署

```bash
# 构建镜像
docker build -t zhushendian-system .

# 运行容器
docker run -d \
  --name zhushendian \
  -p 8000:8000 \
  -p 5000:5000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  zhushendian-system
```

## 环境变量

### 前端 (.env)

```env
VITE_API_BASE_URL=/api/v1
VITE_APP_TITLE=诸神殿神祇管理系统
```

### 后端 (.env)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/qmjy
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

## API 接口

| 模块 | 路径 | 说明 |
|------|------|------|
| 认证 | `/api/v1/auth/login` | 用户登录 |
| 认证 | `/api/v1/auth/me` | 获取当前用户信息 |
| 神祇 | `/api/v1/gods` | 神祇列表 |
| 神祇 | `/api/v1/gods/{id}` | 神祇详情 |
| 神殿 | `/api/v1/campuses` | 神殿列表 |
| 部门 | `/api/v1/departments` | 部门列表 |

详细 API 文档请访问 `/docs`

## 开发指南

### 前端开发

```bash
# 代码检查
pnpm run lint

# 类型检查
pnpm run type-check

# 构建生产版本
pnpm run build
```

### 后端开发

```bash
# 代码检查
ruff check .

# 自动修复
ruff check --fix .

# 运行测试
pytest
```

## 许可证

本项目仅供学习参考使用，商业使用请联系作者授权。

## 联系方式

- GitHub: https://github.com/Myth-wangyun
- 项目地址: https://github.com/Myth-wangyun/commercial-system-template

---

**Star ⭐ 欢迎使用**
