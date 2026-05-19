import React, { useEffect } from 'react'
import { Card, Tabs } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import CampusStuMovementAllPage from './1-campus-stu-movement-summary'
import CampusRefundDetailTable from './2-campus-refund-detail'
import CampusSuspensionDetailTable from './3-campus-suspension-detail'
import CampusLongLeaveDetailTable from './4-campus-long-leave-detail'
import CampusLongAbsenceDetailTable from './5-campus-long-absence-detail'
import CampusVacationStudentsDetailTable from './6-campus-vacation-students-detail'
import CampusOtherSituationDetailTable from './7-campus-other-situation-detail'

const CampusStuMovementTabsPage: React.FC = () => {
  const { currentCampus, setCampus, getAllCampuses } = useCampusStore()
  const campuses = getAllCampuses()

  useEffect(() => {
    if (!currentCampus && campuses.length > 0) {
      setCampus(campuses[0].name)
    }
  }, [currentCampus, campuses, setCampus])

  if (!currentCampus) {
    return null
  }

  return (
    <div
      style={{
        padding: 24,
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Card style={{ marginBottom: 24, backgroundColor: '#fff' }}>
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          <UserOutlined style={{ marginRight: 8 }} />
          {currentCampus} · 学员异动
        </h1>
      </Card>

      <Tabs
        defaultActiveKey="movement-summary"
        items={[
          {
            key: 'movement-summary',
            label: `${currentCampus}教化司学员异动表`,
            children: <CampusStuMovementAllPage />,
          },
          {
            key: 'refund-detail',
            label: '退费明细',
            children: <CampusRefundDetailTable />,
          },
          {
            key: 'suspension-detail',
            label: '休学明细表',
            children: <CampusSuspensionDetailTable />,
          },
          {
            key: 'long-leave-detail',
            label: '长期请假明细表',
            children: <CampusLongLeaveDetailTable />,
          },
          {
            key: 'long-absence-detail',
            label: '长期不上课明细表',
            children: <CampusLongAbsenceDetailTable />,
          },
          {
            key: 'vacation-students-detail',
            label: '寒暑假学生明细表',
            children: <CampusVacationStudentsDetailTable />,
          },
          {
            key: 'other-situation-detail',
            label: '其他情况明细表',
            children: <CampusOtherSituationDetailTable />,
          },
        ]}
      />
    </div>
  )
}

export default CampusStuMovementTabsPage
