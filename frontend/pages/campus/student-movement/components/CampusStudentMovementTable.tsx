/**
 * 神殿教化司学员异动表组件
 * 显示选定神殿的月度数据（每行一个月份）
 */

import React from 'react'
import { Card, Table, Button, Space, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type {
  CampusStudentMovementTableProps,
  CampusStudentMovementRecord,
} from '@/types/campus-student-movement'

const CampusStudentMovementTable: React.FC<CampusStudentMovementTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
  onEdit,
  onDelete,
}) => {
  const handleEdit = (record: CampusStudentMovementRecord) => {
    if (onEdit) onEdit(record)
  }

  const handleDelete = (record: CampusStudentMovementRecord) => {
    if (onDelete) onDelete(record)
  }

  const columns: ColumnsType<CampusStudentMovementRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      fixed: 'left',
      render: (value: number, record: CampusStudentMovementRecord) => {
        if (record.isTotal) {
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
      render: (value: string, record: CampusStudentMovementRecord, index: number) => {
        if (record.isTotal) {
          return ''
        }
        if (index === 0) {
          return value
        }
        return ''
      },
    },
    {
      title: '累计带生人数',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
      width: 140,
      align: 'center',
      render: (value: number, record: CampusStudentMovementRecord) => {
        if (record.isTotal) {
          return <span style={{ fontWeight: 'bold' }}>{value || 0}</span>
        }
        return value || 0
      },
    },
    {
      title: '新生退费人数',
      dataIndex: 'newStudentRefund',
      key: 'newStudentRefund',
      width: 120,
      align: 'center',
      render: (value: number, record: CampusStudentMovementRecord) => {
        if (record.isTotal) {
          return <span style={{ fontWeight: 'bold' }}>{value || 0}</span>
        }
        return value || 0
      },
    },
    {
      title: '老生退费人数',
      dataIndex: 'oldStudentRefund',
      key: 'oldStudentRefund',
      width: 120,
      align: 'center',
      render: (value: number, record: CampusStudentMovementRecord) => {
        if (record.isTotal) {
          return <span style={{ fontWeight: 'bold' }}>{value || 0}</span>
        }
        return value || 0
      },
    },
    {
      title: '退费总人数',
      dataIndex: 'totalRefund',
      key: 'totalRefund',
      width: 120,
      align: 'center',
      render: (value: number, record: CampusStudentMovementRecord) => {
        if (record.isTotal) {
          return <span style={{ fontWeight: 'bold' }}>{value || 0}</span>
        }
        return value || 0
      },
    },
    {
      title: '退费率',
      dataIndex: 'refundRate',
      key: 'refundRate',
      width: 100,
      align: 'center',
      render: (value: string, record: CampusStudentMovementRecord) => {
        if (record.isTotal) {
          return ''
        }
        return value || '#DIV/0!'
      },
    },
    {
      title: '休学总人数',
      dataIndex: 'suspensionTotal',
      key: 'suspensionTotal',
      width: 120,
      align: 'center',
      render: (value: number, record: CampusStudentMovementRecord) => {
        if (record.isTotal) {
          return <span style={{ fontWeight: 'bold' }}>{value || 0}</span>
        }
        return value || 0
      },
    },
    {
      title: '长期请假总人数',
      dataIndex: 'longLeaveTotal',
      key: 'longLeaveTotal',
      width: 140,
      align: 'center',
      render: (value: number, record: CampusStudentMovementRecord) => {
        if (record.isTotal) {
          return <span style={{ fontWeight: 'bold' }}>{value || 0}</span>
        }
        return value || 0
      },
    },
    {
      title: '长期不上课总人数',
      dataIndex: 'longAbsenceTotal',
      key: 'longAbsenceTotal',
      width: 160,
      align: 'center',
      render: (value: number, record: CampusStudentMovementRecord) => {
        if (record.isTotal) {
          return <span style={{ fontWeight: 'bold' }}>{value || 0}</span>
        }
        return value || 0
      },
    },
    {
      title: '寒暑假学生总数',
      dataIndex: 'holidayStudentTotal',
      key: 'holidayStudentTotal',
      width: 140,
      align: 'center',
      render: (value: number, record: CampusStudentMovementRecord) => {
        if (record.isTotal) {
          return <span style={{ fontWeight: 'bold' }}>{value || 0}</span>
        }
        return value || 0
      },
    },
    {
      title: '其他情况总人数',
      dataIndex: 'otherCasesTotal',
      key: 'otherCasesTotal',
      width: 140,
      align: 'center',
      render: (value: number, record: CampusStudentMovementRecord) => {
        if (record.isTotal) {
          return <span style={{ fontWeight: 'bold' }}>{value || 0}</span>
        }
        return value || 0
      },
    },
    {
      title: '异动总人数',
      dataIndex: 'movementTotal',
      key: 'movementTotal',
      width: 120,
      align: 'center',
      render: (value: number, record: CampusStudentMovementRecord) => {
        if (record.isTotal) {
          return <span style={{ fontWeight: 'bold' }}>{value || 0}</span>
        }
        return value || 0
      },
    },
    {
      title: '异动率',
      dataIndex: 'movementRate',
      key: 'movementRate',
      width: 100,
      align: 'center',
      render: (value: string, record: CampusStudentMovementRecord) => {
        if (record.isTotal) {
          return ''
        }
        return value || '#DIV/0!'
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      align: 'center',
      render: (_: any, record: CampusStudentMovementRecord) => {
        if (record.isTotal) {
          return ''
        }

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
      title={`${campus || '请选择神殿'}教化司学员异动表`}
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
        scroll={{ x: 2000 }}
        rowKey={(record, index) => `${record.month}-${index}`}
        size="small"
        rowClassName={(record) => (record.isTotal ? 'summary-row' : '')}
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

export default CampusStudentMovementTable
