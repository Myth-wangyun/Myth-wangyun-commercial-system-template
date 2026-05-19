/**
 * 移动端 - 学员访谈记录
 * 按班级查看学员访谈记录
 */
import { useState, useEffect, useCallback } from 'react'
import { App, Spin, Empty, Button, Select, Tag, Collapse } from 'antd'
import { ArrowLeftOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useCampusStore } from '@/stores/campusStore'
import {
  fetchInterviewClassNames,
  fetchStudentInterviewRecords,
  type StudentInterviewRecord,
} from '@/services/studentInterviews'
import '../shared/MobileDataPage.css'

export default function MobileStudentInterviews() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [classNames, setClassNames] = useState<string[]>([])
  const [selectedClass, setSelectedClass] = useState<string>()
  const [records, setRecords] = useState<StudentInterviewRecord[]>([])

  useEffect(() => {
    if (!currentCampus) return
    const campus = currentCampus.replace(/神殿$/, '').trim()
    fetchInterviewClassNames(campus)
      .then((list) => {
        setClassNames(list || [])
        if (list?.length > 0) setSelectedClass(list[0])
      })
      .catch(() => setClassNames([]))
  }, [currentCampus])

  const loadData = useCallback(async () => {
    if (!currentCampus || !selectedClass) return
    setLoading(true)
    try {
      const campus = currentCampus.replace(/神殿$/, '').trim()
      const res = await fetchStudentInterviewRecords({
        campus,
        class_code: selectedClass,
        class_name: selectedClass,
      })
      setRecords(res?.records || [])
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [currentCampus, selectedClass])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 按学员分组
  const groupedByStudent = records.reduce(
    (acc, r) => {
      const name = r.student_name || '未知'
      if (!acc[name]) acc[name] = []
      acc[name].push(r)
      return acc
    },
    {} as Record<string, StudentInterviewRecord[]>,
  )

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)}>
          返回
        </Button>
        <h2>学员访谈记录</h2>
        <div style={{ width: 60 }} />
      </div>

      <div className="m-data-filter">
        <Select
          value={selectedClass}
          onChange={setSelectedClass}
          style={{ width: '100%' }}
          placeholder="选择班级"
          showSearch
          options={classNames.map((c) => ({ value: c, label: c }))}
        />
      </div>

      <div className="m-data-summary">
        <div className="stat-item">
          <span className="stat-value">{records.length}</span>
          <span className="stat-label">访谈总数</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{Object.keys(groupedByStudent).length}</span>
          <span className="stat-label">学员人数</span>
        </div>
      </div>

      <div className="m-data-content">
        {loading ? (
          <div className="m-data-loading">
            <Spin size="large" tip="加载中..." />
          </div>
        ) : records.length === 0 ? (
          <Empty description={selectedClass ? '暂无访谈记录' : '请选择班级'} />
        ) : (
          <Collapse
            items={Object.entries(groupedByStudent).map(([name, recs]) => ({
              key: name,
              label: (
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>
                    <UserOutlined /> {name}
                  </span>
                  <Tag color="blue">{recs.length}次</Tag>
                </div>
              ),
              children: (
                <div>
                  {recs.map((rec, i) => (
                    <div key={i} className="m-list-item" style={{ background: '#fafafa' }}>
                      <div className="item-header">
                        <Tag color="processing">{rec.month}月</Tag>
                        <span style={{ fontSize: 12, color: '#999' }}>
                          {rec.interview_date} | 访谈人: {rec.interviewer}
                        </span>
                      </div>
                      <div className="item-body">{rec.content || '-'}</div>
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
