import React from 'react'
import { Card, Typography } from 'antd'

const { Title, Text } = Typography

const DailyWork: React.FC = () => {
  return (
    <div>
      <Title level={2}>DailyWork</Title>
      <Card>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Text type="secondary" style={{ fontSize: 16 }}>
            DailyWork 鍔熻兘寮€鍙戜腑...
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default DailyWork
