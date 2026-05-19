import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { apiService } from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

/** 通用TQ页面 - 根据endpoint和title加载数据 */
function TQGenericPage({ title, endpoint }: { title: string; endpoint: string }) {
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

// TQ子页面批量导出
export function MobileTQClassEmploymentInfo() {
  return <TQGenericPage title="班级就业信息表" endpoint="qt-class-employment-info" />;
}

export function MobileTQClassEmploymentDetail() {
  return <TQGenericPage title="班级就业明细表" endpoint="qt-class-employment-summary" />;
}

export function MobileEmploymentPeriodPlan() {
  return <TQGenericPage title="就业期计划与监督表" endpoint="class-employment-period-plan-supervision" />;
}

export function MobileIntensifyPeriodPlan() {
  return <TQGenericPage title="强化期计划与监督表" endpoint="class-intensify-plan-supervision" />;
}

export function MobileTQSalaryEstimate() {
  return <TQGenericPage title="班薪资预估表" endpoint="class-file" />;
}

export function MobileClassFileRecord() {
  return <TQGenericPage title="班档案信息表" endpoint="class-file" />;
}

export function MobileThousandScore() {
  return <TQGenericPage title="班千分制每月累计统计" endpoint="thousand-score" />;
}

export function MobileClassStatusSummary() {
  return <TQGenericPage title="班级情况表" endpoint="class-file" />;
}

export function MobileTQPressureInterview() {
  return <TQGenericPage title="压力面试成绩表" endpoint="class-file" />;
}

export function MobilePressureInterviewRating() {
  return <TQGenericPage title="压力面试打分表" endpoint="class-file" />;
}

export default MobileTQClassEmploymentInfo;
