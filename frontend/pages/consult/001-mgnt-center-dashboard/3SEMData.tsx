/**
 * TAB3 - 清美教育集团SEM核心数据看板汇总
 *
 * 按神殿展示：SEM招生收入、招生数据、SEM转化率、SEM招生成本
 * 数据来源：
 *   - 财务数据(007) SEM分类 → 计划收入/实际收入/计划招生/实际招生/退费人数
 *   - 咨询量录入系统(SEM媒体来源) → 上门总量/电话量/咨询总量
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { App, Table, Spin, Button, Space } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { NoCopyContainer } from '@/components/common'
import { normalizeCampusName } from '@/utils/campusSort'
import * as financialApi from '@/pages/consult/004mgmt-data/007-financial-income/api'
import * as statsApi from '@/pages/consult/type-count-system/statsApi'

interface SEMDataRow {
  key: string
  序号: number | string
  神殿: string
  isTotal: boolean
  // 招生收入
  计划收入: number
  实际收入: number
  // 招生数据
  计划招生: number
  实际招生: number
  退费人数: number
  上门总量: number
  电话量: number
  咨询总量: number
  // SEM转化率
  报名转化率: string
  当面转化率: string
  上门率: string
  // SEM招生成本
  费用投入: number
  招生成本: string
}

interface Tab3Props {
  year: string
}

export default function Tab3SEMData({ year }: Tab3Props) {
  const { message } = App.useApp()
  const allCampuses = useCampusStore.getState().getAllCampuses()
  const campusList = useMemo(() => allCampuses.map(c => normalizeCampusName(c.name)), [allCampuses])
  const [loading, setLoading] = useState(false)

  const makeEmptyRow = (序号: number | string, campus: string, isTotal = false): SEMDataRow => ({
    key: campus,
    序号,
    神殿: campus,
    isTotal,
    计划收入: 0, 实际收入: 0,
    计划招生: 0, 实际招生: 0, 退费人数: 0,
    上门总量: 0, 电话量: 0, 咨询总量: 0,
    报名转化率: '#DIV/0!', 当面转化率: '#DIV/0!', 上门率: '#DIV/0!',
    费用投入: 0, 招生成本: '#DIV/0!',
  })

  const initialRows = useMemo(() => {
    const rows = campusList.map((c, idx) => makeEmptyRow(idx + 1, c, false))
    rows.push(makeEmptyRow('合计', '合计', true))
    return rows
  }, [campusList])

  const [rows, setRows] = useState<SEMDataRow[]>(initialRows)

  // 计算单行转化率
  const calculateRates = (row: SEMDataRow) => {
    if (row.咨询总量 > 0 && row.实际招生 > 0) {
      row.报名转化率 = ((row.实际招生 / row.咨询总量) * 100).toFixed(1) + '%'
    } else {
      row.报名转化率 = '#DIV/0!'
    }
    if (row.上门总量 > 0 && row.实际招生 > 0) {
      row.当面转化率 = ((row.实际招生 / row.上门总量) * 100).toFixed(1) + '%'
    } else {
      row.当面转化率 = '#DIV/0!'
    }
    if (row.咨询总量 > 0 && row.上门总量 > 0) {
      row.上门率 = ((row.上门总量 / row.咨询总量) * 100).toFixed(1) + '%'
    } else {
      row.上门率 = '#DIV/0!'
    }
    // 招生成本 = 费用投入 / 实际招生
    if (row.费用投入 > 0 && row.实际招生 > 0) {
      row.招生成本 = (row.费用投入 / row.实际招生).toFixed(0)
    } else {
      row.招生成本 = '#DIV/0!'
    }
  }

  // 重新计算合计行
  const recomputeTotal = (next: SEMDataRow[]): SEMDataRow[] => {
    const dataRows = next.filter(r => !r.isTotal)
    const totalRow = next.find(r => r.isTotal)
    if (!totalRow) return next

    const sumFields: (keyof SEMDataRow)[] = [
      '计划收入', '实际收入', '计划招生', '实际招生', '退费人数',
      '上门总量', '电话量', '咨询总量', '费用投入',
    ]

    sumFields.forEach(field => {
      const sum = dataRows.reduce((acc, r) => {
        const val = r[field]
        return acc + (typeof val === 'number' ? val : 0)
      }, 0)
      ;(totalRow as any)[field] = sum
    })

    calculateRates(totalRow)
    return next
  }

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const yearNum = parseInt(year)

      const [financialResult, consultStatsResult] = await Promise.all([
        financialApi.getMgntCoreSummaryAll({ year: yearNum }).catch(() => null),
        statsApi.getAllCampusYearlySummary({ 年份: yearNum, 分类: 'SEM' }).catch(() => null),
      ])

      setRows(prev => {
        const next = prev.map(r => ({
          ...makeEmptyRow(r.序号, r.神殿, r.isTotal),
        }))

        // 处理财务数据 - SEM分类
        if (financialResult?.分类数据) {
          const semData = financialResult.分类数据['SEM'] || []
          semData.forEach((item) => {
            const row = next.find(r => r.神殿 === item.神殿 && !r.isTotal)
            if (row) {
              row.计划收入 = Number(item.计划收入) || 0
              row.实际收入 = Number(item.实际收入) || 0
              row.计划招生 = Number(item.计划招生) || 0
              row.实际招生 = Number(item.实际招生) || 0
              row.退费人数 = Number(item.退费人数) || 0
            }
          })
        }

        // 处理咨询量统计数据(SEM)（含实际招生/退费/收入/电话量）
        if (consultStatsResult?.success && consultStatsResult.data) {
          const { 神殿数据 } = consultStatsResult.data
          神殿数据.forEach((item: any) => {
            const row = next.find(r => r.神殿 === item.神殿 && !r.isTotal)
            if (row) {
              row.咨询总量 = item.咨询总量 || 0
              row.上门总量 = item.上门量 || 0
              row.电话量 = item.电话量 || 0
              row.实际招生 = (row.实际招生 || 0) + (item.报名量 || 0)
              row.退费人数 = (row.退费人数 || 0) + (item.退费人数 || 0)
              row.实际收入 = (row.实际收入 || 0) + (item.实际收入 || 0)
            }
          })
        }

        // 计算每行转化率
        next.filter(r => !r.isTotal).forEach(calculateRates)

        return recomputeTotal(next)
      })
    } catch (error) {
      console.error('加载SEM数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    loadData()
  }, [loadData])

  const renderValue = (val: number | string, isTotal: boolean, color = '#1890ff') => {
    const isError = typeof val === 'string' && val.includes('#DIV/0!')
    if (isTotal) {
      return <strong style={{ color: isError ? '#999' : color }}>{isError ? '#DIV/0!' : val}</strong>
    }
    return <span style={{ color: isError ? '#999' : '#666' }}>{val}</span>
  }

  const columns = [
    {
      title: '序号',
      dataIndex: '序号',
      width: 50,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (val: number | string, r: SEMDataRow) =>
        r.isTotal ? <strong style={{ color: '#ff4d4f' }}>{''}</strong> : val,
    },
    {
      title: '神殿',
      dataIndex: '神殿',
      width: 80,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (val: string, r: SEMDataRow) =>
        r.isTotal ? <strong style={{ color: '#ff4d4f' }}>{val}</strong> : val,
    },
    {
      title: '招生收入',
      onHeaderCell: () => ({ style: { background: '#90EE90' } }),
      children: [
        { title: '计划收入', width: 100, align: 'center' as const, render: (_: any, r: SEMDataRow) => renderValue(r.计划收入, r.isTotal) },
        { title: '实际收入', width: 100, align: 'center' as const, render: (_: any, r: SEMDataRow) => renderValue(r.实际收入, r.isTotal) },
      ],
    },
    {
      title: '招生数据',
      onHeaderCell: () => ({ style: { background: '#90EE90' } }),
      children: [
        { title: '计划招生', width: 80, align: 'center' as const, render: (_: any, r: SEMDataRow) => renderValue(r.计划招生, r.isTotal) },
        { title: '实际招生', width: 80, align: 'center' as const, render: (_: any, r: SEMDataRow) => renderValue(r.实际招生, r.isTotal) },
        { title: '退费人数', width: 80, align: 'center' as const, render: (_: any, r: SEMDataRow) => renderValue(r.退费人数, r.isTotal) },
        { title: '上门总量', width: 80, align: 'center' as const, render: (_: any, r: SEMDataRow) => renderValue(r.上门总量, r.isTotal) },
        { title: '电话量', width: 80, align: 'center' as const, render: (_: any, r: SEMDataRow) => renderValue(r.电话量, r.isTotal) },
        { title: '咨询总量', width: 80, align: 'center' as const, render: (_: any, r: SEMDataRow) => renderValue(r.咨询总量, r.isTotal) },
      ],
    },
    {
      title: 'SEM转化率',
      onHeaderCell: () => ({ style: { background: '#90EE90' } }),
      children: [
        { title: '报名转化率', width: 90, align: 'center' as const, render: (_: any, r: SEMDataRow) => renderValue(r.报名转化率, r.isTotal, '#fa8c16') },
        { title: '当面转化率', width: 90, align: 'center' as const, render: (_: any, r: SEMDataRow) => renderValue(r.当面转化率, r.isTotal, '#fa8c16') },
        { title: '上门率', width: 80, align: 'center' as const, render: (_: any, r: SEMDataRow) => renderValue(r.上门率, r.isTotal, '#fa8c16') },
      ],
    },
    {
      title: 'SEM招生成本',
      onHeaderCell: () => ({ style: { background: '#90EE90' } }),
      children: [
        { title: '费用投入', width: 90, align: 'center' as const, render: (_: any, r: SEMDataRow) => renderValue(r.费用投入, r.isTotal) },
        { title: '招生成本', width: 90, align: 'center' as const, render: (_: any, r: SEMDataRow) => renderValue(r.招生成本, r.isTotal, '#ff4d4f') },
      ],
    },
  ]

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <Spin spinning={loading}>
        <div>
          <div style={{
            background: '#90EE90',
            padding: '8px 16px',
            fontWeight: 'bold',
            marginBottom: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>清美教育集团{year}年度SEM核心数据看板汇总</span>
            <Space>
              <span style={{ fontSize: 12, color: '#666', fontWeight: 'normal' }}>
                💡 数据自动从财务(SEM分类)和咨询量系统获取
              </span>
              <Button icon={<ReloadOutlined />} size="small" onClick={loadData}>刷新数据</Button>
            </Space>
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
            .total-row { background-color: #e6f7ff; }
            .total-row td { background-color: #e6f7ff !important; }
          `}</style>
        </div>
      </Spin>
    </NoCopyContainer>
  )
}
