// 教学质量考核
import React, { useEffect, useMemo, useState } from 'react';
import { App, Table, Input, InputNumber, Select, Space, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { RewardPunishmentProps } from './index';
import { classExamScoreService } from '@/services/service';
import { staffPerformanceRewardService } from '@/services/staffPerformanceReward';

// 教学质量考核数据类型
interface TeachingQualityRecord {
  key: string;
  serialNumber: number;
  teacherName: string;
  passRate1: string | number;
  passRate2: string | number;
  averagePassRate: string | number;
  rewardReason: string;
  rewardAmount: number | string;
}

// 初始数据
const initData: TeachingQualityRecord[] = [
  { key: '1', serialNumber: 1, teacherName: '', passRate1: '', passRate2: '', averagePassRate: '', rewardReason: '', rewardAmount: '' },
];

const TAB_TEACHING_QUALITY = 4;

const calcAverage = (a?: number, b?: number) => {
  const vals = [a, b].filter((v): v is number => typeof v === 'number');
  if (!vals.length) return '';
  const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
  return Math.round(avg * 100) / 100;
};

const toNumberOrUndef = (v: any) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const TeachingQuality: React.FC<RewardPunishmentProps> = ({ campus, classList, teacherList, year, month }) => {
  const { message } = App.useApp()
  const [data, setData] = useState<TeachingQualityRecord[]>(initData);
  const [loading, setLoading] = useState(false);

  const update = (key: string, field: keyof TeachingQualityRecord, value: any) => {
    setData(prev =>
      prev.map(r => {
        if (r.key !== key) return r;
        const next: TeachingQualityRecord = { ...r, [field]: value } as TeachingQualityRecord;
        if (field === 'passRate1' || field === 'passRate2') {
          const p1 = toNumberOrUndef(next.passRate1);
          const p2 = toNumberOrUndef(next.passRate2);
          next.averagePassRate = calcAverage(p1, p2);
        }
        return next;
      }),
    );
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

  // 从“班考试成绩表”汇总导入：同一教员下，不同班级的合格率（取前两名）
  // 合格率口径：用 A（passCount / classSize）
  const buildFromClassExamScores = async (): Promise<TeachingQualityRecord[]> => {
    if (!campus) return initData;

    const classNames = (classList || [])
      .map((c: any) => c?.class_name || c?.className || c?.name || c?.class_code)
      .filter(Boolean) as string[];

    if (!classNames.length) {
      message.warning('当前神殿没有可用的班级列表，无法从班考试成绩表汇总');
      return initData;
    }

    // teacherName -> 合格率列表（按班级）
    const byTeacher = new Map<string, number[]>();

    // 串行请求，避免一次性并发过高
    for (const className of classNames) {
      try {
        const res = await classExamScoreService.getList({}, campus, className);
        const rec: any = res?.list?.[0];
        if (!rec) continue;

        const teacherName = rec?.instructorName || rec?.instructor_name || rec?.teacherName || rec?.teacher_name;
        const classSize = Number(rec?.classSize ?? rec?.class_size);
        const passCount = Number(rec?.passCount ?? rec?.pass_count);
        if (!teacherName || !Number.isFinite(classSize) || classSize <= 0 || !Number.isFinite(passCount)) continue;

        const rate = Math.round((passCount / classSize) * 10000) / 100; // 保留 2 位小数
        const arr = byTeacher.get(teacherName) || [];
        arr.push(rate);
        byTeacher.set(teacherName, arr);
      } catch (e) {
        // 单个班级失败不影响整体
        console.warn('读取班考试成绩失败', className, e);
      }
    }

    const teachers = Array.from(byTeacher.entries())
      .sort((a, b) => a[0].localeCompare(b[0], 'zh-Hans-CN'))
      .map(([teacherName, rates], idx) => {
        const sorted = (rates || []).slice().sort((a, b) => b - a);
        const r1 = sorted[0];
        const r2 = sorted[1];
        return {
          key: `${teacherName}_${idx}`,
          serialNumber: idx + 1,
          teacherName,
          passRate1: typeof r1 === 'number' ? r1 : '',
          passRate2: typeof r2 === 'number' ? r2 : '',
          averagePassRate: calcAverage(r1, r2),
          rewardReason: '',
          rewardAmount: '',
        } as TeachingQualityRecord;
      });

    return teachers.length ? teachers : initData;
  };

  const loadFromDB = async () => {
    if (!campus || !year || !month) return;
    setLoading(true);
    try {
      const list = await staffPerformanceRewardService.list({ campus, year, month, tab: TAB_TEACHING_QUALITY });
      if (list && list.length && Array.isArray(list[0].数据)) {
        const normalized = (list[0].数据 as any[]).map((r: any, idx: number) => {
          const p1 = toNumberOrUndef(r.passRate1);
          const p2 = toNumberOrUndef(r.passRate2);
          return {
            key: r.key || `${idx + 1}`,
            serialNumber: Number(r.serialNumber ?? idx + 1),
            teacherName: r.teacherName || '',
            passRate1: typeof p1 === 'number' ? p1 : '',
            passRate2: typeof p2 === 'number' ? p2 : '',
            averagePassRate: toNumberOrUndef(r.averagePassRate) ?? calcAverage(p1, p2),
            rewardReason: r.rewardReason || '',
            rewardAmount: toNumberOrUndef(r.rewardAmount) ?? '',
          } as TeachingQualityRecord;
        });
        setData(normalized.length ? normalized : initData);
      } else {
        // DB 无数据：尝试从班考试成绩表自动生成
        const gen = await buildFromClassExamScores();
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
        tab: TAB_TEACHING_QUALITY,
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

  const refreshFromExamScores = async () => {
    if (!campus) {
      message.warning('缺少神殿信息，无法刷新');
      return;
    }
    setLoading(true);
    try {
      const gen = await buildFromClassExamScores();
      setData(gen);
      message.success('已从班考试成绩表汇总刷新');
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

  // 可编辑列
  const columns: ColumnsType<TeachingQualityRecord> = [
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
    {
      title: '考试合格率1',
      dataIndex: 'passRate1',
      align: 'center',
      width: 130,
      render: (_v, r) => (
        <Input
          value={String(r.passRate1 ?? '')}
          onChange={(e) => update(r.key, 'passRate1', e.target.value)}
          placeholder="%"
        />
      ),
    },
    {
      title: '考试合格率2',
      dataIndex: 'passRate2',
      align: 'center',
      width: 130,
      render: (_v, r) => (
        <Input
          value={String(r.passRate2 ?? '')}
          onChange={(e) => update(r.key, 'passRate2', e.target.value)}
          placeholder="%"
        />
      ),
    },
    {
      title: '平均考试合格率',
      dataIndex: 'averagePassRate',
      align: 'center',
      width: 140,
      render: (_v, r) => (
        <Input
          value={String(r.averagePassRate ?? '')}
          onChange={(e) => update(r.key, 'averagePassRate', e.target.value)}
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
          <span>教学质量考核</span>
          <Space>
            <Button onClick={refreshFromExamScores} loading={loading}>刷新</Button>
            <Button type="primary" onClick={saveToDB} loading={loading}>保存</Button>
          </Space>
        </div>
        <Table<TeachingQualityRecord>
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

export default TeachingQuality;
