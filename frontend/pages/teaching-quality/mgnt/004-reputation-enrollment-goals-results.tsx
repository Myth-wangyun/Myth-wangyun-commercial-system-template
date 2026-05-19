import React, { useState, useEffect } from 'react'
import { App, Table, Card, Typography, Space, Input, Button, Row, Col, Statistic, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ReloadOutlined,
  DownloadOutlined,
  BarChartOutlined,
  UserOutlined,
  DollarOutlined,
  TeamOutlined,
} from '@ant-design/icons'

// 定义表格数据的接口
interface ReputationEnrollmentGoalsResultsRecord {
  key: string
  campus: string // 神殿
  targetReputationCount: number // 目标口碑量
  actualReputationCount: number // 实际口碑量
  targetVisitCount: number // 目标上门量
  actualVisitCount: number // 实际上门量
  targetEnrollmentCount: number // 目标招生人数
  actualEnrollmentCount: number // 实际招生人数
  targetRevenue: number // 目标收入
  actualRevenue: number // 实际收入
}

// API 响应接口
interface ApiResponse {
  年份: number
  行列表: Array<{
    campus: string
    targetReputationCount: number
    actualReputationCount: number
    targetVisitCount: number
    actualVisitCount: number
    targetEnrollmentCount: number
    actualEnrollmentCount: number
    targetRevenue: number
    actualRevenue: number
  }>
}

function buildApiUrl(path: string): string {
  // 项目使用 Vite（不是 Next.js），环境变量应来自 import.meta.env
  // 生产环境使用相对路径，由 nginx 反代
  const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1'
  return `${baseUrl}${path}`
}

const calculateTotals = (data: ReputationEnrollmentGoalsResultsRecord[]) => {
  if (data.length === 0) {
    return {
      key: 'total',
      campus: '合计',
      targetReputationCount: 0,
      actualReputationCount: 0,
      targetVisitCount: 0,
      actualVisitCount: 0,
      targetEnrollmentCount: 0,
      actualEnrollmentCount: 0,
      targetRevenue: 0,
      actualRevenue: 0,
    }
  }

  const totals = data.reduce(
    (acc, curr) => {
      acc.targetReputationCount += curr.targetReputationCount
      acc.actualReputationCount += curr.actualReputationCount
      acc.targetVisitCount += curr.targetVisitCount
      acc.actualVisitCount += curr.actualVisitCount
      acc.targetEnrollmentCount += curr.targetEnrollmentCount
      acc.actualEnrollmentCount += curr.actualEnrollmentCount
      acc.targetRevenue += curr.targetRevenue
      acc.actualRevenue += curr.actualRevenue
      return acc
    },
    {
      targetReputationCount: 0,
      actualReputationCount: 0,
      targetVisitCount: 0,
      actualVisitCount: 0,
      targetEnrollmentCount: 0,
      actualEnrollmentCount: 0,
      targetRevenue: 0,
      actualRevenue: 0,
    },
  )

  return {
    key: 'total',
    campus: '合计',
    ...totals,
  }
}

