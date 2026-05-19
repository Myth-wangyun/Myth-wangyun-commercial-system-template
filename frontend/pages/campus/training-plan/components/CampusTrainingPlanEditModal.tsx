/**
 * 神殿教化司培训计划与成绩汇总编辑模态框组件
 */

import React from 'react'
import { App, Modal, Form, InputNumber, Input, Select, Row, Col } from 'antd'
import type {
  CampusTrainingPlanEditModalProps,
  CampusTrainingPlanRecord,
} from '@/types/campus-training-plan'

const { Option } = Select

const CampusTrainingPlanEditModal: React.FC<CampusTrainingPlanEditModalProps> = ({
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
        trainingObjective: record.trainingObjective,
        mainContent: record.mainContent,
        trainingMethod: record.trainingMethod,
        personInCharge: record.personInCharge,
        trainingCount: record.trainingCount,
        qualifiedCount: record.qualifiedCount,
        averageScore: record.averageScore,
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

      const updatedRecord: CampusTrainingPlanRecord = {
        ...record,
        trainingObjective: values.trainingObjective || '',
        mainContent: values.mainContent || '',
        trainingMethod: values.trainingMethod || '',
        personInCharge: values.personInCharge || '',
        trainingCount: values.trainingCount || 0,
        qualifiedCount: values.qualifiedCount || 0,
        averageScore: values.averageScore || 0,
      }

      // 重新计算合格率
      updatedRecord.passRate =
        updatedRecord.trainingCount > 0
          ? (updatedRecord.qualifiedCount / updatedRecord.trainingCount) * 100
          : 0

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
      title={`编辑${record?.campus || ''}神殿教化司培训计划与成绩汇总 - ${record?.month || ''}月`}
      open={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      width={800}
      okText="保存"
      cancelText="取消"
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="月份"
              name="month"
              rules={[{ required: true, message: '请输入月份' }]}
            >
              <InputNumber min={1} max={12} style={{ width: '100%' }} disabled />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="神殿"
              name="campus"
              rules={[{ required: true, message: '请输入神殿' }]}
            >
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="培训目标"
              name="trainingObjective"
              rules={[{ required: true, message: '请输入培训目标' }]}
            >
              <Select placeholder="请选择培训目标">
                <Option value="提升专业技能">提升专业技能</Option>
                <Option value="加强团队协作">加强团队协作</Option>
                <Option value="提高服务质量">提高服务质量</Option>
                <Option value="规范操作流程">规范操作流程</Option>
                <Option value="增强安全意识">增强安全意识</Option>
                <Option value="提升沟通能力">提升沟通能力</Option>
                <Option value="强化管理能力">强化管理能力</Option>
                <Option value="优化工作效率">优化工作效率</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="主要内容"
              name="mainContent"
              rules={[{ required: true, message: '请输入主要内容' }]}
            >
              <Select placeholder="请选择主要内容">
                <Option value="业务技能培训">业务技能培训</Option>
                <Option value="服务标准培训">服务标准培训</Option>
                <Option value="安全知识培训">安全知识培训</Option>
                <Option value="管理技能培训">管理技能培训</Option>
                <Option value="沟通技巧培训">沟通技巧培训</Option>
                <Option value="团队建设培训">团队建设培训</Option>
                <Option value="技术更新培训">技术更新培训</Option>
                <Option value="质量提升培训">质量提升培训</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="培训方式"
              name="trainingMethod"
              rules={[{ required: true, message: '请输入培训方式' }]}
            >
              <Select placeholder="请选择培训方式">
                <Option value="线上培训">线上培训</Option>
                <Option value="线下培训">线下培训</Option>
                <Option value="混合式培训">混合式培训</Option>
                <Option value="实践操作">实践操作</Option>
                <Option value="案例分析">案例分析</Option>
                <Option value="小组讨论">小组讨论</Option>
                <Option value="专题讲座">专题讲座</Option>
                <Option value="实地考察">实地考察</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="负责人"
              name="personInCharge"
              rules={[{ required: true, message: '请输入负责人' }]}
            >
              <Select placeholder="请选择负责人">
                <Option value="张经理">张经理</Option>
                <Option value="李副经理">李副经理</Option>
                <Option value="王主管">王主管</Option>
                <Option value="刘老师">刘老师</Option>
                <Option value="陈老师">陈老师</Option>
                <Option value="赵老师">赵老师</Option>
                <Option value="孙老师">孙老师</Option>
                <Option value="周老师">周老师</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="培训人数"
              name="trainingCount"
              rules={[{ required: true, message: '请输入培训人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入培训人数" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="合格人数"
              name="qualifiedCount"
              rules={[{ required: true, message: '请输入合格人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入合格人数" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="平均成绩"
              name="averageScore"
              rules={[{ required: true, message: '请输入平均成绩' }]}
            >
              <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100分" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

export default CampusTrainingPlanEditModal
