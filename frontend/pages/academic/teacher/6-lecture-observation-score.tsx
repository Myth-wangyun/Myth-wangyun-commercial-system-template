// 学术 -> 教员 -> 听课打分表（本地可编辑 + 持久化）
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

type ScoreRow = {
  key: string
  category: string
  item: string
  s5?: number
  s4?: number
  s3?: number
  s2?: number
  s1?: number
}

const STORAGE_KEY = 'teacher-lecture-observation-score'

const DEF: Array<{ category: string; items: string[] }> = [
  {
    category: '课堂管理',
    items: [
      '1.教员本人无迟到、早退、请假、课上接打手机等问题。',
      '2.学员迟到、早退、请假、旷课等出勤问题均进行及时妥善处理。',
      '3.学员未完成作业、抄作业等作业问题均进行及时妥善处理。',
      '4.学员看视频、玩游戏、打瞌睡、说话、接打手机等课堂问题均进行及时妥善处理。',
      '5.教员能对各类突发事件，进行及时妥善的处理。',
    ],
  },
  {
    category: '传授观念',
    items: ['6.教员能传授考勤、纪律的重要性。', '7.教员能传达积极的学习心态。'],
  },
  {
    category: '课程讲解',
    items: [
      '8.教员授课过程中熟悉所讲解的课程，上机演示流畅。',
      '9.授课重点突出，反复总结及回顾。',
      '10.授课语言清晰、简练、易懂。',
      '11.声音洪亮，语速合理，声音抑扬顿挫。',
      '12.能讲解企业实际应用，传达工作经验和项目经验。',
    ],
  },
  {
    category: '课堂互动',
    items: [
      '13.教员与学员互动、提问、交流较多。',
      '14.授课方式生动幽默，能活跃课堂气氛。',
      '15.能表扬和鼓励学员，激发学员兴趣。',
    ],
  },
  {
    category: '耐心辅导',
    items: [
      '16.教员能关注到每一名学员。',
      '17.能有效地解答学员的问题，且没有不耐烦的情绪。',
      '18.能抽出较多时间辅导学员。',
    ],
  },
  {
    category: '授课效果',
    items: ['19.学员能够理解和消化课上的内容。', '20.学员能掌握课上实验的制作思路和制作步骤。'],
  },
]

const buildRows = (): ScoreRow[] => {
  const rows: ScoreRow[] = []
  DEF.forEach((def) => {
    def.items.forEach((txt, idx) =>
      rows.push({ key: `${def.category}-${idx}`, category: def.category, item: txt }),
    )
  })
  return rows
}

const calcAvg = (r: ScoreRow) => {
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

const LectureObservationScore: React.FC = () => {
  // 听课记录
  const [record, setRecord] = useState({
    date: '',
    clazz: '',
    content: '',
    lecturer: '',
    observer: '',
  })

  const [rows, setRows] = useState<ScoreRow[]>(() => buildRows())
  const [advice, setAdvice] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const obj = JSON.parse(raw)
        if (obj.record) setRecord(obj.record)
        if (Array.isArray(obj.rows)) setRows(obj.rows)
        if (typeof obj.advice === 'string') setAdvice(obj.advice)
      }
    } catch {}
  }, [])

  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ record, rows, advice }))
    } catch {}
  }

  const clearAll = () => {
    setRecord({ date: '', clazz: '', content: '', lecturer: '', observer: '' })
    setRows(buildRows())
    setAdvice('')
  }

  const columns: ColumnsType<ScoreRow> = [
    { title: '评分类别', dataIndex: 'category', width: 120, fixed: 'left' },
    { title: '评分标准', dataIndex: 'item', width: 460, fixed: 'left' },
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

  // 分类平均与总平均
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
          听课记录表
        </Title>

        {/* 听课记录信息 */}
        <Row gutter={[12, 8]}>
          <Col span={6}>
            <Space>
              <Text strong>日期</Text>
              <DatePicker
                onChange={(d: any) =>
                  setRecord((r) => ({ ...r, date: d ? d.format('YYYY/M/D') : '' }))
                }
              />
            </Space>
          </Col>
          <Col span={6}>
            <Space>
              <Text strong>班级</Text>
              <Input
                value={record.clazz}
                onChange={(e) => setRecord((r) => ({ ...r, clazz: e.target.value }))}
              />
            </Space>
          </Col>
          <Col span={6}>
            <Space>
              <Text strong>授课内容</Text>
              <Input
                value={record.content}
                onChange={(e) => setRecord((r) => ({ ...r, content: e.target.value }))}
              />
            </Space>
          </Col>
          <Col span={6}>
            <Space>
              <Text strong>授课教员</Text>
              <Input
                value={record.lecturer}
                onChange={(e) => setRecord((r) => ({ ...r, lecturer: e.target.value }))}
              />
            </Space>
          </Col>
        </Row>
        <Row gutter={[12, 8]} style={{ marginTop: 8 }}>
          <Col span={6}>
            <Space>
              <Text strong>听课人签字</Text>
              <Input
                value={record.observer}
                onChange={(e) => setRecord((r) => ({ ...r, observer: e.target.value }))}
              />
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: '12px 0' }} />

        {/* 评分表 */}
        <Title level={5} style={{ marginBottom: 8 }}>
          听课打分表
        </Title>
        <Table<ScoreRow>
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

        {/* 意见建议 */}
        <Row gutter={[12, 8]}>
          <Col span={24}>
            <Text strong>对教员的意见和建议</Text>
            <Input.TextArea
              rows={4}
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              placeholder="请填写意见与建议"
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

export default LectureObservationScore
