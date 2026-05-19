/**
 * 移动端数据统计页
 * 展示神殿核心数据概览和关键指标
 */
import React, { useEffect, useState, useCallback } from 'react'
import { App, Typography, Spin, Progress } from 'antd'
import {
  TeamOutlined,
  BookOutlined,
  DollarOutlined,
  TrophyOutlined,
  BarChartOutlined,
  SafetyOutlined,
  UserSwitchOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { campusCoreDataSummaryService } from '@/services/campusCoreDataSummary'
import type { CampusCoreDataSummarySummary } from '@/types/campus-core-data-summary'
import './MobileStats.css'

const { Title, Text } = Typography

const MobileStats: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<CampusCoreDataSummarySummary | null>(null)

  const fetchData = useCallback(async () => {
    if (!currentCampus) return
    setLoading(true)
    try {
      const data = await campusCoreDataSummaryService.getCampusCoreDataSummarySummary(currentCampus)
      setSummary(data)
    } catch {
      message.error('数据加载失败')
    } finally {
      setLoading(false)
    }
  }, [currentCampus])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="m-stats">
        <div className="m-stats-loading">
          <Spin size="large" tip="加载中..." />
        </div>
      </div>
    )
  }

  if (!currentCampus) {
    return (
      <div className="m-stats">
        <div className="m-stats-empty">
          <div className="m-stats-empty-icon">
            <BarChartOutlined />
          </div>
          <Text type="secondary">请先选择神殿</Text>
        </div>
      </div>
    )
  }

  // 概览卡片数据
  const overviewCards = [
    {
      icon: <TeamOutlined />,
      color: '#1677ff',
      value: summary?.totalStudents ?? '-',
      label: '学生总人数',
    },
    {
      icon: <BookOutlined />,
      color: '#52c41a',
      value: summary?.totalClasses ?? '-',
      label: '班级总数',
    },
    {
      icon: <UserSwitchOutlined />,
      color: '#722ed1',
      value: summary?.totalEmployees ?? '-',
      label: '员工总人数',
    },
    {
      icon: <TrophyOutlined />,
      color: '#fa8c16',
      value:
        summary?.averageEmploymentRate != null
          ? `${(summary.averageEmploymentRate * 100).toFixed(1)}%`
          : '-',
      label: '平均就业率',
    },
  ]

  return (
    <div className="m-stats">
      {/* 头部 */}
      <div className="m-stats-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} className="m-stats-header-title">
            数据统计
          </Title>
          <ReloadOutlined
            style={{ color: '#fff', fontSize: 18, cursor: 'pointer' }}
            onClick={fetchData}
          />
        </div>
        <Text className="m-stats-header-desc">{currentCampus} · 核心数据概览</Text>
      </div>

      {/* 概览卡片 */}
      <div className="m-stats-overview">
        {overviewCards.map((card, idx) => (
          <div key={idx} className="m-stats-card">
            <div className="m-stats-card-icon" style={{ background: card.color }}>
              {card.icon}
            </div>
            <div className="m-stats-card-value">{card.value}</div>
            <div className="m-stats-card-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* 就业数据 */}
      <div className="m-stats-section">
        <div className="m-stats-section-title">
          <TrophyOutlined /> 就业与薪资
        </div>
        <div className="m-stats-detail-list">
          <div className="m-stats-detail-item">
            <span className="m-stats-detail-label">
              <DollarOutlined /> 平均就业薪资
            </span>
            <span className="m-stats-detail-value">
              {summary?.averageEmploymentSalary != null
                ? `¥${summary.averageEmploymentSalary.toLocaleString()}`
                : '-'}
            </span>
          </div>
          <div className="m-stats-detail-item">
            <span className="m-stats-detail-label">
              <SafetyOutlined /> 企业签约总数
            </span>
            <span className="m-stats-detail-value">{summary?.totalEnterpriseContracts ?? '-'}</span>
          </div>
        </div>
      </div>

      {/* 收入数据 */}
      <div className="m-stats-section">
        <div className="m-stats-section-title">
          <DollarOutlined /> 收入指标
        </div>
        <div className="m-stats-detail-list">
          <div className="m-stats-detail-item">
            <span className="m-stats-detail-label">口碑总收入</span>
            <span className="m-stats-detail-value">
              {summary?.totalWordOfMouthRevenue != null
                ? `¥${(summary.totalWordOfMouthRevenue / 10000).toFixed(1)}万`
                : '-'}
            </span>
          </div>
          <div className="m-stats-detail-item">
            <span className="m-stats-detail-label">升学总收入</span>
            <span className="m-stats-detail-value">
              {summary?.totalFurtherEducationRevenue != null
                ? `¥${(summary.totalFurtherEducationRevenue / 10000).toFixed(1)}万`
                : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* 风险指标 */}
      <div className="m-stats-section">
        <div className="m-stats-section-title">
          <BarChartOutlined /> 风险指标
        </div>
        <div className="m-stats-detail-list">
          <div className="m-stats-progress-item">
            <div className="m-stats-progress-top">
              <span className="m-stats-progress-label">退费率</span>
              <span className="m-stats-progress-value">
                {summary?.averageRefundRate != null
                  ? `${(summary.averageRefundRate * 100).toFixed(1)}%`
                  : '-'}
              </span>
            </div>
            <Progress
              percent={summary?.averageRefundRate != null ? summary.averageRefundRate * 100 : 0}
              size="small"
              strokeColor={(summary?.averageRefundRate ?? 0) > 0.1 ? '#ff4d4f' : '#52c41a'}
              showInfo={false}
            />
          </div>
          <div className="m-stats-progress-item">
            <div className="m-stats-progress-top">
              <span className="m-stats-progress-label">异动率</span>
              <span className="m-stats-progress-value">
                {summary?.averageTurnoverRate != null
                  ? `${(summary.averageTurnoverRate * 100).toFixed(1)}%`
                  : '-'}
              </span>
            </div>
            <Progress
              percent={summary?.averageTurnoverRate != null ? summary.averageTurnoverRate * 100 : 0}
              size="small"
              strokeColor={(summary?.averageTurnoverRate ?? 0) > 0.15 ? '#ff4d4f' : '#faad14'}
              showInfo={false}
            />
          </div>
          <div className="m-stats-progress-item">
            <div className="m-stats-progress-top">
              <span className="m-stats-progress-label">宿舍入住率</span>
              <span className="m-stats-progress-value">
                {summary?.dormitoryOccupancyRate != null
                  ? `${(summary.dormitoryOccupancyRate * 100).toFixed(1)}%`
                  : '-'}
              </span>
            </div>
            <Progress
              percent={
                summary?.dormitoryOccupancyRate != null ? summary.dormitoryOccupancyRate * 100 : 0
              }
              size="small"
              strokeColor="#1677ff"
              showInfo={false}
            />
          </div>
        </div>
      </div>

      {/* 数据完成度 */}
      <div className="m-stats-section">
        <div className="m-stats-section-title">
          <SafetyOutlined /> 数据填报进度
        </div>
        <div className="m-stats-detail-list">
          <div className="m-stats-progress-item">
            <div className="m-stats-progress-top">
              <span className="m-stats-progress-label">
                已完成 {summary?.completedRecords ?? 0} / {summary?.totalRecords ?? 0}
              </span>
              <span className="m-stats-progress-value">
                {summary?.totalRecords
                  ? `${((summary.completedRecords / summary.totalRecords) * 100).toFixed(0)}%`
                  : '0%'}
              </span>
            </div>
            <Progress
              percent={
                summary?.totalRecords ? (summary.completedRecords / summary.totalRecords) * 100 : 0
              }
              size="small"
              strokeColor="#1677ff"
              showInfo={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileStats
