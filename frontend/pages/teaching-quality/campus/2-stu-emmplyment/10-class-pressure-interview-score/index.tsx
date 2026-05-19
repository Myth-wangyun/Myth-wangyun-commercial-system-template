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
  Drawer,
  AutoComplete,
  Popover
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
  UsergroupAddOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCampusStore } from '@/stores/campusStore';
import { pressInterviewScoreService, pressInterviewHeaderConfigService } from '@/services/service';
import { useConfigOptions } from '@/hooks/useConfigOptions';
import { buildApiUrl, apiFetch } from '@/utils/apiBase';
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
  const { currentCampus } = useCampusStore();
  const [selectedCampus, setSelectedCampus] = useState(currentCampus || '');
  const [selectedClassCode, setSelectedClassCode] = useState('');

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
  const loadHeaderConfigs = async (campus?: string, className?: string) => {
    if (!campus || !className) return;
    try {
      const configs = await pressInterviewHeaderConfigService.getList(campus, className);
      if (configs && Object.keys(configs).length > 0) {
        setRoleHeadersMap(configs as Record<string, Record<number, RoleHeaders>>);
        // 同时更新 localStorage 作为本地缓存
        try {
          localStorage.setItem(ROLE_HEADERS_MAP_LS_KEY, JSON.stringify(configs));
        } catch {}
      }
    } catch (error) {
      console.warn('[表头配置] 从后端加载失败，使用本地缓存:', error);
      // 如果后端加载失败，尝试从 localStorage 加载
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

  // 载入（整个映射）- 优先从后端加载
  useEffect(() => {
    if (selectedCampus && selectedClassCode) {
      loadHeaderConfigs(selectedCampus || currentCampus, selectedClassCode);
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
  }, [selectedCampus, selectedClassCode, currentCampus]);

  // 持久化到 localStorage 和后端
  useEffect(() => {
    try {
      localStorage.setItem(ROLE_HEADERS_MAP_LS_KEY, JSON.stringify(roleHeadersMap));
    } catch {}
  }, [roleHeadersMap]);

  // 获取/更新某项目的头部
  const getProjectHeaders = (projectNumber: number): RoleHeaders => {
    const scope = getScopeKey(selectedCampus || currentCampus, selectedClassCode);
    return roleHeadersMap[scope]?.[projectNumber] || DEFAULT_HEADERS;
  };
  const setProjectHeaderField = (projectNumber: number, field: keyof RoleHeaders, value: string) => {
    const scope = getScopeKey(selectedCampus || currentCampus, selectedClassCode);
    const campus = selectedCampus || currentCampus || '';
    const className = selectedClassCode || '';
    
    setRoleHeadersMap(prev => {
      const scopeMap = { ...(prev[scope] || {}) };
      const current = scopeMap[projectNumber] || { ...DEFAULT_HEADERS };
      const updated = { ...current, [field]: value } as RoleHeaders;
      scopeMap[projectNumber] = updated;
      const newMap = { ...prev, [scope]: scopeMap };
      
      // 异步保存到后端
      if (campus && className) {
        saveHeaderConfig(campus, className, projectNumber, updated);
      }
      
      return newMap;
    });
  };
  const [instructor, setInstructor] = useState('');
  const [selectedMajor, setSelectedMajor] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [dataSource, setDataSource] = useState<PressureInterviewRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PressureInterviewRecord | null>(null);
  const [form] = Form.useForm<PressureInterviewFormData>();
  const [searchText, setSearchText] = useState('');
  const [selectedProject, setSelectedProject] = useState<number>(1);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string>('');
  const { campuses: campusOptions, majors: majorOptions, classes: classOptions, courses: courseOptions, teachers: teacherOptions } = useConfigOptions({
    campusName: selectedCampus || currentCampus || '',
    majorName: selectedMajor,
  });
  const toPayload = (record: Partial<PressureInterviewRecord>) => ({
    campusName: selectedCampus || record.campus || '',
    majorName: record.majorName || selectedMajor,
    className: record.classCode || selectedClassCode,
    courseName: record.courseName || selectedCourse,
    instructorName: record.instructor || instructor,
    studentId: record.studentId || '',
    studentName: record.studentName || '',
    projectScores: record.projectScores || {},
    year: record.year || dayjs().year(),
    month: record.month || dayjs().month() + 1,
  });

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

  const loadData = async () => {
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
    } catch (error) {
      console.error('❌ 加载数据失败', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCampus, selectedClassCode, selectedMajor, selectedCourse, instructor, searchText]);

  const handleRoleHeaderChange = (projectNumber: number, key: keyof RoleHeaders, value: string) => {
    setProjectHeaderField(projectNumber, key, value);
  };

  // Popover 的打开状态管理
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});
  // Popover 输入框的值管理
  const [popoverInputValues, setPopoverInputValues] = useState<Record<string, string>>({});
  
  const getPopoverKey = (projectNumber: number, key: keyof RoleHeaders) => `${projectNumber}_${key}`;
  
  const setPopoverOpen = (projectNumber: number, key: keyof RoleHeaders, open: boolean) => {
    const popoverKey = getPopoverKey(projectNumber, key);
    setOpenPopovers(prev => ({ ...prev, [popoverKey]: open }));
    
    // 当打开 Popover 时，从当前表头配置中提取教员姓名（去掉"评分"后缀）作为默认值
    if (open) {
      const currentHeader = getProjectHeaders(projectNumber)[key];
      const nameWithoutSuffix = currentHeader.replace(/评分$/, '').trim();
      // 如果是默认值（如"教员1评分"），则清空输入框
      const defaultValue = DEFAULT_HEADERS[key];
      const inputValue = currentHeader === defaultValue ? '' : nameWithoutSuffix;
      setPopoverInputValues(prev => ({ ...prev, [popoverKey]: inputValue }));
    } else {
      // 关闭时清空输入值
      setPopoverInputValues(prev => {
        const newValues = { ...prev };
        delete newValues[popoverKey];
        return newValues;
      });
    }
  };
  
  const setPopoverInputValue = (projectNumber: number, key: keyof RoleHeaders, value: string) => {
    const popoverKey = getPopoverKey(projectNumber, key);
    setPopoverInputValues(prev => ({ ...prev, [popoverKey]: value }));
  };

  // 处理表头教员姓名输入（自动拼接"评分"）
  const handleInstructorNameInput = (projectNumber: number, key: keyof RoleHeaders, instructorName: string) => {
    // 如果输入为空，使用默认值
    if (!instructorName || instructorName.trim() === '') {
      const defaultHeader = DEFAULT_HEADERS[key];
      setProjectHeaderField(projectNumber, key, defaultHeader);
      setPopoverOpen(projectNumber, key, false);
      return;
    }
    // 去除已有的"评分"后缀（如果存在）
    const nameWithoutSuffix = instructorName.replace(/评分$/, '').trim();
    // 自动拼接"评分"
    const finalValue = nameWithoutSuffix ? `${nameWithoutSuffix}评分` : DEFAULT_HEADERS[key];
    setProjectHeaderField(projectNumber, key, finalValue);
    setPopoverOpen(projectNumber, key, false);
  };

  // 统计数据
  const statistics = {
    totalStudents: dataSource.length,
    totalProjects: projectConfig.length,
    totalInterviews: dataSource.length * projectConfig.length,
    actualInterviews: dataSource.reduce((total, student) => {
      return total + Object.keys(student.projectScores).length;
    }, 0),
    // 合格次数：所有项目中平均分 >= 6 的次数（排除空值/未填写的项目）
    qualifiedCount: dataSource.reduce((total, student) => {
      return total + Object.values(student.projectScores).filter(score => {
        // 检查是否有实际填写的成绩（至少有一个评分不为空且不为undefined）
        const hasActualScore =
          (score.instructor1Score !== undefined && score.instructor1Score !== null) ||
          (score.instructor2Score !== undefined && score.instructor2Score !== null) ||
          (score.instructor3Score !== undefined && score.instructor3Score !== null) ||
          (score.homeroomTeacher1Score !== undefined && score.homeroomTeacher1Score !== null) ||
          (score.homeroomTeacher2Score !== undefined && score.homeroomTeacher2Score !== null);

        // 只有有实际成绩的项目才参与合格计算
        if (!hasActualScore) return false;

        // 平均分 >= 6 算合格
        return score.averageScore >= 6;
      }).length;
    }, 0),
    participationRate: 0,
    qualificationRate: 0
  };

  // 计算参与率和合格率
  statistics.participationRate = statistics.totalInterviews > 0
    ? Math.round((statistics.actualInterviews / statistics.totalInterviews) * 10000) / 100
    : 0;
  // 计算实际有成绩的面试次数（排除空值）
  const actualInterviewsWithScores = dataSource.reduce((total, student) => {
    return total + Object.values(student.projectScores).filter(score => {
      const hasActualScore =
        (score.instructor1Score !== undefined && score.instructor1Score !== null) ||
        (score.instructor2Score !== undefined && score.instructor2Score !== null) ||
        (score.instructor3Score !== undefined && score.instructor3Score !== null) ||
        (score.homeroomTeacher1Score !== undefined && score.homeroomTeacher1Score !== null) ||
        (score.homeroomTeacher2Score !== undefined && score.homeroomTeacher2Score !== null);
      return hasActualScore;
    }).length;
  }, 0);
  statistics.qualificationRate = actualInterviewsWithScores > 0
    ? Math.round((statistics.qualifiedCount / actualInterviewsWithScores) * 10000) / 100
    : 0;

  // 生成表格列
  const generateColumns = (): ColumnsType<PressureInterviewRecord> => {
    const columns: ColumnsType<PressureInterviewRecord> = [
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
              format="MM/DD"
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
              <Popover
                content={
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>请输入教员姓名（将自动添加"评分"）</div>
                    <Input
                      placeholder="教员姓名"
                      size="small"
                      value={popoverInputValues[getPopoverKey(project.number, 'instructor1')] || ''}
                      onChange={(e) => setPopoverInputValue(project.number, 'instructor1', e.target.value)}
                      onPressEnter={(e) => {
                        const value = (e.target as HTMLInputElement).value;
                        handleInstructorNameInput(project.number, 'instructor1', value);
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        handleInstructorNameInput(project.number, 'instructor1', value);
                      }}
                      style={{ width: 150 }}
                      autoFocus
                    />
                  </div>
                }
                trigger="click"
                placement="top"
                open={openPopovers[getPopoverKey(project.number, 'instructor1')]}
                onOpenChange={(open) => setPopoverOpen(project.number, 'instructor1', open)}
              >
                <div
                  style={{
                    width: 90,
                    textAlign: 'center',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 4,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {getProjectHeaders(project.number).instructor1}
                </div>
              </Popover>
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
              <Popover
                content={
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>请输入教员姓名（将自动添加"评分"）</div>
                    <Input
                      placeholder="教员姓名"
                      size="small"
                      value={popoverInputValues[getPopoverKey(project.number, 'instructor2')] || ''}
                      onChange={(e) => setPopoverInputValue(project.number, 'instructor2', e.target.value)}
                      onPressEnter={(e) => {
                        const value = (e.target as HTMLInputElement).value;
                        handleInstructorNameInput(project.number, 'instructor2', value);
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        handleInstructorNameInput(project.number, 'instructor2', value);
                      }}
                      style={{ width: 150 }}
                      autoFocus
                    />
                  </div>
                }
                trigger="click"
                placement="top"
                open={openPopovers[getPopoverKey(project.number, 'instructor2')]}
                onOpenChange={(open) => setPopoverOpen(project.number, 'instructor2', open)}
              >
                <div
                  style={{
                    width: 90,
                    textAlign: 'center',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 4,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {getProjectHeaders(project.number).instructor2}
                </div>
              </Popover>
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
              <Popover
                content={
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>请输入教员姓名（将自动添加"评分"）</div>
                    <Input
                      placeholder="教员姓名"
                      size="small"
                      value={popoverInputValues[getPopoverKey(project.number, 'instructor3')] || ''}
                      onChange={(e) => setPopoverInputValue(project.number, 'instructor3', e.target.value)}
                      onPressEnter={(e) => {
                        const value = (e.target as HTMLInputElement).value;
                        handleInstructorNameInput(project.number, 'instructor3', value);
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        handleInstructorNameInput(project.number, 'instructor3', value);
                      }}
                      style={{ width: 150 }}
                      autoFocus
                    />
                  </div>
                }
                trigger="click"
                placement="top"
                open={openPopovers[getPopoverKey(project.number, 'instructor3')]}
                onOpenChange={(open) => setPopoverOpen(project.number, 'instructor3', open)}
              >
                <div
                  style={{
                    width: 90,
                    textAlign: 'center',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 4,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {getProjectHeaders(project.number).instructor3}
                </div>
              </Popover>
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
              <Popover
                content={
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>请输入班主任姓名（将自动添加"评分"）</div>
                    <Input
                      placeholder="班主任姓名"
                      size="small"
                      value={popoverInputValues[getPopoverKey(project.number, 'homeroom1')] || ''}
                      onChange={(e) => setPopoverInputValue(project.number, 'homeroom1', e.target.value)}
                      onPressEnter={(e) => {
                        const value = (e.target as HTMLInputElement).value;
                        handleInstructorNameInput(project.number, 'homeroom1', value);
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        handleInstructorNameInput(project.number, 'homeroom1', value);
                      }}
                      style={{ width: 150 }}
                      autoFocus
                    />
                  </div>
                }
                trigger="click"
                placement="top"
                open={openPopovers[getPopoverKey(project.number, 'homeroom1')]}
                onOpenChange={(open) => setPopoverOpen(project.number, 'homeroom1', open)}
              >
                <div
                  style={{
                    width: 100,
                    textAlign: 'center',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 4,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {getProjectHeaders(project.number).homeroom1}
                </div>
              </Popover>
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
              <Popover
                content={
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>请输入班主任姓名（将自动添加"评分"）</div>
                    <Input
                      placeholder="班主任姓名"
                      size="small"
                      value={popoverInputValues[getPopoverKey(project.number, 'homeroom2')] || ''}
                      onChange={(e) => setPopoverInputValue(project.number, 'homeroom2', e.target.value)}
                      onPressEnter={(e) => {
                        const value = (e.target as HTMLInputElement).value;
                        handleInstructorNameInput(project.number, 'homeroom2', value);
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        handleInstructorNameInput(project.number, 'homeroom2', value);
                      }}
                      style={{ width: 150 }}
                      autoFocus
                    />
                  </div>
                }
                trigger="click"
                placement="top"
                open={openPopovers[getPopoverKey(project.number, 'homeroom2')]}
                onOpenChange={(open) => setPopoverOpen(project.number, 'homeroom2', open)}
              >
                <div
                  style={{
                    width: 100,
                    textAlign: 'center',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 4,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {getProjectHeaders(project.number).homeroom2}
                </div>
              </Popover>
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

      setDataSource(prev => [...prev, ...newStudents]);
      const refundMsg = refundedCount > 0 ? `，已排除退费学员${refundedCount}人` : '';
      message.success(`已从班档案表导入 ${newStudents.length} 名学员${refundMsg}`);
    } catch (error) {
      console.error('从班档案表生成学员失败:', error);
      message.error('从班档案表获取数据失败');
    } finally {
      setLoading(false);
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
      const results = await Promise.all(
        dataSource.map(async (item) => {
          const payload = { id: item.id, ...toPayload(item) } as any;
          // 检查是否为有效的数字 ID（排除 new- 开头的临时 ID）
          const isExistingRecord = item.id && typeof item.id === 'number' || (typeof item.id === 'string' && !String(item.id).startsWith('new-') && !isNaN(Number(item.id)));
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
                  setSelectedClassCode('');
                  setSelectedMajor('');
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
                  setSelectedCourse('');
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
              <Select
                style={{ width: 120 }}
                value={instructor}
                options={teacherOptions}
                allowClear
                placeholder="请选择"
                showSearch
                filterOption={(input, option) =>
                  (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
                }
                onChange={(val) => setInstructor(val || '')}
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
