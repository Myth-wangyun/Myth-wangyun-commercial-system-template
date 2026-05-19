/**
 * 神殿级别 - 新媒体数据核心数据看板（按月）
 */

import React, { useMemo, useState } from 'react'
import { InputNumber, Table } from 'antd'
import { NoCopyContainer } from '@/components/common'

interface CampusNewMediaDataRow {
  key: string
  月份: string | number
  isTotal: boolean
  // 新媒体留资
  计划收入: number | null
  实际收入: number | null
  计划人数人次: number | null
  留资人次: number | null
  // 新媒体转化率
  上门量: number | null
  总转化率: string
  咨询上门: number | null
  咨询上门转化率: string
  // 新媒体新生成本
  导流投入: number | null
  新媒体推广: number | null
}

interface Props {
  year: string
  campus: string
}

export default function CampusNewMediaData({ year, campus }: Props) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const makeEmptyRow = (月份: string | number, isTotal = false): CampusNewMediaDataRow => ({
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
    新媒体推广: null,
  })

  const initialRows = useMemo(() => {
    const rows = months.map(m => makeEmptyRow(m, false))
    rows.push(makeEmptyRow('合计', true))
    return rows
  }, [])

  const [rows, setRows] = useState<CampusNewMediaDataRow[]>(initialRows)

  const recomputeTotal = (next: CampusNewMediaDataRow[]): CampusNewMediaDataRow[] => {
    const dataRows = next.filter(r => !r.isTotal)
    const totalRow = next.find(r => r.isTotal)
    if (!totalRow) return next

    const sumFields: (keyof CampusNewMediaDataRow)[] = [
      '计划收入', '实际收入', '计划人数人次', '留资人次',
      '上门量', '咨询上门', '导流投入', '新媒体推广'
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

  const updateValue = (key: string, field: keyof CampusNewMediaDataRow, value: number | null) => {
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

  const renderNumberInput = (row: CampusNewMediaDataRow, field: keyof CampusNewMediaDataRow, width = 80) => {
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
      render: (val: string | number, r: CampusNewMediaDataRow) =>
        r.isTotal ? <strong style={{ color: '#ff4d4f' }}>{val}</strong> : val,
    },
    {
      title: '新媒体留资',
      children: [
        { title: '计划收入', width: 100, render: (_: any, r: CampusNewMediaDataRow) => renderNumberInput(r, '计划收入') },
        { title: '实际收入', width: 100, render: (_: any, r: CampusNewMediaDataRow) => renderNumberInput(r, '实际收入') },
        { title: '计划人数/人次', width: 110, render: (_: any, r: CampusNewMediaDataRow) => renderNumberInput(r, '计划人数人次') },
        { title: '留资人次', width: 90, render: (_: any, r: CampusNewMediaDataRow) => renderNumberInput(r, '留资人次') },
      ],
    },
    {
      title: '新媒体转化率',
      children: [
        { title: '上门量', width: 80, render: (_: any, r: CampusNewMediaDataRow) => renderNumberInput(r, '上门量') },
        { title: '总转化率', width: 90, dataIndex: '总转化率', render: (val: string) => <span style={{ color: '#52c41a' }}>{val}</span> },
        { title: '咨询上门', width: 90, render: (_: any, r: CampusNewMediaDataRow) => renderNumberInput(r, '咨询上门') },
        { title: '咨询上门转化率', width: 110, dataIndex: '咨询上门转化率', render: (val: string) => <span style={{ color: '#52c41a' }}>{val}</span> },
      ],
    },
    {
      title: '新媒体新生成本',
      children: [
        { title: '导流投入', width: 90, render: (_: any, r: CampusNewMediaDataRow) => renderNumberInput(r, '导流投入') },
        { title: '新媒体推广', width: 100, render: (_: any, r: CampusNewMediaDataRow) => renderNumberInput(r, '新媒体推广') },
      ],
    },
  ]

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <div>
        <div style={{ background: '#87CEEB', padding: '8px 16px', fontWeight: 'bold', marginBottom: 8 }}>
          {campus}{year}年度新媒体数据核心数据看板
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
          .total-row { background-color: #e6f7ff; }
          .total-row td { background-color: #e6f7ff !important; }
        `}</style>
      </div>
    </NoCopyContainer>
  )
}
