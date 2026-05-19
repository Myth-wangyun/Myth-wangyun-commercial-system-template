# 当面标准化检查表 - 快速启动指南

## 📋 功能已实现 ✅

当面标准化检查表功能已经完整实现，包含以下内容：

### 1. 后端实现 ✅
- ✅ 数据模型 (`backend/app/models/consult/face_to_face_check.py`)
- ✅ 数据模式 (`backend/app/schemas/consult/face_to_face_check.py`)
- ✅ CRUD 操作 (`backend/app/crud/consult/face_to_face_check.py`)
- ✅ API 路由 (`backend/app/api/v1/endpoints/consult/face_to_face_check.py`)
- ✅ 数据库初始化脚本 (`backend/app/models/consult/init_face_to_face_check.py`)

### 2. 前端实现 ✅
- ✅ 类型定义 (`frontend/types/face-to-face-check.ts`)
- ✅ API 服务 (`frontend/services/faceToFaceCheck.ts`)
- ✅ 主页面 (`frontend/pages/consult/face-to-face-check/index.vue`)
- ✅ 记录编辑器 (`frontend/pages/consult/face-to-face-check/components/FaceToFaceCheckEditor.vue`)
- ✅ 模板配置管理 (`frontend/pages/consult/face-to-face-check/components/TemplateConfigDrawer.vue`)
- ✅ 模板编辑器 (`frontend/pages/consult/face-to-face-check/components/TemplateEditorDrawer.vue`)

## 🚀 快速启动

### 步骤 1: 创建数据库表

```bash
# 进入后端目录
cd backend

# 运行初始化脚本
python -m app.models.consult.init_face_to_face_check
```

### 步骤 2: 注册 API 路由

在后端的路由注册文件中添加：

```python
# backend/app/api/v1/router.py 或类似文件
from app.api.v1.endpoints.consult.face_to_face_check import router as face_to_face_check_router

# 注册路由
api_router.include_router(
    face_to_face_check_router,
    prefix="/consult",
    tags=["当面标准化检查表"]
)
```

### 步骤 3: 添加前端路由

在前端路由配置中添加：

```typescript
// frontend/router/index.ts
{
  path: '/consult/face-to-face-check',
  name: 'FaceToFaceCheck',
  component: () => import('@/pages/consult/face-to-face-check/index.vue'),
  meta: {
    title: '当面标准化检查表',
    requireAuth: true,
  }
}
```

### 步骤 4: 初始化默认模板

首次使用时，需要初始化默认模板：

**方法 1: 通过 API**
```bash
curl -X POST http://your-domain/api/v1/consult/face-to-face-template/init-default
```

**方法 2: 通过界面**
1. 启动应用
2. 进入"当面标准化检查表"页面
3. 点击"模板配置"按钮
4. 点击"初始化默认模板"按钮

### 步骤 5: 开始使用

1. **创建预案**：
   - 点击"创建预案"按钮
   - 填写学员基本信息
   - 按照咨询步骤填写内容和思路关键点
   - 保存预案

2. **创建复盘**：
   - 点击"创建复盘"按钮
   - 填写学员信息（可以关联到预案）
   - 填写实际沟通内容和领导指正
   - 填写自我总结
   - 保存复盘

3. **配置自定义模板**：
   - 点击"模板配置"按钮
   - 点击"新建模板"
   - 自定义咨询步骤和基本信息字段
   - 保存并设置为默认模板

## 📊 核心功能说明

### 1. 咨询步骤（16个标准步骤）

系统预设了16个不可修改但内容可编辑的咨询步骤：

1. 寒暄暖场
2. 广泛提问挖掘需求
3. 分析诊断总结
4. 愿景引领（提升认知）
5. 专业引导（打破思维，上台阶）
6. 清美学校定位
7. 清美适合他专业介绍
8. 清美优势（满足需求）
9. 堵退路（贯穿学生案例）
10. 谋求认同
11. 再次解除抗拒
12. 铺垫价位（投资者重要性）
13. 报价关单
14. 再次解除抗拒关单（至少7次）
15. 远程视频连线
16. 成交后交接班主任

### 2. 灵活的模板系统

- **模板类型**：预案和复盘两种类型
- **默认模板**：每种类型可以设置一个默认模板
- **字段自定义**：可以自定义基本信息字段
- **步骤配置**：可以配置每个步骤的示例内容和思路关键点

### 3. 记录管理

- **创建记录**：支持创建预案和复盘
- **关联关系**：复盘可以关联到预案
- **编辑修改**：支持随时编辑记录内容
- **导出功能**：支持将咨询步骤表格导出为图片

## 🔧 配置说明

### 环境变量

确保后端配置了正确的数据库连接：

```env
# backend/.env
DATABASE_URL=sqlite:///./qm_system.db  # 或其他数据库
```

### 权限配置

建议配置以下权限：

```python
# 在路由中添加权限装饰器
@router.post("/face-to-face-check", dependencies=[Depends(get_current_user)])
def create_face_to_face_check(...):
    ...
```

## 📝 数据结构

### 当面标准化检查表

```json
{
  "记录ID": 1,
  "咨询日期": "2026-01-19T17:42:58",
  "学员姓名": "张三",
  "性别": "男",
  "年龄": "18",
  "状态": "咨询中",
  "需求": "想了解美术专业",
  "关注点": "学费、就业",
  "抗拒点": "担心学不会",
  "陪同人": "母亲",
  "决策人": "父亲",
  "记录类型": "预案",
  "咨询步骤内容": [
    {
      "步骤序号": 1,
      "步骤名称": "寒暄暖场",
      "内容": "询问天气、交通情况",
      "思路关键点": "建立良好沟通氛围"
    }
  ],
  "自我总结": "",
  "领导指正": "",
  "创建人ID": 1,
  "创建人姓名": "张老师",
  "校区": "北京校区"
}
```

## 🐛 常见问题

### 1. 数据库表创建失败

**问题**：运行初始化脚本时报错

**解决方案**：
- 检查数据库连接配置
- 确保有创建表的权限
- 手动执行 SQL 创建表

### 2. 前端路由 404

**问题**：访问页面时显示 404

**解决方案**：
- 检查路由配置是否正确
- 确认组件路径是否正确
- 重启前端开发服务器

### 3. API 调用失败

**问题**：前端调用后端 API 时报错

**解决方案**：
- 检查后端服务是否启动
- 确认 API 路由是否注册
- 查看浏览器控制台和后端日志

## 📞 技术支持

如有问题，请查看：
- 详细文档：`docs/FACE_TO_FACE_CHECK_README.md`
- 数据模型：`backend/app/models/consult/face_to_face_check.py`
- API 文档：启动后端后访问 `/docs`

## ✨ 下一步

功能已经完整实现，你可以：

1. ✅ 初始化数据库
2. ✅ 注册路由
3. ✅ 测试功能
4. ✅ 根据实际需求调整

祝使用愉快！🎉
