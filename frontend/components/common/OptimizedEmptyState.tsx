import React, { memo, useCallback, useMemo } from 'react'
import { Empty, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

interface OptimizedEmptyStateProps {
  title?: string
  description?: string
  image?: React.ReactNode
  buttonText?: string
  buttonIcon?: React.ReactNode
  onButtonClick?: () => void
  style?: React.CSSProperties
  className?: string
}

const OptimizedEmptyState: React.FC<OptimizedEmptyStateProps> = memo(
  ({
    description = '当前没有数据，请添加一些内容',
    image,
    buttonText = '添加数据',
    buttonIcon = <PlusOutlined />,
    onButtonClick,
    style,
    className,
  }) => {
    const handleButtonClick = useCallback(() => {
      onButtonClick?.()
    }, [onButtonClick])

    const emptyProps = useMemo(
      () => ({
        image,
        description,
        style,
        className,
      }),
      [image, description, style, className],
    )

    return (
      <Empty {...emptyProps}>
        {onButtonClick && (
          <Button type="primary" icon={buttonIcon} onClick={handleButtonClick}>
            {buttonText}
          </Button>
        )}
      </Empty>
    )
  },
)

OptimizedEmptyState.displayName = 'OptimizedEmptyState'

export default OptimizedEmptyState
