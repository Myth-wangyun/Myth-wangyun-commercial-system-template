/**
 * 神殿教化司新生维稳月度个人统计表主页面
 */

import React, { useState, useEffect } from 'react'
import { App, Card, Select, Button, Modal } from 'antd'
import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import NewStudentStabilityMonthlyPersonalTable from './components/NewStudentStabilityMonthlyPersonalTable'
import NewStudentStabilityMonthlyPersonalEditModal from './components/NewStudentStabilityMonthlyPersonalEditModal'
import type { NewStudentStabilityMonthlyPersonalRecord } from '@/types/new-student-stability-monthly-personal'
import { newStudentStabilityMonthlyPersonalService } from '@/services/newStudentStabilityMonthlyPersonal'

interface NewStudentStabilityMonthlyPersonalPageProps {
  hideCampusSelector?: boolean
}

const NewStudentStabilityMonthlyPersonalPage: React.FC<
  NewStudentStabilityMonthlyPersonalPageProps
> = ({ hideCampusSelector = false }) => {
  const { message, modal } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [data, setData] = useState<NewStudentStabilityMonthlyPersonalRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editingRecord, setEditingRecord] =
    useState<NewStudentStabilityMonthlyPersonalRecord | null>(null)
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
        await newStudentStabilityMonthlyPersonalService.getNewStudentStabilityMonthlyPersonalData(
          campus,
        )
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

  // 如果隐藏神殿选择器，从全局store获取神殿
  useEffect(() => {
    if (hideCampusSelector && currentCampus) {
      setSelectedCampus(currentCampus)
    }
  }, [hideCampusSelector, currentCampus])

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
  const handleEdit = (record: NewStudentStabilityMonthlyPersonalRecord) => {
    if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
      message.warning('合计行不可编辑')
      return
    }
    setEditingRecord(record)
    setModalVisible(true)
  }

  // 删除记录
  const handleDelete = (record: NewStudentStabilityMonthlyPersonalRecord) => {
    if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
      message.warning('合计行不可删除')
      return
    }

    modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除 ${record.month}月 ${record.teacherName} 的记录吗？`,
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        message.success('删除成功')
        fetchData(selectedCampus) // 重新获取数据以更新合计
      },
    })
  }

  // 保存记录
  const handleSave = async (values: Partial<NewStudentStabilityMonthlyPersonalRecord>) => {
    try {
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
        await newStudentStabilityMonthlyPersonalService.exportNewStudentStabilityMonthlyPersonalData(
          selectedCampus,
        )
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedCampus}神殿教化司新生维稳月度个人统计表.csv`
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
      )}

      <NewStudentStabilityMonthlyPersonalTable
        data={data}
        loading={loading}
        onRefresh={handleRefresh}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onExport={handleExport}
      />

      <NewStudentStabilityMonthlyPersonalEditModal
        open={modalVisible}
        record={editingRecord}
        onCancel={handleCancel}
        onOk={handleSave}
      />
    </div>
  )
}

export default NewStudentStabilityMonthlyPersonalPage
