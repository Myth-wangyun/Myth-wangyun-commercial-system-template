import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { App, Card, DatePicker, Space, Table, Typography, Button } from 'antd'
import { ReloadOutlined, TableOutlined, BarChartOutlined, CameraOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { 
  marketMonthlyBusinessProgressService,
  type ChannelSummaryData,
  type NewMediaSummaryData
} from '@/services/market/marketMonthlyBusinessProgress'
import ChartView from './ChartView'

const { Text } = Typography
const { RangePicker } = DatePicker

// 获取当前年月
const getCurrentYearMonth = () => ({
  year: dayjs().format('YYYY'),
  month: dayjs().format('MM'),
})

// 获取当月最后一天
const getLastDayOfMonth = (year: string, month: string) => {
  return dayjs(`${year}-${month}-01`).endOf('month').date()
}

// 数据类型定义
interface BusinessProgressData {
  key: string
  campus: string // 神殿/项目
  // 神殿收入
  planIncome: number | null // 计划收入
  actualIncome: number | null // 实际收入
  incomeCompletionRate: string // 收入完成率
  investmentRatio: string // 投产比
  roi: number | null // ROI
  // 神殿运营
  consultConversionRate: string // 咨询转化率
  refundCount: number | null // 退费数
  refundRate: string // 退费率
  // 神殿报名
  planEnrollment: number | null // 计划报名
  grossEnrollment: number | null // 毛报总数
  netEnrollment: number | null // 净报名
  orderCount: number | null // 订座数
  enrollmentProgress: string // 报名进度
  netCost: string // 净成本
  // 神殿上门
  visitCount: number | null // 上门人数
  visitRate: string // 上门率
  // 市场网推数据
  planConsultVolume: number | null // 计划咨询量
  deadline30ConsultVolume: number | null // 截止30日应完成
  actualConsultVolume: number | null // 实际总量
  baiduVolume: number | null // 百度量
  newMediaVolume: number | null // 新媒体量
  consultCompletionProgress: string // 咨询量完成进度
  monthlyConsultCost: number | null // 月计划消费
  actualCost: number | null // 实际消费
  consultCostRate: string // 咨询量成本
  isTotal?: boolean // 是否是合计行
}

// 计算合计行
const calculateTotal = (data: BusinessProgressData[]): BusinessProgressData | null => {
  if (data.length === 0) return null

  const sum = (arr: (number | null)[]) => arr.reduce((s, v) => (s || 0) + (v || 0), 0) || 0

  const total: BusinessProgressData = {
    key: 'total',
    campus: '合计',
    planIncome: sum(data.map((item) => item.planIncome)),
    actualIncome: sum(data.map((item) => item.actualIncome)),
    incomeCompletionRate: '',
    investmentRatio: '',
    roi: null,
    consultConversionRate: '',
    refundCount: sum(data.map((item) => item.refundCount)),
    refundRate: '',
    planEnrollment: sum(data.map((item) => item.planEnrollment)),
    grossEnrollment: sum(data.map((item) => item.grossEnrollment)),
    netEnrollment: sum(data.map((item) => item.netEnrollment)),
    orderCount: sum(data.map((item) => item.orderCount)),
    enrollmentProgress: '',
    netCost: '',
    visitCount: sum(data.map((item) => item.visitCount)),
    visitRate: '',
    planConsultVolume: sum(data.map((item) => item.planConsultVolume)),
    deadline30ConsultVolume: sum(data.map((item) => item.deadline30ConsultVolume)),
    actualConsultVolume: sum(data.map((item) => item.actualConsultVolume)),
    baiduVolume: sum(data.map((item) => item.baiduVolume)),
    newMediaVolume: sum(data.map((item) => item.newMediaVolume)),
    consultCompletionProgress: '',
    monthlyConsultCost: sum(data.map((item) => item.monthlyConsultCost)),
    actualCost: sum(data.map((item) => item.actualCost)),
    consultCostRate: '',
    isTotal: true,
  }

  // 计算合计行的百分比和比率
  if (total.planIncome && total.actualIncome) {
    total.incomeCompletionRate = ((total.actualIncome / total.planIncome) * 100).toFixed(2) + '%'
  }
  if (total.monthlyConsultCost && total.actualIncome) {
    total.investmentRatio = '1: ' + (total.actualIncome / total.monthlyConsultCost).toFixed(1)
    total.roi = parseFloat((total.actualIncome / total.monthlyConsultCost).toFixed(1))
  }
  if (total.planEnrollment && total.grossEnrollment) {
    total.enrollmentProgress =
      ((total.grossEnrollment / total.planEnrollment) * 100).toFixed(2) + '%'
  }
  if (total.grossEnrollment && total.actualIncome) {
    total.netCost = (total.actualIncome / total.grossEnrollment).toFixed(2)
  }
  if (total.actualConsultVolume && total.visitCount) {
    total.visitRate = ((total.visitCount / total.actualConsultVolume) * 100).toFixed(2) + '%'
  }
  if (total.planConsultVolume && total.actualConsultVolume) {
    total.consultCompletionProgress =
      ((total.actualConsultVolume / total.planConsultVolume) * 100).toFixed(2) + '%'
  }
  if (total.actualCost && total.actualConsultVolume) {
    total.consultCostRate = (total.actualCost / total.actualConsultVolume).toFixed(2)
  }

  return total
}

const MarketingMonthlyBusinessProgressPage: React.FC = () => {
  const { message } = App.useApp()
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth())
  const [data, setData] = useState<BusinessProgressData[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table')
  const [exportingScreenshot, setExportingScreenshot] = useState(false)
  // 表题日期范围状态，默认为本月1号到昨天
  const [titleDateRange, setTitleDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().subtract(1, 'day'),
  ])

  const { campuses, loadCampusesFromConfig } = useCampusStore()
  const contentRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)

  // 加载神殿配置
  useEffect(() => {
    loadCampusesFromConfig()
  }, [loadCampusesFromConfig])

  // 从各个表格获取数据并计算
  const fetchAndCalculateData = useCallback(async () => {
    if (!campuses || campuses.length === 0) {
      message.warning('请先配置神殿信息')
      return
    }

    setLoading(true)
    try {
      const startDate = titleDateRange[0].format('YYYY-MM-DD')
      const endDate = titleDateRange[1].format('YYYY-MM-DD')

      // 调用后端汇总接口获取所有神殿数据
      // 数据来源：
      // 1. 计划数据来自 012-市场部年度网络计划表
      // 2. 实际数据来自各渠道日度数据表的汇总
      const summaryDataList = await marketMonthlyBusinessProgressService.getAllCampusSummary(
        yearMonth.year,
        yearMonth.month,
        startDate,
        endDate
      )

      // 验证是否获取到数据
      if (!summaryDataList || summaryDataList.length === 0) {
        message.warning(`未找到${yearMonth.year}年${yearMonth.month}月的计划数据，请先在012-市场部年度网络计划表中配置`)
        setData([])
        return
      }

      const calculatedData: BusinessProgressData[] = summaryDataList.map((summaryData) => {
        // 从012-市场部年度网络计划表获取的计划数据
        const planIncome = summaryData.plan_income || 0  // 网络计划收入
        const actualIncome = summaryData.actual_income || 0  // 实际收入（待完善）
        const planEnrollment = summaryData.plan_enrollment || 0  // 网络计划报名
        const planConsultVolume = summaryData.plan_consult_volume || 0  // 网络计划总量（咨询量）
        const monthlyConsultCost = summaryData.monthly_consult_cost || 0  // 网络计划消费

        // 各渠道数据 - 提供默认值
        const reputationData: ChannelSummaryData = summaryData.reputation_data || {
          gross_total: 0,
          net_signup: 0,
          order_count: 0,
          visit_count: 0,
          actual_consult_count: 0,
          consumption: 0,
          refund_count: 0,
        }
        
        const partnerData: ChannelSummaryData = summaryData.partner_data || {
          gross_total: 0,
          net_signup: 0,
          order_count: 0,
          visit_count: 0,
          actual_consult_count: 0,
          consumption: 0,
          refund_count: 0,
        }
        
        const semData: ChannelSummaryData = summaryData.sem_data || {
          gross_total: 0,
          net_signup: 0,
          order_count: 0,
          visit_count: 0,
          actual_consult_count: 0,
          consumption: 0,
          refund_count: 0,
        }
        
        const newMediaData: NewMediaSummaryData = summaryData.newmedia_data || {
          gross_total: 0,
          net_signup: 0,
          order_count: 0,
          visit_count: 0,
          actual_consult_count: 0,
          consumption: 0,
          refund_count: 0,
          consult_total: 0,
        }

        // 毛报总数 = 网络口碑 + 网络合作伙伴 + SEM + 新媒体
        const grossEnrollment = 
          (reputationData.gross_total || 0) +
          (partnerData.gross_total || 0) +
          (semData.gross_total || 0) +
          (newMediaData.gross_total || 0)

        // 净报名 = 网络口碑 + 网络合作伙伴 + SEM + 新媒体
        const netEnrollment = 
          (reputationData.net_signup || 0) +
          (partnerData.net_signup || 0) +
          (semData.net_signup || 0) +
          (newMediaData.net_signup || 0)

        // 订座数 = 网络口碑 + 网络合作伙伴 + SEM + 新媒体
        const orderCount = 
          (reputationData.order_count || 0) +
          (partnerData.order_count || 0) +
          (semData.order_count || 0) +
          (newMediaData.order_count || 0)

        // 退费数 = 毛报总数 - 净报名
        const refundCount = grossEnrollment - netEnrollment

        // 上门人数 = 口碑 + 网络合作伙伴 + SEM + 新媒体
        const visitCount = 
          (reputationData.visit_count || 0) +
          (partnerData.visit_count || 0) +
          (semData.visit_count || 0) +
          (newMediaData.visit_count || 0)

        // 百度量 = SEM咨询量 + 网络合作伙伴咨询量 + 网络口碑咨询量
        const baiduVolume = 
          (semData.actual_consult_count || 0) +
          (partnerData.actual_consult_count || 0) +
          (reputationData.actual_consult_count || 0)

        // 新媒体量（来自004表）
        const newMediaVolume = newMediaData.consult_total || 0

        // 实际总量 = 百度量 + 新媒体量
        const actualConsultVolume = baiduVolume + newMediaVolume

        // 截止应完成 = (计划咨询量/本月总天数) * (1号到结束日期天数)
        const daysInMonth = dayjs(`${yearMonth.year}-${yearMonth.month}`).daysInMonth()
        const endDay = titleDateRange[1].date()
        const deadline30ConsultVolume = Math.round((planConsultVolume / daysInMonth) * endDay)

        // 实际消费 = 网络合作伙伴 + SEM + 新媒体
        const actualCost = 
          (partnerData.consumption || 0) +
          (semData.consumption || 0) +
          (newMediaData.consumption || 0)

        // 计算各种比率
        // 收入完成率 = 实际收入/计划收入*100%
        const incomeCompletionRate = planIncome > 0 
          ? `${((actualIncome / planIncome) * 100).toFixed(2)}%` 
          : '-'

        // 投产比 = 实际收入/实际消费
        const investmentRatio = actualCost > 0 
          ? `1:${(actualIncome / actualCost).toFixed(1)}` 
          : '-'

        // ROI = (实际收入-实际消费)/实际消费
        const roi = actualCost > 0 
          ? ((actualIncome - actualCost) / actualCost) 
          : null

        // 咨询转化率 = 净报名/实际总量*100%
        const consultConversionRate = actualConsultVolume > 0 
          ? `${((netEnrollment / actualConsultVolume) * 100).toFixed(2)}%` 
          : '-'

        // 退费率 = 退费数/毛报总数*100%
        const refundRate = grossEnrollment > 0 
          ? `${((refundCount / grossEnrollment) * 100).toFixed(2)}%` 
          : '-'

        // 报名进度 = 净报名/计划报名*100%
        const enrollmentProgress = planEnrollment > 0 
          ? `${((netEnrollment / planEnrollment) * 100).toFixed(2)}%` 
          : '-'

        // 净成本 = 实际消费/净报名
        const netCost = netEnrollment > 0 
          ? (actualCost / netEnrollment).toFixed(2) 
          : '-'

        // 上门率 = 上门人数/实际总量*100%
        const visitRate = actualConsultVolume > 0 
          ? `${((visitCount / actualConsultVolume) * 100).toFixed(2)}%` 
          : '-'

        // 咨询量完成进度 = 实际总量/计划咨询量*100%
        const consultCompletionProgress = planConsultVolume > 0 
          ? `${((actualConsultVolume / planConsultVolume) * 100).toFixed(2)}%` 
          : '-'

        // 咨询量成本 = 实际消费/实际总量
        const consultCostRate = actualConsultVolume > 0 
          ? (actualCost / actualConsultVolume).toFixed(2) 
          : '-'

        return {
          key: summaryData.campus,
          campus: summaryData.campus,
          planIncome,
          actualIncome,
          incomeCompletionRate,
          investmentRatio,
          roi,
          consultConversionRate,
          refundCount,
          refundRate,
          planEnrollment,
          grossEnrollment,
          netEnrollment,
          orderCount,
          enrollmentProgress,
          netCost,
          visitCount,
          visitRate,
          planConsultVolume,
          deadline30ConsultVolume,
          actualConsultVolume,
          baiduVolume,
          newMediaVolume,
          consultCompletionProgress,
          monthlyConsultCost,
          actualCost,
          consultCostRate,
        }
      })

      setData(calculatedData)
      message.success('数据加载成功')
    } catch (error: any) {
      console.error('获取数据失败:', error)
      message.error('数据加载失败: ' + (error.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }, [campuses, yearMonth, titleDateRange])

  // 处理年月变化
  const handleYearMonthChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setYearMonth({
        year: date.format('YYYY'),
        month: date.format('MM'),
      })
    }
  }

  // 处理表题日期范围变化
  const handleTitleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setTitleDateRange([dates[0], dates[1]])
    }
  }

  // 刷新数据
  const handleRefresh = () => {
    fetchAndCalculateData()
  }

  // 导出截图
  const handleExportScreenshot = async () => {
    if (!titleRef.current || !contentRef.current) {
      message.error('无法获取内容区域')
      return
    }

    if (tableData.length === 0) {
      message.warning('暂无数据，无法导出截图')
      return
    }

    setExportingScreenshot(true)
    try {
      const { default: html2canvas } = await import('html2canvas')

      // 找到表格容器和相关元素
      const tableWrapper = contentRef.current.querySelector('.ant-table-wrapper') as HTMLElement
      if (!tableWrapper) {
        message.error('无法找到表格元素')
        setExportingScreenshot(false)
        return
      }

      const tableContainer = tableWrapper.querySelector('.ant-table-container') as HTMLElement
      const tableContent = tableWrapper.querySelector('.ant-table-content') as HTMLElement
      const tableBody = tableWrapper.querySelector('.ant-table-body') as HTMLElement
      const tableHeader = tableWrapper.querySelector('.ant-table-header') as HTMLElement
      
      // 保存原始样式
      const originalStyles = {
        containerOverflow: tableContainer ? tableContainer.style.overflow : '',
        contentOverflow: tableContent ? tableContent.style.overflow : '',
        bodyOverflow: tableBody ? tableBody.style.overflow : '',
        bodyMaxHeight: tableBody ? tableBody.style.maxHeight : '',
        headerOverflow: tableHeader ? tableHeader.style.overflow : '',
      }
      
      // 临时移除所有滚动限制，显示完整内容
      if (tableContainer) {
        tableContainer.style.overflow = 'visible'
      }
      if (tableContent) {
        tableContent.style.overflow = 'visible'
      }
      if (tableBody) {
        tableBody.style.overflow = 'visible'
        tableBody.style.maxHeight = 'none'
      }
      if (tableHeader) {
        tableHeader.style.overflow = 'visible'
      }

      // 等待样式应用
      await new Promise(resolve => setTimeout(resolve, 100))

      // 获取表格的实际尺寸
      const table = tableWrapper.querySelector('table') as HTMLElement
      const tableWidth = table ? table.scrollWidth : tableWrapper.scrollWidth
      
      // 创建一个临时容器来组合标题和表格
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.top = '0'
      tempContainer.style.backgroundColor = '#ffffff'
      tempContainer.style.padding = '0'
      document.body.appendChild(tempContainer)

      // 克隆标题
      const titleClone = titleRef.current.cloneNode(true) as HTMLElement
      titleClone.style.width = `${tableWidth}px`
      titleClone.style.marginBottom = '16px'
      
      // 克隆表格
      const tableClone = tableWrapper.cloneNode(true) as HTMLElement
      
      // 将克隆的元素添加到临时容器
      tempContainer.appendChild(titleClone)
      tempContainer.appendChild(tableClone)

      // 使用 html2canvas 截图临时容器
      const canvas = await html2canvas(tempContainer, {
        scale: 2, // 提高清晰度
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
      })

      // 移除临时容器
      document.body.removeChild(tempContainer)

      // 恢复原始样式
      if (tableContainer) {
        tableContainer.style.overflow = originalStyles.containerOverflow
      }
      if (tableContent) {
        tableContent.style.overflow = originalStyles.contentOverflow
      }
      if (tableBody) {
        tableBody.style.overflow = originalStyles.bodyOverflow
        tableBody.style.maxHeight = originalStyles.bodyMaxHeight
      }
      if (tableHeader) {
        tableHeader.style.overflow = originalStyles.headerOverflow
      }

      // 转换为图片并下载
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          const fileName = `网络推广任务进度表_${titleDateRange[0].format('YYYYMMDD')}-${titleDateRange[1].format('YYYYMMDD')}.png`
          link.href = url
          link.download = fileName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          message.success('截图导出成功')
        } else {
          message.error('截图生成失败')
        }
      }, 'image/png')
    } catch (error) {
      console.error('导出截图失败:', error)
      message.error('导出截图失败: ' + (error as Error).message)
    } finally {
      setExportingScreenshot(false)
    }
  }

  // 初始加载数据
  useEffect(() => {
    if (campuses.length > 0) {
      fetchAndCalculateData()
    }
  }, [campuses.length, yearMonth, titleDateRange])

  // 表格数据（包含合计行）
  const tableData = useMemo(() => {
    if (data.length === 0) return []
    const total = calculateTotal(data)
    return total ? [...data, total] : data
  }, [data])

  // 获取标题日期范围（使用用户选择的日期）
  const getDateRange = () => {
    const startDate = titleDateRange[0].format('YYYY年MM月DD日')
    const endDate = titleDateRange[1].format('MM月DD日')
    return `${startDate}-${endDate}`
  }

  // 获取截止日期的天数（用于动态列标题）
  const getDeadlineDay = () => {
    return titleDateRange[1].date()
  }

  // 渲染数值单元格（红色高亮）
  const renderRedCell = (value: number | string | null, isTotal?: boolean) => {
    if (value === null || value === '') return '-'
    return (
      <Text
        style={{ color: '#c00000', fontWeight: isTotal ? 'bold' : 'normal' }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
    )
  }

  // 渲染普通单元格
  const renderCell = (value: number | string | null, isTotal?: boolean) => {
    if (value === null || value === '') return '-'
    return (
      <Text style={{ color: isTotal ? '#c00000' : '#000', fontWeight: isTotal ? 'bold' : 'normal' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
    )
  }

  // 表格列配置
  const columns: ColumnsType<BusinessProgressData> = [
    {
      title: '项目',
      children: [
        {
          title: '神殿',
          dataIndex: 'campus',
          key: 'campus',
          fixed: 'left',
          width: 80,
          align: 'center',
          render: (text, record) => (
            <Text style={{ fontWeight: record.isTotal ? 'bold' : 'normal' }}>{text || '-'}</Text>
          ),
        },
      ],
    },
    {
      title: '神殿收入',
      children: [
        {
          title: '计划收入',
          dataIndex: 'planIncome',
          key: 'planIncome',
          width: 100,
          align: 'center',
          render: (value, record) => renderCell(value, record.isTotal),
          onHeaderCell: () => ({
            title: '来自012市场部年度网络计划表',
          }),
        },
        {
          title: '实际收入',
          dataIndex: 'actualIncome',
          key: 'actualIncome',
          width: 100,
          align: 'center',
          render: (value, record) => renderCell(value, record.isTotal),
        },
        {
          title: '收入完成率',
          dataIndex: 'incomeCompletionRate',
          key: 'incomeCompletionRate',
          width: 100,
          align: 'center',
          render: (value, record) => renderCell(value, record.isTotal),
        },
        {
          title: '投产比',
          dataIndex: 'investmentRatio',
          key: 'investmentRatio',
          width: 80,
          align: 'center',
          render: (value, record) => renderCell(value, record.isTotal),
        },
        {
          title: 'ROI',
          dataIndex: 'roi',
          key: 'roi',
          width: 60,
          align: 'center',
          render: (value, record) => renderCell(value, record.isTotal),
        },
      ],
    },
    {
      title: '神殿运营',
      children: [
        {
          title: '咨询转化率',
          dataIndex: 'consultConversionRate',
          key: 'consultConversionRate',
          width: 90,
          align: 'center',
          render: (value, record) => renderCell(value, record.isTotal),
        },
        {
          title: '退费数',
          dataIndex: 'refundCount',
          key: 'refundCount',
          width: 70,
          align: 'center',
          render: (value, record) => renderCell(value, record.isTotal),
        },
        {
          title: '退费率',
          dataIndex: 'refundRate',
          key: 'refundRate',
          width: 70,
          align: 'center',
          render: (value, record) => renderCell(value, record.isTotal),
        },
      ],
    },
    {
      title: '神殿报名',
      children: [
        {
          title: '计划报名',
          dataIndex: 'planEnrollment',
          key: 'planEnrollment',
          width: 80,
          align: 'center',
          render: (value, record) => renderRedCell(value, record.isTotal),
          onHeaderCell: () => ({
            title: '来自012市场部年度网络计划表',
          }),
        },
        {
          title: '毛报总数',
          dataIndex: 'grossEnrollment',
          key: 'grossEnrollment',
          width: 80,
          align: 'center',
          render: (value, record) => renderCell(value, record.isTotal),
        },
        {
          title: '净报名',
          dataIndex: 'netEnrollment',
          key: 'netEnrollment',
          width: 70,
          align: 'center',
          render: (value, record) => renderCell(value, record.isTotal),
        },
        {
          title: '订座数',
          dataIndex: 'orderCount',
          key: 'orderCount',
          width: 70,
          align: 'center',
          render: (value, record) => renderCell(value, record.isTotal),
        },
        {
          title: '报名进度',
          dataIndex: 'enrollmentProgress',
          key: 'enrollmentProgress',
          width: 80,
          align: 'center',
          render: (value, record) => renderCell(value, record.isTotal),
        },
        {
          title: '净成本',
          dataIndex: 'netCost',
          key: 'netCost',
          width: 70,
          align: 'center',
          render: (value, record) => renderRedCell(value, record.isTotal),
        },
      ],
    },
    {
      title: '神殿上门',
      children: [
        {
          title: '上门人数',
          dataIndex: 'visitCount',
          key: 'visitCount',
          width: 80,
          align: 'center',
          render: (value, record) => renderCell(value, record.isTotal),
        },
        {
          title: '上门率',
          dataIndex: 'visitRate',
          key: 'visitRate',
          width: 80,
          align: 'center',
          render: (value, record) => renderCell(value, record.isTotal),
        },
      ],
    },
    {
      title: '市场网推数据',
      children: [
        {
          title: '计划咨询量',
          dataIndex: 'planConsultVolume',
          key: 'planConsultVolume',
          width: 90,
          align: 'center',
          render: (value, record) => renderRedCell(value, record.isTotal),
          onHeaderCell: () => ({
            title: '来自012市场部年度网络计划表',
          }),
        },
        {
          title: `截止${getDeadlineDay()}日应完成`,
          dataIndex: 'deadline30ConsultVolume',
          key: 'deadline30ConsultVolume',
          width: 110,
          align: 'center',
          render: (value, record) => renderCell(value, record.isTotal),
        },
        {
          title: '实际总量',
          dataIndex: 'actualConsultVolume',
          key: 'actualConsultVolume',
          width: 80,
          align: 'center',
          render: (value, record) => renderCell(value, record.isTotal),
        },
        {
          title: '百度量',
          dataIndex: 'baiduVolume',
          key: 'baiduVolume',
          width: 70,
          align: 'center',
          render: (value, record) => renderCell(value, record.isTotal),
        },
        {
          title: '新媒体量',
          dataIndex: 'newMediaVolume',
          key: 'newMediaVolume',
          width: 80,
          align: 'center',
          render: (value, record) => renderCell(value, record.isTotal),
        },
        {
          title: '咨询量完成进度',
          dataIndex: 'consultCompletionProgress',
          key: 'consultCompletionProgress',
          width: 110,
          align: 'center',
          render: (value, record) => renderCell(value, record.isTotal),
        },
        {
          title: '月计划消费',
          dataIndex: 'monthlyConsultCost',
          key: 'monthlyConsultCost',
          width: 100,
          align: 'center',
          render: (value, record) => renderCell(value ? value.toFixed(2) : null, record.isTotal),
          onHeaderCell: () => ({
            title: '来自012市场部年度网络计划表',
          }),
        },
        {
          title: '实际消费',
          dataIndex: 'actualCost',
          key: 'actualCost',
          width: 100,
          align: 'center',
          render: (value, record) => renderCell(value ? value.toFixed(2) : null, record.isTotal),
        },
        {
          title: '咨询量成本',
          dataIndex: 'consultCostRate',
          key: 'consultCostRate',
          width: 90,
          align: 'center',
          render: (value, record) => renderCell(value, record.isTotal),
        },
      ],
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      {/* 标题栏 */}
      <div
        ref={titleRef}
        style={{
          marginBottom: 24,
          textAlign: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          padding: '10px 16px',
          backgroundColor: '#fff2cc',
          color: '#000',
          borderRadius: 0,
          border: '1px solid #000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        }}
      >
        <RangePicker
          value={titleDateRange}
          onChange={handleTitleDateRangeChange}
          allowClear={false}
          style={{ width: 280 }}
          format="YYYY年MM月DD日"
        />
        <span>各神殿-网络推广任务进度表</span>
      </div>

      <Card>
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space>
            <span>选择年月：</span>
            <DatePicker
              picker="month"
              value={dayjs(`${yearMonth.year}-${yearMonth.month}`, 'YYYY-MM')}
              onChange={handleYearMonthChange}
              allowClear={false}
              style={{ width: 150 }}
              format="YYYY年MM月"
            />
            <Text type="secondary" style={{ fontSize: '12px', marginLeft: '16px' }}>
              💡 计划数据来自：012市场部年度网络计划表
            </Text>
          </Space>
          <Space>
            <Button
              type={viewMode === 'table' ? 'primary' : 'default'}
              icon={<TableOutlined />}
              onClick={() => setViewMode('table')}
            >
              表格视图
            </Button>
            <Button
              type={viewMode === 'chart' ? 'primary' : 'default'}
              icon={<BarChartOutlined />}
              onClick={() => setViewMode('chart')}
            >
              图表分析
            </Button>
            <Button 
              icon={<CameraOutlined />} 
              onClick={handleExportScreenshot}
              loading={exportingScreenshot}
              disabled={tableData.length === 0}
            >
              导出截图
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              loading={loading}
            >
              刷新数据
            </Button>
          </Space>
        </div>

        <div ref={contentRef}>
          {viewMode === 'table' ? (
            <Table
              columns={columns}
              dataSource={tableData}
              pagination={false}
              bordered
              size="small"
              scroll={{ x: 2800 }}
              loading={loading}
              rowClassName={(record) => (record.isTotal ? 'total-row' : '')}
              locale={{ emptyText: '暂无数据，请点击刷新数据按钮加载' }}
            />
          ) : (
            <ChartView data={data} />
          )}
        </div>

        <style>{`
          .ant-table-thead > tr > th {
            background-color: #fce4d6 !important;
            text-align: center !important;
            font-weight: bold !important;
            border: 1px solid #000 !important;
            padding: 8px 4px !important;
          }
          .ant-table-tbody > tr > td {
            border: 1px solid #000 !important;
            padding: 6px 8px !important;
          }
          .ant-table-tbody > tr.total-row > td {
            background-color: #fff2cc !important;
            font-weight: bold !important;
          }
          .ant-table-cell {
            white-space: nowrap;
          }
        `}</style>
      </Card>
    </div>
  )
}

export default MarketingMonthlyBusinessProgressPage
