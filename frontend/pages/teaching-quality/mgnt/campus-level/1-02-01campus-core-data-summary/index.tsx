/**
 * 神殿教化司核心数据汇总表主页面
 */

import React, { useState, useEffect } from 'react'
import { App, Card, Space, DatePicker, Row, Col } from 'antd'
import { CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons'
import CampusSelector from '@/components/common/CampusSelector'
import CampusCoreDataSummaryStats from './components/CampusCoreDataSummaryStats'
import CampusCoreDataSummaryTable from './components/CampusCoreDataSummaryTable'
import type { CampusCoreDataSummaryRecord } from '@/types/campus-core-data-summary'
import { campusCoreDataSummaryService } from '@/services/teaching-quality/campusCoreDataSummary'
import { useCampusStore } from '@/stores/campusStore'
import { getEnvironmentCampusList } from '@/utils/campusHelpers'
import dayjs from 'dayjs'

interface CampusCoreDataSummaryPageProps {
  hideCampusSelector?: boolean // 是否隐藏神殿选择器
}

const CampusCoreDataSummaryPage: React.FC<CampusCoreDataSummaryPageProps> = ({
  hideCampusSelector = false,
}) => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs())
  const [data, setData] = useState<CampusCoreDataSummaryRecord[]>([])
  const [loading, setLoading] = useState(false)

  // 如果从 store 获取神殿，则使用 store 的神殿（去除"神殿"后缀以匹配服务端格式）
  useEffect(() => {
    if (hideCampusSelector && currentCampus) {
      // 直接使用带"神殿"后缀的完整名称，例如"主神殿"
      setSelectedCampus(currentCampus)
    }
  }, [hideCampusSelector, currentCampus])

  // 神殿列表（使用统一的排序后的神殿列表）
  const campuses = getEnvironmentCampusList()

  // 获取数据
  const fetchData = async (campus: string) => {
    if (!campus) return

    setLoading(true)
    try {
      const result = await campusCoreDataSummaryService.getCampusCoreDataSummaryData(campus)
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

  return (
    <div
      style={{
        padding: hideCampusSelector ? 0 : 24,
        background: hideCampusSelector ? 'transparent' : '#f5f5f5',
        minHeight: hideCampusSelector ? 'auto' : '100vh',
      }}
    >
      {/* 页面标题 - 仅在非隐藏模式下显示 */}
      {!hideCampusSelector && (
        <Card
          style={{
            marginBottom: 16,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ color: 'white', margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
              📊 神殿教化司核心数据汇总表
            </h1>
            <p style={{ color: 'white', margin: '8px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
              全面掌握神殿教质核心数据，助力科学决策
            </p>
          </div>
        </Card>
      )}

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
                <CalendarOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
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
      )}

      {/* 统计卡片 */}
      <CampusCoreDataSummaryStats data={data} loading={loading} />

      {/* 数据表格 */}
      <CampusCoreDataSummaryTable
        campus={selectedCampus}
        data={data}
        loading={loading}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onEdit={() => {}}
        onAdd={() => {}}
      />
    </div>
  )
}

export default CampusCoreDataSummaryPage
