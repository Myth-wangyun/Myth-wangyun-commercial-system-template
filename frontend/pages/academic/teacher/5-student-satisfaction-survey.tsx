// 学术 -> 教员 -> 学员对教员满意度调查表（本地可编辑 + 持久化）
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

type SurveyRow = {
  key: string
  category: string
  item: string
  s5?: number // 5分人数
  s4?: number
  s3?: number
  s2?: number
  s1?: number
}

const STORAGE_KEY = 'teacher-student-satisfaction-survey'

const DEF: Array<{ category: string; items: string[] }> = [
  {
    category: '课堂管理',
    items: [
      '1.教员本人没有迟到、早退、接打电话现象。',
      '2.对迟到、早退、请假、旷课等出勤问题均进行处理。',
      '3.违反课堂纪律（看视频、玩游戏、睡觉、说话、接打手机等）能及时处理。',
      '4.未完成作业、抄作业等作业问题均进行及时处理。',
    ],
  },
  {
    category: '内容讲解',
    items: [
      '5.传达积极学习心态，鼓励学员认真学习，讲述正确学习方法。',
      '6.授课熟练，上机演示流畅。',
      '7.重点突出，反复总结及回顾。',
      '8.授课语言清晰、简练、易懂。',
      '9.声音洪亮，语速合理，抑扬顿挫。',
      '10.能讲解企业实际应用，传达工作经验和项目经验。',
    ],
  },
  {
    category: '课堂互动',
    items: [
      '11.授课期间与学员互动、提问、交流多。',
      '12.授课方式生动幽默，能活跃课堂气氛。',
      '13.授课过程中表扬和鼓励学员，激发积极性。',
    ],
  },
  {
    category: '耐心辅导',
    items: [
      '14.能有效解答学员问题。',
      '15.态度友好热心，无不耐烦情绪。',
      '16.对学员作业进行细致点评。',
      '17.练习课能抽出较多时间指导学员。',
    ],
  },
  {
    category: '授课效果',
    items: [
      '18.学员能够理解和消化课上内容。',
      '19.掌握实验制作思路与步骤。',
      '20.能独立完成课上/课下实验作业。',
    ],
  },
]

const buildRows = (): SurveyRow[] => {
  const rows: SurveyRow[] = []
  DEF.forEach((def) => {
    def.items.forEach((txt, idx) => {
      rows.push({ key: `${def.category}-${idx}`, category: def.category, item: txt })
    })
  })
  return rows
}

const calcAvg = (r: SurveyRow) => {
  const n5 = r.s5 || 0,
    n4 = r.s4 || 0,
    n3 = r.s3 || 0,
    n2 = r.s2 || 0,
    n1 = r.s1 || 0
  const total = n5 + n4 + n3 + n2 + n1
  if (!total) return undefined
  const score = 5 * n5 + 4 * n4 + 3 * n3 + 2 * n2 + 1 * n1
  return Math.round((score / total) * 10) / 10
}

