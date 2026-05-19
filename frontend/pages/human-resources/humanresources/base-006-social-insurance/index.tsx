/**
 * 006 集团人资基础-社保
 * 最高议事厅 -> 人事部 -> 基础数据
 * 路由: /humanresources/base/social-insurance
 *
 * 包含TAB:
 * 1. 员工社保办理申请表
 * 2. 社保费用汇总表
 */
import React from 'react'
import { Tabs } from 'antd'
import { SafetyOutlined, AccountBookOutlined } from '@ant-design/icons'
import SocialInsuranceApplication from './SocialInsuranceApplication'
import InsuranceCostSummary from './InsuranceCostSummary'

const SocialInsurance: React.FC = () => {
  const tabItems = [
    {
      key: 'application',
      label: <span><SafetyOutlined /> 员工社保办理申请表</span>,
      children: <SocialInsuranceApplication />,
    },
    {
      key: 'cost-summary',
      label: <span><AccountBookOutlined /> 社保费用汇总表</span>,
      children: <InsuranceCostSummary />,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Tabs
        defaultActiveKey="application"
        type="card"
        size="large"
        items={tabItems}
      />
    </div>
  )
}

export default SocialInsurance
