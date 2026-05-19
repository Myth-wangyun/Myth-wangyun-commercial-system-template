import React from 'react'
import { Alert, Card } from 'antd'

interface QARegisterProps {
  campusId: string
  campusName: string
}

const QARegister: React.FC<QARegisterProps> = ({ campusId, campusName }) => {
  return (
    <Card title="问答数据登记">
      <style>{`
        .ant-input-number-input {
          text-align: center;
        }
      `}</style>
      <Alert
        message="功能开发中"
        description="此功能正在开发中，敬请期待。数据登记表单结构与社交新媒体类似。"
        type="info"
        showIcon
      />
    </Card>
  )
}

export default QARegister
