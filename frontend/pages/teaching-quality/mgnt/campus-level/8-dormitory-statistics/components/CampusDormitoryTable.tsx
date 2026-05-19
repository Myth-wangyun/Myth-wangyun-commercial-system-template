import React from 'react'
import { App, Table, Card, Button, Space, Tooltip, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  ExportOutlined,
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import type { CampusDormitoryRecord, CampusDormitoryTableProps } from '@/types/campus-dormitory'

const CampusDormitoryTable: React.FC<CampusDormitoryTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
  onEdit,
  onAdd,
}) => {
  const { message } = App.useApp()
  const columns: ColumnsType<CampusDormitoryRecord> = [
    {
      title: '月份',
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
      title: '在校生数',
      dataIndex: 'enrolledStudentCount',
      key: 'enrolledStudentCount',
      width: 100,
      align: 'center',
      render: (value, record, index) => {
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '宿舍总数量',
      dataIndex: 'totalDormitoryCount',
      key: 'totalDormitoryCount',
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
      title: '住宿总人数',
      dataIndex: 'totalResidentCount',
      key: 'totalResidentCount',
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
      title: '住宿率',
      dataIndex: 'occupancyRate',
      key: 'occupancyRate',
      width: 100,
      align: 'center',
      render: (value, record, index) => {
        if (index === data.length - 1) {
          return (
            <span style={{ fontWeight: 'bold', color: value > 80 ? '#3f8600' : 'inherit' }}>
              {value.toFixed(2)}%
            </span>
          )
        }
        return (
          <Tag color={value > 80 ? 'green' : value > 60 ? 'orange' : 'red'}>
            {value.toFixed(2)}%
          </Tag>
        )
      },
    },
    {
      title: '男宿情况',
      align: 'center',
      children: [
        {
          title: '男宿总数量',
          dataIndex: 'maleDormitoryCount',
          key: 'maleDormitoryCount',
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
          title: '男宿总人数',
          dataIndex: 'maleResidentCount',
          key: 'maleResidentCount',
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
          title: '男宿空床位总数量',
          dataIndex: 'maleVacantBedCount',
          key: 'maleVacantBedCount',
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
          title: '适合男新生床位数',
          dataIndex: 'maleNewStudentBedCount',
          key: 'maleNewStudentBedCount',
          width: 150,
          align: 'center',
          render: (value, record, index) => {
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value
          },
        },
      ],
    },
    {
      title: '女宿情况',
      align: 'center',
      children: [
        {
          title: '女宿总数量',
          dataIndex: 'femaleDormitoryCount',
          key: 'femaleDormitoryCount',
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
          title: '女宿总人数',
          dataIndex: 'femaleResidentCount',
          key: 'femaleResidentCount',
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
          title: '女宿空床位总数量',
          dataIndex: 'femaleVacantBedCount',
          key: 'femaleVacantBedCount',
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
          title: '适合女新生住宿床位',
          dataIndex: 'femaleNewStudentBedCount',
          key: 'femaleNewStudentBedCount',
          width: 150,
          align: 'center',
          render: (value, record, index) => {
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value
          },
        },
      ],
    },
    {
      title: '租宿舍',
      align: 'center',
      children: [
        {
          title: '计划租宿舍数量',
          dataIndex: 'plannedRentCount',
          key: 'plannedRentCount',
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
          title: '实际租宿舍数量',
          dataIndex: 'actualRentCount',
          key: 'actualRentCount',
          width: 150,
          align: 'center',
          render: (value, record, index) => {
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value
          },
        },
      ],
    },
    {
      title: '退宿舍',
      align: 'center',
      children: [
        {
          title: '计划退宿舍数量',
          dataIndex: 'plannedVacateCount',
          key: 'plannedVacateCount',
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
          title: '实际退宿舍数量',
          dataIndex: 'actualVacateCount',
          key: 'actualVacateCount',
          width: 150,
          align: 'center',
          render: (value, record, index) => {
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value
          },
        },
      ],
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 200,
      align: 'left',
      render: (value, record, index) => {
        if (index === data.length - 1) {
          return ''
        }
        return value
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
          <HomeOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
            {campus ? `${campus}神殿宿舍统计数据` : '请选择神殿查看数据'}
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
        scroll={{ x: 2400 }}
        size="small"
        bordered
        rowKey="key"
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={19}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#666' }}>
                  <HomeOutlined style={{ marginRight: 8 }} />
                  数据说明：住宿率 = 住宿总人数 ÷ 在校生数 × 100%，空床位数 = 宿舍数量 × 4 -
                  住宿人数，适合新生床位数 = 空床位数 × 80%
                </div>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </Card>
  )
}

export default CampusDormitoryTable
