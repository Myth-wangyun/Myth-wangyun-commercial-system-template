import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { apiService } from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

/** 教化司管理数据通用页面 */
function TQManagementPage({ title, endpoint }: { title: string; endpoint: string }) {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [year, setYear] = useState(dayjs().year());

  const campusName = currentCampus || user?.campus || '';

  useEffect(() => {
    if (!campusName) return;
    loadData();
  }, [campusName, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await apiService.get(`/teaching-quality/${endpoint}`, {
        params: { campus: campusName, year },
      });
      const items = res?.items || res?.data || res?.rows || [];
      setData(Array.isArray(items) ? items : []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <h2>{title}</h2>
        <p>{campusName}</p>
      </div>

      <div className="m-year-selector">
        <Segmented
          value={year}
          onChange={(v) => setYear(v as number)}
          options={[year - 1, year, year + 1].map((y) => ({ label: `${y}年`, value: y }))}
        />
      </div>

      <Spin spinning={loading}>
        {data.length === 0 ? (
          <Empty description="暂无数据" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            {data.map((item: any, i: number) => {
              const entries = Object.entries(item).filter(
                ([k]) => !['id', 'campus', 'year', 'created_at', 'updated_at'].includes(k),
              );
              return (
                <div className="m-data-card" key={i}>
                  {entries.slice(0, 6).map(([key, val]) => (
                    <div className="m-data-row" key={key}>
                      <span className="m-data-label">{key}</span>
                      <span className="m-data-value">{String(val ?? '-')}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </Spin>
    </div>
  );
}

export function MobileTQEmployeeFunctionAnalysis() {
  return <TQManagementPage title="员工功能分析表" endpoint="employee-function-business" />;
}

export function MobileTQEmployeeKpiPlan() {
  return <TQManagementPage title="员工KPI计划表" endpoint="manager-kpi" />;
}

export function MobileTQEmployeeInterview() {
  return <TQManagementPage title="员工访谈表" endpoint="employee-interview" />;
}

export function MobileTQMeetingRecord() {
  return <TQManagementPage title="会议记录表" endpoint="meeting-record" />;
}

export function MobileTQTrainingPlanScore() {
  return <TQManagementPage title="培训计划与成绩明细" endpoint="training-plan-score-sessions" />;
}

export default MobileTQEmployeeFunctionAnalysis;
