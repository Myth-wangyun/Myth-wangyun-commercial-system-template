// 学术 -> 教员 -> 清美教育学员考试成绩登记表（本地可编辑 + 多课程持久化）
import React, { useEffect, useMemo, useState } from 'react'
import { App,
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
} from 'antd'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

type StudentRow = {
  key: string
  studentNo: string
  studentName: string
  // 首考
  firstWord?: number // 单词
  firstWritten?: number // 笔试
  firstPractical?: number // 上机
  firstUsual?: number // 平时
  // 补考
  makeupWord?: number
  makeupWritten?: number
  makeupPractical?: number
  makeupUsual?: number
}

const STUDENT_ROWS_DEFAULT = 30
const COURSE_LIST_KEY = 'teacher-exam-course-list'
const STORAGE_KEY_PREFIX = 'teacher-exam-grade-register:course:' // 结合课程名持久化

const buildEmptyStudents = (count = STUDENT_ROWS_DEFAULT): StudentRow[] => {
  return Array.from({ length: count }).map((_, i) => ({
    key: String(i + 1),
    studentNo: '',
    studentName: '',
  }))
}

const round1 = (v: number) => Math.round(v * 10) / 10

const ExamGradeRegister: React.FC = () => {
  const { message } = App.useApp()
  // 课程选择与管理
  const [courseList, setCourseList] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(COURSE_LIST_KEY)
      if (raw) return JSON.parse(raw)
    } catch {}
    return ['PS']
  })
  const [newCourse, setNewCourse] = useState('')
  const [course, setCourse] = useState<string>(() => {
    try {
      const raw = localStorage.getItem(COURSE_LIST_KEY + ':current')
      if (raw) return JSON.parse(raw)
    } catch {}
    return 'PS'
  })

  // 基本信息
  const [meta, setMeta] = useState({
    campusName: '石美',
    majorName: '数字媒体',
    className: 'S32106',
    courseName: 'PS',
    teacherName: '杜鹏涛',
  })

  const [examInfo, setExamInfo] = useState({
    firstExamDate: '',
    makeupExamDate: '',
  })

  // 统计设置
  const [classSize, setClassSize] = useState<number>(20)
  const [passThreshold, setPassThreshold] = useState<number>(60)
  const [weights, setWeights] = useState({
    word: 25,
    written: 35,
    practical: 30,
    usual: 10,
  })

  const [students, setStudents] = useState<StudentRow[]>(() => buildEmptyStudents())

  // 载入/切换课程时读取本地数据
  const loadCourse = (c: string) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PREFIX + c)
      if (raw) {
        const obj = JSON.parse(raw)
        if (obj.meta) setMeta(obj.meta)
        if (obj.examInfo) setExamInfo(obj.examInfo)
        if (typeof obj.classSize === 'number') setClassSize(obj.classSize)
        if (Array.isArray(obj.students)) setStudents(obj.students)
        if (obj.passThreshold) setPassThreshold(obj.passThreshold)
        if (obj.weights) setWeights(obj.weights)
        return
      }
    } catch {}
    // 默认
    setMeta((m) => ({ ...m, courseName: c }))
    setExamInfo({ firstExamDate: '', makeupExamDate: '' })
    setClassSize(20)
    setPassThreshold(60)
    setWeights({ word: 25, written: 35, practical: 30, usual: 10 })
    setStudents(buildEmptyStudents())
  }

  useEffect(() => {
    loadCourse(course)
  }, [course])

  // 持久化
  const persist = () => {
    try {
      localStorage.setItem(COURSE_LIST_KEY, JSON.stringify(Array.from(new Set(courseList))))
      localStorage.setItem(COURSE_LIST_KEY + ':current', JSON.stringify(course))
      localStorage.setItem(
        STORAGE_KEY_PREFIX + course,
        JSON.stringify({ meta, examInfo, classSize, passThreshold, weights, students }),
      )
      message.success('已保存到本地')
    } catch {}
  }

  const clearAll = () => {
    setMeta({
      campusName: '石美',
      majorName: '数字媒体',
      className: 'S32106',
      courseName: course,
      teacherName: '杜鹏涛',
    })
    setExamInfo({ firstExamDate: '', makeupExamDate: '' })
    setClassSize(20)
    setPassThreshold(60)
    setWeights({ word: 25, written: 35, practical: 30, usual: 10 })
    setStudents(buildEmptyStudents())
  }

  const addCourse = () => {
    const name = newCourse.trim()
    if (!name) return
    if (courseList.includes(name)) {
      setCourse(name)
      setNewCourse('')
      return
    }
    const next = [...courseList, name]
    setCourseList(next)
    setCourse(name)
    setNewCourse('')
  }

  const removeCourse = (name: string) => {
    const next = courseList.filter((c) => c !== name)
    setCourseList(next.length ? next : ['PS'])
    const nextCourse = next.length ? next[0] : 'PS'
    setCourse(nextCourse)
  }

  // 计算逻辑
  const totalFrom = (w: number, wi: number, p: number, u: number) => {
    const sumWeight = weights.word + weights.written + weights.practical + weights.usual
    if (sumWeight <= 0) return 0
    const s =
      (w || 0) * weights.word +
      (wi || 0) * weights.written +
      (p || 0) * weights.practical +
      (u || 0) * weights.usual
    return round1(s / sumWeight)
  }

  const firstTotals = useMemo(
    () =>
      students.map((r) =>
        totalFrom(r.firstWord || 0, r.firstWritten || 0, r.firstPractical || 0, r.firstUsual || 0),
      ),
    [students, weights],
  )
  const makeupTotals = useMemo(
    () =>
      students.map((r) =>
        totalFrom(
          r.makeupWord || 0,
          r.makeupWritten || 0,
          r.makeupPractical || 0,
          r.makeupUsual || 0,
        ),
      ),
    [students, weights],
  )
  const finalTotals = useMemo(
    () =>
      students.map((_, i) => {
        const a = firstTotals[i] || 0
        const b = makeupTotals[i] || 0
        return Math.max(a, b)
      }),
    [firstTotals, makeupTotals],
  )

  const passCount = useMemo(
    () => finalTotals.filter((t) => t >= passThreshold).length,
    [finalTotals, passThreshold],
  )
  const passRate = useMemo(
    () => (classSize ? round1((passCount / classSize) * 100) : 0),
    [passCount, classSize],
  )
  const avgScore = useMemo(() => {
    const valid = finalTotals.filter((t) => !Number.isNaN(t))
    if (!valid.length) return 0
    const s = valid.reduce((a, b) => a + b, 0)
    return round1(s / valid.length)
  }, [finalTotals])

  // 列定义
  const baseCols = (prefix: 'first' | 'makeup', totals: number[]): ColumnsType<StudentRow> => [
    {
      title: '学号',
      dataIndex: 'studentNo',
      width: 100,
      align: 'center',
      fixed: 'left',
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
      align: 'center',
      fixed: 'left',
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
    {
      title: '单词成绩',
      width: 100,
      align: 'center',
      render: (_v, _r, i) => (
        <InputNumber
          min={0}
          max={100}
          style={{ width: '100%' }}
          value={(students[i] as any)[`${prefix}Word`] as number | undefined}
          onChange={(val) =>
            setStudents((prev) =>
              prev.map((row, idx) =>
                idx === i ? ({ ...row, [`${prefix}Word`]: (val as number) | 0 } as any) : row,
              ),
            )
          }
        />
      ),
    },
    {
      title: '笔试成绩',
      width: 100,
      align: 'center',
      render: (_v, _r, i) => (
        <InputNumber
          min={0}
          max={100}
          style={{ width: '100%' }}
          value={(students[i] as any)[`${prefix}Written`] as number | undefined}
          onChange={(val) =>
            setStudents((prev) =>
              prev.map((row, idx) =>
                idx === i ? ({ ...row, [`${prefix}Written`]: (val as number) | 0 } as any) : row,
              ),
            )
          }
        />
      ),
    },
    {
      title: '上机成绩',
      width: 100,
      align: 'center',
      render: (_v, _r, i) => (
        <InputNumber
          min={0}
          max={100}
          style={{ width: '100%' }}
          value={(students[i] as any)[`${prefix}Practical`] as number | undefined}
          onChange={(val) =>
            setStudents((prev) =>
              prev.map((row, idx) =>
                idx === i ? ({ ...row, [`${prefix}Practical`]: (val as number) | 0 } as any) : row,
              ),
            )
          }
        />
      ),
    },
    {
      title: '平时成绩',
      width: 100,
      align: 'center',
      render: (_v, _r, i) => (
        <InputNumber
          min={0}
          max={100}
          style={{ width: '100%' }}
          value={(students[i] as any)[`${prefix}Usual`] as number | undefined}
          onChange={(val) =>
            setStudents((prev) =>
              prev.map((row, idx) =>
                idx === i ? ({ ...row, [`${prefix}Usual`]: (val as number) | 0 } as any) : row,
              ),
            )
          }
        />
      ),
    },
    {
      title: '综合成绩',
      width: 100,
      align: 'center',
      render: (_v, _r, i) => <Input readOnly value={totals[i] ?? 0} />,
    },
  ]

  const firstColumns = baseCols('first', firstTotals)
  const makeupColumns = baseCols('makeup', makeupTotals)
  const finalColumns: ColumnsType<StudentRow> = [
    { title: '学号', dataIndex: 'studentNo', width: 100, align: 'center', fixed: 'left' },
    { title: '学员姓名', dataIndex: 'studentName', width: 120, align: 'center', fixed: 'left' },
    {
      title: '单词成绩',
      width: 100,
      align: 'center',
      render: (_v, _r, i) => (
        <Input readOnly value={Math.max(students[i].firstWord || 0, students[i].makeupWord || 0)} />
      ),
    },
    {
      title: '笔试成绩',
      width: 100,
      align: 'center',
      render: (_v, _r, i) => (
        <Input
          readOnly
          value={Math.max(students[i].firstWritten || 0, students[i].makeupWritten || 0)}
        />
      ),
    },
    {
      title: '上机成绩',
      width: 100,
      align: 'center',
      render: (_v, _r, i) => (
        <Input
          readOnly
          value={Math.max(students[i].firstPractical || 0, students[i].makeupPractical || 0)}
        />
      ),
    },
    {
      title: '平时成绩',
      width: 100,
      align: 'center',
      render: (_v, _r, i) => (
        <Input
          readOnly
          value={Math.max(students[i].firstUsual || 0, students[i].makeupUsual || 0)}
        />
      ),
    },
    {
      title: '综合成绩',
      width: 100,
      align: 'center',
      render: (_v, _r, i) => <Input readOnly value={finalTotals[i] ?? 0} />,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card bordered={false} style={{ background: '#f5f7fa' }}>
        <Title level={4} style={{ marginBottom: 12 }}>
          清美教育学员考试成绩登记表
        </Title>

        {/* 课程选择与管理 */}
        <Row gutter={[12, 8]} style={{ marginBottom: 8 }}>
          <Col span={10}>
            <Space wrap>
              <Text strong>选择课程</Text>
              <Select
                style={{ minWidth: 200 }}
                value={course}
                onChange={(v) => setCourse(v)}
                options={courseList.map((c) => ({ label: c, value: c }))}
              />
              <Input
                placeholder="新课程名称"
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                style={{ width: 180 }}
              />
              <Button onClick={addCourse} type="primary">
                添加/切换
              </Button>
              <Button danger onClick={() => removeCourse(course)}>
                删除当前课程
              </Button>
            </Space>
          </Col>
          <Col span={14}>
            <Space wrap>
              <Text type="secondary">权重(%)</Text>
              <InputNumber
                min={0}
                max={100}
                value={weights.word}
                onChange={(v) => setWeights((w) => ({ ...w, word: Number(v || 0) }))}
                addonBefore="单词"
              />
              <InputNumber
                min={0}
                max={100}
                value={weights.written}
                onChange={(v) => setWeights((w) => ({ ...w, written: Number(v || 0) }))}
                addonBefore="笔试"
              />
              <InputNumber
                min={0}
                max={100}
                value={weights.practical}
                onChange={(v) => setWeights((w) => ({ ...w, practical: Number(v || 0) }))}
                addonBefore="上机"
              />
              <InputNumber
                min={0}
                max={100}
                value={weights.usual}
                onChange={(v) => setWeights((w) => ({ ...w, usual: Number(v || 0) }))}
                addonBefore="平时"
              />
              <Text type="secondary">合格分</Text>
              <InputNumber
                min={0}
                max={100}
                value={passThreshold}
                onChange={(v) => setPassThreshold(Number(v || 0))}
              />
            </Space>
          </Col>
        </Row>

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
          <Col span={6}>
            <Space>
              <Text strong>首考时间</Text>
              <DatePicker
                onChange={(d: any) =>
                  setExamInfo((i) => ({ ...i, firstExamDate: d ? d.format('YYYY/M/D') : '' }))
                }
              />
            </Space>
          </Col>
          <Col span={6}>
            <Space>
              <Text strong>补考时间</Text>
              <DatePicker
                onChange={(d: any) =>
                  setExamInfo((i) => ({ ...i, makeupExamDate: d ? d.format('YYYY/M/D') : '' }))
                }
              />
            </Space>
          </Col>
          <Col span={6}>
            <Space>
              <Text strong>班级人数</Text>
              <InputNumber
                min={0}
                value={classSize}
                onChange={(v) => setClassSize(Number(v || 0))}
              />
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: '12px 0' }} />

        {/* 统计显示 */}
        <Row gutter={[12, 8]}>
          <Col span={6}>
            <Space>
              <Text strong>合格人数</Text>
              <Input readOnly value={passCount} />
            </Space>
          </Col>
          <Col span={6}>
            <Space>
              <Text strong>合格率</Text>
              <Input readOnly value={`${passRate}%`} />
            </Space>
          </Col>
          <Col span={6}>
            <Space>
              <Text strong>平均成绩</Text>
              <Input readOnly value={avgScore} />
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: '12px 0' }} />

        {/* 三表排版：首考与补考并列，最终成绩独占一行 */}
        <Row gutter={[12, 12]}>
          <Col xs={24} lg={12}>
            <Card size="small" title="首考成绩表" style={{ height: '100%' }}>
              <Table<StudentRow>
                bordered
                size="small"
                columns={firstColumns}
                dataSource={students}
                pagination={false}
                scroll={{ x: 'max-content' }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card size="small" title="补考成绩表" style={{ height: '100%' }}>
              <Table<StudentRow>
                bordered
                size="small"
                columns={makeupColumns}
                dataSource={students}
                pagination={false}
                scroll={{ x: 'max-content' }}
              />
            </Card>
          </Col>
          <Col span={24}>
            <Card size="small" title="最终成绩表">
              <Table<StudentRow>
                bordered
                size="small"
                columns={finalColumns}
                dataSource={students}
                pagination={false}
                scroll={{ x: 'max-content' }}
              />
            </Card>
          </Col>
        </Row>

        <Space style={{ marginTop: 12 }}>
          <Button type="primary" onClick={persist}>
            保存（本地）
          </Button>
          <Button onClick={clearAll}>清空</Button>
        </Space>
      </Card>
    </div>
  )
}

export default ExamGradeRegister
