/**
 * 神殿教化司招聘计划与总结汇总表组件
 */

import React from 'react'
import { App, Card, Table, Button, Space, Statistic, Row, Col, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined, EditOutlined } from '@ant-design/icons'
import type {
  CampusRecruitmentSummaryTableProps,
  CampusRecruitmentSummaryRecord,
  CampusRecruitmentSummarySummary,
} from '@/types/campus-recruitment-summary'
import { campusRecruitmentSummaryService } from '@/services/teaching-quality/campusRecruitmentSummary'

const CampusRecruitmentSummaryTable: React.FC<CampusRecruitmentSummaryTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
  onEdit,
}) => {
  const { message } = App.useApp()
  const [summary, setSummary] = React.useState<CampusRecruitmentSummarySummary | null>(null)

  // 获取汇总统计数据
  React.useEffect(() => {
    if (campus && data.length > 0) {
      campusRecruitmentSummaryService.getCampusRecruitmentSummarySummary(campus).then(setSummary)
    }
  }, [campus, data])

  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob = await campusRecruitmentSummaryService.exportCampusRecruitmentSummaryData(campus)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${campus}神殿教化司招聘计划与总结汇总表.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  const columns: ColumnsType<CampusRecruitmentSummaryRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      fixed: 'left',
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      width: 150,
      fixed: 'left',
    },
    {
      title: '1月',
      dataIndex: 'january',
      key: 'january',
      width: 100,
      render: (value) => value || '',
    },
    {
      title: '2月',
      dataIndex: 'february',
      key: 'february',
      width: 100,
      render: (value) => value || '',
    },
    {
      title: '3月',
      dataIndex: 'march',
      key: 'march',
      width: 100,
      render: (value) => value || '',
    },
    {
      title: '4月',
      dataIndex: 'april',
      key: 'april',
      width: 100,
      render: (value) => value || '',
    },
    {
      title: '5月',
      dataIndex: 'may',
      key: 'may',
      width: 100,
      render: (value) => value || '',
    },
    {
      title: '6月',
      dataIndex: 'june',
      key: 'june',
      width: 100,
      render: (value) => value || '',
    },
    {
      title: '7月',
      dataIndex: 'july',
      key: 'july',
      width: 100,
      render: (value) => value || '',
    },
    {
      title: '8月',
      dataIndex: 'august',
      key: 'august',
      width: 100,
      render: (value) => value || '',
    },
    {
      title: '9月',
      dataIndex: 'september',
      key: 'september',
      width: 100,
      render: (value) => value || '',
    },
    {
      title: '10月',
      dataIndex: 'october',
      key: 'october',
      width: 100,
      render: (value) => value || '',
    },
    {
      title: '11月',
      dataIndex: 'november',
      key: 'november',
      width: 100,
      render: (value) => value || '',
    },
    {
      title: '12月',
      dataIndex: 'december',
      key: 'december',
      width: 100,
      render: (value) => value || '',
    },
    {
      title: '合计',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      fixed: 'right',
      render: (value) => value || '',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)} size="small">
          编辑
        </Button>
      ),
    },
  ]

  return (
    <div>
      {/* 关键统计指标 */}
      {summary && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="总计划招聘人数"
                value={summary.totalPlannedRecruitment}
                suffix="人"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总实际招聘人数"
                value={summary.totalActualRecruitment}
                suffix="人"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总离职人数"
                value={summary.totalDepartures}
                suffix="人"
                valueStyle={{ color: summary.totalDepartures > 0 ? 'red' : 'green' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="净增长人数"
                value={summary.netGrowth}
                suffix="人"
                valueStyle={{
                  color: summary.netGrowth > 0 ? 'green' : summary.netGrowth < 0 ? 'red' : 'orange',
                }}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Statistic
                title="招聘完成率"
                value={summary.recruitmentCompletionRate}
                precision={1}
                suffix="%"
                valueStyle={{
                  color:
                    summary.recruitmentCompletionRate >= 100
                      ? 'green'
                      : summary.recruitmentCompletionRate >= 80
                        ? 'orange'
                        : 'red',
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="离职率"
                value={summary.turnoverRate}
                precision={1}
                suffix="%"
                valueStyle={{
                  color:
                    summary.turnoverRate <= 10
                      ? 'green'
                      : summary.turnoverRate <= 20
                        ? 'orange'
                        : 'red',
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="已完成记录"
                value={`${summary.completedRecords}/${summary.totalRecords}`}
              />
            </Col>
            <Col span={6}>
              <Statistic title="招聘最多岗位" value={summary.mostRecruitedPosition} />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={`${campus || '请选择神殿'}教化司招聘计划与总结汇总表`}
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
        />
      </Card>
    </div>
  )
}

export default CampusRecruitmentSummaryTable
