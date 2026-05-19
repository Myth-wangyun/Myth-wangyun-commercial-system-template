/**
 * 移动端 - 神殿每日咨询量汇总表
 * 展示当日各咨询师的咨询量、上门、报名等核心数据
 */
import { useState, useEffect, useCallback } from 'react'
import { App, Card, Spin, Empty, Button, DatePicker, Tag, Descriptions, Collapse } from 'antd'
import { ArrowLeftOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useCampusStore } from '@/stores/campusStore'
import dayjs, { Dayjs } from 'dayjs'
import * as dailySummaryApi from '@/services/consult/dailyConsultingSummary'
import '../shared/MobileDataPage.css'

export default function MobileDailyConsultingSummary() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState<Dayjs>(dayjs())
  const [data, setData] = useState<dailySummaryApi.DailySummaryResponse | null>(null)

  const loadData = useCallback(async () => {
    if (!currentCampus) return
    setLoading(true)
    try {
      const result = await dailySummaryApi.getDailySummary(date.format('YYYY-MM-DD'), currentCampus)
      setData(result)
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [currentCampus, date])

  useEffect(() => {
    loadData()
  }, [loadData])

  const renderSection = (section: dailySummaryApi.SectionData) => {
    const consultants = section.data || []
    const totals = section.totals

    return (
      <Card
        key={section.section_name}
        size="small"
        className="m-data-card"
        title={section.section_name}
      >
        {consultants.length === 0 ? (
          <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <>
            {consultants.map((c: dailySummaryApi.ConsultantSummary, i: number) => (
              <div key={i} className="m-list-item" style={{ background: '#fafafa' }}>
                <div className="item-header">
                  <span className="item-title">{c.consultant_name}</span>
                  <Tag color="blue">今日 {c.daily_consult || 0}</Tag>
                </div>
                <div
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 13 }}
                >
                  <span>月咨询量: {c.monthly_consult || 0}</span>
                  <span>
                    上门量: {c.daily_visit || 0}/{c.monthly_visit || 0}
                  </span>
                  <span>
                    报名数: {c.daily_enrolled || 0}/{c.monthly_enrolled || 0}
                  </span>
                  <span>转化率: {dailySummaryApi.formatPercent(c.enroll_rate)}</span>
                </div>
              </div>
            ))}
            {totals && (
              <Descriptions size="small" bordered column={2} style={{ marginTop: 8 }}>
                <Descriptions.Item label="日咨询量">{totals.daily_consult || 0}</Descriptions.Item>
                <Descriptions.Item label="月咨询量">
                  {totals.monthly_consult || 0}
                </Descriptions.Item>
                <Descriptions.Item label="日上门量">{totals.daily_visit || 0}</Descriptions.Item>
                <Descriptions.Item label="月上门量">{totals.monthly_visit || 0}</Descriptions.Item>
                <Descriptions.Item label="日报名数">{totals.daily_enrolled || 0}</Descriptions.Item>
                <Descriptions.Item label="月报名数">
                  {totals.monthly_enrolled || 0}
                </Descriptions.Item>
              </Descriptions>
            )}
          </>
        )}
      </Card>
    )
  }

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)}>
          返回
        </Button>
        <h2>每日咨询量汇总</h2>
        <div style={{ width: 60 }} />
      </div>

      <div className="m-date-nav">
        <Button
          size="small"
          icon={<LeftOutlined />}
          onClick={() => setDate((d) => d.subtract(1, 'day'))}
        />
        <DatePicker
          value={date}
          onChange={(d) => d && setDate(d)}
          format="YYYY-MM-DD"
          size="small"
          style={{ width: 140 }}
        />
        <Button
          size="small"
          icon={<RightOutlined />}
          onClick={() => setDate((d) => d.add(1, 'day'))}
        />
        <Button size="small" type="link" onClick={() => setDate(dayjs())}>
          今天
        </Button>
      </div>

      {data?.grand_totals && (
        <div className="m-data-summary">
          <div className="summary-card highlight">
            <span className="label">日咨询量</span>
            <span className="value">{data.grand_totals.all_total?.daily_consult || 0}</span>
          </div>
          <div className="summary-card">
            <span className="label">月咨询量</span>
            <span className="value">{data.grand_totals.all_total?.monthly_consult || 0}</span>
          </div>
          <div className="summary-card success">
            <span className="label">日上门量</span>
            <span className="value">{data.grand_totals.all_total?.daily_visit || 0}</span>
          </div>
          <div className="summary-card warning">
            <span className="label">日报名数</span>
            <span className="value">{data.grand_totals.all_total?.daily_enrolled || 0}</span>
          </div>
        </div>
      )}

      <div className="m-data-content">
        {loading ? (
          <div className="m-data-loading">
            <Spin size="large" tip="加载中..." />
          </div>
        ) : !data?.sections?.length ? (
          <Empty description="暂无数据" />
        ) : (
          <Collapse
            defaultActiveKey={data.sections.map((_, i) => String(i))}
            items={data.sections.map((section, i) => ({
              key: String(i),
              label: section.section_name,
              children: renderSection(section),
            }))}
          />
        )}
      </div>
    </div>
  )
}
