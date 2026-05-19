import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { App, Button, DatePicker, Space, Table, Typography, InputNumber } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import axios from 'axios'
import EditableCell from './EditableCell'
import './DashboardStyles.css'

const { Title } = Typography

interface WechatDashboardProps {
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
  // 微信视频号-播放数据
  videoValidCount: number
  videoDiagnosticAvg: number  // 改为 number 类型
  videoPlayCount: number
  videoCompletionRate: string
  videoAvgPlayDuration: number  // 改为 number 类型
  video3sPlayRate: string
  // 微信视频号-互动数据
  videoLike: number
  videoThumbsUp: number
  videoComment: number
  videoNewFollow: number
  videoShare: number
  videoConsult: number
  // 微信公众号-互动数据
  articleValidCount: number
  articleReadCount: number
  articleLike: number
  articleShareCount: number
  articleRecommendCount: number
  articleCommentCount: number
  articleConsult: number
}

const weekdayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const WechatDashboard: React.FC<WechatDashboardProps> = ({ campusId, campusName, selectedMonth, onMonthChange }) => {
  const { message } = App.useApp()
  const [data, setData] = useState<DataRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 处理单元格变化 - 使用 useCallback 缓存
  const handleCellChange = useCallback((key: string, field: keyof DataRow, value: number | string | null) => {
    console.log('handleCellChange called:', { key, field, value, type: typeof value })
    setData(prev => {
      const newData = prev.map(row => {
        if (row.key === key) {
          // 更新字段值
          const updatedRow = { ...row, [field]: value ?? 0 }
          console.log('Updated row:', { key, field, oldValue: row[field], newValue: updatedRow[field] })
          
          // 如果不是汇总行，计算该行的转化率和成本
          if (row.key !== 'summary') {
            // 计算转化率：净报名 ÷ 微信视频号总量
            if (updatedRow.videoTotal > 0) {
              updatedRow.conversionRate = ((updatedRow.netEnrollment / updatedRow.videoTotal) * 100).toFixed(2) + '%'
            } else {
              updatedRow.conversionRate = '0%'
            }
            
            // 计算咨询量成本：微信平台消费 ÷ 微信视频号总量
            if (updatedRow.videoTotal > 0) {
              updatedRow.consultationCost = '¥' + (updatedRow.expense / updatedRow.videoTotal).toFixed(2)
            } else {
              updatedRow.consultationCost = '¥0.00'
            }
          }
          
          return updatedRow
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
      'videoValidCount', 'videoPlayCount', 'videoLike', 'videoThumbsUp', 'videoComment',
      'videoNewFollow', 'videoShare', 'videoConsult',
      'articleValidCount', 'articleReadCount', 'articleLike', 'articleShareCount',
      'articleRecommendCount', 'articleCommentCount', 'articleConsult'
    ]

    const newSummary = { ...summaryRow }
    numericFields.forEach(field => {
      (newSummary as any)[field] = dataRows.reduce((sum, row) => sum + (Number((row as any)[field]) || 0), 0)
    })

    // 计算转化率和成本
    // 微信平台报名转化率 = 净报名 ÷ 微信视频号总量
    if (newSummary.videoTotal > 0) {
      newSummary.conversionRate = ((newSummary.netEnrollment / newSummary.videoTotal) * 100).toFixed(2) + '%'
    } else {
      newSummary.conversionRate = '0%'
    }
    // 咨询量成本 = 微信平台消费 ÷ 微信视频号总量
    if (newSummary.videoTotal > 0) {
      newSummary.consultationCost = '¥' + (newSummary.expense / newSummary.videoTotal).toFixed(2)
    } else {
      newSummary.consultationCost = '¥0.00'
    }

    // 计算数据诊断结果均值的平均值
    const validDiagnosticRows = dataRows.filter(row => {
      const val = Number(row.videoDiagnosticAvg) || 0
      return val > 0
    })
    console.log('validDiagnosticRows:', validDiagnosticRows.map(r => ({ date: r.dateText, val: r.videoDiagnosticAvg })))
    if (validDiagnosticRows.length > 0) {
      const avgDiagnostic = validDiagnosticRows.reduce((sum, row) => {
        return sum + (Number(row.videoDiagnosticAvg) || 0)
      }, 0) / validDiagnosticRows.length
      newSummary.videoDiagnosticAvg = parseFloat(avgDiagnostic.toFixed(2))
      console.log('avgDiagnostic:', avgDiagnostic, 'result:', newSummary.videoDiagnosticAvg)
    } else {
      newSummary.videoDiagnosticAvg = 0
    }

    // 计算平均播放时长的平均值
    const validDurationRows = dataRows.filter(row => {
      const val = Number(row.videoAvgPlayDuration) || 0
      return val > 0
    })
    console.log('validDurationRows:', validDurationRows.map(r => ({ date: r.dateText, val: r.videoAvgPlayDuration })))
    if (validDurationRows.length > 0) {
      const avgDuration = validDurationRows.reduce((sum, row) => {
        return sum + (Number(row.videoAvgPlayDuration) || 0)
      }, 0) / validDurationRows.length
      newSummary.videoAvgPlayDuration = parseFloat(avgDuration.toFixed(2))
      console.log('avgDuration:', avgDuration, 'result:', newSummary.videoAvgPlayDuration)
    } else {
      newSummary.videoAvgPlayDuration = 0
    }

    // 计算完播率的平均值
    const validCompletionRows = dataRows.filter(row => {
      const val = parseFloat(row.videoCompletionRate?.toString().replace(/[^0-9.]/g, '') || '0')
      return val > 0
    })
    if (validCompletionRows.length > 0) {
      const avgCompletion = validCompletionRows.reduce((sum, row) => {
        return sum + parseFloat(row.videoCompletionRate?.toString().replace(/[^0-9.]/g, '') || '0')
      }, 0) / validCompletionRows.length
      newSummary.videoCompletionRate = avgCompletion.toFixed(2) + '%'
    } else {
      newSummary.videoCompletionRate = '0%'
    }

    // 计算3s以上播放率的平均值
    const valid3sPlayRows = dataRows.filter(row => {
      const val = parseFloat(row.video3sPlayRate?.toString().replace(/[^0-9.]/g, '') || '0')
      return val > 0
    })
    if (valid3sPlayRows.length > 0) {
      const avg3sPlay = valid3sPlayRows.reduce((sum, row) => {
        return sum + parseFloat(row.video3sPlayRate?.toString().replace(/[^0-9.]/g, '') || '0')
      }, 0) / valid3sPlayRows.length
      newSummary.video3sPlayRate = avg3sPlay.toFixed(2) + '%'
    } else {
      newSummary.video3sPlayRate = '0%'
    }

    return [newSummary, ...dataRows]
  }

  // 保存数据
  const handleSave = async () => {
    setSaving(true)
    try {
      const dataRows = data.filter(r => r.key !== 'summary')
      console.log('准备保存的所有数据行:', dataRows.map(r => ({
        date: r.dateText,
        videoDiagnosticAvg: r.videoDiagnosticAvg,
        videoAvgPlayDuration: r.videoAvgPlayDuration
      })))
      
      for (const row of dataRows) {
        const dateMatch = row.dateText.match(/(\d+)月(\d+)日/)
        if (!dateMatch) continue
        const month = parseInt(dateMatch[1])
        const day = parseInt(dateMatch[2])
        const dateStr = `${selectedMonth.year()}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
        
        console.log('保存数据:', {
          date: dateStr,
          videoDiagnosticAvg: row.videoDiagnosticAvg,
          videoAvgPlayDuration: row.videoAvgPlayDuration,
          row: row
        })
        
        await axios.post('/api/v1/market/free-promotion-daily/wechat/save', {
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
          videoValidCount: row.videoValidCount,
          videoDiagnosticAvg: row.videoDiagnosticAvg,
          videoPlayCount: row.videoPlayCount,
          videoCompletionRate: row.videoCompletionRate,
          videoAvgPlayDuration: row.videoAvgPlayDuration,
          video3sPlayRate: row.video3sPlayRate,
          videoLike: row.videoLike,
          videoThumbsUp: row.videoThumbsUp,
          videoComment: row.videoComment,
          videoNewFollow: row.videoNewFollow,
          videoShare: row.videoShare,
          videoConsult: row.videoConsult,
          articleValidCount: row.articleValidCount,
          articleReadCount: row.articleReadCount,
          articleLike: row.articleLike,
          articleShareCount: row.articleShareCount,
          articleRecommendCount: row.articleRecommendCount,
          articleCommentCount: row.articleCommentCount,
          articleConsult: row.articleConsult,
        })
      }
      message.success('保存成功')
      // 保存成功后重新加载数据
      await loadData()
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
      videoValidCount: 0,
      videoDiagnosticAvg: 0,
      videoPlayCount: 0,
      videoCompletionRate: '0%',
      videoAvgPlayDuration: 0,
      video3sPlayRate: '0%',
      videoLike: 0,
      videoThumbsUp: 0,
      videoComment: 0,
      videoNewFollow: 0,
      videoShare: 0,
      videoConsult: 0,
      articleValidCount: 0,
      articleReadCount: 0,
      articleLike: 0,
      articleShareCount: 0,
      articleRecommendCount: 0,
      articleCommentCount: 0,
      articleConsult: 0
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
        videoValidCount: 0,
        videoDiagnosticAvg: 0,
        videoPlayCount: 0,
        videoCompletionRate: '0%',
        videoAvgPlayDuration: 0,
        video3sPlayRate: '0%',
        videoLike: 0,
        videoThumbsUp: 0,
        videoComment: 0,
        videoNewFollow: 0,
        videoShare: 0,
        videoConsult: 0,
        articleValidCount: 0,
        articleReadCount: 0,
        articleLike: 0,
        articleShareCount: 0,
        articleRecommendCount: 0,
        articleCommentCount: 0,
        articleConsult: 0
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

  // 生成可编辑的字符串列（用于百分比、时长等）
  const renderEditableStringCell = (field: keyof DataRow, suffix: string = '') => (val: string, record: DataRow) => {
    // 提取数字部分
    const numericValue = parseFloat(val?.toString().replace(/[^0-9.]/g, '') || '0')
    
    if (record.key === 'summary') {
      // 汇总行：显示带后缀的值
      return <span style={{ fontWeight: 600 }}>{numericValue}{suffix}</span>
    }
    
    // 普通行：显示可编辑的输入框，但显示时带后缀
    return (
      <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
        <InputNumber
          value={numericValue}
          onChange={(v) => {
            // 保存实际的数字值（字符串形式），不添加后缀到数据中
            const newValue = v !== null && v !== undefined ? String(v) : '0'
            console.log(`${field} onChange:`, v, '-> newValue:', newValue, 'record.key:', record.key)
            
            // 直接更新 state
            setData(prev => {
              const newData = prev.map(row => {
                if (row.key === record.key) {
                  const updatedRow = { ...row, [field]: newValue }
                  console.log('直接更新行:', { key: record.key, field, oldValue: row[field], newValue })
                  return updatedRow
                }
                return row
              })
              return calculateSummary(newData)
            })
          }}
          onBlur={(e) => {
            // 确保失去焦点时也保存数据
            const inputValue = e.target.value
            // 移除后缀，提取纯数字
            const cleanValue = inputValue.replace(new RegExp(`\\${suffix}`, 'g'), '').trim()
            const numValue = parseFloat(cleanValue)
            if (!isNaN(numValue)) {
              const newValue = String(numValue)
              console.log(`${field} onBlur: 强制更新数据:`, cleanValue, '-> newValue:', newValue, 'record.key:', record.key)
              
              // 直接更新 state
              setData(prev => {
                const newData = prev.map(row => {
                  if (row.key === record.key) {
                    const updatedRow = { ...row, [field]: newValue }
                    console.log('onBlur 直接更新行:', { key: record.key, field, oldValue: row[field], newValue })
                    return updatedRow
                  }
                  return row
                })
                return calculateSummary(newData)
              })
            }
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
  }

  // 使用 useMemo 缓存列配置
  const columns: ColumnsType<DataRow> = useMemo(() => [
    { title: '星期', dataIndex: 'weekday', key: 'weekday', width: 70, fixed: 'left', align: 'center' as const },
    { title: '日期', dataIndex: 'dateText', key: 'dateText', width: 90, fixed: 'left', align: 'center' as const },
    {
      title: '新媒体-微信平台汇总数据',
      children: [
        { 
          title: '微信平台实际收入', 
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
          title: '微信平台报名转化率', 
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
        { title: '微信视频号总量', dataIndex: 'videoTotal', width: 100, align: 'center' as const, render: renderEditableCell('videoTotal') },
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
          title: '微信平台消费', 
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
      title: '微信视频号-播放数据',
      children: [
        { title: '有效条数', dataIndex: 'videoValidCount', width: 90, align: 'center' as const, render: renderEditableCell('videoValidCount') },
        { title: '数据诊断结果均值', dataIndex: 'videoDiagnosticAvg', width: 140, align: 'center' as const, render: renderEditableCell('videoDiagnosticAvg') },
        { title: '播放量', dataIndex: 'videoPlayCount', width: 80, align: 'center' as const, render: renderEditableCell('videoPlayCount') },
        { title: '完播率', dataIndex: 'videoCompletionRate', width: 80, align: 'center' as const, render: renderEditableStringCell('videoCompletionRate', '%') },
        { title: '平均播放时长', dataIndex: 'videoAvgPlayDuration', width: 120, align: 'center' as const, render: renderEditableCell('videoAvgPlayDuration') },
        { title: '3s以上播放率', dataIndex: 'video3sPlayRate', width: 120, align: 'center' as const, render: renderEditableStringCell('video3sPlayRate', '%') }
      ]
    },
    {
      title: '微信视频号-互动数据',
      children: [
        { title: '喜欢', dataIndex: 'videoLike', width: 70, align: 'center' as const, render: renderEditableCell('videoLike') },
        { title: '点赞', dataIndex: 'videoThumbsUp', width: 70, align: 'center' as const, render: renderEditableCell('videoThumbsUp') },
        { title: '评论', dataIndex: 'videoComment', width: 70, align: 'center' as const, render: renderEditableCell('videoComment') },
        { title: '新增关注', dataIndex: 'videoNewFollow', width: 90, align: 'center' as const, render: renderEditableCell('videoNewFollow') },
        { title: '转发总量', dataIndex: 'videoShare', width: 90, align: 'center' as const, render: renderEditableCell('videoShare') },
        { title: '咨询量', dataIndex: 'videoConsult', width: 80, align: 'center' as const, render: renderEditableCell('videoConsult') }
      ]
    },
    {
      title: '微信公众号-互动数据',
      children: [
        { title: '有效条数', dataIndex: 'articleValidCount', width: 90, align: 'center' as const, render: renderEditableCell('articleValidCount') },
        { title: '阅读人数', dataIndex: 'articleReadCount', width: 90, align: 'center' as const, render: renderEditableCell('articleReadCount') },
        { title: '点赞', dataIndex: 'articleLike', width: 70, align: 'center' as const, render: renderEditableCell('articleLike') },
        { title: '分享人数', dataIndex: 'articleShareCount', width: 90, align: 'center' as const, render: renderEditableCell('articleShareCount') },
        { title: '推荐人数', dataIndex: 'articleRecommendCount', width: 90, align: 'center' as const, render: renderEditableCell('articleRecommendCount') },
        { title: '留言条数', dataIndex: 'articleCommentCount', width: 90, align: 'center' as const, render: renderEditableCell('articleCommentCount') },
        { title: '咨询量', dataIndex: 'articleConsult', width: 80, align: 'center' as const, render: renderEditableCell('articleConsult') }
      ]
    }
  ], [handleCellChange, renderEditableCell])

  const loadData = useCallback(async () => {
    if (!campusName) return
    
    setLoading(true)
    try {
      const month = selectedMonth.format('YYYY-MM')
      const response = await axios.get('/api/v1/market/free-promotion-daily/wechat/list', {
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
            // 确保百分比字段带有 % 后缀
            const mergedRow = { ...row, ...dataItem }
            if (mergedRow.videoCompletionRate && !mergedRow.videoCompletionRate.toString().includes('%')) {
              mergedRow.videoCompletionRate = mergedRow.videoCompletionRate + '%'
            }
            if (mergedRow.video3sPlayRate && !mergedRow.video3sPlayRate.toString().includes('%')) {
              mergedRow.video3sPlayRate = mergedRow.video3sPlayRate + '%'
            }
            // 确保数字字段是数字类型
            if (typeof mergedRow.videoDiagnosticAvg === 'string') {
              mergedRow.videoDiagnosticAvg = parseFloat(mergedRow.videoDiagnosticAvg) || 0
            }
            if (typeof mergedRow.videoAvgPlayDuration === 'string') {
              mergedRow.videoAvgPlayDuration = parseFloat(mergedRow.videoAvgPlayDuration) || 0
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
        {campusName}-市场部免费推广-微信平台数据看板
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
        scroll={{ x: 3200, y: 600 }}
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

export default WechatDashboard

