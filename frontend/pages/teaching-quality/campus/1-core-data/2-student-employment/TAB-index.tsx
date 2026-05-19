/**
 * 学员就业目标与结果汇总 · 页面入口（按当前目录顺序）
 * TAB1（就业目标与结果汇总表）：依次渲染
 *   - TAB1class-employment-summary/1-campusBackendEmploymentClassSummary
 *   - TAB1class-employment-summary/2-campusBackendEmploymentStar
 *   - TAB1class-employment-summary/3-teacher-employment-summary
 * TAB2（班级就业信息表）：
 *   - TAB2ClassEmploymentInfoTable/TAB2-index
 */
import React from 'react'
import { Card, Tabs } from 'antd'
import { TrophyOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
// TAB1 本目录下的组件（按 1-2-3 顺序）
import ClassEmploymentSummaryPage from './TAB1class-employment-summary/1-campusBackendEmploymentClassSummary' // 1. 班级就业汇总表
import EmploymentStarPage from './TAB1class-employment-summary/2-campusBackendEmploymentStar' // 2. 就业明星汇总表
import TeacherEmploymentSummaryPage from './TAB1class-employment-summary/3-teacher-employment-summary' // 3. 班主任就业汇总表
// TAB2 班级就业信息表
import ClassEmploymentInfoAll from './TAB2ClassEmploymentInfoTable/TAB2-index'

const EmploymentSummaryTabs: React.FC = () => {
  const { currentCampus, setCampus, getAllCampuses } = useCampusStore()
  const campuses = getAllCampuses()

  // 初始化神殿
  React.useEffect(() => {
    if (!currentCampus && campuses.length > 0) {
      setCampus(campuses[0].name)
    }
  }, [currentCampus, campuses, setCampus])

  if (!currentCampus) return null

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Card
        style={{
          marginBottom: 24,
          backgroundColor: '#fff',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          <TrophyOutlined style={{ marginRight: 8 }} />
          {currentCampus} - 就业目标与结果汇总
        </h1>
      </Card>

      <Tabs
        defaultActiveKey="employment-summary"
        items={[
          // TAB1：按 1-2-3 顺序依次渲染三张表
          {
            key: 'employment-summary',
            label: '就业目标与结果汇总表',
            children: (
              <div className="campus-summary-table-wrapper">
                {/* 1) 班级就业汇总表 */}
                <div style={{ marginBottom: 24 }}>
                  <ClassEmploymentSummaryPage hideCampusSelector />
                </div>
                {/* 2) 就业明星汇总表 */}
                <div style={{ marginBottom: 24 }}>
                  <EmploymentStarPage hideCampusSelector />
                </div>
                {/* 3) 班主任就业汇总表 */}
                <div>
                  <TeacherEmploymentSummaryPage hideCampusSelector />
                </div>
              </div>
            ),
          },
          // TAB2：班级就业信息表
          {
            key: 'class-employment',
            label: '班级就业信息表',
            children: (
              <div className="campus-summary-table-wrapper">
                <ClassEmploymentInfoAll />
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}

export default EmploymentSummaryTabs
