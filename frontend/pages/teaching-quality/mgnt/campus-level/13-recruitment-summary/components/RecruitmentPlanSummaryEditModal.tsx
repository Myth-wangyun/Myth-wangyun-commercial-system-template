/**
 * 神殿教化司招聘计划与总结编辑模态框组件
 */

import React from 'react'
import { App, Modal, Form, Input, Row, Col, InputNumber } from 'antd'
import type {
  RecruitmentPlanSummaryEditModalProps,
  RecruitmentPlanSummaryRecord,
} from '@/types/recruitment-plan-summary'

const RecruitmentPlanSummaryEditModal: React.FC<RecruitmentPlanSummaryEditModalProps> = ({
  visible,
  record,
  onCancel,
  onSave,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  React.useEffect(() => {
    if (visible && record) {
      form.setFieldsValue({
        month: record.month,
        campus: record.campus,
        plannedPositionName: record.plannedPositionName,
        plannedRecruitmentCount: record.plannedRecruitmentCount,
        actualPositionName: record.actualPositionName,
        actualRecruitmentCount: record.actualRecruitmentCount,
        newHireNames: record.newHireNames,
        departureCount: record.departureCount,
        departureNames: record.departureNames,
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

      const updatedRecord: RecruitmentPlanSummaryRecord = {
        ...record,
        ...values,
      }

      onSave(updatedRecord)
      message.success('保存成功')
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title={`编辑${record?.campus || ''}神殿教化司招聘计划 - ${record?.month || ''}月`}
      open={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      width={800}
      okText="保存"
      cancelText="取消"
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="月份" name="month">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="神殿" name="campus">
              <Input disabled />
            </Form.Item>
          </Col>
        </Row>

        <h4 style={{ marginTop: 16, marginBottom: 12 }}>计划招聘</h4>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="计划招聘岗位名称" name="plannedPositionName">
              <Input placeholder="如: 班主任、教务老师" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="计划招聘人数" name="plannedRecruitmentCount">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <h4 style={{ marginTop: 16, marginBottom: 12 }}>实际招聘</h4>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="实际招聘岗位名称" name="actualPositionName">
              <Input placeholder="实际招聘的岗位名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="实际招聘人数" name="actualRecruitmentCount">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="入职者姓名（多个用逗号分隔）" name="newHireNames">
              <Input.TextArea rows={2} placeholder="如: 张三,李四" />
            </Form.Item>
          </Col>
        </Row>

        <h4 style={{ marginTop: 16, marginBottom: 12 }}>离职情况</h4>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="离职人数" name="departureCount">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="离职者姓名（多个用逗号分隔）" name="departureNames">
              <Input.TextArea rows={2} placeholder="如: 王五,赵六" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

export default RecruitmentPlanSummaryEditModal
