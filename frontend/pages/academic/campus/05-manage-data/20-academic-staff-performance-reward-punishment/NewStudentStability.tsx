// 新生维稳考核
import React, { useEffect, useMemo, useState } from 'react';
import { App, Table, Input, InputNumber, Select, Space, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { RewardPunishmentProps } from './index';
import { staffPerformanceRewardService } from '@/services/staffPerformanceReward';
import { newStudentArrangementService } from '@/services/service';
import { buildApiUrl } from '@/utils/apiBase';

// 新生维稳考核数据类型
interface NewStudentStabilityRecord {
  key: string;
  serialNumber: number;
  teacherName: string;
  studentName: string;
  enrollmentTime: string;
  passedTrial: string;
  fullPayment: string;
  rewardAmount: number | string;
}

// 初始数据
const initData: NewStudentStabilityRecord[] = [
  { key: '1', serialNumber: 1, teacherName: '', studentName: '', enrollmentTime: '', passedTrial: '', fullPayment: '', rewardAmount: '' },
];

const TAB_NEW_STUDENT_STABILITY = 6;

const NewStudentStability: React.FC<RewardPunishmentProps> = ({ campus, teacherList, year, month }) => {
  const { message } = App.useApp()
  const [data, setData] = useState<NewStudentStabilityRecord[]>(initData);
  const [loading, setLoading] = useState(false);

  const update = (key: string, field: keyof NewStudentStabilityRecord, value: any) => {
    setData(prev => prev.map(r => r.key === key ? { ...r, [field]: value } as NewStudentStabilityRecord : r));
  };

  // 教员下拉选项
  const teacherOptions = useMemo(() => teacherList.map(t => ({
    value: t.name,
    label: t.name,
  })), [teacherList]);

  // 去重函数：根据（授课教员、学生姓名、进班时间）去重
  const deduplicateRecords = (records: NewStudentStabilityRecord[]): NewStudentStabilityRecord[] => {
    const seen = new Set<string>();
    const result: NewStudentStabilityRecord[] = [];
    records.forEach((r) => {
      // 生成唯一键：授课教员 + 学生姓名 + 进班时间
      const uniqueKey = `${r.teacherName || ''}_${r.studentName || ''}_${r.enrollmentTime || ''}`;
      if (!seen.has(uniqueKey)) {
        seen.add(uniqueKey);
        result.push(r);
      }
    });
    // 重新编号
    return result.map((r, idx) => ({ ...r, key: `${Date.now()}_${idx}`, serialNumber: idx + 1 }));
  };

  // 从"神殿每日新生安排表"导入（按神殿 + 年月）
  // 优化：后端支持 year+month 按月查询后，这里只需要 1 次请求（不影响原有按 date 的"每日表"功能）
  const buildFromDailyNewStudent = async (): Promise<NewStudentStabilityRecord[]> => {
    if (!campus || !year || !month) return initData;

    try {
      // 尝试走"按月"查询（新接口参数）
      const res = await newStudentArrangementService.getList(
        {
          year,
          month,
          page: 1,
          // 尽量一次拿完；后端限制最大 200，这里就先拿 200
          pageSize: 200,
          search: '',
        } as any,
        campus,
      );

      // service.getList 返回的是 { list, total, page... }，但此接口实际响应字段是 records
      const list: any[] = (res as any)?.list || (res as any)?.records || [];
      const mapped = (list || []).map((r: any, idx: number) => ({
        key: `${Date.now()}_${idx}`,
        serialNumber: idx + 1,
        teacherName: r?.instructor || r?.授课教员 || r?.teacherName || r?.教员姓名 || '',
        studentName: r?.studentName || r?.student_name || r?.学生姓名 || r?.姓名 || '',
        enrollmentTime: r?.enrollmentDate || r?.enrollment_date || r?.进班时间 || r?.enrollmentTime || r?.入班时间 || '',
        passedTrial: r?.passedTrial || r?.passed_trial || r?.是否过试学 || '',
        fullPayment:
          r?.fullPayment ||
          r?.full_payment ||
          r?.是否回全款 ||
          (typeof r?.owedAmount === 'number' ? (r.owedAmount > 0 ? '否' : '是') : (typeof r?.owed_amount === 'number' ? (r.owed_amount > 0 ? '否' : '是') : '')),
        rewardAmount: '',
      })) as NewStudentStabilityRecord[];

      // 去重后返回
      const deduplicated = deduplicateRecords(mapped);
      return deduplicated.length ? deduplicated : initData;
    } catch (e) {
      // 兼容：如果后端尚未发布该参数能力，则回退到旧的逐日拉取方式（但仍可能较慢）
      const daysInMonth = new Date(year, month, 0).getDate();

      const fetchOneDay = async (d: number) => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const url = buildApiUrl(`/new-student-arrangements/?campus=${encodeURIComponent(campus)}&date=${dateStr}&search=`);
        const r = await fetch(url);
        if (!r.ok) return [];
        const json = await r.json();
        return (json?.records || json?.results || json?.data || json?.行列表 || []) as any[];
      };

      const concurrency = 6;
      const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
      const results: any[] = [];

      for (let i = 0; i < days.length; i += concurrency) {
        const chunk = days.slice(i, i + concurrency);
        const chunkRes = await Promise.allSettled(chunk.map((d) => fetchOneDay(d)));
        chunkRes.forEach((r) => {
          if (r.status === 'fulfilled') results.push(...(r.value || []));
        });
      }

      const mapped = (results || []).map((r: any, idx: number) => ({
        key: `${Date.now()}_${idx}`,
        serialNumber: Number(r?.序号 ?? r?.serialNumber ?? idx + 1),
        teacherName: r?.instructor || r?.授课教员 || r?.teacherName || r?.教员姓名 || '',
        studentName: r?.student_name || r?.学生姓名 || r?.studentName || r?.姓名 || '',
        enrollmentTime: r?.enrollment_date || r?.进班时间 || r?.enrollmentTime || r?.入班时间 || '',
        passedTrial: r?.passed_trial || r?.是否过试学 || r?.passedTrial || '',
        fullPayment:
          r?.full_payment ||
          r?.是否回全款 ||
          r?.fullPayment ||
          (typeof r?.owed_amount === 'number' ? (r.owed_amount > 0 ? '否' : '是') : ''),
        rewardAmount: '',
      })) as NewStudentStabilityRecord[];

      // 去重后返回
      const deduplicated = deduplicateRecords(mapped);
      return deduplicated.length ? deduplicated : initData;
    }
  };

  const loadFromDB = async () => {
    if (!campus || !year || !month) return;
    setLoading(true);
    try {
      const list = await staffPerformanceRewardService.list({ campus, year, month, tab: TAB_NEW_STUDENT_STABILITY });
      if (list && list.length && Array.isArray(list[0].数据)) {
        const normalized = (list[0].数据 as any[]).map((r: any, idx: number) => ({
          key: r.key || `${idx + 1}`,
          serialNumber: Number(r.serialNumber ?? idx + 1),
          teacherName: r.teacherName || '',
          studentName: r.studentName || '',
          enrollmentTime: r.enrollmentTime || '',
          passedTrial: r.passedTrial || '',
          fullPayment: r.fullPayment || '',
          rewardAmount: typeof r.rewardAmount === 'number' ? r.rewardAmount : (Number(r.rewardAmount) || ''),
        })) as NewStudentStabilityRecord[];
        setData(normalized.length ? normalized : initData);
      } else {
        const gen = await buildFromDailyNewStudent();
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
        tab: TAB_NEW_STUDENT_STABILITY,
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

  const refreshFromDaily = async () => {
    if (!campus || !year || !month) {
      message.warning('缺少神殿/年月信息，无法刷新');
      return;
    }
    setLoading(true);
    try {
      const gen = await buildFromDailyNewStudent();
      setData(gen);
      message.success('已从每日新生安排表刷新');
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

  const columns: ColumnsType<NewStudentStabilityRecord> = [
    { title: '序号', dataIndex: 'serialNumber', align: 'center', width: 80 },
    { title: '授课教员', dataIndex: 'teacherName', align: 'center', width: 150, render: (_v, r) => (
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
    { title: '学生姓名', dataIndex: 'studentName', align: 'center', width: 120, render: (_v, r) => <Input value={r.studentName} onChange={(e)=> update(r.key, 'studentName', e.target.value)} /> },
    { title: '进班时间', dataIndex: 'enrollmentTime', align: 'center', width: 120, render: (_v, r) => <Input value={r.enrollmentTime} onChange={(e)=> update(r.key, 'enrollmentTime', e.target.value)} /> },
    { title: '是否过试学', dataIndex: 'passedTrial', align: 'center', width: 120, render: (_v, r) => (
      <Select
        value={r.passedTrial || undefined}
        onChange={(val) => update(r.key, 'passedTrial', val)}
        style={{ width: '100%' }}
        placeholder="选择"
        allowClear
        options={[
          { value: '是', label: '是' },
          { value: '否', label: '否' },
        ]}
      />
    ) },
    { title: '是否回全款', dataIndex: 'fullPayment', align: 'center', width: 120, render: (_v, r) => <Input value={r.fullPayment} onChange={(e)=> update(r.key, 'fullPayment', e.target.value)} /> },
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
          <span>新生维稳考核</span>
          <Space>
            <Button onClick={refreshFromDaily} loading={loading}>刷新</Button>
            <Button type="primary" onClick={saveToDB} loading={loading}>保存</Button>
          </Space>
        </div>
        <Table<NewStudentStabilityRecord>
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

export default NewStudentStability;
