/**
 * 神殿教化司新生仍欠费明细表编辑模态框
 */

import React, { useEffect } from 'react'
import { Modal, Form, InputNumber, Input, Select, Row, Col } from 'antd'
import type { OutstandingFeesDetailEditModalProps } from '@/types/outstanding-fees-detail'

const OutstandingFeesDetailEditModal: React.FC<OutstandingFeesDetailEditModalProps> = ({
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
      form.setFieldsValue({
        isFullPayment: '否',
        isLoan: '否',
        exceededClassHours: '否',
        isRefunded: '否',
        isAccommodation: '否',
        trialPeriod: '7天',
      })
    }
  }, [record, open, form])

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        // 计算仍欠费金额
        const receivableTuition = values.receivableTuition || 0
        const registrationPayment = values.registrationPayment || 0
        const supplementaryPayment = values.supplementaryPayment || 0
        values.outstandingAmount = receivableTuition - registrationPayment - supplementaryPayment

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

  const yesNoOptions = [
    { label: '是', value: '是' },
    { label: '否', value: '否' },
  ]

  const trialPeriodOptions = [
    { label: '7天', value: '7天' },
    { label: '15天', value: '15天' },
    { label: '30天', value: '30天' },
    { label: '60天', value: '60天' },
  ]

  return (
    <Modal
      title={record ? '编辑新生欠费明细' : '新增新生欠费明细'}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      width={1000}
      okText="保存"
      cancelText="取消"
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="班主任姓名" name="teacherName" rules={[{ required: true }]}>
              <Input placeholder="请输入班主任姓名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="新生姓名" name="studentName" rules={[{ required: true }]}>
              <Input placeholder="请输入新生姓名" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="报名时间" name="registrationTime">
              <Input placeholder="请输入报名时间" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="报道时间" name="reportingTime">
              <Input placeholder="请输入报道时间" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="报名专业" name="major">
              <Input placeholder="请输入报名专业" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="报名学制" name="academicSystem">
              <Input placeholder="请输入报名学制" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="应收学费" name="receivableTuition">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="请输入应收学费"
                formatter={(value) => (value ? `¥ ${value}` : '')}
                parser={(value) => value!.replace(/¥\s?|(,*)/g, '') as any}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="报名交费金额" name="registrationPayment">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="请输入报名交费金额"
                formatter={(value) => (value ? `¥ ${value}` : '')}
                parser={(value) => value!.replace(/¥\s?|(,*)/g, '') as any}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="补款金额" name="supplementaryPayment">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="请输入补款金额"
                formatter={(value) => (value ? `¥ ${value}` : '')}
                parser={(value) => value!.replace(/¥\s?|(,*)/g, '') as any}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="是否全款" name="isFullPayment">
              <Select options={yesNoOptions} placeholder="请选择" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="是否贷款" name="isLoan">
              <Select options={yesNoOptions} placeholder="请选择" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="是否过课时" name="exceededClassHours">
              <Select options={yesNoOptions} placeholder="请选择" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="试学周期" name="trialPeriod">
              <Select options={trialPeriodOptions} placeholder="请选择试学周期" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="是否退费" name="isRefunded">
              <Select options={yesNoOptions} placeholder="请选择" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="退费情况说明" name="refundExplanation">
          <Input.TextArea rows={2} placeholder="请输入退费情况说明" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="咨询师" name="consultant">
              <Input placeholder="请输入咨询师" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="是否住宿" name="isAccommodation">
              <Select options={yesNoOptions} placeholder="请选择" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="宿舍名称" name="dormitoryName">
          <Input placeholder="请输入宿舍名称" />
        </Form.Item>

        <Form.Item label="备注" name="remarks">
          <Input.TextArea rows={2} placeholder="请输入备注" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default OutstandingFeesDetailEditModal
