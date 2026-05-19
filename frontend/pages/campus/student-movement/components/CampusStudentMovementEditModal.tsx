/**
 * 神殿教化司学员异动表编辑模态框
 */

import React, { useEffect } from 'react'
import { Modal, Form, InputNumber, Select, Row, Col } from 'antd'
import type { CampusStudentMovementEditModalProps } from '@/types/campus-student-movement'

const CampusStudentMovementEditModal: React.FC<CampusStudentMovementEditModalProps> = ({
  open,
  record,
  campus,
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

  return (
    <Modal
      title={record ? '编辑月度数据' : '新增月度数据'}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      width={900}
      okText="保存"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="月份"
              name="month"
              rules={[{ required: true, message: '请选择月份' }]}
            >
              <Select options={monthOptions} placeholder="请选择月份" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="累计带生人数" name="totalStudents" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="新生退费人数" name="newStudentRefund" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="老生退费人数" name="oldStudentRefund" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="休学总人数" name="suspensionTotal" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="长期请假总人数" name="longLeaveTotal" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="长期不上课总人数"
              name="longAbsenceTotal"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="寒暑假学生总数"
              name="holidayStudentTotal"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="其他情况总人数" name="otherCasesTotal" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

export default CampusStudentMovementEditModal
