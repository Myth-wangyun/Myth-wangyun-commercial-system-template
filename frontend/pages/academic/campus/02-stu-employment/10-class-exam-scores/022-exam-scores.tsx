//班级就业班考试成绩表
import React, { useState, useEffect } from 'react';
import { App, 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Space, 
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tag,
  Alert,
  InputNumber,
  Divider,
  Tooltip,
  Tabs
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  CalendarOutlined,
  TeamOutlined,
  BookOutlined,
  UserOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  FileTextOutlined,
  UsergroupAddOutlined,
  CopyOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCampusStore } from '@/stores/campusStore';
import { classExamScoreService } from '@/services/service';
import type {
  ClassExamScore,
  CreateClassExamScoreRequest,
  ExamStudentScore,
  UpdateClassExamScoreRequest,
} from '@/types/service';
import { useConfigOptions } from '@/hooks/useConfigOptions';
import { buildApiUrl, apiFetch } from '@/utils/apiBase';
import { api } from '@/services/api';

const { Option } = Select;
const { TextArea } = Input;

// 粘贴导入解析的数据结构
interface ParsedExamData {
  metadata: {
    campusName?: string;
    majorName?: string;
    className?: string;
    courseName?: string;
    instructorName?: string;
    firstExamDate?: string;
    makeupExamDate?: string;
    classSize?: number;
    passCount?: number;
    passRate?: number;
    averageScore?: number;
  };
  firstExamStudents: Array<{
    studentId: string;
    studentName: string;
    vocabularyScore: number;
    writtenScore: number;
    labScore: number;
    dailyScore: number;
    totalScore?: number;
  }>;
  makeupExamStudents: Array<{
    studentId: string;
    studentName: string;
    vocabularyScore: number;
    writtenScore: number;
    labScore: number;
    dailyScore: number;
    totalScore?: number;
  }>;
  finalExamStudents: Array<{
    studentId: string;
    studentName: string;
    vocabularyScore: number;
    writtenScore: number;
    labScore: number;
    dailyScore: number;
    totalScore?: number;
  }>;
}

type ExamType = 'first' | 'makeup';

// 补考科目类型
type FailedSubject = 'written' | 'lab' | 'daily' | null;

interface ExamScoreRecord {
  id: string;
  studentId: string;
  studentName: string;
  vocabularyScore: number;
  writtenExamScore: number;
  computerExamScore: number;
  dailyScore: number;
  examType: ExamType;
  examDate?: string;
  classCode: string;
  courseName: string;
  instructor: string;
  updatedAt?: string;
  failedSubject?: FailedSubject; // 记录需要补考的科目
}

interface ExamScoreFormData {
  studentId: string;
  studentName: string;
  vocabularyScore: number;
  writtenExamScore: number;
  computerExamScore: number;
  dailyScore: number;
  examType: ExamType;
  examDate?: dayjs.Dayjs;
  classCode?: string;
  courseName?: string;
  instructor?: string;
}

const ExamScoresPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const [selectedCampus, setSelectedCampus] = useState(currentCampus || '');
  const [selectedMajor, setSelectedMajor] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [dataSource, setDataSource] = useState<ExamScoreRecord[]>([]);
  const [backendRecord, setBackendRecord] = useState<ClassExamScore | null>(null);
  const [allRecords, setAllRecords] = useState<ClassExamScore[]>([]); // 存储该班级所有课程记录
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ExamScoreRecord | null>(null);
  const [form] = Form.useForm<ExamScoreFormData>();
  const [searchText, setSearchText] = useState('');
  const [selectedExamType, setSelectedExamType] = useState<ExamType>('first');
  const [selectedClassCode, setSelectedClassCode] = useState('');
  const [activeTab, setActiveTab] = useState('first');
  const [courseName, setCourseName] = useState('');
  const [instructor, setInstructor] = useState('');
  const [firstExamDate, setFirstExamDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [makeupExamDate, setMakeupExamDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [majorName, setMajorName] = useState('');
  const [majorCategory, setMajorCategory] = useState<'IT' | '设计'>('设计'); // 专业类别决定考试类型

  // 粘贴导入相关状态
  const [pasteModalVisible, setPasteModalVisible] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteLoading, setPasteLoading] = useState(false);
  const [parsedPasteData, setParsedPasteData] = useState<ParsedExamData | null>(null);
  const [pasteError, setPasteError] = useState('');
  const { campuses: campusOptions, majors: majorOptions, classes: classOptions, courses: courseOptions, teachers: teacherOptions } = useConfigOptions({
    campusName: selectedCampus || currentCampus || '',
    majorName: selectedMajor || majorName,
  });

  // 存储从后端获取的所有考试成绩记录（用于提取选项）
  // 从已加载的数据中累积提取，而不是一次性获取所有数据
  const [allExamRecords, setAllExamRecords] = useState<ClassExamScore[]>([]);

  // 当 allRecords 更新时，将新记录累积到 allExamRecords 中
  useEffect(() => {
    if (allRecords.length > 0) {
      console.log('[考试成绩] allRecords 更新，记录数:', allRecords.length);
      setAllExamRecords(prev => {
        // 使用 Map 去重，以 id 为 key
        const recordMap = new Map<number | string, ClassExamScore>();
        // 先添加已有记录
        prev.forEach(r => recordMap.set(r.id, r));
        // 再添加新记录（会覆盖重复的）
        allRecords.forEach(r => recordMap.set(r.id, r));
        const merged = Array.from(recordMap.values());
        console.log('[考试成绩] 累积后的总记录数:', merged.length);
        return merged;
      });
    }
  }, [allRecords]);

  // 当 currentCampus 加载完成后，同步到 selectedCampus
  useEffect(() => {
    if (currentCampus && !selectedCampus) {
      console.log('[考试成绩] currentCampus 已加载，同步到 selectedCampus:', currentCampus);
      setSelectedCampus(currentCampus);
    }
  }, [currentCampus, selectedCampus]);

  // 当神殿变化时，加载该神殿下的所有记录（不限制班级）以获取选项
  useEffect(() => {
    const campus = selectedCampus || currentCampus;
    if (campus) {
      const loadCampusRecords = async () => {
        try {
          // 处理神殿名称：如果选择的是"主神殿"，也要尝试"盛邦"
          const campusName = campus.replace(/神殿$/, '');
          const campusWithSuffix = campus.endsWith('神殿') ? campus : `${campus}神殿`;
          
          console.log('[考试成绩] 加载神殿记录，尝试:', campus, '和', campusName, '和', campusWithSuffix);
          
          // 尝试多个神殿名称格式
          const tryLoad = async (campusToTry: string) => {
            try {
              // 后端限制 page_size 最大为 200
              const res = await classExamScoreService.getList(
                { pageSize: 200 },
                campusToTry,
                undefined, // 不限制班级
              );
              return res;
            } catch (error) {
              console.warn(`[考试成绩] 神殿名称 "${campusToTry}" 加载失败:`, error);
              return null;
            }
          };

          // 按顺序尝试不同的神殿名称格式
          let res = await tryLoad(campus);
          if (!res || !res.list || res.list.length === 0) {
            res = await tryLoad(campusName);
          }
          if (!res || !res.list || res.list.length === 0) {
            res = await tryLoad(campusWithSuffix);
          }

          if (res && res.list && res.list.length > 0) {
            console.log('[考试成绩] 神殿记录加载成功，记录数:', res.list.length);
            console.log('[考试成绩] 前3条记录:', res.list.slice(0, 3).map(r => ({
              id: r.id,
              campus: r.campusName,
              major: r.majorName,
              class: r.className,
              course: r.courseName,
            })));
            setAllExamRecords(prev => {
              // 使用 Map 去重，以 id 为 key
              const recordMap = new Map<number | string, ClassExamScore>();
              // 先添加已有记录
              prev.forEach(r => recordMap.set(r.id, r));
              // 再添加新记录（会覆盖重复的）
              res.list.forEach(r => recordMap.set(r.id, r));
              const merged = Array.from(recordMap.values());
              console.log('[考试成绩] 神殿记录累积后的总记录数:', merged.length);
              return merged;
            });
          } else {
            console.warn('[考试成绩] 所有神殿名称格式都未获取到数据');
          }
        } catch (error) {
          console.error('[考试成绩] 加载神殿记录失败:', error);
        }
      };
      loadCampusRecords();
    }
  }, [selectedCampus, currentCampus]);

  // 从后端已有记录中提取各字段选项
  const existingOptionsFromBackend = React.useMemo(() => {
    const campusSet = new Set<string>();
    const majorSet = new Set<string>();
    const classSet = new Set<string>();
    const courseSet = new Set<string>();
    const teacherSet = new Set<string>();

    console.log('[考试成绩] 正在从后端记录提取选项，记录数:', allExamRecords.length);
    console.log('[考试成绩] 前3条记录示例:', allExamRecords.slice(0, 3));

    allExamRecords.forEach((r, idx) => {
      // 神殿名称：统一处理，确保"盛邦"和"主神殿"都能识别
      if (r.campusName) {
        const campus = String(r.campusName).trim();
        if (campus) {
          // 如果神殿名不包含"神殿"，添加"神殿"后缀以便匹配
          const normalizedCampus = campus.endsWith('神殿') ? campus : `${campus}神殿`;
          campusSet.add(campus); // 保留原始值
          campusSet.add(normalizedCampus); // 也添加标准化值
        }
      }
      
      // 专业名称
      if (r.majorName) {
        const major = String(r.majorName).trim();
        if (major) majorSet.add(major);
      }
      
      // 班级名称
      if (r.className) {
        const className = String(r.className).trim();
        if (className) classSet.add(className);
      }
      
      // 课程名称
      if (r.courseName) {
        const course = String(r.courseName).trim();
        if (course) courseSet.add(course);
      }
      
      // 教员姓名
      if (r.instructorName) {
        const teacher = String(r.instructorName).trim();
        if (teacher) teacherSet.add(teacher);
      }

      // 调试：打印前几条记录的字段值
      if (idx < 3) {
        console.log(`[考试成绩] 记录${idx + 1}:`, {
          campusName: r.campusName,
          majorName: r.majorName,
          className: r.className,
          courseName: r.courseName,
          instructorName: r.instructorName,
        });
      }
    });

    const result = {
      campuses: Array.from(campusSet).map(c => ({ label: c, value: c })),
      majors: Array.from(majorSet).map(m => ({ label: m, value: m })),
      classes: Array.from(classSet).map(c => ({ label: c, value: c })),
      courses: Array.from(courseSet).map(c => ({ label: c, value: c })),
      teachers: Array.from(teacherSet).map(t => ({ label: t, value: t })),
    };

    console.log('[考试成绩] 从后端提取的选项详情:', {
      campuses: result.campuses.map(c => c.value),
      majors: result.majors.map(m => m.value),
      classes: result.classes.map(c => c.value),
      courses: result.courses.map(c => c.value),
      teachers: result.teachers.map(t => t.value),
    });

    // 详细打印每条记录的字段值
    if (allExamRecords.length > 0 && allExamRecords.length <= 10) {
      console.log('[考试成绩] 所有记录的字段值:', allExamRecords.map(r => ({
        campus: r.campusName,
        major: r.majorName,
        class: r.className,
        course: r.courseName,
        teacher: r.instructorName,
      })));
    }

    return result;
  }, [allExamRecords]);

  // 从当前班级已有记录中提取课程选项（用于课程下拉框）
  const existingCourseOptions = React.useMemo(() => {
    const courseSet = new Set<string>();
    allRecords.forEach(r => {
      if (r.courseName) courseSet.add(r.courseName);
    });
    return Array.from(courseSet).map(c => ({ label: c, value: c }));
  }, [allRecords]);

  // 合并配置选项和后端已有选项
  const mergedCampusOptions = React.useMemo(() => {
    const map = new Map<string, { label: string; value: string }>();
    (campusOptions || []).forEach(opt => map.set(opt.value, opt));
    existingOptionsFromBackend.campuses.forEach(opt => map.set(opt.value, opt));
    const result = Array.from(map.values());
    console.log('[考试成绩] 合并后的神殿选项:', result.map(c => c.value));
    return result;
  }, [campusOptions, existingOptionsFromBackend.campuses]);

  const mergedMajorOptions = React.useMemo(() => {
    const map = new Map<string, { label: string; value: string }>();
    console.log('[考试成绩] 合并专业选项 - 配置中心:', (majorOptions || []).map(m => m.value));
    console.log('[考试成绩] 合并专业选项 - 后端:', existingOptionsFromBackend.majors.map(m => m.value));
    (majorOptions || []).forEach(opt => map.set(opt.value, opt));
    existingOptionsFromBackend.majors.forEach(opt => map.set(opt.value, opt));
    const result = Array.from(map.values());
    console.log('[考试成绩] 合并后的专业选项:', result.map(m => m.value));
    return result;
  }, [majorOptions, existingOptionsFromBackend.majors]);

  const mergedClassOptions = React.useMemo(() => {
    const map = new Map<string, { label: string; value: string }>();
    console.log('[考试成绩] 合并班级选项 - 配置中心:', (classOptions || []).map(c => c.value));
    console.log('[考试成绩] 合并班级选项 - 后端:', existingOptionsFromBackend.classes.map(c => c.value));
    (classOptions || []).forEach(opt => map.set(opt.value, opt));
    existingOptionsFromBackend.classes.forEach(opt => map.set(opt.value, opt));
    const result = Array.from(map.values());
    console.log('[考试成绩] 合并后的班级选项:', result.map(c => c.value));
    return result;
  }, [classOptions, existingOptionsFromBackend.classes]);

  const mergedCourseOptions = React.useMemo(() => {
    const map = new Map<string, { label: string; value: string }>();
    (courseOptions || []).forEach(opt => map.set(opt.value, opt));
    existingOptionsFromBackend.courses.forEach(opt => map.set(opt.value, opt));
    existingCourseOptions.forEach(opt => map.set(opt.value, opt));
    return Array.from(map.values());
  }, [courseOptions, existingOptionsFromBackend.courses, existingCourseOptions]);

  const mergedTeacherOptions = React.useMemo(() => {
    const map = new Map<string, { label: string; value: string }>();
    (teacherOptions || []).forEach(opt => map.set(opt.value, { label: opt.label || opt.value, value: opt.value }));
    existingOptionsFromBackend.teachers.forEach(opt => map.set(opt.value, opt));
    return Array.from(map.values());
  }, [teacherOptions, existingOptionsFromBackend.teachers]);

  // 计算规则记忆功能：专业 -> 计算规则 映射
  const CALC_RULE_LS_KEY = 'exam_score_calc_rule_map';
  const loadCalcRule = (major: string): 'IT' | '设计' | null => {
    try {
      const raw = localStorage.getItem(CALC_RULE_LS_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, 'IT' | '设计'>) : {};
      return map[major] || null;
    } catch {
      return null;
    }
  };
  const saveCalcRule = (major: string, rule: 'IT' | '设计') => {
    try {
      const raw = localStorage.getItem(CALC_RULE_LS_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, 'IT' | '设计'>) : {};
      map[major] = rule;
      localStorage.setItem(CALC_RULE_LS_KEY, JSON.stringify(map));
    } catch {}
  };

  // 当专业变化时，加载对应的计算规则
  useEffect(() => {
    if (majorName) {
      const savedRule = loadCalcRule(majorName);
      if (savedRule) {
        setMajorCategory(savedRule);
      }
    }
  }, [majorName]);

  // 当计算规则变化时，保存到 localStorage
  const handleCalcRuleChange = (rule: 'IT' | '设计') => {
    setMajorCategory(rule);
    if (majorName) {
      saveCalcRule(majorName, rule);
    }
  };

  // 从后端加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      // 构建搜索参数：优先使用用户输入的搜索文本，否则使用选择的课程或教员
      let searchParam = searchText;
      if (!searchParam) {
        // 如果用户选择了课程，使用课程名称搜索
        if (selectedCourse) {
          searchParam = selectedCourse;
        }
        // 如果用户选择了教员，使用教员姓名搜索（如果还没有搜索参数）
        if (!searchParam && instructor) {
          searchParam = instructor;
        }
      }
      
      console.log('[班考试成绩] 开始加载数据，参数:', {
        campus: selectedCampus || currentCampus,
        classCode: selectedClassCode,
        course: selectedCourse,
        major: selectedMajor,
        instructor: instructor,
        searchText,
        searchParam, // 实际使用的搜索参数
      });
      
      // 尝试多种神殿和班级名称格式，因为后端使用精确匹配
      const campus = selectedCampus || currentCampus || '';
      const classCode = selectedClassCode || '';
      
      console.log('[班考试成绩] ===== 开始格式尝试逻辑 =====', { campus, classCode });
      
      // 如果没有选择班级，不进行查询
      if (!classCode) {
        console.warn('[班考试成绩] 未选择班级，跳过数据加载');
        setBackendRecord(null);
        setAllRecords([]);
        setDataSource([]);
        setLoading(false);
        return;
      }
      
      // 构建多种格式的尝试列表
      const campusVariants = campus ? [
        campus,
        campus.replace(/神殿$/, ''),
        campus.endsWith('神殿') ? campus : `${campus}神殿`,
      ].filter((v, i, arr) => arr.indexOf(v) === i) : [undefined];
      
      const classVariants = [
        classCode,
        `${classCode}班`,
        classCode.replace(/班$/, ''),
      ].filter((v, i, arr) => arr.indexOf(v) === i);
      
      console.log('[班考试成绩] ===== 尝试的神殿格式 =====', campusVariants);
      console.log('[班考试成绩] ===== 尝试的班级格式 =====', classVariants);
      
      // 先尝试用户选择的格式（不使用搜索参数，获取该班级所有记录）
      let res: any = { list: [], total: 0 };
      try {
        res = await classExamScoreService.getList(
          { search: undefined, pageSize: 100 }, // 先不使用搜索参数
          campus,
          classCode,
        );
        console.log('[班考试成绩] 第一次尝试（无搜索参数）结果:', { campus, classCode, total: res.total, listLength: res.list?.length });
      } catch (error) {
        console.warn('[班考试成绩] 第一次尝试失败:', error);
      }
      
      // 如果第一次尝试没有数据，尝试其他格式组合
      if (!res.list || res.list.length === 0) {
        console.log('[班考试成绩] 第一次尝试无数据，尝试其他格式组合（无搜索参数）...');
        for (const campusVariant of campusVariants) {
          if (campusVariant === campus) continue; // 已经尝试过了
          for (const classVariant of classVariants) {
            if (classVariant === classCode) continue; // 已经尝试过了
            try {
              const attempt = await classExamScoreService.getList(
                { search: undefined, pageSize: 100 }, // 不使用搜索参数
                campusVariant,
                classVariant,
              );
              console.log('[班考试成绩] 尝试格式（无搜索参数）:', { campus: campusVariant, class: classVariant, total: attempt.total, listLength: attempt.list?.length });
              if (attempt.list && attempt.list.length > 0) {
                console.log('[班考试成绩] 找到数据，使用的格式:', { campus: campusVariant, class: classVariant });
                res = attempt;
                break;
              }
            } catch (error) {
              console.warn('[班考试成绩] 尝试格式失败:', { campus: campusVariant, class: classVariant, error });
            }
          }
          if (res.list && res.list.length > 0) break;
        }
      }
      
      // 如果仍然没有数据，且用户选择了课程或教员，尝试使用搜索参数
      if ((!res.list || res.list.length === 0) && searchParam) {
        console.log('[班考试成绩] 尝试使用搜索参数:', searchParam);
        try {
          const searchAttempt = await classExamScoreService.getList(
            { search: searchParam, pageSize: 100 },
            campus,
            classCode,
          );
          console.log('[班考试成绩] 使用搜索参数的结果:', { total: searchAttempt.total, listLength: searchAttempt.list?.length });
          if (searchAttempt.list && searchAttempt.list.length > 0) {
            res = searchAttempt;
          }
        } catch (error) {
          console.warn('[班考试成绩] 使用搜索参数失败:', error);
        }
      }
      
      console.log('[班考试成绩] API 响应:', {
        total: res.total,
        listLength: res.list?.length || 0,
        firstFewRecords: res.list?.slice(0, 3).map(r => ({
          id: r.id,
          campus: r.campusName,
          major: r.majorName,
          class: r.className,
          course: r.courseName,
          instructor: r.instructorName,
        })),
      });
      
        if (res.list && res.list.length > 0) {
          // 保存该班级的所有记录（用于课程下拉框选项）
          setAllRecords(res.list);
          
          // 根据用户选择的条件筛选记录
          // 优先级：课程 > 教员 > 专业 > 第一条记录
          let rec: typeof res.list[0] | null = null;
          
          // 构建筛选条件
          const matchesCourse = (r: typeof res.list[0]) => !selectedCourse || r.courseName === selectedCourse;
          const matchesInstructor = (r: typeof res.list[0]) => !instructor || r.instructorName === instructor;
          const matchesMajor = (r: typeof res.list[0]) => !selectedMajor || r.majorName === selectedMajor;
          
          // 如果用户选择了课程，优先匹配课程
          if (selectedCourse) {
            rec = res.list.find(r => 
              matchesCourse(r) && matchesInstructor(r) && matchesMajor(r)
            ) || res.list.find(r => matchesCourse(r)) || null;
            
            if (!rec) {
              console.warn('[班考试成绩] 未找到匹配的记录:', {
                selectedCourse,
                instructor,
                selectedMajor,
                availableRecords: res.list.map(r => ({
                  id: r.id,
                  campus: r.campusName,
                  major: r.majorName,
                  class: r.className,
                  course: r.courseName,
                  instructor: r.instructorName,
                })),
              });
              setBackendRecord(null);
              setDataSource([]);
              setLoading(false);
              return;
            }
          } else if (instructor) {
            // 如果用户选择了教员但没有选择课程，匹配教员
            rec = res.list.find(r => matchesInstructor(r) && matchesMajor(r)) || 
                  res.list.find(r => matchesInstructor(r)) || null;
            if (rec) {
              setCourseName(rec.courseName || 'PS');
              setSelectedCourse(rec.courseName || 'PS');
            }
          } else if (selectedMajor) {
            // 如果用户选择了专业但没有选择课程和教员，匹配专业
            rec = res.list.find(r => matchesMajor(r)) || null;
            if (rec) {
              setCourseName(rec.courseName || 'PS');
              setSelectedCourse(rec.courseName || 'PS');
            }
          } else {
            // 初次加载，使用第一条记录
            rec = res.list[0];
            // 自动设置课程名
            setCourseName(rec.courseName || 'PS');
            setSelectedCourse(rec.courseName || 'PS');
          }
          
          if (!rec) {
            console.warn('[班考试成绩] 未找到任何记录，使用第一条记录');
            rec = res.list[0];
            setCourseName(rec.courseName || 'PS');
            setSelectedCourse(rec.courseName || 'PS');
          }
          
          setBackendRecord(rec);
          const resolvedMajor = rec.majorName || majorName;
          setMajorName(resolvedMajor);
          setSelectedMajor(resolvedMajor);
          // 优先使用 localStorage 中保存的计算规则，否则根据专业名称自动判断
          const savedRule = loadCalcRule(resolvedMajor);
          if (savedRule) {
            setMajorCategory(savedRule);
          } else if ((rec.majorName || '').includes('设计') || (rec.majorName || '').includes('媒')) {
            setMajorCategory('设计');
          } else {
            setMajorCategory('IT');
          }
          setInstructor(rec.instructorName || instructor);
          setFirstExamDate(rec.firstExamDate ? dayjs(rec.firstExamDate) : null);
          setMakeupExamDate(rec.makeupExamDate ? dayjs(rec.makeupExamDate) : null);
        
        console.log('[班考试成绩] 选中的记录:', {
          id: rec.id,
          campus: rec.campusName,
          major: rec.majorName,
          class: rec.className,
          course: rec.courseName,
          instructor: rec.instructorName,
          scoresFirst: rec.scoresFirst,
          scoresMakeup: rec.scoresMakeup,
        });
        
        const rows: ExamScoreRecord[] = [];
        const firstStudents: ExamStudentScore[] = rec.scoresFirst?.students || [];
        const makeupStudents: ExamStudentScore[] = rec.scoresMakeup?.students || [];
        
        console.log('[班考试成绩] 学生数据:', {
          firstStudentsCount: firstStudents.length,
          makeupStudentsCount: makeupStudents.length,
          firstStudentsSample: firstStudents.slice(0, 3),
          makeupStudentsSample: makeupStudents.slice(0, 3),
        });
        const pushRows = (examType: ExamType, list: ExamStudentScore[]) => {
          list.forEach((stu) => {
            console.log('[学员成绩数据] 原始学员数据:', stu);
            // 优先使用 selectedClassCode，确保与过滤条件一致
            const classCodeToUse = selectedClassCode || rec!.className || '';
            rows.push({
              id: `${examType}-${stu.studentId}`,
              studentId: stu.studentId,
              studentName: stu.studentName || '',
              vocabularyScore: stu.vocabularyScore || 0,
              writtenExamScore: stu.writtenScore || 0,
              computerExamScore: stu.labScore || 0,
              dailyScore: stu.dailyScore || 0,
              examType,
              classCode: classCodeToUse,
              courseName: rec!.courseName,
              instructor: rec!.instructorName,
            });
          });
        };
        pushRows('first', firstStudents);
        pushRows('makeup', makeupStudents);
        console.log('[学员成绩数据] 加载的所有行数据:', rows);
        console.log('[学员成绩数据] selectedClassCode:', selectedClassCode);
        console.log('[学员成绩数据] rec.className:', rec.className);
        console.log('[学员成绩数据] 首考学生数:', firstStudents.length);
        console.log('[学员成绩数据] 补考学生数:', makeupStudents.length);
        
        if (rows.length === 0) {
          console.warn('[班考试成绩] 警告：加载的数据中没有学生记录！', {
            rec,
            firstStudents,
            makeupStudents,
            scoresFirst: rec.scoresFirst,
            scoresMakeup: rec.scoresMakeup,
          });
        }
        
        setDataSource(rows);
      } else {
        console.warn('[班考试成绩] API 返回空列表', {
          campus: selectedCampus || currentCampus,
          classCode: selectedClassCode,
          course: selectedCourse,
          major: selectedMajor,
          instructor: instructor,
          searchParam,
          response: res,
        });
        
        // 如果用户选择了所有条件但没有数据，给出提示
        if (selectedCampus && selectedClassCode) {
          message.warning(
            `未找到匹配的数据。请检查：\n` +
            `- 神殿：${selectedCampus}\n` +
            `- 班级：${selectedClassCode}\n` +
            (selectedCourse ? `- 课程：${selectedCourse}\n` : '') +
            (instructor ? `- 教员：${instructor}\n` : '') +
            `\n提示：可以尝试清除部分筛选条件，或使用"从剪切板导入"功能添加数据。`
          );
        }
        
        setBackendRecord(null);
        setAllRecords([]);
        setDataSource([]);
      }
    } catch (error) {
      console.error('加载数据失败', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCampus, selectedClassCode, selectedCourse, searchText]);

  // 当班级切换时，重置课程选择
  useEffect(() => {
    setSelectedCourse('');
    setCourseName('');
  }, [selectedClassCode]);

  // 选项由 useConfigOptions 负责加载

  // 计算综合成绩
  // 补考时：免考科目用首考成绩，补考科目用补考成绩
  const computeComprehensive = (item: ExamScoreRecord) => {
    if ((item as any).finalScore !== undefined) {
      return Number((item as any).finalScore) || 0;
    }
    
    let written = item.writtenExamScore || 0;
    let lab = item.computerExamScore || 0;
    let daily = item.dailyScore || 0;
    
    // 如果是补考记录，需要合并首考和补考成绩
    if (item.examType === 'makeup') {
      const firstExam = dataSource.find(
        s => s.examType === 'first' && s.studentId === item.studentId
      );
      if (firstExam) {
        const firstWritten = firstExam.writtenExamScore || 0;
        const firstLab = firstExam.computerExamScore || 0;
        const firstDaily = firstExam.dailyScore || 0;
        
        // 免考科目（首考>=60）用首考成绩，补考科目用补考成绩
        written = firstWritten >= 60 ? firstWritten : written;
        lab = firstLab >= 60 ? firstLab : lab;
        daily = firstDaily >= 60 ? firstDaily : daily;
      }
    }
    
    // 根据手动选择的计算规则计算综合成绩
    // IT: 笔试50% + 上机50%
    // 设计: 笔试40% + 上机40% + 平时20%
    return majorCategory === '设计' 
      ? written * 0.4 + lab * 0.4 + daily * 0.2 
      : written * 0.5 + lab * 0.5;
  };

  // 判断哪个科目需要补考（返回最低分科目名称）
  // IT: 只看笔试和上机，单词不参与
  // 设计: 看笔试、上机、平时
  const getFailedSubject = (record: ExamScoreRecord): 'written' | 'lab' | 'daily' | null => {
    const written = record.writtenExamScore || 0;
    const lab = record.computerExamScore || 0;
    const daily = record.dailyScore || 0;
    
    if (majorCategory === 'IT') {
      // IT: 只比较笔试和上机
      if (written <= lab) {
        return 'written';
      } else {
        return 'lab';
      }
    } else {
      // 设计: 比较笔试、上机、平时
      const min = Math.min(written, lab, daily);
      if (written === min) return 'written';
      if (lab === min) return 'lab';
      return 'daily';
    }
  };

  const computeFinalRows = (): ExamScoreRecord[] => {
    const firstRows = dataSource.filter((i) => i.examType === 'first');
    const makeupMap = new Map<string, ExamScoreRecord>();
    dataSource
      .filter((i) => i.examType === 'makeup')
      .forEach((i) => makeupMap.set(i.studentId, i));
    return firstRows.map((fr) => {
      const makeup = makeupMap.get(fr.studentId);
      
      // 最终成绩逻辑：每个科目取首考和补考的最高分
      const finalVocabulary = makeup 
        ? Math.max(fr.vocabularyScore || 0, makeup.vocabularyScore || 0)
        : (fr.vocabularyScore || 0);
      const finalWritten = makeup 
        ? Math.max(fr.writtenExamScore || 0, makeup.writtenExamScore || 0)
        : (fr.writtenExamScore || 0);
      const finalLab = makeup 
        ? Math.max(fr.computerExamScore || 0, makeup.computerExamScore || 0)
        : (fr.computerExamScore || 0);
      const finalDaily = makeup 
        ? Math.max(fr.dailyScore || 0, makeup.dailyScore || 0)
        : (fr.dailyScore || 0);
      
      // 计算最终综合成绩
      const finalScore = majorCategory === '设计'
        ? finalWritten * 0.4 + finalLab * 0.4 + finalDaily * 0.2
        : finalWritten * 0.5 + finalLab * 0.5;
      
      return {
        id: `final-${fr.studentId}`,
        studentId: fr.studentId,
        studentName: fr.studentName,
        vocabularyScore: finalVocabulary,
        writtenExamScore: finalWritten,
        computerExamScore: finalLab,
        dailyScore: finalDaily,
        examType: 'final',
        classCode: fr.classCode,
        courseName: fr.courseName,
        instructor: fr.instructor,
        finalScore,
      } as any;
    });
  };

  // 获取需要补考的学员（首考不及格的学员）及其需要补考的科目
  const getFailedFirstExamStudents = (): ExamScoreRecord[] => {
    return dataSource
      .filter((i) => i.examType === 'first')
      .filter((i) => computeComprehensive(i) < 60);
  };

  // 获取补考成绩数据（只显示首考不及格的学员，根据首考成绩动态计算需要补考的科目）
  const getMakeupData = (): ExamScoreRecord[] => {
    const failedFirstExams = getFailedFirstExamStudents();
    const failedStudentMap = new Map<string, ExamScoreRecord>();
    failedFirstExams.forEach(s => failedStudentMap.set(s.studentId, s));
    
    return dataSource
      .filter((i) => i.examType === 'makeup' && failedStudentMap.has(i.studentId))
      .map((makeupRecord) => {
        // 如果已经有 failedSubject，直接使用
        if (makeupRecord.failedSubject) {
          return makeupRecord;
        }
        // 否则根据首考成绩计算需要补考的科目
        const firstExam = failedStudentMap.get(makeupRecord.studentId);
        if (firstExam) {
          const failedSubject = getFailedSubject(firstExam);
          return { ...makeupRecord, failedSubject };
        }
        return makeupRecord;
      });
  };

  // 统计数据
  const getStatistics = (examType: 'first' | 'makeup' | 'final') => {
    let typeData: ExamScoreRecord[];
    if (examType === 'final') {
      typeData = computeFinalRows();
    } else if (examType === 'makeup') {
      typeData = getMakeupData();
    } else {
      typeData = dataSource.filter(item => item.examType === examType);
    }
    const totalStudents = typeData.length;
    // 综合成绩仅针对首考/补考，最终由后端计算，这里以首考/补考 >=60 为通过
    const passCount = typeData.filter(item => computeComprehensive(item) >= 60).length;
    const passRate = totalStudents > 0 ? Math.round((passCount / totalStudents) * 10000) / 100 : 0;
    const averageScore = totalStudents > 0 
      ? Math.round(typeData.reduce((sum, item) => sum + computeComprehensive(item), 0) / totalStudents * 100) / 100 
      : 0;

    return {
      totalStudents,
      passCount,
      passRate,
      averageScore
    };
  };

  const firstExamStats = getStatistics('first');
  const makeupExamStats = getStatistics('makeup');
  const finalExamStats = getStatistics('final');

  // 渲染成绩输入框，补考表中只有首考不及格的科目可编辑
  const renderScoreInput = (
    score: number, 
    record: ExamScoreRecord, 
    field: 'vocabularyScore' | 'writtenExamScore' | 'computerExamScore' | 'dailyScore',
    examType: 'first' | 'makeup' | 'final'
  ) => {
    // 最终成绩表显示为只读
    if (examType === 'final') {
      return (
        <Tag color={score >= 60 ? 'green' : score > 0 ? 'orange' : 'default'}>
          {score}
        </Tag>
      );
    }
    
    // 补考表：根据首考成绩判断该科目是否需要补考
    if (examType === 'makeup') {
      // 找到该学员的首考记录
      const firstExam = dataSource.find(
        s => s.examType === 'first' && s.studentId === record.studentId
      );
      
      if (firstExam) {
        // 获取首考该科目的成绩
        const firstScore = firstExam[field] || 0;
        
        // 如果首考该科目>=60分，显示为"免考"
        if (firstScore >= 60) {
          return (
            <Tooltip title={`首考${firstScore}分，免考`}>
              <Tag color="cyan" style={{ cursor: 'default' }}>
                {firstScore} <span style={{ fontSize: 10, opacity: 0.7 }}>免考</span>
              </Tag>
            </Tooltip>
          );
        }
      }
    }
    
    // 可编辑的输入框（首考所有科目，或补考中首考不及格的科目）
    return (
      <InputNumber
        size="small"
        min={0}
        max={100}
        value={score}
        onChange={(value) => handleScoreChange(record.id, field, value || 0)}
        status={score < 60 ? 'error' : undefined}
        style={{ width: '100%', color: score < 60 ? 'red' : 'inherit' }}
      />
    );
  };

  const getColumns = (examType: 'first' | 'makeup' | 'final') => [
    {
      title: '学号',
      dataIndex: 'studentId',
      key: 'studentId',
      width: 100,
      fixed: 'left' as const,
      render: (studentId: string) => (
        <Tag color="blue">{studentId}</Tag>
      ),
    },
    {
      title: '学员姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 100,
      fixed: 'left' as const,
    },
    ...(majorCategory === 'IT'
      ? [
          {
            title: '单词成绩',
            dataIndex: 'vocabularyScore',
            key: 'vocabularyScore',
            width: 100,
            render: (score: number, record: ExamScoreRecord) => 
              renderScoreInput(score, record, 'vocabularyScore', examType),
          },
        ]
      : []),
    {
      title: examType === 'makeup' ? '笔试成绩（补考）' : '笔试成绩',
      dataIndex: 'writtenExamScore',
      key: 'writtenExamScore',
      width: 120,
      render: (score: number, record: ExamScoreRecord) => 
        renderScoreInput(score, record, 'writtenExamScore', examType),
    },
    {
      title: examType === 'makeup' ? '上机成绩（补考）' : '上机成绩',
      dataIndex: 'computerExamScore',
      key: 'computerExamScore',
      width: 120,
      render: (score: number, record: ExamScoreRecord) => 
        renderScoreInput(score, record, 'computerExamScore', examType),
    },
    ...(majorCategory === '设计'
      ? [
          {
            title: examType === 'makeup' ? '平时成绩（补考）' : '平时成绩',
            dataIndex: 'dailyScore',
            key: 'dailyScore',
            width: 120,
            render: (score: number, record: ExamScoreRecord) => 
              renderScoreInput(score, record, 'dailyScore', examType),
          },
        ]
      : []),
    {
      title: '综合成绩',
      key: 'comprehensiveScore',
      width: 100,
      render: (_: any, record: ExamScoreRecord) => {
        const score = computeComprehensive(record);
        return (
          <Tag color={score >= 60 ? 'green' : score > 0 ? 'orange' : 'default'}>
            {Math.round(score * 100) / 100}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_, record: ExamScoreRecord) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              icon={<DeleteOutlined />}
              danger
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 处理成绩变化
  const handleScoreChange = (id: string, field: keyof ExamScoreRecord, value: number) => {
    setDataSource(prev => prev.map(record => {
      if (record.id === id) {
        const updatedRecord = { ...record, [field]: value };
        updatedRecord.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
        return updatedRecord;
      }
      return record;
    }));
  };

  // 处理添加
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      examType: selectedExamType,
      studentId: '',
      studentName: '',
      vocabularyScore: 0,
      writtenExamScore: 0,
      computerExamScore: 0,
      dailyScore: 0,
      classCode: selectedClassCode,
      courseName,
      instructor,
    });
    setModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (record: ExamScoreRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      examDate: dayjs(record.examDate),
    });
    setModalVisible(true);
  };

  // 处理删除
  const handleDelete = (id: string) => {
    setDataSource(prev => prev.filter(item => item.id !== id));
    message.success('删除成功');
  };

  // 删除当前页面全部数据
  const handleDeleteAll = () => {
    const currentTab = activeTab;
    
    if (currentTab === 'first') {
      // 删除所有首考数据
      const firstCount = dataSource.filter(item => item.examType === 'first').length;
      if (firstCount === 0) {
        message.info('当前页面没有数据可删除');
        return;
      }
      setDataSource(prev => prev.filter(item => item.examType !== 'first'));
      message.success(`已删除 ${firstCount} 条首考记录`);
    } else if (currentTab === 'makeup') {
      // 删除所有补考数据
      const makeupCount = dataSource.filter(item => item.examType === 'makeup').length;
      if (makeupCount === 0) {
        message.info('当前页面没有数据可删除');
        return;
      }
      setDataSource(prev => prev.filter(item => item.examType !== 'makeup'));
      message.success(`已删除 ${makeupCount} 条补考记录`);
    } else if (currentTab === 'final') {
      // 最终成绩表是计算出来的，删除对应的首考和补考数据
      const finalRows = computeFinalRows();
      if (finalRows.length === 0) {
        message.info('当前页面没有数据可删除');
        return;
      }
      const finalStudentIds = new Set(finalRows.map(r => r.studentId));
      const beforeCount = dataSource.length;
      setDataSource(prev => {
        const after = prev.filter(item => !finalStudentIds.has(item.studentId));
        const deletedCount = beforeCount - after.length;
        message.success(`已删除 ${deletedCount} 条记录（包括对应的首考和补考数据）`);
        return after;
      });
    }
  };

  // 处理保存
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const formData: Omit<ExamScoreRecord, 'id' | 'failedSubject' | 'updatedAt'> = {
        studentId: values.studentId,
        studentName: values.studentName,
        vocabularyScore: values.vocabularyScore,
        writtenExamScore: values.writtenExamScore,
        computerExamScore: values.computerExamScore,
        dailyScore: values.dailyScore,
        examType: values.examType as ExamType,
        examDate: values.examDate ? values.examDate.format('YYYY-MM-DD') : undefined,
        classCode: selectedClassCode,
        courseName,
        instructor,
      };

      if (editingRecord) {
        // 编辑
        setDataSource(prev => prev.map(item => 
          item.id === editingRecord.id 
            ? { 
                ...item,
                ...formData,
              }
            : item
        ));
        message.success('更新成功');
      } else {
        // 新增
        const newRecord: ExamScoreRecord = {
          id: Date.now().toString(),
          ...formData,
        };
        setDataSource(prev => [...prev, newRecord]);
        message.success('添加成功');
      }
      
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // 处理考试类型变化
  const handleExamTypeChange = (examType: ExamType) => {
    setSelectedExamType(examType);
    setActiveTab(examType);
  };

  // 保存到后端
  const saveToBackend = async () => {
    setLoading(true);
    try {
      const finalRows = computeFinalRows();
      const passCnt = finalRows.filter((r: any) => (r.finalScore ?? computeComprehensive(r)) >= 60).length;
      const firstList = dataSource
        .filter((item) => item.examType === 'first')
        .map((item) => ({
          studentId: item.studentId,
          studentName: item.studentName,
          vocabularyScore: item.vocabularyScore,
          writtenScore: item.writtenExamScore,
          labScore: item.computerExamScore,
          dailyScore: item.dailyScore,
        }));
      const makeupList = dataSource
        .filter((item) => item.examType === 'makeup')
        .map((item) => ({
          studentId: item.studentId,
          studentName: item.studentName,
          vocabularyScore: item.vocabularyScore,
          writtenScore: item.writtenExamScore,
          labScore: item.computerExamScore,
          dailyScore: item.dailyScore,
        }));
      const payload: CreateClassExamScoreRequest = {
        campusName: selectedCampus || currentCampus || '',
        majorName: selectedMajor || majorName,
        className: selectedClassCode,
        courseName: selectedCourse || courseName,
        instructorName: instructor,
        classSize: finalRows.length,
        passCount: passCnt,
        firstExamDate: firstExamDate ? firstExamDate.format('YYYY-MM-DD') : undefined,
        makeupExamDate: makeupExamDate ? makeupExamDate.format('YYYY-MM-DD') : undefined,
        scoresFirst: { students: firstList },
        scoresMakeup: { students: makeupList },
        scoresFinal: {
          students: finalRows.map((r: any) => ({
            studentId: r.studentId,
            studentName: r.studentName,
            vocabularyScore: r.vocabularyScore,
            writtenScore: r.writtenExamScore,
            labScore: r.computerExamScore,
            dailyScore: r.dailyScore,
            totalScore: r.finalScore ?? computeComprehensive(r),
            passed: (r.finalScore ?? computeComprehensive(r)) >= 60,
          })),
        },
      };
      if (backendRecord?.id) {
        const updatePayload: UpdateClassExamScoreRequest = { id: backendRecord.id, ...payload };
        const updated = await classExamScoreService.update(updatePayload);
        setBackendRecord(updated);
        message.success('更新成功');
      } else {
        const created = await classExamScoreService.create(payload);
        setBackendRecord(created);
        message.success('保存成功');
      }
      loadData();
    } catch (error) {
      console.error('保存失败', error);
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 解析粘贴的考试成绩数据
  const parsePastedExamData = (text: string): ParsedExamData => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 3) {
      throw new Error('粘贴的数据至少需要包含表头信息和数据行');
    }

    // 解析每一行
    const rows = lines.map(line => {
      if (line.includes('\t')) {
        return line.split('\t').map(cell => cell.trim());
      }
      return line.split(/\s{2,}/).map(cell => cell.trim());
    });

    console.log('[考试成绩导入] 原始行数:', rows.length);
    console.log('[考试成绩导入] 前10行:', rows.slice(0, 10));

    // 解析元数据
    const metadata: ParsedExamData['metadata'] = {};
    
    // 遍历前几行，提取元数据
    for (let i = 0; i < Math.min(15, rows.length); i++) {
      const row = rows[i];
      const rowText = row.join(' ');
      
      // 神殿名称
      if (rowText.includes('神殿名称')) {
        const idx = row.findIndex(c => c.includes('神殿名称'));
        if (idx >= 0 && row[idx + 1]) {
          metadata.campusName = row[idx + 1].replace(/神殿$/, '');
        }
      }
      // 专业名称
      if (rowText.includes('专业名') || rowText.includes('专业名称')) {
        const idx = row.findIndex(c => c.includes('专业名'));
        if (idx >= 0 && row[idx + 1]) {
          metadata.majorName = row[idx + 1];
        }
      }
      // 班级名称
      if (rowText.includes('班级名') || rowText.includes('班级名称')) {
        const idx = row.findIndex(c => c.includes('班级名'));
        if (idx >= 0 && row[idx + 1]) {
          metadata.className = row[idx + 1];
        }
      }
      // 课程名称
      if (rowText.includes('课程名') || rowText.includes('课程名称')) {
        const idx = row.findIndex(c => c.includes('课程名'));
        if (idx >= 0 && row[idx + 1]) {
          metadata.courseName = row[idx + 1];
        }
      }
      // 教员姓名
      if (rowText.includes('教员姓') || rowText.includes('教员姓名')) {
        const idx = row.findIndex(c => c.includes('教员姓'));
        if (idx >= 0 && row[idx + 1]) {
          metadata.instructorName = row[idx + 1];
        }
      }
      // 首考时间
      if (rowText.includes('首考时间')) {
        const idx = row.findIndex(c => c.includes('首考时间'));
        if (idx >= 0 && row[idx + 1]) {
          const dateStr = row[idx + 1];
          const match = dateStr.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
          if (match) {
            metadata.firstExamDate = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
          }
        }
      }
      // 补考时间
      if (rowText.includes('补考时间')) {
        const idx = row.findIndex(c => c.includes('补考时间'));
        if (idx >= 0 && row[idx + 1]) {
          const dateStr = row[idx + 1];
          const match = dateStr.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
          if (match) {
            metadata.makeupExamDate = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
          }
        }
      }
      // 班级人数
      if (rowText.includes('班级人数')) {
        const idx = row.findIndex(c => c.includes('班级人数'));
        if (idx >= 0 && row[idx + 1]) {
          const num = parseInt(row[idx + 1]);
          if (!isNaN(num)) metadata.classSize = num;
        }
      }
      // 合格人数
      if (rowText.includes('合格人数')) {
        const idx = row.findIndex(c => c.includes('合格人数'));
        if (idx >= 0 && row[idx + 1]) {
          const num = parseInt(row[idx + 1]);
          if (!isNaN(num)) metadata.passCount = num;
        }
      }
      // 合格率
      if (rowText.includes('合格率')) {
        const idx = row.findIndex(c => c.includes('合格率'));
        if (idx >= 0 && row[idx + 1]) {
          const rate = parseFloat(row[idx + 1].replace('%', ''));
          if (!isNaN(rate)) metadata.passRate = rate;
        }
      }
      // 平均成绩
      if (rowText.includes('平均成绩')) {
        const idx = row.findIndex(c => c.includes('平均成绩'));
        if (idx >= 0 && row[idx + 1]) {
          const score = parseFloat(row[idx + 1]);
          if (!isNaN(score)) metadata.averageScore = score;
        }
      }
    }

    console.log('[考试成绩导入] 解析的元数据:', metadata);

    // 查找三个成绩表的位置
    let firstExamStartIdx = -1;
    let makeupExamStartIdx = -1;
    let finalExamStartIdx = -1;

    for (let i = 0; i < rows.length; i++) {
      const rowText = rows[i].join(' ').toLowerCase();
      if (rowText.includes('首考成绩表') || rowText.includes('首考成绩')) {
        firstExamStartIdx = i;
      } else if (rowText.includes('补考成绩表') || rowText.includes('补考成绩')) {
        makeupExamStartIdx = i;
      } else if (rowText.includes('最终成绩表') || rowText.includes('最终成绩')) {
        finalExamStartIdx = i;
      }
    }

    console.log('[考试成绩导入] 表格位置 - 首考:', firstExamStartIdx, '补考:', makeupExamStartIdx, '最终:', finalExamStartIdx);

    // 解析单个成绩表的函数
    const parseExamTable = (startIdx: number, endIdx: number): Array<{
      studentId: string;
      studentName: string;
      vocabularyScore: number;
      writtenScore: number;
      labScore: number;
      dailyScore: number;
      totalScore?: number;
    }> => {
      if (startIdx < 0) return [];
      
      const students: Array<{
        studentId: string;
        studentName: string;
        vocabularyScore: number;
        writtenScore: number;
        labScore: number;
        dailyScore: number;
        totalScore?: number;
      }> = [];
      
      // 找到表头行（包含"学号"或"学员姓名"的行）
      let headerRowIdx = -1;
      let colMapping: { [key: string]: number } = {};
      
      for (let i = startIdx; i < endIdx; i++) {
        const row = rows[i];
        const rowText = row.join(' ').toLowerCase();
        if (rowText.includes('学号') || rowText.includes('学员姓名') || rowText.includes('姓名')) {
          headerRowIdx = i;
          // 建立列映射
          row.forEach((cell, idx) => {
            const cellLower = cell.toLowerCase();
            if (cellLower.includes('学号') || cellLower === '序号') colMapping['studentId'] = idx;
            if (cellLower.includes('姓名') || cellLower.includes('学员')) colMapping['studentName'] = idx;
            if (cellLower.includes('单词')) colMapping['vocabulary'] = idx;
            if (cellLower.includes('笔试')) colMapping['written'] = idx;
            if (cellLower.includes('上机')) colMapping['lab'] = idx;
            if (cellLower.includes('平时')) colMapping['daily'] = idx;
            if (cellLower.includes('综合') || cellLower.includes('总')) colMapping['total'] = idx;
          });
          break;
        }
      }

      console.log('[考试成绩导入] 表头位置:', headerRowIdx, '列映射:', colMapping);
      
      if (headerRowIdx < 0) return students;
      
      // 解析数据行
      for (let i = headerRowIdx + 1; i < endIdx; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue;
        
        const firstCell = String(row[0] || '').trim();
        // 跳过空行或汇总行
        if (!firstCell || firstCell.includes('合计') || firstCell.includes('统计') || firstCell.includes('平均')) {
          continue;
        }
        
        // 解析学号和姓名
        let studentId = '';
        let studentName = '';
        
        if (colMapping['studentId'] !== undefined) {
          studentId = String(row[colMapping['studentId']] || '').trim();
        }
        if (colMapping['studentName'] !== undefined) {
          studentName = String(row[colMapping['studentName']] || '').trim();
        }
        
        // 如果没有找到姓名列，尝试智能推断
        if (!studentName) {
          // 第一列是数字（学号），第二列是姓名
          if (/^\d+$/.test(firstCell)) {
            studentId = firstCell;
            studentName = String(row[1] || '').trim();
          } else if (/[\u4e00-\u9fa5]/.test(firstCell)) {
            // 第一列是姓名
            studentName = firstCell;
            studentId = String(students.length + 1);
          }
        }
        
        if (!studentName || !studentName.match(/[\u4e00-\u9fa5]/)) continue;
        
        // 解析成绩
        const parseScore = (idx: number | undefined): number => {
          if (idx === undefined) return 0;
          const val = parseFloat(String(row[idx] || '0').replace(/[^\d.]/g, ''));
          return isNaN(val) ? 0 : val;
        };
        
        const vocabulary = parseScore(colMapping['vocabulary']);
        const written = parseScore(colMapping['written']);
        const lab = parseScore(colMapping['lab']);
        const daily = parseScore(colMapping['daily']);
        const total = parseScore(colMapping['total']);
        
        students.push({
          studentId: studentId || String(students.length + 1),
          studentName,
          vocabularyScore: vocabulary,
          writtenScore: written,
          labScore: lab,
          dailyScore: daily,
          totalScore: total > 0 ? total : undefined,
        });
      }
      
      return students;
    };

    // 如果没有找到明确的表格标记，尝试解析整个数据作为首考成绩
    if (firstExamStartIdx < 0 && makeupExamStartIdx < 0 && finalExamStartIdx < 0) {
      console.log('[考试成绩导入] 未找到表格标记，尝试解析为单表格');
      const allStudents = parseExamTable(0, rows.length);
      return {
        metadata,
        firstExamStudents: allStudents,
        makeupExamStudents: [],
        finalExamStudents: [],
      };
    }

    // 确定各表格的结束位置
    const getEndIdx = (startIdx: number, nextStarts: number[]): number => {
      const validNextStarts = nextStarts.filter(idx => idx > startIdx);
      if (validNextStarts.length === 0) return rows.length;
      return Math.min(...validNextStarts);
    };

    const firstExamEndIdx = getEndIdx(firstExamStartIdx, [makeupExamStartIdx, finalExamStartIdx]);
    const makeupExamEndIdx = getEndIdx(makeupExamStartIdx, [finalExamStartIdx]);
    const finalExamEndIdx = rows.length;

    // 解析各表格
    const firstExamStudents = parseExamTable(firstExamStartIdx, firstExamEndIdx);
    const makeupExamStudents = parseExamTable(makeupExamStartIdx, makeupExamEndIdx);
    const finalExamStudents = parseExamTable(finalExamStartIdx, finalExamEndIdx);

    console.log('[考试成绩导入] 解析完成 - 首考:', firstExamStudents.length, '补考:', makeupExamStudents.length, '最终:', finalExamStudents.length);

    if (firstExamStudents.length === 0 && makeupExamStudents.length === 0 && finalExamStudents.length === 0) {
      throw new Error('未能解析出学员数据，请检查数据格式');
    }

    return {
      metadata,
      firstExamStudents,
      makeupExamStudents,
      finalExamStudents,
    };
  };

  // 处理粘贴文本变化
  const handlePasteTextChange = (text: string) => {
    setPasteText(text);
    setPasteError('');
    setParsedPasteData(null);

    if (!text.trim()) return;

    try {
      const parsed = parsePastedExamData(text);
      setParsedPasteData(parsed);
      const totalStudents = parsed.firstExamStudents.length + parsed.makeupExamStudents.length + parsed.finalExamStudents.length;
      if (totalStudents === 0) {
        setPasteError('未能解析出有效的学员数据');
      }
    } catch (error: any) {
      console.error('[考试成绩导入] 解析错误:', error);
      setPasteError(error.message || '解析失败');
    }
  };

  // 执行粘贴导入
  const handlePasteImport = async () => {
    if (!parsedPasteData) {
      message.warning('没有可导入的数据');
      return;
    }

    const totalStudents = parsedPasteData.firstExamStudents.length + 
                          parsedPasteData.makeupExamStudents.length + 
                          parsedPasteData.finalExamStudents.length;
    if (totalStudents === 0) {
      message.warning('没有可导入的学员数据');
      return;
    }

    setPasteLoading(true);

    try {
      const meta = parsedPasteData.metadata;
      
      // 更新元数据（确保有值）
      const finalCampus = meta.campusName || selectedCampus || currentCampus || '';
      const finalMajor = meta.majorName || majorName || '';
      const finalClass = meta.className || selectedClassCode || '';
      const finalCourse = meta.courseName || courseName || '';
      const finalInstructor = meta.instructorName || instructor || '';
      
      // 设置状态
      if (meta.campusName) {
        setSelectedCampus(meta.campusName);
      }
      if (meta.majorName) {
        setMajorName(meta.majorName);
        setSelectedMajor(meta.majorName);
      }
      if (meta.className) {
        setSelectedClassCode(meta.className);
      }
      if (meta.courseName) {
        setCourseName(meta.courseName);
        setSelectedCourse(meta.courseName);
      }
      if (meta.instructorName) {
        setInstructor(meta.instructorName);
      }
      if (meta.firstExamDate) {
        setFirstExamDate(dayjs(meta.firstExamDate));
      }
      if (meta.makeupExamDate) {
        setMakeupExamDate(dayjs(meta.makeupExamDate));
      }

      // 转换学员数据为页面格式
      const convertToRecord = (
        student: typeof parsedPasteData.firstExamStudents[0],
        examType: ExamType,
        idx: number
      ): ExamScoreRecord => ({
        id: `${examType}-${Date.now()}-${idx}`,
        studentId: student.studentId,
        studentName: student.studentName,
        vocabularyScore: student.vocabularyScore,
        writtenExamScore: student.writtenScore,
        computerExamScore: student.labScore,
        dailyScore: student.dailyScore,
        examType,
        classCode: finalClass,
        courseName: finalCourse,
        instructor: finalInstructor,
      });

      // 构建新的数据数组（一次性更新，避免多次setState）
      const updatedRecords: ExamScoreRecord[] = [...dataSource];
      const newRecords: ExamScoreRecord[] = [];
      let updatedCount = 0;
      let newCount = 0;

      // 处理首考数据
      parsedPasteData.firstExamStudents.forEach((stu, idx) => {
        const existingIdx = updatedRecords.findIndex(
          r => r.examType === 'first' && r.studentName === stu.studentName
        );
        if (existingIdx >= 0) {
          // 更新现有记录
          updatedRecords[existingIdx] = {
            ...updatedRecords[existingIdx],
            vocabularyScore: stu.vocabularyScore,
            writtenExamScore: stu.writtenScore,
            computerExamScore: stu.labScore,
            dailyScore: stu.dailyScore,
          };
          updatedCount++;
        } else {
          newRecords.push(convertToRecord(stu, 'first', idx));
          newCount++;
        }
      });

      // 处理补考数据
      parsedPasteData.makeupExamStudents.forEach((stu, idx) => {
        const existingIdx = updatedRecords.findIndex(
          r => r.examType === 'makeup' && r.studentName === stu.studentName
        );
        if (existingIdx >= 0) {
          // 更新现有记录
          updatedRecords[existingIdx] = {
            ...updatedRecords[existingIdx],
            vocabularyScore: stu.vocabularyScore,
            writtenExamScore: stu.writtenScore,
            computerExamScore: stu.labScore,
            dailyScore: stu.dailyScore,
          };
          updatedCount++;
        } else {
          newRecords.push(convertToRecord(stu, 'makeup', idx + 1000));
          newCount++;
        }
      });

      // 一次性更新数据源
      const finalDataSource = [...updatedRecords, ...newRecords];
      setDataSource(finalDataSource);
      
      console.log('[考试成绩导入] 导入完成，数据数量:', finalDataSource.length);
      console.log('[考试成绩导入] 首考数据:', finalDataSource.filter(r => r.examType === 'first'));
      console.log('[考试成绩导入] 补考数据:', finalDataSource.filter(r => r.examType === 'makeup'));

      message.success(`导入成功！新增 ${newCount} 条记录，更新 ${updatedCount} 条记录`);

      // 关闭模态框
      setPasteModalVisible(false);
      setPasteText('');
      setParsedPasteData(null);
      setPasteError('');

      // 使用 setTimeout 确保状态更新后再保存
      // 直接调用保存函数，传入导入的数据
      setTimeout(async () => {
        try {
          setLoading(true);
          const finalRows = finalDataSource.filter(r => r.examType === 'first').map(fr => {
            const makeup = finalDataSource.find(
              m => m.examType === 'makeup' && m.studentId === fr.studentId
            );
            const finalWritten = makeup 
              ? Math.max(fr.writtenExamScore || 0, makeup.writtenExamScore || 0)
              : (fr.writtenExamScore || 0);
            const finalLab = makeup 
              ? Math.max(fr.computerExamScore || 0, makeup.computerExamScore || 0)
              : (fr.computerExamScore || 0);
            const finalScore = majorCategory === '设计'
              ? finalWritten * 0.4 + finalLab * 0.4 + ((makeup?.dailyScore || fr.dailyScore || 0) * 0.2)
              : finalWritten * 0.5 + finalLab * 0.5;
            return { ...fr, finalScore };
          });
          
          const passCnt = finalRows.filter((r: any) => (r.finalScore ?? 0) >= 60).length;
          const firstList = finalDataSource
            .filter((item) => item.examType === 'first')
            .map((item) => ({
              studentId: item.studentId,
              studentName: item.studentName,
              vocabularyScore: item.vocabularyScore,
              writtenScore: item.writtenExamScore,
              labScore: item.computerExamScore,
              dailyScore: item.dailyScore,
            }));
          const makeupList = finalDataSource
            .filter((item) => item.examType === 'makeup')
            .map((item) => ({
              studentId: item.studentId,
              studentName: item.studentName,
              vocabularyScore: item.vocabularyScore,
              writtenScore: item.writtenExamScore,
              labScore: item.computerExamScore,
              dailyScore: item.dailyScore,
            }));
          
          const payload: CreateClassExamScoreRequest = {
            campusName: finalCampus,
            majorName: finalMajor,
            className: finalClass,
            courseName: finalCourse,
            instructorName: finalInstructor,
            classSize: finalRows.length,
            passCount: passCnt,
            firstExamDate: meta.firstExamDate || (firstExamDate ? firstExamDate.format('YYYY-MM-DD') : undefined),
            makeupExamDate: meta.makeupExamDate || (makeupExamDate ? makeupExamDate.format('YYYY-MM-DD') : undefined),
            scoresFirst: { students: firstList },
            scoresMakeup: { students: makeupList },
            scoresFinal: {
              students: finalRows.map((r: any) => ({
                studentId: r.studentId,
                studentName: r.studentName,
                vocabularyScore: r.vocabularyScore,
                writtenScore: r.writtenExamScore,
                labScore: r.computerExamScore,
                dailyScore: r.dailyScore,
                totalScore: r.finalScore ?? 0,
                passed: (r.finalScore ?? 0) >= 60,
              })),
            },
          };
          
          console.log('[考试成绩导入] 保存数据:', payload);
          
          if (backendRecord?.id) {
            const updatePayload: UpdateClassExamScoreRequest = { id: backendRecord.id, ...payload };
            const updated = await classExamScoreService.update(updatePayload);
            setBackendRecord(updated);
            message.success('已更新到后端');
          } else {
            const created = await classExamScoreService.create(payload);
            setBackendRecord(created);
            message.success('已保存到后端');
          }
          
          // 重新加载数据以确保显示正确
          await loadData();
        } catch (error) {
          console.error('[考试成绩导入] 保存失败:', error);
          message.error('保存到后端失败，请手动点击保存按钮');
        } finally {
          setLoading(false);
        }
      }, 100);
      
    } catch (error: any) {
      console.error('[考试成绩导入] 导入失败:', error);
      message.error('导入失败: ' + (error.message || '未知错误'));
    } finally {
      setPasteLoading(false);
    }
  };

  // 从班档案表生成学员数据（排除退费明细表中的学员）
  const handleGenerateStudentsFromArchive = async () => {
    if (!currentCampus && !selectedCampus) {
      message.warning('请先选择神殿');
      return;
    }
    if (!selectedClassCode) {
      message.warning('请先选择班级');
      return;
    }

    try {
      setLoading(true);
      const campus = selectedCampus || currentCampus || '';
      // 尝试从班档案表获取学员列表
      const campusName = campus.replace(/神殿$/, '');
      
      // 依次尝试不同的神殿名称格式
      const tryFetchClassFile = async (campusArg: string) => {
        const res = await apiFetch(buildApiUrl(`/teaching-quality/class-file?campus=${encodeURIComponent(campusArg)}&class=${encodeURIComponent(selectedClassCode)}`));
        if (!res.ok) return null;
        const data = await res.json();
        return data;
      };

      let archiveData = await tryFetchClassFile(campusName);
      if (!archiveData || !archiveData.行列表 || archiveData.行列表.length === 0) {
        // 尝试带"神殿"后缀
        archiveData = await tryFetchClassFile(`${campusName}神殿`);
      }
      if (!archiveData || !archiveData.行列表 || archiveData.行列表.length === 0) {
        // 尝试原始神殿名
        archiveData = await tryFetchClassFile(campus);
      }

      if (!archiveData || !archiveData.行列表 || archiveData.行列表.length === 0) {
        message.warning('未找到该班级的档案数据，请确认神殿和班级是否正确');
        return;
      }

      // 获取退费明细表中的学员名单（按姓名和身份证号排除）
      const refundedNames = new Set<string>();
      const refundedIds = new Set<string>();
      
      // 获取近4年所有月份的退费数据
      const currentYear = dayjs().year();
      const yearsToCheck = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
      const tryFetchRefund = async (campusArg: string) => {
        const names = new Set<string>();
        const ids = new Set<string>();
        // 获取近4年所有月份的退费数据
        for (const year of yearsToCheck) {
          // 优先使用全年查询API
          try {
            const yearRes = await apiFetch(buildApiUrl(`/teaching-quality/campus-refund-detail-year?campus=${encodeURIComponent(campusArg)}&year=${year}`));
            if (yearRes.ok) {
              const yearData = await yearRes.json();
              (yearData.行列表 || []).forEach((row: any) => {
                const name = (row.name || row.姓名 || '').trim();
                const idCard = (row.idCard || row.身份证号 || '').trim();
                if (name) names.add(name);
                if (idCard) ids.add(idCard);
              });
              continue; // 全年API成功，跳到下一年
            }
          } catch {
            // 全年API失败，回退到按月查询
          }
          // 回退到按月查询
          for (let m = 1; m <= 12; m++) {
            try {
              const res = await apiFetch(buildApiUrl(`/teaching-quality/campus-refund-detail?campus=${encodeURIComponent(campusArg)}&year=${year}&month=${m}`));
              if (res.ok) {
                const data = await res.json();
                (data.行列表 || []).forEach((row: any) => {
                  const name = (row.name || row.姓名 || '').trim();
                  const idCard = (row.idCard || row.身份证号 || '').trim();
                  if (name) names.add(name);
                  if (idCard) ids.add(idCard);
                });
              }
            } catch {
              // 忽略单个月份获取失败
            }
          }
        }
        return { names, ids };
      };

      // 尝试不同神殿格式获取退费数据
      let refundResult = await tryFetchRefund(campusName);
      if (refundResult.names.size === 0) {
        refundResult = await tryFetchRefund(`${campusName}神殿`);
      }
      if (refundResult.names.size === 0) {
        refundResult = await tryFetchRefund(campus);
      }
      
      refundResult.names.forEach(n => refundedNames.add(n));
      refundResult.ids.forEach(id => refundedIds.add(id));

      // 根据当前选中的考试类型决定导入逻辑
      // 优先使用 activeTab，因为它能准确反映用户当前查看的 TAB
      const currentExamType = (activeTab === 'first' || activeTab === 'makeup') 
        ? activeTab 
        : (selectedExamType === 'first' || selectedExamType === 'makeup' 
          ? selectedExamType 
          : 'first'); // final tab 默认导入到首考
      
      console.log('[从班档案导入] 当前考试类型:', {
        activeTab,
        selectedExamType,
        currentExamType,
        dataSourceLength: dataSource.length,
        firstExamCount: dataSource.filter(s => s.examType === 'first').length,
        makeupExamCount: dataSource.filter(s => s.examType === 'makeup').length,
      });

      // 如果是补考，检查首考成绩，只导入首考不及格的学员
      if (currentExamType === 'makeup') {
        // 获取所有首考记录
        const firstExamStudents = dataSource.filter(s => s.examType === 'first');
        console.log('[补考导入] 首考成绩表学员数:', firstExamStudents.length);
        
        // 计算每个首考学员的综合成绩，找出不及格的
        const failedStudents: ExamScoreRecord[] = [];
        firstExamStudents.forEach(student => {
          const comprehensiveScore = computeComprehensive(student);
          console.log(`[补考导入] 学员 ${student.studentName} (${student.studentId}) 综合成绩: ${comprehensiveScore}`, {
            written: student.writtenExamScore,
            lab: student.computerExamScore,
            daily: student.dailyScore,
            vocabulary: student.vocabularyScore,
            majorCategory,
          });
          if (comprehensiveScore < 60) {
            failedStudents.push(student);
          }
        });
        
        console.log('[补考导入] 首考不及格学员数:', failedStudents.length, failedStudents.map(s => s.studentName));
        
        if (failedStudents.length === 0) {
          message.warning('首考成绩表中没有不及格的学员，无需导入补考学员');
          return;
        }
        
        // 获取已存在于补考表中的学员
        const existingMakeupIds = new Set(
          dataSource.filter(s => s.examType === 'makeup').map(s => s.studentId)
        );
        const existingMakeupNames = new Set(
          dataSource.filter(s => s.examType === 'makeup').map(s => s.studentName)
        );
        
        const newStudents: ExamScoreRecord[] = [];
        let skippedCount = 0;
        
        failedStudents.forEach((failedStudent, idx) => {
          // 跳过已存在于补考表的学员
          if (existingMakeupIds.has(failedStudent.studentId) || existingMakeupNames.has(failedStudent.studentName)) {
            skippedCount++;
            return;
          }
          
          // 补考记录：首考不及格的科目设为0，及格的科目继承首考成绩
          const written = failedStudent.writtenExamScore || 0;
          const lab = failedStudent.computerExamScore || 0;
          const daily = failedStudent.dailyScore || 0;
          
          newStudents.push({
            id: `makeup-${Date.now()}-${idx}`,
            studentId: failedStudent.studentId,
            studentName: failedStudent.studentName,
            // 单词成绩继承首考（IT规则下单词不参与综合成绩计算）
            vocabularyScore: failedStudent.vocabularyScore || 0,
            // 笔试：首考>=60继承，<60设为0需要补考
            writtenExamScore: written >= 60 ? written : 0,
            // 上机：首考>=60继承，<60设为0需要补考
            computerExamScore: lab >= 60 ? lab : 0,
            // 平时：首考>=60继承，<60设为0需要补考
            dailyScore: daily >= 60 ? daily : 0,
            examType: 'makeup',
            classCode: selectedClassCode,
            courseName: courseName || '',
            instructor: instructor || '',
          });
        });

        if (newStudents.length === 0) {
          if (skippedCount > 0) {
            message.info(`首考不及格的学员已全部存在于补考成绩表中（已跳过${skippedCount}人）`);
          } else {
            message.info('首考不及格的学员已全部存在于补考成绩表中');
          }
          return;
        }

        setDataSource(prev => [...prev, ...newStudents]);
        const skippedMsg = skippedCount > 0 ? `（已跳过已存在的${skippedCount}人）` : '';
        message.success(`已从首考不及格学员中导入 ${newStudents.length} 名学员到补考成绩表${skippedMsg}`);
        return;
      }

      // 首考导入逻辑（原有逻辑）
      // 从档案数据生成学员列表
      const existingIds = new Set(
        dataSource.filter(s => s.examType === 'first').map(s => s.studentId)
      );
      const existingNames = new Set(
        dataSource.filter(s => s.examType === 'first').map(s => s.studentName)
      );
      
      const newStudents: ExamScoreRecord[] = [];
      let refundedCount = 0;
      
      archiveData.行列表.forEach((row: any, idx: number) => {
        const name = (row.name || row.姓名 || '').trim();
        const idCard = (row.idCard || row.身份证号 || '').trim();
        const studentId = idCard || `${selectedClassCode}-${String(row.serialNumber || idx + 1).padStart(2, '0')}`;
        
        // 跳过已存在的学员（按姓名或学号判断）
        if (!name || existingNames.has(name) || existingIds.has(studentId)) {
          return;
        }
        
        // 跳过退费学员（按姓名或身份证号判断）
        if (refundedNames.has(name) || (idCard && refundedIds.has(idCard))) {
          refundedCount++;
          return;
        }

        // 添加到首考记录
        newStudents.push({
          id: `first-${Date.now()}-${idx}`,
          studentId: studentId,
          studentName: name,
          vocabularyScore: 0,
          writtenExamScore: 0,
          computerExamScore: 0,
          dailyScore: 0,
          examType: 'first',
          classCode: selectedClassCode,
          courseName: courseName || '',
          instructor: instructor || '',
        });
      });

      if (newStudents.length === 0) {
        if (refundedCount > 0) {
          message.info(`档案中的学员已存在或已退费（排除退费学员${refundedCount}人）`);
        } else {
          message.info('档案中的所有学员已存在于当前列表中');
        }
        return;
      }

      setDataSource(prev => [...prev, ...newStudents]);
      const refundMsg = refundedCount > 0 ? `，已排除退费学员${refundedCount}人` : '';
      message.success(`已从班档案表导入 ${newStudents.length} 名学员到首考成绩表${refundMsg}`);
    } catch (error) {
      console.error('从班档案表生成学员失败:', error);
      message.error('从班档案表获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理班级变化
  const handleClassChange = (classCode: string) => {
    setSelectedClassCode(classCode);
  };

  // 过滤数据
  const getFilteredData = (examType: 'first' | 'makeup' | 'final') => {
    let source: ExamScoreRecord[];
    if (examType === 'final') {
      source = computeFinalRows();
    } else if (examType === 'makeup') {
      source = getMakeupData();
    } else {
      source = dataSource.filter(item => item.examType === examType);
    }
    const filtered = source.filter(item => {
      const matchesSearch =
        !searchText ||
        item.studentName.toLowerCase().includes(searchText.toLowerCase()) ||
        item.studentId.toLowerCase().includes(searchText.toLowerCase());
      // 如果没有选择班级，显示所有数据；否则只显示匹配的班级
      // 支持灵活的匹配：去除"班"后缀后比较，或直接比较
      const matchesClass = !selectedClassCode || 
        item.classCode === selectedClassCode ||
        item.classCode?.replace(/班$/, '') === selectedClassCode?.replace(/班$/, '') ||
        selectedClassCode === item.classCode?.replace(/班$/, '');
      return matchesSearch && matchesClass;
    });
    console.log(`[过滤数据] ${examType} - 原始数据: ${source.length} 条, 过滤后: ${filtered.length} 条, selectedClassCode: ${selectedClassCode}`);
    if (filtered.length === 0 && source.length > 0) {
      console.warn('[过滤数据] 数据被过滤掉了，示例数据:', source[0]);
    }
    return filtered;
  };

  // 渲染统计面板
  const renderStatistics = (stats: any, title: string, color: string) => (
    <Row gutter={16} style={{ marginBottom: 16, padding: 16, backgroundColor: color, borderRadius: 8 }}>
      <Col span={6}>
        <Statistic
          title={`${title} - 班级人数`}
          value={stats.totalStudents}
          suffix="人"
          prefix={<TeamOutlined />}
        />
      </Col>
      <Col span={6}>
        <Statistic
          title={`${title} - 合格人数`}
          value={stats.passCount}
          suffix="人"
          prefix={<CheckCircleOutlined />}
          valueStyle={{ color: '#52c41a' }}
        />
      </Col>
      <Col span={6}>
        <Statistic
          title={`${title} - 合格率`}
          value={stats.passRate}
          suffix="%"
          prefix={<CalculatorOutlined />}
          valueStyle={{ color: '#1890ff' }}
        />
      </Col>
      <Col span={6}>
        <Statistic
          title={`${title} - 平均成绩`}
          value={stats.averageScore}
          suffix="分"
          prefix={<TrophyOutlined />}
          valueStyle={{ color: '#faad14' }}
        />
      </Col>
    </Row>
  );

  return (
    <div style={{ padding: 24 }}>
      <Card>
        {/* 表头信息 */}
        <Row gutter={16} style={{ marginBottom: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8, alignItems: 'center' }}>
          <Col span={4}>
            <Space>
              <strong>神殿名称：</strong>
              <Select
                style={{ width: 140 }}
                value={selectedCampus || currentCampus}
                options={mergedCampusOptions}
                showSearch
                filterOption={(input, option) =>
                  (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
                }
                onChange={(v) => {
                  setSelectedCampus(v);
                  setSelectedClassCode('');
                  setSelectedMajor('');
                }}
              />
            </Space>
          </Col>
          <Col span={4}>
            <Space>
              <strong>专业名称：</strong>
              <Select
                value={majorName}
                onChange={(v) => {
                  setMajorName(v);
                  setSelectedMajor(v);
                  setSelectedCourse('');
                }}
                style={{ width: 140 }}
                options={mergedMajorOptions}
                showSearch
                filterOption={(input, option) =>
                  (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
                }
                allowClear
                placeholder="请选择"
              />
            </Space>
          </Col>
          <Col span={5}>
            <Space>
              <strong>班级名称：</strong>
              <Select
                value={selectedClassCode}
                onChange={handleClassChange}
                style={{ width: 140 }}
                options={mergedClassOptions}
                showSearch
                filterOption={(input, option) =>
                  (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
                }
                allowClear
                placeholder="请选择"
              />
            </Space>
          </Col>
          <Col span={5}>
            <Space>
              <strong>课程名称：</strong>
              <Select
                value={courseName}
                onChange={(v) => { setCourseName(v); setSelectedCourse(v); }}
                style={{ width: 140 }}
                options={mergedCourseOptions}
                allowClear
                placeholder="请选择"
              />
            </Space>
          </Col>
          <Col span={5}>
            <Space>
              <strong>教员姓名：</strong>
              <Select
                value={instructor}
                onChange={setInstructor}
                style={{ width: 120 }}
                placeholder="请选择教员"
                options={mergedTeacherOptions}
                showSearch
                filterOption={(input, option) =>
                  (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
                }
                allowClear
              />
            </Space>
          </Col>
        </Row>

        {/* 必填字段提示 */}
        {(!majorName || !selectedClassCode || !courseName || !instructor) && (
          <Alert
            message="提示"
            description="请先填写上方的必填字段：专业名称、班级名称、课程名称、教员姓名，才能保存数据到后端。"
            type="warning"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        <Row gutter={16} style={{ marginBottom: 24, padding: 16, backgroundColor: '#f0f9ff', borderRadius: 8, alignItems: 'center' }}>
          <Col span={6}>
            <Space>
              <strong>首考时间：</strong>
              <DatePicker value={firstExamDate} onChange={setFirstExamDate} format="YYYY/MM/DD" />
            </Space>
          </Col>
          <Col span={6}>
            <Space>
              <strong>补考时间：</strong>
              <DatePicker value={makeupExamDate} onChange={setMakeupExamDate} format="YYYY/MM/DD" />
            </Space>
          </Col>
          <Col span={6}>
            <strong>班级人数：</strong>{getFilteredData('first').length}
          </Col>
          <Col span={6}>
            <strong>合格人数：</strong>{firstExamStats.passCount}
          </Col>
        </Row>

        {/* 筛选条件 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Input.Search
            placeholder="搜索学号或姓名"
            style={{ width: 300 }}
            onSearch={handleSearch}
            allowClear
          />
          <Button type="primary" onClick={saveToBackend}>保存到后端</Button>
        </div>

        {/* 操作按钮 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              添加成绩记录
            </Button>
            <Button
              icon={<UsergroupAddOutlined />}
              onClick={handleGenerateStudentsFromArchive}
              loading={loading}
            >
              从班档案导入学员
            </Button>
            <Button
              icon={<CopyOutlined />}
              onClick={() => setPasteModalVisible(true)}
            >
              从剪切板导入
            </Button>
            <Popconfirm
              title="确定要删除当前页面的全部数据吗？"
              description={`将删除${activeTab === 'first' ? '首考' : activeTab === 'makeup' ? '补考' : '最终'}成绩表的所有数据`}
              onConfirm={handleDeleteAll}
              okText="确定"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
              >
                删除当前页面全部数据
              </Button>
            </Popconfirm>
            <Space>
              <strong>计算规则：</strong>
              <Select
                value={majorCategory}
                onChange={handleCalcRuleChange}
                style={{ width: 120 }}
              >
                <Option value="IT">IT（笔试50%+上机50%）</Option>
                <Option value="设计">设计（笔试40%+上机40%+平时20%）</Option>
              </Select>
            </Space>
          </Space>
        </div>

        {/* 三个成绩表格 */}
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setSelectedExamType(key as ExamType);
          }}
          items={[
            {
              key: 'first',
              label: '首考成绩表',
              children: (
                <div>
                  {renderStatistics(firstExamStats, '首考', '#f0f9ff')}
                  <Table
                    columns={getColumns('first')}
                    dataSource={getFilteredData('first')}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1000 }}
                    pagination={{
                      defaultPageSize: 20,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                    }}
                    bordered
                    size="small"
                  />
                </div>
              ),
            },
            {
              key: 'makeup',
              label: '补考成绩表',
              children: (
                <div>
                  {renderStatistics(makeupExamStats, '补考', '#fff7e6')}
                  <Table
                    columns={getColumns('makeup')}
                    dataSource={getFilteredData('makeup')}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1000 }}
                    pagination={{
                      defaultPageSize: 20,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                    }}
                    bordered
                    size="small"
                  />
                </div>
              ),
            },
            {
              key: 'final',
              label: '最终成绩表',
              children: (
                <div>
                  {renderStatistics(finalExamStats, '最终', '#f6ffed')}
                  <Table
                    columns={getColumns('final')}
                    dataSource={getFilteredData('final')}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1000 }}
                    pagination={{
                      defaultPageSize: 20,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                    }}
                    bordered
                    size="small"
                  />
                </div>
              ),
            },
          ]}
        />

        {/* 说明信息 */}
        <Alert
          message="说明"
          description="此表记录学员的考试成绩，包括首考、补考和最终成绩三个独立表格。支持实时编辑成绩，综合成绩会根据各项成绩自动计算。绿色表示合格(≥60分)，橙色表示不合格(>0分)，灰色表示未录入(0分)。"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑成绩记录' : '添加成绩记录'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={600}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            examType: selectedExamType,
            campus: currentCampus,
            majorName: '',
            classCode: selectedClassCode,
            courseName: '',
            instructor: '',
            examDate: dayjs(),
            year: dayjs().year(),
            month: dayjs().month() + 1,
            vocabularyScore: 0,
            writtenExamScore: 0,
            computerExamScore: 0,
            dailyScore: 0,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="studentId"
                label="学号"
                rules={[{ required: true, message: '请输入学号' }]}
              >
                <Input placeholder="请输入学号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="studentName"
                label="学员姓名"
                rules={[{ required: true, message: '请输入学员姓名' }]}
              >
                <Input placeholder="请输入学员姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="examType"
                label="考试类型"
                rules={[{ required: true, message: '请选择考试类型' }]}
              >
                <Select>
                  <Option value="first">首考</Option>
                  <Option value="makeup">补考</Option>
                  <Option value="final">最终成绩</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="examDate"
                label="考试日期"
                rules={[{ required: true, message: '请选择考试日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>成绩录入</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="vocabularyScore"
                label="单词成绩"
              >
                <InputNumber placeholder="单词成绩" min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="writtenExamScore"
                label="笔试成绩"
              >
                <InputNumber placeholder="笔试成绩" min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="computerExamScore"
                label="上机成绩"
              >
                <InputNumber placeholder="上机成绩" min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dailyScore"
                label="平时成绩"
              >
                <InputNumber placeholder="平时成绩" min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 粘贴导入模态框 */}
      <Modal
        title="从剪切板导入考试成绩"
        open={pasteModalVisible}
        onOk={handlePasteImport}
        onCancel={() => {
          setPasteModalVisible(false);
          setPasteText('');
          setParsedPasteData(null);
          setPasteError('');
        }}
        width={1000}
        okText={`导入${parsedPasteData ? ` (${parsedPasteData.firstExamStudents.length + parsedPasteData.makeupExamStudents.length} 条)` : ''}`}
        okButtonProps={{
          disabled: !parsedPasteData || (parsedPasteData.firstExamStudents.length === 0 && parsedPasteData.makeupExamStudents.length === 0),
          loading: pasteLoading,
        }}
        destroyOnClose
      >
        <Alert
          message="使用说明"
          description={
            <div>
              <p>请从 Excel 复制考试成绩表数据后粘贴到下方文本框。</p>
              <p><strong>支持的格式：</strong></p>
              <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                <li>元数据区域（神殿、专业、班级、课程、教员、考试日期等）</li>
                <li>首考成绩表：学号、学员姓名、单词成绩、笔试成绩、上机成绩、平时成绩、综合成绩</li>
                <li>补考成绩表：同上格式</li>
                <li>最终成绩表：同上格式</li>
              </ul>
              <p style={{ color: '#666', fontSize: 12 }}>
                提示：系统会自动识别"首考成绩表"、"补考成绩表"、"最终成绩表"的标记，并分别导入
              </p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <TextArea
          value={pasteText}
          onChange={(e) => handlePasteTextChange(e.target.value)}
          placeholder={`在此粘贴 Excel 数据...\n\n示例：\n神殿名称\t盛邦\t专业名称\t网络云运维\n班级名称\t168\t课程名称\t基础运维\n首考时间\t2024/7/27\t补考时间\t2024/7/27\n\n首考成绩表\n学号\t学员姓名\t单词成绩\t笔试成绩\t上机成绩\t平时成绩\t综合成绩\n1\t谷墨璿\t87\t85\t\t\t86`}
          rows={8}
          style={{ marginBottom: 16, fontFamily: 'monospace' }}
        />

        {pasteError && (
          <Alert
            message="解析错误"
            description={<pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>{pasteError}</pre>}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {parsedPasteData && (
          <div>
            <div style={{ marginBottom: 8 }}>
              <Space wrap>
                {parsedPasteData.metadata.campusName && <Tag color="blue">神殿: {parsedPasteData.metadata.campusName}</Tag>}
                {parsedPasteData.metadata.majorName && <Tag color="purple">专业: {parsedPasteData.metadata.majorName}</Tag>}
                {parsedPasteData.metadata.className && <Tag color="cyan">班级: {parsedPasteData.metadata.className}</Tag>}
                {parsedPasteData.metadata.courseName && <Tag color="orange">课程: {parsedPasteData.metadata.courseName}</Tag>}
                {parsedPasteData.metadata.instructorName && <Tag color="green">教员: {parsedPasteData.metadata.instructorName}</Tag>}
                <Tag color="blue">首考: {parsedPasteData.firstExamStudents.length} 人</Tag>
                <Tag color="orange">补考: {parsedPasteData.makeupExamStudents.length} 人</Tag>
                <Tag color="green">最终: {parsedPasteData.finalExamStudents.length} 人</Tag>
              </Space>
            </div>
            
            {parsedPasteData.firstExamStudents.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>首考成绩预览（前10名）</div>
                <Table
                  dataSource={parsedPasteData.firstExamStudents.slice(0, 10).map((s, i) => ({ ...s, key: i }))}
                  columns={[
                    { title: '学号', dataIndex: 'studentId', width: 80 },
                    { title: '学员姓名', dataIndex: 'studentName', width: 100 },
                    { title: '单词', dataIndex: 'vocabularyScore', width: 70 },
                    { title: '笔试', dataIndex: 'writtenScore', width: 70 },
                    { title: '上机', dataIndex: 'labScore', width: 70 },
                    { title: '平时', dataIndex: 'dailyScore', width: 70 },
                    { title: '综合', dataIndex: 'totalScore', width: 70, render: (v: number) => v || '-' },
                  ]}
                  size="small"
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                />
                {parsedPasteData.firstExamStudents.length > 10 && (
                  <div style={{ marginTop: 4, color: '#999', fontSize: 12 }}>
                    还有 {parsedPasteData.firstExamStudents.length - 10} 名学员未显示...
                  </div>
                )}
              </div>
            )}

            {parsedPasteData.makeupExamStudents.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>补考成绩预览（前10名）</div>
                <Table
                  dataSource={parsedPasteData.makeupExamStudents.slice(0, 10).map((s, i) => ({ ...s, key: i }))}
                  columns={[
                    { title: '学号', dataIndex: 'studentId', width: 80 },
                    { title: '学员姓名', dataIndex: 'studentName', width: 100 },
                    { title: '单词', dataIndex: 'vocabularyScore', width: 70 },
                    { title: '笔试', dataIndex: 'writtenScore', width: 70 },
                    { title: '上机', dataIndex: 'labScore', width: 70 },
                    { title: '平时', dataIndex: 'dailyScore', width: 70 },
                    { title: '综合', dataIndex: 'totalScore', width: 70, render: (v: number) => v || '-' },
                  ]}
                  size="small"
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                />
                {parsedPasteData.makeupExamStudents.length > 10 && (
                  <div style={{ marginTop: 4, color: '#999', fontSize: 12 }}>
                    还有 {parsedPasteData.makeupExamStudents.length - 10} 名学员未显示...
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExamScoresPage;
