import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, DatePicker, Space, Table, Tabs, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'

import { getDashboardMonthly } from '@/services/humanresources/dashboardMonthly'
import {
  type CellValue,
  type DashboardScope,
  type MonthlySectionKey,
  type MonthlyGroupedRowBase,
  HQ_DIVISIONS,
  createDepartmentColumn,
  createMonthGroupColumn,
  composeColumns,
  getMonthlyGrandTotalLabel,
  getMonthlySectionOrgColumnTitle,
  getScopeOrganizations,
  patchDepartmentColumnTitle,
  shouldUseMonthSubtotalRows,
  sortMonthlyRows,
  toScopeDisplayDepartment,
} from '../shared/monthlyDashboardShared'

/**
 * 003 最高议事厅月度核心数据看板
 * 最高议事厅 -> 人事部 -> 集团总部
 * 路由: /humanresources/hq/monthly-dashboard
 */
interface HrAllocationMonthlyRow {
  key: string
  rowType: 'grandTotal' | 'monthSubtotal' | 'month'
  month: string
  monthGroupFirstRow: boolean
  monthGroupSize: number
  department: string
  authorizedPosts: CellValue
  currentPosts: CellValue
  neededPosts: CellValue
  resumeCount: CellValue
  inviteCount: CellValue
  interviewCount: CellValue
  interviewArrivalRate: string
  onboardCount: CellValue
  recruitCompletionRate: string
  totalOnboardRate: string
  newRetentionCount: CellValue
  newRetentionRate: string
  currentHeadcount: CellValue
  transferCount: CellValue
  plannedOptimizeCount: CellValue
  actualOptimizeCount: CellValue
  resignCount: CellValue
  resignRate: string
}

const hrAllocationMonthlyData: HrAllocationMonthlyRow[] = [
  {
    key: 'grand-total',
    rowType: 'grandTotal',
    month: '总合计',
    monthGroupFirstRow: true,
    monthGroupSize: 1,
    department: '',
    authorizedPosts: 0,
    currentPosts: 0,
    neededPosts: 0,
    resumeCount: 0,
    inviteCount: 0,
    interviewCount: 0,
    interviewArrivalRate: '#DIV/0!',
    onboardCount: 0,
    recruitCompletionRate: '#DIV/0!',
    totalOnboardRate: '#DIV/0!',
    newRetentionCount: 0,
    newRetentionRate: '#DIV/0!',
    currentHeadcount: 0,
    transferCount: 0,
    plannedOptimizeCount: '',
    actualOptimizeCount: '',
    resignCount: '',
    resignRate: '#DIV/0!',
  },
  ...HQ_DIVISIONS.map((division, index) => ({
    key: `month-subtotal-${division}`,
    rowType: 'monthSubtotal' as const,
    month: '月合计',
    monthGroupFirstRow: index === 0,
    monthGroupSize: HQ_DIVISIONS.length,
    department: division,
    authorizedPosts: 0,
    currentPosts: 0,
    neededPosts: 0,
    resumeCount: 0,
    inviteCount: 0,
    interviewCount: 0,
    interviewArrivalRate: '#DIV/0!',
    onboardCount: 0,
    recruitCompletionRate: '#DIV/0!',
    totalOnboardRate: '#DIV/0!',
    newRetentionCount: 0,
    newRetentionRate: '#DIV/0!',
    currentHeadcount: 0,
    transferCount: 0,
    plannedOptimizeCount: '',
    actualOptimizeCount: '',
    resignCount: '',
    resignRate: '#DIV/0!',
  })),
  ...Array.from({ length: 12 }, (_, monthIndex) => {
    const month = String(monthIndex + 1)
    return [
      {
        key: `month-total-${month}`,
        rowType: 'month' as const,
        month,
        monthGroupFirstRow: true,
        monthGroupSize: HQ_DIVISIONS.length + 1,
        department: '合计',
        authorizedPosts: 0,
        currentPosts: 0,
        neededPosts: 0,
        resumeCount: 0,
        inviteCount: 0,
        interviewCount: 0,
        interviewArrivalRate: '#DIV/0!',
        onboardCount: '',
        recruitCompletionRate: '#DIV/0!',
        totalOnboardRate: '#DIV/0!',
        newRetentionCount: '',
        newRetentionRate: '#DIV/0!',
        currentHeadcount: 0,
        transferCount: 0,
        plannedOptimizeCount: 0,
        actualOptimizeCount: 0,
        resignCount: 0,
        resignRate: '#DIV/0!',
      },
      ...HQ_DIVISIONS.map((division) => ({
        key: `month-${month}-${division}`,
        rowType: 'month' as const,
        month,
        monthGroupFirstRow: false,
        monthGroupSize: HQ_DIVISIONS.length + 1,
        department: division,
        authorizedPosts: '',
        currentPosts: '',
        neededPosts: '',
        resumeCount: '',
        inviteCount: '',
        interviewCount: '',
        interviewArrivalRate: '#DIV/0!',
        onboardCount: '',
        recruitCompletionRate: '#DIV/0!',
        totalOnboardRate: '#DIV/0!',
        newRetentionCount: '',
        newRetentionRate: '#DIV/0!',
        currentHeadcount: '',
        transferCount: '',
        plannedOptimizeCount: '',
        actualOptimizeCount: '',
        resignCount: '',
        resignRate: '#DIV/0!',
      })),
    ]
  }).flat(),
]

const hrAllocationMonthlyColumnsBase: ColumnsType<HrAllocationMonthlyRow> = [
  {
    title: '编制职数',
    dataIndex: 'authorizedPosts',
    key: 'authorizedPosts',
    width: 90,
    align: 'center',
  },
  {
    title: '现有职数',
    dataIndex: 'currentPosts',
    key: 'currentPosts',
    width: 90,
    align: 'center',
  },
  {
    title: '需招聘职数',
    dataIndex: 'neededPosts',
    key: 'neededPosts',
    width: 100,
    align: 'center',
  },
]

const hrAllocationMonthlyColumnsResume: ColumnsType<HrAllocationMonthlyRow> = [
  {
    title: '简历数',
    dataIndex: 'resumeCount',
    key: 'resumeCount',
    width: 90,
    align: 'center',
  },
]

