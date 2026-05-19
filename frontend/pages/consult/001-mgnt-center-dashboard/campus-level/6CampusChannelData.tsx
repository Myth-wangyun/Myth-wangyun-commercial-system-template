/**
 * 神殿级别 - C端数据核心数据看板（按月）
 */

import React, { useMemo, useState } from 'react'
import { InputNumber, Table } from 'antd'
import { NoCopyContainer } from '@/components/common'

interface CampusChannelDataRow {
  key: string
  月份: string | number
  isTotal: boolean
  // C端留资数据
  计划收入: number | null
  实际收入: number | null
  计划人数人次: number | null
  留资人次: number | null
  // C端转化率
  上门量: number | null
  总转化率: string
  咨询上门: number | null
  咨询上门转化率: string
  // C端新生成本
  导流投入: number | null
  C端推广: number | null
}

interface Props {
  year: string
  campus: string
}

export default function CampusChannelData({ year, campus }: Props) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const makeEmptyRow = (月份: string | number, isTotal = false): CampusChannelDataRow => ({
    key: String(月份),
    月份,
    isTotal,
    计划收入: null,
    实际收入: null,
    计划人数人次: null,
    留资人次: null,
    上门量: null,
    总转化率: '',
    咨询上门: null,
    咨询上门转化率: '',
    导流投入: null,
    C端推广: null,
  })

  const initialRows = useMemo(() => {
    const rows = months.map(m => makeEmptyRow(m, false))
    rows.push(makeEmptyRow('合计', true))
    return rows
  }, [])

  const [rows, setRows] = useState<CampusChannelDataRow[]>(initialRows)

  const recomputeTotal = (next: CampusChannelDataRow[]): CampusChannelDataRow[] => {
    const dataRows = next.filter(r => !r.isTotal)
    const totalRow = next.find(r => r.isTotal)
    if (!totalRow) return next

    const sumFields: (keyof CampusChannelDataRow)[] = [
      '计划收入', '实际收入', '计划人数人次', '留资人次',
      '上门量', '咨询上门', '导流投入', 'C端推广'
    ]

    sumFields.forEach(field => {
      const sum = dataRows.reduce((acc, r) => {
        const val = r[field]
        return acc + (typeof val === 'number' ? val : 0)
      }, 0)
      ;(totalRow as any)[field] = sum || null
    })

    if (totalRow.上门量 && totalRow.计划人数人次) {
      totalRow.总转化率 = ((totalRow.计划人数人次 / totalRow.上门量) * 100).toFixed(2) + '%'
    }
    if (totalRow.咨询上门 && totalRow.计划人数人次) {
      totalRow.咨询上门转化率 = ((totalRow.计划人数人次 / totalRow.咨询上门) * 100).toFixed(2) + '%'
    }

    return next
  }

  const updateValue = (key: string, field: keyof CampusChannelDataRow, value: number | null) => {
    setRows(prev => {
      const next = [...prev]
      const row = next.find(r => r.key === key)
      if (row && !row.isTotal) {
        ;(row as any)[field] = value
        if (row.上门量 && row.计划人数人次) {
          row.总转化率 = ((row.计划人数人次 / row.上门量) * 100).toFixed(2) + '%'
        }
        if (row.咨询上门 && row.计划人数人次) {
          row.咨询上门转化率 = ((row.计划人数人次 / row.咨询上门) * 100).toFixed(2) + '%'
        }
      }
      return recomputeTotal(next)
    })
  }

  const renderNumberInput = (row: CampusChannelDataRow, field: keyof CampusChannelDataRow, width = 80) => {
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
      render: (val: string | number, r: CampusChannelDataRow) =>
        r.isTotal ? <strong style={{ color: '#ff4d4f' }}>{val}</strong> : val,
    },
    {
      title: 'C端留资数据',
      children: [
        { title: '计划收入', width: 100, render: (_: any, r: CampusChannelDataRow) => renderNumberInput(r, '计划收入') },
        { title: '实际收入', width: 100, render: (_: any, r: CampusChannelDataRow) => renderNumberInput(r, '实际收入') },
        { title: '计划人数/人次', width: 110, render: (_: any, r: CampusChannelDataRow) => renderNumberInput(r, '计划人数人次') },
        { title: '留资人次', width: 90, render: (_: any, r: CampusChannelDataRow) => renderNumberInput(r, '留资人次') },
      ],
    },
    {
      title: 'C端转化率',
      children: [
        { title: '上门量', width: 80, render: (_: any, r: CampusChannelDataRow) => renderNumberInput(r, '上门量') },
        { title: '总转化率', width: 90, dataIndex: '总转化率', render: (val: string) => <span style={{ color: '#52c41a' }}>{val}</span> },
        { title: '咨询上门', width: 90, render: (_: any, r: CampusChannelDataRow) => renderNumberInput(r, '咨询上门') },
        { title: '咨询上门转化率', width: 110, dataIndex: '咨询上门转化率', render: (val: string) => <span style={{ color: '#52c41a' }}>{val}</span> },
      ],
    },
    {
      title: 'C端新生成本',
      children: [
        { title: '导流投入', width: 90, render: (_: any, r: CampusChannelDataRow) => renderNumberInput(r, '导流投入') },
        { title: 'C端推广', width: 90, render: (_: any, r: CampusChannelDataRow) => renderNumberInput(r, 'C端推广') },
      ],
    },
  ]

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <div>
        <div style={{ background: '#98FB98', padding: '8px 16px', fontWeight: 'bold', marginBottom: 8 }}>
          {campus}{year}年度C端数据核心数据看板
        </div>
        <Table
          columns={columns}
          dataSource={rows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1000 }}
          rowClassName={r => (r.isTotal ? 'total-row' : '')}
        />
        <style>{`
          .total-row { background-color: #f6ffed; }
          .total-row td { background-color: #f6ffed !important; }
        `}</style>
      </div>
    </NoCopyContainer>
  )
}
