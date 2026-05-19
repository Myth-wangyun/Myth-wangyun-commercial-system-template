import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { App, Button, Card, InputNumber, Spin, Table, Tag, Tooltip } from 'antd'
import { FileTextOutlined, SaveOutlined, SyncOutlined } from '@ant-design/icons'
import { 
  batchUpsertCampusMonthlyData, 
  getCombinedMonthlyDataV2,
  type CombinedMonthlyData,
  type CombinedYearlySummary
} from './api'

interface CampusMonthlyDataBoardProps {
  title: string
  dataTypeLabel: string
  dataType: string // 数据类型：SEM/新媒体/市场口碑/合作伙伴/口碑/渠道/神殿新媒体
  campusName: string
  year: string
  onDataChange?: () => void // 数据变化回调，用于通知父组件刷新汇总
}

type Row = {
  key: string
  recordId?: number
  month: number | string
  campus: string
  isTotal: boolean
  // 计划数据（手动输入）
  planIncome: number | null
  planCount: number | null
  // 实际数据（自动读取）
  consultCount: number // 咨询总量
  visitCount: number // 上门量
  actualCount: number // 实际招生
  refundCount: number // 退费人数
  actualIncome: number // 实际收入
  refundAmount: number // 退费金额
  // 收入完成率
  incomeCompletionRate: string
  // 转化率
  totalConversionRate: number // 总转化率
  faceToFaceConversionRate: number // 当面转化率
  phoneToVisitRate: number // 电转门
}

// 计算收入完成率
const calcIncomeRate = (planIncome: number | null, actualIncome: number): string => {
  if (planIncome && planIncome > 0 && actualIncome != null) {
    return ((actualIncome / planIncome) * 100).toFixed(1) + '%'
  }
  return '-'
}

/**
 * 单神殿月度数据看板组件
 * 按1-12月展示数据
 * - 计划收入/计划招生：手动输入，存储到数据库
 * - 实际收入/实际招生/退费人数/咨询总量/上门量：从咨询量系统自动读取
 * - 转化率：自动计算
 */
