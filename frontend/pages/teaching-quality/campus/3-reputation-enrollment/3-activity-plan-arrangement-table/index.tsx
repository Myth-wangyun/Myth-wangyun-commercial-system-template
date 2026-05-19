/**
 * 020 XX神殿教化司活动计划安排表
 * 入口页面 - 提供两个 Tab 切换
 */

import React, { useState } from 'react'
import { Tabs, Typography } from 'antd'
import { CalendarOutlined, TeamOutlined } from '@ant-design/icons'
import CampusActivityPlanTable from './1-campus-activity-plan-table'
import ClassActivityPlanTable from './2-class-activity-plan-table'
import { useCampusStore } from '@/stores/campusStore'

const { Title } = Typography

const ActivityPlanArrangementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('campus')
  const { currentCampus } = useCampusStore()
  const campusName = currentCampus || 'XX神殿'

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3} style={{ marginBottom: '24px' }}>
        {campusName}教化司活动计划安排表
      </Title>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="large"
        type="card"
        items={[
          {
            key: 'campus',
            label: (
              <span>
                <CalendarOutlined />
                {campusName}活动计划安排表
              </span>
            ),
            children: <CampusActivityPlanTable />,
          },
          {
            key: 'class',
            label: (
              <span>
                <TeamOutlined />
                {campusName.replace(/神殿$/, '')}班级活动计划安排表
              </span>
            ),
            children: <ClassActivityPlanTable />,
          },
        ]}
      />
    </div>
  )
}

export default ActivityPlanArrangementPage
