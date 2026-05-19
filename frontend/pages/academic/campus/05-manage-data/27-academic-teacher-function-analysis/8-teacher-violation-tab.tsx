// 学术->学术经理->管理表格 学员违纪TAB：按月统计每位教员学员违纪数量（后端持久化）
import React, { useMemo, useState, useEffect } from 'react'
import { App, Card, Table, Typography, Space, Button, Input, InputNumber, Row, Col, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { getViolation, saveViolation } from '@/services/teacherViolation'
import { fetchTeachers, type TeacherProfile } from '@/services/configMaster'
import { GlobalYearSelector } from '@/components/common'

const { Title } = Typography
const { Option } = Select

type MonthKey = 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6' | 'm7' | 'm8' | 'm9' | 'm10' | 'm11' | 'm12'
const MONTH_KEYS: MonthKey[] = [
  'm1',
  'm2',
  'm3',
  'm4',
  'm5',
  'm6',
  'm7',
  'm8',
  'm9',
  'm10',
  'm11',
  'm12',
]
const MONTH_LABELS = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
]

type RowType = 'data' | 'summary'

interface ViolationRow {
  key: string
  index: number | string
  name: string
  rowType?: RowType
  m1?: number
  m2?: number
  m3?: number
  m4?: number
  m5?: number
  m6?: number
  m7?: number
  m8?: number
  m9?: number
  m10?: number
  m11?: number
  m12?: number
  avg?: number // 教员平均（该教员全年月均违纪数）
}

const buildInitialRows = (names: string[] = []): ViolationRow[] => {
  const rows: ViolationRow[] = Array.from({ length: Math.max(names.length, 10) }).map((_, i) => ({
    key: `r-${i + 1}`,
    index: i + 1,
    name: names[i] || '',
  }))
  return rows
}

const calcRowAvg = (r: ViolationRow): number | undefined => {
  const vals = MONTH_KEYS.map((k) => r[k]).filter((v) => typeof v === 'number') as number[]
  if (!vals.length) return undefined
  const sum = vals.reduce((a, b) => a + (b || 0), 0)
  return Number((sum / vals.length).toFixed(2))
}

const buildDataWithSummary = (data: ViolationRow[]): ViolationRow[] => {
  const items = data.map((r) => ({ ...r, avg: calcRowAvg(r) }))
  const summary: ViolationRow = {
    key: 'summary',
    index: '',
    name: '当月平均',
    rowType: 'summary',
  } as ViolationRow
  MONTH_KEYS.forEach((k) => {
    const vals = items.map((r) => r[k]).filter((v) => typeof v === 'number') as number[]
    if (vals.length)
      summary[k] = Number((vals.reduce((a, b) => a + (b || 0), 0) / vals.length).toFixed(2))
  })
  return [...items, summary]
}

