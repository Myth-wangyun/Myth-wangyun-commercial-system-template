import React, { useMemo, useState, Suspense, lazy, useCallback, useEffect } from 'react';
import { App,
  Card,
  Tabs,
  Typography,
  Spin,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Table,
  Space,
  Select,
  Row,
  Col,
  ConfigProvider,
  Popconfirm,
  AutoComplete,
  Tabs as AntTabs,
} from 'antd';
import { CopyOutlined, UploadOutlined } from '@ant-design/icons';
import { useCampusStore } from '@/stores/campusStore';
import dayjs from 'dayjs';
import {
  defaultProjectDefinitions,
  type ProjectDefinition,
} from '@/pages/academic/campus/02-stu-employment/6-campus-project-plan.tsx/project-plan-shared';
import type { ColumnsType } from 'antd/es/table';
import { fetchCampusClassList } from '@/services/academic/campusClassEmploymentInfo';
import { fetchTeachers } from '@/services/configMaster';
import { fetchProjectPlan, saveProjectPlan } from '@/services/campusProjectPlan';
import HomeroomTeacherSelect from '@/components/HomeroomTeacherSelect';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';

const ClassProjectPlan = lazy(() => import('@/pages/academic/campus/02-stu-employment/6-campus-project-plan.tsx/class-project-plan'));
dayjs.locale('zh-cn');

const { Title, Text } = Typography;
const renderLazy = (node: React.ReactNode) => (
  <Suspense fallback={<Spin style={{ margin: '24px 0' }} />}>{node}</Suspense>
);

type ClassProjectPlanEntry = {
  id: string;
  campus: string;
  className: string;
  instructor?: string; // 兼容旧字段
  classAdvisor?: string; // 班主任
  reinforcementInstructor?: string; // 强化教员
  projectDefinitions: ProjectDefinition[];
};

const cloneProjectDefinitions = (definitions: ProjectDefinition[]): ProjectDefinition[] =>
  definitions.map(project => ({
    ...project,
    tasks: project.tasks.map(task => ({ ...task })),
  }));

const defaultClassPlans: ClassProjectPlanEntry[] = [
  {
    id: 'SM-S32106',
    campus: '慈悲殿',
    className: 'S32106班',
    instructor: '张博',
    classAdvisor: '郭丽萍',
    reinforcementInstructor: '姜东亮',
    projectDefinitions: cloneProjectDefinitions(defaultProjectDefinitions),
  },
];

const stripCampus = (s?: string) => (s ? s.replace(/神殿$/, '') : '');

const CampusProjectPlanPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [editClassInfoVisible, setEditClassInfoVisible] = useState(false);
  const [classInfoForm] = Form.useForm();
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [classPlans, setClassPlans] = useState<ClassProjectPlanEntry[]>(defaultClassPlans);
  const [activeClassId, setActiveClassId] = useState<string>(defaultClassPlans[0]?.id ?? '');
  const [activeTabKey, setActiveTabKey] = useState('project-plan');
  const [editingTaskRef, setEditingTaskRef] = useState<{
    classId: string;
    projectIndex: number;
    taskIndex: number;
  } | null>(null);
  const [editProjectDateVisible, setEditProjectDateVisible] = useState(false);
  const [editingProjectIndex, setEditingProjectIndex] = useState<number | null>(null);
  const [editingProjectClassId, setEditingProjectClassId] = useState<string | null>(null);
  const [projectDateForm] = Form.useForm();
  const [teacherOptions, setTeacherOptions] = useState<{ label: string; value: string }[]>([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [planSaving, setPlanSaving] = useState(false);
  const [pasteModalVisible, setPasteModalVisible] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteLoading, setPasteLoading] = useState(false);

  // 与顶部神殿选择器保持一致：根据当前神殿过滤班级
  const normalizedCampus = useMemo(() => stripCampus(currentCampus), [currentCampus]);
  const filteredClassPlans = useMemo(
    () => (normalizedCampus ? classPlans.filter(p => stripCampus(p.campus) === normalizedCampus) : classPlans),
    [classPlans, normalizedCampus],
  );

  // 当神殿变化或班级列表变化时，修正当前选中的班级
  useEffect(() => {
    if (filteredClassPlans.length === 0) {
      setActiveClassId('');
      return;
    }
    if (!filteredClassPlans.some(p => p.id === activeClassId)) {
      setActiveClassId(filteredClassPlans[0].id);
    }
  }, [filteredClassPlans, activeClassId]);

  // 加载后端班级列表（失败则回退到本地模拟），并合并到班级计划列表
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const campusLists = await fetchCampusClassList();
        const fetchedEntries: ClassProjectPlanEntry[] = campusLists.flatMap(list =>
          list.classes.map(cls => ({
            id: cls.id,
            campus: list.campus,
            className: cls.name,
            instructor: cls.classAdvisor || cls.instructor,
            classAdvisor: cls.classAdvisor,
            reinforcementInstructor: undefined,
            projectDefinitions: cloneProjectDefinitions(defaultProjectDefinitions),
          }))
        );
        setClassPlans(prev => {
          const byId = new Map(prev.map(p => [p.id, p] as const));
          fetchedEntries.forEach(e => {
            if (!byId.has(e.id)) {
              byId.set(e.id, e);
            }
          });
          const merged = Array.from(byId.values());
          // 若当前激活班级不存在于合并后列表，则回退到首个
          if (!merged.find(m => m.id === activeClassId)) {
            setActiveClassId(merged[0]?.id || '');
          }
          return merged;
        });
      } catch (err) {
        // 已在服务层处理了回退，这里不需要额外提示
      }
    };
    loadClasses();
    // 仅初始化加载一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

