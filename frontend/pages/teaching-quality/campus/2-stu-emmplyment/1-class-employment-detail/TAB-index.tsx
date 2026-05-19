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
import ClassEmploymentSummaryPage from './2-class-employment-summary' // 1. 班级就业汇总表
// TAB2 班级就业信息表
import ClassEmploymentInfoAll from './1-class-employment-info-table'
// TAB3 未就业明细表
import UnemployedStudentTable from './3-unemployed-student-table'

const EmploymentSummaryTabs: React.FC = () => {
  const { currentCampus, setCampus, getAllCampuses } = useCampusStore()
  const campuses = getAllCampuses()
  const [selectedClass, setSelectedClass] = React.useState<string>('')

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
          // TAB1：班级就业汇总表
          {
            key: 'employment-summary',
            label: '就业目标与结果汇总表',
            children: (
              <div className="campus-summary-table-wrapper">
                <ClassEmploymentSummaryPage 
                  selectedCampus={currentCampus} 
                  selectedClass={selectedClass} 
                  onClassChange={setSelectedClass} 
                />
              </div>
            ),
          },
          // TAB2：班级就业信息表
          {
            key: 'class-employment',
            label: '班级就业信息表',
            children: (
              <div className="campus-summary-table-wrapper">
                <ClassEmploymentInfoAll 
                  selectedCampus={currentCampus} 
                  selectedClass={selectedClass} 
                  onClassChange={setSelectedClass} 
                />
              </div>
            ),
          },
          // TAB3：未就业明细表
          {
            key: 'unemployed-detail',
            label: '未就业明细表',
            children: (
              <div className="campus-summary-table-wrapper">
                <UnemployedStudentTable 
                  selectedCampus={currentCampus} 
                  selectedClass={selectedClass} 
                  onClassChange={setSelectedClass} 
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}

export default EmploymentSummaryTabs
