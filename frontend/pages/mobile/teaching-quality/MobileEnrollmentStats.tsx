/**
 * 移动端 - 神殿学籍统计表
 * 按年度展示各月学籍注册数据
 */
import { useState, useEffect, useCallback } from 'react'
import { App, Spin, Empty, Button, Select, Tag } from 'antd'
import { ArrowLeftOutlined, BookOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'
import { apiService } from '@/services/api'
import '../shared/MobileDataPage.css'

interface EnrollmentRow {
  month: number
  secondaryThreeYearRegistered: number
  secondaryOneYearRegistered: number
  secondaryOtherRegistered: number
  secondaryTargetRegistered: number
  secondaryActualRegistered: number
  collegeAdultExamRegistered: number
  collegeOpenUnivRegistered: number
  collegeOtherRegistered: number
  collegeTargetRegistered: number
  collegeActualRegistered: number
}

export default function MobileEnrollmentStats() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState(dayjs().year())
  const [data, setData] = useState<EnrollmentRow[]>([])

  const loadData = useCallback(async () => {
    if (!currentCampus) return
    setLoading(true)
    try {
      const campus = currentCampus.replace(/神殿$/, '').trim()
      const res = await apiService.get<any>('/teaching-quality/campus-enrollment-statistics', {
        params: { campus, year },
      })
      const raw = (res as any)?.data ?? res
      const list = Array.isArray(raw?.行列表) ? raw.行列表 : Array.isArray(raw) ? raw : []
      setData(
        list.map((r: any, i: number) => ({
          month: Number(r.month ?? i + 1),
          secondaryThreeYearRegistered: Number(r.secondaryThreeYearRegistered ?? 0),
          secondaryOneYearRegistered: Number(r.secondaryOneYearRegistered ?? 0),
          secondaryOtherRegistered: Number(r.secondaryOtherRegistered ?? 0),
          secondaryTargetRegistered: Number(r.secondaryTargetRegistered ?? 0),
          secondaryActualRegistered: Number(r.secondaryActualRegistered ?? 0),
          collegeAdultExamRegistered: Number(r.collegeAdultExamRegistered ?? 0),
          collegeOpenUnivRegistered: Number(r.collegeOpenUnivRegistered ?? 0),
          collegeOtherRegistered: Number(r.collegeOtherRegistered ?? 0),
          collegeTargetRegistered: Number(r.collegeTargetRegistered ?? 0),
          collegeActualRegistered: Number(r.collegeActualRegistered ?? 0),
        })),
      )
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [currentCampus, year])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalSecondary = data.reduce((s, r) => s + r.secondaryActualRegistered, 0)
  const totalCollege = data.reduce((s, r) => s + r.collegeActualRegistered, 0)

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)}>
          返回
        </Button>
        <h2>学籍统计</h2>
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
          <span className="stat-value">{totalSecondary}</span>
          <span className="stat-label">中专注册</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{totalCollege}</span>
          <span className="stat-label">大学注册</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{totalSecondary + totalCollege}</span>
          <span className="stat-label">总注册</span>
        </div>
      </div>

      <div className="m-data-content">
        {loading ? (
          <div className="m-data-loading">
            <Spin size="large" tip="加载中..." />
          </div>
        ) : data.length === 0 ? (
          <Empty description="暂无学籍数据" />
        ) : (
          data.map((row) => {
            const secondaryTotal =
              row.secondaryThreeYearRegistered +
              row.secondaryOneYearRegistered +
              row.secondaryOtherRegistered
            const collegeTotal =
              row.collegeAdultExamRegistered +
              row.collegeOpenUnivRegistered +
              row.collegeOtherRegistered
            return (
              <div key={row.month} className="m-check-card">
                <div className="check-header">
                  <span style={{ fontWeight: 600 }}>
                    <BookOutlined /> {row.month}月
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Tag color="blue">中专 {row.secondaryActualRegistered}</Tag>
                    <Tag color="purple">大学 {row.collegeActualRegistered}</Tag>
                  </div>
                </div>
                <div className="check-body">
                  <div
                    style={{ padding: '4px 0', fontSize: 12, color: '#1890ff', fontWeight: 500 }}
                  >
                    中专层次
                  </div>
                  <div className="m-data-row">
                    <span className="label">三年制/一年制/其他</span>
                    <span className="value">
                      {row.secondaryThreeYearRegistered} / {row.secondaryOneYearRegistered} /{' '}
                      {row.secondaryOtherRegistered}
                    </span>
                  </div>
                  <div className="m-data-row">
                    <span className="label">目标/实际</span>
                    <span className="value">
                      {row.secondaryTargetRegistered} / {row.secondaryActualRegistered}
                    </span>
                  </div>
                  <div
                    style={{ padding: '4px 0', fontSize: 12, color: '#722ed1', fontWeight: 500 }}
                  >
                    大学层次
                  </div>
                  <div className="m-data-row">
                    <span className="label">成考/开放/其他</span>
                    <span className="value">
                      {row.collegeAdultExamRegistered} / {row.collegeOpenUnivRegistered} /{' '}
                      {row.collegeOtherRegistered}
                    </span>
                  </div>
                  <div className="m-data-row">
                    <span className="label">目标/实际</span>
                    <span className="value">
                      {row.collegeTargetRegistered} / {row.collegeActualRegistered}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
