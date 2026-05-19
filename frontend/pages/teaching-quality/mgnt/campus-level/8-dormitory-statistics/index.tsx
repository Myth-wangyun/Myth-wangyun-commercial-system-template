// 02-08主神殿教化司现有宿舍统计表
import React, { useState, useEffect } from 'react'
import { App, Card, Row, Col, Space, Statistic, Select } from 'antd'
import {
  EnvironmentOutlined,
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  LineChartOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import type { CampusDormitoryRecord } from '@/types/campus-dormitory'
import { campusDormitoryService } from '@/services/campusDormitory'
import CampusDormitoryTable from './components/CampusDormitoryTable'
import CampusDormitoryEditModal from './components/CampusDormitoryEditModal'
import CampusSelector from '@/components/common/CampusSelector'
import { useCampusStore } from '@/stores/campusStore'

const { Option } = Select

interface CampusDormitoryManagementPageProps {
  hideCampusSelector?: boolean
}

const CampusDormitoryManagementPage: React.FC<CampusDormitoryManagementPageProps> = ({
  hideCampusSelector = false,
}) => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [data, setData] = useState<CampusDormitoryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CampusDormitoryRecord | null>(null)
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)

  // 从配置中心获取神殿列表
  const campuses = getAllCampuses().map((campus) => ({
    id: campus.name.replace('神殿', ''),
    name: campus.name,
  }))

  // 计算汇总数据
  const summary = React.useMemo(() => {
    if (data.length === 0) {
      return {
        totalEnrolledStudentCount: 0,
        totalDormitoryCount: 0,
        totalResidentCount: 0,
        averageOccupancyRate: 0,
        totalMaleDormitoryCount: 0,
        totalMaleResidentCount: 0,
        totalMaleVacantBedCount: 0,
        totalFemaleDormitoryCount: 0,
        totalFemaleResidentCount: 0,
        totalFemaleVacantBedCount: 0,
        totalPlannedRentCount: 0,
        totalActualRentCount: 0,
        totalPlannedVacateCount: 0,
        totalActualVacateCount: 0,
      }
    }

    // 排除合计行
    const monthlyData = data.slice(0, -1)

    const totalEnrolledStudentCount = monthlyData.reduce(
      (sum, item) => sum + item.enrolledStudentCount,
      0,
    )
    const totalDormitoryCount = monthlyData.reduce((sum, item) => sum + item.totalDormitoryCount, 0)
    const totalResidentCount = monthlyData.reduce((sum, item) => sum + item.totalResidentCount, 0)
    const totalMaleDormitoryCount = monthlyData.reduce(
      (sum, item) => sum + item.maleDormitoryCount,
      0,
    )
    const totalMaleResidentCount = monthlyData.reduce(
      (sum, item) => sum + item.maleResidentCount,
      0,
    )
    const totalMaleVacantBedCount = monthlyData.reduce(
      (sum, item) => sum + item.maleVacantBedCount,
      0,
    )
    const totalFemaleDormitoryCount = monthlyData.reduce(
      (sum, item) => sum + item.femaleDormitoryCount,
      0,
    )
    const totalFemaleResidentCount = monthlyData.reduce(
      (sum, item) => sum + item.femaleResidentCount,
      0,
    )
    const totalFemaleVacantBedCount = monthlyData.reduce(
      (sum, item) => sum + item.femaleVacantBedCount,
      0,
    )
    const totalPlannedRentCount = monthlyData.reduce((sum, item) => sum + item.plannedRentCount, 0)
    const totalActualRentCount = monthlyData.reduce((sum, item) => sum + item.actualRentCount, 0)
    const totalPlannedVacateCount = monthlyData.reduce(
      (sum, item) => sum + item.plannedVacateCount,
      0,
    )
    const totalActualVacateCount = monthlyData.reduce(
      (sum, item) => sum + item.actualVacateCount,
      0,
    )

    const averageOccupancyRate =
      totalEnrolledStudentCount > 0 ? (totalResidentCount / totalEnrolledStudentCount) * 100 : 0

    return {
      totalEnrolledStudentCount,
      totalDormitoryCount,
      totalResidentCount,
      averageOccupancyRate,
      totalMaleDormitoryCount,
      totalMaleResidentCount,
      totalMaleVacantBedCount,
      totalFemaleDormitoryCount,
      totalFemaleResidentCount,
      totalFemaleVacantBedCount,
      totalPlannedRentCount,
      totalActualRentCount,
      totalPlannedVacateCount,
      totalActualVacateCount,
    }
  }, [data])

  // 加载数据
  const loadData = async () => {
    if (!selectedCampus) return

    setLoading(true)
    try {
      const result = await campusDormitoryService.getCampusDormitoryData(selectedCampus, selectedYear)
      setData(result)
    } catch (error) {
      message.error('加载数据失败')
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 神殿或年份变化时重新加载数据
  useEffect(() => {
    loadData()
  }, [selectedCampus, selectedYear])

  // 在汇总模式下随全局神殿变化同步
  useEffect(() => {
    if (hideCampusSelector) {
      setSelectedCampus(currentCampus || '')
    }
  }, [hideCampusSelector, currentCampus])

  // 刷新数据
  const handleRefresh = () => {
    loadData()
  }

  // 导出数据
  const handleExport = () => {
    message.success('导出功能开发中...')
  }

  // 编辑记录
  const handleEdit = (record: CampusDormitoryRecord) => {
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
  const handleSave = async (record: CampusDormitoryRecord) => {
    try {
      if (editingRecord) {
        // 更新记录
        await campusDormitoryService.updateCampusDormitoryRecord(record.key, record)
        message.success('更新成功')
      } else {
        // 创建新记录
        await campusDormitoryService.createCampusDormitoryRecord(record)
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
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 页面标题 */}
      <Card
        style={{
          marginBottom: 16,
          background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
          color: 'white',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: 'white', margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
            🏠 神殿教化司现有宿舍统计表
          </h1>
          <p style={{ color: 'white', margin: '8px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
            全面掌握宿舍资源情况，助力宿舍管理优化
          </p>
        </div>
      </Card>

      {/* 筛选条件 */}
      {!hideCampusSelector && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col>
              <Space>
                <EnvironmentOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
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
                <span style={{ fontWeight: 'bold' }}>年份：</span>
                <Select
                  value={selectedYear}
                  onChange={(value) => setSelectedYear(value)}
                  style={{ width: 100 }}
                >
                  {[...Array(5)].map((_, i) => {
                    const y = currentYear - i
                    return (
                      <Option key={y} value={y}>
                        {y}
                      </Option>
                    )
                  })}
                </Select>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* 统计指标 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总在校生数"
              value={summary.totalEnrolledStudentCount}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总宿舍数量"
              value={summary.totalDormitoryCount}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<HomeOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均住宿率"
              value={summary.averageOccupancyRate}
              precision={2}
              valueStyle={{ color: summary.averageOccupancyRate > 80 ? '#3f8600' : '#cf1322' }}
              suffix="%"
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总空床位数"
              value={summary.totalMaleVacantBedCount + summary.totalFemaleVacantBedCount}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据表格 */}
      <CampusDormitoryTable
        campus={selectedCampus}
        data={data}
        loading={loading}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onEdit={handleEdit}
        onAdd={handleAdd}
      />

      {/* 编辑模态框 */}
      <CampusDormitoryEditModal
        visible={editModalVisible}
        record={editingRecord}
        onCancel={handleCancel}
        onSave={handleSave}
      />
    </div>
  )
}

export default CampusDormitoryManagementPage
