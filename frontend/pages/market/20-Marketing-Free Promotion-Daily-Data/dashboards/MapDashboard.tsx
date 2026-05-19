import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { App, Button, DatePicker, Space, Table, Typography, InputNumber } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import axios from 'axios'
import EditableCell from './EditableCell'
import './DashboardStyles.css'

const { Title } = Typography

interface MapDashboardProps {
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
  mapTotal: number
  consultationCost: string | null
  mapExpense: number
  // 百度地图
  baiduComment: number
  baiduLike: number
  baiduImage: number
  baiduCase: number
  baiduProduct: number
  baiduScore: string
  baiduConsult: number
  // 高德地图
  gaodeComment: number
  gaodeLike: number
  gaodeImage: number
  gaodeProduct: number
  gaodeScore: string
  gaodeConsult: number
  // 腾讯地图
  tencentComment: number
  tencentLike: number
  tencentImage: number
  tencentProduct: number
  tencentScore: string
  tencentConsult: number
  // 其他地图
  otherComment: number
  otherLike: number
  otherImage: number
  otherProduct: number
  otherScore: string
  otherConsult: number
}

const weekdayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const MapDashboard: React.FC<MapDashboardProps> = ({ campusId, campusName, selectedMonth, onMonthChange }) => {
  const { message } = App.useApp()
  const [data, setData] = useState<DataRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 处理单元格变化 - 使用 useCallback 缓存
  const handleCellChange = useCallback((key: string, field: keyof DataRow, value: number | string | null) => {
    setData(prev => {
      const newData = prev.map(row => {
        if (row.key === key) {
          const updatedRow = { ...row, [field]: value ?? 0 }
          
          // 自动计算相关字段
          // 咨询量成本 = 地图消费 ÷ 地图总量
          if (field === 'mapExpense' || field === 'mapTotal') {
            const mapExpense = field === 'mapExpense' ? (Number(value) || 0) : row.mapExpense
            const mapTotal = field === 'mapTotal' ? (Number(value) || 0) : row.mapTotal
            updatedRow.consultationCost = mapTotal > 0 ? 
              `¥${(mapExpense / mapTotal).toFixed(2)}` : '¥0.00'
          }
          
          // 地图报名转化率 = 净报名 ÷ 地图总量
          if (field === 'netEnrollment' || field === 'mapTotal') {
            const netEnrollment = field === 'netEnrollment' ? (Number(value) || 0) : row.netEnrollment
            const mapTotal = field === 'mapTotal' ? (Number(value) || 0) : row.mapTotal
            updatedRow.conversionRate = mapTotal > 0 ? 
              `${((netEnrollment / mapTotal) * 100).toFixed(2)}%` : '0%'
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
      'visitCount', 'mapTotal', 'mapExpense',
      'baiduComment', 'baiduLike', 'baiduImage', 'baiduCase', 'baiduProduct', 'baiduConsult',
      'gaodeComment', 'gaodeLike', 'gaodeImage', 'gaodeProduct', 'gaodeConsult',
      'tencentComment', 'tencentLike', 'tencentImage', 'tencentProduct', 'tencentConsult',
      'otherComment', 'otherLike', 'otherImage', 'otherProduct', 'otherConsult'
    ]

    const newSummary = { ...summaryRow }
    numericFields.forEach(field => {
      (newSummary as any)[field] = dataRows.reduce((sum, row) => sum + (Number((row as any)[field]) || 0), 0)
    })

    // 咨询量成本 = 地图消费 ÷ 地图总量
    if (newSummary.mapTotal > 0) {
      newSummary.consultationCost = '¥' + (newSummary.mapExpense / newSummary.mapTotal).toFixed(2)
    } else {
      newSummary.consultationCost = '¥0.00'
    }
    
    // 地图报名转化率 = 净报名 ÷ 地图总量
    if (newSummary.mapTotal > 0) {
      newSummary.conversionRate = ((newSummary.netEnrollment / newSummary.mapTotal) * 100).toFixed(2) + '%'
    } else {
      newSummary.conversionRate = '0%'
    }

    return [newSummary, ...dataRows]
  }

  // 保存数据
  const handleSave = async () => {
    console.log('开始保存，campusName:', campusName)
    console.log('data数组长度:', data.length)
    
    if (!campusName) {
      message.error('神殿名称为空，无法保存')
      return
    }
    
    setSaving(true)
    try {
      const dataRows = data.filter(r => r.key !== 'summary')
      console.log('过滤后的数据行数:', dataRows.length)
      
      let savedCount = 0
      for (const row of dataRows) {
        // 检查是否有任何非零数据
        const hasData = row.actualIncome || row.refundCount || row.netEnrollment || 
                       row.grossEnrollment || row.reservationCount || row.visitCount || 
                       row.mapTotal || row.mapExpense ||
                       row.baiduComment || row.baiduLike || row.baiduImage || 
                       row.baiduCase || row.baiduProduct || Number(row.baiduScore) || row.baiduConsult ||
                       row.gaodeComment || row.gaodeLike || row.gaodeImage || 
                       row.gaodeProduct || Number(row.gaodeScore) || row.gaodeConsult ||
                       row.tencentComment || row.tencentLike || row.tencentImage || 
                       row.tencentProduct || Number(row.tencentScore) || row.tencentConsult ||
                       row.otherComment || row.otherLike || row.otherImage || 
                       row.otherProduct || Number(row.otherScore) || row.otherConsult
        
        if (!hasData) {
          console.log('跳过空数据行:', row.dateText)
          continue
        }
        
        const dateMatch = row.dateText.match(/(\d+)月(\d+)日/)
        if (!dateMatch) {
          console.log('日期匹配失败:', row.dateText)
          continue
        }
        const month = parseInt(dateMatch[1])
        const day = parseInt(dateMatch[2])
        const dateStr = `${selectedMonth.year()}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
        
        const payload = {
          campus: campusName,
          date: dateStr,
          actualIncome: row.actualIncome || 0,
          refundCount: row.refundCount || 0,
          netEnrollment: row.netEnrollment || 0,
          grossEnrollment: row.grossEnrollment || 0,
          reservationCount: row.reservationCount || 0,
          visitCount: row.visitCount || 0,
          mapTotal: row.mapTotal || 0,
          mapExpense: row.mapExpense || 0,
          baiduComment: row.baiduComment || 0,
          baiduLike: row.baiduLike || 0,
          baiduImage: row.baiduImage || 0,
          baiduCase: row.baiduCase || 0,
          baiduProduct: row.baiduProduct || 0,
          baiduScore: Number(row.baiduScore) || 0,
          baiduConsult: row.baiduConsult || 0,
          gaodeComment: row.gaodeComment || 0,
          gaodeLike: row.gaodeLike || 0,
          gaodeImage: row.gaodeImage || 0,
          gaodeProduct: row.gaodeProduct || 0,
          gaodeScore: Number(row.gaodeScore) || 0,
          gaodeConsult: row.gaodeConsult || 0,
          tencentComment: row.tencentComment || 0,
          tencentLike: row.tencentLike || 0,
          tencentImage: row.tencentImage || 0,
          tencentProduct: row.tencentProduct || 0,
          tencentScore: Number(row.tencentScore) || 0,
          tencentConsult: row.tencentConsult || 0,
          otherComment: row.otherComment || 0,
          otherLike: row.otherLike || 0,
          otherImage: row.otherImage || 0,
          otherProduct: row.otherProduct || 0,
          otherScore: Number(row.otherScore) || 0,
          otherConsult: row.otherConsult || 0,
        }
        
        console.log('发送请求，日期:', dateStr, 'payload:', payload)

        await axios.post('/api/v1/market/free-promotion-daily/map/save', payload)
        
        savedCount++
      }
      
      console.log('保存完成，共保存', savedCount, '条')
      if (savedCount > 0) {
        message.success(`保存成功，共保存 ${savedCount} 条数据`)
      } else {
        message.warning('没有需要保存的数据')
      }
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败: ' + (error as any).message)
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
      mapTotal: 0,
      consultationCost: '¥0.00',
      mapExpense: 0,
      baiduComment: 0,
      baiduLike: 0,
      baiduImage: 0,
      baiduCase: 0,
      baiduProduct: 0,
      baiduScore: '0',
      baiduConsult: 0,
      gaodeComment: 0,
      gaodeLike: 0,
      gaodeImage: 0,
      gaodeProduct: 0,
      gaodeScore: '0',
      gaodeConsult: 0,
      tencentComment: 0,
      tencentLike: 0,
      tencentImage: 0,
      tencentProduct: 0,
      tencentScore: '0',
      tencentConsult: 0,
      otherComment: 0,
      otherLike: 0,
      otherImage: 0,
      otherProduct: 0,
      otherScore: '0',
      otherConsult: 0
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
        mapTotal: 0,
        consultationCost: '¥0.00',
        mapExpense: 0,
        baiduComment: 0,
        baiduLike: 0,
        baiduImage: 0,
        baiduCase: 0,
        baiduProduct: 0,
        baiduScore: '0',
        baiduConsult: 0,
        gaodeComment: 0,
        gaodeLike: 0,
        gaodeImage: 0,
        gaodeProduct: 0,
        gaodeScore: '0',
        gaodeConsult: 0,
        tencentComment: 0,
        tencentLike: 0,
        tencentImage: 0,
        tencentProduct: 0,
        tencentScore: '0',
        tencentConsult: 0,
        otherComment: 0,
        otherLike: 0,
        otherImage: 0,
        otherProduct: 0,
        otherScore: '0',
        otherConsult: 0
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

  // 使用 useMemo 缓存列配置
  const columns: ColumnsType<DataRow> = useMemo(() => [
    { title: '星期', dataIndex: 'weekday', key: 'weekday', width: 70, fixed: 'left' },
    { title: '日期', dataIndex: 'dateText', key: 'dateText', width: 90, fixed: 'left' },
    {
      title: '新媒体-地图汇总数据',
      children: [
        { 
          title: '地图实际收入', 
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
          title: '地图报名转化率', 
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
        { title: '地图总量', dataIndex: 'mapTotal', width: 80, align: 'center' as const, render: renderEditableCell('mapTotal') },
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
          title: '地图消费', 
          dataIndex: 'mapExpense', 
          width: 80, 
          align: 'center' as const, 
          render: (val: number, record: DataRow) => (
            <EditableCell
              value={val}
              onChange={(v) => handleCellChange(record.key, 'mapExpense', v)}
              isSummary={record.key === 'summary'}
              precision={0}
            />
          )
        }
      ]
    },
    {
      title: '百度地图',
      children: [
        { title: '评论数', dataIndex: 'baiduComment', width: 80, align: 'center' as const, render: renderEditableCell('baiduComment') },
        { title: '点赞数', dataIndex: 'baiduLike', width: 80, align: 'center' as const, render: renderEditableCell('baiduLike') },
        { title: '图片数', dataIndex: 'baiduImage', width: 80, align: 'center' as const, render: renderEditableCell('baiduImage') },
        { title: '精选案例数', dataIndex: 'baiduCase', width: 100, align: 'center' as const, render: renderEditableCell('baiduCase') },
        { title: '产品服务数', dataIndex: 'baiduProduct', width: 100, align: 'center' as const, render: renderEditableCell('baiduProduct') },
        { 
          title: '评论分', 
          dataIndex: 'baiduScore', 
          width: 80, 
          align: 'center' as const,
          render: (val: string, record: DataRow) => {
            if (record.key === 'summary') {
              return val || '0'
            }
            return (
              <InputNumber
                size="small"
                value={Number(val) || 0}
                min={0}
                max={5}
                step={0.1}
                precision={1}
                style={{ width: '100%' }}
                onChange={(v) => handleCellChange(record.key, 'baiduScore', v?.toString() || '0')}
              />
            )
          }
        },
        { title: '电话/咨询量', dataIndex: 'baiduConsult', width: 110, align: 'center' as const, render: renderEditableCell('baiduConsult') }
      ]
    },
    {
      title: '高德地图',
      children: [
        { title: '评论数', dataIndex: 'gaodeComment', width: 80, align: 'center' as const, render: renderEditableCell('gaodeComment') },
        { title: '点赞数', dataIndex: 'gaodeLike', width: 80, align: 'center' as const, render: renderEditableCell('gaodeLike') },
        { title: '图片数', dataIndex: 'gaodeImage', width: 80, align: 'center' as const, render: renderEditableCell('gaodeImage') },
        { title: '产品服务数', dataIndex: 'gaodeProduct', width: 100, align: 'center' as const, render: renderEditableCell('gaodeProduct') },
        { 
          title: '评论分', 
          dataIndex: 'gaodeScore', 
          width: 80, 
          align: 'center' as const,
          render: (val: string, record: DataRow) => {
            if (record.key === 'summary') {
              return val || '0'
            }
            return (
              <InputNumber
                size="small"
                value={Number(val) || 0}
                min={0}
                max={5}
                step={0.1}
                precision={1}
                style={{ width: '100%' }}
                onChange={(v) => handleCellChange(record.key, 'gaodeScore', v?.toString() || '0')}
              />
            )
          }
        },
        { title: '电话/咨询量', dataIndex: 'gaodeConsult', width: 110, align: 'center' as const, render: renderEditableCell('gaodeConsult') }
      ]
    },
    {
      title: '腾讯地图（微信地图）',
      children: [
        { title: '评论数', dataIndex: 'tencentComment', width: 80, align: 'center' as const, render: renderEditableCell('tencentComment') },
        { title: '点赞数', dataIndex: 'tencentLike', width: 80, align: 'center' as const, render: renderEditableCell('tencentLike') },
        { title: '图片数', dataIndex: 'tencentImage', width: 80, align: 'center' as const, render: renderEditableCell('tencentImage') },
        { title: '产品服务数', dataIndex: 'tencentProduct', width: 100, align: 'center' as const, render: renderEditableCell('tencentProduct') },
        { 
          title: '评论分', 
          dataIndex: 'tencentScore', 
          width: 80, 
          align: 'center' as const,
          render: (val: string, record: DataRow) => {
            if (record.key === 'summary') {
              return val || '0'
            }
            return (
              <InputNumber
                size="small"
                value={Number(val) || 0}
                min={0}
                max={5}
                step={0.1}
                precision={1}
                style={{ width: '100%' }}
                onChange={(v) => handleCellChange(record.key, 'tencentScore', v?.toString() || '0')}
              />
            )
          }
        },
        { title: '电话/咨询量', dataIndex: 'tencentConsult', width: 110, align: 'center' as const, render: renderEditableCell('tencentConsult') }
      ]
    },
    {
      title: '其他地图（360、谷歌等地图）',
      children: [
        { title: '评论数', dataIndex: 'otherComment', width: 80, align: 'center' as const, render: renderEditableCell('otherComment') },
        { title: '点赞数', dataIndex: 'otherLike', width: 80, align: 'center' as const, render: renderEditableCell('otherLike') },
        { title: '图片数', dataIndex: 'otherImage', width: 80, align: 'center' as const, render: renderEditableCell('otherImage') },
        { title: '产品服务数', dataIndex: 'otherProduct', width: 100, align: 'center' as const, render: renderEditableCell('otherProduct') },
        { 
          title: '评论分', 
          dataIndex: 'otherScore', 
          width: 80, 
          align: 'center' as const,
          render: (val: string, record: DataRow) => {
            if (record.key === 'summary') {
              return val || '0'
            }
            return (
              <InputNumber
                size="small"
                value={Number(val) || 0}
                min={0}
                max={5}
                step={0.1}
                precision={1}
                style={{ width: '100%' }}
                onChange={(v) => handleCellChange(record.key, 'otherScore', v?.toString() || '0')}
              />
            )
          }
        },
        { title: '电话/咨询量', dataIndex: 'otherConsult', width: 110, align: 'center' as const, render: renderEditableCell('otherConsult') }
      ]
    }
  ], [handleCellChange, renderEditableCell])

  const loadData = useCallback(async () => {
    if (!campusName) return
    
    setLoading(true)
    try {
      const month = selectedMonth.format('YYYY-MM')
      const response = await axios.get('/api/v1/market/free-promotion-daily/map/list', {
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
            // 确保评论分字段为字符串类型，如果为空则使用默认值 '0'
            return { 
              ...row, 
              ...dataItem,
              baiduScore: dataItem.baiduScore?.toString() || '0',
              gaodeScore: dataItem.gaodeScore?.toString() || '0',
              tencentScore: dataItem.tencentScore?.toString() || '0',
              otherScore: dataItem.otherScore?.toString() || '0',
            }
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
        {campusName}-市场部免费推广-地图数据看板
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
        scroll={{ x: 3500, y: 600 }}
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

export default MapDashboard

