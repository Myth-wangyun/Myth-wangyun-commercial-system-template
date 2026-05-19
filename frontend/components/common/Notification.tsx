import React from 'react'
import { App } from 'antd'
import { appNotification } from '@/utils/antdStatic'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  showIcon?: boolean
}

const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  description,
  duration = 4.5,
  placement = 'topRight',
  showIcon = true,
}) => {
  const { notification } = App.useApp()
  const icons = {
    success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    error: <CloseCircleOutlined style={{ color: '#f5222d' }} />,
    warning: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
    info: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
  }

  notification[type]({
    message: title,
    description,
    duration,
    placement,
    icon: showIcon ? icons[type] : undefined,
    style: {
      marginTop: 24,
    },
  })

  return null
}

// 便捷方法 - 非组件上下文使用 appNotification()
export const showSuccess = (title: string, description?: string) => {
  appNotification().success({
    message: title,
    description,
    icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  })
}

export const showError = (title: string, description?: string) => {
  appNotification().error({
    message: title,
    description,
    icon: <CloseCircleOutlined style={{ color: '#f5222d' }} />,
  })
}

export const showWarning = (title: string, description?: string) => {
  appNotification().warning({
    message: title,
    description,
    icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
  })
}

export const showInfo = (title: string, description?: string) => {
  appNotification().info({
    message: title,
    description,
    icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
  })
}

export default Notification
