import React, { useState, useEffect } from 'react'
import { App, Table, Card, Typography, Space, Input, Button, Row, Col, Statistic, Spin, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ReloadOutlined,
  DownloadOutlined,
  BookOutlined,
  UserOutlined,
  TrophyOutlined,
  PercentageOutlined,
} from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { trainingPlanPerformanceService } from '@/services/teaching-quality/trainingPlanPerformance'

// 定义表格数据的接口
interface TrainingPlanRecord {
  key: string
  campus: string // 神殿
  trainingCount: number // 培训次数（按月累计“实际培训计划数”）
  trainingPeople: number // 培训人数（按月累计“实际参与人数”）
  qualifiedPeople: number // 合格人数（∑ 实际参与人数 × 实际合格率）
  qualificationRate: number // 考试合格率（合格总人数/参与总人数）
  averageScore: number // 平均成绩（按参与人数加权）
}

const calculateTotals = (data: TrainingPlanRecord[]) => {
  if (data.length === 0) {
    return {
      key: 'total',
      campus: '合计/平均',
      trainingCount: 0,
      trainingPeople: 0,
      qualifiedPeople: 0,
      qualificationRate: 0,
      averageScore: 0,
    }
  }

  const totals = data.reduce(
    (acc, curr) => {
      acc.trainingCount += curr.trainingCount
      acc.trainingPeople += curr.trainingPeople
      acc.qualifiedPeople += curr.qualifiedPeople
      acc.totalScore += curr.averageScore * curr.trainingPeople // 用于计算加权平均
      acc.rateSum += curr.qualificationRate
      acc.rateCnt += curr.trainingCount > 0 ? 1 : 0
      return acc
    },
    {
      trainingCount: 0,
      trainingPeople: 0,
      qualifiedPeople: 0,
      totalScore: 0,
      rateSum: 0,
      rateCnt: 0,
    },
  )

  // 计算平均合格率：按神殿行做简单平均（与 11 表“按月份平均”同口径：每个神殿权重相同）
  const avgQualificationRate = totals.rateCnt > 0 ? parseFloat((totals.rateSum / totals.rateCnt).toFixed(1)) : 0

  // 计算加权平均成绩
  const avgScore =
    totals.trainingPeople > 0
      ? parseFloat((totals.totalScore / totals.trainingPeople).toFixed(1))
      : 0

  return {
    key: 'total',
    campus: '合计/平均',
    trainingCount: totals.trainingCount,
    trainingPeople: totals.trainingPeople,
    qualifiedPeople: totals.qualifiedPeople,
    qualificationRate: avgQualificationRate,
    averageScore: avgScore,
  }
}

