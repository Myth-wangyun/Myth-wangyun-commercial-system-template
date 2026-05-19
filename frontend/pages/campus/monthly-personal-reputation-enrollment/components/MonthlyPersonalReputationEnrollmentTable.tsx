/**
 * 神殿教化司口碑招生月度个人目标与结果汇总表组件
 */

import React from 'react'
import { Card, Table, Button, Space, App } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined, EditOutlined } from '@ant-design/icons'
import type {
  MonthlyPersonalReputationEnrollmentTableProps,
  MonthlyPersonalReputationEnrollmentRecord,
} from '@/types/monthly-personal-reputation-enrollment'

const MonthlyPersonalReputationEnrollmentTable: React.FC<
  MonthlyPersonalReputationEnrollmentTableProps
> = ({ data, loading, onRefresh, onEdit, onExport }) => {
  const { message } = App.useApp()
  const handleEdit = (record: MonthlyPersonalReputationEnrollmentRecord) => {
    onEdit(record)
  }

  // 计算月份列合并
  const getMonthRowSpan = (record: MonthlyPersonalReputationEnrollmentRecord) => {
    if (record.rowType === 'month-subtotal' || record.rowType === 'total') {
      return 0
    }

    // 检查是否是该月份的第一行
    const currentIndex = data.indexOf(record)
    if (currentIndex > 0) {
      const prevRecord = data[currentIndex - 1]
      if (prevRecord.month === record.month && prevRecord.rowType !== 'month-subtotal') {
        // 不是第一行，返回0不显示
        return 0
      }
    }

    // 计算这个月份的所有行（包括合计行）
    const monthRows = data.filter((r) => r.month === record.month)

    return monthRows.length
  }

  const columns: ColumnsType<MonthlyPersonalReputationEnrollmentRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      render: (value, record) => {
        const rowSpan = getMonthRowSpan(record)

        if (record.rowType === 'total') {
          return {
            children: <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span>,
            props: { rowSpan: 1 },
          }
        }

        return {
          children: value,
          props: { rowSpan },
        }
      },
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (value, record) => {
        if (record.rowType === 'month-subtotal' || record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '口碑量',
      children: [
        {
          title: '目标口碑量',
          dataIndex: 'targetReputationVolume',
          key: 'targetReputationVolume',
          width: 120,
          align: 'center',
          render: (value, record) => {
            if (record.rowType !== 'data') {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value || '-'
          },
        },
        {
          title: '实际口碑量',
          dataIndex: 'actualReputationVolume',
          key: 'actualReputationVolume',
          width: 120,
          align: 'center',
          render: (value, record) => {
            if (record.rowType !== 'data') {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value || '-'
          },
        },
      ],
    },
    {
      title: '上门量',
      children: [
        {
          title: '目标上门量',
          dataIndex: 'targetWalkInVolume',
          key: 'targetWalkInVolume',
          width: 120,
          align: 'center',
          render: (value, record) => {
            if (record.rowType !== 'data') {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value || '-'
          },
        },
        {
          title: '实际上门量',
          dataIndex: 'actualWalkInVolume',
          key: 'actualWalkInVolume',
          width: 120,
          align: 'center',
          render: (value, record) => {
            if (record.rowType !== 'data') {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value || '-'
          },
        },
      ],
    },
    {
      title: '招生人数',
      children: [
        {
          title: '目标人数',
          dataIndex: 'targetEnrollmentCount',
          key: 'targetEnrollmentCount',
          width: 100,
          align: 'center',
          render: (value, record) => {
            if (record.rowType !== 'data') {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value || '-'
          },
        },
        {
          title: '实际人数',
          dataIndex: 'actualEnrollmentCount',
          key: 'actualEnrollmentCount',
          width: 100,
          align: 'center',
          render: (value, record) => {
            if (record.rowType !== 'data') {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value || '-'
          },
        },
      ],
    },
    {
      title: '口碑收入',
      children: [
        {
          title: '目标收入',
          dataIndex: 'targetRevenue',
          key: 'targetRevenue',
          width: 120,
          align: 'center',
          render: (value, record) => {
            if (record.rowType !== 'data') {
              return <span style={{ fontWeight: 'bold' }}>¥{value.toLocaleString()}</span>
            }
            return value ? `¥${value.toLocaleString()}` : '-'
          },
        },
        {
          title: '实际收入',
          dataIndex: 'actualRevenue',
          key: 'actualRevenue',
          width: 120,
          align: 'center',
          render: (value, record) => {
            if (record.rowType !== 'data') {
              return (
                <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
                  ¥{value.toLocaleString()}
                </span>
              )
            }
            return value ? `¥${value.toLocaleString()}` : '-'
          },
        },
      ],
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_: any, record: MonthlyPersonalReputationEnrollmentRecord) => {
        // 只有数据行显示操作按钮
        if (record.rowType !== 'data') {
          return ''
        }

        return (
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
        )
      },
    },
  ]

  return (
    <Card
      title="神殿教化司口碑招生月度个人目标与结果汇总表"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
            刷新
          </Button>
          <Button icon={<DownloadOutlined />} onClick={onExport} disabled={data.length === 0}>
            导出
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
        bordered
        scroll={{ x: 1200 }}
        rowKey="key"
        size="small"
        rowClassName={(record) => {
          if (record.rowType === 'total') {
            return 'table-row-total'
          }
          if (record.rowType === 'month-subtotal') {
            return 'table-row-month-subtotal'
          }
          return ''
        }}
      />

      <style>{`
        .table-row-total {
          background-color: #fff7e6;
          font-weight: bold;
        }
        .table-row-month-subtotal {
          background-color: #f0f0f0;
          font-weight: bold;
        }
      `}</style>
    </Card>
  )
}

export default MonthlyPersonalReputationEnrollmentTable
