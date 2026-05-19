/**
 * 神殿教化司招聘计划与总结汇总编辑模态框组件
 */

import React from 'react'
import { App, Modal, Form, Input, Select, Row, Col } from 'antd'
import type {
  CampusRecruitmentSummaryEditModalProps,
  CampusRecruitmentSummaryRecord,
} from '@/types/campus-recruitment-summary'

const { Option } = Select

const CampusRecruitmentSummaryEditModal: React.FC<CampusRecruitmentSummaryEditModalProps> = ({
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
        serialNumber: record.serialNumber,
        content: record.content,
        january: record.january,
        february: record.february,
        march: record.march,
        april: record.april,
        may: record.may,
        june: record.june,
        july: record.july,
        august: record.august,
        september: record.september,
        october: record.october,
        november: record.november,
        december: record.december,
        total: record.total,
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

      const updatedRecord: CampusRecruitmentSummaryRecord = {
        ...record,
        january: values.january || '',
        february: values.february || '',
        march: values.march || '',
        april: values.april || '',
        may: values.may || '',
        june: values.june || '',
        july: values.july || '',
        august: values.august || '',
        september: values.september || '',
        october: values.october || '',
        november: values.november || '',
        december: values.december || '',
        total: values.total || '',
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

  // 根据内容类型决定输入组件
  const getInputComponent = (fieldName: string) => {
    if (record?.serialNumber === 1 || record?.serialNumber === 3) {
      // 岗位名称使用下拉选择
      return (
        <Select placeholder="请选择岗位名称" allowClear>
          <Option value="班主任">班主任</Option>
          <Option value="副班主任">副班主任</Option>
          <Option value="教务老师">教务老师</Option>
          <Option value="学管老师">学管老师</Option>
          <Option value="招生老师">招生老师</Option>
          <Option value="行政老师">行政老师</Option>
          <Option value="财务老师">财务老师</Option>
          <Option value="后勤老师">后勤老师</Option>
        </Select>
      )
    } else if (
      record?.serialNumber === 2 ||
      record?.serialNumber === 4 ||
      record?.serialNumber === 6
    ) {
      // 人数使用数字输入
      return <Input placeholder="请输入人数" type="number" min={0} />
    } else if (record?.serialNumber === 5 || record?.serialNumber === 7) {
      // 姓名使用下拉选择
      return (
        <Select placeholder="请选择姓名" allowClear>
          <Option value="张三">张三</Option>
          <Option value="李四">李四</Option>
          <Option value="王五">王五</Option>
          <Option value="赵六">赵六</Option>
          <Option value="孙七">孙七</Option>
          <Option value="周八">周八</Option>
          <Option value="吴九">吴九</Option>
          <Option value="郑十">郑十</Option>
          <Option value="陈十一">陈十一</Option>
          <Option value="刘十二">刘十二</Option>
        </Select>
      )
    } else {
      // 其他情况使用文本输入
      return <Input placeholder="请输入内容" />
    }
  }

  return (
    <Modal
      title={`编辑${record?.content || ''} - 序号${record?.serialNumber || ''}`}
      open={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      width={1200}
      okText="保存"
      cancelText="取消"
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="序号"
              name="serialNumber"
              rules={[{ required: true, message: '请输入序号' }]}
            >
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="内容"
              name="content"
              rules={[{ required: true, message: '请输入内容' }]}
            >
              <Input disabled />
            </Form.Item>
          </Col>
        </Row>

        {/* 月份数据 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#1890ff', marginBottom: 12 }}>月份数据</h4>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="1月" name="january">
                {getInputComponent('january')}
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="2月" name="february">
                {getInputComponent('february')}
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="3月" name="march">
                {getInputComponent('march')}
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="4月" name="april">
                {getInputComponent('april')}
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="5月" name="may">
                {getInputComponent('may')}
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="6月" name="june">
                {getInputComponent('june')}
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="7月" name="july">
                {getInputComponent('july')}
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="8月" name="august">
                {getInputComponent('august')}
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="9月" name="september">
                {getInputComponent('september')}
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="10月" name="october">
                {getInputComponent('october')}
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="11月" name="november">
                {getInputComponent('november')}
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="12月" name="december">
                {getInputComponent('december')}
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="合计" name="total">
                {getInputComponent('total')}
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form>
    </Modal>
  )
}

export default CampusRecruitmentSummaryEditModal
