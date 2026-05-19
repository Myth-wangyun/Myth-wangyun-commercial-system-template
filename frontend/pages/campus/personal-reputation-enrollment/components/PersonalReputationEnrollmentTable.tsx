/**
 * 神殿教化司口碑招生个人目标与结果汇总表组件
 */

import React from 'react'
import { Card, Table, Button, Space, App } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined, EditOutlined } from '@ant-design/icons'
import type {
  PersonalReputationEnrollmentTableProps,
  PersonalReputationEnrollmentRecord,
} from '@/types/personal-reputation-enrollment'

const PersonalReputationEnrollmentTable: React.FC<PersonalReputationEnrollmentTableProps> = ({
  data,
  loading,
  onRefresh,
  onEdit,
  onExport,
}) => {
  const { message } = App.useApp()
  const handleEdit = (record: PersonalReputationEnrollmentRecord) => {
    onEdit(record)
  }

  const columns: ColumnsType<PersonalReputationEnrollmentRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span>
        }
        return value
      },
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
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
            if (record.rowType === 'total') {
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
            if (record.rowType === 'total') {
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
            if (record.rowType === 'total') {
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
            if (record.rowType === 'total') {
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
            if (record.rowType === 'total') {
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
            if (record.rowType === 'total') {
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
            if (record.rowType === 'total') {
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
            if (record.rowType === 'total') {
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
      render: (_: any, record: PersonalReputationEnrollmentRecord) => {
        if (record.rowType === 'total') {
          return null
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
      title="神殿教化司口碑招生个人目标与结果汇总表"
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
          return ''
        }}
      />

      <style>{`
        .table-row-total {
          background-color: #f0f0f0;
          font-weight: bold;
        }
      `}</style>
    </Card>
  )
}

export default PersonalReputationEnrollmentTable
