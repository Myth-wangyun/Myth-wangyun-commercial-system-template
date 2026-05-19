//教化司最高议事厅学员异动表
import React, { useState, useEffect } from 'react'
import { App, Card, Row, Col, Space, Statistic } from 'antd'
import CoreDataTabs from '../../../../../components/common/CoreDataTabs'
import {
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  UserDeleteOutlined,
  LineChartOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import type { CampusStudentFluctuationRecord } from '@/types/campus-student-fluctuation'
import { campusStudentFluctuationService } from '@/services/campusStudentFluctuation'
import CampusStudentFluctuationTable from './components/CampusStudentFluctuationTable'
import CampusStudentFluctuationEditModal from './components/CampusStudentFluctuationEditModal'
import CampusSelector from '@/components/common/CampusSelector'
import { useCampusStore } from '@/stores/campusStore'

interface CampusStudentFluctuationPageProps {
  hideCampusSelector?: boolean
}

const CampusStudentFluctuationPage: React.FC<CampusStudentFluctuationPageProps> = ({
  hideCampusSelector = false,
}) => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [data, setData] = useState<CampusStudentFluctuationRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CampusStudentFluctuationRecord | null>(null)

  const campuses = [
    { id: '盛邦', name: '主神殿' },
    { id: '冀美', name: '永恒殿' },
    { id: '石美', name: '慈悲殿' },
    { id: '晋美', name: '李大殿' },
    { id: '原美', name: '智慧阁' },
    { id: '太美', name: '光明殿' },
    { id: '桂美', name: '神恩殿' },
  ]

  // 计算汇总数据
  const summary = React.useMemo(() => {
    if (data.length === 0) {
      return {
        totalCumulativeStudentCount: 0,
        totalNewStudentRefundCount: 0,
        totalOldStudentRefundCount: 0,
        totalRefundCount: 0,
        averageRefundRate: 0,
        totalSuspensionCount: 0,
        totalLongTermLeaveCount: 0,
        totalLongTermAbsenceCount: 0,
        totalVacationStudentCount: 0,
        totalOtherSituationCount: 0,
        totalFluctuationCount: 0,
        averageFluctuationRate: 0,
      }
    }

    // 排除合计行
    const monthlyData = data.slice(0, -1)

    const totalCumulativeStudentCount = monthlyData.reduce(
      (sum, item) => sum + item.cumulativeStudentCount,
      0,
    )
    const totalNewStudentRefundCount = monthlyData.reduce(
      (sum, item) => sum + item.newStudentRefundCount,
      0,
    )
    const totalOldStudentRefundCount = monthlyData.reduce(
      (sum, item) => sum + item.oldStudentRefundCount,
      0,
    )
    const totalRefundCount = monthlyData.reduce((sum, item) => sum + item.totalRefundCount, 0)
    const totalSuspensionCount = monthlyData.reduce((sum, item) => sum + item.suspensionCount, 0)
    const totalLongTermLeaveCount = monthlyData.reduce(
      (sum, item) => sum + item.longTermLeaveCount,
      0,
    )
    const totalLongTermAbsenceCount = monthlyData.reduce(
      (sum, item) => sum + item.longTermAbsenceCount,
      0,
    )
    const totalVacationStudentCount = monthlyData.reduce(
      (sum, item) => sum + item.vacationStudentCount,
      0,
    )
    const totalOtherSituationCount = monthlyData.reduce(
      (sum, item) => sum + item.otherSituationCount,
      0,
    )
    const totalFluctuationCount = monthlyData.reduce(
      (sum, item) => sum + item.totalFluctuationCount,
      0,
    )

    const averageRefundRate =
      totalCumulativeStudentCount > 0 ? (totalRefundCount / totalCumulativeStudentCount) * 100 : 0
    const averageFluctuationRate =
      totalCumulativeStudentCount > 0
        ? (totalFluctuationCount / totalCumulativeStudentCount) * 100
        : 0

    return {
      totalCumulativeStudentCount,
      totalNewStudentRefundCount,
      totalOldStudentRefundCount,
      totalRefundCount,
      averageRefundRate,
      totalSuspensionCount,
      totalLongTermLeaveCount,
      totalLongTermAbsenceCount,
      totalVacationStudentCount,
      totalOtherSituationCount,
      totalFluctuationCount,
      averageFluctuationRate,
    }
  }, [data])

  // 加载数据
  const loadData = async () => {
    if (!selectedCampus) return

    setLoading(true)
    try {
      const result =
        await campusStudentFluctuationService.getCampusStudentFluctuationData(selectedCampus)
      setData(result)
    } catch (error) {
      message.error('加载数据失败')
      console.error('加载数据失败:', error)
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

  // 神殿变化时重新加载数据
  useEffect(() => {
    loadData()
  }, [selectedCampus])

  // 刷新数据
  const handleRefresh = () => {
    loadData()
  }

  // 导出数据
  const handleExport = () => {
    message.success('导出功能开发中...')
  }

  // 编辑记录
  const handleEdit = (record: CampusStudentFluctuationRecord) => {
    setEditingRecord(record)
    setEditModalVisible(true)
  }

  // 新增记录
  const handleAdd = () => {
    setEditingRecord(null)
    setEditModalVisible(true)
  }

  // 取消编辑
  const handleCancel = () => {
    setEditModalVisible(false)
    setEditingRecord(null)
  }

  // 保存记录
  const handleSave = async (record: CampusStudentFluctuationRecord) => {
    try {
      if (editingRecord) {
        // 更新记录
        await campusStudentFluctuationService.updateCampusStudentFluctuationRecord(
          record.key,
          record,
        )
        message.success('更新成功')
      } else {
        // 创建新记录
        await campusStudentFluctuationService.createCampusStudentFluctuationRecord(record)
        message.success('创建成功')
      }

      // 重新加载数据
      await loadData()
      setEditModalVisible(false)
      setEditingRecord(null)
    } catch (error) {
      message.error('保存失败')
      console.error('保存失败:', error)
    }
  }

  return (
    <div
      style={{
        padding: hideCampusSelector ? 0 : 24,
        background: hideCampusSelector ? 'transparent' : '#f5f5f5',
        minHeight: hideCampusSelector ? 'auto' : '100vh',
      }}
    >
      {!hideCampusSelector && (
        <>
          {/* 页面标题 */}
          <Card
            style={{
              marginBottom: 16,
              background: 'linear-gradient(135deg, #f5222d 0%, #ff4d4f 100%)',
              color: 'white',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ color: 'white', margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
                📊 神殿教化司学员异动表
              </h1>
              <p style={{ color: 'white', margin: '8px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
                全面掌握学员异动情况，助力学员稳定管理
              </p>
            </div>
          </Card>

          {/* 筛选条件 */}
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col>
                <Space>
                  <EnvironmentOutlined style={{ color: '#f5222d', fontSize: '16px' }} />
                  <span style={{ fontWeight: 'bold' }}>神殿选择：</span>
                  <CampusSelector
                    value={selectedCampus}
                    onChange={setSelectedCampus}
                    campuses={campuses}
                  />
                </Space>
              </Col>
            </Row>
          </Card>
        </>
      )}

      {/* 统计指标 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总累计带生人数"
              value={summary.totalCumulativeStudentCount}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总退费人数"
              value={summary.totalRefundCount}
              precision={0}
              valueStyle={{ color: '#cf1322' }}
              prefix={<UserDeleteOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均退费率"
              value={summary.averageRefundRate}
              precision={2}
              valueStyle={{ color: summary.averageRefundRate > 5 ? '#cf1322' : '#3f8600' }}
              suffix="%"
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均异动率"
              value={summary.averageFluctuationRate}
              precision={2}
              valueStyle={{ color: summary.averageFluctuationRate > 10 ? '#cf1322' : '#3f8600' }}
              suffix="%"
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据表格 */}
      <CampusStudentFluctuationTable
        campus={selectedCampus}
        data={data}
        loading={loading}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onEdit={handleEdit}
        onAdd={handleAdd}
      />

      {/* 编辑模态框 */}
      <CampusStudentFluctuationEditModal
        visible={editModalVisible}
        record={editingRecord}
        onCancel={handleCancel}
        onSave={handleSave}
      />
    </div>
  )
}

export default CampusStudentFluctuationPage
