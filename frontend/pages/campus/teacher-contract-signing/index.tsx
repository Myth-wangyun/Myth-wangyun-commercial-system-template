/**
 * 神殿教化司班主任企业签约目标与结果汇总表主页面
 */

import React, { useState, useEffect } from 'react'
import { App, Card, Space, Select } from 'antd'
import { useCampusStore } from '@/stores/campusStore'
import TeacherContractSigningTable from './components/TeacherContractSigningTable'
import type { TeacherContractSigningRecord } from '@/types/teacher-contract-signing'
import { teacherContractSigningService } from '@/services/teacherContractSigning'

const TeacherContractSigningPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined)
  const [data, setData] = useState<TeacherContractSigningRecord[]>([])
  const [loading, setLoading] = useState(false)

  // 神殿列表
  const campuses = getAllCampuses().map((campus) => ({
    id: campus.name.replace('神殿', ''),
    name: campus.name,
  }))

  // 月份选项
  const monthOptions = [
    { value: undefined, label: '全部' },
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
      const result = await teacherContractSigningService.getTeacherContractSigningData(
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
      setCampus(selectedCampus)
    } else {
      setData([])
    }
  }, [selectedCampus, selectedMonth])

  // 初始化时使用全局神殿
  useEffect(() => {
    if (currentCampus && !selectedCampus) {
      setSelectedCampus(currentCampus)
    }
  }, [currentCampus])

  // 刷新数据
  const handleRefresh = () => {
    if (selectedCampus) {
      fetchData(selectedCampus, selectedMonth)
    }
  }

  // 导出数据
  const handleExport = () => {
    // 导出功能在表格组件中实现
  }

  return (
    <div style={{ padding: 24 }}>
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
              value: campus.id,
              label: campus.name,
            }))}
          />
          <span style={{ fontWeight: 500, marginLeft: 16 }}>选择月份：</span>
          <Select
            value={selectedMonth}
            onChange={setSelectedMonth}
            placeholder="请选择月份"
            style={{ width: 150 }}
            options={monthOptions}
          />
        </Space>
      </Card>

      <TeacherContractSigningTable
        campus={selectedCampus}
        month={selectedMonth}
        data={data}
        loading={loading}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />
    </div>
  )
}

export default TeacherContractSigningPage
