import React, { useState, useEffect } from 'react';
import { Spin, Empty, Input, Tag } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

export default function MobileAuditLog() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/logs', {
        params: { page: 1, page_size: 50, keyword: keyword || undefined },
      });
      const items = res.data?.items || res.data?.data || [];
      setData(Array.isArray(items) ? items : []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (/create|新增|创建/i.test(action)) return 'green';
    if (/update|修改|编辑/i.test(action)) return 'blue';
    if (/delete|删除/i.test(action)) return 'red';
    return 'default';
  };

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <h2>操作日志</h2>
        <p>系统审计</p>
      </div>

      <div style={{ padding: '0 12px 12px' }}>
        <Input.Search
          placeholder="搜索日志..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={loadData}
          allowClear
        />
      </div>

      <Spin spinning={loading}>
        {data.length === 0 ? (
          <Empty description="暂无日志" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            {data.map((item: any, i: number) => (
              <div className="m-data-card" key={i}>
                <div className="m-data-row">
                  <span className="m-data-label">操作人</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {item.username || item.操作人 || '-'}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">操作</span>
                  <Tag color={getActionColor(item.action || item.操作 || '')}>
                    {item.action || item.操作 || '-'}
                  </Tag>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">资源</span>
                  <span className="m-data-value">{item.resource || item.资源 || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">时间</span>
                  <span className="m-data-value" style={{ color: '#999' }}>
                    {item.created_at
                      ? dayjs(item.created_at).format('MM-DD HH:mm')
                      : item.时间 || '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Spin>
    </div>
  );
}
