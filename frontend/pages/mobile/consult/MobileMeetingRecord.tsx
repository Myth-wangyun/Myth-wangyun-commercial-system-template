/**
 * 移动端 - 祈福司会议记录
 * 按年度展示各次会议记录详情
 */
import { useState, useEffect, useCallback } from 'react'
import { App, Card, Spin, Empty, Button, Select, Tag } from 'antd'
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'
import axios from 'axios'
import '../shared/MobileDataPage.css'

interface MeetingRow {
  序号: number
  时间: string
  地点: string
  主持人: string
  重要领导: string
  参与人: string
  议题: string
  问题解决: string
  问题待解决: string
}

export default function MobileMeetingRecord() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState(dayjs().year())
  const [data, setData] = useState<MeetingRow[]>([])

  const loadData = useCallback(async () => {
    if (!currentCampus) return
    setLoading(true)
    try {
      const res = await axios.get(`/api/v1/consult/meeting-record/${year}`, {
        params: { campus: currentCampus },
      })
      setData(res.data?.表格数据 || [])
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [currentCampus, year])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)}>
          返回
        </Button>
        <h2>会议记录</h2>
        <div style={{ width: 60 }} />
      </div>

      <div className="m-year-selector">
        <Select
          value={year}
          onChange={setYear}
          style={{ width: 120 }}
          options={Array.from({ length: 5 }, (_, i) => ({
            value: dayjs().year() - i,
            label: `${dayjs().year() - i}年`,
          }))}
        />
      </div>

      <div className="m-data-content">
        {loading ? (
          <div className="m-data-loading">
            <Spin size="large" tip="加载中..." />
          </div>
        ) : data.length === 0 ? (
          <Empty description="暂无会议记录" />
        ) : (
          data.map((row, idx) => (
            <Card key={idx} className="m-data-card" size="small" style={{ marginBottom: 12 }}>
              <div className="m-data-row" style={{ marginBottom: 8 }}>
                <Tag color="blue">第{row.序号}次会议</Tag>
              </div>
              <div className="m-data-row">
                <span className="label">
                  <CalendarOutlined /> 时间
                </span>
                <span className="value">{row.时间 || '-'}</span>
              </div>
              <div className="m-data-row">
                <span className="label">
                  <EnvironmentOutlined /> 地点
                </span>
                <span className="value">{row.地点 || '-'}</span>
              </div>
              <div className="m-data-row">
                <span className="label">
                  <UserOutlined /> 主持人
                </span>
                <span className="value">{row.主持人 || '-'}</span>
              </div>
              {row.重要领导 && (
                <div className="m-data-row">
                  <span className="label">重要领导</span>
                  <span className="value">{row.重要领导}</span>
                </div>
              )}
              <div className="m-data-row">
                <span className="label">参与人</span>
                <span className="value">{row.参与人 || '-'}</span>
              </div>
              <div
                style={{ margin: '8px 0', padding: '8px', background: '#f0f5ff', borderRadius: 6 }}
              >
                <div style={{ fontSize: 12, color: '#1890ff', marginBottom: 4 }}>议题</div>
                <div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{row.议题 || '-'}</div>
              </div>
              {row.问题解决 && (
                <div
                  style={{
                    margin: '8px 0',
                    padding: '8px',
                    background: '#f6ffed',
                    borderRadius: 6,
                  }}
                >
                  <div style={{ fontSize: 12, color: '#52c41a', marginBottom: 4 }}>已解决问题</div>
                  <div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{row.问题解决}</div>
                </div>
              )}
              {row.问题待解决 && (
                <div
                  style={{
                    margin: '8px 0',
                    padding: '8px',
                    background: '#fff7e6',
                    borderRadius: 6,
                  }}
                >
                  <div style={{ fontSize: 12, color: '#fa8c16', marginBottom: 4 }}>待解决问题</div>
                  <div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{row.问题待解决}</div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
