/**
 * 神殿教化司新生仍欠费明细表组件
 */

import React from 'react'
import { Card, Table, Button, Space, Row, Col, Statistic } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ReloadOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import type {
  OutstandingFeesDetailTableProps,
  OutstandingFeesDetailRecord,
} from '@/types/outstanding-fees-detail'

const OutstandingFeesDetailTable: React.FC<OutstandingFeesDetailTableProps> = ({
  data,
  loading,
  onRefresh,
  onEdit,
  onDelete,
  onExport,
}) => {
  const handleEdit = (record: OutstandingFeesDetailRecord) => {
    onEdit(record)
  }

  const handleDelete = (record: OutstandingFeesDetailRecord) => {
    onDelete(record)
  }

  // 计算统计数据
  const stats = React.useMemo(() => {
    if (data.length === 0) {
      return {
        totalRecords: 0,
        totalReceivableTuition: 0,
        totalRegistrationPayment: 0,
        totalSupplementaryPayment: 0,
        totalOutstandingAmount: 0,
      }
    }

    const dataRows = data.filter((r) => r.rowType === 'data')
    const totalRow = data.find((r) => r.rowType === 'total')

    return {
      totalRecords: dataRows.length,
      totalReceivableTuition: totalRow?.receivableTuition || 0,
      totalRegistrationPayment: totalRow?.registrationPayment || 0,
      totalSupplementaryPayment: totalRow?.supplementaryPayment || 0,
      totalOutstandingAmount: totalRow?.outstandingAmount || 0,
    }
  }, [data])

  const columns: ColumnsType<OutstandingFeesDetailRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      fixed: 'left',
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span>
        }
        return value
      },
    },
    {
      title: '班主任姓名',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 100,
      fixed: 'left',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return ''
        }
        return value
      },
    },
    {
      title: '新生姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 100,
      render: (value, record) => {
        if (record.rowType === 'total') {
          return ''
        }
        return value
      },
    },
    {
      title: '报名时间',
      dataIndex: 'registrationTime',
      key: 'registrationTime',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return ''
        }
        return value
      },
    },
    {
      title: '报道时间',
      dataIndex: 'reportingTime',
      key: 'reportingTime',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return ''
        }
        return value
      },
    },
    {
      title: '报名专业',
      dataIndex: 'major',
      key: 'major',
      width: 120,
      render: (value, record) => {
        if (record.rowType === 'total') {
          return ''
        }
        return value
      },
    },
    {
      title: '报名学制',
      dataIndex: 'academicSystem',
      key: 'academicSystem',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return ''
        }
        return value
      },
    },
    {
      title: '应收学费',
      dataIndex: 'receivableTuition',
      key: 'receivableTuition',
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
      title: '报名交费金额',
      dataIndex: 'registrationPayment',
      key: 'registrationPayment',
      width: 130,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>¥{value.toLocaleString()}</span>
        }
        return value ? `¥${value.toLocaleString()}` : '-'
      },
    },
    {
      title: '补款金额',
      dataIndex: 'supplementaryPayment',
      key: 'supplementaryPayment',
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
      title: '仍欠费金额',
      dataIndex: 'outstandingAmount',
      key: 'outstandingAmount',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return (
            <span style={{ fontWeight: 'bold', color: '#f5222d' }}>¥{value.toLocaleString()}</span>
          )
        }
        return value ? (
          <span style={{ color: value > 0 ? '#f5222d' : '#52c41a' }}>
            ¥{value.toLocaleString()}
          </span>
        ) : (
          '-'
        )
      },
    },
    {
      title: '是否全款',
      dataIndex: 'isFullPayment',
      key: 'isFullPayment',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return ''
        }
        return value || '-'
      },
    },
    {
      title: '是否贷款',
      dataIndex: 'isLoan',
      key: 'isLoan',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return ''
        }
        return value || '-'
      },
    },
    {
      title: '是否过课时',
      dataIndex: 'exceededClassHours',
      key: 'exceededClassHours',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return ''
        }
        return value || '-'
      },
    },
    {
      title: '试学周期',
      dataIndex: 'trialPeriod',
      key: 'trialPeriod',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return ''
        }
        return value || '-'
      },
    },
    {
      title: '是否退费',
      dataIndex: 'isRefunded',
      key: 'isRefunded',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return ''
        }
        return value || '-'
      },
    },
    {
      title: '退费情况说明',
      dataIndex: 'refundExplanation',
      key: 'refundExplanation',
      width: 150,
      render: (value, record) => {
        if (record.rowType === 'total') {
          return ''
        }
        return value || '-'
      },
    },
    {
      title: '咨询师',
      dataIndex: 'consultant',
      key: 'consultant',
      width: 100,
      render: (value, record) => {
        if (record.rowType === 'total') {
          return ''
        }
        return value || '-'
      },
    },
    {
      title: '是否住宿',
      dataIndex: 'isAccommodation',
      key: 'isAccommodation',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return ''
        }
        return value || '-'
      },
    },
    {
      title: '宿舍名称',
      dataIndex: 'dormitoryName',
      key: 'dormitoryName',
      width: 120,
      render: (value, record) => {
        if (record.rowType === 'total') {
          return ''
        }
        return value || '-'
      },
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 120,
      render: (value, record) => {
        if (record.rowType === 'total') {
          return ''
        }
        return value || '-'
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: any, record: OutstandingFeesDetailRecord) => {
        if (record.rowType === 'total') {
          return null
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
    <div>
      {/* 统计卡片 */}
      {data.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="总记录数"
                value={stats.totalRecords}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总应收学费"
                value={stats.totalReceivableTuition}
                precision={0}
                prefix="¥"
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总报名交费金额"
                value={stats.totalRegistrationPayment}
                precision={0}
                prefix="¥"
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总仍欠费金额"
                value={stats.totalOutstandingAmount}
                precision={0}
                prefix="¥"
                valueStyle={{ color: '#f5222d' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title="神殿教化司新生仍欠费明细表"
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
          scroll={{ x: 2800 }}
          rowKey="key"
          size="small"
          rowClassName={(record) => {
            if (record.rowType === 'total') {
              return 'table-row-total'
            }
            return ''
          }}
        />
      </Card>

      <style>{`
        .table-row-total {
          background-color: #fff7e6;
          font-weight: bold;
        }
      `}</style>
    </div>
  )
}

export default OutstandingFeesDetailTable
