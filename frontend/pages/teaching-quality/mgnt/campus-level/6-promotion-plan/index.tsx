/**
 * 神殿教化司升学计划主页面
 */

import React, { useState, useEffect } from 'react'
import { App, Card, Select, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import CoreDataTabs from '../../../../../components/common/CoreDataTabs'
import { useCampusStore } from '@/stores/campusStore'
import PromotionPlanTable from './components/PromotionPlanTable'
import PromotionPlanEditModal from './components/PromotionPlanEditModal'
import type { PromotionPlanRecord } from '@/types/promotion-plan'
import { promotionPlanService } from '@/services/teaching-quality/promotionPlan'

interface PromotionPlanPageProps {
  hideCampusSelector?: boolean
}

const PromotionPlanPage: React.FC<PromotionPlanPageProps> = ({ hideCampusSelector = false }) => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [data, setData] = useState<PromotionPlanRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PromotionPlanRecord | null>(null)
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
      const result = await promotionPlanService.getPromotionPlanData(campus)
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

  // 添加记录
  const handleAdd = () => {
    setEditingRecord(null)
    setModalVisible(true)
  }

  // 编辑记录
  const handleEdit = (record: PromotionPlanRecord) => {
    if (record.rowType === 'total') {
      message.warning('合计行不可编辑')
      return
    }
    setEditingRecord(record)
    setModalVisible(true)
  }

  // 删除记录
  const handleDelete = (record: PromotionPlanRecord) => {
    if (record.rowType === 'total') {
      message.warning('合计行不可删除')
      return
    }
    message.success('删除成功')
    fetchData(selectedCampus) // 重新获取数据以更新合计
  }

  // 保存记录
  const handleSave = async (values: Partial<PromotionPlanRecord>) => {
    try {
      // 自动计算升学率
      const totalStudents = values.totalStudents || 0
      const estimatedPromotionCount = values.estimatedPromotionCount || 0
      const actualPromotionCount = values.actualPromotionCount || 0
      const receivablePromotionIncome = values.receivablePromotionIncome || 0
      const estimatedPromotionIncome = values.estimatedPromotionIncome || 0
      const actualPromotionIncome = values.actualPromotionIncome || 0

      // 计算升学率（人数）
      const estimatedPromotionRateByCount =
        totalStudents > 0 ? (estimatedPromotionCount / totalStudents) * 100 : 0
      const actualPromotionRateByCount =
        totalStudents > 0 ? (actualPromotionCount / totalStudents) * 100 : 0

      // 计算升学率（金额）
      const estimatedPromotionRateByAmount =
        receivablePromotionIncome > 0
          ? (estimatedPromotionIncome / receivablePromotionIncome) * 100
          : 0
      const actualPromotionRateByAmount =
        receivablePromotionIncome > 0
          ? (actualPromotionIncome / receivablePromotionIncome) * 100
          : 0

      const finalValues = {
        ...values,
        estimatedPromotionRateByCount,
        actualPromotionRateByCount,
        estimatedPromotionRateByAmount,
        actualPromotionRateByAmount,
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
      const blob = await promotionPlanService.exportPromotionPlanData(selectedCampus)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedCampus}神殿教化司升学计划.csv`
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
    <div style={{ padding: hideCampusSelector ? 0 : 24 }}>
      {!hideCampusSelector && (
        <>
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
        </>
      )}

      <PromotionPlanTable
        data={data}
        loading={loading}
        onRefresh={handleRefresh}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onExport={handleExport}
      />

      <PromotionPlanEditModal
        open={modalVisible}
        record={editingRecord}
        onCancel={handleCancel}
        onOk={handleSave}
      />
    </div>
  )
}

export default PromotionPlanPage
