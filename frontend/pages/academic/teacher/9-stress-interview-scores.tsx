// 学术 -> 教员 -> 压力面试成绩表（本地可编辑 + 持久化）
import React, { useEffect, useMemo, useState } from 'react'
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
} from 'antd'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

type StudentRow = {
  key: string
  studentNo: string
  studentName: string
  [k: string]: any // 动态：p{n}_{t1|t2|t3|h1|h2}
}

const STORAGE_KEY = 'teacher-stress-interview-scores'
const STUDENT_ROWS_DEFAULT = 30
const PROJECT_COUNT_DEFAULT = 5

const buildEmptyStudents = (
  count = STUDENT_ROWS_DEFAULT,
  projectCount = PROJECT_COUNT_DEFAULT,
): StudentRow[] => {
  return Array.from({ length: count }).map((_, i) => {
    const row: StudentRow = { key: String(i + 1), studentNo: '', studentName: '' }
    for (let n = 1; n <= projectCount; n++) {
      row[`p${n}_t1`] = undefined
      row[`p${n}_t2`] = undefined
      row[`p${n}_t3`] = undefined
      row[`p${n}_h1`] = undefined
      row[`p${n}_h2`] = undefined
    }
    return row
  })
}

const avg = (vals: (number | undefined)[]) => {
  const a = vals.filter((v): v is number => typeof v === 'number')
  if (!a.length) return undefined
  const s = a.reduce((x, y) => x + y, 0)
  return Math.round((s / a.length) * 100) / 100
}

