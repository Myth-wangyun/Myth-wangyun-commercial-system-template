import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { api } from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

export default function MobileClassHourStats() {
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
      const res = await api.get('/teacher-hour-stats', {
        params: { campus: campusName, year },
      });
      const items = res.data?.items || res.data?.schedules || res.data || [];
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
        <h2>教员课时汇总表</h2>
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
          <Empty description="暂无课时数据" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            {data.map((item: any, i: number) => (
              <div className="m-data-card" key={i}>
                <div className="m-data-row">
                  <span className="m-data-label">教员</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {item.teacher_name || item.教员 || '-'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                  <div>
                    <div style={{ color: '#999', fontSize: 12 }}>总课时</div>
                    <div style={{ fontWeight: 600, color: '#667eea' }}>
                      {item.total_hours || item.总课时 || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: 12 }}>班级数</div>
                    <div style={{ fontWeight: 600 }}>
                      {item.class_count || item.班级数 || 0}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Spin>
    </div>
  );
}
