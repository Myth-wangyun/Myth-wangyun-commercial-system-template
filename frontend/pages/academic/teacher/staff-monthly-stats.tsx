// 智慧司员工逐月统计表（月份 × 人 × 业绩指标）
import React, { useEffect, useMemo, useState } from 'react'
import { App,
  Card,
  Table,
  Typography,
  Space,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Row,
  Col,
  Popconfirm,
  Select,
} from 'antd'
import {
  PlusOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import CampusSelector from '@/components/common/CampusSelector'
import { useCampusStore } from '@/stores/campusStore'

const { Title } = Typography

interface MonthlyStatRow {
  id: string
  month: number // 1..12
  staffName: string
  assignmentRate?: number
  workPassRate?: number
  examPassRate?: number
  projectPassRate?: number
  satisfaction?: number
  discipline?: number
  employmentRate?: number
  employmentSalary?: number
  reputationRegistrations?: number
  reputationRevenue?: number
  newStudents?: number
  refunds?: number
}

const exportCsv = (filename: string, headers: string[], rows: any[][]) => {
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c ?? ''}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${filename}.csv`
  a.click()
}

const StaffMonthlyStatsPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [rows, setRows] = useState<MonthlyStatRow[]>([])
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()
  const [editing, setEditing] = useState<MonthlyStatRow | null>(null)
  const [filterMonth, setFilterMonth] = useState<number | undefined>(undefined)

  const key = (c?: string | null) => `staff_monthly_stats_${c || '主神殿'}`
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key(currentCampus))
      setRows(raw ? JSON.parse(raw) : [])
    } catch {
      setRows([])
    }
  }, [currentCampus])
  useEffect(() => {
    try {
      localStorage.setItem(key(currentCampus), JSON.stringify(rows))
    } catch {}
  }, [rows, currentCampus])

  const data = useMemo(
    () => rows.filter((r) => (filterMonth ? r.month === filterMonth : true)),
    [rows, filterMonth],
  )

  const columns: ColumnsType<MonthlyStatRow> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      sorter: (a, b) => a.month - b.month,
    },
    { title: '教员姓名', dataIndex: 'staffName', key: 'staffName', width: 120 },
    {
      title: '作业提交率',
      dataIndex: 'assignmentRate',
      key: 'assignmentRate',
      width: 110,
      align: 'right',
    },
    {
      title: '作业合格率',
      dataIndex: 'workPassRate',
      key: 'workPassRate',
      width: 110,
      align: 'right',
    },
    {
      title: '考试合格率',
      dataIndex: 'examPassRate',
      key: 'examPassRate',
      width: 110,
      align: 'right',
    },
    {
      title: '项目合格率',
      dataIndex: 'projectPassRate',
      key: 'projectPassRate',
      width: 110,
      align: 'right',
    },
    {
      title: '学员满意度',
      dataIndex: 'satisfaction',
      key: 'satisfaction',
      width: 110,
      align: 'right',
    },
    { title: '学员违纪', dataIndex: 'discipline', key: 'discipline', width: 90, align: 'right' },
    {
      title: '就业率',
      dataIndex: 'employmentRate',
      key: 'employmentRate',
      width: 90,
      align: 'right',
    },
    {
      title: '就业薪资',
      dataIndex: 'employmentSalary',
      key: 'employmentSalary',
      width: 110,
      align: 'right',
    },
    {
      title: '口碑报名',
      dataIndex: 'reputationRegistrations',
      key: 'reputationRegistrations',
      width: 100,
      align: 'right',
    },
    {
      title: '口碑收入',
      dataIndex: 'reputationRevenue',
      key: 'reputationRevenue',
      width: 100,
      align: 'right',
    },
    {
      title: '带新生人数',
      dataIndex: 'newStudents',
      key: 'newStudents',
      width: 110,
      align: 'right',
    },
    { title: '退费人数', dataIndex: 'refunds', key: 'refunds', width: 100, align: 'right' },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 130,
      render: (_, record) => (
        <Space>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => onEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除?"
            onConfirm={() => setRows((prev) => prev.filter((x) => x.id !== record.id))}
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const onAdd = () => {
    setEditing(null)
    form.resetFields()
    setOpen(true)
  }
  const onEdit = (r: MonthlyStatRow) => {
    setEditing(r)
    form.setFieldsValue(r)
    setOpen(true)
  }
  const onSave = async () => {
    const v = await form.validateFields()
    const row: MonthlyStatRow = { ...(editing || { id: Date.now().toString() }), ...v }
    setRows((prev) => (editing ? prev.map((x) => (x.id === row.id ? row : x)) : [...prev, row]))
    setOpen(false)
    message.success(editing ? '已更新' : '已添加')
  }

  // 计算底部平均
  const averages = useMemo(() => {
    const list = data
    const n = list.length || 0
    const avg = (f: keyof MonthlyStatRow) =>
      n > 0 ? (list.reduce((a, r) => a + Number(r[f] || 0), 0) / n).toFixed(2) : '0'
    return {
      assignmentRate: avg('assignmentRate'),
      workPassRate: avg('workPassRate'),
      examPassRate: avg('examPassRate'),
      projectPassRate: avg('projectPassRate'),
      satisfaction: avg('satisfaction'),
      discipline: avg('discipline'),
      employmentRate: avg('employmentRate'),
      employmentSalary: avg('employmentSalary'),
      reputationRegistrations: avg('reputationRegistrations'),
      reputationRevenue: avg('reputationRevenue'),
      newStudents: avg('newStudents'),
      refunds: avg('refunds'),
    }
  }, [data])

  return (
    <div style={{ padding: 24 }}>
      <div
        className="mb-3"
        style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <CampusSelector />
        <Title level={4} style={{ margin: 0 }}>
          智慧司员工逐月统计表
        </Title>
        <Space>
          <Select
            placeholder="筛选月份"
            allowClear
            style={{ width: 140 }}
            value={filterMonth}
            onChange={setFilterMonth as any}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <Select.Option key={i + 1} value={i + 1}>
                {i + 1} 月
              </Select.Option>
            ))}
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
            新增
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() =>
              exportCsv(
                '员工逐月统计',
                columns.map((c) => c.title as string),
                data.map((r) => [
                  r.month,
                  r.staffName,
                  r.assignmentRate,
                  r.workPassRate,
                  r.examPassRate,
                  r.projectPassRate,
                  r.satisfaction,
                  r.discipline,
                  r.employmentRate,
                  r.employmentSalary,
                  r.reputationRegistrations,
                  r.reputationRevenue,
                  r.newStudents,
                  r.refunds,
                ]),
              )
            }
          >
            导出CSV
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => setFilterMonth(undefined)}>
            重置筛选
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1700 }}
          bordered
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>平均</Table.Summary.Cell>
              <Table.Summary.Cell index={1}></Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">
                {averages.assignmentRate}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="right">
                {averages.workPassRate}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right">
                {averages.examPassRate}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right">
                {averages.projectPassRate}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} align="right">
                {averages.satisfaction}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7} align="right">
                {averages.discipline}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8} align="right">
                {averages.employmentRate}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={9} align="right">
                {averages.employmentSalary}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={10} align="right">
                {averages.reputationRegistrations}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={11} align="right">
                {averages.reputationRevenue}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={12} align="right">
                {averages.newStudents}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={13} align="right">
                {averages.refunds}
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>

      <Modal
        title={editing ? '编辑记录' : '新增记录'}
        open={open}
        onOk={onSave}
        onCancel={() => setOpen(false)}
        width={960}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="month" label="月份" rules={[{ required: true }]}>
                <Select>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Select.Option key={i + 1} value={i + 1}>
                      {i + 1} 月
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="staffName" label="教员姓名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="assignmentRate" label="作业提交率">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="workPassRate" label="作业合格率">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="examPassRate" label="考试合格率">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="projectPassRate" label="项目合格率">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="satisfaction" label="学员满意度">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="discipline" label="学员违纪">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="employmentRate" label="就业率">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="employmentSalary" label="就业薪资">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="reputationRegistrations" label="口碑报名">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="reputationRevenue" label="口碑收入">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="newStudents" label="带新生人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="refunds" label="退费人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default StaffMonthlyStatsPage
