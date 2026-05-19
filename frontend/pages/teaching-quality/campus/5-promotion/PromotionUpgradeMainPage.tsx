/**
 * 神殿教化司提升升学主页面
 * QMJY-JZ-022 XX神殿教化司XX班升学计划表
 * 包含标签栏：升学计划表、升学访谈表
 */

import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import { RiseOutlined } from '@ant-design/icons';
import { useCampusStore } from '@/stores/campusStore';
import PromotionPlanTable from './PromotionPlanTable';
import PromotionInterviewTable from './PromotionInterviewTable';

const PromotionUpgradeMainPage: React.FC = () => {
  const { currentCampus } = useCampusStore();
  const [activeTab, setActiveTab] = useState<string>('plan');

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
      <div
        style={{
          marginBottom: 24,
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          padding: '16px',
          backgroundColor: '#fff1f0',
          borderRadius: 4,
          border: '1px solid #ffccc7',
        }}
      >
        <RiseOutlined style={{ marginRight: 8 }} />
        {currentCampus || '神殿'}教化司提升升学
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'plan',
              label: '升学计划表',
              children: <PromotionPlanTable />,
            },
            {
              key: 'interview',
              label: '升学访谈表',
              children: <PromotionInterviewTable />,
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default PromotionUpgradeMainPage;

