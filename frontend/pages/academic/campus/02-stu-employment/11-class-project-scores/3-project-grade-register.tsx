// 学术 -> 教员 -> 某神殿某班项目成绩表（可编辑 + 持久化到后端）
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App, Card, Typography, Row, Col, Input, InputNumber, Space, Button, Divider, Table, DatePicker, Select, AutoComplete, Modal, Alert, Upload } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { UsergroupAddOutlined, PlusOutlined, MinusOutlined, UploadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { useCampusStore } from '@/stores/campusStore';
import { projectGradeRegisterService } from '@/services/service';
import type { ProjectGradeRegister } from '@/types/service';
import { useConfigOptions } from '@/hooks/useConfigOptions';
import { buildApiUrl, apiFetch } from '@/utils/apiBase';
import './project-grade-register.css';

const { Title, Text } = Typography;

type StudentRow = {
  key: string;
  studentNo: string;
  studentName: string;
  [k: string]: any; // 动态：p{n}a{1|2|3} -> { score?: number; comment?: string }
};

type ScoreCellProps = {
  value?: number;
  rowIndex: number;
  projectIndex: number;
  attempt: number;
  onChange: (rowIndex: number, projectIndex: number, attempt: number, value?: number | null) => void;
};

const ScoreCell: React.FC<ScoreCellProps> = React.memo(
  ({ value, rowIndex, projectIndex, attempt, onChange }) => {
    const handleChange = React.useCallback(
      (v: number | null) => onChange(rowIndex, projectIndex, attempt, v),
      [attempt, onChange, projectIndex, rowIndex],
    );
    const isFail = typeof value === 'number' && value < 6;

    return (
      <InputNumber
        style={{ width: '100%' }}
        min={0}
        max={10}
        value={value}
        onChange={handleChange}
        className={isFail ? 'score-fail' : undefined}
      />
    );
  },
  (prev, next) =>
    prev.value === next.value &&
    prev.rowIndex === next.rowIndex &&
    prev.projectIndex === next.projectIndex &&
    prev.attempt === next.attempt,
);

type CommentCellProps = {
  value?: string;
  rowIndex: number;
  projectIndex: number;
  attempt: number;
  onChange: (rowIndex: number, projectIndex: number, attempt: number, comment: string) => void;
};

const CommentCell: React.FC<CommentCellProps> = React.memo(
  ({ value, rowIndex, projectIndex, attempt, onChange }) => {
    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => onChange(rowIndex, projectIndex, attempt, e.target.value),
      [attempt, onChange, projectIndex, rowIndex],
    );
    return <Input placeholder="点评" value={value} onChange={handleChange} />;
  },
  (prev, next) =>
    prev.value === next.value &&
    prev.rowIndex === next.rowIndex &&
    prev.projectIndex === next.projectIndex &&
    prev.attempt === next.attempt,
);

const STUDENT_ROWS_DEFAULT = 30;
//TODO 
const PROJECT_COUNT_DEFAULT = 5; // 默认 5 项目，支持调整

const buildEmptyStudents = (count = STUDENT_ROWS_DEFAULT, projectCount = PROJECT_COUNT_DEFAULT): StudentRow[] => {
  return Array.from({ length: count }).map((_, i) => {
    const row: StudentRow = {
      key: String(i + 1),
      studentNo: '',
      studentName: '',
    };
    for (let n = 1; n <= projectCount; n++) {
      for (let a = 1; a <= 3; a++) {
        row[`p${n}a${a}`] = { score: undefined, comment: '' };
      }
    }
    return row;
  });
};

