import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented, Tag } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { apiService } from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

interface EmploymentDetail {
  class_name?: string;
  班级?: string;
  student_name?: string;
  姓名?: string;
  company?: string;
  公司?: string;
  salary?: number;
  薪资?: number;
  position?: string;
  岗位?: string;
  status?: string;
  状态?: string;
}

export default function MobileClassEmploymentDetail() {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EmploymentDetail[]>([]);
  const [year, setYear] = useState(dayjs().year());

  const campusName = currentCampus || user?.campus || '';

  useEffect(() => {
    if (!campusName) return;
    loadData();
  }, [campusName, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await apiService.get('/teaching-quality/qt-class-employment-info', {
        params: { campus: campusName, year },
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
        <h2>班级就业明细表</h2>
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
            <div className="m-data-summary">
              <div className="m-stat-item">
                <div className="m-stat-value">{data.length}</div>
                <div className="m-stat-label">学员数</div>
              </div>
              <div className="m-stat-item">
                <div className="m-stat-value">
                  {data.filter((d) => d.status === '已就业' || d.状态 === '已就业').length}
                </div>
                <div className="m-stat-label">已就业</div>
              </div>
            </div>
            {data.map((item, i) => (
              <div className="m-data-card" key={i}>
                <div className="m-data-row">
                  <span className="m-data-label">姓名</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {item.student_name || item.姓名 || '-'}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">班级</span>
                  <span className="m-data-value">{item.class_name || item.班级 || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">公司</span>
                  <span className="m-data-value">{item.company || item.公司 || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">岗位</span>
                  <span className="m-data-value">{item.position || item.岗位 || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">薪资</span>
                  <span className="m-data-value" style={{ color: '#52c41a' }}>
                    {item.salary || item.薪资 ? `¥${(item.salary || item.薪资 || 0).toLocaleString()}` : '-'}
                  </span>
                </div>
                {(item.status || item.状态) && (
                  <div className="m-data-row">
                    <span className="m-data-label">状态</span>
                    <Tag color={item.status === '已就业' || item.状态 === '已就业' ? 'green' : 'default'}>
                      {item.status || item.状态}
                    </Tag>
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
