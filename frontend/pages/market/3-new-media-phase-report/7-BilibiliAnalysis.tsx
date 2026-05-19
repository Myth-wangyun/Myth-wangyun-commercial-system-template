import React, { useState, useMemo, useEffect } from 'react'
import { App, Card, DatePicker, Space, Button, Table, Row, Col } from 'antd'
import { FilterOutlined, CloudDownloadOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { bilibiliDailyDataService } from '@/services/market/marketBilibiliDailyData'
import axios from 'axios'

interface BilibiliAnalysisData {
  key: string
  date: string
  category: string
  
  // B站数据
  plannedSales: number | string
  actualSales: number | string
  impressions: number | string
  cpm: string
  clicks: number | string
  clickRate: string
  avgClickPrice: string
  
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
  performanceRate: string
  roiRatio: string
}

const BilibiliAnalysisPage: React.FC = () => {
  const { message } = App.useApp()
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    dayjs().startOf('month'),
    dayjs().subtract(1, 'day'),
  ])
  const [loading, setLoading] = useState(false)
  const [analysisData, setAnalysisData] = useState<BilibiliAnalysisData[]>([])
  const [editableData, setEditableData] = useState<Record<string, { plannedSales?: number; plannedIncome?: number }>>({})

  // 神殿映射：显示名称 -> 数据库名称
  const campusMapping: Record<string, string> = {
    '盛邦': '河北主神殿',
    '冀美': '河北永恒殿',
    '晋美': '山西李大殿',
    '原美': '山西智慧阁',
    '桂美': '广西神恩殿',
    '黔美': '贵州天威殿',
    '邕美': '广西邕美神殿',
  }

  // 神殿列表（显示名称）
  const campusList = ['盛邦', '冀美', '晋美', '原美', '桂美', '黔美', '邕美']

  // 根据日期范围获取月份显示文本
  const getMonthText = () => {
    if (!dateRange || !dateRange[0]) return '1月份'
    const month = dateRange[0].month() + 1
    return `${month}月份`
  }

  // 加载数据
  const loadData = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return
    }

    setLoading(true)
    try {
      const start = dateRange[0]
      const end = dateRange[1]
      
      // 获取需要加载的所有月份
      const months: string[] = []
      let current = start.startOf('month')
      while (current.isBefore(end, 'month') || current.isSame(end, 'month')) {
        months.push(current.format('YYYY-MM'))
        current = current.add(1, 'month')
      }

      // 为每个神殿加载数据
      const dataPromises = campusList.map(async (campusDisplayName) => {
        const campusDbName = campusMapping[campusDisplayName]
        try {
          // 加载所有月份的数据
          const allItems: any[] = []
          for (const month of months) {
            const response = await bilibiliDailyDataService.list(campusDbName, month)
            const items = response.data?.items || (response as any).items || []
            allItems.push(...items)
          }
          
          // 过滤日期范围内的数据
          const filteredItems = allItems.filter(item => {
            const itemDate = dayjs(item.date)
            return (itemDate.isAfter(start, 'day') || itemDate.isSame(start, 'day')) && 
                   (itemDate.isBefore(end, 'day') || itemDate.isSame(end, 'day'))
          })

          // 聚合数据
          const aggregated = filteredItems.reduce((acc, item) => ({
            actualSales: acc.actualSales + (parseFloat(item.consumption as any) || 0),
            impressions: acc.impressions + (parseFloat(item.display_count as any) || 0),
            clicks: acc.clicks + (parseFloat(item.click_count as any) || 0),
            actualConsultation: acc.actualConsultation + (parseFloat(item.effective_consult_count as any) || 0),
            visitingPeople: acc.visitingPeople + (parseFloat(item.visit_count as any) || 0),
            actualRegistration: acc.actualRegistration + (parseFloat(item.net_signup as any) || 0),
            actualIncome: acc.actualIncome + (parseFloat(item.actual_income as any) || 0),
          }), {
            actualSales: 0,
            impressions: 0,
            clicks: 0,
            actualConsultation: 0,
            visitingPeople: 0,
            actualRegistration: 0,
            actualIncome: 0,
          })

          return {
            campus: campusDisplayName,
            ...aggregated,
          }
        } catch (error) {
          console.error(`加载${campusDisplayName}数据失败:`, error)
          return {
            campus: campusDisplayName,
            actualSales: 0,
            impressions: 0,
            clicks: 0,
            actualConsultation: 0,
            visitingPeople: 0,
            actualRegistration: 0,
            actualIncome: 0,
          }
        }
      })

      const campusData = await Promise.all(dataPromises)

      // 计算总计
      const total = campusData.reduce((acc, item) => ({
        actualSales: acc.actualSales + item.actualSales,
        impressions: acc.impressions + item.impressions,
        clicks: acc.clicks + item.clicks,
        actualConsultation: acc.actualConsultation + item.actualConsultation,
        visitingPeople: acc.visitingPeople + item.visitingPeople,
        actualRegistration: acc.actualRegistration + item.actualRegistration,
        actualIncome: acc.actualIncome + item.actualIncome,
      }), {
        actualSales: 0,
        impressions: 0,
        clicks: 0,
        actualConsultation: 0,
        visitingPeople: 0,
        actualRegistration: 0,
        actualIncome: 0,
      })

      // 计算合计的计划消费和计划收入（自动汇总各神殿）
      const totalPlannedSales = campusList.reduce((sum, campus) => {
        const campusKey = `campus_${campusList.indexOf(campus)}`
        return sum + ((editableData[campusKey]?.plannedSales) || 0)
      }, 0)
      
      const totalPlannedIncome = campusList.reduce((sum, campus) => {
        const campusKey = `campus_${campusList.indexOf(campus)}`
        return sum + ((editableData[campusKey]?.plannedIncome) || 0)
      }, 0)

      // 构建表格数据
      const formatData = (data: any, campus: string, key: string): BilibiliAnalysisData => {
        const editable = editableData[key] || {}
        // 如果是合计行，使用汇总值
        const plannedSales = key === 'total' ? totalPlannedSales : (editable.plannedSales ?? 0)
        const plannedIncome = key === 'total' ? totalPlannedIncome : (editable.plannedIncome ?? 0)
        
        const cpm = data.impressions > 0
          ? ((data.actualSales / data.impressions) * 1000).toFixed(2)
          : '0'
        
        const clickRate = data.impressions > 0 
          ? ((data.clicks / data.impressions) * 100).toFixed(2) + '%'
          : '0%'
        
        const avgClickPrice = data.clicks > 0
          ? (data.actualSales / data.clicks).toFixed(2)
          : '0'
        
        const consultationCost = data.actualConsultation > 0
          ? (data.actualSales / data.actualConsultation).toFixed(2)
          : '0'
        
        const registrationRate = data.actualConsultation > 0
          ? ((data.actualRegistration / data.actualConsultation) * 100).toFixed(2) + '%'
          : '0%'
        
        const registrationCost = data.actualRegistration > 0
          ? (data.actualSales / data.actualRegistration).toFixed(2)
          : '0'
        
        const performanceRate = plannedIncome > 0
          ? ((data.actualIncome / plannedIncome) * 100).toFixed(2) + '%'
          : '0%'
        
        const roiRatio = data.actualSales > 0
          ? (data.actualIncome / data.actualSales).toFixed(2)
          : '0'

        return {
          key,
          date: key === 'total' ? getMonthText() : '',
          category: campus,
          plannedSales,
          actualSales: data.actualSales,
          impressions: data.impressions,
          cpm,
          clicks: data.clicks,
          clickRate,
          avgClickPrice,
          actualConsultation: data.actualConsultation,
          consultationCost,
          visitingPeople: data.visitingPeople,
          actualRegistration: data.actualRegistration,
          registrationRate,
          registrationCost,
          plannedIncome,
          actualIncome: data.actualIncome,
          performanceRate,
          roiRatio,
        }
      }

      const tableData = [
        formatData(total, '合计', 'total'),
        ...campusData.map((item, index) => 
          formatData(item, item.campus, `campus_${index}`)
        ),
      ]

      setAnalysisData(tableData)
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 监听日期变化,重新加载数据
  useEffect(() => {
    loadData()
  }, [dateRange, editableData])

  // 页面首次加载时加载计划数据
  useEffect(() => {
    loadPlatformPlan()
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
          platform: 'B站',
          year: year.toString(),
          month,
        },
      })

      if (response.data.success && response.data.data.length > 0) {
        const newEditableData: Record<string, { plannedSales?: number; plannedIncome?: number }> = {}

        response.data.data.forEach((item: any) => {
          // 使用神殿简称匹配
          const campusKey = item.campus_short || item.campus
          const campusIndex = campusList.indexOf(campusKey)
          if (campusIndex !== -1) {
            const key = `campus_${campusIndex}`
            newEditableData[key] = {
              plannedSales: item.plan_cost || 0,
              plannedIncome: item.plan_income || 0,
            }
          }
        })

        setEditableData(newEditableData)
        
        if (response.data.data.length > 0) {
          message.success(`已加载 ${response.data.data.length} 个神殿的计划数据`)
        }
      }
    } catch (error) {
      console.error('加载计划数据失败:', error)
    }
  }

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
      width: 70,
      fixed: 'left' as const,
      render: (text: string, record: BilibiliAnalysisData, index: number) => {
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
      width: 70,
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
      title: 'B站计划消费',
      dataIndex: 'plannedSales',
      key: 'plannedSales',
      width: 110,
      render: (text: number, record: BilibiliAnalysisData) => {
        const isTotal = record.category === '合计'
        return (
          <span style={{ fontWeight: isTotal ? 'bold' : 'normal' }}>
            {Number(text || 0).toFixed(2)}
          </span>
        )
      },
    },
    {
      title: '实际消费',
      dataIndex: 'actualSales',
      key: 'actualSales',
      width: 85,
      render: (text: number | string) => text || 0,
    },
    // 展现与点击数据
    {
      title: '展现量',
      dataIndex: 'impressions',
      key: 'impressions',
      width: 75,
      render: (text: number | string) => text || 0,
    },
    {
      title: '千次展示价格',
      dataIndex: 'cpm',
      key: 'cpm',
      width: 110,
      render: formatRate,
    },
    {
      title: '点击量',
      dataIndex: 'clicks',
      key: 'clicks',
      width: 75,
      render: (text: number | string) => text || 0,
    },
    {
      title: '点击率',
      dataIndex: 'clickRate',
      key: 'clickRate',
      width: 75,
      render: formatRate,
    },
    {
      title: '单次点击价格',
      dataIndex: 'avgClickPrice',
      key: 'avgClickPrice',
      width: 110,
      render: formatRate,
    },
    // 咨询数据
    {
      title: '实际咨询量',
      dataIndex: 'actualConsultation',
      key: 'actualConsultation',
      width: 95,
      render: (text: number | string) => text || 0,
    },
    {
      title: '咨询量成本',
      dataIndex: 'consultationCost',
      key: 'consultationCost',
      width: 95,
      render: formatRate,
    },
    {
      title: '上门人数',
      dataIndex: 'visitingPeople',
      key: 'visitingPeople',
      width: 85,
      render: (text: number | string) => text || 0,
    },
    // 报名数据
    {
      title: '实际报名',
      dataIndex: 'actualRegistration',
      key: 'actualRegistration',
      width: 85,
      render: (text: number | string) => text || 0,
    },
    {
      title: '报名转化率',
      dataIndex: 'registrationRate',
      key: 'registrationRate',
      width: 95,
      render: formatRate,
    },
    {
      title: '实际报名成本',
      dataIndex: 'registrationCost',
      key: 'registrationCost',
      width: 110,
      render: formatRate,
    },
    // 收入数据
    {
      title: 'B站计划收入',
      dataIndex: 'plannedIncome',
      key: 'plannedIncome',
      width: 120,
      render: (text: number, record: BilibiliAnalysisData) => {
        const isTotal = record.category === '合计'
        return (
          <span style={{ fontWeight: isTotal ? 'bold' : 'normal' }}>
            {Number(text || 0).toFixed(2)}
          </span>
        )
      },
    },
    {
      title: 'B站实际收入',
      dataIndex: 'actualIncome',
      key: 'actualIncome',
      width: 120,
      render: (text: number | string) => text || 0,
    },
    {
      title: '业绩完成率',
      dataIndex: 'performanceRate',
      key: 'performanceRate',
      width: 95,
      render: formatRate,
    },
    {
      title: '投产比',
      dataIndex: 'roiRatio',
      key: 'roiRatio',
      width: 75,
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
      return '市场部 B站平台数据分析表'
    }
    const startStr = dateRange[0].format('YYYY年MM月DD日')
    const endStr = dateRange[1].format('YYYY年MM月DD日')
    return `市场部 B站平台 ${startStr}-${endStr}数据分析表`
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
            B站平台营销数据分析 | 支持按日期范围筛选
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
          <Col xs={24} sm={6}>
            <Card
              size="small"
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
                color: 'white',
              }}
            >
              <div style={{ fontSize: '12px', marginBottom: '8px' }}>展现量</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>0</div>
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card
              size="small"
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)',
                color: 'white',
              }}
            >
              <div style={{ fontSize: '12px', marginBottom: '8px' }}>点击量</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>0</div>
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card
              size="small"
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
                color: '#333',
              }}
            >
              <div style={{ fontSize: '12px', marginBottom: '8px' }}>实际咨询量</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>0</div>
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card
              size="small"
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
                color: 'white',
              }}
            >
              <div style={{ fontSize: '12px', marginBottom: '8px' }}>实际销售</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>0</div>
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
        <Card type="inner" title="B站数据指标说明" style={{ marginTop: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1890ff' }}>展现与点击</div>
                <ul style={{ marginBottom: '0', paddingLeft: '20px' }}>
                  <li>展现量：广告在B站平台的展示次数</li>
                  <li>千次展示价（CPM）：每千次展现的成本</li>
                  <li>点击量：用户点击广告的次数</li>
                  <li>点击率：点击量 / 展现量 × 100%</li>
                  <li>单次点击单价：每次点击的平均成本</li>
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
                  <li>业绩成交率：实际收入 / 计划收入 × 100%</li>
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

export default BilibiliAnalysisPage
