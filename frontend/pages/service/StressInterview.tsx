import React, { useState, useEffect } from 'react'
import { App,
  Card,
  Row,
  Col,
  Typography,
  Button,
  Table,
  Space,
  Modal,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Statistic,
  Rate,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  DownloadOutlined,
  UserOutlined,
  StarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { serviceMockService } from '@/services/mock/serviceMock'
import { serviceUtils } from '@/services/service'
import type {
  StressInterviewRecord,
  CreateStressInterviewRecordRequest,
  UpdateStressInterviewRecordRequest,
  ServiceQueryParams,
  ServiceStats,
} from '@/types/service'
import {
  DEFAULT_STRESS_INTERVIEW_RECORD,
  GENDER_OPTIONS,
  CAMPUS_OPTIONS,
  MAJOR_OPTIONS,
  DURATION_OPTIONS,
  INTERVIEW_RESULT_OPTIONS,
  INTERVIEW_STATUS_OPTIONS,
} from '@/types/service'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select

const StressInterview: React.FC = () => {
  const { message, modal } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<StressInterviewRecord[]>([])
  const [stats, setStats] = useState<ServiceStats | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [formVisible, setFormVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<StressInterviewRecord | null>(null)
  const [searchText, setSearchText] = useState('')
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [selectedCampus, setSelectedCampus] = useState('')
  const [formData, setFormData] = useState<CreateStressInterviewRecordRequest>(
    DEFAULT_STRESS_INTERVIEW_RECORD,
  )

  // 加载数据
  const loadData = async (params: ServiceQueryParams = {}) => {
    setLoading(true)
    try {
      const query = {
        ...params,
        search: searchText,
        date: selectedDate,
        campus: selectedCampus,
      }
      const [listResponse, statsResponse] = await Promise.all([
        serviceMockService.stressInterview.getList(query, currentCampus || undefined),
        serviceMockService.stressInterview.getStats(currentCampus || undefined),
      ])

      setData(listResponse.data?.list || [])
      setPagination({
        current: listResponse.data?.page || 1,
        pageSize: listResponse.data?.pageSize || 20,
        total: listResponse.data?.total || 0,
      })
      setStats(statsResponse.data)
    } catch (error) {
      message.error('加载数据失败')
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentCampus, searchText, selectedDate, selectedCampus])

  // 处理新增记录
  const handleAdd = () => {
    setEditingRecord(null)
    setFormData({
      ...DEFAULT_STRESS_INTERVIEW_RECORD,
      interviewDate: selectedDate,
      campus: selectedCampus || currentCampus || '',
    })
    setFormVisible(true)
  }

  // 处理编辑记录
  const handleEdit = (record: StressInterviewRecord) => {
    setEditingRecord(record)
    setFormData({
      studentName: record.studentName,
      age: record.age,
      gender: record.gender,
      major: record.major,
      duration: record.duration,
      interviewDate: record.interviewDate,
      interviewer: record.interviewer,
      interviewContent: record.interviewContent,
      studentPerformance: record.studentPerformance,
      stressTestResult: record.stressTestResult,
      overallScore: record.overallScore,
      communicationScore: record.communicationScore,
      technicalScore: record.technicalScore,
      adaptabilityScore: record.adaptabilityScore,
      stressResistanceScore: record.stressResistanceScore,
      interviewResult: record.interviewResult,
      status: record.status,
      feedback: record.feedback,
      improvementSuggestions: record.improvementSuggestions,
      nextInterviewDate: record.nextInterviewDate,
      notes: record.notes,
      recorder: record.recorder,
      campus: record.campus,
    })
    setFormVisible(true)
  }

  // 处理删除记录
  const handleDelete = (record: StressInterviewRecord) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除学员 "${record.studentName}" 的压力面试记录吗？`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await serviceMockService.stressInterview.delete(record.id, currentCampus || undefined)
          message.success('删除成功')
          loadData()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  // 处理表单提交
  const handleFormSubmit = async () => {
    try {
      // 验证数据
      const errors = serviceUtils.validateStressInterviewRecord(formData)
      if (errors.length > 0) {
        message.error(errors[0])
        return
      }

      if (editingRecord) {
        const updateData: UpdateStressInterviewRecordRequest = {
          id: editingRecord.id,
          ...formData,
        }
        await serviceMockService.stressInterview.update(updateData, currentCampus || undefined)
        message.success('更新成功')
      } else {
        await serviceMockService.stressInterview.create(formData, currentCampus || undefined)
        message.success('保存成功')
      }
      setFormVisible(false)
      loadData()
    } catch (error) {
      message.error(editingRecord ? '更新失败' : '保存失败')
    }
  }

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value)
  }

  // 处理表格分页
  const handleTableChange = (pagination: any) => {
    loadData({
      page: pagination.current,
      pageSize: pagination.pageSize,
    })
  }

  // 表格列定义
  const columns: ColumnsType<StressInterviewRecord> = [
    {
      title: '序号',
      key: 'index',
      width: 80,
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: '学员姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 100,
      render: (text: string) => (
        <div style={{ fontWeight: 'bold' }}>
          <UserOutlined style={{ marginRight: 4 }} />
          {text}
        </div>
      ),
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 80,
      sorter: (a, b) => a.age - b.age,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
    },
    {
      title: '所报专业',
      dataIndex: 'major',
      key: 'major',
      width: 120,
    },
    {
      title: '学制',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
    },
    {
      title: '面试日期',
      dataIndex: 'interviewDate',
      key: 'interviewDate',
      width: 120,
    },
    {
      title: '面试官',
      dataIndex: 'interviewer',
      key: 'interviewer',
      width: 100,
    },
    {
      title: '面试内容',
      dataIndex: 'interviewContent',
      key: 'interviewContent',
      width: 150,
      ellipsis: true,
    },
    {
      title: '学员表现',
      dataIndex: 'studentPerformance',
      key: 'studentPerformance',
      width: 150,
      ellipsis: true,
    },
    {
      title: '压力测试结果',
      dataIndex: 'stressTestResult',
      key: 'stressTestResult',
      width: 150,
      ellipsis: true,
    },
    {
      title: '综合评分',
      dataIndex: 'overallScore',
      key: 'overallScore',
      width: 100,
      render: (value: number) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Rate disabled value={value} style={{ fontSize: 12 }} />
          <span style={{ marginLeft: 4 }}>{value}</span>
        </div>
      ),
      sorter: (a, b) => a.overallScore - b.overallScore,
    },
    {
      title: '沟通能力',
      dataIndex: 'communicationScore',
      key: 'communicationScore',
      width: 100,
      render: (value: number) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Rate disabled value={value} style={{ fontSize: 12 }} />
          <span style={{ marginLeft: 4 }}>{value}</span>
        </div>
      ),
      sorter: (a, b) => a.communicationScore - b.communicationScore,
    },
    {
      title: '技术能力',
      dataIndex: 'technicalScore',
      key: 'technicalScore',
      width: 100,
      render: (value: number) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Rate disabled value={value} style={{ fontSize: 12 }} />
          <span style={{ marginLeft: 4 }}>{value}</span>
        </div>
      ),
      sorter: (a, b) => a.technicalScore - b.technicalScore,
    },
    {
      title: '适应能力',
      dataIndex: 'adaptabilityScore',
      key: 'adaptabilityScore',
      width: 100,
      render: (value: number) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Rate disabled value={value} style={{ fontSize: 12 }} />
          <span style={{ marginLeft: 4 }}>{value}</span>
        </div>
      ),
      sorter: (a, b) => a.adaptabilityScore - b.adaptabilityScore,
    },
    {
      title: '抗压能力',
      dataIndex: 'stressResistanceScore',
      key: 'stressResistanceScore',
      width: 100,
      render: (value: number) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Rate disabled value={value} style={{ fontSize: 12 }} />
          <span style={{ marginLeft: 4 }}>{value}</span>
        </div>
      ),
      sorter: (a, b) => a.stressResistanceScore - b.stressResistanceScore,
    },
    {
      title: '面试结果',
      dataIndex: 'interviewResult',
      key: 'interviewResult',
      width: 100,
      render: (value: string) => {
        const option = INTERVIEW_RESULT_OPTIONS.find((opt) => opt.value === value)
        return (
          <span
            style={{
              color: value === '通过' ? '#52c41a' : value === '不通过' ? '#f5222d' : '#1890ff',
              fontWeight: 'bold',
            }}
          >
            {option?.label || value}
          </span>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value: string) => {
        const option = INTERVIEW_STATUS_OPTIONS.find((opt) => opt.value === value)
        return (
          <span
            style={{
              color: value === '已完成' ? '#52c41a' : value === '进行中' ? '#1890ff' : '#faad14',
              fontWeight: 'bold',
            }}
          >
            {option?.label || value}
          </span>
        )
      },
    },
    {
      title: '反馈',
      dataIndex: 'feedback',
      key: 'feedback',
      width: 150,
      ellipsis: true,
    },
    {
      title: '改进建议',
      dataIndex: 'improvementSuggestions',
      key: 'improvementSuggestions',
      width: 150,
      ellipsis: true,
    },
    {
      title: '下次面试时间',
      dataIndex: 'nextInterviewDate',
      key: 'nextInterviewDate',
      width: 120,
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 120,
      ellipsis: true,
    },
    {
      title: '填表人',
      dataIndex: 'recorder',
      key: 'recorder',
      width: 100,
    },
    {
      title: '填表时间',
      dataIndex: 'recordTime',
      key: 'recordTime',
      width: 150,
      render: (value: string) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* 页面标题和操作按钮 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          <StarOutlined style={{ marginRight: 8 }} />
          XX神殿压力面试记录表
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => loadData()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加面试记录
          </Button>
          <Button icon={<DownloadOutlined />}>导出数据</Button>
        </Space>
      </div>

      {/* 筛选条件 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={4}>
            <Text strong>选择日期</Text>
            <DatePicker
              style={{ width: '100%', marginTop: 4 }}
              value={dayjs(selectedDate)}
              onChange={(date) => setSelectedDate(date?.format('YYYY-MM-DD') || '')}
            />
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Text strong>选择神殿</Text>
            <Select
              style={{ width: '100%', marginTop: 4 }}
              placeholder="请选择神殿"
              value={selectedCampus}
              onChange={setSelectedCampus}
              allowClear
            >
              {CAMPUS_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Text strong>搜索</Text>
            <Input
              style={{ marginTop: 4 }}
              placeholder="搜索学员姓名..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总面试数" value={stats.totalInterviews} prefix={<TeamOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="通过数"
                value={stats.passedInterviews}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="不通过数"
                value={stats.failedInterviews}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="平均评分"
                value={stats.averageScore}
                prefix={<StarOutlined />}
                precision={1}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 2500 }}
          size="small"
        />
      </Card>

      {/* 表单模态框 */}
      <Modal
        title={editingRecord ? '编辑压力面试记录' : '添加压力面试记录'}
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        onOk={handleFormSubmit}
        width={900}
        destroyOnHidden
      >
        <div style={{ padding: '20px 0' }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>学员姓名 *</Text>
              <Input
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                placeholder="请输入学员姓名"
                style={{ marginTop: 4 }}
              />
            </Col>
            <Col span={12}>
              <Text strong>年龄 *</Text>
              <InputNumber
                style={{ width: '100%', marginTop: 4 }}
                value={formData.age}
                onChange={(value) => setFormData({ ...formData, age: value || 18 })}
                placeholder="请输入年龄"
                min={16}
                max={50}
              />
            </Col>
            <Col span={12}>
              <Text strong>性别 *</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={formData.gender}
                onChange={(value) => setFormData({ ...formData, gender: value })}
                placeholder="请选择性别"
              >
                {GENDER_OPTIONS.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={12}>
              <Text strong>所报专业 *</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={formData.major}
                onChange={(value) => setFormData({ ...formData, major: value })}
                placeholder="请选择专业"
              >
                {MAJOR_OPTIONS.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={12}>
              <Text strong>学制 *</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={formData.duration}
                onChange={(value) => setFormData({ ...formData, duration: value })}
                placeholder="请选择学制"
              >
                {DURATION_OPTIONS.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={12}>
              <Text strong>面试日期 *</Text>
              <DatePicker
                style={{ width: '100%', marginTop: 4 }}
                value={formData.interviewDate ? dayjs(formData.interviewDate) : null}
                onChange={(date) =>
                  setFormData({ ...formData, interviewDate: date?.format('YYYY-MM-DD') || '' })
                }
              />
            </Col>
            <Col span={12}>
              <Text strong>面试官 *</Text>
              <Input
                value={formData.interviewer}
                onChange={(e) => setFormData({ ...formData, interviewer: e.target.value })}
                placeholder="请输入面试官"
                style={{ marginTop: 4 }}
              />
            </Col>
            <Col span={12}>
              <Text strong>神殿 *</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={formData.campus}
                onChange={(value) => setFormData({ ...formData, campus: value })}
                placeholder="请选择神殿"
              >
                {CAMPUS_OPTIONS.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={24}>
              <Text strong>面试内容 *</Text>
              <Input.TextArea
                value={formData.interviewContent}
                onChange={(e) => setFormData({ ...formData, interviewContent: e.target.value })}
                placeholder="请输入面试内容"
                rows={3}
                style={{ marginTop: 4 }}
              />
            </Col>
            <Col span={24}>
              <Text strong>学员表现 *</Text>
              <Input.TextArea
                value={formData.studentPerformance}
                onChange={(e) => setFormData({ ...formData, studentPerformance: e.target.value })}
                placeholder="请输入学员表现"
                rows={3}
                style={{ marginTop: 4 }}
              />
            </Col>
            <Col span={24}>
              <Text strong>压力测试结果 *</Text>
              <Input.TextArea
                value={formData.stressTestResult}
                onChange={(e) => setFormData({ ...formData, stressTestResult: e.target.value })}
                placeholder="请输入压力测试结果"
                rows={3}
                style={{ marginTop: 4 }}
              />
            </Col>
            <Col span={12}>
              <Text strong>综合评分 *</Text>
              <Rate
                style={{ marginTop: 4 }}
                value={formData.overallScore}
                onChange={(value) => setFormData({ ...formData, overallScore: value })}
              />
            </Col>
            <Col span={12}>
              <Text strong>沟通能力 *</Text>
              <Rate
                style={{ marginTop: 4 }}
                value={formData.communicationScore}
                onChange={(value) => setFormData({ ...formData, communicationScore: value })}
              />
            </Col>
            <Col span={12}>
              <Text strong>技术能力 *</Text>
              <Rate
                style={{ marginTop: 4 }}
                value={formData.technicalScore}
                onChange={(value) => setFormData({ ...formData, technicalScore: value })}
              />
            </Col>
            <Col span={12}>
              <Text strong>适应能力 *</Text>
              <Rate
                style={{ marginTop: 4 }}
                value={formData.adaptabilityScore}
                onChange={(value) => setFormData({ ...formData, adaptabilityScore: value })}
              />
            </Col>
            <Col span={12}>
              <Text strong>抗压能力 *</Text>
              <Rate
                style={{ marginTop: 4 }}
                value={formData.stressResistanceScore}
                onChange={(value) => setFormData({ ...formData, stressResistanceScore: value })}
              />
            </Col>
            <Col span={12}>
              <Text strong>面试结果 *</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={formData.interviewResult}
                onChange={(value) => setFormData({ ...formData, interviewResult: value })}
                placeholder="请选择面试结果"
              >
                {INTERVIEW_RESULT_OPTIONS.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={12}>
              <Text strong>状态 *</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={formData.status}
                onChange={(value) => setFormData({ ...formData, status: value })}
                placeholder="请选择状态"
              >
                {INTERVIEW_STATUS_OPTIONS.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={24}>
              <Text strong>反馈</Text>
              <Input.TextArea
                value={formData.feedback}
                onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                placeholder="请输入反馈"
                rows={3}
                style={{ marginTop: 4 }}
              />
            </Col>
            <Col span={24}>
              <Text strong>改进建议</Text>
              <Input.TextArea
                value={formData.improvementSuggestions}
                onChange={(e) =>
                  setFormData({ ...formData, improvementSuggestions: e.target.value })
                }
                placeholder="请输入改进建议"
                rows={3}
                style={{ marginTop: 4 }}
              />
            </Col>
            <Col span={12}>
              <Text strong>下次面试时间</Text>
              <DatePicker
                style={{ width: '100%', marginTop: 4 }}
                value={formData.nextInterviewDate ? dayjs(formData.nextInterviewDate) : null}
                onChange={(date) =>
                  setFormData({ ...formData, nextInterviewDate: date?.format('YYYY-MM-DD') })
                }
              />
            </Col>
            <Col span={24}>
              <Text strong>备注</Text>
              <Input.TextArea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="请输入备注"
                rows={3}
                style={{ marginTop: 4 }}
              />
            </Col>
          </Row>
        </div>
      </Modal>
    </div>
  )
}

export default StressInterview
