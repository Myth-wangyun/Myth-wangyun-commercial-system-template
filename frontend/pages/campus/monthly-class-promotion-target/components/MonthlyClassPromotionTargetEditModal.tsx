/**
 * 神殿教化司月度班级升学目标与结果汇总表编辑模态框
 */

import React, { useEffect } from 'react'
import { Modal, Form, InputNumber, Input, Row, Col, Select } from 'antd'
import type { MonthlyClassPromotionTargetEditModalProps } from '@/types/monthly-class-promotion-target'

const MonthlyClassPromotionTargetEditModal: React.FC<MonthlyClassPromotionTargetEditModalProps> = ({
  open,
  record,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (record && open) {
      form.setFieldsValue(record)
    } else if (open && !record) {
      form.resetFields()
    }
  }, [record, open, form])

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        const totalStudents = values.totalStudents || 0
        const estimatedPromotionCount = values.estimatedPromotionCount || 0
        const actualPromotionCount = values.actualPromotionCount || 0
        const receivables = values.receivables || 0
        const estimatedPromotionIncome = values.estimatedPromotionIncome || 0
        const actualPromotionIncome = values.actualPromotionIncome || 0

        const estimatedPromotionRateByCount =
          totalStudents > 0 ? (estimatedPromotionCount / totalStudents) * 100 : 0
        const actualPromotionRateByCount =
          totalStudents > 0 ? (actualPromotionCount / totalStudents) * 100 : 0
        const estimatedPromotionRateByAmount =
          receivables > 0 ? (estimatedPromotionIncome / receivables) * 100 : 0
        const actualPromotionRateByAmount =
          receivables > 0 ? (actualPromotionIncome / receivables) * 100 : 0

        const finalValues = {
          ...values,
          estimatedPromotionRateByCount,
          actualPromotionRateByCount,
          estimatedPromotionRateByAmount,
          actualPromotionRateByAmount,
        }

        onOk(finalValues)
      })
      .catch((err) => {
        console.error('表单验证失败:', err)
      })
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  const promotionPeriodOptions = [
    { label: '3个月', value: '3个月' },
    { label: '6个月', value: '6个月' },
    { label: '12个月', value: '12个月' },
    { label: '18个月', value: '18个月' },
    { label: '24个月', value: '24个月' },
  ]

  return (
    <Modal
      title={record ? '编辑月度班级升学目标与结果' : '新增月度班级升学目标与结果'}
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
            <Form.Item label="班主任" name="teacherName" rules={[{ required: true }]}>
              <Input placeholder="请输入班主任" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="升学班级名称" name="className" rules={[{ required: true }]}>
              <Input placeholder="请输入升学班级名称" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="升学周期" name="promotionPeriod" rules={[{ required: true }]}>
              <Select options={promotionPeriodOptions} placeholder="请选择升学周期" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="在档总人数" name="totalStudents" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入在档总人数" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="预计升学总人数"
              name="estimatedPromotionCount"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入预计升学总人数" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="实际升学总人数"
              name="actualPromotionCount"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入实际升学总人数" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="应收" name="receivables" rules={[{ required: true }]}>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="请输入应收"
                formatter={(value) => (value ? `¥ ${value}` : '')}
                parser={(value) => value!.replace(/¥\s?|(,*)/g, '') as any}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="预计升学收入"
              name="estimatedPromotionIncome"
              rules={[{ required: true }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="请输入预计升学收入"
                formatter={(value) => (value ? `¥ ${value}` : '')}
                parser={(value) => value!.replace(/¥\s?|(,*)/g, '') as any}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="实际升学收入"
              name="actualPromotionIncome"
              rules={[{ required: true }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="请输入实际升学收入"
                formatter={(value) => (value ? `¥ ${value}` : '')}
                parser={(value) => value!.replace(/¥\s?|(,*)/g, '') as any}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="预计升学率（人数）" name="estimatedPromotionRateByCount">
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
          <Col span={12}>
            <Form.Item label="实际升学率（人数）" name="actualPromotionRateByCount">
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

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="预计升学率（金额）" name="estimatedPromotionRateByAmount">
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
          <Col span={12}>
            <Form.Item label="实际升学率（金额）" name="actualPromotionRateByAmount">
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
      </Form>
    </Modal>
  )
}

export default MonthlyClassPromotionTargetEditModal
