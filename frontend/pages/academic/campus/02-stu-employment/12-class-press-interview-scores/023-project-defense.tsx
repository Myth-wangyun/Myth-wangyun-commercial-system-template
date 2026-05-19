import React, { useState, useEffect, useRef } from 'react';
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
  Drawer,
  AutoComplete
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
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
  ProjectOutlined,
  UsergroupAddOutlined,
  ImportOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCampusStore } from '@/stores/campusStore';
import { pressInterviewScoreService, pressInterviewHeaderConfigService } from '@/services/service';
import { useConfigOptions } from '@/hooks/useConfigOptions';
import { buildApiUrl, apiFetch } from '@/utils/apiBase';
import { fetchHomeroomTeachers } from '@/services/configMaster';
import './pressure-interview-score.css';

const { Option } = Select;
const { TextArea } = Input;

// 学员压力面试成绩数据类型
interface PressureInterviewRecord {
  id: string | number;
  studentId: string;
  studentName: string;
  projectScores: {
    [projectNumber: number]: {
      instructor1Score: number;
      instructor2Score: number;
      instructor3Score: number;
      homeroomTeacher1Score: number;
      homeroomTeacher2Score: number;
      averageScore: number;
    };
  };
  campus: string;
  majorName: string;
  classCode: string;
  courseName: string;
  instructor: string;
  year: number;
  month: number;
  createdAt?: string;
  updatedAt?: string;
}

// 项目信息类型
interface ProjectInfo {
  number: number;
  name: string;
  interviewDate: string;
  isActive: boolean;
}

// 表单数据类型
interface PressureInterviewFormData {
  studentId: string;
  studentName: string;
  projectNumber: number;
  instructor1Score: number;
  instructor2Score: number;
  instructor3Score: number;
  homeroomTeacher1Score: number;
  homeroomTeacher2Score: number;
  campus: string;
  majorName: string;
  classCode: string;
  courseName: string;
  instructor: string;
  year: number;
  month: number;
}

