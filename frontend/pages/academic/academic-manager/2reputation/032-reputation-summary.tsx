// 学术->神殿 XX神殿智慧司口碑招生关键点结果汇总表
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
  Alert,
  InputNumber,
  Divider,
  Tooltip,
  Tabs,
  Progress,
  Typography,
  Radio,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CalendarOutlined,
  TeamOutlined,
  BookOutlined,
  UserOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  FileTextOutlined,
  SmileOutlined,
  StarOutlined,
  EyeOutlined,
  FormOutlined,
  BarChartOutlined,
  PrinterOutlined,
  RocketOutlined,
  MessageOutlined,
  ShareAltOutlined,
  PieChartOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input
const { Title, Text } = Typography


// 口碑招生关键点结果汇总数据类型
interface ReputationSummaryRecord {
  id: string
  month: number
  year: number
  campus: string
  teacherName: string
  onlinePromotion: {
    wechatMoments: number
    douyin: number
    kuaishou: number
    xiaohongshu: number
    total: number
  }
  studentInterview: {
    currentStudent: number
    graduate: number
    total: number
  }
  createdAt?: string
  updatedAt?: string
}

// 表单数据类型
interface ReputationSummaryFormData {
  month: number
  year: number
  campus: string
  teacherName: string
  onlinePromotion: {
    wechatMoments: number
    douyin: number
    kuaishou: number
    xiaohongshu: number
    total: number
  }
  studentInterview: {
    currentStudent: number
    graduate: number
    total: number
  }
}

