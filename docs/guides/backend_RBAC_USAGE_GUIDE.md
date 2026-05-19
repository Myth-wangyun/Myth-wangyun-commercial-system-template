# RBAC 权限系统使用指南

## 概述

本系统实现了完整的基于角色的访问控制(RBAC)，支持三级数据范围：
- **all**: 全部数据（董事长、学术总监）
- **campus**: 本校区数据（校长、学术经理、学术副经理）
- **self**: 仅自己的数据（学术教员在特定表格中）

## 数据范围规则

| 角色 | 数据范围 | 说明 |
|------|---------|------|
| 董事长 | all | 可访问所有校区所有数据 |
| 学术总监 | all | 可访问所有校区所有数据 |
| 校长 | campus | 只能访问本校区数据 |
| 学术经理 | campus | 只能访问本校区数据 |
| 学术副经理 | campus | 只能访问本校区数据 |
| 学术教员 | self/campus | 部分表格只能看自己，其他表格看本校区 |

### 学术教员的特殊权限

学术教员在以下表格中只能访问**自己的数据**：
- 教员课时统计表 (`academic.teacher.hours`)
- 教员KPI计划表 (`academic.teacher.kpi`)
- 教员日工单 (`academic.teacher.daily`)

学术教员**无法访问**以下表格：
- 教员奖惩表 (`academic.teacher.reward`)
- 教员课时汇总表 (`academic.teacher.hours_summary`)
- 教员压面表 (`academic.teacher.interview`)
- 教员分析表 (`academic.teacher.analysis`)
- 管理中心核心业务数据汇总 (`academic.core_dashboard`)
- 企业文化宣讲/考试 (`academic.enterprise_culture`)

## 在API中使用权限控制

### 1. 导入必要的模块

```python
from ....core.permissions import require_permission, PermissionContext
```

### 2. 在路由函数中添加权限依赖

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ....core.database import get_db
from ....core.permissions import require_permission, PermissionContext

router = APIRouter()

@router.get("/some-endpoint")
def get_data(
    campus: str = Query(..., description="校区名称"),
    db: Session = Depends(get_db),
    perm_ctx: PermissionContext = Depends(require_permission("academic.some.view")),
):
    # perm_ctx 包含:
    # - perm_ctx.user: 当前用户对象
    # - perm_ctx.data_scope: 数据范围 (all/campus/self)
    # - perm_ctx.campus: 用户所属校区 (如果data_scope不是all)
    # - perm_ctx.user_id: 用户ID
    
    # 数据范围检查...
```

### 3. 应用数据范围过滤

#### 方式1: 手动检查（推荐用于参数过滤）

```python
@router.get("/data")
def get_data(
    campus: str = Query(...),
    teacher_name: str = Query(None),
    perm_ctx: PermissionContext = Depends(require_permission("academic.teacher.hours.view")),
):
    # 校区级权限：只能查看本校区
    if perm_ctx.data_scope == "campus":
        if perm_ctx.campus and campus != perm_ctx.campus:
            raise HTTPException(
                status_code=403,
                detail=f"您只能查看 {perm_ctx.campus} 校区的数据"
            )
    
    # 个人级权限：只能查看自己
    elif perm_ctx.data_scope == "self":
        if teacher_name != perm_ctx.user.real_name:
            raise HTTPException(
                status_code=403,
                detail="您只能查看自己的数据"
            )
        # 同时限制校区
        if perm_ctx.campus and campus != perm_ctx.campus:
            raise HTTPException(
                status_code=403,
                detail=f"您只能查看 {perm_ctx.campus} 校区的数据"
            )
    
    # 执行查询...
```

#### 方式2: 使用数据过滤器（用于SQLAlchemy查询）

```python
from ....core.permissions import data_scope_filter
from ....models.some_model import SomeModel

@router.get("/data")
def get_data(
    db: Session = Depends(get_db),
    perm_ctx: PermissionContext = Depends(require_permission("academic.some.view")),
):
    # 构建基础查询
    query = db.query(SomeModel)
    
    # 应用数据范围过滤
    query = data_scope_filter.apply_filter(
        query=query,
        user=perm_ctx.user,
        data_scope=perm_ctx.data_scope,
        model_class=SomeModel,
        campus_field="campus",  # 校区字段名
        user_field="user_id"     # 用户字段名（用于self范围）
    )
    
    # 执行查询
    results = query.all()
    return results
