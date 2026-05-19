import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { App, Button, Card, DatePicker, InputNumber, Space, Table, Tabs } from 'antd'
import { FileTextOutlined, ReloadOutlined, SaveOutlined, ImportOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '@/services/api'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import ImportDataModal from './ImportDataModal'

// 获取当前年份
const getCurrentYear = () => dayjs().format('YYYY')

// 网络计划表行数据类型
interface NetworkPlanRow {
  id: string | number
  month: string // 月份：总计、1月、2月...12月
  network_plan_income: number | null // 网络计划收入
  sem_plan_income: number | null // SEM计划收入
  newmedia_plan_income: number | null // 新媒体计划收入
  network_plan_signup: number | null // 网络计划报名
  sem_plan_signup: number | null // SEM计划报名
  newmedia_plan_signup: number | null // 新媒体计划报名
  conversion_rate: string | null // 转化率目标
  network_plan_total: number | null // 网络计划总量
  newmedia_plan_consult: number | null // 新媒体计划咨询量
  sem_plan_consult: number | null // SEM计划咨询量
  consult_cost: number | null // 咨询量成本
  network_plan_cost: number | null // 网络计划消费
  newmedia_plan_cost: number | null // 新媒体计划消费
  sem_plan_cost: number | null // SEM计划消费
  actual_enrollment_cost: number | null // 招生实际成本
}

// API 返回的数据类型
interface NetworkPlanApiRow {
  id: number
  year: string
  month: number // 0=总计, 1-12=月份
  campus: string // 神殿名称，空字符串表示总计划
  network_plan_income: number
  sem_plan_income: number
  newmedia_plan_income: number
  network_plan_signup: number
  sem_plan_signup: number
  newmedia_plan_signup: number
  conversion_rate: number
  network_plan_total: number
  newmedia_plan_consult: number
  sem_plan_consult: number
  consult_cost: number
  network_plan_cost: number
  newmedia_plan_cost: number
  sem_plan_cost: number
  actual_enrollment_cost: number
}

// 月份映射
const MONTH_LABELS = ['总计', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const MarketingNetworkPlanPage: React.FC = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [year, setYear] = useState<string>(getCurrentYear())
  const [data, setData] = useState<NetworkPlanRow[]>([])
  const [activeTab, setActiveTab] = useState<string>('total') // 'total' 或神殿名称
  const [importModalVisible, setImportModalVisible] = useState(false)

  // 从 store 获取神殿列表
  const { getAllCampuses, loadCampusesFromConfig } = useCampusStore()
  const campuses = getAllCampuses()

  // 加载神殿配置
  useEffect(() => {
    loadCampusesFromConfig()
  }, [loadCampusesFromConfig])

  // 生成标签页配置
  const tabItems = useMemo(() => {
    const items = [
      { key: 'total', label: '市场部-总计划' },
    ]
    campuses.forEach((campus) => {
      items.push({
        key: campus.name,
        label: campus.name,
      })
    })
    return items
  }, [campuses])

  // 生成空数据
  const generateEmptyData = (): NetworkPlanRow[] => {
    return MONTH_LABELS.map((label, index) => ({
      id: `row-${index}`,
      month: label,
      network_plan_income: null,
      sem_plan_income: null,
      newmedia_plan_income: null,
      network_plan_signup: null,
      sem_plan_signup: null,
      newmedia_plan_signup: null,
      conversion_rate: null,
      network_plan_total: null,
      newmedia_plan_consult: null,
      sem_plan_consult: null,
      consult_cost: null,
      network_plan_cost: null,
      newmedia_plan_cost: null,
      sem_plan_cost: null,
      actual_enrollment_cost: null,
    }))
  }

  // 将 API 数据转换为前端格式
  const convertApiToFrontend = (apiData: NetworkPlanApiRow[]): NetworkPlanRow[] => {
    const result = generateEmptyData()
    
    apiData.forEach((item) => {
      const index = item.month // 0=总计, 1-12=月份
      if (index >= 0 && index <= 12) {
        result[index] = {
          id: item.id,
          month: MONTH_LABELS[index],
          network_plan_income: item.network_plan_income,
          sem_plan_income: item.sem_plan_income,
          newmedia_plan_income: item.newmedia_plan_income,
          network_plan_signup: item.network_plan_signup,
          sem_plan_signup: item.sem_plan_signup,
          newmedia_plan_signup: item.newmedia_plan_signup,
          conversion_rate: item.conversion_rate ? `${(item.conversion_rate * 100).toFixed(2)}%` : null,
          network_plan_total: item.network_plan_total,
          newmedia_plan_consult: item.newmedia_plan_consult,
          sem_plan_consult: item.sem_plan_consult,
          consult_cost: item.consult_cost,
          network_plan_cost: item.network_plan_cost,
          newmedia_plan_cost: item.newmedia_plan_cost,
          sem_plan_cost: item.sem_plan_cost,
          actual_enrollment_cost: item.actual_enrollment_cost,
        }
      }
    })
    
    return result
  }

  // 将前端数据转换为 API 格式
  const convertFrontendToApi = (rows: NetworkPlanRow[]) => {
    return rows.map((row, index) => ({
      month: index, // 0=总计, 1-12=月份
      network_plan_income: row.network_plan_income || 0,
      sem_plan_income: row.sem_plan_income || 0,
      newmedia_plan_income: row.newmedia_plan_income || 0,
      network_plan_signup: row.network_plan_signup || 0,
      sem_plan_signup: row.sem_plan_signup || 0,
      newmedia_plan_signup: row.newmedia_plan_signup || 0,
      conversion_rate: row.conversion_rate ? parseFloat(row.conversion_rate.replace('%', '')) / 100 : 0,
      network_plan_total: row.network_plan_total || 0,
      newmedia_plan_consult: row.newmedia_plan_consult || 0,
      sem_plan_consult: row.sem_plan_consult || 0,
      consult_cost: row.consult_cost || 0,
      network_plan_cost: row.network_plan_cost || 0,
      newmedia_plan_cost: row.newmedia_plan_cost || 0,
      sem_plan_cost: row.sem_plan_cost || 0,
      actual_enrollment_cost: row.actual_enrollment_cost || 0,
    }))
  }

  // 加载数据
  const loadData = useCallback(async (selectedYear: string, campus: string) => {
    if (!selectedYear) return
    setLoading(true)
    try {
      let apiData: NetworkPlanApiRow[] = []
      
      if (campus === 'total') {
        // 总计划：从汇总接口获取数据
        const res = await api.get<NetworkPlanApiRow[]>('/market/network-plan/summary', { 
          params: { year: selectedYear } 
        })
        apiData = res.data as unknown as NetworkPlanApiRow[]
      } else {
        // 各神殿：从普通接口获取数据
        const res = await api.get<NetworkPlanApiRow[]>('/market/network-plan', { 
          params: { year: selectedYear, campus } 
        })
        apiData = res.data as unknown as NetworkPlanApiRow[]
      }
      
      if (apiData && apiData.length > 0) {
        setData(convertApiToFrontend(apiData))
      } else {
        setData(generateEmptyData())
      }
      setDirty(false)
    } catch (err: any) {
      message.error(err?.message || '加载数据失败')
      setData(generateEmptyData())
    } finally {
      setLoading(false)
    }
  }, [])

  // 保存数据
  const saveData = useCallback(async () => {
    if (!year) {
      message.warning('请先选择年份')
      return
    }
    setSaving(true)
    try {
      const payload: { year: string; campus?: string; rows: any[] } = {
        year,
        rows: convertFrontendToApi(data),
      }
      if (activeTab !== 'total') {
        payload.campus = activeTab
      }
      await api.post('/market/network-plan/bulk-save', payload)
      setDirty(false)
      message.success('保存成功')
    } catch (err: any) {
      message.error(err?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }, [year, data, activeTab])

  // 当年份或标签页变化时加载数据
  useEffect(() => {
    if (year) {
      loadData(year, activeTab)
    }
  }, [year, activeTab, loadData])

  // 更新单元格值并自动计算相关字段
  const updateCellValue = useCallback((rowIndex: number, field: keyof NetworkPlanRow, value: any) => {
    setData((prev) => {
      const newData = [...prev]
      const row = { ...newData[rowIndex], [field]: value }
      
      // 根据函数关系自动计算相关字段
      // 1. 网络计划收入 = SEM计划收入 + 新媒体计划收入
      if (field === 'sem_plan_income' || field === 'newmedia_plan_income') {
        row.network_plan_income = (row.sem_plan_income || 0) + (row.newmedia_plan_income || 0)
      }
      
      // 2. 网络计划报名 = SEM计划报名 + 新媒体计划报名
      if (field === 'sem_plan_signup' || field === 'newmedia_plan_signup') {
        row.network_plan_signup = (row.sem_plan_signup || 0) + (row.newmedia_plan_signup || 0)
      }
      
      // 3. 网络计划总量 = 新媒体计划咨询量 + SEM计划咨询量
      if (field === 'newmedia_plan_consult' || field === 'sem_plan_consult') {
        row.network_plan_total = (row.newmedia_plan_consult || 0) + (row.sem_plan_consult || 0)
      }
      
      // 4. 网络计划消费 = 新媒体计划消费 + SEM计划消费
      if (field === 'newmedia_plan_cost' || field === 'sem_plan_cost') {
        row.network_plan_cost = (row.newmedia_plan_cost || 0) + (row.sem_plan_cost || 0)
      }
      
      // 5. 转化率目标 = 网络计划报名 / 网络计划总量
      const networkPlanSignup = row.network_plan_signup || 0
      const networkPlanTotal = row.network_plan_total || 0
      row.conversion_rate = networkPlanTotal > 0 
        ? `${(networkPlanSignup / networkPlanTotal * 100).toFixed(2)}%` 
        : null
      
      // 6. 咨询量成本 = 网络计划消费 / 网络计划总量
      const networkPlanCost = row.network_plan_cost || 0
      row.consult_cost = networkPlanTotal > 0 
        ? networkPlanCost / networkPlanTotal 
        : null
      
      // 7. 招生实际成本 = 网络计划消费 / 网络计划报名
      row.actual_enrollment_cost = networkPlanSignup > 0 
        ? networkPlanCost / networkPlanSignup 
        : null
      
      newData[rowIndex] = row
      return newData
    })
    setDirty(true)
  }, [])

  // 自动计算的字段列表（不可编辑）
  const calculatedFields: (keyof NetworkPlanRow)[] = [
    'network_plan_income',    // = SEM计划收入 + 新媒体计划收入
    'network_plan_signup',    // = SEM计划报名 + 新媒体计划报名
    'network_plan_total',     // = 新媒体计划咨询量 + SEM计划咨询量
    'network_plan_cost',      // = 新媒体计划消费 + SEM计划消费
    'conversion_rate',        // = 网络计划报名 / 网络计划总量
    'consult_cost',           // = 网络计划消费 / 网络计划总量
    'actual_enrollment_cost', // = 网络计划消费 / 网络计划报名
  ]

  // 渲染可编辑数字单元格
  const renderEditableNumberCell = useCallback((
    value: number | null,
    rowIndex: number,
    field: keyof NetworkPlanRow,
    precision: number = 0
  ) => {
    // 总计行不可编辑（自动计算）
    if (rowIndex === 0) {
      return <span style={{ fontWeight: 'bold' }}>{value?.toLocaleString() ?? ''}</span>
    }
    // 总计划标签页：所有数据只读（汇总数据）
    if (activeTab === 'total') {
      return <span>{value?.toLocaleString() ?? ''}</span>
    }
    // 自动计算的字段：只读显示
    if (calculatedFields.includes(field)) {
      return <span style={{ color: '#666' }}>{value != null ? (precision > 0 ? value.toFixed(precision) : value.toLocaleString()) : ''}</span>
    }
    return (
      <InputNumber
        value={value}
        onChange={(val) => updateCellValue(rowIndex, field, val)}
        style={{ width: '100%' }}
        precision={precision}
        formatter={(val) => val ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
        parser={(val) => {
          if (!val) return null as any
          const num = Number(val.replace(/,/g, ''))
          return isNaN(num) ? null as any : num
        }}
        controls={false}
        size="small"
      />
    )
  }, [activeTab, updateCellValue])

  // 渲染转化率单元格
  const renderConversionRateCell = useCallback((value: string | null, rowIndex: number) => {
    if (rowIndex === 0) {
      return <span style={{ fontWeight: 'bold', color: '#c00000' }}>{value ?? ''}</span>
    }
    return <span style={{ color: '#c00000' }}>{value ?? ''}</span>
  }, [])

  // 表格列定义
  const columns: ColumnsType<NetworkPlanRow> = useMemo(() => [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 50,
      fixed: 'left',
      align: 'center',
      render: (text, _, index) => (
        <span style={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>{text}</span>
      ),
    },
    {
      title: '网络计划收入',
      dataIndex: 'network_plan_income',
      key: 'network_plan_income',
      width: 95,
      align: 'center',
      render: (value, _, index) => renderEditableNumberCell(value, index, 'network_plan_income'),
    },
    {
      title: 'SEM计划收入',
      dataIndex: 'sem_plan_income',
      key: 'sem_plan_income',
      width: 90,
      align: 'center',
      render: (value, _, index) => renderEditableNumberCell(value, index, 'sem_plan_income'),
    },
    {
      title: '新媒体计划收入',
      dataIndex: 'newmedia_plan_income',
      key: 'newmedia_plan_income',
      width: 105,
      align: 'center',
      render: (value, _, index) => renderEditableNumberCell(value, index, 'newmedia_plan_income'),
    },
    {
      title: '网络计划报名',
      dataIndex: 'network_plan_signup',
      key: 'network_plan_signup',
      width: 90,
      align: 'center',
      render: (value, _, index) => renderEditableNumberCell(value, index, 'network_plan_signup'),
    },
    {
      title: 'SEM计划报名',
      dataIndex: 'sem_plan_signup',
      key: 'sem_plan_signup',
      width: 90,
      align: 'center',
      render: (value, _, index) => renderEditableNumberCell(value, index, 'sem_plan_signup'),
    },
    {
      title: '新媒体计划报名',
      dataIndex: 'newmedia_plan_signup',
      key: 'newmedia_plan_signup',
      width: 105,
      align: 'center',
      render: (value, _, index) => renderEditableNumberCell(value, index, 'newmedia_plan_signup'),
    },
    {
      title: '转化率目标',
      dataIndex: 'conversion_rate',
      key: 'conversion_rate',
      width: 80,
      align: 'center',
      render: (value, _, index) => renderConversionRateCell(value, index),
    },
    {
      title: '网络计划总量',
      dataIndex: 'network_plan_total',
      key: 'network_plan_total',
      width: 90,
      align: 'center',
      render: (value, _, index) => renderEditableNumberCell(value, index, 'network_plan_total'),
    },
    {
      title: '新媒体计划咨询量',
      dataIndex: 'newmedia_plan_consult',
      key: 'newmedia_plan_consult',
      width: 115,
      align: 'center',
      render: (value, _, index) => renderEditableNumberCell(value, index, 'newmedia_plan_consult'),
    },
    {
      title: 'SEM计划咨询量',
      dataIndex: 'sem_plan_consult',
      key: 'sem_plan_consult',
      width: 105,
      align: 'center',
      render: (value, _, index) => renderEditableNumberCell(value, index, 'sem_plan_consult'),
    },
    {
      title: '咨询量成本',
      dataIndex: 'consult_cost',
      key: 'consult_cost',
      width: 85,
      align: 'center',
      render: (value, _, index) => renderEditableNumberCell(value, index, 'consult_cost', 2),
    },
    {
      title: '网络计划消费',
      dataIndex: 'network_plan_cost',
      key: 'network_plan_cost',
      width: 90,
      align: 'center',
      render: (value, _, index) => renderEditableNumberCell(value, index, 'network_plan_cost'),
    },
    {
      title: '新媒体计划消费',
      dataIndex: 'newmedia_plan_cost',
      key: 'newmedia_plan_cost',
      width: 105,
      align: 'center',
      render: (value, _, index) => renderEditableNumberCell(value, index, 'newmedia_plan_cost'),
    },
    {
      title: 'SEM计划消费',
      dataIndex: 'sem_plan_cost',
      key: 'sem_plan_cost',
      width: 90,
      align: 'center',
      render: (value, _, index) => renderEditableNumberCell(value, index, 'sem_plan_cost'),
    },
    {
      title: '招生实际成本',
      dataIndex: 'actual_enrollment_cost',
      key: 'actual_enrollment_cost',
      width: 95,
      align: 'center',
      render: (value, _, index) => {
        if (index === 0) {
          return <span style={{ fontWeight: 'bold', color: '#c00000' }}>{value?.toFixed(2) ?? ''}</span>
        }
        return <span style={{ color: '#c00000' }}>{value?.toFixed(0) ?? ''}</span>
      },
    },
  ], [updateCellValue, activeTab, renderEditableNumberCell, renderConversionRateCell])

  // 计算总计行
  useEffect(() => {
    if (data.length === 0) return
    
    const monthlyData = data.slice(1) // 排除总计行
    
    // 汇总各月份的基础数据
    const totals = {
      sem_plan_income: monthlyData.reduce((sum, row) => sum + (row.sem_plan_income || 0), 0),
      newmedia_plan_income: monthlyData.reduce((sum, row) => sum + (row.newmedia_plan_income || 0), 0),
      sem_plan_signup: monthlyData.reduce((sum, row) => sum + (row.sem_plan_signup || 0), 0),
      newmedia_plan_signup: monthlyData.reduce((sum, row) => sum + (row.newmedia_plan_signup || 0), 0),
      newmedia_plan_consult: monthlyData.reduce((sum, row) => sum + (row.newmedia_plan_consult || 0), 0),
      sem_plan_consult: monthlyData.reduce((sum, row) => sum + (row.sem_plan_consult || 0), 0),
      newmedia_plan_cost: monthlyData.reduce((sum, row) => sum + (row.newmedia_plan_cost || 0), 0),
      sem_plan_cost: monthlyData.reduce((sum, row) => sum + (row.sem_plan_cost || 0), 0),
    }
    
    // 根据函数关系计算派生字段
    // 1. 网络计划收入 = SEM计划收入 + 新媒体计划收入
    const network_plan_income = totals.sem_plan_income + totals.newmedia_plan_income
    
    // 2. 网络计划报名 = SEM计划报名 + 新媒体计划报名
    const network_plan_signup = totals.sem_plan_signup + totals.newmedia_plan_signup
    
    // 3. 网络计划总量 = 新媒体计划咨询量 + SEM计划咨询量
    const network_plan_total = totals.newmedia_plan_consult + totals.sem_plan_consult
    
    // 4. 网络计划消费 = 新媒体计划消费 + SEM计划消费
    const network_plan_cost = totals.newmedia_plan_cost + totals.sem_plan_cost
    
    // 5. 转化率目标 = 网络计划报名 / 网络计划总量
    const conversionRate = network_plan_total > 0 
      ? (network_plan_signup / network_plan_total * 100).toFixed(2) + '%' 
      : ''
    
    // 6. 咨询量成本 = 网络计划消费 / 网络计划总量
    const consultCost = network_plan_total > 0 
      ? network_plan_cost / network_plan_total 
      : 0
    
    // 7. 招生实际成本 = 网络计划消费 / 网络计划报名
    const actualEnrollmentCost = network_plan_signup > 0 
      ? network_plan_cost / network_plan_signup 
      : 0
    
    setData((prev) => {
      const newData = [...prev]
      newData[0] = {
        ...newData[0],
        ...totals,
        network_plan_income,
        network_plan_signup,
        network_plan_total,
        network_plan_cost,
        conversion_rate: conversionRate,
        consult_cost: consultCost,
        actual_enrollment_cost: actualEnrollmentCost,
      }
      return newData
    })
  }, [data.slice(1).map(r => JSON.stringify(r)).join(',')])

  // 处理标签页切换
  const handleTabChange = (key: string) => {
    if (dirty && activeTab !== 'total') {
      message.warning('当前数据未保存，切换标签页将丢失修改')
    }
    setActiveTab(key)
    setDirty(false)
  }

  // 获取当前标签页标题
  const getTabTitle = () => {
    if (activeTab === 'total') {
      return '市场部-总计划'
    }
    return activeTab
  }

  // 处理导入数据
  const handleImportData = async (importedData: any[]) => {
    try {
      // 将导入的数据转换为前端格式
      const newData = generateEmptyData()
      
      importedData.forEach((item) => {
        const monthIndex = item.month // 0=总计, 1-12=月份
        if (monthIndex >= 0 && monthIndex <= 12) {
          // 只导入基础字段（可编辑字段），计算字段会自动计算
          // 基础字段：sem_plan_income, newmedia_plan_income, sem_plan_signup, newmedia_plan_signup,
          //          newmedia_plan_consult, sem_plan_consult, newmedia_plan_cost, sem_plan_cost
          const row: NetworkPlanRow = {
            id: `row-${monthIndex}`,
            month: MONTH_LABELS[monthIndex],
            // 基础字段 - 可编辑
            sem_plan_income: item.sem_plan_income,
            newmedia_plan_income: item.newmedia_plan_income,
            sem_plan_signup: item.sem_plan_signup,
            newmedia_plan_signup: item.newmedia_plan_signup,
            newmedia_plan_consult: item.newmedia_plan_consult,
            sem_plan_consult: item.sem_plan_consult,
            newmedia_plan_cost: item.newmedia_plan_cost,
            sem_plan_cost: item.sem_plan_cost,
            // 计算字段 - 初始化为 null，后续会自动计算
            network_plan_income: null,
            network_plan_signup: null,
            network_plan_total: null,
            network_plan_cost: null,
            conversion_rate: null,
            consult_cost: null,
            actual_enrollment_cost: null,
          }
          
          // 根据基础字段计算派生字段
          // 1. 网络计划收入 = SEM计划收入 + 新媒体计划收入
          row.network_plan_income = (row.sem_plan_income || 0) + (row.newmedia_plan_income || 0)
          
          // 2. 网络计划报名 = SEM计划报名 + 新媒体计划报名
          row.network_plan_signup = (row.sem_plan_signup || 0) + (row.newmedia_plan_signup || 0)
          
          // 3. 网络计划总量 = 新媒体计划咨询量 + SEM计划咨询量
          row.network_plan_total = (row.newmedia_plan_consult || 0) + (row.sem_plan_consult || 0)
          
          // 4. 网络计划消费 = 新媒体计划消费 + SEM计划消费
          row.network_plan_cost = (row.newmedia_plan_cost || 0) + (row.sem_plan_cost || 0)
          
          // 5. 转化率目标 = 网络计划报名 / 网络计划总量
          const networkPlanSignup = row.network_plan_signup || 0
          const networkPlanTotal = row.network_plan_total || 0
          row.conversion_rate = networkPlanTotal > 0 
            ? `${(networkPlanSignup / networkPlanTotal * 100).toFixed(2)}%` 
            : null
          
          // 6. 咨询量成本 = 网络计划消费 / 网络计划总量
          const networkPlanCost = row.network_plan_cost || 0
          row.consult_cost = networkPlanTotal > 0 
            ? networkPlanCost / networkPlanTotal 
            : null
          
          // 7. 招生实际成本 = 网络计划消费 / 网络计划报名
          row.actual_enrollment_cost = networkPlanSignup > 0 
            ? networkPlanCost / networkPlanSignup 
            : null
          
          newData[monthIndex] = row
        }
      })
      
      setData(newData)
      setDirty(true)
      message.success('数据导入成功，请检查后点击保存按钮')
    } catch (error: any) {
      message.error(error.message || '导入数据处理失败')
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 24,
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          padding: '10px 16px',
          backgroundColor: '#c6e0b4',
          borderRadius: 0,
          border: '1px solid #000',
        }}
      >
        <FileTextOutlined style={{ marginRight: 8 }} />
        {year}年度{getTabTitle()}计划信息表
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          style={{ marginBottom: 16 }}
        />

        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space>
            <span>年份：</span>
            <DatePicker
              picker="year"
              value={year ? dayjs(year, 'YYYY') : null}
              onChange={(date) => setYear(date ? date.format('YYYY') : '')}
              allowClear={false}
              style={{ width: 120 }}
            />
            {activeTab === 'total' && (
              <span style={{ color: '#888', marginLeft: 16 }}>
                （汇总数据，来自各神殿数据合计，不可编辑）
              </span>
            )}
          </Space>
          <Space>
            {activeTab !== 'total' && (
              <>
                <Button
                  icon={<ImportOutlined />}
                  onClick={() => setImportModalVisible(true)}
                  disabled={!year}
                >
                  导入数据
                </Button>
                <Button
                  icon={<SaveOutlined />}
                  type="primary"
                  disabled={!dirty || !year}
                  loading={saving}
                  onClick={saveData}
                >
                  保存
                </Button>
              </>
            )}
            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={() => loadData(year, activeTab)}
            >
              刷新
            </Button>
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
          scroll={{ x: 'max-content' }}
          rowClassName={(_, index) => index === 0 ? 'total-row' : ''}
        />

        <style>{`
          .ant-table-container table { border-color: #000 !important; }
          .ant-table-thead > tr > th { 
            background-color: #c6e0b4 !important; 
            border-color: #000 !important; 
            font-weight: bold;
            text-align: center !important;
          }
          .ant-table-tbody > tr > td { border-color: #000 !important; }
          .ant-table-cell { padding: 4px 8px !important; }
          .total-row { background-color: #fff2cc !important; }
          .total-row td { background-color: #fff2cc !important; }
          .ant-input-number { 
            border: none !important; 
            box-shadow: none !important;
          }
          .ant-input-number-input {
            text-align: right;
          }
          .ant-tabs-nav {
            margin-bottom: 0 !important;
          }
        `}</style>
      </Card>

      <ImportDataModal
        visible={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        onImport={handleImportData}
        year={year}
        campus={activeTab}
      />
    </div>
  )
}

export default MarketingNetworkPlanPage
