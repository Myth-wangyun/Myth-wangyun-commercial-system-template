/**
 * 学术->最高议事厅->神殿层级 入职离职汇总表
 * 自动从神殿核心数据API获取数据并显示
 */

import React, { useEffect, useState, useCallback } from 'react'
import { App, Card, Typography, Space, Button, InputNumber, Spin, Table } from 'antd'
import { DownloadOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import CampusSelector from '@/components/common/CampusSelector'
import { normalizeCampus } from '@/pages/academic/teaching-content/shared/campusStorage'
import { buildApiUrl } from '@/utils/apiBase'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

interface Row {
  key: number
  content: string
  monthly: Record<string, string | number>
  total?: string | number
}

const normalizeRow = (row: Partial<Row>): Row => ({
  key: Number(row.key ?? 0),
  content: String(row.content ?? ''),
  monthly: row.monthly ?? {},
  total: typeof row.total === 'number' ? row.total : row.total == null ? undefined : Number(row.total) || 0,
})

// 构建默认行数据
const buildDefaultRows = (): Row[] => {
  return [
    { key: 1, content: '计划招聘岗位名称', monthly: {}, total: undefined },
    { key: 2, content: '计划招聘人数', monthly: {}, total: 0 },
    { key: 3, content: '实际招聘岗位名称', monthly: {}, total: undefined },
    { key: 4, content: '实际招聘人数', monthly: {}, total: 0 },
    { key: 5, content: '入职者姓名', monthly: {}, total: undefined },
    { key: 6, content: '离职人数', monthly: {}, total: 0 },
    { key: 7, content: '离职者姓名', monthly: {}, total: undefined },
  ]
}

const CampusOnboardingOffboardingPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore()
  const resolvedCampus = normalizeCampus(currentCampus ?? getAllCampuses()[0]?.name ?? '主神殿')
  const campusLabel = resolvedCampus.replace(/神殿$/, '')
  
  const [year, setYear] = useState<number>(dayjs().year())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState<Row[]>(buildDefaultRows())

  // 从后端获取数据
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        buildApiUrl(`/onboarding-offboarding-summary?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`)
      )
      if (res.ok) {
        const list = await res.json()
        if (Array.isArray(list) && list.length > 0) {
          const record = list[0]
          const data = record?.['数据'] || record?.数据 || {}
          if (data.rows && Array.isArray(data.rows)) {
            setRows(data.rows.map((row: Partial<Row>) => normalizeRow(row)))
            return
          }
        }
      }
      // 无数据时重置为默认
      setRows(buildDefaultRows())
    } catch (error) {
      console.error('[入职离职汇总] 加载数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [resolvedCampus, year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 保存数据到后端
  const handleSave = async () => {
    setSaving(true)
    try {
      // 计算合计
      const updatedRows: Row[] = rows.map(row => {
        if (row.key === 2 || row.key === 4 || row.key === 6) {
          const total = Object.values(row.monthly).reduce((sum: number, val) => {
            const num = typeof val === 'number' ? val : (typeof val === 'string' ? parseFloat(val) || 0 : 0)
            return sum + num
          }, 0)
          return { ...row, total }
        }
        return row
      })

      const payload = {
        神殿: resolvedCampus,
        年份: year,
        数据: { rows: updatedRows },
      }

      const res = await fetch(buildApiUrl('/onboarding-offboarding-summary'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(await res.text())
      message.success('保存成功')
      setRows(updatedRows)
    } catch (error) {
      console.error('[入职离职汇总] 保存失败:', error)
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 处理单元格值变化
  const handleCellChange = (rowKey: number, month: string, value: string | number | null) => {
    setRows(prev => prev.map<Row>(row => {
      if (row.key !== rowKey) return row
      const isNumericRow = row.key === 2 || row.key === 4 || row.key === 6
      const newMonthly = { ...row.monthly, [month]: value ?? (isNumericRow ? 0 : '') }
      
      // 重新计算合计
      let newTotal: string | number | undefined = row.total
      if (isNumericRow) {
        newTotal = Object.values(newMonthly).reduce((sum: number, val) => {
          const num = typeof val === 'number' ? val : (typeof val === 'string' ? parseFloat(val) || 0 : 0)
          return sum + num
        }, 0)
      }
      
      return { ...row, monthly: newMonthly, total: newTotal } as Row
    }))
  }

  // 导出CSV
  const handleExport = () => {
    const headers = ['序号', '内容', ...MONTHS, '合计']
    const csvRows = rows.map(row => {
      const isNumeric = row.key === 2 || row.key === 4 || row.key === 6
      return [
        row.key,
        row.content,
        ...MONTHS.map(m => row.monthly[m] ?? ''),
        isNumeric ? (row.total ?? 0) : '',
      ]
    })
    
    const csv = [headers, ...csvRows]
      .map(line => line.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${campusLabel}神殿智慧司入职离职汇总表_${year}.csv`
    a.click()
    message.success('导出成功')
  }

  // 判断是否为数值行
  const isNumericRow = (key: number) => key === 2 || key === 4 || key === 6
  // 判断是否为黄色背景行
  const isYellowRow = (key: number) => key === 4 || key === 6

  // 构建表格列
  const columns: ColumnsType<Row> = [
    {
      title: '序号',
      dataIndex: 'key',
      width: 60,
      align: 'center',
      onCell: (record) => ({
        style: isYellowRow(record.key) ? { backgroundColor: '#ffff99' } : {},
      }),
    },
    {
      title: '内容',
      dataIndex: 'content',
      width: 120,
      align: 'center',
      onCell: (record) => ({
        style: isYellowRow(record.key) ? { backgroundColor: '#ffff99' } : {},
      }),
    },
    ...MONTHS.map(month => ({
      title: month,
      dataIndex: ['monthly', month],
      width: 80,
      align: 'center' as const,
      onCell: (record: Row) => ({
        style: isYellowRow(record.key) ? { backgroundColor: '#ffff99' } : {},
      }),
      render: (_: any, record: Row) => {
        const value = record.monthly[month]
        if (isNumericRow(record.key)) {
          return (
            <InputNumber
              value={typeof value === 'number' ? value : (value ? parseFloat(value as string) : 0)}
              min={0}
              size="small"
              style={{ width: '100%' }}
              onChange={(v) => handleCellChange(record.key, month, v)}
            />
          )
        }
        return (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => handleCellChange(record.key, month, e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              textAlign: 'center',
              background: 'transparent',
              outline: 'none',
            }}
          />
        )
      },
    })),
    {
      title: '合计',
      dataIndex: 'total',
      width: 80,
      align: 'center',
      onCell: (record) => ({
        style: isYellowRow(record.key) ? { backgroundColor: '#ffff99' } : {},
      }),
      render: (value: number | undefined, record: Row) => {
        if (isNumericRow(record.key)) {
          return <Text strong>{value ?? 0}</Text>
        }
        return null
      },
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 16 }}>
        <Space>
          <span>年份</span>
          <InputNumber
            min={2000}
            max={2100}
            value={year}
            onChange={(v) => setYear(Number(v || dayjs().year()))}
            style={{ width: 100 }}
          />
        </Space>
        <CampusSelector showLabel />
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0, textAlign: 'center' }}>
            <div
              style={{
                background: '#FFD700',
                color: '#000',
                padding: '8px 0',
                borderRadius: 2,
                fontSize: 18,
              }}
            >
              {campusLabel}神殿智慧司入职离职汇总表
            </div>
          </Title>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
              保存数据
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
              刷新数据
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出CSV
            </Button>
          </Space>
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={rows}
            rowKey="key"
            pagination={false}
            bordered
            size="small"
            scroll={{ x: 1200, y: 600 }}
            sticky
          />
        </Spin>
      </Card>
    </div>
  )
}

export default CampusOnboardingOffboardingPage
