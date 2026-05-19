import React, { useState, useMemo, useEffect } from 'react'
import { App, Card, DatePicker, Space, Button, Table, Row, Col, Tag } from 'antd'
import { FilterOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import api from '@/services/api'
import { getNewMediaDailySummary } from '@/services/market/newmediaDailySummary'
import type { NewMediaDailySummaryData } from '@/services/market/newmediaDailySummary'

interface SummaryData {
  key: string
  date: string
  category: string
  
  // 新媒体体计划销售
  plannedSales: number | string
  // 实际销售
  actualSales: number | string
  
  // 计划咨询量
  plannedConsultation: number | string
  // 实际咨询量
  actualConsultation: number | string
  
  // 咨询成交率
  consultationConversionRate: string
  // 上门人数
  visitingPeople: number | string
  
  // 新媒体体计划报名
  plannedRegistration: number | string
  // 实际报名
  actualRegistration: number | string
  // 报名转化率
  registrationConversionRate: string
  
  // 新媒体体计划成本
  plannedCost: number | string
  // 新媒体体实际成本
  actualCost: number | string
  
  // 收入
  income: number | string
  // 收入先成率
  incomeConversionRate: string
  // 投产比
  roiRatio: string
}

// 年度网络计划API返回的数据类型
interface NetworkPlanApiRow {
  id: number
  year: string
  month: number // 0=总计, 1-12=月份
  campus: string
  newmedia_plan_cost: number // 新媒体计划消费
  newmedia_plan_consult: number // 新媒体计划咨询量
  newmedia_plan_signup: number // 新媒体计划报名
  newmedia_plan_income: number // 新媒体计划收入
}

const NewMediaSummaryTablePage: React.FC = () => {
  const { message } = App.useApp()
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    dayjs().startOf('month'),
    dayjs().subtract(1, 'day'),
  ])
  const [loading, setLoading] = useState(false)
  const [networkPlanData, setNetworkPlanData] = useState<Map<string, number>>(new Map())
  const [networkPlanConsult, setNetworkPlanConsult] = useState<Map<string, number>>(new Map())
  const [networkPlanSignup, setNetworkPlanSignup] = useState<Map<string, number>>(new Map())
  const [networkPlanIncome, setNetworkPlanIncome] = useState<Map<string, number>>(new Map())
  const [newMediaDailyData, setNewMediaDailyData] = useState<Map<string, NewMediaDailySummaryData>>(new Map())

  // 根据日期范围获取月份显示文本
  const getMonthText = () => {
    if (!dateRange || !dateRange[0]) return '1月份'
    const month = dateRange[0].month() + 1 // dayjs的月份是0-11
    return `${month}月份`
  }

  // 从年度网络计划表获取新媒体计划消费数据
  const loadNetworkPlanData = async () => {
    if (!dateRange || !dateRange[0]) return
    
    try {
      const year = dateRange[0].format('YYYY')
      const startMonth = dateRange[0].month() + 1 // 1-12
      const endMonth = dateRange[1] ? dateRange[1].month() + 1 : startMonth
      
      console.log('加载网络计划数据:', { year, startMonth, endMonth })
      
      // 神殿映射：完整名称 -> 简称
      const campusMapping: Record<string, string> = {
        '河北主神殿': '盛邦',
        '河北永恒殿': '冀美',
        '山西李大殿': '晋美',
        '山西智慧阁': '原美',
        '山西光明殿': '太美',
        '广西神恩殿': '桂美',
        '贵州天威殿': '黔美',
      }
      
      // 获取所有神殿的网络计划数据（使用完整名称）
      const fullCampusList = Object.keys(campusMapping)
      const planDataMap = new Map<string, number>()
      const planConsultMap = new Map<string, number>()
      const planSignupMap = new Map<string, number>()
      const planIncomeMap = new Map<string, number>()
      
      // 为每个神殿获取数据
      for (const fullCampusName of fullCampusList) {
        const shortName = campusMapping[fullCampusName]
        try {
          const res = await api.get('/market/network-plan', { 
            params: { year, campus: fullCampusName } 
          })
          
          const apiData = res.data as NetworkPlanApiRow[]
          
          if (apiData && apiData.length > 0) {
            // 累加选定月份范围内的数据
            let totalCost = 0
            let totalConsult = 0
            let totalSignup = 0
            let totalIncome = 0
            
            apiData.forEach((item) => {
              // 只处理在日期范围内的月份数据（排除总计行 month=0）
              if (item.month >= startMonth && item.month <= endMonth && item.month !== 0) {
                totalCost += (item.newmedia_plan_cost || 0)
                totalConsult += (item.newmedia_plan_consult || 0)
                totalSignup += (item.newmedia_plan_signup || 0)
                totalIncome += (item.newmedia_plan_income || 0)
              }
            })
            
            // 使用简称作为key存储
            planDataMap.set(shortName, totalCost)
            planConsultMap.set(shortName, totalConsult)
            planSignupMap.set(shortName, totalSignup)
            planIncomeMap.set(shortName, totalIncome)
            
            console.log(`${shortName}(${fullCampusName}):`, {
              新媒体计划消费: totalCost,
              新媒体计划咨询量: totalConsult,
              新媒体计划报名: totalSignup,
              新媒体计划收入: totalIncome
            })
          }
        } catch (err) {
          console.error(`获取${fullCampusName}网络计划数据失败:`, err)
        }
      }
      
      // 计算总计
      let totalCostSum = 0
      let totalConsultSum = 0
      let totalSignupSum = 0
      let totalIncomeSum = 0
      
      planDataMap.forEach((value) => {
        totalCostSum += value
      })
      planConsultMap.forEach((value) => {
        totalConsultSum += value
      })
      planSignupMap.forEach((value) => {
        totalSignupSum += value
      })
      planIncomeMap.forEach((value) => {
        totalIncomeSum += value
      })
      
      planDataMap.set('合计', totalCostSum)
      planConsultMap.set('合计', totalConsultSum)
      planSignupMap.set('合计', totalSignupSum)
      planIncomeMap.set('合计', totalIncomeSum)
      
      console.log('合计:', {
        新媒体计划消费: totalCostSum,
        新媒体计划咨询量: totalConsultSum,
        新媒体计划报名: totalSignupSum,
        新媒体计划收入: totalIncomeSum
      })
      
      setNetworkPlanData(planDataMap)
      setNetworkPlanConsult(planConsultMap)
      setNetworkPlanSignup(planSignupMap)
      setNetworkPlanIncome(planIncomeMap)
    } catch (err: any) {
      console.error('加载年度网络计划数据失败:', err)
      message.error(err?.message || '加载年度网络计划数据失败')
      setNetworkPlanData(new Map())
      setNetworkPlanConsult(new Map())
      setNetworkPlanSignup(new Map())
      setNetworkPlanIncome(new Map())
    }
  }

  // 从新媒体日度数据表获取实际数据
  const loadNewMediaDailyData = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return
    
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD')
      const endDate = dateRange[1].format('YYYY-MM-DD')
      
      const response = await getNewMediaDailySummary(startDate, endDate)
      
      if (response.success && response.data) {
        const dailyDataMap = new Map<string, NewMediaDailySummaryData>()
        
        response.data.forEach((item) => {
          dailyDataMap.set(item.campus, item)
        })
        
        setNewMediaDailyData(dailyDataMap)
      } else {
        message.error(response.error || '加载新媒体日度数据失败')
        setNewMediaDailyData(new Map())
      }
    } catch (err: any) {
      console.error('加载新媒体日度数据失败:', err)
      message.error(err?.message || '加载新媒体日度数据失败')
      setNewMediaDailyData(new Map())
    }
  }

  // 当日期范围变化时，重新加载数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        await Promise.all([
          loadNetworkPlanData(),
          loadNewMediaDailyData(),
        ])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [dateRange])

  // 示例数据 - 根据表格显示的数据结构
  const mockSummaryData: SummaryData[] = useMemo(() => {
    // 神殿列表
    const campusList = ['盛邦', '冀美', '晋美', '原美', '桂美', '黔美', '邕美']
    
    // 获取神殿的新媒体日度数据
    const getCampusData = (campus: string) => {
      const dailyData = newMediaDailyData.get(campus)
      const planCost = networkPlanData.get(campus) || 0
      const planConsult = networkPlanConsult.get(campus) || 0
      const planSignup = networkPlanSignup.get(campus) || 0
      const planIncome = networkPlanIncome.get(campus) || 0
      
      // 实际消费
      const actualConsumption = dailyData?.actual_consumption || 0
      // 实际咨询量
      const actualConsultCount = dailyData?.actual_consult_count || 0
      // 上门人数
      const visitCount = dailyData?.visit_count || 0
      // 实际报名
      const actualRegistration = dailyData?.actual_registration || 0
      // 实际收入
      const actualIncome = dailyData?.actual_income || 0
      
      // 计算咨询量成本 = 实际消费 / 实际咨询量
      const consultCost = actualConsultCount > 0 
        ? (actualConsumption / actualConsultCount).toFixed(2) 
        : '0'
      
      // 计算报名转化率 = 实际报名 / 实际咨询量 × 100%
      const registrationRate = actualConsultCount > 0
        ? ((actualRegistration / actualConsultCount) * 100).toFixed(2) + '%'
        : '0%'
      
      // 计算实际报名成本 = 实际消费 / 实际报名
      const registrationCost = actualRegistration > 0
        ? (actualConsumption / actualRegistration).toFixed(2)
        : '0'
      
      // 计算收入完成率 = 实际收入 / 新媒体计划收入 × 100%
      const incomeRate = planIncome > 0
        ? ((actualIncome / planIncome) * 100).toFixed(2) + '%'
        : '0%'
      
      // 计算投产比 = 实际收入 / 实际消费
      const roi = actualConsumption > 0
        ? (actualIncome / actualConsumption).toFixed(2)
        : '0'
      
      return {
        plannedSales: planCost,
        actualSales: actualConsumption,
        plannedConsultation: planConsult, // 从网络计划表获取
        actualConsultation: actualConsultCount,
        consultationConversionRate: consultCost,
        visitingPeople: visitCount,
        plannedRegistration: planSignup, // 从网络计划表获取
        actualRegistration: actualRegistration,
        registrationConversionRate: registrationRate,
        plannedCost: registrationCost,
        actualCost: planIncome, // 新媒体计划收入
        income: actualIncome,
        incomeConversionRate: incomeRate,
        roiRatio: roi,
      }
    }
    
    // 构建各神殿数据
    const campusDataList = campusList.map((campus, index) => {
      const data = getCampusData(campus)
      return {
        key: String(index + 2),
        date: '',
        category: campus,
        ...data,
      }
    })
    
    // 计算合计行
    const totalData = getCampusData('合计')
    
    return [
      {
        key: '1',
        date: getMonthText(),
        category: '合计',
        ...totalData,
      },
      ...campusDataList,
    ]
  }, [dateRange, networkPlanData, networkPlanConsult, networkPlanSignup, networkPlanIncome, newMediaDailyData])

  // 表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 70,
      fixed: 'left' as const,
      render: (text: string, record: SummaryData, index: number) => {
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
    // 销售数据组
    {
      title: '新媒体计划消费',
      dataIndex: 'plannedSales',
      key: 'plannedSales',
      width: 110,
      render: (text: number | string) => text || 0,
    },
    {
      title: '实际消费',
      dataIndex: 'actualSales',
      key: 'actualSales',
      width: 85,
      render: (text: number | string) => text || 0,
    },
    // 咨询数据组
    {
      title: '计划咨询量',
      dataIndex: 'plannedConsultation',
      key: 'plannedConsultation',
      width: 95,
      render: (text: number | string) => text || 0,
    },
    {
      title: '实际咨询量',
      dataIndex: 'actualConsultation',
      key: 'actualConsultation',
      width: 95,
      render: (text: number | string) => text || 0,
    },
    {
      title: '咨询量成本',
      dataIndex: 'consultationConversionRate',
      key: 'consultationConversionRate',
      width: 95,
      render: (text: string) => (
        <span style={{ color: text === '0' ? '#999' : '#1890ff', fontWeight: 'bold' }}>
          {text}
        </span>
      ),
    },
    {
      title: '上门人数',
      dataIndex: 'visitingPeople',
      key: 'visitingPeople',
      width: 85,
      render: (text: number | string) => text || 0,
    },
    // 报名数据组
    {
      title: '新媒体计划报名',
      dataIndex: 'plannedRegistration',
      key: 'plannedRegistration',
      width: 110,
      render: (text: number | string) => text,
    },
    {
      title: '实际报名',
      dataIndex: 'actualRegistration',
      key: 'actualRegistration',
      width: 85,
      render: (text: number | string) => text || 0,
    },
    {
      title: '报名转化率',
      dataIndex: 'registrationConversionRate',
      key: 'registrationConversionRate',
      width: 95,
      render: (text: string) => (
        <span style={{ color: text === '0%' ? '#999' : '#1890ff', fontWeight: 'bold' }}>
          {text}
        </span>
      ),
    },
    // 成本数据组
    {
      title: '实际报名成本',
      dataIndex: 'plannedCost',
      key: 'plannedCost',
      width: 120,
      render: (text: number | string) => text || 0,
    },
    {
      title: '新媒体计划收入',
      dataIndex: 'actualCost',
      key: 'actualCost',
      width: 120,
      render: (text: number | string) => text || 0,
    },
    // 收入与投产比数据组
    {
      title: '新媒体实际收入',
      dataIndex: 'income',
      key: 'income',
      width: 85,
      render: (text: number | string) => text || 0,
    },
    {
      title: '收入完成率',
      dataIndex: 'incomeConversionRate',
      key: 'incomeConversionRate',
      width: 95,
      render: (text: string) => (
        <span style={{ color: text === '0%' ? '#999' : '#52c41a', fontWeight: 'bold' }}>
          {text}
        </span>
      ),
    },
    {
      title: '投产比',
      dataIndex: 'roiRatio',
      key: 'roiRatio',
      width: 85,
      render: (text: string) => (
        <span style={{ color: text === '0' ? '#999' : '#ff7a45', fontWeight: 'bold' }}>
          {text}
        </span>
      ),
    },
  ]

  // 处理日期范围变化
  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates)
  }

  // 获取标题信息
  const getTitleText = () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return '市场部 新媒体整体数据汇总表'
    }
    const startStr = dateRange[0].format('YYYY年MM月DD日')
    const endStr = dateRange[1].format('YYYY年MM月DD日')
    return `市场部 新媒体${startStr}-${endStr}整体数据汇总表`
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
            003市场部-新媒体阶段业务汇报表 | 整体数据汇总 | 按日期范围筛选
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
                ]}
                style={{ minWidth: '300px' }}
              />
            </div>

          </Space>
        </Card>

        {/* 数据表格 */}
        <Card type="inner" style={{ marginTop: '24px' }}>
          <Table
            columns={columns}
            dataSource={mockSummaryData}
            pagination={false}
            bordered
            size="small"
            rowKey="key"
            loading={loading}
            summary={(pageData) => {
              // 计算合计行
              const totalPlannedSales = pageData.reduce((sum, item) => sum + (typeof item.plannedSales === 'number' ? item.plannedSales : 0), 0)
              const totalActualSales = pageData.reduce((sum, item) => sum + (typeof item.actualSales === 'number' ? item.actualSales : 0), 0)
              const totalIncome = pageData.reduce((sum, item) => sum + (typeof item.income === 'number' ? item.income : 0), 0)

              return (
                <>
                  <Table.Summary.Row style={{ fontWeight: 'bold', background: '#fafafa' }}>
                    <Table.Summary.Cell index={0} align="center" colSpan={2}>
                      <span style={{ color: '#f5222d' }}>小计</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="center">{totalPlannedSales}</Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="center">{totalActualSales}</Table.Summary.Cell>
                    <Table.Summary.Cell index={3} colSpan={11} />
                    <Table.Summary.Cell index={4} align="center">{totalIncome}</Table.Summary.Cell>
                    <Table.Summary.Cell index={5} colSpan={2} />
                  </Table.Summary.Row>
                </>
              )
            }}
          />
        </Card>

        {/* 指标说明 */}
        <Card type="inner" title="指标说明" style={{ marginTop: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1890ff' }}>销售与咨询指标</div>
                <ul style={{ marginBottom: '0', paddingLeft: '20px' }}>
                  <li>新媒体计划消费：从年度网络计划表获取的计划投入成本</li>
                  <li>实际消费：从新媒体日度数据汇总的实际花费</li>
                  <li>计划咨询量：从年度网络计划表获取的新媒体计划咨询量</li>
                  <li>实际咨询量：从新媒体日度数据汇总的实际咨询量</li>
                  <li>咨询量成本：实际消费 / 实际咨询量</li>
                  <li>上门人数：从新媒体日度数据汇总的实际到店人数</li>
                </ul>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1890ff' }}>报名与成本指标</div>
                <ul style={{ marginBottom: '0', paddingLeft: '20px' }}>
                  <li>新媒体计划报名：从年度网络计划表获取的新媒体计划报名数</li>
                  <li>实际报名：从新媒体日度数据汇总的净报名数</li>
                  <li>报名转化率：实际报名 / 实际咨询量 × 100%</li>
                  <li>实际报名成本：实际消费 / 实际报名</li>
                  <li>新媒体计划收入：从年度网络计划表获取的新媒体计划收入</li>
                  <li>新媒体实际收入：从新媒体日度数据汇总的实际收入</li>
                  <li>收入完成率：新媒体实际收入 / 新媒体计划收入 × 100%</li>
                  <li>投产比：实际收入 / 实际消费</li>
                </ul>
              </div>
            </Col>
          </Row>
          <div style={{ marginTop: '16px', padding: '12px', background: '#e6f7ff', borderRadius: '4px', border: '1px solid #91d5ff' }}>
            <div style={{ fontSize: '12px', color: '#0050b3' }}>
              <strong>📌 数据来源说明：</strong>
              <div style={{ marginTop: '4px' }}>
                • <strong>新媒体计划消费、计划咨询量、新媒体计划报名、新媒体计划收入</strong>：自动从<strong>市场部年度网络计划表</strong>中获取，根据选择的日期范围自动汇总对应月份的计划数据。
              </div>
              <div style={{ marginTop: '4px' }}>
                • <strong>实际消费、实际咨询量、上门人数、实际报名、实际收入</strong>：自动从<strong>市场部新媒体日度数据表</strong>（包括抖音、快手、小红书、视频号、B站）中汇总获取。
              </div>
            </div>
          </div>
        </Card>
      </Card>
    </div>
  )
}

export default NewMediaSummaryTablePage
