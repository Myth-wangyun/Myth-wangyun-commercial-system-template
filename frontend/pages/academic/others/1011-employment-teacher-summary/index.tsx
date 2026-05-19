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
  UserOutlined,
  DollarOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'

const { Option } = Select
const { Title } = Typography

// 类型定义
interface TeacherEmploymentData {
  id: string
  serialNo: number
  campus: string
  teacherName: string
  major: string
  programLength: string
  className: string
  graduationDate: string
  targetAvgSalary: number
  actualAvgSalary: number
  achievementRate: number
  fileCount: number
  targetEmploymentCount: number
  actualEmploymentCount: number
  employmentRate: number
  salaryOver10kCount: number
}

// 模拟数据
const mockData: TeacherEmploymentData[] = [
  {
    id: '1',
    serialNo: 1,
    campus: '主神殿',
    teacherName: '闫梦雷',
    major: '云计算',
    programLength: '6个月',
    className: 'Y32',
    graduationDate: '',
    targetAvgSalary: 0,
    actualAvgSalary: 0,
    achievementRate: 0,
    fileCount: 0,
    targetEmploymentCount: 0,
    actualEmploymentCount: 0,
    employmentRate: 0,
    salaryOver10kCount: 0,
  },
  {
    id: '2',
    serialNo: 2,
    campus: '永恒殿',
    teacherName: '李新福',
    major: '',
    programLength: '',
    className: '',
    graduationDate: '',
    targetAvgSalary: 0,
    actualAvgSalary: 0,
    achievementRate: 0,
    fileCount: 0,
    targetEmploymentCount: 0,
    actualEmploymentCount: 0,
    employmentRate: 0,
    salaryOver10kCount: 0,
  },
  {
    id: '3',
    serialNo: 3,
    campus: '慈悲殿',
    teacherName: '刘泽龙',
    major: '',
    programLength: '',
    className: '',
    graduationDate: '',
    targetAvgSalary: 0,
    actualAvgSalary: 0,
    achievementRate: 0,
    fileCount: 0,
    targetEmploymentCount: 0,
    actualEmploymentCount: 0,
    employmentRate: 0,
    salaryOver10kCount: 0,
  },
  {
    id: '4',
    serialNo: 4,
    campus: '李大殿',
    teacherName: '李建峰',
    major: '',
    programLength: '',
    className: '',
    graduationDate: '',
    targetAvgSalary: 0,
    actualAvgSalary: 0,
    achievementRate: 0,
    fileCount: 0,
    targetEmploymentCount: 0,
    actualEmploymentCount: 0,
    employmentRate: 0,
    salaryOver10kCount: 0,
  },
]

