/**
 * ChannelSourceDashboard - 渠道数据核心数据看板
 * 
 * 渠道TAB有特殊结构，分为两个子TAB：
 * 1. 咨询师 - 咨询师相关的渠道数据
 * 2. 渠道人资 - 渠道人资相关的数据
 */

import React, { useState } from 'react'
import { Tabs } from 'antd'
import { NoCopyContainer } from '@/components/common'
import ConsultantChannelDashboard from './ConsultantChannelDashboard'
import ChannelAgentDashboard from './ChannelAgentDashboard'

interface Props {
  year: string
  bgColor?: string
}

export default function ChannelSourceDashboard({ year, bgColor = '#F0E68C' }: Props) {
  const [activeKey, setActiveKey] = useState('consultant')

  const tabItems = [
    {
      key: 'consultant',
      label: '咨询师',
      children: <ConsultantChannelDashboard year={year} bgColor={bgColor} />,
    },
    {
      key: 'agent',
      label: '渠道人资',
      children: <ChannelAgentDashboard year={year} bgColor={bgColor} />,
    },
  ]

  return (
    <NoCopyContainer>
      <div style={{ padding: '8px' }}>
        <Tabs
          activeKey={activeKey}
          onChange={setActiveKey}
          items={tabItems}
          type="card"
          size="small"
        />
      </div>
    </NoCopyContainer>
  )
}
