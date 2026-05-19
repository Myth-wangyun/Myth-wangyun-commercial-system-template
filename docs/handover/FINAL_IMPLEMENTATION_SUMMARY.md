# 003表和007表计划数据同步功能 - 最终实现总结

## 实现日期
2026-02-06

## 核心设计理念

**简化原则**: 利用现有的007页面Tab3计划数据编辑功能,003页面只负责读取和聚合展示,避免重复开发。

## 数据流架构

```
用户在007页面Tab3编辑计划数据
    ↓
保存到 consult.咨询师月度计划数据
    (数据类型: SEM/新媒体/市场口碑/合作伙伴/渠道/口碑等)
    ↓
003页面读取时自动聚合:
    - 网络 = SEM + 新媒体 + 市场口碑 + 合作伙伴 + 免费推广
    - 渠道 = 渠道
    - 口碑 = 口碑
    ↓
003页面展示聚合后的数据
```

## 后端实现详情

### 文件: backend/app/api/v1/endpoints/consult/consultant_data_summary_v3.py

#### 1. 数据读取逻辑 (第710-728行)

```python
# 网络类型: 聚合SEM+新媒体+市场口碑+合作伙伴+免费推广
network_types = ["SEM", "新媒体", "市场口碑", "合作伙伴", "免费推广"]
plan_network: Dict = {}
for nt in network_types:
    nt_data = _get_plan_data_by_type(db, campus, year, nt)
    for key, value in nt_data.items():
        if key not in plan_network:
            plan_network[key] = {"计划收入": 0, "计划招生": 0}
        plan_network[key]["计划收入"] += float(value.get("计划收入", 0))
        plan_network[key]["计划招生"] += int(value.get("计划招生", 0))

# 渠道和口碑直接读取对应类型
plan_channel = _get_plan_data_by_type(db, campus, year, "渠道")
plan_koubei = _get_plan_data_by_type(db, campus, year, "口碑")
```

**关键点**:
- 网络类型通过聚合多个子类型实现
- 渠道和口碑直接映射
- 返回格式: `{(咨询师, 月份): {计划收入, 计划招生}}`

#### 2. 子表1数据读取 (第715-728行)

```python
# 从校区月度财务数据读取各网络子类型并汇总
network_sub_types = ["SEM", "新媒体", "市场口碑", "网络合作伙伴"]
subtable1_plan_network_merged: Dict[int, Dict] = {
    m: {"计划收入": 0.0, "计划招生": 0} for m in range(1, 13)
}
for nst in network_sub_types:
    nst_plan = _get_subtable1_plan_data(db, campus, year, nst)
    for m, p in nst_plan.items():
        subtable1_plan_network_merged[m]["计划收入"] += p.get("计划收入", 0)
        subtable1_plan_network_merged[m]["计划招生"] += int(p.get("计划招生", 0))
```

**关键点**:
- 子表1数据从`consult.校区月度财务数据`读取(与007 TAB2同源)
- 网络类型需要合并多个子类型
- 返回格式: `{月份: {计划收入, 计划招生}}`

#### 3. Tab1(总表)数据聚合 (第780-792行)

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

**关键点**:
- Tab1总表自动聚合网络+渠道+口碑三个类型的数据
- 每个咨询师每个月的计划数据都是三类型的总和

#### 4. Tab2/3/4各子表的计划数据引用

**Tab2(网络)**:
- 子表1 (第848-850行): 使用`network_plan_month_totals`(来自校区月度财务数据)
- 子表2 (第906-908行): 使用`plan_network`(聚合SEM等子类型)
- 子表3 (第1050-1052行): 使用`plan_network`

**Tab3(渠道)**:
- 子表1 (第1134-1136行): 使用`channel_plan_month_totals`(来自校区月度财务数据)
- 子表2 (第1164-1166行): 使用`plan_channel`
- 子表3 (第1245-1247行): 使用`plan_channel`

**Tab4(口碑)**:
- 子表1 (第1317-1318行): 使用`koubei_plan_month_totals`(来自校区月度财务数据)
- 子表2 (第1372-1374行): 使用`plan_koubei`
- 子表3 (第1512-1514行): 使用`plan_koubei`

