/**
 * 神殿后端学员就业目标与结果汇总表组件
 */

import React, { useMemo } from 'react'
import { App, Card, Table, Button, Space, Tooltip, Statistic, Row, Col } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import type {
  CampusEmploymentGoalsResultsTableProps,
  CampusEmploymentGoalsResultsRecord,
} from '@/types/campus-employment-goals-results'
import { campusEmploymentGoalsResultsService } from '@/services/campusEmploymentGoalsResults'

const CampusEmploymentGoalsResultsTable: React.FC<CampusEmploymentGoalsResultsTableProps> = ({
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
        await campusEmploymentGoalsResultsService.exportCampusEmploymentGoalsResultsData(campus)
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

  // 使用 useMemo 确保列定义在数据变化时重新计算
  const columns: ColumnsType<CampusEmploymentGoalsResultsRecord> = useMemo(
    () => [
      {
        title: '序号',
        dataIndex: 'serialNumber',
        key: 'serialNumber',
        width: 80,
        fixed: 'left',
        align: 'center',
        render: (value, _record, index) => (index === data.length - 1 ? '' : value),
      },
      {
        title: '神殿',
        dataIndex: 'campus',
        key: 'campus',
        width: 120,
        fixed: 'left',
        align: 'center',
        render: (value, _record, index) => {
          // 合计行显示“合计/平均”；非合计行保持原值
          if (index === data.length - 1) {
            return '合计/平均'
          }
          return value
        },
      },
      {
        title: '专业方向',
        dataIndex: 'majorDirection',
        key: 'majorDirection',
        width: 120,
        align: 'center',
        render: (value, _record, index) => (index === data.length - 1 ? '' : value),
      },
      {
        title: '学制',
        dataIndex: 'duration',
        key: 'duration',
        width: 100,
        align: 'center',
        render: (value, _record, index) => (index === data.length - 1 ? '' : value),
      },
      {
        title: '班级名称',
        dataIndex: 'className',
        key: 'className',
        width: 120,
        align: 'center',
        render: (value, _record, index) =>
          index === data.length - 1 ? (
            ''
          ) : (
            <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{value || ''}</span>
          ),
      },
      {
        title: '授课教员',
        dataIndex: 'instructor',
        key: 'instructor',
        width: 120,
        align: 'center',
        render: (value, _record, index) => (index === data.length - 1 ? '' : value),
      },
      {
        title: '负责班主任',
        dataIndex: 'headTeacher',
        key: 'headTeacher',
        width: 120,
        align: 'center',
        render: (value, _record, index) => (index === data.length - 1 ? '' : value),
      },
      {
        title: '毕业时间',
        dataIndex: 'graduationDate',
        key: 'graduationDate',
        width: 120,
        align: 'center',
        render: (value, _record, index) => (index === data.length - 1 ? '' : value),
      },
      {
        title: '薪资达标率',
        align: 'center',
        children: [
          {
            title: '目标平均就业薪资',
            dataIndex: ['salaryAttainment', 'targetAverageSalary'],
            key: 'salaryAttainment.targetAverageSalary',
            width: 150,
            align: 'center',
            render: (value, record, index) => {
              // 合计行显示平均值
              if (index === data.length - 1) {
                const avg =
                  data
                    .slice(0, -1)
                    .reduce((sum, item) => sum + item.salaryAttainment.targetAverageSalary, 0) /
                  Math.max(1, data.slice(0, -1).length)
                return <span style={{ fontWeight: 'bold' }}>¥{avg.toFixed(0)}</span>
              }
              return value ? `¥${value.toLocaleString()}` : ''
            },
          },
          {
            title: '实际平均就业薪资',
            dataIndex: ['salaryAttainment', 'actualAverageSalary'],
            key: 'salaryAttainment.actualAverageSalary',
            width: 150,
            align: 'center',
            render: (value, record, index) => {
              // 合计行显示平均值
              if (index === data.length - 1) {
                const avg =
                  data
                    .slice(0, -1)
                    .reduce((sum, item) => sum + item.salaryAttainment.actualAverageSalary, 0) /
                  Math.max(1, data.slice(0, -1).length)
                return <span style={{ fontWeight: 'bold' }}>¥{avg.toFixed(0)}</span>
              }
              return value ? `¥${value.toLocaleString()}` : ''
            },
          },
          {
            title: '达标率',
            dataIndex: ['salaryAttainment', 'attainmentRate'],
            key: 'salaryAttainment.attainmentRate',
            width: 100,
            align: 'center',
            render: (value, record, index) => {
              // 合计行显示平均值
              if (index === data.length - 1) {
                const avg =
                  data
                    .slice(0, -1)
                    .reduce((sum, item) => sum + item.salaryAttainment.attainmentRate, 0) /
                  Math.max(1, data.slice(0, -1).length)
                return <span style={{ fontWeight: 'bold' }}>{avg.toFixed(1)}%</span>
              }
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
        align: 'center',
        children: [
          {
            title: '档案人数',
            dataIndex: ['employmentRate', 'fileCount'],
            key: 'employmentRate.fileCount',
            width: 100,
            align: 'center',
            render: (value, record, index) => {
              // 合计行显示总和
              if (index === data.length - 1) {
                const total = data
                  .slice(0, -1)
                  .reduce((sum, item) => sum + item.employmentRate.fileCount, 0)
                return <span style={{ fontWeight: 'bold' }}>{total}</span>
              }
              return value || 0
            },
          },
          {
            title: '目标就业人数',
            dataIndex: ['employmentRate', 'targetEmploymentCount'],
            key: 'employmentRate.targetEmploymentCount',
            width: 120,
            align: 'center',
            render: (value, record, index) => {
              // 合计行显示总和
              if (index === data.length - 1) {
                const total = data
                  .slice(0, -1)
                  .reduce((sum, item) => sum + item.employmentRate.targetEmploymentCount, 0)
                return <span style={{ fontWeight: 'bold' }}>{total}</span>
              }
              return value || 0
            },
          },
          {
            title: '实际就业人数',
            dataIndex: ['employmentRate', 'actualEmploymentCount'],
            key: 'employmentRate.actualEmploymentCount',
            width: 120,
            align: 'center',
            render: (value, record, index) => {
              // 合计行显示总和
              if (index === data.length - 1) {
                const total = data
                  .slice(0, -1)
                  .reduce((sum, item) => sum + item.employmentRate.actualEmploymentCount, 0)
                return <span style={{ fontWeight: 'bold' }}>{total}</span>
              }
              return value || 0
            },
          },
          {
            title: '就业率',
            dataIndex: ['employmentRate', 'employmentRate'],
            key: 'employmentRate.employmentRate',
            width: 100,
            align: 'center',
            render: (value, record, index) => {
              // 合计行：合计实际就业人数 / 合计目标就业人数
              if (index === data.length - 1) {
                const totalActual = data
                  .slice(0, -1)
                  .reduce((sum, item) => sum + item.employmentRate.actualEmploymentCount, 0)
                const totalTarget = data
                  .slice(0, -1)
                  .reduce((sum, item) => sum + item.employmentRate.targetEmploymentCount, 0)
                const rate = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0
                return <span style={{ fontWeight: 'bold' }}>{rate.toFixed(1)}%</span>
              }
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
        render: (value, record, index) => {
          // 合计行显示总和
          if (index === data.length - 1) {
            const total = data
              .slice(0, -1)
              .reduce((sum, item) => sum + item.salaryOverTenThousand, 0)
            return <span style={{ fontWeight: 'bold' }}>{total}</span>
          }
          return value || 0
        },
      },
      {
        title: '操作',
        key: 'action',
        width: 100,
        fixed: 'right',
        align: 'center',
        render: (_, record, index) => {
          // 合计行不显示操作按钮
          if (index === data.length - 1) {
            return ''
          }
          return (
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
          )
        },
      },
    ],
    [data],
  )

  // 计算汇总数据
  const summaryData = data.length > 0 ? data[0] : null
  const totalClasses = data.filter((item) => item.className).length
  const totalStudents = data.reduce((sum, item) => sum + item.employmentRate.fileCount, 0)
  const totalActualEmployment = data.reduce(
    (sum, item) => sum + item.employmentRate.actualEmploymentCount,
    0,
  )
  const averageEmploymentRate =
    totalStudents > 0 ? (totalActualEmployment / totalStudents) * 100 : 0

  return (
    <div>
      {/* 关键统计指标 */}
      {summaryData && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="总班级数" value={totalClasses} suffix="个" />
            </Col>
            <Col span={6}>
              <Statistic title="总学生数" value={totalStudents} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic title="总就业人数" value={totalActualEmployment} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均就业率"
                value={averageEmploymentRate}
                precision={1}
                suffix="%"
                valueStyle={{
                  color:
                    averageEmploymentRate >= 80
                      ? 'green'
                      : averageEmploymentRate >= 60
                        ? 'orange'
                        : 'red',
                }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 - 始终显示 */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
              💼 {campus || '请选择神殿'}后端学员就业目标与结果汇总表
            </span>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={onAdd} disabled={!campus}>
                新增
              </Button>
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
        {data.length === 0 && !loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
            暂无数据，请选择神殿后查看数据
          </div>
        ) : (
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
        )}

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

export default CampusEmploymentGoalsResultsTable
