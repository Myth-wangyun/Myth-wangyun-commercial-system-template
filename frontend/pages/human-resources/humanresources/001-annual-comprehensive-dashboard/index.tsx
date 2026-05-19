import React, { useEffect, useMemo, useState } from 'react'
import { App, Alert, Card, DatePicker, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'

import {
  getDashboardAnnual,
  type DashboardAnnualResponse,
} from '@/services/humanresources/dashboardAnnual'
import { HQ_DIVISIONS, OFFLINE_CAMPUSES } from '../shared/monthlyDashboardShared'

/**
 * 001 集团人力资源年度综合看板
 * 最高议事厅 -> 人事部 -> 核心数据
 * 路由: /humanresources/core/annual-comprehensive-dashboard
 */

const { Text, Title } = Typography

const EXCEL_DIV_ZERO = '#DIV/0!'
const ONLINE_PROTOTYPE_DEPARTMENTS = ['神藏司', '教化司', '智慧司', '祈福司', '市场部']

type AnnualScope = 'hq' | 'online' | 'offline'
type CellValue = number | string | ''
type SummaryRecord = Record<string, unknown>

interface SummaryTableRow {
  key: string
  rowKind: 'total' | 'data' | 'placeholder'
  sequence: number
  organization: string
  headcount: CellValue
  cadreCount: CellValue
  staffCount: CellValue
  studentCount: CellValue
  interviewCount: CellValue
  onboardCount: CellValue
  onboardRate: string
  transferCount: CellValue
  optimizeCount: CellValue
  resignCount: CellValue
  resignRate: string
  trainingSessionsPrimary: CellValue
  trainingSessionsSecondary: CellValue
  trainingParticipants: CellValue
  trainingPassRate: string
  annualSalaryTotal: CellValue
  annualSalaryPerCapita: CellValue
  annualWelfareTotal: CellValue
  shouldInsureCount: CellValue
  actualInsureCount: CellValue
  insureRate: string
  insurancePayTotal: CellValue
}

interface SectionCardProps {
  accent: string
  caption?: string
  columns: ColumnsType<SummaryTableRow>
  dataSource: SummaryTableRow[]
  loading: boolean
  note?: string
  scrollX?: number
  title: string
}

const toNumber = (value: unknown): number => {
  if (value === '' || value === null || value === undefined) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const toCellValue = (value: unknown, fallback: CellValue = ''): CellValue => {
  if (value === '' || value === null || value === undefined) return fallback
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback
  return String(value)
}

const toRate = (value: unknown, fallback = EXCEL_DIV_ZERO): string => {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

const parsePercent = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  if (typeof value === 'string') {
    const numeric = Number.parseFloat(value.replace('%', '').trim())
    return Number.isFinite(numeric) ? numeric / 100 : 0
  }
  return 0
}

const formatPercent = (numerator: number, denominator: number): string => {
  if (denominator <= 0) return EXCEL_DIV_ZERO
  return `${((numerator / denominator) * 100).toFixed(1)}%`
}

const formatNumericCell = (value: CellValue) => {
  if (value === '') return ''
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : value.toFixed(2)
  }
  return value
}

const createEmptyRow = (
  sequence: number,
  organization: string,
  options: {
    includeStudentCount: boolean
    populateWithZeros: boolean
    rowKind: SummaryTableRow['rowKind']
  },
): SummaryTableRow => ({
  key: `${options.rowKind}-${sequence}-${organization || 'row'}`,
  rowKind: options.rowKind,
  sequence,
  organization,
  headcount: options.populateWithZeros ? 0 : '',
  cadreCount: options.populateWithZeros ? 0 : '',
  staffCount: options.populateWithZeros ? 0 : '',
  studentCount: options.includeStudentCount ? 0 : '',
  interviewCount: options.populateWithZeros ? 0 : '',
  onboardCount: options.populateWithZeros ? 0 : '',
  onboardRate: options.populateWithZeros ? EXCEL_DIV_ZERO : '',
  transferCount: options.populateWithZeros ? 0 : '',
  optimizeCount: options.populateWithZeros ? 0 : '',
  resignCount: options.populateWithZeros ? 0 : '',
  resignRate: options.populateWithZeros ? EXCEL_DIV_ZERO : '',
  trainingSessionsPrimary: options.populateWithZeros ? 0 : '',
  trainingSessionsSecondary: options.populateWithZeros ? 0 : '',
  trainingParticipants: options.populateWithZeros ? 0 : '',
  trainingPassRate: options.populateWithZeros ? EXCEL_DIV_ZERO : '',
  annualSalaryTotal: options.populateWithZeros ? 0 : '',
  annualSalaryPerCapita: options.populateWithZeros ? 0 : '',
  annualWelfareTotal: options.populateWithZeros ? 0 : '',
  shouldInsureCount: options.populateWithZeros ? 0 : '',
  actualInsureCount: options.populateWithZeros ? 0 : '',
  insureRate: options.populateWithZeros ? EXCEL_DIV_ZERO : '',
  insurancePayTotal: options.populateWithZeros ? 0 : '',
})

const getSummaryRecords = (response?: DashboardAnnualResponse): SummaryRecord[] =>
  (response?.sections.summary?.rows as SummaryRecord[]) || []

const findSummaryRecord = (
  response: DashboardAnnualResponse | undefined,
  organization: string,
): SummaryRecord | undefined =>
  getSummaryRecords(response).find((row) => String(row.division || '') === organization)

const mapSummaryRecord = (
  record: SummaryRecord | undefined,
  sequence: number,
  organization: string,
  options: {
    includeStudentCount: boolean
    rowKind: SummaryTableRow['rowKind']
  },
): SummaryTableRow => {
  if (!record) {
    return createEmptyRow(sequence, organization, {
      includeStudentCount: options.includeStudentCount,
      populateWithZeros: options.rowKind === 'total',
      rowKind: 'placeholder',
    })
  }

  return {
    key: `data-${sequence}-${organization || 'row'}`,
    rowKind: options.rowKind,
    sequence,
    organization,
    headcount: toCellValue(record.deptCount, 0),
    cadreCount: toCellValue(record.cadreCount, 0),
    staffCount: toCellValue(record.staffCount, 0),
    studentCount: options.includeStudentCount ? toCellValue(record.studentCount, 0) : '',
    interviewCount: toCellValue(record.interviewCount, 0),
    onboardCount: toCellValue(record.onboardCount, 0),
    onboardRate: toRate(record.onboardRate),
    transferCount: toCellValue(record.transferCount, 0),
    optimizeCount: toCellValue(record.optimizeCount, 0),
    resignCount: toCellValue(record.resignCount, 0),
    resignRate: toRate(record.resignRate),
    trainingSessionsPrimary: toCellValue(record.trainingSessions1, 0),
    trainingSessionsSecondary: toCellValue(record.trainingSessions2, 0),
    trainingParticipants: toCellValue(record.trainingParticipants, 0),
    trainingPassRate: toRate(record.trainingPassRate),
    annualSalaryTotal: toCellValue(record.annualSalaryTotal, 0),
    annualSalaryPerCapita: toCellValue(record.annualSalaryPerCapita, 0),
    annualWelfareTotal: toCellValue(record.annualWelfareTotal, 0),
    shouldInsureCount: toCellValue(record.shouldInsureCount, 0),
    actualInsureCount: toCellValue(record.actualInsureCount, 0),
    insureRate: toRate(record.insureRate),
    insurancePayTotal: toCellValue(record.insurancePayTotal, 0),
  }
}

const combineRows = (rows: SummaryTableRow[]): SummaryTableRow => {
  const totalHeadcount = rows.reduce((sum, row) => sum + toNumber(row.headcount), 0)
  const totalInterviewCount = rows.reduce((sum, row) => sum + toNumber(row.interviewCount), 0)
  const totalOnboardCount = rows.reduce((sum, row) => sum + toNumber(row.onboardCount), 0)
  const totalResignCount = rows.reduce((sum, row) => sum + toNumber(row.resignCount), 0)
  const totalTrainingParticipants = rows.reduce(
    (sum, row) => sum + toNumber(row.trainingParticipants),
    0,
  )
  const totalShouldInsureCount = rows.reduce((sum, row) => sum + toNumber(row.shouldInsureCount), 0)
  const totalActualInsureCount = rows.reduce((sum, row) => sum + toNumber(row.actualInsureCount), 0)
  const totalTrainingPassParticipants = rows.reduce(
    (sum, row) => sum + toNumber(row.trainingParticipants) * parsePercent(row.trainingPassRate),
    0,
  )
  const totalSalary = rows.reduce((sum, row) => sum + toNumber(row.annualSalaryTotal), 0)

  return {
    key: 'group-total',
    rowKind: 'total',
    sequence: 1,
    organization: '合计',
    headcount: totalHeadcount,
    cadreCount: rows.reduce((sum, row) => sum + toNumber(row.cadreCount), 0),
    staffCount: rows.reduce((sum, row) => sum + toNumber(row.staffCount), 0),
    studentCount: rows.reduce((sum, row) => sum + toNumber(row.studentCount), 0),
    interviewCount: totalInterviewCount,
    onboardCount: totalOnboardCount,
    onboardRate: formatPercent(totalOnboardCount, totalInterviewCount),
    transferCount: rows.reduce((sum, row) => sum + toNumber(row.transferCount), 0),
    optimizeCount: rows.reduce((sum, row) => sum + toNumber(row.optimizeCount), 0),
    resignCount: totalResignCount,
    resignRate: formatPercent(totalResignCount, totalHeadcount),
    trainingSessionsPrimary: rows.reduce(
      (sum, row) => sum + toNumber(row.trainingSessionsPrimary),
      0,
    ),
    trainingSessionsSecondary: rows.reduce(
      (sum, row) => sum + toNumber(row.trainingSessionsSecondary),
      0,
    ),
    trainingParticipants: totalTrainingParticipants,
    trainingPassRate: formatPercent(totalTrainingPassParticipants, totalTrainingParticipants),
    annualSalaryTotal: Number(totalSalary.toFixed(2)),
    annualSalaryPerCapita:
      totalHeadcount > 0 ? Number((totalSalary / totalHeadcount).toFixed(2)) : 0,
    annualWelfareTotal: Number(
      rows.reduce((sum, row) => sum + toNumber(row.annualWelfareTotal), 0).toFixed(2),
    ),
    shouldInsureCount: totalShouldInsureCount,
    actualInsureCount: totalActualInsureCount,
    insureRate: formatPercent(totalActualInsureCount, totalShouldInsureCount),
    insurancePayTotal: Number(
      rows.reduce((sum, row) => sum + toNumber(row.insurancePayTotal), 0).toFixed(2),
    ),
  }
}

const buildOverviewRows = (
  responses: Partial<Record<AnnualScope, DashboardAnnualResponse>>,
): SummaryTableRow[] => {
  const managementRow = mapSummaryRecord(findSummaryRecord(responses.hq, '合计'), 2, '最高议事厅', {
    includeStudentCount: true,
    rowKind: 'data',
  })
  const onlineRow = mapSummaryRecord(findSummaryRecord(responses.online, '合计'), 3, '线上事业部', {
    includeStudentCount: true,
    rowKind: 'data',
  })
  const offlineRow = mapSummaryRecord(
    findSummaryRecord(responses.offline, '合计'),
    4,
    '线下事业部',
    {
      includeStudentCount: true,
      rowKind: 'data',
    },
  )

  // Student count is not exposed by current annual APIs; keep the prototype-style placeholder.
  managementRow.studentCount = 0
  onlineRow.studentCount = 0
  offlineRow.studentCount = 0

  return [combineRows([managementRow, onlineRow, offlineRow]), managementRow, onlineRow, offlineRow]
}

const buildDetailRows = (
  response: DashboardAnnualResponse | undefined,
  labels: string[],
  options: {
    includeStudentCount: boolean
  },
): SummaryTableRow[] => [
  mapSummaryRecord(findSummaryRecord(response, '合计'), 1, '合计', {
    includeStudentCount: options.includeStudentCount,
    rowKind: 'total',
  }),
  ...labels.map((label, index) =>
    mapSummaryRecord(findSummaryRecord(response, label), index + 2, label, {
      includeStudentCount: options.includeStudentCount,
      rowKind: 'data',
    }),
  ),
]

const buildInitialOverviewRows = () => [
  createEmptyRow(1, '合计', {
    includeStudentCount: true,
    populateWithZeros: true,
    rowKind: 'total',
  }),
  createEmptyRow(2, '最高议事厅', {
    includeStudentCount: true,
    populateWithZeros: true,
    rowKind: 'data',
  }),
  createEmptyRow(3, '线上事业部', {
    includeStudentCount: true,
    populateWithZeros: true,
    rowKind: 'data',
  }),
  createEmptyRow(4, '线下事业部', {
    includeStudentCount: true,
    populateWithZeros: true,
    rowKind: 'data',
  }),
]

const buildInitialDetailRows = (labels: string[], includeStudentCount: boolean) => [
  createEmptyRow(1, '合计', { includeStudentCount, populateWithZeros: true, rowKind: 'total' }),
  ...labels.map((label, index) =>
    createEmptyRow(index + 2, label, {
      includeStudentCount,
      populateWithZeros: false,
      rowKind: 'placeholder',
    }),
  ),
]

const createColumns = ({
  includeStudentCount,
  labelTitle,
  workforceTitle,
}: {
  includeStudentCount: boolean
  labelTitle: string
  workforceTitle: string
}): ColumnsType<SummaryTableRow> => {
  const workforceColumns: ColumnsType<SummaryTableRow> = [
    {
      title: '总人数',
      dataIndex: 'headcount',
      key: 'headcount',
      width: 96,
      align: 'center',
      render: formatNumericCell,
    },
    {
      title: '干部总数量',
      dataIndex: 'cadreCount',
      key: 'cadreCount',
      width: 108,
      align: 'center',
      render: formatNumericCell,
    },
    {
      title: '员工总数量',
      dataIndex: 'staffCount',
      key: 'staffCount',
      width: 108,
      align: 'center',
      render: formatNumericCell,
    },
  ]

  if (includeStudentCount) {
    workforceColumns.push({
      title: '学生数量',
      dataIndex: 'studentCount',
      key: 'studentCount',
      width: 96,
      align: 'center',
      render: formatNumericCell,
    })
  }

  return [
    {
      title: '序号',
      dataIndex: 'sequence',
      key: 'sequence',
      width: 72,
      align: 'center',
      fixed: 'left',
    },
    {
      title: labelTitle,
      dataIndex: 'organization',
      key: 'organization',
      width: 128,
      align: 'center',
      fixed: 'left',
    },
    {
      title: workforceTitle,
      children: workforceColumns,
    },
    {
      title: '人力资源配置',
      children: [
        {
          title: '面试人数',
          dataIndex: 'interviewCount',
          key: 'interviewCount',
          width: 96,
          align: 'center',
          render: formatNumericCell,
        },
        {
          title: '入职人数',
          dataIndex: 'onboardCount',
          key: 'onboardCount',
          width: 96,
          align: 'center',
          render: formatNumericCell,
        },
        {
          title: '入职率',
          dataIndex: 'onboardRate',
          key: 'onboardRate',
          width: 96,
          align: 'center',
        },
        {
          title: '调岗人数',
          dataIndex: 'transferCount',
          key: 'transferCount',
          width: 96,
          align: 'center',
          render: formatNumericCell,
        },
        {
          title: '实际优化人数',
          dataIndex: 'optimizeCount',
          key: 'optimizeCount',
          width: 116,
          align: 'center',
          render: formatNumericCell,
        },
        {
          title: '离职人数',
          dataIndex: 'resignCount',
          key: 'resignCount',
          width: 96,
          align: 'center',
          render: formatNumericCell,
        },
        {
          title: '离职率',
          dataIndex: 'resignRate',
          key: 'resignRate',
          width: 96,
          align: 'center',
        },
      ],
    },
    {
      title: '培训',
      children: [
        {
          title: '培训场次',
          dataIndex: 'trainingSessionsPrimary',
          key: 'trainingSessionsPrimary',
          width: 96,
          align: 'center',
          render: formatNumericCell,
        },
        {
          title: '培训场次',
          dataIndex: 'trainingSessionsSecondary',
          key: 'trainingSessionsSecondary',
          width: 96,
          align: 'center',
          render: formatNumericCell,
        },
        {
          title: '培训人次',
          dataIndex: 'trainingParticipants',
          key: 'trainingParticipants',
          width: 96,
          align: 'center',
          render: formatNumericCell,
        },
        {
          title: '培训合格率',
          dataIndex: 'trainingPassRate',
          key: 'trainingPassRate',
          width: 108,
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
          width: 128,
          align: 'center',
          render: formatNumericCell,
        },
        {
          title: '人均年度薪酬',
          dataIndex: 'annualSalaryPerCapita',
          key: 'annualSalaryPerCapita',
          width: 128,
          align: 'center',
          render: formatNumericCell,
        },
        {
          title: '年度福利总额',
          dataIndex: 'annualWelfareTotal',
          key: 'annualWelfareTotal',
          width: 120,
          align: 'center',
          render: formatNumericCell,
        },
      ],
    },
    {
      title: '社保',
      children: [
        {
          title: '应参保人数',
          dataIndex: 'shouldInsureCount',
          key: 'shouldInsureCount',
          width: 116,
          align: 'center',
          render: formatNumericCell,
        },
        {
          title: '实际参保人数',
          dataIndex: 'actualInsureCount',
          key: 'actualInsureCount',
          width: 124,
          align: 'center',
          render: formatNumericCell,
        },
        {
          title: '参保率',
          dataIndex: 'insureRate',
          key: 'insureRate',
          width: 96,
          align: 'center',
        },
        {
          title: '社保缴纳总额',
          dataIndex: 'insurancePayTotal',
          key: 'insurancePayTotal',
          width: 128,
          align: 'center',
          render: formatNumericCell,
        },
      ],
    },
  ]
}

const SectionCard: React.FC<SectionCardProps> = ({
  accent,
  caption,
  columns,
  dataSource,
  loading,
  note,
  scrollX = 2400,
  title,
}) => (
  <Card
    style={{
      borderRadius: 18,
      borderTop: `4px solid ${accent}`,
      boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)',
    }}
    styles={{ body: { padding: 18 } }}
  >
    <Space direction="vertical" size={14} style={{ width: '100%' }}>
      <div>
        <Title level={5} style={{ margin: 0 }}>
          {title}
        </Title>
        {caption ? (
          <Text type="secondary" style={{ display: 'block', marginTop: 6 }}>
            {caption}
          </Text>
        ) : null}
      </div>

      {note ? <Alert type="info" showIcon message={note} /> : null}

      <Table<SummaryTableRow>
        bordered
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={false}
        rowClassName={(record) => {
          if (record.rowKind === 'total') return 'core-annual-total-row'
          if (record.rowKind === 'placeholder') return 'core-annual-placeholder-row'
          return ''
        }}
        scroll={{ x: scrollX }}
        size="small"
      />
    </Space>
  </Card>
)

