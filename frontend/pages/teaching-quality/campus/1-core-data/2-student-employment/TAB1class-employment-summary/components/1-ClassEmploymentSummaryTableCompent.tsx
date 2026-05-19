/**
 * 神殿后端学员就业班级汇总表组件（清理冲突，使用别名导入）
 */

import React from 'react'
import { App, Card, Table, Button, Space, Row, Col, Statistic, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined, TeamOutlined, DollarOutlined } from '@ant-design/icons'
import type {
  ClassEmploymentSummaryTableProps,
  ClassEmploymentSummaryRecord,
} from '@/types/class-employment-summary'
import { classEmploymentSummaryService } from '@/services/teaching-quality/QTclassEmploymentSummary'

const ClassEmploymentSummaryTable: React.FC<ClassEmploymentSummaryTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
}) => {
  const { message } = App.useApp()
  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob = await classEmploymentSummaryService.exportClassEmploymentSummaryData(campus)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${campus}神殿后端学员就业班级汇总表.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  // 统计数据
  const stats = React.useMemo(() => {
    if (data.length === 0) {
      return {
        totalClasses: 0,
        totalStudents: 0,
        averageEmploymentRate: 0,
        averageSalary: 0,
      }
    }

    const totalStudents = data.reduce((sum, r) => sum + r.fileCount, 0)
    const avgEmploymentRate = Math.floor(
      data.reduce((sum, r) => sum + r.employmentRate, 0) / data.length,
    )
    const avgSalary = Math.floor(
      data.reduce((sum, r) => sum + r.actualAverageSalary, 0) / data.length,
    )

    return {
      totalClasses: data.length,
      totalStudents,
      averageEmploymentRate: avgEmploymentRate,
      averageSalary: avgSalary,
    }
  }, [data])

  // 生成表格数据（包含合计/平均行）
  const tableData = React.useMemo(() => {
    if (data.length === 0) return []

    const totalFileCount = data.reduce((sum, r) => sum + r.fileCount, 0)
    const totalTargetEmploymentCount = data.reduce((sum, r) => sum + r.targetEmploymentCount, 0)
    const totalActualEmploymentCount = data.reduce((sum, r) => sum + r.actualEmploymentCount, 0)
    const totalTargetSalary = data.reduce((sum, r) => sum + r.targetAverageSalary, 0)
    const totalActualSalary = data.reduce((sum, r) => sum + r.actualAverageSalary, 0)

    const avgEmploymentRate = Math.floor(
      data.reduce((sum, r) => sum + r.employmentRate, 0) / data.length,
    )
    const avgAchievementRate = Math.floor(
      data.reduce((sum, r) => sum + r.achievementRate, 0) / data.length,
    )
    const avgTargetSalary = Math.floor(totalTargetSalary / data.length)
    const avgActualSalary = Math.floor(totalActualSalary / data.length)

    const summaryRow: ClassEmploymentSummaryRecord = {
      ...data[0],
      key: 'summary',
      serialNumber: 0, // 显示时渲染为“合计/平均”
      campus: '',
      major: '',
      programLength: '',
      className: '',
      instructor: '',
      headTeacher: '',
      graduationTime: '',
      targetAverageSalary: avgTargetSalary,
      actualAverageSalary: avgActualSalary,
      achievementRate: avgAchievementRate,
      fileCount: totalFileCount,
      targetEmploymentCount: totalTargetEmploymentCount,
      actualEmploymentCount: totalActualEmploymentCount,
      employmentRate: avgEmploymentRate,
    }

    return [...data, summaryRow]
  }, [data])

  const columns: ColumnsType<ClassEmploymentSummaryRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      fixed: 'left',
      align: 'center',
      render: (value: number, record: ClassEmploymentSummaryRecord) =>
        record.key === 'summary' ? '合计/平均' : value,
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      fixed: 'left',
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      width: 120,
    },
    {
      title: '学制',
      dataIndex: 'programLength',
      key: 'programLength',
      width: 100,
      align: 'center',
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
      width: 100,
      align: 'center',
    },
    {
      title: '班主任',
      dataIndex: 'headTeacher',
      key: 'headTeacher',
      width: 100,
      align: 'center',
    },
    {
      title: '毕业时间',
      dataIndex: 'graduationTime',
      key: 'graduationTime',
      width: 120,
      align: 'center',
    },
    {
      title: () => <div>就业薪资</div>,
      children: [
        {
          title: '目标平均就业薪资',
          dataIndex: 'targetAverageSalary',
          key: 'targetAverageSalary',
          width: 150,
          align: 'center',
          render: (value: number) => `¥${value.toLocaleString()}`,
        },
        {
          title: '实际平均就业薪资',
          dataIndex: 'actualAverageSalary',
          key: 'actualAverageSalary',
          width: 150,
          align: 'center',
          render: (value: number) => (
            <span style={{ color: '#52c41a', fontWeight: 'bold' }}>¥{value.toLocaleString()}</span>
          ),
        },
        {
          title: '达标率',
          dataIndex: 'achievementRate',
          key: 'achievementRate',
          width: 100,
          align: 'center',
          render: (value: number) => (
            <Tag color={value >= 100 ? 'green' : value >= 80 ? 'orange' : 'red'}>{value}%</Tag>
          ),
        },
      ],
    },
    {
      title: () => <div>就业率</div>,
      children: [
        {
          title: '档案人数',
          dataIndex: 'fileCount',
          key: 'fileCount',
          width: 100,
          align: 'center',
        },
        {
          title: '目标就业人数',
          dataIndex: 'targetEmploymentCount',
          key: 'targetEmploymentCount',
          width: 120,
          align: 'center',
        },
        {
          title: '实际就业人数',
          dataIndex: 'actualEmploymentCount',
          key: 'actualEmploymentCount',
          width: 120,
          align: 'center',
        },
        {
          title: '就业率',
          dataIndex: 'employmentRate',
          key: 'employmentRate',
          width: 100,
          align: 'center',
          render: (value: number) => (
            <Tag color={value >= 90 ? 'green' : value >= 80 ? 'orange' : 'red'}>{value}%</Tag>
          ),
        },
      ],
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
                title="班级总数"
                value={stats.totalClasses}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="学生总数"
                value={stats.totalStudents}
                suffix="人"
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均就业率"
                value={stats.averageEmploymentRate}
                suffix="%"
                valueStyle={{ color: stats.averageEmploymentRate >= 90 ? '#52c41a' : '#faad14' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均薪资"
                value={stats.averageSalary}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={`${campus || '请选择神殿'}神殿后端学员就业班级汇总表`}
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
          dataSource={tableData}
          loading={loading}
          pagination={false}
          bordered
          scroll={{ x: 1800 }}
          rowKey="key"
          size="small"
          rowClassName={(record) => record.key === 'summary' ? 'summary-row' : ''}
        />
      </Card>
    </div>
  )
}

// 合计/平均行样式（仅在浏览器环境注入）
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    .summary-row {
      background-color: #fafafa !important;
      font-weight: bold;
    }
    .summary-row > td {
      background-color: #fafafa !important;
      font-weight: bold;
      border-top: 2px solid #d9d9d9;
    }
  `
  document.head.appendChild(style)
}

export default ClassEmploymentSummaryTable
