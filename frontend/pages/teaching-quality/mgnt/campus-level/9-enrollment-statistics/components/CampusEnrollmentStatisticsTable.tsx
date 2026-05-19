import React from 'react'
import { Table, Button, Space, Popconfirm, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  CampusEnrollmentStatisticsRecord,
  CampusEnrollmentStatisticsTableProps,
} from '@/types/campus-enrollment-statistics'
import './CampusEnrollmentStatisticsTable.css'

const CampusEnrollmentStatisticsTable: React.FC<CampusEnrollmentStatisticsTableProps> = ({
  dataSource,
  loading,
  onEdit,
  onDelete,
}) => {
  const columns: ColumnsType<CampusEnrollmentStatisticsRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      fixed: 'left',
      render: (value: number, record: CampusEnrollmentStatisticsRecord) => {
        if (record.isTotal) {
          return <Typography.Text strong>合计</Typography.Text>
        }
        return `${value}月`
      },
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 120,
      fixed: 'left',
      render: (value: string, record: CampusEnrollmentStatisticsRecord) => {
        if (record.isTotal) {
          return ''
        }
        return value
      },
    },
    {
      title: '中专层次',
      children: [
        {
          title: '中专3年学籍注册人数',
          dataIndex: 'vocational3YearRegistered',
          key: 'vocational3YearRegistered',
          width: 160,
          render: (value: number) => value,
        },
        {
          title: '中专1年制人数',
          dataIndex: 'vocational1YearRegistered',
          key: 'vocational1YearRegistered',
          width: 140,
          render: (value: number) => value,
        },
        {
          title: '其他已注册人数',
          dataIndex: 'vocationalOtherRegistered',
          key: 'vocationalOtherRegistered',
          width: 140,
          render: (value: number) => value,
        },
        {
          title: '目标注册人数',
          dataIndex: 'vocationalTargetCount',
          key: 'vocationalTargetCount',
          width: 130,
          render: (value: number) => value,
        },
        {
          title: '目标注册时间',
          dataIndex: 'vocationalTargetTime',
          key: 'vocationalTargetTime',
          width: 130,
          render: (value: string, record: CampusEnrollmentStatisticsRecord) => {
            if (record.isTotal) return ''
            return value
          },
        },
        {
          title: '实际注册人数',
          dataIndex: 'vocationalActualRegistered',
          key: 'vocationalActualRegistered',
          width: 130,
          render: (value: number) => value,
        },
      ],
    },
    {
      title: '大学层次',
      children: [
        {
          title: '成考注册人数',
          dataIndex: 'adultExamRegistered',
          key: 'adultExamRegistered',
          width: 130,
          render: (value: number) => value,
        },
        {
          title: '国开注册人数',
          dataIndex: 'openUniversityRegistered',
          key: 'openUniversityRegistered',
          width: 130,
          render: (value: number) => value,
        },
        {
          title: '其他已注册人数',
          dataIndex: 'universityOtherRegistered',
          key: 'universityOtherRegistered',
          width: 140,
          render: (value: number) => value,
        },
        {
          title: '目标注册人数',
          dataIndex: 'universityTargetCount',
          key: 'universityTargetCount',
          width: 130,
          render: (value: number) => value,
        },
        {
          title: '目标注册时间',
          dataIndex: 'universityTargetTime',
          key: 'universityTargetTime',
          width: 130,
          render: (value: string, record: CampusEnrollmentStatisticsRecord) => {
            if (record.isTotal) return ''
            return value
          },
        },
        {
          title: '实际注册人数',
          dataIndex: 'universityActualRegistered',
          key: 'universityActualRegistered',
          width: 130,
          render: (value: number) => value,
        },
      ],
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: any, record: CampusEnrollmentStatisticsRecord) => {
        if (record.isTotal) {
          return ''
        }
        return (
          <Space size="small">
            <Button type="link" onClick={() => onEdit?.(record)}>
              编辑
            </Button>
            <Popconfirm
              title="确定要删除这条记录吗？"
              onConfirm={() => onDelete?.(record.key)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger>
                删除
              </Button>
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      pagination={false}
      scroll={{ x: 1800, y: 600 }}
      bordered
      rowClassName={(record) => (record.isTotal ? 'summary-row' : '')}
    />
  )
}

export default CampusEnrollmentStatisticsTable
