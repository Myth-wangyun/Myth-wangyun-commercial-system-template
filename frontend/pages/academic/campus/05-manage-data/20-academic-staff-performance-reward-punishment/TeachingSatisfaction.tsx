// 教学满意度考核
import React, { useEffect, useMemo, useState } from 'react';
import { App, Table, InputNumber, Input, Select, Space, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { RewardPunishmentProps } from './index';
import { studentSatisfactionDetailService } from '@/services/service';
import { staffPerformanceRewardService } from '@/services/staffPerformanceReward';

// 教学满意度考核数据类型
interface TeachingSatisfactionRecord {
  key: string;
  serialNumber: number;
  teacherName: string;
  satisfaction1: number | string;
  satisfaction2: number | string;
  averageSatisfaction: number | string;
  rewardReason: string;
  rewardAmount: number | string;
}

// 初始数据
const initData: TeachingSatisfactionRecord[] = [
  { key: '1', serialNumber: 1, teacherName: '', satisfaction1: '', satisfaction2: '', averageSatisfaction: '', rewardReason: '', rewardAmount: '' },
];

const TAB_TEACHING_SATISFACTION = 3;

const calcAverage = (a?: number, b?: number) => {
  const vals = [a, b].filter((v): v is number => typeof v === 'number');
  if (!vals.length) return '';
  const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
  return Math.round(avg * 10) / 10;
};

const TeachingSatisfaction: React.FC<RewardPunishmentProps> = ({ campus, classList, teacherList, year, month }) => {
  const { message } = App.useApp()
  const [data, setData] = useState<TeachingSatisfactionRecord[]>(initData);
  const [loading, setLoading] = useState(false);

  const update = (key: string, field: keyof TeachingSatisfactionRecord, value: any) => {
    setData(prev => prev.map(r => {
      if (r.key !== key) return r;
      const next: TeachingSatisfactionRecord = { ...r, [field]: value } as TeachingSatisfactionRecord;
      // 若修改了分数，自动计算平均值
      if (field === 'satisfaction1' || field === 'satisfaction2') {
        const s1 = typeof next.satisfaction1 === 'number' ? next.satisfaction1 : undefined;
        const s2 = typeof next.satisfaction2 === 'number' ? next.satisfaction2 : undefined;
        next.averageSatisfaction = calcAverage(s1, s2);
      }
      return next;
    }));
  };

  // 教员下拉选项
  const teacherOptions = useMemo(() => teacherList.map(t => ({
    value: t.name,
    label: t.name,
  })), [teacherList]);

  // 从“学员满意度得分表（详情）”汇总到当前表
  // 约定：满意度1/满意度2 表示“同一教员的不同班级”的满意度（而不是不同月份）
  // 规则：对每个教员，取其名下所有班级在【当月】的总分，按分数从高到低排序：
  //   - satisfaction1 = 第 1 个班级的总分
  //   - satisfaction2 = 第 2 个班级的总分（若只有 1 个班级则为空）
  const buildFromStudentSatisfaction = async (): Promise<TeachingSatisfactionRecord[]> => {
    const campusName = campus;
    const targetYear = year;

    const list = await studentSatisfactionDetailService.getList(campusName, undefined, undefined, targetYear);

    // 学员满意度得分：取“学员满意度表”【总分行】的【平均分列】
    // 即：先算每一行 12 个月的平均分，再把这些“行平均分”求和
    const calcOverallFromRows = (rows: any[]): number | undefined => {
      if (!Array.isArray(rows) || !rows.length) return undefined;

      const rowAvg = (r: any): number | undefined => {
        const vals: number[] = [];
        for (let i = 1; i <= 12; i += 1) {
          const v = r?.[`m${i}`];
          if (typeof v === 'number') vals.push(v);
        }
        if (!vals.length) return undefined;
        const s = vals.reduce((a, b) => a + b, 0);
        return Math.round((s / vals.length) * 10) / 10;
      };

      const avgs = rows.map(rowAvg).filter((v: any) => typeof v === 'number') as number[];
      if (!avgs.length) return undefined;
      const overall = avgs.reduce((a, b) => a + b, 0);
      return Math.round(overall * 10) / 10;
    };

    // teacherName -> 班级得分列表
    const byTeacher = new Map<string, number[]>();

    list.forEach(rec => {
      const tName = (rec as any)?.teacherName;
      if (!tName) return;
      const rows = (rec as any)?.rows || [];
      const score = calcOverallFromRows(rows);
      if (typeof score !== 'number') return;

      const arr = byTeacher.get(tName) || [];
      arr.push(score);
      byTeacher.set(tName, arr);
    });

    const teachers = Array.from(byTeacher.entries())
      .sort((a, b) => a[0].localeCompare(b[0], 'zh-Hans-CN'))
      .map(([teacherName, scores], idx) => {
        const sorted = (scores || []).slice().sort((a, b) => b - a);
        const s1 = sorted[0];
        const s2 = sorted[1];
        return {
          key: `${teacherName}_${idx}`,
          serialNumber: idx + 1,
          teacherName,
          satisfaction1: typeof s1 === 'number' ? s1 : '',
          satisfaction2: typeof s2 === 'number' ? s2 : '',
          averageSatisfaction: calcAverage(s1, s2),
          rewardReason: '',
          rewardAmount: '',
        } as TeachingSatisfactionRecord;
      });

    return teachers.length ? teachers : initData;
  };

  const loadFromDB = async () => {
    if (!campus || !year || !month) return;
    setLoading(true);
    try {
      const list = await staffPerformanceRewardService.list({ campus, year, month, tab: TAB_TEACHING_SATISFACTION });
      if (list && list.length && Array.isArray(list[0].数据)) {
        const normalized = (list[0].数据 as any[]).map((r: any, idx: number) => ({
          key: r.key || `${idx + 1}`,
          serialNumber: Number(r.serialNumber ?? idx + 1),
          teacherName: r.teacherName || '',
          satisfaction1: typeof r.satisfaction1 === 'number' ? r.satisfaction1 : (Number(r.satisfaction1) || ''),
          satisfaction2: typeof r.satisfaction2 === 'number' ? r.satisfaction2 : (Number(r.satisfaction2) || ''),
          averageSatisfaction: typeof r.averageSatisfaction === 'number' ? r.averageSatisfaction : (Number(r.averageSatisfaction) || calcAverage(Number(r.satisfaction1), Number(r.satisfaction2))),
          rewardReason: r.rewardReason || '',
          rewardAmount: typeof r.rewardAmount === 'number' ? r.rewardAmount : (Number(r.rewardAmount) || ''),
        })) as TeachingSatisfactionRecord[];
        setData(normalized.length ? normalized : initData);
      } else {
        // DB 无数据：尝试从学员满意度得分表自动生成
        const gen = await buildFromStudentSatisfaction();
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
        tab: TAB_TEACHING_SATISFACTION,
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

  useEffect(() => {
    loadFromDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campus, year, month]);

  const columns: ColumnsType<TeachingSatisfactionRecord> = [
    { title: '序号', dataIndex: 'serialNumber', align: 'center', width: 80 },
    { title: '教员姓名', dataIndex: 'teacherName', align: 'center', width: 150, render: (_v, r) => (
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
    ) },
    { title: '满意度得分1', dataIndex: 'satisfaction1', align: 'center', width: 130, render: (_v, r) => <InputNumber style={{ width: '100%' }} value={typeof r.satisfaction1 === 'number' ? r.satisfaction1 : undefined} onChange={(val)=> update(r.key, 'satisfaction1', typeof val === 'number' ? val : '')} /> },
    { title: '满意度得分2', dataIndex: 'satisfaction2', align: 'center', width: 130, render: (_v, r) => <InputNumber style={{ width: '100%' }} value={typeof r.satisfaction2 === 'number' ? r.satisfaction2 : undefined} onChange={(val)=> update(r.key, 'satisfaction2', typeof val === 'number' ? val : '')} /> },
    { title: '平均满意度', dataIndex: 'averageSatisfaction', align: 'center', width: 120, render: (_v, r) => <InputNumber style={{ width: '100%' }} value={typeof r.averageSatisfaction === 'number' ? r.averageSatisfaction : undefined} onChange={(val)=> update(r.key, 'averageSatisfaction', typeof val === 'number' ? val : '')} /> },
    { title: '奖惩原因', dataIndex: 'rewardReason', align: 'center', width: 150, render: (_v, r) => <Input value={r.rewardReason} onChange={(e)=> update(r.key, 'rewardReason', e.target.value)} /> },
    { title: '奖惩金额（元）', dataIndex: 'rewardAmount', align: 'center', width: 150, render: (_v, r) => <InputNumber style={{ width: '100%' }} value={typeof r.rewardAmount === 'number' ? r.rewardAmount : undefined} onChange={(val)=> update(r.key, 'rewardAmount', typeof val === 'number' ? val : '')} /> },
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
          <span>教学满意度考核</span>
          <Space>
            <Button onClick={loadFromDB} loading={loading}>刷新</Button>
            <Button type="primary" onClick={saveToDB} loading={loading}>保存</Button>
          </Space>
        </div>
        <Table<TeachingSatisfactionRecord>
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

export default TeachingSatisfaction;
