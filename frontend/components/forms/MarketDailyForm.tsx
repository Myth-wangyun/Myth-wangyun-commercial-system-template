import React, { useEffect } from 'react'
import { Form, Input, Select, DatePicker, Button, Row, Col, Space } from 'antd'
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons'
import type { MarketDailyRecord, CreateMarketDailyRequest } from '@/types/market'
import { MEDIA_SOURCE_OPTIONS, DEFAULT_MARKET_DAILY_RECORD } from '@/types/market'
import dayjs from 'dayjs'

const { Option } = Select

interface MarketDailyFormProps {
  initialValues?: Partial<MarketDailyRecord>
  onSubmit: (values: CreateMarketDailyRequest) => void
  onReset?: () => void
  loading?: boolean
  mode?: 'create' | 'edit'
}

const MarketDailyForm: React.FC<MarketDailyFormProps> = ({
  initialValues,
  onSubmit,
  onReset,
  loading = false,
  mode = 'create',
}) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (initialValues) {
      const formValues = {
        ...initialValues,
        date: initialValues.date ? dayjs(initialValues.date) : undefined,
      }
      form.setFieldsValue(formValues)
    } else if (mode === 'create') {
      form.setFieldsValue(DEFAULT_MARKET_DAILY_RECORD)
    }
  }, [initialValues, form, mode])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const submitData: CreateMarketDailyRequest = {
        date: values.date.format('YYYY-MM-DD'),
        mediaSource: values.mediaSource,
        spend: values.spend,
        impressions: values.impressions || 0,
        clicks: values.clicks || 0,
        ip: values.ip || 0,
        pv: values.pv || 0,
        dialogues: values.dialogues || 0,
        validDialogues: values.validDialogues || 0,
        leads: values.leads || 0,
      }
      onSubmit(submitData)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleReset = () => {
    form.resetFields()
    if (mode === 'create') {
      form.setFieldsValue(DEFAULT_MARKET_DAILY_RECORD)
    }
    onReset?.()
  }

  return (
    <Form form={form} layout="vertical" size="large" onFinish={handleSubmit}>
      <Row gutter={[16, 16]}>
        {/* 日期 */}
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="date" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker
              style={{ width: '100%' }}
              placeholder="请选择日期"
              format="YYYY-MM-DD"
              disabledDate={(current) => current && current > dayjs().endOf('day')}
            />
          </Form.Item>
        </Col>

        {/* 媒体来源 */}
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            name="mediaSource"
            label="媒体来源"
            rules={[{ required: true, message: '请选择媒体来源' }]}
          >
            <Select placeholder="请选择媒体来源">
              {MEDIA_SOURCE_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        {/* 消费金额 */}
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            name="spend"
            label="消费金额(元)"
            rules={[
              { required: true, message: '请输入消费金额' },
              { type: 'number', min: 0, message: '消费金额不能小于0' },
            ]}
          >
            <Input type="number" placeholder="请输入消费金额" step="0.01" min="0" />
          </Form.Item>
        </Col>

        {/* 展现量 */}
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            name="impressions"
            label="展现量"
            rules={[{ type: 'number', min: 0, message: '展现量不能小于0' }]}
          >
            <Input type="number" placeholder="请输入展现量" min="0" />
          </Form.Item>
        </Col>

        {/* 点击量 */}
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            name="clicks"
            label="点击量"
            rules={[{ type: 'number', min: 0, message: '点击量不能小于0' }]}
          >
            <Input type="number" placeholder="请输入点击量" min="0" />
          </Form.Item>
        </Col>

        {/* IP数量 */}
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            name="ip"
            label="IP数量"
            rules={[{ type: 'number', min: 0, message: 'IP数量不能小于0' }]}
          >
            <Input type="number" placeholder="请输入IP数量" min="0" />
          </Form.Item>
        </Col>

        {/* PV数量 */}
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            name="pv"
            label="PV数量"
            rules={[{ type: 'number', min: 0, message: 'PV数量不能小于0' }]}
          >
            <Input type="number" placeholder="请输入PV数量" min="0" />
          </Form.Item>
        </Col>

        {/* 对话量 */}
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            name="dialogues"
            label="对话量"
            rules={[{ type: 'number', min: 0, message: '对话量不能小于0' }]}
          >
            <Input type="number" placeholder="请输入对话量" min="0" />
          </Form.Item>
        </Col>

        {/* 有效对话 */}
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            name="validDialogues"
            label="有效对话"
            rules={[{ type: 'number', min: 0, message: '有效对话不能小于0' }]}
          >
            <Input type="number" placeholder="请输入有效对话" min="0" />
          </Form.Item>
        </Col>

        {/* 咨询量 */}
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            name="leads"
            label="咨询量"
            rules={[{ type: 'number', min: 0, message: '咨询量不能小于0' }]}
          >
            <Input type="number" placeholder="请输入咨询量" min="0" />
          </Form.Item>
        </Col>
      </Row>

      {/* 操作按钮 */}
      <Row justify="center" style={{ marginTop: 24 }}>
        <Col>
          <Space size="middle">
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              size="large"
            >
              {mode === 'create' ? '保存数据' : '更新数据'}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset} size="large">
              重置表单
            </Button>
          </Space>
        </Col>
      </Row>
    </Form>
  )
}

export default MarketDailyForm
