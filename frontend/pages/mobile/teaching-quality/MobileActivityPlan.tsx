import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { apiService } from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

export default function MobileActivityPlan() {
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
      const res: any = await apiService.get('/teaching-quality/campus-activity-plan', {
        params: { campus: campusName, year },
      });
      const items = res?.items || res?.data || [];
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
        <h2>活动计划安排表</h2>
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
          <Empty description="暂无活动计划" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            {data.map((item: any, i: number) => (
              <div className="m-data-card" key={i}>
                <div className="m-data-row">
                  <span className="m-data-label">活动名称</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {item.activity_name || item.活动名称 || item.name || '-'}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">时间</span>
                  <span className="m-data-value">{item.date || item.时间 || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">负责人</span>
                  <span className="m-data-value">{item.leader || item.负责人 || '-'}</span>
                </div>
                {(item.status || item.状态) && (
                  <div className="m-data-row">
                    <span className="m-data-label">状态</span>
                    <span className="m-data-value">{item.status || item.状态}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Spin>
    </div>
  );
}
