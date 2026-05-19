import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import axios from 'axios';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

interface HrBasicRow {
  序号: number;
  姓名?: string;
  岗位?: string;
  入职日期?: string;
  状态?: string;
  [key: string]: any;
}

export default function MobileConsultHrBasic() {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<HrBasicRow[]>([]);
  const [year, setYear] = useState(dayjs().year());

  const campusName = currentCampus || user?.campus || '';

  useEffect(() => {
    if (!campusName) return;
    loadData();
  }, [campusName, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/v1/consult/hr-basic/${year}`, {
        params: { campus: campusName },
      });
      const raw = res.data?.rows || res.data?.items || res.data || [];
      setRows(Array.isArray(raw) ? raw : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <h2>人力资源基础表</h2>
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
            <div className="m-data-summary">
              <div className="m-stat-item">
                <div className="m-stat-value">{rows.length}</div>
                <div className="m-stat-label">总人数</div>
              </div>
            </div>
            {rows.map((row, i) => (
              <div className="m-data-card" key={i}>
                <div className="m-data-row">
                  <span className="m-data-label">姓名</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {row.姓名 || '-'}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">岗位</span>
                  <span className="m-data-value">{row.岗位 || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">入职日期</span>
                  <span className="m-data-value">{row.入职日期 || '-'}</span>
                </div>
                {row.状态 && (
                  <div className="m-data-row">
                    <span className="m-data-label">状态</span>
                    <span className="m-data-value">{row.状态}</span>
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
