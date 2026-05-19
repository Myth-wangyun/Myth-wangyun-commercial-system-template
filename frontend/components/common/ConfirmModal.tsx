import React from 'react'
import { Modal } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'

interface ConfirmModalProps {
  visible: boolean
  title?: string
  content?: string
  okText?: string
  cancelText?: string
  okType?: 'primary' | 'danger'
  loading?: boolean
  onOk: () => void
  onCancel: () => void
  icon?: React.ReactNode
  width?: number
  maskClosable?: boolean
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title = '确认操作',
  content = '确定要执行此操作吗？',
  okText = '确定',
  cancelText = '取消',
  okType = 'primary',
  loading = false,
  onOk,
  onCancel,
  icon = <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
  width = 400,
  maskClosable = false,
}) => {
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {icon}
          <span style={{ marginLeft: 8 }}>{title}</span>
        </div>
      }
      open={visible}
      onOk={onOk}
      onCancel={onCancel}
      width={width}
      maskClosable={maskClosable}
      confirmLoading={loading}
      okText={okText}
      cancelText={cancelText}
      okType={okType}
    >
      <p>{content}</p>
    </Modal>
  )
}

export default ConfirmModal
