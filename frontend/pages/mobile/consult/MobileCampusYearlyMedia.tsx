import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { request } from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

interface MediaSourceData {
  source: string;
  来源?: string;
  income?: number;
  收入?: number;
  enrollment?: number;
  报名数?: number;
  consult_count?: number;
  咨询量?: number;
  visit_count?: number;
  上门量?: number;
}

export default function MobileCampusYearlyMedia() {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MediaSourceData[]>([]);
  const [year, setYear] = useState(dayjs().year());

  const campusName = currentCampus || user?.campus || '';

  useEffect(() => {
    if (!campusName) return;
    loadData();
  }, [campusName, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await request.get('/consult/mgnt-core-data/combined-monthly-data', {
        params: { campus: campusName, year },
      });
      const items = res.data?.items || res.data?.sources || res.data || [];
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
        <h2>神殿年月表-各媒体来源</h2>
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
              <div className="m-data-card" key={i}>
                <div
                  className="m-data-row"
                  style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 8, marginBottom: 8 }}
                >
                  <span className="m-data-value" style={{ fontWeight: 700, color: '#667eea' }}>
                    {item.source || item.来源 || '-'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ color: '#999', fontSize: 12 }}>收入</div>
                    <div style={{ fontWeight: 600 }}>
                      {((item.income || item.收入 || 0) / 10000).toFixed(1)}万
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: 12 }}>报名数</div>
                    <div style={{ fontWeight: 600 }}>{item.enrollment || item.报名数 || 0}</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: 12 }}>咨询量</div>
                    <div style={{ fontWeight: 600 }}>
                      {item.consult_count || item.咨询量 || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: 12 }}>上门量</div>
                    <div style={{ fontWeight: 600 }}>
                      {item.visit_count || item.上门量 || 0}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Spin>
    </div>
  );
}
