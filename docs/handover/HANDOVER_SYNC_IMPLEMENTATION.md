# 咨询系统与教质系统数据联动实现总结

## 功能概述

实现了咨询量录入系统与教质部系统的数据自动联动：

1. **交接同步**：咨询量交接并分配班级后，自动同步到教质部「当月新生维稳明细表」
2. **欠费同步**：如有欠费，自动同步到「新生仍欠费明细表」
3. **缴费更新同步**：缴费信息更新后，自动同步到教质部相关表
4. **缴清移除**：学生缴清欠费后，自动从欠费明细表移除

## 字段映射关系

### 咨询量明细表 → 当月新生维稳明细表

| 咨询量明细表字段 | 当月新生维稳明细表字段 | 说明 |
|---|---|---|
| 咨询者姓名 | 新生姓名 | 必填 |
| 报名时间 | 报名时间 | 格式 YYYY-MM-DD |
| 报名专业 | 报名专业 | |
| 长期短期 | 报名学制 | |
| 咨询师 | 咨询师 | |
| 校区 | 校区名称 | 去掉"校区"后缀 |
| 全款 (0/1) | 是否全款 (是/否) | |
| 贷款 (0/1) | 是否贷款 (是/否) | |
| 是否退费 (0/1) | 是否退费 (是/否) | |
| 退费原因 | 退费情况说明 | |
| (分配班主任) | 班主任姓名 | 来自交接记录 |

### 缴费记录表 → 当月新生维稳明细表

| 缴费记录表字段 | 当月新生维稳明细表字段 | 说明 |
|---|---|---|
| 应交金额 | 应收学费 | |
| 首款金额 | 报名交费金额 | |
| 欠费金额 | 仍欠费金额 | |
| (计算: 欠费=0且已交>0) | 是否全款 | 自动计算 |

### 自动生成/教质部填写的字段

以下字段由教质部手动填写，交接同步时保留空值或教质部已填值：
- 报道时间
- 是否过课时
- 试学周期
- 教员
- 是否住宿
- 宿舍名
- 补款金额（后续补交）

## 新增文件

### 1. 数据同步服务
[backend/app/services/handover_sync_service.py](backend/app/services/handover_sync_service.py)

核心函数：
- `sync_to_stability_detail()` - 同步到当月新生维稳明细表
- `sync_to_arrears_detail()` - 同步到新生仍欠费明细表
- `sync_handover_to_teaching_quality()` - 完整交接同步流程
- `update_payment_sync()` - 缴费更新后同步
- `remove_from_arrears_detail()` - 缴清后移除欠费记录

## 修改的文件

### 1. 交接API
[backend/app/api/v1/endpoints/consult/handover.py](backend/app/api/v1/endpoints/consult/handover.py)

改动：
- `assign_class()` - 添加同步触发
- `batch_assign_class()` - 添加批量同步触发
- 新增 `sync_handover_to_tq()` - 手动同步单条
- 新增 `batch_sync_handover_to_tq()` - 批量同步历史数据

### 2. 缴费API
[backend/app/api/v1/endpoints/consult/payment_record.py](backend/app/api/v1/endpoints/consult/payment_record.py)

改动：
- `set_payment_amount()` - 添加同步触发
- `set_first_payment()` - 添加同步触发
- `add_subsequent_payment()` - 添加同步触发

## 新增API接口

### 手动同步单条交接记录
```http
POST /api/v1/consult/handover/sync/{handover_id}
```

### 批量同步历史数据
```http
POST /api/v1/consult/handover/batch-sync?校区=盛邦
```

## 触发时机

1. **交接分配班级时**
   - 调用 `/handover/assign-class` 或 `/handover/batch-assign`
   - 自动同步到维稳明细表
   - 如有欠费，同步到欠费明细表

2. **缴费信息更新时**
   - 设置应交金额 `/payment/amount/{record_id}`
   - 设置首款 `/payment/first-payment/{record_id}`
   - 添加后续缴费 `/payment/subsequent/{record_id}`
   - 自动更新维稳明细表的缴费字段
   - 有欠费则更新/插入欠费明细表
   - 无欠费则从欠费明细表移除

3. **手动触发**
   - 单条：`POST /consult/handover/sync/{handover_id}`
   - 批量：`POST /consult/handover/batch-sync?校区=xxx`

## 同步规则

1. **幂等性**：同一学生重复同步只会更新，不会重复插入
2. **保护已填数据**：同步只更新可自动获取的字段，不覆盖教质部已手动填写的字段
3. **年月归属**：使用报名时间的年月作为归属月份
4. **校区规范化**：自动去掉"校区"后缀统一格式

## 测试验证

1. 在咨询系统创建报名记录并交接
2. 在教质部分配班级
3. 检查「当月新生维稳明细表」是否有新数据
4. 如有欠费，检查「新生仍欠费明细表」
5. 在咨询系统更新缴费信息
6. 检查教质部表的缴费字段是否更新
7. 缴清后检查是否从欠费明细表移除

## 注意事项

1. 只有**已分配**状态的交接记录才会同步
2. 未交接的记录不会同步（缴费更新会检查交接状态）
3. 批量同步可能较慢，建议按校区分批执行
4. 同步失败不影响主操作（交接/缴费）的成功
