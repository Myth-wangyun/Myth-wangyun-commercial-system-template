import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, InputNumber, Space, Button, Select, Input } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'
import { fetchHomeroomTeachers } from '@/services/configMaster'
import type { HomeroomTeacherProfile } from '@/services/configMaster'
import eventBus from '@/utils/eventBus'

const { Option } = Select

interface MonthlyPersonalReputationRow {
  key: string
  month: number
  name: string
  targetReputation: number
  actualReputation: number
  targetVisits: number
  actualVisits: number
  targetStudents: number
  actualStudents: number
  targetRevenue: number
  actualRevenue: number
  isMonthSummary?: boolean
  isGrandSummary?: boolean
}

// 姓名从配置中心（班主任名册）按当前神殿动态获取

const createInitialDetailRows = (names: string[]): MonthlyPersonalReputationRow[] => {
  const rows: MonthlyPersonalReputationRow[] = []

  for (let month = 1; month <= 12; month += 1) {
    names.forEach((name) => {
      rows.push({
        key: `${month}-${name}`,
        month,
        name,
        targetReputation: 0,
        actualReputation: 0,
        targetVisits: 0,
        actualVisits: 0,
        targetStudents: 0,
        actualStudents: 0,
        targetRevenue: 0,
        actualRevenue: 0,
      })
    })
  }

  return rows
}

const computeMonthSummary = (
  rows: MonthlyPersonalReputationRow[],
  month: number,
): MonthlyPersonalReputationRow => {
  const monthRows = rows.filter((r) => r.month === month && !r.isMonthSummary && !r.isGrandSummary)

  const total = monthRows.reduce(
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
    key: `${month}-summary`,
    month,
    name: '合计',
    ...total,
    isMonthSummary: true,
  }
}

