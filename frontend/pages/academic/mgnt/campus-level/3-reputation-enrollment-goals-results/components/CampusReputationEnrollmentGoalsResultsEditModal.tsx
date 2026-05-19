/**
 * 神殿智慧司口碑招生汇总编辑模态框组件
 */

import React from 'react'
import { App, Modal, Form, InputNumber, Select, Row, Col, Divider } from 'antd'
import type {
  CampusReputationEnrollmentGoalsResultsEditModalProps,
  CampusReputationEnrollmentGoalsResultsRecord,
} from '@/types/campus-reputation-enrollment-goals-results'

const { Option } = Select

const CampusReputationEnrollmentGoalsResultsEditModal: React.FC<
  CampusReputationEnrollmentGoalsResultsEditModalProps
> = ({ visible, record, onCancel, onSave }) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  React.useEffect(() => {
    if (visible && record) {
      form.setFieldsValue({
        month: record.month,
        campus: record.campus,
        targetReputationVolume: record.targetReputationVolume,
        actualReputationVolume: record.actualReputationVolume,
        targetWalkInVolume: record.targetWalkInVolume,
        actualWalkInVolume: record.actualWalkInVolume,
        targetEnrollmentCount: record.targetEnrollmentCount,
        actualEnrollmentCount: record.actualEnrollmentCount,
        targetRevenue: record.targetRevenue,
        actualRevenue: record.actualRevenue,
      })
    }
  }, [visible, record, form])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()

      if (!record) {
        message.error('记录不存在')
        return
      }

      const updatedRecord: CampusReputationEnrollmentGoalsResultsRecord = {
        ...record,
        month: values.month || 0,
        campus: values.campus || '',
        targetReputationVolume: values.targetReputationVolume || 0,
        actualReputationVolume: values.actualReputationVolume || 0,
        targetWalkInVolume: values.targetWalkInVolume || 0,
        actualWalkInVolume: values.actualWalkInVolume || 0,
        targetEnrollmentCount: values.targetEnrollmentCount || 0,
        actualEnrollmentCount: values.actualEnrollmentCount || 0,
        targetRevenue: values.targetRevenue || 0,
        actualRevenue: values.actualRevenue || 0,
      }

      onSave(updatedRecord)
      message.success('保存成功')
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title={`${record ? '编辑' : '新增'}${record?.campus || ''}神殿口碑招生目标与结果`}
      open={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      width={800}
      okText="保存"
      cancelText="取消"
      style={{ top: 20 }}
    >
      <Form form={form} layout="vertical" preserve={false} scrollToFirstError>
        {/* 基础信息 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#fa8c16', marginBottom: 12 }}>📋 基础信息</h4>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="月份"
                name="month"
                rules={[{ required: true, message: '请选择月份' }]}
              >
                <Select placeholder="请选择月份" disabled={!!record}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <Option key={i + 1} value={i + 1}>
                      {i + 1}月
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="神殿"
                name="campus"
                rules={[{ required: true, message: '请输入神殿' }]}
              >
                <Select placeholder="请选择神殿" disabled={!!record}>
                  <Option value="盛邦">主神殿</Option>
                  <Option value="冀美">永恒殿</Option>
                  <Option value="石美">慈悲殿</Option>
                  <Option value="晋美">李大殿</Option>
                  <Option value="原美">智慧阁</Option>
                  <Option value="太美">光明殿</Option>
                  <Option value="桂美">神恩殿</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* 口碑数据 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#52c41a', marginBottom: 12 }}>📢 口碑数据</h4>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="目标口碑量"
                name="targetReputationVolume"
                rules={[{ required: true, message: '请输入目标口碑量' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入目标口碑量" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="实际口碑量"
                name="actualReputationVolume"
                rules={[{ required: true, message: '请输入实际口碑量' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入实际口碑量" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* 上门数据 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#1890ff', marginBottom: 12 }}>🚪 上门数据</h4>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="目标上门量"
                name="targetWalkInVolume"
                rules={[{ required: true, message: '请输入目标上门量' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入目标上门量" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="实际上门量"
                name="actualWalkInVolume"
                rules={[{ required: true, message: '请输入实际上门量' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入实际上门量" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* 招生数据 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#722ed1', marginBottom: 12 }}>🎓 招生数据</h4>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="目标招生人数"
                name="targetEnrollmentCount"
                rules={[{ required: true, message: '请输入目标招生人数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入目标招生人数" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="实际招生人数"
                name="actualEnrollmentCount"
                rules={[{ required: true, message: '请输入实际招生人数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入实际招生人数" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* 收入数据 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#f5222d', marginBottom: 12 }}>💰 收入数据</h4>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="目标收入"
                name="targetRevenue"
                rules={[{ required: true, message: '请输入目标收入' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入目标收入" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="实际收入"
                name="actualRevenue"
                rules={[{ required: true, message: '请输入实际收入' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入实际收入" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* 提示信息 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#1890ff', marginBottom: 12 }}>💡 填写说明</h4>
          <div
            style={{
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '14px',
              color: '#52c41a',
            }}
          >
            <p style={{ margin: 0, marginBottom: '8px' }}>
              • <strong>口碑量</strong>：通过口碑推荐获得的潜在学员数量
            </p>
            <p style={{ margin: 0, marginBottom: '8px' }}>
              • <strong>上门量</strong>：实际到校咨询的学员数量
            </p>
            <p style={{ margin: 0, marginBottom: '8px' }}>
              • <strong>招生人数</strong>：最终成功报名的学员数量
            </p>
            <p style={{ margin: 0 }}>
              • <strong>口碑收入</strong>：通过口碑招生获得的收入金额
            </p>
          </div>
        </div>
      </Form>
    </Modal>
  )
}

export default CampusReputationEnrollmentGoalsResultsEditModal
