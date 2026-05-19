// 学术 -> 教员 -> 清美教育学员作业成绩登记表（本地可编辑 + 持久化）
import React, { useMemo, useState, useEffect } from 'react'
import {
  Card,
  Typography,
  Row,
  Col,
  Input,
  InputNumber,
  Space,
  Button,
  Divider,
  Table,
  DatePicker,
  Select,
  Calendar,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

// 使用更宽松的键类型，避免旧版 TS 对模板字面量类型/映射类型的报错
type ScorePairKey = string // 形如 a1..a20（每次作业的分数对）

type StudentRow = {
  key: string
  studentNo: string
  studentName: string
  // 动态键位：a1..aN，用于存储作业/小测分数
  [k: string]: any
  usualScore?: number // 平时成绩
}

const ASSIGNMENT_COUNT_DEFAULT = 20
const STUDENT_ROWS_DEFAULT = 30
const STORAGE_KEY = 'teacher-homework-grade-register'

const DATES_DEFAULT = [
  '2024/7/1',
  '2024/7/2',
  '2024/7/3',
  '2024/7/4',
  '2024/7/5',
  '2024/7/6',
  '2024/7/7',
  '2024/7/8',
  '2024/7/9',
  '2024/7/10',
  '2024/7/11',
  '2024/7/12',
  '2024/7/13',
  '2024/7/14',
  '2024/7/15',
  '2024/7/16',
  '2024/7/17',
  '2024/7/18',
  '2024/7/19',
  '2024/7/20',
  '2024/7/21',
  '2024/7/22',
  '2024/7/23',
  '2024/7/24',
  '2024/7/25',
  '2024/7/26',
  '2024/7/27',
]

const buildEmptyStudents = (
  count = STUDENT_ROWS_DEFAULT,
  assignmentCount = ASSIGNMENT_COUNT_DEFAULT,
): StudentRow[] => {
  return Array.from({ length: count }).map((_, i) => {
    const row: StudentRow = {
      key: String(i + 1),
      studentNo: '',
      studentName: '',
      usualScore: undefined,
    }
    for (let n = 1; n <= assignmentCount; n++) {
      ;(row as any)[`a${n}`] = { hw: undefined, quiz: undefined }
    }
    return row
  })
}

const HomeworkGradeRegister: React.FC = () => {
  const [meta, setMeta] = useState({
    campusName: '石美',
    majorName: '数字媒体',
    className: 'S32106',
    courseName: 'PS',
    teacherName: '杜鹏涛',
  })
  const [stats, setStats] = useState({
    classSize: 20,
    assignmentCount: ASSIGNMENT_COUNT_DEFAULT,
    actualSubmissions: 395,
    passCount: 375,
  })
  const expectedSubmissions = useMemo(
    () => stats.classSize * stats.assignmentCount,
    [stats.classSize, stats.assignmentCount],
  )
  const submitRate = useMemo(
    () =>
      expectedSubmissions
        ? Number(((stats.actualSubmissions / expectedSubmissions) * 100).toFixed(1))
        : 0,
    [expectedSubmissions, stats.actualSubmissions],
  )
  const passRate = useMemo(
    () =>
      stats.actualSubmissions
        ? Number(((stats.passCount / stats.actualSubmissions) * 100).toFixed(1))
        : 0,
    [stats.actualSubmissions, stats.passCount],
  )

  const [assignmentNames, setAssignmentNames] = useState<string[]>(() =>
    Array.from({ length: ASSIGNMENT_COUNT_DEFAULT }).map(() => ''),
  )
  const [students, setStudents] = useState<StudentRow[]>(() => buildEmptyStudents())
  const [datesRow, setDatesRow] = useState<string[]>(() => DATES_DEFAULT)
  const [currentDate, setCurrentDate] = useState<string | undefined>(undefined)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const obj = JSON.parse(raw)
        if (obj.meta) setMeta(obj.meta)
        if (obj.stats) setStats(obj.stats)
        if (Array.isArray(obj.assignmentNames)) setAssignmentNames(obj.assignmentNames)
        if (Array.isArray(obj.students)) setStudents(obj.students)
        if (Array.isArray(obj.datesRow)) setDatesRow(obj.datesRow)
        if (obj.currentDate) setCurrentDate(obj.currentDate)
      }
    } catch {}
  }, [])

  const persist = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ meta, stats, assignmentNames, students, datesRow, currentDate }),
      )
    } catch {}
  }

  const clearAll = () => {
    setMeta({
      campusName: '石美',
      majorName: '数字媒体',
      className: 'S32106',
      courseName: 'PS',
      teacherName: '杜鹏涛',
    })
    setStats({
      classSize: 20,
      assignmentCount: ASSIGNMENT_COUNT_DEFAULT,
      actualSubmissions: 0,
      passCount: 0,
    })
    setAssignmentNames(Array.from({ length: ASSIGNMENT_COUNT_DEFAULT }).map(() => ''))
    setStudents(buildEmptyStudents())
    setDatesRow(DATES_DEFAULT)
    setCurrentDate(undefined)
  }

  // 根据日期数量动态更新作业次数（可根据需要关闭此逻辑）
  useEffect(() => {
    if (datesRow.length && stats.assignmentCount !== datesRow.length) {
      setStats((s) => ({ ...s, assignmentCount: datesRow.length }))
      if (assignmentNames.length !== datesRow.length) {
        setAssignmentNames((prev) =>
          Array.from({ length: datesRow.length }).map((_, i) => prev[i] || ''),
        )
      }
    }
  }, [datesRow.length])

  // 工具函数：日期字符串与时间戳
  const fmtDate = (d: Date) => `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
  const toTs = (ds: string) => new Date(ds.replace(/\//g, '-')).getTime()

  const addDate = (d: any) => {
    const v = d && typeof d.toDate === 'function' ? fmtDate(d.toDate()) : ''
    if (!v) return
    setDatesRow((prev) => {
      if (prev.includes(v)) return prev
      const next = [...prev, v].sort((a, b) => toTs(a) - toTs(b))
      return next
    })
    setCurrentDate(v)
  }

  const setRange = (range: [any, any] | null) => {
    if (!range || !range[0] || !range[1]) return
    const start: Date = range[0].toDate()
    const end: Date = range[1].toDate()
    const days: string[] = []
    const oneDay = 24 * 60 * 60 * 1000
    for (
      let t = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
      t <= new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
      t += oneDay
    ) {
      days.push(fmtDate(new Date(t)))
    }
    setDatesRow(days)
    setCurrentDate(days[0])
  }

  const assignmentColumns: ColumnsType<StudentRow> = []
  const activeIndex = useMemo(
    () => (currentDate ? datesRow.findIndex((d) => d === currentDate) : -1),
    [currentDate, datesRow],
  )
  for (let n = 1; n <= stats.assignmentCount; n++) {
    const key = `a${n}` as ScorePairKey
    const isActive = n - 1 === activeIndex
    assignmentColumns.push({
      title: (
        <div style={{ padding: 4, background: isActive ? '#fffbe6' : undefined, borderRadius: 4 }}>
          <div>
            作业{n}
            {datesRow[n - 1] ? `（${datesRow[n - 1]}）` : ''}
          </div>
          <Input
            size="small"
            placeholder="作业名称"
            value={assignmentNames[n - 1]}
            onChange={(e) =>
              setAssignmentNames((prev) => prev.map((v, i) => (i === n - 1 ? e.target.value : v)))
            }
            style={{ width: 120 }}
          />
        </div>
      ),
      children: [
        {
          title: '作业成绩',
          dataIndex: key,
          key: `${key}-hw`,
          align: 'center',
          width: 100,
          onCell: () => ({ style: isActive ? { background: '#fffbe6' } : {} }),
          render: (_v, record, index) => (
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              value={(record as any)[key]?.hw as number | undefined}
              onChange={(val) =>
                setStudents((prev) =>
                  prev.map((r, i) =>
                    i === index
                      ? { ...r, [key]: { ...((r as any)[key] || {}), hw: (val as number) | 0 } }
                      : r,
                  ),
                )
              }
            />
          ),
        },
        {
          title: '小测成绩',
          dataIndex: key,
          key: `${key}-quiz`,
          align: 'center',
          width: 100,
          onCell: () => ({ style: isActive ? { background: '#fffbe6' } : {} }),
          render: (_v, record, index) => (
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              value={(record as any)[key]?.quiz as number | undefined}
              onChange={(val) =>
                setStudents((prev) =>
                  prev.map((r, i) =>
                    i === index
                      ? { ...r, [key]: { ...((r as any)[key] || {}), quiz: (val as number) | 0 } }
                      : r,
                  ),
                )
              }
            />
          ),
        },
      ],
    } as any)
  }

  const columns: ColumnsType<StudentRow> = [
    {
      title: '学号',
      dataIndex: 'studentNo',
      width: 120,
      fixed: 'left',
      align: 'center',
      render: (v, r, i) => (
        <Input
          value={v}
          onChange={(e) =>
            setStudents((prev) =>
              prev.map((row, idx) => (idx === i ? { ...row, studentNo: e.target.value } : row)),
            )
          }
        />
      ),
    },
    {
      title: '学员姓名',
      dataIndex: 'studentName',
      width: 120,
      fixed: 'left',
      align: 'center',
      render: (v, r, i) => (
        <Input
          value={v}
          onChange={(e) =>
            setStudents((prev) =>
              prev.map((row, idx) => (idx === i ? { ...row, studentName: e.target.value } : row)),
            )
          }
        />
      ),
    },
    ...assignmentColumns,
    {
      title: '平时成绩',
      dataIndex: 'usualScore',
      width: 120,
      align: 'center',
      render: (v, r, i) => (
        <InputNumber
          min={0}
          max={100}
          style={{ width: '100%' }}
          value={v as number | undefined}
          onChange={(val) =>
            setStudents((prev) =>
              prev.map((row, idx) =>
                idx === i ? { ...row, usualScore: (val as number) | 0 } : row,
              ),
            )
          }
        />
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card bordered={false} style={{ background: '#f5f7fa' }}>
        <Title level={4} style={{ marginBottom: 12 }}>
          清美教育学员作业成绩登记表
        </Title>

        {/* 顶部信息 */}
        <Row gutter={[12, 8]}>
          <Col span={6}>
            <Space>
              <Text strong>神殿名称</Text>
              <Input
                value={meta.campusName}
                onChange={(e) => setMeta((m) => ({ ...m, campusName: e.target.value }))}
              />
            </Space>
          </Col>
          <Col span={6}>
            <Space>
              <Text strong>专业名称</Text>
              <Input
                value={meta.majorName}
                onChange={(e) => setMeta((m) => ({ ...m, majorName: e.target.value }))}
              />
            </Space>
          </Col>
          <Col span={6}>
            <Space>
              <Text strong>班级名称</Text>
              <Input
                value={meta.className}
                onChange={(e) => setMeta((m) => ({ ...m, className: e.target.value }))}
              />
            </Space>
          </Col>
          <Col span={6}>
            <Space>
              <Text strong>课程名称</Text>
              <Input
                value={meta.courseName}
                onChange={(e) => setMeta((m) => ({ ...m, courseName: e.target.value }))}
              />
            </Space>
          </Col>
        </Row>
        <Row gutter={[12, 8]} style={{ marginTop: 8 }}>
          <Col span={6}>
            <Space>
              <Text strong>教员姓名</Text>
              <Input
                value={meta.teacherName}
                onChange={(e) => setMeta((m) => ({ ...m, teacherName: e.target.value }))}
              />
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: '12px 0' }} />

        {/* 统计区 */}
        <Row gutter={[12, 8]}>
          <Col span={4}>
            <Space>
              <Text strong>班级人数</Text>
              <InputNumber
                min={0}
                value={stats.classSize}
                onChange={(v) => setStats((s) => ({ ...s, classSize: Number(v || 0) }))}
              />
            </Space>
          </Col>
          <Col span={4}>
            <Space>
              <Text strong>作业次数</Text>
              <InputNumber
                min={1}
                max={20}
                value={stats.assignmentCount}
                onChange={(v) => setStats((s) => ({ ...s, assignmentCount: Number(v || 1) }))}
              />
            </Space>
          </Col>
          <Col span={4}>
            <Space>
              <Text strong>应提交数量</Text>
              <Input readOnly value={expectedSubmissions} />
            </Space>
          </Col>
          <Col span={4}>
            <Space>
              <Text strong>实际提交数量</Text>
              <InputNumber
                min={0}
                value={stats.actualSubmissions}
                onChange={(v) => setStats((s) => ({ ...s, actualSubmissions: Number(v || 0) }))}
              />
            </Space>
          </Col>
          <Col span={4}>
            <Space>
              <Text strong>合格数量</Text>
              <InputNumber
                min={0}
                value={stats.passCount}
                onChange={(v) => setStats((s) => ({ ...s, passCount: Number(v || 0) }))}
              />
            </Space>
          </Col>
        </Row>
        <Row gutter={[12, 8]} style={{ marginTop: 8 }}>
          <Col span={4}>
            <Space>
              <Text strong>作业提交率</Text>
              <Input readOnly value={`${submitRate}%`} />
            </Space>
          </Col>
          <Col span={4}>
            <Space>
              <Text strong>作业合格率</Text>
              <Input readOnly value={`${passRate}%`} />
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: '12px 0' }} />

        {/* 日期/作业序号条 */}
        {/* 动态日历选择 */}
        <Row gutter={[12, 8]} style={{ marginBottom: 8 }}>
          <Col span={6}>
            <Space>
              <Text strong>选择日期</Text>
              <DatePicker onChange={addDate} />
            </Space>
          </Col>
          <Col span={10}>
            <Space>
              <Text strong>范围生成</Text>
              <DatePicker.RangePicker onChange={(vals) => setRange(vals as any)} />
              <Button
                onClick={() => {
                  setDatesRow([])
                  setCurrentDate(undefined)
                }}
              >
                清空日期
              </Button>
            </Space>
          </Col>
          <Col span={8}>
            <Space>
              <Text strong>当前提交日期</Text>
              <Select
                allowClear
                placeholder="选择一个日期聚焦对应作业"
                style={{ minWidth: 220 }}
                value={currentDate}
                onChange={(v) => setCurrentDate(v)}
                options={datesRow.map((d) => ({ label: d, value: d }))}
              />
              {currentDate && (
                <Text type="secondary">
                  对应作业序号：{datesRow.findIndex((d) => d === currentDate) + 1 || '-'}
                </Text>
              )}
            </Space>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <div
              style={{
                background: '#fff',
                padding: 8,
                borderRadius: 6,
                border: '1px solid #f0f0f0',
                marginBottom: 8,
              }}
            >
              <Calendar fullscreen={false} onSelect={(d) => addDate(d)} />
            </div>
          </Col>
        </Row>
        <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Text strong style={{ minWidth: 60 }}>
              日期
            </Text>
            {datesRow.map((d, idx) => (
              <span
                key={idx}
                style={{ display: 'inline-block', minWidth: 90, textAlign: 'center' }}
              >
                {d}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
            <Text strong style={{ minWidth: 60 }}>
              作业序号
            </Text>
            {Array.from({ length: stats.assignmentCount }).map((_, i) => (
              <span key={i} style={{ display: 'inline-block', minWidth: 90, textAlign: 'center' }}>
                {i + 1}
              </span>
            ))}
            <span style={{ display: 'inline-block', minWidth: 90, textAlign: 'center' }}>结课</span>
          </div>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* 学员成绩表 */}
        <Table<StudentRow>
          bordered
          size="small"
          columns={columns}
          dataSource={students}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />

        <Space style={{ marginTop: 12 }}>
          <Button type="primary" onClick={persist}>
            保存（本地）
          </Button>
          {currentDate && <Button onClick={persist}>保存当前日期（本地）</Button>}
          <Button onClick={clearAll}>清空</Button>
        </Space>
      </Card>
    </div>
  )
}

export default HomeworkGradeRegister
