import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { request } from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

interface PopulationRow {
  学历: string;
  人数: number;
  占比: string;
}

export default function MobilePopulationDataSummary() {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PopulationRow[]>([]);
  const [consultantData, setConsultantData] = useState<any[]>([]);
  const [tab, setTab] = useState<string>('education');
  const [year] = useState(dayjs().year());

  const campusName = currentCampus || user?.campus || '';

  useEffect(() => {
    if (!campusName) return;
    loadData();
  }, [campusName, year, tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'education') {
        const res = await request.get('/consult/population/population-analysis/education-status', {
          params: { campus: campusName, year },
        });
        setData(res.data?.items || res.data || []);
      } else {
        const res = await request.get(
          '/consult/population/population-analysis/consultant-education-status',
          { params: { campus: campusName, year } },
        );
        setConsultantData(res.data?.items || res.data || []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <h2>各类人群数据汇总</h2>
        <p>{campusName} · {year}年</p>
      </div>

      <div className="m-data-filter">
        <Segmented
          block
          value={tab}
          onChange={(v) => setTab(v as string)}
          options={[
            { label: '学历分布', value: 'education' },
            { label: '咨询师分析', value: 'consultant' },
          ]}
        />
      </div>

      <Spin spinning={loading}>
        {tab === 'education' ? (
          data.length === 0 ? (
            <Empty description="暂无数据" />
          ) : (
            <div style={{ padding: '0 12px' }}>
              {data.map((row, i) => (
                <div className="m-data-card" key={i}>
                  <div className="m-data-row">
                    <span className="m-data-label">学历</span>
                    <span className="m-data-value" style={{ fontWeight: 600 }}>
                      {row.学历}
                    </span>
                  </div>
                  <div className="m-data-row">
                    <span className="m-data-label">人数</span>
                    <span className="m-data-value">{row.人数}</span>
                  </div>
                  <div className="m-data-row">
                    <span className="m-data-label">占比</span>
                    <span className="m-data-value" style={{ color: '#667eea' }}>
                      {row.占比}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : consultantData.length === 0 ? (
          <Empty description="暂无数据" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            {consultantData.map((row: any, i: number) => (
              <div className="m-data-card" key={i}>
                <div className="m-data-row">
                  <span className="m-data-label">咨询师</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {row.咨询师 || row.consultant_name || '-'}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">咨询量</span>
                  <span className="m-data-value">{row.咨询量 || row.consult_count || 0}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">报名数</span>
                  <span className="m-data-value">{row.报名数 || row.signup_count || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Spin>
    </div>
  );
}
