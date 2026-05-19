import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { api } from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

interface ScoreRecord {
  id?: number;
  class_name?: string;
  student_name?: string;
  score?: number;
  grade?: string;
  date?: string;
  [key: string]: any;
}

/**
 * 通用成绩表组件 - 用于作业/考试/项目/压力面试/满意度/听课等成绩页面
 */
function MobileScorePage({
  title,
  endpoint,
}: {
  title: string;
  endpoint: string;
}) {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<ScoreRecord[]>([]);
  const [year, setYear] = useState(dayjs().year());

  const campusName = currentCampus || user?.campus || '';

  useEffect(() => {
    if (!campusName) return;
    loadData();
  }, [campusName, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoint, {
        params: { campus: campusName, year },
      });
      const items = res.data?.items || res.data || [];
      setRecords(Array.isArray(items) ? items : []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const avgScore = records.length
    ? (records.reduce((s, r) => s + (r.score || 0), 0) / records.length).toFixed(1)
    : '0';

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <h2>{title}</h2>
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
          <div className="m-stat-value">{records.length}</div>
          <div className="m-stat-label">总记录</div>
        </div>
        <div className="m-stat-item">
          <div className="m-stat-value" style={{ color: '#667eea' }}>
            {avgScore}
          </div>
          <div className="m-stat-label">平均分</div>
        </div>
      </div>

      <Spin spinning={loading}>
        {records.length === 0 ? (
          <Empty description="暂无成绩数据" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            {records.map((r, i) => (
              <div className="m-data-card" key={r.id || i}>
                <div className="m-data-row">
                  <span className="m-data-label">学员</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {r.student_name || '-'}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">班级</span>
                  <span className="m-data-value">{r.class_name || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">成绩</span>
                  <span
                    className="m-data-value"
                    style={{ color: (r.score || 0) >= 60 ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}
                  >
                    {r.score ?? '-'}
                  </span>
                </div>
                {r.grade && (
                  <div className="m-data-row">
                    <span className="m-data-label">等级</span>
                    <span className="m-data-value">{r.grade}</span>
                  </div>
                )}
                {r.date && (
                  <div className="m-data-row">
                    <span className="m-data-label">日期</span>
                    <span className="m-data-value">{r.date}</span>
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

// 各成绩页面导出
export function MobileAssignmentScore() {
  return <MobileScorePage title="班作业成绩表" endpoint="/class-assignment-grades/" />;
}

export function MobileExamScore() {
  return <MobileScorePage title="班考试成绩表" endpoint="/class-exam-scores/" />;
}

export function MobileProjectScore() {
  return <MobileScorePage title="班项目成绩表" endpoint="/project-grade-register/" />;
}

export function MobilePressureInterviewScore() {
  return <MobileScorePage title="班压力面试成绩表" endpoint="/press-interview-scores/" />;
}

export function MobileStudentSatisfaction() {
  return <MobileScorePage title="学员满意度成绩表" endpoint="/student-satisfaction-detail/" />;
}

export function MobileLectureScore() {
  return <MobileScorePage title="听课成绩表" endpoint="/teacher-lecture-score-sheet/" />;
}

export default MobileAssignmentScore;
