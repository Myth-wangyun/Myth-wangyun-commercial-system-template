import React, { useEffect, useMemo, useState } from 'react'
import {
  App,
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tooltip,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  BookOutlined,
  DollarOutlined,
  EditOutlined,
  SafetyOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'

import {
  getDashboardDaily,
  upsertDashboardManualRecruitmentDaily,
} from '@/services/humanresources/dashboardDaily'
import {
  createSalaryWelfareFact,
  listSalaryWelfareFacts,
  updateSalaryWelfareFact,
} from '@/services/humanresources/salaryWelfareFacts'
import { type DashboardScope, normalizeOrgName } from '../shared/monthlyDashboardShared'

const { Text, Title } = Typography

const DAILY_TABLE_SCROLL_Y = 'calc(100vh - 330px)'
const DAILY_TABLE_SHARED_STYLE = `
  .daily-dashboard-table .ant-table {
    white-space: nowrap;
  }
  .daily-dashboard-table .ant-table-thead > tr > th {
    background: #fafafa !important;
    font-weight: 600;
  }
  .daily-dashboard-table .ant-table-cell {
    vertical-align: middle;
  }
  .daily-dashboard-table .ant-table-placeholder .ant-empty {
    margin-block: 56px;
  }
  .daily-dashboard-table .ant-table-ping-left .ant-table-cell-fix-left-last::after,
  .daily-dashboard-table .ant-table-ping-right .ant-table-cell-fix-right-first::after {
    box-shadow: 0 0 10px rgba(5, 5, 5, 0.08);
  }
`

const POSITION_CATEGORY_OPTIONS = [
  { label: '干部', value: '干部' },
  { label: '员工', value: '员工' },
]

const parsePercent = (value: string | number | null | undefined) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed || trimmed === '-') return null
    const numeric = Number.parseFloat(trimmed.replace('%', ''))
    return Number.isFinite(numeric) ? numeric / 100 : null
  }
  return null
}

const renderPercent = (value: string | number | null | undefined) => {
  if (typeof value === 'string') return value || '-'
  if (typeof value === 'number' && Number.isFinite(value)) return `${(value * 100).toFixed(1)}%`
  return '-'
}

const renderNumeric = (value: string | number | null | undefined) => {
  if (value === '' || value === null || value === undefined) return ''
  if (typeof value === 'number') return value
  return value
}

const renderMoney = (value: string | number | null | undefined) => {
  if (value === '' || value === null || value === undefined) return ''
  if (typeof value === 'number') return Number.isInteger(value) ? value : value.toFixed(2)
  return value
}

