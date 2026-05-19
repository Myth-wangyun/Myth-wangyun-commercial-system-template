import React, { useMemo } from 'react'
import { Table, Button, Space, Tag, Popconfirm, Tooltip } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { ITeacherStaffingRatio } from '../types'

interface DataTableProps {
  data: ITeacherStaffingRatio[]
  loading: boolean
  onEdit?: (record: ITeacherStaffingRatio) => void
  onDelete?: (id: string) => void
  readOnly?: boolean
}

const DataTable: React.FC<DataTableProps> = ({ data, loading, onEdit, onDelete, readOnly = false }) => {
  const baseColumns: ColumnsType<ITeacherStaffingRatio> = [
    {
      title: '序号',
      key: 'serialNumber',
      width: 60,
      fixed: 'left',
      align: 'center',
      render: (_, record, index) => {
        if ((record as any).isTotal) {
          return <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>合计</span>
        }
        return index + 1
      },
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      fixed: 'left',
      align: 'center',
      render: (value, record) => {
        if ((record as any).isTotal) {
          return <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>合计</span>
        }
        return value
      },
    },
    {
      title: '统计时间',
      dataIndex: 'statisticsTime',
      key: 'statisticsTime',
      width: 120,
      render: () => '', // 统计时间列显示为空
    },
    {
      title: '学生人数',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
      width: 120,
      align: 'right',
      render: (value, record) => {
        if ((record as any).isTotal) {
          return <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{value || 0}</span>
        }
        return value || 0
      },
    },
    {
      title: '教员职数分析',
      children: [
        {
          title: '目标师资配比',
          dataIndex: 'targetTeacherStudentRatio',
          key: 'targetTeacherStudentRatio',
          width: 120,
          align: 'center',
          render: (value) => (value ?? 0),
        },
        {
          title: '目标老师数量',
          dataIndex: 'targetTeacherCount',
          key: 'targetTeacherCount',
          width: 120,
          align: 'right',
          render: (value) => ((value ?? 0) as number).toFixed(1),
        },
        {
          title: '实际老师数量',
          dataIndex: 'actualTeacherCount',
          key: 'actualTeacherCount',
          width: 120,
          align: 'right',
          render: (value, record) => {
            if ((record as any).isTotal) {
              return <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{value || 0}</span>
            }
            return value || 0
          },
        },
        {
          title: '老师空缺',
          dataIndex: 'teacherVacancy',
          key: 'teacherVacancy',
          width: 100,
          align: 'right',
          render: (value, record) => {
            if ((record as any).isTotal) {
              return <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{value || 0}</span>
            }
            return value > 0 ? <Tag color="red">{value}</Tag> : 0
          },
        },
        {
          title: '老师冗余',
          dataIndex: 'teacherRedundancy',
          key: 'teacherRedundancy',
          width: 100,
          align: 'right',
          render: (value, record) => {
            if ((record as any).isTotal) {
              return <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{value || 0}</span>
            }
            return value > 0 ? <Tag color="orange">{value}</Tag> : 0
          },
        },
      ],
    },
    {
      title: '干部职数分析',
      children: [
        {
          title: '目标干部与教员配比',
          dataIndex: 'targetCadreRatio',
          key: 'targetCadreRatio',
          width: 140,
          align: 'center',
          render: (value) => (value ?? 0),
        },
        {
          title: '目标干部数量',
          dataIndex: 'targetCadreCount',
          key: 'targetCadreCount',
          width: 120,
          align: 'right',
          render: (value) => ((value ?? 0) as number).toFixed(1),
        },
        {
          title: '实际干部数量',
          dataIndex: 'actualCadreCount',
          key: 'actualCadreCount',
          width: 120,
          align: 'right',
          render: (value) => value || 0,
        },
        {
          title: '干部空缺',
          dataIndex: 'cadreVacancy',
          key: 'cadreVacancy',
          width: 100,
          align: 'right',
          render: (value, record) => {
            if ((record as any).isTotal) {
              return <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{value || 0}</span>
            }
            return value > 0 ? <Tag color="red">{value}</Tag> : 0
          },
        },
        {
          title: '干部冗余',
          dataIndex: 'cadreRedundancy',
          key: 'cadreRedundancy',
          width: 100,
          align: 'right',
          render: (value, record) => {
            if ((record as any).isTotal) {
              return <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{value || 0}</span>
            }
            return value > 0 ? <Tag color="orange">{value}</Tag> : 0
          },
        },
      ],
    },
  ]

  // 操作列（仅在非只读模式下添加）
  const actionColumn: ColumnsType<ITeacherStaffingRatio>[0] = {
    title: '操作',
    key: 'action',
    width: 120,
    fixed: 'right',
    render: (_, record) => {
      // 合计行不显示操作按钮
      if ((record as any).isTotal) {
        return ''
      }
      return (
        <Space size="small">
          <Tooltip title="编辑">
            <Button type="text" icon={<EditOutlined />} onClick={() => onEdit?.(record)} />
          </Tooltip>
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => onDelete?.(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    },
  }

  // 根据 readOnly 属性决定是否包含操作列
  const columns = readOnly ? baseColumns : [...baseColumns, actionColumn]

  // 计算合计行数据
  const summaryRow = useMemo(() => {
    if (data.length === 0) return null

    const totalStudents = data.reduce((sum, item) => sum + (item.totalStudents || 0), 0)
    const totalActualTeachers = data.reduce((sum, item) => sum + (item.actualTeacherCount || 0), 0)
    const totalTeacherVacancy = data.reduce(
      (sum, item) => sum + Math.max(0, item.teacherVacancy || 0),
      0,
    )
    const totalTeacherRedundancy = data.reduce(
      (sum, item) => sum + Math.max(0, item.teacherRedundancy || 0),
      0,
    )
    const totalCadreVacancy = data.reduce(
      (sum, item) => sum + Math.max(0, item.cadreVacancy || 0),
      0,
    )
    const totalCadreRedundancy = data.reduce(
      (sum, item) => sum + Math.max(0, item.cadreRedundancy || 0),
      0,
    )

    return {
      id: 'summary',
      key: 'summary',
      campus: '合计',
      totalStudents,
      actualTeacherCount: totalActualTeachers,
      teacherVacancy: totalTeacherVacancy,
      teacherRedundancy: totalTeacherRedundancy,
      cadreVacancy: totalCadreVacancy,
      cadreRedundancy: totalCadreRedundancy,
      isTotal: true,
    }
  }, [data])

  const dataWithSummary = summaryRow ? [...data, summaryRow as any] : data

  return (
    <Table
      columns={columns}
      dataSource={dataWithSummary}
      loading={loading}
      rowKey={(record) => ((record as any).isTotal ? 'summary' : record.id)}
      pagination={false}
      bordered
      scroll={{ x: 1700 }}
      size="middle"
      rowClassName={(record) => ((record as any).isTotal ? 'summary-row' : '')}
    />
  )
}

export default DataTable
