import React from 'react'
import { Card, Typography, Row, Col, Space } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  BankOutlined,
  BarChartOutlined,
  TrophyOutlined,
  SoundOutlined,
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  FileTextOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

const ManagementCenterPage: React.FC = () => {
  const navigate = useNavigate()

  const tables = [
    { key: 'mgmt-core-summary', label: '核心数据汇总表', icon: <BarChartOutlined /> },
    { key: 'mgmt-employment-summary', label: '后端学员就业汇总表', icon: <TrophyOutlined /> },
    { key: 'mgmt-reputation-enrollment', label: '口碑招生汇总表', icon: <SoundOutlined /> },
    { key: 'mgmt-student-stability', label: '新生维稳汇总表', icon: <UserOutlined /> },
    { key: 'mgmt-teacher-staffing', label: '师资配比表', icon: <TeamOutlined /> },
    { key: 'mgmt-onboarding-offboarding', label: '入职离职汇总表', icon: <UserOutlined /> },
    { key: 'mgmt-training-summary', label: '培训计划与成绩汇总表', icon: <BookOutlined /> },
    { key: 'mgmt-manager-analysis', label: '经理、副经理功能分析表', icon: <UserOutlined /> },
    { key: 'mgmt-network-survey', label: '网络调查汇总表', icon: <BarChartOutlined /> },
    { key: 'mgmt-enterprise-survey', label: '企业调查汇总表', icon: <BarChartOutlined /> },
    { key: 'mgmt-position-analysis', label: '岗位分析报告汇总表', icon: <BarChartOutlined /> },
    { key: 'mgmt-courseware-writing', label: '课件编写汇总表', icon: <FileTextOutlined /> },
    { key: 'mgmt-questionbank-writing', label: '题库编写汇总表', icon: <FileTextOutlined /> },
  ]

  const handleClick = (key: string) => {
    const routeMap: Record<string, string> = {
      'mgmt-core-summary': '/academic/teaching-content?tab=001',
      'mgmt-employment-summary': '/academic/teaching-content?tab=002',
      'mgmt-reputation-enrollment': '/academic/teaching-content?tab=003',
      'mgmt-student-stability': '/academic/teaching-content?tab=004',
      'mgmt-teacher-staffing': '/academic/teaching-content?tab=013',
      'mgmt-onboarding-offboarding': '/academic/teaching-content?tab=005',
      'mgmt-training-summary': '/academic/teaching-content?tab=006',
      'mgmt-manager-analysis': '/academic/teaching-content?tab=016',
      'mgmt-network-survey': '/academic/teaching-content?tab=008',
      'mgmt-enterprise-survey': '/academic/teaching-content?tab=009',
      'mgmt-position-analysis': '/academic/teaching-content?tab=010',
      'mgmt-courseware-writing': '/academic/teaching-content?tab=011',
      'mgmt-questionbank-writing': '/academic/teaching-content?tab=012',
    }

    const route = routeMap[key]
    if (route) {
      navigate(route)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
      <div className="mb-4">
        <Title level={2}>
          <Space>
            <BankOutlined />
            最高议事厅
          </Space>
        </Title>
        <Text type="secondary">智慧司门最高议事厅数据和统计，点击下方卡片查看详细表格</Text>
      </div>

      {/* 表格卡片网格 */}
      <Row gutter={[16, 16]}>
        {tables.map((table) => (
          <Col xs={24} sm={12} md={8} lg={6} key={table.key}>
            <Card
              hoverable
              onClick={() => handleClick(table.key)}
              style={{
                cursor: 'pointer',
                textAlign: 'center',
                height: '100%',
              }}
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ fontSize: '32px', color: '#1890ff' }}>{table.icon}</div>
                <Text strong style={{ fontSize: '14px' }}>
                  {table.label}
                </Text>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}

export default ManagementCenterPage
