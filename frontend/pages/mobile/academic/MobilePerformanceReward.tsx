import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented, Tag } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { api } from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

export default function MobilePerformanceReward() {
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
      const res = await api.get('/staff-performance-reward/', {
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
        <h2>教员业绩奖惩表</h2>
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
                  <span className="m-data-label">教员</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {item.teacher_name || item.教员 || '-'}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">类型</span>
                  <Tag color={item.type === '奖励' || item.类型 === '奖励' ? 'green' : 'red'}>
                    {item.type || item.类型 || '-'}
                  </Tag>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">金额</span>
                  <span className="m-data-value" style={{ color: '#667eea', fontWeight: 600 }}>
                    ¥{(item.amount || item.金额 || 0).toLocaleString()}
                  </span>
                </div>
                {(item.reason || item.原因) && (
                  <div className="m-data-row">
                    <span className="m-data-label">原因</span>
                    <span className="m-data-value" style={{ fontSize: 12 }}>
                      {item.reason || item.原因}
                    </span>
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
