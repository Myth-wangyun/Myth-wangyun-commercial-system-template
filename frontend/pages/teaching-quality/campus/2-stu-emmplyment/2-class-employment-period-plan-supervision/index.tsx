import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Tabs, Space, Select } from 'antd'
import { ScheduleOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'
import ClassEmploymentPeriodPlanSupervisionTable from './1-class-employment-period-plan-supervision'
import ClassOnboardingPlanSupervisionTable from './2-class-onboarding-plan-supervision'

interface ClassListItem { 班级名称: string; 神殿: string }

const ClassEmploymentPeriodTabsPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, setCampus, getAllCampuses } = useCampusStore()
  const campuses = getAllCampuses()

  const [className, setClassName] = useState<string>('')
  const [classOptions, setClassOptions] = useState<Array<{ label: string; value: string }>>([])

  const now = new Date()
  const [year, setYear] = useState<number>(now.getFullYear())
  const [month, setMonth] = useState<number>(now.getMonth() + 1)

  const yearOptions = useMemo(() => {
    const y = now.getFullYear()
    return Array.from({ length: 7 }, (_, i) => ({ label: `${y - 3 + i}年`, value: y - 3 + i }))
  }, [])
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}月`, value: i + 1 }))

  useEffect(() => {
    if (!currentCampus && campuses.length > 0) {
      setCampus(campuses[0].name)
    }
  }, [currentCampus, campuses, setCampus])

  // 加载当前神殿的班级列表
  useEffect(() => {
    const loadClasses = async () => {
      if (!currentCampus) return
      try {
        const res = await fetch(buildApiUrl('/teaching-quality/class-list'))
        if (!res.ok) throw new Error('加载班级列表失败')
        const list = (await res.json()) as ClassListItem[]
        const norm = (s: string) => (s || '').replace(/神殿$/, '').trim()
        const campusNorm = norm(currentCampus)
        const options = list
          .filter((it) => norm(it.神殿) === campusNorm)
          .map((it) => ({ label: it.班级名称, value: it.班级名称 }))
        const unique = Array.from(new Map(options.map((o) => [o.value, o])).values())
        setClassOptions(unique)
        if (!unique.find((o) => o.value === className)) setClassName(unique[0]?.value || '')
      } catch (e) {
        console.error(e)
        message.error('加载班级列表失败')
        setClassOptions([])
        setClassName('')
      }
    }
    loadClasses()
  }, [currentCampus])

  const canIO = useMemo(() => Boolean(currentCampus && className && year && month), [currentCampus, className, year, month])
  const tabPrefix = `${currentCampus || '请选择神殿'}教化司${className || '请选择班级'}`

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
            {currentCampus || '请选择神殿'} · 就业期 / 入职计划监督
          </h1>
          <Space wrap>
            年份：
            <Select style={{ width: 110 }} value={year} options={yearOptions} onChange={setYear as any} />
            月份：
            <Select style={{ width: 100 }} value={month} options={monthOptions} onChange={setMonth as any} />
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
        <Tabs
          defaultActiveKey="employment-period"
          items={[
            {
              key: 'employment-period',
              label: `${tabPrefix}就业期计划和监督表（${year}年${month}月）`,
              children: <ClassEmploymentPeriodPlanSupervisionTable campus={currentCampus!} className={className} year={year} month={month} />,
            },
            {
              key: 'onboarding-period',
              label: `${tabPrefix}入职计划和监督表（${year}年${month}月）`,
              children: <ClassOnboardingPlanSupervisionTable campus={currentCampus!} className={className} year={year} month={month} />,
            },
          ]}
        />
      ) : null}
    </div>
  )
}

export default ClassEmploymentPeriodTabsPage
