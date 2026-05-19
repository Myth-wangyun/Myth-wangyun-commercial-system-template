// 学术->学术经理->管理表格 上级听课TAB：按月x教员矩阵（后端持久化）
import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Typography, Space, Button, Input, InputNumber, Row, Col, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { getSuperiorAudit, saveSuperiorAudit } from '@/services/teacherSuperiorAudit'
import { fetchTeachers, type TeacherProfile } from '@/services/configMaster'
import { teacherYearlyLectureScoreSummaryService, teacherLectureScoreSheetService } from '@/services/service'
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

interface AuditRow {
  key: string
  monthKey?: MonthKey
  monthLabel: string
  rowType?: RowType
  rowAvg?: number // 当月平均
  [k: `t${number}`]: number | string | MonthKey | undefined
}

const buildInitialRows = (): AuditRow[] =>
  MONTH_KEYS.map((mk, idx) => ({
    key: mk,
    monthKey: mk,
    monthLabel: MONTH_LABELS[idx],
  }))

const initialTeacherNames = (): string[] => Array(10).fill('')

const calcRowAverage = (row: AuditRow, teacherKeys: string[]): number | undefined => {
  const vals = teacherKeys
    .map((k) => row[k as `t${number}`] as number | undefined)
    .filter((v): v is number => typeof v === 'number')
  if (!vals.length) return undefined
  const sum = vals.reduce((a, b) => a + (b || 0), 0)
  return Number((sum / vals.length).toFixed(2))
}

const TeacherSuperiorAuditTab: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())
  const [teacherNames, setTeacherNames] = useState<string[]>([])
  const [rows, setRows] = useState<AuditRow[]>(() => buildInitialRows())
  const [loading, setLoading] = useState(false)
  const campusName = currentCampus || '主神殿'

  const teacherKeys = useMemo(() => teacherNames.map((_, i) => `t${i}`), [teacherNames])

  const dataWithSummary = useMemo(() => {
    const items = rows.map((r) => ({ ...r, rowAvg: calcRowAverage(r, teacherKeys as any) }))
    const summary: AuditRow = { key: 'summary', monthLabel: '教员平均', rowType: 'summary' }
    teacherKeys.forEach((tk) => {
      const vals = items
        .map((r) => r[tk as `t${number}`] as number | undefined)
        .filter((v): v is number => typeof v === 'number')
      if (vals.length)
        (summary as any)[tk] = Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
    })
    return [...items, summary]
  }, [rows, teacherKeys])

