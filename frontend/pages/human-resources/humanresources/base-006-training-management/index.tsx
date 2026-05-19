/**
 * 006 集团人资基础-培训管理
 * 最高议事厅 -> 人事部 -> 基础数据
 * 路由: /humanresources/base/training-management
 *
 * 包含4个TAB:
 * 1. 培训目标
 * 2. 培训申请表
 * 3. 培训成绩汇总表
 * 4. 培训满意度调查
 */
import React, { useState } from 'react'
import { Tabs } from 'antd'
import {
  AimOutlined,
  SmileOutlined,
  BarChartOutlined,
  FormOutlined,
} from '@ant-design/icons'
import TrainingGoals from './TrainingGoals'
import TrainingSatisfaction from './TrainingSatisfaction'
import TrainingResults from './TrainingResults'
import TrainingApplication from './TrainingApplication'

const TrainingManagement: React.FC = () => {
  const [syncVersion, setSyncVersion] = useState(0)

  const tabItems = [
    {
      key: 'training-goals',
      label: <span><AimOutlined /> 培训目标</span>,
      children: <TrainingGoals />,
    },
    {
      key: 'training-application',
      label: <span><FormOutlined /> 培训申请表</span>,
      children: <TrainingApplication onFollowupRecordsGenerated={() => setSyncVersion((value) => value + 1)} />,
    },
    {
      key: 'training-results',
      label: <span><BarChartOutlined /> 培训成绩汇总表</span>,
      children: <TrainingResults syncVersion={syncVersion} />,
    },
    {
      key: 'training-satisfaction',
      label: <span><SmileOutlined /> 培训满意度调查</span>,
      children: <TrainingSatisfaction syncVersion={syncVersion} />,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Tabs
        defaultActiveKey="training-goals"
        type="card"
        size="large"
        items={tabItems}
      />
    </div>
  )
}

export default TrainingManagement
