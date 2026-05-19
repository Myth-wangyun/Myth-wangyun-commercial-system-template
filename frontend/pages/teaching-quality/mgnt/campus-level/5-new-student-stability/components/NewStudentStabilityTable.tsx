/**
 * 神殿教化司新生当月维稳统计表组件
 */

import React from 'react'
import { Card, Table, Button, Space, Row, Col, Statistic, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined, UserOutlined } from '@ant-design/icons'
import type {
  NewStudentStabilityTableProps,
  NewStudentStabilityRecord,
} from '@/types/new-student-stability'

const NewStudentStabilityTable: React.FC<NewStudentStabilityTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
}) => {
  // 计算统计数据
  const stats = React.useMemo(() => {
    if (data.length === 0) {
      return {
        totalHandoverCount: 0,
        totalReportedCount: 0,
        totalStableCount: 0,
        totalMissedCount: 0,
        totalFullPaymentCount: 0,
        totalStillOwingFeesCount: 0,
        totalOwingAmount: 0,
        totalRefundCount: 0,
        averageRefundRate: 0,
      }
    }

    const dataRows = data.filter((r) => r.rowType === 'data')
    const totalRow = data.find((r) => r.rowType === 'total')

    return {
      totalHandoverCount: totalRow?.handoverCount || 0,
      totalReportedCount: totalRow?.reportedCount || 0,
      totalStableCount: totalRow?.stableClassAttendanceCount || 0,
      totalMissedCount: totalRow?.missedClassAttendanceCount || 0,
      totalFullPaymentCount: totalRow?.fullPaymentCount || 0,
      totalStillOwingFeesCount: totalRow?.stillOwingFeesCount || 0,
      totalOwingAmount: totalRow?.totalOwingAmount || 0,
      totalRefundCount: totalRow?.refundCount || 0,
      averageRefundRate: totalRow?.refundRate || 0,
    }
  }, [data])

  const columns: ColumnsType<NewStudentStabilityRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
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
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      align: 'center',
      render: (value, record, index) => {
        // 只在第一行显示神殿
        if (index === 0 && record.rowType === 'data') {
          return value
        }
        if (record.rowType === 'total') {
          return null
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
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || '-'
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
          render: (value, record) => {
            if (record.rowType === 'total') {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value || '-'
          },
        },
        {
          title: '稳定过课时人数',
          dataIndex: 'stableClassAttendanceCount',
          key: 'stableClassAttendanceCount',
          width: 140,
          align: 'center',
          render: (value, record) => {
            if (record.rowType === 'total') {
              return <span style={{ fontWeight: 'bold', color: '#52c41a' }}>{value}</span>
            }
            return value || '-'
          },
        },
        {
          title: '未过课时人数',
          dataIndex: 'missedClassAttendanceCount',
          key: 'missedClassAttendanceCount',
          width: 120,
          align: 'center',
          render: (value, record) => {
            if (record.rowType === 'total') {
              return <span style={{ fontWeight: 'bold', color: '#faad14' }}>{value}</span>
            }
            return value || '-'
          },
        },
        {
          title: '回全款人数',
          dataIndex: 'fullPaymentCount',
          key: 'fullPaymentCount',
          width: 100,
          align: 'center',
          render: (value, record) => {
            if (record.rowType === 'total') {
              return <span style={{ fontWeight: 'bold', color: '#52c41a' }}>{value}</span>
            }
            return value || '-'
          },
        },
        {
          title: '仍欠费人数',
          dataIndex: 'stillOwingFeesCount',
          key: 'stillOwingFeesCount',
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
          title: '欠费总金额',
          dataIndex: 'totalOwingAmount',
          key: 'totalOwingAmount',
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
          title: '退费人数',
          dataIndex: 'refundCount',
          key: 'refundCount',
          width: 100,
          align: 'center',
          render: (value, record) => {
            if (record.rowType === 'total') {
              return <span style={{ fontWeight: 'bold', color: '#f5222d' }}>{value}</span>
            }
            return value || '-'
          },
        },
        {
          title: '新生退费率',
          dataIndex: 'refundRate',
          key: 'refundRate',
          width: 100,
          align: 'center',
          render: (value, record) => {
            if (record.rowType === 'total') {
              return <span style={{ fontWeight: 'bold' }}>{value}%</span>
            }
            return value ? `${value}%` : '-'
          },
        },
        {
          title: '退费学员情况说明',
          dataIndex: 'refundStudentInfo',
          key: 'refundStudentInfo',
          width: 200,
          render: (value) => value || '-',
        },
      ],
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
                title="总交接人数"
                value={stats.totalHandoverCount}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总报道人数"
                value={stats.totalReportedCount}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总退费人数"
                value={stats.totalRefundCount}
                valueStyle={{ color: '#f5222d' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均退费率"
                value={stats.averageRefundRate}
                suffix="%"
                valueStyle={{
                  color: stats.averageRefundRate <= 2 ? '#52c41a' : '#faad14',
                }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={`${campus || '请选择神殿'}神殿教化司新生当月维稳统计表`}
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
          scroll={{ x: 1600 }}
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

export default NewStudentStabilityTable
