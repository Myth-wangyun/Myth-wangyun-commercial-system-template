import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { App,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Select,
  DatePicker,
  Space,
  Popconfirm,
  Typography,
  AutoComplete,
  InputNumber,
  Alert,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useCampusStore } from '@/stores/campusStore';
import { MAJOR_LIST, PROGRAM_LENGTHS } from '@/pages/academic/teaching-content/constants';
import CampusSelector from '@/components/common/CampusSelector';
import { fetchTeachers } from '@/services/configMaster';
import { fetchClasses } from '@/services/configMaster';
import {
  getTeacherEmploymentSummaries,
  createTeacherEmploymentSummary,
  updateTeacherEmploymentSummary,
  deleteTeacherEmploymentSummary,
  autoFillTeacherEmploymentSummary,
  autoStatisticsSingle,
  autoGenerateFromAssignments,
  type TeacherEmploymentSummary,
} from '@/services/teacherEmploymentSummary';
import { teacherEmploymentSummaryService } from '@/services/teacherEmploymentSummary';

const { Title } = Typography;
const { Option } = Select;

type ClassEntry = {
  id: string;
  className: string;
  graduationDate: string;
};

type MajorProgramEntry = {
  id: string;
  major: string;
  programLength: string;
  classes: ClassEntry[];
};

type TeacherGroup = {
  id: string;
  teacherName: string;
  majorPrograms: MajorProgramEntry[];
};

type TableRow =
  | {
      rowType: 'class';
      groupId: string;
      majorProgramId: string;
      serialNumber: number | '';
      teacherName: string;
      major: string;
      programLength: string;
      className: string;
      graduationDate: string;
      汇总ID?: number;
      目标平均就业薪资?: number;
      实际平均就业薪资?: number;
      达标率?: number;
      目标就业人数?: number;
      实际就业人数?: number;
      就业率?: number;
      薪资过万人数?: number;
    }
  | {
      rowType: 'summary';
      groupId: string;
      serialNumber: '';
      teacherName: '';
      major: '合计/平均';
      programLength: '';
      className: '';
      graduationDate: '';
      汇总ID?: number;
      目标平均就业薪资?: number;
      实际平均就业薪资?: number;
      达标率?: number;
      目标就业人数?: number;
      实际就业人数?: number;
      就业率?: number;
      薪资过万人数?: number;
    };

interface TeacherFormValues {
  teacherName: string;
  majorPrograms: Array<{
    major: string;
    programLength: string;
    classes: Array<{
      className: string;
      graduationDate: dayjs.Dayjs | null;
    }>;
  }>;
}

/* const DEFAULT_GROUPS: TeacherGroup[] = [
  {
    id: 'teacher-1',
    teacherName: '闫梦雷',
    majorPrograms: [
      {
        id: 'teacher-1-mp-1',
        major: '云计算',
        programLength: '6个月',
        classes: [
          { id: 'teacher-1-1', className: 'Y32', graduationDate: '' },
        ],
      },
      {
        id: 'teacher-1-mp-2',
        major: '网络云运维',
        programLength: '20个月',
        classes: [
          { id: 'teacher-1-2', className: '161', graduationDate: '' },
        ],
      },
      {
        id: 'teacher-1-mp-3',
        major: '云计算',
        programLength: '6个月',
        classes: [
          { id: 'teacher-1-3', className: 'Y34', graduationDate: '' },
        ],
      },
    ],
  },
  {
    id: 'teacher-2',
    teacherName: '李新福',
    majorPrograms: [
      {
        id: 'teacher-2-mp-1',
        major: '云计算',
        programLength: '6个月',
        classes: [
          { id: 'teacher-2-1', className: 'Y32', graduationDate: '' },
        ],
      },
      {
        id: 'teacher-2-mp-2',
        major: '网络云运维',
        programLength: '20个月',
        classes: [
          { id: 'teacher-2-2', className: '161', graduationDate: '' },
        ],
      },
      {
        id: 'teacher-2-mp-3',
        major: '云计算',
        programLength: '6个月',
        classes: [
          { id: 'teacher-2-3', className: 'Y34', graduationDate: '' },
        ],
      },
    ],
  },
  {
    id: 'teacher-3',
    teacherName: '刘泽龙',
    majorPrograms: [
      {
        id: 'teacher-3-mp-1',
        major: '云计算',
        programLength: '6个月',
        classes: [
          { id: 'teacher-3-1', className: 'Y32', graduationDate: '' },
        ],
      },
      {
        id: 'teacher-3-mp-2',
        major: '网络云运维',
        programLength: '20个月',
        classes: [
          { id: 'teacher-3-2', className: '161', graduationDate: '' },
        ],
      },
      {
        id: 'teacher-3-mp-3',
        major: '云计算',
        programLength: '6个月',
        classes: [
          { id: 'teacher-3-3', className: 'Y34', graduationDate: '' },
        ],
      },
    ],
  },
  {
    id: 'teacher-4',
    teacherName: '李建峰',
    majorPrograms: [
      {
        id: 'teacher-4-mp-1',
        major: '云计算',
        programLength: '6个月',
        classes: [
          { id: 'teacher-4-1', className: 'Y32', graduationDate: '' },
        ],
      },
      {
        id: 'teacher-4-mp-2',
        major: '网络云运维',
        programLength: '20个月',
        classes: [
          { id: 'teacher-4-2', className: '161', graduationDate: '' },
        ],
      },
      {
        id: 'teacher-4-mp-3',
        major: '云计算',
        programLength: '6个月',
        classes: [
          { id: 'teacher-4-3', className: 'Y34', graduationDate: '' },
        ],
      },
    ],
  },
]; */

