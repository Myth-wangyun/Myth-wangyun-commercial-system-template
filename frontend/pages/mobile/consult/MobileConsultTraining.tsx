import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { request } from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

interface TrainingRecord {
  id?: number;
  序号?: number;
  培训日期?: string;
  training_date?: string;
  培训主题?: string;
  topic?: string;
  培训人?: string;
  trainer?: string;
  参与人数?: number;
  attendees?: number;
  培训内容?: string;
  content?: string;
}

export default function MobileConsultTraining() {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [year, setYear] = useState(dayjs().year());

  const campusName = currentCampus || user?.campus || '';

  useEffect(() => {
    if (!campusName) return;
    loadData();
  }, [campusName, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await request.get('/consult/training-weekly/statistics/' + year, {
        params: { campus: campusName },
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
        <h2>祈福司培训汇总</h2>
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
          <Empty description="暂无培训记录" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            <div className="m-data-summary">
              <div className="m-stat-item">
                <div className="m-stat-value">{records.length}</div>
                <div className="m-stat-label">培训次数</div>
              </div>
            </div>
            {records.map((r, i) => (
              <div className="m-data-card" key={r.id || i}>
                <div className="m-data-row">
                  <span className="m-data-label">主题</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {r.培训主题 || r.topic || '-'}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">日期</span>
                  <span className="m-data-value">{r.培训日期 || r.training_date || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">培训人</span>
                  <span className="m-data-value">{r.培训人 || r.trainer || '-'}</span>
                </div>
                {(r.参与人数 || r.attendees) && (
                  <div className="m-data-row">
                    <span className="m-data-label">参与人数</span>
                    <span className="m-data-value">{r.参与人数 || r.attendees}</span>
                  </div>
                )}
                {(r.培训内容 || r.content) && (
                  <div className="m-data-row">
                    <span className="m-data-label">内容</span>
                    <span className="m-data-value" style={{ fontSize: 12 }}>
                      {r.培训内容 || r.content}
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
