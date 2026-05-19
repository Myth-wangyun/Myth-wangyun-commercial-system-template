// 班级档案表 - 统计信息栏组件

import React from 'react'
import type { ClassFileRecordRow } from '../types'

interface StatisticsBarProps {
  dataSource: ClassFileRecordRow[]
  selectedClass: string
}

export const StatisticsBar: React.FC<StatisticsBarProps> = ({ dataSource, selectedClass }) => {
  if (!selectedClass) return null

  const archiveCount = dataSource.filter(d => d.name && d.name.trim()).length
  const studyingCount = dataSource.filter(d => d.name && d.name.trim() && d.studentStatus === '在读').length
  const suspensionCount = dataSource.filter(d => d.name && d.name.trim() && d.studentStatus === '休学').length
  const returnCount = dataSource.filter(d => d.name && d.name.trim() && d.studentStatus === '复学').length
  const withdrawalCount = dataSource.filter(d => d.name && d.name.trim() && d.studentStatus === '退学').length
  const refundCount = dataSource.filter(d => d.name && d.name.trim() && d.studentStatus === '退费').length
  const longLeaveCount = dataSource.filter(d => d.name && d.name.trim() && d.studentStatus === '长期请假').length
  const longAbsenceCount = dataSource.filter(d => d.name && d.name.trim() && d.studentStatus === '长期不上课').length
  const vacationCount = dataSource.filter(d => d.name && d.name.trim() && d.studentStatus === '寒暑假').length
  const otherCount = dataSource.filter(d => d.name && d.name.trim() && d.studentStatus === '其他').length

  return (
    <div style={{ marginBottom: 16, fontSize: 14 }}>
      <span style={{ marginRight: 16 }}>档案人数: {archiveCount}</span>
      <span style={{ marginRight: 16 }}>在读人数: {studyingCount}</span>
      <span style={{ marginRight: 16 }}>休学人数: {suspensionCount}</span>
      <span style={{ marginRight: 16 }}>复学人数: {returnCount}</span>
      <span style={{ marginRight: 16 }}>退学人数: {withdrawalCount}</span>
      <span style={{ marginRight: 16 }}>退费人数: {refundCount}</span>
      <span style={{ marginRight: 16 }}>长期请假: {longLeaveCount}</span>
      <span style={{ marginRight: 16 }}>长期不上课: {longAbsenceCount}</span>
      <span style={{ marginRight: 16 }}>寒暑假: {vacationCount}</span>
      <span style={{ marginRight: 16 }}>其他: {otherCount}</span>
    </div>
  )
}
