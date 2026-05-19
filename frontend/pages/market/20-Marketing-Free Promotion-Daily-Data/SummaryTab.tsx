import React, { useState, useEffect, useRef } from 'react'
import { Button, DatePicker, Space, Table, App } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import axios from 'axios'
import ExcelImporter, { type ImportedData } from './ExcelImporter'

interface SummaryTabProps {
  campusId: string
  campusName: string
  selectedMonth: Dayjs
  onMonthChange: (month: Dayjs) => void
}

interface SummaryRow {
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
}

const weekdayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const SummaryTab: React.FC<SummaryTabProps> = ({ campusId, campusName, selectedMonth, onMonthChange }) => {
  const { message } = App.useApp()
  const { modal } = App.useApp()
  const [data, setData] = useState<SummaryRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const importedKeysRef = useRef<Set<string>>(new Set())
  // 用于标记是否刚导入数据，防止 loadData 覆盖
  const isImportingRef = useRef<boolean>(false)

  // 构建月度数据框架
  const buildMonthData = (month: Dayjs): SummaryRow[] => {
    const start = month.startOf('month')
    const daysInMonth = start.daysInMonth()
    const rows: SummaryRow[] = []

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
      })
    }

    return rows
  }

  // 计算转化率
  const calcSignupConversionRate = (netSignup: number, visitCount: number): string | null => {
    if (!visitCount) return '0%'
    return `${((netSignup / visitCount) * 100).toFixed(2)}%`
  }

  // 计算咨询成本
  const calcConsultCost = (consumption: number, consultCount: number): string | null => {
    if (!consultCount) return '¥0.00'
    return `¥${(consumption / consultCount).toFixed(2)}`
  }

  // 从所有Dashboard API聚合数据
  const loadData = async () => {
    if (!campusName) return
    
    // 如果正在导入数据，跳过加载以避免覆盖导入的数据
    if (isImportingRef.current) {
      console.log('正在导入数据，跳过 loadData')
      return
    }
    
    setLoading(true)
    try {
      const month = selectedMonth.format('YYYY-MM')
      
      // 并行请求6个Dashboard的数据
      const [socialMediaRes, qaRes, classifiedRes, mapRes, wechatRes, videoRes] = await Promise.all([
        axios.get('/api/v1/market/free-promotion-daily/social-media/list', { params: { campus: campusName, month } }).catch(() => ({ data: { data: { items: [] } } })),
        axios.get('/api/v1/market/free-promotion-daily/qa/list', { params: { campus: campusName, month } }).catch(() => ({ data: { data: { items: [] } } })),
        axios.get('/api/v1/market/free-promotion-daily/classified/list', { params: { campus: campusName, month } }).catch(() => ({ data: { data: { items: [] } } })),
        axios.get('/api/v1/market/free-promotion-daily/map/list', { params: { campus: campusName, month } }).catch(() => ({ data: { data: { items: [] } } })),
        axios.get('/api/v1/market/free-promotion-daily/wechat/list', { params: { campus: campusName, month } }).catch(() => ({ data: { data: { items: [] } } })),
        axios.get('/api/v1/market/free-promotion-daily/video/list', { params: { campus: campusName, month } }).catch(() => ({ data: { data: { items: [] } } })),
      ])
      
      // 获取各个数据源的数据
      const socialMediaItems = socialMediaRes.data?.data?.items || []
      const qaItems = qaRes.data?.data?.items || []
      const classifiedItems = classifiedRes.data?.data?.items || []
      const mapItems = mapRes.data?.data?.items || []
      const wechatItems = wechatRes.data?.data?.items || []
      const videoItems = videoRes.data?.data?.items || []
      
      const monthData = buildMonthData(selectedMonth)
      
      // 聚合各个Dashboard的数据到每日汇总
      const mergedData = monthData.map(row => {
        if (row.key === 'summary') return row
        
        const dateKey = row.key
        
        // 查找各个数据源当天的数据
        const socialMedia = socialMediaItems.find((item: any) => item.date === dateKey) || {}
        const qa = qaItems.find((item: any) => item.date === dateKey) || {}
        const classified = classifiedItems.find((item: any) => item.date === dateKey) || {}
        const map = mapItems.find((item: any) => item.date === dateKey) || {}
        const wechat = wechatItems.find((item: any) => item.date === dateKey) || {}
        const video = videoItems.find((item: any) => item.date === dateKey) || {}
        
        // 汇总各个维度的数据
        const actualIncome = (socialMedia.actualIncome || 0) + (qa.actualIncome || 0) + 
                           (classified.actualIncome || 0) + (map.actualIncome || 0) + 
                           (wechat.actualIncome || 0) + (video.actualIncome || 0)
        
        const refundCount = (socialMedia.refundCount || 0) + (qa.refundCount || 0) + 
                           (classified.refundCount || 0) + (map.refundCount || 0) + 
                           (wechat.refundCount || 0) + (video.refundCount || 0)
        
        const netSignup = (socialMedia.netSignup || 0) + (qa.netSignup || 0) + 
                         (classified.netEnrollment || 0) + (map.netEnrollment || 0) + 
                         (wechat.netEnrollment || 0) + (video.netEnrollment || 0)
        
        const grossTotal = (socialMedia.grossTotal || 0) + (qa.grossTotal || 0) + 
                          (classified.grossEnrollment || 0) + (map.grossEnrollment || 0) + 
                          (wechat.grossEnrollment || 0) + (video.grossEnrollment || 0)
        
        const orderCount = (socialMedia.orderCount || 0) + (qa.orderCount || 0) + 
                          (classified.reservationCount || 0) + (map.reservationCount || 0) + 
                          (wechat.reservationCount || 0) + (video.reservationCount || 0)
        
        const visitCount = (socialMedia.visitCount || 0) + (qa.visitCount || 0) + 
                          (classified.visitCount || 0) + (map.visitCount || 0) + 
                          (wechat.visitCount || 0) + (video.visitCount || 0)
        
        const consultCount = (socialMedia.consultCount || 0) + (qa.consultCount || 0) + 
                            (classified.consultationCount || 0) + (map.mapTotal || 0) + 
                            (wechat.videoTotal || 0) + (video.videoTotal || 0)
        
        const consumption = (socialMedia.consumption || 0) + (qa.consumption || 0) + 
                           (classified.expense || 0) + (map.mapExpense || 0) + 
                           (wechat.expense || 0) + (video.expense || 0)
        
        return {
          ...row,
          actualIncome,
          signupConversionRate: calcSignupConversionRate(netSignup, visitCount),
          refundCount,
          netSignup,
          grossTotal,
          orderCount,
          visitCount,
          consultCount,
          consultCost: calcConsultCost(consumption, consultCount),
          consumption,
        }
      })
      
      // 计算汇总行
      const summaryRow = calculateSummary(mergedData.filter(r => r.key !== 'summary'))
      mergedData[0] = summaryRow
      
      setData(mergedData)
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
      setData(buildMonthData(selectedMonth))
    } finally {
      setLoading(false)
    }
  }

  // 计算汇总
  const calculateSummary = (rows: SummaryRow[]): SummaryRow => {
    const totals = rows.reduce(
      (acc, row) => ({
        actualIncome: acc.actualIncome + row.actualIncome,
        refundCount: acc.refundCount + row.refundCount,
        netSignup: acc.netSignup + row.netSignup,
        grossTotal: acc.grossTotal + row.grossTotal,
        orderCount: acc.orderCount + row.orderCount,
        visitCount: acc.visitCount + row.visitCount,
        consultCount: acc.consultCount + row.consultCount,
        consumption: acc.consumption + row.consumption,
      }),
      {
        actualIncome: 0,
        refundCount: 0,
        netSignup: 0,
        grossTotal: 0,
        orderCount: 0,
        visitCount: 0,
        consultCount: 0,
        consumption: 0,
      }
    )

    return {
      key: 'summary',
      weekday: '',
      dateText: '汇总',
      actualIncome: totals.actualIncome,
      signupConversionRate: calcSignupConversionRate(totals.netSignup, totals.visitCount),
      refundCount: totals.refundCount,
      netSignup: totals.netSignup,
      grossTotal: totals.grossTotal,
      orderCount: totals.orderCount,
      visitCount: totals.visitCount,
      consultCount: totals.consultCount,
      consultCost: calcConsultCost(totals.consumption, totals.consultCount),
      consumption: totals.consumption,
    }
  }

  useEffect(() => {
    loadData()
  }, [campusName, selectedMonth])

  // 处理Excel导入
  const handleImport = async (importedData: ImportedData) => {
    console.log('SummaryTab收到导入数据:', importedData)
    
    try {
      // 设置导入标志，防止 loadData 覆盖数据
      isImportingRef.current = true
      
      const importMonth = dayjs(importedData.month)

      // 构建月度数据框架
      const monthData = buildMonthData(importMonth)
      
      // 合并导入的社交新媒体数据
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
            signupConversionRate: calcSignupConversionRate(importedRow.netSignup, importedRow.visitCount),
            consultCost: calcConsultCost(importedRow.consumption, importedRow.consultCount),
          }
        }
        return row
      })
      
      // 计算汇总行
      const summaryRow = calculateSummary(mergedData.filter(r => r.key !== 'summary'))
      mergedData[0] = summaryRow
      
      setData(mergedData)
      console.log('数据已更新到state')
      
      // 自动保存到数据库
      await saveImportedData(importedData)
      
      // 保存完成后切换月份
      if (!importMonth.isSame(selectedMonth, 'month')) {
        onMonthChange(importMonth)
      }
      
      // 重置导入标志
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

  // 保存导入的数据到数据库
  const saveImportedData = async (importedData: ImportedData) => {
    setSaving(true)
    try {
      console.log('开始保存导入的数据到数据库...')
      
      // 保存社交新媒体数据看板数据
      for (const row of importedData.socialMediaData) {
        const hasData = row.actualIncome || row.consultCount || row.consumption ||
          row.douyinValidCount || row.kuaishouValidCount
        if (!hasData) continue

        await axios.post('/api/v1/market/free-promotion-daily/social-media/save', {
          campus: campusName,
          date: row.date,
          actualIncome: row.actualIncome || 0,
          refundCount: row.refundCount || 0,
          netSignup: row.netSignup || 0,
          grossTotal: row.grossTotal || 0,
          orderCount: row.orderCount || 0,
          visitCount: row.visitCount || 0,
          consultCount: row.consultCount || 0,
          consumption: row.consumption || 0,
          // 抖音数据
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
          // 快手数据
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
      
      console.log('社交新媒体数据保存成功')
      
      // TODO: 保存登记明细数据（需要后端API支持）
      const registerCounts = {
        socialMedia: importedData.socialMediaRegister?.length || 0,
        qa: importedData.qaRegister?.length || 0,
        classified: importedData.classifiedRegister?.length || 0,
        wechat: importedData.wechatRegister?.length || 0,
        video: importedData.videoRegister?.length || 0,
      }
      const totalRegisterCount = Object.values(registerCounts).reduce((a, b) => a + b, 0)
      if (totalRegisterCount > 0) {
        console.log('登记明细数据:', registerCounts)
        // 暂时跳过登记数据的保存，等待后端API
      }
      
      message.success('数据已自动保存到数据库')
      
      // 注意：不再调用 loadData()，因为数据已经在 handleImport 中设置到 state 了
      // 如果调用 loadData() 可能会覆盖刚设置的数据
      
    } catch (error) {
      console.error('保存数据失败:', error)
      message.error('保存数据到数据库失败')
    } finally {
      setSaving(false)
    }
  }

  // 表格列定义
  const columns: ColumnsType<SummaryRow> = [
    {
      title: '星期',
      dataIndex: 'weekday',
      key: 'weekday',
      width: 80,
      fixed: 'left',
      align: 'center',
    },
    {
      title: '发布日期',
      dataIndex: 'dateText',
      key: 'dateText',
      width: 100,
      fixed: 'left',
      align: 'center',
    },
    {
      title: '免费推广全平台核心数据汇总',
      children: [
        {
          title: '免费推广实际收入',
          dataIndex: 'actualIncome',
          key: 'actualIncome',
          width: 120,
          align: 'center',
          render: (val: number) => val ? `¥${Math.round(val)}` : '¥0',
        },
        {
          title: '免费推广报名转化率',
          dataIndex: 'signupConversionRate',
          key: 'signupConversionRate',
          width: 120,
          align: 'center',
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
          width: 80,
          align: 'center',
        },
        {
          title: '净报名',
          dataIndex: 'netSignup',
          key: 'netSignup',
          width: 80,
          align: 'center',
        },
        {
          title: '毛报总数',
          dataIndex: 'grossTotal',
          key: 'grossTotal',
          width: 90,
          align: 'center',
        },
        {
          title: '订座数',
          dataIndex: 'orderCount',
          key: 'orderCount',
          width: 80,
          align: 'center',
        },
        {
          title: '上门人数',
          dataIndex: 'visitCount',
          key: 'visitCount',
          width: 90,
          align: 'center',
        },
        {
          title: '实际总咨询量',
          dataIndex: 'consultCount',
          key: 'consultCount',
          width: 100,
          align: 'center',
        },
        {
          title: '咨询量成本',
          dataIndex: 'consultCost',
          key: 'consultCost',
          width: 100,
          align: 'center',
          render: (val: string | null) => {
            if (!val || val === '¥0.00' || val === '¥0') {
              return <span style={{ color: '#999' }}>{val || '¥0.00'}</span>
            }
            return val
          },
        },
        {
          title: '免费推广消费',
          dataIndex: 'consumption',
          key: 'consumption',
          width: 110,
          align: 'center',
          render: (val: number) => val ? `¥${val.toFixed(2)}` : '¥0.00',
        },
      ],
    },
  ]

  return (
    <div style={{ background: '#f7fafc', borderRadius: 16, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.04)', padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18, gap: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 20, color: '#2d3a4a' }}>{campusName} 免费推广日度汇总</span>
        <DatePicker
          picker="month"
          value={selectedMonth}
          onChange={(date) => date && onMonthChange(date)}
          format="YYYY年MM月"
          style={{ borderRadius: 8 }}
        />
        <Button type="primary" onClick={loadData} loading={loading} style={{ borderRadius: 8, fontWeight: 600 }}>
          刷新数据
        </Button>
        <ExcelImporter
          campusId={campusId}
          campusName={campusName}
          onImportSuccess={handleImport}
        />
        {saving && <span style={{ color: '#1890ff' }}>正在保存到数据库...</span>}
      </div>

      <Table
        className="dashboard-table"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
        scroll={{ x: 1500, y: 600 }}
        bordered
        size="small"
        rowClassName={(record) => record.key === 'summary' ? 'summary-row' : ''}
        style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.04)' }}
      />
    </div>
  )
}

export default SummaryTab
