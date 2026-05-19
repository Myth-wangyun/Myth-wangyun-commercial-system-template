import React, { useState, useEffect } from 'react'
import { App,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Button,
  Table,
  Space,
  DatePicker,
  Select,
  Modal,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SearchOutlined,
  CalendarOutlined,
  DollarOutlined,
  AimOutlined,
  MessageOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { marketMockService } from '@/services/mock/marketMock'
import MarketDailyForm from '../../components/forms/MarketDailyForm'
import type {
  MarketDailyRecord,
  MarketStats,
  CreateMarketDailyRequest,
  UpdateMarketDailyRequest,
  MarketQueryParams,
} from '@/types/market'
import { MEDIA_SOURCE_OPTIONS } from '@/types/market'
import { marketUtils } from '@/services/market/market'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const MarketDaily: React.FC = () => {
  const { message, modal } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<MarketDailyRecord[]>([])
  const [stats, setStats] = useState<MarketStats | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [formVisible, setFormVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MarketDailyRecord | null>(null)
  const [queryParams, setQueryParams] = useState<MarketQueryParams>({})

  // 加载数据
  const loadData = async (params: MarketQueryParams = {}) => {
    setLoading(true)
    try {
      const query = { ...queryParams, ...params }
      const response = await marketMockService.daily.getList(query, currentCampus || undefined)
      const statsResponse = await marketMockService.stats.getMarketStats(
        query,
        currentCampus || undefined,
      )

      setData(response.data.list)
      setStats(statsResponse.data)
      setPagination({
        current: response.data.page,
        pageSize: response.data.pageSize,
        total: response.data.total,
      })
      setQueryParams(query)
    } catch (error) {
      message.error('加载数据失败')
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentCampus])

  // 处理新增记录
  const handleAdd = () => {
    setEditingRecord(null)
    setFormVisible(true)
  }

  // 处理编辑记录
  const handleEdit = (record: MarketDailyRecord) => {
    setEditingRecord(record)
    setFormVisible(true)
  }

  // 处理删除记录
  const handleDelete = (record: MarketDailyRecord) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除 ${record.date} ${record.mediaSource} 的投放数据吗？`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await marketMockService.daily.delete(record.id, currentCampus || undefined)
          message.success('删除成功')
          loadData()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  // 处理表单提交
  const handleFormSubmit = async (values: CreateMarketDailyRequest) => {
    try {
      if (editingRecord) {
        const updateData: UpdateMarketDailyRequest = {
          id: editingRecord.id,
          ...values,
        }
        await marketMockService.daily.update(updateData, currentCampus || undefined)
        message.success('更新成功')
      } else {
        await marketMockService.daily.create(values, currentCampus || undefined)
        message.success('保存成功')
      }
      setFormVisible(false)
      loadData()
    } catch (error) {
      message.error(editingRecord ? '更新失败' : '保存失败')
    }
  }

  // 处理搜索
  const handleSearch = (values: any) => {
    const params: MarketQueryParams = {
      page: 1,
      pageSize: pagination.pageSize,
    }

    if (values.dateRange && values.dateRange.length === 2) {
      params.startDate = values.dateRange[0].format('YYYY-MM-DD')
      params.endDate = values.dateRange[1].format('YYYY-MM-DD')
    }

    if (values.mediaSource) {
      params.mediaSource = values.mediaSource
    }

    loadData(params)
  }

  // 处理表格分页
  const handleTableChange = (pagination: any) => {
    loadData({
      ...queryParams,
      page: pagination.current,
      pageSize: pagination.pageSize,
    })
  }

  // 处理导出
  const handleExport = () => {
    message.info('导出功能开发中...')
  }

  // 表格列定义
  const columns: ColumnsType<MarketDailyRecord> = [
    {
      title: '序号',
      key: 'index',
      width: 80,
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      sorter: true,
    },
    {
      title: '媒体来源',
      dataIndex: 'mediaSource',
      key: 'mediaSource',
      width: 120,
      filters: MEDIA_SOURCE_OPTIONS.map((option) => ({
        text: option.label,
        value: option.value,
      })),
    },
    {
      title: '消费金额(元)',
      dataIndex: 'spend',
      key: 'spend',
      width: 120,
      sorter: true,
      render: (value: number) => marketUtils.formatCurrency(value),
    },
    {
      title: '展现量',
      dataIndex: 'impressions',
      key: 'impressions',
      width: 100,
      sorter: true,
      render: (value: number) => marketUtils.formatNumber(value),
    },
    {
      title: '点击量',
      dataIndex: 'clicks',
      key: 'clicks',
      width: 100,
      sorter: true,
      render: (value: number) => marketUtils.formatNumber(value),
    },
    {
      title: 'IP数量',
      dataIndex: 'ip',
      key: 'ip',
      width: 100,
      sorter: true,
      render: (value: number) => marketUtils.formatNumber(value),
    },
    {
      title: 'PV数量',
      dataIndex: 'pv',
      key: 'pv',
      width: 100,
      sorter: true,
      render: (value: number) => marketUtils.formatNumber(value),
    },
    {
      title: '对话量',
      dataIndex: 'dialogues',
      key: 'dialogues',
      width: 100,
      sorter: true,
      render: (value: number) => marketUtils.formatNumber(value),
    },
    {
      title: '有效对话',
      dataIndex: 'validDialogues',
      key: 'validDialogues',
      width: 100,
      sorter: true,
      render: (value: number) => marketUtils.formatNumber(value),
    },
    {
      title: '咨询量',
      dataIndex: 'leads',
      key: 'leads',
      width: 100,
      sorter: true,
      render: (value: number) => marketUtils.formatNumber(value),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* 页面标题和操作按钮 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          日投放数据登记
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => loadData()}>
            刷新
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出Excel
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增记录
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="总记录数"
              value={stats?.totalRecords || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card success">
            <Statistic
              title="总消费金额"
              value={stats?.totalSpend || 0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: 'white' }}
              formatter={(value) => marketUtils.formatCurrency(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card warning">
            <Statistic
              title="总点击量"
              value={stats?.totalClicks || 0}
              prefix={<AimOutlined />}
              valueStyle={{ color: 'white' }}
              formatter={(value) => marketUtils.formatNumber(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card purple">
            <Statistic
              title="总对话量"
              value={stats?.totalConversations || 0}
              prefix={<MessageOutlined />}
              valueStyle={{ color: 'white' }}
              formatter={(value) => marketUtils.formatNumber(Number(value))}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索筛选 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Text strong>日期范围：</Text>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
              onChange={(dates) => {
                if (dates) {
                  handleSearch({
                    dateRange: dates,
                    mediaSource: queryParams.mediaSource,
                  })
                }
              }}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Text strong>媒体来源：</Text>
            <Select
              style={{ width: '100%' }}
              placeholder="请选择媒体来源"
              allowClear
              onChange={(value) => {
                handleSearch({
                  dateRange:
                    queryParams.startDate && queryParams.endDate
                      ? [dayjs(queryParams.startDate), dayjs(queryParams.endDate)]
                      : undefined,
                  mediaSource: value,
                })
              }}
            >
              {MEDIA_SOURCE_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => loadData()}
              style={{ width: '100%' }}
            >
              搜索
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>

      {/* 表单模态框 */}
      <Modal
        title={editingRecord ? '编辑投放数据' : '新增投放数据'}
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <MarketDailyForm
          initialValues={editingRecord || undefined}
          onSubmit={handleFormSubmit}
          mode={editingRecord ? 'edit' : 'create'}
        />
      </Modal>
    </div>
  )
}

export default MarketDaily
