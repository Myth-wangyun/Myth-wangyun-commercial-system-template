/**
 * 神殿教化司企业签约目标与结果汇总表组件
 */

import React from 'react'
import { App, Card, Table, Button, Space, Row, Col, Statistic, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined, RiseOutlined } from '@ant-design/icons'
import type {
  ContractSigningSummaryTableProps,
  ContractSigningSummaryRecord,
} from '@/types/contract-signing-summary'
import { contractSigningSummaryService } from '@/services/contractSigningSummary'

const ContractSigningSummaryTable: React.FC<ContractSigningSummaryTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
}) => {
  const { message } = App.useApp()
  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob = await contractSigningSummaryService.exportContractSigningSummaryData(campus)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${campus}神殿教化司企业签约目标与结果汇总表.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  // 计算统计数据
  const stats = React.useMemo(() => {
    if (data.length === 0) {
      return {
        totalTargetCount: 0,
        totalActualCount: 0,
        achievementRate: 0,
        averageMonthlyCount: 0,
      }
    }

    const totalRow = data.find((r) => r.rowType === 'total')
    const totalTargetCount = totalRow?.targetCount || 0
    const totalActualCount = totalRow?.actualCount || 0
    const achievementRate =
      totalTargetCount > 0 ? Math.floor((totalActualCount / totalTargetCount) * 100) : 0
    const averageMonthlyCount = Math.floor(totalActualCount / 12)

    return {
      totalTargetCount,
      totalActualCount,
      achievementRate,
      averageMonthlyCount,
    }
  }, [data])

  const columns: ColumnsType<ContractSigningSummaryRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
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
        // 只在第一行显示神殿，其他行为空
        if (index === 0 && record.rowType === 'data') {
          return value
        }
        if (record.rowType === 'total') {
          return null
        }
        return ''
      },
    },
    {
      title: '签约目标数量',
      dataIndex: 'targetCount',
      key: 'targetCount',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '实际签约数量',
      dataIndex: 'actualCount',
      key: 'actualCount',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
  ]

  return (
    <div>
      {/* 统计卡片 */}
      {data.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="总目标数量"
                value={stats.totalTargetCount}
                prefix={<RiseOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总实际数量"
                value={stats.totalActualCount}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="达成率"
                value={stats.achievementRate}
                suffix="%"
                valueStyle={{
                  color: stats.achievementRate >= 100 ? '#52c41a' : '#faad14',
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="月均签约数量"
                value={stats.averageMonthlyCount}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={`${campus || '请选择神殿'}神殿教化司企业签约目标与结果汇总表`}
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
          scroll={{ x: 800 }}
          rowKey="key"
          size="small"
          rowClassName={(record) => {
            if (record.rowType === 'total') {
              return 'table-row-total'
            }
            return ''
          }}
        />
      </Card>

      <style>{`
        .table-row-total {
          background-color: #f0f0f0;
          font-weight: bold;
        }
      `}</style>
    </div>
  )
}

export default ContractSigningSummaryTable
