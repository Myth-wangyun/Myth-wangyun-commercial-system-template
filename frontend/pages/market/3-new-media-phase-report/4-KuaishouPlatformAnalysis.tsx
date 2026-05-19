import React, { useState, useMemo, useEffect } from 'react'
import { App, Card, DatePicker, Space, Button, Table, Row, Col, InputNumber } from 'antd'
import { FilterOutlined, CloudDownloadOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import axios from 'axios'

interface KuaishouAnalysisData {
  key: string
  date: string
  category: string
  
  // 快手数据
  plannedSales: number | string
  actualSales: number | string
  materialDisplay: number | string
  behaviorClicks: number | string
  coverClicks: number | string
  coverClickRate: string
  materialClickRate: string
  
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

interface KuaishouDailyData {
  campus: string
  actual_consumption: number
  actual_consult_count: number
  visit_count: number
  actual_registration: number
  actual_income: number
  material_display_count: number
  action_count: number
  seal_cover_count: number
  seal_click_count: number
}

const KuaishouPlatformAnalysisPage: React.FC = () => {
  const { message } = App.useApp()
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    dayjs().startOf('month'),
    dayjs().subtract(1, 'day'),
  ])
  const [loading, setLoading] = useState(false)
  const [dailyData, setDailyData] = useState<KuaishouDailyData[]>([])
  
  // 手动输入的计划消费
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

  // 从后端获取快手日度数据
  const fetchKuaishouData = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning('请选择日期范围')
      return
    }

    setLoading(true)
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD')
      const endDate = dateRange[1].format('YYYY-MM-DD')

      // 调用快手平台数据汇总接口
      const response = await axios.get('/api/v1/market/kuaishou-platform-summary', {
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
      console.error('获取快手数据失败:', error)
      message.error('获取数据失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 页面加载时获取数据
  useEffect(() => {
    fetchKuaishouData()
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
          platform: '快手',
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
        
        if (response.data.data.length > 0) {
          message.success(`已加载 ${response.data.data.length} 个神殿的计划数据`)
        }
      }
    } catch (error) {
      console.error('加载计划数据失败:', error)
    }
  }

  // 计算汇总数据
  const analysisData: KuaishouAnalysisData[] = useMemo(() => {
    const campusDataMap: Record<string, KuaishouAnalysisData> = {}
    
    // 初始化各神殿数据
    campusList.forEach(campus => {
      campusDataMap[campus] = {
        key: campus,
        date: '',
        category: campus,
        plannedSales: plannedConsumption[campus] || 0,
        actualSales: 0,
        materialDisplay: 0,
        behaviorClicks: 0,
        coverClicks: 0,
        coverClickRate: '0%',
        materialClickRate: '0%',
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
        campusDataMap[campus].materialDisplay = Number(campusDataMap[campus].materialDisplay) + (item.material_display_count || 0)
        campusDataMap[campus].behaviorClicks = Number(campusDataMap[campus].behaviorClicks) + (item.action_count || 0)
        campusDataMap[campus].coverClicks = Number(campusDataMap[campus].coverClicks) + (item.seal_click_count || 0)
        campusDataMap[campus].actualConsultation = Number(campusDataMap[campus].actualConsultation) + (item.actual_consult_count || 0)
        campusDataMap[campus].visitingPeople = Number(campusDataMap[campus].visitingPeople) + (item.visit_count || 0)
        campusDataMap[campus].actualRegistration = Number(campusDataMap[campus].actualRegistration) + (item.actual_registration || 0)
        campusDataMap[campus].actualIncome = Number(campusDataMap[campus].actualIncome) + (item.actual_income || 0)
      }
    })

    // 计算各神殿的比率
    Object.values(campusDataMap).forEach(data => {
      const actualSales = Number(data.actualSales)
      const materialDisplay = Number(data.materialDisplay)
      const behaviorClicks = Number(data.behaviorClicks)
      const coverClicks = Number(data.coverClicks)
      const actualConsultation = Number(data.actualConsultation)
      const actualRegistration = Number(data.actualRegistration)
      const actualIncome = Number(data.actualIncome)
      const plannedIncomeValue = Number(data.plannedIncome)

      // 封面点击率
      if (materialDisplay > 0) {
        data.coverClickRate = ((coverClicks / materialDisplay) * 100).toFixed(2) + '%'
      } else {
        data.coverClickRate = '0%'
      }

      // 素材点击率
      if (materialDisplay > 0) {
        data.materialClickRate = ((behaviorClicks / materialDisplay) * 100).toFixed(2) + '%'
      } else {
        data.materialClickRate = '0%'
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
    
    const totalData: KuaishouAnalysisData = {
      key: 'total',
      date: getMonthText(),
      category: '合计',
      plannedSales: totalPlannedSales,
      actualSales: 0,
      materialDisplay: 0,
      behaviorClicks: 0,
      coverClicks: 0,
      coverClickRate: '0%',
      materialClickRate: '0%',
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
      totalData.materialDisplay = Number(totalData.materialDisplay) + Number(data.materialDisplay)
      totalData.behaviorClicks = Number(totalData.behaviorClicks) + Number(data.behaviorClicks)
      totalData.coverClicks = Number(totalData.coverClicks) + Number(data.coverClicks)
      totalData.actualConsultation = Number(totalData.actualConsultation) + Number(data.actualConsultation)
      totalData.visitingPeople = Number(totalData.visitingPeople) + Number(data.visitingPeople)
      totalData.actualRegistration = Number(totalData.actualRegistration) + Number(data.actualRegistration)
      totalData.actualIncome = Number(totalData.actualIncome) + Number(data.actualIncome)
    })

    // 计算合计的比率
    const totalActualSales = Number(totalData.actualSales)
    const totalMaterialDisplay = Number(totalData.materialDisplay)
    const totalBehaviorClicks = Number(totalData.behaviorClicks)
    const totalCoverClicks = Number(totalData.coverClicks)
    const totalActualConsultation = Number(totalData.actualConsultation)
    const totalActualRegistration = Number(totalData.actualRegistration)
    const totalActualIncome = Number(totalData.actualIncome)
    const totalPlannedIncomeValue = Number(totalData.plannedIncome)

    // 封面点击率
    if (totalMaterialDisplay > 0) {
      totalData.coverClickRate = ((totalCoverClicks / totalMaterialDisplay) * 100).toFixed(2) + '%'
    } else {
      totalData.coverClickRate = '0%'
    }

    // 素材点击率
    if (totalMaterialDisplay > 0) {
      totalData.materialClickRate = ((totalBehaviorClicks / totalMaterialDisplay) * 100).toFixed(2) + '%'
    } else {
      totalData.materialClickRate = '0%'
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

  // 格式化比率显示
  const formatRate = (text: string | number) => {
    if (text === '0' || text === '0%' || text === undefined || text === null || text === '') {
      return <span style={{ color: '#999' }}>{text || '0'}</span>
    }
    return <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{text}</span>
  }

  // 处理计划消费变化
  const handlePlannedConsumptionChange = (campus: string, value: number | null) => {
    setPlannedConsumption(prev => ({
      ...prev,
      [campus]: value || 0,
    }))
  }

  // 处理计划收入变化
  const handlePlannedIncomeChange = (campus: string, value: number | null) => {
    setPlannedIncome(prev => ({
      ...prev,
      [campus]: value || 0,
    }))
  }

  // 表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: '3%',
      fixed: 'left' as const,
      render: (text: string, record: KuaishouAnalysisData, index: number) => {
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
    // 销售数据
    {
      title: '快手计划消费',
      dataIndex: 'plannedSales',
      key: 'plannedSales',
      width: '5.5%',
      render: (text: number | string, record: KuaishouAnalysisData) => {
        const isTotal = record.category === '合计'
        return (
          <span style={{ fontWeight: isTotal ? 'bold' : 'normal' }}>
            {typeof text === 'number' ? text.toFixed(2) : text || 0}
          </span>
        )
      },
    },
    {
      title: '实际消费',
      dataIndex: 'actualSales',
      key: 'actualSales',
      width: '4.5%',
      render: (text: number | string) => typeof text === 'number' ? text.toFixed(2) : text || 0,
    },
    // 素材与点击数据
    {
      title: '快手素材曝光数',
      dataIndex: 'materialDisplay',
      key: 'materialDisplay',
      width: '6%',
      render: (text: number | string) => text || 0,
    },
    {
      title: '行为点击数',
      dataIndex: 'behaviorClicks',
      key: 'behaviorClicks',
      width: '5%',
      render: (text: number | string) => text || 0,
    },
    {
      title: '封面点击数',
      dataIndex: 'coverClicks',
      key: 'coverClicks',
      width: '5%',
      render: (text: number | string) => text || 0,
    },
    {
      title: '封面点击率',
      dataIndex: 'coverClickRate',
      key: 'coverClickRate',
      width: '5%',
      render: formatRate,
    },
    {
      title: '素材点击率',
      dataIndex: 'materialClickRate',
      key: 'materialClickRate',
      width: '5%',
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
      title: '快手计划收入',
      dataIndex: 'plannedIncome',
      key: 'plannedIncome',
      width: '5.5%',
      render: (text: number | string, record: KuaishouAnalysisData) => {
        const isTotal = record.category === '合计'
        return (
          <span style={{ fontWeight: isTotal ? 'bold' : 'normal' }}>
            {typeof text === 'number' ? text.toFixed(2) : text || 0}
          </span>
        )
      },
    },
    {
      title: '快手实际收入',
      dataIndex: 'actualIncome',
      key: 'actualIncome',
      width: '5.5%',
      render: (text: number | string) => typeof text === 'number' ? text.toFixed(2) : text || 0,
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
      return '市场部 快手平台数据分析表'
    }
    const startStr = dateRange[0].format('YYYY年MM月DD日')
    const endStr = dateRange[1].format('YYYY年MM月DD日')
    return `市场部 快手平台 ${startStr}-${endStr}数据分析表`
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
            快手平台营销数据分析 | 支持按日期范围筛选
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
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: 'white',
              }}
            >
              <div style={{ fontSize: '12px', marginBottom: '8px' }}>素材显示数</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {analysisData.length > 0 ? Number(analysisData[0].materialDisplay).toLocaleString() : 0}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              size="small"
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
                color: 'white',
              }}
            >
              <div style={{ fontSize: '12px', marginBottom: '8px' }}>行为点击数</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {analysisData.length > 0 ? Number(analysisData[0].behaviorClicks).toLocaleString() : 0}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              size="small"
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                color: '#333',
              }}
            >
              <div style={{ fontSize: '12px', marginBottom: '8px' }}>封面点击数</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {analysisData.length > 0 ? Number(analysisData[0].coverClicks).toLocaleString() : 0}
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
        <Card type="inner" title="快手数据指标说明" style={{ marginTop: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1890ff' }}>素材与点击</div>
                <ul style={{ marginBottom: '0', paddingLeft: '20px' }}>
                  <li>快手素材显著数：广告素材在快手平台的展示次数</li>
                  <li>行为点击数：用户通过行为触发的点击次数</li>
                  <li>封面点击数：用户点击广告封面的次数</li>
                  <li>封面点击率：封面点击数 / 素材显著数 × 100%</li>
                  <li>素材点击率：行为点击数 / 素材显著数 × 100%</li>
                </ul>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1890ff' }}>转化与成本</div>
                <ul style={{ marginBottom: '0', paddingLeft: '20px' }}>
                  <li>实际咨询量：产生的咨询客户数</li>
                  <li>咨询量成本：每个咨询的成本</li>
                  <li>上门人数：到店的客户数</li>
                  <li>实际报名：报名成功的客户数</li>
                  <li>报名转化率：报名人数 / 咨询量 × 100%</li>
                  <li>投产比：实际收入 / 成本</li>
                </ul>
              </div>
            </Col>
          </Row>
        </Card>
      </Card>
    </div>
  )
}

export default KuaishouPlatformAnalysisPage