const mapFromSubtable = (list: any[], teacherList: string[]): AuditRow[] => {
  const teacherRows = [...(list || [])].sort((a, b) => (a.序号 || 0) - (b.序号 || 0))
  return MONTH_KEYS.map((mk, idx) => {
    const monthNum = idx + 1
    const row: AuditRow = { key: mk, monthKey: mk, monthLabel: MONTH_LABELS[idx] }
    teacherRows.forEach((tr: any, tIdx: number) => {
      const key = `t${tIdx}` as `t${number}`
      row[key] = tr[`m${monthNum}`] ?? undefined
    })
    return row
  })
}

  const loadData = async () => {
    setLoading(true)
    try {
      // 拉取教员列表（按神殿过滤，参与KPI）
      const teachers = await fetchTeachers({
        campus_name: campusName,
        active: true,
        participate_kpi: true,
      })
      const teacherNamesFromConfig = teachers
        .filter((t: TeacherProfile) => t.is_active && t.participate_kpi)
        .map((t) => t.name)
        .filter(Boolean)

      const res = await getSuperiorAudit(campusName, selectedYear)
      if (res.行数据 && res.行数据.length > 0) {
        const teacherNamesFromApi = res.行数据
          .sort((a: any, b: any) => (a.序号 || 0) - (b.序号 || 0))
          .map((r: any, idx: number) => r.姓名 || `教员${idx + 1}`)
        const merged = Array.from(
          new Set([...teacherNamesFromConfig, ...teacherNamesFromApi].filter(Boolean)),
        )
        const paddedNames = merged.concat(Array(Math.max(0, 10 - merged.length)).fill(''))
        setTeacherNames(paddedNames)
        setRows(mapFromSubtable(res.行数据, paddedNames))
      } else {
        const paddedNames = teacherNamesFromConfig.concat(
          Array(Math.max(0, 10 - teacherNamesFromConfig.length)).fill(''),
        )
        setTeacherNames(paddedNames)
        setRows(buildInitialRows())
      }
    } catch (error) {
      console.error('加载上级听课数据失败', error)
      message.error('加载失败')
      setRows(buildInitialRows())
    } finally {
      setLoading(false)
    }
  }

  // 将年度听课汇总（行=教员，m1..m12）转成 TAB 需要的格式（行=月份，列=教员）
  const applySummaryData = (summaryData: any[]) => {
    if (!Array.isArray(summaryData) || summaryData.length === 0) {
      message.info('年度汇总数据为空')
      return
    }
    const names = summaryData.map((s, idx) => s.name || s.姓名 || `教员${idx + 1}`)
    const paddedNames = names.concat(Array(Math.max(0, 10 - names.length)).fill(''))
    setTeacherNames(paddedNames)

    const rowsFromSummary: AuditRow[] = MONTH_KEYS.map((mk, idx) => {
      const month = idx + 1
      const row: AuditRow = { key: mk, monthKey: mk, monthLabel: MONTH_LABELS[idx] }
      summaryData.forEach((s, tIdx) => {
        const val = s[`m${month}`] ?? s[`M${month}`]
        if (typeof val === 'number') {
          ;(row as any)[`t${tIdx}`] = val
        }
      })
      return row
    })
    setRows(rowsFromSummary)
    message.success('已自动填充听课成绩数据')
  }

  // 从听课成绩表自动计算并填充（优先方案）
  const loadFromYearlySummary = async () => {
    setLoading(true)
    try {
      // 方案1：直接从听课成绩表计算（不依赖汇总表）
      const allSheets = await teacherLectureScoreSheetService.list({
        campusName: campusName,
        year: selectedYear,
      })

      if (allSheets && allSheets.length > 0) {
        // 按教员聚合计算（来源：听课成绩表的总分）
        const summaryRows: any[] = []
        allSheets.forEach((sheet, idx) => {
          const row: any = { name: sheet.teacherName }
          for (let month = 1; month <= 12; month++) {
            const sum = (sheet.rows || []).reduce(
              (acc, r: any) => acc + (Number(r[`m${month}`]) || 0),
              0,
            )
            if (sum > 0) {
              row[`m${month}`] = Math.round(sum * 10) / 10
            }
          }
          summaryRows.push(row)
        })
        
        if (summaryRows.length > 0) {
          applySummaryData(summaryRows)
          return
        }
      }

      // 方案2：如果听课成绩表没有数据，尝试从年度汇总表获取
      try {
        const res = await teacherYearlyLectureScoreSummaryService.getByYear(selectedYear)
        if (res?.summary_data?.length > 0) {
          applySummaryData(res.summary_data)
          return
        }
      } catch (summaryError: any) {
        // 汇总表也没有数据
      }

      // 两个数据源都没有数据
      message.info(`${selectedYear} 年暂无听课成绩数据，请先在"听课成绩表"页面填写数据`)
    } catch (error: any) {
      console.error('加载听课数据失败', error)
      message.error('加载失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campusName, selectedYear])

  const updateCell = (rowIndex: number, teacherIndex: number, value: number | null) => {
    setRows((prev) =>
      prev.map((r, i) => (i === rowIndex ? { ...r, [`t${teacherIndex}`]: value ?? undefined } : r)),
    )
  }

  const updateTeacherName = (teacherIndex: number, name: string) => {
    setTeacherNames((prev) => prev.map((n, i) => (i === teacherIndex ? name : n)))
  }

  const columns: ColumnsType<AuditRow> = [
    { title: '姓名', dataIndex: 'monthLabel', width: 120, fixed: 'left', align: 'center' },
  ]

  teacherNames.forEach((name, idx) => {
    const titleNode = (
      <div>
        <Input
          value={name}
          placeholder={`教员${idx + 1}`}
          onChange={(e) => updateTeacherName(idx, e.target.value)}
        />
      </div>
    )
    columns.push({
      title: titleNode,
      dataIndex: `t${idx}`,
      width: 110,
      align: 'center',
      render: (v: any, record, rowIndex) =>
        record.rowType === 'summary' ? (
          <span>{typeof v === 'number' ? v : ''}</span>
        ) : (
          <InputNumber
            min={0}
            max={100}
            style={{ width: '100%' }}
            value={typeof v === 'number' ? v : undefined}
            onChange={(val) => updateCell(rowIndex, idx, (val as number) ?? 0)}
          />
        ),
    } as any)
  })

  columns.push({
    title: '当月平均',
    dataIndex: 'rowAvg',
    align: 'center',
    width: 120,
    render: (v, record) => (record.rowType === 'summary' ? '' : typeof v === 'number' ? v : ''),
  })

  return (
    <Card bordered={false}>
      <Space style={{ marginBottom: 8, width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <Title level={5} style={{ margin: 0 }}>
            XX神殿智慧司听课成绩表
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
          <Button onClick={() => setTeacherNames((prev) => [...prev, ''])} disabled={loading}>新增教员列</Button>
          <Button
            onClick={() => {
              setTeacherNames(initialTeacherNames())
              setRows(buildInitialRows())
            }}
            disabled={loading}
          >
            清空
          </Button>
          <Button onClick={loadFromYearlySummary} loading={loading}>
            自动获取数据
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={async () => {
              setLoading(true)
              try {
                // 将行（月份）转成子表行：序号=月份，姓名空，m1..m12=各教员
                // 行=教员，m1..m12=各月
                const payloadRows = teacherNames
                  .map((name, tIdx) => {
                    const payload: any = { 序号: tIdx + 1, 姓名: name || undefined }
                    MONTH_KEYS.forEach((_, monthIdx) => {
                      const row = rows[monthIdx]
                      const val = row?.[`t${tIdx}` as `t${number}`]
                      payload[`m${monthIdx + 1}`] = typeof val === 'number' ? val : undefined
                    })
                    return payload
                  })
                  .filter((p) => p.姓名 || Object.keys(p).some((k) => k.startsWith('m') && typeof (p as any)[k] === 'number'))
                const saved = await saveSuperiorAudit(campusName, selectedYear, payloadRows)
                if (saved.行数据 && saved.行数据.length > 0) {
                  const teacherNamesFromApi = saved.行数据
                    .sort((a: any, b: any) => (a.序号 || 0) - (b.序号 || 0))
                    .map((r: any, idx: number) => r.姓名 || `教员${idx + 1}`)
                  const paddedNames = teacherNamesFromApi.concat(Array(Math.max(0, 10 - teacherNamesFromApi.length)).fill(''))
                  setTeacherNames(paddedNames)
                  setRows(mapFromSubtable(saved.行数据, paddedNames))
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
      <Table<AuditRow>
        bordered
        size="small"
        columns={columns}
        dataSource={dataWithSummary}
        pagination={false}
        scroll={{ x: 'max-content' }}
        rowClassName={(r) => (r.rowType === 'summary' ? 'summary-row' : '')}
        loading={loading}
      />
    </Card>
  )
}

export default TeacherSuperiorAuditTab
