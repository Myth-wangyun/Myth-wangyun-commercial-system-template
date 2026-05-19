import React from 'react'
// 复用“学员就业·班主任就业汇总表”页面，实现与其完全一致的数据与展示
import TeacherEmploymentSummaryPage from '../../2-student-employment/TAB1class-employment-summary/3-teacher-employment-summary'

// 核心业务数据汇总表 · 班主任就业汇总表
// 要求与“学员就业就业目标与结果汇总”中的同名表格显示一致
const CampusBackendClassTeacherEmploymentSummary: React.FC = () => {
  return <TeacherEmploymentSummaryPage hideCampusSelector />
}

export default CampusBackendClassTeacherEmploymentSummary