const hrAllocationMonthlyColumnsTail: ColumnsType<HrAllocationMonthlyRow> = [
  {
    title: '邀约人数',
    dataIndex: 'inviteCount',
    key: 'inviteCount',
    width: 90,
    align: 'center',
  },
  {
    title: '面试人数',
    dataIndex: 'interviewCount',
    key: 'interviewCount',
    width: 90,
    align: 'center',
  },
  {
    title: '面试上门率',
    dataIndex: 'interviewArrivalRate',
    key: 'interviewArrivalRate',
    width: 100,
    align: 'center',
  },
  {
    title: '入职人数',
    dataIndex: 'onboardCount',
    key: 'onboardCount',
    width: 90,
    align: 'center',
  },
  {
    title: '招聘完成率',
    dataIndex: 'recruitCompletionRate',
    key: 'recruitCompletionRate',
    width: 100,
    align: 'center',
  },
  {
    title: '总入职率',
    dataIndex: 'totalOnboardRate',
    key: 'totalOnboardRate',
    width: 90,
    align: 'center',
  },
  {
    title: '新员工留存数',
    dataIndex: 'newRetentionCount',
    key: 'newRetentionCount',
    width: 100,
    align: 'center',
  },
  {
    title: '新员工留存率',
    dataIndex: 'newRetentionRate',
    key: 'newRetentionRate',
    width: 100,
    align: 'center',
  },
  {
    title: '现有人数',
    dataIndex: 'currentHeadcount',
    key: 'currentHeadcount',
    width: 90,
    align: 'center',
  },
  {
    title: '调岗人数',
    dataIndex: 'transferCount',
    key: 'transferCount',
    width: 90,
    align: 'center',
  },
  {
    title: '计划优化人数',
    dataIndex: 'plannedOptimizeCount',
    key: 'plannedOptimizeCount',
    width: 110,
    align: 'center',
  },
  {
    title: '实际优化人数',
    dataIndex: 'actualOptimizeCount',
    key: 'actualOptimizeCount',
    width: 110,
    align: 'center',
  },
  {
    title: '离职人数',
    dataIndex: 'resignCount',
    key: 'resignCount',
    width: 90,
    align: 'center',
  },
  {
    title: '离职率',
    dataIndex: 'resignRate',
    key: 'resignRate',
    width: 90,
    align: 'center',
  },
]

const hrAllocationMonthlyColumnsDefault: ColumnsType<HrAllocationMonthlyRow> = composeColumns<HrAllocationMonthlyRow>(
  [createMonthGroupColumn<HrAllocationMonthlyRow>(), createDepartmentColumn<HrAllocationMonthlyRow>()],
  hrAllocationMonthlyColumnsBase,
  hrAllocationMonthlyColumnsTail,
)

const hrAllocationMonthlyColumnsOnline: ColumnsType<HrAllocationMonthlyRow> = composeColumns<HrAllocationMonthlyRow>(
  [createMonthGroupColumn<HrAllocationMonthlyRow>(), createDepartmentColumn<HrAllocationMonthlyRow>()],
  hrAllocationMonthlyColumnsBase,
  hrAllocationMonthlyColumnsResume,
  hrAllocationMonthlyColumnsTail,
)

interface TrainingMonthlyRow extends MonthlyGroupedRowBase {
  trainingSessions: CellValue
  trainingParticipants: CellValue
  avgTrainingDuration: CellValue
  averageScore: CellValue
  passParticipants: CellValue
  passList: string
  failParticipants: CellValue
  failList: string
  passRate: string
  avgSatisfactionScore: CellValue
  totalTrainingCost: CellValue
  perCapitaCost: CellValue
}

const trainingMonthlyData: TrainingMonthlyRow[] = [
  {
    key: 'training-grand-total',
    rowType: 'grandTotal',
    month: '总合计',
    monthGroupFirstRow: true,
    monthGroupSize: 1,
    department: '',
    trainingSessions: 0,
    trainingParticipants: 0,
    avgTrainingDuration: 0,
    averageScore: '#DIV/0!',
    passParticipants: 0,
    passList: '',
    failParticipants: 0,
    failList: '',
    passRate: '#DIV/0!',
    avgSatisfactionScore: 0,
    totalTrainingCost: 0,
    perCapitaCost: '#DIV/0!',
  },
  ...HQ_DIVISIONS.map((division, index) => ({
    key: `training-month-subtotal-${division}`,
    rowType: 'monthSubtotal' as const,
    month: '月合计',
    monthGroupFirstRow: index === 0,
    monthGroupSize: HQ_DIVISIONS.length,
    department: division,
    trainingSessions: 0,
    trainingParticipants: 0,
    avgTrainingDuration: 0,
    averageScore: 0,
    passParticipants: 0,
    passList: '',
    failParticipants: 0,
    failList: '',
    passRate: '#DIV/0!',
    avgSatisfactionScore: 0,
    totalTrainingCost: 0,
    perCapitaCost: '#DIV/0!',
  })),
  ...Array.from({ length: 12 }, (_, monthIndex) => {
    const month = String(monthIndex + 1)
    return [
      {
        key: `training-month-total-${month}`,
        rowType: 'month' as const,
        month,
        monthGroupFirstRow: true,
        monthGroupSize: HQ_DIVISIONS.length + 1,
        department: '合计',
        trainingSessions: 0,
        trainingParticipants: 0,
        avgTrainingDuration: 0,
        averageScore: '#DIV/0!',
        passParticipants: 0,
        passList: '',
        failParticipants: 0,
        failList: '',
        passRate: '#DIV/0!',
        avgSatisfactionScore: 0,
        totalTrainingCost: 0,
        perCapitaCost: '#DIV/0!',
      },
      ...HQ_DIVISIONS.map((division) => ({
        key: `training-month-${month}-${division}`,
        rowType: 'month' as const,
        month,
        monthGroupFirstRow: false,
        monthGroupSize: HQ_DIVISIONS.length + 1,
        department: division,
        trainingSessions: '',
        trainingParticipants: '',
        avgTrainingDuration: '',
        averageScore: '',
        passParticipants: '',
        passList: '',
        failParticipants: '',
        failList: '',
        passRate: '#DIV/0!',
        avgSatisfactionScore: '',
        totalTrainingCost: '',
        perCapitaCost: '#DIV/0!',
      })),
    ]
  }).flat(),
]

const trainingMonthlyColumnsBase: ColumnsType<TrainingMonthlyRow> = [
  {
    title: '培训场次',
    dataIndex: 'trainingSessions',
    key: 'trainingSessions',
    width: 90,
    align: 'center',
  },
  {
    title: '培训人次',
    dataIndex: 'trainingParticipants',
    key: 'trainingParticipants',
    width: 90,
    align: 'center',
  },
  {
    title: '平均培训时长',
    dataIndex: 'avgTrainingDuration',
    key: 'avgTrainingDuration',
    width: 120,
    align: 'center',
  },
  {
    title: '平均分',
    dataIndex: 'averageScore',
    key: 'averageScore',
    width: 90,
    align: 'center',
  },
  {
    title: '培训合格人次',
    dataIndex: 'passParticipants',
    key: 'passParticipants',
    width: 110,
    align: 'center',
  },
  {
    title: '合格名单',
    dataIndex: 'passList',
    key: 'passList',
    width: 120,
    align: 'center',
  },
  {
    title: '不合格人次',
    dataIndex: 'failParticipants',
    key: 'failParticipants',
    width: 110,
    align: 'center',
  },
  {
    title: '不合格名单',
    dataIndex: 'failList',
    key: 'failList',
    width: 120,
    align: 'center',
  },
]

