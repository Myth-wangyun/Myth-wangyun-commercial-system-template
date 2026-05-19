// 会议记录表页面 (031)
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
  TimePicker,
} from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  CalendarOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select
const { Search } = Input
const { TextArea } = Input

// 会议记录数据接口
interface MeetingRecord {
  id: string
  meetingTitle: string
  meetingType: string
  meetingDate: string
  startTime: string
  endTime: string
  location: string
  organizer: string
  attendees: string[]
  absentees: string[]
  meetingPurpose: string
  agenda: string[]
  discussionPoints: string
  decisions: string
  actionItems: ActionItem[]
  nextMeetingDate?: string
  meetingStatus: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  importance: 'high' | 'medium' | 'low'
  remarks: string
}

// 行动项接口
interface ActionItem {
  id: string
  description: string
  assignee: string
  deadline: string
  status: 'pending' | 'in-progress' | 'completed'
  priority: 'high' | 'medium' | 'low'
}

const MeetingRecordPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<MeetingRecord[]>([])
  const [filteredData, setFilteredData] = useState<MeetingRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<MeetingRecord | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add'>('view')
  const [form] = Form.useForm()

  // 模拟会议记录数据
  const mockData: MeetingRecord[] = [
    {
      id: '1',
      meetingTitle: '智慧司月度工作总结会议',
      meetingType: '工作总结',
      meetingDate: '2024-01-15',
      startTime: '14:00',
      endTime: '16:00',
      location: '会议室A',
      organizer: '学术经理',
      attendees: ['杜鹏涛', '张志恒', '姜东亮', '温强', '张丽亚'],
      absentees: ['党彦春'],
      meetingPurpose: '总结上月工作成果，分析存在问题，制定下月工作计划',
      agenda: [
        '上月工作总结汇报',
        '教学质量分析',
        '学员就业情况汇报',
        '存在问题讨论',
        '下月工作计划制定',
      ],
      discussionPoints: '重点讨论了教学质量提升、学员就业率改善、教员培训需求等问题',
      decisions: '决定加强教员培训，优化课程设置，建立学员就业跟踪机制',
      actionItems: [
        {
          id: '1',
          description: '制定教员培训计划',
          assignee: '杜鹏涛',
          deadline: '2024-01-25',
          status: 'pending',
          priority: 'high',
        },
        {
          id: '2',
          description: '优化课程设置方案',
          assignee: '张志恒',
          deadline: '2024-01-30',
          status: 'pending',
          priority: 'medium',
        },
        {
          id: '3',
          description: '建立就业跟踪系统',
          assignee: '姜东亮',
          deadline: '2024-02-05',
          status: 'pending',
          priority: 'high',
        },
      ],
      nextMeetingDate: '2024-02-15',
      meetingStatus: 'completed',
      importance: 'high',
      remarks: '会议效果良好，各项决议得到有效落实',
    },
    {
      id: '2',
      meetingTitle: '教学质量提升专题会议',
      meetingType: '专题讨论',
      meetingDate: '2024-01-20',
      startTime: '10:00',
      endTime: '12:00',
      location: '会议室B',
      organizer: '学术经理',
      attendees: ['杜鹏涛', '张志恒', '姜东亮'],
      absentees: [],
      meetingPurpose: '讨论教学质量提升的具体措施和方法',
      agenda: ['教学质量现状分析', '问题识别和原因分析', '改进措施讨论', '实施计划制定'],
      discussionPoints: '深入分析了当前教学质量存在的问题，包括教学方法、课程内容、评估体系等方面',
      decisions: '决定引入新的教学方法，更新课程内容，完善评估体系',
      actionItems: [
        {
          id: '4',
          description: '调研新的教学方法',
          assignee: '杜鹏涛',
          deadline: '2024-01-28',
          status: 'in-progress',
          priority: 'high',
        },
        {
          id: '5',
          description: '更新课程大纲',
          assignee: '张志恒',
          deadline: '2024-02-10',
          status: 'pending',
          priority: 'medium',
        },
      ],
      nextMeetingDate: '2024-02-20',
      meetingStatus: 'completed',
      importance: 'high',
      remarks: '专题讨论深入，形成了具体的改进方案',
    },
    {
      id: '3',
      meetingTitle: '教员培训需求调研会议',
      meetingType: '调研会议',
      meetingDate: '2024-01-25',
      startTime: '15:00',
      endTime: '17:00',
      location: '会议室A',
      organizer: '学术经理',
      attendees: ['全体教员'],
      absentees: [],
      meetingPurpose: '了解教员培训需求，制定培训计划',
      agenda: ['教员培训需求调研', '培训内容讨论', '培训方式选择', '培训时间安排'],
      discussionPoints: '教员们提出了技术更新、教学方法、管理技能等方面的培训需求',
      decisions: '决定组织技术培训、教学方法培训和管理技能培训',
      actionItems: [
        {
          id: '6',
          description: '制定技术培训计划',
          assignee: '杜鹏涛',
          deadline: '2024-02-01',
          status: 'pending',
          priority: 'high',
        },
        {
          id: '7',
          description: '联系外部培训机构',
          assignee: '学术经理',
          deadline: '2024-02-05',
          status: 'pending',
          priority: 'medium',
        },
      ],
      meetingStatus: 'completed',
      importance: 'medium',
      remarks: '教员参与度高，培训需求明确',
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
      console.log('📊 会议记录数据加载完成')
    } catch (error) {
      console.error('❌ 加载会议记录数据失败:', error)
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

  const handleView = (record: MeetingRecord) => {
    setSelectedRecord(record)
    setModalType('view')
    setModalVisible(true)
  }

  const handleEdit = (record: MeetingRecord) => {
    setSelectedRecord(record)
    setModalType('edit')
    form.setFieldsValue({
      ...record,
      meetingDate: dayjs(record.meetingDate),
      nextMeetingDate: record.nextMeetingDate ? dayjs(record.nextMeetingDate) : null,
      startTime: dayjs(record.startTime, 'HH:mm'),
      endTime: dayjs(record.endTime, 'HH:mm'),
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
        const newRecord: MeetingRecord = {
          id: Date.now().toString(),
          ...values,
          meetingDate: values.meetingDate.format('YYYY-MM-DD'),
          nextMeetingDate: values.nextMeetingDate
            ? values.nextMeetingDate.format('YYYY-MM-DD')
            : undefined,
          startTime: values.startTime.format('HH:mm'),
          endTime: values.endTime.format('HH:mm'),
        }
        setData([newRecord, ...data])
        setFilteredData([newRecord, ...filteredData])
        message.success('新增成功')
      } else if (modalType === 'edit' && selectedRecord) {
        const updatedRecord = {
          ...selectedRecord,
          ...values,
          meetingDate: values.meetingDate.format('YYYY-MM-DD'),
          nextMeetingDate: values.nextMeetingDate
            ? values.nextMeetingDate.format('YYYY-MM-DD')
            : undefined,
          startTime: values.startTime.format('HH:mm'),
          endTime: values.endTime.format('HH:mm'),
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
          item.meetingTitle.toLowerCase().includes(value.toLowerCase()) ||
          item.organizer.toLowerCase().includes(value.toLowerCase()) ||
          item.location.toLowerCase().includes(value.toLowerCase()),
      )
      setFilteredData(filtered)
    }
  }

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Tag color="blue">已安排</Tag>
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

  const getTypeTag = (type: string) => {
    switch (type) {
      case '工作总结':
        return <Tag color="blue">工作总结</Tag>
      case '专题讨论':
        return <Tag color="green">专题讨论</Tag>
      case '调研会议':
        return <Tag color="orange">调研会议</Tag>
      case '培训会议':
        return <Tag color="purple">培训会议</Tag>
      case '其他':
        return <Tag color="default">其他</Tag>
      default:
        return <Tag color="default">未知</Tag>
    }
  }

  const getImportanceTag = (importance: string) => {
    switch (importance) {
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

  const getActionStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="orange">待处理</Tag>
      case 'in-progress':
        return <Tag color="blue">进行中</Tag>
      case 'completed':
        return <Tag color="green">已完成</Tag>
      default:
        return <Tag color="default">未知</Tag>
    }
  }

  const columns: ColumnsType<MeetingRecord> = [
    {
      title: '会议标题',
      dataIndex: 'meetingTitle',
      key: 'meetingTitle',
      width: 200,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '会议类型',
      dataIndex: 'meetingType',
      key: 'meetingType',
      width: 120,
      align: 'center',
      render: (type: string) => getTypeTag(type),
    },
    {
      title: '会议日期',
      dataIndex: 'meetingDate',
      key: 'meetingDate',
      width: 120,
      align: 'center',
      sorter: (a, b) => dayjs(a.meetingDate).unix() - dayjs(b.meetingDate).unix(),
    },
    {
      title: '时间',
      key: 'time',
      width: 120,
      align: 'center',
      render: (_, record) => `${record.startTime} - ${record.endTime}`,
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
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
      title: '参会人数',
      key: 'attendeeCount',
      width: 100,
      align: 'center',
      render: (_, record) => record.attendees.length,
    },
    {
      title: '缺席人数',
      key: 'absenteeCount',
      width: 100,
      align: 'center',
      render: (_, record) => record.absentees.length,
    },
    {
      title: '状态',
      dataIndex: 'meetingStatus',
      key: 'meetingStatus',
      width: 100,
      align: 'center',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '重要性',
      dataIndex: 'importance',
      key: 'importance',
      width: 80,
      align: 'center',
      render: (importance: string) => getImportanceTag(importance),
    },
    {
      title: '下次会议',
      dataIndex: 'nextMeetingDate',
      key: 'nextMeetingDate',
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
    totalMeetings: filteredData.length,
    completedMeetings: filteredData.filter((item) => item.meetingStatus === 'completed').length,
    scheduledMeetings: filteredData.filter((item) => item.meetingStatus === 'scheduled').length,
    highImportanceMeetings: filteredData.filter((item) => item.importance === 'high').length,
    totalActionItems: filteredData.reduce((sum, item) => sum + item.actionItems.length, 0),
  }

  if (loading && data.length === 0) {
    return (
      <div className="text-center py-5">
        <Spin size="large" />
        <div className="mt-3">
          <Text type="secondary">加载会议记录数据中...</Text>
        </div>
      </div>
    )
  }

  return (
    <div className="meeting-record">
      {/* 页面标题 */}
      <div className="mb-4">
        <Title level={2}>
          <TeamOutlined className="me-2" />
          会议记录表
        </Title>
        <Text type="secondary">管理智慧司会议记录和行动项跟踪</Text>
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
              title="会议总数"
              value={stats.totalMeetings}
              prefix={<TeamOutlined className="text-primary" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="已完成"
              value={stats.completedMeetings}
              prefix={<CalendarOutlined className="text-success" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="已安排"
              value={stats.scheduledMeetings}
              prefix={<CalendarOutlined className="text-warning" />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="行动项总数"
              value={stats.totalActionItems}
              prefix={<TeamOutlined className="text-info" />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card className="mb-4">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Search placeholder="搜索会议标题、组织者或地点" onSearch={handleSearch} allowClear />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select placeholder="选择会议类型" style={{ width: '100%' }} allowClear>
              <Option value="工作总结">工作总结</Option>
              <Option value="专题讨论">专题讨论</Option>
              <Option value="调研会议">调研会议</Option>
              <Option value="培训会议">培训会议</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select placeholder="选择状态" style={{ width: '100%' }} allowClear>
              <Option value="scheduled">已安排</Option>
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
                新增会议
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

      {/* 会议记录数据表格 */}
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
          scroll={{ x: 1500 }}
          size="small"
          bordered
        />
      </Card>

      {/* 详情/编辑模态框 */}
      <Modal
        title={
          modalType === 'view' ? '查看详情' : modalType === 'edit' ? '编辑会议记录' : '新增会议记录'
        }
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={1000}
        okText={modalType === 'view' ? '关闭' : '确定'}
        cancelText="取消"
      >
        {modalType === 'view' && selectedRecord ? (
          <div>
            <Descriptions title="基本信息" bordered column={2}>
              <Descriptions.Item label="会议标题">{selectedRecord.meetingTitle}</Descriptions.Item>
              <Descriptions.Item label="会议类型">
                {getTypeTag(selectedRecord.meetingType)}
              </Descriptions.Item>
              <Descriptions.Item label="会议日期">{selectedRecord.meetingDate}</Descriptions.Item>
              <Descriptions.Item label="会议时间">
                {selectedRecord.startTime} - {selectedRecord.endTime}
              </Descriptions.Item>
              <Descriptions.Item label="会议地点">{selectedRecord.location}</Descriptions.Item>
              <Descriptions.Item label="组织者">{selectedRecord.organizer}</Descriptions.Item>
              <Descriptions.Item label="参会人员">
                {selectedRecord.attendees.join(', ')}
              </Descriptions.Item>
              <Descriptions.Item label="缺席人员">
                {selectedRecord.absentees.join(', ') || '无'}
              </Descriptions.Item>
              <Descriptions.Item label="会议状态">
                {getStatusTag(selectedRecord.meetingStatus)}
              </Descriptions.Item>
              <Descriptions.Item label="重要性">
                {getImportanceTag(selectedRecord.importance)}
              </Descriptions.Item>
              <Descriptions.Item label="下次会议">
                {selectedRecord.nextMeetingDate || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="会议内容" bordered column={1} style={{ marginTop: 16 }}>
              <Descriptions.Item label="会议目的">
                {selectedRecord.meetingPurpose}
              </Descriptions.Item>
              <Descriptions.Item label="会议议程">
                <ul>
                  {selectedRecord.agenda.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </Descriptions.Item>
              <Descriptions.Item label="讨论要点">
                {selectedRecord.discussionPoints}
              </Descriptions.Item>
              <Descriptions.Item label="会议决议">{selectedRecord.decisions}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <Title level={5}>行动项</Title>
              <Table
                dataSource={selectedRecord.actionItems}
                columns={[
                  { title: '描述', dataIndex: 'description', key: 'description' },
                  { title: '负责人', dataIndex: 'assignee', key: 'assignee' },
                  { title: '截止日期', dataIndex: 'deadline', key: 'deadline' },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status: string) => getActionStatusTag(status),
                  },
                  {
                    title: '优先级',
                    dataIndex: 'priority',
                    key: 'priority',
                    render: (priority: string) => getImportanceTag(priority),
                  },
                ]}
                pagination={false}
                size="small"
                bordered
              />
            </div>

            <Descriptions title="备注" bordered column={1} style={{ marginTop: 16 }}>
              <Descriptions.Item label="备注">{selectedRecord.remarks}</Descriptions.Item>
            </Descriptions>
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="meetingTitle"
                  label="会议标题"
                  rules={[{ required: true, message: '请输入会议标题' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="meetingType"
                  label="会议类型"
                  rules={[{ required: true, message: '请选择会议类型' }]}
                >
                  <Select>
                    <Option value="工作总结">工作总结</Option>
                    <Option value="专题讨论">专题讨论</Option>
                    <Option value="调研会议">调研会议</Option>
                    <Option value="培训会议">培训会议</Option>
                    <Option value="其他">其他</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="meetingDate"
                  label="会议日期"
                  rules={[{ required: true, message: '请选择会议日期' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="startTime"
                  label="开始时间"
                  rules={[{ required: true, message: '请选择开始时间' }]}
                >
                  <TimePicker style={{ width: '100%' }} format="HH:mm" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="endTime"
                  label="结束时间"
                  rules={[{ required: true, message: '请选择结束时间' }]}
                >
                  <TimePicker style={{ width: '100%' }} format="HH:mm" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="location"
                  label="会议地点"
                  rules={[{ required: true, message: '请输入会议地点' }]}
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
                  name="meetingStatus"
                  label="会议状态"
                  rules={[{ required: true, message: '请选择会议状态' }]}
                >
                  <Select>
                    <Option value="scheduled">已安排</Option>
                    <Option value="in-progress">进行中</Option>
                    <Option value="completed">已完成</Option>
                    <Option value="cancelled">已取消</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="importance"
                  label="重要性"
                  rules={[{ required: true, message: '请选择重要性' }]}
                >
                  <Select>
                    <Option value="high">高</Option>
                    <Option value="medium">中</Option>
                    <Option value="low">低</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="meetingPurpose"
              label="会议目的"
              rules={[{ required: true, message: '请输入会议目的' }]}
            >
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item name="discussionPoints" label="讨论要点">
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item name="decisions" label="会议决议">
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item name="nextMeetingDate" label="下次会议日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="remarks" label="备注">
              <TextArea rows={3} />
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* 说明信息 */}
      <Alert
        message="会议记录说明"
        description={
          <div>
            <p>
              • <strong>会议类型</strong>：工作总结、专题讨论、调研会议、培训会议等
            </p>
            <p>
              • <strong>会议状态</strong>：已安排、进行中、已完成、已取消
            </p>
            <p>
              • <strong>重要性</strong>：高、中、低，用于会议优先级管理
            </p>
            <p>
              • <strong>行动项</strong>：记录会议产生的具体行动项和责任人
            </p>
            <p>
              • <strong>跟踪机制</strong>：通过行动项跟踪确保会议决议得到落实
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

export default MeetingRecordPage
