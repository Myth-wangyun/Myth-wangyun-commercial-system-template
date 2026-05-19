import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Typography, Space, Tag, Spin, Badge, Descriptions, message } from 'antd'
import { CrownOutlined, SafetyOutlined, ThunderboltOutlined, StarOutlined } from '@ant-design/icons'
import { getGods, type God } from '@/services/god'
import './GodTemple.css'

const { Title, Text, Paragraph } = Typography

const roleIcons: Record<string, React.ReactNode> = {
  supreme: <CrownOutlined />,
  buddha: <StarOutlined />,
  bodhisattva: <SafetyOutlined />
}

const roleColors: Record<string, string> = {
  supreme: '#FFD700',
  buddha: '#FF6347',
  bodhisattva: '#9370DB'
}

const roleLabels: Record<string, string> = {
  supreme: '至高神',
  buddha: '佛祖',
  bodhisattva: '菩萨'
}

const statusColors: Record<string, string> = {
  active: 'green',
  resting: 'orange',
  ascended: 'red'
}

const statusLabels: Record<string, string> = {
  active: '在位',
  resting: '休养中',
  ascended: '升天'
}

const GodCard: React.FC<{ god: God }> = ({ god }) => {
  return (
    <Card
      className="god-card"
      hoverable
      cover={
        <div className="god-avatar-container">
          <div className="god-avatar" style={{ borderColor: roleColors[god.role] || '#666' }}>
            {roleIcons[god.role] || <CrownOutlined />}
          </div>
          <div className="god-glow" style={{ backgroundColor: roleColors[god.role] || '#666' }} />
        </div>
      }
    >
      <div className="god-info">
        <Space direction="vertical" size="small" style={{ width: '100%', textAlign: 'center' }}>
          <Title level={4} className="god-name">
            {god.name}
          </Title>
          <Text type="secondary" className="god-title">
            {god.title}
          </Text>
          <Space size="small">
            <Tag color={roleColors[god.role]} icon={roleIcons[god.role]}>
              {roleLabels[god.role]}
            </Tag>
            <Badge status={statusColors[god.status] as any} text={statusLabels[god.status]} />
          </Space>
        </Space>
        
        <div className="god-stats">
          <div className="stat-item">
            <ThunderboltOutlined />
            <Text strong>神力</Text>
            <div className="power-bar">
              <div 
                className="power-fill" 
                style={{ 
                  width: `${god.power_level}%`,
                  backgroundColor: roleColors[god.role]
                }} 
              />
            </div>
            <Text type="secondary">{god.power_level}%</Text>
          </div>
        </div>
        
        {god.description && (
          <Paragraph className="god-description" ellipsis={{ rows: 3 }}>
            {god.description}
          </Paragraph>
        )}
        
        {god.blessing && (
          <div className="god-blessing">
            <Text type="secondary" italic>「{god.blessing}」</Text>
          </div>
        )}
        
        <Descriptions size="small" column={1} className="god-details">
          {god.temple_name && (
            <Descriptions.Item label="神殿">{god.temple_name}</Descriptions.Item>
          )}
          <Descriptions.Item label="统治">
            {god.reign_years.toLocaleString()} 年
          </Descriptions.Item>
          {god.is_eternal && (
            <Descriptions.Item label="性质">
              <Tag color="gold">永恒</Tag>
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>
    </Card>
  )
}

const GodTemple: React.FC = () => {
  const [gods, setGods] = useState<God[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGods()
  }, [])

  const loadGods = async () => {
    try {
      const response = await getGods()
      setGods(response.items)
    } catch (error) {
      message.error('加载神祇数据失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <Text>正在召唤诸神...</Text>
      </div>
    )
  }

  return (
    <div className="god-temple-container">
      <div className="temple-header">
        <Title level={2} className="temple-title">
          <CrownOutlined /> 诸神殿
        </Title>
        <Text type="secondary">
          共有 {gods.length} 位神祇镇守于此
        </Text>
      </div>
      
      <Row gutter={[24, 24]} className="god-grid">
        {gods.map((god) => (
          <Col key={god.god_id} xs={24} sm={12} lg={8}>
            <GodCard god={god} />
          </Col>
        ))}
      </Row>
      
      {gods.length === 0 && (
        <div className="empty-state">
          <CrownOutlined style={{ fontSize: 64, color: '#ccc' }} />
          <Title level={4} type="secondary">诸神殿尚未建立</Title>
          <Text type="secondary">等待神祇降临...</Text>
        </div>
      )}
    </div>
  )
}

export default GodTemple
