import React, { useState, useEffect } from 'react'
import { App, Modal, Select, Button, Space, Spin } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { fetchUserPermissions, type UserPermissionInfo } from '@/services/configMaster'

interface EmployeeConfigModalProps {
  visible: boolean
  onCancel: () => void
  onConfirm: (employees: string[]) => void
  year: string
  month: string
  group: 'A' | 'B'
  currentEmployees: string[]
}

/**
 * 网络咨询师人员配置弹窗
 * 从员工管理中读取职位为"网络咨询师"、"网络咨询师主管"和"网络咨询主管"的人员
 */
const EmployeeConfigModal: React.FC<EmployeeConfigModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  year,
  month,
  group,
  currentEmployees,
}) => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [allEmployees, setAllEmployees] = useState<UserPermissionInfo[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])

  // 加载网络咨询师、网络咨询师主管和网络咨询主管人员
  useEffect(() => {
    if (visible) {
      loadEmployees()
      setSelectedEmployees([...currentEmployees])
    }
  }, [visible, currentEmployees])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      // 获取所有员工
      const allUsers = await fetchUserPermissions()
      
      // 筛选职位为"网络咨询师"、"网络咨询师主管"或"网络咨询主管"的人员
      const filteredEmployees = allUsers.filter(user => 
        user.position === '网络咨询师' || user.position === '网络咨询师主管' || user.position === '网络咨询主管'
      )
      
      setAllEmployees(filteredEmployees)
      console.log('[人员配置] 加载到的网络咨询师人员:', filteredEmployees)
    } catch (error) {
      console.error('加载员工列表失败:', error)
      message.error('加载员工列表失败')
    } finally {
      setLoading(false)
    }
  }
  

  const handleAddEmployee = () => {
    setSelectedEmployees([...selectedEmployees, ''])
  }

  const handleRemoveEmployee = (index: number) => {
    const newEmployees = selectedEmployees.filter((_, i) => i !== index)
    setSelectedEmployees(newEmployees)
  }

  const handleEmployeeChange = (index: number, value: string) => {
    const newEmployees = [...selectedEmployees]
    newEmployees[index] = value
    setSelectedEmployees(newEmployees)
  }

  const handleConfirm = () => {
    // 过滤掉空值
    const validEmployees = selectedEmployees.filter(emp => emp && emp.trim() !== '')
    
    // 检查是否有重复
    const uniqueEmployees = Array.from(new Set(validEmployees))
    if (uniqueEmployees.length !== validEmployees.length) {
      message.warning('存在重复的员工，请检查')
      return
    }

    if (uniqueEmployees.length === 0) {
      message.warning('请至少选择一名员工')
      return
    }

    onConfirm(uniqueEmployees)
  }

  return (
    <Modal
      title={`配置${year}年${month}月 ${group}组网络咨询师人员`}
      open={visible}
      onCancel={onCancel}
      onOk={handleConfirm}
      width={600}
      okText="确定"
      cancelText="取消"
    >
      <Spin spinning={loading}>
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: '#666', marginBottom: 8 }}>
            从员工管理中选择职位为"网络咨询师"、"网络咨询师主管"或"网络咨询主管"的人员
          </p>
          <Button 
            type="dashed" 
            icon={<PlusOutlined />} 
            onClick={handleAddEmployee}
            block
          >
            添加人员
          </Button>
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {selectedEmployees.map((employee, index) => (
            <Space key={index} style={{ width: '100%' }}>
              <span style={{ width: 60 }}>人员 {index + 1}:</span>
              <Select
                style={{ flex: 1, minWidth: 200 }}
                value={employee || undefined}
                onChange={(value) => handleEmployeeChange(index, value)}
                placeholder="请选择员工"
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={allEmployees.map(emp => ({
                  label: `${emp.name} (${emp.position})`,
                  value: emp.name,
                }))}
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveEmployee(index)}
              />
            </Space>
          ))}

          {selectedEmployees.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>
              暂无人员，请点击上方"添加人员"按钮
            </div>
          )}
        </Space>

        <div style={{ marginTop: 16, color: '#999', fontSize: 12 }}>
          <p>提示：</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li>配置的人员将显示在该月的汇总表格中</li>
            <li>人员姓名需要与咨询量系统中的"网聊专员"字段匹配</li>
            <li>可以添加多名人员，每人一行</li>
          </ul>
        </div>
      </Spin>
    </Modal>
  )
}

export default EmployeeConfigModal

