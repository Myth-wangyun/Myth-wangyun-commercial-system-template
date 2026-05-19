import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { App,
  Card,
  Row,
  Col,
  Table,
  Tree,
  Button,
  Space,
  Select,
  Input,
  Modal,
  Tag,
  Tooltip,
  Spin,
  Alert,
  Badge,
} from 'antd'
import {
  SearchOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  SaveOutlined,
  CopyOutlined,
  PlusOutlined,
  MinusOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { DataNode } from 'antd/es/tree'
import {
  fetchPermissionTree,
  fetchUsersWithPermissions,
  fetchFilterOptions,
  setUserPermissions,
  batchSetPermissions,
  batchAddPermissions,
  batchRemovePermissions,
  type PermissionNode,
  type UserWithPermissions,
  type FilterOptions,
} from '@/services/permissionManagement'

const { Option } = Select

/** 将后端权限树转为 antd Tree 需要的 DataNode */
function toTreeData(nodes: PermissionNode[]): DataNode[] {
  return nodes.map((n) => ({
    key: n.key,
    title: n.title,
    children: n.children ? toTreeData(n.children) : undefined,
  }))
}

/** 收集树中所有叶子节点的 key */
function collectLeafKeys(nodes: PermissionNode[]): string[] {
  const keys: string[] = []
  const walk = (list: PermissionNode[]) => {
    for (const n of list) {
      if (n.children && n.children.length > 0) {
        walk(n.children)
      } else {
        keys.push(n.key)
      }
    }
  }
  walk(nodes)
  return keys
}

const PermissionManagementPage: React.FC = () => {
  const { message, modal } = App.useApp()
  // ==================== State ====================
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<UserWithPermissions[]>([])
  const [permTree, setPermTree] = useState<PermissionNode[]>([])
  const [filterOpts, setFilterOpts] = useState<FilterOptions>({
    campuses: [],
    departments: [],
    positions: [],
  })

  // 筛选条件
  const [filterCampus, setFilterCampus] = useState<string | undefined>()
  const [filterDept, setFilterDept] = useState<string | undefined>()
  const [filterPos, setFilterPos] = useState<string | undefined>()
  const [filterName, setFilterName] = useState('')

  // 当前选中用户
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // 权限树选中（已勾选的权限key）
  const [checkedKeys, setCheckedKeys] = useState<string[]>([])
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])

  // 批量操作弹窗
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [batchMode, setBatchMode] = useState<'set' | 'add' | 'remove'>('set')
  const [batchCheckedKeys, setBatchCheckedKeys] = useState<string[]>([])

  // ==================== Derived ====================
  const treeData = useMemo(() => toTreeData(permTree), [permTree])
  const allLeafKeys = useMemo(() => collectLeafKeys(permTree), [permTree])

  const selectedUser = useMemo(
    () => users.find((u) => u.user_id === selectedUserId) ?? null,
    [users, selectedUserId],
  )

  // ==================== Load ====================
  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [tree, opts, userList] = await Promise.all([
        fetchPermissionTree(),
        fetchFilterOptions(),
        fetchUsersWithPermissions({
          campus: filterCampus,
          department: filterDept,
          position: filterPos,
          name: filterName || undefined,
        }),
      ])
      setPermTree(tree)
      setFilterOpts(opts)
      setUsers(userList)
      // 默认展开所有一级节点
      setExpandedKeys(tree.map((n) => n.key))
    } catch {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [filterCampus, filterDept, filterPos, filterName])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // 当选中用户变化时更新权限树勾选
  useEffect(() => {
    if (selectedUser) {
      setCheckedKeys(selectedUser.permissions)
    } else if (selectedRowKeys.length === 0) {
      setCheckedKeys([])
    }
    // 多选但无点击用户时保持当前 checkedKeys 不变，让用户自行勾选
  }, [selectedUser, selectedRowKeys.length])

  // 是否处于多选模式（勾选了多个用户）
  const isMultiSelect = selectedRowKeys.length > 1
  // 是否可以展示权限树（单选了用户 或 多选勾选了用户）
  const showPermTree = !!selectedUser || selectedRowKeys.length > 0

  // ==================== Handlers ====================
  const handleSaveUserPerms = async () => {
    // 多选模式：为所有勾选用户批量设置权限
    if (selectedRowKeys.length > 1) {
      const userIds = selectedRowKeys as number[]
      setSaving(true)
      try {
        await batchSetPermissions(userIds, checkedKeys)
        message.success(`已为 ${userIds.length} 个用户保存权限`)
        // 更新本地数据
        setUsers((prev) =>
          prev.map((u) =>
            userIds.includes(u.user_id) ? { ...u, permissions: [...checkedKeys] } : u,
          ),
        )
      } catch {
        message.error('批量保存失败')
      } finally {
        setSaving(false)
      }
      return
    }
    // 单选模式：为单个用户设置权限
    const effectiveUserId = selectedUserId ?? (selectedRowKeys.length === 1 ? Number(selectedRowKeys[0]) : null)
    if (!effectiveUserId) {
      message.warning('请先在左侧点击或勾选一个用户')
      return
    }
    if (!selectedUserId && effectiveUserId) {
      setSelectedUserId(effectiveUserId)
    }
    setSaving(true)
    try {
      await setUserPermissions(effectiveUserId, checkedKeys)
      message.success('权限保存成功')
      // 更新本地数据
      setUsers((prev) =>
        prev.map((u) => (u.user_id === effectiveUserId ? { ...u, permissions: checkedKeys } : u)),
      )
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleSelectAll = () => {
    setCheckedKeys(allLeafKeys)
  }

  const handleDeselectAll = () => {
    setCheckedKeys([])
  }

  const handleCopyPermissions = () => {
    if (!selectedUser) return
    if (selectedRowKeys.length === 0) {
      message.warning('请先在左侧勾选要复制到的目标用户')
      return
    }
    const targetIds = selectedRowKeys.filter((k) => k !== selectedUserId) as number[]
    if (targetIds.length === 0) {
      message.warning('目标用户不能是当前用户')
      return
    }
    modal.confirm({
      title: '复制权限确认',
      content: `将 ${selectedUser.real_name} 的权限复制给选中的 ${targetIds.length} 个用户？这将覆盖他们现有的权限设置。`,
      onOk: async () => {
        try {
          await batchSetPermissions(targetIds, selectedUser.permissions)
          message.success(`已将权限复制给 ${targetIds.length} 个用户`)
          loadAll()
        } catch {
          message.error('复制失败')
        }
      },
    })
  }

  // 批量操作
  const openBatchModal = (mode: 'set' | 'add' | 'remove') => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先在左侧勾选用户')
      return
    }
    setBatchMode(mode)
    setBatchCheckedKeys([])
    setBatchModalOpen(true)
  }

  const handleBatchConfirm = async () => {
    const userIds = selectedRowKeys as number[]
    if (userIds.length === 0) return
    setSaving(true)
    try {
      const modeLabel = batchMode === 'set' ? '设置' : batchMode === 'add' ? '追加' : '移除'
      if (batchMode === 'set') {
        await batchSetPermissions(userIds, batchCheckedKeys)
      } else if (batchMode === 'add') {
        await batchAddPermissions(userIds, batchCheckedKeys)
      } else {
        await batchRemovePermissions(userIds, batchCheckedKeys)
      }
      message.success(`批量${modeLabel}权限成功`)
      setBatchModalOpen(false)
      loadAll()
    } catch {
      message.error('批量操作失败')
    } finally {
      setSaving(false)
    }
  }

  // ==================== Table Columns ====================
  const columns: ColumnsType<UserWithPermissions> = [
    {
      title: '姓名',
      dataIndex: 'real_name',
      width: 90,
      fixed: 'left',
      render: (name: string, record) => (
        <a onClick={() => setSelectedUserId(record.user_id)}>{name}</a>
      ),
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      width: 80,
      render: (v: string | null) => v || '-',
    },
    {
      title: '部门',
      dataIndex: 'department',
      width: 90,
      render: (v: string | null) => v || '-',
    },
    {
      title: '岗位',
      dataIndex: 'position',
      width: 90,
      render: (v: string | null) => v || '-',
    },
    {
      title: '权限数',
      dataIndex: 'permissions',
      width: 70,
      align: 'center',
      render: (perms: string[]) => (
        <Badge
          count={perms.length}
          showZero
          style={{ backgroundColor: perms.length > 0 ? '#52c41a' : '#d9d9d9' }}
        />
      ),
      sorter: (a, b) => a.permissions.length - b.permissions.length,
    },
  ]

  // ==================== Render ====================
  return (
    <div style={{ padding: 16, background: '#f0f2f5', minHeight: '100vh' }}>
      <Card
        title={
          <Space>
            <SafetyCertificateOutlined />
            <span>权限划分管理</span>
          </Space>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadAll}>
            刷新
          </Button>
        }
        style={{ marginBottom: 16 }}
        size="small"
      >
        <Alert
          message="使用说明：左侧选择用户 → 右侧勾选功能权限 → 点击保存。也可批量勾选多个用户进行统一设置。"
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
        />

        {/* 筛选栏 */}
        <Row gutter={12} style={{ marginBottom: 12 }}>
          <Col span={5}>
            <Select
              placeholder="按神殿筛选"
              value={filterCampus}
              onChange={setFilterCampus}
              allowClear
              style={{ width: '100%' }}
              size="small"
            >
              {filterOpts.campuses.map((c) => (
                <Option key={c} value={c}>
                  {c}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={5}>
            <Select
              placeholder="按部门筛选"
              value={filterDept}
              onChange={setFilterDept}
              allowClear
              style={{ width: '100%' }}
              size="small"
            >
              {filterOpts.departments.map((d) => (
                <Option key={d} value={d}>
                  {d}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={5}>
            <Select
              placeholder="按岗位筛选"
              value={filterPos}
              onChange={setFilterPos}
              allowClear
              style={{ width: '100%' }}
              size="small"
            >
              {filterOpts.positions.map((p) => (
                <Option key={p} value={p}>
                  {p}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={5}>
            <Input
              placeholder="搜索姓名"
              prefix={<SearchOutlined />}
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              allowClear
              size="small"
            />
          </Col>
          <Col span={4}>
            <Space>
              <Tooltip title="批量覆盖设置权限">
                <Button size="small" icon={<TeamOutlined />} onClick={() => openBatchModal('set')}>
                  批量设置
                </Button>
              </Tooltip>
              <Tooltip title="批量追加权限">
                <Button size="small" icon={<PlusOutlined />} onClick={() => openBatchModal('add')}>
                  追加
                </Button>
              </Tooltip>
              <Tooltip title="批量移除权限">
                <Button
                  size="small"
                  icon={<MinusOutlined />}
                  danger
                  onClick={() => openBatchModal('remove')}
                >
                  移除
                </Button>
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        <Row gutter={16}>
          {/* ============ 左侧：用户列表 ============ */}
          <Col span={10}>
            <Card
              title={
                <Space>
                  <TeamOutlined />
                  <span>用户列表</span>
                  <Tag color="blue">{users.length} 人</Tag>
                </Space>
              }
              size="small"
              bodyStyle={{ padding: 0 }}
            >
              <Table<UserWithPermissions>
                rowKey="user_id"
                columns={columns}
                dataSource={users}
                size="small"
                pagination={{ defaultPageSize: 15, showSizeChanger: true, showTotal: (t) => `共 ${t} 人` }}
                scroll={{ y: 'calc(100vh - 360px)' }}
                rowSelection={{
                  selectedRowKeys,
                  onChange: (keys) => {
                    setSelectedRowKeys(keys)
                    if (keys.length === 1) {
                      const userId = Number(keys[0])
                      setSelectedUserId(userId)
                      const user = users.find((u) => u.user_id === userId)
                      if (user) {
                        message.info(`已选择用户：${user.real_name}`)
                      }
                    }
                  },
                }}
                onRow={(record) => ({
                  onClick: () => setSelectedUserId(record.user_id),
                  style: {
                    cursor: 'pointer',
                    background: record.user_id === selectedUserId ? '#e6f7ff' : undefined,
                  },
                })}
              />
            </Card>
          </Col>

          {/* ============ 右侧：权限树 ============ */}
          <Col span={14}>
            <Card
              title={
                <Space>
                  <SafetyCertificateOutlined />
                  <span>
                    功能权限
                    {isMultiSelect ? (
                      <>
                        {' - '}
                        <Tag color="orange">已选 {selectedRowKeys.length} 人</Tag>
                        <Tag color="warning">批量模式</Tag>
                      </>
                    ) : selectedUser ? (
                      <>
                        {' - '}
                        <Tag color="blue">{selectedUser.real_name}</Tag>
                        <Tag>{selectedUser.campus || '未分配神殿'}</Tag>
                        <Tag>{selectedUser.department || '未分配部门'}</Tag>
                      </>
                    ) : null}
                  </span>
                </Space>
              }
              extra={
                showPermTree && (
                  <Space>
                    <Button size="small" onClick={handleSelectAll}>
                      全选
                    </Button>
                    <Button size="small" onClick={handleDeselectAll}>
                      全不选
                    </Button>
                    {selectedUser && !isMultiSelect && (
                      <Tooltip title="将当前用户权限复制给左侧勾选的用户">
                        <Button size="small" icon={<CopyOutlined />} onClick={handleCopyPermissions}>
                          复制给选中用户
                        </Button>
                      </Tooltip>
                    )}
                    <Button
                      type="primary"
                      size="small"
                      icon={<SaveOutlined />}
                      loading={saving}
                      onClick={handleSaveUserPerms}
                    >
                      {isMultiSelect ? `保存权限 (${selectedRowKeys.length}人)` : '保存权限'}
                    </Button>
                  </Space>
                )
              }
              size="small"
              bodyStyle={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}
            >
              {!showPermTree ? (
                <div style={{ textAlign: 'center', color: '#999', padding: 60 }}>
                  <ExclamationCircleOutlined style={{ fontSize: 40, marginBottom: 12 }} />
                  <div>请在左侧点击或勾选用户以查看和编辑权限</div>
                </div>
              ) : (
                <>
                  {isMultiSelect && (
                    <Alert
                      message={`批量模式：当前已勾选 ${selectedRowKeys.length} 个用户，保存时将统一覆盖这些用户的权限`}
                      type="warning"
                      showIcon
                      style={{ marginBottom: 8 }}
                    />
                  )}
                  <Tree
                    checkable
                    checkStrictly={false}
                    treeData={treeData}
                    checkedKeys={checkedKeys}
                    expandedKeys={expandedKeys}
                    onExpand={(keys) => setExpandedKeys(keys as string[])}
                    onCheck={(checked) => {
                      const keys = Array.isArray(checked) ? checked : checked.checked
                      setCheckedKeys(keys as string[])
                    }}
                    style={{ padding: 8 }}
                    defaultExpandAll
                  />
                </>
              )}
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* ============ 批量操作弹窗 ============ */}
      <Modal
        title={
          <Space>
            <TeamOutlined />
            <span>
              {batchMode === 'set'
                ? '批量设置权限（覆盖）'
                : batchMode === 'add'
                  ? '批量追加权限'
                  : '批量移除权限'}
            </span>
            <Tag color="blue">{selectedRowKeys.length} 个用户</Tag>
          </Space>
        }
        open={batchModalOpen}
        onCancel={() => setBatchModalOpen(false)}
        onOk={handleBatchConfirm}
        confirmLoading={saving}
        width={700}
        okText="确认执行"
      >
        <Alert
          message={
            batchMode === 'set'
              ? '将选中用户的权限替换为以下勾选项（覆盖现有权限）'
              : batchMode === 'add'
                ? '在选中用户现有权限基础上追加以下勾选项'
                : '从选中用户现有权限中移除以下勾选项'
          }
          type={batchMode === 'remove' ? 'warning' : 'info'}
          showIcon
          style={{ marginBottom: 12 }}
        />
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          <Tree
            checkable
            checkStrictly={false}
            treeData={treeData}
            checkedKeys={batchCheckedKeys}
            defaultExpandAll
            onCheck={(checked) => {
              const keys = Array.isArray(checked) ? checked : checked.checked
              setBatchCheckedKeys(keys as string[])
            }}
          />
        </div>
      </Modal>
    </div>
  )
}

export default PermissionManagementPage
