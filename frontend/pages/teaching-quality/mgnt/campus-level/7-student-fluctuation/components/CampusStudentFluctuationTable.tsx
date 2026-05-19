import React from 'react'
import { App, Table, Card, Button, Space, Tooltip, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  ExportOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  UserDeleteOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  CalendarOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import type {
  CampusStudentFluctuationRecord,
  CampusStudentFluctuationTableProps,
} from '@/types/campus-student-fluctuation'

const CampusStudentFluctuationTable: React.FC<CampusStudentFluctuationTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
  onEdit,
  onAdd,
}) => {
  const { message } = App.useApp()
  const columns: ColumnsType<CampusStudentFluctuationRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      render: (value, record, index) => {
        if (index === data.length - 1) {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>合计/平均</span>
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
        if (index === 0) {
          return value
        }
        return ''
      },
    },
    {
      title: '累计带生人数',
      dataIndex: 'cumulativeStudentCount',
      key: 'cumulativeStudentCount',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '新生退费人数',
      dataIndex: 'newStudentRefundCount',
      key: 'newStudentRefundCount',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '老生退费人数',
      dataIndex: 'oldStudentRefundCount',
      key: 'oldStudentRefundCount',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '退费总人数',
      dataIndex: 'totalRefundCount',
      key: 'totalRefundCount',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '退费率',
      dataIndex: 'refundRate',
      key: 'refundRate',
      width: 100,
      align: 'center',
      render: (value, record, index) => {
        if (index === data.length - 1) {
          return (
            <span style={{ fontWeight: 'bold', color: value > 5 ? 'red' : 'inherit' }}>
              {value.toFixed(2)}%
            </span>
          )
        }
        return (
          <Tag color={value > 5 ? 'red' : value > 2 ? 'orange' : 'green'}>{value.toFixed(2)}%</Tag>
        )
      },
    },
    {
      title: '休学总人数',
      dataIndex: 'suspensionCount',
      key: 'suspensionCount',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '长期请假总人数',
      dataIndex: 'longTermLeaveCount',
      key: 'longTermLeaveCount',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '长期不上课总人数',
      dataIndex: 'longTermAbsenceCount',
      key: 'longTermAbsenceCount',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '寒暑假学生总数',
      dataIndex: 'vacationStudentCount',
      key: 'vacationStudentCount',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '其他情况总人数',
      dataIndex: 'otherSituationCount',
      key: 'otherSituationCount',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '异动总人数',
      dataIndex: 'totalFluctuationCount',
      key: 'totalFluctuationCount',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '异动率',
      dataIndex: 'fluctuationRate',
      key: 'fluctuationRate',
      width: 100,
      align: 'center',
      render: (value, record, index) => {
        if (index === data.length - 1) {
          return (
            <span style={{ fontWeight: 'bold', color: value > 10 ? 'red' : 'inherit' }}>
              {value.toFixed(2)}%
            </span>
          )
        }
        return (
          <Tag color={value > 10 ? 'red' : value > 5 ? 'orange' : 'green'}>{value.toFixed(2)}%</Tag>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_, record, index) => {
        // 合计行不显示操作按钮
        if (index === data.length - 1) {
          return ''
        }
        return (
          <Space size="small">
            <Tooltip title="编辑">
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
                size="small"
              />
            </Tooltip>
          </Space>
        )
      },
    },
  ]

  const handleExport = () => {
    message.success('导出功能开发中...')
    onExport()
  }

  return (
    <Card>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ExclamationCircleOutlined style={{ color: '#f5222d', fontSize: '18px' }} />
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
            {campus ? `${campus}${campus.endsWith('神殿') ? '' : '神殿'}学员异动数据` : '请选择神殿查看数据'}
          </span>
        </div>
        <Space>
          <Tooltip title="刷新数据">
            <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
              刷新
            </Button>
          </Tooltip>
          <Tooltip title="导出数据">
            <Button
              icon={<ExportOutlined />}
              onClick={handleExport}
              disabled={!campus || data.length === 0}
            >
              导出
            </Button>
          </Tooltip>
          <Tooltip title="新增记录">
            <Button type="primary" icon={<PlusOutlined />} onClick={onAdd} disabled={!campus}>
              新增
            </Button>
          </Tooltip>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
        scroll={{ x: 1800 }}
        size="small"
        bordered
        rowKey="key"
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={14}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#666' }}>
                  <ExclamationCircleOutlined style={{ marginRight: 8 }} />
                  数据说明：退费率 = 退费总人数 ÷ 累计带生人数 × 100%，异动率 = 异动总人数 ÷
                  累计带生人数 × 100%
                </div>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </Card>
  )
}

export default CampusStudentFluctuationTable
