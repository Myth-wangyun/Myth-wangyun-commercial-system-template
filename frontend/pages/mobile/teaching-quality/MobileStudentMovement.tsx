/**
 * 移动端 - 神殿学员异动表
 * 按年度展示各月学员异动数据
 */
import { useState, useEffect, useCallback } from 'react'
import { App, Spin, Empty, Button, Select, Tag } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'
import { campusStudentMovementService } from '@/services/teaching-quality/campusStudentMovement'
import '../shared/MobileDataPage.css'

interface MovementRow {
  key: string
  month: number
  totalStudents: number
  newStudentRefund: number
  oldStudentRefund: number
  totalRefund: number
  refundRate: string
  suspensionTotal: number
  longLeaveTotal: number
  longAbsenceTotal: number
  holidayStudentTotal: number
  otherCasesTotal: number
  movementTotal: number
  movementRate: string
  isTotal?: boolean
}

export default function MobileStudentMovement() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState(dayjs().year())
  const [data, setData] = useState<MovementRow[]>([])

  const loadData = useCallback(async () => {
    if (!currentCampus) return
    setLoading(true)
    try {
      const res = await campusStudentMovementService.getCampusStudentMovementData(
        currentCampus,
        year,
      )
      setData(res as MovementRow[])
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [currentCampus, year])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalRow = data.find((r) => r.isTotal)
  const monthRows = data.filter((r) => !r.isTotal)

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)}>
          返回
        </Button>
        <h2>学员异动统计</h2>
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

      {totalRow && (
        <div className="m-data-summary">
          <div className="stat-item">
            <span className="stat-value">{totalRow.totalStudents}</span>
            <span className="stat-label">累计带生</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{totalRow.totalRefund}</span>
            <span className="stat-label">退费总数</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{totalRow.movementTotal}</span>
            <span className="stat-label">异动总数</span>
          </div>
        </div>
      )}

      <div className="m-data-content">
        {loading ? (
          <div className="m-data-loading">
            <Spin size="large" tip="加载中..." />
          </div>
        ) : monthRows.length === 0 ? (
          <Empty description="暂无异动数据" />
        ) : (
          monthRows.map((row) => (
            <div key={row.key} className="m-check-card">
              <div className="check-header">
                <span style={{ fontWeight: 600 }}>{row.month}月</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Tag color={row.movementTotal > 5 ? 'red' : 'green'}>{row.movementRate}</Tag>
                </div>
              </div>
              <div className="check-body">
                <div className="m-data-row">
                  <span className="label">累计带生</span>
                  <span className="value">{row.totalStudents}</span>
                </div>
                <div className="m-data-row">
                  <span className="label">退费 (新/老)</span>
                  <span className="value">
                    {row.newStudentRefund} / {row.oldStudentRefund} = {row.totalRefund}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="label">退费率</span>
                  <span className="value" style={{ color: '#fa8c16' }}>
                    {row.refundRate}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="label">休学/长假/不上课</span>
                  <span className="value">
                    {row.suspensionTotal} / {row.longLeaveTotal} / {row.longAbsenceTotal}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="label">异动总数</span>
                  <span className="value" style={{ fontWeight: 600 }}>
                    {row.movementTotal}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
