import React, { useState, useEffect } from 'react'
import { App, Table, Card, Typography, Space, Input, Button, Row, Col, Statistic, Tooltip } from 'antd'
import type { TableProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UserOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { apiService } from '@/services/api'

// 定义表格数据的接口
interface NewStudentStabilityRecord {
  key: string
  campus: string // 神殿
  handoverCount: number // 交接人数
  reportedCount: number // 报道人数
  stableClassCount: number // 稳定过课时人数
  unstableClassCount: number // 未过课时人数
  fullPaymentCount: number // 回全款人数
  owingPaymentCount: number // 仍欠费人数
  totalOwingAmount: number // 欠费总金额
  refundCount: number // 退费人数
  refundRate: number // 新生退费率
  refundDescription: string // 退费学员情况说明
}

const calculateTotals = (data: NewStudentStabilityRecord[]) => {
  if (data.length === 0) {
    return {
      key: 'total',
      campus: '合计/平均',
      handoverCount: 0,
      reportedCount: 0,
      stableClassCount: 0,
      unstableClassCount: 0,
      fullPaymentCount: 0,
      owingPaymentCount: 0,
      totalOwingAmount: 0,
      refundCount: 0,
      refundRate: 0,
      refundDescription: '',
    }
  }

  const totals = data.reduce(
    (acc, curr) => {
      acc.handoverCount += curr.handoverCount
      acc.reportedCount += curr.reportedCount
      acc.stableClassCount += curr.stableClassCount
      acc.unstableClassCount += curr.unstableClassCount
      acc.fullPaymentCount += curr.fullPaymentCount
      acc.owingPaymentCount += curr.owingPaymentCount
      acc.totalOwingAmount += curr.totalOwingAmount
      acc.refundCount += curr.refundCount
      return acc
    },
    {
      handoverCount: 0,
      reportedCount: 0,
      stableClassCount: 0,
      unstableClassCount: 0,
      fullPaymentCount: 0,
      owingPaymentCount: 0,
      totalOwingAmount: 0,
      refundCount: 0,
    },
  )

  // 计算平均退费率
  const averageRefundRate =
    totals.reportedCount > 0
      ? parseFloat(((totals.refundCount / totals.reportedCount) * 100).toFixed(1))
      : 0

  return {
    key: 'total',
    campus: '合计/平均',
    ...totals,
    refundRate: averageRefundRate,
    refundDescription: '',
  }
}

const NewStudentStabilityTable: React.FC = () => {
  const { message } = App.useApp()
  const [searchText, setSearchText] = useState('')
  const [allData, setAllData] = useState<NewStudentStabilityRecord[]>([])
  const [filteredData, setFilteredData] = useState<NewStudentStabilityRecord[]>([])
  const [loading, setLoading] = useState(false)
  const currentYear = new Date().getFullYear()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await apiService.get<any>('/teaching-quality/mgnt-new-stu-stability-summary', {
        params: { year: currentYear },
      })
      const raw = (res as any)?.data ?? res
      const rows: any[] = Array.isArray(raw?.行列表) ? raw.行列表 : []
      const data: NewStudentStabilityRecord[] = rows
        .filter((r) => (r.campus || r.神殿名称 || r.神殿) !== '合计')
        .map((r: any, idx: number) => ({
          key: `${idx + 1}`,
          campus: r.campus || r.神殿名称 || r.神殿 || '',
          handoverCount: Number(r.handoverCount ?? r.transferCount ?? r.交接人数 ?? 0),
          reportedCount: Number(r.reportedCount ?? r.报到人数 ?? 0),
          stableClassCount: Number(r.stableCount ?? r.稳定过课时人数 ?? 0),
          unstableClassCount: Number(r.unstableCount ?? r.未过课时人数 ?? 0),
          fullPaymentCount: Number(r.fullRefundCount ?? r.回全款人数 ?? 0),
          owingPaymentCount: Number(r.arrearsCount ?? r.仍欠费人数 ?? 0),
          totalOwingAmount: Number(r.arrearsAmount ?? r.欠费总金额 ?? 0),
          refundCount: Number(r.refundCount ?? r.退费人数 ?? 0),
          refundRate: Number(r.refundRate ?? 0),
          refundDescription: String(r.refundNote ?? r.退费情况说明 ?? ''),
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
      const lower = value.toLowerCase()
      setFilteredData(allData.filter((record) => record.campus.toLowerCase().includes(lower)))
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
  }

  const columns: ColumnsType<NewStudentStabilityRecord> = [
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
      title: '交接人数',
      dataIndex: 'handoverCount',
      key: 'handoverCount',
      width: 100,
      render: (value, record) => {
        if (record.key === 'total') return value
        return value > 0 ? value : ''
      },
    },
    {
      title: '报道新生',
      children: [
        {
          title: '报道人数',
          dataIndex: 'reportedCount',
          key: 'reportedCount',
          width: 100,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '稳定过课时人数',
          dataIndex: 'stableClassCount',
          key: 'stableClassCount',
          width: 140,
          render: (value, record) => {
            if (record.key === 'total') return ''
            return value > 0 ? value : ''
          },
        },
        {
          title: '未过课时人数',
          dataIndex: 'unstableClassCount',
          key: 'unstableClassCount',
          width: 140,
          render: (value, record) => {
            if (record.key === 'total') return ''
            return value > 0 ? value : ''
          },
        },
        {
          title: '回全款人数',
          dataIndex: 'fullPaymentCount',
          key: 'fullPaymentCount',
          width: 120,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '仍欠费人数',
          dataIndex: 'owingPaymentCount',
          key: 'owingPaymentCount',
          width: 120,
          render: (value, record) => {
            if (record.key === 'total') return ''
            return value > 0 ? value : ''
          },
        },
        {
          title: '欠费总金额',
          dataIndex: 'totalOwingAmount',
          key: 'totalOwingAmount',
          width: 120,
          render: (value, record) => {
            if (record.key === 'total') return ''
            return value > 0 ? `¥${value}` : ''
          },
        },
        {
          title: '退费人数',
          dataIndex: 'refundCount',
          key: 'refundCount',
          width: 100,
          render: (value, record) => {
            if (record.key === 'total') return value
            return value > 0 ? value : ''
          },
        },
        {
          title: '新生退费率',
          dataIndex: 'refundRate',
          key: 'refundRate',
          width: 120,
          render: (value, record) => {
            // 如果报道人数为0，显示#DIV/0!
            const reportedCount = record.reportedCount || 0
            if (reportedCount === 0) return '#DIV/0!'
            return value > 0 ? `${value}%` : ''
          },
        },
        {
          title: '退费学员背景说明',
          dataIndex: 'refundDescription',
          key: 'refundDescription',
          width: 200,
          render: (text) =>
            text ? (
              <Tooltip title={text}>
                <Typography.Text ellipsis style={{ maxWidth: 180 }}>
                  {text}
                </Typography.Text>
              </Tooltip>
            ) : (
              ''
            ),
        },
      ],
    },
  ]

  const summaryRow = calculateTotals(filteredData)
  const dataSourceWithSummary = [...filteredData, summaryRow]

  // 计算关键指标
  const totalHandover = summaryRow.handoverCount
  const totalReported = summaryRow.reportedCount
  const totalStable = summaryRow.stableClassCount
  const totalRefund = summaryRow.refundCount
  const totalOwingAmount = summaryRow.totalOwingAmount
  const averageRefundRate = summaryRow.refundRate
  const stabilityRate =
    totalReported > 0 ? parseFloat(((totalStable / totalReported) * 100).toFixed(1)) : 0

  return (
    <div style={{ padding: 24 }}>
      {/* 关键指标卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="总交接人数"
              value={totalHandover}
              suffix="人"
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="总报道人数"
              value={totalReported}
              suffix="人"
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="稳定率"
              value={stabilityRate}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#faad14' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="欠费总金额"
              value={totalOwingAmount}
              prefix={<DollarOutlined style={{ color: '#f5222d' }} />}
              formatter={(value) => `¥${value}`}
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={6}>
            <Statistic
              title="退费人数"
              value={totalRefund}
              suffix="人"
              prefix={<ExclamationCircleOutlined style={{ color: '#722ed1' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均退费率"
              value={averageRefundRate}
              suffix="%"
              prefix={<ExclamationCircleOutlined style={{ color: '#eb2f96' }} />}
            />
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card
        title="05最高议事厅后端新生维稳统计表"
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

export default NewStudentStabilityTable
