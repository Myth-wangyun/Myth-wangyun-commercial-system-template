/**
 * 盛邦年度合作伙伴数据核心数据看板
 * 按月份展示合作伙伴完整数据
 * 
 * 功能：
 * 1. 计划收入和计划招生从月度详细计划获取
 * 2. 从咨询量部分获取实际数据（实际招生、上门量、咨询量等）
 * 3. 合作伙伴投入 = 市场部咨询成本（从市场合作伙伴日度数据汇总）
 * 4. 月度数据表从月度详细计划和咨询量统计汇总
 */

import React, { useState, useEffect, useCallback } from 'react'
import { App, Table, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { NoCopyContainer } from '@/components/common'
import api from '@/services/api'
import * as statsApi from '@/pages/consult/type-count-system/statsApi'
import { networkPartnerAnnualService } from '@/services/market/networkPartnerAnnual'

// ==================== 类型定义 ====================

interface PartnershipDataRow {
  key: string
  序号: number | string
  神殿: string
  isTotal: boolean
  // 招生收入
  计划收入: number | null
  实际收入: number | null
  // 招生数据
  计划招生: number | null
  实际招生: number | null
  退费人数: number | null
  上门总量: number | null
  咨询总量: number | null
  电话量: number | null
  // 合作伙伴转化率
  总转: string
  当面转化: string
  电转门: string
  // 合作伙伴招生成本
  合作伙伴投入: number | null
  招生成本: number | null
}

interface Props {
  year: string
  campus?: string
}

// ==================== 辅助函数 ====================

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

// 计算转化率
const calculateRates = (row: PartnershipDataRow) => {
  // 总转 = 实际招生 / 咨询总量
  if (row.咨询总量 && row.咨询总量 > 0 && row.实际招生 !== null) {
    row.总转 = ((row.实际招生 / row.咨询总量) * 100).toFixed(2) + '%'
  } else {
    row.总转 = '0%'
  }
  
  // 当面转化 = 实际招生 / 上门总量
  if (row.上门总量 && row.上门总量 > 0 && row.实际招生 !== null) {
    row.当面转化 = ((row.实际招生 / row.上门总量) * 100).toFixed(2) + '%'
  } else {
    row.当面转化 = '0%'
  }
  
  // 电转门 = 上门总量 / 咨询总量
  if (row.咨询总量 && row.咨询总量 > 0 && row.上门总量 !== null) {
    row.电转门 = ((row.上门总量 / row.咨询总量) * 100).toFixed(2) + '%'
  } else {
    row.电转门 = '0%'
  }
}

// 渲染数值
const renderValue = (value: number | null | undefined, isTotal: boolean, color = '#1890ff') => {
  if (value === null || value === undefined) return <span style={{ color: '#999' }}>0</span>
  if (value === 0) return <span style={{ color: '#999' }}>0</span>
  if (isTotal) {
    return <strong style={{ color }}>{value.toLocaleString()}</strong>
  }
  return <span>{value.toLocaleString()}</span>
}

// 渲染转化率
const renderRate = (val: string, isTotal: boolean) => {
  if (val === '0%' || val === '0.00%') {
    return <span style={{ color: '#999' }}>{val}</span>
  }
  const style = { color: '#52c41a', fontWeight: isTotal ? 'bold' as const : 'normal' as const }
  return <span style={style}>{val}</span>
}

// ==================== 主组件 ====================

export default function PartnershipDashboard({ year, campus = '盛邦' }: Props) {
  const { notification } = App.useApp()
  const [loading, setLoading] = useState(false)
  
  // 用于防止竞态条件 - 只有最新的请求才能更新状态
  const loadIdRef = React.useRef(0)
  // 月度数据（主表格）
  const [monthlyRows, setMonthlyRows] = useState<PartnershipDataRow[]>([])

  // 创建空的月度行
  const makeEmptyRow = (序号: number | string, isTotal = false, campusName = campus): PartnershipDataRow => ({
    key: String(序号),
    序号,
    神殿: isTotal ? '' : campusName,
    isTotal,
    计划收入: null,
    实际收入: null,
    计划招生: null,
    实际招生: null,
    退费人数: null,
    上门总量: null,
    咨询总量: null,
    电话量: null,
    总转: '0%',
    当面转化: '0%',
    电转门: '0%',
    合作伙伴投入: null,
    招生成本: null,
  })

  // 加载数据
  const loadData = useCallback(async (currentLoadId: number) => {
    // 判断是否为最新请求的辅助函数
    const isStale = () => loadIdRef.current !== currentLoadId
    
    setLoading(true)
    try {
      const yearNum = parseInt(year)
      
      // 合作伙伴的媒体来源列表（这些媒体来源在数据库中的量来源字段是"网络"）
      const 合作伙伴媒体来源列表 = '百教网,91搜客,知了好学,坦途网,厚学网'
      
      const [
        partnerPlanData,
        monthlyCampusData,
        partnerCostData
      ] = await Promise.all([
        // 从月度详细计划获取网络合作伙伴计划数据
        api.get('/market/monthly-plan/network-partner/detail/list', {
          params: { year: yearNum, campus }
        }).then(res => {
          if (res.data?.code === 0 && res.data?.data) {
            return res.data.data
          }
          return null
        }).catch(() => null),
        // 月度神殿汇总数据（从咨询量明细表）
        statsApi.getMonthlyCampusSummary({
          年份: yearNum,
          神殿: campus,
          数据类型: '网络',  // ⚠️ 重要：量来源字段值是"网络"，不是"合作伙伴"
          媒体来源: 合作伙伴媒体来源列表,  // 通过媒体来源筛选出合作伙伴的数据
        }).catch(() => null),
        // 市场部合作伙伴成本数据
        networkPartnerAnnualService.getDashboard(campus, year).catch(() => ({ data: {} })),
      ])

      // 构建计划数据映射（从月度详细计划，按月汇总所有合作伙伴）
      const planByMonth: Record<number, { 计划收入: number; 计划招生: number }> = {}
      if (partnerPlanData) {
        // partnerPlanData 格式: { 1: { 百教网: {...}, 知了好学: {...}, ... }, 2: {...}, ... }
        Object.entries(partnerPlanData).forEach(([monthStr, partnerData]: [string, any]) => {
          const month = parseInt(monthStr)
          if (isNaN(month) || !partnerData) return
          
          let monthPlanIncome = 0
          let monthPlanEnroll = 0
          
          // 汇总该月所有合作伙伴的计划数据
          Object.values(partnerData).forEach((data: any) => {
            monthPlanIncome += data.plan_income || 0
            monthPlanEnroll += data.plan_enrollment || 0
          })
          
          planByMonth[month] = {
            计划收入: monthPlanIncome,
            计划招生: monthPlanEnroll,
          }
        })
      }

      // 处理市场成本数据 - 计算咨询量成本 = 实际消费 / 实际咨询量
      const costMap = new Map<number, number>()
      if (partnerCostData?.data) {
        Object.entries(partnerCostData.data).forEach(([month, data]: [string, any]) => {
          const monthNum = parseInt(month)
          // 咨询量成本 = 实际消费 / 实际咨询量
          const actualCost = data.actual_cost || 0
          const actualConsultVolume = data.actual_consult_volume || 0
          const consultCost = actualConsultVolume > 0 ? actualCost / actualConsultVolume : 0
          costMap.set(monthNum, consultCost)
        })
      }

      // ========== 生成月度数据表 ==========
      const monthlyData: PartnershipDataRow[] = MONTHS.map(m => {
        const row = makeEmptyRow(m, false)
        
        // 从API获取月度实际数据
        if (monthlyCampusData?.success && monthlyCampusData.data?.月度数据) {
          const monthStats = monthlyCampusData.data.月度数据.find((item: any) => item.月份 === m)
          if (monthStats) {
            row.实际招生 = monthStats.报名量 ?? null
            row.实际收入 = monthStats.实际收入 ?? null
            row.退费人数 = monthStats.退费人数 ?? null
            row.上门总量 = monthStats.上门量 ?? null
            row.咨询总量 = monthStats.咨询总量 ?? null
            row.电话量 = monthStats.电话量 ?? monthStats.咨询总量 ?? null
          }
        }
        
        // 合作伙伴投入 = 咨询量成本 × 咨询总量
        const consultCost = costMap.get(m) || 0
        if (consultCost > 0 && row.咨询总量 && row.咨询总量 > 0) {
          row.合作伙伴投入 = Math.round(consultCost * row.咨询总量)
        }
        
        // 从月度详细计划获取本月的计划数据
        const monthPlan = planByMonth[m]
        if (monthPlan) {
          row.计划收入 = monthPlan.计划收入 || null
          row.计划招生 = monthPlan.计划招生 || null
        }

        // 计算招生成本 = 合作伙伴投入 / 实际招生
        if (row.合作伙伴投入 && row.实际招生 && row.实际招生 > 0) {
          row.招生成本 = Math.round(row.合作伙伴投入 / row.实际招生)
        }
        
        calculateRates(row)
        return row
      })
      
      // 添加合计行
      const totalRow = makeEmptyRow('合计', true)
      const sumFields: (keyof PartnershipDataRow)[] = [
        '计划收入', '实际收入', '计划招生', '实际招生', '退费人数',
        '上门总量', '咨询总量', '电话量', '合作伙伴投入'
      ]
      sumFields.forEach(field => {
        const sum = monthlyData.reduce((acc, r) => acc + ((r[field] as number) || 0), 0)
        ;(totalRow as any)[field] = sum || null
      })
      // 合计行的招生成本
      if (totalRow.合作伙伴投入 && totalRow.实际招生 && totalRow.实际招生 > 0) {
        totalRow.招生成本 = Math.round(totalRow.合作伙伴投入 / totalRow.实际招生)
      }
      calculateRates(totalRow)
      monthlyData.push(totalRow)
      
      // 检查是否已过期（有更新的请求发出）
      if (isStale()) return
      setMonthlyRows(monthlyData)
      
    } catch (error) {
      if (!isStale()) {
        console.error('加载合作伙伴数据失败:', error)
        notification.error({ message: '加载失败', description: '加载数据失败', placement: 'topRight' })
      }
    } finally {
      if (!isStale()) {
        setLoading(false)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, campus])

  // 只在 year 或 campus 变化时加载数据
  useEffect(() => {
    const id = ++loadIdRef.current
    loadData(id)
    // cleanup 不需要做任何事 - isStale() 会自动处理
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, campus])

  // ==================== 表格列定义 ====================
  // 月度数据表列（神殿汇总表）
  const monthlyColumns: ColumnsType<PartnershipDataRow> = [
    {
      title: '序号',
      dataIndex: '序号',
      width: 60,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (val: number | string, r: PartnershipDataRow) =>
        r.isTotal ? <strong style={{ color: '#ff4d4f' }}>{val}</strong> : val,
    },
    {
      title: '神殿',
      dataIndex: '神殿',
      width: 80,
      fixed: 'left' as const,
      align: 'center' as const,
    },
    {
      title: '招生收入',
      children: [
        { 
          title: '计划收入', 
          dataIndex: '计划收入',
          width: 100, 
          align: 'center' as const,
          render: (v: number | null, r: PartnershipDataRow) => renderValue(v, r.isTotal)
        },
        { 
          title: '实际收入', 
          dataIndex: '实际收入',
          width: 100, 
          align: 'center' as const,
          render: (v: number | null, r: PartnershipDataRow) => renderValue(v, r.isTotal)
        },
      ],
    },
    {
      title: '招生数据',
      children: [
        { 
          title: '计划招生', 
          dataIndex: '计划招生',
          width: 80, 
          align: 'center' as const,
          render: (v: number | null, r: PartnershipDataRow) => renderValue(v, r.isTotal)
        },
        { 
          title: '实际招生', 
          dataIndex: '实际招生',
          width: 80, 
          align: 'center' as const,
          render: (v: number | null, r: PartnershipDataRow) => renderValue(v, r.isTotal)
        },
        { 
          title: '退费人数', 
          dataIndex: '退费人数',
          width: 80, 
          align: 'center' as const,
          render: (v: number | null, r: PartnershipDataRow) => renderValue(v, r.isTotal)
        },
        { 
          title: '上门总量', 
          dataIndex: '上门总量',
          width: 80, 
          align: 'center' as const,
          render: (v: number | null, r: PartnershipDataRow) => renderValue(v, r.isTotal)
        },
        { 
          title: '电话量', 
          dataIndex: '电话量',
          width: 80, 
          align: 'center' as const,
          render: (v: number | null, r: PartnershipDataRow) => renderValue(v, r.isTotal)
        },
        { 
          title: '咨询总量', 
          dataIndex: '咨询总量',
          width: 80, 
          align: 'center' as const,
          render: (v: number | null, r: PartnershipDataRow) => renderValue(v, r.isTotal)
        },
      ],
    },
    {
      title: '合作伙伴转化率',
      children: [
        { 
          title: '报名转化率', 
          dataIndex: '总转', 
          width: 100, 
          align: 'center' as const,
          render: (v: string, r: PartnershipDataRow) => renderRate(v, r.isTotal)
        },
        { 
          title: '当面转化率', 
          dataIndex: '当面转化', 
          width: 100, 
          align: 'center' as const,
          render: (v: string, r: PartnershipDataRow) => renderRate(v, r.isTotal)
        },
        { 
          title: '上门率', 
          dataIndex: '电转门', 
          width: 80, 
          align: 'center' as const,
          render: (v: string, r: PartnershipDataRow) => renderRate(v, r.isTotal)
        },
      ],
    },
    {
      title: '合作伙伴招生成本',
      children: [
        { 
          title: '费用投入', 
          dataIndex: '合作伙伴投入',
          width: 90, 
          align: 'center' as const,
          render: (v: number | null, r: PartnershipDataRow) => renderValue(v, r.isTotal, '#f5222d')
        },
        { 
          title: '招生成本', 
          dataIndex: '招生成本',
          width: 90, 
          align: 'center' as const,
          render: (v: number | null, r: PartnershipDataRow) => renderValue(v, r.isTotal)
        },
      ],
    },
  ]

  return (
    <Spin spinning={loading}>
      <NoCopyContainer warningMessage="祈福司门数据禁止复制">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* 月度数据表 */}
          <div>
            <div style={{ 
              background: '#9370DB', 
              padding: '8px 16px', 
              fontWeight: 'bold', 
              marginBottom: 8,
              fontSize: '14px',
              color: 'white'
            }}>
              {campus}{year}年度合作伙伴数据核心数据看板
            </div>
            <Table
              columns={monthlyColumns}
              dataSource={monthlyRows}
              pagination={false}
              bordered
              size="small"
              scroll={{ x: 1400 }}
              rowClassName={r => (r.isTotal ? 'total-row' : '')}
            />
          </div>
          
          <style>{`
            .total-row { background-color: #e6f7ff; }
            .total-row td { background-color: #e6f7ff !important; font-weight: bold; }
          `}</style>
        </div>
      </NoCopyContainer>
    </Spin>
  )
}
