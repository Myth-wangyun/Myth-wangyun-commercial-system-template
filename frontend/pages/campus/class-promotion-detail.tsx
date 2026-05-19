import React, { useState, useEffect } from 'react'
import { App,
  Card,
  Table,
  Button,
  Space,
  Input,
  Typography,
  Row,
  Col,
  Statistic,
  Select,
  Tag,
  Modal,
  Form,
  DatePicker,
  InputNumber,
} from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  SearchOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Title } = Typography
const { Option } = Select

// 班级升学明细数据接口
interface ClassPromotionDetailRecord {
  key: string
  classId: string // 班级
  serialNumber: number // 序号
  name: string // 姓名
  idCard: string // 身份证号
  enrollmentDate: string // 入学时间
  enrollmentAge: string // 入学年龄
  receivableAmount: number // 应收
  plannedPaymentAmount: number // 预计缴费金额
  actualPaymentAmount: number // 实际缴费金额
  supplementPaymentTime: string // 补款时间
  supplementPaymentAmount: number // 补款金额
  actualPaymentTime: string // 实际缴费时间
  plannedPaymentDate: string // 计划缴费日期
  campus: string // 神殿
  headTeacher: string // 班主任
}

// 班级列表
const classList = [
  { id: 'Y22414', name: 'Y22414班' },
  { id: 'Y22415', name: 'Y22415班' },
  { id: 'Y22416', name: 'Y22416班' },
  { id: 'Y22417', name: 'Y22417班' },
]

