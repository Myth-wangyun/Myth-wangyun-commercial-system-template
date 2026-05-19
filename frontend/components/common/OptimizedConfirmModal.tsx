import React, { memo, useCallback } from 'react'
import { App } from 'antd'

// Ant Design 5 Modal.confirm 支持的按钮类型
type LegacyButtonType = 'primary' | 'dashed' | 'link' | 'text' | 'default'

interface OptimizedConfirmModalProps {
  title?: string
  content: string
  okText?: string
  cancelText?: string
  okType?: LegacyButtonType
  icon?: React.ReactNode
  centered?: boolean
  maskClosable?: boolean
  onOk?: () => void
  onCancel?: () => void
  style?: React.CSSProperties
  className?: string
}

const OptimizedConfirmModal: React.FC<OptimizedConfirmModalProps> = memo(
  ({
    title = '确认',
    content,
    okText = '确定',
    cancelText = '取消',
    okType = 'primary',
    icon,
    centered = false,
    maskClosable = false,
    onOk,
    onCancel,
    style,
    className,
  }) => {
    const { modal } = App.useApp()
    const handleOk = useCallback(() => {
      onOk?.()
    }, [onOk])

    const handleCancel = useCallback(() => {
      onCancel?.()
    }, [onCancel])

    const showConfirm = useCallback(() => {
      modal.confirm({
        title,
        content,
        okText,
        cancelText,
        okType,
        icon,
        centered,
        maskClosable,
        onOk: handleOk,
        onCancel: handleCancel,
        style,
        className,
      })
    }, [
      title,
      content,
      okText,
      cancelText,
      okType,
      icon,
      centered,
      maskClosable,
      handleOk,
      handleCancel,
      style,
      className,
    ])

    return <button onClick={showConfirm}>显示确认对话框</button>
  },
)

OptimizedConfirmModal.displayName = 'OptimizedConfirmModal'

export default OptimizedConfirmModal
