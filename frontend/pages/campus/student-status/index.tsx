import React, { useState, useEffect, useCallback } from 'react'
import { App, Card, Row, Col, Space, Statistic, Button } from 'antd'
import {
  EnvironmentOutlined,
  UserOutlined,
  BookOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  PlusOutlined,
  ReloadOutlined,
  ExportOutlined,
} from '@ant-design/icons'
import type { CampusStudentStatusRecord } from '@/types/campus-student-status'
import { campusStudentStatusService } from '@/services/campusStudentStatus'
import CampusStudentStatusTable from './components/CampusStudentStatusTable'
import CampusStudentStatusEditModal from './components/CampusStudentStatusEditModal'
import CampusSelector from '@/components/common/CampusSelector'

const CampusStudentStatusPage: React.FC = () => {
  const { message } = App.useApp()
  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [data, setData] = useState<CampusStudentStatusRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CampusStudentStatusRecord | null>(null)

  const campuses = [
    { id: '盛邦', name: '主神殿' },
    { id: '冀美', name: '永恒殿' },
    { id: '石美', name: '慈悲殿' },
    { id: '晋美', name: '李大殿' },
    { id: '原美', name: '智慧阁' },
    { id: '太美', name: '光明殿' },
    { id: '桂美', name: '神恩殿' },
  ]

  const fetchData = useCallback(async () => {
    if (!selectedCampus) {
      setData([])
      return
    }
    setLoading(true)
    try {
      const result = await campusStudentStatusService.getCampusStudentStatusData(selectedCampus)
      setData(result)
    } catch (error) {
      message.error('获取学籍数据失败')
      console.error('Failed to fetch student status data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedCampus])

  useEffect(() => {
    // Set initial campus to '盛邦' if none selected
    if (!selectedCampus && campuses.length > 0) {
      setSelectedCampus(campuses[0].id)
    }
  }, [selectedCampus, campuses])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = () => {
    fetchData()
  }

  const handleExport = () => {
    message.success('导出功能待实现')
    console.log('Export data:', data)
  }

  const handleAdd = () => {
    if (!selectedCampus) {
      message.warning('请先选择一个神殿才能新增记录。')
      return
    }
    setEditingRecord({
      key: `new-${Date.now()}`,
      month: new Date().getMonth() + 1, // Default to current month
      campus: selectedCampus,
      vocationalThreeYearCount: 0,
      vocationalOneYearCount: 0,
      vocationalOtherRegisteredCount: 0,
      vocationalTargetCount: 0,
      vocationalTargetTime: '',
      vocationalActualCount: 0,
      adultExamCount: 0,
      nationalOpenCount: 0,
      universityOtherRegisteredCount: 0,
      universityTargetCount: 0,
      universityTargetTime: '',
      universityActualCount: 0,
    })
    setEditModalVisible(true)
  }

  const handleEdit = (record: CampusStudentStatusRecord) => {
    setEditingRecord(record)
    setEditModalVisible(true)
  }

  const handleSave = async (record: CampusStudentStatusRecord) => {
    setLoading(true)
    try {
      if (record.key.startsWith('new-')) {
        // Add new record
        const newRecord = await campusStudentStatusService.addCampusStudentStatusRecord(record)
        setData((prevData) => [...prevData.slice(0, -1), newRecord, prevData[prevData.length - 1]])
        message.success('新增记录成功')
      } else {
        // Update existing record
        const updatedRecord =
          await campusStudentStatusService.updateCampusStudentStatusRecord(record)
        setData((prevData) =>
          prevData.map((item) => (item.key === updatedRecord.key ? updatedRecord : item)),
        )
        message.success('更新记录成功')
      }
      setEditModalVisible(false)
      setEditingRecord(null)
      fetchData() // Refresh data to update totals
    } catch (error) {
      message.error('保存记录失败')
      console.error('Failed to save record:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditModalVisible(false)
    setEditingRecord(null)
  }

  // Calculate summary statistics
  const summary = data.reduce(
    (acc, item) => {
      if (item.month !== 0) {
        // Exclude total row from individual sums for average calculation
        acc.totalVocationalThreeYearCount += item.vocationalThreeYearCount
        acc.totalVocationalOneYearCount += item.vocationalOneYearCount
        acc.totalVocationalOtherRegisteredCount += item.vocationalOtherRegisteredCount
        acc.totalVocationalTargetCount += item.vocationalTargetCount
        acc.totalVocationalActualCount += item.vocationalActualCount
        acc.totalAdultExamCount += item.adultExamCount
        acc.totalNationalOpenCount += item.nationalOpenCount
        acc.totalUniversityOtherRegisteredCount += item.universityOtherRegisteredCount
        acc.totalUniversityTargetCount += item.universityTargetCount
        acc.totalUniversityActualCount += item.universityActualCount
        acc.monthCount++
      }
      return acc
    },
    {
      totalVocationalThreeYearCount: 0,
      totalVocationalOneYearCount: 0,
      totalVocationalOtherRegisteredCount: 0,
      totalVocationalTargetCount: 0,
      totalVocationalActualCount: 0,
      totalAdultExamCount: 0,
      totalNationalOpenCount: 0,
      totalUniversityOtherRegisteredCount: 0,
      totalUniversityTargetCount: 0,
      totalUniversityActualCount: 0,
      monthCount: 0,
    },
  )

  const vocationalCompletionRate =
    summary.totalVocationalTargetCount > 0
      ? (summary.totalVocationalActualCount / summary.totalVocationalTargetCount) * 100
      : 0

  const universityCompletionRate =
    summary.totalUniversityTargetCount > 0
      ? (summary.totalUniversityActualCount / summary.totalUniversityTargetCount) * 100
      : 0

  const totalStudents = summary.totalVocationalActualCount + summary.totalUniversityActualCount

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
            📚 神殿教化司学籍统计表
          </h1>
          <p style={{ color: 'white', margin: '8px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
            全面掌握学籍注册情况，优化教育管理
          </p>
        </div>
      </Card>

      {/* 筛选条件 */}
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
        </Row>
      </Card>

      {/* 统计指标 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总注册学生数"
              value={totalStudents}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="中专层次完成率"
              value={vocationalCompletionRate}
              precision={2}
              valueStyle={{ color: vocationalCompletionRate >= 80 ? '#3f8600' : '#cf1322' }}
              suffix="%"
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="大学层次完成率"
              value={universityCompletionRate}
              precision={2}
              valueStyle={{ color: universityCompletionRate >= 80 ? '#3f8600' : '#cf1322' }}
              suffix="%"
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="整体完成率"
              value={(vocationalCompletionRate + universityCompletionRate) / 2}
              precision={2}
              valueStyle={{
                color:
                  (vocationalCompletionRate + universityCompletionRate) / 2 >= 80
                    ? '#3f8600'
                    : '#cf1322',
              }}
              suffix="%"
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据表格 */}
      <CampusStudentStatusTable
        campus={selectedCampus}
        data={data}
        loading={loading}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onEdit={handleEdit}
        onAdd={handleAdd}
      />

      {/* 编辑模态框 */}
      <CampusStudentStatusEditModal
        visible={editModalVisible}
        record={editingRecord}
        onCancel={handleCancel}
        onSave={handleSave}
      />
    </div>
  )
}

export default CampusStudentStatusPage
