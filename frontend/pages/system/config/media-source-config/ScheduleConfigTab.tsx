/**
 * 咨询量计算时段配置组件
 * 管理冬季/夏季作息时间及对应的咨询量截止计算规则
 */

import React, { useEffect, useState, useCallback } from 'react'
import { App,
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Tag,
  Popconfirm,
  Switch,
  Alert,
  Descriptions,
  Spin,
  Typography,
  Divider,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { api } from '@/services/api'

const { Text, Title } = Typography

interface ScheduleConfig {
  id: number
  period_name: string
  period_start: string
  period_end: string
  cutoff_hour: number
  cutoff_minute: number
  cutoff_display: string
  description?: string
  is_active: boolean
}

interface CutoffInfo {
  target_date: string
  cutoff_time: string | null
  period_name: string | null
  query_start: string
  query_end: string
  has_config: boolean
}

const ScheduleConfigTab: React.FC = () => {
  const { message } = App.useApp()
  const [configs, setConfigs] = useState<ScheduleConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ScheduleConfig | null>(null)
  const [cutoffInfo, setCutoffInfo] = useState<CutoffInfo | null>(null)
  const [cutoffLoading, setCutoffLoading] = useState(false)
  const [initYear, setInitYear] = useState<number>(new Date().getFullYear())
  const [form] = Form.useForm()

  const loadConfigs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/config/consultation-schedule-config/list')
      setConfigs(res.data || [])
    } catch (err: any) {
      message.error('加载配置失败: ' + (err?.response?.data?.detail || err.message))
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCutoffInfo = useCallback(async () => {
    setCutoffLoading(true)
    try {
      const today = dayjs().format('YYYY-MM-DD')
      const res = await api.get('/config/consultation-schedule-config/cutoff-info', {
        params: { target_date: today }
      })
      setCutoffInfo(res.data)
    } catch {
      // 静默处理
    } finally {
      setCutoffLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfigs()
    loadCutoffInfo()
  }, [loadConfigs, loadCutoffInfo])

  const handleCreate = () => {
    setEditingConfig(null)
    form.resetFields()
    form.setFieldsValue({
      period_name: '冬季',
      cutoff_hour: 17,
      cutoff_minute: 30,
      is_active: true,
    })
    setModalVisible(true)
  }

  const handleEdit = (record: ScheduleConfig) => {
    setEditingConfig(record)
    form.setFieldsValue({
      period_name: record.period_name,
      period_start: dayjs(record.period_start),
      period_end: dayjs(record.period_end),
      cutoff_hour: record.cutoff_hour,
      cutoff_minute: record.cutoff_minute,
      description: record.description,
      is_active: record.is_active,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/config/consultation-schedule-config/delete/${id}`)
      message.success('删除成功')
      loadConfigs()
      loadCutoffInfo()
    } catch (err: any) {
      message.error('删除失败: ' + (err?.response?.data?.detail || err.message))
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        period_start: values.period_start.format('YYYY-MM-DD'),
        period_end: values.period_end.format('YYYY-MM-DD'),
      }

      if (editingConfig) {
        await api.put(`/config/consultation-schedule-config/update/${editingConfig.id}`, payload)
        message.success('更新成功')
      } else {
        await api.post('/config/consultation-schedule-config/create', payload)
        message.success('创建成功')
      }

      setModalVisible(false)
      loadConfigs()
      loadCutoffInfo()
    } catch (err: any) {
      if (err?.response?.data?.detail) {
        message.error(err.response.data.detail)
      }
    }
  }

  const handleInitYear = async () => {
    try {
      const res = await api.post('/config/consultation-schedule-config/init-year', {
        year: initYear,
      })
      message.success(res.data?.message || '初始化成功')
      loadConfigs()
      loadCutoffInfo()
    } catch (err: any) {
      message.error(err?.response?.data?.detail || '初始化失败')
    }
  }

  const columns: ColumnsType<ScheduleConfig> = [
    {
      title: '时段名称',
      dataIndex: 'period_name',
      width: 100,
      render: (text) => (
        <Tag color={text === '夏季' ? 'orange' : 'blue'} icon={<ClockCircleOutlined />}>
          {text}
        </Tag>
      ),
    },
    {
      title: '开始日期',
      dataIndex: 'period_start',
      width: 120,
      render: (text) => dayjs(text).format('YYYY-MM-DD'),
    },
    {
      title: '结束日期',
      dataIndex: 'period_end',
      width: 120,
      render: (text) => dayjs(text).format('YYYY-MM-DD'),
    },
    {
      title: '截止时间',
      dataIndex: 'cutoff_display',
      width: 100,
      render: (text) => (
        <Tag color="red" style={{ fontSize: 14, fontWeight: 'bold' }}>
          {text}
        </Tag>
      ),
    },
    {
      title: '说明',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 80,
      render: (active) => (
        <Tag color={active ? 'green' : 'default'}>
          {active ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      width: 130,
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
          <Popconfirm
            title="确认删除此配置？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Alert
        message="咨询量计算时间配置"
        description={
          <div>
            <p>通过此配置管理不同时段的咨询量计算截止时间。截止时间之后录入的咨询量将计入<b>第二天</b>的统计。</p>
            <p>
              <b>默认规则：</b>冬季（10月1日~次年4月30日）截止时间 17:30 | 夏季（5月1日~9月30日）截止时间 18:00
            </p>
            <p>例如冬季：1月15日17:30之后到1月16日17:30之前的咨询量，算作1月16日的咨询量。</p>
          </div>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 16 }}
      />

      {/* 当前截止信息 */}
      {cutoffInfo && (
        <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
          <Spin spinning={cutoffLoading}>
            <Descriptions title="今日截止信息" size="small" column={4}>
              <Descriptions.Item label="当前日期">{cutoffInfo.target_date}</Descriptions.Item>
              <Descriptions.Item label="所属时段">
                {cutoffInfo.period_name ? (
                  <Tag color={cutoffInfo.period_name === '夏季' ? 'orange' : 'blue'}>
                    {cutoffInfo.period_name}
                  </Tag>
                ) : (
                  <Text type="secondary">未配置</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="截止时间">
                {cutoffInfo.cutoff_time ? (
                  <Tag color="red" style={{ fontWeight: 'bold' }}>
                    {cutoffInfo.cutoff_time}
                  </Tag>
                ) : (
                  <Text type="secondary">默认（23:59）</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="今日查询区间">
                <Text code>
                  {dayjs(cutoffInfo.query_start).format('MM-DD HH:mm')} ~ {dayjs(cutoffInfo.query_end).format('MM-DD HH:mm')}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Spin>
        </Card>
      )}

      {/* 操作区 */}
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新增时段
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => { loadConfigs(); loadCutoffInfo() }}>
          刷新
        </Button>
        <Divider type="vertical" />
        <Text>一键初始化年份:</Text>
        <InputNumber
          value={initYear}
          onChange={(v) => v && setInitYear(v)}
          min={2020}
          max={2100}
          style={{ width: 100 }}
        />
        <Popconfirm
          title={`确认为 ${initYear} 年生成默认配置？`}
          description="将创建冬季（1-4月 17:30）、夏季（5-9月 18:00）、冬季（10-12月 17:30）三条记录"
          onConfirm={handleInitYear}
        >
          <Button icon={<ThunderboltOutlined />} type="dashed">
            初始化 {initYear}
          </Button>
        </Popconfirm>
      </Space>

      {/* 配置列表 */}
      <Table
        loading={loading}
        dataSource={configs}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
      />

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingConfig ? '编辑时段配置' : '新增时段配置'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="period_name"
            label="时段名称"
            rules={[{ required: true, message: '请选择时段名称' }]}
          >
            <Select>
              <Select.Option value="冬季">冬季</Select.Option>
              <Select.Option value="夏季">夏季</Select.Option>
            </Select>
          </Form.Item>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="period_start"
              label="开始日期"
              rules={[{ required: true, message: '请选择开始日期' }]}
            >
              <DatePicker style={{ width: 180 }} />
            </Form.Item>

            <Form.Item
              name="period_end"
              label="结束日期"
              rules={[{ required: true, message: '请选择结束日期' }]}
            >
              <DatePicker style={{ width: 180 }} />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="cutoff_hour"
              label="截止小时"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} max={23} style={{ width: 100 }} />
            </Form.Item>

            <Form.Item
              name="cutoff_minute"
              label="截止分钟"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} max={59} style={{ width: 100 }} />
            </Form.Item>
          </Space>

          <Form.Item name="description" label="描述说明">
            <Input.TextArea rows={2} placeholder="可选" />
          </Form.Item>

          <Form.Item name="is_active" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ScheduleConfigTab
