/**
 * 神殿后端学员就业目标与结果汇总表组件
 */

import React from 'react'
import { App, Card, Table, Button, Space, Tooltip, Statistic, Row, Col } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined, EditOutlined } from '@ant-design/icons'
import type {
  CampusEmploymentGoalsResultsTableProps,
  CampusEmploymentGoalsResultsRecord,
} from '@/types/campus-employment-goals-results'
import { academicCampusEmploymentGoalsResultsService } from '@/services/academic/campusEmploymentGoalsResults'

const CampusEmploymentGoalsResultsTable: React.FC<CampusEmploymentGoalsResultsTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
  onEdit,
}) => {
  const { message } = App.useApp()
  // 防御性处理，避免 data 未定义导致读取 length 报错
  const rows: CampusEmploymentGoalsResultsRecord[] = Array.isArray(data) ? data : []
  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob =
        await academicCampusEmploymentGoalsResultsService.exportCampusEmploymentGoalsResultsData(campus)
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

  const columns: ColumnsType<CampusEmploymentGoalsResultsRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      fixed: 'left',
      align: 'center',
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 120,
      fixed: 'left',
      align: 'center',
      render: (value, record, index) => (index === 0 ? value : ''),
    },
    {
      title: '专业方向',
      dataIndex: 'majorDirection',
      key: 'majorDirection',
      width: 120,
      align: 'center',
    },
    {
      title: '学制',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      align: 'center',
    },
    {
      title: '班级名称',
      dataIndex: 'className',
      key: 'className',
      width: 120,
      align: 'center',
      render: (value) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{value || ''}</span>
      ),
    },
    {
      title: '授课教员',
      dataIndex: 'instructor',
      key: 'instructor',
      width: 120,
      align: 'center',
    },
    {
      title: '负责班主任',
      dataIndex: 'headTeacher',
      key: 'headTeacher',
      width: 120,
      align: 'center',
    },
    {
      title: '毕业时间',
      dataIndex: 'graduationDate',
      key: 'graduationDate',
      width: 120,
      align: 'center',
    },
    {
      title: '就业薪资',
      children: [
        {
          title: '目标平均就业薪资',
          dataIndex: ['salaryAttainment', 'targetAverageSalary'],
          key: 'salaryAttainment.targetAverageSalary',
          width: 150,
          align: 'center',
          render: (value) => (value ? `¥${value.toFixed(1)}` : ''),
        },
        {
          title: '实际平均就业薪资',
          dataIndex: ['salaryAttainment', 'actualAverageSalary'],
          key: 'salaryAttainment.actualAverageSalary',
          width: 150,
          align: 'center',
          render: (value) => (value ? `¥${value.toFixed(1)}` : ''),
        },
        {
          title: '达标率',
          dataIndex: ['salaryAttainment', 'attainmentRate'],
          key: 'salaryAttainment.attainmentRate',
          width: 100,
          align: 'center',
          render: (value) => {
            const rate = value || 0
            return (
              <span
                style={{
                  fontWeight: 'bold',
                  color: rate >= 90 ? '#52c41a' : rate >= 80 ? '#faad14' : '#ff4d4f',
                }}
              >
                {rate.toFixed(1)}%
              </span>
            )
          },
        },
      ],
    },
    {
      title: '就业率',
      children: [
        {
          title: '档案人数',
          dataIndex: ['employmentRate', 'fileCount'],
          key: 'employmentRate.fileCount',
          width: 100,
          align: 'center',
          render: (value) => value || 0,
        },
        {
          title: '目标就业人数',
          dataIndex: ['employmentRate', 'targetEmploymentCount'],
          key: 'employmentRate.targetEmploymentCount',
          width: 120,
          align: 'center',
          render: (value) => value || 0,
        },
        {
          title: '实际就业人数',
          dataIndex: ['employmentRate', 'actualEmploymentCount'],
          key: 'employmentRate.actualEmploymentCount',
          width: 120,
          align: 'center',
          render: (value) => value || 0,
        },
        {
          title: '就业率',
          dataIndex: ['employmentRate', 'employmentRate'],
          key: 'employmentRate.employmentRate',
          width: 100,
          align: 'center',
          render: (value) => {
            const rate = value || 0
            return (
              <span
                style={{
                  fontWeight: 'bold',
                  color: rate >= 80 ? '#52c41a' : rate >= 60 ? '#faad14' : '#ff4d4f',
                }}
              >
                {rate.toFixed(1)}%
              </span>
            )
          },
        },
      ],
    },
    {
      title: '薪资过万人数',
      dataIndex: 'salaryOverTenThousand',
      key: 'salaryOverTenThousand',
      width: 130,
      align: 'center',
      render: (value) => value || 0,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  // 计算汇总数据
  const stats = React.useMemo(() => {
    const totals = rows.reduce(
      (acc, item) => {
        const targetSalary = item.salaryAttainment.targetAverageSalary || 0
        const actualSalary = item.salaryAttainment.actualAverageSalary || 0
        const attainment = item.salaryAttainment.attainmentRate || 0
        const employmentRateValue = item.employmentRate.employmentRate || 0

        acc.totalClasses += item.className ? 1 : 0
        acc.totalStudents += item.employmentRate.fileCount || 0
        acc.totalTargetEmployment += item.employmentRate.targetEmploymentCount || 0
        acc.totalActualEmployment += item.employmentRate.actualEmploymentCount || 0
        acc.totalHighSalary += item.salaryOverTenThousand || 0

        if (targetSalary > 0) {
          acc.targetSalarySum += targetSalary
          acc.targetSalaryCount += 1
        }
        if (actualSalary > 0) {
          acc.actualSalarySum += actualSalary
          acc.actualSalaryCount += 1
        }
        if (attainment > 0) {
          acc.attainmentSum += attainment
          acc.attainmentCount += 1
        }
        if (employmentRateValue > 0) {
          acc.employmentRateSum += employmentRateValue
          acc.employmentRateCount += 1
        }
        return acc
      },
      {
        totalClasses: 0,
        totalStudents: 0,
        totalTargetEmployment: 0,
        totalActualEmployment: 0,
        totalHighSalary: 0,
        targetSalarySum: 0,
        targetSalaryCount: 0,
        actualSalarySum: 0,
        actualSalaryCount: 0,
        attainmentSum: 0,
        attainmentCount: 0,
        employmentRateSum: 0,
        employmentRateCount: 0,
      },
    )

    const avgTargetSalary = totals.targetSalaryCount
      ? totals.targetSalarySum / totals.targetSalaryCount
      : null
    const avgActualSalary = totals.actualSalaryCount
      ? totals.actualSalarySum / totals.actualSalaryCount
      : null

    return {
      totalClasses: totals.totalClasses,
      totalStudents: totals.totalStudents,
      totalTargetEmployment: totals.totalTargetEmployment,
      totalActualEmployment: totals.totalActualEmployment,
      totalHighSalary: totals.totalHighSalary,
      averageTargetSalary: avgTargetSalary,
      averageActualSalary: avgActualSalary,
      // 达标率 = 实际平均就业薪资 / 目标平均就业薪资
      averageAttainmentRate: avgTargetSalary && avgActualSalary
        ? (avgActualSalary / avgTargetSalary) * 100
        : null,
      // 就业率 = 合计实际就业人数 / 合计目标就业人数
      averageEmploymentRate: totals.totalTargetEmployment
        ? (totals.totalActualEmployment / totals.totalTargetEmployment) * 100
        : null,
    }
  }, [rows])

  const renderCurrencySummary = (value: number | null) =>
    value === null ? (
      <span style={{ color: '#cf1322' }}>#DIV/0!</span>
    ) : (
      `¥${value.toFixed(1)}`
    )

  const renderRateSummary = (value: number | null) =>
    value === null ? <span style={{ color: '#cf1322' }}>#DIV/0!</span> : `${value.toFixed(1)}%`

  const hasData = rows.length > 0

  return (
    <div>
      {/* 关键统计指标 */}
      {hasData && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="总班级数" value={stats.totalClasses} suffix="个" />
            </Col>
            <Col span={6}>
              <Statistic title="总学生数" value={stats.totalStudents} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic title="总就业人数" value={stats.totalActualEmployment} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均就业率"
                value={stats.averageEmploymentRate || 0}
                precision={1}
                suffix="%"
                valueStyle={{
                  color:
                    (stats.averageEmploymentRate || 0) >= 80
                      ? 'green'
                      : (stats.averageEmploymentRate || 0) >= 60
                        ? 'orange'
                        : 'red',
                }}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Statistic
                title="平均目标薪资"
                value={stats.averageTargetSalary || 0}
                precision={1}
                prefix="¥"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均实际薪资"
                value={stats.averageActualSalary || 0}
                precision={1}
                prefix="¥"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均达标率"
                value={stats.averageAttainmentRate || 0}
                precision={1}
                suffix="%"
              />
            </Col>
            <Col span={6}>
              <Statistic title="总薪资过万人数" value={stats.totalHighSalary} suffix="人" />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
              💼 {campus || '请选择神殿'}后端学员就业目标与结果汇总表
            </span>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
                刷新
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
                disabled={!campus || rows.length === 0}
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
          dataSource={rows}
          loading={loading}
          pagination={false}
          bordered
          scroll={{ x: 'max-content', y: 600 }}
          rowKey="key"
          size="small"
          style={{
            fontSize: '12px',
          }}
          rowClassName={(_, index) => (index % 2 === 0 ? 'table-row-light' : 'table-row-dark')}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4}>
                  <strong>合计/平均</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} colSpan={0} />
                <Table.Summary.Cell index={2} colSpan={0} />
                <Table.Summary.Cell index={3} colSpan={0} />
                <Table.Summary.Cell index={4} align="center">
                  <strong>{stats.totalClasses}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} />
                <Table.Summary.Cell index={6} />
                <Table.Summary.Cell index={7} />
                <Table.Summary.Cell index={8} align="center">
                  <strong>{renderCurrencySummary(stats.averageTargetSalary)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9} align="center">
                  <strong>{renderCurrencySummary(stats.averageActualSalary)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} align="center">
                  <strong>{renderRateSummary(stats.averageAttainmentRate)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11} align="center">
                  <strong>{stats.totalStudents}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={12} align="center">
                  <strong>{stats.totalTargetEmployment}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={13} align="center">
                  <strong>{stats.totalActualEmployment}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={14} align="center">
                  <strong>{renderRateSummary(stats.averageEmploymentRate)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={15} align="center">
                  <strong>{stats.totalHighSalary}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={16} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />

        <style>{`
          .table-row-light {
            background-color: #fafafa;
          }
          .table-row-dark {
            background-color: #ffffff;
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

export default CampusEmploymentGoalsResultsTable
