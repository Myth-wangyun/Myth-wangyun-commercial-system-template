// 学术 -> 教员 -> 听课成绩表（月度按项评分，持久化）
import React, { useEffect, useMemo, useState } from 'react'
import { Card, Typography, Row, Col, Space, Button, Divider, Table, Input, InputNumber } from 'antd'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

type RowItem = {
  key: string
  category: string
  item: string
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
}

const STORAGE_KEY = 'teacher-lecture-monthly-score'

const DEF: Array<{ category: string; items: string[] }> = [
  {
    category: '教学内容',
    items: [
      '1.是否按照最新16.0课程体系的授课',
      '2.教学内容是否与16.0课件一致',
      '3.是否按照5个阶段授课、13个环节授课的流程授课',
    ],
  },
  {
    category: '教学方法',
    items: [
      '4.知识点讲解是否使用3W1H教学方法授课',
      '5.案例讲解是否使用项目教学法授课',
      '6.教师的授课是否生动幽默',
    ],
  },
  {
    category: '关注学生',
    items: [
      '7.教员与学员互动、提问、交流较多。',
      '8.能表扬和鼓励学员，激发学员兴趣。',
      '9.教员能关注到每一名学员。',
      '10.教员能有效地解答学员的问题，且没有不耐烦的情绪。',
      '11.能抽出较多时间辅导学员。',
    ],
  },
  {
    category: '课堂管理',
    items: [
      '12.教员本人无迟到、早退、请假、课上接打手机等问题。',
      '13.学员迟到、早退、请假、旷课等出勤问题均进行及时妥善处理。',
      '14.学员未完成作业、抄作业等作业问题均进行及时妥善处理。',
      '15.学员看视频、玩游戏、打瞌睡、说话、接打手机等课堂问题均进行及时妥善处理。',
      '16.教员能对各类突发事件，进行及时妥善的处理。',
    ],
  },
  {
    category: '传授观念',
    items: ['17.教员能传授考勤、纪律的重要性。', '18.教员能传授积极的学习心态。'],
  },
  {
    category: '语言表达',
    items: ['19.授课语言清晰、简练、易懂。', '20.声音洪亮，语速合理，声音抑扬顿挫。'],
  },
]

const buildRows = (): RowItem[] => {
  const rows: RowItem[] = []
  DEF.forEach((def) => {
    def.items.forEach((txt, idx) =>
      rows.push({ key: `${def.category}-${idx}`, category: def.category, item: txt }),
    )
  })
  return rows
}

const avg = (arr: (number | undefined)[]) => {
  const vals = arr.filter((v): v is number => typeof v === 'number')
  if (!vals.length) return undefined
  const s = vals.reduce((a, b) => a + b, 0)
  return Math.round((s / vals.length) * 100) / 100 // 两位小数
}

const LectureMonthlyScore: React.FC = () => {
  const [titleMeta, setTitleMeta] = useState({ title: '听课成绩表' })
  const [rows, setRows] = useState<RowItem[]>(() => buildRows())

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const obj = JSON.parse(raw)
        if (obj.titleMeta) setTitleMeta(obj.titleMeta)
        if (Array.isArray(obj.rows)) setRows(obj.rows)
      }
    } catch {}
  }, [])

  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ titleMeta, rows }))
    } catch {}
  }

  const clearAll = () => {
    setTitleMeta({ title: '听课成绩表' })
    setRows(buildRows())
  }

  const columns: ColumnsType<RowItem> = [
    { title: '评分类别', dataIndex: 'category', width: 140, fixed: 'left' },
    { title: '评分标准', dataIndex: 'item', width: 420, fixed: 'left' },
    ...Array.from({ length: 12 }).map((_, i) => ({
      title: `${i + 1}月`,
      dataIndex: `m${i + 1}`,
      width: 100,
      align: 'center' as const,
      render: (_: any, r: RowItem, rowIdx: number) => (
        <InputNumber
          min={0}
          max={100}
          style={{ width: '100%' }}
          value={(rows[rowIdx] as any)[`m${i + 1}`] as number | undefined}
          onChange={(val) =>
            setRows((prev) =>
              prev.map((rr, idx) =>
                idx === rowIdx
                  ? ({ ...rr, [`m${i + 1}`]: typeof val === 'number' ? val : undefined } as any)
                  : rr,
              ),
            )
          }
        />
      ),
    })),
    {
      title: '平均分',
      key: 'avg',
      width: 110,
      align: 'center',
      render: (_: any, r: RowItem) => (
        <Input
          readOnly
          value={
            avg([r.m1, r.m2, r.m3, r.m4, r.m5, r.m6, r.m7, r.m8, r.m9, r.m10, r.m11, r.m12]) ?? '-'
          }
        />
      ),
    },
  ]

  const totalRow = useMemo(() => {
    const monthAvgs: (number | undefined)[] = []
    for (let i = 1; i <= 12; i++) {
      const vals = rows.map((r) => (r as any)[`m${i}`] as number | undefined)
      monthAvgs.push(avg(vals))
    }
    const overall = avg(monthAvgs)
    return { monthAvgs, overall }
  }, [rows])

  return (
    <div style={{ padding: 24 }}>
      <Card bordered={false} style={{ background: '#f5f7fa' }}>
        <Row align="middle" justify="space-between" style={{ marginBottom: 8 }}>
          <Col>
            <Title level={4} style={{ marginBottom: 0 }}>
              {titleMeta.title}
            </Title>
          </Col>
          <Col>
            <Space>
              <Button type="primary" onClick={persist}>
                保存（本地）
              </Button>
              <Button onClick={clearAll}>清空</Button>
            </Space>
          </Col>
        </Row>

        <Table<RowItem>
          bordered
          size="small"
          columns={columns}
          dataSource={rows}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />

        {/* 总分行展示 */}
        <div style={{ marginTop: 10, overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Text strong style={{ minWidth: 140 }}>
              总分
            </Text>
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} style={{ display: 'inline-block', minWidth: 100, textAlign: 'center' }}>
                {totalRow.monthAvgs[i] ?? '-'}
              </span>
            ))}
            <span style={{ display: 'inline-block', minWidth: 110, textAlign: 'center' }}>
              {totalRow.overall ?? '-'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default LectureMonthlyScore