## 前端实现详情

### 文件: frontend/services/consult/consultantDataSummaryV3.ts

#### SavePlanRequest接口更新 (第199-209行)

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

**注意**: 此接口保留用于向后兼容,实际编辑功能在007页面Tab3实现。

### 007页面Tab3 - 计划数据编辑

**文件**: frontend/pages/consult/004mgmt-data/007-financial-income/Tab3ConsultantPlanSetting.tsx

**功能**:
- 按校区、年份、数据类型(SEM/新媒体/渠道/口碑等)编辑计划数据
- 使用`/consult/consultant-plan/batch`接口批量保存
- 支持12个月的计划收入和计划招生编辑

**保存逻辑** (第322-362行):
```typescript
const handleSave = async () => {
  // 收集所有咨询师的12个月数据
  const plans: ConsultantMonthlyPlan[] = []
  for (const row of consultantRows) {
    for (let m = 1; m <= 12; m++) {
      const monthData = row.months[m]
      if (monthData.计划收入 !== null || monthData.计划招生 !== null) {
        plans.push({
          年份: parseInt(year),
          月份: m,
          校区: campusForApi,
          咨询师: row.咨询师,
          数据类型: dataType,  // SEM/新媒体/渠道/口碑等
          计划收入: monthData.计划收入,
          计划招生: monthData.计划招生,
        })
      }
    }
  }
  await batchSaveConsultantPlans(plans)
}
```

### 003页面 - 纯展示

**文件**: frontend/pages/consult/002-campus-yearly-monthly-media-source/003-consultant-data-summary-v3/index.tsx

**功能**:
- 只读展示,不提供编辑功能
- 调用`getV3FullData`接口获取聚合后的数据
- 自动展示网络(聚合)、渠道、口碑三个维度的数据

## 数据库表结构

### consult.咨询师月度计划数据

**关键字段**:
- `校区`: 校区名称
- `年份`: 年份
- `月份`: 月份(1-12)
- `咨询师`: 咨询师姓名
- `数据类型`: **SEM/新媒体/市场口碑/合作伙伴/渠道/口碑等**
- `计划收入`: 计划收入金额
- `计划招生`: 计划招生人数

**数据类型说明**:
- 使用007页面Tab3的数据类型标准
- 003页面读取时自动聚合为网络/渠道/口碑三大类

### consult.校区月度财务数据

**关键字段**:
- `校区`: 校区名称
- `年份`: 年份
- `月份`: 月份(1-12)
- `数据类型`: SEM/新媒体/渠道/口碑等
- `计划收入`: 计划收入金额
- `计划招生`: 计划招生人数

**用途**:
- 003表子表1的计划数据来源
- 与007 TAB2共享数据

## 数据映射关系

### 003表 → 007表数据类型映射

| 003表类型 | 007表数据类型 |
|----------|-------------|
| 网络 | SEM + 新媒体 + 市场口碑 + 合作伙伴 + 免费推广 |
| 渠道 | 渠道 |
| 口碑 | 口碑 |

### 子表数据来源

| 页面 | 子表 | 数据来源 | 数据类型 |
|------|------|---------|---------|
| Tab1总表 | 子表1 | 聚合所有类型 | 所有 |
| Tab1总表 | 子表2 | 聚合网络+渠道+口碑 | 咨询师级别 |
| Tab1总表 | 子表3 | 聚合网络+渠道+口碑 | 咨询师级别 |
| Tab2网络 | 子表1 | 校区月度财务数据 | SEM等网络子类型 |
| Tab2网络 | 子表2 | 咨询师月度计划数据 | SEM等网络子类型 |
| Tab2网络 | 子表3 | 咨询师月度计划数据 | SEM等网络子类型 |
| Tab3渠道 | 子表1 | 校区月度财务数据 | 渠道 |
| Tab3渠道 | 子表2 | 咨询师月度计划数据 | 渠道 |
| Tab3渠道 | 子表3 | 咨询师月度计划数据 | 渠道 |
| Tab4口碑 | 子表1 | 校区月度财务数据 | 口碑 |
| Tab4口碑 | 子表2 | 咨询师月度计划数据 | 口碑 |
| Tab4口碑 | 子表3 | 咨询师月度计划数据 | 口碑 |

