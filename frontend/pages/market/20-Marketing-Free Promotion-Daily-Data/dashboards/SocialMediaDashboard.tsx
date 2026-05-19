import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { Button, DatePicker, Space, Table, Typography, InputNumber, Input, App } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import axios from 'axios'
import EditableCell from './EditableCell'
import ExcelImporter, { type ImportedData } from '../ExcelImporter'
import './DashboardStyles.css'

const { Title } = Typography

interface SocialMediaDashboardProps {
  campusId: string
  campusName: string
  selectedMonth: Dayjs
  onMonthChange: (month: Dayjs) => void
}

interface DataRow {
  key: string
  weekday: string
  dateText: string
  actualIncome: number
  signupConversionRate: string | null
  refundCount: number
  netSignup: number
  grossTotal: number
  orderCount: number
  visitCount: number
  consultCount: number
  consultCost: string | null
  consumption: number
  // 抖音总览
  douyinValidCount: number
  douyinPlayCount: number
  douyinLikeCount: number
  douyinCommentCount: number
  douyinShareCount: number
  douyinCollectCount: number
  douyinConsultCount: number
  // 抖音内容吸引力
  douyinCompletionRate: number | null
  douyin2sExitRate: number | null
  douyinAvgViewTime: number | null
  douyin5sCompletionRate: number | null
  douyinAvgPlayRate: number | null
  // 抖音观众参与度
  douyinLikeRate: number | null
  douyinCommentRate: number | null
  douyinShareRate: number | null
  douyinCollectRate: number | null
  douyinNotInterestedRate: number | null
  // 快手喜爱分诊断
  kuaishouValidCount: number
  kuaishouLoveScore: number | null
  kuaishouQuality: number | null
  kuaishouTitleQuality: number | null
  kuaishouConsultCount: number
  // 快手播放数据
  kuaishouPlayCount: number
  kuaishouAvgPlayTime: number | null
  kuaishouCoverClickRate: number | null
  kuaishou2sExitRate: number | null
  kuaishou5sCompletionRate: number | null
  kuaishouCompletionRate: number | null
  // 快手互动效果
  kuaishouLikeCount: number
  kuaishouCommentCount: number
  kuaishouShareCount: number
  kuaishouCollectCount: number
  kuaishouFansGrowth: number
}

const weekdayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const SocialMediaDashboard: React.FC<SocialMediaDashboardProps> = ({ campusId, campusName, selectedMonth, onMonthChange }) => {
  const { message } = App.useApp()
  const { modal } = App.useApp()
  const [data, setData] = useState<DataRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const importedKeysRef = useRef<Set<string>>(new Set())
  // 用于标记是否刚导入数据，防止 loadData 覆盖
  const isImportingRef = useRef<boolean>(false)

  // 处理单元格变化 - 使用 useCallback 缓存
  const handleCellChange = useCallback((rowKey: string, field: string, value: any) => {
    setData(prevData => {
      const newData = prevData.map(row => {
        if (row.key === rowKey) {
          const updatedRow = { ...row, [field]: value ?? 0 }
          // 自动计算转化率和成本
          if (field === 'netSignup' || field === 'consultCount') {
            const netSignup = field === 'netSignup' ? value : row.netSignup
            const consultCount = field === 'consultCount' ? value : row.consultCount
            updatedRow.signupConversionRate = consultCount ? 
              `${((netSignup / consultCount) * 100).toFixed(2)}%` : null
          }
          if (field === 'consumption' || field === 'consultCount') {
            const consumption = field === 'consumption' ? value : row.consumption
            const consultCount = field === 'consultCount' ? value : row.consultCount
            updatedRow.consultCost = consultCount ? 
              `¥${(consumption / consultCount).toFixed(2)}` : null
          }
          return updatedRow
        }
        return row
      })
      
      // 重新计算汇总行
      return updateSummary(newData)
    })
  }, [])

  // 更新汇总行
  const updateSummary = (rows: DataRow[]): DataRow[] => {
    const dataRows = rows.filter(r => r.key !== 'summary')
    const totals = dataRows.reduce((acc, row) => ({
      actualIncome: acc.actualIncome + (row.actualIncome || 0),
      refundCount: acc.refundCount + (row.refundCount || 0),
      netSignup: acc.netSignup + (row.netSignup || 0),
      grossTotal: acc.grossTotal + (row.grossTotal || 0),
      orderCount: acc.orderCount + (row.orderCount || 0),
      visitCount: acc.visitCount + (row.visitCount || 0),
      consultCount: acc.consultCount + (row.consultCount || 0),
      consumption: acc.consumption + (row.consumption || 0),
      douyinValidCount: acc.douyinValidCount + (row.douyinValidCount || 0),
      douyinPlayCount: acc.douyinPlayCount + (row.douyinPlayCount || 0),
      douyinLikeCount: acc.douyinLikeCount + (row.douyinLikeCount || 0),
      douyinCommentCount: acc.douyinCommentCount + (row.douyinCommentCount || 0),
      douyinShareCount: acc.douyinShareCount + (row.douyinShareCount || 0),
      douyinCollectCount: acc.douyinCollectCount + (row.douyinCollectCount || 0),
      douyinConsultCount: acc.douyinConsultCount + (row.douyinConsultCount || 0),
      kuaishouValidCount: acc.kuaishouValidCount + (row.kuaishouValidCount || 0),
      kuaishouConsultCount: acc.kuaishouConsultCount + (row.kuaishouConsultCount || 0),
      kuaishouPlayCount: acc.kuaishouPlayCount + (row.kuaishouPlayCount || 0),
      kuaishouLikeCount: acc.kuaishouLikeCount + (row.kuaishouLikeCount || 0),
      kuaishouCommentCount: acc.kuaishouCommentCount + (row.kuaishouCommentCount || 0),
      kuaishouShareCount: acc.kuaishouShareCount + (row.kuaishouShareCount || 0),
      kuaishouCollectCount: acc.kuaishouCollectCount + (row.kuaishouCollectCount || 0),
      kuaishouFansGrowth: acc.kuaishouFansGrowth + (row.kuaishouFansGrowth || 0),
    }), {
      actualIncome: 0, refundCount: 0, netSignup: 0, grossTotal: 0,
      orderCount: 0, visitCount: 0, consultCount: 0, consumption: 0,
      douyinValidCount: 0, douyinPlayCount: 0, douyinLikeCount: 0,
      douyinCommentCount: 0, douyinShareCount: 0, douyinCollectCount: 0,
      douyinConsultCount: 0, kuaishouValidCount: 0, kuaishouConsultCount: 0,
      kuaishouPlayCount: 0, kuaishouLikeCount: 0, kuaishouCommentCount: 0,
      kuaishouShareCount: 0, kuaishouCollectCount: 0, kuaishouFansGrowth: 0,
    })

    // 计算百分率字段的平均值（只计算有数据的行）
    // 为每个字段单独计算有效行数
    const calcAverage = (field: keyof DataRow) => {
      const validRows = dataRows.filter(r => r[field] != null && r[field] !== 0)
      if (validRows.length === 0) return null
      const sum = validRows.reduce((acc, r) => acc + (r[field] as number), 0)
      return Number((sum / validRows.length).toFixed(2))
    }

    const summaryRow: DataRow = {
      key: 'summary',
      weekday: '',
      dateText: '汇总',
      ...totals,
      signupConversionRate: totals.consultCount ? 
        `${((totals.netSignup / totals.consultCount) * 100).toFixed(2)}%` : '0%',
      consultCost: totals.consultCount ? 
        `¥${(totals.consumption / totals.consultCount).toFixed(2)}` : '¥0.00',
      douyinCompletionRate: calcAverage('douyinCompletionRate'),
      douyin2sExitRate: calcAverage('douyin2sExitRate'),
      douyinAvgViewTime: calcAverage('douyinAvgViewTime'),
      douyin5sCompletionRate: calcAverage('douyin5sCompletionRate'),
      douyinAvgPlayRate: calcAverage('douyinAvgPlayRate'),
      douyinLikeRate: calcAverage('douyinLikeRate'),
      douyinCommentRate: calcAverage('douyinCommentRate'),
      douyinShareRate: calcAverage('douyinShareRate'),
      douyinCollectRate: calcAverage('douyinCollectRate'),
      douyinNotInterestedRate: calcAverage('douyinNotInterestedRate'),
      kuaishouLoveScore: calcAverage('kuaishouLoveScore'),
      kuaishouQuality: calcAverage('kuaishouQuality'),
      kuaishouTitleQuality: calcAverage('kuaishouTitleQuality'),
      kuaishouAvgPlayTime: calcAverage('kuaishouAvgPlayTime'),
      kuaishouCoverClickRate: calcAverage('kuaishouCoverClickRate'),
      kuaishou2sExitRate: calcAverage('kuaishou2sExitRate'),
      kuaishou5sCompletionRate: calcAverage('kuaishou5sCompletionRate'),
      kuaishouCompletionRate: calcAverage('kuaishouCompletionRate'),
    }

    return [summaryRow, ...dataRows]
  }

  // 保存数据到后端
  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const dataRows = data.filter(r => r.key !== 'summary')
      
      for (const row of dataRows) {
        // 跳过没有数据的行
        const hasData = row.actualIncome || row.consultCount || row.consumption ||
          row.douyinValidCount || row.kuaishouValidCount
        if (!hasData) continue

        await axios.post('/api/v1/market/free-promotion-daily/social-media/save', {
          campus: campusName,
          date: row.key,
          actualIncome: row.actualIncome || 0,
          refundCount: row.refundCount || 0,
          netSignup: row.netSignup || 0,
          grossTotal: row.grossTotal || 0,
          orderCount: row.orderCount || 0,
          visitCount: row.visitCount || 0,
          consultCount: row.consultCount || 0,
          consumption: row.consumption || 0,
          douyinValidCount: row.douyinValidCount || 0,
          douyinPlayCount: row.douyinPlayCount || 0,
          douyinLikeCount: row.douyinLikeCount || 0,
          douyinCommentCount: row.douyinCommentCount || 0,
          douyinShareCount: row.douyinShareCount || 0,
          douyinCollectCount: row.douyinCollectCount || 0,
          douyinConsultCount: row.douyinConsultCount || 0,
          douyinCompletionRate: row.douyinCompletionRate,
          douyin2sExitRate: row.douyin2sExitRate,
          douyinAvgViewTime: row.douyinAvgViewTime,
          douyin5sCompletionRate: row.douyin5sCompletionRate,
          douyinAvgPlayRate: row.douyinAvgPlayRate,
          douyinLikeRate: row.douyinLikeRate,
          douyinCommentRate: row.douyinCommentRate,
          douyinShareRate: row.douyinShareRate,
          douyinCollectRate: row.douyinCollectRate,
          douyinNotInterestedRate: row.douyinNotInterestedRate,
          kuaishouValidCount: row.kuaishouValidCount || 0,
          kuaishouLoveScore: row.kuaishouLoveScore,
          kuaishouQuality: row.kuaishouQuality,
          kuaishouTitleQuality: row.kuaishouTitleQuality,
          kuaishouConsultCount: row.kuaishouConsultCount || 0,
          kuaishouPlayCount: row.kuaishouPlayCount || 0,
          kuaishouAvgPlayTime: row.kuaishouAvgPlayTime,
          kuaishouCoverClickRate: row.kuaishouCoverClickRate,
          kuaishou2sExitRate: row.kuaishou2sExitRate,
          kuaishou5sCompletionRate: row.kuaishou5sCompletionRate,
          kuaishouCompletionRate: row.kuaishouCompletionRate,
          kuaishouLikeCount: row.kuaishouLikeCount || 0,
          kuaishouCommentCount: row.kuaishouCommentCount || 0,
          kuaishouShareCount: row.kuaishouShareCount || 0,
          kuaishouCollectCount: row.kuaishouCollectCount || 0,
          kuaishouFansGrowth: row.kuaishouFansGrowth || 0,
        })
      }
      
      message.success('保存成功')
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }, [data, campusName])

  const buildMonthData = (month: Dayjs): DataRow[] => {
    const start = month.startOf('month')
    const daysInMonth = start.daysInMonth()
    const rows: DataRow[] = []

    // 汇总行
    rows.push({
      key: 'summary',
      weekday: '',
      dateText: '汇总',
      actualIncome: 0,
      signupConversionRate: null,
      refundCount: 0,
      netSignup: 0,
      grossTotal: 0,
      orderCount: 0,
      visitCount: 0,
      consultCount: 0,
      consultCost: null,
      consumption: 0,
      douyinValidCount: 0,
      douyinPlayCount: 0,
      douyinLikeCount: 0,
      douyinCommentCount: 0,
      douyinShareCount: 0,
      douyinCollectCount: 0,
      douyinConsultCount: 0,
      douyinCompletionRate: null,
      douyin2sExitRate: null,
      douyinAvgViewTime: null,
      douyin5sCompletionRate: null,
      douyinAvgPlayRate: null,
      douyinLikeRate: null,
      douyinCommentRate: null,
      douyinShareRate: null,
      douyinCollectRate: null,
      douyinNotInterestedRate: null,
      kuaishouValidCount: 0,
      kuaishouLoveScore: null,
      kuaishouQuality: null,
      kuaishouTitleQuality: null,
      kuaishouConsultCount: 0,
      kuaishouPlayCount: 0,
      kuaishouAvgPlayTime: null,
      kuaishouCoverClickRate: null,
      kuaishou2sExitRate: null,
      kuaishou5sCompletionRate: null,
      kuaishouCompletionRate: null,
      kuaishouLikeCount: 0,
      kuaishouCommentCount: 0,
      kuaishouShareCount: 0,
      kuaishouCollectCount: 0,
      kuaishouFansGrowth: 0,
    })

    // 每日数据行
    for (let i = 0; i < daysInMonth; i++) {
      const d = start.add(i, 'day')
      rows.push({
        key: d.format('YYYY-MM-DD'),
        weekday: weekdayMap[d.day()],
        dateText: `${d.month() + 1}月${d.date()}日`,
        actualIncome: 0,
        signupConversionRate: null,
        refundCount: 0,
        netSignup: 0,
        grossTotal: 0,
        orderCount: 0,
        visitCount: 0,
        consultCount: 0,
        consultCost: null,
        consumption: 0,
        douyinValidCount: 0,
        douyinPlayCount: 0,
        douyinLikeCount: 0,
        douyinCommentCount: 0,
        douyinShareCount: 0,
        douyinCollectCount: 0,
        douyinConsultCount: 0,
        douyinCompletionRate: null,
        douyin2sExitRate: null,
        douyinAvgViewTime: null,
        douyin5sCompletionRate: null,
        douyinAvgPlayRate: null,
        douyinLikeRate: null,
        douyinCommentRate: null,
        douyinShareRate: null,
        douyinCollectRate: null,
        douyinNotInterestedRate: null,
        kuaishouValidCount: 0,
        kuaishouLoveScore: null,
        kuaishouQuality: null,
        kuaishouTitleQuality: null,
        kuaishouConsultCount: 0,
        kuaishouPlayCount: 0,
        kuaishouAvgPlayTime: null,
        kuaishouCoverClickRate: null,
        kuaishou2sExitRate: null,
        kuaishou5sCompletionRate: null,
        kuaishouCompletionRate: null,
        kuaishouLikeCount: 0,
        kuaishouCommentCount: 0,
        kuaishouShareCount: 0,
        kuaishouCollectCount: 0,
        kuaishouFansGrowth: 0,
      })
    }

    return rows
  }

  const loadData = useCallback(async () => {
    if (!campusName) return
    
    // 如果正在导入数据，跳过加载以避免覆盖导入的数据
    if (isImportingRef.current) {
      console.log('正在导入数据，跳过 loadData')
      return
    }
    
    setLoading(true)
    try {
      const month = selectedMonth.format('YYYY-MM')
      
      const response = await axios.get('/api/v1/market/free-promotion-daily/social-media/list', {
        params: {
          campus: campusName,
          month: month,
        }
      })
      
      if (response.data?.code === 0) {
        const items = response.data.data?.items || []
        const monthData = buildMonthData(selectedMonth)
        
        // 合并数据
        const mergedData = monthData.map(row => {
          if (row.key === 'summary') return row
          
          // 跳过已导入的数据，避免被覆盖
          if (importedKeysRef.current.has(row.key)) {
            return row
          }
          
          const dataItem = items.find((item: any) => item.date === row.key)
          if (dataItem) {
            return {
              ...row,
              ...dataItem,
              signupConversionRate: dataItem.signupConversionRate ? `${dataItem.signupConversionRate}%` : null,
              consultCost: dataItem.consultCost ? `¥${dataItem.consultCost}` : null,
            }
          }
          return row
        })
        
        setData(mergedData)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [campusName, selectedMonth])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 处理Excel导入
  const handleImport = async (importedData: ImportedData) => {
    console.log('SocialMediaDashboard收到导入数据:', importedData)
    
    try {
      // 设置导入标志，防止 loadData 覆盖数据
      isImportingRef.current = true
      
      const importMonth = dayjs(importedData.month)
      
      // 构建月度数据框架
      const monthData = buildMonthData(importMonth)
      
      // 合并导入的数据
      const mergedData = monthData.map(row => {
        if (row.key === 'summary') return row
        
        const importedRow = importedData.socialMediaData.find(d => d.date === row.key)
        if (importedRow) {
          // 标记为已导入
          importedKeysRef.current.add(row.key)
          
          return {
            ...row,
            actualIncome: importedRow.actualIncome || 0,
            refundCount: importedRow.refundCount || 0,
            netSignup: importedRow.netSignup || 0,
            grossTotal: importedRow.grossTotal || 0,
            orderCount: importedRow.orderCount || 0,
            visitCount: importedRow.visitCount || 0,
            consultCount: importedRow.consultCount || 0,
            consumption: importedRow.consumption || 0,
            signupConversionRate: importedRow.consultCount ? 
              `${((importedRow.netSignup / importedRow.consultCount) * 100).toFixed(2)}%` : null,
            consultCost: importedRow.consultCount ? 
              `¥${(importedRow.consumption / importedRow.consultCount).toFixed(2)}` : null,
            // 抖音数据
            douyinValidCount: importedRow.douyinValidCount || 0,
            douyinPlayCount: importedRow.douyinPlayCount || 0,
            douyinLikeCount: importedRow.douyinLikeCount || 0,
            douyinCommentCount: importedRow.douyinCommentCount || 0,
            douyinShareCount: importedRow.douyinShareCount || 0,
            douyinCollectCount: importedRow.douyinCollectCount || 0,
            douyinConsultCount: importedRow.douyinConsultCount || 0,
            douyinCompletionRate: importedRow.douyinCompletionRate,
            douyin2sExitRate: importedRow.douyin2sExitRate,
            douyinAvgViewTime: importedRow.douyinAvgViewTime,
            douyin5sCompletionRate: importedRow.douyin5sCompletionRate,
            douyinAvgPlayRate: importedRow.douyinAvgPlayRate,
            douyinLikeRate: importedRow.douyinLikeRate,
            douyinCommentRate: importedRow.douyinCommentRate,
            douyinShareRate: importedRow.douyinShareRate,
            douyinCollectRate: importedRow.douyinCollectRate,
            douyinNotInterestedRate: importedRow.douyinNotInterestedRate,
            // 快手数据
            kuaishouValidCount: importedRow.kuaishouValidCount || 0,
            kuaishouLoveScore: importedRow.kuaishouLoveScore,
            kuaishouQuality: importedRow.kuaishouQuality,
            kuaishouTitleQuality: importedRow.kuaishouTitleQuality,
            kuaishouConsultCount: importedRow.kuaishouConsultCount || 0,
            kuaishouPlayCount: importedRow.kuaishouPlayCount || 0,
            kuaishouAvgPlayTime: importedRow.kuaishouAvgPlayTime,
            kuaishouCoverClickRate: importedRow.kuaishouCoverClickRate,
            kuaishou2sExitRate: importedRow.kuaishou2sExitRate,
            kuaishou5sCompletionRate: importedRow.kuaishou5sCompletionRate,
            kuaishouCompletionRate: importedRow.kuaishouCompletionRate,
            kuaishouLikeCount: importedRow.kuaishouLikeCount || 0,
            kuaishouCommentCount: importedRow.kuaishouCommentCount || 0,
            kuaishouShareCount: importedRow.kuaishouShareCount || 0,
            kuaishouCollectCount: importedRow.kuaishouCollectCount || 0,
            kuaishouFansGrowth: importedRow.kuaishouFansGrowth || 0,
          }
        }
        return row
      })
      
      // 重新计算汇总行
      const updatedData = updateSummary(mergedData)
      
      // 先更新 UI 显示数据
      setData(updatedData)
      console.log('数据已更新到state，共', updatedData.length, '条')
      
      // 直接保存导入的数据到后端（不依赖 handleSave，避免闭包问题）
      setSaving(true)
      try {
        const dataRows = updatedData.filter(r => r.key !== 'summary')
        let savedCount = 0
        
        for (const row of dataRows) {
          // 跳过没有数据的行
          const hasData = row.actualIncome || row.consultCount || row.consumption ||
            row.douyinValidCount || row.kuaishouValidCount
          if (!hasData) continue

          await axios.post('/api/v1/market/free-promotion-daily/social-media/save', {
            campus: campusName,
            date: row.key,
            actualIncome: row.actualIncome || 0,
            refundCount: row.refundCount || 0,
            netSignup: row.netSignup || 0,
            grossTotal: row.grossTotal || 0,
            orderCount: row.orderCount || 0,
            visitCount: row.visitCount || 0,
            consultCount: row.consultCount || 0,
            consumption: row.consumption || 0,
            douyinValidCount: row.douyinValidCount || 0,
            douyinPlayCount: row.douyinPlayCount || 0,
            douyinLikeCount: row.douyinLikeCount || 0,
            douyinCommentCount: row.douyinCommentCount || 0,
            douyinShareCount: row.douyinShareCount || 0,
            douyinCollectCount: row.douyinCollectCount || 0,
            douyinConsultCount: row.douyinConsultCount || 0,
            douyinCompletionRate: row.douyinCompletionRate,
            douyin2sExitRate: row.douyin2sExitRate,
            douyinAvgViewTime: row.douyinAvgViewTime,
            douyin5sCompletionRate: row.douyin5sCompletionRate,
            douyinAvgPlayRate: row.douyinAvgPlayRate,
            douyinLikeRate: row.douyinLikeRate,
            douyinCommentRate: row.douyinCommentRate,
            douyinShareRate: row.douyinShareRate,
            douyinCollectRate: row.douyinCollectRate,
            douyinNotInterestedRate: row.douyinNotInterestedRate,
            kuaishouValidCount: row.kuaishouValidCount || 0,
            kuaishouLoveScore: row.kuaishouLoveScore,
            kuaishouQuality: row.kuaishouQuality,
            kuaishouTitleQuality: row.kuaishouTitleQuality,
            kuaishouConsultCount: row.kuaishouConsultCount || 0,
            kuaishouPlayCount: row.kuaishouPlayCount || 0,
            kuaishouAvgPlayTime: row.kuaishouAvgPlayTime,
            kuaishouCoverClickRate: row.kuaishouCoverClickRate,
            kuaishou2sExitRate: row.kuaishou2sExitRate,
            kuaishou5sCompletionRate: row.kuaishou5sCompletionRate,
            kuaishouCompletionRate: row.kuaishouCompletionRate,
            kuaishouLikeCount: row.kuaishouLikeCount || 0,
            kuaishouCommentCount: row.kuaishouCommentCount || 0,
            kuaishouShareCount: row.kuaishouShareCount || 0,
            kuaishouCollectCount: row.kuaishouCollectCount || 0,
            kuaishouFansGrowth: row.kuaishouFansGrowth || 0,
          })
          savedCount++
        }
        
        console.log('保存完成，共保存', savedCount, '条数据')
        message.success(`导入并保存成功！共保存 ${savedCount} 条数据`)
      } catch (saveError) {
        console.error('保存失败:', saveError)
        message.error('保存失败，数据已显示但未保存到服务器')
      } finally {
        setSaving(false)
      }
      
      // 切换到导入数据的月份（在数据保存后切换，确保 UI 显示正确）
      if (!importMonth.isSame(selectedMonth, 'month')) {
        onMonthChange(importMonth)
      }
      
      // 重置导入标志（延迟重置，确保不会被 loadData 覆盖）
      setTimeout(() => {
        isImportingRef.current = false
        importedKeysRef.current.clear()
      }, 500)
      
    } catch (error) {
      console.error('处理导入数据失败:', error)
      message.error('处理导入数据失败')
      isImportingRef.current = false
    }
  }

  // 使用 useMemo 缓存列配置
  const columns: ColumnsType<DataRow> = useMemo(() => [
    {
      title: '星期',
      dataIndex: 'weekday',
      key: 'weekday',
      width: 80,
      fixed: 'left',
      align: 'center' as const,
    },
    {
      title: '发布日期',
      dataIndex: 'dateText',
      key: 'dateText',
      width: 100,
      fixed: 'left',
      align: 'center' as const,
    },
    {
      title: '社交化新媒体-汇总数据',
      children: [
        {
          title: '社交新媒体实际收入',
          dataIndex: 'actualIncome',
          key: 'actualIncome',
          width: 100,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'actualIncome', v)}
              isSummary={record.key === 'summary'}
              precision={0}
              formatter={(v) => `¥${Math.round(v)}`}
            />
          )
        },
        {
          title: '社交新媒体报名转化率',
          dataIndex: 'signupConversionRate',
          key: 'signupConversionRate',
          width: 90,
          align: 'center' as const,
          render: (val: string | null) => {
            if (!val || val === '0%' || val === '0.00%') {
              return <span style={{ color: '#999' }}>{val || '0%'}</span>
            }
            return val
          },
        },
        {
          title: '退费数',
          dataIndex: 'refundCount',
          key: 'refundCount',
          width: 70,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'refundCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '净报名',
          dataIndex: 'netSignup',
          key: 'netSignup',
          width: 70,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'netSignup', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '毛报总数',
          dataIndex: 'grossTotal',
          key: 'grossTotal',
          width: 80,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'grossTotal', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '订座数',
          dataIndex: 'orderCount',
          key: 'orderCount',
          width: 70,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'orderCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '上门人数',
          dataIndex: 'visitCount',
          key: 'visitCount',
          width: 80,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'visitCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '社交新媒体咨询量',
          dataIndex: 'consultCount',
          key: 'consultCount',
          width: 100,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'consultCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '咨询量成本',
          dataIndex: 'consultCost',
          key: 'consultCost',
          width: 85,
          align: 'center' as const,
          render: (val: string | null) => {
            if (!val || val === '¥0.00' || val === '¥0') {
              return <span style={{ color: '#999' }}>{val || '¥0.00'}</span>
            }
            return val
          },
        },
        {
          title: '社交新媒体消耗',
          dataIndex: 'consumption',
          key: 'consumption',
          width: 100,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'consumption', v)}
              isSummary={record.key === 'summary'}
              precision={0}
              formatter={(v) => `¥${Math.round(v)}`}
            />
          )
        },
      ],
    },
    {
      title: '抖音-总览',
      children: [
        {
          title: '有效条数',
          dataIndex: 'douyinValidCount',
          key: 'douyinValidCount',
          width: 100,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'douyinValidCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '播放量',
          dataIndex: 'douyinPlayCount',
          key: 'douyinPlayCount',
          width: 100,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'douyinPlayCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '点赞量',
          dataIndex: 'douyinLikeCount',
          key: 'douyinLikeCount',
          width: 100,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'douyinLikeCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '评论量',
          dataIndex: 'douyinCommentCount',
          key: 'douyinCommentCount',
          width: 100,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'douyinCommentCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '分享量',
          dataIndex: 'douyinShareCount',
          key: 'douyinShareCount',
          width: 100,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'douyinShareCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '收藏量',
          dataIndex: 'douyinCollectCount',
          key: 'douyinCollectCount',
          width: 100,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'douyinCollectCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '抖音咨询量',
          dataIndex: 'douyinConsultCount',
          key: 'douyinConsultCount',
          width: 110,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'douyinConsultCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
      ],
    },
    {
      title: '抖音-内容吸引力',
      children: [
        {
          title: '完播率',
          dataIndex: 'douyinCompletionRate',
          key: 'douyinCompletionRate',
          width: 100,
          align: 'center' as const,
          render: (val: number | null, record: DataRow) => {
            if (record.key === 'summary') {
              if (val == null || val === 0) {
                return <span style={{ color: '#999' }}>0%</span>
              }
              return `${val}%`
            }
            return <InputNumber size="small" value={val ?? undefined} min={0} max={100} style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, 'douyinCompletionRate', v)} />
          },
        },
        {
          title: '2s跳出率',
          dataIndex: 'douyin2sExitRate',
          key: 'douyin2sExitRate',
          width: 100,
          align: 'center' as const,
          render: (val: number | null, record: DataRow) => {
            if (record.key === 'summary') {
              if (val == null || val === 0) {
                return <span style={{ color: '#999' }}>0%</span>
              }
              return `${val}%`
            }
            return <InputNumber size="small" value={val ?? undefined} min={0} max={100} style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, 'douyin2sExitRate', v)} />
          },
        },
        {
          title: '平均访问时长',
          dataIndex: 'douyinAvgViewTime',
          key: 'douyinAvgViewTime',
          width: 120,
          render: (val: number | null, record: DataRow) => {
            if (record.key === 'summary') {
              if (val == null || val === 0) {
                return <span style={{ color: '#999' }}>0s</span>
              }
              return `${val}s`
            }
            return <InputNumber size="small" value={val ?? undefined} min={0} style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, 'douyinAvgViewTime', v)} />
          },
        },
        {
          title: '5s完播率',
          dataIndex: 'douyin5sCompletionRate',
          key: 'douyin5sCompletionRate',
          width: 100,
          align: 'center' as const,
          render: (val: number | null, record: DataRow) => {
            if (record.key === 'summary') {
              if (val == null || val === 0) {
                return <span style={{ color: '#999' }}>0%</span>
              }
              return `${val}%`
            }
            return <InputNumber size="small" value={val ?? undefined} min={0} max={100} style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, 'douyin5sCompletionRate', v)} />
          },
        },
        {
          title: '平均播放占比',
          dataIndex: 'douyinAvgPlayRate',
          key: 'douyinAvgPlayRate',
          width: 120,
          render: (val: number | null, record: DataRow) => {
            if (record.key === 'summary') {
              if (val == null || val === 0) {
                return <span style={{ color: '#999' }}>0%</span>
              }
              return `${val}%`
            }
            return <InputNumber size="small" value={val ?? undefined} min={0} max={100} style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, 'douyinAvgPlayRate', v)} />
          },
        },
      ],
    },
    {
      title: '抖音-观众参与度',
      children: [
        {
          title: '点赞率',
          dataIndex: 'douyinLikeRate',
          key: 'douyinLikeRate',
          width: 100,
          align: 'center' as const,
          render: (val: number | null, record: DataRow) => {
            if (record.key === 'summary') {
              if (val == null || val === 0) {
                return <span style={{ color: '#999' }}>0%</span>
              }
              return `${val}%`
            }
            return <InputNumber size="small" value={val ?? undefined} min={0} max={100} style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, 'douyinLikeRate', v)} />
          },
        },
        {
          title: '评论率',
          dataIndex: 'douyinCommentRate',
          key: 'douyinCommentRate',
          width: 100,
          align: 'center' as const,
          render: (val: number | null, record: DataRow) => {
            if (record.key === 'summary') {
              if (val == null || val === 0) {
                return <span style={{ color: '#999' }}>0%</span>
              }
              return `${val}%`
            }
            return <InputNumber size="small" value={val ?? undefined} min={0} max={100} style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, 'douyinCommentRate', v)} />
          },
        },
        {
          title: '分享率',
          dataIndex: 'douyinShareRate',
          key: 'douyinShareRate',
          width: 100,
          align: 'center' as const,
          render: (val: number | null, record: DataRow) => {
            if (record.key === 'summary') {
              if (val == null || val === 0) {
                return <span style={{ color: '#999' }}>0%</span>
              }
              return `${val}%`
            }
            return <InputNumber size="small" value={val ?? undefined} min={0} max={100} style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, 'douyinShareRate', v)} />
          },
        },
        {
          title: '收藏率',
          dataIndex: 'douyinCollectRate',
          key: 'douyinCollectRate',
          width: 100,
          align: 'center' as const,
          render: (val: number | null, record: DataRow) => {
            if (record.key === 'summary') {
              if (val == null || val === 0) {
                return <span style={{ color: '#999' }}>0%</span>
              }
              return `${val}%`
            }
            return <InputNumber size="small" value={val ?? undefined} min={0} max={100} style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, 'douyinCollectRate', v)} />
          },
        },
        {
          title: '不感兴趣率',
          dataIndex: 'douyinNotInterestedRate',
          key: 'douyinNotInterestedRate',
          width: 110,
          render: (val: number | null, record: DataRow) => {
            if (record.key === 'summary') {
              if (val == null || val === 0) {
                return <span style={{ color: '#999' }}>0%</span>
              }
              return `${val}%`
            }
            return <InputNumber size="small" value={val ?? undefined} min={0} max={100} style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, 'douyinNotInterestedRate', v)} />
          },
        },
      ],
    },
    {
      title: '快手-喜爱分诊断',
      children: [
        {
          title: '有效条数',
          dataIndex: 'kuaishouValidCount',
          key: 'kuaishouValidCount',
          width: 100,
          align: 'center' as const,
          render: (val: number, record: DataRow) => 
            record.key === 'summary' ? val :
            <InputNumber size="small" value={val} min={0} style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, 'kuaishouValidCount', v)} />,
        },
        {
          title: '喜爱分',
          dataIndex: 'kuaishouLoveScore',
          key: 'kuaishouLoveScore',
          width: 100,
          align: 'center' as const,
          render: (val: number | null, record: DataRow) => {
            if (record.key === 'summary') {
              if (val == null || val === 0) {
                return <span style={{ color: '#999' }}>0</span>
              }
              return val
            }
            return <InputNumber size="small" value={val ?? undefined} min={0} style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, 'kuaishouLoveScore', v)} />
          },
        },
        {
          title: '画质清晰度',
          dataIndex: 'kuaishouQuality',
          key: 'kuaishouQuality',
          width: 110,
          render: (val: number | null, record: DataRow) => {
            if (record.key === 'summary') {
              if (val == null || val === 0) {
                return <span style={{ color: '#999' }}>0</span>
              }
              return val
            }
            return <InputNumber size="small" value={val ?? undefined} min={0} style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, 'kuaishouQuality', v)} />
          },
        },
        {
          title: '标题质量',
          dataIndex: 'kuaishouTitleQuality',
          key: 'kuaishouTitleQuality',
          width: 100,
          align: 'center' as const,
          render: (val: number | null, record: DataRow) => {
            if (record.key === 'summary') {
              if (val == null || val === 0) {
                return <span style={{ color: '#999' }}>0</span>
              }
              return val
            }
            return <InputNumber size="small" value={val ?? undefined} min={0} style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, 'kuaishouTitleQuality', v)} />
          },
        },
        {
          title: '快手咨询量',
          dataIndex: 'kuaishouConsultCount',
          key: 'kuaishouConsultCount',
          width: 110,
          render: (val: number, record: DataRow) => 
            record.key === 'summary' ? val :
            <InputNumber size="small" value={val} min={0} style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, 'kuaishouConsultCount', v)} />,
        },
      ],
    },
    {
      title: '快手-播放数据',
      children: [
        {
          title: '播放量',
          dataIndex: 'kuaishouPlayCount',
          key: 'kuaishouPlayCount',
          width: 100,
          align: 'center' as const,
          render: (val: number, record: DataRow) => 
            record.key === 'summary' ? val :
            <InputNumber size="small" value={val} min={0} style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, 'kuaishouPlayCount', v)} />,
        },
        {
          title: '平均播放时长',
          dataIndex: 'kuaishouAvgPlayTime',
          key: 'kuaishouAvgPlayTime',
          width: 120,
          render: (val: number | null, record: DataRow) => {
            if (record.key === 'summary') {
              if (val == null || val === 0) {
                return <span style={{ color: '#999' }}>0s</span>
              }
              return `${val}s`
            }
            return <InputNumber size="small" value={val ?? undefined} min={0} style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, 'kuaishouAvgPlayTime', v)} />
          },
        },
        {
          title: '封面点击率',
          dataIndex: 'kuaishouCoverClickRate',
          key: 'kuaishouCoverClickRate',
          width: 110,
          render: (val: number | null, record: DataRow) => {
            if (record.key === 'summary') {
              if (val == null || val === 0) {
                return <span style={{ color: '#999' }}>0%</span>
              }
              return `${val}%`
            }
            return <InputNumber 
              size="small" 
              value={val ?? undefined} 
              min={0} 
              max={100} 
              style={{ width: '100%' }}
              formatter={(value) => value ? `${value}%` : ''}
              parser={(value) => value?.replace('%', '') as any}
              onChange={(v) => handleCellChange(record.key, 'kuaishouCoverClickRate', v)} 
            />
          },
        },
        {
          title: '2s跳出率',
          dataIndex: 'kuaishou2sExitRate',
          key: 'kuaishou2sExitRate',
          width: 100,
          align: 'center' as const,
          render: (val: number | null, record: DataRow) => {
            if (record.key === 'summary') {
              if (val == null || val === 0) {
                return <span style={{ color: '#999' }}>0%</span>
              }
              return `${val}%`
            }
            return <InputNumber 
              size="small" 
              value={val ?? undefined} 
              min={0} 
              max={100} 
              style={{ width: '100%' }}
              formatter={(value) => value ? `${value}%` : ''}
              parser={(value) => value?.replace('%', '') as any}
              onChange={(v) => handleCellChange(record.key, 'kuaishou2sExitRate', v)} 
            />
          },
        },
        {
          title: '5s完播率',
          dataIndex: 'kuaishou5sCompletionRate',
          key: 'kuaishou5sCompletionRate',
          width: 100,
          align: 'center' as const,
          render: (val: number | null, record: DataRow) => {
            if (record.key === 'summary') {
              if (val == null || val === 0) {
                return <span style={{ color: '#999' }}>0%</span>
              }
              return `${val}%`
            }
            return <InputNumber 
              size="small" 
              value={val ?? undefined} 
              min={0} 
              max={100} 
              style={{ width: '100%' }}
              formatter={(value) => value ? `${value}%` : ''}
              parser={(value) => value?.replace('%', '') as any}
              onChange={(v) => handleCellChange(record.key, 'kuaishou5sCompletionRate', v)} 
            />
          },
        },
        {
          title: '完播率',
          dataIndex: 'kuaishouCompletionRate',
          key: 'kuaishouCompletionRate',
          width: 100,
          align: 'center' as const,
          render: (val: number | null, record: DataRow) => {
            if (record.key === 'summary') {
              if (val == null || val === 0) {
                return <span style={{ color: '#999' }}>0%</span>
              }
              return `${val}%`
            }
            return <InputNumber 
              size="small" 
              value={val ?? undefined} 
              min={0} 
              max={100} 
              style={{ width: '100%' }}
              formatter={(value) => value ? `${value}%` : ''}
              parser={(value) => value?.replace('%', '') as any}
              onChange={(v) => handleCellChange(record.key, 'kuaishouCompletionRate', v)} 
            />
          },
        },
      ],
    },
    {
      title: '快手-互动效果',
      children: [
        {
          title: '点赞量',
          dataIndex: 'kuaishouLikeCount',
          key: 'kuaishouLikeCount',
          width: 100,
          align: 'center' as const,
          render: (val: number, record: DataRow) => 
            record.key === 'summary' ? val :
            <InputNumber size="small" value={val} min={0} style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, 'kuaishouLikeCount', v)} />,
        },
        {
          title: '评论量',
          dataIndex: 'kuaishouCommentCount',
          key: 'kuaishouCommentCount',
          width: 100,
          align: 'center' as const,
          render: (val: number, record: DataRow) => 
            record.key === 'summary' ? val :
            <InputNumber size="small" value={val} min={0} style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, 'kuaishouCommentCount', v)} />,
        },
        {
          title: '分享量',
          dataIndex: 'kuaishouShareCount',
          key: 'kuaishouShareCount',
          width: 100,
          align: 'center' as const,
          render: (val: number, record: DataRow) => 
            record.key === 'summary' ? val :
            <InputNumber size="small" value={val} min={0} style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, 'kuaishouShareCount', v)} />,
        },
        {
          title: '收藏量',
          dataIndex: 'kuaishouCollectCount',
          key: 'kuaishouCollectCount',
          width: 100,
          align: 'center' as const,
          render: (val: number, record: DataRow) => 
            record.key === 'summary' ? val :
            <InputNumber size="small" value={val} min={0} style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, 'kuaishouCollectCount', v)} />,
        },
        {
          title: '涨粉量',
          dataIndex: 'kuaishouFansGrowth',
          key: 'kuaishouFansGrowth',
          width: 100,
          align: 'center' as const,
          render: (val: number, record: DataRow) => 
            record.key === 'summary' ? val :
            <InputNumber size="small" value={val} min={0} style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, 'kuaishouFansGrowth', v)} />,
        },
      ],
    },
  ], [handleCellChange])

  return (
    <div className="social-media-dashboard-wrapper">
      <Title level={4} style={{ marginBottom: 16 }}>
        {campusName}-市场部免费推广-社交化新媒体投放数据看板
      </Title>

      <Space style={{ marginBottom: 16 }}>
        <DatePicker
          picker="month"
          value={selectedMonth}
          onChange={(date) => date && onMonthChange(date)}
          format="YYYY年MM月"
        />
        <Button type="primary" onClick={loadData} loading={loading}>
          刷新数据
        </Button>
        <Button type="primary" onClick={handleSave} loading={saving}>
          保存数据
        </Button>
        <ExcelImporter
          campusId={campusId}
          campusName={campusName}
          onImportSuccess={handleImport}
        />
      </Space>

      <Table
        className="dashboard-table"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
        scroll={{ x: 4000, y: 600 }}
        bordered
        size="small"
        rowClassName={(record) => record.key === 'summary' ? 'summary-row' : ''}
      />
      
      <style>{`
        .social-media-dashboard-wrapper .ant-table-body::-webkit-scrollbar,
        .social-media-dashboard-wrapper .ant-table-content::-webkit-scrollbar {
          width: 16px !important;
          height: 16px !important;
        }
        
        .social-media-dashboard-wrapper .ant-table-body::-webkit-scrollbar-track,
        .social-media-dashboard-wrapper .ant-table-content::-webkit-scrollbar-track {
          background: #d0d0d0 !important;
        }
        
        .social-media-dashboard-wrapper .ant-table-body::-webkit-scrollbar-thumb,
        .social-media-dashboard-wrapper .ant-table-content::-webkit-scrollbar-thumb {
          background: #404040 !important;
          border: 2px solid #d0d0d0 !important;
          border-radius: 4px !important;
        }
        
        .social-media-dashboard-wrapper .ant-table-body::-webkit-scrollbar-thumb:hover,
        .social-media-dashboard-wrapper .ant-table-content::-webkit-scrollbar-thumb:hover {
          background: #1a1a1a !important;
        }
      `}</style>
    </div>
  )
}

export default SocialMediaDashboard
