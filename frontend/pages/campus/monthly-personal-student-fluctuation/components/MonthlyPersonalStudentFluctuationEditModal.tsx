/**
 * 神殿教化司月度个人统计学员异动表编辑模态框
 */

import React, { useEffect } from 'react'
import { Modal, Form, InputNumber, Row, Col, Select } from 'antd'
import type { MonthlyPersonalStudentFluctuationEditModalProps } from '@/types/monthly-personal-student-fluctuation'

const MonthlyPersonalStudentFluctuationEditModal: React.FC<
  MonthlyPersonalStudentFluctuationEditModalProps
> = ({ open, record, onCancel, onOk }) => {
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
        // 自动计算
        const totalRefundCount =
          (values.newStudentRefundCount || 0) + (values.oldStudentRefundCount || 0)
        const refundRate =
          (values.cumulativeStudentCount || 0) > 0
            ? (totalRefundCount / (values.cumulativeStudentCount || 0)) * 100
            : 0
        const totalFluctuationCount =
          totalRefundCount +
          (values.totalSuspensionCount || 0) +
          (values.totalLongTermLeaveCount || 0) +
          (values.totalLongTermAbsenteeCount || 0) +
          (values.winterSummerBreakCount || 0) +
          (values.otherSituationsCount || 0)
        const fluctuationRate =
          (values.cumulativeStudentCount || 0) > 0
            ? (totalFluctuationCount / (values.cumulativeStudentCount || 0)) * 100
            : 0

        const finalValues = {
          ...values,
          totalRefundCount,
          refundRate,
          totalFluctuationCount,
          fluctuationRate,
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

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    label: `${i + 1}月`,
    value: i + 1,
  }))

  const teacherOptions = [
    { label: '马晴', value: '马晴' },
    { label: '郭彩兰', value: '郭彩兰' },
    { label: '李晓平', value: '李晓平' },
  ]

  return (
    <Modal
      title={record ? '编辑月度个人统计学员异动' : '新增月度个人统计学员异动'}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      width={900}
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
            <Form.Item
              label="累计带生人数"
              name="cumulativeStudentCount"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入累计带生人数" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="新生退费人数"
              name="newStudentRefundCount"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入新生退费人数" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="老生退费人数"
              name="oldStudentRefundCount"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入老生退费人数" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="退费总人数" name="totalRefundCount">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="自动计算" disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="退费率" name="refundRate">
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
            <Form.Item label="休学总人数" name="totalSuspensionCount" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入休学总人数" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="长期请假总人数"
              name="totalLongTermLeaveCount"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入长期请假总人数" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="长期不上课总人数"
              name="totalLongTermAbsenteeCount"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入长期不上课总人数" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="寒暑假学生总数"
              name="winterSummerBreakCount"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入寒暑假学生总数" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="其他情况总人数"
              name="otherSituationsCount"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入其他情况总人数" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="异动总人数" name="totalFluctuationCount">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="自动计算" disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="异动率" name="fluctuationRate">
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

export default MonthlyPersonalStudentFluctuationEditModal
