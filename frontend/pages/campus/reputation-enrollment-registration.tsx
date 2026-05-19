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
  PhoneOutlined,
  UserOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Title } = Typography
const { Option } = Select

// 口碑报名登记明细数据接口
interface ReputationEnrollmentRecord {
  key: string
  month: string // 月份
  headTeacherName: string // 班主任姓名
  referrerName: string // 口碑量姓名
  referrerPhone: string // 口碑量电话
  isHomeVisit: string // 是否上门
  isEnrolled: string // 是否报名
  enrollmentTime: string // 报名时间
  enrollmentMajor: string // 报名专业
  enrollmentSystem: string // 报名学制
  tuitionReceivable: number // 应收学费
  tuitionPaid: number // 实交学费
  isClassPassed: string // 是否过课时
  isStable: string // 是否稳定
  isRefund: string // 是否退费
  consultant: string // 咨询师
  introducerName: string // 介绍人姓名
  introducerRelation: string // 口碑介绍关系
  reputationSource: string // 口碑来源
  campus: string // 神殿（用于筛选，不显示在表格中）
}

// 模拟数据
const mockData: ReputationEnrollmentRecord[] = [
  // 主神殿
  {
    key: '1',
    campus: '盛邦',
    month: '1月',
    headTeacherName: '张老师',
    referrerName: '王丽',
    referrerPhone: '13800138001',
    isHomeVisit: '是',
    isEnrolled: '是',
    enrollmentTime: '2024-01-15',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 8000,
    tuitionPaid: 8000,
    isClassPassed: '是',
    isStable: '是',
    isRefund: '否',
    consultant: '李咨询师',
    introducerName: '李华',
    introducerRelation: '同学',
    reputationSource: '学员推荐',
  },
  {
    key: '2',
    campus: '盛邦',
    month: '1月',
    headTeacherName: '李老师',
    referrerName: '刘强',
    referrerPhone: '13800138002',
    isHomeVisit: '否',
    isEnrolled: '是',
    enrollmentTime: '2024-01-20',
    enrollmentMajor: '网络工程',
    enrollmentSystem: '三年制',
    tuitionReceivable: 8500,
    tuitionPaid: 8500,
    isClassPassed: '是',
    isStable: '是',
    isRefund: '否',
    consultant: '王咨询师',
    introducerName: '王强',
    introducerRelation: '朋友',
    reputationSource: '家长推荐',
  },
  {
    key: '3',
    campus: '盛邦',
    month: '2月',
    headTeacherName: '张老师',
    referrerName: '陈梅',
    referrerPhone: '13800138003',
    isHomeVisit: '是',
    isEnrolled: '是',
    enrollmentTime: '2024-02-10',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 8000,
    tuitionPaid: 7500,
    isClassPassed: '是',
    isStable: '是',
    isRefund: '否',
    consultant: '李咨询师',
    introducerName: '张伟',
    introducerRelation: '亲戚',
    reputationSource: '亲友介绍',
  },
  {
    key: '4',
    campus: '盛邦',
    month: '2月',
    headTeacherName: '王老师',
    referrerName: '赵芳',
    referrerPhone: '13800138004',
    isHomeVisit: '是',
    isEnrolled: '否',
    enrollmentTime: '',
    enrollmentMajor: '',
    enrollmentSystem: '',
    tuitionReceivable: 0,
    tuitionPaid: 0,
    isClassPassed: '否',
    isStable: '否',
    isRefund: '否',
    consultant: '赵咨询师',
    introducerName: '刘敏',
    introducerRelation: '同事',
    reputationSource: '同事推荐',
  },
  {
    key: '5',
    campus: '盛邦',
    month: '3月',
    headTeacherName: '李老师',
    referrerName: '孙丽',
    referrerPhone: '13800138005',
    isHomeVisit: '否',
    isEnrolled: '是',
    enrollmentTime: '2024-03-05',
    enrollmentMajor: '网络工程',
    enrollmentSystem: '三年制',
    tuitionReceivable: 8500,
    tuitionPaid: 8500,
    isClassPassed: '是',
    isStable: '是',
    isRefund: '否',
    consultant: '王咨询师',
    introducerName: '陈强',
    introducerRelation: '朋友',
    reputationSource: '朋友推荐',
  },

  // 永恒殿
  {
    key: '6',
    campus: '冀美',
    month: '1月',
    headTeacherName: '赵老师',
    referrerName: '周伟',
    referrerPhone: '13900139001',
    isHomeVisit: '是',
    isEnrolled: '是',
    enrollmentTime: '2024-01-18',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 7800,
    tuitionPaid: 7800,
    isClassPassed: '是',
    isStable: '是',
    isRefund: '否',
    consultant: '张咨询师',
    introducerName: '吴敏',
    introducerRelation: '同学',
    reputationSource: '学员推荐',
  },
  {
    key: '7',
    campus: '冀美',
    month: '2月',
    headTeacherName: '吴老师',
    referrerName: '郑娟',
    referrerPhone: '13900139002',
    isHomeVisit: '否',
    isEnrolled: '是',
    enrollmentTime: '2024-02-12',
    enrollmentMajor: '网络工程',
    enrollmentSystem: '三年制',
    tuitionReceivable: 8200,
    tuitionPaid: 8200,
    isClassPassed: '是',
    isStable: '是',
    isRefund: '否',
    consultant: '刘咨询师',
    introducerName: '郑强',
    introducerRelation: '朋友',
    reputationSource: '朋友推荐',
  },
  {
    key: '8',
    campus: '冀美',
    month: '3月',
    headTeacherName: '赵老师',
    referrerName: '钱涛',
    referrerPhone: '13900139003',
    isHomeVisit: '是',
    isEnrolled: '否',
    enrollmentTime: '',
    enrollmentMajor: '',
    enrollmentSystem: '',
    tuitionReceivable: 0,
    tuitionPaid: 0,
    isClassPassed: '否',
    isStable: '否',
    isRefund: '否',
    consultant: '张咨询师',
    introducerName: '孙华',
    introducerRelation: '亲戚',
    reputationSource: '亲友介绍',
  },

  // 慈悲殿
  {
    key: '9',
    campus: '石美',
    month: '1月',
    headTeacherName: '孙老师',
    referrerName: '李明',
    referrerPhone: '13700137001',
    isHomeVisit: '是',
    isEnrolled: '是',
    enrollmentTime: '2024-01-22',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 8000,
    tuitionPaid: 8000,
    isClassPassed: '是',
    isStable: '是',
    isRefund: '否',
    consultant: '陈咨询师',
    introducerName: '周敏',
    introducerRelation: '同学',
    reputationSource: '学员推荐',
  },
  {
    key: '10',
    campus: '石美',
    month: '2月',
    headTeacherName: '周老师',
    referrerName: '张强',
    referrerPhone: '13700137002',
    isHomeVisit: '否',
    isEnrolled: '是',
    enrollmentTime: '2024-02-15',
    enrollmentMajor: '网络工程',
    enrollmentSystem: '三年制',
    tuitionReceivable: 8300,
    tuitionPaid: 8000,
    isClassPassed: '是',
    isStable: '是',
    isRefund: '否',
    consultant: '孙咨询师',
    introducerName: '钱伟',
    introducerRelation: '朋友',
    reputationSource: '家长推荐',
  },
  {
    key: '11',
    campus: '石美',
    month: '3月',
    headTeacherName: '孙老师',
    referrerName: '王芳',
    referrerPhone: '13700137003',
    isHomeVisit: '是',
    isEnrolled: '是',
    enrollmentTime: '2024-03-08',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 8000,
    tuitionPaid: 7500,
    isClassPassed: '是',
    isStable: '否',
    isRefund: '是',
    consultant: '陈咨询师',
    introducerName: '赵丽',
    introducerRelation: '亲戚',
    reputationSource: '亲友介绍',
  },

  // 李大殿
  {
    key: '12',
    campus: '晋美',
    month: '1月',
    headTeacherName: '郑老师',
    referrerName: '刘涛',
    referrerPhone: '13600136001',
    isHomeVisit: '是',
    isEnrolled: '是',
    enrollmentTime: '2024-01-25',
    enrollmentMajor: '网络工程',
    enrollmentSystem: '三年制',
    tuitionReceivable: 7900,
    tuitionPaid: 7900,
    isClassPassed: '是',
    isStable: '是',
    isRefund: '否',
    consultant: '周咨询师',
    introducerName: '孙强',
    introducerRelation: '同学',
    reputationSource: '学员推荐',
  },
  {
    key: '13',
    campus: '晋美',
    month: '2月',
    headTeacherName: '钱老师',
    referrerName: '陈华',
    referrerPhone: '13600136002',
    isHomeVisit: '否',
    isEnrolled: '是',
    enrollmentTime: '2024-02-18',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 8100,
    tuitionPaid: 8100,
    isClassPassed: '是',
    isStable: '是',
    isRefund: '否',
    consultant: '吴咨询师',
    introducerName: '周伟',
    introducerRelation: '朋友',
    reputationSource: '朋友推荐',
  },
  {
    key: '14',
    campus: '晋美',
    month: '3月',
    headTeacherName: '郑老师',
    referrerName: '赵敏',
    referrerPhone: '13600136003',
    isHomeVisit: '是',
    isEnrolled: '否',
    enrollmentTime: '',
    enrollmentMajor: '',
    enrollmentSystem: '',
    tuitionReceivable: 0,
    tuitionPaid: 0,
    isClassPassed: '否',
    isStable: '否',
    isRefund: '否',
    consultant: '周咨询师',
    introducerName: '郑芳',
    introducerRelation: '同事',
    reputationSource: '同事推荐',
  },

  // 智慧阁
  {
    key: '15',
    campus: '原美',
    month: '1月',
    headTeacherName: '孙老师',
    referrerName: '吴强',
    referrerPhone: '13500135001',
    isHomeVisit: '是',
    isEnrolled: '是',
    enrollmentTime: '2024-01-28',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 8000,
    tuitionPaid: 8000,
    isClassPassed: '是',
    isStable: '是',
    isRefund: '否',
    consultant: '郑咨询师',
    introducerName: '钱敏',
    introducerRelation: '同学',
    reputationSource: '学员推荐',
  },
  {
    key: '16',
    campus: '原美',
    month: '2月',
    headTeacherName: '李老师',
    referrerName: '郑丽',
    referrerPhone: '13500135002',
    isHomeVisit: '否',
    isEnrolled: '是',
    enrollmentTime: '2024-02-20',
    enrollmentMajor: '网络工程',
    enrollmentSystem: '三年制',
    tuitionReceivable: 8400,
    tuitionPaid: 8400,
    isClassPassed: '是',
    isStable: '是',
    isRefund: '否',
    consultant: '钱咨询师',
    introducerName: '孙华',
    introducerRelation: '朋友',
    reputationSource: '家长推荐',
  },

  // 光明殿
  {
    key: '17',
    campus: '太美',
    month: '1月',
    headTeacherName: '王老师',
    referrerName: '赵伟',
    referrerPhone: '13400134001',
    isHomeVisit: '是',
    isEnrolled: '是',
    enrollmentTime: '2024-01-30',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 7800,
    tuitionPaid: 7800,
    isClassPassed: '是',
    isStable: '是',
    isRefund: '否',
    consultant: '孙咨询师',
    introducerName: '周强',
    introducerRelation: '同学',
    reputationSource: '学员推荐',
  },
  {
    key: '18',
    campus: '太美',
    month: '2月',
    headTeacherName: '钱老师',
    referrerName: '孙芳',
    referrerPhone: '13400134002',
    isHomeVisit: '否',
    isEnrolled: '是',
    enrollmentTime: '2024-02-22',
    enrollmentMajor: '网络工程',
    enrollmentSystem: '三年制',
    tuitionReceivable: 8200,
    tuitionPaid: 8200,
    isClassPassed: '是',
    isStable: '是',
    isRefund: '否',
    consultant: '周咨询师',
    introducerName: '郑敏',
    introducerRelation: '朋友',
    reputationSource: '朋友推荐',
  },
  {
    key: '19',
    campus: '太美',
    month: '3月',
    headTeacherName: '王老师',
    referrerName: '李娟',
    referrerPhone: '13400134003',
    isHomeVisit: '是',
    isEnrolled: '否',
    enrollmentTime: '',
    enrollmentMajor: '',
    enrollmentSystem: '',
    tuitionReceivable: 0,
    tuitionPaid: 0,
    isClassPassed: '否',
    isStable: '否',
    isRefund: '否',
    consultant: '孙咨询师',
    introducerName: '钱华',
    introducerRelation: '亲戚',
    reputationSource: '亲友介绍',
  },

  // 神恩殿
  {
    key: '20',
    campus: '桂美',
    month: '1月',
    headTeacherName: '周老师',
    referrerName: '陈伟',
    referrerPhone: '13300133001',
    isHomeVisit: '是',
    isEnrolled: '是',
    enrollmentTime: '2024-01-26',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 8000,
    tuitionPaid: 8000,
    isClassPassed: '是',
    isStable: '是',
    isRefund: '否',
    consultant: '吴咨询师',
    introducerName: '吴强',
    introducerRelation: '同学',
    reputationSource: '学员推荐',
  },
  {
    key: '21',
    campus: '桂美',
    month: '2月',
    headTeacherName: '郑老师',
    referrerName: '王敏',
    referrerPhone: '13300133002',
    isHomeVisit: '否',
    isEnrolled: '是',
    enrollmentTime: '2024-02-25',
    enrollmentMajor: '网络工程',
    enrollmentSystem: '三年制',
    tuitionReceivable: 8500,
    tuitionPaid: 8500,
    isClassPassed: '是',
    isStable: '是',
    isRefund: '否',
    consultant: '郑咨询师',
    introducerName: '赵伟',
    introducerRelation: '朋友',
    reputationSource: '家长推荐',
  },
  {
    key: '22',
    campus: '桂美',
    month: '3月',
    headTeacherName: '周老师',
    referrerName: '李强',
    referrerPhone: '13300133003',
    isHomeVisit: '是',
    isEnrolled: '是',
    enrollmentTime: '2024-03-10',
    enrollmentMajor: '云计算',
    enrollmentSystem: '三年制',
    tuitionReceivable: 8000,
    tuitionPaid: 7800,
    isClassPassed: '是',
    isStable: '是',
    isRefund: '否',
    consultant: '吴咨询师',
    introducerName: '孙丽',
    introducerRelation: '亲戚',
    reputationSource: '亲友介绍',
  },
]

