import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, Spin, Table } from 'antd'
import { FileTextOutlined, SyncOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { normalizeCampusName } from '@/utils/campusSort'
import { getCombinedMonthlyDataV2 } from './api'

interface DataBoardProps {
  title: string
  dataTypeLabel: string
  dataType: string  // 数据类型：SEM/新媒体/市场口碑/网络合作伙伴/口碑/渠道/神殿新媒体
  year: string
  refreshTrigger?: number  // TAB2保存后触发TAB1刷新
  onSummaryChange?: (summary: { planIncome: number; actualIncome: number; planCount: number; actualCount: number; refundCount: number }) => void
}

type Row = {
  key: string
  index: number | string
  campus: string
  isTotal: boolean
  planIncome: number
  actualIncome: number
  incomeCompletionRate: string
  planCount: number
  actualCount: number
  refundCount: number
}

/**
 * 通用数据看板组件
 * 数据来自TAB2各神殿月度数据的年度汇总
 */
export default function DataBoard({ title, dataTypeLabel, dataType, year, refreshTrigger = 0, onSummaryChange }: DataBoardProps) {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<Row[]>([])
  
  // 使用 ref 保存回调，避免无限循环
  const onSummaryChangeRef = useRef(onSummaryChange)
  onSummaryChangeRef.current = onSummaryChange

  // 从 campusStore 获取神殿列表
  const campusList = useMemo(() => {
    const allCampuses = useCampusStore.getState().getAllCampuses()
    return allCampuses.map(c => normalizeCampusName(c.name))
  }, [])

  // 加载所有神殿的年度汇总数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // 并行获取所有神殿的数据
      const promises = campusList.map(campus =>
        getCombinedMonthlyDataV2({
          year: parseInt(year),
          campus,
          data_type: dataType,
        }).catch(err => {
          console.error(`加载${campus}的${dataType}数据失败:`, err)
          return null
        })
      )

      const results = await Promise.all(promises)

      // 构建行数据
      const campusRows: Row[] = campusList.map((campus, idx) => {
        const res = results[idx]
        const summary = res?.data?.年度汇总
        return {
          key: campus,
          index: idx + 1,
          campus,
          isTotal: false,
          planIncome: summary?.计划收入 || 0,
          actualIncome: summary?.实际收入 || 0,
          incomeCompletionRate: (summary?.计划收入 && summary.计划收入 > 0 && summary?.实际收入 != null)
            ? ((summary.实际收入 / summary.计划收入) * 100).toFixed(1) + '%'
            : '-',
          planCount: summary?.计划招生 || 0,
          actualCount: summary?.实际招生 || 0,
          refundCount: summary?.退费人数 || 0,
        }
      })

      // 计算合计行
      const totalPlanIncome = campusRows.reduce((acc, r) => acc + r.planIncome, 0)
      const totalActualIncome = campusRows.reduce((acc, r) => acc + r.actualIncome, 0)
      const totalRow: Row = {
        key: '合计',
        index: '合计',
        campus: '',
        isTotal: true,
        planIncome: totalPlanIncome,
        actualIncome: totalActualIncome,
        incomeCompletionRate: totalPlanIncome > 0
          ? ((totalActualIncome / totalPlanIncome) * 100).toFixed(1) + '%'
          : '-',
        planCount: campusRows.reduce((acc, r) => acc + r.planCount, 0),
        actualCount: campusRows.reduce((acc, r) => acc + r.actualCount, 0),
        refundCount: campusRows.reduce((acc, r) => acc + r.refundCount, 0),
      }

      setRows([...campusRows, totalRow])

      // 通知父组件汇总数据变化（使用 ref 避免依赖变化）
      onSummaryChangeRef.current?.({
        planIncome: totalRow.planIncome,
        actualIncome: totalRow.actualIncome,
        planCount: totalRow.planCount,
        actualCount: totalRow.actualCount,
        refundCount: totalRow.refundCount,
      })
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [year, campusList, dataType, refreshTrigger])

  // 初始加载
  useEffect(() => {
    loadData()
  }, [loadData])

  const renderValue = (value: number | null | undefined, isTotal: boolean) => {
    if (value === null || value === undefined) return '0'
    return (
      <span
        style={{
          fontWeight: isTotal ? 'bold' : 'normal',
          color: isTotal ? '#c00000' : 'inherit',
        }}
      >
        {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : value}
      </span>
    )
  }

  const columns = useMemo(() => {
    return [
      {
        title: '序号',
        dataIndex: 'index',
        key: 'index',
        width: 50,
        align: 'center' as const,
        render: (val: number | string, record: Row) => (
          <span style={{ fontWeight: record.isTotal ? 'bold' : 'normal', color: record.isTotal ? '#c00000' : 'inherit' }}>{val}</span>
        ),
      },
      {
        title: '神殿',
        dataIndex: 'campus',
        key: 'campus',
        width: 80,
        render: (text: string, record: Row) => (
          <span style={{ fontWeight: record.isTotal ? 'bold' : 'normal', color: record.isTotal ? '#c00000' : 'inherit' }}>{text}</span>
        ),
      },
      {
        title: '计划收入',
        dataIndex: 'planIncome',
        key: 'planIncome',
        width: 100,
        align: 'center' as const,
        render: (val: number, record: Row) => renderValue(val, record.isTotal),
      },
      {
        title: '实际收入',
        dataIndex: 'actualIncome',
        key: 'actualIncome',
        width: 100,
        align: 'center' as const,
        render: (val: number, record: Row) => renderValue(val, record.isTotal),
      },
      {
        title: '收入完成率',
        dataIndex: 'incomeCompletionRate',
        key: 'incomeCompletionRate',
        width: 90,
        align: 'center' as const,
        render: (val: string, record: Row) => {
          if (val === '-') return <span style={{ color: '#999' }}>-</span>
          return (
            <span style={{ color: '#52c41a', fontWeight: record.isTotal ? 'bold' : 'normal' }}>
              {val}
            </span>
          )
        },
      },
      {
        title: dataTypeLabel,
        children: [
          {
            title: '计划人数',
            dataIndex: 'planCount',
            key: 'planCount',
            width: 80,
            align: 'center' as const,
            render: (val: number, record: Row) => renderValue(val, record.isTotal),
          },
          {
            title: '实际人数',
            dataIndex: 'actualCount',
            key: 'actualCount',
            width: 80,
            align: 'center' as const,
            render: (val: number, record: Row) => renderValue(val, record.isTotal),
          },
          {
            title: '退费人数',
            dataIndex: 'refundCount',
            key: 'refundCount',
            width: 80,
            align: 'center' as const,
            render: (val: number, record: Row) => renderValue(val, record.isTotal),
          },
        ],
      },
    ]
  }, [dataTypeLabel])

  return (
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
          <SyncOutlined spin={loading} style={{ marginRight: 4 }} />
          数据来自TAB2各神殿年度汇总
        </div>
      </div>

      <Spin spinning={loading}>
        <Table<Row>
          columns={columns as any}
          dataSource={rows}
          pagination={false}
          bordered
          size="small"
          rowClassName={(record) => (record.isTotal ? 'total-row' : '')}
        />
      </Spin>

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
      `}</style>
    </Card>
  )
}
