// 学术->学术经理->管理表格 考试TAB：包含班级考试合格率 与 教员考试合格率 两张表（按月份）
import React, { useMemo, useState, useEffect } from 'react'
import { App, Card, Table, Typography, Space, Button, Input, InputNumber, Select, Row, Col } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { getExamRateTable, saveExamRateTable } from '@/services/teacherExamRate'
import type { ExamRateKind, ExamRateRowBackend } from '@/services/teacherExamRate'
import { classExamScoreService } from '@/services/service'
import { fetchClasses, fetchTeachers, type ClassProfile, type TeacherProfile } from '@/services/configMaster'
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

interface GridRow {
  key: string
  index: number | string
  name: string // 班级 或 教员姓名
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
  avg?: number // 平均
}

const calcRowAvg = (r: GridRow): number | undefined => {
  const vals = MONTH_KEYS.map((k) => r[k]).filter((v) => typeof v === 'number') as number[]
  if (!vals.length) return undefined
  const sum = vals.reduce((a, b) => a + (b || 0), 0)
  return Number((sum / vals.length).toFixed(2))
}

const buildDataWithSummary = (data: GridRow[], summaryName: string): GridRow[] => {
  const items = data.map((r) => ({ ...r, avg: calcRowAvg(r) }))
  const summary: GridRow = { key: 'summary', index: '', name: '当月平均', rowType: 'summary' }
  MONTH_KEYS.forEach((k) => {
    const vals = items.map((r) => r[k]).filter((v) => typeof v === 'number') as number[]
    if (vals.length)
      summary[k] = Number((vals.reduce((a, b) => a + (b || 0), 0) / vals.length).toFixed(2))
  })
  return [...items, summary]
}

