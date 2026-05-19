// 学术 -> 教员 -> 学员满意度得分表（本地可编辑 + 持久化）
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { App, Card, Typography, Row, Col, Input, InputNumber, Space, Button, Divider, Table, Select, Tabs, Modal, Upload, Alert, Progress, List, Tag } from 'antd';
import { UploadOutlined, FileExcelOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import { useCampusStore } from '@/stores/campusStore';
import SatisfactionAverage from './4-student-satisfaction-average';
import { studentSatisfactionDetailService } from '@/services/service';
import { fetchAssignments, fetchCampuses, fetchTeachers, fetchClasses } from '@/services/configMaster';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;

type RowItem = {
  key: string;
  category: string;
  item: string;
  m1?: number; m2?: number; m3?: number; m4?: number; m5?: number; m6?: number;
  m7?: number; m8?: number; m9?: number; m10?: number; m11?: number; m12?: number;
};

type Meta = {
  campusName: string;
  year: number;
  teacherName: string;
  className: string;
};

const SURVEY_DEF: Array<{ category: string; items: string[] }> = [
  {
    category: '课堂管理',
    items: [
      '1.学员看视频、玩游戏、睡觉、说话、接打手机等课堂问题是否进行及时处理。',
      '2.学员练习期间，教员是否转班巡视每位学员练习过程。',
      '3.学员未完成作业、抄作业等作业问题均进行及时处理。',
      '4.对出勤存在问题的学生，教员是否能进行及时处理。',
    ],
  },
  {
    category: '内容讲解',
    items: [
      '5.教员是否传达积极的学习心态、鼓励学员认真学习、讲述正确的学习方法。',
      '6.教员授课过程中是否熟识所讲解的课程，上机演示是否流畅。',
      '7.重点突出，反复总结及回顾。',
      '8.授课语言清晰、简练、易懂。',
      '9.声音洪亮，语速合理，声音抑扬顿挫。',
      '10.能否讲解企业实际应用，传达工作经验和项目经验。',
    ],
  },
  {
    category: '课堂互动',
    items: [
      '11.教员在授课期间与学员互动、提问、交流多。',
      '12.教员授课方式是否生动幽默，能活跃课堂气氛。',
      '13.教员授课过程中是否表扬和鼓励学员，激发学员积极性。',
    ],
  },
  {
    category: '耐心辅导',
    items: [
      '14.教员能否有效地解答学员的问题。',
      '15.教员是否耐心辅导，教学态度热情。',
      '16.对学员作业进行细致点评。',
      '17.练习课能抽出较多时间指导学员。',
    ],
  },
  {
    category: '授课效果',
    items: [
      '18.学员是否能够理解和消化课上的内容。',
      '19.学员能掌握课上和课下实验的制作思路和制作步骤。',
      '20.学员能否独立完成课上和课下的实验作业。',
    ],
  },
];

const buildRows = (): RowItem[] => {
  const rows: RowItem[] = [];
  SURVEY_DEF.forEach(def => {
    def.items.forEach((txt, idx) => {
      rows.push({ key: `${def.category}-${idx}`, category: def.category, item: txt });
    });
  });
  return rows;
};

const sumNumbers = (arr: (number | undefined)[]) => {
  const vals = arr.filter((v): v is number => typeof v === 'number');
  if (!vals.length) return 0;
  const s = vals.reduce((a, b) => a + b, 0);
  return Math.round(s * 10) / 10;
};

const avg = (arr: (number | undefined)[]) => {
  const vals = arr.filter((v): v is number => typeof v === 'number');
  if (!vals.length) return undefined;
  const s = vals.reduce((a, b) => a + b, 0);
  return Math.round((s / vals.length) * 10) / 10;
};

const computeCategoryRowSpan = (data: RowItem[]) => {
  const spans: Record<string, number> = {};
  let idx = 0;
  while (idx < data.length) {
    const cat = data[idx].category;
    let count = 1;
    for (let j = idx + 1; j < data.length && data[j].category === cat; j += 1) {
      count += 1;
    }
    spans[data[idx].key] = count;
    for (let k = 1; k < count; k += 1) {
      spans[data[idx + k].key] = 0;
    }
    idx += count;
  }
  return spans;
};

// Excel 导入解析结果类型
type ImportedTeacherData = {
  teacherName: string;
  rows: RowItem[];
  status: 'pending' | 'success' | 'error';
  message?: string;
};

type ImportPreview = {
  campusName: string;
  year: number;
  teachers: ImportedTeacherData[];
  averageSheet?: { teacherName: string; rows: RowItem[] };
};

const SatisfactionPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const [meta, setMeta] = useState<Meta>({
    campusName: currentCampus || '石美',
    year: new Date().getFullYear(),
    teacherName: '',
    className: '',
  });
  const [rows, setRows] = useState<RowItem[]>(() => buildRows());
  const [backendId, setBackendId] = useState<number | null>(null);
  const [teacherOptions, setTeacherOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [classOptions, setClassOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [teacherIdByName, setTeacherIdByName] = useState<Record<string, number>>({});
  
  // Excel 导入相关状态
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async (options?: { teacher?: string; className?: string; year?: number }) => {
    try {
      const targetTeacher = options?.teacher ?? meta.teacherName;
      const targetClass = options?.className ?? meta.className;
      const targetYear = options?.year ?? meta.year;
      const list = await studentSatisfactionDetailService.getList(
        currentCampus || meta.campusName,
        targetTeacher,
        targetClass,
        targetYear,
      );
      if (list && list.length) {
        const rec = list[0];
        setBackendId(rec.id);
        setRows(Array.isArray(rec.rows) ? rec.rows : buildRows());
        setMeta(m => ({
          ...m,
          campusName: rec.campusName,
          teacherName: rec.teacherName,
          className: rec.className || targetClass,
          year: rec.year || targetYear,
        }));
      } else {
        setBackendId(null);
        setRows(buildRows());
      }
    } catch (error) {
      console.error('加载满意度详情失败', error);
      message.error('加载满意度详情失败');
    }
  };

  useEffect(() => {
    loadData();
  }, [currentCampus, meta.teacherName, meta.className, meta.year]);

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const campuses = await fetchCampuses();
        const campusCode = campuses.find(c => c.name === (currentCampus || meta.campusName))?.code;
        const teacherRes = await fetchTeachers({ campus_code: campusCode, active: true });
        const idMap: Record<string, number> = {};
        teacherRes.forEach(t => {
          if (t?.name) idMap[t.name] = t.id;
        });
        setTeacherIdByName(idMap);

        // 只使用当前神殿的教员，不再添加其他神殿的满意度记录中的教员
        const names = new Set<string>();
        teacherRes.forEach(t => names.add(t.name));
        const opts = Array.from(names).filter(Boolean).map(n => ({ label: n, value: n }));
        setTeacherOptions(opts);
        if (!meta.teacherName && opts.length) {
          setMeta(m => ({ ...m, teacherName: opts[0].value }));
        }
      } catch (error) {
        console.error('加载教员列表失败', error);
      }
    };
    loadTeachers();
  }, [currentCampus, meta.campusName]);

  const persist = async () => {
    try {
      const payload = {
        campusName: currentCampus || meta.campusName,
        teacherName: meta.teacherName,
        className: meta.className,
        year: meta.year,
        rows,
      };
      if (backendId) {
        const updated = await studentSatisfactionDetailService.update({ id: backendId, ...payload });
        setBackendId(updated.id);
        message.success('已更新到后端');
      } else {
        const created = await studentSatisfactionDetailService.create(payload as any);
        setBackendId(created.id);
        message.success('已保存到后端');
      }
    } catch (error) {
      console.error('保存满意度详情失败', error);
      message.error('保存失败，请重试');
    }
  };

  const clearAll = () => {
    setRows(buildRows());
  };

  // ==================== Excel 导入功能 ====================
  
  /**
   * 解析 Excel 文件中的单个 Sheet
   * 根据你提供的表格结构：
   * - 标题行: "学员满意度得分"
   * - 表头行: 空/分类 | 事件 | 1月 | 2月 | ... | 12月 | 平均
   * - 数据行: 分类(合并单元格) | 事件描述 | 每月分数...
   * - 总分行: 总分 | 空 | 各月总分...
   */
  const parseSheetToRows = (sheet: XLSX.WorkSheet, sheetName: string): RowItem[] => {
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
    console.log(`[Excel导入] 解析 Sheet: ${sheetName}, 总行数: ${jsonData.length}`);
    console.log(`[Excel导入] 前5行数据预览:`, jsonData.slice(0, 5));
    
    const parsedRows: RowItem[] = [];
    let currentCategory = '';
    let rowIndex = 0;
    
    // 定义分类关键词
    const categoryKeywords = ['课堂管理', '内容讲解', '课堂互动', '耐心辅导', '授课效果'];
    
    // 找到月份列的起始位置（通过检测"1月"或数字列）
    let monthStartCol = 2; // 默认从第3列开始（索引2）
    let eventCol = 1; // 默认事件在第2列（索引1）
    
    // 扫描前几行找表头
    for (let i = 0; i < Math.min(jsonData.length, 5); i++) {
      const row = jsonData[i];
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').trim();
        if (cell === '1月' || cell === '1 月' || cell.match(/^1月$/)) {
          monthStartCol = j;
          eventCol = j - 1;
          console.log(`[Excel导入] 检测到1月列位置: ${monthStartCol}, 事件列: ${eventCol}`);
          break;
        }
        if (cell === '事件' || cell.includes('事件')) {
          eventCol = j;
          monthStartCol = j + 1;
          console.log(`[Excel导入] 检测到事件列位置: ${eventCol}`);
        }
      }
    }
    
    // 跳过表头行，找到数据起始行
    let dataStartRow = 0;
    for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
      const row = jsonData[i];
      if (!row || row.length < 3) continue;
      
      // 检查是否有分类关键词或者事件列以数字开头
      for (let j = 0; j < Math.min(row.length, 3); j++) {
        const cell = String(row[j] || '').trim();
        if (categoryKeywords.some(k => cell.includes(k)) || /^\d+\./.test(cell)) {
          dataStartRow = i;
          console.log(`[Excel导入] 数据起始行: ${dataStartRow}, 触发单元格: "${cell}"`);
          break;
        }
      }
      if (dataStartRow > 0) break;
    }
    
    // 解析数据行
    for (let i = dataStartRow; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length < 3) continue;
      
      // 检查总分行（通常在第一个单元格）
      const firstCell = String(row[0] || '').trim();
      if (firstCell === '总分') {
        console.log(`[Excel导入] 跳过总分行: 行${i}`);
        continue;
      }
      
      // 确定分类列位置（通常在事件列之前，索引为 eventCol - 1）
      const categoryCol = eventCol > 0 ? eventCol - 1 : 0;
      
      // 读取分类和事件
      let rowCategory = '';
      let rowEvent = '';
      
      // 读取分类列（可能在分类列或第一个单元格）
      if (categoryCol >= 0 && categoryCol < row.length) {
        const categoryCell = String(row[categoryCol] || '').trim();
        if (categoryKeywords.some(k => categoryCell.includes(k))) {
          rowCategory = categoryCell;
          currentCategory = categoryCell;
        }
      }
      
      // 如果分类列没有找到，尝试第一个单元格
      if (!rowCategory && row.length > 0) {
        const firstCellCheck = String(row[0] || '').trim();
        if (categoryKeywords.some(k => firstCellCheck.includes(k))) {
          rowCategory = firstCellCheck;
          currentCategory = firstCellCheck;
        }
      }
      
      // 使用当前分类（如果本行没有分类则继承上一行的）
      if (!rowCategory && currentCategory) {
        rowCategory = currentCategory;
      }
      
      // 读取事件列（使用已检测到的 eventCol 位置）
      if (eventCol >= 0 && eventCol < row.length) {
        rowEvent = String(row[eventCol] || '').trim();
      }
      
      // 如果事件列为空，尝试从第一个非分类列读取
      if (!rowEvent) {
        // 尝试从分类列的下一个位置读取
        if (categoryCol + 1 < row.length) {
          rowEvent = String(row[categoryCol + 1] || '').trim();
        }
        // 或者从第一个位置读取（如果分类不在第一列）
        else if (row.length > 1 && categoryCol !== 0) {
          rowEvent = String(row[0] || '').trim();
        }
      }
      
      // 如果还是没找到事件，跳过这行
      if (!rowEvent || rowEvent === '') continue;
      
      // 跳过如果事件看起来像是分类（包含分类关键词）
      if (categoryKeywords.some(k => rowEvent.includes(k))) {
        continue;
      }
      
      // 解析每月分数（从 monthStartCol 开始）
      const monthScores: Record<string, number | undefined> = {};
      for (let m = 1; m <= 12; m++) {
        const colIdx = monthStartCol + m - 1;
        if (colIdx < row.length) {
          const val = row[colIdx];
          if (val !== undefined && val !== '' && val !== null) {
            const num = parseFloat(String(val));
            if (!isNaN(num) && num >= 0 && num <= 100) {
              monthScores[`m${m}`] = Math.round(num * 10) / 10;
            }
          }
        }
      }
      
      const rowItem: RowItem = {
        key: `${rowCategory}-${rowIndex}`,
        category: rowCategory,
        item: rowEvent,
        ...monthScores,
      };
      
      parsedRows.push(rowItem);
      rowIndex++;
      
      console.log(`[Excel导入] 行${i}: 分类="${rowCategory}", 事件="${rowEvent.substring(0, 20)}...", 分数示例: m1=${monthScores.m1}, m2=${monthScores.m2}`);
    }
    
    console.log(`[Excel导入] Sheet ${sheetName} 解析完成, 共 ${parsedRows.length} 行数据`);
    return parsedRows;
  };
  
  /**
   * 处理 Excel 文件上传
   */
  const handleExcelUpload = async (file: File) => {
    console.log('[Excel导入] 开始解析文件:', file.name);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      console.log('[Excel导入] Sheet 列表:', workbook.SheetNames);
      
      const teachers: ImportedTeacherData[] = [];
      let averageSheet: ImportedTeacherData | undefined;
      
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const trimmedName = sheetName.trim();
        
        // 跳过空 Sheet
        if (!sheet || !sheet['!ref']) {
          console.log(`[Excel导入] 跳过空 Sheet: ${sheetName}`);
          continue;
        }
        
        // 解析 Sheet 数据
        const parsedRows = parseSheetToRows(sheet, sheetName);
        
        if (parsedRows.length === 0) {
          console.log(`[Excel导入] Sheet ${sheetName} 无有效数据，跳过`);
          continue;
        }
        
        // 判断是否是平均值 Sheet
        const isAverageSheet = trimmedName.includes('平均') || 
                               trimmedName.toLowerCase().includes('average') ||
                               trimmedName.toLowerCase().includes('avg');
        
        const teacherData: ImportedTeacherData = {
          teacherName: trimmedName,
          rows: parsedRows,
          status: 'pending',
        };
        
        if (isAverageSheet) {
          averageSheet = teacherData;
          console.log(`[Excel导入] 检测到平均值 Sheet: ${sheetName}`);
        } else {
          teachers.push(teacherData);
          console.log(`[Excel导入] 添加教员 Sheet: ${sheetName}, 数据行数: ${parsedRows.length}`);
        }
      }
      
      if (teachers.length === 0) {
        message.error('未在 Excel 文件中找到有效的教员数据');
        return;
      }
      
      // 设置预览数据
      const preview: ImportPreview = {
        campusName: currentCampus || meta.campusName,
        year: meta.year,
        teachers,
        averageSheet,
      };
      
      setImportPreview(preview);
      setImportModalOpen(true);
      
      message.success(`成功解析 ${teachers.length} 个教员的数据${averageSheet ? '（含平均值 Sheet）' : ''}`);
      
    } catch (error) {
      console.error('[Excel导入] 解析失败:', error);
      message.error('Excel 文件解析失败，请检查文件格式');
    }
  };
  
  /**
   * 执行导入：将解析的数据保存到后端
   */
  const handleConfirmImport = async () => {
    if (!importPreview || importPreview.teachers.length === 0) {
      message.warning('没有可导入的数据');
      return;
    }
    
    setImporting(true);
    setImportProgress(0);
    
    const { campusName, year, teachers } = importPreview;
    const total = teachers.length;
    let successCount = 0;
    let errorCount = 0;
    
    const updatedTeachers = [...teachers];
    
    for (let i = 0; i < teachers.length; i++) {
      const teacher = teachers[i];
      
      try {
        // 检查是否已存在记录
        const existingList = await studentSatisfactionDetailService.getList(
          campusName,
          teacher.teacherName,
          '', // className 为空，因为 Excel 没有班级信息
          year,
        );
        
        const payload = {
          campusName,
          year,
          teacherName: teacher.teacherName,
          className: '', // Excel 导入时班级为空
          rows: teacher.rows,
        };
        
        if (existingList && existingList.length > 0) {
          // 更新现有记录
          await studentSatisfactionDetailService.update({
            id: existingList[0].id,
            ...payload,
          });
          console.log(`[Excel导入] 更新教员 ${teacher.teacherName} 的数据`);
        } else {
          // 创建新记录
          await studentSatisfactionDetailService.create(payload as any);
          console.log(`[Excel导入] 创建教员 ${teacher.teacherName} 的数据`);
        }
        
        updatedTeachers[i] = { ...teacher, status: 'success', message: '导入成功' };
        successCount++;
        
      } catch (error: any) {
        console.error(`[Excel导入] 教员 ${teacher.teacherName} 导入失败:`, error);
        updatedTeachers[i] = { 
          ...teacher, 
          status: 'error', 
          message: error?.response?.data?.detail || error?.message || '导入失败' 
        };
        errorCount++;
      }
      
      setImportProgress(Math.round(((i + 1) / total) * 100));
      setImportPreview(prev => prev ? { ...prev, teachers: updatedTeachers } : null);
    }
    
    setImporting(false);
    
    if (successCount > 0) {
      message.success(`成功导入 ${successCount} 个教员的数据`);
      // 刷新教员列表（只显示当前神殿的教员）
      const campuses = await fetchCampuses();
      const campusCode = campuses.find(c => c.name === campusName)?.code;
      const teacherRes = await fetchTeachers({ campus_code: campusCode, active: true });
      const names = new Set<string>();
      teacherRes.forEach(t => names.add(t.name));
      const opts = Array.from(names).filter(Boolean).map(n => ({ label: n, value: n }));
      setTeacherOptions(opts);
    }
    
    if (errorCount > 0) {
      message.warning(`${errorCount} 个教员数据导入失败，请查看详情`);
    }
  };
  
  /**
   * 关闭导入弹窗并重置状态
   */
  const handleCloseImportModal = () => {
    setImportModalOpen(false);
    setImportPreview(null);
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const categoryRowSpanMap = useMemo(() => computeCategoryRowSpan(rows), [rows]);

  const columns: ColumnsType<RowItem> = [
    {
      title: '分类',
      dataIndex: 'category',
      width: 110,
      fixed: 'left',
      onCell: (record) => ({
        rowSpan: categoryRowSpanMap[record.key] ?? 1,
      }),
    },
    { title: '事件', dataIndex: 'item', width: 400, fixed: 'left' },
    ...Array.from({ length: 12 }).map((_, i) => ({
      title: `${i + 1}月`,
      dataIndex: `m${i + 1}`,
      width: 100,
      align: 'center' as const,
      render: (_: any, _r: RowItem, rowIdx: number) => (
        <InputNumber
          min={0}
          max={100}
          step={0.1}
          precision={1}
          style={{ width: '100%' }}
          value={(rows[rowIdx] as any)[`m${i + 1}`] as number | undefined}
          onChange={(val) =>
            setRows(prev =>
              prev.map((rr, idx) =>
                idx === rowIdx
                  ? ({ ...rr, [`m${i + 1}`]: typeof val === 'number' ? Number(val.toFixed(1)) : undefined } as any)
                  : rr,
              ),
            )
          }
        />
      ),
    })),
    { title: '平均分', key: 'avg', width: 100, align: 'center',
      render: (_: any, r: RowItem) => {
        const v = avg([r.m1, r.m2, r.m3, r.m4, r.m5, r.m6, r.m7, r.m8, r.m9, r.m10, r.m11, r.m12]);
        return <Input readOnly value={typeof v === 'number' ? v.toFixed(1) : '-'} />;
      }
    },
  ];

  // 总分：每月各项的总分；最后一列（原“平均分”列位置）改为“各行平均分之和”
  const totalRow = useMemo(() => {
    const monthTotals: number[] = [];
    for (let i = 1; i <= 12; i++) {
      const vals = rows.map(r => (r as any)[`m${i}`] as number | undefined);
      monthTotals.push(sumNumbers(vals));
    }

    // 按需求：总分行最后一列 = 每一行“平均分”求和（每行平均分为 12 个月均值）
    const rowAvgs = rows.map(r =>
      avg([r.m1, r.m2, r.m3, r.m4, r.m5, r.m6, r.m7, r.m8, r.m9, r.m10, r.m11, r.m12]),
    );
    const overall = sumNumbers(rowAvgs);

    return { monthTotals, overall };
  }, [rows]);

  const detailNode = (
    <Card bordered={false} style={{ background: '#f5f7fa' }}>
      <Title level={4} style={{ marginBottom: 12 }}>学员满意度得分</Title>

      {/* 顶部信息 */}
      <Row gutter={[12, 8]}>
        <Col span={6}>
          <Space>
            <Text strong>神殿名称</Text>
            <Input disabled value={currentCampus || meta.campusName} />
          </Space>
        </Col>
        <Col span={6}>
          <Space>
            <Text strong>年份</Text>
            <InputNumber
              style={{ width: 120 }}
              min={2000}
              max={2100}
              value={meta.year}
              onChange={(v) => {
                const nextYear = Number(v || new Date().getFullYear());
                setMeta(m => ({ ...m, year: nextYear }));
                loadData({ year: nextYear });
              }}
            />
          </Space>
        </Col>
        <Col span={6}>
          <Space>
            <Text strong>教员姓名</Text>
            <Select
              style={{ width: 220 }}
              placeholder="选择或输入教员"
              showSearch
              allowClear
              value={meta.teacherName || undefined}
              options={teacherOptions}
              onChange={async (v) => {
                const nextTeacher = v || '';
                setMeta(m => ({ ...m, teacherName: nextTeacher, className: '' }));
                setClassOptions([]);

                // 读取配置中心的“教员-班级关联”
                const teacherId = teacherIdByName[nextTeacher];
                if (teacherId) {
                  try {
                    const assignments = await fetchAssignments({ teacher_id: teacherId, active_only: true });
                    const classIdSet = new Set<number>();
                    assignments.forEach(a => {
                      const cid = Number((a as any)?.class_id ?? (a as any)?.classId);
                      if (!Number.isNaN(cid)) classIdSet.add(cid);
                    });

                    const campusName = currentCampus || meta.campusName;
                    const allClasses = await fetchClasses({ campus_name: campusName, active: true });
                    const classNames = allClasses
                      .filter(c => classIdSet.has(c.id))
                      .map(c => c.class_name)
                      .filter(Boolean);

                    const classOpts = classNames.map(n => ({ label: n, value: n }));
                    setClassOptions(classOpts);
                    const first = classOpts[0]?.value || '';
                    setMeta(m => ({ ...m, teacherName: nextTeacher, className: first }));
                    loadData({ teacher: nextTeacher, className: first });
                    return;
                  } catch (e) {
                    console.error('加载班级列表失败', e);
                  }
                }

                // 若配置中心无关联，仍允许查询（className 为空）
                loadData({ teacher: nextTeacher, className: '' });
              }}
              filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            />
          </Space>
        </Col>
        <Col span={6}>
          <Space>
            <Text strong>班级</Text>
            <Select
              style={{ width: 220 }}
              placeholder="请选择班级"
              allowClear
              value={meta.className || undefined}
              options={classOptions}
              onChange={(v) => {
                const nextClass = v || '';
                setMeta(m => ({ ...m, className: nextClass }));
                loadData({ className: nextClass });
              }}
              disabled={!meta.teacherName}
            />
          </Space>
        </Col>
      </Row>

      <Divider style={{ margin: '12px 0' }} />

      <Table<RowItem>
        bordered
        size="small"
        columns={columns}
        dataSource={rows}
        pagination={false}
        sticky
        scroll={{ x: 'max-content', y: 600 }}
        summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>总分</Table.Summary.Cell>
              <Table.Summary.Cell index={1} />
              {Array.from({ length: 12 }).map((_, i) => (
                <Table.Summary.Cell key={`sum-${i}`} index={i + 2} align="center">
                  <Text strong>{totalRow.monthTotals[i].toFixed(1)}</Text>
                </Table.Summary.Cell>
              ))}
              <Table.Summary.Cell index={14} align="center">
                <Text strong>{totalRow.overall.toFixed(1)}</Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
      />

      <Space style={{ marginTop: 12 }}>
        <Button type="primary" onClick={persist}>保存到后端</Button>
        <Button onClick={clearAll}>清空</Button>
        <Divider type="vertical" />
        <input
          type="file"
          ref={fileInputRef}
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleExcelUpload(file);
            }
          }}
        />
        <Button 
          icon={<FileExcelOutlined />} 
          onClick={() => fileInputRef.current?.click()}
        >
          从 Excel 导入
        </Button>
      </Space>
      
      {/* Excel 导入预览弹窗 */}
      <Modal
        title={<Space><FileExcelOutlined /> Excel 批量导入预览</Space>}
        open={importModalOpen}
        onCancel={handleCloseImportModal}
        width={800}
        footer={[
          <Button key="cancel" onClick={handleCloseImportModal} disabled={importing}>
            取消
          </Button>,
          <Button 
            key="import" 
            type="primary" 
            onClick={handleConfirmImport}
            loading={importing}
            disabled={!importPreview || importPreview.teachers.length === 0}
          >
            确认导入
          </Button>,
        ]}
      >
        {importPreview && (
          <div>
            <Alert
              type="info"
              showIcon
              message="导入说明"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>每个 Sheet 对应一个教员的满意度数据</li>
                  <li>Sheet 名称将作为教员姓名</li>
                  <li>名称包含"平均"的 Sheet 将被跳过（不导入）</li>
                  <li>如果教员数据已存在，将会更新覆盖</li>
                </ul>
              }
              style={{ marginBottom: 16 }}
            />
            
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Text strong>神殿：</Text> {importPreview.campusName}
              </Col>
              <Col span={8}>
                <Text strong>年份：</Text> 
                <InputNumber
                  size="small"
                  min={2000}
                  max={2100}
                  value={importPreview.year}
                  onChange={(v) => setImportPreview(prev => prev ? { ...prev, year: v || new Date().getFullYear() } : null)}
                  style={{ marginLeft: 8, width: 100 }}
                  disabled={importing}
                />
              </Col>
              <Col span={8}>
                <Text strong>教员数量：</Text> {importPreview.teachers.length}
              </Col>
            </Row>
            
            {importing && (
              <Progress percent={importProgress} status="active" style={{ marginBottom: 16 }} />
            )}
            
            <List
              bordered
              size="small"
              dataSource={importPreview.teachers}
              style={{ maxHeight: 400, overflow: 'auto' }}
              renderItem={(item, index) => (
                <List.Item
                  actions={[
                    item.status === 'pending' ? (
                      <Tag color="blue">待导入</Tag>
                    ) : item.status === 'success' ? (
                      <Tag icon={<CheckCircleOutlined />} color="success">成功</Tag>
                    ) : (
                      <Tag icon={<CloseCircleOutlined />} color="error" title={item.message}>失败</Tag>
                    ),
                  ]}
                >
                  <List.Item.Meta
                    title={<Text strong>{item.teacherName}</Text>}
                    description={`${item.rows.length} 条数据记录`}
                  />
                </List.Item>
              )}
            />
            
            {importPreview.averageSheet && (
              <Alert
                type="warning"
                message={`"${importPreview.averageSheet.teacherName}" Sheet 被识别为平均值汇总，将不会导入`}
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        )}
      </Modal>
    </Card>
  );

  return (
    <div style={{ padding: 24 }}>
      <Tabs
        items={[
          { key: 'detail', label: '个人详细', children: detailNode },
          { key: 'avg', label: '平均', children: <SatisfactionAverage /> },
        ]}
      />
    </div>
  );
};

export default SatisfactionPage;
