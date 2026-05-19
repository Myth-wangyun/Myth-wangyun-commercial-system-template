import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { apiService } from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

export default function MobileTQNewStudentSchedule() {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [date, setDate] = useState(dayjs());

  const campusName = currentCampus || user?.campus || '';

  useEffect(() => {
    if (!campusName) return;
    loadData();
  }, [campusName, date]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await apiService.get('/teaching-quality/daily-new-student-schedule', {
        params: { campus: campusName, date: date.format('YYYY-MM-DD') },
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
        <h2>每日新生安排表</h2>
        <p>{campusName} (教化司)</p>
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
        {data.length === 0 ? (
          <Empty description="暂无安排" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            {data.map((item: any, i: number) => (
              <div className="m-data-card" key={i}>
                {Object.entries(item)
                  .filter(([k]) => !['id', 'campus'].includes(k))
                  .slice(0, 6)
                  .map(([key, val]) => (
                    <div className="m-data-row" key={key}>
                      <span className="m-data-label">{key}</span>
                      <span className="m-data-value">{String(val ?? '-')}</span>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}
      </Spin>
    </div>
  );
}
