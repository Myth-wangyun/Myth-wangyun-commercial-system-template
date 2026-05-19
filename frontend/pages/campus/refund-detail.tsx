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
  DollarOutlined,
  WarningOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Title } = Typography
const { Option } = Select

// 退费明细数据接口
interface RefundDetailRecord {
  key: string
  serialNumber: number // 序号
  name: string // 姓名
  gender: string // 性别
  idCard: string // 身份证号
  enrollmentDate: string // 入学时间
  enrollmentAge: string // 入学年龄
  education: string // 学历
  graduationDate: string // 毕业时间
  graduationAge: string // 毕业年龄
  highestCertificate: string // 毕业所获最高学历证书及性质
  campusSource: string // 神殿来源
  consultant: string // 咨询师
  reportedMajor: string // 所报专业
  educationSystem: string // 学制
  receivableTuition: number // 应收学费金额
  headTeacherName: string // 班主任姓名
  studentStatus: string // 学员状态
  previousMajor: string // 过往专业
  graduationSchool: string // 毕业学校
  contactPhone: string // 联系电话
  parentPhone: string // 家长电话
  contactAddress: string // 通信地址
  householdType: string // 户口性质
  studyMode: string // 就读方式
  currentAddress: string // 现住址
  hasRegistrationCommitment: string // 是否承诺注册学历
  registrationCommitmentDetails: string // 承诺注册学历性质、级别、名称
  hasRegistered: string // 是否已注册中专/大专
  registeredSchool: string // 所注册学校
  remarks: string // 备注
  refundTime: string // 退费时间
  refundAmount: number // 退费金额
  campus: string // 神殿（用于筛选，不显示在表格中）
}