// 通用表格
const MonthlyGrid: React.FC<{
  title: string
  avgLabel: string // 列标题中的平均描述（“班级平均”/“教员平均”）
  initialNames: string[] // 初始第一列名称（班级或姓名）
  kind: ExamRateKind
  campusName: string
  selectedYear: number
}> = ({ title, avgLabel, initialNames, kind, campusName, selectedYear }) => {
  const { message } = App.useApp()
  const buildInitialRows = (): GridRow[] => {
    const rows: GridRow[] = Array.from({ length: 10 }).map((_, i) => ({
      key: `r-${i + 1}`,
      index: i + 1,
      name: initialNames[i] || '',
    }))
    return rows
  }

  const [rows, setRows] = useState<GridRow[]>(() => buildInitialRows())
  const [loading, setLoading] = useState(false)
  const [classOptions, setClassOptions] = useState<string[]>([])
  const [teacherOptions, setTeacherOptions] = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await getExamRateTable(kind, campusName, selectedYear)
        const backendRows = res.行数据 || []
        if (backendRows.length > 0) {
          const mapped: GridRow[] = backendRows
            .sort((a, b) => (a.序号 || 0) - (b.序号 || 0))
            .map((r, idx) => ({
              key: `r-${idx + 1}`,
              index: r.序号 ?? idx + 1,
              name: r.名称 || '',
              m1: r.m1,
              m2: r.m2,
              m3: r.m3,
              m4: r.m4,
              m5: r.m5,
              m6: r.m6,
              m7: r.m7,
              m8: r.m8,
              m9: r.m9,
              m10: r.m10,
              m11: r.m11,
              m12: r.m12,
            }))
          setRows(
            mapped
              .concat(Array(Math.max(0, 10 - mapped.length)).fill(null))
              .map((r, i) => r || { key: `r-${i + 1}`, index: i + 1, name: '' }),
          )
        } else {
          setRows(buildInitialRows())
        }
      } catch (error) {
        console.error('加载考试合格率失败', error)
        message.error('加载失败')
        setRows(buildInitialRows())
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [campusName, selectedYear, kind])

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [classes, teachers] = await Promise.all([
          fetchClasses({ active: true }).catch(() => []),
          fetchTeachers({ campus_name: campusName, active: true }).catch(() => []),
        ])
        const classNames = (classes as ClassProfile[])
          .filter((c) => !c.campus_name || c.campus_name === campusName)
          .map((c) => c.class_name)
          .filter(Boolean)
        const teacherNames = (teachers as TeacherProfile[])
          .filter((t) => t.is_active !== false)
          .map((t) => t.name)
          .filter(Boolean)
        setClassOptions(Array.from(new Set(classNames)))
        setTeacherOptions(Array.from(new Set(teacherNames)))
      } catch (error) {
        console.error('加载班级/教员列表失败', error)
      }
    }
    loadOptions()
  }, [campusName])

  const data = useMemo(() => buildDataWithSummary(rows, '当月平均'), [rows])

  const update = (idx: number, patch: Partial<GridRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const nameOptions = useMemo(() => {
    const currentNames = rows.map((r) => r.name).filter(Boolean)
    const base = kind === 'class' ? classOptions : teacherOptions
    return Array.from(new Set([...base, ...currentNames])).map((n) => ({ label: n, value: n }))
  }, [classOptions, teacherOptions, rows, kind])

  const autoFillFromExamScores = async () => {
    setLoading(true)
    try {
      const pageSize = 200
      const firstPage = await classExamScoreService.getList({ page: 1, pageSize }, campusName)
      let records = firstPage.list || []
      if ((firstPage.totalPages || 1) > 1) {
        const tasks = []
        for (let p = 2; p <= (firstPage.totalPages || 1); p += 1) {
          tasks.push(classExamScoreService.getList({ page: p, pageSize }, campusName))
        }
        const rest = await Promise.all(tasks)
        rest.forEach((res) => {
          records = records.concat(res.list || [])
        })
      }

      const parseDate = (raw: any): Date | null => {
        if (!raw) return null
        if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw
        if (typeof raw === 'string') {
          // 兼容 "2024/07/27"、"2024-07-27" 等
          const normalized = raw.replace(/\./g, '-').replace(/\//g, '-')
          const d1 = new Date(normalized)
          if (!Number.isNaN(d1.getTime())) return d1
          const d2 = new Date(raw)
          if (!Number.isNaN(d2.getTime())) return d2
        }
        return null
      }

      const getMonth = (rec: any): number | null => {
        // 只使用考试日期决定月份，避免跨年记录被 createdAt/updatedAt 污染
        const candidates = [rec.firstExamDate, rec.makeupExamDate, rec.createdAt, rec.updatedAt]
        for (const raw of candidates) {
          const d = parseDate(raw)
          if (d && d.getFullYear() === selectedYear) return d.getMonth() + 1
        }
        return null
      }

      const computeTotalScore = (stu: any, majorName?: string): number => {
        const written = Number(stu.written_score ?? stu.writtenScore ?? 0)
        const lab = Number(stu.lab_score ?? stu.labScore ?? 0)
        const daily = Number(stu.daily_score ?? stu.dailyScore ?? 0)
        const isDesign = !!majorName && (majorName.includes('设计') || majorName.includes('媒'))
        return isDesign ? written * 0.4 + lab * 0.4 + daily * 0.2 : written * 0.5 + lab * 0.5
      }

      const byName = new Map<string, Map<number, number[]>>() // 名称 -> 月份 -> 通过率列表
      records.forEach((rec) => {
        const month = getMonth(rec)
        if (!month || month < 1 || month > 12) return
        const baseName = kind === 'class' ? rec.className : rec.instructorName
        if (!baseName) return

        // 兜底班级人数/合格人数，防止接口返回字符串或缺失
        let effectiveClassSize =
          Number.isFinite(rec.classSize) && rec.classSize > 0
            ? Number(rec.classSize)
            : Array.isArray(rec.scoresFirst?.students)
              ? rec.scoresFirst.students.length
              : 0
        let effectivePassCount =
          Number.isFinite(rec.passCount) && rec.passCount >= 0 ? Number(rec.passCount) : undefined

        // 若 pass_count 缺失或为 0，则尝试从 scores_final 重算
        if ((effectivePassCount ?? 0) === 0 && Array.isArray(rec.scoresFinal?.students)) {
          const count = rec.scoresFinal.students.filter((s: any) => s?.passed === true).length
          effectivePassCount = count
        }

        // 若仍为 0，再从 scores_first / scores_makeup 重新计算
        if ((effectivePassCount ?? 0) === 0 && Array.isArray(rec.scoresFirst?.students)) {
          const firstList = rec.scoresFirst.students
          const makeupMap = new Map<string, any>()
          if (Array.isArray(rec.scoresMakeup?.students)) {
            rec.scoresMakeup.students.forEach((s: any) => {
              const sid = String(s.student_id ?? s.studentId ?? '')
              if (sid) makeupMap.set(sid, s)
            })
          }
          effectiveClassSize = Math.max(effectiveClassSize, firstList.length)
          let passCnt = 0
          firstList.forEach((s: any) => {
            const sid = String(s.student_id ?? s.studentId ?? '')
            const firstTotal = computeTotalScore(s, rec.majorName || (rec as any).major_name)
            const makeupStu = makeupMap.get(sid)
            const makeupTotal = makeupStu ? computeTotalScore(makeupStu, rec.majorName) : undefined
            const passed = firstTotal >= 60 || (makeupTotal !== undefined && makeupTotal >= 60)
            if (passed) passCnt += 1
          })
          effectivePassCount = passCnt
        }

        const rate =
          effectiveClassSize > 0 && Number.isFinite(effectivePassCount)
            ? Number((((effectivePassCount as number) / effectiveClassSize) * 100).toFixed(2))
            : undefined
        if (rate === undefined || Number.isNaN(rate)) return
        if (!byName.has(baseName)) byName.set(baseName, new Map())
        const mMap = byName.get(baseName)!
        if (!mMap.has(month)) mMap.set(month, [])
        mMap.get(month)!.push(rate)
      })

      const names = Array.from(byName.keys())
      if (!names.length) {
        message.info('暂无符合条件的考试成绩记录，无法自动填充')
        return
      }

      const mappedRows: GridRow[] = names.map((n, idx) => {
        const row: GridRow = { key: `r-${idx + 1}`, index: idx + 1, name: n }
        const mMap = byName.get(n)!
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
      message.success('已从考试成绩记录自动计算合格率并填充')
    } catch (error) {
      console.error('自动获取考试数据失败', error)
      message.error('自动获取失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnsType<GridRow> = [
    { title: '序号', dataIndex: 'index', width: 70, align: 'center', fixed: 'left' },
    {
      title: title.includes('班级') ? '班级' : '姓名',
      dataIndex: 'name',
      width: 140,
      align: 'center',
      fixed: 'left',
      render: (v, record, index) =>
        record.rowType === 'summary' ? (
          <span style={{ fontWeight: 600 }}>{v}</span>
        ) : (
          <Select
            value={v || undefined}
            placeholder={kind === 'class' ? '选择班级' : '选择教员'}
            allowClear
            showSearch
            options={nameOptions}
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
            onChange={(val) => update(index, { name: val || '' })}
            onBlur={(e) => {
              const text = (e.target as HTMLInputElement)?.value?.trim()
              if (text) {
                if (kind === 'class') setClassOptions((prev) => (prev.includes(text) ? prev : [...prev, text]))
                else setTeacherOptions((prev) => (prev.includes(text) ? prev : [...prev, text]))
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
    title: avgLabel,
    dataIndex: 'avg',
    align: 'center',
    width: 110,
    render: (v, record) => (record.rowType === 'summary' ? '' : typeof v === 'number' ? v : ''),
  })

  return (
    <Card bordered={false} style={{ marginBottom: 16 }}>
      <Space style={{ marginBottom: 8, width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <Title level={5} style={{ margin: 0 }}>
            {title}
          </Title>
          <Row gutter={12} align="middle">
            <Col>
              <span>年份</span>
            </Col>
            <Col>
              <Select value={selectedYear} disabled style={{ width: 110 }}>
                <Option value={selectedYear}>{selectedYear}</Option>
              </Select>
            </Col>
            <Col>
              <span>神殿</span>
            </Col>
            <Col>
              <Input disabled value={campusName} style={{ width: 150 }} />
            </Col>
          </Row>
        </Space>
        <Space>
          <Button onClick={() => setRows(buildInitialRows())} disabled={loading}>
            清空
          </Button>
          <Button onClick={autoFillFromExamScores} loading={loading}>
            自动获取数据
          </Button>
          <Button
            onClick={() => {
              setRows((prev) => {
                const nextIdx = prev.filter((r) => r.rowType !== 'summary').length + 1
                return [
                  ...prev.filter((r) => r.rowType !== 'summary'),
                  { key: `r-${Date.now()}`, index: nextIdx, name: '' },
                ]
              })
            }}
            disabled={loading}
          >
            新增
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={async () => {
              setLoading(true)
              try {
                const payloadRows: ExamRateRowBackend[] = []
                rows.forEach((r, idx) => {
                  const hasValue =
                    (r.name && r.name.trim()) ||
                    MONTH_KEYS.some((k) => typeof r[k] === 'number')
                  if (hasValue) {
                    payloadRows.push({
                      序号: typeof r.index === 'number' ? r.index : idx + 1,
                      名称: r.name,
                      m1: r.m1,
                      m2: r.m2,
                      m3: r.m3,
                      m4: r.m4,
                      m5: r.m5,
                      m6: r.m6,
                      m7: r.m7,
                      m8: r.m8,
                      m9: r.m9,
                      m10: r.m10,
                      m11: r.m11,
                      m12: r.m12,
                    })
                  }
                })
                const saved = await saveExamRateTable(kind, campusName, selectedYear, payloadRows)
                const savedRows = saved.行数据 || []
                if (savedRows.length > 0) {
                  const mapped: GridRow[] = savedRows
                    .sort((a, b) => (a.序号 || 0) - (b.序号 || 0))
                    .map((r, idx) => ({
                      key: `r-${idx + 1}`,
                      index: r.序号 ?? idx + 1,
                      name: r.名称 || '',
                      m1: r.m1,
                      m2: r.m2,
                      m3: r.m3,
                      m4: r.m4,
                      m5: r.m5,
                      m6: r.m6,
                      m7: r.m7,
                      m8: r.m8,
                      m9: r.m9,
                      m10: r.m10,
                      m11: r.m11,
                      m12: r.m12,
                    }))
                  setRows(
                    mapped
                      .concat(Array(Math.max(0, 10 - mapped.length)).fill(null))
                      .map((r, i) => r || { key: `r-${i + 1}`, index: i + 1, name: '' }),
                  )
                } else {
                  setRows(buildInitialRows())
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
      <Table<GridRow>
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

const TeacherExamTab: React.FC = () => {
  const { currentCampus } = useCampusStore()
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())
  const campusName = currentCampus || '主神殿'

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <span>年份</span>
        <GlobalYearSelector 
          value={selectedYear} 
          onChange={setSelectedYear}
          width={120}
        />
        <span>神殿</span>
        <Input disabled value={campusName} style={{ width: 160 }} />
      </Space>
      <MonthlyGrid
        title="XX神殿智慧司班级考试合格率"
        avgLabel="班级平均"
        initialNames={[]}
        kind="class"
        campusName={campusName}
        selectedYear={selectedYear}
      />
      <MonthlyGrid
        title="XX神殿智慧司教员考试合格率"
        avgLabel="教员平均"
        initialNames={[]}
        kind="teacher"
        campusName={campusName}
        selectedYear={selectedYear}
      />
    </div>
  )
}

export default TeacherExamTab
