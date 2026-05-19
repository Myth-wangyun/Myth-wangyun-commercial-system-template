/**
 * 移动端 - 标准化检查（教员/班主任）
 * 按日期查看标准化检查项目完成情况
 */
import { useState, useEffect, useCallback } from 'react'
import { App, Spin, Empty, Button, Tag, Segmented } from 'antd'
import {
  ArrowLeftOutlined,
  LeftOutlined,
  RightOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'
import { fetchStandardization, type StandardizationRow } from '@/services/standardizationCheck'
import { apiService } from '@/services/api'
import '../shared/MobileDataPage.css'

type CheckType = 'teacher' | 'homeroom'

export default function MobileStandardizationCheck() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState(dayjs())
  const [data, setData] = useState<StandardizationRow[]>([])
  const [checkType, setCheckType] = useState<CheckType>('teacher')

  const loadData = useCallback(async () => {
    if (!currentCampus) return
    setLoading(true)
    try {
      const campus = currentCampus.replace(/神殿$/, '').trim()
      if (checkType === 'teacher') {
        const res = await fetchStandardization(campus, date.format('YYYY-MM-DD'))
        setData(res?.行数据 || [])
      } else {
        // 班主任标准化检查使用 teaching-quality API
        const res = await apiService.get<any>('/teaching-quality/homeroom-standardization-check', {
          params: { campus, date: date.format('YYYY-MM-DD') },
        })
        const raw = (res as any)?.data ?? res
        setData(raw?.行数据 || [])
      }
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [currentCampus, date, checkType])

  useEffect(() => {
    loadData()
  }, [loadData])

  const completedCount = data.filter((r) => {
    // 检查是否有至少一个 day 字段为 true
    return Object.keys(r).some(
      (k) => k.startsWith('day') && r[k as keyof StandardizationRow] === true,
    )
  }).length

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)}>
          返回
        </Button>
        <h2>标准化检查</h2>
        <div style={{ width: 60 }} />
      </div>

      <div className="m-data-filter">
        <Segmented
          value={checkType}
          onChange={(v) => setCheckType(v as CheckType)}
          options={[
            { label: '教员检查', value: 'teacher' },
            { label: '班主任检查', value: 'homeroom' },
          ]}
          block
          style={{ marginBottom: 8 }}
        />
      </div>

      <div className="m-date-nav">
        <Button
          icon={<LeftOutlined />}
          size="small"
          onClick={() => setDate((d) => d.subtract(1, 'day'))}
        />
        <span className="date-text" onClick={() => setDate(dayjs())}>
          {date.format('YYYY-MM-DD')} {date.format('ddd')}
        </span>
        <Button
          icon={<RightOutlined />}
          size="small"
          onClick={() => setDate((d) => d.add(1, 'day'))}
        />
      </div>

      <div className="m-data-summary">
        <div className="stat-item">
          <span className="stat-value">{data.length}</span>
          <span className="stat-label">检查项</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{completedCount}</span>
          <span className="stat-label">已完成</span>
        </div>
      </div>

      <div className="m-data-content">
        {loading ? (
          <div className="m-data-loading">
            <Spin size="large" tip="加载中..." />
          </div>
        ) : data.length === 0 ? (
          <Empty description="当日暂无检查项目" />
        ) : (
          data.map((row, idx) => {
            // 判断当天是否完成
            const dayKey = `day${date.date()}` as keyof StandardizationRow
            const isDone = row[dayKey] === true
            return (
              <div key={idx} className="m-list-item">
                <div className="item-header">
                  <span style={{ fontWeight: 500 }}>{row.项目名称}</span>
                  {isDone ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                      完成
                    </Tag>
                  ) : (
                    <Tag color="default" icon={<CloseCircleOutlined />}>
                      未完成
                    </Tag>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