const StressInterviewScores: React.FC = () => {
  const [meta, setMeta] = useState({
    campusName: '石美',
    majorName: '数字媒体',
    className: 'S32106',
    courseName: '项目答辩',
    teacherName: '张',
    headTeacherName: '李',
  })

  const [stats, setStats] = useState({
    classSize: 20, // 强化人数
    projectCount: PROJECT_COUNT_DEFAULT, // 压面次数
    actualCount: 395, // 实际压面数量
    passCount: 375, // 合格数量
  })

  const expectedCount = useMemo(
    () => stats.classSize * stats.projectCount,
    [stats.classSize, stats.projectCount],
  )
  const joinRate = useMemo(
    () => (expectedCount ? Number(((stats.actualCount / expectedCount) * 100).toFixed(1)) : 0),
    [expectedCount, stats.actualCount],
  )
  const passRate = useMemo(
    () =>
      stats.actualCount ? Number(((stats.passCount / stats.actualCount) * 100).toFixed(1)) : 0,
    [stats.actualCount, stats.passCount],
  )

  const [projectNames, setProjectNames] = useState<string[]>(() =>
    Array.from({ length: PROJECT_COUNT_DEFAULT }).map(() => ''),
  )
  const [projectDates, setProjectDates] = useState<string[][]>(() =>
    Array.from({ length: PROJECT_COUNT_DEFAULT }).map(() => ['', '', '']),
  )
  const [students, setStudents] = useState<StudentRow[]>(() => buildEmptyStudents())

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const obj = JSON.parse(raw)
        if (obj.meta) setMeta(obj.meta)
        if (obj.stats) setStats(obj.stats)
        if (Array.isArray(obj.projectNames)) setProjectNames(obj.projectNames)
        if (Array.isArray(obj.projectDates)) setProjectDates(obj.projectDates)
        if (Array.isArray(obj.students)) setStudents(obj.students)
      }
    } catch {}
  }, [])

  const persist = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ meta, stats, projectNames, projectDates, students }),
      )
    } catch {}
  }

  const clearAll = () => {
    setMeta({
      campusName: '石美',
      majorName: '数字媒体',
      className: 'S32106',
      courseName: '项目答辩',
      teacherName: '张',
      headTeacherName: '李',
    })
    setStats({ classSize: 20, projectCount: PROJECT_COUNT_DEFAULT, actualCount: 0, passCount: 0 })
    setProjectNames(Array.from({ length: PROJECT_COUNT_DEFAULT }).map(() => ''))
    setProjectDates(Array.from({ length: PROJECT_COUNT_DEFAULT }).map(() => ['', '', '']))
    setStudents(buildEmptyStudents())
  }

  // projectCount 变化时同步数组与学生键
  useEffect(() => {
    setProjectNames((prev) =>
      Array.from({ length: stats.projectCount }).map((_, i) => prev[i] || ''),
    )
    setProjectDates((prev) =>
      Array.from({ length: stats.projectCount }).map((_, i) => prev[i] || ['', '', '']),
    )
    setStudents((prev) =>
      prev.map((row) => {
        const r: StudentRow = { ...row }
        for (let n = 1; n <= stats.projectCount; n++) {
          ;['t1', 't2', 't3', 'h1', 'h2'].forEach((suf) => {
            const k = `p${n}_` + suf
            if (!(k in r)) (r as any)[k] = undefined
          })
        }
        return r
      }),
    )
  }, [stats.projectCount])

  // 构建列
  const columns: ColumnsType<StudentRow> = [
    {
      title: '学号',
      dataIndex: 'studentNo',
      width: 110,
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
  ]

  for (let n = 1; n <= stats.projectCount; n++) {
    const children: ColumnsType<StudentRow> = [
      {
        title: '教员1评分',
        width: 100,
        align: 'center',
        render: (_v, _r, i) => (
          <InputNumber
            min={0}
            max={100}
            style={{ width: '100%' }}
            value={(students[i] as any)[`p${n}_t1`] as number | undefined}
            onChange={(val) =>
              setStudents((prev) =>
                prev.map((row, idx) =>
                  idx === i
                    ? ({ ...row, [`p${n}_t1`]: typeof val === 'number' ? val : undefined } as any)
                    : row,
                ),
              )
            }
          />
        ),
      },
      {
        title: '教员2评分',
        width: 100,
        align: 'center',
        render: (_v, _r, i) => (
          <InputNumber
            min={0}
            max={100}
            style={{ width: '100%' }}
            value={(students[i] as any)[`p${n}_t2`] as number | undefined}
            onChange={(val) =>
              setStudents((prev) =>
                prev.map((row, idx) =>
                  idx === i
                    ? ({ ...row, [`p${n}_t2`]: typeof val === 'number' ? val : undefined } as any)
                    : row,
                ),
              )
            }
          />
        ),
      },
      {
        title: '教员3评分',
        width: 100,
        align: 'center',
        render: (_v, _r, i) => (
          <InputNumber
            min={0}
            max={100}
            style={{ width: '100%' }}
            value={(students[i] as any)[`p${n}_t3`] as number | undefined}
            onChange={(val) =>
              setStudents((prev) =>
                prev.map((row, idx) =>
                  idx === i
                    ? ({ ...row, [`p${n}_t3`]: typeof val === 'number' ? val : undefined } as any)
                    : row,
                ),
              )
            }
          />
        ),
      },
      {
        title: '班主任1评分',
        width: 110,
        align: 'center',
        render: (_v, _r, i) => (
          <InputNumber
            min={0}
            max={100}
            style={{ width: '100%' }}
            value={(students[i] as any)[`p${n}_h1`] as number | undefined}
            onChange={(val) =>
              setStudents((prev) =>
                prev.map((row, idx) =>
                  idx === i
                    ? ({ ...row, [`p${n}_h1`]: typeof val === 'number' ? val : undefined } as any)
                    : row,
                ),
              )
            }
          />
        ),
      },
      {
        title: '班主任2评分',
        width: 110,
        align: 'center',
        render: (_v, _r, i) => (
          <InputNumber
            min={0}
            max={100}
            style={{ width: '100%' }}
            value={(students[i] as any)[`p${n}_h2`] as number | undefined}
            onChange={(val) =>
              setStudents((prev) =>
                prev.map((row, idx) =>
                  idx === i
                    ? ({ ...row, [`p${n}_h2`]: typeof val === 'number' ? val : undefined } as any)
                    : row,
                ),
              )
            }
          />
        ),
      },
      {
        title: '平均得分',
        width: 110,
        align: 'center',
        render: (_v, _r, i) => (
          <Input
            readOnly
            value={
              avg([
                (students[i] as any)[`p${n}_t1`],
                (students[i] as any)[`p${n}_t2`],
                (students[i] as any)[`p${n}_t3`],
                (students[i] as any)[`p${n}_h1`],
                (students[i] as any)[`p${n}_h2`],
              ]) ?? '-'
            }
          />
        ),
      },
    ]

    columns.push({
      title: (
        <div style={{ padding: 4 }}>
          <div>项目{n}</div>
          <Input
            size="small"
            placeholder="项目名称"
            value={projectNames[n - 1]}
            onChange={(e) =>
              setProjectNames((prev) => prev.map((v, i) => (i === n - 1 ? e.target.value : v)))
            }
            style={{ width: 140 }}
          />
        </div>
      ),
      children: children,
    } as any)
  }

  return (
    <div style={{ padding: 24 }}>
      <Card bordered={false} style={{ background: '#f5f7fa' }}>
        <Title level={4} style={{ marginBottom: 12 }}>
          XX神殿后端XX班级压力面试成绩表
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
              <Text strong>强化人数</Text>
              <InputNumber
                min={0}
                value={stats.classSize}
                onChange={(v) => setStats((s) => ({ ...s, classSize: Number(v || 0) }))}
              />
            </Space>
          </Col>
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
              <Text strong>班主任姓名</Text>
              <Input
                value={meta.headTeacherName}
                onChange={(e) => setMeta((m) => ({ ...m, headTeacherName: e.target.value }))}
              />
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: '12px 0' }} />

        {/* 统计区 */}
        <Row gutter={[12, 8]}>
          <Col span={4}>
            <Space>
              <Text strong>压面次数</Text>
              <InputNumber
                min={1}
                max={50}
                value={stats.projectCount}
                onChange={(v) => setStats((s) => ({ ...s, projectCount: Number(v || 1) }))}
              />
            </Space>
          </Col>
          <Col span={4}>
            <Space>
              <Text strong>应压面数量</Text>
              <Input readOnly value={expectedCount} />
            </Space>
          </Col>
          <Col span={4}>
            <Space>
              <Text strong>实际压面数量</Text>
              <InputNumber
                min={0}
                value={stats.actualCount}
                onChange={(v) => setStats((s) => ({ ...s, actualCount: Number(v || 0) }))}
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
              <Text strong>压面参与率</Text>
              <Input readOnly value={`${joinRate}%`} />
            </Space>
          </Col>
          <Col span={4}>
            <Space>
              <Text strong>压面合格率</Text>
              <Input readOnly value={`${passRate}%`} />
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: '12px 0' }} />

        {/* 项目序号/名称/日期条 */}
        <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Text strong style={{ minWidth: 80 }}>
              项目序号
            </Text>
            {Array.from({ length: stats.projectCount }).map((_, i) => (
              <span key={i} style={{ display: 'inline-block', minWidth: 560, textAlign: 'center' }}>
                {i + 1}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
            <Text strong style={{ minWidth: 80 }}>
              项目名称
            </Text>
            {Array.from({ length: stats.projectCount }).map((_, i) => (
              <span key={i} style={{ display: 'inline-block', minWidth: 560, textAlign: 'center' }}>
                <Input
                  size="small"
                  value={projectNames[i]}
                  onChange={(e) =>
                    setProjectNames((prev) =>
                      prev.map((v, idx) => (idx === i ? e.target.value : v)),
                    )
                  }
                  style={{ width: 220 }}
                />
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
            <Text strong style={{ minWidth: 80 }}>
              压面日期
            </Text>
            {Array.from({ length: stats.projectCount }).map((_, i) => (
              <span key={i} style={{ display: 'inline-block', minWidth: 560, textAlign: 'center' }}>
                <Space size={6}>
                  {[0, 1, 2].map((ai) => (
                    <DatePicker
                      key={ai}
                      size="small"
                      onChange={(d: any) =>
                        setProjectDates((prev) =>
                          prev.map((arr, idx) =>
                            idx === i
                              ? arr.map((x, k) => (k === ai ? (d ? d.format('YYYY/M/D') : '') : x))
                              : arr,
                          ),
                        )
                      }
                    />
                  ))}
                </Space>
              </span>
            ))}
          </div>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* 学员压面成绩表 */}
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
          <Button onClick={clearAll}>清空</Button>
        </Space>
      </Card>
    </div>
  )
}

export default StressInterviewScores
