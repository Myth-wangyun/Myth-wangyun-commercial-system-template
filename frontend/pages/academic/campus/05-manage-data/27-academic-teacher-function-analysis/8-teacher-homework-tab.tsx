// 学术->学术经理->管理表格 作业TAB：包含作业提交率 与 作业合格率 两张表（后端持久化）
import React, { useMemo, useState, useEffect } from 'react'
import { App, Card, Table, Typography, Space, Button, Input, InputNumber, Select, Row, Col } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { getSubtable, saveSubtable, type MonthlyRow } from '@/services/teacherFunctionSubtable'
import { classAssignmentGradeService } from '@/services/service'
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

const buildInitialRows = (): MonthlyRow[] => {
  const rows: MonthlyRow[] = Array.from({ length: 10 }).map((_, i) => ({
    key: `r-${i + 1}`,
    index: i + 1,
    name: '',
  }))
  return rows
}

const calcRowAvg = (r: MonthlyRow): number | undefined => {
  const vals = MONTH_KEYS.map((k) => r[k]).filter((v) => typeof v === 'number') as number[]
  if (!vals.length) return undefined
  const sum = vals.reduce((a, b) => a + (b || 0), 0)
  return Number((sum / vals.length).toFixed(2))
}

const buildDataWithSummary = (data: MonthlyRow[]): MonthlyRow[] => {
  const items = data.map((r) => ({ ...r, avg: calcRowAvg(r) }))
  // 汇总行：当月平均（逐月平均）
  const summary: MonthlyRow = {
    key: 'summary',
    index: 0,
    name: '当月平均',
    rowType: 'summary',
  }
  MONTH_KEYS.forEach((k, idx) => {
    const vals = items.map((r) => r[k]).filter((v) => typeof v === 'number') as number[]
    if (vals.length)
      summary[k] = Number((vals.reduce((a, b) => a + (b || 0), 0) / vals.length).toFixed(2))
  })
  return [...items, summary]
}

type TableKind = 'submission' | 'pass'

const titleByKind: Record<TableKind, string> = {
  submission: 'XX神殿智慧司作业提交率',
  pass: 'XX神殿智慧司作业合格率',
}

const tableTypeByKind: Record<TableKind, string> = {
  submission: 'homework_submission',
  pass: 'homework_pass',
}

