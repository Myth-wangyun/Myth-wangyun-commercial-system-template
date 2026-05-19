// 后端学员就业明星汇总表（教员模块独立页）
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
  Select,
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
const { Option } = Select

interface StarRow {
  id: string
  order: number
  name: string
  gender?: string
  age?: number
  degree?: string
  major?: string
  schooling?: string
  className?: string
  onboardAt?: string // YYYY-MM-DD
  city?: string
  company?: string
  jobTitle?: string
  salary?: number
}

const exportCsv = (filename: string, headers: string[], rows: any[][]) => {
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c ?? ''}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${filename}.csv`
  a.click()
}

const EmploymentStarsPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [rows, setRows] = useState<StarRow[]>([])
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()
  const [editing, setEditing] = useState<StarRow | null>(null)

  const key = (c?: string | null) => `teacher_employment_stars_${c || '主神殿'}`
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

  const columns: ColumnsType<StarRow> = [
    { title: '序号', dataIndex: 'order', key: 'order', width: 70, align: 'center' },
    { title: '学员姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '性别', dataIndex: 'gender', key: 'gender', width: 70 },
    { title: '毕业年龄', dataIndex: 'age', key: 'age', width: 90, align: 'right' },
    { title: '最高学历', dataIndex: 'degree', key: 'degree', width: 100 },
    { title: '专业', dataIndex: 'major', key: 'major', width: 100 },
    { title: '学制', dataIndex: 'schooling', key: 'schooling', width: 90 },
    { title: '班级名称', dataIndex: 'className', key: 'className', width: 110 },
    { title: '入职时间', dataIndex: 'onboardAt', key: 'onboardAt', width: 120 },
    { title: '就业地区', dataIndex: 'city', key: 'city', width: 110 },
    { title: '就业单位', dataIndex: 'company', key: 'company', width: 180 },
    { title: '就业岗位', dataIndex: 'jobTitle', key: 'jobTitle', width: 120 },
    { title: '就业薪资', dataIndex: 'salary', key: 'salary', width: 100, align: 'right' },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 130,
      render: (_, r) => (
        <Space>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => onEdit(r)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除?"
            onConfirm={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}
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
  const onEdit = (r: StarRow) => {
    setEditing(r)
    form.setFieldsValue({ ...r, onboardAt: r.onboardAt ? dayjs(r.onboardAt) : undefined })
    setOpen(true)
  }
  const onSave = async () => {
    const v = await form.validateFields()
    const row: StarRow = {
      ...(editing || { id: Date.now().toString(), order: rows.length + 1 }),
      ...v,
      onboardAt: v.onboardAt ? v.onboardAt.format('YYYY-MM-DD') : '',
    }
    setRows((prev) => (editing ? prev.map((x) => (x.id === row.id ? row : x)) : [...prev, row]))
    setOpen(false)
    message.success(editing ? '已更新' : '已添加')
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        className="mb-3"
        style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <CampusSelector />
        <Title level={4} style={{ margin: 0 }}>
          后端就业明星汇总表
        </Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
            新增
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() =>
              exportCsv(
                '就业明星汇总',
                columns.map((c) => c.title as string),
                rows.map((r) => [
                  r.order,
                  r.name,
                  r.gender,
                  r.age,
                  r.degree,
                  r.major,
                  r.schooling,
                  r.className,
                  r.onboardAt,
                  r.city,
                  r.company,
                  r.jobTitle,
                  r.salary,
                ]),
              )
            }
          >
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
          scroll={{ x: 1400 }}
          bordered
        />
      </Card>

      <Modal
        title={editing ? '编辑记录' : '新增记录'}
        open={open}
        onOk={onSave}
        onCancel={() => setOpen(false)}
        width={900}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="name" label="学员姓名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="gender" label="性别">
                <Select allowClear>
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="age" label="毕业年龄">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="degree" label="最高学历">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="major" label="专业">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="schooling" label="学制">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="className" label="班级名称">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="onboardAt" label="入职时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="city" label="就业地区">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="company" label="就业单位">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="jobTitle" label="就业岗位">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="salary" label="就业薪资">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default EmploymentStarsPage