## 使用流程

### 1. 编辑计划数据

1. 打开007页面 → Tab3(各校区各咨询师各月份计划收入表)
2. 选择年份和校区
3. 选择数据类型(SEM/新媒体/渠道/口碑等)
4. 编辑各咨询师的12个月计划收入和计划招生
5. 点击"保存"按钮

### 2. 查看聚合数据

1. 打开003页面(校区各咨询师数据汇总)
2. 选择年份和校区
3. 切换Tab查看:
   - Tab1: 总表(所有类型聚合)
   - Tab2: 网络(SEM等子类型聚合)
   - Tab3: 渠道
   - Tab4: 口碑

## 关键特性

1. **数据一致性**: 003表和007表共享同一数据源
2. **自动聚合**: 003表自动聚合007表的多个数据类型
3. **简化维护**: 只需在007页面编辑,003页面自动更新
4. **灵活展示**: 支持按不同维度(总表/网络/渠道/口碑)查看数据

## 测试建议

### 1. 数据编辑测试
- 在007页面Tab3编辑SEM类型的计划数据
- 在007页面Tab3编辑渠道类型的计划数据
- 在007页面Tab3编辑口碑类型的计划数据

### 2. 数据展示测试
- 在003页面Tab2查看网络数据,验证是否包含SEM等子类型的聚合
- 在003页面Tab3查看渠道数据
- 在003页面Tab4查看口碑数据
- 在003页面Tab1查看总表,验证是否聚合了所有类型

### 3. 数据一致性测试
- 修改007页面的计划数据
- 刷新003页面,验证数据是否同步更新
- 验证聚合计算是否正确

## 注意事项

1. **数据类型标准**: 必须使用007页面Tab3的数据类型标准(SEM/新媒体/渠道/口碑等)
2. **不要直接修改003表**: 003表是只读展示,所有编辑在007页面完成
3. **聚合逻辑**: 网络类型的聚合逻辑在后端实现,前端无需关心
4. **子表1数据**: 子表1的数据来自`校区月度财务数据`,与007 TAB2共享

## 后续优化建议

1. **性能优化**: 如果数据量大,考虑添加缓存机制
2. **数据验证**: 添加计划数据的合理性验证(如不能为负数)
3. **历史记录**: 考虑添加计划数据的修改历史记录
4. **批量导入**: 支持Excel批量导入计划数据

## 相关文件清单

### 后端文件
- `backend/app/api/v1/endpoints/consult/consultant_data_summary_v3.py` - 003表API
- `backend/app/api/v1/endpoints/consult/consultant_monthly_plan.py` - 计划数据API
- `backend/app/crud/consult/consultant_monthly_plan.py` - 计划数据CRUD
- `backend/app/models/consult/consultant_monthly_plan.py` - 计划数据模型
- `backend/app/schemas/consult/consultant_monthly_plan.py` - 计划数据Schema

### 前端文件
- `frontend/pages/consult/002-campus-yearly-monthly-media-source/003-consultant-data-summary-v3/index.tsx` - 003页面
- `frontend/pages/consult/004mgmt-data/007-financial-income/Tab3ConsultantPlanSetting.tsx` - 007页面Tab3
- `frontend/services/consult/consultantDataSummaryV3.ts` - 003表服务
- `frontend/services/consult/consultantPlan.ts` - 计划数据服务

## 总结

本次实现通过以下方式实现了003表和007表的计划数据同步:

1. **利用现有功能**: 复用007页面Tab3的编辑功能,避免重复开发
2. **后端聚合**: 在003表API中实现数据类型的自动聚合
3. **数据共享**: 两个页面共享同一数据源,确保一致性
4. **简化维护**: 只需维护一套编辑逻辑,降低维护成本

这种设计既满足了用户需求,又保持了系统的简洁性和可维护性。
