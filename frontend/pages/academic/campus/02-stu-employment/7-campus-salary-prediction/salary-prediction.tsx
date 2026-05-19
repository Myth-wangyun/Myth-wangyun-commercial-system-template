// 学术-神殿-学员就业-班薪资预估表

import React, { useMemo, useState, useEffect } from 'react';
import { App,
  Card,
  Table,
  Typography,
  Descriptions,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  Divider,
  Popconfirm,
  Select,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, PlusOutlined, SettingOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useCampusStore } from '@/stores/campusStore';
import { useConfigOptions } from '@/hooks/useConfigOptions';
import { salaryPredictionService, classExamScoreService, projectGradeRegisterService, pressInterviewScoreService } from '@/services/service';
import { api } from '@/services/api';
import type { ClassProfile, MajorProfile } from '@/services/configMaster';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface SalaryPredictionRecord {
  key: string;
  serialNumber: number;
  name: string;
  gender: '男' | '女';
  birthDate: string;
  education: string;
  major: string;
  graduatedSchool: string;
  nativePlace: string;
  exams: Record<string, number | null>;
  projects: Record<string, number | null>;
  defenses: Record<string, number | null>;
  thousandScore: number;
  classTeacherComment: string;
  classTeacherEvaluations?: Array<{ teacherName: string; comment: string }>;
  lecturers: Array<{ teacherName: string; comment: string }>;
  estimatedSalary: string;
}

interface ClassFileRecordRow {
  serialNumber: number;
  name: string;
  gender: string;
  education: string;
  graduateSchool: string;
  // 班级档案表里没有籍贯/出生年月/专业等字段，缺失时保持为空即可
}

const normalizeCampus = (campus?: string | null): string => {
  if (!campus) return '';
  return campus.replace(/神殿$/, '').trim();
};

const fetchClassFileRecords = async (className: string, campus: string): Promise<ClassFileRecordRow[]> => {
  try {
    // 必须走 axios 实例 api：它在请求拦截器里会自动带上 Authorization / X-API-Key
    const res = await api.get('/teaching-quality/class-file', {
      params: {
        campus: normalizeCampus(campus),
        class: className,
      },
    });

    const result = res.data;
    const rows = (result?.行列表 || result?.rows || result?.data || []) as any[];
    if (!Array.isArray(rows) || rows.length === 0) return [];

    return rows
      .filter(r => (r?.name && String(r.name).trim()) || (r?.serialNumber != null))
      .map((r: any, idx: number) => ({
        serialNumber: Number(r.serialNumber ?? idx + 1),
        name: String(r.name || '').trim(),
        gender: String(r.gender || '').trim(),
        education: String(r.education || '').trim(),
        graduateSchool: String(r.graduateSchool || '').trim(),
      }))
      .filter(r => r.name);
  } catch (e) {
    console.warn('[salary-prediction] 加载班级档案失败:', e);
    return [];
  }
};

const mergeStudentInfoFromClassFile = (
  base: SalaryPredictionRecord[],
  classFileRows: ClassFileRecordRow[],
  majorNameFromConfig: string,
): SalaryPredictionRecord[] => {
  if (!Array.isArray(classFileRows) || classFileRows.length === 0) return base;
  const baseMap = new Map(base.map(r => [r.name, { ...r }]));

  let serial = base.length;
  classFileRows.forEach((row) => {
    const name = row.name;
    if (!name) return;

    const existing = baseMap.get(name) || {
      key: `${Date.now()}-${serial += 1}`,
      serialNumber: row.serialNumber || serial,
      name,
      gender: '男',
      birthDate: '',
      education: '',
      major: majorNameFromConfig || '',
      graduatedSchool: '',
      nativePlace: '',
      exams: {},
      projects: {},
      defenses: {},
      thousandScore: 0,
      classTeacherComment: '',
      classTeacherEvaluations: [],
      lecturers: [],
      estimatedSalary: '',
    } as SalaryPredictionRecord;

    baseMap.set(name, {
      ...existing,
      serialNumber: existing.serialNumber || row.serialNumber || existing.serialNumber,
      // 只在为空时从档案表补齐，避免覆盖手动编辑/后端已有数据
      gender: (existing.gender || undefined) ? existing.gender : ((row.gender === '女' ? '女' : '男') as '男' | '女'),
      education: existing.education || row.education || '',
      major: existing.major || majorNameFromConfig || '',
      graduatedSchool: existing.graduatedSchool || row.graduateSchool || '',
    });
  });

  // 用班级档案表序号优先排序；没有序号的放后面
  return Array.from(baseMap.values()).sort((a, b) => {
    const sa = a.serialNumber || 99999;
    const sb = b.serialNumber || 99999;
    return sa - sb;
  });
};

interface ThousandScoreApiRow {
  序号?: number;
  学员姓名?: string | null;
  剩余?: number | null; // 月末累计剩余分
  累计分?: number | null; // 兼容字段
}

const fetchLatestThousandScoreMap = async (
  campus: string,
  className: string,
): Promise<{ year: number; month: number; map: Map<string, number> }> => {
  // “最新”的定义：从当前年月开始，最多向前回退 12 个月，取第一份有行列表的数据
  const now = new Date();
  let y = now.getFullYear();
  let m = now.getMonth() + 1;

  for (let i = 0; i < 12; i += 1) {
    try {
      const res = await api.get('/teaching-quality/thousand-score', {
        params: {
          campus: normalizeCampus(campus),
          class: className,
          year: y,
          month: m,
        },
      });
      const data = res.data;
      const rows = (data?.行列表 || data?.rows || data?.data || []) as ThousandScoreApiRow[];
      if (Array.isArray(rows) && rows.length) {
        const map = new Map<string, number>();
        rows.forEach((r) => {
          const name = String(r.学员姓名 || '').trim();
          if (!name) return;
          const scoreRaw = r.剩余 ?? r.累计分;
          const score = typeof scoreRaw === 'number' ? scoreRaw : Number(scoreRaw);
          if (Number.isFinite(score)) map.set(name, score);
        });
        return { year: y, month: m, map };
      }
    } catch (e) {
      // 忽略单月失败，继续回退
      console.warn('[salary-prediction] 读取千分制失败，将尝试更早月份:', y, m, e);
    }

    // 回退一个月
    if (m === 1) {
      y -= 1;
      m = 12;
    } else {
      m -= 1;
    }
  }

  return { year: now.getFullYear(), month: now.getMonth() + 1, map: new Map() };
};

const mergeThousandScore = (
  base: SalaryPredictionRecord[],
  scoreMap: Map<string, number>,
): SalaryPredictionRecord[] => {
  if (!scoreMap || scoreMap.size === 0) return base;
  return base.map((r) => {
    const s = scoreMap.get((r.name || '').trim());
    if (s == null) return r;
    // 只在为空/0 时回填，避免覆盖手工调整
    if (r.thousandScore == null || Number(r.thousandScore) === 0) {
      return { ...r, thousandScore: s };
    }
    return r;
  });
};

