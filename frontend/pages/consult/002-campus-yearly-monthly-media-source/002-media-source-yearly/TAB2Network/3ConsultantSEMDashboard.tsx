/**
 * 清美教育集团年度SEM数据核心数据看板（咨询师维度）
 * 按咨询师展示SEM完整数据
 */

import React, { useMemo, useState } from 'react'
import { Input, InputNumber, Table } from 'antd'
import { NoCopyContainer } from '@/components/common'

interface ConsultantSEMRow {
  key: string
  序号: number | string
  咨询师: string
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
  // SEM转化率
  总转: string
  当面转化: string
  SEM电转率: string
  // SEM招生成本
  SEM投入: number | null
  招生成本: number | null
}

interface Props {
  year: string
  campus: string
}

export default function ConsultantSEMDashboard({ year, campus }: Props) {
  const consultantCount = 10

  const makeEmptyRow = (序号: number | string, isTotal = false): ConsultantSEMRow => ({
    key: String(序号),
    序号,
    咨询师: '',
    isTotal,
    计划收入: null,
    实际收入: null,
    计划新生: null,
    实际新生: null,
    退单人数: null,
    上门总量: null,
    咨询总量: null,
    电话量: null,
    总转: '',
    当面转化: '',
    SEM电转率: '',
    SEM投入: null,
    招生成本: null,
  })

  const initialRows = useMemo(() => {
    const rows = Array.from({ length: consultantCount }, (_, i) => makeEmptyRow(i + 1, false))
    rows.push(makeEmptyRow('合计', true))
    return rows
  }, [])

  const [rows, setRows] = useState<ConsultantSEMRow[]>(initialRows)

  const calculateRates = (row: ConsultantSEMRow) => {
    // 总转 = 实际新生 / 上门总量
    if (row.上门总量 && row.实际新生) {
      row.总转 = ((row.实际新生 / row.上门总量) * 100).toFixed(2) + '%'
    } else {
      row.总转 = '-'
    }
    
    // 当面转化 = 实际新生 / 咨询总量
    if (row.咨询总量 && row.实际新生) {
      row.当面转化 = ((row.实际新生 / row.咨询总量) * 100).toFixed(2) + '%'
    } else {
      row.当面转化 = '-'
    }
    
    // SEM电转率 = 上门总量 / 电话量
    if (row.电话量 && row.上门总量) {
      row.SEM电转率 = ((row.上门总量 / row.电话量) * 100).toFixed(2) + '%'
    } else {
      row.SEM电转率 = '-'
    }
  }

  const recomputeTotal = (next: ConsultantSEMRow[]): ConsultantSEMRow[] => {
    const dataRows = next.filter(r => !r.isTotal)
    const totalRow = next.find(r => r.isTotal)
    if (!totalRow) return next

    const sumFields: (keyof ConsultantSEMRow)[] = [
      '计划收入', '实际收入', '计划新生', '实际新生', '退单人数',
      '上门总量', '咨询总量', '电话量', 'SEM投入', '招生成本'
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

  const updateValue = (key: string, field: keyof ConsultantSEMRow, value: number | null) => {
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

  const updateConsultantName = (key: string, name: string) => {
    setRows(prev => {
      const next = [...prev]
      const row = next.find(r => r.key === key)
      if (row && !row.isTotal) {
        row.咨询师 = name
      }
      return next
    })
  }

  const renderNumberInput = (row: ConsultantSEMRow, field: keyof ConsultantSEMRow, width = 90) => {
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
    if (val === '#DIV/0!' || val === '-') {
      return <span style={{ color: '#999' }}>{val}</span>
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
      render: (val: number | string, r: ConsultantSEMRow) =>
        r.isTotal ? <strong style={{ color: '#ff4d4f' }}>{val}</strong> : val,
    },
    {
      title: '咨询师',
      dataIndex: '咨询师',
      width: 120,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (val: string, r: ConsultantSEMRow) => {
        if (r.isTotal) {
          return <strong style={{ color: '#1890ff' }}>合计</strong>
        }
        return (
          <Input
            value={val}
            onChange={e => updateConsultantName(r.key, e.target.value)}
            size="small"
            placeholder="输入姓名"
            style={{ width: 110 }}
          />
        )
      },
    },
    {
      title: '招生收入',
      children: [
        { 
          title: '计划收入', 
          width: 100, 
          render: (_: any, r: ConsultantSEMRow) => renderNumberInput(r, '计划收入', 100) 
        },
        { 
          title: '实际收入', 
          width: 100, 
          render: (_: any, r: ConsultantSEMRow) => renderNumberInput(r, '实际收入', 100) 
        },
      ],
    },
    {
      title: '招生数据',
      children: [
        { 
          title: '计划新生', 
          width: 90, 
          render: (_: any, r: ConsultantSEMRow) => renderNumberInput(r, '计划新生', 80) 
        },
        { 
          title: '实际新生', 
          width: 90, 
          render: (_: any, r: ConsultantSEMRow) => renderNumberInput(r, '实际新生', 80) 
        },
        { 
          title: '退单人数', 
          width: 90, 
          render: (_: any, r: ConsultantSEMRow) => renderNumberInput(r, '退单人数', 80) 
        },
        { 
          title: '上门总量', 
          width: 90, 
          render: (_: any, r: ConsultantSEMRow) => renderNumberInput(r, '上门总量', 80) 
        },
        { 
          title: '咨询总量', 
          width: 90, 
          render: (_: any, r: ConsultantSEMRow) => renderNumberInput(r, '咨询总量', 80) 
        },
        { 
          title: '电话量', 
          width: 80, 
          render: (_: any, r: ConsultantSEMRow) => renderNumberInput(r, '电话量', 70) 
        },
      ],
    },
    {
      title: 'SEM转化率',
      children: [
        { 
          title: '总转', 
          width: 90, 
          dataIndex: '总转', 
          render: (val: string) => renderRate(val)
        },
        { 
          title: '当面转化', 
          width: 100, 
          dataIndex: '当面转化', 
          render: (val: string) => renderRate(val)
        },
        { 
          title: 'SEM电转率', 
          width: 100, 
          dataIndex: 'SEM电转率', 
          render: (val: string) => renderRate(val)
        },
      ],
    },
    {
      title: 'SEM招生成本',
      children: [
        { 
          title: 'SEM投入', 
          width: 100, 
          render: (_: any, r: ConsultantSEMRow) => renderNumberInput(r, 'SEM投入', 90) 
        },
        { 
          title: '招生成本', 
          width: 100, 
          render: (_: any, r: ConsultantSEMRow) => renderNumberInput(r, '招生成本', 90) 
        },
      ],
    },
  ]

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <div>
        <div style={{ 
          background: '#FF8C00', 
          padding: '8px 16px', 
          fontWeight: 'bold', 
          marginBottom: 8,
          fontSize: '14px',
          color: 'white'
        }}>
          {campus}{year}年度SEM数据核心数据看板（咨询师）
        </div>
        <Table
          columns={columns}
          dataSource={rows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1500 }}
          rowClassName={r => (r.isTotal ? 'total-row' : '')}
        />
        <style>{`
          .total-row { background-color: #fff7e6; }
          .total-row td { background-color: #fff7e6 !important; font-weight: bold; }
        `}</style>
      </div>
    </NoCopyContainer>
  )
}

