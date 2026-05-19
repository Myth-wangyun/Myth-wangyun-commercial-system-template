/**
 * 神殿教化司新生维稳月度个人统计表编辑模态框
 */

import React, { useEffect } from 'react'
import { Modal, Form, InputNumber, Input, Row, Col, Select } from 'antd'
import type { NewStudentStabilityMonthlyPersonalEditModalProps } from '@/types/new-student-stability-monthly-personal'

const NewStudentStabilityMonthlyPersonalEditModal: React.FC<
  NewStudentStabilityMonthlyPersonalEditModalProps
> = ({ open, record, onCancel, onOk }) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (record && open) {
      form.setFieldsValue(record)
    } else if (open && !record) {
      // 新增模式，设置默认值
      form.resetFields()
    }
  }, [record, open, form])

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        // 计算退费率
        const refundRate =
          values.reportedCount > 0 ? (values.refundCount / values.reportedCount) * 100 : 0
        values.refundRate = refundRate

        onOk(values)
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

  const teacherOptions = [
    { label: '马晴', value: '马晴' },
    { label: '郭彩兰', value: '郭彩兰' },
    { label: '姜楠', value: '姜楠' },
    { label: '李晓平', value: '李晓平' },
  ]

  return (
    <Modal
      title={record ? '编辑新生维稳月度个人统计' : '新增新生维稳月度个人统计'}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      width={800}
      okText="保存"
      cancelText="取消"
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="月份" name="month" rules={[{ required: true }]}>
              <Select options={monthOptions} placeholder="请选择月份" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="班主任姓名" name="teacherName" rules={[{ required: true }]}>
              <Select options={teacherOptions} placeholder="请选择班主任" />
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
            <Form.Item label="回全款人数" name="fullPaymentCount" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入回全款人数" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="仍欠费人数" name="outstandingFeesCount" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入仍欠费人数" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="欠费总金额" name="outstandingFeesAmount" rules={[{ required: true }]}>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="请输入欠费总金额"
                formatter={(value) => (value ? `¥ ${value}` : '')}
                parser={(value) => value!.replace(/¥\s?|(,*)/g, '') as any}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="退费人数" name="refundCount" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入退费人数" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="新生退费率" name="refundRate">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={100}
                precision={2}
                placeholder="自动计算"
                disabled
                suffix="%"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="退费学员情况说明" name="refundExplanation">
          <Input.TextArea rows={3} placeholder="请输入退费学员情况说明" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default NewStudentStabilityMonthlyPersonalEditModal
