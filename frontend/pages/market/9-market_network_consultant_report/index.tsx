import React, { useState, useMemo } from 'react'
import { Card, DatePicker, Space, Tabs } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

// 导入各标签页组件
import AnnualStatisticsTab from './AnnualStatisticsTab'
import MonthlyStatisticsTab from './MonthlyStatisticsTab'
import GroupAChatRateTab from './GroupAChatRateTab'
import GroupBChatRateTab from './GroupBChatRateTab'
import CampusNewMediaSEMTab from './CampusNewMediaSEMTab'

// 获取当前年月
const getCurrentYearMonth = () => ({
  year: dayjs().format('YYYY'),
  month: dayjs().format('MM'),
})

const NetworkConsultantReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('annual')
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth())

  // 标签页配置
  const tabItems = useMemo(() => [
    {
      key: 'annual',
      label: '网聊年度统计表',
      children: <AnnualStatisticsTab year={yearMonth.year} />,
    },
    {
      key: 'monthly',
      label: '网聊月度统计表',
      children: <MonthlyStatisticsTab year={yearMonth.year} month={yearMonth.month} />,
    },
    {
      key: 'group-a',
      label: 'A组-聊出率',
      children: <GroupAChatRateTab year={yearMonth.year} month={yearMonth.month} />,
    },
    {
      key: 'group-b',
      label: 'B组-聊出率',
      children: <GroupBChatRateTab year={yearMonth.year} month={yearMonth.month} />,
    },
    {
      key: 'campus-newmedia-sem',
      label: '各神殿新媒体和SEM',
      children: <CampusNewMediaSEMTab year={yearMonth.year} month={yearMonth.month} />,
    },
  ], [yearMonth])

  // 获取当前标签页标题
  const getTabTitle = () => {
    const tab = tabItems.find(item => item.key === activeTab)
    return tab?.label || '网络咨询师汇报表'
  }

  // 获取标题背景色
  const getTitleStyle = () => {
    switch (activeTab) {
      case 'annual':
        return { backgroundColor: '#70ad47', borderColor: '#548235' }
      case 'monthly':
        return { backgroundColor: '#70ad47', borderColor: '#548235' }
      case 'group-a':
        return { backgroundColor: '#ffc000', borderColor: '#d69000' }
      case 'group-b':
        return { backgroundColor: '#ffc000', borderColor: '#d69000' }
      case 'campus-newmedia-sem':
        return { backgroundColor: '#9bc2e6', borderColor: '#5b9bd5' }
      default:
        return { backgroundColor: '#4472c4', borderColor: '#2f5496' }
    }
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

  // 处理年份变化
  const handleYearChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setYearMonth({
        year: date.format('YYYY'),
        month: yearMonth.month,
      })
    }
  }

  // 根据当前标签页决定日期选择器
  const renderDatePicker = () => {
    if (activeTab === 'annual') {
      return (
        <DatePicker
          picker="year"
          value={dayjs(yearMonth.year, 'YYYY')}
          onChange={handleYearChange}
          allowClear={false}
          style={{ width: 120 }}
          format="YYYY年"
        />
      )
    }
    return (
      <DatePicker
        picker="month"
        value={dayjs(`${yearMonth.year}-${yearMonth.month}`, 'YYYY-MM')}
        onChange={handleYearMonthChange}
        allowClear={false}
        style={{ width: 150 }}
        format="YYYY年MM月"
      />
    )
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
          color: '#fff',
          borderRadius: 0,
          border: '1px solid',
          ...getTitleStyle(),
        }}
      >
        <FileTextOutlined style={{ marginRight: 8 }} />
        {activeTab === 'annual' 
          ? `${yearMonth.year}年 ${getTabTitle()}`
          : `${yearMonth.year}年${yearMonth.month}月 ${getTabTitle()}`}
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
            <span>选择{activeTab === 'annual' ? '年份' : '年月'}：</span>
            {renderDatePicker()}
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

export default NetworkConsultantReportPage
