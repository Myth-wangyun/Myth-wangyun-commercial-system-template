import React, { useState, useMemo } from 'react'
import { Card, DatePicker, Tabs, Space } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { normalizeCampusName } from '@/utils/campusSort'
import StaffFunctionTable from './StaffFunctionTable'
import StaffScoreCriteria from './StaffScoreCriteria'
import { NoCopyContainer } from '@/components/common'

/**
 * 009员工职数和功能分析
 */
const StaffFunctionPage: React.FC = () => {
  const currentYear = dayjs().format('YYYY')
  const [year, setYear] = useState(currentYear)

  const handleYearChange = (date: dayjs.Dayjs | null) => {
    if (!date) return
    setYear(date.format('YYYY'))
  }

  // Generate tabs from campus store
  const campusList = useMemo(() => {
    const allCampuses = useCampusStore.getState().getAllCampuses()
    return allCampuses.map(c => ({
      key: c.id || c.name,
      label: normalizeCampusName(c.name),
    }))
  }, [])

  const items = useMemo(() => {
    // Basic campus tabs
    const tabs = campusList.map(campus => ({
      key: campus.key,
      label: campus.label,
      children: (
        <div style={{ padding: '0 8px' }}>
           <StaffFunctionTable campusName={campus.label} year={year} />
        </div>
      )
    }))

    // Append Criteria Tab
    tabs.push({
      key: 'criteria',
      label: '员工评分标准',
      children: (
        <div style={{ padding: '0 8px' }}>
          <StaffScoreCriteria />
        </div>
      )
    })

    return tabs
  }, [campusList, year])

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <Card
        title={
          <span>
            <FileTextOutlined style={{ marginRight: 8 }} />
            009员工职数和功能分析
          </span>
        }
        extra={
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
        }
      >
        <Tabs 
          defaultActiveKey={campusList[0]?.key}
          items={items}
          type="card"
          destroyInactiveTabPane
        />
      </Card>
    </NoCopyContainer>
  )
}

export default StaffFunctionPage