const TrainingPlanPerformanceTable: React.FC = () => {
  const { message } = App.useApp()
  const campusStore = useCampusStore()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState<number>(currentYear)
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [allData, setAllData] = useState<TrainingPlanRecord[]>([])
  const [filteredData, setFilteredData] = useState<TrainingPlanRecord[]>([])

  const buildCampusRow = (campus: string, monthly: any[]): TrainingPlanRecord => {
    // monthly 为 TrainingPlanPerformanceRecord[]，我们只取 month>0 的月份
    const rows = monthly.filter((r: any) => r.month > 0)

    // 培训次数：等于 11 表的“培训场次”全年合计（按月汇总的 __sessionCount 求和）
    const trainingCount = rows.reduce((s: number, r: any) => s + (Number(r.__sessionCount) || 0), 0)

    // 培训人数：沿用 11 表月度汇总里的 numberOfTrainees 求和
    const trainingPeople = rows.reduce((s: number, r: any) => s + (Number(r.numberOfTrainees) || 0), 0)

    // 合格人数：沿用 11 表月度汇总里的 numberOfQualified 求和
    const qualifiedPeople = rows.reduce((s: number, r: any) => s + (Number(r.numberOfQualified) || 0), 0)

    // 考试合格率：按“有培训场次的月份”的 examPassRate 做简单平均（与 11 表合计行一致）
    const validForRate = rows.filter((r: any) => Number(r.__sessionCount || 0) > 0)
    const avgPassRate =
      validForRate.length > 0
        ? validForRate.reduce((sum: number, r: any) => sum + (Number(r.examPassRate) || 0), 0) /
          validForRate.length
        : 0

    // 平均成绩：按参与人数加权（保持你当前页面的展示口径）
    const totalScore = rows.reduce(
      (s: number, r: any) => s + (Number(r.averageScore) || 0) * (Number(r.numberOfTrainees) || 0),
      0,
    )
    const avgScore = trainingPeople > 0 ? totalScore / trainingPeople : 0

    return {
      key: campus,
      campus,
      trainingCount,
      trainingPeople,
      qualifiedPeople,
      qualificationRate: Number(avgPassRate.toFixed(1)),
      averageScore: Number(avgScore.toFixed(1)),
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const campusNames = campusStore.getAllCampuses().map((c) => c.name)
      const lists = await Promise.all(
        campusNames.map((name) =>
          trainingPlanPerformanceService
            .getTrainingPlanPerformanceData(name, year)
            .catch(() => []),
        ),
      )
      const rows = campusNames.map((name, idx) => buildCampusRow(name, lists[idx] as any[]))
      setAllData(rows)
      setFilteredData(
        searchText
          ? rows.filter((r) => r.campus.toLowerCase().includes(searchText.toLowerCase()))
          : rows,
      )
      message.success('数据加载成功')
    } catch (e) {
      console.error(e)
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [year])

  const handleSearch = (value: string) => {
    setSearchText(value)
    if (value) {
      const lowercasedValue = value.toLowerCase()
      const filtered = allData.filter((record) =>
        record.campus.toLowerCase().includes(lowercasedValue),
      )
      setFilteredData(filtered)
    } else {
      setFilteredData(allData)
    }
  }

  const handleRefresh = () => {
    setSearchText('')
    loadData()
  }

  const handleExport = () => {
    // 直接导出当前列表
    const csv = [
      '神殿,培训次数,培训人数,合格人数,考试合格率(%),平均成绩',
      ...filteredData.map(
        (r) => `${r.campus},${r.trainingCount},${r.trainingPeople},${r.qualifiedPeople},${r.qualificationRate.toFixed(1)}%,${r.averageScore.toFixed(1)}`,
      ),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `教化司培训计划与成绩汇总_${year}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const columns: ColumnsType<TrainingPlanRecord> = [
    {
      title: '序号',
      dataIndex: 'key',
      key: 'key',
      width: 80,
      fixed: 'left',
      render: (text, record, index) => (record.key === 'total' ? '' : index + 1),
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 120,
      fixed: 'left',
      render: (text, record) =>
        record.key === 'total' ? <Typography.Text strong>{text}</Typography.Text> : text,
    },
    {
      title: '培训次数',
      dataIndex: 'trainingCount',
      key: 'trainingCount',
      width: 120,
      render: (value, record) => {
        if (record.key === 'total') return value
        return value > 0 ? value : ''
      },
    },
    {
      title: '培训人数',
      dataIndex: 'trainingPeople',
      key: 'trainingPeople',
      width: 120,
      render: (value, record) => {
        if (record.key === 'total') return value
        return value > 0 ? value : ''
      },
    },
    {
      title: '合格人数',
      dataIndex: 'qualifiedPeople',
      key: 'qualifiedPeople',
      width: 120,
      render: (value, record) => {
        if (record.key === 'total') return value
        return value > 0 ? value : ''
      },
    },
    {
      title: '考试合格率',
      dataIndex: 'qualificationRate',
      key: 'qualificationRate',
      width: 130,
      render: (value, record) => {
        if (record.key === 'total') {
          // 合计行：如果培训人数为0，显示#DIV/0!
          return record.trainingPeople === 0 ? '#DIV/0!' : `${value}%`
        }
        // 非合计行
        if (record.trainingPeople === 0) return '#DIV/0!'
        return value > 0 ? `${value}%` : ''
      },
    },
    {
      title: '平均成绩',
      dataIndex: 'averageScore',
      key: 'averageScore',
      width: 120,
      render: (value, record) => {
        if (record.key === 'total') {
          // 合计行：如果培训人数为0，显示#DIV/0!
          return record.trainingPeople === 0 ? '#DIV/0!' : value
        }
        // 非合计行
        if (record.trainingPeople === 0) return '#DIV/0!'
        return value > 0 ? value : ''
      },
    },
  ]

  const summaryRow = calculateTotals(filteredData)
  const dataSourceWithSummary = [...filteredData, summaryRow]

  // 计算关键指标
  const totalTrainingCount = summaryRow.trainingCount
  const totalTrainingPeople = summaryRow.trainingPeople
  const totalQualifiedPeople = summaryRow.qualifiedPeople
  const avgQualificationRate = summaryRow.qualificationRate
  const avgScore = summaryRow.averageScore
  const unqualifiedPeople = totalTrainingPeople - totalQualifiedPeople

  return (
    <div style={{ padding: 24 }}>
      {/* 关键指标卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="培训总次数"
              value={totalTrainingCount}
              suffix="次"
              prefix={<BookOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="培训总人数"
              value={totalTrainingPeople}
              suffix="人"
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="合格总人数"
              value={totalQualifiedPeople}
              suffix="人"
              prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="未合格人数"
              value={unqualifiedPeople}
              suffix="人"
              prefix={<UserOutlined style={{ color: '#f5222d' }} />}
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Statistic
              title="平均合格率"
              value={avgQualificationRate}
              suffix="%"
              precision={1}
              prefix={<PercentageOutlined style={{ color: '#722ed1' }} />}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="平均成绩"
              value={avgScore}
              suffix="分"
              precision={1}
              prefix={<TrophyOutlined style={{ color: '#13c2c2' }} />}
            />
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card
        title={`11最高议事厅教化司培训计划与成绩汇总表（${year}年）`}
        extra={
          <Space>
            <Select value={year} style={{ width: 120 }} onChange={setYear}>
              {[0, 1, 2].map((i) => {
                const y = currentYear - i
                return (
                  <Select.Option key={y} value={y}>{y}年</Select.Option>
                )
              })}
            </Select>
            <Input.Search
              placeholder="搜索神殿"
              onSearch={handleSearch}
              style={{ width: 200 }}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={filteredData.length === 0}>
              导出
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={dataSourceWithSummary}
            pagination={false}
            bordered
            scroll={{ x: 'max-content' }}
            rowClassName={(record) => (record.key === 'total' ? 'summary-row' : '')}
          />
        </Spin>
        <style>{`
          .summary-row {
            background-color: #f0f9ff !important;
            font-weight: bold;
          }
          .summary-row td {
            background-color: #f0f9ff !important;
          }
        `}</style>
      </Card>
    </div>
  )
}

export default TrainingPlanPerformanceTable
