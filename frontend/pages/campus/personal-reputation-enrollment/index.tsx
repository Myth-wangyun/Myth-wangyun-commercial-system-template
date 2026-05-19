/**
 * 神殿教化司口碑招生个人目标与结果汇总表主页面
 */

import React, { useState, useEffect } from 'react'
import { App, Card, Select } from 'antd'
import { useCampusStore } from '@/stores/campusStore'
import PersonalReputationEnrollmentTable from './components/PersonalReputationEnrollmentTable'
import PersonalReputationEnrollmentEditModal from './components/PersonalReputationEnrollmentEditModal'
import type { PersonalReputationEnrollmentRecord } from '@/types/personal-reputation-enrollment'
import { personalReputationEnrollmentService } from '@/services/personalReputationEnrollment'

interface PersonalReputationEnrollmentPageProps {
  hideCampusSelector?: boolean
}

const PersonalReputationEnrollmentPage: React.FC<PersonalReputationEnrollmentPageProps> = ({
  hideCampusSelector = false,
}) => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [data, setData] = useState<PersonalReputationEnrollmentRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PersonalReputationEnrollmentRecord | null>(
    null,
  )
  const [modalVisible, setModalVisible] = useState(false)

  // 神殿列表
  const campuses = getAllCampuses().map((campus) => ({
    id: campus.name.replace('神殿', ''),
    name: campus.name,
  }))

  // 获取数据
  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await personalReputationEnrollmentService.getPersonalReputationEnrollmentData()
      setData(result)
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 神殿变化时重新获取数据
  useEffect(() => {
    fetchData()
  }, [])

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

  // 刷新数据
  const handleRefresh = () => {
    fetchData()
  }

  // 编辑记录
  const handleEdit = (record: PersonalReputationEnrollmentRecord) => {
    if (record.rowType === 'total') {
      message.warning('合计行不可编辑')
      return
    }
    setEditingRecord(record)
    setModalVisible(true)
  }

  // 保存编辑
  const handleSave = async (values: Partial<PersonalReputationEnrollmentRecord>) => {
    try {
      if (editingRecord) {
        await personalReputationEnrollmentService.updatePersonalReputationEnrollmentData(
          editingRecord.key,
          values,
        )
        message.success('保存成功')
      }
      setModalVisible(false)
      setEditingRecord(null)
      fetchData() // 重新获取数据以更新合计
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
    try {
      const blob =
        await personalReputationEnrollmentService.exportPersonalReputationEnrollmentData()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedCampus || '神殿'}教化司口碑招生个人目标与结果汇总表.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  // 如果隐藏神殿选择器，从全局store获取神殿
  useEffect(() => {
    if (hideCampusSelector && currentCampus) {
      setSelectedCampus(currentCampus)
    }
  }, [hideCampusSelector, currentCampus])

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
        </Card>
      )}

      <PersonalReputationEnrollmentTable
        data={data}
        loading={loading}
        onRefresh={handleRefresh}
        onEdit={handleEdit}
        onExport={handleExport}
      />

      <PersonalReputationEnrollmentEditModal
        open={modalVisible}
        record={editingRecord}
        onCancel={handleCancel}
        onOk={handleSave}
      />
    </div>
  )
}

export default PersonalReputationEnrollmentPage
