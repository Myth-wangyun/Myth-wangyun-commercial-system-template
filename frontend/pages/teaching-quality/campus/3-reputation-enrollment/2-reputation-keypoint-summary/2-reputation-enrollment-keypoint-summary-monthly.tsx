/**
 * XX神殿教化司口碑招生关键点结果汇总表（月度明细）
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { App,
  Card,
  Table,
  Button,
  Space,
  Select,
  Input,
  Typography,
} from 'antd';
import {
  ReloadOutlined,
  DownloadOutlined,
  EditOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useCampusStore } from '@/stores/campusStore';

import { buildApiUrl } from '@/utils/apiBase';
import { fetchHomeroomTeachers } from '@/services/configMaster';

const { Option } = Select;
const { Title } = Typography;

// 月度口碑招生关键点记录接口
interface MonthlyReputationKeypointRecord {
  key: string;
  month: number | string; // 月份（1-12 或 "合计"）
  campus: string; // 神殿
  teacherName: string; // 班主任姓名（合计/月合计时为空）
  
  // 线上宣传数量
  wechatMoments: number; // 朋友圈数量
  douyin: number; // 抖音数量
  kuaishou: number; // 快手数量
  xiaohongshu: number; // 小红书数量
  onlineTotal: number; // 线上宣传合计
  
  // 学生访谈数量
  currentStudentInterview: number; // 在校生访谈
  graduateInterview: number; // 毕业生访谈
  parentInterview: number; // 家长访谈
  interviewTotal: number; // 访谈合计
  
  // 活动数量
  activityCount: number; // 活动次数
  competitionCount: number; // 比赛次数
  examRegistrationCount: number; // 送考报名次
  activityTotal: number; // 活动合计
  
  rowType?: 'data' | 'monthTotal' | 'total'; // 行类型
}

const ensureCampusName = (name: string) => (name ? (name.endsWith('神殿') ? name : `${name}神殿`) : name);

interface MonthlyReputationKeypointSummaryProps {
  onSaveSuccess?: () => void; // 保存成功后的回调
}

const MonthlyReputationKeypointSummary: React.FC<MonthlyReputationKeypointSummaryProps> = ({ onSaveSuccess }) => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false); // 表格加载
  const [saving, setSaving] = useState(false);   // 保存中状态
  const [editMode, setEditMode] = useState(false);
  const [teacherNames, setTeacherNames] = useState<string[]>([]);

  // 初始化数据：12个月，每个月有“月小计+班主任明细”
  const createInitialData = (roster: string[] = []): MonthlyReputationKeypointRecord[] => {
    const data: MonthlyReputationKeypointRecord[] = [];
    const names = roster && roster.length > 0 ? roster : [];

    for (let month = 1; month <= 12; month++) {
      // 每个月的小计行
      data.push({
        key: `${month}-total`,
        month,
        campus: '',
        teacherName: '合计',
        wechatMoments: 0,
        douyin: 0,
        kuaishou: 0,
        xiaohongshu: 0,
        onlineTotal: 0,
        currentStudentInterview: 0,
        graduateInterview: 0,
        parentInterview: 0,
        interviewTotal: 0,
        activityCount: 0,
        competitionCount: 0,
        examRegistrationCount: 0,
        activityTotal: 0,
        rowType: 'monthTotal',
      });
      
      // 班主任明细行（来自配置中心名册）
      names.forEach((name) => data.push({
        key: `${month}-${name}`,
        month,
        campus: '',
        teacherName: name,
        wechatMoments: 0,
        douyin: 0,
        kuaishou: 0,
        xiaohongshu: 0,
        onlineTotal: 0,
        currentStudentInterview: 0,
        graduateInterview: 0,
        parentInterview: 0,
        interviewTotal: 0,
        activityCount: 0,
        competitionCount: 0,
        examRegistrationCount: 0,
        activityTotal: 0,
        rowType: 'data',
      }));
    }
    
    return data;
  };

  const [dataSource, setDataSource] = useState<MonthlyReputationKeypointRecord[]>([]);

  // 自动计算每行的合计
  const calculateRowTotals = (record: MonthlyReputationKeypointRecord): MonthlyReputationKeypointRecord => {
    return {
      ...record,
      onlineTotal: record.wechatMoments + record.douyin + record.kuaishou + record.xiaohongshu,
      interviewTotal: record.currentStudentInterview + record.graduateInterview + record.parentInterview,
      activityTotal: record.activityCount + record.competitionCount + record.examRegistrationCount,
    };
  };

  // 更新数据源，计算每个月的小计
  const updatedDataSource = useMemo(() => {
    const updated = [...dataSource];
    
    // 为每个月计算小计
    for (let month = 1; month <= 12; month++) {
      const monthRecords = updated.filter(r => r.month === month && r.rowType === 'data');
      const monthTotalRecord = updated.find(r => r.month === month && r.rowType === 'monthTotal');
      
      if (monthTotalRecord) {
        // 计算该月所有数据行的合计
        monthTotalRecord.wechatMoments = monthRecords.reduce((sum, r) => sum + r.wechatMoments, 0);
        monthTotalRecord.douyin = monthRecords.reduce((sum, r) => sum + r.douyin, 0);
        monthTotalRecord.kuaishou = monthRecords.reduce((sum, r) => sum + r.kuaishou, 0);
        monthTotalRecord.xiaohongshu = monthRecords.reduce((sum, r) => sum + r.xiaohongshu, 0);
        monthTotalRecord.onlineTotal = monthRecords.reduce((sum, r) => sum + r.onlineTotal, 0);
        monthTotalRecord.currentStudentInterview = monthRecords.reduce((sum, r) => sum + r.currentStudentInterview, 0);
        monthTotalRecord.graduateInterview = monthRecords.reduce((sum, r) => sum + r.graduateInterview, 0);
        monthTotalRecord.parentInterview = monthRecords.reduce((sum, r) => sum + r.parentInterview, 0);
        monthTotalRecord.interviewTotal = monthRecords.reduce((sum, r) => sum + r.interviewTotal, 0);
        monthTotalRecord.activityCount = monthRecords.reduce((sum, r) => sum + r.activityCount, 0);
        monthTotalRecord.competitionCount = monthRecords.reduce((sum, r) => sum + r.competitionCount, 0);
        monthTotalRecord.examRegistrationCount = monthRecords.reduce((sum, r) => sum + r.examRegistrationCount, 0);
        monthTotalRecord.activityTotal = monthRecords.reduce((sum, r) => sum + r.activityTotal, 0);
      }
    }
    
    return updated;
  }, [dataSource]);

  // 计算总计行
  const totalRow = useMemo((): MonthlyReputationKeypointRecord => {
    const monthTotalRecords = updatedDataSource.filter(r => r.rowType === 'monthTotal');
    
    return {
      key: 'total',
      month: '合计',
      campus: '',
      teacherName: '',
      wechatMoments: monthTotalRecords.reduce((sum, r) => sum + r.wechatMoments, 0),
      douyin: monthTotalRecords.reduce((sum, r) => sum + r.douyin, 0),
      kuaishou: monthTotalRecords.reduce((sum, r) => sum + r.kuaishou, 0),
      xiaohongshu: monthTotalRecords.reduce((sum, r) => sum + r.xiaohongshu, 0),
      onlineTotal: monthTotalRecords.reduce((sum, r) => sum + r.onlineTotal, 0),
      currentStudentInterview: monthTotalRecords.reduce((sum, r) => sum + r.currentStudentInterview, 0),
      graduateInterview: monthTotalRecords.reduce((sum, r) => sum + r.graduateInterview, 0),
      parentInterview: monthTotalRecords.reduce((sum, r) => sum + r.parentInterview, 0),
      interviewTotal: monthTotalRecords.reduce((sum, r) => sum + r.interviewTotal, 0),
      activityCount: monthTotalRecords.reduce((sum, r) => sum + r.activityCount, 0),
      competitionCount: monthTotalRecords.reduce((sum, r) => sum + r.competitionCount, 0),
      examRegistrationCount: monthTotalRecords.reduce((sum, r) => sum + r.examRegistrationCount, 0),
      activityTotal: monthTotalRecords.reduce((sum, r) => sum + r.activityTotal, 0),
      rowType: 'total',
    };
  }, [updatedDataSource]);

  // 包含总计行的完整数据
  const fullDataSource = useMemo(() => {
    return [...updatedDataSource, totalRow];
  }, [updatedDataSource, totalRow]);

  // 计算月份列的rowSpan
  const getMonthRowSpan = (record: MonthlyReputationKeypointRecord, index: number) => {
    if (record.rowType === 'total') {
      return 1;
    }
    
    // 每个月有4行（合计、老生、新生、毕业生）
    // 只有每月的第一行（合计行）显示月份
    const monthRecords = fullDataSource.filter(r => r.month === record.month && r.rowType !== 'total');
    const monthIndex = monthRecords.findIndex(r => r.key === record.key);
    const count = monthRecords.length;
    if (monthIndex === 0) {
      return count; // 第一行（通常为月小计）显示月份，合并该月所有行
    }
    return 0; // 其他行不显示
  };

  // 处理单元格编辑
  const handleCellChange = (key: string, field: keyof MonthlyReputationKeypointRecord, value: any) => {
    const newData = dataSource.map(item => {
      if (item.key === key) {
        const updated = { ...item, [field]: value };
        return calculateRowTotals(updated);
      }
      return item;
    });
    setDataSource(newData);
  };

  // 渲染可编辑数字单元格
  const renderEditableNumberCell = (
    value: number,
    record: MonthlyReputationKeypointRecord,
    field: keyof MonthlyReputationKeypointRecord
  ) => {
    if (!editMode || record.rowType !== 'data') {
      return value;
    }

    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => handleCellChange(record.key, field, Number(e.target.value) || 0)}
        style={{ width: '100%' }}
        min={0}
        size="small"
      />
    );
  };

  // 渲染可编辑文本单元格（班主任姓名）
  const renderEditableTextCell = (
    value: string,
    record: MonthlyReputationKeypointRecord,
    field: keyof MonthlyReputationKeypointRecord
  ) => {
    if (!editMode || record.rowType !== 'data') {
      return value;
    }
    return (
      <Input
        value={value}
        onChange={(e) => handleCellChange(record.key, field, e.target.value)}
        style={{ width: '100%' }}
        size="small"
      />
    );
  };

  // 生成表格列配置
  const columns: ColumnsType<MonthlyReputationKeypointRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 52,
      align: 'center',
      fixed: 'left',
      render: (value, record, index) => {
        const rowSpan = getMonthRowSpan(record, index);
        return {
          children: value,
          props: { rowSpan },
        };
      },
    },
    {
      title: '班主任姓名',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 110,
      align: 'center',
      fixed: 'left',
      render: (value, record) => renderEditableTextCell(String(value ?? ''), record, 'teacherName'),
    },
    {
      title: '线上宣传数量',
      children: [
        {
          title: '朋友圈',
          dataIndex: 'wechatMoments',
          key: 'wechatMoments',
          width: 64,
          align: 'center',
          render: (value, record) => renderEditableNumberCell(value, record, 'wechatMoments'),
        },
        {
          title: '抖音',
          dataIndex: 'douyin',
          key: 'douyin',
          width: 58,
          align: 'center',
          render: (value, record) => renderEditableNumberCell(value, record, 'douyin'),
        },
        {
          title: '快手',
          dataIndex: 'kuaishou',
          key: 'kuaishou',
          width: 58,
          align: 'center',
          render: (value, record) => renderEditableNumberCell(value, record, 'kuaishou'),
        },
        {
          title: '小红书',
          dataIndex: 'xiaohongshu',
          key: 'xiaohongshu',
          width: 64,
          align: 'center',
          render: (value, record) => renderEditableNumberCell(value, record, 'xiaohongshu'),
        },
        {
          title: '合计',
          dataIndex: 'onlineTotal',
          key: 'onlineTotal',
          width: 56,
          align: 'center',
          render: (value) => <strong>{value}</strong>,
        },
      ],
    },
    {
      title: '学生访谈数量',
      children: [
        {
          title: '在校生',
          dataIndex: 'currentStudentInterview',
          key: 'currentStudentInterview',
          width: 64,
          align: 'center',
          render: (value, record) => renderEditableNumberCell(value, record, 'currentStudentInterview'),
        },
        {
          title: '毕业生',
          dataIndex: 'graduateInterview',
          key: 'graduateInterview',
          width: 64,
          align: 'center',
          render: (value, record) => renderEditableNumberCell(value, record, 'graduateInterview'),
        },
        {
          title: '家长',
          dataIndex: 'parentInterview',
          key: 'parentInterview',
          width: 58,
          align: 'center',
          render: (value, record) => renderEditableNumberCell(value, record, 'parentInterview'),
        },
        {
          title: '合计',
          dataIndex: 'interviewTotal',
          key: 'interviewTotal',
          width: 56,
          align: 'center',
          render: (value) => <strong>{value}</strong>,
        },
      ],
    },
    {
      title: '活动数量',
      children: [
        {
          title: '活动',
          dataIndex: 'activityCount',
          key: 'activityCount',
          width: 58,
          align: 'center',
          render: (value, record) => renderEditableNumberCell(value, record, 'activityCount'),
        },
        {
          title: '比赛',
          dataIndex: 'competitionCount',
          key: 'competitionCount',
          width: 58,
          align: 'center',
          render: (value, record) => renderEditableNumberCell(value, record, 'competitionCount'),
        },
        {
          title: '送喜报',
          dataIndex: 'examRegistrationCount',
          key: 'examRegistrationCount',
          width: 72,
          align: 'center',
          render: (value, record) => renderEditableNumberCell(value, record, 'examRegistrationCount'),
        },
        {
          title: '合计',
          dataIndex: 'activityTotal',
          key: 'activityTotal',
          width: 56,
          align: 'center',
          render: (value) => <strong>{value}</strong>,
        },
      ],
    },
  ];

  // 从“口碑招生计划与执行统计表(工作自查表)”自动汇总生成（年度明细）
  // 数据来源：/teaching-quality/reputation-self-check （按月、按班主任、按天记录）
  const loadYearly = async () => {
    if (!currentCampus || !selectedYear) return;
    if (loading) {
      console.log('[reputation-keypoint-yearly] 上一次加载尚未结束，跳过本次触发');
      return;
    }
    setLoading(true);

    try {
      const campusName = ensureCampusName(currentCampus);

      // 先拿班主任名册（决定行顺序 & 保证即使某人当月无数据也有行）
      const rosterList = await fetchHomeroomTeachers({ campus_name: campusName, active: true }).catch(
        (err) => {
          console.warn('[reputation-keypoint-yearly] 获取班主任名册失败:', err);
          return [] as any;
        },
      );

      const rosterNames = Array.from(
        new Set(
          (rosterList as any[])
            .filter((t) => t && (t as any).is_active !== false)
            .map((t) => String((t as any).name || '').trim())
            .filter(Boolean),
        ),
      );
      setTeacherNames(rosterNames);

      // 汇总 Map：month -> teacher -> aggregates
      type Agg = {
        // 线上宣传：当前从 self-check 的“线上宣传-当天合计”汇总得到（无法拆分到四个平台）
        onlineTotal: number
        wechatMoments: number
        douyin: number
        kuaishou: number
        xiaohongshu: number

        // 访谈
        currentStudentInterview: number
        graduateInterview: number
        parentInterview: number

        // 活动（包括比赛次数和送喜报人次）
        activityCount: number

        // 下面两项目前在“计划与执行统计表”里没有可自动映射的来源字段，先保留为 0
        competitionCount: number
        examRegistrationCount: number
      }

      const initAgg = (): Agg => ({
        onlineTotal: 0,
        wechatMoments: 0,
        douyin: 0,
        kuaishou: 0,
        xiaohongshu: 0,
        currentStudentInterview: 0,
        graduateInterview: 0,
        parentInterview: 0,
        activityCount: 0,
        competitionCount: 0,
        examRegistrationCount: 0,
      })

      const aggByMonthTeacher = new Map<number, Map<string, Agg>>();

      const safeJson = async (r: Response) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      };

      // 1. 使用后端年度聚合接口：获取自动汇总的数据（线上宣传、访谈、活动次数）
      const aggParams = new URLSearchParams({
        campus: currentCampus,
        year: String(selectedYear),
      })

      const aggRes = await fetch(
        `${buildApiUrl('/teaching-quality/reputation-keypoint-yearly-aggregate')}?${aggParams.toString()}`,
      )
      if (!aggRes.ok) throw new Error(await aggRes.text())

      const aggData = (await aggRes.json()) as {
        神殿名称: string
        年份: number
        行列表: Array<{
          月份: number
          类别: string
          朋友圈数量: number
          抖音数量: number
          快手数量: number
          小红书数量: number
          在校生访谈: number
          毕业生访谈: number
          家长访谈: number
          活动次数: number
          比赛次数: number
          送考报名次: number
        }>
      }

      const aggMap = new Map<string, (typeof aggData.行列表)[number]>()
      for (const r of aggData.行列表 || []) {
        const m = Number(r.月份)
        const t = String(r.类别 || '').trim()
        if (!m || !t) continue
        aggMap.set(`${m}__${t}`, r)
      }

      // 2. 生成表格数据：所有数据均从自动汇总接口获取
      for (let month = 1; month <= 12; month++) {
        if (!aggByMonthTeacher.has(month)) aggByMonthTeacher.set(month, new Map())
        const teacherAggMap = aggByMonthTeacher.get(month)!

        for (const teacher of rosterNames) {
          const key = `${month}__${teacher}`
          const aggRow = aggMap.get(key)
          
          if (!teacherAggMap.has(teacher)) teacherAggMap.set(teacher, initAgg())
          const agg = teacherAggMap.get(teacher)!

          // 所有数据均从自动汇总接口获取
          agg.wechatMoments = Number(aggRow?.朋友圈数量 || 0)
          agg.douyin = Number(aggRow?.抖音数量 || 0)
          agg.kuaishou = Number(aggRow?.快手数量 || 0)
          agg.xiaohongshu = Number(aggRow?.小红书数量 || 0)
          agg.onlineTotal = agg.wechatMoments + agg.douyin + agg.kuaishou + agg.xiaohongshu

          agg.currentStudentInterview = Number(aggRow?.在校生访谈 || 0)
          agg.graduateInterview = Number(aggRow?.毕业生访谈 || 0)
          agg.parentInterview = Number(aggRow?.家长访谈 || 0)

          agg.activityCount = Number(aggRow?.活动次数 || 0)
          agg.competitionCount = Number(aggRow?.比赛次数 || 0)
          agg.examRegistrationCount = Number(aggRow?.送考报名次 || 0)
        }
      }

      // 生成表格行
      const rows: MonthlyReputationKeypointRecord[] = [];
      for (let m = 1; m <= 12; m++) {
        rows.push({
          key: `${m}-total`,
          month: m,
          campus: '',
          teacherName: '合计',
          wechatMoments: 0,
          douyin: 0,
          kuaishou: 0,
          xiaohongshu: 0,
          onlineTotal: 0,
          currentStudentInterview: 0,
          graduateInterview: 0,
          parentInterview: 0,
          interviewTotal: 0,
          activityCount: 0,
          competitionCount: 0,
          examRegistrationCount: 0,
          activityTotal: 0,
          rowType: 'monthTotal',
        });

        const monthMap = aggByMonthTeacher.get(m) || new Map<string, Agg>();
        const names = rosterNames.length > 0 ? rosterNames : Array.from(monthMap.keys());
        names.forEach((name) => {
          const a = monthMap.get(name) || initAgg();

          // onlineTotal 来自“当天合计”汇总（而不是四个平台字段之和）
          // 注意：onlineTotal 用 self-check 的“当天合计”汇总值（四个平台字段暂无法自动拆分）
          const record = calculateRowTotals({
            key: `${m}-${name}`,
            month: m,
            campus: '',
            teacherName: name,
            wechatMoments: a.wechatMoments,
            douyin: a.douyin,
            kuaishou: a.kuaishou,
            xiaohongshu: a.xiaohongshu,
            onlineTotal: a.onlineTotal,
            currentStudentInterview: a.currentStudentInterview,
            graduateInterview: a.graduateInterview,
            parentInterview: a.parentInterview,
            interviewTotal: 0,
            activityCount: a.activityCount,
            competitionCount: a.competitionCount,
            examRegistrationCount: a.examRegistrationCount,
            activityTotal: 0,
            rowType: 'data',
          });

          rows.push(record);
        });
      }

      setDataSource(rows);
    } catch (e: any) {
      console.error('[reputation-keypoint-yearly] 加载异常:', e);
      message.error('加载失败: ' + (e?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 保存到后端（按年覆盖）
  const saveYearly = async () => {
    if (!currentCampus) { message.warning('请选择神殿'); return; }
    if (saving) { console.log('[reputation-keypoint-yearly] 保存进行中，忽略重复点击'); return; }
    setSaving(true);
    try {
      const payload = {
        神殿名称: currentCampus,
        年份: selectedYear,
        行列表: dataSource
          .filter(r => r.rowType === 'data')
          .map(r => ({
            月份: Number(r.month),
            类别: r.teacherName, // 班主任姓名
            朋友圈数量: r.wechatMoments || 0,
            抖音数量: r.douyin || 0,
            快手数量: r.kuaishou || 0,
            小红书数量: r.xiaohongshu || 0,
            在校生访谈: r.currentStudentInterview || 0,
            毕业生访谈: r.graduateInterview || 0,
            家长访谈: r.parentInterview || 0,
            活动次数: r.activityCount || 0,
            比赛次数: r.competitionCount || 0,
            送考报名次: r.examRegistrationCount || 0,
          })),
      };
      
      console.log('保存请求 payload:', payload);
      
      const res = await fetch(buildApiUrl('/teaching-quality/reputation-keypoint-yearly'), {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload)
      });
      
      console.log('[reputation-keypoint-yearly] 保存响应状态:', res.status, res.statusText);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('[reputation-keypoint-yearly] 保存失败响应:', errorText);
        throw new Error(errorText || `HTTP ${res.status}`);
      }
      
      // 读取并解析 JSON 响应
      const responseData = await res.json();
      console.log('[reputation-keypoint-yearly] 保存响应数据:', responseData);
      
      message.success('保存成功');
      setEditMode(false);
      
      // 触发父组件的回调（刷新汇总表）
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      
      // 延迟重新加载，避免立即请求导致卡顿
      setTimeout(() => {
        loadYearly();
      }, 300);
    } catch (e: any) {
      console.error('保存异常:', e);
      message.error('保存失败: ' + (e?.message || '未知错误'));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { loadYearly(); }, [currentCampus, selectedYear]);

  // 处理刷新
  const handleRefresh = () => { loadYearly(); };

  // 处理导出
  const handleExport = () => {
    message.info('导出功能开发中...');
  };

  // 处理保存
  const handleSave = () => {
    // 与汇总表一致：保存到后端并回读
    saveYearly();
  };

  // 处理编辑模式切换
  const handleEditToggle = () => {
    setEditMode(!editMode);
  };



  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Title level={4} style={{ margin: 0 }}>
            {currentCampus || 'XX神殿'}教化司口碑招生关键点结果汇总表（年度明细）
          </Title>
        }
        extra={
          <Space>
            <Select
              style={{ width: 120 }}
              value={selectedYear}
              onChange={(value) => setSelectedYear(value)}
            >
              <Option value={2023}>2023年</Option>
              <Option value={2024}>2024年</Option>
              <Option value={2025}>2025年</Option>
            </Select>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
            >
              保存
            </Button>
            <Button
              icon={<EditOutlined />}
              onClick={handleEditToggle}
            >
              {editMode ? '退出编辑' : '编辑'}
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              导出
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '4px' }}>
          <div style={{ fontSize: '14px', color: '#666' }}>
            <strong>数据来源说明：</strong>
            <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
              <li>所有数据均从"口碑招生计划与执行统计表"自动汇总生成</li>
              <li>包括：朋友圈、抖音、快手、小红书、在校生访谈、毕业生访谈、家长访谈、活动次数、比赛次数、送喜报人次</li>
            </ul>
          </div>
        </div>

        <Table
          className="reputation-keypoint-yearly-table"
          columns={columns}
          dataSource={fullDataSource}
          loading={loading}
          pagination={false}
          bordered
          scroll={{ x: 1200, y: 800 }}
          size="small"
          rowKey="key"
          rowClassName={(record) => {
            if (record.rowType === 'total') return 'total-row';
            if (record.rowType === 'monthTotal') return 'month-total-row';
            return '';
          }}
        />

        <style>{`
          .reputation-keypoint-yearly-table .ant-table-thead > tr > th {
            padding: 4px 4px !important;
            font-size: 12px;
            line-height: 1.1;
            white-space: nowrap;
          }
          .reputation-keypoint-yearly-table .ant-table-tbody > tr > td {
            padding: 4px 4px !important;
            font-size: 12px;
          }
          .reputation-keypoint-yearly-table .total-row {
            background-color: #fff7e6 !important;
            font-weight: bold;
          }
          .reputation-keypoint-yearly-table .total-row td {
            background-color: #fff7e6 !important;
          }
          .reputation-keypoint-yearly-table .month-total-row {
            background-color: #f0f9ff !important;
            font-weight: 600;
          }
          .reputation-keypoint-yearly-table .month-total-row td {
            background-color: #f0f9ff !important;
          }
        `}</style>

      </Card>
    </div>
  );
};

export default MonthlyReputationKeypointSummary;

