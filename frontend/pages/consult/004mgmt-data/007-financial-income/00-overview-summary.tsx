import React from 'react'
import { Card, Spin, Table } from 'antd'
import { FileTextOutlined, SyncOutlined } from '@ant-design/icons'

interface OverviewSummaryProps {
  year: string
  loading?: boolean
  summaryData: {
    planIncome: number
    actualIncome: number
    planCount: number
    actualCount: number
    refundCount: number
  }
}

/**
 * 顶部总览 - 最高议事厅核心数据计划
 * 数据来自TAB1各子表的合计汇总
 */
export default function OverviewSummary({ year, loading = false, summaryData }: OverviewSummaryProps) {
  const columns = [
    {
      title: '最高议事厅',
      dataIndex: 'label',
      key: 'label',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '招生收入',
      children: [
        {
          title: '计划收入',
          dataIndex: 'planIncome',
          key: 'planIncome',
          width: 120,
          align: 'right' as const,
          render: (val: number) => val || 0,
        },
        {
          title: '实际收入',
          dataIndex: 'actualIncome',
          key: 'actualIncome',
          width: 120,
          align: 'right' as const,
          render: (val: number) => val || 0,
        },
      ],
    },
    {
      title: '招生数据',
      children: [
        {
          title: '计划人数',
          dataIndex: 'planCount',
          key: 'planCount',
          width: 100,
          align: 'right' as const,
          render: (val: number) => val || 0,
        },
        {
          title: '实际人数',
          dataIndex: 'actualCount',
          key: 'actualCount',
          width: 100,
          align: 'right' as const,
          render: (val: number) => val || 0,
        },
        {
          title: '退费人数',
          dataIndex: 'refundCount',
          key: 'refundCount',
          width: 100,
          align: 'right' as const,
          render: (val: number) => val || 0,
        },
      ],
    },
  ]

  const dataSource = [
    {
      key: '1',
      label: '',
      ...summaryData,
    },
  ]

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
          最高议事厅 {year}年核心数据计划
        </div>
        <div style={{ fontSize: 11, color: '#888' }}>
          <SyncOutlined spin={loading} style={{ marginRight: 4 }} />
          数据来自各子表合计汇总
        </div>
      </div>

      <Spin spinning={loading}>
        <Table
          columns={columns as any}
          dataSource={dataSource}
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
  )
}
