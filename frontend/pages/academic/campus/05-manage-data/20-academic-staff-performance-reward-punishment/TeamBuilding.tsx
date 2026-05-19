// 团队建设奖励
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { App, Table, Input, InputNumber, Space, Button, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { RewardPunishmentProps } from './index';
import { staffPerformanceRewardService } from '@/services/staffPerformanceReward';

// 团队建设奖励数据类型
interface TeamBuildingRecord {
  key: string;
  serialNumber: number;
  referrerName: string;
  newEmployeeName: string;
  joinDate: string;
  referrerReward: number | string;
  trainerName: string;
  trialPeriod: string;
  trainerReward: number | string;
}

// 初始数据
const initData: TeamBuildingRecord[] = [
  { key: '1', serialNumber: 1, referrerName: '', newEmployeeName: '', joinDate: '', referrerReward: 300, trainerName: '', trialPeriod: '', trainerReward: 200 },
];

const TAB_TEAM_BUILDING = 8;

const TeamBuilding: React.FC<RewardPunishmentProps> = ({ campus, year, month }) => {
  const { message } = App.useApp()
  const [data, setData] = useState<TeamBuildingRecord[]>(initData);
  const [loading, setLoading] = useState(false);

  const update = (key: string, field: keyof TeamBuildingRecord, value: any) => {
    setData(prev => prev.map(r => (r.key === key ? ({ ...r, [field]: value } as TeamBuildingRecord) : r)));
  };

  const addRow = () => {
    setData(prev => {
      const nextIndex = prev.length + 1;
      return [
        ...prev,
        {
          key: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
          serialNumber: nextIndex,
          referrerName: '',
          newEmployeeName: '',
          joinDate: '',
          referrerReward: '',
          trainerName: '',
          trialPeriod: '',
          trainerReward: '',
        },
      ];
    });
  };

  const loadFromDB = async () => {
    if (!campus || !year || !month) return;
    setLoading(true);
    try {
      const list = await staffPerformanceRewardService.list({ campus, year, month, tab: TAB_TEAM_BUILDING });
      if (list && list.length && Array.isArray(list[0].数据)) {
        const normalized = (list[0].数据 as any[]).map((r: any, idx: number) => ({
          key: r.key || `${idx + 1}`,
          serialNumber: Number(r.serialNumber ?? idx + 1),
          referrerName: r.referrerName || '',
          newEmployeeName: r.newEmployeeName || '',
          joinDate: r.joinDate || '',
          referrerReward: typeof r.referrerReward === 'number' ? r.referrerReward : (Number(r.referrerReward) || ''),
          trainerName: r.trainerName || '',
          trialPeriod: r.trialPeriod || '',
          trainerReward: typeof r.trainerReward === 'number' ? r.trainerReward : (Number(r.trainerReward) || ''),
        })) as TeamBuildingRecord[];
        setData(normalized.length ? normalized : initData);
      } else {
        setData(initData);
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
      const payloadRows = (data || []).map((r, idx) => ({ ...r, serialNumber: idx + 1 }));
      await staffPerformanceRewardService.upsert({
        神殿: campus,
        年份: year,
        月份: month,
        tab: TAB_TEAM_BUILDING,
        数据: payloadRows as any,
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

  const refresh = async () => {
    await loadFromDB();
  };

  useEffect(() => {
    loadFromDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campus, year, month]);

  const columns: ColumnsType<TeamBuildingRecord> = [
    { title: '序号', dataIndex: 'serialNumber', align: 'center', width: 80 },
    { title: '介绍者姓名', dataIndex: 'referrerName', align: 'center', width: 120, render: (_v, r) => <Input value={r.referrerName} onChange={(e) => update(r.key, 'referrerName', e.target.value)} /> },
    { title: '入职者姓名', dataIndex: 'newEmployeeName', align: 'center', width: 120, render: (_v, r) => <Input value={r.newEmployeeName} onChange={(e) => update(r.key, 'newEmployeeName', e.target.value)} /> },
    {
      title: '入职时间',
      dataIndex: 'joinDate',
      align: 'center',
      width: 140,
      render: (_v, r) => (
        <DatePicker
          style={{ width: '100%' }}
          value={r.joinDate ? dayjs(r.joinDate) : null}
          onChange={(d) => update(r.key, 'joinDate', d ? (d as any).format('YYYY-MM-DD') : '')}
          format="YYYY-MM-DD"
          placeholder="选择日期"
        />
      ),
    },
    { title: '奖励介绍者（元）', dataIndex: 'referrerReward', align: 'center', width: 150, render: (_v, r) => <InputNumber style={{ width: '100%' }} value={typeof r.referrerReward === 'number' ? r.referrerReward : undefined} onChange={(val) => update(r.key, 'referrerReward', typeof val === 'number' ? val : '')} /> },
    { title: '培训者姓名', dataIndex: 'trainerName', align: 'center', width: 120, render: (_v, r) => <Input value={r.trainerName} onChange={(e) => update(r.key, 'trainerName', e.target.value)} /> },
    { title: '入职者试用期', dataIndex: 'trialPeriod', align: 'center', width: 130, render: (_v, r) => <Input value={r.trialPeriod} onChange={(e) => update(r.key, 'trialPeriod', e.target.value)} /> },
    { title: '奖励培训者（元）', dataIndex: 'trainerReward', align: 'center', width: 150, render: (_v, r) => <InputNumber style={{ width: '100%' }} value={typeof r.trainerReward === 'number' ? r.trainerReward : undefined} onChange={(val) => update(r.key, 'trainerReward', typeof val === 'number' ? val : '')} /> },
  ];

  return (
    <div style={{ padding: '0 16px' }}>
      <div>
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
          <span>团队建设奖励</span>
          <Space>
            <Button onClick={addRow} disabled={loading}>新增</Button>
            <Button onClick={refresh} loading={loading}>刷新</Button>
            <Button type="primary" onClick={saveToDB} loading={loading}>保存</Button>
          </Space>
        </div>
        <Table<TeamBuildingRecord>
          columns={columns}
          dataSource={data}
          pagination={false}
          bordered
          size="small"
          style={{ marginTop: 0 }}
          rowKey="key"
          loading={loading}
        />
      </div>
    </div>
  );
};

export default TeamBuilding;
