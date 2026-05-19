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
  Divider,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Option } = Select

// 口碑报名登记数据类型
interface ReputationRegistrationRecord {
  id: string
  month: number
  instructorName: string
  registrantName: string
  registrationTime: string
  registrationMajor: string
  registrationDuration: string
  receivableTuition: number
  actualTuition: number
  exceededClassHours: '是' | '否'
  isStable: '稳定' | '不稳定'
  consultant: string
  introducerName: string
  reputationRelationship: string
  reputationSource: string
  createdAt?: string
  updatedAt?: string
}

// 表单数据类型
interface ReputationRegistrationFormData {
  month: number
  instructorName: string
  registrantName: string
  registrationTime: dayjs.Dayjs | null
  registrationMajor: string
  registrationDuration: string
  receivableTuition: number
  actualTuition: number
  exceededClassHours: '是' | '否'
  isStable: '稳定' | '不稳定'
  consultant: string
  introducerName: string
  reputationRelationship: string
  reputationSource: string
}

const ReputationRegistrationPage: React.FC = () => {
  const { message } = App.useApp()
  const [dataSource, setDataSource] = useState<ReputationRegistrationRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ReputationRegistrationRecord | null>(null)
  const [form] = Form.useForm<ReputationRegistrationFormData>()
  const [searchText, setSearchText] = useState('')

  // 模拟数据
  const mockData: ReputationRegistrationRecord[] = [
    {
      id: '1',
      month: 1,
      instructorName: '张老师',
      registrantName: '张三',
      registrationTime: '2025-09-19',
      registrationMajor: 'AIGC',
      registrationDuration: '20个月',
      receivableTuition: 42800,
      actualTuition: 42800,
      exceededClassHours: '是',
      isStable: '稳定',
      consultant: '张林华',
      introducerName: '李四',
      reputationRelationship: '亲戚',
      reputationSource: '在校生提供',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '2',
      month: 1,
      instructorName: '王老师',
      registrantName: '王五',
      registrationTime: '2025-09-20',
      registrationMajor: '前端开发',
      registrationDuration: '18个月',
      receivableTuition: 35000,
      actualTuition: 35000,
      exceededClassHours: '否',
      isStable: '稳定',
      consultant: '赵六',
      introducerName: '陈七',
      reputationRelationship: '朋友',
      reputationSource: '毕业生推荐',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '3',
      month: 2,
      instructorName: '李老师',
      registrantName: '李八',
      registrationTime: '2025-10-15',
      registrationMajor: '后端开发',
      registrationDuration: '22个月',
      receivableTuition: 45000,
      actualTuition: 45000,
      exceededClassHours: '是',
      isStable: '稳定',
      consultant: '孙九',
      introducerName: '周十',
      reputationRelationship: '同事',
      reputationSource: '在职员工推荐',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ]

  // 初始化数据
  React.useEffect(() => {
    setDataSource(mockData)
  }, [])

  // 按月份分组数据
  const groupedData = dataSource.reduce(
    (acc, record) => {
      if (!acc[record.month]) {
        acc[record.month] = []
      }
      acc[record.month].push(record)
      return acc
    },
    {} as Record<number, ReputationRegistrationRecord[]>,
  )

  // 生成表格数据，包含合计行
  const generateTableData = () => {
    const tableData: any[] = []

    for (let month = 1; month <= 12; month++) {
      const monthData = groupedData[month] || []

      // 添加月份标题行
      tableData.push({
        key: `month-${month}`,
        isMonthHeader: true,
        month: month,
        instructorName: `${month}月`,
        registrantName: '',
        registrationTime: '',
        registrationMajor: '',
        registrationDuration: '',
        receivableTuition: 0,
        actualTuition: 0,
        exceededClassHours: '',
        isStable: '',
        consultant: '',
        introducerName: '',
        reputationRelationship: '',
        reputationSource: '',
      })

      // 添加该月的记录
      monthData.forEach((record, index) => {
        tableData.push({
          ...record,
          key: record.id,
          isMonthHeader: false,
          isDataRow: true,
        })
      })

      // 添加空白行（最多3行数据）
      const emptyRows = Math.max(0, 3 - monthData.length)
      for (let i = 0; i < emptyRows; i++) {
        tableData.push({
          key: `empty-${month}-${i}`,
          isMonthHeader: false,
          isDataRow: false,
          month: month,
          instructorName: 'XXX',
          registrantName: '',
          registrationTime: '',
          registrationMajor: '',
          registrationDuration: '',
          receivableTuition: 0,
          actualTuition: 0,
          exceededClassHours: '',
          isStable: '',
          consultant: '',
          introducerName: '',
          reputationRelationship: '',
          reputationSource: '',
        })
      }

      // 添加该月合计行
      const monthTotal = monthData.reduce(
        (sum, record) => ({
          receivableTuition: sum.receivableTuition + record.receivableTuition,
          actualTuition: sum.actualTuition + record.actualTuition,
        }),
        { receivableTuition: 0, actualTuition: 0 },
      )

      tableData.push({
        key: `total-${month}`,
        isMonthHeader: false,
        isDataRow: false,
        isTotalRow: true,
        month: month,
        instructorName: '合计',
        registrantName: '',
        registrationTime: '',
        registrationMajor: '',
        registrationDuration: '',
        receivableTuition: monthTotal.receivableTuition,
        actualTuition: monthTotal.actualTuition,
        exceededClassHours: '',
        isStable: '',
        consultant: '',
        introducerName: '',
        reputationRelationship: '',
        reputationSource: '',
      })
    }

    // 添加总计行
    const grandTotal = dataSource.reduce(
      (sum, record) => ({
        receivableTuition: sum.receivableTuition + record.receivableTuition,
        actualTuition: sum.actualTuition + record.actualTuition,
      }),
      { receivableTuition: 0, actualTuition: 0 },
    )

    tableData.push({
      key: 'grand-total',
      isMonthHeader: false,
      isDataRow: false,
      isGrandTotal: true,
      month: 0,
      instructorName: '总计',
      registrantName: '',
      registrationTime: '',
      registrationMajor: '',
      registrationDuration: '',
      receivableTuition: grandTotal.receivableTuition,
      actualTuition: grandTotal.actualTuition,
      exceededClassHours: '',
      isStable: '',
      consultant: '',
      introducerName: '',
      reputationRelationship: '',
      reputationSource: '',
    })

    return tableData
  }

  // 表格列定义
  const columns = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center' as const,
      render: (month: number, record: any) => {
        if (record.isMonthHeader) {
          return <strong style={{ color: '#1890ff' }}>{month}月</strong>
        }
        if (record.isTotalRow || record.isGrandTotal) {
          return ''
        }
        return month
      },
    },
    {
      title: '教员姓名',
      dataIndex: 'instructorName',
      key: 'instructorName',
      width: 120,
      align: 'center' as const,
      render: (name: string, record: any) => {
        if (record.isTotalRow) {
          return <strong style={{ color: '#ff4d4f' }}>合计</strong>
        }
        if (record.isGrandTotal) {
          return <strong style={{ color: '#ff4d4f' }}>总计</strong>
        }
        return name
      },
    },
    {
      title: '报名者姓名',
      dataIndex: 'registrantName',
      key: 'registrantName',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '报名时间',
      dataIndex: 'registrationTime',
      key: 'registrationTime',
      width: 120,
      align: 'center' as const,
      render: (time: string) => (time ? dayjs(time).format('YYYY.MM.DD') : ''),
    },
    {
      title: '报名专业',
      dataIndex: 'registrationMajor',
      key: 'registrationMajor',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '报名学制',
      dataIndex: 'registrationDuration',
      key: 'registrationDuration',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '应收学费',
      dataIndex: 'receivableTuition',
      key: 'receivableTuition',
      width: 120,
      align: 'center' as const,
      render: (amount: number, record: any) => {
        if (record.isTotalRow || record.isGrandTotal) {
          return <strong style={{ color: '#ff4d4f' }}>{amount.toLocaleString()}</strong>
        }
        return amount > 0 ? amount.toLocaleString() : ''
      },
    },
    {
      title: '实交学费',
      dataIndex: 'actualTuition',
      key: 'actualTuition',
      width: 120,
      align: 'center' as const,
      render: (amount: number, record: any) => {
        if (record.isTotalRow || record.isGrandTotal) {
          return <strong style={{ color: '#ff4d4f' }}>{amount.toLocaleString()}</strong>
        }
        return amount > 0 ? amount.toLocaleString() : ''
      },
    },
    {
      title: '是否过课时',
      dataIndex: 'exceededClassHours',
      key: 'exceededClassHours',
      width: 100,
      align: 'center' as const,
      render: (value: string) => {
        if (!value) return ''
        return <Tag color={value === '是' ? 'green' : 'red'}>{value}</Tag>
      },
    },
    {
      title: '是否稳定',
      dataIndex: 'isStable',
      key: 'isStable',
      width: 100,
      align: 'center' as const,
      render: (value: string) => {
        if (!value) return ''
        return <Tag color={value === '稳定' ? 'green' : 'red'}>{value}</Tag>
      },
    },
    {
      title: '咨询师',
      dataIndex: 'consultant',
      key: 'consultant',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '介绍人姓名',
      dataIndex: 'introducerName',
      key: 'introducerName',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '口碑介绍关系',
      dataIndex: 'reputationRelationship',
      key: 'reputationRelationship',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '口碑来源',
      dataIndex: 'reputationSource',
      key: 'reputationSource',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_, record: any) => {
        if (record.isMonthHeader || record.isTotalRow || record.isGrandTotal || !record.isDataRow) {
          return ''
        }
        return (
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
        )
      },
    },
  ]

  // 统计数据
  const statistics = {
    totalRegistrations: dataSource.length,
    totalReceivableTuition: dataSource.reduce((sum, item) => sum + item.receivableTuition, 0),
    totalActualTuition: dataSource.reduce((sum, item) => sum + item.actualTuition, 0),
    stableRegistrations: dataSource.filter((item) => item.isStable === '稳定').length,
    exceededClassHours: dataSource.filter((item) => item.exceededClassHours === '是').length,
    monthlyRegistrations: Object.keys(groupedData).length,
    averageMonthlyTuition:
      dataSource.length > 0
        ? Math.round(
            dataSource.reduce((sum, item) => sum + item.receivableTuition, 0) / dataSource.length,
          )
        : 0,
  }

  // 处理添加
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 处理编辑
  const handleEdit = (record: ReputationRegistrationRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      registrationTime: record.registrationTime ? dayjs(record.registrationTime) : null,
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
        registrationTime: values.registrationTime?.format('YYYY-MM-DD') || '',
      }

      if (editingRecord) {
        // 编辑
        setDataSource((prev) =>
          prev.map((item) =>
            item.id === editingRecord.id
              ? {
                  ...item,
                  ...formData,
                  updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                }
              : item,
          ),
        )
        message.success('更新成功')
      } else {
        // 新增
        const newRecord: ReputationRegistrationRecord = {
          id: Date.now().toString(),
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
      item.registrantName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.instructorName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.registrationMajor.toLowerCase().includes(searchText.toLowerCase()) ||
      item.consultant.toLowerCase().includes(searchText.toLowerCase()),
  )

  // 计算稳定率
  const stabilityRate =
    statistics.totalRegistrations > 0
      ? ((statistics.stableRegistrations / statistics.totalRegistrations) * 100).toFixed(1)
      : '0'

  return (
    <div style={{ padding: 24 }}>
      <Card>
        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic
              title="总报名数"
              value={statistics.totalRegistrations}
              suffix="人"
              prefix={<UserOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="应收学费总额"
              value={statistics.totalReceivableTuition}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="实交学费总额"
              value={statistics.totalActualTuition}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="稳定率"
              value={stabilityRate}
              suffix="%"
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic
              title="稳定学员"
              value={statistics.stableRegistrations}
              suffix="人"
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="过课时学员"
              value={statistics.exceededClassHours}
              suffix="人"
              prefix={<CalendarOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="有数据月份"
              value={statistics.monthlyRegistrations}
              suffix="个月"
              prefix={<CalendarOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均学费"
              value={statistics.averageMonthlyTuition}
              prefix={<DollarOutlined />}
            />
          </Col>
        </Row>

        {/* 操作按钮 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加报名
            </Button>
          </Space>

          <Input.Search
            placeholder="搜索报名者姓名、教员或专业"
            style={{ width: 300 }}
            onSearch={handleSearch}
            allowClear
          />
        </div>

        {/* 数据表格 */}
        <Table
          columns={columns}
          dataSource={generateTableData()}
          rowKey="key"
          loading={loading}
          scroll={{ x: 2000 }}
          pagination={false}
          bordered
          size="small"
          rowClassName={(record) => {
            if (record.isMonthHeader) return 'month-header-row'
            if (record.isTotalRow) return 'total-row'
            if (record.isGrandTotal) return 'grand-total-row'
            return ''
          }}
        />
      </Card>

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑口碑报名登记' : '添加口碑报名登记'}
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
            exceededClassHours: '是',
            isStable: '稳定',
            reputationRelationship: '亲戚',
            reputationSource: '在校生提供',
          }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="month"
                label="月份"
                rules={[{ required: true, message: '请选择月份' }]}
              >
                <Select>
                  {Array.from({ length: 12 }, (_, i) => (
                    <Option key={i + 1} value={i + 1}>
                      {i + 1}月
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="instructorName"
                label="教员姓名"
                rules={[{ required: true, message: '请输入教员姓名' }]}
              >
                <Input placeholder="请输入教员姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="registrantName"
                label="报名者姓名"
                rules={[{ required: true, message: '请输入报名者姓名' }]}
              >
                <Input placeholder="请输入报名者姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="registrationTime"
                label="报名时间"
                rules={[{ required: true, message: '请选择报名时间' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="registrationMajor"
                label="报名专业"
                rules={[{ required: true, message: '请输入报名专业' }]}
              >
                <Input placeholder="请输入报名专业" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="registrationDuration"
                label="报名学制"
                rules={[{ required: true, message: '请输入报名学制' }]}
              >
                <Input placeholder="请输入报名学制" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="receivableTuition"
                label="应收学费"
                rules={[{ required: true, message: '请输入应收学费' }]}
              >
                <Input type="number" placeholder="请输入应收学费" addonBefore="¥" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="actualTuition"
                label="实交学费"
                rules={[{ required: true, message: '请输入实交学费' }]}
              >
                <Input type="number" placeholder="请输入实交学费" addonBefore="¥" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="exceededClassHours"
                label="是否过课时"
                rules={[{ required: true, message: '请选择是否过课时' }]}
              >
                <Select>
                  <Option value="是">是</Option>
                  <Option value="否">否</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="isStable"
                label="是否稳定"
                rules={[{ required: true, message: '请选择是否稳定' }]}
              >
                <Select>
                  <Option value="稳定">稳定</Option>
                  <Option value="不稳定">不稳定</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="consultant"
                label="咨询师"
                rules={[{ required: true, message: '请输入咨询师' }]}
              >
                <Input placeholder="请输入咨询师" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="introducerName"
                label="介绍人姓名"
                rules={[{ required: true, message: '请输入介绍人姓名' }]}
              >
                <Input placeholder="请输入介绍人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="reputationRelationship"
                label="口碑介绍关系"
                rules={[{ required: true, message: '请选择口碑介绍关系' }]}
              >
                <Select>
                  <Option value="亲戚">亲戚</Option>
                  <Option value="朋友">朋友</Option>
                  <Option value="同事">同事</Option>
                  <Option value="同学">同学</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="reputationSource"
            label="口碑来源"
            rules={[{ required: true, message: '请选择口碑来源' }]}
          >
            <Select>
              <Option value="在校生提供">在校生提供</Option>
              <Option value="毕业生推荐">毕业生推荐</Option>
              <Option value="在职员工推荐">在职员工推荐</Option>
              <Option value="家长推荐">家长推荐</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        :global(.month-header-row) {
          background-color: #f0f9ff !important;
          font-weight: bold;
        }
        :global(.total-row) {
          background-color: #fff2f0 !important;
          font-weight: bold;
        }
        :global(.grand-total-row) {
          background-color: #fff1f0 !important;
          font-weight: bold;
        }
      `}</style>
    </div>
  )
}

export default ReputationRegistrationPage
