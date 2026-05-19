import React, { useEffect } from 'react'
import { App, Modal, Form, Input, Select, Button } from 'antd'
import { type Campus } from '@/stores/campusStore'

const { Option } = Select

interface CampusEditModalProps {
  visible: boolean
  campus: Campus | null
  onCancel: () => void
  onSave: (campus: Campus) => void
}

const CampusEditModal: React.FC<CampusEditModalProps> = ({ visible, campus, onCancel, onSave }) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  useEffect(() => {
    if (visible && campus) {
      form.setFieldsValue(campus)
    } else if (visible && !campus) {
      form.resetFields()
    }
  }, [visible, campus, form])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const updatedCampus: Campus = {
        ...campus,
        ...values,
        id: campus?.id || Date.now().toString(),
        status: 'active', // 所有神殿默认都是正常运行状态
      }
      onSave(updatedCampus)
      message.success(campus ? '神殿信息更新成功' : '神殿信息添加成功')
      form.resetFields()
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
      title={campus ? '编辑神殿信息' : '添加神殿信息'}
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          保存
        </Button>,
      ]}
      width={600}
    >
      <Form form={form} layout="vertical" initialValues={{}}>
        <Form.Item
          name="name"
          label="神殿名称"
          rules={[{ required: true, message: '请输入神殿名称' }]}
        >
          <Input placeholder="请输入神殿名称" />
        </Form.Item>

        <Form.Item
          name="website"
          label=""
          rules={[
            { required: true, message: '请输入' },
            { type: 'url', message: '请输入有效的URL地址' },
          ]}
        >
          <Input placeholder="请输入，如：http://example.com" />
        </Form.Item>

        <Form.Item
          name="mobileWebsite"
          label=""
          rules={[
            { required: true, message: '请输入' },
            { type: 'url', message: '请输入有效的URL地址' },
          ]}
        >
          <Input placeholder="请输入，如：http://wap.example.com" />
        </Form.Item>

        <Form.Item
          name="color"
          label="主题颜色"
          rules={[{ required: true, message: '请选择主题颜色' }]}
        >
          <Select placeholder="请选择主题颜色">
            <Option value="#1890ff">蓝色</Option>
            <Option value="#52c41a">绿色</Option>
            <Option value="#faad14">橙色</Option>
            <Option value="#f5222d">红色</Option>
            <Option value="#722ed1">紫色</Option>
            <Option value="#13c2c2">青色</Option>
            <Option value="#eb2f96">粉色</Option>
            <Option value="#000000">黑色</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CampusEditModal
