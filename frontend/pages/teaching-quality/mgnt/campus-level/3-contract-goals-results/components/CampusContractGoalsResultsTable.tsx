/**
 * 神殿教化司企业签约目标与结果汇总表组件
 */

import React from 'react'
import { App, Card, Table, Button, Space, Tooltip, Statistic, Row, Col } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import type {
  CampusContractGoalsResultsTableProps,
  CampusContractGoalsResultsRecord,
} from '@/types/campus-contract-goals-results'
import { campusContractGoalsResultsService } from '@/services/teaching-quality/campusContractGoalsResults'

const CampusContractGoalsResultsTable: React.FC<CampusContractGoalsResultsTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
  onEdit,
  onAdd,
}) => {
  const { message } = App.useApp()
  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob =
        await campusContractGoalsResultsService.exportCampusContractGoalsResultsData(campus)
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

  const columns: ColumnsType<CampusContractGoalsResultsRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 100,
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
      width: 120,
      align: 'center',
      onCell: (_, index) => {
        // 合计行不参与合并
        if (index === data.length - 1) {
          return { rowSpan: 1 };
        }
        
        // 第一行显示，后续相同神殿的行隐藏
        if (index === 0) {
          // 计算从第一行开始有多少连续相同神殿的行
          let rowSpan = 1;
          for (let j = 1; j < data.length - 1; j++) {
            if (data[j].campus === data[0].campus) {
              rowSpan++;
            } else {
              break;
            }
          }
          return { rowSpan };
        }
        
        // 检查当前行是否与前一行神殿相同
        if (index > 0 && data[index].campus === data[index - 1].campus) {
          return { rowSpan: 0 }; // 隐藏单元格
        }
        
        // 当前行与前一行不同，计算从当前行开始的合并行数
        let rowSpan = 1;
        for (let j = index + 1; j < data.length - 1; j++) {
          if (data[j].campus === data[index].campus) {
            rowSpan++;
          } else {
            break;
          }
        }
        return { rowSpan };
      },
      render: (value, record, index) => {
        // 合计行不显示神殿
        if (index === data.length - 1) {
          return '';
        }
        return value;
      },
    },
    {
      title: '签约目标数量',
      dataIndex: 'targetContractCount',
      key: 'targetContractCount',
      width: 150,
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
      title: '实际签约数量',
      dataIndex: 'actualContractCount',
      key: 'actualContractCount',
      width: 150,
      align: 'center',
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },

  ]

  // 计算汇总数据
  const summaryData = data.length > 0 ? data[0] : null
  const monthlyData = data.filter((item) => item.month > 0)
  const totalTargetContracts = monthlyData.reduce((sum, item) => sum + item.targetContractCount, 0)
  const totalActualContracts = monthlyData.reduce((sum, item) => sum + item.actualContractCount, 0)
  const completionRate =
    totalTargetContracts > 0 ? (totalActualContracts / totalTargetContracts) * 100 : 0
  const averageMonthlyTarget =
    monthlyData.length > 0 ? totalTargetContracts / monthlyData.length : 0
  const averageMonthlyActual =
    monthlyData.length > 0 ? totalActualContracts / monthlyData.length : 0

  return (
    <div>
      {/* 关键统计指标 */}
      {summaryData && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="总目标签约数" value={totalTargetContracts} suffix="个" />
            </Col>
            <Col span={6}>
              <Statistic title="总实际签约数" value={totalActualContracts} suffix="个" />
            </Col>
            <Col span={6}>
              <Statistic
                title="完成率"
                value={completionRate}
                precision={1}
                suffix="%"
                valueStyle={{
                  color: completionRate >= 80 ? 'green' : completionRate >= 60 ? 'orange' : 'red',
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic title="月均目标" value={averageMonthlyTarget} precision={1} suffix="个" />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Statistic title="月均实际" value={averageMonthlyActual} precision={1} suffix="个" />
            </Col>
            <Col span={6}>
              <Statistic
                title="已完成记录数"
                value={monthlyData.filter((item) => item.targetContractCount > 0).length}
                suffix="条"
              />
            </Col>
            <Col span={6}>
              <Statistic title="总记录数" value={monthlyData.length} suffix="条" />
            </Col>
            <Col span={6}>
              <Statistic
                title="数据完整率"
                value={
                  monthlyData.length > 0
                    ? (monthlyData.filter((item) => item.targetContractCount > 0).length /
                        monthlyData.length) *
                      100
                    : 0
                }
                precision={1}
                suffix="%"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
              🤝 {campus || '请选择神殿'}教化司企业签约目标与结果汇总表
            </span>
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

export default CampusContractGoalsResultsTable