const trainingMonthlyColumnsTail: ColumnsType<TrainingMonthlyRow> = [
  {
    title: '培训合格率',
    dataIndex: 'passRate',
    key: 'passRate',
    width: 100,
    align: 'center',
  },
  {
    title: '培训满意度平均分',
    dataIndex: 'avgSatisfactionScore',
    key: 'avgSatisfactionScore',
    width: 130,
    align: 'center',
  },
  {
    title: '培训投入总费用',
    dataIndex: 'totalTrainingCost',
    key: 'totalTrainingCost',
    width: 120,
    align: 'center',
  },
  {
    title: '人均成本',
    dataIndex: 'perCapitaCost',
    key: 'perCapitaCost',
    width: 100,
    align: 'center',
  },
]

const trainingMonthlyColumnsDefault: ColumnsType<TrainingMonthlyRow> = composeColumns<TrainingMonthlyRow>(
  [createMonthGroupColumn<TrainingMonthlyRow>(), createDepartmentColumn<TrainingMonthlyRow>()],
  trainingMonthlyColumnsBase,
  trainingMonthlyColumnsTail,
)

interface SalaryWelfareMonthlyRow extends MonthlyGroupedRowBase {
  headcount: CellValue
  salary: CellValue
  annualWelfareTotal: CellValue
  monthlyIncentiveTotal: CellValue
  temporaryRewardTotal: CellValue
  deduction: CellValue
  cadreSalaryTotal: CellValue
  staffSalaryTotal: CellValue
  salaryTotal: CellValue
  avgAnnualSalary: CellValue
  cadreSalaryRatio: CellValue
  staffSalaryRatio: CellValue
  avgAnnualWelfare: CellValue
}

const salaryWelfareMonthlyData: SalaryWelfareMonthlyRow[] = [
  {
    key: 'salary-grand-total',
    rowType: 'grandTotal',
    month: '总合计',
    monthGroupFirstRow: true,
    monthGroupSize: 1,
    department: '',
    headcount: 0,
    salary: 0,
    annualWelfareTotal: 0,
    monthlyIncentiveTotal: 0,
    temporaryRewardTotal: 0,
    deduction: 0,
    cadreSalaryTotal: 0,
    staffSalaryTotal: 0,
    salaryTotal: 0,
    avgAnnualSalary: '#DIV/0!',
    cadreSalaryRatio: '#DIV/0!',
    staffSalaryRatio: '#DIV/0!',
    avgAnnualWelfare: '#DIV/0!',
  },
  ...HQ_DIVISIONS.map((division, index) => ({
    key: `salary-month-subtotal-${division}`,
    rowType: 'monthSubtotal' as const,
    month: '月合计',
    monthGroupFirstRow: index === 0,
    monthGroupSize: HQ_DIVISIONS.length,
    department: division,
    headcount: 0,
    salary: 0,
    annualWelfareTotal: 0,
    monthlyIncentiveTotal: 0,
    temporaryRewardTotal: 0,
    deduction: 0,
    cadreSalaryTotal: 0,
    staffSalaryTotal: 0,
    salaryTotal: 0,
    avgAnnualSalary: '#DIV/0!',
    cadreSalaryRatio: '#DIV/0!',
    staffSalaryRatio: '#DIV/0!',
    avgAnnualWelfare: '#DIV/0!',
  })),
  ...Array.from({ length: 12 }, (_, monthIndex) => {
    const month = String(monthIndex + 1)
    return [
      {
        key: `salary-month-total-${month}`,
        rowType: 'month' as const,
        month,
        monthGroupFirstRow: true,
        monthGroupSize: HQ_DIVISIONS.length + 1,
        department: '合计',
        headcount: 0,
        salary: 0,
        annualWelfareTotal: 0,
        monthlyIncentiveTotal: 0,
        temporaryRewardTotal: 0,
        deduction: 0,
        cadreSalaryTotal: 0,
        staffSalaryTotal: 0,
        salaryTotal: 0,
        avgAnnualSalary: '#DIV/0!',
        cadreSalaryRatio: '#DIV/0!',
        staffSalaryRatio: '#DIV/0!',
        avgAnnualWelfare: '#DIV/0!',
      },
      ...HQ_DIVISIONS.map((division) => ({
        key: `salary-month-${month}-${division}`,
        rowType: 'month' as const,
        month,
        monthGroupFirstRow: false,
        monthGroupSize: HQ_DIVISIONS.length + 1,
        department: division,
        headcount: '',
        salary: '',
        annualWelfareTotal: '',
        monthlyIncentiveTotal: '',
        temporaryRewardTotal: '',
        deduction: '',
        cadreSalaryTotal: '',
        staffSalaryTotal: '',
        salaryTotal: '',
        avgAnnualSalary: '#DIV/0!',
        cadreSalaryRatio: '#DIV/0!',
        staffSalaryRatio: '#DIV/0!',
        avgAnnualWelfare: '#DIV/0!',
      })),
    ]
  }).flat(),
]

const toNumber = (value: CellValue): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const calcAverage = (numerator: CellValue, denominator: CellValue): CellValue => {
  const denominatorValue = toNumber(denominator)
  if (denominatorValue <= 0) {
    return '#DIV/0!'
  }
  return Number((toNumber(numerator) / denominatorValue).toFixed(2))
}

const calcRatio = (numerator: CellValue, denominator: CellValue): CellValue => {
  const denominatorValue = toNumber(denominator)
  if (denominatorValue <= 0) {
    return '#DIV/0!'
  }
  return `${((toNumber(numerator) / denominatorValue) * 100).toFixed(2)}%`
}

const buildMonthlyRowKey = (row: { rowType: string; month: string; department: string }): string => `${row.rowType}::${row.month}::${row.department}`

const enrichSalaryRows = (salaryRows: SalaryWelfareMonthlyRow[], hrRows: HrAllocationMonthlyRow[]): SalaryWelfareMonthlyRow[] => {
  const headcountMap = new Map(hrRows.map((row) => [buildMonthlyRowKey(row), row.currentHeadcount]))

  return salaryRows.map((row) => {
    const headcount = headcountMap.get(buildMonthlyRowKey(row)) ?? row.headcount ?? ''
    const annualSalaryTotal = row.salaryTotal
    const annualWelfareTotal = row.annualWelfareTotal

    return {
      ...row,
      headcount,
      avgAnnualSalary: calcAverage(annualSalaryTotal, headcount),
      cadreSalaryRatio: calcRatio(row.cadreSalaryTotal, annualSalaryTotal),
      staffSalaryRatio: calcRatio(row.staffSalaryTotal, annualSalaryTotal),
      avgAnnualWelfare: calcAverage(annualWelfareTotal, headcount),
    }
  })
}

