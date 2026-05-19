import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { request } from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

interface MonthlyData {
  month: number;
  income: number;
  refund: number;
  net_income: number;
  enrollment: number;
}

export default function MobileFinancialIncome() {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MonthlyData[]>([]);
  const [year, setYear] = useState(dayjs().year());

  const campusName = currentCampus || user?.campus || '';

  useEffect(() => {
    if (!campusName) return;
    loadData();
  }, [campusName, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await request.get('/consult/mgnt-core-data/campus-monthly-data', {
        params: { campus: campusName, year },
      });
      const raw = res.data?.items || res.data?.months || res.data || [];
      setData(Array.isArray(raw) ? raw : []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = data.reduce((s, d) => s + (d.income || 0), 0);
  const totalRefund = data.reduce((s, d) => s + (d.refund || 0), 0);
  const totalNet = data.reduce((s, d) => s + (d.net_income || 0), 0);

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <h2>财务收入和退费</h2>
        <p>{campusName}</p>
      </div>

      <div className="m-year-selector">
        <Segmented
          value={year}
          onChange={(v) => setYear(v as number)}
          options={[year - 1, year, year + 1].map((y) => ({ label: `${y}年`, value: y }))}
        />
      </div>

      <div className="m-data-summary">
        <div className="m-stat-item">
          <div className="m-stat-value">{(totalIncome / 10000).toFixed(1)}万</div>
          <div className="m-stat-label">总收入</div>
        </div>
        <div className="m-stat-item">
          <div className="m-stat-value" style={{ color: '#ff4d4f' }}>
            {(totalRefund / 10000).toFixed(1)}万
          </div>
          <div className="m-stat-label">总退费</div>
        </div>
        <div className="m-stat-item">
          <div className="m-stat-value" style={{ color: '#52c41a' }}>
            {(totalNet / 10000).toFixed(1)}万
          </div>
          <div className="m-stat-label">净收入</div>
        </div>
      </div>

      <Spin spinning={loading}>
        {data.length === 0 ? (
          <Empty description="暂无数据" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            {data.map((d, i) => (
              <div className="m-data-card" key={i}>
                <div className="m-data-row">
                  <span className="m-data-label">{d.month}月</span>
                  <span className="m-data-value" style={{ fontWeight: 600, fontSize: 15 }}>
                    收入 ¥{(d.income || 0).toLocaleString()}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">退费</span>
                  <span className="m-data-value" style={{ color: '#ff4d4f' }}>
                    ¥{(d.refund || 0).toLocaleString()}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">净收入</span>
                  <span className="m-data-value" style={{ color: '#52c41a' }}>
                    ¥{(d.net_income || 0).toLocaleString()}
                  </span>
                </div>
                {d.enrollment !== undefined && (
                  <div className="m-data-row">
                    <span className="m-data-label">报名数</span>
                    <span className="m-data-value">{d.enrollment}</span>
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
