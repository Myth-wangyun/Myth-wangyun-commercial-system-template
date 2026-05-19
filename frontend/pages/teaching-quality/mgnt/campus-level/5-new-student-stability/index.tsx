/**
 * 神殿教化司后端新生维稳统计表主页面
 * 选择神殿后显示月度统计数据
 */

import React, { useState, useEffect, useMemo } from 'react'
import { App, Card, Select, Button, Modal, Row, Col, Statistic } from 'antd'
import {
  PlusOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import CoreDataTabs from '../../../../../components/common/CoreDataTabs'
import { useCampusStore } from '@/stores/campusStore'
import CampusNewStudentStabilityTable from './components/CampusNewStudentStabilityTable'
import CampusNewStudentStabilityEditModal from './components/CampusNewStudentStabilityEditModal'
import type { CampusNewStudentStabilityRecord } from '@/types/campus-new-student-stability'
import { campusNewStudentStabilityService } from '@/services/teaching-quality/campusNewStudentStability'

interface NewStudentStabilityPageProps {
  hideCampusSelector?: boolean
}

const NewStudentStabilityPage: React.FC<NewStudentStabilityPageProps> = ({
  hideCampusSelector = false,
}) => {
  const { message, modal } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [data, setData] = useState<CampusNewStudentStabilityRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CampusNewStudentStabilityRecord | null>(null)
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
      const result = await campusNewStudentStabilityService.getCampusNewStudentStabilityData(campus)
      setData(result)
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 神殿变化 / 页面首次进入时重新获取数据
  // 说明：部分场景下路由缓存或返回该页面时，selectedCampus 未变化导致不触发刷新。
  // 这里额外在页面 mount 时触发一次，确保“打开页面时刷新一次”。
  useEffect(() => {
    if (selectedCampus) {
      fetchData(selectedCampus)
      setCampus(selectedCampus)
    } else {
      setData([])
    }
  }, [selectedCampus])

  // 页面首次打开时，强制刷新一次（即使 selectedCampus 值未变化）
  useEffect(() => {
    if (selectedCampus) {
      fetchData(selectedCampus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 如果隐藏神殿选择器，从全局store获取神殿
  useEffect(() => {
    if (hideCampusSelector && currentCampus) {
      const campusId = currentCampus.replace('神殿', '')
      setSelectedCampus(campusId)
    } else if (!hideCampusSelector && currentCampus && !selectedCampus) {
      setSelectedCampus(currentCampus)
    }
  }, [hideCampusSelector, currentCampus, selectedCampus])

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
  const handleEdit = (record: CampusNewStudentStabilityRecord) => {
    if (record.month === 0) {
      message.warning('合计行不可编辑')
      return
    }
    setEditingRecord(record)
    setModalVisible(true)
  }

  // 删除记录
  const handleDelete = (record: CampusNewStudentStabilityRecord) => {
    if (record.month === 0) {
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
  const handleSave = async (values: Partial<CampusNewStudentStabilityRecord>) => {
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
        await campusNewStudentStabilityService.exportCampusNewStudentStabilityData(selectedCampus)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedCampus}神殿教化司后端新生维稳统计表.csv`
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
    const totalRecord = data.find((r) => r.month === 0)
    const dataRecords = data.filter((r) => r.month > 0)

    if (!totalRecord || dataRecords.length === 0) {
      return {
        totalHandover: 0,
        totalReported: 0,
        totalStable: 0,
        totalRefund: 0,
        totalOwing: 0,
        stabilityRate: 0,
        averageRefundRate: 0,
      }
    }

    const totalHandover = totalRecord.handoverCount
    const totalReported = totalRecord.reportedCount
    const totalStable = (totalRecord as any).stableClassHoursCount ?? 0
    const totalRefund = totalRecord.refundCount
    const totalOwing = (totalRecord as any).totalOwingAmount ?? 0

    const stabilityRate =
      totalReported > 0 ? parseFloat(((totalStable / totalReported) * 100).toFixed(1)) : 0

    // 计算平均退费率（从所有月份中去掉#DIV/0!的，然后求平均）
    const validRates = dataRecords.map((r) => Number(r.refundRate || 0))
    const averageRefundRate =
      validRates.length > 0
        ? parseFloat(
            (validRates.reduce((sum, rate) => sum + rate, 0) / validRates.length).toFixed(1),
          )
        : 0

    return {
      totalHandover,
      totalReported,
      totalStable,
      totalRefund,
      totalOwing,
      stabilityRate,
      averageRefundRate,
    }
  }, [data])

  return (
    <div style={{ padding: hideCampusSelector ? 0 : 24 }}>
      {/* 功能标签栏 - 仅在非隐藏模式下显示 */}
      {!hideCampusSelector && <CoreDataTabs />}

      {!hideCampusSelector && (
        <>
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
        </>
      )}

      {/* 关键指标统计卡片 */}
      {selectedCampus && data.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="总交接人数"
                value={statistics.totalHandover}
                suffix="人"
                prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总报道人数"
                value={statistics.totalReported}
                suffix="人"
                prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="稳定率"
                value={statistics.stabilityRate}
                suffix="%"
                precision={1}
                prefix={<CheckCircleOutlined style={{ color: '#faad14' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="欠费总金额"
                value={statistics.totalOwing}
                prefix={<DollarOutlined style={{ color: '#f5222d' }} />}
                formatter={(value) => `¥${value}`}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Statistic
                title="退费人数"
                value={statistics.totalRefund}
                suffix="人"
                prefix={<ExclamationCircleOutlined style={{ color: '#722ed1' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均退费率"
                value={statistics.averageRefundRate}
                suffix="%"
                precision={1}
                prefix={<ExclamationCircleOutlined style={{ color: '#eb2f96' }} />}
              />
            </Col>
          </Row>
        </Card>
      )}

      <CampusNewStudentStabilityTable
        campus={selectedCampus}
        data={data}
        loading={loading}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onEdit={handleEdit}
        onAdd={handleAdd}
        onDelete={handleDelete}
      />

      <CampusNewStudentStabilityEditModal
        visible={modalVisible}
        record={editingRecord}
        campus={selectedCampus}
        onCancel={handleCancel}
        onSave={handleSave}
      />
    </div>
  )
}

export default NewStudentStabilityPage