const ProjectGradeRegister: React.FC = () => {
  const { message } = App.useApp()
  const isDev = import.meta.env.DEV;
  const { currentCampus, setCampus } = useCampusStore();
  const [meta, setMeta] = useState({
    campusName: currentCampus || '石美',
    majorName: '',
    className: '',
    courseName: '',
    teacherName: '',
  });

  useEffect(() => {
    setMeta(m => ({ ...m, campusName: currentCampus || '石美' }));
  }, [currentCampus]);

  const [stats, setStats] = useState({
    classSize: 20, // 强化人数
    projectCount: 5, // 项目次数
    actualSubmissions: 395,
    passCount: 375,
  });
  const [projectCountInput, setProjectCountInput] = useState(stats.projectCount);

  const expectedSubmissions = useMemo(
    () => stats.classSize * stats.projectCount,
    [stats.classSize, stats.projectCount]
  );
  const submitRate = useMemo(
    () => (expectedSubmissions ? Number(((stats.actualSubmissions / expectedSubmissions) * 100).toFixed(1)) : 0),
    [expectedSubmissions, stats.actualSubmissions]
  );
  const passRate = useMemo(
    () => (stats.actualSubmissions ? Number(((stats.passCount / stats.actualSubmissions) * 100).toFixed(1)) : 0),
    [stats.actualSubmissions, stats.passCount]
  );

  const [projectNames, setProjectNames] = useState<string[]>(() => Array.from({ length: PROJECT_COUNT_DEFAULT }).map(() => ''));
  // 评分人名称（每个项目 5 位：教员1、教员2、教员3、班主任1、班主任2）
  const [raterNames, setRaterNames] = useState<string[][]>(() => Array.from({ length: PROJECT_COUNT_DEFAULT }).map(() => ['教员1', '教员2', '教员3', '班主任1', '班主任2']));
  // 每个项目的答辩日期（仅使用第一位）
  const [projectAttemptDates, setProjectAttemptDates] = useState<string[][]>(() => Array.from({ length: PROJECT_COUNT_DEFAULT }).map(() => ['', '', '']));
  const [students, setStudents] = useState<StudentRow[]>(() => []);

  const [backendRecord, setBackendRecord] = useState<ProjectGradeRegister | null>(null);
  const { campuses: campusOptions, majors: majorOptions, classes: classOptions, courses: courseOptions, teachers: teacherOptions } = useConfigOptions({
    campusName: meta.campusName,
    majorName: meta.majorName,
  });

  const loadData = async () => {
    try {
      console.log('🔍 loadData - 开始加载数据', {
        currentCampus,
        className: meta.className,
        majorName: meta.majorName,
        courseName: meta.courseName,
        teacherName: meta.teacherName,
      });
      
      const res = await projectGradeRegisterService.getList(
        { search: '' },
        currentCampus || undefined,
        meta.className,
      );
      
      console.log('🔍 loadData - API 返回结果', {
        total: res.total,
        listLength: res.list?.length,
        list: res.list,
      });
      
      if (res.list && res.list.length > 0) {
        // 如果有 backendRecord.id，优先匹配相同 ID 的记录
        // 否则匹配相同的 className、courseName、teacherName
        let rec = res.list[0];
        
        if (backendRecord?.id) {
          const matchedById = res.list.find((r: any) => r.id === backendRecord.id);
          if (matchedById) {
            rec = matchedById;
            console.log('🔍 loadData - 找到匹配的记录（按ID）', rec.id);
          } else {
            // 如果按ID找不到，尝试按其他条件匹配
            const matchedByConditions = res.list.find((r: any) => 
              r.className === meta.className &&
              r.courseName === meta.courseName &&
              r.teacherName === meta.teacherName
            );
            if (matchedByConditions) {
              rec = matchedByConditions;
              console.log('🔍 loadData - 找到匹配的记录（按条件）', rec.id);
            } else {
              console.log('🔍 loadData - 未找到匹配记录，使用第一条', res.list[0].id);
            }
          }
        } else {
          // 没有 backendRecord，尝试匹配相同的 className、courseName、teacherName
          const matchedByConditions = res.list.find((r: any) => 
            r.className === meta.className &&
            r.courseName === meta.courseName &&
            r.teacherName === meta.teacherName
          );
          if (matchedByConditions) {
            rec = matchedByConditions;
            console.log('🔍 loadData - 找到匹配的记录（按条件）', rec.id);
          } else {
            console.log('🔍 loadData - 未找到匹配记录，使用第一条', res.list[0].id);
          }
        }
        
        console.log('🔍 loadData - 加载的记录', {
          id: rec.id,
          className: rec.className,
          courseName: rec.courseName,
          teacherName: rec.teacherName,
          studentsCount: Array.isArray(rec.students) ? rec.students.length : 0,
          projectAttemptDates: rec.projectAttemptDates,
          projectNames: rec.projectNames,
        });
        
        setBackendRecord(rec);
        setMeta({
          campusName: rec.campusName,
          majorName: rec.majorName,
          className: rec.className,
          courseName: rec.courseName,
          teacherName: rec.teacherName,
        });
        setStats({
          classSize: rec.classSize,
          projectCount: rec.projectCount,
          actualSubmissions: rec.actualSubmissions,
          passCount: rec.passCount,
        });
        setProjectNames(rec.projectNames || []);
        setProjectAttemptDates(rec.projectAttemptDates || []);
        setRaterNames(rec.raterNames || []);
        if (Array.isArray(rec.students)) {
          console.log('🔍 loadData - 设置学生数据', rec.students.length, '条');
          setStudents(rec.students as StudentRow[]);
        } else {
          console.warn('🔍 loadData - students 不是数组', rec.students);
        }
      } else {
        console.warn('🔍 loadData - 没有找到数据', {
          currentCampus,
          className: meta.className,
        });
        // 清空数据
        setBackendRecord(null);
        setStudents([]);
      }
    } catch (error) {
      console.error('❌ loadData - 加载失败', error);
      message.error('加载项目成绩失败');
    }
  };

  useEffect(() => {
    loadData();
  }, [currentCampus, meta.className, meta.courseName, meta.teacherName]);

  const persist = async () => {
    try {
      const payload = {
        campusName: meta.campusName,
        majorName: meta.majorName,
        className: meta.className,
        courseName: meta.courseName,
        teacherName: meta.teacherName,
        projectCount: stats.projectCount,
        classSize: stats.classSize,
        actualSubmissions: stats.actualSubmissions,
        passCount: stats.passCount,
        projectNames,
        projectAttemptDates,
        raterNames,
        students,
      };
      
      console.log('🔍 persist - 保存数据', {
        hasBackendRecord: !!backendRecord?.id,
        backendRecordId: backendRecord?.id,
        projectAttemptDates,
        projectNames,
        payload: {
          ...payload,
          studentsCount: Array.isArray(students) ? students.length : 0,
        },
      });
      
      if (backendRecord?.id) {
        const updated = await projectGradeRegisterService.update({ id: backendRecord.id, ...payload });
        console.log('🔍 persist - 更新成功', updated);
        setBackendRecord(updated);
        message.success('已更新到后端');
      } else {
        const created = await projectGradeRegisterService.create(payload);
        console.log('🔍 persist - 创建成功', created);
        setBackendRecord(created);
        message.success('已保存到后端');
      }
      
      // 保存成功后，重新加载数据以确保显示最新数据
      await loadData();
    } catch (error) {
      console.error('❌ persist - 保存失败', error);
      message.error('保存失败，请重试');
    }
  };

  // 从班档案表生成学员数据（排除退费明细表中的学员）
  const handleGenerateStudentsFromArchive = async () => {
    if (!currentCampus && !meta.campusName) {
      message.warning('请先选择神殿');
      return;
    }
    if (!meta.className) {
      message.warning('请先选择班级');
      return;
    }

    try {
      const campus = meta.campusName || currentCampus || '';
      const campusName = campus.replace(/神殿$/, '');
      
      // 尝试从班档案表获取学员列表
      const tryFetchClassFile = async (campusArg: string) => {
        const res = await apiFetch(buildApiUrl(`/teaching-quality/class-file?campus=${encodeURIComponent(campusArg)}&class=${encodeURIComponent(meta.className)}`));
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

      // 获取已存在的学员（按学号和姓名判断）
      const existingIds = new Set(
        students.filter(s => s.studentNo).map(s => s.studentNo)
      );
      const existingNames = new Set(
        students.filter(s => s.studentName).map(s => s.studentName)
      );
      
      const newStudents: StudentRow[] = [];
      let refundedCount = 0;
      let keyIndex = students.length;
      
      archiveData.行列表.forEach((row: any, idx: number) => {
        const name = (row.name || row.姓名 || '').trim();
        const idCard = (row.idCard || row.身份证号 || '').trim();
        const studentNo = idCard || `${meta.className}-${String(row.serialNumber || idx + 1).padStart(2, '0')}`;
        
        // 跳过已存在的学员
        if (!name || existingNames.has(name) || existingIds.has(studentNo)) {
          return;
        }
        
        // 跳过退费学员
        if (refundedNames.has(name) || (idCard && refundedIds.has(idCard))) {
          refundedCount++;
          return;
        }

        // 创建新学员行
        const newRow: StudentRow = {
          key: String(keyIndex + 1),
          studentNo,
          studentName: name,
        };
        // 初始化项目成绩字段
        for (let n = 1; n <= stats.projectCount; n++) {
          for (let a = 1; a <= 3; a++) {
            newRow[`p${n}a${a}`] = { score: undefined, comment: '' };
          }
        }
        newStudents.push(newRow);
        keyIndex++;
      });

      if (newStudents.length === 0) {
        if (refundedCount > 0) {
          message.info(`档案中的学员已存在或已退费（排除退费学员${refundedCount}人）`);
        } else {
          message.info('档案中的所有学员已存在于当前列表中');
        }
        return;
      }

      // 合并现有非空学员和新学员（导入后：有多少学生就显示多少行，不再补空行）
      const nonEmptyStudents = students.filter(s => s.studentNo || s.studentName);
      const merged = [...nonEmptyStudents, ...newStudents];

      // 重新编号 key
      merged.forEach((row, i) => {
        row.key = String(i + 1);
      });

      setStudents(merged);
      const refundMsg = refundedCount > 0 ? `，已排除退费学员${refundedCount}人` : '';
      message.success(`已从班档案表导入 ${newStudents.length} 名学员${refundMsg}`);
    } catch (error) {
      console.error('从班档案表生成学员失败:', error);
      message.error('从班档案表获取数据失败');
    }
  };

  const clearAll = () => {
    setMeta({ campusName: currentCampus || '石美', majorName: '', className: '', courseName: '', teacherName: '' });
    setStats({ classSize: 20, projectCount: PROJECT_COUNT_DEFAULT, actualSubmissions: 0, passCount: 0 });
    setProjectNames(Array.from({ length: PROJECT_COUNT_DEFAULT }).map(() => ''));
    setProjectAttemptDates(Array.from({ length: PROJECT_COUNT_DEFAULT }).map(() => ['', '', '']));
    setStudents([]);
  };

  // 当项目次数变化时，同步数组长度与学生行键位
  useEffect(() => {
    setProjectNames(prev => Array.from({ length: stats.projectCount }).map((_, i) => prev[i] || ''));
    setProjectAttemptDates(prev => Array.from({ length: stats.projectCount }).map((_, i) => prev[i] || ['', '', '']));
    setRaterNames(prev => Array.from({ length: stats.projectCount }).map((_, i) => prev[i] || ['教员1', '教员2', '教员3', '班主任1', '班主任2']));
    setStudents(prev => {
      const next = prev.map(row => {
        const copy: StudentRow = { ...row };
        // 确保每个项目的三次键存在
        for (let n = 1; n <= stats.projectCount; n++) {
          for (let a = 1; a <= 3; a++) {
            const k = `p${n}a${a}`;
            if (!(k in copy)) copy[k] = { score: undefined, comment: '' };
          }
        }
        return copy;
      });
      return next;
    });
  }, [stats.projectCount]);

  useEffect(() => {
    const activeStudents = students.filter(row => {
      const hasBasicInfo = !!(row.studentNo?.trim() || row.studentName?.trim());
      const hasScores = Object.keys(row).some(k => k.startsWith('p') && (row as any)[k]?.score !== undefined);
      const hasComments = Object.keys(row).some(k => k.startsWith('p') && !!((row as any)[k]?.comment || '').trim());
      return hasBasicInfo || hasScores || hasComments;
    }).length;

    const projectCount = projectNames.length || PROJECT_COUNT_DEFAULT;
    let actualSubmissions = 0;
    let passCount = 0;

    students.forEach(row => {
      for (let n = 1; n <= projectCount; n++) {
        const attempts = [1, 2, 3].map(a => (row as any)[`p${n}a${a}`]);
        const hasSubmission = attempts.some(at => {
          if (!at) return false;
          const hasScore = typeof at.score === 'number';
          const hasComment = !!(at.comment || '').trim();
          return hasScore || hasComment;
        });
        if (hasSubmission) actualSubmissions += 1;

        // 项目合格率以最终成绩（三次打分中的最高分）是否合格为标准，>= 6 为合格
        const scores: number[] = [];
        for (let a = 1; a <= 3; a++) {
          const cell = (row as any)[`p${n}a${a}`];
          if (cell && typeof cell.score === 'number') {
            scores.push(cell.score);
          }
        }
        const finalScore = scores.length > 0 ? Math.max(...scores) : -Infinity;
        if (finalScore >= 6) passCount += 1;
      }
    });

    setStats(prev => {
      if (
        prev.classSize === activeStudents &&
        prev.projectCount === projectCount &&
        prev.actualSubmissions === actualSubmissions &&
        prev.passCount === passCount
      ) {
        return prev;
      }
      return {
        ...prev,
        classSize: activeStudents,
        projectCount,
        actualSubmissions,
        passCount,
      };
    });
  }, [students, projectNames]);

  const debugRenderCount = useRef(0);
  useEffect(() => {
    if (!isDev) return;
    debugRenderCount.current += 1;
    // 观察 render 次数与关键数字，便于在控制台对比 React Scan 数据
    console.debug('ProjectGradeRegister render', {
      count: debugRenderCount.current,
      projectCount: stats.projectCount,
      students: students.length,
    });
  });

  const updateRow = useCallback((index: number, updater: (row: StudentRow) => void) => {
    setStudents(prev => {
      const next = [...prev];
      const target = { ...next[index] };
      updater(target);
      next[index] = target;
      return next;
    });
  }, []);

  const handleStudentFieldChange = useCallback(
    (index: number, patch: Partial<StudentRow>) => {
      updateRow(index, row => Object.assign(row, patch));
      if (import.meta.env.DEV) {
        console.debug('👀 student field change', { index, patchKeys: Object.keys(patch) });
      }
    },
    [updateRow],
  );

  const handleScoreChange = useCallback(
    (rowIndex: number, projectIndex: number, attempt: number, value?: number | null) => {
      updateRow(rowIndex, row => {
        const key = `p${projectIndex}a${attempt}`;
        row[key] = {
          ...(row as any)[key],
          score: value === null ? undefined : value,
        };
      });
      if (import.meta.env.DEV) {
        console.debug('👀 score change', { rowIndex, projectIndex, attempt, value });
      }
    },
    [updateRow],
  );

  const handleCommentChange = useCallback(
    (rowIndex: number, projectIndex: number, attempt: number, comment: string) => {
      updateRow(rowIndex, row => {
        const key = `p${projectIndex}a${attempt}`;
        row[key] = {
          ...(row as any)[key],
          comment,
        };
      });
      if (import.meta.env.DEV) {
        console.debug('👀 comment change', { rowIndex, projectIndex, attempt, len: comment.length });
      }
    },
    [updateRow],
  );

  // 受控 + 防抖更新 projectCount，避免每次输入立刻重建所有列
  useEffect(() => {
    setProjectCountInput(stats.projectCount);
  }, [stats.projectCount]);

  const debounceTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!isDev) return;
    console.debug('🕒 projectCountInput changed', projectCountInput);
  }, [isDev, projectCountInput]);

  const applyProjectCount = useCallback((value: number) => {
    const safe = Math.min(Math.max(1, Math.floor(value || 1)), 50);
    setStats(s => ({ ...s, projectCount: safe }));
  }, []);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = window.setTimeout(() => applyProjectCount(projectCountInput), 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [applyProjectCount, projectCountInput]);

  // 添加项目
  const addProject = useCallback(() => {
    const newCount = stats.projectCount + 1;
    if (newCount > 50) {
      message.warning('项目数量最多支持50个');
      return;
    }
    setStats(s => ({ ...s, projectCount: newCount }));
    setProjectCountInput(newCount);
    message.success(`已添加项目${newCount}`);
  }, [stats.projectCount]);

  // 删除项目（删除最后一个项目）
  const removeProject = useCallback(() => {
    if (stats.projectCount <= 1) {
      message.warning('至少需要保留1个项目');
      return;
    }
    const lastIdx = stats.projectCount - 1;
    const lastProjectName = projectNames[lastIdx] || `项目${stats.projectCount}`;
    
    // 检查最后一个项目是否有数据
    const hasData = students.some(row => {
      for (let a = 1; a <= 3; a++) {
        const k = `p${stats.projectCount}a${a}`;
        const cell = (row as any)[k];
        if (cell && (typeof cell.score === 'number' || (cell.comment || '').trim())) {
          return true;
        }
      }
      return false;
    });
    
    if (hasData) {
      message.warning(`${lastProjectName} 存在成绩数据，请先清空后再删除`);
      return;
    }
    
    const newCount = stats.projectCount - 1;
    setStats(s => ({ ...s, projectCount: newCount }));
    setProjectCountInput(newCount);
    // 同时删除项目名称和日期数组的最后一项
    setProjectNames(prev => prev.slice(0, newCount));
    setProjectAttemptDates(prev => prev.slice(0, newCount));
    setRaterNames(prev => prev.slice(0, newCount));
    message.success(`已删除${lastProjectName}`);
  }, [stats.projectCount, projectNames, students]);

  // ==================== Excel 导入功能 ====================
  const [importModalVisible, setImportModalVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 解析 Excel 文件
   * Excel 格式：
   * - 第1行: 标题 "清美教育学员项目成绩登记表"
   * - 第3行: 神殿名称、专业名称、班级名称、课程名称、教员姓名
   * - 第5行: 强化人数、项目次数、应提交数量、实际提交数量、合格数量
   * - 第9行: 项目序号行
   * - 第10行: 项目名称行
   * - 第11行: 提交日期行
   * - 第12行: 表头行（学号、学员姓名、首次得分、项目点评...）
   * - 第13行起: 学员数据
   */
  const handleExcelImport = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];

      console.log('[Excel导入] 原始数据行数:', jsonData.length);
      console.log('[Excel导入] 前15行:', jsonData.slice(0, 15));

      // 解析元数据（第3行）
      let metaRow = -1;
      for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const row = jsonData[i];
        if (row && row.some((cell: any) => String(cell || '').includes('神殿名称'))) {
          metaRow = i;
          break;
        }
      }

      let parsedMeta = { ...meta };
      if (metaRow >= 0) {
        const row = jsonData[metaRow];
        for (let j = 0; j < row.length - 1; j++) {
          const cell = String(row[j] || '').trim();
          const nextCell = String(row[j + 1] || '').trim();
          if (cell === '神殿名称' && nextCell) parsedMeta.campusName = nextCell;
          if (cell === '专业名称' && nextCell) parsedMeta.majorName = nextCell;
          if (cell === '班级名称' && nextCell) parsedMeta.className = nextCell;
          if (cell === '课程名称' && nextCell) parsedMeta.courseName = nextCell;
          if (cell === '教员姓名' && nextCell) parsedMeta.teacherName = nextCell;
        }
        console.log('[Excel导入] 解析到元数据:', parsedMeta);
      }

      // 查找表头行（包含"学号"和"学员姓名"的行）
      let headerRowIndex = -1;
      let projectStartCol = -1;
      for (let i = 0; i < Math.min(20, jsonData.length); i++) {
        const row = jsonData[i];
        if (!row) continue;
        const hasStudentNo = row.some((cell: any) => String(cell || '').trim() === '学号');
        const hasStudentName = row.some((cell: any) => String(cell || '').trim() === '学员姓名');
        if (hasStudentNo && hasStudentName) {
          headerRowIndex = i;
          // 找到"学员姓名"列之后的第一列作为项目数据起始列
          for (let j = 0; j < row.length; j++) {
            if (String(row[j] || '').trim() === '学员姓名') {
              projectStartCol = j + 1;
              break;
            }
          }
          break;
        }
      }

      if (headerRowIndex === -1) {
        message.error('无法识别表头格式，请确保Excel包含"学号"和"学员姓名"列');
        return;
      }

      console.log('[Excel导入] 表头行索引:', headerRowIndex, '项目起始列:', projectStartCol);

      // 解析表头，确定每个项目的列范围
      const headerRow = jsonData[headerRowIndex];
      const projectColumns: { projectIndex: number; attempt: number; type: 'score' | 'comment'; colIndex: number }[] = [];

      let currentProject = 0;
      let currentAttempt = 0;

      for (let j = projectStartCol; j < headerRow.length; j++) {
        const cell = String(headerRow[j] || '').trim();
        if (!cell) continue;

        if (cell.includes('首次得分')) {
          currentProject++;
          currentAttempt = 1;
          projectColumns.push({ projectIndex: currentProject, attempt: 1, type: 'score', colIndex: j });
        } else if (cell.includes('二次得分')) {
          currentAttempt = 2;
          projectColumns.push({ projectIndex: currentProject, attempt: 2, type: 'score', colIndex: j });
        } else if (cell.includes('三次得分')) {
          currentAttempt = 3;
          projectColumns.push({ projectIndex: currentProject, attempt: 3, type: 'score', colIndex: j });
        } else if (cell.includes('项目点评') || cell.includes('点评')) {
          projectColumns.push({ projectIndex: currentProject, attempt: currentAttempt, type: 'comment', colIndex: j });
        }
      }

      const projectCount = currentProject;
      console.log('[Excel导入] 识别到项目数:', projectCount, '列映射:', projectColumns);

      // 解析项目名称（表头行上方1-2行）
      const parsedProjectNames: string[] = Array(projectCount).fill('');
      for (let searchRow = headerRowIndex - 1; searchRow >= Math.max(0, headerRowIndex - 3); searchRow--) {  const row = jsonData[searchRow];
        if (!row) continue;
        // 查找项目名称行（通常在提交日期行上方）
        const firstCell = String(row[0] || '').trim();
        if (firstCell === '项目名称' || firstCell === '') {
          // 尝试从每个项目的起始列读取项目名称
          for (let p = 1; p <= projectCount; p++) {
            const scoreCol = projectColumns.find(c => c.projectIndex === p && c.attempt === 1 && c.type === 'score');
            if (scoreCol) {
              const name = String(row[scoreCol.colIndex] || '').trim();
              if (name && !name.includes('得分') && !name.includes('日期')) {
                parsedProjectNames[p - 1] = name;
              }
            }
          }
        }
      }
      console.log('[Excel导入] 解析到项目名称:', parsedProjectNames);

      // 解析提交日期（表头行上方1行）
      const parsedProjectDates: string[][] = Array(projectCount).fill(null).map(() => ['', '', '']);
      const dateRow = jsonData[headerRowIndex - 1];
      if (dateRow) {
        const firstCell = String(dateRow[0] || '').trim();
        if (firstCell === '提交日期' || firstCell === '') {
          for (let p = 1; p <= projectCount; p++) {
            for (let a = 1; a <= 3; a++) {
              const scoreCol = projectColumns.find(c => c.projectIndex === p && c.attempt === a && c.type === 'score');
              if (scoreCol) {
                const dateVal = dateRow[scoreCol.colIndex];
                if (dateVal) {
                  // 处理 Excel 日期格式
                  let dateStr = '';
                  if (typeof dateVal === 'number') {
                    // Excel 日期序列号
                    const date = XLSX.SSF.parse_date_code(dateVal);
                    dateStr = `${date.y}/${date.m}/${date.d}`;
                  } else {
                    dateStr = String(dateVal).trim();
                  }
                  if (dateStr) {
                    parsedProjectDates[p - 1][a - 1] = dateStr;
                  }
                }
              }
            }
          }
        }
      }
      console.log('[Excel导入] 解析到提交日期:', parsedProjectDates);

      // 解析学员数据
      const parsedStudents: StudentRow[] = [];
      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        const studentNo = String(row[0] || '').trim();
        const studentName = String(row[1] || '').trim();

        // 跳过空行或汇总行
        if (!studentNo && !studentName) continue;
        if (studentNo === '合计' || studentName === '合计') continue;

        const studentRow: StudentRow = {
          key: String(parsedStudents.length + 1),
          studentNo,
          studentName,
        };

        // 初始化所有项目字段
        for (let p = 1; p <= projectCount; p++) {
          for (let a = 1; a <= 3; a++) {
            studentRow[`p${p}a${a}`] = { score: undefined, comment: '' };
          }
        }

        // 填充成绩和点评
        for (const col of projectColumns) {
          const cellValue = row[col.colIndex];
          const key = `p${col.projectIndex}a${col.attempt}`;

          if (col.type === 'score') {
            const score = parseFloat(String(cellValue || ''));
            if (!isNaN(score) && score >= 0 && score <= 10) {
              studentRow[key] = { ...studentRow[key], score };
            }
          } else if (col.type === 'comment') {
            const comment = String(cellValue || '').trim();
            if (comment) {
              studentRow[key] = { ...studentRow[key], comment };
            }
          }
        }

        parsedStudents.push(studentRow);
      }

      console.log('[Excel导入] 解析到学员数:', parsedStudents.length);

      if (parsedStudents.length === 0) {
        message.warning('未能解析出学员数据，请检查Excel格式');
        return;
      }

      // 应用解析结果
      setMeta(parsedMeta);
      setStats(s => ({ ...s, projectCount }));
      setProjectCountInput(projectCount);
      setProjectNames(parsedProjectNames);
      setProjectAttemptDates(parsedProjectDates);
      setStudents(parsedStudents);

      message.success(`成功导入 ${parsedStudents.length} 名学员的 ${projectCount} 个项目成绩`);
      setImportModalVisible(false);

    } catch (error) {
      console.error('[Excel导入] 解析失败:', error);
      message.error('Excel解析失败，请检查文件格式');
    }
  };

  // 计算某个项目的最终成绩（三次打分中的最高分）
  const getFinalScore = useCallback((row: StudentRow, projectIndex: number): number | undefined => {
    const scores: number[] = [];
    for (let a = 1; a <= 3; a++) {
      const cell = (row as any)[`p${projectIndex}a${a}`];
      if (cell && typeof cell.score === 'number') {
        scores.push(cell.score);
      }
    }
    if (scores.length === 0) return undefined;
    return Math.max(...scores);
  }, []);

  const assignmentColumns: ColumnsType<StudentRow> = useMemo(() => {
    const cols: ColumnsType<StudentRow> = [];
    for (let n = 1; n <= stats.projectCount; n++) {
      const scoreKey1 = `p${n}a1`;
      const scoreKey2 = `p${n}a2`;
      const scoreKey3 = `p${n}a3`;
      const title = (
        <div style={{ padding: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 8, background: '#eef2ff', fontWeight: 600 }}>
              项目序号 {n}
            </span>
          </div>
          <Input
            placeholder="项目名称"
            value={projectNames[n - 1]}
            onChange={(e) =>
              setProjectNames(prev => prev.map((v, i) => (i === n - 1 ? e.target.value : v)))
            }
            style={{ width: 180, fontSize: 14 }}
          />
          <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <Text type="secondary" style={{ minWidth: 56 }}>提交日期</Text>
            {[0, 1, 2].map(ai => (
              <DatePicker
                key={ai}
                size="small"
                value={projectAttemptDates[n - 1]?.[ai] ? dayjs(projectAttemptDates[n - 1][ai], 'YYYY/M/D') : null}
                onChange={(d: any) =>
                  setProjectAttemptDates(prev =>
                    prev.map((arr, i) =>
                      i === n - 1 ? arr.map((x, idx) => (idx === ai ? (d ? d.format('YYYY/M/D') : '') : x)) : arr,
                    ),
                  )
                }
              />
            ))}
          </div>
        </div>
      );

      cols.push({
        title,
        children: [
          // 首次
          {
            title: '首次得分',
            align: 'center',
            width: 100,
            shouldCellUpdate: (record, prev) =>
              (record as any)[scoreKey1]?.score !== (prev as any)[scoreKey1]?.score,
            render: (_v, row, i) => (
              <ScoreCell
                value={(row as any)[scoreKey1]?.score as number | undefined}
                rowIndex={i}
                projectIndex={n}
                attempt={1}
                onChange={handleScoreChange}
              />
            ),
          },
          {
            title: '项目点评',
            align: 'center',
            width: 160,
            shouldCellUpdate: (record, prev) =>
              (record as any)[scoreKey1]?.comment !== (prev as any)[scoreKey1]?.comment,
            render: (_v, row, i) => (
              <CommentCell
                value={(row as any)[scoreKey1]?.comment}
                rowIndex={i}
                projectIndex={n}
                attempt={1}
                onChange={handleCommentChange}
              />
            ),
          },
          // 二次
          {
            title: '二次得分',
            align: 'center',
            width: 100,
            shouldCellUpdate: (record, prev) =>
              (record as any)[scoreKey2]?.score !== (prev as any)[scoreKey2]?.score,
            render: (_v, row, i) => (
              <ScoreCell
                value={(row as any)[scoreKey2]?.score as number | undefined}
                rowIndex={i}
                projectIndex={n}
                attempt={2}
                onChange={handleScoreChange}
              />
            ),
          },
          {
            title: '项目点评',
            align: 'center',
            width: 160,
            shouldCellUpdate: (record, prev) =>
              (record as any)[scoreKey2]?.comment !== (prev as any)[scoreKey2]?.comment,
            render: (_v, row, i) => (
              <CommentCell
                value={(row as any)[scoreKey2]?.comment}
                rowIndex={i}
                projectIndex={n}
                attempt={2}
                onChange={handleCommentChange}
              />
            ),
          },
          // 三次
          {
            title: '三次得分',
            align: 'center',
            width: 100,
            shouldCellUpdate: (record, prev) =>
              (record as any)[scoreKey3]?.score !== (prev as any)[scoreKey3]?.score,
            render: (_v, row, i) => (
              <ScoreCell
                value={(row as any)[scoreKey3]?.score as number | undefined}
                rowIndex={i}
                projectIndex={n}
                attempt={3}
                onChange={handleScoreChange}
              />
            ),
          },
          {
            title: '项目点评',
            align: 'center',
            width: 160,
            shouldCellUpdate: (record, prev) =>
              (record as any)[scoreKey3]?.comment !== (prev as any)[scoreKey3]?.comment,
            render: (_v, row, i) => (
              <CommentCell
                value={(row as any)[scoreKey3]?.comment}
                rowIndex={i}
                projectIndex={n}
                attempt={3}
                onChange={handleCommentChange}
              />
            ),
          },
          // 最终成绩（取三次最高分）
          {
            title: <span style={{ color: '#1890ff', fontWeight: 600 }}>最终成绩</span>,
            align: 'center',
            width: 90,
            shouldCellUpdate: (record, prev) =>
              (record as any)[scoreKey1]?.score !== (prev as any)[scoreKey1]?.score ||
              (record as any)[scoreKey2]?.score !== (prev as any)[scoreKey2]?.score ||
              (record as any)[scoreKey3]?.score !== (prev as any)[scoreKey3]?.score,
            render: (_v, row) => {
              const finalScore = getFinalScore(row, n);
              if (finalScore === undefined) return <span style={{ color: '#999' }}>-</span>;
              const isFail = finalScore < 6;
              return (
                <span style={{ 
                  fontWeight: 600, 
                  color: isFail ? '#ff4d4f' : '#52c41a',
                  fontSize: 14,
                }}>
                  {finalScore}
                </span>
              );
            },
          },
        ],
      } as any);
    }
    return cols;
  }, [getFinalScore, handleCommentChange, handleScoreChange, projectNames, projectAttemptDates, setProjectNames, setProjectAttemptDates, stats.projectCount]);

  const columns: ColumnsType<StudentRow> = useMemo(
    () => [
      {
        title: '学号',
        dataIndex: 'studentNo',
        width: 120,
        fixed: 'left',
        align: 'center',
        shouldCellUpdate: (record, prev) => record.studentNo !== prev.studentNo,
        render: (v, _r, i) => (
          <Input value={v} onChange={(e) => handleStudentFieldChange(i, { studentNo: e.target.value })} />
        ),
      },
      {
        title: '学员姓名',
        dataIndex: 'studentName',
        width: 120,
        fixed: 'left',
        align: 'center',
        shouldCellUpdate: (record, prev) => record.studentName !== prev.studentName,
        render: (v, _r, i) => (
          <Input value={v} onChange={(e) => handleStudentFieldChange(i, { studentName: e.target.value })} />
        ),
      },
      ...assignmentColumns,
    ],
    [assignmentColumns, handleStudentFieldChange],
  );

  return (
    <div style={{ padding: 24 }}>
      <Card bordered={false} style={{ background: '#f5f7fa' }}>
        <Title level={4} style={{ marginBottom: 12 }}>某神殿某班项目成绩表</Title>

        {/* 顶部信息 */}
        <Row gutter={[12, 8]}>
          <Col span={6}>
            <Space>
              <Text strong>神殿名称</Text>
              <Select
                style={{ minWidth: 160 }}
                placeholder="请选择神殿"
                value={meta.campusName}
                onChange={(val) => {
                  setMeta(m => ({ ...m, campusName: val, className: '', majorName: '' }));
                  setCampus(val);
                }}
                options={campusOptions}
                loading={!campusOptions.length}
              />
            </Space>
          </Col>
          <Col span={6}>
            <Space>
              <Text strong>专业名称</Text>
              <Select
                style={{ minWidth: 160 }}
                placeholder="请选择专业"
                value={meta.majorName}
                onChange={(val) => setMeta(m => ({ ...m, majorName: val }))}
                options={majorOptions}
                loading={!majorOptions.length}
              />
            </Space>
          </Col>
          <Col span={6}>
            <Space>
              <Text strong>班级名称</Text>
              <Select
                style={{ minWidth: 160 }}
                placeholder="请选择班级"
                value={meta.className}
                onChange={(val) => setMeta(m => ({ ...m, className: val }))}
                options={classOptions}
                allowClear
                loading={!classOptions.length}
              />
            </Space>
          </Col>
          <Col span={6}>
            <Space>
              <Text strong>课程名称</Text>
              <Select
                style={{ minWidth: 160 }}
                placeholder="请选择课程"
                value={meta.courseName}
                onChange={(val) => setMeta(m => ({ ...m, courseName: val }))}
                options={courseOptions}
                allowClear
                loading={!courseOptions.length}
              />
            </Space>
          </Col>
        </Row>
        <Row gutter={[12, 8]} style={{ marginTop: 8 }}>
          <Col span={6}>
            <Space>
              <Text strong>教员姓名</Text>
              <AutoComplete
                style={{ minWidth: 160 }}
                placeholder="请选择或输入教员姓名"
                value={meta.teacherName}
                onChange={(val) => setMeta(m => ({ ...m, teacherName: val }))}
                options={teacherOptions}
                filterOption={(inputValue, option) =>
                  (option?.label as string)?.toLowerCase().includes(inputValue.toLowerCase())
                }
                allowClear
              />
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: '12px 0' }} />

        {/* 统计区 */}
        <Row gutter={[12, 8]}>
          <Col span={4}><Space><Text strong>强化人数</Text><InputNumber min={0} value={stats.classSize} readOnly /></Space></Col>
          <Col span={6}>
            <Space>
              <Text strong>项目次数</Text>
              <InputNumber
                min={1}
                max={50}
                value={projectCountInput}
                onChange={(v) => setProjectCountInput(Number(v || 1))}
                style={{ width: 70 }}
              />
              <Button size="small" icon={<PlusOutlined />} onClick={addProject}>添加项目</Button>
              <Button size="small" icon={<MinusOutlined />} onClick={removeProject} danger>删除项目</Button>
            </Space>
          </Col>
          <Col span={4}><Space><Text strong>应提交数量</Text><Input readOnly value={expectedSubmissions} /></Space></Col>
          <Col span={4}><Space><Text strong>实际提交数量</Text><InputNumber min={0} value={stats.actualSubmissions} readOnly /></Space></Col>
          <Col span={4}><Space><Text strong>合格数量</Text><InputNumber min={0} value={stats.passCount} readOnly /></Space></Col>
        </Row>
        <Row gutter={[12, 8]} style={{ marginTop: 8 }}>
          <Col span={4}><Space><Text strong>项目提交率</Text><Input readOnly value={`${submitRate}%`} /></Space></Col>
          <Col span={4}><Space><Text strong>项目合格率</Text><Input readOnly value={`${passRate}%`} /></Space></Col>
        </Row>

        <Divider style={{ margin: '12px 0' }} />

        {/* 操作按钮区 */}
        <Space style={{ marginBottom: 12 }}>
          <Button icon={<UsergroupAddOutlined />} onClick={handleGenerateStudentsFromArchive}>从班档案导入学员</Button>
          <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>从Excel导入</Button>
        </Space>

        {/* 学员项目成绩表 */}
        <Table<StudentRow>
          bordered
          size="small"
          className="project-score-table"
          columns={columns}
          dataSource={students}
          rowKey="key"
          pagination={false}
          scroll={{ x: 'max-content', y: 560 }}
          virtual
        />

        <Space style={{ marginTop: 12 }}>
          <Button type="primary" onClick={persist}>保存到后端</Button>
          <Button onClick={clearAll}>清空</Button>
        </Space>
      </Card>

      {/* Excel导入模态框 */}
      <Modal
        title="从Excel导入项目成绩"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Alert
          message="Excel格式说明"
          description={
            <div>
              <p>请上传符合以下格式的Excel文件：</p>
              <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                <li>第3行：神殿名称、专业名称、班级名称、课程名称、教员姓名</li>
                <li>第10行：项目名称</li>
                <li>第11行：提交日期</li>
                <li>第12行：表头（学号、学员姓名、首次得分、项目点评...）</li>
                <li>第13行起：学员数据</li>
              </ul>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Upload.Dragger
          accept=".xlsx,.xls"
          showUploadList={false}
          beforeUpload={(file) => {
            handleExcelImport(file);
            return false;
          }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">点击或拖拽Excel文件到此区域上传</p>
          <p className="ant-upload-hint">支持 .xlsx 和 .xls 格式</p>
        </Upload.Dragger>
      </Modal>
    </div>
  );
};

export default ProjectGradeRegister;