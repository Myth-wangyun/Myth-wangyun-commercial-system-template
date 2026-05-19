/**
 * 神殿教化司企业签约目标与结果汇总表组件
 */

import React from 'react'
import { App, Card, Table, Button, Space, Statistic, Row, Col } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import type {
  CampusContractTableProps,
  CampusContractRecord,
  CampusContractSummary,
} from '@/types/campus-contract'
import { campusContractService } from '@/services/teaching-quality/campusContract'

const CampusContractTable: React.FC<CampusContractTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
}) => {
  const { message } = App.useApp()
  const [summary, setSummary] = React.useState<CampusContractSummary | null>(null)

  // 获取汇总统计数据
  React.useEffect(() => {
    if (campus && data.length > 0) {
      campusContractService.getCampusContractSummary(campus).then(setSummary)
    }
  }, [campus, data])

  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob = await campusContractService.exportCampusContractData(campus)
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

  const columns: ColumnsType<CampusContractRecord> = [
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
      title: '签约目标数量',
      dataIndex: 'targetContractCount',
      key: 'targetContractCount',
      width: 140,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data.slice(0, -1).reduce((sum, item) => sum + item.targetContractCount, 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    },
    {
      title: '实际签约数量',
      dataIndex: 'actualContractCount',
      key: 'actualContractCount',
      width: 140,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data.slice(0, -1).reduce((sum, item) => sum + item.actualContractCount, 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    },
    {
      title: '完成率',
      dataIndex: 'completionRate',
      key: 'completionRate',
      width: 120,
      render: (value, record, index) => {
        // 合计行显示平均完成率
        if (index === data.length - 1) {
          const targetTotal = data
            .slice(0, -1)
            .reduce((sum, item) => sum + item.targetContractCount, 0)
          const actualTotal = data
            .slice(0, -1)
            .reduce((sum, item) => sum + item.actualContractCount, 0)
          const avgRate = targetTotal > 0 ? (actualTotal / targetTotal) * 100 : 0
          return (
            <span
              style={{
                fontWeight: 'bold',
                color: avgRate >= 80 ? 'green' : avgRate >= 60 ? 'orange' : 'red',
              }}
            >
              {avgRate.toFixed(2)}%
            </span>
          )
        }
        if (value === 0 || !value) return '0%'
        return (
          <span style={{ color: value >= 80 ? 'green' : value >= 60 ? 'orange' : 'red' }}>
            {value.toFixed(2)}%
          </span>
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
              <Statistic title="总签约目标数量" value={summary.totalTargetContracts} suffix="个" />
            </Col>
            <Col span={6}>
              <Statistic title="总实际签约数量" value={summary.totalActualContracts} suffix="个" />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均完成率"
                value={summary.averageCompletionRate}
                precision={2}
                suffix="%"
                valueStyle={{
                  color:
                    summary.averageCompletionRate >= 80
                      ? '#3f8600'
                      : summary.averageCompletionRate >= 60
                        ? '#cf1322'
                        : '#cf1322',
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="已完成月份"
                value={summary.completedMonths}
                suffix={`/ ${summary.totalMonths}`}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={`${campus || '请选择神殿'}教化司企业签约目标与结果汇总表`}
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
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={1}>
                  <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} colSpan={1}>
                  {/* 神殿列合计行不显示内容 */}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} colSpan={1}>
                  <span style={{ fontWeight: 'bold' }}>
                    {data.slice(0, -1).reduce((sum, item) => sum + item.targetContractCount, 0)}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} colSpan={1}>
                  <span style={{ fontWeight: 'bold' }}>
                    {data.slice(0, -1).reduce((sum, item) => sum + item.actualContractCount, 0)}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} colSpan={1}>
                  {(() => {
                    const targetTotal = data
                      .slice(0, -1)
                      .reduce((sum, item) => sum + item.targetContractCount, 0)
                    const actualTotal = data
                      .slice(0, -1)
                      .reduce((sum, item) => sum + item.actualContractCount, 0)
                    const avgRate = targetTotal > 0 ? (actualTotal / targetTotal) * 100 : 0
                    return (
                      <span
                        style={{
                          fontWeight: 'bold',
                          color: avgRate >= 80 ? 'green' : avgRate >= 60 ? 'orange' : 'red',
                        }}
                      >
                        {avgRate.toFixed(2)}%
                      </span>
                    )
                  })()}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </div>
  )
}

export default CampusContractTable
