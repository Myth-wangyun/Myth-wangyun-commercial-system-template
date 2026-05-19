// 教员日工单管理页面 (030)
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
  Progress,
  Tag,
  DatePicker,
  Select,
  Input,
  Form,
  Modal,
  Descriptions,
} from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  CalendarOutlined,
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select
const { Search } = Input
const { TextArea } = Input

// 日工单数据接口
interface DailyWorkRecord {
  id: string
  date: string
  dayOfWeek: string
  className: string
  executor: string
  attendance: {
    shouldAttend: number
    actualAttend: number
    absent: number
    attendanceRate: number
  }
  homework: {
    shouldSubmit: number
    actualSubmit: number
    notSubmit: number
    submitRate: number
    passRate: number
  }
  studentLearningStatus: string
  studentInterviewStatus: string
  communicationWithTeacher: string
  reputationStatus: string
  otherStatus: string
  tasks: DailyTask[]
}

// 日常任务接口
interface DailyTask {
  id: string
  taskName: string
  taskDescription: string
  taskGoal: string
  executionTime: string
  deadline: string
  result: string
}

const TeacherDailyWork: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<DailyWorkRecord[]>([])
  const [filteredData, setFilteredData] = useState<DailyWorkRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<DailyWorkRecord | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add'>('view')
  const [form] = Form.useForm()

  // 模拟日工单数据
  const mockData: DailyWorkRecord[] = [
    {
      id: '1',
      date: '2022-12-05',
      dayOfWeek: '周一',
      className: 'S32107',
      executor: '杜鹏涛',
      attendance: {
        shouldAttend: 25,
        actualAttend: 24,
        absent: 1,
        attendanceRate: 96.0,
      },
      homework: {
        shouldSubmit: 25,
        actualSubmit: 24,
        notSubmit: 1,
        submitRate: 96.0,
        passRate: 95.8,
      },
      studentLearningStatus: '学员学习状态良好，课堂参与度高',
      studentInterviewStatus: '已完成3名学员访谈，发现1名学员需要重点关注',
      communicationWithTeacher: '与班主任沟通顺畅，及时反馈学员情况',
      reputationStatus: '口碑情况良好，有2名学员推荐新学员',
      otherStatus: '无其他特殊情况',
      tasks: [
        {
          id: '1',
          taskName: '课堂管理',
          taskDescription: '维持课堂秩序，确保教学质量',
          taskGoal: '保证95%以上出勤率',
          executionTime: '全天',
          deadline: '当日',
          result: '完成，出勤率96%',
        },
        {
          id: '2',
          taskName: '作业批改',
          taskDescription: '批改学员作业，提供反馈',
          taskGoal: '当日完成批改',
          executionTime: '2小时',
          deadline: '当日',
          result: '完成，合格率95.8%',
        },
      ],
    },
    {
      id: '2',
      date: '2022-12-06',
      dayOfWeek: '周二',
      className: 'S32107',
      executor: '杜鹏涛',
      attendance: {
        shouldAttend: 25,
        actualAttend: 25,
        absent: 0,
        attendanceRate: 100.0,
      },
      homework: {
        shouldSubmit: 25,
        actualSubmit: 25,
        notSubmit: 0,
        submitRate: 100.0,
        passRate: 96.0,
      },
      studentLearningStatus: '学员学习积极性高，课堂互动良好',
      studentInterviewStatus: '完成2名学员访谈，学员反馈积极',
      communicationWithTeacher: '与班主任讨论学员学习计划',
      reputationStatus: '口碑持续良好',
      otherStatus: '无特殊情况',
      tasks: [
        {
          id: '3',
          taskName: '课程教学',
          taskDescription: '完成当日课程内容教学',
          taskGoal: '确保学员理解掌握',
          executionTime: '4小时',
          deadline: '当日',
          result: '完成，学员掌握度良好',
        },
      ],
    },
    {
      id: '3',
      date: '2022-12-07',
      dayOfWeek: '周三',
      className: 'S32107',
      executor: '杜鹏涛',
      attendance: {
        shouldAttend: 25,
        actualAttend: 23,
        absent: 2,
        attendanceRate: 92.0,
      },
      homework: {
        shouldSubmit: 25,
        actualSubmit: 23,
        notSubmit: 2,
        submitRate: 92.0,
        passRate: 91.3,
      },
      studentLearningStatus: '部分学员学习状态有所下降，需要关注',
      studentInterviewStatus: '完成1名学员访谈，了解学习困难',
      communicationWithTeacher: '与班主任沟通学员状态变化',
      reputationStatus: '口碑保持稳定',
      otherStatus: '2名学员请假，已做好补课安排',
      tasks: [
        {
          id: '4',
          taskName: '学员关怀',
          taskDescription: '关注学习状态下降的学员',
          taskGoal: '帮助学员恢复学习状态',
          executionTime: '1小时',
          deadline: '本周内',
          result: '进行中，已安排个别辅导',
        },
      ],
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
      console.log('📊 教员日工单数据加载完成')
    } catch (error) {
      console.error('❌ 加载教员日工单数据失败:', error)
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

  const handleView = (record: DailyWorkRecord) => {
    setSelectedRecord(record)
    setModalType('view')
    setModalVisible(true)
  }

  const handleEdit = (record: DailyWorkRecord) => {
    setSelectedRecord(record)
    setModalType('edit')
    form.setFieldsValue({
      ...record,
      date: dayjs(record.date),
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
        const newRecord: DailyWorkRecord = {
          id: Date.now().toString(),
          ...values,
          date: values.date.format('YYYY-MM-DD'),
        }
        setData([newRecord, ...data])
        setFilteredData([newRecord, ...filteredData])
        message.success('新增成功')
      } else if (modalType === 'edit' && selectedRecord) {
        const updatedRecord = {
          ...selectedRecord,
          ...values,
          date: values.date.format('YYYY-MM-DD'),
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
          item.className.toLowerCase().includes(value.toLowerCase()) ||
          item.executor.toLowerCase().includes(value.toLowerCase()),
      )
      setFilteredData(filtered)
    }
  }

  const handleDateRangeChange = (dates: any) => {
    if (!dates || dates.length === 0) {
      setFilteredData(data)
    } else {
      const [start, end] = dates
      const filtered = data.filter((item) => {
        const itemDate = dayjs(item.date)
        return itemDate.isAfter(start.subtract(1, 'day')) && itemDate.isBefore(end.add(1, 'day'))
      })
      setFilteredData(filtered)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 95) return '#52c41a'
    if (score >= 85) return '#faad14'
    if (score >= 70) return '#fa8c16'
    return '#ff4d4f'
  }

  const columns: ColumnsType<DailyWorkRecord> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      align: 'center',
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: '星期',
      dataIndex: 'dayOfWeek',
      key: 'dayOfWeek',
      width: 80,
      align: 'center',
    },
    {
      title: '班级',
      dataIndex: 'className',
      key: 'className',
      width: 100,
      align: 'center',
    },
    {
      title: '执行人',
      dataIndex: 'executor',
      key: 'executor',
      width: 100,
      align: 'center',
    },
    {
      title: '出勤情况',
      key: 'attendance',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <div>
          <div>应出勤: {record.attendance.shouldAttend}人</div>
          <div>实际出勤: {record.attendance.actualAttend}人</div>
          <div>
            出勤率:
            <Progress
              percent={record.attendance.attendanceRate}
              size="small"
              strokeColor={getScoreColor(record.attendance.attendanceRate)}
              showInfo={false}
            />
            <Text style={{ color: getScoreColor(record.attendance.attendanceRate) }}>
              {record.attendance.attendanceRate}%
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: '作业情况',
      key: 'homework',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <div>
          <div>应交: {record.homework.shouldSubmit}人</div>
          <div>实际交: {record.homework.actualSubmit}人</div>
          <div>
            提交率:
            <Progress
              percent={record.homework.submitRate}
              size="small"
              strokeColor={getScoreColor(record.homework.submitRate)}
              showInfo={false}
            />
            <Text style={{ color: getScoreColor(record.homework.submitRate) }}>
              {record.homework.submitRate}%
            </Text>
          </div>
          <div>
            合格率:
            <Text style={{ color: getScoreColor(record.homework.passRate) }}>
              {record.homework.passRate}%
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: '学员学习状态',
      dataIndex: 'studentLearningStatus',
      key: 'studentLearningStatus',
      width: 200,
      ellipsis: true,
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
    totalRecords: filteredData.length,
    avgAttendanceRate:
      filteredData.length > 0
        ? filteredData.reduce((sum, item) => sum + item.attendance.attendanceRate, 0) /
          filteredData.length
        : 0,
    avgHomeworkSubmitRate:
      filteredData.length > 0
        ? filteredData.reduce((sum, item) => sum + item.homework.submitRate, 0) /
          filteredData.length
        : 0,
    avgHomeworkPassRate:
      filteredData.length > 0
        ? filteredData.reduce((sum, item) => sum + item.homework.passRate, 0) / filteredData.length
        : 0,
  }

  if (loading && data.length === 0) {
    return (
      <div className="text-center py-5">
        <Spin size="large" />
        <div className="mt-3">
          <Text type="secondary">加载教员日工单数据中...</Text>
        </div>
      </div>
    )
  }

  return (
    <div className="teacher-daily-work">
      {/* 页面标题 */}
      <div className="mb-4">
        <Title level={2}>
          <CalendarOutlined className="me-2" />
          教员日工单管理
        </Title>
        <Text type="secondary">管理教员日常工作总结和任务记录</Text>
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
              title="记录总数"
              value={stats.totalRecords}
              prefix={<CalendarOutlined className="text-primary" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="平均出勤率"
              value={stats.avgAttendanceRate}
              suffix="%"
              prefix={<UserOutlined className="text-success" />}
              valueStyle={{ color: '#52c41a' }}
              precision={1}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="平均作业提交率"
              value={stats.avgHomeworkSubmitRate}
              suffix="%"
              prefix={<CalendarOutlined className="text-warning" />}
              valueStyle={{ color: '#faad14' }}
              precision={1}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="平均作业合格率"
              value={stats.avgHomeworkPassRate}
              suffix="%"
              prefix={<CalendarOutlined className="text-info" />}
              valueStyle={{ color: '#13c2c2' }}
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card className="mb-4">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Search placeholder="搜索班级或执行人" onSearch={handleSearch} allowClear />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker placeholder={['开始日期', '结束日期']} onChange={handleDateRangeChange} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select placeholder="选择执行人" style={{ width: '100%' }} allowClear>
              <Option value="杜鹏涛">杜鹏涛</Option>
              <Option value="张志恒">张志恒</Option>
              <Option value="姜东亮">姜东亮</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                刷新
              </Button>
              <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>
                新增记录
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

      {/* 日工单数据表格 */}
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
        title={modalType === 'view' ? '查看详情' : modalType === 'edit' ? '编辑记录' : '新增记录'}
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
              <Descriptions.Item label="日期">{selectedRecord.date}</Descriptions.Item>
              <Descriptions.Item label="星期">{selectedRecord.dayOfWeek}</Descriptions.Item>
              <Descriptions.Item label="班级">{selectedRecord.className}</Descriptions.Item>
              <Descriptions.Item label="执行人">{selectedRecord.executor}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="出勤情况" bordered column={2} style={{ marginTop: 16 }}>
              <Descriptions.Item label="应出勤">
                {selectedRecord.attendance.shouldAttend}人
              </Descriptions.Item>
              <Descriptions.Item label="实际出勤">
                {selectedRecord.attendance.actualAttend}人
              </Descriptions.Item>
              <Descriptions.Item label="未出勤">
                {selectedRecord.attendance.absent}人
              </Descriptions.Item>
              <Descriptions.Item label="出勤率">
                {selectedRecord.attendance.attendanceRate}%
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="作业情况" bordered column={2} style={{ marginTop: 16 }}>
              <Descriptions.Item label="应交作业">
                {selectedRecord.homework.shouldSubmit}人
              </Descriptions.Item>
              <Descriptions.Item label="实际交作业">
                {selectedRecord.homework.actualSubmit}人
              </Descriptions.Item>
              <Descriptions.Item label="未交">
                {selectedRecord.homework.notSubmit}人
              </Descriptions.Item>
              <Descriptions.Item label="提交率">
                {selectedRecord.homework.submitRate}%
              </Descriptions.Item>
              <Descriptions.Item label="合格率">
                {selectedRecord.homework.passRate}%
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="其他情况" bordered column={1} style={{ marginTop: 16 }}>
              <Descriptions.Item label="学员学习状态">
                {selectedRecord.studentLearningStatus}
              </Descriptions.Item>
              <Descriptions.Item label="学员访谈情况">
                {selectedRecord.studentInterviewStatus}
              </Descriptions.Item>
              <Descriptions.Item label="与班主任沟通情况">
                {selectedRecord.communicationWithTeacher}
              </Descriptions.Item>
              <Descriptions.Item label="口碑情况">
                {selectedRecord.reputationStatus}
              </Descriptions.Item>
              <Descriptions.Item label="其他情况">{selectedRecord.otherStatus}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <Title level={5}>任务列表</Title>
              <Table
                dataSource={selectedRecord.tasks}
                columns={[
                  { title: '任务名称', dataIndex: 'taskName', key: 'taskName' },
                  { title: '任务描述', dataIndex: 'taskDescription', key: 'taskDescription' },
                  { title: '任务目标', dataIndex: 'taskGoal', key: 'taskGoal' },
                  { title: '执行时间', dataIndex: 'executionTime', key: 'executionTime' },
                  { title: '完成期限', dataIndex: 'deadline', key: 'deadline' },
                  { title: '结果', dataIndex: 'result', key: 'result' },
                ]}
                pagination={false}
                size="small"
                bordered
              />
            </div>
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="date"
                  label="日期"
                  rules={[{ required: true, message: '请选择日期' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="dayOfWeek"
                  label="星期"
                  rules={[{ required: true, message: '请选择星期' }]}
                >
                  <Select>
                    <Option value="周一">周一</Option>
                    <Option value="周二">周二</Option>
                    <Option value="周三">周三</Option>
                    <Option value="周四">周四</Option>
                    <Option value="周五">周五</Option>
                    <Option value="周六">周六</Option>
                    <Option value="周日">周日</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="className"
                  label="班级"
                  rules={[{ required: true, message: '请输入班级' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="executor"
                  label="执行人"
                  rules={[{ required: true, message: '请输入执行人' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="studentLearningStatus" label="学员学习状态">
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item name="studentInterviewStatus" label="学员访谈情况">
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item name="communicationWithTeacher" label="与班主任沟通情况">
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item name="reputationStatus" label="口碑情况">
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item name="otherStatus" label="其他情况">
              <TextArea rows={3} />
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* 说明信息 */}
      <Alert
        message="日工单说明"
        description={
          <div>
            <p>
              • <strong>出勤情况</strong>：记录班级应出勤人数、实际出勤人数和出勤率
            </p>
            <p>
              • <strong>作业情况</strong>：记录作业应交人数、实际提交人数、提交率和合格率
            </p>
            <p>
              • <strong>学员状态</strong>：记录学员学习状态、访谈情况、沟通情况等
            </p>
            <p>
              • <strong>任务管理</strong>：记录当日完成的任务和结果
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

export default TeacherDailyWork
