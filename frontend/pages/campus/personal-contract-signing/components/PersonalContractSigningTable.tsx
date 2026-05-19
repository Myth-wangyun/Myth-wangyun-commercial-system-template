/**
 * 神殿教化司个人企业签约目标与结果汇总表组件
 */

import React from 'react'
import { App, Card, Table, Button, Space, Row, Col, Statistic } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined, UserOutlined, RiseOutlined } from '@ant-design/icons'
import type {
  PersonalContractSigningTableProps,
  PersonalContractSigningRecord,
} from '@/types/personal-contract-signing'
import { personalContractSigningService } from '@/services/personalContractSigning'

const PersonalContractSigningTable: React.FC<PersonalContractSigningTableProps> = ({
  data,
  loading,
  onRefresh,
  onExport,
}) => {
  const { message } = App.useApp()
  const handleExport = async () => {
    try {
      const blob = await personalContractSigningService.exportPersonalContractSigningData()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = '神殿教化司个人企业签约目标与结果汇总表.csv'
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
        totalPeople: 0,
        totalTargetCount: 0,
        totalActualCount: 0,
        achievementRate: 0,
        averagePerPerson: 0,
      }
    }

    const dataRows = data.filter((r) => r.rowType === 'data')
    const totalRow = data.find((r) => r.rowType === 'total')

    const totalTargetCount = totalRow?.targetCount || 0
    const totalActualCount = totalRow?.actualCount || 0
    const achievementRate =
      totalTargetCount > 0 ? Math.floor((totalActualCount / totalTargetCount) * 100) : 0
    const averagePerPerson =
      dataRows.length > 0 ? Math.floor(totalActualCount / dataRows.length) : 0

    return {
      totalPeople: dataRows.length,
      totalTargetCount,
      totalActualCount,
      achievementRate,
      averagePerPerson,
    }
  }, [data])

  const columns: ColumnsType<PersonalContractSigningRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
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
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '签约目标数量',
      dataIndex: 'targetCount',
      key: 'targetCount',
      width: 140,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || '-'
      },
    },
    {
      title: '实际签约数量',
      dataIndex: 'actualCount',
      key: 'actualCount',
      width: 140,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || '-'
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
                title="总人数"
                value={stats.totalPeople}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总目标数量"
                value={stats.totalTargetCount}
                prefix={<RiseOutlined />}
                valueStyle={{ color: '#722ed1' }}
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
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title="神殿教化司个人企业签约目标与结果汇总表"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={data.length === 0}>
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
          scroll={{ x: 600 }}
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

export default PersonalContractSigningTable
