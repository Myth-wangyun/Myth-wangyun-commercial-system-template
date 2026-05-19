import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented, Collapse } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import {
  academicCampusReputationEnrollmentGoalsResultsService,
} from '@/services/academicCampusReputationEnrollmentGoalsResults';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

export default function MobileReputationGoals() {
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
      const res = await academicCampusReputationEnrollmentGoalsResultsService.getCampusReputationEnrollmentGoalsResultsData(
        campusName,
        year,
      );
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const rows = data?.items || data?.rows || (Array.isArray(data) ? data : []);

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <h2>口碑招生目标与结果</h2>
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
        {rows.length === 0 ? (
          <Empty description="暂无数据" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            {rows.map((row: any, i: number) => (
              <div className="m-data-card" key={i}>
                <div className="m-data-row">
                  <span className="m-data-label">
                    {row.teacher_name || row.教员 || row.name || `项目${i + 1}`}
                  </span>
                  <span className="m-data-value" style={{ fontWeight: 600, color: '#667eea' }}>
                    目标: {row.goal || row.目标 || 0}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">实际完成</span>
                  <span className="m-data-value" style={{ color: '#52c41a' }}>
                    {row.actual || row.实际 || 0}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">完成率</span>
                  <span className="m-data-value">
                    {row.completion_rate || row.完成率 || '-'}
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
