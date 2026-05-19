import React, { useState, useEffect } from 'react'
import { App, Table, Spin, Button, Space } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

interface AnnualData {
  key: string
  period: string // 'all-year' | '1' | '2' ... '12'
  periodLabel: string // '全年度' | '1月' ...
  campus: string // 始终为 '合计'

  // 文案类
  audienceTypeCount: string
  plannedArticles: number
  actualArticles: number

  // 拍摄类
  plannedEditDemand: number
  completedEditDemand: number
  actualShootVideos: number
  shootCompletionProgress: string

  // 剪辑类
  monthlyEditPlans: number
  completedEarlyPlans: number
  actualEditedVideos: number
  editProgressRate: string

  // 结果类
  auditPassVideoCount: number
  auditPassRate: string

  // 集团活动
  groupActivity: string
}

interface AnnualEditReportTabProps {
  year: string
}

const AnnualEditReportTab: React.FC<AnnualEditReportTabProps> = ({ year = '2025' }) => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<AnnualData[]>([])

  // 加载数据
  const loadData = async (forceRegenerate: boolean = false) => {
    setLoading(true)
    try {
      const url = `/api/v1/market/annual-edit-report?year=${year}${forceRegenerate ? '&force_regenerate=true' : ''}`
      const response = await fetch(url)
      const res = await response.json()

      if (res.code === 200 && res.data && res.data.length > 0) {
        setDataSource(res.data)
        message.success(forceRegenerate ? '已从周度表重新生成数据' : '数据已刷新')
      } else {
        // 如果没有数据，生成空数据结构
        const emptyData = generateEmptyData()
        setDataSource(emptyData)
        message.info('暂无数据，请先在剪辑周度表中填写数据')
      }
    } catch (error) {
      console.error('Fetch annual report error:', error)
      message.error('获取数据失败')
      const emptyData = generateEmptyData()
      setDataSource(emptyData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [year])

  // 刷新数据
  const handleRefresh = async () => {
    await loadData()
  }

  // 生成空数据结构
  const generateEmptyData = (): AnnualData[] => {
    const data: AnnualData[] = []

    // 全年度合计行
    data.push({
      key: 'all-year',
      period: 'all-year',
      periodLabel: '全年度',
      campus: '合计',
      audienceTypeCount: '',
      plannedArticles: 0,
      actualArticles: 0,
      plannedEditDemand: 0,
      completedEditDemand: 0,
      actualShootVideos: 0,
      shootCompletionProgress: '0%',
      monthlyEditPlans: 0,
      completedEarlyPlans: 0,
      actualEditedVideos: 0,
      editProgressRate: '0%',
      auditPassVideoCount: 0,
      auditPassRate: '0%',
      groupActivity: ''
    })

    // 1-12月行
    for (let month = 1; month <= 12; month++) {
      data.push({
        key: String(month),
        period: String(month),
        periodLabel: `${month}月`,
        campus: '合计',
        audienceTypeCount: '',
        plannedArticles: 0,
        actualArticles: 0,
        plannedEditDemand: 0,
        completedEditDemand: 0,
        actualShootVideos: 0,
        shootCompletionProgress: '0%',
        monthlyEditPlans: 0,
        completedEarlyPlans: 0,
        actualEditedVideos: 0,
        editProgressRate: '0%',
        auditPassVideoCount: 0,
        auditPassRate: '0%',
        groupActivity: ''
      })
    }

    return data
  }

  const columns: ColumnsType<AnnualData> = [
    {
      title: '项目',
      dataIndex: 'periodLabel',
      key: 'periodLabel',
      width: 80,
      fixed: 'left',
      align: 'center',
      render: (text, record) => (
        <div style={{
          fontWeight: record.period === 'all-year' ? 'bold' : 'normal',
          backgroundColor: record.period === 'all-year' ? '#ffc000' : 'transparent',
          color: record.period === 'all-year' ? 'red' : 'inherit',
          fontSize: '12px'
        }}>
          {text}
        </div>
      )
    },
    {
      title: '文案类',
      children: [
        {
          title: '人群类别',
          dataIndex: 'audienceTypeCount',
          width: 80,
          align: 'center',
          render: (val) => <span style={{ fontSize: '12px' }}>{val || ''}</span>
        },
        {
          title: '计划文案数',
          dataIndex: 'plannedArticles',
          width: 100,
          align: 'center',
          render: (val, record) => (
            <span style={{
              fontSize: '12px',
              fontWeight: record.period === 'all-year' ? 'bold' : 'normal',
              color: record.period === 'all-year' ? 'red' : 'inherit'
            }}>
              {val}
            </span>
          )
        },
        {
          title: '实际文案数',
          dataIndex: 'actualArticles',
          width: 100,
          align: 'center',
          render: (val, record) => (
            <span style={{
              fontSize: '12px',
              fontWeight: record.period === 'all-year' ? 'bold' : 'normal',
              color: record.period === 'all-year' ? 'red' : 'inherit'
            }}>
              {val}
            </span>
          )
        }
      ]
    },
    {
      title: '拍摄类',
      children: [
        {
          title: <div style={{ fontSize: '12px' }}>计划<br/>拍摄次数</div>,
          dataIndex: 'plannedEditDemand',
          width: 80,
          align: 'center',
          render: (val, record) => (
            <span style={{
              fontSize: '12px',
              fontWeight: record.period === 'all-year' ? 'bold' : 'normal',
              color: record.period === 'all-year' ? 'red' : 'inherit'
            }}>
              {val}
            </span>
          )
        },
        {
          title: <div style={{ fontSize: '12px' }}>截止昨日<br/>应完成拍摄次</div>,
          dataIndex: 'completedEditDemand',
          width: 100,
          align: 'center',
          render: (val, record) => (
            <span style={{
              fontSize: '12px',
              fontWeight: record.period === 'all-year' ? 'bold' : 'normal',
              color: record.period === 'all-year' ? 'red' : 'inherit'
            }}>
              {val}
            </span>
          )
        },
        {
          title: <div style={{ fontSize: '12px' }}>实际<br/>拍摄次数</div>,
          dataIndex: 'actualShootVideos',
          width: 80,
          align: 'center',
          render: (val, record) => (
            <span style={{
              fontSize: '12px',
              fontWeight: record.period === 'all-year' ? 'bold' : 'normal',
              color: record.period === 'all-year' ? 'red' : 'inherit'
            }}>
              {val}
            </span>
          )
        },
        {
          title: <div style={{ fontSize: '12px' }}>拍摄<br/>完成进度</div>,
          dataIndex: 'shootCompletionProgress',
          width: 100,
          align: 'center',
          render: (val) => <span style={{ fontSize: '12px', color: val === '0%' ? '#999' : 'inherit' }}>{val}</span>
        }
      ]
    },
    {
      title: '剪辑类',
      children: [
        {
          title: <div style={{ fontSize: '12px' }}>本月计划<br/>剪辑数</div>,
          dataIndex: 'monthlyEditPlans',
          width: 100,
          align: 'center',
          render: (val, record) => (
            <span style={{
              fontSize: '12px',
              fontWeight: record.period === 'all-year' ? 'bold' : 'normal',
              color: record.period === 'all-year' ? 'red' : 'inherit'
            }}>
              {val}
            </span>
          )
        },
        {
          title: <div style={{ fontSize: '12px' }}>截止昨日<br/>应完成剪辑数</div>,
          dataIndex: 'completedEarlyPlans',
          width: 110,
          align: 'center',
          render: (val, record) => (
            <span style={{
              fontSize: '12px',
              fontWeight: record.period === 'all-year' ? 'bold' : 'normal',
              color: record.period === 'all-year' ? 'red' : 'inherit'
            }}>
              {val}
            </span>
          )
        },
        {
          title: <div style={{ fontSize: '12px' }}>实际<br/>完成剪辑数</div>,
          dataIndex: 'actualEditedVideos',
          width: 110,
          align: 'center',
          render: (val, record) => (
            <span style={{
              fontSize: '12px',
              fontWeight: record.period === 'all-year' ? 'bold' : 'normal',
              color: record.period === 'all-year' ? 'red' : 'inherit'
            }}>
              {val}
            </span>
          )
        },
        {
          title: <div style={{ fontSize: '12px' }}>剪辑<br/>完成进度</div>,
          dataIndex: 'editProgressRate',
          width: 100,
          align: 'center',
          render: (val) => <span style={{ fontSize: '12px', color: val === '0%' ? '#999' : 'inherit' }}>{val}</span>
        }
      ]
    },
    {
      title: '结果类',
      children: [
        {
          title: <div style={{ fontSize: '12px' }}>审核<br/>通过数</div>,
          dataIndex: 'auditPassVideoCount',
          width: 80,
          align: 'center',
          render: (val, record) => (
            <span style={{
              fontSize: '12px',
              fontWeight: record.period === 'all-year' ? 'bold' : 'normal',
              color: record.period === 'all-year' ? 'red' : 'inherit'
            }}>
              {val}
            </span>
          )
        },
        {
          title: <div style={{ fontSize: '12px' }}>审核<br/>通过率</div>,
          dataIndex: 'auditPassRate',
          width: 100,
          align: 'center',
          render: (val) => <span style={{ fontSize: '12px', color: val === '0%' ? '#999' : 'inherit' }}>{val}</span>
        }
      ]
    },
    {
      title: '集团活动',
      dataIndex: 'groupActivity',
      width: 150,
      align: 'center',
      render: (val) => <span style={{ fontSize: '12px' }}>{val || ''}</span>
    }
  ]

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <div>
      <Space style={{ marginBottom: '16px' }} direction="vertical">
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh} 
            loading={loading}
            type="primary"
          >
            刷新数据
          </Button>
          <span style={{ color: '#666', fontSize: '12px' }}>
            💡 提示：年度表数据来自月度表，如果月度表数据有更新，请先在月度表中点击"保存数据"，然后再刷新年度表
          </span>
        </Space>
      </Space>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="key"
        pagination={false}
        bordered
        size="small"
        scroll={{ x: 1400, y: 700 }}
        rowClassName={(record) => record.period === 'all-year' ? 'summary-row' : ''}
      />
      <style>{`
        .summary-row td {
          background-color: #fff9e6 !important;
          font-weight: bold;
        }
        .summary-row:hover td {
          background-color: #fff9e6 !important;
        }
        .ant-table-wrapper .ant-table-thead > tr > th {
          background-color: #e6f7ff !important;
          font-weight: bold;
          text-align: center;
          padding: 4px !important;
          font-size: 12px !important;
        }
        .ant-table-wrapper .ant-table-tbody > tr > td {
          padding: 4px !important;
          font-size: 12px !important;
        }
      `}</style>
    </div>
  )
}

export default AnnualEditReportTab
