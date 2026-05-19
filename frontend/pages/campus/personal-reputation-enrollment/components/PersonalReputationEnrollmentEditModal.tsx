/**
 * 神殿教化司口碑招生个人目标与结果汇总表编辑模态框
 */

import React, { useEffect } from 'react'
import { Modal, Form, InputNumber, Row, Col, App } from 'antd'
import type { PersonalReputationEnrollmentEditModalProps } from '@/types/personal-reputation-enrollment'

const PersonalReputationEnrollmentEditModal: React.FC<
  PersonalReputationEnrollmentEditModalProps
> = ({ open, record, onCancel, onOk }) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  useEffect(() => {
    if (record && open) {
      form.setFieldsValue(record)
    }
  }, [record, open, form])

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
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

  if (!record) {
    return null
  }

  return (
    <Modal
      title={`编辑 - ${record.name}`}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      width={700}
      okText="保存"
      cancelText="取消"
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="目标口碑量" name="targetReputationVolume">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入目标口碑量" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="实际口碑量" name="actualReputationVolume">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入实际口碑量" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="目标上门量" name="targetWalkInVolume">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入目标上门量" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="实际上门量" name="actualWalkInVolume">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入实际上门量" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="目标招生人数" name="targetEnrollmentCount">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入目标招生人数" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="实际招生人数" name="actualEnrollmentCount">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入实际招生人数" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="目标收入" name="targetRevenue">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="请输入目标收入"
                formatter={(value) => (value ? `¥ ${value}` : '')}
                parser={(value) => value!.replace(/¥\s?|(,*)/g, '') as any}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="实际收入" name="actualRevenue">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="请输入实际收入"
                formatter={(value) => (value ? `¥ ${value}` : '')}
                parser={(value) => value!.replace(/¥\s?|(,*)/g, '') as any}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

export default PersonalReputationEnrollmentEditModal
