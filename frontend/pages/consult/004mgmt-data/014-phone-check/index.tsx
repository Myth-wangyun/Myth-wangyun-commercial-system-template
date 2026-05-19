import React from 'react'
import { Card, Typography } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'

const { Title } = Typography

/**
 * 014电话标准化检查
 */
const PhoneCheckPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 24 }} />
          <Title level={2}>014电话标准化检查</Title>
          <Typography.Text type="secondary">页面开发中...</Typography.Text>
        </div>
      </Card>
    </div>
  )
}

export default PhoneCheckPage
