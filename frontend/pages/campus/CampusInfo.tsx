import React, { useState, useEffect } from 'react'
import { App,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Tag,
  Button,
  Modal,
  Popconfirm,
  Spin,
} from 'antd'
import {
  GlobalOutlined,
  MobileOutlined,
  UserOutlined,
  BookOutlined,
  BankOutlined,
  TeamOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { type Campus } from '@/stores/campusStore'
import { campusMockService } from '@/services/mock/campusMock'
import CampusEditModal from '../../components/forms/CampusEditModal'
import { type CampusStats } from '@/services/campus'

const { Title, Text } = Typography

// 确保URL有协议前缀
const ensureProtocol = (url: string): string => {
  if (!url || url === '#') return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return `http://${url}`
}

const CampusInfo: React.FC = () => {
  const { message } = App.useApp()
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [stats, setStats] = useState<CampusStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 加载数据
  const loadData = async () => {
    setLoading(true)
    try {
      const [campusesRes, statsRes] = await Promise.all([
        campusMockService.getAllCampuses(),
        campusMockService.getCampusStats(),
      ])
      setCampuses(campusesRes.data)
      setStats(statsRes.data)
    } catch (error) {
      message.error('加载数据失败')
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // 处理编辑神殿
  const handleEditCampus = (campus: Campus) => {
    setEditingCampus(campus)
    setEditModalVisible(true)
  }

  // 处理添加神殿
  const handleAddCampus = () => {
    setEditingCampus(null)
    setEditModalVisible(true)
  }

  // 确认删除神殿
  const confirmDeleteCampus = async (campus: Campus) => {
    console.log('[CampusInfo] 确认删除, id:', campus.id)
    setDeleteLoading(true)
    try {
      await campusMockService.deleteCampus(campus.id)
      message.success('删除成功')
      loadData()
    } catch (error) {
      console.error('[CampusInfo] 删除失败:', error)
      message.error('删除失败')
    } finally {
      setDeleteLoading(false)
    }
  }

  // 处理保存神殿
  const handleSaveCampus = async (campusData: Campus) => {
    try {
      if (editingCampus) {
        await campusMockService.updateCampus(editingCampus.id, campusData)
        message.success('更新成功')
      } else {
        await campusMockService.createCampus(campusData)
        message.success('创建成功')
      }
      setEditModalVisible(false)
      loadData()
    } catch (error) {
      message.error('保存失败')
    }
  }

  // 处理查看详情
  const handleViewDetail = (campus: Campus) => {
    setSelectedCampus(campus)
    setDetailModalVisible(true)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载中...</div>
      </div>
    )
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          神殿信息
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCampus}>
            添加神殿
          </Button>
        </Space>
      </div>

      {/* 神殿卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {campuses.map((campus) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={campus.id}>
            <Card
              className="campus-card"
              style={{
                borderLeft: `4px solid ${campus.color}`,
                height: '100%',
              }}
              hoverable
              actions={[
                <Button
                  type="link"
                  size="small"
                  icon={<InfoCircleOutlined />}
                  onClick={() => handleViewDetail(campus)}
                >
                  详情
                </Button>,
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEditCampus(campus)}
                >
                  编辑
                </Button>,
                campus.website && campus.website !== '#' ? (
                  <a href={ensureProtocol(campus.website)} target="_blank" rel="noopener noreferrer">
                    <Button type="link" size="small" icon={<GlobalOutlined />}>
                      
                    </Button>
                  </a>
                ) : (
                  <Button type="link" size="small" icon={<GlobalOutlined />} disabled>
                    
                  </Button>
                ),
                campus.mobileWebsite && campus.mobileWebsite !== '#' ? (
                  <a href={ensureProtocol(campus.mobileWebsite)} target="_blank" rel="noopener noreferrer">
                    <Button type="link" size="small" icon={<MobileOutlined />}>
                      
                    </Button>
                  </a>
                ) : (
                  <Button type="link" size="small" icon={<MobileOutlined />} disabled>
                    
                  </Button>
                ),
                <Popconfirm
                  title={`确定删除神殿"${campus.name}"吗？`}
                  okText="确认删除"
                  cancelText="取消"
                  okType="danger"
                  okButtonProps={{ loading: deleteLoading }}
                  onConfirm={() => confirmDeleteCampus(campus)}
                >
                  <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>,
              ]}
            >
              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 8 }}>
                  <Title level={4} style={{ margin: 0 }}>
                    {campus.name}
                  </Title>
                </div>

                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <GlobalOutlined style={{ color: '#1890ff' }} />
                    <Text ellipsis={{ tooltip: campus.website }}>
                      :
                      {campus.website && campus.website !== '#' ? (
                        <a
                          href={ensureProtocol(campus.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#1890ff', textDecoration: 'none' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {campus.website}
                        </a>
                      ) : (
                        <span style={{ color: '#999' }}>暂无</span>
                      )}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MobileOutlined style={{ color: '#52c41a' }} />
                    <Text ellipsis={{ tooltip: campus.mobileWebsite }}>
                      :
                      {campus.mobileWebsite && campus.mobileWebsite !== '#' ? (
                        <a
                          href={ensureProtocol(campus.mobileWebsite)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#52c41a', textDecoration: 'none' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {campus.mobileWebsite}
                        </a>
                      ) : (
                        <span style={{ color: '#999' }}>暂无</span>
                      )}
                    </Text>
                  </div>
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="在校学生"
              value={stats?.totalStudents || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card success">
            <Statistic
              title="教职工"
              value={stats?.totalStaff || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card warning">
            <Statistic
              title="专业课程"
              value={stats?.totalCourses || 0}
              prefix={<BookOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card purple">
            <Statistic
              title="神殿总数"
              value={stats?.totalCampuses || 0}
              prefix={<BankOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 编辑模态框 */}
      <CampusEditModal
        visible={editModalVisible}
        campus={editingCampus}
        onCancel={() => setEditModalVisible(false)}
        onSave={handleSaveCampus}
      />

      {/* 详情模态框 */}
      <Modal
        title={`${selectedCampus?.name} - 详细信息`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {selectedCampus && (
          <div>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>神殿名称：</Text>
                <Text>{selectedCampus.name}</Text>
              </div>
              <div>
                <Text strong>：</Text>
                {selectedCampus.website && selectedCampus.website !== '#' ? (
                  <div style={{ marginTop: 4 }}>
                    <Text copyable>{selectedCampus.website}</Text>
                    <br />
                    <a
                      href={selectedCampus.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1890ff' }}
                    >
                      点击访问 →
                    </a>
                  </div>
                ) : (
                  <Text style={{ color: '#999' }}>暂无</Text>
                )}
              </div>
              <div>
                <Text strong>：</Text>
                {selectedCampus.mobileWebsite && selectedCampus.mobileWebsite !== '#' ? (
                  <div style={{ marginTop: 4 }}>
                    <Text copyable>{selectedCampus.mobileWebsite}</Text>
                    <br />
                    <a
                      href={selectedCampus.mobileWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#52c41a' }}
                    >
                      点击访问 →
                    </a>
                  </div>
                ) : (
                  <Text style={{ color: '#999' }}>暂无</Text>
                )}
              </div>
              <div>
                <Text strong>主题颜色：</Text>
                <div
                  style={{
                    display: 'inline-block',
                    width: 20,
                    height: 20,
                    backgroundColor: selectedCampus.color,
                    borderRadius: 4,
                    marginLeft: 8,
                  }}
                ></div>
                <Text style={{ marginLeft: 8 }}>{selectedCampus.color}</Text>
              </div>
            </Space>
          </div>
        )}
      </Modal>

    </div>
  )
}

export default CampusInfo
