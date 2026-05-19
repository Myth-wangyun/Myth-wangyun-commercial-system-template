/**
 * 神殿级别 - 核心数据看板汇总（按月）
 */

import React, { useMemo, useState } from 'react'
import { InputNumber, Table } from 'antd'
import { NoCopyContainer } from '@/components/common'

interface CampusCoreDataRow {
  key: string
  月份: string | number
  isTotal: boolean
  // 招生数据
  计划收入: number | null
  实际收入: number | null
  计划人数: number | null
  实际人数: number | null
  // 转化率
  上门总量: number | null
  总转化率: string
  咨询上门: number | null
  咨询上门转化率: string
  // 续费
  续费人数: number | null
  续费金额: number | null
  // 推量
  咨询总监推量: number | null
  咨询主任推量: number | null
  咨询推量: number | null
  咨询助理推量: number | null
  渠道推量: number | null
  // 重单
  重单人数: number | null
  重单金额: number | null
  入账: number | null
  外单: number | null
  合同: number | null
}

interface Props {
  year: string
  campus: string
}

export default function CampusCoreDataSummary({ year, campus }: Props) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const makeEmptyRow = (月份: string | number, isTotal = false): CampusCoreDataRow => ({
    key: String(月份),
    月份,
    isTotal,
    计划收入: null,
    实际收入: null,
    计划人数: null,
    实际人数: null,
    上门总量: null,
    总转化率: '',
    咨询上门: null,
    咨询上门转化率: '',
    续费人数: null,
    续费金额: null,
    咨询总监推量: null,
    咨询主任推量: null,
    咨询推量: null,
    咨询助理推量: null,
    渠道推量: null,
    重单人数: null,
    重单金额: null,
    入账: null,
    外单: null,
    合同: null,
  })

  const initialRows = useMemo(() => {
    const rows = months.map(m => makeEmptyRow(m, false))
    rows.push(makeEmptyRow('合计', true))
    return rows
  }, [])

  const [rows, setRows] = useState<CampusCoreDataRow[]>(initialRows)

  const recomputeTotal = (next: CampusCoreDataRow[]): CampusCoreDataRow[] => {
    const dataRows = next.filter(r => !r.isTotal)
    const totalRow = next.find(r => r.isTotal)
    if (!totalRow) return next

    const sumFields: (keyof CampusCoreDataRow)[] = [
      '计划收入', '实际收入', '计划人数', '实际人数',
      '上门总量', '咨询上门', '续费人数', '续费金额',
      '咨询总监推量', '咨询主任推量', '咨询推量', '咨询助理推量', '渠道推量',
      '重单人数', '重单金额', '入账', '外单', '合同'
    ]

    sumFields.forEach(field => {
      const sum = dataRows.reduce((acc, r) => {
        const val = r[field]
        // 确保val是数字类型，如果是字符串则转换为数字
        const numVal = typeof val === 'number' ? val : (val ? Number(val) : 0)
        return acc + (isNaN(numVal) ? 0 : numVal)
      }, 0)
      ;(totalRow as any)[field] = sum > 0 ? sum : null
    })

    if (totalRow.上门总量 && totalRow.实际人数) {
      totalRow.总转化率 = ((totalRow.实际人数 / totalRow.上门总量) * 100).toFixed(2) + '%'
    } else {
      totalRow.总转化率 = ''
    }
    if (totalRow.咨询上门 && totalRow.实际人数) {
      totalRow.咨询上门转化率 = ((totalRow.实际人数 / totalRow.咨询上门) * 100).toFixed(2) + '%'
    } else {
      totalRow.咨询上门转化率 = ''
    }

    return next
  }

  const updateValue = (key: string, field: keyof CampusCoreDataRow, value: number | null) => {
    setRows(prev => {
      const next = [...prev]
      const row = next.find(r => r.key === key)
      if (row && !row.isTotal) {
        ;(row as any)[field] = value
        if (row.上门总量 && row.实际人数) {
          row.总转化率 = ((row.实际人数 / row.上门总量) * 100).toFixed(2) + '%'
        }
        if (row.咨询上门 && row.实际人数) {
          row.咨询上门转化率 = ((row.实际人数 / row.咨询上门) * 100).toFixed(2) + '%'
        }
      }
      return recomputeTotal(next)
    })
  }

  const renderNumberInput = (row: CampusCoreDataRow, field: keyof CampusCoreDataRow, width = 80) => {
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
      render: (val: string | number, r: CampusCoreDataRow) =>
        r.isTotal ? <strong style={{ color: '#ff4d4f' }}>{val}</strong> : val,
    },
    {
      title: '招生数据',
      children: [
        { title: '计划收入', width: 100, render: (_: any, r: CampusCoreDataRow) => renderNumberInput(r, '计划收入') },
        { title: '实际收入', width: 100, render: (_: any, r: CampusCoreDataRow) => renderNumberInput(r, '实际收入') },
        { title: '计划人数', width: 90, render: (_: any, r: CampusCoreDataRow) => renderNumberInput(r, '计划人数') },
        { title: '实际人数', width: 90, render: (_: any, r: CampusCoreDataRow) => renderNumberInput(r, '实际人数') },
      ],
    },
    {
      title: '转化率',
      children: [
        { title: '上门总量', width: 90, render: (_: any, r: CampusCoreDataRow) => renderNumberInput(r, '上门总量') },
        { title: '总转化率', width: 80, dataIndex: '总转化率', render: (val: string) => <span style={{ color: '#52c41a' }}>{val}</span> },
        { title: '咨询上门', width: 90, render: (_: any, r: CampusCoreDataRow) => renderNumberInput(r, '咨询上门') },
        { title: '咨询上门转化率', width: 110, dataIndex: '咨询上门转化率', render: (val: string) => <span style={{ color: '#52c41a' }}>{val}</span> },
      ],
    },
    {
      title: '续费',
      children: [
        { title: '续费人数', width: 90, render: (_: any, r: CampusCoreDataRow) => renderNumberInput(r, '续费人数') },
        { title: '续费金额', width: 100, render: (_: any, r: CampusCoreDataRow) => renderNumberInput(r, '续费金额') },
      ],
    },
    {
      title: '推量',
      children: [
        { title: '咨询总监', width: 80, render: (_: any, r: CampusCoreDataRow) => renderNumberInput(r, '咨询总监推量') },
        { title: '咨询主任', width: 80, render: (_: any, r: CampusCoreDataRow) => renderNumberInput(r, '咨询主任推量') },
        { title: '咨询', width: 70, render: (_: any, r: CampusCoreDataRow) => renderNumberInput(r, '咨询推量') },
        { title: '咨询助理', width: 80, render: (_: any, r: CampusCoreDataRow) => renderNumberInput(r, '咨询助理推量') },
        { title: '渠道', width: 70, render: (_: any, r: CampusCoreDataRow) => renderNumberInput(r, '渠道推量') },
      ],
    },
    {
      title: '重单数据',
      children: [
        { title: '重单人数', width: 80, render: (_: any, r: CampusCoreDataRow) => renderNumberInput(r, '重单人数') },
        { title: '重单金额', width: 90, render: (_: any, r: CampusCoreDataRow) => renderNumberInput(r, '重单金额') },
        { title: '入账', width: 70, render: (_: any, r: CampusCoreDataRow) => renderNumberInput(r, '入账') },
        { title: '外单', width: 70, render: (_: any, r: CampusCoreDataRow) => renderNumberInput(r, '外单') },
        { title: '合同', width: 70, render: (_: any, r: CampusCoreDataRow) => renderNumberInput(r, '合同') },
      ],
    },
  ]

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <div>
        <div style={{ background: '#FFD700', padding: '8px 16px', fontWeight: 'bold', marginBottom: 8 }}>
          {campus}{year}年度核心指标看板汇总
        </div>
        <Table
          columns={columns}
          dataSource={rows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1600 }}
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
