/**
 * 移动端 - 祈福司员工访谈记录表
 * 按年度展示各员工每月的访谈记录
 */
import { useState, useEffect, useCallback } from 'react'
import { App, Spin, Empty, Button, Select, Collapse, Tag } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'
import axios from 'axios'
import '../shared/MobileDataPage.css'

interface MonthContent {
  访谈人: string
  访谈内容: string
}

interface InterviewRow {
  key: string
  序号: number
  岗位姓名: string
  月份数据: Record<string, MonthContent>
}

export default function MobileStaffInterview() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState(dayjs().year())
  const [data, setData] = useState<InterviewRow[]>([])

  const loadData = useCallback(async () => {
    if (!currentCampus) return
    setLoading(true)
    try {
      const res = await axios.get(`/api/v1/consult/staff-interview/${year}`, {
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

  const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)}>
          返回
        </Button>
        <h2>员工访谈记录</h2>
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
          <Empty description="暂无访谈记录" />
        ) : (
          <Collapse
            items={data.map((row) => ({
              key: row.key,
              label: (
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>{row.岗位姓名}</span>
                  <Tag color="blue">
                    {Object.values(row.月份数据 || {}).filter((m) => m.访谈内容).length}次访谈
                  </Tag>
                </div>
              ),
              children: (
                <div>
                  {months.map((month) => {
                    const content = row.月份数据?.[month]
                    if (!content?.访谈内容) return null
                    return (
                      <div key={month} className="m-list-item" style={{ background: '#fafafa' }}>
                        <div className="item-header">
                          <Tag color="processing">{month}</Tag>
                          <span style={{ fontSize: 12, color: '#999' }}>
                            访谈人: {content.访谈人 || '-'}
                          </span>
                        </div>
                        <div className="item-body">{content.访谈内容}</div>
                      </div>
                    )
                  })}
                  {Object.values(row.月份数据 || {}).filter((m) => m.访谈内容).length === 0 && (
                    <Empty description="暂无访谈记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </div>
              ),
            }))}
          />
        )}
      </div>
    </div>
  )
}
