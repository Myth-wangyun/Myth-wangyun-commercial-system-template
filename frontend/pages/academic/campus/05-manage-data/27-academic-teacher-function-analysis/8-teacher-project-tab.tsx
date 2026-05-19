// 学术->学术经理->管理表格 项目TAB：包含项目提交率 与 项目合格率 两张表
import React, { useMemo, useState, useEffect } from 'react'
import { App, Card, Table, Typography, Space, Button, Input, InputNumber, Select, Row, Col } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { getProjectTable, saveProjectTable } from '@/services/teacherProject'
import type { ProjectRowBackend } from '@/services/teacherProject'
import { projectGradeRegisterService } from '@/services/service'
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

interface ProjectRow {
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
  avg?: number // 教员平均
}

const buildInitialRows = (): ProjectRow[] => {
  const rows: ProjectRow[] = Array.from({ length: 10 }).map((_, i) => ({
    key: `r-${i + 1}`,
    index: i + 1,
    name: '',
  }))
  return rows
}

const calcRowAvg = (r: ProjectRow): number | undefined => {
  const vals = MONTH_KEYS.map((k) => r[k]).filter((v) => typeof v === 'number') as number[]
  if (!vals.length) return undefined
  const sum = vals.reduce((a, b) => a + (b || 0), 0)
  return Number((sum / vals.length).toFixed(2))
}

const buildDataWithSummary = (data: ProjectRow[]): ProjectRow[] => {
  const items = data.map((r) => ({ ...r, avg: calcRowAvg(r) }))
  // 汇总行：当月平均（逐月平均）
  const summary: ProjectRow = {
    key: 'summary',
    index: '',
    name: '当月平均',
    rowType: 'summary',
  } as ProjectRow
  MONTH_KEYS.forEach((k) => {
    const vals = items.map((r) => r[k]).filter((v) => typeof v === 'number') as number[]
    if (vals.length)
      summary[k] = Number((vals.reduce((a, b) => a + (b || 0), 0) / vals.length).toFixed(2))
  })
  return [...items, summary]
}

type TableKind = 'submission' | 'pass'

const titleByKind: Record<TableKind, string> = {
  submission: 'XX神殿智慧司项目提交率',
  pass: 'XX神殿智慧司项目合格率',
}

interface ProjectSingleTableProps {
  kind: TableKind
  campusName: string
  selectedYear: number
}

