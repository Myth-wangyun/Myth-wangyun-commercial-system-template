import React, { useMemo, useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { App, Button, InputNumber, Space, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { kuaishouDailyDataService } from '@/services/market/marketKuaishouDailyData'
import type { TabRef } from './index'

interface KuaishouTabProps {
  campusId: string
  selectedMonth: Dayjs
}

interface KuaishouRow {
  key: string
  weekday: string
  dateText: string
  // 快手-汇总数据
  actualIncome: number
  signupConversionRate: string
  refundCount: number
  netSignup: number
  grossTotal: number
  orderCount: number
  visitCount: number
  consultCount: number
  consultCost: string
  consumption: number
  // 快手-基础数据
  sealCoverCount: number
  sealClickCount: number
  materialDisplayCount: number
  materialClickCount: number
  materialClickRate: string
  actionCount: number
  materialActionRate: string
  conversionCount: number
  conversionCost: string
  conversionRate: string
  tableCount: number
  avgConsultCost: string
  effectiveConsultCount: number
}

const weekdayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const KuaishouTab = forwardRef<TabRef, KuaishouTabProps>(({ campusId, selectedMonth }, ref) => {
  const { message } = App.useApp()
  const [data, setData] = useState<KuaishouRow[]>([])
  const [loading, setLoading] = useState(false)

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    setMonth: (month: string) => {
      console.log('KuaishouTab setMonth被调用:', month)
      // 月份由父组件管理，这里不需要做任何事
    },
    importData: async (importedData: any[], month: string) => {
      console.log('KuaishouTab importData被调用，数据条数:', importedData.length, '月份:', month)
      
      if (!campusId) {
        message.error('请先选择神殿')
        return
      }

      // 准备要保存的数据
      const rows = importedData.map(item => ({
        date: item.date,
        actual_income: item.actual_income || 0,
        refund_count: (item.gross_total || 0) - (item.net_signup || 0),
        net_signup: item.net_signup || 0,
        gross_total: item.gross_total || 0,
        order_count: item.order_count || 0,
        visit_count: item.visit_count || 0,
        consult_count: item.effective_consult_count || 0,
        consumption: item.consumption || 0,
        seal_cover_count: item.seal_cover_count || 0,
        seal_click_count: item.seal_click_count || 0,
        material_display_count: item.material_display_count || 0,
        action_count: item.action_count || 0,
        material_action_rate: 0,
        conversion_count: item.conversion_count || 0,
        table_count: item.table_count || 0,
        effective_consult_count: item.effective_consult_count || 0,
      }))

      try {
        // 直接保存到后端
        const response = await kuaishouDailyDataService.bulkSave(campusId, month, rows)
        const savedCount = (response as any).saved_count ?? (response as any).data?.saved_count ?? 0
        message.success(`快手数据导入并保存成功，共保存 ${savedCount} 条记录`)
        
        // 导入成功后重新加载数据
        await loadData()
      } catch (error) {
        console.error('保存快手数据失败:', error)
        message.error('快手数据导入失败')
      }
    },
  }))

  const buildMonthData = (month: Dayjs): KuaishouRow[] => {
    const start = month.startOf('month')
    const daysInMonth = start.daysInMonth()
    const rows: KuaishouRow[] = []

    rows.push({
      key: 'summary',
      weekday: '',
      dateText: '汇总',
      actualIncome: 0,
      signupConversionRate: '0%',
      refundCount: 0,
      netSignup: 0,
      grossTotal: 0,
      orderCount: 0,
      visitCount: 0,
      consultCount: 0,
      consultCost: '0',
      consumption: 0,
      sealCoverCount: 0,
      sealClickCount: 0,
      materialDisplayCount: 0,
      materialClickCount: 0,
      materialClickRate: '0%',
      actionCount: 0,
      materialActionRate: '0%',
      conversionCount: 0,
      conversionCost: '0',
      conversionRate: '0%',
      tableCount: 0,
      avgConsultCost: '0',
      effectiveConsultCount: 0,
    })

    for (let i = 0; i < daysInMonth; i++) {
      const d = start.add(i, 'day')
      rows.push({
        key: d.format('YYYY-MM-DD'),
        weekday: weekdayMap[d.day()],
        dateText: `${d.month() + 1}月${d.date()}日`,
        actualIncome: 0,
        signupConversionRate: '0%',
        refundCount: 0,
        netSignup: 0,
        grossTotal: 0,
        orderCount: 0,
        visitCount: 0,
        consultCount: 0,
        consultCost: '0',
        consumption: 0,
        sealCoverCount: 0,
        sealClickCount: 0,
        materialDisplayCount: 0,
        materialClickCount: 0,
        materialClickRate: '0%',
        actionCount: 0,
        materialActionRate: '0%',
        conversionCount: 0,
        conversionCost: '0',
        conversionRate: '0%',
        tableCount: 0,
        avgConsultCost: '0',
        effectiveConsultCount: 0,
      })
    }

    return rows
  }

  // 加载数据
  const loadData = async () => {
    if (!campusId) return
    
    setLoading(true)
    try {
      const month = selectedMonth.format('YYYY-MM')
      const response = await kuaishouDailyDataService.list(campusId, month)
      
      // 修复：axios 会将响应包装在 data 中，所以实际数据在 response.data
      // 但如果 response 本身就是数据，则直接使用 response
      const items = response.data?.items || (response as any).items
      
      if (items && items.length > 0) {
        const apiData = items
        const monthData = buildMonthData(selectedMonth)
        
        const mergedData = monthData.map(row => {
          if (row.key === 'summary') return row
          
          const apiRow = apiData.find(item => item.date === row.key)
          if (apiRow) {
            const actualIncome = parseFloat(apiRow.actual_income as unknown as string) || 0
            const consumption = parseFloat(apiRow.consumption as unknown as string) || 0
            const effectiveConsultCount = apiRow.effective_consult_count || 0
            const consultCount = effectiveConsultCount // 快手咨询量 = 有效咨询量
            const materialDisplayCount = apiRow.material_display_count || 0
            const conversionCount = apiRow.conversion_count || 0
            
            // 计算派生字段
            let signupConversionRate = ''
            if (consultCount > 0) {
              signupConversionRate = ((apiRow.net_signup / consultCount) * 100).toFixed(2) + '%'
            }
            
            let consultCost = ''
            if (consultCount > 0) {
              consultCost = (consumption / consultCount).toFixed(2)
            }
            
            let materialClickRate = ''
            if (materialDisplayCount > 0) {
              materialClickRate = ((apiRow.seal_click_count / materialDisplayCount) * 100).toFixed(2) + '%'
            }
            
            let materialActionRate = ''
            if (materialDisplayCount > 0) {
              materialActionRate = ((apiRow.action_count / materialDisplayCount) * 100).toFixed(2) + '%'
            }
            
            let conversionCost = ''
            if (conversionCount > 0) {
              conversionCost = (consumption / conversionCount).toFixed(2)
            }
            
            let conversionRate = ''
            if (apiRow.seal_click_count > 0) {
              conversionRate = ((conversionCount / apiRow.seal_click_count) * 100).toFixed(2) + '%'
            }
            
            let avgConsultCost = ''
            if (effectiveConsultCount > 0) {
              avgConsultCost = (consumption / effectiveConsultCount).toFixed(2)
            }
            
            return {
              ...row,
              actualIncome,
              signupConversionRate,
              refundCount: apiRow.refund_count,
              netSignup: apiRow.net_signup,
              grossTotal: apiRow.gross_total,
              orderCount: apiRow.order_count,
              visitCount: apiRow.visit_count,
              consultCount,
              consultCost,
              consumption,
              sealCoverCount: apiRow.seal_cover_count,
              sealClickCount: apiRow.seal_click_count,
              materialDisplayCount,
              materialClickCount: apiRow.seal_click_count, // 使用封面点击数作为素材点击数
              materialClickRate,
              actionCount: apiRow.action_count,
              materialActionRate,
              conversionCount,
              conversionCost,
              conversionRate,
              tableCount: apiRow.table_count,
              avgConsultCost,
              effectiveConsultCount,
            }
          }
          return row
        })
        
        const dataWithoutSummary = mergedData.filter(row => row.key !== 'summary')
        const summary = calculateSummary(dataWithoutSummary)
        setData([summary, ...dataWithoutSummary])
      } else {
        setData(buildMonthData(selectedMonth))
      }
    } catch (error) {
      console.error('加载快手数据失败:', error)
      message.error('加载数据失败')
      setData(buildMonthData(selectedMonth))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedMonth, campusId])

  const handleUpdate = (rowKey: string, field: keyof KuaishouRow, value: number) => {
    setData((prev) => {
      const updated = prev.map((row) => {
        if (row.key === rowKey) {
          const updatedRow = { ...row, [field]: value }
          
          // 自动计算派生字段
          if (row.key !== 'summary') {
            // 快手咨询量 = 有效咨询量（同步）
            if (field === 'effectiveConsultCount') {
              updatedRow.consultCount = updatedRow.effectiveConsultCount
            }
            if (field === 'consultCount') {
              updatedRow.effectiveConsultCount = updatedRow.consultCount
            }
            
            // 退费数 = 毛报总数 - 净报名
            if (field === 'grossTotal' || field === 'netSignup') {
              updatedRow.refundCount = updatedRow.grossTotal - updatedRow.netSignup
            }
            
            // 快手报名转化率 = 净报名 / 快手咨询量 * 100%
            if (field === 'netSignup' || field === 'consultCount' || field === 'effectiveConsultCount') {
              if (updatedRow.consultCount > 0) {
                updatedRow.signupConversionRate = ((updatedRow.netSignup / updatedRow.consultCount) * 100).toFixed(2) + '%'
              } else {
                updatedRow.signupConversionRate = '0%'
              }
            }
            
            // 咨询量成本 = 快手消费 / 快手咨询量
            if (field === 'consumption' || field === 'consultCount' || field === 'effectiveConsultCount') {
              if (updatedRow.consultCount > 0) {
                updatedRow.consultCost = (updatedRow.consumption / updatedRow.consultCount).toFixed(2)
              } else {
                updatedRow.consultCost = '0'
              }
            }
            
            // 素材点击率 = 素材点击次数 / 素材曝光次数 * 100%
            if (field === 'materialClickCount' || field === 'materialDisplayCount') {
              if (updatedRow.materialDisplayCount > 0) {
                updatedRow.materialClickRate = ((updatedRow.materialClickCount / updatedRow.materialDisplayCount) * 100).toFixed(2) + '%'
              } else {
                updatedRow.materialClickRate = '0%'
              }
            }
            
            // 素材行动率 = 行动次数 / 素材曝光次数 * 100%
            if (field === 'actionCount' || field === 'materialDisplayCount') {
              if (updatedRow.materialDisplayCount > 0) {
                updatedRow.materialActionRate = ((updatedRow.actionCount / updatedRow.materialDisplayCount) * 100).toFixed(2) + '%'
              } else {
                updatedRow.materialActionRate = '0%'
              }
            }
            
            // 转化成本 = 快手消费 / 转化数
            if (field === 'consumption' || field === 'conversionCount') {
              if (updatedRow.conversionCount > 0) {
                updatedRow.conversionCost = (updatedRow.consumption / updatedRow.conversionCount).toFixed(2)
              } else {
                updatedRow.conversionCost = '0'
              }
            }
            
            // 转化率 = 转化数 / 素材点击次数 * 100%
            if (field === 'conversionCount' || field === 'materialClickCount') {
              if (updatedRow.materialClickCount > 0) {
                updatedRow.conversionRate = ((updatedRow.conversionCount / updatedRow.materialClickCount) * 100).toFixed(2) + '%'
              } else {
                updatedRow.conversionRate = '0%'
              }
            }
            
            // 有效咨询量成本 = 快手消费 / 有效咨询量
            if (field === 'consumption' || field === 'effectiveConsultCount' || field === 'consultCount') {
              if (updatedRow.effectiveConsultCount > 0) {
                updatedRow.avgConsultCost = (updatedRow.consumption / updatedRow.effectiveConsultCount).toFixed(2)
              } else {
                updatedRow.avgConsultCost = '0'
              }
            }
          }
          
          return updatedRow
        }
        return row
      })
      
      // 重新计算汇总行
      const dataWithoutSummary = updated.filter(row => row.key !== 'summary')
      const summary = calculateSummary(dataWithoutSummary)
      return [summary, ...dataWithoutSummary]
    })
  }

  // 计算汇总行
  const calculateSummary = (dataRows: KuaishouRow[]): KuaishouRow => {
    const summary: KuaishouRow = {
      key: 'summary',
      weekday: '',
      dateText: '汇总',
      actualIncome: 0,
      signupConversionRate: '',
      refundCount: 0,
      netSignup: 0,
      grossTotal: 0,
      orderCount: 0,
      visitCount: 0,
      consultCount: 0,
      consultCost: '',
      consumption: 0,
      sealCoverCount: 0,
      sealClickCount: 0,
      materialDisplayCount: 0,
      materialClickCount: 0,
      materialClickRate: '',
      actionCount: 0,
      materialActionRate: '',
      conversionCount: 0,
      conversionCost: '',
      conversionRate: '',
      tableCount: 0,
      avgConsultCost: '',
      effectiveConsultCount: 0,
    }
    
    // 汇总数值字段
    dataRows.forEach(row => {
      summary.actualIncome += row.actualIncome
      summary.refundCount += row.refundCount
      summary.netSignup += row.netSignup
      summary.grossTotal += row.grossTotal
      summary.orderCount += row.orderCount
      summary.visitCount += row.visitCount
      summary.consultCount += row.consultCount
      summary.consumption += row.consumption
      summary.sealCoverCount += row.sealCoverCount
      summary.sealClickCount += row.sealClickCount
      summary.materialDisplayCount += row.materialDisplayCount
      summary.materialClickCount += row.materialClickCount
      summary.actionCount += row.actionCount
      summary.conversionCount += row.conversionCount
      summary.tableCount += row.tableCount
      summary.effectiveConsultCount += row.effectiveConsultCount
    })
    
    // 计算汇总的派生字段
    if (summary.consultCount > 0) {
      summary.signupConversionRate = ((summary.netSignup / summary.consultCount) * 100).toFixed(2) + '%'
      summary.consultCost = (summary.consumption / summary.consultCount).toFixed(2)
    } else {
      summary.signupConversionRate = '0%'
      summary.consultCost = '0'
    }
    
    if (summary.materialDisplayCount > 0) {
      summary.materialClickRate = ((summary.materialClickCount / summary.materialDisplayCount) * 100).toFixed(2) + '%'
      summary.materialActionRate = ((summary.actionCount / summary.materialDisplayCount) * 100).toFixed(2) + '%'
    } else {
      summary.materialClickRate = '0%'
      summary.materialActionRate = '0%'
    }
    
    if (summary.conversionCount > 0) {
      summary.conversionCost = (summary.consumption / summary.conversionCount).toFixed(2)
    } else {
      summary.conversionCost = '0'
    }
    
    if (summary.materialClickCount > 0) {
      summary.conversionRate = ((summary.conversionCount / summary.materialClickCount) * 100).toFixed(2) + '%'
    } else {
      summary.conversionRate = '0%'
    }
    
    if (summary.effectiveConsultCount > 0) {
      summary.avgConsultCost = (summary.consumption / summary.effectiveConsultCount).toFixed(2)
    } else {
      summary.avgConsultCost = '0'
    }
    
    return summary
  }

  const renderEditableNumber = (record: KuaishouRow, field: keyof KuaishouRow) => {
    // 判断是否需要显示两位小数
    const needDecimal = field === 'consumption'
    const displayValue = needDecimal ? (typeof record[field] === 'number' ? (record[field] as number).toFixed(2) : record[field]) : record[field]
    
    if (record.key === 'summary') {
      return <span style={{ fontWeight: 'bold' }}>{displayValue}</span>
    }

    return (
      <InputNumber
        value={record[field] as number}
        min={0}
        controls={false}
        precision={needDecimal ? 2 : 0}
        style={{ width: '100%' }}
        onChange={(val) => handleUpdate(record.key, field, typeof val === 'number' ? val : 0)}
      />
    )
  }

  const columns: ColumnsType<KuaishouRow> = useMemo(
    () => [
      {
        title: '星期',
        dataIndex: 'weekday',
        width: 50,
        align: 'center',
        onHeaderCell: () => ({
          style: { backgroundColor: '#00B050', color: '#000', fontWeight: 'bold' },
        }),
      },
      {
        title: '日期',
        dataIndex: 'dateText',
        width: 70,
        align: 'center',
        onHeaderCell: () => ({
          style: { backgroundColor: '#92D050', color: '#000', fontWeight: 'bold' },
        }),
        render: (val: string, record: KuaishouRow) =>
          record.key === 'summary' ? <span style={{ fontWeight: 'bold' }}>{val}</span> : val,
      },
      {
        title: '新媒体-快手汇总数据',
        children: [
          {
            title: '快手实际收入',
            dataIndex: 'actualIncome',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: KuaishouRow) =>
              renderEditableNumber(record, 'actualIncome'),
          },
          {
            title: '快手报名转化率',
            dataIndex: 'signupConversionRate',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (text: string, record: KuaishouRow) => (
              <span style={{ color: text === '0%' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
          {
            title: '退费数',
            dataIndex: 'refundCount',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: KuaishouRow) => renderEditableNumber(record, 'refundCount'),
          },
          {
            title: '净报名',
            dataIndex: 'netSignup',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: KuaishouRow) => renderEditableNumber(record, 'netSignup'),
          },
          {
            title: '毛报总数',
            dataIndex: 'grossTotal',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: KuaishouRow) => renderEditableNumber(record, 'grossTotal'),
          },
          {
            title: '订座数',
            dataIndex: 'orderCount',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: KuaishouRow) => renderEditableNumber(record, 'orderCount'),
          },
          {
            title: '上门人数',
            dataIndex: 'visitCount',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: KuaishouRow) => renderEditableNumber(record, 'visitCount'),
          },
          {
            title: '快手咨询量',
            dataIndex: 'consultCount',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: KuaishouRow) =>
              renderEditableNumber(record, 'consultCount'),
          },
          {
            title: '咨询量成本',
            dataIndex: 'consultCost',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (text: string, record: KuaishouRow) => (
              <span style={{ color: text === '0' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
          {
            title: '快手花费',
            dataIndex: 'consumption',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: KuaishouRow) => renderEditableNumber(record, 'consumption'),
          },
        ],
      },
      {
        title: '快手-基础数据',
        children: [
          {
            title: '封面曝光数',
            dataIndex: 'sealCoverCount',
            width: 60,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: KuaishouRow) =>
              renderEditableNumber(record, 'sealCoverCount'),
          },
          {
            title: '封面点击数',
            dataIndex: 'sealClickCount',
            width: 60,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: KuaishouRow) =>
              renderEditableNumber(record, 'sealClickCount'),
          },
          {
            title: '素材曝光数',
            dataIndex: 'materialDisplayCount',
            width: 60,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: KuaishouRow) =>
              renderEditableNumber(record, 'materialDisplayCount'),
          },
          {
            title: '封面点击率',
            dataIndex: 'materialClickRate',
            width: 60,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (text: string, record: KuaishouRow) => (
              <span style={{ color: text === '0%' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
          {
            title: '行为数',
            dataIndex: 'actionCount',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: KuaishouRow) => renderEditableNumber(record, 'actionCount'),
          },
          {
            title: '素材点击率',
            dataIndex: 'materialActionRate',
            width: 60,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (text: string, record: KuaishouRow) => (
              <span style={{ color: text === '0%' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
        ],
      },
      {
        title: '快手-转化数据',
        children: [
          {
            title: '转化数',
            dataIndex: 'conversionCount',
            width: 60,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: KuaishouRow) =>
              renderEditableNumber(record, 'conversionCount'),
          },
          {
            title: '转化成本',
            dataIndex: 'conversionCost',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (text: string, record: KuaishouRow) => (
              <span style={{ color: text === '0' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
          {
            title: '转化率',
            dataIndex: 'conversionRate',
            width: 60,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (text: string, record: KuaishouRow) => (
              <span style={{ color: text === '0%' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
          {
            title: '表单',
            dataIndex: 'tableCount',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: KuaishouRow) => renderEditableNumber(record, 'tableCount'),
          },
          {
            title: '有效咨询量',
            dataIndex: 'effectiveConsultCount',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: KuaishouRow) =>
              renderEditableNumber(record, 'effectiveConsultCount'),
          },
        ],
      },
    ],
    []
  )

  const handleSave = async () => {
    if (!campusId) {
      message.error('请先选择神殿')
      return
    }

    setLoading(true)
    try {
      const month = selectedMonth.format('YYYY-MM')
      
      const rows = data
        .filter(row => row.key !== 'summary')
        .map(row => ({
          date: row.key,
          actual_income: row.actualIncome,
          refund_count: row.refundCount,
          net_signup: row.netSignup,
          gross_total: row.grossTotal,
          order_count: row.orderCount,
          visit_count: row.visitCount,
          consult_count: row.consultCount,
          consumption: row.consumption,
          seal_cover_count: row.sealCoverCount,
          seal_click_count: row.sealClickCount,
          material_display_count: row.materialDisplayCount,
          action_count: row.actionCount,
          material_action_rate: parseFloat(row.materialActionRate) || 0,
          conversion_count: row.conversionCount,
          table_count: row.tableCount,
          effective_consult_count: row.effectiveConsultCount,
        }))

      const response = await kuaishouDailyDataService.bulkSave(campusId, month, rows)
      const savedCount = (response as any).saved_count ?? (response as any).data?.saved_count ?? 0
      message.success(`快手数据保存成功，共保存 ${savedCount} 条记录`)
      await loadData()
    } catch (error) {
      console.error('保存快手数据失败:', error)
      message.error('保存数据失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleSave}>
          保存
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
        scroll={{ y: 600 }}
        bordered
        size="small"
      />
    </div>
  )
})

KuaishouTab.displayName = 'KuaishouTab'

export default KuaishouTab
