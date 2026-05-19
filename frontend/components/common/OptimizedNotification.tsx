import React, { memo, useCallback, useMemo } from 'react'
import { App } from 'antd'

interface OptimizedNotificationProps {
  type?: 'success' | 'info' | 'warning' | 'error'
  message: string
  description?: string
  duration?: number
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  icon?: React.ReactNode
  btn?: React.ReactNode
  onClose?: () => void
  onClick?: () => void
  style?: React.CSSProperties
  className?: string
}

const OptimizedNotification: React.FC<OptimizedNotificationProps> = memo(
  ({
    type = 'info',
    message,
    description,
    duration = 4.5,
    placement = 'topRight',
    icon,
    btn,
    onClose,
    onClick,
    style,
    className,
  }) => {
    const { notification } = App.useApp()
    const handleClose = useCallback(() => {
      onClose?.()
    }, [onClose])

    const handleClick = useCallback(() => {
      onClick?.()
    }, [onClick])

    const notificationProps = useMemo(
      () => ({
        message,
        description,
        duration,
        placement,
        icon,
        btn,
        onClose: handleClose,
        onClick: handleClick,
        style,
        className,
      }),
      [
        message,
        description,
        duration,
        placement,
        icon,
        btn,
        handleClose,
        handleClick,
        style,
        className,
      ],
    )

    const showNotification = useCallback(() => {
      switch (type) {
        case 'success':
          notification.success(notificationProps)
          break
        case 'info':
          notification.info(notificationProps)
          break
        case 'warning':
          notification.warning(notificationProps)
          break
        case 'error':
          notification.error(notificationProps)
          break
        default:
          notification.info(notificationProps)
      }
    }, [type, notificationProps])

    return <button onClick={showNotification}>显示通知</button>
  },
)

OptimizedNotification.displayName = 'OptimizedNotification'

export default OptimizedNotification
