/**
 * 咨询沟通记录内联表单组件
 * 直接在页面内容区域展示，替代 Modal 弹窗
 * 咨询内容/咨询结果文本框更大且自适应高度
 */

import React, { useEffect } from 'react'
import {
  App,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Switch,
  Row,
  Col,
  Divider,
  Tag,
  Card,
  Button,
  Space,
} from 'antd'
import { SaveOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { CommunicationRecord, CreateCommunicationRequest } from './phoneStatsApi'
import * as api from './phoneStatsApi'

const { TextArea } = Input
const { Option } = Select

interface InlineCommunicationRecordFormProps {
  onClose: () => void
  onSuccess: () => void
  记录ID: number
  editingRecord?: CommunicationRecord | null
  登记日期?: string | null
}

export default function InlineCommunicationRecordForm({
  onClose,
  onSuccess,
  记录ID,
  editingRecord,
  登记日期,
}: InlineCommunicationRecordFormProps) {
  const { notification } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = React.useState(false)

  const isEdit = !!editingRecord

  useEffect(() => {
    if (editingRecord) {
      form.setFieldsValue({
        ...editingRecord,
        沟通时间: dayjs(),
        预定回访时间: editingRecord.预定回访时间 ? dayjs(editingRecord.预定回访时间) : null,
        有需求: editingRecord.有需求 === 1,
        有钱: editingRecord.有钱 === 1,
        有时间: editingRecord.有时间 === 1,
        有支持: editingRecord.有支持 === 1,
        联系不上: editingRecord.联系不上 === 1,
      })
    } else {
      form.resetFields()
      form.setFieldsValue({
        沟通时间: dayjs(),
        沟通方式: '电话',
        用时: 0,
      })
    }
  }, [editingRecord])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const submitData: CreateCommunicationRequest = {
        记录ID,
        沟通时间: values.沟通时间.format('YYYY-MM-DD HH:mm:ss'),
        用时: values.用时 || 0,
        咨询师: values.咨询师,
        沟通方式: values.沟通方式,
        需求点: values.需求点,
        关注点: values.关注点,
        抗拒点: values.抗拒点,
        咨询内容: values.咨询内容,
        咨询结果: values.咨询结果,
        报名意愿: values.报名意愿,
        有需求: values.有需求 ? 1 : 0,
        有钱: values.有钱 ? 1 : 0,
        有时间: values.有时间 ? 1 : 0,
        有支持: values.有支持 ? 1 : 0,
        具备条件: values.具备条件,
        课程意向: values.课程意向,
        联系不上: values.联系不上 ? 1 : 0,
        预定回访时间: values.预定回访时间?.format('YYYY-MM-DD HH:mm:ss'),
      }

      if (isEdit && editingRecord) {
        await api.updateCommunicationRecord(editingRecord.沟通ID, submitData)
        notification.success({ message: '已保存', description: '沟通记录更新成功', placement: 'topRight', duration: 3 })
      } else {
        await api.createCommunicationRecord(submitData)
        notification.success({ message: '已创建', description: '沟通记录创建成功', placement: 'topRight', duration: 3 })
      }

      onSuccess()
    } catch (error: any) {
      if (error?.response?.data?.detail) {
        notification.error({ message: '保存失败', description: error.response.data.detail, placement: 'topRight', duration: 4 })
      } else if (error?.message) {
        notification.error({ message: '保存失败', description: error.message, placement: 'topRight', duration: 4 })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      size="small"
      title={isEdit ? '编辑沟通记录' : '新增沟通记录'}
      extra={
        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            onClick={handleSubmit}
          >
            {isEdit ? '更新' : '保存'}
          </Button>
          <Button icon={<CloseOutlined />} onClick={onClose}>
            取消
          </Button>
        </Space>
      }
      style={{ marginTop: 16, border: '1px solid #1677ff' }}
      styles={{ header: { background: '#e6f4ff', borderBottom: '1px solid #91caff' } }}
    >
      <Form
        form={form}
        layout="vertical"
        size="small"
        initialValues={{
          沟通时间: dayjs(),
          沟通方式: '电话',
          用时: 0,
        }}
      >
        <Divider orientation="left" style={{ margin: '4px 0 12px', fontSize: '13px', color: '#666' }}>基本信息</Divider>
        <Row gutter={16}>
          <Col span={5}>
            <Form.Item
              name="沟通时间"
              label="沟通时间"
              rules={[{ required: true, message: '请选择时间' }]}
              style={{ marginBottom: 12 }}
            >
              <DatePicker showTime format="MM-DD HH:mm" style={{ width: '100%' }} disabledDate={(current) => {
                if (!current) return false
                if (current > dayjs().endOf('day')) return true
                if (登记日期 && current < dayjs(登记日期).startOf('day')) return true
                return false
              }} />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item
              name="沟通方式"
              label="方式"
              rules={[{ required: true, message: '请选择' }]}
              style={{ marginBottom: 12 }}
            >
              <Select>
                <Option value="电话">电话</Option>
                <Option value="网聊">网聊</Option>
                <Option value="当面">当面</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item name="用时" label="用时(分)" style={{ marginBottom: 12 }}>
              <InputNumber min={0} max={999} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="咨询师" label="咨询师" style={{ marginBottom: 12 }}>
              <Input placeholder="姓名" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item name="联系不上" label="失联" valuePropName="checked" style={{ marginBottom: 12 }}>
              <Switch size="small" />
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item name="报名意愿" label="意愿等级" style={{ marginBottom: 12 }}>
              <Select allowClear placeholder="等级">
                <Option value="A"><Tag color="green" style={{margin:0}}>A</Tag> 高</Option>
                <Option value="B"><Tag color="cyan" style={{margin:0}}>B</Tag> 中</Option>
                <Option value="C"><Tag color="orange" style={{margin:0}}>C</Tag> 低</Option>
                <Option value="D"><Tag color="red" style={{margin:0}}>D</Tag> 无</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" style={{ margin: '4px 0 12px', fontSize: '13px', color: '#666' }}>沟通分析</Divider>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="需求点" label="需求点" style={{ marginBottom: 12 }}>
              <Input placeholder="客户的需求点" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="关注点" label="关注点" style={{ marginBottom: 12 }}>
              <Input placeholder="客户关注什么" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="抗拒点" label="抗拒点" style={{ marginBottom: 12 }}>
              <Input placeholder="客户的顾虑" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="课程意向" label="课程意向" style={{ marginBottom: 12 }}>
              <Input placeholder="意向课程" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="具备条件" label="具备条件" style={{ marginBottom: 12 }}>
              <Input placeholder="条件描述" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="预定回访时间" label="预定回访" style={{ marginBottom: 12 }}>
              <DatePicker showTime format="MM-DD HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label=" " style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', paddingTop: 4 }}>
                <Form.Item name="有需求" valuePropName="checked" noStyle>
                  <Switch size="small" checkedChildren="有需求" unCheckedChildren="无需求" style={{ width: 80 }} />
                </Form.Item>
                <Form.Item name="有钱" valuePropName="checked" noStyle>
                  <Switch size="small" checkedChildren="有钱" unCheckedChildren="没钱" style={{ width: 80 }} />
                </Form.Item>
                <Form.Item name="有时间" valuePropName="checked" noStyle>
                  <Switch size="small" checkedChildren="有时间" unCheckedChildren="没时间" style={{ width: 80 }} />
                </Form.Item>
                <Form.Item name="有支持" valuePropName="checked" noStyle>
                  <Switch size="small" checkedChildren="有支持" unCheckedChildren="不支持" style={{ width: 80 }} />
                </Form.Item>
              </div>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" style={{ margin: '4px 0 12px', fontSize: '13px', color: '#666' }}>沟通详情</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="咨询内容" label="咨询内容" style={{ marginBottom: 12 }}>
              <TextArea
                autoSize={{ minRows: 4, maxRows: 12 }}
                placeholder="详细记录沟通内容..."
                style={{ resize: 'vertical' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="咨询结果" label="咨询结果" style={{ marginBottom: 12 }}>
              <TextArea
                autoSize={{ minRows: 4, maxRows: 12 }}
                placeholder="沟通结果..."
                style={{ resize: 'vertical' }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  )
}
