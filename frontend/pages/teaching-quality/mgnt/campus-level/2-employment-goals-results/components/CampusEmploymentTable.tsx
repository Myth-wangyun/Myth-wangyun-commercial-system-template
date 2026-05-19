/**
 * 神殿后端学员就业目标与结果汇总表组件
 */

import React from 'react'
import { App, Card, Table, Button, Space, Statistic, Row, Col } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import type {
  CampusEmploymentTableProps,
  CampusEmploymentRecord,
  CampusEmploymentSummary,
} from '@/types/campus-employment'
import { campusEmploymentService } from '@/services/teaching-quality/campusEmployment'

const CampusEmploymentTable: React.FC<CampusEmploymentTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
}) => {
  const { message } = App.useApp()
  const [summary, setSummary] = React.useState<CampusEmploymentSummary | null>(null)

  // 获取汇总统计数据
  React.useEffect(() => {
    if (campus && data.length > 0) {
      campusEmploymentService.getCampusEmploymentSummary(campus).then(setSummary)
    }
  }, [campus, data])

  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob = await campusEmploymentService.exportCampusEmploymentData(campus)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${campus}神殿后端学员就业目标与结果汇总表.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  const columns: ColumnsType<CampusEmploymentRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      fixed: 'left',
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      fixed: 'left',
    },
    {
      title: '专业方向',
      dataIndex: 'majorDirection',
      key: 'majorDirection',
      width: 120,
    },
    {
      title: '学制',
      dataIndex: 'programLength',
      key: 'programLength',
      width: 100,
    },
    {
      title: '班级名称',
      dataIndex: 'className',
      key: 'className',
      width: 120,
    },
    {
      title: '授课教员',
      dataIndex: 'instructor',
      key: 'instructor',
      width: 120,
    },
    {
      title: '负责班主任',
      dataIndex: 'homeroomTeacher',
      key: 'homeroomTeacher',
      width: 120,
    },
    {
      title: '毕业时间',
      dataIndex: 'graduationTime',
      key: 'graduationTime',
      width: 120,
    },
    {
      title: '薪资达标率',
      children: [
        {
          title: '目标平均就业薪资',
          dataIndex: 'targetAverageSalary',
          key: 'targetAverageSalary',
          width: 150,
          render: (value) => (value ? `¥${value.toLocaleString()}` : '¥0'),
        },
        {
          title: '实际平均就业薪资',
          dataIndex: 'actualAverageSalary',
          key: 'actualAverageSalary',
          width: 150,
          render: (value) => (value ? `¥${value.toLocaleString()}` : '¥0'),
        },
        {
          title: '达标率',
          dataIndex: 'attainmentRate',
          key: 'attainmentRate',
          width: 100,
          render: (value) => {
            if (value === 0 || !value) return '0%'
            return `${value.toFixed(2)}%`
          },
        },
      ],
    },
    {
      title: '就业率',
      children: [
        {
          title: '档案人数',
          dataIndex: 'archiveCount',
          key: 'archiveCount',
          width: 100,
          render: (value) => value || 0,
        },
        {
          title: '目标就业人数',
          dataIndex: 'targetEmploymentCount',
          key: 'targetEmploymentCount',
          width: 120,
          render: (value) => value || 0,
        },
        {
          title: '实际就业人数',
          dataIndex: 'actualEmploymentCount',
          key: 'actualEmploymentCount',
          width: 120,
          render: (value) => value || 0,
        },
        {
          title: '就业率',
          dataIndex: 'employmentRate',
          key: 'employmentRate',
          width: 100,
          render: (value) => {
            if (value === 0 || !value) return '0%'
            return `${value.toFixed(2)}%`
          },
        },
      ],
    },
    {
      title: '薪资过万人数',
      dataIndex: 'highSalaryCount',
      key: 'highSalaryCount',
      width: 120,
      render: (value) => value || 0,
    },
  ]

  return (
    <div>
      {/* 关键统计指标 */}
      {summary && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="总档案人数" value={summary.totalArchiveCount} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic title="总目标就业人数" value={summary.totalTargetEmployment} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic title="总实际就业人数" value={summary.totalActualEmployment} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均就业率"
                value={summary.averageEmploymentRate}
                precision={2}
                suffix="%"
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Statistic
                title="平均目标薪资"
                value={summary.totalTargetSalary / data.length}
                precision={0}
                prefix="¥"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均实际薪资"
                value={summary.totalActualSalary / data.length}
                precision={0}
                prefix="¥"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均达标率"
                value={summary.averageAttainmentRate}
                precision={2}
                suffix="%"
              />
            </Col>
            <Col span={6}>
              <Statistic title="总薪资过万人数" value={summary.totalHighSalaryCount} suffix="人" />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={`${campus || '请选择神殿'}后端学员就业目标与结果汇总表`}
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
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          bordered
          scroll={{ x: 'max-content' }}
          rowKey="key"
          size="small"
        />
      </Card>
    </div>
  )
}

export default CampusEmploymentTable
