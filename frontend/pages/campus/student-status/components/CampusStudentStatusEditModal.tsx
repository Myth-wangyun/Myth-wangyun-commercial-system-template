import React, { useEffect } from 'react'
import { App,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Row,
  Col,
  Divider,
  DatePicker,
} from 'antd'
import dayjs from 'dayjs'
import type {
  CampusStudentStatusRecord,
  CampusStudentStatusEditModalProps,
} from '@/types/campus-student-status'

const { Option } = Select

const CampusStudentStatusEditModal: React.FC<CampusStudentStatusEditModalProps> = ({
  visible,
  record,
  onCancel,
  onSave,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  useEffect(() => {
    if (visible && record) {
      form.setFieldsValue({
        ...record,
        vocationalTargetTime: record.vocationalTargetTime
          ? dayjs(record.vocationalTargetTime)
          : null,
        universityTargetTime: record.universityTargetTime
          ? dayjs(record.universityTargetTime)
          : null,
      })
    } else if (visible && !record) {
      form.resetFields()
      // Set default campus for new record
      form.setFieldsValue({ campus: '盛邦' }) // Default to Shengbang for new entries
    }
  }, [visible, record, form])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const updatedRecord = {
        ...record,
        ...values,
        vocationalTargetTime: values.vocationalTargetTime
          ? values.vocationalTargetTime.format('YYYY-MM-DD')
          : '',
        universityTargetTime: values.universityTargetTime
          ? values.universityTargetTime.format('YYYY-MM-DD')
          : '',
      }

      onSave(updatedRecord)
    } catch (error) {
      message.error('请填写所有必填项并确保数据格式正确。')
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title={`${record ? '编辑' : '新增'}${record?.campus || ''}神殿学籍统计`}
      open={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      width={1200}
      okText="保存"
      cancelText="取消"
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={8}>
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
          <Col span={8}>
            <Form.Item
              label="神殿"
              name="campus"
              rules={[{ required: true, message: '请输入神殿' }]}
            >
              <Input disabled={true} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">中专层次</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="中专3年学籍注册人数"
              name="vocationalThreeYearCount"
              rules={[{ required: true, message: '请输入中专3年学籍注册人数' }]}
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="请输入中专3年学籍注册人数"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="中专1年制人数"
              name="vocationalOneYearCount"
              rules={[{ required: true, message: '请输入中专1年制人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入中专1年制人数" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="其他已注册人数"
              name="vocationalOtherRegisteredCount"
              rules={[{ required: true, message: '请输入其他已注册人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入其他已注册人数" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="目标注册人数"
              name="vocationalTargetCount"
              rules={[{ required: true, message: '请输入目标注册人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入目标注册人数" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="目标注册时间"
              name="vocationalTargetTime"
              rules={[{ required: true, message: '请选择目标注册时间' }]}
            >
              <DatePicker style={{ width: '100%' }} placeholder="请选择目标注册时间" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="实际注册人数"
              name="vocationalActualCount"
              rules={[{ required: true, message: '请输入实际注册人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入实际注册人数" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">大学层次</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="成考注册人数"
              name="adultExamCount"
              rules={[{ required: true, message: '请输入成考注册人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入成考注册人数" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="国开注册人数"
              name="nationalOpenCount"
              rules={[{ required: true, message: '请输入国开注册人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入国开注册人数" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="其他已注册人数"
              name="universityOtherRegisteredCount"
              rules={[{ required: true, message: '请输入其他已注册人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入其他已注册人数" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="目标注册人数"
              name="universityTargetCount"
              rules={[{ required: true, message: '请输入目标注册人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入目标注册人数" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="目标注册时间"
              name="universityTargetTime"
              rules={[{ required: true, message: '请选择目标注册时间' }]}
            >
              <DatePicker style={{ width: '100%' }} placeholder="请选择目标注册时间" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="实际注册人数"
              name="universityActualCount"
              rules={[{ required: true, message: '请输入实际注册人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入实际注册人数" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

export default CampusStudentStatusEditModal
