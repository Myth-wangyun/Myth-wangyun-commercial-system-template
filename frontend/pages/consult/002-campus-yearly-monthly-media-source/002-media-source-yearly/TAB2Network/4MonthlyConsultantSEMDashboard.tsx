/**
 * 清美教育集团年度SEM数据核心数据看板（咨询师按月份汇总）
 * 每月分组展示各咨询师的SEM数据
 */

import React, { useMemo, useState, useEffect } from 'react'
import { App, Input, InputNumber, Table, Button } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { NoCopyContainer } from '@/components/common'
import { 
  getConsultantPlanList, 
  batchSaveConsultantPlans,
  type ConsultantMonthlyPlan 
} from '@/services/consult/consultantPlan'

interface MonthlyConsultantRow {
  key: string
  月号: number | string
  咨询师: string
  isMonthTotal: boolean  // 月度合计
  isGrandTotal: boolean  // 总计
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

export default function MonthlyConsultantSEMDashboard({ year, campus }: Props) {
  const { notification, message } = App.useApp()
  const consultantsPerMonth = 3 // 每月3个咨询师

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const makeEmptyRow = (
    月号: number | string,
    咨询师: string,
    isMonthTotal = false,
    isGrandTotal = false
  ): MonthlyConsultantRow => ({
    key: `${月号}-${咨询师}`,
    月号,
    咨询师,
    isMonthTotal,
    isGrandTotal,
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
    const rows: MonthlyConsultantRow[] = []
    
    // 生成12个月的数据，每月有：1个合计行 + N个咨询师行
    for (let month = 1; month <= 12; month++) {
      // 月度合计行
      rows.push(makeEmptyRow(month, '合计', true, false))
      
      // 咨询师行
      for (let i = 1; i <= consultantsPerMonth; i++) {
        rows.push(makeEmptyRow(month, '', false, false))
      }
    }
    
    // 总计行
    rows.push(makeEmptyRow('合计', '合计', false, true))
    
    return rows
  }, [])

  const [rows, setRows] = useState<MonthlyConsultantRow[]>(initialRows)

  // 从后端加载计划数据
  useEffect(() => {
    loadPlanData()
  }, [year, campus])

  const loadPlanData = async () => {
    try {
      setLoading(true)
      const plans = await getConsultantPlanList({
        year: parseInt(year),
        campus,
        data_type: 'SEM'
      })

      // 创建一个Map用于快速查找
      const planMap = new Map<string, ConsultantMonthlyPlan>()
      plans.forEach(plan => {
        const key = `${plan.月份}_${plan.咨询师}`
        planMap.set(key, plan)
      })

      // 更新rows中的计划收入和计划新生
      setRows(prev => {
        const next = prev.map(row => {
          if (!row.isMonthTotal && !row.isGrandTotal && row.咨询师) {
            const key = `${row.月号}_${row.咨询师}`
            const plan = planMap.get(key)
            if (plan) {
              return {
                ...row,
                计划收入: plan.计划收入,
                计划新生: plan.计划招生,
              }
            }
          }
          return row
        })
        return recomputeTotals(next)
      })
    } catch (error) {
      console.error('加载计划数据失败:', error)
      message.error('加载计划数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 保存计划数据
  const handleSave = async () => {
    try {
      setSaving(true)

      // 收集所有非合计行的计划数据
      const plans: ConsultantMonthlyPlan[] = rows
        .filter(row => !row.isMonthTotal && !row.isGrandTotal && row.咨询师.trim())
        .map(row => ({
          年份: parseInt(year),
          月份: row.月号 as number,
          神殿: campus,
          咨询师: row.咨询师,
          数据类型: 'SEM',
          计划收入: row.计划收入,
          计划招生: row.计划新生,
        }))

      if (plans.length === 0) {
        message.warning('没有需要保存的数据')
        return
      }

      const result = await batchSaveConsultantPlans(plans)
      notification.success({ message: '已保存', description: `保存成功！成功 ${result.成功数量} 条${result.失败数量 > 0 ? `，失败 ${result.失败数量} 条` : ''}`, placement: 'topRight', duration: 3 })
      
      // 重新加载数据
      await loadPlanData()
    } catch (error) {
      console.error('保存失败:', error)
      notification.error({ message: '保存失败', description: '保存失败，请稍后重试', placement: 'topRight', duration: 4 })
    } finally {
      setSaving(false)
    }
  }


  const calculateRates = (row: MonthlyConsultantRow) => {
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

  const recomputeTotals = (next: MonthlyConsultantRow[]): MonthlyConsultantRow[] => {
    const sumFields: (keyof MonthlyConsultantRow)[] = [
      '计划收入', '实际收入', '计划新生', '实际新生', '退单人数',
      '上门总量', '咨询总量', '电话量', 'SEM投入', '招生成本'
    ]

    // 计算每月合计
    for (let month = 1; month <= 12; month++) {
      const monthRows = next.filter(r => r.月号 === month && !r.isMonthTotal)
      const monthTotal = next.find(r => r.月号 === month && r.isMonthTotal)
      
      if (monthTotal) {
        sumFields.forEach(field => {
          const sum = monthRows.reduce((acc, r) => {
            const val = r[field]
            return acc + (typeof val === 'number' ? val : 0)
          }, 0)
          ;(monthTotal as any)[field] = sum || null
        })
        calculateRates(monthTotal)
      }
    }

    // 计算总计
    const grandTotal = next.find(r => r.isGrandTotal)
    if (grandTotal) {
      const allMonthTotals = next.filter(r => r.isMonthTotal)
      sumFields.forEach(field => {
        const sum = allMonthTotals.reduce((acc, r) => {
          const val = r[field]
          return acc + (typeof val === 'number' ? val : 0)
        }, 0)
        ;(grandTotal as any)[field] = sum || null
      })
      calculateRates(grandTotal)
    }

    return next
  }

  const updateValue = (key: string, field: keyof MonthlyConsultantRow, value: number | null) => {
    setRows(prev => {
      const next = [...prev]
      const row = next.find(r => r.key === key)
      if (row && !row.isMonthTotal && !row.isGrandTotal) {
        ;(row as any)[field] = value
        calculateRates(row)
      }
      return recomputeTotals(next)
    })
  }

  const updateConsultantName = (key: string, name: string) => {
    setRows(prev => {
      const next = [...prev]
      const row = next.find(r => r.key === key)
      if (row && !row.isMonthTotal && !row.isGrandTotal) {
        row.咨询师 = name
      }
      return next
    })
  }

  const renderNumberInput = (row: MonthlyConsultantRow, field: keyof MonthlyConsultantRow, width = 90) => {
    const value = row[field] as number | null
    if (row.isMonthTotal || row.isGrandTotal) {
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
      title: '月号',
      dataIndex: '月号',
      width: 60,
      fixed: 'left' as const,
      align: 'center' as const,
      onCell: (record: MonthlyConsultantRow) => {
        // 计算当前行在数据中的位置
        const index = rows.findIndex(r => r.key === record.key)
        
        // 如果是总计行，不合并
        if (record.isGrandTotal) {
          return { rowSpan: 1 }
        }
        
        // 如果是月度合计行（每月第一行），合并本月所有行
        if (record.isMonthTotal) {
          return { rowSpan: consultantsPerMonth + 1 } // 1个合计 + N个咨询师
        }
        
        // 咨询师行不显示月号（被合并）
        return { rowSpan: 0 }
      },
      render: (val: number | string, r: MonthlyConsultantRow) => {
        if (r.isGrandTotal) {
          return <strong style={{ color: '#ff4d4f', fontSize: '14px' }}>合计</strong>
        }
        return <strong style={{ color: '#1890ff', fontSize: '13px' }}>{val}</strong>
      },
    },
    {
      title: '咨询师',
      dataIndex: '咨询师',
      width: 100,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (val: string, r: MonthlyConsultantRow) => {
        if (r.isMonthTotal || r.isGrandTotal) {
          return <strong style={{ color: r.isGrandTotal ? '#ff4d4f' : '#1890ff' }}>合计</strong>
        }
        return (
          <Input
            value={val}
            onChange={e => updateConsultantName(r.key, e.target.value)}
            size="small"
            placeholder="姓名"
            style={{ width: 90 }}
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
          render: (_: any, r: MonthlyConsultantRow) => renderNumberInput(r, '计划收入', 100) 
        },
        { 
          title: '实际收入', 
          width: 100, 
          render: (_: any, r: MonthlyConsultantRow) => renderNumberInput(r, '实际收入', 100) 
        },
      ],
    },
    {
      title: '招生数据',
      children: [
        { 
          title: '计划新生', 
          width: 90, 
          render: (_: any, r: MonthlyConsultantRow) => renderNumberInput(r, '计划新生', 80) 
        },
        { 
          title: '实际新生', 
          width: 90, 
          render: (_: any, r: MonthlyConsultantRow) => renderNumberInput(r, '实际新生', 80) 
        },
        { 
          title: '退单人数', 
          width: 90, 
          render: (_: any, r: MonthlyConsultantRow) => renderNumberInput(r, '退单人数', 80) 
        },
        { 
          title: '上门总量', 
          width: 90, 
          render: (_: any, r: MonthlyConsultantRow) => renderNumberInput(r, '上门总量', 80) 
        },
        { 
          title: '咨询总量', 
          width: 90, 
          render: (_: any, r: MonthlyConsultantRow) => renderNumberInput(r, '咨询总量', 80) 
        },
        { 
          title: '电话量', 
          width: 80, 
          render: (_: any, r: MonthlyConsultantRow) => renderNumberInput(r, '电话量', 70) 
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
          render: (_: any, r: MonthlyConsultantRow) => renderNumberInput(r, 'SEM投入', 90) 
        },
        { 
          title: '招生成本', 
          width: 100, 
          render: (_: any, r: MonthlyConsultantRow) => renderNumberInput(r, '招生成本', 90) 
        },
      ],
    },
  ]

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <div>
        <div style={{ 
          background: '#9370DB', 
          padding: '8px 16px', 
          fontWeight: 'bold', 
          marginBottom: 8,
          fontSize: '14px',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{campus}{year}年度SEM数据核心数据看板（咨询师按月份汇总）</span>
          <Button 
            type="primary" 
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
            size="small"
          >
            保存计划数据
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={rows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1500 }}
          loading={loading}
          rowClassName={r => {
            if (r.isGrandTotal) return 'grand-total-row'
            if (r.isMonthTotal) return 'month-total-row'
            return ''
          }}
        />
        <style>{`
          .month-total-row { background-color: #f0f5ff; }
          .month-total-row td { background-color: #f0f5ff !important; font-weight: 600; }
          .grand-total-row { background-color: #fff1f0; }
          .grand-total-row td { background-color: #fff1f0 !important; font-weight: bold; }
        `}</style>
      </div>
    </NoCopyContainer>
  )
}