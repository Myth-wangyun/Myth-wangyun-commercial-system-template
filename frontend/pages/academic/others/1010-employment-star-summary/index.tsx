import React, { useState, useEffect } from 'react'
import { App,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tag,
  Typography,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  StarOutlined,
  DollarOutlined,
  UserOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'

const { Option } = Select
const { Title } = Typography

// 类型定义
interface EmploymentStarData {
  id: string
  serialNo: number
  studentName: string
  gender: string
  graduationAge: number
  highestEducation: string
  major: string
  programLength: string
  className: string
  onboardingDate: string
  employmentRegion: string
  employmentCompany: string
  employmentPosition: string
  employmentSalary: number
}

// 模拟数据
const mockData: EmploymentStarData[] = [
  // 空数据，等待用户填写
]

const CampusEmploymentStarSummary: React.FC = () => {
  const { message } = App.useApp()
  const [data, setData] = useState<EmploymentStarData[]>(mockData)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<EmploymentStarData | null>(null)
  const [form] = Form.useForm()
  const [searchText, setSearchText] = useState('')

  // 计算统计数据
  const totalStudents = data.length
  const avgSalary =
    data.length > 0 ? data.reduce((sum, item) => sum + item.employmentSalary, 0) / data.length : 0
  const salaryOver10kCount = data.filter((item) => item.employmentSalary >= 10000).length
  const salaryOver10kRate = totalStudents > 0 ? (salaryOver10kCount / totalStudents) * 100 : 0

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEdit = (record: EmploymentStarData) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      onboardingDate: record.onboardingDate ? dayjs(record.onboardingDate) : null,
    })
    setIsModalVisible(true)
  }

  const handleDelete = (id: string) => {
    setData(data.filter((item) => item.id !== id))
    message.success('删除成功')
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      const newRecord: EmploymentStarData = {
        ...values,
        id: editingRecord?.id || Date.now().toString(),
        serialNo: editingRecord?.serialNo || data.length + 1,
        onboardingDate: values.onboardingDate ? values.onboardingDate.format('YYYY-MM-DD') : '',
      }

      if (editingRecord) {
        setData(data.map((item) => (item.id === editingRecord.id ? newRecord : item)))
        message.success('更新成功')
      } else {
        setData([...data, newRecord])
        message.success('添加成功')
      }

      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  // 过滤数据
  const filteredData = data.filter(
    (item) =>
      item.studentName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.major.toLowerCase().includes(searchText.toLowerCase()) ||
      item.className.toLowerCase().includes(searchText.toLowerCase()) ||
      item.employmentCompany.toLowerCase().includes(searchText.toLowerCase()) ||
      item.employmentPosition.toLowerCase().includes(searchText.toLowerCase()),
  )

  const columns = [
    {
      title: '序号',
      dataIndex: 'serialNo',
      key: 'serialNo',
      width: 80,
      fixed: 'left' as const,
    },
    {
      title: '学员姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
    },
    {
      title: '毕业年龄',
      dataIndex: 'graduationAge',
      key: 'graduationAge',
      width: 100,
    },
    {
      title: '最高学历',
      dataIndex: 'highestEducation',
      key: 'highestEducation',
      width: 120,
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      width: 120,
    },
    {
      title: '学制',
      dataIndex: 'programLength',
      key: 'programLength',
      width: 100,
    },
    {
      title: '班级名称',
      dataIndex: 'className',
      key: 'className',
      width: 120,
    },
    {
      title: '入职时间',
      dataIndex: 'onboardingDate',
      key: 'onboardingDate',
      width: 120,
    },
    {
      title: '就业地区',
      dataIndex: 'employmentRegion',
      key: 'employmentRegion',
      width: 120,
    },
    {
      title: '就业单位',
      dataIndex: 'employmentCompany',
      key: 'employmentCompany',
      width: 200,
    },
    {
      title: '就业岗位',
      dataIndex: 'employmentPosition',
      key: 'employmentPosition',
      width: 150,
    },
    {
      title: '就业薪资',
      dataIndex: 'employmentSalary',
      key: 'employmentSalary',
      width: 120,
      render: (value: number) => (value ? `¥${value.toLocaleString()}` : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: EmploymentStarData) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card>
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic title="总学员数" value={totalStudents} prefix={<UserOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均薪资"
                value={avgSalary}
                precision={0}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="薪资过万人数"
                value={salaryOver10kCount}
                prefix={<StarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="薪资过万率"
                value={salaryOver10kRate}
                precision={1}
                suffix="%"
                prefix={<StarOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* 操作栏 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Input
              placeholder="搜索学员姓名、专业、班级、公司等"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加记录
          </Button>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          scroll={{ x: 2000 }}
          pagination={{
            total: filteredData.length,
            defaultPageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
        />
      </Card>

      {/* 编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑就业明星记录' : '添加就业明星记录'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="studentName"
                label="学员姓名"
                rules={[{ required: true, message: '请输入学员姓名' }]}
              >
                <Input placeholder="请输入学员姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gender"
                label="性别"
                rules={[{ required: true, message: '请选择性别' }]}
              >
                <Select placeholder="请选择性别">
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="graduationAge"
                label="毕业年龄"
                rules={[{ required: true, message: '请输入毕业年龄' }]}
              >
                <Input type="number" placeholder="请输入毕业年龄" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="highestEducation"
                label="最高学历"
                rules={[{ required: true, message: '请输入最高学历' }]}
              >
                <Select placeholder="请选择最高学历">
                  <Option value="高中">高中</Option>
                  <Option value="大专">大专</Option>
                  <Option value="本科">本科</Option>
                  <Option value="硕士">硕士</Option>
                  <Option value="博士">博士</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="major"
                label="专业"
                rules={[{ required: true, message: '请输入专业' }]}
              >
                <Input placeholder="请输入专业" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="programLength"
                label="学制"
                rules={[{ required: true, message: '请输入学制' }]}
              >
                <Input placeholder="请输入学制" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="className"
                label="班级名称"
                rules={[{ required: true, message: '请输入班级名称' }]}
              >
                <Input placeholder="请输入班级名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="onboardingDate" label="入职时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="employmentRegion"
                label="就业地区"
                rules={[{ required: true, message: '请输入就业地区' }]}
              >
                <Input placeholder="请输入就业地区" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="employmentCompany"
                label="就业单位"
                rules={[{ required: true, message: '请输入就业单位' }]}
              >
                <Input placeholder="请输入就业单位" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="employmentPosition"
                label="就业岗位"
                rules={[{ required: true, message: '请输入就业岗位' }]}
              >
                <Input placeholder="请输入就业岗位" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="employmentSalary"
                label="就业薪资"
                rules={[{ required: true, message: '请输入就业薪资' }]}
              >
                <Input type="number" placeholder="请输入就业薪资" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default CampusEmploymentStarSummary
