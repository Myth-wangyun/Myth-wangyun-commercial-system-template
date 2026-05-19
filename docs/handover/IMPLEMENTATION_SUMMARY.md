# 003表和007表计划数据同步功能实现总结

## 实现日期
2026-02-06

## 需求概述

实现003校区各咨询师数据汇总表与007财务收入和退费表的计划数据同步功能,确保:

1. **数据映射关系**:
   - 003表的网络 = 007表的 SEM + 合作伙伴 + 市场口碑 + 免费推广 + 新媒体
   - 003表的渠道 = 007表的渠道
   - 003表的口碑 = 007表的口碑

2. **数据独立性**:
   - 各TAB第一个子表(核心数据汇总)与007 TAB2强相关,数据同步
   - 各TAB第二个子表(年度核心数据看板)和第三个子表(月度核心数据看板)自成一派,单独存储和汇总
   - 子表2和3不再与子表1有数据联系

3. **计划数据聚合**:
   - 网络/渠道/口碑的第三个子表(月度看板)的计划收入汇总到第二个子表(年度看板)
   - 并且汇总到第一个TAB(总表)的第二和第三个子表

## 后端实现 (backend/app/api/v1/endpoints/consult/consultant_data_summary_v3.py)

### 1. 新增辅助函数

#### `_get_plan_data_by_type(db, campus, year, data_type)` (第609-628行)
- 功能: 按数据类型(网络/渠道/口碑)获取计划数据
- 返回: `{(咨询师, 月份): {计划收入, 计划招生}}`
- 用途: 为Tab2/3/4的子表2和3提供独立的计划数据

#### `_get_subtable1_plan_data(db, campus, year, data_type)` (第631-651行)
- 功能: 从`consult.校区月度财务数据`表读取子表1的计划数据
- 返回: `{月份: {计划收入, 计划招生}}`
- 用途: 为Tab2/3/4的子表1提供与007 TAB2同源的计划数据

#### `_sync_to_financial(db, campus, year, month, data_type, plan_income, plan_enrollment)` (第654-685行)
- 功能: 将003表子表1的计划数据同步到007表的`consult.校区月度财务数据`
- 映射关系:
  - 网络 → SEM (可扩展为多个子类型)
  - 渠道 → 渠道
  - 口碑 → 口碑

### 2. 数据加载逻辑更新 (第710-775行)

```python
# 分类型计划数据(用于各TAB子表2&3独立计划)
plan_network = _get_plan_data_by_type(db, campus, year, "网络_咨询师")
plan_channel = _get_plan_data_by_type(db, campus, year, "渠道_咨询师")
plan_koubei = _get_plan_data_by_type(db, campus, year, "口碑_咨询师")

# 子表1计划数据(来自校区月度财务数据,与007 TAB2同源)
network_sub_types = ["SEM", "新媒体", "市场口碑", "网络合作伙伴"]
subtable1_plan_network_merged = {...}  # 合并所有网络子类型
subtable1_plan_channel = _get_subtable1_plan_data(db, campus, year, "渠道")
subtable1_plan_koubei = _get_subtable1_plan_data(db, campus, year, "口碑")

# 各TAB子表1计划数据月度汇总
network_plan_month_totals = {...}
channel_plan_month_totals = {...}
koubei_plan_month_totals = {...}
```

### 3. Tab1(总表)数据聚合 (第780-792行)

```python
# Tab1子表2和3: 计划数据从三个类型汇总
for c in all_consultants:
    for m in range(1, 13):
        p_net = plan_network.get((c, m), {})
        p_ch = plan_channel.get((c, m), {})
        p_kb = plan_koubei.get((c, m), {})
        bucket["计划收入"] = (
            float(p_net.get("计划收入", 0)) +
            float(p_ch.get("计划收入", 0)) +
            float(p_kb.get("计划收入", 0))
        )
        bucket["计划招生"] = (
            int(p_net.get("计划招生", 0)) +
            int(p_ch.get("计划招生", 0)) +
            int(p_kb.get("计划招生", 0))
        )
```

### 4. Tab2(网络)计划数据引用更新

- **子表1** (第848-850行): 使用`network_plan_month_totals`(来自007表)
- **子表2** (第906-908行): 使用`plan_network`(独立存储)
- **子表3** (第1050-1052行): 使用`plan_network`(独立存储)

### 5. Tab3(渠道)计划数据引用更新

