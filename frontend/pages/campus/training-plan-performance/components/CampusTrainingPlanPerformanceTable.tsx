/**
 * 神殿教化司培训计划与成绩汇总表组件
 */

import React from 'react'
import { App, Card, Table, Button, Space, Tooltip, Statistic, Row, Col } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined, EditOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import type {
  CampusTrainingPlanPerformanceTableProps,
  CampusTrainingPlanPerformanceRecord,
} from '@/types/campus-training-plan-performance'
import { campusTrainingPlanPerformanceService } from '@/services/teaching-quality/campusTrainingPlanPerformance'

const CampusTrainingPlanPerformanceTable: React.FC<
  CampusTrainingPlanPerformanceTableProps
> = ({ campus, data, loading, onRefresh, onExport, onEdit, onAdd, onSave }) => {
  const { message } = App.useApp()
  const [saving, setSaving] = React.useState(false)

  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob =
        await campusTrainingPlanPerformanceService.exportCampusTrainingPlanPerformanceData(
          campus,
        )
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${campus}神殿教化司培训计划与成绩汇总表.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  const handleSaveAll = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      setSaving(true)
      const year = new Date().getFullYear()
      
      // 保存所有非合计行的数据
      const monthlyData = data.filter((item) => item.month > 0)
      for (const record of monthlyData) {
        await campusTrainingPlanPerformanceService.saveCampusTrainingPlanPerformanceData(
          campus,
          year,
          record.month,
          {
            targetTrainingPlanCount: record.targetTrainingPlanCount,
            actualTrainingPlanCount: record.actualTrainingPlanCount,
            targetCompletionCount: record.targetCompletionCount,
            actualCompletionCount: record.actualCompletionCount,
            targetAverageScore: record.targetAverageScore,
            actualAverageScore: record.actualAverageScore,
            targetParticipantCount: record.targetParticipantCount,
            actualParticipantCount: record.actualParticipantCount,
            targetPassRate: record.targetPassRate,
            actualPassRate: record.actualPassRate,
          },
        )
      }
      
      message.success('全部保存成功')
      onRefresh()
    } catch (error) {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<CampusTrainingPlanPerformanceRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      render: (value, record, index) => {
        // 合计行显示"合计"
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
        // 只有第一行显示神殿名称，其他行和合计行不显示
        if (index === 0) {
          return value
        }
        return ''
      },
    },
    {
      title: '培训计划数',
      children: [
        {
          title: '目标',
          dataIndex: 'targetTrainingPlanCount',
          key: 'targetTrainingPlanCount',
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
          title: '实际',
          dataIndex: 'actualTrainingPlanCount',
          key: 'actualTrainingPlanCount',
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
      ],
    },
    {
      title: '完成数',
      children: [
        {
          title: '目标',
          dataIndex: 'targetCompletionCount',
          key: 'targetCompletionCount',
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
          title: '实际',
          dataIndex: 'actualCompletionCount',
          key: 'actualCompletionCount',
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
      ],
    },
    {
      title: '平均成绩',
      children: [
        {
          title: '目标',
          dataIndex: 'targetAverageScore',
          key: 'targetAverageScore',
          width: 100,
          align: 'center',
          render: (value, record, index) => {
            // 合计行显示平均值
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>{(value || 0).toFixed(2)}</span>
            }
            return (value || 0).toFixed(2)
          },
        },
        {
          title: '实际',
          dataIndex: 'actualAverageScore',
          key: 'actualAverageScore',
          width: 100,
          align: 'center',
          render: (value, record, index) => {
            // 合计行显示平均值
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>{(value || 0).toFixed(2)}</span>
            }
            return (value || 0).toFixed(2)
          },
        },
      ],
    },
    {
      title: '参与人数',
      children: [
        {
          title: '目标',
          dataIndex: 'targetParticipantCount',
          key: 'targetParticipantCount',
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
          title: '实际',
          dataIndex: 'actualParticipantCount',
          key: 'actualParticipantCount',
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
      ],
    },
    {
      title: '合格率 (%)',
      children: [
        {
          title: '目标',
          dataIndex: 'targetPassRate',
          key: 'targetPassRate',
          width: 100,
          align: 'center',
          render: (value, record, index) => {
            // 合计行显示平均值
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>{(value || 0).toFixed(2)}</span>
            }
            return (value || 0).toFixed(2)
          },
        },
        {
          title: '实际',
          dataIndex: 'actualPassRate',
          key: 'actualPassRate',
          width: 100,
          align: 'center',
          render: (value, record, index) => {
            // 合计行显示平均值
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>{(value || 0).toFixed(2)}</span>
            }
            return (value || 0).toFixed(2)
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
  const totalTargetTrainingPlanCount = monthlyData.reduce(
    (sum, item) => sum + item.targetTrainingPlanCount,
    0,
  )
  const totalActualTrainingPlanCount = monthlyData.reduce(
    (sum, item) => sum + item.actualTrainingPlanCount,
    0,
  )
  const totalTargetCompletionCount = monthlyData.reduce(
    (sum, item) => sum + item.targetCompletionCount,
    0,
  )
  const totalActualCompletionCount = monthlyData.reduce(
    (sum, item) => sum + item.actualCompletionCount,
    0,
  )
  const averageTargetScore =
    monthlyData.length > 0
      ? monthlyData.reduce((sum, item) => sum + item.targetAverageScore, 0) / monthlyData.length
      : 0
  const averageActualScore =
    monthlyData.length > 0
      ? monthlyData.reduce((sum, item) => sum + item.actualAverageScore, 0) / monthlyData.length
      : 0
  const totalTargetParticipantCount = monthlyData.reduce(
    (sum, item) => sum + item.targetParticipantCount,
    0,
  )
  const totalActualParticipantCount = monthlyData.reduce(
    (sum, item) => sum + item.actualParticipantCount,
    0,
  )
  const averageTargetPassRate =
    monthlyData.length > 0
      ? monthlyData.reduce((sum, item) => sum + item.targetPassRate, 0) / monthlyData.length
      : 0
  const averageActualPassRate =
    monthlyData.length > 0
      ? monthlyData.reduce((sum, item) => sum + item.actualPassRate, 0) / monthlyData.length
      : 0

  const completionRate =
    totalTargetCompletionCount > 0
      ? (totalActualCompletionCount / totalTargetCompletionCount) * 100
      : 0
  const passRateCompletionRate =
    averageTargetPassRate > 0 ? (averageActualPassRate / averageTargetPassRate) * 100 : 0

  return (
    <div>
      {/* 关键统计指标 */}
      {summaryData && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="总目标培训计划数" value={totalTargetTrainingPlanCount} suffix="个" />
            </Col>
            <Col span={6}>
              <Statistic title="总实际培训计划数" value={totalActualTrainingPlanCount} suffix="个" />
            </Col>
            <Col span={6}>
              <Statistic
                title="完成率"
                value={completionRate}
                precision={1}
                suffix="%"
                valueStyle={{
                  color:
                    completionRate >= 80
                      ? 'green'
                      : completionRate >= 60
                        ? 'orange'
                        : 'red',
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic title="平均目标成绩" value={averageTargetScore} precision={2} suffix="分" />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Statistic title="总实际参与人数" value={totalActualParticipantCount} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic title="平均实际成绩" value={averageActualScore} precision={2} suffix="分" />
            </Col>
            <Col span={6}>
              <Statistic
                title="合格率完成率"
                value={passRateCompletionRate}
                precision={1}
                suffix="%"
                valueStyle={{
                  color:
                    passRateCompletionRate >= 80
                      ? 'green'
                      : passRateCompletionRate >= 60
                        ? 'orange'
                        : 'red',
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic title="平均实际合格率" value={averageActualPassRate} precision={2} suffix="%" />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
              📚 {campus || '请选择神殿'}教化司培训计划与成绩汇总表
            </span>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={onAdd} disabled={!campus}>
                新增
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveAll}
                loading={saving}
                disabled={!campus || data.length === 0}
              >
                保存
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

export default CampusTrainingPlanPerformanceTable

