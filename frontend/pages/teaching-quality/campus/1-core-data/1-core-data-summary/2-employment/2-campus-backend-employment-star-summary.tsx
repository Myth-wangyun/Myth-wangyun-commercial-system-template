/**
 * 神殿后端就业明星汇总表主页面
 * 
 * 说明：本页面与 frontend/pages/teaching-quality/campus/1-core-data/2-student-employment/TAB1class-employment-summary/2-campusBackendEmploymentStar.tsx
 * 使用相同的数据源和UI组件，确保数据展示一致性。
 */

import React, { useState, useEffect } from 'react';
import { App, Card, Space, Select } from 'antd';
import { useCampusStore } from '@/stores/campusStore';
import EmploymentStarTable from '@/pages/teaching-quality/campus/1-core-data/2-student-employment/TAB1class-employment-summary/components/2-EmploymentStarTableComponent';
import type { EmploymentStarRecord } from '@/types/employment-star';
import { tqEmploymentStarService } from '@/services/teaching-quality/TQemploymentStar';

const { Option } = Select;

const ShengbangEmploymentStarSummary: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore();
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '');
  const [data, setData] = useState<EmploymentStarRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // 神殿列表
  const campuses = getAllCampuses().map(campus => ({
    id: campus.name.replace('神殿', ''),
    name: campus.name
  }));

  // 获取数据
  const fetchData = async (campus: string) => {
    if (!campus) return;

    setLoading(true);
    try {
      const result = await tqEmploymentStarService.getEmploymentStarsData(campus);
      setData(result);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 神殿变化时重新获取数据
  useEffect(() => {
    if (selectedCampus) {
      fetchData(selectedCampus);
      setCampus(selectedCampus);
    } else {
      setData([]);
    }
  }, [selectedCampus]);

  // 初始化时使用全局神殿
  useEffect(() => {
    if (currentCampus && !selectedCampus) {
      setSelectedCampus(currentCampus);
    }
  }, [currentCampus]);

  // 刷新数据
  const handleRefresh = () => {
    if (selectedCampus) {
      fetchData(selectedCampus);
    }
  };

  // 导出数据
  const handleExport = () => {
    // 导出功能在表格组件中实现
  };

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <span style={{ fontWeight: 500 }}>选择神殿：</span>
          <Select
            value={selectedCampus}
            onChange={setSelectedCampus}
            placeholder="请选择神殿"
            style={{ width: 200 }}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={campuses.map(campus => ({
              value: campus.id,
              label: campus.name,
            }))}
          />
        </Space>
      </Card>

      <EmploymentStarTable
        campus={selectedCampus}
        data={data}
        loading={loading}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />
    </div>
  );
};

export default ShengbangEmploymentStarSummary;