const splitNames = (value?: string | null) =>
  (value || '')
    .split(/[、,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean)

const joinNames = (value?: string[] | string | null) => {
  if (Array.isArray(value)) return value.filter(Boolean).join('、')
  return value || ''
}

interface RecruitmentTreeRow {
  key: string
  rowType: 'monthTotal' | 'monthOrg' | 'dayTotal' | 'org'
  day: number | null
  department: string
  statDate?: string
  authorizedPos: number | string
  currentPos: number | string
  recruitNeeded: number | string
  bossResumes: number
  bossInvites: number | string
  bossInterviews: number | string
  zhilianResumes: number
  zhilianInvites: number | string
  zhilianInterviews: number | string
  otherResumes: number
  otherInvites: number | string
  otherInterviews: number | string
  interviewShowRate: string | number
  onboardCount: number | string
  onboardRate: string | number
  retentionCount: number | string
  retentionRate: string | number
  formalizedCount: number | string
  plannedTransfer: number | string
  actualTransfer: number | string
  transferList: string
  plannedOptimize: number | string
  actualOptimize: number | string
  optimizeList: string
  resignCount: number | string
  resignList: string
  resignRate: string | number
  children?: RecruitmentTreeRow[]
}

interface TrainingTreeRow {
  key: string
  rowType: 'monthTotal' | 'monthOrg' | 'dayTotal' | 'org'
  day: number | null
  department: string
  trainingCount: number | string
  trainingHours: number | string
  participantCount: number | string
  avgTrainingHours: number | string
  avgScore: number | string
  passCount: number | string
  failCount: number | string
  failList: string
  passRate: string | number
  satisfactionScore: number | string
  totalCost: number | string
  costPerPerson: number | string
  children?: TrainingTreeRow[]
}

interface SalaryTreeRow {
  key: string
  rowType: 'monthTotal' | 'monthOrg' | 'dayTotal' | 'org'
  day: number | null
  department: string
  statDate?: string
  factRecordId?: number
  factEditable?: boolean
  personName: string
  position: string
  positionCategory: string
  salary: number | string
  annualWelfare: number | string
  monthlyIncentive: number | string
  tempReward: number | string
  deduction: number | string
  managerSalaryTotal: number | string
  staffSalaryTotal: number | string
  salaryTotal: number | string
  children?: SalaryTreeRow[]
}

interface SocialYearRow {
  key: string
  rowType: 'yearTotal' | 'yearOrg' | 'monthTotal' | 'org'
  month: number | null
  department: string
  shouldInsureCount: number | string
  actualInsureCount: number | string
  insureRate: string | number
  personName: string
  totalPayment: number | string
  companyPayment: number | string
  personalPayment: number | string
  serviceFee: number | string
  payBase: number | string
  injuryCompany: number | string
  pensionCompany: number | string
  pensionPersonal: number | string
  unemployCompany: number | string
  unemployPersonal: number | string
  medicalCompany: number | string
  medicalPersonal: number | string
  children?: SocialYearRow[]
}

interface DailyDashboardPageProps {
  scope?: DashboardScope
  pageTitle?: string
  businessLabel?: string
  showSalaryAndInsurance?: boolean
  showSalary?: boolean
  showInsurance?: boolean
}

const buildRecruitmentTree = (month: string, rows: Record<string, any>[]): RecruitmentTreeRow[] => {
  const monthRow = rows.find((item) => item.rowType === 'grandTotal')
  const monthChildren = rows
    .filter((item) => item.rowType === 'departmentSubtotal')
    .map<RecruitmentTreeRow>((item) => ({
      key: item.key,
      rowType: 'monthOrg',
      day: null,
      department: item.department || '',
      authorizedPos: item.authorizedPosts ?? 0,
      currentPos: item.currentPosts ?? 0,
      recruitNeeded: item.neededPosts ?? 0,
      bossResumes: 0,
      bossInvites: item.bossInviteCount ?? 0,
      bossInterviews: item.bossInterviewCount ?? 0,
      zhilianResumes: 0,
      zhilianInvites: item.zhilianInviteCount ?? 0,
      zhilianInterviews: item.zhilianInterviewCount ?? 0,
      otherResumes: 0,
      otherInvites: item.otherPlatformInviteCount ?? 0,
      otherInterviews: item.otherPlatformInterviewCount ?? 0,
      interviewShowRate: item.interviewArrivalRate ?? '-',
      onboardCount: item.onboardCount ?? 0,
      onboardRate: item.onboardRate ?? '-',
      retentionCount: item.newStaffRetentionCount ?? 0,
      retentionRate: item.newStaffRetentionRate ?? '-',
      formalizedCount: item.regularizedCount ?? 0,
      plannedTransfer: item.plannedTransferCount ?? 0,
      actualTransfer: item.actualTransferCount ?? 0,
      transferList: joinNames(item.transferNames),
      plannedOptimize: item.plannedOptimizeCount ?? 0,
      actualOptimize: item.actualOptimizeCount ?? 0,
      optimizeList: joinNames(item.optimizeNames),
      resignCount: item.resignCount ?? 0,
      resignList: joinNames(item.resignNames),
      resignRate: item.resignRate ?? '-',
    }))

  const byDay = new Map<number, Record<string, any>[]>()
  rows
    .filter((item) => item.rowType === 'departmentDay' && typeof item.dayOfMonth === 'number')
    .forEach((item) => {
      const day = Number(item.dayOfMonth)
      const current = byDay.get(day) || []
      current.push(item)
      byDay.set(day, current)
    })

  const dayRows = rows
    .filter((item) => item.rowType === 'dayTotal')
    .map<RecruitmentTreeRow>((item) => {
      const day = Number(item.dayOfMonth || item.date || 0)
      const children = (byDay.get(day) || []).map<RecruitmentTreeRow>((child) => ({
        key: child.key,
        rowType: 'org',
        day: null,
        department: child.department || '',
        statDate: `${month}-${String(day).padStart(2, '0')}`,
        authorizedPos: child.authorizedPosts ?? 0,
        currentPos: child.currentPosts ?? 0,
        recruitNeeded: child.neededPosts ?? 0,
        bossResumes: 0,
        bossInvites: child.bossInviteCount ?? 0,
        bossInterviews: child.bossInterviewCount ?? 0,
        zhilianResumes: 0,
        zhilianInvites: child.zhilianInviteCount ?? 0,
        zhilianInterviews: child.zhilianInterviewCount ?? 0,
        otherResumes: 0,
        otherInvites: child.otherPlatformInviteCount ?? 0,
        otherInterviews: child.otherPlatformInterviewCount ?? 0,
        interviewShowRate: child.interviewArrivalRate ?? '-',
        onboardCount: child.onboardCount ?? 0,
        onboardRate: child.onboardRate ?? '-',
        retentionCount: child.newStaffRetentionCount ?? 0,
        retentionRate: child.newStaffRetentionRate ?? '-',
        formalizedCount: child.regularizedCount ?? 0,
        plannedTransfer: child.plannedTransferCount ?? 0,
        actualTransfer: child.actualTransferCount ?? 0,
        transferList: joinNames(child.transferNames),
        plannedOptimize: child.plannedOptimizeCount ?? 0,
        actualOptimize: child.actualOptimizeCount ?? 0,
        optimizeList: joinNames(child.optimizeNames),
        resignCount: child.resignCount ?? 0,
        resignList: joinNames(child.resignNames),
        resignRate: child.resignRate ?? '-',
      }))
      return {
        key: item.key,
        rowType: 'dayTotal',
        day,
        department: '合计',
        authorizedPos: item.authorizedPosts ?? 0,
        currentPos: item.currentPosts ?? 0,
        recruitNeeded: item.neededPosts ?? 0,
        bossResumes: 0,
        bossInvites: item.bossInviteCount ?? 0,
        bossInterviews: item.bossInterviewCount ?? 0,
        zhilianResumes: 0,
        zhilianInvites: item.zhilianInviteCount ?? 0,
        zhilianInterviews: item.zhilianInterviewCount ?? 0,
        otherResumes: 0,
        otherInvites: item.otherPlatformInviteCount ?? 0,
        otherInterviews: item.otherPlatformInterviewCount ?? 0,
        interviewShowRate: item.interviewArrivalRate ?? '-',
        onboardCount: item.onboardCount ?? 0,
        onboardRate: item.onboardRate ?? '-',
        retentionCount: item.newStaffRetentionCount ?? 0,
        retentionRate: item.newStaffRetentionRate ?? '-',
        formalizedCount: item.regularizedCount ?? 0,
        plannedTransfer: item.plannedTransferCount ?? 0,
        actualTransfer: item.actualTransferCount ?? 0,
        transferList: joinNames(item.transferNames),
        plannedOptimize: item.plannedOptimizeCount ?? 0,
        actualOptimize: item.actualOptimizeCount ?? 0,
        optimizeList: joinNames(item.optimizeNames),
        resignCount: item.resignCount ?? 0,
        resignList: joinNames(item.resignNames),
        resignRate: item.resignRate ?? '-',
        children,
      }
    })

  const root: RecruitmentTreeRow = {
    key: monthRow?.key || 'month-total',
    rowType: 'monthTotal',
    day: null,
    department: '',
    authorizedPos: monthRow?.authorizedPosts ?? 0,
    currentPos: monthRow?.currentPosts ?? 0,
    recruitNeeded: monthRow?.neededPosts ?? 0,
    bossResumes: 0,
    bossInvites: monthRow?.bossInviteCount ?? 0,
    bossInterviews: monthRow?.bossInterviewCount ?? 0,
    zhilianResumes: 0,
    zhilianInvites: monthRow?.zhilianInviteCount ?? 0,
    zhilianInterviews: monthRow?.zhilianInterviewCount ?? 0,
    otherResumes: 0,
    otherInvites: monthRow?.otherPlatformInviteCount ?? 0,
    otherInterviews: monthRow?.otherPlatformInterviewCount ?? 0,
    interviewShowRate: monthRow?.interviewArrivalRate ?? '-',
    onboardCount: monthRow?.onboardCount ?? 0,
    onboardRate: monthRow?.onboardRate ?? '-',
    retentionCount: monthRow?.newStaffRetentionCount ?? 0,
    retentionRate: monthRow?.newStaffRetentionRate ?? '-',
    formalizedCount: monthRow?.regularizedCount ?? 0,
    plannedTransfer: monthRow?.plannedTransferCount ?? 0,
    actualTransfer: monthRow?.actualTransferCount ?? 0,
    transferList: joinNames(monthRow?.transferNames),
    plannedOptimize: monthRow?.plannedOptimizeCount ?? 0,
    actualOptimize: monthRow?.actualOptimizeCount ?? 0,
    optimizeList: joinNames(monthRow?.optimizeNames),
    resignCount: monthRow?.resignCount ?? 0,
    resignList: joinNames(monthRow?.resignNames),
    resignRate: monthRow?.resignRate ?? '-',
    children: monthChildren,
  }

  return [root, ...dayRows]
}

const buildTrainingTree = (rows: Record<string, any>[]): TrainingTreeRow[] => {
  const monthRow = rows.find((item) => item.rowType === 'grandTotal')
  const monthChildren = rows
    .filter((item) => item.rowType === 'departmentSubtotal')
    .map<TrainingTreeRow>((item) => ({
      key: item.key,
      rowType: 'monthOrg',
      day: null,
      department: item.department || '',
      trainingCount: item.trainingSessions ?? 0,
      trainingHours: item.trainingDuration ?? 0,
      participantCount: item.participants ?? 0,
      avgTrainingHours: item.perCapitaDuration ?? '-',
      avgScore: item.averageScore ?? '-',
      passCount: item.passCount ?? 0,
      failCount: item.failCount ?? 0,
      failList: joinNames(item.failNames),
      passRate: item.passRate ?? '-',
      satisfactionScore: item.satisfactionScore ?? '-',
      totalCost: item.totalCost ?? 0,
      costPerPerson: item.perCapitaCost ?? '-',
    }))

  const byDay = new Map<number, Record<string, any>[]>()
  rows
    .filter((item) => item.rowType === 'departmentDay' && typeof item.dayOfMonth === 'number')
    .forEach((item) => {
      const day = Number(item.dayOfMonth)
      const current = byDay.get(day) || []
      current.push(item)
      byDay.set(day, current)
    })

  const dayRows = rows
    .filter((item) => item.rowType === 'dayTotal')
    .map<TrainingTreeRow>((item) => {
      const day = Number(item.dayOfMonth || item.date || 0)
      const children = (byDay.get(day) || []).map<TrainingTreeRow>((child) => ({
        key: child.key,
        rowType: 'org',
        day: null,
        department: child.department || '',
        trainingCount: child.trainingSessions ?? 0,
        trainingHours: child.trainingDuration ?? 0,
        participantCount: child.participants ?? 0,
        avgTrainingHours: child.perCapitaDuration ?? '-',
        avgScore: child.averageScore ?? '-',
        passCount: child.passCount ?? 0,
        failCount: child.failCount ?? 0,
        failList: joinNames(child.failNames),
        passRate: child.passRate ?? '-',
        satisfactionScore: child.satisfactionScore ?? '-',
        totalCost: child.totalCost ?? 0,
        costPerPerson: child.perCapitaCost ?? '-',
      }))
      return {
        key: item.key,
        rowType: 'dayTotal',
        day,
        department: '合计',
        trainingCount: item.trainingSessions ?? 0,
        trainingHours: item.trainingDuration ?? 0,
        participantCount: item.participants ?? 0,
        avgTrainingHours: item.perCapitaDuration ?? '-',
        avgScore: item.averageScore ?? '-',
        passCount: item.passCount ?? 0,
        failCount: item.failCount ?? 0,
        failList: joinNames(item.failNames),
        passRate: item.passRate ?? '-',
        satisfactionScore: item.satisfactionScore ?? '-',
        totalCost: item.totalCost ?? 0,
        costPerPerson: item.perCapitaCost ?? '-',
        children,
      }
    })

  return [
    {
      key: monthRow?.key || 'month-total',
      rowType: 'monthTotal',
      day: null,
      department: '',
      trainingCount: monthRow?.trainingSessions ?? 0,
      trainingHours: monthRow?.trainingDuration ?? 0,
      participantCount: monthRow?.participants ?? 0,
      avgTrainingHours: monthRow?.perCapitaDuration ?? '-',
      avgScore: monthRow?.averageScore ?? '-',
      passCount: monthRow?.passCount ?? 0,
      failCount: monthRow?.failCount ?? 0,
      failList: joinNames(monthRow?.failNames),
      passRate: monthRow?.passRate ?? '-',
      satisfactionScore: monthRow?.satisfactionScore ?? '-',
      totalCost: monthRow?.totalCost ?? 0,
      costPerPerson: monthRow?.perCapitaCost ?? '-',
      children: monthChildren,
    },
    ...dayRows,
  ]
}

const buildSalaryTree = (
  scope: DashboardScope,
  month: string,
  rows: Record<string, any>[],
  factGroups: Map<string, { id?: number; count: number }>,
): SalaryTreeRow[] => {
  const monthRow = rows.find((item) => item.rowType === 'grandTotal')
  const monthChildren = rows
    .filter((item) => item.rowType === 'departmentSubtotal')
    .map<SalaryTreeRow>((item) => ({
      key: item.key,
      rowType: 'monthOrg',
      day: null,
      department: item.department || '',
      personName: item.personName || '',
      position: item.position || '',
      positionCategory: item.positionCategory || '',
      salary: item.salary ?? 0,
      annualWelfare: item.annualWelfareTotal ?? 0,
      monthlyIncentive: item.monthlyIncentiveTotal ?? 0,
      tempReward: item.temporaryRewardTotal ?? 0,
      deduction: item.deduction ?? 0,
      managerSalaryTotal: item.cadreSalaryTotal ?? 0,
      staffSalaryTotal: item.staffSalaryTotal ?? 0,
      salaryTotal: item.salaryTotal ?? 0,
    }))

  const byDay = new Map<number, Record<string, any>[]>()
  rows
    .filter((item) => item.rowType === 'departmentDay' && typeof item.dayOfMonth === 'number')
    .forEach((item) => {
      const day = Number(item.dayOfMonth)
      const current = byDay.get(day) || []
      current.push(item)
      byDay.set(day, current)
    })

  const dayRows = rows
    .filter((item) => item.rowType === 'dayTotal')
    .map<SalaryTreeRow>((item) => {
      const day = Number(item.dayOfMonth || item.date || 0)
      const children = (byDay.get(day) || []).map<SalaryTreeRow>((child) => {
        const statDate = `${month}-${String(day).padStart(2, '0')}`
        const groupKey = `${statDate}|${normalizeOrgName(scope, child.department)}`
        const factMeta = factGroups.get(groupKey)
        return {
          key: child.key,
          rowType: 'org',
          day: null,
          department: child.department || '',
          statDate,
          factRecordId: factMeta?.id,
          factEditable: (factMeta?.count || 0) <= 1,
          personName: child.personName || '',
          position: child.position || '',
          positionCategory: child.positionCategory || '',
          salary: child.salary ?? 0,
          annualWelfare: child.annualWelfareTotal ?? 0,
          monthlyIncentive: child.monthlyIncentiveTotal ?? 0,
          tempReward: child.temporaryRewardTotal ?? 0,
          deduction: child.deduction ?? 0,
          managerSalaryTotal: child.cadreSalaryTotal ?? 0,
          staffSalaryTotal: child.staffSalaryTotal ?? 0,
          salaryTotal: child.salaryTotal ?? 0,
        }
      })
      return {
        key: item.key,
        rowType: 'dayTotal',
        day,
        department: '合计',
        personName: item.personName || '',
        position: item.position || '',
        positionCategory: item.positionCategory || '',
        salary: item.salary ?? 0,
        annualWelfare: item.annualWelfareTotal ?? 0,
        monthlyIncentive: item.monthlyIncentiveTotal ?? 0,
        tempReward: item.temporaryRewardTotal ?? 0,
        deduction: item.deduction ?? 0,
        managerSalaryTotal: item.cadreSalaryTotal ?? 0,
        staffSalaryTotal: item.staffSalaryTotal ?? 0,
        salaryTotal: item.salaryTotal ?? 0,
        children,
      }
    })

  return [
    {
      key: monthRow?.key || 'month-total',
      rowType: 'monthTotal',
      day: null,
      department: '合计',
      personName: monthRow?.personName || '',
      position: monthRow?.position || '',
      positionCategory: monthRow?.positionCategory || '',
      salary: monthRow?.salary ?? 0,
      annualWelfare: monthRow?.annualWelfareTotal ?? 0,
      monthlyIncentive: monthRow?.monthlyIncentiveTotal ?? 0,
      tempReward: monthRow?.temporaryRewardTotal ?? 0,
      deduction: monthRow?.deduction ?? 0,
      managerSalaryTotal: monthRow?.cadreSalaryTotal ?? 0,
      staffSalaryTotal: monthRow?.staffSalaryTotal ?? 0,
      salaryTotal: monthRow?.salaryTotal ?? 0,
      children: monthChildren,
    },
    ...dayRows,
  ]
}

const sumSocialRows = (
  items: SocialYearRow[],
): Omit<SocialYearRow, 'key' | 'rowType' | 'month' | 'department' | 'children'> => {
  const shouldInsureCount = items.reduce(
    (sum, item) => sum + Number(item.shouldInsureCount || 0),
    0,
  )
  const actualInsureCount = items.reduce(
    (sum, item) => sum + Number(item.actualInsureCount || 0),
    0,
  )
  const totalPayment = items.reduce((sum, item) => sum + Number(item.totalPayment || 0), 0)
  const companyPayment = items.reduce((sum, item) => sum + Number(item.companyPayment || 0), 0)
  const personalPayment = items.reduce((sum, item) => sum + Number(item.personalPayment || 0), 0)
  const serviceFee = items.reduce((sum, item) => sum + Number(item.serviceFee || 0), 0)
  const payBase = items.reduce((sum, item) => sum + Number(item.payBase || 0), 0)
  const injuryCompany = items.reduce((sum, item) => sum + Number(item.injuryCompany || 0), 0)
  const pensionCompany = items.reduce((sum, item) => sum + Number(item.pensionCompany || 0), 0)
  const pensionPersonal = items.reduce((sum, item) => sum + Number(item.pensionPersonal || 0), 0)
  const unemployCompany = items.reduce((sum, item) => sum + Number(item.unemployCompany || 0), 0)
  const unemployPersonal = items.reduce((sum, item) => sum + Number(item.unemployPersonal || 0), 0)
  const medicalCompany = items.reduce((sum, item) => sum + Number(item.medicalCompany || 0), 0)
  const medicalPersonal = items.reduce((sum, item) => sum + Number(item.medicalPersonal || 0), 0)
  const personName = joinNames(
    Array.from(new Set(items.flatMap((item) => splitNames(item.personName)).filter(Boolean))),
  )
  return {
    shouldInsureCount,
    actualInsureCount,
    insureRate: renderPercent(shouldInsureCount ? actualInsureCount / shouldInsureCount : null),
    personName,
    totalPayment: Number(totalPayment.toFixed(2)),
    companyPayment: Number(companyPayment.toFixed(2)),
    personalPayment: Number(personalPayment.toFixed(2)),
    serviceFee: Number(serviceFee.toFixed(2)),
    payBase: Number(payBase.toFixed(2)),
    injuryCompany: Number(injuryCompany.toFixed(2)),
    pensionCompany: Number(pensionCompany.toFixed(2)),
    pensionPersonal: Number(pensionPersonal.toFixed(2)),
    unemployCompany: Number(unemployCompany.toFixed(2)),
    unemployPersonal: Number(unemployPersonal.toFixed(2)),
    medicalCompany: Number(medicalCompany.toFixed(2)),
    medicalPersonal: Number(medicalPersonal.toFixed(2)),
  }
}

const mapSocialDailyRow = (
  row: Record<string, any>,
  month: number,
  rowType: SocialYearRow['rowType'],
): SocialYearRow => ({
  key: row.key,
  rowType,
  month: rowType === 'monthTotal' ? month : null,
  department: row.department || '',
  shouldInsureCount: row.shouldInsureCount ?? 0,
  actualInsureCount: row.actualInsureCount ?? 0,
  insureRate: row.insureRate ?? '-',
  personName: row.personName || '',
  totalPayment: row.totalPayment ?? 0,
  companyPayment: row.companyTotalPayment ?? 0,
  personalPayment: row.personalTotalPayment ?? 0,
  serviceFee: row.serviceFeeTotal ?? 0,
  payBase: row.paymentBase ?? 0,
  injuryCompany: row.injuryCompanyRate ?? 0,
  pensionCompany: row.pensionCompanyRate ?? 0,
  pensionPersonal: row.pensionPersonalRate ?? 0,
  unemployCompany: row.unemploymentCompanyRate ?? 0,
  unemployPersonal: row.unemploymentPersonalRate ?? 0,
  medicalCompany: row.medicalCompanyRate ?? 0,
  medicalPersonal: row.medicalPersonalRate ?? 0,
})

const buildSocialYearTree = (
  responses: Array<{ month: number; rows: Record<string, any>[] }>,
): SocialYearRow[] => {
  const monthRows = responses
    .sort((left, right) => left.month - right.month)
    .map<SocialYearRow>((item) => {
      const latestDay = Math.max(
        0,
        ...item.rows
          .filter((row) => row.rowType === 'dayTotal' && typeof row.dayOfMonth === 'number')
          .map((row) => Number(row.dayOfMonth)),
      )
      const totalRow =
        item.rows.find(
          (row) => row.rowType === 'dayTotal' && Number(row.dayOfMonth) === latestDay,
        ) || item.rows.find((row) => row.rowType === 'grandTotal')
      const children = item.rows
        .filter((row) => row.rowType === 'departmentDay' && Number(row.dayOfMonth) === latestDay)
        .map<SocialYearRow>((row) => mapSocialDailyRow(row, item.month, 'org'))
      return {
        ...mapSocialDailyRow(totalRow || {}, item.month, 'monthTotal'),
        month: item.month,
        department: '合计',
        children,
      }
    })

  const orgNames = Array.from(
    new Set(
      monthRows
        .flatMap((row) => (row.children || []).map((child) => child.department))
        .filter(Boolean),
    ),
  )
  const yearChildren = orgNames.map<SocialYearRow>((orgName) => ({
    key: `year-org-${orgName}`,
    rowType: 'yearOrg',
    month: null,
    department: orgName,
    ...sumSocialRows(
      monthRows
        .flatMap((row) => row.children || [])
        .filter((child) => child.department === orgName),
    ),
  }))

  return [
    {
      key: 'year-total',
      rowType: 'yearTotal',
      month: null,
      department: '合计',
      ...sumSocialRows(monthRows),
      children: yearChildren,
    },
    ...monthRows,
  ]
}

const getDefaultExpandedDayKey = (rows: any[], monthKey: string) => {
  if (dayjs().format('YYYY-MM') !== monthKey) return []
  const today = dayjs().date()
  const todayRow = rows.find((r) => r.rowType === 'dayTotal' && r.day === today)
  if (todayRow) return [todayRow.key]
  const maxDayRow = [...rows].reverse().find((r) => r.rowType === 'dayTotal')
  return maxDayRow ? [maxDayRow.key] : []
}

const getDefaultExpandedMonthKey = (rows: any[], yearKey: string) => {
  if (dayjs().format('YYYY') !== yearKey) return []
  const currentMonth = dayjs().month() + 1
  const monthRow = rows.find((r) => r.rowType === 'monthTotal' && r.month === currentMonth)
  if (monthRow) return [monthRow.key]
  const maxMonthRow = [...rows].reverse().find((r) => r.rowType === 'monthTotal')
  return maxMonthRow ? [maxMonthRow.key] : []
}

const RecruitmentSection: React.FC<{
  scope: DashboardScope
  orgLabel: string
}> = ({ scope, orgLabel }) => {
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs())
  const [rows, setRows] = useState<RecruitmentTreeRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [warnings, setWarnings] = useState<Record<string, any>>({})
  const [editingRow, setEditingRow] = useState<RecruitmentTreeRow | null>(null)
  const [form] = Form.useForm()

  const monthKey = selectedMonth.format('YYYY-MM')

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await getDashboardDaily(scope, monthKey)
      setRows(
        buildRecruitmentTree(
          monthKey,
          (response.sections.recruitment?.rows as Record<string, any>[]) || [],
        ),
      )
      setWarnings(response.sections.recruitment?.warnings || {})
    } catch (error) {
      console.error(error)
      message.error('招聘及入职数据加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [scope, monthKey])

  useEffect(() => {
    if (!editingRow) {
      form.resetFields()
      return
    }
    form.setFieldsValue({
      authorizedPos: editingRow.authorizedPos || 0,
      currentPos: editingRow.currentPos || 0,
      bossInvites: editingRow.bossInvites || 0,
      zhilianInvites: editingRow.zhilianInvites || 0,
      otherInvites: editingRow.otherInvites || 0,
      plannedOptimize: editingRow.plannedOptimize || 0,
      actualOptimize: editingRow.actualOptimize || 0,
      transferList: editingRow.transferList || '',
      optimizeList: editingRow.optimizeList || '',
      resignList: editingRow.resignList || '',
    })
  }, [editingRow, form])

  const handleSave = async () => {
    if (!editingRow?.statDate) return
    const values = await form.validateFields()
    setSaving(true)
    try {
      await upsertDashboardManualRecruitmentDaily({
        scope,
        statDate: editingRow.statDate,
        orgName: editingRow.department,
        authorizedPosts: Number(values.authorizedPos || 0),
        currentPosts: Number(values.currentPos || 0),
        bossInviteCount: Number(values.bossInvites || 0),
        zhilianInviteCount: Number(values.zhilianInvites || 0),
        otherPlatformInviteCount: Number(values.otherInvites || 0),
        plannedOptimizeCount: Number(values.plannedOptimize || 0),
        actualOptimizeCount: Number(values.actualOptimize || 0),
        transferNames: splitNames(values.transferList),
        optimizeNames: splitNames(values.optimizeList),
        resignNames: splitNames(values.resignList),
      })
      message.success('招聘手填字段已保存')
      setEditingRow(null)
      await loadData()
    } catch (error) {
      console.error(error)
      message.error('招聘手填字段保存失败')
    } finally {
      setSaving(false)
    }
  }

  const rateCol = (title: string, dataIndex: keyof RecruitmentTreeRow, width = 90) => ({
    title,
    dataIndex,
    key: dataIndex,
    width,
    align: 'center' as const,
    render: (value: string | number) => {
      const percent = parsePercent(value)
      const color =
        percent === null
          ? undefined
          : percent >= 0.8
            ? '#52c41a'
            : percent >= 0.5
              ? '#faad14'
              : '#ff4d4f'
      return <Text style={{ color }}>{renderPercent(value)}</Text>
    },
  })

  const listCol = (title: string, dataIndex: keyof RecruitmentTreeRow, width = 110) => ({
    title,
    dataIndex,
    key: dataIndex,
    width,
    ellipsis: true,
    render: (value: string) =>
      value ? (
        <Tooltip title={value}>
          <span>{value}</span>
        </Tooltip>
      ) : (
        ''
      ),
  })

  const columns: ColumnsType<RecruitmentTreeRow> = [
    {
      title: '日期',
      dataIndex: 'day',
      key: 'day',
      width: 70,
      fixed: 'left',
      align: 'center',
      render: (value, row) => {
        if (row.rowType === 'monthTotal') return <Text strong>当前合计</Text>
        if (row.rowType === 'dayTotal') return <Text strong>{value}</Text>
        return null
      },
    },
    {
      title: orgLabel,
      dataIndex: 'department',
      key: 'department',
      width: 100,
      fixed: 'left',
      render: (value, row) => {
        if (row.rowType === 'dayTotal' || row.rowType === 'monthTotal')
          return <Text strong>{value || '合计'}</Text>
        return value
      },
    },
    {
      title: '编制职数',
      dataIndex: 'authorizedPos',
      key: 'authorizedPos',
      width: 80,
      align: 'center',
      render: renderNumeric,
    },
    {
      title: '现有职数',
      dataIndex: 'currentPos',
      key: 'currentPos',
      width: 80,
      align: 'center',
      render: renderNumeric,
    },
    {
      title: '需招聘职数',
      dataIndex: 'recruitNeeded',
      key: 'recruitNeeded',
      width: 90,
      align: 'center',
      render: renderNumeric,
    },
    {
      title: 'BOSS直聘',
      children: [
        ...(scope !== 'hq'
          ? [
              {
                title: '简历数',
                dataIndex: 'bossResumes',
                key: 'bossResumes',
                width: 75,
                align: 'center' as const,
                render: renderNumeric,
              },
            ]
          : []),
        {
          title: '邀约人数',
          dataIndex: 'bossInvites',
          key: 'bossInvites',
          width: 80,
          align: 'center',
          render: renderNumeric,
        },
        {
          title: '面试人数',
          dataIndex: 'bossInterviews',
          key: 'bossInterviews',
          width: 80,
          align: 'center',
          render: renderNumeric,
        },
      ],
    },
    {
      title: '智联招聘',
      children: [
        ...(scope !== 'hq'
          ? [
              {
                title: '简历数',
                dataIndex: 'zhilianResumes',
                key: 'zhilianResumes',
                width: 75,
                align: 'center' as const,
                render: renderNumeric,
              },
            ]
          : []),
        {
          title: '邀约人数',
          dataIndex: 'zhilianInvites',
          key: 'zhilianInvites',
          width: 80,
          align: 'center',
          render: renderNumeric,
        },
        {
          title: '面试人数',
          dataIndex: 'zhilianInterviews',
          key: 'zhilianInterviews',
          width: 80,
          align: 'center',
          render: renderNumeric,
        },
      ],
    },
    {
      title: '其他平台',
      children: [
        ...(scope !== 'hq'
          ? [
              {
                title: '简历数',
                dataIndex: 'otherResumes',
                key: 'otherResumes',
                width: 75,
                align: 'center' as const,
                render: renderNumeric,
              },
            ]
          : []),
        {
          title: '邀约数',
          dataIndex: 'otherInvites',
          key: 'otherInvites',
          width: 75,
          align: 'center',
          render: renderNumeric,
        },
        {
          title: '面试数',
          dataIndex: 'otherInterviews',
          key: 'otherInterviews',
          width: 80,
          align: 'center',
          render: renderNumeric,
        },
      ],
    },
    rateCol('面试上门率', 'interviewShowRate', 95),
    {
      title: '入职人数',
      dataIndex: 'onboardCount',
      key: 'onboardCount',
      width: 80,
      align: 'center',
      render: renderNumeric,
    },
    rateCol('入职率', 'onboardRate', 80),
    {
      title: '新员工留存数',
      dataIndex: 'retentionCount',
      key: 'retentionCount',
      width: 105,
      align: 'center',
      render: renderNumeric,
    },
    rateCol('新员工留存率', 'retentionRate', 110),
    {
      title: '现有转正人数',
      dataIndex: 'formalizedCount',
      key: 'formalizedCount',
      width: 105,
      align: 'center',
      render: renderNumeric,
    },
    {
      title: '计划调岗',
      dataIndex: 'plannedTransfer',
      key: 'plannedTransfer',
      width: 80,
      align: 'center',
      render: renderNumeric,
    },
    {
      title: '实际调岗',
      dataIndex: 'actualTransfer',
      key: 'actualTransfer',
      width: 80,
      align: 'center',
      render: renderNumeric,
    },
    listCol('调岗人员名单', 'transferList'),
    {
      title: '计划优化',
      dataIndex: 'plannedOptimize',
      key: 'plannedOptimize',
      width: 80,
      align: 'center',
      render: renderNumeric,
    },
    ...(scope === 'hq'
      ? [
          {
            title: '实际优化',
            dataIndex: 'actualOptimize',
            key: 'actualOptimize',
            width: 80,
            align: 'center' as const,
            render: renderNumeric,
          },
          listCol('优化人员名单', 'optimizeList'),
          {
            title: '离职人数',
            dataIndex: 'resignCount',
            key: 'resignCount',
            width: 80,
            align: 'center' as const,
            render: renderNumeric,
          },
        ]
      : []),
    {
      title: '操作',
      key: 'action',
      width: 70,
      fixed: 'right',
      align: 'center',
      render: (_, row) =>
        row.rowType === 'org' ? (
          <Tooltip title="编辑手填字段">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => setEditingRow(row)}
            />
          </Tooltip>
        ) : null,
    },
  ]

  return (
    <div>
      <style>{`
        .row-month-total td { background: #fff7e6 !important; font-weight: bold; }
        .row-month-org td { background: #fffbe6 !important; }
        .row-day-total > td { background: #f6ffed !important; font-weight: 600; }
      `}</style>

      <Card size="small" style={{ marginBottom: 12 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text strong>选择月份：</Text>
              <DatePicker
                picker="month"
                value={selectedMonth}
                onChange={(value) => value && setSelectedMonth(value)}
                allowClear={false}
                style={{ width: 160 }}
              />
              <Text type="secondary">
                {selectedMonth.format('YYYY年M月')} 共 {selectedMonth.daysInMonth()} 天
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {warnings.unmatchedInterviewCount ? (
        <Alert
          style={{ marginBottom: 12 }}
          type="warning"
          showIcon
          message={`有 ${warnings.unmatchedInterviewCount} 条面试记录无法归属到当前${orgLabel}口径，未纳入本看板统计`}
        />
      ) : null}

      <Card>
        <Table
          key={rows.length ? 'loaded' : 'empty'}
          columns={columns}
          dataSource={rows}
          rowKey="key"
          loading={loading}
          bordered
          size="small"
          pagination={false}
          scroll={{ x: 2800, y: 'calc(100vh - 330px)' }}
          rowClassName={(record) => {
            if (record.rowType === 'monthTotal') return 'row-month-total'
            if (record.rowType === 'monthOrg') return 'row-month-org'
            if (record.rowType === 'dayTotal') return 'row-day-total'
            return ''
          }}
          expandable={{
            defaultExpandedRowKeys: getDefaultExpandedDayKey(rows, monthKey),
            rowExpandable: (record) => Boolean(record.children?.length),
            indentSize: 0,
          }}
        />
      </Card>

      <Modal
        title={`编辑${orgLabel}手填字段`}
        open={Boolean(editingRow)}
        onCancel={() => setEditingRow(null)}
        onOk={() => void handleSave()}
        okText="保存"
        cancelText="取消"
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="authorizedPos" label="编制职数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="currentPos" label="现有职数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="bossInvites" label="Boss直聘邀约人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="zhilianInvites" label="智联招聘邀约人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="otherInvites" label="其他平台邀约人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="plannedOptimize" label="计划优化人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="actualOptimize" label="实际优化人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="transferList" label="调岗人员名单">
            <Input placeholder="多个姓名用顿号、逗号或换行分隔" />
          </Form.Item>
          <Form.Item name="optimizeList" label="优化人员名单">
            <Input placeholder="多个姓名用顿号、逗号或换行分隔" />
          </Form.Item>
          <Form.Item name="resignList" label="离职人员名单">
            <Input placeholder="多个姓名用顿号、逗号或换行分隔" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

const TrainingSection: React.FC<{
  scope: DashboardScope
  orgLabel: string
}> = ({ scope, orgLabel }) => {
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs())
  const [rows, setRows] = useState<TrainingTreeRow[]>([])
  const [loading, setLoading] = useState(false)
  const [warnings, setWarnings] = useState<Record<string, any>>({})

  const monthKey = selectedMonth.format('YYYY-MM')

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const response = await getDashboardDaily(scope, monthKey)
        setRows(
          buildTrainingTree((response.sections.training?.rows as Record<string, any>[]) || []),
        )
        setWarnings(response.sections.training?.warnings || {})
      } catch (error) {
        console.error(error)
        message.error('培训数据加载失败')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [scope, monthKey])

  const rateCol = (
    title: string,
    dataIndex: keyof TrainingTreeRow,
    width = 90,
    formatter?: (value: string | number) => string,
  ) => ({
    title,
    dataIndex,
    key: dataIndex,
    width,
    align: 'center' as const,
    render: (value: string | number) => {
      const percent = parsePercent(value)
      const color =
        percent === null
          ? undefined
          : percent >= 0.8
            ? '#52c41a'
            : percent >= 0.6
              ? '#faad14'
              : '#ff4d4f'
      return <Text style={{ color }}>{formatter ? formatter(value) : renderPercent(value)}</Text>
    },
  })

  const columns: ColumnsType<TrainingTreeRow> = [
    {
      title: '日期',
      dataIndex: 'day',
      key: 'day',
      width: 70,
      fixed: 'left',
      align: 'center',
      render: (value, row) => {
        if (row.rowType === 'monthTotal') return <Text strong>当前合计</Text>
        if (row.rowType === 'dayTotal') return <Text strong>{value}</Text>
        return null
      },
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 100,
      fixed: 'left',
      render: (value, row) => {
        if (row.rowType === 'dayTotal' || row.rowType === 'monthTotal')
          return <Text strong>{value || '合计'}</Text>
        return value
      },
    },
    {
      title: '培训场次',
      dataIndex: 'trainingCount',
      key: 'trainingCount',
      width: 85,
      align: 'center',
      render: renderNumeric,
    },
    {
      title: '培训时长',
      dataIndex: 'trainingHours',
      key: 'trainingHours',
      width: 85,
      align: 'center',
      render: renderNumeric,
    },
    {
      title: scope === 'hq' ? '参训人数' : '参训人次',
      dataIndex: 'participantCount',
      key: 'participantCount',
      width: 85,
      align: 'center',
      render: renderNumeric,
    },
    {
      title: scope === 'hq' ? '人均培训时长' : '平均培训时长',
      dataIndex: 'avgTrainingHours',
      key: 'avgTrainingHours',
      width: 105,
      align: 'center',
      render: renderNumeric,
    },
    {
      title: '平均分',
      dataIndex: 'avgScore',
      key: 'avgScore',
      width: 85,
      align: 'center',
      render: renderNumeric,
    },
    rateCol('合格率', 'passRate', 85),
    {
      title: scope === 'hq' ? '合格人数' : '合格数量',
      dataIndex: 'passCount',
      key: 'passCount',
      width: 85,
      align: 'center',
      render: renderNumeric,
    },
    {
      title: scope === 'hq' ? '不合格人数' : '不合格数量',
      dataIndex: 'failCount',
      key: 'failCount',
      width: 95,
      align: 'center',
      render: renderNumeric,
    },
    {
      title: '不合格人员名单',
      dataIndex: 'failList',
      key: 'failList',
      width: 130,
      ellipsis: true,
      render: (value: string) => (value ? <Tooltip title={value}>{value}</Tooltip> : ''),
    },
    {
      title: '总花费',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 90,
      align: 'center',
      render: renderMoney,
    },
    {
      title: '人均成本',
      dataIndex: 'costPerPerson',
      key: 'costPerPerson',
      width: 95,
      align: 'center',
      render: renderMoney,
    },
  ]

  return (
    <div>
      <style>{`
        ${DAILY_TABLE_SHARED_STYLE}
        .row-month-total td { background: #fff7e6 !important; font-weight: bold; }
        .row-month-org td { background: #fffbe6 !important; }
        .row-day-total > td { background: #f6ffed !important; font-weight: 600; }
      `}</style>

      <Card size="small" style={{ marginBottom: 12 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text strong>选择月份：</Text>
              <DatePicker
                picker="month"
                value={selectedMonth}
                onChange={(value) => value && setSelectedMonth(value)}
                allowClear={false}
                style={{ width: 160 }}
              />
              <Text type="secondary">
                {selectedMonth.format('YYYY年M月')} 共 {selectedMonth.daysInMonth()} 天
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {warnings.unmatchedTrainingResultCount ||
      warnings.unmatchedSatisfactionCount ||
      warnings.applicationFallbackRowCount ? (
        <Alert
          style={{ marginBottom: 12 }}
          type="warning"
          showIcon
          message={[
            warnings.unmatchedTrainingResultCount
              ? `有 ${warnings.unmatchedTrainingResultCount} 条培训成绩记录无法归属${orgLabel}`
              : null,
            warnings.unmatchedSatisfactionCount
              ? `有 ${warnings.unmatchedSatisfactionCount} 条培训满意度记录无法归属${orgLabel}`
              : null,
            warnings.applicationFallbackRowCount
              ? `有 ${warnings.applicationFallbackRowCount} 行培训数据使用了申请表回填`
              : null,
          ]
            .filter(Boolean)
            .join('；')}
        />
      ) : null}

      <Card>
        <Table
          key={rows.length ? 'loaded' : 'empty'}
          className="daily-dashboard-table"
          columns={columns}
          dataSource={rows}
          rowKey="key"
          loading={loading}
          bordered
          size="small"
          pagination={false}
          sticky
          scroll={{ x: 'max-content', y: DAILY_TABLE_SCROLL_Y }}
          rowClassName={(record) => {
            if (record.rowType === 'monthTotal') return 'row-month-total'
            if (record.rowType === 'monthOrg') return 'row-month-org'
            if (record.rowType === 'dayTotal') return 'row-day-total'
            return ''
          }}
          expandable={{
            defaultExpandedRowKeys: getDefaultExpandedDayKey(rows, monthKey),
            rowExpandable: (record) => Boolean(record.children?.length),
            indentSize: 0,
          }}
        />
      </Card>
    </div>
  )
}

const SalarySection: React.FC<{
  scope: DashboardScope
  orgLabel: string
}> = ({ scope, orgLabel }) => {
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs())
  const [rows, setRows] = useState<SalaryTreeRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [multiSourceCount, setMultiSourceCount] = useState(0)
  const [editingRow, setEditingRow] = useState<SalaryTreeRow | null>(null)
  const [form] = Form.useForm()

  const monthKey = selectedMonth.format('YYYY-MM')

  const loadData = async () => {
    setLoading(true)
    try {
      const [response, facts] = await Promise.all([
        getDashboardDaily(scope, monthKey),
        listSalaryWelfareFacts({
          scope,
          startDate: `${monthKey}-01`,
          endDate: selectedMonth.endOf('month').format('YYYY-MM-DD'),
        }),
      ])

      const factGroups = new Map<string, { id?: number; count: number }>()
      facts.forEach((fact) => {
        const key = `${fact.statDate}|${normalizeOrgName(scope, fact.orgName)}`
        const current = factGroups.get(key) || { id: fact.id, count: 0 }
        factGroups.set(key, { id: current.id || fact.id, count: current.count + 1 })
      })
      setMultiSourceCount(Array.from(factGroups.values()).filter((item) => item.count > 1).length)
      setRows(
        buildSalaryTree(
          scope,
          monthKey,
          (response.sections.salary_welfare?.rows as Record<string, any>[]) || [],
          factGroups,
        ),
      )
    } catch (error) {
      console.error(error)
      message.error('薪酬及福利数据加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [scope, monthKey])

  useEffect(() => {
    if (!editingRow) {
      form.resetFields()
      return
    }
    form.setFieldsValue({
      personName: editingRow.personName || '',
      position: editingRow.position || '',
      positionCategory: editingRow.positionCategory || undefined,
      salary: Number(editingRow.salary || 0),
      annualWelfare: Number(editingRow.annualWelfare || 0),
      monthlyIncentive: Number(editingRow.monthlyIncentive || 0),
      tempReward: Number(editingRow.tempReward || 0),
      deduction: Number(editingRow.deduction || 0),
      managerSalaryTotal: Number(editingRow.managerSalaryTotal || 0),
      staffSalaryTotal: Number(editingRow.staffSalaryTotal || 0),
    })
  }, [editingRow, form])

  const handleSave = async () => {
    if (!editingRow?.statDate) return
    const values = await form.validateFields()
    const payload = {
      scope,
      orgKind: scope === 'hq' ? 'department' : 'campus',
      orgName: editingRow.department,
      statDate: editingRow.statDate,
      userId: null,
      personName: values.personName || '',
      position: values.position || '',
      positionCategory: values.positionCategory || null,
      headcount: 0,
      salary: Number(values.salary || 0),
      annualWelfareTotal: Number(values.annualWelfare || 0),
      monthlyIncentiveTotal: Number(values.monthlyIncentive || 0),
      temporaryRewardTotal: Number(values.tempReward || 0),
      deduction: Number(values.deduction || 0),
      cadreSalaryTotal: Number(values.managerSalaryTotal || 0),
      staffSalaryTotal: Number(values.staffSalaryTotal || 0),
      remark: 'dashboard_daily',
    } as const

    setSaving(true)
    try {
      if (editingRow.factRecordId) {
        await updateSalaryWelfareFact(editingRow.factRecordId, payload)
      } else {
        await createSalaryWelfareFact(payload)
      }
      message.success('薪酬及福利事实已保存')
      setEditingRow(null)
      await loadData()
    } catch (error) {
      console.error(error)
      message.error('薪酬及福利事实保存失败')
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<SalaryTreeRow> = [
    {
      title: '月份',
      dataIndex: 'day',
      key: 'day',
      width: 70,
      fixed: 'left',
      align: 'center',
      render: (value, row) => {
        if (row.rowType === 'monthTotal') return <Text strong>当前合计</Text>
        if (row.rowType === 'dayTotal') return <Text strong>{value}</Text>
        return null
      },
    },
    {
      title: orgLabel,
      dataIndex: 'department',
      key: 'department',
      width: 100,
      fixed: 'left',
      render: (value, row) => {
        if (row.rowType === 'dayTotal' || row.rowType === 'monthTotal')
          return <Text strong>{value || '合计'}</Text>
        return value
      },
    },
    {
      title: '姓名',
      dataIndex: 'personName',
      key: 'personName',
      width: 90,
      render: (value) => value || '',
    },
    {
      title: '岗位',
      dataIndex: 'position',
      key: 'position',
      width: 100,
      render: (value) => value || '',
    },
    {
      title: '岗位类别',
      dataIndex: 'positionCategory',
      key: 'positionCategory',
      width: 90,
      render: (value, row) =>
        row.rowType === 'monthTotal' || row.rowType === 'dayTotal' ? (
          <Text type="secondary">干部/员工</Text>
        ) : (
          value || ''
        ),
    },
    {
      title: '薪酬',
      dataIndex: 'salary',
      key: 'salary',
      width: 90,
      align: 'center',
      render: renderMoney,
    },
    {
      title: '年度福利总额',
      dataIndex: 'annualWelfare',
      key: 'annualWelfare',
      width: 110,
      align: 'center',
      render: renderMoney,
    },
    {
      title: '月度激励总额',
      dataIndex: 'monthlyIncentive',
      key: 'monthlyIncentive',
      width: 110,
      align: 'center',
      render: renderMoney,
    },
    {
      title: '临时奖励总额',
      dataIndex: 'tempReward',
      key: 'tempReward',
      width: 110,
      align: 'center',
      render: renderMoney,
    },
    {
      title: '扣款',
      dataIndex: 'deduction',
      key: 'deduction',
      width: 80,
      align: 'center',
      render: renderMoney,
    },
    {
      title: '干部薪酬总额',
      dataIndex: 'managerSalaryTotal',
      key: 'managerSalaryTotal',
      width: 110,
      align: 'center',
      render: renderMoney,
    },
    {
      title: '基层薪酬总额',
      dataIndex: 'staffSalaryTotal',
      key: 'staffSalaryTotal',
      width: 110,
      align: 'center',
      render: renderMoney,
    },
    {
      title: '薪酬总额',
      dataIndex: 'salaryTotal',
      key: 'salaryTotal',
      width: 100,
      align: 'center',
      render: (value) => <Text strong>{renderMoney(value)}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 70,
      fixed: 'right',
      align: 'center',
      render: (_, row) => {
        if (row.rowType !== 'org') return null
        if (row.factEditable === false) {
          return (
            <Tooltip title={`同一日期同一${orgLabel}存在多条薪酬事实，无法在看板行内覆盖`}>
              <Button type="link" size="small" disabled icon={<EditOutlined />} />
            </Tooltip>
          )
        }
        return (
          <Tooltip title="编辑薪酬事实">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => setEditingRow(row)}
            />
          </Tooltip>
        )
      },
    },
  ]

  return (
    <div>
      <style>{`
        ${DAILY_TABLE_SHARED_STYLE}
        .row-month-total td { background: #fff7e6 !important; font-weight: bold; }
        .row-month-org td { background: #fffbe6 !important; }
        .row-day-total > td { background: #f6ffed !important; font-weight: 600; }
      `}</style>

      <Card size="small" style={{ marginBottom: 12 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text strong>选择月份：</Text>
              <DatePicker
                picker="month"
                value={selectedMonth}
                onChange={(value) => value && setSelectedMonth(value)}
                allowClear={false}
                style={{ width: 160 }}
              />
              <Text type="secondary">
                {selectedMonth.format('YYYY年M月')} 共 {selectedMonth.daysInMonth()} 天
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {multiSourceCount > 0 ? (
        <Alert
          style={{ marginBottom: 12 }}
          type="warning"
          showIcon
          message={`有 ${multiSourceCount} 个日期-${orgLabel} 组合包含多条薪酬事实记录，这些行仅展示聚合结果，不支持看板内覆盖编辑`}
        />
      ) : null}

      <Card>
        <Table
          key={rows.length ? 'loaded' : 'empty'}
          className="daily-dashboard-table"
          columns={columns}
          dataSource={rows}
          rowKey="key"
          loading={loading}
          bordered
          size="small"
          pagination={false}
          sticky
          scroll={{ x: 'max-content', y: DAILY_TABLE_SCROLL_Y }}
          rowClassName={(record) => {
            if (record.rowType === 'monthTotal') return 'row-month-total'
            if (record.rowType === 'monthOrg') return 'row-month-org'
            if (record.rowType === 'dayTotal') return 'row-day-total'
            return ''
          }}
          expandable={{
            defaultExpandedRowKeys: getDefaultExpandedDayKey(rows, monthKey),
            rowExpandable: (record) => Boolean(record.children?.length),
            indentSize: 0,
          }}
        />
      </Card>

      <Modal
        title="编辑薪酬及福利事实"
        open={Boolean(editingRow)}
        onCancel={() => setEditingRow(null)}
        onOk={() => void handleSave()}
        okText="保存"
        cancelText="取消"
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="personName" label="姓名">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="position" label="岗位">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="positionCategory" label="岗位类别">
                <Select allowClear options={POSITION_CATEGORY_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="salary" label="薪酬">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="annualWelfare" label="年度福利总额">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="monthlyIncentive" label="月度激励总额">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="tempReward" label="临时奖励总额">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="deduction" label="扣款">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="managerSalaryTotal" label="干部薪酬总额">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="staffSalaryTotal" label="基层薪酬总额">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

const SocialInsuranceSection: React.FC<{
  scope: DashboardScope
  orgLabel: string
}> = ({ scope, orgLabel }) => {
  const [selectedYear, setSelectedYear] = useState<Dayjs>(dayjs())
  const [rows, setRows] = useState<SocialYearRow[]>([])
  const [loading, setLoading] = useState(false)
  const yearKey = selectedYear.format('YYYY')

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const year = selectedYear.year()
        const responses = await Promise.all(
          Array.from({ length: 12 }, (_, index) => {
            const month = dayjs(`${year}-${String(index + 1).padStart(2, '0')}-01`)
            return getDashboardDaily(scope, month.format('YYYY-MM')).then((response) => ({
              month: index + 1,
              rows: (response.sections.social_insurance?.rows as Record<string, any>[]) || [],
            }))
          }),
        )
        setRows(buildSocialYearTree(responses))
      } catch (error) {
        console.error(error)
        message.error('社保数据加载失败')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [scope, selectedYear])

  const columns: ColumnsType<SocialYearRow> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 75,
      fixed: 'left',
      align: 'center',
      render: (value, row) => {
        if (row.rowType === 'yearTotal') return <Text strong>当前合计</Text>
        if (row.rowType === 'monthTotal') return <Text strong>{value}</Text>
        return null
      },
    },
    {
      title: orgLabel,
      dataIndex: 'department',
      key: 'department',
      width: 90,
      fixed: 'left',
      render: (value, row) => {
        if (row.rowType === 'yearTotal' || row.rowType === 'monthTotal')
          return <Text strong>{value}</Text>
        return value
      },
    },
    {
      title: '应参保人数',
      dataIndex: 'shouldInsureCount',
      key: 'shouldInsureCount',
      width: 95,
      align: 'center',
      render: renderNumeric,
    },
    {
      title: '实际参保人数',
      dataIndex: 'actualInsureCount',
      key: 'actualInsureCount',
      width: 105,
      align: 'center',
      render: renderNumeric,
    },
    {
      title: '参保率',
      dataIndex: 'insureRate',
      key: 'insureRate',
      width: 90,
      align: 'center',
      render: (value) => {
        const percent = parsePercent(value)
        const color = percent === null ? undefined : percent >= 0.9 ? '#52c41a' : '#faad14'
        return <Text style={{ color }}>{renderPercent(value)}</Text>
      },
    },
    {
      title: '姓名',
      dataIndex: 'personName',
      key: 'personName',
      width: 90,
      render: (value) => value || '',
    },
    {
      title: '缴纳总额',
      dataIndex: 'totalPayment',
      key: 'totalPayment',
      width: 90,
      align: 'center',
      render: renderMoney,
    },
    {
      title: '单位缴纳总额',
      dataIndex: 'companyPayment',
      key: 'companyPayment',
      width: 110,
      align: 'center',
      render: renderMoney,
    },
    {
      title: '个人缴纳总额',
      dataIndex: 'personalPayment',
      key: 'personalPayment',
      width: 110,
      align: 'center',
      render: renderMoney,
    },
    {
      title: '服务费总额',
      dataIndex: 'serviceFee',
      key: 'serviceFee',
      width: 95,
      align: 'center',
      render: renderMoney,
    },
    {
      title: '缴费基数',
      dataIndex: 'payBase',
      key: 'payBase',
      width: 90,
      align: 'center',
      render: renderMoney,
    },
    {
      title: '工伤保险',
      children: [
        {
          title: '企业0.5%',
          dataIndex: 'injuryCompany',
          key: 'injuryCompany',
          width: 90,
          align: 'center',
          render: renderMoney,
        },
      ],
    },
    {
      title: '养老',
      children: [
        {
          title: '企业16%',
          dataIndex: 'pensionCompany',
          key: 'pensionCompany',
          width: 90,
          align: 'center',
          render: renderMoney,
        },
        {
          title: '个人8%',
          dataIndex: 'pensionPersonal',
          key: 'pensionPersonal',
          width: 85,
          align: 'center',
          render: renderMoney,
        },
      ],
    },
    {
      title: '失业',
      children: [
        {
          title: '企业0.7%',
          dataIndex: 'unemployCompany',
          key: 'unemployCompany',
          width: 90,
          align: 'center',
          render: renderMoney,
        },
        {
          title: '个人0.3%',
          dataIndex: 'unemployPersonal',
          key: 'unemployPersonal',
          width: 90,
          align: 'center',
          render: renderMoney,
        },
      ],
    },
    {
      title: '医疗',
      children: [
        {
          title: '企业7.5%',
          dataIndex: 'medicalCompany',
          key: 'medicalCompany',
          width: 90,
          align: 'center',
          render: renderMoney,
        },
        {
          title: '个人2%',
          dataIndex: 'medicalPersonal',
          key: 'medicalPersonal',
          width: 85,
          align: 'center',
          render: renderMoney,
        },
      ],
    },
  ]

  return (
    <div>
      <style>{`
        ${DAILY_TABLE_SHARED_STYLE}
        .row-year-total td { background: #fff7e6 !important; font-weight: bold; }
        .row-year-org td { background: #fffbe6 !important; }
        .row-month-total > td { background: #f6ffed !important; font-weight: 600; }
      `}</style>

      <Card size="small" style={{ marginBottom: 12 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text strong>选择年份：</Text>
              <DatePicker
                picker="year"
                value={selectedYear}
                onChange={(value) => value && setSelectedYear(value)}
                allowClear={false}
                style={{ width: 140 }}
              />
              <Text type="secondary">{selectedYear.format('YYYY')}年 共 12 个月</Text>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          key={rows.length ? 'loaded' : 'empty'}
          className="daily-dashboard-table"
          columns={columns}
          dataSource={rows}
          rowKey="key"
          loading={loading}
          bordered
          size="small"
          pagination={false}
          sticky
          scroll={{ x: 'max-content', y: DAILY_TABLE_SCROLL_Y }}
          rowClassName={(record) => {
            if (record.rowType === 'yearTotal') return 'row-year-total'
            if (record.rowType === 'yearOrg') return 'row-year-org'
            if (record.rowType === 'monthTotal') return 'row-month-total'
            return ''
          }}
          expandable={{
            defaultExpandedRowKeys: getDefaultExpandedMonthKey(rows, yearKey),
            rowExpandable: (record) => Boolean(record.children?.length),
            indentSize: 0,
          }}
        />
      </Card>
    </div>
  )
}

const DailyDashboardPage: React.FC<DailyDashboardPageProps> = ({
  scope = 'hq',
  pageTitle,
  businessLabel,
  showSalaryAndInsurance,
  showSalary: showSalaryProp,
  showInsurance: showInsuranceProp,
}) => {
  const resolvedBusinessLabel = businessLabel || (scope === 'hq' ? '最高议事厅' : '线下事业部')
  const resolvedPageTitle = pageTitle || `清美教育集团日度核心数据看板-${resolvedBusinessLabel}`
  const resolvedShowSalaryAndInsurance = showSalaryAndInsurance ?? scope === 'offline'
  const resolvedShowSalary =
    showSalaryProp !== undefined ? showSalaryProp : resolvedShowSalaryAndInsurance
  const resolvedShowInsurance =
    showInsuranceProp !== undefined ? showInsuranceProp : resolvedShowSalaryAndInsurance
  const orgLabel = scope === 'hq' ? '部门' : scope === 'online' ? '岗位' : '神殿'

  const items = useMemo(() => {
    const baseItems = [
      {
        key: 'recruitment',
        label: (
          <span>
            <UsergroupAddOutlined />
            招聘及入职
          </span>
        ),
        children: <RecruitmentSection scope={scope} orgLabel={orgLabel} />,
      },
      {
        key: 'training',
        label: (
          <span>
            <BookOutlined />
            培训
          </span>
        ),
        children: <TrainingSection scope={scope} orgLabel={orgLabel} />,
      },
    ]

    if (resolvedShowSalary) {
      baseItems.push({
        key: 'salary',
        label: (
          <span>
            <DollarOutlined />
            薪酬及福利
          </span>
        ),
        children: <SalarySection scope={scope} orgLabel={orgLabel} />,
      })
    }

    if (resolvedShowInsurance) {
      baseItems.push({
        key: 'insurance',
        label: (
          <span>
            <SafetyOutlined />
            社保
          </span>
        ),
        children: <SocialInsuranceSection scope={scope} orgLabel={orgLabel} />,
      })
    }

    return baseItems
  }, [orgLabel, resolvedShowSalary, resolvedShowInsurance, scope])

  return (
    <div style={{ padding: '0 4px' }}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>
            {resolvedPageTitle}
          </Title>
          <Text type="secondary">004 {resolvedBusinessLabel}日度核心数据看板</Text>
        </div>
        <Tabs defaultActiveKey="recruitment" items={items} type="card" size="middle" />
      </Space>
    </div>
  )
}

export default DailyDashboardPage
