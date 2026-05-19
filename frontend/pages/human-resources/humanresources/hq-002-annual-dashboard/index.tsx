import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, DatePicker, Space, Table, Tabs, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'

import { getDashboardAnnual, type DashboardAnnualResponse } from '@/services/humanresources/dashboardAnnual'
import {
  type DashboardScope,
  HQ_DIVISIONS,
  OFFLINE_CAMPUSES,
  ONLINE_DIVISIONS,
  getScopeOrganizations,
  getScopeOrgColumnTitle,
  toScopeDisplayDepartment,
} from '../shared/monthlyDashboardShared'

/**
 * 002 最高议事厅年度核心数据看板
 * 最高议事厅 -> 人事部 -> 集团总部
 * 路由: /humanresources/hq/annual-dashboard
 */
type AnnualDashboardScope = DashboardScope
type CellValue = number | string | ''

const getAnnualDetailOrgColumnTitle = (scope: AnnualDashboardScope): string => {
  if (scope === 'offline' || scope === 'online') {
    return '神殿'
  }

  return '部门'
}

// --- Online scope helpers ---

const toDisplayDivision = (division: unknown): string => {
  const value = String(division || '')
  return toScopeDisplayDepartment('online', value)
}

const getValue = (row: Record<string, any> | undefined, key: string, fallback: CellValue = ''): CellValue => {
  if (!row || row[key] === undefined || row[key] === null) {
    return fallback
  }
  return row[key] as CellValue
}

const numberValue = (value: unknown): number => {
  if (value === null || value === undefined || value === '') {
    return 0
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const averageValues = (values: unknown[]): CellValue => {
  const numericValues = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))

  if (!numericValues.length) {
    return ''
  }

  return Number((numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length).toFixed(2))
}

interface ManagementCenterRow {
  key: string
  sequence: number
  division: string
  deptCount: CellValue
  cadreCount: CellValue
  staffCount: CellValue
  interviewCount: CellValue
  onboardCount: CellValue
  onboardRate: string
  transferCount: CellValue
  optimizeCount: CellValue
  resignCount: CellValue
  resignRate: string | ''
  trainingSessions1: CellValue
  trainingSessions2: CellValue
  trainingParticipants: CellValue
  trainingPassRate: string | ''
  annualSalaryTotal: CellValue
  annualSalaryPerCapita: CellValue
  annualWelfareTotal: CellValue
  studentCount: CellValue
  resumeCount: CellValue
  performanceAverage: CellValue
}

const buildManagementCenterData = (scope: AnnualDashboardScope): ManagementCenterRow[] => {
  const organizations = getScopeOrganizations(scope)

  return [
    {
      key: '1',
      sequence: 1,
      division: '合计',
      deptCount: 0,
      cadreCount: 0,
      staffCount: 0,
      interviewCount: 0,
      onboardCount: 0,
      onboardRate: '#DIV/0!',
      transferCount: '',
      optimizeCount: '',
      resignCount: '',
      resignRate: '',
      trainingSessions1: '',
      trainingSessions2: '',
      trainingParticipants: '',
      trainingPassRate: '',
      annualSalaryTotal: '',
      annualSalaryPerCapita: '',
      annualWelfareTotal: '',
      studentCount: '',
      resumeCount: '',
      performanceAverage: '',
    },
    ...organizations.map((division, index) => ({
      key: `summary-${index + 2}`,
      sequence: index + 2,
      division,
      deptCount: 0,
      cadreCount: 0,
      staffCount: 0,
      interviewCount: 0,
      onboardCount: 0,
      onboardRate: '#DIV/0!',
      transferCount: '',
      optimizeCount: '',
      resignCount: '',
      resignRate: '',
      trainingSessions1: '',
      trainingSessions2: '',
      trainingParticipants: '',
      trainingPassRate: '',
      annualSalaryTotal: '',
      annualSalaryPerCapita: '',
      annualWelfareTotal: '',
      studentCount: '',
      resumeCount: '',
      performanceAverage: '',
    })),
  ]
}

const createManagementCenterColumns = (scope: AnnualDashboardScope): ColumnsType<ManagementCenterRow> => [
  {
    title: '序号',
    dataIndex: 'sequence',
    key: 'sequence',
    width: 90,
    align: 'center',
  },
  {
    title: getScopeOrgColumnTitle(scope),
    dataIndex: 'division',
    key: 'division',
    width: 120,
    align: 'center',
  },
  {
    title: '职数和部门员工数',
    children: [
      {
        title: '部门人数',
        dataIndex: 'deptCount',
        key: 'deptCount',
        width: 100,
        align: 'center',
      },
      {
        title: '干部数量',
        dataIndex: 'cadreCount',
        key: 'cadreCount',
        width: 100,
        align: 'center',
      },
      {
        title: '员工数量',
        dataIndex: 'staffCount',
        key: 'staffCount',
        width: 100,
        align: 'center',
      },
      ...(scope === 'online' ? [{
        title: '学生数量',
        dataIndex: 'studentCount' as const,
        key: 'studentCount',
        width: 110,
        align: 'center' as const,
      }] : []),
    ],
  },
  {
    title: '招聘及入职',
    children: [
      ...(scope !== 'hq' ? [{
        title: '简历数',
        dataIndex: 'resumeCount' as const,
        key: 'resumeCount',
        width: 100,
        align: 'center' as const,
      }] : []),
      {
        title: '面试人数',
        dataIndex: 'interviewCount',
        key: 'interviewCount',
        width: 100,
        align: 'center',
      },
      {
        title: '入职人数',
        dataIndex: 'onboardCount',
        key: 'onboardCount',
        width: 100,
        align: 'center',
      },
      {
        title: '入职率',
        dataIndex: 'onboardRate',
        key: 'onboardRate',
        width: 100,
        align: 'center',
      },
    ],
  },
  {
    title: '人力资源规划',
    children: [
      {
        title: '调岗人数',
        dataIndex: 'transferCount',
        key: 'transferCount',
        width: 100,
        align: 'center',
      },
      {
        title: '实际优化人数',
        dataIndex: 'optimizeCount',
        key: 'optimizeCount',
        width: 120,
        align: 'center',
      },
      {
        title: '离职人数',
        dataIndex: 'resignCount',
        key: 'resignCount',
        width: 100,
        align: 'center',
      },
      {
        title: '离职率',
        dataIndex: 'resignRate',
        key: 'resignRate',
        width: 100,
        align: 'center',
      },
    ],
  },
  {
    title: '培训',
    children: [
      {
        title: '培训场次',
        dataIndex: 'trainingSessions1',
        key: 'trainingSessions1',
        width: 100,
        align: 'center',
      },
      {
        title: '培训人次',
        dataIndex: 'trainingParticipants',
        key: 'trainingParticipants',
        width: 100,
        align: 'center',
      },
      {
        title: '培训合格率',
        dataIndex: 'trainingPassRate',
        key: 'trainingPassRate',
        width: 110,
        align: 'center',
      },
    ],
  },
  {
    title: '薪酬及福利',
    children: [
      {
        title: '年度薪酬总额',
        dataIndex: 'annualSalaryTotal',
        key: 'annualSalaryTotal',
        width: 130,
        align: 'center',
      },
      {
        title: '人均年度薪酬',
        dataIndex: 'annualSalaryPerCapita',
        key: 'annualSalaryPerCapita',
        width: 130,
        align: 'center',
      },
      {
        title: '年度福利总额',
        dataIndex: 'annualWelfareTotal',
        key: 'annualWelfareTotal',
        width: 120,
        align: 'center',
      },
    ],
  },
]

