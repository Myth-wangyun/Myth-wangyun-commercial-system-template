import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { getExamPlan, type ExamPlan } from '@/services/cultureExam';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

export default function MobileCultureExam() {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<ExamPlan | null>(null);
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month() + 1);

  const campusName = currentCampus || user?.campus || '';

  useEffect(() => {
    if (!campusName) return;
    loadData();
  }, [campusName, year, month]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getExamPlan(campusName, year, month);
      setPlan(res);
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const rows = plan?.行数据 || [];

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <h2>企业文化考试计划</h2>
        <p>{campusName}</p>
      </div>

      <div className="m-year-selector">
        <Segmented
          value={year}
          onChange={(v) => setYear(v as number)}
          options={[year - 1, year, year + 1].map((y) => ({ label: `${y}年`, value: y }))}
        />
      </div>

      <div className="m-data-filter" style={{ overflowX: 'auto' }}>
        <Segmented
          value={month}
          onChange={(v) => setMonth(v as number)}
          options={Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}月`, value: i + 1 }))}
        />
      </div>

      <Spin spinning={loading}>
        {rows.length === 0 ? (
          <Empty description="暂无考试计划" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            {rows.map((r, i) => (
              <div className="m-data-card" key={r.计划ID || i}>
                <div className="m-data-row">
                  <span className="m-data-label">主题</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {r.考试主题 || '-'}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">时间</span>
                  <span className="m-data-value">{r.考试时间 || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">地点</span>
                  <span className="m-data-value">{r.考试地点 || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">监考人</span>
                  <span className="m-data-value">{r.监考人 || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">对象</span>
                  <span className="m-data-value">{r.考试对象 || '-'}</span>
                </div>
                {r.考试内容概述 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#666', borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
                    {r.考试内容概述}
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
