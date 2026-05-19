// 教学活动计划与总结表页面 (021)
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
  CalendarOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  BookOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select
const { Search } = Input
const { TextArea } = Input

// 教学活动计划数据接口
interface TeachingActivityPlan {
  id: string
  activityName: string
  activityType: string
  targetClass: string
  organizer: string
  planDate: string
  actualDate?: string
  duration: number
  participants: string[]
  objectives: string
  content: string
  methods: string
  resources: string
  expectedOutcomes: string
  actualOutcomes?: string
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled'
  feedback: string
  improvements: string
  nextPlan: string
  remarks: string
}

const TeachingActivityPlanPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<TeachingActivityPlan[]>([])
  const [filteredData, setFilteredData] = useState<TeachingActivityPlan[]>([])
  const [selectedRecord, setSelectedRecord] = useState<TeachingActivityPlan | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add'>('view')
  const [form] = Form.useForm()

  // 模拟教学活动计划数据
  const mockData: TeachingActivityPlan[] = [
    {
      id: '1',
      activityName: '前端项目实战训练',
      activityType: '实践教学',
      targetClass: 'S32107',
      organizer: '杜鹏涛',
      planDate: '2024-01-20',
      actualDate: '2024-01-20',
      duration: 4,
      participants: ['张三', '李四', '王五', '赵六'],
      objectives: '提升学员前端项目开发能力，掌握React框架实际应用',
      content: 'React项目开发、组件设计、状态管理、API调用',
      methods: '项目驱动教学、小组协作、代码评审',
      resources: '开发环境、项目模板、技术文档',
      expectedOutcomes: '学员能够独立完成前端项目开发',
      actualOutcomes: '学员完成率达到95%，项目质量良好',
      status: 'completed',
      feedback: '学员参与度高，项目完成质量超出预期',
      improvements: '增加更多实际项目案例，提供更详细的技术指导',
      nextPlan: '安排进阶项目，引入更多新技术',
      remarks: '活动效果良好，建议定期举办类似活动',
    },
    {
      id: '2',
      activityName: '就业指导讲座',
      activityType: '讲座培训',
      targetClass: 'S32108',
      organizer: '张志恒',
      planDate: '2024-01-25',
      duration: 2,
      participants: ['全体学员'],
      objectives: '提升学员就业竞争力，了解行业发展趋势',
      content: '简历制作、面试技巧、职业规划、行业分析',
      methods: '讲座讲解、案例分析、互动问答',
      resources: 'PPT课件、案例材料、行业报告',
      expectedOutcomes: '学员掌握就业技能，明确职业方向',
      status: 'planned',
      feedback: '',
      improvements: '',
      nextPlan: '安排一对一就业指导',
      remarks: '准备充分，期待良好效果',
    },
    {
      id: '3',
      activityName: '代码评审会',
      activityType: '技术交流',
      targetClass: 'S32107',
      organizer: '姜东亮',
      planDate: '2024-01-22',
      actualDate: '2024-01-22',
      duration: 2,
      participants: ['张三', '李四', '王五'],
      objectives: '提升代码质量，促进技术交流',
      content: '代码规范、最佳实践、性能优化',
      methods: '代码展示、集体讨论、专家点评',
      resources: '代码示例、评审标准、技术文档',
      expectedOutcomes: '学员代码质量显著提升',
      actualOutcomes: '发现并解决了多个代码问题',
      status: 'completed',
      feedback: '学员积极参与，技术讨论热烈',
      improvements: '增加更多实际案例，提供更详细的改进建议',
      nextPlan: '定期举办代码评审活动',
      remarks: '活动效果良好，建议增加频次',
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
      console.log('📊 教学活动计划数据加载完成')
    } catch (error) {
      console.error('❌ 加载教学活动计划数据失败:', error)
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

  const handleView = (record: TeachingActivityPlan) => {
    setSelectedRecord(record)
    setModalType('view')
    setModalVisible(true)
  }

  const handleEdit = (record: TeachingActivityPlan) => {
    setSelectedRecord(record)
    setModalType('edit')
    form.setFieldsValue({
      ...record,
      planDate: dayjs(record.planDate),
      actualDate: record.actualDate ? dayjs(record.actualDate) : null,
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
        const newRecord: TeachingActivityPlan = {
          id: Date.now().toString(),
          ...values,
          planDate: values.planDate.format('YYYY-MM-DD'),
          actualDate: values.actualDate ? values.actualDate.format('YYYY-MM-DD') : undefined,
        }
        setData([newRecord, ...data])
        setFilteredData([newRecord, ...filteredData])
        message.success('新增成功')
      } else if (modalType === 'edit' && selectedRecord) {
        const updatedRecord = {
          ...selectedRecord,
          ...values,
          planDate: values.planDate.format('YYYY-MM-DD'),
          actualDate: values.actualDate ? values.actualDate.format('YYYY-MM-DD') : undefined,
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
          item.activityName.toLowerCase().includes(value.toLowerCase()) ||
          item.targetClass.toLowerCase().includes(value.toLowerCase()) ||
          item.organizer.toLowerCase().includes(value.toLowerCase()),
      )
      setFilteredData(filtered)
    }
  }

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'planned':
        return <Tag color="blue">计划中</Tag>
      case 'in-progress':
        return <Tag color="orange">进行中</Tag>
      case 'completed':
        return <Tag color="green">已完成</Tag>
      case 'cancelled':
        return <Tag color="red">已取消</Tag>
      default:
        return <Tag color="default">未知</Tag>
    }
  }

  const getActivityTypeTag = (type: string) => {
    switch (type) {
      case '实践教学':
        return <Tag color="green">实践教学</Tag>
      case '讲座培训':
        return <Tag color="blue">讲座培训</Tag>
      case '技术交流':
        return <Tag color="orange">技术交流</Tag>
      case '其他':
        return <Tag color="purple">其他</Tag>
      default:
        return <Tag color="default">未知</Tag>
    }
  }

  const columns: ColumnsType<TeachingActivityPlan> = [
    {
      title: '活动名称',
      dataIndex: 'activityName',
      key: 'activityName',
      width: 150,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '活动类型',
      dataIndex: 'activityType',
      key: 'activityType',
      width: 100,
      align: 'center',
      render: (type: string) => getActivityTypeTag(type),
    },
    {
      title: '目标班级',
      dataIndex: 'targetClass',
      key: 'targetClass',
      width: 100,
      align: 'center',
    },
    {
      title: '组织者',
      dataIndex: 'organizer',
      key: 'organizer',
      width: 100,
      align: 'center',
    },
    {
      title: '计划日期',
      dataIndex: 'planDate',
      key: 'planDate',
      width: 120,
      align: 'center',
      sorter: (a, b) => dayjs(a.planDate).unix() - dayjs(b.planDate).unix(),
    },
    {
      title: '实际日期',
      dataIndex: 'actualDate',
      key: 'actualDate',
      width: 120,
      align: 'center',
      render: (date: string) => date || '-',
    },
    {
      title: '时长(小时)',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      align: 'center',
    },
    {
      title: '参与人数',
      key: 'participantCount',
      width: 100,
      align: 'center',
      render: (_, record) => record.participants.length,
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
    totalActivities: filteredData.length,
    plannedActivities: filteredData.filter((item) => item.status === 'planned').length,
    completedActivities: filteredData.filter((item) => item.status === 'completed').length,
    inProgressActivities: filteredData.filter((item) => item.status === 'in-progress').length,
    totalParticipants: filteredData.reduce((sum, item) => sum + item.participants.length, 0),
  }

  if (loading && data.length === 0) {
    return (
      <div className="text-center py-5">
        <Spin size="large" />
        <div className="mt-3">
          <Text type="secondary">加载教学活动计划数据中...</Text>
        </div>
      </div>
    )
  }

  return (
    <div className="teaching-activity-plan">
      {/* 页面标题 */}
      <div className="mb-4">
        <Title level={2}>
          <BookOutlined className="me-2" />
          教学活动计划与总结表
        </Title>
        <Text type="secondary">管理教学活动计划、执行和总结</Text>
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
              title="活动总数"
              value={stats.totalActivities}
              prefix={<BookOutlined className="text-primary" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="计划中"
              value={stats.plannedActivities}
              prefix={<CalendarOutlined className="text-warning" />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="已完成"
              value={stats.completedActivities}
              prefix={<CalendarOutlined className="text-success" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="总参与人数"
              value={stats.totalParticipants}
              prefix={<BookOutlined className="text-info" />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card className="mb-4">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Search placeholder="搜索活动名称、班级或组织者" onSearch={handleSearch} allowClear />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select placeholder="选择活动类型" style={{ width: '100%' }} allowClear>
              <Option value="实践教学">实践教学</Option>
              <Option value="讲座培训">讲座培训</Option>
              <Option value="技术交流">技术交流</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select placeholder="选择状态" style={{ width: '100%' }} allowClear>
              <Option value="planned">计划中</Option>
              <Option value="in-progress">进行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                刷新
              </Button>
              <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>
                新增活动
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

      {/* 教学活动计划数据表格 */}
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
          scroll={{ x: 1200 }}
          size="small"
          bordered
        />
      </Card>

      {/* 详情/编辑模态框 */}
      <Modal
        title={
          modalType === 'view' ? '查看详情' : modalType === 'edit' ? '编辑活动计划' : '新增活动计划'
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
              <Descriptions.Item label="活动名称">{selectedRecord.activityName}</Descriptions.Item>
              <Descriptions.Item label="活动类型">
                {getActivityTypeTag(selectedRecord.activityType)}
              </Descriptions.Item>
              <Descriptions.Item label="目标班级">{selectedRecord.targetClass}</Descriptions.Item>
              <Descriptions.Item label="组织者">{selectedRecord.organizer}</Descriptions.Item>
              <Descriptions.Item label="计划日期">{selectedRecord.planDate}</Descriptions.Item>
              <Descriptions.Item label="实际日期">
                {selectedRecord.actualDate || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="时长">{selectedRecord.duration}小时</Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusTag(selectedRecord.status)}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="活动详情" bordered column={1} style={{ marginTop: 16 }}>
              <Descriptions.Item label="参与人员">
                {selectedRecord.participants.join(', ')}
              </Descriptions.Item>
              <Descriptions.Item label="活动目标">{selectedRecord.objectives}</Descriptions.Item>
              <Descriptions.Item label="活动内容">{selectedRecord.content}</Descriptions.Item>
              <Descriptions.Item label="教学方法">{selectedRecord.methods}</Descriptions.Item>
              <Descriptions.Item label="所需资源">{selectedRecord.resources}</Descriptions.Item>
              <Descriptions.Item label="预期效果">
                {selectedRecord.expectedOutcomes}
              </Descriptions.Item>
              <Descriptions.Item label="实际效果">
                {selectedRecord.actualOutcomes || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="反馈意见">
                {selectedRecord.feedback || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="改进建议">
                {selectedRecord.improvements || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="后续计划">{selectedRecord.nextPlan}</Descriptions.Item>
              <Descriptions.Item label="备注">{selectedRecord.remarks}</Descriptions.Item>
            </Descriptions>
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="activityName"
                  label="活动名称"
                  rules={[{ required: true, message: '请输入活动名称' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="activityType"
                  label="活动类型"
                  rules={[{ required: true, message: '请选择活动类型' }]}
                >
                  <Select>
                    <Option value="实践教学">实践教学</Option>
                    <Option value="讲座培训">讲座培训</Option>
                    <Option value="技术交流">技术交流</Option>
                    <Option value="其他">其他</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="targetClass"
                  label="目标班级"
                  rules={[{ required: true, message: '请输入目标班级' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="organizer"
                  label="组织者"
                  rules={[{ required: true, message: '请输入组织者' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="planDate"
                  label="计划日期"
                  rules={[{ required: true, message: '请选择计划日期' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="actualDate" label="实际日期">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="duration"
                  label="时长(小时)"
                  rules={[{ required: true, message: '请输入时长' }]}
                >
                  <Input type="number" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="status"
                  label="状态"
                  rules={[{ required: true, message: '请选择状态' }]}
                >
                  <Select>
                    <Option value="planned">计划中</Option>
                    <Option value="in-progress">进行中</Option>
                    <Option value="completed">已完成</Option>
                    <Option value="cancelled">已取消</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="objectives"
              label="活动目标"
              rules={[{ required: true, message: '请输入活动目标' }]}
            >
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item
              name="content"
              label="活动内容"
              rules={[{ required: true, message: '请输入活动内容' }]}
            >
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item name="methods" label="教学方法">
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item name="resources" label="所需资源">
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item name="expectedOutcomes" label="预期效果">
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item name="actualOutcomes" label="实际效果">
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item name="feedback" label="反馈意见">
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item name="improvements" label="改进建议">
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item name="nextPlan" label="后续计划">
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
        message="教学活动计划说明"
        description={
          <div>
            <p>
              • <strong>活动类型</strong>：实践教学、讲座培训、技术交流、其他
            </p>
            <p>
              • <strong>状态管理</strong>：计划中、进行中、已完成、已取消
            </p>
            <p>
              • <strong>活动目标</strong>：明确活动的预期目标和效果
            </p>
            <p>
              • <strong>教学方法</strong>：记录采用的教学方法和手段
            </p>
            <p>
              • <strong>总结反馈</strong>：记录活动效果、反馈意见和改进建议
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

export default TeachingActivityPlanPage
