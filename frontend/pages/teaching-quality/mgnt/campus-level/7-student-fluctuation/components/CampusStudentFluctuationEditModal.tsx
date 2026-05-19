import React, { useEffect } from 'react'
import { App, Modal, Form, Input, InputNumber, Select, Row, Col, Divider } from 'antd'
import type {
  CampusStudentFluctuationRecord,
  CampusStudentFluctuationEditModalProps,
} from '@/types/campus-student-fluctuation'

const { Option } = Select

const CampusStudentFluctuationEditModal: React.FC<CampusStudentFluctuationEditModalProps> = ({
  visible,
  record,
  onCancel,
  onSave,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  useEffect(() => {
    if (visible && record) {
      form.setFieldsValue(record)
    } else if (visible && !record) {
      form.resetFields()
    }
  }, [visible, record, form])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()

      // 自动计算退费总人数
      const totalRefundCount =
        (values.newStudentRefundCount || 0) + (values.oldStudentRefundCount || 0)

      // 自动计算退费率
      const refundRate =
        values.cumulativeStudentCount > 0
          ? (totalRefundCount / values.cumulativeStudentCount) * 100
          : 0

      // 自动计算异动总人数
      const totalFluctuationCount =
        totalRefundCount +
        (values.suspensionCount || 0) +
        (values.longTermLeaveCount || 0) +
        (values.longTermAbsenceCount || 0) +
        (values.vacationStudentCount || 0) +
        (values.otherSituationCount || 0)

      // 自动计算异动率
      const fluctuationRate =
        values.cumulativeStudentCount > 0
          ? (totalFluctuationCount / values.cumulativeStudentCount) * 100
          : 0

      const updatedRecord: CampusStudentFluctuationRecord = {
        key: record?.key || `${values.campus}-${values.month}`,
        month: values.month,
        campus: values.campus,
        cumulativeStudentCount: values.cumulativeStudentCount,
        newStudentRefundCount: values.newStudentRefundCount,
        oldStudentRefundCount: values.oldStudentRefundCount,
        totalRefundCount,
        refundRate,
        suspensionCount: values.suspensionCount,
        longTermLeaveCount: values.longTermLeaveCount,
        longTermAbsenceCount: values.longTermAbsenceCount,
        vacationStudentCount: values.vacationStudentCount,
        otherSituationCount: values.otherSituationCount,
        totalFluctuationCount,
        fluctuationRate,
      }

      onSave(updatedRecord)
      message.success(record ? '更新成功' : '创建成功')
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title={`${record ? '编辑' : '新增'}${record?.campus || ''}神殿学员异动记录`}
      open={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      width={800}
      okText="保存"
      cancelText="取消"
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
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
              <Input disabled={true} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">基础数据</Divider>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="累计带生人数"
              name="cumulativeStudentCount"
              rules={[{ required: true, message: '请输入累计带生人数' }]}
              extra="此字段用于计算退费率和异动率"
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入累计带生人数" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">退费情况</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="新生退费人数"
              name="newStudentRefundCount"
              rules={[{ required: true, message: '请输入新生退费人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入新生退费人数" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="老生退费人数"
              name="oldStudentRefundCount"
              rules={[{ required: true, message: '请输入老生退费人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入老生退费人数" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">其他异动情况</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="休学总人数"
              name="suspensionCount"
              rules={[{ required: true, message: '请输入休学总人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入休学总人数" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="长期请假总人数"
              name="longTermLeaveCount"
              rules={[{ required: true, message: '请输入长期请假总人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入长期请假总人数" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="长期不上课总人数"
              name="longTermAbsenceCount"
              rules={[{ required: true, message: '请输入长期不上课总人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入长期不上课总人数" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="寒暑假学生总数"
              name="vacationStudentCount"
              rules={[{ required: true, message: '请输入寒暑假学生总数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入寒暑假学生总数" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="其他情况总人数"
              name="otherSituationCount"
              rules={[{ required: true, message: '请输入其他情况总人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入其他情况总人数" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">计算说明</Divider>
        <div
          style={{
            background: '#f6ffed',
            padding: 12,
            borderRadius: 6,
            border: '1px solid #b7eb8f',
          }}
        >
          <p style={{ margin: 0, color: '#52c41a', fontWeight: 'bold' }}>📊 自动计算公式：</p>
          <p style={{ margin: '4px 0 0 0', color: '#666' }}>
            • 退费总人数 = 新生退费人数 + 老生退费人数
          </p>
          <p style={{ margin: '4px 0 0 0', color: '#666' }}>
            • 退费率 = 退费总人数 ÷ 累计带生人数 × 100%
          </p>
          <p style={{ margin: '4px 0 0 0', color: '#666' }}>
            • 异动总人数 = 退费总人数 + 休学总人数 + 长期请假总人数 + 长期不上课总人数 +
            寒暑假学生总数 + 其他情况总人数
          </p>
          <p style={{ margin: '4px 0 0 0', color: '#666' }}>
            • 异动率 = 异动总人数 ÷ 累计带生人数 × 100%
          </p>
        </div>
      </Form>
    </Modal>
  )
}

export default CampusStudentFluctuationEditModal
