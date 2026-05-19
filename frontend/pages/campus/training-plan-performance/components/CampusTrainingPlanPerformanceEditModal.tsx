/**
 * 神殿教化司培训计划与成绩汇总编辑模态框组件
 */

import React from 'react'
import { App, Modal, Form, InputNumber, Select, Row, Col, Divider, Spin } from 'antd'
import type {
  CampusTrainingPlanPerformanceEditModalProps,
  CampusTrainingPlanPerformanceRecord,
} from '@/types/campus-training-plan-performance'

const { Option } = Select

const CampusTrainingPlanPerformanceEditModal: React.FC<
  CampusTrainingPlanPerformanceEditModalProps
> = ({ visible, record, onCancel, onSave }) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (visible && record) {
      form.setFieldsValue({
        month: record.month,
        campus: record.campus,
        targetTrainingPlanCount: record.targetTrainingPlanCount,
        actualTrainingPlanCount: record.actualTrainingPlanCount,
        targetCompletionCount: record.targetCompletionCount,
        actualCompletionCount: record.actualCompletionCount,
        targetAverageScore: record.targetAverageScore,
        actualAverageScore: record.actualAverageScore,
        targetParticipantCount: record.targetParticipantCount,
        actualParticipantCount: record.actualParticipantCount,
        targetPassRate: record.targetPassRate,
        actualPassRate: record.actualPassRate,
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

      setLoading(true)

      const updatedRecord: CampusTrainingPlanPerformanceRecord = {
        ...record,
        month: values.month || 0,
        campus: values.campus || '',
        targetTrainingPlanCount: values.targetTrainingPlanCount || 0,
        actualTrainingPlanCount: values.actualTrainingPlanCount || 0,
        targetCompletionCount: values.targetCompletionCount || 0,
        actualCompletionCount: values.actualCompletionCount || 0,
        targetAverageScore: values.targetAverageScore || 0,
        actualAverageScore: values.actualAverageScore || 0,
        targetParticipantCount: values.targetParticipantCount || 0,
        actualParticipantCount: values.actualParticipantCount || 0,
        targetPassRate: values.targetPassRate || 0,
        actualPassRate: values.actualPassRate || 0,
      }

      await onSave(updatedRecord)
      message.success('保存成功')
    } catch (error) {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title={`${record ? '编辑' : '新增'}${record?.campus || ''}神殿培训计划与成绩`}
      open={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      width={800}
      okText="保存"
      cancelText="取消"
      style={{ top: 20 }}
      confirmLoading={loading}
    >
      <Spin spinning={loading}>
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

          {/* 培训计划数据 */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: '#52c41a', marginBottom: 12 }}>📚 培训计划数据</h4>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="目标培训计划数"
                  name="targetTrainingPlanCount"
                  rules={[{ required: true, message: '请输入目标培训计划数' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入目标培训计划数" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="实际培训计划数"
                  name="actualTrainingPlanCount"
                  rules={[{ required: true, message: '请输入实际培训计划数' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入实际培训计划数" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Divider />

          {/* 完成数据 */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: '#1890ff', marginBottom: 12 }}>✅ 完成数据</h4>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="目标完成数"
                  name="targetCompletionCount"
                  rules={[{ required: true, message: '请输入目标完成数' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入目标完成数" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="实际完成数"
                  name="actualCompletionCount"
                  rules={[{ required: true, message: '请输入实际完成数' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入实际完成数" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Divider />

          {/* 成绩数据 */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: '#722ed1', marginBottom: 12 }}>📊 成绩数据</h4>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="目标平均成绩"
                  name="targetAverageScore"
                  rules={[{ required: true, message: '请输入目标平均成绩' }]}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    step={0.1}
                    style={{ width: '100%' }}
                    placeholder="请输入目标平均成绩"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="实际平均成绩"
                  name="actualAverageScore"
                  rules={[{ required: true, message: '请输入实际平均成绩' }]}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    step={0.1}
                    style={{ width: '100%' }}
                    placeholder="请输入实际平均成绩"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Divider />

          {/* 参与人数数据 */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: '#f5222d', marginBottom: 12 }}>👥 参与人数数据</h4>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="目标参与人数"
                  name="targetParticipantCount"
                  rules={[{ required: true, message: '请输入目标参与人数' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入目标参与人数" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="实际参与人数"
                  name="actualParticipantCount"
                  rules={[{ required: true, message: '请输入实际参与人数' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入实际参与人数" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Divider />

          {/* 合格率数据 */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: '#13c2c2', marginBottom: 12 }}>🎯 合格率数据</h4>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="目标合格率 (%)"
                  name="targetPassRate"
                  rules={[{ required: true, message: '请输入目标合格率' }]}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    step={0.1}
                    style={{ width: '100%' }}
                    placeholder="请输入目标合格率"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="实际合格率 (%)"
                  name="actualPassRate"
                  rules={[{ required: true, message: '请输入实际合格率' }]}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    step={0.1}
                    style={{ width: '100%' }}
                    placeholder="请输入实际合格率"
                  />
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
                • <strong>培训计划数</strong>：计划内的培训项目数量
              </p>
              <p style={{ margin: 0, marginBottom: '8px' }}>
                • <strong>完成数</strong>：实际完成的培训项目数量
              </p>
              <p style={{ margin: 0, marginBottom: '8px' }}>
                • <strong>平均成绩</strong>：参与人员的平均成绩（0-100分）
              </p>
              <p style={{ margin: 0, marginBottom: '8px' }}>
                • <strong>参与人数</strong>：参加培训的人数
              </p>
              <p style={{ margin: 0 }}>
                • <strong>合格率</strong>：合格人数占总人数的比例（0-100%）
              </p>
            </div>
          </div>
        </Form>
      </Spin>
    </Modal>
  )
}

export default CampusTrainingPlanPerformanceEditModal