const salaryWelfareMonthlyColumnsDefault: ColumnsType<SalaryWelfareMonthlyRow> = composeColumns<SalaryWelfareMonthlyRow>(
  [createMonthGroupColumn<SalaryWelfareMonthlyRow>(), createDepartmentColumn<SalaryWelfareMonthlyRow>()],
  [
    {
      title: '薪酬',
      dataIndex: 'salary',
      key: 'salary',
      width: 90,
      align: 'center',
    },
    {
      title: '年度福利总额',
      dataIndex: 'annualWelfareTotal',
      key: 'annualWelfareTotal',
      width: 120,
      align: 'center',
    },
    {
      title: '月度激励总额',
      dataIndex: 'monthlyIncentiveTotal',
      key: 'monthlyIncentiveTotal',
      width: 120,
      align: 'center',
    },
    {
      title: '临时奖励总额',
      dataIndex: 'temporaryRewardTotal',
      key: 'temporaryRewardTotal',
      width: 120,
      align: 'center',
    },
    {
      title: '扣款',
      dataIndex: 'deduction',
      key: 'deduction',
      width: 100,
      align: 'center',
    },
    {
      title: '干部薪酬总额',
      dataIndex: 'cadreSalaryTotal',
      key: 'cadreSalaryTotal',
      width: 120,
      align: 'center',
    },
    {
      title: '基层薪酬总额',
      dataIndex: 'staffSalaryTotal',
      key: 'staffSalaryTotal',
      width: 120,
      align: 'center',
    },
    {
      title: '薪酬总额',
      dataIndex: 'salaryTotal',
      key: 'salaryTotal',
      width: 100,
      align: 'center',
    },
  ],
)

const salaryWelfareMonthlyColumnsOnline: ColumnsType<SalaryWelfareMonthlyRow> = composeColumns<SalaryWelfareMonthlyRow>(
  [createMonthGroupColumn<SalaryWelfareMonthlyRow>(), createDepartmentColumn<SalaryWelfareMonthlyRow>()],
  [
    {
      title: '年度薪酬总额',
      dataIndex: 'salaryTotal',
      key: 'salaryTotal',
      width: 115,
      align: 'center',
    },
    {
      title: '人均年度薪酬',
      dataIndex: 'avgAnnualSalary',
      key: 'avgAnnualSalary',
      width: 115,
      align: 'center',
    },
    {
      title: '干部薪酬总额',
      dataIndex: 'cadreSalaryTotal',
      key: 'cadreSalaryTotal',
      width: 115,
      align: 'center',
    },
    {
      title: '干部薪酬占比',
      dataIndex: 'cadreSalaryRatio',
      key: 'cadreSalaryRatio',
      width: 110,
      align: 'center',
    },
    {
      title: '基层薪酬总额',
      dataIndex: 'staffSalaryTotal',
      key: 'staffSalaryTotal',
      width: 115,
      align: 'center',
    },
    {
      title: '基层薪酬占比',
      dataIndex: 'staffSalaryRatio',
      key: 'staffSalaryRatio',
      width: 110,
      align: 'center',
    },
    {
      title: '年度福利总额',
      dataIndex: 'annualWelfareTotal',
      key: 'annualWelfareTotal',
      width: 115,
      align: 'center',
    },
    {
      title: '人均年度福利总额',
      dataIndex: 'avgAnnualWelfare',
      key: 'avgAnnualWelfare',
      width: 130,
      align: 'center',
    },
    {
      title: '月度激励总额',
      dataIndex: 'monthlyIncentiveTotal',
      key: 'monthlyIncentiveTotal',
      width: 115,
      align: 'center',
    },
    {
      title: '临时奖励总额',
      dataIndex: 'temporaryRewardTotal',
      key: 'temporaryRewardTotal',
      width: 110,
      align: 'center',
    },
  ],
)

interface SocialInsuranceMonthlyRow extends MonthlyGroupedRowBase {
  shouldInsureCount: CellValue
  actualInsureCount: CellValue
  insureRate: string
  totalPayment: CellValue
  companyTotalPayment: CellValue
  personalTotalPayment: CellValue
  serviceFeeTotal: CellValue
  paymentBase: CellValue
  injuryCompanyRate: CellValue
  pensionCompanyRate: CellValue
  pensionPersonalRate: CellValue
  unemploymentCompanyRate: CellValue
  unemploymentPersonalRate: CellValue
  medicalCompanyRate: CellValue
  medicalPersonalRate: CellValue
}

const socialInsuranceMonthlyData: SocialInsuranceMonthlyRow[] = [
  {
    key: 'insurance-grand-total',
    rowType: 'grandTotal',
    month: '总合计',
    monthGroupFirstRow: true,
    monthGroupSize: 1,
    department: '',
    shouldInsureCount: 0,
    actualInsureCount: 0,
    insureRate: '#DIV/0!',
    totalPayment: 0,
    companyTotalPayment: 0,
    personalTotalPayment: 0,
    serviceFeeTotal: 0,
    paymentBase: 0,
    injuryCompanyRate: 0,
    pensionCompanyRate: 0,
    pensionPersonalRate: 0,
    unemploymentCompanyRate: 0,
    unemploymentPersonalRate: 0,
    medicalCompanyRate: 0,
    medicalPersonalRate: 0,
  },
  ...HQ_DIVISIONS.map((division, index) => ({
    key: `insurance-month-subtotal-${division}`,
    rowType: 'monthSubtotal' as const,
    month: '月合计',
    monthGroupFirstRow: index === 0,
    monthGroupSize: HQ_DIVISIONS.length,
    department: division,
    shouldInsureCount: 0,
    actualInsureCount: 0,
    insureRate: '#DIV/0!',
    totalPayment: 0,
    companyTotalPayment: 0,
    personalTotalPayment: 0,
    serviceFeeTotal: 0,
    paymentBase: 0,
    injuryCompanyRate: 0,
    pensionCompanyRate: 0,
    pensionPersonalRate: 0,
    unemploymentCompanyRate: 0,
    unemploymentPersonalRate: 0,
    medicalCompanyRate: 0,
    medicalPersonalRate: 0,
  })),
  ...Array.from({ length: 12 }, (_, monthIndex) => {
    const month = String(monthIndex + 1)
    return [
      {
        key: `insurance-month-total-${month}`,
        rowType: 'month' as const,
        month,
        monthGroupFirstRow: true,
        monthGroupSize: HQ_DIVISIONS.length + 1,
        department: '合计',
        shouldInsureCount: 0,
        actualInsureCount: 0,
        insureRate: '#DIV/0!',
        totalPayment: 0,
        companyTotalPayment: 0,
        personalTotalPayment: 0,
        serviceFeeTotal: 0,
        paymentBase: '0.00',
        injuryCompanyRate: 0,
        pensionCompanyRate: 0,
        pensionPersonalRate: 0,
        unemploymentCompanyRate: 0,
        unemploymentPersonalRate: 0,
        medicalCompanyRate: 0,
        medicalPersonalRate: 0,
      },
      ...HQ_DIVISIONS.map((division) => ({
        key: `insurance-month-${month}-${division}`,
        rowType: 'month' as const,
        month,
        monthGroupFirstRow: false,
        monthGroupSize: HQ_DIVISIONS.length + 1,
        department: division,
        shouldInsureCount: '',
        actualInsureCount: '',
        insureRate: '#DIV/0!',
        totalPayment: '',
        companyTotalPayment: '',
        personalTotalPayment: '',
        serviceFeeTotal: '',
        paymentBase: '0.00' as const,
        injuryCompanyRate: '',
        pensionCompanyRate: '',
        pensionPersonalRate: '',
        unemploymentCompanyRate: '',
        unemploymentPersonalRate: '',
        medicalCompanyRate: '',
        medicalPersonalRate: '',
      })),
    ]
  }).flat(),
]

