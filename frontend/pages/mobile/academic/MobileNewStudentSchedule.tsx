import React, { useState, useEffect } from 'react';
import { Spin, Empty, Tag } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { api } from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

interface StudentArrangement {
  id?: number;
  student_name?: string;
  class_name?: string;
  teacher?: string;
  arrangement?: string;
  date?: string;
  status?: string;
}

export default function MobileNewStudentSchedule() {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<StudentArrangement[]>([]);
  const [date, setDate] = useState(dayjs());

  const campusName = currentCampus || user?.campus || '';

  useEffect(() => {
    if (!campusName) return;
    loadData();
  }, [campusName, date]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/new-student-arrangement/', {
        params: { campus: campusName, date: date.format('YYYY-MM-DD') },
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
        <h2>每日新生安排表</h2>
        <p>{campusName}</p>
      </div>

      <div className="m-date-nav">
        <button onClick={() => setDate((d) => d.subtract(1, 'day'))}>
          <LeftOutlined />
        </button>
        <span>{date.format('YYYY-MM-DD')}</span>
        <button onClick={() => setDate((d) => d.add(1, 'day'))}>
          <RightOutlined />
        </button>
      </div>

      <Spin spinning={loading}>
        {records.length === 0 ? (
          <Empty description="暂无安排" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            <div className="m-data-summary">
              <div className="m-stat-item">
                <div className="m-stat-value">{records.length}</div>
                <div className="m-stat-label">新生数</div>
              </div>
            </div>
            {records.map((r, i) => (
              <div className="m-data-card" key={r.id || i}>
                <div className="m-data-row">
                  <span className="m-data-label">学员</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {r.student_name || '-'}
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
                {r.arrangement && (
                  <div className="m-data-row">
                    <span className="m-data-label">安排</span>
                    <span className="m-data-value" style={{ fontSize: 12 }}>
                      {r.arrangement}
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
