/**
 * 神殿教化司升学计划编辑模态框组件
 */

import React from 'react'
import { App, Modal, Form, InputNumber, Select, Row, Col, Divider } from 'antd'
import type {
  CampusPromotionPlanEditModalProps,
  CampusPromotionPlanRecord,
} from '@/types/campus-promotion-plan'

const { Option } = Select

const CampusPromotionPlanEditModal: React.FC<CampusPromotionPlanEditModalProps> = ({
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
        totalPromotionClasses: record.totalPromotionClasses,
        totalOnFileCount: record.totalOnFileCount,
        estimatedPromotionCount: record.estimatedPromotionCount,
        actualPromotionCount: record.actualPromotionCount,
        receivablePromotionIncome: record.receivablePromotionIncome,
        estimatedPromotionIncome: record.estimatedPromotionIncome,
        actualPromotionIncome: record.actualPromotionIncome,
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

      // 计算升学率
      const estimatedPromotionRateByCount =
        values.totalOnFileCount > 0
          ? (values.estimatedPromotionCount / values.totalOnFileCount) * 100
          : 0
      const actualPromotionRateByCount =
        values.totalOnFileCount > 0
          ? (values.actualPromotionCount / values.totalOnFileCount) * 100
          : 0
      const estimatedPromotionRateByAmount =
        values.receivablePromotionIncome > 0
          ? (values.estimatedPromotionIncome / values.receivablePromotionIncome) * 100
          : 0
      const actualPromotionRateByAmount =
        values.receivablePromotionIncome > 0
          ? (values.actualPromotionIncome / values.receivablePromotionIncome) * 100
          : 0

      const updatedRecord: CampusPromotionPlanRecord = {
        ...record,
        month: values.month || 0,
        campus: values.campus || '',
        totalPromotionClasses: values.totalPromotionClasses || 0,
        totalOnFileCount: values.totalOnFileCount || 0,
        estimatedPromotionCount: values.estimatedPromotionCount || 0,
        actualPromotionCount: values.actualPromotionCount || 0,
        estimatedPromotionRateByCount,
        actualPromotionRateByCount,
        receivablePromotionIncome: values.receivablePromotionIncome || 0,
        estimatedPromotionIncome: values.estimatedPromotionIncome || 0,
        actualPromotionIncome: values.actualPromotionIncome || 0,
        estimatedPromotionRateByAmount,
        actualPromotionRateByAmount,
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
      title={`${record ? '编辑' : '新增'}${record?.campus || ''}神殿升学计划`}
      open={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      width={900}
      okText="保存"
      cancelText="取消"
      style={{ top: 20 }}
    >
      <Form form={form} layout="vertical" preserve={false} scrollToFirstError>
        {/* 基础信息 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#fa8c16', marginBottom: 12 }}>📋 基础信息</h4>
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
                <Select placeholder="请选择神殿" disabled={!!record}>
                  <Option value="盛邦">主神殿</Option>
                  <Option value="冀美">永恒殿</Option>
                  <Option value="石美">慈悲殿</Option>
                  <Option value="晋美">李大殿</Option>
                  <Option value="原美">智慧阁</Option>
                  <Option value="太美">光明殿</Option>
                  <Option value="桂美">神恩殿</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* 班级和人数数据 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#52c41a', marginBottom: 12 }}>📊 班级和人数数据</h4>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="升学班级总数"
                name="totalPromotionClasses"
                rules={[{ required: true, message: '请输入升学班级总数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入升学班级总数" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="在档总人数"
                name="totalOnFileCount"
                rules={[{ required: true, message: '请输入在档总人数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入在档总人数" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="预计升学总人数"
                name="estimatedPromotionCount"
                rules={[{ required: true, message: '请输入预计升学总人数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入预计升学总人数" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="实际升学总人数"
                name="actualPromotionCount"
                rules={[{ required: true, message: '请输入实际升学总人数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入实际升学总人数" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* 收入数据 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#1890ff', marginBottom: 12 }}>💰 收入数据</h4>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="应收升学收入"
                name="receivablePromotionIncome"
                rules={[{ required: true, message: '请输入应收升学收入' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入应收升学收入" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="预计升学收入"
                name="estimatedPromotionIncome"
                rules={[{ required: true, message: '请输入预计升学收入' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入预计升学收入" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="实际升学收入"
                name="actualPromotionIncome"
                rules={[{ required: true, message: '请输入实际升学收入' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入实际升学收入" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* 提示信息 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#1890ff', marginBottom: 12 }}>💡 填写说明</h4>
          <div
            style={{
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '14px',
              color: '#52c41a',
            }}
          >
            <p style={{ margin: 0, marginBottom: '8px' }}>
              • <strong>升学班级总数</strong>：计划进行升学培训的班级数量
            </p>
            <p style={{ margin: 0, marginBottom: '8px' }}>
              • <strong>在档总人数</strong>：当前在档的学员总人数
            </p>
            <p style={{ margin: 0, marginBottom: '8px' }}>
              • <strong>预计升学总人数</strong>：预计参与升学培训的学员人数
            </p>
            <p style={{ margin: 0, marginBottom: '8px' }}>
              • <strong>实际升学总人数</strong>：实际参与升学培训的学员人数
            </p>
            <p style={{ margin: 0, marginBottom: '8px' }}>
              • <strong>应收升学收入</strong>：应收的升学培训收入总额
            </p>
            <p style={{ margin: 0, marginBottom: '8px' }}>
              • <strong>预计升学收入</strong>：预计的升学培训收入
            </p>
            <p style={{ margin: 0 }}>
              • <strong>升学率</strong>：系统将自动计算升学率 = 升学人数 ÷ 在档人数 × 100%
            </p>
          </div>
        </div>
      </Form>
    </Modal>
  )
}

export default CampusPromotionPlanEditModal
