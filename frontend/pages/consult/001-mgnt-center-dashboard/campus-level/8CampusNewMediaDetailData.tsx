/**
 * 神殿级别 - 神殿新媒体核心数据看板（按月）
 */

import React, { useMemo, useState } from 'react'
import { InputNumber, Table } from 'antd'
import { NoCopyContainer } from '@/components/common'

interface CampusNewMediaDetailDataRow {
  key: string
  月份: string | number
  isTotal: boolean
  // 客资粉丝数据
  意向客资: number | null
  电话量: number | null
  总转化率: string
  // 签单数据
  签单数: number | null
  签单金额: number | null
  签单转化率: string
  // 客户评级
  星级评级: number | null
  关注: number | null
  净推荐值: number | null
  粉丝量: number | null
  粉丝增量: number | null
}

interface Props {
  year: string
  campus: string
}

export default function CampusNewMediaDetailData({ year, campus }: Props) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const makeEmptyRow = (月份: string | number, isTotal = false): CampusNewMediaDetailDataRow => ({
    key: String(月份),
    月份,
    isTotal,
    意向客资: null,
    电话量: null,
    总转化率: '',
    签单数: null,
    签单金额: null,
    签单转化率: '',
    星级评级: null,
    关注: null,
    净推荐值: null,
    粉丝量: null,
    粉丝增量: null,
  })

  const initialRows = useMemo(() => {
    const rows = months.map(m => makeEmptyRow(m, false))
    rows.push(makeEmptyRow('合计', true))
    return rows
  }, [])

  const [rows, setRows] = useState<CampusNewMediaDetailDataRow[]>(initialRows)

  const recomputeTotal = (next: CampusNewMediaDetailDataRow[]): CampusNewMediaDetailDataRow[] => {
    const dataRows = next.filter(r => !r.isTotal)
    const totalRow = next.find(r => r.isTotal)
    if (!totalRow) return next

    const sumFields: (keyof CampusNewMediaDetailDataRow)[] = [
      '意向客资', '电话量', '签单数', '签单金额',
      '星级评级', '关注', '净推荐值', '粉丝量', '粉丝增量'
    ]

    sumFields.forEach(field => {
      const sum = dataRows.reduce((acc, r) => {
        const val = r[field]
        return acc + (typeof val === 'number' ? val : 0)
      }, 0)
      ;(totalRow as any)[field] = sum || null
    })

    if (totalRow.意向客资 && totalRow.电话量) {
      totalRow.总转化率 = ((totalRow.电话量 / totalRow.意向客资) * 100).toFixed(2) + '%'
    }
    if (totalRow.意向客资 && totalRow.签单数) {
      totalRow.签单转化率 = ((totalRow.签单数 / totalRow.意向客资) * 100).toFixed(2) + '%'
    }

    return next
  }

  const updateValue = (key: string, field: keyof CampusNewMediaDetailDataRow, value: number | null) => {
    setRows(prev => {
      const next = [...prev]
      const row = next.find(r => r.key === key)
      if (row && !row.isTotal) {
        ;(row as any)[field] = value
        if (row.意向客资 && row.电话量) {
          row.总转化率 = ((row.电话量 / row.意向客资) * 100).toFixed(2) + '%'
        }
        if (row.意向客资 && row.签单数) {
          row.签单转化率 = ((row.签单数 / row.意向客资) * 100).toFixed(2) + '%'
        }
      }
      return recomputeTotal(next)
    })
  }

  const renderNumberInput = (row: CampusNewMediaDetailDataRow, field: keyof CampusNewMediaDetailDataRow, width = 80) => {
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
      render: (val: string | number, r: CampusNewMediaDetailDataRow) =>
        r.isTotal ? <strong style={{ color: '#ff4d4f' }}>{val}</strong> : val,
    },
    {
      title: '客资粉丝数据',
      children: [
        { title: '意向客资', width: 90, render: (_: any, r: CampusNewMediaDetailDataRow) => renderNumberInput(r, '意向客资') },
        { title: '电话量', width: 80, render: (_: any, r: CampusNewMediaDetailDataRow) => renderNumberInput(r, '电话量') },
        { title: '总转化率', width: 90, dataIndex: '总转化率', render: (val: string) => <span style={{ color: '#52c41a' }}>{val}</span> },
      ],
    },
    {
      title: '签单数据',
      children: [
        { title: '签单数', width: 80, render: (_: any, r: CampusNewMediaDetailDataRow) => renderNumberInput(r, '签单数') },
        { title: '签单金额', width: 100, render: (_: any, r: CampusNewMediaDetailDataRow) => renderNumberInput(r, '签单金额') },
        { title: '签单转化率', width: 100, dataIndex: '签单转化率', render: (val: string) => <span style={{ color: '#52c41a' }}>{val}</span> },
      ],
    },
    {
      title: '客户评级',
      children: [
        { title: '星级评级', width: 80, render: (_: any, r: CampusNewMediaDetailDataRow) => renderNumberInput(r, '星级评级') },
        { title: '关注', width: 70, render: (_: any, r: CampusNewMediaDetailDataRow) => renderNumberInput(r, '关注') },
        { title: '净推荐值', width: 90, render: (_: any, r: CampusNewMediaDetailDataRow) => renderNumberInput(r, '净推荐值') },
        { title: '粉丝量', width: 80, render: (_: any, r: CampusNewMediaDetailDataRow) => renderNumberInput(r, '粉丝量') },
        { title: '粉丝增量', width: 90, render: (_: any, r: CampusNewMediaDetailDataRow) => renderNumberInput(r, '粉丝增量') },
      ],
    },
  ]

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <div>
        <div style={{ background: '#ADD8E6', padding: '8px 16px', fontWeight: 'bold', marginBottom: 8 }}>
          {campus}{year}年度神殿新媒体核心数据看板
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