```

#### 方式3: 结果过滤（用于JSONB数据）

```python
@router.get("/data")
def get_data(
    campus: str = Query(...),
    year: int = Query(...),
    month: int = Query(...),
    db: Session = Depends(get_db),
    perm_ctx: PermissionContext = Depends(require_permission("academic.teacher.kpi.view")),
):
    # 先检查校区权限
    if perm_ctx.data_scope == "campus":
        if perm_ctx.campus and campus != perm_ctx.campus:
            raise HTTPException(status_code=403, detail="无权访问该校区")
    
    # 查询数据
    entries = crud.list_data(db, campus, year, month)
    
    # 如果是self范围，过滤结果只保留自己的数据
    if perm_ctx.data_scope == "self":
        entries = [
            entry for entry in entries
            if entry.get("teacher_name") == perm_ctx.user.real_name
        ]
    
    return entries
```

## 权限代码命名规范

权限代码格式：`{module}.{resource}.{sub_resource}.{action}`

示例：
- `academic.teacher.hours.view` - 查看教员课时统计
- `academic.teacher.hours.edit` - 编辑教员课时统计
- `academic.core_dashboard.view` - 查看核心业务数据
- `academic.enterprise_culture.presentation.view` - 查看企业文化宣讲

## 常见场景

### 场景1: 列表查询（带校区参数）

```python
@router.get("/list")
def list_items(
    campus: str = Query(...),
    db: Session = Depends(get_db),
    perm_ctx: PermissionContext = Depends(require_permission("academic.some.view")),
):
    # 检查校区权限
    if perm_ctx.data_scope == "campus" and perm_ctx.campus != campus:
        raise HTTPException(status_code=403, detail="无权访问该校区")
    
    # 查询数据
    items = db.query(Model).filter(Model.campus == campus).all()
    return items
```

### 场景2: 单条记录查询（需要验证所有者）

```python
@router.get("/{item_id}")
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    perm_ctx: PermissionContext = Depends(require_permission("academic.some.view")),
):
    item = db.query(Model).filter(Model.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    # 检查权限
    if perm_ctx.data_scope == "campus":
        if perm_ctx.campus and item.campus != perm_ctx.campus:
            raise HTTPException(status_code=403, detail="无权访问该数据")
    elif perm_ctx.data_scope == "self":
        if item.user_id != perm_ctx.user_id:
            raise HTTPException(status_code=403, detail="无权访问他人数据")
    
    return item
```

### 场景3: 创建/更新操作（需要验证权限）

```python
@router.post("/")
def create_item(
    payload: ItemCreate,
    db: Session = Depends(get_db),
    perm_ctx: PermissionContext = Depends(require_permission("academic.some.edit")),
):
    # 检查校区权限
    if perm_ctx.data_scope == "campus":
        if perm_ctx.campus and payload.campus != perm_ctx.campus:
            raise HTTPException(status_code=403, detail="只能在本校区创建数据")
    elif perm_ctx.data_scope == "self":
        # 确保只能为自己创建
        if payload.user_id != perm_ctx.user_id:
            raise HTTPException(status_code=403, detail="只能为自己创建数据")
    
    # 创建记录
    item = Model(**payload.dict())
    db.add(item)
    db.commit()
    return item
```

## 测试权限

### 测试不同角色的访问

1. 使用董事长账号（user_id=193, username=wangye）
   - 应该能访问所有校区的所有数据

2. 使用学术总监账号（user_id=4, username=dupengta）
   - 应该能访问所有校区的所有数据

3. 使用校长账号（任一副校长）
   - 只能访问自己校区的数据
   - 尝试访问其他校区应该返回403

4. 使用学术教员账号（任一讲师）
   - 在教员课时统计、KPI表中只能看到自己的数据
   - 尝试查看他人数据应该返回403

### 验证数据范围

```python
# 检查用户的数据范围
from app.core.permissions import data_scope_filter
from app.core.database import SessionLocal

db = SessionLocal()
scope = data_scope_filter.get_user_data_scope(
    db, 
    user, 
    "academic.teacher.hours.view"
)
print(f"数据范围: {scope}")  # all / campus / self
```

## 注意事项

1. **所有需要数据保护的API端点都必须添加权限检查**
2. **校区字段必须在数据库中存在**（users表的campus字段）
3. **没有校区信息的用户（campus=None）**:
   - 如果是董事长/学术总监角色：可以访问所有数据
   - 如果是其他角色：应该返回空结果或403错误
4. **前端也需要同步更新**，根据用户权限隐藏/显示相应的菜单和功能
5. **日志记录**：建议记录所有权限拒绝事件，便于审计

## 更新现有API

对于现有的API端点，需要：

1. 添加 `perm_ctx: PermissionContext = Depends(require_permission("xxx"))` 参数
2. 添加数据范围检查逻辑
3. 测试各种角色的访问情况
4. 更新API文档

示例见：
- `app/api/v1/endpoints/teacher_hour_stats.py`
- `app/api/v1/endpoints/teacher_kpi.py`
