/**
 * Tab2Network - 网络数据
 * 汇总网络相关数据看板
 */

import React from 'react'
import { Divider } from 'antd'
import { useCampusStore } from '@/stores/campusStore'
import NetworkDataDashboard from './1NetworkDataDashboard'
import SEMDataDashboard from './2SEMDataDashboard'
import ConsultantSEMDashboard from './3ConsultantSEMDashboard'
import MonthlyConsultantSEMDashboard from './4MonthlyConsultantSEMDashboard'

interface Props {
  year: string
}

export default function Tab2Network({ year }: Props) {
  const campusStore = useCampusStore()
  const campusList = campusStore.getAllCampuses()
  
  // 使用全局的 currentCampus
  const currentCampus = campusStore.currentCampus || (campusList.length > 0 ? campusList[0].name : '未选择')

  return (
    <div style={{ padding: '16px' }}>
      {/* 1. 网络数据核心数据看板 */}
      <NetworkDataDashboard year={year} campus={currentCampus} />

      <Divider style={{ margin: '12px 0' }} />

      {/* 2. SEM数据核心数据看板 */}
      <SEMDataDashboard year={year} campus={currentCampus} />

      <Divider style={{ margin: '12px 0' }} />

      {/* 3. SEM数据核心数据看板（咨询师） */}
      <ConsultantSEMDashboard year={year} campus={currentCampus} />

      <Divider style={{ margin: '12px 0' }} />

      {/* 4. SEM数据核心数据看板（咨询师按月份汇总） */}
      <MonthlyConsultantSEMDashboard year={year} campus={currentCampus} />
    </div>
  )
}
