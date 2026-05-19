/**
 * 神殿教化司学员异动表主页面
 * 选择神殿后显示月度统计数据
 */

import React, { useState, useEffect, useMemo } from 'react'
import { App, Card, Select, Button, Modal, Row, Col, Statistic } from 'antd'
import {
  PlusOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  TeamOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import CampusStudentMovementTable from './components/CampusStudentMovementTable'
import CampusStudentMovementEditModal from './components/CampusStudentMovementEditModal'
import type { CampusStudentMovementRecord } from '@/types/campus-student-movement'
import { campusStudentMovementService } from '@/services/campusStudentMovement'

const CampusStudentMovementPage: React.FC = () => {
  const { message, modal } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [data, setData] = useState<CampusStudentMovementRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CampusStudentMovementRecord | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  // 神殿列表
  const campuses = getAllCampuses().map((campus) => ({
    id: campus.name.replace('神殿', ''),
    name: campus.name,
  }))

  // 获取数据
  const fetchData = async (campus: string) => {
    if (!campus) return

    setLoading(true)
    try {
      const result = await campusStudentMovementService.getCampusStudentMovementData(campus)
      setData(result)
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 神殿变化时重新获取数据
  useEffect(() => {
    if (selectedCampus) {
      fetchData(selectedCampus)
      setCampus(selectedCampus)
    } else {
      setData([])
    }
  }, [selectedCampus])

  // 初始化时使用全局神殿
  useEffect(() => {
    if (currentCampus && !selectedCampus) {
      setSelectedCampus(currentCampus)
    }
  }, [currentCampus])

  // 刷新数据
  const handleRefresh = () => {
    if (selectedCampus) {
      fetchData(selectedCampus)
    }
  }

  // 新增记录
  const handleAdd = () => {
    if (!selectedCampus) {
      message.warning('请先选择神殿')
      return
    }
    setEditingRecord(null)
    setModalVisible(true)
  }

  // 编辑记录
  const handleEdit = (record: CampusStudentMovementRecord) => {
    if (record.isTotal) {
      message.warning('合计行不可编辑')
      return
    }
    setEditingRecord(record)
    setModalVisible(true)
  }

  // 删除记录
  const handleDelete = (record: CampusStudentMovementRecord) => {
    if (record.isTotal) {
      message.warning('合计行不可删除')
      return
    }

    modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除 ${record.month}月 的记录吗？`,
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        message.success('删除成功')
        fetchData(selectedCampus)
      },
    })
  }

  // 保存记录
  const handleSave = async (values: Partial<CampusStudentMovementRecord>) => {
    if (!selectedCampus) return

    try {
      message.success(editingRecord ? '更新成功' : '新增成功')
    } catch (error) {
      message.error(editingRecord ? '更新失败' : '新增失败')
    }
    setModalVisible(false)
    setEditingRecord(null)
    fetchData(selectedCampus)
  }

  // 取消编辑
  const handleCancel = () => {
    setModalVisible(false)
    setEditingRecord(null)
  }

  // 导出数据
  const handleExport = async () => {
    if (!selectedCampus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob =
        await campusStudentMovementService.exportCampusStudentMovementData(selectedCampus)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedCampus}神殿教化司学员异动表.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  // 计算统计数据
  const statistics = useMemo(() => {
    const totalRecord = data.find((r) => r.isTotal)
    const dataRecords = data.filter((r) => !r.isTotal)

    if (!totalRecord || dataRecords.length === 0) {
      return {
        totalStudents: 0,
        totalRefund: 0,
        totalSuspension: 0,
        totalMovement: 0,
        averageRefundRate: 0,
        averageMovementRate: 0,
      }
    }

    const totalStudents = totalRecord.totalStudents
    const totalRefund = totalRecord.totalRefund
    const totalSuspension = totalRecord.suspensionTotal
    const totalMovement = totalRecord.movementTotal

    // 计算平均退费率和异动率
    const validRefundRates = dataRecords
      .filter((r) => r.refundRate !== '#DIV/0!')
      .map((r) => parseFloat(r.refundRate.replace('%', '')))
    const averageRefundRate =
      validRefundRates.length > 0
        ? parseFloat(
            (
              validRefundRates.reduce((sum, rate) => sum + rate, 0) / validRefundRates.length
            ).toFixed(1),
          )
        : 0

    const validMovementRates = dataRecords
      .filter((r) => r.movementRate !== '#DIV/0!')
      .map((r) => parseFloat(r.movementRate.replace('%', '')))
    const averageMovementRate =
      validMovementRates.length > 0
        ? parseFloat(
            (
              validMovementRates.reduce((sum, rate) => sum + rate, 0) / validMovementRates.length
            ).toFixed(1),
          )
        : 0

    return {
      totalStudents,
      totalRefund,
      totalSuspension,
      totalMovement,
      averageRefundRate,
      averageMovementRate,
    }
  }, [data])

  return (
    <div style={{ padding: 24 }}>
      {/* 神殿选择卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: 500 }}>选择神殿：</span>
            <Select
              value={selectedCampus}
              onChange={setSelectedCampus}
              placeholder="请选择神殿"
              style={{ width: 200, marginLeft: 8 }}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={campuses.map((campus) => ({
                value: campus.id,
                label: campus.name,
              }))}
            />
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增记录
          </Button>
        </div>
      </Card>

      {/* 关键指标统计卡片 */}
      {selectedCampus && data.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="累计带生人数"
                value={statistics.totalStudents}
                suffix="人"
                prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="退费总人数"
                value={statistics.totalRefund}
                suffix="人"
                prefix={<ExclamationCircleOutlined style={{ color: '#f5222d' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="休学总人数"
                value={statistics.totalSuspension}
                suffix="人"
                prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="异动总人数"
                value={statistics.totalMovement}
                suffix="人"
                prefix={<SwapOutlined style={{ color: '#faad14' }} />}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Statistic
                title="平均退费率"
                value={statistics.averageRefundRate}
                suffix="%"
                precision={1}
                prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均异动率"
                value={statistics.averageMovementRate}
                suffix="%"
                precision={1}
                prefix={<SwapOutlined style={{ color: '#eb2f96' }} />}
              />
            </Col>
          </Row>
        </Card>
      )}

      <CampusStudentMovementTable
        campus={selectedCampus}
        data={data}
        loading={loading}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CampusStudentMovementEditModal
        open={modalVisible}
        record={editingRecord}
        campus={selectedCampus}
        onCancel={handleCancel}
        onOk={handleSave}
      />
    </div>
  )
}

export default CampusStudentMovementPage
