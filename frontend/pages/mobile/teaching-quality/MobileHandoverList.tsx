import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { apiService } from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

export default function MobileHandoverList() {
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
      const res: any = await apiService.get('/handover/', {
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
        <h2>咨询量交接列表</h2>
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
          <Empty description="暂无交接记录" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            {data.map((item: any, i: number) => (
              <div className="m-data-card" key={i}>
                <div className="m-data-row">
                  <span className="m-data-label">学员</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {item.student_name || item.学员 || '-'}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">班级</span>
                  <span className="m-data-value">{item.class_name || item.班级 || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">交接日期</span>
                  <span className="m-data-value">{item.handover_date || item.日期 || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">状态</span>
                  <span className="m-data-value" style={{ color: '#667eea' }}>
                    {item.status || item.状态 || '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Spin>
    </div>
  );
}