const AnnualComprehensiveDashboard: React.FC = () => {
  const { message } = App.useApp()
  const [selectedYear, setSelectedYear] = useState<Dayjs>(dayjs())
  const [loading, setLoading] = useState(false)
  const [overviewRows, setOverviewRows] = useState<SummaryTableRow[]>(() =>
    buildInitialOverviewRows(),
  )
  const [hqRows, setHqRows] = useState<SummaryTableRow[]>(() =>
    buildInitialDetailRows(HQ_DIVISIONS, false),
  )
  const [onlineRows, setOnlineRows] = useState<SummaryTableRow[]>(() =>
    buildInitialDetailRows(ONLINE_PROTOTYPE_DEPARTMENTS, true),
  )
  const [offlineRows, setOfflineRows] = useState<SummaryTableRow[]>(() =>
    buildInitialDetailRows(OFFLINE_CAMPUSES, true),
  )

  const overviewColumns = useMemo(
    () =>
      createColumns({
        labelTitle: '事业部',
        workforceTitle: '职数和学生数',
        includeStudentCount: true,
      }),
    [],
  )
  const hqColumns = useMemo(
    () =>
      createColumns({
        labelTitle: '部门',
        workforceTitle: '职数和部门员工数',
        includeStudentCount: false,
      }),
    [],
  )
  const onlineColumns = useMemo(
    () =>
      createColumns({
        labelTitle: '部门',
        workforceTitle: '职数和部门员工数',
        includeStudentCount: true,
      }),
    [],
  )
  const offlineColumns = useMemo(
    () =>
      createColumns({
        labelTitle: '神殿',
        workforceTitle: '职数和部门员工数',
        includeStudentCount: true,
      }),
    [],
  )

  useEffect(() => {
    let active = true
    const year = selectedYear.format('YYYY')

    setLoading(true)
    setOverviewRows(buildInitialOverviewRows())
    setHqRows(buildInitialDetailRows(HQ_DIVISIONS, false))
    setOnlineRows(buildInitialDetailRows(ONLINE_PROTOTYPE_DEPARTMENTS, true))
    setOfflineRows(buildInitialDetailRows(OFFLINE_CAMPUSES, true))

    Promise.all([
      getDashboardAnnual('hq', year),
      getDashboardAnnual('online', year),
      getDashboardAnnual('offline', year),
    ])
      .then(([hqResponse, onlineResponse, offlineResponse]) => {
        if (!active) return

        setOverviewRows(
          buildOverviewRows({
            hq: hqResponse,
            online: onlineResponse,
            offline: offlineResponse,
          }),
        )
        setHqRows(buildDetailRows(hqResponse, HQ_DIVISIONS, { includeStudentCount: false }))
        setOnlineRows(
          buildDetailRows(onlineResponse, ONLINE_PROTOTYPE_DEPARTMENTS, {
            includeStudentCount: true,
          }),
        )
        setOfflineRows(
          buildDetailRows(offlineResponse, OFFLINE_CAMPUSES, { includeStudentCount: true }),
        )
      })
      .catch((error) => {
        if (!active) return
        console.error('加载集团人力资源年度综合看板失败', error)
        message.error('加载集团人力资源年度综合看板失败')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [selectedYear])

  return (
    <div
      style={{
        padding: 24,
        background: 'linear-gradient(180deg, #f4f8fc 0%, #ffffff 240px)',
        minHeight: '100%',
      }}
    >
      <style>{`
        .core-annual-total-row > td {
          background: #eef6ff !important;
          font-weight: 700;
        }

        .core-annual-placeholder-row > td {
          color: rgba(15, 23, 42, 0.45);
        }
      `}</style>

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card
          style={{
            borderRadius: 20,
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)',
            overflow: 'hidden',
          }}
          styles={{ body: { padding: 22 } }}
        >
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Space
              align="center"
              style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}
            >
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  清美教育集团年度核心数据总表
                </Title>
                <Text type="secondary" style={{ display: 'block', marginTop: 6 }}>
                  001 集团人力资源年度综合看板
                </Text>
              </div>

              <Space>
                <Text strong>年度</Text>
                <DatePicker
                  allowClear={false}
                  picker="year"
                  value={selectedYear}
                  onChange={(value) => value && setSelectedYear(value)}
                />
              </Space>
            </Space>

            <Alert
              type="success"
              showIcon
              message="页面结构按 Excel 原型落地；最高议事厅、线上事业部、线下事业部三个年度接口会在这里汇总展示。"
            />
          </Space>
        </Card>

        <SectionCard
          accent="#1668dc"
          caption="清美教育集团年度核心数据总表"
          columns={overviewColumns}
          dataSource={overviewRows}
          loading={loading}
          note="学生数量字段当前年度接口未提供，页面保留了原型位置并以占位值展示。"
          title="集团总表"
        />

        <SectionCard
          accent="#d46b08"
          caption="清美教育集团年度核心数据看板-最高议事厅-从002 最高议事厅年度核心数据看板获得"
          columns={hqColumns}
          dataSource={hqRows}
          loading={loading}
          scrollX={2280}
          title="最高议事厅"
        />

        <SectionCard
          accent="#389e0d"
          caption="清美教育集团年度核心数据看板-线上事业部-从002 最高议事厅年度核心数据看板获得"
          columns={onlineColumns}
          dataSource={onlineRows}
          loading={loading}
          note="Excel 原型中的线上分表行标签为“神藏司/教化司/智慧司/祈福司/市场部”，与现有线上年度接口组织口径不一致；当前仅接入合计行，明细行按原型保留。"
          title="线上事业部"
        />

        <SectionCard
          accent="#c41d7f"
          caption="清美教育集团年度核心数据看板-线下事业部-从002 最高议事厅年度核心数据看板获得"
          columns={offlineColumns}
          dataSource={offlineRows}
          loading={loading}
          title="线下事业部"
        />
      </Space>
    </div>
  )
}

export default AnnualComprehensiveDashboard