// 模拟数据
const mockData: RefundDetailRecord[] = [
  // 主神殿
  {
    key: '1',
    serialNumber: 1,
    campus: '盛邦',
    name: '张伟',
    gender: '男',
    idCard: '130102200605****',
    enrollmentDate: '2024-03-15',
    enrollmentAge: '18',
    education: '初中',
    graduationDate: '2024-06-15',
    graduationAge: '18',
    highestCertificate: '初中毕业证',
    campusSource: '主神殿',
    consultant: '李咨询师',
    reportedMajor: '计算机应用',
    educationSystem: '三年制',
    receivableTuition: 25800,
    headTeacherName: '郭丽萍',
    studentStatus: '退学',
    previousMajor: '无',
    graduationSchool: '石家庄市第一中学',
    contactPhone: '13800138001',
    parentPhone: '13800138002',
    contactAddress: '河北省石家庄市长安区XXX街道',
    householdType: '城镇',
    studyMode: '全日制',
    currentAddress: '河北省石家庄市长安区XXX小区',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、计算机应用',
    hasRegistered: '否',
    registeredSchool: '',
    remarks: '个人原因退学',
    refundTime: '2024-06-15',
    refundAmount: 20000,
  },
  {
    key: '2',
    serialNumber: 2,
    campus: '盛邦',
    name: '李娜',
    gender: '女',
    idCard: '130103200706****',
    enrollmentDate: '2024-04-10',
    enrollmentAge: '17',
    education: '初中',
    graduationDate: '2024-07-20',
    graduationAge: '17',
    highestCertificate: '初中毕业证',
    campusSource: '主神殿',
    consultant: '王咨询师',
    reportedMajor: '网络工程',
    educationSystem: '三年制',
    receivableTuition: 14800,
    headTeacherName: '郭丽萍',
    studentStatus: '退学',
    previousMajor: '无',
    graduationSchool: '石家庄市第二中学',
    contactPhone: '13800138003',
    parentPhone: '13800138004',
    contactAddress: '河北省石家庄市桥西区XXX街道',
    householdType: '农村',
    studyMode: '全日制',
    currentAddress: '河北省石家庄市桥西区XXX村',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、网络工程',
    hasRegistered: '否',
    registeredSchool: '',
    remarks: '家庭经济困难',
    refundTime: '2024-07-20',
    refundAmount: 12000,
  },

  // 永恒殿
  {
    key: '3',
    serialNumber: 1,
    campus: '冀美',
    name: '王强',
    gender: '男',
    idCard: '130202200605****',
    enrollmentDate: '2024-03-20',
    enrollmentAge: '18',
    education: '高中',
    graduationDate: '2024-05-30',
    graduationAge: '18',
    highestCertificate: '高中毕业证',
    campusSource: '永恒殿',
    consultant: '张咨询师',
    reportedMajor: '云计算',
    educationSystem: '三年制',
    receivableTuition: 25800,
    headTeacherName: '王芳',
    studentStatus: '退学',
    previousMajor: '无',
    graduationSchool: '保定市第一中学',
    contactPhone: '13800138005',
    parentPhone: '13800138006',
    contactAddress: '河北省保定市XXX区',
    householdType: '城镇',
    studyMode: '全日制',
    currentAddress: '河北省保定市XXX小区',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、云计算',
    hasRegistered: '否',
    registeredSchool: '',
    remarks: '身体健康原因',
    refundTime: '2024-05-30',
    refundAmount: 18000,
  },
  {
    key: '4',
    serialNumber: 2,
    campus: '冀美',
    name: '赵敏',
    gender: '女',
    idCard: '130203200706****',
    enrollmentDate: '2024-04-05',
    enrollmentAge: '17',
    education: '初中',
    graduationDate: '2024-08-10',
    graduationAge: '17',
    highestCertificate: '初中毕业证',
    campusSource: '永恒殿',
    consultant: '赵咨询师',
    reportedMajor: '软件技术',
    educationSystem: '三年制',
    receivableTuition: 25800,
    headTeacherName: '王芳',
    studentStatus: '转学',
    previousMajor: '无',
    graduationSchool: '保定市第二中学',
    contactPhone: '13800138007',
    parentPhone: '13800138008',
    contactAddress: '河北省保定市XXX区',
    householdType: '农村',
    studyMode: '全日制',
    currentAddress: '河北省保定市XXX镇',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、软件技术',
    hasRegistered: '否',
    registeredSchool: '',
    remarks: '转学',
    refundTime: '2024-08-10',
    refundAmount: 14000,
  },

  // 慈悲殿
  {
    key: '5',
    serialNumber: 1,
    campus: '石美',
    name: '孙华',
    gender: '男',
    idCard: '130302200505****',
    enrollmentDate: '2024-03-25',
    enrollmentAge: '19',
    education: '高中',
    graduationDate: '2024-06-25',
    graduationAge: '19',
    highestCertificate: '高中毕业证',
    campusSource: '慈悲殿',
    consultant: '孙咨询师',
    reportedMajor: '网络云运维',
    educationSystem: '三年制',
    receivableTuition: 25800,
    headTeacherName: '刘强',
    studentStatus: '退学',
    previousMajor: '无',
    graduationSchool: '邢台市第一中学',
    contactPhone: '13800138009',
    parentPhone: '13800138010',
    contactAddress: '河北省邢台市XXX区',
    householdType: '城镇',
    studyMode: '全日制',
    currentAddress: '河北省邢台市XXX小区',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、网络云运维',
    hasRegistered: '是',
    registeredSchool: '河北省职业技术学校',
    remarks: '个人原因',
    refundTime: '2024-06-25',
    refundAmount: 22000,
  },

  // 李大殿
  {
    key: '6',
    serialNumber: 1,
    campus: '晋美',
    name: '周杰',
    gender: '男',
    idCard: '140102200605****',
    enrollmentDate: '2024-04-01',
    enrollmentAge: '18',
    education: '高中',
    graduationDate: '2024-07-15',
    graduationAge: '18',
    highestCertificate: '高中毕业证',
    campusSource: '李大殿',
    consultant: '周咨询师',
    reportedMajor: '计算机应用',
    educationSystem: '三年制',
    receivableTuition: 25800,
    headTeacherName: '赵丽',
    studentStatus: '退学',
    previousMajor: '无',
    graduationSchool: '太原市第一中学',
    contactPhone: '13800138011',
    parentPhone: '13800138012',
    contactAddress: '山西省太原市XXX区',
    householdType: '城镇',
    studyMode: '全日制',
    currentAddress: '山西省太原市XXX小区',
    hasRegistrationCommitment: '是',
    registrationCommitmentDetails: '中专、国家承认、计算机应用',
    hasRegistered: '否',
    registeredSchool: '',
    remarks: '家庭搬迁',
    refundTime: '2024-07-15',
    refundAmount: 18000,
  },
]