interface PostAndStaffRow {
  key: string
  rowType: 'yearEnd' | 'grandTotal' | 'monthSubtotal' | 'month'
  month: string
  monthGroupFirstRow: boolean
  monthGroupSize: number
  division: string
  postCount: CellValue
  cadreCount: CellValue
  staffCount: CellValue
  cadreTargetRatio: string
  cadreActualRatio: string
  studentCount: CellValue
}

const buildPostAndStaffData = (scope: AnnualDashboardScope): PostAndStaffRow[] => {
  const organizations = getScopeOrganizations(scope)

  return [
    {
      key: 'year-end',
      rowType: 'yearEnd',
      month: '年末人数',
      monthGroupFirstRow: true,
      monthGroupSize: 1,
      division: '',
      postCount: 0,
      cadreCount: 0,
      staffCount: 0,
      cadreTargetRatio: '#DIV/0!',
      cadreActualRatio: '#DIV/0!',
      studentCount: scope === 'online' ? '#VALUE!' : '',
    },
    ...Array.from({ length: 12 }, (_, monthIndex) => {
      const month = String(monthIndex + 1)
      return organizations.map((division, divisionIndex) => ({
        key: `month-${month}-${division}`,
        rowType: 'month' as const,
        month,
        monthGroupFirstRow: divisionIndex === 0,
        monthGroupSize: organizations.length,
        division,
        postCount: '',
        cadreCount: '',
        staffCount: '',
        cadreTargetRatio: '#DIV/0!',
        cadreActualRatio: '#DIV/0!',
        studentCount: scope === 'online' ? (divisionIndex === 0 ? '来自教化司' : '') : '',
      }))
    }).flat(),
  ]
}

const createPostAndStaffColumns = (scope: AnnualDashboardScope): ColumnsType<PostAndStaffRow> => {
  return [
  {
    title: '月份',
    dataIndex: 'month',
    key: 'month',
    width: 90,
    align: 'center',
    onCell: (record) => {
      if (record.rowType === 'yearEnd' || record.rowType === 'grandTotal') {
        return { rowSpan: 1 }
      }

      return {
        rowSpan: record.monthGroupFirstRow ? record.monthGroupSize : 0,
      }
    },
  },
  {
    title: getAnnualDetailOrgColumnTitle(scope),
    dataIndex: 'division',
    key: 'division',
    width: 120,
    align: 'center',
  },
  {
    title: '现有职数',
    dataIndex: 'postCount',
    key: 'postCount',
    width: 120,
    align: 'center',
  },
  {
    title: '干部数量',
    dataIndex: 'cadreCount',
    key: 'cadreCount',
    width: 120,
    align: 'center',
  },
  {
    title: '员工数量',
    dataIndex: 'staffCount',
    key: 'staffCount',
    width: 120,
    align: 'center',
  },
  {
    title: '干部目标配比',
    dataIndex: 'cadreTargetRatio',
    key: 'cadreTargetRatio',
    width: 140,
    align: 'center',
  },
  {
    title: '干部实际配比',
    dataIndex: 'cadreActualRatio',
    key: 'cadreActualRatio',
    width: 140,
    align: 'center',
  },
  ...(scope === 'online' ? [{
    title: '学生数量',
    dataIndex: 'studentCount' as const,
    key: 'studentCount',
    width: 140,
    align: 'center' as const,
    onCell: (record: PostAndStaffRow) => {
      if (record.rowType === 'yearEnd' || record.rowType === 'grandTotal') {
        return { rowSpan: 1 }
      }
      return { rowSpan: record.monthGroupFirstRow ? record.monthGroupSize : 0 }
    },
  }] : []),
]
}

interface HrAllocationRow {
  key: string
  rowType: 'yearTotal' | 'grandTotal' | 'monthSubtotal' | 'month'
  sequence: string
  sequenceGroupFirstRow: boolean
  sequenceGroupSize: number
  division: string
  requiredRecruitment: CellValue
  resumeCount: CellValue
  inviteCount: CellValue
  interviewCount: CellValue
  interviewArrivalRate: string
  onboardCount: CellValue
  recruitmentCompletionRate: string
  totalOnboardRate: string
  newStaffRetentionCount: CellValue
  newStaffRetentionRate: string
  transferCount: CellValue
  optimizeCount: CellValue
  resignCount: CellValue
  resignRate: string
}

