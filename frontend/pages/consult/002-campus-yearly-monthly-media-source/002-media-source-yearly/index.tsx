/**
 * 002神殿-年月表-各媒体来源
 * 动态TAB：神殿核心数据 | 根据配置中心的量来源动态生成其余TAB
 * 
 * 每个TAB下有4个子表格：
 * 1. 年度汇总表（按神殿）
 * 2. 月度数据表（按月份）
 * 3. 咨询师汇总表
 * 4. 咨询师月度明细表
 * 
 * 数据联动：从007财务数据和咨询量录入系统获取数据
 */

import React, { useState, useMemo } from 'react'
import { Card, DatePicker, Space, Tabs, Spin } from 'antd'
import { AreaChartOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { useMediaSourceConfig } from '@/hooks/useMediaSourceConfig'
import Tab1CampusCoreData from './TAB1CampusCoreData'
import GenericSourceDashboard from './components/GenericSourceDashboard'

// TAB颜色配置（参考Excel）
const TAB_COLORS: Record<string, string> = {
  '网络': '#90EE90',      // 浅绿色（参考Excel）
  'SEM': '#90EE90',       // 浅绿色（参考Excel）
  '新媒体': '#FFD700',    // 金黄色
  '市场口碑': '#98FB98',  // 浅绿色
  '合作伙伴': '#DDA0DD',  // 梅红色
  '渠道': '#F0E68C',      // 卡其色
  '口碑': '#98FB98',      // 浅绿色
  '神殿新媒体': '#ADD8E6', // 浅蓝色
  '其他': '#FFB6C1',      // 浅粉色
  '免费推广': '#FFB6C1',  // 浅粉色
}

// 根据索引生成颜色（备用）
const getColorByIndex = (index: number): string => {
  const colors = ['#87CEEB', '#FFD700', '#98FB98', '#DDA0DD', '#F0E68C', '#ADD8E6', '#FFB6C1', '#E6E6FA']
  return colors[index % colors.length]
}

export default function MediaSourceYearly() {
  const currentYear = dayjs().format('YYYY')
  const [year, setYear] = useState(currentYear)
  
  // 从配置中心获取量来源列表
  const { fullConfigTree, loading: configLoading } = useMediaSourceConfig()

  const handleYearChange = (date: dayjs.Dayjs | null) => {
    if (!date) return
    setYear(date.format('YYYY'))
  }

  // 动态生成TAB项
  const tabItems = useMemo(() => {
    const items = [
      {
        key: 'core',
        label: '神殿核心数据',
        children: <Tab1CampusCoreData year={year} />,
      },
    ]

    // 根据配置中心的量来源动态生成TAB
    // TAB列表由配置中心决定，不做硬编码映射
    fullConfigTree.categories.forEach((category, index) => {
      const displayName = category.description || category.name
      const bgColor = TAB_COLORS[category.name] || TAB_COLORS[displayName] || getColorByIndex(index)

      items.push({
        key: `source_${category.name}`,
        label: displayName,
        children: (
          <GenericSourceDashboard
            year={year}
            categoryName={category.name}
            bgColor={bgColor}
          />
        ),
      })
    })

    return items
  }, [year, fullConfigTree.categories])

  if (configLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin tip="加载配置中..." />
      </div>
    )
  }

  return (
    <div style={{ padding: '2px' }}>
      <Card
        title={
          <Space>
            <AreaChartOutlined />
            <span>002神殿{year}年-各媒体来源数据</span>
          </Space>
        }
        extra={
          <Space>
            <DatePicker
              value={dayjs(year, 'YYYY')}
              onChange={handleYearChange}
              picker="year"
              allowClear={false}
            />
          </Space>
        }
      >
        <Tabs 
          items={tabItems} 
          defaultActiveKey="core"
          type="card"
          size="small"
        />
      </Card>
    </div>
  )
}
