import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { api } from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

interface SalaryPrediction {
  id?: number;
  class_name?: string;
  student_name?: string;
  predicted_salary?: number;
  actual_salary?: number;
  direction?: string;
}

export default function MobileSalaryEstimate() {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SalaryPrediction[]>([]);
  const [year, setYear] = useState(dayjs().year());

  const campusName = currentCampus || user?.campus || '';

  useEffect(() => {
    if (!campusName) return;
    loadData();
  }, [campusName, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/salary-prediction/', {
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
        <h2>班薪资预估表</h2>
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
            {data.map((item, i) => (
              <div className="m-data-card" key={item.id || i}>
                <div className="m-data-row">
                  <span className="m-data-label">学员</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {item.student_name || '-'}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">班级</span>
                  <span className="m-data-value">{item.class_name || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">预估薪资</span>
                  <span className="m-data-value" style={{ color: '#667eea' }}>
                    {item.predicted_salary ? `¥${item.predicted_salary.toLocaleString()}` : '-'}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">实际薪资</span>
                  <span className="m-data-value" style={{ color: '#52c41a' }}>
                    {item.actual_salary ? `¥${item.actual_salary.toLocaleString()}` : '-'}
                  </span>
                </div>
                {item.direction && (
                  <div className="m-data-row">
                    <span className="m-data-label">方向</span>
                    <span className="m-data-value">{item.direction}</span>
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