const TeacherViolationTab: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())
  const [rows, setRows] = useState<ViolationRow[]>(() => buildInitialRows())
  const [loading, setLoading] = useState(false)
  const [teacherNames, setTeacherNames] = useState<string[]>([])
  const campusName = currentCampus || '主神殿'

  const loadData = async () => {
    setLoading(true)
    try {
      // 拉取教员列表（按神殿过滤，参与KPI）
      const teachers = await fetchTeachers({
        campus_name: campusName,
        active: true,
        participate_kpi: true,
      })
      const configNames = teachers
        .filter((t: TeacherProfile) => t.is_active && t.participate_kpi)
        .map((t) => t.name)
        .filter(Boolean)
      setTeacherNames(configNames)

      const res = await getViolation(campusName, selectedYear)
      if (res.行数据 && res.行数据.length > 0) {
        const mapped = res.行数据
          .sort((a: any, b: any) => (a.序号 || 0) - (b.序号 || 0))
          .map((item: any) => ({
            key: `r-${item.序号}`,
            index: item.序号,
            name: item.姓名 || '',
            m1: item.m1 ?? undefined,
            m2: item.m2 ?? undefined,
            m3: item.m3 ?? undefined,
            m4: item.m4 ?? undefined,
            m5: item.m5 ?? undefined,
            m6: item.m6 ?? undefined,
            m7: item.m7 ?? undefined,
            m8: item.m8 ?? undefined,
            m9: item.m9 ?? undefined,
            m10: item.m10 ?? undefined,
            m11: item.m11 ?? undefined,
            m12: item.m12 ?? undefined,
          }))
        // 合并配置中心教员，补齐行
        const combinedNames = Array.from(new Set([...configNames, ...mapped.map((m) => m.name).filter(Boolean)]))
        const merged = buildInitialRows(combinedNames)
        setRows(
          merged.map((base, idx) => {
            const match = mapped.find((m) => m.name === base.name) || mapped[idx]
            return match ? { ...base, ...match, index: match.index || base.index } : base
          }),
        )
      } else {
        setRows(buildInitialRows(configNames))
      }
      // 延迟滚动到页面顶部，确保DOM已更新
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    } catch (error) {
      console.error('加载学员违纪数据失败', error)
      message.error('加载失败')
      setRows(buildInitialRows(teacherNames))
      if (teacherNames.length === 0) {
        setTeacherNames([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campusName, selectedYear])

  const data = useMemo(() => buildDataWithSummary(rows), [rows])

  const update = (idx: number, patch: Partial<ViolationRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const columns: ColumnsType<ViolationRow> = [
    { title: '序号', dataIndex: 'index', width: 70, align: 'center', fixed: 'left' },
    {
      title: '姓名',
      dataIndex: 'name',
      width: 160,
      align: 'center',
      fixed: 'left',
      render: (v, record, index) =>
        record.rowType === 'summary' ? (
          <span style={{ fontWeight: 600 }}>{v}</span>
        ) : (
          <Select
            value={v || undefined}
            placeholder="请选择/输入教员"
            showSearch
            allowClear
            style={{ width: '100%' }}
            options={teacherNames.map((n) => ({ label: n, value: n }))}
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
            onChange={(value) => update(index, { name: value || '' })}
            onBlur={(e) => {
              const val = (e.target as HTMLInputElement)?.value?.trim()
              if (val && !teacherNames.includes(val)) {
                setTeacherNames((prev) => [...prev, val])
                update(index, { name: val })
              }
            }}
          />
        ),
    },
  ]

  MONTH_KEYS.forEach((k, idx) => {
    columns.push({
      title: MONTH_LABELS[idx],
      dataIndex: k,
      align: 'center',
      width: 100,
      render: (v, record, index) =>
        record.rowType === 'summary' ? (
          <span>{v ?? ''}</span>
        ) : (
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            precision={0}
            value={typeof v === 'number' ? v : undefined}
            onChange={(val) => update(index, { [k]: (val as number) ?? undefined })}
          />
        ),
    } as any)
  })

  columns.push({
    title: '教员平均',
    dataIndex: 'avg',
    align: 'center',
    width: 110,
    render: (v, record) => (record.rowType === 'summary' ? '' : typeof v === 'number' ? v : ''),
  })

  return (
    <Card bordered={false}>
      <Space style={{ marginBottom: 8, width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <Title level={5} style={{ margin: 0 }}>
            XX神殿智慧司学员违纪
          </Title>
          <Row gutter={12} align="middle">
            <Col><span>年份</span></Col>
            <Col>
              <GlobalYearSelector 
                value={selectedYear} 
                onChange={setSelectedYear}
                width={120}
              />
            </Col>
            <Col><span>神殿</span></Col>
            <Col><Input disabled value={campusName} style={{ width: 160 }} /></Col>
          </Row>
        </Space>
        <Space>
          <Button
            onClick={() => {
              const nextIndex = rows.length + 1
              setRows((prev) => [...prev, { key: `r-${nextIndex}`, index: nextIndex, name: '' }])
            }}
            disabled={loading}
          >
            新增
          </Button>
          <Button onClick={() => setRows(buildInitialRows(teacherNames))} disabled={loading}>清空</Button>
          <Button
            type="primary"
            loading={loading}
            onClick={async () => {
              setLoading(true)
              try {
                const payloadRows = rows
                  .map((r, idx) => ({
                    序号: typeof r.index === 'number' ? r.index : idx + 1,
                    姓名: r.name || undefined,
                    m1: r.m1 ?? undefined,
                    m2: r.m2 ?? undefined,
                    m3: r.m3 ?? undefined,
                    m4: r.m4 ?? undefined,
                    m5: r.m5 ?? undefined,
                    m6: r.m6 ?? undefined,
                    m7: r.m7 ?? undefined,
                    m8: r.m8 ?? undefined,
                    m9: r.m9 ?? undefined,
                    m10: r.m10 ?? undefined,
                    m11: r.m11 ?? undefined,
                    m12: r.m12 ?? undefined,
                  }))
                  .filter((p) => p.姓名 || Object.keys(p).some((k) => k.startsWith('m') && typeof (p as any)[k] === 'number'))
                const saved = await saveViolation(campusName, selectedYear, payloadRows)
                if (saved.行数据 && saved.行数据.length > 0) {
                  const mapped = saved.行数据
                    .sort((a: any, b: any) => (a.序号 || 0) - (b.序号 || 0))
                    .map((item: any) => ({
                      key: `r-${item.序号}`,
                      index: item.序号,
                      name: item.姓名 || '',
                      m1: item.m1 ?? undefined,
                      m2: item.m2 ?? undefined,
                      m3: item.m3 ?? undefined,
                      m4: item.m4 ?? undefined,
                      m5: item.m5 ?? undefined,
                      m6: item.m6 ?? undefined,
                      m7: item.m7 ?? undefined,
                      m8: item.m8 ?? undefined,
                      m9: item.m9 ?? undefined,
                      m10: item.m10 ?? undefined,
                      m11: item.m11 ?? undefined,
                      m12: item.m12 ?? undefined,
                    }))
                  setRows(mapped)
                }
                message.success('已保存')
              } catch (error) {
                console.error('保存失败', error)
                message.error('保存失败')
              } finally {
                setLoading(false)
              }
            }}
          >
            保存
          </Button>
        </Space>
      </Space>
      <Table<ViolationRow>
        bordered
        size="small"
        columns={columns}
        dataSource={data}
        pagination={false}
        scroll={{ x: 'max-content' }}
        rowClassName={(r) => (r.rowType === 'summary' ? 'summary-row' : '')}
        loading={loading}
      />
    </Card>
  )
}

export default TeacherViolationTab
