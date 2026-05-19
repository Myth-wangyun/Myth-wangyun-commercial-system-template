/**
 * 网络数据核心数据看板
 * 按月份展示网络完整数据
 */

import React, { useMemo, useState } from 'react'
import { InputNumber, Table } from 'antd'
import { NoCopyContainer } from '@/components/common'

interface NetworkDataRow {
  key: string
  序号: number | string
  神殿: string
  isTotal: boolean
  // 招生收入
  计划收入: number | null
  实际收入: number | null
  // 招生数据
  计划新生: number | null
  实际新生: number | null
  退单人数: number | null
  上门总量: number | null
  咨询总量: number | null
  电话量: number | null
  // 转化率
  总转化率: string
  当面转化率: string
  电话上门率: string
  // 招生成本
  总投入: number | null
  招生成本: number | null
  // 咨询费
  咨询总数: number | null
  咨询员工资调整咨询员工资: number | null
  渠道总职数: number | null
  // 渠道成本
  其办: number | null
  乡办: number | null
  信息员: number | null
}

interface Props {
  year: string
  campus: string
}

export default function NetworkDataDashboard({ year, campus }: Props) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const makeEmptyRow = (序号: number | string, isTotal = false): NetworkDataRow => ({
    key: String(序号),
    序号,
    神殿: isTotal ? '' : campus,
    isTotal,
    计划收入: null,
    实际收入: null,
    计划新生: null,
    实际新生: null,
    退单人数: null,
    上门总量: null,
    咨询总量: null,
    电话量: null,
    总转化率: '',
    当面转化率: '',
    电话上门率: '',
    总投入: null,
    招生成本: null,
    咨询总数: null,
    咨询员工资调整咨询员工资: null,
    渠道总职数: null,
    其办: null,
    乡办: null,
    信息员: null,
  })

  const initialRows = useMemo(() => {
    const rows = months.map(m => makeEmptyRow(m, false))
    rows.push(makeEmptyRow('合计', true))
    return rows
  }, [])

  const [rows, setRows] = useState<NetworkDataRow[]>(initialRows)

  const calculateRates = (row: NetworkDataRow) => {
    // 总转化率 = 实际新生 / 上门总量
    if (row.上门总量 && row.实际新生) {
      row.总转化率 = ((row.实际新生 / row.上门总量) * 100).toFixed(2) + '%'
    } else {
      row.总转化率 = '#REF!'
    }
    
    // 当面转化率 = 实际新生 / 咨询总量
    if (row.咨询总量 && row.实际新生) {
      row.当面转化率 = ((row.实际新生 / row.咨询总量) * 100).toFixed(2) + '%'
    } else {
      row.当面转化率 = '#REF!'
    }
    
    // 电话上门率 = 上门总量 / 电话量
    if (row.电话量 && row.上门总量) {
      row.电话上门率 = ((row.上门总量 / row.电话量) * 100).toFixed(2) + '%'
    } else {
      row.电话上门率 = '#REF!'
    }
  }

  const recomputeTotal = (next: NetworkDataRow[]): NetworkDataRow[] => {
    const dataRows = next.filter(r => !r.isTotal)
    const totalRow = next.find(r => r.isTotal)
    if (!totalRow) return next

    const sumFields: (keyof NetworkDataRow)[] = [
      '计划收入', '实际收入', '计划新生', '实际新生', '退单人数',
      '上门总量', '咨询总量', '电话量', '总投入', '招生成本',
      '咨询总数', '咨询员工资调整咨询员工资', '渠道总职数',
      '其办', '乡办', '信息员'
    ]

    sumFields.forEach(field => {
      const sum = dataRows.reduce((acc, r) => {
        const val = r[field]
        return acc + (typeof val === 'number' ? val : 0)
      }, 0)
      ;(totalRow as any)[field] = sum || null
    })

    calculateRates(totalRow)
    return next
  }

  const updateValue = (key: string, field: keyof NetworkDataRow, value: number | null) => {
    setRows(prev => {
      const next = [...prev]
      const row = next.find(r => r.key === key)
      if (row && !row.isTotal) {
        ;(row as any)[field] = value
        calculateRates(row)
      }
      return recomputeTotal(next)
    })
  }

  const renderNumberInput = (row: NetworkDataRow, field: keyof NetworkDataRow, width = 90) => {
    const value = row[field] as number | null
    if (row.isTotal) {
      return <strong style={{ color: '#1890ff' }}>{value ?? ''}</strong>
    }
    return (
      <InputNumber
        value={value}
        onChange={v => updateValue(row.key, field, v)}
        size="small"
        min={0}
        style={{ width }}
        placeholder="0"
      />
    )
  }

  const renderRate = (val: string) => {
    if (val === '#REF!') {
      return <span style={{ color: '#ff4d4f' }}>{val}</span>
    }
    return <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{val}</span>
  }

  const columns = [
    {
      title: '序号',
      dataIndex: '序号',
      width: 60,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (val: number | string, r: NetworkDataRow) =>
        r.isTotal ? <strong style={{ color: '#ff4d4f' }}>{val}</strong> : val,
    },
    {
      title: '神殿',
      dataIndex: '神殿',
      width: 100,
      fixed: 'left' as const,
      align: 'center' as const,
    },
    {
      title: '招生收入',
      children: [
        { 
          title: '计划收入', 
          width: 100, 
          render: (_: any, r: NetworkDataRow) => renderNumberInput(r, '计划收入', 100) 
        },
        { 
          title: '实际收入', 
          width: 100, 
          render: (_: any, r: NetworkDataRow) => renderNumberInput(r, '实际收入', 100) 
        },
      ],
    },
    {
      title: '招生数据',
      children: [
        { 
          title: '计划新生', 
          width: 90, 
          render: (_: any, r: NetworkDataRow) => renderNumberInput(r, '计划新生', 80) 
        },
        { 
          title: '实际新生', 
          width: 90, 
          render: (_: any, r: NetworkDataRow) => renderNumberInput(r, '实际新生', 80) 
        },
        { 
          title: '退单人数', 
          width: 90, 
          render: (_: any, r: NetworkDataRow) => renderNumberInput(r, '退单人数', 80) 
        },
        { 
          title: '上门总量', 
          width: 90, 
          render: (_: any, r: NetworkDataRow) => renderNumberInput(r, '上门总量', 80) 
        },
        { 
          title: '咨询总量', 
          width: 90, 
          render: (_: any, r: NetworkDataRow) => renderNumberInput(r, '咨询总量', 80) 
        },
        { 
          title: '电话量', 
          width: 80, 
          render: (_: any, r: NetworkDataRow) => renderNumberInput(r, '电话量', 70) 
        },
      ],
    },
    {
      title: '转化率',
      children: [
        { 
          title: '总转化率', 
          width: 90, 
          dataIndex: '总转化率', 
          render: (val: string) => renderRate(val)
        },
        { 
          title: '当面转化率', 
          width: 100, 
          dataIndex: '当面转化率', 
          render: (val: string) => renderRate(val)
        },
        { 
          title: '电话上门率', 
          width: 100, 
          dataIndex: '电话上门率', 
          render: (val: string) => renderRate(val)
        },
      ],
    },
    {
      title: '招生成本',
      children: [
        { 
          title: '总投入', 
          width: 100, 
          render: (_: any, r: NetworkDataRow) => renderNumberInput(r, '总投入', 90) 
        },
        { 
          title: '招生成本', 
          width: 100, 
          render: (_: any, r: NetworkDataRow) => renderNumberInput(r, '招生成本', 90) 
        },
      ],
    },
    {
      title: '咨询费',
      children: [
        { 
          title: '咨询总数', 
          width: 90, 
          render: (_: any, r: NetworkDataRow) => renderNumberInput(r, '咨询总数', 80) 
        },
        { 
          title: '咨询员工资调整咨询员工资', 
          width: 180, 
          render: (_: any, r: NetworkDataRow) => renderNumberInput(r, '咨询员工资调整咨询员工资', 170) 
        },
        { 
          title: '渠道总职数', 
          width: 100, 
          render: (_: any, r: NetworkDataRow) => renderNumberInput(r, '渠道总职数', 90) 
        },
      ],
    },
    {
      title: '渠道成本',
      children: [
        { 
          title: '其办', 
          width: 80, 
          render: (_: any, r: NetworkDataRow) => renderNumberInput(r, '其办', 70) 
        },
        { 
          title: '乡办', 
          width: 80, 
          render: (_: any, r: NetworkDataRow) => renderNumberInput(r, '乡办', 70) 
        },
        { 
          title: '信息员', 
          width: 90, 
          render: (_: any, r: NetworkDataRow) => renderNumberInput(r, '信息员', 80) 
        },
      ],
    },
  ]

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <div>
        <div style={{ 
          background: '#1E90FF', 
          padding: '8px 16px', 
          fontWeight: 'bold', 
          marginBottom: 8,
          fontSize: '14px',
          color: 'white'
        }}>
          {campus}{year}年度网络数据核心数据看板
        </div>
        <Table
          columns={columns}
          dataSource={rows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 2000 }}
          rowClassName={r => (r.isTotal ? 'total-row' : '')}
        />
        <style>{`
          .total-row { background-color: #e6f7ff; }
          .total-row td { background-color: #e6f7ff !important; font-weight: bold; }
        `}</style>
      </div>
    </NoCopyContainer>
  )
}

