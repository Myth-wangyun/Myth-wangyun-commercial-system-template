# 当面标准化检查表功能说明

## 功能概述

当面标准化检查表系统是一个灵活的模板配置工具，用于指导和管理面对面的销售/咨询沟通流程。系统包含两个主要部分：

1. **当面预案**：在沟通前规划流程和内容
2. **当面复盘**：在沟通后总结经验和改进点

## 核心特性

### 1. 灵活的模板配置
- 支持自定义咨询步骤（固定16个步骤，内容可编辑）
- 支持自定义基本信息字段
- 支持设置默认模板
- 支持多校区独立配置

### 2. 标准化咨询流程

系统预设了16个标准咨询步骤：

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

### 3. 记录管理
- 创建预案/复盘记录
- 关联预案和复盘
- 查看历史记录
- 导出为图片

## 技术架构

### 后端

#### 1. 数据模型
- `当面标准化检查表`：主表，存储预案和复盘记录
- `当面标准化模板配置`：模板配置表

#### 2. API 端点
```
POST   /api/v1/consult/face-to-face-check                    创建记录
GET    /api/v1/consult/face-to-face-check/{record_id}        获取记录详情
GET    /api/v1/consult/face-to-face-check                    获取记录列表
PUT    /api/v1/consult/face-to-face-check                    更新记录
DELETE /api/v1/consult/face-to-face-check/{record_id}        删除记录
GET    /api/v1/consult/face-to-face-check/plan/{plan_id}/reviews  获取预案的复盘记录

POST   /api/v1/consult/face-to-face-template                 创建模板
GET    /api/v1/consult/face-to-face-template/{template_id}   获取模板详情
GET    /api/v1/consult/face-to-face-template                 获取模板列表
GET    /api/v1/consult/face-to-face-template/default         获取默认模板
PUT    /api/v1/consult/face-to-face-template                 更新模板
DELETE /api/v1/consult/face-to-face-template/{template_id}   删除模板
PUT    /api/v1/consult/face-to-face-template/{id}/set-default 设置为默认模板
POST   /api/v1/consult/face-to-face-template/init-default    初始化默认模板
```

### 前端

#### 1. 页面组件
- `frontend/pages/consult/face-to-face-check/index.vue`：主页面
- `frontend/pages/consult/face-to-face-check/components/FaceToFaceCheckEditor.vue`：记录编辑器
- `frontend/pages/consult/face-to-face-check/components/TemplateConfigDrawer.vue`：模板配置管理
- `frontend/pages/consult/face-to-face-check/components/TemplateEditorDrawer.vue`：模板编辑器

#### 2. 类型定义
- `frontend/types/face-to-face-check.ts`：TypeScript 类型定义

#### 3. 服务层
- `frontend/services/faceToFaceCheck.ts`：API 服务封装

## 使用说明

### 1. 初始化默认模板

首次使用时，需要初始化默认模板：

```typescript
// 通过 API 初始化
POST /api/v1/consult/face-to-face-template/init-default
```

或在界面上点击"初始化默认模板"按钮。

### 2. 配置自定义模板

1. 点击"模板配置"按钮
2. 点击"新建模板"
3. 填写模板信息：
   - 模板名称
   - 模板类型（预案/复盘）
   - 咨询步骤配置
   - 基本信息字段配置
   - 是否启用
   - 是否默认
4. 保存模板

### 3. 创建预案

1. 点击"创建预案"按钮
2. 填写基本信息（学员姓名、性别、年龄等）
3. 填写每个咨询步骤的内容和思路关键点
4. 保存预案

### 4. 创建复盘

1. 点击"创建复盘"按钮
2. 选择关联的预案（可选）
3. 填写基本信息
4. 填写每个咨询步骤的实际内容和领导指正
5. 填写自我总结和领导指正
6. 保存复盘

### 5. 导出图片

在记录编辑器中，点击"导出图片"按钮可以将咨询步骤表格导出为图片。

## 数据库迁移

在使用前，需要创建数据库表：

```sql
-- 当面标准化检查表
CREATE TABLE 当面标准化检查表 (
    记录ID INTEGER PRIMARY KEY AUTOINCREMENT,
    咨询日期 DATETIME NOT NULL,
    学员姓名 VARCHAR(50) NOT NULL,
    性别 VARCHAR(10),
    年龄 VARCHAR(10),
    状态 VARCHAR(20),
    需求 TEXT,
    关注点 TEXT,
    抗拒点 TEXT,
    陪同人 VARCHAR(50),
    决策人 VARCHAR(50),
    记录类型 VARCHAR(20) NOT NULL,
    关联预案ID INTEGER,
    咨询步骤内容 JSON,
    自我总结 TEXT,
    领导指正 TEXT,
    创建人ID INTEGER,
    创建人姓名 VARCHAR(50),
    校区 VARCHAR(50),
    创建时间 DATETIME DEFAULT CURRENT_TIMESTAMP,
    更新时间 DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (关联预案ID) REFERENCES 当面标准化检查表(记录ID)
);

-- 当面标准化模板配置
CREATE TABLE 当面标准化模板配置 (
    模板ID INTEGER PRIMARY KEY AUTOINCREMENT,
    模板名称 VARCHAR(100) NOT NULL,
    模板类型 VARCHAR(20) NOT NULL,
    咨询步骤配置 JSON NOT NULL,
    基本信息字段配置 JSON,
    是否启用 INTEGER DEFAULT 1,
    是否默认 INTEGER DEFAULT 0,
    排序序号 INTEGER DEFAULT 0,
    备注 TEXT,
    创建人ID INTEGER,
    创建人姓名 VARCHAR(50),
    校区 VARCHAR(50),
    创建时间 DATETIME DEFAULT CURRENT_TIMESTAMP,
    更新时间 DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 权限控制

建议设置以下权限：

- 普通用户：创建、查看、编辑自己的记录
- 组长/主管：查看组内所有记录，添加领导指正
- 管理员：管理模板配置，查看所有记录

## 扩展建议

1. **数据统计**
   - 统计各步骤的完成率
   - 分析转化率和成功因素
   - 生成个人和团队报表

2. **智能建议**
   - 根据历史数据提供话术建议
   - 自动识别常见抗拒点并给出应对策略

3. **协作功能**
   - 支持多人协作编辑
   - 评论和反馈功能
   - @提醒功能

4. **移动端适配**
   - 响应式设计
   - 移动端快捷编辑
   - 离线模式支持

## 注意事项

1. **数据备份**：定期备份重要的沟通记录
2. **隐私保护**：注意保护学员隐私信息
3. **模板更新**：更新模板时注意兼容性
4. **性能优化**：大量数据时注意分页和索引优化

## 技术支持

如有问题，请联系技术支持团队。
