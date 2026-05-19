import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import api from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

export default function MobileMarketPartnerContacts() {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [year, setYear] = useState(dayjs().year());

  const campusName = currentCampus || user?.campus || '';

  useEffect(() => {
    if (!campusName) return;
    loadData();
  }, [campusName, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/market/partner-contacts', {
        params: { campus: campusName, year },
      });
      const items = res.data?.items || res.data?.data || [];
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
        <h2>合伙人联系人表</h2>
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
          <Empty description="暂无合伙人" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            {data.map((item: any, i: number) => (
              <div className="m-data-card" key={i}>
                <div className="m-data-row">
                  <span className="m-data-label">姓名</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {item.name || item.姓名 || '-'}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">联系方式</span>
                  <span className="m-data-value">{item.phone || item.联系方式 || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">公司</span>
                  <span className="m-data-value">{item.company || item.公司 || '-'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Spin>
    </div>
  );
}