function PressureInterviewPage() {
  const { message } = App.useApp()
  // 可编辑的表头（教员/班主任评分标题），按“神殿+班级+项目”独立保存，互不联动
  type RoleHeaders = { instructor1: string; instructor2: string; instructor3: string; homeroom1: string; homeroom2: string };
  const DEFAULT_HEADERS: RoleHeaders = {
    instructor1: '教员1评分',
    instructor2: '教员2评分',
    instructor3: '教员3评分',
    homeroom1: '班主任1评分',
    homeroom2: '班主任2评分',
  };
  const ROLE_HEADERS_MAP_LS_KEY = 'press_interview_role_headers_map';
  const [roleHeadersMap, setRoleHeadersMap] = useState<Record<string, Record<number, RoleHeaders>>>({});
  const getScopeKey = (campus?: string, cls?: string) => `${campus || ''}__${cls || ''}`;

  // 从后端加载表头配置
  const loadHeaderConfigs = async (campus: string, className: string) => {
    if (!campus || !className) {
      return;
    }
    try {
      const configs = await pressInterviewHeaderConfigService.getList(campus, className);
      if (configs && typeof configs === 'object') {
        setRoleHeadersMap(configs as Record<string, Record<number, RoleHeaders>>);
      }
    } catch (error) {
      console.error('[表头配置] 从后端加载失败:', error);
      // 失败时从 localStorage 加载
      try {
        const raw = localStorage.getItem(ROLE_HEADERS_MAP_LS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            setRoleHeadersMap(parsed as Record<string, Record<number, RoleHeaders>>);
          }
        }
      } catch {}
    }
  };

  // 保存表头配置到后端
  const saveHeaderConfig = async (
    campus: string,
    className: string,
    projectNumber: number,
    headerConfig: RoleHeaders,
  ) => {
    if (!campus || !className) {
      return;
    }
    try {
      await pressInterviewHeaderConfigService.createOrUpdate(
        campus,
        className,
        projectNumber,
        headerConfig,
      );
    } catch (error) {
      console.error('[表头配置] 保存到后端失败:', error);
      message.warning('表头配置保存失败，仅保存在本地');
    }
  };

  const { currentCampus } = useCampusStore();
  const [instructor, setInstructor] = useState('');
  const [selectedCampus, setSelectedCampus] = useState(currentCampus || '');
  const [selectedMajor, setSelectedMajor] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [dataSource, setDataSource] = useState<PressureInterviewRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PressureInterviewRecord | null>(null);
  const [form] = Form.useForm<PressureInterviewFormData>();
  const [searchText, setSearchText] = useState('');
  const [selectedProject, setSelectedProject] = useState<number>(1);
  const [selectedClassCode, setSelectedClassCode] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string>('');
  
  // 粘贴导入相关状态
  const [pasteModalVisible, setPasteModalVisible] = useState(false);
  const [pasteText, setPasteText] = useState('');

  // 获取/更新某项目的头部
  const getProjectHeaders = (projectNumber: number): RoleHeaders => {
    const scope = getScopeKey(currentCampus, selectedClassCode);
    return roleHeadersMap[scope]?.[projectNumber] || DEFAULT_HEADERS;
  };
  const setProjectHeaderField = (projectNumber: number, field: keyof RoleHeaders, value: string) => {
    const scope = getScopeKey(currentCampus, selectedClassCode);
    const campus = selectedCampus || currentCampus || '';
    const className = selectedClassCode;
    
    setRoleHeadersMap(prev => {
      const scopeMap = { ...(prev[scope] || {}) };
      const current = scopeMap[projectNumber] || { ...DEFAULT_HEADERS };
      const updatedHeaderConfig = { ...current, [field]: value } as RoleHeaders;
      scopeMap[projectNumber] = updatedHeaderConfig;
      
      // 异步保存到后端
      if (campus && className) {
        saveHeaderConfig(campus, className, projectNumber, updatedHeaderConfig);
      }
      
      return { ...prev, [scope]: scopeMap };
    });
  };

  // 载入（整个映射）- 优先从后端加载
  useEffect(() => {
    if (selectedCampus && selectedClassCode) {
      loadHeaderConfigs(selectedCampus || currentCampus || '', selectedClassCode);
    } else {
      // 如果没有选择神殿和班级，尝试从 localStorage 加载
      try {
        const raw = localStorage.getItem(ROLE_HEADERS_MAP_LS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            setRoleHeadersMap(parsed as Record<string, Record<number, RoleHeaders>>);
          }
        }
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampus, selectedClassCode, currentCampus]);

  // 持久化到 localStorage 和后端
  useEffect(() => {
    try {
      localStorage.setItem(ROLE_HEADERS_MAP_LS_KEY, JSON.stringify(roleHeadersMap));
    } catch {}
  }, [roleHeadersMap]);
  const { campuses: campusOptions, majors: majorOptions, classes: classOptions, courses: courseOptions, teachers: teacherOptions } = useConfigOptions({
    campusName: selectedCampus || currentCampus || '',
    majorName: selectedMajor,
  });
  const [homeroomTeacherOptions, setHomeroomTeacherOptions] = useState<string[]>([]);

  // 加载班主任选项
  useEffect(() => {
    const loadHomeroomTeachers = async () => {
      if (!selectedCampus) {
        setHomeroomTeacherOptions([]);
        return;
      }
      try {
        const teachers = await fetchHomeroomTeachers({
          campus_name: selectedCampus,
          active: true,
        });
        const names = [...new Set(teachers.map((t) => t.name))];
        setHomeroomTeacherOptions(names);
      } catch (e: any) {
        console.error('获取班主任列表失败:', e);
        setHomeroomTeacherOptions([]);
      }
    };
    loadHomeroomTeachers();
  }, [selectedCampus]);

  // 当专业选项列表变化时，检查当前选择的专业是否还在列表中
  // 只有当选项列表已加载（不为空）且当前有选择时才检查
  useEffect(() => {
    if (selectedMajor && majorOptions.length > 0) {
      const majorStillExists = majorOptions.some(opt => opt.value === selectedMajor);
      if (!majorStillExists) {
        // 只有当选项确实不存在时才清空，避免在选项加载过程中误清空
        setSelectedMajor('');
      }
    }
  }, [majorOptions, selectedMajor]);

  // 当班级选项列表变化时，检查当前选择的班级是否还在列表中
  // 只有当选项列表已加载（不为空）且当前有选择时才检查
  useEffect(() => {
    if (selectedClassCode && classOptions.length > 0) {
      const classStillExists = classOptions.some(opt => opt.value === selectedClassCode);
      if (!classStillExists) {
        // 只有当选项确实不存在时才清空，避免在选项加载过程中误清空
        setSelectedClassCode('');
      }
    }
  }, [classOptions, selectedClassCode]);

  // 当班级选择变化时，自动从教员-班级关联中获取教员姓名（仅在教员姓名为空时）
  const lastAutoFilledClassRef = useRef<string>('');
  useEffect(() => {
    const fetchInstructorByClass = async () => {
      if (!selectedClassCode) {
        lastAutoFilledClassRef.current = '';
        return;
      }
      
      // 如果已经为这个班级自动填充过，且教员姓名还存在，不再自动填充
      if (lastAutoFilledClassRef.current === selectedClassCode && instructor && instructor.trim()) {
        return;
      }
      
      // 只有当教员姓名为空时才自动填充
      if (instructor && instructor.trim()) {
        return;
      }
      
      try {
        const res = await apiFetch(buildApiUrl(`/config/get-teacher-by-class?className=${encodeURIComponent(selectedClassCode)}`));
        if (res.ok) {
          const data = await res.json();
          const teacherName = data?.teacherName;
          if (teacherName && teacherName.trim()) {
            setInstructor(teacherName.trim());
            lastAutoFilledClassRef.current = selectedClassCode;
          }
        }
      } catch (error) {
        console.error('根据班级获取教员失败:', error);
        // 静默失败，不影响用户手动输入
      }
    };
    
    fetchInstructorByClass();
  }, [selectedClassCode, instructor]); // 依赖 instructor，当用户清空时，允许再次自动填充

  // 获取教员选项（用于表头）
  const getInstructorOptions = () => {
    return teacherOptions.map(opt => ({ value: opt.value, label: opt.label }));
  };

  // 获取班主任选项（用于表头）
  const getHomeroomTeacherOptions = () => {
    return homeroomTeacherOptions.map(name => ({ value: name, label: name }));
  };

  const toPayload = (record: Partial<PressureInterviewRecord>) => {
    const scope = getScopeKey(selectedCampus || currentCampus || '', selectedClassCode);
    const headerConfig = roleHeadersMap[scope] || {};
    
    return {
      campusName: selectedCampus || record.campus || '',
      majorName: record.majorName || selectedMajor,
      className: record.classCode || selectedClassCode,
      courseName: record.courseName || selectedCourse,
      instructorName: record.instructor || instructor,
      studentId: record.studentId || '',
      studentName: record.studentName || '',
      projectScores: record.projectScores || {},
      headerConfig: headerConfig,  // 从 roleHeadersMap 获取表头配置
      year: record.year || dayjs().year(),
      month: record.month || dayjs().month() + 1,
    };
  };

  // 项目配置（可编辑）
  const [projectConfig, setProjectConfig] = useState<ProjectInfo[]>([
    { number: 1, name: '项目1', interviewDate: '2024-07-01', isActive: true },
    { number: 2, name: '项目2', interviewDate: '2024-07-02', isActive: true },
    { number: 3, name: '项目3', interviewDate: '2024-07-03', isActive: true },
    { number: 4, name: '项目4', interviewDate: '2024-07-04', isActive: true },
    { number: 5, name: '项目5', interviewDate: '2024-07-05', isActive: true },
  ]);

  const updateProjectName = (num: number, name: string) => {
    setProjectConfig(prev => prev.map(p => p.number === num ? { ...p, name } : p));
  };
  const updateProjectDate = (num: number, d: dayjs.Dayjs | null) => {
    setProjectConfig(prev => prev.map(p => p.number === num ? { ...p, interviewDate: d ? d.format('YYYY-MM-DD') : '' } : p));
  };

  // 配置数据由 useConfigOptions 负责加载

  // 新增/删除项目
  const addProject = () => {
    const maxNum = projectConfig.length ? Math.max(...projectConfig.map(p => p.number)) : 0;
    const lastDate = projectConfig.length ? dayjs(projectConfig[projectConfig.length - 1].interviewDate) : dayjs();
    const newProject: ProjectInfo = {
      number: maxNum + 1,
      name: `项目${maxNum + 1}`,
      interviewDate: lastDate.add(1, 'day').format('YYYY-MM-DD'),
      isActive: true,
    };
    setProjectConfig(prev => [...prev, newProject]);
  };

  const removeProject = (num?: number) => {
    const target = num ?? selectedProject;
    const nextProjects = projectConfig.filter(p => p.number !== target);
    setProjectConfig(nextProjects);
    // 清理所有学员该项目的成绩
    setDataSource(prev => prev.map(st => {
      const { [target]: _removed, ...restScores } = st.projectScores;
      return { ...st, projectScores: restScores };
    }));
    // 清理该项目的表头配置
    const scope = getScopeKey(currentCampus, selectedClassCode);
    setRoleHeadersMap(prev => {
      const copy = { ...prev } as Record<string, Record<number, RoleHeaders>>;
      if (copy[scope]) {
        const scopeMap = { ...copy[scope] };
        delete scopeMap[target];
        copy[scope] = scopeMap;
      }
      return copy;
    });
    // 调整选中的项目
    if (selectedProject === target) {
      setSelectedProject(nextProjects[0]?.number ?? 1);
    }
  };

  // 删除项目弹窗
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | undefined>(undefined);
  const openDeleteModal = () => {
    setDeleteTarget(selectedProject);
    setDeleteModalVisible(true);
  };
  const handleConfirmDelete = () => {
    if (deleteTarget !== undefined) {
      removeProject(deleteTarget);
    }
    setDeleteModalVisible(false);
  };

  const mapFromApi = (item: any): PressureInterviewRecord => {
    const scores: PressureInterviewRecord['projectScores'] = {};
    const rawProjectScores = item.projectScores || item.project_scores || {};
    
    Object.entries(rawProjectScores).forEach(([k, v]) => {
      const keyNum = Number(k);
      if (isNaN(keyNum)) {
        return;
      }
      
      const scoreData = v as any;
      scores[keyNum] = {
        instructor1Score: Number(scoreData.instructor1Score ?? scoreData.instructor1_score ?? 0),
        instructor2Score: Number(scoreData.instructor2Score ?? scoreData.instructor2_score ?? 0),
        instructor3Score: Number(scoreData.instructor3Score ?? scoreData.instructor3_score ?? 0),
        homeroomTeacher1Score: Number(scoreData.homeroomTeacher1Score ?? scoreData.homeroom_teacher1_score ?? 0),
        homeroomTeacher2Score: Number(scoreData.homeroomTeacher2Score ?? scoreData.homeroom_teacher2_score ?? 0),
        averageScore: Number(scoreData.averageScore ?? scoreData.average_score ?? 0),
      };
    });
    
    // 注意：service.ts 中的 mapPressScoreFromApi 返回的是 className（驼峰），不是 class_name
    // 所以这里需要同时检查 className 和 class_name
    const result = {
      id: item.id,
      studentId: item.studentId || item.student_id,
      studentName: item.studentName || item.student_name,
      projectScores: scores,
      campus: item.campus || item.campusName || item.campus_name,
      majorName: item.majorName || item.major_name,
      classCode: item.classCode || item.className || item.class_name || '',
      courseName: item.courseName || item.course_name,
      instructor: item.instructor || item.instructorName || item.instructor_name,
      year: item.year,
      month: item.month,
      createdAt: item.createdAt || item.created_at,
      updatedAt: item.updatedAt || item.updated_at,
    };
    
    // 调试：记录第一条数据的映射结果
    if (!(window as any).__firstMappingLogged) {
      (window as any).__firstMappingLogged = true;
      console.log('🔍 mapFromApi - 第一条数据映射详情:', {
        '原始 item': item,
        'item.classCode': item.classCode,
        'item.className': item.className,
        'item.class_name': item.class_name,
        'result.classCode': result.classCode,
        'item.majorName': item.majorName,
        'item.major_name': item.major_name,
        'result.majorName': result.majorName,
        'item.courseName': item.courseName,
        'item.course_name': item.course_name,
        'result.courseName': result.courseName,
        'item.instructor': item.instructor,
        'item.instructorName': item.instructorName,
        'item.instructor_name': item.instructor_name,
        'result.instructor': result.instructor,
      });
    }
    
    return result;
  };

  // 检查是否满足加载数据的必要条件（神殿和班级都必须选择）
  const canLoadData = Boolean((selectedCampus || currentCampus) && selectedClassCode);

  const loadData = async () => {
    // 只有当神殿和班级都选择后才加载数据
    if (!canLoadData) {
      setDataSource([]);
      return;
    }
    
    setLoading(true);
    try {
      const res = await pressInterviewScoreService.getList(
        { 
          search: searchText,
          major_name: selectedMajor,
          course_name: selectedCourse,
          instructor_name: instructor,
        },
        selectedCampus || currentCampus || undefined,
        String(selectedClassCode || ''),
      );
      console.log('🔍 loadData - API 返回的原始数据:', res);
      console.log('🔍 loadData - res.list:', res.list);
      const list = res.list?.map((item: any) => {
      const mapped = mapFromApi(item);
      // 只记录第一条数据的详细信息
      if (res.list && res.list.indexOf(item) === 0) {
        console.log('🔍 loadData - 第一条数据映射前:', JSON.stringify(item, null, 2));
        console.log('🔍 loadData - 第一条数据映射后:', JSON.stringify(mapped, null, 2));
        console.log('🔍 loadData - 映射后的 classCode:', mapped.classCode, '类型:', typeof mapped.classCode);
        console.log('🔍 loadData - 映射后的 majorName:', mapped.majorName);
        console.log('🔍 loadData - 映射后的 courseName:', mapped.courseName);
        console.log('🔍 loadData - 映射后的 instructor:', mapped.instructor);
      }
      return mapped;
      }) || [];
      console.log('🔍 loadData - 最终列表:', list);
      console.log('🔍 loadData - 列表长度:', list.length);
      setDataSource(list);
      
      // 从第一条记录读取 header_config（如果存在）
      if (res.list && res.list.length > 0) {
        const firstItem = res.list[0] as any;
        const headerConfig = firstItem.header_config || firstItem.headerConfig;
        if (headerConfig && typeof headerConfig === 'object') {
          const scope = getScopeKey(selectedCampus || currentCampus || '', selectedClassCode);
          setRoleHeadersMap(prev => ({
            ...prev,
            [scope]: headerConfig as Record<number, RoleHeaders>,
          }));
        }
      } else {
        // 如果没有记录，尝试从后端获取表头配置
        if (selectedCampus && selectedClassCode) {
          try {
            await loadHeaderConfigs(selectedCampus || currentCampus || '', selectedClassCode);
          } catch (error) {
            console.error('[表头配置] 从后端加载失败:', error);
          }
        }
      }
    } catch (error) {
      console.error('❌ 加载数据失败', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampus, selectedClassCode, selectedMajor, selectedCourse, instructor, searchText, canLoadData]);

  const handleRoleHeaderChange = (projectNumber: number, key: keyof RoleHeaders, value: string) => {
    setProjectHeaderField(projectNumber, key, value);
  };

  // 统计数据
  const statistics = {
    totalStudents: dataSource.length,
    totalProjects: projectConfig.length,
    totalInterviews: dataSource.length * projectConfig.length,
    actualInterviews: dataSource.reduce((total, student) => {
      return total + Object.keys(student.projectScores).length;
    }, 0),
    qualifiedCount: dataSource.reduce((total, student) => {
      return total + Object.values(student.projectScores).filter(score => score.averageScore >= 6).length;
    }, 0),
    participationRate: 0,
    qualificationRate: 0
  };

  // 计算参与率和合格率
  statistics.participationRate = statistics.totalInterviews > 0 
    ? Math.round((statistics.actualInterviews / statistics.totalInterviews) * 10000) / 100 
    : 0;
  statistics.qualificationRate = statistics.actualInterviews > 0 
    ? Math.round((statistics.qualifiedCount / statistics.actualInterviews) * 10000) / 100 
    : 0;

  // 生成表格列
  const generateColumns = (): ColumnsType<PressureInterviewRecord> => {
    const columns: ColumnsType<PressureInterviewRecord> = [
      {
        title: '学号',
        dataIndex: 'studentId',
        key: 'studentId',
        width: 80,
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
        render: (studentName: string, record: PressureInterviewRecord) => (
          <Button
            type="link"
            onClick={() => handleEditStudent(record)}
            style={{ padding: 0, height: 'auto' }}
          >
            {studentName}
          </Button>
        ),
      },
    ];

    // 为每个项目添加评分列（表头名称/时间可编辑）
    projectConfig.forEach(project => {
      columns.push({
        title: (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>项目{project.number}</div>
            <Input
              size="small"
              value={project.name}
              onChange={(e) => updateProjectName(project.number, e.target.value)}
              placeholder="项目名称"
              style={{ width: 120, marginTop: 4 }}
            />
            <DatePicker
              size="small"
              value={project.interviewDate ? dayjs(project.interviewDate) : null}
              onChange={(d) => updateProjectDate(project.number, d)}
              format="YYYY/MM/DD"
              allowClear
              style={{ width: 120, marginTop: 6 }}
            />
          </div>
        ),
        key: `project_${project.number}`,
        width: 340,
        children: [
          {
            title: (
              <AutoComplete
                size="small"
                bordered={false}
                value={getProjectHeaders(project.number).instructor1}
                options={getInstructorOptions()}
                onChange={(value) => handleRoleHeaderChange(project.number, 'instructor1', value)}
                placeholder="教员1"
                filterOption={(inputValue, option) =>
                  (option?.label?.toString() ?? '').toLowerCase().includes(inputValue.toLowerCase())
                }
                style={{ width: 90, textAlign: 'center' }}
              />
            ),
            dataIndex: `instructor1_${project.number}`,
            key: `instructor1_${project.number}`,
            width: 90,
            render: (_, record: PressureInterviewRecord) => (
              <InputNumber
                size="small"
                min={0}
                max={10}
                className={
                  typeof record.projectScores[project.number]?.instructor1Score === 'number' &&
                  record.projectScores[project.number]?.instructor1Score < 6
                    ? 'pressure-score-fail'
                    : undefined
                }
                value={record.projectScores[project.number]?.instructor1Score}
                onChange={(value) => handleScoreChange(String(record.id), project.number, 'instructor1Score', value || 0)}
                style={{ width: '100%' }}
              />
            ),
          },
          {
            title: (
              <AutoComplete
                size="small"
                bordered={false}
                value={getProjectHeaders(project.number).instructor2}
                options={getInstructorOptions()}
                onChange={(value) => handleRoleHeaderChange(project.number, 'instructor2', value)}
                placeholder="教员2"
                filterOption={(inputValue, option) =>
                  (option?.label?.toString() ?? '').toLowerCase().includes(inputValue.toLowerCase())
                }
                style={{ width: 90, textAlign: 'center' }}
              />
            ),
            dataIndex: `instructor2_${project.number}`,
            key: `instructor2_${project.number}`,
            width: 90,
            render: (_, record: PressureInterviewRecord) => (
              <InputNumber
                size="small"
                min={0}
                max={10}
                className={
                  typeof record.projectScores[project.number]?.instructor2Score === 'number' &&
                  record.projectScores[project.number]?.instructor2Score < 6
                    ? 'pressure-score-fail'
                    : undefined
                }
                value={record.projectScores[project.number]?.instructor2Score}
                onChange={(value) => handleScoreChange(String(record.id), project.number, 'instructor2Score', value || 0)}
                style={{ width: '100%' }}
              />
            ),
          },
          {
            title: (
              <AutoComplete
                size="small"
                bordered={false}
                value={getProjectHeaders(project.number).instructor3}
                options={getInstructorOptions()}
                onChange={(value) => handleRoleHeaderChange(project.number, 'instructor3', value)}
                placeholder="教员3"
                filterOption={(inputValue, option) =>
                  (option?.label?.toString() ?? '').toLowerCase().includes(inputValue.toLowerCase())
                }
                style={{ width: 90, textAlign: 'center' }}
              />
            ),
            dataIndex: `instructor3_${project.number}`,
            key: `instructor3_${project.number}`,
            width: 90,
            render: (_, record: PressureInterviewRecord) => (
              <InputNumber
                size="small"
                min={0}
                max={10}
                className={
                  typeof record.projectScores[project.number]?.instructor3Score === 'number' &&
                  record.projectScores[project.number]?.instructor3Score < 6
                    ? 'pressure-score-fail'
                    : undefined
                }
                value={record.projectScores[project.number]?.instructor3Score}
                onChange={(value) => handleScoreChange(String(record.id), project.number, 'instructor3Score', value || 0)}
                style={{ width: '100%' }}
              />
            ),
          },
          {
            title: (
              <AutoComplete
                size="small"
                bordered={false}
                value={getProjectHeaders(project.number).homeroom1}
                options={getHomeroomTeacherOptions()}
                onChange={(value) => handleRoleHeaderChange(project.number, 'homeroom1', value)}
                placeholder="班主任1"
                filterOption={(inputValue, option) =>
                  (option?.label?.toString() ?? '').toLowerCase().includes(inputValue.toLowerCase())
                }
                style={{ width: 100, textAlign: 'center' }}
              />
            ),
            dataIndex: `homeroom1_${project.number}`,
            key: `homeroom1_${project.number}`,
            width: 100,
            render: (_, record: PressureInterviewRecord) => (
              <InputNumber
                size="small"
                min={0}
                max={10}
                className={
                  typeof record.projectScores[project.number]?.homeroomTeacher1Score === 'number' &&
                  record.projectScores[project.number]?.homeroomTeacher1Score < 6
                    ? 'pressure-score-fail'
                    : undefined
                }
                value={record.projectScores[project.number]?.homeroomTeacher1Score}
                onChange={(value) => handleScoreChange(String(record.id), project.number, 'homeroomTeacher1Score', value || 0)}
                style={{ width: '100%' }}
              />
            ),
          },
          {
            title: (
              <AutoComplete
                size="small"
                bordered={false}
                value={getProjectHeaders(project.number).homeroom2}
                options={getHomeroomTeacherOptions()}
                onChange={(value) => handleRoleHeaderChange(project.number, 'homeroom2', value)}
                placeholder="班主任2"
                filterOption={(inputValue, option) =>
                  (option?.label?.toString() ?? '').toLowerCase().includes(inputValue.toLowerCase())
                }
                style={{ width: 100, textAlign: 'center' }}
              />
            ),
            dataIndex: `homeroom2_${project.number}`,
            key: `homeroom2_${project.number}`,
            width: 100,
            render: (_, record: PressureInterviewRecord) => (
              <InputNumber
                size="small"
                min={0}
                max={10}
                className={
                  typeof record.projectScores[project.number]?.homeroomTeacher2Score === 'number' &&
                  record.projectScores[project.number]?.homeroomTeacher2Score < 6
                    ? 'pressure-score-fail'
                    : undefined
                }
                value={record.projectScores[project.number]?.homeroomTeacher2Score}
                onChange={(value) => handleScoreChange(String(record.id), project.number, 'homeroomTeacher2Score', value || 0)}
                style={{ width: '100%' }}
              />
            ),
          },
          {
            title: '平均得分',
            dataIndex: `average_${project.number}`,
            key: `average_${project.number}`,
            width: 50,
            render: (_, record: PressureInterviewRecord) => (
              <Tag color={record.projectScores[project.number]?.averageScore >= 6 ? 'green' : 'red'}>
                {Number(record.projectScores[project.number]?.averageScore ?? 0).toFixed(1)}
              </Tag>
            ),
          },
        ],
      });
    });

    columns.push({
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record: PressureInterviewRecord) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)} okText="删除" cancelText="取消">
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    });

    return columns;
  };

  // 处理评分变化
  const handleScoreChange = (studentId: string, projectNumber: number, field: string, value: number) => {
    setDataSource(prev => prev.map(student => {
      if (String(student.id) === String(studentId)) {
        // 创建新的 projectScores 对象，确保 React 能检测到变化
        const currentProjectScores = student.projectScores[projectNumber] || {
          instructor1Score: 0,
          instructor2Score: 0,
          instructor3Score: 0,
          homeroomTeacher1Score: 0,
          homeroomTeacher2Score: 0,
          averageScore: 0
        };
        
        // 更新指定字段
        const updatedProjectScore = {
          ...currentProjectScores,
          [field]: value
        };
        
        // 计算平均分
        const averageScore =
          Math.round(
            ((updatedProjectScore.instructor1Score +
              updatedProjectScore.instructor2Score +
              updatedProjectScore.instructor3Score +
              updatedProjectScore.homeroomTeacher1Score +
              updatedProjectScore.homeroomTeacher2Score) /
              5) *
              10,
          ) / 10;
        
        updatedProjectScore.averageScore = averageScore;
        
        // 创建新的 projectScores 对象
        const newProjectScores = {
          ...student.projectScores,
          [projectNumber]: updatedProjectScore
        };
        
        // 返回新的学生对象
        return {
          ...student,
          projectScores: newProjectScores,
          updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
        };
      }
      return student;
    }));
  };

  // 处理编辑学员
  const handleEditStudent = (record: PressureInterviewRecord) => {
    setEditingStudentId(String(record.id));
    setDrawerVisible(true);
  };

  // 处理添加学员
  const handleAddStudent = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      campus: currentCampus,
      majorName: '数字媒体',
      classCode: selectedClassCode,
      courseName: selectedCourse,
      instructor: instructor,
      year: 2024,
      month: 7,
    });
    setModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (record: PressureInterviewRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
    });
    setModalVisible(true);
  };

  // 处理删除
  const handleDelete = async (id: string | number) => {
    try {
      await pressInterviewScoreService.delete(id);
      setDataSource(prev => prev.filter(item => item.id !== id));
      message.success('删除成功');
      loadData();
    } catch (error) {
      console.error('删除失败', error);
      message.error('删除失败');
    }
  };

  // 处理保存
  const handleSave = async () => {
    try {
      if (!instructor) {
        message.error('请选择教员姓名后保存');
        return;
      }
      const values = await form.validateFields();
      const formData = {
        ...values,
      };

      if (editingRecord) {
        const target = dataSource.find((item) => item.id === editingRecord.id);
        const payload = {
          id: editingRecord.id,
          ...toPayload({ ...formData, projectScores: target?.projectScores }),
        };
        const updated = await pressInterviewScoreService.update(payload as any);
        setDataSource(prev =>
          prev.map(item =>
            item.id === editingRecord.id
              ? { ...item, ...mapFromApi({
                ...updated,
                campus: updated.campusName,
                majorName: updated.majorName,
                classCode: updated.className,
                courseName: updated.courseName,
                instructor: updated.instructorName,
                projectScores: updated.projectScores,
              }), updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') }
              : item,
          ),
        );
        message.success('更新成功并已保存到后端');
      } else {
        const created = await pressInterviewScoreService.create({
          ...toPayload({ ...formData, projectScores: {} }),
        } as any);
        const newRecord: PressureInterviewRecord = {
          ...mapFromApi({
            ...created,
            campus: created.campusName,
            majorName: created.majorName,
            classCode: created.className,
            courseName: created.courseName,
            instructor: created.instructorName,
            projectScores: created.projectScores,
          }),
          projectScores: {},
          createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        };
        setDataSource(prev => [...prev, newRecord]);
        message.success('添加成功并已保存到后端');
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

  // 处理项目变化
  const handleProjectChange = (projectNumber: number) => {
    setSelectedProject(projectNumber);
  };

  // 处理班级变化
  const handleClassChange = (classCode: string) => {
    setSelectedClassCode(classCode);
  };

  // 从班档案表生成学员数据（排除退费明细表中的学员）
  const handleGenerateStudentsFromArchive = async () => {
    if (!selectedCampus && !currentCampus) {
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
      const campusName = campus.replace(/神殿$/, '');
      
      // 尝试从班档案表获取学员列表
      const tryFetchClassFile = async (campusArg: string) => {
        const res = await apiFetch(buildApiUrl(`/teaching-quality/class-file?campus=${encodeURIComponent(campusArg)}&class=${encodeURIComponent(selectedClassCode)}`));
        if (!res.ok) return null;
        const data = await res.json();
        return data;
      };

      let archiveData = await tryFetchClassFile(campusName);
      if (!archiveData || !archiveData.行列表 || archiveData.行列表.length === 0) {
        archiveData = await tryFetchClassFile(`${campusName}神殿`);
      }
      if (!archiveData || !archiveData.行列表 || archiveData.行列表.length === 0) {
        archiveData = await tryFetchClassFile(campus);
      }

      if (!archiveData || !archiveData.行列表 || archiveData.行列表.length === 0) {
        message.warning('未找到该班级的档案数据，请确认神殿和班级是否正确');
        return;
      }

      // 获取退费明细表中的学员名单（近4年）
      const refundedNames = new Set<string>();
      const refundedIds = new Set<string>();
      
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

      let refundResult = await tryFetchRefund(campusName);
      if (refundResult.names.size === 0) {
        refundResult = await tryFetchRefund(`${campusName}神殿`);
      }
      if (refundResult.names.size === 0) {
        refundResult = await tryFetchRefund(campus);
      }
      
      refundResult.names.forEach(n => refundedNames.add(n));
      refundResult.ids.forEach(id => refundedIds.add(id));

      // 获取已存在的学员
      const existingIds = new Set(dataSource.map(s => s.studentId));
      const existingNames = new Set(dataSource.map(s => s.studentName));
      
      const newStudents: PressureInterviewRecord[] = [];
      let refundedCount = 0;
      
      archiveData.行列表.forEach((row: any, idx: number) => {
        const name = (row.name || row.姓名 || '').trim();
        const idCard = (row.idCard || row.身份证号 || '').trim();
        const studentId = idCard || `${selectedClassCode}-${String(row.serialNumber || idx + 1).padStart(2, '0')}`;
        
        // 跳过已存在的学员
        if (!name || existingNames.has(name) || existingIds.has(studentId)) {
          return;
        }
        
        // 跳过退费学员
        if (refundedNames.has(name) || (idCard && refundedIds.has(idCard))) {
          refundedCount++;
          return;
        }

        // 创建新学员记录
        newStudents.push({
          id: `new-${Date.now()}-${idx}`,
          studentId,
          studentName: name,
          projectScores: {},
          campus: campus,
          majorName: selectedMajor,
          classCode: selectedClassCode,
          courseName: selectedCourse,
          instructor: instructor,
          year: dayjs().year(),
          month: dayjs().month() + 1,
          createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
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

      // 先更新前端状态
      setDataSource(prev => [...prev, ...newStudents]);
      
      // 自动保存到后端
      let savedCount = 0;
      let failedCount = 0;
      for (const student of newStudents) {
        try {
          const payload = toPayload(student);
          await pressInterviewScoreService.create(payload);
          savedCount++;
        } catch (error) {
          console.error(`保存学员 ${student.studentName} 失败:`, error);
          failedCount++;
        }
      }
      
      const refundMsg = refundedCount > 0 ? `，已排除退费学员${refundedCount}人` : '';
      if (failedCount > 0) {
        message.warning(`已从班档案表导入 ${newStudents.length} 名学员${refundMsg}（保存成功 ${savedCount} 人，失败 ${failedCount} 人）`);
      } else {
        message.success(`已从班档案表导入 ${newStudents.length} 名学员并保存到后端${refundMsg}`);
      }
      
      // 重新加载数据以获取后端返回的完整记录
      await loadData();
    } catch (error) {
      console.error('从班档案表生成学员失败:', error);
      message.error('从班档案表获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理粘贴导入 - 智能解析表头和数据，并自动保存到后端
  const handleParseAndImport = async () => {
    if (!pasteText.trim()) {
      message.warning('请先粘贴数据');
      return;
    }

    const lines = pasteText.trim().split(/\r?\n/);
    
    // 解析结果
    let updatedCount = 0;
    let createdCount = 0;
    const newDataSource = [...dataSource];
    const existingNames = new Map(newDataSource.map((s, index) => [s.studentName, index]));
    
    // 表头信息（包含顶部筛选信息）
    interface ParsedHeader {
      // 顶部筛选信息
      campusName: string;        // 神殿名称
      majorName: string;         // 专业名称
      className: string;         // 班级名称
      courseName: string;        // 课程名称
      instructorName: string;    // 教员姓名
      // 项目信息
      projectNumbers: number[];  // 项目编号
      projectNames: string[];    // 项目名称
      projectDates: string[][];  // 答辩日期（每个项目可能有多个日期）
      scoreHeaders: Record<number, string[]>;  // 每个项目的评分人名称 [教员1,教员2,教员3,班主任1,班主任2]
      scoreStartCol: number;     // 分数开始的列索引
      hasStudentIdCol: boolean;  // 是否有学号列
      hasSerialCol: boolean;     // 是否有序号列
    }
    
    const header: ParsedHeader = {
      campusName: '',
      majorName: '',
      className: '',
      courseName: '',
      instructorName: '',
      projectNumbers: [],
      projectNames: [],
      projectDates: [],  // 二维数组：[[项目1日期1, 项目1日期2], [项目2日期1], ...]
      scoreHeaders: {},
      scoreStartCol: 2,
      hasStudentIdCol: false,
      hasSerialCol: false,
    };
    
    // ========== 第一阶段：解析表头行 ==========
    let dataStartLine = 0;
    
    // 打印前20行的内容用于调试（只显示非空列）
    console.log('%c[导入] ========== 原始数据前20行 ==========', 'color: blue; font-weight: bold');
    for (let i = 0; i < Math.min(lines.length, 20); i++) {
      const cols = lines[i].split('\t').map(c => c.trim());
      const nonEmptyCols = cols.map((c, idx) => c ? `[${idx}]${c}` : null).filter(Boolean);
      if (nonEmptyCols.length > 0) {
        console.log(`%c[导入] 行${i}: ${nonEmptyCols.join(' | ')}`, 'color: gray');
      }
    }
    console.log('%c[导入] ========================================', 'color: blue; font-weight: bold');
    
    // 首先找到项目数量（通过评分人行的"平均"列来确定）
    let projectCount = 0;
    let scoreHeaderLineIdx = -1;
    
    for (let lineIdx = 0; lineIdx < Math.min(lines.length, 25); lineIdx++) {
      const cols = lines[lineIdx].split('\t').map(c => c.trim());
      const avgCount = cols.filter(c => c.includes('平均')).length;
      if (avgCount > 0) {
        projectCount = avgCount;
        scoreHeaderLineIdx = lineIdx;
        console.log(`%c[导入] 找到评分人行(行${lineIdx}), 检测到 ${projectCount} 个项目（通过"平均"列计数）`, 'color: green; font-weight: bold');
        break;
      }
    }
    
    // 如果没找到，尝试通过"项目"关键字
    if (projectCount === 0) {
      for (let lineIdx = 0; lineIdx < Math.min(lines.length, 25); lineIdx++) {
        const cols = lines[lineIdx].split('\t').map(c => c.trim());
        const projMatches = cols.filter(c => /项目\d+/.test(c));
        if (projMatches.length > projectCount) {
          projectCount = projMatches.length;
          console.log(`%c[导入] 通过"项目N"关键字检测到 ${projectCount} 个项目`, 'color: green');
        }
      }
    }
    
    // 初始化项目日期数组（每个项目可能有多个日期）
    for (let i = 0; i < projectCount; i++) {
      header.projectDates[i] = [];
      header.projectNumbers.push(i + 1);
    }
    
    console.log(`%c[导入] 初始化 ${projectCount} 个项目`, 'color: green; font-weight: bold');
    
    // 扩大解析范围到前30行
    for (let lineIdx = 0; lineIdx < Math.min(lines.length, 30); lineIdx++) {
      const cols = lines[lineIdx].split('\t').map(c => c.trim());
      const lineText = lines[lineIdx];
      const lineTextLower = lineText.toLowerCase();
      
      // ========== 解析顶部筛选信息 ==========
      if (lineText.includes('神殿名称') || lineText.includes('专业名称') || lineText.includes('班级名称') || 
          lineText.includes('课程名称') || lineText.includes('教员姓名')) {
        console.log(`%c[导入] 行${lineIdx}: 解析筛选信息行`, 'color: purple');
        for (let i = 0; i < cols.length - 1; i++) {
          const key = cols[i];
          const value = cols[i + 1];
          if (!key || !value) continue;
          
          if (key.includes('神殿名称') || key.includes('神殿')) {
            header.campusName = value.replace(/神殿$/, '') + '神殿';
            console.log(`  → 神殿: ${header.campusName}`);
          } else if (key.includes('专业名称') || key.includes('专业')) {
            header.majorName = value;
            console.log(`  → 专业: ${header.majorName}`);
          } else if (key.includes('班级名称') || key.includes('班级')) {
            header.className = value;
            console.log(`  → 班级: ${header.className}`);
          } else if (key.includes('课程名称') || key.includes('课程')) {
            header.courseName = value;
            console.log(`  → 课程: ${header.courseName}`);
          } else if (key.includes('教员姓名') || key.includes('教员')) {
            header.instructorName = value;
            console.log(`  → 教员: ${header.instructorName}`);
          }
        }
        dataStartLine = Math.max(dataStartLine, lineIdx + 1);
        continue;
      }
      
      // ========== 跳过统计信息行 ==========
      if (lineText.includes('强化人数') || lineText.includes('答辩次数') || lineText.includes('应答辩数量') ||
          lineText.includes('面试参与率') || lineText.includes('答辩合格率')) {
        dataStartLine = Math.max(dataStartLine, lineIdx + 1);
        continue;
      }
      
      // ========== 解析项目名称行 ==========
      if (lineText.includes('项目名称') || cols.some(c => c.includes('简历项目'))) {
        console.log(`%c[导入] 行${lineIdx}: 解析项目名称行`, 'color: purple');
        let projIdx = 0;
        for (let i = 0; i < cols.length; i++) {
          const col = cols[i];
          if (!col || col.length <= 1) continue;
          if (col.includes('项目名称') || col.includes('学号') || col.includes('姓名') || col.includes('评分') || col.includes('平均')) continue;
          
          if (col.includes('项目') || col.includes('简历')) {
            header.projectNames[projIdx] = col;
            console.log(`  → 项目${projIdx + 1}名称: ${col}`);
            projIdx++;
          }
        }
        dataStartLine = Math.max(dataStartLine, lineIdx + 1);
        continue;
      }
      
      // ========== 解析答辩日期行（关键改进：每个项目可能有多个日期）==========
      // 日期行格式：答辩日期 | | 2025/7/9 | | 2025/7/16\n2024/7/2\n2024/7/3 | | ...
      if (lineText.includes('答辩日期') || (cols.filter(c => /\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(c)).length >= 2)) {
        console.log(`%c[导入] 行${lineIdx}: 解析答辩日期行`, 'color: purple');
        
        // 找到包含日期的列，按项目分组
        // 假设每个项目占6列（5个评分 + 1个平均），日期在每个项目的第一个位置
        let projIdx = 0;
        for (let i = 0; i < cols.length; i++) {
          const col = cols[i];
          if (!col) continue;
          
          // 提取该单元格中的所有日期（可能有多个，用换行分隔）
          const allDates = col.match(/\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/g);
          if (allDates && allDates.length > 0) {
            if (!header.projectDates[projIdx]) {
              header.projectDates[projIdx] = [];
            }
            
            allDates.forEach(dateStr => {
              const match = dateStr.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
              if (match) {
                const formatted = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
                if (!header.projectDates[projIdx].includes(formatted)) {
                  header.projectDates[projIdx].push(formatted);
                }
              }
            });
            
            console.log(`  → 项目${projIdx + 1}日期(列${i}): [${header.projectDates[projIdx].join(', ')}]`);
            projIdx++;
          }
        }
        dataStartLine = Math.max(dataStartLine, lineIdx + 1);
        continue;
      }
      
      // ========== 解析评分人名称行 ==========
      const scoreCount = cols.filter(c => c.includes('评分')).length;
      if (scoreCount >= 3) {
        console.log(`%c[导入] 行${lineIdx}: 解析评分人名称行 (找到${scoreCount}个"评分"列)`, 'color: purple');
        
        // 找到评分列开始的位置
        let scoreColStart = 0;
        for (let i = 0; i < cols.length; i++) {
          if (cols[i].includes('评分')) {
            scoreColStart = i;
            break;
          }
        }
        
        // 解析评分人名称
        let currentProject = 1;
        let scoreIdx = 0;
        
        for (let i = scoreColStart; i < cols.length; i++) {
          const col = cols[i];
          if (!col) continue;
          
          if (col.includes('平均')) {
            if (scoreIdx > 0) {
              console.log(`  → 项目${currentProject}评分人: [${header.scoreHeaders[currentProject]?.join(', ') || ''}]`);
              currentProject++;
              scoreIdx = 0;
            }
            continue;
          }
          
          if (col.includes('评分')) {
            if (!header.scoreHeaders[currentProject]) {
              header.scoreHeaders[currentProject] = [];
            }
            header.scoreHeaders[currentProject].push(col);
            scoreIdx++;
          }
        }
        
        // 处理最后一个项目（如果没有"平均"列结尾）
        if (scoreIdx > 0 && header.scoreHeaders[currentProject]) {
          console.log(`  → 项目${currentProject}评分人: [${header.scoreHeaders[currentProject].join(', ')}]`);
        }
        
        dataStartLine = Math.max(dataStartLine, lineIdx + 1);
        continue;
      }
      
      // ========== 检测学号/姓名行（数据开始的标志）==========
      if ((lineTextLower.includes('学号') && lineTextLower.includes('姓名')) || 
          (lineTextLower.includes('学员') && lineTextLower.includes('姓名'))) {
        console.log(`%c[导入] 行${lineIdx}: 检测到表头行（学号/姓名）`, 'color: purple');
        header.hasStudentIdCol = cols.some(c => c.includes('学号'));
        header.hasSerialCol = cols.some(c => c.includes('序号'));
        dataStartLine = Math.max(dataStartLine, lineIdx + 1);
        continue;
      }
    }
    
    // ========== 打印解析结果摘要 ==========
    console.log('%c[导入] ========== 解析结果摘要 ==========', 'color: blue; font-weight: bold');
    console.log(`  神殿: ${header.campusName || '未解析'}`);
    console.log(`  专业: ${header.majorName || '未解析'}`);
    console.log(`  班级: ${header.className || '未解析'}`);
    console.log(`  课程: ${header.courseName || '未解析'}`);
    console.log(`  教员: ${header.instructorName || '未解析'}`);
    console.log(`  项目数量: ${projectCount}`);
    console.log(`  项目编号: [${header.projectNumbers.join(', ')}]`);
    console.log(`  项目名称: [${header.projectNames.join(', ')}]`);
    header.projectDates.forEach((dates, idx) => {
      console.log(`  项目${idx + 1}日期: [${Array.isArray(dates) ? dates.join(', ') : dates}]`);
    });
    Object.entries(header.scoreHeaders).forEach(([projNum, names]) => {
      console.log(`  项目${projNum}评分人: [${names.join(', ')}]`);
    });
    console.log(`  数据起始行: ${dataStartLine}`);
    console.log('%c[导入] ========================================', 'color: blue; font-weight: bold');
    
    // 更新顶部筛选信息（神殿、专业、班级、课程、教员）
    const filterUpdates: string[] = [];
    if (header.campusName) {
      // 查找匹配的神殿选项
      const matchedCampus = campusOptions.find(opt => 
        opt.value.includes(header.campusName.replace(/神殿$/, '')) || 
        header.campusName.includes(opt.value.replace(/神殿$/, ''))
      );
      if (matchedCampus) {
        setSelectedCampus(matchedCampus.value);
        filterUpdates.push(`神殿: ${matchedCampus.value}`);
      } else {
        setSelectedCampus(header.campusName);
        filterUpdates.push(`神殿: ${header.campusName}`);
      }
    }
    if (header.majorName) {
      setSelectedMajor(header.majorName);
      filterUpdates.push(`专业: ${header.majorName}`);
    }
    if (header.className) {
      setSelectedClassCode(header.className);
      filterUpdates.push(`班级: ${header.className}`);
    }
    if (header.courseName) {
      setSelectedCourse(header.courseName);
      filterUpdates.push(`课程: ${header.courseName}`);
    }
    if (header.instructorName) {
      setInstructor(header.instructorName);
      filterUpdates.push(`教员: ${header.instructorName}`);
    }
    
    // 如果没有解析到项目数，根据数据行的列数推断项目数量
    if (header.projectNumbers.length === 0) {
      // 尝试从数据行推断项目数量
      for (let lineIdx = dataStartLine; lineIdx < Math.min(lines.length, dataStartLine + 5); lineIdx++) {
        const cols = lines[lineIdx].split('\t').map(c => c.trim());
        if (cols.length < 3) continue;
        
        // 跳过表头行
        if (cols.some(c => c.includes('项目') || c.includes('评分') || c.includes('姓名'))) continue;
        
        // 计算分数列数量（每个项目6列）
        const scoreStartIdx = 2; // 假设前两列是序号/学号和姓名
        const scoreCols = cols.length - scoreStartIdx;
        const inferredProjectCount = Math.ceil(scoreCols / 6);
        
        if (inferredProjectCount > 0) {
          header.projectNumbers = Array.from({ length: inferredProjectCount }, (_, i) => i + 1);
          console.log(`[导入] 从数据行推断项目数量: ${inferredProjectCount}`);
          break;
        }
      }
      
      // 如果仍然没有，默认5个项目
      if (header.projectNumbers.length === 0) {
        header.projectNumbers = [1, 2, 3, 4, 5];
      }
    }
    
    const totalProjects = header.projectNumbers.length;
    console.log(`[导入] 检测到 ${totalProjects} 个项目`);
    
    // 更新项目配置（项目名称和日期）- 支持任意数量的项目
    // 注意：projectDates 现在是二维数组，每个项目可能有多个日期，取第一个作为主日期
    setProjectConfig(prev => {
      const newConfig: ProjectInfo[] = [];
      
      // 为每个检测到的项目创建或更新配置
      header.projectNumbers.forEach((projNum, idx) => {
        const existingProject = prev.find(p => p.number === projNum);
        // 获取该项目的日期（取第一个，或者使用现有的，或者默认今天）
        const projectDateArr = header.projectDates[idx];
        const projectDate = Array.isArray(projectDateArr) && projectDateArr.length > 0 
          ? projectDateArr[0]  // 取第一个日期
          : (typeof projectDateArr === 'string' ? projectDateArr : null);
        
        newConfig.push({
          number: projNum,
          name: header.projectNames[idx] || existingProject?.name || `项目${projNum}`,
          interviewDate: projectDate || existingProject?.interviewDate || dayjs().format('YYYY-MM-DD'),
          isActive: true,
        });
        
        console.log(`[导入] 项目${projNum}配置: 名称="${header.projectNames[idx] || `项目${projNum}`}", 日期="${projectDate || '默认今天'}"`);
      });
      
      return newConfig.sort((a, b) => a.number - b.number);
    });
    
    // 更新表头配置（评分人名称）
    // 使用导入的班级名称作为 scope key（如果有的话）
    const importedClassName = header.className || selectedClassCode;
    const importedCampus = header.campusName || selectedCampus || currentCampus || '';
    
    if (Object.keys(header.scoreHeaders).length > 0 && importedClassName) {
      const scope = getScopeKey(importedCampus, importedClassName);
      console.log('[导入] 更新表头配置, scope:', scope, 'scoreHeaders:', header.scoreHeaders);
      
      setRoleHeadersMap(prev => {
        const scopeMap = { ...(prev[scope] || {}) };
        Object.entries(header.scoreHeaders).forEach(([projNumStr, names]) => {
          const projNum = parseInt(projNumStr);
          const current = { ...DEFAULT_HEADERS };  // 从默认值开始，确保所有字段都有值
          
          // 直接使用解析到的名称
          if (names[0]) current.instructor1 = names[0];
          if (names[1]) current.instructor2 = names[1];
          if (names[2]) current.instructor3 = names[2];
          if (names[3]) current.homeroom1 = names[3];
          if (names[4]) current.homeroom2 = names[4];
          
          scopeMap[projNum] = current;
          console.log(`[导入] 项目${projNum}表头配置:`, current);
        });
        return { ...prev, [scope]: scopeMap };
      });
    }
    
    // 第二阶段：解析数据行
    for (let lineIdx = dataStartLine; lineIdx < lines.length; lineIdx++) {
      const cols = lines[lineIdx].split('\t').map(c => c.trim());
      
      // 跳过空行或表头行
      if (cols.length < 3) continue;
      if (cols.some(c => c.includes('项目') || c.includes('评分') || c.includes('姓名') || c.includes('学号') || c.includes('序号'))) continue;
      
      // 解析学号和姓名
      let name = '';
      let studentId = '';
      let scoreStartIndex = 0;
      
      const col0 = cols[0];
      const col1 = cols[1];
      const col2 = cols[2] || '';
      
      // 情况1：序号 + 姓名 + 分数（最常见格式：1	张三	5.5	...）
      if (/^\d{1,3}$/.test(col0) && col1 && !/^\d+\.?\d*$/.test(col1)) {
        studentId = col0;  // 直接使用序号作为学号（1, 2, 3...）
        name = col1;
        scoreStartIndex = 2;
      }
      // 情况2：学号(长数字) + 姓名 + 分数
      else if (/^\d{6,}$/.test(col0) && col1 && !/^\d+\.?\d*$/.test(col1)) {
        studentId = col0;
        name = col1;
        scoreStartIndex = 2;
      }
      // 情况3：序号 + 学号 + 姓名 + 分数
      else if (/^\d{1,3}$/.test(col0) && /^\d{6,}$/.test(col1) && col2 && !/^\d+\.?\d*$/.test(col2)) {
        studentId = col0;  // 使用序号作为学号
        name = col2;
        scoreStartIndex = 3;
      }
      // 情况4：姓名 + 分数（第一列是姓名）
      else if (col0 && !/^\d+\.?\d*$/.test(col0) && col0.length <= 10) {
        name = col0;
        scoreStartIndex = 1;
      }
      
      if (!name) continue;
      
      // 查找或创建学生
      let studentIndex = existingNames.has(name) ? existingNames.get(name)! : -1;
      let student: PressureInterviewRecord;
      
      // 使用导入的班级和神殿信息
      const useClassName = header.className || selectedClassCode;
      const useCampus = header.campusName || selectedCampus || currentCampus || '';
      const useMajor = header.majorName || selectedMajor;
      const useCourse = header.courseName || selectedCourse;
      const useInstructor = header.instructorName || instructor;
      
      if (studentIndex !== -1) {
        student = { ...newDataSource[studentIndex] };
        updatedCount++;
      } else {
        // 学号：如果有解析到的序号就用，否则用递增数字
        const newId = studentId || String(createdCount + 1);
        
        student = {
          id: `new-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          studentId: newId,
          studentName: name,
          projectScores: {},
          campus: useCampus,
          majorName: useMajor,
          classCode: useClassName,
          courseName: useCourse,
          instructor: useInstructor,
          year: dayjs().year(),
          month: dayjs().month() + 1,
          createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        };
        createdCount++;
      }
      
      // 解析分数 - 每6列为一组：教员1, 教员2, 教员3, 班主任1, 班主任2, 平均分
      const scoreCols = cols.slice(scoreStartIndex);
      const parseScore = (val: string) => {
        if (!val) return 0;
        const n = parseFloat(val);
        return isNaN(n) ? 0 : n;
      };
      
      // 解析所有项目的分数（不限制项目数量）
      for (let projIdx = 0; projIdx < header.projectNumbers.length; projIdx++) {
        const baseIdx = projIdx * 6;
        if (baseIdx >= scoreCols.length) break;
        
        const projectNum = header.projectNumbers[projIdx] || (projIdx + 1);
        const chunk = scoreCols.slice(baseIdx, baseIdx + 6);
        
        // 检查是否有有效分数
        const hasValue = chunk.some(c => c !== '' && /^\d+\.?\d*$/.test(c));
        if (!hasValue) continue;
        
        const s1 = parseScore(chunk[0]);
        const s2 = parseScore(chunk[1]);
        const s3 = parseScore(chunk[2]);
        const h1 = parseScore(chunk[3]);
        const h2 = parseScore(chunk[4]);
        
        // 计算平均分（如果有分数的话）
        const validScores = [s1, s2, s3, h1, h2].filter(s => s > 0);
        const avg = validScores.length > 0 
          ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10 
          : 0;
        
        student.projectScores = {
          ...student.projectScores,
          [projectNum]: {
            instructor1Score: s1,
            instructor2Score: s2,
            instructor3Score: s3,
            homeroomTeacher1Score: h1,
            homeroomTeacher2Score: h2,
            averageScore: avg
          }
        };
      }
      
      if (studentIndex !== -1) {
        newDataSource[studentIndex] = student;
      } else {
        newDataSource.push(student);
        existingNames.set(student.studentName, newDataSource.length - 1);
      }
    }
    
    setPasteModalVisible(false);
    setPasteText('');
    
    // 构建导入结果消息
    const finalProjectCount = header.projectNumbers.length;
    const headerInfo: string[] = [];
    
    // 项目数量
    headerInfo.push(`${finalProjectCount} 个项目`);
    
    // 筛选信息
    if (filterUpdates.length > 0) {
      headerInfo.push(`筛选: ${filterUpdates.join(', ')}`);
    }
    
    // 显示导入中消息
    message.loading({
      content: `正在导入 ${createdCount + updatedCount} 条数据到后端...`,
      key: 'import-save',
      duration: 0,
    });
    
    // 自动保存到后端
    try {
      // 获取导入后的教员姓名
      const finalInstructor = header.instructorName || instructor;
      const finalCampus = header.campusName || selectedCampus || currentCampus || '';
      const finalClassName = header.className || selectedClassCode;
      
      if (!finalInstructor) {
        message.warning({
          content: `导入完成: 新增 ${createdCount} 人, 更新 ${updatedCount} 人。请填写教员姓名后点击"保存到后端"`,
          key: 'import-save',
          duration: 5,
        });
        setDataSource(newDataSource);
        return;
      }
      
      // 获取表头配置
      const scope = getScopeKey(finalCampus, finalClassName);
      const headerConfigToSave = roleHeadersMap[scope] || {};
      
      // 首先保存表头配置
      if (Object.keys(headerConfigToSave).length > 0 && finalCampus && finalClassName) {
        try {
          await pressInterviewHeaderConfigService.updateAll(finalCampus, finalClassName, headerConfigToSave);
        } catch (error) {
          console.error('[导入] 保存表头配置失败:', error);
        }
      }
      
      // 保存所有数据到后端
      const toPayloadForImport = (record: PressureInterviewRecord) => ({
        campusName: record.campus || finalCampus,
        majorName: record.majorName || header.majorName || selectedMajor,
        className: record.classCode || finalClassName,
        courseName: record.courseName || header.courseName || selectedCourse,
        instructorName: record.instructor || finalInstructor,
        studentId: record.studentId || '',
        studentName: record.studentName || '',
        projectScores: record.projectScores || {},
        headerConfig: headerConfigToSave,
        year: record.year || dayjs().year(),
        month: record.month || dayjs().month() + 1,
      });
      
      const results = await Promise.all(
        newDataSource.map(async (item) => {
          const payload = { id: item.id, ...toPayloadForImport(item) } as any;
          const isExistingRecord = item.id && typeof item.id === 'number' || 
            (typeof item.id === 'string' && !String(item.id).startsWith('new-') && !isNaN(Number(item.id)));
          
          if (isExistingRecord) {
            return pressInterviewScoreService.update(payload);
          }
          return pressInterviewScoreService.create(payload);
        }),
      );
      
      // 用后端返回的数据刷新
      const mapped = results.map((created: any) =>
        mapFromApi({
          ...created,
          campus: created.campusName,
          majorName: created.majorName,
          classCode: created.className,
          courseName: created.courseName,
          instructor: created.instructorName,
          projectScores: created.projectScores,
        }),
      );
      setDataSource(mapped);
      message.success({
        content: `导入并保存成功！新增 ${createdCount} 人, 更新 ${updatedCount} 人, ${headerInfo.join(', ')}`,
        key: 'import-save',
        duration: 5,
      });
      
    } catch (error) {
      console.error('[导入] 保存到后端失败:', error);
      message.error({
        content: `导入成功但保存失败，请手动点击"保存到后端"。新增 ${createdCount} 人, 更新 ${updatedCount} 人`,
        key: 'import-save',
        duration: 5,
      });
      setDataSource(newDataSource);
    }
  };

  // 保存当前表格所有成绩到后端
  const handleSaveAll = async () => {
    if (!instructor) {
      message.error('请选择教员姓名后保存');
      return;
    }
    setLoading(true);
    try {
      // 首先保存表头配置（如果有）
      const scope = getScopeKey(selectedCampus || currentCampus || '', selectedClassCode);
      const headerConfig = roleHeadersMap[scope];
      if (headerConfig && Object.keys(headerConfig).length > 0 && selectedCampus && selectedClassCode) {
        try {
          // 批量更新所有项目的表头配置（更新所有相同神殿+班级的记录）
          await pressInterviewHeaderConfigService.updateAll(
            selectedCampus || currentCampus || '',
            selectedClassCode,
            headerConfig,
          );
        } catch (error) {
          console.error('[表头配置] 保存失败:', error);
          // 不中断保存流程，继续保存成绩数据
        }
      }
      
      // 保存所有成绩记录（包含表头配置，确保在创建新记录时 header_config 字段被正确设置）
      const results = await Promise.all(
        dataSource.map(async (item) => {
          const payload = { id: item.id, ...toPayload(item) } as any;
          // headerConfig 应该包含在 payload 中，这样在创建新记录时 header_config 字段会被正确设置
          // 检查是否为有效的数字 ID（排除 new- 开头的临时 ID）
          const isExistingRecord = item.id && typeof item.id === 'number' || (typeof item.id === 'string' && !String(item.id).startsWith('new-') && !isNaN(Number(item.id)));
          if (isExistingRecord) {
            return pressInterviewScoreService.update(payload);
          }
          // 创建新记录时，确保 headerConfig 包含在 payload 中
          return pressInterviewScoreService.create(payload);
        }),
      );
      
      // 保存所有记录后，再次更新所有记录的 header_config，确保一致性
      if (headerConfig && Object.keys(headerConfig).length > 0 && selectedCampus && selectedClassCode) {
        try {
          await pressInterviewHeaderConfigService.updateAll(
            selectedCampus || currentCampus || '',
            selectedClassCode,
            headerConfig,
          );
        } catch (error) {
          console.error('[表头配置] 最终同步失败:', error);
          // 不中断保存流程，因为记录已经保存成功
        }
      }
      // 用后端返回的数据刷新
      const mapped = results.map((created: any) =>
        mapFromApi({
          ...created,
          campus: created.campusName,
          majorName: created.majorName,
          classCode: created.className,
          courseName: created.courseName,
          instructor: created.instructorName,
          projectScores: created.projectScores,
        }),
      );
      setDataSource(mapped);
      message.success('已保存到后端');
    } catch (error) {
      console.error('保存失败', error);
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 过滤数据
  const filteredData = dataSource.filter(item => {
    const matchesSearch = !searchText || 
      item.studentName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.studentId.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesClass = !selectedClassCode || item.classCode === selectedClassCode;
    const matchesMajor = !selectedMajor || item.majorName === selectedMajor;
    const matchesCourse = !selectedCourse || item.courseName === selectedCourse;
    const matchesInstructor = !instructor || item.instructor === instructor;
    
    const result = matchesSearch && matchesClass && matchesMajor && matchesCourse && matchesInstructor;
    if (!result && dataSource.length > 0) {
      // 只记录第一条被过滤的记录详情
      const isFirstFiltered = !(window as any).__firstFilteredLogged;
      if (isFirstFiltered) {
        (window as any).__firstFilteredLogged = true;
        console.log('🔍 filteredData - 第一条被过滤的记录详情:', {
          studentName: item.studentName,
          studentId: item.studentId,
          itemClassCode: item.classCode,
          itemClassCodeType: typeof item.classCode,
          selectedClassCode: selectedClassCode,
          selectedClassCodeType: typeof selectedClassCode,
          matchesClass,
          itemMajorName: item.majorName,
          selectedMajor: selectedMajor,
          matchesMajor: item.majorName === selectedMajor,
          itemCourseName: item.courseName,
          selectedCourse: selectedCourse,
          matchesCourse: item.courseName === selectedCourse,
          itemInstructor: item.instructor,
          instructor: instructor,
          matchesInstructor: item.instructor === instructor,
          matchesSearch,
        });
      }
    }
    
    return result;
  });
  
  console.log('🔍 filteredData - 过滤后的数据:', filteredData.length, '条，原始数据:', dataSource.length, '条');

  return (
    <div style={{ padding: 24 }}>
      <Card title="清美教育学员压力面试成绩登记表">
        {/* 表头信息 */}
        <Row gutter={16} style={{ marginBottom: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
          <Col span={5}>
            <Space>
              <strong>神殿名称：</strong>
              <Select
                style={{ minWidth: 140 }}
                value={selectedCampus || currentCampus}
                options={campusOptions}
                onChange={(val) => {
                  setSelectedCampus(val);
                  // 不在这里清空专业和班级，由 useEffect 根据选项列表的变化来处理
                }}
              />
            </Space>
          </Col>
          <Col span={5}>
            <Space>
              <strong>专业名称：</strong>
              <Select
                style={{ minWidth: 140 }}
                value={selectedMajor}
                options={majorOptions}
                allowClear
                placeholder="请选择"
                onChange={(val) => {
                  setSelectedMajor(val || '');
                  // 不在这里清空课程，因为课程可能不受专业限制，或者用户可能想手动输入
                }}
              />
            </Space>
          </Col>
          <Col span={5}>
            <Space>
              <strong>班级名称：</strong>
              <Select
                style={{ minWidth: 140 }}
                value={selectedClassCode}
                options={classOptions}
                allowClear
                placeholder="请选择"
                onChange={(val) => setSelectedClassCode(val || '')}
              />
            </Space>
          </Col>
          <Col span={5}>
            <Space>
              <strong>课程名称：</strong>
              <AutoComplete
                style={{ minWidth: 140 }}
                value={selectedCourse}
                options={courseOptions}
                allowClear
                placeholder="请选择或输入"
                onChange={(val) => setSelectedCourse(val || '')}
                filterOption={(inputValue, option) =>
                  option?.label?.toString().toLowerCase().includes(inputValue.toLowerCase()) ?? false
                }
              />
            </Space>
          </Col>
          <Col span={4}>
            <Space>
              <strong>教员姓名：</strong>
              <AutoComplete
                style={{ width: 120 }}
                value={instructor}
                options={teacherOptions.map(opt => ({ value: opt.value, label: opt.label }))}
                allowClear
                placeholder="请选择或输入"
                filterOption={(inputValue, option) =>
                  (option?.label?.toString() ?? '').toLowerCase().includes(inputValue.toLowerCase())
                }
                onChange={(val) => {
                  const value = val || '';
                  setInstructor(value);
                  // 如果用户清空了教员姓名，重置自动填充记录，允许下次自动填充
                  if (!value.trim()) {
                    lastAutoFilledClassRef.current = '';
                  }
                }}
                onSelect={(val) => {
                  // 从下拉列表选择时，也更新教员姓名
                  setInstructor(val);
                  // 标记为手动选择，避免自动填充覆盖
                  if (selectedClassCode) {
                    lastAutoFilledClassRef.current = selectedClassCode;
                  }
                }}
              />
            </Space>
          </Col>
        </Row>

        {/* 教员姓名提示 */}
        {!instructor && (
          <Alert
            message="请先填入教员姓名！"
            type="warning"
            showIcon
            closable
            style={{ marginBottom: 24 }}
          />
        )}

        {/* 筛选条件不完整提示 */}
        {!canLoadData && (
          <Alert
            message="请先选择神殿和班级"
            description="选择神殿和班级后，将自动加载该班级的压力面试成绩数据。"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 24, padding: 16, backgroundColor: '#f0f9ff', borderRadius: 8 }}>
          <Col span={4}>
            <Statistic
              title="强化人数"
              value={statistics.totalStudents}
              suffix="人"
              prefix={<TeamOutlined />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="面试次数"
              value={statistics.totalProjects}
              suffix="次"
              prefix={<ProjectOutlined />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="应面试数量"
              value={statistics.totalInterviews}
              suffix="次"
              prefix={<CalculatorOutlined />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="实际面试数量"
              value={statistics.actualInterviews}
              suffix="次"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="合格数量"
              value={statistics.qualifiedCount}
              suffix="次"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 24, padding: 16, backgroundColor: '#f6ffed', borderRadius: 8 }}>
          <Col span={6}>
            <Statistic
              title="面试参与率"
              value={statistics.participationRate}
              suffix="%"
              prefix={<CalculatorOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="面试合格率"
              value={statistics.qualificationRate}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>

        {/* 筛选条件 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <span>项目：</span>
            <Select
              value={selectedProject}
              onChange={handleProjectChange}
              style={{ width: 120 }}
            >
              {projectConfig.map(project => (
                <Option key={project.number} value={project.number}>
                  项目{project.number}
                </Option>
              ))}
            </Select>
            
            <span>班级：</span>
            <Select
              value={selectedClassCode}
              onChange={handleClassChange}
              style={{ width: 120 }}
              allowClear
              placeholder="请选择班级"
              options={classOptions}
              showSearch
              filterOption={(input, option) =>
                (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Space>
          
          <Input.Search
            placeholder="搜索学号或姓名"
            style={{ width: 300 }}
            onSearch={handleSearch}
            allowClear
          />
        </div>

        {/* 操作按钮 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space wrap>
            <Button
              icon={<UsergroupAddOutlined />}
              onClick={handleGenerateStudentsFromArchive}
            >
              从班档案导入学员
            </Button>
            <Button
              icon={<ImportOutlined />}
              onClick={() => setPasteModalVisible(true)}
            >
              从剪切板导入
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddStudent}
            >
              添加学员
            </Button>

            <Button
              type="primary"
              ghost
              icon={<PlusOutlined />}
              onClick={addProject}
            >
              新增项目
            </Button>
            <Button danger onClick={openDeleteModal}>删除项目</Button>
            <Button type="primary" onClick={handleSaveAll}>
              保存到后端
            </Button>
          </Space>
        </div>

        {/* 数据表格 */}
        <Table
          columns={generateColumns()}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          scroll={{ x: 2000 }}
          className="pressure-interview-table"
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          bordered
          size="small"
        />

        {/* 说明信息 */}
        <Alert
          message="说明"
          description="此表记录学员的压力面试成绩，支持5个项目，每个项目包含5个评分维度（3个教员评分+2个班主任评分）和平均得分。支持实时编辑评分，平均分自动计算。绿色表示合格(≥6分)，红色表示不合格(<6分)。"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑学员' : '添加学员'}
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
            campus: selectedCampus || currentCampus || '',
            majorName: selectedMajor || '',
            classCode: selectedClassCode || '',
            courseName: selectedCourse || '',
            instructor: instructor || '',
            year: dayjs().year(),
            month: dayjs().month() + 1,
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
                name="classCode"
                label="班级"
                rules={[{ required: true, message: '请选择班级' }]}
              >
                <Select
                  allowClear
                  placeholder="请选择班级"
                  options={classOptions}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="courseName"
                label="课程名称"
                rules={[{ required: true, message: '请输入课程名称' }]}
              >
                <AutoComplete
                  allowClear
                  placeholder="请选择或输入课程名称"
                  options={courseOptions}
                  filterOption={(inputValue, option) =>
                    option?.label?.toString().toLowerCase().includes(inputValue.toLowerCase()) ?? false
                  }
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 删除项目弹窗 */}
      <Modal
        title="删除项目"
        open={deleteModalVisible}
        onOk={handleConfirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
        okText="删除"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>请选择要删除的项目：</div>
          <Select
            style={{ width: 220 }}
            value={deleteTarget}
            onChange={setDeleteTarget}
            placeholder="选择项目"
          >
            {projectConfig.map(p => (
              <Option key={p.number} value={p.number}>{`项目${p.number}（${p.name}）`}</Option>
            ))}
          </Select>
          <Alert type="warning" showIcon message="提示" description="删除将移除该项目的所有学员成绩及该项目的自定义表头配置，且不可恢复。" />
        </Space>
      </Modal>

      {/* 粘贴导入弹窗 */}
      <Modal
        title="从剪切板导入数据（智能解析）"
        open={pasteModalVisible}
        onOk={handleParseAndImport}
        onCancel={() => {
          setPasteModalVisible(false);
          setPasteText('');
        }}
        width={950}
        okText="智能导入"
        cancelText="取消"
      >
        <Alert
          message="智能导入说明 - 支持完整表格导入"
          description={
            <div>
              <p><strong>直接从 Excel 复制整个表格（包含所有表头）粘贴即可，系统会自动识别并填充：</strong></p>
              <ul style={{ marginBottom: 8 }}>
                <li><strong style={{ color: '#1890ff' }}>顶部筛选信息：</strong>神殿名称、专业名称、班级名称、课程名称、教员姓名 → 自动填充到页面顶部筛选区域</li>
                <li><strong>项目信息：</strong>项目序号、项目名称（如"简历项目1"）、答辩日期</li>
                <li><strong>评分人名称：</strong>教员评分列标题（如"李新福评分"、"刁梦雷评分"）、班主任评分列标题</li>
                <li><strong>学员数据：</strong>学号、姓名、各项目的分数</li>
              </ul>
              <p style={{ color: '#52c41a' }}>✅ 支持从 Excel 完整复制"清美教育学员项目答辩成绩登记表"</p>
              <p style={{ color: '#fa8c16' }}>⚠️ 已存在的学员会更新分数，新学员会自动添加</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <TextArea
          rows={18}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={`请在此处粘贴 Excel 数据（支持完整表格）...

示例格式（从 Excel 复制的完整表格）：
清美教育学员项目答辩成绩登记表
神殿名称	盛邦	专业名称	云计算	班级名称	36	课程名称	项目答辩	教员姓名	李建峰
强化人数	20	答辩次数	20	应答辩数量	400	实际答辩数量	395	合格数量	375
答辩参与率	98.8%	答辩合格率	94.9%
项目序号		项目1					项目2
项目名称		简历项目1					简历项目2
答辩日期		2025/8/12					2025/8/13
学号	学员姓名	刁梦雷评分	教员2评分	教员3评分	班主任1评分	班主任2评分	平均得分	李新福评分	...
1	刘思博	5.5				5.5		5.5
2	吴茂杰	6				5.5		5.5
...`}
          style={{ whiteSpace: 'pre', overflow: 'auto', fontFamily: 'monospace' }}
        />
      </Modal>

      {/* 学员详情抽屉 */}
      <Drawer
        title="学员压力面试详情"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={1000}
      >
        {editingStudentId && (
          <div>
            {(() => {
              const student = dataSource.find(s => s.id === editingStudentId);
              if (!student) return <div>学员信息不存在</div>;
              
              return (
                <div>
                  <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={12}>
                      <Statistic
                        title="学号"
                        value={student.studentId}
                        prefix={<UserOutlined />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="姓名"
                        value={student.studentName}
                        prefix={<UserOutlined />}
                      />
                    </Col>
                  </Row>

                  <Divider>压力面试详情</Divider>
                  <Row gutter={16}>
                    {projectConfig.map(project => (
                      <Col span={24} key={project.number} style={{ marginBottom: 16 }}>
                        <Card size="small" title={`项目${project.number} - ${project.name}`}>
                          <Row gutter={16}>
                            <Col span={4}>
                              <div>教员1评分：{student.projectScores[project.number]?.instructor1Score || 0}分</div>
                            </Col>
                            <Col span={4}>
                              <div>教员2评分：{student.projectScores[project.number]?.instructor2Score || 0}分</div>
                            </Col>
                            <Col span={4}>
                              <div>教员3评分：{student.projectScores[project.number]?.instructor3Score || 0}分</div>
                            </Col>
                            <Col span={4}>
                              <div>班主任1评分：{student.projectScores[project.number]?.homeroomTeacher1Score || 0}分</div>
                            </Col>
                            <Col span={4}>
                              <div>班主任2评分：{student.projectScores[project.number]?.homeroomTeacher2Score || 0}分</div>
                            </Col>
                            <Col span={4}>
                              <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
                                平均得分：{Number(student.projectScores[project.number]?.averageScore ?? 0).toFixed(1)}分
                              </div>
                            </Col>
                          </Row>
                          <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                            面试日期：{dayjs(project.interviewDate).format('YYYY-MM-DD')}
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              );
            })()}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default PressureInterviewPage;
