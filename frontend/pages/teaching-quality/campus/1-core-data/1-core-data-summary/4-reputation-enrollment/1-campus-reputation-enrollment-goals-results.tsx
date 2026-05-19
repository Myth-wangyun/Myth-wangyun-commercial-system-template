import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Space, Button, InputNumber as AntInputNumber } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { campusReputationService } from '@/services/teaching-quality/campusReputation'
import type { CampusReputationRecord } from '@/types/campus-reputation'
import eventBus from '@/utils/eventBus'

interface MonthRow {
  key: string
  month: number // 1-12
  campus: string
  targetReputation: number
  actualReputation: number
  targetVisits: number
  actualVisits: number
  targetStudents: number
  actualStudents: number
  targetRevenue: number
  actualRevenue: number
  isSummary?: boolean
}

const createInitialRows = (campus: string): MonthRow[] =>
  Array.from({ length: 12 }, (_, idx) => {
    const month = idx + 1
    return {
      key: String(month),
      month,
      campus,
      targetReputation: 0,
      actualReputation: 0,
      targetVisits: 0,
      actualVisits: 0,
      targetStudents: 0,
      actualStudents: 0,
      targetRevenue: 0,
      actualRevenue: 0,
    }
  })

const CampusReputationEnrollmentGoalsResults: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [rows, setRows] = useState<MonthRow[]>(createInitialRows(currentCampus || ''))
  const [loading, setLoading] = useState(false)

  const canIO = useMemo(() => Boolean(currentCampus && year), [currentCampus, year])

  const summaryRow: MonthRow = useMemo(() => {
    const total = rows.reduce(
      (acc, r) => {
        acc.targetReputation += r.targetReputation || 0
        acc.actualReputation += r.actualReputation || 0
        acc.targetVisits += r.targetVisits || 0
        acc.actualVisits += r.actualVisits || 0
        acc.targetStudents += r.targetStudents || 0
        acc.actualStudents += r.actualStudents || 0
        acc.targetRevenue += r.targetRevenue || 0
        acc.actualRevenue += r.actualRevenue || 0
        return acc
      },
      {
        targetReputation: 0,
        actualReputation: 0,
        targetVisits: 0,
        actualVisits: 0,
        targetStudents: 0,
        actualStudents: 0,
        targetRevenue: 0,
        actualRevenue: 0,
      },
    )

    return {
      key: 'summary',
      month: 0,
      campus: '',
      ...total,
      isSummary: true,
    }
  }, [rows])

  const dataSource: MonthRow[] = useMemo(() => [...rows, summaryRow], [rows, summaryRow])

  // 将服务返回的数据库数据映射到本地 12 个月结构（固定展示 1-12 月，不足补 0，多余忽略）
  const applyServiceRows = (list: CampusReputationRecord[]) => {
    const base = createInitialRows(currentCampus || '')
    const monthly = (list || []).filter((r) => r.month >= 1 && r.month <= 12)
    monthly.forEach((r) => {
      const idx = base.findIndex((x) => x.month === r.month)
      if (idx >= 0) {
        base[idx] = {
          ...base[idx],
          targetReputation: Number(r.targetReputationCount) || 0,
          actualReputation: Number(r.actualReputationCount) || 0,
          targetVisits: Number(r.targetWalkInCount) || 0,
          actualVisits: Number(r.actualWalkInCount) || 0,
          targetStudents: Number(r.targetEnrollmentCount) || 0,
          actualStudents: Number(r.actualEnrollmentCount) || 0,
          targetRevenue: Number(r.targetRevenue) || 0,
          actualRevenue: Number(r.actualRevenue) || 0,
        }
      }
    })
    setRows(base)
  }

  const fetchFromServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    try {
      setLoading(true)
      const list = await campusReputationService.getCampusReputationData(currentCampus!, year)
      applyServiceRows(list)
      message.success('已刷新')
    } catch (e) {
      console.error(e)
      message.error('刷新失败')
      setRows(createInitialRows(currentCampus || ''))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentCampus) {
      setRows(createInitialRows(currentCampus))
      fetchFromServer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year])

  // 监听“明细表保存”事件：自动刷新本表
  useEffect(() => {
    const off = eventBus.on('tq:reputation:detailSaved', (payload: any) => {
      if (!currentCampus) return
      // 只刷新同神殿/同年份的数据（避免切换神殿后被旧事件误刷新）
      if (payload?.campus && payload.campus !== currentCampus) return
      if (payload?.year && payload.year !== year) return
      fetchFromServer()
    })
    return off
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year])

  // 监听“月度个人表保存”事件：自动刷新本表
  useEffect(() => {
    const off = eventBus.on('tq:reputation:monthlySaved', (payload: any) => {
      if (!currentCampus) return
      if (payload?.campus && payload.campus !== currentCampus) return
      if (payload?.year && payload.year !== year) return
      fetchFromServer()
    })
    return off
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year])

  const columns: ColumnsType<MonthRow> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      render: (value: number, record) =>
        (record as any).isSummary ? <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span> : value,
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      align: 'center',
      render: (text: string, record) => ((record as any).isSummary ? '' : text || ''),
    },
    {
      title: '口碑量',
      children: [
        {
          title: '目标口碑量',
          dataIndex: 'targetReputation',
          key: 'targetReputation',
          width: 120,
          align: 'center',
          render: (value: number, record) => {
            const isSummary = (record as any).isSummary
            return <span style={isSummary ? { color: 'red', fontWeight: 'bold' } : {}}>{value || 0}</span>
          },
        },
        {
          title: '实际口碑量',
          dataIndex: 'actualReputation',
          key: 'actualReputation',
          width: 120,
          align: 'center',
          render: (value: number, record) => {
            const isSummary = (record as any).isSummary
            return <span style={isSummary ? { color: 'red', fontWeight: 'bold' } : {}}>{value || 0}</span>
          },
        },
      ],
    },
    {
      title: '上门量',
      children: [
        {
          title: '目标上门量',
          dataIndex: 'targetVisits',
          key: 'targetVisits',
          width: 120,
          align: 'center',
          render: (value: number, record) => {
            const isSummary = (record as any).isSummary
            return <span style={isSummary ? { color: 'red', fontWeight: 'bold' } : {}}>{value || 0}</span>
          },
        },
        {
          title: '实际上门量',
          dataIndex: 'actualVisits',
          key: 'actualVisits',
          width: 120,
          align: 'center',
          render: (value: number, record) => {
            const isSummary = (record as any).isSummary
            return <span style={isSummary ? { color: 'red', fontWeight: 'bold' } : {}}>{value || 0}</span>
          },
        },
      ],
    },
    {
      title: '招生人数',
      children: [
        {
          title: '目标人数',
          dataIndex: 'targetStudents',
          key: 'targetStudents',
          width: 120,
          align: 'center',
          render: (value: number, record) => {
            const isSummary = (record as any).isSummary
            return <span style={isSummary ? { color: 'red', fontWeight: 'bold' } : {}}>{value || 0}</span>
          },
        },
        {
          title: '实际人数',
          dataIndex: 'actualStudents',
          key: 'actualStudents',
          width: 120,
          align: 'center',
          render: (value: number, record) => {
            const isSummary = (record as any).isSummary
            return <span style={isSummary ? { color: 'red', fontWeight: 'bold' } : {}}>{value || 0}</span>
          },
        },
      ],
    },
    {
      title: '口碑收入',
      children: [
        {
          title: '目标收入',
          dataIndex: 'targetRevenue',
          key: 'targetRevenue',
          width: 120,
          align: 'center',
          render: (value: number, record) => {
            const isSummary = (record as any).isSummary
            return <span style={isSummary ? { color: 'red', fontWeight: 'bold' } : {}}>{value || 0}</span>
          },
        },
        {
          title: '实际收入',
          dataIndex: 'actualRevenue',
          key: 'actualRevenue',
          width: 120,
          align: 'center',
          render: (value: number, record) => {
            const isSummary = (record as any).isSummary
            return <span style={isSummary ? { color: 'red', fontWeight: 'bold' } : {}}>{value || 0}</span>
          },
        },
      ],
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card title={`04${currentCampus || ''}教化司口碑招生目标与结果汇总表`} extra={
        <Space>
          <span>年份</span>
          <AntInputNumber
            min={2000}
            max={2100}
            value={year}
            onChange={(v) => setYear(typeof v === 'number' ? v : new Date().getFullYear())}
            style={{ width: 100 }}
          />
          <Button type="primary" onClick={fetchFromServer} disabled={!canIO} loading={loading}>刷新</Button>
        </Space>
      }>
        <Table<MonthRow>
          bordered
          size="small"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
          loading={loading}
          rowClassName={(record) => ((record as any).isSummary ? 'summary-row' : '')}
        />
      </Card>
    </div>
  )
}

// 添加样式（仅在浏览器环境注入，避免 SSR 报错）
if (typeof document !== 'undefined') {
  const styleId = 'campus-reputation-enrollment-goals-results-summary-style'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .summary-row {
        background-color: #fff1f0 !important;
      }
      
      .summary-row > td {
        background-color: #fff1f0 !important;
        border-top: 2px solid #ff4d4f;
      }
    `
    document.head.appendChild(style)
  }
}

export default CampusReputationEnrollmentGoalsResults
