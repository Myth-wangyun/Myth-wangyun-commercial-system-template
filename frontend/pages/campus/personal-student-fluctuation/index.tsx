/**
 * 神殿教化司个人统计学员异动表主页面
 */

import React, { useState, useEffect } from 'react'
import { App, Card, Select, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import PersonalStudentFluctuationTable from './components/PersonalStudentFluctuationTable'
import PersonalStudentFluctuationEditModal from './components/PersonalStudentFluctuationEditModal'
import type { PersonalStudentFluctuationRecord } from '@/types/personal-student-fluctuation'
import { personalStudentFluctuationService } from '@/services/personalStudentFluctuation'

const PersonalStudentFluctuationPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [data, setData] = useState<PersonalStudentFluctuationRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PersonalStudentFluctuationRecord | null>(null)
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
      const result =
        await personalStudentFluctuationService.getPersonalStudentFluctuationData(campus)
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

  // 添加记录
  const handleAdd = () => {
    setEditingRecord(null)
    setModalVisible(true)
  }

  // 编辑记录
  const handleEdit = (record: PersonalStudentFluctuationRecord) => {
    if (record.rowType === 'total') {
      message.warning('合计行不可编辑')
      return
    }
    setEditingRecord(record)
    setModalVisible(true)
  }

  // 删除记录
  const handleDelete = (record: PersonalStudentFluctuationRecord) => {
    if (record.rowType === 'total') {
      message.warning('合计行不可删除')
      return
    }
    message.success('删除成功')
    fetchData(selectedCampus) // 重新获取数据以更新合计
  }

  // 保存记录
  const handleSave = async (values: Partial<PersonalStudentFluctuationRecord>) => {
    try {
      // 自动计算
      const totalRefundCount =
        (values.newStudentRefundCount || 0) + (values.oldStudentRefundCount || 0)
      const refundRate =
        (values.cumulativeStudentCount || 0) > 0
          ? (totalRefundCount / (values.cumulativeStudentCount || 0)) * 100
          : 0
      const totalFluctuationCount =
        totalRefundCount +
        (values.totalSuspensionCount || 0) +
        (values.totalLongTermLeaveCount || 0) +
        (values.totalLongTermAbsenteeCount || 0) +
        (values.winterSummerBreakCount || 0) +
        (values.otherSituationsCount || 0)
      const fluctuationRate =
        (values.cumulativeStudentCount || 0) > 0
          ? (totalFluctuationCount / (values.cumulativeStudentCount || 0)) * 100
          : 0

      const finalValues = {
        ...values,
        totalRefundCount,
        refundRate,
        totalFluctuationCount,
        fluctuationRate,
      }

      message.success('保存成功')
    } catch (error) {
      message.error('保存失败')
    }
    setModalVisible(false)
    setEditingRecord(null)
    fetchData(selectedCampus) // 重新获取数据以更新合计
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
        await personalStudentFluctuationService.exportPersonalStudentFluctuationData(selectedCampus)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedCampus}神殿教化司个人统计学员异动表.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 500 }}>选择神殿：</span>
          <Select
            value={selectedCampus}
            onChange={setSelectedCampus}
            placeholder="请选择神殿"
            style={{ width: 200 }}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={campuses.map((campus) => ({
              value: campus.id,
              label: campus.name,
            }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增记录
          </Button>
        </div>
      </Card>

      <PersonalStudentFluctuationTable
        data={data}
        loading={loading}
        onRefresh={handleRefresh}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onExport={handleExport}
      />

      <PersonalStudentFluctuationEditModal
        open={modalVisible}
        record={editingRecord}
        onCancel={handleCancel}
        onOk={handleSave}
      />
    </div>
  )
}

export default PersonalStudentFluctuationPage
