import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { api } from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

export default function MobileReputationKeyPoints() {
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
      const res = await api.get('/reputation-key-points', {
        params: { campus: campusName, year },
      });
      const items = res.data?.items || res.data || [];
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
        <h2>口碑关键点结果汇总</h2>
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
            {data.map((item: any, i: number) => (
              <div className="m-data-card" key={i}>
                <div className="m-data-row">
                  <span className="m-data-label">关键点</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {item.key_point || item.关键点 || item.name || '-'}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">目标</span>
                  <span className="m-data-value">{item.target || item.目标 || 0}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">实际</span>
                  <span className="m-data-value" style={{ color: '#52c41a' }}>
                    {item.actual || item.实际 || 0}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">完成率</span>
                  <span className="m-data-value" style={{ color: '#667eea' }}>
                    {item.completion_rate || item.完成率 || '-'}
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
