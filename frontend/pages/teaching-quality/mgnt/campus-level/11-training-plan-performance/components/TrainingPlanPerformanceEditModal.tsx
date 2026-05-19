/**
 * 教化司培训计划与成绩编辑模态框组件
 */

import React from 'react'
import { App, Modal, Form, InputNumber, Input, Row, Col } from 'antd'
import type {
  TrainingPlanPerformanceEditModalProps,
  TrainingPlanPerformanceRecord,
} from '@/types/training-plan-performance'

const TrainingPlanPerformanceEditModal: React.FC<TrainingPlanPerformanceEditModalProps> = ({
  visible,
  record,
  onCancel,
  onSave,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  // 在模态框打开后设置表单值，确保 Modal 内部已经挂载
  const handleAfterOpenChange = (open: boolean) => {
    if (open && record) {
      form.setFieldsValue({
        month: record.month,
        campus: record.campus,
        trainingObjective: record.trainingObjective,
        mainContent: record.mainContent,
        trainingMethod: record.trainingMethod,
        personInCharge: record.personInCharge,
        numberOfTrainees: record.numberOfTrainees,
        numberOfQualified: record.numberOfQualified,
        examPassRate: record.examPassRate,
        averageScore: record.averageScore,
      })
    }
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()

      if (!record) {
        message.error('记录不存在')
        return
      }

      const updatedRecord: TrainingPlanPerformanceRecord = {
        ...record,
        trainingObjective: values.trainingObjective || '',
        mainContent: values.mainContent || '',
        trainingMethod: values.trainingMethod || '',
        personInCharge: values.personInCharge || '',
        numberOfTrainees: values.numberOfTrainees || 0,
        numberOfQualified: values.numberOfQualified || 0,
        averageScore: values.averageScore || 0,
      }

      // 重新计算合格率
      if (updatedRecord.numberOfTrainees > 0) {
        updatedRecord.examPassRate =
          (updatedRecord.numberOfQualified / updatedRecord.numberOfTrainees) * 100
      } else {
        updatedRecord.examPassRate = 0
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
      title={`编辑${record?.campus || ''}神殿教化司培训计划与成绩 - ${record?.month || ''}月`}
      open={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      afterOpenChange={handleAfterOpenChange}
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
              rules={[{ required: true, message: '请输入月份' }]}
            >
              <InputNumber min={1} max={12} style={{ width: '100%' }} disabled />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="培训场次">
          <Input.TextArea
            value={
              [
                form.getFieldValue('trainingObjective') &&
                  `培训目标：${form.getFieldValue('trainingObjective')}`,
                form.getFieldValue('mainContent') && `主要内容：${form.getFieldValue('mainContent')}`,
                form.getFieldValue('trainingMethod') &&
                  `培训方式：${form.getFieldValue('trainingMethod')}`,
                form.getFieldValue('personInCharge') &&
                  `负责人：${form.getFieldValue('personInCharge')}`,
              ]
                .filter(Boolean)
                .join('；')
            }
            placeholder="培训场次（由：培训目标/主要内容/培训方式/负责人 组合展示）"
            autoSize={{ minRows: 2, maxRows: 4 }}
            disabled
          />
        </Form.Item>

        {/* 以下 4 个字段仍保留用于数据编辑（但不再单独占 4 列展示） */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="培训目标"
              name="trainingObjective"
              rules={[{ required: true, message: '请输入培训目标' }]}
            >
              <Input placeholder="请输入培训目标" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="主要内容" name="mainContent">
              <Input placeholder="请输入主要内容" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="培训方式" name="trainingMethod">
              <Input placeholder="请输入培训方式" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="负责人" name="personInCharge">
              <Input placeholder="请输入负责人" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="培训人次"
              name="numberOfTrainees"
              rules={[{ required: true, message: '请输入培训人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="培训人次" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="合格人数"
              name="numberOfQualified"
              rules={[{ required: true, message: '请输入合格人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="合格人数" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="平均成绩" name="averageScore">
              <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="平均成绩" />
            </Form.Item>
          </Col>
        </Row>

        <div
          style={{
            textAlign: 'center',
            padding: '12px 0',
            background: '#f0f2f5',
            borderRadius: '4px',
          }}
        >
          <strong>
            考试合格率:{' '}
            {form.getFieldValue('numberOfTrainees') > 0
              ? (
                  ((form.getFieldValue('numberOfQualified') || 0) /
                    form.getFieldValue('numberOfTrainees')) *
                  100
                ).toFixed(2)
              : '0.00'}
            %
          </strong>
        </div>
      </Form>
    </Modal>
  )
}

export default TrainingPlanPerformanceEditModal