const ReputationSummaryPage: React.FC = () => {
  const { message } = App.useApp()
  const [dataSource, setDataSource] = useState<ReputationSummaryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ReputationSummaryRecord | null>(null)
  const [form] = Form.useForm<ReputationSummaryFormData>()
  const [searchText, setSearchText] = useState('')
  const [selectedCampus, setSelectedCampus] = useState('石美')
  const [selectedYear, setSelectedYear] = useState(2024)
  const [selectedMonth, setSelectedMonth] = useState(1)
  const [activeTab, setActiveTab] = useState('summary')

  // 模拟数据
  const mockData: ReputationSummaryRecord[] = [
    {
      id: '1',
      month: 1,
      year: 2024,
      campus: '石美',
      teacherName: '张三',
      onlinePromotion: {
        wechatMoments: 15,
        douyin: 8,
        kuaishou: 5,
        xiaohongshu: 12,
        total: 40,
      },
      studentInterview: {
        currentStudent: 3,
        graduate: 2,
        total: 5,
      },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '2',
      month: 1,
      year: 2024,
      campus: '石美',
      teacherName: '李四',
      onlinePromotion: {
        wechatMoments: 12,
        douyin: 6,
        kuaishou: 3,
        xiaohongshu: 9,
        total: 30,
      },
      studentInterview: {
        currentStudent: 2,
        graduate: 1,
        total: 3,
      },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '3',
      month: 2,
      year: 2024,
      campus: '石美',
      teacherName: '张三',
      onlinePromotion: {
        wechatMoments: 18,
        douyin: 10,
        kuaishou: 7,
        xiaohongshu: 15,
        total: 50,
      },
      studentInterview: {
        currentStudent: 4,
        graduate: 3,
        total: 7,
      },
      createdAt: '2024-02-01',
      updatedAt: '2024-02-01',
    },
    {
      id: '4',
      month: 2,
      year: 2024,
      campus: '石美',
      teacherName: '李四',
      onlinePromotion: {
        wechatMoments: 14,
        douyin: 8,
        kuaishou: 4,
        xiaohongshu: 11,
        total: 37,
      },
      studentInterview: {
        currentStudent: 3,
        graduate: 2,
        total: 5,
      },
      createdAt: '2024-02-01',
      updatedAt: '2024-02-01',
    },
  ]

  // 初始化数据
  useEffect(() => {
    setDataSource(mockData)
  }, [])

  // 计算总计
  const calculateTotals = (records: ReputationSummaryRecord[]) => {
    return records.reduce(
      (totals, record) => {
        totals.onlinePromotion.wechatMoments += record.onlinePromotion.wechatMoments
        totals.onlinePromotion.douyin += record.onlinePromotion.douyin
        totals.onlinePromotion.kuaishou += record.onlinePromotion.kuaishou
        totals.onlinePromotion.xiaohongshu += record.onlinePromotion.xiaohongshu
        totals.onlinePromotion.total += record.onlinePromotion.total
        totals.studentInterview.currentStudent += record.studentInterview.currentStudent
        totals.studentInterview.graduate += record.studentInterview.graduate
        totals.studentInterview.total += record.studentInterview.total
        return totals
      },
      {
        onlinePromotion: {
          wechatMoments: 0,
          douyin: 0,
          kuaishou: 0,
          xiaohongshu: 0,
          total: 0,
        },
        studentInterview: {
          currentStudent: 0,
          graduate: 0,
          total: 0,
        },
      },
    )
  }

  // 统计数据
  const statistics = {
    totalRecords: dataSource.length,
    currentMonthData: dataSource.filter(
      (record) =>
        record.year === selectedYear &&
        record.month === selectedMonth &&
        record.campus === selectedCampus,
    ),
    monthlyTotals: calculateTotals(
      dataSource.filter(
        (record) =>
          record.year === selectedYear &&
          record.month === selectedMonth &&
          record.campus === selectedCampus,
      ),
    ),
    yearlyTotals: calculateTotals(
      dataSource.filter(
        (record) => record.year === selectedYear && record.campus === selectedCampus,
      ),
    ),
    allTotals: calculateTotals(dataSource.filter((record) => record.campus === selectedCampus)),
  }

  // 生成汇总表格列
  const generateSummaryColumns = () => {
    return [
      {
        title: '月份',
        dataIndex: 'month',
        key: 'month',
        width: 80,
        fixed: 'left' as const,
        render: (text: number, record: ReputationSummaryRecord, index: number) => {
          // 如果是第一个记录或者是新月份的开始，显示月份
          if (index === 0 || dataSource[index - 1]?.month !== record.month) {
            return <div style={{ textAlign: 'center', fontWeight: 'bold' }}>{record.month}月</div>
          }
          return null
        },
      },
      {
        title: '神殿',
        dataIndex: 'campus',
        key: 'campus',
        width: 100,
        fixed: 'left' as const,
        render: (text: string, record: ReputationSummaryRecord, index: number) => {
          // 如果是第一个记录或者是新月份的开始，显示神殿
          if (index === 0 || dataSource[index - 1]?.month !== record.month) {
            return <div style={{ fontWeight: 'bold' }}>{record.campus}</div>
          }
          return null
        },
      },
      {
        title: '教员姓名',
        dataIndex: 'teacherName',
        key: 'teacherName',
        width: 120,
        fixed: 'left' as const,
      },
      {
        title: '线上宣传情况',
        children: [
          {
            title: '朋友圈数量',
            dataIndex: ['onlinePromotion', 'wechatMoments'],
            key: 'wechatMoments',
            width: 100,
            render: (value: number, record: ReputationSummaryRecord) => (
              <InputNumber
                size="small"
                min={0}
                value={value}
                onChange={(val) =>
                  handleDataChange(record.id, 'onlinePromotion.wechatMoments', val || 0)
                }
                style={{ width: '100%' }}
              />
            ),
          },
          {
            title: '抖音数量',
            dataIndex: ['onlinePromotion', 'douyin'],
            key: 'douyin',
            width: 100,
            render: (value: number, record: ReputationSummaryRecord) => (
              <InputNumber
                size="small"
                min={0}
                value={value}
                onChange={(val) => handleDataChange(record.id, 'onlinePromotion.douyin', val || 0)}
                style={{ width: '100%' }}
              />
            ),
          },
          {
            title: '快手数量',
            dataIndex: ['onlinePromotion', 'kuaishou'],
            key: 'kuaishou',
            width: 100,
            render: (value: number, record: ReputationSummaryRecord) => (
              <InputNumber
                size="small"
                min={0}
                value={value}
                onChange={(val) =>
                  handleDataChange(record.id, 'onlinePromotion.kuaishou', val || 0)
                }
                style={{ width: '100%' }}
              />
            ),
          },
          {
            title: '小红书数量',
            dataIndex: ['onlinePromotion', 'xiaohongshu'],
            key: 'xiaohongshu',
            width: 100,
            render: (value: number, record: ReputationSummaryRecord) => (
              <InputNumber
                size="small"
                min={0}
                value={value}
                onChange={(val) =>
                  handleDataChange(record.id, 'onlinePromotion.xiaohongshu', val || 0)
                }
                style={{ width: '100%' }}
              />
            ),
          },
          {
            title: '合计',
            dataIndex: ['onlinePromotion', 'total'],
            key: 'onlineTotal',
            width: 100,
            render: (value: number) => <Tag color="blue">{value}</Tag>,
          },
        ],
      },
      {
        title: '学生访谈情况',
        children: [
          {
            title: '在校生访谈',
            dataIndex: ['studentInterview', 'currentStudent'],
            key: 'currentStudent',
            width: 100,
            render: (value: number, record: ReputationSummaryRecord) => (
              <InputNumber
                size="small"
                min={0}
                value={value}
                onChange={(val) =>
                  handleDataChange(record.id, 'studentInterview.currentStudent', val || 0)
                }
                style={{ width: '100%' }}
              />
            ),
          },
          {
            title: '毕业生访谈',
            dataIndex: ['studentInterview', 'graduate'],
            key: 'graduate',
            width: 100,
            render: (value: number, record: ReputationSummaryRecord) => (
              <InputNumber
                size="small"
                min={0}
                value={value}
                onChange={(val) =>
                  handleDataChange(record.id, 'studentInterview.graduate', val || 0)
                }
                style={{ width: '100%' }}
              />
            ),
          },
          {
            title: '合计',
            dataIndex: ['studentInterview', 'total'],
            key: 'interviewTotal',
            width: 100,
            render: (value: number) => <Tag color="green">{value}</Tag>,
          },
        ],
      },
    ]
  }

  // 处理数据变化
  const handleDataChange = (recordId: string, field: string, value: number) => {
    setDataSource((prev) =>
      prev.map((record) => {
        if (record.id === recordId) {
          const [parent, child] = field.split('.')
          const updatedRecord = {
            ...record,
            [parent]: {
              ...(record[parent as keyof ReputationSummaryRecord] as any),
              [child]: value,
            },
          }

          // 重新计算合计
          if (parent === 'onlinePromotion') {
            updatedRecord.onlinePromotion.total =
              updatedRecord.onlinePromotion.wechatMoments +
              updatedRecord.onlinePromotion.douyin +
              updatedRecord.onlinePromotion.kuaishou +
              updatedRecord.onlinePromotion.xiaohongshu
          } else if (parent === 'studentInterview') {
            updatedRecord.studentInterview.total =
              updatedRecord.studentInterview.currentStudent +
              updatedRecord.studentInterview.graduate
          }

          return {
            ...updatedRecord,
            updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          }
        }
        return record
      }),
    )
  }

  // 处理添加
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({
      campus: selectedCampus,
      year: selectedYear,
      month: selectedMonth,
      onlinePromotion: {
        wechatMoments: 0,
        douyin: 0,
        kuaishou: 0,
        xiaohongshu: 0,
      },
      studentInterview: {
        currentStudent: 0,
        graduate: 0,
      },
    })
    setModalVisible(true)
  }

  // 处理编辑
  const handleEdit = (record: ReputationSummaryRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
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
      const formData: ReputationSummaryFormData = {
        ...values,
        onlinePromotion: {
          ...values.onlinePromotion,
          total:
            values.onlinePromotion.wechatMoments +
            values.onlinePromotion.douyin +
            values.onlinePromotion.kuaishou +
            values.onlinePromotion.xiaohongshu,
        },
        studentInterview: {
          ...values.studentInterview,
          total: values.studentInterview.currentStudent + values.studentInterview.graduate,
        },
      }

      if (editingRecord) {
        // 编辑
        setDataSource((prev) =>
          prev.map((item) =>
            item.id === editingRecord.id
              ? {
                  ...item,
                  ...formData,
                  onlinePromotion: {
                    ...formData.onlinePromotion,
                    total:
                      formData.onlinePromotion.wechatMoments +
                      formData.onlinePromotion.douyin +
                      formData.onlinePromotion.kuaishou +
                      formData.onlinePromotion.xiaohongshu,
                  },
                  studentInterview: {
                    ...formData.studentInterview,
                    total:
                      formData.studentInterview.currentStudent + formData.studentInterview.graduate,
                  },
                  updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                }
              : item,
          ),
        )
        message.success('更新成功')
      } else {
        // 新增
        const newRecord: ReputationSummaryRecord = {
          id: Date.now().toString(),
          onlinePromotion: {
            wechatMoments: formData.onlinePromotion.wechatMoments,
            douyin: formData.onlinePromotion.douyin,
            kuaishou: formData.onlinePromotion.kuaishou,
            xiaohongshu: formData.onlinePromotion.xiaohongshu,
            total:
              formData.onlinePromotion.wechatMoments +
              formData.onlinePromotion.douyin +
              formData.onlinePromotion.kuaishou +
              formData.onlinePromotion.xiaohongshu,
          },
          studentInterview: {
            currentStudent: formData.studentInterview.currentStudent,
            graduate: formData.studentInterview.graduate,
            total: formData.studentInterview.currentStudent + formData.studentInterview.graduate,
          },
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

  // 处理神殿变化
  const handleCampusChange = (campus: string) => {
    setSelectedCampus(campus)
  }

  // 处理年份变化
  const handleYearChange = (year: number) => {
    setSelectedYear(year)
  }

  // 处理月份变化
  const handleMonthChange = (month: number) => {
    setSelectedMonth(month)
  }

  // 过滤数据
  const filteredData = dataSource.filter((item) => {
    const matchesSearch =
      !searchText || item.teacherName.toLowerCase().includes(searchText.toLowerCase())

    const matchesCampus = item.campus === selectedCampus
    const matchesYear = item.year === selectedYear
    const matchesMonth = selectedMonth === 0 || item.month === selectedMonth

    return matchesSearch && matchesCampus && matchesYear && matchesMonth
  })

  return (
    <div style={{ padding: 24 }}>
      <Card>
        {/* 表头信息 */}
        <Row
          gutter={16}
          style={{ marginBottom: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}
        >
          <Col span={6}>
            <strong>神殿名称：</strong>
            {selectedCampus}
          </Col>
          <Col span={6}>
            <strong>年份：</strong>
            {selectedYear}
          </Col>
          <Col span={6}>
            <strong>月份：</strong>
            {selectedMonth === 0 ? '全年' : `${selectedMonth}月`}
          </Col>
          <Col span={6}>
            <strong>记录总数：</strong>
            {statistics.totalRecords}条
          </Col>
        </Row>

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          {
            key: 'summary',
            label: '汇总数据',
            children: (<>
            {/* 筛选条件 */}
            <div
              style={{
                marginBottom: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Space>
                <span>神殿：</span>
                <Select value={selectedCampus} onChange={handleCampusChange} style={{ width: 120 }}>
                  <Option value="石美">石美</Option>
                  <Option value="盛邦">盛邦</Option>
                  <Option value="桂美">桂美</Option>
                  <Option value="台美">台美</Option>
                </Select>

                <span>年份：</span>
                <Select value={selectedYear} onChange={handleYearChange} style={{ width: 100 }}>
                  <Option value={2023}>2023</Option>
                  <Option value={2024}>2024</Option>
                  <Option value={2025}>2025</Option>
                </Select>

                <span>月份：</span>
                <Select value={selectedMonth} onChange={handleMonthChange} style={{ width: 100 }}>
                  <Option value={0}>全年</Option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <Option key={month} value={month}>
                      {month}月
                    </Option>
                  ))}
                </Select>
              </Space>

              <Input.Search
                placeholder="搜索教员姓名"
                style={{ width: 300 }}
                onSearch={handleSearch}
                allowClear
              />
            </div>

            {/* 操作按钮 */}
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                  新增汇总记录
                </Button>
                <Button
                  icon={<PrinterOutlined />}
                  onClick={() => message.info('打印功能开发中...')}
                >
                  打印汇总表
                </Button>
              </Space>
            </div>

            {/* 汇总表格 */}
            <Table
              columns={generateSummaryColumns()}
              dataSource={filteredData}
              rowKey={(record) => record.id}
              loading={loading}
              scroll={{ x: 1500 }}
              pagination={false}
              bordered
              size="small"
            />
            </>),
          },
          {
            key: 'statistics',
            label: '统计分析',
            children: (<>
            {/* 统计概览 */}
            <Row
              gutter={16}
              style={{ marginBottom: 24, padding: 16, backgroundColor: '#f0f9ff', borderRadius: 8 }}
            >
              <Col span={6}>
                <Statistic
                  title="记录总数"
                  value={statistics.totalRecords}
                  suffix="条"
                  prefix={<FileTextOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="线上宣传总数"
                  value={statistics.monthlyTotals.onlinePromotion.total}
                  suffix="条"
                  prefix={<ShareAltOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="学生访谈总数"
                  value={statistics.monthlyTotals.studentInterview.total}
                  suffix="人"
                  prefix={<MessageOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="教员数量"
                  value={new Set(statistics.currentMonthData.map((item) => item.teacherName)).size}
                  suffix="人"
                  prefix={<TeamOutlined />}
                />
              </Col>
            </Row>

            {/* 月度统计 */}
            <Card title="月度统计" style={{ marginBottom: 24 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small" title="线上宣传统计">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="朋友圈"
                          value={statistics.monthlyTotals.onlinePromotion.wechatMoments}
                          suffix="条"
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="抖音"
                          value={statistics.monthlyTotals.onlinePromotion.douyin}
                          suffix="条"
                        />
                      </Col>
                    </Row>
                    <Row gutter={16} style={{ marginTop: 16 }}>
                      <Col span={12}>
                        <Statistic
                          title="快手"
                          value={statistics.monthlyTotals.onlinePromotion.kuaishou}
                          suffix="条"
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="小红书"
                          value={statistics.monthlyTotals.onlinePromotion.xiaohongshu}
                          suffix="条"
                        />
                      </Col>
                    </Row>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="学生访谈统计">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="在校生访谈"
                          value={statistics.monthlyTotals.studentInterview.currentStudent}
                          suffix="人"
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="毕业生访谈"
                          value={statistics.monthlyTotals.studentInterview.graduate}
                          suffix="人"
                        />
                      </Col>
                    </Row>
                    <Row gutter={16} style={{ marginTop: 16 }}>
                      <Col span={12}>
                        <Statistic
                          title="访谈总计"
                          value={statistics.monthlyTotals.studentInterview.total}
                          suffix="人"
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="宣传总计"
                          value={statistics.monthlyTotals.onlinePromotion.total}
                          suffix="条"
                        />
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>
            </Card>

            {/* 年度统计 */}
            <Card title="年度统计" style={{ marginBottom: 24 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="年度线上宣传"
                    value={statistics.yearlyTotals.onlinePromotion.total}
                    suffix="条"
                    prefix={<ShareAltOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="年度学生访谈"
                    value={statistics.yearlyTotals.studentInterview.total}
                    suffix="人"
                    prefix={<MessageOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="年度总计"
                    value={
                      statistics.yearlyTotals.onlinePromotion.total +
                      statistics.yearlyTotals.studentInterview.total
                    }
                    suffix="项"
                    prefix={<TrophyOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
              </Row>
            </Card>
            </>),
          },
        ]} />

        {/* 说明信息 */}
        <Alert
          message="说明"
          description="此表用于汇总智慧司口碑招生关键点结果，包含线上宣传和学生访谈两大类别。支持按神殿、年份、月份筛选数据，自动计算各项合计和总计。蓝色标签表示线上宣传合计，绿色标签表示学生访谈合计。"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑汇总记录' : '新增汇总记录'}
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
            campus: selectedCampus,
            year: selectedYear,
            month: selectedMonth,
            onlinePromotion: {
              wechatMoments: 0,
              douyin: 0,
              kuaishou: 0,
              xiaohongshu: 0,
            },
            studentInterview: {
              currentStudent: 0,
              graduate: 0,
            },
          }}
        >
          {/* 基本信息 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="teacherName"
                label="教员姓名"
                rules={[{ required: true, message: '请输入教员姓名' }]}
              >
                <Input placeholder="请输入教员姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="campus"
                label="神殿"
                rules={[{ required: true, message: '请选择神殿' }]}
              >
                <Select>
                  <Option value="石美">石美</Option>
                  <Option value="盛邦">盛邦</Option>
                  <Option value="桂美">桂美</Option>
                  <Option value="台美">台美</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="year"
                label="年份"
                rules={[{ required: true, message: '请选择年份' }]}
              >
                <Select>
                  <Option value={2023}>2023</Option>
                  <Option value={2024}>2024</Option>
                  <Option value={2025}>2025</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="month"
                label="月份"
                rules={[{ required: true, message: '请选择月份' }]}
              >
                <Select>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <Option key={month} value={month}>
                      {month}月
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>线上宣传情况</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name={['onlinePromotion', 'wechatMoments']} label="朋友圈数量">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name={['onlinePromotion', 'douyin']} label="抖音数量">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name={['onlinePromotion', 'kuaishou']} label="快手数量">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name={['onlinePromotion', 'xiaohongshu']} label="小红书数量">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>学生访谈情况</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name={['studentInterview', 'currentStudent']} label="在校生访谈">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name={['studentInterview', 'graduate']} label="毕业生访谈">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default ReputationSummaryPage
