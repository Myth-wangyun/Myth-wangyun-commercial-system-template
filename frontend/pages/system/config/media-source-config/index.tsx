/**
 * 咨询配置 - 媒体来源管理
 * 管理量来源、媒体来源、细分媒体的三级配置
 * 以及咨询量导出审批人配置
 */

import React, { useEffect, useState } from 'react'
import { App,
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Popconfirm,
  Switch,
  InputNumber,
  Tabs,
  Tree,
  Alert,
  Spin,
  List,
  Avatar,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ApartmentOutlined,
  UserOutlined,
  ExportOutlined,
  SwapOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { DataNode } from 'antd/es/tree'
import { api } from '@/services/api'
import {
  fetchCampusOptions,
  fetchUserPermissions,
  type UserPermissionInfo,
} from '@/services/configMaster'
import {
  listTransferApprovalConfigs,
  upsertTransferApprovalConfig,
  type TransferApprovalConfig,
} from '@/services/consult/transferApprovalConfig'
import ScheduleConfigTab from './ScheduleConfigTab'


type ErrorWithResponse = {
  response?: {
    data?: {
      detail?: string
    }
  }
  message?: string
  errorFields?: unknown[]
}

const isFormError = (error: unknown): error is { errorFields: unknown[] } =>
  typeof error === 'object' && error !== null && 'errorFields' in error

const getErrorDetail = (error: unknown, fallback: string) => {
  const maybeError = error as ErrorWithResponse
  return maybeError.response?.data?.detail || maybeError.message || fallback
}

// ==================== 类型定义 ====================

interface MediaCategory {
  id: number
  name: string
  description?: string
  sort_order: number
  is_active: boolean
}

interface MediaSource {
  id: number
  media_category_id: number
  name: string
  description?: string
  sort_order: number
  is_active: boolean
  is_important: boolean
}

interface MediaDetail {
  id: number
  media_source_id: number
  name: string
  description?: string
  sort_order: number
  is_active: boolean
  is_important: boolean
}

interface TreeNode {
  id: number
  name: string
  description?: string
  sort_order: number
  is_active: boolean
  children?: TreeNode[]
}

// ==================== API 函数 ====================

const BASE_URL = '/config/media-source-config'

const fetchSourceCategories = async (): Promise<MediaCategory[]> => {
  const res = await api.get(`${BASE_URL}/media-categories`)
  return res.data.data
}

const createMediaCategory = async (data: Partial<MediaCategory>) => {
  const res = await api.post(`${BASE_URL}/media-categories`, data)
  return res.data
}

const updateMediaCategory = async (id: number, data: Partial<MediaCategory>) => {
  const res = await api.put(`${BASE_URL}/media-categories/${id}`, data)
  return res.data
}

const deleteMediaCategory = async (id: number) => {
  const res = await api.delete(`${BASE_URL}/media-categories/${id}`)
  return res.data
}

const fetchMediaSources = async (categoryId?: number): Promise<MediaSource[]> => {
  const params = categoryId ? { media_category_id: categoryId } : {}
  const res = await api.get(`${BASE_URL}/media-sources`, { params })
  return res.data.data
}

const createMediaSource = async (data: Partial<MediaSource>) => {
  const res = await api.post(`${BASE_URL}/media-sources`, data)
  return res.data
}

const updateMediaSource = async (id: number, data: Partial<MediaSource>) => {
  const res = await api.put(`${BASE_URL}/media-sources/${id}`, data)
  return res.data
}

const deleteMediaSource = async (id: number) => {
  const res = await api.delete(`${BASE_URL}/media-sources/${id}`)
  return res.data
}

const fetchMediaDetails = async (sourceId?: number): Promise<MediaDetail[]> => {
  const params = sourceId ? { media_source_id: sourceId } : {}
  const res = await api.get(`${BASE_URL}/media-details`, { params })
  return res.data.data
}

const createMediaDetail = async (data: Partial<MediaDetail>) => {
  const res = await api.post(`${BASE_URL}/media-details`, data)
  return res.data
}

const updateMediaDetail = async (id: number, data: Partial<MediaDetail>) => {
  const res = await api.put(`${BASE_URL}/media-details/${id}`, data)
  return res.data
}

const deleteMediaDetail = async (id: number) => {
  const res = await api.delete(`${BASE_URL}/media-details/${id}`)
  return res.data
}

const fetchTree = async (): Promise<TreeNode[]> => {
  const res = await api.get(`${BASE_URL}/tree`)
  return res.data.data
}

// ==================== 导出审批人相关 API ====================

interface ExportApprover {
  id: number
  user_id: number
  user_name: string
  real_name: string
  is_active: boolean
  created_at: string
}

interface UserInfo {
  user_id: number
  username: string
  real_name: string
  department?: string
  position?: string
}

const EXPORT_API_URL = '/consult/export'

const fetchExportApprovers = async (): Promise<ExportApprover[]> => {
  const res = await api.get(`${EXPORT_API_URL}/approvers`)
  return res.data.data || []
}

const addExportApprover = async (userId: number): Promise<ExportApprover> => {
  const res = await api.post(`${EXPORT_API_URL}/approvers`, { user_id: userId })
  return res.data.data
}

const removeExportApprover = async (approverId: number) => {
  const res = await api.delete(`${EXPORT_API_URL}/approvers/${approverId}`)
  return res.data
}

const searchUsers = async (keyword: string): Promise<UserInfo[]> => {
  const res = await api.get('/auth/users/search', { params: { keyword, limit: 20 } })
  return res.data.data || []
}

// ==================== 转量审批人相关 API ====================

// ==================== 主组件 ====================

const MediaSourceConfigPage: React.FC = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('tree')

  // 数据状态
  const [categories, setCategories] = useState<MediaCategory[]>([])
  const [mediaSources, setMediaSources] = useState<MediaSource[]>([])
  const [mediaDetails, setMediaDetails] = useState<MediaDetail[]>([])
  const [treeData, setTreeData] = useState<TreeNode[]>([])

  // 导出审批人状态
  const [exportApprovers, setExportApprovers] = useState<ExportApprover[]>([])
  const [approverLoading, setApproverLoading] = useState(false)
  const [addApproverModal, setAddApproverModal] = useState(false)
  const [userSearchResults, setUserSearchResults] = useState<UserInfo[]>([])
  const [userSearchLoading, setUserSearchLoading] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>()

  // 转量审批人状态
  const [transferApprovers, setTransferApprovers] = useState<TransferApprovalConfig[]>([])
  const [transferApproverLoading, setTransferApproverLoading] = useState(false)
  const [transferUsers, setTransferUsers] = useState<UserPermissionInfo[]>([])
  const [editingCampus, setEditingCampus] = useState<string | null>(null)
  const [editingApproverUserIds, setEditingApproverUserIds] = useState<number[]>([])

  // 筛选条件
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>()
  const [selectedSourceId, setSelectedSourceId] = useState<number | undefined>()

  // 弹窗状态
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; record?: MediaCategory }>({
    open: false,
  })
  const [sourceModal, setSourceModal] = useState<{ open: boolean; record?: MediaSource }>({
    open: false,
  })
  const [detailModal, setDetailModal] = useState<{ open: boolean; record?: MediaDetail }>({
    open: false,
  })

  // 表单
  const [categoryForm] = Form.useForm()
  const [sourceForm] = Form.useForm()
  const [detailForm] = Form.useForm()

  // ==================== 数据加载 ====================

  const loadCategories = async () => {
    try {
      console.log('开始加载量来源...')
      const data = await fetchSourceCategories()
      console.log('量来源加载成功:', data)
      setCategories(data)
    } catch (error) {
      console.error('加载量来源失败', error)
      message.error('加载量来源失败，请检查网络连接')
    }
  }

  const loadMediaSources = async (categoryId?: number) => {
    try {
      console.log('开始加载媒体来源...', categoryId)
      const data = await fetchMediaSources(categoryId)
      console.log('媒体来源加载成功:', data)
      setMediaSources(data)
    } catch (error) {
      console.error('加载媒体来源失败', error)
      message.error('加载媒体来源失败')
    }
  }

  const loadMediaDetails = async (sourceId?: number) => {
    try {
      console.log('开始加载细分媒体...', sourceId)
      const data = await fetchMediaDetails(sourceId)
      console.log('细分媒体加载成功:', data)
      setMediaDetails(data)
    } catch (error) {
      console.error('加载细分媒体失败', error)
      message.error('加载细分媒体失败')
    }
  }

  const loadTree = async () => {
    try {
      setLoading(true)
      const data = await fetchTree()
      setTreeData(data)
    } catch (error) {
      console.error('加载树形数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAllData = async () => {
    setLoading(true)
    await Promise.all([loadCategories(), loadMediaSources(), loadMediaDetails(), loadTree()])
    setLoading(false)
  }

  // 加载导出审批人
  const loadExportApprovers = async () => {
    setApproverLoading(true)
    try {
      const data = await fetchExportApprovers()
      setExportApprovers(data)
    } catch (error) {
      console.error('加载导出审批人失败', error)
    } finally {
      setApproverLoading(false)
    }
  }

  // 加载转量审批人配置
  const loadTransferApprovers = async () => {
    setTransferApproverLoading(true)
    try {
      const [configs, campuses, users] = await Promise.all([
        listTransferApprovalConfigs(),
        fetchCampusOptions(),
        fetchUserPermissions(),
      ])
      const campusList = Array.from(
        new Set([...campuses, ...configs.map((item) => item.campus)]),
      ).filter(Boolean)
      const configMap = new Map(configs.map((item) => [item.campus, item]))
      setTransferUsers(users.filter((item) => item.status === 'active'))
      setTransferApprovers(
        campusList.map((campus) => {
          const record = configMap.get(campus)
          return (
            record || {
              id: 0,
              campus,
              isActive: true,
              approvers: [],
              createdAt: '',
              updatedAt: '',
            }
          )
        }),
      )
    } catch (error) {
      console.error('加载转量审批人失败', error)
    } finally {
      setTransferApproverLoading(false)
    }
  }

  // 保存转量审批人
  const handleSaveTransferApprovers = async (campus: string) => {
    try {
      await upsertTransferApprovalConfig(campus, {
        approverUserIds: editingApproverUserIds,
        isActive: true,
      })
      message.success('保存成功')
      setEditingCampus(null)
      setEditingApproverUserIds([])
      loadTransferApprovers()
    } catch (error) {
      console.error('保存转量审批配置失败', error)
      message.error(getErrorDetail(error, '保存失败'))
    }
  }

  // 搜索用户
  const handleUserSearch = async (keyword: string) => {
    if (!keyword || keyword.length < 2) {
      setUserSearchResults([])
      return
    }
    setUserSearchLoading(true)
    try {
      const results = await searchUsers(keyword)
      setUserSearchResults(results)
    } catch (error) {
      console.error('搜索用户失败', error)
    } finally {
      setUserSearchLoading(false)
    }
  }

  // 添加审批人
  const handleAddApprover = async () => {
    if (!selectedUserId) {
      message.warning('请选择用户')
      return
    }
    try {
      await addExportApprover(selectedUserId)
      message.success('添加审批人成功')
      setAddApproverModal(false)
      setSelectedUserId(undefined)
      setUserSearchResults([])
      loadExportApprovers()
    } catch (error) {
      message.error(`添加审批人失败: ${getErrorDetail(error, '未知错误')}`)
    }
  }

  // 移除审批人
  const handleRemoveApprover = async (approverId: number) => {
    try {
      await removeExportApprover(approverId)
      message.success('移除审批人成功')
      loadExportApprovers()
    } catch {
      message.error('移除审批人失败')
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  // 当切换到导出配置标签时加载审批人
  useEffect(() => {
    if (activeTab === 'export') {
      loadExportApprovers()
    }
    if (activeTab === 'transfer') {
      loadTransferApprovers()
    }
  }, [activeTab])

  // ==================== 量来源操作 ====================

  const openCategoryModal = (record?: MediaCategory) => {
    setCategoryModal({ open: true, record })
    if (record) {
      categoryForm.setFieldsValue(record)
    } else {
      categoryForm.resetFields()
      categoryForm.setFieldsValue({ sort_order: 0, is_active: true })
    }
  }

  const submitCategory = async () => {
    try {
      const values = await categoryForm.validateFields()
      if (categoryModal.record) {
        await updateMediaCategory(categoryModal.record.id, values)
        message.success('更新成功')
      } else {
        await createMediaCategory(values)
        message.success('创建成功')
      }
      setCategoryModal({ open: false })
      loadAllData()
    } catch (error) {
      if (isFormError(error)) return
      message.error('操作失败')
    }
  }

  const handleDeleteCategory = async (id: number) => {
    try {
      await deleteMediaCategory(id)
      message.success('删除成功')
      loadAllData()
    } catch {
      message.error('删除失败')
    }
  }

  // ==================== 媒体来源操作 ====================

  const openSourceModal = (record?: MediaSource) => {
    setSourceModal({ open: true, record })
    if (record) {
      sourceForm.setFieldsValue(record)
    } else {
      sourceForm.resetFields()
      sourceForm.setFieldsValue({
        sort_order: 0,
        is_active: true,
        media_category_id: selectedCategoryId,
      })
    }
  }

  const submitSource = async () => {
    try {
      const values = await sourceForm.validateFields()
      if (sourceModal.record) {
        await updateMediaSource(sourceModal.record.id, values)
        message.success('更新成功')
      } else {
        await createMediaSource(values)
        message.success('创建成功')
      }
      setSourceModal({ open: false })
      loadAllData()
    } catch (error) {
      if (isFormError(error)) return
      message.error('操作失败')
    }
  }

  const handleDeleteSource = async (id: number) => {
    try {
      await deleteMediaSource(id)
      message.success('删除成功')
      loadAllData()
    } catch {
      message.error('删除失败')
    }
  }

  // ==================== 细分媒体操作 ====================

  const openDetailModal = (record?: MediaDetail) => {
    setDetailModal({ open: true, record })
    if (record) {
      detailForm.setFieldsValue(record)
    } else {
      detailForm.resetFields()
      detailForm.setFieldsValue({
        sort_order: 0,
        is_active: true,
        media_source_id: selectedSourceId,
      })
    }
  }

  const submitDetail = async () => {
    try {
      const values = await detailForm.validateFields()
      if (detailModal.record) {
        await updateMediaDetail(detailModal.record.id, values)
        message.success('更新成功')
      } else {
        await createMediaDetail(values)
        message.success('创建成功')
      }
      setDetailModal({ open: false })
      loadAllData()
    } catch (error) {
      if (isFormError(error)) return
      message.error('操作失败')
    }
  }

  const handleDeleteDetail = async (id: number) => {
    try {
      await deleteMediaDetail(id)
      message.success('删除成功')
      loadAllData()
    } catch {
      message.error('删除失败')
    }
  }

  // ==================== 初始化默认数据 ====================

  // ==================== 表格列定义 ====================

  const categoryColumns: ColumnsType<MediaCategory> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '量来源名称', dataIndex: 'name', width: 150 },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '排序', dataIndex: 'sort_order', width: 80 },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openCategoryModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除？删除后下属的媒体来源和细分媒体也会被删除"
            onConfirm={() => handleDeleteCategory(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const sourceColumns: ColumnsType<MediaSource> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '所属量来源',
      dataIndex: 'media_category_id',
      width: 120,
      render: (id: number) => categories.find((c) => c.id === id)?.name || '-',
    },
    { title: '媒体来源名称', dataIndex: 'name', width: 150 },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '排序', dataIndex: 'sort_order', width: 80 },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '重要来源',
      dataIndex: 'is_important',
      width: 90,
      render: (v: boolean, record) => (
        <Switch
          checked={v}
          size="small"
          checkedChildren="是"
          unCheckedChildren="否"
          onChange={async (checked) => {
            try {
              await updateMediaSource(record.id, { is_important: checked })
              message.success(checked ? '已设为重要来源' : '已取消重要来源')
              loadAllData()
            } catch {
              message.error('操作失败')
            }
          }}
        />
      ),
    },
    {
      title: '操作',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openSourceModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除？删除后下属的细分媒体也会被删除"
            onConfirm={() => handleDeleteSource(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const detailColumns: ColumnsType<MediaDetail> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '所属媒体来源',
      dataIndex: 'media_source_id',
      width: 120,
      render: (id: number) => mediaSources.find((s) => s.id === id)?.name || '-',
    },
    { title: '细分媒体名称', dataIndex: 'name', width: 150 },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '排序', dataIndex: 'sort_order', width: 80 },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '重要来源',
      dataIndex: 'is_important',
      width: 90,
      render: (v: boolean, record) => (
        <Switch
          checked={v}
          size="small"
          checkedChildren="是"
          unCheckedChildren="否"
          onChange={async (checked) => {
            try {
              await updateMediaDetail(record.id, { is_important: checked })
              message.success(checked ? '已设为重要来源' : '已取消重要来源')
              loadAllData()
            } catch {
              message.error('操作失败')
            }
          }}
        />
      ),
    },
    {
      title: '操作',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openDetailModal(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDeleteDetail(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // ==================== 树形视图 ====================

  const convertToTreeData = (nodes: TreeNode[], level: number = 0): DataNode[] => {
    return nodes.map((node) => ({
      key: `${level}-${node.id}`,
      title: (
        <span>
          {node.name}
          {!node.is_active && (
            <Tag color="default" style={{ marginLeft: 8 }}>
              禁用
            </Tag>
          )}
        </span>
      ),
      children: node.children ? convertToTreeData(node.children, level + 1) : undefined,
    }))
  }

  // ==================== 渲染 ====================

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <ApartmentOutlined />
            咨询配置 - 媒体来源管理
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadAllData}>
              刷新
            </Button>
          </Space>
        }
      >
        <Alert
          message="配置说明"
          description="量来源（一级）→ 媒体来源（二级）→ 细分媒体（三级），形成三级层级关系。删除上级会级联删除下级数据。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          {
            key: 'tree',
            label: '树形视图',
            children: (
            <Spin spinning={loading}>
              {treeData.length > 0 ? (
                <Tree showLine defaultExpandAll treeData={convertToTreeData(treeData)} />
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  暂无数据，请点击"初始化默认数据"或手动添加
                </div>
              )}
            </Spin>
            ),
          },
          {
            key: 'categories',
            label: '量来源管理',
            children: (<>
            <Space style={{ marginBottom: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openCategoryModal()}>
                新增量来源
              </Button>
            </Space>
            <Table
              columns={categoryColumns}
              dataSource={categories}
              rowKey="id"
              loading={loading}
              size="small"
              pagination={false}
            />
            </>),
          },
          {
            key: 'sources',
            label: '媒体来源管理',
            children: (<>
            <Space style={{ marginBottom: 16 }}>
              <Select
                placeholder="按量来源筛选"
                allowClear
                style={{ width: 200 }}
                value={selectedCategoryId}
                onChange={(v) => {
                  setSelectedCategoryId(v)
                  loadMediaSources(v)
                }}
              >
                {categories.map((c) => (
                  <Select.Option key={c.id} value={c.id}>
                    {c.name}
                  </Select.Option>
                ))}
              </Select>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openSourceModal()}>
                新增媒体来源
              </Button>
            </Space>
            <Table
              columns={sourceColumns}
              dataSource={
                selectedCategoryId
                  ? mediaSources.filter((s) => s.media_category_id === selectedCategoryId)
                  : mediaSources
              }
              rowKey="id"
              loading={loading}
              size="small"
              pagination={false}
            />
            </>),
          },
          {
            key: 'details',
            label: '细分媒体管理',
            children: (<>
            <Space style={{ marginBottom: 16 }}>
              <Select
                placeholder="按媒体来源筛选"
                allowClear
                style={{ width: 200 }}
                value={selectedSourceId}
                onChange={(v) => {
                  setSelectedSourceId(v)
                  loadMediaDetails(v)
                }}
              >
                {mediaSources.map((s) => (
                  <Select.Option key={s.id} value={s.id}>
                    {s.name}
                  </Select.Option>
                ))}
              </Select>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openDetailModal()}>
                新增细分媒体
              </Button>
            </Space>
            <Table
              columns={detailColumns}
              dataSource={
                selectedSourceId
                  ? mediaDetails.filter((d) => d.media_source_id === selectedSourceId)
                  : mediaDetails
              }
              rowKey="id"
              loading={loading}
              size="small"
              pagination={false}
            />
            </>),
          },
          {
            key: 'export',
            label: (<span><ExportOutlined /> 导出审批配置</span>),
            children: (<>
            <Alert
              message="咨询量导出审批配置"
              description="配置审批人后，只有审批人才能在祈福司门菜单中看到【咨询量导出审批】子菜单，并对导出申请进行审批。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Card
              title="导出审批人列表"
              size="small"
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setAddApproverModal(true)}
                >
                  添加审批人
                </Button>
              }
            >
              <List
                loading={approverLoading}
                dataSource={exportApprovers}
                locale={{ emptyText: '暂无审批人，请添加' }}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Popconfirm
                        key="remove"
                        title="确定移除该审批人？"
                        onConfirm={() => handleRemoveApprover(item.id)}
                      >
                        <Button type="link" danger size="small">
                          移除
                        </Button>
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={item.real_name}
                      description={`用户名: ${item.user_name} | 添加时间: ${item.created_at}`}
                    />
                    <Tag color={item.is_active ? 'green' : 'default'}>
                      {item.is_active ? '启用' : '禁用'}
                    </Tag>
                  </List.Item>
                )}
              />
            </Card>
            </>),
          },
          {
            key: 'transfer',
            label: (<span><SwapOutlined /> 转量审批配置</span>),
            children: (<>
            <Alert
              message="跨神殿转量审批配置"
              description="当咨询师进行跨神殿转量时，需要目标神殿的审批人审批通过后才能生效。请为每个神殿单独配置审批人，支持同一神殿配置多个审批人。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Card title="各神殿转量审批人配置" size="small">
              <Table
                loading={transferApproverLoading}
                dataSource={transferApprovers}
                rowKey="campus"
                size="small"
                pagination={false}
                columns={[
                  {
                    title: '神殿',
                    dataIndex: 'campus',
                    width: 150,
                    render: (text) => <Tag color="blue">{text}</Tag>,
                  },
                  {
                    title: '审批人',
                    dataIndex: 'approvers',
                    render: (_: unknown, record) => {
                      const campusUsers = transferUsers
                        .filter((item) => !item.campus || item.campus === record.campus)
                        .map((item) => ({
                          label: `${item.name} / ${item.department || '未设部门'} / ${item.position || '未设岗位'}`,
                          value: item.user_id,
                        }))
                      if (editingCampus === record.campus) {
                        return (
                          <Space>
                            <Select
                              mode="multiple"
                              value={editingApproverUserIds}
                              onChange={setEditingApproverUserIds}
                              options={campusUsers}
                              placeholder="请选择审批人"
                              style={{ width: 420 }}
                              optionFilterProp="label"
                            />
                            <Button
                              type="primary"
                              size="small"
                              onClick={() => handleSaveTransferApprovers(record.campus)}
                            >
                              保存
                            </Button>
                            <Button
                              size="small"
                              onClick={() => {
                                setEditingCampus(null)
                                setEditingApproverUserIds([])
                              }}
                            >
                              取消
                            </Button>
                          </Space>
                        )
                      }
                      return (
                        <Space wrap>
                          {record.approvers.length > 0 ? (
                            record.approvers.map((item) => (
                              <Tag key={item.id} color="green" icon={<UserOutlined />}>
                                {item.approverName}
                              </Tag>
                            ))
                          ) : (
                            <span style={{ color: '#999' }}>未配置审批人</span>
                          )}
                        </Space>
                      )
                    },
                  },
                  {
                    title: '操作',
                    width: 100,
                    render: (_, record) => (
                      <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                          setEditingCampus(record.campus)
                          setEditingApproverUserIds(
                            record.approvers.map((item) => item.approverUserId),
                          )
                        }}
                        disabled={editingCampus !== null}
                      >
                        编辑
                      </Button>
                    ),
                  },
                ]}
              />
            </Card>
            </>),
          },
          {
            key: 'schedule',
            label: (<span><ClockCircleOutlined /> 咨询量计算时间配置</span>),
            children: (
            <ScheduleConfigTab />
            ),
          },
        ]} />
      </Card>

      {/* 添加审批人弹窗 */}
      <Modal
        title="添加导出审批人"
        open={addApproverModal}
        onCancel={() => {
          setAddApproverModal(false)
          setSelectedUserId(undefined)
          setUserSearchResults([])
        }}
        onOk={handleAddApprover}
        okText="添加"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="搜索用户" required>
            <Select
              showSearch
              placeholder="输入用户名或姓名搜索"
              value={selectedUserId}
              onChange={setSelectedUserId}
              onSearch={handleUserSearch}
              loading={userSearchLoading}
              filterOption={false}
              notFoundContent={userSearchLoading ? <Spin size="small" /> : '未找到用户'}
              style={{ width: '100%' }}
            >
              {userSearchResults.map((user) => (
                <Select.Option key={user.user_id} value={user.user_id}>
                  {user.real_name} ({user.username}){user.department && ` - ${user.department}`}
                  {user.position && ` / ${user.position}`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
        <Alert
          message="提示"
          description="添加为审批人后，该用户将可以在祈福司门菜单中看到【咨询量导出审批】页面，对咨询量导出申请进行审批。"
          type="warning"
          showIcon
        />
      </Modal>

      {/* 量来源弹窗 */}
      <Modal
        title={categoryModal.record ? '编辑量来源' : '新增量来源'}
        open={categoryModal.open}
        onCancel={() => setCategoryModal({ open: false })}
        onOk={submitCategory}
        destroyOnClose
      >
        <Form form={categoryForm} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入量来源名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述（选填）" rows={2} />
          </Form.Item>
          <Form.Item name="sort_order" label="排序序号">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_active" label="是否启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* 媒体来源弹窗 */}
      <Modal
        title={sourceModal.record ? '编辑媒体来源' : '新增媒体来源'}
        open={sourceModal.open}
        onCancel={() => setSourceModal({ open: false })}
        onOk={submitSource}
        destroyOnClose
      >
        <Form form={sourceForm} layout="vertical">
          <Form.Item
            name="media_category_id"
            label="所属量来源"
            rules={[{ required: true, message: '请选择量来源' }]}
          >
            <Select placeholder="请选择量来源">
              {categories.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入媒体来源名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述（选填）" rows={2} />
          </Form.Item>
          <Form.Item name="sort_order" label="排序序号">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_active" label="是否启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* 细分媒体弹窗 */}
      <Modal
        title={detailModal.record ? '编辑细分媒体' : '新增细分媒体'}
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false })}
        onOk={submitDetail}
        destroyOnClose
      >
        <Form form={detailForm} layout="vertical">
          <Form.Item
            name="media_source_id"
            label="所属媒体来源"
            rules={[{ required: true, message: '请选择媒体来源' }]}
          >
            <Select placeholder="请选择媒体来源">
              {mediaSources.map((s) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入细分媒体名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述（选填）" rows={2} />
          </Form.Item>
          <Form.Item name="sort_order" label="排序序号">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_active" label="是否启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default MediaSourceConfigPage
