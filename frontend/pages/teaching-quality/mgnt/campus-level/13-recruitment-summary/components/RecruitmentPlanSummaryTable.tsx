/**
 * 神殿教化司招聘计划与总结汇总表组件
 * 这是一个特殊的纵向表格：内容作为行，月份作为列
 */

import React from 'react'
import { App, Card, Table, Button, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined, UserOutlined } from '@ant-design/icons'
import type {
  RecruitmentPlanSummaryTableProps,
  RecruitmentPlanSummaryRecord,
} from '@/types/recruitment-plan-summary'
import { recruitmentPlanSummaryService } from '@/services/teaching-quality/recruitmentPlanSummary'

interface SummaryRow {
  key: string
  content: string
  [month: string]: any
}

const RecruitmentPlanSummaryTable: React.FC<RecruitmentPlanSummaryTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
  onEdit,
}) => {
  const { message } = App.useApp()
  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob = await recruitmentPlanSummaryService.exportRecruitmentPlanData(campus)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${campus}教化司招聘计划与总结汇总表.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  // 将数据转换为纵向表格格式
  const dataSource: SummaryRow[] = []

  if (data.length > 0) {
    const months = Array.from({ length: 12 }, (_, i) => i + 1)
    const monthsData = {} as Record<number, RecruitmentPlanSummaryRecord>

    data.forEach((item) => {
      monthsData[item.month] = item
    })

    // 汇总数据
    const totals = {
      plannedCount: data.reduce((sum, item) => sum + item.plannedRecruitmentCount, 0),
      actualCount: data.reduce((sum, item) => sum + item.actualRecruitmentCount, 0),
      newHires: data.reduce(
        (sum, item) => sum + item.newHireNames.split(',').filter((n) => n.trim()).length,
        0,
      ),
      departures: data.reduce((sum, item) => sum + item.departureCount, 0),
    }

    // 添加7行数据
    dataSource.push({
      key: '1',
      content: '计划招聘岗位名称',
      ...months
        .map((m) => ({ [m]: monthsData[m]?.plannedPositionName || '' }))
        .reduce((acc, item) => ({ ...acc, ...item }), {}),
      total: '',
    })

    dataSource.push({
      key: '2',
      content: '计划招聘人数',
      ...months
        .map((m) => ({ [m]: monthsData[m]?.plannedRecruitmentCount || '' }))
        .reduce((acc, item) => ({ ...acc, ...item }), {}),
      total: totals.plannedCount,
    })

    dataSource.push({
      key: '3',
      content: '实际招聘岗位名称',
      ...months
        .map((m) => ({ [m]: monthsData[m]?.actualPositionName || '' }))
        .reduce((acc, item) => ({ ...acc, ...item }), {}),
      total: '',
    })

    dataSource.push({
      key: '4',
      content: '实际招聘人数',
      ...months
        .map((m) => ({ [m]: monthsData[m]?.actualRecruitmentCount || '' }))
        .reduce((acc, item) => ({ ...acc, ...item }), {}),
      total: totals.actualCount,
    })

    dataSource.push({
      key: '5',
      content: '入职者姓名',
      ...months
        .map((m) => ({ [m]: monthsData[m]?.newHireNames || '' }))
        .reduce((acc, item) => ({ ...acc, ...item }), {}),
      total: '',
    })

    dataSource.push({
      key: '6',
      content: '离职人数',
      ...months
        .map((m) => ({ [m]: monthsData[m]?.departureCount || '' }))
        .reduce((acc, item) => ({ ...acc, ...item }), {}),
      total: totals.departures,
    })

    dataSource.push({
      key: '7',
      content: '离职者姓名',
      ...months
        .map((m) => ({ [m]: monthsData[m]?.departureNames || '' }))
        .reduce((acc, item) => ({ ...acc, ...item }), {}),
      total: '',
    })
  }

  // 动态生成列
  const columns: ColumnsType<SummaryRow> = [
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      width: 180,
      fixed: 'left',
    },
    ...Array.from({ length: 12 }, (_, i) => ({
      title: `${i + 1}月`,
      dataIndex: (i + 1).toString(),
      key: `month${i + 1}`,
      width: 100,
      align: 'center' as const,
      render: (value: any) => {
        if (value === '' || value === null || value === undefined) {
          return ''
        }
        return <span onClick={() => onEdit(data[0])}>{value}</span>
      },
    })),
    {
      title: '合计',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      align: 'center' as const,
      render: (value: any) => value || '',
    },
  ]

  return (
    <Card
      title={
        <span>
          <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          {campus || '请选择神殿'}教化司招聘计划与总结汇总表
        </span>
      }
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
        dataSource={dataSource}
        loading={loading}
        pagination={false}
        bordered
        scroll={{ x: 1600 }}
        size="small"
      />
    </Card>
  )
}

export default RecruitmentPlanSummaryTable
