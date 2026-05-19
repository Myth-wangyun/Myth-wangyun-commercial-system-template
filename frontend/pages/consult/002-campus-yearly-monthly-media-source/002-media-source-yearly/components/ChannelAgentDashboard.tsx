/**
 * ChannelAgentDashboard - 渠道人资数据看板
 * 
 * 包含4个表格：
 * 1. 渠道人资年度汇总表（神殿汇总 - 单行）
 * 2. 渠道人资月度数据表（按月份）
 * 3. 渠道人资汇总表（按渠道人资）
 * 4. 渠道人资月度明细表（按月份+渠道人资 - 可编辑）
 * 
 * 数据流向：月度明细表 -> 其他所有表格
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { App, Table, Spin, Divider, Input, InputNumber, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { NoCopyContainer } from '@/components/common'
import api from '@/services/api'

// ==================== 类型定义 ====================

// 神殿汇总行（单行汇总）
interface CampusSummaryRow {
  key: string
  序号: string
  渠道人资: string
  区域: number | null
  // 渠道招生数据
  咨询量: number | null
  上门量: number | null
  订座: number | null
  实际招生: number | null
  退费人数: number | null
  // 渠道转化率
  报名转化率: string
  当面转化率: string
  上门率: string
  // 渠道职数
  渠道总职数: number | null
  县办: number | null
  乡办: number | null
  信息员: number | null
}

// 月度数据行
interface MonthlyDataRow {
  key: string
  月份: number | string
  渠道人资数: string
  区域数: string
  isTotal: boolean
  // 渠道招生数据
  咨询量: number | null
  上门量: number | null
  订座: number | null
  实际招生: number | null
  退费人数: number | null
  // 渠道转化率
  报名转化率: string
  当面转化率: string
  上门率: string
  // 渠道职数
  渠道总职数: number | null
  县办: number | null
  乡办: number | null
  信息员: number | null
}

// 渠道人资数据行
interface ChannelAgentRow {
  key: string
  序号: number | string
  渠道人资: string
  区域数: string
  isTotal: boolean
  // 渠道招生数据
  咨询量: number | null
  上门量: number | null
  订座: number | null
  实际招生: number | null
  退费人数: number | null
  // 渠道转化率
  报名转化率: string
  当面转化率: string
  上门率: string
  // 渠道职数
  渠道总职数: number | null
  县办: number | null
  乡办: number | null
  信息员: number | null
}

// 渠道人资月度数据行（可编辑）
interface ChannelAgentMonthlyRow {
  key: string
  id?: string
  月份: number | string
  实际月份?: number // 用于月度合计行存储实际月份
  渠道人资: string
  区域数: string
  isTotal: boolean
  isMonthTotal?: boolean
  // 渠道招生数据
  咨询量: number | null
  上门量: number | null
  订座: number | null
  实际招生: number | null
  退费人数: number | null
  // 渠道转化率
  报名转化率: string
  当面转化率: string
  上门率: string
  // 渠道职数
  渠道总职数: number | null
  县办: number | null
  乡办: number | null
  信息员: number | null
}

// ==================== Props ====================

interface Props {
  year: string
  bgColor?: string
}

// 月份常量
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

// 计算渠道转化率
const calculateChannelRates = (row: any) => {
  if (row.咨询量 && row.咨询量 > 0 && row.实际招生 !== null) {
    row.报名转化率 = ((row.实际招生 / row.咨询量) * 100).toFixed(2) + '%'
  } else {
    row.报名转化率 = '-'
  }
  
  if (row.上门量 && row.上门量 > 0 && row.实际招生 !== null) {
    row.当面转化率 = ((row.实际招生 / row.上门量) * 100).toFixed(2) + '%'
  } else {
    row.当面转化率 = '-'
  }
  
  if (row.咨询量 && row.咨询量 > 0 && row.上门量 !== null) {
    row.上门率 = ((row.上门量 / row.咨询量) * 100).toFixed(2) + '%'
  } else {
    row.上门率 = '-'
  }
}

// 渲染数值
const renderValue = (value: number | null | undefined, isTotal: boolean, color = '#1890ff') => {
  if (value === null || value === undefined) return <span>-</span>
  if (isTotal) {
    return <strong style={{ color }}>{value}</strong>
  }
  return <span>{value}</span>
}

// 渲染转化率
const renderRate = (val: string, isTotal: boolean) => {
  if (val === '-' || val === '#DIV/0!' || val === '#REF!' || val === '#VALUE!') {
    return <span style={{ color: '#999' }}>{val}</span>
  }
  const style = { color: '#52c41a', fontWeight: isTotal ? 'bold' as const : 'normal' as const }
  return <span style={style}>{val}</span>
}

// ==================== 主组件 ====================

export default function ChannelAgentDashboard({ year, bgColor = '#F0E68C' }: Props) {
  const { notification, message } = App.useApp()
  const campusStore = useCampusStore()
  const currentCampus = campusStore.currentCampus || '未选择'
  
  const [loading, setLoading] = useState(false)
  const [channelAgents, setChannelAgents] = useState<string[]>([])
  
  // 月度明细表是唯一的数据源
  const [agentMonthlyRows, setAgentMonthlyRows] = useState<ChannelAgentMonthlyRow[]>([])

  // 加载渠道人资列表
  const loadChannelAgents = useCallback(async () => {
    try {
      const channelResponse = await api.get('/config/department-users', {
        params: { department: '渠道部' }
      })
      // 接口返回 [{campus, users: [{real_name, ...}]}] 格式
      const groups = Array.isArray(channelResponse.data) ? channelResponse.data : []
      const campusGroup = groups.find((g: any) => g.campus === currentCampus)
      const users = campusGroup ? campusGroup.users : groups.flatMap((g: any) => g.users || [])
      const names = users.map((u: any) => u.real_name || '').filter(Boolean)
      setChannelAgents(names.length > 0 ? names : [])
    } catch {
      setChannelAgents([])
    }
  }, [currentCampus])

  // 初始化月度明细表
  const initAgentMonthlyData = useCallback(() => {
    const amData: ChannelAgentMonthlyRow[] = []
    let idCounter = 1

    MONTHS.forEach(m => {
      // 每个月默认3个空行
      for (let i = 0; i < 3; i++) {
        amData.push({
          key: `am_${m}_${idCounter}`,
          id: `${m}_${idCounter}`,
          月份: m,
          渠道人资: '',
          区域数: '0',
          isTotal: false,
          isMonthTotal: false,
          咨询量: null,
          上门量: null,
          订座: null,
          实际招生: null,
          退费人数: null,
          报名转化率: '-',
          当面转化率: '-',
          上门率: '-',
          渠道总职数: null,
          县办: null,
          乡办: null,
          信息员: null,
        })
        idCounter++
      }
      
      // 月度合计行 - 月份列显示"合计"，渠道人资列显示数量
      amData.push({
        key: `am_${m}_total`,
        id: `${m}_total`,
        月份: '合计',
        实际月份: m, // 保存实际月份用于添加按钮
        渠道人资: '0',
        区域数: '0',
        isTotal: false,
        isMonthTotal: true,
        咨询量: null,
        上门量: null,
        订座: null,
        实际招生: null,
        退费人数: null,
        报名转化率: '-',
        当面转化率: '-',
        上门率: '-',
        渠道总职数: null,
        县办: null,
        乡办: null,
        信息员: null,
      })
    })

    // 年度总合计
    amData.push({
      key: 'am_year_total',
      id: 'year_total',
      月份: '合计',
      渠道人资: '',
      区域数: '0',
      isTotal: true,
      isMonthTotal: false,
      咨询量: null,
      上门量: null,
      订座: null,
      实际招生: null,
      退费人数: null,
      报名转化率: '-',
      当面转化率: '-',
      上门率: '-',
      渠道总职数: null,
      县办: null,
      乡办: null,
      信息员: null,
    })

    setAgentMonthlyRows(amData)
  }, [])

  // 重新计算所有汇总数据
  const recalculateAllData = useCallback(() => {
    if (agentMonthlyRows.length === 0) return

    const newData = [...agentMonthlyRows]
    const detailRows = newData.filter(r => !r.isTotal && !r.isMonthTotal)
    
    // 计算每个月的合计
    MONTHS.forEach(m => {
      const monthRows = detailRows.filter(r => r.月份 === m && r.渠道人资.trim())
      const monthTotalIdx = newData.findIndex(r => r.isMonthTotal && r.key === `am_${m}_total`)
      
      if (monthTotalIdx > -1) {
        const monthTotalRow = newData[monthTotalIdx]
        
        // 渠道人资数量
        monthTotalRow.渠道人资 = monthRows.length.toString()
        
        // 汇总数据
        ;['咨询量', '上门量', '订座', '实际招生', '退费人数', '渠道总职数', '县办', '乡办', '信息员'].forEach(field => {
          const sum = monthRows.reduce((acc, r) => acc + ((r as any)[field] || 0), 0)
          ;(monthTotalRow as any)[field] = sum || null
        })
        
        // 区域数
        const regions = new Set(monthRows.map(r => r.区域数).filter(r => r && r !== '0'))
        monthTotalRow.区域数 = regions.size.toString()
        
        calculateChannelRates(monthTotalRow)
      }
    })
    
    // 计算年度总合计
    const yearTotalIdx = newData.findIndex(r => r.isTotal)
    if (yearTotalIdx > -1) {
      const yearTotalRow = newData[yearTotalIdx]
      const allDataRows = detailRows.filter(r => r.渠道人资.trim())
      
      ;['咨询量', '上门量', '订座', '实际招生', '退费人数', '渠道总职数', '县办', '乡办', '信息员'].forEach(field => {
        const sum = allDataRows.reduce((acc, r) => acc + ((r as any)[field] || 0), 0)
        ;(yearTotalRow as any)[field] = sum || null
      })
      
      const allRegions = new Set(allDataRows.map(r => r.区域数).filter(r => r && r !== '0'))
      yearTotalRow.区域数 = allRegions.size.toString()
      
      calculateChannelRates(yearTotalRow)
    }
    
    setAgentMonthlyRows(newData)
  }, [agentMonthlyRows])

  // 从月度明细计算神殿汇总（单行）
  const summaryRows = useMemo<CampusSummaryRow[]>(() => {
    const detailRows = agentMonthlyRows.filter(r => !r.isTotal && !r.isMonthTotal && r.渠道人资.trim())
    
    const summaryRow: CampusSummaryRow = {
      key: 'summary_total',
      序号: '合计',
      渠道人资: '',
      区域: null,
      咨询量: null,
      上门量: null,
      订座: null,
      实际招生: null,
      退费人数: null,
      报名转化率: '-',
      当面转化率: '-',
      上门率: '-',
      渠道总职数: null,
      县办: null,
      乡办: null,
      信息员: null,
    }
    
    ;['咨询量', '上门量', '订座', '实际招生', '退费人数', '渠道总职数', '县办', '乡办', '信息员'].forEach(field => {
      const sum = detailRows.reduce((acc, r) => acc + ((r as any)[field] || 0), 0)
      ;(summaryRow as any)[field] = sum || null
    })
    
    // 计算区域数
    const regions = new Set(detailRows.map(r => r.区域数).filter(r => r && r !== '0'))
    summaryRow.区域 = regions.size || null
    
    // 计算渠道人资数量（唯一的渠道人资）
    const uniqueAgents = new Set(detailRows.map(r => r.渠道人资.trim()).filter(a => a))
    summaryRow.渠道人资 = uniqueAgents.size.toString()
    
    calculateChannelRates(summaryRow)
    
    return [summaryRow]
  }, [agentMonthlyRows])

  // 从月度明细计算月度数据表
  const monthlyRows = useMemo<MonthlyDataRow[]>(() => {
    const data: MonthlyDataRow[] = []
    
    MONTHS.forEach(m => {
      const monthTotalRow = agentMonthlyRows.find(r => r.isMonthTotal && r.key === `am_${m}_total`)
      
      const row: MonthlyDataRow = {
        key: `monthly_${m}`,
        月份: m,
        渠道人资数: monthTotalRow?.渠道人资 || '0',
        区域数: monthTotalRow?.区域数 || '0',
        isTotal: false,
        咨询量: monthTotalRow?.咨询量 || null,
        上门量: monthTotalRow?.上门量 || null,
        订座: monthTotalRow?.订座 || null,
        实际招生: monthTotalRow?.实际招生 || null,
        退费人数: monthTotalRow?.退费人数 || null,
        报名转化率: monthTotalRow?.报名转化率 || '-',
        当面转化率: monthTotalRow?.当面转化率 || '-',
        上门率: monthTotalRow?.上门率 || '-',
        渠道总职数: monthTotalRow?.渠道总职数 || null,
        县办: monthTotalRow?.县办 || null,
        乡办: monthTotalRow?.乡办 || null,
        信息员: monthTotalRow?.信息员 || null,
      }
      
      data.push(row)
    })
    
    // 合计行
    const yearTotalRow = agentMonthlyRows.find(r => r.isTotal)
    data.push({
      key: 'monthly_total',
      月份: '合计',
      渠道人资数: '0',
      区域数: yearTotalRow?.区域数 || '0',
      isTotal: true,
      咨询量: yearTotalRow?.咨询量 || null,
      上门量: yearTotalRow?.上门量 || null,
      订座: yearTotalRow?.订座 || null,
      实际招生: yearTotalRow?.实际招生 || null,
      退费人数: yearTotalRow?.退费人数 || null,
      报名转化率: yearTotalRow?.报名转化率 || '-',
      当面转化率: yearTotalRow?.当面转化率 || '-',
      上门率: yearTotalRow?.上门率 || '-',
      渠道总职数: yearTotalRow?.渠道总职数 || null,
      县办: yearTotalRow?.县办 || null,
      乡办: yearTotalRow?.乡办 || null,
      信息员: yearTotalRow?.信息员 || null,
    })
    
    return data
  }, [agentMonthlyRows])

  // 从月度明细计算渠道人资汇总表
  const agentRows = useMemo<ChannelAgentRow[]>(() => {
    const detailRows = agentMonthlyRows.filter(r => !r.isTotal && !r.isMonthTotal && r.渠道人资.trim())
    
    // 按渠道人资分组
    const agentMap = new Map<string, ChannelAgentMonthlyRow[]>()
    detailRows.forEach(r => {
      const agent = r.渠道人资
      if (!agentMap.has(agent)) {
        agentMap.set(agent, [])
      }
      agentMap.get(agent)!.push(r)
    })
    
    const data: ChannelAgentRow[] = []
    let idx = 1
    
    agentMap.forEach((rows, agent) => {
      const row: ChannelAgentRow = {
        key: `agent_${idx}`,
        序号: idx,
        渠道人资: agent,
        区域数: '0',
        isTotal: false,
        咨询量: null,
        上门量: null,
        订座: null,
        实际招生: null,
        退费人数: null,
        报名转化率: '-',
        当面转化率: '-',
        上门率: '-',
        渠道总职数: null,
        县办: null,
        乡办: null,
        信息员: null,
      }
      
      ;['咨询量', '上门量', '订座', '实际招生', '退费人数', '渠道总职数', '县办', '乡办', '信息员'].forEach(field => {
        const sum = rows.reduce((acc, r) => acc + ((r as any)[field] || 0), 0)
        ;(row as any)[field] = sum || null
      })
      
      const regions = new Set(rows.map(r => r.区域数).filter(r => r && r !== '0'))
      row.区域数 = regions.size.toString()
      
      calculateChannelRates(row)
      
      data.push(row)
      idx++
    })
    
    // 补充空行到10行
    for (let i = data.length; i < 10; i++) {
      data.push({
        key: `agent_${i + 1}`,
        序号: i + 1,
        渠道人资: '',
        区域数: '0',
        isTotal: false,
        咨询量: null,
        上门量: null,
        订座: null,
        实际招生: null,
        退费人数: null,
        报名转化率: '-',
        当面转化率: '-',
        上门率: '-',
        渠道总职数: null,
        县办: null,
        乡办: null,
        信息员: null,
      })
    }
    
    // 合计行
    const yearTotalRow = agentMonthlyRows.find(r => r.isTotal)
    data.push({
      key: 'agent_total',
      序号: '合计',
      渠道人资: '',
      区域数: yearTotalRow?.区域数 || '0',
      isTotal: true,
      咨询量: yearTotalRow?.咨询量 || null,
      上门量: yearTotalRow?.上门量 || null,
      订座: yearTotalRow?.订座 || null,
      实际招生: yearTotalRow?.实际招生 || null,
      退费人数: yearTotalRow?.退费人数 || null,
      报名转化率: yearTotalRow?.报名转化率 || '-',
      当面转化率: yearTotalRow?.当面转化率 || '-',
      上门率: yearTotalRow?.上门率 || '-',
      渠道总职数: yearTotalRow?.渠道总职数 || null,
      县办: yearTotalRow?.县办 || null,
      乡办: yearTotalRow?.乡办 || null,
      信息员: yearTotalRow?.信息员 || null,
    })
    
    return data
  }, [agentMonthlyRows])

  // 编辑功能
  const handleCellEdit = useCallback((rowKey: string, field: string, value: any) => {
    setAgentMonthlyRows(prevData => {
      const newData = [...prevData]
      const index = newData.findIndex(r => r.key === rowKey)
      if (index > -1 && !newData[index].isTotal && !newData[index].isMonthTotal) {
        ;(newData[index] as any)[field] = value
        
        // 如果编辑的是数据字段，重新计算转化率
        if (['咨询量', '上门量', '实际招生'].includes(field)) {
          calculateChannelRates(newData[index])
        }
      }
      return newData
    })
  }, [])

  // 触发重新计算的 effect
  useEffect(() => {
    if (agentMonthlyRows.length > 0) {
      const timer = setTimeout(() => {
        recalculateAllData()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [agentMonthlyRows])

  // 保存数据到数据库
  const saveData = useCallback(async () => {
    setLoading(true)
    try {
      const detailRows = agentMonthlyRows.filter(r => !r.isTotal && !r.isMonthTotal && r.渠道人资.trim())
      
      const payload = {
        year: parseInt(year),
        data: detailRows.map(row => ({
          月份: row.月份,
          渠道人资: row.渠道人资,
          区域数: row.区域数,
          咨询量: row.咨询量,
          上门量: row.上门量,
          订座: row.订座,
          实际招生: row.实际招生,
          退费人数: row.退费人数,
          渠道总职数: row.渠道总职数,
          县办: row.县办,
          乡办: row.乡办,
          信息员: row.信息员,
        }))
      }
      
      const response = await api.post('/channel-agent-data/save', payload)
      
      if (response.data?.success) {
        notification.success({ message: '已保存', description: '数据保存成功', placement: 'topRight', duration: 3 })
      } else {
        notification.error({ message: '保存失败', description: response.data?.message || '保存失败', placement: 'topRight', duration: 4 })
      }
    } catch (error: any) {
      console.error('保存数据失败:', error)
      notification.error({ message: '保存失败', description: error.response?.data?.message || '保存数据失败', placement: 'topRight', duration: 4 })
    } finally {
      setLoading(false)
    }
  }, [agentMonthlyRows, year])

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/channel-agent-data/list', {
        params: { year: parseInt(year) }
      })
      
      if (response.data?.success && response.data?.data && response.data.data.length > 0) {
        // 重建月度明细表数据
        const amData: ChannelAgentMonthlyRow[] = []
        let idCounter = 1
        
        MONTHS.forEach(m => {
          // 获取该月的数据
          const monthData = response.data.data.filter((d: any) => d.月份 === m)
          
          // 添加已有数据行
          monthData.forEach((d: any) => {
            amData.push({
              key: `am_${m}_${idCounter}`,
              id: `${m}_${idCounter}`,
              月份: m,
              渠道人资: d.渠道人资 || '',
              区域数: d.区域数 || '0',
              isTotal: false,
              isMonthTotal: false,
              咨询量: d.咨询量,
              上门量: d.上门量,
              订座: d.订座,
              实际招生: d.实际招生,
              退费人数: d.退费人数,
              报名转化率: '-',
              当面转化率: '-',
              上门率: '-',
              渠道总职数: d.渠道总职数,
              县办: d.县办,
              乡办: d.乡办,
              信息员: d.信息员,
            })
            idCounter++
          })
          
          // 补充3个空行
          for (let i = 0; i < 3; i++) {
            amData.push({
              key: `am_${m}_${idCounter}`,
              id: `${m}_${idCounter}`,
              月份: m,
              渠道人资: '',
              区域数: '0',
              isTotal: false,
              isMonthTotal: false,
              咨询量: null,
              上门量: null,
              订座: null,
              实际招生: null,
              退费人数: null,
              报名转化率: '-',
              当面转化率: '-',
              上门率: '-',
              渠道总职数: null,
              县办: null,
              乡办: null,
              信息员: null,
            })
            idCounter++
          }
          
          // 月度合计行
          amData.push({
            key: `am_${m}_total`,
            id: `${m}_total`,
            月份: '合计',
            实际月份: m, // 保存实际月份
            渠道人资: '0',
            区域数: '0',
            isTotal: false,
            isMonthTotal: true,
            咨询量: null,
            上门量: null,
            订座: null,
            实际招生: null,
            退费人数: null,
            报名转化率: '-',
            当面转化率: '-',
            上门率: '-',
            渠道总职数: null,
            县办: null,
            乡办: null,
            信息员: null,
          })
        })
        
        // 年度总合计
        amData.push({
          key: 'am_year_total',
          id: 'year_total',
          月份: '合计',
          渠道人资: '',
          区域数: '0',
          isTotal: true,
          isMonthTotal: false,
          咨询量: null,
          上门量: null,
          订座: null,
          实际招生: null,
          退费人数: null,
          报名转化率: '-',
          当面转化率: '-',
          上门率: '-',
          渠道总职数: null,
          县办: null,
          乡办: null,
          信息员: null,
        })
        
        setAgentMonthlyRows(amData)
        message.success('数据加载成功')
      } else {
        // 没有数据，初始化空表
        initAgentMonthlyData()
      }
    } catch (error: any) {
      console.error('加载数据失败:', error)
      // 加载失败也初始化空表
      initAgentMonthlyData()
    } finally {
      setLoading(false)
    }
  }, [year, initAgentMonthlyData])

  // 添加一行
  const handleAddRow = useCallback((month: number) => {
    const newData = [...agentMonthlyRows]
    const monthTotalIdx = newData.findIndex(r => r.isMonthTotal && r.key === `am_${month}_total`)
    
    if (monthTotalIdx > -1) {
      const newRow: ChannelAgentMonthlyRow = {
        key: `am_${month}_${Date.now()}`,
        id: `${month}_${Date.now()}`,
        月份: month,
        渠道人资: '',
        区域数: '0',
        isTotal: false,
        isMonthTotal: false,
        咨询量: null,
        上门量: null,
        订座: null,
        实际招生: null,
        退费人数: null,
        报名转化率: '-',
        当面转化率: '-',
        上门率: '-',
        渠道总职数: null,
        县办: null,
        乡办: null,
        信息员: null,
      }
      newData.splice(monthTotalIdx, 0, newRow)
      setAgentMonthlyRows(newData)
    }
  }, [agentMonthlyRows])

  // 删除一行
  const handleDeleteRow = useCallback((rowKey: string) => {
    const newData = agentMonthlyRows.filter(r => r.key !== rowKey)
    setAgentMonthlyRows(newData)
    setTimeout(() => recalculateAllData(), 100)
  }, [agentMonthlyRows, recalculateAllData])

  useEffect(() => {
    loadChannelAgents()
  }, [loadChannelAgents])

  useEffect(() => {
    if (year) {
      loadData()
    }
  }, [year, loadData])

  // ==================== 列定义 ====================

  const channelDataColumns: ColumnsType<any> = [
    { title: '咨询量', dataIndex: '咨询量', width: 80, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
    { title: '上门量', dataIndex: '上门量', width: 80, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
    { title: '订座', dataIndex: '订座', width: 70, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
    { title: '实际招生', dataIndex: '实际招生', width: 80, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
    { title: '退费人数', dataIndex: '退费人数', width: 80, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
  ]

  const channelRateColumns: ColumnsType<any> = [
    { title: '报名转化率', dataIndex: '报名转化率', width: 100, align: 'center', render: (v, r) => renderRate(v, r.isTotal) },
    { title: '当面转化率', dataIndex: '当面转化率', width: 100, align: 'center', render: (v, r) => renderRate(v, r.isTotal) },
    { title: '上门率', dataIndex: '上门率', width: 80, align: 'center', render: (v, r) => renderRate(v, r.isTotal) },
  ]

  const channelJobColumns: ColumnsType<any> = [
    { title: '渠道总职数', dataIndex: '渠道总职数', width: 90, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
    { title: '县办', dataIndex: '县办', width: 60, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
    { title: '乡办', dataIndex: '乡办', width: 60, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
    { title: '信息员', dataIndex: '信息员', width: 70, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
  ]

  // 1. 神殿汇总表列
  const summaryColumns: ColumnsType<CampusSummaryRow> = useMemo(() => [
    { title: '序号', dataIndex: '序号', width: 50, align: 'center', fixed: 'left', render: (v) => <strong style={{ color: '#f5222d' }}>{v}</strong> },
    { title: '渠道人资', dataIndex: '渠道人资', width: 100, fixed: 'left' },
    { title: '区域', dataIndex: '区域', width: 80, align: 'center', render: (v) => renderValue(v, true) },
    { title: '渠道招生数据', children: channelDataColumns },
    { title: '渠道转化率', children: channelRateColumns },
    { title: '渠道职数', children: channelJobColumns },
  ], [channelDataColumns, channelRateColumns, channelJobColumns])

  // 2. 月度数据表列
  const monthlyColumns: ColumnsType<MonthlyDataRow> = useMemo(() => [
    { title: '月份', dataIndex: '月份', width: 50, align: 'center', fixed: 'left', render: (v, r) => r.isTotal ? <strong style={{ color: '#f5222d' }}>{v}</strong> : v },
    { title: '渠道人资（数）', dataIndex: '渠道人资数', width: 100, align: 'center' },
    { title: '区域（数）', dataIndex: '区域数', width: 90, align: 'center' },
    { title: '渠道招生数据', children: channelDataColumns },
    { title: '渠道转化率', children: channelRateColumns },
    { title: '渠道职数', children: channelJobColumns },
  ], [channelDataColumns, channelRateColumns, channelJobColumns])

  // 3. 渠道人资汇总表列
  const agentColumns: ColumnsType<ChannelAgentRow> = useMemo(() => [
    { title: '序号', dataIndex: '序号', width: 50, align: 'center', render: (v, r) => r.isTotal ? <strong style={{ color: '#f5222d' }}>{v}</strong> : v },
    { title: '渠道人资', dataIndex: '渠道人资', width: 100 },
    { title: '区域（数）', dataIndex: '区域数', width: 90, align: 'center' },
    { title: '渠道招生数据', children: channelDataColumns },
    { title: '渠道转化率', children: channelRateColumns },
    { title: '渠道职数', children: channelJobColumns },
  ], [channelDataColumns, channelRateColumns, channelJobColumns])

  // 4. 渠道人资月度明细表列（可编辑）
  const agentMonthlyColumns: ColumnsType<ChannelAgentMonthlyRow> = useMemo(() => {
    const makeEditableColumn = (title: string, dataIndex: string, width: number) => ({
      title,
      dataIndex,
      width,
      align: 'center' as const,
      render: (val: any, record: ChannelAgentMonthlyRow) => {
        if (record.isTotal || record.isMonthTotal) {
          return record.isTotal ? <strong style={{ color: '#f5222d' }}>{val || '-'}</strong> : <strong style={{ color: '#1890ff' }}>{val || '-'}</strong>
        }
        return (
          <InputNumber
            value={val}
            onChange={(v) => handleCellEdit(record.key, dataIndex, v)}
            size="small"
            style={{ width: '100%' }}
            min={0}
          />
        )
      }
    })

    return [
      { 
        title: '月份', 
        dataIndex: '月份', 
        width: 50, 
        align: 'center' as const,
        fixed: 'left' as const,
        render: (v: any, r: ChannelAgentMonthlyRow) => {
          if (r.isTotal || r.isMonthTotal) {
            return <strong style={{ color: r.isTotal ? '#f5222d' : '#1890ff' }}>{v}</strong>
          }
          return v
        }
      },
      { 
        title: '渠道人资', 
        dataIndex: '渠道人资', 
        width: 120,
        render: (val: string, record: ChannelAgentMonthlyRow) => {
          if (record.isTotal) return ''
          if (record.isMonthTotal) {
            return <strong style={{ color: '#1890ff' }}>{val}人</strong>
          }
          return (
            <Input
              value={val}
              onChange={(e) => handleCellEdit(record.key, '渠道人资', e.target.value)}
              size="small"
              placeholder="输入姓名"
            />
          )
        }
      },
      {
        title: '区域（数）',
        dataIndex: '区域数',
        width: 90,
        align: 'center' as const,
        render: (val: string, record: ChannelAgentMonthlyRow) => {
          if (record.isTotal || record.isMonthTotal) {
            return <strong style={{ color: record.isTotal ? '#f5222d' : '#1890ff' }}>{val}</strong>
          }
          return (
            <Input
              value={val}
              onChange={(e) => handleCellEdit(record.key, '区域数', e.target.value)}
              size="small"
            />
          )
        }
      },
      { title: '渠道招生数据', children: [
        makeEditableColumn('咨询量', '咨询量', 80),
        makeEditableColumn('上门量', '上门量', 80),
        makeEditableColumn('订座', '订座', 70),
        makeEditableColumn('实际招生', '实际招生', 80),
        makeEditableColumn('退费人数', '退费人数', 80),
      ]},
      { title: '渠道转化率', children: channelRateColumns },
      { title: '渠道职数', children: [
        makeEditableColumn('渠道总职数', '渠道总职数', 90),
        makeEditableColumn('县办', '县办', 60),
        makeEditableColumn('乡办', '乡办', 60),
        makeEditableColumn('信息员', '信息员', 70),
      ]},
      {
        title: '操作',
        width: 80,
        align: 'center' as const,
        fixed: 'right' as const,
        render: (_: any, record: ChannelAgentMonthlyRow) => {
          if (record.isTotal) {
            return null
          }
          if (record.isMonthTotal) {
            // 月度合计行显示添加按钮
            return (
              <Button 
                type="link" 
                size="small" 
                icon={<PlusOutlined />}
                onClick={() => record.实际月份 && handleAddRow(record.实际月份)}
              >
                添加
              </Button>
            )
          }
          // 普通数据行显示删除按钮
          return (
            <Button 
              type="link" 
              danger 
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteRow(record.key)}
            >
              删除
            </Button>
          )
        }
      }
    ]
  }, [handleCellEdit, handleAddRow, handleDeleteRow, channelRateColumns])

  const headerStyle = {
    background: bgColor,
    color: '#000',
    padding: '8px 12px',
    fontWeight: 'bold' as const,
    fontSize: '14px',
    marginBottom: '8px',
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin tip="加载数据中..." />
      </div>
    )
  }

  return (
    <NoCopyContainer>
      <div style={{ padding: '8px' }}>
        {/* 1. 神殿汇总表 - 单行 */}
        <div style={headerStyle}>
          清美教育集团{year}年度渠道数据核心数据看板-渠道人资（神殿汇总）
        </div>
        <Table
          columns={summaryColumns}
          dataSource={summaryRows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1400 }}
        />

        <Divider style={{ margin: '16px 0' }} />

        {/* 2. 月度数据表 */}
        <div style={headerStyle}>
          清美教育集团{year}年度渠道数据核心数据看板-渠道人资（月度）
        </div>
        <Table
          columns={monthlyColumns}
          dataSource={monthlyRows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1500 }}
          rowClassName={(record) => record.isTotal ? 'total-row' : ''}
        />

        <Divider style={{ margin: '16px 0' }} />

        {/* 3. 渠道人资汇总表 */}
        <div style={headerStyle}>
          清美教育集团{year}年度渠道数据核心数据看板-渠道人资（年度汇总）
        </div>
        <Table
          columns={agentColumns}
          dataSource={agentRows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1400 }}
          rowClassName={(record) => record.isTotal ? 'total-row' : ''}
        />

        <Divider style={{ margin: '16px 0' }} />

        {/* 4. 渠道人资月度明细表 - 可编辑 */}
        <div style={headerStyle}>
          清美教育集团{year}年度渠道数据核心数据看板-渠道人资（月度明细 - 可编辑）
        </div>
        
        {/* 操作按钮 - 放在月度明细表上方 */}
        <div style={{ marginBottom: '16px', marginTop: '8px', textAlign: 'right' }}>
          <Button 
            type="primary" 
            onClick={saveData}
            loading={loading}
            style={{ marginRight: '8px' }}
          >
            保存数据
          </Button>
          <Button 
            onClick={loadData}
            loading={loading}
          >
            重新加载
          </Button>
        </div>
        
        <Table
          columns={agentMonthlyColumns}
          dataSource={agentMonthlyRows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1600, y: 600 }}
          rowClassName={(record) => {
            if (record.isTotal) return 'total-row'
            if (record.isMonthTotal) return 'month-total-row'
            return ''
          }}
        />
      </div>

      <style>{`
        .total-row td {
          background-color: #fff1f0 !important;
          font-weight: bold;
        }
        .month-total-row td {
          background-color: #e6f7ff !important;
          font-weight: bold;
        }
      `}</style>
    </NoCopyContainer>
  )
}
