import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { App, Table, InputNumber, Button, Space, Input, Spin, Row, Col } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { 
  getTaskCompletionData, 
  getMediaExpenseData, 
  getAnalysisData,
  calcSEMTotal, 
  calcNewMediaTotal, 
  calcGrandTotal,
  type TaskCompletionData,
  type MediaExpenseData,
  type CrowdStatusRow as ApiCrowdStatusRow,
  type EducationRow as ApiEducationRow,
  type DetailedCrowdStatusRow as ApiDetailedCrowdStatusRow,
  type LocationRow as ApiLocationRow,
} from './stageSummaryApi'

interface StageDataSummaryTabProps {
  campusId: string
  startDate: Dayjs
  endDate: Dayjs
}

// 不同神殿的地域配置（根据神殿ID或名称）
const CAMPUS_LOCATIONS: Record<string, string[]> = {
  // 河北神殿：盛邦(1)、冀美(2)、石美(3)
  '1': ['石家庄', '邢台', '保定', '邯郸', '衡水', '沧州', '廊坊', '其他'],
  '2': ['石家庄', '邢台', '保定', '邯郸', '衡水', '沧州', '廊坊', '其他'],
  '3': ['石家庄', '邢台', '保定', '邯郸', '衡水', '沧州', '廊坊', '其他'],
  'shengbang': ['石家庄', '邢台', '保定', '邯郸', '衡水', '沧州', '廊坊', '其他'],
  'jimei': ['石家庄', '邢台', '保定', '邯郸', '衡水', '沧州', '廊坊', '其他'],
  'shimei': ['石家庄', '邢台', '保定', '邯郸', '衡水', '沧州', '廊坊', '其他'],
  // 山西神殿：晋美(4)、原美(5)、太美(6)
  '4': ['太原', '晋中', '吕梁', '阳泉', '忻州', '临汾', '朔州', '其他'],
  '5': ['太原', '晋中', '吕梁', '阳泉', '忻州', '临汾', '朔州', '其他'],
  '6': ['太原', '晋中', '吕梁', '阳泉', '忻州', '临汾', '朔州', '其他'],
  'jinmei': ['太原', '晋中', '吕梁', '阳泉', '忻州', '临汾', '朔州', '其他'],
  'yuanmei': ['太原', '晋中', '吕梁', '阳泉', '忻州', '临汾', '朔州', '其他'],
  'taimei': ['太原', '晋中', '吕梁', '阳泉', '忻州', '临汾', '朔州', '其他'],
  // 广西神殿：桂美(7)、邕美
  '7': ['南宁', '贵港', '钦州', '崇左', '河池', '百色', '来宾', '防城港', '其他'],
  'guimei': ['南宁', '贵港', '钦州', '崇左', '河池', '百色', '来宾', '防城港', '其他'],
  'yongmei': ['南宁', '贵港', '钦州', '崇左', '河池', '百色', '来宾', '防城港', '其他'],
  // 贵州神殿：黔美(8) - 暂时使用河北配置
  '8': ['石家庄', '邢台', '保定', '邯郸', '衡水', '沧州', '廊坊', '其他'],
  'qianmei': ['石家庄', '邢台', '保定', '邯郸', '衡水', '沧州', '廊坊', '其他'],
}

// 任务完成情况数据结构
interface TaskCompletionRow {
  key: string
  category: string
  expense: number
  quantity: number
  income: number
  grossSignup: number
  visit: number
  netSignup: number
}

// 媒体投放情况数据结构
interface MediaRow {
  key: string
  mediaType: string
  specificMedia: string
  expense: number
  plannedConsult: number
  completedConsult: number
  consultCompletionRate: string
  consultCost: string
  grossSignup: number
  netSignup: number
  netSignupCost: string
  targetIncome: number
  actualIncome: number
  roi: string
  netSignupCompletionRate: string
}

// 人群状态维度数据结构
interface CrowdStatusRow {
  key: string
  status: string
  quantity: number
  visit: number
  visitConversionRate: string
  signup: number
  signupConversionRate: string
}

// 学历维度数据结构
interface EducationRow {
  key: string
  education: string
  quantity: number
  visit: number
  visitConversionRate: string
  signup: number
  signupConversionRate: string
}

// 详细人群状态维度数据结构（学历+状态组合）
interface DetailedCrowdStatusRow {
  key: string
  status: string
  quantity: number
  ratio: string
  visit: number
  visitConversionRate: string
  signup: number
  signupConversionRate: string
}

// 地域维度数据结构
interface LocationRow {
  key: string
  location: string
  quantity: number
  ratio: string
  visit: number
  visitConversionRate: string
  signup: number
  signupConversionRate: string
}

// 根据神殿生成地域数据的辅助函数
const generateLocationData = (campusId: string, prefix: string): LocationRow[] => {
  // 获取该神殿的地域列表，如果没有配置则使用河北神殿(1)的配置
  const locations = CAMPUS_LOCATIONS[campusId] || CAMPUS_LOCATIONS['1']
  return [
    ...locations.map((location, index) => ({
      key: `${prefix}-${index + 1}`,
      location,
      quantity: 0,
      ratio: '0%',
      visit: 0,
      visitConversionRate: '0%',
      signup: 0,
      signupConversionRate: '0%',
    })),
    {
      key: `${prefix}-total`,
      location: '合计',
      quantity: 0,
      ratio: '0%',
      visit: 0,
      visitConversionRate: '0%',
      signup: 0,
      signupConversionRate: '0%',
    },
  ]
}

// 根据神殿生成意向地域数据的辅助函数
const generateIntentLocationData = (campusId: string): LocationRow[] => {
  // 获取该神殿的地域列表，如果没有配置则使用河北神殿(1)的配置
  const locations = CAMPUS_LOCATIONS[campusId] || CAMPUS_LOCATIONS['1']
  const mainCity = locations[0] || '石家庄'
  
  return [
    {
      key: 'baidu-loc-intent-1',
      location: mainCity,
      quantity: 0,
      ratio: '0%',
      visit: 0,
      visitConversionRate: '0%',
      signup: 0,
      signupConversionRate: '0%',
    },
    {
      key: 'baidu-loc-intent-2',
      location: `非${mainCity}`,
      quantity: 0,
      ratio: '0%',
      visit: 0,
      visitConversionRate: '0%',
      signup: 0,
      signupConversionRate: '0%',
    },
  ]
}

/**
 * 阶段数据总表
 * 包含：任务完成情况、各媒体投放情况、工作总结分析等
 */
