/**
 * 神殿教化司培训计划与成绩汇总表组件
 */

import React from 'react'
import { App, Card, Table, Button, Space, Statistic, Row, Col, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined, EditOutlined } from '@ant-design/icons'
import type {
  CampusTrainingPlanTableProps,
  CampusTrainingPlanRecord,
  CampusTrainingPlanSummary,
} from '@/types/campus-training-plan'
import { campusTrainingPlanService } from '@/services/campusTrainingPlan'

const CampusTrainingPlanTable: React.FC<CampusTrainingPlanTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
  onEdit,
}) => {
  const { message } = App.useApp()
  const [summary, setSummary] = React.useState<CampusTrainingPlanSummary | null>(null)

  // 获取汇总统计数据
  React.useEffect(() => {
    if (campus && data.length > 0) {
      campusTrainingPlanService.getCampusTrainingPlanSummary(campus).then(setSummary)
    }
  }, [campus, data])

  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob = await campusTrainingPlanService.exportCampusTrainingPlanData(campus)
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

  const columns: ColumnsType<CampusTrainingPlanRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      fixed: 'left',
      render: (value, record, index) => {
        // 最后一行显示"合计"
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
      width: 120,
      fixed: 'left',
      render: (value, record, index) => {
        // 只有第一行显示神殿名称，其他行和合计行不显示
        if (index === 0) {
          return value
        }
        return ''
      },
    },
    {
      title: '培训目标',
      dataIndex: 'trainingObjective',
      key: 'trainingObjective',
      width: 150,
      render: (value, record, index) => {
        // 合计行不显示培训目标
        if (index === data.length - 1) {
          return ''
        }
        return value || ''
      },
    },
    {
      title: '主要内容',
      dataIndex: 'mainContent',
      key: 'mainContent',
      width: 150,
      render: (value, record, index) => {
        // 合计行不显示主要内容
        if (index === data.length - 1) {
          return ''
        }
        return value || ''
      },
    },
    {
      title: '培训方式',
      dataIndex: 'trainingMethod',
      key: 'trainingMethod',
      width: 120,
      render: (value, record, index) => {
        // 合计行不显示培训方式
        if (index === data.length - 1) {
          return ''
        }
        return value || ''
      },
    },
    {
      title: '负责人',
      dataIndex: 'personInCharge',
      key: 'personInCharge',
      width: 100,
      render: (value, record, index) => {
        // 合计行不显示负责人
        if (index === data.length - 1) {
          return ''
        }
        return value || ''
      },
    },
    {
      title: '培训人数',
      dataIndex: 'trainingCount',
      key: 'trainingCount',
      width: 100,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data.slice(0, -1).reduce((sum, item) => sum + item.trainingCount, 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    },
    {
      title: '合格人数',
      dataIndex: 'qualifiedCount',
      key: 'qualifiedCount',
      width: 100,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data.slice(0, -1).reduce((sum, item) => sum + item.qualifiedCount, 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    },
    {
      title: '考试合格率',
      dataIndex: 'passRate',
      key: 'passRate',
      width: 120,
      render: (value, record, index) => {
        // 合计行显示总体合格率
        if (index === data.length - 1) {
          const totalTraining = data.slice(0, -1).reduce((sum, item) => sum + item.trainingCount, 0)
          const totalQualified = data
            .slice(0, -1)
            .reduce((sum, item) => sum + item.qualifiedCount, 0)
          const overallRate = totalTraining > 0 ? (totalQualified / totalTraining) * 100 : 0
          return (
            <span
              style={{
                fontWeight: 'bold',
                color: overallRate >= 80 ? 'green' : overallRate >= 60 ? 'orange' : 'red',
              }}
            >
              {overallRate.toFixed(1)}%
            </span>
          )
        }
        const rate = value || 0
        return (
          <span style={{ color: rate >= 80 ? 'green' : rate >= 60 ? 'orange' : 'red' }}>
            {rate.toFixed(1)}%
          </span>
        )
      },
    },
    {
      title: '平均成绩',
      dataIndex: 'averageScore',
      key: 'averageScore',
      width: 100,
      render: (value, record, index) => {
        // 合计行显示总体平均成绩
        if (index === data.length - 1) {
          const validScores = data.slice(0, -1).filter((item) => item.averageScore > 0)
          const overallAvg =
            validScores.length > 0
              ? validScores.reduce((sum, item) => sum + item.averageScore, 0) / validScores.length
              : 0
          return (
            <span
              style={{
                fontWeight: 'bold',
                color: overallAvg >= 80 ? 'green' : overallAvg >= 60 ? 'orange' : 'red',
              }}
            >
              {overallAvg.toFixed(1)}
            </span>
          )
        }
        const score = value || 0
        return (
          <span style={{ color: score >= 80 ? 'green' : score >= 60 ? 'orange' : 'red' }}>
            {score.toFixed(1)}
          </span>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record, index) => {
        // 合计行不显示操作按钮
        if (index === data.length - 1) {
          return ''
        }
        return (
          <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)} size="small">
            编辑
          </Button>
        )
      },
    },
  ]

  return (
    <div>
      {/* 关键统计指标 */}
      {summary && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="总培训人数" value={summary.totalTrainingCount} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic title="总合格人数" value={summary.totalQualifiedCount} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic
                title="总体合格率"
                value={summary.overallPassRate}
                precision={1}
                suffix="%"
                valueStyle={{
                  color:
                    summary.overallPassRate >= 80
                      ? 'green'
                      : summary.overallPassRate >= 60
                        ? 'orange'
                        : 'red',
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总体平均成绩"
                value={summary.overallAverageScore}
                precision={1}
                suffix="分"
                valueStyle={{
                  color:
                    summary.overallAverageScore >= 80
                      ? 'green'
                      : summary.overallAverageScore >= 60
                        ? 'orange'
                        : 'red',
                }}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Statistic
                title="已完成记录"
                value={`${summary.completedRecords}/${summary.totalRecords}`}
              />
            </Col>
            <Col span={6}>
              <Statistic title="最高成绩" value={summary.highestScore} precision={1} suffix="分" />
            </Col>
            <Col span={6}>
              <Statistic title="最低成绩" value={summary.lowestScore} precision={1} suffix="分" />
            </Col>
            <Col span={6}>
              <Statistic title="最有效培训方式" value={summary.mostEffectiveMethod} />
            </Col>
          </Row>
          {summary.mostActivePerson && (
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={6}>
                <Statistic title="最活跃负责人" value={summary.mostActivePerson} />
              </Col>
            </Row>
          )}
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={`${campus || '请选择神殿'}教化司培训计划与成绩汇总表`}
        extra={
          <Space>
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
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={false}
          bordered
          scroll={{ x: 'max-content' }}
          rowKey="key"
          size="small"
        />
      </Card>
    </div>
  )
}

export default CampusTrainingPlanTable
