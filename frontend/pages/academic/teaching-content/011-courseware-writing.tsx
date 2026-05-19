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
  BookOutlined,
  FileTextOutlined,
  UserOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

// 课件编写数据类型
interface CoursewareWritingRecord {
  id: string
  serialNumber: number
  coursewareName: string
  subject: string
  author: string
  authorId: string
  startDate: string
  endDate: string
  progress: number
  status: '进行中' | '已完成' | '暂停' | '取消'
  difficulty: '初级' | '中级' | '高级'
  targetAudience: string
  description: string
  requirements: string
  notes: string
  createdAt?: string
  updatedAt?: string
}

// 表单数据类型
interface CoursewareWritingFormData {
  coursewareName: string
  subject: string
  author: string
  authorId: string
  startDate: dayjs.Dayjs | null
  endDate: dayjs.Dayjs | null
  progress: number
  status: '进行中' | '已完成' | '暂停' | '取消'
  difficulty: '初级' | '中级' | '高级'
  targetAudience: string
  description: string
  requirements: string
  notes: string
}

const CoursewareWritingPage: React.FC = () => {
  const { message } = App.useApp()
  const [dataSource, setDataSource] = useState<CoursewareWritingRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CoursewareWritingRecord | null>(null)
  const [form] = Form.useForm<CoursewareWritingFormData>()
  const [searchText, setSearchText] = useState('')

  // 模拟数据
  const mockData: CoursewareWritingRecord[] = [
    {
      id: '1',
      serialNumber: 1,
      coursewareName: 'React前端开发基础',
      subject: '前端开发',
      author: '张老师',
      authorId: 'T001',
      startDate: '2024-01-15',
      endDate: '2024-03-15',
      progress: 75,
      status: '进行中',
      difficulty: '中级',
      targetAudience: '有JavaScript基础的学生',
      description: 'React框架基础知识和实践应用',
      requirements: '掌握HTML、CSS、JavaScript基础',
      notes: '重点讲解组件化开发',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '2',
      serialNumber: 2,
      coursewareName: 'Java后端开发进阶',
      subject: '后端开发',
      author: '李老师',
      authorId: 'T002',
      startDate: '2024-02-01',
      endDate: '2024-04-01',
      progress: 100,
      status: '已完成',
      difficulty: '高级',
      targetAudience: '有Java基础的学生',
      description: 'Spring Boot微服务开发',
      requirements: '掌握Java基础、Spring框架',
      notes: '包含实战项目案例',
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
      title: '课件名称',
      dataIndex: 'coursewareName',
      key: 'coursewareName',
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
      render: (_, record: CoursewareWritingRecord) => (
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
    totalCourseware: dataSource.length,
    completedCourseware: dataSource.filter((item) => item.status === '已完成').length,
    inProgressCourseware: dataSource.filter((item) => item.status === '进行中').length,
    pausedCourseware: dataSource.filter((item) => item.status === '暂停').length,
    cancelledCourseware: dataSource.filter((item) => item.status === '取消').length,
    averageProgress:
      dataSource.length > 0
        ? Math.round(dataSource.reduce((sum, item) => sum + item.progress, 0) / dataSource.length)
        : 0,
    frontendCourseware: dataSource.filter((item) => item.subject === '前端开发').length,
    backendCourseware: dataSource.filter((item) => item.subject === '后端开发').length,
    otherCourseware: dataSource.filter((item) => !['前端开发', '后端开发'].includes(item.subject))
      .length,
  }

  // 处理添加
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 处理编辑
  const handleEdit = (record: CoursewareWritingRecord) => {
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
        const newRecord: CoursewareWritingRecord = {
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
      item.coursewareName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.author.toLowerCase().includes(searchText.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchText.toLowerCase()),
  )

  // 计算完成率
  const completionRate =
    statistics.totalCourseware > 0
      ? ((statistics.completedCourseware / statistics.totalCourseware) * 100).toFixed(1)
      : '0'

  return (
    <div style={{ padding: 24 }}>
      <Card>
        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic
              title="总课件数"
              value={statistics.totalCourseware}
              suffix="个"
              prefix={<BookOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="已完成"
              value={statistics.completedCourseware}
              suffix="个"
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="进行中"
              value={statistics.inProgressCourseware}
              suffix="个"
              prefix={<BookOutlined />}
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
              title="前端课件"
              value={statistics.frontendCourseware}
              suffix="个"
              prefix={<BookOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="后端课件"
              value={statistics.backendCourseware}
              suffix="个"
              prefix={<BookOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="其他课件"
              value={statistics.otherCourseware}
              suffix="个"
              prefix={<BookOutlined />}
            />
          </Col>
        </Row>

        {/* 操作按钮 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加课件
            </Button>
          </Space>

          <Input.Search
            placeholder="搜索课件名称、作者或学科"
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
        title={editingRecord ? '编辑课件编写' : '添加课件编写'}
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
                name="coursewareName"
                label="课件名称"
                rules={[{ required: true, message: '请输入课件名称' }]}
              >
                <Input placeholder="请输入课件名称" />
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

          <Form.Item
            name="description"
            label="课件描述"
            rules={[{ required: true, message: '请输入课件描述' }]}
          >
            <TextArea placeholder="请输入课件描述" rows={3} />
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

export default CoursewareWritingPage
