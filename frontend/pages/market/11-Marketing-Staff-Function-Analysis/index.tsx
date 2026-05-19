import React, { useState, useMemo } from 'react'
import { Card, DatePicker, Space, Tabs } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

// 导入各标签页组件
import MiddleManagementTab from './MiddleManagementTab'
import WebPromotionTab from './WebPromotionTab'
import WebChatTab from './WebChatTab'
import AIResearchTab from './AIResearchTab'

// 获取当前年月
const getCurrentYearMonth = () => ({
  year: dayjs().format('YYYY'),
  month: dayjs().format('MM'),
})

const MarketingStaffFunctionAnalysisPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('middle-management')
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth())

  // 标签页配置
  const tabItems = useMemo(() => [
    {
      key: 'middle-management',
      label: '市场-中层功能分析',
      children: <MiddleManagementTab year={yearMonth.year} month={yearMonth.month} />,
    },
    {
      key: 'web-promotion',
      label: '网推',
      children: <WebPromotionTab year={yearMonth.year} month={yearMonth.month} />,
    },
    {
      key: 'web-chat',
      label: '网聊',
      children: <WebChatTab year={yearMonth.year} month={yearMonth.month} />,
    },
    {
      key: 'ai-research',
      label: 'AI研发+其他',
      children: <AIResearchTab year={yearMonth.year} month={yearMonth.month} />,
    },
  ], [yearMonth])

  // 获取当前标签页标题
  const getTabTitle = () => {
    const tab = tabItems.find(item => item.key === activeTab)
    return tab?.label || '市场部全员功能分析'
  }

  // 处理年月变化
  const handleYearMonthChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setYearMonth({
        year: date.format('YYYY'),
        month: date.format('MM'),
      })
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 24,
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          padding: '10px 16px',
          backgroundColor: '#4472c4',
          color: '#fff',
          borderRadius: 0,
          border: '1px solid #2f5496',
        }}
      >
        <FileTextOutlined style={{ marginRight: 8 }} />
        {yearMonth.year}年{yearMonth.month}月 市场部{getTabTitle()}表
      </div>

      <Card>
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space>
            <span>选择年月：</span>
            <DatePicker
              picker="month"
              value={dayjs(`${yearMonth.year}-${yearMonth.month}`, 'YYYY-MM')}
              onChange={handleYearMonthChange}
              allowClear={false}
              style={{ width: 150 }}
              format="YYYY年MM月"
            />
          </Space>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
          style={{ marginTop: 16 }}
        />

        <style>{`
          .ant-tabs-nav {
            margin-bottom: 0 !important;
          }
          .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab {
            background-color: #e2efda;
            border-color: #000;
          }
          .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active {
            background-color: #4472c4;
            border-color: #2f5496;
          }
          .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: #fff;
          }
        `}</style>
      </Card>
    </div>
  )
}

export default MarketingStaffFunctionAnalysisPage

