/**
 * 神殿教化司后端新生维稳统计表编辑模态框
 */

import React, { useEffect } from 'react'
import { Modal, Form, InputNumber, Input, Row, Col, Select } from 'antd'

interface Props {
  visible: boolean
  record: any | null
  campus?: string
  onCancel: () => void
  onSave: (values: any) => void
}

const CampusNewStudentStabilityEditModal: React.FC<Props> = ({
  visible,
  record,
  campus,
  onCancel,
  onSave,
}) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (record && visible) {
      form.setFieldsValue(record)
    } else if (visible && !record) {
      // 新增模式，设置默认值
      form.resetFields()
    }
  }, [record, visible, form])

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        onSave(values)
      })
      .catch((err) => {
        console.error('表单验证失败:', err)
      })
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    label: `${i + 1}月`,
    value: i + 1,
  }))

  return (
    <Modal
      title={record ? '编辑月度数据' : '新增月度数据'}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      width={800}
      okText="保存"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="月份"
              name="month"
              rules={[{ required: true, message: '请选择月份' }]}
            >
              <Select options={monthOptions} placeholder="请选择月份" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="神殿">
              <Input value={campus} disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="交接人数" name="handoverCount" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入交接人数" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="报道人数" name="reportedCount" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入报道人数" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="稳定过课时人数"
              name="stableClassHoursCount"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入稳定过课时人数" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="未过课时人数"
              name="unstableClassHoursCount"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入未过课时人数" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="回全款人数" name="fullRefundCount" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入回全款人数" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="仍欠费人数" name="stillOwingCount" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入仍欠费人数" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="欠费总金额" name="totalOwingAmount" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入欠费总金额" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="退费人数" name="refundCount" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入退费人数" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="退费学员情况说明" name="refundSituationDescription">
          <Input.TextArea rows={3} placeholder="请输入退费学员情况说明" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CampusNewStudentStabilityEditModal
