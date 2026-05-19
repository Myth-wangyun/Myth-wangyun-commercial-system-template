/**
 * TAB 2: 入职离职分解表
 * 按岗位展示实际招聘人数和离职人数的月度数据
 * 数据自动从03明细表统计获取
 */

import React, { useEffect, useState, useCallback } from 'react'
import { App, InputNumber, Table, Button, Spin } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import axios from 'axios'

interface MonthlyData {
  [key: string]: number | null
}

interface PositionRow {
  key: string
  序号: number | string
  岗位: string
  招聘及离职: string
  isTotal: boolean
  monthlyData: MonthlyData
  total: number | null
}

interface Tab2EntryExitBreakdownProps {
  year: string
}

export default function Tab2EntryExitBreakdown({ year }: Tab2EntryExitBreakdownProps) {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<PositionRow[]>([])
  
  // 岗位列表（分解表）
  const positions = ['咨询干部', '咨询', '助理', '渠道']
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

  // 创建空的位置数据
  const createEmptyRow = (
    序号: number | string,
    岗位: string,
    招聘及离职: string,
    isTotal = false
  ): PositionRow => {
    const monthlyData: MonthlyData = {}
    months.forEach(month => {
      monthlyData[month] = null
    })
    return {
      key: `${序号}-${岗位}-${招聘及离职}`,
      序号,
      岗位,
      招聘及离职,
      isTotal,
      monthlyData,
      total: null,
    }
  }

  // 初始化空行
  const initEmptyRows = useCallback(() => {
    const newRows: PositionRow[] = []
    positions.forEach((position, index) => {
      newRows.push(createEmptyRow(index + 1, position, '实际招聘人数', false))
      newRows.push(createEmptyRow(index + 1, position, '离职人数', false))
    })
    newRows.push(createEmptyRow('总合计', '', '实际招聘人数', true))
    newRows.push(createEmptyRow('总合计', '', '离职人数', true))
    setRows(newRows)
  }, [])

  // 从API加载统计数据
  const loadStatistics = useCallback(async () => {
    setLoading(true)
    try {
      const response = await axios.get(`/api/v1/consult/entry-exit-detail/statistics/${year}`)
      if (response.data?.code === 0 && response.data?.data?.分解表数据) {
        const statsData = response.data.data.分解表数据
        
        // 转换为表格行格式
        const newRows: PositionRow[] = []
        
        positions.forEach((position, index) => {
          const 入职数据 = statsData.find((d: any) => d.岗位 === position && d.类型 === '实际招聘人数')
          const 离职数据 = statsData.find((d: any) => d.岗位 === position && d.类型 === '离职人数')
          
          // 入职行
          const recruitRow = createEmptyRow(index + 1, position, '实际招聘人数', false)
          if (入职数据) {
            months.forEach(month => {
              recruitRow.monthlyData[month] = 入职数据[month] || null
            })
            recruitRow.total = 入职数据['合计'] || null
          }
          newRows.push(recruitRow)
          
          // 离职行
          const exitRow = createEmptyRow(index + 1, position, '离职人数', false)
          if (离职数据) {
            months.forEach(month => {
              exitRow.monthlyData[month] = 离职数据[month] || null
            })
            exitRow.total = 离职数据['合计'] || null
          }
          newRows.push(exitRow)
        })
        
        // 添加总合计行
        const recruitmentTotal = createEmptyRow('总合计', '', '实际招聘人数', true)
        const exitTotal = createEmptyRow('总合计', '', '离职人数', true)
        
        // 计算总合计
        months.forEach(month => {
          let recruitSum = 0
          let exitSum = 0
          newRows.forEach(row => {
            if (row.招聘及离职 === '实际招聘人数') {
              recruitSum += row.monthlyData[month] || 0
            } else {
              exitSum += row.monthlyData[month] || 0
            }
          })
          recruitmentTotal.monthlyData[month] = recruitSum || null
          exitTotal.monthlyData[month] = exitSum || null
        })
        
        recruitmentTotal.total = Object.values(recruitmentTotal.monthlyData).reduce((a, b) => (a || 0) + (b || 0), 0) || null
        exitTotal.total = Object.values(exitTotal.monthlyData).reduce((a, b) => (a || 0) + (b || 0), 0) || null
        
        newRows.push(recruitmentTotal)
        newRows.push(exitTotal)
        
        setRows(newRows)
        message.success('已从明细表自动统计数据')
      } else {
        initEmptyRows()
      }
    } catch (error: any) {
      console.error('加载统计数据失败:', error)
      initEmptyRows()
    } finally {
      setLoading(false)
    }
  }, [year, initEmptyRows])

  // 初始加载
  useEffect(() => {
    loadStatistics()
  }, [loadStatistics])

  // 计算单行合计
  const calculateRowTotal = (monthlyData: MonthlyData): number | null => {
    const values = Object.values(monthlyData).filter(v => v !== null) as number[]
    if (values.length === 0) return null
    return values.reduce((sum, val) => sum + val, 0)
  }

  // 重新计算总合计
  const recomputeTotal = (next: PositionRow[]): PositionRow[] => {
    const dataRows = next.filter(r => !r.isTotal)
    const recruitmentTotal = next.find(r => r.isTotal && r.招聘及离职 === '实际招聘人数')
    const exitTotal = next.find(r => r.isTotal && r.招聘及离职 === '离职人数')

    if (recruitmentTotal && exitTotal) {
      // 为每个月份计算总和
      months.forEach(month => {
        // 招聘总计
        const recruitmentSum = dataRows
          .filter(r => r.招聘及离职 === '实际招聘人数')
          .reduce((sum, r) => sum + (r.monthlyData[month] || 0), 0)
        recruitmentTotal.monthlyData[month] = recruitmentSum || null

        // 离职总计
        const exitSum = dataRows
          .filter(r => r.招聘及离职 === '离职人数')
          .reduce((sum, r) => sum + (r.monthlyData[month] || 0), 0)
        exitTotal.monthlyData[month] = exitSum || null
      })

      // 计算总合计的合计列
      recruitmentTotal.total = calculateRowTotal(recruitmentTotal.monthlyData)
      exitTotal.total = calculateRowTotal(exitTotal.monthlyData)
    }

    return next
  }

  // 更新数值
  const updateValue = (rowKey: string, month: string, value: number | null) => {
    setRows(prev => {
      const next = [...prev]
      const row = next.find(r => r.key === rowKey)
      if (row && !row.isTotal) {
        row.monthlyData[month] = value
        row.total = calculateRowTotal(row.monthlyData)
      }
      return recomputeTotal(next)
    })
  }

  // 渲染数值输入框
  const renderNumberInput = (row: PositionRow, month: string) => {
    if (row.isTotal) {
      return (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          {row.monthlyData[month] ?? ''}
        </span>
      )
    }
    return (
      <InputNumber
        value={row.monthlyData[month]}
        onChange={value => updateValue(row.key, month, value)}
        size="small"
        min={0}
        precision={0}
        style={{ width: '100%' }}
        placeholder="0"
      />
    )
  }

  // 表格列配置
  const columns = [
    {
      title: '序号',
      dataIndex: '序号',
      key: '序号',
      width: 70,
      fixed: 'left' as const,
      align: 'center' as const,
      onCell: (record: PositionRow, index?: number) => {
        if (record.isTotal) {
          return { colSpan: 2 }
        }
        // 合并序号列（每个岗位2行）
        if (index !== undefined) {
          const dataRows = rows.filter(r => !r.isTotal)
          const dataIndex = dataRows.findIndex(r => r.key === record.key)
          if (dataIndex % 2 === 0) {
            return { rowSpan: 2 }
          }
          return { rowSpan: 0 }
        }
        return {}
      },
      render: (val: number | string, record: PositionRow) => {
        if (record.isTotal) {
          return <strong style={{ background: '#FFA500', color: '#fff', padding: '2px 8px' }}>{val}</strong>
        }
        return val
      },
    },
    {
      title: '岗位',
      dataIndex: '岗位',
      key: '岗位',
      width: 100,
      fixed: 'left' as const,
      align: 'center' as const,
      onCell: (record: PositionRow, index?: number) => {
        if (record.isTotal) {
          return { colSpan: 0 }
        }
        // 合并岗位列（每个岗位2行）
        if (index !== undefined) {
          const dataRows = rows.filter(r => !r.isTotal)
          const dataIndex = dataRows.findIndex(r => r.key === record.key)
          if (dataIndex % 2 === 0) {
            return { rowSpan: 2 }
          }
          return { rowSpan: 0 }
        }
        return {}
      },
      render: (val: string) => <span style={{ fontWeight: 500 }}>{val}</span>,
    },
    {
      title: '招聘及离职',
      dataIndex: '招聘及离职',
      key: '招聘及离职',
      width: 120,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (val: string, record: PositionRow) => {
        const style: React.CSSProperties = {
          color: val === '实际招聘人数' ? '#52c41a' : '#ff4d4f',
          fontWeight: 500,
        }
        if (record.isTotal) {
          style.background = '#FFA500'
          style.color = '#fff'
          style.padding = '2px 8px'
        }
        return <span style={style}>{val}</span>
      },
    },
    ...months.map(month => ({
      title: month,
      dataIndex: month,
      key: month,
      width: 80,
      align: 'center' as const,
      render: (_: any, record: PositionRow) => renderNumberInput(record, month),
    })),
    {
      title: '合计',
      dataIndex: 'total',
      key: 'total',
      width: 90,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (val: number | null, record: PositionRow) => (
        <strong style={{ 
          color: record.isTotal ? '#1890ff' : record.招聘及离职 === '实际招聘人数' ? '#52c41a' : '#ff4d4f',
          fontSize: record.isTotal ? '14px' : '13px'
        }}>
          {val ?? ''}
        </strong>
      ),
    },
  ]

  return (
    <div style={{ padding: '0 24px' }}>
      <div
        style={{
          background: '#FFA500',
          color: '#fff',
          padding: '8px 16px',
          fontWeight: 'bold',
          fontSize: '14px',
          marginBottom: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>02最高议事厅_祈福司-入职离职分解表</span>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          size="small"
          onClick={loadStatistics}
          loading={loading}
          style={{ background: '#fff', color: '#FFA500', borderColor: '#fff' }}
        >
          刷新统计
        </Button>
      </div>
      <Spin spinning={loading} tip="正在从明细表统计数据...">
        <Table
          columns={columns}
          dataSource={rows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1400 }}
          rowClassName={record => (record.isTotal ? 'total-row' : '')}
        />
      </Spin>
      <style>{`
        .total-row {
          background-color: #fffbe6;
        }
        .total-row td {
          background-color: #fffbe6 !important;
          font-weight: bold;
        }
      `}</style>
    </div>
  )
}
