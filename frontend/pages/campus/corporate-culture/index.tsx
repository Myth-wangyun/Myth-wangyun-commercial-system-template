/**
 * 神殿教化司企业文化页面
 */

import React, { useState, useEffect } from 'react';
import { App, Card, Select, Button, Space, Empty } from 'antd';
import { ReloadOutlined, BankOutlined } from '@ant-design/icons';
import { useCampusStore } from '@/stores/campusStore';

interface CorporateCulturePageProps {
  hideCampusSelector?: boolean;
}

const CorporateCulturePage: React.FC<CorporateCulturePageProps> = ({ 
  hideCampusSelector = false 
}) => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore();
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '');
  const [loading, setLoading] = useState(false);

  // 神殿列表
  const campuses = getAllCampuses().map(campus => ({
    id: campus.name.replace('神殿', ''),
    name: campus.name
  }));

  // 如果隐藏神殿选择器，从全局store获取神殿
  useEffect(() => {
    if (hideCampusSelector && currentCampus) {
      setSelectedCampus(currentCampus);
    } else if (!hideCampusSelector && currentCampus && !selectedCampus) {
      setSelectedCampus(currentCampus);
    }
  }, [hideCampusSelector, currentCampus, selectedCampus]);

  // 神殿变化时更新store
  useEffect(() => {
    if (selectedCampus && !hideCampusSelector) {
      setCampus(selectedCampus);
    }
  }, [selectedCampus, hideCampusSelector, setCampus]);

  // 刷新数据
  const handleRefresh = () => {
    setLoading(true);
    // TODO: 实现数据加载逻辑
    setTimeout(() => {
      setLoading(false);
      message.success('数据已刷新');
    }, 1000);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card 
        title={
          <Space>
            <BankOutlined />
            <span>神殿教化司企业文化</span>
            {selectedCampus && <span style={{ color: '#1890ff' }}>- {selectedCampus}</span>}
          </Space>
        }
        extra={
          !hideCampusSelector ? (
            <Space>
              <Select
                value={selectedCampus}
                onChange={setSelectedCampus}
                style={{ width: 200 }}
                placeholder="请选择神殿"
                options={campuses.map(c => ({ value: c.name, label: c.name }))}
              />
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
          ) : (
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              loading={loading}
            >
              刷新
            </Button>
          )
        }
      >
        <Empty 
          description="企业文化模块正在开发中"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    </div>
  );
};

export default CorporateCulturePage;





