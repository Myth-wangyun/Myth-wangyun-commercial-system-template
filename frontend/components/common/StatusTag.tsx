import React from 'react'
import { Tag } from 'antd'

interface StatusTagProps {
  status: string
  statusMap?: Record<string, { text: string; color: string }>
  size?: 'small' | 'middle' | 'large'
}

const StatusTag: React.FC<StatusTagProps> = ({ status, statusMap = {}, size = 'middle' }) => {
  const defaultStatusMap: Record<string, { text: string; color: string }> = {
    active: { text: '启用', color: 'green' },
    inactive: { text: '禁用', color: 'red' },
    pending: { text: '待处理', color: 'orange' },
    completed: { text: '已完成', color: 'green' },
    cancelled: { text: '已取消', color: 'red' },
    draft: { text: '草稿', color: 'default' },
    published: { text: '已发布', color: 'blue' },
    archived: { text: '已归档', color: 'gray' },
    通过: { text: '通过', color: 'green' },
    不通过: { text: '不通过', color: 'red' },
    待审核: { text: '待审核', color: 'orange' },
    进行中: { text: '进行中', color: 'blue' },
    已完成: { text: '已完成', color: 'green' },
    已暂停: { text: '已暂停', color: 'orange' },
    正常: { text: '正常', color: 'green' },
    异常: { text: '异常', color: 'red' },
    警告: { text: '警告', color: 'orange' },
    成功: { text: '成功', color: 'green' },
    失败: { text: '失败', color: 'red' },
    处理中: { text: '处理中', color: 'blue' },
  }

  const finalStatusMap = { ...defaultStatusMap, ...statusMap }
  const statusInfo = finalStatusMap[status] || { text: status, color: 'default' }

  return (
    <Tag color={statusInfo.color} style={{ fontSize: size === 'small' ? '12px' : '14px' }}>
      {statusInfo.text}
    </Tag>
  )
}

export default StatusTag
