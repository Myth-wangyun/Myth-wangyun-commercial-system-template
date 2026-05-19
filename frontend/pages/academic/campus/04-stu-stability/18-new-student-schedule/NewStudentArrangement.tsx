//后端新生每日安排表
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
  Popconfirm,
  AutoComplete,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  DownloadOutlined,
  UserOutlined,
  DollarOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { serviceUtils, newStudentArrangementService } from '@/services/service'
import type {
  NewStudentArrangement,
  CreateNewStudentArrangementRequest,
  UpdateNewStudentArrangementRequest,
  ServiceQueryParams,
  ServiceStats,
} from '@/types/service'
import {
  DEFAULT_NEW_STUDENT_ARRANGEMENT,
  GENDER_OPTIONS,
  CAMPUS_OPTIONS,
} from '@/types/service'
import { fetchMajors, fetchTeachers } from '@/services/configMaster'
import type { MajorProfile, TeacherProfile } from '@/services/configMaster'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select

const NewStudentArrangement: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<NewStudentArrangement[]>([])
  const [stats, setStats] = useState<ServiceStats | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [formVisible, setFormVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<NewStudentArrangement | null>(null)
  const [searchText, setSearchText] = useState('')
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [formData, setFormData] = useState<CreateNewStudentArrangementRequest>(
    DEFAULT_NEW_STUDENT_ARRANGEMENT,
  )
  // 专业和教员列表（从后端加载）
  const [majorList, setMajorList] = useState<MajorProfile[]>([])
  const [teacherList, setTeacherList] = useState<TeacherProfile[]>([])

  // 加载专业和教员列表
  useEffect(() => {
    const loadOptions = async () => {
      if (!currentCampus) {
        setMajorList([])
        setTeacherList([])
        return
      }
      try {
        const [majors, teachers] = await Promise.all([
          fetchMajors({ campus_name: currentCampus, active: true }),
          fetchTeachers({ campus_name: currentCampus, active: true }),
        ])
        setMajorList(majors || [])
        setTeacherList(teachers || [])
      } catch (error) {
        console.error('加载专业/教员列表失败:', error)
        message.error('加载专业/教员列表失败，请刷新页面重试')
        setMajorList([])
        setTeacherList([])
      }
    }
    loadOptions()
  }, [currentCampus])

  // 专业选项（从后端加载）
  const majorOptions = majorList
    .filter((m) => m.name) // 过滤掉没有名称的专业
    .map((m) => ({ value: m.name, label: m.name }))

  // 教员选项
  const teacherOptions = teacherList.map((t) => ({ value: t.name, label: t.name }))

  // 同步金额与欠费
  const handleAmountChange = (field: 'receivableAmount' | 'receivedAmount', value?: number) => {
    setFormData((prev) => {
      const newValue = value || 0
      const receivableAmount = field === 'receivableAmount' ? newValue : prev.receivableAmount || 0
      const receivedAmount = field === 'receivedAmount' ? newValue : prev.receivedAmount || 0
      const owedAmount = serviceUtils.calculateOwedAmount(receivableAmount, receivedAmount)
      return {
        ...prev,
        receivableAmount,
        receivedAmount,
        owedAmount,
      }
    })
  }

  // 加载数据
  const loadData = async (params: ServiceQueryParams = {}) => {
    setLoading(true)
    try {
      const query = {
        ...params,
        search: searchText,
        date: selectedDate,
        campus: currentCampus || undefined,
      }
      const listResponse = await newStudentArrangementService.getList(query, currentCampus || undefined)
      const list = listResponse.list || []

      setData(list)
      setPagination({
        current: listResponse.page || 1,
        pageSize: listResponse.pageSize || 20,
        total: listResponse.total || 0,
      })
      const computedStats: ServiceStats = {
        totalStudents: listResponse.total || list.length,
        totalReceivable: list.reduce((sum, item) => sum + (item.receivableAmount || 0), 0),
        totalReceived: list.reduce((sum, item) => sum + (item.receivedAmount || 0), 0),
        totalOwed: list.reduce((sum, item) => sum + (item.owedAmount || 0), 0),
        enrollmentRate: 0,
        completionRate: 0,
      }
      setStats(computedStats)
    } catch (error) {
      message.error('加载数据失败')
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentCampus, searchText, selectedDate])

  // 处理新增记录
  const handleAdd = () => {
    setEditingRecord(null)
    setFormData({
      ...DEFAULT_NEW_STUDENT_ARRANGEMENT,
      arrangementDate: selectedDate,
      campus: currentCampus || '',
    })
    setFormVisible(true)
  }

  // 处理编辑记录
  const handleEdit = (record: NewStudentArrangement) => {
    setEditingRecord(record)
    setFormData({
      studentName: record.studentName,
      age: record.age,
      gender: record.gender,
      major: record.major,
      duration: record.duration,
      concerns: record.concerns,
      receivableAmount: record.receivableAmount,
      receivedAmount: record.receivedAmount,
      owedAmount: record.owedAmount,
      expectedPaymentDate: record.expectedPaymentDate,
      teachingContent: record.teachingContent,
      teachingLocation: record.teachingLocation,
      enrollmentDate: record.enrollmentDate,
      classDays: record.classDays,
      planner: record.planner,
      homeroomTeacher: record.homeroomTeacher,
      instructor: record.instructor,
      notes: record.notes,
      recorder: record.recorder,
      arrangementDate: record.arrangementDate,
      campus: record.campus || currentCampus || '',
    })
    setFormVisible(true)
  }

  // 处理删除记录
  const handleDelete = (record: NewStudentArrangement) => {
    return newStudentArrangementService
      .delete(Number(record.id), currentCampus || undefined)
      .then(() => {
        setData((prev) => prev.filter((item) => String(item.id) !== String(record.id)))
        message.success('删除成功')
        loadData()
      })
      .catch((error) => {
        const err = error as any
        console.error('删除失败', err?.response?.data || err)
        message.error('删除失败，请重试或检查后端接口')
      })
  }

  // 处理表单提交
  const handleFormSubmit = async () => {
    try {
      // 验证数据
      const errors = serviceUtils.validateNewStudentArrangement(formData)
      if (errors.length > 0) {
        message.error(errors[0])
        return
      }

      if (editingRecord) {
        const updateData: UpdateNewStudentArrangementRequest = {
          id: editingRecord.id,
          ...formData,
        }
        await newStudentArrangementService.update(updateData, currentCampus || undefined)
        message.success('更新成功')
      } else {
        await newStudentArrangementService.create(
          {
            ...formData,
            arrangementDate: formData.arrangementDate || selectedDate,
            campus: formData.campus || currentCampus || '',
          },
          currentCampus || undefined,
        )
        message.success('保存成功')
      }
      setFormVisible(false)
      loadData()
    } catch (error) {
      message.error(editingRecord ? '更新失败' : '保存失败')
      console.error(error)
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

  // 导出数据为 Excel
  const handleExport = () => {
    if (data.length === 0) {
      message.warning('没有数据可导出')
      return
    }

    // 定义 CSV 表头
    const headers = [
      '序号',
      '新生姓名',
      '年龄',
      '性别',
      '所报专业',
      '学制',
      '抗拒点/关注点',
      '应收金额',
      '已收金额',
      '欠费金额',
      '预计回款时间',
      '授课内容',
      '授课地点',
      '入学日期',
      '上课天数',
      '规划师',
      '班主任',
      '教员',
      '备注',
      '填表人',
      '填表时间',
    ]

    // 转换数据为 CSV 行
    const rows = data.map((item, index) => [
      index + 1,
      item.studentName || '',
      item.age || '',
      item.gender || '',
      item.major || '',
      item.duration || '',
      item.concerns || '',
      item.receivableAmount || 0,
      item.receivedAmount || 0,
      item.owedAmount || 0,
      item.expectedPaymentDate || '',
      item.teachingContent || '',
      item.teachingLocation || '',
      item.enrollmentDate || '',
      item.classDays || 0,
      item.planner || '',
      item.homeroomTeacher || '',
      item.instructor || '',
      item.notes || '',
      item.recorder || '',
      item.recordTime ? dayjs(item.recordTime).format('YYYY-MM-DD HH:mm') : '',
    ])

    // 生成 CSV 内容（添加 BOM 以支持中文）
    const BOM = '\uFEFF'
    const csvContent =
      BOM +
      [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join(
        '\n',
      )

    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${currentCampus || ''}每日新生安排表_${selectedDate}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    message.success('导出成功')
  }

  // 表格列定义
  const columns: ColumnsType<NewStudentArrangement> = [
    {
      title: '序号',
      key: 'index',
      width: 80,
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: '新生姓名',
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
      title: '抗拒点/关注点',
      dataIndex: 'concerns',
      key: 'concerns',
      width: 150,
      ellipsis: true,
    },
    {
      title: '应收金额',
      dataIndex: 'receivableAmount',
      key: 'receivableAmount',
      width: 120,
      render: (value: number) => serviceUtils.formatCurrency(value),
      sorter: (a, b) => a.receivableAmount - b.receivableAmount,
    },
    {
      title: '已收金额',
      dataIndex: 'receivedAmount',
      key: 'receivedAmount',
      width: 120,
      render: (value: number) => serviceUtils.formatCurrency(value),
      sorter: (a, b) => a.receivedAmount - b.receivedAmount,
    },
    {
      title: '欠费金额',
      dataIndex: 'owedAmount',
      key: 'owedAmount',
      width: 120,
      render: (value: number) => (
        <span
          style={{
            color: value > 0 ? '#f5222d' : '#52c41a',
            fontWeight: 'bold',
          }}
        >
          {serviceUtils.formatCurrency(value)}
        </span>
      ),
      sorter: (a, b) => a.owedAmount - b.owedAmount,
    },
    {
      title: '预计回款时间',
      dataIndex: 'expectedPaymentDate',
      key: 'expectedPaymentDate',
      width: 120,
    },
    {
      title: '授课内容',
      dataIndex: 'teachingContent',
      key: 'teachingContent',
      width: 120,
      ellipsis: true,
    },
    {
      title: '授课地点',
      dataIndex: 'teachingLocation',
      key: 'teachingLocation',
      width: 120,
    },
    {
      title: '入学日期',
      dataIndex: 'enrollmentDate',
      key: 'enrollmentDate',
      width: 120,
    },
    {
      title: '上课天数',
      dataIndex: 'classDays',
      key: 'classDays',
      width: 100,
      sorter: (a, b) => a.classDays - b.classDays,
    },
    {
      title: '规划师',
      dataIndex: 'planner',
      key: 'planner',
      width: 100,
    },
    {
      title: '班主任',
      dataIndex: 'homeroomTeacher',
      key: 'homeroomTeacher',
      width: 100,
    },
    {
      title: '教员',
      dataIndex: 'instructor',
      key: 'instructor',
      width: 100,
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
          <Popconfirm
            title="确认删除？"
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
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
          <UserOutlined style={{ marginRight: 8 }} />
          {currentCampus}神殿每日新生安排表
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => loadData()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加新生
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出数据
          </Button>
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
            <Text strong>搜索</Text>
            <Input
              style={{ marginTop: 4 }}
              placeholder="搜索新生姓名..."
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
              <Statistic title="总新生数" value={stats.totalStudents} prefix={<TeamOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="应收总额"
                value={stats.totalReceivable}
                prefix={<DollarOutlined />}
                formatter={(value) => serviceUtils.formatCurrency(Number(value))}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="已收总额"
                value={stats.totalReceived}
                prefix={<DollarOutlined />}
                formatter={(value) => serviceUtils.formatCurrency(Number(value))}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="欠费总额"
                value={stats.totalOwed}
                prefix={<DollarOutlined />}
                formatter={(value) => serviceUtils.formatCurrency(Number(value))}
                valueStyle={{ color: Number(stats.totalOwed) > 0 ? '#f5222d' : '#52c41a' }}
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
          scroll={{ x: 2000 }}
          size="small"
        />
      </Card>

      {/* 表单模态框 */}
      <Modal
        title={editingRecord ? '编辑新生安排' : '添加新生安排'}
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        onOk={handleFormSubmit}
        okText="保存"
        width={800}
      >
        <div style={{ padding: '20px 0' }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>新生姓名 *</Text>
              <Input
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                placeholder="请输入新生姓名"
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
              <AutoComplete
                style={{ width: '100%', marginTop: 4 }}
                value={formData.major}
                onChange={(value) => setFormData({ ...formData, major: value })}
                placeholder="请选择或输入专业"
                options={majorOptions}
                filterOption={(inputValue, option) =>
                  option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                }
                allowClear
              />
            </Col>
            <Col span={12}>
              <Text strong>学制 *</Text>
              <AutoComplete
                style={{ width: '100%', marginTop: 4 }}
                value={formData.duration}
                onChange={(value) => setFormData({ ...formData, duration: value })}
                placeholder="请选择或输入学制"
                options={[
                  { value: '6个月', label: '6个月' },
                  { value: '8个月', label: '8个月' },
                  { value: '12个月', label: '12个月' },
                  { value: '18个月', label: '18个月' },
                  { value: '24个月', label: '24个月' },
                ]}
                filterOption={(inputValue, option) =>
                  option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                }
                allowClear
              />
            </Col>
            <Col span={12}>
              <Text strong>抗拒点/关注点</Text>
              <Input
                value={formData.concerns}
                onChange={(e) => setFormData({ ...formData, concerns: e.target.value })}
                placeholder="请输入抗拒点/关注点"
                style={{ marginTop: 4 }}
              />
            </Col>
            <Col span={12}>
              <Text strong>应收金额 *</Text>
              <InputNumber
                style={{ width: '100%', marginTop: 4 }}
                value={formData.receivableAmount}
                onChange={(value) => handleAmountChange('receivableAmount', value)}
                placeholder="请输入应收金额"
                min={0}
              />
            </Col>
            <Col span={12}>
              <Text strong>已收金额 *</Text>
              <InputNumber
                style={{ width: '100%', marginTop: 4 }}
                value={formData.receivedAmount}
                onChange={(value) => handleAmountChange('receivedAmount', value)}
                placeholder="请输入已收金额"
                min={0}
              />
            </Col>
            <Col span={12}>
              <Text strong>欠费金额</Text>
              <InputNumber
                style={{ width: '100%', marginTop: 4 }}
                value={formData.owedAmount}
                placeholder="自动计算"
                readOnly
              />
            </Col>
            <Col span={12}>
              <Text strong>预计回款时间</Text>
              <DatePicker
                style={{ width: '100%', marginTop: 4 }}
                value={formData.expectedPaymentDate ? dayjs(formData.expectedPaymentDate) : null}
                onChange={(date) =>
                  setFormData({ ...formData, expectedPaymentDate: date?.format('YYYY-MM-DD') })
                }
              />
            </Col>
            <Col span={12}>
              <Text strong>授课内容</Text>
              <Input
                value={formData.teachingContent}
                onChange={(e) => setFormData({ ...formData, teachingContent: e.target.value })}
                placeholder="请输入授课内容"
                style={{ marginTop: 4 }}
              />
            </Col>
            <Col span={12}>
              <Text strong>授课地点</Text>
              <Input
                value={formData.teachingLocation}
                onChange={(e) => setFormData({ ...formData, teachingLocation: e.target.value })}
                placeholder="请输入授课地点"
                style={{ marginTop: 4 }}
              />
            </Col>
            <Col span={12}>
              <Text strong>入学日期 *</Text>
              <DatePicker
                style={{ width: '100%', marginTop: 4 }}
                value={formData.enrollmentDate ? dayjs(formData.enrollmentDate) : null}
                onChange={(date) =>
                  setFormData({ ...formData, enrollmentDate: date?.format('YYYY-MM-DD') || '' })
                }
              />
            </Col>
            <Col span={12}>
              <Text strong>上课天数 *</Text>
              <InputNumber
                style={{ width: '100%', marginTop: 4 }}
                value={formData.classDays}
                onChange={(value) => setFormData({ ...formData, classDays: value || 0 })}
                placeholder="请输入上课天数"
                min={0}
              />
            </Col>
            <Col span={12}>
              <Text strong>规划师</Text>
              <Input
                value={formData.planner}
                onChange={(e) => setFormData({ ...formData, planner: e.target.value })}
                placeholder="请输入规划师"
                style={{ marginTop: 4 }}
              />
            </Col>
            <Col span={12}>
              <Text strong>班主任</Text>
              <Input
                value={formData.homeroomTeacher}
                onChange={(e) => setFormData({ ...formData, homeroomTeacher: e.target.value })}
                placeholder="请输入班主任"
                style={{ marginTop: 4 }}
              />
            </Col>
            <Col span={12}>
              <Text strong>教员</Text>
              <AutoComplete
                style={{ width: '100%', marginTop: 4 }}
                value={formData.instructor}
                onChange={(value) => setFormData({ ...formData, instructor: value })}
                placeholder="请选择或输入教员"
                options={teacherOptions}
                filterOption={(inputValue, option) =>
                  option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                }
                allowClear
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

export default NewStudentArrangement
