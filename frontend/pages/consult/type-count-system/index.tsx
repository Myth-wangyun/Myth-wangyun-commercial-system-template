/**
 * 咨询量录入系统主页面
 */

import React, { useState } from 'react'
import { Tabs, Card, Button, Modal } from 'antd'
import { FormOutlined, UnorderedListOutlined, UserSwitchOutlined, ExperimentOutlined, BarChartOutlined, SwapOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { useAuthStore } from '@/stores/authStore'
import ConsultationForm from './ConsultationForm'
import ConsultationList from './ConsultationList'
import DistributeList from './DistributeList'
import ConsultationStats from './ConsultationStats'
import ConsultationGenerator from './ConsultationGenerator'
import TransferList from './TransferList'

// 检查是否为开发环境
const isDev = import.meta.env.DEV

export default function TypeCountSystem() {
  const [activeTab, setActiveTab] = useState('form')
  const [refreshKey, setRefreshKey] = useState(0)
  const [generatorVisible, setGeneratorVisible] = useState(false)
  const { currentCampus } = useCampusStore()
  const { user } = useAuthStore()

  const handleFormSuccess = () => {
    // 刷新列表
    setRefreshKey(k => k + 1)
    // 切换到列表页
    setActiveTab('list')
  }

  const handleTabChange = (key: string) => {
    setActiveTab(key)
    // 切换标签页时刷新数据，确保各标签页数据同步
    setRefreshKey(k => k + 1)
  }

  const items = [
    {
      key: 'form',
      label: (
        <span>
          <FormOutlined />
          录入咨询量
        </span>
      ),
      children: (
        <ConsultationForm 
          onSuccess={handleFormSuccess} 
          campus={currentCampus}
        />
      ),
    },
    {
      key: 'list',
      label: (
        <span>
          <UnorderedListOutlined />
          咨询量列表
        </span>
      ),
      children: (
        <ConsultationList 
          refreshKey={refreshKey} 
          campus={currentCampus}
        />
      ),
    },
    {
      key: 'stats',
      label: (
        <span>
          <BarChartOutlined />
          统计
        </span>
      ),
      children: (
        <ConsultationStats 
          refreshKey={refreshKey}
        />
      ),
    },
    {
      key: 'distribute',
      label: (
        <span>
          <UserSwitchOutlined />
          分量
        </span>
      ),
      children: (
        <DistributeList 
          refreshKey={refreshKey} 
          campus={currentCampus}
          currentUserRealName={user?.name}
        />
      ),
    },
    {
      key: 'transfer',
      label: (
        <span>
          <SwapOutlined />
          转量
        </span>
      ),
      children: (
        <TransferList 
          refreshKey={refreshKey} 
          campus={currentCampus}
          currentUserRealName={user?.name}
        />
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Card 
        title="咨询量录入系统" 
        bordered={false}
        style={{ marginBottom: 16 }}
        extra={
          isDev && (
            <Button 
              icon={<ExperimentOutlined />} 
              onClick={() => setGeneratorVisible(true)}
              danger
              type="dashed"
            >
              数据生成器
            </Button>
          )
        }
      >
        <div style={{ color: '#666', marginBottom: 16 }}>
          <p>
            <strong>功能说明：</strong>
          </p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li>电话号码是唯一必填项，用于识别咨询者身份</li>
            <li>支持添加第二电话号码，方便联系</li>
            <li>系统自动检测重量（重复咨询），防止抢量冲突</li>
            <li>登记日期精确到秒，确保录入顺序</li>
            <li>重复咨询会自动关联到已有对象，增加咨询次数</li>
          </ul>
        </div>
      </Card>

      <Tabs 
        activeKey={activeTab} 
        onChange={handleTabChange}
        items={items}
        type="card"
        size="large"
      />

      {/* 开发模式 - 数据生成器弹窗 */}
      {isDev && (
        <Modal
          open={generatorVisible}
          onCancel={() => setGeneratorVisible(false)}
          footer={null}
          width={1000}
          destroyOnClose
        >
          <ConsultationGenerator onClose={() => {
            setGeneratorVisible(false)
            setRefreshKey(k => k + 1)
          }} />
        </Modal>
      )}
    </div>
  )
}
