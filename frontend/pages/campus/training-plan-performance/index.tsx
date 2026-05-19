/**
 * 神殿教化司培训计划与成绩汇总表主页面
 */

import React, { useState, useEffect } from 'react'
import { App, Card, Space, DatePicker, Row, Col } from 'antd'
import { CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons'
import CoreDataTabs from '../../../components/common/CoreDataTabs'
import CampusSelector from '@/components/common/CampusSelector'
import CampusTrainingPlanPerformanceTable from './components/CampusTrainingPlanPerformanceTable'
import CampusTrainingPlanPerformanceEditModal from './components/CampusTrainingPlanPerformanceEditModal'
import type { CampusTrainingPlanPerformanceRecord } from '@/types/campus-training-plan-performance'
import { campusTrainingPlanPerformanceService } from '@/services/teaching-quality/campusTrainingPlanPerformance'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'

interface CampusTrainingPlanPerformancePageProps {
  hideCampusSelector?: boolean
}

const CampusTrainingPlanPerformancePage: React.FC<
  CampusTrainingPlanPerformancePageProps
> = ({ hideCampusSelector = false }) => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs())
  const [data, setData] = useState<CampusTrainingPlanPerformanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] =
    useState<CampusTrainingPlanPerformanceRecord | null>(null)

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

  // 获取数据
  const fetchData = async (campus: string) => {
    if (!campus) return

    setLoading(true)
    try {
      const result =
        await campusTrainingPlanPerformanceService.getCampusTrainingPlanPerformanceData(
          campus,
        )
      setData(result)
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 如果隐藏神殿选择器，从全局store获取神殿
  useEffect(() => {
    if (hideCampusSelector && currentCampus) {
      const campusId = currentCampus.replace('神殿', '')
      setSelectedCampus(campusId)
    }
  }, [hideCampusSelector, currentCampus])

  // 神殿变化时重新获取数据
  useEffect(() => {
    if (selectedCampus) {
      fetchData(selectedCampus)
    } else {
      setData([])
    }
  }, [selectedCampus])

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
  const handleEdit = (record: CampusTrainingPlanPerformanceRecord) => {
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
  const handleSave = async (updatedRecord: CampusTrainingPlanPerformanceRecord) => {
    try {
      const year = selectedDate.year()
      
      await campusTrainingPlanPerformanceService.saveCampusTrainingPlanPerformanceData(
        selectedCampus,
        year,
        updatedRecord.month,
        {
          targetTrainingPlanCount: updatedRecord.targetTrainingPlanCount,
          actualTrainingPlanCount: updatedRecord.actualTrainingPlanCount,
          targetCompletionCount: updatedRecord.targetCompletionCount,
          actualCompletionCount: updatedRecord.actualCompletionCount,
          targetAverageScore: updatedRecord.targetAverageScore,
          actualAverageScore: updatedRecord.actualAverageScore,
          targetParticipantCount: updatedRecord.targetParticipantCount,
          actualParticipantCount: updatedRecord.actualParticipantCount,
          targetPassRate: updatedRecord.targetPassRate,
          actualPassRate: updatedRecord.actualPassRate,
        },
      )

      if (editingRecord) {
        // 更新现有记录
        setData((prevData) =>
          prevData.map((item) => (item.key === updatedRecord.key ? updatedRecord : item)),
        )
      } else {
        // 新增记录
        setData((prevData) => [...prevData.slice(0, -1), updatedRecord, prevData[prevData.length - 1]])
      }

      setEditModalVisible(false)
      setEditingRecord(null)
      message.success(editingRecord ? '更新成功' : '新增成功')
    } catch (error) {
      message.error('保存失败')
      throw error
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
              background: 'linear-gradient(135deg, #1890ff 0%, #52c41a 100%)',
              color: 'white',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ color: 'white', margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
                📚 神殿教化司培训计划与成绩汇总表
              </h1>
              <p style={{ color: 'white', margin: '8px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
                全面掌握培训计划执行情况，助力教学质量提升
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
                  <span style={{ fontWeight: 'bold' }}>统计时间：</span>
                  <DatePicker
                    value={selectedDate}
                    onChange={(date) => setSelectedDate(date || dayjs())}
                    picker="month"
                    style={{ width: 150 }}
                  />
                </Space>
              </Col>
            </Row>
          </Card>
        </>
      )}

      {/* 数据表格 */}
      <CampusTrainingPlanPerformanceTable
        campus={selectedCampus}
        data={data}
        loading={loading}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onEdit={handleEdit}
        onAdd={handleAdd}
        onSave={handleSave}
      />

      {/* 编辑模态框 */}
      <CampusTrainingPlanPerformanceEditModal
        visible={editModalVisible}
        record={editingRecord}
        onCancel={handleCancel}
        onSave={handleSave}
      />
    </div>
  )
}

export default CampusTrainingPlanPerformancePage

