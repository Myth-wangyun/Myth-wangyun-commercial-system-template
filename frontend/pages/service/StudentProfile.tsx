import React from 'react'
import { Card, Typography } from 'antd'

const { Title, Text } = Typography

const StudentProfile: React.FC = () => {
  return (
    <div>
      <Title level={2}>学生档案</Title>
      <Card>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Text type="secondary" style={{ fontSize: 16 }}>
            学生档案功能开发中...
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default StudentProfile
