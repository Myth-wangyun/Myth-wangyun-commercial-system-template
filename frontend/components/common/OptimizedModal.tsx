import React, { memo, useCallback } from 'react'
import { Modal } from 'antd'

interface OptimizedModalProps {
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
  centered?: boolean
  zIndex?: number
}

const OptimizedModal: React.FC<OptimizedModalProps> = memo(
  ({
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
    centered = false,
    zIndex = 1000,
  }) => {
    const handleCancel = useCallback(() => {
      onCancel()
    }, [onCancel])

    const handleOk = useCallback(() => {
      onOk()
    }, [onOk])

    return (
      <Modal
        title={title}
        open={visible}
        onCancel={handleCancel}
        onOk={handleOk}
        width={width}
        destroyOnHidden={destroyOnHidden}
        maskClosable={maskClosable}
        footer={footer}
        confirmLoading={loading}
        okText={okText}
        cancelText={cancelText}
        centered={centered}
        zIndex={zIndex}
      >
        {children}
      </Modal>
    )
  },
)

OptimizedModal.displayName = 'OptimizedModal'

export default OptimizedModal
