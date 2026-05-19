// 协助咨询转化奖励
import React, { useEffect, useMemo, useState } from 'react';
import { App, Table, Input, InputNumber, Select, Space, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { RewardPunishmentProps } from './index';
import { staffPerformanceRewardService } from '@/services/staffPerformanceReward';

// 协助咨询转化奖励数据类型
interface ConsultingSupportRecord {
  key: string;
  serialNumber: number;
  teacherName: string;
  consultantName: string;
  consultingPersonName: string;
  enrolled: string;
  rewardAmount: number | string;
}

// 初始数据
const initData: ConsultingSupportRecord[] = [
  { key: '1', serialNumber: 1, teacherName: '', consultantName: '', consultingPersonName: '', enrolled: '', rewardAmount: '' },
];

const TAB_CONSULTING_SUPPORT = 7;

const ConsultingSupport: React.FC<RewardPunishmentProps> = ({ campus, teacherList, year, month }) => {
  const { message } = App.useApp()
  const [data, setData] = useState<ConsultingSupportRecord[]>(initData);
  const [loading, setLoading] = useState(false);

  const update = (key: string, field: keyof ConsultingSupportRecord, value: any) => {
    setData(prev => prev.map(r => (r.key === key ? ({ ...r, [field]: value } as ConsultingSupportRecord) : r)));
  };

  const addRow = () => {
    setData(prev => {
      const nextIndex = prev.length + 1;
      return [
        ...prev,
        {
          key: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
          serialNumber: nextIndex,
          teacherName: '',
          consultantName: '',
          consultingPersonName: '',
          enrolled: '',
          rewardAmount: '',
        },
      ];
    });
  };

  // 教员下拉选项
  const teacherOptions = useMemo(
    () =>
      teacherList.map(t => ({
        value: t.name,
        label: t.name,
      })),
    [teacherList],
  );

  const loadFromDB = async () => {
    if (!campus || !year || !month) return;
    setLoading(true);
    try {
      const list = await staffPerformanceRewardService.list({ campus, year, month, tab: TAB_CONSULTING_SUPPORT });
      if (list && list.length && Array.isArray(list[0].数据)) {
        const normalized = (list[0].数据 as any[]).map((r: any, idx: number) => ({
          key: r.key || `${idx + 1}`,
          serialNumber: Number(r.serialNumber ?? idx + 1),
          teacherName: r.teacherName || '',
          consultantName: r.consultantName || '',
          consultingPersonName: r.consultingPersonName || '',
          enrolled: r.enrolled || '',
          rewardAmount: typeof r.rewardAmount === 'number' ? r.rewardAmount : (Number(r.rewardAmount) || ''),
        })) as ConsultingSupportRecord[];
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
      // 重新编号，保证序号连续
      const payloadRows = (data || []).map((r, idx) => ({ ...r, serialNumber: idx + 1 }));
      await staffPerformanceRewardService.upsert({
        神殿: campus,
        年份: year,
        月份: month,
        tab: TAB_CONSULTING_SUPPORT,
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

  const columns: ColumnsType<ConsultingSupportRecord> = [
    { title: '序号', dataIndex: 'serialNumber', align: 'center', width: 80 },
    {
      title: '教员姓名',
      dataIndex: 'teacherName',
      align: 'center',
      width: 150,
      render: (_v, r) => (
        <Select
          value={r.teacherName || undefined}
          onChange={(val) => update(r.key, 'teacherName', val)}
          style={{ width: '100%' }}
          placeholder="选择教员"
          allowClear
          showSearch
          optionFilterProp="label"
          options={teacherOptions}
        />
      ),
    },
    { title: '咨询师姓名', dataIndex: 'consultantName', align: 'center', width: 120, render: (_v, r) => <Input value={r.consultantName} onChange={(e) => update(r.key, 'consultantName', e.target.value)} /> },
    { title: '咨询者姓名', dataIndex: 'consultingPersonName', align: 'center', width: 120, render: (_v, r) => <Input value={r.consultingPersonName} onChange={(e) => update(r.key, 'consultingPersonName', e.target.value)} /> },
    { title: '是否报名', dataIndex: 'enrolled', align: 'center', width: 120, render: (_v, r) => <Input value={r.enrolled} onChange={(e) => update(r.key, 'enrolled', e.target.value)} placeholder="是/否" /> },
    {
      title: '奖惩金额（元）',
      dataIndex: 'rewardAmount',
      align: 'center',
      width: 150,
      render: (_v, r) => (
        <InputNumber
          style={{ width: '100%' }}
          value={typeof r.rewardAmount === 'number' ? r.rewardAmount : undefined}
          onChange={(val) => update(r.key, 'rewardAmount', typeof val === 'number' ? val : '')}
        />
      ),
    },
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
          <span>协助咨询转化奖励</span>
          <Space>
            <Button onClick={addRow} disabled={loading}>新增</Button>
            <Button onClick={refresh} loading={loading}>刷新</Button>
            <Button type="primary" onClick={saveToDB} loading={loading}>保存</Button>
          </Space>
        </div>
        <Table<ConsultingSupportRecord>
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

export default ConsultingSupport;
