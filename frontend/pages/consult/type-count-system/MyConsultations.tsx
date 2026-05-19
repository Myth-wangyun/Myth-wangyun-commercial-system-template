/**
 * 我的咨询量页面
 * 
 * 功能：
 * 1. 显示当前咨询师的所有咨询量
 * 2. 按私域/可再分配(再)/可新分配(新)分类
 * 3. 支持日期快速切换（上一天/下一天）
 * 4. 支持各种状态筛选
 * 5. 业绩统计趋势图（参考003神殿各咨询师数据汇总）
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  App,
  Card,
  Table,
  Tabs,
  Tag,
  Button,
  Space,
  Select,
  Input,
  DatePicker,
  Row,
  Col,
  Badge,
  Statistic,
  Tooltip,
  Modal,
  Descriptions,
  Spin,
  Progress,
  Popconfirm,
  Empty,
  Form,
  InputNumber,
  Switch,
} from 'antd'
import {
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  SwapOutlined,
  UserOutlined,
  LockOutlined,
  MessageOutlined,
  PlusOutlined,
  FieldTimeOutlined,
  UnlockOutlined,
  GlobalOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAuthStore } from '@/stores/authStore'
import { useCampusStore } from '@/stores/campusStore'
import dayjs, { Dayjs } from 'dayjs'
import * as api from './api'
import * as statsApi from './statsApi'
import * as phoneApi from './phoneStatsApi'
import type { ConsultationRecord, ConsultationCategory, MyConsultationsQueryParams } from './types'
import type { CommunicationRecord, CreateCommunicationRequest, TodayCommunicationRecord } from './phoneStatsApi'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
} from 'recharts'

const { RangePicker } = DatePicker

// 图表颜色配置
const CHART_COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16']

// 月度数据类型
interface MonthlyData {
  月份: string
  咨询量: number
  上门量: number
  报名量: number
  转化率: number
  [key: string]: string | number
}

// 来源分布数据类型
interface SourceData {
  name: string
  value: number
  [key: string]: string | number
}

export default function MyConsultations() {
  const { message, notification } = App.useApp()
  const { user } = useAuthStore()
  const { currentCampus } = useCampusStore()
  
  // 基础状态
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<ConsultationCategory | 'all' | '今日回访'>('all')
  const [records, setRecords] = useState<ConsultationRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
  // 统计数据
  const [stats, setStats] = useState({
    私域数量: 0,
    可再分配数量: 0,
    可新分配数量: 0,
    今日回访数量: 0,
  })
  
  // 图表数据
  const [chartLoading, setChartLoading] = useState(false)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [sourceDistribution, setSourceDistribution] = useState<SourceData[]>([])
  const [statusDistribution, setStatusDistribution] = useState<SourceData[]>([])
  const [selectedYear, setSelectedYear] = useState(dayjs().year())
  const [mainView, setMainView] = useState<'data' | 'chart' | 'today-comm'>('data')  // 主视图切换
  
  // 今日沟通记录
  const [todayCommRecords, setTodayCommRecords] = useState<TodayCommunicationRecord[]>([])
  const [todayCommLoading, setTodayCommLoading] = useState(false)
  const [todayCommDate, setTodayCommDate] = useState<Dayjs>(dayjs())
  
  // 日期相关
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [dateMode, setDateMode] = useState<'single' | 'range' | 'all'>('all')  // all = 所有时间
  
  // 筛选条件
  const [filters, setFilters] = useState<MyConsultationsQueryParams>({})
  const [statusOptions, setStatusOptions] = useState<string[]>([])
  const [sourceOptions, setSourceOptions] = useState<string[]>([])
  const [regionOptions, setRegionOptions] = useState<string[]>([])
  
  // 详情弹窗
  const [detailVisible, setDetailVisible] = useState(false)
  const [detailRecord, setDetailRecord] = useState<ConsultationRecord | null>(null)
  
  // 权限信息弹窗
  const [permissionVisible, setPermissionVisible] = useState(false)
  const [permissionData, setPermissionData] = useState<any>(null)
  const [permissionLoading, setPermissionLoading] = useState(false)

  // 跟进弹窗
  const [followUpVisible, setFollowUpVisible] = useState(false)
  const [followUpRecord, setFollowUpRecord] = useState<ConsultationRecord | null>(null)
  const [commRecords, setCommRecords] = useState<CommunicationRecord[]>([])
  const [commLoading, setCommLoading] = useState(false)
  const [editingComm, setEditingComm] = useState<CommunicationRecord | null>(null)
  // 内联新增/编辑表单
  const [inlineFormVisible, setInlineFormVisible] = useState(false)
  const [inlineFormLoading, setInlineFormLoading] = useState(false)
  const [inlineForm] = Form.useForm()

  // 加载选项
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [statusRes, sourceRes, regionRes] = await Promise.all([
          api.getStatusOptions(),
          api.getSourceOptions(),
          api.getRegionOptions(),
        ])
        setStatusOptions(statusRes.data)
        setSourceOptions(sourceRes.data)
        setRegionOptions(regionRes.data)
      } catch (error) {
        console.error('加载选项失败:', error)
      }
    }
    loadOptions()
  }, [])

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // 构建查询参数
      const params: MyConsultationsQueryParams = {
        ...filters,
        page,
        page_size: pageSize,
      }
      
      // 日期筛选
      if (dateMode === 'single') {
        params.start_date = selectedDate.format('YYYY-MM-DD')
        params.end_date = selectedDate.format('YYYY-MM-DD')
      } else if (dateMode === 'range' && dateRange) {
        params.start_date = dateRange[0].format('YYYY-MM-DD')
        params.end_date = dateRange[1].format('YYYY-MM-DD')
      }
      // dateMode === 'all' 时不传日期参数，显示所有时间的数据
      
      // 分类筛选
      if (activeTab === '今日回访') {
        params.today_followup = true
      } else if (activeTab !== 'all') {
        params.category = activeTab as ConsultationCategory
      }
      
      const result = await api.getMyConsultations(params)
      
      if (result.success) {
        setRecords(result.data.数据列表 || [])
        setTotal(result.data.总记录数 || 0)
        
        // 更新统计
        if (result.data.私域数量 !== undefined) {
          setStats({
            私域数量: result.data.私域数量,
            可再分配数量: result.data.可再分配数量 || 0,
            可新分配数量: result.data.可新分配数量 || 0,
            今日回访数量: result.data.今日回访数量 || 0,
          })
        }
      }
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [filters, page, pageSize, activeTab, dateMode, selectedDate, dateRange])

  // 初始加载
  useEffect(() => {
    loadData()
  }, [loadData])

  // 日期切换
  const handlePrevDay = () => {
    setSelectedDate(prev => prev.subtract(1, 'day'))
    setDateMode('single')
    setFilters(prev => ({ ...prev, today_followup: undefined }))
  }
  
  const handleNextDay = () => {
    const next = selectedDate.add(1, 'day')
    if (next.isAfter(dayjs())) {
      message.warning('不能选择未来日期')
      return
    }
    setSelectedDate(next)
    setDateMode('single')
    setFilters(prev => ({ ...prev, today_followup: undefined }))
  }
  
  const handleToday = () => {
    setSelectedDate(dayjs())
    setDateMode('single')
    setFilters(prev => ({ ...prev, today_followup: undefined }))
  }
  
  const handleAllTime = () => {
    setDateMode('all')
    setDateRange(null)
    setFilters(prev => ({ ...prev, today_followup: undefined }))
  }

  // 查看详情
  const handleViewDetail = (record: ConsultationRecord) => {
    setDetailRecord(record)
    setDetailVisible(true)
  }

  // 跟进 - 加载沟通记录
  const loadCommRecords = async (记录ID: number) => {
    setCommLoading(true)
    try {
      const result = await phoneApi.getCommunicationsByRecordId(记录ID)
      if (result.success) {
        setCommRecords(result.data || [])
      }
    } catch (error) {
      console.error('加载沟通记录失败:', error)
    } finally {
      setCommLoading(false)
    }
  }

  const handleFollowUp = (record: ConsultationRecord) => {
    setFollowUpRecord(record)
    setFollowUpVisible(true)
    loadCommRecords(record.记录ID)
  }

  // 计算距上次联络天数
  const daysSinceLastContact = useMemo(() => {
    if (commRecords.length === 0) return null
    const sorted = [...commRecords].sort((a, b) =>
      dayjs(b.沟通时间).valueOf() - dayjs(a.沟通时间).valueOf()
    )
    return dayjs().diff(dayjs(sorted[0].沟通时间), 'day')
  }, [commRecords])

  // 沟通记录行间距上次天数
  const getDaysSinceLast = (list: CommunicationRecord[], index: number): string => {
    if (index === 0) return '-'
    const current = dayjs(list[index].沟通时间)
    const prev = dayjs(list[index - 1].沟通时间)
    return `${current.diff(prev, 'day')}天`
  }

  const handleDeleteComm = async (沟通ID: number) => {
    if (!followUpRecord) return
    try {
      await phoneApi.deleteCommunicationRecord(沟通ID)
      message.success('删除成功')
      loadCommRecords(followUpRecord.记录ID)
    } catch {
      message.error('删除失败')
    }
  }

  // 内联表单提交
  const handleInlineFormSubmit = async () => {
    if (!followUpRecord) return
    try {
      const values = await inlineForm.validateFields()
      setInlineFormLoading(true)
      const submitData: CreateCommunicationRequest = {
        记录ID: followUpRecord.记录ID,
        沟通时间: values.沟通时间.format('YYYY-MM-DD HH:mm:ss'),
        用时: values.用时 || 0,
        咨询师: followUpRecord.咨询师 || '',
        沟通方式: values.沟通方式,
        需求点: values.需求点,
        关注点: values.关注点,
        抗拒点: values.抗拒点,
        咨询内容: values.咨询内容,
        咨询结果: values.咨询结果,
        报名意愿: values.报名意愿,
        有需求: values.有需求 ? 1 : 0,
        有钱: values.有钱 ? 1 : 0,
        有时间: values.有时间 ? 1 : 0,
        有支持: values.有支持 ? 1 : 0,
        具备条件: values.具备条件,
        课程意向: values.课程意向,
        联系不上: values.联系不上 ? 1 : 0,
        预定回访时间: values.预定回访时间?.format('YYYY-MM-DD HH:mm:ss'),
      }
      if (editingComm) {
        await phoneApi.updateCommunicationRecord(editingComm.沟通ID, submitData)
        notification.success({ message: '已保存', description: '沟通记录更新成功', placement: 'topRight', duration: 3 })
      } else {
        await phoneApi.createCommunicationRecord(submitData)
        notification.success({ message: '已创建', description: '沟通记录创建成功', placement: 'topRight', duration: 3 })
      }
      setInlineFormVisible(false)
      setEditingComm(null)
      inlineForm.resetFields()
      loadCommRecords(followUpRecord.记录ID)
    } catch (error: any) {
      if (error?.response?.data?.detail) {
        notification.error({ message: '保存失败', description: error.response.data.detail, placement: 'topRight', duration: 4 })
      } else if (error?.errorFields) {
        // form validation error, ignore
      } else {
        notification.error({ message: '保存失败', description: '请检查网络连接或联系管理员', placement: 'topRight', duration: 4 })
      }
    } finally {
      setInlineFormLoading(false)
    }
  }

  // 打开内联编辑表单
  const openInlineEdit = (record: CommunicationRecord) => {
    setEditingComm(record)
    setInlineFormVisible(true)
    inlineForm.setFieldsValue({
      ...record,
      沟通时间: dayjs(),
      预定回访时间: record.预定回访时间 ? dayjs(record.预定回访时间) : null,
      有需求: record.有需求 === 1,
      有钱: record.有钱 === 1,
      有时间: record.有时间 === 1,
      有支持: record.有支持 === 1,
      联系不上: record.联系不上 === 1,
    })
  }

  // 打开内联新增表单
  const openInlineAdd = () => {
    setEditingComm(null)
    setInlineFormVisible(true)
    inlineForm.resetFields()
    inlineForm.setFieldsValue({
      沟通时间: dayjs(),
      沟通方式: '电话',
      用时: 0,
    })
  }

  // 查看权限
  const handleViewPermission = async (record: ConsultationRecord) => {
    setPermissionLoading(true)
    setPermissionVisible(true)
    try {
      const result = await api.checkConsultationPermission(record.对象ID)
      if (result.success) {
        setPermissionData(result.data)
      }
    } catch (error) {
      message.error('获取权限信息失败')
    } finally {
      setPermissionLoading(false)
    }
  }

  // 搜索
  const handleSearch = () => {
    setPage(1)
    loadData()
  }

  // 重置
  const handleReset = () => {
    setFilters({})
    setPage(1)
    setDateMode('all')
    setDateRange(null)
  }

  // 加载图表数据
  const loadChartData = useCallback(async () => {
    if (!user?.name && !user?.username) return
    
    setChartLoading(true)
    try {
      // 获取当前咨询师全年的数据用于统计
      const yearStart = dayjs().year(selectedYear).startOf('year').format('YYYY-MM-DD')
      const yearEnd = dayjs().year(selectedYear).endOf('year').format('YYYY-MM-DD')
      
      const result = await api.getMyConsultations({
        start_date: yearStart,
        end_date: yearEnd,
        page: 1,
        page_size: 5000, // 获取全年数据
      })
      
      if (result.success && result.data.数据列表) {
        const allRecords = result.data.数据列表
        
        // 计算月度统计
        const monthlyStats: Record<string, { 咨询量: number, 上门量: number, 报名量: number }> = {}
        for (let i = 1; i <= 12; i++) {
          const monthKey = `${selectedYear}-${String(i).padStart(2, '0')}`
          monthlyStats[monthKey] = { 咨询量: 0, 上门量: 0, 报名量: 0 }
        }
        
        // 来源统计
        const sourceStats: Record<string, number> = {}
        // 状态统计  
        const statusStats: Record<string, number> = {}
        
        allRecords.forEach((record: ConsultationRecord) => {
          // 月度统计
          const recordDate = record.登记日期 || record.创建时间
          if (recordDate) {
            const monthKey = dayjs(recordDate).format('YYYY-MM')
            if (monthlyStats[monthKey]) {
              monthlyStats[monthKey].咨询量 += 1
              if (record.是否上门 === 1) {
                monthlyStats[monthKey].上门量 += 1
              }
              if (record.状态 === '报名') {
                monthlyStats[monthKey].报名量 += 1
              }
            }
          }
          
          // 来源统计
          const source = record.量来源 || '其他'
          sourceStats[source] = (sourceStats[source] || 0) + 1
          
          // 状态统计
          const status = record.状态 || '未知'
          statusStats[status] = (statusStats[status] || 0) + 1
        })
        
        // 转换为图表数据格式
        const monthlyChartData: MonthlyData[] = Object.entries(monthlyStats).map(([month, data]) => ({
          月份: month.replace(`${selectedYear}-`, '') + '月',
          咨询量: data.咨询量,
          上门量: data.上门量,
          报名量: data.报名量,
          转化率: data.咨询量 > 0 ? Math.round((data.报名量 / data.咨询量) * 100) : 0,
        }))
        
        const sourceChartData: SourceData[] = Object.entries(sourceStats)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8) // 只显示前8个来源
        
        const statusChartData: SourceData[] = Object.entries(statusStats)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
        
        setMonthlyData(monthlyChartData)
        setSourceDistribution(sourceChartData)
        setStatusDistribution(statusChartData)
      }
    } catch (error) {
      console.error('加载图表数据失败:', error)
      message.error('加载图表数据失败')
    } finally {
      setChartLoading(false)
    }
  }, [user, selectedYear])

  // 切换到图表视图时加载数据
  useEffect(() => {
    if (mainView === 'chart') {
      loadChartData()
    }
  }, [mainView, selectedYear, loadChartData])

  // 加载今日沟通记录
  const loadTodayComm = useCallback(async () => {
    setTodayCommLoading(true)
    try {
      const result = await phoneApi.getMyTodayCommunications(todayCommDate.format('YYYY-MM-DD'))
      if (result.success) {
        setTodayCommRecords(result.data || [])
      }
    } catch (error) {
      message.error('加载今日沟通记录失败')
    } finally {
      setTodayCommLoading(false)
    }
  }, [todayCommDate])

  // 切换到今日沟通视图时加载
  useEffect(() => {
    if (mainView === 'today-comm') {
      loadTodayComm()
    }
  }, [mainView, todayCommDate, loadTodayComm])

  // 表格列定义
  const columns: ColumnsType<ConsultationRecord> = [
    {
      title: '分类标记',
      width: 80,
      fixed: 'left',
      render: (_, record: any) => {
        // 根据记录的保护期状态显示标记
        const tag = record._category_tag
        if (tag === '私域') {
          return <Tag icon={<LockOutlined />} color="blue">私域</Tag>
        } else if (tag === '再') {
          return <Tag icon={<UnlockOutlined />} color="orange">再</Tag>
        } else if (tag === '新') {
          return <Tag icon={<GlobalOutlined />} color="green">新</Tag>
        }
        return <Tag color="default">-</Tag>
      },
    },
    {
      title: '登记日期',
      dataIndex: '登记日期',
      width: 100,
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD') : '-',
      sorter: (a, b) => {
        const dateA = a.登记日期 ? dayjs(a.登记日期).valueOf() : 0
        const dateB = b.登记日期 ? dayjs(b.登记日期).valueOf() : 0
        return dateA - dateB
      },
    },
    {
      title: '咨询者',
      dataIndex: '咨询者姓名',
      width: 80,
    },
    {
      title: '电话',
      dataIndex: '电话',
      width: 120,
    },
    {
      title: '咨询师',
      dataIndex: '咨询师',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: '状态',
      width: 80,
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          '未联系': 'default',
          '已联系': 'processing',
          '意向中': 'blue',
          '约上门': 'cyan',
          '已上门': 'purple',
          '已报名': 'success',
          '已缴费': 'green',
          '无意向': 'default',
          '已流失': 'red',
          '已退费': 'magenta',
        }
        return val ? <Tag color={colorMap[val] || 'default'}>{val}</Tag> : '-'
      },
      filters: statusOptions.map(s => ({ text: s, value: s })),
      onFilter: (value, record) => record.状态 === value,
    },
    {
      title: '报名意向',
      dataIndex: '报名意向',
      width: 80,
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          '强意向': 'green',
          '中意向': 'blue',
          '弱意向': 'orange',
          '无意向': 'default',
          '已报名': 'success',
          '联系不上': 'red',
        }
        return val ? <Tag color={colorMap[val] || 'default'}>{val}</Tag> : '-'
      },
    },
    {
      title: '量来源',
      dataIndex: '量来源',
      width: 80,
      filters: sourceOptions.map(s => ({ text: s, value: s })),
      onFilter: (value, record) => record.量来源 === value,
    },
    {
      title: '媒体来源',
      dataIndex: '媒体来源',
      width: 100,
    },
    {
      title: '上门',
      dataIndex: '是否上门',
      width: 60,
      render: (val: number) => val ? <Tag color="green">是</Tag> : <Tag>否</Tag>,
      filters: [
        { text: '已上门', value: 1 },
        { text: '未上门', value: 0 },
      ],
      onFilter: (value, record) => (record.是否上门 || 0) === value,
    },
    {
      title: '报名',
      dataIndex: '是否报名',
      width: 60,
      render: (val: number) => val ? <Tag color="blue">是</Tag> : <Tag>否</Tag>,
      filters: [
        { text: '已报名', value: 1 },
        { text: '未报名', value: 0 },
      ],
      onFilter: (value, record) => (record.是否报名 || 0) === value,
    },
    {
      title: '神殿',
      dataIndex: '神殿',
      width: 80,
    },
    {
      title: '创建时间',
      dataIndex: '创建时间',
      width: 160,
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<MessageOutlined />}
            onClick={() => handleFollowUp(record)}
          >
            跟进
          </Button>
          <Tooltip title="查看权限">
            <Button
              type="link"
              size="small"
              icon={<LockOutlined />}
              onClick={() => handleViewPermission(record)}
            >
              权限
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Card 
      title={
        <Space>
          <UserOutlined />
          我的咨询量
          {user && <Tag color="blue">{user.name || user.username}</Tag>}
        </Space>
      }
      extra={
        <Space>
          <Button.Group>
            <Button 
              type={mainView === 'data' ? 'primary' : 'default'}
              icon={<UnlockOutlined />}
              onClick={() => setMainView('data')}
            >
              数据列表
            </Button>
            <Button 
              type={mainView === 'today-comm' ? 'primary' : 'default'}
              icon={<MessageOutlined />}
              onClick={() => setMainView('today-comm')}
            >
              今日沟通
            </Button>
            <Button 
              type={mainView === 'chart' ? 'primary' : 'default'}
              icon={<LineChartOutlined />}
              onClick={() => setMainView('chart')}
            >
              业绩趋势
            </Button>
          </Button.Group>
          <Button icon={<ReloadOutlined />} onClick={mainView === 'data' ? loadData : mainView === 'today-comm' ? loadTodayComm : loadChartData}>
            刷新
          </Button>
        </Space>
      }
    >
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={
                <Space>
                  <LockOutlined style={{ color: '#1890ff' }} />
                  我的私域
                </Space>
              }
              value={stats.私域数量}
              suffix="条"
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              15天保护期内，仅本人可操作
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={
                <Space>
                  <UnlockOutlined style={{ color: '#fa8c16' }} />
                  可再分配
                  <Tag color="orange" style={{ marginLeft: 4 }}>再</Tag>
                </Space>
              }
              value={stats.可再分配数量}
              suffix="条"
              valueStyle={{ color: '#fa8c16' }}
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              私域保护期已过，同神殿可分配
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={
                <Space>
                  <GlobalOutlined style={{ color: '#52c41a' }} />
                  可新分配
                  <Tag color="green" style={{ marginLeft: 4 }}>新</Tag>
                </Space>
              }
              value={stats.可新分配数量}
              suffix="条"
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              180天+90天无追访，可跨神殿
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="总计"
              value={stats.私域数量 + stats.可再分配数量 + stats.可新分配数量}
              suffix="条"
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              所有可见咨询量
            </div>
          </Card>
        </Col>
      </Row>

      {/* 根据视图模式显示不同内容 */}
      {mainView === 'chart' ? (
        /* 图表视图 */
        <Spin spinning={chartLoading}>
          {/* 年份选择 */}
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#fafafa', borderRadius: 4 }}>
            <Space>
              <span style={{ fontWeight: 500 }}>统计年份：</span>
              <DatePicker
                picker="year"
                value={dayjs().year(selectedYear)}
                onChange={(date) => date && setSelectedYear(date.year())}
                allowClear={false}
              />
            </Space>
          </div>
          
          {/* 月度趋势图 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={16}>
              <Card title={<Space><LineChartOutlined /> {selectedYear}年月度业绩趋势</Space>} size="small">
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="月份" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" />
                    <RechartsTooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="咨询量" fill={CHART_COLORS[0]} name="咨询量" />
                    <Bar yAxisId="left" dataKey="上门量" fill={CHART_COLORS[1]} name="上门量" />
                    <Bar yAxisId="left" dataKey="报名量" fill={CHART_COLORS[2]} name="报名量" />
                    <Line yAxisId="right" type="monotone" dataKey="转化率" stroke={CHART_COLORS[3]} name="转化率(%)" strokeWidth={2} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={8}>
              <Card title={<Space><PieChartOutlined /> 状态分布</Space>} size="small">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
          
          {/* 来源分布图 */}
          <Row gutter={16}>
            <Col span={12}>
              <Card title={<Space><BarChartOutlined /> 量来源分布</Space>} size="small">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sourceDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} />
                    <RechartsTooltip />
                    <Bar dataKey="value" fill={CHART_COLORS[4]} name="数量">
                      {sourceDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={12}>
              <Card title={<Space><RiseOutlined /> 关键指标汇总</Space>} size="small">
                <Row gutter={[16, 16]} style={{ padding: '20px 0' }}>
                  <Col span={12}>
                    <Statistic 
                      title="年度咨询总量" 
                      value={monthlyData.reduce((sum, m) => sum + m.咨询量, 0)}
                      suffix="条"
                      valueStyle={{ color: CHART_COLORS[0] }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="年度上门总量" 
                      value={monthlyData.reduce((sum, m) => sum + m.上门量, 0)}
                      suffix="条"
                      valueStyle={{ color: CHART_COLORS[1] }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="年度报名总量" 
                      value={monthlyData.reduce((sum, m) => sum + m.报名量, 0)}
                      suffix="条"
                      valueStyle={{ color: CHART_COLORS[2] }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="年度平均转化率" 
                      value={(() => {
                        const total咨询 = monthlyData.reduce((sum, m) => sum + m.咨询量, 0)
                        const total报名 = monthlyData.reduce((sum, m) => sum + m.报名量, 0)
                        return total咨询 > 0 ? ((total报名 / total咨询) * 100).toFixed(1) : 0
                      })()}
                      suffix="%"
                      valueStyle={{ color: CHART_COLORS[3] }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Spin>
      ) : mainView === 'today-comm' ? (
        /* 今日沟通视图 */
        <Spin spinning={todayCommLoading}>
          <div style={{ marginBottom: 12, padding: '8px 16px', background: '#fafafa', borderRadius: 4 }}>
            <Space>
              <span style={{ fontWeight: 500 }}>查看日期：</span>
              <Button size="small" icon={<LeftOutlined />} onClick={() => setTodayCommDate(prev => prev.subtract(1, 'day'))} />
              <DatePicker
                value={todayCommDate}
                onChange={(d) => d && setTodayCommDate(d)}
                allowClear={false}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
              <Button size="small" icon={<RightOutlined />} onClick={() => {
                const next = todayCommDate.add(1, 'day')
                if (!next.isAfter(dayjs())) setTodayCommDate(next)
              }} />
              <Button size="small" onClick={() => setTodayCommDate(dayjs())}>今天</Button>
              <Tag color="blue" style={{ fontSize: 14, padding: '2px 12px' }}>
                共 {todayCommRecords.length} 条沟通记录
              </Tag>
            </Space>
          </div>
          <Table
            bordered
            size="small"
            rowKey="沟通ID"
            dataSource={todayCommRecords}
            pagination={false}
            tableLayout="auto"
            columns={[
              { title: '序号', width: 45, align: 'center' as const, render: (_: any, __: any, i: number) => <strong style={{ fontSize: 15 }}>{i + 1}</strong> },
              { title: '咨询者', dataIndex: '咨询者姓名', width: 65, render: (v: string) => <strong>{v || '-'}</strong> },
              { title: '电话', dataIndex: '电话', width: 105, render: (v: string) => v || '-' },
              { title: '沟通时间', dataIndex: '沟通时间', width: 130, render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
              { title: '用时', dataIndex: '用时', width: 45, align: 'center' as const, render: (v: number) => v > 0 ? `${v}分` : '0' },
              { title: '方式', dataIndex: '沟通方式', width: 55, align: 'center' as const, render: (v: string) => v ? <Tag color={v === '电话' ? 'blue' : v === '网聊' ? 'green' : 'orange'}>{v}</Tag> : '-' },
              { title: '意愿', dataIndex: '报名意愿', width: 50, align: 'center' as const, render: (v: string) => v ? <Tag color={v === 'A' ? 'green' : v === 'B' ? 'cyan' : v === 'C' ? 'orange' : 'red'}>{v}</Tag> : '-' },
              { title: '需求点', dataIndex: '需求点', render: (v: string) => v ? <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{v}</div> : '-' },
              { title: '关注点', dataIndex: '关注点', render: (v: string) => v ? <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{v}</div> : '-' },
              { title: '抗拒点', dataIndex: '抗拒点', render: (v: string) => v ? <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{v}</div> : '-' },
              { title: '课程意向', dataIndex: '课程意向', render: (v: string) => v ? <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{v}</div> : '-' },
              { title: '咨询内容', dataIndex: '咨询内容', render: (v: string) => v ? <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{v}</div> : '-' },
              { title: '咨询结果', dataIndex: '咨询结果', render: (v: string) => v ? <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{v}</div> : '-' },
              { title: '联系', dataIndex: '联系不上', width: 50, align: 'center' as const, render: (v: number) => v ? <Tag color="red">失联</Tag> : <Tag color="green">正常</Tag> },
            ]}
          />
        </Spin>
      ) : (
        /* 数据列表视图 */
        <>
      {/* 日期选择区域 */}
      <div style={{ marginBottom: 16, padding: '12px 16px', background: '#fafafa', borderRadius: 4 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Space>
              <span style={{ fontWeight: 500 }}>日期筛选：</span>
              <Button 
                type={dateMode === 'all' ? 'primary' : 'default'}
                onClick={handleAllTime}
              >
                全部时间
              </Button>
              <Button.Group>
                <Button icon={<LeftOutlined />} onClick={handlePrevDay} />
                <Button 
                  type={dateMode === 'single' ? 'primary' : 'default'}
                  icon={<CalendarOutlined />}
                  onClick={handleToday}
                >
                  {dateMode === 'single' ? selectedDate.format('YYYY-MM-DD') : '今天'}
                </Button>
                <Button icon={<RightOutlined />} onClick={handleNextDay} />
              </Button.Group>
              <DatePicker
                value={dateMode === 'single' ? selectedDate : null}
                onChange={(date) => {
                  if (date) {
                    setSelectedDate(date)
                    setDateMode('single')
                    setFilters(prev => ({ ...prev, today_followup: undefined }))
                  }
                }}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
              <span style={{ margin: '0 8px', color: '#999' }}>或</span>
              <RangePicker
                value={dateMode === 'range' ? dateRange : null}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([dates[0], dates[1]])
                    setDateMode('range')
                    setFilters(prev => ({ ...prev, today_followup: undefined }))
                  }
                }}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            </Space>
          </Col>
        </Row>
      </div>

      {/* 筛选区域 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Input
            placeholder="关键字搜索"
            value={filters.keyword}
            onChange={e => setFilters({ ...filters, keyword: e.target.value })}
            onPressEnter={handleSearch}
            allowClear
          />
        </Col>
        <Col span={3}>
          <Select
            placeholder="状态"
            value={filters.status}
            onChange={val => setFilters({ ...filters, status: val })}
            allowClear
            style={{ width: '100%' }}
          >
            {statusOptions.map(opt => (
              <Select.Option key={opt} value={opt}>{opt}</Select.Option>
            ))}
          </Select>
        </Col>
        <Col span={3}>
          <Select
            placeholder="量来源"
            value={filters.source}
            onChange={val => setFilters({ ...filters, source: val })}
            allowClear
            style={{ width: '100%' }}
          >
            {sourceOptions.map(opt => (
              <Select.Option key={opt} value={opt}>{opt}</Select.Option>
            ))}
          </Select>
        </Col>
        <Col span={3}>
          <Select
            placeholder="地区"
            value={filters.region}
            onChange={val => setFilters({ ...filters, region: val })}
            allowClear
            showSearch
            style={{ width: '100%' }}
          >
            {regionOptions.map(opt => (
              <Select.Option key={opt} value={opt}>{opt}</Select.Option>
            ))}
          </Select>
        </Col>
        <Col span={4}>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Col>
      </Row>

      {/* 分类Tab */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          const tabKey = key as ConsultationCategory | 'all' | '今日回访'
          setActiveTab(tabKey)
          setPage(1)
          if (tabKey === '今日回访') {
            setFilters(prev => ({ ...prev, today_followup: true }))
            setDateMode('all')
            setDateRange(null)
          } else {
            setFilters(prev => ({ ...prev, today_followup: undefined }))
          }
        }}
        tabBarStyle={{ marginBottom: 16 }}
        items={[
          {
            key: 'all',
            label: (
              <span>
                全部
                <Badge count={total} style={{ marginLeft: 8 }} showZero />
              </span>
            ),
          },
          {
            key: '我的私域',
            label: (
              <span>
                <LockOutlined /> 我的私域
                <Badge count={stats.私域数量} style={{ marginLeft: 8 }} showZero />
              </span>
            ),
          },
          {
            key: '可再分配',
            label: (
              <span>
                <UnlockOutlined /> 可再分配
                <Tag color="orange" style={{ marginLeft: 4 }}>再</Tag>
                <Badge count={stats.可再分配数量} style={{ marginLeft: 4 }} showZero />
              </span>
            ),
          },
          {
            key: '可新分配',
            label: (
              <span>
                <GlobalOutlined /> 可新分配
                <Tag color="green" style={{ marginLeft: 4 }}>新</Tag>
                <Badge count={stats.可新分配数量} style={{ marginLeft: 4 }} showZero />
              </span>
            ),
          },
          {
            key: '今日回访',
            label: (
              <span>
                <FieldTimeOutlined /> 今日回访
                <Badge count={stats.今日回访数量} style={{ marginLeft: 8, backgroundColor: '#ff4d4f' }} showZero />
              </span>
            ),
          },
        ]}
      />

      {/* 数据表格 */}
      <Table
        bordered
        columns={columns}
        dataSource={records}
        rowKey="记录ID"
        loading={loading}
        scroll={{ x: 1500 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条记录`,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps || 20)
          },
        }}
      />
        </>
      )}

      {/* 详情弹窗 */}
      <Modal
        title="咨询量详情"
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false)
          setDetailRecord(null)
        }}
        footer={null}
        width={700}
      >
        {detailRecord && (
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="记录ID">{detailRecord.记录ID}</Descriptions.Item>
            <Descriptions.Item label="对象ID">{detailRecord.对象ID}</Descriptions.Item>
            <Descriptions.Item label="登记日期">{detailRecord.登记日期 ? dayjs(detailRecord.登记日期).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
            <Descriptions.Item label="登记时间">{detailRecord.登记时间 ? dayjs(detailRecord.登记时间).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
            <Descriptions.Item label="咨询者姓名">{detailRecord.咨询者姓名 || '-'}</Descriptions.Item>
            <Descriptions.Item label="电话">{detailRecord.电话}</Descriptions.Item>
            <Descriptions.Item label="性别">{detailRecord.性别 || '-'}</Descriptions.Item>
            <Descriptions.Item label="年龄">{detailRecord.年龄 || '-'}</Descriptions.Item>
            <Descriptions.Item label="咨询师">{detailRecord.咨询师 || '-'}</Descriptions.Item>
            <Descriptions.Item label="分量人">{detailRecord.分量人 || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">{detailRecord.状态 || '-'}</Descriptions.Item>
            <Descriptions.Item label="报名意向">{detailRecord.报名意向 || '-'}</Descriptions.Item>
            <Descriptions.Item label="量来源">{detailRecord.量来源 || '-'}</Descriptions.Item>
            <Descriptions.Item label="媒体来源">{detailRecord.媒体来源 || '-'}</Descriptions.Item>
            <Descriptions.Item label="神殿">{detailRecord.神殿 || '-'}</Descriptions.Item>
            <Descriptions.Item label="位置">{detailRecord.位置 || '-'}</Descriptions.Item>
            <Descriptions.Item label="是否上门">
              {detailRecord.是否上门 ? <Tag color="green">是</Tag> : <Tag>否</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="上门时间">{detailRecord.上门时间 || '-'}</Descriptions.Item>
            <Descriptions.Item label="是否报名">
              {detailRecord.是否报名 ? <Tag color="blue">是</Tag> : <Tag>否</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="报名时间">{detailRecord.报名时间 || '-'}</Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>{detailRecord.备注 || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{detailRecord.创建时间 || '-'}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{detailRecord.更新时间 || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 跟进弹窗 */}
      <Modal
        title={
          followUpRecord ? (
            <Space>
              <MessageOutlined />
              <span>跟进 - {followUpRecord.咨询者姓名 || followUpRecord.电话}</span>
            </Space>
          ) : '跟进'
        }
        open={followUpVisible}
        onCancel={() => {
          setFollowUpVisible(false)
          setFollowUpRecord(null)
          setCommRecords([])
          setInlineFormVisible(false)
          setEditingComm(null)
          inlineForm.resetFields()
        }}
        footer={null}
        width="100vw"
        style={{ top: 0, paddingBottom: 0, maxWidth: '100vw' }}
        styles={{ body: { height: 'calc(100vh - 55px)', overflowY: 'auto', padding: '16px 24px' } }}
      >
        {followUpRecord && (
          <>
            {/* 咨询者详情 */}
            <Descriptions
              bordered
              size="small"
              column={6}
              labelStyle={{ fontWeight: 500, background: '#f0f5ff', whiteSpace: 'nowrap', width: 68, padding: '3px 4px', fontSize: 16 }}
              contentStyle={{ padding: '3px 4px', fontSize: 16 }}
              style={{ marginBottom: 12 }}
            >
              <Descriptions.Item label="咨询者姓名"><strong>{followUpRecord.咨询者姓名 || '-'}</strong></Descriptions.Item>
              <Descriptions.Item label="电话">{followUpRecord.电话 || '-'}</Descriptions.Item>
              <Descriptions.Item label="年龄">{followUpRecord.年龄 || '-'}</Descriptions.Item>
              <Descriptions.Item label="性别">{followUpRecord.性别 || '-'}</Descriptions.Item>

              <Descriptions.Item label="当前状态"><Tag color="blue" style={{ margin: 0 }}>{followUpRecord.状态 || '-'}</Tag></Descriptions.Item>
              <Descriptions.Item label="报名意愿"><Tag color={followUpRecord.报名意向 === '强意向' ? 'green' : followUpRecord.报名意向 === '中意向' ? 'blue' : followUpRecord.报名意向 === '弱意向' ? 'orange' : 'default'} style={{ margin: 0 }}>{followUpRecord.报名意向 || '-'}</Tag></Descriptions.Item>
              <Descriptions.Item label="咨询师">{followUpRecord.咨询师 || '-'}</Descriptions.Item>
              <Descriptions.Item label="登记日期">{followUpRecord.登记日期 ? dayjs(followUpRecord.登记日期).format('YYYY-MM-DD') : '-'}</Descriptions.Item>

              <Descriptions.Item label="咨询类别">{followUpRecord.咨询类别 || '-'}</Descriptions.Item>
              <Descriptions.Item label="量来源"><Tag color="processing" style={{ margin: 0 }}>{followUpRecord.量来源 || '-'}</Tag></Descriptions.Item>
              <Descriptions.Item label="来源类别">{followUpRecord.来源类别 || '-'}</Descriptions.Item>
              <Descriptions.Item label="媒体来源">{followUpRecord.媒体来源 || '-'}</Descriptions.Item>

              <Descriptions.Item label="关键字">{followUpRecord.关键字 || '-'}</Descriptions.Item>
              <Descriptions.Item label="居住区域">{followUpRecord.位置 || followUpRecord.地区 || '-'}</Descriptions.Item>
              <Descriptions.Item label="学历">{followUpRecord.学历 || '-'}</Descriptions.Item>
              <Descriptions.Item label="分量人">{followUpRecord.分量人 || '-'}</Descriptions.Item>

              <Descriptions.Item label="网聊专员">{followUpRecord.网聊专员 || '-'}</Descriptions.Item>
              <Descriptions.Item label="渠道专员">{followUpRecord.渠道专员 || '-'}</Descriptions.Item>
              <Descriptions.Item label="备注" span={4}>{followUpRecord.备注 || '-'}</Descriptions.Item>
            </Descriptions>

            {/* 咨询记录标题 */}
            <div style={{ textAlign: 'center', margin: '4px 0' }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>
                <FieldTimeOutlined style={{ marginRight: 6 }} />
                咨询记录：共 {commRecords.length} 条
                {daysSinceLastContact !== null && (
                  <span style={{ marginLeft: 16 }}>
                    距上次联络
                    <span style={{
                      fontSize: 16, fontWeight: 700, margin: '0 3px',
                      color: daysSinceLastContact > 7 ? '#ff4d4f' : daysSinceLastContact > 3 ? '#faad14' : '#52c41a'
                    }}>
                      {daysSinceLastContact}
                    </span>
                    天
                  </span>
                )}
                {daysSinceLastContact === null && commRecords.length === 0 && (
                  <span style={{ marginLeft: 16, color: '#999', fontSize: 12 }}>暂无沟通记录</span>
                )}
              </span>
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                style={{ marginLeft: 16 }}
                onClick={openInlineAdd}
              >
                新增沟通记录
              </Button>
            </div>

            {/* 沟通记录表格 */}
            {commLoading ? (
              <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
            ) : commRecords.length > 0 ? (
              <Table
                bordered
                size="small"
                rowKey="沟通ID"
                dataSource={commRecords}
                scroll={{ x: 1400 }}
                pagination={false}
                style={{ fontSize: 14 }}
                columns={[
                  { title: '序号', width: 45, align: 'center' as const, render: (_: any, __: any, i: number) => i + 1 },
                  { title: '咨询时间', dataIndex: '沟通时间', width: 140, render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
                  { title: '用时', dataIndex: '用时', width: 50, align: 'center' as const, render: (v: number) => v > 0 ? v : 0 },
                  { title: '距上次', width: 65, align: 'center' as const, render: (_: any, __: any, i: number) => getDaysSinceLast(commRecords, i) },
                  { title: '方式', dataIndex: '沟通方式', width: 60, align: 'center' as const, render: (v: string) => v ? <Tag color={v === '电话' ? 'blue' : v === '网聊' ? 'green' : 'orange'}>{v}</Tag> : '-' },
                  { title: '需求点', dataIndex: '需求点', width: 80, ellipsis: true, render: (v: string) => v || '-' },
                  { title: '关注点', dataIndex: '关注点', width: 80, ellipsis: true, render: (v: string) => v || '-' },
                  { title: '抗拒点', dataIndex: '抗拒点', width: 80, ellipsis: true, render: (v: string) => v || '-' },
                  { title: '报名意愿', dataIndex: '报名意愿', width: 70, align: 'center' as const, render: (v: string) => v ? <Tag color={v === 'A' ? 'green' : v === 'B' ? 'cyan' : v === 'C' ? 'orange' : 'red'}>{v}类</Tag> : '-' },
                  { title: '具备条件', dataIndex: '具备条件', width: 80, ellipsis: true, render: (v: string) => v || '-' },
                  { title: '课程意向', dataIndex: '课程意向', width: 80, ellipsis: true, render: (v: string) => v || '-' },
                  { title: '咨询内容', dataIndex: '咨询内容', width: 260, render: (v: string) => v ? <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{v}</div> : '-' },
                  { title: '咨询结果', dataIndex: '咨询结果', width: 260, render: (v: string) => v ? <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{v}</div> : '-' },
                  { title: '咨询师', dataIndex: '咨询师', width: 70, render: (v: string) => v || '-' },
                  {
                    title: '操作', width: 100, fixed: 'right' as const,
                    render: (_: any, rec: CommunicationRecord) => (
                      <Space size={0}>
                        <Button type="link" size="small" onClick={() => openInlineEdit(rec)}>编辑</Button>
                        <Popconfirm title="确定删除？" onConfirm={() => handleDeleteComm(rec.沟通ID)}>
                          <Button type="link" size="small" danger>删除</Button>
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
              />
            ) : (
              <Empty description="暂无沟通记录" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 16 }} />
            )}

            {/* 内联新增/编辑沟通记录表单 */}
            {inlineFormVisible && (
              <div style={{ marginTop: 8, padding: '10px 16px', background: '#fafafa', borderRadius: 8, border: '1px solid #d9d9d9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>
                    {editingComm ? '✏️ 编辑沟通记录' : '➕ 新增沟通记录'}
                  </span>
                  <Space>
                    <Button size="small" onClick={() => { setInlineFormVisible(false); setEditingComm(null); inlineForm.resetFields() }}>取消</Button>
                    <Button type="primary" size="small" loading={inlineFormLoading} onClick={handleInlineFormSubmit}>保存</Button>
                  </Space>
                </div>
                <Form
                  form={inlineForm}
                  layout="vertical"
                  size="small"
                  initialValues={{ 沟通时间: dayjs(), 沟通方式: '电话', 用时: 0 }}
                >
                  <Row gutter={8}>
                    <Col span={3}>
                      <Form.Item name="沟通时间" label="沟通时间" rules={[{ required: true, message: '请选择' }]} style={{ marginBottom: 4 }}>
                        <DatePicker showTime format="MM-DD HH:mm" style={{ width: '100%' }} disabledDate={(current) => {
                          if (!current) return false
                          if (current > dayjs().endOf('day')) return true
                          if (followUpRecord?.登记日期 && current < dayjs(followUpRecord.登记日期).startOf('day')) return true
                          return false
                        }} />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="沟通方式" label="方式" rules={[{ required: true, message: '选择' }]} style={{ marginBottom: 4 }}>
                        <Select>
                          <Select.Option value="电话">📞电话</Select.Option>
                          <Select.Option value="网聊">💬网聊</Select.Option>
                          <Select.Option value="当面">👥当面</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="用时" label="用时(分)" style={{ marginBottom: 4 }}>
                        <InputNumber min={0} max={999} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item label="咨询师" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#1677ff' }}>{followUpRecord?.咨询师 || '-'}</span>
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="报名意愿" label="意愿" style={{ marginBottom: 4 }}>
                        <Select allowClear placeholder="等级">
                          <Select.Option value="A">A高</Select.Option>
                          <Select.Option value="B">B中</Select.Option>
                          <Select.Option value="C">C低</Select.Option>
                          <Select.Option value="D">D无</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item name="预定回访时间" label="预定回访" style={{ marginBottom: 4 }}>
                        <DatePicker showTime format="MM-DD HH:mm" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="需求点" label="需求点" style={{ marginBottom: 4 }}>
                        <Input placeholder="需求" />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="关注点" label="关注点" style={{ marginBottom: 4 }}>
                        <Input placeholder="关注" />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="抗拒点" label="抗拒点" style={{ marginBottom: 4 }}>
                        <Input placeholder="顾虑" />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="课程意向" label="课程" style={{ marginBottom: 4 }}>
                        <Input placeholder="课程" />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="具备条件" label="条件" style={{ marginBottom: 4 }}>
                        <Input placeholder="条件" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={8} align="middle">
                    <Col flex="auto">
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Form.Item name="联系不上" valuePropName="checked" noStyle>
                          <Switch size="small" checkedChildren="失联" unCheckedChildren="失联" />
                        </Form.Item>
                        <Form.Item name="有需求" valuePropName="checked" noStyle>
                          <Switch size="small" checkedChildren="需求" unCheckedChildren="需求" />
                        </Form.Item>
                        <Form.Item name="有钱" valuePropName="checked" noStyle>
                          <Switch size="small" checkedChildren="有钱" unCheckedChildren="有钱" />
                        </Form.Item>
                        <Form.Item name="有时间" valuePropName="checked" noStyle>
                          <Switch size="small" checkedChildren="时间" unCheckedChildren="时间" />
                        </Form.Item>
                        <Form.Item name="有支持" valuePropName="checked" noStyle>
                          <Switch size="small" checkedChildren="支持" unCheckedChildren="支持" />
                        </Form.Item>
                      </div>
                    </Col>
                  </Row>
                  <Row gutter={8} style={{ marginTop: 4 }}>
                    <Col span={12}>
                      <Form.Item name="咨询内容" label="咨询内容" style={{ marginBottom: 4 }}>
                        <Input.TextArea rows={12} autoSize={{ minRows: 12, maxRows: 25 }} placeholder="详细记录沟通内容..." />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="咨询结果" label="咨询结果" style={{ marginBottom: 0 }}>
                        <Input.TextArea rows={12} autoSize={{ minRows: 12, maxRows: 25 }} placeholder="沟通结果..." />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* 权限信息弹窗 */}
      <Modal
        title="权限信息"
        open={permissionVisible}
        onCancel={() => {
          setPermissionVisible(false)
          setPermissionData(null)
        }}
        footer={null}
        width={600}
      >
        {permissionLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : permissionData ? (
          <div>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="对象ID">{permissionData.对象ID}</Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color={
                  permissionData.当前状态 === '私域保护中' ? 'blue' :
                  permissionData.当前状态 === '已释放到校域' ? 'orange' : 'green'
                }>
                  {permissionData.当前状态}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="可查看">{permissionData.可查看 ? '✓' : '✗'}</Descriptions.Item>
              <Descriptions.Item label="可编辑">{permissionData.可编辑 ? '✓' : '✗'}</Descriptions.Item>
              <Descriptions.Item label="可追访">{permissionData.可追访 ? '✓' : '✗'}</Descriptions.Item>
              <Descriptions.Item label="可重新分配">{permissionData.可重新分配 ? '✓' : '✗'}</Descriptions.Item>
              <Descriptions.Item label="可跨神殿分配">{permissionData.可跨神殿分配 ? '✓' : '✗'}</Descriptions.Item>
              <Descriptions.Item label="原因说明" span={2}>{permissionData.原因说明}</Descriptions.Item>
            </Descriptions>
            
            {permissionData.保护期信息 && (
              <div style={{ marginTop: 16 }}>
                <h4>保护期信息</h4>
                <Descriptions bordered size="small" column={2}>
                  <Descriptions.Item label="私域保护期">
                    {permissionData.保护期信息.私域保护期?.状态}
                    {permissionData.保护期信息.私域保护期?.截止时间 && (
                      <span style={{ color: '#999', marginLeft: 8 }}>
                        截止: {permissionData.保护期信息.私域保护期.截止时间}
                      </span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="校域保护期">
                    {permissionData.保护期信息.校域保护期?.状态}
                    {permissionData.保护期信息.校域保护期?.截止时间 && (
                      <span style={{ color: '#999', marginLeft: 8 }}>
                        截止: {permissionData.保护期信息.校域保护期.截止时间}
                      </span>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#999' }}>暂无数据</div>
        )}
      </Modal>
    </Card>
  )
}
