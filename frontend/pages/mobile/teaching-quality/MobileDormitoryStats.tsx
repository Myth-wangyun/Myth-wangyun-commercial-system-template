/**
 * 移动端 - 神殿宿舍统计表
 * 按年度展示各月宿舍使用数据
 */
import { useState, useEffect, useCallback } from 'react'
import { App, Spin, Empty, Button, Select, Tag } from 'antd'
import { ArrowLeftOutlined, HomeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'
import { apiService } from '@/services/api'
import '../shared/MobileDataPage.css'

interface DormRow {
  month: number
  inSchoolCount: number
  dormTotalCount: number
  dormResidentCount: number
  maleDormCount: number
  maleDormResidentCount: number
  maleEmptyBedCount: number
  femaleDormCount: number
  femaleDormResidentCount: number
  femaleEmptyBedCount: number
  remark?: string
}

export default function MobileDormitoryStats() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState(dayjs().year())
  const [data, setData] = useState<DormRow[]>([])

  const loadData = useCallback(async () => {
    if (!currentCampus) return
    setLoading(true)
    try {
      const campus = currentCampus.replace(/神殿$/, '').trim()
      const res = await apiService.get<any>(
        '/teaching-quality/campus-dormitory-statistics-summary',
        { params: { campus, year } },
      )
      const raw = (res as any)?.data ?? res
      const list = Array.isArray(raw?.行列表) ? raw.行列表 : Array.isArray(raw) ? raw : []
      setData(
        list.map((r: any, i: number) => ({
          month: Number(r.month ?? i + 1),
          inSchoolCount: Number(r.inSchoolCount ?? 0),
          dormTotalCount: Number(r.dormTotalCount ?? 0),
          dormResidentCount: Number(r.dormResidentCount ?? 0),
          maleDormCount: Number(r.maleDormCount ?? 0),
          maleDormResidentCount: Number(r.maleDormResidentCount ?? 0),
          maleEmptyBedCount: Number(r.maleEmptyBedCount ?? 0),
          femaleDormCount: Number(r.femaleDormCount ?? 0),
          femaleDormResidentCount: Number(r.femaleDormResidentCount ?? 0),
          femaleEmptyBedCount: Number(r.femaleEmptyBedCount ?? 0),
          remark: r.remark ?? '',
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

  const totalResidents = data.reduce((s, r) => s + r.dormResidentCount, 0)
  const totalDorms = data.length > 0 ? data[data.length - 1].dormTotalCount : 0

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)}>
          返回
        </Button>
        <h2>宿舍统计</h2>
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
          <span className="stat-value">{totalDorms}</span>
          <span className="stat-label">宿舍总数</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">
            {data.length > 0 ? data[data.length - 1].dormResidentCount : 0}
          </span>
          <span className="stat-label">住宿人数</span>
        </div>
      </div>

      <div className="m-data-content">
        {loading ? (
          <div className="m-data-loading">
            <Spin size="large" tip="加载中..." />
          </div>
        ) : data.length === 0 ? (
          <Empty description="暂无宿舍数据" />
        ) : (
          data.map((row) => {
            const occupancy =
              row.inSchoolCount > 0
                ? ((row.dormResidentCount / row.inSchoolCount) * 100).toFixed(1)
                : '0'
            return (
              <div key={row.month} className="m-check-card">
                <div className="check-header">
                  <span style={{ fontWeight: 600 }}>
                    <HomeOutlined /> {row.month}月
                  </span>
                  <Tag color="blue">入住率 {occupancy}%</Tag>
                </div>
                <div className="check-body">
                  <div className="m-data-row">
                    <span className="label">在校/住宿</span>
                    <span className="value">
                      {row.inSchoolCount} / {row.dormResidentCount}
                    </span>
                  </div>
                  <div className="m-data-row">
                    <span className="label">宿舍总数</span>
                    <span className="value">{row.dormTotalCount}</span>
                  </div>
                  <div className="m-data-row">
                    <span className="label">男生 (宿舍/住/空)</span>
                    <span className="value">
                      {row.maleDormCount} / {row.maleDormResidentCount} / {row.maleEmptyBedCount}
                    </span>
                  </div>
                  <div className="m-data-row">
                    <span className="label">女生 (宿舍/住/空)</span>
                    <span className="value">
                      {row.femaleDormCount} / {row.femaleDormResidentCount} /{' '}
                      {row.femaleEmptyBedCount}
                    </span>
                  </div>
                  {row.remark && (
                    <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                      备注: {row.remark}
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