const CampusTeacherEmploymentSummary: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [data, setData] = useState<TeacherEmploymentData[]>(mockData)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TeacherEmploymentData | null>(null)
  const [form] = Form.useForm()
  const [searchText, setSearchText] = useState('')

  // 计算统计数据
  const totalTeachers = data.length
  const totalFileCount = data.reduce((sum, item) => sum + item.fileCount, 0)
  const totalTargetEmployment = data.reduce((sum, item) => sum + item.targetEmploymentCount, 0)
  const totalActualEmployment = data.reduce((sum, item) => sum + item.actualEmploymentCount, 0)
  const avgEmploymentRate = totalFileCount > 0 ? (totalActualEmployment / totalFileCount) * 100 : 0
  const totalSalaryOver10k = data.reduce((sum, item) => sum + item.salaryOver10kCount, 0)

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEdit = (record: TeacherEmploymentData) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      graduationDate: record.graduationDate ? dayjs(record.graduationDate) : null,
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
      const newRecord: TeacherEmploymentData = {
        ...values,
        id: editingRecord?.id || Date.now().toString(),
        serialNo: editingRecord?.serialNo || data.length + 1,
        graduationDate: values.graduationDate ? values.graduationDate.format('YYYY-MM-DD') : '',
        achievementRate:
          values.fileCount > 0 ? (values.actualEmploymentCount / values.fileCount) * 100 : 0,
        employmentRate:
          values.fileCount > 0 ? (values.actualEmploymentCount / values.fileCount) * 100 : 0,
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
  const filteredData = data.filter((item) => {
    const campusMatch = !currentCampus || item.campus === currentCampus
    const searchMatch =
      !searchText ||
      item.teacherName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.major.toLowerCase().includes(searchText.toLowerCase()) ||
      item.className.toLowerCase().includes(searchText.toLowerCase())
    return campusMatch && searchMatch
  })

  const columns = [
    {
      title: '序号',
      dataIndex: 'serialNo',
      key: 'serialNo',
      width: 80,
      fixed: 'left' as const,
    },
    {
      title: '教员姓名',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 120,
      fixed: 'left' as const,
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
      title: '毕业时间',
      dataIndex: 'graduationDate',
      key: 'graduationDate',
      width: 120,
    },
    {
      title: '就业薪资',
      children: [
        {
          title: '目标平均就业薪资',
          dataIndex: 'targetAvgSalary',
          key: 'targetAvgSalary',
          width: 150,
          render: (value: number) => (value ? `¥${value.toLocaleString()}` : '-'),
        },
        {
          title: '实际平均就业薪资',
          dataIndex: 'actualAvgSalary',
          key: 'actualAvgSalary',
          width: 150,
          render: (value: number) => (value ? `¥${value.toLocaleString()}` : '-'),
        },
      ],
    },
    {
      title: '就业率',
      children: [
        {
          title: '达标率',
          dataIndex: 'achievementRate',
          key: 'achievementRate',
          width: 100,
          render: (value: number) => (value ? `${value.toFixed(1)}%` : '-'),
        },
        {
          title: '档案人数',
          dataIndex: 'fileCount',
          key: 'fileCount',
          width: 100,
        },
        {
          title: '目标就业人数',
          dataIndex: 'targetEmploymentCount',
          key: 'targetEmploymentCount',
          width: 120,
        },
        {
          title: '实际就业人数',
          dataIndex: 'actualEmploymentCount',
          key: 'actualEmploymentCount',
          width: 120,
        },
        {
          title: '就业率',
          dataIndex: 'employmentRate',
          key: 'employmentRate',
          width: 100,
          render: (value: number) => (value ? `${value.toFixed(1)}%` : '-'),
        },
      ],
    },
    {
      title: '薪资过万人',
      children: [
        {
          title: '数',
          dataIndex: 'salaryOver10kCount',
          key: 'salaryOver10kCount',
          width: 100,
        },
      ],
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: TeacherEmploymentData) => (
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
              <Statistic title="总教员数" value={totalTeachers} prefix={<UserOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="总档案人数" value={totalFileCount} prefix={<UserOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总实际就业人数"
                value={totalActualEmployment}
                prefix={<TrophyOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均就业率"
                value={avgEmploymentRate}
                precision={1}
                suffix="%"
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* 操作栏 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Input
              placeholder="搜索教员姓名、专业、班级等"
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
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={6}>
                  <strong>合计/平均</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6}>
                  <strong>-</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7}>
                  <strong>-</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8}>
                  <strong>-</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9}>
                  <strong>{totalFileCount}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10}>
                  <strong>{totalTargetEmployment}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11}>
                  <strong>{totalActualEmployment}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={12}>
                  <strong>{avgEmploymentRate.toFixed(1)}%</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={13}>
                  <strong>{totalSalaryOver10k}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={14}>
                  <strong>-</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      {/* 编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑教员就业记录' : '添加教员就业记录'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
        destroyOnHidden={true}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="teacherName"
                label="教员姓名"
                rules={[{ required: true, message: '请输入教员姓名' }]}
              >
                <Input placeholder="请输入教员姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="major" label="专业">
                <Input placeholder="请输入专业" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="programLength" label="学制">
                <Input placeholder="请输入学制" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="className" label="班级名称">
                <Input placeholder="请输入班级名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="graduationDate" label="毕业时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="targetAvgSalary" label="目标平均就业薪资">
                <Input type="number" placeholder="请输入目标平均就业薪资" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="actualAvgSalary" label="实际平均就业薪资">
                <Input type="number" placeholder="请输入实际平均就业薪资" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fileCount" label="档案人数">
                <Input type="number" placeholder="请输入档案人数" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="targetEmploymentCount" label="目标就业人数">
                <Input type="number" placeholder="请输入目标就业人数" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="actualEmploymentCount" label="实际就业人数">
                <Input type="number" placeholder="请输入实际就业人数" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="salaryOver10kCount" label="薪资过万人数">
                <Input type="number" placeholder="请输入薪资过万人数" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default CampusTeacherEmploymentSummary
