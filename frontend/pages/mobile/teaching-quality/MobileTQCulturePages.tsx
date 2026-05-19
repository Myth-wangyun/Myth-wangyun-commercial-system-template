import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { apiService } from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

/** 教化司企业文化通用页面 */
function TQCulturePage({ title, endpoint }: { title: string; endpoint: string }) {
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
      const items = res?.items || res?.data || res?.行数据 || [];
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
                ([k]) => !['id', 'campus', 'year', '计划ID'].includes(k),
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

export function MobileTQCulturePresentation() {
  return <TQCulturePage title="企业文化宣讲计划" endpoint="culture-presentation-plan" />;
}

export function MobileTQCultureExam() {
  return <TQCulturePage title="企业文化考试计划" endpoint="culture-exam-plan" />;
}

export default MobileTQCulturePresentation;
