// 教员模块 - 后端新生维稳（按月汇总 / 个人汇总 / 个人按月汇总）
import React, { useEffect, useMemo, useState } from 'react'
import { App,
  Card,
  Tabs,
  Table,
  Typography,
  Space,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Popconfirm,
} from 'antd'
import { PlusOutlined, DownloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import CampusSelector from '@/components/common/CampusSelector'
import { useCampusStore } from '@/stores/campusStore'

const { Title } = Typography

interface MonthlyRow {
  id: string
  month: number // 1..12
  campus: string
  handover: number
  enroll: number
  refund: number
}

interface StaffRow {
  id: string
  staffName: string
  handover: number
  enroll: number
  refund: number
}

interface StaffMonthlyRow {
  id: string
  month: number
  staffName: string
  handover: number
  enroll: number
  refund: number
}

const rate = (refund?: number, enroll?: number) => {
  if (!enroll || enroll === 0) return ''
  return `${((Number(refund || 0) / enroll) * 100).toFixed(1)}%`
}

const exportCsv = (filename: string, headers: string[], rows: any[][]) => {
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c ?? ''}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${filename}_${dayjs().format('YYYY-MM-DD')}.csv`
  a.click()
}

const StudentStabilityTrackingPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()

  // 月度汇总
  const [monthly, setMonthly] = useState<MonthlyRow[]>([])
  const [monthlyOpen, setMonthlyOpen] = useState(false)
  const [monthlyForm] = Form.useForm()
  const [monthlyEditing, setMonthlyEditing] = useState<MonthlyRow | null>(null)

  // 个人汇总
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [staffOpen, setStaffOpen] = useState(false)
  const [staffForm] = Form.useForm()
  const [staffEditing, setStaffEditing] = useState<StaffRow | null>(null)

  // 个人按月
  const [staffMonthly, setStaffMonthly] = useState<StaffMonthlyRow[]>([])
  const [staffMonthlyOpen, setStaffMonthlyOpen] = useState(false)
  const [staffMonthlyForm] = Form.useForm()
  const [staffMonthlyEditing, setStaffMonthlyEditing] = useState<StaffMonthlyRow | null>(null)

  const mKey = (c?: string | null) => `stability_monthly_${c || '主神殿'}`
  const sKey = (c?: string | null) => `stability_staff_${c || '主神殿'}`
  const smKey = (c?: string | null) => `stability_staffMonthly_${c || '主神殿'}`

  useEffect(() => {
    const load = <T,>(key: string, def: T[]) => {
      try {
        const raw = localStorage.getItem(key)
        return raw ? (JSON.parse(raw) as T[]) : def
      } catch {
        return def
      }
    }
    setMonthly(load(mKey(currentCampus), []))
    setStaff(load(sKey(currentCampus), []))
    setStaffMonthly(load(smKey(currentCampus), []))
  }, [currentCampus])

  useEffect(() => {
    try {
      localStorage.setItem(mKey(currentCampus), JSON.stringify(monthly))
    } catch {}
  }, [monthly, currentCampus])
  useEffect(() => {
    try {
      localStorage.setItem(sKey(currentCampus), JSON.stringify(staff))
    } catch {}
  }, [staff, currentCampus])
  useEffect(() => {
    try {
      localStorage.setItem(smKey(currentCampus), JSON.stringify(staffMonthly))
    } catch {}
  }, [staffMonthly, currentCampus])

  // 列定义
  const monthlyColumns: ColumnsType<MonthlyRow> = [
    { title: '月份', dataIndex: 'month', key: 'month', width: 80, align: 'center' },
    { title: '神殿', dataIndex: 'campus', key: 'campus', width: 120 },
    { title: '交接人数', dataIndex: 'handover', key: 'handover', width: 120, align: 'right' },
    { title: '入学人数', dataIndex: 'enroll', key: 'enroll', width: 120, align: 'right' },
    { title: '退费人数', dataIndex: 'refund', key: 'refund', width: 120, align: 'right' },
    {
      title: '退费率',
      key: 'refundRate',
      width: 120,
      align: 'center',
      render: (_, r) => rate(r.refund, r.enroll),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => onEditMonthly(r)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除?"
            onConfirm={() => setMonthly((prev) => prev.filter((x) => x.id !== r.id))}
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const staffColumns: ColumnsType<StaffRow> = [
    { title: '教员姓名', dataIndex: 'staffName', key: 'staffName', width: 140 },
    { title: '交接人数', dataIndex: 'handover', key: 'handover', width: 120, align: 'right' },
    { title: '入学人数', dataIndex: 'enroll', key: 'enroll', width: 120, align: 'right' },
    { title: '退费人数', dataIndex: 'refund', key: 'refund', width: 120, align: 'right' },
    {
      title: '退费率',
      key: 'refundRate',
      width: 120,
      align: 'center',
      render: (_, r) => rate(r.refund, r.enroll),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => onEditStaff(r)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除?"
            onConfirm={() => setStaff((prev) => prev.filter((x) => x.id !== r.id))}
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const staffMonthlyColumns: ColumnsType<StaffMonthlyRow> = [
    { title: '月份', dataIndex: 'month', key: 'month', width: 80, align: 'center' },
    { title: '教员姓名', dataIndex: 'staffName', key: 'staffName', width: 140 },
    { title: '交接人数', dataIndex: 'handover', key: 'handover', width: 120, align: 'right' },
    { title: '入学人数', dataIndex: 'enroll', key: 'enroll', width: 120, align: 'right' },
    { title: '退费人数', dataIndex: 'refund', key: 'refund', width: 120, align: 'right' },
    {
      title: '退费率',
      key: 'refundRate',
      width: 120,
      align: 'center',
      render: (_, r) => rate(r.refund, r.enroll),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEditStaffMonthly(r)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除?"
            onConfirm={() => setStaffMonthly((prev) => prev.filter((x) => x.id !== r.id))}
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // Add/Edit Handlers
  const onAddMonthly = () => {
    setMonthlyEditing(null)
    monthlyForm.resetFields()
    monthlyForm.setFieldsValue({ month: dayjs(), campus: currentCampus || '主神殿' })
    setMonthlyOpen(true)
  }
  const onEditMonthly = (r: MonthlyRow) => {
    setMonthlyEditing(r)
    monthlyForm.setFieldsValue({ ...r, month: dayjs(`${new Date().getFullYear()}-${r.month}-01`) })
    setMonthlyOpen(true)
  }
  const onSaveMonthly = async () => {
    const v = await monthlyForm.validateFields()
    const row: MonthlyRow = {
      ...(monthlyEditing || { id: Date.now().toString() }),
      month: Number(v.month?.format('M')),
      campus: v.campus,
      handover: v.handover || 0,
      enroll: v.enroll || 0,
      refund: v.refund || 0,
    }
    setMonthly((prev) =>
      monthlyEditing ? prev.map((x) => (x.id === row.id ? row : x)) : [...prev, row],
    )
    setMonthlyOpen(false)
    message.success(monthlyEditing ? '已更新' : '已添加')
  }

  const onAddStaff = () => {
    setStaffEditing(null)
    staffForm.resetFields()
    setStaffOpen(true)
  }
  const onEditStaff = (r: StaffRow) => {
    setStaffEditing(r)
    staffForm.setFieldsValue(r)
    setStaffOpen(true)
  }
  const onSaveStaff = async () => {
    const v = await staffForm.validateFields()
    const row: StaffRow = {
      ...(staffEditing || { id: Date.now().toString() }),
      staffName: v.staffName,
      handover: v.handover || 0,
      enroll: v.enroll || 0,
      refund: v.refund || 0,
    }
    setStaff((prev) =>
      staffEditing ? prev.map((x) => (x.id === row.id ? row : x)) : [...prev, row],
    )
    setStaffOpen(false)
    message.success(staffEditing ? '已更新' : '已添加')
  }

  const onAddStaffMonthly = () => {
    setStaffMonthlyEditing(null)
    staffMonthlyForm.resetFields()
    staffMonthlyForm.setFieldsValue({ month: dayjs(), staffName: '' })
    setStaffMonthlyOpen(true)
  }
  const onEditStaffMonthly = (r: StaffMonthlyRow) => {
    setStaffMonthlyEditing(r)
    staffMonthlyForm.setFieldsValue({
      ...r,
      month: dayjs(`${new Date().getFullYear()}-${r.month}-01`),
    })
    setStaffMonthlyOpen(true)
  }
  const onSaveStaffMonthly = async () => {
    const v = await staffMonthlyForm.validateFields()
    const row: StaffMonthlyRow = {
      ...(staffMonthlyEditing || { id: Date.now().toString() }),
      month: Number(v.month?.format('M')),
      staffName: v.staffName,
      handover: v.handover || 0,
      enroll: v.enroll || 0,
      refund: v.refund || 0,
    }
    setStaffMonthly((prev) =>
      staffMonthlyEditing ? prev.map((x) => (x.id === row.id ? row : x)) : [...prev, row],
    )
    setStaffMonthlyOpen(false)
    message.success(staffMonthlyEditing ? '已更新' : '已添加')
  }

  // 合计
  const sumMonthly = useMemo(
    () => ({
      handover: monthly.reduce((a, r) => a + (r.handover || 0), 0),
      enroll: monthly.reduce((a, r) => a + (r.enroll || 0), 0),
      refund: monthly.reduce((a, r) => a + (r.refund || 0), 0),
    }),
    [monthly],
  )
  const sumStaff = useMemo(
    () => ({
      handover: staff.reduce((a, r) => a + (r.handover || 0), 0),
      enroll: staff.reduce((a, r) => a + (r.enroll || 0), 0),
      refund: staff.reduce((a, r) => a + (r.refund || 0), 0),
    }),
    [staff],
  )
  const sumStaffMonthly = useMemo(
    () => ({
      handover: staffMonthly.reduce((a, r) => a + (r.handover || 0), 0),
      enroll: staffMonthly.reduce((a, r) => a + (r.enroll || 0), 0),
      refund: staffMonthly.reduce((a, r) => a + (r.refund || 0), 0),
    }),
    [staffMonthly],
  )

  const tabs = [
    {
      key: 'monthly',
      label: '月度汇总',
      children: (
        <Card>
          <Space style={{ marginBottom: 12 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={onAddMonthly}>
              新增
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() =>
                exportCsv(
                  '新生维稳_月度汇总',
                  monthlyColumns.map((c) => c.title as string),
                  monthly.map((r) => [
                    r.month,
                    r.campus,
                    r.handover,
                    r.enroll,
                    r.refund,
                    rate(r.refund, r.enroll),
                  ]),
                )
              }
            >
              导出CSV
            </Button>
          </Space>
          <Table
            columns={monthlyColumns}
            dataSource={monthly}
            rowKey="id"
            pagination={false}
            scroll={{ x: 900 }}
            bordered
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
                <Table.Summary.Cell index={1}></Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  {sumMonthly.handover}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  {sumMonthly.enroll}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  {sumMonthly.refund}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="center">
                  {rate(sumMonthly.refund, sumMonthly.enroll)}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </Card>
      ),
    },
    {
      key: 'staff',
      label: '个人汇总',
      children: (
        <Card>
          <Space style={{ marginBottom: 12 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={onAddStaff}>
              新增
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() =>
                exportCsv(
                  '新生维稳_个人汇总',
                  staffColumns.map((c) => c.title as string),
                  staff.map((r) => [
                    r.staffName,
                    r.handover,
                    r.enroll,
                    r.refund,
                    rate(r.refund, r.enroll),
                  ]),
                )
              }
            >
              导出CSV
            </Button>
          </Space>
          <Table
            columns={staffColumns}
            dataSource={staff}
            rowKey="id"
            pagination={false}
            scroll={{ x: 900 }}
            bordered
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  {sumStaff.handover}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  {sumStaff.enroll}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  {sumStaff.refund}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="center">
                  {rate(sumStaff.refund, sumStaff.enroll)}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </Card>
      ),
    },
    {
      key: 'staffMonthly',
      label: '个人按月汇总',
      children: (
        <Card>
          <Space style={{ marginBottom: 12 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={onAddStaffMonthly}>
              新增
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() =>
                exportCsv(
                  '新生维稳_个人按月',
                  staffMonthlyColumns.map((c) => c.title as string),
                  staffMonthly.map((r) => [
                    r.month,
                    r.staffName,
                    r.handover,
                    r.enroll,
                    r.refund,
                    rate(r.refund, r.enroll),
                  ]),
                )
              }
            >
              导出CSV
            </Button>
          </Space>
          <Table
            columns={staffMonthlyColumns}
            dataSource={staffMonthly}
            rowKey="id"
            pagination={false}
            scroll={{ x: 900 }}
            bordered
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>总计</Table.Summary.Cell>
                <Table.Summary.Cell index={1}></Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  {sumStaffMonthly.handover}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  {sumStaffMonthly.enroll}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  {sumStaffMonthly.refund}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="center">
                  {rate(sumStaffMonthly.refund, sumStaffMonthly.enroll)}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </Card>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div
        className="mb-3"
        style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <CampusSelector />
        <Title level={4} style={{ margin: 0 }}>
          后端新生维稳
        </Title>
      </div>
      <Tabs items={tabs} />

      {/* 月度 - 录入 */}
      <Modal
        title={monthlyEditing ? '编辑月度记录' : '新增月度记录'}
        open={monthlyOpen}
        onOk={onSaveMonthly}
        onCancel={() => setMonthlyOpen(false)}
        width={700}
        destroyOnHidden
      >
        <Form form={monthlyForm} layout="vertical">
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="month" label="月份" rules={[{ required: true }]}>
                <DatePicker picker="month" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="campus" label="神殿" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="handover" label="交接人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="enroll" label="入学人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="refund" label="退费人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 个人 - 录入 */}
      <Modal
        title={staffEditing ? '编辑个人汇总' : '新增个人汇总'}
        open={staffOpen}
        onOk={onSaveStaff}
        onCancel={() => setStaffOpen(false)}
        width={700}
        destroyOnHidden
      >
        <Form form={staffForm} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="staffName" label="教员姓名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="handover" label="交接人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="enroll" label="入学人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="refund" label="退费人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 个人按月 - 录入 */}
      <Modal
        title={staffMonthlyEditing ? '编辑个人月度' : '新增个人月度'}
        open={staffMonthlyOpen}
        onOk={onSaveStaffMonthly}
        onCancel={() => setStaffMonthlyOpen(false)}
        width={700}
        destroyOnHidden
      >
        <Form form={staffMonthlyForm} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="month" label="月份" rules={[{ required: true }]}>
                <DatePicker picker="month" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="staffName" label="教员姓名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="handover" label="交接人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="enroll" label="入学人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="refund" label="退费人数">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default StudentStabilityTrackingPage
