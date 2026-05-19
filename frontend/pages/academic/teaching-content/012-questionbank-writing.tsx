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
  QuestionCircleOutlined,
  FileTextOutlined,
  UserOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

// 题库编写数据类型
interface QuestionbankWritingRecord {
  id: string
  serialNumber: number
  questionbankName: string
  subject: string
  author: string
  authorId: string
  startDate: string
  endDate: string
  progress: number
  status: '进行中' | '已完成' | '暂停' | '取消'
  difficulty: '初级' | '中级' | '高级'
  questionCount: number
  completedCount: number
  questionTypes: string
  targetAudience: string
  description: string
  requirements: string
  notes: string
  createdAt?: string
  updatedAt?: string
}

// 表单数据类型
interface QuestionbankWritingFormData {
  questionbankName: string
  subject: string
  author: string
  authorId: string
  startDate: dayjs.Dayjs | null
  endDate: dayjs.Dayjs | null
  progress: number
  status: '进行中' | '已完成' | '暂停' | '取消'
  difficulty: '初级' | '中级' | '高级'
  questionCount: number
  completedCount: number
  questionTypes: string
  targetAudience: string
  description: string
  requirements: string
  notes: string
}

const QuestionbankWritingPage: React.FC = () => {
  const { message } = App.useApp()
  const [dataSource, setDataSource] = useState<QuestionbankWritingRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<QuestionbankWritingRecord | null>(null)
  const [form] = Form.useForm<QuestionbankWritingFormData>()
  const [searchText, setSearchText] = useState('')

  // 模拟数据
  const mockData: QuestionbankWritingRecord[] = [
    {
      id: '1',
      serialNumber: 1,
      questionbankName: 'JavaScript基础题库',
      subject: '前端开发',
      author: '张老师',
      authorId: 'T001',
      startDate: '2024-01-15',
      endDate: '2024-03-15',
      progress: 80,
      status: '进行中',
      difficulty: '中级',
      questionCount: 100,
      completedCount: 80,
      questionTypes: '选择题,填空题,编程题',
      targetAudience: '有JavaScript基础的学生',
      description: 'JavaScript基础知识和实践应用题库',
      requirements: '掌握HTML、CSS基础',
      notes: '重点考察基础语法和DOM操作',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '2',
      serialNumber: 2,
      questionbankName: 'Java后端开发题库',
      subject: '后端开发',
      author: '李老师',
      authorId: 'T002',
      startDate: '2024-02-01',
      endDate: '2024-04-01',
      progress: 100,
      status: '已完成',
      difficulty: '高级',
      questionCount: 150,
      completedCount: 150,
      questionTypes: '选择题,简答题,编程题,设计题',
      targetAudience: '有Java基础的学生',
      description: 'Spring Boot微服务开发题库',
      requirements: '掌握Java基础、Spring框架',
      notes: '包含实战项目案例题目',
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
      title: '题库名称',
      dataIndex: 'questionbankName',
      key: 'questionbankName',
      width: 200,
      ellipsis: true,
    },
    {
      title: '学科',
      dataIndex: 'subject',
      key: 'subject',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '作者ID',
      dataIndex: 'authorId',
      key: 'authorId',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '开始时间',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      align: 'center' as const,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '结束时间',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      align: 'center' as const,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      align: 'center' as const,
      render: (progress: number) => (
        <Progress
          percent={progress}
          size="small"
          strokeColor={progress >= 80 ? '#52c41a' : progress >= 60 ? '#faad14' : '#ff4d4f'}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => {
        const color =
          status === '已完成'
            ? 'green'
            : status === '进行中'
              ? 'blue'
              : status === '暂停'
                ? 'orange'
                : 'red'
        return <Tag color={color}>{status}</Tag>
      },
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 100,
      align: 'center' as const,
      render: (difficulty: string) => {
        const color = difficulty === '初级' ? 'green' : difficulty === '中级' ? 'orange' : 'red'
        return <Tag color={color}>{difficulty}</Tag>
      },
    },
    {
      title: '题目数量',
      key: 'questionCount',
      width: 120,
      align: 'center' as const,
      render: (_, record: QuestionbankWritingRecord) => (
        <div>
          <div>
            {record.completedCount}/{record.questionCount}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            完成率: {Math.round((record.completedCount / record.questionCount) * 100)}%
          </div>
        </div>
      ),
    },
    {
      title: '题目类型',
      dataIndex: 'questionTypes',
      key: 'questionTypes',
      width: 150,
      ellipsis: true,
    },
    {
      title: '目标受众',
      dataIndex: 'targetAudience',
      key: 'targetAudience',
      width: 150,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_, record: QuestionbankWritingRecord) => (
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
    totalQuestionbanks: dataSource.length,
    completedQuestionbanks: dataSource.filter((item) => item.status === '已完成').length,
    inProgressQuestionbanks: dataSource.filter((item) => item.status === '进行中').length,
    pausedQuestionbanks: dataSource.filter((item) => item.status === '暂停').length,
    cancelledQuestionbanks: dataSource.filter((item) => item.status === '取消').length,
    averageProgress:
      dataSource.length > 0
        ? Math.round(dataSource.reduce((sum, item) => sum + item.progress, 0) / dataSource.length)
        : 0,
    totalQuestions: dataSource.reduce((sum, item) => sum + item.questionCount, 0),
    completedQuestions: dataSource.reduce((sum, item) => sum + item.completedCount, 0),
    frontendQuestionbanks: dataSource.filter((item) => item.subject === '前端开发').length,
    backendQuestionbanks: dataSource.filter((item) => item.subject === '后端开发').length,
    otherQuestionbanks: dataSource.filter(
      (item) => !['前端开发', '后端开发'].includes(item.subject),
    ).length,
  }

  // 处理添加
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 处理编辑
  const handleEdit = (record: QuestionbankWritingRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      startDate: record.startDate ? dayjs(record.startDate) : null,
      endDate: record.endDate ? dayjs(record.endDate) : null,
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
        startDate: values.startDate?.format('YYYY-MM-DD') || '',
        endDate: values.endDate?.format('YYYY-MM-DD') || '',
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
        const newRecord: QuestionbankWritingRecord = {
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
      item.questionbankName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.author.toLowerCase().includes(searchText.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchText.toLowerCase()),
  )

  // 计算完成率
  const completionRate =
    statistics.totalQuestionbanks > 0
      ? ((statistics.completedQuestionbanks / statistics.totalQuestionbanks) * 100).toFixed(1)
      : '0'

  // 计算题目完成率
  const questionCompletionRate =
    statistics.totalQuestions > 0
      ? ((statistics.completedQuestions / statistics.totalQuestions) * 100).toFixed(1)
      : '0'

  return (
    <div style={{ padding: 24 }}>
      <Card>
        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic
              title="总题库数"
              value={statistics.totalQuestionbanks}
              suffix="个"
              prefix={<QuestionCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="已完成"
              value={statistics.completedQuestionbanks}
              suffix="个"
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="进行中"
              value={statistics.inProgressQuestionbanks}
              suffix="个"
              prefix={<QuestionCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均进度"
              value={statistics.averageProgress}
              suffix="%"
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="完成率"
                value={completionRate}
                suffix="%"
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <Progress
                percent={parseFloat(completionRate)}
                strokeColor="#52c41a"
                size="small"
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Statistic
              title="总题目数"
              value={statistics.totalQuestions}
              suffix="题"
              prefix={<QuestionCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="已完成题目"
              value={statistics.completedQuestions}
              suffix="题"
              prefix={<FileTextOutlined />}
            />
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="题目完成率"
                value={questionCompletionRate}
                suffix="%"
                prefix={<QuestionCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <Progress
                percent={parseFloat(questionCompletionRate)}
                strokeColor="#1890ff"
                size="small"
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Statistic
              title="前端题库"
              value={statistics.frontendQuestionbanks}
              suffix="个"
              prefix={<QuestionCircleOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="后端题库"
              value={statistics.backendQuestionbanks}
              suffix="个"
              prefix={<QuestionCircleOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="其他题库"
              value={statistics.otherQuestionbanks}
              suffix="个"
              prefix={<QuestionCircleOutlined />}
            />
          </Col>
        </Row>

        {/* 操作按钮 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加题库
            </Button>
          </Space>

          <Input.Search
            placeholder="搜索题库名称、作者或学科"
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
          scroll={{ x: 1500 }}
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
        title={editingRecord ? '编辑题库编写' : '添加题库编写'}
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
            status: '进行中',
            difficulty: '中级',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="questionbankName"
                label="题库名称"
                rules={[{ required: true, message: '请输入题库名称' }]}
              >
                <Input placeholder="请输入题库名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="subject"
                label="学科"
                rules={[{ required: true, message: '请输入学科' }]}
              >
                <Select>
                  <Option value="前端开发">前端开发</Option>
                  <Option value="后端开发">后端开发</Option>
                  <Option value="移动开发">移动开发</Option>
                  <Option value="数据分析">数据分析</Option>
                  <Option value="人工智能">人工智能</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="author"
                label="作者"
                rules={[{ required: true, message: '请输入作者' }]}
              >
                <Input placeholder="请输入作者" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="authorId"
                label="作者ID"
                rules={[{ required: true, message: '请输入作者ID' }]}
              >
                <Input placeholder="请输入作者ID" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="startDate"
                label="开始时间"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="endDate"
                label="结束时间"
                rules={[{ required: true, message: '请选择结束时间' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="progress"
                label="进度"
                rules={[{ required: true, message: '请输入进度' }]}
              >
                <Input type="number" placeholder="请输入进度" addonAfter="%" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select>
                  <Option value="进行中">进行中</Option>
                  <Option value="已完成">已完成</Option>
                  <Option value="暂停">暂停</Option>
                  <Option value="取消">取消</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="difficulty"
                label="难度"
                rules={[{ required: true, message: '请选择难度' }]}
              >
                <Select>
                  <Option value="初级">初级</Option>
                  <Option value="中级">中级</Option>
                  <Option value="高级">高级</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="targetAudience"
                label="目标受众"
                rules={[{ required: true, message: '请输入目标受众' }]}
              >
                <Input placeholder="请输入目标受众" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="questionCount"
                label="题目数量"
                rules={[{ required: true, message: '请输入题目数量' }]}
              >
                <Input type="number" placeholder="请输入题目数量" addonAfter="题" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="completedCount"
                label="已完成数量"
                rules={[{ required: true, message: '请输入已完成数量' }]}
              >
                <Input type="number" placeholder="请输入已完成数量" addonAfter="题" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="questionTypes"
                label="题目类型"
                rules={[{ required: true, message: '请输入题目类型' }]}
              >
                <Input placeholder="请输入题目类型" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="题库描述"
            rules={[{ required: true, message: '请输入题库描述' }]}
          >
            <TextArea placeholder="请输入题库描述" rows={3} />
          </Form.Item>

          <Form.Item
            name="requirements"
            label="前置要求"
            rules={[{ required: true, message: '请输入前置要求' }]}
          >
            <TextArea placeholder="请输入前置要求" rows={3} />
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <Input placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default QuestionbankWritingPage
