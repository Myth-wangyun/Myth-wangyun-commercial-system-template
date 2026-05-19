/**
 * 神殿教化司师资配比表组件
 */

import React from 'react'
import { App, Card, Table, Button, Space, Statistic, Row, Col, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined, EditOutlined } from '@ant-design/icons'
import type {
  CampusTeacherRatioTableProps,
  CampusTeacherRatioRecord,
  CampusTeacherRatioSummary,
} from '@/types/campus-teacher-ratio'
import { campusTeacherRatioService } from '@/services/teaching-quality/campusTeacherRatio'

const CampusTeacherRatioTable: React.FC<CampusTeacherRatioTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
  onEdit,
}) => {
  const { message } = App.useApp()
  const [summary, setSummary] = React.useState<CampusTeacherRatioSummary | null>(null)

  // 获取汇总统计数据
  React.useEffect(() => {
    if (campus && data.length > 0) {
      campusTeacherRatioService.getCampusTeacherRatioSummary(campus).then(setSummary)
    }
  }, [campus, data])

  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob = await campusTeacherRatioService.exportCampusTeacherRatioData(campus)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${campus}神殿教化司师资配比表.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  const columns: ColumnsType<CampusTeacherRatioRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      fixed: 'left',
      render: (value, record, index) => {
        // 最后一行显示"合计/平均"
        if (index === data.length - 1) {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>合计/平均</span>
        }
        return value
      },
    },
    {
      title: '统计时间',
      dataIndex: 'statisticsTime',
      key: 'statisticsTime',
      width: 120,
      render: (value, record, index) => {
        // 合计行不显示统计时间
        if (index === data.length - 1) {
          return ''
        }
        return value || ''
      },
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 120,
      render: (value, record, index) => {
        // 只有第一行显示神殿名称，其他行和合计行不显示
        if (index === 0) {
          return value
        }
        return ''
      },
    },
    {
      title: '学生总人数',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
      width: 120,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data.slice(0, -1).reduce((sum, item) => sum + item.totalStudents, 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    },
    {
      title: '职数分析',
      children: [
        {
          title: '目标师生配比',
          dataIndex: ['positionAnalysis', 'targetTeacherStudentRatio'],
          key: 'positionAnalysis.targetTeacherStudentRatio',
          width: 120,
          render: (value, record, index) => {
            // 合计行不显示配比
            if (index === data.length - 1) {
              return ''
            }
            return value || ''
          },
        },
        {
          title: '目标老师总数',
          dataIndex: ['positionAnalysis', 'targetTeacherCount'],
          key: 'positionAnalysis.targetTeacherCount',
          width: 120,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data
                .slice(0, -1)
                .reduce((sum, item) => sum + item.positionAnalysis.targetTeacherCount, 0)
              return <span style={{ fontWeight: 'bold' }}>{total}</span>
            }
            return value || 0
          },
        },
        {
          title: '实际老师数量',
          dataIndex: ['positionAnalysis', 'actualTeacherCount'],
          key: 'positionAnalysis.actualTeacherCount',
          width: 120,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data
                .slice(0, -1)
                .reduce((sum, item) => sum + item.positionAnalysis.actualTeacherCount, 0)
              return <span style={{ fontWeight: 'bold' }}>{total}</span>
            }
            return value || 0
          },
        },
        {
          title: '班主任空缺职数',
          dataIndex: ['positionAnalysis', 'homeroomTeacherVacancies'],
          key: 'positionAnalysis.homeroomTeacherVacancies',
          width: 130,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data
                .slice(0, -1)
                .reduce((sum, item) => sum + item.positionAnalysis.homeroomTeacherVacancies, 0)
              return (
                <span style={{ fontWeight: 'bold', color: total > 0 ? 'red' : 'green' }}>
                  {total}
                </span>
              )
            }
            const vacancies = value || 0
            return <span style={{ color: vacancies > 0 ? 'red' : 'green' }}>{vacancies}</span>
          },
        },
        {
          title: '班主任冗余职数',
          dataIndex: ['positionAnalysis', 'homeroomTeacherSurplus'],
          key: 'positionAnalysis.homeroomTeacherSurplus',
          width: 130,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data
                .slice(0, -1)
                .reduce((sum, item) => sum + item.positionAnalysis.homeroomTeacherSurplus, 0)
              return (
                <span style={{ fontWeight: 'bold', color: total > 0 ? 'orange' : 'green' }}>
                  {total}
                </span>
              )
            }
            const surplus = value || 0
            return <span style={{ color: surplus > 0 ? 'orange' : 'green' }}>{surplus}</span>
          },
        },
      ],
    },
    {
      title: '干部职数分析',
      children: [
        {
          title: '目标中层与班主任配比',
          dataIndex: ['cadrePositionAnalysis', 'targetMiddleManagementRatio'],
          key: 'cadrePositionAnalysis.targetMiddleManagementRatio',
          width: 150,
          render: (value, record, index) => {
            // 合计行不显示配比
            if (index === data.length - 1) {
              return ''
            }
            return value || ''
          },
        },
        {
          title: '目标中层人数',
          dataIndex: ['cadrePositionAnalysis', 'targetMiddleManagementCount'],
          key: 'cadrePositionAnalysis.targetMiddleManagementCount',
          width: 120,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data
                .slice(0, -1)
                .reduce(
                  (sum, item) => sum + item.cadrePositionAnalysis.targetMiddleManagementCount,
                  0,
                )
              return <span style={{ fontWeight: 'bold' }}>{total}</span>
            }
            return value || 0
          },
        },
        {
          title: '实际中层人数',
          dataIndex: ['cadrePositionAnalysis', 'actualMiddleManagementCount'],
          key: 'cadrePositionAnalysis.actualMiddleManagementCount',
          width: 120,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data
                .slice(0, -1)
                .reduce(
                  (sum, item) => sum + item.cadrePositionAnalysis.actualMiddleManagementCount,
                  0,
                )
              return <span style={{ fontWeight: 'bold' }}>{total}</span>
            }
            return value || 0
          },
        },
        {
          title: '中层空缺职数',
          dataIndex: ['cadrePositionAnalysis', 'middleManagementVacancies'],
          key: 'cadrePositionAnalysis.middleManagementVacancies',
          width: 130,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data
                .slice(0, -1)
                .reduce(
                  (sum, item) => sum + item.cadrePositionAnalysis.middleManagementVacancies,
                  0,
                )
              return (
                <span style={{ fontWeight: 'bold', color: total > 0 ? 'red' : 'green' }}>
                  {total}
                </span>
              )
            }
            const vacancies = value || 0
            return <span style={{ color: vacancies > 0 ? 'red' : 'green' }}>{vacancies}</span>
          },
        },
        {
          title: '中层冗余职数',
          dataIndex: ['cadrePositionAnalysis', 'middleManagementSurplus'],
          key: 'cadrePositionAnalysis.middleManagementSurplus',
          width: 130,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data
                .slice(0, -1)
                .reduce((sum, item) => sum + item.cadrePositionAnalysis.middleManagementSurplus, 0)
              return (
                <span style={{ fontWeight: 'bold', color: total > 0 ? 'orange' : 'green' }}>
                  {total}
                </span>
              )
            }
            const surplus = value || 0
            return <span style={{ color: surplus > 0 ? 'orange' : 'green' }}>{surplus}</span>
          },
        },
      ],
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record, index) => {
        // 合计行不显示操作按钮
        if (index === data.length - 1) {
          return ''
        }
        return (
          <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)} size="small">
            编辑
          </Button>
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
              <Statistic title="总学生人数" value={summary.totalStudents} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic title="总目标老师数" value={summary.totalTargetTeachers} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic title="总实际老师数" value={summary.totalActualTeachers} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic
                title="老师利用率"
                value={summary.teacherUtilizationRate}
                precision={1}
                suffix="%"
                valueStyle={{
                  color:
                    summary.teacherUtilizationRate >= 90
                      ? 'green'
                      : summary.teacherUtilizationRate >= 80
                        ? 'orange'
                        : 'red',
                }}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Statistic
                title="总班主任空缺"
                value={summary.totalHomeroomVacancies}
                suffix="人"
                valueStyle={{ color: summary.totalHomeroomVacancies > 0 ? 'red' : 'green' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总班主任冗余"
                value={summary.totalHomeroomSurplus}
                suffix="人"
                valueStyle={{ color: summary.totalHomeroomSurplus > 0 ? 'orange' : 'green' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总中层空缺"
                value={summary.totalMiddleManagementVacancies}
                suffix="人"
                valueStyle={{ color: summary.totalMiddleManagementVacancies > 0 ? 'red' : 'green' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="中层利用率"
                value={summary.middleManagementUtilizationRate}
                precision={1}
                suffix="%"
                valueStyle={{
                  color:
                    summary.middleManagementUtilizationRate >= 90
                      ? 'green'
                      : summary.middleManagementUtilizationRate >= 80
                        ? 'orange'
                        : 'red',
                }}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Statistic
                title="平均师生配比"
                value={summary.averageTeacherStudentRatio}
                precision={1}
                suffix=":1"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="已完成记录"
                value={`${summary.completedRecords}/${summary.totalRecords}`}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={`${campus || '请选择神殿'}教化司师资配比表`}
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

export default CampusTeacherRatioTable
