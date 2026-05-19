import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { App, Button, DatePicker, Space, Table, Typography, InputNumber } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import axios from 'axios'
import EditableCell from './EditableCell'
import './DashboardStyles.css'

const { Title } = Typography

interface ClassifiedDashboardProps {
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
  consultationCount: number
  consultationCost: string | null
  expense: number
  validClassifiedCount: number
  validCount: number
  validityRate: string | null
  viewCount: number
  likeCount: number
  shareCount: number
  inquiryCount: number
}

const weekdayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const ClassifiedDashboard: React.FC<ClassifiedDashboardProps> = ({ campusId, campusName, selectedMonth, onMonthChange }) => {
  const { message } = App.useApp()
  const [data, setData] = useState<DataRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 处理单元格变化 - 使用 useCallback 缓存
  const handleCellChange = useCallback((key: string, field: keyof DataRow, value: number | null) => {
    setData(prev => {
      const newData = prev.map(row => {
        if (row.key === key) {
          const updatedRow = { ...row, [field]: value || 0 }
          
          // 自动计算相关字段
          // 咨询量成本 = 分类信息花费 ÷ 分类信息咨询量
          if (field === 'expense' || field === 'consultationCount') {
            const expense = field === 'expense' ? (value || 0) : row.expense
            const consultationCount = field === 'consultationCount' ? (value || 0) : row.consultationCount
            updatedRow.consultationCost = consultationCount > 0 ? 
              `¥${(expense / consultationCount).toFixed(2)}` : '¥0.00'
          }
          
          // 分类信息报名转化率 = 净报名 ÷ 分类信息咨询量
          if (field === 'netEnrollment' || field === 'consultationCount') {
            const netEnrollment = field === 'netEnrollment' ? (value || 0) : row.netEnrollment
            const consultationCount = field === 'consultationCount' ? (value || 0) : row.consultationCount
            updatedRow.conversionRate = consultationCount > 0 ? 
              `${((netEnrollment / consultationCount) * 100).toFixed(2)}%` : '0%'
          }
          
          // 有效率 = 有效量 ÷ 有效分类信息量
          if (field === 'validCount' || field === 'validClassifiedCount') {
            const validCount = field === 'validCount' ? (value || 0) : row.validCount
            const validClassifiedCount = field === 'validClassifiedCount' ? (value || 0) : row.validClassifiedCount
            updatedRow.validityRate = validClassifiedCount > 0 ? 
              `${((validCount / validClassifiedCount) * 100).toFixed(2)}%` : '0%'
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
      'visitCount', 'consultationCount', 'expense',
      'validClassifiedCount', 'validCount', 'viewCount', 'likeCount', 'shareCount', 'inquiryCount'
    ]

    const newSummary = { ...summaryRow }
    numericFields.forEach(field => {
      (newSummary as any)[field] = dataRows.reduce((sum, row) => sum + ((row as any)[field] || 0), 0)
    })

    // 咨询量成本 = 分类信息花费 ÷ 分类信息咨询量
    if (newSummary.consultationCount > 0) {
      newSummary.consultationCost = '¥' + (newSummary.expense / newSummary.consultationCount).toFixed(2)
    } else {
      newSummary.consultationCost = '¥0.00'
    }
    
    // 分类信息报名转化率 = 净报名 ÷ 分类信息咨询量
    if (newSummary.consultationCount > 0) {
      newSummary.conversionRate = ((newSummary.netEnrollment / newSummary.consultationCount) * 100).toFixed(2) + '%'
    } else {
      newSummary.conversionRate = '0%'
    }
    
    // 有效率 = 有效量 ÷ 有效分类信息量
    if (newSummary.validClassifiedCount > 0) {
      newSummary.validityRate = ((newSummary.validCount / newSummary.validClassifiedCount) * 100).toFixed(2) + '%'
    } else {
      newSummary.validityRate = '0%'
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
        
        await axios.post('/api/v1/market/free-promotion-daily/classified/save', {
          campus: campusName,
          date: dateStr,
          actualIncome: row.actualIncome,
          refundCount: row.refundCount,
          netEnrollment: row.netEnrollment,
          grossEnrollment: row.grossEnrollment,
          reservationCount: row.reservationCount,
          visitCount: row.visitCount,
          consultationCount: row.consultationCount,
          expense: row.expense,
          validClassifiedCount: row.validClassifiedCount,
          validCount: row.validCount,
          viewCount: row.viewCount,
          likeCount: row.likeCount,
          shareCount: row.shareCount,
          inquiryCount: row.inquiryCount,
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
      consultationCount: 0,
      consultationCost: '¥0.00',
      expense: 0,
      validClassifiedCount: 0,
      validCount: 0,
      validityRate: '0%',
      viewCount: 0,
      likeCount: 0,
      shareCount: 0,
      inquiryCount: 0
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
        consultationCount: 0,
        consultationCost: '¥0.00',
        expense: 0,
        validClassifiedCount: 0,
        validCount: 0,
        validityRate: '0%',
        viewCount: 0,
        likeCount: 0,
        shareCount: 0,
        inquiryCount: 0
      })
    }

    return rows
  }

  // 使用 useMemo 缓存列配置
  const columns: ColumnsType<DataRow> = useMemo(() => [
    {
      title: '星期',
      dataIndex: 'weekday',
      key: 'weekday',
      width: 70,
      fixed: 'left',
      align: 'center' as const,
    },
    {
      title: '日期',
      dataIndex: 'dateText',
      key: 'dateText',
      width: 90,
      fixed: 'left',
      align: 'center' as const,
    },
    {
      title: '新媒体-分类信息汇总数据',
      children: [
        {
          title: '分类信息实际收入',
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
          title: '分类信息报名转化率',
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
        {
          title: '退费数',
          dataIndex: 'refundCount',
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
          dataIndex: 'netEnrollment',
          width: 70,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'netEnrollment', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '毛报总数',
          dataIndex: 'grossEnrollment',
          width: 80,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'grossEnrollment', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '订座数',
          dataIndex: 'reservationCount',
          width: 70,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'reservationCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '上门人数',
          dataIndex: 'visitCount',
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
          title: '分类信息咨询量',
          dataIndex: 'consultationCount',
          width: 100,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'consultationCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
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
          title: '分类信息花费',
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
      title: '分类信息基础数据',
      children: [
        {
          title: '有效分类信息量',
          dataIndex: 'validClassifiedCount',
          width: 130,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'validClassifiedCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '有效量',
          dataIndex: 'validCount',
          width: 80,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'validCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '有效率',
          dataIndex: 'validityRate',
          width: 80,
          align: 'center' as const,
          render: (val: string | null) => {
            if (!val || val === '0%' || val === '0.00%') {
              return <span style={{ color: '#999' }}>{val || '0%'}</span>
            }
            return val
          }
        },
        {
          title: '浏览量',
          dataIndex: 'viewCount',
          width: 80,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'viewCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '点赞量',
          dataIndex: 'likeCount',
          width: 80,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'likeCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '分享量',
          dataIndex: 'shareCount',
          width: 80,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'shareCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '咨询量',
          dataIndex: 'inquiryCount',
          width: 80,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'inquiryCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        }
      ]
    }
  ], [handleCellChange])

  const loadData = useCallback(async () => {
    if (!campusName) return
    
    setLoading(true)
    try {
      const month = selectedMonth.format('YYYY-MM')
      const response = await axios.get('/api/v1/market/free-promotion-daily/classified/list', {
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
            return { ...row, ...dataItem }
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
        {campusName}-市场部免费推广-分类信息数据看板
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
        scroll={{ x: 2200, y: 600 }}
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
        
        .summary-row {
          background-color: #fafafa;
          font-weight: bold;
        }
      `}</style>
    </div>
  )
}

export default ClassifiedDashboard

