/**教质
 * 神殿后端就业明星汇总表主页面
 */

import React, { useState, useEffect } from 'react';
import { App, Card, Space, Select } from 'antd';
import { useCampusStore } from '@/stores/campusStore';
import EmploymentStarTable from './components/2-EmploymentStarTableComponent';
import type { EmploymentStarRecord } from '@/types/employment-star';
import { tqEmploymentStarService } from '@/services/teaching-quality/TQemploymentStar';

const { Option } = Select;

interface EmploymentStarPageProps {
  hideCampusSelector?: boolean;
  selectedClass?: string; // 选中的班级：'Y32', 'Y33', 'Y34' 或 undefined（汇总）
}

const EmploymentStarPage: React.FC<EmploymentStarPageProps> = ({ 
  hideCampusSelector = false,
  selectedClass
}) => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore();
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '');
  const [data, setData] = useState<EmploymentStarRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // 根据selectedClass过滤数据
  const filteredData = React.useMemo(() => {
    if (!selectedClass) {
      // 汇总模式，显示所有数据
      return data;
    }
    // 班级过滤模式，只显示匹配的班级
    return data.filter(record => record.className === selectedClass);
  }, [data, selectedClass]);

  // 神殿列表
  const campuses = getAllCampuses().map(campus => ({
    id: campus.name,
    name: campus.name
  }));

  // 获取数据
  const fetchData = async (campus: string) => {
    if (!campus) return;

    setLoading(true);
    try {
      const result = await tqEmploymentStarService.getEmploymentStarsData(campus);
      setData(result);
      if (result.length === 0) {
        message.info(`${campus} 暂无就业明星数据`);
      }
    } catch (error: any) {
      console.error('获取就业明星数据失败:', error);
      message.error(error?.message || '获取数据失败');
      setData([]);
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

  // 如果隐藏神殿选择器，从全局store获取神殿
  useEffect(() => {
    if (hideCampusSelector && currentCampus) {
      setSelectedCampus(currentCampus);
    }
  }, [hideCampusSelector, currentCampus]);

  return (
    <div style={{ padding: hideCampusSelector ? 0 : 24 }}>
      {!hideCampusSelector && (
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
      )}

      <EmploymentStarTable
        campus={selectedCampus}
        data={filteredData}
        loading={loading}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />
    </div>
  );
};

export default EmploymentStarPage;
