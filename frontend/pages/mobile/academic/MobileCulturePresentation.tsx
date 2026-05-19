import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { getPresentationPlan, type PresentationPlan } from '@/services/culturePresentation';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

export default function MobileCulturePresentation() {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PresentationPlan | null>(null);
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
      const res = await getPresentationPlan(campusName, year, month);
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
        <h2>企业文化宣讲计划</h2>
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
          <Empty description="暂无宣讲计划" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            {rows.map((r, i) => (
              <div className="m-data-card" key={r.计划ID || i}>
                <div className="m-data-row">
                  <span className="m-data-label">主题</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {r.宣讲主题 || '-'}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">时间</span>
                  <span className="m-data-value">{r.宣讲时间 || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">地点</span>
                  <span className="m-data-value">{r.宣讲地点 || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">主讲人</span>
                  <span className="m-data-value">{r.主讲人 || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">对象</span>
                  <span className="m-data-value">{r.宣讲对象 || '-'}</span>
                </div>
                {r.宣讲内容概述 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#666', borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
                    {r.宣讲内容概述}
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