const HomeworkSingleTable: React.FC<{
  kind: TableKind
  campusName: string
  year: number
}> = ({ kind, campusName, year }) => {
  const { message } = App.useApp()
  const [rows, setRows] = useState<MonthlyRow[]>(() => buildInitialRows())
  const [loading, setLoading] = useState(false)
  const [teacherOptions, setTeacherOptions] = useState<string[]>([])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getSubtable(tableTypeByKind[kind], campusName, year)
      if (res.行数据 && res.行数据.length > 0) {
        const mapped = res.行数据.map((item) => ({
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
      } else {
        setRows(buildInitialRows())
      }
    } catch (error) {
      console.error('加载作业数据失败', error)
      message.error('加载失败')
      setRows(buildInitialRows())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campusName, year, kind])

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const teachers = await fetchTeachers({ campus_name: campusName, active: true, participate_kpi: true })
        const names = teachers
          .filter((t: TeacherProfile) => t.is_active !== false)
          .map((t: TeacherProfile) => t.name)
          .filter(Boolean)
        setTeacherOptions(Array.from(new Set(names)))
      } catch (error) {
        console.error('加载教员列表失败', error)
      }
    }
    loadTeachers()
  }, [campusName])

  const data = useMemo(() => buildDataWithSummary(rows), [rows])

  const update = (idx: number, patch: Partial<MonthlyRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const nameOptions = useMemo(() => {
    const current = rows.map((r) => r.name).filter(Boolean)
    return Array.from(new Set([...teacherOptions, ...current])).map((n) => ({ label: n, value: n }))
  }, [teacherOptions, rows])

  // 自动从班作业成绩表聚合提交率/合格率
  const autoFillFromAssignments = async () => {
    setLoading(true)
    try {
      const pageSize = 200
      const firstPage = await classAssignmentGradeService.getList({ campus: campusName, page: 1, pageSize } as any)
      let records = firstPage || []

      // 根据开始/结束日期或创建时间获取月份
      const parseDate = (raw: any): Date | null => {
        if (!raw) return null
        if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw
        if (typeof raw === 'string') {
          const normalized = raw.replace(/\./g, '-').replace(/\//g, '-')
          const d1 = new Date(normalized)
          if (!Number.isNaN(d1.getTime())) return d1
          const d2 = new Date(raw)
          if (!Number.isNaN(d2.getTime())) return d2
        }
        return null
      }
      const getMonth = (rec: any): number | null => {
        const candidates = [rec.startDate, rec.endDate, rec.createdAt, rec.updatedAt]
        for (const raw of candidates) {
          const d = parseDate(raw)
          if (d && d.getFullYear() === year) return d.getMonth() + 1
        }
        return null
      }

      const byTeacher = new Map<string, Map<number, number[]>>() // 教员 -> 月份 -> rate[]
      records.forEach((rec) => {
        const month = getMonth(rec)
        if (!month || month < 1 || month > 12) return
        const teacher = rec.teacherName || (rec as any).teacher_name
        if (!teacher) return
        const submitRate =
          rec.submitRate !== undefined && rec.submitRate !== null
            ? Number(rec.submitRate)
            : rec.expectedSubmit > 0
              ? Number(((rec.actualSubmit / rec.expectedSubmit) * 100).toFixed(2))
              : undefined
        // 作业合格率 = 合格数 / 实际提交数（不是应提交数）
        const passRate =
          rec.actualSubmit > 0
            ? Number(((rec.passCount / rec.actualSubmit) * 100).toFixed(2))
            : undefined
        const rate = kind === 'submission' ? submitRate : passRate
        if (rate === undefined || Number.isNaN(rate)) return
        if (!byTeacher.has(teacher)) byTeacher.set(teacher, new Map())
        const mMap = byTeacher.get(teacher)!
        if (!mMap.has(month)) mMap.set(month, [])
        mMap.get(month)!.push(rate)
      })

      const teachers = Array.from(byTeacher.keys())
      if (!teachers.length) {
        message.info('暂无符合条件的作业成绩记录，无法自动填充')
        return
      }

      const mappedRows: MonthlyRow[] = teachers.map((name, idx) => {
        const row: MonthlyRow = { key: `r-${idx + 1}`, index: idx + 1, name }
        const mMap = byTeacher.get(name)!
        MONTH_KEYS.forEach((mk, mIdx) => {
          const vals = mMap.get(mIdx + 1) || []
          if (vals.length) row[mk] = Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
        })
        return row
      })
      setRows(
        mappedRows
          .concat(Array(Math.max(0, 10 - mappedRows.length)).fill(null))
          .map((r, i) => r || { key: `r-${i + 1}`, index: i + 1, name: '' }),
      )
      message.success('已从作业成绩表自动聚合填充')
    } catch (error) {
      console.error('自动获取作业数据失败', error)
      message.error('自动获取失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnsType<MonthlyRow> = [
    { title: '序号', dataIndex: 'index', width: 70, align: 'center', fixed: 'left' },
    {
      title: '姓名',
      dataIndex: 'name',
      width: 120,
      align: 'center',
      fixed: 'left',
      render: (v, record, index) =>
        record.rowType === 'summary' ? (
          <span style={{ fontWeight: 600 }}>{v}</span>
        ) : (
          <Select
            value={v || undefined}
            placeholder="选择教员"
            allowClear
            showSearch
            options={nameOptions}
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
            onChange={(val) => update(index, { name: val || '' })}
            onBlur={(e) => {
              const text = (e.target as HTMLInputElement)?.value?.trim()
              if (text && !teacherOptions.includes(text)) {
                setTeacherOptions((prev) => [...prev, text])
                update(index, { name: text })
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
            max={100}
            value={v as number | undefined}
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
    <Card bordered={false} style={{ marginBottom: 16 }}>
      <Space style={{ marginBottom: 8 }}>
        <Title level={5} style={{ margin: 0 }}>
          {titleByKind[kind]}
        </Title>
        <Button onClick={autoFillFromAssignments} loading={loading}>
          自动获取数据
        </Button>
        <Button
          onClick={() => {
            const nextIndex = rows.filter((r) => r.rowType !== 'summary').length + 1
            setRows((prev) => [
              ...prev.filter((r) => r.rowType !== 'summary'),
              { key: `r-${nextIndex}`, index: nextIndex, name: '' },
            ])
          }}
          disabled={loading}
        >
          新增
        </Button>
        <Button onClick={() => setRows(buildInitialRows())} disabled={loading}>
          清空
        </Button>
        <Button
          type="primary"
          loading={loading}
          onClick={async () => {
            setLoading(true)
            try {
              await saveSubtable(tableTypeByKind[kind], campusName, year, rows)
              message.success('保存成功')
              await loadData()
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
        <span>当前：{campusName} {year}年</span>
      </Space>
      <Table<MonthlyRow>
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

const TeacherHomeworkTab: React.FC = () => {
  const { currentCampus } = useCampusStore()
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())
  const campusName = currentCampus || '主神殿'

  return (
    <div>
      <Row gutter={12} style={{ marginBottom: 12 }} align="middle">
        <Col><span>年份</span></Col>
        <Col>
          <GlobalYearSelector 
            value={selectedYear} 
            onChange={setSelectedYear}
            width={120}
          />
        </Col>
        <Col><span>神殿</span></Col>
        <Col>
          <Input disabled value={campusName} style={{ width: 160 }} />
        </Col>
      </Row>
      <HomeworkSingleTable kind="submission" campusName={campusName} year={selectedYear} />
      <HomeworkSingleTable kind="pass" campusName={campusName} year={selectedYear} />
    </div>
  )
}

export default TeacherHomeworkTab
