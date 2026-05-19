# 019 XX校区教质部口碑招生关键点结果汇总表

## 功能概述

本模块实现了校区教质部口碑招生关键点结果汇总表功能，在同一页面按顺序展示两个表格：

1. **汇总表**（上方）：按班主任统计当月数据
2. **年度明细表**（下方）：按月份展开全年数据，每月包含合计、老生、新生、毕业生四行

## 页面布局

页面采用垂直布局，从上到下依次展示：

- 汇总表（带统计卡片）
- 分隔线（带"年度明细表"标题）
- 年度明细表

两个表格可以独立操作，互不干扰。

## 核心功能

### 1. 数据统计维度

#### 线上宣传数量

- 朋友圈数量
- 抖音数量
- 快手数量
- 小红书数量
- 自动计算合计

#### 学员访谈数量

- 在校生访谈
- 毕业生访谈
- 家长访谈
- 自动计算合计

#### 活动数量

- 活动次数
- 比赛次数
- 送考报名次
- 自动计算合计

### 2. 两种视图模式

#### 汇总表（月度）

- 按班主任展示当月数据
- 支持添加/删除行
- 底部显示总计行
- 显示统计卡片（4个维度）

#### 年度明细表（下方，全年）

- 按12个月展开显示
- 每月包含4行数据：
  - 合计行（蓝色背景）
  - 老生行
  - 新生行
  - 毕业生行
- 月份列自动合并（rowSpan=4）
- 每月小计自动计算
- 底部显示年度总计行（橙色背景）

### 3. 数据管理功能

- **数据展示**：清晰的分组和层次结构
- **数据编辑**：支持在线编辑各项数据
- **行管理**：
  - 汇总表支持添加/删除行
  - 年度明细表固定12个月×4行结构
  - 自动重新编号
- **自动汇总**：
  - 每行的三个"合计"列自动计算
  - 每月的小计行自动汇总
  - 年度总计行自动汇总

### 4. 筛选和查询

- 校区选择
- 年份选择（2023-2025）
- 月份选择（1-12月，仅汇总表）

## 文件结构

```
2-reputation-keypoint-summary/
├── index.tsx                                     # 页面入口（垂直布局展示两个表格）
├── 1-reputation-enrollment-keypoint-summary.tsx  # 汇总表组件
├── 2-reputation-enrollment-keypoint-summary-monthly.tsx # 年度明细表组件
├── types.ts                                      # 类型定义
├── constants.ts                                  # 常量配置
└── README.md                                     # 说明文档
```

## 数据结构

### ReputationKeypointRecord（汇总表）

```typescript
interface ReputationKeypointRecord {
  key: string
  serialNumber: number // 序号
  campus: string // 校区
  teacherName: string // 班主任姓名

  // 线上宣传
  wechatMoments: number // 朋友圈数量
  douyin: number // 抖音数量
  kuaishou: number // 快手数量
  xiaohongshu: number // 小红书数量
  onlineTotal: number // 线上宣传合计

  // 学员访谈
  currentStudentInterview: number // 在校生访谈
  graduateInterview: number // 毕业生访谈
  parentInterview: number // 家长访谈
  interviewTotal: number // 访谈合计

  // 活动
  activityCount: number // 活动次数
  competitionCount: number // 比赛次数
  examRegistrationCount: number // 送考报名次
  activityTotal: number // 活动合计

  rowType?: 'data' | 'total' // 行类型
}
```

### MonthlyReputationKeypointRecord（年度明细表）

```typescript
interface MonthlyReputationKeypointRecord {
  key: string
  month: number | string // 月份（1-12 或 "合计"）
  campus: string // 校区
  teacherName: string // 班主任姓名（合计/老生/新生/毕业生）

  // ... 其他字段同上 ...

  rowType?: 'data' | 'monthTotal' | 'total' // 行类型
}
```

## 主要功能实现

### 1. 自动计算合计

每行的三个"合计"列会自动计算：

- `onlineTotal` = wechatMoments + douyin + kuaishou + xiaohongshu
- `interviewTotal` = currentStudentInterview + graduateInterview + parentInterview
- `activityTotal` = activityCount + competitionCount + examRegistrationCount

### 2. 月份列合并（年度明细表）

使用 `rowSpan` 实现月份列的合并：

- 每月第一行（合计行）：rowSpan = 4
- 其他三行：rowSpan = 0（不显示）

### 3. 分层汇总（年度明细表）

- **数据行**：老生、新生、毕业生三行
- **月小计行**：每月合计行（蓝色背景）
- **年度总计行**：12个月小计的汇总（橙色背景）

### 4. 样式区分

- 数据行：白色背景
- 月小计行：蓝色背景（#f0f9ff）
- 年度总计行：橙色背景（#fff7e6）

## 使用说明

### 汇总表

1. 选择校区、年份、月份
2. 查看统计卡片了解总体情况
3. 点击"编辑"按钮进入编辑模式
4. 修改数据、添加/删除行
5. 点击"保存"按钮保存修改

### 年度明细表

1. 选择校区、年份
2. 查看12个月的详细数据
3. 每月包含合计、老生、新生、毕业生四行
4. 点击"编辑"按钮可修改数据行
5. 月小计和年度总计自动计算

## 技术特性

- ✅ TypeScript 类型安全
- ✅ Ant Design 组件库
- ✅ Tabs 视图切换
- ✅ 自动计算合计
- ✅ 可编辑表格
- ✅ 动态添加/删除行（汇总表）
- ✅ rowSpan 单元格合并（年度明细表）
- ✅ 分层汇总计算
- ✅ 统计卡片展示
- ✅ 响应式布局
- ✅ 无 Linter 错误

## 未来优化

- [ ] 实现数据导出功能（Excel）
- [ ] 添加数据图表分析
- [ ] 支持批量导入数据
- [ ] 添加数据验证规则
- [ ] 实现历史数据对比
- [ ] 添加排名功能
- [ ] 支持数据筛选和搜索
- [ ] 年度明细表支持按季度/半年度汇总
