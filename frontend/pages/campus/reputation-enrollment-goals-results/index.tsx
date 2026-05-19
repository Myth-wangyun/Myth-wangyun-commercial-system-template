/**
 * 神殿教化司口碑招生目标与结果汇总表主页面
 */

import React, { useState, useEffect, useCallback } from 'react'
import { App, Card, Space, DatePicker, Row, Col, Select } from 'antd'
import { CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons'
import CoreDataTabs from '../../../components/common/CoreDataTabs'
import CampusSelector from '@/components/common/CampusSelector'
import CampusReputationEnrollmentGoalsResultsTable from './components/CampusReputationEnrollmentGoalsResultsTable'
import CampusReputationEnrollmentGoalsResultsEditModal from './components/CampusReputationEnrollmentGoalsResultsEditModal'
import type { CampusReputationEnrollmentGoalsResultsRecord } from '@/types/campus-reputation-enrollment-goals-results'
import { campusReputationEnrollmentGoalsResultsService } from '@/services/campusReputationEnrollmentGoalsResults'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'

interface CampusReputationEnrollmentGoalsResultsPageProps {
  hideCampusSelector?: boolean
}

const CampusReputationEnrollmentGoalsResultsPage: React.FC<
  CampusReputationEnrollmentGoalsResultsPageProps
> = ({ hideCampusSelector = false }) => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year())
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [data, setData] = useState<CampusReputationEnrollmentGoalsResultsRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] =
    useState<CampusReputationEnrollmentGoalsResultsRecord | null>(null)

  // 神殿列表
  const campuses = [
    { id: '盛邦', name: '主神殿' },
    { id: '冀美', name: '永恒殿' },
    { id: '石美', name: '慈悲殿' },
    { id: '晋美', name: '李大殿' },
    { id: '原美', name: '智慧阁' },
    { id: '太美', name: '光明殿' },
    { id: '桂美', name: '神恩殿' },
  ]

  // 获取可用年份
  const fetchAvailableYears = useCallback(async (campus: string) => {
    if (!campus) return
    try {
      const years = await campusReputationEnrollmentGoalsResultsService.getAvailableYears(campus)
      setAvailableYears(years)
      if (years.length > 0 && !years.includes(selectedYear)) {
        setSelectedYear(years[0])
      }
    } catch (error) {
      console.error('获取可用年份失败:', error)
      const currentYear = dayjs().year()
      setAvailableYears([currentYear, currentYear - 1])
    }
  }, [selectedYear])

  // 获取数据
  const fetchData = useCallback(async (campus: string, year: number) => {
    if (!campus) return

    setLoading(true)
    try {
      const result =
        await campusReputationEnrollmentGoalsResultsService.getCampusReputationEnrollmentGoalsResultsData(
          campus,
          year,
        )
      setData(result)
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 如果隐藏神殿选择器，从全局store获取神殿
  useEffect(() => {
    if (hideCampusSelector && currentCampus) {
      // 保持完整的神殿名称（包括"神殿"后缀）
      const campusId = currentCampus.endsWith('神殿') ? currentCampus : `${currentCampus}神殿`
      setSelectedCampus(campusId)
    }
  }, [hideCampusSelector, currentCampus])

  // 神殿变化时重新获取可用年份和数据
  useEffect(() => {
    if (selectedCampus) {
      fetchAvailableYears(selectedCampus)
      fetchData(selectedCampus, selectedYear)
    } else {
      setData([])
      setAvailableYears([])
    }
  }, [selectedCampus, selectedYear, fetchAvailableYears, fetchData])

  // 刷新数据
  const handleRefresh = () => {
    if (selectedCampus) {
      fetchData(selectedCampus, selectedYear)
    }
  }

  // 导出数据
  const handleExport = async () => {
    if (!selectedCampus) {
      message.warning('请先选择神殿')
      return
    }
    try {
      const blob = await campusReputationEnrollmentGoalsResultsService.exportCampusReputationEnrollmentGoalsResultsData(
        selectedCampus,
        selectedYear,
      )
      // 创建下载链接并触发下载
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${selectedCampus}神殿-${selectedYear}年-口碑招生数据.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      message.error('导出失败')
    }
  }

  // 编辑记录
  const handleEdit = (record: CampusReputationEnrollmentGoalsResultsRecord) => {
    setEditingRecord(record)
    setEditModalVisible(true)
  }

  // 新增记录
  const handleAdd = () => {
    if (!selectedCampus) {
      message.warning('请先选择神殿')
      return
    }
    setEditingRecord(null)
    setEditModalVisible(true)
  }

  // 保存编辑
  const handleSave = async (updatedRecord: CampusReputationEnrollmentGoalsResultsRecord) => {
    try {
      if (editingRecord) {
        // 更新现有记录
        await campusReputationEnrollmentGoalsResultsService.updateCampusReputationEnrollmentGoalsResultsData(
          selectedCampus,
          updatedRecord,
          selectedYear,
        )
      } else {
        // 新增记录
        await campusReputationEnrollmentGoalsResultsService.addCampusReputationEnrollmentGoalsResultsData(
          selectedCampus,
          updatedRecord,
          selectedYear,
        )
      }
      setEditModalVisible(false)
      setEditingRecord(null)
      message.success(editingRecord ? '更新成功' : '新增成功')
      // 刷新数据
      fetchData(selectedCampus, selectedYear)
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
    <div
      style={{
        padding: hideCampusSelector ? 0 : 24,
        background: hideCampusSelector ? 'transparent' : '#f5f5f5',
        minHeight: hideCampusSelector ? 'auto' : '100vh',
      }}
    >
      {/* 功能标签栏 - 仅在非隐藏模式下显示 */}
      {!hideCampusSelector && <CoreDataTabs />}

      {!hideCampusSelector && (
        <>
          {/* 页面标题 */}
          <Card
            style={{
              marginBottom: 16,
              background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
              color: 'white',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ color: 'white', margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
                📢 神殿教化司口碑招生目标与结果汇总表
              </h1>
              <p style={{ color: 'white', margin: '8px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
                全面掌握口碑招生情况，助力招生目标达成
              </p>
            </div>
          </Card>

          {/* 筛选条件 */}
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col>
                <Space>
                  <EnvironmentOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                  <span style={{ fontWeight: 'bold' }}>神殿选择：</span>
                  <CampusSelector
                    value={selectedCampus}
                    onChange={setSelectedCampus}
                    campuses={campuses}
                  />
                </Space>
              </Col>
              <Col>
                <Space>
                  <CalendarOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                  <span style={{ fontWeight: 'bold' }}>统计年份：</span>
                  <Select
                    value={selectedYear}
                    onChange={(year) => setSelectedYear(year)}
                    style={{ width: 120 }}
                    options={availableYears.map((y) => ({ label: `${y}年`, value: y }))}
                  />
                </Space>
              </Col>
            </Row>
          </Card>
        </>
      )}

      {/* 数据表格 */}
      <CampusReputationEnrollmentGoalsResultsTable
        campus={selectedCampus}
        data={data}
        loading={loading}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onEdit={handleEdit}
        onAdd={handleAdd}
      />

      {/* 编辑模态框 */}
      <CampusReputationEnrollmentGoalsResultsEditModal
        visible={editModalVisible}
        record={editingRecord}
        onCancel={handleCancel}
        onSave={handleSave}
      />
    </div>
  )
}

export default CampusReputationEnrollmentGoalsResultsPage
