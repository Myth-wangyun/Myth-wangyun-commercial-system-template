/**
 * 教化司培训计划与成绩汇总表组件
 */

import React from 'react'
import { App, Card, Table, Button, Space, Statistic, Row, Col } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ReloadOutlined,
  DownloadOutlined,
  EditOutlined,
  BookOutlined,
  TeamOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import type {
  TrainingPlanPerformanceTableProps,
  TrainingPlanPerformanceRecord,
  TrainingPlanPerformanceSummary,
} from '@/types/training-plan-performance'
import { trainingPlanPerformanceService } from '@/services/teaching-quality/trainingPlanPerformance'

const TrainingPlanPerformanceTable: React.FC<TrainingPlanPerformanceTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
  onEdit,
}) => {
  const { message } = App.useApp()
  const [summary, setSummary] = React.useState<TrainingPlanPerformanceSummary | null>(null)
  const [saving, setSaving] = React.useState(false)

  // 获取汇总统计数据
  React.useEffect(() => {
    if (campus && data.length > 0) {
      trainingPlanPerformanceService.getTrainingPlanPerformanceSummary(campus).then(setSummary)
    }
  }, [campus, data])

  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob = await trainingPlanPerformanceService.exportTrainingPlanPerformanceData(campus)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${campus}教化司培训计划与成绩汇总表.csv`
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
      const monthlyData = data.filter((item) => item.month > 0)
      for (const r of monthlyData) {
        await trainingPlanPerformanceService.saveTrainingPlanPerformanceItem(campus, year, r.month, {
          trainingObjective: r.trainingObjective,
          mainContent: r.mainContent,
          trainingMethod: r.trainingMethod,
          personInCharge: r.personInCharge,
          numberOfTrainees: r.numberOfTrainees,
          numberOfQualified: r.numberOfQualified,
          examPassRate: r.examPassRate,
          averageScore: r.averageScore,
        })
      }
      message.success('全部保存成功')
    } catch (e) {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<TrainingPlanPerformanceRecord> = [
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
      title: '培训场次',
      key: 'trainingSession',
      width: 80,
      align: 'center',
      render: (_, record, index) => {
        if (index === data.length - 1) {
          // 合计行：显示全年培训次数
          const total = data.slice(0, -1).reduce((sum: number, r: any) => sum + (Number(r.__sessionCount) || 0), 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }

        const cnt = (record as any).__sessionCount
        return typeof cnt === 'number' ? cnt : (Number(cnt) || 0)
      },
    },
    {
      title: '培训人次',
      dataIndex: 'numberOfTrainees',
      key: 'numberOfTrainees',
      width: 100,
      align: 'center',
      render: (value, record, index) => {
        if (index === data.length - 1) {
          const total = data.slice(0, -1).reduce((sum, item) => sum + item.numberOfTrainees, 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    },
    {
      title: '合格人次',
      dataIndex: 'numberOfQualified',
      key: 'numberOfQualified',
      width: 100,
      align: 'center',
      render: (value, record, index) => {
        if (index === data.length - 1) {
          const total = data.slice(0, -1).reduce((sum, item) => sum + item.numberOfQualified, 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    },
    {
      title: '平均考试合格率(%)',
      dataIndex: 'examPassRate',
      key: 'examPassRate',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        if (index === data.length - 1) {
          const records = data.slice(0, -1)
          const valid = records.filter((r: any) => Number(r.__sessionCount || 0) > 0)
          const avg =
            valid.length > 0
              ? valid.reduce((sum, r) => sum + Number(r.examPassRate || 0), 0) / valid.length
              : 0
          return <span style={{ fontWeight: 'bold' }}>{avg.toFixed(2)}%</span>
        }
        return value ? `${value.toFixed(2)}%` : '0%'
      },
    },
    {
      title: '平均成绩',
      dataIndex: 'averageScore',
      key: 'averageScore',
      width: 100,
      align: 'center',
      render: (value, record, index) => {
        if (index === data.length - 1) {
          const records = data.slice(0, -1)
          const totalScores = records.reduce(
            (sum, item) => sum + item.averageScore * item.numberOfTrainees,
            0,
          )
          const totalTrainees = records.reduce((sum, item) => sum + item.numberOfTrainees, 0)
          const avgScore = totalTrainees > 0 ? totalScores / totalTrainees : 0
          return <span style={{ fontWeight: 'bold' }}>{avgScore.toFixed(1)}</span>
        }
        return value ? value.toFixed(1) : '-'
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
              <Statistic
                title="总培训人次"
                value={summary.totalTrainees}
                prefix={<TeamOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic title="总合格人次" value={summary.totalQualified} suffix="人次" />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均考试合格率"
                value={summary.overallPassRate}
                precision={2}
                suffix="%"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均成绩"
                value={summary.overallAverageScore}
                precision={1}
                suffix="分"
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
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={
          <span>
            <BookOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {campus || '请选择神殿'}教化司培训计划与成绩汇总表
          </span>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
              刷新
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

export default TrainingPlanPerformanceTable
