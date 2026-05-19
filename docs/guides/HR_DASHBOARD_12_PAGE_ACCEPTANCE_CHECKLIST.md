# HR 看板 12 页面原型验收清单

更新时间：2026-03-10

## 结论说明

- 本清单按 12 个页面逐页给出当前验收结论。
- 结论只使用两种状态：`完全一致` / `有差异`。
- 当前阶段不能对这 12 个页面整体宣称“全部与 Excel 原型完全一致”，因此本轮清单中没有页面被标记为 `完全一致`。
- 其中一部分页面的差异属于“明确存在的列/标签超集”，另一部分属于“主结构已基本对齐，但还缺逐 sheet、逐列的最终验收证据”，两者都先归为 `有差异`。

## 共享实现映射

- HQ / ONLINE / OFFLINE 002 年度页共用：[frontend/pages/human-resources/humanresources/hq-002-annual-dashboard/index.tsx](../../frontend/pages/human-resources/humanresources/hq-002-annual-dashboard/index.tsx)
- HQ / ONLINE / OFFLINE 003 月度页共用：[frontend/pages/human-resources/humanresources/hq-003-monthly-dashboard/index.tsx](../../frontend/pages/human-resources/humanresources/hq-003-monthly-dashboard/index.tsx)
- HQ / ONLINE / OFFLINE 004 日度页共用：[frontend/pages/human-resources/humanresources/hq-004-daily-dashboard/index.tsx](../../frontend/pages/human-resources/humanresources/hq-004-daily-dashboard/index.tsx)
- HQ / ONLINE / OFFLINE 005 员工档案页共用：[frontend/pages/human-resources/humanresources/hq-005-employee-archive/index.tsx](../../frontend/pages/human-resources/humanresources/hq-005-employee-archive/index.tsx)

## 逐页验收表