const ProjectSingleTable: React.FC<ProjectSingleTableProps> = ({ kind, campusName, selectedYear }) => {
  const { message } = App.useApp()
  const [rows, setRows] = useState<ProjectRow[]>(() => buildInitialRows())
  const [loading, setLoading] = useState(false)
  const [teacherOptions, setTeacherOptions] = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await getProjectTable(kind, campusName, selectedYear)
        const backendRows = res.行数据 || []
        if (backendRows.length > 0) {
          const mapped: ProjectRow[] = backendRows
            .sort((a, b) => (a.序号 || 0) - (b.序号 || 0))
            .map((r, idx) => ({
              key: `r-${idx + 1}`,
              index: r.序号 ?? idx + 1,
              name: r.姓名 || '',
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
          setRows(mapped.concat(Array(Math.max(0, 10 - mapped.length)).fill(null)).map((r, i) => r || { key: `r-${i + 1}`, index: i + 1, name: '' }))
        } else {
          setRows(buildInitialRows())
        }
      } catch (error) {
        console.error('加载项目数据失败', error)
        message.error('加载失败')
        setRows(buildInitialRows())
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [campusName, selectedYear, kind])

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const teachers = await fetchTeachers({
          campus_name: campusName,
          active: true,
          participate_kpi: true,
        })
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

  const update = (idx: number, patch: Partial<ProjectRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const nameOptions = useMemo(() => {
    const currentNames = rows.map((r) => r.name).filter(Boolean)
    return Array.from(new Set([...teacherOptions, ...currentNames])).map((n) => ({ label: n, value: n }))
  }, [teacherOptions, rows])

  // 自动从项目成绩表(project_grade_registers)聚合提交率/合格率
  const autoFillFromProjectRegisters = async () => {
    setLoading(true)
    try {
      // 拉全量记录（分页）
      // 接口最大 page_size 200，按页抓取
      const pageSize = 200
      const firstPage = await projectGradeRegisterService.getList({ page: 1, pageSize }, campusName)
      let records = firstPage.list || []
      if ((firstPage.totalPages || 1) > 1) {
        const tasks = []
        for (let p = 2; p <= (firstPage.totalPages || 1); p += 1) {
          tasks.push(projectGradeRegisterService.getList({ page: p, pageSize }, campusName))
        }
        const rest = await Promise.all(tasks)
        rest.forEach((res) => {
          records = records.concat(res.list || [])
        })
      }

      // teacher -> month -> [rate...]
      const byTeacher = new Map<string, Map<number, number[]>>()

      records.forEach((rec) => {
        const teacher = rec.teacherName || '未命名教员'
        const projectCount = rec.projectCount || 0
        const classSize = rec.classSize || 0
        const students = rec.students || []

        for (let i = 0; i < projectCount; i++) {
          const pKey = `p${i + 1}`
          const attemptDates = rec.projectAttemptDates?.[i] || [] // this is an array of 3 dates for project i
          let month: number | null = null

          // Get the date of the third attempt.
          const thirdAttemptDateStr = attemptDates[2]
          if (thirdAttemptDateStr) {
            const d = new Date(thirdAttemptDateStr)
            if (!Number.isNaN(d.getTime()) && d.getFullYear() === selectedYear) {
              month = d.getMonth() + 1
            }
          }

          // Fallback to the last available attempt date if the third one is not valid
          if (!month) {
            for (let j = attemptDates.length - 1; j >= 0; j--) {
              const dateStr = attemptDates[j]
              if (dateStr) {
                const d = new Date(dateStr)
                if (!Number.isNaN(d.getTime()) && d.getFullYear() === selectedYear) {
                  month = d.getMonth() + 1
                  break
                }
              }
            }
          }

          if (!month) {
            if (rec.createdAt) {
              const d = new Date(rec.createdAt)
              if (!Number.isNaN(d.getTime()) && d.getFullYear() === selectedYear) {
                month = d.getMonth() + 1
              }
            }
          }

          if (!month || month < 1 || month > 12) continue

          let projectSubmissions = 0
          let projectPasses = 0

          students.forEach((student) => {
            let submitted = false
            let passed = true
            let attemptScores: number[] = []

            for (let j = 0; j < 3; j++) {
              const aKey = `a${j + 1}`
              const scoreField = `${pKey}${aKey}`
              const scoreData = (student as any)[scoreField]
              if (scoreData && typeof scoreData.score === 'number') {
                submitted = true
                attemptScores.push(scoreData.score)
              }
            }

            if (submitted) {
              projectSubmissions++
              if (attemptScores.length > 0) {
                const finalScore = attemptScores[attemptScores.length - 1]
                if (finalScore < 6) {
                  passed = false
                }
              } else {
                passed = false
              }
            }

            if (submitted && passed) {
              projectPasses++
            }
          })

          let rate: number | undefined
          if (kind === 'submission') {
            rate = classSize > 0 ? Number(((projectSubmissions / classSize) * 100).toFixed(2)) : 0
          } else {
            rate =
              projectSubmissions > 0
                ? Number(((projectPasses / projectSubmissions) * 100).toFixed(2))
                : 0
          }

          if (rate === undefined || Number.isNaN(rate)) continue

          if (!byTeacher.has(teacher)) byTeacher.set(teacher, new Map())
          const mMap = byTeacher.get(teacher)!
          if (!mMap.has(month)) mMap.set(month, [])
          mMap.get(month)!.push(rate)
        }
      })

      const teacherList = Array.from(byTeacher.keys())
      if (!teacherList.length) {
        message.info('暂无符合条件的项目成绩记录，无法自动填充')
        return
      }

      const mappedRows: ProjectRow[] = teacherList.map((name, idx) => {
        const row: ProjectRow = { key: `r-${idx + 1}`, index: idx + 1, name }
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
      message.success('已从项目成绩表自动聚合并填充')
    } catch (error) {
      console.error('自动获取项目数据失败', error)
      message.error('自动获取失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnsType<ProjectRow> = [
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
      <Space style={{ marginBottom: 8, width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <Title level={5} style={{ margin: 0 }}>
            {titleByKind[kind]}
          </Title>
          <Row gutter={12} align="middle">
            <Col><span>年份</span></Col>
            <Col>
              <Select value={selectedYear} disabled style={{ width: 110 }}>
                <Option value={selectedYear}>{selectedYear}</Option>
              </Select>
            </Col>
            <Col><span>神殿</span></Col>
            <Col>
              <Input disabled value={campusName} style={{ width: 150 }} />
            </Col>
          </Row>
        </Space>
        <Space>
          <Button onClick={autoFillFromProjectRegisters} loading={loading}>
            自动获取数据
          </Button>
          <Button
            onClick={() => {
              setRows(buildInitialRows())
            }}
            disabled={loading}
          >
            清空
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={async () => {
              setLoading(true)
              try {
                const payloadRows: ProjectRowBackend[] = []
                rows.forEach((r, idx) => {
                  const hasValue =
                    (r.name && r.name.trim()) ||
                    MONTH_KEYS.some((k) => typeof r[k] === 'number')
                  if (hasValue) {
                    payloadRows.push({
                      序号: typeof r.index === 'number' ? r.index : idx + 1,
                      姓名: r.name,
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
                const saved = await saveProjectTable(kind, campusName, selectedYear, payloadRows)
                const savedRows = saved.行数据 || []
                if (savedRows.length > 0) {
                  const mapped: ProjectRow[] = savedRows
                    .sort((a, b) => (a.序号 || 0) - (b.序号 || 0))
                    .map((r, idx) => ({
                      key: `r-${idx + 1}`,
                      index: r.序号 ?? idx + 1,
                      name: r.姓名 || '',
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
                  setRows(mapped.concat(Array(Math.max(0, 10 - mapped.length)).fill(null)).map((r, i) => r || { key: `r-${i + 1}`, index: i + 1, name: '' }))
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
      <Table<ProjectRow>
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

const TeacherProjectTab: React.FC = () => {
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
      <ProjectSingleTable kind="submission" campusName={campusName} selectedYear={selectedYear} />
      <ProjectSingleTable kind="pass" campusName={campusName} selectedYear={selectedYear} />
    </div>
  )
}

export default TeacherProjectTab
