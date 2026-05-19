/**
 * 年度免费推广数据核心数据看板
 * 自动从后端获取免费推广分类数据并计算转化率
 */

import React, { useState, useEffect, useCallback } from 'react'
import { App, Table, Spin, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { NoCopyContainer } from '@/components/common'
import * as statsApi from '@/pages/consult/type-count-system/statsApi'
import { getFreePromotionPlanCost } from '@/services/consult/marketCost'
import api from '@/services/api'

interface FreePromotionRow {
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
  咨询总量: number | null
  电话量: number | null
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

export default function FreePromotionDashboard({ year, campus = '盛邦' }: Props) {
  const { message } = App.useApp()
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<FreePromotionRow[]>([])

  const makeEmptyRow = (月份: number | string, isTotal = false): FreePromotionRow => ({
    key: String(月份),
    月份,
    神殿: isTotal ? '' : campus,
    isTotal,
    计划收入: null, 实际收入: null,
    计划招生: null, 实际招生: null, 退费人数: null, 上门总量: null, 咨询总量: null, 电话量: null,
    报名转化率: '-', 当面转化率: '-', 上门率: '-',
    费用投入: null, 招生成本: '-',
  })

  const calculateRates = (row: FreePromotionRow) => {
    if (row.咨询总量 && row.咨询总量 > 0 && row.实际招生 !== null) {
      row.报名转化率 = ((row.实际招生 / row.咨询总量) * 100).toFixed(2) + '%'
    } else if (row.咨询总量 === 0 || row.咨询总量 === null) {
      row.报名转化率 = row.实际招生 ? '#DIV/0!' : '-'
    } else { row.报名转化率 = '-' }
    
    if (row.上门总量 && row.上门总量 > 0 && row.实际招生 !== null) {
      row.当面转化率 = ((row.实际招生 / row.上门总量) * 100).toFixed(2) + '%'
    } else if (row.上门总量 === 0 || row.上门总量 === null) {
      row.当面转化率 = row.实际招生 ? '#DIV/0!' : '-'
    } else { row.当面转化率 = '-' }
    
    if (row.咨询总量 && row.咨询总量 > 0 && row.上门总量 !== null) {
      row.上门率 = ((row.上门总量 / row.咨询总量) * 100).toFixed(2) + '%'
    } else if (row.咨询总量 === 0 || row.咨询总量 === null) {
      row.上门率 = row.上门总量 ? '#DIV/0!' : '-'
    } else { row.上门率 = '-' }

    if (row.实际招生 && row.实际招生 > 0 && row.费用投入 !== null) {
      row.招生成本 = (row.费用投入 / row.实际招生).toFixed(2)
    } else if (row.实际招生 === 0 || row.实际招生 === null) {
      row.招生成本 = row.费用投入 ? '#DIV/0!' : '-'
    } else { row.招生成本 = '-' }
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const yearNum = parseInt(year)

      // 并行获取咨询量统计数据、月度详细计划数据和免费推广成本数据
      const [planData, result, costData] = await Promise.all([
        // 从市场部月度详细计划获取免费推广计划数据
        api.get('/market/monthly-plan/free-promotion/list', {
          params: { year: yearNum, campus }
        }).then(res => {
          if (res.data?.code === 0 && res.data?.data) {
            return res.data.data
          }
          return null
        }).catch((err) => {
          console.error('获取免费推广计划数据失败:', err)
          return null
        }),
        statsApi.getMonthlyCampusSummary({ 年份: yearNum, 神殿: campus, 分类: '免费推广' }).catch(() => null),
        getFreePromotionPlanCost(campus, yearNum).catch(() => ({})),
      ])

      // 按月索引计划数据（从市场部月度详细计划）
      const planByMonth: Record<number, { 计划收入: number; 计划招生: number }> = {}
      if (planData && typeof planData === 'object') {
        Object.entries(planData).forEach(([monthStr, monthData]: [string, any]) => {
          const month = parseInt(monthStr)
          if (month > 0 && month <= 12 && monthData && typeof monthData === 'object') {
            // 支持中英文字段名
            const planIncome = Number(monthData.plan_income || monthData.计划收入 || 0)
            const planEnroll = Number(monthData.plan_enrollment || monthData.计划招生 || 0)
            planByMonth[month] = { 计划收入: planIncome, 计划招生: planEnroll }
          }
        })
      }

      const dataRows: FreePromotionRow[] = months.map(m => {
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
        // 从市场部获取免费推广费用投入 (plan_cost)
        const monthlyCost = costData[m]
        if (monthlyCost && monthlyCost.plan_cost > 0) {
          row.费用投入 = monthlyCost.plan_cost
        }
        calculateRates(row)
        return row
      })

      const totalRow = makeEmptyRow('合计', true)
      const sumFields: (keyof FreePromotionRow)[] = ['计划收入', '实际收入', '计划招生', '实际招生', '退费人数', '上门总量', '咨询总量', '电话量', '费用投入']
      sumFields.forEach(field => {
        const sum = dataRows.reduce((acc, r) => acc + ((r[field] as number) || 0), 0)
        ;(totalRow as any)[field] = sum || null
      })
      calculateRates(totalRow)
      dataRows.push(totalRow)

      setRows(dataRows)
    } catch (error) {
      console.error('加载免费推广数据失败:', error)
      message.error('加载免费推广数据失败')
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
    if (val === '#DIV/0!' || val === '-') {
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
      render: (val: number | string, r: FreePromotionRow) =>
        r.isTotal ? <strong style={{ color: '#ff4d4f' }}>{val}</strong> : val,
    },
    { title: '神殿', dataIndex: '神殿', width: 80, fixed: 'left' as const, align: 'center' as const },
    {
      title: '招生收入',
      children: [
        { title: '计划收入', dataIndex: '计划收入', width: 100, align: 'center' as const,
          render: (val: number | null, r: FreePromotionRow) => r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val) },
        { title: '实际收入', dataIndex: '实际收入', width: 100, align: 'center' as const,
          render: (val: number | null, r: FreePromotionRow) => r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val) },
      ],
    },
    {
      title: '招生数据',
      children: [
        { title: '计划招生', dataIndex: '计划招生', width: 90, align: 'center' as const,
          render: (val: number | null, r: FreePromotionRow) => r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val) },
        { title: '实际招生', dataIndex: '实际招生', width: 90, align: 'center' as const,
          render: (val: number | null, r: FreePromotionRow) => r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val) },
        { title: '退费人数', dataIndex: '退费人数', width: 90, align: 'center' as const,
          render: (val: number | null, r: FreePromotionRow) => r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val) },
        { title: '上门总量', dataIndex: '上门总量', width: 90, align: 'center' as const,
          render: (val: number | null, r: FreePromotionRow) => r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val) },
        { title: '电话量', dataIndex: '电话量', width: 80, align: 'center' as const,
          render: (val: number | null, r: FreePromotionRow) => r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val) },
        { title: '咨询总量', dataIndex: '咨询总量', width: 90, align: 'center' as const,
          render: (val: number | null, r: FreePromotionRow) => r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val) },
      ],
    },
    {
      title: '免费推广转化率',
      children: [
        { title: '报名转化率', width: 110, dataIndex: '报名转化率', align: 'center' as const, render: (val: string, r: FreePromotionRow) => renderRate(val, r.isTotal) },
        { title: '当面转化率', width: 110, dataIndex: '当面转化率', align: 'center' as const, render: (val: string, r: FreePromotionRow) => renderRate(val, r.isTotal) },
        { title: '上门率', width: 90, dataIndex: '上门率', align: 'center' as const, render: (val: string, r: FreePromotionRow) => renderRate(val, r.isTotal) },
      ],
    },
    {
      title: '免费推广招生成本',
      children: [
        { title: '费用投入', dataIndex: '费用投入', width: 100, align: 'center' as const,
          render: (val: number | null, r: FreePromotionRow) => r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val) },
        { title: '招生成本', dataIndex: '招生成本', width: 100, align: 'center' as const,
          render: (val: string, r: FreePromotionRow) => renderRate(val, r.isTotal) },
      ],
    },
  ]

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <Spin spinning={loading}>
        <div>
          <div style={{ 
            background: '#FFB6C1', 
            padding: '8px 16px', 
            fontWeight: 'bold', 
            marginBottom: 8,
            fontSize: '14px',
            color: '#000',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{campus}{year}年度免费推广数据核心数据看板</span>
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

