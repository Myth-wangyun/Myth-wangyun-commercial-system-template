# 当面标准化检查表功能文档

## 功能概述

当面标准化检查表是一个用于咨询部门记录和管理当面咨询流程的工具，包括预案制定和复盘总结两个阶段。系统支持灵活的模板配置，允许用户自定义表格内容。

## 功能特点

### 1. 模板管理
- **模板类型**：支持预案和复盘两种类型
- **可配置内容**：
  - 咨询步骤配置（分类、步骤内容）
  - 基本信息字段配置
  - 咨询步骤中的内容允许编辑
  - 复盘模板的第二列（领导指正）允许编辑
- **模板功能**：
  - 创建、编辑、删除模板
  - 设置默认模板
  - 启用/禁用模板
  - 按校区区分模板

### 2. 预案管理
- 记录咨询前的准备工作
- 包含学员基本信息
- 按照标准化流程填写各个咨询步骤
- 支持记录需求、关注点、抗拒点等关键信息

### 3. 复盘管理
- 基于预案创建复盘记录
- 在预案基础上增加"领导指正"字段
- 记录自我总结和领导指导意见
- 对比预案和实际执行情况

## 数据库表结构

### 当面标准化检查表（主表）
```
记录ID              主键，自增
咨询日期            咨询发生的日期时间
学员姓名            学员姓名
性别                性别
年龄                年龄
状态                状态标签（关注/关键/高求等）
需求                学员需求描述
关注点              关注点
抗拒点              抗拒点
陪同人              陪同人员
决策人              决策人
记录类型            预案/复盘
关联预案ID          复盘记录关联的预案ID
咨询步骤内容        JSON格式存储的步骤内容
自我总结            自我总结
领导指正            领导指正意见
创建人ID            创建人ID
创建人姓名          创建人姓名
校区                校区
创建时间            创建时间
更新时间            更新时间
```

### 当面标准化模板配置
```
模板ID              主键，自增
模板名称            模板名称
模板类型            预案/复盘
咨询步骤配置        JSON格式的步骤配置
基本信息字段配置    JSON格式的字段配置
是否启用            0-禁用 1-启用
是否默认            0-否 1-是
排序序号            排序用
备注                备注信息
创建人ID            创建人ID
创建人姓名          创建人姓名
校区                校区
创建时间            创建时间
更新时间            更新时间
```

## API 接口

### 检查表相关

#### 创建检查表记录
```
POST /api/consult/face-to-face/check/create
```

#### 获取检查表记录详情
```
GET /api/consult/face-to-face/check/{record_id}
```

#### 获取检查表记录列表
```
GET /api/consult/face-to-face/check/list
参数：
  - record_type: 记录类型（预案/复盘）
  - student_name: 学员姓名（模糊查询）
  - start_date: 开始日期
  - end_date: 结束日期
  - campus: 校区
  - creator_id: 创建人ID
  - page: 页码
  - page_size: 每页数量
```

#### 更新检查表记录
```
PUT /api/consult/face-to-face/check/update
```

#### 删除检查表记录
```
DELETE /api/consult/face-to-face/check/{record_id}
```

### 模板相关

#### 创建模板
```
POST /api/consult/face-to-face/template/create
```

#### 获取模板详情
```
GET /api/consult/face-to-face/template/{template_id}
```

#### 获取模板列表
```
GET /api/consult/face-to-face/template/list
参数：
  - template_type: 模板类型（预案/复盘）
  - is_enabled: 是否启用
  - campus: 校区
  - page: 页码
  - page_size: 每页数量
```

#### 获取默认模板
```
GET /api/consult/face-to-face/template/default/{template_type}
参数：
  - campus: 校区
```

#### 更新模板
```
PUT /api/consult/face-to-face/template/update
```

#### 删除模板
```
DELETE /api/consult/face-to-face/template/{template_id}
```

#### 设置为默认模板
```
POST /api/consult/face-to-face/template/{template_id}/set-default
```

