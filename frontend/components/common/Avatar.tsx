import React from 'react'
import { Avatar } from 'antd'
import { UserOutlined } from '@ant-design/icons'

interface CustomAvatarProps {
  src?: string
  alt?: string
  size?: number | 'small' | 'default' | 'large'
  shape?: 'circle' | 'square'
  icon?: React.ReactNode
  children?: React.ReactNode
  style?: React.CSSProperties
  className?: string
  onClick?: () => void
}

const CustomAvatar: React.FC<CustomAvatarProps> = ({
  src,
  alt,
  size = 'default',
  shape = 'circle',
  icon = <UserOutlined />,
  children,
  style,
  className,
  onClick,
}) => {
  return (
    <Avatar
      src={src}
      alt={alt}
      size={size}
      shape={shape}
      icon={icon}
      style={style}
      className={className}
      onClick={onClick}
    >
      {children}
    </Avatar>
  )
}

export default CustomAvatar
