import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { getMeetingRecords, type MeetingRecordBackend } from '@/services/academicMeetingRecord';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

export default function MobileAcademicMeetingRecord() {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<MeetingRecordBackend[]>([]);
  const [year, setYear] = useState(dayjs().year());

  const campusName = currentCampus || user?.campus || '';

  useEffect(() => {
    if (!campusName) return;
    loadData();
  }, [campusName, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getMeetingRecords(campusName, year);
      setRecords(res.行数据 || []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <h2>智慧司会议记录</h2>
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
          <Empty description="暂无会议记录" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            {records.map((r, i) => (
              <div className="m-data-card" key={r.记录ID || i}>
                <div className="m-data-row">
                  <span className="m-data-label">时间</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {r.时间 || '-'}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">地点</span>
                  <span className="m-data-value">{r.地点 || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">主持</span>
                  <span className="m-data-value">{r.主持 || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">参与人</span>
                  <span className="m-data-value" style={{ fontSize: 12 }}>
                    {r.参与人 || '-'}
                  </span>
                </div>
                {r.议题 && (
                  <div style={{ marginTop: 8, padding: '8px 0', borderTop: '1px solid #f0f0f0' }}>
                    <div style={{ color: '#667eea', fontSize: 12, marginBottom: 4 }}>议题</div>
                    <div style={{ fontSize: 13 }}>{r.议题}</div>
                  </div>
                )}
                {r.问题解决 && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ color: '#52c41a', fontSize: 12, marginBottom: 4 }}>已解决</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{r.问题解决}</div>
                  </div>
                )}
                {r.问题待解决 && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ color: '#ff4d4f', fontSize: 12, marginBottom: 4 }}>待解决</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{r.问题待解决}</div>
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
