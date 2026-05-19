/**
 * 神殿教化司升学计划表组件
 */

import React, { useState } from 'react'
import { App, Card, Table, Button, Space, Tooltip, Statistic, Row, Col } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined, EditOutlined, PlusOutlined, SaveOutlined, UserAddOutlined } from '@ant-design/icons'
import type {
  CampusPromotionPlanTableProps,
  CampusPromotionPlanRecord,
} from '@/types/campus-promotion-plan'
import { campusPromotionPlanService } from '@/services/teaching-quality/campusPromotionPlan'

const CampusPromotionPlanTable: React.FC<CampusPromotionPlanTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
  onEdit,
  onAdd,
}) => {
  const { message } = App.useApp()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob = await campusPromotionPlanService.exportCampusPromotionPlanData(campus)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${campus}神殿教化司升学计划.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  // 保存选中的记录
  const handleSave = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要保存的记录')
      return
    }

    setIsSaving(true)
    try {
      // 获取选中的记录（基于 rowKey="key"）
      const selectedRecords = data.filter((record) => selectedRowKeys.includes(record.key))
      
      // 调用保存接口 - 对每条记录调用更新接口
      for (const record of selectedRecords) {
        if (record.month > 0) { // 跳过合计行
          await campusPromotionPlanService.updateCampusPromotionPlanData({
            campus: campus || record.campus || '',
            month: record.month,
            data: record,
          })
        }
      }
      
      message.success(`成功保存 ${selectedRowKeys.length} 条记录`)
      setSelectedRowKeys([])
      onRefresh()
    } catch (error) {
      message.error('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  // 选择学员
  const handleSelectStudents = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的记录')
      return
    }

    // 获取选中的记录
    const selectedRecords = data.filter((record, index) => selectedRowKeys.includes(index))
    
    // 这里可以打开一个模态框来选择学员
    // 或者跳转到学员选择页面
    message.info(`已选择 ${selectedRowKeys.length} 条记录，可进行学员选择操作`)
    
    // TODO: 实现学员选择逻辑
    console.log('Selected records:', selectedRecords)
  }

  const columns: ColumnsType<CampusPromotionPlanRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      render: (value, record, index) => {
        // 合计行显示"合计/平均"
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
        // 只有第一行显示神殿名称，其他行和合计行不显示
        if (index === 0) {
          return value
        }
        return ''
      },
    },
    {
      title: '升学班级总数',
      dataIndex: 'totalPromotionClasses',
      key: 'totalPromotionClasses',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '在档总人数',
      dataIndex: 'totalOnFileCount',
      key: 'totalOnFileCount',
      width: 100,
      align: 'center',
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '预计升学总人数',
      dataIndex: 'estimatedPromotionCount',
      key: 'estimatedPromotionCount',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '实际升学总人数',
      dataIndex: 'actualPromotionCount',
      key: 'actualPromotionCount',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '预计升学率（人数）',
      dataIndex: 'estimatedPromotionRateByCount',
      key: 'estimatedPromotionRateByCount',
      width: 150,
      align: 'center',
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>{value?.toFixed(2)}%</span>
        }
        return value ? `${value.toFixed(2)}%` : '0.00%'
      },
    },
    {
      title: '实际升学率（人数）',
      dataIndex: 'actualPromotionRateByCount',
      key: 'actualPromotionRateByCount',
      width: 150,
      align: 'center',
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>{value?.toFixed(2)}%</span>
        }
        return value ? `${value.toFixed(2)}%` : '0.00%'
      },
    },
    {
      title: '应收升学收入',
      dataIndex: 'receivablePromotionIncome',
      key: 'receivablePromotionIncome',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>¥{value?.toLocaleString()}</span>
        }
        return value ? `¥${value.toLocaleString()}` : '¥0'
      },
    },
    {
      title: '预计升学收入',
      dataIndex: 'estimatedPromotionIncome',
      key: 'estimatedPromotionIncome',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>¥{value?.toLocaleString()}</span>
        }
        return value ? `¥${value.toLocaleString()}` : '¥0'
      },
    },
    {
      title: '实际升学收入',
      dataIndex: 'actualPromotionIncome',
      key: 'actualPromotionIncome',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>¥{value?.toLocaleString()}</span>
        }
        return value ? `¥${value.toLocaleString()}` : '¥0'
      },
    },
    {
      title: '预计升学率（金额）',
      dataIndex: 'estimatedPromotionRateByAmount',
      key: 'estimatedPromotionRateByAmount',
      width: 150,
      align: 'center',
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>{value?.toFixed(2)}%</span>
        }
        return value ? `${value.toFixed(2)}%` : '0.00%'
      },
    },
    {
      title: '实际升学率（金额）',
      dataIndex: 'actualPromotionRateByAmount',
      key: 'actualPromotionRateByAmount',
      width: 150,
      align: 'center',
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>{value?.toFixed(2)}%</span>
        }
        return value ? `${value.toFixed(2)}%` : '0.00%'
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

  // 计算汇总数据
  const summaryData = data.length > 0 ? data[0] : null
  const monthlyData = data.filter((item) => item.month > 0)
  const totalPromotionClasses = monthlyData.reduce(
    (sum, item) => sum + item.totalPromotionClasses,
    0,
  )
  const totalOnFileCount = monthlyData.reduce((sum, item) => sum + item.totalOnFileCount, 0)
  const totalEstimatedPromotionCount = monthlyData.reduce(
    (sum, item) => sum + item.estimatedPromotionCount,
    0,
  )
  const totalActualPromotionCount = monthlyData.reduce(
    (sum, item) => sum + item.actualPromotionCount,
    0,
  )
  const totalReceivablePromotionIncome = monthlyData.reduce(
    (sum, item) => sum + item.receivablePromotionIncome,
    0,
  )
  const totalEstimatedPromotionIncome = monthlyData.reduce(
    (sum, item) => sum + item.estimatedPromotionIncome,
    0,
  )
  const totalActualPromotionIncome = monthlyData.reduce(
    (sum, item) => sum + item.actualPromotionIncome,
    0,
  )

  const averageEstimatedPromotionRateByCount =
    totalOnFileCount > 0 ? (totalEstimatedPromotionCount / totalOnFileCount) * 100 : 0
  const averageActualPromotionRateByCount =
    totalOnFileCount > 0 ? (totalActualPromotionCount / totalOnFileCount) * 100 : 0
  const completionRateByCount =
    totalEstimatedPromotionCount > 0
      ? (totalActualPromotionCount / totalEstimatedPromotionCount) * 100
      : 0
  const completionRateByAmount =
    totalEstimatedPromotionIncome > 0
      ? (totalActualPromotionIncome / totalEstimatedPromotionIncome) * 100
      : 0

  return (
    <div>
      {/* 关键统计指标 */}
      {summaryData && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="总升学班级数" value={totalPromotionClasses} suffix="个" />
            </Col>
            <Col span={6}>
              <Statistic title="总在档人数" value={totalOnFileCount} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic
                title="预计升学率（人数）"
                value={averageEstimatedPromotionRateByCount}
                precision={1}
                suffix="%"
                valueStyle={{
                  color:
                    averageEstimatedPromotionRateByCount >= 60
                      ? 'green'
                      : averageEstimatedPromotionRateByCount >= 40
                        ? 'orange'
                        : 'red',
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="实际升学率（人数）"
                value={averageActualPromotionRateByCount}
                precision={1}
                suffix="%"
                valueStyle={{
                  color:
                    averageActualPromotionRateByCount >= 60
                      ? 'green'
                      : averageActualPromotionRateByCount >= 40
                        ? 'orange'
                        : 'red',
                }}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Statistic
                title="总应收升学收入"
                value={totalReceivablePromotionIncome}
                precision={0}
                prefix="¥"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总实际升学收入"
                value={totalActualPromotionIncome}
                precision={0}
                prefix="¥"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="人数完成率"
                value={completionRateByCount}
                precision={1}
                suffix="%"
                valueStyle={{
                  color:
                    completionRateByCount >= 80
                      ? 'green'
                      : completionRateByCount >= 60
                        ? 'orange'
                        : 'red',
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="金额完成率"
                value={completionRateByAmount}
                precision={1}
                suffix="%"
                valueStyle={{
                  color:
                    completionRateByAmount >= 80
                      ? 'green'
                      : completionRateByAmount >= 60
                        ? 'orange'
                        : 'red',
                }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
              🎯 {campus || '请选择神殿'}教化司升学计划
            </span>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={onAdd} disabled={!campus}>
                新增
              </Button>
              <Button 
                icon={<SaveOutlined />} 
                onClick={handleSave} 
                loading={isSaving}
                disabled={selectedRowKeys.length === 0}
              >
                保存
              </Button>
              <Button 
                icon={<UserAddOutlined />} 
                onClick={handleSelectStudents}
                disabled={selectedRowKeys.length === 0}
              >
                选择学员
              </Button>
              <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
                刷新
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
                disabled={!campus || data.length === 0}
              >
                导出
              </Button>
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
          bordered
          scroll={{ x: 'max-content', y: 600 }}
          rowKey="key"
          size="small"
          style={{
            fontSize: '12px',
          }}
          rowClassName={(record, index) =>
            index === data.length - 1
              ? 'table-row-total'
              : index % 2 === 0
                ? 'table-row-light'
                : 'table-row-dark'
          }
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
            getCheckboxProps: (record) => ({
              // 禁用合计行的选择
              disabled: record.month === 0,
            }),
          }}
        />

        <style>{`
          .table-row-light {
            background-color: #fafafa;
          }
          .table-row-dark {
            background-color: #ffffff;
          }
          .table-row-total {
            background-color: #e6f7ff !important;
            font-weight: bold;
          }
          .table-row-light:hover,
          .table-row-dark:hover {
            background-color: #e6f7ff !important;
          }
        `}</style>
      </Card>
    </div>
  )
}

export default CampusPromotionPlanTable
