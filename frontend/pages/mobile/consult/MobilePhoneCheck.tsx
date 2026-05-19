/**
 * 移动端 - 电话标准化检查记录列表
 * 查看电话标准化检查记录，支持筛选
 */
import { useState, useEffect, useCallback } from 'react'
import { App, Spin, Empty, Button, Select, Tag, DatePicker } from 'antd'
import {
  ArrowLeftOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useCampusStore } from '@/stores/campusStore'
import dayjs, { type Dayjs } from 'dayjs'
import {
  getPhoneCheckList,
  type PhoneCheck,
  type CheckQueryParams,
} from '@/services/consult/phoneCheck'
import '../shared/MobileDataPage.css'

export default function MobilePhoneCheck() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PhoneCheck[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().startOf('month'), dayjs()])
  const [consultant, setConsultant] = useState<string>()

  const loadData = useCallback(async () => {
    if (!currentCampus) return
    setLoading(true)
    try {
      const params: CheckQueryParams = {
        campus: currentCampus,
        page,
        page_size: 20,
      }
      if (dateRange[0]) params.start_date = dateRange[0].format('YYYY-MM-DD')
      if (dateRange[1]) params.end_date = dateRange[1].format('YYYY-MM-DD')
      if (consultant) params.consultant = consultant
      const res = await getPhoneCheckList(params)
      const list = (res as any)?.data?.数据列表 || (res as any)?.数据列表 || []
      const cnt = (res as any)?.data?.总记录数 || (res as any)?.总记录数 || 0
      setData(list)
      setTotal(cnt)
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [currentCampus, page, dateRange, consultant])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)}>
          返回
        </Button>
        <h2>电话标准化检查</h2>
        <div style={{ width: 60 }} />
      </div>

      <div className="m-data-filter">
        <DatePicker.RangePicker
          value={dateRange}
          onChange={(v) => v && setDateRange(v as [Dayjs, Dayjs])}
          style={{ width: '100%' }}
          size="small"
        />
      </div>

      <div className="m-data-summary">
        <div className="stat-item">
          <span className="stat-value">{total}</span>
          <span className="stat-label">总记录</span>
        </div>
      </div>

      <div className="m-data-content">
        {loading ? (
          <div className="m-data-loading">
            <Spin size="large" tip="加载中..." />
          </div>
        ) : data.length === 0 ? (
          <Empty description="暂无检查记录" />
        ) : (
          data.map((row, idx) => (
            <div key={row.记录ID || idx} className="m-check-card">
              <div className="check-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PhoneOutlined style={{ color: '#1890ff' }} />
                  <span style={{ fontWeight: 600 }}>{row.咨询师}</span>
                </div>
                <Tag color="blue">{row.日期}</Tag>
              </div>
              <div className="check-body">
                {row.学员姓名 && (
                  <div className="m-data-row">
                    <span className="label">
                      <UserOutlined /> 学员
                    </span>
                    <span className="value">{row.学员姓名}</span>
                  </div>
                )}
                {row.审核人 && (
                  <div className="m-data-row">
                    <span className="label">
                      <CheckCircleOutlined /> 审核人
                    </span>
                    <span className="value">{row.审核人}</span>
                  </div>
                )}
                {row.得分 != null && (
                  <div className="m-data-row">
                    <span className="label">得分</span>
                    <span
                      className="value"
                      style={{
                        color: row.得分 / (row.总分 || 100) >= 0.8 ? '#52c41a' : '#fa8c16',
                        fontWeight: 600,
                      }}
                    >
                      {row.得分} / {row.总分 || 100}
                    </span>
                  </div>
                )}
                {row.总结 && (
                  <div style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
                    {row.总结.length > 60 ? `${row.总结.slice(0, 60)}...` : row.总结}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {data.length > 0 && data.length < total && (
          <Button block type="link" onClick={() => setPage((p) => p + 1)} style={{ marginTop: 8 }}>
            加载更多
          </Button>
        )}
      </div>
    </div>
  )
}
