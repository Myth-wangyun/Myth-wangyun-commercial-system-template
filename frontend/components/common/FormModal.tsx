import React from 'react'
import { Modal, Button, Space } from 'antd'

interface FormModalProps {
  title: string
  visible: boolean
  loading?: boolean
  onCancel: () => void
  onOk: () => void
  children: React.ReactNode
  width?: number
  okText?: string
  cancelText?: string
  destroyOnHidden?: boolean
  maskClosable?: boolean
  footer?: React.ReactNode
}

const FormModal: React.FC<FormModalProps> = ({
  title,
  visible,
  loading = false,
  onCancel,
  onOk,
  children,
  width = 600,
  okText = '确定',
  cancelText = '取消',
  destroyOnHidden = true,
  maskClosable = false,
  footer,
}) => {
  const defaultFooter = (
    <Space>
      <Button onClick={onCancel}>{cancelText}</Button>
      <Button type="primary" loading={loading} onClick={onOk}>
        {okText}
      </Button>
    </Space>
  )

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      onOk={onOk}
      width={width}
      destroyOnHidden={destroyOnHidden}
      maskClosable={maskClosable}
      footer={footer || defaultFooter}
      confirmLoading={loading}
    >
      {children}
    </Modal>
  )
}

export default FormModal
