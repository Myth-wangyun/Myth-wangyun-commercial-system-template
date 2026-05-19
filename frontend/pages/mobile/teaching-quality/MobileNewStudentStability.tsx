/**
 * 移动端 - 新生维稳统计表
 * 按年度展示各月新生维稳数据
 */
import { useState, useEffect, useCallback } from 'react'
import { App, Spin, Empty, Button, Select, Tag } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'
import { apiService } from '@/services/api'
import '../shared/MobileDataPage.css'

interface StabilityRow {
  month: number
  handoverCount: number
  reportedCount: number
  stableClassHoursCount: number
  unstableClassHoursCount: number
  fullRefundCount: number
  stillOwingCount: number
  totalOwingAmount: number
  refundCount: number
}

export default function MobileNewStudentStability() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState(dayjs().year())
  const [data, setData] = useState<StabilityRow[]>([])

  const loadData = useCallback(async () => {
    if (!currentCampus) return
    setLoading(true)
    try {
      const campus = currentCampus.replace(/神殿$/, '').trim()
      const res = await apiService.get<any>(
        '/teaching-quality/campus-monthly-new-stu-stability-summary',
        { params: { campus, year } },
      )
      const raw = (res as any)?.data ?? res
      const list = Array.isArray(raw?.行列表) ? raw.行列表 : Array.isArray(raw) ? raw : []
      setData(
        list.map((r: any, i: number) => ({
          month: r.month ?? r.月份 ?? i + 1,
          handoverCount: Number(r.handoverCount ?? r.交接人数 ?? 0),
          reportedCount: Number(r.reportedCount ?? r.报到人数 ?? 0),
          stableClassHoursCount: Number(r.stableClassHoursCount ?? r.稳定课时人数 ?? 0),
          unstableClassHoursCount: Number(r.unstableClassHoursCount ?? r.不稳定课时人数 ?? 0),
          fullRefundCount: Number(r.fullRefundCount ?? r.全额退费人数 ?? 0),
          stillOwingCount: Number(r.stillOwingCount ?? r.仍欠费人数 ?? 0),
          totalOwingAmount: Number(r.totalOwingAmount ?? r.欠费总金额 ?? 0),
          refundCount: Number(r.refundCount ?? r.退费人数 ?? 0),
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

  const totalHandover = data.reduce((s, r) => s + r.handoverCount, 0)
  const totalReported = data.reduce((s, r) => s + r.reportedCount, 0)
  const totalRefund = data.reduce((s, r) => s + r.refundCount, 0)
  const stabilityRate =
    totalReported > 0 ? (((totalReported - totalRefund) / totalReported) * 100).toFixed(1) : '0'

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)}>
          返回
        </Button>
        <h2>新生维稳统计</h2>
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
          <span className="stat-value">{totalHandover}</span>
          <span className="stat-label">交接人数</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{totalReported}</span>
          <span className="stat-label">报到人数</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{totalRefund}</span>
          <span className="stat-label">退费人数</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stabilityRate}%</span>
          <span className="stat-label">维稳率</span>
        </div>
      </div>

      <div className="m-data-content">
        {loading ? (
          <div className="m-data-loading">
            <Spin size="large" tip="加载中..." />
          </div>
        ) : data.length === 0 ? (
          <Empty description="暂无维稳数据" />
        ) : (
          data.map((row) => {
            const rate =
              row.reportedCount > 0
                ? (((row.reportedCount - row.refundCount) / row.reportedCount) * 100).toFixed(1)
                : '0'
            return (
              <div key={row.month} className="m-check-card">
                <div className="check-header">
                  <span style={{ fontWeight: 600 }}>{row.month}月</span>
                  <Tag
                    color={
                      Number(rate) >= 90 ? 'success' : Number(rate) >= 70 ? 'warning' : 'error'
                    }
                  >
                    维稳率 {rate}%
                  </Tag>
                </div>
                <div className="check-body">
                  <div className="m-data-row">
                    <span className="label">交接/报到</span>
                    <span className="value">
                      {row.handoverCount} / {row.reportedCount}
                    </span>
                  </div>
                  <div className="m-data-row">
                    <span className="label">稳定/不稳定</span>
                    <span className="value">
                      {row.stableClassHoursCount} / {row.unstableClassHoursCount}
                    </span>
                  </div>
                  <div className="m-data-row">
                    <span className="label">退费人数</span>
                    <span
                      className="value"
                      style={{ color: row.refundCount > 0 ? '#ff4d4f' : '#52c41a' }}
                    >
                      {row.refundCount}
                    </span>
                  </div>
                  {row.totalOwingAmount > 0 && (
                    <div className="m-data-row">
                      <span className="label">欠费金额</span>
                      <span className="value" style={{ color: '#fa8c16' }}>
                        ¥{row.totalOwingAmount.toLocaleString()}
                      </span>
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
