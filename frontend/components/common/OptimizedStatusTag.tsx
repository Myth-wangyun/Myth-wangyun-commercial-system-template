import React, { memo, useCallback, useMemo } from 'react'
import { Tag } from 'antd'

interface OptimizedStatusTagProps {
  status: 'success' | 'processing' | 'error' | 'warning' | 'default'
  text?: string
  color?: string
  icon?: React.ReactNode
  closable?: boolean
  onClose?: () => void
  style?: React.CSSProperties
  className?: string
}

const OptimizedStatusTag: React.FC<OptimizedStatusTagProps> = memo(
  ({ status, text, color, icon, closable = false, onClose, style, className }) => {
    const handleClose = useCallback(() => {
      onClose?.()
    }, [onClose])

    const tagProps = useMemo(
      () => ({
        color,
        icon,
        closable,
        onClose: handleClose,
        style,
        className,
      }),
      [color, icon, closable, handleClose, style, className],
    )

    const getStatusColor = useCallback((status: string) => {
      switch (status) {
        case 'success':
          return 'green'
        case 'processing':
          return 'blue'
        case 'error':
          return 'red'
        case 'warning':
          return 'orange'
        default:
          return 'default'
      }
    }, [])

    const getStatusText = useCallback((status: string) => {
      switch (status) {
        case 'success':
          return '成功'
        case 'processing':
          return '进行中'
        case 'error':
          return '错误'
        case 'warning':
          return '警告'
        default:
          return '默认'
      }
    }, [])

    return (
      <Tag {...tagProps} color={color || getStatusColor(status)}>
        {text || getStatusText(status)}
      </Tag>
    )
  },
)

OptimizedStatusTag.displayName = 'OptimizedStatusTag'

export default OptimizedStatusTag