// 模拟数据
const mockData: ClassPromotionDetailRecord[] = [
  // Y22414班 - 主神殿
  {
    key: '1',
    classId: 'Y22414',
    serialNumber: 1,
    campus: '盛邦',
    headTeacher: '郭丽萍',
    name: '张伟',
    idCard: '130102200705****',
    enrollmentDate: '2024-05-07',
    enrollmentAge: '17周',
    receivableAmount: 25800,
    plannedPaymentAmount: 25800,
    actualPaymentAmount: 25800,
    supplementPaymentTime: '',
    supplementPaymentAmount: 0,
    actualPaymentTime: '',
    plannedPaymentDate: '2025年8月',
  },
  {
    key: '2',
    classId: 'Y22414',
    serialNumber: 2,
    campus: '盛邦',
    headTeacher: '郭丽萍',
    name: '李娜',
    idCard: '130103200606****',
    enrollmentDate: '2024-06-30',
    enrollmentAge: '18周',
    receivableAmount: 25800,
    plannedPaymentAmount: 25800,
    actualPaymentAmount: 25800,
    supplementPaymentTime: '',
    supplementPaymentAmount: 0,
    actualPaymentTime: '',
    plannedPaymentDate: '2025年8月',
  },
  {
    key: '3',
    classId: 'Y22414',
    serialNumber: 3,
    campus: '盛邦',
    headTeacher: '郭丽萍',
    name: '王强',
    idCard: '130104200607****',
    enrollmentDate: '2024-07-15',
    enrollmentAge: '18周',
    receivableAmount: 25800,
    plannedPaymentAmount: 25800,
    actualPaymentAmount: 25800,
    supplementPaymentTime: '',
    supplementPaymentAmount: 0,
    actualPaymentTime: '',
    plannedPaymentDate: '2025年8月',
  },
  {
    key: '4',
    classId: 'Y22414',
    serialNumber: 4,
    campus: '盛邦',
    headTeacher: '郭丽萍',
    name: '赵敏',
    idCard: '130105200707****',
    enrollmentDate: '2024-07-08',
    enrollmentAge: '17周',
    receivableAmount: 25800,
    plannedPaymentAmount: 25800,
    actualPaymentAmount: 25800,
    supplementPaymentTime: '',
    supplementPaymentAmount: 0,
    actualPaymentTime: '',
    plannedPaymentDate: '2025年8月',
  },
  {
    key: '5',
    classId: 'Y22414',
    serialNumber: 5,
    campus: '盛邦',
    headTeacher: '郭丽萍',
    name: '孙华',
    idCard: '130106200706****',
    enrollmentDate: '2024-06-23',
    enrollmentAge: '17周',
    receivableAmount: 25800,
    plannedPaymentAmount: 25800,
    actualPaymentAmount: 25800,
    supplementPaymentTime: '',
    supplementPaymentAmount: 0,
    actualPaymentTime: '',
    plannedPaymentDate: '2025年8月',
  },
  {
    key: '6',
    classId: 'Y22414',
    serialNumber: 6,
    campus: '盛邦',
    headTeacher: '郭丽萍',
    name: '周杰',
    idCard: '130107200606****',
    enrollmentDate: '2024-06-23',
    enrollmentAge: '18周',
    receivableAmount: 25800,
    plannedPaymentAmount: 25800,
    actualPaymentAmount: 25800,
    supplementPaymentTime: '',
    supplementPaymentAmount: 0,
    actualPaymentTime: '',
    plannedPaymentDate: '2025年8月',
  },
  {
    key: '7',
    classId: 'Y22414',
    serialNumber: 7,
    campus: '盛邦',
    headTeacher: '郭丽萍',
    name: '吴敏',
    idCard: '130108200705****',
    enrollmentDate: '2024-05-06',
    enrollmentAge: '17周',
    receivableAmount: 14800,
    plannedPaymentAmount: 14800,
    actualPaymentAmount: 14800,
    supplementPaymentTime: '',
    supplementPaymentAmount: 0,
    actualPaymentTime: '',
    plannedPaymentDate: '2025年8月',
  },
  {
    key: '8',
    classId: 'Y22414',
    serialNumber: 8,
    campus: '盛邦',
    headTeacher: '郭丽萍',
    name: '郑娟',
    idCard: '130109200608****',
    enrollmentDate: '2024-08-17',
    enrollmentAge: '18周',
    receivableAmount: 25800,
    plannedPaymentAmount: 25800,
    actualPaymentAmount: 25800,
    supplementPaymentTime: '',
    supplementPaymentAmount: 0,
    actualPaymentTime: '',
    plannedPaymentDate: '2025年8月',
  },
  {
    key: '9',
    classId: 'Y22414',
    serialNumber: 9,
    campus: '盛邦',
    headTeacher: '郭丽萍',
    name: '钱涛',
    idCard: '130110200608****',
    enrollmentDate: '2024-08-22',
    enrollmentAge: '19周',
    receivableAmount: 25800,
    plannedPaymentAmount: 25800,
    actualPaymentAmount: 25800,
    supplementPaymentTime: '',
    supplementPaymentAmount: 0,
    actualPaymentTime: '',
    plannedPaymentDate: '2025年8月',
  },

  // Y22415班 - 永恒殿
  {
    key: '10',
    classId: 'Y22415',
    serialNumber: 1,
    campus: '冀美',
    headTeacher: '王芳',
    name: '刘洋',
    idCard: '130202200705****',
    enrollmentDate: '2024-05-10',
    enrollmentAge: '17周',
    receivableAmount: 25800,
    plannedPaymentAmount: 25800,
    actualPaymentAmount: 25800,
    supplementPaymentTime: '',
    supplementPaymentAmount: 0,
    actualPaymentTime: '',
    plannedPaymentDate: '2025年9月',
  },
  {
    key: '11',
    classId: 'Y22415',
    serialNumber: 2,
    campus: '冀美',
    headTeacher: '王芳',
    name: '陈静',
    idCard: '130203200606****',
    enrollmentDate: '2024-06-15',
    enrollmentAge: '18周',
    receivableAmount: 25800,
    plannedPaymentAmount: 25800,
    actualPaymentAmount: 25800,
    supplementPaymentTime: '',
    supplementPaymentAmount: 0,
    actualPaymentTime: '',
    plannedPaymentDate: '2025年9月',
  },
  {
    key: '12',
    classId: 'Y22415',
    serialNumber: 3,
    campus: '冀美',
    headTeacher: '王芳',
    name: '杨帆',
    idCard: '130204200707****',
    enrollmentDate: '2024-07-20',
    enrollmentAge: '17周',
    receivableAmount: 25800,
    plannedPaymentAmount: 25800,
    actualPaymentAmount: 25800,
    supplementPaymentTime: '',
    supplementPaymentAmount: 0,
    actualPaymentTime: '',
    plannedPaymentDate: '2025年9月',
  },
  {
    key: '13',
    classId: 'Y22415',
    serialNumber: 4,
    campus: '冀美',
    headTeacher: '王芳',
    name: '黄磊',
    idCard: '130205200608****',
    enrollmentDate: '2024-08-05',
    enrollmentAge: '18周',
    receivableAmount: 25800,
    plannedPaymentAmount: 25800,
    actualPaymentAmount: 25800,
    supplementPaymentTime: '',
    supplementPaymentAmount: 0,
    actualPaymentTime: '',
    plannedPaymentDate: '2025年9月',
  },
  {
    key: '14',
    classId: 'Y22415',
    serialNumber: 5,
    campus: '冀美',
    headTeacher: '王芳',
    name: '周敏',
    idCard: '130206200706****',
    enrollmentDate: '2024-06-28',
    enrollmentAge: '17周',
    receivableAmount: 14800,
    plannedPaymentAmount: 14800,
    actualPaymentAmount: 14800,
    supplementPaymentTime: '',
    supplementPaymentAmount: 0,
    actualPaymentTime: '',
    plannedPaymentDate: '2025年9月',
  },

  // Y22416班 - 慈悲殿
  {
    key: '15',
    classId: 'Y22416',
    serialNumber: 1,
    campus: '石美',
    headTeacher: '刘强',
    name: '吴刚',
    idCard: '130302200705****',
    enrollmentDate: '2024-05-12',
    enrollmentAge: '17周',
    receivableAmount: 25800,
    plannedPaymentAmount: 25800,
    actualPaymentAmount: 25800,
    supplementPaymentTime: '',
    supplementPaymentAmount: 0,
    actualPaymentTime: '',
    plannedPaymentDate: '2025年8月',
  },
  {
    key: '16',
    classId: 'Y22416',
    serialNumber: 2,
    campus: '石美',
    headTeacher: '刘强',
    name: '郑梅',
    idCard: '130303200606****',
    enrollmentDate: '2024-06-18',
    enrollmentAge: '18周',
    receivableAmount: 25800,
    plannedPaymentAmount: 25800,
    actualPaymentAmount: 25800,
    supplementPaymentTime: '',
    supplementPaymentAmount: 0,
    actualPaymentTime: '',
    plannedPaymentDate: '2025年8月',
  },
  {
    key: '17',
    classId: 'Y22416',
    serialNumber: 3,
    campus: '石美',
    headTeacher: '刘强',
    name: '王丽',
    idCard: '130304200707****',
    enrollmentDate: '2024-07-22',
    enrollmentAge: '17周',
    receivableAmount: 25800,
    plannedPaymentAmount: 25800,
    actualPaymentAmount: 25800,
    supplementPaymentTime: '',
    supplementPaymentAmount: 0,
    actualPaymentTime: '',
    plannedPaymentDate: '2025年8月',
  },
  {
    key: '18',
    classId: 'Y22416',
    serialNumber: 4,
    campus: '石美',
    headTeacher: '刘强',
    name: '赵强',
    idCard: '130305200608****',
    enrollmentDate: '2024-08-10',
    enrollmentAge: '18周',
    receivableAmount: 25800,
    plannedPaymentAmount: 25800,
    actualPaymentAmount: 25800,
    supplementPaymentTime: '',
    supplementPaymentAmount: 0,
    actualPaymentTime: '',
    plannedPaymentDate: '2025年8月',
  },

  // Y22417班 - 李大殿
  {
    key: '19',
    classId: 'Y22417',
    serialNumber: 1,
    campus: '晋美',
    headTeacher: '赵丽',
    name: '孙伟',
    idCard: '130402200705****',
    enrollmentDate: '2024-05-15',
    enrollmentAge: '17周',
    receivableAmount: 25800,
    plannedPaymentAmount: 25800,
    actualPaymentAmount: 25800,
    supplementPaymentTime: '',
    supplementPaymentAmount: 0,
    actualPaymentTime: '',
    plannedPaymentDate: '2025年9月',
  },
  {
    key: '20',
    classId: 'Y22417',
    serialNumber: 2,
    campus: '晋美',
    headTeacher: '赵丽',
    name: '李芳',
    idCard: '130403200606****',
    enrollmentDate: '2024-06-20',
    enrollmentAge: '18周',
    receivableAmount: 25800,
    plannedPaymentAmount: 25800,
    actualPaymentAmount: 25800,
    supplementPaymentTime: '',
    supplementPaymentAmount: 0,
    actualPaymentTime: '',
    plannedPaymentDate: '2025年9月',
  },
  {
    key: '21',
    classId: 'Y22417',
    serialNumber: 3,
    campus: '晋美',
    headTeacher: '赵丽',
    name: '周华',
    idCard: '130404200707****',
    enrollmentDate: '2024-07-25',
    enrollmentAge: '17周',
    receivableAmount: 14800,
    plannedPaymentAmount: 14800,
    actualPaymentAmount: 14800,
    supplementPaymentTime: '',
    supplementPaymentAmount: 0,
    actualPaymentTime: '',
    plannedPaymentDate: '2025年9月',
  },
]

