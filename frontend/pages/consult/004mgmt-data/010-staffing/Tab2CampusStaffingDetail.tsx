import React, { useMemo, useState } from 'react'
import { DatePicker, Space, Tabs } from 'antd'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { normalizeCampusName } from '@/utils/campusSort'
import CampusStaffingDetail from './CampusStaffingDetail'

/**
 * TAB2 - 各神殿人员职数明细
 * 按神殿分TAB，每个TAB显示该神殿的人员职数明细
 */
export default function Tab2CampusStaffingDetail() {
  const currentYear = dayjs().format('YYYY')
  const [year, setYear] = useState(currentYear)

  // 从 campusStore 获取神殿列表
  const campusList = useMemo(() => {
    const allCampuses = useCampusStore.getState().getAllCampuses()
    return allCampuses.map(c => ({
      key: c.id || c.name,
      name: normalizeCampusName(c.name),
    }))
  }, [])

  const handleYearChange = (date: dayjs.Dayjs | null) => {
    if (!date) return
    setYear(date.format('YYYY'))
  }

  // 动态生成各神殿TAB
  const tabItems = useMemo(
    () => campusList.map(campus => ({
      key: campus.key,
      label: campus.name,
      children: <CampusStaffingDetail campusName={campus.name} year={year} />,
    })),
    [campusList, year]
  )

  return (
    <div style={{ padding: 16 }}>
      {/* 年份选择器 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Space>
          <span>选择年份：</span>
          <DatePicker
            picker="year"
            value={dayjs(year, 'YYYY')}
            onChange={handleYearChange}
            allowClear={false}
            style={{ width: 120 }}
            format="YYYY年"
          />
        </Space>
      </div>

      {/* 神殿TAB切换 */}
      <Tabs
        defaultActiveKey={campusList[0]?.key}
        items={tabItems}
        type="card"
        size="small"
        destroyInactiveTabPane
      />
    </div>
  )
}
