import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { api } from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

interface CourseRecord {
  id?: number;
  class_name?: string;
  teacher?: string;
  day_of_week?: string;
  period?: string;
  course_name?: string;
  room?: string;
}

export default function MobileCourseSchedule() {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<CourseRecord[]>([]);
  const [year, setYear] = useState(dayjs().year());

  const campusName = currentCampus || user?.campus || '';

  useEffect(() => {
    if (!campusName) return;
    loadData();
  }, [campusName, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/class-course-schedule/', {
        params: { campus: campusName, year },
      });
      const items = res.data?.items || res.data || [];
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
        <h2>班排课表</h2>
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
          <Empty description="暂无排课数据" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            {records.map((r, i) => (
              <div className="m-data-card" key={r.id || i}>
                <div className="m-data-row">
                  <span className="m-data-label">课程</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {r.course_name || '-'}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">班级</span>
                  <span className="m-data-value">{r.class_name || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">教员</span>
                  <span className="m-data-value">{r.teacher || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">时间</span>
                  <span className="m-data-value">
                    {r.day_of_week || '-'} {r.period || ''}
                  </span>
                </div>
                {r.room && (
                  <div className="m-data-row">
                    <span className="m-data-label">教室</span>
                    <span className="m-data-value">{r.room}</span>
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
