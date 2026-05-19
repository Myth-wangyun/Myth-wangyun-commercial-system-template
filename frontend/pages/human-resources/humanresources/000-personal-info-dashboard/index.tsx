import React from 'react'
import { Card, Table, Tabs, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'

/**
 * 000 集团个人信息数据看板
 * 最高议事厅 -> 人事部 -> 核心数据
 * 路由: /humanresources/core/personal-info-dashboard
 */
interface AnnualRow {
  key: string
  organization: string
  name: string
  department: string
  position: string
  hireDate: string
  hireYears: string
  transferLeaveStatus: string
  annualAttendanceDays: number | ''
  annualLeaveDays: number | ''
  totalInsuranceFee: number | ''
  totalSalary: number | ''
  totalWelfare: number | ''
  totalReward: number | ''
  annualIncomeTarget: number | ''
  actualIncome: number | ''
  incomeCompletionRate: string
  annualHeadcountTarget: number | ''
  actualHeadcount: number | ''
  headcountCompletionRate: string
  annualVisitRate: number | ''
  annualConversionRate: number | ''
  annualCallCount: number | '' | string
  sourceNewMedia: number | '' | string
  sourceSearch: number | '' | string
  sourceChannel: number | '' | string
  sourceReputation: number | '' | string
}

const annualData: AnnualRow[] = [
  {
    key: 'annual-summary',
    organization: '',
    name: '',
    department: '从线上事业部年度核心数据看板-人员汇总表中获得',
    position: '',
    hireDate: '',
    hireYears: '',
    transferLeaveStatus: '',
    annualAttendanceDays: 0,
    annualLeaveDays: 0,
    totalInsuranceFee: 0,
    totalSalary: 0,
    totalWelfare: 0,
    totalReward: 0,
    annualIncomeTarget: 0,
    actualIncome: 0,
    incomeCompletionRate: '#DIV/0!',
    annualHeadcountTarget: 0,
    actualHeadcount: 0,
    headcountCompletionRate: '#DIV/0!',
    annualVisitRate: 0,
    annualConversionRate: 0,
    annualCallCount: '从咨询表格中提取',
    sourceNewMedia: '',
    sourceSearch: '',
    sourceChannel: '',
    sourceReputation: '',
  },
  ...Array.from({ length: 20 }, (_, i): AnnualRow => ({
    key: `annual-empty-${i + 1}`,
    organization: '',
    name: '',
    department: '',
    position: '',
    hireDate: '',
    hireYears: '',
    transferLeaveStatus: '',
    annualAttendanceDays: '',
    annualLeaveDays: '',
    totalInsuranceFee: '',
    totalSalary: '',
    totalWelfare: '',
    totalReward: '',
    annualIncomeTarget: '',
    actualIncome: '',
    incomeCompletionRate: '',
    annualHeadcountTarget: '',
    actualHeadcount: '',
    headcountCompletionRate: '',
    annualVisitRate: '',
    annualConversionRate: '',
    annualCallCount: '',
    sourceNewMedia: '',
    sourceSearch: '',
    sourceChannel: '',
    sourceReputation: '',
  })),
]

const annualColumns: ColumnsType<AnnualRow> = [
  {
    title: '所属单位',
    dataIndex: 'organization',
    key: 'organization',
    width: 120,
    align: 'center',
  },
  { title: '姓名', dataIndex: 'name', key: 'name', width: 100, align: 'center' },
  { title: '所属部门', dataIndex: 'department', key: 'department', width: 180, align: 'center' },
  { title: '职务', dataIndex: 'position', key: 'position', width: 100, align: 'center' },
  { title: '入职时间', dataIndex: 'hireDate', key: 'hireDate', width: 110, align: 'center' },
  { title: '入职年限', dataIndex: 'hireYears', key: 'hireYears', width: 90, align: 'center' },
  {
    title: '转调离情况',
    dataIndex: 'transferLeaveStatus',
    key: 'transferLeaveStatus',
    width: 120,
    align: 'center',
  },
  {
    title: '年度出勤天数',
    dataIndex: 'annualAttendanceDays',
    key: 'annualAttendanceDays',
    width: 110,
    align: 'center',
  },
  {
    title: '年度请假天数',
    dataIndex: 'annualLeaveDays',
    key: 'annualLeaveDays',
    width: 110,
    align: 'center',
  },
  {
    title: '累计社保缴纳费用',
    dataIndex: 'totalInsuranceFee',
    key: 'totalInsuranceFee',
    width: 130,
    align: 'center',
  },
  {
    title: '累计薪酬总额',
    dataIndex: 'totalSalary',
    key: 'totalSalary',
    width: 120,
    align: 'center',
  },
  {
    title: '累计福利总额',
    dataIndex: 'totalWelfare',
    key: 'totalWelfare',
    width: 120,
    align: 'center',
  },
  {
    title: '累计奖励总额',
    dataIndex: 'totalReward',
    key: 'totalReward',
    width: 120,
    align: 'center',
  },
  {
    title: '年度招生收入目标',
    dataIndex: 'annualIncomeTarget',
    key: 'annualIncomeTarget',
    width: 130,
    align: 'center',
  },
  {
    title: '实际完成收入',
    dataIndex: 'actualIncome',
    key: 'actualIncome',
    width: 110,
    align: 'center',
  },
  {
    title: '收入完成率',
    dataIndex: 'incomeCompletionRate',
    key: 'incomeCompletionRate',
    width: 100,
    align: 'center',
  },
  {
    title: '年度招生人头目标',
    dataIndex: 'annualHeadcountTarget',
    key: 'annualHeadcountTarget',
    width: 130,
    align: 'center',
  },
  {
    title: '实际人头数',
    dataIndex: 'actualHeadcount',
    key: 'actualHeadcount',
    width: 100,
    align: 'center',
  },
  {
    title: '人头完成率',
    dataIndex: 'headcountCompletionRate',
    key: 'headcountCompletionRate',
    width: 100,
    align: 'center',
  },
  {
    title: '年度上门率',
    dataIndex: 'annualVisitRate',
    key: 'annualVisitRate',
    width: 90,
    align: 'center',
  },
  {
    title: '年度转化率',
    dataIndex: 'annualConversionRate',
    key: 'annualConversionRate',
    width: 90,
    align: 'center',
  },
  {
    title: '年度电话量',
    dataIndex: 'annualCallCount',
    key: 'annualCallCount',
    width: 120,
    align: 'center',
  },
  {
    title: '年度接量总数',
    children: [
      {
        title: '新媒体',
        dataIndex: 'sourceNewMedia',
        key: 'sourceNewMedia',
        width: 90,
        align: 'center',
      },
      { title: '大搜', dataIndex: 'sourceSearch', key: 'sourceSearch', width: 90, align: 'center' },
      {
        title: '渠道',
        dataIndex: 'sourceChannel',
        key: 'sourceChannel',
        width: 90,
        align: 'center',
      },
      {
        title: '口碑',
        dataIndex: 'sourceReputation',
        key: 'sourceReputation',
        width: 90,
        align: 'center',
      },
    ],
  },
]

interface MonthlyRow {
  key: string
  month: string
  organization: string
  name: string
  department: string
  position: string
  attendanceDays: number | ''
  leaveDays: number | ''
  insuranceFee: number | ''
  baseSalaryPackage: number | ''
  performanceSalary: number | ''
  kpiScore: number | ''
  commission: number | ''
  welfare: number | ''
  reward: number | ''
  incomeTarget: number | ''
  actualIncome: number | ''
  incomeCompletionRate: string
  headcountTarget: number | ''
  actualHeadcount: number | ''
  headcountCompletionRate: string
  visitRate: number | ''
  conversionRate: number | ''
  callCount: number | '' | string
  sourceNewMedia: number | ''
  sourceSearch: number | ''
  sourceChannel: number | ''
  sourceReputation: number | ''
}

const monthlyData: MonthlyRow[] = [
  {
    key: 'monthly-total',
    month: '合计',
    organization: '',
    name: '',
    department: '',
    position: '',
    attendanceDays: 0,
    leaveDays: 0,
    insuranceFee: 0,
    baseSalaryPackage: 0,
    performanceSalary: 0,
    kpiScore: 0,
    commission: 0,
    welfare: 0,
    reward: 0,
    incomeTarget: 0,
    actualIncome: 0,
    incomeCompletionRate: '#DIV/0!',
    headcountTarget: 0,
    actualHeadcount: 0,
    headcountCompletionRate: '#DIV/0!',
    visitRate: '',
    conversionRate: '',
    callCount: '从咨询表格中提取',
    sourceNewMedia: '',
    sourceSearch: '',
    sourceChannel: '',
    sourceReputation: '',
  },
  ...Array.from({ length: 12 }, (_, i): MonthlyRow => ({
    key: `monthly-${i + 1}`,
    month: String(i + 1),
    organization: '',
    name: '',
    department: '',
    position: '',
    attendanceDays: '',
    leaveDays: '',
    insuranceFee: '',
    baseSalaryPackage: '',
    performanceSalary: '',
    kpiScore: '',
    commission: '',
    welfare: '',
    reward: '',
    incomeTarget: '',
    actualIncome: '',
    incomeCompletionRate: '',
    headcountTarget: '',
    actualHeadcount: '',
    headcountCompletionRate: '',
    visitRate: '',
    conversionRate: '',
    callCount: '',
    sourceNewMedia: '',
    sourceSearch: '',
    sourceChannel: '',
    sourceReputation: '',
  })),
]

const monthlyColumns: ColumnsType<MonthlyRow> = [
  { title: '月度', dataIndex: 'month', key: 'month', width: 80, align: 'center' },
  {
    title: '所属单位',
    dataIndex: 'organization',
    key: 'organization',
    width: 120,
    align: 'center',
  },
  { title: '姓名', dataIndex: 'name', key: 'name', width: 100, align: 'center' },
  { title: '所属部门', dataIndex: 'department', key: 'department', width: 120, align: 'center' },
  { title: '职务', dataIndex: 'position', key: 'position', width: 90, align: 'center' },
  {
    title: '出勤天数',
    dataIndex: 'attendanceDays',
    key: 'attendanceDays',
    width: 100,
    align: 'center',
  },
  { title: '请假天数', dataIndex: 'leaveDays', key: 'leaveDays', width: 100, align: 'center' },
  {
    title: '社保缴纳费用',
    dataIndex: 'insuranceFee',
    key: 'insuranceFee',
    width: 110,
    align: 'center',
  },
  {
    title: '基础薪资包',
    dataIndex: 'baseSalaryPackage',
    key: 'baseSalaryPackage',
    width: 100,
    align: 'center',
  },
  {
    title: '绩效薪资',
    dataIndex: 'performanceSalary',
    key: 'performanceSalary',
    width: 90,
    align: 'center',
  },
  { title: 'KPI得分', dataIndex: 'kpiScore', key: 'kpiScore', width: 90, align: 'center' },
  { title: '提成', dataIndex: 'commission', key: 'commission', width: 80, align: 'center' },
  { title: '福利', dataIndex: 'welfare', key: 'welfare', width: 80, align: 'center' },
  { title: '奖励', dataIndex: 'reward', key: 'reward', width: 80, align: 'center' },
  {
    title: '招生收入目标',
    dataIndex: 'incomeTarget',
    key: 'incomeTarget',
    width: 110,
    align: 'center',
  },
  {
    title: '实际完成收入',
    dataIndex: 'actualIncome',
    key: 'actualIncome',
    width: 110,
    align: 'center',
  },
  {
    title: '收入完成率',
    dataIndex: 'incomeCompletionRate',
    key: 'incomeCompletionRate',
    width: 100,
    align: 'center',
  },
  {
    title: '招生人头目标',
    dataIndex: 'headcountTarget',
    key: 'headcountTarget',
    width: 110,
    align: 'center',
  },
  {
    title: '实际人头数',
    dataIndex: 'actualHeadcount',
    key: 'actualHeadcount',
    width: 100,
    align: 'center',
  },
  {
    title: '人头完成率',
    dataIndex: 'headcountCompletionRate',
    key: 'headcountCompletionRate',
    width: 100,
    align: 'center',
  },
  { title: '上门率', dataIndex: 'visitRate', key: 'visitRate', width: 90, align: 'center' },
  {
    title: '转化率',
    dataIndex: 'conversionRate',
    key: 'conversionRate',
    width: 90,
    align: 'center',
  },
  { title: '电话量', dataIndex: 'callCount', key: 'callCount', width: 120, align: 'center' },
  {
    title: '接量总数',
    children: [
      {
        title: '新媒体',
        dataIndex: 'sourceNewMedia',
        key: 'sourceNewMedia',
        width: 90,
        align: 'center',
      },
      { title: '大搜', dataIndex: 'sourceSearch', key: 'sourceSearch', width: 90, align: 'center' },
      {
        title: '渠道',
        dataIndex: 'sourceChannel',
        key: 'sourceChannel',
        width: 90,
        align: 'center',
      },
      {
        title: '口碑',
        dataIndex: 'sourceReputation',
        key: 'sourceReputation',
        width: 90,
        align: 'center',
      },
    ],
  },
]

const PersonalInfoDashboard: React.FC = () => {
  const tabItems = [
    {
      key: 'annual',
      label: '年度',
      children: (
        <Table<AnnualRow>
          columns={annualColumns}
          dataSource={annualData}
          bordered
          pagination={false}
          size="small"
          scroll={{ x: 3600 }}
        />
      ),
    },
    {
      key: 'monthly',
      label: '月度',
      children: (
        <Table<MonthlyRow>
          columns={monthlyColumns}
          dataSource={monthlyData}
          bordered
          pagination={false}
          size="small"
          scroll={{ x: 3600 }}
        />
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Typography.Title level={4} style={{ marginBottom: 16 }}>
          清美教育集团-个人数据看板
        </Typography.Title>
        <Tabs items={tabItems} />
      </Card>
    </div>
  )
}

export default PersonalInfoDashboard
