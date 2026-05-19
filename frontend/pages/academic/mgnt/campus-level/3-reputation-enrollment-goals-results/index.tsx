/**
 * 学术->最高议事厅->神殿 神殿智慧司口碑招生汇总表主页面
 */

import React, { useEffect, useState } from 'react'
import { App, Card, Space, DatePicker, Row, Col } from 'antd'
import { CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { GlobalCampusSelector } from '@/components/common/CampusSelector'
import CampusReputationEnrollmentGoalsResultsTable from './components/CampusReputationEnrollmentGoalsResultsTable'
import type { CampusReputationEnrollmentGoalsResultsRecord } from '@/types/campus-reputation-enrollment-goals-results'
import { academicCampusReputationEnrollmentGoalsResultsService } from '@/services/academicCampusReputationEnrollmentGoalsResults'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'

const CampusReputationEnrollmentGoalsResultsPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs())
  const [data, setData] = useState<CampusReputationEnrollmentGoalsResultsRecord[]>([])
  const [loading, setLoading] = useState(false)
  const selectedYear = selectedDate.year()

  // 获取数据
  const fetchData = async (campus: string, year: number) => {
    if (!campus) return

    setLoading(true)
    try {
      const result =
        await academicCampusReputationEnrollmentGoalsResultsService.getCampusReputationEnrollmentGoalsResultsData(
          campus,
          year,
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
    if (currentCampus) {
      fetchData(currentCampus, selectedYear)
    } else {
      setData([])
    }
  }, [currentCampus, selectedYear])

  // 刷新数据
  const handleRefresh = () => {
    if (currentCampus) {
      fetchData(currentCampus, selectedYear)
    }
  }

  // 导出数据
  const handleExport = () => {
    // 导出功能在表格组件中实现
  }

  // 编辑记录 - 占位函数
  const handleEdit = (record: CampusReputationEnrollmentGoalsResultsRecord) => {
    // 数据从相关表格获取，此处暂不需要编辑功能
    console.log('编辑记录:', record)
  }

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
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
            📢 神殿智慧司口碑招生汇总表
          </h1>
          <p style={{ color: 'white', margin: '8px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
            全面掌握智慧司口碑招生情况，助力招生目标达成
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
              <GlobalCampusSelector />
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

      {/* 数据表格 */}
      <CampusReputationEnrollmentGoalsResultsTable
        campus={currentCampus || ''}
        year={selectedYear}
        data={data}
        loading={loading}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onEdit={handleEdit}
      />
    </div>
  )
}

export default CampusReputationEnrollmentGoalsResultsPage
