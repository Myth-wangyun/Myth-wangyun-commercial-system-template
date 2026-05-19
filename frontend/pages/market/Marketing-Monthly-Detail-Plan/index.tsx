import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { App, Button, Card, DatePicker, InputNumber, Space, Table, Tabs, Typography } from 'antd'
import { FileTextOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '@/services/api'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'

const { Title } = Typography

const getCurrentYear = () => dayjs().format('YYYY')

interface MonthlyDetailPlanRow {
  id: string | number
  month: string
  category: string
  subcategory: string
  plan_income: number | null
  plan_signup: number | null
  plan_consult: number | null
  plan_cost: number | null
  isTotal?: boolean    // 是否是合计行
  isPlanRow?: boolean  // 是否是计划行（从年度网络计划读取）
  isEditable?: boolean // 是否可编辑
}

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const CATEGORIES: Record<string, string[]> = {
  '新媒体': ['抖音', '快手', 'B站', '小红书', '微信视频号'],
  'SEM': ['百度推广', '神殿网站/直接访问', 'GEO'],
  '网络合作伙伴': ['百教网', '知了好学', '坦途网', '厚学网', '91搜客'],
  '口碑': ['口碑'],
  '免费推广': ['免费推广']
}

const CATEGORIES_WITH_YEAR_PLAN = ['新媒体', 'SEM']
const CATEGORIES_WITH_TOTAL = ['新媒体', 'SEM', '网络合作伙伴']

const MarketingMonthlyDetailPlanPage: React.FC = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [year, setYear] = useState<string>(getCurrentYear())
  const [data, setData] = useState<MonthlyDetailPlanRow[]>([])
  const [activeTab, setActiveTab] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<number>(dayjs().month() + 1)
  const [yearPlanData, setYearPlanData] = useState<any>(null)

  const { getAllCampuses, loadCampusesFromConfig } = useCampusStore()
  
  // 获取排序后的神殿列表 - 使用 useMemo 避免无限循环
  const campuses = useMemo(() => getAllCampuses(), [getAllCampuses])

  useEffect(() => {
    loadCampusesFromConfig()
  }, [loadCampusesFromConfig])

  useEffect(() => {
    if (campuses.length > 0 && !activeTab) {
      setActiveTab(campuses[0].name)
    }
  }, [campuses, activeTab])

  const tabItems = useMemo(() => {
    return campuses.map((campus) => ({
      key: campus.name,
      label: campus.name,
    }))
  }, [campuses])

  const generateEmptyData = (): MonthlyDetailPlanRow[] => {
    const rows: MonthlyDetailPlanRow[] = []
    Object.entries(CATEGORIES).forEach(([category, subcategories]) => {
      subcategories.forEach((subcategory) => {
        rows.push({
          id: `${category}-${subcategory}`,
          month: MONTH_LABELS[selectedMonth - 1],
          category,
          subcategory,
          plan_income: null,
          plan_signup: null,
          plan_consult: null,
          plan_cost: null,
          isTotal: false,
          isPlanRow: false,
          isEditable: true,
        })
      })
      // 为新媒体和SEM分类添加合计行和计划行
      if (CATEGORIES_WITH_YEAR_PLAN.includes(category)) {
        // 合计行（月度详细计划的合计）
        rows.push({
          id: `${category}-合计`,
          month: MONTH_LABELS[selectedMonth - 1],
          category,
          subcategory: '合计',
          plan_income: null,
          plan_signup: null,
          plan_consult: null,
          plan_cost: null,
          isTotal: true,
          isPlanRow: false,
          isEditable: false,
        })
        // 计划行（从年度网络计划读取）
        rows.push({
          id: `${category}-月度计划`,
          month: MONTH_LABELS[selectedMonth - 1],
          category,
          subcategory: '月度计划',
          plan_income: null,
          plan_signup: null,
          plan_consult: null,
          plan_cost: null,
          isTotal: false,
          isPlanRow: true,
          isEditable: false,
        })
      }
      // 为网络合作伙伴添加合计行（不需要计划行）
      else if (CATEGORIES_WITH_TOTAL.includes(category) && !CATEGORIES_WITH_YEAR_PLAN.includes(category)) {
        rows.push({
          id: `${category}-合计`,
          month: MONTH_LABELS[selectedMonth - 1],
          category,
          subcategory: '合计',
          plan_income: null,
          plan_signup: null,
          plan_consult: null,
          plan_cost: null,
          isTotal: true,
          isPlanRow: false,
          isEditable: false,
        })
      }
    })
    return rows
  }

  const loadNewmediaMonthlyData = useCallback(async (selectedYear: string, campus: string, month: number) => {
    try {
      const res = await api.get('/market/monthly-plan/newmedia/list', {
        params: { year: selectedYear, campus, month }
      })
      if (res.data?.code === 0 && res.data?.data) {
        return res.data.data[month] || {}
      }
      return {}
    } catch (err: any) {
      console.error('加载新媒体月度计划失败:', err)
      return {}
    }
  }, [])

  const loadSemMonthlyData = useCallback(async (selectedYear: string, campus: string, month: number) => {
    try {
      const res = await api.get('/market/monthly-plan/sem/list', {
        params: { year: selectedYear, campus, month }
      })
      if (res.data?.code === 0 && res.data?.data) {
        return res.data.data[month] || {}
      }
      return {}
    } catch (err: any) {
      console.error('加载SEM月度计划失败:', err)
      return {}
    }
  }, [])

  const loadPartnerMonthlyData = useCallback(async (selectedYear: string, campus: string, month: number) => {
    try {
      const res = await api.get('/market/monthly-plan/network-partner/detail/list', {
        params: { year: selectedYear, campus }
      })
      if (res.data?.code === 0 && res.data?.data) {
        return res.data.data[month] || {}
      }
      return {}
    } catch (err: any) {
      console.error('加载网络合作伙伴月度计划失败:', err)
      return {}
    }
  }, [])

  const loadReputationMonthlyData = useCallback(async (selectedYear: string, campus: string, month: number) => {
    try {
      const res = await api.get('/market/monthly-plan/reputation/list', {
        params: { year: selectedYear, campus }
      })
      if (res.data?.code === 0 && res.data?.data) {
        return res.data.data[month] || null
      }
      return null
    } catch (err: any) {
      console.error('加载口碑月度计划失败:', err)
      return null
    }
  }, [])

  const loadFreePromotionMonthlyData = useCallback(async (selectedYear: string, campus: string, month: number) => {
    try {
      const res = await api.get('/market/monthly-plan/free-promotion/list', {
        params: { year: selectedYear, campus }
      })
      if (res.data?.code === 0 && res.data?.data) {
        return res.data.data[month] || null
      }
      return null
    } catch (err: any) {
      console.error('加载免费推广月度计划失败:', err)
      return null
    }
  }, [])

  const loadData = useCallback(async (selectedYear: string, campus: string, month: number) => {
    if (!selectedYear || !campus) return
    setLoading(true)
    try {
      const [yearPlanRes, newmediaData, semData, partnerData, reputationData, freePromotionData] = await Promise.all([
        api.get('/market/network-plan', { params: { year: selectedYear, campus } }).catch(() => ({ data: [] })),
        loadNewmediaMonthlyData(selectedYear, campus, month),
        loadSemMonthlyData(selectedYear, campus, month),
        loadPartnerMonthlyData(selectedYear, campus, month),
        loadReputationMonthlyData(selectedYear, campus, month),
        loadFreePromotionMonthlyData(selectedYear, campus, month),
      ])

      const yearPlanApiData = yearPlanRes.data as any[]
      if (yearPlanApiData && yearPlanApiData.length > 0) {
        setYearPlanData(yearPlanApiData)
      } else {
        setYearPlanData(null)
      }

      const newData = generateEmptyData()

      if (newmediaData && Object.keys(newmediaData).length > 0) {
        CATEGORIES['新媒体'].forEach((subcategory) => {
          const rowIndex = newData.findIndex(row => row.category === '新媒体' && row.subcategory === subcategory)
          if (rowIndex !== -1) {
            const platformInfo = newmediaData[subcategory]
            if (platformInfo) {
              newData[rowIndex].id = platformInfo.id || newData[rowIndex].id
              newData[rowIndex].plan_income = platformInfo.plan_income || 0
              newData[rowIndex].plan_signup = platformInfo.plan_enrollment || 0
              newData[rowIndex].plan_consult = platformInfo.plan_consult_volume || 0
              newData[rowIndex].plan_cost = platformInfo.plan_cost || 0
            }
          }
        })
      }

      if (semData && Object.keys(semData).length > 0) {
        CATEGORIES['SEM'].forEach((subcategory) => {
          const rowIndex = newData.findIndex(row => row.category === 'SEM' && row.subcategory === subcategory)
          if (rowIndex !== -1) {
            const channelInfo = semData[subcategory]
            if (channelInfo) {
              newData[rowIndex].id = channelInfo.id || newData[rowIndex].id
              newData[rowIndex].plan_income = channelInfo.plan_income || 0
              newData[rowIndex].plan_signup = channelInfo.plan_enrollment || 0
              newData[rowIndex].plan_consult = channelInfo.plan_consult_volume || 0
              newData[rowIndex].plan_cost = channelInfo.plan_cost || 0
            }
          }
        })
      }

      if (partnerData && Object.keys(partnerData).length > 0) {
        CATEGORIES['网络合作伙伴'].forEach((subcategory) => {
          const rowIndex = newData.findIndex(row => row.category === '网络合作伙伴' && row.subcategory === subcategory)
          if (rowIndex !== -1) {
            const partnerInfo = partnerData[subcategory]
            if (partnerInfo) {
              newData[rowIndex].id = partnerInfo.id || newData[rowIndex].id
              newData[rowIndex].plan_income = partnerInfo.plan_income || 0
              newData[rowIndex].plan_signup = partnerInfo.plan_enrollment || 0
              newData[rowIndex].plan_consult = partnerInfo.plan_consult_volume || 0
              newData[rowIndex].plan_cost = partnerInfo.plan_cost || 0
            }
          }
        })
      }

      if (reputationData) {
        const reputationRowIndex = newData.findIndex(row => row.category === '口碑' && row.subcategory === '口碑')
        if (reputationRowIndex !== -1) {
          newData[reputationRowIndex].id = reputationData.id || newData[reputationRowIndex].id
          newData[reputationRowIndex].plan_income = reputationData.plan_income || 0
          newData[reputationRowIndex].plan_signup = reputationData.plan_enrollment || 0
          newData[reputationRowIndex].plan_consult = reputationData.plan_consult_volume || 0
          newData[reputationRowIndex].plan_cost = reputationData.plan_cost || 0
        }
      }

      if (freePromotionData) {
        const freePromotionRowIndex = newData.findIndex(row => row.category === '免费推广' && row.subcategory === '免费推广')
        if (freePromotionRowIndex !== -1) {
          newData[freePromotionRowIndex].id = freePromotionData.id || newData[freePromotionRowIndex].id
          newData[freePromotionRowIndex].plan_income = freePromotionData.plan_income || 0
          newData[freePromotionRowIndex].plan_signup = freePromotionData.plan_enrollment || 0
          newData[freePromotionRowIndex].plan_consult = freePromotionData.plan_consult_volume || 0
          newData[freePromotionRowIndex].plan_cost = freePromotionData.plan_cost || 0
        }
      }

      // 计算新媒体和SEM的合计行，并填充计划行数据
      const monthPlanData = yearPlanApiData?.find((item: any) => item.month === month) || null
      
      CATEGORIES_WITH_YEAR_PLAN.forEach((category) => {
        // 计算合计行
        const categoryRows = newData.filter(row => row.category === category && !row.isTotal && !row.isPlanRow)
        const totalRowIndex = newData.findIndex(row => row.category === category && row.isTotal)
        if (totalRowIndex !== -1) {
          newData[totalRowIndex].plan_income = categoryRows.reduce((sum, row) => sum + (row.plan_income || 0), 0)
          newData[totalRowIndex].plan_signup = categoryRows.reduce((sum, row) => sum + (row.plan_signup || 0), 0)
          newData[totalRowIndex].plan_consult = categoryRows.reduce((sum, row) => sum + (row.plan_consult || 0), 0)
          newData[totalRowIndex].plan_cost = categoryRows.reduce((sum, row) => sum + (row.plan_cost || 0), 0)
        }
        
        // 填充计划行（从年度网络计划读取）
        const planRowIndex = newData.findIndex(row => row.category === category && row.isPlanRow)
        if (planRowIndex !== -1 && monthPlanData) {
          if (category === '新媒体') {
            newData[planRowIndex].plan_income = monthPlanData.newmedia_plan_income || 0
            newData[planRowIndex].plan_signup = monthPlanData.newmedia_plan_signup || 0
            newData[planRowIndex].plan_consult = monthPlanData.newmedia_plan_consult || 0
            newData[planRowIndex].plan_cost = monthPlanData.newmedia_plan_cost || 0
          } else if (category === 'SEM') {
            newData[planRowIndex].plan_income = monthPlanData.sem_plan_income || 0
            newData[planRowIndex].plan_signup = monthPlanData.sem_plan_signup || 0
            newData[planRowIndex].plan_consult = monthPlanData.sem_plan_consult || 0
            newData[planRowIndex].plan_cost = monthPlanData.sem_plan_cost || 0
          }
        }
      })

      // 计算网络合作伙伴的合计行
      const partnerRows = newData.filter(row => row.category === '网络合作伙伴' && !row.isTotal && !row.isPlanRow)
      const partnerTotalRowIndex = newData.findIndex(row => row.category === '网络合作伙伴' && row.isTotal)
      if (partnerTotalRowIndex !== -1) {
        newData[partnerTotalRowIndex].plan_income = partnerRows.reduce((sum, row) => sum + (row.plan_income || 0), 0)
        newData[partnerTotalRowIndex].plan_signup = partnerRows.reduce((sum, row) => sum + (row.plan_signup || 0), 0)
        newData[partnerTotalRowIndex].plan_consult = partnerRows.reduce((sum, row) => sum + (row.plan_consult || 0), 0)
        newData[partnerTotalRowIndex].plan_cost = partnerRows.reduce((sum, row) => sum + (row.plan_cost || 0), 0)
      }

      setData(newData)
      setDirty(false)
    } catch (err: any) {
      message.error(err?.message || '加载数据失败')
      setData(generateEmptyData())
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, loadNewmediaMonthlyData, loadSemMonthlyData, loadPartnerMonthlyData, loadReputationMonthlyData, loadFreePromotionMonthlyData])

  const saveData = useCallback(async () => {
    if (!year || !activeTab) {
      message.warning('请先选择年份和神殿')
      return
    }
    setSaving(true)
    try {
      const savePromises: Promise<any>[] = []

      // 排除合计行和计划行，只保存可编辑的数据行
      const newmediaRows = data.filter(row => row.category === '新媒体' && !row.isTotal && !row.isPlanRow)
      if (newmediaRows.length > 0) {
        const newmediaPayload = {
          campus: activeTab,
          year,
          data: newmediaRows.map(row => ({
            month: selectedMonth,
            platform: row.subcategory,
            plan_income: row.plan_income || 0,
            plan_enrollment: row.plan_signup || 0,
            plan_consult_volume: row.plan_consult || 0,
            plan_cost: row.plan_cost || 0,
          }))
        }
        savePromises.push(api.post('/market/monthly-plan/newmedia/save', newmediaPayload))
      }

      // 排除合计行和计划行
      const semRows = data.filter(row => row.category === 'SEM' && !row.isTotal && !row.isPlanRow)
      if (semRows.length > 0) {
        const semPayload = {
          campus: activeTab,
          year,
          data: semRows.map(row => ({
            month: selectedMonth,
            channel: row.subcategory,
            plan_income: row.plan_income || 0,
            plan_enrollment: row.plan_signup || 0,
            plan_consult_volume: row.plan_consult || 0,
            plan_cost: row.plan_cost || 0,
          }))
        }
        savePromises.push(api.post('/market/monthly-plan/sem/save', semPayload))
      }

      const partnerRows = data.filter(row => row.category === '网络合作伙伴' && !row.isTotal)
      if (partnerRows.length > 0) {
        const partnerPayload = {
          campus: activeTab,
          year,
          data: partnerRows.map(row => ({
            month: selectedMonth,
            partner: row.subcategory,
            plan_income: row.plan_income || 0,
            plan_enrollment: row.plan_signup || 0,
            plan_consult_volume: row.plan_consult || 0,
            plan_cost: row.plan_cost || 0,
          }))
        }
        savePromises.push(api.post('/market/monthly-plan/network-partner/detail/save', partnerPayload))
      }

      const reputationRows = data.filter(row => row.category === '口碑')
      if (reputationRows.length > 0) {
        const reputationPayload = {
          campus: activeTab,
          year,
          data: reputationRows.map(row => ({
            month: selectedMonth,
            plan_income: row.plan_income || 0,
            plan_enrollment: row.plan_signup || 0,
            plan_consult_volume: row.plan_consult || 0,
            plan_cost: row.plan_cost || 0,
          }))
        }
        savePromises.push(api.post('/market/monthly-plan/reputation/save', reputationPayload))
      }

      const freePromotionRows = data.filter(row => row.category === '免费推广')
      if (freePromotionRows.length > 0) {
        const freePromotionPayload = {
          campus: activeTab,
          year,
          data: freePromotionRows.map(row => ({
            month: selectedMonth,
            plan_income: row.plan_income || 0,
            plan_enrollment: row.plan_signup || 0,
            plan_consult_volume: row.plan_consult || 0,
            plan_cost: row.plan_cost || 0,
          }))
        }
        savePromises.push(api.post('/market/monthly-plan/free-promotion/save', freePromotionPayload))
      }

      await Promise.all(savePromises)
      setDirty(false)
      message.success('保存成功')
    } catch (err: any) {
      message.error(err?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }, [year, data, activeTab, selectedMonth])

  useEffect(() => {
    if (year && activeTab) {
      loadData(year, activeTab, selectedMonth)
    }
  }, [year, activeTab, selectedMonth, loadData])

  const updateCellValue = useCallback((rowIndex: number, field: keyof MonthlyDetailPlanRow, value: any) => {
    setData((prev) => {
      const newData = [...prev]
      newData[rowIndex] = { ...newData[rowIndex], [field]: value }
      
      // 更新后重新计算合计行
      const updatedCategory = newData[rowIndex].category
      if (CATEGORIES_WITH_TOTAL.includes(updatedCategory)) {
        const categoryRows = newData.filter(row => row.category === updatedCategory && !row.isTotal && !row.isPlanRow)
        const totalRowIndex = newData.findIndex(row => row.category === updatedCategory && row.isTotal)
        if (totalRowIndex !== -1) {
          newData[totalRowIndex] = {
            ...newData[totalRowIndex],
            plan_income: categoryRows.reduce((sum, row) => sum + (row.plan_income || 0), 0),
            plan_signup: categoryRows.reduce((sum, row) => sum + (row.plan_signup || 0), 0),
            plan_consult: categoryRows.reduce((sum, row) => sum + (row.plan_consult || 0), 0),
            plan_cost: categoryRows.reduce((sum, row) => sum + (row.plan_cost || 0), 0),
          }
        }
      }
      
      return newData
    })
    setDirty(true)
  }, [])

  const renderEditableNumberCell = (value: number | null, rowIndex: number, field: keyof MonthlyDetailPlanRow, precision: number = 0) => {
    return (
      <InputNumber
        value={value}
        onChange={(val) => updateCellValue(rowIndex, field, val)}
        style={{ width: '100%' }}
        precision={precision}
        formatter={(val) => val ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
        parser={(val) => val ? Number(val.replace(/,/g, '')) : 0}
        controls={false}
        size="small"
      />
    )
  }

  const getYearPlanForMonth = useMemo(() => {
    if (!yearPlanData || yearPlanData.length === 0) return null
    const monthData = yearPlanData.find((item: any) => item.month === selectedMonth)
    return monthData || null
  }, [yearPlanData, selectedMonth])

  const calculateCategoryTotals = useMemo(() => {
    const totals: Record<string, { plan_income: number; plan_signup: number; plan_consult: number; plan_cost: number }> = {}
    Object.keys(CATEGORIES).forEach((category) => {
      totals[category] = { plan_income: 0, plan_signup: 0, plan_consult: 0, plan_cost: 0 }
    })
    data.forEach((row) => {
      if (totals[row.category]) {
        totals[row.category].plan_income += row.plan_income || 0
        totals[row.category].plan_signup += row.plan_signup || 0
        totals[row.category].plan_consult += row.plan_consult || 0
        totals[row.category].plan_cost += row.plan_cost || 0
      }
    })
    return totals
  }, [data])

  const calculateGrandTotal = useMemo(() => {
    return {
      plan_income: Object.values(calculateCategoryTotals).reduce((sum, cat) => sum + cat.plan_income, 0),
      plan_signup: Object.values(calculateCategoryTotals).reduce((sum, cat) => sum + cat.plan_signup, 0),
      plan_consult: Object.values(calculateCategoryTotals).reduce((sum, cat) => sum + cat.plan_consult, 0),
      plan_cost: Object.values(calculateCategoryTotals).reduce((sum, cat) => sum + cat.plan_cost, 0),
    }
  }, [calculateCategoryTotals])

  const columns: ColumnsType<MonthlyDetailPlanRow> = useMemo(() => [
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      fixed: 'left',
      align: 'center',
      onCell: (record, index) => {
        if (!data.length || index === undefined) return {}
        const currentCategory = record.category
        let rowSpan = 0
        let isFirstInCategory = true
        for (let i = 0; i < index; i++) {
          if (data[i]?.category === currentCategory) {
            isFirstInCategory = false
            break
          }
        }
        if (isFirstInCategory) {
          rowSpan = data.filter(row => row.category === currentCategory).length
        }
        return { rowSpan: isFirstInCategory ? rowSpan : 0 }
      },
      render: (text) => <span style={{ fontWeight: 'bold' }}>{text}</span>,
    },
    {
      title: '子分类',
      dataIndex: 'subcategory',
      key: 'subcategory',
      width: 150,
      fixed: 'left',
      align: 'center',
      render: (text, record) => {
        const style: React.CSSProperties = {}
        if (record.isTotal) {
          style.fontWeight = 'bold'
          style.color = '#1890ff'
        } else if (record.isPlanRow) {
          style.fontWeight = 'bold'
          style.color = '#52c41a'
        }
        return <span style={style}>{text}</span>
      },
    },
    {
      title: '计划收入',
      dataIndex: 'plan_income',
      key: 'plan_income',
      width: 130,
      align: 'center',
      render: (value, record, index) => {
        if (record.isTotal || record.isPlanRow) {
          const formattedValue = value ? value.toLocaleString('zh-CN') : '-'
          const style: React.CSSProperties = { fontWeight: 'bold' }
          if (record.isTotal) style.color = '#1890ff'
          if (record.isPlanRow) style.color = '#52c41a'
          return <span style={style}>{formattedValue}</span>
        }
        return renderEditableNumberCell(value, index ?? 0, 'plan_income')
      },
    },
    {
      title: '计划报名',
      dataIndex: 'plan_signup',
      key: 'plan_signup',
      width: 130,
      align: 'center',
      render: (value, record, index) => {
        if (record.isTotal || record.isPlanRow) {
          const formattedValue = value ? value.toLocaleString('zh-CN') : '-'
          const style: React.CSSProperties = { fontWeight: 'bold' }
          if (record.isTotal) style.color = '#1890ff'
          if (record.isPlanRow) style.color = '#52c41a'
          return <span style={style}>{formattedValue}</span>
        }
        return renderEditableNumberCell(value, index ?? 0, 'plan_signup')
      },
    },
    {
      title: '计划咨询量',
      dataIndex: 'plan_consult',
      key: 'plan_consult',
      width: 130,
      align: 'center',
      render: (value, record, index) => {
        if (record.isTotal || record.isPlanRow) {
          const formattedValue = value ? value.toLocaleString('zh-CN') : '-'
          const style: React.CSSProperties = { fontWeight: 'bold' }
          if (record.isTotal) style.color = '#1890ff'
          if (record.isPlanRow) style.color = '#52c41a'
          return <span style={style}>{formattedValue}</span>
        }
        return renderEditableNumberCell(value, index ?? 0, 'plan_consult')
      },
    },
    {
      title: '计划消费',
      dataIndex: 'plan_cost',
      key: 'plan_cost',
      width: 130,
      align: 'center',
      render: (value, record, index) => {
        if (record.isTotal || record.isPlanRow) {
          const formattedValue = value ? value.toLocaleString('zh-CN') : '-'
          const style: React.CSSProperties = { fontWeight: 'bold' }
          if (record.isTotal) style.color = '#1890ff'
          if (record.isPlanRow) style.color = '#52c41a'
          return <span style={style}>{formattedValue}</span>
        }
        return renderEditableNumberCell(value, index ?? 0, 'plan_cost')
      },
    },
  ], [data, updateCellValue])

  const handleTabChange = (key: string) => {
    if (dirty) {
      message.warning('当前数据未保存，切换神殿将丢失修改')
    }
    // 切换神殿时先清空数据，避免新旧数据混杂导致表格行合并计算错误
    setData([])
    setActiveTab(key)
    setDirty(false)
  }

  const handleMonthChange = (date: dayjs.Dayjs | null) => {
    if (dirty) {
      message.warning('当前数据未保存，切换月份将丢失修改')
    }
    if (date) {
      // 切换月份时先清空数据，避免新旧数据混杂导致表格行合并计算错误
      setData([])
      setSelectedMonth(date.month() + 1)
      setDirty(false)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, textAlign: 'center', fontSize: '22px', fontWeight: 'bold', padding: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', borderRadius: '12px', boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)', letterSpacing: '1px' }}>
        <FileTextOutlined style={{ marginRight: 12, fontSize: '24px' }} />
        市场部月度详细计划
      </div>

      <Card style={{ borderRadius: '12px', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }}>
        <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} style={{ marginBottom: 16 }} type="card" />

        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'linear-gradient(to right, #f8f9fa, #e9ecef)', borderRadius: '8px' }}>
          <Space size="large">
            <Space>
              <span style={{ fontWeight: 600 }}>年份：</span>
              <DatePicker picker="year" value={year ? dayjs(year, 'YYYY') : null} onChange={(date) => setYear(date ? date.format('YYYY') : '')} allowClear={false} style={{ width: 120 }} />
            </Space>
            <Space>
              <span style={{ fontWeight: 600 }}>月份：</span>
              <DatePicker picker="month" value={dayjs().year(parseInt(year)).month(selectedMonth - 1)} onChange={handleMonthChange} allowClear={false} style={{ width: 120 }} format="M月" />
            </Space>
          </Space>
          <Space>
            <Button icon={<SaveOutlined />} type="primary" disabled={!dirty || !year || !activeTab} loading={saving} onClick={saveData} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', fontWeight: 600 }}>保存</Button>
            <Button icon={<ReloadOutlined />} loading={loading} onClick={() => loadData(year, activeTab, selectedMonth)}>刷新</Button>
          </Space>
        </div>

        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id" 
          loading={loading} 
          pagination={false} 
          bordered 
          size="small" 
          scroll={{ x: 800 }} 
          rowClassName={(record) => {
            if (record.isTotal) return 'total-row'
            if (record.isPlanRow) return 'plan-row'
            return ''
          }}
          className="detailed-border-table"
        />
        
        <style>{`
          .detailed-border-table.ant-table-wrapper .ant-table {
            border: 2px solid #d9d9d9;
          }
          
          .detailed-border-table .ant-table-thead > tr > th {
            border: 1px solid #d9d9d9 !important;
            border-right: 1px solid #d9d9d9 !important;
            font-weight: 600;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: #fff !important;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            font-size: 14px;
          }
          
          .detailed-border-table .ant-table-tbody > tr > td {
            border: 1px solid #d9d9d9 !important;
            border-right: 1px solid #d9d9d9 !important;
          }
          
          .detailed-border-table .ant-table-tbody > tr:hover > td {
            background: #f5f5f5 !important;
          }
          
          .detailed-border-table .ant-table-cell {
            border-right: 1px solid #d9d9d9 !important;
          }
          
          .detailed-border-table .ant-table-cell:last-child {
            border-right: 1px solid #d9d9d9 !important;
          }
          
          .detailed-border-table .ant-table-thead > tr > th::before {
            display: none;
          }
          
          .total-row td {
            background-color: #e6f7ff !important;
            border: 1px solid #91d5ff !important;
            font-weight: 600;
          }
          
          .plan-row td {
            background-color: #f6ffed !important;
            border: 1px solid #b7eb8f !important;
            font-weight: 600;
          }
          
          .detailed-border-table .ant-table-tbody > tr.total-row:hover > td {
            background-color: #d4efff !important;
          }
          
          .detailed-border-table .ant-table-tbody > tr.plan-row:hover > td {
            background-color: #e8ffd9 !important;
          }
        `}</style>
      </Card>
    </div>
  )
}

export default MarketingMonthlyDetailPlanPage
