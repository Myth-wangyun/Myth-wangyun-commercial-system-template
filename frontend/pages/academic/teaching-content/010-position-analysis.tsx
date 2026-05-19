import React, { useState } from 'react'
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
  Progress,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  BarChartOutlined,
  UserOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

// 岗位分析数据类型
interface PositionAnalysisRecord {
  id: string
  serialNumber: number
  positionName: string
  industry: string
  company: string
  location: string
  salaryMin: number
  salaryMax: number
  averageSalary: number
  experience: string
  education: string
  skillRequirements: string
  jobDescription: string
  marketDemand: '高' | '中' | '低'
  competitionLevel: '高' | '中' | '低'
  growthProspect: '高' | '中' | '低'
  analysisDate: string
  analyst: string
  notes: string
  createdAt?: string
  updatedAt?: string
}

// 表单数据类型
interface PositionAnalysisFormData {
  positionName: string
  industry: string
  company: string
  location: string
  salaryMin: number
  salaryMax: number
  averageSalary: number
  experience: string
  education: string
  skillRequirements: string
  jobDescription: string
  marketDemand: '高' | '中' | '低'
  competitionLevel: '高' | '中' | '低'
  growthProspect: '高' | '中' | '低'
  analysisDate: dayjs.Dayjs | null
  analyst: string
  notes: string
}

