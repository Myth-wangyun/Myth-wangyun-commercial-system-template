import React, { useState } from 'react'
import { Card, Tabs } from 'antd'
import { 
  FileTextOutlined, 
  BarChartOutlined,
  TikTokOutlined,
  WechatOutlined,
  BulbOutlined,
  YoutubeOutlined,
  PlayCircleOutlined
} from '@ant-design/icons'

// 导入各个平台分析组件
import MarketingNewMediaEditReport from './1-marketing_newmedia_edit_report'
import NewMediaSummaryTable from './2-NewMediaSummaryTable'
import DouyinPlatformAnalysis from './3-DouyinPlatformAnalysis'
import KuaishouPlatformAnalysis from './4-KuaishouPlatformAnalysis'
import XiaohongshuPlatformAnalysis from './5-XiaohongshuPlatformAnalysis'
import ShipinhaoAnalysis from './6-ShipinhaoAnalysis'
import BilibiliAnalysis from './7-BilibiliAnalysis'

const NewMediaPhaseReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('1')

  // 标签页配置
  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <FileTextOutlined /> 新媒体剪辑汇报表
        </span>
      ),
      children: <MarketingNewMediaEditReport />,
    },
    {
      key: '2',
      label: (
        <span>
          <BarChartOutlined /> 整体数据汇总表
        </span>
      ),
      children: <NewMediaSummaryTable />,
    },
    {
      key: '3',
      label: (
        <span>
          <TikTokOutlined /> 抖音平台数据分析
        </span>
      ),
      children: <DouyinPlatformAnalysis />,
    },
    {
      key: '4',
      label: (
        <span>
          <PlayCircleOutlined /> 快手平台数据分析
        </span>
      ),
      children: <KuaishouPlatformAnalysis />,
    },
    {
      key: '5',
      label: (
        <span>
          <BulbOutlined /> 小红书平台数据分析
        </span>
      ),
      children: <XiaohongshuPlatformAnalysis />,
    },
    {
      key: '6',
      label: (
        <span>
          <WechatOutlined /> 视频号平台数据分析
        </span>
      ),
      children: <ShipinhaoAnalysis />,
    },
    {
      key: '7',
      label: (
        <span>
          <YoutubeOutlined /> B站平台数据分析
        </span>
      ),
      children: <BilibiliAnalysis />,
    },
  ]

  return (
    <div style={{ padding: '16px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card
        title={
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#1890ff' }}>
              003市场部 - 新媒体阶段业务汇报表
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
              新媒体各平台数据分析与汇总 | 支持多维度数据查看
            </p>
          </div>
        }
        variant="borderless"
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          type="card"
          tabBarStyle={{
            marginBottom: '16px',
          }}
        />
      </Card>
    </div>
  )
}

export default NewMediaPhaseReportPage
