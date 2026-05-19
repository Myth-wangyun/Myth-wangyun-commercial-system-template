import React from 'react'
import { Card, Typography } from 'antd'

const { Title, Text } = Typography

const StudentStatus: React.FC = () => {
  return (
    <div>
      <Title level={2}>StudentStatus</Title>
      <Card>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Text type="secondary" style={{ fontSize: 16 }}>
            StudentStatus 鍔熻兘寮€鍙戜腑...
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default StudentStatus
