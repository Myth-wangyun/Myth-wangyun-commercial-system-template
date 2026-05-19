// 智慧司员工功能分析表（9名评分人）
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
  Segmented,
} from 'antd'
import { TeamOutlined, SettingOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import CampusSelector from '@/components/common/CampusSelector'

const { Title, Text } = Typography

type Category = '核心业务能力' | '一般业务能力' | '价值观'

interface RowItem {
  id: string
  order: number
  category: Category
  item: string
  requirement: string
  full: number
  s1: number
  s2: number
  s3: number
  s4: number
  s5: number
  s6: number
  s7: number
  s8: number
  s9: number
}

interface PersistData {
  month: string
  evaluators: string[] // 9 人
  rows: RowItem[]
}

const defaultNames = Array.from({ length: 9 }).map((_, i) => `姓名${i + 1}`)

const buildDefaultRows = (): RowItem[] => {
  const mk = (
    order: number,
    category: Category,
    item: string,
    requirement: string,
    full: number,
  ): RowItem => ({
    id: String(order),
    order,
    category,
    item,
    requirement,
    full,
    s1: 0,
    s2: 0,
    s3: 0,
    s4: 0,
    s5: 0,
    s6: 0,
    s7: 0,
    s8: 0,
    s9: 0,
  })
  return [
    mk(1, '核心业务能力', '学员就业', '就业率和就业薪资高。', 15),
    mk(2, '核心业务能力', '口碑招生', '口碑招生和收入高。', 10),
    mk(3, '核心业务能力', '新生维稳', '新生流失较少。', 10),
    mk(4, '一般业务能力', '技术能力', '个人技术水平', 10),
    mk(5, '一般业务能力', '教学研发', '网络调查、开发大纲、课件编写能力。', 5),
    mk(6, '一般业务能力', '教学实施', '授课能力、积极辅导。', 10),
    mk(7, '一般业务能力', '教学测评', '考试合格率、学员满意度等。', 10),
    mk(8, '价值观', '责任心', '对待学生，对待工作有责任心。', 5),
    mk(9, '价值观', '执行力', '能认真执行上级领导的各项安排。', 5),
    mk(10, '价值观', '任劳任怨', '不辞辛苦，任劳任怨。', 5),
    mk(11, '价值观', '团队精神', '有大局观，个人利益服从集体利益。', 5),
    mk(12, '价值观', '职业行为', '工装、出勤、自律。', 5),
    mk(13, '价值观', '沟通能力', '对上级、对同事、对学生', 5),
  ]
}

const StaffFunctionAnalysisPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [month, setMonth] = useState<string>(dayjs().format('YYYY-MM'))
  const [names, setNames] = useState<string[]>(defaultNames)
  const [rows, setRows] = useState<RowItem[]>(buildDefaultRows())
  const [settingOpen, setSettingOpen] = useState(false)
  const [form] = Form.useForm()
  const [entryOpen, setEntryOpen] = useState(false)
  const [entryIdx, setEntryIdx] = useState<number>(1)
  const [entryForm] = Form.useForm()
  const [viewMode, setViewMode] = useState<'byColumn' | 'transposed'>('byColumn')

  const storageKey = (campus?: string | null, m?: string) =>
    `staffFunction_${campus || '主神殿'}__${m || month}`

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(currentCampus, month))
      if (raw) {
        const parsed = JSON.parse(raw) as PersistData
        setNames(parsed.evaluators?.length ? parsed.evaluators.slice(0, 9) : defaultNames)
        setRows(parsed.rows?.length ? parsed.rows : buildDefaultRows())
      } else {
        setNames(defaultNames)
        setRows(buildDefaultRows())
      }
    } catch {
      setNames(defaultNames)
      setRows(buildDefaultRows())
    }
  }, [currentCampus, month])

  useEffect(() => {
    const data: PersistData = { month, evaluators: names, rows }
    try {
      localStorage.setItem(storageKey(currentCampus, month), JSON.stringify(data))
    } catch {}
  }, [names, rows, month, currentCampus])

  const onScoreChange = (id: string, key: keyof RowItem, v: number | null) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? ({ ...r, [key]: Number(v || 0) } as RowItem) : r)),
    )
  }

  const totals = useMemo(() => {
    const sum = (k: keyof RowItem) => rows.reduce((a, b) => a + (b[k] as number), 0)
    return {
      full: rows.reduce((a, b) => a + b.full, 0),
      s1: sum('s1'),
      s2: sum('s2'),
      s3: sum('s3'),
      s4: sum('s4'),
      s5: sum('s5'),
      s6: sum('s6'),
      s7: sum('s7'),
      s8: sum('s8'),
      s9: sum('s9'),
    }
  }, [rows])

  // 转置视图数据（人员为行）
  const transposedDefs = useMemo(
    () => rows.map((r) => ({ key: r.id, title: `${r.item}(${r.full})` })),
    [rows],
  )
  const transposedRows = useMemo(() => {
    return Array.from({ length: 9 }).map((_, idx) => {
      const personIndex = (idx + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
      const rec: any = { id: String(personIndex), name: names[idx] || `姓名${personIndex}` }
      let total = 0
      rows.forEach((r) => {
        const v = (r as any)[`s${personIndex}`] as number | undefined
        rec[r.id] = v ?? 0
        total += Number(v || 0)
      })
      rec.total = total
      return rec
    })
  }, [rows, names])
  const transposedColumns = useMemo(() => {
    const cols: any[] = [
      { title: '序号', dataIndex: 'id', key: 'id', width: 60, align: 'center' },
      { title: '姓名', dataIndex: 'name', key: 'name', width: 120 },
    ]
    transposedDefs.forEach((def) =>
      cols.push({ title: def.title, dataIndex: def.key, key: def.key, width: 120, align: 'right' }),
    )
    cols.push({
      title: '总分',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      align: 'right',
      render: (v: number) => <Tag color={v >= 90 ? 'green' : v >= 80 ? 'orange' : 'red'}>{v}</Tag>,
    })
    return cols
  }, [transposedDefs])

  // 录入员工评分（模态框）相关
  const findDefaultColumn = (): number => {
    const idx = names.findIndex((n, i) => n === `姓名${i + 1}` || !n)
    return idx === -1 ? 1 : idx + 1
  }

  const getColumnScores = (idx: number): Record<string, number> => {
    const map: Record<string, number> = {}
    rows.forEach((r) => {
      map[r.id] = (r as any)[`s${idx}`] as number
    })
    return map
  }

  const openEntry = (idx?: number) => {
    const useIdx = idx || findDefaultColumn()
    setEntryIdx(useIdx)
    entryForm.setFieldsValue({
      employeeName: names[useIdx - 1] || `姓名${useIdx}`,
      column: useIdx,
      scores: getColumnScores(useIdx),
    })
    setEntryOpen(true)
  }

  const onEntryColumnChange = (val: number) => {
    setEntryIdx(val)
    entryForm.setFieldsValue({
      employeeName: names[val - 1] || `姓名${val}`,
      scores: getColumnScores(val),
    })
  }

  const handleEntryOk = async () => {
    const values = await entryForm.validateFields()
    const idx: number = values.column
    const empName: string = values.employeeName?.trim()
    const scoreMap: Record<string, number> = values.scores || {}

    // 更新姓名
    setNames((prev) => {
      const next = [...prev]
      next[idx - 1] = empName || `姓名${idx}`
      return next
    })

    // 更新分数列
    setRows((prev) =>
      prev.map(
        (r) =>
          ({
            ...r,
            [`s${idx}`]: Math.min(Math.max(Number(scoreMap[r.id] || 0), 0), r.full),
          }) as RowItem,
      ),
    )

    setEntryOpen(false)
    message.success('录入成功')
  }

  const columns: ColumnsType<RowItem> = [
    { title: '序号', dataIndex: 'order', key: 'order', width: 60, align: 'center', fixed: 'left' },
    { title: '类别', dataIndex: 'category', key: 'category', width: 110 },
    { title: '功能项目', dataIndex: 'item', key: 'item', width: 140 },
    { title: '详细要求', dataIndex: 'requirement', key: 'requirement', width: 280 },
    { title: '满分', dataIndex: 'full', key: 'full', width: 70, align: 'right' },
    ...([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((idx) => ({
      title: names[idx - 1] || `姓名${idx}`,
      dataIndex: `s${idx}` as const,
      key: `s${idx}`,
      width: 90,
      align: 'right' as const,
      render: (_: any, record: RowItem) => (
        <InputNumber
          min={0}
          max={record.full}
          step={1}
          value={record[`s${idx}` as keyof RowItem] as number}
          onChange={(v) => onScoreChange(record.id, `s${idx}` as keyof RowItem, v)}
          style={{ width: '100%' }}
        />
      ),
    })),
  ]

  const openSetting = () => {
    form.setFieldsValue({ evaluators: names, month: dayjs(month) })
    setSettingOpen(true)
  }

  const handleSettingOk = async () => {
    const values = await form.validateFields()
    const list: string[] = (values.evaluators || []).map((x: string) => x?.trim() || '').slice(0, 9)
    while (list.length < 9) list.push(`姓名${list.length + 1}`)
    setNames(list)
    setMonth(values.month ? values.month.format('YYYY-MM') : month)
    setSettingOpen(false)
    message.success('设置已保存')
  }

  const exportCsv = () => {
    const headers = ['序号', '类别', '功能项目', '详细要求', '满分', ...names]
    const body = rows.map((r) => [
      r.order,
      r.category,
      r.item,
      r.requirement,
      r.full,
      r.s1,
      r.s2,
      r.s3,
      r.s4,
      r.s5,
      r.s6,
      r.s7,
      r.s8,
      r.s9,
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
      totals.s7,
      totals.s8,
      totals.s9,
    ]
    const csv = [headers, ...body, summary]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `员工功能分析表_${month}.csv`
    a.click()
  }

  return (
    <div style={{ padding: 24 }}>
      <div className="mb-4">
        <Title level={2}>
          <TeamOutlined className="me-2" />
          某神殿智慧司员工功能分析表
        </Title>
        <Text type="secondary">9名评分人，满分100，按神殿+月份独立保存</Text>
      </div>

      <div
        className="mb-3"
        style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <CampusSelector />
        <Space>
          <span>统计月份</span>
          <DatePicker
            picker="month"
            value={dayjs(month)}
            onChange={(d) => setMonth(d ? d.format('YYYY-MM') : month)}
          />
        </Space>
        <Space>
          <Segmented
            options={[
              { label: '按人员列', value: 'byColumn' },
              { label: '按人员行(转置)', value: 'transposed' },
            ]}
            value={viewMode}
            onChange={(v) => setViewMode(v as any)}
          />
          <Button icon={<SettingOutlined />} onClick={openSetting}>
            设置评分人
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => setRows(buildDefaultRows())}>
            重置分数
          </Button>
          <Button icon={<DownloadOutlined />} onClick={exportCsv}>
            导出CSV
          </Button>
          <Button type="primary" onClick={() => openEntry()}>
            录入员工评分
          </Button>
        </Space>
      </div>

      {viewMode === 'byColumn' ? (
        <Card>
          <Table
            columns={columns}
            dataSource={rows}
            rowKey="id"
            pagination={false}
            bordered
            scroll={{ x: 1600, y: 520 }}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
                <Table.Summary.Cell index={1}></Table.Summary.Cell>
                <Table.Summary.Cell index={2}></Table.Summary.Cell>
                <Table.Summary.Cell index={3}></Table.Summary.Cell>
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
                <Table.Summary.Cell index={11} align="right">
                  <Tag color="geekblue">{totals.s7}</Tag>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={12} align="right">
                  <Tag color="geekblue">{totals.s8}</Tag>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={13} align="right">
                  <Tag color="geekblue">{totals.s9}</Tag>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </Card>
      ) : (
        <Card>
          <Table
            columns={transposedColumns as any}
            dataSource={transposedRows as any}
            rowKey="id"
            pagination={false}
            bordered
            scroll={{ x: 1600, y: 520 }}
          />
        </Card>
      )}

      <Modal
        title="设置评分人与月份"
        open={settingOpen}
        onOk={handleSettingOk}
        onCancel={() => setSettingOpen(false)}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ evaluators: names, month: dayjs(month) }}
        >
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="month"
                label="统计月份"
                rules={[{ required: true, message: '请选择月份' }]}
              >
                <DatePicker picker="month" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            {Array.from({ length: 9 }).map((_, i) => (
              <Col span={12} key={i}>
                <Form.Item name={['evaluators', i]} label={`姓名${i + 1}`}>
                  <Input placeholder={`姓名${i + 1}`} />
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Form>
      </Modal>

      {/* 录入员工评分 */}
      <Modal
        title="录入员工评分"
        open={entryOpen}
        onOk={handleEntryOk}
        onCancel={() => setEntryOpen(false)}
        width={800}
        destroyOnHidden
      >
        <Form form={entryForm} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="employeeName"
                label="员工姓名"
                rules={[{ required: true, message: '请输入员工姓名' }]}
              >
                <Input placeholder="请输入员工姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="column"
                label="填写到列"
                rules={[{ required: true, message: '请选择列位' }]}
              >
                <InputNumber
                  min={1}
                  max={9}
                  precision={0}
                  style={{ width: '100%' }}
                  onChange={(v) => onEntryColumnChange(Number(v || 1))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            {rows.map((r) => (
              <Col span={12} key={r.id}>
                <Form.Item
                  name={['scores', r.id]}
                  label={`${r.category} - ${r.item}（满分${r.full}）`}
                  rules={[{ type: 'number', min: 0, max: r.full }]}
                >
                  <InputNumber min={0} max={r.full} step={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default StaffFunctionAnalysisPage
