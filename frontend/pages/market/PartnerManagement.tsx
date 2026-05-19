import React, { useState, useEffect } from 'react'
import { App,
  Card,
  Row,
  Col,
  Typography,
  Button,
  Table,
  Space,
  Modal,
  Input,
  Select,
  Tag,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { marketMockService } from '@/services/mock/marketMock'
import type { MarketPartner, CreatePartnerRequest, UpdatePartnerRequest } from '@/types/market'
import { MEDIA_SOURCE_OPTIONS } from '@/types/market'

const { Title, Text } = Typography
const { Option } = Select

const PartnerManagement: React.FC = () => {
  const { message, modal } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<MarketPartner[]>([])
  const [formVisible, setFormVisible] = useState(false)
  const [editingPartner, setEditingPartner] = useState<MarketPartner | null>(null)
  const [searchText, setSearchText] = useState('')
  const [filteredData, setFilteredData] = useState<MarketPartner[]>([])

  // 表单状态
  const [formData, setFormData] = useState<CreatePartnerRequest>({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    mediaSource: '百度',
    address: '',
    notes: '',
  })

  // 加载数据
  const loadData = async () => {
    setLoading(true)
    try {
      const response = await marketMockService.partners.getList({}, currentCampus || undefined)
      setData(response.data)
      setFilteredData(response.data)
    } catch (error) {
      message.error('加载数据失败')
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentCampus])

  // 搜索过滤
  useEffect(() => {
    if (!searchText) {
      setFilteredData(data)
    } else {
      const filtered = data.filter(
        (item) =>
          item.name.toLowerCase().includes(searchText.toLowerCase()) ||
          item.contactPerson.toLowerCase().includes(searchText.toLowerCase()) ||
          item.phone.includes(searchText) ||
          (item.email || '').toLowerCase().includes(searchText.toLowerCase()),
      )
      setFilteredData(filtered)
    }
  }, [searchText, data])

  // 处理新增
  const handleAdd = () => {
    setEditingPartner(null)
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      mediaSource: '百度',
      address: '',
      notes: '',
    })
    setFormVisible(true)
  }

  // 处理编辑
  const handleEdit = (partner: MarketPartner) => {
    setEditingPartner(partner)
    setFormData({
      name: partner.name,
      contactPerson: partner.contactPerson,
      phone: partner.phone,
      email: partner.email,
      mediaSource: partner.mediaSource,
      address: partner.address,
      notes: partner.notes,
    })
    setFormVisible(true)
  }

  // 处理删除
  const handleDelete = (partner: MarketPartner) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除合作方 "${partner.name}" 吗？`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await marketMockService.partners.delete(partner.id, currentCampus || undefined)
          message.success('删除成功')
          loadData()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  // 处理表单提交
  const handleFormSubmit = async () => {
    try {
      if (editingPartner) {
        const updateData: UpdatePartnerRequest = {
          id: editingPartner.id,
          ...formData,
        }
        await marketMockService.partners.update(updateData, currentCampus || undefined)
        message.success('更新成功')
      } else {
        await marketMockService.partners.create(formData, currentCampus || undefined)
        message.success('保存成功')
      }
      setFormVisible(false)
      loadData()
    } catch (error) {
      message.error(editingPartner ? '更新失败' : '保存失败')
    }
  }

  // 表格列定义
  const columns: ColumnsType<MarketPartner> = [
    {
      title: '序号',
      key: 'index',
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: '合作方名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      fixed: 'left',
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: 120,
      render: (text: string) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (text: string) => (
        <Space>
          <PhoneOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      render: (text: string) => (
        <Space>
          <MailOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '媒体来源',
      dataIndex: 'mediaSource',
      key: 'mediaSource',
      width: 120,
      render: (value: string) => {
        const option = MEDIA_SOURCE_OPTIONS.find((opt) => opt.value === value)
        return <Tag color="blue">{option?.label || value}</Tag>
      },
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      width: 200,
      ellipsis: true,
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 150,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* 页面标题和操作按钮 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          合作方联系方式
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增合作方
          </Button>
        </Space>
      </div>

      {/* 搜索栏 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="搜索合作方名称、联系人、电话或邮箱"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Text type="secondary">共 {filteredData.length} 个合作方</Text>
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
          }}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>

      {/* 表单模态框 */}
      <Modal
        title={editingPartner ? '编辑合作方' : '新增合作方'}
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        onOk={handleFormSubmit}
        width={600}
        destroyOnHidden
      >
        <div style={{ padding: '20px 0' }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>合作方名称 *</Text>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入合作方名称"
                style={{ marginTop: 4 }}
              />
            </Col>
            <Col span={12}>
              <Text strong>联系人 *</Text>
              <Input
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="请输入联系人姓名"
                style={{ marginTop: 4 }}
              />
            </Col>
            <Col span={12}>
              <Text strong>联系电话 *</Text>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="请输入联系电话"
                style={{ marginTop: 4 }}
              />
            </Col>
            <Col span={12}>
              <Text strong>邮箱</Text>
              <Input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="请输入邮箱地址"
                style={{ marginTop: 4 }}
              />
            </Col>
            <Col span={12}>
              <Text strong>媒体来源 *</Text>
              <Select
                value={formData.mediaSource}
                onChange={(value) => setFormData({ ...formData, mediaSource: value })}
                style={{ width: '100%', marginTop: 4 }}
              >
                {MEDIA_SOURCE_OPTIONS.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={24}>
              <Text strong>地址</Text>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="请输入详细地址"
                style={{ marginTop: 4 }}
              />
            </Col>
            <Col span={24}>
              <Text strong>备注</Text>
              <Input.TextArea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="请输入备注信息"
                rows={3}
                style={{ marginTop: 4 }}
              />
            </Col>
          </Row>
        </div>
      </Modal>
    </div>
  )
}

export default PartnerManagement