const CampusReputationEnrollmentRegistrationTable: React.FC = () => {
  const { message, modal } = App.useApp()
  const [searchText, setSearchText] = useState('')
  const [selectedCampus, setSelectedCampus] = useState<string>('全部')
  const [filteredData, setFilteredData] = useState<ReputationEnrollmentRecord[]>(mockData)
  const [dataSource, setDataSource] = useState<ReputationEnrollmentRecord[]>(mockData)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ReputationEnrollmentRecord | null>(null)
  const [form] = Form.useForm()

  // 处理搜索
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
          item.headTeacherName.toLowerCase().includes(searchText.toLowerCase()) ||
          item.referrerName.toLowerCase().includes(searchText.toLowerCase()) ||
          item.referrerPhone.includes(searchText) ||
          item.introducerName.toLowerCase().includes(searchText.toLowerCase()) ||
          item.consultant.toLowerCase().includes(searchText.toLowerCase()) ||
          item.reputationSource.toLowerCase().includes(searchText.toLowerCase()),
      )
    }

    setFilteredData(result)
  }, [searchText, selectedCampus, dataSource])

  // 计算统计数据
  const totalRecords = filteredData.length
  const enrolledCount = filteredData.filter((item) => item.isEnrolled === '是').length
  const consultingCount = filteredData.filter((item) => item.isEnrolled === '否').length
  const totalTuition = filteredData.reduce((sum, item) => sum + item.tuitionPaid, 0)
  const totalReceivable = filteredData.reduce((sum, item) => sum + item.tuitionReceivable, 0)

  // 添加记录
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 编辑记录
  const handleEdit = (record: ReputationEnrollmentRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      enrollmentTime: record.enrollmentTime ? dayjs(record.enrollmentTime) : undefined,
    })
    setModalVisible(true)
  }

  // 删除记录
  const handleDelete = (record: ReputationEnrollmentRecord) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除口碑量"${record.referrerName}"的报名记录吗？此操作不可恢复。`,
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
      if (values.enrollmentTime) {
        values.enrollmentTime = values.enrollmentTime.format('YYYY-MM-DD')
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
        const newRecord: ReputationEnrollmentRecord = {
          key: `${Date.now()}`,
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
  const columns: ColumnsType<ReputationEnrollmentRecord> = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_: any, __: any, index: number) => index + 1,
      fixed: 'left',
    },
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
    },
    {
      title: '班主任姓名',
      dataIndex: 'headTeacherName',
      key: 'headTeacherName',
      width: 110,
      align: 'center',
    },
    {
      title: '口碑量姓名',
      dataIndex: 'referrerName',
      key: 'referrerName',
      width: 110,
      align: 'center',
    },
    {
      title: '口碑量电话',
      dataIndex: 'referrerPhone',
      key: 'referrerPhone',
      width: 130,
      align: 'center',
      render: (phone: string) => (
        <Space>
          <PhoneOutlined style={{ color: '#1890ff' }} />
          {phone}
        </Space>
      ),
    },
    {
      title: '是否上门',
      dataIndex: 'isHomeVisit',
      key: 'isHomeVisit',
      width: 90,
      align: 'center',
      render: (value: string) => <Tag color={value === '是' ? 'green' : 'default'}>{value}</Tag>,
    },
    {
      title: '是否报名',
      dataIndex: 'isEnrolled',
      key: 'isEnrolled',
      width: 90,
      align: 'center',
      render: (value: string) => <Tag color={value === '是' ? 'success' : 'warning'}>{value}</Tag>,
    },
    {
      title: '报名时间',
      dataIndex: 'enrollmentTime',
      key: 'enrollmentTime',
      width: 110,
      align: 'center',
      render: (time: string) => time || '-',
    },
    {
      title: '报名专业',
      dataIndex: 'enrollmentMajor',
      key: 'enrollmentMajor',
      width: 100,
      align: 'center',
      render: (major: string) => major || '-',
    },
    {
      title: '报名学制',
      dataIndex: 'enrollmentSystem',
      key: 'enrollmentSystem',
      width: 100,
      align: 'center',
      render: (system: string) => system || '-',
    },
    {
      title: '应收学费',
      dataIndex: 'tuitionReceivable',
      key: 'tuitionReceivable',
      width: 100,
      align: 'right',
      render: (value: number) => (value > 0 ? `¥${value.toLocaleString()}` : '-'),
    },
    {
      title: '实交学费',
      dataIndex: 'tuitionPaid',
      key: 'tuitionPaid',
      width: 100,
      align: 'right',
      render: (value: number) => (value > 0 ? `¥${value.toLocaleString()}` : '-'),
    },
    {
      title: '是否过课时',
      dataIndex: 'isClassPassed',
      key: 'isClassPassed',
      width: 100,
      align: 'center',
      render: (value: string) => <Tag color={value === '是' ? 'green' : 'default'}>{value}</Tag>,
    },
    {
      title: '是否稳定',
      dataIndex: 'isStable',
      key: 'isStable',
      width: 90,
      align: 'center',
      render: (value: string) => <Tag color={value === '是' ? 'green' : 'default'}>{value}</Tag>,
    },
    {
      title: '是否退费',
      dataIndex: 'isRefund',
      key: 'isRefund',
      width: 90,
      align: 'center',
      render: (value: string) => <Tag color={value === '是' ? 'red' : 'green'}>{value}</Tag>,
    },
    {
      title: '咨询师',
      dataIndex: 'consultant',
      key: 'consultant',
      width: 110,
      align: 'center',
    },
    {
      title: '介绍人姓名',
      dataIndex: 'introducerName',
      key: 'introducerName',
      width: 110,
      align: 'center',
    },
    {
      title: '口碑介绍关系',
      dataIndex: 'introducerRelation',
      key: 'introducerRelation',
      width: 120,
      align: 'center',
    },
    {
      title: '口碑来源',
      dataIndex: 'reputationSource',
      key: 'reputationSource',
      width: 110,
      align: 'center',
      render: (source: string) => <Tag color="blue">{source}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (_: any, record: ReputationEnrollmentRecord) => (
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
            <TrophyOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>
              神殿教化司口碑报名登记明细表
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
              placeholder="搜索姓名、电话、咨询师、来源"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
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
              title="总记录数"
              value={totalRecords}
              suffix="条"
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="已报名人数"
              value={enrolledCount}
              suffix="人"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="咨询中人数"
              value={consultingCount}
              suffix="人"
              prefix={<PhoneOutlined style={{ color: '#faad14' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="应收学费总额"
              value={totalReceivable}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: '16px' }}>
          <Col span={6}>
            <Statistic
              title="实交学费总额"
              value={totalTuition}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: 2100, y: 600 }}
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
        title={editingRecord ? '编辑口碑报名登记' : '新增口碑报名登记'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={handleCancel}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            isHomeVisit: '否',
            isEnrolled: '否',
            isClassPassed: '否',
            isStable: '否',
            isRefund: '否',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
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
            <Col span={12}>
              <Form.Item
                name="month"
                label="月份"
                rules={[{ required: true, message: '请输入月份' }]}
              >
                <Input placeholder="如：1月" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="headTeacherName"
                label="班主任姓名"
                rules={[{ required: true, message: '请输入班主任姓名' }]}
              >
                <Input placeholder="请输入班主任姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="referrerName"
                label="口碑量姓名"
                rules={[{ required: true, message: '请输入口碑量姓名' }]}
              >
                <Input placeholder="请输入口碑量姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="referrerPhone"
                label="口碑量电话"
                rules={[
                  { required: true, message: '请输入口碑量电话' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' },
                ]}
              >
                <Input placeholder="请输入口碑量电话" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isHomeVisit" label="是否上门">
                <Select>
                  <Option value="是">是</Option>
                  <Option value="否">否</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="isEnrolled" label="是否报名">
                <Select>
                  <Option value="是">是</Option>
                  <Option value="否">否</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="enrollmentTime" label="报名时间">
                <DatePicker style={{ width: '100%' }} placeholder="请选择报名时间" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="enrollmentMajor" label="报名专业">
                <Input placeholder="请输入报名专业" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="enrollmentSystem" label="报名学制">
                <Input placeholder="如：三年制" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tuitionReceivable" label="应收学费">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入应收学费"
                  min={0}
                  precision={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tuitionPaid" label="实交学费">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入实交学费"
                  min={0}
                  precision={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="isClassPassed" label="是否过课时">
                <Select>
                  <Option value="是">是</Option>
                  <Option value="否">否</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isStable" label="是否稳定">
                <Select>
                  <Option value="是">是</Option>
                  <Option value="否">否</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isRefund" label="是否退费">
                <Select>
                  <Option value="是">是</Option>
                  <Option value="否">否</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="consultant" label="咨询师">
                <Input placeholder="请输入咨询师姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="introducerName" label="介绍人姓名">
                <Input placeholder="请输入介绍人姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="introducerRelation" label="口碑介绍关系">
                <Input placeholder="如：同学、朋友、亲戚" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reputationSource" label="口碑来源">
                <Select placeholder="请选择口碑来源">
                  <Option value="学员推荐">学员推荐</Option>
                  <Option value="家长推荐">家长推荐</Option>
                  <Option value="朋友推荐">朋友推荐</Option>
                  <Option value="亲友介绍">亲友介绍</Option>
                  <Option value="同事推荐">同事推荐</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default CampusReputationEnrollmentRegistrationTable