const CampusClassPromotionDetailTable: React.FC = () => {
  const { message, modal } = App.useApp()
  const [searchText, setSearchText] = useState('')
  const [selectedCampus, setSelectedCampus] = useState<string>('全部')
  const [selectedClass, setSelectedClass] = useState<string>('全部')
  const [filteredData, setFilteredData] = useState<ClassPromotionDetailRecord[]>(mockData)
  const [dataSource, setDataSource] = useState<ClassPromotionDetailRecord[]>(mockData)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ClassPromotionDetailRecord | null>(null)
  const [form] = Form.useForm()

  // 处理搜索和筛选
  useEffect(() => {
    let result = dataSource

    // 按神殿筛选
    if (selectedCampus !== '全部') {
      result = result.filter((item) => item.campus === selectedCampus)
    }

    // 按班级筛选
    if (selectedClass !== '全部') {
      result = result.filter((item) => item.classId === selectedClass)
    }

    // 按关键字搜索
    if (searchText) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(searchText.toLowerCase()) ||
          item.idCard.toLowerCase().includes(searchText.toLowerCase()) ||
          item.headTeacher.toLowerCase().includes(searchText.toLowerCase()),
      )
    }

    setFilteredData(result)
  }, [searchText, selectedCampus, selectedClass, dataSource])

  // 计算统计数据
  const totalRecords = filteredData.length
  const totalReceivable = filteredData.reduce((sum, item) => sum + item.receivableAmount, 0)
  const totalPlannedPayment = filteredData.reduce((sum, item) => sum + item.plannedPaymentAmount, 0)
  const totalActualPayment = filteredData.reduce((sum, item) => sum + item.actualPaymentAmount, 0)
  const totalSupplementPayment = filteredData.reduce(
    (sum, item) => sum + item.supplementPaymentAmount,
    0,
  )

  // 添加记录
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 编辑记录
  const handleEdit = (record: ClassPromotionDetailRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      enrollmentDate: record.enrollmentDate ? dayjs(record.enrollmentDate) : undefined,
    })
    setModalVisible(true)
  }

  // 删除记录
  const handleDelete = (record: ClassPromotionDetailRecord) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除学生"${record.name}"的升学记录吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        const newData = dataSource.filter((item) => item.key !== record.key)
        setDataSource(newData)
        message.success('删除成功')
      },
    })
  }

  // 保存记录
  const handleSave = async () => {
    try {
      const values = await form.validateFields()

      // 格式化日期
      if (values.enrollmentDate) {
        values.enrollmentDate = values.enrollmentDate.format('YYYY-MM-DD')
      }

      if (editingRecord) {
        // 更新记录
        const newData = dataSource.map((item) =>
          item.key === editingRecord.key ? { ...item, ...values } : item,
        )
        setDataSource(newData)
        message.success('更新成功')
      } else {
        // 添加新记录
        const maxSerialNumber = dataSource
          .filter((item) => item.classId === values.classId)
          .reduce((max, item) => Math.max(max, item.serialNumber), 0)

        const newRecord: ClassPromotionDetailRecord = {
          key: `${Date.now()}`,
          serialNumber: maxSerialNumber + 1,
          ...values,
        }
        setDataSource([...dataSource, newRecord])
        message.success('添加成功')
      }

      setModalVisible(false)
      form.resetFields()
      setEditingRecord(null)
    } catch (error) {
      message.error('保存失败，请检查表单信息')
    }
  }

  // 取消编辑
  const handleCancel = () => {
    setModalVisible(false)
    form.resetFields()
    setEditingRecord(null)
  }

  // 计算班级合计
  const calculateClassTotals = () => {
    const classTotals: {
      [key: string]: {
        receivableTotal: number
        plannedTotal: number
        actualTotal: number
        count: number
      }
    } = {}

    filteredData.forEach((item) => {
      if (!classTotals[item.classId]) {
        classTotals[item.classId] = {
          receivableTotal: 0,
          plannedTotal: 0,
          actualTotal: 0,
          count: 0,
        }
      }
      classTotals[item.classId].receivableTotal += item.receivableAmount
      classTotals[item.classId].plannedTotal += item.plannedPaymentAmount
      classTotals[item.classId].actualTotal += item.actualPaymentAmount
      classTotals[item.classId].count += 1
    })

    return classTotals
  }

  // 表格列定义
  const columns: ColumnsType<ClassPromotionDetailRecord> = [
    {
      title: '班级',
      dataIndex: 'classId',
      key: 'classId',
      width: 100,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 60,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      key: 'idCard',
      width: 160,
      align: 'center',
    },
    {
      title: '入学时间',
      dataIndex: 'enrollmentDate',
      key: 'enrollmentDate',
      width: 110,
      align: 'center',
    },
    {
      title: '入学年龄',
      dataIndex: 'enrollmentAge',
      key: 'enrollmentAge',
      width: 90,
      align: 'center',
    },
    {
      title: '应收',
      dataIndex: 'receivableAmount',
      key: 'receivableAmount',
      width: 100,
      align: 'right',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '预计缴费金额',
      dataIndex: 'plannedPaymentAmount',
      key: 'plannedPaymentAmount',
      width: 120,
      align: 'right',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '实际缴费金额',
      dataIndex: 'actualPaymentAmount',
      key: 'actualPaymentAmount',
      width: 120,
      align: 'right',
      render: (value: number) => (value > 0 ? `¥${value.toLocaleString()}` : '-'),
    },
    {
      title: '补款时间',
      dataIndex: 'supplementPaymentTime',
      key: 'supplementPaymentTime',
      width: 110,
      align: 'center',
      render: (time: string) => time || '-',
    },
    {
      title: '补款金额',
      dataIndex: 'supplementPaymentAmount',
      key: 'supplementPaymentAmount',
      width: 100,
      align: 'right',
      render: (value: number) => (value > 0 ? `¥${value.toLocaleString()}` : '-'),
    },
    {
      title: '实际缴费时间',
      dataIndex: 'actualPaymentTime',
      key: 'actualPaymentTime',
      width: 120,
      align: 'center',
      render: (time: string) => time || '-',
    },
    {
      title: '计划缴费日期',
      dataIndex: 'plannedPaymentDate',
      key: 'plannedPaymentDate',
      width: 120,
      align: 'center',
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 80,
      align: 'center',
    },
    {
      title: '班主任',
      dataIndex: 'headTeacher',
      key: 'headTeacher',
      width: 100,
      align: 'center',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (_: any, record: ClassPromotionDetailRecord) => (
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

  const handleRefresh = () => {
    setSearchText('')
    setSelectedCampus('全部')
    setSelectedClass('全部')
    setDataSource(mockData)
  }

  const handleExport = () => {
    console.log('导出数据')
    message.success('数据导出功能开发中')
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card
        title={
          <Space>
            <TeamOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>
              神殿教化司班级升学明细表
            </Title>
          </Space>
        }
        extra={
          <Space>
            <Select value={selectedCampus} onChange={setSelectedCampus} style={{ width: 120 }}>
              <Option value="全部">全部神殿</Option>
              <Option value="盛邦">盛邦</Option>
              <Option value="冀美">冀美</Option>
              <Option value="石美">石美</Option>
              <Option value="晋美">晋美</Option>
              <Option value="原美">原美</Option>
              <Option value="太美">太美</Option>
              <Option value="桂美">桂美</Option>
            </Select>
            <Select value={selectedClass} onChange={setSelectedClass} style={{ width: 140 }}>
              <Option value="全部">全部班级</Option>
              {classList.map((cls) => (
                <Option key={cls.id} value={cls.id}>
                  {cls.name}
                </Option>
              ))}
            </Select>
            <Input
              placeholder="搜索姓名、身份证、班主任"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 220 }}
              allowClear
            />
            <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>
              新增
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>
        }
        style={{ marginBottom: '16px' }}
      >
        <Row gutter={16}>
          <Col span={4}>
            <Statistic
              title="总学生数"
              value={totalRecords}
              suffix="人"
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col span={5}>
            <Statistic
              title="应收总额"
              value={totalReceivable}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={5}>
            <Statistic
              title="预计缴费总额"
              value={totalPlannedPayment}
              prefix="¥"
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={5}>
            <Statistic
              title="实际缴费总额"
              value={totalActualPayment}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={5}>
            <Statistic
              title="补款总额"
              value={totalSupplementPayment}
              prefix="¥"
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: 2200, y: 600 }}
          pagination={{
            total: filteredData.length,
            defaultPageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          bordered
          size="middle"
          summary={(pageData) => {
            if (pageData.length === 0) return null

            // 按班级分组计算合计
            const classTotals = calculateClassTotals()
            const uniqueClasses = Array.from(new Set(pageData.map((item) => item.classId)))

            return (
              <>
                {uniqueClasses.map((classId) => {
                  const classData = pageData.filter((item) => item.classId === classId)
                  if (classData.length === 0) return null

                  const receivableTotal = classData.reduce(
                    (sum, item) => sum + item.receivableAmount,
                    0,
                  )
                  const plannedTotal = classData.reduce(
                    (sum, item) => sum + item.plannedPaymentAmount,
                    0,
                  )
                  const actualTotal = classData.reduce(
                    (sum, item) => sum + item.actualPaymentAmount,
                    0,
                  )

                  return (
                    <Table.Summary.Row
                      key={`summary-${classId}`}
                      style={{ background: '#fafafa', fontWeight: 'bold' }}
                    >
                      <Table.Summary.Cell index={0} align="center">
                        {classId}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="center">
                        合计
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} colSpan={4}></Table.Summary.Cell>
                      <Table.Summary.Cell index={6} align="right">
                        <span style={{ color: '#1890ff' }}>¥{receivableTotal.toLocaleString()}</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={7} align="right">
                        <span style={{ color: '#3f8600' }}>¥{plannedTotal.toLocaleString()}</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={8} align="right">
                        <span style={{ color: '#52c41a' }}>¥{actualTotal.toLocaleString()}</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={9} colSpan={7}></Table.Summary.Cell>
                    </Table.Summary.Row>
                  )
                })}
              </>
            )
          }}
        />
      </Card>

      {/* 新增/编辑 Modal */}
      <Modal
        title={editingRecord ? '编辑班级升学记录' : '新增班级升学记录'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={handleCancel}
        width={900}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            receivableAmount: 0,
            plannedPaymentAmount: 0,
            actualPaymentAmount: 0,
            supplementPaymentAmount: 0,
          }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="classId"
                label="班级"
                rules={[{ required: true, message: '请选择班级' }]}
              >
                <Select placeholder="请选择班级">
                  {classList.map((cls) => (
                    <Option key={cls.id} value={cls.id}>
                      {cls.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="campus"
                label="神殿"
                rules={[{ required: true, message: '请选择神殿' }]}
              >
                <Select placeholder="请选择神殿">
                  <Option value="盛邦">盛邦</Option>
                  <Option value="冀美">冀美</Option>
                  <Option value="石美">石美</Option>
                  <Option value="晋美">晋美</Option>
                  <Option value="原美">原美</Option>
                  <Option value="太美">太美</Option>
                  <Option value="桂美">桂美</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="headTeacher"
                label="班主任"
                rules={[{ required: true, message: '请输入班主任姓名' }]}
              >
                <Input placeholder="请输入班主任姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入学生姓名' }]}
              >
                <Input placeholder="请输入学生姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="idCard"
                label="身份证号"
                rules={[
                  { required: true, message: '请输入身份证号' },
                  {
                    pattern:
                      /^\d{6}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[0-9Xx*]$/,
                    message: '请输入有效的身份证号',
                  },
                ]}
              >
                <Input placeholder="请输入身份证号" maxLength={18} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="enrollmentDate"
                label="入学时间"
                rules={[{ required: true, message: '请选择入学时间' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择入学时间" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="enrollmentAge"
                label="入学年龄"
                rules={[{ required: true, message: '请输入入学年龄' }]}
              >
                <Input placeholder="如：17周、18周" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="receivableAmount"
                label="应收"
                rules={[{ required: true, message: '请输入应收金额' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入应收金额"
                  min={0}
                  precision={0}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="plannedPaymentAmount"
                label="预计缴费金额"
                rules={[{ required: true, message: '请输入预计缴费金额' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入预计缴费金额"
                  min={0}
                  precision={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="actualPaymentAmount" label="实际缴费金额">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入实际缴费金额"
                  min={0}
                  precision={0}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="supplementPaymentTime" label="补款时间">
                <Input placeholder="如需填写请输入" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="supplementPaymentAmount" label="补款金额">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入补款金额"
                  min={0}
                  precision={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="actualPaymentTime" label="实际缴费时间">
                <Input placeholder="如需填写请输入" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="plannedPaymentDate"
                label="计划缴费日期"
                rules={[{ required: true, message: '请输入计划缴费日期' }]}
              >
                <Input placeholder="如：2025年8月" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default CampusClassPromotionDetailTable
