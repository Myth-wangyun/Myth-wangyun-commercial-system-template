/**
 * 移动端 - 神殿就业目标与结果汇总表
 * 展示各班级的就业目标达成情况
 */
import { useState, useEffect, useCallback } from 'react'
import { App, Spin, Empty, Button, Select, Tag, Progress } from 'antd'
import { ArrowLeftOutlined, TrophyOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'
import { apiService } from '@/services/api'
import '../shared/MobileDataPage.css'

interface ClassRecord {
  班级名称: string
  档案人数: number
  需就业人数: number
  目标就业人数: number
  实际就业人数: number
  目标就业率: number
  实际就业率: number
  目标平均薪资: number
  实际平均薪资: number
  薪资过万人数?: number
}

export default function MobileEmploymentGoals() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState(dayjs().year())
  const [data, setData] = useState<ClassRecord[]>([])

  const loadData = useCallback(async () => {
    if (!currentCampus) return
    setLoading(true)
    try {
      const campus = currentCampus.replace(/神殿$/, '').trim()
      const res = await apiService.get<any>('/teaching-quality/class-employment-summary', {
        params: { campus, year },
      })
      const raw = (res as any)?.data ?? res
      const list = Array.isArray(raw) ? raw : raw?.行列表 || raw?.data || []
      setData(list)
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [currentCampus, year])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalEmployed = data.reduce((s, r) => s + (r.实际就业人数 || 0), 0)
  const totalStudents = data.reduce((s, r) => s + (r.档案人数 || 0), 0)
  const avgSalary =
    data.length > 0
      ? Math.round(data.reduce((s, r) => s + (r.实际平均薪资 || 0), 0) / data.length)
      : 0

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)}>
          返回
        </Button>
        <h2>就业目标与结果</h2>
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

      <div className="m-data-summary">
        <div className="stat-item">
          <span className="stat-value">{data.length}</span>
          <span className="stat-label">班级数</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{totalEmployed}</span>
          <span className="stat-label">就业人数</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">
            {totalStudents > 0 ? ((totalEmployed / totalStudents) * 100).toFixed(1) : 0}%
          </span>
          <span className="stat-label">就业率</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{avgSalary.toLocaleString()}</span>
          <span className="stat-label">平均薪资</span>
        </div>
      </div>

      <div className="m-data-content">
        {loading ? (
          <div className="m-data-loading">
            <Spin size="large" tip="加载中..." />
          </div>
        ) : data.length === 0 ? (
          <Empty description="暂无就业数据" />
        ) : (
          data.map((row, idx) => {
            const rate = row.档案人数 > 0 ? (row.实际就业人数 / row.档案人数) * 100 : 0
            const salaryReached =
              row.目标平均薪资 > 0 ? row.实际平均薪资 >= row.目标平均薪资 : false
            return (
              <div key={idx} className="m-check-card">
                <div className="check-header">
                  <span style={{ fontWeight: 600 }}>{row.班级名称}</span>
                  {salaryReached && (
                    <Tag color="success" icon={<TrophyOutlined />}>
                      达标
                    </Tag>
                  )}
                </div>
                <div className="check-body">
                  <div className="m-data-row">
                    <span className="label">档案人数</span>
                    <span className="value">{row.档案人数}</span>
                  </div>
                  <div className="m-data-row">
                    <span className="label">就业人数</span>
                    <span className="value">
                      {row.实际就业人数} / {row.目标就业人数}
                    </span>
                  </div>
                  <div style={{ padding: '4px 0' }}>
                    <div style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>
                      就业率: {rate.toFixed(1)}%
                    </div>
                    <Progress
                      percent={Math.min(rate, 100)}
                      size="small"
                      strokeColor={rate >= 80 ? '#52c41a' : rate >= 60 ? '#faad14' : '#ff4d4f'}
                      showInfo={false}
                    />
                  </div>
                  <div className="m-data-row">
                    <span className="label">平均薪资</span>
                    <span
                      className="value"
                      style={{ color: salaryReached ? '#52c41a' : '#fa8c16' }}
                    >
                      ¥{(row.实际平均薪资 || 0).toLocaleString()} / ¥
                      {(row.目标平均薪资 || 0).toLocaleString()}
                    </span>
                  </div>
                  {row.薪资过万人数 != null && row.薪资过万人数 > 0 && (
                    <div className="m-data-row">
                      <span className="label">薪资过万</span>
                      <span className="value">{row.薪资过万人数}人</span>
                    </div>
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