const socialInsuranceMonthlyColumnsDefault: ColumnsType<SocialInsuranceMonthlyRow> = composeColumns<SocialInsuranceMonthlyRow>(
  [createMonthGroupColumn<SocialInsuranceMonthlyRow>(), createDepartmentColumn<SocialInsuranceMonthlyRow>()],
  [
  {
    title: '应参保人数',
    dataIndex: 'shouldInsureCount',
    key: 'shouldInsureCount',
    width: 100,
    align: 'center',
  },
  {
    title: '实际参保人数',
    dataIndex: 'actualInsureCount',
    key: 'actualInsureCount',
    width: 110,
    align: 'center',
  },
  {
    title: '参保率',
    dataIndex: 'insureRate',
    key: 'insureRate',
    width: 100,
    align: 'center',
  },
  {
    title: '缴纳总额',
    dataIndex: 'totalPayment',
    key: 'totalPayment',
    width: 100,
    align: 'center',
  },
  {
    title: '单位缴纳总额',
    dataIndex: 'companyTotalPayment',
    key: 'companyTotalPayment',
    width: 120,
    align: 'center',
  },
  {
    title: '个人缴纳总额',
    dataIndex: 'personalTotalPayment',
    key: 'personalTotalPayment',
    width: 120,
    align: 'center',
  },
  {
    title: '服务费总额',
    dataIndex: 'serviceFeeTotal',
    key: 'serviceFeeTotal',
    width: 110,
    align: 'center',
  },
  {
    title: '缴费基数',
    dataIndex: 'paymentBase',
    key: 'paymentBase',
    width: 100,
    align: 'center',
  },
  {
    title: '工伤保险',
    children: [
      {
        title: '企业0.5%',
        dataIndex: 'injuryCompanyRate',
        key: 'injuryCompanyRate',
        width: 100,
        align: 'center',
      },
    ],
  },
  {
    title: '养老',
    children: [
      {
        title: '企业16%',
        dataIndex: 'pensionCompanyRate',
        key: 'pensionCompanyRate',
        width: 100,
        align: 'center',
      },
      {
        title: '个人8%',
        dataIndex: 'pensionPersonalRate',
        key: 'pensionPersonalRate',
        width: 90,
        align: 'center',
      },
    ],
  },
  {
    title: '失业',
    children: [
      {
        title: '企业0.7%',
        dataIndex: 'unemploymentCompanyRate',
        key: 'unemploymentCompanyRate',
        width: 100,
        align: 'center',
      },
      {
        title: '个人0.3%',
        dataIndex: 'unemploymentPersonalRate',
        key: 'unemploymentPersonalRate',
        width: 100,
        align: 'center',
      },
    ],
  },
  {
    title: '医疗',
    children: [
      {
        title: '企业7.5%',
        dataIndex: 'medicalCompanyRate',
        key: 'medicalCompanyRate',
        width: 100,
        align: 'center',
      },
      {
        title: '个人2%',
        dataIndex: 'medicalPersonalRate',
        key: 'medicalPersonalRate',
        width: 90,
        align: 'center',
      },
    ],
  },
])

const socialInsuranceMonthlyColumnsOnline: ColumnsType<SocialInsuranceMonthlyRow> = composeColumns<SocialInsuranceMonthlyRow>(
  [createMonthGroupColumn<SocialInsuranceMonthlyRow>(), createDepartmentColumn<SocialInsuranceMonthlyRow>()],
  [
  {
    title: '应参保人数',
    dataIndex: 'shouldInsureCount',
    key: 'shouldInsureCount',
    width: 100,
    align: 'center',
  },
  {
    title: '实际参保人数',
    dataIndex: 'actualInsureCount',
    key: 'actualInsureCount',
    width: 110,
    align: 'center',
  },
  {
    title: '参保率',
    dataIndex: 'insureRate',
    key: 'insureRate',
    width: 100,
    align: 'center',
  },
  {
    title: '缴纳总额',
    dataIndex: 'totalPayment',
    key: 'totalPayment',
    width: 100,
    align: 'center',
  },
  {
    title: '单位缴纳总额',
    dataIndex: 'companyTotalPayment',
    key: 'companyTotalPayment',
    width: 120,
    align: 'center',
  },
  {
    title: '个人缴纳总额',
    dataIndex: 'personalTotalPayment',
    key: 'personalTotalPayment',
    width: 120,
    align: 'center',
  },
  {
    title: '服务费总额',
    dataIndex: 'serviceFeeTotal',
    key: 'serviceFeeTotal',
    width: 110,
    align: 'center',
  },
])

