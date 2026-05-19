// 市场部 新媒体1月1日-1月12日剪辑汇报表
import React, { useState, useMemo, useEffect } from 'react'
import { App, Card, DatePicker, Space, Button, Table, Statistic, Spin } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { monthlyEditReportService, type MonthlyEditReportData } from '@/services/market/monthlyEditReport'

interface EditReportData {
  key: string
  date: string
  project: string
  // 文案类
  audienceType: string
  plannedCopyCount: number
  // 拍摄类
  actualCopyCount: number
  plannedShootCount: number
  dueShootCount: number
  actualShoot: number
  shootProgress: string
  // 剪辑类
  monthlyPlannedEdit: number
  dueEditCount: number
  actualEditCount: number
  // 结果类
  editProgress: string
  approvedCount: number
  approvalRate: string
  groupActivity: string | number
}

const MarketingNewMediaEditReport: React.FC = () => {
  const { message } = App.useApp()
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().subtract(1, 'day'),
  ])
  const [loading, setLoading] = useState(false)
  const [apiData, setApiData] = useState<MonthlyEditReportData[]>([])

  // 根据日期范围获取月份显示文本
  const getMonthText = () => {
    const month = dateRange[0].month() + 1 // dayjs的月份是0-11
    return `${month}月份`
  }

  // 从API获取数据
  const fetchData = async () => {
    try {
      setLoading(true)
      const year = dateRange[0].year()
      const month = dateRange[0].month() + 1
      
      const data = await monthlyEditReportService.getList(year)
      
      // 筛选当前月份的数据 - 使用 period 字段而不是 month
      const filteredData = data.filter(item => item.period === String(month))
      setApiData(filteredData)
      
      if (filteredData.length === 0) {
        message.info('暂无数据')
      } else {
        message.success(`成功加载 ${filteredData.length} 条数据`)
      }
    } catch (error) {
      console.error('获取数据失败:', error)
      message.error('获取数据失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 初始加载数据
  useEffect(() => {
    fetchData()
  }, [dateRange])

  // 将API数据转换为表格数据
  const tableData: EditReportData[] = useMemo(() => {
    if (apiData.length === 0) {
      // 如果没有API数据，返回空数据模板
      return [
        {
          key: '1',
          date: getMonthText(),
          project: '合计',
          audienceType: '#DIV/0!',
          plannedCopyCount: 0,
          actualCopyCount: 0,
          plannedShootCount: 0,
          dueShootCount: 0,
          actualShoot: 0,
          shootProgress: '#DIV/0!',
          monthlyPlannedEdit: 0,
          dueEditCount: 0,
          actualEditCount: 0,
          editProgress: '#DIV/0!',
          approvedCount: 0,
          approvalRate: '#DIV/0!',
          groupActivity: '1',
        },
      ]
    }

    // 转换API数据为表格数据
    const result: EditReportData[] = []
    let summaryRow: EditReportData | null = null
    
    apiData.forEach((item, index) => {
      const rowKey = item.id
        ? String(item.id)
        : `${item.period}-${item.campus || 'summary'}-${item.audienceTypeCount || 'summary'}-${index}`

      const row: EditReportData = {
        key: rowKey,
        date: item.rowType === 'summary' ? getMonthText() : '',
        project: item.campus || '',
        audienceType: item.audienceTypeCount || '',
        plannedCopyCount: item.plannedArticles || 0,
        actualCopyCount: item.actualArticles || 0,
        plannedShootCount: item.plannedEditDemand || 0,
        dueShootCount: item.completedEditDemand || 0,
        actualShoot: item.actualShootVideos || 0,
        shootProgress: item.shootCompletionProgress || '',
        monthlyPlannedEdit: item.monthlyEditPlans || 0,
        dueEditCount: item.completedEarlyPlans || 0,
        actualEditCount: item.actualEditedVideos || 0,
        editProgress: item.editProgressRate || '',
        approvedCount: item.auditPassVideoCount || 0,
        approvalRate: item.auditPassRate || '',
        groupActivity: item.groupActivity || '',
      }
      
      if (item.rowType === 'summary') {
        summaryRow = row
      } else {
        result.push(row)
      }
    })
    
    // 将合计行放在最前面
    if (summaryRow) {
      result.unshift(summaryRow)
    }
    
    return result
  }, [apiData, dateRange])

  // 表格列定义 - 按照Excel结构
  const columns: ColumnsType<EditReportData> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 70,
      fixed: 'left',
      align: 'center',
      render: (text, record, index) => {
        // 只有第一行（合计行）显示日期，其他行合并到第一行
        if (index === 0 && text) {
          return {
            children: text,
            props: { rowSpan: tableData.length }
          }
        }
        return {
          children: text,
          props: { rowSpan: 0 }
        }
      },
    },
    {
      title: '项目',
      dataIndex: 'project',
      key: 'project',
      width: 70,
      fixed: 'left',
      align: 'center',
      render: (text) => (
        <span style={{ fontWeight: text === '合计' ? 'bold' : 'normal' }}>
          {text}
        </span>
      ),
    },
    {
      title: '文案类',
      children: [
        {
          title: '人群类别',
          dataIndex: 'audienceType',
          key: 'audienceType',
          width: 85,
          align: 'center',
        },
        {
          title: '计划文案数',
          dataIndex: 'plannedCopyCount',
          key: 'plannedCopyCount',
          width: 95,
          align: 'center',
        },
        {
          title: '实际文案数',
          dataIndex: 'actualCopyCount',
          key: 'actualCopyCount',
          width: 95,
          align: 'center',
        },
      ],
    },
    {
      title: '拍摄类',
      children: [
        {
          title: '计划拍摄次数',
          dataIndex: 'plannedShootCount',
          key: 'plannedShootCount',
          width: 110,
          align: 'center',
          render: (value, record, index) => {
            if (index === 0) {
              return {
                children: value ?? 0,
                props: { rowSpan: tableData.length }
              }
            }
            return {
              children: value ?? 0,
              props: { rowSpan: 0 }
            }
          },
        },
        {
          title: '截止昨日应完成拍摄次数',
          dataIndex: 'dueShootCount',
          key: 'dueShootCount',
          width: 170,
          align: 'center',
          render: (value, record, index) => {
            if (index === 0) {
              return {
                children: value ?? 0,
                props: { rowSpan: tableData.length }
              }
            }
            return {
              children: value ?? 0,
              props: { rowSpan: 0 }
            }
          },
        },
        {
          title: '实际拍摄次数',
          dataIndex: 'actualShoot',
          key: 'actualShoot',
          width: 110,
          align: 'center',
          render: (value, record, index) => {
            if (index === 0) {
              return {
                children: value ?? 0,
                props: { rowSpan: tableData.length }
              }
            }
            return {
              children: value ?? 0,
              props: { rowSpan: 0 }
            }
          },
        },
        {
          title: '拍摄完成进度',
          dataIndex: 'shootProgress',
          key: 'shootProgress',
          width: 110,
          align: 'center',
          render: (value, record, index) => {
            if (index === 0) {
              return {
                children: value || '#DIV/0!',
                props: { rowSpan: tableData.length }
              }
            }
            return {
              children: value || '#DIV/0!',
              props: { rowSpan: 0 }
            }
          },
        },
      ],
    },
    {
      title: '剪辑类',
      children: [
        {
          title: '本月计划剪辑数',
          dataIndex: 'monthlyPlannedEdit',
          key: 'monthlyPlannedEdit',
          width: 120,
          align: 'center',
        },
        {
          title: '截止昨日应完成剪辑次数',
          dataIndex: 'dueEditCount',
          key: 'dueEditCount',
          width: 170,
          align: 'center',
        },
        {
          title: '实际完成剪辑数',
          dataIndex: 'actualEditCount',
          key: 'actualEditCount',
          width: 120,
          align: 'center',
        },
      ],
    },
    {
      title: '结果类',
      children: [
        {
          title: '剪辑完成进度',
          dataIndex: 'editProgress',
          key: 'editProgress',
          width: 110,
          align: 'center',
        },
        {
          title: '审核通过数',
          dataIndex: 'approvedCount',
          key: 'approvedCount',
          width: 95,
          align: 'center',
        },
        {
          title: '审核通过率',
          dataIndex: 'approvalRate',
          key: 'approvalRate',
          width: 95,
          align: 'center',
        },
        {
          title: '集团活动',
          dataIndex: 'groupActivity',
          key: 'groupActivity',
          width: 85,
          align: 'center',
        },
      ],
    },
  ]

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]])
    }
  }

  const handleRefresh = async () => {
    await fetchData()
    message.success('数据已刷新')
  }

  const getTitleText = () => {
    const start = dateRange[0].format('YYYY年M月D日')
    const end = dateRange[1].format('YYYY年M月D日')
    return `市场部 新媒体${start}-${end}剪辑汇报表`
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Spin spinning={loading}>
        <Card>
          {/* 标题 */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ margin: '0 0 8px 0', color: '#1890ff', fontSize: '20px', fontWeight: 'bold' }}>
              {getTitleText()}
            </h2>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              新媒体剪辑业务数据汇报
            </p>
          </div>

          {/* 筛选和操作区 */}
          <Space style={{ marginBottom: '16px' }} wrap>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              format="YYYY-MM-DD"
              style={{ width: 300 }}
            />
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
              刷新数据
            </Button>
          </Space>

          {/* 数据表格 */}
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            bordered
            size="middle"
            rowClassName={(record) => (record.project === '合计' ? 'total-row' : '')}
          />

          {/* 说明 */}
          <Card
            type="inner"
            title="说明"
            size="small"
            style={{ marginTop: '16px', background: '#fafafa' }}
          >
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#666' }}>
              <li>本表展示新媒体剪辑业务的完整流程数据，包括文案、拍摄、剪辑和审核结果</li>
              <li>支持按日期范围筛选数据，默认显示当前月份数据</li>
              <li>合计行展示所有项目的汇总数据</li>
              <li>#DIV/0! 表示除数为0，需要有实际数据后才能计算百分比</li>
              <li>数据来源：市场部剪辑月度汇报表</li>
            </ul>
          </Card>
        </Card>
      </Spin>

      <style>{`
        .total-row {
          background-color: #e6f7ff;
          font-weight: bold;
        }
      `}</style>
    </div>
  )
}

export default MarketingNewMediaEditReport