const ReputationEnrollmentGoalsResultsTable: React.FC = () => {
  const { message } = App.useApp()
  const [, setSearchText] = useState('')
  const [filteredData, setFilteredData] = useState<ReputationEnrollmentGoalsResultsRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [year] = useState(new Date().getFullYear())
  const [allData, setAllData] = useState<ReputationEnrollmentGoalsResultsRecord[]>([])

  // 获取数据
  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        buildApiUrl(`/teaching-quality/mgnt-reputation-enrollment-goals-results?year=${year}`)
      )
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: ApiResponse = await response.json()
      
      // 转换数据格式，添加key（过滤后端可能返回的“合计”行，前端统一自行计算合计）
      const list = (data.行列表 || []).filter((item) => item.campus !== '合计')
      const records: ReputationEnrollmentGoalsResultsRecord[] = list.map((item, index) => ({
        key: `${index}`,
        campus: item.campus,
        targetReputationCount: item.targetReputationCount,
        actualReputationCount: item.actualReputationCount,
        targetVisitCount: item.targetVisitCount,
        actualVisitCount: item.actualVisitCount,
        targetEnrollmentCount: item.targetEnrollmentCount,
        actualEnrollmentCount: item.actualEnrollmentCount,
        targetRevenue: item.targetRevenue,
        actualRevenue: item.actualRevenue,
      }))
      
      setAllData(records)
      setFilteredData(records)
      message.success('数据加载成功')
    } catch (error) {
      console.error('获取数据失败:', error)
      message.error('获取数据失败，请重试')
      setAllData([])
      setFilteredData([])
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载数据
  useEffect(() => {
    fetchData()
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
    fetchData()
  }

  const handleExport = () => {
    // 导出功能
    console.log('导出数据')
    message.info('导出功能开发中...')
  }

  const columns: ColumnsType<ReputationEnrollmentGoalsResultsRecord> = [
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
      title: '口碑量',
      children: [
        {
          title: '目标口碑量',
          dataIndex: 'targetReputationCount',
          key: 'targetReputationCount',
          width: 120,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '实际口碑量',
          dataIndex: 'actualReputationCount',
          key: 'actualReputationCount',
          width: 120,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
      ],
    },
    {
      title: '上门量',
      children: [
        {
          title: '目标上门量',
          dataIndex: 'targetVisitCount',
          key: 'targetVisitCount',
          width: 120,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '实际上门量',
          dataIndex: 'actualVisitCount',
          key: 'actualVisitCount',
          width: 120,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
      ],
    },
    {
      title: '招生人数',
      children: [
        {
          title: '目标人数',
          dataIndex: 'targetEnrollmentCount',
          key: 'targetEnrollmentCount',
          width: 120,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '实际人数',
          dataIndex: 'actualEnrollmentCount',
          key: 'actualEnrollmentCount',
          width: 120,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
      ],
    },
    {
      title: '口碑收入',
      children: [
        {
          title: '目标收入',
          dataIndex: 'targetRevenue',
          key: 'targetRevenue',
          width: 120,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '实际收入',
          dataIndex: 'actualRevenue',
          key: 'actualRevenue',
          width: 120,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
      ],
    },
  ]

  // 前端统一计算合计行（不依赖后端返回合计）
  const summaryRow = calculateTotals(filteredData)
  const dataSourceWithSummary = [...filteredData, summaryRow]

  // 计算关键指标
  const totalTargetReputation = summaryRow.targetReputationCount
  const totalActualReputation = summaryRow.actualReputationCount
  const totalTargetEnrollment = summaryRow.targetEnrollmentCount
  const totalActualEnrollment = summaryRow.actualEnrollmentCount
  // const totalTargetRevenue = summaryRow.targetRevenue
  const totalActualRevenue = summaryRow.actualRevenue
  const reputationCompletionRate =
    totalTargetReputation > 0
      ? parseFloat(((totalActualReputation / totalTargetReputation) * 100).toFixed(1))
      : 0
  const enrollmentCompletionRate =
    totalTargetEnrollment > 0
      ? parseFloat(((totalActualEnrollment / totalTargetEnrollment) * 100).toFixed(1))
      : 0

  return (
    <div style={{ padding: 24 }}>
      {/* 关键指标卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="口碑完成率"
              value={reputationCompletionRate}
              suffix="%"
              prefix={<BarChartOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="招生完成率"
              value={enrollmentCompletionRate}
              suffix="%"
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="实际招生人数"
              value={totalActualEnrollment}
              suffix="人"
              prefix={<UserOutlined style={{ color: '#faad14' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="实际收入"
              value={totalActualRevenue}
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
              formatter={(value) => `¥${value}`}
            />
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card
        title="04最高议事厅教化司口碑招生目标与结果汇总表"
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
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={dataSourceWithSummary}
            pagination={false}
            bordered
            scroll={{ x: 'max-content' }}
            rowClassName={(record) => (record.campus === '合计' ? 'summary-row' : '')}
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

export default ReputationEnrollmentGoalsResultsTable
