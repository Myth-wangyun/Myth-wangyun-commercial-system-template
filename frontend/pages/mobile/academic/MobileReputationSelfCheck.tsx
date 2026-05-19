import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented, Tag } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { api } from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

interface SelfCheckRecord {
  date?: string;
  日期?: string;
  teacher?: string;
  教员?: string;
  items_done?: number;
  items_total?: number;
  status?: string;
}

export default function MobileReputationSelfCheck() {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<SelfCheckRecord[]>([]);
  const [year, setYear] = useState(dayjs().year());

  const campusName = currentCampus || user?.campus || '';

  useEffect(() => {
    if (!campusName) return;
    loadData();
  }, [campusName, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reputation-self-check', {
        params: { campus: campusName, year },
      });
      const items = res.data?.items || res.data?.records || res.data || [];
      setRecords(Array.isArray(items) ? items : []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <h2>口碑招生计划与执行统计</h2>
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
        {records.length === 0 ? (
          <Empty description="暂无数据" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            {records.map((r, i) => (
              <div className="m-data-card" key={i}>
                <div className="m-data-row">
                  <span className="m-data-label">日期</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {r.date || r.日期 || '-'}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">教员</span>
                  <span className="m-data-value">{r.teacher || r.教员 || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">进度</span>
                  <span className="m-data-value" style={{ color: '#667eea' }}>
                    {r.items_done || 0}/{r.items_total || 0}
                  </span>
                </div>
                {r.status && (
                  <div className="m-data-row">
                    <span className="m-data-label">状态</span>
                    <Tag color={r.status === '已完成' ? 'green' : 'orange'}>{r.status}</Tag>
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
