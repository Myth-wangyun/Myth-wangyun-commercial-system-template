/**
 * 移动端 - 教员日工单（智慧司日工作总结表）
 * 按日期查看教员当日工作任务列表
 */
import { useState, useEffect, useCallback } from 'react'
import { App, Spin, Empty, Button, Tag, Collapse } from 'antd'
import { ArrowLeftOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'
import {
  getDailySummaryGroups,
  type DailySummaryResponse,
} from '@/services/academicDailyWorkSummary'
import '../shared/MobileDataPage.css'

export default function MobileTeacherDailyWork() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState(dayjs())
  const [groups, setGroups] = useState<DailySummaryResponse[]>([])

  const loadData = useCallback(async () => {
    if (!currentCampus) return
    setLoading(true)
    try {
      const campus = currentCampus.replace(/神殿$/, '').trim()
      const res = await getDailySummaryGroups(campus, date.format('YYYY-MM-DD'))
      setGroups(res || [])
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [currentCampus, date])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalTasks = groups.reduce((s, g) => s + (g.行数据?.length || 0), 0)

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)}>
          返回
        </Button>
        <h2>教员日工单</h2>
        <div style={{ width: 60 }} />
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
          <span className="stat-value">{groups.length}</span>
          <span className="stat-label">教员数</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{totalTasks}</span>
          <span className="stat-label">任务数</span>
        </div>
      </div>

      <div className="m-data-content">
        {loading ? (
          <div className="m-data-loading">
            <Spin size="large" tip="加载中..." />
          </div>
        ) : groups.length === 0 ? (
          <Empty description="当日暂无工单记录" />
        ) : (
          <Collapse
            defaultActiveKey={groups.map((_, i) => String(i))}
            items={groups.map((group, i) => ({
              key: String(i),
              label: (
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontWeight: 600 }}>
                    {group.执行人 || '未指定'} {group.班级 ? `(${group.班级})` : ''}
                  </span>
                  <Tag color="blue">{group.行数据?.length || 0}项</Tag>
                </div>
              ),
              children: (
                <div>
                  {(group.行数据 || []).map((task, ti) => (
                    <div key={ti} className="m-list-item" style={{ background: '#fafafa' }}>
                      <div className="item-header">
                        <Tag color="processing">第{task.序号}项</Tag>
                        {task.权重 && (
                          <span style={{ fontSize: 11, color: '#999' }}>权重: {task.权重}</span>
                        )}
                      </div>
                      {task.任务名称 && (
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>{task.任务名称}</div>
                      )}
                      {task.任务描述 && (
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                          {task.任务描述}
                        </div>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          gap: 12,
                          fontSize: 12,
                          color: '#999',
                          flexWrap: 'wrap',
                        }}
                      >
                        {task.执行时间 && <span>执行: {task.执行时间}</span>}
                        {task.最后完成期限 && <span>截止: {task.最后完成期限}</span>}
                        {task.结果 && <span style={{ color: '#52c41a' }}>结果: {task.结果}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ),
            }))}
          />
        )}
      </div>
    </div>
  )
}