const buildHrAllocationData = (scope: AnnualDashboardScope): HrAllocationRow[] => {
  const organizations = getScopeOrganizations(scope)

  return [
    {
      key: 'year-total',
      rowType: 'yearTotal',
      sequence: '年度合计',
      sequenceGroupFirstRow: true,
      sequenceGroupSize: 1,
      division: '',
      requiredRecruitment: 0,
      resumeCount: 0,
      inviteCount: 0,
      interviewCount: 0,
      interviewArrivalRate: '#DIV/0!',
      onboardCount: 0,
      recruitmentCompletionRate: '#DIV/0!',
      totalOnboardRate: '#DIV/0!',
      newStaffRetentionCount: 0,
      newStaffRetentionRate: '#DIV/0!',
      transferCount: 0,
      optimizeCount: 0,
      resignCount: 0,
      resignRate: '#DIV/0!',
    },
    ...Array.from({ length: 12 }, (_, monthIndex) => {
      const sequence = String(monthIndex + 1)
      return organizations.map((division, divisionIndex) => ({
        key: `allocation-${sequence}-${division}`,
        rowType: 'month' as const,
        sequence,
        sequenceGroupFirstRow: divisionIndex === 0,
        sequenceGroupSize: organizations.length,
        division,
        requiredRecruitment: '',
        resumeCount: '',
        inviteCount: '',
        interviewCount: '',
        interviewArrivalRate: '#DIV/0!',
        onboardCount: '',
        recruitmentCompletionRate: '#DIV/0!',
        totalOnboardRate: '#DIV/0!',
        newStaffRetentionCount: '',
        newStaffRetentionRate: '#DIV/0!',
        transferCount: '',
        optimizeCount: '',
        resignCount: '',
        resignRate: '#DIV/0!',
      }))
    }).flat(),
  ]
}

const createHrAllocationColumns = (scope: AnnualDashboardScope): ColumnsType<HrAllocationRow> => {
  return [
  {
    title: '序号',
    dataIndex: 'sequence',
    key: 'sequence',
    width: 90,
    align: 'center',
    onCell: (record) => {
      if (record.rowType === 'yearTotal' || record.rowType === 'grandTotal') {
        return { rowSpan: 1 }
      }
      return {
        rowSpan: record.sequenceGroupFirstRow ? record.sequenceGroupSize : 0,
      }
    },
  },
  {
    title: getAnnualDetailOrgColumnTitle(scope),
    dataIndex: 'division',
    key: 'division',
    width: 100,
    align: 'center',
  },
  {
    title: '需招聘职数',
    dataIndex: 'requiredRecruitment',
    key: 'requiredRecruitment',
    width: 110,
    align: 'center',
  },
  {
    title: '简历数',
    dataIndex: 'resumeCount',
    key: 'resumeCount',
    width: 90,
    align: 'center',
  },
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
    dataIndex: 'recruitmentCompletionRate',
    key: 'recruitmentCompletionRate',
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
    dataIndex: 'newStaffRetentionCount',
    key: 'newStaffRetentionCount',
    width: 110,
    align: 'center',
  },
  {
    title: '新员工留存率',
    dataIndex: 'newStaffRetentionRate',
    key: 'newStaffRetentionRate',
    width: 110,
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
    title: '优化人数',
    dataIndex: 'optimizeCount',
    key: 'optimizeCount',
    width: 90,
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
}

interface TrainingRow {
  key: string
  rowType: 'yearTotal' | 'grandTotal' | 'monthSubtotal' | 'month'
  sequence: string
  sequenceGroupFirstRow: boolean
  sequenceGroupSize: number
  division: string
  trainingSessions: CellValue
  trainingParticipants: CellValue
  averageScore: CellValue
  passParticipants: CellValue
  failParticipants: CellValue
  passRate: string
  avgTrainingDuration: CellValue
  avgSatisfactionScore: CellValue
  totalTrainingCost: CellValue
}

const buildTrainingData = (scope: AnnualDashboardScope): TrainingRow[] => {
  const organizations = getScopeOrganizations(scope)

  return [
    {
      key: 'training-year-total',
      rowType: 'yearTotal',
      sequence: '年度合计',
      sequenceGroupFirstRow: true,
      sequenceGroupSize: 1,
      division: '',
      trainingSessions: 0,
      trainingParticipants: 0,
      averageScore: 0,
      passParticipants: 0,
      failParticipants: 0,
      passRate: '#DIV/0!',
      avgTrainingDuration: 0,
      avgSatisfactionScore: 0,
      totalTrainingCost: 0,
    },
    ...Array.from({ length: 12 }, (_, monthIndex) => {
      const sequence = String(monthIndex + 1)
      return organizations.map((division, divisionIndex) => ({
        key: `training-${sequence}-${division}`,
        rowType: 'month' as const,
        sequence,
        sequenceGroupFirstRow: divisionIndex === 0,
        sequenceGroupSize: organizations.length,
        division,
        trainingSessions: '',
        trainingParticipants: '',
        averageScore: '',
        passParticipants: '',
        failParticipants: '',
        passRate: '#DIV/0!',
        avgTrainingDuration: '',
        avgSatisfactionScore: '',
        totalTrainingCost: '',
      }))
    }).flat(),
  ]
}

const createTrainingColumns = (scope: AnnualDashboardScope): ColumnsType<TrainingRow> => {
  return [
  {
    title: '序号',
    dataIndex: 'sequence',
    key: 'sequence',
    width: 90,
    align: 'center',
    onCell: (record) => {
      if (record.rowType === 'yearTotal' || record.rowType === 'grandTotal') {
        return { rowSpan: 1 }
      }
      return {
        rowSpan: record.sequenceGroupFirstRow ? record.sequenceGroupSize : 0,
      }
    },
  },
  {
    title: getAnnualDetailOrgColumnTitle(scope),
    dataIndex: 'division',
    key: 'division',
    width: 100,
    align: 'center',
  },
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
    width: 100,
    align: 'center',
  },
  {
    title: '不合格人次',
    dataIndex: 'failParticipants',
    key: 'failParticipants',
    width: 100,
    align: 'center',
  },
  {
    title: '培训合格率',
    dataIndex: 'passRate',
    key: 'passRate',
    width: 100,
    align: 'center',
  },
  {
    title: '员工平均参训时长',
    dataIndex: 'avgTrainingDuration',
    key: 'avgTrainingDuration',
    width: 120,
    align: 'center',
  },
  {
    title: '培训满意度平均分',
    dataIndex: 'avgSatisfactionScore',
    key: 'avgSatisfactionScore',
    width: 120,
    align: 'center',
  },
  {
    title: '培训投入总费用',
    dataIndex: 'totalTrainingCost',
    key: 'totalTrainingCost',
    width: 110,
    align: 'center',
  },
]
}

