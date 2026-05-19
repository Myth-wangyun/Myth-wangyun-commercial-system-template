import React, { memo, useMemo } from 'react'
import { Avatar } from 'antd'

interface OptimizedAvatarProps {
  src?: string
  alt?: string
  size?: number | 'small' | 'default' | 'large'
  shape?: 'circle' | 'square'
  icon?: React.ReactNode
  children?: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

const OptimizedAvatar: React.FC<OptimizedAvatarProps> = memo(
  ({ src, alt, size = 'default', shape = 'circle', icon, children, style, className }) => {
    const avatarProps = useMemo(
      () => ({
        src,
        alt,
        size,
        shape,
        icon,
        style,
        className,
      }),
      [src, alt, size, shape, icon, style, className],
    )

    return <Avatar {...avatarProps}>{children}</Avatar>
  },
)

OptimizedAvatar.displayName = 'OptimizedAvatar'

export default OptimizedAvatar
