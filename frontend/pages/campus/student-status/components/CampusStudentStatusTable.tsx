import React from 'react'
import { Table, Card, Button, Space, Tooltip, Tag, App } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  ExportOutlined,
  UserOutlined,
  BookOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import type {
  CampusStudentStatusRecord,
  CampusStudentStatusTableProps,
} from '@/types/campus-student-status'

const CampusStudentStatusTable: React.FC<CampusStudentStatusTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
  onEdit,
  onAdd,
}) => {
  const { message } = App.useApp()
  const columns: ColumnsType<CampusStudentStatusRecord> = [
    {
      title: '序号',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      render: (value, record, index) => {
        if (index === data.length - 1) {
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
        if (index === 0) {
          return value
        }
        return ''
      },
    },
    {
      title: '中专层次',
      align: 'center',
      children: [
        {
          title: '中专3年学籍注册人数',
          dataIndex: 'vocationalThreeYearCount',
          key: 'vocationalThreeYearCount',
          width: 150,
          align: 'center',
          render: (value, record, index) => {
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value
          },
        },
        {
          title: '中专1年制人数',
          dataIndex: 'vocationalOneYearCount',
          key: 'vocationalOneYearCount',
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
          title: '其他已注册人数',
          dataIndex: 'vocationalOtherRegisteredCount',
          key: 'vocationalOtherRegisteredCount',
          width: 130,
          align: 'center',
          render: (value, record, index) => {
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value
          },
        },
        {
          title: '目标注册人数',
          dataIndex: 'vocationalTargetCount',
          key: 'vocationalTargetCount',
          width: 130,
          align: 'center',
          render: (value, record, index) => {
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value
          },
        },
        {
          title: '目标注册时间',
          dataIndex: 'vocationalTargetTime',
          key: 'vocationalTargetTime',
          width: 130,
          align: 'center',
          render: (value, record, index) => {
            if (index === data.length - 1) {
              return ''
            }
            return value
          },
        },
        {
          title: '实际注册人数',
          dataIndex: 'vocationalActualCount',
          key: 'vocationalActualCount',
          width: 130,
          align: 'center',
          render: (value, record, index) => {
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            const targetCount = record.vocationalTargetCount
            const completionRate = targetCount > 0 ? (value / targetCount) * 100 : 0
            return (
              <div>
                <div>{value}</div>
                <Tag
                  color={completionRate >= 80 ? 'green' : completionRate >= 60 ? 'orange' : 'red'}
                >
                  {completionRate.toFixed(1)}%
                </Tag>
              </div>
            )
          },
        },
      ],
    },
    {
      title: '大学层次',
      align: 'center',
      children: [
        {
          title: '成考注册人数',
          dataIndex: 'adultExamCount',
          key: 'adultExamCount',
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
          title: '国开注册人数',
          dataIndex: 'nationalOpenCount',
          key: 'nationalOpenCount',
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
          title: '其他已注册人数',
          dataIndex: 'universityOtherRegisteredCount',
          key: 'universityOtherRegisteredCount',
          width: 130,
          align: 'center',
          render: (value, record, index) => {
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value
          },
        },
        {
          title: '目标注册人数',
          dataIndex: 'universityTargetCount',
          key: 'universityTargetCount',
          width: 130,
          align: 'center',
          render: (value, record, index) => {
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value
          },
        },
        {
          title: '目标注册时间',
          dataIndex: 'universityTargetTime',
          key: 'universityTargetTime',
          width: 130,
          align: 'center',
          render: (value, record, index) => {
            if (index === data.length - 1) {
              return ''
            }
            return value
          },
        },
        {
          title: '实际注册人数',
          dataIndex: 'universityActualCount',
          key: 'universityActualCount',
          width: 130,
          align: 'center',
          render: (value, record, index) => {
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            const targetCount = record.universityTargetCount
            const completionRate = targetCount > 0 ? (value / targetCount) * 100 : 0
            return (
              <div>
                <div>{value}</div>
                <Tag
                  color={completionRate >= 80 ? 'green' : completionRate >= 60 ? 'orange' : 'red'}
                >
                  {completionRate.toFixed(1)}%
                </Tag>
              </div>
            )
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
      render: (_, record, index) => {
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

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            <BookOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {campus}神殿教化司学籍统计表
          </span>
          <Space>
            <Tooltip title="新增记录">
              <Button type="primary" icon={<PlusOutlined />} onClick={onAdd} size="small">
                新增
              </Button>
            </Tooltip>
            <Tooltip title="刷新数据">
              <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading} size="small">
                刷新
              </Button>
            </Tooltip>
            <Tooltip title="导出数据">
              <Button icon={<ExportOutlined />} onClick={onExport} size="small">
                导出
              </Button>
            </Tooltip>
          </Space>
        </div>
      }
      style={{ marginBottom: 16 }}
    >
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
        scroll={{ x: 1500 }}
        size="small"
        bordered
        rowKey="key"
        style={{
          fontSize: '12px',
        }}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={2}>
                <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2}>
                <span style={{ fontWeight: 'bold' }}>
                  {data.slice(0, -1).reduce((sum, item) => sum + item.vocationalThreeYearCount, 0)}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3}>
                <span style={{ fontWeight: 'bold' }}>
                  {data.slice(0, -1).reduce((sum, item) => sum + item.vocationalOneYearCount, 0)}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4}>
                <span style={{ fontWeight: 'bold' }}>
                  {data
                    .slice(0, -1)
                    .reduce((sum, item) => sum + item.vocationalOtherRegisteredCount, 0)}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5}>
                <span style={{ fontWeight: 'bold' }}>
                  {data.slice(0, -1).reduce((sum, item) => sum + item.vocationalTargetCount, 0)}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6}></Table.Summary.Cell>
              <Table.Summary.Cell index={7}>
                <span style={{ fontWeight: 'bold' }}>
                  {data.slice(0, -1).reduce((sum, item) => sum + item.vocationalActualCount, 0)}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8}>
                <span style={{ fontWeight: 'bold' }}>
                  {data.slice(0, -1).reduce((sum, item) => sum + item.adultExamCount, 0)}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={9}>
                <span style={{ fontWeight: 'bold' }}>
                  {data.slice(0, -1).reduce((sum, item) => sum + item.nationalOpenCount, 0)}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={10}>
                <span style={{ fontWeight: 'bold' }}>
                  {data
                    .slice(0, -1)
                    .reduce((sum, item) => sum + item.universityOtherRegisteredCount, 0)}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={11}>
                <span style={{ fontWeight: 'bold' }}>
                  {data.slice(0, -1).reduce((sum, item) => sum + item.universityTargetCount, 0)}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={12}></Table.Summary.Cell>
              <Table.Summary.Cell index={13}>
                <span style={{ fontWeight: 'bold' }}>
                  {data.slice(0, -1).reduce((sum, item) => sum + item.universityActualCount, 0)}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={14}></Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </Card>
  )
}

export default CampusStudentStatusTable
