import React from 'react'
import { Card, Typography } from 'antd'

const { Title, Text } = Typography

const EnrollmentArchive: React.FC = () => {
  return (
    <div>
      <Title level={2}>入学建档</Title>
      <Card>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Text type="secondary" style={{ fontSize: 16 }}>
            入学建档功能开发中...
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default EnrollmentArchive
