/**
 * 移动端 - 当面标准化检查记录列表
 * 查看当面咨询标准化检查记录，支持按类型筛选
 */
import { useState, useEffect, useCallback } from 'react'
import { App, Spin, Empty, Button, Select, Tag, DatePicker, Segmented } from 'antd'
import {
  ArrowLeftOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useCampusStore } from '@/stores/campusStore'
import dayjs, { type Dayjs } from 'dayjs'
import {
  getCheckList,
  type FaceToFaceCheck,
  type CheckQueryParams,
} from '@/services/consult/faceToFaceCheck'
import '../shared/MobileDataPage.css'

export default function MobileFaceToFaceCheck() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<FaceToFaceCheck[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [recordType, setRecordType] = useState<string>('预案')
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().startOf('month'), dayjs()])

  const loadData = useCallback(async () => {
    if (!currentCampus) return
    setLoading(true)
    try {
      const params: CheckQueryParams = {
        campus: currentCampus,
        record_type: recordType,
        page,
        page_size: 20,
      }
      if (dateRange[0]) params.start_date = dateRange[0].format('YYYY-MM-DD')
      if (dateRange[1]) params.end_date = dateRange[1].format('YYYY-MM-DD')
      const res = await getCheckList(params)
      setData(res?.data?.数据列表 || [])
      setTotal(res?.data?.总记录数 || 0)
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [currentCampus, page, recordType, dateRange])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)}>
          返回
        </Button>
        <h2>当面标准化检查</h2>
        <div style={{ width: 60 }} />
      </div>

      <div className="m-data-filter">
        <Segmented
          value={recordType}
          onChange={(v) => {
            setRecordType(v as string)
            setPage(1)
          }}
          options={[
            { label: '预案', value: '预案' },
            { label: '复盘', value: '复盘' },
          ]}
          block
          style={{ marginBottom: 8 }}
        />
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
                  <TeamOutlined style={{ color: '#722ed1' }} />
                  <span style={{ fontWeight: 600 }}>{row.学员姓名}</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Tag color={row.记录类型 === '预案' ? 'blue' : 'green'}>{row.记录类型}</Tag>
                  <Tag>{row.咨询日期}</Tag>
                </div>
              </div>
              <div className="check-body">
                {row.性别 && (
                  <div className="m-data-row">
                    <span className="label">性别/年龄</span>
                    <span className="value">
                      {row.性别} {row.年龄 ? `/ ${row.年龄}` : ''}
                    </span>
                  </div>
                )}
                {row.需求 && (
                  <div className="m-data-row">
                    <span className="label">需求</span>
                    <span className="value">{row.需求}</span>
                  </div>
                )}
                {row.关注点 && (
                  <div className="m-data-row">
                    <span className="label">关注点</span>
                    <span className="value">{row.关注点}</span>
                  </div>
                )}
                {row.创建人姓名 && (
                  <div className="m-data-row">
                    <span className="label">
                      <UserOutlined /> 创建人
                    </span>
                    <span className="value">{row.创建人姓名}</span>
                  </div>
                )}
                {row.自我总结 && (
                  <div style={{ marginTop: 8, padding: 8, background: '#f0f5ff', borderRadius: 6 }}>
                    <div style={{ fontSize: 12, color: '#1890ff', marginBottom: 4 }}>自我总结</div>
                    <div style={{ fontSize: 13 }}>
                      {row.自我总结.length > 80 ? `${row.自我总结.slice(0, 80)}...` : row.自我总结}
                    </div>
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