interface SalaryWelfareRow {
  key: string
  rowType: 'yearTotal' | 'grandTotal' | 'monthSubtotal' | 'month'
  sequence: string
  sequenceGroupFirstRow: boolean
  sequenceGroupSize: number
  division: string
  salaryTotal: CellValue
  perCapitaSalary: CellValue
  cadreAverageSalary: CellValue
  staffAverageSalary: CellValue
  welfareTotal: CellValue
}

const buildSalaryWelfareData = (scope: AnnualDashboardScope): SalaryWelfareRow[] => {
  const organizations = getScopeOrganizations(scope)

  return [
    {
      key: 'salary-year-total',
      rowType: 'yearTotal',
      sequence: '年度合计',
      sequenceGroupFirstRow: true,
      sequenceGroupSize: 1,
      division: '',
      salaryTotal: 0,
      perCapitaSalary: '#DIV/0!',
      cadreAverageSalary: 0,
      staffAverageSalary: 0,
      welfareTotal: 0,
    },
    ...Array.from({ length: 12 }, (_, monthIndex) => {
      const sequence = String(monthIndex + 1)
      return organizations.map((division, divisionIndex) => ({
        key: `salary-${sequence}-${division}`,
        rowType: 'month' as const,
        sequence,
        sequenceGroupFirstRow: divisionIndex === 0,
        sequenceGroupSize: organizations.length,
        division,
        salaryTotal: '',
        perCapitaSalary: '',
        cadreAverageSalary: '',
        staffAverageSalary: '',
        welfareTotal: '',
      }))
    }).flat(),
  ]
}

const createSalaryWelfareColumns = (scope: AnnualDashboardScope): ColumnsType<SalaryWelfareRow> => {
  return [
  {
    title: '序号',
    dataIndex: 'sequence',
    key: 'sequence',
    width: 90,
    align: 'center',
    onCell: (record) => {
      if (record.rowType === 'yearTotal' || record.rowType === 'grandTotal') {
        return { rowSpan: 1 }
      }
      return {
        rowSpan: record.sequenceGroupFirstRow ? record.sequenceGroupSize : 0,
      }
    },
  },
  {
    title: getAnnualDetailOrgColumnTitle(scope),
    dataIndex: 'division',
    key: 'division',
    width: 100,
    align: 'center',
  },
  {
    title: '薪酬总额',
    dataIndex: 'salaryTotal',
    key: 'salaryTotal',
    width: 100,
    align: 'center',
  },
  {
    title: '人均薪酬',
    dataIndex: 'perCapitaSalary',
    key: 'perCapitaSalary',
    width: 100,
    align: 'center',
  },
  {
    title: '干部平均薪酬',
    dataIndex: 'cadreAverageSalary',
    key: 'cadreAverageSalary',
    width: 110,
    align: 'center',
  },
  {
    title: '基层平均薪酬',
    dataIndex: 'staffAverageSalary',
    key: 'staffAverageSalary',
    width: 110,
    align: 'center',
  },
  {
    title: '福利总额',
    dataIndex: 'welfareTotal',
    key: 'welfareTotal',
    width: 100,
    align: 'center',
  },
]
}

interface SocialInsuranceRow {
  key: string
  rowType: 'yearTotal' | 'grandTotal' | 'monthSubtotal' | 'month'
  sequence: string
  sequenceGroupFirstRow: boolean
  sequenceGroupSize: number
  division: string
  shouldInsureCount: CellValue
  actualInsureCount: CellValue
  insureRate: string
  totalPayment: CellValue
  companyPayment: CellValue
  personalPayment: CellValue
  serviceFee: CellValue
}

interface SummarySocialInsuranceRow {
  key: string
  sequence: number
  division: string
  annualWelfareTotal: CellValue
  shouldInsureCount: CellValue
  actualInsureCount: CellValue
  insureRate: string | ''
  insurancePayTotal: CellValue
}

const buildSummarySocialInsuranceData = (scope: AnnualDashboardScope): SummarySocialInsuranceRow[] => {
  if (scope !== 'offline') {
    return []
  }

  return [
    {
      key: 'summary-insurance-total',
      sequence: 1,
      division: '合计',
      annualWelfareTotal: '',
      shouldInsureCount: '',
      actualInsureCount: '',
      insureRate: '',
      insurancePayTotal: '',
    },
    ...OFFLINE_CAMPUSES.map((division, index) => ({
      key: `summary-insurance-${division}`,
      sequence: index + 2,
      division,
      annualWelfareTotal: '',
      shouldInsureCount: '',
      actualInsureCount: '',
      insureRate: '',
      insurancePayTotal: '',
    })),
  ]
}