const buildHrAllocationMonthlyData = (scope: DashboardScope): HrAllocationMonthlyRow[] => {
  const orgs = getScopeOrganizations(scope)
  const includeMonthSubtotalRows = shouldUseMonthSubtotalRows(scope)
  return [
    {
      key: 'grand-total',
      rowType: 'grandTotal',
      month: getMonthlyGrandTotalLabel('hr', scope),
      monthGroupFirstRow: true,
      monthGroupSize: 1,
      department: '',
      authorizedPosts: 0,
      currentPosts: 0,
      neededPosts: 0,
      resumeCount: 0,
      inviteCount: 0,
      interviewCount: 0,
      interviewArrivalRate: '#DIV/0!',
      onboardCount: 0,
      recruitCompletionRate: '#DIV/0!',
      totalOnboardRate: '#DIV/0!',
      newRetentionCount: 0,
      newRetentionRate: '#DIV/0!',
      currentHeadcount: 0,
      transferCount: 0,
      plannedOptimizeCount: '',
      actualOptimizeCount: '',
      resignCount: '',
      resignRate: '#DIV/0!',
    },
    ...(includeMonthSubtotalRows
      ? orgs.map((org, index) => ({
      key: `month-subtotal-${org}`,
      rowType: 'monthSubtotal' as const,
      month: '月合计',
      monthGroupFirstRow: index === 0,
      monthGroupSize: orgs.length,
      department: org,
      authorizedPosts: 0,
      currentPosts: 0,
      neededPosts: 0,
      resumeCount: 0,
      inviteCount: 0,
      interviewCount: 0,
      interviewArrivalRate: '#DIV/0!',
      onboardCount: 0,
      recruitCompletionRate: '#DIV/0!',
      totalOnboardRate: '#DIV/0!',
      newRetentionCount: 0,
      newRetentionRate: '#DIV/0!',
      currentHeadcount: 0,
      transferCount: 0,
      plannedOptimizeCount: '',
      actualOptimizeCount: '',
      resignCount: '',
      resignRate: '#DIV/0!',
    }))
      : []),
    ...Array.from({ length: 12 }, (_, monthIndex) => {
      const month = String(monthIndex + 1)
      return [
        {
          key: `month-total-${month}`,
          rowType: 'month' as const,
          month,
          monthGroupFirstRow: true,
          monthGroupSize: orgs.length + 1,
          department: '合计',
          authorizedPosts: 0,
          currentPosts: 0,
          neededPosts: 0,
          resumeCount: 0,
          inviteCount: 0,
          interviewCount: 0,
          interviewArrivalRate: '#DIV/0!',
          onboardCount: '',
          recruitCompletionRate: '#DIV/0!',
          totalOnboardRate: '#DIV/0!',
          newRetentionCount: '',
          newRetentionRate: '#DIV/0!',
          currentHeadcount: 0,
          transferCount: 0,
          plannedOptimizeCount: 0,
          actualOptimizeCount: 0,
          resignCount: 0,
          resignRate: '#DIV/0!',
        },
        ...orgs.map((org) => ({
          key: `month-${month}-${org}`,
          rowType: 'month' as const,
          month,
          monthGroupFirstRow: false,
          monthGroupSize: orgs.length + 1,
          department: org,
          authorizedPosts: '',
          currentPosts: '',
          neededPosts: '',
          resumeCount: '',
          inviteCount: '',
          interviewCount: '',
          interviewArrivalRate: '#DIV/0!',
          onboardCount: '',
          recruitCompletionRate: '#DIV/0!',
          totalOnboardRate: '#DIV/0!',
          newRetentionCount: '',
          newRetentionRate: '#DIV/0!',
          currentHeadcount: '',
          transferCount: '',
          plannedOptimizeCount: '',
          actualOptimizeCount: '',
          resignCount: '',
          resignRate: '#DIV/0!',
        })),
      ]
    }).flat(),
  ]
}

const buildTrainingMonthlyData = (scope: DashboardScope): TrainingMonthlyRow[] => {
  const orgs = getScopeOrganizations(scope)
  const includeMonthSubtotalRows = shouldUseMonthSubtotalRows(scope)
  return [
    {
      key: 'training-grand-total',
      rowType: 'grandTotal',
      month: getMonthlyGrandTotalLabel('training', scope),
      monthGroupFirstRow: true,
      monthGroupSize: 1,
      department: '',
      trainingSessions: 0,
      trainingParticipants: 0,
      avgTrainingDuration: 0,
      averageScore: '#DIV/0!',
      passParticipants: 0,
      passList: '',
      failParticipants: 0,
      failList: '',
      passRate: '#DIV/0!',
      avgSatisfactionScore: 0,
      totalTrainingCost: 0,
      perCapitaCost: '#DIV/0!',
    },
    ...(includeMonthSubtotalRows
      ? orgs.map((org, index) => ({
      key: `training-month-subtotal-${org}`,
      rowType: 'monthSubtotal' as const,
      month: '月合计',
      monthGroupFirstRow: index === 0,
      monthGroupSize: orgs.length,
      department: org,
      trainingSessions: 0,
      trainingParticipants: 0,
      avgTrainingDuration: 0,
      averageScore: 0,
      passParticipants: 0,
      passList: '',
      failParticipants: 0,
      failList: '',
      passRate: '#DIV/0!',
      avgSatisfactionScore: 0,
      totalTrainingCost: 0,
      perCapitaCost: '#DIV/0!',
    }))
      : []),
    ...Array.from({ length: 12 }, (_, monthIndex) => {
      const month = String(monthIndex + 1)
      return [
        {
          key: `training-month-total-${month}`,
          rowType: 'month' as const,
          month,
          monthGroupFirstRow: true,
          monthGroupSize: orgs.length + 1,
          department: '合计',
          trainingSessions: 0,
          trainingParticipants: 0,
          avgTrainingDuration: 0,
          averageScore: '#DIV/0!',
          passParticipants: 0,
          passList: '',
          failParticipants: 0,
          failList: '',
          passRate: '#DIV/0!',
          avgSatisfactionScore: 0,
          totalTrainingCost: 0,
          perCapitaCost: '#DIV/0!',
        },
        ...orgs.map((org) => ({
          key: `training-month-${month}-${org}`,
          rowType: 'month' as const,
          month,
          monthGroupFirstRow: false,
          monthGroupSize: orgs.length + 1,
          department: org,
          trainingSessions: '',
          trainingParticipants: '',
          avgTrainingDuration: '',
          averageScore: '',
          passParticipants: '',
          passList: '',
          failParticipants: '',
          failList: '',
          passRate: '#DIV/0!',
          avgSatisfactionScore: '',
          totalTrainingCost: '',
          perCapitaCost: '#DIV/0!',
        })),
      ]
    }).flat(),
  ]
}

const buildSalaryWelfareMonthlyData = (scope: DashboardScope): SalaryWelfareMonthlyRow[] => {
  const orgs = getScopeOrganizations(scope)
  const includeMonthSubtotalRows = shouldUseMonthSubtotalRows(scope)
  return [
    {
      key: 'salary-grand-total',
      rowType: 'grandTotal',
    month: getMonthlyGrandTotalLabel('salary', scope),
      monthGroupFirstRow: true,
      monthGroupSize: 1,
      department: '',
      headcount: 0,
      salary: 0,
      annualWelfareTotal: 0,
      monthlyIncentiveTotal: 0,
      temporaryRewardTotal: 0,
      deduction: 0,
      cadreSalaryTotal: 0,
      staffSalaryTotal: 0,
      salaryTotal: 0,
      avgAnnualSalary: '#DIV/0!',
      cadreSalaryRatio: '#DIV/0!',
      staffSalaryRatio: '#DIV/0!',
      avgAnnualWelfare: '#DIV/0!',
    },
    ...(includeMonthSubtotalRows
      ? orgs.map((org, index) => ({
      key: `salary-month-subtotal-${org}`,
      rowType: 'monthSubtotal' as const,
      month: '月合计',
      monthGroupFirstRow: index === 0,
      monthGroupSize: orgs.length,
      department: org,
      headcount: 0,
      salary: 0,
      annualWelfareTotal: 0,
      monthlyIncentiveTotal: 0,
      temporaryRewardTotal: 0,
      deduction: 0,
      cadreSalaryTotal: 0,
      staffSalaryTotal: 0,
      salaryTotal: 0,
      avgAnnualSalary: '#DIV/0!',
      cadreSalaryRatio: '#DIV/0!',
      staffSalaryRatio: '#DIV/0!',
      avgAnnualWelfare: '#DIV/0!',
    }))
      : []),
    ...Array.from({ length: 12 }, (_, monthIndex) => {
      const month = String(monthIndex + 1)
      return [
        {
          key: `salary-month-total-${month}`,
          rowType: 'month' as const,
          month,
          monthGroupFirstRow: true,
          monthGroupSize: orgs.length + 1,
          department: '合计',
          headcount: 0,
          salary: 0,
          annualWelfareTotal: 0,
          monthlyIncentiveTotal: 0,
          temporaryRewardTotal: 0,
          deduction: 0,
          cadreSalaryTotal: 0,
          staffSalaryTotal: 0,
          salaryTotal: 0,
          avgAnnualSalary: '#DIV/0!',
          cadreSalaryRatio: '#DIV/0!',
          staffSalaryRatio: '#DIV/0!',
          avgAnnualWelfare: '#DIV/0!',
        },
        ...orgs.map((org) => ({
          key: `salary-month-${month}-${org}`,
          rowType: 'month' as const,
          month,
          monthGroupFirstRow: false,
          monthGroupSize: orgs.length + 1,
          department: org,
          headcount: '',
          salary: '',
          annualWelfareTotal: '',
          monthlyIncentiveTotal: '',
          temporaryRewardTotal: '',
          deduction: '',
          cadreSalaryTotal: '',
          staffSalaryTotal: '',
          salaryTotal: '',
          avgAnnualSalary: '#DIV/0!',
          cadreSalaryRatio: '#DIV/0!',
          staffSalaryRatio: '#DIV/0!',
          avgAnnualWelfare: '#DIV/0!',
        })),
      ]
    }).flat(),
  ]
}

