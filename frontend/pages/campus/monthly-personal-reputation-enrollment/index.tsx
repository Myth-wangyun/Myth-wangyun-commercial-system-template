/**
 * 神殿教化司口碑招生月度个人目标与结果汇总表主页面
 */

import React, { useState, useEffect } from 'react'
import { App, Card, Select } from 'antd'
import { useCampusStore } from '@/stores/campusStore'
import MonthlyPersonalReputationEnrollmentTable from './components/MonthlyPersonalReputationEnrollmentTable'
import MonthlyPersonalReputationEnrollmentEditModal from './components/MonthlyPersonalReputationEnrollmentEditModal'
import type { MonthlyPersonalReputationEnrollmentRecord } from '@/types/monthly-personal-reputation-enrollment'
import { monthlyPersonalReputationEnrollmentService } from '@/services/monthlyPersonalReputationEnrollment'

interface MonthlyPersonalReputationEnrollmentPageProps {
  hideCampusSelector?: boolean
}

const MonthlyPersonalReputationEnrollmentPage: React.FC<
  MonthlyPersonalReputationEnrollmentPageProps
> = ({ hideCampusSelector = false }) => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined)
  const [data, setData] = useState<MonthlyPersonalReputationEnrollmentRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editingRecord, setEditingRecord] =
    useState<MonthlyPersonalReputationEnrollmentRecord | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  // 神殿列表
  const campuses = getAllCampuses().map((campus) => ({
    id: campus.name.replace('神殿', ''),
    name: campus.name,
  }))

  // 月份选项
  const monthOptions = [
    { value: undefined, label: '全部月份' },
    ...Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: `${i + 1}月`,
    })),
  ]

  // 获取数据
  const fetchData = async (campus: string, month?: number) => {
    if (!campus) return

    setLoading(true)
    try {
      const result =
        await monthlyPersonalReputationEnrollmentService.getMonthlyPersonalReputationEnrollmentData(
          campus,
          month,
        )
      setData(result)
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 神殿和月份变化时重新获取数据
  useEffect(() => {
    if (selectedCampus) {
      fetchData(selectedCampus, selectedMonth)
    } else {
      setData([])
    }
  }, [selectedCampus, selectedMonth])

  // 神殿变化时更新全局神殿
  useEffect(() => {
    if (selectedCampus) {
      setCampus(selectedCampus)
    }
  }, [selectedCampus, setCampus])

  // 初始化时使用全局神殿
  useEffect(() => {
    if (currentCampus && !selectedCampus) {
      setSelectedCampus(currentCampus)
    }
  }, [currentCampus])

  // 如果隐藏神殿选择器，从全局store获取神殿
  useEffect(() => {
    if (hideCampusSelector && currentCampus) {
      setSelectedCampus(currentCampus)
    }
  }, [hideCampusSelector, currentCampus])

  // 刷新数据
  const handleRefresh = () => {
    if (selectedCampus) {
      fetchData(selectedCampus, selectedMonth)
    }
  }

  // 编辑记录
  const handleEdit = (record: MonthlyPersonalReputationEnrollmentRecord) => {
    if (record.rowType !== 'data') {
      message.warning('合计行不可编辑')
      return
    }
    setEditingRecord(record)
    setModalVisible(true)
  }

  // 保存编辑
  const handleSave = async (values: Partial<MonthlyPersonalReputationEnrollmentRecord>) => {
    try {
      if (editingRecord) {
        await monthlyPersonalReputationEnrollmentService.updateMonthlyPersonalReputationEnrollmentData(
          editingRecord.key,
          values,
        )
        message.success('保存成功')
      }
      setModalVisible(false)
      setEditingRecord(null)
      fetchData(selectedCampus, selectedMonth) // 重新获取数据以更新合计
    } catch (error) {
      message.error('保存失败')
    }
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
        await monthlyPersonalReputationEnrollmentService.exportMonthlyPersonalReputationEnrollmentData(
          selectedCampus,
          selectedMonth,
        )
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedCampus}神殿教化司口碑招生月度个人目标与结果汇总表.csv`
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
        <Card style={{ marginBottom: 16 }}>
          <span style={{ fontWeight: 500, marginRight: 16 }}>选择神殿：</span>
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
          <span style={{ fontWeight: 500, marginLeft: 24, marginRight: 16 }}>选择月份：</span>
          <Select
            value={selectedMonth}
            onChange={setSelectedMonth}
            placeholder="请选择月份"
            style={{ width: 150 }}
            options={monthOptions}
          />
        </Card>
      )}

      <MonthlyPersonalReputationEnrollmentTable
        data={data}
        loading={loading}
        onRefresh={handleRefresh}
        onEdit={handleEdit}
        onExport={handleExport}
      />

      <MonthlyPersonalReputationEnrollmentEditModal
        open={modalVisible}
        record={editingRecord}
        onCancel={handleCancel}
        onOk={handleSave}
      />
    </div>
  )
}

export default MonthlyPersonalReputationEnrollmentPage