const buildSummarySocialInsuranceFromSummaryRows = (
  rows: Record<string, any>[],
  scope: AnnualDashboardScope,
): SummarySocialInsuranceRow[] => {
  if (scope !== 'offline') {
    return []
  }

  const summaryRows = rows || []
  const summaryMap = new Map(summaryRows.filter((row) => row.division).map((row) => [String(row.division), row]))
  const totalRow = summaryRows.find((row) => row.division === '合计')

  return [
    {
      key: 'summary-insurance-total',
      sequence: 1,
      division: '合计',
      annualWelfareTotal: getValue(totalRow, 'annualWelfareTotal', ''),
      shouldInsureCount: getValue(totalRow, 'shouldInsureCount', ''),
      actualInsureCount: getValue(totalRow, 'actualInsureCount', ''),
      insureRate: String(getValue(totalRow, 'insureRate', '')),
      insurancePayTotal: getValue(totalRow, 'insurancePayTotal', ''),
    },
    ...OFFLINE_CAMPUSES.map((division, index) => {
      const row = summaryMap.get(division)
      return {
        key: `summary-insurance-${division}`,
        sequence: index + 2,
        division,
        annualWelfareTotal: getValue(row, 'annualWelfareTotal', ''),
        shouldInsureCount: getValue(row, 'shouldInsureCount', ''),
        actualInsureCount: getValue(row, 'actualInsureCount', ''),
        insureRate: String(getValue(row, 'insureRate', '')),
        insurancePayTotal: getValue(row, 'insurancePayTotal', ''),
      }
    }),
  ]
}

const buildSocialInsuranceData = (scope: AnnualDashboardScope): SocialInsuranceRow[] => {
  const organizations = getScopeOrganizations(scope)

  return [
    {
      key: 'insurance-year-total',
      rowType: 'yearTotal',
      sequence: '年度合计',
      sequenceGroupFirstRow: true,
      sequenceGroupSize: 1,
      division: '',
      shouldInsureCount: 0,
      actualInsureCount: 0,
      insureRate: '#DIV/0!',
      totalPayment: 0,
      companyPayment: 0,
      personalPayment: 0,
      serviceFee: 0,
    },
    ...Array.from({ length: 12 }, (_, monthIndex) => {
      const sequence = String(monthIndex + 1)
      return organizations.map((division, divisionIndex) => ({
        key: `insurance-${sequence}-${division}`,
        rowType: 'month' as const,
        sequence,
        sequenceGroupFirstRow: divisionIndex === 0,
        sequenceGroupSize: organizations.length,
        division,
        shouldInsureCount: '',
        actualInsureCount: '',
        insureRate: '#DIV/0!',
        totalPayment: '',
        companyPayment: '',
        personalPayment: '',
        serviceFee: '',
      }))
    }).flat(),
  ]
}

const createSocialInsuranceColumns = (scope: AnnualDashboardScope): ColumnsType<SocialInsuranceRow> => {
  return [
  {
    title: '序号',
    dataIndex: 'sequence',
    key: 'sequence',
    width: 90,
    align: 'center',
    onCell: (record) => {
      if (record.rowType === 'yearTotal' || record.rowType === 'grandTotal') {
        return { rowSpan: 1 }
      }
      return {
        rowSpan: record.sequenceGroupFirstRow ? record.sequenceGroupSize : 0,
      }
    },
  },
  {
    title: getAnnualDetailOrgColumnTitle(scope),
    dataIndex: 'division',
    key: 'division',
    width: 100,
    align: 'center',
  },
  {
    title: '应参保人数',
    dataIndex: 'shouldInsureCount',
    key: 'shouldInsureCount',
    width: 110,
    align: 'center',
  },
  {
    title: '实际参保人数',
    dataIndex: 'actualInsureCount',
    key: 'actualInsureCount',
    width: 120,
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
    dataIndex: 'companyPayment',
    key: 'companyPayment',
    width: 120,
    align: 'center',
  },
  {
    title: '个人缴纳总额',
    dataIndex: 'personalPayment',
    key: 'personalPayment',
    width: 120,
    align: 'center',
  },
  {
    title: '服务费',
    dataIndex: 'serviceFee',
    key: 'serviceFee',
    width: 90,
    align: 'center',
  },
]
}

const createSummarySocialInsuranceColumns = (scope: AnnualDashboardScope): ColumnsType<SummarySocialInsuranceRow> => [
  {
    title: '序号',
    dataIndex: 'sequence',
    key: 'sequence',
    width: 90,
    align: 'center',
  },
  {
    title: getAnnualDetailOrgColumnTitle(scope),
    dataIndex: 'division',
    key: 'division',
    width: 100,
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
    title: '应参保人数',
    dataIndex: 'shouldInsureCount',
    key: 'shouldInsureCount',
    width: 110,
    align: 'center',
  },
  {
    title: '实际参保人数',
    dataIndex: 'actualInsureCount',
    key: 'actualInsureCount',
    width: 120,
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
    title: '社保缴纳总额',
    dataIndex: 'insurancePayTotal',
    key: 'insurancePayTotal',
    width: 130,
    align: 'center',
  },
]

// --- Performance section (online scope only) ---

interface PerformanceRow {
  key: string
  rowType: 'yearTotal' | 'annualAverage' | 'month'
  sequence: string
  sequenceGroupFirstRow: boolean
  division: string
  avgScore: CellValue
  leaderAvgScore: CellValue
  staffAvgScore: CellValue
}

