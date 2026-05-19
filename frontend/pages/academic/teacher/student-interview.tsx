// 学员访谈记录页面 (022)
import React, { useState, useEffect } from 'react'
import { App,
  Card,
  Table,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Spin,
  Tag,
  Select,
  Input,
  Form,
  Modal,
  DatePicker,
  Descriptions,
} from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select
const { Search } = Input
const { TextArea } = Input

// 学员访谈数据接口
interface StudentInterview {
  id: string
  studentName: string
  className: string
  interviewDate: string
  interviewer: string
  interviewType: string
  interviewContent: string
  studentFeedback: string
  issues: string
  solutions: string
  followUpPlan: string
  status: 'completed' | 'pending' | 'follow-up'
  priority: 'high' | 'medium' | 'low'
  nextInterviewDate?: string
  remarks: string
}

const StudentInterviewRecord: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<StudentInterview[]>([])
  const [filteredData, setFilteredData] = useState<StudentInterview[]>([])
  const [selectedRecord, setSelectedRecord] = useState<StudentInterview | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add'>('view')
  const [form] = Form.useForm()

  // 模拟学员访谈数据
  const mockData: StudentInterview[] = [
    {
      id: '1',
      studentName: '张三',
      className: 'S32107',
      interviewDate: '2024-01-15',
      interviewer: '杜鹏涛',
      interviewType: '学习状态访谈',
      interviewContent: '了解学员学习进度和遇到的困难，检查作业完成情况',
      studentFeedback: '学员反映课程进度较快，部分知识点理解不够深入，希望老师能够放慢节奏',
      issues: '学习进度跟不上，基础知识掌握不牢固',
      solutions: '安排课后辅导，提供额外练习材料，调整教学节奏',
      followUpPlan: '每周安排一次个别辅导，两周后再次访谈',
      status: 'completed',
      priority: 'high',
      nextInterviewDate: '2024-01-29',
      remarks: '学员学习态度积极，需要重点关注基础知识掌握',
    },
    {
      id: '2',
      studentName: '李四',
      className: 'S32107',
      interviewDate: '2024-01-16',
      interviewer: '杜鹏涛',
      interviewType: '就业指导访谈',
      interviewContent: '了解学员就业意向，提供就业指导建议',
      studentFeedback: '学员希望从事前端开发工作，对React框架比较感兴趣',
      issues: '缺乏实际项目经验，简历不够完善',
      solutions: '推荐参与实际项目，协助完善简历，提供面试指导',
      followUpPlan: '安排项目实践，一个月后检查简历完善情况',
      status: 'follow-up',
      priority: 'medium',
      nextInterviewDate: '2024-02-16',
      remarks: '学员目标明确，学习积极性高',
    },
    {
      id: '3',
      studentName: '王五',
      className: 'S32108',
      interviewDate: '2024-01-17',
      interviewer: '张志恒',
      interviewType: '心理状态访谈',
      interviewContent: '了解学员心理状态，关注是否有学习压力或生活困难',
      studentFeedback: '学员表示学习压力较大，担心跟不上进度，影响就业',
      issues: '学习压力大，自信心不足',
      solutions: '进行心理疏导，制定个性化学习计划，增强自信心',
      followUpPlan: '每周进行心理状态跟踪，提供学习支持',
      status: 'pending',
      priority: 'high',
      nextInterviewDate: '2024-01-24',
      remarks: '需要重点关注学员心理健康，及时提供支持',
    },
    {
      id: '4',
      studentName: '赵六',
      className: 'S32108',
      interviewDate: '2024-01-18',
      interviewer: '姜东亮',
      interviewType: '学习效果访谈',
      interviewContent: '评估学员学习效果，了解知识掌握情况',
      studentFeedback: '学员对课程内容掌握良好，能够独立完成项目作业',
      issues: '无重大问题，学习状态良好',
      solutions: '继续保持当前学习状态，可以适当增加挑战性内容',
      followUpPlan: '定期检查学习进度，提供进阶学习建议',
      status: 'completed',
      priority: 'low',
      nextInterviewDate: '2024-02-18',
      remarks: '学员表现优秀，可以作为学习榜样',
    },
  ]

  useEffect(() => {
    loadData()
  }, [currentCampus])

  const loadData = async () => {
    setLoading(true)
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setData(mockData)
      setFilteredData(mockData)
      console.log('📊 学员访谈记录数据加载完成')
    } catch (error) {
      console.error('❌ 加载学员访谈记录数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadData()
  }

  const handleExport = () => {
    message.success('导出成功')
  }

  const handleView = (record: StudentInterview) => {
    setSelectedRecord(record)
    setModalType('view')
    setModalVisible(true)
  }

  const handleEdit = (record: StudentInterview) => {
    setSelectedRecord(record)
    setModalType('edit')
    form.setFieldsValue({
      ...record,
      interviewDate: dayjs(record.interviewDate),
      nextInterviewDate: record.nextInterviewDate ? dayjs(record.nextInterviewDate) : null,
    })
    setModalVisible(true)
  }

  const handleAdd = () => {
    setSelectedRecord(null)
    setModalType('add')
    form.resetFields()
    setModalVisible(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      if (modalType === 'add') {
        const newRecord: StudentInterview = {
          id: Date.now().toString(),
          ...values,
          interviewDate: values.interviewDate.format('YYYY-MM-DD'),
          nextInterviewDate: values.nextInterviewDate
            ? values.nextInterviewDate.format('YYYY-MM-DD')
            : undefined,
        }
        setData([newRecord, ...data])
        setFilteredData([newRecord, ...filteredData])
        message.success('新增成功')
      } else if (modalType === 'edit' && selectedRecord) {
        const updatedRecord = {
          ...selectedRecord,
          ...values,
          interviewDate: values.interviewDate.format('YYYY-MM-DD'),
          nextInterviewDate: values.nextInterviewDate
            ? values.nextInterviewDate.format('YYYY-MM-DD')
            : undefined,
        }
        setData(data.map((item) => (item.id === selectedRecord.id ? updatedRecord : item)))
        setFilteredData(
          filteredData.map((item) => (item.id === selectedRecord.id ? updatedRecord : item)),
        )
        message.success('更新成功')
      }
      setModalVisible(false)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleSearch = (value: string) => {
    if (!value) {
      setFilteredData(data)
    } else {
      const filtered = data.filter(
        (item) =>
          item.studentName.toLowerCase().includes(value.toLowerCase()) ||
          item.className.toLowerCase().includes(value.toLowerCase()) ||
          item.interviewer.toLowerCase().includes(value.toLowerCase()),
      )
      setFilteredData(filtered)
    }
  }

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'completed':
        return <Tag color="green">已完成</Tag>
      case 'pending':
        return <Tag color="orange">待处理</Tag>
      case 'follow-up':
        return <Tag color="blue">跟进中</Tag>
      default:
        return <Tag color="default">未知</Tag>
    }
  }

  const getPriorityTag = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Tag color="red">高</Tag>
      case 'medium':
        return <Tag color="orange">中</Tag>
      case 'low':
        return <Tag color="green">低</Tag>
      default:
        return <Tag color="default">未知</Tag>
    }
  }

  const columns: ColumnsType<StudentInterview> = [
    {
      title: '学员姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 100,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '班级',
      dataIndex: 'className',
      key: 'className',
      width: 100,
      align: 'center',
    },
    {
      title: '访谈日期',
      dataIndex: 'interviewDate',
      key: 'interviewDate',
      width: 120,
      align: 'center',
      sorter: (a, b) => dayjs(a.interviewDate).unix() - dayjs(b.interviewDate).unix(),
    },
    {
      title: '访谈人',
      dataIndex: 'interviewer',
      key: 'interviewer',
      width: 100,
      align: 'center',
    },
    {
      title: '访谈类型',
      dataIndex: 'interviewType',
      key: 'interviewType',
      width: 120,
      align: 'center',
    },
    {
      title: '访谈内容',
      dataIndex: 'interviewContent',
      key: 'interviewContent',
      width: 200,
      ellipsis: true,
    },
    {
      title: '学员反馈',
      dataIndex: 'studentFeedback',
      key: 'studentFeedback',
      width: 200,
      ellipsis: true,
    },
    {
      title: '问题',
      dataIndex: 'issues',
      key: 'issues',
      width: 150,
      ellipsis: true,
    },
    {
      title: '解决方案',
      dataIndex: 'solutions',
      key: 'solutions',
      width: 150,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      align: 'center',
      render: (priority: string) => getPriorityTag(priority),
    },
    {
      title: '下次访谈',
      dataIndex: 'nextInterviewDate',
      key: 'nextInterviewDate',
      width: 120,
      align: 'center',
      render: (date: string) => date || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ]

  // 计算统计数据
  const stats = {
    totalInterviews: filteredData.length,
    completedInterviews: filteredData.filter((item) => item.status === 'completed').length,
    pendingInterviews: filteredData.filter((item) => item.status === 'pending').length,
    followUpInterviews: filteredData.filter((item) => item.status === 'follow-up').length,
    highPriorityInterviews: filteredData.filter((item) => item.priority === 'high').length,
  }

  if (loading && data.length === 0) {
    return (
      <div className="text-center py-5">
        <Spin size="large" />
        <div className="mt-3">
          <Text type="secondary">加载学员访谈记录数据中...</Text>
        </div>
      </div>
    )
  }

  return (
    <div className="student-interview-record">
      {/* 页面标题 */}
      <div className="mb-4">
        <Title level={2}>
          <UserOutlined className="me-2" />
          学员访谈记录
        </Title>
        <Text type="secondary">管理学员访谈记录和跟进情况</Text>
      </div>

      {/* 神殿信息提示 */}
      {currentCampus && (
        <Alert message={`当前神殿: ${currentCampus}`} type="info" showIcon className="mb-4" />
      )}

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="访谈总数"
              value={stats.totalInterviews}
              prefix={<UserOutlined className="text-primary" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="已完成"
              value={stats.completedInterviews}
              prefix={<CalendarOutlined className="text-success" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="待处理"
              value={stats.pendingInterviews}
              prefix={<CalendarOutlined className="text-warning" />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="跟进中"
              value={stats.followUpInterviews}
              prefix={<CalendarOutlined className="text-info" />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card className="mb-4">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Search placeholder="搜索学员姓名、班级或访谈人" onSearch={handleSearch} allowClear />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select placeholder="选择访谈类型" style={{ width: '100%' }} allowClear>
              <Option value="学习状态访谈">学习状态访谈</Option>
              <Option value="就业指导访谈">就业指导访谈</Option>
              <Option value="心理状态访谈">心理状态访谈</Option>
              <Option value="学习效果访谈">学习效果访谈</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select placeholder="选择状态" style={{ width: '100%' }} allowClear>
              <Option value="completed">已完成</Option>
              <Option value="pending">待处理</Option>
              <Option value="follow-up">跟进中</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                刷新
              </Button>
              <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>
                新增访谈
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 操作按钮 */}
      <Card className="mb-4">
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button icon={<DownloadOutlined />} onClick={handleExport}>
                导出Excel
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 访谈记录数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          scroll={{ x: 1800 }}
          size="small"
          bordered
        />
      </Card>

      {/* 详情/编辑模态框 */}
      <Modal
        title={
          modalType === 'view' ? '查看详情' : modalType === 'edit' ? '编辑访谈记录' : '新增访谈记录'
        }
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText={modalType === 'view' ? '关闭' : '确定'}
        cancelText="取消"
      >
        {modalType === 'view' && selectedRecord ? (
          <div>
            <Descriptions title="基本信息" bordered column={2}>
              <Descriptions.Item label="学员姓名">{selectedRecord.studentName}</Descriptions.Item>
              <Descriptions.Item label="班级">{selectedRecord.className}</Descriptions.Item>
              <Descriptions.Item label="访谈日期">{selectedRecord.interviewDate}</Descriptions.Item>
              <Descriptions.Item label="访谈人">{selectedRecord.interviewer}</Descriptions.Item>
              <Descriptions.Item label="访谈类型">{selectedRecord.interviewType}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusTag(selectedRecord.status)}
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                {getPriorityTag(selectedRecord.priority)}
              </Descriptions.Item>
              <Descriptions.Item label="下次访谈">
                {selectedRecord.nextInterviewDate || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="访谈内容" bordered column={1} style={{ marginTop: 16 }}>
              <Descriptions.Item label="访谈内容">
                {selectedRecord.interviewContent}
              </Descriptions.Item>
              <Descriptions.Item label="学员反馈">
                {selectedRecord.studentFeedback}
              </Descriptions.Item>
              <Descriptions.Item label="发现的问题">{selectedRecord.issues}</Descriptions.Item>
              <Descriptions.Item label="解决方案">{selectedRecord.solutions}</Descriptions.Item>
              <Descriptions.Item label="跟进计划">{selectedRecord.followUpPlan}</Descriptions.Item>
              <Descriptions.Item label="备注">{selectedRecord.remarks}</Descriptions.Item>
            </Descriptions>
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="studentName"
                  label="学员姓名"
                  rules={[{ required: true, message: '请输入学员姓名' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="className"
                  label="班级"
                  rules={[{ required: true, message: '请输入班级' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="interviewDate"
                  label="访谈日期"
                  rules={[{ required: true, message: '请选择访谈日期' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="interviewer"
                  label="访谈人"
                  rules={[{ required: true, message: '请输入访谈人' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="interviewType"
                  label="访谈类型"
                  rules={[{ required: true, message: '请选择访谈类型' }]}
                >
                  <Select>
                    <Option value="学习状态访谈">学习状态访谈</Option>
                    <Option value="就业指导访谈">就业指导访谈</Option>
                    <Option value="心理状态访谈">心理状态访谈</Option>
                    <Option value="学习效果访谈">学习效果访谈</Option>
                    <Option value="其他">其他</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="status"
                  label="状态"
                  rules={[{ required: true, message: '请选择状态' }]}
                >
                  <Select>
                    <Option value="completed">已完成</Option>
                    <Option value="pending">待处理</Option>
                    <Option value="follow-up">跟进中</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="priority"
                  label="优先级"
                  rules={[{ required: true, message: '请选择优先级' }]}
                >
                  <Select>
                    <Option value="high">高</Option>
                    <Option value="medium">中</Option>
                    <Option value="low">低</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="nextInterviewDate" label="下次访谈日期">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="interviewContent"
              label="访谈内容"
              rules={[{ required: true, message: '请输入访谈内容' }]}
            >
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item
              name="studentFeedback"
              label="学员反馈"
              rules={[{ required: true, message: '请输入学员反馈' }]}
            >
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item name="issues" label="发现的问题">
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item name="solutions" label="解决方案">
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item name="followUpPlan" label="跟进计划">
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item name="remarks" label="备注">
              <TextArea rows={3} />
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* 说明信息 */}
      <Alert
        message="访谈记录说明"
        description={
          <div>
            <p>
              • <strong>访谈类型</strong>：学习状态访谈、就业指导访谈、心理状态访谈、学习效果访谈等
            </p>
            <p>
              • <strong>状态管理</strong>：已完成、待处理、跟进中
            </p>
            <p>
              • <strong>优先级</strong>：高、中、低，用于安排访谈优先级
            </p>
            <p>
              • <strong>跟进计划</strong>：记录后续跟进措施和时间安排
            </p>
            <p>
              • <strong>问题解决</strong>：记录发现的问题和相应的解决方案
            </p>
          </div>
        }
        type="info"
        showIcon
        className="mt-4"
      />
    </div>
  )
}

export default StudentInterviewRecord
