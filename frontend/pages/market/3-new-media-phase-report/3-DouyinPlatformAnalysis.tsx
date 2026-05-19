import React, { useState, useMemo, useEffect } from 'react'
import { App, Card, DatePicker, Space, Button, Table, Row, Col, InputNumber } from 'antd'
import { FilterOutlined, CloudDownloadOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import axios from 'axios'

interface DouyinAnalysisData {
  key: string
  date: string
  category: string
  
  // 抖音数据
  plannedSales: number | string
  actualSales: number | string
  douyinDisplay: number | string
  nextShowRate: string
  clicks: number | string
  avgClickCost: string
  clickRate: string
  
  // 咨询与转化
  actualConsultation: number | string
  consultationCost: string
  visitingPeople: number | string
  
  // 报名与成本
  actualRegistration: number | string
  registrationRate: string
  registrationCost: string
  
  // 收入与投产比
  plannedIncome: number | string
  actualIncome: number | string
  incomeConversionRate: string
  roiRatio: string
}

interface DouyinDailyData {
  campus: string
  actual_consumption: number
  actual_consult_count: number
  visit_count: number
  actual_registration: number
  actual_income: number
  display_count: number
  click_count: number
  avg_thousand_display_cost: number
}

const DouyinPlatformAnalysisPage: React.FC = () => {
  const { message } = App.useApp()
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    dayjs().startOf('month'),
    dayjs().subtract(1, 'day'),
  ])
  const [loading, setLoading] = useState(false)
  const [dailyData, setDailyData] = useState<DouyinDailyData[]>([])
  const [plannedConsumption, setPlannedConsumption] = useState<Record<string, number>>({
    '合计': 0,
    '盛邦': 0,
    '冀美': 0,
    '晋美': 0,
    '原美': 0,
    '桂美': 0,
    '黔美': 0,
    '邕美': 0,
  })
  
  // 手动输入的计划收入
  const [plannedIncome, setPlannedIncome] = useState<Record<string, number>>({
    '合计': 0,
    '盛邦': 0,
    '冀美': 0,
    '晋美': 0,
    '原美': 0,
    '桂美': 0,
    '黔美': 0,
    '邕美': 0,
  })

  // 神殿列表
  const campusList = ['盛邦', '冀美', '晋美', '原美', '桂美', '黔美', '邕美']

  // 根据日期范围获取月份显示文本
  const getMonthText = () => {
    if (!dateRange || !dateRange[0]) return '1月份'
    const month = dateRange[0].month() + 1
    return `${month}月份`
  }

  // 从后端获取抖音日度数据
  const fetchDouyinData = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning('请选择日期范围')
      return
    }

    setLoading(true)
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD')
      const endDate = dateRange[1].format('YYYY-MM-DD')

      // 调用抖音平台数据汇总接口
      const response = await axios.get('/api/v1/market/douyin-platform-summary', {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      })

      if (response.data.success) {
        setDailyData(response.data.data)
      } else {
        message.error('获取数据失败：' + response.data.error)
      }
    } catch (error) {
      console.error('获取抖音数据失败:', error)
      message.error('获取数据失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 页面加载时获取数据
  useEffect(() => {
    fetchDouyinData()
    loadPlatformPlan() // 加载计划数据
  }, [dateRange])

  // 加载平台计划 - 从市场部月度详细计划获取
  const loadPlatformPlan = async () => {
    if (!dateRange || !dateRange[0]) {
      return
    }

    const year = dateRange[0].year()
    const month = dateRange[0].month() + 1

    try {
      // 从市场部月度详细计划接口获取数据
      const response = await axios.get('/api/v1/market/monthly-plan/newmedia/platform-plan', {
        params: {
          platform: '抖音',
          year: year.toString(),
          month,
        },
      })

      if (response.data.success && response.data.data.length > 0) {
        const newPlannedConsumption: Record<string, number> = { '合计': 0 }
        const newPlannedIncome: Record<string, number> = { '合计': 0 }

        response.data.data.forEach((item: any) => {
          // 使用神殿简称作为 key
          const campusKey = item.campus_short || item.campus
          newPlannedConsumption[campusKey] = item.plan_cost || 0
          newPlannedIncome[campusKey] = item.plan_income || 0
        })

        setPlannedConsumption(newPlannedConsumption)
        setPlannedIncome(newPlannedIncome)
        
        // 只在有数据时显示提示
        if (response.data.data.length > 0) {
          message.success(`已加载 ${response.data.data.length} 个神殿的计划数据`)
        }
      }
    } catch (error) {
      console.error('加载计划数据失败:', error)
      // 静默失败，不显示错误提示
    }
  }

  // 计算汇总数据
  const analysisData: DouyinAnalysisData[] = useMemo(() => {
    const campusDataMap: Record<string, DouyinAnalysisData> = {}
    
    // 初始化各神殿数据
    campusList.forEach(campus => {
      campusDataMap[campus] = {
        key: campus,
        date: '',
        category: campus,
        plannedSales: plannedConsumption[campus] || 0,
        actualSales: 0,
        douyinDisplay: 0,
        nextShowRate: '0',
        clicks: 0,
        avgClickCost: '0',
        clickRate: '0%',
        actualConsultation: 0,
        consultationCost: '0',
        visitingPeople: 0,
        actualRegistration: 0,
        registrationRate: '0%',
        registrationCost: '0',
        plannedIncome: plannedIncome[campus] || 0,
        actualIncome: 0,
        incomeConversionRate: '0%',
        roiRatio: '0',
      }
    })

    // 汇总后端数据
    dailyData.forEach(item => {
      const campus = item.campus
      if (campusDataMap[campus]) {
        campusDataMap[campus].actualSales = Number(campusDataMap[campus].actualSales) + (item.actual_consumption || 0)
        campusDataMap[campus].douyinDisplay = Number(campusDataMap[campus].douyinDisplay) + (item.display_count || 0)
        campusDataMap[campus].clicks = Number(campusDataMap[campus].clicks) + (item.click_count || 0)
        campusDataMap[campus].actualConsultation = Number(campusDataMap[campus].actualConsultation) + (item.actual_consult_count || 0)
        campusDataMap[campus].visitingPeople = Number(campusDataMap[campus].visitingPeople) + (item.visit_count || 0)
        campusDataMap[campus].actualRegistration = Number(campusDataMap[campus].actualRegistration) + (item.actual_registration || 0)
        campusDataMap[campus].actualIncome = Number(campusDataMap[campus].actualIncome) + (item.actual_income || 0)
        // 千次展现费用直接从后端获取
        campusDataMap[campus].nextShowRate = item.avg_thousand_display_cost ? item.avg_thousand_display_cost.toFixed(2) : '#DIV/0!'
      }
    })

    // 计算各神殿的比率
    Object.values(campusDataMap).forEach(data => {
      const actualSales = Number(data.actualSales)
      const douyinDisplay = Number(data.douyinDisplay)
      const clicks = Number(data.clicks)
      const actualConsultation = Number(data.actualConsultation)
      const actualRegistration = Number(data.actualRegistration)
      const actualIncome = Number(data.actualIncome)
      const plannedIncomeValue = Number(data.plannedIncome)

      // 千次展现费用已经从后端获取，不需要计算

      // 平均点击单价
      if (clicks > 0) {
        data.avgClickCost = (actualSales / clicks).toFixed(2)
      } else {
        data.avgClickCost = '0'
      }

      // 点击率
      if (douyinDisplay > 0) {
        data.clickRate = ((clicks / douyinDisplay) * 100).toFixed(2) + '%'
      } else {
        data.clickRate = '0%'
      }

      // 咨询量成本
      if (actualConsultation > 0) {
        data.consultationCost = (actualSales / actualConsultation).toFixed(2)
      } else {
        data.consultationCost = '0'
      }

      // 报名转化率
      if (actualConsultation > 0) {
        data.registrationRate = ((actualRegistration / actualConsultation) * 100).toFixed(2) + '%'
      } else {
        data.registrationRate = '0%'
      }

      // 实际报名成本
      if (actualRegistration > 0) {
        data.registrationCost = (actualSales / actualRegistration).toFixed(2)
      } else {
        data.registrationCost = '0'
      }

      // 收入完成率
      if (plannedIncomeValue > 0) {
        data.incomeConversionRate = ((actualIncome / plannedIncomeValue) * 100).toFixed(2) + '%'
      } else {
        data.incomeConversionRate = '0%'
      }

      // 投产比
      if (actualSales > 0) {
        data.roiRatio = (actualIncome / actualSales).toFixed(2)
      } else {
        data.roiRatio = '0'
      }
    })

    // 计算合计（计划消费和计划收入自动汇总各神殿）
    const totalPlannedSales = campusList.reduce((sum, campus) => sum + (plannedConsumption[campus] || 0), 0)
    const totalPlannedIncome = campusList.reduce((sum, campus) => sum + (plannedIncome[campus] || 0), 0)
    
    const totalData: DouyinAnalysisData = {
      key: 'total',
      date: getMonthText(),
      category: '合计',
      plannedSales: totalPlannedSales,
      actualSales: 0,
      douyinDisplay: 0,
      nextShowRate: '0',
      clicks: 0,
      avgClickCost: '0',
      clickRate: '0%',
      actualConsultation: 0,
      consultationCost: '0',
      visitingPeople: 0,
      actualRegistration: 0,
      registrationRate: '0%',
      registrationCost: '0',
      plannedIncome: totalPlannedIncome,
      actualIncome: 0,
      incomeConversionRate: '0%',
      roiRatio: '0',
    }

    Object.values(campusDataMap).forEach(data => {
      totalData.actualSales = Number(totalData.actualSales) + Number(data.actualSales)
      totalData.douyinDisplay = Number(totalData.douyinDisplay) + Number(data.douyinDisplay)
      totalData.clicks = Number(totalData.clicks) + Number(data.clicks)
      totalData.actualConsultation = Number(totalData.actualConsultation) + Number(data.actualConsultation)
      totalData.visitingPeople = Number(totalData.visitingPeople) + Number(data.visitingPeople)
      totalData.actualRegistration = Number(totalData.actualRegistration) + Number(data.actualRegistration)
      totalData.actualIncome = Number(totalData.actualIncome) + Number(data.actualIncome)
    })

    // 计算合计的比率
    const totalActualSales = Number(totalData.actualSales)
    const totalDouyinDisplay = Number(totalData.douyinDisplay)
    const totalClicks = Number(totalData.clicks)
    const totalActualConsultation = Number(totalData.actualConsultation)
    const totalActualRegistration = Number(totalData.actualRegistration)
    const totalActualIncome = Number(totalData.actualIncome)
    const totalPlannedIncomeValue = Number(totalData.plannedIncome)

    // 千次展现费用从后端获取（已在后端计算加权平均）
    const totalItem = dailyData.find(item => item.campus === '合计')
    if (totalItem && totalItem.avg_thousand_display_cost) {
      totalData.nextShowRate = totalItem.avg_thousand_display_cost.toFixed(2)
    } else {
      totalData.nextShowRate = '0'
    }
    
    // 平均点击单价
    if (totalClicks > 0) {
      totalData.avgClickCost = (totalActualSales / totalClicks).toFixed(2)
    } else {
      totalData.avgClickCost = '0'
    }
    
    // 点击率
    if (totalDouyinDisplay > 0) {
      totalData.clickRate = ((totalClicks / totalDouyinDisplay) * 100).toFixed(2) + '%'
    } else {
      totalData.clickRate = '0%'
    }
    
    if (totalActualConsultation > 0) {
      totalData.consultationCost = (totalActualSales / totalActualConsultation).toFixed(2)
    } else {
      totalData.consultationCost = '0'
    }
    if (totalActualConsultation > 0) {
      totalData.registrationRate = ((totalActualRegistration / totalActualConsultation) * 100).toFixed(2) + '%'
    } else {
      totalData.registrationRate = '0%'
    }
    if (totalActualRegistration > 0) {
      totalData.registrationCost = (totalActualSales / totalActualRegistration).toFixed(2)
    } else {
      totalData.registrationCost = '0'
    }
    // 收入完成率
    if (totalPlannedIncomeValue > 0) {
      totalData.incomeConversionRate = ((totalActualIncome / totalPlannedIncomeValue) * 100).toFixed(2) + '%'
    } else {
      totalData.incomeConversionRate = '0%'
    }
    if (totalActualSales > 0) {
      totalData.roiRatio = (totalActualIncome / totalActualSales).toFixed(2)
    } else {
      totalData.roiRatio = '0'
    }

    return [totalData, ...Object.values(campusDataMap)]
  }, [dailyData, plannedConsumption, plannedIncome, dateRange])

  // 旧的示例数据（保留作为备份）
  const mockAnalysisData: DouyinAnalysisData[] = useMemo(() => [
    {
      key: '1',
      date: getMonthText(),
      category: '合计',
      plannedSales: 0,
      actualSales: 0,
      douyinDisplay: 0,
      nextShowRate: '#DIV/0!',
      clicks: 0,
      avgClickCost: '#DIV/0!',
      clickRate: '#DIV/0!',
      actualConsultation: 0,
      consultationCost: '#DIV/0!',
      visitingPeople: 0,
      actualRegistration: 0,
      registrationRate: '#DIV/0!',
      registrationCost: '#DIV/0!',
      plannedIncome: 0,
      actualIncome: 0,
      incomeConversionRate: '#DIV/0!',
      roiRatio: '#DIV/0!',
    },
    {
      key: '2',
      date: '',
      category: '盛邦',
      plannedSales: 0,
      actualSales: 0,
      douyinDisplay: 0,
      nextShowRate: '',
      clicks: 0,
      avgClickCost: '',
      clickRate: '#DIV/0!',
      actualConsultation: 0,
      consultationCost: '#DIV/0!',
      visitingPeople: 0,
      actualRegistration: 0,
      registrationRate: '#DIV/0!',
      registrationCost: '#DIV/0!',
      plannedIncome: 0,
      actualIncome: 0,
      incomeConversionRate: '#DIV/0!',
      roiRatio: '#DIV/0!',
    },
    {
      key: '3',
      date: '',
      category: '冀美',
      plannedSales: 0,
      actualSales: 0,
      douyinDisplay: 0,
      nextShowRate: '',
      clicks: 0,
      avgClickCost: '',
      clickRate: '#DIV/0!',
      actualConsultation: 0,
      consultationCost: '#DIV/0!',
      visitingPeople: 0,
      actualRegistration: 0,
      registrationRate: '#DIV/0!',
      registrationCost: '#DIV/0!',
      plannedIncome: 0,
      actualIncome: 0,
      incomeConversionRate: '#DIV/0!',
      roiRatio: '#DIV/0!',
    },
    {
      key: '4',
      date: '',
      category: '晋美',
      plannedSales: 0,
      actualSales: 0,
      douyinDisplay: 0,
      nextShowRate: '',
      clicks: 0,
      avgClickCost: '',
      clickRate: '#DIV/0!',
      actualConsultation: 0,
      consultationCost: '#DIV/0!',
      visitingPeople: 0,
      actualRegistration: 0,
      registrationRate: '#DIV/0!',
      registrationCost: '#DIV/0!',
      plannedIncome: 0,
      actualIncome: 0,
      incomeConversionRate: '#DIV/0!',
      roiRatio: '#DIV/0!',
    },
    {
      key: '5',
      date: '',
      category: '原美',
      plannedSales: 0,
      actualSales: 0,
      douyinDisplay: 0,
      nextShowRate: '',
      clicks: 0,
      avgClickCost: '',
      clickRate: '#DIV/0!',
      actualConsultation: 0,
      consultationCost: '#DIV/0!',
      visitingPeople: 0,
      actualRegistration: 0,
      registrationRate: '#DIV/0!',
      registrationCost: '#DIV/0!',
      plannedIncome: 0,
      actualIncome: 0,
      incomeConversionRate: '#DIV/0!',
      roiRatio: '#DIV/0!',
    },
    {
      key: '6',
      date: '',
      category: '桂美',
      plannedSales: 0,
      actualSales: 0,
      douyinDisplay: 0,
      nextShowRate: '',
      clicks: 0,
      avgClickCost: '',
      clickRate: '#DIV/0!',
      actualConsultation: 0,
      consultationCost: '#DIV/0!',
      visitingPeople: 0,
      actualRegistration: 0,
      registrationRate: '#DIV/0!',
      registrationCost: '#DIV/0!',
      plannedIncome: 0,
      actualIncome: 0,
      incomeConversionRate: '#DIV/0!',
      roiRatio: '#DIV/0!',
    },
    {
      key: '7',
      date: '',
      category: '黔美',
      plannedSales: 0,
      actualSales: 0,
      douyinDisplay: 0,
      nextShowRate: '',
      clicks: 0,
      avgClickCost: '',
      clickRate: '#DIV/0!',
      actualConsultation: 0,
      consultationCost: '#DIV/0!',
      visitingPeople: 0,
      actualRegistration: 0,
      registrationRate: '#DIV/0!',
      registrationCost: '#DIV/0!',
      plannedIncome: 0,
      actualIncome: 0,
      incomeConversionRate: '#DIV/0!',
      roiRatio: '#DIV/0!',
    },
    {
      key: '8',
      date: '',
      category: '邕美',
      plannedSales: 0,
      actualSales: 0,
      douyinDisplay: 0,
      nextShowRate: '#DIV/0!',
      clicks: 0,
      avgClickCost: '#DIV/0!',
      clickRate: '#DIV/0!',
      actualConsultation: 0,
      consultationCost: '#DIV/0!',
      visitingPeople: 0,
      actualRegistration: 0,
      registrationRate: '#DIV/0!',
      registrationCost: '#DIV/0!',
      plannedIncome: 0,
      actualIncome: 0,
      incomeConversionRate: '#DIV/0!',
      roiRatio: '#DIV/0!',
    },
  ], [dateRange])

  // 格式化比率显示
  const formatRate = (text: string | number) => {
    if (text === '0' || text === '0%' || text === undefined || text === null || text === '') {
      return <span style={{ color: '#999' }}>{text || '0'}</span>
    }
    return <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{text}</span>
  }

  // 表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: '3%',
      fixed: 'left' as const,
      render: (text: string, record: DouyinAnalysisData, index: number) => {
        if (text && text.includes('月份')) {
          return {
            children: <span style={{ fontWeight: 'bold' }}>{text}</span>,
            props: { rowSpan: 8 }
          }
        }
        return {
          children: text,
          props: { rowSpan: 0 }
        }
      },
    },
    {
      title: '项目',
      dataIndex: 'category',
      key: 'category',
      width: '3%',
      fixed: 'left' as const,
      render: (text: string) => {
        const isTotal = text === '合计'
        return (
          <span style={{ fontWeight: isTotal ? 'bold' : 'normal', color: isTotal ? '#f5222d' : '#000' }}>
            {text}
          </span>
        )
      },
    },
    // 销售与展示
    {
      title: '抖音计划消费',
      dataIndex: 'plannedSales',
      key: 'plannedSales',
      width: '5.5%',
      render: (text: number | string, record: DouyinAnalysisData) => {
        const isTotal = record.category === '合计'
        return (
          <span style={{ fontWeight: isTotal ? 'bold' : 'normal' }}>
            {Number(text).toFixed(2)}
          </span>
        )
      },
    },
    {
      title: '实际消费',
      dataIndex: 'actualSales',
      key: 'actualSales',
      width: '4.5%',
      render: (text: number | string) => text || 0,
    },
    {
      title: '抖音展示数',
      dataIndex: 'douyinDisplay',
      key: 'douyinDisplay',
      width: '5%',
      render: (text: number | string) => text || 0,
    },
    {
      title: '千次展现费用',
      dataIndex: 'nextShowRate',
      key: 'nextShowRate',
      width: '5.5%',
      render: formatRate,
    },
    // 点击数据
    {
      title: '点击数',
      dataIndex: 'clicks',
      key: 'clicks',
      width: '4%',
      render: (text: number | string) => text || 0,
    },
    {
      title: '平均点击单价',
      dataIndex: 'avgClickCost',
      key: 'avgClickCost',
      width: '5.5%',
      render: formatRate,
    },
    {
      title: '点击率',
      dataIndex: 'clickRate',
      key: 'clickRate',
      width: '4%',
      render: formatRate,
    },
    // 咨询数据
    {
      title: '实际咨询量',
      dataIndex: 'actualConsultation',
      key: 'actualConsultation',
      width: '5%',
      render: (text: number | string) => text || 0,
    },
    {
      title: '咨询量成本',
      dataIndex: 'consultationCost',
      key: 'consultationCost',
      width: '5%',
      render: formatRate,
    },
    {
      title: '上门人数',
      dataIndex: 'visitingPeople',
      key: 'visitingPeople',
      width: '4.5%',
      render: (text: number | string) => text || 0,
    },
    // 报名数据
    {
      title: '实际报名',
      dataIndex: 'actualRegistration',
      key: 'actualRegistration',
      width: '4.5%',
      render: (text: number | string) => text || 0,
    },
    {
      title: '报名转化率',
      dataIndex: 'registrationRate',
      key: 'registrationRate',
      width: '5%',
      render: formatRate,
    },
    {
      title: '实际报名成本',
      dataIndex: 'registrationCost',
      key: 'registrationCost',
      width: '5.5%',
      render: formatRate,
    },
    // 收入数据
    {
      title: '抖音计划收入',
      dataIndex: 'plannedIncome',
      key: 'plannedIncome',
      width: '5.5%',
      render: (text: number | string, record: DouyinAnalysisData) => {
        const isTotal = record.category === '合计'
        return (
          <span style={{ fontWeight: isTotal ? 'bold' : 'normal' }}>
            {Number(text).toFixed(2)}
          </span>
        )
      },
    },
    {
      title: '抖音实际收入',
      dataIndex: 'actualIncome',
      key: 'actualIncome',
      width: '5.5%',
      render: (text: number | string) => text || 0,
    },
    {
      title: '收入完成率',
      dataIndex: 'incomeConversionRate',
      key: 'incomeConversionRate',
      width: '5%',
      render: formatRate,
    },
    {
      title: '投产比',
      dataIndex: 'roiRatio',
      key: 'roiRatio',
      width: '4%',
      render: formatRate,
    },
  ]

  // 处理日期范围变化
  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates)
  }

  // 获取标题信息
  const getTitleText = () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return '市场部 抖音平台数据分析表'
    }
    const startStr = dateRange[0].format('YYYY年MM月DD日')
    const endStr = dateRange[1].format('YYYY年MM月DD日')
    return `市场部 抖音平台 ${startStr}-${endStr}数据分析表`
  }

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Card>
        {/* 标题 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 8px 0', color: '#1890ff', fontSize: '18px', fontWeight: 'bold' }}>
            {getTitleText()}
          </h2>
          <p style={{ margin: '0', color: '#666', fontSize: '12px' }}>
            抖音平台营销数据分析 | 支持按日期范围筛选
          </p>
        </div>

        {/* 筛选区域 */}
        <Card
          type="inner"
          title="日期筛选"
          extra={<FilterOutlined />}
          style={{ marginBottom: '24px' }}
        >
          <Space wrap style={{ width: '100%' }}>
            <div>
              <label style={{ marginRight: '8px', fontWeight: 'bold' }}>日期范围：</label>
              <DatePicker.RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                format="YYYY-MM-DD"
                presets={[
                  { label: '今天', value: [dayjs(), dayjs()] },
                  { label: '本周', value: [dayjs().startOf('week'), dayjs().endOf('week')] },
                  { label: '本月', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
                  { label: '上月', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
                  { label: '最近7天', value: [dayjs().subtract(7, 'day'), dayjs()] },
                  { label: '最近30天', value: [dayjs().subtract(30, 'day'), dayjs()] },
                  { label: '最近90天', value: [dayjs().subtract(90, 'day'), dayjs()] },
                  { label: '1月1-12日', value: [dayjs('2025-01-01'), dayjs('2025-01-12')] },
                ]}
                style={{ minWidth: '300px' }}
              />
            </div>

            <Button
              icon={<CloudDownloadOutlined />}
              onClick={loadPlatformPlan}
              type="default"
            >
              刷新计划数据
            </Button>
          </Space>
        </Card>

        {/* 数据概览 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={8}>
            <Card
              size="small"
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <div style={{ fontSize: '12px', marginBottom: '8px' }}>展示次数</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {analysisData[0]?.douyinDisplay || 0}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              size="small"
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
              }}
            >
              <div style={{ fontSize: '12px', marginBottom: '8px' }}>点击数</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {analysisData[0]?.clicks || 0}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              size="small"
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
              }}
            >
              <div style={{ fontSize: '12px', marginBottom: '8px' }}>实际消费</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {analysisData[0]?.actualSales || 0}
              </div>
            </Card>
          </Col>
        </Row>

        {/* 数据表格 */}
        <Card type="inner" style={{ marginTop: '24px' }}>
          <Table
            columns={columns}
            dataSource={analysisData}
            loading={loading}
            pagination={false}
            bordered
            size="small"
            rowKey="key"
            summary={(pageData) => {
              return (
                <>
                  <Table.Summary.Row style={{ fontWeight: 'bold', background: '#fafafa' }}>
                    <Table.Summary.Cell index={0} align="center" colSpan={2}>
                      <span style={{ color: '#f5222d' }}>小计</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} colSpan={18} />
                  </Table.Summary.Row>
                </>
              )
            }}
          />
        </Card>

        {/* 指标说明 */}
        <Card type="inner" title="抖音数据指标说明" style={{ marginTop: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1890ff' }}>展示与点击</div>
                <ul style={{ marginBottom: '0', paddingLeft: '20px' }}>
                  <li>抖音展示：广告在抖音平台的展示次数</li>
                  <li>下次展现率：下一次展示的概率</li>
                  <li>点击数：用户点击广告的次数</li>
                  <li>平均点击单价：每次点击的平均成本</li>
                  <li>点击率：点击数 / 展示次数 × 100%</li>
                </ul>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1890ff' }}>转化与成本</div>
                <ul style={{ marginBottom: '0', paddingLeft: '20px' }}>
                  <li>实际咨询量：产生的咨询客户数</li>
                  <li>咨询成交本：每个咨询的成本</li>
                  <li>上门人数：到店的客户数</li>
                  <li>实际报名：报名成功的客户数</li>
                  <li>报名转化率：报名人数 / 咨询量 × 100%</li>
                  <li>投产比：收入 / 成本</li>
                </ul>
              </div>
            </Col>
          </Row>
        </Card>
      </Card>
    </div>
  )
}

export default DouyinPlatformAnalysisPage