const CampusTeacherEmploymentSummary: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore();
  const allCampuses = getAllCampuses();
  const defaultCampus = allCampuses[0]?.name ?? '主神殿';
  const activeCampus = currentCampus ?? defaultCampus;
  
  // 如果当前神殿为空，设置默认神殿
  useEffect(() => {
    if (!currentCampus && defaultCampus) {
      setCampus(defaultCampus);
    }
  }, [currentCampus, defaultCampus, setCampus]);

  const [groups, setGroups] = useState<TeacherGroup[]>([]);
  const [backendData, setBackendData] = useState<TeacherEmploymentSummary[]>([]);
  const [teacherNames, setTeacherNames] = useState<string[]>([]);
  const [classNames, setClassNames] = useState<string[]>([]);
  // 班级 -> 学制 映射（从配置中心读取）
  const [classProgramLengthMap, setClassProgramLengthMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TeacherGroup | null>(null);
  const [form] = Form.useForm<TeacherFormValues>();
  const [dataEditVisible, setDataEditVisible] = useState(false);
  const [dataEditLoading, setDataEditLoading] = useState(false);
  const [dataEditRow, setDataEditRow] = useState<TableRow | null>(null);
  const [dataForm] = Form.useForm();
  
  // 年份筛选相关状态
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const isHistoricalMode = selectedYear === 'all';
  const [historicalStats, setHistoricalStats] = useState<any>(null);

  // 加载教员列表
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const teachers = await fetchTeachers({
          active: true,
          participate_kpi: true,
        });
        // 后端返回的 TeacherProfile 有 campus_name 字段，但前端接口定义的是 campus_code
        // 需要根据实际情况过滤，如果没有 campus_name 则显示所有教员
        const names = teachers
          .map(t => t.name)
          .filter((name): name is string => !!name);
        
        // 去重
        const uniqueNames = Array.from(new Set(names));
        setTeacherNames(uniqueNames);
        console.log('[教员就业汇总] 加载教员列表:', { activeCampus, names: uniqueNames, count: uniqueNames.length });
      } catch (error) {
        console.error('[教员就业汇总] 加载教员列表失败:', error);
      }
    };
    loadTeachers();
  }, [activeCampus]);

  // 加载班级列表
  useEffect(() => {
    const loadClasses = async () => {
      try {
        // 配置中心：班级管理（/config/classes）
        const classes = await fetchClasses({ campus_name: activeCampus, active: true });
        const norm = (v: any) => (v ?? '').toString().trim();
        const campusClasses = classes.filter((c) => norm(c.campus_name) === norm(activeCampus));

        const programLengthMap: Record<string, string> = {};
        campusClasses.forEach((c) => {
          if (c.class_name) {
            programLengthMap[c.class_name] = (c.program_length ?? '').toString().trim();
          }
        });

        const uniqueNames = Array.from(new Set(Object.keys(programLengthMap)));
        setClassNames(uniqueNames);
        setClassProgramLengthMap(programLengthMap);

        console.log('[教员就业汇总] 加载班级列表(含学制):', {
          activeCampus,
          count: uniqueNames.length,
          sample: uniqueNames.slice(0, 5).map((n) => ({ className: n, programLength: programLengthMap[n] })),
        });
      } catch (error) {
        console.error('[教员就业汇总] 加载班级列表失败:', error);
        setClassNames([]);
        setClassProgramLengthMap({});
      }
    };
    loadClasses();
  }, [activeCampus]);

  // 加载可用年份列表
  const loadAvailableYears = useCallback(async () => {
    try {
      const years = await teacherEmploymentSummaryService.getAvailableYears(activeCampus);
      setAvailableYears(years);
      // 如果当前选择的年份不在可用年份列表中，切换到最新年份
      if (selectedYear !== 'all' && years.length > 0 && !years.includes(selectedYear as number)) {
        setSelectedYear(years[0]);
      }
    } catch (error) {
      console.error('[教员就业汇总] 加载可用年份失败:', error);
    }
  }, [activeCampus, selectedYear]);

  // 加载历史汇总数据
  const loadHistoricalData = useCallback(async () => {
    try {
      const data = await teacherEmploymentSummaryService.getHistoricalSummary(activeCampus);
      setHistoricalStats(data);
      console.log('[教员就业汇总] 历史汇总数据:', data);
    } catch (error) {
      console.error('[教员就业汇总] 加载历史汇总数据失败:', error);
    }
  }, [activeCampus]);

  // 从后端加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 加载可用年份
      await loadAvailableYears();
      
      if (isHistoricalMode) {
        // 历史合计模式：加载所有数据（不限年份），用于显示每个教员的历史累加
        const data = await getTeacherEmploymentSummaries(activeCampus);
        setBackendData(data);
        console.log('[教员就业汇总] 历史合计模式加载数据:', { activeCampus, data, count: data.length });
        
        // 将后端数据转换为前端格式
        const convertedGroups = convertBackendDataToGroups(data, activeCampus);
        setGroups(convertedGroups);
        
        // 同时加载汇总统计
        await loadHistoricalData();
      } else {
        // 普通模式：加载指定年份数据
        const data = await getTeacherEmploymentSummaries(activeCampus, undefined, undefined, selectedYear as number);
        setBackendData(data);
        console.log('[教员就业汇总] 从后端加载数据:', { activeCampus, selectedYear, data, count: data.length });
        
        // 将后端数据转换为前端格式
        const convertedGroups = convertBackendDataToGroups(data, activeCampus);
        setGroups(convertedGroups);
      }
    } catch (error) {
      console.error('[教员就业汇总] 加载数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [activeCampus, selectedYear, isHistoricalMode, loadAvailableYears, loadHistoricalData]);

  // 加载数据
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 将后端数据转换为前端格式：按“教员”聚合，一个教员下可有多个(专业+学制)及多个班级
  const convertBackendDataToGroups = (data: TeacherEmploymentSummary[], campusFilter?: string): TeacherGroup[] => {
    const norm = (v: string) => (v || '').trim();
    const filtered = campusFilter ? data.filter(item => norm(item.神殿) === norm(campusFilter)) : data;

    // key: teacherName
    const groupMap = new Map<string, TeacherGroup>();

    filtered.forEach((item) => {
      const teacherKey = norm(item.教员姓名);
      if (!groupMap.has(teacherKey)) {
        groupMap.set(teacherKey, {
          id: `teacher-${teacherKey || item.汇总ID || Date.now()}`,
          teacherName: item.教员姓名,
          majorPrograms: [],
        });
      }

      const group = groupMap.get(teacherKey)!;

      const major = norm(item.专业);
      const programLength = normProgram(item.学制);
      const mpKey = `${major}__${programLength}`;

      let mp = group.majorPrograms.find((m) => `${norm(m.major)}__${normProgram(m.programLength)}` === mpKey);
      if (!mp) {
        mp = {
          id: `mp-${teacherKey}-${major}-${programLength}`,
          major: item.专业,
          programLength,
          classes: [],
        };
        group.majorPrograms.push(mp);
      }

      // 避免重复 class
      const className = norm(item.班级名称);
      const exists = mp.classes.some((c) => norm(c.className) === className);
      if (!exists) {
        mp.classes.push({
          id: `cls-${item.汇总ID || Date.now()}`,
          className: item.班级名称,
          graduationDate: item.毕业时间 || '',
        });
      }
    });

    return Array.from(groupMap.values());
  };

  const MAX_RATE = 999.99;
  const calcRate = (numerator?: number | null, denominator?: number | null) => {
    const n = Number(numerator);
    const d = Number(denominator);
    if (!d || Number.isNaN(d) || d <= 0) return null;
    if (Number.isNaN(n)) return null;
    const rate = (n / d) * 100;
    if (!Number.isFinite(rate)) return null;
    const clamped = Math.min(rate, MAX_RATE);
    return Number(clamped.toFixed(2));
  };

  const normalize = (v: any) => (v ?? '').toString().trim();
  const normProgram = (v: any) => {
    const n = normalize(v);
    return n || '未知';
  };

  const isSameRecord = (a: any, b: any) => {
    return (
      normalize(a.神殿) === normalize(b.神殿) &&
      normalize(a.教员姓名) === normalize(b.教员姓名) &&
      normalize(a.专业) === normalize(b.专业) &&
      normProgram(a.学制) === normProgram(b.学制) &&
      normalize(a.班级名称) === normalize(b.班级名称)
    );
  };

  // 向后端查询是否已有同键记录，返回汇总ID 或 null
  const findExistingIdOnServer = async (payload: {
    神殿: string;
    教员姓名: string;
    专业: string;
    学制: string;
    班级名称: string;
  }) => {
    // 拉取该神殿全部数据，避免过滤条件遗漏专业/学制导致匹配不到
    const list = await getTeacherEmploymentSummaries(payload.神殿);
    const found = list.find((item) => isSameRecord(item, payload));
    return found?.汇总ID ?? null;
  };

  // 统一刷新后端数据并转换
  const refreshDataFromServer = async () => {
    const data = await getTeacherEmploymentSummaries(activeCampus);
    setBackendData(data);
    const convertedGroups = convertBackendDataToGroups(data, activeCampus);
    setGroups(convertedGroups);
  };

  const rows: TableRow[] = useMemo(() => {
    const safeGroups = Array.isArray(groups) ? groups : [];
    const flat: TableRow[] = [];
    const campusNorm = normalize(activeCampus);
    
    safeGroups.forEach((group, groupIndex) => {
      let isFirstTeacherRow = true;


      group.majorPrograms.forEach((mp) => {
        let isFirstMajorRow = true;

        mp.classes.forEach((cls) => {
          const backendItem = backendData.find(
            item =>
              normalize(item.教员姓名) === normalize(group.teacherName) &&
              normalize(item.专业) === normalize(mp.major) &&
              // 学制匹配：以配置中心为准（班级->学制），同时兼容后端存的学制
              (normProgram(item.学制) === normProgram(classProgramLengthMap[cls.className]) ||
                normProgram(item.学制) === normProgram(mp.programLength)) &&
              normalize(item.班级名称) === normalize(cls.className) &&
              normalize(item.神殿) === campusNorm,
          );

          flat.push({
            rowType: 'class',
            groupId: group.id,
            majorProgramId: mp.id,
            serialNumber: isFirstTeacherRow ? groupIndex + 1 : '',
            teacherName: isFirstTeacherRow ? group.teacherName : '',
            major: isFirstMajorRow ? mp.major : '',
            programLength: classProgramLengthMap[cls.className] || '未知',
            className: cls.className,
            graduationDate: cls.graduationDate,
            汇总ID: backendItem?.汇总ID,
            目标平均就业薪资: backendItem?.目标平均就业薪资,
            实际平均就业薪资: backendItem?.实际平均就业薪资,
            达标率: calcRate(backendItem?.实际平均就业薪资, backendItem?.目标平均就业薪资) ?? backendItem?.达标率,
            目标就业人数: backendItem?.目标就业人数,
            实际就业人数: backendItem?.实际就业人数,
            就业率: calcRate(backendItem?.实际就业人数, backendItem?.目标就业人数) ?? backendItem?.就业率,
            薪资过万人数: backendItem?.薪资过万人数,
          });

          isFirstTeacherRow = false;
          isFirstMajorRow = false;
        });
      });

      // 合计/平均：按“教员”汇总（该教员所有记录）
      const groupBackendItems = backendData.filter((item) => {
        if (normalize(item.神殿) !== campusNorm) return false;
        return normalize(item.教员姓名) === normalize(group.teacherName);
      });

      const totalTargetSalary = groupBackendItems.reduce((sum, item) => sum + (item.目标平均就业薪资 || 0), 0);
      const totalActualSalary = groupBackendItems.reduce((sum, item) => sum + (item.实际平均就业薪资 || 0), 0);
      const avgTargetSalary = groupBackendItems.length > 0 ? totalTargetSalary / groupBackendItems.length : 0;
      const avgActualSalary = groupBackendItems.length > 0 ? totalActualSalary / groupBackendItems.length : 0;
      const totalTargetCount = groupBackendItems.reduce((sum, item) => sum + (item.目标就业人数 || 0), 0);
      const totalActualCount = groupBackendItems.reduce((sum, item) => sum + (item.实际就业人数 || 0), 0);
      const totalHighSalary = groupBackendItems.reduce((sum, item) => sum + (item.薪资过万人数 || 0), 0);

      flat.push({
        rowType: 'summary',
        groupId: group.id,
        serialNumber: '',
        teacherName: '',
        major: '合计/平均',
        programLength: '',
        className: '',
        graduationDate: '',
        目标平均就业薪资: avgTargetSalary,
        实际平均就业薪资: avgActualSalary,
        达标率: calcRate(avgActualSalary, avgTargetSalary),
        目标就业人数: totalTargetCount,
        实际就业人数: totalActualCount,
        就业率: calcRate(totalActualCount, totalTargetCount),
        薪资过万人数: totalHighSalary,
      });
    });
    
    return flat;
  }, [groups, backendData, activeCampus]);

  const openModal = (group?: TeacherGroup) => {
    setEditingGroup(group ?? null);
    form.resetFields();
    form.setFieldsValue({
      teacherName: group?.teacherName ?? '',
      majorPrograms:
        group?.majorPrograms.map(mp => ({
          major: mp.major,
          programLength: mp.programLength,
          classes: mp.classes.map(cls => ({
            className: cls.className,
            graduationDate: cls.graduationDate ? dayjs(cls.graduationDate) : null,
          })),
        })) ?? [
          {
            major: MAJOR_LIST[0],
            programLength: PROGRAM_LENGTHS[0],
            classes: [
              {
                className: '',
                graduationDate: null,
              },
            ],
          },
        ],
    });
    setModalVisible(true);
  };

  // 打开数据编辑弹窗（仅修改就业字段，不改关联）
  const openDataEditModal = (row: TableRow) => {
    if (row.rowType !== 'class') return;
    setDataEditRow(row);
    dataForm.setFieldsValue({
      graduationDate: row.graduationDate ? dayjs(row.graduationDate) : null,
      targetAverageSalary: row.目标平均就业薪资 ?? null,
      actualAverageSalary: row.实际平均就业薪资 ?? null,
      targetEmploymentCount: row.目标就业人数 ?? null,
      actualEmploymentCount: row.实际就业人数 ?? null,
      salaryOverTenThousand: row.薪资过万人数 ?? null,
    });
    setDataEditVisible(true);
  };

  const handleDataEditSave = async () => {
    if (!dataEditRow || dataEditRow.rowType !== 'class') return;
    // 辅助：根据 row 找到教员/专业/学制
    const findGroupAndMp = () => {
      const group = groups.find((g) => g.id === dataEditRow.groupId);
      const mp = group?.majorPrograms.find((m) => m.id === dataEditRow.majorProgramId);
      return { group, mp };
    };
    try {
      const values = await dataForm.validateFields();
      setDataEditLoading(true);
      const { group, mp } = findGroupAndMp();
      const payload = {
        神殿: activeCampus,
        教员姓名: normalize(group?.teacherName || dataEditRow.teacherName || ''),
        专业: normalize(mp?.major || dataEditRow.major || ''),
        学制: normProgram(mp?.programLength || dataEditRow.programLength || ''),
        班级名称: normalize(dataEditRow.className),
        毕业时间: values.graduationDate ? values.graduationDate.format('YYYY-MM-DD') : dataEditRow.graduationDate || null,
        目标平均就业薪资: values.targetAverageSalary ?? null,
        实际平均就业薪资: values.actualAverageSalary ?? null,
        目标就业人数: values.targetEmploymentCount ?? null,
        实际就业人数: values.actualEmploymentCount ?? null,
        达标率: calcRate(values.actualAverageSalary, values.targetAverageSalary),
        就业率: calcRate(values.actualEmploymentCount, values.targetEmploymentCount),
        薪资过万人数: values.salaryOverTenThousand ?? null,
      };

      const teacherName = payload.教员姓名;
      const major = payload.专业;
      const className = payload.班级名称;
      const programLength = payload.学制 || classProgramLengthMap[payload.班级名称] || '未知';
      payload.学制 = programLength;

      // 优先用当前行 ID 更新；404 时再按键重查更新；仍无则新建
      const tryUpdateById = async (id?: number | null) => {
        if (!id) return false;
        try {
          await updateTeacherEmploymentSummary(activeCampus, id, payload);
          return true;
        } catch (err: any) {
          if (err?.response?.status === 404) return false;
          throw err;
        }
      };

      const updated =
        (await tryUpdateById(dataEditRow.汇总ID)) ||
        (await (async () => {
          const sid = await findExistingIdOnServer(payload);
          if (!sid) return false;
          try {
            await updateTeacherEmploymentSummary(activeCampus, sid, payload);
            return true;
          } catch (err: any) {
            if (err?.response?.status === 404) return false;
            throw err;
          }
        })());

      if (!updated) {
        await createTeacherEmploymentSummary(activeCampus, payload);
        message.success('已新增记录');
      } else {
        message.success('数据已更新');
      }

      setDataEditVisible(false);
      setDataEditRow(null);
      await refreshDataFromServer();
    } catch (error: any) {
      if (!error?.errorFields) {
        message.error('保存失败');
      }
    } finally {
      setDataEditLoading(false);
    }
  };

  const handleDataEditCancel = () => {
    setDataEditVisible(false);
    setDataEditRow(null);
    dataForm.resetFields();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // 保存到后端
      try {
        const norm = (v: any) => (v ?? '').toString().trim();
        for (const mp of values.majorPrograms) {
          for (const cls of mp.classes) {
            const teacherName = normalize(values.teacherName);
            const major = normalize(mp.major);
            const className = normalize(cls.className);
            let programLength = normProgram(mp.programLength);
            if (!programLength || programLength === '未知') {
              programLength = classProgramLengthMap[className] || '未知';
            }

            // 先精准匹配，再宽松匹配（学制为空视为同一组）
            let existingItem = backendData.find(
              item =>
                norm(item.教员姓名) === teacherName &&
                norm(item.专业) === major &&
                norm(item.学制) === programLength &&
                norm(item.班级名称) === className,
            );
            if (!existingItem) {
              existingItem = backendData.find(
                item =>
                  norm(item.教员姓名) === teacherName &&
                  norm(item.专业) === major &&
                  norm(item.班级名称) === className &&
                  (norm(item.学制) === '' || norm(item.学制) === '未知'),
              );
            }
            
            const payload: Omit<TeacherEmploymentSummary, '汇总ID' | '创建时间' | '更新时间'> = {
              神殿: activeCampus,
              教员姓名: teacherName,
              专业: major,
              学制: programLength || '未知',
              班级名称: className,
              毕业时间: cls.graduationDate ? cls.graduationDate.format('YYYY-MM') : undefined,
            };
            
            const serverId = existingItem?.汇总ID || (await findExistingIdOnServer(payload));
            if (serverId) {
              await updateTeacherEmploymentSummary(activeCampus, serverId, payload);
            } else {
              await createTeacherEmploymentSummary(activeCampus, payload);
            }
          }
        }
        
        message.success(editingGroup ? '更新成功' : '添加成功');
        
        // 重新加载数据
        const data = await getTeacherEmploymentSummaries(activeCampus);
        setBackendData(data);
        const convertedGroups = convertBackendDataToGroups(data, activeCampus);
        setGroups(convertedGroups);
        
        setModalVisible(false);
        setEditingGroup(null);
        form.resetFields();
      } catch (error) {
        console.error('[教员就业汇总] 保存失败:', error);
        message.error('保存失败，请重试');
      }
    } catch {
      // ignore validation
    }
  };

  const handleDelete = async (groupId: string) => {
    try {
      const group = groups.find(g => g.id === groupId);
      if (!group) return;
      
      // 删除该教员的所有后端记录
      const itemsToDelete = backendData.filter((item) => {
        if (normalize(item.神殿) !== normalize(activeCampus)) return false;
        if (normalize(item.教员姓名) !== normalize(group.teacherName)) return false;
        return group.majorPrograms.some((mp) => {
          const matchesMajor = normalize(item.专业) === normalize(mp.major);
          const matchesProgram = normProgram(item.学制) === normProgram(mp.programLength);
          const matchesClass = mp.classes.some((cls) => normalize(item.班级名称) === normalize(cls.className));
          return matchesMajor && matchesProgram && matchesClass;
        });
      });
      for (const item of itemsToDelete) {
        if (item.汇总ID) {
          await deleteTeacherEmploymentSummary(activeCampus, item.汇总ID);
        }
      }
      
      // 重新加载数据
      const data = await getTeacherEmploymentSummaries(activeCampus);
      setBackendData(data);
      const convertedGroups = convertBackendDataToGroups(data, activeCampus);
      setGroups(convertedGroups);
      
      message.success('删除成功');
    } catch (error) {
      console.error('[教员就业汇总] 删除失败:', error);
      message.error('删除失败，请重试');
    }
  };

  // 自动填充功能
  const handleAutoFill = async () => {
    try {
      setLoading(true);
      message.loading({ content: '正在自动填充数据...', key: 'autoFill' });
      
      const result = await autoFillTeacherEmploymentSummary({
        神殿: activeCampus,
      });
      
      message.success({ 
        content: `自动填充完成，处理了 ${result.处理数量} 条记录`, 
        key: 'autoFill',
        duration: 3,
      });
      
      // 重新加载数据
      const data = await getTeacherEmploymentSummaries(activeCampus);
      setBackendData(data);
      const convertedGroups = convertBackendDataToGroups(data, activeCampus);
      setGroups(convertedGroups);
    } catch (error) {
      console.error('[教员就业汇总] 自动填充失败:', error);
      message.error({ content: '自动填充失败，请重试', key: 'autoFill' });
    } finally {
      setLoading(false);
    }
  };

  // 根据教员-班级关联自动生成表格
  const handleAutoGenerate = async () => {
    try {
      setLoading(true);
      message.loading({ content: '正在根据教员-班级关联自动生成表格...', key: 'autoGenerate' });
      
      const result = await autoGenerateFromAssignments(activeCampus);
      
      message.success({ 
        content: `自动生成完成！创建了 ${result.创建数量} 条记录，更新了 ${result.更新数量} 条记录`, 
        key: 'autoGenerate',
        duration: 5,
      });
      
      // 重新加载数据
      const data = await getTeacherEmploymentSummaries(activeCampus);
      setBackendData(data);
      const convertedGroups = convertBackendDataToGroups(data, activeCampus);
      setGroups(convertedGroups);
      
      console.log('[教员就业汇总] 自动生成表格结果:', result);
    } catch (error) {
      console.error('[教员就业汇总] 自动生成表格失败:', error);
      message.error({ content: '自动生成表格失败，请重试', key: 'autoGenerate' });
    } finally {
      setLoading(false);
    }
  };

  // 自动统计单个班级
  const handleAutoStatistics = async (teacherName: string, className: string) => {
    try {
      const stats = await autoStatisticsSingle(activeCampus, teacherName, className);
      
      // 查找对应的记录并更新
      const existingItem = backendData.find(
        item => item.教员姓名 === teacherName && item.班级名称 === className
      );
      
      if (existingItem && existingItem.汇总ID) {
        await updateTeacherEmploymentSummary(activeCampus, existingItem.汇总ID, {
          实际就业人数: stats.实际就业人数,
          实际平均就业薪资: stats.实际平均就业薪资,
          薪资过万人数: stats.薪资过万人数,
        });
        
        // 重新加载数据
        const data = await getTeacherEmploymentSummaries(activeCampus);
        setBackendData(data);
        const convertedGroups = convertBackendDataToGroups(data, activeCampus);
        setGroups(convertedGroups);
        
        message.success('统计完成');
      } else {
        message.warning('未找到对应记录，请先添加该教员班级数据');
      }
    } catch (error) {
      console.error('[教员就业汇总] 自动统计失败:', error);
      message.error('自动统计失败，请重试');
    }
  };

  const columns: ColumnsType<TableRow> = [
    { 
      title: '序号', 
      dataIndex: 'serialNumber', 
      key: 'serialNumber', 
      width: 70, 
      align: 'center',
      onCell: (record) => {
        if (record.rowType === 'class' && record.serialNumber !== '') {
          // 计算该教员的总行数（包括合计行）
          const group = groups.find(g => g.id === record.groupId);
          if (group) {
            const totalClasses = group.majorPrograms.reduce((sum, mp) => sum + mp.classes.length, 0);
            return { rowSpan: totalClasses + 1 }; // +1 for summary row
          }
        }
        if (record.rowType === 'class' && record.serialNumber === '') {
          return { rowSpan: 0 };
        }
        if (record.rowType === 'summary') {
          return { rowSpan: 0 };
        }
        return {};
      },
    },
    { 
      title: '教员姓名', 
      dataIndex: 'teacherName', 
      key: 'teacherName', 
      width: 120, 
      align: 'center',
      onCell: (record) => {
        if (record.rowType === 'class' && record.teacherName !== '') {
          const group = groups.find(g => g.id === record.groupId);
          if (group) {
            const totalClasses = group.majorPrograms.reduce((sum, mp) => sum + mp.classes.length, 0);
            return { rowSpan: totalClasses + 1 };
          }
        }
        if (record.rowType === 'class' && record.teacherName === '') {
          return { rowSpan: 0 };
        }
        if (record.rowType === 'summary') {
          return { rowSpan: 0 };
        }
        return {};
      },
    },
    { 
      title: '专业', 
      dataIndex: 'major', 
      key: 'major', 
      width: 120, 
      align: 'center',
      onCell: (record) => {
        // 合计/平均行：不参与专业合并，避免出现“数据整体左移一格/列错位”
        if (record.rowType === 'summary') return { colSpan: 2 };

        if (record.rowType === 'class' && record.major !== '') {
          const group = groups.find(g => g.id === record.groupId);
          const mp = group?.majorPrograms.find(m => m.id === record.majorProgramId);
          if (mp) {
            return { rowSpan: mp.classes.length };
          }
        }
        if (record.rowType === 'class' && record.major === '') {
          return { rowSpan: 0 };
        }
        return {};
      },
    },
    { 
      title: '学制', 
      dataIndex: 'programLength', 
      key: 'programLength', 
      width: 100, 
      align: 'center',
      onCell: (record) => {
        // summary 行的“专业”单元格会 colSpan:2 覆盖到这里，这里必须把本列隐藏掉（colSpan:0）
        if (record.rowType === 'summary') return { colSpan: 0 };
        return {};
      },
    },
    {
      title: '班级名称',
      dataIndex: 'className',
      key: 'className',
      width: 120,
      align: 'center',
    },
    {
      title: '毕业时间',
      dataIndex: 'graduationDate',
      key: 'graduationDate',
      width: 120,
      align: 'center',
      render: (_, row) =>
        row.rowType === 'class' ? (row.graduationDate ? dayjs(row.graduationDate).format('YYYY-MM') : '') : '',
    },
    {
      title: '就业薪资',
      key: 'salaryGroup',
      align: 'center',
      children: [
        {
          title: '目标平均就业薪资',
          key: 'targetAverageSalary',
          width: 150,
          align: 'center',
          render: (_, row) => {
            if (row.rowType === 'summary') {
              return row.目标平均就业薪资 ? `¥${row.目标平均就业薪资.toFixed(0)}` : '-';
            }
            return row.目标平均就业薪资 ? `¥${row.目标平均就业薪资.toFixed(0)}` : '-';
          },
        },
        {
          title: '实际平均就业薪资',
          key: 'actualAverageSalary',
          width: 150,
          align: 'center',
          render: (_, row) => {
            if (row.rowType === 'summary') {
              return row.实际平均就业薪资 ? `¥${row.实际平均就业薪资.toFixed(0)}` : '-';
            }
            return row.实际平均就业薪资 ? `¥${row.实际平均就业薪资.toFixed(0)}` : '-';
          },
        },
        {
          title: '达标率',
          key: 'achievementRate',
          width: 120,
          align: 'center',
          render: (_, row) => {
            if (row.rowType === 'summary') {
              return row.达标率 !== null && row.达标率 !== undefined ? `${row.达标率.toFixed(2)}%` : '-';
            }
            return row.达标率 !== null && row.达标率 !== undefined ? `${row.达标率.toFixed(2)}%` : '-';
          },
        },
      ],
    },
    {
      title: '就业率',
      key: 'employmentGroup',
      align: 'center',
      children: [
        {
          title: '目标就业人数',
          key: 'targetEmploymentCount',
          width: 140,
          align: 'center',
          render: (_, row) => {
            if (row.rowType === 'summary') {
              return row.目标就业人数 ?? 0;
            }
            return row.目标就业人数 ?? '-';
          },
        },
        {
          title: '实际就业人数',
          key: 'actualEmploymentCount',
          width: 140,
          align: 'center',
          render: (_, row) => {
            if (row.rowType === 'summary') {
              return row.实际就业人数 ?? 0;
            }
            return row.实际就业人数 ?? '-';
          },
        },
        {
          title: '就业率',
          key: 'employmentRate',
          width: 120,
          align: 'center',
          render: (_, row) => {
            if (row.rowType === 'summary') {
              return row.就业率 !== null && row.就业率 !== undefined ? `${row.就业率.toFixed(2)}%` : '-';
            }
            return row.就业率 !== null && row.就业率 !== undefined ? `${row.就业率.toFixed(2)}%` : '-';
          },
        },
      ],
    },
    {
      title: '薪资过万人数',
      key: 'highSalaryCount',
      width: 140,
      align: 'center',
      render: (_, row) => {
        if (row.rowType === 'summary') {
          return row.薪资过万人数 ?? 0;
        }
        return row.薪资过万人数 ?? '-';
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 260,
      fixed: 'right',
      align: 'center',
      className: 'qm-actions-cell',
      onCell: () => ({ style: { paddingLeft: 8, paddingRight: 8 } }),
      render: (_, row) => {
        // 统一所有行的DOM结构，用 visibility:hidden 做占位，彻底解决按钮漂移/不对齐问题
        const isClassRow = row.rowType === 'class';
        const isSummaryRow = row.rowType === 'summary';

        // 用固定宽度的“占位块”包住每个按钮，保证每一行按钮起始位置一致
        const Slot: React.FC<{ visible: boolean; children: React.ReactNode; width?: number }> = ({
          visible,
          children,
          width = 76,
        }) => (
          <span
            style={{
              display: 'inline-flex',
              width,
              justifyContent: 'center',
              alignItems: 'center',
              flex: `0 0 ${width}px`,
              visibility: visible ? 'visible' : 'hidden',
            }}
          >
            {children}
          </span>
        );

        return (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            <Slot visible={isClassRow} width={76}>
              <Button type="link" size="small" onClick={() => openDataEditModal(row)}>
                编辑数据
              </Button>
            </Slot>

            <Slot visible={isClassRow || isSummaryRow} width={92}>
              <Button
                type="link"
                icon={<EditOutlined />}
                size="small"
                onClick={() => {
                  const group = groups.find(item => item.id === row.groupId);
                  if (group) {
                    openModal(group);
                  }
                }}
              >
                编辑配置
              </Button>
            </Slot>

            <Slot visible={isSummaryRow} width={68}>
              <Popconfirm title="确定删除该教员数据？" onConfirm={() => handleDelete(row.groupId)}>
                <Button type="link" icon={<DeleteOutlined />} danger size="small">
                  删除
                </Button>
              </Popconfirm>
            </Slot>
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <style>{`
        /* 修复 antd Table 在 rowSpan + fixed 列组合下，部分行 fixed-right 内容“掉回主表”导致跟随横向滚动的问题 */
        .qm-actions-cell.ant-table-cell-fix-right {
          position: sticky !important;
          right: 0 !important;
          z-index: 3;
          background: #fff;
        }
        .qm-actions-cell.ant-table-cell-fix-right-first {
          position: sticky !important;
          right: 0 !important;
          z-index: 3;
          background: #fff;
        }
      `}</style>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Title level={4} style={{ margin: 0 }}>
              {activeCampus}后端教员就业汇总表
            </Title>
            <Select
              value={selectedYear}
              onChange={(value) => setSelectedYear(value)}
              style={{ width: 120 }}
              options={[
                { label: '历史合计', value: 'all' },
                ...availableYears.map(year => ({ label: `${year}年`, value: year }))
              ]}
            />
          </div>
          <CampusSelector useGlobalState={true} />
        </div>

        {isHistoricalMode && (
          <Alert
            message="历史合计模式"
            description="当前显示所有年份的汇总统计数据，不显示明细列表。如需查看或编辑明细数据，请选择具体年份。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {isHistoricalMode && historicalStats && (
          <Card title="历史汇总统计" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              <div>
                <div style={{ color: '#666', fontSize: 12 }}>教员总数</div>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>{historicalStats.totalTeachers || 0}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: 12 }}>班级总数</div>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>{historicalStats.totalClasses || historicalStats.totalTeachers || 0}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: 12 }}>总目标就业人数</div>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>{historicalStats.totalTargetEmployment || 0}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: 12 }}>总实际就业人数</div>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>{historicalStats.totalActualEmployment || 0}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: 12 }}>平均就业率</div>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>{historicalStats.avgEmploymentRate != null ? `${historicalStats.avgEmploymentRate.toFixed(2)}%` : '-'}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: 12 }}>平均目标薪资</div>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>{historicalStats.avgTargetSalary ? `¥${historicalStats.avgTargetSalary.toFixed(0)}` : '-'}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: 12 }}>平均实际薪资</div>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>{historicalStats.avgActualSalary ? `¥${historicalStats.avgActualSalary.toFixed(0)}` : '-'}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: 12 }}>平均达标率</div>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>{historicalStats.avgAchievementRate != null ? `${historicalStats.avgAchievementRate.toFixed(2)}%` : '-'}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: 12 }}>薪资过万总人数</div>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>{historicalStats.totalHighSalary || 0}</div>
              </div>
            </div>
          </Card>
        )}

        {!isHistoricalMode && (
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
                添加教员数据
              </Button>
              <Button 
                type="default" 
                icon={<ReloadOutlined />} 
                onClick={handleAutoGenerate}
                loading={loading}
              >
                自动生成表格（从教员-班级关联）
              </Button>
            </Space>
          </div>
        )}

        <Table<TableRow>
          columns={isHistoricalMode ? columns.filter(col => col.key !== 'actions') : columns}
          dataSource={rows}
          bordered
          rowKey={(row, index) => (row.rowType === 'class' ? `${row.groupId}-${row.majorProgramId}-${row.className}-${index}` : `${row.groupId}-summary`)}
          pagination={false}
          scroll={{ x: 'max-content' }}
          loading={loading}
        />
      </Card>

      <Modal
        title={editingGroup ? '编辑教员数据' : '添加教员数据'}
        open={modalVisible}
        onCancel={() => {
          form.resetFields();
          setModalVisible(false);
          setEditingGroup(null);
        }}
        onOk={handleSave}
        destroyOnClose
        width={900}
      >
        <Form<TeacherFormValues> form={form} layout="vertical">
          <Form.Item
            label="教员姓名"
            name="teacherName"
            rules={[{ required: true, message: '请输入教员姓名' }]}
          >
            <AutoComplete
              placeholder="请输入或选择教员姓名"
              options={teacherNames.map(name => ({ value: name }))}
              filterOption={(inputValue, option) =>
                option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            />
          </Form.Item>

          <Form.List
            name="majorPrograms"
            rules={[
              {
                validator: async (_, value) => {
                  if (!value || value.length === 0) {
                    return Promise.reject(new Error('请至少添加一个专业学制组合'));
                  }
                },
              },
            ]}
          >
            {(mpFields, { add: addMp, remove: removeMp }) => (
              <>
                {mpFields.map((mpField, mpIndex) => (
                  <Card
                    key={mpField.key}
                    type="inner"
                    title={`专业学制组合 ${mpIndex + 1}`}
                    extra={
                      mpFields.length > 1 ? (
                        <Button type="link" danger onClick={() => removeMp(mpField.name)}>
                          删除组合
                        </Button>
                      ) : null
                    }
                    style={{ marginBottom: 16 }}
                  >
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                      <Form.Item
                        {...mpField}
                        label="专业"
                        name={[mpField.name, 'major']}
                        rules={[{ required: true, message: '请选择专业' }]}
                        style={{ flex: 1 }}
                      >
                        <Select placeholder="请选择专业">
                          {MAJOR_LIST.map(item => (
                            <Option key={item} value={item}>
                              {item}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...mpField}
                        label="学制"
                        name={[mpField.name, 'programLength']}
                        rules={[{ required: true, message: '请输入学制' }]}
                        style={{ flex: 1 }}
                      >
                        <AutoComplete
                          placeholder="请选择或输入学制"
                          options={PROGRAM_LENGTHS.map(item => ({ value: item, label: item }))}
                          filterOption={(inputValue, option) =>
                            option?.value.toLowerCase().includes(inputValue.toLowerCase()) ?? false
                          }
                        />
                      </Form.Item>
                    </div>

                    <Form.List
                      name={[mpField.name, 'classes']}
                      rules={[
                        {
                          validator: async (_, value) => {
                            if (!value || value.length === 0) {
                              return Promise.reject(new Error('请至少添加一个班级'));
                            }
                          },
                        },
                      ]}
                    >
                      {(clsFields, { add: addCls, remove: removeCls }) => (
                        <>
                          {clsFields.map((clsField) => (
                            <div key={clsField.key} style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                              <Form.Item
                                {...clsField}
                                label="班级名称"
                                name={[clsField.name, 'className']}
                                rules={[{ required: true, message: '请输入班级名称' }]}
                                style={{ flex: 1, marginBottom: 0 }}
                              >
                                <AutoComplete
                                  placeholder="请输入或选择班级名称"
                                  options={classNames.map(name => ({ value: name }))}
                                  filterOption={(inputValue, option) =>
                                    option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                  }
                                />
                              </Form.Item>
                              <Form.Item
                                {...clsField}
                                label="毕业时间"
                                name={[clsField.name, 'graduationDate']}
                                style={{ flex: 1, marginBottom: 0 }}
                              >
                                <DatePicker picker="month" style={{ width: '100%' }} />
                              </Form.Item>
                              {clsFields.length > 1 && (
                                <Button
                                  type="link"
                                  danger
                                  onClick={() => removeCls(clsField.name)}
                                  style={{ marginTop: 30 }}
                                >
                                  删除
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button type="dashed" onClick={() => addCls()} style={{ width: '100%', marginTop: 8 }}>
                            添加班级
                          </Button>
                        </>
                      )}
                    </Form.List>
                  </Card>
                ))}
                <Button type="dashed" style={{ width: '100%' }} onClick={() => addMp()}>
                  添加专业学制组合
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* 数据行编辑弹窗 */}
      <Modal
        title="编辑就业数据"
        open={dataEditVisible}
        confirmLoading={dataEditLoading}
        onOk={handleDataEditSave}
        onCancel={handleDataEditCancel}
        destroyOnClose
      >
        <Form form={dataForm} layout="vertical">
          <Form.Item label="毕业时间" name="graduationDate">
            <DatePicker picker="month" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="目标平均就业薪资" name="targetAverageSalary">
            <InputNumber style={{ width: '100%' }} min={0} step={100} />
          </Form.Item>
          <Form.Item label="实际平均就业薪资" name="actualAverageSalary">
            <InputNumber style={{ width: '100%' }} min={0} step={100} />
          </Form.Item>
          <Form.Item label="目标就业人数" name="targetEmploymentCount">
            <InputNumber style={{ width: '100%' }} min={0} step={1} />
          </Form.Item>
          <Form.Item label="实际就业人数" name="actualEmploymentCount">
            <InputNumber style={{ width: '100%' }} min={0} step={1} />
          </Form.Item>
          <Form.Item label="薪资过万人数" name="salaryOverTenThousand">
            <InputNumber style={{ width: '100%' }} min={0} step={1} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CampusTeacherEmploymentSummary;
