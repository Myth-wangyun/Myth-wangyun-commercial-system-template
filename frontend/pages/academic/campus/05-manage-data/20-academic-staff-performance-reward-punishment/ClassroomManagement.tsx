// 课堂管理考核
import React, { useEffect, useMemo, useState } from 'react';
import { App, Table, Input, InputNumber, Select, Space, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { RewardPunishmentProps } from './index';
import { staffPerformanceRewardService } from '@/services/staffPerformanceReward';
import { getViolation } from '@/services/teacherViolation';

// 课堂管理考核数据类型
interface ClassroomManagementRecord {
  key: string;
  serialNumber: number;
  teacherName: string;
  violationCount: number | string;
  rewardReason: string;
  rewardAmount: number | string;
}

// 初始数据
const initData: ClassroomManagementRecord[] = [
  { key: '1', serialNumber: 1, teacherName: '', violationCount: '', rewardReason: '', rewardAmount: '' },
];

const TAB_CLASSROOM_MANAGEMENT = 5;

const ClassroomManagement: React.FC<RewardPunishmentProps> = ({ campus, teacherList, year, month }) => {
  const { message } = App.useApp()
  const [data, setData] = useState<ClassroomManagementRecord[]>(initData);
  const [loading, setLoading] = useState(false);

  const update = (key: string, field: keyof ClassroomManagementRecord, value: any) => {
    setData(prev => prev.map(r => (r.key === key ? ({ ...r, [field]: value } as ClassroomManagementRecord) : r)));
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

  const buildFromViolation = async (): Promise<ClassroomManagementRecord[]> => {
    if (!campus || !year || !month) return initData;

    const res = await getViolation(campus, year);
    const mKey = `m${month}`;
    const rows: any[] = res?.行数据 || [];

    const mapped = rows
      .filter(r => (r?.姓名 || '').trim())
      .map((r, idx) => {
        const v = r?.[mKey];
        return {
          key: `${r.姓名}_${idx}`,
          serialNumber: Number(r.序号 ?? idx + 1),
          teacherName: r.姓名 || '',
          violationCount: typeof v === 'number' ? v : (Number(v) || ''),
          rewardReason: '',
          rewardAmount: '',
        } as ClassroomManagementRecord;
      })
      .sort((a, b) => a.serialNumber - b.serialNumber);

    return mapped.length ? mapped : initData;
  };

  const loadFromDB = async () => {
    if (!campus || !year || !month) return;
    setLoading(true);
    try {
      const list = await staffPerformanceRewardService.list({ campus, year, month, tab: TAB_CLASSROOM_MANAGEMENT });
      if (list && list.length && Array.isArray(list[0].数据)) {
        const normalized = (list[0].数据 as any[]).map((r: any, idx: number) => ({
          key: r.key || `${idx + 1}`,
          serialNumber: Number(r.serialNumber ?? idx + 1),
          teacherName: r.teacherName || '',
          violationCount: typeof r.violationCount === 'number' ? r.violationCount : (Number(r.violationCount) || ''),
          rewardReason: r.rewardReason || '',
          rewardAmount: typeof r.rewardAmount === 'number' ? r.rewardAmount : (Number(r.rewardAmount) || ''),
        })) as ClassroomManagementRecord[];
        setData(normalized.length ? normalized : initData);
      } else {
        // DB 无数据：从“教员功能分析总表-学员违纪”导入
        const gen = await buildFromViolation();
        setData(gen);
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
        tab: TAB_CLASSROOM_MANAGEMENT,
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

  const refreshFromViolation = async () => {
    if (!campus || !year || !month) {
      message.warning('缺少神殿/年月信息，无法刷新');
      return;
    }
    setLoading(true);
    try {
      const gen = await buildFromViolation();
      setData(gen);
      message.success('已从学员违纪分表刷新');
    } catch (e: any) {
      console.error(e);
      message.error(e?.message || '刷新失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFromDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campus, year, month]);

  // 当切换月份时，如果当前没有保存过的数据，自动从违纪分表回填对应月份
  useEffect(() => {
    if (!campus || !year || !month) return;
    const hasAny = (data || []).some(r => r.teacherName || typeof r.violationCount === 'number' || String(r.violationCount || '').trim());
    if (hasAny) return;
    refreshFromViolation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campus, year, month]);

  const columns: ColumnsType<ClassroomManagementRecord> = [
    { title: '序号', dataIndex: 'serialNumber', align: 'center', width: 100 },
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
    {
      title: '学员违纪数量（人）',
      dataIndex: 'violationCount',
      align: 'center',
      width: 180,
      render: (_v, r) => (
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          precision={0}
          value={typeof r.violationCount === 'number' ? r.violationCount : undefined}
          onChange={(val) => update(r.key, 'violationCount', typeof val === 'number' ? val : '')}
        />
      ),
    },
    { title: '奖惩原因', dataIndex: 'rewardReason', align: 'center', width: 150, render: (_v, r) => <Input value={r.rewardReason} onChange={(e) => update(r.key, 'rewardReason', e.target.value)} /> },
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
          <span>课堂管理考核</span>
          <Space>
            <Button onClick={refreshFromViolation} loading={loading}>刷新</Button>
            <Button type="primary" onClick={saveToDB} loading={loading}>保存</Button>
          </Space>
        </div>
        <Table<ClassroomManagementRecord>
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

export default ClassroomManagement;