const StageDataSummaryTab: React.FC<StageDataSummaryTabProps> = ({ campusId, startDate, endDate }) => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const { campuses } = useCampusStore()
  
  // 调试：打印当前神殿ID
  console.log('StageDataSummaryTab - campusId:', campusId)
  console.log('StageDataSummaryTab - 地域配置:', CAMPUS_LOCATIONS[campusId])
  
  // campusId 实际传入的是神殿名称，直接使用
  const campusName = useMemo(() => {
    // 验证神殿名称是否存在于神殿列表中
    const campus = campuses.find(c => c.name === campusId)
    return campus ? campus.name : campusId
  }, [campusId, campuses])
  
  // 生成动态标题：XX神殿X月XX日-X月XX日任务完成明细表
  const taskTableTitle = useMemo(() => {
    const startMonth = startDate.month() + 1
    const startDay = startDate.date()
    const endMonth = endDate.month() + 1
    const endDay = endDate.date()
    
    return `${campusName}${startMonth}月${startDay}日-${endMonth}月${endDay}日任务完成明细表`
  }, [campusName, startDate, endDate])
  


  // 生成动态类目文本
  const taskCategories = useMemo(() => {
    const endMonth = endDate.month() + 1
    const endDay = endDate.date()
    
    return {
      task1: '总任务',
      task2: `截至${endMonth}月${endDay}日应完成`,
      task3: `截至${endMonth}月${endDay}日实际完成`,
      task4: '差额',
      task5: '任务完成率',
    }
  }, [endDate])

  // 任务完成情况数据
  const [taskData, setTaskData] = useState<TaskCompletionRow[]>([
    { key: 'task-1', category: '总任务', expense: 0, quantity: 0, income: 0, grossSignup: 0, visit: 0, netSignup: 0 },
    { key: 'task-2', category: '截至XX月XX日应完成', expense: 0, quantity: 0, income: 0, grossSignup: 0, visit: 0, netSignup: 0 },
    { key: 'task-3', category: '截至XX月XX日实际完成', expense: 0, quantity: 0, income: 0, grossSignup: 0, visit: 0, netSignup: 0 },
    { key: 'task-4', category: '差额', expense: 0, quantity: 0, income: 0, grossSignup: 0, visit: 0, netSignup: 0 },
    { key: 'task-5', category: '任务完成率', expense: 0, quantity: 0, income: 0, grossSignup: 0, visit: 0, netSignup: 0 },
  ])
  
  // 当月份变化时，更新类目文本
  useEffect(() => {
    setTaskData(prev => prev.map(row => {
      if (row.key === 'task-1') return { ...row, category: taskCategories.task1 }
      if (row.key === 'task-2') return { ...row, category: taskCategories.task2 }
      if (row.key === 'task-3') return { ...row, category: taskCategories.task3 }
      if (row.key === 'task-4') return { ...row, category: taskCategories.task4 }
      if (row.key === 'task-5') return { ...row, category: taskCategories.task5 }
      return row
    }))
  }, [taskCategories])

  // 百度-人群状态维度数据
  const [baiduCrowdData, setBaiduCrowdData] = useState<CrowdStatusRow[]>([
    { key: 'baidu-crowd-1', status: '在读', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-crowd-2', status: '应届', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-crowd-3', status: '待业', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-crowd-4', status: '在职/创业', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-crowd-5', status: '未标注', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-crowd-total', status: '合计', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
  ])

  // 新媒体-人群状态维度数据
  const [newmediaCrowdData, setNewmediaCrowdData] = useState<CrowdStatusRow[]>([
    { key: 'newmedia-crowd-1', status: '在读', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-crowd-2', status: '应届', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-crowd-3', status: '待业', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-crowd-4', status: '在职/创业', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-crowd-5', status: '未标注', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-crowd-total', status: '合计', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
  ])

  // 百度-学历维度数据
  const [baiduEducationData, setBaiduEducationData] = useState<EducationRow[]>([
    { key: 'baidu-edu-1', education: '初中', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-edu-2', education: '三校生', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-edu-3', education: '高中（普高）', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-edu-4', education: '大学生', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-edu-5', education: '未标注', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-edu-total', education: '合计', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
  ])

  // 新媒体-学历维度数据
  const [newmediaEducationData, setNewmediaEducationData] = useState<EducationRow[]>([
    { key: 'newmedia-edu-1', education: '初中', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-edu-2', education: '三校生', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-edu-3', education: '高中（普高）', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-edu-4', education: '大学生', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-edu-5', education: '未标注', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-edu-total', education: '合计', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
  ])

  // 百度-详细人群状态维度数据（学历+状态组合）
  const [baiduDetailedCrowdData, setBaiduDetailedCrowdData] = useState<DetailedCrowdStatusRow[]>([
    { key: 'baidu-detail-1', status: '初中-应届/在读', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-detail-2', status: '初中-待业', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-detail-3', status: '初中-在职', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-detail-4', status: '高中-应届', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-detail-5', status: '高中-在读', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-detail-6', status: '高中-待业', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-detail-7', status: '高中-在职', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-detail-8', status: '三校生-应届', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-detail-9', status: '三校生-在读', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-detail-10', status: '三校生-待业', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-detail-11', status: '三校生-在职', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-detail-12', status: '大学-待业', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-detail-13', status: '大学-应届', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-detail-14', status: '大学-在读', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-detail-15', status: '大学-在职', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-detail-16', status: '未标注', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'baidu-detail-total', status: '合计', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
  ])

  // 新媒体-详细人群状态维度数据（学历+状态组合）
  const [newmediaDetailedCrowdData, setNewmediaDetailedCrowdData] = useState<DetailedCrowdStatusRow[]>([
    { key: 'newmedia-detail-1', status: '初中-应届/在读', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-detail-2', status: '初中-待业', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-detail-3', status: '初中-在职', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-detail-4', status: '高中-应届', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-detail-5', status: '高中-在读', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-detail-6', status: '高中-待业', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-detail-7', status: '高中-在职', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-detail-8', status: '三校生-应届', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-detail-9', status: '三校生-在读', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-detail-10', status: '三校生-待业', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-detail-11', status: '三校生-在职', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-detail-12', status: '大学-待业', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-detail-13', status: '大学-应届', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-detail-14', status: '大学-在读', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-detail-15', status: '大学-在职', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-detail-16', status: '未标注', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { key: 'newmedia-detail-total', status: '合计', quantity: 0, ratio: '0%', visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
  ])

  // 百度-地域维度数据（单纯按地域分布计算）- 根据神殿动态生成
  const [baiduLocationData, setBaiduLocationData] = useState<LocationRow[]>([])

  // 新媒体-地域维度数据（单纯按地域分布计算）- 根据神殿动态生成
  const [newmediaLocationData, setNewmediaLocationData] = useState<LocationRow[]>([])

  // 百度-地域维度数据（按照意向的地域分布计算）- 根据神殿动态生成
  const [baiduLocationIntentData, setBaiduLocationIntentData] = useState<LocationRow[]>([])

  // 当神殿切换时，重置地域数据
  useEffect(() => {
    console.log('useEffect triggered - campusId:', campusId)
    console.log('useEffect - 生成新的地域数据')
    const newBaiduData = generateLocationData(campusId, 'baidu-loc')
    const newNewmediaData = generateLocationData(campusId, 'newmedia-loc')
    const newIntentData = generateIntentLocationData(campusId)
    console.log('useEffect - 百度地域数据:', newBaiduData)
    console.log('useEffect - 新媒体地域数据:', newNewmediaData)
    console.log('useEffect - 意向地域数据:', newIntentData)
    
    setBaiduLocationData(newBaiduData)
    setNewmediaLocationData(newNewmediaData)
    setBaiduLocationIntentData(newIntentData)
  }, [campusId])

  // =============== 自动获取任务完成和媒体投放数据 ===============
  const loadStageSummaryData = useCallback(async () => {
    if (!campusName || campusName === '未知神殿') return
    
    setLoading(true)
    try {
      const year = startDate.format('YYYY')
      const month = startDate.format('M')
      const endDay = endDate.date()
      const daysInMonth = startDate.daysInMonth()
      const startDateStr = startDate.format('YYYY-MM-DD')
      const endDateStr = endDate.format('YYYY-MM-DD')
      
      console.log('[阶段总表] 加载数据, 神殿:', campusName, '日期范围:', startDateStr, '-', endDateStr)
      
      // 1. 获取任务完成数据（传入日期范围）
      const taskCompletionData = await getTaskCompletionData(campusName, year, month, endDay, startDateStr, endDateStr)
      
      // 2. 获取媒体投放数据（传入日期范围）
      const mediaExpenseData = await getMediaExpenseData(campusName, year, month, endDay, startDateStr, endDateStr)
      
      // 3. 更新任务完成表格数据
      const calcRate = (actual: number, expected: number): string => {
        if (!expected || expected === 0) return '0%'
        return ((actual / expected) * 100).toFixed(2) + '%'
      }
      
      // 辅助函数：修复浮点数精度
      const fixNumber = (value: number): number => {
        return Math.round(value * 100) / 100
      }
      
      setTaskData([
        { 
          key: 'task-1', 
          category: taskCategories.task1, 
          expense: fixNumber(taskCompletionData.planExpense), 
          quantity: Math.round(taskCompletionData.planQuantity), 
          income: fixNumber(taskCompletionData.planIncome), 
          grossSignup: Math.round(taskCompletionData.planGrossSignup), 
          visit: Math.round(taskCompletionData.planVisit), 
          netSignup: Math.round(taskCompletionData.planNetSignup) 
        },
        { 
          key: 'task-2', 
          category: taskCategories.task2, 
          // 应完成 = 总任务 / 月天数 * 截止天数
          expense: fixNumber(taskCompletionData.planExpense / daysInMonth * endDay), 
          quantity: Math.round(taskCompletionData.planQuantity / daysInMonth * endDay), 
          income: fixNumber(taskCompletionData.planIncome / daysInMonth * endDay), 
          grossSignup: Math.round(taskCompletionData.planGrossSignup / daysInMonth * endDay), 
          visit: Math.round(taskCompletionData.planVisit / daysInMonth * endDay), 
          netSignup: Math.round(taskCompletionData.planNetSignup / daysInMonth * endDay) 
        },
        { 
          key: 'task-3', 
          category: taskCategories.task3, 
          expense: fixNumber(taskCompletionData.actualExpense), 
          quantity: Math.round(taskCompletionData.actualQuantity), 
          income: fixNumber(taskCompletionData.actualIncome), 
          grossSignup: Math.round(taskCompletionData.actualGrossSignup), 
          visit: Math.round(taskCompletionData.actualVisit), 
          netSignup: Math.round(taskCompletionData.actualNetSignup) 
        },
        { 
          key: 'task-4', 
          category: taskCategories.task4, 
          // 差额 = 实际完成 - 应完成
          expense: fixNumber(taskCompletionData.actualExpense - Math.round(taskCompletionData.planExpense / daysInMonth * endDay)), 
          quantity: Math.round(taskCompletionData.actualQuantity - Math.round(taskCompletionData.planQuantity / daysInMonth * endDay)), 
          income: fixNumber(taskCompletionData.actualIncome - Math.round(taskCompletionData.planIncome / daysInMonth * endDay)), 
          grossSignup: Math.round(taskCompletionData.actualGrossSignup - Math.round(taskCompletionData.planGrossSignup / daysInMonth * endDay)), 
          visit: Math.round(taskCompletionData.actualVisit - Math.round(taskCompletionData.planVisit / daysInMonth * endDay)), 
          netSignup: Math.round(taskCompletionData.actualNetSignup - Math.round(taskCompletionData.planNetSignup / daysInMonth * endDay)) 
        },
        { 
          key: 'task-5', 
          category: taskCategories.task5, 
          // 任务完成率 = 实际完成 / 总任务（存储为小数，如0.1478表示14.78%）
          expense: taskCompletionData.planExpense > 0 ? taskCompletionData.actualExpense / taskCompletionData.planExpense : 0, 
          quantity: taskCompletionData.planQuantity > 0 ? taskCompletionData.actualQuantity / taskCompletionData.planQuantity : 0, 
          income: taskCompletionData.planIncome > 0 ? taskCompletionData.actualIncome / taskCompletionData.planIncome : 0, 
          grossSignup: taskCompletionData.planGrossSignup > 0 ? taskCompletionData.actualGrossSignup / taskCompletionData.planGrossSignup : 0, 
          visit: taskCompletionData.planVisit > 0 ? taskCompletionData.actualVisit / taskCompletionData.planVisit : 0, 
          netSignup: taskCompletionData.planNetSignup > 0 ? taskCompletionData.actualNetSignup / taskCompletionData.planNetSignup : 0 
        },
      ])
      
      // 4. 更新媒体投放表格数据
      const calcConsultRate = (completed: number, planned: number): string => {
        if (!planned || planned === 0) return '0%'
        return ((completed / planned) * 100).toFixed(2) + '%'
      }
      
      const calcCost = (expense: number, count: number): string => {
        if (!count || count === 0) return '0'
        return (expense / count).toFixed(2)
      }
      
      const calcROI = (income: number, expense: number): string => {
        if (!expense || expense === 0) return '1:0'
        return '1:' + (income / expense).toFixed(2)
      }
      
      // 计算合计
      const semTotal = calcSEMTotal(mediaExpenseData)
      const newmediaTotal = calcNewMediaTotal(mediaExpenseData)
      const grandTotal = calcGrandTotal(mediaExpenseData)
      
      const calcNetSignupRate = (netSignup: number, completedConsult: number): string => {
        if (!completedConsult || completedConsult === 0) return '0%'
        return ((netSignup / completedConsult) * 100).toFixed(2) + '%'
      }
      
      const transformMediaRow = (data: MediaExpenseData, key: string): MediaRow => ({
        key,
        mediaType: data.mediaType,
        specificMedia: data.specificMedia,
        expense: Number(data.expense.toFixed(2)),  // 保留两位小数
        plannedConsult: data.plannedConsult,
        completedConsult: data.completedConsult,
        consultCompletionRate: calcConsultRate(data.completedConsult, data.plannedConsult),
        consultCost: calcCost(data.expense, data.completedConsult),
        grossSignup: data.grossSignup,
        netSignup: data.netSignup,
        netSignupCost: calcCost(data.expense, data.netSignup),
        targetIncome: Number(data.targetIncome.toFixed(2)),  // 保留两位小数
        actualIncome: Number(data.actualIncome.toFixed(2)),  // 保留两位小数
        roi: calcROI(data.actualIncome, data.expense),
        netSignupCompletionRate: calcNetSignupRate(data.netSignup, data.completedConsult),
      })
      
      setMediaData([
        // 传统大搜
        transformMediaRow(mediaExpenseData[0], 'media-1'),  // 百度
        transformMediaRow(mediaExpenseData[1], 'media-2'),  // 百教网
        transformMediaRow(mediaExpenseData[2], 'media-3'),  // 知了好学
        transformMediaRow(mediaExpenseData[3], 'media-4'),  // 坦途网
        transformMediaRow(mediaExpenseData[4], 'media-5'),  // 市场口碑
        transformMediaRow(semTotal, 'media-total-1'),       // 传统大搜合计
        // 新媒体
        transformMediaRow(mediaExpenseData[5], 'media-6'),  // 抖音
        transformMediaRow(mediaExpenseData[6], 'media-7'),  // 快手
        transformMediaRow(mediaExpenseData[7], 'media-8'),  // 微信视频号
        transformMediaRow(mediaExpenseData[8], 'media-9'),  // B站
        transformMediaRow(mediaExpenseData[9], 'media-10'), // 小红书
        transformMediaRow(newmediaTotal, 'media-total-2'),  // 新媒体合计
        // 总计
        transformMediaRow(grandTotal, 'media-grand-total'),
      ])
      
      // 5. 获取分析数据（人群状态、学历、地域维度）
      console.log('[阶段总表] 获取分析数据:', startDateStr, '-', endDateStr)
      const analysisData = await getAnalysisData(campusName, startDateStr, endDateStr)
      console.log('[阶段总表] 分析数据:', analysisData)
      
      // 辅助函数：计算转化率
      const calcConversionRate = (numerator: number, denominator: number): string => {
        if (!denominator || denominator === 0) return '0%'
        return ((numerator / denominator) * 100).toFixed(1) + '%'
      }
      
      // 6. 更新人群状态维度数据
      const transformCrowdData = (data: ApiCrowdStatusRow[], prefix: string): CrowdStatusRow[] => {
        const totalQuantity = data.reduce((sum, r) => sum + r.quantity, 0)
        const totalVisit = data.reduce((sum, r) => sum + r.visit, 0)
        const totalSignup = data.reduce((sum, r) => sum + r.signup, 0)
        
        return [
          ...data.map((r, i) => ({
            key: `${prefix}-${i + 1}`,
            status: r.status,
            quantity: r.quantity,
            visit: r.visit,
            visitConversionRate: calcConversionRate(r.visit, r.quantity),
            signup: r.signup,
            signupConversionRate: calcConversionRate(r.signup, r.quantity),
          })),
          {
            key: `${prefix}-total`,
            status: '合计',
            quantity: totalQuantity,
            visit: totalVisit,
            visitConversionRate: calcConversionRate(totalVisit, totalQuantity),
            signup: totalSignup,
            signupConversionRate: calcConversionRate(totalSignup, totalQuantity),
          }
        ]
      }
      
      setBaiduCrowdData(transformCrowdData(analysisData.baiduCrowdData, 'baidu-crowd'))
      setNewmediaCrowdData(transformCrowdData(analysisData.newmediaCrowdData, 'newmedia-crowd'))
      
      // 7. 更新学历维度数据
      const transformEducationData = (data: ApiEducationRow[], prefix: string): EducationRow[] => {
        const totalQuantity = data.reduce((sum, r) => sum + r.quantity, 0)
        const totalVisit = data.reduce((sum, r) => sum + r.visit, 0)
        const totalSignup = data.reduce((sum, r) => sum + r.signup, 0)
        
        return [
          ...data.map((r, i) => ({
            key: `${prefix}-${i + 1}`,
            education: r.education === '高中' ? '高中（普高）' : r.education,
            quantity: r.quantity,
            visit: r.visit,
            visitConversionRate: calcConversionRate(r.visit, r.quantity),
            signup: r.signup,
            signupConversionRate: calcConversionRate(r.signup, r.quantity),
          })),
          {
            key: `${prefix}-total`,
            education: '合计',
            quantity: totalQuantity,
            visit: totalVisit,
            visitConversionRate: calcConversionRate(totalVisit, totalQuantity),
            signup: totalSignup,
            signupConversionRate: calcConversionRate(totalSignup, totalQuantity),
          }
        ]
      }
      
      setBaiduEducationData(transformEducationData(analysisData.baiduEducationData, 'baidu-edu'))
      setNewmediaEducationData(transformEducationData(analysisData.newmediaEducationData, 'newmedia-edu'))
      
      // 8. 更新详细人群状态数据
      const transformDetailedCrowdData = (data: ApiDetailedCrowdStatusRow[], prefix: string): DetailedCrowdStatusRow[] => {
        const totalQuantity = data.reduce((sum, r) => sum + r.quantity, 0)
        const totalVisit = data.reduce((sum, r) => sum + r.visit, 0)
        const totalSignup = data.reduce((sum, r) => sum + r.signup, 0)
        
        return [
          ...data.map((r, i) => ({
            key: `${prefix}-${i + 1}`,
            status: r.status,
            quantity: r.quantity,
            ratio: r.ratio,
            visit: r.visit,
            visitConversionRate: calcConversionRate(r.visit, r.quantity),
            signup: r.signup,
            signupConversionRate: calcConversionRate(r.signup, r.quantity),
          })),
          {
            key: `${prefix}-total`,
            status: '合计',
            quantity: totalQuantity,
            ratio: '100%',
            visit: totalVisit,
            visitConversionRate: calcConversionRate(totalVisit, totalQuantity),
            signup: totalSignup,
            signupConversionRate: calcConversionRate(totalSignup, totalQuantity),
          }
        ]
      }
      
      setBaiduDetailedCrowdData(transformDetailedCrowdData(analysisData.baiduDetailedCrowdData, 'baidu-detail'))
      setNewmediaDetailedCrowdData(transformDetailedCrowdData(analysisData.newmediaDetailedCrowdData, 'newmedia-detail'))
      
      // 9. 更新地域维度数据
      const transformLocationData = (data: ApiLocationRow[], prefix: string): LocationRow[] => {
        const totalQuantity = data.reduce((sum, r) => sum + r.quantity, 0)
        const totalVisit = data.reduce((sum, r) => sum + r.visit, 0)
        const totalSignup = data.reduce((sum, r) => sum + r.signup, 0)
        
        return [
          ...data.map((r, i) => ({
            key: `${prefix}-${i + 1}`,
            location: r.location,
            quantity: r.quantity,
            ratio: r.ratio,
            visit: r.visit,
            visitConversionRate: calcConversionRate(r.visit, r.quantity),
            signup: r.signup,
            signupConversionRate: calcConversionRate(r.signup, r.quantity),
          })),
          {
            key: `${prefix}-total`,
            location: '合计',
            quantity: totalQuantity,
            ratio: '100%',
            visit: totalVisit,
            visitConversionRate: calcConversionRate(totalVisit, totalQuantity),
            signup: totalSignup,
            signupConversionRate: calcConversionRate(totalSignup, totalQuantity),
          }
        ]
      }
      
      if (analysisData.baiduLocationData.length > 0) {
        setBaiduLocationData(transformLocationData(analysisData.baiduLocationData, 'baidu-loc'))
      }
      if (analysisData.newmediaLocationData.length > 0) {
        setNewmediaLocationData(transformLocationData(analysisData.newmediaLocationData, 'newmedia-loc'))
      }
      if (analysisData.baiduLocationIntentData.length > 0) {
        setBaiduLocationIntentData(transformLocationData(analysisData.baiduLocationIntentData, 'baidu-intent-loc'))
      }
      
      console.log('[阶段总表] 数据加载完成')
    } catch (error) {
      console.error('[阶段总表] 数据加载失败:', error)
      message.error('数据加载失败，请刷新重试')
    } finally {
      setLoading(false)
    }
  }, [campusName, startDate, endDate, taskCategories])
  
  // 当神殿或日期变化时自动加载数据
  useEffect(() => {
    loadStageSummaryData()
  }, [loadStageSummaryData])

  // 各媒体投放情况数据
  const [mediaData, setMediaData] = useState<MediaRow[]>([
    // 传统大课
    { key: 'media-1', mediaType: '传统大搜', specificMedia: '百度', expense: 0, plannedConsult: 0, completedConsult: 0, consultCompletionRate: '0%', consultCost: '0', grossSignup: 0, netSignup: 0, netSignupCost: '0', targetIncome: 0, actualIncome: 0, roi: '1:0', netSignupCompletionRate: '0%' },
    { key: 'media-2', mediaType: '', specificMedia: '百教网', expense: 0, plannedConsult: 0, completedConsult: 0, consultCompletionRate: '0%', consultCost: '0', grossSignup: 0, netSignup: 0, netSignupCost: '0', targetIncome: 0, actualIncome: 0, roi: '1:0', netSignupCompletionRate: '0%' },
    { key: 'media-3', mediaType: '', specificMedia: '知了好学', expense: 0, plannedConsult: 0, completedConsult: 0, consultCompletionRate: '0%', consultCost: '0', grossSignup: 0, netSignup: 0, netSignupCost: '0', targetIncome: 0, actualIncome: 0, roi: '1:0', netSignupCompletionRate: '0%' },
    { key: 'media-4', mediaType: '', specificMedia: '坦途网', expense: 0, plannedConsult: 0, completedConsult: 0, consultCompletionRate: '0%', consultCost: '0', grossSignup: 0, netSignup: 0, netSignupCost: '0', targetIncome: 0, actualIncome: 0, roi: '1:0', netSignupCompletionRate: '0%' },
    { key: 'media-5', mediaType: '', specificMedia: '市场口碑', expense: 0, plannedConsult: 0, completedConsult: 0, consultCompletionRate: '0%', consultCost: '0', grossSignup: 0, netSignup: 0, netSignupCost: '0', targetIncome: 0, actualIncome: 0, roi: '1:0', netSignupCompletionRate: '0%' },
    { key: 'media-total-1', mediaType: '', specificMedia: '合计', expense: 0, plannedConsult: 0, completedConsult: 0, consultCompletionRate: '0%', consultCost: '0', grossSignup: 0, netSignup: 0, netSignupCost: '0', targetIncome: 0, actualIncome: 0, roi: '1:0', netSignupCompletionRate: '0%' },
    // 新媒体
    { key: 'media-6', mediaType: '新媒体', specificMedia: '抖音', expense: 0, plannedConsult: 0, completedConsult: 0, consultCompletionRate: '0%', consultCost: '0', grossSignup: 0, netSignup: 0, netSignupCost: '0', targetIncome: 0, actualIncome: 0, roi: '1:0', netSignupCompletionRate: '0%' },
    { key: 'media-7', mediaType: '', specificMedia: '快手', expense: 0, plannedConsult: 0, completedConsult: 0, consultCompletionRate: '0%', consultCost: '0', grossSignup: 0, netSignup: 0, netSignupCost: '0', targetIncome: 0, actualIncome: 0, roi: '1:0', netSignupCompletionRate: '0%' },
    { key: 'media-8', mediaType: '', specificMedia: '微信视频号', expense: 0, plannedConsult: 0, completedConsult: 0, consultCompletionRate: '0%', consultCost: '0', grossSignup: 0, netSignup: 0, netSignupCost: '0', targetIncome: 0, actualIncome: 0, roi: '1:0', netSignupCompletionRate: '0%' },
    { key: 'media-9', mediaType: '', specificMedia: 'B站', expense: 0, plannedConsult: 0, completedConsult: 0, consultCompletionRate: '0%', consultCost: '0', grossSignup: 0, netSignup: 0, netSignupCost: '0', targetIncome: 0, actualIncome: 0, roi: '1:0', netSignupCompletionRate: '0%' },
    { key: 'media-10', mediaType: '', specificMedia: '小红书', expense: 0, plannedConsult: 0, completedConsult: 0, consultCompletionRate: '0%', consultCost: '0', grossSignup: 0, netSignup: 0, netSignupCost: '0', targetIncome: 0, actualIncome: 0, roi: '1:0', netSignupCompletionRate: '0%' },
    { key: 'media-total-2', mediaType: '', specificMedia: '合计', expense: 0, plannedConsult: 0, completedConsult: 0, consultCompletionRate: '0%', consultCost: '0', grossSignup: 0, netSignup: 0, netSignupCost: '0', targetIncome: 0, actualIncome: 0, roi: '1:0', netSignupCompletionRate: '0%' },
    // 总计
    { key: 'media-grand-total', mediaType: '合计', specificMedia: '', expense: 0, plannedConsult: 0, completedConsult: 0, consultCompletionRate: '0%', consultCost: '0', grossSignup: 0, netSignup: 0, netSignupCost: '0', targetIncome: 0, actualIncome: 0, roi: '1:0', netSignupCompletionRate: '0%' },
  ])

  // 更新人群状态维度数据
  const handleCrowdUpdate = (
    dataKey: 'baidu' | 'newmedia',
    rowKey: string,
    field: keyof CrowdStatusRow,
    value: number
  ) => {
    const setData = dataKey === 'baidu' ? setBaiduCrowdData : setNewmediaCrowdData
    
    setData((prev) => {
      const updated = prev.map((row) => {
        if (row.key === rowKey) {
          const updatedRow = { ...row, [field]: value }
          
          // 自动计算转化率
          // 上门转化率 = 上门 / 量
          if (updatedRow.quantity > 0) {
            updatedRow.visitConversionRate = ((updatedRow.visit / updatedRow.quantity) * 100).toFixed(2) + '%'
          } else {
            updatedRow.visitConversionRate = '0%'
          }
          
          // 报名转化率 = 报名 / 量
          if (updatedRow.quantity > 0) {
            updatedRow.signupConversionRate = ((updatedRow.signup / updatedRow.quantity) * 100).toFixed(2) + '%'
          } else {
            updatedRow.signupConversionRate = '0%'
          }
          
          return updatedRow
        }
        return row
      })
      
      // 计算合计行
      const dataWithoutTotal = updated.filter(r => !r.key.includes('total'))
      const total = dataWithoutTotal.reduce((acc, row) => ({
        quantity: acc.quantity + row.quantity,
        visit: acc.visit + row.visit,
        signup: acc.signup + row.signup,
      }), { quantity: 0, visit: 0, signup: 0 })
      
      return updated.map(row => {
        if (row.key.includes('total')) {
          return {
            ...row,
            quantity: total.quantity,
            visit: total.visit,
            signup: total.signup,
            visitConversionRate: total.quantity > 0 ? ((total.visit / total.quantity) * 100).toFixed(2) + '%' : '0%',
            signupConversionRate: total.quantity > 0 ? ((total.signup / total.quantity) * 100).toFixed(2) + '%' : '0%',
          }
        }
        return row
      })
    })
  }

  // 更新学历维度数据
  const handleEducationUpdate = (
    dataKey: 'baidu' | 'newmedia',
    rowKey: string,
    field: keyof EducationRow,
    value: number
  ) => {
    const setData = dataKey === 'baidu' ? setBaiduEducationData : setNewmediaEducationData
    
    setData((prev) => {
      const updated = prev.map((row) => {
        if (row.key === rowKey) {
          const updatedRow = { ...row, [field]: value }
          
          // 自动计算转化率
          // 上门转化率 = 上门 / 量
          if (updatedRow.quantity > 0) {
            updatedRow.visitConversionRate = ((updatedRow.visit / updatedRow.quantity) * 100).toFixed(2) + '%'
          } else {
            updatedRow.visitConversionRate = '0%'
          }
          
          // 报名转化率 = 报名 / 量
          if (updatedRow.quantity > 0) {
            updatedRow.signupConversionRate = ((updatedRow.signup / updatedRow.quantity) * 100).toFixed(2) + '%'
          } else {
            updatedRow.signupConversionRate = '0%'
          }
          
          return updatedRow
        }
        return row
      })
      
      // 计算合计行
      const dataWithoutTotal = updated.filter(r => !r.key.includes('total'))
      const total = dataWithoutTotal.reduce((acc, row) => ({
        quantity: acc.quantity + row.quantity,
        visit: acc.visit + row.visit,
        signup: acc.signup + row.signup,
      }), { quantity: 0, visit: 0, signup: 0 })
      
      return updated.map(row => {
        if (row.key.includes('total')) {
          return {
            ...row,
            quantity: total.quantity,
            visit: total.visit,
            signup: total.signup,
            visitConversionRate: total.quantity > 0 ? ((total.visit / total.quantity) * 100).toFixed(2) + '%' : '0%',
            signupConversionRate: total.quantity > 0 ? ((total.signup / total.quantity) * 100).toFixed(2) + '%' : '0%',
          }
        }
        return row
      })
    })
  }

  // 更新详细人群状态维度数据
  const handleDetailedCrowdUpdate = (
    dataKey: 'baidu' | 'newmedia',
    rowKey: string,
    field: keyof DetailedCrowdStatusRow,
    value: number
  ) => {
    const setData = dataKey === 'baidu' ? setBaiduDetailedCrowdData : setNewmediaDetailedCrowdData
    
    setData((prev) => {
      const updated = prev.map((row) => {
        if (row.key === rowKey) {
          const updatedRow = { ...row, [field]: value }
          
          // 自动计算转化率和占比
          // 上门转化率 = 上门 / 量
          if (updatedRow.quantity > 0) {
            updatedRow.visitConversionRate = ((updatedRow.visit / updatedRow.quantity) * 100).toFixed(2) + '%'
          } else {
            updatedRow.visitConversionRate = '0%'
          }
          
          // 报名转化率 = 报名 / 量
          if (updatedRow.quantity > 0) {
            updatedRow.signupConversionRate = ((updatedRow.signup / updatedRow.quantity) * 100).toFixed(2) + '%'
          } else {
            updatedRow.signupConversionRate = '0%'
          }
          
          return updatedRow
        }
        return row
      })
      
      // 计算合计行和占比
      const dataWithoutTotal = updated.filter(r => !r.key.includes('total'))
      const total = dataWithoutTotal.reduce((acc, row) => ({
        quantity: acc.quantity + row.quantity,
        visit: acc.visit + row.visit,
        signup: acc.signup + row.signup,
      }), { quantity: 0, visit: 0, signup: 0 })
      
      return updated.map(row => {
        if (row.key.includes('total')) {
          return {
            ...row,
            quantity: total.quantity,
            visit: total.visit,
            signup: total.signup,
            ratio: '0%',
            visitConversionRate: total.quantity > 0 ? ((total.visit / total.quantity) * 100).toFixed(2) + '%' : '0%',
            signupConversionRate: total.quantity > 0 ? ((total.signup / total.quantity) * 100).toFixed(2) + '%' : '0%',
          }
        } else {
          // 计算占比 = 当前行量 / 总量
          return {
            ...row,
            ratio: total.quantity > 0 ? ((row.quantity / total.quantity) * 100).toFixed(2) + '%' : '0%',
          }
        }
      })
    })
  }

  // 更新地域维度数据
  const handleLocationUpdate = (
    dataKey: 'baidu' | 'newmedia' | 'baidu-intent',
    rowKey: string,
    field: keyof LocationRow,
    value: number
  ) => {
    let setData
    if (dataKey === 'baidu') {
      setData = setBaiduLocationData
    } else if (dataKey === 'newmedia') {
      setData = setNewmediaLocationData
    } else {
      setData = setBaiduLocationIntentData
    }
    
    setData((prev) => {
      const updated = prev.map((row) => {
        if (row.key === rowKey) {
          const updatedRow = { ...row, [field]: value }
          
          // 自动计算转化率
          // 上门转化率 = 上门 / 量
          if (updatedRow.quantity > 0) {
            updatedRow.visitConversionRate = ((updatedRow.visit / updatedRow.quantity) * 100).toFixed(2) + '%'
          } else {
            updatedRow.visitConversionRate = '0%'
          }
          
          // 报名转化率 = 报名 / 量
          if (updatedRow.quantity > 0) {
            updatedRow.signupConversionRate = ((updatedRow.signup / updatedRow.quantity) * 100).toFixed(2) + '%'
          } else {
            updatedRow.signupConversionRate = '0%'
          }
          
          return updatedRow
        }
        return row
      })
      
      // 计算合计行和占比
      const dataWithoutTotal = updated.filter(r => !r.key.includes('total'))
      const total = dataWithoutTotal.reduce((acc, row) => ({
        quantity: acc.quantity + row.quantity,
        visit: acc.visit + row.visit,
        signup: acc.signup + row.signup,
      }), { quantity: 0, visit: 0, signup: 0 })
      
      return updated.map(row => {
        if (row.key.includes('total')) {
          return {
            ...row,
            quantity: total.quantity,
            visit: total.visit,
            signup: total.signup,
            ratio: '0%',
            visitConversionRate: total.quantity > 0 ? ((total.visit / total.quantity) * 100).toFixed(2) + '%' : '0%',
            signupConversionRate: total.quantity > 0 ? ((total.signup / total.quantity) * 100).toFixed(2) + '%' : '0%',
          }
        } else {
          // 计算占比 = 当前行量 / 总量
          return {
            ...row,
            ratio: total.quantity > 0 ? ((row.quantity / total.quantity) * 100).toFixed(2) + '%' : '0%',
          }
        }
      })
    })
  }

  // 更新任务完成情况数据
  const handleTaskUpdate = (rowKey: string, field: keyof TaskCompletionRow, value: number) => {
    setTaskData((prev) => {
      const updated = prev.map((row) => {
        if (row.key === rowKey) {
          return { ...row, [field]: value }
        }
        return row
      })
      
      // 自动计算差额和完成率
      const task1 = updated.find(r => r.key === 'task-1')
      const task2 = updated.find(r => r.key === 'task-2')
      const task3 = updated.find(r => r.key === 'task-3')
      
      if (task1 && task2 && task3) {
        return updated.map(row => {
          if (row.key === 'task-4') {
            // 差额 = 实际完成 - 应完成
            return {
              ...row,
              expense: task3.expense - task2.expense,
              quantity: task3.quantity - task2.quantity,
              income: task3.income - task2.income,
              grossSignup: task3.grossSignup - task2.grossSignup,
              visit: task3.visit - task2.visit,
              netSignup: task3.netSignup - task2.netSignup,
            }
          }
          if (row.key === 'task-5') {
            // 任务完成率 = 实际完成 / 总任务
            return {
              ...row,
              expense: task1.expense > 0 ? task3.expense / task1.expense : 0,
              quantity: task1.quantity > 0 ? task3.quantity / task1.quantity : 0,
              income: task1.income > 0 ? task3.income / task1.income : 0,
              grossSignup: task1.grossSignup > 0 ? task3.grossSignup / task1.grossSignup : 0,
              visit: task1.visit > 0 ? task3.visit / task1.visit : 0,
              netSignup: task1.netSignup > 0 ? task3.netSignup / task1.netSignup : 0,
            }
          }
          return row
        })
      }
      
      return updated
    })
  }

  // 更新媒体投放数据
  const handleMediaUpdate = (rowKey: string, field: keyof MediaRow, value: number) => {
    setMediaData((prev) => {
      const updated = prev.map((row) => {
        if (row.key === rowKey) {
          // 如果是花费、目标收入或实际收入字段，保留两位小数
          const formattedValue = (field === 'expense' || field === 'targetIncome' || field === 'actualIncome') 
            ? Number(value.toFixed(2)) 
            : value
          
          const updatedRow = { ...row, [field]: formattedValue }
          
          // 自动计算派生字段
          // 咨询量完成率 = 完成咨询量 / 计划咨询量
          if (updatedRow.plannedConsult > 0) {
            updatedRow.consultCompletionRate = ((updatedRow.completedConsult / updatedRow.plannedConsult) * 100).toFixed(2) + '%'
          } else {
            updatedRow.consultCompletionRate = '0%'
          }
          
          // 咨询量成本 = 花费 / 完成咨询量
          if (updatedRow.completedConsult > 0) {
            updatedRow.consultCost = (updatedRow.expense / updatedRow.completedConsult).toFixed(2)
          } else {
            updatedRow.consultCost = '0'
          }
          
          // 净报名成本 = 花费 / 净报名
          if (updatedRow.netSignup > 0) {
            updatedRow.netSignupCost = (updatedRow.expense / updatedRow.netSignup).toFixed(2)
          } else {
            updatedRow.netSignupCost = '0'
          }
          
          // ROI = 实际收入 / 花费
          if (updatedRow.expense > 0) {
            updatedRow.roi = '1:' + (updatedRow.actualIncome / updatedRow.expense).toFixed(2)
          } else {
            updatedRow.roi = '1:0'
          }
          
          // 净报名转化率 = 净报名 / 完成咨询量
          if (updatedRow.completedConsult > 0) {
            updatedRow.netSignupCompletionRate = ((updatedRow.netSignup / updatedRow.completedConsult) * 100).toFixed(2) + '%'
          } else {
            updatedRow.netSignupCompletionRate = '0%'
          }
          
          return updatedRow
        }
        return row
      })
      
      // 计算合计行
      return calculateMediaTotals(updated)
    })
  }
  
  // 计算媒体数据的合计
  const calculateMediaTotals = (data: MediaRow[]): MediaRow[] => {
    // 传统大课合计
    const traditionalMedia = data.filter(r => ['media-1', 'media-2', 'media-3', 'media-4', 'media-5'].includes(r.key))
    const traditionalTotal = traditionalMedia.reduce((acc, row) => ({
      expense: acc.expense + row.expense,
      plannedConsult: acc.plannedConsult + row.plannedConsult,
      completedConsult: acc.completedConsult + row.completedConsult,
      grossSignup: acc.grossSignup + row.grossSignup,
      netSignup: acc.netSignup + row.netSignup,
      targetIncome: acc.targetIncome + row.targetIncome,
      actualIncome: acc.actualIncome + row.actualIncome,
    }), { expense: 0, plannedConsult: 0, completedConsult: 0, grossSignup: 0, netSignup: 0, targetIncome: 0, actualIncome: 0 })
    
    // 新媒体合计
    const newMedia = data.filter(r => ['media-6', 'media-7', 'media-8', 'media-9', 'media-10'].includes(r.key))
    const newMediaTotal = newMedia.reduce((acc, row) => ({
      expense: acc.expense + row.expense,
      plannedConsult: acc.plannedConsult + row.plannedConsult,
      completedConsult: acc.completedConsult + row.completedConsult,
      grossSignup: acc.grossSignup + row.grossSignup,
      netSignup: acc.netSignup + row.netSignup,
      targetIncome: acc.targetIncome + row.targetIncome,
      actualIncome: acc.actualIncome + row.actualIncome,
    }), { expense: 0, plannedConsult: 0, completedConsult: 0, grossSignup: 0, netSignup: 0, targetIncome: 0, actualIncome: 0 })
    
    // 总计
    const grandTotal = {
      expense: traditionalTotal.expense + newMediaTotal.expense,
      plannedConsult: traditionalTotal.plannedConsult + newMediaTotal.plannedConsult,
      completedConsult: traditionalTotal.completedConsult + newMediaTotal.completedConsult,
      grossSignup: traditionalTotal.grossSignup + newMediaTotal.grossSignup,
      netSignup: traditionalTotal.netSignup + newMediaTotal.netSignup,
      targetIncome: traditionalTotal.targetIncome + newMediaTotal.targetIncome,
      actualIncome: traditionalTotal.actualIncome + newMediaTotal.actualIncome,
    }
    
    return data.map(row => {
      if (row.key === 'media-total-1') {
        return {
          ...row,
          expense: Number(traditionalTotal.expense.toFixed(2)),
          plannedConsult: traditionalTotal.plannedConsult,
          completedConsult: traditionalTotal.completedConsult,
          grossSignup: traditionalTotal.grossSignup,
          netSignup: traditionalTotal.netSignup,
          targetIncome: Number(traditionalTotal.targetIncome.toFixed(2)),
          actualIncome: Number(traditionalTotal.actualIncome.toFixed(2)),
          consultCompletionRate: traditionalTotal.plannedConsult > 0 ? ((traditionalTotal.completedConsult / traditionalTotal.plannedConsult) * 100).toFixed(2) + '%' : '0%',
          consultCost: traditionalTotal.completedConsult > 0 ? (traditionalTotal.expense / traditionalTotal.completedConsult).toFixed(2) : '0',
          netSignupCost: traditionalTotal.netSignup > 0 ? (traditionalTotal.expense / traditionalTotal.netSignup).toFixed(2) : '0',
          roi: traditionalTotal.expense > 0 ? '1:' + (traditionalTotal.actualIncome / traditionalTotal.expense).toFixed(2) : '1:0',
          netSignupCompletionRate: traditionalTotal.completedConsult > 0 ? ((traditionalTotal.netSignup / traditionalTotal.completedConsult) * 100).toFixed(2) + '%' : '0%',
        }
      }
      if (row.key === 'media-total-2') {
        return {
          ...row,
          expense: Number(newMediaTotal.expense.toFixed(2)),
          plannedConsult: newMediaTotal.plannedConsult,
          completedConsult: newMediaTotal.completedConsult,
          grossSignup: newMediaTotal.grossSignup,
          netSignup: newMediaTotal.netSignup,
          targetIncome: Number(newMediaTotal.targetIncome.toFixed(2)),
          actualIncome: Number(newMediaTotal.actualIncome.toFixed(2)),
          consultCompletionRate: newMediaTotal.plannedConsult > 0 ? ((newMediaTotal.completedConsult / newMediaTotal.plannedConsult) * 100).toFixed(2) + '%' : '0%',
          consultCost: newMediaTotal.completedConsult > 0 ? (newMediaTotal.expense / newMediaTotal.completedConsult).toFixed(2) : '0',
          netSignupCost: newMediaTotal.netSignup > 0 ? (newMediaTotal.expense / newMediaTotal.netSignup).toFixed(2) : '0',
          roi: newMediaTotal.expense > 0 ? '1:' + (newMediaTotal.actualIncome / newMediaTotal.expense).toFixed(2) : '1:0',
          netSignupCompletionRate: newMediaTotal.completedConsult > 0 ? ((newMediaTotal.netSignup / newMediaTotal.completedConsult) * 100).toFixed(2) + '%' : '0%',
        }
      }
      if (row.key === 'media-grand-total') {
        return {
          ...row,
          expense: Number(grandTotal.expense.toFixed(2)),
          plannedConsult: grandTotal.plannedConsult,
          completedConsult: grandTotal.completedConsult,
          grossSignup: grandTotal.grossSignup,
          netSignup: grandTotal.netSignup,
          targetIncome: Number(grandTotal.targetIncome.toFixed(2)),
          actualIncome: Number(grandTotal.actualIncome.toFixed(2)),
          consultCompletionRate: grandTotal.plannedConsult > 0 ? ((grandTotal.completedConsult / grandTotal.plannedConsult) * 100).toFixed(2) + '%' : '0%',
          consultCost: grandTotal.completedConsult > 0 ? (grandTotal.expense / grandTotal.completedConsult).toFixed(2) : '0',
          netSignupCost: grandTotal.netSignup > 0 ? (grandTotal.expense / grandTotal.netSignup).toFixed(2) : '0',
          roi: grandTotal.expense > 0 ? '1:' + (grandTotal.actualIncome / grandTotal.expense).toFixed(2) : '1:0',
          netSignupCompletionRate: grandTotal.completedConsult > 0 ? ((grandTotal.netSignup / grandTotal.completedConsult) * 100).toFixed(2) + '%' : '0%',
        }
      }
      return row
    })
  }

  // 渲染人群状态/学历维度的可编辑单元格
  const renderDimensionEditableNumber = (
    record: CrowdStatusRow | EducationRow,
    field: 'quantity' | 'visit' | 'signup',
    updateHandler: (rowKey: string, field: any, value: number) => void
  ) => {
    // 合计行不可编辑
    if (record.key.includes('total')) {
      const value = record[field]
      const isZero = value === 0
      return <span style={{ fontWeight: 'bold', color: isZero ? '#999' : '#C00000' }}>{value}</span>
    }

    // 改为只读显示
    const value = record[field]
    const isZero = value === 0
    return <span style={{ color: isZero ? '#999' : '#000' }}>{value}</span>
  }

  // 渲染百分比值（零值显示为灰色）
  const renderPercentage = (value: string, isTotalRow: boolean = false) => {
    const isZero = value === '0%' || value === '0.00%'
    const color = isZero ? '#999' : (isTotalRow ? '#C00000' : '#000')
    const fontWeight = isTotalRow ? 'bold' : 'normal'
    return <span style={{ color, fontWeight }}>{value}</span>
  }

  // 渲染数值（零值显示为灰色）
  const renderNumber = (value: number | string, isTotalRow: boolean = false) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    const isZero = numValue === 0 || value === '0'
    const color = isZero ? '#999' : (isTotalRow ? '#C00000' : '#000')
    const fontWeight = isTotalRow ? 'bold' : 'normal'
    return <span style={{ color, fontWeight }}>{value}</span>
  }

  // 渲染详细人群状态维度的可编辑单元格
  const renderDetailedDimensionEditableNumber = (
    record: DetailedCrowdStatusRow,
    field: 'quantity' | 'visit' | 'signup',
    updateHandler: (rowKey: string, field: any, value: number) => void
  ) => {
    // 合计行不可编辑
    if (record.key.includes('total')) {
      const value = record[field]
      const isZero = value === 0
      return <span style={{ fontWeight: 'bold', color: isZero ? '#999' : '#C00000' }}>{value}</span>
    }

    // 改为只读显示
    const value = record[field]
    const isZero = value === 0
    return <span style={{ color: isZero ? '#999' : '#000' }}>{value}</span>
  }

  // 渲染地域维度的可编辑单元格
  const renderLocationEditableNumber = (
    record: LocationRow,
    field: 'quantity' | 'visit' | 'signup',
    updateHandler: (rowKey: string, field: any, value: number) => void
  ) => {
    // 合计行不可编辑
    if (record.key.includes('total')) {
      const value = record[field]
      const isZero = value === 0
      return <span style={{ fontWeight: 'bold', color: isZero ? '#999' : '#C00000' }}>{value}</span>
    }

    // 改为只读显示
    const value = record[field]
    const isZero = value === 0
    return <span style={{ color: isZero ? '#999' : '#000' }}>{value}</span>
  }

  // 人群状态维度表格列
  const createCrowdColumns = (dataKey: 'baidu' | 'newmedia'): ColumnsType<CrowdStatusRow> => [
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      align: 'center',
      fixed: 'left',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: CrowdStatusRow) =>
        record.key.includes('total') ? <span style={{ fontWeight: 'bold', color: '#C00000' }}>{val}</span> : val,
    },
    {
      title: '量',
      dataIndex: 'quantity',
      width: 80,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (_: unknown, record: CrowdStatusRow) =>
        renderDimensionEditableNumber(record, 'quantity', (key, field, val) =>
          handleCrowdUpdate(dataKey, key, field, val)
        ),
    },
    {
      title: '占比',
      dataIndex: 'visitConversionRate',
      width: 100,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: CrowdStatusRow) =>
        renderPercentage(val, record.key.includes('total')),
    },
    {
      title: '上门',
      dataIndex: 'visit',
      width: 80,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (_: unknown, record: CrowdStatusRow) =>
        renderDimensionEditableNumber(record, 'visit', (key, field, val) =>
          handleCrowdUpdate(dataKey, key, field, val)
        ),
    },
    {
      title: '上门转化率',
      dataIndex: 'visitConversionRate',
      width: 100,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: CrowdStatusRow) =>
        renderPercentage(val, record.key.includes('total')),
    },
    {
      title: '报名',
      dataIndex: 'signup',
      width: 80,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (_: unknown, record: CrowdStatusRow) =>
        renderDimensionEditableNumber(record, 'signup', (key, field, val) =>
          handleCrowdUpdate(dataKey, key, field, val)
        ),
    },
    {
      title: '报名转化率',
      dataIndex: 'signupConversionRate',
      width: 100,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: CrowdStatusRow) =>
        renderPercentage(val, record.key.includes('total')),
    },
  ]

  // 学历维度表格列
  const createEducationColumns = (dataKey: 'baidu' | 'newmedia'): ColumnsType<EducationRow> => [
    {
      title: '学历',
      dataIndex: 'education',
      width: 120,
      align: 'center',
      fixed: 'left',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: EducationRow) =>
        record.key.includes('total') ? <span style={{ fontWeight: 'bold', color: '#C00000' }}>{val}</span> : val,
    },
    {
      title: '量',
      dataIndex: 'quantity',
      width: 80,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (_: unknown, record: EducationRow) =>
        renderDimensionEditableNumber(record, 'quantity', (key, field, val) =>
          handleEducationUpdate(dataKey, key, field, val)
        ),
    },
    {
      title: '占比',
      dataIndex: 'visitConversionRate',
      width: 100,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: EducationRow) =>
        renderPercentage(val, record.key.includes('total')),
    },
    {
      title: '上门',
      dataIndex: 'visit',
      width: 80,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (_: unknown, record: EducationRow) =>
        renderDimensionEditableNumber(record, 'visit', (key, field, val) =>
          handleEducationUpdate(dataKey, key, field, val)
        ),
    },
    {
      title: '上门转化率',
      dataIndex: 'visitConversionRate',
      width: 100,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: EducationRow) =>
        renderPercentage(val, record.key.includes('total')),
    },
    {
      title: '报名',
      dataIndex: 'signup',
      width: 80,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (_: unknown, record: EducationRow) =>
        renderDimensionEditableNumber(record, 'signup', (key, field, val) =>
          handleEducationUpdate(dataKey, key, field, val)
        ),
    },
    {
      title: '报名转化率',
      dataIndex: 'signupConversionRate',
      width: 100,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: EducationRow) =>
        renderPercentage(val, record.key.includes('total')),
    },
  ]

  // 详细人群状态维度表格列
  const createDetailedCrowdColumns = (dataKey: 'baidu' | 'newmedia'): ColumnsType<DetailedCrowdStatusRow> => [
    {
      title: '状态',
      dataIndex: 'status',
      width: 150,
      align: 'center',
      fixed: 'left',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: DetailedCrowdStatusRow) =>
        record.key.includes('total') ? <span style={{ fontWeight: 'bold', color: '#C00000' }}>{val}</span> : val,
    },
    {
      title: '量',
      dataIndex: 'quantity',
      width: 80,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (_: unknown, record: DetailedCrowdStatusRow) =>
        renderDetailedDimensionEditableNumber(record, 'quantity', (key, field, val) =>
          handleDetailedCrowdUpdate(dataKey, key, field, val)
        ),
    },
    {
      title: '占比',
      dataIndex: 'ratio',
      width: 100,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: DetailedCrowdStatusRow) =>
        renderPercentage(val, record.key.includes('total')),
    },
    {
      title: '上门',
      dataIndex: 'visit',
      width: 80,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (_: unknown, record: DetailedCrowdStatusRow) =>
        renderDetailedDimensionEditableNumber(record, 'visit', (key, field, val) =>
          handleDetailedCrowdUpdate(dataKey, key, field, val)
        ),
    },
    {
      title: '上门转化率',
      dataIndex: 'visitConversionRate',
      width: 100,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: DetailedCrowdStatusRow) =>
        renderPercentage(val, record.key.includes('total')),
    },
    {
      title: '报名',
      dataIndex: 'signup',
      width: 80,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (_: unknown, record: DetailedCrowdStatusRow) =>
        renderDetailedDimensionEditableNumber(record, 'signup', (key, field, val) =>
          handleDetailedCrowdUpdate(dataKey, key, field, val)
        ),
    },
    {
      title: '报名转化率',
      dataIndex: 'signupConversionRate',
      width: 100,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: DetailedCrowdStatusRow) =>
        renderPercentage(val, record.key.includes('total')),
    },
  ]

  // 地域维度表格列
  const createLocationColumns = (dataKey: 'baidu' | 'newmedia' | 'baidu-intent'): ColumnsType<LocationRow> => [
    {
      title: '地域',
      dataIndex: 'location',
      width: 120,
      align: 'center',
      fixed: 'left',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: LocationRow) =>
        record.key.includes('total') ? <span style={{ fontWeight: 'bold', color: '#C00000' }}>{val}</span> : val,
    },
    {
      title: '量',
      dataIndex: 'quantity',
      width: 80,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (_: unknown, record: LocationRow) =>
        renderLocationEditableNumber(record, 'quantity', (key, field, val) =>
          handleLocationUpdate(dataKey, key, field, val)
        ),
    },
    {
      title: '占比',
      dataIndex: 'ratio',
      width: 100,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: LocationRow) =>
        renderPercentage(val, record.key.includes('total')),
    },
    {
      title: '上门',
      dataIndex: 'visit',
      width: 80,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (_: unknown, record: LocationRow) =>
        renderLocationEditableNumber(record, 'visit', (key, field, val) =>
          handleLocationUpdate(dataKey, key, field, val)
        ),
    },
    {
      title: '上门转化率',
      dataIndex: 'visitConversionRate',
      width: 100,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: LocationRow) =>
        renderPercentage(val, record.key.includes('total')),
    },
    {
      title: '报名',
      dataIndex: 'signup',
      width: 80,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (_: unknown, record: LocationRow) =>
        renderLocationEditableNumber(record, 'signup', (key, field, val) =>
          handleLocationUpdate(dataKey, key, field, val)
        ),
    },
    {
      title: '报名转化率',
      dataIndex: 'signupConversionRate',
      width: 100,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: LocationRow) =>
        renderPercentage(val, record.key.includes('total')),
    },
  ]

  // 渲染任务完成情况的可编辑单元格
  const renderTaskEditableNumber = (record: TaskCompletionRow, field: keyof TaskCompletionRow) => {
    // 差额和完成率行不可编辑
    if (record.key === 'task-4' || record.key === 'task-5') {
      const value = record[field] as number
      if (record.key === 'task-5') {
        // 完成率显示为百分比（value已经是小数形式，如0.1478表示14.78%）
        const isZero = value === 0
        return <span style={{ fontWeight: 'bold', color: isZero ? '#999' : '#C00000' }}>{(value * 100).toFixed(2)}%</span>
      }
      const isZero = value === 0
      return <span style={{ fontWeight: 'bold', color: isZero ? '#999' : '#000' }}>{value}</span>
    }

    // 改为只读显示
    const value = record[field] as number
    const isZero = value === 0
    return <span style={{ color: isZero ? '#999' : '#000' }}>{value}</span>
  }

  // 渲染媒体数据的可编辑单元格
  const renderMediaEditableNumber = (record: MediaRow, field: keyof MediaRow) => {
    // 合计行不可编辑
    if (record.key.includes('total')) {
      const value = record[field]
      const numValue = typeof value === 'number' ? value : 0
      const isZero = numValue === 0
      return <span style={{ fontWeight: 'bold', color: isZero ? '#999' : '#C00000' }}>{value}</span>
    }

    // 改为只读显示
    const value = record[field] as number
    const isZero = value === 0
    return <span style={{ color: isZero ? '#999' : '#000' }}>{value}</span>
  }

  // 任务完成情况表格列
  const taskColumns: ColumnsType<TaskCompletionRow> = [
    {
      title: '类目',
      dataIndex: 'category',
      width: 150,
      align: 'center',
      fixed: 'left',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', fontSize: '14px', border: '1px solid #d0d0d0' },
      }),
      onCell: (record: TaskCompletionRow) => ({
        style: { 
          backgroundColor: '#FFF',
          fontWeight: record.key === 'task-4' || record.key === 'task-5' ? 'bold' : 'normal',
          color: record.key === 'task-4' || record.key === 'task-5' ? '#C00000' : '#000',
          border: '1px solid #d0d0d0'
        },
      }),
      render: (val: string) => val,
    },
    {
      title: '花费',
      dataIndex: 'expense',
      width: 100,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', fontSize: '14px', border: '1px solid #d0d0d0' },
      }),
      onCell: (record: TaskCompletionRow) => ({
        style: { 
          backgroundColor: '#FFF',
          border: '1px solid #d0d0d0'
        },
      }),
      render: (_: unknown, record: TaskCompletionRow) => renderTaskEditableNumber(record, 'expense'),
    },
    {
      title: '量',
      dataIndex: 'quantity',
      width: 80,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', fontSize: '14px', border: '1px solid #d0d0d0' },
      }),
      onCell: (record: TaskCompletionRow) => ({
        style: { 
          backgroundColor: '#FFF',
          border: '1px solid #d0d0d0'
        },
      }),
      render: (_: unknown, record: TaskCompletionRow) => renderTaskEditableNumber(record, 'quantity'),
    },
    {
      title: '收入',
      dataIndex: 'income',
      width: 100,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', fontSize: '14px', border: '1px solid #d0d0d0' },
      }),
      onCell: (record: TaskCompletionRow) => ({
        style: { 
          backgroundColor: '#FFF',
          border: '1px solid #d0d0d0'
        },
      }),
      render: (_: unknown, record: TaskCompletionRow) => renderTaskEditableNumber(record, 'income'),
    },
    {
      title: '毛报名',
      dataIndex: 'grossSignup',
      width: 80,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', fontSize: '14px', border: '1px solid #d0d0d0' },
      }),
      onCell: (record: TaskCompletionRow) => ({
        style: { 
          backgroundColor: '#FFF',
          border: '1px solid #d0d0d0'
        },
      }),
      render: (_: unknown, record: TaskCompletionRow) => renderTaskEditableNumber(record, 'grossSignup'),
    },
    {
      title: '上门',
      dataIndex: 'visit',
      width: 80,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', fontSize: '14px', border: '1px solid #d0d0d0' },
      }),
      onCell: (record: TaskCompletionRow) => ({
        style: { 
          backgroundColor: '#FFF',
          border: '1px solid #d0d0d0'
        },
      }),
      render: (_: unknown, record: TaskCompletionRow) => renderTaskEditableNumber(record, 'visit'),
    },
    {
      title: '净报名',
      dataIndex: 'netSignup',
      width: 80,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', fontSize: '14px', border: '1px solid #d0d0d0' },
      }),
      onCell: (record: TaskCompletionRow) => ({
        style: { 
          backgroundColor: '#FFF',
          border: '1px solid #d0d0d0'
        },
      }),
      render: (_: unknown, record: TaskCompletionRow) => renderTaskEditableNumber(record, 'netSignup'),
    },
  ]

  // 媒体投放情况表格列
  const mediaColumns: ColumnsType<MediaRow> = [
    {
      title: '媒体',
      dataIndex: 'mediaType',
      width: 100,
      align: 'center',
      fixed: 'left',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: MediaRow) =>
        record.key.includes('total') ? <span style={{ fontWeight: 'bold', color: '#C00000' }}>{val}</span> : val,
    },
    {
      title: '具体媒体',
      dataIndex: 'specificMedia',
      width: 120,
      align: 'center',
      fixed: 'left',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: MediaRow) =>
        record.key.includes('total') ? <span style={{ fontWeight: 'bold', color: '#C00000' }}>{val}</span> : val,
    },
    {
      title: '花费',
      dataIndex: 'expense',
      width: 100,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (_: unknown, record: MediaRow) => renderMediaEditableNumber(record, 'expense'),
    },
    {
      title: '计划咨询量',
      dataIndex: 'plannedConsult',
      width: 100,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (_: unknown, record: MediaRow) => renderMediaEditableNumber(record, 'plannedConsult'),
    },
    {
      title: '完成咨询量',
      dataIndex: 'completedConsult',
      width: 100,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (_: unknown, record: MediaRow) => renderMediaEditableNumber(record, 'completedConsult'),
    },
    {
      title: '咨询量完成率',
      dataIndex: 'consultCompletionRate',
      width: 120,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: MediaRow) =>
        renderPercentage(val, record.key.includes('total')),
    },
    {
      title: '咨询量成本',
      dataIndex: 'consultCost',
      width: 100,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: MediaRow) =>
        renderNumber(val, record.key.includes('total')),
    },
    {
      title: '毛报名',
      dataIndex: 'grossSignup',
      width: 80,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (_: unknown, record: MediaRow) => renderMediaEditableNumber(record, 'grossSignup'),
    },
    {
      title: '净报名',
      dataIndex: 'netSignup',
      width: 80,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (_: unknown, record: MediaRow) => renderMediaEditableNumber(record, 'netSignup'),
    },
    {
      title: '净报名成本',
      dataIndex: 'netSignupCost',
      width: 100,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: MediaRow) =>
        renderNumber(val, record.key.includes('total')),
    },
    {
      title: '目标收入',
      dataIndex: 'targetIncome',
      width: 100,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (_: unknown, record: MediaRow) => renderMediaEditableNumber(record, 'targetIncome'),
    },
    {
      title: '实际收入',
      dataIndex: 'actualIncome',
      width: 100,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (_: unknown, record: MediaRow) => renderMediaEditableNumber(record, 'actualIncome'),
    },
    {
      title: 'roi',
      dataIndex: 'roi',
      width: 80,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: MediaRow) => {
        const isZero = val === '1:0' || val === '0'
        const color = isZero ? '#999' : (record.key.includes('total') ? '#C00000' : '#000')
        const fontWeight = record.key.includes('total') ? 'bold' : 'normal'
        return <span style={{ color, fontWeight }}>{val}</span>
      },
    },
    {
      title: '净报名转化率',
      dataIndex: 'netSignupCompletionRate',
      width: 120,
      align: 'center',
      onHeaderCell: () => ({
        style: { backgroundColor: '#fce4d6', color: '#000', fontWeight: 'bold', border: '1px solid #d0d0d0' },
      }),
      render: (val: string, record: MediaRow) =>
        renderPercentage(val, record.key.includes('total')),
    },
  ]

  const handleSave = async () => {
    setLoading(true)
    try {
      // TODO: 调用后端API保存数据
      message.success('保存成功')
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 任务完成情况 */}
        <div>
          <div style={{ 
            backgroundColor: '#FFF', 
            color: '#000', 
            padding: '8px 16px', 
            fontWeight: 'bold',
            marginBottom: 8,
            textAlign: 'center',
            border: '1px solid #d0d0d0'
          }}>
            {taskTableTitle}
          </div>
          <Table
            columns={taskColumns}
            dataSource={taskData}
            pagination={false}
            bordered
            size="small"
            scroll={{ x: 'max-content' }}
          />
        </div>

        {/* 各媒体投放情况 */}
        <div>
          <div style={{ 
            backgroundColor: '#FFF', 
            color: '#000', 
            padding: '8px 16px', 
            fontWeight: 'bold',
            marginBottom: 8,
            textAlign: 'center',
            border: '1px solid #d0d0d0'
          }}>
            各媒体投放情况
          </div>
          <Table
            columns={mediaColumns}
            dataSource={mediaData}
            pagination={false}
            bordered
            size="small"
            scroll={{ x: 'max-content' }}
          />
        </div>

        {/* 百度-人群状态维度数据分析 和 新媒体-人群状态维度数据分析 并排显示 */}
        <Row gutter={16}>
          <Col span={12}>
            <div>
              <div style={{ 
                backgroundColor: '#FFF', 
                color: '#000', 
                padding: '8px 16px', 
                fontWeight: 'bold',
                marginBottom: 8,
                textAlign: 'center',
                border: '1px solid #d0d0d0'
              }}>
                百度-人群状态维度数据分析
              </div>
              <Table
                columns={createCrowdColumns('baidu')}
                dataSource={baiduCrowdData}
                pagination={false}
                bordered
                size="small"
                scroll={{ x: 'max-content' }}
              />
            </div>
          </Col>
          <Col span={12}>
            <div>
              <div style={{ 
                backgroundColor: '#FFF', 
                color: '#000', 
                padding: '8px 16px', 
                fontWeight: 'bold',
                marginBottom: 8,
                textAlign: 'center',
                border: '1px solid #d0d0d0'
              }}>
                新媒体-人群状态维度数据分析
              </div>
              <Table
                columns={createCrowdColumns('newmedia')}
                dataSource={newmediaCrowdData}
                pagination={false}
                bordered
                size="small"
                scroll={{ x: 'max-content' }}
              />
            </div>
          </Col>
        </Row>

        {/* 百度-学历维度数据分析 和 新媒体-学历维度数据分析 并排显示 */}
        <Row gutter={16}>
          <Col span={12}>
            <div>
              <div style={{ 
                backgroundColor: '#FFF', 
                color: '#000', 
                padding: '8px 16px', 
                fontWeight: 'bold',
                marginBottom: 8,
                textAlign: 'center',
                border: '1px solid #d0d0d0'
              }}>
                百度-学历维度数据分析
              </div>
              <Table
                columns={createEducationColumns('baidu')}
                dataSource={baiduEducationData}
                pagination={false}
                bordered
                size="small"
                scroll={{ x: 'max-content' }}
              />
            </div>
          </Col>
          <Col span={12}>
            <div>
              <div style={{ 
                backgroundColor: '#FFF', 
                color: '#000', 
                padding: '8px 16px', 
                fontWeight: 'bold',
                marginBottom: 8,
                textAlign: 'center',
                border: '1px solid #d0d0d0'
              }}>
                新媒体-学历维度数据分析
              </div>
              <Table
                columns={createEducationColumns('newmedia')}
                dataSource={newmediaEducationData}
                pagination={false}
                bordered
                size="small"
                scroll={{ x: 'max-content' }}
              />
            </div>
          </Col>
        </Row>

        {/* 百度-人群状态维度数据分析（详细） 和 新媒体-人群状态维度数据分析（详细） 并排显示 */}
        <Row gutter={16}>
          <Col span={12}>
            <div>
              <div style={{ 
                backgroundColor: '#FFF', 
                color: '#000', 
                padding: '8px 16px', 
                fontWeight: 'bold',
                marginBottom: 8,
                textAlign: 'center',
                border: '1px solid #d0d0d0'
              }}>
                百度-人群状态维度数据分析
              </div>
              <Table
                columns={createDetailedCrowdColumns('baidu')}
                dataSource={baiduDetailedCrowdData}
                pagination={false}
                bordered
                size="small"
                scroll={{ x: 'max-content' }}
              />
            </div>
          </Col>
          <Col span={12}>
            <div>
              <div style={{ 
                backgroundColor: '#FFF', 
                color: '#000', 
                padding: '8px 16px', 
                fontWeight: 'bold',
                marginBottom: 8,
                textAlign: 'center',
                border: '1px solid #d0d0d0'
              }}>
                新媒体-人群状态维度数据分析
              </div>
              <Table
                columns={createDetailedCrowdColumns('newmedia')}
                dataSource={newmediaDetailedCrowdData}
                pagination={false}
                bordered
                size="small"
                scroll={{ x: 'max-content' }}
              />
            </div>
          </Col>
        </Row>

        {/* 百度-地域维度数据分析（单纯按地域分布计算） 和 新媒体-地域维度数据分析（单纯按地域分布计算） 并排显示 */}
        <Row gutter={16}>
          <Col span={12}>
            <div>
              <div style={{ 
                backgroundColor: '#FFF', 
                color: '#000', 
                padding: '8px 16px', 
                fontWeight: 'bold',
                marginBottom: 8,
                textAlign: 'center',
                border: '1px solid #d0d0d0'
              }}>
                百度-地域维度数据分析（单纯按地域分布计算）
              </div>
              <Table
                columns={createLocationColumns('baidu')}
                dataSource={baiduLocationData}
                pagination={false}
                bordered
                size="small"
                scroll={{ x: 'max-content' }}
              />
            </div>
          </Col>
          <Col span={12}>
            <div>
              <div style={{ 
                backgroundColor: '#FFF', 
                color: '#000', 
                padding: '8px 16px', 
                fontWeight: 'bold',
                marginBottom: 8,
                textAlign: 'center',
                border: '1px solid #d0d0d0'
              }}>
                新媒体-地域维度数据分析（单纯按地域分布计算）
              </div>
              <Table
                columns={createLocationColumns('newmedia')}
                dataSource={newmediaLocationData}
                pagination={false}
                bordered
                size="small"
                scroll={{ x: 'max-content' }}
              />
            </div>
          </Col>
        </Row>

        {/* 百度-地域维度数据分析（按照意向的地域分布计算） */}
        <div>
          <div style={{ 
            backgroundColor: '#FFF', 
            color: '#000', 
            padding: '8px 16px', 
            fontWeight: 'bold',
            marginBottom: 8,
            textAlign: 'center',
            border: '1px solid #d0d0d0'
          }}>
            百度-地域维度数据分析（按照意向的地域分布计算）
          </div>
          <Table
            columns={createLocationColumns('baidu-intent')}
            dataSource={baiduLocationIntentData}
            pagination={false}
            bordered
            size="small"
            scroll={{ x: 'max-content' }}
          />
        </div>
      </Space>
    </div>
  )
}

export default StageDataSummaryTab