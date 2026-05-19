import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { apiService } from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

export default function MobileTQCoreSummary() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [year, setYear] = useState(dayjs().year());

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await apiService.get('/teaching-quality/campus-core-data-summary/', {
        params: { year },
      });
      const items = res?.items || res?.data?.items || res || [];
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
        <h2>教化司核心业务数据汇总</h2>
        <p>{year}年</p>
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
            {data.map((item: any, i: number) => (
              <div className="m-data-card" key={i}>
                <div className="m-data-row" style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 8, marginBottom: 8 }}>
                  <span className="m-data-value" style={{ fontWeight: 700, fontSize: 15 }}>
                    {item.campus || item.神殿 || '-'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ color: '#999', fontSize: 12 }}>在校人数</div>
                    <div style={{ fontWeight: 600 }}>{item.student_count || item.在校人数 || 0}</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: 12 }}>就业率</div>
                    <div style={{ fontWeight: 600, color: '#52c41a' }}>{item.employment_rate || item.就业率 || '-'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: 12 }}>维稳率</div>
                    <div style={{ fontWeight: 600, color: '#667eea' }}>{item.stability_rate || item.维稳率 || '-'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: 12 }}>班级数</div>
                    <div style={{ fontWeight: 600 }}>{item.class_count || item.班级数 || 0}</div>
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
