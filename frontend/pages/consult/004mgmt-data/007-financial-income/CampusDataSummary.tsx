import React, { useCallback, useEffect, useState } from 'react'
import { Card, Spin, Table } from 'antd'
import { FileTextOutlined, SyncOutlined } from '@ant-design/icons'
import CampusMonthlyDataBoard from './CampusMonthlyDataBoard'
import { getCombinedMonthlyDataV2 } from './api'

interface CampusDataSummaryProps {
  campusName: string
  year: string
  onDataChange?: () => void  // TAB2保存后通知TAB1刷新
}

type SummaryRow = {
  key: string
  index: number | string
  campus: string
  planIncome: number
  actualIncome: number
  incomeCompletionRate: string
  planCount: number
  actualCount: number
  refundCount: number
}

// 所有子表的数据类型
const DATA_TYPES = ['SEM', '新媒体', '市场口碑', '网络合作伙伴', '口碑', '渠道', '神殿新媒体']

/**
 * 单神殿数据汇总页面
 * 包含顶部汇总表和各分类数据看板
 * 顶部汇总表数据 = 各子表年度合计之和
 */
export default function CampusDataSummary({ campusName, year, onDataChange }: CampusDataSummaryProps) {
  const [loading, setLoading] = useState(false)
  const [summaryData, setSummaryData] = useState<SummaryRow | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // 加载所有子表的年度汇总数据并合计
  const loadSummaryData = useCallback(async () => {
    setLoading(true)
    try {
      // 并行获取所有数据类型的数据
      const promises = DATA_TYPES.map(dataType =>
        getCombinedMonthlyDataV2({
          year: parseInt(year),
          campus: campusName,
          data_type: dataType,
        }).catch(err => {
          console.error(`加载${dataType}数据失败:`, err)
          return null
        })
      )

      const results = await Promise.all(promises)

      // 汇总所有数据类型的年度合计
      let totalPlanIncome = 0
      let totalActualIncome = 0
      let totalPlanCount = 0
      let totalActualCount = 0
      let totalRefundCount = 0

      results.forEach((res) => {
        if (res?.data?.年度汇总) {
          const summary = res.data.年度汇总
          totalPlanIncome += summary.计划收入 || 0
          totalActualIncome += summary.实际收入 || 0
          totalPlanCount += summary.计划招生 || 0
          totalActualCount += summary.实际招生 || 0
          totalRefundCount += summary.退费人数 || 0
        }
      })

      setSummaryData({
        key: '1',
        index: 1,
        campus: campusName,
        planIncome: totalPlanIncome,
        actualIncome: totalActualIncome,
        incomeCompletionRate: totalPlanIncome > 0
          ? ((totalActualIncome / totalPlanIncome) * 100).toFixed(1) + '%'
          : '-',
        planCount: totalPlanCount,
        actualCount: totalActualCount,
        refundCount: totalRefundCount,
      })
    } catch (error) {
      console.error('加载汇总数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [year, campusName])

  // 初始加载
  useEffect(() => {
    loadSummaryData()
  }, [loadSummaryData, refreshKey])

  // 子表数据变化时刷新汇总，并通知父级（TAB1）刷新
  const handleDataChange = useCallback(() => {
    // 延迟刷新，确保后端数据已更新
    setTimeout(() => {
      setRefreshKey(prev => prev + 1)
      onDataChange?.()
    }, 500)
  }, [onDataChange])

  const renderValue = (value: number | null | undefined) => {
    if (value === null || value === undefined || value === 0) return '0'
    return (
      <span style={{ fontWeight: 'normal' }}>
        {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : value}
      </span>
    )
  }

  const summaryColumns = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 50,
      align: 'center' as const,
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 70,
    },
    {
      title: '计划收入',
      dataIndex: 'planIncome',
      key: 'planIncome',
      width: 120,
      align: 'right' as const,
      render: (val: number) => renderValue(val),
    },
    {
      title: '实际收入',
      dataIndex: 'actualIncome',
      key: 'actualIncome',
      width: 120,
      align: 'right' as const,
      render: (val: number) => renderValue(val),
    },
    {
      title: '收入完成率',
      dataIndex: 'incomeCompletionRate',
      key: 'incomeCompletionRate',
      width: 90,
      align: 'center' as const,
      render: (val: string) => {
        if (val === '-') return <span style={{ color: '#999' }}>-</span>
        return <span style={{ color: '#52c41a' }}>{val}</span>
      },
    },
    {
      title: '招生数据=SEM+新媒体+口碑+渠道',
      children: [
        {
          title: '计划招生',
          dataIndex: 'planCount',
          key: 'planCount',
          width: 100,
          align: 'right' as const,
          render: (val: number) => renderValue(val),
        },
        {
          title: '实际招生',
          dataIndex: 'actualCount',
          key: 'actualCount',
          width: 100,
          align: 'right' as const,
          render: (val: number) => renderValue(val),
        },
        {
          title: '退费人数',
          dataIndex: 'refundCount',
          key: 'refundCount',
          width: 100,
          align: 'right' as const,
          render: (val: number) => renderValue(val),
        },
      ],
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 顶部汇总表 */}
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
            {campusName}神殿 {year}年度核心数据看板汇总
          </div>
          <div style={{ fontSize: 11, color: '#888' }}>
            <SyncOutlined spin={loading} style={{ marginRight: 4 }} />
            数据来自各子表年度合计汇总
          </div>
        </div>
        <Spin spinning={loading}>
          <Table<SummaryRow>
            columns={summaryColumns as any}
            dataSource={summaryData ? [summaryData] : []}
            pagination={false}
            bordered
            size="small"
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
          }
          .ant-table-tbody > tr > td {
            border: 1px solid #d0d0d0 !important;
            padding: 2px 4px !important;
            font-size: 11px !important;
          }
        `}</style>
      </Card>

      {/* SEM数据核心数据看板 */}
      <CampusMonthlyDataBoard
        title={`${campusName}神殿 ${year}年度SEM数据核心数据看板`}
        dataTypeLabel="SEM招生数据"
        dataType="SEM"
        campusName={campusName}
        year={year}
        onDataChange={handleDataChange}
      />

      {/* 新媒体数据核心数据看板 */}
      <CampusMonthlyDataBoard
        title={`${campusName}神殿 ${year}年度新媒体数据核心数据看板`}
        dataTypeLabel="新媒体招生数据"
        dataType="新媒体"
        campusName={campusName}
        year={year}
        onDataChange={handleDataChange}
      />

      {/* 市场口碑数据核心数据看板 */}
      <CampusMonthlyDataBoard
        title={`${campusName}神殿 ${year}年度市场口碑数据核心数据看板`}
        dataTypeLabel="市场口碑招生数据"
        dataType="市场口碑"
        campusName={campusName}
        year={year}
        onDataChange={handleDataChange}
      />

      {/* 网络合作伙伴数据核心数据看板 */}
      <CampusMonthlyDataBoard
        title={`${campusName}神殿 ${year}年度网络合作伙伴数据核心数据看板`}
        dataTypeLabel="网络合作伙伴招生数据"
        dataType="网络合作伙伴"
        campusName={campusName}
        year={year}
        onDataChange={handleDataChange}
      />

      {/* 口碑数据核心数据看板 */}
      <CampusMonthlyDataBoard
        title={`${campusName}神殿 ${year}年度口碑数据核心数据看板`}
        dataTypeLabel="口碑招生数据"
        dataType="口碑"
        campusName={campusName}
        year={year}
        onDataChange={handleDataChange}
      />

      {/* 渠道数据核心数据看板 */}
      <CampusMonthlyDataBoard
        title={`${campusName}神殿 ${year}年度渠道数据核心数据看板`}
        dataTypeLabel="渠道招生数据"
        dataType="渠道"
        campusName={campusName}
        year={year}
        onDataChange={handleDataChange}
      />

      {/* 神殿新媒体数据核心数据看板 */}
      <CampusMonthlyDataBoard
        title={`${campusName}神殿 ${year}年度神殿新媒体数据核心数据看板`}
        dataTypeLabel="神殿新媒体招生数据"
        dataType="神殿新媒体"
        campusName={campusName}
        year={year}
        onDataChange={handleDataChange}
      />
    </div>
  )
}

