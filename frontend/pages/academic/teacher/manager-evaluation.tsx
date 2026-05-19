// 最高议事厅智慧司学术经理功能评价表（032 明细评分表）
import React, { useEffect, useMemo, useState } from 'react'
import { App,
  Card,
  Table,
  Typography,
  Space,
  Button,
  Tag,
  InputNumber,
  Modal,
  Form,
  Input,
  DatePicker,
  Row,
  Col,
} from 'antd'
import { TeamOutlined, SettingOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import CampusSelector from '@/components/common/CampusSelector'

const { Title, Text } = Typography

type Category = '价值观' | '业务能力' | '团队建设' | '管理能力'

interface EvaluationRow {
  id: string
  category: Category
  order: number
  item: string
  requirement: string
  full: number // 满分 4
  s1: number
  s2: number
  s3: number
  s4: number
  s5: number
  s6: number // 六名评分人
}

interface PersistData {
  month: string // YYYY-MM
  evaluators: string[] // 六名
  rows: EvaluationRow[]
}

const defaultEvaluators = ['姓名1', '姓名2', '姓名3', '姓名4', '姓名5', '姓名6']

const buildDefaultRows = (): EvaluationRow[] => {
  const mk = (
    id: number,
    category: Category,
    item: string,
    requirement: string,
  ): EvaluationRow => ({
    id: String(id),
    category,
    order: id,
    item,
    requirement,
    full: 4,
    s1: 0,
    s2: 0,
    s3: 0,
    s4: 0,
    s5: 0,
    s6: 0,
  })

  return [
    // 价值观 5
    mk(1, '价值观', '责任心', '对待学生、对待工作有责任心。'),
    mk(2, '价值观', '执行力', '能认真执行上级领导的各项安排。'),
    mk(3, '价值观', '任劳任怨', '不辞辛苦，任劳任怨。'),
    mk(4, '价值观', '团队精神', '有大局观、个人利益服从整体利益。'),
    mk(5, '价值观', '职业道德', '做人难则，职业道德。'),
    // 业务能力 9
    mk(6, '业务能力', '技术能力', '个人技术水平。'),
    mk(7, '业务能力', '创新能力', '有创造性思维。'),
    mk(8, '业务能力', '教学研发', '网络调查、开发大纲、课件编写能力。'),
    mk(9, '业务能力', '教学实施', '授课、辅导。'),
    mk(10, '业务能力', '教学测评', '考试合格率、学员满意度。'),
    mk(11, '业务能力', '就业情况', '就业率和就业薪资高。'),
    mk(12, '业务能力', '口碑', '口碑提升和收入高。'),
    mk(13, '业务能力', '新生维稳', '新生流失较少。'),
    mk(14, '业务能力', '招聘能力', '能自己招聘所缺岗位。'),
    // 团队建设 7
    mk(15, '团队建设', '业务培养能力', '能培养员工的授课和课堂管理能力。'),
    mk(16, '团队建设', '价值观培养能力', '能培养员工的正确价值观。'),
    mk(17, '团队建设', '员工访谈能力', '能和各种类型的员工访谈。'),
    mk(18, '团队建设', '考核能力', '清楚工作重点，考核目标明确。'),
    mk(19, '团队建设', '评价能力', '能正确评价员工，优胜劣汰。'),
    mk(20, '团队建设', '工作规划能力', '工作的时间和内容能够合理安排。'),
    mk(21, '团队建设', '威望及亲和力', '有威望和亲和力，员工愿意服从。'),
    // 管理能力 4
    mk(22, '管理能力', '示范能力', '能以身作则，起示范作用。'),
    mk(23, '管理能力', '领导能力', '能够领导团队完成任务。'),
    mk(24, '管理能力', '工作方法', '对各种问题，能找到合适的工作方法。'),
    mk(25, '管理能力', '工作控制能力', '能监督员工按时完成任务。'),
  ]
}

const ManagerEvaluationPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [month, setMonth] = useState<string>(dayjs().format('YYYY-MM'))
  const [evaluators, setEvaluators] = useState<string[]>(defaultEvaluators)
  const [rows, setRows] = useState<EvaluationRow[]>(buildDefaultRows())
  const [settingOpen, setSettingOpen] = useState(false)
  const [form] = Form.useForm()

  const storageKey = (campus?: string | null, m?: string) =>
    `managerFunction_${campus || '主神殿'}__${m || month}`

  // 加载
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(currentCampus, month))
      if (raw) {
        const parsed = JSON.parse(raw) as PersistData
        setEvaluators(parsed.evaluators?.length ? parsed.evaluators : defaultEvaluators)
        setRows(parsed.rows?.length ? parsed.rows : buildDefaultRows())
      } else {
        setEvaluators(defaultEvaluators)
        setRows(buildDefaultRows())
      }
    } catch {
      setEvaluators(defaultEvaluators)
      setRows(buildDefaultRows())
    }
  }, [currentCampus, month])

  // 保存
  useEffect(() => {
    const data: PersistData = { month, evaluators, rows }
    try {
      localStorage.setItem(storageKey(currentCampus, month), JSON.stringify(data))
    } catch {}
  }, [evaluators, rows, month, currentCampus])

  const onScoreChange = (id: string, key: keyof EvaluationRow, value: number | null) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? ({ ...r, [key]: Number(value || 0) } as EvaluationRow) : r)),
    )
  }

  const totals = useMemo(() => {
    const sum = (k: keyof EvaluationRow) => rows.reduce((a, b) => a + (b[k] as number), 0)
    return {
      full: rows.reduce((a, b) => a + b.full, 0),
      s1: sum('s1'),
      s2: sum('s2'),
      s3: sum('s3'),
      s4: sum('s4'),
      s5: sum('s5'),
      s6: sum('s6'),
    }
  }, [rows])

  const columns: ColumnsType<EvaluationRow> = [
    { title: '类别', dataIndex: 'category', key: 'category', width: 90, fixed: 'left' },
    { title: '序号', dataIndex: 'order', key: 'order', width: 60, align: 'center' },
    { title: '功能项目', dataIndex: 'item', key: 'item', width: 140 },
    { title: '详细要求', dataIndex: 'requirement', key: 'requirement', width: 280 },
    { title: '满分', dataIndex: 'full', key: 'full', width: 70, align: 'right' },
    ...([1, 2, 3, 4, 5, 6] as const).map((idx) => ({
      title: evaluators[idx - 1] || `姓名${idx}`,
      dataIndex: `s${idx}` as const,
      key: `s${idx}`,
      width: 90,
      align: 'right' as const,
      render: (_: any, record: EvaluationRow) => (
        <InputNumber
          min={0}
          max={4}
          step={1}
          value={record[`s${idx}` as keyof EvaluationRow] as number}
          onChange={(v) => onScoreChange(record.id, `s${idx}` as keyof EvaluationRow, v)}
          style={{ width: '100%' }}
        />
      ),
    })),
  ]

  const openSetting = () => {
    form.setFieldsValue({
      evaluators: evaluators.length ? evaluators : defaultEvaluators,
      month: dayjs(month),
    })
    setSettingOpen(true)
  }

  const handleSettingOk = async () => {
    const values = await form.validateFields()
    const names: string[] = (values.evaluators || [])
      .map((x: string) => x?.trim() || '')
      .slice(0, 6)
    while (names.length < 6) names.push(`姓名${names.length + 1}`)
    setEvaluators(names)
    setMonth(values.month ? values.month.format('YYYY-MM') : month)
    setSettingOpen(false)
    message.success('设置已保存')
  }

  const exportCsv = () => {
    const headers = ['类别', '序号', '功能项目', '详细要求', '满分', ...evaluators]
    const body = rows.map((r) => [
      r.category,
      r.order,
      r.item,
      r.requirement,
      r.full,
      r.s1,
      r.s2,
      r.s3,
      r.s4,
      r.s5,
      r.s6,
    ])
    const summary = [
      '合计',
      '',
      '',
      '',
      totals.full,
      totals.s1,
      totals.s2,
      totals.s3,
      totals.s4,
      totals.s5,
      totals.s6,
    ]
    const csv = [headers, ...body, summary]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `学术经理功能评价表_${month}.csv`
    a.click()
  }

  return (
    <div style={{ padding: 24 }}>
      <div className="mb-4">
        <Title level={2}>
          <TeamOutlined className="me-2" />
          最高议事厅智慧司学术经理功能评价表
        </Title>
        <Text type="secondary">按条目和评分人维度填写分数，满分4分，共25项，总分100分</Text>
      </div>

      {/* 神殿与月份设置 */}
      <div
        className="mb-3"
        style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <CampusSelector />
        <Space>
          <span>评价月份</span>
          <DatePicker
            picker="month"
            value={dayjs(month)}
            onChange={(d) => setMonth(d ? d.format('YYYY-MM') : month)}
          />
        </Space>
        <Space>
          <Button icon={<SettingOutlined />} onClick={openSetting}>
            设置评分人
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => setRows(buildDefaultRows())}>
            重置分数
          </Button>
          <Button icon={<DownloadOutlined />} onClick={exportCsv}>
            导出CSV
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={rows}
          rowKey="id"
          pagination={false}
          bordered
          scroll={{ x: 1400, y: 560 }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
              <Table.Summary.Cell index={1} colSpan={3}></Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right">
                <Tag color="blue">{totals.full}</Tag>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right">
                <Tag color="geekblue">{totals.s1}</Tag>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} align="right">
                <Tag color="geekblue">{totals.s2}</Tag>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7} align="right">
                <Tag color="geekblue">{totals.s3}</Tag>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8} align="right">
                <Tag color="geekblue">{totals.s4}</Tag>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={9} align="right">
                <Tag color="geekblue">{totals.s5}</Tag>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={10} align="right">
                <Tag color="geekblue">{totals.s6}</Tag>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>

      {/* 设置评分人 */}
      <Modal
        title="设置评分人与月份"
        open={settingOpen}
        onOk={handleSettingOk}
        onCancel={() => setSettingOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" initialValues={{ evaluators, month: dayjs(month) }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="month"
                label="评价月份"
                rules={[{ required: true, message: '请选择月份' }]}
              >
                <DatePicker picker="month" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Col span={12} key={i}>
                <Form.Item name={['evaluators', i]} label={`评分人${i + 1}`}>
                  <Input placeholder={`姓名${i + 1}`} />
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default ManagerEvaluationPage
