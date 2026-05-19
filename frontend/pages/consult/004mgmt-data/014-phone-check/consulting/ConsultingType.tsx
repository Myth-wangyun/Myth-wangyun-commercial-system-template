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
  Switch,
  Tag,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { consultingMockService } from '@/services/mock/consultingMock'
import type {
  ConsultingTypeConfig,
  CreateConsultingTypeRequest,
  UpdateConsultingTypeRequest,
} from '@/types/consulting'
import { NoCopyContainer } from '@/components/common'

const { Title, Text } = Typography

const ConsultingType: React.FC = () => {
  const { message, modal } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ConsultingTypeConfig[]>([])
  const [formVisible, setFormVisible] = useState(false)
  const [editingType, setEditingType] = useState<ConsultingTypeConfig | null>(null)
  const [searchText, setSearchText] = useState('')
  const [filteredData, setFilteredData] = useState<ConsultingTypeConfig[]>([])

  // 表单状态
  const [formData, setFormData] = useState<CreateConsultingTypeRequest>({
    name: '',
    description: '',
    color: '#1890ff',
    isActive: true,
    sortOrder: 0,
  })

  // 加载数据
  const loadData = async () => {
    setLoading(true)
    try {
      const response = await consultingMockService.types.getList(currentCampus || undefined)
      setData(response.data || [])
      setFilteredData(response.data || [])
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
          (item.description && item.description.toLowerCase().includes(searchText.toLowerCase())),
      )
      setFilteredData(filtered)
    }
  }, [searchText, data])

  // 处理新增
  const handleAdd = () => {
    setEditingType(null)
    setFormData({
      name: '',
      description: '',
      color: '#1890ff',
      isActive: true,
      sortOrder: data.length,
    })
    setFormVisible(true)
  }

  // 处理编辑
  const handleEdit = (type: ConsultingTypeConfig) => {
    setEditingType(type)
    setFormData({
      name: type.name,
      description: type.description || '',
      color: type.color,
      isActive: type.isActive,
      sortOrder: type.sortOrder,
    })
    setFormVisible(true)
  }

  // 处理删除
  const handleDelete = (type: ConsultingTypeConfig) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除咨询类型 "${type.name}" 吗？`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await consultingMockService.types.delete(type.id, currentCampus || undefined)
          message.success('删除成功')
          loadData()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  // 处理状态切换
  const handleStatusToggle = async (type: ConsultingTypeConfig) => {
    try {
      const updateData: UpdateConsultingTypeRequest = {
        id: type.id,
        isActive: !type.isActive,
      }
      await consultingMockService.types.update(updateData, currentCampus || undefined)
      message.success('状态更新成功')
      loadData()
    } catch (error) {
      message.error('状态更新失败')
    }
  }

  // 处理表单提交
  const handleFormSubmit = async () => {
    try {
      if (editingType) {
        const updateData: UpdateConsultingTypeRequest = {
          id: editingType.id,
          ...formData,
        }
        await consultingMockService.types.update(updateData, currentCampus || undefined)
        message.success('更新成功')
      } else {
        await consultingMockService.types.create(formData, currentCampus || undefined)
        message.success('保存成功')
      }
      setFormVisible(false)
      loadData()
    } catch (error) {
      message.error(editingType ? '更新失败' : '保存失败')
    }
  }

  // 表格列定义
  const columns: ColumnsType<ConsultingTypeConfig> = [
    {
      title: '序号',
      key: 'index',
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: '类型名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text: string, record: ConsultingTypeConfig) => (
        <Space>
          <Tag color={record.color}>{text}</Tag>
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      width: 100,
      render: (color: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 20,
              height: 20,
              backgroundColor: color,
              borderRadius: 4,
              border: '1px solid #d9d9d9',
            }}
          />
          <span style={{ fontSize: '12px' }}>{color}</span>
        </div>
      ),
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      sorter: (a, b) => a.sortOrder - b.sortOrder,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record: ConsultingTypeConfig) => (
        <Switch
          checked={isActive}
          onChange={() => handleStatusToggle(record)}
          checkedChildren={<EyeOutlined />}
          unCheckedChildren={<EyeInvisibleOutlined />}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (text: string) => (text ? new Date(text).toLocaleDateString('zh-CN') : '-'),
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
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
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
          咨询类型管理
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增类型
          </Button>
        </Space>
      </div>

      {/* 搜索栏 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="搜索类型名称或描述"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Text type="secondary">共 {filteredData.length} 个咨询类型</Text>
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
          scroll={{ x: 1000 }}
          size="small"
        />
      </Card>

      {/* 表单模态框 */}
      <Modal
        title={editingType ? '编辑咨询类型' : '新增咨询类型'}
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        onOk={handleFormSubmit}
        width={600}
        destroyOnHidden
      >
        <div style={{ padding: '20px 0' }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>类型名称 *</Text>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入类型名称"
                style={{ marginTop: 4 }}
              />
            </Col>
            <Col span={12}>
              <Text strong>排序 *</Text>
              <Input
                type="number"
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                }
                placeholder="请输入排序值"
                style={{ marginTop: 4 }}
                min="0"
              />
            </Col>
            <Col span={24}>
              <Text strong>描述</Text>
              <Input.TextArea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入类型描述"
                rows={3}
                style={{ marginTop: 4 }}
              />
            </Col>
            <Col span={12}>
              <Text strong>显示颜色 *</Text>
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    backgroundColor: formData.color,
                    borderRadius: 4,
                    border: '1px solid #d9d9d9',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    // 简单的颜色选择器
                    const colors = [
                      '#1890ff',
                      '#52c41a',
                      '#faad14',
                      '#f5222d',
                      '#722ed1',
                      '#13c2c2',
                      '#fa8c16',
                      '#eb2f96',
                    ]
                    const currentIndex = colors.indexOf(formData.color)
                    const nextIndex = (currentIndex + 1) % colors.length
                    setFormData({ ...formData, color: colors[nextIndex] })
                  }}
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#1890ff"
                  style={{ flex: 1 }}
                />
              </div>
            </Col>
            <Col span={12}>
              <Text strong>启用状态</Text>
              <div style={{ marginTop: 4 }}>
                <Switch
                  checked={formData.isActive}
                  onChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  checkedChildren="启用"
                  unCheckedChildren="禁用"
                />
              </div>
            </Col>
          </Row>
        </div>
      </Modal>
    </NoCopyContainer>
  )
}

export default ConsultingType