const buildPerformanceData = (): PerformanceRow[] => [
  {
    key: 'performance-total',
    rowType: 'yearTotal',
    sequence: '年度合计',
    sequenceGroupFirstRow: true,
    division: '',
    avgScore: 0,
    leaderAvgScore: 0,
    staffAvgScore: 0,
  },
  ...ONLINE_DIVISIONS.map((division, index) => ({
    key: `performance-average-${division}`,
    rowType: 'annualAverage' as const,
    sequence: '平均得分',
    sequenceGroupFirstRow: index === 0,
    division,
    avgScore: '' as CellValue,
    leaderAvgScore: '' as CellValue,
    staffAvgScore: '' as CellValue,
  })),
  ...Array.from({ length: 12 }, (_, monthIndex) => {
    const sequence = String(monthIndex + 1)
    return ONLINE_DIVISIONS.map((division, divisionIndex) => ({
      key: `performance-${sequence}-${division}`,
      rowType: 'month' as const,
      sequence,
      sequenceGroupFirstRow: divisionIndex === 0,
      division,
      avgScore: '' as CellValue,
      leaderAvgScore: '' as CellValue,
      staffAvgScore: '' as CellValue,
    }))
  }).flat(),
]

const createPerformanceColumns = (): ColumnsType<PerformanceRow> => [
  {
    title: '月份',
    dataIndex: 'sequence',
    key: 'sequence',
    width: 90,
    align: 'center',
    onCell: (record) => {
      if (record.rowType === 'yearTotal') {
        return { rowSpan: 1 }
      }
      return { rowSpan: record.sequenceGroupFirstRow ? ONLINE_DIVISIONS.length : 0 }
    },
  },
  { title: '神殿', dataIndex: 'division', key: 'division', width: 120, align: 'center' },
  { title: '绩效平均分', dataIndex: 'avgScore', key: 'avgScore', width: 110, align: 'center' },
  { title: '干部绩效平均分', dataIndex: 'leaderAvgScore', key: 'leaderAvgScore', width: 130, align: 'center' },
  { title: '基层绩效平均分', dataIndex: 'staffAvgScore', key: 'staffAvgScore', width: 130, align: 'center' },
]

// --- Online scope section builders from API response ---

type DashboardSections = DashboardAnnualResponse['sections']

const buildOnlineSummaryFromSections = (sections: DashboardSections): ManagementCenterRow[] => {
  const summaryRows = (sections.summary?.rows as Record<string, any>[]) || []
  const hrRows = ((sections.hr_allocation?.rows as Record<string, any>[]) || []).filter((row) => row.rowType === 'month')
  const performanceRows = ((sections.performance?.rows as Record<string, any>[]) || []).filter((row) => row.rowType === 'month')

  const summaryMap = new Map(summaryRows.filter((row) => row.division).map((row) => [toDisplayDivision(row.division), row]))
  const hrByDivision = new Map<string, number>()
  const performanceByDivision = new Map<string, CellValue>()

  hrRows.forEach((row) => {
    const division = toDisplayDivision(row.division)
    hrByDivision.set(division, (hrByDivision.get(division) || 0) + numberValue(row.resumeCount))
  })

  ONLINE_DIVISIONS.forEach((division) => {
    const divisionRows = performanceRows.filter((row) => toDisplayDivision(row.division) === division)
    performanceByDivision.set(division, averageValues(divisionRows.map((row) => row.avgScore)))
  })

  const totalSummary = summaryRows.find((row) => row.division === '合计')
  const totalPerformance = ((sections.performance?.rows as Record<string, any>[]) || []).find((row) => row.rowType === 'yearTotal')
  const totalResumeCount = ONLINE_DIVISIONS.reduce((sum, division) => sum + (hrByDivision.get(division) || 0), 0)

  return [
    {
      key: 'summary-total',
      sequence: 1,
      division: '合计',
      deptCount: getValue(totalSummary, 'deptCount', 0),
      cadreCount: getValue(totalSummary, 'cadreCount', 0),
      staffCount: getValue(totalSummary, 'staffCount', 0),
      studentCount: '#VALUE!',
      resumeCount: totalResumeCount,
      interviewCount: getValue(totalSummary, 'interviewCount', 0),
      onboardCount: getValue(totalSummary, 'onboardCount', 0),
      onboardRate: String(getValue(totalSummary, 'onboardRate', '#DIV/0!')),
      transferCount: getValue(totalSummary, 'transferCount', ''),
      optimizeCount: getValue(totalSummary, 'optimizeCount', ''),
      resignCount: getValue(totalSummary, 'resignCount', ''),
      resignRate: String(getValue(totalSummary, 'resignRate', '')),
      trainingSessions1: getValue(totalSummary, 'trainingSessions1', ''),
      trainingSessions2: getValue(totalSummary, 'trainingSessions2', ''),
      trainingParticipants: getValue(totalSummary, 'trainingParticipants', ''),
      trainingPassRate: String(getValue(totalSummary, 'trainingPassRate', '')),
      annualSalaryTotal: getValue(totalSummary, 'annualSalaryTotal', ''),
      annualSalaryPerCapita: getValue(totalSummary, 'annualSalaryPerCapita', ''),
      annualWelfareTotal: getValue(totalSummary, 'annualWelfareTotal', ''),
      performanceAverage: getValue(totalPerformance, 'avgScore', ''),
    },
    ...ONLINE_DIVISIONS.map((division, index) => {
      const row = summaryMap.get(division)
      return {
        key: `summary-${division}`,
        sequence: index + 2,
        division,
        deptCount: getValue(row, 'deptCount', 0),
        cadreCount: getValue(row, 'cadreCount', 0),
        staffCount: getValue(row, 'staffCount', 0),
        studentCount: '/' as CellValue,
        resumeCount: hrByDivision.get(division) || 0,
        interviewCount: getValue(row, 'interviewCount', 0),
        onboardCount: getValue(row, 'onboardCount', 0),
        onboardRate: String(getValue(row, 'onboardRate', '#DIV/0!')),
        transferCount: getValue(row, 'transferCount', ''),
        optimizeCount: getValue(row, 'optimizeCount', ''),
        resignCount: getValue(row, 'resignCount', ''),
        resignRate: String(getValue(row, 'resignRate', '')),
        trainingSessions1: getValue(row, 'trainingSessions1', ''),
        trainingSessions2: getValue(row, 'trainingSessions2', ''),
        trainingParticipants: getValue(row, 'trainingParticipants', ''),
        trainingPassRate: String(getValue(row, 'trainingPassRate', '')),
        annualSalaryTotal: getValue(row, 'annualSalaryTotal', ''),
        annualSalaryPerCapita: getValue(row, 'annualSalaryPerCapita', ''),
        annualWelfareTotal: getValue(row, 'annualWelfareTotal', ''),
        performanceAverage: performanceByDivision.get(division) || '',
      }
    }),
  ]
}