const PositionAnalysisPage: React.FC = () => {
  const { message } = App.useApp()
  const [dataSource, setDataSource] = useState<PositionAnalysisRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PositionAnalysisRecord | null>(null)
  const [form] = Form.useForm<PositionAnalysisFormData>()
  const [searchText, setSearchText] = useState('')

  // 模拟数据
  const mockData: PositionAnalysisRecord[] = [
    {
      id: '1',
      serialNumber: 1,
      positionName: '前端开发工程师',
      industry: '互联网',
      company: '腾讯科技',
      location: '深圳',
      salaryMin: 12000,
      salaryMax: 20000,
      averageSalary: 16000,
      experience: '3-5年',
      education: '本科',
      skillRequirements: 'React, Vue, JavaScript, HTML, CSS',
      jobDescription: '负责前端页面开发和维护，与后端协作完成项目',
      marketDemand: '高',
      competitionLevel: '中',
      growthProspect: '高',
      analysisDate: '2024-03-15',
      analyst: '张老师',
      notes: '市场需求旺盛，薪资水平较高',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '2',
      serialNumber: 2,
      positionName: '后端开发工程师',
      industry: '互联网',
      company: '阿里巴巴',
      location: '杭州',
      salaryMin: 15000,
      salaryMax: 25000,
      averageSalary: 20000,
      experience: '3-5年',
      education: '本科',
      skillRequirements: 'Java, Spring, MySQL, Redis, Docker',
      jobDescription: '负责后端服务开发和维护，数据库设计和优化',
      marketDemand: '高',
      competitionLevel: '高',
      growthProspect: '高',
      analysisDate: '2024-03-16',
      analyst: '李老师',
      notes: '技术要求较高，竞争激烈',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ]

  // 初始化数据
  React.useEffect(() => {
    setDataSource(mockData)
  }, [])

  // 表格列定义
  const columns = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '岗位名称',
      dataIndex: 'positionName',
      key: 'positionName',
      width: 150,
      ellipsis: true,
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '公司',
      dataIndex: 'company',
      key: 'company',
      width: 120,
      ellipsis: true,
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '薪资范围',
      key: 'salaryRange',
      width: 150,
      align: 'center' as const,
      render: (_, record: PositionAnalysisRecord) => (
        <div>
          <div>
            ¥{record.salaryMin.toLocaleString()}-{record.salaryMax.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            平均: ¥{record.averageSalary.toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      title: '经验要求',
      dataIndex: 'experience',
      key: 'experience',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '学历要求',
      dataIndex: 'education',
      key: 'education',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '技能要求',
      dataIndex: 'skillRequirements',
      key: 'skillRequirements',
      width: 200,
      ellipsis: true,
    },
    {
      title: '市场需求',
      dataIndex: 'marketDemand',
      key: 'marketDemand',
      width: 100,
      align: 'center' as const,
      render: (demand: string) => {
        const color = demand === '高' ? 'green' : demand === '中' ? 'orange' : 'red'
        return <Tag color={color}>{demand}</Tag>
      },
    },
    {
      title: '竞争程度',
      dataIndex: 'competitionLevel',
      key: 'competitionLevel',
      width: 100,
      align: 'center' as const,
      render: (level: string) => {
        const color = level === '高' ? 'red' : level === '中' ? 'orange' : 'green'
        return <Tag color={color}>{level}</Tag>
      },
    },
    {
      title: '发展前景',
      dataIndex: 'growthProspect',
      key: 'growthProspect',
      width: 100,
      align: 'center' as const,
      render: (prospect: string) => {
        const color = prospect === '高' ? 'green' : prospect === '中' ? 'orange' : 'red'
        return <Tag color={color}>{prospect}</Tag>
      },
    },
    {
      title: '分析日期',
      dataIndex: 'analysisDate',
      key: 'analysisDate',
      width: 120,
      align: 'center' as const,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '分析师',
      dataIndex: 'analyst',
      key: 'analyst',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_, record: PositionAnalysisRecord) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" icon={<DeleteOutlined />} danger size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 统计数据
  const statistics = {
    totalPositions: dataSource.length,
    averageSalary:
      dataSource.length > 0
        ? Math.round(
            dataSource.reduce((sum, item) => sum + item.averageSalary, 0) / dataSource.length,
          )
        : 0,
    highDemandPositions: dataSource.filter((item) => item.marketDemand === '高').length,
    highCompetitionPositions: dataSource.filter((item) => item.competitionLevel === '高').length,
    highGrowthPositions: dataSource.filter((item) => item.growthProspect === '高').length,
    internetPositions: dataSource.filter((item) => item.industry === '互联网').length,
    financePositions: dataSource.filter((item) => item.industry === '金融').length,
    educationPositions: dataSource.filter((item) => item.industry === '教育').length,
    otherPositions: dataSource.filter((item) => !['互联网', '金融', '教育'].includes(item.industry))
      .length,
  }

  // 处理添加
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 处理编辑
  const handleEdit = (record: PositionAnalysisRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      analysisDate: record.analysisDate ? dayjs(record.analysisDate) : null,
    })
    setModalVisible(true)
  }

  // 处理删除
  const handleDelete = (id: string) => {
    setDataSource((prev) => prev.filter((item) => item.id !== id))
    message.success('删除成功')
  }

  // 处理保存
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const formData = {
        ...values,
        analysisDate: values.analysisDate?.format('YYYY-MM-DD') || '',
        averageSalary: (values.salaryMin + values.salaryMax) / 2,
      }

      if (editingRecord) {
        // 编辑
        setDataSource((prev) =>
          prev.map((item) =>
            item.id === editingRecord.id
              ? {
                  ...item,
                  ...formData,
                  serialNumber: editingRecord.serialNumber,
                  updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                }
              : item,
          ),
        )
        message.success('更新成功')
      } else {
        // 新增
        const newRecord: PositionAnalysisRecord = {
          id: Date.now().toString(),
          serialNumber: dataSource.length + 1,
          ...formData,
          createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        }
        setDataSource((prev) => [...prev, newRecord])
        message.success('添加成功')
      }

      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value)
  }

  // 过滤数据
  const filteredData = dataSource.filter(
    (item) =>
      item.positionName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.company.toLowerCase().includes(searchText.toLowerCase()) ||
      item.industry.toLowerCase().includes(searchText.toLowerCase()) ||
      item.location.toLowerCase().includes(searchText.toLowerCase()),
  )

  return (
    <div style={{ padding: 24 }}>
      <Card>
        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic
              title="总岗位数"
              value={statistics.totalPositions}
              suffix="个"
              prefix={<BarChartOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均薪资"
              value={statistics.averageSalary}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="高需求岗位"
              value={statistics.highDemandPositions}
              suffix="个"
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="高竞争岗位"
              value={statistics.highCompetitionPositions}
              suffix="个"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic
              title="高发展前景"
              value={statistics.highGrowthPositions}
              suffix="个"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="互联网岗位"
              value={statistics.internetPositions}
              suffix="个"
              prefix={<BarChartOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="金融岗位"
              value={statistics.financePositions}
              suffix="个"
              prefix={<BarChartOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="教育岗位"
              value={statistics.educationPositions}
              suffix="个"
              prefix={<BarChartOutlined />}
            />
          </Col>
        </Row>

        {/* 操作按钮 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加分析
            </Button>
          </Space>

          <Input.Search
            placeholder="搜索岗位名称、公司或行业"
            style={{ width: 300 }}
            onSearch={handleSearch}
            allowClear
          />
        </div>

        {/* 数据表格 */}
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          scroll={{ x: 2000 }}
          pagination={{
            total: filteredData.length,
            defaultPageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          bordered
          size="small"
        />
      </Card>

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑岗位分析' : '添加岗位分析'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        width={800}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            marketDemand: '中',
            competitionLevel: '中',
            growthProspect: '中',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="positionName"
                label="岗位名称"
                rules={[{ required: true, message: '请输入岗位名称' }]}
              >
                <Input placeholder="请输入岗位名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="industry"
                label="行业"
                rules={[{ required: true, message: '请输入行业' }]}
              >
                <Input placeholder="请输入行业" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="company"
                label="公司"
                rules={[{ required: true, message: '请输入公司' }]}
              >
                <Input placeholder="请输入公司" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="location"
                label="地点"
                rules={[{ required: true, message: '请输入地点' }]}
              >
                <Input placeholder="请输入地点" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="salaryMin"
                label="最低薪资"
                rules={[{ required: true, message: '请输入最低薪资' }]}
              >
                <Input type="number" placeholder="请输入最低薪资" addonBefore="¥" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="salaryMax"
                label="最高薪资"
                rules={[{ required: true, message: '请输入最高薪资' }]}
              >
                <Input type="number" placeholder="请输入最高薪资" addonBefore="¥" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="experience"
                label="经验要求"
                rules={[{ required: true, message: '请输入经验要求' }]}
              >
                <Input placeholder="请输入经验要求" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="education"
                label="学历要求"
                rules={[{ required: true, message: '请输入学历要求' }]}
              >
                <Select>
                  <Option value="高中">高中</Option>
                  <Option value="专科">专科</Option>
                  <Option value="本科">本科</Option>
                  <Option value="硕士">硕士</Option>
                  <Option value="博士">博士</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="analysisDate"
                label="分析日期"
                rules={[{ required: true, message: '请选择分析日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="skillRequirements"
            label="技能要求"
            rules={[{ required: true, message: '请输入技能要求' }]}
          >
            <TextArea placeholder="请输入技能要求" rows={3} />
          </Form.Item>

          <Form.Item
            name="jobDescription"
            label="岗位描述"
            rules={[{ required: true, message: '请输入岗位描述' }]}
          >
            <TextArea placeholder="请输入岗位描述" rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="marketDemand"
                label="市场需求"
                rules={[{ required: true, message: '请选择市场需求' }]}
              >
                <Select>
                  <Option value="高">高</Option>
                  <Option value="中">中</Option>
                  <Option value="低">低</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="competitionLevel"
                label="竞争程度"
                rules={[{ required: true, message: '请选择竞争程度' }]}
              >
                <Select>
                  <Option value="高">高</Option>
                  <Option value="中">中</Option>
                  <Option value="低">低</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="growthProspect"
                label="发展前景"
                rules={[{ required: true, message: '请选择发展前景' }]}
              >
                <Select>
                  <Option value="高">高</Option>
                  <Option value="中">中</Option>
                  <Option value="低">低</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="analyst"
                label="分析师"
                rules={[{ required: true, message: '请输入分析师' }]}
              >
                <Input placeholder="请输入分析师" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notes" label="备注">
                <Input placeholder="请输入备注" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default PositionAnalysisPage
