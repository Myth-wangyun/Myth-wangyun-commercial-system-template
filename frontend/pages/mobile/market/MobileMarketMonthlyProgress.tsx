import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import api from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

export default function MobileMarketMonthlyProgress() {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [year, setYear] = useState(dayjs().year());

  const campusName = currentCampus || user?.campus || '';

  useEffect(() => {
    if (!campusName) return;
    loadData();
  }, [campusName, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/market/monthly-business-progress', {
        params: { campus: campusName, year },
      });
      setData(res.data?.data || res.data || null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const months = data
    ? Object.entries(data).filter(([k]) => /^\d+$/.test(k) || /月/.test(k))
    : [];

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <h2>月度经营进度表</h2>
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
        {!data ? (
          <Empty description="暂无数据" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            <div className="m-month-grid">
              {months.map(([month, val]: any) => (
                <div className="m-data-card" key={month} style={{ textAlign: 'center' }}>
                  <div style={{ color: '#999', fontSize: 12 }}>{month}月</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#667eea' }}>
                    {typeof val === 'object' ? (val?.total || val?.合计 || '-') : val}
                  </div>
                </div>
              ))}
            </div>

            {typeof data === 'object' && !Array.isArray(data) && (
              <div className="m-data-card" style={{ marginTop: 12 }}>
                {Object.entries(data)
                  .filter(([k]) => !/^\d+$/.test(k) && !/月/.test(k))
                  .slice(0, 8)
                  .map(([key, val]) => (
                    <div className="m-data-row" key={key}>
                      <span className="m-data-label">{key}</span>
                      <span className="m-data-value">{String(val ?? '-')}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </Spin>
    </div>
  );
}
