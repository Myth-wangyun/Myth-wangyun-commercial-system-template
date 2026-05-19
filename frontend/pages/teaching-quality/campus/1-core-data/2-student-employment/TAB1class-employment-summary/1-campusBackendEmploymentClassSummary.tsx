/**教质
 * 神殿后端学员就业班级汇总表主页面
 */

import React, { useEffect } from 'react';
import { App, Select, Card } from 'antd';
import { useCampusStore } from '@/stores/campusStore';
import ClassEmploymentSummaryTable from './components/1-ClassEmploymentSummaryTableCompent';
import { classEmploymentSummaryService } from '@/services/teaching-quality/QTclassEmploymentSummary';
import type { ClassEmploymentSummaryRecord } from '@/types/class-employment-summary';
import { GlobalCampusSelector } from '@/components/common/CampusSelector';

interface ClassEmploymentSummaryPageProps {
  hideCampusSelector?: boolean;
  selectedClass?: string; // 选中的班级：'Y32', 'Y33', 'Y34' 或 undefined（汇总）
}

const ClassEmploymentSummaryPage: React.FC<ClassEmploymentSummaryPageProps> = ({ 
  hideCampusSelector = false,
  selectedClass
}) => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const [campus, setCampus] = React.useState<string>(currentCampus || '主神殿');
  const [year, setYear] = React.useState<number | null>(null);
  const [availableYears, setAvailableYears] = React.useState<number[]>([]);
  const [data, setData] = React.useState<ClassEmploymentSummaryRecord[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  // 根据selectedClass过滤数据
  const filteredData = React.useMemo(() => {
    if (!selectedClass) {
      // 汇总模式，显示所有数据
      return data;
    }
    // 班级过滤模式，只显示匹配的班级
    return data.filter(record => record.className === selectedClass);
  }, [data, selectedClass]);

  // 同步全局神殿到本地入参（无论是否隐藏选择器）
  useEffect(() => {
    if (currentCampus) {
      setCampus(currentCampus);
    }
  }, [currentCampus]);

  // 加载数据
  const loadData = React.useCallback(async () => {
    if (!campus) return;
    
    setLoading(true);
    try {
      const result = await classEmploymentSummaryService.getClassEmploymentSummaryData(campus, year);
      setData(result);
    } catch (error) {
      message.error('数据加载失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [campus, year]);

  // 加载可用年份列表
  const loadAvailableYears = React.useCallback(async () => {
    if (!campus) return;
    
    try {
      const years = await classEmploymentSummaryService.getAvailableYears(campus);
      const currentYear = new Date().getFullYear();
      const finalYears = years.length > 0 ? years : [currentYear];
      setAvailableYears(finalYears);
      // 如果当前没有选择年份，自动选择最新的年份；若后端暂无年份，则默认使用当前年份
      if (!year) {
        setYear(finalYears[0]);
      }
    } catch (error) {
      console.error('加载年份列表失败:', error);
      setAvailableYears([]);
    }
  }, [campus, year]);

  // 当神殿变化时，重新加载可用年份
  React.useEffect(() => {
    loadAvailableYears();
  }, [campus, loadAvailableYears]);

  // 初始加载与神殿/年份变化时重新加载数据（若未选年份则取后端默认最大年份）
  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // 处理刷新
  const handleRefresh = () => {
    loadData();
  };

  // 处理导出
  const handleExport = () => {
    message.info('导出功能已在表格组件中实现');
  };

  return (
    <div style={{ padding: hideCampusSelector ? 0 : '24px' }}>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {!hideCampusSelector && <GlobalCampusSelector showLabel={false} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#666', whiteSpace: 'nowrap' }}>年份：</span>
            <Select
              style={{ width: 120 }}
              value={year}
              onChange={(value) => setYear(value)}
              placeholder="请选择年份"
              options={availableYears.map((y) => ({
                label: `${y}年`,
                value: y,
              }))}
            />
          </div>
        </div>
      </Card>

      {/* 班级就业汇总表 */}
      <ClassEmploymentSummaryTable
        campus={campus}
        data={filteredData}
        loading={loading}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />
    </div>
  );
};

export default ClassEmploymentSummaryPage;





