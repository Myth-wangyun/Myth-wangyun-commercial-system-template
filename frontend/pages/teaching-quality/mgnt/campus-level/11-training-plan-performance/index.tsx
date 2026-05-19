/**
 * 教化司培训计划与成绩汇总表主页面
 */

import React, { useState, useEffect } from 'react'
import { App, Card, Space, Select } from 'antd'
import { useCampusStore } from '@/stores/campusStore'
import TrainingPlanPerformanceTable from './components/TrainingPlanPerformanceTable'
import TrainingPlanPerformanceEditModal from './components/TrainingPlanPerformanceEditModal'
import type { TrainingPlanPerformanceRecord } from '@/types/training-plan-performance'
import { trainingPlanPerformanceService } from '@/services/teaching-quality/trainingPlanPerformance'

const { Option } = Select

interface TrainingPlanPerformancePageProps {
  hideCampusSelector?: boolean
}

const TrainingPlanPerformancePage: React.FC<TrainingPlanPerformancePageProps> = ({
  hideCampusSelector = false,
}) => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [data, setData] = useState<TrainingPlanPerformanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TrainingPlanPerformanceRecord | null>(null)

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
      const result = await trainingPlanPerformanceService.getTrainingPlanPerformanceData(campus)

      // 添加合计行
      const totalRecord: TrainingPlanPerformanceRecord = {
        key: `${campus}-total`,
        month: 0,
        campus: '',
        trainingObjective: '',
        mainContent: '',
        trainingMethod: '',
        personInCharge: '',
        numberOfTrainees: 0,
        numberOfQualified: 0,
        examPassRate: 0,
        averageScore: 0,
      }

      setData([...result, totalRecord])
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
      // 仅在独立页面时同步全局神殿，汇总页嵌入时不回写
      if (!hideCampusSelector) {
        setCampus(selectedCampus)
      }
    } else {
      setData([])
    }
  }, [selectedCampus, hideCampusSelector])

  // 在汇总页嵌入时，随顶部神殿联动
  useEffect(() => {
    if (hideCampusSelector && currentCampus) {
      setSelectedCampus(currentCampus)
    }
  }, [hideCampusSelector, currentCampus])

  // 初始化时使用全局神殿（独立页）
  useEffect(() => {
    if (!hideCampusSelector && currentCampus && !selectedCampus) {
      setSelectedCampus(currentCampus)
    }
  }, [hideCampusSelector, currentCampus])

  // 刷新数据
  const handleRefresh = () => {
    if (selectedCampus) {
      fetchData(selectedCampus)
    }
  }

  // 导出数据
  const handleExport = () => {
    // 导出功能在表格组件中实现
  }

  // 编辑记录
  const handleEdit = (record: TrainingPlanPerformanceRecord) => {
    setEditingRecord(record)
    setEditModalVisible(true)
  }

  // 保存编辑
  const handleSave = async (updatedRecord: TrainingPlanPerformanceRecord) => {
    try {
      // 更新本地数据
      setData((prevData) =>
        prevData.map((item) => (item.key === updatedRecord.key ? updatedRecord : item)),
      )

      setEditModalVisible(false)
      setEditingRecord(null)
      message.success('保存成功')
    } catch (error) {
      message.error('保存失败')
    }
  }

  // 取消编辑
  const handleCancel = () => {
    setEditModalVisible(false)
    setEditingRecord(null)
  }

  return (
    <div style={{ padding: 24 }}>
      {!hideCampusSelector && (
        <Card style={{ marginBottom: 16 }}>
          <Space>
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
                value: campus.name,
                label: campus.name,
              }))}
            />
          </Space>
        </Card>
      )}

      <TrainingPlanPerformanceTable
        campus={selectedCampus}
        data={data}
        loading={loading}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onEdit={handleEdit}
      />

      <TrainingPlanPerformanceEditModal
        visible={editModalVisible}
        record={editingRecord}
        onCancel={handleCancel}
        onSave={handleSave}
      />
    </div>
  )
}

export default TrainingPlanPerformancePage