const buildSocialInsuranceMonthlyData = (scope: DashboardScope): SocialInsuranceMonthlyRow[] => {
  const orgs = getScopeOrganizations(scope)
  const includeMonthSubtotalRows = shouldUseMonthSubtotalRows(scope)
  return [
    {
      key: 'insurance-grand-total',
      rowType: 'grandTotal',
      month: getMonthlyGrandTotalLabel('insurance', scope),
      monthGroupFirstRow: true,
      monthGroupSize: 1,
      department: '',
      shouldInsureCount: 0,
      actualInsureCount: 0,
      insureRate: '#DIV/0!',
      totalPayment: 0,
      companyTotalPayment: 0,
      personalTotalPayment: 0,
      serviceFeeTotal: 0,
      paymentBase: 0,
      injuryCompanyRate: 0,
      pensionCompanyRate: 0,
      pensionPersonalRate: 0,
      unemploymentCompanyRate: 0,
      unemploymentPersonalRate: 0,
      medicalCompanyRate: 0,
      medicalPersonalRate: 0,
    },
    ...(includeMonthSubtotalRows
      ? orgs.map((org, index) => ({
      key: `insurance-month-subtotal-${org}`,
      rowType: 'monthSubtotal' as const,
      month: '月合计',
      monthGroupFirstRow: index === 0,
      monthGroupSize: orgs.length,
      department: org,
      shouldInsureCount: 0,
      actualInsureCount: 0,
      insureRate: '#DIV/0!',
      totalPayment: 0,
      companyTotalPayment: 0,
      personalTotalPayment: 0,
      serviceFeeTotal: 0,
      paymentBase: 0,
      injuryCompanyRate: 0,
      pensionCompanyRate: 0,
      pensionPersonalRate: 0,
      unemploymentCompanyRate: 0,
      unemploymentPersonalRate: 0,
      medicalCompanyRate: 0,
      medicalPersonalRate: 0,
    }))
      : []),
    ...Array.from({ length: 12 }, (_, monthIndex) => {
      const month = String(monthIndex + 1)
      return [
        {
          key: `insurance-month-total-${month}`,
          rowType: 'month' as const,
          month,
          monthGroupFirstRow: true,
          monthGroupSize: orgs.length + 1,
          department: '合计',
          shouldInsureCount: 0,
          actualInsureCount: 0,
          insureRate: '#DIV/0!',
          totalPayment: 0,
          companyTotalPayment: 0,
          personalTotalPayment: 0,
          serviceFeeTotal: 0,
          paymentBase: '0.00',
          injuryCompanyRate: 0,
          pensionCompanyRate: 0,
          pensionPersonalRate: 0,
          unemploymentCompanyRate: 0,
          unemploymentPersonalRate: 0,
          medicalCompanyRate: 0,
          medicalPersonalRate: 0,
        },
        ...orgs.map((org) => ({
          key: `insurance-month-${month}-${org}`,
          rowType: 'month' as const,
          month,
          monthGroupFirstRow: false,
          monthGroupSize: orgs.length + 1,
          department: org,
          shouldInsureCount: '',
          actualInsureCount: '',
          insureRate: '#DIV/0!',
          totalPayment: '',
          companyTotalPayment: '',
          personalTotalPayment: '',
          serviceFeeTotal: '',
          paymentBase: '0.00' as const,
          injuryCompanyRate: '',
          pensionCompanyRate: '',
          pensionPersonalRate: '',
          unemploymentCompanyRate: '',
          unemploymentPersonalRate: '',
          medicalCompanyRate: '',
          medicalPersonalRate: '',
        })),
      ]
    }).flat(),
  ]
}

const mapMonthlyRowsForScope = <T extends { department: string }>(rows: T[], scope: DashboardScope): T[] => {
  return rows.map((row) => ({
    ...row,
    department: toScopeDisplayDepartment(scope, row.department),
  }))
}

const getSalaryWelfareColumnsByScope = (scope: DashboardScope): ColumnsType<SalaryWelfareMonthlyRow> => {
  if (scope !== 'hq') {
    return salaryWelfareMonthlyColumnsOnline
  }
  return salaryWelfareMonthlyColumnsDefault
}

const getHrAllocationColumnsByScope = (scope: DashboardScope): ColumnsType<HrAllocationMonthlyRow> => {
  if (scope !== 'hq') {
    return hrAllocationMonthlyColumnsOnline
  }
  return hrAllocationMonthlyColumnsDefault
}

const getTrainingColumnsByScope = (_scope: DashboardScope): ColumnsType<TrainingMonthlyRow> => {
  return trainingMonthlyColumnsDefault
}

const getSocialInsuranceColumnsByScope = (scope: DashboardScope): ColumnsType<SocialInsuranceMonthlyRow> => {
  if (scope !== 'hq') {
    return socialInsuranceMonthlyColumnsOnline
  }
  return socialInsuranceMonthlyColumnsDefault
}

interface MonthlyDashboardPageProps {
  scope?: DashboardScope
  pageTitle?: string
  businessLabel?: string
}

