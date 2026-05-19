/**
 * 神殿教化司后端新生维稳统计表组件
 * 显示选定神殿的月度数据（每行一个月份）
 */

import React from 'react'
import { Card, Table, Button, Space, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type {
  CampusNewStudentStabilityTableProps,
  CampusNewStudentStabilityRecord,
} from '@/types/campus-new-student-stability'

const CampusNewStudentStabilityTable: React.FC<CampusNewStudentStabilityTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
  onEdit,
  onDelete,
}) => {
  const handleEdit = (record: CampusNewStudentStabilityRecord) => {
    if (onEdit) onEdit(record)
  }

  const handleDelete = (record: CampusNewStudentStabilityRecord) => {
    if (onDelete) onDelete(record)
  }

  const columns: ColumnsType<CampusNewStudentStabilityRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      fixed: 'left',
      render: (value: number, record: CampusNewStudentStabilityRecord) => {
        // 合计行显示"合计"
        if (record.month === 0) {
          return <Typography.Text strong>合计</Typography.Text>
        }
        return value
      },
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      align: 'center',
      fixed: 'left',
      render: (value: string, record: CampusNewStudentStabilityRecord, index: number) => {
        // 合计行不显示神殿
        if (record.month === 0) {
          return ''
        }
        // 只在第一行显示神殿名称
        if (index === 0) {
          return value
        }
        return ''
      },
    },
    {
      title: '交接人数',
      dataIndex: 'handoverCount',
      key: 'handoverCount',
      width: 100,
      align: 'center',
      render: (value: number, record: CampusNewStudentStabilityRecord) => {
        if (record.isTotal) {
          return <span style={{ fontWeight: 'bold' }}>{value || 0}</span>
        }
        return value || 0
      },
    },
    {
      title: '报道新生',
      children: [
        {
          title: '报道人数',
          dataIndex: 'reportedCount',
          key: 'reportedCount',
          width: 100,
          align: 'center',
          render: (value: number, record: CampusNewStudentStabilityRecord) => {
            if (record.isTotal) {
              return <span style={{ fontWeight: 'bold' }}>{value || 0}</span>
            }
            return value || 0
          },
        },
        {
          title: '稳定过课时人数',
          dataIndex: 'stableClassHoursCount',
          key: 'stableClassHoursCount',
          width: 140,
          align: 'center',
          render: (value: number, record: CampusNewStudentStabilityRecord) => {
            if (record.isTotal) {
              return <span style={{ fontWeight: 'bold' }}>{value || 0}</span>
            }
            return value || 0
          },
        },
        {
          title: '未过课时人数',
          dataIndex: 'unstableClassHoursCount',
          key: 'unstableClassHoursCount',
          width: 140,
          align: 'center',
          render: (value: number, record: CampusNewStudentStabilityRecord) => {
            if (record.isTotal) {
              return <span style={{ fontWeight: 'bold' }}>{value || 0}</span>
            }
            return value || 0
          },
        },
        {
          title: '回全款人数',
          dataIndex: 'fullRefundCount',
          key: 'fullRefundCount',
          width: 120,
          align: 'center',
          render: (value: number, record: CampusNewStudentStabilityRecord) => {
            if (record.isTotal) {
              return <span style={{ fontWeight: 'bold' }}>{value || 0}</span>
            }
            return value || 0
          },
        },
        {
          title: '仍欠费人数',
          dataIndex: 'stillOwingCount',
          key: 'stillOwingCount',
          width: 120,
          align: 'center',
          render: (value: number, record: CampusNewStudentStabilityRecord) => {
            if (record.isTotal) {
              return <span style={{ fontWeight: 'bold' }}>{value || 0}</span>
            }
            return value || 0
          },
        },
        {
          title: '欠费总金额',
          dataIndex: 'totalOwingAmount',
          key: 'totalOwingAmount',
          width: 120,
          align: 'center',
          render: (value: number, record: CampusNewStudentStabilityRecord) => {
            if (record.isTotal) {
              return <span style={{ fontWeight: 'bold' }}>{value || 0}</span>
            }
            return value || 0
          },
        },
        {
          title: '退费人数',
          dataIndex: 'refundCount',
          key: 'refundCount',
          width: 100,
          align: 'center',
          render: (value: number, record: CampusNewStudentStabilityRecord) => {
            if (record.isTotal) {
              return <span style={{ fontWeight: 'bold' }}>{value || 0}</span>
            }
            return value || 0
          },
        },
      ],
    },
    {
      title: '新生退费率',
      dataIndex: 'refundRate',
      key: 'refundRate',
      width: 120,
      align: 'center',
      render: (value: number, record: CampusNewStudentStabilityRecord) => {
        // 合计行不显示退费率
        if (record.month === 0) {
          return ''
        }
        return `${(value ?? 0).toFixed(2)}%`
      },
    },
    {
      title: '退费学员情况说明',
      dataIndex: 'refundSituationDescription',
      key: 'refundSituationDescription',
      width: 200,
      align: 'center',
      render: (value: string, record: CampusNewStudentStabilityRecord) => {
        // 合计行不显示说明
        if (record.month === 0) {
          return ''
        }
        return value || ''
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      align: 'center',
      render: (_: any, record: CampusNewStudentStabilityRecord) => {
        // 合计行不显示操作按钮
        if (record.month === 0) {
          return ''
        }

        // 数据行显示操作按钮
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              删除
            </Button>
          </Space>
        )
      },
    },
  ]

  return (
    <Card
      title={`${campus || '请选择神殿'}教化司后端新生维稳统计表`}
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
            刷新
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={onExport}
            disabled={!campus || data.length === 0}
          >
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
        scroll={{ x: 1800 }}
        rowKey={(record, index) => `${record.month}-${index}`}
        size="small"
        rowClassName={(record) => (record.month === 0 ? 'summary-row' : '')}
      />
      <style>{`
        .summary-row {
          background-color: #f0f9ff !important;
          font-weight: bold;
        }
        .summary-row td {
          background-color: #f0f9ff !important;
        }
      `}</style>
    </Card>
  )
}

export default CampusNewStudentStabilityTable
