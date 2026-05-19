import React, { useState, useEffect } from 'react';
import { Spin, Empty, Tag } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { request } from '@/services/api';
import { mapStatus } from '@/utils/enumMappings';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

interface RegisterRecord {
  id?: number;
  序号?: number;
  日期?: string;
  date?: string;
  咨询师?: string;
  consultant_name?: string;
  姓名?: string;
  name?: string;
  来源?: string;
  source?: string;
  状态?: string;
  status?: string;
  电话?: string;
  phone?: string;
}

export default function MobileDailyConsultingRegister() {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<RegisterRecord[]>([]);
  const [date, setDate] = useState(dayjs());

  const campusName = currentCampus || user?.campus || '';

  useEffect(() => {
    if (!campusName) return;
    loadData();
  }, [campusName, date]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await request.get('/consult/consultation/', {
        params: {
          campus: campusName,
          date: date.format('YYYY-MM-DD'),
          page: 1,
          page_size: 100,
        },
      });
      const items = res.data?.items || res.data?.records || res.data || [];
      setRecords(Array.isArray(items) ? items : []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status?.includes('报名') || status?.includes('签约')) return 'green';
    if (status?.includes('上门')) return 'blue';
    if (status?.includes('退费')) return 'red';
    return 'default';
  };

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <h2>每日咨询量登记表</h2>
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
          <Empty description="暂无记录" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            <div className="m-data-summary">
              <div className="m-stat-item">
                <div className="m-stat-value">{records.length}</div>
                <div className="m-stat-label">总咨询量</div>
              </div>
            </div>
            {records.map((r, i) => (
              <div className="m-data-card" key={r.id || i}>
                <div className="m-data-row">
                  <span className="m-data-label">姓名</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {r.姓名 || r.name || '-'}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">咨询师</span>
                  <span className="m-data-value">
                    {r.咨询师 || r.consultant_name || '-'}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">来源</span>
                  <span className="m-data-value">{r.来源 || r.source || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">状态</span>
                  <Tag color={getStatusColor(r.状态 || r.status || '')}>
                    {mapStatus(r.状态 || r.status)}
                  </Tag>
                </div>
              </div>
            ))}
          </div>
        )}
      </Spin>
    </div>
  );
}
