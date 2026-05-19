/**
 * 统一的神殿选择器组件
 * 支持两种模式：
 * 1. 全局状态模式（useGlobalState=true）：自动使用 useCampusStore
 * 2. 受控组件模式：通过 value/onChange/campuses props 控制
 *
 * 功能特性：
 * - 搜索过滤
 * - 添加神殿
 * - 标签显示
 * - 灵活的样式配置
 */

import React, { useEffect, useState } from 'react'
import { Select, Space, Tag, Button, Divider, Modal, Form, Input, App } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { useAuthStore } from '@/stores/authStore'
import { sortCampuses } from '@/utils/campusSort'

export interface CampusSelectorProps {
  // 受控组件模式 props
  value?: string
  onChange?: (value: string) => void
  campuses?: Array<{ id: string; name: string }>

  // 全局状态模式
  useGlobalState?: boolean

  // 样式选项
  size?: 'small' | 'middle' | 'large'
  style?: React.CSSProperties
  showTag?: boolean
  showLabel?: boolean
  placeholder?: string
  disabled?: boolean

  // 添加功能
  showAddButton?: boolean
  onAddCampus?: (campusData: {
    name: string
    website?: string
    mobileWebsite?: string
  }) => Promise<void> | void
  addButtonText?: string
  addButtonPosition?: 'inside' | 'outside'

  // 额外配置
  allowClear?: boolean
  className?: string
}

const CampusSelector: React.FC<CampusSelectorProps> = ({
  value: propValue,
  onChange: propOnChange,
  campuses: propCampuses,
  useGlobalState = false,
  size = 'middle',
  style,
  showTag = false,
  showLabel = true,
  placeholder = '请选择神殿',
  disabled = false,
  showAddButton = false,
  onAddCampus,
  addButtonText = '添加神殿',
  addButtonPosition = 'outside',
  allowClear = true,
  className,
}) => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, getFilteredCampuses, setCampus, addCampus: storeAddCampus } = useCampusStore()
  const { accessibleCampuses, campusRestricted } = useAuthStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    if (useGlobalState && typeof useCampusStore.getState().loadCampusesFromConfig === 'function') {
      useCampusStore.getState().loadCampusesFromConfig()
    }
  }, [useGlobalState])

  // 根据模式选择数据源和处理函数
  // 如果使用全局状态且用户有神殿访问限制，使用过滤后的神殿列表
  const campuses = useGlobalState 
    ? (campusRestricted && accessibleCampuses.length > 0 
        ? getFilteredCampuses(accessibleCampuses) 
        : getAllCampuses())
    : sortCampuses(propCampuses || []) // 对受控模式的神殿列表进行排序
  const value = useGlobalState ? currentCampus : propValue
  const handleChange = useGlobalState ? setCampus : propOnChange

  // 构建选项列表 - 始终使用 name 作为 value，保持一致性
  // 神殿列表已经在上面排序过了，这里直接映射
  const options = campuses.map((c) => ({
    value: c.name,
    label: c.name,
  }))

  // 处理添加神殿点击
  const handleAddClick = () => {
    setIsModalOpen(true)
  }

  // 处理模态框确认
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      setIsLoading(true)

      if (onAddCampus) {
        // 使用自定义添加逻辑
        await onAddCampus(values)
      } else if (useGlobalState) {
        // 使用默认的全局添加方法
        storeAddCampus({
          name: values.campusName,
          website: values.website || '#',
          mobileWebsite: values.mobileWebsite || '#',
          color: '#1890ff',
          status: 'active',
        })
      }

      message.success('神殿添加成功')
      form.resetFields()
      setIsModalOpen(false)
    } catch (error) {
      console.error('添加神殿失败:', error)
      if (error instanceof Error) {
        message.error(error.message || '添加神殿失败')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 处理模态框取消
  const handleModalCancel = () => {
    setIsModalOpen(false)
    form.resetFields()
  }

  // 下拉菜单渲染（inside 模式）
  const dropdownRender = (menu: React.ReactElement) => (
    <>
      {menu}
      {showAddButton && addButtonPosition === 'inside' && (
        <>
          <Divider style={{ margin: '8px 0' }} />
          <Button
            type="link"
            icon={<PlusOutlined />}
            onClick={handleAddClick}
            style={{ width: '100%', textAlign: 'left', paddingLeft: 12 }}
          >
            {addButtonText}
          </Button>
        </>
      )}
    </>
  )

  return (
    <>
      <Space className={className}>
        {showLabel && <span>当前神殿</span>}
        <Select
          value={value || undefined}
          onChange={handleChange}
          placeholder={placeholder}
          style={{ minWidth: 160, ...style }}
          size={size}
          disabled={disabled}
          allowClear={allowClear}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={options}
          dropdownRender={addButtonPosition === 'inside' ? dropdownRender : undefined}
        />

        {showTag && value && <Tag color="blue">{value}</Tag>}

        {/* outside 模式：在外部显示按钮 */}
        {showAddButton && addButtonPosition === 'outside' && (
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddClick}
            size={size}
            disabled={disabled}
          >
            {addButtonText}
          </Button>
        )}
      </Space>

      {/* 添加神殿弹窗 */}
      <Modal
        title="添加新神殿"
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={isLoading}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="campusName"
            label="神殿名称"
            rules={[
              { required: true, message: '请输入神殿名称' },
              { min: 2, message: '神殿名称至少2个字符' },
              { max: 50, message: '神殿名称最多50个字符' },
            ]}
          >
            <Input placeholder="例如：主神殿" />
          </Form.Item>

          <Form.Item
            name="website"
            label="PC网站地址"
            rules={[{ type: 'url', message: '请输入有效的URL' }]}
          >
            <Input placeholder="http://example.com（可选）" />
          </Form.Item>

          <Form.Item
            name="mobileWebsite"
            label="移动网站地址"
            rules={[{ type: 'url', message: '请输入有效的URL' }]}
          >
            <Input placeholder="http://m.example.com（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

// 便捷导出：全局状态版本
export const GlobalCampusSelector = (props: Omit<CampusSelectorProps, 'useGlobalState'>) => (
  <CampusSelector {...props} useGlobalState />
)

// 便捷导出：受控组件版本
export const ControlledCampusSelector = (props: Omit<CampusSelectorProps, 'useGlobalState'>) => (
  <CampusSelector {...props} useGlobalState={false} />
)

export default CampusSelector
