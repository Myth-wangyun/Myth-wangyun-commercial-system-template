import React, { useState, useMemo } from 'react'
import { Card, DatePicker, Space, Tabs } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

// 导入各标签页组件
import AnnualEditReportTab from './AnnualEditReportTab'
import MonthlyEditReportTab from './MonthlyEditReportTab'
import WeeklyEditReportTab from './WeeklyEditReportTab'
import ProductionDetailTab from './ProductionDetailTab'
import ShootingDetailTab from './ShootingDetailTab'

// 获取当前年月
const getCurrentYearMonth = () => ({
  year: dayjs().format('YYYY'),
  month: dayjs().format('MM'),
})

const NewMediaEditReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('annual')
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth())

  // 获取当前月份的中文表示
  const getMonthText = () => {
    const monthNum = parseInt(yearMonth.month)
    return `${monthNum}月`
  }

  // 标签页配置
  const tabItems = useMemo(() => [
    {
      key: 'annual',
      label: '剪辑年度表',
      children: <AnnualEditReportTab year={yearMonth.year} />,
    },
    {
      key: 'monthly',
      label: '剪辑月度表',
      children: <MonthlyEditReportTab year={yearMonth.year} month={yearMonth.month} />,
    },
    {
      key: 'weekly',
      label: '剪辑周度表',
      children: <WeeklyEditReportTab year={yearMonth.year} month={yearMonth.month} />,
    },
    {
      key: 'production',
      label: `${getMonthText()}制作明细表`,
      children: <ProductionDetailTab year={yearMonth.year} month={yearMonth.month} />,
    },
    {
      key: 'shooting',
      label: `${getMonthText()}拍摄明细`,
      children: <ShootingDetailTab year={yearMonth.year} month={yearMonth.month} />,
    },
  ], [yearMonth])

  // 获取当前标签页标题
  const getTabTitle = () => {
    const tab = tabItems.find(item => item.key === activeTab)
    return tab?.label || '新媒体剪辑报表'
  }

  // 获取标题文本
  const getTitleText = () => {
    switch (activeTab) {
      case 'annual':
        return `${yearMonth.year}年 01市场部 新媒体剪辑年度汇报表`
      case 'monthly':
        return `${yearMonth.year}年${yearMonth.month}月 01市场部 新媒体剪辑月度汇报表`
      case 'weekly':
        return `${yearMonth.year}年${yearMonth.month}月 市场部 新媒体剪辑周度汇报表`
      case 'production':
        return `市场部 ${yearMonth.year}年${getMonthText()}视频剪辑制作明细(每月自动切换)`
      case 'shooting':
        return `市场部-${yearMonth.year}年${getMonthText()}出镜与配合拍摄奖励分配表(每月自动切换)`
      default:
        return '新媒体剪辑报表'
    }
  }

  // 获取标题背景色
  const getTitleStyle = () => {
    switch (activeTab) {
      case 'annual':
        return { backgroundColor: '#ffc000', borderColor: '#d69000' }
      case 'monthly':
        return { backgroundColor: '#ffc000', borderColor: '#d69000' }
      case 'weekly':
        return { backgroundColor: '#ffc000', borderColor: '#d69000' }
      case 'production':
        return { backgroundColor: '#ffc000', borderColor: '#d69000' }
      case 'shooting':
        return { backgroundColor: '#ffc000', borderColor: '#d69000' }
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
          color: '#000',
          borderRadius: 0,
          border: '1px solid',
          ...getTitleStyle(),
        }}
      >
        <FileTextOutlined style={{ marginRight: 8 }} />
        {getTitleText()}
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
            background-color: #ffc000;
            border-color: #d69000;
          }
          .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: #000;
            font-weight: bold;
          }
        `}</style>
      </Card>
    </div>
  )
}

export default NewMediaEditReportPage
