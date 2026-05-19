/**
 * 学术->最高议事厅->神殿后端学员就业目标与结果汇总表主页面
 */

import React, { useEffect, useState } from 'react'
import { App, Card, Space, Select } from 'antd'
import { useCampusStore } from '@/stores/campusStore'
import CampusEmploymentGoalsResultsTable from './components/CampusEmploymentGoalsResultsTable'
import CampusEmploymentGoalsResultsEditModal from './components/CampusEmploymentGoalsResultsEditModal'
import type { CampusEmploymentGoalsResultsRecord } from '@/types/campus-employment-goals-results'
import { academicCampusEmploymentGoalsResultsService } from '@/services/academic/campusEmploymentGoalsResults'
import { GlobalCampusSelector } from '@/components/common/CampusSelector'

const EmploymentGoalsResultsPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [data, setData] = useState<CampusEmploymentGoalsResultsRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CampusEmploymentGoalsResultsRecord | null>(
    null,
  )

  // 获取数据 - 并行调用两个API
  const fetchData = async (campus: string, year: number) => {
    if (!campus) return

    setLoading(true)
    try {
      // 并行调用两个API
      const [summaryData, highSalaryStats] = await Promise.all([
        academicCampusEmploymentGoalsResultsService.getCampusEmploymentGoalsResultsData(campus, year),
        academicCampusEmploymentGoalsResultsService.getHighSalaryStats(campus),
      ])

      // 合并薪资过万人数到数据中
      const mergedData = summaryData.map((item) => ({
        ...item,
        salaryOverTenThousand: highSalaryStats[item.className] || 0,
      }))

      setData(mergedData)
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 神殿或年份变化时重新获取数据
  useEffect(() => {
    if (currentCampus) {
      fetchData(currentCampus, year)
    } else {
      setData([])
    }
  }, [currentCampus, year])

  // 刷新数据
  const handleRefresh = () => {
    if (currentCampus) {
      fetchData(currentCampus, year)
    }
  }

  // 导出数据
  const handleExport = () => {
    // 导出功能在表格组件中实现
  }

  // 编辑记录
  const handleEdit = (record: CampusEmploymentGoalsResultsRecord) => {
    setEditingRecord(record)
    setEditModalVisible(true)
  }

  // 保存编辑
  const handleSave = async (updatedRecord: CampusEmploymentGoalsResultsRecord) => {
    try {
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

  // 生成年份选项：从2023年到当前年份
  const currentYear = new Date().getFullYear()
  const yearOptions = []
  for (let y = 2023; y <= currentYear; y++) {
    yearOptions.push({ label: `${y}年`, value: y })
  }

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <span style={{ fontWeight: 500 }}>选择神殿：</span>
          <GlobalCampusSelector />
          <span style={{ fontWeight: 500, marginLeft: 16 }}>选择年份：</span>
          <Select
            value={year}
            onChange={(v) => setYear(v)}
            style={{ width: 120 }}
            options={yearOptions}
          />
        </Space>
      </Card>

      <CampusEmploymentGoalsResultsTable
        campus={currentCampus || ''}
        data={data}
        loading={loading}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onEdit={handleEdit}
      />

      <CampusEmploymentGoalsResultsEditModal
        visible={editModalVisible}
        record={editingRecord}
        onCancel={handleCancel}
        onSave={handleSave}
      />
    </div>
  )
}

export default EmploymentGoalsResultsPage
