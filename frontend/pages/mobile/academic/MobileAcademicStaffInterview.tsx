import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented, Collapse } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { fetchInterviewMonths, fetchInterviewRecord, type InterviewMonthRecord } from '@/services/academicStaffInterview';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

export default function MobileAcademicStaffInterview() {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [months, setMonths] = useState<number[]>([]);
  const [records, setRecords] = useState<InterviewMonthRecord[]>([]);
  const [year, setYear] = useState(dayjs().year());
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);

  const campusName = currentCampus || user?.campus || '';

  useEffect(() => {
    if (!campusName) return;
    loadMonths();
  }, [campusName, year]);

  useEffect(() => {
    if (!campusName || !selectedMonth) return;
    loadRecords();
  }, [campusName, year, selectedMonth]);

  const loadMonths = async () => {
    try {
      const res = await fetchInterviewMonths(campusName, year);
      setMonths(res.月份列表 || []);
    } catch {
      setMonths([]);
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await fetchInterviewRecord(campusName, year, selectedMonth);
      setRecords(res.表格数据 || []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <h2>教员访谈记录表</h2>
        <p>{campusName}</p>
      </div>

      <div className="m-year-selector">
        <Segmented
          value={year}
          onChange={(v) => setYear(v as number)}
          options={[year - 1, year, year + 1].map((y) => ({ label: `${y}年`, value: y }))}
        />
      </div>

      {months.length > 0 && (
        <div className="m-data-filter" style={{ overflowX: 'auto' }}>
          <Segmented
            value={selectedMonth}
            onChange={(v) => setSelectedMonth(v as number)}
            options={months.map((m) => ({ label: `${m}月`, value: m }))}
          />
        </div>
      )}

      <Spin spinning={loading}>
        {records.length === 0 ? (
          <Empty description="暂无访谈记录" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            {records.map((r, i) => {
              const monthContent = r.月份内容 || {};
              const contentEntries = Object.entries(monthContent);
              return (
                <div className="m-data-card" key={i}>
                  <div className="m-data-row" style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 8, marginBottom: 8 }}>
                    <span className="m-data-value" style={{ fontWeight: 700 }}>
                      {r.访谈对象}
                    </span>
                  </div>
                  {contentEntries.length > 0 ? (
                    contentEntries.map(([month, content]) => (
                      <div key={month} style={{ marginBottom: 8 }}>
                        <div style={{ color: '#667eea', fontSize: 12, marginBottom: 4 }}>{month}</div>
                        <div className="m-data-row">
                          <span className="m-data-label">访谈人</span>
                          <span className="m-data-value">{content.访谈人 || '-'}</span>
                        </div>
                        {content.访谈内容 && (
                          <div style={{ fontSize: 12, color: '#666', padding: '4px 0' }}>
                            {content.访谈内容}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#999', fontSize: 13 }}>暂无访谈内容</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Spin>
    </div>
  );
}
