# 日志系统设计与使用说明

本文档说明当前系统的审计日志模块设计、数据结构、接口使用与接入方式，帮助前端筛选“哪个用户、什么时间、操作了哪些数据”。

---

## 1. 目标与范围

日志系统用于审计和追溯用户行为，重点解决以下问题：

1. **谁**：用户ID、用户名、IP、UA
2. **何时**：时间戳、耗时
3. **在哪**：接口路径、HTTP方法、模块
4. **做了什么**：动作编码、动作名称
5. **操作了哪些数据**：表/记录ID/业务主键、变更前后

---

## 2. 总体架构

日志系统分为两层：

- **事件日志（public.logs）**：记录一次操作事件（用户、时间、接口、结果、动作）
- **数据映射（public.log_resources）**：记录一次事件涉及的具体表/记录/变更明细

关系：一条 `logs` 可关联多条 `log_resources`。

---

## 3. 数据表结构（public schema）

### 3.1 事件表：`public.logs`

关键字段：

- `id`：主键（BigInt）
- `ts`：事件时间（timestamptz）
- `user_id` / `username`：用户身份
- `action` / `action_display` / `action_category`：动作编码、中文名称、类别
- `module`：模块名（如 academic）
- `endpoint` / `method` / `status_code` / `latency_ms`
- `ip` / `user_agent`
- `request_id`：链路ID（可从 `X-Request-Id` 透传）
- `success` / `error_message`
- `resource_summary`：JSONB，涉及表与记录摘要
- `extra`：JSONB，扩展字段（筛选条件、按钮名等）

### 3.2 映射表：`public.log_resources`

关键字段：

- `log_id`：关联 `logs.id`
- `schema_name` / `table_name`
- `record_id` / `record_pk` / `biz_key`
- `op`：操作类型（CREATE/UPDATE/DELETE 等）
- `before` / `after` / `diff`：字段级变更
- `sensitivity_level`：敏感级别（0/1/2）

---

## 4. 写日志的流程

### 4.1 中间件自动记录

已在 `backend/main.py` 中注册 `AuditLogMiddleware`：

- 自动记录请求（路径、方法、耗时、状态码、IP）
- 自动识别用户（从 `request.state.user_id/username`）
- 写入 `public.logs`

注意：中间件默认排除 `docs/redoc/openapi/health` 等路径。

### 4.2 业务接口补充“操作了哪些数据”

业务接口通过 `AuditLogger` 添加资源映射：

```python
from app.logs.context import get_audit_logger
from app.logs.diff import build_diff

@router.post(...)
def save(..., audit_logger: AuditLogger = Depends(get_audit_logger)):
    audit_logger.set_action(
        action="academic.staff-performance-reward.upsert",
        action_display="保存教员业绩奖惩表",
        action_category="write",
        module="academic",
    )
    audit_logger.add_resource(
        {
            "schema_name": "academic",
            "table_name": "campus_academic_staff_performance_reward",
            "record_id": str(obj.id),
            "record_pk": {"campus": campus, "year": year, "month": month, "tab": tab},
            "op": "UPDATE",
            "before": before_snapshot,
            "after": after_snapshot,
            "diff": build_diff(before_snapshot, after_snapshot),
        }
    )
```

关键点：

- `set_action()` 用于记录动作语义
- `add_resource()` 用于记录变更对象
- `build_diff()` 生成字段差异

---

## 5. 查询日志 API

已提供查询接口，供前端筛选：

### 5.1 列表查询

```
GET /api/v1/logs
```

支持参数：

- `user_id` / `username`
- `start_time` / `end_time`
- `action` / `action_category` / `module`
- `table_name` / `record_id`
- `success`
- `limit` / `offset`
- `include_resources`（是否返回资源映射明细）

### 5.2 单条查询

```
GET /api/v1/logs/{log_id}?include_resources=true
```

---

## 6. 前端使用方式

前端已提供 service：

```
frontend/services/auditLog.ts
```

示例：

```ts
import { listAuditLogs } from '@/services/auditLog'

const res = await listAuditLogs({
  username: 'admin',
  start_time: '2025-12-01T00:00:00Z',
  end_time: '2025-12-31T23:59:59Z',
  table_name: 'campus_academic_staff_performance_reward',
})
```

---

## 7. 系统会做哪些事情

1. 记录每一次 API 请求（成功/失败）
2. 记录用户身份、接口路径、耗时
3. 记录业务动作（action/action_display）
4. 记录具体变更的表/记录/字段差异（如业务代码调用）
5. 返回可筛选的日志列表供前端展示

---

## 8. 安全与合规建议

- 对敏感字段使用 `sensitivity_level=2` 并限制查看权限
- 日志表建议“只写不改”，禁止 UPDATE/DELETE
- 可按月归档（后续扩展）

---

## 9. 常见问题

### Q1: 为什么日志中没有具体数据变更？
需要在对应接口中调用 `AuditLogger.add_resource()`。

### Q2: 为什么用户名为空？
必须确保登录后 `request.state.username` 被写入（已在安全中间件中处理）。

### Q3: 日志写入失败会影响业务吗？
不会。日志写入失败会被吞掉，不影响主业务流程。

---

## 10. 对应代码位置

- 中间件：`backend/app/logs/middleware.py`
- 日志写入：`backend/app/logs/service.py`
- 接口查询：`backend/app/api/v1/endpoints/audit_log.py`
- 数据模型：`backend/app/models/audit_log.py`
- 前端服务：`frontend/services/auditLog.ts`
