/**
 * 神殿教化司个人宿舍管理统计表组件
 */

import React from 'react'
import { Card, Table, Button, Space, Row, Col, Statistic } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ReloadOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  HomeOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons'
import type {
  PersonalDormitoryManagementTableProps,
  PersonalDormitoryManagementRecord,
} from '@/types/personal-dormitory-management'

const PersonalDormitoryManagementTable: React.FC<PersonalDormitoryManagementTableProps> = ({
  data,
  loading,
  onRefresh,
  onEdit,
  onDelete,
  onExport,
}) => {
  const handleEdit = (record: PersonalDormitoryManagementRecord) => {
    onEdit(record)
  }

  const handleDelete = (record: PersonalDormitoryManagementRecord) => {
    onDelete(record)
  }

  // 计算统计数据
  const stats = React.useMemo(() => {
    if (data.length === 0) {
      return {
        totalTeachers: 0,
        totalStudentCount: 0,
        totalDormitories: 0,
        totalOccupants: 0,
        averageOccupancyRate: 0,
      }
    }

    const totalRow = data.find((r) => r.rowType === 'total')

    return {
      totalTeachers: data.filter((r) => r.rowType === 'data').length,
      totalStudentCount: totalRow?.studentCount || 0,
      totalDormitories: totalRow?.totalDormitories || 0,
      totalOccupants: totalRow?.totalOccupants || 0,
      averageOccupancyRate: totalRow?.occupancyRate || 0,
    }
  }, [data])

  const columns: ColumnsType<PersonalDormitoryManagementRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      fixed: 'left',
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>合计/平均</span>
        }
        return value
      },
    },
    {
      title: '班主任姓名',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 120,
      fixed: 'left',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '带班人数',
      dataIndex: 'studentCount',
      key: 'studentCount',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '宿舍管理总数量',
      dataIndex: 'totalDormitories',
      key: 'totalDormitories',
      width: 130,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '住宿总人数',
      dataIndex: 'totalOccupants',
      key: 'totalOccupants',
      width: 110,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '住宿率',
      dataIndex: 'occupancyRate',
      key: 'occupancyRate',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value.toFixed(2)}%</span>
        }
        return `${value.toFixed(2)}%`
      },
    },
    {
      title: '男宿总数量',
      dataIndex: 'maleDormitoryCount',
      key: 'maleDormitoryCount',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '男宿总人数',
      dataIndex: 'maleOccupants',
      key: 'maleOccupants',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '男宿空床位总数量',
      dataIndex: 'maleEmptyBeds',
      key: 'maleEmptyBeds',
      width: 140,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '适合男新生床位数',
      dataIndex: 'maleNewStudentBeds',
      key: 'maleNewStudentBeds',
      width: 140,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '女宿总数量',
      dataIndex: 'femaleDormitoryCount',
      key: 'femaleDormitoryCount',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '女宿总人数',
      dataIndex: 'femaleOccupants',
      key: 'femaleOccupants',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '女宿空床位总数量',
      dataIndex: 'femaleEmptyBeds',
      key: 'femaleEmptyBeds',
      width: 140,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '适合女新生住宿床位',
      dataIndex: 'femaleNewStudentBeds',
      key: 'femaleNewStudentBeds',
      width: 150,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '计划租宿舍数量',
      dataIndex: 'plannedRentedDormitories',
      key: 'plannedRentedDormitories',
      width: 130,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '实际租宿舍数量',
      dataIndex: 'actualRentedDormitories',
      key: 'actualRentedDormitories',
      width: 130,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '计划退宿舍数量',
      dataIndex: 'plannedVacatedDormitories',
      key: 'plannedVacatedDormitories',
      width: 130,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '实际退宿舍数量',
      dataIndex: 'actualVacatedDormitories',
      key: 'actualVacatedDormitories',
      width: 130,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 150,
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: any, record: PersonalDormitoryManagementRecord) => {
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
                title="总班主任数"
                value={stats.totalTeachers}
                prefix={<UsergroupAddOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总带班人数"
                value={stats.totalStudentCount}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总宿舍数"
                value={stats.totalDormitories}
                prefix={<HomeOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均住宿率"
                value={stats.averageOccupancyRate}
                precision={2}
                suffix="%"
                valueStyle={{ color: stats.averageOccupancyRate > 80 ? '#52c41a' : '#cf1322' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title="神殿教化司个人宿舍管理统计表（手填）"
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
          scroll={{ x: 2200 }}
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

export default PersonalDormitoryManagementTable
