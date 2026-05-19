import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { App, Button, DatePicker, Space, Table, Typography, InputNumber } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import axios from 'axios'
import EditableCell from './EditableCell'
import './DashboardStyles.css'

const { Title } = Typography

interface QADashboardProps {
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
  // 百度知道
  baiduValidCount: number
  baiduViewCount: number
  baiduLikeCount: number
  baiduValidNumber: number
  baiduValidRate: number | null
  baiduConsultCount: number
  // 知乎
  zhihuValidCount: number
  zhihuViewCount: number
  zhihuLikeCount: number
  zhihuValidNumber: number
  zhihuValidRate: number | null
  zhihuConsultCount: number
}

const weekdayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const QADashboard: React.FC<QADashboardProps> = ({ campusId, campusName, selectedMonth, onMonthChange }) => {
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
          
          // 当百度知道咨询量或知乎咨询量变化时，自动计算总咨询量
          if (field === 'baiduConsultCount' || field === 'zhihuConsultCount') {
            updatedRow.consultCount = updatedRow.baiduConsultCount + updatedRow.zhihuConsultCount
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
      'actualIncome', 'refundCount', 'netSignup', 'grossTotal', 'orderCount',
      'visitCount', 'consultCount', 'consumption',
      'baiduValidCount', 'baiduViewCount', 'baiduLikeCount', 'baiduValidNumber', 'baiduConsultCount',
      'zhihuValidCount', 'zhihuViewCount', 'zhihuLikeCount', 'zhihuValidNumber', 'zhihuConsultCount'
    ]

    const newSummary = { ...summaryRow }
    numericFields.forEach(field => {
      (newSummary as any)[field] = dataRows.reduce((sum, row) => sum + ((row as any)[field] || 0), 0)
    })

    // 计算转化率和成本
    if (newSummary.visitCount > 0) {
      newSummary.signupConversionRate = ((newSummary.netSignup / newSummary.visitCount) * 100).toFixed(2) + '%'
    } else {
      newSummary.signupConversionRate = '0%'
    }
    if (newSummary.consultCount > 0) {
      newSummary.consultCost = '¥' + (newSummary.consumption / newSummary.consultCount).toFixed(2)
    } else {
      newSummary.consultCost = '¥0.00'
    }
    // 百度有效率
    if (newSummary.baiduValidCount > 0) {
      newSummary.baiduValidRate = Number(((newSummary.baiduValidNumber / newSummary.baiduValidCount) * 100).toFixed(2))
    } else {
      newSummary.baiduValidRate = 0
    }
    // 知乎有效率
    if (newSummary.zhihuValidCount > 0) {
      newSummary.zhihuValidRate = Number(((newSummary.zhihuValidNumber / newSummary.zhihuValidCount) * 100).toFixed(2))
    } else {
      newSummary.zhihuValidRate = 0
    }

    return [newSummary, ...dataRows]
  }

  // 保存数据
  const handleSave = async () => {
    setSaving(true)
    try {
      const dataRows = data.filter(r => r.key !== 'summary')
      for (const row of dataRows) {
        await axios.post('/api/v1/market/free-promotion-daily/qa/save', {
          campus: campusName,
          date: row.key,
          actualIncome: row.actualIncome,
          refundCount: row.refundCount,
          netSignup: row.netSignup,
          grossTotal: row.grossTotal,
          orderCount: row.orderCount,
          visitCount: row.visitCount,
          consultCount: row.consultCount,
          consumption: row.consumption,
          baiduValidCount: row.baiduValidCount,
          baiduViewCount: row.baiduViewCount,
          baiduLikeCount: row.baiduLikeCount,
          baiduValidNumber: row.baiduValidNumber,
          baiduConsultCount: row.baiduConsultCount,
          zhihuValidCount: row.zhihuValidCount,
          zhihuViewCount: row.zhihuViewCount,
          zhihuLikeCount: row.zhihuLikeCount,
          zhihuValidNumber: row.zhihuValidNumber,
          zhihuConsultCount: row.zhihuConsultCount,
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

    // 汇总行
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
      consultCost: '¥0.00',
      consumption: 0,
      baiduValidCount: 0,
      baiduViewCount: 0,
      baiduLikeCount: 0,
      baiduValidNumber: 0,
      baiduValidRate: 0,
      baiduConsultCount: 0,
      zhihuValidCount: 0,
      zhihuViewCount: 0,
      zhihuLikeCount: 0,
      zhihuValidNumber: 0,
      zhihuValidRate: 0,
      zhihuConsultCount: 0,
    })

    // 每日数据行
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
        consultCost: '¥0.00',
        consumption: 0,
        baiduValidCount: 0,
        baiduViewCount: 0,
        baiduLikeCount: 0,
        baiduValidNumber: 0,
        baiduValidRate: 0,
        baiduConsultCount: 0,
        zhihuValidCount: 0,
        zhihuViewCount: 0,
        zhihuLikeCount: 0,
        zhihuValidNumber: 0,
        zhihuValidRate: 0,
        zhihuConsultCount: 0,
      })
    }

    return rows
  }

  const loadData = useCallback(async () => {
    if (!campusName) return
    
    setLoading(true)
    try {
      const month = selectedMonth.format('YYYY-MM')
      
      const response = await axios.get('/api/v1/market/free-promotion-daily/qa/list', {
        params: {
          campus: campusName,
          month: month,
        }
      })
      
      if (response.data?.code === 0) {
        const items = response.data.data?.items || []
        const monthData = buildMonthData(selectedMonth)
        
        const mergedData = monthData.map(row => {
          if (row.key === 'summary') return row
          
          const dataItem = items.find((item: any) => item.date === row.key)
          if (dataItem) {
            // 咨询量 = 百度知道咨询量 + 知乎咨询量
            const calculatedConsultCount = (dataItem.baiduConsultCount || 0) + (dataItem.zhihuConsultCount || 0)
            return {
              ...row,
              ...dataItem,
              consultCount: calculatedConsultCount,
              signupConversionRate: dataItem.signupConversionRate ? `${dataItem.signupConversionRate}%` : null,
              consultCost: dataItem.consultCost ? `¥${dataItem.consultCost}` : null,
              baiduValidRate: dataItem.baiduValidRate,
              zhihuValidRate: dataItem.zhihuValidRate,
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

  // 使用 useMemo 缓存列配置
  const columns: ColumnsType<DataRow> = useMemo(() => [
    {
      title: '星期',
      dataIndex: 'weekday',
      key: 'weekday',
      width: 60,
      fixed: 'left',
      align: 'center' as const,
    },
    {
      title: '日期',
      dataIndex: 'dateText',
      key: 'dateText',
      width: 80,
      fixed: 'left',
      align: 'center' as const,
    },
    {
      title: '问答类-快手汇总数据',
      children: [
        {
          title: '问答实际收入',
          dataIndex: 'actualIncome',
          key: 'actualIncome',
          width: 75,
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
          title: '报名转化率',
          dataIndex: 'signupConversionRate',
          key: 'signupConversionRate',
          width: 70,
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
          width: 60,
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
          width: 60,
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
          width: 70,
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
          width: 60,
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
          width: 70,
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
          title: '咨询量',
          dataIndex: 'consultCount',
          key: 'consultCount',
          width: 65,
          align: 'center' as const,
          render: (val: number, record: DataRow) => {
            // 咨询量 = 百度知道咨询量 + 知乎咨询量（自动计算，不可编辑）
            const calculatedValue = record.baiduConsultCount + record.zhihuConsultCount
            return (
              <div style={{ 
                padding: '4px 11px', 
                textAlign: 'right',
                color: record.key === 'summary' ? '#1890ff' : '#000',
                fontWeight: record.key === 'summary' ? 600 : 400,
                backgroundColor: '#f0f0f0'
              }}>
                {calculatedValue}
              </div>
            )
          }
        },
        {
          title: '咨询成本',
          dataIndex: 'consultCost',
          key: 'consultCost',
          width: 70,
          align: 'center' as const,
          render: (val: string | null) => {
            if (!val || val === '¥0.00' || val === '¥0') {
              return <span style={{ color: '#999' }}>{val || '¥0.00'}</span>
            }
            return val
          },
        },
        {
          title: '花费',
          dataIndex: 'consumption',
          key: 'consumption',
          width: 60,
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
      title: '百度知道',
      children: [
        {
          title: '有效条数',
          dataIndex: 'baiduValidCount',
          key: 'baiduValidCount',
          width: 65,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'baiduValidCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '浏览量',
          dataIndex: 'baiduViewCount',
          key: 'baiduViewCount',
          width: 60,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'baiduViewCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '点赞数',
          dataIndex: 'baiduLikeCount',
          key: 'baiduLikeCount',
          width: 60,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'baiduLikeCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '有效数',
          dataIndex: 'baiduValidNumber',
          key: 'baiduValidNumber',
          width: 60,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'baiduValidNumber', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '有效率',
          dataIndex: 'baiduValidRate',
          key: 'baiduValidRate',
          width: 60,
          align: 'center' as const,
          render: (val: number | null) => {
            if (val == null || val === 0) {
              return <span style={{ color: '#999' }}>0%</span>
            }
            return `${val}%`
          },
        },
        {
          title: '咨询量',
          dataIndex: 'baiduConsultCount',
          key: 'baiduConsultCount',
          width: 60,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'baiduConsultCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
      ],
    },
    {
      title: '知乎',
      children: [
        {
          title: '有效条数',
          dataIndex: 'zhihuValidCount',
          key: 'zhihuValidCount',
          width: 65,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'zhihuValidCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '浏览量',
          dataIndex: 'zhihuViewCount',
          key: 'zhihuViewCount',
          width: 60,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'zhihuViewCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '点赞数',
          dataIndex: 'zhihuLikeCount',
          key: 'zhihuLikeCount',
          width: 60,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'zhihuLikeCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '有效数',
          dataIndex: 'zhihuValidNumber',
          key: 'zhihuValidNumber',
          width: 60,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'zhihuValidNumber', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
        {
          title: '有效率',
          dataIndex: 'zhihuValidRate',
          key: 'zhihuValidRate',
          width: 60,
          align: 'center' as const,
          render: (val: number | null) => {
            if (val == null || val === 0) {
              return <span style={{ color: '#999' }}>0%</span>
            }
            return `${val}%`
          },
        },
        {
          title: '咨询量',
          dataIndex: 'zhihuConsultCount',
          key: 'zhihuConsultCount',
          width: 60,
          align: 'center' as const,
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'zhihuConsultCount', v)}
              isSummary={record.key === 'summary'}
            />
          )
        },
      ],
    },
  ], [handleCellChange])

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        {campusName}-市场部免费推广-问答数据看板
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
      </Space>

      <Table
        className="dashboard-table"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
        scroll={{ y: 600 }}
        bordered
        size="small"
        rowClassName={(record) => record.key === 'summary' ? 'summary-row' : ''}
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

export default QADashboard
