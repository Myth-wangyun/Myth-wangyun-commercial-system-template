import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Space, Button, InputNumber as AntInputNumber } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'
import eventBus from '@/utils/eventBus'

interface PersonalReputationRow {
  key: string
  serialNumber: number
  name: string
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

const createInitialRows = (): PersonalReputationRow[] => {
  return []
}

const recomputeSummary = (rows: PersonalReputationRow[]): PersonalReputationRow => {
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
    serialNumber: 0,
    name: '合计',
    ...total,
    isSummary: true,
  }
}

const ShengbangPersonalReputationEnrollmentSummary: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [rows, setRows] = useState<PersonalReputationRow[]>([])
  const [loading, setLoading] = useState(false)

  const canIO = useMemo(() => Boolean(currentCampus && year), [currentCampus, year])

  const applyServerRows = (list: any[]) => {
    const converted: PersonalReputationRow[] = list.map((r: any) => ({
      key: String(r.serialNumber),
      serialNumber: r.serialNumber,
      name: r.name || '',
      targetReputation: Number(r.targetReputation || 0),
      actualReputation: Number(r.actualReputation || 0),
      targetVisits: Number(r.targetVisits || 0),
      actualVisits: Number(r.actualVisits || 0),
      targetStudents: Number(r.targetStudents || 0),
      actualStudents: Number(r.actualStudents || 0),
      targetRevenue: Number(r.targetRevenue || 0),
      actualRevenue: Number(r.actualRevenue || 0),
    }))
    const summary = recomputeSummary(converted)
    setRows([...converted, summary])
  }

  const fetchFromServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    try {
      setLoading(true)
      const res = await fetch(
        buildApiUrl(`/teaching-quality/campus-personal-reputation-enrollment-goals-results?campus=${encodeURIComponent(
          currentCampus!,
        )}&year=${year}`),
      )
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      applyServerRows(data?.行列表 || [])
      message.success('已刷新')
    } catch (e) {
      console.error(e)
      message.error('刷新失败')
    } finally {
      setLoading(false)
    }
  }

  const syncFromServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    try {
      setLoading(true)
      const payload = {
        神殿名称: currentCampus!,
        年份: year,
        行列表: [],
      }
      const res = await fetch(
        buildApiUrl('/teaching-quality/campus-personal-reputation-enrollment-goals-results/sync'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )
      if (!res.ok) throw new Error(await res.text())
      message.success('同步成功')
      await fetchFromServer()
    } catch (e) {
      console.error(e)
      message.error('同步失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentCampus) {
      setRows([])
      fetchFromServer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year])

  // 监听“明细表保存”事件：自动刷新本表
  useEffect(() => {
    const off = eventBus.on('tq:reputation:detailSaved', (payload: any) => {
      if (!currentCampus) return
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



  const columns: ColumnsType<PersonalReputationRow> = useMemo(
    () => [
      {
        title: '序号',
        dataIndex: 'serialNumber',
        key: 'serialNumber',
        width: 80,
        align: 'center',
        render: (value, record) =>
          record.isSummary ? <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span> : value,
      },
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 140,
        align: 'center',
        render: (text, record) =>
          record.isSummary ? '' : text,
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
              const isSummary = record.isSummary
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
              const isSummary = record.isSummary
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
              const isSummary = record.isSummary
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
              const isSummary = record.isSummary
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
              const isSummary = record.isSummary
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
              const isSummary = record.isSummary
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
              const isSummary = record.isSummary
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
              const isSummary = record.isSummary
              return <span style={isSummary ? { color: 'red', fontWeight: 'bold' } : {}}>{value || 0}</span>
            },
          },
        ],
      },
    ],
    [],
  )

  return (
    <div style={{ padding: 24 }}>
      <Card title={`04-1${currentCampus || ''}教化司口碑招生个人目标与结果汇总表`} extra={
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
        <Table<PersonalReputationRow>
          bordered
          size="small"
          columns={columns}
          dataSource={rows}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
          loading={loading}
          rowClassName={(record) => (record.isSummary ? 'summary-row' : '')}
        />
      </Card>
    </div>
  )
}

// 添加样式（仅在浏览器环境注入，避免 SSR 报错）
if (typeof document !== 'undefined') {
  const styleId = 'personal-reputation-enrollment-goals-results-summary-style'
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

export default ShengbangPersonalReputationEnrollmentSummary
