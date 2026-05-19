import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, Spin, Table } from 'antd'
import { FileTextOutlined, SyncOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { normalizeCampusName } from '@/utils/campusSort'
import { getCombinedMonthlyDataV2 } from './api'

interface CoreDataSummaryProps {
  year: string
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

// 所有数据类型
const DATA_TYPES = ['SEM', '新媒体', '市场口碑', '网络合作伙伴', '口碑', '渠道', '神殿新媒体']

/**
 * 01核心数据看板汇总
 * TAB1 - 最高议事厅核心数据汇总
 * 显示各神殿的总招生数据（=SEM+新媒体+市场口碑+合作伙伴+口碑+渠道+神殿新媒体）
 */
export default function CoreDataSummary({ year }: CoreDataSummaryProps) {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<Row[]>([])

  // 从 campusStore 获取神殿列表
  const campusList = useMemo(() => {
    const allCampuses = useCampusStore.getState().getAllCampuses()
    return allCampuses.map(c => normalizeCampusName(c.name))
  }, [])

  // 加载数据：获取每个神殿所有数据类型的年度汇总并相加
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // 构建所有请求：神殿 × 数据类型
      const allPromises: Array<{
        campus: string
        dataType: string
        promise: Promise<any>
      }> = []

      campusList.forEach(campus => {
        DATA_TYPES.forEach(dataType => {
          allPromises.push({
            campus,
            dataType,
            promise: getCombinedMonthlyDataV2({
              year: parseInt(year),
              campus,
              data_type: dataType,
            }).catch(err => {
              console.error(`加载${campus}的${dataType}数据失败:`, err)
              return null
            })
          })
        })
      })

      // 执行所有请求
      const results = await Promise.all(allPromises.map(p => p.promise))

      // 按神殿汇总数据
      const campusDataMap = new Map<string, Row>()
      
      campusList.forEach((campus, idx) => {
        campusDataMap.set(campus, {
          key: campus,
          index: idx + 1,
          campus,
          isTotal: false,
          planIncome: 0,
          actualIncome: 0,
          incomeCompletionRate: '-',
          planCount: 0,
          actualCount: 0,
          refundCount: 0,
        })
      })

      // 累加各数据类型的汇总
      allPromises.forEach((item, idx) => {
        const res = results[idx]
        const summary = res?.data?.年度汇总
        if (summary) {
          const campusData = campusDataMap.get(item.campus)
          if (campusData) {
            campusData.planIncome += summary.计划收入 || 0
            campusData.actualIncome += summary.实际收入 || 0
            campusData.planCount += summary.计划招生 || 0
            campusData.actualCount += summary.实际招生 || 0
            campusData.refundCount += summary.退费人数 || 0
          }
        }
      })

      // 构建行数据
      const campusRows = Array.from(campusDataMap.values())
      // 计算每个神殿的收入完成率
      campusRows.forEach(row => {
        row.incomeCompletionRate = row.planIncome > 0
          ? ((row.actualIncome / row.planIncome) * 100).toFixed(1) + '%'
          : '-'
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
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [year, campusList])

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
        title: '总招生数据（SEM+新媒体+市场口碑+合作伙伴+口碑+渠道+神殿新媒体）',
        children: [
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
  }, [])

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
          最高议事厅 {year}年度核心数据看板汇总
        </div>
        <div style={{ fontSize: 11, color: '#888' }}>
          <SyncOutlined spin={loading} style={{ marginRight: 4 }} />
          数据来自TAB2各神殿各数据类型年度汇总
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
