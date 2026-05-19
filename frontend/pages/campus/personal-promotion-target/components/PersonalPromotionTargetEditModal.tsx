/**
 * 神殿教化司个人升学目标与结果汇总表编辑模态框
 */

import React, { useEffect } from 'react'
import { Modal, Form, InputNumber, Input, Row, Col } from 'antd'
import type { PersonalPromotionTargetEditModalProps } from '@/types/personal-promotion-target'

const PersonalPromotionTargetEditModal: React.FC<PersonalPromotionTargetEditModalProps> = ({
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
      // 新增模式，设置默认值
      form.resetFields()
    }
  }, [record, open, form])

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        // 自动计算升学率
        const totalStudents = values.totalStudents || 0
        const estimatedPromotionCount = values.estimatedPromotionCount || 0
        const actualPromotionCount = values.actualPromotionCount || 0
        const receivables = values.receivables || 0
        const estimatedPromotionIncome = values.estimatedPromotionIncome || 0
        const actualPromotionIncome = values.actualPromotionIncome || 0

        // 计算升学率（人数）
        const estimatedPromotionRateByCount =
          totalStudents > 0 ? (estimatedPromotionCount / totalStudents) * 100 : 0
        const actualPromotionRateByCount =
          totalStudents > 0 ? (actualPromotionCount / totalStudents) * 100 : 0

        // 计算升学率（金额）
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

  return (
    <Modal
      title={record ? '编辑个人升学目标与结果' : '新增个人升学目标与结果'}
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
            <Form.Item label="姓名" name="name" rules={[{ required: true }]}>
              <Input placeholder="请输入姓名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="升学班级总数" name="totalClasses" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入升学班级总数" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="在档总人数" name="totalStudents" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入在档总人数" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="预计升学总人数"
              name="estimatedPromotionCount"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入预计升学总人数" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="实际升学总人数"
              name="actualPromotionCount"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入实际升学总人数" />
            </Form.Item>
          </Col>
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
        </Row>

        <Row gutter={16}>
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

export default PersonalPromotionTargetEditModal
