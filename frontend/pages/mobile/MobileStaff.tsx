/**
 * 移动端人员管理页
 * 展示员工列表、支持搜索和部门筛选
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { App, Typography, Spin, Input, Modal, Button } from 'antd'
import {
  TeamOutlined,
  PhoneOutlined,
  SearchOutlined,
  BankOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { fetchEmployees, fetchDepartments } from '@/services/configMaster'
import './MobileStaff.css'

const { Title, Text } = Typography

// 头像背景色轮换
const AVATAR_COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2', '#2f54eb']

interface Employee {
  id: number
  user_id?: number | null
  name: string
  department: string
  position: string
  contact: string
  campus_name?: string | null
  is_active: boolean
}

const MobileStaff: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [searchText, setSearchText] = useState('')
  const [activeDept, setActiveDept] = useState<string>('全部')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  const fetchData = useCallback(async () => {
    if (!currentCampus) return
    setLoading(true)
    try {
      const [empData, deptData] = await Promise.all([
        fetchEmployees({ campus_name: currentCampus, is_active: true }),
        fetchDepartments(),
      ])
      setEmployees(empData)
      setDepartments(['全部', ...deptData])
    } catch {
      message.error('数据加载失败')
    } finally {
      setLoading(false)
    }
  }, [currentCampus])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 筛选后的数据
  const filteredEmployees = useMemo(() => {
    let list = employees
    if (activeDept !== '全部') {
      list = list.filter((e) => e.department === activeDept)
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase()
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q) ||
          e.position.toLowerCase().includes(q),
      )
    }
    return list
  }, [employees, activeDept, searchText])

  const getAvatarColor = (name: string) => {
    const idx = name.charCodeAt(0) % AVATAR_COLORS.length
    return AVATAR_COLORS[idx]
  }

  const getAvatarText = (name: string) => {
    return name.length > 0 ? name.slice(-2) : '?'
  }

  const handleCall = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation()
    window.location.href = `tel:${phone}`
  }

  if (!currentCampus) {
    return (
      <div className="m-staff">
        <div className="m-staff-empty">
          <div className="m-staff-empty-icon">
            <TeamOutlined />
          </div>
          <Text type="secondary">请先选择神殿</Text>
        </div>
      </div>
    )
  }

  return (
    <div className="m-staff">
      {/* 头部 */}
      <div className="m-staff-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} className="m-staff-header-title">
            人员管理
          </Title>
          <ReloadOutlined
            style={{ color: '#fff', fontSize: 18, cursor: 'pointer' }}
            onClick={fetchData}
          />
        </div>
        <Text className="m-staff-header-desc">
          {currentCampus} · 共 {employees.length} 人
        </Text>
      </div>

      {/* 搜索栏 */}
      <div className="m-staff-search">
        <Input.Search
          placeholder="搜索姓名、部门、职位"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          enterButton={<SearchOutlined />}
        />
      </div>

      {/* 部门筛选标签 */}
      <div className="m-staff-filters">
        {departments.map((dept) => (
          <div
            key={dept}
            className={`m-staff-filter-tag ${activeDept === dept ? 'active' : ''}`}
            onClick={() => setActiveDept(dept)}
          >
            {dept}
          </div>
        ))}
      </div>

      {/* 统计 */}
      <div className="m-staff-count">
        共 {filteredEmployees.length} 人{activeDept !== '全部' && ` · ${activeDept}`}
      </div>

      {/* 人员列表 */}
      {loading ? (
        <div className="m-staff-loading">
          <Spin size="large" />
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="m-staff-empty">
          <div className="m-staff-empty-icon">
            <TeamOutlined />
          </div>
          <Text type="secondary">暂无人员数据</Text>
        </div>
      ) : (
        <div className="m-staff-list">
          {filteredEmployees.map((emp) => (
            <div key={emp.id} className="m-staff-card" onClick={() => setSelectedEmployee(emp)}>
              <div className="m-staff-avatar" style={{ background: getAvatarColor(emp.name) }}>
                {getAvatarText(emp.name)}
              </div>
              <div className="m-staff-info">
                <div className="m-staff-name">
                  {emp.name}
                  {!emp.is_active && (
                    <span className="m-staff-tag inactive" style={{ marginLeft: 6 }}>
                      已离职
                    </span>
                  )}
                </div>
                <div className="m-staff-meta">
                  <span>{emp.department}</span>
                  <span>{emp.position}</span>
                </div>
              </div>
              {emp.contact && (
                <div className="m-staff-contact" onClick={(e) => handleCall(emp.contact, e)}>
                  <PhoneOutlined />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 人员详情弹窗 */}
      <Modal
        open={!!selectedEmployee}
        onCancel={() => setSelectedEmployee(null)}
        footer={null}
        closable
        centered
        width="90%"
        style={{ maxWidth: 400 }}
        styles={{ body: { padding: 0 } }}
      >
        {selectedEmployee && (
          <div className="m-staff-detail">
            <div className="m-staff-detail-header">
              <div
                className="m-staff-detail-avatar"
                style={{ background: getAvatarColor(selectedEmployee.name) }}
              >
                {getAvatarText(selectedEmployee.name)}
              </div>
              <div className="m-staff-detail-name">{selectedEmployee.name}</div>
              <span className={`m-staff-tag ${selectedEmployee.is_active ? '' : 'inactive'}`}>
                {selectedEmployee.is_active ? '在职' : '已离职'}
              </span>
            </div>
            <div className="m-staff-detail-list">
              <div className="m-staff-detail-row">
                <span className="m-staff-detail-row-label">
                  <BankOutlined /> 部门
                </span>
                <span className="m-staff-detail-row-value">{selectedEmployee.department}</span>
              </div>
              <div className="m-staff-detail-row">
                <span className="m-staff-detail-row-label">
                  <IdcardOutlined /> 职位
                </span>
                <span className="m-staff-detail-row-value">{selectedEmployee.position}</span>
              </div>
              <div className="m-staff-detail-row">
                <span className="m-staff-detail-row-label">
                  <PhoneOutlined /> 电话
                </span>
                <span className="m-staff-detail-row-value">
                  {selectedEmployee.contact || '未填写'}
                </span>
              </div>
              <div className="m-staff-detail-row">
                <span className="m-staff-detail-row-label">
                  <EnvironmentOutlined /> 神殿
                </span>
                <span className="m-staff-detail-row-value">
                  {selectedEmployee.campus_name || currentCampus}
                </span>
              </div>
            </div>
            {selectedEmployee.contact && (
              <div className="m-staff-detail-actions">
                <Button
                  type="primary"
                  block
                  icon={<PhoneOutlined />}
                  onClick={() => (window.location.href = `tel:${selectedEmployee.contact}`)}
                >
                  拨打电话
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default MobileStaff
