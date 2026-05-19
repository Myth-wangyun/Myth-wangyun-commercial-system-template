/**
 * 神殿级别 - 主流媒体核心数据看板（按月）
 */

import React, { useMemo, useState } from 'react'
import { InputNumber, Table } from 'antd'
import { NoCopyContainer } from '@/components/common'

interface CampusMainstreamMediaDataRow {
  key: string
  月份: string | number
  isTotal: boolean
  // 主流媒体数据
  意向客资: number | null
  电话量: number | null
  // 主流媒体转化
  上门量: number | null
  签单数: number | null
  签单率: string
  // 客资转化
  签单转化率: string
  日志: number | null
  净推荐值: number | null
}

interface Props {
  year: string
  campus: string
}

export default function CampusMainstreamMediaData({ year, campus }: Props) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const makeEmptyRow = (月份: string | number, isTotal = false): CampusMainstreamMediaDataRow => ({
    key: String(月份),
    月份,
    isTotal,
    意向客资: null,
    电话量: null,
    上门量: null,
    签单数: null,
    签单率: '',
    签单转化率: '',
    日志: null,
    净推荐值: null,
  })

  const initialRows = useMemo(() => {
    const rows = months.map(m => makeEmptyRow(m, false))
    rows.push(makeEmptyRow('合计', true))
    return rows
  }, [])

  const [rows, setRows] = useState<CampusMainstreamMediaDataRow[]>(initialRows)

  const recomputeTotal = (next: CampusMainstreamMediaDataRow[]): CampusMainstreamMediaDataRow[] => {
    const dataRows = next.filter(r => !r.isTotal)
    const totalRow = next.find(r => r.isTotal)
    if (!totalRow) return next

    const sumFields: (keyof CampusMainstreamMediaDataRow)[] = [
      '意向客资', '电话量', '上门量', '签单数', '日志', '净推荐值'
    ]

    sumFields.forEach(field => {
      const sum = dataRows.reduce((acc, r) => {
        const val = r[field]
        return acc + (typeof val === 'number' ? val : 0)
      }, 0)
      ;(totalRow as any)[field] = sum || null
    })

    if (totalRow.上门量 && totalRow.签单数) {
      totalRow.签单率 = ((totalRow.签单数 / totalRow.上门量) * 100).toFixed(2) + '%'
    }
    if (totalRow.意向客资 && totalRow.签单数) {
      totalRow.签单转化率 = ((totalRow.签单数 / totalRow.意向客资) * 100).toFixed(2) + '%'
    }

    return next
  }

  const updateValue = (key: string, field: keyof CampusMainstreamMediaDataRow, value: number | null) => {
    setRows(prev => {
      const next = [...prev]
      const row = next.find(r => r.key === key)
      if (row && !row.isTotal) {
        ;(row as any)[field] = value
        if (row.上门量 && row.签单数) {
          row.签单率 = ((row.签单数 / row.上门量) * 100).toFixed(2) + '%'
        }
        if (row.意向客资 && row.签单数) {
          row.签单转化率 = ((row.签单数 / row.意向客资) * 100).toFixed(2) + '%'
        }
      }
      return recomputeTotal(next)
    })
  }

  const renderNumberInput = (row: CampusMainstreamMediaDataRow, field: keyof CampusMainstreamMediaDataRow, width = 80) => {
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

  const columns = [
    {
      title: '月份',
      dataIndex: '月份',
      width: 60,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (val: string | number, r: CampusMainstreamMediaDataRow) =>
        r.isTotal ? <strong style={{ color: '#ff4d4f' }}>{val}</strong> : val,
    },
    {
      title: '主流媒体数据',
      children: [
        { title: '意向客资', width: 90, render: (_: any, r: CampusMainstreamMediaDataRow) => renderNumberInput(r, '意向客资') },
        { title: '电话量', width: 80, render: (_: any, r: CampusMainstreamMediaDataRow) => renderNumberInput(r, '电话量') },
      ],
    },
    {
      title: '主流媒体转化',
      children: [
        { title: '上门量', width: 80, render: (_: any, r: CampusMainstreamMediaDataRow) => renderNumberInput(r, '上门量') },
        { title: '签单数', width: 80, render: (_: any, r: CampusMainstreamMediaDataRow) => renderNumberInput(r, '签单数') },
        { title: '签单率', width: 80, dataIndex: '签单率', render: (val: string) => <span style={{ color: '#52c41a' }}>{val}</span> },
      ],
    },
    {
      title: '客资转化',
      children: [
        { title: '签单转化率', width: 100, dataIndex: '签单转化率', render: (val: string) => <span style={{ color: '#52c41a' }}>{val}</span> },
        { title: '日志', width: 70, render: (_: any, r: CampusMainstreamMediaDataRow) => renderNumberInput(r, '日志') },
        { title: '净推荐值', width: 90, render: (_: any, r: CampusMainstreamMediaDataRow) => renderNumberInput(r, '净推荐值') },
      ],
    },
  ]

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <div>
        <div style={{ background: '#F0E68C', padding: '8px 16px', fontWeight: 'bold', marginBottom: 8 }}>
          {campus}{year}年度主流媒体核心数据看板
        </div>
        <Table
          columns={columns}
          dataSource={rows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 800 }}
          rowClassName={r => (r.isTotal ? 'total-row' : '')}
        />
        <style>{`
          .total-row { background-color: #fffbe6; }
          .total-row td { background-color: #fffbe6 !important; }
        `}</style>
      </div>
    </NoCopyContainer>
  )
}
