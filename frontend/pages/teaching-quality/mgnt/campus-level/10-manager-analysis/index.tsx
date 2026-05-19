/**
 * 神殿教化司经理、副经理功能分析表主页面
 * Excel 风格：表格内直接编辑，实时保存，0值显示为空
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { App, Table, Card, Typography, Space, Input, Button, Row, Col, Statistic, Select, Spin, InputNumber, DatePicker, Tabs } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  SaveOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UserOutlined,
  TrophyOutlined,
  StarOutlined,
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { campusManagerAnalysisService } from '@/services/teaching-quality/campusManagerAnalysis'
import { fetchUserPermissions } from '@/services/configMaster'
import type { CampusManagerAnalysisRecord } from '@/types/campus-manager-analysis'

const { Option } = Select
const ALL_CAMPUSES = '__ALL__'

// Excel 风格的数据接口（扁平结构）
interface ManagerFunctionRecord {
  key: string
  month: number
  campus: string
  name: string
  // 思想
  values: number
  responsibility: number
  execution: number
  // 管理
  planning: number
  organization: number
  leadership: number
  control: number
  // 业务能力
  studentEmployment: number
  reputationEnrollment: number
  studentAttrition: number
  furtherEducation: number
  academicManagement: number
  dormitoryManagement: number
  // 合计分数
  totalScore: number
}

// 计算平均值（Excel 风格）
const calculateAverages = (data: ManagerFunctionRecord[]): ManagerFunctionRecord => {
  if (data.length === 0) {
    return {
      key: 'average',
      month: 0,
      campus: '平均',
      name: '',
      values: 0,
      responsibility: 0,
      execution: 0,
      planning: 0,
      organization: 0,
      leadership: 0,
      control: 0,
      studentEmployment: 0,
      reputationEnrollment: 0,
      studentAttrition: 0,
      furtherEducation: 0,
      academicManagement: 0,
      dormitoryManagement: 0,
      totalScore: 0,
    }
  }

  const totals = data.reduce(
    (acc, curr) => {
      acc.values += curr.values
      acc.responsibility += curr.responsibility
      acc.execution += curr.execution
      acc.planning += curr.planning
      acc.organization += curr.organization
      acc.leadership += curr.leadership
      acc.control += curr.control
      acc.studentEmployment += curr.studentEmployment
      acc.reputationEnrollment += curr.reputationEnrollment
      acc.studentAttrition += curr.studentAttrition
      acc.furtherEducation += curr.furtherEducation
      acc.academicManagement += curr.academicManagement
      acc.dormitoryManagement += curr.dormitoryManagement
      acc.totalScore += curr.totalScore
      return acc
    },
    {
      values: 0,
      responsibility: 0,
      execution: 0,
      planning: 0,
      organization: 0,
      leadership: 0,
      control: 0,
      studentEmployment: 0,
      reputationEnrollment: 0,
      studentAttrition: 0,
      furtherEducation: 0,
      academicManagement: 0,
      dormitoryManagement: 0,
      totalScore: 0,
    },
  )

  const count = data.length

  // 计算每个评分项的平均值
  const avgValues = Math.round(totals.values / count)
  const avgResponsibility = Math.round(totals.responsibility / count)
  const avgExecution = Math.round(totals.execution / count)
  const avgPlanning = Math.round(totals.planning / count)
  const avgOrganization = Math.round(totals.organization / count)
  const avgLeadership = Math.round(totals.leadership / count)
  const avgControl = Math.round(totals.control / count)
  const avgStudentEmployment = Math.round(totals.studentEmployment / count)
  const avgReputationEnrollment = Math.round(totals.reputationEnrollment / count)
  const avgStudentAttrition = Math.round(totals.studentAttrition / count)
  const avgFurtherEducation = Math.round(totals.furtherEducation / count)
  const avgAcademicManagement = Math.round(totals.academicManagement / count)
  const avgDormitoryManagement = Math.round(totals.dormitoryManagement / count)

  // 计算平均分：13个评分项的平均值
  const avgTotalScore = Math.round(
    ((avgValues +
      avgResponsibility +
      avgExecution +
      avgPlanning +
      avgOrganization +
      avgLeadership +
      avgControl +
      avgStudentEmployment +
      avgReputationEnrollment +
      avgStudentAttrition +
      avgFurtherEducation +
      avgAcademicManagement +
      avgDormitoryManagement) /
      13) *
      10,
  ) / 10 // 保留一位小数

  return {
    key: 'average',
    month: 0,
    campus: '平均',
    name: '',
    values: avgValues,
    responsibility: avgResponsibility,
    execution: avgExecution,
    planning: avgPlanning,
    organization: avgOrganization,
    leadership: avgLeadership,
    control: avgControl,
    studentEmployment: avgStudentEmployment,
    reputationEnrollment: avgReputationEnrollment,
    studentAttrition: avgStudentAttrition,
    furtherEducation: avgFurtherEducation,
    academicManagement: avgAcademicManagement,
    dormitoryManagement: avgDormitoryManagement,
    totalScore: avgTotalScore,
  }
}

const CampusManagerAnalysisPage: React.FC = () => {
  const { message } = App.useApp()
  const campusStore = useCampusStore()
  const [searchText, setSearchText] = useState('')
  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [managerData, setManagerData] = useState<ManagerFunctionRecord[]>([])
  const [deputyManagerData, setDeputyManagerData] = useState<ManagerFunctionRecord[]>([])
  const [filteredManagerData, setFilteredManagerData] = useState<ManagerFunctionRecord[]>([])
  const [filteredDeputyManagerData, setFilteredDeputyManagerData] = useState<ManagerFunctionRecord[]>([])
  const [loading, setLoading] = useState(false)
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [selectedYearDate, setSelectedYearDate] = useState<Dayjs>(dayjs().year(currentYear))
  const [activeTab, setActiveTab] = useState<string>('manager')
  
  // 实时保存的防抖定时器
  const saveTimerRef = useRef<Record<string, NodeJS.Timeout>>({})
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set())

  // 设置默认神殿：与顶部神殿选择器保持一致（优先使用全局 currentCampus）
  useEffect(() => {
    if (!selectedCampus && campusStore.currentCampus) {
      setSelectedCampus(campusStore.currentCampus)
    }
  }, [campusStore.currentCampus, selectedCampus])

  // 顶部神殿切换后，同步更新本页神殿选择器（避免两处不一致）
  useEffect(() => {
    if (campusStore.currentCampus && selectedCampus !== campusStore.currentCampus) {
      setSelectedCampus(campusStore.currentCampus)
    }
  }, [campusStore.currentCampus])

  // 加载数据的函数（使用 useCallback 避免重复创建）
  const loadData = useCallback(async (campus: string, forceReload: boolean = false) => {
    if (!campus) return

    // 防止重复加载（除非是强制刷新）
    if (loading && !forceReload) {
      console.log('[loadData] 正在加载中，跳过重复请求')
      return
    }

    setLoading(true)
    try {
      // 1. 获取后端已有数据（分别获取经理和副经理的数据）
      let managerRecords: CampusManagerAnalysisRecord[] = []
      let deputyManagerRecords: CampusManagerAnalysisRecord[] = []
      
      const fetchRecordsForPosition = async (position: 'manager' | 'deputy', campusName: string): Promise<CampusManagerAnalysisRecord[]> => {
        try {
          const records = await campusManagerAnalysisService.getCampusManagerAnalysisData(campusName, selectedYear, position)
          // 调试：打印后端返回的数据
          if (campusName.includes('盛邦') || campusName.includes('河北')) {
            console.log(`[fetchRecordsForPosition] 神殿=${campusName}, 职位=${position}, 返回记录数=${records.length}`)
            if (records.length > 0) {
              console.log(`[fetchRecordsForPosition] 前3条记录:`, records.slice(0, 3).map(r => ({
                month: r.month,
                name: r.name,
                campus: r.campus,
              })))
            }
          }
          return records
        } catch (error: any) {
          // 如果是429错误（请求过于频繁），等待后重试一次
          if (error?.response?.status === 429) {
            console.warn(`[loadData] 请求过于频繁，等待2秒后重试...`)
            await new Promise(resolve => setTimeout(resolve, 2000))
            try {
              return await campusManagerAnalysisService.getCampusManagerAnalysisData(campusName, selectedYear, position)
            } catch {
              return []
            }
          }
          return []
        }
      }
      
      if (campus === ALL_CAMPUSES) {
        const campusNames = campusStore.getAllCampuses().map((c) => c.name)
        // 使用串行请求而不是并行，避免触发限流
        managerRecords = []
        deputyManagerRecords = []
        for (const name of campusNames) {
          managerRecords.push(...(await fetchRecordsForPosition('manager', name)))
          deputyManagerRecords.push(...(await fetchRecordsForPosition('deputy', name)))
          // 每个神殿之间稍微延迟，避免请求过于密集
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } else {
        // 单个神殿：只发送一次请求，后端会处理神殿名称变体匹配
        // 规范化神殿名称（统一使用带"神殿"后缀的格式）
        const normalizedCampus = campus.endsWith('神殿') ? campus : `${campus}神殿`
        
        // 只发送一次请求，后端会处理所有神殿变体
        managerRecords = await fetchRecordsForPosition('manager', normalizedCampus)
        deputyManagerRecords = await fetchRecordsForPosition('deputy', normalizedCampus)
        
        // 过滤掉不属于当前神殿的数据（支持变体匹配）
        const normalizedTargetCampus = campus.replace(/神殿$/, '').trim()
        managerRecords = managerRecords.filter((r) => {
          const rCampus = (r.campus || '').replace(/神殿$/, '').trim()
          return (
            rCampus === normalizedTargetCampus ||
            r.campus === campus ||
            r.campus === normalizedCampus ||
            rCampus.includes(normalizedTargetCampus) ||
            normalizedTargetCampus.includes(rCampus)
          )
        })
        deputyManagerRecords = deputyManagerRecords.filter((r) => {
          const rCampus = (r.campus || '').replace(/神殿$/, '').trim()
          return (
            rCampus === normalizedTargetCampus ||
            r.campus === campus ||
            r.campus === normalizedCampus ||
            rCampus.includes(normalizedTargetCampus) ||
            normalizedTargetCampus.includes(rCampus)
          )
        })
      }

      // 2. 从用户表获取教质经理和教质副经理，分别处理
      const managers: ManagerFunctionRecord[] = []
      const deputyManagers: ManagerFunctionRecord[] = []
      
      if (campus === ALL_CAMPUSES) {
        // 全部神殿：为每个神殿获取经理和副经理
        const campusNames = campusStore.getAllCampuses().map((c) => c.name)
        for (const campusName of campusNames) {
          try {
            const users = await fetchUserPermissions({
              campus: campusName,
              department: '教化司',
              position: undefined, // 先获取所有教化司人员
            })
            
            // 调试：打印查询结果
            console.log(`[loadData] 查询神殿 ${campusName} 的教化司人员:`, {
              查询参数: { campus: campusName, department: '教化司' },
              返回用户数: users.length,
              用户列表: users.map((u) => ({ 
                姓名: u.name, 
                职位: u.position, 
                神殿: u.campus,
                部门: u.department 
              }))
            })
            
            const manager = users.find((u) => u.position === '教质经理')
            const deputyManager = users.find((u) => u.position === '教质副经理')
            
            // 调试：打印匹配结果
            console.log(`[loadData] 神殿 ${campusName} 职位匹配结果:`, {
              经理: manager ? { 姓名: manager.name, 职位: manager.position } : '未找到',
              副经理: deputyManager ? { 姓名: deputyManager.name, 职位: deputyManager.position } : '未找到'
            })

            // 在姓名后追加职位
            const managerNameWithPosition = manager?.name ? `${manager.name}教质经理` : ''
            const deputyManagerNameWithPosition = deputyManager?.name ? `${deputyManager.name}教质副经理` : ''

            // 规范化神殿名称（统一使用带"神殿"后缀的格式）
            const normalizedCampusName = campusName.endsWith('神殿') ? campusName : `${campusName}神殿`
            
            // 为每个月生成两条记录（经理和副经理）
            for (let month = 1; month <= 12; month++) {
              // 经理记录 - 匹配后端数据时支持神殿名称变体
              const managerKey = `${normalizedCampusName}-${month}-${managerNameWithPosition || ''}`
              const existingManagerRecord = managerRecords.find((r) => {
                const rCampus = (r.campus || '').replace(/神殿$/, '')
                const targetCampus = normalizedCampusName.replace(/神殿$/, '')
                // 匹配时支持带职位后缀和不带职位后缀的姓名
                const nameMatch = r.name === managerNameWithPosition || r.name === manager?.name
                return (rCampus === targetCampus || r.campus === normalizedCampusName || r.campus === campusName) &&
                       r.month === month &&
                       nameMatch
              })
              managers.push({
                key: managerKey,
                month,
                campus: normalizedCampusName, // 统一使用规范化后的神殿名称
                name: managerNameWithPosition,
                values: existingManagerRecord?.ideology?.values || 0,
                responsibility: existingManagerRecord?.ideology?.responsibility || 0,
                execution: existingManagerRecord?.ideology?.execution || 0,
                planning: existingManagerRecord?.management?.planning || 0,
                organization: existingManagerRecord?.management?.organization || 0,
                leadership: existingManagerRecord?.management?.leadership || 0,
                control: existingManagerRecord?.management?.control || 0,
                studentEmployment: existingManagerRecord?.businessCapability?.studentEmployment || 0,
                reputationEnrollment: existingManagerRecord?.businessCapability?.reputationEnrollment || 0,
                studentAttrition: existingManagerRecord?.businessCapability?.studentAttrition || 0,
                furtherEducation: existingManagerRecord?.businessCapability?.furtherEducation || 0,
                academicManagement: existingManagerRecord?.businessCapability?.academicManagement || 0,
                dormitoryManagement: existingManagerRecord?.businessCapability?.dormitoryManagement || 0,
                totalScore: existingManagerRecord ? 
                  Math.round(((
                    (existingManagerRecord.ideology?.values || 0) +
                    (existingManagerRecord.ideology?.responsibility || 0) +
                    (existingManagerRecord.ideology?.execution || 0) +
                    (existingManagerRecord.management?.planning || 0) +
                    (existingManagerRecord.management?.organization || 0) +
                    (existingManagerRecord.management?.leadership || 0) +
                    (existingManagerRecord.management?.control || 0) +
                    (existingManagerRecord.businessCapability?.studentEmployment || 0) +
                    (existingManagerRecord.businessCapability?.reputationEnrollment || 0) +
                    (existingManagerRecord.businessCapability?.studentAttrition || 0) +
                    (existingManagerRecord.businessCapability?.furtherEducation || 0) +
                    (existingManagerRecord.businessCapability?.academicManagement || 0) +
                    (existingManagerRecord.businessCapability?.dormitoryManagement || 0)
                  ) / 13) * 10) / 10 : 0,
              })
              
              // 副经理记录 - 匹配后端数据时支持神殿名称变体
              // 如果姓名为空，使用 'deputy' 作为后缀，确保 key 唯一
              const deputyKey = `${normalizedCampusName}-${month}-${deputyManagerNameWithPosition || 'deputy'}`
              const existingDeputyRecord = deputyManagerRecords.find((r) => {
                const rCampus = (r.campus || '').replace(/神殿$/, '')
                const targetCampus = normalizedCampusName.replace(/神殿$/, '')
                // 匹配时支持带职位后缀和不带职位后缀的姓名
                const nameMatch = r.name === deputyManagerNameWithPosition || r.name === deputyManager?.name || !r.name
                return (rCampus === targetCampus || r.campus === normalizedCampusName || r.campus === campusName) &&
                       r.month === month &&
                       nameMatch
              })
              deputyManagers.push({
                key: deputyKey,
                month,
                campus: normalizedCampusName, // 统一使用规范化后的神殿名称
                name: deputyManagerNameWithPosition, // 使用带职位后缀的姓名
                values: existingDeputyRecord?.ideology?.values || 0,
                responsibility: existingDeputyRecord?.ideology?.responsibility || 0,
                execution: existingDeputyRecord?.ideology?.execution || 0,
                planning: existingDeputyRecord?.management?.planning || 0,
                organization: existingDeputyRecord?.management?.organization || 0,
                leadership: existingDeputyRecord?.management?.leadership || 0,
                control: existingDeputyRecord?.management?.control || 0,
                studentEmployment: existingDeputyRecord?.businessCapability?.studentEmployment || 0,
                reputationEnrollment: existingDeputyRecord?.businessCapability?.reputationEnrollment || 0,
                studentAttrition: existingDeputyRecord?.businessCapability?.studentAttrition || 0,
                furtherEducation: existingDeputyRecord?.businessCapability?.furtherEducation || 0,
                academicManagement: existingDeputyRecord?.businessCapability?.academicManagement || 0,
                dormitoryManagement: existingDeputyRecord?.businessCapability?.dormitoryManagement || 0,
                totalScore: existingDeputyRecord ? 
                  Math.round(((
                    (existingDeputyRecord.ideology?.values || 0) +
                    (existingDeputyRecord.ideology?.responsibility || 0) +
                    (existingDeputyRecord.ideology?.execution || 0) +
                    (existingDeputyRecord.management?.planning || 0) +
                    (existingDeputyRecord.management?.organization || 0) +
                    (existingDeputyRecord.management?.leadership || 0) +
                    (existingDeputyRecord.management?.control || 0) +
                    (existingDeputyRecord.businessCapability?.studentEmployment || 0) +
                    (existingDeputyRecord.businessCapability?.reputationEnrollment || 0) +
                    (existingDeputyRecord.businessCapability?.studentAttrition || 0) +
                    (existingDeputyRecord.businessCapability?.furtherEducation || 0) +
                    (existingDeputyRecord.businessCapability?.academicManagement || 0) +
                    (existingDeputyRecord.businessCapability?.dormitoryManagement || 0)
                  ) / 13) * 10) / 10 : 0,
              })
            }
          } catch (error) {
            console.error(`获取 ${campusName} 的经理信息失败:`, error)
          }
        }
      } else {
        // 单个神殿：获取该神殿的经理和副经理
        // 规范化神殿名称（统一使用带"神殿"后缀的格式）
        const normalizedCampus = campus.endsWith('神殿') ? campus : `${campus}神殿`
        
        try {
          // 直接使用规范化后的神殿名称查询（后端已支持模糊匹配）
          const users = await fetchUserPermissions({
            campus: normalizedCampus,
            department: '教化司',
            position: undefined,
          })
          
          // 调试：打印查询结果
          console.log(`[loadData] 查询神殿 ${normalizedCampus} 的教化司人员:`, {
            查询参数: { campus: normalizedCampus, department: '教化司' },
            返回用户数: users.length,
            用户列表: users.map((u) => ({ 
              姓名: u.name, 
              职位: u.position, 
              神殿: u.campus,
              部门: u.department 
            }))
          })
          
          const manager = users.find((u) => u.position === '教质经理')
          const deputyManager = users.find((u) => u.position === '教质副经理')
          
          // 调试：打印匹配结果
          console.log(`[loadData] 职位匹配结果:`, {
            经理: manager ? { 姓名: manager.name, 职位: manager.position } : '未找到',
            副经理: deputyManager ? { 姓名: deputyManager.name, 职位: deputyManager.position } : '未找到'
          })

          // 在姓名后追加职位
          const managerNameWithPosition = manager?.name ? `${manager.name}教质经理` : ''
          const deputyManagerNameWithPosition = deputyManager?.name ? `${deputyManager.name}教质副经理` : ''

          // 调试：打印用户信息
          if (campus.includes('盛邦') || campus.includes('河北')) {
            console.log(`[loadData] 神殿 ${campus} 的用户信息:`, {
              所有用户: users.map((u) => ({ name: u.name, position: u.position, campus: u.campus })),
              经理: manager ? { name: manager.name, position: manager.position } : null,
              副经理: deputyManager ? { name: deputyManager.name, position: deputyManager.position } : null,
              经理记录数: managerRecords.length,
              副经理记录数: deputyManagerRecords.length,
            })
          }
          
          // 为每个月生成两条记录（经理和副经理），只生成当前神殿的数据
          for (let month = 1; month <= 12; month++) {
            // 经理记录 - 匹配后端数据时支持神殿名称变体和姓名匹配
            // 确保姓名正确设置（优先使用带职位后缀的姓名）
            // 如果姓名为空，使用 'manager' 作为后缀，确保 key 唯一
            const managerKey = `${normalizedCampus}-${month}-${managerNameWithPosition || 'manager'}`

            // 匹配后端数据：支持神殿名称变体和姓名匹配（支持带职位后缀和不带职位后缀）
            // 如果后端数据中有该姓名，即使神殿不完全匹配也要使用（因为可能是历史数据）
            const existingManagerRecord = managerRecords.find((r) => {
              const rCampus = (r.campus || '').replace(/神殿$/, '').trim()
              const targetCampus = normalizedCampus.replace(/神殿$/, '').trim()
              const rName = (r.name || '').trim()
              const targetName = managerNameWithPosition.trim()
              const targetNameWithoutPosition = (manager?.name || '').trim()
              
              // 先匹配月份
              if (r.month !== month) return false

              // 如果用户表中有姓名，优先匹配姓名（支持带职位后缀和不带职位后缀）
              if (targetName || targetNameWithoutPosition) {
                // 姓名匹配：支持带职位后缀或不带职位后缀
                const nameMatch = rName === targetName || rName === targetNameWithoutPosition
                if (nameMatch) {
                  // 姓名匹配，再检查神殿是否匹配（支持变体）
                  const campusMatch = (
                    rCampus === targetCampus ||
                    r.campus === normalizedCampus ||
                    r.campus === campus ||
                    (rCampus.includes(targetCampus) || targetCampus.includes(rCampus)) ||
                    (r.campus && normalizedCampus && (
                      r.campus.replace(/神殿$/, '').includes(targetCampus) ||
                      normalizedCampus.replace(/神殿$/, '').includes(rCampus)
                    ))
                  )
                  return campusMatch
                }
                return false
              }
              
              // 如果用户表中没有姓名，则只匹配神殿和月份
              const campusMatch = (
                rCampus === targetCampus ||
                r.campus === normalizedCampus ||
                r.campus === campus ||
                (rCampus.includes(targetCampus) || targetCampus.includes(rCampus))
              )
              return campusMatch
            })
            
            managers.push({
              key: managerKey,
              month,
              campus: normalizedCampus, // 统一使用规范化后的神殿名称
              name: managerNameWithPosition, // 使用带职位后缀的姓名
              values: existingManagerRecord?.ideology?.values || 0,
              responsibility: existingManagerRecord?.ideology?.responsibility || 0,
              execution: existingManagerRecord?.ideology?.execution || 0,
              planning: existingManagerRecord?.management?.planning || 0,
              organization: existingManagerRecord?.management?.organization || 0,
              leadership: existingManagerRecord?.management?.leadership || 0,
              control: existingManagerRecord?.management?.control || 0,
              studentEmployment: existingManagerRecord?.businessCapability?.studentEmployment || 0,
              reputationEnrollment: existingManagerRecord?.businessCapability?.reputationEnrollment || 0,
              studentAttrition: existingManagerRecord?.businessCapability?.studentAttrition || 0,
              furtherEducation: existingManagerRecord?.businessCapability?.furtherEducation || 0,
              academicManagement: existingManagerRecord?.businessCapability?.academicManagement || 0,
              dormitoryManagement: existingManagerRecord?.businessCapability?.dormitoryManagement || 0,
              totalScore: existingManagerRecord ? 
                Math.round(((
                  (existingManagerRecord.ideology?.values || 0) +
                  (existingManagerRecord.ideology?.responsibility || 0) +
                  (existingManagerRecord.ideology?.execution || 0) +
                  (existingManagerRecord.management?.planning || 0) +
                  (existingManagerRecord.management?.organization || 0) +
                  (existingManagerRecord.management?.leadership || 0) +
                  (existingManagerRecord.management?.control || 0) +
                  (existingManagerRecord.businessCapability?.studentEmployment || 0) +
                  (existingManagerRecord.businessCapability?.reputationEnrollment || 0) +
                  (existingManagerRecord.businessCapability?.studentAttrition || 0) +
                  (existingManagerRecord.businessCapability?.furtherEducation || 0) +
                  (existingManagerRecord.businessCapability?.academicManagement || 0) +
                  (existingManagerRecord.businessCapability?.dormitoryManagement || 0)
                ) / 13) * 10) / 10 : 0,
            })
            
            // 副经理记录 - 匹配后端数据时支持神殿名称变体和姓名匹配
            // 确保姓名正确设置（优先使用带职位后缀的姓名）
            // 如果姓名为空，使用 'deputy' 作为后缀，确保 key 唯一
            const deputyKey = `${normalizedCampus}-${month}-${deputyManagerNameWithPosition || 'deputy'}`

            // 匹配后端数据：支持神殿名称变体和姓名匹配（支持带职位后缀和不带职位后缀）
            const existingDeputyRecord = deputyManagerRecords.find((r) => {
              const rCampus = (r.campus || '').replace(/神殿$/, '').trim()
              const targetCampus = normalizedCampus.replace(/神殿$/, '').trim()
              const rName = (r.name || '').trim()
              const targetName = deputyManagerNameWithPosition.trim()
              const targetNameWithoutPosition = (deputyManager?.name || '').trim()

              // 先匹配月份
              if (r.month !== month) return false

              // 如果用户表中有姓名，优先匹配姓名（支持带职位后缀和不带职位后缀）
              if (targetName || targetNameWithoutPosition) {
                // 姓名匹配：支持带职位后缀或不带职位后缀
                const nameMatch = rName === targetName || rName === targetNameWithoutPosition
                if (nameMatch) {
                  // 姓名匹配，再检查神殿是否匹配（支持变体）
                  const campusMatch = (
                    rCampus === targetCampus ||
                    r.campus === normalizedCampus ||
                    r.campus === campus ||
                    (rCampus.includes(targetCampus) || targetCampus.includes(rCampus)) ||
                    (r.campus && normalizedCampus && (
                      r.campus.replace(/神殿$/, '').includes(targetCampus) ||
                      normalizedCampus.replace(/神殿$/, '').includes(rCampus)
                    ))
                  )
                  return campusMatch
                }
                return false
              }

              // 如果用户表中没有姓名，则只匹配神殿和月份
              const campusMatch = (
                rCampus === targetCampus ||
                r.campus === normalizedCampus ||
                r.campus === campus ||
                (rCampus.includes(targetCampus) || targetCampus.includes(rCampus))
              )
              return campusMatch
            })

            deputyManagers.push({
              key: deputyKey,
              month,
              campus: normalizedCampus, // 统一使用规范化后的神殿名称
              name: deputyManagerNameWithPosition, // 使用带职位后缀的姓名
              values: existingDeputyRecord?.ideology?.values || 0,
              responsibility: existingDeputyRecord?.ideology?.responsibility || 0,
              execution: existingDeputyRecord?.ideology?.execution || 0,
              planning: existingDeputyRecord?.management?.planning || 0,
              organization: existingDeputyRecord?.management?.organization || 0,
              leadership: existingDeputyRecord?.management?.leadership || 0,
              control: existingDeputyRecord?.management?.control || 0,
              studentEmployment: existingDeputyRecord?.businessCapability?.studentEmployment || 0,
              reputationEnrollment: existingDeputyRecord?.businessCapability?.reputationEnrollment || 0,
              studentAttrition: existingDeputyRecord?.businessCapability?.studentAttrition || 0,
              furtherEducation: existingDeputyRecord?.businessCapability?.furtherEducation || 0,
              academicManagement: existingDeputyRecord?.businessCapability?.academicManagement || 0,
              dormitoryManagement: existingDeputyRecord?.businessCapability?.dormitoryManagement || 0,
              totalScore: existingDeputyRecord ? 
                Math.round(((
                  (existingDeputyRecord.ideology?.values || 0) +
                  (existingDeputyRecord.ideology?.responsibility || 0) +
                  (existingDeputyRecord.ideology?.execution || 0) +
                  (existingDeputyRecord.management?.planning || 0) +
                  (existingDeputyRecord.management?.organization || 0) +
                  (existingDeputyRecord.management?.leadership || 0) +
                  (existingDeputyRecord.management?.control || 0) +
                  (existingDeputyRecord.businessCapability?.studentEmployment || 0) +
                  (existingDeputyRecord.businessCapability?.reputationEnrollment || 0) +
                  (existingDeputyRecord.businessCapability?.studentAttrition || 0) +
                  (existingDeputyRecord.businessCapability?.furtherEducation || 0) +
                  (existingDeputyRecord.businessCapability?.academicManagement || 0) +
                  (existingDeputyRecord.businessCapability?.dormitoryManagement || 0)
                ) / 13) * 10) / 10 : 0,
            })
          }
        } catch (error) {
          console.error('获取经理信息失败:', error)
          message.error('获取经理信息失败，请检查用户表配置')
        }
      }

      // 确保单个神殿模式下，只包含该神殿的数据
      let finalManagers = managers
      let finalDeputyManagers = deputyManagers
      if (campus && campus !== ALL_CAMPUSES) {
        // 规范化神殿名称
        const normalizedCampus = campus.endsWith('神殿') ? campus : `${campus}神殿`
        finalManagers = managers.filter((record) => {
          // 支持神殿名称的变体匹配（如"主神殿"和"盛邦"）
          const recordCampus = (record.campus || '').replace(/神殿$/, '')
          const filterCampus = normalizedCampus.replace(/神殿$/, '')
          return recordCampus === filterCampus || record.campus === normalizedCampus || record.campus === campus
        })
        finalDeputyManagers = deputyManagers.filter((record) => {
          // 支持神殿名称的变体匹配（如"主神殿"和"盛邦"）
          const recordCampus = (record.campus || '').replace(/神殿$/, '')
          const filterCampus = normalizedCampus.replace(/神殿$/, '')
          return recordCampus === filterCampus || record.campus === normalizedCampus || record.campus === campus
        })
      }

      setManagerData(finalManagers)
      setDeputyManagerData(finalDeputyManagers)
      
      // 加载数据后，应用搜索筛选（神殿筛选已在上面完成）
      let filteredManagers = finalManagers
      let filteredDeputyManagers = finalDeputyManagers
      if (searchText) {
        const lowercasedValue = searchText.toLowerCase()
        filteredManagers = finalManagers.filter(
          (record) =>
            record.campus.toLowerCase().includes(lowercasedValue) ||
            record.name.toLowerCase().includes(lowercasedValue),
        )
        filteredDeputyManagers = finalDeputyManagers.filter(
          (record) =>
            record.campus.toLowerCase().includes(lowercasedValue) ||
            record.name.toLowerCase().includes(lowercasedValue),
        )
      }
      setFilteredManagerData(filteredManagers)
      setFilteredDeputyManagerData(filteredDeputyManagers)
    } catch (error) {
      message.error('加载数据失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [selectedYear, searchText])

  // 初始化：加载数据
  useEffect(() => {
    if (selectedCampus) {
      loadData(selectedCampus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampus, selectedYear])

  const handleSearch = (value: string) => {
    setSearchText(value)
    // 应用筛选逻辑
    let filteredManagers = managerData
    let filteredDeputyManagers = deputyManagerData
    
    // 神殿筛选：如果选择了单个神殿（不是全部神殿），只显示该神殿的数据
    if (selectedCampus && selectedCampus !== ALL_CAMPUSES) {
      filteredManagers = managerData.filter((record) => {
        // 支持神殿名称的变体匹配（如"主神殿"和"盛邦"）
        const recordCampus = (record.campus || '').replace(/神殿$/, '')
        const filterCampus = selectedCampus.replace(/神殿$/, '')
        return recordCampus === filterCampus || record.campus === selectedCampus
      })
      filteredDeputyManagers = deputyManagerData.filter((record) => {
        // 支持神殿名称的变体匹配（如"主神殿"和"盛邦"）
        const recordCampus = (record.campus || '').replace(/神殿$/, '')
        const filterCampus = selectedCampus.replace(/神殿$/, '')
        return recordCampus === filterCampus || record.campus === selectedCampus
      })
    }
    
    // 搜索筛选
    if (value) {
      const lowercasedValue = value.toLowerCase()
      filteredManagers = filteredManagers.filter(
        (record) =>
          record.campus.toLowerCase().includes(lowercasedValue) ||
          record.name.toLowerCase().includes(lowercasedValue),
      )
      filteredDeputyManagers = filteredDeputyManagers.filter(
        (record) =>
          record.campus.toLowerCase().includes(lowercasedValue) ||
          record.name.toLowerCase().includes(lowercasedValue),
      )
    }
    
    setFilteredManagerData(filteredManagers)
    setFilteredDeputyManagerData(filteredDeputyManagers)
  }

  const handleCampusChange = (value: string) => {
    setSelectedCampus(value)
    setSearchText('') // 切换神殿时清空搜索
    // 切换神殿时，清空现有数据，等待新数据加载
    setManagerData([])
    setDeputyManagerData([])
    setFilteredManagerData([])
    setFilteredDeputyManagerData([])
  }

  const handleRefresh = () => {
    setSearchText('')
    if (selectedCampus) {
      loadData(selectedCampus)
    }
  }

  const handleSave = async () => {
    // 防止重复提交
    if (loading) {
      message.warning('正在保存中，请勿重复操作')
      return
    }

    try {
      const campus = selectedCampus === ALL_CAMPUSES ? '' : selectedCampus
      if (!campus) {
        message.warning('请先选择神殿')
        return
      }

      // 根据当前标签页选择要保存的数据
      const isManager = activeTab === 'manager'
      const dataToSave = isManager ? managerData : deputyManagerData
      const position = isManager ? 'manager' : 'deputy'
      
      // 过滤掉平均行和占位行
      const validData = dataToSave.filter(
        (record) => record.key !== 'average' && !record.key.includes('placeholder')
      )

      if (validData.length === 0) {
        message.warning('没有可保存的数据')
        return
      }

      // 转换为服务需要的格式
      const recordsToSave: CampusManagerAnalysisRecord[] = validData.map((record) => ({
        key: record.key,
        month: record.month,
        campus: record.campus,
        name: record.name,
        ideology: {
          values: record.values || 0,
          responsibility: record.responsibility || 0,
          execution: record.execution || 0,
        },
        management: {
          planning: record.planning || 0,
          organization: record.organization || 0,
          leadership: record.leadership || 0,
          control: record.control || 0,
        },
        businessCapability: {
          studentEmployment: record.studentEmployment || 0,
          reputationEnrollment: record.reputationEnrollment || 0,
          studentAttrition: record.studentAttrition || 0,
          furtherEducation: record.furtherEducation || 0,
          academicManagement: record.academicManagement || 0,
          dormitoryManagement: record.dormitoryManagement || 0,
        },
        totalScore: record.totalScore || 0,
      }))

      const loadingMessage = message.loading({ content: '正在保存...', key: 'save', duration: 0 })
      try {
        await campusManagerAnalysisService.saveCampusManagerAnalysisData(
          campus,
          recordsToSave,
          selectedYear,
          position as 'manager' | 'deputy',
        )
        message.success({ content: '保存成功', key: 'save' })

        // 保存成功后刷新数据（延迟一下，确保后端事务已提交）
        // 使用 forceReload=true 强制刷新，避免被 loading 状态阻止
        setTimeout(async () => {
          await loadData(campus, true)
        }, 500)
      } finally {
        // 确保加载消息被清除
        if (loadingMessage) {
          message.destroy('save')
        }
      }
    } catch (error) {
      message.error({ content: '保存失败', key: 'save' })
      console.error('保存失败:', error)
    }
  }

  const handleExport = async () => {
    try {
      const campus = selectedCampus === ALL_CAMPUSES ? '' : selectedCampus
      const blob = await campusManagerAnalysisService.exportCampusManagerAnalysisData(campus)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `神殿教化司经理、副经理功能分析表_${selectedYear}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
      console.error(error)
    }
  }

  // 实时保存函数（防抖）
  const saveRecord = async (record: ManagerFunctionRecord, isManager: boolean) => {
    const recordKey = record.key
    if (recordKey === 'average' || recordKey.includes('placeholder')) return

    // 清除之前的定时器
    if (saveTimerRef.current[recordKey]) {
      clearTimeout(saveTimerRef.current[recordKey])
    }

    // 设置保存状态
    setSavingKeys((prev) => new Set(prev).add(recordKey))

    // 防抖：500ms 后保存
    saveTimerRef.current[recordKey] = setTimeout(async () => {
      try {
        const campus = selectedCampus === ALL_CAMPUSES ? record.campus : selectedCampus
        
        // 关键修复：根据当前激活的标签页确定 position，而不是依赖传入的 isManager 参数
        // 这样可以确保在正确的标签页保存数据到正确的表
        const currentIsManager = activeTab === 'manager'
        const position = currentIsManager ? 'manager' : 'deputy'

        // 如果姓名为空，使用占位符（避免后端拒绝保存）
        const recordName: string = record.name?.trim() || (currentIsManager ? '经理' : '副经理')

        // 调试：打印保存信息（明确显示保存到哪个表）
        const targetTable = currentIsManager ? '教质经理功能分析月表' : '教质副经理功能分析月表'
        console.log(`[saveRecord] 保存记录到表: ${targetTable}, activeTab=${activeTab}, position=${position}, 神殿=${campus}, 年份=${selectedYear}, 月份=${record.month}, 姓名=${recordName}`)
        
        await campusManagerAnalysisService.updateCampusManagerAnalysisData({
          campus,
          month: record.month,
          year: selectedYear,
          position,
          data: {
            key: record.key,
            month: record.month,
            campus: record.campus,
            name: recordName,
            ideology: {
              values: record.values,
              responsibility: record.responsibility,
              execution: record.execution,
            },
            management: {
              planning: record.planning,
              organization: record.organization,
              leadership: record.leadership,
              control: record.control,
            },
            businessCapability: {
              studentEmployment: record.studentEmployment,
              reputationEnrollment: record.reputationEnrollment,
              studentAttrition: record.studentAttrition,
              furtherEducation: record.furtherEducation,
              academicManagement: record.academicManagement,
              dormitoryManagement: record.dormitoryManagement,
            },
            totalScore: record.totalScore,
          },
        })

        // 保存成功，清除保存状态
        // 注意：不在这里刷新数据，因为会导致用户正在编辑的其他单元格被重置
        // 数据已经在 updateRecord 中更新到前端状态，保持前端状态即可
        console.log(`[saveRecord] 保存成功: 神殿=${campus}, 月份=${record.month}, 姓名=${recordName}`)

        setSavingKeys((prev) => {
          const next = new Set(prev)
          next.delete(recordKey)
          return next
        })
      } catch (error) {
        console.error('保存失败:', error)
        message.error('保存失败')
        setSavingKeys((prev) => {
          const next = new Set(prev)
          next.delete(recordKey)
          return next
        })
      }
    }, 500)
  }

  // 更新记录并实时保存
  const updateRecord = (key: string, field: keyof ManagerFunctionRecord, value: number | string, isManager: boolean) => {
    const updateData = (data: ManagerFunctionRecord[], setData: React.Dispatch<React.SetStateAction<ManagerFunctionRecord[]>>, setFiltered: React.Dispatch<React.SetStateAction<ManagerFunctionRecord[]>>) => {
      const newData = data.map((record) => {
        if (record.key === key) {
          const updated = { ...record, [field]: value }
          // 如果是分数字段，重新计算平均分（13个评分项的平均值）
          if (
            field !== 'key' &&
            field !== 'month' &&
            field !== 'campus' &&
            field !== 'name' &&
            field !== 'totalScore'
          ) {
            const sum =
              updated.values +
              updated.responsibility +
              updated.execution +
              updated.planning +
              updated.organization +
              updated.leadership +
              updated.control +
              updated.studentEmployment +
              updated.reputationEnrollment +
              updated.studentAttrition +
              updated.furtherEducation +
              updated.academicManagement +
              updated.dormitoryManagement
            updated.totalScore = Math.round((sum / 13) * 10) / 10 // 保留一位小数
          }
          // 实时保存
          saveRecord(updated, isManager)
          return updated
        }
        return record
      })

      setData(newData)
      
      // 应用筛选逻辑（更新数据后重新筛选）
      let filtered = newData
      
      // 神殿筛选：如果选择了单个神殿（不是全部神殿），只显示该神殿的数据
      if (selectedCampus && selectedCampus !== ALL_CAMPUSES) {
        filtered = filtered.filter((record) => {
          // 支持神殿名称的变体匹配（如"主神殿"和"盛邦"）
          const recordCampus = (record.campus || '').replace(/神殿$/, '')
          const filterCampus = selectedCampus.replace(/神殿$/, '')
          return recordCampus === filterCampus || record.campus === selectedCampus
        })
      }
      
      // 搜索筛选
      if (searchText) {
        const lowercasedValue = searchText.toLowerCase()
        filtered = filtered.filter(
          (record) =>
            record.campus.toLowerCase().includes(lowercasedValue) ||
            record.name.toLowerCase().includes(lowercasedValue),
        )
      }
      
      setFiltered(filtered)
    }

    if (isManager) {
      updateData(managerData, setManagerData, setFilteredManagerData)
    } else {
      updateData(deputyManagerData, setDeputyManagerData, setFilteredDeputyManagerData)
    }
  }

  // 创建可编辑的单元格组件
  const createEditableCell = (field: keyof ManagerFunctionRecord, isManager: boolean) => {
    return (value: number, record: ManagerFunctionRecord) => {
      if (record.key === 'average') {
        return <Typography.Text strong>{value > 0 ? value : ''}</Typography.Text>
      }

      const isSaving = savingKeys.has(record.key)
      const displayValue = value > 0 ? value : ''

      return (
        <InputNumber
          value={value}
          min={0}
          max={100}
          style={{ width: '100%', border: 'none', background: isSaving ? '#fffbe6' : 'transparent' }}
          controls={false}
          onChange={(val) => {
            const numValue = val || 0
            updateRecord(record.key, field, numValue, isManager)
          }}
          onBlur={() => {
            // 失焦时立即保存（如果防抖还没触发）
            // 注意：saveRecord 内部会根据当前 activeTab 确定 position，确保保存到正确的表
            if (saveTimerRef.current[record.key]) {
              clearTimeout(saveTimerRef.current[record.key])
              saveRecord(record, isManager)
            }
          }}
          placeholder=""
          formatter={(val) => (val && Number(val) > 0 ? String(val) : '')}
          parser={(val) => (val ? Number(val) : 0)}
        />
      )
    }
  }

  // 生成列定义
  const getColumns = (isManagerTab: boolean): ColumnsType<ManagerFunctionRecord> => [
    {
      title: '序号',
      dataIndex: 'key',
      key: 'key',
      width: 60,
      fixed: 'left',
      render: (text, record, index) => (record.key === 'average' ? '' : index + 1),
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 120,
      fixed: 'left',
      render: (text, record) =>
        record.key === 'average' ? <Typography.Text strong>{text}</Typography.Text> : text,
    },
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      fixed: 'left',
      render: (value, record) => {
        if (record.key === 'average') return ''
        return (
          <InputNumber
            value={value}
            min={1}
            max={12}
            style={{ width: '100%', border: 'none' }}
            controls={false}
            onChange={(val) => {
              if (val) updateRecord(record.key, 'month', val, isManagerTab)
            }}
          />
        )
      },
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      fixed: 'left',
      render: (text, record) => {
        if (record.key === 'average') return ''
        return (
          <Input
            value={text}
            style={{ border: 'none', width: '100%' }}
            onChange={(e) => updateRecord(record.key, 'name', e.target.value, isManagerTab)}
            placeholder=""
          />
        )
      },
    },
    {
      title: '思想',
      children: [
        {
          title: '价值观',
          dataIndex: 'values',
          key: 'values',
          width: 90,
          render: createEditableCell('values', isManagerTab),
        },
        {
          title: '责任感',
          dataIndex: 'responsibility',
          key: 'responsibility',
          width: 90,
          render: createEditableCell('responsibility', isManagerTab),
        },
        {
          title: '执行力',
          dataIndex: 'execution',
          key: 'execution',
          width: 90,
          render: createEditableCell('execution', isManagerTab),
        },
      ],
    },
    {
      title: '管理',
      children: [
        {
          title: '计划',
          dataIndex: 'planning',
          key: 'planning',
          width: 90,
          render: createEditableCell('planning', isManagerTab),
        },
        {
          title: '组织',
          dataIndex: 'organization',
          key: 'organization',
          width: 90,
          render: createEditableCell('organization', isManagerTab),
        },
        {
          title: '领导',
          dataIndex: 'leadership',
          key: 'leadership',
          width: 90,
          render: createEditableCell('leadership', isManagerTab),
        },
        {
          title: '控制',
          dataIndex: 'control',
          key: 'control',
          width: 90,
          render: createEditableCell('control', isManagerTab),
        },
      ],
    },
    {
      title: '业务能力',
      children: [
        {
          title: '学员就业',
          dataIndex: 'studentEmployment',
          key: 'studentEmployment',
          width: 100,
          render: createEditableCell('studentEmployment', isManagerTab),
        },
        {
          title: '口碑招生',
          dataIndex: 'reputationEnrollment',
          key: 'reputationEnrollment',
          width: 100,
          render: createEditableCell('reputationEnrollment', isManagerTab),
        },
        {
          title: '学员流失',
          dataIndex: 'studentAttrition',
          key: 'studentAttrition',
          width: 100,
          render: createEditableCell('studentAttrition', isManagerTab),
        },
        {
          title: '升学',
          dataIndex: 'furtherEducation',
          key: 'furtherEducation',
          width: 90,
          render: createEditableCell('furtherEducation', isManagerTab),
        },
        {
          title: '教务管理能力',
          dataIndex: 'academicManagement',
          key: 'academicManagement',
          width: 130,
          render: createEditableCell('academicManagement', isManagerTab),
        },
        {
          title: '宿舍管理能力',
          dataIndex: 'dormitoryManagement',
          key: 'dormitoryManagement',
          width: 130,
          render: createEditableCell('dormitoryManagement', isManagerTab),
        },
      ],
    },
    {
      title: '平均分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 100,
      render: (value, record) => {
        if (record.key === 'average') {
          return <Typography.Text strong>{value}</Typography.Text>
        }
        // 计算平均分：13个评分项的平均值
        const avg = (
          record.values +
          record.responsibility +
          record.execution +
          record.planning +
          record.organization +
          record.leadership +
          record.control +
          record.studentEmployment +
          record.reputationEnrollment +
          record.studentAttrition +
          record.furtherEducation +
          record.academicManagement +
          record.dormitoryManagement
        ) / 13
        return avg > 0 ? avg.toFixed(1) : ''
      },
    },
  ]

  // 计算平均值和关键指标
  const managerAverageRow = calculateAverages(filteredManagerData)
  const deputyManagerAverageRow = calculateAverages(filteredDeputyManagerData)
  const managerDataSourceWithAverage = [...filteredManagerData, managerAverageRow]
  const deputyManagerDataSourceWithAverage = [...filteredDeputyManagerData, deputyManagerAverageRow]

  // 根据当前激活的标签页计算关键指标
  const currentAverageRow = activeTab === 'manager' ? managerAverageRow : deputyManagerAverageRow
  const avgValues = currentAverageRow.values
  const avgResponsibility = currentAverageRow.responsibility
  const avgExecution = currentAverageRow.execution
  const avgLeadership = currentAverageRow.leadership
  const avgStudentEmployment = currentAverageRow.studentEmployment
  const avgTotalScore = currentAverageRow.totalScore

  return (
    <div style={{ padding: 24 }}>
      {/* 关键指标统计卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={4}>
            <Statistic
              title="平均价值观"
              value={avgValues}
              suffix="分"
              prefix={<StarOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="平均责任感"
              value={avgResponsibility}
              suffix="分"
              prefix={<StarOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="平均执行力"
              value={avgExecution}
              suffix="分"
              prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="平均领导力"
              value={avgLeadership}
              suffix="分"
              prefix={<TrophyOutlined style={{ color: '#722ed1' }} />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="平均学员就业"
              value={avgStudentEmployment}
              suffix="分"
              prefix={<UserOutlined style={{ color: '#13c2c2' }} />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="平均总分"
              value={avgTotalScore}
              suffix="分"
              prefix={<TrophyOutlined style={{ color: '#eb2f96' }} />}
            />
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card
        title="10. 神殿教化司经理、副经理功能分析表"
        extra={
          <Space wrap>
            <DatePicker
              picker="year"
              value={selectedYearDate}
              onChange={(date) => {
                if (date) {
                  const year = date.year()
                  setSelectedYearDate(date)
                  setSelectedYear(year)
                }
              }}
              style={{ width: 120 }}
              allowClear={false}
              placeholder="选择年份"
            />
            <Select value={selectedCampus} onChange={handleCampusChange} style={{ width: 180 }} placeholder="选择神殿">
              <Option key={ALL_CAMPUSES} value={ALL_CAMPUSES}>
                全部神殿
              </Option>
              {campusStore.getAllCampuses().map((c) => (
                <Option key={c.name} value={c.name}>
                  {c.name}
                </Option>
              ))}
            </Select>
            <Input.Search
              placeholder="搜索神殿或姓名"
              onSearch={handleSearch}
              style={{ width: 200 }}
              allowClear
            />
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
              保存
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          {
            key: 'manager',
            label: '教质经理功能分析表',
            children: (
              <Spin spinning={loading}>
                <Table
                  columns={getColumns(true)}
                  dataSource={managerDataSourceWithAverage}
                  pagination={false}
                  bordered
                  scroll={{ x: 'max-content' }}
                  rowClassName={(record) => (record.key === 'average' ? 'average-row' : '')}
                  size="small"
                />
              </Spin>
            ),
          },
          {
            key: 'deputy',
            label: '教质副经理功能分析表',
            children: (
              <Spin spinning={loading}>
                <Table
                  columns={getColumns(false)}
                  dataSource={deputyManagerDataSourceWithAverage}
                  pagination={false}
                  bordered
                  scroll={{ x: 'max-content' }}
                  rowClassName={(record) => (record.key === 'average' ? 'average-row' : '')}
                  size="small"
                />
              </Spin>
            ),
          },
        ]} />
        <style>{`
          .average-row {
            background-color: #f0f9ff !important;
            font-weight: bold;
          }
          .average-row td {
            background-color: #f0f9ff !important;
          }
          .ant-table-cell {
            padding: 4px 8px !important;
          }
          .ant-input-number {
            border: none !important;
            box-shadow: none !important;
          }
          .ant-input-number:focus {
            border: 1px solid #40a9ff !important;
            box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
          }
          .ant-input {
            border: none !important;
            box-shadow: none !important;
          }
          .ant-input:focus {
            border: 1px solid #40a9ff !important;
            box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
          }
        `}</style>
      </Card>
    </div>
  )
}

export default CampusManagerAnalysisPage
