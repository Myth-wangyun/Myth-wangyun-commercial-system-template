import React, { useState } from 'react'
import { Tabs } from 'antd'
import type { Dayjs } from 'dayjs'
import SocialMediaDetailRegister from './registers/SocialMediaDetailRegister.tsx'
import QADetailRegister from './registers/QADetailRegister.tsx'
import ClassifiedDetailRegister from './registers/ClassifiedDetailRegister.tsx'
import WechatDetailRegister from './registers/WechatDetailRegister.tsx'
import VideoDetailRegister from './registers/VideoDetailRegister.tsx'

interface RegisterTabProps {
  campusId: string
  campusName: string
  selectedMonth: Dayjs
  onMonthChange: (month: Dayjs) => void
}

/**
 * 登记标签页
 * 包含5个子类别的明细登记表单
 */
const RegisterTab: React.FC<RegisterTabProps> = ({ campusId, campusName, selectedMonth, onMonthChange }) => {
  const [activeSubTab, setActiveSubTab] = useState<string>('social-media')

  const subTabItems = [
    {
      key: 'social-media',
      label: '社交新媒体',
      children: <SocialMediaDetailRegister 
        campusId={campusId} 
        campusName={campusName}
        selectedMonth={selectedMonth}
        onMonthChange={onMonthChange}
      />,
    },
    {
      key: 'qa',
      label: '问答',
      children: <QADetailRegister 
        campusId={campusId} 
        campusName={campusName}
        selectedMonth={selectedMonth}
        onMonthChange={onMonthChange}
      />,
    },
    {
      key: 'classified',
      label: '分类信息',
      children: <ClassifiedDetailRegister 
        campusId={campusId} 
        campusName={campusName}
        selectedMonth={selectedMonth}
        onMonthChange={onMonthChange}
      />,
    },
    {
      key: 'wechat',
      label: '微信平台',
      children: <WechatDetailRegister 
        campusId={campusId} 
        campusName={campusName}
        selectedMonth={selectedMonth}
        onMonthChange={onMonthChange}
      />,
    },
    {
      key: 'video',
      label: '视频',
      children: <VideoDetailRegister 
        campusId={campusId} 
        campusName={campusName}
        selectedMonth={selectedMonth}
        onMonthChange={onMonthChange}
      />,
    },
  ]

  return (
    <Tabs
      activeKey={activeSubTab}
      onChange={setActiveSubTab}
      type="line"
      items={subTabItems}
    />
  )
}

export default RegisterTab
