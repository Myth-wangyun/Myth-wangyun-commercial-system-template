import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import axios from 'axios';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

interface StaffRow {
  序号?: number;
  姓名?: string;
  岗位?: string;
  综合得分?: number;
  等级?: string;
  [key: string]: any;
}

export default function MobileConsultStaffFunction() {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [year, setYear] = useState(dayjs().year());

  const campusName = currentCampus || user?.campus || '';

  useEffect(() => {
    if (!campusName) return;
    loadData();
  }, [campusName, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/v1/consult/staff-function/campus/${encodeURIComponent(campusName)}`,
        { params: { year } },
      );
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
        <h2>员工职数和功能分析</h2>
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
                {row.综合得分 !== undefined && (
                  <div className="m-data-row">
                    <span className="m-data-label">综合得分</span>
                    <span className="m-data-value" style={{ color: '#667eea' }}>
                      {row.综合得分}
                    </span>
                  </div>
                )}
                {row.等级 && (
                  <div className="m-data-row">
                    <span className="m-data-label">等级</span>
                    <span className="m-data-value">{row.等级}</span>
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
