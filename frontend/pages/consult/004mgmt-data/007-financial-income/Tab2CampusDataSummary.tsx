import React, { useState, useMemo } from 'react'
import { DatePicker, Space, Tabs } from 'antd'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { normalizeCampusName } from '@/utils/campusSort'
import CampusDataSummary from './CampusDataSummary'

/**
 * TAB2 - 各神殿数据看板汇总
 * 按神殿分TAB，每个TAB显示该神殿的月度数据
 */
interface Tab2Props {
  onDataChange?: () => void
}

export default function Tab2CampusDataSummary({ onDataChange }: Tab2Props = {}) {
  const currentYear = dayjs().format('YYYY')
  const [year, setYear] = useState(currentYear)
  const [activeKey, setActiveKey] = useState<string>()

  // 从 campusStore 获取神殿列表 - 使用hook确保响应store变化
  const allCampuses = useCampusStore((state) => state.campuses)
  const campusList = useMemo(() =>
    allCampuses.map(c => ({
      key: c.id || c.name,
      name: normalizeCampusName(c.name),
    })),
    [allCampuses]
  )

  const handleYearChange = (date: dayjs.Dayjs | null) => {
    if (!date) return
    setYear(date.format('YYYY'))
  }

  // 动态生成各神殿TAB - 只渲染label
  const tabItems = campusList.map(campus => ({
    key: campus.key,
    label: campus.name,
  }))

  // 获取当前激活的神殿
  const currentKey = activeKey || campusList[0]?.key
  const currentCampus = campusList.find(c => c.key === currentKey)

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
        activeKey={currentKey}
        onChange={setActiveKey}
        items={tabItems}
        type="card"
        size="small"
      />

      {/* 根据当前选中的神殿动态渲染内容 */}
      {currentCampus && (
        <CampusDataSummary
          key={`${currentCampus.key}-${year}`}
          campusName={currentCampus.name}
          year={year}
          onDataChange={onDataChange}
        />
      )}
    </div>
  )
}