const HqMonthlyDashboard: React.FC<MonthlyDashboardPageProps> = ({
  scope = 'hq',
  pageTitle = '003 最高议事厅月度核心数据看板',
  businessLabel = '最高议事厅',
}) => {
  const { message } = App.useApp()
  const hrOrgColumnTitle = useMemo(() => getMonthlySectionOrgColumnTitle('hr', scope), [scope])
  const trainingOrgColumnTitle = useMemo(() => getMonthlySectionOrgColumnTitle('training', scope), [scope])
  const salaryOrgColumnTitle = useMemo(() => getMonthlySectionOrgColumnTitle('salary', scope), [scope])
  const insuranceOrgColumnTitle = useMemo(() => getMonthlySectionOrgColumnTitle('insurance', scope), [scope])
  const defaultHrRows = useMemo(() => buildHrAllocationMonthlyData(scope), [scope])
  const defaultTrainingRows = useMemo(() => buildTrainingMonthlyData(scope), [scope])
  const defaultSalaryRows = useMemo(() => buildSalaryWelfareMonthlyData(scope), [scope])
  const defaultInsuranceRows = useMemo(() => buildSocialInsuranceMonthlyData(scope), [scope])
  const hrColumns = useMemo(() => patchDepartmentColumnTitle(getHrAllocationColumnsByScope(scope), hrOrgColumnTitle), [hrOrgColumnTitle, scope])
  const trainingColumns = useMemo(() => patchDepartmentColumnTitle(getTrainingColumnsByScope(scope), trainingOrgColumnTitle), [trainingOrgColumnTitle, scope])
  const salaryColumns = useMemo(() => patchDepartmentColumnTitle(getSalaryWelfareColumnsByScope(scope), salaryOrgColumnTitle), [salaryOrgColumnTitle, scope])
  const insuranceColumns = useMemo(() => patchDepartmentColumnTitle(getSocialInsuranceColumnsByScope(scope), insuranceOrgColumnTitle), [insuranceOrgColumnTitle, scope])
  const [selectedYear, setSelectedYear] = useState<Dayjs>(dayjs())
  const [loading, setLoading] = useState(false)
  const [hrRows, setHrRows] = useState<HrAllocationMonthlyRow[]>(defaultHrRows)
  const [trainingRows, setTrainingRows] = useState<TrainingMonthlyRow[]>(defaultTrainingRows)
  const [salaryRows, setSalaryRows] = useState<SalaryWelfareMonthlyRow[]>(defaultSalaryRows)
  const [insuranceRows, setInsuranceRows] = useState<SocialInsuranceMonthlyRow[]>(defaultInsuranceRows)

  useEffect(() => {
    let active = true
    setLoading(true)
    setHrRows(defaultHrRows)
    setTrainingRows(defaultTrainingRows)
    setSalaryRows(defaultSalaryRows)
    setInsuranceRows(defaultInsuranceRows)
    getDashboardMonthly(scope, selectedYear.format('YYYY'))
      .then((response) => {
        if (!active) return
        const nextHrRows = sortMonthlyRows(mapMonthlyRowsForScope((response.sections.hr_allocation?.rows as HrAllocationMonthlyRow[]) || [], scope))
        const nextTrainingRows = sortMonthlyRows(mapMonthlyRowsForScope((response.sections.training?.rows as TrainingMonthlyRow[]) || [], scope))
        const nextRawSalaryRows = sortMonthlyRows(mapMonthlyRowsForScope((response.sections.salary_welfare?.rows as SalaryWelfareMonthlyRow[]) || [], scope))
        const nextSalaryRows = enrichSalaryRows(nextRawSalaryRows, nextHrRows)
        const nextInsuranceRows = sortMonthlyRows(mapMonthlyRowsForScope((response.sections.social_insurance?.rows as SocialInsuranceMonthlyRow[]) || [], scope))
        setHrRows(nextHrRows.length ? nextHrRows : defaultHrRows)
        setTrainingRows(nextTrainingRows.length ? nextTrainingRows : defaultTrainingRows)
        setSalaryRows(nextSalaryRows.length ? nextSalaryRows : enrichSalaryRows(defaultSalaryRows, nextHrRows.length ? nextHrRows : defaultHrRows))
        setInsuranceRows(nextInsuranceRows.length ? nextInsuranceRows : defaultInsuranceRows)
      })
      .catch((error) => {
        if (!active) return
        console.error(`加载${businessLabel}月度看板失败`, error)
        message.error(`加载${businessLabel}月度看板失败`)
        setHrRows(defaultHrRows)
        setTrainingRows(defaultTrainingRows)
        setSalaryRows(enrichSalaryRows(defaultSalaryRows, defaultHrRows))
        setInsuranceRows(defaultInsuranceRows)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [businessLabel, defaultHrRows, defaultInsuranceRows, defaultSalaryRows, defaultTrainingRows, scope, selectedYear])

  const tabItems = [
    {
      key: 'mgnt-hr-allocation',
      label: `三级-${businessLabel}(人力资源配置)`,
      children: (
        <>
          <Typography.Title level={5} style={{ margin: '4px 0 12px' }}>
            {businessLabel}月度核心数据看板-人力资源配置
          </Typography.Title>
          <Table<HrAllocationMonthlyRow>
            columns={hrColumns}
            dataSource={hrRows}
            bordered
            loading={loading}
            pagination={false}
            size="small"
            scroll={{ x: 2100 }}
          />
        </>
      ),
    },
    {
      key: 'mgnt-training',
      label: `三级-${businessLabel}(培训)`,
      children: (
        <>
          <Typography.Title level={5} style={{ margin: '4px 0 12px' }}>
            {businessLabel}月度核心数据看板-培训
          </Typography.Title>
          <Table<TrainingMonthlyRow>
            columns={trainingColumns}
            dataSource={trainingRows}
            bordered
            loading={loading}
            pagination={false}
            size="small"
            scroll={{ x: 1700 }}
          />
        </>
      ),
    },
    {
      key: 'mgnt-salary-welfare',
      label: `三级-${businessLabel}(薪酬福利)`,
      children: (
        <>
          <Typography.Title level={5} style={{ margin: '4px 0 12px' }}>
            {businessLabel}月度核心数据看板-薪酬及福利
          </Typography.Title>
          <Table<SalaryWelfareMonthlyRow>
            columns={salaryColumns}
            dataSource={salaryRows}
            bordered
            loading={loading}
            pagination={false}
            size="small"
            scroll={{ x: 1200 }}
          />
        </>
      ),
    },
    {
      key: 'mgnt-social-insurance',
      label: `三级-${businessLabel}(社保)`,
      children: (
        <>
          <Typography.Title level={5} style={{ margin: '4px 0 12px' }}>
            {businessLabel}月度核心数据看板-社保
          </Typography.Title>
          <Table<SocialInsuranceMonthlyRow>
            columns={insuranceColumns}
            dataSource={insuranceRows}
            bordered
            loading={loading}
            pagination={false}
            size="small"
            scroll={{ x: 2100 }}
          />
        </>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Typography.Title level={4} style={{ marginBottom: 0 }}>
              {pageTitle}
            </Typography.Title>
            <DatePicker
              picker="year"
              allowClear={false}
              value={selectedYear}
              onChange={(value) => value && setSelectedYear(value)}
            />
          </Space>
        </Space>
        <Tabs items={tabItems} />
      </Card>
    </div>
  )
}

export default HqMonthlyDashboard
