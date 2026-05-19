import React, { useState, useEffect } from 'react';
import { Spin, Empty, Segmented } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';
import api from '@/services/api';
import dayjs from 'dayjs';
import '../shared/MobileDataPage.css';

/** 市场数据通用页面 */
function MarketGenericPage({ title, endpoint }: { title: string; endpoint: string }) {
  const { user } = useAuthStore();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [year, setYear] = useState(dayjs().year());

  const campusName = currentCampus || user?.campus || '';

  useEffect(() => {
    if (!campusName) return;
    loadData();
  }, [campusName, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/market/${endpoint}`, {
        params: { campus: campusName, year },
      });
      const items = res.data?.items || res.data?.data || [];
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

      <Spin spinning={loading}>
        {data.length === 0 ? (
          <Empty description="暂无数据" />
        ) : (
          <div style={{ padding: '0 12px' }}>
            {data.map((item: any, i: number) => {
              const entries = Object.entries(item).filter(
                ([k]) => !['id', 'campus', 'year', 'created_at', 'updated_at'].includes(k),
              );
              return (
                <div className="m-data-card" key={i}>
                  {entries.slice(0, 6).map(([key, val]) => (
                    <div className="m-data-row" key={key}>
                      <span className="m-data-label">{key}</span>
                      <span className="m-data-value">{String(val ?? '-')}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </Spin>
    </div>
  );
}

// 市场部网络推广相关页面
export function MobileMarketNewMediaSummary() {
  return <MarketGenericPage title="新媒体数据汇总" endpoint="new-media-summary" />;
}

export function MobileMarketNewMediaPlatformDetail() {
  return <MarketGenericPage title="新媒体分平台明细" endpoint="new-media-platform-detail" />;
}

export function MobileMarketNetworkSummary() {
  return <MarketGenericPage title="网络推广数据汇总" endpoint="network-promotion-summary" />;
}

export function MobileMarketNetworkPartnerMonthly() {
  return <MarketGenericPage title="线上合伙人月度数据" endpoint="online-partner-monthly" />;
}

export function MobileMarketNetworkPartnerAnnual() {
  return <MarketGenericPage title="线上合伙人年度汇总" endpoint="online-partner-annual" />;
}

export function MobileMarketChannelExpense() {
  return <MarketGenericPage title="渠道费用表" endpoint="channel-agent-expense" />;
}

export function MobileMarketChannelConsultant() {
  return <MarketGenericPage title="渠道咨询师结算" endpoint="channel-consultant-settlement" />;
}

export function MobileMarketSemPlan() {
  return <MarketGenericPage title="SEM投放计划" endpoint="sem-plan" />;
}

export function MobileMarketSemMonthly() {
  return <MarketGenericPage title="SEM月度汇总" endpoint="sem-monthly-summary" />;
}

export function MobileMarketSemAnnual() {
  return <MarketGenericPage title="SEM年度数据" endpoint="sem-annual" />;
}

export function MobileMarketTrainingSummary() {
  return <MarketGenericPage title="市场部培训记录" endpoint="training-summary" />;
}

export function MobileMarketMeetingRecord() {
  return <MarketGenericPage title="市场部会议记录" endpoint="meeting-record" />;
}

export function MobileMarketCoreSummary() {
  return <MarketGenericPage title="市场部核心数据汇总" endpoint="core-data-summary" />;
}

export default MobileMarketNewMediaSummary;
