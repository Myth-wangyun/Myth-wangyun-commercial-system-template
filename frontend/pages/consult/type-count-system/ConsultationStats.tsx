/**
 * 咨询量统计组件
 * 展示各TAB的统计数据，支持筛选和导出
 * 
 * TAB结构（类似Excel）：
 * - 总表：所有有效咨询量
 * - 网络：量来源=网络 的记录
 * - 网络新媒体：量来源=网络 且 媒体来源 属于新媒体平台的记录
 * - 市场口碑：量来源=口碑 且 媒体来源=市场口碑
 * - 合作伙伴：量来源=合作伙伴
 * - 口碑：量来源=口碑
 * - 渠道：量来源=渠道
 * - 神殿新媒体：量来源=神殿新媒体
 * - 上门：是否上门=1
 * - 报名人数明细：是否报名=1
 * - 订座人数明细：是否订座=1
 * - 无效量：是否无效量=1
 * - 不算量：是否不算量=1
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { App,
  Card,
  Tabs,
  Table,
  DatePicker,
  Space,
  Button,
  Statistic,
  Row,
  Col,
  Spin,
  Tag,
  Typography,
  Tooltip,
  Badge,
  Divider,
} from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  BarChartOutlined,
  FileExcelOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import * as statsApi from './statsApi'
import type { TabStat } from './statsApi'

const { RangePicker } = DatePicker
const { Text } = Typography

// TAB配置：定义每个TAB的名称、描述和颜色
// 按照Excel TAB顺序排列
const TAB_CONFIG = [
  { key: '总表', label: '总表', color: '#1890ff', description: '所有有效咨询量（排除无效量和不算量）' },
  { key: '网络', label: '网络', color: '#52c41a', description: '量来源=网络（包含新媒体平台、常规SEM、合作伙伴、免费推广）' },
  { key: '网络新媒体', label: '网络新媒体', color: '#13c2c2', description: '网络下的新媒体平台（抖音、快手、微信视频号、小红书、B站）' },
  { key: '市场口碑', label: '市场口碑', color: '#fa8c16', description: '网络→市场口碑' },
  { key: '合作伙伴', label: '合作伙伴', color: '#722ed1', description: '量来源=合作伙伴' },
  { key: '口碑', label: '口碑', color: '#faad14', description: '量来源=口碑（包含咨询口碑、教质口碑等）' },
  { key: '渠道', label: '渠道', color: '#a0d911', description: '量来源=渠道' },
  { key: '神殿新媒体', label: '神殿新媒体', color: '#eb2f96', description: '量来源=神殿新媒体' },
  { key: '上门', label: '上门', color: '#2f54eb', description: '是否上门=1' },
  { key: '报名人数明细', label: '报名', color: '#fa541c', description: '是否报名=1' },
  { key: '订座人数明细', label: '订座', color: '#f759ab', description: '是否订座=1' },
  { key: '无效量', label: '无效量', color: '#f5222d', description: '是否无效量=1（空号、无意向、重复等）' },
  { key: '不算量', label: '不算量', color: '#8c8c8c', description: '是否不算量=1（测试、内部人员等）' },
  { key: '未分配', label: '未分配', color: '#ff4d4f', description: '咨询师为空的记录，尚未分配给咨询师' },
]

// 表格列定义
const getColumns = (): ColumnsType<any> => [
  {
    title: '登记日期',
    dataIndex: '登记日期',
    key: '登记日期',
    width: 140,
    render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    sorter: (a, b) => dayjs(a.登记日期).valueOf() - dayjs(b.登记日期).valueOf(),
  },
  {
    title: '咨询师',
    dataIndex: '咨询师',
    key: '咨询师',
    width: 80,
    ellipsis: true,
  },
  {
    title: '姓名',
    dataIndex: '咨询者姓名',
    key: '咨询者姓名',
    width: 70,
    ellipsis: true,
  },
  {
    title: '电话',
    dataIndex: '电话',
    key: '电话',
    width: 120,
  },
  {
    title: '量来源',
    dataIndex: '量来源',
    key: '量来源',
    width: 90,
    render: (val: string) => {
      const colorMap: Record<string, string> = {
        '网络': 'green',
        '口碑': 'gold',
        '渠道': 'lime',
        '合作伙伴': 'purple',
        '神殿新媒体': 'magenta',
      }
      return <Tag color={colorMap[val] || 'blue'}>{val || '-'}</Tag>
    },
  },
  {
    title: '媒体来源',
    dataIndex: '媒体来源',
    key: '媒体来源',
    width: 110,
    ellipsis: true,
    render: (val: string) => val || '-',
  },
  {
    title: '学历',
    dataIndex: '学历',
    key: '学历',
    width: 70,
    ellipsis: true,
  },
  {
    title: '状态',
    dataIndex: '状态',
    key: '状态',
    width: 70,
    ellipsis: true,
  },
  {
    title: '报名意向',
    dataIndex: '报名意向',
    key: '报名意向',
    width: 80,
    ellipsis: true,
  },
  {
    title: '是否上门',
    dataIndex: '是否上门',
    key: '是否上门',
    width: 70,
    render: (val: number) => val === 1 ? <Tag color="success">是</Tag> : <Tag>否</Tag>,
  },
  {
    title: '是否报名',
    dataIndex: '是否报名',
    key: '是否报名',
    width: 70,
    render: (val: number) => val === 1 ? <Tag color="success">是</Tag> : <Tag>否</Tag>,
  },
  {
    title: '是否订座',
    dataIndex: '是否订座',
    key: '是否订座',
    width: 70,
    render: (val: number) => val === 1 ? <Tag color="success">是</Tag> : <Tag>否</Tag>,
  },
  {
    title: '神殿',
    dataIndex: '神殿',
    key: '神殿',
    width: 80,
    ellipsis: true,
  },
  {
    title: '无效原因',
    dataIndex: '无效原因',
    key: '无效原因',
    width: 90,
    ellipsis: true,
    render: (val: string, record: any) => record.是否无效量 === 1 ? <Tag color="red">{val || '未填写'}</Tag> : '-',
  },
  {
    title: '不算量原因',
    dataIndex: '不算量原因',
    key: '不算量原因',
    width: 90,
    ellipsis: true,
    render: (val: string, record: any) => record.是否不算量 === 1 ? <Tag color="default">{val || '未填写'}</Tag> : '-',
  },
]

interface ConsultationStatsProps {
  refreshKey?: number
}

const ConsultationStats: React.FC<ConsultationStatsProps> = ({ refreshKey }) => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  
  // 状态
  const [loading, setLoading] = useState(false)
  const [tabsStats, setTabsStats] = useState<TabStat[]>([])
  const [configTree, setConfigTree] = useState<Record<string, Record<string, string[]>>>({})
  const [activeTab, setActiveTab] = useState('总表')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    dayjs().startOf('month'),
    dayjs(),
  ])
  
  // 当前TAB的数据
  const [tabData, setTabData] = useState<any[]>([])
  const [tabLoading, setTabLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  })

  // 构建查询参数
  const buildQueryParams = useCallback(() => {
    const params: any = {}
    if (currentCampus && currentCampus !== '全部神殿') {
      params.神殿 = currentCampus
    }
    if (dateRange[0]) {
      params.开始日期 = dateRange[0].format('YYYY-MM-DD')
    }
    if (dateRange[1]) {
      params.结束日期 = dateRange[1].format('YYYY-MM-DD')
    }
    return params
  }, [currentCampus, dateRange])

  // 加载统计数据
  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const params = buildQueryParams()
      const response = await statsApi.getAllTabsStats(params)
      if (response.success) {
        setTabsStats(response.data)
        setConfigTree(response.config_tree)
      } else {
        message.error('加载统计数据失败')
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
      message.error('加载统计数据失败')
    } finally {
      setLoading(false)
    }
  }, [buildQueryParams])

  // 加载当前TAB的详细数据
  const loadTabData = useCallback(async (page = 1, pageSize = 50) => {
    setTabLoading(true)
    try {
      const params = {
        ...buildQueryParams(),
        page,
        page_size: pageSize,
      }
      
      const response = await statsApi.getTabData(activeTab, params)
      if (response.success) {
        setTabData(response.data)
        setPagination({
          current: response.page,
          pageSize: response.page_size,
          total: response.total,
        })
      } else {
        message.error('加载详细数据失败')
      }
    } catch (error) {
      console.error('加载详细数据失败:', error)
      message.error('加载详细数据失败')
    } finally {
      setTabLoading(false)
    }
  }, [activeTab, buildQueryParams])

  // 初始加载和刷新
  useEffect(() => {
    loadStats()
  }, [loadStats, refreshKey])

  // 切换TAB或日期变化时加载数据
  useEffect(() => {
    loadTabData(1, pagination.pageSize)
  }, [activeTab, loadTabData, refreshKey])

  // 获取TAB的统计数量
  const getTabCount = useCallback((tabKey: string): number => {
    const stat = tabsStats.find(s => s.tab_name === tabKey)
    return stat?.count || 0
  }, [tabsStats])

  // 处理分页变化
  const handleTableChange = (paginationConfig: any) => {
    loadTabData(paginationConfig.current, paginationConfig.pageSize)
  }

  // 处理刷新
  const handleRefresh = () => {
    loadStats()
    loadTabData(1, pagination.pageSize)
  }

  // 生成TAB项
  const tabItems = useMemo(() => {
    return TAB_CONFIG.map(tab => {
      const count = getTabCount(tab.key)
      return {
        key: tab.key,
        label: (
          <Tooltip title={tab.description}>
            <Space size={4}>
              <span style={{ color: tab.color }}>{tab.label}</span>
              <Badge 
                count={count} 
                overflowCount={9999} 
                showZero
                style={{ 
                  backgroundColor: count > 0 ? tab.color : '#d9d9d9',
                }}
              />
            </Space>
          </Tooltip>
        ),
      }
    })
  }, [tabsStats, getTabCount])

  // 统计卡片
  const renderStatCards = () => {
    const stats = [
      { key: '总表', title: '总量', color: '#1890ff' },
      { key: '上门', title: '上门', color: '#52c41a' },
      { key: '报名人数明细', title: '报名', color: '#fa8c16' },
      { key: '订座人数明细', title: '订座', color: '#eb2f96' },
      { key: '无效量', title: '无效量', color: '#f5222d' },
      { key: '不算量', title: '不算量', color: '#8c8c8c' },
      { key: '未分配', title: '未分配', color: '#ff4d4f' },
    ]

    return (
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {stats.map(stat => (
          <Col xs={12} sm={8} md={4} key={stat.key}>
            <Card size="small" hoverable>
              <Statistic
                title={stat.title}
                value={getTabCount(stat.key)}
                valueStyle={{ color: stat.color, fontSize: 24 }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    )
  }

  // 获取当前TAB的描述
  const currentTabInfo = TAB_CONFIG.find(t => t.key === activeTab)

  return (
    <Spin spinning={loading}>
      <Card
        title={
          <Space>
            <BarChartOutlined />
            <span>咨询量统计</span>
            {currentCampus && currentCampus !== '全部神殿' && (
              <Tag color="blue">{currentCampus}</Tag>
            )}
          </Space>
        }
        extra={
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
              allowClear
              format="YYYY-MM-DD"
              presets={[
                { label: '今天', value: [dayjs(), dayjs()] },
                { label: '本周', value: [dayjs().startOf('week'), dayjs()] },
                { label: '本月', value: [dayjs().startOf('month'), dayjs()] },
                { label: '上月', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
                { label: '近3个月', value: [dayjs().subtract(3, 'month'), dayjs()] },
              ]}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
            >
              刷新
            </Button>
          </Space>
        }
      >
        {/* 统计卡片 */}
        {renderStatCards()}

        <Divider style={{ margin: '16px 0' }} />

        {/* TAB导航 - 模拟Excel风格 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
          size="small"
          style={{ marginBottom: 16 }}
        />

        {/* 当前TAB说明 */}
        {currentTabInfo && (
          <div style={{ marginBottom: 16, padding: '8px 12px', background: '#f5f5f5', borderRadius: 4 }}>
            <Text type="secondary">
              <FileExcelOutlined style={{ marginRight: 8 }} />
              {currentTabInfo.description}
              {' · '}
              共 <Text strong style={{ color: currentTabInfo.color }}>{getTabCount(activeTab)}</Text> 条记录
            </Text>
          </div>
        )}

        {/* 数据表格 */}
        <Table
          loading={tabLoading}
          columns={getColumns()}
          dataSource={tabData}
          rowKey={(record) => record.记录ID || record.id}
          bordered
          tableLayout="auto"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSizeOptions: ['20', '50', '100', '200'],
          }}
          onChange={handleTableChange}
          size="small"
        />
      </Card>
    </Spin>
  )
}

export default ConsultationStats