const computeAverage = (values: Array<number | null>): number | null => {
  const numbers = values.filter((v): v is number => typeof v === 'number');
  if (numbers.length === 0) return null;
  const sum = numbers.reduce((acc, value) => acc + value, 0);
  return parseFloat((sum / numbers.length).toFixed(4));
};

const formatValue = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return String(value).replace(/\.0+$/, '').replace(/(\.\d+?)0+$/, '$1');
};

const SalaryPredictionPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<SalaryPredictionRecord[]>([]);
  const [backendRecordId, setBackendRecordId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<SalaryPredictionRecord | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm<SalaryPredictionRecord>();

  const formInitials = useMemo(() => {
    if (!editingRecord) return undefined;
    return {
      ...editingRecord,
      exams: { ...(editingRecord.exams || {}) },
      projects: { ...(editingRecord.projects || {}) },
      defenses: { ...(editingRecord.defenses || {}) },
    } as Partial<SalaryPredictionRecord>;
  }, [editingRecord]);

  // 班级数据与选择（与顶部神殿同步）
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '');
  const { campuses, majors, classes } = useConfigOptions({
    campusName: selectedCampus || currentCampus || '',
  });
  const campusOptions = useMemo(() => campuses.map(c => ({ label: c.label, value: c.value })), [campuses]);
  const campusCode = useMemo(
    () => (campuses.find(c => c.value === (selectedCampus || currentCampus || ''))?.raw as any)?.code,
    [campuses, selectedCampus, currentCampus],
  );
  const classOptions = useMemo(
    () => classes.map(c => ({ label: c.label, value: String((c.raw as ClassProfile).id) })),
    [classes],
  );
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const selectedClass = useMemo(
    () => classes.map(c => c.raw as ClassProfile).find(c => String(c.id) === String(selectedClassId)),
    [classes, selectedClassId],
  );
  const selectedMajorName = useMemo(() => {
    if (!selectedClass?.major_id) return '';
    const major = majors.map(m => m.raw as MajorProfile).find(m => m.id === selectedClass.major_id);
    return major?.name || '';
  }, [majors, selectedClass]);
  const selectedClassName = selectedClass?.class_name || '';

  // 当神殿或班级列表变化时，确保选中项有效
  useEffect(() => {
    const classList = classes.map(c => c.raw as ClassProfile);
    if (!classList.length) {
      setSelectedClassId('');
      return;
    }
    if (!classList.some(c => String(c.id) === String(selectedClassId))) {
      setSelectedClassId(String(classList[0].id));
    }
  }, [classes, selectedClassId]);

  // 可编辑课程表头
  const EXAM_HEADERS_LS_KEY = 'salary_prediction_exam_headers';
  const [examHeaders, setExamHeaders] = useState<Array<{ key: string; title: string }>>(() => {
    try {
      const raw = localStorage.getItem(EXAM_HEADERS_LS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.every(h => h && typeof h.key === 'string')) {
        return parsed as Array<{ key: string; title: string }>;
      }
    } catch {}
    return [];
  });

  // 持久化表头
  useEffect(() => {
    try {
      localStorage.setItem(EXAM_HEADERS_LS_KEY, JSON.stringify(examHeaders));
    } catch {}
  }, [examHeaders]);

  // 项目-答辩成对管理（可增删改）
  const PAIRS_LS_KEY = 'salary_prediction_project_defense_pairs';
  const [pairs, setPairs] = useState<Array<{ projectKey: string; defenseKey: string; projectTitle: string; defenseTitle: string }>>(() => {
    try {
      const raw = localStorage.getItem(PAIRS_LS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.every(p => p && typeof p.projectKey === 'string' && typeof p.defenseKey === 'string')) {
        return parsed as Array<{ projectKey: string; defenseKey: string; projectTitle: string; defenseTitle: string }>;
      }
    } catch {}
    return [];
  });
  useEffect(() => {
    try {
      localStorage.setItem(PAIRS_LS_KEY, JSON.stringify(pairs));
    } catch {}
  }, [pairs]);

  // 班级头部信息（班主任/强化教员）
  const CLASS_HEADERS_LS_KEY = 'salary_prediction_class_headers';
  const [classHeaders, setClassHeaders] = useState<Record<string, { classAdvisor?: string; reinforcementInstructor?: string }>>(() => {
    try {
      const raw = localStorage.getItem(CLASS_HEADERS_LS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(CLASS_HEADERS_LS_KEY, JSON.stringify(classHeaders));
    } catch {}
  }, [classHeaders]);

  const [editHeadersVisible, setEditHeadersVisible] = useState(false);
  const [headersForm] = Form.useForm<{ classAdvisor?: string; reinforcementInstructor?: string }>();
  const openEditHeaders = () => {
    if (!selectedClassId) {
      message.warning('请先选择班级');
      return;
    }
    headersForm.setFieldsValue({
      classAdvisor: classHeaders[selectedClassId]?.classAdvisor || '',
      reinforcementInstructor: classHeaders[selectedClassId]?.reinforcementInstructor || '',
    });
    setEditHeadersVisible(true);
  };
  const handleSaveHeaders = async () => {
    try {
      const values = await headersForm.validateFields();
      if (!selectedClassId) return;
      setClassHeaders(prev => ({ ...prev, [selectedClassId]: { ...prev[selectedClassId], ...values } }));
      setEditHeadersVisible(false);
      message.success('班级信息已更新');
    } catch {}
  };

  // 根据当前配置计算平均值
  const tableData = useMemo(() => {
    return records.map(record => {
      const examAverage = computeAverage(examHeaders.map(item => record.exams[item.key] ?? null));
      const projectAverage = computeAverage(pairs.map(p => record.projects[p.projectKey] ?? null));
      const defenseAverage = computeAverage(pairs.map(p => record.defenses[p.defenseKey] ?? null));
      return {
        ...record,
        examAverage,
        projectAverage,
        defenseAverage,
      };
    });
  }, [records, examHeaders, pairs]);

  const handleEdit = (record: SalaryPredictionRecord) => {
    setEditingRecord(record);
    setModalVisible(true);
  };

  const updateRecord = (key: string, patch: Partial<SalaryPredictionRecord>) => {
    setRecords(prev => prev.map(item => (item.key === key ? { ...item, ...patch } : item)));
  };

  useEffect(() => {
    if (modalVisible && editingRecord) {
      // 等动态字段渲染完成后再回填
      Promise.resolve().then(() => {
        const classTeacherEvaluations = editingRecord.classTeacherEvaluations?.length
          ? editingRecord.classTeacherEvaluations
          : (editingRecord.classTeacherComment
              ? [{ teacherName: '', comment: editingRecord.classTeacherComment }]
              : []);
        form.setFieldsValue({
          ...editingRecord,
          classTeacherEvaluations,
          exams: { ...editingRecord.exams },
          projects: { ...editingRecord.projects },
          defenses: { ...editingRecord.defenses },
        });
      });
    }
  }, [modalVisible, editingRecord, examHeaders, pairs, form]);

  const createEmptyRecord = (serial: number): SalaryPredictionRecord => ({
    key: `${Date.now()}-${serial}`,
    serialNumber: serial,
    name: '',
    gender: '男',
    birthDate: '',
    education: '',
    major: '',
    graduatedSchool: '',
    nativePlace: '',
    exams: {},
    projects: {},
    defenses: {},
    thousandScore: 0,
    classTeacherComment: '',
    classTeacherEvaluations: [],
    lecturers: [],
    estimatedSalary: '',
  });

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const evaluations = Array.isArray(values.classTeacherEvaluations) ? values.classTeacherEvaluations : [];
      const classTeacherComment = evaluations.length
        ? evaluations
            .map(item => `${item.teacherName || '班主任'}: ${item.comment || ''}`.trim())
            .join(' | ')
        : '';
      setRecords(prev =>
        prev.map(item =>
          item.key === editingRecord?.key
            ? { ...item, ...values, classTeacherEvaluations: evaluations, classTeacherComment }
            : item,
        ),
      );
      setModalVisible(false);
      setEditingRecord(null);
      form.resetFields();
    } catch {
      // validation errors handled by antd
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingRecord(null);
    form.resetFields();
  };

  // 从多个考试记录中提取所有课程名称作为表头
  const buildExamHeadersFromData = (examList: any[]): Array<{ key: string; title: string }> => {
    if (!Array.isArray(examList) || examList.length === 0) return [];
    const headers: Array<{ key: string; title: string }> = [];
    examList.forEach((examResp, index) => {
      if (!examResp) return;
      const title = examResp.course_name || examResp.courseName || `课程${index + 1}`;
      const key = `course_${index + 1}`;
      // 避免重复的课程名
      if (!headers.some(h => h.title === title)) {
        headers.push({ key, title: String(title) });
      }
    });
    return headers;
  };

  const buildPairsFromData = (
    projectData: any,
    pressList: any[],
  ): Array<{ projectKey: string; defenseKey: string; projectTitle: string; defenseTitle: string }> => {
    let count = Array.isArray(projectData?.project_names) ? projectData.project_names.length : 0;
    if (!count && Array.isArray(pressList) && pressList.length) {
      const maxLen = pressList.reduce((m, rec) => {
        const scores = rec.projectScores || rec.project_scores || {};
        const len = Object.keys(scores || {}).length;
        return Math.max(m, len);
      }, 0);
      count = maxLen;
    }
    if (!count) return [];
    const result: Array<{ projectKey: string; defenseKey: string; projectTitle: string; defenseTitle: string }> = [];
    for (let i = 1; i <= count; i += 1) {
      const projectTitle =
        (Array.isArray(projectData?.project_names) && projectData.project_names[i - 1]) || `项目${i}`;
      result.push({
        projectKey: `project_${i}`,
        defenseKey: `defense_${i}`,
        projectTitle: String(projectTitle),
        defenseTitle: `答辩${i}`,
      });
    }
    return result;
  };

  const saveToBackend = async () => {
    if (!selectedClassName) {
      message.warning('请选择班级后再保存');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        campusName: selectedCampus || currentCampus || '',
        majorName: selectedMajorName || '',
        className: selectedClassName,
        classTeacherName: classHeaders[selectedClassId]?.classAdvisor || '',
        reinforcementTeacherName: classHeaders[selectedClassId]?.reinforcementInstructor || '',
        records: records.map((record) => ({
          idCard: '',
          ...record,
        })),
        examHeaders,
        projectPairs: pairs,
      };
      if (backendRecordId) {
        const updated = await salaryPredictionService.update({ id: backendRecordId, ...payload });
        setBackendRecordId(updated.id);
        message.success('已更新薪资预估表');
      } else {
        const created = await salaryPredictionService.create(payload);
        setBackendRecordId(created.id);
        message.success('已保存薪资预估表');
      }
    } catch (error) {
      console.error('保存薪资预估失败', error);
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理多门课程的考试成绩
  const mergeFromExam = (base: SalaryPredictionRecord[], examList: any[], headers: Array<{ key: string; title: string }>, majorName: string = ''): SalaryPredictionRecord[] => {
    console.log('🔍 mergeFromExam - 开始处理考试成绩数据', {
      examListLength: Array.isArray(examList) ? examList.length : 0,
      headersCount: headers.length,
      majorName,
    });
    
    if (!Array.isArray(examList) || examList.length === 0) {
      console.warn('⚠️ mergeFromExam - 考试成绩数据为空');
      return base;
    }

    // 计算综合成绩：使用与班级考试成绩表相同的计算规则
    // IT专业: 笔试50% + 上机50%
    // 设计专业: 笔试40% + 上机40% + 日常20%
    const calcScore = (stu: any, majorName: string = '') => {
      // 如果有已计算的综合成绩，直接使用
      const total = Number(stu.totalScore ?? stu.total_score ?? 0);
      if (total > 0) return total;
      
      const written = Number(stu.writtenScore ?? stu.written_score ?? 0);
      const lab = Number(stu.labScore ?? stu.lab_score ?? 0);
      const daily = Number(stu.dailyScore ?? stu.daily_score ?? 0);
      
      // 根据专业判断计算规则
      const isDesign = majorName.includes('设计') || majorName.includes('媒');
      if (isDesign) {
        // 设计专业: 笔试40% + 上机40% + 日常20%
        return Number((written * 0.4 + lab * 0.4 + daily * 0.2).toFixed(1));
      } else {
        // IT专业: 笔试50% + 上机50%
        return Number((written * 0.5 + lab * 0.5).toFixed(1));
      }
    };

    const map = new Map(base.map(r => [r.name, { ...r }]));
    let serial = base.length;

    // 遍历每门课程的考试记录
    examList.forEach((examResp, courseIndex) => {
      if (!examResp) return;
      
      const courseName = examResp.course_name || examResp.courseName || `课程${courseIndex + 1}`;
      // 找到对应的header key
      const header = headers.find(h => h.title === courseName) || headers[courseIndex];
      if (!header) {
        console.warn(`⚠️ mergeFromExam - 找不到课程 "${courseName}" 对应的表头`);
        return;
      }
      
      // 优先使用 scoresFinal 中已计算好的最终成绩
      const finalStudents = examResp.scoresFinal?.students || [];
      const finalScoreMap = new Map<string, number>();
      finalStudents.forEach((s: any) => {
        const name = s.student_name || s.studentName || '';
        const score = Number(s.final_score ?? s.finalScore ?? 0);
        if (name && score > 0) {
          finalScoreMap.set(name, score);
        }
      });

      const firstStudents = examResp.scoresFirst?.students || [];

      console.log(`📚 mergeFromExam - 处理课程 "${courseName}"`, {
        headerKey: header.key,
        firstStudentsCount: firstStudents.length,
        finalStudentsCount: finalStudents.length,
        hasFinalScores: finalScoreMap.size > 0,
      });

      firstStudents.forEach((stu: any) => {
        const name = stu.studentName || stu.student_name || stu.name || '';
        if (!name) {
          console.warn('⚠️ mergeFromExam - 学员缺少姓名:', stu);
          return;
        }
        const key = name;
        const existing = map.get(key) || {
          key: `${Date.now()}-${serial += 1}`,
          serialNumber: serial,
          name,
          gender: '男',
          birthDate: '',
          education: '',
          major: '',
          graduatedSchool: '',
          nativePlace: '',
          exams: {},
          projects: {},
          defenses: {},
          thousandScore: 0,
          classTeacherComment: '',
          classTeacherEvaluations: [],
          lecturers: [],
          estimatedSalary: '',
        } as SalaryPredictionRecord;
        
        // 优先使用班级考试成绩表中已计算好的最终成绩
        const finalScore = finalScoreMap.get(name) || calcScore(stu, majorName);
        
        const filledExams = { ...existing.exams };
        // 只设置当前课程的成绩
        if (filledExams[header.key] == null && finalScore != null) {
          filledExams[header.key] = finalScore;
          console.log(`✅ mergeFromExam - 学员 "${name}" 的 ${header.title} 设置为:`, finalScore, finalScoreMap.has(name) ? '(来自scoresFinal)' : '(本地计算)');
        }
        map.set(key, { ...existing, exams: filledExams });
      });
    });
    
    return Array.from(map.values());
  };

  const mergeFromProjects = (base: SalaryPredictionRecord[], projectData: any, pairList: typeof pairs): SalaryPredictionRecord[] => {
    console.log('🔍 mergeFromProjects - 开始处理项目成绩数据', {
      hasProjectData: !!projectData,
      hasStudents: !!projectData?.students,
      studentsLength: projectData?.students?.length,
      projectNames: projectData?.projectNames,
      pairListLength: pairList.length,
    });
    
    if (!projectData || !Array.isArray(projectData.students)) {
      console.warn('⚠️ mergeFromProjects - 项目数据不存在或学员列表为空');
      return base;
    }
    
    const map = new Map(base.map(r => [r.name, { ...r }]));
    let serial = base.length;
    const projectCount = projectData.projectNames?.length || projectData.projectCount || pairList.length || 0;
    
    projectData.students.forEach((stu: any) => {
      const name = stu.studentName || stu.student_name || stu.name || '';
      if (!name) return;
      
      console.log(`🔍 mergeFromProjects - 处理学员 "${name}" 的项目成绩`);
      
      const projectScores: (number | null)[] = [];
      for (let i = 1; i <= projectCount; i++) {
        // 尝试多种数据格式
        const attempts = [stu[`p${i}a1`], stu[`p${i}a2`], stu[`p${i}a3`]];
        const scores = attempts
          .map((a: any) => {
            if (typeof a === 'number') return a;
            if (typeof a?.score === 'number') return a.score;
            return -Infinity;
          })
          .filter(s => Number.isFinite(s));
        
        const best = scores.length > 0 ? Math.max(...scores) : null;
        projectScores.push(best !== null ? Number(best.toFixed(1)) : null);
        
        console.log(`  项目${i} - 尝试分数:`, attempts, '最高分:', best);
      }
      
      const existing = map.get(name) || {
        key: `${Date.now()}-${serial += 1}`,
        serialNumber: serial,
        name,
        gender: '男',
        birthDate: '',
        education: '',
        major: '',
        graduatedSchool: '',
        nativePlace: '',
        exams: {},
        projects: {},
        defenses: {},
        thousandScore: 0,
        classTeacherComment: '',
        classTeacherEvaluations: [],
        lecturers: [],
        estimatedSalary: '',
      } as SalaryPredictionRecord;
      
      const projects = { ...existing.projects };
      pairList.forEach((p, idx) => {
        if (projects[p.projectKey] == null && projectScores[idx] != null) {
          projects[p.projectKey] = projectScores[idx];
          console.log(`✅ mergeFromProjects - 学员 "${name}" 的 ${p.projectTitle} 设置为:`, projects[p.projectKey]);
        }
      });
      map.set(name, { ...existing, projects });
    });
    return Array.from(map.values());
  };

  const mergeFromPress = (base: SalaryPredictionRecord[], pressList: any[], pairList: typeof pairs): SalaryPredictionRecord[] => {
    if (!pressList || !pressList.length) {
      console.log('⚠️ mergeFromPress - pressList 为空或长度为0');
      return base;
    }
    console.log('🔍 mergeFromPress - 接收到的 pressList:', pressList.length, '条');
    console.log('🔍 mergeFromPress - 第一条数据:', pressList[0]);
    
    const map = new Map(base.map(r => [r.name, { ...r }]));
    pressList.forEach((rec) => {
      // 支持多种字段名格式
      const name = rec.studentName || rec.student_name || '';
      if (!name) {
        console.warn('⚠️ mergeFromPress - 记录缺少学员姓名:', rec);
        return;
      }
      const existing = map.get(name);
      if (!existing) {
        console.warn(`⚠️ mergeFromPress - 找不到学员 "${name}" 的基础记录`);
        return;
      }
      
      // 支持多种 projectScores 字段名格式
      const projectScores = rec.projectScores || rec.project_scores || {};
      console.log(`🔍 mergeFromPress - 学员 "${name}" 的 projectScores:`, projectScores);
      
      const scores: number[] = [];
      const entries = Object.entries(projectScores).map(([k, v]: any) => {
        const idx = Number(k);
        if (isNaN(idx)) {
          console.warn(`⚠️ mergeFromPress - 无效的项目键名: ${k}`);
          return null;
        }
        
        // 支持多种平均分字段名格式
        let score: number | null = null;
        if (typeof v?.averageScore === 'number') {
          score = v.averageScore;
        } else if (typeof v?.average_score === 'number') {
          score = v.average_score;
        } else if (v && typeof v === 'object') {
          // 如果没有平均分，计算所有分数的平均值
          const values = Object.values(v).map((n: any) => (typeof n === 'number' ? n : null));
          score = computeAverage(values);
        }
        
        return { idx, score };
      }).filter((e): e is { idx: number; score: number | null } => e !== null);
      
      entries.sort((a, b) => a.idx - b.idx);
      entries.forEach(e => scores.push(e.score ?? null));
      
      console.log(`🔍 mergeFromPress - 学员 "${name}" 提取的分数:`, scores);
      
      const defenses = { ...existing.defenses };
      pairList.forEach((p, idx) => {
        if (defenses[p.defenseKey] == null && scores[idx] != null) {
          defenses[p.defenseKey] = Number(scores[idx]?.toFixed ? scores[idx].toFixed(1) : scores[idx]);
          console.log(`✅ mergeFromPress - 学员 "${name}" 的 ${p.defenseTitle} 设置为:`, defenses[p.defenseKey]);
        }
      });
      map.set(name, { ...existing, defenses });
    });
    return Array.from(map.values());
  };

  const loadData = async () => {
    if (!selectedClassName) {
      setRecords([]);
      return;
    }
    setLoading(true);
    try {
      const [salaryList, examRes, projectRes, pressRes, classFileRows, thousandScoreResult] = await Promise.all([
        salaryPredictionService.getList(selectedCampus || currentCampus || '', selectedClassName),
        // 获取所有课程的考试成绩，设置较大的pageSize
        classExamScoreService.getList({ search: '', pageSize: 100 }, selectedCampus || currentCampus || '', selectedClassName),
        projectGradeRegisterService.getList({ search: '' }, selectedCampus || currentCampus || '', selectedClassName),
        pressInterviewScoreService.getList({ search: '' }, selectedCampus || currentCampus || '', selectedClassName),
        fetchClassFileRecords(selectedClassName, selectedCampus || currentCampus || ''),
        fetchLatestThousandScoreMap(selectedCampus || currentCampus || '', selectedClassName),
      ]);

      console.log('[salary-prediction] class-file rows:', classFileRows?.length, classFileRows?.[0]);
      console.log('[salary-prediction] thousand-score latest:', thousandScoreResult.year, thousandScoreResult.month, thousandScoreResult.map.size);
      console.log('[salary-prediction] 📚 考试成绩API响应:', {
        total: examRes.total,
        listLength: examRes.list?.length || 0,
        pageSize: examRes.pageSize,
        courses: examRes.list?.map((e: any) => e.courseName || e.course_name) || [],
        fullList: examRes.list,
      });
      const salaryRecord = salaryList[0];
      
      // 从API数据构建新的课程表头
      const newExamHeaders = buildExamHeadersFromData(examRes.list || []);
      // 优先使用后端保存的表头，但如果API返回了更多课程，使用新的表头
      const savedExamHeaders = salaryRecord?.examHeaders || [];
      const resolvedExamHeaders = newExamHeaders.length > savedExamHeaders.length 
        ? newExamHeaders 
        : (savedExamHeaders.length > 0 ? savedExamHeaders : newExamHeaders);
      
      const nextPairs = (salaryRecord?.projectPairs?.length ? salaryRecord.projectPairs : pairs) || [];
      const resolvedPairs =
        nextPairs.length > 0 ? nextPairs : buildPairsFromData(projectRes.list?.[0], pressRes.list || []);

      // 更新表头状态
      setExamHeaders(resolvedExamHeaders);
      if (!nextPairs.length && resolvedPairs.length) {
        setPairs(resolvedPairs);
      } else {
        setPairs(nextPairs);
      }

      if (salaryRecord) {
        setBackendRecordId(salaryRecord.id);
        const headerInfo = {
          classAdvisor: salaryRecord.classTeacherName || '',
          reinforcementInstructor: salaryRecord.reinforcementTeacherName || '',
        };
        setClassHeaders(prev => ({ ...prev, [selectedClassId]: headerInfo }));
      } else {
        setBackendRecordId(null);
      }

      const baseRecords = salaryRecord?.records?.length ? salaryRecord.records : [];
      const merged0 = mergeStudentInfoFromClassFile(baseRecords, classFileRows, selectedMajorName);
      const merged0b = mergeThousandScore(merged0, thousandScoreResult.map);
      const merged1 = mergeFromExam(merged0b, examRes.list || [], resolvedExamHeaders, selectedMajorName);
      const merged2 = mergeFromProjects(merged1, projectRes.list?.[0], resolvedPairs);
      const merged3 = mergeFromPress(merged2, pressRes.list || [], resolvedPairs);
      setRecords([...merged3].sort((a, b) => (a.serialNumber || 0) - (b.serialNumber || 0)));
    } catch (error) {
      console.error('加载数据失败', error);
      message.error('加载薪资预估数据失败');
    } finally {
      setLoading(false);
    }
  };

  const autoFillFromSources = async () => {
    if (!selectedClassName) {
      message.warning('请先选择班级');
      return;
    }
    setLoading(true);
    try {
      console.log('🚀 autoFillFromSources - 开始自动填充成绩', {
        campus: selectedCampus || currentCampus,
        className: selectedClassName,
      });
      
      const [examRes, projectRes, pressRes, classFileRows, thousandScoreResult] = await Promise.all([
        // 获取所有课程的考试成绩，设置较大的pageSize
        classExamScoreService.getList({ search: '', pageSize: 100 }, selectedCampus || currentCampus || '', selectedClassName),
        projectGradeRegisterService.getList({ search: '' }, selectedCampus || currentCampus || '', selectedClassName),
        pressInterviewScoreService.getList({ search: '' }, selectedCampus || currentCampus || '', selectedClassName),
        fetchClassFileRecords(selectedClassName, selectedCampus || currentCampus || ''),
        fetchLatestThousandScoreMap(selectedCampus || currentCampus || '', selectedClassName),
      ]);

      console.log('[salary-prediction] autoFill class-file rows:', classFileRows?.length, classFileRows?.[0]);
      console.log('[salary-prediction] autoFill thousand-score latest:', thousandScoreResult.year, thousandScoreResult.month, thousandScoreResult.map.size);
      
      console.log('📊 autoFillFromSources - 获取到的数据:', {
        examListLength: examRes.list?.length || 0,
        examCourses: examRes.list?.map((e: any) => e.courseName || e.course_name) || [],
        projectData: projectRes.list?.[0] ? '有数据' : '无数据',
        projectStudentsCount: projectRes.list?.[0]?.students?.length || 0,
        pressData: pressRes.list?.length ? `${pressRes.list.length}条` : '无数据',
      });
      
      // 始终从API数据构建新的表头，确保课程数量正确
      const newExamHeaders = buildExamHeadersFromData(examRes.list || []);
      const resolvedExamHeaders = newExamHeaders.length > 0 ? newExamHeaders : examHeaders;
      const resolvedPairs =
        pairs.length > 0 ? pairs : buildPairsFromData(projectRes.list?.[0], pressRes.list || []);
      
      // 更新表头状态
      if (newExamHeaders.length > 0) setExamHeaders(newExamHeaders);
      if (!pairs.length && resolvedPairs.length) setPairs(resolvedPairs);

      const merged0 = mergeStudentInfoFromClassFile(records, classFileRows, selectedMajorName);
      const merged0b = mergeThousandScore(merged0, thousandScoreResult.map);
      const merged1 = mergeFromExam(merged0b, examRes.list || [], resolvedExamHeaders, selectedMajorName);
      const merged2 = mergeFromProjects(merged1, projectRes.list?.[0], resolvedPairs);
      const merged3 = mergeFromPress(merged2, pressRes.list || [], resolvedPairs);
      
      const filledCount = merged3.length;
      console.log('✅ autoFillFromSources - 填充完成', {
        totalRecords: filledCount,
        examHeaders: resolvedExamHeaders.length,
        projectPairs: resolvedPairs.length,
      });
      
      setRecords([...merged3].sort((a, b) => (a.serialNumber || 0) - (b.serialNumber || 0)));
      
      const examCount = examRes.list?.[0]?.scoresFirst?.students?.length || 0;
      const projectCount = projectRes.list?.[0]?.students?.length || 0;
      const pressCount = pressRes.list?.length || 0;
      
      message.success(`已自动填充成绩：考试${examCount}人，项目${projectCount}人，面试${pressCount}人`);
    } catch (error) {
      console.error('自动填充成绩失败', error);
      message.error('自动填充成绩失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampus, selectedClassName]);

  // 课程管理逻辑
  const [courseModalVisible, setCourseModalVisible] = useState(false);

  const [editingCourseKey, setEditingCourseKey] = useState<string | null>(null);
  const [courseTitleInput, setCourseTitleInput] = useState('');

  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [manageHeaders, setManageHeaders] = useState<Array<{ key: string; title: string }>>([]);

  const openAddCourse = () => {
    setEditingCourseKey(null);
    setCourseTitleInput('');
    setCourseModalVisible(true);
  };

  const handleSaveCourse = () => {
    const title = courseTitleInput.trim();
    if (!title) {
      message.warning('请输入课程名称');
      return;
    }
    if (editingCourseKey) {
      setExamHeaders(prev => prev.map(h => (h.key === editingCourseKey ? { ...h, title } : h)));
      message.success('课程名称已更新');
    } else {
      const newKey = `course_${Date.now()}`;
      setExamHeaders(prev => [...prev, { key: newKey, title }]);
      setRecords(prev => prev.map(r => ({ ...r, exams: { ...r.exams, [newKey]: null } })));
      message.success('已新增课程');
    }
    setCourseModalVisible(false);
  };

  const openManageCourses = () => {
    setManageHeaders(examHeaders.map(h => ({ ...h })));
    setManageModalVisible(true);
  };

  const handleUpdateManageHeadersTitle = (key: string, title: string) => {
    setManageHeaders(prev => prev.map(h => (h.key === key ? { ...h, title } : h)));
  };

  const handleDeleteCourse = (key: string) => {
    setManageHeaders(prev => prev.filter(h => h.key !== key));
    setExamHeaders(prev => prev.filter(h => h.key !== key));
    // 同步删除所有记录中的该课程分数
    setRecords(prev => prev.map(r => {
      const { [key]: _removed, ...rest } = r.exams;
      return { ...r, exams: rest };
    }));
    message.success('已删除课程');
  };

  const handleApplyManageHeaders = () => {
    // 只更新标题，不改变key
    setExamHeaders(prev => prev.map(h => {
      const found = manageHeaders.find(m => m.key === h.key);
      return found ? { ...h, title: (found.title || '').trim() || h.title } : h;
    }));
    setManageModalVisible(false);
    message.success('课程表头已更新');
  };

  // 项目-答辩配对管理
  const [pairAddVisible, setPairAddVisible] = useState(false);
  const [pairProjectTitle, setPairProjectTitle] = useState('');
  const [pairDefenseTitle, setPairDefenseTitle] = useState('');

  const [pairManageVisible, setPairManageVisible] = useState(false);
  const [managePairs, setManagePairs] = useState<Array<{ projectKey: string; defenseKey: string; projectTitle: string; defenseTitle: string }>>([]);

  const openAddPair = () => {
    setPairProjectTitle('');
    setPairDefenseTitle('');
    setPairAddVisible(true);
  };

  const handleSavePairAdd = () => {
    const pj = pairProjectTitle.trim() || '新项目';
    const df = pairDefenseTitle.trim() || '新答辩';
    const projectKey = `project_${Date.now()}`;
    const defenseKey = `defense_${Date.now()}`;
    setPairs(prev => [...prev, { projectKey, defenseKey, projectTitle: pj, defenseTitle: df }]);
    // 同步给所有记录补充字段
    setRecords(prev => prev.map(r => ({
      ...r,
      projects: { ...r.projects, [projectKey]: null },
      defenses: { ...r.defenses, [defenseKey]: null },
    })));
    setPairAddVisible(false);
    message.success('已新增项目-答辩配对');
  };

  const openManagePairs = () => {
    setManagePairs(pairs.map(p => ({ ...p })));
    setPairManageVisible(true);
  };

  const handleChangeManagePairTitle = (key: string, which: 'project' | 'defense', title: string) => {
    setManagePairs(prev => prev.map(p => {
      if (p.projectKey === key || p.defenseKey === key) {
        return which === 'project' ? { ...p, projectTitle: title } : { ...p, defenseTitle: title };
      }
      return p;
    }));
  };

  const handleDeletePair = (projectKey: string, defenseKey: string) => {
    setPairs(prev => prev.filter(p => !(p.projectKey === projectKey && p.defenseKey === defenseKey)));
    // 同步删除所有记录中的两个字段
    setRecords(prev => prev.map(r => {
      const { [projectKey]: _pRemoved, ...restP } = r.projects;
      const { [defenseKey]: _dRemoved, ...restD } = r.defenses;
      return { ...r, projects: restP, defenses: restD };
    }));
    message.success('已删除项目-答辩配对');
  };

  const handleApplyManagePairs = () => {
    // 只更新标题
    setPairs(prev => prev.map(p => {
      const found = managePairs.find(mp => mp.projectKey === p.projectKey && mp.defenseKey === p.defenseKey);
      return found ? { ...p, projectTitle: (found.projectTitle || '').trim() || p.projectTitle, defenseTitle: (found.defenseTitle || '').trim() || p.defenseTitle } : p;
    }));
    setPairManageVisible(false);
    message.success('项目-答辩配置已更新');
  };

  const columns: ColumnsType<(typeof tableData)[number]> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 70,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 110,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 70,
      align: 'center',
    },
    {
      title: '出生年月',
      dataIndex: 'birthDate',
      key: 'birthDate',
      width: 120,
      align: 'center',
      render: value => value || '-',
    },
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education',
      width: 90,
      align: 'center',
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      width: 120,
      align: 'center',
    },
    {
      title: '毕业学校',
      dataIndex: 'graduatedSchool',
      key: 'graduatedSchool',
      width: 180,
      align: 'center',
      render: value => value || '-',
    },
    {
      title: '籍贯',
      dataIndex: 'nativePlace',
      key: 'nativePlace',
      width: 180,
      align: 'center',
      render: value => value || '-',
    },
    {
      title: '考试成绩',
      children: [
        ...examHeaders.map(header => ({
          title: header.title,
          dataIndex: ['exams', header.key],
          key: header.key,
          width: 160,
          align: 'center' as const,
          render: (value: number | null) => formatValue(value),
        })),
        {
          title: '平均',
          dataIndex: 'examAverage',
          key: 'examAverage',
          width: 120,
          align: 'center',
          render: (value: number | null) => formatValue(value),
        },
      ],
    },
    {
      title: '项目成绩',
      children: [
        ...pairs.map(p => ({
          title: p.projectTitle,
          dataIndex: ['projects', p.projectKey],
          key: p.projectKey,
          width: 120,
          align: 'center' as const,
          render: (value: number | null) => formatValue(value),
        })),
        {
          title: '平均',
          dataIndex: 'projectAverage',
          key: 'projectAverage',
          width: 120,
          align: 'center',
          render: (value: number | null) => formatValue(value),
        },
      ],
    },
    {
      title: '答辩/压力面试成绩',
      children: [
        ...pairs.map(p => ({
          title: p.defenseTitle,
          dataIndex: ['defenses', p.defenseKey],
          key: p.defenseKey,
          width: 120,
          align: 'center' as const,
          render: (value: number | null) => formatValue(value),
        })),
        {
          title: '平均',
          dataIndex: 'defenseAverage',
          key: 'defenseAverage',
          width: 120,
          align: 'center',
          render: (value: number | null) => formatValue(value),
        },
      ],
    },
    {
      title: '千分制',
      dataIndex: 'thousandScore',
      key: 'thousandScore',
      width: 100,
      align: 'center',
    },
    {
      title: '班主任评价',
      dataIndex: 'classTeacherEvaluations',
      key: 'classTeacherEvaluations',
      width: 280,
      render: (_, record) => {
        if (record.classTeacherEvaluations && record.classTeacherEvaluations.length) {
          return record.classTeacherEvaluations
            .map(item => `${item.teacherName || '班主任'}: ${item.comment || ''}`.trim())
            .join(' | ');
        }
        return record.classTeacherComment || '-';
      },
    },
    {
      title: '教员评价',
      dataIndex: 'lecturers',
      key: 'lecturers',
      width: 360,
      render: (list: Array<{ teacherName: string; comment: string }>) =>
        list && list.length
          ? list.map((l) => `${l.teacherName || '教员'}: ${l.comment || ''}`).join(' | ')
          : '-',
    },
    {
      title: '预估薪资',
      dataIndex: 'estimatedSalary',
      key: 'estimatedSalary',
      width: 160,
      align: 'center',
      render: (value, record) => (
        <Input
          value={value}
          placeholder="例如 7000+"
          onChange={(event) => updateRecord(record.key, { estimatedSalary: event.target.value })}
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 90,
      align: 'center',
      render: (_, record) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={3} style={{ marginBottom: 16 }}>
          清美教育学员就业薪资预估表
        </Title>

        {/* 神殿/班级选择（与顶部神殿同步） */}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Space>
            <span>神殿：</span>
            <Select
              style={{ width: 180 }}
              value={selectedCampus || undefined}
              onChange={(v) => {
                setSelectedCampus(v);
                setSelectedClassId('');
              }}
              options={campusOptions}
              placeholder="选择神殿"
            />
            <span>班级：</span>
            <Select
              style={{ width: 160 }}
              placeholder="选择班级"
              value={selectedClassId || undefined}
              onChange={(v) => setSelectedClassId(String(v))}
              options={classOptions}
              showSearch
              optionFilterProp="label"
            />
            <Button size="small" onClick={openEditHeaders}>编辑班级信息</Button>
          </Space>
        </div>

        <Descriptions bordered size="small" column={4} contentStyle={{ minWidth: 140 }}>
          <Descriptions.Item label="神殿名称">
            <Text strong>{selectedCampus || '-'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="专业名称">
            <Text strong>{selectedMajorName || '—'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="班级名称">
            <Text strong>{selectedClass?.class_name || '-'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="班主任姓名">
            <Text strong>{(classHeaders[selectedClassId]?.classAdvisor) || '-'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="强化教员姓名" span={4}>
            <Text strong>{(classHeaders[selectedClassId]?.reinforcementInstructor) || '-'}</Text>
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 16, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button type="primary" onClick={saveToBackend} loading={loading}>
            保存到后端
          </Button>
          <Space wrap>
            <Button
              icon={<PlusOutlined />}
              type="primary"
              ghost
              onClick={() => {
                const maxSerial = records.reduce((m, r) => Math.max(m, r.serialNumber || 0), 0);
                const next = createEmptyRecord(maxSerial + 1 || 1);
                setRecords(prev => [...prev, next]);
                setEditingRecord(next);
                setModalVisible(true);
              }}
            >
              新增学员
            </Button>
            <Button icon={<PlusOutlined />} type="primary" onClick={openAddCourse}>
              新增课程
            </Button>
            <Button icon={<SettingOutlined />} onClick={openManageCourses}>
              管理课程
            </Button>
            <Button icon={<PlusOutlined />} type="primary" ghost onClick={openAddPair}>
              新增项目-答辩
            </Button>
            <Button icon={<SettingOutlined />} onClick={openManagePairs}>
              管理项目-答辩
            </Button>
            <Button icon={<ReloadOutlined />} onClick={autoFillFromSources} loading={loading}>
              自动填充成绩
            </Button>
          </Space>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        <Table
          bordered
          size="small"
          columns={columns}
          dataSource={tableData}
          pagination={false}
          rowKey="key"
          scroll={{ x: 3600 }}
          loading={loading}
        />
      </Card>

      {/* 新增课程弹窗 */}
      <Modal
        title="新增课程"
        open={courseModalVisible}
        onCancel={() => setCourseModalVisible(false)}
        onOk={handleSaveCourse}
        destroyOnClose
      >
        <Form layout="vertical">
          <Form.Item label="课程名称" required>
            <Input
              placeholder="请输入课程名称，如：操作系统基础"
              value={courseTitleInput}
              onChange={e => setCourseTitleInput(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 管理课程弹窗（重命名/删除） */}
      <Modal
        title="管理课程"
        open={manageModalVisible}
        onCancel={() => setManageModalVisible(false)}
        onOk={handleApplyManageHeaders}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {manageHeaders.length === 0 ? (
            <Text type="secondary">暂无课程，请先新增课程。</Text>
          ) : (
            manageHeaders.map(h => (
              <div key={h.key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Input
                  value={h.title}
                  onChange={e => handleUpdateManageHeadersTitle(h.key, e.target.value)}
                />
                <Popconfirm title="确定删除该课程？" onConfirm={() => handleDeleteCourse(h.key)}>
                  <Button danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </div>
            ))
          )}
        </Space>
      </Modal>

      {/* 新增项目-答辩弹窗 */}
      <Modal
        title="新增项目-答辩"
        open={pairAddVisible}
        onCancel={() => setPairAddVisible(false)}
        onOk={handleSavePairAdd}
        destroyOnClose
      >
        <Form layout="vertical">
          <Form.Item label="项目名称" required>
            <Input placeholder="例如：项目X" value={pairProjectTitle} onChange={e => setPairProjectTitle(e.target.value)} />
          </Form.Item>
          <Form.Item label="答辩名称" required>
            <Input placeholder="例如：答辩X" value={pairDefenseTitle} onChange={e => setPairDefenseTitle(e.target.value)} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 管理项目-答辩弹窗（重命名/删除） */}
      <Modal
        title="管理项目-答辩"
        open={pairManageVisible}
        onCancel={() => setPairManageVisible(false)}
        onOk={handleApplyManagePairs}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {managePairs.length === 0 ? (
            <Text type="secondary">暂无项目-答辩配置，请先新增。</Text>
          ) : (
            managePairs.map(p => (
              <div key={`${p.projectKey}-${p.defenseKey}`} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Input
                  style={{ width: 200 }}
                  value={p.projectTitle}
                  onChange={e => handleChangeManagePairTitle(p.projectKey, 'project', e.target.value)}
                  addonBefore="项目"
                />
                <Input
                  style={{ width: 200 }}
                  value={p.defenseTitle}
                  onChange={e => handleChangeManagePairTitle(p.defenseKey, 'defense', e.target.value)}
                  addonBefore="答辩"
                />
                <Popconfirm title="确定删除这一对？" onConfirm={() => handleDeletePair(p.projectKey, p.defenseKey)}>
                  <Button danger icon={<DeleteOutlined />}>删除</Button>
                </Popconfirm>
              </div>
            ))
          )}
        </Space>
      </Modal>

      {/* 编辑班级信息（班主任/强化教员） */}
      <Modal
        title="编辑班级信息"
        open={editHeadersVisible}
        onCancel={() => { setEditHeadersVisible(false); headersForm.resetFields(); }}
        onOk={handleSaveHeaders}
        destroyOnClose
      >
        <Form layout="vertical" form={headersForm}>
          <Form.Item label="班主任姓名" name="classAdvisor" rules={[{ required: true, message: '请输入班主任姓名' }]}>
            <Input placeholder="如：郭丽萍" />
          </Form.Item>
          <Form.Item label="强化教员姓名" name="reinforcementInstructor">
            <Input placeholder="如：姜东亮" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑学员信息"
        open={modalVisible}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
        width={960}
        forceRender
      >
        <Form form={form} layout="vertical" preserve={false} initialValues={formInitials} key={editingRecord?.key || 'new'}>
          <Space size="large" wrap style={{ width: '100%' }}>
            <Form.Item
              name="name"
              label="姓名"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="gender"
              label="性别"
              rules={[{ required: true, message: '请输入性别' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="birthDate" label="出生年月">
              <Input placeholder="例如 2004-08" />
            </Form.Item>
            <Form.Item name="education" label="学历">
              <Input />
            </Form.Item>
            <Form.Item name="major" label="专业">
              <Input />
            </Form.Item>
            <Form.Item name="graduatedSchool" label="毕业学校">
              <Input />
            </Form.Item>
            <Form.Item name="nativePlace" label="籍贯">
              <Input />
            </Form.Item>
            <Form.Item
              name="thousandScore"
              label="千分制"
              rules={[{ required: true, message: '请输入千分制成绩' }]}
            >
              <InputNumber style={{ width: 160 }} />
            </Form.Item>
            <Form.Item name="estimatedSalary" label="预估薪资">
              <Input placeholder="例如 7000+" />
            </Form.Item>
          </Space>

          <Divider />
          <Title level={5}>考试成绩</Title>
          <Space size="middle" wrap style={{ width: '100%' }}>
            {examHeaders.map(header => (
              <Form.Item
                key={header.key}
                name={['exams', header.key]}
                label={header.title}
                rules={[
                  {
                    type: 'number',
                    transform: value => (value === '' || value === null ? null : Number(value)),
                    message: '请输入数字',
                  },
                ]}
              >
                <InputNumber style={{ width: 150 }} />
              </Form.Item>
            ))}
          </Space>

  <Divider />
          <Title level={5}>项目成绩</Title>
          <Space size="middle" wrap style={{ width: '100%' }}>
            {pairs.map(pair => (
              <Form.Item
                key={pair.projectKey}
                name={['projects', pair.projectKey]}
                label={pair.projectTitle}
                rules={[
                  {
                    type: 'number',
                    transform: value => (value === '' || value === null ? null : Number(value)),
                    message: '请输入数字',
                  },
                ]}
              >
                <InputNumber style={{ width: 120 }} />
              </Form.Item>
            ))}
          </Space>

          <Divider />
          <Title level={5}>答辩/压力面试成绩</Title>
          <Space size="middle" wrap style={{ width: '100%' }}>
            {pairs.map(pair => (
              <Form.Item
                key={pair.defenseKey}
                name={['defenses', pair.defenseKey]}
                label={pair.defenseTitle}
                rules={[
                  {
                    type: 'number',
                    transform: value => (value === '' || value === null ? null : Number(value)),
                    message: '请输入数字',
                  },
                ]}
              >
                <InputNumber style={{ width: 120 }} />
              </Form.Item>
            ))}
          </Space>

          <Divider />
          <Title level={5}>评语</Title>
          <Form.List name="classTeacherEvaluations">
            {(fields, { add, remove }) => (
              <div style={{ marginBottom: 16 }}>
                <Space style={{ marginBottom: 8 }}>
                  <Button type="dashed" onClick={() => add({ teacherName: '', comment: '' })} icon={<PlusOutlined />}>
                    新增班主任评价
                  </Button>
                </Space>
                {fields.map(field => (
                  <Space key={field.key} align="start" style={{ display: 'flex', marginBottom: 12 }}>
                    <Form.Item
                      {...field}
                      name={[field.name, 'teacherName']}
                      fieldKey={[field.fieldKey, 'teacherName']}
                      rules={[{ required: true, message: '请输入班主任姓名' }]}
                      label="班主任姓名"
                    >
                      <Input placeholder="如：李老师" />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'comment']}
                      fieldKey={[field.fieldKey, 'comment']}
                      rules={[{ required: true, message: '请输入评价' }]}
                      label="评价"
                    >
                      <TextArea rows={3} style={{ width: 360 }} />
                    </Form.Item>
                    <Button danger onClick={() => remove(field.name)}>
                      删除
                    </Button>
                  </Space>
                ))}
              </div>
            )}
          </Form.List>
          <Form.List name="lecturers">
            {(fields, { add, remove }) => (
              <div>
                <Space style={{ marginBottom: 8 }}>
                  <Button type="dashed" onClick={() => add({ teacherName: '', comment: '' })} icon={<PlusOutlined />}>
                    新增教员评价
                  </Button>
                </Space>
                {fields.map(field => (
                  <Space key={field.key} align="start" style={{ display: 'flex', marginBottom: 12 }}>
                    <Form.Item
                      {...field}
                      name={[field.name, 'teacherName']}
                      fieldKey={[field.fieldKey, 'teacherName']}
                      rules={[{ required: true, message: '请输入教员姓名' }]}
                      label="教员姓名"
                    >
                      <Input placeholder="如：闫梦雷" />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'comment']}
                      fieldKey={[field.fieldKey, 'comment']}
                      rules={[{ required: true, message: '请输入评价' }]}
                      label="评价"
                    >
                      <TextArea rows={3} style={{ width: 360 }} />
                    </Form.Item>
                    <Button danger onClick={() => remove(field.name)}>
                      删除
                    </Button>
                  </Space>
                ))}
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default SalaryPredictionPage;
