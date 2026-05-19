/**
 * 神殿教化司新生仍欠费明细表主页面
 */

import React, { useState, useEffect } from 'react'
import { App, Card, Select, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import OutstandingFeesDetailTable from './components/OutstandingFeesDetailTable'
import OutstandingFeesDetailEditModal from './components/OutstandingFeesDetailEditModal'
import type { OutstandingFeesDetailRecord } from '@/types/outstanding-fees-detail'
import { outstandingFeesDetailService } from '@/services/outstandingFeesDetail'

interface OutstandingFeesDetailPageProps {
  hideCampusSelector?: boolean
  selectedMonth?: number // 选中的月份（1-12），不传则显示所有月份
}

const OutstandingFeesDetailPage: React.FC<OutstandingFeesDetailPageProps> = ({
  hideCampusSelector = false,
  selectedMonth,
}) => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [data, setData] = useState<OutstandingFeesDetailRecord[]>([])
  const [filteredData, setFilteredData] = useState<OutstandingFeesDetailRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editingRecord, setEditingRecord] = useState<OutstandingFeesDetailRecord | null>(null)
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
      const result = await outstandingFeesDetailService.getOutstandingFeesDetailData(campus)
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
      setFilteredData([])
    }
  }, [selectedCampus])

  // 根据月份过滤数据
  useEffect(() => {
    if (!data || data.length === 0) {
      setFilteredData([])
      return
    }

    let result = data

    // 按月份筛选（如果指定了月份）
    if (selectedMonth !== undefined && selectedMonth >= 1 && selectedMonth <= 12) {
      // 从报名时间（registrationTime）中提取月份
      result = data.filter((item) => {
        if (item.registrationTime && item.rowType !== 'total') {
          // 解析日期字符串（例如 "2024-01-15" -> 1）
          const dateMatch = item.registrationTime.match(/(\d{4})-(\d{2})/)
          if (dateMatch) {
            const monthNum = parseInt(dateMatch[2], 10)
            return monthNum === selectedMonth
          }
        }
        // 合计行总是保留
        return item.rowType === 'total'
      })

      // 重新计算合计行的数据
      const dataRows = result.filter((r) => r.rowType === 'data')
      if (dataRows.length > 0) {
        const totalRow = result.find((r) => r.rowType === 'total')
        if (totalRow) {
          totalRow.receivableTuition = dataRows.reduce((sum, r) => sum + r.receivableTuition, 0)
          totalRow.registrationPayment = dataRows.reduce((sum, r) => sum + r.registrationPayment, 0)
          totalRow.supplementaryPayment = dataRows.reduce(
            (sum, r) => sum + r.supplementaryPayment,
            0,
          )
          totalRow.outstandingAmount = dataRows.reduce((sum, r) => sum + r.outstandingAmount, 0)
        }
      }
    } else {
      result = data
    }

    setFilteredData(result)
  }, [data, selectedMonth])

  // 如果隐藏神殿选择器，从全局store获取神殿
  useEffect(() => {
    if (hideCampusSelector && currentCampus) {
      setSelectedCampus(currentCampus)
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
  const handleEdit = (record: OutstandingFeesDetailRecord) => {
    if (record.rowType === 'total') {
      message.warning('合计行不可编辑')
      return
    }
    setEditingRecord(record)
    setModalVisible(true)
  }

  // 删除记录
  const handleDelete = (record: OutstandingFeesDetailRecord) => {
    if (record.rowType === 'total') {
      message.warning('合计行不可删除')
      return
    }
    message.success('删除成功')
    fetchData(selectedCampus) // 重新获取数据以更新合计
  }

  // 保存记录
  const handleSave = async (values: Partial<OutstandingFeesDetailRecord>) => {
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
        await outstandingFeesDetailService.exportOutstandingFeesDetailData(selectedCampus)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedCampus}神殿教化司新生仍欠费明细表.csv`
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

      <OutstandingFeesDetailTable
        data={filteredData.length > 0 ? filteredData : data}
        loading={loading}
        onRefresh={handleRefresh}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onExport={handleExport}
      />

      <OutstandingFeesDetailEditModal
        open={modalVisible}
        record={editingRecord}
        onCancel={handleCancel}
        onOk={handleSave}
      />
    </div>
  )
}

export default OutstandingFeesDetailPage