const SatisfactionSurvey: React.FC = () => {
  const [meta, setMeta] = useState({
    surveyDate: '',
    className: '',
    courseName: '',
    teacherName: '',
  })
  const [rows, setRows] = useState<SurveyRow[]>(() => buildRows())
  const [pros, setPros] = useState('')
  const [advice, setAdvice] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const obj = JSON.parse(raw)
        if (obj.meta) setMeta(obj.meta)
        if (Array.isArray(obj.rows)) setRows(obj.rows)
        if (typeof obj.pros === 'string') setPros(obj.pros)
        if (typeof obj.advice === 'string') setAdvice(obj.advice)
      }
    } catch {}
  }, [])

  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ meta, rows, pros, advice }))
    } catch {}
  }

  const clearAll = () => {
    setMeta({ surveyDate: '', className: '', courseName: '', teacherName: '' })
    setRows(buildRows())
    setPros('')
    setAdvice('')
  }

  const columns: ColumnsType<SurveyRow> = [
    { title: '评分类别', dataIndex: 'category', width: 120, fixed: 'left' },
    { title: '评分标准', dataIndex: 'item', width: 420, fixed: 'left' },
    {
      title: '5分',
      dataIndex: 's5',
      align: 'center',
      width: 90,
      render: (_v, _r, i) => (
        <InputNumber
          min={0}
          style={{ width: '100%' }}
          value={rows[i].s5 as number | undefined}
          onChange={(val) =>
            setRows((prev) =>
              prev.map((row, idx) => (idx === i ? { ...row, s5: Number(val || 0) } : row)),
            )
          }
        />
      ),
    },
    {
      title: '4分',
      dataIndex: 's4',
      align: 'center',
      width: 90,
      render: (_v, _r, i) => (
        <InputNumber
          min={0}
          style={{ width: '100%' }}
          value={rows[i].s4 as number | undefined}
          onChange={(val) =>
            setRows((prev) =>
              prev.map((row, idx) => (idx === i ? { ...row, s4: Number(val || 0) } : row)),
            )
          }
        />
      ),
    },
    {
      title: '3分',
      dataIndex: 's3',
      align: 'center',
      width: 90,
      render: (_v, _r, i) => (
        <InputNumber
          min={0}
          style={{ width: '100%' }}
          value={rows[i].s3 as number | undefined}
          onChange={(val) =>
            setRows((prev) =>
              prev.map((row, idx) => (idx === i ? { ...row, s3: Number(val || 0) } : row)),
            )
          }
        />
      ),
    },
    {
      title: '2分',
      dataIndex: 's2',
      align: 'center',
      width: 90,
      render: (_v, _r, i) => (
        <InputNumber
          min={0}
          style={{ width: '100%' }}
          value={rows[i].s2 as number | undefined}
          onChange={(val) =>
            setRows((prev) =>
              prev.map((row, idx) => (idx === i ? { ...row, s2: Number(val || 0) } : row)),
            )
          }
        />
      ),
    },
    {
      title: '1分',
      dataIndex: 's1',
      align: 'center',
      width: 90,
      render: (_v, _r, i) => (
        <InputNumber
          min={0}
          style={{ width: '100%' }}
          value={rows[i].s1 as number | undefined}
          onChange={(val) =>
            setRows((prev) =>
              prev.map((row, idx) => (idx === i ? { ...row, s1: Number(val || 0) } : row)),
            )
          }
        />
      ),
    },
    {
      title: '合计',
      key: 'sum',
      align: 'center',
      width: 90,
      render: (_v, r) => (
        <Input
          readOnly
          value={(r.s5 || 0) + (r.s4 || 0) + (r.s3 || 0) + (r.s2 || 0) + (r.s1 || 0)}
        />
      ),
    },
    {
      title: '平均分',
      key: 'avg',
      align: 'center',
      width: 100,
      render: (_v, r) => <Input readOnly value={calcAvg(r) ?? '-'} />,
    },
  ]

  // 分类与总平均
  const categoryStats = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>()
    rows.forEach((r) => {
      const v = calcAvg(r)
      if (typeof v === 'number') {
        const obj = map.get(r.category) || { sum: 0, count: 0 }
        obj.sum += v
        obj.count += 1
        map.set(r.category, obj)
      }
    })
    const list = Array.from(map.entries()).map(([k, { sum, count }]) => ({
      category: k,
      avg: count ? Math.round((sum / count) * 10) / 10 : undefined,
    }))
    const overall = list.length
      ? Math.round((list.reduce((a, b) => a + (b.avg || 0), 0) / list.length) * 10) / 10
      : undefined
    return { list, overall }
  }, [rows])

  return (
    <div style={{ padding: 24 }}>
      <Card bordered={false} style={{ background: '#f5f7fa' }}>
        <Title level={4} style={{ marginBottom: 12 }}>
          学员对教员满意度调查表
        </Title>

        {/* 顶部信息 */}
        <Row gutter={[12, 8]}>
          <Col span={6}>
            <Space>
              <Text strong>调查时间</Text>
              <DatePicker
                onChange={(d: any) =>
                  setMeta((m) => ({ ...m, surveyDate: d ? d.format('YYYY/M/D') : '' }))
                }
              />
            </Space>
          </Col>
          <Col span={6}>
            <Space>
              <Text strong>调查班级</Text>
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

        <Table<SurveyRow>
          bordered
          size="small"
          columns={columns}
          dataSource={rows}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />

        {/* 分类平均与总平均 */}
        <div style={{ marginTop: 8, overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Text strong style={{ minWidth: 100 }}>
              分类平均
            </Text>
            {categoryStats.list.map((c) => (
              <span
                key={c.category}
                style={{ display: 'inline-block', minWidth: 120, textAlign: 'center' }}
              >
                {c.category}: {c.avg ?? '-'}
              </span>
            ))}
            <span style={{ display: 'inline-block', minWidth: 120, textAlign: 'center' }}>
              总平均: {categoryStats.overall ?? '-'}
            </span>
          </div>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* 文字反馈 */}
        <Row gutter={[12, 8]}>
          <Col span={24}>
            <Text strong>教员的优点</Text>
            <Input.TextArea
              rows={3}
              value={pros}
              onChange={(e) => setPros(e.target.value)}
              placeholder="请填写学员对教员的优点反馈"
            />
          </Col>
        </Row>
        <Row gutter={[12, 8]} style={{ marginTop: 8 }}>
          <Col span={24}>
            <Text strong>对教员的意见和建议</Text>
            <Input.TextArea
              rows={4}
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              placeholder="请填写改进意见与建议"
            />
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

export default SatisfactionSurvey
