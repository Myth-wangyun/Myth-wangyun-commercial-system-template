/**
 * 百度一站式多渠道报告 API 测试页面
 */
import React, { useState, useCallback } from 'react'
import { App,
  Card,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Checkbox,
  Table,
  Space,
  Alert,
  Typography,
  Divider,
  Spin,
  Tag,
  Descriptions,
} from 'antd'
import {
  SearchOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { RangePicker } = DatePicker
const { TextArea } = Input

// API基础地址
const getBaseUrl = () => {
  // 从当前页面URL推断API地址，或使用默认值
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:8000/api/v1/baidu-marketing'
  }
  return `${window.location.protocol}//${window.location.hostname}:8000/api/v1/baidu-marketing`
}

// 产品渠道映射
const PRODUCT_MAP: Record<number, string> = {
  0: '搜索推广',
  1: '信息流推广',
  3: '阿拉丁推广',
  4: '知识营销',
}

// 时间粒度选项
const TIME_UNIT_OPTIONS = [
  { value: 'DAY', label: '按天 (DAY)' },
  { value: 'HOUR', label: '按小时 (HOUR)' },
  { value: 'WEEK', label: '按周 (WEEK)' },
  { value: 'MONTH', label: '按月 (MONTH)' },
  { value: 'SUMMARY', label: '汇总 (SUMMARY)' },
]

// 字段选项
const COLUMN_OPTIONS = [
  { value: 'product', label: '渠道 (product)' },
  { value: 'date', label: '日期 (date)' },
  { value: 'impression', label: '展现 (impression)' },
  { value: 'click', label: '点击 (click)' },
  { value: 'cost', label: '消费 (cost)' },
  { value: 'ctr', label: '点击率 (ctr)' },
  { value: 'cpc', label: '平均点击价格 (cpc)' },
]

interface TokenInfo {
  user_id: number
  user_name: string
  expires_at?: string
}

interface ReportRow {
  product?: number
  date?: string
  impression?: number
  click?: number
  cost?: number
  ctr?: number
  cpc?: number
}

interface ApiResponse<T = unknown> {
  code: number
  message: string
  data?: T
}

