import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Input, Space, Button, Select } from 'antd'
import { ScheduleOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'
import ClassIntensifyPeriodPlanSupervisionTable from './class-intensify-period-plan-supervision'

interface ClassListItem { 班级名称: string; 神殿: string }

const ClassIntensifyPeriodPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, setCampus, getAllCampuses } = useCampusStore()
  const campuses = getAllCampuses()

  const [className, setClassName] = useState<string>('')
  const [classOptions, setClassOptions] = useState<Array<{ label: string; value: string }>>([])

  // 确保有默认神殿
  useEffect(() => {
    if (!currentCampus && campuses.length > 0) {
      setCampus(campuses[0].name)
    }
  }, [currentCampus, campuses, setCampus])

  // 加载班级列表并按神殿筛选
  useEffect(() => {
    const loadClasses = async () => {
      if (!currentCampus) return
      try {
        const res = await fetch(buildApiUrl('/teaching-quality/class-list'))
        if (!res.ok) throw new Error('加载班级列表失败')
        const list = (await res.json()) as ClassListItem[]
        const norm = (s: string) => (s || '').replace(/神殿$/, '').trim()
        const campusNorm = norm(currentCampus)
        const classes = list
          .filter((it) => norm(it.神殿) === campusNorm)
          .map((it) => ({ label: it.班级名称, value: it.班级名称 }))
        const unique = Array.from(new Map(classes.map((c) => [c.value, c])).values())
        setClassOptions(unique)
        // 如果当前班级不在列表内，自动选择第一个
        if (!unique.find((o) => o.value === className)) {
          setClassName(unique[0]?.value || '')
        }
      } catch (e) {
        console.error(e)
        message.error('加载班级列表失败')
        setClassOptions([])
        setClassName('')
      }
    }
    loadClasses()
  }, [currentCampus])

  const canIO = useMemo(() => Boolean(currentCampus && className), [currentCampus, className])

  return (
    <div
      style={{
        padding: 24,
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Card style={{ marginBottom: 24, backgroundColor: '#fff' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 'bold',
            }}
          >
            <ScheduleOutlined style={{ marginRight: 8 }} />
            {currentCampus || '请选择神殿'} · 强化期计划与监督表
          </h1>
          <Space>
            班级：
            <Select
              style={{ width: 160 }}
              placeholder={classOptions.length ? '选择班级' : '当前神殿暂无班级'}
              options={classOptions}
              value={className || undefined}
              onChange={(v) => setClassName(v)}
              showSearch
              optionFilterProp="label"
              disabled={!currentCampus}
            />
          </Space>
        </div>
      </Card>

      {canIO ? (
        <ClassIntensifyPeriodPlanSupervisionTable campus={currentCampus!} className={className} />
      ) : null}
    </div>
  )
}

export default ClassIntensifyPeriodPage
