// 口碑招生提成
import React, { useEffect, useMemo, useState } from 'react';
import { App, Table, Input, InputNumber, Button, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { RewardPunishmentProps } from './index';
import { staffPerformanceRewardService } from '@/services/staffPerformanceReward';
import { buildApiUrl } from '@/utils/apiBase';

// 口碑招生提成数据类型
interface ReputationCommissionRecord {
  key: string;
  serialNumber: number;
  providerName: string;
  referralName: string;
  tuition: number;
  fullPayment: '是' | '否' | '';
  commissionRate: string; // 支持 10% / 0.1 / 10
  commissionAmount: number;
}

const DEFAULT_COMMISSION_RATE = '2%';

const TAB_REPUTATION_COMMISSION = 2; // 口碑招生提成 tab=2（数据库唯一键：神殿+年份+月份+tab）

// 初始数据
const initCommissionData: ReputationCommissionRecord[] = [
  {
    key: '1',
    serialNumber: 1,
    providerName: '',
    referralName: '',
    tuition: 0,
    fullPayment: '',
    commissionRate: '',
    commissionAmount: 0,
  },
];

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const parseRate = (val: string): number => {
  // 支持："0.1"、"10%"、"10"（按 10% 处理）
  const s = String(val ?? '').trim();
  if (!s) return 0;
  if (s.endsWith('%')) {
    const num = Number(s.slice(0, -1));
    return Number.isFinite(num) ? num / 100 : 0;
  }
  const num = Number(s);
  if (!Number.isFinite(num)) return 0;
  return num > 1 ? num / 100 : num;
};

const ReputationCommission: React.FC<RewardPunishmentProps> = ({ campus, year, month }) => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReputationCommissionRecord[]>(initCommissionData);

  const update = (key: string, field: keyof ReputationCommissionRecord, value: any) => {
    setData(prev =>
      prev.map(r => {
        if (r.key !== key) return r;
        const next: ReputationCommissionRecord = { ...r, [field]: value } as ReputationCommissionRecord;

        // 提成金额（元）= 学费（元）* 提成比例
        if (field === 'tuition' || field === 'commissionRate') {
          const tuition = Number(next.tuition) || 0;
          const rate = parseRate(next.commissionRate);
          next.commissionAmount = round2(tuition * rate);
        }

        return next;
      }),
    );
  };

  const renumberRows = (rows: ReputationCommissionRecord[]) => rows.map((r, idx) => ({ ...r, serialNumber: idx + 1 }));

  const loadFromDB = async () => {
    if (!campus || !year || !month) return;
    setLoading(true);
    try {
      const res = await staffPerformanceRewardService.list({ campus, year, month, tab: TAB_REPUTATION_COMMISSION });
      const record = res?.[0];
      const raw = (record as any)?.数据;
      const parsed = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : raw;

      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized = renumberRows(
          parsed.map((r: any, idx: number) => {
            const tuition = Number(r.tuition) || 0;
            const commissionRate = String(r.commissionRate ?? '');
            const rate = parseRate(commissionRate);
            return {
              key: r.key || `${idx + 1}`,
              serialNumber: Number(r.serialNumber ?? idx + 1),
              providerName: r.providerName || '',
              referralName: r.referralName || '',
              tuition,
              fullPayment: r.fullPayment || '',
              commissionRate,
              commissionAmount: round2(tuition * rate),
            } as ReputationCommissionRecord;
          }),
        );
        setData(normalized);
      } else {
        setData(initCommissionData);
      }
    } catch (e: any) {
      console.error(e);
      message.error(e?.message || '读取失败');
    } finally {
      setLoading(false);
    }
  };

  const saveToDB = async () => {
    if (!campus || !year || !month) {
      message.warning('缺少神殿/年月信息，无法保存');
      return;
    }
    setLoading(true);
    try {
      await staffPerformanceRewardService.upsert({
        神殿: campus,
        年份: year,
        月份: month,
        tab: TAB_REPUTATION_COMMISSION,
        数据: data as any,
      });
      message.success('保存成功');
      await loadFromDB();
    } catch (e: any) {
      console.error(e);
      message.error(e?.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 自动汇总：从“口碑报名明细”导入数据
  const autoImport = async () => {
    if (!campus || !year || !month) {
      message.warning('缺少神殿/年月信息，无法汇总');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        buildApiUrl(
          `/reputation-registration?campus=${encodeURIComponent(campus)}&year=${year}&month=${month}`,
        ),
      );
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      const list: any[] = json?.行列表 || [];

      const rows: ReputationCommissionRecord[] = list
        // 只导入“是否报名=是”的记录（避免把纯口碑量也导入）
        // 不再强依赖“是否报名”字段（后端当前返回字段为中文且不含“是否报名”），直接按行列表导入
        .map((r: any, idx: number) => {
          const actualTuition = r?.actualTuition ?? r?.实交学费;
          const receivableTuition = r?.receivableTuition ?? r?.应收学费;

          const tuition = Number(actualTuition) || 0;
          const receivable = Number(receivableTuition) || 0;
          const fullPayment = receivable > 0 && tuition >= receivable ? '是' : '否';

          return {
            key: `${Date.now()}_${idx}`,
            serialNumber: idx + 1,
            providerName: r?.instructorName || r?.教员姓名 || '',
            referralName: r?.reputationName || r?.报名者姓名 || '',
            tuition,
            fullPayment,
            commissionRate: DEFAULT_COMMISSION_RATE, // 默认2%
            commissionAmount: round2(tuition * parseRate(DEFAULT_COMMISSION_RATE)),
          };
        });

      setData(rows.length > 0 ? rows : initCommissionData);
      message.success('已自动汇总导入');
    } catch (e: any) {
      console.error(e);
      message.error(e?.message || '自动汇总失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!campus || !year || !month) return;
    loadFromDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campus, year, month]);

  const columns: ColumnsType<ReputationCommissionRecord> = useMemo(
    () => [
      { title: '序号', dataIndex: 'serialNumber', align: 'center', width: 80 },
      {
        title: '提供者姓名',
        dataIndex: 'providerName',
        align: 'center',
        width: 150,
        render: (_v, r) => <Input value={r.providerName} onChange={(e) => update(r.key, 'providerName', e.target.value)} />,
      },
      {
        title: '口碑姓名',
        dataIndex: 'referralName',
        align: 'center',
        width: 150,
        render: (_v, r) => <Input value={r.referralName} onChange={(e) => update(r.key, 'referralName', e.target.value)} />,
      },
      {
        title: '学费（元）',
        dataIndex: 'tuition',
        align: 'center',
        width: 150,
        render: (_v, r) => (
          <InputNumber
            style={{ width: '100%' }}
            value={typeof r.tuition === 'number' ? r.tuition : Number(r.tuition) || 0}
            onChange={(val) => update(r.key, 'tuition', Number(val || 0))}
          />
        ),
      },
      {
        title: '是否回全款',
        dataIndex: 'fullPayment',
        align: 'center',
        width: 120,
        render: (_v, r) => <Input value={r.fullPayment} disabled />,
      },
      {
        title: '提成比例',
        dataIndex: 'commissionRate',
        align: 'center',
        width: 120,
        render: (_v, r) => <Input value={r.commissionRate} onChange={(e) => update(r.key, 'commissionRate', e.target.value)} placeholder="如：10% 或 0.1" />,
      },
      {
        title: '提成金额（元）',
        dataIndex: 'commissionAmount',
        align: 'center',
        width: 150,
        render: (_v, r) => <InputNumber style={{ width: '100%' }} value={Number(r.commissionAmount) || 0} disabled />,
      },
    ],
    [data],
  );

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            backgroundColor: '#FFA500',
            padding: '10px 16px',
            fontWeight: 'bold',
            fontSize: '14px',
            borderRadius: '4px 4px 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span>口碑招生提成</span>
          <Space>
            <Button loading={loading} onClick={autoImport}>
              自动汇总
            </Button>
            <Button type="primary" loading={loading} onClick={saveToDB}>
              保存
            </Button>
            <Button loading={loading} onClick={loadFromDB}>
              刷新
            </Button>
          </Space>
        </div>
        <Table<ReputationCommissionRecord>
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={false}
          bordered
          size="small"
          style={{ marginTop: 0 }}
          rowKey="key"
          scroll={{ x: 'max-content' }}
        />
      </div>
    </div>
  );
};

export default ReputationCommission;
