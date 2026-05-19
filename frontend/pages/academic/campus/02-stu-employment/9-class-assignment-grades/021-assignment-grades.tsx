//班作业成绩表

import React, { useState, useEffect, useMemo } from 'react';
import { useCampusStore } from '@/stores/campusStore';
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
  Drawer
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
  SettingOutlined,
  EyeOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  UsergroupAddOutlined,
  CopyOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { classAssignmentGradeService } from '@/services/service';
import { useConfigOptions } from '@/hooks/useConfigOptions';
import { buildApiUrl, apiFetch } from '@/utils/apiBase';

const stripCampus = (s?: string) => (s ? s.replace(/神殿$/, '') : '');

const { Option } = Select;
const { TextArea } = Input;

// 粘贴导入解析的数据结构
interface ParsedAssignmentData {
  assignments: AssignmentInfo[];
  students: {
    studentId: string;
    studentName: string;
    assignmentGrades: { [key: number]: number | null };
    quizGrades: { [key: number]: number | null };
  }[];
  metadata: {
    courseName?: string;
    teacherName?: string;
    className?: string;
  };
}

// 学员作业成绩数据类型
interface StudentAssignmentGrade {
  id: string;
  studentId: string;
  studentName: string;
  assignmentGrades: { [assignmentNumber: number]: number | null | undefined };
  quizGrades: { [assignmentNumber: number]: number | null | undefined };
  dailyGrade: number | null | undefined;
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

// 作业信息类型
interface AssignmentInfo {
  number: number;
  date: string;
  name: string;
  isSubmitted: boolean;
}

// 表单数据类型
interface GradeFormData {
  studentId: string;
  studentName: string;
  assignmentNumber: number;
  assignmentGrade: number;
  quizGrade: number;
  dailyGrade: number;
  campus: string;
  majorName: string;
  classCode: string;
  courseName: string;
  instructor: string;
  year: number;
  month: number;
}

const AssignmentGradesPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const { classes: classOptions, courses: courseOptions, teachers: teacherOptions, majors: majorOptions } = useConfigOptions({ campusName: currentCampus || '' });
  const [dataSource, setDataSource] = useState<StudentAssignmentGrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StudentAssignmentGrade | null>(null);
  const [form] = Form.useForm<GradeFormData>();
  const [searchText, setSearchText] = useState('');
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(dayjs('2024-07-01'));
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedClassCode, setSelectedClassCode] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string>('');
  const [majorName, setMajorName] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [manualExpectedSubmit, setManualExpectedSubmit] = useState<number | null>(null); // 手动设置的应提交数量

  // 粘贴导入相关状态
  const [pasteModalVisible, setPasteModalVisible] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteLoading, setPasteLoading] = useState(false);
  const [parsedPasteData, setParsedPasteData] = useState<ParsedAssignmentData | null>(null);
  const [pasteError, setPasteError] = useState('');

  // 教员姓名（可编辑，按神殿+班级持久化）
  const INSTRUCTOR_LS_KEY = 'assignment_grades_instructor_map';
  const [instructorName, setInstructorName] = useState<string>('杜鹏涛');
  const loadInstructor = () => {
    try {
      const raw = localStorage.getItem(INSTRUCTOR_LS_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      const key = `${currentCampus || ''}__${selectedClassCode}`;
      return map[key] || '杜鹏涛';
    } catch {
      return '杜鹏涛';
    }
  };
  const saveInstructor = (name: string) => {
    try {
      const raw = localStorage.getItem(INSTRUCTOR_LS_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      const key = `${currentCampus || ''}__${selectedClassCode}`;
      map[key] = name;
      localStorage.setItem(INSTRUCTOR_LS_KEY, JSON.stringify(map));
    } catch {}
  };
  useEffect(() => {
    setInstructorName(loadInstructor());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, selectedClassCode]);

  const normalizedCampus = useMemo(() => stripCampus(currentCampus), [currentCampus]);

  // 默认选中当前神殿的第一个班级
  useEffect(() => {
    if (!selectedClassCode && classOptions.length > 0) {
      setSelectedClassCode(classOptions[0].value);
    }
  }, [classOptions, selectedClassCode]);

  // 作业列表（初始为空，支持手动添加或通过日期生成）
  const [assignments, setAssignments] = useState<AssignmentInfo[]>([]);

  // 保存空数据到后端（用于清空记录）- 必须在 handleSave 之前定义
  const handleSaveEmptyData = async () => {
    try {
      setLoading(true);

      // 先查询后端现有记录，获取正确的 majorName 和 courseName
      // 这样可以确保能正确定位并更新现有记录
      let existingMajorName = majorName?.trim() || '';
      let existingCourseName = courseName?.trim() || '';
      let existingTeacherName = instructorName?.trim() || '';
      
      try {
        // 查询该班级的所有记录（不限制专业和课程）
        const existingRecords = await classAssignmentGradeService.getList({
          campus: currentCampus,
          className: selectedClassCode,
        });
        
        if (existingRecords && existingRecords.length > 0) {
          // 使用最新记录的字段值
          const latestRecord = existingRecords[0];
          existingMajorName = latestRecord.majorName || existingMajorName;
          existingCourseName = latestRecord.courseName || existingCourseName;
          existingTeacherName = latestRecord.teacherName || existingTeacherName;
          console.log('[保存空数据] 找到现有记录，使用其字段值:', {
            majorName: existingMajorName,
            courseName: existingCourseName,
            teacherName: existingTeacherName,
          });
        }
      } catch (queryError) {
        console.warn('[保存空数据] 查询现有记录失败，使用当前值:', queryError);
      }

      // 如果仍然没有必填字段值，使用默认值（避免后端验证失败）
      const finalMajorName = existingMajorName || '未指定';
      const finalCourseName = existingCourseName || '未指定';
      const finalTeacherName = existingTeacherName || '未指定';

      const payload = {
        campusName: currentCampus?.trim(),
        majorName: finalMajorName,
        className: selectedClassCode?.trim(),
        courseName: finalCourseName,
        teacherName: finalTeacherName,
        classSize: 0,
        assignmentCount: 0,
        expectedSubmit: 0,
        actualSubmit: 0,
        unsubmittedCount: 0,
        passCount: 0,
        submitRate: 0,
        passRate: 0,
        startDate: dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : undefined,
        endDate: dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : undefined,
        records: {
          assignments: [],
          students: [],
        },
      };

      console.log('[保存空数据] 准备发送数据到后端:', payload);
      const result = await classAssignmentGradeService.create(payload as any);
      console.log('[保存空数据] API调用成功，返回结果:', result);
      message.success('已清空后端数据');
    } catch (error: any) {
      console.error('[保存空数据] 保存失败:', error);
      const errorMessage = error?.response?.data?.detail ||
                          error?.response?.data?.message ||
                          error?.message ||
                          '保存失败，请检查网络连接或联系管理员';
      message.error(`保存失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // 将当前表格数据保存到后端
  const handleSave = async () => {
    console.log('[保存] 开始保存数据...');
    console.log('[保存] dataSource长度:', dataSource.length);
    console.log('[保存] assignments长度:', assignments.length);
    console.log('[保存] selectedClassCode:', selectedClassCode);
    console.log('[保存] currentCampus:', currentCampus);
    console.log('[保存] majorName:', majorName);
    console.log('[保存] courseName:', courseName);
    console.log('[保存] instructorName:', instructorName);

    try {
      // 基础必填字段验证（神殿和班级是定位数据的关键字段）
      if (!currentCampus || !currentCampus.trim()) {
        message.error('神殿名称不能为空');
        return;
      }
      if (!selectedClassCode || !selectedClassCode.trim()) {
        message.error('班级名称不能为空');
        return;
      }

      // 如果没有学员数据，直接调用清空逻辑（不再弹确认框，简化流程）
      if (dataSource.length === 0) {
        console.log('[保存] 没有学员数据，执行清空逻辑');
        await handleSaveEmptyData();
        return;
      }

      // 有数据时，需要完整验证所有必填字段
      if (!majorName || !majorName.trim()) {
        message.error('专业名称不能为空');
        return;
      }
      if (!courseName || !courseName.trim()) {
        message.error('课程名称不能为空');
        return;
      }
      if (!instructorName || !instructorName.trim()) {
        message.error('教员姓名不能为空');
        return;
      }

      if (assignments.length === 0) {
        message.warning('请先添加作业数据');
        return;
      }

      setLoading(true);
      console.log('[保存] 设置loading为true');
      
      // 只保存当前班级的学员数据（按 classCode 过滤）
      const currentClassData = dataSource.filter(item => item.classCode === selectedClassCode);
      console.log('[保存] 当前班级学员数:', currentClassData.length);
      
      if (currentClassData.length === 0) {
        message.warning('当前班级没有学员数据');
        setLoading(false);
        return;
      }
      
      // 格式化学生数据，确保所有字段类型正确
      // -1 表示未提交：计入应提交数量，但不计入实际提交和合格
      const students = currentClassData.map((item) => {
        const assignmentsArr = assignments.map((cfg) => {
          const assignmentScore = item.assignmentGrades?.[cfg.number];
          const quizScore = item.quizGrades?.[cfg.number];
          const hasAssignmentScore = assignmentScore !== undefined && assignmentScore !== null;
          const hasQuizScore = quizScore !== undefined && quizScore !== null;
          const isNotSubmitted = hasAssignmentScore && assignmentScore === -1;
          return {
            number: cfg.number,
            assignment_score: hasAssignmentScore ? Number(assignmentScore) : null,
            quiz_score: hasQuizScore ? Number(quizScore) : null,
            // -1 表示明确未提交，不算已提交；null/undefined 表示未填写
            submitted: hasAssignmentScore && !isNotSubmitted,
          };
        });
        return {
          student_id: item.studentId || '',
          student_name: item.studentName || '',
          assignments: assignmentsArr,
          daily_score: item.dailyGrade !== undefined && item.dailyGrade !== null 
            ? Number(item.dailyGrade) 
            : null,
        };
      });

      // 计算已填写的记录数（包括未提交-1和正常分数，但不包括null/undefined）
      // 这是"应提交"的基数
      const filledCount = students.reduce((acc, stu) => {
        return acc + (stu.assignments?.filter((a) => a.assignment_score !== null).length || 0);
      }, 0);
      
      // 实际提交数：只计算分数 >= 0 的（排除 -1 未提交）
      const actualSubmit = students.reduce((acc, stu) => {
        return acc + (stu.assignments?.filter((a) => 
          a.assignment_score !== null && 
          a.assignment_score !== undefined && 
          Number(a.assignment_score) >= 0
        ).length || 0);
      }, 0);
      
      // 合格数：只计算分数 >= 6 的
      const passCount = students.reduce((acc, stu) => {
        const passed = stu.assignments?.filter((a) => 
          a.assignment_score !== null && 
          a.assignment_score !== undefined && 
          Number(a.assignment_score) >= 6
        ).length || 0;
        return acc + passed;
      }, 0);
      
      const assignmentCount = assignments.length;
      const classSize = students.length;
      // 使用手动设置的应提交数量，如果没有设置则使用已填写的记录数
      const expected = manualExpectedSubmit !== null ? manualExpectedSubmit : filledCount;

      // 格式化 assignments 数据，确保符合后端要求（允许字段为空）
      const formattedAssignments = assignments.map(assignment => {
        const result: { number: number; date?: string; name?: string } = {
          number: Number(assignment.number) || 0,
        };
        // 只有当 date 有值时才添加
        if (assignment.date && assignment.date.trim()) {
          result.date = assignment.date.trim();
        }
        // 只有当 name 有值时才添加
        if (assignment.name && assignment.name.trim()) {
          result.name = assignment.name.trim();
        }
        return result;
      });

      // 确保所有整数字段都是整数（符合 int4 类型）
      const classSizeInt = Math.floor(Number(classSize)) || 0;
      const assignmentCountInt = Math.floor(Number(assignmentCount)) || 0;
      const expectedSubmitInt = Math.floor(Number(expected)) || 0;
      const actualSubmitInt = Math.floor(Number(actualSubmit)) || 0;
      const unsubmittedCountInt = expectedSubmitInt - actualSubmitInt;
      const passCountInt = Math.floor(Number(passCount)) || 0;

      // 计算比率，确保符合 numeric(6, 2) 类型（最多6位数字，2位小数，最大值 9999.99）
      let submitRateValue = 0;
      let passRateValue = 0;
      // 提交率 = 实际提交 / 应提交
      if (expectedSubmitInt > 0) {
        submitRateValue = Math.min(
          Math.round((actualSubmitInt / expectedSubmitInt) * 10000) / 100,
          9999.99
        );
      }
      // 合格率 = 合格数 / 实际提交（只计算已提交作业中的合格比例）
      if (actualSubmitInt > 0) {
        passRateValue = Math.min(
          Math.round((passCountInt / actualSubmitInt) * 10000) / 100,
          9999.99
        );
      }

      const payload = {
        campusName: currentCampus.trim(),
        majorName: majorName.trim(),
        className: selectedClassCode.trim(),
        courseName: courseName.trim(),
        teacherName: instructorName.trim(),
        classSize: classSizeInt,
        assignmentCount: assignmentCountInt,
        expectedSubmit: expectedSubmitInt,
        actualSubmit: actualSubmitInt,
        unsubmittedCount: unsubmittedCountInt,
        passCount: passCountInt,
        submitRate: parseFloat(submitRateValue.toFixed(2)), // 确保是 float 类型
        passRate: parseFloat(passRateValue.toFixed(2)), // 确保是 float 类型
        startDate: dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : undefined,
        endDate: dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : undefined,
        records: {
          assignments: formattedAssignments,
          students,
        },
      };

      console.log('[保存] 准备发送数据到后端...');
      console.log('[保存] 数据载荷:', JSON.stringify(payload, null, 2));
      console.log('[保存] 调用 classAssignmentGradeService.create...');
      
      try {
        const result = await classAssignmentGradeService.create(payload as any);
        console.log('[保存] API调用成功，返回结果:', result);
        message.success('已保存到后端');
      } catch (apiError: any) {
        console.error('[保存] API调用失败:', apiError);
        console.error('[保存] 错误详情:', {
          message: apiError?.message,
          response: apiError?.response,
          status: apiError?.response?.status,
          data: apiError?.response?.data,
        });
        throw apiError; // 重新抛出，让外层catch处理
      }
    } catch (error: any) {
      console.error('[保存] 保存失败:', error);
      console.error('[保存] 错误堆栈:', error?.stack);
      // 显示更详细的错误信息
      const errorMessage = error?.response?.data?.detail || 
                          error?.response?.data?.message || 
                          error?.message || 
                          '保存失败，请检查网络连接或联系管理员';
      message.error(`保存失败: ${errorMessage}`);
    } finally {
      console.log('[保存] 设置loading为false');
      setLoading(false);
    }
  };

  // 从后端加载数据
  const loadDataFromBackend = async () => {
    try {
      setLoading(true);
      // 切换班级时先清空旧数据
      setDataSource([]);
      setAssignments([]);
      setManualExpectedSubmit(null);
      
      const data = await classAssignmentGradeService.getList({
        campus: currentCampus,
        major: majorName,
        className: selectedClassCode,
        course: courseName,
      });

      if (data && data.length > 0) {
        // 使用最新的记录（按 id 降序排列，取第一个）
        const latestRecord = data[0];
        const records = latestRecord.records || {};

        // 恢复 assignments 数据
        if (records.assignments && Array.isArray(records.assignments)) {
          const restoredAssignments = records.assignments.map((a: any) => ({
            number: a.number || 0,
            date: a.date || '',
            name: a.name || '',
            isSubmitted: false,
          }));
          setAssignments(restoredAssignments);
        }

        // 恢复 students 数据
        if (records.students && Array.isArray(records.students)) {
          const restoredStudents: StudentAssignmentGrade[] = records.students.map((s: any) => {
            const assignmentGrades: { [key: number]: number | null } = {};
            const quizGrades: { [key: number]: number | null } = {};

            if (s.assignments && Array.isArray(s.assignments)) {
              s.assignments.forEach((a: any) => {
                if (a.number !== undefined && a.number !== null) {
                  if (a.assignment_score !== null && a.assignment_score !== undefined) {
                    assignmentGrades[a.number] = Number(a.assignment_score);
                  }
                  if (a.quiz_score !== null && a.quiz_score !== undefined) {
                    quizGrades[a.number] = Number(a.quiz_score);
                  }
                }
              });
            }

            return {
              id: Date.now().toString() + Math.random(), // 生成临时 ID
              studentId: s.student_id || '',
              studentName: s.student_name || '',
              assignmentGrades,
              quizGrades,
              dailyGrade: s.daily_score !== null && s.daily_score !== undefined ? Number(s.daily_score) : null,
              campus: latestRecord.campusName || currentCampus || '',
              majorName: latestRecord.majorName || majorName,
              classCode: latestRecord.className || selectedClassCode,
              courseName: latestRecord.courseName || courseName,
              instructor: latestRecord.teacherName || instructorName,
              year: dayjs(latestRecord.startDate || new Date()).year(),
              month: dayjs(latestRecord.startDate || new Date()).month() + 1,
              createdAt: latestRecord.createdAt,
              updatedAt: latestRecord.updatedAt,
            };
          });
          setDataSource(restoredStudents);
        }

        // 恢复日期范围
        if (latestRecord.startDate && latestRecord.endDate) {
          setDateRange([dayjs(latestRecord.startDate), dayjs(latestRecord.endDate)]);
        }

        // 恢复手动设置的应提交数量（如果有）
        if (latestRecord.expectedSubmit !== undefined) {
          const autoExpected = latestRecord.classSize * latestRecord.assignmentCount;
          if (latestRecord.expectedSubmit !== autoExpected) {
            setManualExpectedSubmit(latestRecord.expectedSubmit);
          }
        }
      }
      // 如果没有数据，dataSource 已在开头被清空，无需额外处理
    } catch (error) {
      console.error('加载数据失败:', error);
      // 如果加载失败，保持空数组
      setDataSource([]);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据：从后端加载或从空数组开始
  useEffect(() => {
    loadDataFromBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, selectedClassCode, majorName, courseName]);

  // 删除单个作业
  const handleDeleteAssignment = (assignmentNumber: number) => {
    // 从作业列表中移除
    setAssignments(prev => prev.filter(a => a.number !== assignmentNumber));
    // 清除所有学员的该作业成绩数据
    setDataSource(prev => prev.map(student => ({
      ...student,
      assignmentGrades: Object.fromEntries(
        Object.entries(student.assignmentGrades).filter(([key]) => Number(key) !== assignmentNumber)
      ),
      quizGrades: Object.fromEntries(
        Object.entries(student.quizGrades).filter(([key]) => Number(key) !== assignmentNumber)
      ),
    })));
    message.success(`作业${assignmentNumber}已删除`);
  };

  // 生成表格列
  const generateColumns = () => {
    const columns: any[] = [
      {
        title: '学号',
        dataIndex: 'studentId',
        key: 'studentId',
        width: 75,
        fixed: 'left' as const,
        render: (_: any, record: StudentAssignmentGrade) => {
          const studentId = record?.studentId;
          return (
            <Tag color="blue">{studentId || '-'}</Tag>
          );
        },
      },
      {
        title: '学员姓名',
        dataIndex: 'studentName',
        key: 'studentName',
        width: 90,
        fixed: 'left' as const,
        render: (_: any, record: StudentAssignmentGrade) => {
          const studentName = record?.studentName;
          return (
            <Button
              type="link"
              onClick={() => handleEditStudent(record)}
              style={{ padding: 0, height: 'auto' }}
            >
              {studentName || '-'}
            </Button>
          );
        },
    },
  ];

    // 添加作业成绩列
    assignments.forEach(assignment => {
      columns.push({
        title: (
          <div 
            style={{ 
              textAlign: 'center', 
              padding: '4px 2px', 
              position: 'relative',
            }}
            className="assignment-card-header"
          >
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>作业{assignment.number}</div>
            <Input
              size="small"
              value={assignment.name}
              onChange={(e) => handleAssignmentNameChange(assignment.number, e.target.value)}
              placeholder="名称"
              allowClear
              style={{ width: '60px', borderWidth: 0, backgroundColor: 'transparent', textAlign: 'center', fontSize: '11px', padding: '2px', marginBottom: '3px', height: '22px' }}
            />
            <DatePicker
              size="small"
              value={assignment.date ? dayjs(assignment.date) : null}
              onChange={(date) => handleAssignmentDateChange(assignment.number, date)}
              format="MM-DD"
              allowClear={true}
              placeholder="日期"
              style={{ width: '72px' }}
              popupStyle={{ zIndex: 1050 }}
            />
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleDeleteAssignment(assignment.number);
              }}
              className="assignment-delete-btn"
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                opacity: 0,
                transition: 'opacity 0.2s',
                padding: '2px 4px',
                height: 'auto',
                fontSize: '12px',
                zIndex: 10,
                pointerEvents: 'auto',
              }}
              title="删除此作业"
            />
          </div>
        ),
        key: `assignment_${assignment.number}`,
        width: 140,
        children: [
          {
            title: <div style={{ fontSize: '11px' }}>作业</div>,
            dataIndex: `assignment_${assignment.number}`,
            key: `assignment_${assignment.number}`,
            width: 70,
            render: (_, record: StudentAssignmentGrade) => {
              const grade = record.assignmentGrades[assignment.number];
              const hasValue = grade !== null && grade !== undefined;
              const isNotSubmitted = hasValue && grade === -1;
              return (
                <InputNumber
                  size="small"
                  min={-1}
                  max={10}
                  step={0.1}
                  precision={1}
                  value={hasValue ? grade : null}
                  onChange={(value) => {
                    if (value === null || value === undefined) {
                      handleGradeChange(record.id, 'assignment', assignment.number, null);
                    } else {
                      handleGradeChange(record.id, 'assignment', assignment.number, value);
                    }
                  }}
                  placeholder="未填写"
                  style={{ 
                    width: '100%', 
                    color: isNotSubmitted ? '#faad14' : (hasValue && grade !== null && grade !== -1 && grade < 6 ? 'red' : 'inherit')
                  }}
                  status={hasValue && grade !== null && grade !== -1 && grade < 6 ? 'error' : undefined}
                />
              );
            },
          },
          {
            title: <div style={{ fontSize: '11px' }}>小测</div>,
            dataIndex: `quiz_${assignment.number}`,
            key: `quiz_${assignment.number}`,
            width: 70,
            render: (_, record: StudentAssignmentGrade) => {
              const grade = record.quizGrades[assignment.number];
              const hasValue = grade !== null && grade !== undefined;
              const isNotSubmitted = hasValue && grade === -1;
              return (
                <InputNumber
                  size="small"
                  min={-1}
                  max={10}
                  step={0.1}
                  precision={1}
                  value={hasValue ? grade : null}
                  onChange={(value) => {
                    if (value === null || value === undefined) {
                      handleGradeChange(record.id, 'quiz', assignment.number, null);
                    } else {
                      handleGradeChange(record.id, 'quiz', assignment.number, value);
                    }
                  }}
                  placeholder="未填写"
                  style={{ 
                    width: '100%', 
                    color: isNotSubmitted ? '#faad14' : (hasValue && grade !== null && grade !== -1 && grade < 6 ? 'red' : 'inherit')
                  }}
                  status={hasValue && grade !== null && grade !== -1 && grade < 6 ? 'error' : undefined}
                />
              );
            },
          },
        ],
      });
    });

    // 添加平时成绩列
    columns.push({
      title: '平时成绩',
      dataIndex: 'dailyGrade',
      key: 'dailyGrade',
      width: 70,
      render: (dailyGrade: number | null | undefined, record: StudentAssignmentGrade) => {
        const grade = record.dailyGrade;
        const hasValue = grade !== null && grade !== undefined;
        return (
          <InputNumber
            size="small"
            min={0}
            max={20}
            step={0.1}
            precision={1}
            value={hasValue ? grade : null}
            onChange={(value) => handleGradeChange(record.id, 'daily', 0, value ?? null)}
            status={hasValue && grade !== null && grade < 6 ? 'error' : undefined}
            style={{ width: '100%', color: hasValue && grade !== null && grade < 6 ? 'red' : 'inherit' }}
            placeholder="未填写"
          />
        );
      },
    });

    // 添加操作列（删除学员）
    columns.push({
      title: '操作',
      key: 'action',
      width: 60,
      fixed: 'right' as const,
      render: (_: any, record: StudentAssignmentGrade) => (
        <Popconfirm
          title="删除学员"
          description={
            <div>
              <p>确定要删除学员 <strong>{record.studentName}</strong>（学号：{record.studentId}）吗？</p>
              <p style={{ color: '#ff4d4f', fontSize: '12px' }}>该学员的所有成绩数据将被一并删除！</p>
            </div>
          }
          onConfirm={() => handleDelete(record.id)}
          okText="确定删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            title={`删除学员 ${record.studentName} 及其所有成绩`}
          />
        </Popconfirm>
      ),
    });

    return columns;
  };

  // 处理表头日期变化（允许清空）
  const handleAssignmentDateChange = (assignmentNumber: number, date: dayjs.Dayjs | null) => {
    setAssignments(prev =>
      prev.map(assignment =>
        assignment.number === assignmentNumber
          ? { ...assignment, date: date ? date.format('YYYY-MM-DD') : '' }
          : assignment
      )
    );
  };

  // 处理作业名称变化
  const handleAssignmentNameChange = (assignmentNumber: number, name: string) => {
    setAssignments(prev =>
      prev.map(assignment =>
        assignment.number === assignmentNumber ? { ...assignment, name } : assignment
      )
    );
  };

  // 处理成绩变化
  const handleGradeChange = (studentId: string, type: 'assignment' | 'quiz' | 'daily', assignmentNumber: number, value: number | null) => {
    setDataSource(prev => prev.map(student => {
      if (student.id === studentId) {
        const updatedStudent = { ...student };
        if (type === 'assignment') {
          const newAssignmentGrades = { ...updatedStudent.assignmentGrades };
          if (value === null || value === undefined) {
            // 删除该字段，表示未填写
            delete newAssignmentGrades[assignmentNumber];
          } else {
            newAssignmentGrades[assignmentNumber] = Number(value);
          }
          updatedStudent.assignmentGrades = newAssignmentGrades;
        } else if (type === 'quiz') {
          const newQuizGrades = { ...updatedStudent.quizGrades };
          if (value === null || value === undefined) {
            // 删除该字段，表示未填写
            delete newQuizGrades[assignmentNumber];
          } else {
            newQuizGrades[assignmentNumber] = Number(value);
          }
          updatedStudent.quizGrades = newQuizGrades;
        } else if (type === 'daily') {
          updatedStudent.dailyGrade = (value === null || value === undefined) ? null : Number(value);
        }
        updatedStudent.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
        return updatedStudent;
      }
      return student;
    }));
  };

  // 处理编辑学员
  const handleEditStudent = (record: StudentAssignmentGrade) => {
    setEditingStudentId(record.id);
    setDrawerVisible(true);
  };

  // 处理添加学员
  const handleAddStudent = () => {
    setEditingRecord(null);
    setModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (record: StudentAssignmentGrade) => {
    setEditingRecord(record);
    setModalVisible(true);
  };

  // 处理删除
  const handleDelete = (id: string) => {
    setDataSource(prev => prev.filter(item => item.id !== id));
    message.success('删除成功');
  };

  // 处理保存（新增/编辑学员弹窗）
  const handleSaveStudent = async () => {
    try {
      const values = await form.validateFields();
      const formData = {
        studentId: values.studentId?.trim() || '',
        studentName: values.studentName?.trim() || '',
        classCode: values.classCode || selectedClassCode,
        courseName: values.courseName || courseName || '',
        campus: currentCampus || '',
        majorName: majorName,
        instructor: instructorName,
        year: dayjs().year(),
        month: dayjs().month() + 1,
      };

      if (editingRecord) {
        // 编辑
        setDataSource(prev => prev.map(item => 
          item.id === editingRecord.id 
            ? { 
                ...item, 
                ...formData, 
                updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
              }
            : item
        ));
        message.success('更新成功');
      } else {
        // 新增
        const newRecord: StudentAssignmentGrade = {
          id: Date.now().toString(),
          studentId: formData.studentId,
          studentName: formData.studentName,
          assignmentGrades: {},
          quizGrades: {},
          dailyGrade: null, // 初始化为 null，表示未填写
          campus: formData.campus,
          majorName: formData.majorName,
          classCode: formData.classCode,
          courseName: formData.courseName,
          instructor: formData.instructor,
          year: formData.year,
          month: formData.month,
          createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
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

  // 处理日期变化
  const handleDateChange = (date: dayjs.Dayjs | null) => {
    setSelectedDate(date);
  };

  // 处理添加新作业（允许字段为空）
  const handleAddAssignment = () => {
    setAssignments(prev => {
      const newAssignmentNumber = prev.length > 0 ? Math.max(...prev.map(a => a.number)) + 1 : 1;
      return [
        ...prev,
        {
          number: newAssignmentNumber,
          date: '', // 允许为空，用户可手动填写
          name: '', // 允许为空，用户可手动填写
          isSubmitted: false,
        },
      ];
    });
    message.success('已添加一列新作业');
  };

  // 通过起止日期生成作业内容表单（排除周末）
  const handleGenerateAssignmentsByDateRange = () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning('请先选择起止日期');
      return;
    }

    const startDate = dateRange[0];
    const endDate = dateRange[1];
    
    if (startDate.isAfter(endDate)) {
      message.error('开始日期不能晚于结束日期');
      return;
    }

    const newAssignments: AssignmentInfo[] = [];
    let currentDate = startDate;
    let assignmentNumber = assignments.length > 0 ? Math.max(...assignments.map(a => a.number)) + 1 : 1;

    // 遍历日期范围，包含周末
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      // 包含所有日期（周一到周日）
      newAssignments.push({
        number: assignmentNumber++,
        date: currentDate.format('YYYY-MM-DD'), // 自动填充日期，但允许后续修改或清空
        name: '', // 允许为空，用户可手动填写
        isSubmitted: false,
      });
      currentDate = currentDate.add(1, 'day');
    }

    if (newAssignments.length === 0) {
      message.warning('所选日期范围无效');
      return;
    }

    setAssignments(prev => [...prev, ...newAssignments]);
    message.success(`已根据日期范围生成 ${newAssignments.length} 个作业项`);
  };

  // 解析粘贴的作业成绩数据
  const parsePastedAssignmentData = (text: string): ParsedAssignmentData => {
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

    console.log('[作业成绩导入] 原始行数:', rows.length);
    console.log('[作业成绩导入] 前5行:', rows.slice(0, 5));

    // 解析元数据（前几行可能包含课程名称、教员姓名等信息）
    const metadata: ParsedAssignmentData['metadata'] = {};
    let dataStartRow = 0;

    // 查找元数据行
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const row = rows[i];
      const rowText = row.join(' ').toLowerCase();
      
      // 检查是否是元数据行
      if (rowText.includes('课程名称')) {
        const idx = row.findIndex(c => c.toLowerCase().includes('课程名称'));
        if (idx >= 0 && row[idx + 1]) {
          metadata.courseName = row[idx + 1].trim();
        }
      }
      if (rowText.includes('教员姓名')) {
        const idx = row.findIndex(c => c.toLowerCase().includes('教员姓名'));
        if (idx >= 0 && row[idx + 1]) {
          metadata.teacherName = row[idx + 1].trim();
        }
      }
      if (rowText.includes('班级名称') || rowText.includes('班级名称')) {
        const idx = row.findIndex(c => c.toLowerCase().includes('班级'));
        if (idx >= 0 && row[idx + 1]) {
          metadata.className = row[idx + 1].trim();
        }
      }
    }

    // 查找日期行（包含多个日期格式的行）
    let dateRowIdx = -1;
    let assignmentNumberRowIdx = -1;
    let assignmentNameRowIdx = -1;
    let headerRowIdx = -1;

    for (let i = 0; i < Math.min(15, rows.length); i++) {
      const row = rows[i];
      const rowText = row.join(' ');
      
      // 日期行：包含多个日期格式（如 2024/10/13 或 2024-10-13）
      const dateMatches = rowText.match(/\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/g);
      if (dateMatches && dateMatches.length >= 2) {
        dateRowIdx = i;
        continue;
      }

      // 作业序号行：包含连续数字（如 10, 11, 12...）或"作业序号"
      if (rowText.includes('作业序号') || (row.filter(c => /^\d+$/.test(c)).length >= 3)) {
        assignmentNumberRowIdx = i;
        continue;
      }

      // 作业名称行：包含"作业名称"或特定课程名（如 HDFS, MFS等）
      if (rowText.includes('作业名称') || 
          row.some(c => /^[A-Za-z]{2,}/.test(c) && !['作业', '小测'].includes(c))) {
        assignmentNameRowIdx = i;
        continue;
      }

      // 表头行：包含"学号"、"学员姓名"或"学员姓名"
      if (rowText.includes('学员姓名') || rowText.includes('学号') || 
          (rowText.includes('作业') && rowText.includes('小测'))) {
        headerRowIdx = i;
        break;
      }
    }

    console.log('[作业成绩导入] 日期行:', dateRowIdx, '序号行:', assignmentNumberRowIdx, 
                '名称行:', assignmentNameRowIdx, '表头行:', headerRowIdx);

    // 确定数据起始行
    dataStartRow = Math.max(dateRowIdx, assignmentNumberRowIdx, assignmentNameRowIdx, headerRowIdx) + 1;
    if (dataStartRow <= 0 || dataStartRow >= rows.length) {
      // 如果没找到明确的表头，尝试找到第一个包含学员姓名的行
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        // 检查是否有学号列（数字）和姓名列（中文）
        if (row.length >= 2 && /^\d+$/.test(row[0]) && /[\u4e00-\u9fa5]/.test(row[1])) {
          dataStartRow = i;
          break;
        }
      }
    }

    // 解析作业列结构
    // 通常结构是：序号 | 学员姓名 | [作业1-作业 | 作业1-小测] | [作业2-作业 | 作业2-小测] | ...
    const assignmentInfos: AssignmentInfo[] = [];
    
    // 从日期行和序号行解析作业信息
    const dateRow = dateRowIdx >= 0 ? rows[dateRowIdx] : [];
    const numberRow = assignmentNumberRowIdx >= 0 ? rows[assignmentNumberRowIdx] : [];
    const nameRow = assignmentNameRowIdx >= 0 ? rows[assignmentNameRowIdx] : [];
    const headerRow = headerRowIdx >= 0 ? rows[headerRowIdx] : [];

    // 找出每个作业对应的列范围
    // 通常每个作业占2列（作业+小测）
    let assignmentColStart = 2; // 默认从第3列开始（前2列是学号和姓名）
    
    // 从表头行找到"作业"和"小测"的位置
    const columnMapping: { assignmentNumber: number; date: string; name: string; assignmentCol: number; quizCol: number }[] = [];
    
    // 解析列结构
    if (headerRow.length > 0) {
      // 方式1：从表头行的"作业"/"小测"标记推断
      for (let col = 0; col < headerRow.length; col++) {
        const cell = headerRow[col].toLowerCase();
        if (cell === '作业' || cell.includes('作业')) {
          // 找到对应的序号
          let assignmentNum = 0;
          let assignmentDate = '';
          let assignmentName = '';
          
          // 从序号行获取
          if (numberRow[col]) {
            const num = parseInt(numberRow[col]);
            if (!isNaN(num)) assignmentNum = num;
          }
          
          // 从日期行获取
          if (dateRow[col]) {
            const dateMatch = dateRow[col].match(/\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/);
            if (dateMatch) {
              assignmentDate = dateMatch[0].replace(/\//g, '-');
            }
          }
          
          // 从名称行获取
          if (nameRow[col]) {
            assignmentName = nameRow[col];
          }
          
          // 找到对应的小测列（通常是下一列）
          let quizCol = col + 1;
          if (quizCol < headerRow.length && headerRow[quizCol].toLowerCase().includes('小测')) {
            // 确认是同一个作业的小测
          } else {
            quizCol = -1; // 没有小测列
          }
          
          if (assignmentNum === 0) {
            assignmentNum = columnMapping.length + 1;
          }
          
          columnMapping.push({
            assignmentNumber: assignmentNum,
            date: assignmentDate,
            name: assignmentName,
            assignmentCol: col,
            quizCol: quizCol,
          });
        }
      }
    }

    // 如果没有从表头解析到，尝试从日期行或序号行推断
    if (columnMapping.length === 0) {
      // 假设每2列是一个作业（作业+小测）
      const sampleRow = rows[dataStartRow] || [];
      const numCols = Math.max(sampleRow.length, headerRow.length, dateRow.length);
      
      for (let i = 0; i < numCols - 2; i += 2) {
        const col = i + 2; // 跳过前2列（学号、姓名）
        if (col >= numCols) break;
        
        let assignmentNum = (i / 2) + 1;
        let assignmentDate = '';
        let assignmentName = '';
        
        if (numberRow[col]) {
          const num = parseInt(numberRow[col]);
          if (!isNaN(num)) assignmentNum = num;
        }
        
        if (dateRow[col]) {
          const dateMatch = String(dateRow[col]).match(/\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/);
          if (dateMatch) {
            assignmentDate = dateMatch[0].replace(/\//g, '-');
          }
        }
        
        if (nameRow[col]) {
          assignmentName = String(nameRow[col]).trim();
        }
        
        columnMapping.push({
          assignmentNumber: assignmentNum,
          date: assignmentDate,
          name: assignmentName,
          assignmentCol: col,
          quizCol: col + 1 < numCols ? col + 1 : -1,
        });
      }
    }

    console.log('[作业成绩导入] 列映射:', columnMapping);

    // 先扫描每个作业列是否有任何有效值（用于判断整列是否参与统计）
    const assignmentColHasValue = new Map<number, boolean>();
    const quizColHasValue = new Map<number, boolean>();

    for (let rowIdx = dataStartRow; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      if (!row || row.length < 2) continue;

      const firstCell = String(row[0] || '').trim();
      if (!firstCell || firstCell.includes('合计') || firstCell.includes('统计') || firstCell.includes('平均')) {
        continue;
      }

      columnMapping.forEach(mapping => {
        // 检查作业列
        if (mapping.assignmentCol >= 0 && mapping.assignmentCol < row.length) {
          const gradeStr = String(row[mapping.assignmentCol] || '').trim();
          if (gradeStr !== '' && gradeStr !== '-') {
            const grade = parseFloat(gradeStr);
            if (!isNaN(grade)) {
              assignmentColHasValue.set(mapping.assignmentNumber, true);
            }
          }
        }
        // 检查小测列
        if (mapping.quizCol >= 0 && mapping.quizCol < row.length) {
          const gradeStr = String(row[mapping.quizCol] || '').trim();
          if (gradeStr !== '' && gradeStr !== '-') {
            const grade = parseFloat(gradeStr);
            if (!isNaN(grade)) {
              quizColHasValue.set(mapping.assignmentNumber, true);
            }
          }
        }
      });
    }

    console.log('[作业成绩导入] 有值的作业列:', Array.from(assignmentColHasValue.keys()));
    console.log('[作业成绩导入] 有值的小测列:', Array.from(quizColHasValue.keys()));

    // 生成作业信息
    columnMapping.forEach(mapping => {
      assignmentInfos.push({
        number: mapping.assignmentNumber,
        date: mapping.date,
        name: mapping.name,
        isSubmitted: false,
      });
    });

    // 解析学员数据
    const students: ParsedAssignmentData['students'] = [];

    for (let rowIdx = dataStartRow; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      if (!row || row.length < 2) continue;

      // 跳过空行或汇总行
      const firstCell = String(row[0] || '').trim();
      if (!firstCell || firstCell === '' ||
          firstCell.includes('合计') || firstCell.includes('统计') ||
          firstCell.includes('平均')) {
        continue;
      }

      // 解析学号和姓名
      let studentId = '';
      let studentName = '';

      // 尝试解析学号（通常是数字）
      if (/^\d+$/.test(firstCell)) {
        studentId = firstCell;
        studentName = String(row[1] || '').trim();
      } else if (/[\u4e00-\u9fa5]/.test(firstCell)) {
        // 第一列是姓名
        studentName = firstCell;
        studentId = `${rowIdx}`;
      } else {
        continue; // 跳过无法解析的行
      }

      if (!studentName) continue;

      // 解析成绩
      const assignmentGrades: { [key: number]: number | null } = {};
      const quizGrades: { [key: number]: number | null } = {};

      columnMapping.forEach(mapping => {
        // 作业成绩 - 只有当该列有任何有效值时，空单元格才标记为未提交(-1)
        if (mapping.assignmentCol >= 0 && mapping.assignmentCol < row.length) {
          const gradeStr = String(row[mapping.assignmentCol] || '').trim();
          const colHasAnyValue = assignmentColHasValue.get(mapping.assignmentNumber);

          if (gradeStr === '' || gradeStr === '-') {
            // 如果该列有其他有效值，则空单元格标记为未提交
            if (colHasAnyValue) {
              assignmentGrades[mapping.assignmentNumber] = -1;
            }
            // 如果整列都没有值，则跳过（不设置值）
          } else {
            const grade = parseFloat(gradeStr);
            if (!isNaN(grade)) {
              assignmentGrades[mapping.assignmentNumber] = grade;
            } else if (colHasAnyValue) {
              // 无法解析且该列有其他有效值，标记为未提交
              assignmentGrades[mapping.assignmentNumber] = -1;
            }
          }
        }

        // 小测成绩 - 空单元格跳过（不参与作业提交率统计）
        if (mapping.quizCol >= 0 && mapping.quizCol < row.length) {
          const gradeStr = String(row[mapping.quizCol] || '').trim();
          if (gradeStr !== '' && gradeStr !== '-') {
            const grade = parseFloat(gradeStr);
            if (!isNaN(grade)) {
              quizGrades[mapping.assignmentNumber] = grade;
            }
          }
          // 空单元格不设置值，保持未填写状态
        }
      });

      students.push({
        studentId,
        studentName,
        assignmentGrades,
        quizGrades,
      });
    }

    console.log('[作业成绩导入] 解析完成，作业数:', assignmentInfos.length, '学员数:', students.length);

    if (students.length === 0) {
      throw new Error('未能解析出学员数据，请检查数据格式');
    }

    return {
      assignments: assignmentInfos,
      students,
      metadata,
    };
  };

  // 处理粘贴文本变化
  const handlePasteTextChange = (text: string) => {
    setPasteText(text);
    setPasteError('');
    setParsedPasteData(null);

    if (!text.trim()) return;

    try {
      const parsed = parsePastedAssignmentData(text);
      setParsedPasteData(parsed);
      if (parsed.students.length === 0) {
        setPasteError('未能解析出有效的学员数据');
      }
    } catch (error: any) {
      console.error('[作业成绩导入] 解析错误:', error);
      setPasteError(error.message || '解析失败');
    }
  };

  // 执行粘贴导入
  const handlePasteImport = async () => {
    if (!parsedPasteData || parsedPasteData.students.length === 0) {
      message.warning('没有可导入的数据');
      return;
    }

    setPasteLoading(true);

    try {
      // 更新元数据（如果有）
      if (parsedPasteData.metadata.courseName && !courseName) {
        setCourseName(parsedPasteData.metadata.courseName);
      }
      if (parsedPasteData.metadata.teacherName && !instructorName) {
        setInstructorName(parsedPasteData.metadata.teacherName);
        saveInstructor(parsedPasteData.metadata.teacherName);
      }

      // 合并作业列表
      const existingNumbers = new Set(assignments.map(a => a.number));
      const newAssignments = parsedPasteData.assignments.filter(a => !existingNumbers.has(a.number));
      if (newAssignments.length > 0) {
        setAssignments(prev => [...prev, ...newAssignments].sort((a, b) => a.number - b.number));
      }

      // 自动解析起止日期：从所有作业的日期中提取最早和最晚的日期
      const allAssignmentDates: string[] = [];
      
      // 收集导入的作业日期
      parsedPasteData.assignments.forEach(a => {
        if (a.date && a.date.trim()) {
          allAssignmentDates.push(a.date.trim());
        }
      });
      
      // 收集已有作业的日期
      assignments.forEach(a => {
        if (a.date && a.date.trim()) {
          allAssignmentDates.push(a.date.trim());
        }
      });
      
      // 合并后的作业列表（包含新导入的）
      const mergedAssignments = [...assignments, ...newAssignments].sort((a, b) => a.number - b.number);
      mergedAssignments.forEach(a => {
        if (a.date && a.date.trim()) {
          allAssignmentDates.push(a.date.trim());
        }
      });
      
      // 解析日期并找到最早和最晚的日期
      if (allAssignmentDates.length > 0) {
        const validDates = allAssignmentDates
          .map(dateStr => {
            // 尝试多种日期格式
            const date1 = dayjs(dateStr, 'YYYY-MM-DD');
            const date2 = dayjs(dateStr, 'YYYY/MM/DD');
            const date3 = dayjs(dateStr);
            
            if (date1.isValid()) return date1;
            if (date2.isValid()) return date2;
            if (date3.isValid()) return date3;
            return null;
          })
          .filter((d): d is dayjs.Dayjs => d !== null);
        
        if (validDates.length > 0) {
          // 找到最早和最晚的日期
          const sortedDates = validDates.sort((a, b) => {
            if (a.isBefore(b)) return -1;
            if (a.isAfter(b)) return 1;
            return 0;
          });
          
          const startDate = sortedDates[0];
          const endDate = sortedDates[sortedDates.length - 1];
          
          // 设置日期范围
          setDateRange([startDate, endDate]);
          
          console.log('[作业成绩导入] 自动解析起止日期:', {
            最早日期: startDate.format('YYYY-MM-DD'),
            最晚日期: endDate.format('YYYY-MM-DD'),
            有效日期数: validDates.length,
          });
        }
      }

      // 合并学员数据
      const existingStudentNames = new Set(dataSource.map(s => s.studentName));
      const newStudents: StudentAssignmentGrade[] = [];
      const updatedStudents = new Map<string, StudentAssignmentGrade>();

      // 先处理已有学员的更新
      dataSource.forEach(existing => {
        const match = parsedPasteData.students.find(s => 
          s.studentName === existing.studentName || s.studentId === existing.studentId
        );
        if (match) {
          updatedStudents.set(existing.id, {
            ...existing,
            assignmentGrades: { ...existing.assignmentGrades, ...match.assignmentGrades },
            quizGrades: { ...existing.quizGrades, ...match.quizGrades },
            updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          });
        }
      });

      // 处理新学员
      parsedPasteData.students.forEach((student, idx) => {
        if (!existingStudentNames.has(student.studentName)) {
          newStudents.push({
            id: `${Date.now()}-${idx}`,
            studentId: student.studentId,
            studentName: student.studentName,
            assignmentGrades: student.assignmentGrades,
            quizGrades: student.quizGrades,
            dailyGrade: null,
            campus: currentCampus || '',
            majorName: majorName,
            classCode: selectedClassCode,
            courseName: courseName || parsedPasteData.metadata.courseName || '',
            instructor: instructorName || parsedPasteData.metadata.teacherName || '',
            year: dayjs().year(),
            month: dayjs().month() + 1,
            createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          });
        }
      });

      // 更新数据源
      setDataSource(prev => {
        const updated = prev.map(s => updatedStudents.get(s.id) || s);
        return [...updated, ...newStudents];
      });

      const updateCount = updatedStudents.size;
      const newCount = newStudents.length;
      const assignmentCount = newAssignments.length;
      
      // 构建成功消息
      let successMsg = `导入成功！新增学员 ${newCount} 人，更新 ${updateCount} 人`;
      if (assignmentCount > 0) {
        successMsg += `，新增作业 ${assignmentCount} 列`;
      }
      
      // 如果有解析到日期范围，添加到消息中
      if (allAssignmentDates.length > 0) {
        const validDates = allAssignmentDates
          .map(dateStr => {
            const date1 = dayjs(dateStr, 'YYYY-MM-DD');
            const date2 = dayjs(dateStr, 'YYYY/MM/DD');
            const date3 = dayjs(dateStr);
            if (date1.isValid()) return date1;
            if (date2.isValid()) return date2;
            if (date3.isValid()) return date3;
            return null;
          })
          .filter((d): d is dayjs.Dayjs => d !== null);
        
        if (validDates.length > 0) {
          const sortedDates = validDates.sort((a, b) => {
            if (a.isBefore(b)) return -1;
            if (a.isAfter(b)) return 1;
            return 0;
          });
          const startDate = sortedDates[0];
          const endDate = sortedDates[sortedDates.length - 1];
          successMsg += `，已自动解析起止日期：${startDate.format('YYYY-MM-DD')} 至 ${endDate.format('YYYY-MM-DD')}`;
        }
      }

      message.success(successMsg);

      // 自动保存到后端（包含起止日期）
      setTimeout(() => {
        handleSave();
      }, 500);

      // 关闭模态框
      setPasteModalVisible(false);
      setPasteText('');
      setParsedPasteData(null);
      setPasteError('');
    } catch (error: any) {
      console.error('[作业成绩导入] 导入失败:', error);
      message.error('导入失败: ' + (error.message || '未知错误'));
    } finally {
      setPasteLoading(false);
    }
  };

  // 从班档案表生成学员数据（排除退费明细表中的学员）
  const handleGenerateStudentsFromArchive = async () => {
    if (!currentCampus) {
      message.warning('请先选择神殿');
      return;
    }
    if (!selectedClassCode) {
      message.warning('请先选择班级');
      return;
    }

    try {
      setLoading(true);
      // 尝试从班档案表获取学员列表
      const campusName = currentCampus.replace(/神殿$/, '');
      
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
        archiveData = await tryFetchClassFile(currentCampus);
      }

      if (!archiveData || !archiveData.行列表 || archiveData.行列表.length === 0) {
        message.warning('未找到该班级的档案数据，请确认神殿和班级是否正确');
        return;
      }

      // 获取退费明细表中的学员名单（按姓名和身份证号排除）
      const refundedNames = new Set<string>();
      const refundedIds = new Set<string>();
      
      // 获取近4年所有月份的退费数据（优化：并发查询）
      const currentYear = dayjs().year();
      const yearsToCheck = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
      const tryFetchRefund = async (campusArg: string) => {
        const names = new Set<string>();
        const ids = new Set<string>();
        
        // 优化方案1：优先使用新的全年查询API（查询近4年）
        for (const year of yearsToCheck) {
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
            }
          } catch {
            // 如果全年API不可用，回退到并发查询每月数据
            const monthPromises = Array.from({ length: 12 }, (_, i) => i + 1).map(m =>
              apiFetch(buildApiUrl(`/teaching-quality/campus-refund-detail?campus=${encodeURIComponent(campusArg)}&year=${year}&month=${m}`))
                .then(res => res.ok ? res.json() : null)
                .catch(() => null)
            );
            
            const monthResults = await Promise.all(monthPromises);
            monthResults.forEach(data => {
              if (data && data.行列表) {
                (data.行列表 || []).forEach((row: any) => {
                  const name = (row.name || row.姓名 || '').trim();
                  const idCard = (row.idCard || row.身份证号 || '').trim();
                  if (name) names.add(name);
                  if (idCard) ids.add(idCard);
                });
              }
            });
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
        refundResult = await tryFetchRefund(currentCampus);
      }
      
      refundResult.names.forEach(n => refundedNames.add(n));
      refundResult.ids.forEach(id => refundedIds.add(id));

      // 从档案数据生成学员列表
      const existingIds = new Set(dataSource.map(s => s.studentId));
      const existingNames = new Set(dataSource.map(s => s.studentName));
      
      const newStudents: StudentAssignmentGrade[] = [];
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

        newStudents.push({
          id: `${Date.now()}-${idx}`,
          studentId: studentId,
          studentName: name,
          assignmentGrades: {},
          quizGrades: {},
          dailyGrade: null,
          campus: currentCampus || '',
          majorName: majorName,
          classCode: selectedClassCode,
          courseName: courseName || '',
          instructor: instructorName,
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

  // 处理学员变化
  const handleStudentChange = (studentId: string) => {
    setSelectedStudent(studentId);
  };

  // 处理班级变化
  const handleClassChange = (classCode: string) => {
    setSelectedClassCode(classCode || '');
  };

  // 过滤数据
  const filteredData = dataSource.filter(item => {
    const matchesSearch = !searchText || 
      item.studentName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.studentId.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStudent = selectedStudent === 'all' || item.id === selectedStudent;
    const matchesClass = item.classCode === selectedClassCode;
    
    return matchesSearch && matchesStudent && matchesClass;
  });

  // 统计数据（只计算筛选后的数据）
  // 应提交数量：统计已填写的作业记录数（包括未提交-1和正常分数）
  const filledCount = filteredData.reduce((total, student) => {
    return total + Object.values(student.assignmentGrades).filter(grade =>
      grade !== null && grade !== undefined
    ).length;
  }, 0);
  // 如果手动设置了就使用手动值，否则使用已填写数量
  const requiredSubmissions = manualExpectedSubmit !== null ? manualExpectedSubmit : filledCount;

  // 未提交数量：作业分数为 -1 的记录
  const notSubmittedCount = filteredData.reduce((total, student) => {
    return total + Object.values(student.assignmentGrades).filter(grade =>
      grade !== null && grade !== undefined && Number(grade) === -1
    ).length;
  }, 0);

  const statistics = {
    totalStudents: filteredData.length,
    totalAssignments: assignments.length,
    requiredSubmissions: requiredSubmissions,
    notSubmittedCount: notSubmittedCount,
    actualSubmissions: filteredData.reduce((total, student) => {
      // 只计算分数 >= 0 的作业成绩（排除 -1 未提交）
      return total + Object.values(student.assignmentGrades).filter(grade =>
        grade !== null && grade !== undefined && Number(grade) >= 0
      ).length;
    }, 0),
    qualifiedCount: filteredData.reduce((total, student) => {
      // 只计算有值且 >= 6 的作业成绩
      return total + Object.values(student.assignmentGrades).filter(grade =>
        grade !== null && grade !== undefined && Number(grade) >= 6
      ).length;
    }, 0),
    submissionRate: 0,
    qualificationRate: 0
  };

  // 计算提交率：实际提交 / 应提交（包含未提交的记录）
  statistics.submissionRate = statistics.requiredSubmissions > 0 
    ? Math.round((statistics.actualSubmissions / statistics.requiredSubmissions) * 10000) / 100 
    : 0;
  // 计算合格率：合格数 / 实际提交数（只计算已提交作业中的合格比例）
  statistics.qualificationRate = statistics.actualSubmissions > 0 
    ? Math.round((statistics.qualifiedCount / statistics.actualSubmissions) * 10000) / 100 
    : 0;

  return (
    <div style={{ padding: 24 }}>
      <style>{`
        .assignment-card-header:hover .assignment-delete-btn {
          opacity: 0.8 !important;
        }
        .assignment-delete-btn:hover {
          opacity: 1 !important;
        }
      `}</style>
      <Card>
        {/* 必填字段提示 */}
        {(!majorName || !selectedClassCode || !courseName || !instructorName) && (
          <Alert
            message="提示"
            description="请先填写上方的必填字段：专业名称、班级名称、课程名称、教员姓名，才能保存数据到后端。"
            type="warning"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 表头信息 */}
        <Row gutter={16} style={{ marginBottom: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
          <Col span={4}>
            <strong>神殿名称：</strong>{currentCampus || '-'}
          </Col>
          <Col span={4}>
            <Space>
              <strong>专业名称：</strong>
              <Select
                style={{ width: 120 }}
                value={majorName || undefined}
                options={majorOptions}
                placeholder="请选择专业"
                allowClear
                onChange={(v) => setMajorName(v || '')}
              />
            </Space>
          </Col>
          <Col span={4}>
            <Space>
              <strong>班级名称：</strong>
              <Select
                style={{ width: 160 }}
                value={selectedClassCode || undefined}
                options={classOptions}
                placeholder="请选择班级"
                allowClear
                onChange={(v) => {
                  handleClassChange(v);
                  setSelectedStudent('all');
                }}
              />
            </Space>
          </Col>
          <Col span={4}>
            <Space>
              <strong>课程名称：</strong>
              <Select
                style={{ width: 120 }}
                value={courseName || undefined}
                options={courseOptions}
                placeholder="请选择课程"
                allowClear
                onChange={(v) => setCourseName(v || '')}
              />
            </Space>
          </Col>
          <Col span={4}>
            <Space>
              <strong>教员姓名：</strong>
              <Select
                style={{ width: 120 }}
                value={instructorName || undefined}
                options={teacherOptions}
                placeholder="请选择教员"
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
                }
                onChange={(val) => {
                  setInstructorName(val || '');
                  saveInstructor(val || '');
                }}
              />
            </Space>
          </Col>
        </Row>

        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 24, padding: 16, backgroundColor: '#f0f9ff', borderRadius: 8 }}>
          <Col span={4}>
            <Statistic
              title="班级人数"
              value={statistics.totalStudents}
              suffix="人"
              prefix={<TeamOutlined />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="作业次数"
              value={statistics.totalAssignments}
              suffix="次"
              prefix={<BookOutlined />}
            />
          </Col>
          <Col span={4}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: 4 }}>
                <CalculatorOutlined /> 应提交数量
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <InputNumber
                  size="small"
                  min={0}
                  value={manualExpectedSubmit !== null ? manualExpectedSubmit : filledCount}
                  onChange={(value) => {
                    if (value === null || value === undefined) {
                      setManualExpectedSubmit(null);
                    } else {
                      setManualExpectedSubmit(Math.floor(Number(value)));
                    }
                  }}
                  placeholder="自动计算"
                  style={{ width: 120 }}
                />
                <span style={{ fontSize: '12px', color: '#999' }}>份</span>
                {manualExpectedSubmit !== null && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setManualExpectedSubmit(null)}
                    style={{ padding: 0, height: 'auto', fontSize: '12px' }}
                  >
                    恢复自动
                  </Button>
                )}
              </div>
              {manualExpectedSubmit !== null && (
                <div style={{ fontSize: '11px', color: '#999', marginTop: 2 }}>
                  自动计算值: {filledCount}
                </div>
              )}
            </div>
          </Col>
          <Col span={4}>
            <Statistic
              title="实际提交数量"
              value={statistics.actualSubmissions}
              suffix="份"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="未提交数量"
              value={statistics.notSubmittedCount}
              suffix="份"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="合格数量"
              value={statistics.qualifiedCount}
              suffix="份"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 24, padding: 16, backgroundColor: '#f6ffed', borderRadius: 8 }}>
          <Col span={6}>
            <Statistic
              title="作业提交率"
              value={statistics.submissionRate}
              suffix="%"
              prefix={<CalculatorOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="作业合格率"
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
            <span>起止日期：</span>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(val) => setDateRange(val as any)}
              placeholder={['开始日期', '结束日期']}
            />
            <Button
              type="default"
              icon={<CalendarOutlined />}
              onClick={handleGenerateAssignmentsByDateRange}
              title="根据起止日期生成作业（排除周末）"
            >
              生成作业
            </Button>
            
            <span>班级：</span>
            <Select
              value={selectedClassCode}
              onChange={handleClassChange}
              style={{ width: 120 }}
              options={classOptions}
              allowClear
              placeholder="请选择班级"
            />

            <span>学员：</span>
            <Select
              value={selectedStudent}
              onChange={handleStudentChange}
              style={{ width: 120 }}
            >
              <Option value="all">全部学员</Option>
              {dataSource.map(student => (
                <Option key={student.id} value={student.id}>
                  {student.studentName}
                </Option>
              ))}
            </Select>
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
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddStudent}
            >
              添加学员
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
            <Button
              icon={<CalendarOutlined />}
              onClick={handleAddAssignment}
            >
              增加作业
            </Button>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleSave}>
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
          scroll={{ x: 'max-content', y: undefined }}
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
          description="此表记录学员的作业成绩和小测成绩，支持实时编辑。点击学员姓名可查看详细信息，支持按日期和学员姓名筛选。"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑学员' : '添加学员'}
        open={modalVisible}
        onOk={handleSaveStudent}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={600}
        destroyOnHidden
        afterOpenChange={(open) => {
          if (open) {
            // Modal 打开后设置表单值
            if (editingRecord) {
              form.setFieldsValue({
                studentId: editingRecord.studentId,
                studentName: editingRecord.studentName,
                classCode: editingRecord.classCode,
                courseName: editingRecord.courseName,
              });
            } else {
              form.setFieldsValue({
                studentId: undefined,
                studentName: undefined,
                classCode: selectedClassCode,
                courseName: '',
              });
            }
          } else {
            // Modal 关闭后重置表单
            form.resetFields();
          }
        }}
      >
        <Form
          form={form}
          layout="vertical"
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
                  options={classOptions}
                  placeholder="请选择班级"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="courseName"
                label="课程名称"
                rules={[{ required: true, message: '请选择课程名称' }]}
              >
                <Select
                  options={courseOptions}
                  placeholder="请选择课程"
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 学员详情抽屉 */}
      <Drawer
        title="学员成绩详情"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={800}
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

                  <Divider>作业成绩详情</Divider>
                  <Row gutter={16}>
                    {assignments.map(assignment => (
                      <Col span={12} key={assignment.number} style={{ marginBottom: 16 }}>
                        <Card size="small" title={`作业${assignment.number} - ${assignment.name}`}>
                          <Row gutter={8}>
                            <Col span={12}>
                              <div>作业成绩：{
                                student.assignmentGrades[assignment.number] !== null && 
                                student.assignmentGrades[assignment.number] !== undefined
                                  ? student.assignmentGrades[assignment.number] === -1
                                    ? '未提交'
                                    : `${student.assignmentGrades[assignment.number]}分${Number(student.assignmentGrades[assignment.number]) >= 6 ? '（及格）' : '（不及格）'}`
                                  : '未填写'
                              }</div>
                            </Col>
                            <Col span={12}>
                              <div>小测成绩：{
                                student.quizGrades[assignment.number] !== null && 
                                student.quizGrades[assignment.number] !== undefined
                                  ? student.quizGrades[assignment.number] === -1
                                    ? '未提交'
                                    : `${student.quizGrades[assignment.number]}分${Number(student.quizGrades[assignment.number]) >= 6 ? '（及格）' : '（不及格）'}`
                                  : '未填写'
                              }</div>
                            </Col>
                          </Row>
                          <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                            日期：{dayjs(assignment.date).format('YYYY-MM-DD')}
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>

                  <Divider>平时成绩</Divider>
                  <Card>
                    <Statistic
                      title="平时成绩"
                      value={
                        student.dailyGrade !== null && student.dailyGrade !== undefined
                          ? student.dailyGrade === -1
                            ? '未提交'
                            : `${student.dailyGrade}${Number(student.dailyGrade) >= 6 ? '（及格）' : '（不及格）'}`
                          : '未填写'
                      }
                      suffix={student.dailyGrade !== null && student.dailyGrade !== undefined && student.dailyGrade !== -1 ? "分" : ""}
                      prefix={<BookOutlined />}
                    />
                  </Card>
                </div>
              );
            })()}
          </div>
        )}
      </Drawer>

      {/* 粘贴导入模态框 */}
      <Modal
        title="从剪切板导入作业成绩"
        open={pasteModalVisible}
        onOk={handlePasteImport}
        onCancel={() => {
          setPasteModalVisible(false);
          setPasteText('');
          setParsedPasteData(null);
          setPasteError('');
        }}
        width={1000}
        okText={`导入${parsedPasteData ? ` (${parsedPasteData.students.length} 名学员)` : ''}`}
        okButtonProps={{
          disabled: !parsedPasteData || parsedPasteData.students.length === 0,
          loading: pasteLoading,
        }}
        destroyOnClose
      >
        <Alert
          message="使用说明"
          description={
            <div>
              <p>请从 Excel 复制作业成绩表数据后粘贴到下方文本框。</p>
              <p><strong>支持的格式：</strong></p>
              <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                <li>第一行：日期行（如 2024/10/13, 2024/10/14...）</li>
                <li>第二行：作业序号行（如 1, 2, 3...）</li>
                <li>第三行：作业名称行（如 HDFS, MFS, 串讲...）</li>
                <li>第四行：表头行（学号/学员姓名 + 作业/小测列）</li>
                <li>后续行：学员数据（学号、姓名、各作业成绩）</li>
              </ul>
              <p style={{ color: '#666', fontSize: 12 }}>
                提示：每个作业通常有2列（作业成绩 + 小测成绩），系统会自动识别
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
          placeholder={`在此粘贴 Excel 数据...\n\n示例：\n日期\t\t2024/10/13\t\t2024/10/14\n作业序号\t\t1\t\t2\n作业名称\t\tHDFS\t\tMFS\n学号\t学员姓名\t作业\t小测\t作业\t小测\n1\t徐少华\t99\t95\t99\t98`}
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

        {parsedPasteData && parsedPasteData.students.length > 0 && (
          <div>
            <div style={{ marginBottom: 8 }}>
              <Space>
                <Tag color="blue">作业: {parsedPasteData.assignments.length} 列</Tag>
                <Tag color="green">学员: {parsedPasteData.students.length} 人</Tag>
                {parsedPasteData.metadata.courseName && (
                  <Tag color="purple">课程: {parsedPasteData.metadata.courseName}</Tag>
                )}
                {parsedPasteData.metadata.teacherName && (
                  <Tag color="orange">教员: {parsedPasteData.metadata.teacherName}</Tag>
                )}
              </Space>
            </div>
            
            <div style={{ fontWeight: 500, marginBottom: 8 }}>
              预览（前10名学员）
            </div>
            <Table
              dataSource={parsedPasteData.students.slice(0, 10).map((s, i) => ({ ...s, key: i }))}
              columns={[
                { title: '学号', dataIndex: 'studentId', width: 80 },
                { title: '学员姓名', dataIndex: 'studentName', width: 100 },
                ...parsedPasteData.assignments.slice(0, 5).map(a => ({
                  title: `作业${a.number}${a.name ? `(${a.name})` : ''}`,
                  key: `a${a.number}`,
                  width: 100,
                  render: (_: any, record: any) => {
                    const grade = record.assignmentGrades?.[a.number];
                    const quiz = record.quizGrades?.[a.number];
                    return (
                      <span>
                        {grade !== undefined && grade !== null ? grade : '-'}
                        {' / '}
                        {quiz !== undefined && quiz !== null ? quiz : '-'}
                      </span>
                    );
                  },
                })),
                ...(parsedPasteData.assignments.length > 5 ? [{ 
                  title: '...', 
                  key: 'more',
                  width: 50,
                  render: () => '...' 
                }] : []),
              ]}
              size="small"
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
            {parsedPasteData.students.length > 10 && (
              <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                还有 {parsedPasteData.students.length - 10} 名学员未显示...
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AssignmentGradesPage;
