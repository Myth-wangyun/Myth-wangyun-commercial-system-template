import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { App, Button, DatePicker, Space, Table, Typography, InputNumber } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import axios from 'axios'
import EditableCell from './EditableCell'
import './DashboardStyles.css'

const { Title } = Typography

interface VideoDashboardProps {
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
  conversionRate: string | null
  refundCount: number
  netEnrollment: number
  grossEnrollment: number
  reservationCount: number
  visitCount: number
  videoTotal: number
  consultationCost: string | null
  expense: number
  // 爱奇艺-基础数据
  iqiyiValidCount: number
  iqiyiDisplayTotal: number
  iqiyiPlayTotal: number
  iqiyiPlayDurationTotal: number  // 改为 number 类型
  iqiyiCompletionRateTotal: string
  iqiyiCommentTotal: number
  iqiyiLikeTotal: number
  iqiyiConsult: number
  // 优酷-基础数据
  youkuValidCount: number
  youkuPlayCount: number
  youkuLikeCount: number
  youkuCommentCount: number
  youkuShareCount: number
  youkuFansCount: number
  youkuConsult: number
}

const weekdayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const VideoDashboard: React.FC<VideoDashboardProps> = ({ campusId, campusName, selectedMonth, onMonthChange }) => {
  const { message } = App.useApp()
  const [data, setData] = useState<DataRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 处理单元格变化 - 使用 useCallback 缓存
  const handleCellChange = useCallback((key: string, field: keyof DataRow, value: number | string | null) => {
    setData(prev => {
      const newData = prev.map(row => {
        if (row.key === key) {
          return { ...row, [field]: value ?? 0 }
        }
        return row
      })
      return calculateSummary(newData)
    })
  }, [])

  // 计算汇总行
  const calculateSummary = (rows: DataRow[]): DataRow[] => {
    const dataRows = rows.filter(r => r.key !== 'summary')
    const summaryRow = rows.find(r => r.key === 'summary')
    if (!summaryRow) return rows

    const numericFields: (keyof DataRow)[] = [
      'actualIncome', 'refundCount', 'netEnrollment', 'grossEnrollment', 'reservationCount',
      'visitCount', 'videoTotal', 'expense',
      'iqiyiValidCount', 'iqiyiDisplayTotal', 'iqiyiPlayTotal', 'iqiyiCommentTotal', 'iqiyiLikeTotal', 'iqiyiConsult',
      'youkuValidCount', 'youkuPlayCount', 'youkuLikeCount', 'youkuCommentCount', 'youkuShareCount', 'youkuFansCount', 'youkuConsult'
    ]

    const newSummary = { ...summaryRow }
    numericFields.forEach(field => {
      (newSummary as any)[field] = dataRows.reduce((sum, row) => sum + (Number((row as any)[field]) || 0), 0)
    })

    // 计算转化率和成本
    if (newSummary.visitCount > 0) {
      newSummary.conversionRate = ((newSummary.netEnrollment / newSummary.visitCount) * 100).toFixed(2) + '%'
    } else {
      newSummary.conversionRate = '0%'
    }
    if (newSummary.videoTotal > 0) {
      newSummary.consultationCost = '¥' + (newSummary.expense / newSummary.videoTotal).toFixed(2)
    } else {
      newSummary.consultationCost = '¥0.00'
    }

    // 计算总播放时长的平均值
    const validDurationRows = dataRows.filter(row => {
      const val = Number(row.iqiyiPlayDurationTotal) || 0
      return val > 0
    })
    if (validDurationRows.length > 0) {
      const avgDuration = validDurationRows.reduce((sum, row) => {
        return sum + (Number(row.iqiyiPlayDurationTotal) || 0)
      }, 0) / validDurationRows.length
      newSummary.iqiyiPlayDurationTotal = parseFloat(avgDuration.toFixed(2))
    } else {
      newSummary.iqiyiPlayDurationTotal = 0
    }

    // 计算总播放完成率的平均值
    const validCompletionRows = dataRows.filter(row => {
      const strVal = String(row.iqiyiCompletionRateTotal ?? '0')
      const val = parseFloat(strVal.replace(/[^0-9.]/g, ''))
      return !isNaN(val) && val > 0
    })
    if (validCompletionRows.length > 0) {
      const avgCompletion = validCompletionRows.reduce((sum, row) => {
        const strVal = String(row.iqiyiCompletionRateTotal ?? '0')
        return sum + parseFloat(strVal.replace(/[^0-9.]/g, '') || '0')
      }, 0) / validCompletionRows.length
      newSummary.iqiyiCompletionRateTotal = avgCompletion.toFixed(2) + '%'
    } else {
      newSummary.iqiyiCompletionRateTotal = '0%'
    }

    return [newSummary, ...dataRows]
  }

  // 保存数据
  const handleSave = async () => {
    setSaving(true)
    try {
      const dataRows = data.filter(r => r.key !== 'summary')
      for (const row of dataRows) {
        const dateMatch = row.dateText.match(/(\d+)月(\d+)日/)
        if (!dateMatch) continue
        const month = parseInt(dateMatch[1])
        const day = parseInt(dateMatch[2])
        const dateStr = `${selectedMonth.year()}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
        
        await axios.post('/api/v1/market/free-promotion-daily/video/save', {
          campus: campusName,
          date: dateStr,
          actualIncome: row.actualIncome,
          refundCount: row.refundCount,
          netEnrollment: row.netEnrollment,
          grossEnrollment: row.grossEnrollment,
          reservationCount: row.reservationCount,
          visitCount: row.visitCount,
          videoTotal: row.videoTotal,
          expense: row.expense,
          iqiyiValidCount: row.iqiyiValidCount,
          iqiyiDisplayTotal: row.iqiyiDisplayTotal,
          iqiyiPlayTotal: row.iqiyiPlayTotal,
          iqiyiPlayDurationTotal: row.iqiyiPlayDurationTotal,
          iqiyiCompletionRateTotal: row.iqiyiCompletionRateTotal,
          iqiyiCommentTotal: row.iqiyiCommentTotal,
          iqiyiLikeTotal: row.iqiyiLikeTotal,
          iqiyiConsult: row.iqiyiConsult,
          youkuValidCount: row.youkuValidCount,
          youkuPlayCount: row.youkuPlayCount,
          youkuLikeCount: row.youkuLikeCount,
          youkuCommentCount: row.youkuCommentCount,
          youkuShareCount: row.youkuShareCount,
          youkuFansCount: row.youkuFansCount,
          youkuConsult: row.youkuConsult,
        })
      }
      message.success('保存成功')
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const buildMonthData = (month: Dayjs): DataRow[] => {
    const start = month.startOf('month')
    const daysInMonth = start.daysInMonth()
    const rows: DataRow[] = []

    rows.push({
      key: 'summary',
      weekday: '',
      dateText: '汇总',
      actualIncome: 0,
      conversionRate: '0%',
      refundCount: 0,
      netEnrollment: 0,
      grossEnrollment: 0,
      reservationCount: 0,
      visitCount: 0,
      videoTotal: 0,
      consultationCost: '¥0.00',
      expense: 0,
      iqiyiValidCount: 0,
      iqiyiDisplayTotal: 0,
      iqiyiPlayTotal: 0,
      iqiyiPlayDurationTotal: 0,
      iqiyiCompletionRateTotal: '0%',
      iqiyiCommentTotal: 0,
      iqiyiLikeTotal: 0,
      iqiyiConsult: 0,
      youkuValidCount: 0,
      youkuPlayCount: 0,
      youkuLikeCount: 0,
      youkuCommentCount: 0,
      youkuShareCount: 0,
      youkuFansCount: 0,
      youkuConsult: 0
    })

    for (let day = 1; day <= daysInMonth; day++) {
      const current = start.date(day)
      const weekday = weekdayMap[current.day()]
      const dateText = `${current.month() + 1}月${day}日`
      
      rows.push({
        key: `day-${day}`,
        weekday,
        dateText,
        actualIncome: 0,
        conversionRate: '0%',
        refundCount: 0,
        netEnrollment: 0,
        grossEnrollment: 0,
        reservationCount: 0,
        visitCount: 0,
        videoTotal: 0,
        consultationCost: '¥0.00',
        expense: 0,
        iqiyiValidCount: 0,
        iqiyiDisplayTotal: 0,
        iqiyiPlayTotal: 0,
        iqiyiPlayDurationTotal: 0,
        iqiyiCompletionRateTotal: '0%',
        iqiyiCommentTotal: 0,
        iqiyiLikeTotal: 0,
        iqiyiConsult: 0,
        youkuValidCount: 0,
        youkuPlayCount: 0,
        youkuLikeCount: 0,
        youkuCommentCount: 0,
        youkuShareCount: 0,
        youkuFansCount: 0,
        youkuConsult: 0
      })
    }

    return rows
  }

  // 生成可编辑列 - 使用优化的 EditableCell 组件
  const renderEditableCell = useCallback((field: keyof DataRow) => (val: number, record: DataRow) => (
    <EditableCell
      value={val}
      onChange={(v) => handleCellChange(record.key, field, v)}
      isSummary={record.key === 'summary'}
    />
  ), [handleCellChange])

  // 生成可编辑的字符串列（用于播放时长、完成率等）
  const renderEditableStringCell = useCallback((field: keyof DataRow, suffix: string = '') => (val: string, record: DataRow) => {
    const numericValue = parseFloat(String(val ?? '0').replace(/[^0-9.]/g, '') || '0')

    if (record.key === 'summary') {
      return <span style={{ fontWeight: 600 }}>{numericValue}{suffix}</span>
    }

    return (
      <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
        <InputNumber
          value={numericValue}
          onChange={(v) => {
            const newValue = v !== null ? `${v}${suffix}` : `0${suffix}`
            handleCellChange(record.key, field, newValue)
          }}
          precision={2}
          style={{ width: '100%' }}
          size="small"
          controls={false}
          formatter={(value) => `${value}${suffix}`}
          parser={(value) => value?.replace(new RegExp(`\\${suffix}`, 'g'), '') as any}
        />
      </div>
    )
  }, [handleCellChange])

  // 使用 useMemo 缓存列配置
  const columns: ColumnsType<DataRow> = useMemo(() => [
    { title: '星期', dataIndex: 'weekday', key: 'weekday', width: 70, fixed: 'left', align: 'center' as const },
    { title: '日期', dataIndex: 'dateText', key: 'dateText', width: 90, fixed: 'left', align: 'center' as const },
    {
      title: '新媒体-视频平台汇总数据',
      children: [
        { 
          title: '视频平台实际收入', 
          dataIndex: 'actualIncome', 
          width: 100, 
          align: 'center' as const, 
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'actualIncome', v)}
              isSummary={record.key === 'summary'}
              precision={0}
            />
          )
        },
        { 
          title: '视频平台报名转化率', 
          dataIndex: 'conversionRate', 
          width: 90, 
          align: 'center' as const,
          render: (val: string | null) => {
            if (!val || val === '0%' || val === '0.00%') {
              return <span style={{ color: '#999' }}>{val || '0%'}</span>
            }
            return val
          }
        },
        { title: '退费数', dataIndex: 'refundCount', width: 70, align: 'center' as const, render: renderEditableCell('refundCount') },
        { title: '净报名', dataIndex: 'netEnrollment', width: 70, align: 'center' as const, render: renderEditableCell('netEnrollment') },
        { title: '毛报总数', dataIndex: 'grossEnrollment', width: 80, align: 'center' as const, render: renderEditableCell('grossEnrollment') },
        { title: '订座数', dataIndex: 'reservationCount', width: 70, align: 'center' as const, render: renderEditableCell('reservationCount') },
        { title: '上门人数', dataIndex: 'visitCount', width: 80, align: 'center' as const, render: renderEditableCell('visitCount') },
        { title: '视频视频号总量', dataIndex: 'videoTotal', width: 100, align: 'center' as const, render: renderEditableCell('videoTotal') },
        { 
          title: '咨询量成本', 
          dataIndex: 'consultationCost', 
          width: 85, 
          align: 'center' as const,
          render: (val: string | null) => {
            if (!val || val === '¥0.00' || val === '¥0') {
              return <span style={{ color: '#999' }}>{val || '¥0.00'}</span>
            }
            return val
          }
        },
        { 
          title: '视频平台消费', 
          dataIndex: 'expense', 
          width: 100, 
          align: 'center' as const, 
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'expense', v)}
              isSummary={record.key === 'summary'}
              precision={0}
            />
          )
        }
      ]
    },
    {
      title: '爱奇艺-基础数据',
      children: [
        { title: '有效条数', dataIndex: 'iqiyiValidCount', width: 90, align: 'center' as const, render: renderEditableCell('iqiyiValidCount') },
        { title: '总展现量', dataIndex: 'iqiyiDisplayTotal', width: 100, align: 'center' as const, render: renderEditableCell('iqiyiDisplayTotal') },
        { title: '总播放量', dataIndex: 'iqiyiPlayTotal', width: 100, align: 'center' as const, render: renderEditableCell('iqiyiPlayTotal') },
        { title: '总播放时长', dataIndex: 'iqiyiPlayDurationTotal', width: 110, align: 'center' as const, render: renderEditableCell('iqiyiPlayDurationTotal') },
        { title: '总播放完成率', dataIndex: 'iqiyiCompletionRateTotal', width: 120, align: 'center' as const, render: renderEditableStringCell('iqiyiCompletionRateTotal', '%') },
        { title: '总评论量', dataIndex: 'iqiyiCommentTotal', width: 100, align: 'center' as const, render: renderEditableCell('iqiyiCommentTotal') },
        { title: '总点赞量', dataIndex: 'iqiyiLikeTotal', width: 100, align: 'center' as const, render: renderEditableCell('iqiyiLikeTotal') },
        { title: '咨询量', dataIndex: 'iqiyiConsult', width: 80, align: 'center' as const, render: renderEditableCell('iqiyiConsult') }
      ]
    },
    {
      title: '优酷-基础数据',
      children: [
        { title: '有效条数', dataIndex: 'youkuValidCount', width: 90, align: 'center' as const, render: renderEditableCell('youkuValidCount') },
        { title: '播放数', dataIndex: 'youkuPlayCount', width: 80, align: 'center' as const, render: renderEditableCell('youkuPlayCount') },
        { title: '点赞数', dataIndex: 'youkuLikeCount', width: 80, align: 'center' as const, render: renderEditableCell('youkuLikeCount') },
        { title: '评论数', dataIndex: 'youkuCommentCount', width: 80, align: 'center' as const, render: renderEditableCell('youkuCommentCount') },
        { title: '分享数', dataIndex: 'youkuShareCount', width: 80, align: 'center' as const, render: renderEditableCell('youkuShareCount') },
        { title: '粉丝数', dataIndex: 'youkuFansCount', width: 80, align: 'center' as const, render: renderEditableCell('youkuFansCount') },
        { title: '咨询量', dataIndex: 'youkuConsult', width: 80, align: 'center' as const, render: renderEditableCell('youkuConsult') }
      ]
    }
  ], [handleCellChange, renderEditableCell, renderEditableStringCell])

  const loadData = useCallback(async () => {
    if (!campusName) return
    
    setLoading(true)
    try {
      const month = selectedMonth.format('YYYY-MM')
      const response = await axios.get('/api/v1/market/free-promotion-daily/video/list', {
        params: { campus: campusName, month }
      })
      
      if (response.data?.code === 0) {
        const items = response.data.data?.items || []
        const monthData = buildMonthData(selectedMonth)
        
        const mergedData = monthData.map(row => {
          if (row.key === 'summary') return row
          const dateMatch = row.dateText.match(/(\d+)月(\d+)日/)
          if (!dateMatch) return row
          const m = parseInt(dateMatch[1])
          const d = parseInt(dateMatch[2])
          const dateStr = `${selectedMonth.year()}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`
          const dataItem = items.find((item: any) => item.date === dateStr)
          if (dataItem) {
            const mergedRow = { ...row, ...dataItem }
            // 确保总播放时长是数字类型
            if (typeof mergedRow.iqiyiPlayDurationTotal === 'string') {
              mergedRow.iqiyiPlayDurationTotal = parseFloat(mergedRow.iqiyiPlayDurationTotal) || 0
            }
            return mergedRow
          }
          return row
        })
        
        setData(calculateSummary(mergedData))
      } else {
        setData(buildMonthData(selectedMonth))
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      setData(buildMonthData(selectedMonth))
    } finally {
      setLoading(false)
    }
  }, [campusName, selectedMonth])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        {campusName}-市场部免费推广-视频数据看板
      </Title>

      <Space style={{ marginBottom: 16 }}>
        <DatePicker
          picker="month"
          value={selectedMonth}
          onChange={(val) => {
            if (val) onMonthChange(val)
          }}
          allowClear={false}
        />
        <Button type="primary" onClick={loadData} loading={loading}>
          刷新数据
        </Button>
        <Button type="primary" onClick={handleSave} loading={saving}>
          保存数据
        </Button>
      </Space>

      <Table
        className="dashboard-table"
        columns={columns}
        dataSource={data}
        pagination={false}
        scroll={{ x: 2600, y: 600 }}
        loading={loading}
        bordered
        size="small"
        rowClassName={(record) => {
          if (record.key === 'summary') return 'summary-row'
          return ''
        }}
      />
      
      <style>{`
        .dashboard-table .ant-table-body::-webkit-scrollbar,
        .dashboard-table .ant-table-content::-webkit-scrollbar {
          width: 16px !important;
          height: 16px !important;
        }
        
        .dashboard-table .ant-table-body::-webkit-scrollbar-track,
        .dashboard-table .ant-table-content::-webkit-scrollbar-track {
          background: #e8e8e8 !important;
        }
        
        .dashboard-table .ant-table-body::-webkit-scrollbar-thumb,
        .dashboard-table .ant-table-content::-webkit-scrollbar-thumb {
          background: #595959 !important;
          border: 2px solid #e8e8e8 !important;
          border-radius: 8px !important;
        }
        
        .dashboard-table .ant-table-body::-webkit-scrollbar-thumb:hover,
        .dashboard-table .ant-table-content::-webkit-scrollbar-thumb:hover {
          background: #262626 !important;
        }
      `}</style>
    </div>
  )
}

export default VideoDashboard

