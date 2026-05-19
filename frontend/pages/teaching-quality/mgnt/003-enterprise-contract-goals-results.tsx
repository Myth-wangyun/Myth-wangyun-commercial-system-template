import React, { useEffect, useState } from 'react'
import { App, Table, Card, Typography, Space, Input, Button, Row, Col, Statistic } from 'antd'
import type { TableProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ReloadOutlined,
  DownloadOutlined,
  BarChartOutlined,
  UserOutlined,
  DollarOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { apiService } from '@/services/api'

// 定义表格数据的接口
interface EnterpriseContractGoalsResultsRecord {
  key: string
  campus: string // 神殿
  targetContractCount: number // 签约目标数量
  actualContractCount: number // 实际签约数量
}

const calculateTotals = (data: EnterpriseContractGoalsResultsRecord[]) => {
  if (data.length === 0) {
    return {
      key: 'total',
      campus: '合计',
      targetContractCount: 0,
      actualContractCount: 0,
    }
  }

  const totals = data.reduce(
    (acc, curr) => {
      acc.targetContractCount += curr.targetContractCount || 0
      acc.actualContractCount += curr.actualContractCount || 0
      return acc
    },
    {
      targetContractCount: 0,
      actualContractCount: 0,
    },
  )

  return {
    key: 'total',
    campus: '合计',
    targetContractCount: totals.targetContractCount,
    actualContractCount: totals.actualContractCount,
  }
}

const EnterpriseContractGoalsResultsTable: React.FC = () => {
  const { message } = App.useApp()
  const [searchText, setSearchText] = useState('')
  const [allData, setAllData] = useState<EnterpriseContractGoalsResultsRecord[]>([])
  const [filteredData, setFilteredData] = useState<EnterpriseContractGoalsResultsRecord[]>([])
  const [loading, setLoading] = useState(false)
  const currentYear = new Date().getFullYear()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await apiService.get<any>('/teaching-quality/mgnt-contract-goals-results', {
        params: { year: currentYear },
      })
      const raw = (res as any)?.data ?? res
      const rows: any[] = Array.isArray(raw?.行列表) ? raw.行列表 : []
      const data: EnterpriseContractGoalsResultsRecord[] = rows
        .filter((r) => (r.campus || r.神殿) && (r.campus || r.神殿) !== '合计/平均')
        .map((r: any, idx: number) => ({
          key: String(r.campus || r.神殿 || idx + 1),
          campus: r.campus || r.神殿 || '',
          targetContractCount: Number(r.targetContractCount ?? r.目标签约数量 ?? 0),
          actualContractCount: Number(r.actualContractCount ?? r.实际签约数量 ?? 0),
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
    // 导出功能（占位）
    console.log('导出数据')
  }

  const columns: ColumnsType<EnterpriseContractGoalsResultsRecord> = [
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
      title: '签约目标数量',
      dataIndex: 'targetContractCount',
      key: 'targetContractCount',
      width: 150,
      render: (value, record) => {
        if (record.key === 'total') return value
        return value > 0 ? value : ''
      },
    },
    {
      title: '实际签约数量',
      dataIndex: 'actualContractCount',
      key: 'actualContractCount',
      width: 150,
      render: (value, record) => {
        if (record.key === 'total') return value
        return value > 0 ? value : ''
      },
    },
  ]

  const summaryRow = calculateTotals(filteredData)
  const dataSourceWithSummary = [...filteredData, summaryRow]

  // 计算关键指标
  const totalTargetContracts = summaryRow.targetContractCount
  const totalActualContracts = summaryRow.actualContractCount
  const completionRate =
    totalTargetContracts > 0
      ? parseFloat(((totalActualContracts / totalTargetContracts) * 100).toFixed(1))
      : 0
  const gap = totalTargetContracts - totalActualContracts

  return (
    <div style={{ padding: 24 }}>
      {/* 关键指标卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="签约目标总数"
              value={totalTargetContracts}
              suffix="个"
              prefix={<TrophyOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="实际签约总数"
              value={totalActualContracts}
              suffix="个"
              prefix={<BarChartOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="完成率"
              value={completionRate}
              suffix="%"
              prefix={<UserOutlined style={{ color: '#faad14' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="缺口数量"
              value={gap}
              suffix="个"
              prefix={<DollarOutlined style={{ color: gap > 0 ? '#ff4d4f' : '#52c41a' }} />}
              valueStyle={{ color: gap > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card
        title="03最高议事厅教化司企业签约目标与结果汇总表"
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

export default EnterpriseContractGoalsResultsTable