const buildPerformanceFromSections = (sections: DashboardSections): PerformanceRow[] => {
  const rows = (sections.performance?.rows as Record<string, any>[]) || []
  const yearTotal = rows.find((row) => row.rowType === 'yearTotal')
  const monthRows = rows.filter((row) => row.rowType === 'month')
  const monthMap = new Map(monthRows.map((row) => [`${row.sequence}::${toDisplayDivision(row.division)}`, row]))

  return [
    {
      key: 'performance-total',
      rowType: 'yearTotal',
      sequence: '年度合计',
      sequenceGroupFirstRow: true,
      division: '',
      avgScore: getValue(yearTotal, 'avgScore', 0),
      leaderAvgScore: getValue(yearTotal, 'leaderAvgScore', 0),
      staffAvgScore: getValue(yearTotal, 'staffAvgScore', 0),
    },
    ...ONLINE_DIVISIONS.map((division, index) => {
      const divisionRows = monthRows.filter((row) => toDisplayDivision(row.division) === division)
      return {
        key: `performance-average-${division}`,
        rowType: 'annualAverage' as const,
        sequence: '平均得分',
        sequenceGroupFirstRow: index === 0,
        division,
        avgScore: averageValues(divisionRows.map((row) => row.avgScore)),
        leaderAvgScore: averageValues(divisionRows.map((row) => row.leaderAvgScore)),
        staffAvgScore: averageValues(divisionRows.map((row) => row.staffAvgScore)),
      }
    }),
    ...Array.from({ length: 12 }, (_, monthIndex) => {
      const sequence = String(monthIndex + 1)
      return ONLINE_DIVISIONS.map((division, divisionIndex) => {
        const row = monthMap.get(`${sequence}::${division}`)
        return {
          key: `performance-${sequence}-${division}`,
          rowType: 'month' as const,
          sequence,
          sequenceGroupFirstRow: divisionIndex === 0,
          division,
          avgScore: getValue(row, 'avgScore', ''),
          leaderAvgScore: getValue(row, 'leaderAvgScore', ''),
          staffAvgScore: getValue(row, 'staffAvgScore', ''),
        }
      })
    }).flat(),
  ]
}

interface AnnualDashboardPageProps {
  scope?: AnnualDashboardScope
  pageTitle?: string
  businessLabel?: string
}

