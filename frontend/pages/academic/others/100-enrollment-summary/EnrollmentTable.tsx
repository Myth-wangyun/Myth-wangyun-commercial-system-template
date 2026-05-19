// 口碑招生汇总表组件
import React, { useState } from 'react'
import { App, Table, Button, Space, Popconfirm, Tag, Tooltip } from 'antd'
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import type { IEnrollmentSummary } from './types'
import { ENROLLMENT_COLUMNS } from './types'
import { EnrollmentSummaryService } from './service'
import { CalculationService } from '@/pages/academic/teaching-content/shared/services/calculation'

interface EnrollmentTableProps {
  data: IEnrollmentSummary[]
  loading?: boolean
  onEdit?: (record: IEnrollmentSummary) => void
  onDelete?: (id: string) => void
  onView?: (record: IEnrollmentSummary) => void
  onRefresh?: () => void
}

const EnrollmentTable: React.FC<EnrollmentTableProps> = ({
  data,
  loading = false,
  onEdit,
  onDelete,
  onView,
  onRefresh,
}) => {
  const { message } = App.useApp()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // 计算汇总行数据
  const calculateSummary = () => {
    if (data.length === 0) return null

    const totalTargetWOM = CalculationService.calculateSum(data.map((item) => item.targetWOM))
    const totalActualWOM = CalculationService.calculateSum(data.map((item) => item.actualWOM))
    const totalTargetWalkin = CalculationService.calculateSum(data.map((item) => item.targetWalkin))
    const totalActualWalkin = CalculationService.calculateSum(data.map((item) => item.actualWalkin))
    const totalTargetEnrollment = CalculationService.calculateSum(
      data.map((item) => item.targetEnrollment),
    )
    const totalActualEnrollment = CalculationService.calculateSum(
      data.map((item) => item.actualEnrollment),
    )
    const totalTargetRevenue = CalculationService.calculateSum(
      data.map((item) => item.targetRevenue),
    )
    const totalActualRevenue = CalculationService.calculateSum(
      data.map((item) => item.actualRevenue),
    )

    const avgWOMRate = CalculationService.calculateAchievementRate(totalActualWOM, totalTargetWOM)
    const avgWalkinRate = CalculationService.calculateAchievementRate(
      totalActualWalkin,
      totalTargetWalkin,
    )
    const avgEnrollmentRate = CalculationService.calculateAchievementRate(
      totalActualEnrollment,
      totalTargetEnrollment,
    )
    const avgRevenueRate = CalculationService.calculateAchievementRate(
      totalActualRevenue,
      totalTargetRevenue,
    )

    return {
      totalTargetWOM,
      totalActualWOM,
      totalTargetWalkin,
      totalActualWalkin,
      totalTargetEnrollment,
      totalActualEnrollment,
      totalTargetRevenue,
      totalActualRevenue,
      avgWOMRate,
      avgWalkinRate,
      avgEnrollmentRate,
      avgRevenueRate,
    }
  }

  const summary = calculateSummary()

  // 表格列配置
  const columns = [
    ...ENROLLMENT_COLUMNS,
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: IEnrollmentSummary) => (
        <Space size="small">
          {onView && (
            <Tooltip title="查看详情">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => onView(record)}
                size="small"
              />
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip title="编辑">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
                size="small"
              />
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
                <Button type="text" danger icon={<DeleteOutlined />} size="small" />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(selectedRowKeys)
    },
    getCheckboxProps: (record: IEnrollmentSummary) => ({
      name: `${record.campus}-${record.month}月`,
    }),
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的记录')
      return
    }

    try {
      await EnrollmentSummaryService.batchDelete(selectedRowKeys as string[])
      message.success(`成功删除 ${selectedRowKeys.length} 条记录`)
      setSelectedRowKeys([])
      onRefresh?.()
    } catch (error) {
      message.error('删除失败')
    }
  }

  return (
    <div>
      {/* 操作按钮 */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`确定要删除选中的 ${selectedRowKeys.length} 条记录吗？`}
              onConfirm={handleBatchDelete}
              okText="确定"
              cancelText="取消"
            >
              <Button danger>批量删除</Button>
            </Popconfirm>
          )}
          <Button onClick={onRefresh}>刷新</Button>
        </Space>
      </div>

      {/* 数据表格 */}
      <Table
        columns={columns}
        dataSource={data.map((item, index) => ({ ...item, index: index + 1 }))}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1500 }}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
        }}
        rowSelection={rowSelection}
        summary={() => {
          if (!summary) return null

          return (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <Tag color="blue">合计/平均</Tag>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <Tag color="orange">{summary.totalTargetWOM.toLocaleString()}</Tag>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4}>
                  <Tag color="green">{summary.totalActualWOM.toLocaleString()}</Tag>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5}>
                  <Tag color="orange">{summary.totalTargetWalkin.toLocaleString()}</Tag>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6}>
                  <Tag color="green">{summary.totalActualWalkin.toLocaleString()}</Tag>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7}>
                  <Tag color="orange">{summary.totalTargetEnrollment.toLocaleString()}</Tag>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8}>
                  <Tag color="green">{summary.totalActualEnrollment.toLocaleString()}</Tag>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9}>
                  <Tag color="orange">¥{summary.totalTargetRevenue.toLocaleString()}</Tag>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10}>
                  <Tag color="green">¥{summary.totalActualRevenue.toLocaleString()}</Tag>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11} colSpan={2}>
                  {/* 操作列 */}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )
        }}
      />
    </div>
  )
}

export default EnrollmentTable
