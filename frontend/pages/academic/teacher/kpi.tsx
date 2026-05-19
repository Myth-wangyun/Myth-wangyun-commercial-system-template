// 教员KPI管理页面 (024-027)
import React, { useState, useEffect } from 'react'
import {
  App,
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
  Tabs,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
} from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  TrophyOutlined,
  UserOutlined,
  DollarOutlined,
  TeamOutlined,
  StarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

// 教员考试合格率数据接口
interface TeacherExamPassRate {
  id: string
  name: string
  employmentRate: number
  employmentSalary: number
  reputationCount: number
  reputationIncome: number
  newStudentCount: number
  newStudentLoss: number
  homeworkSubmitRate: number
  homeworkPassRate: number
  examPassRate: number
  projectSubmitRate: number
  projectPassRate: number
  studentSatisfaction: number
  studentViolations: number
  supervisorObservation: number
  teacherAverage: number
}

// 就业奖惩数据接口
interface EmploymentRewardPenalty {
  id: string
  employmentClass: string
  avgSalary: number
  baseAmount: number
  classSize: number
  classRatio: number
  totalAmount: number
  firstTwoThirds: number
  remainingOneThird: number
}

// 学术老师奖惩分配接口
interface TeacherRewardPenalty {
  id: string
  employmentClass: string
  firstTwoThirds: number
  teacherName: string
  employmentDirection: string
  employmentCount: number
  classSize: number
  distributionRatio: number
  distributionAmount: number
}

// 就业明星奖励接口
interface EmploymentStarAward {
  id: string
  employmentClass: string
  teacherName: string
  starName: string
  employmentSalary: number
  verifiedByHeadquarters: boolean
  awardAmount: number
}

// 课时统计接口
interface ClassHourStatistics {
  id: string
  name: string
  regularClass: number
  newStudentRemedial: number
  intensiveClass: number
  tutoringClass: number
  totalFee: number
}

