/**
 * 神殿核心数据 - SEM数据月度核心数据看板
 * 自动从后端获取SEM分类数据并计算转化率
 * 
 * 功能：
 * 1. 费用投入 = SEM咨询量成本（从市场部获取）× 咨询总量
 */

import React, { useState, useEffect, useCallback } from 'react'
import { App, Table, Spin, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { NoCopyContainer } from '@/components/common'
import * as statsApi from '@/pages/consult/type-count-system/statsApi'
import { getSEMCostSummary } from '@/services/consult/marketCost'
import api from '@/services/api'

interface MonthlyDataRow {
  key: string
  月份: number | string
  神殿: string
  isTotal: boolean
  计划收入: number | null
  实际收入: number | null
  计划招生: number | null
  实际招生: number | null
  退费人数: number | null
  上门总量: number | null
  电话量: number | null
  咨询总量: number | null
  报名转化率: string
  当面转化率: string
  上门率: string
  费用投入: number | null
  招生成本: string
}

interface Props {
  year: string
  campus?: string
}

export default function SEMDataDashboard({ year, campus = '盛邦' }: Props) {
  const { message } = App.useApp()
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<MonthlyDataRow[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [marketCostByMonth, setMarketCostByMonth] = useState<Map<number, number>>(new Map())

  const makeEmptyRow = (月份: number | string, isTotal = false): MonthlyDataRow => ({
    key: String(月份),
    月份,
    神殿: isTotal ? '' : campus,
    isTotal,
    计划收入: null, 实际收入: null,
    计划招生: null, 实际招生: null, 退费人数: null, 上门总量: null, 电话量: null, 咨询总量: null,
    报名转化率: '-', 当面转化率: '-', 上门率: '-',
    费用投入: null, 招生成本: '-',
  })

  const calculateRates = (row: MonthlyDataRow) => {
    // 报名转化率 = 实际招生 / 咨询总量
    if (row.咨询总量 && row.咨询总量 > 0 && row.实际招生 && row.实际招生 > 0) {
      row.报名转化率 = ((row.实际招生 / row.咨询总量) * 100).toFixed(2) + '%'
    } else { row.报名转化率 = '-' }
    // 当面转化率 = 实际招生 / 上门总量
    if (row.上门总量 && row.上门总量 > 0 && row.实际招生 && row.实际招生 > 0) {
      row.当面转化率 = ((row.实际招生 / row.上门总量) * 100).toFixed(2) + '%'
    } else { row.当面转化率 = '-' }
    // 上门率 = 上门总量 / 咨询总量
    if (row.咨询总量 && row.咨询总量 > 0 && row.上门总量 && row.上门总量 > 0) {
      row.上门率 = ((row.上门总量 / row.咨询总量) * 100).toFixed(2) + '%'
    } else { row.上门率 = '-' }
    // 招生成本 = 费用投入 / 实际招生
    if (row.实际招生 && row.实际招生 > 0 && row.费用投入 && row.费用投入 > 0) {
      row.招生成本 = (row.费用投入 / row.实际招生).toFixed(2)
    } else { row.招生成本 = '-' }
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const yearNum = parseInt(year)

      // 并行获取咨询量统计数据、年度网络计划数据和SEM成本数据
      const [networkPlanData, result, semCostData] = await Promise.all([
        // 从年度网络计划表获取SEM计划数据
        api.get('/market/network-plan', { params: { year: yearNum, campus } })
          .then(res => Array.isArray(res.data) ? res.data : null)
          .catch(() => null),
        statsApi.getMonthlyCampusSummary({ 年份: yearNum, 神殿: campus, 分类: 'SEM' }).catch(() => null),
        // 获取SEM咨询量成本（从市场部获取）
        getSEMCostSummary(campus, yearNum).catch((err) => {
          console.error('获取SEM成本数据失败:', err)
          return {}
        }),
      ])

      // 按月索引SEM计划数据（从年度网络计划表）
      const planByMonth: Record<number, { 计划收入: number; 计划招生: number }> = {}
      if (networkPlanData && Array.isArray(networkPlanData)) {
        networkPlanData.forEach((monthRow: any) => {
          const month = monthRow.month
          // 排除总计行（month=0）
          if (month > 0) {
            const planIncome = Number(monthRow.sem_plan_income || 0)
            const planEnroll = Number(monthRow.sem_plan_signup || 0)
            planByMonth[month] = { 
              计划收入: isNaN(planIncome) ? 0 : planIncome, 
              计划招生: isNaN(planEnroll) ? 0 : planEnroll 
            }
          }
        })
      }

      // 处理SEM咨询量成本数据
      const costMap = new Map<number, number>()
      if (semCostData) {
        Object.entries(semCostData).forEach(([month, data]: [string, any]) => {
          const monthNum = parseInt(month)
          const consultCost = data.consult_cost || 0
          costMap.set(monthNum, consultCost)
        })
      }
      setMarketCostByMonth(costMap)

      const dataRows: MonthlyDataRow[] = months.map(m => {
        const row = makeEmptyRow(m, false)
        // 计划数据
        if (planByMonth[m]) {
          row.计划收入 = planByMonth[m].计划收入 || null
          row.计划招生 = planByMonth[m].计划招生 || null
        }
        // 实际数据
        if (result?.success && result.data?.月度数据) {
          const monthData = result.data.月度数据.find((d: any) => d.月份 === m)
          if (monthData) {
            row.实际收入 = monthData.实际收入 || null
            row.实际招生 = monthData.报名量 || null
            row.退费人数 = monthData.退费人数 || null
            row.上门总量 = monthData.上门量 || null
            row.电话量 = monthData.电话量 || null
            row.咨询总量 = monthData.咨询总量 || null
          }
        }
        
        // 费用投入 = SEM咨询量成本 × 咨询总量
        const consultCost = costMap.get(m) || 0
        if (consultCost > 0 && row.咨询总量 && row.咨询总量 > 0) {
          row.费用投入 = Math.round(consultCost * row.咨询总量)
        }
        
        calculateRates(row)
        return row
      })

      // 合计行
      const totalRow = makeEmptyRow('合计', true)
      const sumFields: (keyof MonthlyDataRow)[] = ['计划收入', '实际收入', '计划招生', '实际招生', '退费人数', '上门总量', '电话量', '咨询总量', '费用投入']
      sumFields.forEach(field => {
        const sum = dataRows.reduce((acc, r) => {
          const val = r[field] as number
          // 确保val是数字类型
          const numVal = typeof val === 'number' ? val : (val ? Number(val) : 0)
          return acc + (isNaN(numVal) ? 0 : numVal)
        }, 0)
        ;(totalRow as any)[field] = sum > 0 ? sum : null
      })
      calculateRates(totalRow)
      dataRows.push(totalRow)

      setRows(dataRows)
    } catch (error) {
      console.error('加载SEM数据失败:', error)
      message.error('加载SEM数据失败')
      const emptyRows = months.map(m => makeEmptyRow(m, false))
      emptyRows.push(makeEmptyRow('合计', true))
      setRows(emptyRows)
    } finally {
      setLoading(false)
    }
  }, [year, campus])

  useEffect(() => {
    loadData()
  }, [loadData])

  const renderValue = (value: number | null | string) => {
    if (value === null || value === undefined) return ''
    return value
  }

  const renderRate = (val: string, isTotal: boolean = false) => {
    if (val === '#DIV/0!' || val === '#REF!' || val === '-') {
      return <span style={{ color: '#999' }}>{val}</span>
    }
    return <span style={{ color: '#52c41a', fontWeight: isTotal ? 'bold' as const : 'normal' as const }}>{val}</span>
  }

  const columns = [
    {
      title: '月份',
      dataIndex: '月份',
      width: 60,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (val: number | string, r: MonthlyDataRow) =>
        r.isTotal ? <strong style={{ color: '#ff4d4f' }}>{val}</strong> : val,
    },
    { title: '神殿', dataIndex: '神殿', width: 80, fixed: 'left' as const, align: 'center' as const },
    {
      title: '招生收入',
      children: [
        { title: '计划收入', dataIndex: '计划收入', width: 100, align: 'center' as const,
          render: (val: number | null, r: MonthlyDataRow) => r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val) },
        { title: '实际收入', dataIndex: '实际收入', width: 100, align: 'center' as const,
          render: (val: number | null, r: MonthlyDataRow) => r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val) },
      ],
    },
    {
      title: '招生数据',
      children: [
        { title: '计划招生', dataIndex: '计划招生', width: 90, align: 'center' as const,
          render: (val: number | null, r: MonthlyDataRow) => r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val) },
        { title: '实际招生', dataIndex: '实际招生', width: 90, align: 'center' as const,
          render: (val: number | null, r: MonthlyDataRow) => r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val) },
        { title: '退费人数', dataIndex: '退费人数', width: 90, align: 'center' as const,
          render: (val: number | null, r: MonthlyDataRow) => r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val) },
        { title: '上门总量', dataIndex: '上门总量', width: 90, align: 'center' as const,
          render: (val: number | null, r: MonthlyDataRow) => r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val) },
        { title: '电话量', dataIndex: '电话量', width: 80, align: 'center' as const,
          render: (val: number | null, r: MonthlyDataRow) => r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val) },
        { title: '咨询总量', dataIndex: '咨询总量', width: 90, align: 'center' as const,
          render: (val: number | null, r: MonthlyDataRow) => r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val) },
      ],
    },
    {
      title: 'SEM转化率',
      children: [
        { title: '报名转化率', width: 110, dataIndex: '报名转化率', align: 'center' as const, render: (val: string, r: MonthlyDataRow) => renderRate(val, r.isTotal) },
        { title: '当面转化率', width: 110, dataIndex: '当面转化率', align: 'center' as const, render: (val: string, r: MonthlyDataRow) => renderRate(val, r.isTotal) },
        { title: '上门率', width: 90, dataIndex: '上门率', align: 'center' as const, render: (val: string, r: MonthlyDataRow) => renderRate(val, r.isTotal) },
      ],
    },
    {
      title: 'SEM招生成本',
      children: [
        { title: '费用投入', dataIndex: '费用投入', width: 100, align: 'center' as const,
          render: (val: number | null, r: MonthlyDataRow) => r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val) },
        { title: '招生成本', dataIndex: '招生成本', width: 100, align: 'center' as const,
          render: (val: string, r: MonthlyDataRow) => renderRate(val, r.isTotal) },
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
            fontSize: '14px',
            color: '#000',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{campus}{year}年度SEM数据核心数据看板</span>
            <Button 
              icon={<ReloadOutlined />} 
              size="small" 
              onClick={loadData}
            >
              刷新数据
            </Button>
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
            .total-row { background-color: #e6f7ff; }
            .total-row td { background-color: #e6f7ff !important; font-weight: bold; }
          `}</style>
        </div>
      </Spin>
    </NoCopyContainer>
  )
}
