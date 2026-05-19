/**
 * 移动端 - 我的咨询量
 *
 * 功能：
 * 1. 显示当前咨询师的所有咨询量（私域/再/新分类）
 * 2. 支持日期切换和状态筛选
 * 3. 快速统计卡片（总量、私域、可再分配、可新分配）
 * 4. 卡片式列表展示咨询量
 * 5. 快捷操作：拨打电话、发消息、查看详情
 */

import React, { useState, useEffect, useCallback } from 'react'
import { App, Card, Tabs, Tag, Button, Space, Select, DatePicker, Spin, Empty } from 'antd'
import {
  FilterOutlined,
  PhoneOutlined,
  MessageOutlined,
  CalendarOutlined,
  LeftOutlined,
  RightOutlined,
  UserOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { useCampusStore } from '@/stores/campusStore'
import dayjs, { Dayjs } from 'dayjs'
import * as api from '@/pages/consult/type-count-system/api'
import type {
  ConsultationRecord,
  ConsultationCategory,
  MyConsultationsQueryParams,
} from '@/pages/consult/type-count-system/types'
import { useNavigate } from 'react-router-dom'
import './MobileMyConsultations.css'

interface StatsSummary {
  私域数量: number
  可再分配数量: number
  可新分配数量: number
  今日回访数量: number
}

export default function MobileMyConsultations() {
  const { message } = App.useApp()
  useAuthStore()
  useCampusStore()
  const navigate = useNavigate()

  // 基础状态
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<ConsultationCategory | 'all'>('all')
  const [records, setRecords] = useState<ConsultationRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // 统计数据
  const [stats, setStats] = useState<StatsSummary>({
    私域数量: 0,
    可再分配数量: 0,
    可新分配数量: 0,
    今日回访数量: 0,
  })

  // 日期相关
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [dateMode, setDateMode] = useState<'single' | 'all'>('all')

  // 筛选条件
  const [filters, setFilters] = useState<MyConsultationsQueryParams>({})
  const [showFilters, setShowFilters] = useState(false)
  const [statusOptions, setStatusOptions] = useState<string[]>([])
  const [sourceOptions, setSourceOptions] = useState<string[]>([])

  // 加载选项
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [statusRes, sourceRes] = await Promise.all([
          api.getStatusOptions(),
          api.getSourceOptions(),
        ])
        setStatusOptions(statusRes.data || [])
        setSourceOptions(sourceRes.data || [])
      } catch (error) {
        console.error('加载选项失败:', error)
      }
    }
    loadOptions()
  }, [])

  // 加载统计数据
  const loadStats = useCallback(async () => {
    try {
      const params: MyConsultationsQueryParams = {}
      if (dateMode === 'single') {
        params.start_date = selectedDate.format('YYYY-MM-DD')
        params.end_date = selectedDate.format('YYYY-MM-DD')
      }

      const result = await api.getMyConsultations({ ...params, page: 1, page_size: 9999 })
      if (result.success && result.data) {
        const allRecords = result.data.数据列表 || []
        setStats({
          私域数量: allRecords.filter((r) => r.咨询类别 === '私域').length,
          可再分配数量: allRecords.filter((r) => r.咨询类别 === '再').length,
          可新分配数量: allRecords.filter((r) => r.咨询类别 === '新').length,
          今日回访数量: allRecords.filter(
            (r) => r.咨询类别 === '私域' && dayjs().diff(dayjs(r.更新时间), 'day') >= 3,
          ).length,
        })
      }
    } catch (error) {
      console.error('加载统计失败:', error)
    }
  }, [dateMode, selectedDate])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  // 加载数据
  const loadData = useCallback(
    async (isRefresh: boolean = false) => {
      if (loading) return

      const currentPage = isRefresh ? 1 : page
      setLoading(true)

      try {
        const params: MyConsultationsQueryParams = {
          ...filters,
          page: currentPage,
          page_size: 20,
        }

        if (dateMode === 'single') {
          params.start_date = selectedDate.format('YYYY-MM-DD')
          params.end_date = selectedDate.format('YYYY-MM-DD')
        }

        if (activeTab !== 'all') {
          params.category = activeTab
        }

        const result = await api.getMyConsultations(params)
        if (result.success && result.data) {
          const newRecords = result.data.数据列表 || []

          if (isRefresh) {
            setRecords(newRecords)
            setPage(1)
          } else {
            setRecords((prev) => [...prev, ...newRecords])
          }

          setTotal(result.data.总记录数 || 0)
          setHasMore(newRecords.length === 20)
        }
      } catch (error) {
        console.error('加载数据失败:', error)
        message.error('加载失败')
      } finally {
        setLoading(false)
      }
    },
    [loading, page, filters, dateMode, selectedDate, activeTab],
  )

  // 初始加载
  useEffect(() => {
    loadData(true)
  }, [activeTab, dateMode, selectedDate, filters])

  // 刷新
  const handleRefresh = async () => {
    await Promise.all([loadStats(), loadData(true)])
  }

  // 加载更多
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1)
      setTimeout(() => loadData(false), 100)
    }
  }

  // 日期切换
  const handlePrevDay = () => {
    setSelectedDate((prev) => prev.subtract(1, 'day'))
  }

  const handleNextDay = () => {
    setSelectedDate((prev) => prev.add(1, 'day'))
  }

  const handleToday = () => {
    setSelectedDate(dayjs())
  }

  // 拨打电话
  const handleCall = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (phone) {
      window.location.href = `tel:${phone}`
    } else {
      message.warning('无电话号码')
    }
  }

  // 发消息
  const handleMessage = (record: ConsultationRecord, e: React.MouseEvent) => {
    e.stopPropagation()
    // 跳转到咨询记录详情
    navigate(`/m/consult/record/${record.记录ID}`, { state: { tab: 'communication' } })
  }

  // 查看详情
  const handleViewDetail = (record: ConsultationRecord) => {
    navigate(`/m/consult/record/${record.记录ID}`)
  }

  // 获取状态颜色
  const getStatusColor = (status?: string | null) => {
    const colorMap: Record<string, string> = {
      强意向: 'success',
      中意向: 'processing',
      弱意向: 'warning',
      无意向: 'default',
      已报名: 'cyan',
      联系不上: 'error',
    }
    return colorMap[status || ''] || 'default'
  }

  // 获取类别颜色
  const getCategoryColor = (category?: string | null) => {
    const colorMap: Record<string, string> = {
      私域: 'purple',
      再: 'orange',
      新: 'green',
    }
    return colorMap[category || ''] || 'default'
  }

  // 渲染统计卡片
  const renderStatsCards = () => (
    <div className="m-consult-stats">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">
            {stats.私域数量 + stats.可再分配数量 + stats.可新分配数量}
          </div>
          <div className="stat-label">总咨询量</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-value">{stats.私域数量}</div>
          <div className="stat-label">私域</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-value">{stats.可再分配数量}</div>
          <div className="stat-label">可再分配</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">{stats.可新分配数量}</div>
          <div className="stat-label">可新分配</div>
        </div>
      </div>
    </div>
  )

  // 渲染日期选择器
  const renderDateSelector = () => (
    <div className="m-consult-date-selector">
      <Space size="small">
        <Button
          size="small"
          type={dateMode === 'all' ? 'primary' : 'default'}
          onClick={() => setDateMode('all')}
        >
          全部时间
        </Button>
        <Button
          size="small"
          type={dateMode === 'single' ? 'primary' : 'default'}
          onClick={() => setDateMode('single')}
        >
          按日期
        </Button>
      </Space>

      {dateMode === 'single' && (
        <div className="date-picker-row">
          <Space size="small">
            <Button size="small" icon={<LeftOutlined />} onClick={handlePrevDay} />
            <DatePicker
              value={selectedDate}
              onChange={(date) => date && setSelectedDate(date)}
              format="YYYY-MM-DD"
              size="small"
              style={{ width: '140px' }}
              suffixIcon={<CalendarOutlined />}
            />
            <Button size="small" icon={<RightOutlined />} onClick={handleNextDay} />
            <Button size="small" type="link" onClick={handleToday}>
              今天
            </Button>
          </Space>
        </div>
      )}
    </div>
  )

  // 渲染筛选器
  const renderFilters = () =>
    showFilters && (
      <Card size="small" className="m-consult-filters" style={{ marginBottom: 12 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select
            placeholder="选择状态"
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
            style={{ width: '100%' }}
            allowClear
          >
            {statusOptions.map((option) => (
              <Select.Option key={option} value={option}>
                {option}
              </Select.Option>
            ))}
          </Select>

          <Select
            placeholder="选择来源"
            value={filters.source}
            onChange={(value) => setFilters({ ...filters, source: value })}
            style={{ width: '100%' }}
            allowClear
          >
            {sourceOptions.map((option) => (
              <Select.Option key={option} value={option}>
                {option}
              </Select.Option>
            ))}
          </Select>

          <Button
            type="primary"
            block
            onClick={() => {
              setShowFilters(false)
              loadData(true)
            }}
          >
            应用筛选
          </Button>
        </Space>
      </Card>
    )

  // 渲染咨询量卡片
  const renderConsultationCard = (record: ConsultationRecord) => {
    const daysSinceUpdate = record.更新时间 ? dayjs().diff(dayjs(record.更新时间), 'day') : null

    return (
      <Card
        key={record.记录ID}
        size="small"
        className="m-consult-card"
        onClick={() => handleViewDetail(record)}
        hoverable
      >
        <div className="card-header">
          <div className="left">
            <span className="name">{record.咨询者姓名 || '未知'}</span>
            <Tag color={getCategoryColor(record.咨询类别)}>{record.咨询类别}</Tag>
            <Tag color={getStatusColor(record.状态)}>{record.状态 || '未知'}</Tag>
          </div>
          {daysSinceUpdate !== null && daysSinceUpdate > 0 && (
            <div className="days-badge">
              <ClockCircleOutlined /> {daysSinceUpdate}天前
            </div>
          )}
        </div>

        <div className="card-body">
          <div className="info-row">
            <PhoneOutlined /> <span>{record.电话}</span>
          </div>
          {record.位置 && (
            <div className="info-row">
              <EnvironmentOutlined /> <span>{record.位置}</span>
            </div>
          )}
          {record.量来源 && (
            <div className="info-row">
              <span className="label">来源：</span>
              <span>{record.量来源}</span>
              {record.媒体来源 && <span> / {record.媒体来源}</span>}
            </div>
          )}
          {record.备注 && (
            <div className="info-row remarks">
              <span className="label">备注：</span>
              <span className="text">{record.备注}</span>
            </div>
          )}
        </div>

        <div className="card-footer">
          <div className="meta">
            <UserOutlined /> {record.咨询师 || '未分配'}
            <span className="separator">•</span>
            {dayjs(record.登记日期).format('MM-DD')}
          </div>
          <Space size="small" className="actions" onClick={(e) => e.stopPropagation()}>
            <Button
              size="small"
              type="primary"
              icon={<PhoneOutlined />}
              onClick={(e) => handleCall(record.电话, e)}
            >
              拨打
            </Button>
            <Button
              size="small"
              icon={<MessageOutlined />}
              onClick={(e) => handleMessage(record, e)}
            >
              沟通
            </Button>
          </Space>
        </div>
      </Card>
    )
  }

  return (
    <div className="mobile-my-consultations">
      {/* 顶部区域 */}
      <div className="m-consult-header">
        <h2 className="page-title">我的咨询量</h2>
        <Button
          icon={<ReloadOutlined />}
          size="small"
          onClick={handleRefresh}
          loading={loading && page === 1}
        >
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      {renderStatsCards()}

      {/* 日期选择器 */}
      {renderDateSelector()}

      {/* 工具栏 */}
      <div className="m-consult-toolbar">
        <Space>
          <Button
            size="small"
            icon={<FilterOutlined />}
            onClick={() => setShowFilters(!showFilters)}
            type={showFilters ? 'primary' : 'default'}
          >
            筛选
          </Button>
        </Space>
        <span className="total-count">共 {total} 条</span>
      </div>

      {/* 筛选器 */}
      {renderFilters()}

      {/* 标签页 */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as ConsultationCategory | 'all')}
        items={[
          { key: 'all', label: `全部 (${total})` },
          { key: '私域', label: `私域 (${stats.私域数量})` },
          { key: '再', label: `再 (${stats.可再分配数量})` },
          { key: '新', label: `新 (${stats.可新分配数量})` },
        ]}
      />

      {/* 列表 */}
      <div className="m-consult-list">
        {loading && page === 1 ? (
          <div className="loading-wrapper">
            <Spin size="large" tip="加载中..." />
          </div>
        ) : records.length === 0 ? (
          <Empty description="暂无咨询量" />
        ) : (
          <>
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {records.map(renderConsultationCard)}
            </Space>

            {hasMore && (
              <div className="load-more-btn">
                <Button block onClick={handleLoadMore} loading={loading}>
                  {loading ? '加载中...' : '加载更多'}
                </Button>
              </div>
            )}

            {!hasMore && records.length > 0 && <div className="no-more">没有更多数据了</div>}
          </>
        )}
      </div>
    </div>
  )
}
