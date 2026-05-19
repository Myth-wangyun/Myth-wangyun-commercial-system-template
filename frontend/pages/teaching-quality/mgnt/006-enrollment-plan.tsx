import React, { useEffect, useState } from 'react'
import { App, Table, Card, Typography, Space, Input, Button, Row, Col, Statistic } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ReloadOutlined,
  DownloadOutlined,
  UserOutlined,
  DollarOutlined,
  BarChartOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { apiService } from '@/services/api'

// 定义表格数据的接口
interface EnrollmentPlanRecord {
  key: string
  campus: string // 神殿
  totalClasses: number // 升学班级总数
  totalStudents: number // 在档总人数
  estimatedEnrollment: number // 预计升学总人数
  actualEnrollment: number // 实际升学总人数
  estimatedEnrollmentRate: number // 预计升学率（人数）
  actualEnrollmentRate: number // 实际升学率（人数）
  accountsReceivable: number // 应收
  estimatedRevenue: number // 预计升学收入
  actualRevenue: number // 实际升学收入
  estimatedRevenueRate: number // 预计升学率（金额）
  actualRevenueRate: number // 实际升学率（金额）
}

// 计算合计
const calculateTotals = (data: EnrollmentPlanRecord[]) => {
  if (data.length === 0) {
    return {
      key: 'total',
      campus: '合计/平均',
      totalClasses: 0,
      totalStudents: 0,
      estimatedEnrollment: 0,
      actualEnrollment: 0,
      estimatedEnrollmentRate: 0,
      actualEnrollmentRate: 0,
      accountsReceivable: 0,
      estimatedRevenue: 0,
      actualRevenue: 0,
      estimatedRevenueRate: 0,
      actualRevenueRate: 0,
    }
  }

  const totals = data.reduce(
    (acc, curr) => {
      acc.totalClasses += curr.totalClasses
      acc.totalStudents += curr.totalStudents
      acc.estimatedEnrollment += curr.estimatedEnrollment
      acc.actualEnrollment += curr.actualEnrollment
      acc.accountsReceivable += curr.accountsReceivable
      acc.estimatedRevenue += curr.estimatedRevenue
      acc.actualRevenue += curr.actualRevenue
      return acc
    },
    {
      totalClasses: 0,
      totalStudents: 0,
      estimatedEnrollment: 0,
      actualEnrollment: 0,
      accountsReceivable: 0,
      estimatedRevenue: 0,
      actualRevenue: 0,
    },
  )

  // 计算平均升学率
  const averageEstimatedRate =
    totals.totalStudents > 0
      ? parseFloat(((totals.estimatedEnrollment / totals.totalStudents) * 100).toFixed(1))
      : 0
  const averageActualRate =
    totals.totalStudents > 0
      ? parseFloat(((totals.actualEnrollment / totals.totalStudents) * 100).toFixed(1))
      : 0

  // 计算平均收入率
  const averageEstimatedRevenueRate =
    totals.accountsReceivable > 0
      ? parseFloat(((totals.estimatedRevenue / totals.accountsReceivable) * 100).toFixed(1))
      : 0
  const averageActualRevenueRate =
    totals.accountsReceivable > 0
      ? parseFloat(((totals.actualRevenue / totals.accountsReceivable) * 100).toFixed(1))
      : 0

  return {
    key: 'total',
    campus: '合计/平均',
    ...totals,
    estimatedEnrollmentRate: averageEstimatedRate,
    actualEnrollmentRate: averageActualRate,
    estimatedRevenueRate: averageEstimatedRevenueRate,
    actualRevenueRate: averageActualRevenueRate,
  }
}

const EnrollmentPlanTable: React.FC = () => {
  const { message } = App.useApp()
  const [allData, setAllData] = useState<EnrollmentPlanRecord[]>([])
  const [filteredData, setFilteredData] = useState<EnrollmentPlanRecord[]>([])
  const [loading, setLoading] = useState(false)
  const currentYear = new Date().getFullYear()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await apiService.get<any>('/teaching-quality/mgnt-promotion-plan', {
        params: { year: currentYear },
      })
      const raw = (res as any)?.data ?? res
      const rows: any[] = Array.isArray(raw?.行列表) ? raw.行列表 : []
      const data: EnrollmentPlanRecord[] = rows
        .filter((r) => (r.campus || r.神殿) !== '合计/平均')
        .map((r: any, idx: number) => ({
          key: `${idx + 1}`,
          campus: r.campus || r.神殿 || '',
          totalClasses: Number(r.totalClasses ?? 0),
          totalStudents: Number(r.totalStudents ?? 0),
          estimatedEnrollment: Number(r.targetPromotionCount ?? 0),
          actualEnrollment: Number(r.actualPromotionCount ?? 0),
          accountsReceivable: Number(r.accountsReceivable ?? 0),
          estimatedRevenue: Number(r.targetRevenue ?? 0),
          actualRevenue: Number(r.actualRevenue ?? 0),

          // 预计升学率（人数）= 预计升学总人数 / 在档总人数 * 100
          estimatedEnrollmentRate:
            Number(r.totalStudents ?? 0) > 0
              ? parseFloat(
                  (
                    (Number(r.targetPromotionCount ?? 0) / Number(r.totalStudents ?? 0)) *
                    100
                  ).toFixed(1),
                )
              : 0,
          // 实际升学率（人数）= 实际升学总人数 / 在档总人数 * 100
          actualEnrollmentRate:
            Number(r.totalStudents ?? 0) > 0
              ? parseFloat(
                  (
                    (Number(r.actualPromotionCount ?? 0) / Number(r.totalStudents ?? 0)) *
                    100
                  ).toFixed(1),
                )
              : 0,

          // 预计升学率（金额）= 预计升学收入 / 应收 * 100
          estimatedRevenueRate:
            Number(r.accountsReceivable ?? 0) > 0
              ? parseFloat(
                  (
                    (Number(r.targetRevenue ?? 0) / Number(r.accountsReceivable ?? 0)) *
                    100
                  ).toFixed(1),
                )
              : 0,
          // 实际升学率（金额）= 实际升学收入 / 应收 * 100
          actualRevenueRate:
            Number(r.accountsReceivable ?? 0) > 0
              ? parseFloat(
                  (
                    (Number(r.actualRevenue ?? 0) / Number(r.accountsReceivable ?? 0)) *
                    100
                  ).toFixed(1),
                )
              : 0,
        }))
      setAllData(data)
      setFilteredData(data)
    } catch (e) {
      message.error('获取数据失败')
      setAllData([])
      setFilteredData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSearch = (value: string) => {
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
    fetchData()
  }

  const handleExport = () => {
    // 导出功能
    console.log('导出数据')
  }

  const columns: ColumnsType<EnrollmentPlanRecord> = [
    {
      title: '序号',
      dataIndex: 'key',
      key: 'key',
      width: 80,
      fixed: 'left',
      render: (_text, record, index) => (record.key === 'total' ? '' : index + 1),
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
      title: '升学班级总数',
      dataIndex: 'totalClasses',
      key: 'totalClasses',
      width: 120,
      render: (value, record) => {
        if (record.key === 'total') return value
        return value > 0 ? value : ''
      },
    },
    {
      title: '在档总人数',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
      width: 120,
      render: (value, record) => {
        if (record.key === 'total') return value
        return value > 0 ? value : ''
      },
    },
    {
      title: '预计升学总人数',
      dataIndex: 'estimatedEnrollment',
      key: 'estimatedEnrollment',
      width: 140,
      render: (value, record) => {
        if (record.key === 'total') return value
        return value > 0 ? value : ''
      },
    },
    {
      title: '实际升学总人数',
      dataIndex: 'actualEnrollment',
      key: 'actualEnrollment',
      width: 140,
      render: (value, record) => {
        if (record.key === 'total') return value
        return value > 0 ? value : ''
      },
    },
    {
      title: '预计升学率（人数）',
      dataIndex: 'estimatedEnrollmentRate',
      key: 'estimatedEnrollmentRate',
      width: 150,
      render: (value, record) => {
        if (record.key === 'total') return value ? `${value}%` : '0%'
        const totalStudents = record.totalStudents || 0
        // 无分母时展示 0%
        if (totalStudents === 0) return '0%'
        return `${Number(value ?? 0).toFixed(1)}%`
      },
    },
    {
      title: '实际升学率（人数）',
      dataIndex: 'actualEnrollmentRate',
      key: 'actualEnrollmentRate',
      width: 150,
      render: (value, record) => {
        if (record.key === 'total') return value ? `${value}%` : '0%'
        const totalStudents = record.totalStudents || 0
        // 无分母时展示 0%
        if (totalStudents === 0) return '0%'
        return `${Number(value ?? 0).toFixed(1)}%`
      },
    },
    {
      title: '应收',
      dataIndex: 'accountsReceivable',
      key: 'accountsReceivable',
      width: 120,
      render: (value, record) => {
        if (record.key === 'total') return value
        return value > 0 ? value : ''
      },
    },
    {
      title: '预计升学收入',
      dataIndex: 'estimatedRevenue',
      key: 'estimatedRevenue',
      width: 140,
      render: (value, record) => {
        if (record.key === 'total') return value
        return value > 0 ? value : ''
      },
    },
    {
      title: '实际升学收入',
      dataIndex: 'actualRevenue',
      key: 'actualRevenue',
      width: 140,
      render: (value, record) => {
        if (record.key === 'total') return value
        return value > 0 ? value : ''
      },
    },
    {
      title: '预计升学率（金额）',
      dataIndex: 'estimatedRevenueRate',
      key: 'estimatedRevenueRate',
      width: 150,
      render: (value, record) => {
        if (record.key === 'total') return value ? `${value}%` : '0%'
        const accountsReceivable = record.accountsReceivable || 0
        // 无分母时展示 0%
        if (accountsReceivable === 0) return '0%'
        return `${Number(value ?? 0).toFixed(1)}%`
      },
    },
    {
      title: '实际升学率（金额）',
      dataIndex: 'actualRevenueRate',
      key: 'actualRevenueRate',
      width: 150,
      render: (value, record) => {
        if (record.key === 'total') return value ? `${value}%` : '0%'
        const accountsReceivable = record.accountsReceivable || 0
        // 无分母时展示 0%
        if (accountsReceivable === 0) return '0%'
        return `${Number(value ?? 0).toFixed(1)}%`
      },
    },
  ]

  const summaryRow = calculateTotals(filteredData)
  const dataSourceWithSummary = [...filteredData, summaryRow]

  // 计算关键指标
  const totalClasses = summaryRow.totalClasses
  const totalStudents = summaryRow.totalStudents
  const actualEnrollment = summaryRow.actualEnrollment
  const actualRevenue = summaryRow.actualRevenue
  const actualEnrollmentRate = summaryRow.actualEnrollmentRate
  const actualRevenueRate = summaryRow.actualRevenueRate

  return (
    <div style={{ padding: 24 }}>
      {/* 关键指标卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="升学班级总数"
              value={totalClasses}
              suffix="个"
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="在档总人数"
              value={totalStudents}
              suffix="人"
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="实际升学率"
              value={actualEnrollmentRate}
              suffix="%"
              prefix={<BarChartOutlined style={{ color: '#faad14' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="实际升学收入"
              value={actualRevenue}
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
              formatter={(value) => `¥${value}`}
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={6}>
            <Statistic
              title="实际升学人数"
              value={actualEnrollment}
              suffix="人"
              prefix={<TrophyOutlined style={{ color: '#f5222d' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="实际收入率"
              value={actualRevenueRate}
              suffix="%"
              prefix={<BarChartOutlined style={{ color: '#eb2f96' }} />}
            />
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card
        title="06最高议事厅教化司升学计划"
        extra={
          <Space>
            <Input.Search
              placeholder="搜索神殿"
              onSearch={handleSearch}
              style={{ width: 200 }}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={dataSourceWithSummary}
          pagination={false}
          bordered
          scroll={{ x: 'max-content' }}
          rowClassName={(record) => (record.key === 'total' ? 'summary-row' : '')}
          loading={loading}
        />
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

export default EnrollmentPlanTable
