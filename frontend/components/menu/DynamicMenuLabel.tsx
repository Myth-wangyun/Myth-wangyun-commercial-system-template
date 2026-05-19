/**
 * 动态菜单标签组件
 * 用于显示需要实时更新的菜单项标签
 */
import React from 'react'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'

/** 前台日报表菜单标签 */
export const DailyReportMenuLabel: React.FC = () => {
  const { currentCampus } = useCampusStore()
  const today = dayjs()
  
  return (
    <span>
      {currentCampus || '神殿'}{today.format('M月D日')}前台日报表
    </span>
  )
}

export default DailyReportMenuLabel