const TeacherKPI: React.FC = () => {
  const { message, modal } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('exam-pass-rate')
  const [formVisible, setFormVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [form] = Form.useForm()

  // 教员考试合格率数据
  const [examPassData, setExamPassData] = useState<TeacherExamPassRate[]>([])
  // 就业奖惩数据
  const [rewardPenaltyData, setRewardPenaltyData] = useState<EmploymentRewardPenalty[]>([])
  // 学术老师奖惩分配数据
  const [teacherRewardData, setTeacherRewardData] = useState<TeacherRewardPenalty[]>([])
  // 就业明星奖励数据
  const [starAwardData, setStarAwardData] = useState<EmploymentStarAward[]>([])
  // 课时统计数据
  const [classHourData, setClassHourData] = useState<ClassHourStatistics[]>([])

  // 模拟教员考试合格率数据
  const mockExamPassData: TeacherExamPassRate[] = [
    {
      id: '1',
      name: '张三',
      employmentRate: 95.5,
      employmentSalary: 7000,
      reputationCount: 8,
      reputationIncome: 24000,
      newStudentCount: 12,
      newStudentLoss: 1,
      homeworkSubmitRate: 98.6,
      homeworkPassRate: 97.3,
      examPassRate: 92.5,
      projectSubmitRate: 96.8,
      projectPassRate: 94.2,
      studentSatisfaction: 96.8,
      studentViolations: 0,
      supervisorObservation: 8.5,
      teacherAverage: 94.2,
    },
    {
      id: '2',
      name: '李四',
      employmentRate: 88.2,
      employmentSalary: 6500,
      reputationCount: 6,
      reputationIncome: 18000,
      newStudentCount: 10,
      newStudentLoss: 2,
      homeworkSubmitRate: 95.2,
      homeworkPassRate: 93.8,
      examPassRate: 89.1,
      projectSubmitRate: 94.5,
      projectPassRate: 91.7,
      studentSatisfaction: 93.5,
      studentViolations: 1,
      supervisorObservation: 7.8,
      teacherAverage: 91.2,
    },
    {
      id: '3',
      name: '王五',
      employmentRate: 92.1,
      employmentSalary: 6800,
      reputationCount: 7,
      reputationIncome: 21000,
      newStudentCount: 11,
      newStudentLoss: 1,
      homeworkSubmitRate: 97.1,
      homeworkPassRate: 95.6,
      examPassRate: 90.8,
      projectSubmitRate: 95.9,
      projectPassRate: 93.4,
      studentSatisfaction: 95.2,
      studentViolations: 0,
      supervisorObservation: 8.2,
      teacherAverage: 93.1,
    },
  ]

  // 模拟就业奖惩数据
  const mockRewardPenaltyData: EmploymentRewardPenalty[] = [
    {
      id: '1',
      employmentClass: 'T001',
      avgSalary: 7000,
      baseAmount: 3500,
      classSize: 8,
      classRatio: 0.7,
      totalAmount: 2450,
      firstTwoThirds: 1633,
      remainingOneThird: 817,
    },
    {
      id: '2',
      employmentClass: 'T002',
      avgSalary: 5000,
      baseAmount: -500,
      classSize: 9,
      classRatio: 0.9,
      totalAmount: -450,
      firstTwoThirds: -300,
      remainingOneThird: -150,
    },
  ]

  // 模拟学术老师奖惩分配数据
  const mockTeacherRewardData: TeacherRewardPenalty[] = [
    {
      id: '1',
      employmentClass: 'T001',
      firstTwoThirds: 1633,
      teacherName: '李世峰',
      employmentDirection: '包装',
      employmentCount: 5,
      classSize: 8,
      distributionRatio: 5 / 8,
      distributionAmount: 1021,
    },
    {
      id: '2',
      employmentClass: 'T001',
      firstTwoThirds: 1633,
      teacherName: '沈玉坤',
      employmentDirection: '剪辑',
      employmentCount: 3,
      classSize: 8,
      distributionRatio: 3 / 8,
      distributionAmount: 613,
    },
    {
      id: '3',
      employmentClass: 'T002',
      firstTwoThirds: -300,
      teacherName: '李世峰',
      employmentDirection: '网络',
      employmentCount: 4,
      classSize: 9,
      distributionRatio: 4 / 9,
      distributionAmount: -133,
    },
    {
      id: '4',
      employmentClass: 'T002',
      firstTwoThirds: -300,
      teacherName: '沈玉坤',
      employmentDirection: 'Linux',
      employmentCount: 5,
      classSize: 9,
      distributionRatio: 5 / 9,
      distributionAmount: -167,
    },
  ]

  // 模拟就业明星奖励数据
  const mockStarAwardData: EmploymentStarAward[] = [
    {
      id: '1',
      employmentClass: 'T001',
      teacherName: '李世峰',
      starName: 'XXX',
      employmentSalary: 10000,
      verifiedByHeadquarters: true,
      awardAmount: 600,
    },
    {
      id: '2',
      employmentClass: 'T002',
      teacherName: '沈玉坤',
      starName: 'XXX',
      employmentSalary: 11000,
      verifiedByHeadquarters: true,
      awardAmount: 600,
    },
  ]

  // 模拟课时统计数据
  const mockClassHourData: ClassHourStatistics[] = [
    {
      id: '1',
      name: '张三',
      regularClass: 20,
      newStudentRemedial: 20,
      intensiveClass: 20,
      tutoringClass: 20,
      totalFee: 1160,
    },
    {
      id: '2',
      name: '李四',
      regularClass: 18,
      newStudentRemedial: 15,
      intensiveClass: 12,
      tutoringClass: 25,
      totalFee: 1055,
    },
    {
      id: '3',
      name: '王五',
      regularClass: 22,
      newStudentRemedial: 18,
      intensiveClass: 16,
      tutoringClass: 20,
      totalFee: 1220,
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
      setExamPassData(mockExamPassData)
      setRewardPenaltyData(mockRewardPenaltyData)
      setTeacherRewardData(mockTeacherRewardData)
      setStarAwardData(mockStarAwardData)
      setClassHourData(mockClassHourData)
      console.log('📊 教员KPI数据加载完成')
    } catch (error) {
      console.error('❌ 加载教员KPI数据失败:', error)
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

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setFormVisible(true)
  }

  const handleEdit = (record: any) => {
    setEditingRecord(record)
    form.setFieldsValue(record)
    setFormVisible(true)
  }

  const handleDelete = (record: any) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除 ${record.name || record.employmentClass || record.teacherName} 的记录吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        message.success('删除成功')
        loadData()
      },
    })
  }

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        console.log('提交数据:', values)
        message.success(editingRecord ? '更新成功' : '新增成功')
        setFormVisible(false)
        form.resetFields()
        loadData()
      })
      .catch((err) => {
        console.error('表单验证失败:', err)
      })
  }

  const handleCancel = () => {
    setFormVisible(false)
    setEditingRecord(null)
    form.resetFields()
  }

  const getScoreColor = (score: number, type: 'percentage' | 'count' | 'rating' = 'percentage') => {
    if (type === 'percentage') {
      if (score >= 95) return '#52c41a'
      if (score >= 85) return '#faad14'
      if (score >= 70) return '#fa8c16'
      return '#ff4d4f'
    } else if (type === 'rating') {
      if (score >= 8) return '#52c41a'
      if (score >= 6) return '#faad14'
      return '#ff4d4f'
    }
    return '#1890ff'
  }

  // 教员考试合格率表格列定义
  const examPassColumns: ColumnsType<TeacherExamPassRate> = [
    {
      title: '序号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      align: 'center',
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
      title: '就业率',
      dataIndex: 'employmentRate',
      key: 'employmentRate',
      width: 100,
      align: 'center',
      render: (value: number) => (
        <div>
          <Progress
            percent={value}
            size="small"
            strokeColor={getScoreColor(value)}
            showInfo={false}
          />
          <Text style={{ color: getScoreColor(value) }}>{value}%</Text>
        </div>
      ),
    },
    {
      title: '就业薪资',
      dataIndex: 'employmentSalary',
      key: 'employmentSalary',
      width: 120,
      align: 'center',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '口碑人数',
      dataIndex: 'reputationCount',
      key: 'reputationCount',
      width: 100,
      align: 'center',
      render: (value: number) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: '口碑收入',
      dataIndex: 'reputationIncome',
      key: 'reputationIncome',
      width: 120,
      align: 'center',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '带新生人数',
      dataIndex: 'newStudentCount',
      key: 'newStudentCount',
      width: 120,
      align: 'center',
      render: (value: number) => <Tag color="green">{value}</Tag>,
    },
    {
      title: '新生流失人数',
      dataIndex: 'newStudentLoss',
      key: 'newStudentLoss',
      width: 130,
      align: 'center',
      render: (value: number) => <Tag color={value === 0 ? 'green' : 'red'}>{value}</Tag>,
    },
    {
      title: '作业提交率',
      dataIndex: 'homeworkSubmitRate',
      key: 'homeworkSubmitRate',
      width: 120,
      align: 'center',
      render: (value: number) => (
        <div>
          <Progress
            percent={value}
            size="small"
            strokeColor={getScoreColor(value)}
            showInfo={false}
          />
          <Text style={{ color: getScoreColor(value) }}>{value}%</Text>
        </div>
      ),
    },
    {
      title: '作业合格率',
      dataIndex: 'homeworkPassRate',
      key: 'homeworkPassRate',
      width: 120,
      align: 'center',
      render: (value: number) => (
        <div>
          <Progress
            percent={value}
            size="small"
            strokeColor={getScoreColor(value)}
            showInfo={false}
          />
          <Text style={{ color: getScoreColor(value) }}>{value}%</Text>
        </div>
      ),
    },
    {
      title: '考试合格率',
      dataIndex: 'examPassRate',
      key: 'examPassRate',
      width: 120,
      align: 'center',
      render: (value: number) => (
        <div>
          <Progress
            percent={value}
            size="small"
            strokeColor={getScoreColor(value)}
            showInfo={false}
          />
          <Text style={{ color: getScoreColor(value) }}>{value}%</Text>
        </div>
      ),
    },
    {
      title: '项目提交率',
      dataIndex: 'projectSubmitRate',
      key: 'projectSubmitRate',
      width: 120,
      align: 'center',
      render: (value: number) => (
        <div>
          <Progress
            percent={value}
            size="small"
            strokeColor={getScoreColor(value)}
            showInfo={false}
          />
          <Text style={{ color: getScoreColor(value) }}>{value}%</Text>
        </div>
      ),
    },
    {
      title: '项目合格率',
      dataIndex: 'projectPassRate',
      key: 'projectPassRate',
      width: 120,
      align: 'center',
      render: (value: number) => (
        <div>
          <Progress
            percent={value}
            size="small"
            strokeColor={getScoreColor(value)}
            showInfo={false}
          />
          <Text style={{ color: getScoreColor(value) }}>{value}%</Text>
        </div>
      ),
    },
    {
      title: '学员满意度',
      dataIndex: 'studentSatisfaction',
      key: 'studentSatisfaction',
      width: 120,
      align: 'center',
      render: (value: number) => (
        <div>
          <Progress
            percent={value}
            size="small"
            strokeColor={getScoreColor(value)}
            showInfo={false}
          />
          <Text style={{ color: getScoreColor(value) }}>{value}%</Text>
        </div>
      ),
    },
    {
      title: '学员违纪',
      dataIndex: 'studentViolations',
      key: 'studentViolations',
      width: 100,
      align: 'center',
      render: (value: number) => <Tag color={value === 0 ? 'green' : 'red'}>{value}</Tag>,
    },
    {
      title: '上级听课',
      dataIndex: 'supervisorObservation',
      key: 'supervisorObservation',
      width: 100,
      align: 'center',
      render: (value: number) => <Tag color={getScoreColor(value, 'rating')}>{value}</Tag>,
    },
    {
      title: '教员平均',
      dataIndex: 'teacherAverage',
      key: 'teacherAverage',
      width: 100,
      align: 'center',
      render: (value: number) => (
        <div>
          <Progress
            percent={value}
            size="small"
            strokeColor={getScoreColor(value)}
            showInfo={false}
          />
          <Text style={{ color: getScoreColor(value) }}>{value}%</Text>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: any, record: any) => (
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

  // 就业奖惩表格列定义
  const rewardPenaltyColumns: ColumnsType<EmploymentRewardPenalty> = [
    {
      title: '序号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      align: 'center',
    },
    {
      title: '就业班级',
      dataIndex: 'employmentClass',
      key: 'employmentClass',
      width: 120,
      align: 'center',
    },
    {
      title: '学员平均薪资(元)',
      dataIndex: 'avgSalary',
      key: 'avgSalary',
      width: 150,
      align: 'center',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '奖罚金额基数(元)',
      dataIndex: 'baseAmount',
      key: 'baseAmount',
      width: 150,
      align: 'center',
      render: (value: number) => (
        <Text style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>¥{value.toLocaleString()}</Text>
      ),
    },
    {
      title: '班级人数(人)',
      dataIndex: 'classSize',
      key: 'classSize',
      width: 120,
      align: 'center',
    },
    {
      title: '班级人数奖罚比例',
      dataIndex: 'classRatio',
      key: 'classRatio',
      width: 160,
      align: 'center',
      render: (value: number) => `${(value * 100).toFixed(1)}%`,
    },
    {
      title: '奖罚总额(元)',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 130,
      align: 'center',
      render: (value: number) => (
        <Text style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>¥{value.toLocaleString()}</Text>
      ),
    },
    {
      title: '首次2/3奖金(元)',
      dataIndex: 'firstTwoThirds',
      key: 'firstTwoThirds',
      width: 150,
      align: 'center',
      render: (value: number) => (
        <Text style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>¥{value.toLocaleString()}</Text>
      ),
    },
    {
      title: '剩余1/3奖金(元)',
      dataIndex: 'remainingOneThird',
      key: 'remainingOneThird',
      width: 150,
      align: 'center',
      render: (value: number) => (
        <Text style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>¥{value.toLocaleString()}</Text>
      ),
    },
  ]

  // 学术老师奖惩分配表格列定义
  const teacherRewardColumns: ColumnsType<TeacherRewardPenalty> = [
    {
      title: '序号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      align: 'center',
    },
    {
      title: '就业班级',
      dataIndex: 'employmentClass',
      key: 'employmentClass',
      width: 120,
      align: 'center',
    },
    {
      title: '首次2/3奖金(元)',
      dataIndex: 'firstTwoThirds',
      key: 'firstTwoThirds',
      width: 150,
      align: 'center',
      render: (value: number) => (
        <Text style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>¥{value.toLocaleString()}</Text>
      ),
    },
    {
      title: '带班老师',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 120,
      align: 'center',
    },
    {
      title: '学员就业方向',
      dataIndex: 'employmentDirection',
      key: 'employmentDirection',
      width: 130,
      align: 'center',
    },
    {
      title: '就业人数',
      dataIndex: 'employmentCount',
      key: 'employmentCount',
      width: 100,
      align: 'center',
      render: (value: number) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: '班级人数',
      dataIndex: 'classSize',
      key: 'classSize',
      width: 100,
      align: 'center',
    },
    {
      title: '奖惩分配比例',
      dataIndex: 'distributionRatio',
      key: 'distributionRatio',
      width: 130,
      align: 'center',
      render: (value: number) => `${(value * 100).toFixed(1)}%`,
    },
    {
      title: '奖惩分配(元)',
      dataIndex: 'distributionAmount',
      key: 'distributionAmount',
      width: 130,
      align: 'center',
      render: (value: number) => (
        <Text style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>¥{value.toLocaleString()}</Text>
      ),
    },
  ]

  // 就业明星奖励表格列定义
  const starAwardColumns: ColumnsType<EmploymentStarAward> = [
    {
      title: '序号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      align: 'center',
    },
    {
      title: '就业班级',
      dataIndex: 'employmentClass',
      key: 'employmentClass',
      width: 120,
      align: 'center',
    },
    {
      title: '带班老师',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 120,
      align: 'center',
    },
    {
      title: '就业明星',
      dataIndex: 'starName',
      key: 'starName',
      width: 120,
      align: 'center',
    },
    {
      title: '就业薪资(元)',
      dataIndex: 'employmentSalary',
      key: 'employmentSalary',
      width: 130,
      align: 'center',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '总部是否核实',
      dataIndex: 'verifiedByHeadquarters',
      key: 'verifiedByHeadquarters',
      width: 130,
      align: 'center',
      render: (value: boolean) => <Tag color={value ? 'green' : 'red'}>{value ? '是' : '否'}</Tag>,
    },
    {
      title: '奖励金额(元)',
      dataIndex: 'awardAmount',
      key: 'awardAmount',
      width: 130,
      align: 'center',
      render: (value: number) => (
        <Text style={{ color: '#52c41a' }}>¥{value.toLocaleString()}</Text>
      ),
    },
  ]

  // 课时统计表格列定义
  const classHourColumns: ColumnsType<ClassHourStatistics> = [
    {
      title: '序号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      align: 'center',
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
      title: '正课(25元/节)',
      dataIndex: 'regularClass',
      key: 'regularClass',
      width: 130,
      align: 'center',
      render: (value: number) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: '新生补课(15元/节)',
      dataIndex: 'newStudentRemedial',
      key: 'newStudentRemedial',
      width: 150,
      align: 'center',
      render: (value: number) => <Tag color="green">{value}</Tag>,
    },
    {
      title: '强化课(10元/节)',
      dataIndex: 'intensiveClass',
      key: 'intensiveClass',
      width: 130,
      align: 'center',
      render: (value: number) => <Tag color="orange">{value}</Tag>,
    },
    {
      title: '辅导课(8元/节)',
      dataIndex: 'tutoringClass',
      key: 'tutoringClass',
      width: 130,
      align: 'center',
      render: (value: number) => <Tag color="purple">{value}</Tag>,
    },
    {
      title: '课时费合计(元)',
      dataIndex: 'totalFee',
      key: 'totalFee',
      width: 130,
      align: 'center',
      render: (value: number) => (
        <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>¥{value.toLocaleString()}</Text>
      ),
    },
  ]

  // 计算统计数据
  const stats = {
    totalTeachers: examPassData.length,
    avgEmploymentRate:
      examPassData.length > 0
        ? examPassData.reduce((sum, item) => sum + item.employmentRate, 0) / examPassData.length
        : 0,
    avgExamPassRate:
      examPassData.length > 0
        ? examPassData.reduce((sum, item) => sum + item.examPassRate, 0) / examPassData.length
        : 0,
    avgSatisfaction:
      examPassData.length > 0
        ? examPassData.reduce((sum, item) => sum + item.studentSatisfaction, 0) /
          examPassData.length
        : 0,
    totalRewardAmount: rewardPenaltyData.reduce((sum, item) => sum + item.totalAmount, 0),
    totalClassHourFee: classHourData.reduce((sum, item) => sum + item.totalFee, 0),
  }

  if (loading && examPassData.length === 0) {
    return (
      <div className="text-center py-5">
        <Spin size="large" />
        <div className="mt-3">
          <Text type="secondary">加载教员KPI数据中...</Text>
        </div>
      </div>
    )
  }

  return (
    <div className="teacher-kpi">
      {/* 页面标题 */}
      <div className="mb-4">
        <Title level={2}>
          <TrophyOutlined className="me-2" />
          教员KPI管理
        </Title>
        <Text type="secondary">管理教员绩效考核、奖惩分配和课时统计</Text>
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
              title="教员总数"
              value={stats.totalTeachers}
              prefix={<UserOutlined className="text-primary" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="平均就业率"
              value={stats.avgEmploymentRate}
              suffix="%"
              prefix={<TrophyOutlined className="text-success" />}
              valueStyle={{ color: '#52c41a' }}
              precision={1}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="平均考试合格率"
              value={stats.avgExamPassRate}
              suffix="%"
              prefix={<StarOutlined className="text-warning" />}
              valueStyle={{ color: '#faad14' }}
              precision={1}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="总课时费"
              value={stats.totalClassHourFee}
              prefix={<DollarOutlined className="text-info" />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作按钮 */}
      <Card className="mb-4">
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                刷新
              </Button>
              <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>
                新增记录
              </Button>
            </Space>
          </Col>
          <Col>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出Excel
            </Button>
          </Col>
        </Row>
      </Card>

      {/* KPI数据表格 */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          size="large"
          items={[
            {
              key: 'exam-pass-rate',
              label: '教员考试合格率',
              children: (
                <Table
                  columns={examPassColumns}
                  dataSource={examPassData}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                  }}
                  scroll={{ x: 2000 }}
                  size="small"
                  bordered
                />
              ),
            },
            {
              key: 'reward-penalty',
              label: '就业奖惩金额',
              children: (
                <Table
                  columns={rewardPenaltyColumns}
                  dataSource={rewardPenaltyData}
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
              ),
            },
            {
              key: 'teacher-reward',
              label: '学术老师奖惩分配',
              children: (
                <Table
                  columns={teacherRewardColumns}
                  dataSource={teacherRewardData}
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
              ),
            },
            {
              key: 'star-award',
              label: '就业明星奖励',
              children: (
                <Table
                  columns={starAwardColumns}
                  dataSource={starAwardData}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                  }}
                  scroll={{ x: 1000 }}
                  size="small"
                  bordered
                />
              ),
            },
            {
              key: 'class-hour',
              label: '课时统计',
              children: (
                <Table
                  columns={classHourColumns}
                  dataSource={classHourData}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                  }}
                  scroll={{ x: 1000 }}
                  size="small"
                  bordered
                />
              ),
            },
          ]}
        />
      </Card>

      {/* 说明信息 */}
      <Alert
        message="KPI指标说明"
        description={
          <div>
            <p>
              • <strong>教员考试合格率表</strong>：记录教员各项教学指标和学员表现
            </p>
            <p>
              • <strong>就业奖惩金额表</strong>：根据学员就业情况计算奖惩金额
            </p>
            <p>
              • <strong>学术老师奖惩分配表</strong>：将奖惩金额按比例分配给带班老师
            </p>
            <p>
              • <strong>就业明星奖励表</strong>：对高薪就业学员的带班老师给予奖励
            </p>
            <p>
              • <strong>课时统计表</strong>：统计各类课程的课时和费用
            </p>
          </div>
        }
        type="info"
        showIcon
        className="mt-4"
      />

      {/* 编辑表单模态框 */}
      <Modal
        title={editingRecord ? '编辑记录' : '新增记录'}
        open={formVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        width={800}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            employmentRate: 0,
            employmentSalary: 0,
            reputationCount: 0,
            reputationIncome: 0,
            newStudentCount: 0,
            newStudentLoss: 0,
            homeworkSubmitRate: 0,
            homeworkPassRate: 0,
            examPassRate: 0,
            projectSubmitRate: 0,
            projectPassRate: 0,
            studentSatisfaction: 0,
            studentViolations: 0,
            supervisorObservation: 0,
            teacherAverage: 0,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="姓名"
                name="name"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="就业率 (%)" name="employmentRate">
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="就业薪资" name="employmentSalary">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入就业薪资" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="口碑人数" name="reputationCount">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入口碑人数" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="口碑收入" name="reputationIncome">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入口碑收入" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="带新生人数" name="newStudentCount">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入带新生人数" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="新生流失人数" name="newStudentLoss">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入新生流失人数" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="作业提交率 (%)" name="homeworkSubmitRate">
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="作业合格率 (%)" name="homeworkPassRate">
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="考试合格率 (%)" name="examPassRate">
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="项目提交率 (%)" name="projectSubmitRate">
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="项目合格率 (%)" name="projectPassRate">
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="学员满意度 (%)" name="studentSatisfaction">
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="学员违纪次数" name="studentViolations">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入学员违纪次数" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="上级听课评分" name="supervisorObservation">
                <InputNumber
                  min={0}
                  max={10}
                  step={0.1}
                  style={{ width: '100%' }}
                  placeholder="0-10"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="教员平均分 (%)" name="teacherAverage">
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default TeacherKPI