const computeGrandSummary = (
  detailRows: MonthlyPersonalReputationRow[],
): MonthlyPersonalReputationRow => {
  const total = detailRows.reduce(
    (acc, r) => {
      if (r.isMonthSummary || r.isGrandSummary) return acc
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
    key: 'grand-summary',
    month: 0,
    name: '总合计',
    ...total,
    isGrandSummary: true,
  }
}

const ShengbangMonthlyPersonalReputationEnrollmentSummary: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [homeroomTeachers, setHomeroomTeachers] = useState<HomeroomTeacherProfile[]>([])
  const teacherNames = useMemo(() => homeroomTeachers.map(t => t.name), [homeroomTeachers])
  const [detailRows, setDetailRows] = useState<MonthlyPersonalReputationRow[]>([])
  
  // 筛选条件
  const [filterName, setFilterName] = useState<string | undefined>(undefined)
  const [filterMonth, setFilterMonth] = useState<number | undefined>(undefined)

  const canIO = useMemo(() => Boolean(currentCampus && year), [currentCampus, year])

  const dataSource: MonthlyPersonalReputationRow[] = useMemo(() => {
    const ordered: MonthlyPersonalReputationRow[] = []

    // 应用筛选条件
    let filteredDetailRows = detailRows
    if (filterName) {
      filteredDetailRows = filteredDetailRows.filter(r => r.name === filterName)
    }
    if (filterMonth !== undefined) {
      filteredDetailRows = filteredDetailRows.filter(r => r.month === filterMonth || r.isMonthSummary || r.isGrandSummary)
    }

    // 确定要显示的月份范围
    const monthsToShow = filterMonth !== undefined 
      ? [filterMonth] 
      : Array.from({ length: 12 }, (_, i) => i + 1)

    for (const month of monthsToShow) {
      const monthDetails = filteredDetailRows.filter(
        (r) => r.month === month && !r.isMonthSummary && !r.isGrandSummary,
      )
      monthDetails.sort((a, b) => teacherNames.indexOf(a.name) - teacherNames.indexOf(b.name))
      
      // 如果筛选了姓名，需要重新计算该月的合计（只包含筛选后的姓名）
      const monthSummary = computeMonthSummary(
        filterName 
          ? detailRows.filter(r => r.name === filterName || r.isMonthSummary || r.isGrandSummary)
          : detailRows,
        month
      )
      ordered.push(...monthDetails, monthSummary)
    }

    // 只有在没有筛选条件时才显示总合计
    if (!filterName && filterMonth === undefined) {
      const grandSummary = computeGrandSummary(detailRows)
      ordered.push(grandSummary)
    }

    return ordered
  }, [detailRows, teacherNames, filterName, filterMonth])

  const handleChange = (
    key: string,
    field: keyof MonthlyPersonalReputationRow,
    value: string | number | null,
  ) => {
    setDetailRows((prev) =>
      prev.map((row) =>
        row.key === key
          ? {
              ...row,
              [field]: typeof value === 'number' ? value : typeof value === 'string' ? value : 0,
            }
          : row,
      ),
    )
  }

  const applyServerRows = (list: any[]) => {
    const base = createInitialDetailRows(teacherNames)
    list.forEach((r: any) => {
      const m = Number(r.month || 0)
      const n = String(r.name || '')
      const idx = base.findIndex((x) => x.month === m && x.name === n)
      if (idx >= 0) {
        base[idx] = {
          ...base[idx],
          targetReputation: Number(r.targetReputation || 0),
          actualReputation: Number(r.actualReputation || 0),
          targetVisits: Number(r.targetVisits || 0),
          actualVisits: Number(r.actualVisits || 0),
          targetStudents: Number(r.targetStudents || 0),
          actualStudents: Number(r.actualStudents || 0),
          targetRevenue: Number(r.targetRevenue || 0),
          actualRevenue: Number(r.actualRevenue || 0),
        }
      }
    })
    setDetailRows(base)
  }

  const fetchFromServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    if (teacherNames.length === 0) {
      message.warning('当前神殿没有配置班主任')
      return
    }
    try {
      const res = await fetch(
        buildApiUrl(`/teaching-quality/campus-monthly-personal-reputation-enrollment-goals-results?campus=${encodeURIComponent(
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
    }
  }

  const saveToServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    try {
      const payload = {
        神殿名称: currentCampus!,
        年份: year,
        行列表: detailRows
          .filter((r) => !r.isMonthSummary && !r.isGrandSummary && r.name)
          .map((r) => ({
            month: r.month,
            name: r.name,
            targetReputation: r.targetReputation,
            targetVisits: r.targetVisits,
            targetStudents: r.targetStudents,
            targetRevenue: r.targetRevenue,
          })),
      }
      const res = await fetch(
        buildApiUrl('/teaching-quality/campus-monthly-personal-reputation-enrollment-goals-results'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )
      if (!res.ok) throw new Error(await res.text())
      message.success('保存成功')

      // 触发级联刷新：个人汇总表 & 神殿汇总表
      eventBus.emit('tq:reputation:monthlySaved', {
        campus: currentCampus!,
        year,
        ts: Date.now(),
      })

      await fetchFromServer()
    } catch (e) {
      console.error(e)
      message.error('保存失败')
    }
  }

  // 加载配置中心班主任
  useEffect(() => {
    const load = async () => {
      if (!currentCampus) return
      try {
        const list = await fetchHomeroomTeachers({ campus_name: currentCampus, active: true })
        setHomeroomTeachers(list)
      } catch (e) {
        console.error('加载班主任失败', e)
        message.error('加载班主任失败')
      }
    }
    load()
  }, [currentCampus])

  // 班主任列表就绪后，初始化行并拉取后端
  useEffect(() => {
    if (currentCampus && teacherNames.length > 0) {
      setDetailRows(createInitialDetailRows(teacherNames))
      fetchFromServer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year, teacherNames])

  // 监听“明细表保存”事件：自动刷新本表
  useEffect(() => {
    const off = eventBus.on('tq:reputation:detailSaved', (payload: any) => {
      if (!currentCampus) return
      if (payload?.campus && payload.campus !== currentCampus) return
      if (payload?.year && payload.year !== year) return
      // teacherNames 未就绪时不刷，避免创建空行后覆盖；等 teacherNames 就绪后上面的 useEffect 会自动 fetch
      if (teacherNames.length === 0) return
      fetchFromServer()
    })
    return off
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year, teacherNames])

  const columns: ColumnsType<MonthlyPersonalReputationRow> = useMemo(
    () => [
      {
        title: '月份',
        dataIndex: 'month',
        key: 'month',
        width: 80,
        align: 'center',
        onCell: (record) => {
          if (record.isGrandSummary) {
            return { rowSpan: 1, style: { textAlign: 'center' } }
          }
          if (record.isMonthSummary) {
            return { rowSpan: 0, style: { textAlign: 'center' } }
          }
          const month = record.month
          const isFirstRowOfMonth = teacherNames.length > 0 && record.key === `${month}-${teacherNames[0]}`
          if (isFirstRowOfMonth) {
            return { rowSpan: teacherNames.length + 1, style: { textAlign: 'center' } }
          }
          return { rowSpan: 0, style: { textAlign: 'center' } }
        },
        render: (value: number, record) => {
          if (record.isGrandSummary) {
            return <span style={{ color: 'red', fontWeight: 'bold' }}>总合计</span>
          }
          if (record.isMonthSummary) {
            return ''
          }
          return value
        },
      },
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 140,
        align: 'center',
        render: (text: string, record) => {
          if (record.isGrandSummary) return ''
          if (record.isMonthSummary)
            return <span style={{ color: 'red', fontWeight: 'bold' }}>{text}</span>
          return text
        },
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
              const isSummary = record.isMonthSummary || record.isGrandSummary
              return isSummary ? (
                <span style={{ color: 'red', fontWeight: 'bold' }}>{value || 0}</span>
              ) : (
                <InputNumber
                  min={0}
                  value={value || 0}
                  style={{ width: '100%' }}
                  onChange={(v) => handleChange(record.key, 'targetReputation', v ?? 0)}
                />
              )
            },
          },
          {
            title: '实际口碑量',
            dataIndex: 'actualReputation',
            key: 'actualReputation',
            width: 120,
            align: 'center',
            render: (value: number, record) => {
              const isSummary = record.isMonthSummary || record.isGrandSummary
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
              const isSummary = record.isMonthSummary || record.isGrandSummary
              return isSummary ? (
                <span style={{ color: 'red', fontWeight: 'bold' }}>{value || 0}</span>
              ) : (
                <InputNumber
                  min={0}
                  value={value || 0}
                  style={{ width: '100%' }}
                  onChange={(v) => handleChange(record.key, 'targetVisits', v ?? 0)}
                />
              )
            },
          },
          {
            title: '实际上门量',
            dataIndex: 'actualVisits',
            key: 'actualVisits',
            width: 120,
            align: 'center',
            render: (value: number, record) => {
              const isSummary = record.isMonthSummary || record.isGrandSummary
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
              const isSummary = record.isMonthSummary || record.isGrandSummary
              return isSummary ? (
                <span style={{ color: 'red', fontWeight: 'bold' }}>{value || 0}</span>
              ) : (
                <InputNumber
                  min={0}
                  value={value || 0}
                  style={{ width: '100%' }}
                  onChange={(v) => handleChange(record.key, 'targetStudents', v ?? 0)}
                />
              )
            },
          },
          {
            title: '实际人数',
            dataIndex: 'actualStudents',
            key: 'actualStudents',
            width: 120,
            align: 'center',
            render: (value: number, record) => {
              const isSummary = record.isMonthSummary || record.isGrandSummary
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
              const isSummary = record.isMonthSummary || record.isGrandSummary
              return isSummary ? (
                <span style={{ color: 'red', fontWeight: 'bold' }}>{value || 0}</span>
              ) : (
                <InputNumber
                  min={0}
                  value={value || 0}
                  style={{ width: '100%' }}
                  onChange={(v) => handleChange(record.key, 'targetRevenue', v ?? 0)}
                />
              )
            },
          },
          {
            title: '实际收入',
            dataIndex: 'actualRevenue',
            key: 'actualRevenue',
            width: 120,
            align: 'center',
            render: (value: number, record) => {
              const isSummary = record.isMonthSummary || record.isGrandSummary
              return <span style={isSummary ? { color: 'red', fontWeight: 'bold' } : {}}>{value || 0}</span>
            },
          },
        ],
      },
    ],
    [detailRows],
  )

  return (
    <div style={{ padding: 24 }}>
      <Card 
        title={`04-2${currentCampus || ''}教化司口碑招生月度个人目标与结果汇总表`} 
        extra={
          <Space wrap>
            <Space>
              <span>年份</span>
              <InputNumber
                min={2000}
                max={2100}
                value={year}
                onChange={(v) => setYear(typeof v === 'number' ? v : new Date().getFullYear())}
                style={{ width: 100 }}
              />
            </Space>
            <Space>
              <span>月份</span>
              <Select
                placeholder="全部月份"
                allowClear
                style={{ width: 120 }}
                value={filterMonth}
                onChange={(v) => setFilterMonth(v ?? undefined)}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <Option key={m} value={m}>
                    {m}月
                  </Option>
                ))}
              </Select>
            </Space>
            <Space>
              <span>姓名</span>
              <Select
                placeholder="全部姓名"
                allowClear
                showSearch
                filterOption={(input, option) =>
                  String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())
                }
                style={{ width: 150 }}
                value={filterName}
                onChange={(v) => setFilterName(v ?? undefined)}
              >
                {teacherNames.map((name) => (
                  <Option key={name} value={name}>
                    {name}
                  </Option>
                ))}
              </Select>
            </Space>
            <Button onClick={fetchFromServer} disabled={!canIO}>刷新</Button>
            <Button type="primary" onClick={saveToServer} disabled={!canIO}>保存</Button>
          </Space>
        }
      >
        <Table<MonthlyPersonalReputationRow>
          bordered
          size="small"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
          rowClassName={(record) => 
            (record.isMonthSummary || record.isGrandSummary) ? 'summary-row' : ''
          }
        />
      </Card>
    </div>
  )
}

// 添加样式（仅在浏览器环境注入，避免 SSR 报错）
if (typeof document !== 'undefined') {
  const styleId = 'monthly-personal-reputation-enrollment-goals-results-summary-style'
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

export default ShengbangMonthlyPersonalReputationEnrollmentSummary