export default function CampusMonthlyDataBoard({
  title,
  dataTypeLabel,
  dataType,
  campusName,
  year,
  onDataChange
}: CampusMonthlyDataBoardProps) {
  const { message, notification } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [dataSource, setDataSource] = useState<string>('咨询量系统')

  const makeEmptyRow = (month: number | string, isTotal = false): Row => ({
    key: String(month),
    month,
    campus: campusName,
    isTotal,
    planIncome: null,
    planCount: null,
    consultCount: 0,
    visitCount: 0,
    actualCount: 0,
    refundCount: 0,
    actualIncome: 0,
    refundAmount: 0,
    incomeCompletionRate: '-',
    totalConversionRate: 0,
    faceToFaceConversionRate: 0,
    phoneToVisitRate: 0,
  })

  // 生成1-12月的数据行
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const [rows, setRows] = useState<Row[]>(() => {
    const rows = months.map((m) => makeEmptyRow(m))
    rows.push(makeEmptyRow('合计', true))
    return rows
  })

  // 加载合并后的数据（计划+自动实际数据）
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getCombinedMonthlyDataV2({
        year: parseInt(year),
        campus: campusName,
        data_type: dataType
      })
      
      if (!result.success) {
        throw new Error('获取数据失败')
      }

      const { 月度数据, 年度汇总, 数据来源 } = result.data
      setDataSource(数据来源)
      
      // 更新行数据
      const newRows = months.map(m => {
        const data = 月度数据.find(d => d.月份 === m)
        if (data) {
          return {
            key: String(m),
            month: m,
            campus: campusName,
            isTotal: false,
            planIncome: data.计划收入 || null,
            planCount: data.计划招生 || null,
            consultCount: data.咨询总量,
            visitCount: data.上门量,
            actualCount: data.实际招生,
            refundCount: data.退费人数,
            actualIncome: data.实际收入,
            refundAmount: data.退费金额,
            incomeCompletionRate: calcIncomeRate(data.计划收入 || null, data.实际收入),
            totalConversionRate: data.总转化率,
            faceToFaceConversionRate: data.当面转化率,
            phoneToVisitRate: data.电转门,
          }
        }
        return makeEmptyRow(m)
      })
      
      // 添加汇总行
      const total: Row = {
        key: '合计',
        month: '合计',
        campus: campusName,
        isTotal: true,
        planIncome: 年度汇总.计划收入 || null,
        planCount: 年度汇总.计划招生 || null,
        consultCount: 年度汇总.咨询总量,
        visitCount: 年度汇总.上门量,
        actualCount: 年度汇总.实际招生,
        refundCount: 年度汇总.退费人数,
        actualIncome: 年度汇总.实际收入,
        refundAmount: 年度汇总.退费金额,
        incomeCompletionRate: calcIncomeRate(年度汇总.计划收入 || null, 年度汇总.实际收入),
        totalConversionRate: 年度汇总.总转化率,
        faceToFaceConversionRate: 年度汇总.当面转化率,
        phoneToVisitRate: 年度汇总.电转门,
      }
      newRows.push(total)
      
      setRows(newRows)
      setHasChanges(false)
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [year, campusName, dataType])

  // 加载数据
  useEffect(() => {
    loadData()
  }, [loadData])

  const recomputeTotal = (next: Row[]): Row[] => {
    const monthRows = next.filter((r) => !r.isTotal)
    
    const sum = (field: keyof Row) =>
      monthRows.reduce(
        (acc, r) => acc + (typeof r[field] === 'number' ? (r[field] as number) : 0),
        0,
      )

    const totalPlanIncome = sum('planIncome') || 0
    const totalPlanCount = sum('planCount') || 0
    const totalConsultCount = sum('consultCount')
    const totalVisitCount = sum('visitCount')
    const totalActualCount = sum('actualCount')
    const totalRefundCount = sum('refundCount')
    const totalActualIncome = sum('actualIncome')
    const totalRefundAmount = sum('refundAmount')

    // 计算年度转化率
    const totalConversionRate = totalConsultCount > 0 
      ? Math.round(totalActualCount / totalConsultCount * 10000) / 100 : 0
    const faceToFaceConversionRate = totalVisitCount > 0 
      ? Math.round(totalActualCount / totalVisitCount * 10000) / 100 : 0
    const phoneToVisitRate = totalConsultCount > 0 
      ? Math.round(totalVisitCount / totalConsultCount * 10000) / 100 : 0

    const total: Row = {
      key: '合计',
      month: '合计',
      campus: campusName,
      isTotal: true,
      planIncome: totalPlanIncome || null,
      planCount: totalPlanCount || null,
      consultCount: totalConsultCount,
      visitCount: totalVisitCount,
      actualCount: totalActualCount,
      refundCount: totalRefundCount,
      actualIncome: totalActualIncome,
      refundAmount: totalRefundAmount,
      incomeCompletionRate: calcIncomeRate(totalPlanIncome || null, totalActualIncome),
      totalConversionRate,
      faceToFaceConversionRate,
      phoneToVisitRate,
    }

    return [...monthRows, total]
  }

  // 保存计划数据到后端
  const saveAllToBackend = useCallback(async () => {
    const monthRows = rows.filter(r => !r.isTotal && typeof r.month === 'number')
    if (monthRows.length === 0) return
    
    setSaving(true)
    try {
      const dataList = monthRows.map(row => ({
        年份: parseInt(year),
        月份: row.month as number,
        神殿: campusName,
        数据类型: dataType,
        计划收入: row.planIncome || 0,
        实际收入: row.actualIncome || 0,
        计划招生: row.planCount || 0,
        实际招生: row.actualCount || 0,
        退费人数: row.refundCount || 0,
      }))
      
      await batchUpsertCampusMonthlyData(dataList)
      notification.success({ message: '已保存', description: '数据保存成功', placement: 'topRight', duration: 3 })
      setHasChanges(false)
      onDataChange?.()
    } catch (error) {
      console.error('保存失败:', error)
      notification.error({ message: '保存失败', description: '数据保存失败，请稍后重试', placement: 'topRight', duration: 4 })
    } finally {
      setSaving(false)
    }
  }, [rows, year, campusName, dataType, onDataChange])

  // 更新计划数据（手动输入）
  const updatePlanValue = (key: string, field: 'planIncome' | 'planCount', value: number | null) => {
    setRows((prev) => {
      const next = prev.map((r) => ({ ...r }))
      const idx = next.findIndex((r) => r.key === key)
      if (idx === -1) return prev
      if (next[idx].isTotal) return prev

      next[idx][field] = value
      // 重新计算收入完成率
      if (field === 'planIncome') {
        next[idx].incomeCompletionRate = calcIncomeRate(value, next[idx].actualIncome)
      }
      
      return recomputeTotal(next)
    })
    setHasChanges(true)
  }

  const renderValue = (value: any, isTotal: boolean, isAuto = false) => {
    const empty = value === null || value === undefined || value === ''
    if (empty) return '-'
    return (
      <span
        style={{
          fontWeight: isTotal ? 'bold' : 'normal',
          color: isTotal ? '#c00000' : (isAuto ? '#1890ff' : 'inherit'),
        }}
      >
        {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : value}
      </span>
    )
  }

  // 渲染可编辑的计划数据
  const renderEditablePlan = (record: Row, field: 'planIncome' | 'planCount') => {
    if (record.isTotal) return renderValue(record[field], true)
    return (
      <InputNumber
        value={record[field]}
        onChange={(val) => updatePlanValue(record.key, field, val)}
        style={{ width: '100%' }}
        size="small"
        min={0}
        disabled={saving}
      />
    )
  }

  // 渲染自动读取的实际数据（只读）
  const renderAutoValue = (record: Row, field: keyof Row) => {
    const value = record[field]
    return renderValue(value, record.isTotal, true)
  }

  // 渲染转化率（百分比）
  const renderRate = (record: Row, field: 'totalConversionRate' | 'faceToFaceConversionRate' | 'phoneToVisitRate') => {
    const value = record[field]
    if (value === 0 && !record.isTotal) return '-'
    return (
      <span
        style={{
          fontWeight: record.isTotal ? 'bold' : 'normal',
          color: record.isTotal ? '#c00000' : '#52c41a',
        }}
      >
        {value}%
      </span>
    )
  }

  const columns = useMemo(() => {
    // 根据数据来源确定颜色 - 咨询系统用蓝色
    const autoValueColor = '#1890ff'
    
    return [
      {
        title: '月份',
        dataIndex: 'month',
        key: 'month',
        width: 50,
        align: 'center' as const,
        fixed: 'left' as const,
        render: (val: number | string, record: Row) => (
          <span style={{ fontWeight: record.isTotal ? 'bold' : 'normal', color: record.isTotal ? '#c00000' : 'inherit' }}>{val}</span>
        ),
      },
      {
        title: '神殿',
        dataIndex: 'campus',
        key: 'campus',
        width: 55,
        fixed: 'left' as const,
        render: (text: string, record: Row) => record.isTotal ? '' : text,
      },
      {
        title: <span>{dataTypeLabel}</span>,
        children: [
          {
            title: '计划收入',
            dataIndex: 'planIncome',
            key: 'planIncome',
            width: 90,
            align: 'center' as const,
            render: (_: any, record: Row) => renderEditablePlan(record, 'planIncome'),
          },
          {
            title: '实际收入',
            dataIndex: 'actualIncome',
            key: 'actualIncome',
            width: 80,
            align: 'center' as const,
            render: (_: any, record: Row) => {
              const value = record.actualIncome
              const empty = value === null || value === undefined || value === 0
              if (empty && !record.isTotal) return <span style={{ color: '#999' }}>{dataSource}</span>
              return (
                <span style={{
                  fontWeight: record.isTotal ? 'bold' : 'normal',
                  color: record.isTotal ? '#c00000' : autoValueColor,
                }}>
                  {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : value}
                </span>
              )
            },
          },
          {
            title: '收入完成率',
            dataIndex: 'incomeCompletionRate',
            key: 'incomeCompletionRate',
            width: 85,
            align: 'center' as const,
            render: (_: any, record: Row) => {
              const val = record.incomeCompletionRate
              if (val === '-') return <span style={{ color: '#999' }}>-</span>
              return (
                <span style={{
                  color: '#52c41a',
                  fontWeight: record.isTotal ? 'bold' : 'normal',
                }}>
                  {val}
                </span>
              )
            },
          },
          {
            title: '计划人数',
            dataIndex: 'planCount',
            key: 'planCount',
            width: 70,
            align: 'center' as const,
            render: (_: any, record: Row) => renderEditablePlan(record, 'planCount'),
          },
          {
            title: '实际人数',
            dataIndex: 'actualCount',
            key: 'actualCount',
            width: 70,
            align: 'center' as const,
            render: (_: any, record: Row) => {
              const value = record.actualCount
              const empty = value === null || value === undefined || value === 0
              if (empty && !record.isTotal) return <span style={{ color: '#999' }}>{dataSource}</span>
              return (
                <span style={{
                  fontWeight: record.isTotal ? 'bold' : 'normal',
                  color: record.isTotal ? '#c00000' : autoValueColor,
                }}>
                  {value}
                </span>
              )
            },
          },
          {
            title: '退费人数',
            dataIndex: 'refundCount',
            key: 'refundCount',
            width: 70,
            align: 'center' as const,
            render: (_: any, record: Row) => {
              const value = record.refundCount
              const empty = value === null || value === undefined || value === 0
              if (empty && !record.isTotal) return <span style={{ color: '#999' }}>{dataSource}</span>
              return (
                <span style={{
                  fontWeight: record.isTotal ? 'bold' : 'normal',
                  color: record.isTotal ? '#c00000' : autoValueColor,
                }}>
                  {value}
                </span>
              )
            },
          },
        ],
      },
    ]
  }, [dataTypeLabel, saving, dataSource])

  return (
    <Spin spinning={loading}>
      <Card bodyStyle={{ padding: '8px 12px' }}>
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 'bold',
              color: '#c00000',
            }}
          >
            <FileTextOutlined style={{ marginRight: 6 }} />
            {title}
          </div>
          <div style={{ fontSize: 11, color: '#888' }}>
            数据来源: <Tag color="blue" style={{ marginRight: 4 }}>{dataSource}</Tag>
          </div>
        </div>

        <Table<Row>
          columns={columns as any}
          dataSource={rows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 600 }}
          rowClassName={(record) => (record.isTotal ? 'total-row' : '')}
        />

        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <Button
            icon={<SyncOutlined />}
            onClick={loadData}
            loading={loading}
            size="small"
            style={{ marginRight: 8 }}
          >
            刷新数据
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={saveAllToBackend}
            loading={saving}
            disabled={!hasChanges}
            size="small"
          >
            保存计划数据
          </Button>
        </div>

      <style>{`
        .ant-table-thead > tr > th {
          background-color: #fce4d6 !important;
          text-align: center !important;
          font-weight: bold !important;
          border: 1px solid #d0d0d0 !important;
          padding: 2px 4px !important;
          font-size: 11px !important;
          line-height: 1.2 !important;
          white-space: normal !important;
          vertical-align: middle !important;
        }
        .ant-table-tbody > tr > td {
          border: 1px solid #d0d0d0 !important;
          padding: 2px 4px !important;
          font-size: 11px !important;
          line-height: 1.3 !important;
        }
        .ant-table-tbody > tr.total-row > td {
          background-color: #fff2cc !important;
          font-weight: bold !important;
        }
        .ant-input-number {
          font-size: 11px !important;
        }
        .ant-input-number-input {
          padding: 0 4px !important;
          height: 20px !important;
        }
      `}</style>
      </Card>
    </Spin>
  )
}