const BaiduApiTest: React.FC = () => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [reportData, setReportData] = useState<ReportRow[]>([])
  const [responseJson, setResponseJson] = useState<string>('')
  const [requestJson, setRequestJson] = useState<string>('')
  const [authUrl, setAuthUrl] = useState<string>('')
  const [error, setError] = useState<string>('')

  // 通用请求函数
  const makeRequest = useCallback(async <T,>(
    url: string,
    method: 'GET' | 'POST' = 'GET',
    body?: object
  ): Promise<ApiResponse<T> | null> => {
    setLoading(true)
    setError('')
    
    if (body) {
      setRequestJson(JSON.stringify(body, null, 2))
    }

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      if (body) {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(url, options)
      const data = await response.json()
      
      setResponseJson(JSON.stringify(data, null, 2))

      if (!response.ok) {
        setError(`HTTP错误: ${response.status}`)
        return null
      }

      return data as ApiResponse<T>
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '请求失败'
      setError(errorMsg)
      setResponseJson(JSON.stringify({ error: errorMsg }, null, 2))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // 检查授权状态
  const checkTokens = useCallback(async () => {
    const baseUrl = form.getFieldValue('baseUrl') || getBaseUrl()
    const result = await makeRequest<TokenInfo[]>(`${baseUrl}/tokens`)
    
    if (result?.code === 0 && result.data) {
      setTokens(result.data)
      if (result.data.length > 0) {
        message.success(`已授权 ${result.data.length} 个用户`)
        // 自动填充第一个用户信息
        const firstToken = result.data[0]
        form.setFieldsValue({
          userId: firstToken.user_id,
          userName: firstToken.user_name,
        })
      } else {
        message.warning('没有已授权的用户，请先生成授权链接')
      }
    }
  }, [form, makeRequest])

  // 生成授权链接
  const generateAuthUrl = useCallback(async () => {
    const baseUrl = form.getFieldValue('baseUrl') || getBaseUrl()
    const result = await makeRequest<{ auth_url: string }>(
      `${baseUrl}/auth/generate-url`,
      'POST',
      { scope: '1007690', state: `test_${Date.now()}` }
    )

    if (result?.code === 0 && result.data?.auth_url) {
      setAuthUrl(result.data.auth_url)
      message.success('授权链接已生成')
    }
  }, [form, makeRequest])

  // 复制授权链接
  const copyAuthUrl = useCallback(() => {
    if (authUrl) {
      navigator.clipboard.writeText(authUrl)
      message.success('链接已复制到剪贴板')
    }
  }, [authUrl])

  // 查询多渠道报告
  const queryMultiChannelReport = useCallback(async () => {
    const values = form.getFieldsValue()
    const baseUrl = values.baseUrl || getBaseUrl()
    
    if (!values.userName) {
      message.error('请先填写用户名')
      return
    }

    const [startDate, endDate] = values.dateRange || []
    if (!startDate || !endDate) {
      message.error('请选择日期范围')
      return
    }

    const body = {
      user_name: values.userName,
      user_id: values.userId,
      start_date: startDate.format('YYYY-MM-DD'),
      end_date: endDate.format('YYYY-MM-DD'),
      time_unit: values.timeUnit || 'DAY',
      columns: values.columns || ['product', 'date', 'cost', 'impression', 'click'],
      products: values.products || [0, 1],
      start_row: 0,
      row_count: 200,
      need_sum: false,
    }

    const result = await makeRequest<{ rows: ReportRow[]; totalRowCount: number }>(
      `${baseUrl}/api/report/multi-channel`,
      'POST',
      body
    )

    if (result?.code === 0 && result.data?.rows) {
      setReportData(result.data.rows)
      message.success(`获取到 ${result.data.rows.length} 条数据`)
    }
  }, [form, makeRequest])

  // 快捷查询：每日展点消
  const queryDailyReport = useCallback(async () => {
    const values = form.getFieldsValue()
    const baseUrl = values.baseUrl || getBaseUrl()
    
    if (!values.userName) {
      message.error('请先填写用户名')
      return
    }

    const [startDate, endDate] = values.dateRange || []
    if (!startDate || !endDate) {
      message.error('请选择日期范围')
      return
    }

    const body = {
      user_name: values.userName,
      user_id: values.userId,
      start_date: startDate.format('YYYY-MM-DD'),
      end_date: endDate.format('YYYY-MM-DD'),
      products: values.products || [0, 1],
    }

    const result = await makeRequest<{ rows: ReportRow[] }>(
      `${baseUrl}/api/report/daily-cost`,
      'POST',
      body
    )

    if (result?.code === 0 && result.data?.rows) {
      setReportData(result.data.rows)
      message.success(`获取到 ${result.data.rows.length} 条数据`)
    }
  }, [form, makeRequest])

  // 快捷查询：汇总
  const querySummaryReport = useCallback(async () => {
    const values = form.getFieldsValue()
    const baseUrl = values.baseUrl || getBaseUrl()
    
    if (!values.userName) {
      message.error('请先填写用户名')
      return
    }

    const [startDate, endDate] = values.dateRange || []
    if (!startDate || !endDate) {
      message.error('请选择日期范围')
      return
    }

    const body = {
      user_name: values.userName,
      user_id: values.userId,
      start_date: startDate.format('YYYY-MM-DD'),
      end_date: endDate.format('YYYY-MM-DD'),
      products: values.products || [0, 1],
    }

    const result = await makeRequest<{ rows: ReportRow[] }>(
      `${baseUrl}/api/report/summary-cost`,
      'POST',
      body
    )

    if (result?.code === 0 && result.data?.rows) {
      setReportData(result.data.rows)
      message.success(`获取到 ${result.data.rows.length} 条数据`)
    }
  }, [form, makeRequest])

  // 表格列配置
  const tableColumns = [
    {
      title: '渠道',
      dataIndex: 'product',
      key: 'product',
      render: (val: number) => (
        <Tag color={val === 0 ? 'blue' : val === 1 ? 'green' : 'orange'}>
          {PRODUCT_MAP[val] || val}
        </Tag>
      ),
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '展现',
      dataIndex: 'impression',
      key: 'impression',
      render: (val: number) => val?.toLocaleString() || '-',
    },
    {
      title: '点击',
      dataIndex: 'click',
      key: 'click',
      render: (val: number) => val?.toLocaleString() || '-',
    },
    {
      title: '消费',
      dataIndex: 'cost',
      key: 'cost',
      render: (val: number) => (val !== undefined ? `¥${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'),
    },
    {
      title: '点击率',
      dataIndex: 'ctr',
      key: 'ctr',
      render: (val: number) => (val !== undefined ? `${(val * 100).toFixed(2)}%` : '-'),
    },
    {
      title: '平均点击价格',
      dataIndex: 'cpc',
      key: 'cpc',
      render: (val: number) => (val !== undefined ? `¥${val.toFixed(2)}` : '-'),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>🔍 百度一站式多渠道报告 API 测试</Title>
      
      <Alert
        message="提示"
        description="请先完成OAuth授权，才能调用报告接口。如果还未授权，请先点击「生成授权链接」获取授权URL。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Spin spinning={loading}>
        {/* 基础配置 */}
        <Card title="⚙️ 基础配置" style={{ marginBottom: 16 }}>
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              baseUrl: getBaseUrl(),
              userId: 22939007,
              userName: '',
              timeUnit: 'DAY',
              columns: ['product', 'date', 'cost', 'impression', 'click'],
              products: [0, 1],
              dateRange: [dayjs().subtract(7, 'day'), dayjs()],
            }}
          >
            <Form.Item label="API 基础地址" name="baseUrl">
              <Input placeholder="http://localhost:8000/api/v1/baidu-marketing" />
            </Form.Item>

            <Space size="large" wrap>
              <Form.Item label="用户ID" name="userId" style={{ width: 200 }}>
                <Input type="number" placeholder="用户ID" />
              </Form.Item>
              
              <Form.Item label="用户名" name="userName" style={{ width: 300 }}>
                <Input placeholder="推广账户名称" />
              </Form.Item>
            </Space>

            <Space style={{ marginTop: 16 }}>
              <Button 
                type="primary" 
                icon={<CheckCircleOutlined />}
                onClick={checkTokens}
              >
                检查授权状态
              </Button>
              <Button 
                icon={<LinkOutlined />}
                onClick={generateAuthUrl}
              >
                生成授权链接
              </Button>
            </Space>

            {/* 已授权用户列表 */}
            {tokens.length > 0 && (
              <Descriptions 
                title="已授权用户" 
                style={{ marginTop: 16 }}
                column={3}
                bordered
                size="small"
              >
                {tokens.map((token) => (
                  <Descriptions.Item 
                    key={token.user_id} 
                    label={token.user_name}
                  >
                    ID: {token.user_id}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            )}

            {/* 授权链接 */}
            {authUrl && (
              <Alert
                message="授权链接已生成"
                description={
                  <div>
                    <Paragraph copyable style={{ marginBottom: 8 }}>
                      {authUrl}
                    </Paragraph>
                    <Button size="small" onClick={copyAuthUrl}>
                      复制链接
                    </Button>
                  </div>
                }
                type="success"
                style={{ marginTop: 16 }}
              />
            )}
          </Form>
        </Card>

        {/* 报告查询 */}
        <Card title="📊 一站式多渠道报告查询" style={{ marginBottom: 16 }}>
          <Form form={form} layout="vertical">
            <Space size="large" wrap>
              <Form.Item label="日期范围" name="dateRange">
                <RangePicker />
              </Form.Item>

              <Form.Item label="时间粒度" name="timeUnit" style={{ width: 180 }}>
                <Select options={TIME_UNIT_OPTIONS} />
              </Form.Item>
            </Space>

            <Form.Item label="投放渠道" name="products">
              <Checkbox.Group>
                <Checkbox value={0}>搜索推广 (0)</Checkbox>
                <Checkbox value={1}>信息流推广 (1)</Checkbox>
                <Checkbox value={3}>阿拉丁推广 (3)</Checkbox>
                <Checkbox value={4}>知识营销 (4)</Checkbox>
              </Checkbox.Group>
            </Form.Item>

            <Form.Item label="返回字段" name="columns">
              <Checkbox.Group options={COLUMN_OPTIONS} />
            </Form.Item>

            <Space>
              <Button 
                type="primary" 
                icon={<SearchOutlined />}
                onClick={queryMultiChannelReport}
              >
                查询多渠道报告
              </Button>
              <Button onClick={queryDailyReport}>
                每日展点消
              </Button>
              <Button onClick={querySummaryReport}>
                时间段汇总
              </Button>
            </Space>
          </Form>
        </Card>

        {/* 错误提示 */}
        {error && (
          <Alert
            message="请求失败"
            description={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 数据表格 */}
        {reportData.length > 0 && (
          <Card title="📈 数据结果" style={{ marginBottom: 16 }}>
            <Table
              dataSource={reportData}
              columns={tableColumns}
              rowKey={(record, index) => `${record.date}-${record.product}-${index}`}
              size="small"
              pagination={{ pageSize: 20 }}
              scroll={{ x: 800 }}
            />
          </Card>
        )}

        {/* 响应详情 */}
        <Card title="📋 请求/响应详情" style={{ marginBottom: 16 }}>
          <Title level={5}>请求体 (Request Body)</Title>
          <TextArea
            value={requestJson}
            readOnly
            autoSize={{ minRows: 3, maxRows: 10 }}
            style={{ fontFamily: 'monospace', marginBottom: 16 }}
          />
          
          <Title level={5}>响应数据 (Response)</Title>
          <TextArea
            value={responseJson}
            readOnly
            autoSize={{ minRows: 5, maxRows: 15 }}
            style={{ fontFamily: 'monospace' }}
          />
        </Card>
      </Spin>
    </div>
  )
}

export default BaiduApiTest