useEffect(() => {
    const loadTeachers = async () => {
      try {
        const list = await fetchTeachers({ active: true });
        setTeacherOptions(
          list.map(teacher => ({
            label: teacher.title ? `${teacher.name}（${teacher.title}）` : teacher.name,
            value: teacher.name,
          })),
        );
      } catch {
        // 忽略加载异常
      }
    };
    loadTeachers();
  }, []);

const activeClassPlan = useMemo(
  () => filteredClassPlans.find(plan => plan.id === activeClassId) ?? filteredClassPlans[0],
  [filteredClassPlans, activeClassId],
);
const activeProjectDefinitions = activeClassPlan?.projectDefinitions ?? [];

  useEffect(() => {
    const loadPlan = async () => {
      if (!activeClassPlan) return;
      setPlanLoading(true);
      try {
        const res = await fetchProjectPlan({
          campus: activeClassPlan.campus,
          class_id: activeClassPlan.id,
          class_name: activeClassPlan.className,
        });
        setClassPlans(prev =>
          prev.map(plan =>
            plan.id === activeClassPlan.id
              ? {
                  ...plan,
                  classAdvisor: res.class_advisor || plan.classAdvisor,
                  reinforcementInstructor: res.reinforcement_instructor || plan.reinforcementInstructor,
                  projectDefinitions: (res.projects || []).map(project => ({
                    number: project.number,
                    name: project.name,
                    startDate: project.start_date || undefined,
                    endDate: project.end_date || undefined,
                    tasks: project.tasks.map(task => ({
                      date: task.date,
                      content: task.content,
                      standard: task.standard,
                      responsiblePerson: task.responsiblePerson,
                      resultDescription: task.resultDescription,
                      supervisor: task.supervisor,
                    })),
                  })),
                }
              : plan,
          ),
        );
      } catch (error) {
        console.warn('加载项目计划失败', error);
      } finally {
        setPlanLoading(false);
      }
    };
    loadPlan();
  }, [activeClassPlan?.id]);

  const handleAdvisorChange = (value?: string) => {
    if (!activeClassPlan) return;
    setClassPlans(prev =>
      prev.map(plan => (plan.id === activeClassPlan.id ? { ...plan, classAdvisor: value } : plan)),
    );
  };

  const handleReinforcementChange = (value?: string) => {
    if (!activeClassPlan) return;
    setClassPlans(prev =>
      prev.map(plan =>
        plan.id === activeClassPlan.id ? { ...plan, reinforcementInstructor: value } : plan,
      ),
    );
  };

  const handleCreateProject = async () => {
    if (!activeClassPlan) {
      message.warning('请先选择班级');
      return;
    }
    try {
      const values = await form.validateFields();
      const [rangeStart, rangeEnd] = values.dateRange || [];
      const start = rangeStart || dayjs();
      const end = rangeEnd || rangeStart || dayjs();
      const dayDiff = end.diff(start, 'day');
      const tasks = Array.from({ length: dayDiff + 1 }, (_, idx) => {
        const current = start.add(idx, 'day');
        return {
          date: current.format('YYYY-MM-DD'),
          content: idx === 0 ? values.description || '' : '',
          standard: '',
          responsiblePerson: idx === 0 ? values.owner : '',
        };
      });
      const newProject: ProjectDefinition = {
        number: `项目${activeClassPlan.projectDefinitions.length + 1}`,
        name: values.projectName,
        startDate: start.format('YYYY-MM-DD'),
        endDate: end.format('YYYY-MM-DD'),
        tasks,
      };
      setClassPlans(prev =>
        prev.map(plan =>
          plan.id === activeClassPlan.id
            ? { ...plan, projectDefinitions: [...plan.projectDefinitions, newProject] }
            : plan,
        ),
      );
      message.success(`项目“${values.projectName}”已创建`);
      setCreateModalVisible(false);
      form.resetFields();
    } catch {
      // ignore
    }
  };

  const handleRequestEditTask = (payload: { projectIndex: number; taskIndex: number; task: ProjectDefinition['tasks'][number] }) => {
    if (!activeClassPlan) {
      message.warning('请先选择班级');
      return;
    }
    setEditingTaskRef({ classId: activeClassPlan.id, projectIndex: payload.projectIndex, taskIndex: payload.taskIndex });
    // 如果当前任务没有负责人，尝试获取上一个日期的负责人
    let defaultResponsiblePerson = payload.task.responsiblePerson;
    let defaultSupervisor = payload.task.supervisor;
    if (!defaultResponsiblePerson && payload.taskIndex > 0) {
      const prevTask = activeClassPlan.projectDefinitions[payload.projectIndex]?.tasks[payload.taskIndex - 1];
      if (prevTask) {
        defaultResponsiblePerson = prevTask.responsiblePerson || '';
        defaultSupervisor = prevTask.supervisor || '';
      }
    }
    editForm.setFieldsValue({
      date: payload.task.date ? dayjs(payload.task.date) : null,
      content: payload.task.content,
      standard: payload.task.standard,
      responsiblePerson: defaultResponsiblePerson,
      resultDescription: payload.task.resultDescription,
      supervisor: defaultSupervisor || payload.task.supervisor,
    });
    setEditModalVisible(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTaskRef) return;
    try {
      const values = await editForm.validateFields();
      setClassPlans(prev =>
        prev.map(plan => {
          if (plan.id !== editingTaskRef.classId) return plan;
          const updatedDefinitions = plan.projectDefinitions.map((project, projectIndex) => {
            if (projectIndex !== editingTaskRef.projectIndex) return project;
            const updatedTasks = project.tasks.map((task, taskIndex) => {
              if (taskIndex !== editingTaskRef.taskIndex) return task;
              return {
                ...task,
                date: values.date ? values.date.format('YYYY-MM-DD') : '',
                content: values.content || '',
                standard: values.standard || '',
                responsiblePerson: values.responsiblePerson || '',
                resultDescription: values.resultDescription || '',
                supervisor: values.supervisor || '',
              };
            });
            return { ...project, tasks: updatedTasks };
          });
          return { ...plan, projectDefinitions: updatedDefinitions };
        }),
      );
      message.success('项目内容已更新');
      setEditModalVisible(false);
      setEditingTaskRef(null);
      editForm.resetFields();
    } catch {
      // ignore
    }
  };

  const handleSwitchClass = useCallback((classId: string) => {
    setActiveClassId(classId);
    setActiveTabKey('project-plan');
    message.success('已切换至该班级项目计划');
  }, []);

  const handleOpenEditClassInfo = useCallback((classId?: string) => {
    const targetId = classId || activeClassId;
    const target = classPlans.find(p => p.id === targetId);
    if (!target) {
      message.warning('请选择班级');
      return;
    }
    classInfoForm.setFieldsValue({
      classAdvisor: target.classAdvisor,
      reinforcementInstructor: target.reinforcementInstructor,
    });
    setEditingClassId(targetId);
    setEditClassInfoVisible(true);
  }, [activeClassId, classPlans, classInfoForm]);

  const handleInlineUpdate = (field: 'classAdvisor' | 'reinforcementInstructor', value?: string) => {
    if (!activeClassId) return;
    setClassPlans(prev =>
      prev.map(p => (p.id === activeClassId ? { ...p, [field]: value } as ClassProjectPlanEntry : p)),
    );
    message.success('班级信息已更新');
  };

  // 删除整个项目
  const handleDeleteProject = (projectIndex: number) => {
    if (!activeClassPlan) return;
    setClassPlans(prev =>
      prev.map(plan => {
        if (plan.id !== activeClassPlan.id) return plan;
        const newDefinitions = plan.projectDefinitions.filter((_, idx) => idx !== projectIndex);
        // 重新编号
        const renumbered = newDefinitions.map((proj, idx) => ({
          ...proj,
          number: `项目${idx + 1}`,
        }));
        return { ...plan, projectDefinitions: renumbered };
      }),
    );
    message.success('项目已删除');
  };

  // 删除某个日期行(task)
  const handleDeleteTask = (projectIndex: number, taskIndex: number) => {
    if (!activeClassPlan) return;
    setClassPlans(prev =>
      prev.map(plan => {
        if (plan.id !== activeClassPlan.id) return plan;
        const newDefinitions = plan.projectDefinitions.map((project, pIdx) => {
          if (pIdx !== projectIndex) return project;
          const newTasks = project.tasks.filter((_, tIdx) => tIdx !== taskIndex);
          // 更新项目的开始结束日期
          const dates = newTasks.map(t => t.date).filter(Boolean).sort();
          return {
            ...project,
            tasks: newTasks,
            startDate: dates[0] || project.startDate,
            endDate: dates[dates.length - 1] || project.endDate,
          };
        });
        return { ...plan, projectDefinitions: newDefinitions };
      }),
    );
    message.success('日期行已删除');
  };

  // 打开编辑项目日期范围模态框
  const handleOpenEditProjectDate = (projectIndex: number) => {
    if (!activeClassPlan) return;
    const project = activeClassPlan.projectDefinitions[projectIndex];
    if (!project) return;
    projectDateForm.setFieldsValue({
      dateRange: project.startDate && project.endDate
        ? [dayjs(project.startDate), dayjs(project.endDate)]
        : undefined,
    });
    setEditingProjectIndex(projectIndex);
    setEditingProjectClassId(activeClassPlan.id);
    setEditProjectDateVisible(true);
  };

  // 更新项目日期范围
  const handleUpdateProjectDate = async () => {
    if (editingProjectIndex === null || !editingProjectClassId) return;
    const targetPlan = classPlans.find(p => p.id === editingProjectClassId);
    if (!targetPlan) return;
    try {
      const values = await projectDateForm.validateFields();
      const [rangeStart, rangeEnd] = values.dateRange || [];
      if (!rangeStart || !rangeEnd) {
        message.warning('请选择日期范围');
        return;
      }
      const start = rangeStart;
      const end = rangeEnd;
      const dayDiff = end.diff(start, 'day');
      const oldProject = targetPlan.projectDefinitions[editingProjectIndex];
      if (!oldProject) return;
      // 生成新的tasks，保留原有数据
      const oldTaskMap = new Map(oldProject.tasks.map(t => [t.date, t]));
      const newTasks: ProjectDefinition['tasks'] = [];
      for (let idx = 0; idx <= dayDiff; idx++) {
        const current = start.add(idx, 'day');
        const dateStr = current.format('YYYY-MM-DD');
        const existing = oldTaskMap.get(dateStr);
        if (existing) {
          newTasks.push(existing);
        } else {
          // 默认获取上一个日期的负责人
          const prevTask = idx > 0 ? newTasks[idx - 1] : null;
          newTasks.push({
            date: dateStr,
            content: '',
            standard: '',
            responsiblePerson: prevTask?.responsiblePerson || '',
            resultDescription: '',
            supervisor: prevTask?.supervisor || '',
          });
        }
      }
      setClassPlans(prev =>
        prev.map(plan => {
          if (plan.id !== editingProjectClassId) return plan;
          const newDefinitions = plan.projectDefinitions.map((project, pIdx) => {
            if (pIdx !== editingProjectIndex) return project;
            return {
              ...project,
              startDate: start.format('YYYY-MM-DD'),
              endDate: end.format('YYYY-MM-DD'),
              tasks: newTasks,
            };
          });
          return { ...plan, projectDefinitions: newDefinitions };
        }),
      );
      message.success('项目日期范围已更新');
      setEditProjectDateVisible(false);
      setEditingProjectIndex(null);
      setEditingProjectClassId(null);
      projectDateForm.resetFields();
    } catch (err) {
      console.error('更新日期范围失败', err);
    }
  };

  const handleSaveProjectPlan = async () => {
    if (!activeClassPlan) {
      message.warning('请先选择班级');
      return;
    }
    setPlanSaving(true);
    try {
      await saveProjectPlan({
        campus: activeClassPlan.campus,
        class_id: activeClassPlan.id,
        class_name: activeClassPlan.className,
        class_advisor: activeClassPlan.classAdvisor,
        reinforcement_instructor: activeClassPlan.reinforcementInstructor,
        projects: activeClassPlan.projectDefinitions.map(project => ({
          number: project.number,
          name: project.name,
          start_date: project.startDate,
          end_date: project.endDate,
          tasks: project.tasks.map(task => ({
            date: task.date,
            content: task.content,
            standard: task.standard,
            responsiblePerson: task.responsiblePerson,
            resultDescription: task.resultDescription,
            supervisor: task.supervisor,
          })),
        })),
      });
      message.success('项目计划已保存');
    } catch (error) {
      console.error(error);
      message.error('保存项目计划失败');
    } finally {
      setPlanSaving(false);
    }
  };

  const handleSaveClassInfo = async () => {
    try {
      const values = await classInfoForm.validateFields();
      const targetId = editingClassId || activeClassId;
      setClassPlans(prev => prev.map(p => p.id === targetId ? { ...p, classAdvisor: values.classAdvisor, reinforcementInstructor: values.reinforcementInstructor } : p));
      message.success('班级信息已更新');
      setEditClassInfoVisible(false);
      setEditingClassId(null);
    } catch {
      // ignore
    }
  };

  // 解析粘贴的表格数据
  const parsePastedData = (text: string): ProjectDefinition[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('粘贴的数据至少需要包含表头和数据行');
    }

    console.log('[粘贴导入] 原始数据行数:', lines.length);
    console.log('[粘贴导入] 前3行数据:', lines.slice(0, 3));

    // 解析每一行（支持制表符和多个空格分隔）
    const rows = lines.map((line, lineIndex) => {
      if (!line.trim()) return [];
      // 先尝试制表符分隔，如果没有则用多个空格分隔
      let cells: string[];
      if (line.includes('\t')) {
        cells = line.split('\t').map(cell => cell.trim());
      } else {
        // 尝试用多个空格分隔
        cells = line.split(/\s{2,}/).map(cell => cell.trim());
        // 如果分割后只有一个元素，尝试用单个空格分隔（但只分割前几列）
        if (cells.length === 1 && line.includes(' ')) {
          // 对于中文表格，可能需要更智能的分割
          // 先尝试按常见列数分割（8列）
          const parts = line.split(/\s+/);
          if (parts.length >= 4) {
            cells = parts;
          }
        }
      }
      if (lineIndex < 3) {
        console.log(`[粘贴导入] 第${lineIndex + 1}行解析结果:`, cells);
      }
      return cells;
    });

    // 查找表头行（包含"项目序号"、"项目名称"等关键词）
    let headerRow = -1;
    const headerMap: Record<string, number> = {};
    
    // 先尝试识别表头（扫描前10行）
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const row = rows[i] || [];
      if (row.length === 0) continue;
      
      let headerCount = 0;
      const tempHeaderMap: Record<string, number> = {};
      
      row.forEach((cell: string, index: number) => {
        const cellStr = String(cell || '').trim().toLowerCase();
        if (!cellStr) return;
        
        // 项目序号识别（更宽松）
        if (cellStr.includes('项目序号') || cellStr.includes('序号') || 
            cellStr === '序号' || cellStr === '项目序号') {
          if (!tempHeaderMap['projectNumber']) {
            tempHeaderMap['projectNumber'] = index;
            headerCount++;
          }
        }
        // 项目名称识别（更宽松）
        else if (cellStr.includes('项目名称') || cellStr.includes('名称') || 
                 cellStr === '名称' || cellStr === '项目名称' ||
                 (cellStr.includes('项目') && cellStr.includes('名称'))) {
          if (!tempHeaderMap['projectName']) {
            tempHeaderMap['projectName'] = index;
            headerCount++;
          }
        }
        // 日期识别
        else if (cellStr.includes('日期') && !cellStr.includes('开始') && !cellStr.includes('结束')) {
          if (!tempHeaderMap['date']) {
            tempHeaderMap['date'] = index;
            headerCount++;
          }
        }
        // 具体制作内容识别
        else if (cellStr.includes('具体制作内容') || cellStr.includes('制作内容') || 
                 cellStr.includes('内容') || cellStr === '内容') {
          if (!tempHeaderMap['content']) {
            tempHeaderMap['content'] = index;
            headerCount++;
          }
        }
        // 具体制作标准识别
        else if (cellStr.includes('具体制作标准') || cellStr.includes('制作标准') || 
                 cellStr.includes('标准') || cellStr === '标准') {
          if (!tempHeaderMap['standard']) {
            tempHeaderMap['standard'] = index;
            headerCount++;
          }
        }
        // 负责人识别
        else if (cellStr.includes('负责人') || cellStr === '负责人') {
          if (!tempHeaderMap['responsiblePerson']) {
            tempHeaderMap['responsiblePerson'] = index;
            headerCount++;
          }
        }
        // 结果描述识别
        else if (cellStr.includes('结果描述') || cellStr.includes('结果') || 
                 cellStr === '结果' || cellStr === '结果描述') {
          if (!tempHeaderMap['resultDescription']) {
            tempHeaderMap['resultDescription'] = index;
            headerCount++;
          }
        }
        // 监督人识别
        else if (cellStr.includes('监督人') || cellStr === '监督人') {
          if (!tempHeaderMap['supervisor']) {
            tempHeaderMap['supervisor'] = index;
            headerCount++;
          }
        }
      });

      // 如果找到了项目序号和项目名称，且至少找到3个字段，认为是表头
      if (tempHeaderMap['projectNumber'] !== undefined && 
          tempHeaderMap['projectName'] !== undefined && 
          headerCount >= 2) {
        headerRow = i;
        Object.assign(headerMap, tempHeaderMap);
        console.log('[粘贴导入] 识别到表头行:', i, '列映射:', headerMap);
        break;
      }
    }

    // 如果还是没找到，尝试更宽松的匹配（只要找到项目序号或项目名称之一）
    if (headerRow === -1) {
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        const row = rows[i] || [];
        if (row.length === 0) continue;
        
        const tempHeaderMap: Record<string, number> = {};
        let foundProjectNumber = false;
        let foundProjectName = false;
        
        row.forEach((cell: string, index: number) => {
          const cellStr = String(cell || '').trim().toLowerCase();
          if (!cellStr) return;
          
          if (cellStr.includes('项目序号') || cellStr.includes('序号') || cellStr === '序号') {
            tempHeaderMap['projectNumber'] = index;
            foundProjectNumber = true;
          } else if (cellStr.includes('项目名称') || (cellStr.includes('项目') && cellStr.includes('名称')) || cellStr === '名称') {
            tempHeaderMap['projectName'] = index;
            foundProjectName = true;
          } else if (cellStr.includes('日期') && !cellStr.includes('开始') && !cellStr.includes('结束')) {
            tempHeaderMap['date'] = index;
          } else if (cellStr.includes('内容')) {
            tempHeaderMap['content'] = index;
          } else if (cellStr.includes('标准')) {
            tempHeaderMap['standard'] = index;
          } else if (cellStr.includes('负责人')) {
            tempHeaderMap['responsiblePerson'] = index;
          } else if (cellStr.includes('结果')) {
            tempHeaderMap['resultDescription'] = index;
          } else if (cellStr.includes('监督人')) {
            tempHeaderMap['supervisor'] = index;
          }
        });

        if (foundProjectNumber || foundProjectName) {
          headerRow = i;
          Object.assign(headerMap, tempHeaderMap);
          console.log('[粘贴导入] 宽松匹配识别到表头行:', i, '列映射:', headerMap);
          break;
        }
      }
    }

    // 如果仍然没找到，尝试按列位置推断（如果前几行数据看起来像表头）
    if (headerRow === -1) {
      // 检查第一行是否可能是表头（包含中文关键词）
      const firstRow = rows[0] || [];
      const hasChineseKeywords = firstRow.some(cell => {
        const str = String(cell || '').trim();
        return str.includes('项目') || str.includes('日期') || str.includes('内容') || 
               str.includes('标准') || str.includes('负责人') || str.includes('结果') || 
               str.includes('监督');
      });
      
      if (hasChineseKeywords && firstRow.length >= 4) {
        // 假设第一行是表头，按位置推断列
        headerRow = 0;
        // 尝试按常见顺序推断：项目序号、项目名称、日期、内容、标准、负责人、结果、监督人
        for (let i = 0; i < firstRow.length; i++) {
          const cell = String(firstRow[i] || '').trim().toLowerCase();
          if (cell.includes('序号') || cell.includes('项目序号')) {
            headerMap['projectNumber'] = i;
          } else if (cell.includes('项目名称') || (cell.includes('项目') && cell.includes('名称'))) {
            headerMap['projectName'] = i;
          } else if (cell.includes('日期') && !cell.includes('开始') && !cell.includes('结束')) {
            headerMap['date'] = i;
          } else if (cell.includes('内容')) {
            headerMap['content'] = i;
          } else if (cell.includes('标准')) {
            headerMap['standard'] = i;
          } else if (cell.includes('负责人')) {
            headerMap['responsiblePerson'] = i;
          } else if (cell.includes('结果')) {
            headerMap['resultDescription'] = i;
          } else if (cell.includes('监督')) {
            headerMap['supervisor'] = i;
          }
        }
        console.log('[粘贴导入] 按位置推断表头，列映射:', headerMap);
      }
    }

    // 如果仍然没找到，抛出详细错误
    if (headerRow === -1 || (!headerMap['projectNumber'] && !headerMap['projectName'])) {
      console.error('[粘贴导入] 表头识别失败');
      console.error('[粘贴导入] 前5行数据:', rows.slice(0, 5));
      console.error('[粘贴导入] 识别的列映射:', headerMap);
      
      // 提供更友好的错误信息
      const firstRowStr = rows[0]?.join(' | ') || '空行';
      throw new Error(
        `无法识别表头，请确保包含"项目序号"和"项目名称"列。\n` +
        `第一行数据：${firstRowStr}\n` +
        `请检查：\n` +
        `1. 是否包含表头行（项目序号、项目名称等）\n` +
        `2. 数据是否使用制表符（Tab）或空格分隔\n` +
        `3. 列名是否完全匹配`
      );
    }

    // 确保至少有一个项目序号或项目名称的映射
    if (!headerMap['projectNumber'] && !headerMap['projectName']) {
      throw new Error('无法识别"项目序号"或"项目名称"列，请检查表头');
    }

    // 解析数据行（处理合并单元格：空值继承上一行的值）
    const projects: ProjectDefinition[] = [];
    let currentProject: ProjectDefinition | null = null;
    let currentProjectNumber = '';
    let currentProjectName = '';
    let lastResponsiblePerson = '';
    let lastSupervisor = '';

    for (let i = headerRow + 1; i < rows.length; i++) {
      const row = rows[i] || [];
      if (row.length === 0 || row.every(cell => !cell)) continue;

      // 获取各字段值（空值则继承上一行的值）
      let projectNumber = String(row[headerMap['projectNumber']] || '').trim();
      let projectName = String(row[headerMap['projectName']] || '').trim();
      const date = String(row[headerMap['date']] || '').trim();
      const content = String(row[headerMap['content']] || '').trim();
      const standard = String(row[headerMap['standard']] || '').trim();
      let responsiblePerson = String(row[headerMap['responsiblePerson']] || '').trim();
      const resultDescription = String(row[headerMap['resultDescription']] || '').trim();
      let supervisor = String(row[headerMap['supervisor']] || '').trim();

      // 处理合并单元格：如果字段为空，使用上一行的值
      if (!projectNumber && currentProjectNumber) {
        projectNumber = currentProjectNumber;
      }
      if (!projectName && currentProjectName) {
        projectName = currentProjectName;
      }
      if (!responsiblePerson && lastResponsiblePerson) {
        responsiblePerson = lastResponsiblePerson;
      }
      if (!supervisor && lastSupervisor) {
        supervisor = lastSupervisor;
      }

      // 如果项目序号或项目名称发生变化，开始新项目
      if (projectNumber && projectNumber !== currentProjectNumber) {
        // 保存上一个项目
        if (currentProject && currentProject.tasks.length > 0) {
          projects.push(currentProject);
        }
        
        // 开始新项目
        currentProjectNumber = projectNumber;
        currentProjectName = projectName || currentProjectName;
        currentProject = {
          number: projectNumber,
          name: currentProjectName,
          tasks: [],
        };
        // 重置负责人和监督人（新项目）
        lastResponsiblePerson = '';
        lastSupervisor = '';
      } else if (projectName && projectName !== currentProjectName && currentProject) {
        // 如果只有项目名称变化（项目序号可能为空，因为跨行合并）
        currentProject.name = projectName;
        currentProjectName = projectName;
      } else if (!currentProject) {
        // 如果还没有当前项目，创建新项目
        currentProjectNumber = projectNumber || `项目${projects.length + 1}`;
        currentProjectName = projectName || `项目${projects.length + 1}`;
        currentProject = {
          number: currentProjectNumber,
          name: currentProjectName,
          tasks: [],
        };
      }

      // 更新负责人和监督人（用于下一行继承）
      if (responsiblePerson) {
        lastResponsiblePerson = responsiblePerson;
      }
      if (supervisor) {
        lastSupervisor = supervisor;
      }

      // 如果有日期，添加任务
      if (date && currentProject) {
        // 解析日期（支持"10月8日"、"2024-10-08"等格式）
        let parsedDate = '';
        try {
          if (date.includes('月') && date.includes('日')) {
            // 格式：10月8日 -> 需要补充年份
            const match = date.match(/(\d+)月(\d+)日/);
            if (match) {
              const month = parseInt(match[1]);
              const day = parseInt(match[2]);
              const currentYear = dayjs().year();
              parsedDate = dayjs(`${currentYear}-${month}-${day}`).format('YYYY-MM-DD');
            }
          } else {
            // 尝试标准日期格式
            parsedDate = dayjs(date).format('YYYY-MM-DD');
          }
        } catch (e) {
          console.warn('日期解析失败:', date, e);
        }

        if (parsedDate || date) {
          currentProject.tasks.push({
            date: parsedDate || date,
            content: content || undefined,
            standard: standard || undefined,
            responsiblePerson: responsiblePerson || undefined,
            resultDescription: resultDescription || undefined,
            supervisor: supervisor || undefined,
          });
        }
      }
    }

    // 保存最后一个项目
    if (currentProject && currentProject.tasks.length > 0) {
      projects.push(currentProject);
    }

    // 计算每个项目的开始和结束日期
    projects.forEach(project => {
      if (project.tasks.length > 0) {
        const dates = project.tasks
          .map(t => t.date)
          .filter(Boolean)
          .sort();
        if (dates.length > 0) {
          project.startDate = dates[0];
          project.endDate = dates[dates.length - 1];
        }
      }
    });

    return projects;
  };

  // 处理粘贴导入
  const handlePasteImport = async () => {
    if (!activeClassPlan) {
      message.warning('请先选择班级');
      return;
    }

    if (!pasteText.trim()) {
      message.warning('请先粘贴表格数据');
      return;
    }

    setPasteLoading(true);
    try {
      const parsedProjects = parsePastedData(pasteText);
      
      if (parsedProjects.length === 0) {
        message.warning('未能解析出有效的项目数据');
        return;
      }

      // 合并到现有项目列表（追加）
      const updatedPlan = {
        ...activeClassPlan,
        projectDefinitions: [...activeClassPlan.projectDefinitions, ...parsedProjects],
      };

      // 更新前端状态
      setClassPlans(prev =>
        prev.map(plan =>
          plan.id === activeClassPlan.id ? updatedPlan : plan,
        ),
      );

      // 自动保存到后端
      try {
        await saveProjectPlan({
          campus: updatedPlan.campus,
          class_id: updatedPlan.id,
          class_name: updatedPlan.className,
          class_advisor: updatedPlan.classAdvisor,
          reinforcement_instructor: updatedPlan.reinforcementInstructor,
          projects: updatedPlan.projectDefinitions.map(project => ({
            number: project.number,
            name: project.name,
            start_date: project.startDate,
            end_date: project.endDate,
            tasks: project.tasks.map(task => ({
              date: task.date,
              content: task.content,
              standard: task.standard,
              responsiblePerson: task.responsiblePerson,
              resultDescription: task.resultDescription,
              supervisor: task.supervisor,
            })),
          })),
        });
        
        message.success(`成功导入并保存 ${parsedProjects.length} 个项目，共 ${parsedProjects.reduce((sum, p) => sum + p.tasks.length, 0)} 个任务`);
        setPasteModalVisible(false);
        setPasteText('');
      } catch (saveError: any) {
        console.error('保存到后端失败:', saveError);
        message.warning(`数据已导入到前端，但保存到后端失败：${saveError.message || '未知错误'}`);
        // 即使保存失败，也关闭模态框，让用户手动保存
        setPasteModalVisible(false);
        setPasteText('');
      }
    } catch (error: any) {
      console.error('解析粘贴数据失败:', error);
      message.error(error.message || '解析粘贴数据失败，请检查数据格式');
    } finally {
      setPasteLoading(false);
    }
  };

  const classListColumns: ColumnsType<(ClassProjectPlanEntry & { key: string; projectCount: number; totalTasks: number })> =
    useMemo(
      () => [
        { title: '神殿', dataIndex: 'campus', key: 'campus', width: 140 },
        { title: '班级', dataIndex: 'className', key: 'className', width: 160 },
        { title: '负责人', dataIndex: 'instructor', key: 'instructor', width: 120 },
        { title: '班主任', dataIndex: 'classAdvisor', key: 'classAdvisor', width: 120 },
        { title: '强化教员', dataIndex: 'reinforcementInstructor', key: 'reinforcementInstructor', width: 120 },
        {
          title: '项目数量',
          dataIndex: 'projectCount',
          key: 'projectCount',
          width: 120,
          render: value => `${value} 个`,
        },
        {
          title: '任务明细数量',
          dataIndex: 'totalTasks',
          key: 'totalTasks',
          width: 140,
          render: value => `${value} 条`,
        },
        {
          title: '操作',
          key: 'actions',
          width: 200,
          render: (_, record) => (
            <Space>
              <Button type="link" onClick={() => handleSwitchClass(record.id)}>
                查看计划
              </Button>
              <Button type="link" onClick={() => handleOpenEditClassInfo(record.id)}>
                编辑班级信息
              </Button>
            </Space>
          ),
        },
      ],
      [handleSwitchClass, handleOpenEditClassInfo],
    );

  const classListData = useMemo(
    () =>
      filteredClassPlans.map(plan => ({
        ...plan,
        key: plan.id,
        projectCount: plan.projectDefinitions.length,
        totalTasks: plan.projectDefinitions.reduce((sum, project) => sum + project.tasks.length, 0),
      })),
    [filteredClassPlans],
  );

  const tabs = useMemo(
    () => [
      {
        key: 'project-plan',
        label: '项目计划表',
        children: renderLazy(
          <ClassProjectPlan
            title={activeClassPlan ? `${activeClassPlan.campus}${activeClassPlan.className}项目计划表` : undefined}
            projectDefinitions={activeProjectDefinitions}
            onEditTask={handleRequestEditTask}
            onDeleteProject={handleDeleteProject}
            onDeleteTask={handleDeleteTask}
            onEditProjectDate={handleOpenEditProjectDate}
          />,
        ),
      },
      {
        key: 'class-list',
        label: '班级列表',
        children: (
          <Card style={{ marginTop: 16 }}>
            <Table
              bordered
              columns={classListColumns}
              dataSource={classListData}
              pagination={false}
              rowKey="key"
            />
          </Card>
        ),
      },
    ],
    [activeProjectDefinitions, activeClassPlan, classListColumns, classListData],
  );

  return (
    <ConfigProvider locale={zhCN}>
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={3} style={{ marginBottom: 8 }}>
          智慧司项目计划表
        </Title>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={7}>
            <div style={{ marginBottom: 8 }}>班级名称</div>
            <Select
              placeholder="请选择班级"
              value={activeClassId || undefined}
              options={filteredClassPlans.map(p => ({
                label: `${p.className}`,
                value: p.id,
              }))}
              onChange={handleSwitchClass}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Col>
          <Col xs={24} md={10}>
            <div style={{ marginBottom: 8 }}>班主任</div>
            <HomeroomTeacherSelect
              campusName={currentCampus || undefined}
              value={activeClassPlan?.classAdvisor || undefined}
              onChange={value => handleInlineUpdate('classAdvisor', value)}
              placeholder="选择班主任"
            />
          </Col>
          <Col xs={24} md={7}>
            <div style={{ marginBottom: 8 }}>强化教员</div>
            <Select
              placeholder="选择强化教员"
              allowClear
              value={activeClassPlan?.reinforcementInstructor || undefined}
              options={teacherOptions}
              onChange={value => handleInlineUpdate('reinforcementInstructor', value)}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
            />
          </Col>
        </Row>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button type="primary" onClick={() => setCreateModalVisible(true)}>
            新建项目
          </Button>
          <Button 
            type="default" 
            icon={<CopyOutlined />}
            onClick={() => setPasteModalVisible(true)}
          >
            从剪切板导入
          </Button>
          <Button type="primary" ghost loading={planSaving || planLoading} onClick={handleSaveProjectPlan}>
            保存项目计划
          </Button>
        </div>
        <Spin spinning={planLoading}>
          <Tabs
            destroyInactiveTabPane
            items={tabs}
            activeKey={activeTabKey}
            onChange={setActiveTabKey}
          />
        </Spin>
      </Card>
      <Modal
        title="新建项目"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        onOk={handleCreateProject}
        destroyOnClose
      >
        <Form layout="vertical" form={form}>
          <Form.Item label="项目名称" name="projectName" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="如：时尚手表产品动画" />
          </Form.Item>
          <Form.Item label="负责人" name="owner" rules={[{ required: true, message: '请输入负责人' }]}>
            <Input placeholder="如：张博" />
          </Form.Item>
          <Form.Item
            label="计划周期"
            name="dateRange"
            rules={[{ required: true, message: '请选择开始和结束日期' }]}
          >
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              format="YYYY年MM月DD日"
              placeholder={['开始日期', '结束日期']}
            />
          </Form.Item>
          <Form.Item label="项目简介" name="description">
            <Input.TextArea rows={3} placeholder="简单描述项目目标或重点任务" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="编辑项目内容"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
          setEditingTaskRef(null);
        }}
        onOk={handleUpdateTask}
        destroyOnClose
      >
        <Form layout="vertical" form={editForm}>
          <Form.Item label="日期" name="date" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} format="MM月DD日" placeholder="请选择日期" />
          </Form.Item>
          <Form.Item label="具体制作内容" name="content">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="具体制作标准" name="standard">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="负责人" name="responsiblePerson">
            <AutoComplete
              options={teacherOptions}
              placeholder="输入或选择负责人"
              filterOption={(input, option) =>
                (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item label="结果描述" name="resultDescription">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="监督人" name="supervisor">
            <AutoComplete
              options={teacherOptions}
              placeholder="输入或选择监督人"
              filterOption={(input, option) =>
                (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="编辑项目日期范围"
        open={editProjectDateVisible}
        onCancel={() => {
          setEditProjectDateVisible(false);
          projectDateForm.resetFields();
          setEditingProjectIndex(null);
          setEditingProjectClassId(null);
        }}
        onOk={handleUpdateProjectDate}
        destroyOnClose
      >
        <Form layout="vertical" form={projectDateForm}>
          <Form.Item
            label="日期范围"
            name="dateRange"
            rules={[{ required: true, message: '请选择开始和结束日期' }]}
          >
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              format="YYYY年MM月DD日"
              placeholder={['开始日期', '结束日期']}
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="编辑班级信息"
        open={editClassInfoVisible}
        onCancel={() => {
          setEditClassInfoVisible(false);
          classInfoForm.resetFields();
          setEditingClassId(null);
        }}
        onOk={handleSaveClassInfo}
        destroyOnClose
      >
        <Form layout="vertical" form={classInfoForm}>
          <Form.Item label="班主任" name="classAdvisor" rules={[{ required: true, message: '请选择班主任' }]}>
            <HomeroomTeacherSelect
              campusName={currentCampus || undefined}
              placeholder="请选择班主任"
            />
          </Form.Item>
          <Form.Item label="强化教员姓名" name="reinforcementInstructor">
            <Input placeholder="如：姜东亮" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="从剪切板导入项目计划"
        open={pasteModalVisible}
        onCancel={() => {
          setPasteModalVisible(false);
          setPasteText('');
        }}
        onOk={handlePasteImport}
        destroyOnClose
        width={800}
        okText="导入"
        cancelText="取消"
        confirmLoading={pasteLoading}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            从Excel或其他表格中复制数据，然后粘贴到下方文本框。支持制表符分隔或空格分隔的数据。
          </Text>
          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
            表格应包含以下列：项目序号、项目名称、日期、具体制作内容、具体制作标准、负责人、结果描述、监督人
          </Text>
        </div>
        <Input.TextArea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="请粘贴表格数据（从Excel中复制后直接粘贴）&#10;例如：&#10;项目序号	项目名称	日期	具体制作内容	具体制作标准	负责人	结果描述	监督人&#10;项目1	小型企业网络搭建	10月8日	网规表, 设备选型	网规表, 设备选型规范化	李建峰	网规表,设备选型规完成	闫梦雷"
          rows={12}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
      </Modal>
    </div>
  </ConfigProvider>
  );
};

export default CampusProjectPlanPage;
