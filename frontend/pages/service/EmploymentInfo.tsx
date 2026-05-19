import React from 'react'
import { Card, Typography } from 'antd'

const { Title, Text } = Typography

const EmploymentInfo: React.FC = () => {
  return (
    <div>
      <Title level={2}>EmploymentInfo</Title>
      <Card>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Text type="secondary" style={{ fontSize: 16 }}>
            EmploymentInfo 鍔熻兘寮€鍙戜腑...
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default EmploymentInfo