| 业务域 | 页面 | 当前实现文件 | 验收结论 | 差异点 |
|---|---|---|---|---|
| 集团总部 | 002 管理中心年度核心数据看板 | [frontend/pages/human-resources/humanresources/hq-002-annual-dashboard/index.tsx](../../frontend/pages/human-resources/humanresources/hq-002-annual-dashboard/index.tsx) | 有差异 | 1. 当前只确认主结构和后端 row shape 已对齐，尚未完成与 HQ 002 五个原型 Sheet 的逐列验收。 2. 需要继续核实 summary 与各 Tab 的列数、列名、分组是否和原型完全一致。 3. 对应原型见 [docs/guides/HR_DASHBOARD_EXCEL_PROTOTYPES.md](HR_DASHBOARD_EXCEL_PROTOTYPES.md#L663)。 |
| 集团总部 | 003 管理中心月度核心数据看板 | [frontend/pages/human-resources/humanresources/hq-003-monthly-dashboard/index.tsx](../../frontend/pages/human-resources/humanresources/hq-003-monthly-dashboard/index.tsx) | 有差异 | 1. 本轮按原型 JSON 复核后，当前人资配置、培训、薪酬福利、社保四张表头列名与 Excel 原型一致。 2. 当前未判为 `完全一致` 的原因，主要变成“还缺逐 sheet 的最终视觉验收”，而不是明确的超集列问题。 3. 后续需要继续核对汇总行文案、合并单元格观感、列宽与分组头的最终展示效果。 |
| 集团总部 | 004 管理中心日度核心数据看板 | [frontend/pages/human-resources/humanresources/hq-004-daily-dashboard/index.tsx](../../frontend/pages/human-resources/humanresources/hq-004-daily-dashboard/index.tsx) | 有差异 | 1. 当前已确认共享页、接口链路和 HQ 两个 Tab 主结构存在，但还没有完成与 HQ 004 原型两张 Sheet 的逐列勾稽验收。 2. 该页默认不展示薪酬/社保，行为由同文件行 1623 控制，需要继续与原型范围核对。 3. 对应原型见 [docs/guides/HR_DASHBOARD_EXCEL_PROTOTYPES.md](HR_DASHBOARD_EXCEL_PROTOTYPES.md#L893)。 |
| 集团总部 | 005 管理中心-员工档案表 | [frontend/pages/human-resources/humanresources/hq-005-employee-archive/index.tsx](../../frontend/pages/human-resources/humanresources/hq-005-employee-archive/index.tsx) | 有差异 | 1. 当前共享页可见表头已收口到 Excel 人员汇总表的 24 列范围，原型外的状态、操作和扩展尾列已从页面隐藏。 2. 当前未判为 `完全一致` 的原因，是 HQ 原型文件总列宽、合并区块和整表视觉布局还没有做最后一轮逐项验收。 3. 如需继续追平，需要再核对原型中的整表宽度、冻结列观感和是否存在附加说明区块。 |
| 线上事业部 | 002 线上-年度核心数据看板 | [frontend/pages/human-resources/humanresources/online-002-annual-dashboard/index.tsx](../../frontend/pages/human-resources/humanresources/online-002-annual-dashboard/index.tsx) | 有差异 | 1. 该页通过 wrapper 复用 HQ 年度共享页，但本轮已将展示方式从多 Tab 收口为单页纵向分段，更接近 Excel 单 Sheet 浏览方式。 2. 当前仍保留 `绩效` 分段，以及 `studentCount`、`performanceAverage` 等线上专有列逻辑，需要继续核对是否与原型完全一致。 3. 仍需继续做 summary 区与各分段表头的逐列验收。 |
| 线上事业部 | 003 线上-月度核心数据看板 | [frontend/pages/human-resources/humanresources/online-003-monthly-dashboard/index.tsx](../../frontend/pages/human-resources/humanresources/online-003-monthly-dashboard/index.tsx) | 有差异 | 1. 该页通过 wrapper 复用 HQ 月度共享页。 2. 本轮按原型 JSON 复核后，当前线上 003 的人资配置、培训、薪酬福利、社保表头与 Excel 原型一致。 3. 仍需继续做最终视觉验收，包括汇总行文案、分组头观感和跨月合并单元格表现。 |
| 线上事业部 | 004 线上-日度核心数据看板 | [frontend/pages/human-resources/humanresources/online-004-daily-dashboard/index.tsx](../../frontend/pages/human-resources/humanresources/online-004-daily-dashboard/index.tsx) | 有差异 | 1. 该页通过 wrapper 复用 HQ 日度共享页，并显式开启薪酬/社保 Tab。 2. online recruitment / training 后端已补齐真实聚合，不再是空返回，见 [backend/app/crud/human_resources/dashboard.py](../../backend/app/crud/human_resources/dashboard.py#L1787) 、[backend/app/crud/human_resources/dashboard.py](../../backend/app/crud/human_resources/dashboard.py#L2026) 和 [backend/test/test_human_resources_dashboard_rules.py](../../backend/test/test_human_resources_dashboard_rules.py#L479)。 3. 本轮已修正在线 004 第二列表头口径为“岗位”，但四张原型 Sheet 的逐列最终验收仍未完成，因此还不能判为完全一致。 |
| 线上事业部 | 005 线上-员工档案表 | [frontend/pages/human-resources/humanresources/online-005-employee-archive/index.tsx](../../frontend/pages/human-resources/humanresources/online-005-employee-archive/index.tsx) | 有差异 | 1. 该页通过 wrapper 复用 HQ 员工档案共享页，当前可见表头已收口到原型人员汇总表的 24 列范围。 2. 线上原型文件本身为 2 个 Sheet，当前 web 页是否还需承接附加 Sheet/说明区块，尚未完成最终确认。 3. 仍需继续核对整表宽度、列冻结和最终视觉布局。 |
| 线下事业部 | 002 线下-年度核心数据看板 | [frontend/pages/human-resources/humanresources/offline-002-annual-dashboard/index.tsx](../../frontend/pages/human-resources/humanresources/offline-002-annual-dashboard/index.tsx) | 有差异 | 1. 该页通过 wrapper 复用 HQ 年度共享页，本轮已将展示方式从多 Tab 收口为单页纵向分段，更接近 Excel 单 Sheet 浏览方式。 2. 当前组织列和 scope 已正确切换为线下，但还没有完成与 offline 002 原型表头的逐列验收。 3. 仍需继续核对 summary 区、各分段表头和线下校区行形态。 |
| 线下事业部 | 003 线下-月度核心数据看板 | [frontend/pages/human-resources/humanresources/offline-003-monthly-dashboard/index.tsx](../../frontend/pages/human-resources/humanresources/offline-003-monthly-dashboard/index.tsx) | 有差异 | 1. 该页通过 wrapper 复用 HQ 月度共享页。 2. 本轮按原型 JSON 复核后，当前线下 003 的人资配置、培训、薪酬福利、社保表头与 Excel 原型一致。 3. 仍需继续做最终视觉验收，包括汇总行文案、分组头观感和跨月合并单元格表现。 |
| 线下事业部 | 004 线下-日度核心数据看板 | [frontend/pages/human-resources/humanresources/offline-004-daily-dashboard/index.tsx](../../frontend/pages/human-resources/humanresources/offline-004-daily-dashboard/index.tsx) | 有差异 | 1. 该页通过 wrapper 复用 HQ 日度共享页，并显式开启薪酬/社保 Tab。 2. 当前已确认线下 004 的四个 Tab 范围与共享入口存在，但尚未完成和 offline 004 原型四张 Sheet 的逐列验收。 3. 因此现在只能判定“主结构已基本对齐”，不能判为“完全一致”。 |
| 线下事业部 | 005 线下-员工档案表 | [frontend/pages/human-resources/humanresources/offline-005-employee-archive/index.tsx](../../frontend/pages/human-resources/humanresources/offline-005-employee-archive/index.tsx) | 有差异 | 1. 该页通过 wrapper 复用 HQ 员工档案共享页，当前可见表头已收口到原型人员汇总表的 24 列范围。 2. 线下原型总表布局、列宽和最终视觉观感还没有完成逐项验收。 3. 仍需继续确认是否存在 scope 特有说明区块或附加信息需要承接。 |

## 按共享实现归纳的核心差异

### 002 年度页

- 共享实现已经统一到一个年度页，但当前还不能证明 HQ / ONLINE / OFFLINE 三套年度页都已与各自 Excel Sheet 逐列完全一致。
- ONLINE / OFFLINE 002 本轮已经从多 Tab 展示改成单页纵向分段，页面浏览方式更接近 Excel 单 Sheet。
- ONLINE 002 当前仍存在 `绩效` 分段，以及 `studentCount` / `performanceAverage` 专有列逻辑，需要继续核验其是否完全来自原型要求。

### 003 月度页

- 本轮按原型 JSON 复核后，003 共享页的四类表头列定义与现有 Excel 原型是一致的。
- 003 当前没有继续做代码删列，原因是此前判定为“超集列”的多项字段，实际就在原型表头中。
- 现在 003 剩余的工作更偏向最终视觉验收，而不是列级删改。

### 004 日度页

- 当前已完成共享化，且 online recruitment / training 后端已补齐真实聚合。
- 但 004 三套页还缺最后一轮以 Excel 为准的逐 Sheet、逐列、逐分组验收记录。

### 005 员工档案页

- 当前可见表头已经收口到原型人员汇总表的 24 列范围。
- 原型外的状态列、操作列和扩展尾列已从共享页隐藏，所以 HQ / ONLINE / OFFLINE 三页展示效果同步收口。
- 005 剩余差异主要落在整表视觉布局、列宽、冻结效果，以及是否还需承接原型附加 Sheet/区块。

## 当前总评

- 当前不能对外宣称：这 12 个页面都已经和对应 Excel 原型完全一致。
- 当前更准确的说法是：
  - 12 个页面已经完成主干共享化，核心链路基本稳定。
  - 004 online 后端空数据问题已修复。
  - 005 可见表头已按原型收口到人员汇总表范围。
  - 003 经复核后不存在此前清单中记录的那些明确超集列问题。
  - 002 线上/线下的页面结构已向 Excel 单 Sheet 形态收口。
  - 目前主要剩余工作，集中在 002 的逐列验收、004 的逐 Sheet 验收，以及 003/005 的最终视觉验收。

## 建议的后续销项顺序

1. 先继续处理 002 年度页，按 scope 把 summary 和各 Tab 表头做逐列验收。
2. 再继续处理 004 日度页，把 HQ / ONLINE / OFFLINE 的逐 Sheet 展示效果逐项对表。
3. 最后对 003 / 005 做最终视觉验收，重点看汇总行文案、列宽、冻结列和附加区块承接。 