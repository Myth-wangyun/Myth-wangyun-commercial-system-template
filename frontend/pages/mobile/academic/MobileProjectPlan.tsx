import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented, Tag } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import { api } from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

interface ProjectTask {
  project_name?: string;
  项目名称?: string;
  class_name?: string;
  班级?: string;
  teacher?: string;
  教员?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  状态?: string;
}

export default function MobileProjectPlan() {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [year, setYear] = useState(dayjs().year());

  const campusName = currentCampus || user?.campus || '';

  useEffect(() => {
    if (!campusName) return;
    loadData();
  }, [campusName, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/campus-project-plan', {
        params: { campus: campusName, year },
      });
      const items = res.data?.items || res.data?.tasks || res.data || [];
      setTasks(Array.isArray(items) ? items : []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <h2>智慧司项目计划表</h2>
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
        {tasks.length === 0 ? (
          <Empty description="暂无项目计划" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            {tasks.map((task, i) => (
              <div className="m-data-card" key={i}>
                <div className="m-data-row">
                  <span className="m-data-label">项目</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {task.project_name || task.项目名称 || '-'}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">班级</span>
                  <span className="m-data-value">{task.class_name || task.班级 || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">教员</span>
                  <span className="m-data-value">{task.teacher || task.教员 || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">时间</span>
                  <span className="m-data-value">
                    {task.start_date || '-'} ~ {task.end_date || '-'}
                  </span>
                </div>
                {(task.status || task.状态) && (
                  <div className="m-data-row">
                    <span className="m-data-label">状态</span>
                    <Tag color={task.status === '已完成' || task.状态 === '已完成' ? 'green' : 'blue'}>
                      {task.status || task.状态}
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
