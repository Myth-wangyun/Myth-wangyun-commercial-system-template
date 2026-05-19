import React from 'react'
import { Card, Typography } from 'antd'

const { Title, Text } = Typography

const StandardizationCheck: React.FC = () => {
  return (
    <div>
      <Title level={2}>StandardizationCheck</Title>
      <Card>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Text type="secondary" style={{ fontSize: 16 }}>
            StandardizationCheck 鍔熻兘寮€鍙戜腑...
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default StandardizationCheck
