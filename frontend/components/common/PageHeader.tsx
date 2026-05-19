import React from 'react'
import { Typography, Space, Button } from 'antd'
import { ReloadOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons'

const { Title } = Typography

interface PageHeaderProps {
  title: string
  icon?: React.ReactNode
  onRefresh?: () => void
  onAdd?: () => void
  onExport?: () => void
  extra?: React.ReactNode
  showRefresh?: boolean
  showAdd?: boolean
  showExport?: boolean
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  icon,
  onRefresh,
  onAdd,
  onExport,
  extra,
  showRefresh = true,
  showAdd = true,
  showExport = true,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
      }}
    >
      <Title level={2} style={{ margin: 0 }}>
        {icon && <span style={{ marginRight: 8 }}>{icon}</span>}
        {title}
      </Title>
      <Space>
        {showRefresh && (
          <Button icon={<ReloadOutlined />} onClick={onRefresh}>
            刷新
          </Button>
        )}
        {showAdd && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
            添加
          </Button>
        )}
        {showExport && (
          <Button icon={<DownloadOutlined />} onClick={onExport}>
            导出数据
          </Button>
        )}
        {extra}
      </Space>
    </div>
  )
}

export default PageHeader