const HqAnnualDashboard: React.FC<AnnualDashboardPageProps> = ({
  scope = 'hq',
  pageTitle = '清美教育集团年度核心数据看板-最高议事厅',
  businessLabel = '最高议事厅',
}) => {
  const { message } = App.useApp()
  const defaultManagementCenterRows = useMemo(() => buildManagementCenterData(scope), [scope])
  const defaultPostAndStaffRows = useMemo(() => buildPostAndStaffData(scope), [scope])
  const defaultHrAllocationRows = useMemo(() => buildHrAllocationData(scope), [scope])
  const defaultTrainingRows = useMemo(() => buildTrainingData(scope), [scope])
  const defaultSalaryRows = useMemo(() => buildSalaryWelfareData(scope), [scope])
  const defaultInsuranceRows = useMemo(() => buildSocialInsuranceData(scope), [scope])
  const defaultSummaryInsuranceRows = useMemo(() => buildSummarySocialInsuranceData(scope), [scope])
  const defaultPerformanceRows = useMemo(() => scope === 'online' ? buildPerformanceData() : [], [scope])
  const managementCenterColumns = createManagementCenterColumns(scope)
  const postAndStaffColumns = createPostAndStaffColumns(scope)
  const hrAllocationColumns = createHrAllocationColumns(scope)
  const trainingColumns = createTrainingColumns(scope)
  const salaryWelfareColumns = createSalaryWelfareColumns(scope)
  const socialInsuranceColumns = createSocialInsuranceColumns(scope)
  const summarySocialInsuranceColumns = useMemo(() => createSummarySocialInsuranceColumns(scope), [scope])
  const performanceColumns = useMemo(() => scope === 'online' ? createPerformanceColumns() : [], [scope])
  const [selectedYear, setSelectedYear] = useState<Dayjs>(dayjs())
  const [loading, setLoading] = useState(false)
  const [managementCenterRows, setManagementCenterRows] = useState<ManagementCenterRow[]>(defaultManagementCenterRows)
  const [postAndStaffRows, setPostAndStaffRows] = useState<PostAndStaffRow[]>(defaultPostAndStaffRows)
  const [hrAllocationRows, setHrAllocationRows] = useState<HrAllocationRow[]>(defaultHrAllocationRows)
  const [trainingRows, setTrainingRows] = useState<TrainingRow[]>(defaultTrainingRows)
  const [salaryRows, setSalaryRows] = useState<SalaryWelfareRow[]>(defaultSalaryRows)
  const [insuranceRows, setInsuranceRows] = useState<SocialInsuranceRow[]>(defaultInsuranceRows)
  const [summaryInsuranceRows, setSummaryInsuranceRows] = useState<SummarySocialInsuranceRow[]>(defaultSummaryInsuranceRows)
  const [performanceRows, setPerformanceRows] = useState<PerformanceRow[]>(defaultPerformanceRows)

  useEffect(() => {
    let active = true
    setLoading(true)
    setManagementCenterRows(defaultManagementCenterRows)
    setPostAndStaffRows(defaultPostAndStaffRows)
    setHrAllocationRows(defaultHrAllocationRows)
    setTrainingRows(defaultTrainingRows)
    setSalaryRows(defaultSalaryRows)
    setInsuranceRows(defaultInsuranceRows)
    setSummaryInsuranceRows(defaultSummaryInsuranceRows)
    if (scope === 'online') setPerformanceRows(defaultPerformanceRows)
    getDashboardAnnual(scope, selectedYear.format('YYYY'))
      .then((response) => {
        if (!active) return
        const { sections } = response
        if (scope === 'online') {
          setManagementCenterRows(buildOnlineSummaryFromSections(sections))
          const postRows = (sections.post_staff?.rows as PostAndStaffRow[]) || defaultPostAndStaffRows
          setPostAndStaffRows(postRows.map((row) => ({
            ...row,
            studentCount: row.rowType === 'yearEnd' ? '#VALUE!' : (row.monthGroupFirstRow ? '来自教化司' : ''),
          })))
          setPerformanceRows(buildPerformanceFromSections(sections))
        } else {
          setManagementCenterRows((sections.summary?.rows as ManagementCenterRow[]) || defaultManagementCenterRows)
          setPostAndStaffRows((sections.post_staff?.rows as PostAndStaffRow[]) || defaultPostAndStaffRows)
          if (scope === 'offline') {
            setSummaryInsuranceRows(
              buildSummarySocialInsuranceFromSummaryRows(
                (sections.summary?.rows as Record<string, any>[]) || [],
                scope,
              ),
            )
          }
        }
        setHrAllocationRows((sections.hr_allocation?.rows as HrAllocationRow[]) || defaultHrAllocationRows)
        setTrainingRows((sections.training?.rows as TrainingRow[]) || defaultTrainingRows)
        setSalaryRows((sections.salary_welfare?.rows as SalaryWelfareRow[]) || defaultSalaryRows)
        setInsuranceRows((sections.social_insurance?.rows as SocialInsuranceRow[]) || defaultInsuranceRows)
      })
      .catch((error) => {
        if (!active) return
        console.error(`加载${businessLabel}年度看板失败`, error)
        message.error(`加载${businessLabel}年度看板失败`)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [
    businessLabel,
    defaultHrAllocationRows,
    defaultInsuranceRows,
    defaultManagementCenterRows,
    defaultPerformanceRows,
    defaultPostAndStaffRows,
    defaultSalaryRows,
    defaultSummaryInsuranceRows,
    defaultTrainingRows,
    scope,
    selectedYear,
  ])

  const sectionBlocks = [
    {
      key: 'mgnt-center',
      label: `二级-${businessLabel}`,
      content: (
        <>
          <Typography.Title level={5} style={{ margin: '4px 0 12px' }}>
            {`清美教育集团年度核心数据看板-${businessLabel}`}
          </Typography.Title>
          <Table<ManagementCenterRow>
            columns={managementCenterColumns}
            dataSource={managementCenterRows}
            bordered
            loading={loading}
            pagination={false}
            size="small"
            scroll={{ x: scope === 'online' ? 3200 : 2600 }}
          />
        </>
      ),
    },
    {
      key: 'post-and-staff',
      label: '职数和部门员工数',
      content: (
        <>
          <Typography.Title level={5} style={{ margin: '4px 0 12px' }}>
            {businessLabel}年度核心数据看板-职数和部门员工数
          </Typography.Title>
          <Table<PostAndStaffRow>
            columns={postAndStaffColumns}
            dataSource={postAndStaffRows}
            bordered
            loading={loading}
            pagination={false}
            size="small"
            scroll={{ x: scope === 'online' ? 1100 : 850 }}
          />
        </>
      ),
    },
    {
      key: 'training',
      label: '培训',
      content: (
        <>
          <Typography.Title level={5} style={{ margin: '4px 0 12px' }}>
            {businessLabel}年度核心数据看板-培训
          </Typography.Title>
          <Table<TrainingRow>
            columns={trainingColumns}
            dataSource={trainingRows}
            bordered
            loading={loading}
            pagination={false}
            size="small"
            scroll={{ x: 1150 }}
          />
        </>
      ),
    },
    {
      key: 'salary-welfare',
      label: '薪酬及福利',
      content: (
        <>
          <Typography.Title level={5} style={{ margin: '4px 0 12px' }}>
            {businessLabel}年度核心数据看板-薪酬及福利
          </Typography.Title>
          <Table<SalaryWelfareRow>
            columns={salaryWelfareColumns}
            dataSource={salaryRows}
            bordered
            loading={loading}
            pagination={false}
            size="small"
            scroll={{ x: 730 }}
          />
        </>
      ),
    },
    {
      key: 'social-insurance',
      label: '社保',
      content: (
        <>
          <Typography.Title level={5} style={{ margin: '4px 0 12px' }}>
            {businessLabel}年度核心数据看板-社保
          </Typography.Title>
          {scope === 'offline' ? (
            <Table<SummarySocialInsuranceRow>
              columns={summarySocialInsuranceColumns}
              dataSource={summaryInsuranceRows}
              bordered
              loading={loading}
              pagination={false}
              size="small"
              scroll={{ x: 770 }}
            />
          ) : (
            <Table<SocialInsuranceRow>
              columns={socialInsuranceColumns}
              dataSource={insuranceRows}
              bordered
              loading={loading}
              pagination={false}
              size="small"
              scroll={{ x: 950 }}
            />
          )}
        </>
      ),
    },
  ]

  const tabItems = sectionBlocks.map((section) => ({
    key: section.key,
    label: section.label,
    children: section.content,
  }))

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
        {scope === 'hq' ? (
          <Tabs items={tabItems} />
        ) : (
          <Space direction="vertical" size={20} style={{ width: '100%', marginTop: 16 }}>
            {sectionBlocks.map((section) => (
              <div key={section.key}>
                {section.content}
              </div>
            ))}
          </Space>
        )}
      </Card>
    </div>
  )
}

export default HqAnnualDashboard