const CampusRefundDetailTable: React.FC = () => {
  const { message, modal } = App.useApp()
  const [searchText, setSearchText] = useState('')
  const [selectedCampus, setSelectedCampus] = useState<string>('全部')
  const [filteredData, setFilteredData] = useState<RefundDetailRecord[]>(mockData)
  const [dataSource, setDataSource] = useState<RefundDetailRecord[]>(mockData)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<RefundDetailRecord | null>(null)
  const [form] = Form.useForm()

  // 处理搜索和筛选
  useEffect(() => {
    let result = dataSource

    // 按神殿筛选
    if (selectedCampus !== '全部') {
      result = result.filter((item) => item.campus === selectedCampus)
    }

    // 按关键字搜索
    if (searchText) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(searchText.toLowerCase()) ||
          item.idCard.toLowerCase().includes(searchText.toLowerCase()) ||
          item.contactPhone.toLowerCase().includes(searchText.toLowerCase()) ||
          item.headTeacherName.toLowerCase().includes(searchText.toLowerCase()),
      )
    }

    setFilteredData(result)
  }, [searchText, selectedCampus, dataSource])

  // 计算统计数据
  const totalRecords = filteredData.length
  const totalReceivable = filteredData.reduce((sum, item) => sum + item.receivableTuition, 0)
  const totalRefundAmount = filteredData.reduce((sum, item) => sum + item.refundAmount, 0)
  const avgRefundAmount = totalRecords > 0 ? Math.round(totalRefundAmount / totalRecords) : 0

  // 添加记录
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 编辑记录
  const handleEdit = (record: RefundDetailRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      enrollmentDate: record.enrollmentDate ? dayjs(record.enrollmentDate) : undefined,
      graduationDate: record.graduationDate ? dayjs(record.graduationDate) : undefined,
      refundTime: record.refundTime ? dayjs(record.refundTime) : undefined,
    })
    setModalVisible(true)
  }

  // 删除记录
  const handleDelete = (record: RefundDetailRecord) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除学生"${record.name}"的退费记录吗？此操作不可恢复。`,
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
      if (values.graduationDate) {
        values.graduationDate = values.graduationDate.format('YYYY-MM-DD')
      }
      if (values.refundTime) {
        values.refundTime = values.refundTime.format('YYYY-MM-DD')
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
          .filter((item) => item.campus === values.campus)
          .reduce((max, item) => Math.max(max, item.serialNumber), 0)

        const newRecord: RefundDetailRecord = {
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

  // 表格列定义
  const columns: ColumnsType<RefundDetailRecord> = [
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
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 60,
      align: 'center',
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
      title: '学历',
      dataIndex: 'education',
      key: 'education',
      width: 80,
      align: 'center',
    },
    {
      title: '毕业时间',
      dataIndex: 'graduationDate',
      key: 'graduationDate',
      width: 110,
      align: 'center',
    },
    {
      title: '毕业年龄',
      dataIndex: 'graduationAge',
      key: 'graduationAge',
      width: 90,
      align: 'center',
    },
    {
      title: '毕业所获最高学历证书及性质',
      dataIndex: 'highestCertificate',
      key: 'highestCertificate',
      width: 200,
      align: 'center',
    },
    {
      title: '神殿来源',
      dataIndex: 'campusSource',
      key: 'campusSource',
      width: 120,
      align: 'center',
    },
    {
      title: '咨询师',
      dataIndex: 'consultant',
      key: 'consultant',
      width: 100,
      align: 'center',
    },
    {
      title: '所报专业',
      dataIndex: 'reportedMajor',
      key: 'reportedMajor',
      width: 120,
      align: 'center',
    },
    {
      title: '学制',
      dataIndex: 'educationSystem',
      key: 'educationSystem',
      width: 100,
      align: 'center',
    },
    {
      title: '应收学费金额',
      dataIndex: 'receivableTuition',
      key: 'receivableTuition',
      width: 120,
      align: 'right',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '班主任姓名',
      dataIndex: 'headTeacherName',
      key: 'headTeacherName',
      width: 120,
      align: 'center',
    },
    {
      title: '学员状态',
      dataIndex: 'studentStatus',
      key: 'studentStatus',
      width: 100,
      align: 'center',
      render: (value: string) => {
        const colorMap: { [key: string]: string } = {
          退学: 'red',
          转学: 'orange',
          休学: 'blue',
        }
        return <Tag color={colorMap[value] || 'default'}>{value}</Tag>
      },
    },
    {
      title: '过往专业',
      dataIndex: 'previousMajor',
      key: 'previousMajor',
      width: 120,
      align: 'center',
    },
    {
      title: '毕业学校',
      dataIndex: 'graduationSchool',
      key: 'graduationSchool',
      width: 180,
      align: 'center',
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 130,
      align: 'center',
    },
    {
      title: '家长电话',
      dataIndex: 'parentPhone',
      key: 'parentPhone',
      width: 130,
      align: 'center',
    },
    {
      title: '通信地址',
      dataIndex: 'contactAddress',
      key: 'contactAddress',
      width: 200,
      align: 'center',
    },
    {
      title: '户口性质',
      dataIndex: 'householdType',
      key: 'householdType',
      width: 100,
      align: 'center',
    },
    {
      title: '就读方式',
      dataIndex: 'studyMode',
      key: 'studyMode',
      width: 100,
      align: 'center',
    },
    {
      title: '现住址',
      dataIndex: 'currentAddress',
      key: 'currentAddress',
      width: 200,
      align: 'center',
    },
    {
      title: '是否承诺注册学历',
      dataIndex: 'hasRegistrationCommitment',
      key: 'hasRegistrationCommitment',
      width: 140,
      align: 'center',
      render: (value: string) => <Tag color={value === '是' ? 'green' : 'default'}>{value}</Tag>,
    },
    {
      title: '承诺注册学历性质、级别、名称',
      dataIndex: 'registrationCommitmentDetails',
      key: 'registrationCommitmentDetails',
      width: 220,
      align: 'center',
    },
    {
      title: '是否已注册中专/大专',
      dataIndex: 'hasRegistered',
      key: 'hasRegistered',
      width: 160,
      align: 'center',
      render: (value: string) => <Tag color={value === '是' ? 'green' : 'default'}>{value}</Tag>,
    },
    {
      title: '所注册学校',
      dataIndex: 'registeredSchool',
      key: 'registeredSchool',
      width: 180,
      align: 'center',
      render: (school: string) => school || '-',
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 150,
      align: 'center',
      render: (remarks: string) => remarks || '-',
    },
    {
      title: '退费时间',
      dataIndex: 'refundTime',
      key: 'refundTime',
      width: 110,
      align: 'center',
    },
    {
      title: '退费金额',
      dataIndex: 'refundAmount',
      key: 'refundAmount',
      width: 120,
      align: 'right',
      render: (value: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{value.toLocaleString()}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (_: any, record: RefundDetailRecord) => (
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
            <WarningOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} />
            <Title level={4} style={{ margin: 0 }}>
              神殿教化司退费明细
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
            <Input
              placeholder="搜索姓名、身份证号、电话"
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
          <Col span={6}>
            <Statistic
              title="退费人数"
              value={totalRecords}
              suffix="人"
              prefix={<TeamOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="应收总额"
              value={totalReceivable}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="退费总额"
              value={totalRefundAmount}
              prefix="¥"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均退费金额"
              value={avgRefundAmount}
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
          scroll={{ x: 4500, y: 600 }}
          pagination={{
            total: filteredData.length,
            defaultPageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          bordered
          size="middle"
        />
      </Card>

      {/* 新增/编辑 Modal */}
      <Modal
        title={editingRecord ? '编辑退费记录' : '新增退费记录'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={handleCancel}
        width={1200}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            gender: '男',
            education: '初中',
            householdType: '城镇',
            studyMode: '全日制',
            studentStatus: '退学',
            hasRegistrationCommitment: '是',
            hasRegistered: '否',
            receivableTuition: 0,
            refundAmount: 0,
          }}
        >
          {/* 第一行：神殿、姓名、性别、身份证号 */}
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="campus"
                label="所属神殿"
                rules={[{ required: true, message: '请选择所属神殿' }]}
              >
                <Select placeholder="请选择所属神殿">
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
            <Col span={6}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="gender" label="性别">
                <Select>
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="idCard"
                label="身份证号"
                rules={[
                  { required: true, message: '请输入身份证号' },
                  {
                    pattern:
                      /^\d{6}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/,
                    message: '请输入有效的身份证号',
                  },
                ]}
              >
                <Input placeholder="请输入身份证号" maxLength={18} />
              </Form.Item>
            </Col>
          </Row>

          {/* 第二行：入学时间、入学年龄、学历、毕业时间 */}
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="enrollmentDate"
                label="入学时间"
                rules={[{ required: true, message: '请选择入学时间' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择入学时间" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="enrollmentAge" label="入学年龄">
                <Input placeholder="如：17、18" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="education" label="学历">
                <Select placeholder="请选择学历">
                  <Option value="初中">初中</Option>
                  <Option value="高中">高中</Option>
                  <Option value="中专">中专</Option>
                  <Option value="大专">大专</Option>
                  <Option value="本科">本科</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="graduationDate" label="毕业时间">
                <DatePicker style={{ width: '100%' }} placeholder="请选择毕业时间" />
              </Form.Item>
            </Col>
          </Row>

          {/* 第三行：毕业年龄、最高学历证书、神殿来源、咨询师 */}
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="graduationAge" label="毕业年龄">
                <Input placeholder="如：18" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="highestCertificate" label="毕业所获最高学历证书及性质">
                <Input placeholder="如：初中毕业证" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="campusSource" label="神殿来源">
                <Input placeholder="请输入神殿来源" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="consultant" label="咨询师">
                <Input placeholder="请输入咨询师姓名" />
              </Form.Item>
            </Col>
          </Row>

          {/* 第四行：所报专业、学制、应收学费金额、班主任姓名 */}
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="reportedMajor" label="所报专业">
                <Input placeholder="请输入所报专业" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="educationSystem" label="学制">
                <Select placeholder="请选择学制">
                  <Option value="三年制">三年制</Option>
                  <Option value="五年制">五年制</Option>
                  <Option value="一年制">一年制</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="receivableTuition"
                label="应收学费金额"
                rules={[{ required: true, message: '请输入应收学费金额' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入应收学费金额"
                  min={0}
                  precision={0}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="headTeacherName" label="班主任姓名">
                <Input placeholder="请输入班主任姓名" />
              </Form.Item>
            </Col>
          </Row>

          {/* 第五行：学员状态、过往专业、毕业学校、联系电话 */}
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="studentStatus" label="学员状态">
                <Select>
                  <Option value="退学">退学</Option>
                  <Option value="转学">转学</Option>
                  <Option value="休学">休学</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="previousMajor" label="过往专业">
                <Input placeholder="请输入过往专业，无则填'无'" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="graduationSchool" label="毕业学校">
                <Input placeholder="请输入毕业学校" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="contactPhone"
                label="联系电话"
                rules={[
                  { required: true, message: '请输入联系电话' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
                ]}
              >
                <Input placeholder="请输入联系电话" maxLength={11} />
              </Form.Item>
            </Col>
          </Row>

          {/* 第六行：家长电话、户口性质、就读方式 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="parentPhone"
                label="家长电话"
                rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }]}
              >
                <Input placeholder="请输入家长电话" maxLength={11} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="householdType" label="户口性质">
                <Select>
                  <Option value="城镇">城镇</Option>
                  <Option value="农村">农村</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="studyMode" label="就读方式">
                <Select>
                  <Option value="全日制">全日制</Option>
                  <Option value="半日制">半日制</Option>
                  <Option value="业余">业余</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* 第七行：通信地址、现住址 */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contactAddress" label="通信地址">
                <Input placeholder="请输入通信地址" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="currentAddress" label="现住址">
                <Input placeholder="请输入现住址" />
              </Form.Item>
            </Col>
          </Row>

          {/* 第八行：是否承诺注册学历、承诺注册学历性质级别名称 */}
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="hasRegistrationCommitment" label="是否承诺注册学历">
                <Select>
                  <Option value="是">是</Option>
                  <Option value="否">否</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={18}>
              <Form.Item name="registrationCommitmentDetails" label="承诺注册学历性质、级别、名称">
                <Input placeholder="如：中专、国家承认、计算机应用" />
              </Form.Item>
            </Col>
          </Row>

          {/* 第九行：是否已注册中专/大专、所注册学校 */}
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="hasRegistered" label="是否已注册中专/大专">
                <Select>
                  <Option value="是">是</Option>
                  <Option value="否">否</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={18}>
              <Form.Item name="registeredSchool" label="所注册学校">
                <Input placeholder="请输入所注册学校，未注册可不填" />
              </Form.Item>
            </Col>
          </Row>

          {/* 第十行：退费时间、退费金额、备注 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="refundTime"
                label="退费时间"
                rules={[{ required: true, message: '请选择退费时间' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择退费时间" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="refundAmount"
                label="退费金额"
                rules={[{ required: true, message: '请输入退费金额' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入退费金额"
                  min={0}
                  precision={0}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="remarks" label="备注">
                <Input placeholder="请输入备注" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default CampusRefundDetailTable
