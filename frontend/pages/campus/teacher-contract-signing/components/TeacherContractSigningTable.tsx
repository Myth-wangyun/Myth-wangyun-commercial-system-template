/**
 * 神殿教化司班主任企业签约目标与结果汇总表组件
 */

import React from 'react'
import { App, Card, Table, Button, Space, Row, Col, Statistic, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined, CalendarOutlined } from '@ant-design/icons'
import type {
  TeacherContractSigningTableProps,
  TeacherContractSigningRecord,
} from '@/types/teacher-contract-signing'
import { teacherContractSigningService } from '@/services/teacherContractSigning'

const TeacherContractSigningTable: React.FC<TeacherContractSigningTableProps> = ({
  campus,
  month,
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
      const blob = await teacherContractSigningService.exportTeacherContractSigningData(
        campus,
        month,
      )
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${campus}神殿教化司班主任企业签约目标与结果汇总表.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  // 计算合并单元格（月份列）
  const getMonthRowSpan = (record: TeacherContractSigningRecord) => {
    if (record.rowType === 'subtotal') {
      return 0
    }

    // 检查是否是该月份的第一行
    const currentIndex = data.indexOf(record)
    if (currentIndex > 0) {
      const prevRecord = data[currentIndex - 1]
      if (prevRecord.month === record.month && prevRecord.rowType !== 'subtotal') {
        // 不是第一行，返回0不显示
        return 0
      }
    }

    // 计算这个月份的所有行（包括合计行）
    const monthRows = data.filter((r) => r.month === record.month)

    return monthRows.length
  }

  // 计算统计数据
  const stats = React.useMemo(() => {
    if (data.length === 0) {
      return {
        totalTargetCount: 0,
        totalActualCount: 0,
        achievementRate: 0,
        totalEnterprises: 0,
      }
    }

    const dataRows = data.filter((r) => r.rowType === 'data')
    const totalTargetCount = dataRows.reduce((sum, r) => sum + r.targetCount, 0)
    const totalActualCount = dataRows.reduce((sum, r) => sum + r.actualCount, 0)
    const achievementRate =
      totalTargetCount > 0 ? Math.floor((totalActualCount / totalTargetCount) * 100) : 0

    const enterpriseSet = new Set(dataRows.map((r) => r.enterpriseName).filter(Boolean))

    return {
      totalTargetCount,
      totalActualCount,
      achievementRate,
      totalEnterprises: enterpriseSet.size,
    }
  }, [data])

  const columns: ColumnsType<TeacherContractSigningRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      render: (value, record) => {
        const rowSpan = getMonthRowSpan(record)
        if (rowSpan === 0) {
          return null
        }
        return {
          children: value,
          props: { rowSpan },
        }
      },
    },
    {
      title: '学校经办人',
      dataIndex: 'handlerName',
      key: 'handlerName',
      width: 120,
      render: (value, record) => {
        if (record.rowType === 'subtotal') {
          return <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{value}</span>
        }
        return value
      },
    },
    {
      title: '签约目标数量',
      dataIndex: 'targetCount',
      key: 'targetCount',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'subtotal') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || '-'
      },
    },
    {
      title: '实际签约数量',
      dataIndex: 'actualCount',
      key: 'actualCount',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'subtotal') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || '-'
      },
    },
    {
      title: '签约企业名称',
      dataIndex: 'enterpriseName',
      key: 'enterpriseName',
      width: 150,
      render: (value) => value || '-',
    },
    {
      title: '签约专业方向',
      dataIndex: 'majorDirection',
      key: 'majorDirection',
      width: 120,
      render: (value) => value || '-',
    },
    {
      title: '合作周期',
      dataIndex: 'cooperationPeriod',
      key: 'cooperationPeriod',
      width: 100,
      align: 'center',
      render: (value) => value || '-',
    },
    {
      title: '企业联系人姓名',
      dataIndex: 'contactName',
      key: 'contactName',
      width: 120,
      render: (value) => value || '-',
    },
    {
      title: '企业联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 130,
      render: (value) => value || '-',
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
                prefix={<CalendarOutlined />}
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
                title="签约企业总数"
                value={stats.totalEnterprises}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={`${campus || '请选择神殿'}神殿教化司班主任企业签约目标与结果汇总表${month ? ` - ${month}月` : ''}`}
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
          scroll={{ x: 1200 }}
          rowKey="key"
          size="small"
          rowClassName={(record) => {
            if (record.rowType === 'subtotal') {
              return 'table-row-subtotal'
            }
            return ''
          }}
        />
      </Card>

      <style>{`
        .table-row-subtotal {
          background-color: #f0f0f0;
          font-weight: bold;
        }
      `}</style>
    </div>
  )
}

export default TeacherContractSigningTable
