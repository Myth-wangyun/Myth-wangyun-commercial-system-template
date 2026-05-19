import React from 'react'
import { Table, Button, Space, Tag, Popconfirm, Tooltip } from 'antd'
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { IEmploymentSummary } from '../types'
import dayjs from 'dayjs'
import './DataTable.css'

interface DataTableProps {
  data: IEmploymentSummary[]
  loading: boolean
  onEdit?: (record: IEmploymentSummary) => void
  onDelete?: (id: string) => void
  onView: (record: IEmploymentSummary) => void
}

interface EmploymentSummaryRow {
  key: 'summary'
  campus: string
  major: string
  programLength: string
  className: string
  instructor: string
  classTeacher: string
  graduationTime: string
  targetAvgSalary: number
  actualAvgSalary: number
  achievementRate: number
  archivedCount: number
  targetEmployment: number
  actualEmployment: number
  employmentRate: number
  salaryOver10k: number
}

type EmploymentTableRow = IEmploymentSummary | EmploymentSummaryRow

const isSummaryRow = (record: EmploymentTableRow): record is EmploymentSummaryRow => 'key' in record

const DataTable: React.FC<DataTableProps> = ({ data, loading, onEdit, onDelete, onView }) => {
  const columns: ColumnsType<EmploymentTableRow> = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      fixed: 'left',
      render: (_, __, index) => index + 1,
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      fixed: 'left',
      render: (campus) => <Tag color="blue">{campus}</Tag>,
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      width: 120,
      render: (major) => <Tag color="green">{major}</Tag>,
    },
    {
      title: '学制',
      dataIndex: 'programLength',
      key: 'programLength',
      width: 100,
    },
    {
      title: '班级名称',
      dataIndex: 'className',
      key: 'className',
      width: 120,
    },
    {
      title: '授课教员',
      dataIndex: 'instructor',
      key: 'instructor',
      width: 120,
    },
    {
      title: '班主任',
      dataIndex: 'classTeacher',
      key: 'classTeacher',
      width: 120,
    },
    {
      title: '毕业时间',
      dataIndex: 'graduationTime',
      key: 'graduationTime',
      width: 120,
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '就业薪资',
      children: [
        {
          title: '目标平均就业薪资',
          dataIndex: 'targetAvgSalary',
          key: 'targetAvgSalary',
          width: 150,
          render: (value) => `¥${value.toLocaleString()}`,
          sorter: (a, b) => a.targetAvgSalary - b.targetAvgSalary,
        },
        {
          title: '实际平均就业薪资',
          dataIndex: 'actualAvgSalary',
          key: 'actualAvgSalary',
          width: 150,
          render: (value) => `¥${value.toLocaleString()}`,
          sorter: (a, b) => a.actualAvgSalary - b.actualAvgSalary,
        },
        {
          title: '达标率',
          dataIndex: 'achievementRate',
          key: 'achievementRate',
          width: 100,
          render: (value) => (
            <span
              style={{
                color: value >= 100 ? '#52c41a' : value >= 80 ? '#faad14' : '#ff4d4f',
              }}
            >
              {value.toFixed(2)}%
            </span>
          ),
          sorter: (a, b) => a.achievementRate - b.achievementRate,
        },
      ],
    },
    {
      title: '就业率',
      children: [
        {
          title: '档案人数',
          dataIndex: 'archivedCount',
          key: 'archivedCount',
          width: 100,
          sorter: (a, b) => a.archivedCount - b.archivedCount,
        },
        {
          title: '目标就业人数',
          dataIndex: 'targetEmployment',
          key: 'targetEmployment',
          width: 120,
          sorter: (a, b) => a.targetEmployment - b.targetEmployment,
        },
        {
          title: '实际就业人数',
          dataIndex: 'actualEmployment',
          key: 'actualEmployment',
          width: 120,
          sorter: (a, b) => a.actualEmployment - b.actualEmployment,
        },
        {
          title: '就业率',
          dataIndex: 'employmentRate',
          key: 'employmentRate',
          width: 100,
          render: (value) => (
            <span
              style={{
                color: value >= 80 ? '#52c41a' : value >= 60 ? '#faad14' : '#ff4d4f',
              }}
            >
              {value.toFixed(2)}%
            </span>
          ),
          sorter: (a, b) => a.employmentRate - b.employmentRate,
        },
      ],
    },
    {
      title: '薪资过万人数',
      dataIndex: 'salaryOver10k',
      key: 'salaryOver10k',
      width: 120,
      render: (value) => <span style={{ color: value > 0 ? '#52c41a' : '#999' }}>{value}</span>,
      sorter: (a, b) => a.salaryOver10k - b.salaryOver10k,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        isSummaryRow(record) ? null : (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="text" icon={<EyeOutlined />} onClick={() => onView(record)} />
          </Tooltip>
          {onEdit && (
            <Tooltip title="编辑">
              <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} />
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="删除">
              <Popconfirm
                title="确定要删除这条记录吗？"
                onConfirm={() => onDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
        )
      ),
    },
  ]

  // 计算合计/平均行数据
  const getSummaryRow = (): EmploymentSummaryRow | null => {
    if (data.length === 0) return null

    const totalArchivedCount = data.reduce((sum, item) => sum + item.archivedCount, 0)
    const totalTargetEmployment = data.reduce((sum, item) => sum + item.targetEmployment, 0)
    const totalActualEmployment = data.reduce((sum, item) => sum + item.actualEmployment, 0)
    const totalSalaryOver10k = data.reduce((sum, item) => sum + item.salaryOver10k, 0)

    const avgTargetSalary = data.reduce((sum, item) => sum + item.targetAvgSalary, 0) / data.length
    const avgActualSalary = data.reduce((sum, item) => sum + item.actualAvgSalary, 0) / data.length
    const avgAchievementRate =
      data.reduce((sum, item) => sum + item.achievementRate, 0) / data.length
    // 就业率 = 总实际就业人数 / 总目标就业人数 * 100
    const avgEmploymentRate = totalTargetEmployment > 0 
      ? (totalActualEmployment / totalTargetEmployment) * 100 
      : 0

    return {
      key: 'summary',
      campus: '合计/平均',
      major: '',
      programLength: '',
      className: '',
      instructor: '',
      classTeacher: '',
      graduationTime: '',
      targetAvgSalary: avgTargetSalary,
      actualAvgSalary: avgActualSalary,
      achievementRate: avgAchievementRate,
      archivedCount: totalArchivedCount,
      targetEmployment: totalTargetEmployment,
      actualEmployment: totalActualEmployment,
      employmentRate: avgEmploymentRate,
      salaryOver10k: totalSalaryOver10k,
    }
  }

  const summaryRow = getSummaryRow()
  const dataWithSummary: EmploymentTableRow[] = summaryRow ? [...data, summaryRow] : data

  return (
    <Table
      columns={columns}
      dataSource={dataWithSummary}
      loading={loading}
      rowKey={(record) => (isSummaryRow(record) ? record.key : record.id)}
      scroll={{ x: 1800 }}
      pagination={{
        total: data.length,
        defaultPageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
      }}
      size="small"
      rowClassName={(record) => (isSummaryRow(record) ? 'summary-row' : '')}
    />
  )
}

export default DataTable