## 前端页面

### 1. 模板管理页面
路径: `frontend/pages/consult/FaceToFaceTemplateManagement.tsx`

功能：
- 查看所有模板列表
- 创建新模板
- 编辑现有模板
- 删除模板
- 设置默认模板
- 启用/禁用模板

### 2. 检查表管理页面
路径: `frontend/pages/consult/FaceToFaceCheck.tsx`

功能：
- 查看预案和复盘列表（Tab切换）
- 创建新的预案/复盘
- 编辑现有记录
- 查看记录详情
- 删除记录
- 从预案创建复盘

## 使用流程

### 1. 初始化模板
```bash
# 运行脚本初始化默认模板
python backend/scripts/init_face_to_face_templates.py
```

### 2. 配置模板（可选）
1. 进入模板管理页面
2. 可以基于默认模板创建自定义模板
3. 设置常用模板为默认模板

### 3. 创建预案
1. 进入检查表页面
2. 点击"新建预案"
3. 填写学员基本信息
4. 按照模板步骤填写咨询计划
5. 保存预案

### 4. 创建复盘
1. 在预案列表中找到对应记录
2. 点击"创建复盘"
3. 系统自动加载预案内容
4. 在"领导指正"列填写指导意见
5. 填写自我总结和领导指正
6. 保存复盘

## 咨询步骤配置示例

### 预案模板格式
```json
[
  {
    "分类": "定案概场",
    "步骤": [
      {
        "序号": 1,
        "内容": "核卡授课环境时间",
        "可编辑": true
      },
      {
        "序号": 2,
        "内容": "当天先家（认真理性接待关系）",
        "可编辑": true
      }
    ]
  }
]
```

### 复盘模板格式
```json
[
  {
    "分类": "定案概场",
    "步骤": [
      {
        "序号": 1,
        "内容": "核卡授课环境时间",
        "可编辑": true,
        "领导指正": ""
      },
      {
        "序号": 2,
        "内容": "当天先家（认真理性接待关系）",
        "可编辑": true,
        "领导指正": ""
      }
    ]
  }
]
```

## 注意事项

1. **模板设计**：
   - 咨询步骤名称（分类）固定，不允许修改
   - 步骤内容允许用户编辑
   - 复盘模板的"领导指正"列允许用户填写

2. **数据关联**：
   - 复盘记录可以关联到预案记录
   - 删除预案时需要注意关联的复盘记录

3. **权限控制**：
   - 建议实现基于角色的访问控制
   - 限制模板的删除和修改权限

4. **默认模板**：
   - 每个类型（预案/复盘）只能有一个默认模板
   - 设置新的默认模板时，旧的默认模板会自动取消

## 文件清单

### 后端文件
- `backend/app/models/consult/face_to_face_check.py` - 数据模型
- `backend/app/crud/consult/face_to_face_check.py` - CRUD操作
- `backend/app/schemas/consult/face_to_face_check.py` - 数据模式
- `backend/app/services/consult/face_to_face_check.py` - API服务
- `backend/scripts/init_face_to_face_templates.py` - 初始化脚本

### 前端文件
- `frontend/services/consult/faceToFaceCheck.ts` - API服务
- `frontend/pages/consult/FaceToFaceTemplateManagement.tsx` - 模板管理页面
- `frontend/pages/consult/FaceToFaceCheck.tsx` - 检查表管理页面

## 扩展建议

1. **数据分析**：
   - 统计咨询成功率
   - 分析常见问题和解决方案
   - 生成咨询效果报告

2. **流程优化**：
   - 添加咨询流程模板库
   - 支持步骤模板的导入导出
   - 实现咨询话术库

3. **协作功能**：
   - 支持多人协同填写
   - 添加评论和批注功能
   - 实现审批流程

4. **移动端**：
   - 开发移动端应用
   - 支持离线编辑
   - 语音输入功能
