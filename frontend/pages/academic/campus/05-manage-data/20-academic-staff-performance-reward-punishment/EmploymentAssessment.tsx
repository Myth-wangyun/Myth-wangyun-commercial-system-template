// 就业考核 - 包含三个表格：就业奖惩金额、学术老师奖惩金额、就业明星奖励
import React, { useEffect, useMemo, useState } from 'react';
import { App, Table, InputNumber, Select, Input, Button, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { RewardPunishmentProps } from './index';
import { staffPerformanceRewardService } from '@/services/staffPerformanceReward';
import { employmentStarService } from '@/services/employmentStar';
import { fetchClassEmploymentSummaries } from '@/services/classEmploymentSummary';
import type { EmploymentStarRecord } from '@/types/employment-star';


// 就业奖惩金额数据类型
interface EmploymentRewardRecord {
  key: string;
  serialNumber: number;
  classCode: string;
  averageSalary: number;
  baseAmount: number;
  classSize: number;
  rewardRatio: number;
  totalAmount: number;
  firstTwoThirds: number;
  remainingOneThird: number;
}

// 学术老师奖惩金额数据类型
interface TeacherRewardRecord {
  key: string;
  serialNumber: number | string;
  classCode: string;
  firstTwoThirds: number;
  teacherName: string;
  employmentDirection: string;
  employmentCount: number;
  classSize: number;
  distributionRatio: number; // 就业人数/班级人数
  distributionAmount: number; // 首次2/3奖金 * 分配比例
}

// 就业明星奖励数据类型
interface StarRewardRecord {
  key: string;
  serialNumber: number;
  classCode: string;
  teacherName: string;
  starName: string;
  salary: number;
  verified: string;
  rewardAmount: number;
}

const EmploymentAssessment: React.FC<RewardPunishmentProps> = ({ campus, classList, teacherList, assignmentList, year, month }) => {
  const { message } = App.useApp()
  const TAB_EMPLOYMENT_REWARD = 1; // 就业考核 tab=1（数据库唯一键：神殿+年份+月份+tab）

  // 为 tab=1 存储的数据结构：{ employmentRewardData, teacherRewardData, starRewardData }
  type Tab1Data = {
    employmentRewardData: EmploymentRewardRecord[];
    teacherRewardData: TeacherRewardRecord[];
    starRewardData: StarRewardRecord[];
  };

  const [loading, setLoading] = useState(false);

  const [employmentRewardData, setEmploymentRewardData] = useState<EmploymentRewardRecord[]>([
    { key: '1', serialNumber: 1, classCode: '', averageSalary: 0, baseAmount: 0, classSize: 0, rewardRatio: 0, totalAmount: 0, firstTwoThirds: 0, remainingOneThird: 0 },
  ]);
  const [teacherRewardData, setTeacherRewardData] = useState<TeacherRewardRecord[]>([
    { key: '1', serialNumber: 1, classCode: '', firstTwoThirds: 0, teacherName: '', employmentDirection: '', employmentCount: 0, classSize: 0, distributionRatio: 0, distributionAmount: 0 },
  ]);
  const [starRewardData, setStarRewardData] = useState<StarRewardRecord[]>([
    { key: '1', serialNumber: 1, classCode: '', teacherName: '', starName: '', salary: 0, verified: '是', rewardAmount: 0 },
  ]);

  const [starOptions, setStarOptions] = useState<Array<{ label: string; value: string; salary: number }>>([]);

  // 班级就业明细（用于回填“学员平均薪资”）
  const [classEmploymentAvgSalaryMap, setClassEmploymentAvgSalaryMap] = useState<Map<string, number>>(new Map());

  // 班级下拉选项
  const classOptions = useMemo(
    () =>
      classList.map(c => ({
        value: c.class_code || c.class_name,
        label: c.class_name,
      })),
    [classList],
  );

  // 行key生成（新增行用）
  const genRowKey = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

  // 重新编号
  const renumberEmploymentRows = (rows: EmploymentRewardRecord[]) =>
    rows.map((r, idx) => ({ ...r, serialNumber: idx + 1 }));

  const loadStarOptions = async () => {
    if (!campus) return;
    try {
      const list = await employmentStarService.getEmploymentStarsData(campus);
      const opts = (list || []).map((s: EmploymentStarRecord) => ({
        label: `${s.studentName}（${s.employmentSalary}）`,
        value: s.studentName,
        salary: Number(s.employmentSalary || 0),
      }));
      setStarOptions(opts);
    } catch (e: any) {
      console.error(e);
      // 不强提示，避免影响主表使用
    }
  };

  // 从【班级就业明细/总结】读取：班级 -> 实际平均薪资
  // 用于“就业奖惩金额”表的【学员平均薪资（元）】自动回填
  const loadClassEmploymentAvgSalaryMap = async () => {
    if (!campus || !year || !month) return;
    try {
      // 复用现有“班级就业总结”接口（明细页也是基于它做汇总/展示）
      const list = await fetchClassEmploymentSummaries(campus, { 年份: year, 月份: month });
      const map = new Map<string, number>();
      (list || []).forEach((r: any) => {
        const classCode = r?.班级名称 || r?.classCode || r?.class_code || r?.class_name;
        const avg = Number(r?.实际平均薪资 ?? r?.actualAverageSalary ?? r?.实际平均工资 ?? 0);
        if (classCode) map.set(classCode, avg);
      });
      setClassEmploymentAvgSalaryMap(map);
    } catch (e) {
      console.warn('[EmploymentAssessment] 读取班级就业明细平均薪资失败:', e);
      setClassEmploymentAvgSalaryMap(new Map());
    }
  };

  const loadEmploymentReward = async () => {
    if (!campus || !year || !month) return;

    // 刷新时先拉取一次“班级就业明细/总结”，确保平均薪资是最新的
    await loadClassEmploymentAvgSalaryMap();

    setLoading(true);
    try {
      const res = await staffPerformanceRewardService.list({
        campus,
        year,
        month,
        tab: TAB_EMPLOYMENT_REWARD,
      });

      const record = res?.[0];

      // 数据兼容：后端数据可能为 Tab1Data 或旧版仅 employmentRewardData 的行数组
      const rawData = (record as any)?.数据;
      const parsedData: any =
        typeof rawData === 'string'
          ? (() => {
              try {
                return JSON.parse(rawData);
              } catch {
                return null;
              }
            })()
          : rawData;

      const tab1: Tab1Data | null =
        parsedData && typeof parsedData === 'object' && !Array.isArray(parsedData)
          ? (parsedData as Tab1Data)
          : null;

      const employmentRows: any[] | null = Array.isArray(parsedData)
        ? parsedData
        : Array.isArray(tab1?.employmentRewardData)
          ? tab1!.employmentRewardData
          : null;

      const teacherRows: any[] | null = Array.isArray(tab1?.teacherRewardData) ? tab1!.teacherRewardData : null;

      const starRows: any[] | null = Array.isArray(tab1?.starRewardData) ? tab1!.starRewardData : null;

      if (employmentRows && employmentRows.length > 0) {
        const normalized = renumberEmploymentRows(
          employmentRows.map((r: any, idx: number) => {
            const classCode = r.classCode || '';
            const savedAvg = Number(r.averageSalary || 0);
            const mappedAvg = classCode ? classEmploymentAvgSalaryMap.get(classCode) : undefined;
            // 规则：优先使用“班级就业明细/总结”的平均薪资；如果没有，则用已保存的值
            const averageSalary = (typeof mappedAvg === 'number' && !Number.isNaN(mappedAvg)) ? mappedAvg : savedAvg;

            return {
              key: r.key || `${idx + 1}`,
              serialNumber: Number(r.serialNumber ?? idx + 1),
              classCode,
              averageSalary,
              baseAmount: Number(r.baseAmount || 0),
              classSize: Number(r.classSize || 0),
              rewardRatio: Number(r.rewardRatio || 0),
              totalAmount: Number(r.totalAmount || 0),
              firstTwoThirds: Number(r.firstTwoThirds || 0),
              remainingOneThird: Number(r.remainingOneThird || 0),
            };
          }),
        );
        setEmploymentRewardData(normalized);
      } else {
        setEmploymentRewardData([
          {
            key: '1',
            serialNumber: 1,
            classCode: '',
            averageSalary: 0,
            baseAmount: 0,
            classSize: 0,
            rewardRatio: 0,
            totalAmount: 0,
            firstTwoThirds: 0,
            remainingOneThird: 0,
          },
        ]);
      }

      if (teacherRows) {
        // 读取到已保存的学术老师奖惩金额数据时，直接回填，并锁定不再被自动生成覆盖
        setTeacherRewardData(
          teacherRows.map((r: any, idx: number) => ({
            key: r.key || `${idx + 1}`,
            serialNumber: r.serialNumber ?? '',
            classCode: r.classCode || '',
            firstTwoThirds: Number(r.firstTwoThirds || 0),
            teacherName: r.teacherName || '',
            employmentDirection: r.employmentDirection || '',
            employmentCount: Number(r.employmentCount || 0),
            classSize: Number(r.classSize || 0),
            distributionRatio: Number(r.distributionRatio || 0),
            distributionAmount: Number(r.distributionAmount || 0),
          })),
        );
        setTeacherDataLocked(true);
      }

      if (starRows) {
        setStarRewardData(
          starRows.map((r: any, idx: number) => ({
            key: r.key || `${idx + 1}`,
            serialNumber: Number(r.serialNumber ?? idx + 1),
            classCode: r.classCode || '',
            teacherName: r.teacherName || '',
            starName: r.starName || '',
            salary: Number(r.salary || 0),
            verified: r.verified || '是',
            rewardAmount: Number(r.rewardAmount || 0),
          })),
        );
      }
    } catch (e: any) {
      console.error(e);
      message.error(e?.message || '读取失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载数据库数据（按：神殿+年份+月份+tab）
  useEffect(() => {
    if (!campus || !year || !month) return;
    loadEmploymentReward();
  }, [campus, year, month]);

  useEffect(() => {
    loadStarOptions();
  }, [campus]);

  useEffect(() => {
    loadClassEmploymentAvgSalaryMap();
  }, [campus, year, month]);

  // 金额计算（保留 2 位小数，如需整数可改为 Math.round）
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  // 通用单元格更新（就业奖惩金额：联动计算 rewardRatio / totalAmount / 2/3 / 1/3）
  const updateEmployment = (key: string, field: keyof EmploymentRewardRecord, value: any) => {
    setEmploymentRewardData(prev =>
      prev.map(r => {
        if (r.key !== key) return r;

        const next: EmploymentRewardRecord = { ...r, [field]: value } as EmploymentRewardRecord;

        // “学员平均薪资（元）”从【班级就业明细/总结】读取：切换班级时自动回填
        // 如果该班级在明细中无数据，则保持原值
        if (field === 'classCode') {
          const classCode = String(value || '');
          const avg = classCode ? classEmploymentAvgSalaryMap.get(classCode) : undefined;
          if (typeof avg === 'number' && !Number.isNaN(avg)) {
            next.averageSalary = avg;
          }
        }

        // 班级人数奖罚比例：
        // - 班级人数 >= 10 => 1
        // - 班级人数 < 10 => 班级人数 / 10
        if (field === 'classSize') {
          const size = Number(next.classSize) || 0;
          next.rewardRatio = size >= 10 ? 1 : round2(size / 10);
        }

        // 奖罚总额 = 奖罚金额基数 * 班级人数奖罚比例
        const totalAmount = round2((Number(next.baseAmount) || 0) * (Number(next.rewardRatio) || 0));
        // 首次2/3奖金 = 奖罚总额 * 2/3
        const firstTwoThirds = round2(totalAmount * (2 / 3));
        // 剩余1/3奖金 = 奖罚总额 * 1/3
        const remainingOneThird = round2(totalAmount * (1 / 3));

        next.totalAmount = totalAmount;
        next.firstTwoThirds = firstTwoThirds;
        next.remainingOneThird = remainingOneThird;

        return next;
      }),
    );
  };
  // 学术老师奖惩金额：联动计算
  const updateTeacher = (key: string, field: keyof TeacherRewardRecord, value: any) => {
    setTeacherRewardData(prev =>
      prev.map(r => {
        if (r.key !== key) return r;
        const next: TeacherRewardRecord = { ...r, [field]: value } as TeacherRewardRecord;

        const employmentCount = Number(next.employmentCount) || 0;
        const classSize = Number(next.classSize) || 0;
        const firstTwoThirds = Number(next.firstTwoThirds) || 0;

        const ratio = classSize > 0 ? round2(employmentCount / classSize) : 0;
        const amount = round2(firstTwoThirds * ratio);

        next.distributionRatio = ratio;
        next.distributionAmount = amount;

        return next;
      }),
    );
  };
  const updateStar = (key: string, field: keyof StarRewardRecord, value: any) => {
    setStarRewardData(prev => prev.map(r => r.key === key ? { ...r, [field]: value } as StarRewardRecord : r));
  };

  // 新增一行（就业奖惩金额）
  const addEmploymentRow = () => {
    // 新增班级时，解锁学术老师奖惩金额表，允许自动同步生成
    setTeacherDataLocked(false);
    setEmploymentRewardData(prev =>
      renumberEmploymentRows([
        ...prev,
        {
          key: genRowKey(),
          serialNumber: prev.length + 1,
          classCode: '',
          averageSalary: 0,
          baseAmount: 0,
          classSize: 0,
          rewardRatio: 0,
          totalAmount: 0,
          firstTwoThirds: 0,
          remainingOneThird: 0,
        },
      ]),
    );
  };

  const addStarRow = () => {
    setStarRewardData(prev => [
      ...prev,
      {
        key: genRowKey(),
        serialNumber: prev.length + 1,
        classCode: '',
        teacherName: '',
        starName: '',
        salary: 0,
        verified: '是',
        rewardAmount: 0,
      },
    ]);
  };

  // 保存（tab=1：就业考核 - 三张表一起存）
  const saveTab1All = async (successMsg = '保存成功') => {
    if (!campus || !year || !month) {
      message.warning('缺少神殿/年月信息，无法保存');
      return;
    }

    const payload: Tab1Data = {
      employmentRewardData,
      teacherRewardData,
      starRewardData,
    };

    setLoading(true);
    try {
      await staffPerformanceRewardService.upsert({
        神殿: campus,
        年份: year,
        月份: month,
        tab: TAB_EMPLOYMENT_REWARD,
        数据: payload as any,
      });
      message.success(successMsg);
    } catch (e: any) {
      console.error(e);
      message.error(e?.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存（就业奖惩金额）
  const saveEmploymentReward = async () => {
    await saveTab1All('就业奖惩金额已保存');
  };

  // 就业奖惩金额表格列（可编辑）
  const employmentRewardColumns: ColumnsType<EmploymentRewardRecord> = [
    { title: '序号', dataIndex: 'serialNumber', align: 'center', width: 80, render: (_v, r) => r.serialNumber },
    { title: '就业班级', dataIndex: 'classCode', align: 'center', width: 150, render: (_v, r) => (
      <Select 
        value={r.classCode || undefined} 
        onChange={(val) => updateEmployment(r.key, 'classCode', val)} 
        style={{ width: '100%' }}
        placeholder="选择班级"
        allowClear
        showSearch
        optionFilterProp="label"
        options={classOptions}
      />
    ) },
    { title: '学员平均薪资（元）', dataIndex: 'averageSalary', align: 'center', width: 160, render: (_v, r) => <InputNumber style={{ width: '100%' }} value={r.averageSalary} onChange={(val)=> updateEmployment(r.key, 'averageSalary', Number(val||0))} /> },
    { title: '奖罚金额基数（元）', dataIndex: 'baseAmount', align: 'center', width: 160, render: (_v, r) => <InputNumber style={{ width: '100%' }} value={r.baseAmount} onChange={(val)=> updateEmployment(r.key, 'baseAmount', Number(val||0))} /> },
    { title: '班级人数（人）', dataIndex: 'classSize', align: 'center', width: 140, render: (_v, r) => <InputNumber style={{ width: '100%' }} value={r.classSize} onChange={(val)=> updateEmployment(r.key, 'classSize', Number(val||0))} /> },
    { title: '班级人数奖罚比例', dataIndex: 'rewardRatio', align: 'center', width: 160, render: (_v, r) => <InputNumber style={{ width: '100%' }} value={r.rewardRatio} disabled /> },
    { title: '奖罚总额（元）', dataIndex: 'totalAmount', align: 'center', width: 140, render: (_v, r) => <InputNumber style={{ width: '100%' }} value={r.totalAmount} disabled /> },
    { title: '首次2/3奖金（元）', dataIndex: 'firstTwoThirds', align: 'center', width: 160, render: (_v, r) => <InputNumber style={{ width: '100%' }} value={r.firstTwoThirds} disabled /> },
    { title: '剩余1/3奖金（元）', dataIndex: 'remainingOneThird', align: 'center', width: 160, render: (_v, r) => <InputNumber style={{ width: '100%' }} value={r.remainingOneThird} disabled /> },
  ];

  // 学术老师奖惩金额：按班级分组后的 rowSpan 计算
  const teacherRowSpanMap = useMemo(() => {
    const map = new Map<string, number>();
    teacherRewardData.forEach(r => {
      const key = r.classCode || '';
      if (!key) return;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [teacherRewardData]);

  const teacherFirstIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    teacherRewardData.forEach((r, idx) => {
      const key = r.classCode || '';
      if (!key) return;
      if (!map.has(key)) map.set(key, idx);
    });
    return map;
  }, [teacherRewardData]);

  const [teacherDataLocked, setTeacherDataLocked] = useState(false);

  // 根据班级自动生成学术老师奖惩金额表行：一个班多个老师，一个老师一行
  // 注意：如果从数据库加载到了 teacherRewardData，则锁定，不再被自动生成逻辑覆盖
  useEffect(() => {
    if (teacherDataLocked) return;
    // 班级value统一：class_code 优先，否则 class_name
    const classValueById = new Map<number, string>();
    classList.forEach(c => {
      classValueById.set(c.id, c.class_code || c.class_name);
    });

    // 构建：班级 -> 首次2/3奖金、班级人数
    const employmentMap = new Map<string, { firstTwoThirds: number; classSize: number }>();
    employmentRewardData.forEach(r => {
      if (!r.classCode) return;
      employmentMap.set(r.classCode, {
        firstTwoThirds: Number(r.firstTwoThirds) || 0,
        classSize: Number(r.classSize) || 0,
      });
    });

    // 构建：班级 -> teacher_id[]（从 assignments 取）
    const teacherIdsByClassCode = new Map<string, number[]>();
    assignmentList.forEach(a => {
      const classCode = classValueById.get(a.class_id);
      if (!classCode) return;
      if (!teacherIdsByClassCode.has(classCode)) teacherIdsByClassCode.set(classCode, []);
      teacherIdsByClassCode.get(classCode)!.push(a.teacher_id);
    });

    // teacher_id -> teacherName
    const teacherNameById = new Map<number, string>();
    teacherList.forEach(t => {
      teacherNameById.set(t.id, t.name);
    });

    const rows: TeacherRewardRecord[] = [];

    // 按就业奖惩金额表中的班级顺序生成
    const classCodesInOrder = employmentRewardData.map(r => r.classCode).filter(Boolean);
    const uniqueClassCodes: string[] = Array.from(new Set(classCodesInOrder));

    uniqueClassCodes.forEach(classCode => {
      const meta = employmentMap.get(classCode);
      if (!meta) return;

      const teacherIds = teacherIdsByClassCode.get(classCode) || [];
      const teacherNames = teacherIds
        .map(id => teacherNameById.get(id))
        .filter((n): n is string => Boolean(n));

      const finalTeacherNames = teacherNames.length > 0 ? Array.from(new Set(teacherNames)) : [''];

      finalTeacherNames.forEach((teacherName, idx) => {
        const key = `${classCode}_${teacherName || 'teacher'}_${idx}`;
        const employmentCount = 0;
        const ratio = meta.classSize > 0 ? round2(employmentCount / meta.classSize) : 0;
        const amount = round2(meta.firstTwoThirds * ratio);

        rows.push({
          key,
          serialNumber: '',
          classCode,
          firstTwoThirds: meta.firstTwoThirds,
          teacherName: teacherName || '',
          employmentDirection: '',
          employmentCount,
          classSize: meta.classSize,
          distributionRatio: ratio,
          distributionAmount: amount,
        });
      });
    });

    if (rows.length > 0) {
      // 序号按“班级”分组编号
      let groupNo = 0;
      const seen = new Set<string>();
      const normalized = rows.map(r => {
        if (!seen.has(r.classCode)) {
          seen.add(r.classCode);
          groupNo += 1;
          return { ...r, serialNumber: groupNo };
        }
        return { ...r, serialNumber: '' };
      });
      setTeacherRewardData(normalized);
    }
  }, [employmentRewardData, classList, teacherList, assignmentList]);

  // 学术老师奖惩金额表格列（可编辑，按班级合并单元格）
  const teacherRewardColumns: ColumnsType<TeacherRewardRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      align: 'center',
      width: 80,
      onCell: (record, index) => {
        const classCode = record.classCode || '';
        if (!classCode) return {};
        const firstIndex = teacherFirstIndexMap.get(classCode);
        if (firstIndex === index) return { rowSpan: teacherRowSpanMap.get(classCode) };
        return { rowSpan: 0 };
      },
      render: (_v, r) => (typeof r.serialNumber === 'number' ? r.serialNumber : ''),
    },
    {
      title: '就业班级',
      dataIndex: 'classCode',
      align: 'center',
      width: 150,
      onCell: (record, index) => {
        const classCode = record.classCode || '';
        if (!classCode) return {};
        const firstIndex = teacherFirstIndexMap.get(classCode);
        if (firstIndex === index) return { rowSpan: teacherRowSpanMap.get(classCode) };
        return { rowSpan: 0 };
      },
      render: (_v, r) => <span>{r.classCode}</span>,
    },
    {
      title: '首次2/3奖金（元）',
      dataIndex: 'firstTwoThirds',
      align: 'center',
      width: 160,
      onCell: (record, index) => {
        const classCode = record.classCode || '';
        if (!classCode) return {};
        const firstIndex = teacherFirstIndexMap.get(classCode);
        if (firstIndex === index) return { rowSpan: teacherRowSpanMap.get(classCode) };
        return { rowSpan: 0 };
      },
      render: (_v, r) => <InputNumber style={{ width: '100%' }} value={r.firstTwoThirds} disabled />,
    },
    {
      title: '带班老师',
      dataIndex: 'teacherName',
      align: 'center',
      width: 120,
      render: (_v, r) => <Input value={r.teacherName} disabled />,
    },
    { title: '学员就业方向', dataIndex: 'employmentDirection', align: 'center', width: 140, render: (_v, r) => <Input value={r.employmentDirection} onChange={(e)=> updateTeacher(r.key, 'employmentDirection', e.target.value)} /> },
    { title: '就业人数', dataIndex: 'employmentCount', align: 'center', width: 120, render: (_v, r) => <InputNumber style={{ width: '100%' }} value={r.employmentCount} onChange={(val)=> updateTeacher(r.key, 'employmentCount', Number(val||0))} /> },
    { title: '班级人数', dataIndex: 'classSize', align: 'center', width: 120, render: (_v, r) => <InputNumber style={{ width: '100%' }} value={r.classSize} disabled /> },
    { title: '奖惩分配比例', dataIndex: 'distributionRatio', align: 'center', width: 140, render: (_v, r) => <InputNumber style={{ width: '100%' }} value={r.distributionRatio} disabled /> },
    { title: '奖惩分配（元）', dataIndex: 'distributionAmount', align: 'center', width: 160, render: (_v, r) => <InputNumber style={{ width: '100%' }} value={r.distributionAmount} disabled /> },
  ];

  // 就业明星奖励表格列（可编辑）
  const starRewardColumns: ColumnsType<StarRewardRecord> = [
    { title: '序号', dataIndex: 'serialNumber', align: 'center', width: 80, render: (_v, r) => r.serialNumber },
    { title: '就业班级', dataIndex: 'classCode', align: 'center', width: 150, render: (_v, r) => (
      <Select 
        value={r.classCode || undefined} 
        onChange={(val) => updateStar(r.key, 'classCode', val)} 
        style={{ width: '100%' }}
        placeholder="选择班级"
        allowClear
        showSearch
        optionFilterProp="label"
        options={classOptions}
      />
    ) },
    {
      title: '带班老师',
      dataIndex: 'teacherName',
      align: 'center',
      width: 140,
      render: (_v, r) => {
        // 按“就业班级”从配置中心 assignmentList 找到对应教员
        // classCode 规则：class_code 优先，否则 class_name
        const classIdByValue = new Map<string, number>();
        classList.forEach(c => {
          const v = c.class_code || c.class_name;
          if (v) classIdByValue.set(v, c.id);
        });
        const teacherNameById = new Map<number, string>();
        teacherList.forEach(t => teacherNameById.set(t.id, t.name));

        const classId = r.classCode ? classIdByValue.get(r.classCode) : undefined;
        const teacherIds = classId ? assignmentList.filter(a => a.class_id === classId).map(a => a.teacher_id) : [];
        const options = Array.from(new Set(teacherIds.map(id => teacherNameById.get(id)).filter(Boolean) as string[]))
          .map(n => ({ label: n, value: n }));

        return (
          <Select
            value={r.teacherName || undefined}
            onChange={(val) => updateStar(r.key, 'teacherName', val)}
            style={{ width: '100%' }}
            placeholder="选择带班老师"
            allowClear
            showSearch
            optionFilterProp="label"
            options={options}
            disabled={!r.classCode}
          />
        );
      },
    },
    {
      title: '就业明星',
      dataIndex: 'starName',
      align: 'center',
      width: 200,
      render: (_v, r) => (
        <Select
          value={r.starName || undefined}
          onChange={(val) => {
            const opt = starOptions.find(o => o.value === val);
            updateStar(r.key, 'starName', val);
            if (opt) updateStar(r.key, 'salary', opt.salary);
          }}
          style={{ width: '100%' }}
          placeholder="选择就业明星"
          allowClear
          showSearch
          optionFilterProp="label"
          options={starOptions}
        />
      ),
    },
    { title: '就业薪资（元）', dataIndex: 'salary', align: 'center', width: 140, render: (_v, r) => <InputNumber style={{ width: '100%' }} value={r.salary} disabled /> },
    { title: '总部是否核实', dataIndex: 'verified', align: 'center', width: 140, render: (_v, r) => <Input value={r.verified} onChange={(e)=> updateStar(r.key, 'verified', e.target.value)} /> },
    { title: '奖励金额（元）', dataIndex: 'rewardAmount', align: 'center', width: 140, render: (_v, r) => <InputNumber style={{ width: '100%' }} value={r.rewardAmount} onChange={(val)=> updateStar(r.key, 'rewardAmount', Number(val||0))} /> },
  ];

  return (
    <div style={{ padding: '0 16px' }}>
      {/* 就业奖惩金额表 */}
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
          <span>就业奖惩金额</span>
          <Space>
            <Button onClick={addEmploymentRow}>新增</Button>
            <Button type="primary" loading={loading} onClick={saveEmploymentReward}>
              保存
            </Button>
            <Button loading={loading} onClick={loadEmploymentReward}>
              刷新
            </Button>
          </Space>
        </div>
        <Table<EmploymentRewardRecord>
          loading={loading}
          columns={employmentRewardColumns}
          dataSource={employmentRewardData}
          pagination={false}
          bordered
          size="small"
          style={{ marginTop: 0 }}
          rowKey="key"
        />
      </div>

      {/* 学术老师奖惩金额表 */}
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
          <span>学术老师奖惩金额</span>
          <Space>
            <Button type="primary" loading={loading} onClick={() => saveTab1All('学术老师奖惩金额已保存')}>
              保存
            </Button>
            <Button loading={loading} onClick={loadEmploymentReward}>
              刷新
            </Button>
          </Space>
        </div>
        <Table<TeacherRewardRecord>
          columns={teacherRewardColumns}
          dataSource={teacherRewardData}
          pagination={false}
          bordered
          size="small"
          style={{ marginTop: 0 }}
          rowKey="key"
        />
      </div>

      {/* 就业明星奖励表 */}
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
          <span>就业明星奖励</span>
          <Space>
            <Button onClick={addStarRow} disabled={loading}>新增</Button>
            <Button type="primary" loading={loading} onClick={() => saveTab1All('就业明星奖励已保存')}>
              保存
            </Button>
            <Button loading={loading} onClick={loadEmploymentReward}>
              刷新
            </Button>
          </Space>
        </div>
        <Table<StarRewardRecord>
          columns={starRewardColumns}
          dataSource={starRewardData}
          pagination={false}
          bordered
          size="small"
          style={{ marginTop: 0 }}
          rowKey="key"
        />
      </div>
    </div>
  );
};

export default EmploymentAssessment;