- **子表1** (第1134-1136行): 使用`channel_plan_month_totals`(来自007表)
- **子表2** (第1164-1166行): 使用`plan_channel`(独立存储)
- **子表3** (第1245-1247行): 使用`plan_channel`(独立存储)

### 6. Tab4(口碑)计划数据引用更新

- **子表1** (第1317-1318行): 使用`koubei_plan_month_totals`(来自007表)
- **子表2** (第1372-1374行): 使用`plan_koubei`(独立存储)
- **子表3** (第1512-1514行): 使用`plan_koubei`(独立存储)

### 7. save-plan端点更新 (第1724-1803行)

```python
@router.post("/save-plan")
async def save_plan_data_v3(data: Dict[str, Any], ...):
    """
    保存计划数据并同步到007表

    参数:
    - data_type: "网络"/"渠道"/"口碑" (默认"汇总")
    - sub_table: 1/2/3 (1=子表1核心数据汇总, 2=子表2年度看板, 3=子表3月度看板)
    """
    # 根据子表类型确定数据类型标识
    if sub_table == 1:
        type_key = data_type  # 网络/渠道/口碑
    else:
        type_key = f"{data_type}_咨询师"  # 网络_咨询师/渠道_咨询师/口碑_咨询师

    # 保存到 consult.咨询师月度计划数据
    # ...

    # 如果是子表1的数据,同步到007表
    if sub_table == 1:
        _sync_to_financial(db, campus, year, month, data_type, plan_income, plan_enrollment)
```

## 前端实现

### 1. 类型定义更新 (frontend/services/consult/consultantDataSummaryV3.ts:199-209行)

```typescript
export interface SavePlanRequest {
  campus: string
  year: number
  month: number
  consultant: string
  plan_income?: number
  plan_enrollment?: number
  data_type?: string  // 网络/渠道/口碑
  sub_table?: number  // 1=子表1核心数据汇总, 2=子表2年度看板, 3=子表3月度看板
}
```

## 数据库表结构

### consult.咨询师月度计划数据
- 需要包含`数据类型`字段,用于区分不同类型的计划数据
- 数据类型值:
  - `网络` / `渠道` / `口碑`: 子表1的数据
  - `网络_咨询师` / `渠道_咨询师` / `口碑_咨询师`: 子表2和3的数据

### consult.校区月度财务数据
- 需要包含`数据类型`字段
- 数据类型值: `SEM`, `新媒体`, `市场口碑`, `网络合作伙伴`, `渠道`, `口碑`

## 数据流图

```
用户编辑计划数据
    ↓
前端调用 save-plan API (带 data_type 和 sub_table 参数)
    ↓
后端保存到 consult.咨询师月度计划数据
    ↓
如果是子表1 (sub_table=1)
    ↓
同步到 consult.校区月度财务数据 (007表)
    ↓
前端刷新数据时:
  - Tab1总表: 聚合网络+渠道+口碑的咨询师计划数据
  - Tab2/3/4子表1: 从007表读取
  - Tab2/3/4子表2和3: 从各自类型的独立计划数据读取
```

## 关键特性

1. **数据独立性**: 子表1、子表2、子表3的计划数据完全独立存储
2. **自动同步**: 子表1的数据自动同步到007表
3. **自动聚合**: Tab1总表自动聚合所有类型的计划数据
4. **类型隔离**: 通过`数据类型`字段区分不同来源和用途的计划数据

## 测试建议

1. **单元测试**: 测试各个辅助函数的数据加载和同步逻辑
2. **集成测试**: 测试save-plan端点的完整流程
3. **数据一致性测试**: 验证003表和007表的数据同步是否正确
4. **聚合测试**: 验证Tab1总表的数据聚合是否正确

## 注意事项

1. 确保数据库表包含`数据类型`字段
2. 前端页面需要在调用save-plan时传递正确的`data_type`和`sub_table`参数
3. 网络类型的子表1数据会同步到007表的SEM类型(可根据需要扩展到其他子类型)
4. 所有计划数据的修改都应该通过save-plan端点,以确保数据同步

## 后续工作

1. 前端页面集成: 更新003页面的编辑逻辑,传递正确的参数
2. 数据迁移: 如果有历史数据,需要迁移到新的数据结构
3. 测试验证: 在开发环境中测试完整的数据流
4. 文档更新: 更新用户文档,说明新的数据关系
