import React, { useState, useEffect } from 'react';
import { Spin, Empty, Tag, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

// Inline types to avoid import issues
interface ExportRequest {
  id: number;
  requester_name?: string;
  campus?: string;
  date_range?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  created_at?: string;
  approved_at?: string;
  approved_by?: string;
  reason?: string;
}

export default function MobileExportApproval() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<ExportRequest[]>([]);
  const [tab, setTab] = useState<string>('my');

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { request } = await import('@/services/api');
      const endpoint = tab === 'my' ? '/consult/export/my-requests' : '/consult/export/pending';
      const res = await request.get(endpoint);
      const items = res.data?.items || res.data || [];
      setRequests(Array.isArray(items) ? items : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'approved':
        return <Tag color="green">已批准</Tag>;
      case 'rejected':
        return <Tag color="red">已拒绝</Tag>;
      case 'pending':
        return <Tag color="orange">待审批</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <h2>咨询量导出审批</h2>
        <p>{user?.name || user?.username}</p>
      </div>

      <div className="m-data-filter">
        <Segmented
          block
          value={tab}
          onChange={(v) => setTab(v as string)}
          options={[
            { label: '我的申请', value: 'my' },
            { label: '待审批', value: 'pending' },
          ]}
        />
      </div>

      <Spin spinning={loading}>
        {requests.length === 0 ? (
          <Empty description="暂无记录" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            {requests.map((req) => (
              <div className="m-data-card" key={req.id}>
                <div className="m-data-row">
                  <span className="m-data-label">申请人</span>
                  <span className="m-data-value" style={{ fontWeight: 600 }}>
                    {req.requester_name || '-'}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">神殿</span>
                  <span className="m-data-value">{req.campus || '-'}</span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">日期范围</span>
                  <span className="m-data-value">
                    {req.date_range || `${req.start_date || ''} ~ ${req.end_date || ''}`}
                  </span>
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">状态</span>
                  {getStatusTag(req.status)}
                </div>
                <div className="m-data-row">
                  <span className="m-data-label">申请时间</span>
                  <span className="m-data-value">
                    {req.created_at ? dayjs(req.created_at).format('MM-DD HH:mm') : '-'}
                  </span>
                </div>
                {req.reason && (
                  <div className="m-data-row">
                    <span className="m-data-label">原因</span>
                    <span className="m-data-value">{req.reason}</span>
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
