//学术->最高议事厅->神殿核心数据汇总表
import React, { useState, useEffect, useMemo } from 'react';
import { App, 
  Card, 
  Table, 
  Button, 
  Space,
  Row,
  Col,
  Statistic,
  InputNumber,
  Select
} from 'antd';
import { useCampusStore } from '@/stores/campusStore';
import { 
  DownloadOutlined,
  UploadOutlined,
  ReloadOutlined,
  SyncOutlined,
  SaveOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import * as campusCoreSummaryService from '@/services/academic/campusCoreSummary';

// 数据类型定义
interface CampusCoreSummaryRecord {
  id: string;
  序号: number;
  神殿: string;
  在校生人数: number;
  班级数量: number;
  智慧司人数: number;
  干部人数: number;
  员工人数: number;
  就业班级数量: number;
  毕业生人数: number;
  就业率: number;
  就业薪资: number;
  薪资过万人数: number;
  口碑招生人数: number;
  口碑招生收入: number;
  新生入学人数: number;
  新生流失人数: number;
}

const STORAGE_KEY = 'campus_core_summary_data';

const CampusCoreSummaryPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const [allData, setAllData] = useState<CampusCoreSummaryRecord[]>([]); // 所有神殿数据
  const [dataSource, setDataSource] = useState<CampusCoreSummaryRecord[]>([]); // 当前神殿视图数据
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(new Date().getFullYear());

  const normalizeCampus = (name?: string | null) => (name || '').replace(/神殿$/, '').trim();
  const selectedCampusShort = useMemo(() => normalizeCampus(currentCampus), [currentCampus]);
  
  // 生成年份选项（从2020到当前年份+1，加上历史合计）
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: (number | 'all')[] = ['all'];  // 历史合计放在最前面
    for (let y = currentYear + 1; y >= 2020; y--) {
      years.push(y);
    }
    return years;
  }, []);

  // 处理手填字段编辑
  const handleManualFieldChange = (recordId: string, field: string, value: number | null) => {
    const updatedData = dataSource.map((record) => {
      if (record.id === recordId) {
        return { ...record, [field]: value || 0 };
      }
      return record;
    });
    setDataSource(updatedData);
    
    // 同步到allData
    const updatedAllData = allData.map((record) => {
      if (record.id === recordId) {
        return { ...record, [field]: value || 0 };
      }
      return record;
    });
    setAllData(updatedAllData);
    saveData(updatedAllData);
  };

  // 保存到后端数据库
  const handleSaveToDb = async () => {
    if (dataSource.length === 0) {
      message.warning('没有数据可保存');
      return;
    }
    
    setSaving(true);
    try {
      const currentYear = new Date().getFullYear();
      
      // 转换数据格式
      const records = dataSource.map(record => ({
        神殿: record.神殿,
        年份: currentYear,
        在校生人数: record.在校生人数 || 0,
        班级数量: record.班级数量 || 0,
        智慧司人数: record.智慧司人数 || 0,
        干部人数: record.干部人数 || 0,
        员工人数: record.员工人数 || 0,
        就业班级数量: record.就业班级数量 || 0,
        毕业生人数: record.毕业生人数 || 0,
        就业率: record.就业率 || 0,
        就业薪资: record.就业薪资 || 0,
        薪资过万人数: record.薪资过万人数 || 0,
        口碑招生人数: record.口碑招生人数 || 0,
        口碑招生收入: record.口碑招生收入 || 0,
        新生入学人数: record.新生入学人数 || 0,
        新生流失人数: record.新生流失人数 || 0,
      }));
      
      const result = await campusCoreSummaryService.batchSaveToDb(records as any);
      message.success(result.message);
    } catch (error: any) {
      console.error('保存到数据库失败:', error);
      message.error(error.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 从数据库加载数据
  const handleLoadFromDb = async () => {
    setLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const dbData = await campusCoreSummaryService.fetchFromDb(
        selectedCampusShort || undefined,
        currentYear
      );
      
      if (Array.isArray(dbData) && dbData.length > 0) {
        // 转换数据格式
        const records = dbData.map((d: any, index: number) => ({
          id: `db-${d.记录ID || Date.now()}-${index}`,
          序号: index + 1,
          神殿: d.神殿,
          在校生人数: d.在校生人数 || 0,
          班级数量: d.班级数量 || 0,
          智慧司人数: d.智慧司人数 || 0,
          干部人数: d.干部人数 || 0,
          员工人数: d.员工人数 || 0,
          就业班级数量: d.就业班级数量 || 0,
          毕业生人数: d.毕业生人数 || 0,
          就业率: d.就业率 || 0,
          就业薪资: d.就业薪资 || 0,
          薪资过万人数: d.薪资过万人数 || 0,
          口碑招生人数: d.口碑招生人数 || 0,
          口碑招生收入: d.口碑招生收入 || 0,
          新生入学人数: d.新生入学人数 || 0,
          新生流失人数: d.新生流失人数 || 0,
        }));
        
        saveData(records);
        message.success(`从数据库加载了 ${records.length} 条记录`);
      } else if (dbData && !Array.isArray(dbData)) {
        // 单条记录
        const d = dbData as any;
        const record: CampusCoreSummaryRecord = {
          id: `db-${d.记录ID || Date.now()}`,
          序号: 1,
          神殿: d.神殿,
          在校生人数: d.在校生人数 || 0,
          班级数量: d.班级数量 || 0,
          智慧司人数: d.智慧司人数 || 0,
          干部人数: d.干部人数 || 0,
          员工人数: d.员工人数 || 0,
          就业班级数量: d.就业班级数量 || 0,
          毕业生人数: d.毕业生人数 || 0,
          就业率: d.就业率 || 0,
          就业薪资: d.就业薪资 || 0,
          薪资过万人数: d.薪资过万人数 || 0,
          口碑招生人数: d.口碑招生人数 || 0,
          口碑招生收入: d.口碑招生收入 || 0,
          新生入学人数: d.新生入学人数 || 0,
          新生流失人数: d.新生流失人数 || 0,
        };
        saveData([record]);
        message.success('从数据库加载了 1 条记录');
      } else {
        message.info('数据库中没有数据');
      }
    } catch (error: any) {
      console.error('从数据库加载失败:', error);
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 从班级列表统计班级数量
  const calculateClassCountFromClassList = (campus: string): number => {
    try {
      const normalizedCampus = normalizeCampus(campus);

      // 读取班级列表
      const classListKey = 'class_file_record_class_list';
      const classListStr = localStorage.getItem(classListKey);
      if (!classListStr) {
        console.log(`[班级数量统计] 班级列表为空，神殿: ${campus}`);
        return 0;
      }

      const classList: Array<{ className: string; campus: string }> = JSON.parse(classListStr);
      console.log(`[班级数量统计] 读取到 ${classList.length} 个班级，目标神殿: ${campus} (规范化后: ${normalizedCampus})`);
      
      // 筛选出该神殿的所有班级
      const campusClasses = classList.filter((cls) => {
        const clsCampus = normalizeCampus(cls.campus || '');
        return clsCampus === normalizedCampus;
      });
      
      // 检查是否有重复班级（业务上不应该有重复）
      const classNames = campusClasses.map(cls => cls.className);
      const uniqueClassNames = new Set(classNames);
      if (classNames.length > uniqueClassNames.size) {
        const duplicates = classNames.filter((name, index) => classNames.indexOf(name) !== index);
        console.warn(`[班级数量统计] 警告：发现重复班级 "${Array.from(new Set(duplicates)).join(', ')}"，这不应该发生。请检查数据源。`);
      }
      
      console.log(`[班级数量统计] 神殿 ${campus} 共有 ${campusClasses.length} 个班级`);
      return campusClasses.length;
    } catch (error) {
      console.error('从班级列表统计班级数量失败:', error);
      return 0;
    }
  };

  // 从班级档案表读取数据并计算在校生人数
  const calculateEnrolledStudentsFromClassFiles = (campus: string): number => {
    try {
      const normalizedCampus = normalizeCampus(campus);
      let totalStudents = 0;

      // 1. 读取班级列表
      const classListKey = 'class_file_record_class_list';
      const classListStr = localStorage.getItem(classListKey);
      if (!classListStr) {
        console.log(`[在校生人数统计] 班级列表为空，神殿: ${campus}`);
        return 0;
      }

      const classList: Array<{ className: string; campus: string }> = JSON.parse(classListStr);
      console.log(`[在校生人数统计] 读取到 ${classList.length} 个班级，目标神殿: ${campus} (规范化后: ${normalizedCampus})`);
      
      // 2. 筛选出该神殿的所有班级
      const campusClasses = classList.filter((cls) => {
        const clsCampus = normalizeCampus(cls.campus || '');
        return clsCampus === normalizedCampus;
      });
      
      // 检查是否有重复班级（业务上不应该有重复）
      const classNames = campusClasses.map(cls => cls.className);
      const uniqueClassNames = new Set(classNames);
      if (classNames.length > uniqueClassNames.size) {
        const duplicates = classNames.filter((name, index) => classNames.indexOf(name) !== index);
        console.warn(`[在校生人数统计] 警告：发现重复班级 "${Array.from(new Set(duplicates)).join(', ')}"，这不应该发生。请检查数据源。`);
        // 即使有重复，也只统计一次（避免重复计算）
        const uniqueClassesMap = new Map<string, { className: string; campus: string }>();
        campusClasses.forEach(cls => {
          if (!uniqueClassesMap.has(cls.className)) {
            uniqueClassesMap.set(cls.className, cls);
          }
        });
        const uniqueClasses = Array.from(uniqueClassesMap.values());
        console.log(`[在校生人数统计] 神殿 ${campus} 共有 ${uniqueClasses.length} 个唯一班级（已去重），开始统计学生人数...`);
        
        // 使用去重后的班级列表
        for (const cls of uniqueClasses) {
          const normalizedClsCampus = normalizeCampus(cls.campus);
          const classKey = `class_file_record_${normalizedClsCampus}_${cls.className}`;
          const classDataStr = localStorage.getItem(classKey);
          
          if (classDataStr) {
            try {
              const classData: Array<{
                name?: string;
                studentStatus?: string;
                idCard?: string;
              }> = JSON.parse(classDataStr);
              
              // 统计在校学生（状态为"在读"或空，且有姓名或身份证号）
              const enrolledCount = classData.filter((student) => {
                const hasInfo = student.name || student.idCard;
                const isEnrolled = !student.studentStatus || 
                                   student.studentStatus === '在读' || 
                                   student.studentStatus === '复学';
                return hasInfo && isEnrolled;
              }).length;
              
              console.log(`[在校生人数统计] 班级 ${cls.className} 有 ${enrolledCount} 个在校学生`);
              totalStudents += enrolledCount;
            } catch (error) {
              console.error(`[在校生人数统计] 读取班级 ${cls.className} 数据失败:`, error);
            }
          } else {
            console.log(`[在校生人数统计] 班级 ${cls.className} 没有数据，键名: ${classKey}`);
          }
        }
        
        console.log(`[在校生人数统计] 神殿 ${campus} 共有 ${totalStudents} 个在校学生`);
        return totalStudents;
      }
      
      console.log(`[在校生人数统计] 神殿 ${campus} 共有 ${campusClasses.length} 个班级，开始统计学生人数...`);

      // 3. 遍历每个班级，统计在校生人数
      for (const cls of campusClasses) {
        const normalizedClsCampus = normalizeCampus(cls.campus);
        const classKey = `class_file_record_${normalizedClsCampus}_${cls.className}`;
        const classDataStr = localStorage.getItem(classKey);
        
        if (classDataStr) {
          try {
            const classData: Array<{
              name?: string;
              studentStatus?: string;
              idCard?: string;
            }> = JSON.parse(classDataStr);
            
            // 统计在校学生（状态为"在读"或空，且有姓名或身份证号）
            const enrolledCount = classData.filter((student) => {
              const hasInfo = student.name || student.idCard;
              const isEnrolled = !student.studentStatus || 
                                 student.studentStatus === '在读' || 
                                 student.studentStatus === '复学';
              return hasInfo && isEnrolled;
            }).length;
            
            console.log(`[在校生人数统计] 班级 ${cls.className} 有 ${enrolledCount} 个在校学生`);
            totalStudents += enrolledCount;
          } catch (error) {
            console.error(`[在校生人数统计] 读取班级 ${cls.className} 数据失败:`, error);
          }
        } else {
          console.log(`[在校生人数统计] 班级 ${cls.className} 没有数据，键名: ${classKey}`);
        }
      }

      console.log(`[在校生人数统计] 神殿 ${campus} 共有 ${totalStudents} 个在校学生`);
      return totalStudents;
    } catch (error) {
      console.error('从班级档案表计算在校生人数失败:', error);
      return 0;
    }
  };

  // 从API加载所有神殿数据
  const loadDataFromApi = async (year?: number | 'all') => {
    setLoading(true);
    try {
      const apiData = await campusCoreSummaryService.fetchAllCampusesSummaryWithYear(year);
      
      // 转换为本页面需要的格式
      const records: CampusCoreSummaryRecord[] = apiData.map((d, index) => ({
        id: `api-${Date.now()}-${index}`,
        序号: index + 1,
        神殿: d.神殿,
        在校生人数: d.在校生人数 || 0,
        班级数量: d.班级数量 || 0,
        智慧司人数: d.智慧司人数 || 0,
        干部人数: d.干部人数 || 0,
        员工人数: d.员工人数 || 0,
        就业班级数量: d.就业班级数量 || 0,
        毕业生人数: d.毕业生人数 || 0,
        就业率: d.就业率 || 0,
        就业薪资: d.就业薪资 || 0,
        薪资过万人数: d.薪资过万人数 || 0,
        口碑招生人数: d.口碑招生人数 || 0,
        口碑招生收入: d.口碑招生收入 || 0,
        新生入学人数: d.新生入学人数 || 0,
        新生流失人数: d.新生流失人数 || 0,
      }));
      
      setAllData(records);
      
      // 按当前神殿筛选
      const filtered = selectedCampusShort
        ? records.filter((r) => normalizeCampus(r['神殿']) === selectedCampusShort)
        : records;
      setDataSource(filtered);
      
      message.success(`已从API加载 ${records.length} 条神殿数据`);
    } catch (error) {
      console.error('从API加载数据失败:', error);
      message.error('从API加载数据失败，请检查后端服务');
    } finally {
      setLoading(false);
    }
  };

  // 加载数据 - 页面初始化时自动从API加载
  useEffect(() => {
    loadDataFromApi(selectedYear);
  }, [selectedYear]);

  // 神殿切换时过滤数据
  useEffect(() => {
    const filtered = selectedCampusShort
      ? allData.filter((r) => normalizeCampus(r['神殿']) === selectedCampusShort)
      : allData;
    setDataSource(filtered);
  }, [selectedCampusShort, allData]);

  const loadData = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const data: CampusCoreSummaryRecord[] = saved ? JSON.parse(saved) : [];
      setAllData(data);
      const filtered = selectedCampusShort
        ? data.filter((r) => normalizeCampus((r as any)['神殿'] || (r as any).campus) === selectedCampusShort)
        : data;
      if (selectedCampusShort && filtered.length === 0) {
        // 自动补空行并持久化，从班级档案表和班级列表自动计算
        const enrolledStudents = calculateEnrolledStudentsFromClassFiles(selectedCampusShort);
        const classCount = calculateClassCountFromClassList(selectedCampusShort);
        const zeroRow: CampusCoreSummaryRecord = {
          id: `auto-${Date.now()}`,
          序号: data.length + 1,
          神殿: selectedCampusShort,
          在校生人数: enrolledStudents, // 从数据源自动计算
          班级数量: classCount, // 从数据源自动计算
          智慧司人数: 0,
          干部人数: 0,
          员工人数: 0,
          就业班级数量: 0,
          毕业生人数: 0,
          就业率: 0,
          就业薪资: 0,
          薪资过万人数: 0,
          口碑招生人数: 0,
          口碑招生收入: 0,
          新生入学人数: 0,
          新生流失人数: 0,
        };
        const next = [...data, zeroRow];
        saveData(next);
      } else {
        // 如果已有数据，自动更新在校生人数和班级数量
        // 如果值为空（null/undefined）或0，则从数据源自动计算
        const updatedData = filtered.map((record) => {
          // 获取神殿名称（支持中文键和英文键）
          const campusRaw = record['神殿'] || (record as any).campus || '';
          const campus = normalizeCampus(campusRaw);
          
          console.log(`[数据加载] 处理神殿记录: 原始值="${campusRaw}", 规范化后="${campus}"`);
          
          const enrolledStudents = calculateEnrolledStudentsFromClassFiles(campus);
          const classCount = calculateClassCountFromClassList(campus);
          
          const updates: Partial<CampusCoreSummaryRecord> = {};
          
          // 如果在校生人数为空或0，且计算值>=0，则使用计算值
          const currentEnrolled = record['在校生人数'];
          if (currentEnrolled == null || currentEnrolled === 0) {
            updates['在校生人数'] = enrolledStudents;
            console.log(`[数据加载] 神殿 ${campus} 在校生人数: ${currentEnrolled} -> ${enrolledStudents}`);
          }
          
          // 如果班级数量为空或0，且计算值>=0，则使用计算值
          const currentClassCount = record['班级数量'];
          if (currentClassCount == null || currentClassCount === 0) {
            updates['班级数量'] = classCount;
            console.log(`[数据加载] 神殿 ${campus} 班级数量: ${currentClassCount} -> ${classCount}`);
          }
          
          return Object.keys(updates).length > 0 ? { ...record, ...updates } : record;
        });
        setDataSource(updatedData);
        
        // 同步到 allData 并保存
        const updatedAllData = data.map((record) => {
          const campus = normalizeCampus(record['神殿'] || (record as any).campus);
          if (selectedCampusShort && campus === selectedCampusShort) {
            const enrolledStudents = calculateEnrolledStudentsFromClassFiles(campus);
            const classCount = calculateClassCountFromClassList(campus);
            
            const updates: Partial<CampusCoreSummaryRecord> = {};
            
            const currentEnrolled = record['在校生人数'];
            if (currentEnrolled == null || currentEnrolled === 0) {
              updates['在校生人数'] = enrolledStudents;
            }
            
            const currentClassCount = record['班级数量'];
            if (currentClassCount == null || currentClassCount === 0) {
              updates['班级数量'] = classCount;
            }
            
            return Object.keys(updates).length > 0 ? { ...record, ...updates } : record;
          }
          return record;
        });
        setAllData(updatedAllData);
        saveData(updatedAllData);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('加载数据失败');
    }
  };

  // 保存数据到localStorage
  const saveData = (data: CampusCoreSummaryRecord[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setAllData(data);
      const filtered = selectedCampusShort
        ? data.filter((r) => normalizeCampus((r as any)['神殿'] || (r as any).campus) === selectedCampusShort)
        : data;
      setDataSource(filtered);
    } catch (error) {
      console.error('保存数据失败:', error);
      message.error('保存数据失败');
    }
  };

  // 自动计算在校生人数（优先从班级档案表，否则使用公式计算）
  const calculateEnrolledStudents = (values: any, campus?: string): number => {
    // 优先从班级档案表读取
    if (campus) {
      const fromClassFiles = calculateEnrolledStudentsFromClassFiles(campus);
      if (fromClassFiles > 0) {
        return fromClassFiles;
      }
    }

    // 如果班级档案表没有数据，使用公式计算
    const newEnrollments = Number(values['新生入学人数'] || 0);
    const newAttrition = Number(values['新生流失人数'] || 0);
    const graduates = Number(values['毕业生人数'] || 0);
    
    // 基础计算：新生入学 - 新生流失 - 毕业生
    return Math.max(0, newEnrollments - newAttrition - graduates);
  };

  // 导出Excel
  const handleExport = () => {
    if (dataSource.length === 0) {
      message.warning('没有数据可导出');
      return;
    }

    try {
      // 准备CSV数据
      const headers = [
        '序号', '神殿', '在校生人数', '班级数量', '智慧司人数', '干部人数', 
        '员工人数', '就业班级数量', '毕业生人数', '就业率', '就业薪资', 
        '薪资过万人数', '口碑招生人数', '口碑招生收入', '新生入学人数', '新生流失人数'
      ];
      
      const csvContent = [
        headers.join(','),
        ...dataSource.map(row => [
          row.序号,
          row.神殿,
          row.在校生人数,
          row.班级数量,
          row.智慧司人数,
          row.干部人数,
          row.员工人数,
          row.就业班级数量,
          row.毕业生人数,
          row.就业率,
          row.就业薪资,
          row.薪资过万人数,
          row.口碑招生人数,
          row.口碑招生收入,
          row.新生入学人数,
          row.新生流失人数
        ].join(','))
      ].join('\n');

      // 添加BOM以支持Excel正确显示中文
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const campusSuffix = selectedCampusShort ? `_${selectedCampusShort}` : '_全部神殿';
      link.setAttribute('download', `神殿核心数据汇总表${campusSuffix}_${new Date().toLocaleDateString()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  // 导入Excel
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const rows = text.split('\n').filter(row => row.trim());
          
          if (rows.length < 2) {
            message.error('文件内容为空');
            return;
          }

          // 跳过标题行
          const dataRows = rows.slice(1);
          const importedData: CampusCoreSummaryRecord[] = dataRows.map((row, index) => {
            const cols = row.split(',');
            return {
              id: Date.now().toString() + index,
              序号: index + 1,
              神殿: cols[1]?.trim() || '',
              在校生人数: Number(cols[2]) || 0,
              班级数量: Number(cols[3]) || 0,
              智慧司人数: Number(cols[4]) || 0,
              干部人数: Number(cols[5]) || 0,
              员工人数: Number(cols[6]) || 0,
              就业班级数量: Number(cols[7]) || 0,
              毕业生人数: Number(cols[8]) || 0,
              就业率: Number(cols[9]) || 0,
              就业薪资: Number(cols[10]) || 0,
              薪资过万人数: Number(cols[11]) || 0,
              口碑招生人数: Number(cols[12]) || 0,
              口碑招生收入: Number(cols[13]) || 0,
              新生入学人数: Number(cols[14]) || 0,
              新生流失人数: Number(cols[15]) || 0,
            };
          });

          saveData(importedData);
          message.success(`成功导入 ${importedData.length} 条数据`);
        } catch (error) {
          console.error('导入失败:', error);
          message.error('导入失败，请检查文件格式');
        }
      };
      reader.readAsText(file, 'utf-8');
    };
    input.click();
  };

  // 表格列定义
  const columns: ColumnsType<CampusCoreSummaryRecord> = [
    {
      title: '序号',
      dataIndex: '序号',
      key: '序号',
      width: 70,
      fixed: 'left',
      align: 'center',
    },
    {
      title: '神殿',
      dataIndex: '神殿',
      key: '神殿',
      width: 120,
      fixed: 'left',
      align: 'center',
    },
    {
      title: '在校生人数',
      dataIndex: '在校生人数',
      key: '在校生人数',
      width: 120,
      align: 'center',
    },
    {
      title: '班级数量',
      dataIndex: '班级数量',
      key: '班级数量',
      width: 100,
      align: 'center',
    },
    {
      title: '智慧司人数',
      dataIndex: '智慧司人数',
      key: '智慧司人数',
      width: 120,
      align: 'center',
    },
    {
      title: '干部人数',
      dataIndex: '干部人数',
      key: '干部人数',
      width: 100,
      align: 'center',
    },
    {
      title: '员工人数',
      dataIndex: '员工人数',
      key: '员工人数',
      width: 100,
      align: 'center',
    },
    {
      title: '就业班级数量',
      dataIndex: '就业班级数量',
      key: '就业班级数量',
      width: 130,
      align: 'center',
    },
    {
      title: '毕业生人数',
      dataIndex: '毕业生人数',
      key: '毕业生人数',
      width: 120,
      align: 'center',
    },
    {
      title: '就业率',
      dataIndex: '就业率',
      key: '就业率',
      width: 100,
      align: 'center',
      render: (value) => `${value}%`,
    },
    {
      title: '就业薪资',
      dataIndex: '就业薪资',
      key: '就业薪资',
      width: 100,
      align: 'center',
    },
    {
      title: '薪资过万人数',
      dataIndex: '薪资过万人数',
      key: '薪资过万人数',
      width: 130,
      align: 'center',
    },
    {
      title: '口碑招生人数',
      dataIndex: '口碑招生人数',
      key: '口碑招生人数',
      width: 130,
      align: 'center',
    },
    {
      title: '口碑招生收入',
      dataIndex: '口碑招生收入',
      key: '口碑招生收入',
      width: 130,
      align: 'center',
    },
    {
      title: '新生入学人数',
      dataIndex: '新生入学人数',
      key: '新生入学人数',
      width: 130,
      align: 'center',
    },
    {
      title: '新生流失人数',
      dataIndex: '新生流失人数',
      key: '新生流失人数',
      width: 130,
      align: 'center',
    },

  ];

  // 计算汇总数据
  const summary = {
    在校生人数: dataSource.reduce((sum, item) => sum + item.在校生人数, 0),
    班级数量: dataSource.reduce((sum, item) => sum + item.班级数量, 0),
    智慧司人数: dataSource.reduce((sum, item) => sum + item.智慧司人数, 0),
    干部人数: dataSource.reduce((sum, item) => sum + item.干部人数, 0),
    员工人数: dataSource.reduce((sum, item) => sum + item.员工人数, 0),
    就业班级数量: dataSource.reduce((sum, item) => sum + item.就业班级数量, 0),
    毕业生人数: dataSource.reduce((sum, item) => sum + item.毕业生人数, 0),
    薪资过万人数: dataSource.reduce((sum, item) => sum + item.薪资过万人数, 0),
    口碑招生人数: dataSource.reduce((sum, item) => sum + item.口碑招生人数, 0),
    口碑招生收入: dataSource.reduce((sum, item) => sum + item.口碑招生收入, 0),
    新生入学人数: dataSource.reduce((sum, item) => sum + item.新生入学人数, 0),
    新生流失人数: dataSource.reduce((sum, item) => sum + item.新生流失人数, 0),
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic title="在校生总数" value={summary.在校生人数} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="班级总数" value={summary.班级数量} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="智慧司总人数" value={summary.智慧司人数} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="毕业生总数" value={summary.毕业生人数} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="口碑招生总数" value={summary.口碑招生人数} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="新生入学总数" value={summary.新生入学人数} />
          </Card>
        </Col>
      </Row>

      {/* 操作按钮 */}
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <span>选择年份：</span>
          <Select
            value={selectedYear}
            onChange={(value) => setSelectedYear(value)}
            style={{ width: 120 }}
          >
            {yearOptions.map((year) => (
              <Select.Option key={year} value={year}>
                {year === 'all' ? '历史合计' : `${year}年`}
              </Select.Option>
            ))}
          </Select>
          <Button icon={<UploadOutlined />} onClick={handleImport}>
            导入Excel
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出Excel
          </Button>
          <Button 
            type="primary"
            icon={<SyncOutlined spin={loading} />} 
            loading={loading}
            onClick={async () => {
              // 从API获取数据（使用V2版本，更可靠）
              setLoading(true);
              try {
                if (selectedCampusShort) {
                  // 获取当前神殿的数据（使用新版API）
                  const yearParam = selectedYear === 'all' ? undefined : selectedYear;
                  const apiData = await campusCoreSummaryService.fetchCampusCoreSummaryV2(selectedCampusShort, yearParam);
                  
                  // 查找现有记录
                  const existingIndex = allData.findIndex(r => 
                    normalizeCampus(r['神殿'] || (r as any).campus) === selectedCampusShort
                  );
                  
                  const newRecord: CampusCoreSummaryRecord = {
                    id: existingIndex >= 0 ? allData[existingIndex].id : `api-${Date.now()}`,
                    序号: existingIndex >= 0 ? allData[existingIndex].序号 : allData.length + 1,
                    神殿: apiData.神殿,
                    在校生人数: apiData.在校生人数,
                    班级数量: apiData.班级数量,
                    智慧司人数: apiData.智慧司人数 || 0,
                    干部人数: apiData.干部人数 || 0,
                    员工人数: apiData.员工人数 || 0,
                    就业班级数量: apiData.就业班级数量,
                    毕业生人数: apiData.毕业生人数,
                    就业率: apiData.就业率,
                    就业薪资: apiData.就业薪资,
                    薪资过万人数: apiData.薪资过万人数,
                    口碑招生人数: apiData.口碑招生人数,
                    口碑招生收入: apiData.口碑招生收入,
                    新生入学人数: apiData.新生入学人数,
                    新生流失人数: apiData.新生流失人数,
                  };
                  
                  let updatedAllData: CampusCoreSummaryRecord[];
                  if (existingIndex >= 0) {
                    updatedAllData = [...allData];
                    updatedAllData[existingIndex] = newRecord;
                  } else {
                    updatedAllData = [...allData, newRecord];
                  }
                  
                  saveData(updatedAllData);
                  message.success(`已从API获取 ${selectedCampusShort} 神殿数据`);
                } else {
                  message.warning('请先选择神殿');
                }
              } catch (error) {
                console.error('从API获取数据失败:', error);
                message.error('从API获取数据失败，请检查后端服务');
              } finally {
                setLoading(false);
              }
            }}
          >
            从API获取数据
          </Button>
          <Button 
            type="primary"
            icon={<SaveOutlined />} 
            loading={saving}
            onClick={handleSaveToDb}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            保存到数据库
          </Button>
        </Space>

        {/* 数据表格 */}
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          loading={loading}
          scroll={{ x: 2000, y: 600 }}
          pagination={{
            defaultPageSize: 10,
            showTotal: (total) => `共 ${total} 条记录`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          summary={() => (
            <Table.Summary fixed="bottom">
              <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold', textAlign: 'center' }}>
                <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
                <Table.Summary.Cell index={1}>-</Table.Summary.Cell>
                <Table.Summary.Cell index={2}>{summary.在校生人数}</Table.Summary.Cell>
                <Table.Summary.Cell index={3}>{summary.班级数量}</Table.Summary.Cell>
                <Table.Summary.Cell index={4}>{summary.智慧司人数}</Table.Summary.Cell>
                <Table.Summary.Cell index={5}>{summary.干部人数}</Table.Summary.Cell>
                <Table.Summary.Cell index={6}>{summary.员工人数}</Table.Summary.Cell>
                <Table.Summary.Cell index={7}>{summary.就业班级数量}</Table.Summary.Cell>
                <Table.Summary.Cell index={8}>{summary.毕业生人数}</Table.Summary.Cell>
                <Table.Summary.Cell index={9}>-</Table.Summary.Cell>
                <Table.Summary.Cell index={10}>-</Table.Summary.Cell>
                <Table.Summary.Cell index={11}>{summary.薪资过万人数}</Table.Summary.Cell>
                <Table.Summary.Cell index={12}>{summary.口碑招生人数}</Table.Summary.Cell>
                <Table.Summary.Cell index={13}>{summary.口碑招生收入}</Table.Summary.Cell>
                <Table.Summary.Cell index={14}>{summary.新生入学人数}</Table.Summary.Cell>
                <Table.Summary.Cell index={15}>{summary.新生流失人数}</Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </div>
  );
};

export default CampusCoreSummaryPage;
