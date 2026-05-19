/**
 * 神殿教化司企业签约目标与结果汇总表主页面
 */

import React, { useState, useEffect } from 'react'
import { App, Card, Space, DatePicker, Row, Col } from 'antd'
import { CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons'
import CoreDataTabs from '../../../../../components/common/CoreDataTabs'
import CampusSelector from '@/components/common/CampusSelector'
import CampusContractGoalsResultsTable from './components/CampusContractGoalsResultsTable'
import type { CampusContractGoalsResultsRecord } from '@/types/campus-contract-goals-results'
import { campusContractGoalsResultsService } from '@/services/teaching-quality/campusContractGoalsResults'
import { useCampusStore } from '@/stores/campusStore'
import { fetchCampuses, type CampusProfile } from '@/services/configMaster'
import dayjs from 'dayjs'

interface CampusContractGoalsResultsPageProps {
  hideCampusSelector?: boolean
}

const CampusContractGoalsResultsPage: React.FC<CampusContractGoalsResultsPageProps> = ({
  hideCampusSelector = false,
}) => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs())
  const [data, setData] = useState<CampusContractGoalsResultsRecord[]>([])
  const [loading, setLoading] = useState(false)

  // 神殿列表 - 从数据库加载
  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([])

  // 加载神殿列表
  useEffect(() => {
    const loadCampuses = async () => {
      try {
        const data = await fetchCampuses()
        // 只显示启用的神殿，排除最高议事厅
        const activeCampuses = data
          .filter((c: CampusProfile) => c.is_active && c.name !== '最高议事厅')
          .map((c: CampusProfile) => ({
            id: c.short_name || c.name.replace('神殿', ''),
            name: c.name,
          }))
        setCampuses(activeCampuses)
        
        // 页面加载时自动选择当前神殿或第一个神殿
        if (hideCampusSelector && currentCampus) {
          setSelectedCampus(currentCampus)
        } else if (activeCampuses.length > 0 && !selectedCampus) {
          // 自动选择第一个神殿（使用完整名称）
          setSelectedCampus(activeCampuses[0].name)
        }
      } catch (error) {
        console.error('加载神殿列表失败:', error)
      }
    }
    loadCampuses()
  }, [currentCampus, hideCampusSelector])

  // 获取数据
  const fetchData = async (campus: string) => {
    if (!campus) return

    setLoading(true)
    try {
      const result =
        await campusContractGoalsResultsService.getCampusContractGoalsResultsData(campus)
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
    } else {
      message.warning('请先选择一个神殿进行刷新')
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
      {/* 功能标签栏 - 仅在非隐藏模式下显示 */}
      {!hideCampusSelector && <CoreDataTabs />}

      {!hideCampusSelector && (
        <>
          {/* 页面标题 */}
          <Card
            style={{
              marginBottom: 16,
              background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
              color: 'white',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ color: 'white', margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
                🤝 神殿教化司企业签约目标与结果汇总表
              </h1>
              <p style={{ color: 'white', margin: '8px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
                全面掌握企业签约情况，助力合作目标达成
              </p>
            </div>
          </Card>

          {/* 筛选条件 */}
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col>
                <Space>
                  <EnvironmentOutlined style={{ color: '#fa8c16', fontSize: '16px' }} />
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
      <CampusContractGoalsResultsTable
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

export default CampusContractGoalsResultsPage
