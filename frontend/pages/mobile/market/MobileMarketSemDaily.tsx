import React, { useState, useEffect } from 'react'
import { Spin, Empty } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { useCampusStore } from '@/stores/campusStore'
import api from '@/services/api'
import dayjs from 'dayjs'
import '../shared/MobileDataPage.css'

export default function MobileMarketSemDaily() {
  const { user } = useAuthStore()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any[]>([])
  const [date, setDate] = useState(dayjs())

  const campusName = currentCampus || user?.campus || ''

  useEffect(() => {
    if (!campusName) return
    loadData()
  }, [campusName, date])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/market/sem-daily-data', {
        params: { campus: campusName, date: date.format('YYYY-MM-DD') },
      })
      const items = res.data?.items || res.data?.data || []
      setData(Array.isArray(items) ? items : [])
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <h2>SEM每日数据</h2>
        <p>{campusName}</p>
      </div>

      <div className="m-date-nav">
        <button onClick={() => setDate((d) => d.subtract(1, 'day'))}>
          <LeftOutlined />
        </button>
        <span>{date.format('YYYY-MM-DD')}</span>
        <button onClick={() => setDate((d) => d.add(1, 'day'))}>
          <RightOutlined />
        </button>
      </div>

      <Spin spinning={loading}>
        {data.length === 0 ? (
          <Empty description="暂无数据" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            {data.map((item: any, i: number) => (
              <div className="m-data-card" key={i}>
                <div className="m-data-row">
                  <span className="m-data-label">平台</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {item.platform || item.平台 || '-'}
                  </span>
                </div>
                <div
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}
                >
                  <div>
                    <div style={{ color: '#999', fontSize: 12 }}>消费</div>
                    <div style={{ fontWeight: 600 }}>
                      ¥{(item.cost || item.消费 || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: 12 }}>展现</div>
                    <div style={{ fontWeight: 600 }}>{item.impressions || item.展现 || 0}</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: 12 }}>点击</div>
                    <div style={{ fontWeight: 600 }}>{item.clicks || item.点击 || 0}</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: 12 }}>转化</div>
                    <div style={{ fontWeight: 600, color: '#52c41a' }}>
                      {item.conversions || item.转化 || 0}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Spin>
    </div>
  )
}
