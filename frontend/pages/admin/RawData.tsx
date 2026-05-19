import React, { useState, useEffect } from 'react'
import {
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Typography,
  message,
  Spin,
  Descriptions,
  Tag,
  Alert
} from 'antd'
import {
  DatabaseOutlined,
  TeamOutlined,
  BankOutlined,
  TableOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { isAdminLoggedIn } from '@/services/god'
import AdminLogin from './AdminLogin'
import './RawData.css'

const { Title, Text } = Typography

// 数据库表信息
const TABLE_INFO = [
  {
    key: 'users',
    name: 'users',
    icon: <TeamOutlined />,
    description: '用户表 - 存储系统用户信息',
    count: '动态'
  },
  {
    key: 'campus',
    name: 'campus_info',
    icon: <BankOutlined />,
    description: '神殿表 - 存储神殿基本信息',
    count: '动态'
  },
  {
    key: 'teachers',
    name: 'teacher_kpi',
    icon: <TeamOutlined />,
    description: '教员KPI表',
    count: '动态'
  },
  {
    key: 'students',
    name: 'student_profiles',
    icon: <TeamOutlined />,
    description: '学员档案表',
    count: '动态'
  },
  {
    key: 'academic',
    name: 'academic_*',
    icon: <TableOutlined />,
    description: '学术相关数据表',
    count: '多个'
  },
  {
    key: 'teaching',
    name: 'teaching_quality_*',
    icon: <TableOutlined />,
    description: '教质相关数据表',
    count: '多个'
  },
  {
    key: 'employment',
    name: 'employment_*',
    icon: <TableOutlined />,
    description: '就业相关数据表',
    count: '多个'
  },
  {
    key: 'market',
    name: 'market_*',
    icon: <TableOutlined />,
    description: '市场相关数据表',
    count: '多个'
  }
]

const RawData: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = () => {
    setIsAuthenticated(isAdminLoggedIn())
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="loading-wrapper">
        <Spin size="large" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminLogin />
  }

  return (
    <div className="raw-data-container">
      <div className="raw-data-header">
        <Space>
          <DatabaseOutlined style={{ fontSize: 32, color: '#1890ff' }} />
          <div>
            <Title level={3} style={{ margin: 0 }}>原始数据管理</Title>
            <Text type="secondary">数据库核心表结构与数据概览</Text>
          </div>
        </Space>
      </div>

      <Alert
        type="info"
        showIcon
        message="提示"
        description="以下展示的是数据库中的原始数据表结构。这些数据是系统的核心数据，请谨慎操作。"
        style={{ marginBottom: 24 }}
      />

      <Tabs
        defaultActiveKey="tables"
        items={[
          {
            key: 'tables',
            label: (
              <span>
                <TableOutlined />
                数据表
              </span>
            ),
            children: (
              <Card>
                <Table
                  dataSource={TABLE_INFO}
                  rowKey="key"
                  pagination={false}
                  columns={[
                    {
                      title: '表名',
                      dataIndex: 'name',
                      render: (name, record) => (
                        <Space>
                          {record.icon}
                          <Text code>{name}</Text>
                        </Space>
                      )
                    },
                    {
                      title: '描述',
                      dataIndex: 'description'
                    },
                    {
                      title: '记录数',
                      dataIndex: 'count',
                      render: (count) => (
                        <Tag color="blue">{count}</Tag>
                      )
                    }
                  ]}
                />
              </Card>
            )
          },
          {
            key: 'structure',
            label: (
              <span>
                <DatabaseOutlined />
                表结构
              </span>
            ),
            children: (
              <Card title="主要数据表结构">
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="users (用户表)">
                    user_id, username, password_hash, real_name, email, phone, 
                    department, position, campus, role, status, is_superuser, 
                    created_at, updated_at
                  </Descriptions.Item>
                  <Descriptions.Item label="campus_info (神殿表)">
                    campus_id, name, code, address, contact_person, contact_phone,
                    status, created_at, updated_at
                  </Descriptions.Item>
                  <Descriptions.Item label="teacher_kpi (教员KPI)">
                    kpi_id, teacher_id, campus, month, kpi_type, score,
                    created_at, updated_at
                  </Descriptions.Item>
                  <Descriptions.Item label="gods (神祇表)">
                    god_id, name, title, role, status, description, power_level,
                    avatar, temple_name, blessing, is_eternal, reign_years
                  </Descriptions.Item>
                  <Descriptions.Item label="admin_users (管理员表)">
                    admin_id, username, password_hash, nickname, role,
                    is_active, last_login, created_at
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )
          },
          {
            key: 'sql',
            label: (
              <span>
                <TableOutlined />
                SQL查询
              </span>
            ),
            children: (
              <Card title="常用SQL查询示例">
                <pre className="sql-code">
{`-- 查看所有神祇
SELECT * FROM gods ORDER BY power_level DESC;

-- 查看所有管理员
SELECT admin_id, username, nickname, role, is_active FROM admin_users;

-- 查看用户总数
SELECT COUNT(*) as total_users FROM users;

-- 查看神殿列表
SELECT * FROM campus_info WHERE status = 'active';

-- 查看活跃教员
SELECT u.real_name, u.campus, t.* 
FROM users u 
JOIN teacher_kpi t ON u.user_id = t.teacher_id
WHERE u.role = 'teacher' AND u.status = 'active';`}
                </pre>
              </Card>
            )
          }
        ]}
      />
    </div>
  )
}

export default RawData
