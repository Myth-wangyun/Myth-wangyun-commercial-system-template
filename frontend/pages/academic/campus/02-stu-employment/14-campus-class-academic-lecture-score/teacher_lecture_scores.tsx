// 智慧司听课成绩表（12个月评分表）
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { App, Card, Table, Typography, InputNumber, Space, Button, Select, Divider, Modal, Alert, Progress, List, Tag, Row, Col } from 'antd';
import { FileExcelOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useCampusStore } from '@/stores/campusStore';
import { fetchTeachers } from '@/services/configMaster';
import { teacherLectureScoreSheetService, teacherYearlyLectureScoreSummaryService } from '@/services/service';
import type {
  TeacherLectureScoreRow,
  TeacherLectureScoreSheet,
} from '@/types/service';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;

type TableRow = TeacherLectureScoreRow & { key: string; rowType?: 'total' };

// Excel 导入相关类型
type ImportedTeacherData = {
  teacherName: string;
  rows: TableRow[];
  status: 'pending' | 'success' | 'error';
  message?: string;
};

type SummaryRow = {
  key: string;
  name: string;
  m1?: number;
  m2?: number;
  m3?: number;
  m4?: number;
  m5?: number;
  m6?: number;
  m7?: number;
  m8?: number;
  m9?: number;
  m10?: number;
  m11?: number;
  m12?: number;
};

type ImportPreview = {
  campusName: string;
  year: number;
  teachers: ImportedTeacherData[];
  summarySheet?: { rows: SummaryRow[] };
};

const TEMPLATE_STANDARDS: Array<{ category: string; standard: string }> = [
  { category: '教学内容', standard: '1.是否按照最新16.0课程体系的授课' },
  { category: '教学内容', standard: '2.教学内容是否与16.0课件一致' },
  { category: '教学内容', standard: '3.是否按照5个阶段授课、13个环节授课的流程授课' },
  { category: '教学方法', standard: '4.知识点讲解是否使用3W1H教学方法授课' },
  { category: '教学方法', standard: '5.案例讲解是否使用项目教学法授课' },
  { category: '教学方法', standard: '6.教师的授课是否生动幽默' },
  { category: '关注学生', standard: '7.教员与学员互动、提问、交流较多。' },
  { category: '关注学生', standard: '8.能表扬和鼓励学员，激发学员兴趣。' },
  { category: '关注学生', standard: '9.教员能关注到每一名学员。' },
  { category: '关注学生', standard: '10.教员能有效地解答学员的问题，且没有不耐烦的情绪。' },
  { category: '关注学生', standard: '11.能抽出较多时间辅导学员。' },
  { category: '课堂管理', standard: '12.教员本人无迟到、早退、请假、课上接打手机等问题。' },
  { category: '课堂管理', standard: '13.学员迟到、早退、请假、旷课等出勤问题均进行及时妥善处理。' },
  { category: '课堂管理', standard: '14.学员未完成作业、抄作业等作业问题均进行及时妥善处理。' },
  { category: '课堂管理', standard: '15.学员看视频、玩游戏、打瞌睡、说话、接打手机等课堂问题均进行及时妥善处理。' },
  { category: '课堂管理', standard: '16.教员能对各类突发事件，进行及时妥善的处理。' },
  { category: '传授观念', standard: '17.教员能传授考勤、纪律的重要性。' },
  { category: '传授观念', standard: '18.教员能传授积极的学习心态。' },
  { category: '语言表达', standard: '19.授课语言清晰、简练、易懂。' },
  { category: '语言表达', standard: '20.声音洪亮，语速合理，声音抑扬顿挫。' },
];

const buildTemplateRows = (): TableRow[] =>
  TEMPLATE_STANDARDS.map((item, idx) => {
    return {
      key: `row-${idx}`,
      category: item.category,
      standard: item.standard,
      m1: undefined,
      m2: undefined,
      m3: undefined,
      m4: undefined,
      m5: undefined,
      m6: undefined,
      m7: undefined,
      m8: undefined,
      m9: undefined,
      m10: undefined,
      m11: undefined,
      m12: undefined,
      avg: undefined,
    };
  });

const calcAvg = (row: TeacherLectureScoreRow): number | undefined => {
  const vals = [
    row.m1,
    row.m2,
    row.m3,
    row.m4,
    row.m5,
    row.m6,
    row.m7,
    row.m8,
    row.m9,
    row.m10,
    row.m11,
    row.m12,
  ].filter((v): v is number => typeof v === 'number');
  if (!vals.length) return undefined;
  const sum = vals.reduce((a, b) => a + b, 0);
  return Math.round((sum / vals.length) * 10) / 10;
};

const TeacherLectureScoresPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const [year, setYear] = useState<number>(dayjs().year());
  const [teacherName, setTeacherName] = useState<string>('');
  const [teachers, setTeachers] = useState<{ label: string; value: string }[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [rows, setRows] = useState<TableRow[]>(() => buildTemplateRows());
  const [loading, setLoading] = useState(false);
  const [recordId, setRecordId] = useState<number | null>(null);
  
  // Excel 导入相关状态
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 合并行 span map
  const categorySpanMap = useMemo(() => {
    const map = new Map<string, { firstIndex: number; count: number }>();
    rows.forEach((r, idx) => {
      const m = map.get(r.category);
      if (!m) map.set(r.category, { firstIndex: idx, count: 1 });
      else m.count += 1;
    });
    return map;
  }, [rows]);

  const updateRowScore = (rowKey: string, monthIdx: number, val?: number | null) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== rowKey) return r;
        const next: any = { ...r };
        next[`m${monthIdx + 1}`] = val ?? undefined;
        next.avg = calcAvg(next);
        return next;
      }),
    );
  };

  const tableData = useMemo(() => {
    const data = rows.map((row) => ({ ...row }));
    const total: any = { key: 'total', rowType: 'total', category: '总分', standard: '' };
    for (let i = 1; i <= 12; i++) {
      const sum = data.reduce((s, r) => s + (r[`m${i}` as keyof TableRow] as number | undefined || 0), 0);
      total[`m${i}`] = Math.round(sum * 10) / 10;
    }
    const avgSum = data.reduce((s, r) => s + (r.avg || 0), 0);
    total.avg = Math.round(avgSum * 10) / 10;
    data.push(total);
    return data;
  }, [rows]);

  const columns: ColumnsType<TableRow> = [
    {
      title: '评分类别',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      fixed: 'left',
      onCell: (_record, rowIndex) => {
        if (!_record || _record.rowType === 'total' || rowIndex === undefined) return {};
        const info = categorySpanMap.get(_record.category);
        if (!info) return {};
        if (info.firstIndex === rowIndex) return { rowSpan: info.count };
        return { rowSpan: 0 };
      },
      render: (v: string) => v,
    },
    {
      title: '评分标准',
      dataIndex: 'standard',
      key: 'standard',
      width: 380,
      fixed: 'left',
      render: (v: string, record) => (record.rowType === 'total' ? '' : v),
    },
    ...Array.from({ length: 12 }).map((_, idx) => {
      const month = idx + 1;
      return {
        title: `${month}月`,
        dataIndex: `m${month}`,
        key: `m${month}`,
        align: 'center' as const,
        width: 90,
        render: (val: number | undefined, record: TableRow) => {
          if (record.rowType === 'total') return val ?? 0;
          return (
            <InputNumber
              min={0}
              max={5}
              step={0.1}
              value={val}
              onChange={(value) => updateRowScore(record.key, idx, value ?? undefined)}
              style={{ width: '100%' }}
            />
          );
        },
      };
    }),
    {
      title: '平均分',
      dataIndex: 'avg',
      key: 'avg',
      width: 100,
      align: 'center',
      render: (v: number | undefined, record: TableRow) => (record.rowType === 'total' ? v ?? 0 : v ?? ''),
    },
  ];

  // 加载教员列表（配置中心 + 数据库已有记录的并集）
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        setLoadingTeachers(true);
        const campusName = currentCampus || '';
        const stripped = campusName.replace(/神殿$/, '');

        // 1. 从配置中心获取教员列表（只获取当前神殿的，不 fallback 到全部）
        let configTeachers = (await fetchTeachers({ campus_name: campusName, active: true })) || [];
        if ((!configTeachers || configTeachers.length === 0) && stripped) {
          configTeachers = (await fetchTeachers({ campus_name: stripped, active: true })) || [];
        }
        // 注意：不再 fallback 到获取所有教员，避免混入其他神殿的教员

        // 2. 从数据库获取已有的听课成绩表记录中的教员姓名（只获取当前神殿的）
        let dbTeachers: string[] = [];
        try {
          const existingRecords = await teacherLectureScoreSheetService.list({
            campusName: campusName || undefined,
          });
          dbTeachers = [...new Set(existingRecords.map(r => r.teacherName).filter(Boolean))];
          console.log(`[教员列表] 从数据库获取到 ${dbTeachers.length} 个教员姓名 (神殿: ${campusName})`);
        } catch (error) {
          console.warn('获取数据库教员列表失败:', error);
        }

        // 3. 合并两个来源的教员姓名（去重）
        const teacherNamesSet = new Set<string>();
        configTeachers.forEach((t: any) => {
          if (t.name) teacherNamesSet.add(t.name);
        });
        dbTeachers.forEach(name => {
          if (name) teacherNamesSet.add(name);
        });

        // 4. 转换为下拉选项并排序
        const teacherOptions = Array.from(teacherNamesSet)
          .sort((a, b) => a.localeCompare(b, 'zh-CN'))
          .map(name => ({ label: name, value: name }));

        console.log(`[教员列表] 神殿: ${campusName}, 配置中心: ${configTeachers.length} 个, 数据库: ${dbTeachers.length} 个, 合并后: ${teacherOptions.length} 个`);

        setTeachers(teacherOptions);

        // 切换神殿时，清空当前选中的教员，让用户重新选择
        setTeacherName('');
      } catch (error) {
        console.error('加载教员列表失败:', error);
        message.error('加载教员列表失败');
      } finally {
        setLoadingTeachers(false);
      }
    };
    loadTeachers();
  }, [currentCampus]); // 只依赖 currentCampus，不依赖 teacherName

  // 打开页面自动加载一次最新数据（依赖：神殿 + 教员 + 年份）
  useEffect(() => {
    if (!currentCampus || !teacherName) return;
    handleLoadLatest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, teacherName, year]);

  const handleLoadLatest = async () => {
    try {
      setLoading(true);
      const list = await teacherLectureScoreSheetService.list({
        campusName: currentCampus || undefined,
        teacherName: teacherName || undefined,
        year,
      });
      if (list.length === 0) {
        message.info('暂无已保存数据，使用模板');
        setRecordId(null);
        setRows(buildTemplateRows());
        return;
      }
      const latest = list[0];
      setRecordId(latest.id);
      const restored = latest.rows.map((r, idx) => ({
        ...r,
        key: `row-${idx}`,
      }));
      setRows(restored);
      message.success('已加载最新数据');
    } catch (error) {
      console.error('加载数据失败', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!teacherName) {
      message.warning('请选择教员');
      return;
    }
    if (!currentCampus) {
      message.warning('请先选择神殿');
      return;
    }
    const normalizedRows = rows.map((r) => ({ ...r, avg: calcAvg(r) }));
    const payload = {
      campusName: currentCampus,
      teacherName,
      year,
      rows: normalizedRows,
    };
    try {
      setLoading(true);
      let res: TeacherLectureScoreSheet;
      if (recordId) {
        res = await teacherLectureScoreSheetService.update({ id: recordId, ...payload });
      } else {
        res = await teacherLectureScoreSheetService.create(payload);
        setRecordId(res.id);
      }
      message.success('已保存');
      if (res.rows) {
        setRows(res.rows.map((r, idx) => ({ ...r, key: `row-${idx}` })));
      }
    } catch (error: any) {
      console.error('保存失败', error);
      message.error(error?.response?.data?.detail || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRows(buildTemplateRows());
    setRecordId(null);
  };

  // ==================== Excel 导入功能 ====================
  
  /**
   * 解析 Excel 文件中的单个 Sheet（教员明细）
   * 表格结构：
   * - 第1行: 标题 "听课成绩表"
   * - 第2行: 表头（评分类别 | 评分标准 | 1月 | 2月 | ... | 12月 | 平均分）
   * - 第3-22行: 数据行（分类 | 评分标准 | 每月分数 | 平均分）
   * - 第23行: 总分行
   */
  const parseTeacherSheetToRows = (sheet: XLSX.WorkSheet, sheetName: string): TableRow[] => {
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
    console.log(`[Excel导入] 解析教员 Sheet: ${sheetName}, 总行数: ${jsonData.length}`);
    
    const parsedRows: TableRow[] = [];
    let currentCategory = '';
    let rowIndex = 0;
    
    // 分类关键词
    const categoryKeywords = ['教学内容', '教学方法', '关注学生', '课堂管理', '传授观念', '语言表达'];
    
    // 找到月份列的起始位置
    let monthStartCol = 2; // 默认从第3列开始（索引2）
    let standardCol = 1; // 默认评分标准在第2列（索引1）
    
    // 扫描前几行找表头
    for (let i = 0; i < Math.min(jsonData.length, 5); i++) {
      const row = jsonData[i];
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').trim();
        if (cell === '1月' || cell === '1 月' || cell.match(/^1月$/)) {
          monthStartCol = j;
          standardCol = j - 1;
          console.log(`[Excel导入] 检测到1月列位置: ${monthStartCol}, 评分标准列: ${standardCol}`);
          break;
        }
        if (cell === '评分标准' || cell.includes('评分标准')) {
          standardCol = j;
          monthStartCol = j + 1;
          console.log(`[Excel导入] 检测到评分标准列位置: ${standardCol}`);
        }
      }
    }
    
    // 跳过表头行，找到数据起始行
    let dataStartRow = 0;
    for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
      const row = jsonData[i];
      if (!row || row.length < 3) continue;
      
      // 检查是否有分类关键词或者评分标准以数字开头
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
      
      let rowCategory = '';
      let rowStandard = '';
      let scoreStartCol = monthStartCol;
      
      // 遍历前几列找分类和评分标准
      for (let j = 0; j < Math.min(row.length, 4); j++) {
        const cell = String(row[j] || '').trim();
        
        // 跳过总分行
        if (cell === '总分') {
          console.log(`[Excel导入] 跳过总分行: 行${i}`);
          break;
        }
        
        // 检查是否是分类
        if (categoryKeywords.some(k => cell.includes(k))) {
          rowCategory = cell;
          currentCategory = cell;
        }
        // 检查是否是评分标准（以数字+点开头）
        else if (/^\d+\./.test(cell)) {
          rowStandard = cell;
          scoreStartCol = j + 1;
        }
      }
      
      // 如果没找到评分标准，跳过这行
      if (!rowStandard) continue;
      
      // 使用当前分类（如果本行没有分类则继承上一行的）
      if (!rowCategory && currentCategory) {
        rowCategory = currentCategory;
      }
      
      // 解析每月分数
      const monthScores: Record<string, number | undefined> = {};
      for (let m = 1; m <= 12; m++) {
        const colIdx = scoreStartCol + m - 1;
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
      
      const rowItem: TableRow = {
        key: `row-${rowIndex}`,
        category: rowCategory,
        standard: rowStandard,
        ...monthScores,
        avg: undefined,
      };
      
      // 计算平均分
      rowItem.avg = calcAvg(rowItem);
      
      parsedRows.push(rowItem);
      rowIndex++;
      
      console.log(`[Excel导入] 行${i}: 分类="${rowCategory}", 标准="${rowStandard.substring(0, 15)}...", m1=${monthScores.m1}, m2=${monthScores.m2}`);
    }
    
    console.log(`[Excel导入] Sheet ${sheetName} 解析完成, 共 ${parsedRows.length} 行数据`);
    return parsedRows;
  };
  
  /**
   * 解析平均值 Sheet
   * 表格结构：每行是一个教员，包含姓名和1-12月的平均分
   */
  const parseSummarySheet = (sheet: XLSX.WorkSheet): SummaryRow[] => {
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
    console.log(`[Excel导入] 解析平均值 Sheet, 总行数: ${jsonData.length}`);
    
    const summaryRows: SummaryRow[] = [];
    
    // 找到数据起始行（跳过标题行）
    let dataStartRow = 0;
    let nameCol = 0;
    let monthStartCol = 1;
    
    for (let i = 0; i < Math.min(jsonData.length, 5); i++) {
      const row = jsonData[i];
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').trim();
        if (cell === '1月' || cell === '1 月') {
          monthStartCol = j;
          nameCol = j - 1;
          dataStartRow = i + 1;
          console.log(`[Excel导入] 平均值表头行: ${i}, 姓名列: ${nameCol}, 月份起始列: ${monthStartCol}`);
          break;
        }
        if (cell === '姓名' || cell === '教员姓名' || cell === '教员') {
          nameCol = j;
          monthStartCol = j + 1;
        }
      }
      if (dataStartRow > 0) break;
    }
    
    // 如果没找到表头，尝试从第一行开始
    if (dataStartRow === 0) {
      dataStartRow = 1;
    }
    
    // 解析数据行
    for (let i = dataStartRow; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length < 2) continue;
      
      const name = String(row[nameCol] || '').trim();
      if (!name || name === '总分' || name === '平均' || name === '合计') continue;
      
      const summaryRow: SummaryRow = {
        key: `summary-${i}`,
        name,
      };
      
      // 解析每月分数
      for (let m = 1; m <= 12; m++) {
        const colIdx = monthStartCol + m - 1;
        if (colIdx < row.length) {
          const val = row[colIdx];
          if (val !== undefined && val !== '' && val !== null) {
            const num = parseFloat(String(val));
            if (!isNaN(num)) {
              (summaryRow as any)[`m${m}`] = Math.round(num * 10) / 10;
            }
          }
        }
      }
      
      summaryRows.push(summaryRow);
      console.log(`[Excel导入] 平均值行: 教员="${name}", m1=${summaryRow.m1}, m2=${summaryRow.m2}`);
    }
    
    console.log(`[Excel导入] 平均值 Sheet 解析完成, 共 ${summaryRows.length} 行数据`);
    return summaryRows;
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
      
      const teachersData: ImportedTeacherData[] = [];
      let summarySheet: { rows: SummaryRow[] } | undefined;
      
      for (let idx = 0; idx < workbook.SheetNames.length; idx++) {
        const sheetName = workbook.SheetNames[idx];
        const sheet = workbook.Sheets[sheetName];
        const trimmedName = sheetName.trim();
        
        // 跳过空 Sheet
        if (!sheet || !sheet['!ref']) {
          console.log(`[Excel导入] 跳过空 Sheet: ${sheetName}`);
          continue;
        }
        
        // 判断是否是平均值 Sheet（最后一个 Sheet 或名称包含"平均"）
        const isLastSheet = idx === workbook.SheetNames.length - 1;
        const isSummarySheet = trimmedName.includes('平均') || 
                               trimmedName.toLowerCase().includes('average') ||
                               trimmedName.toLowerCase().includes('avg') ||
                               trimmedName.toLowerCase().includes('summary');
        
        if (isLastSheet || isSummarySheet) {
          // 尝试解析为平均值 Sheet
          const summaryRows = parseSummarySheet(sheet);
          if (summaryRows.length > 0) {
            summarySheet = { rows: summaryRows };
            console.log(`[Excel导入] 检测到平均值 Sheet: ${sheetName}, 共 ${summaryRows.length} 行`);
            
            // 如果是最后一个 Sheet 且是平均值，跳过不作为教员数据
            if (isLastSheet) continue;
          }
        }
        
        // 解析为教员明细 Sheet
        const parsedRows = parseTeacherSheetToRows(sheet, sheetName);
        
        if (parsedRows.length === 0) {
          console.log(`[Excel导入] Sheet ${sheetName} 无有效数据，跳过`);
          continue;
        }
        
        // 如果已经被识别为平均值 Sheet，跳过
        if (isSummarySheet) continue;
        
        const teacherData: ImportedTeacherData = {
          teacherName: trimmedName,
          rows: parsedRows,
          status: 'pending',
        };
        
        teachersData.push(teacherData);
        console.log(`[Excel导入] 添加教员 Sheet: ${sheetName}, 数据行数: ${parsedRows.length}`);
      }
      
      if (teachersData.length === 0) {
        message.error('未在 Excel 文件中找到有效的教员数据');
        return;
      }
      
      // 设置预览数据
      const preview: ImportPreview = {
        campusName: currentCampus || '',
        year: year,
        teachers: teachersData,
        summarySheet,
      };
      
      setImportPreview(preview);
      setImportModalOpen(true);
      
      message.success(`成功解析 ${teachersData.length} 个教员的数据${summarySheet ? '（含平均值 Sheet）' : ''}`);
      
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
    
    if (!currentCampus) {
      message.warning('请先选择神殿');
      return;
    }
    
    setImporting(true);
    setImportProgress(0);
    
    const { year: importYear, teachers } = importPreview;
    const campusName = currentCampus;
    const total = teachers.length + (importPreview.summarySheet ? 1 : 0);
    let successCount = 0;
    let errorCount = 0;
    let currentStep = 0;
    
    const updatedTeachers = [...teachers];
    
    // 导入教员明细数据
    for (let i = 0; i < teachers.length; i++) {
      const teacher = teachers[i];
      
      try {
        // 检查是否已存在记录
        const existingList = await teacherLectureScoreSheetService.list({
          campusName,
          teacherName: teacher.teacherName,
          year: importYear,
        });
        
        const payload = {
          campusName,
          teacherName: teacher.teacherName,
          year: importYear,
          rows: teacher.rows,
        };
        
        if (existingList && existingList.length > 0) {
          // 更新现有记录
          await teacherLectureScoreSheetService.update({
            id: existingList[0].id,
            ...payload,
          });
          console.log(`[Excel导入] 更新教员 ${teacher.teacherName} 的数据`);
        } else {
          // 创建新记录
          await teacherLectureScoreSheetService.create(payload);
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
      
      currentStep++;
      setImportProgress(Math.round((currentStep / total) * 100));
      setImportPreview(prev => prev ? { ...prev, teachers: updatedTeachers } : null);
    }
    
    // 导入平均值数据（如果有）
    if (importPreview.summarySheet && importPreview.summarySheet.rows.length > 0) {
      try {
        await teacherYearlyLectureScoreSummaryService.upsertByYear(
          importYear,
          importPreview.summarySheet.rows,
        );
        console.log(`[Excel导入] 平均值数据导入成功`);
        message.success('平均值数据已导入');
      } catch (error: any) {
        console.error(`[Excel导入] 平均值数据导入失败:`, error);
        message.warning('平均值数据导入失败: ' + (error?.response?.data?.detail || error?.message));
      }
      currentStep++;
      setImportProgress(Math.round((currentStep / total) * 100));
    }
    
    setImporting(false);
    
    if (successCount > 0) {
      message.success(`成功导入 ${successCount} 个教员的数据`);
      // 刷新教员列表
      const campusNameStripped = campusName.replace(/神殿$/, '');
      let list = (await fetchTeachers({ campus_name: campusName, active: true })) || [];
      if ((!list || list.length === 0) && campusNameStripped) {
        list = (await fetchTeachers({ campus_name: campusNameStripped, active: true })) || [];
      }
      setTeachers(list.map((t: any) => ({ label: t.name, value: t.name })));
      
      // 如果当前选中的教员在导入列表中，重新加载数据
      if (teacherName && updatedTeachers.some(t => t.teacherName === teacherName && t.status === 'success')) {
        handleLoadLatest();
      }
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

  return (
    <div style={{ padding: 24 }}>
      <Card bordered={false}>
        <Title level={4} style={{ marginBottom: 12 }}>
          听课成绩表
        </Title>

        <Space style={{ marginBottom: 12 }} wrap>
          <Text strong>当前神殿：</Text>
          <Text>{currentCampus || '未选择'}</Text>
          <Text strong>年份：</Text>
          <InputNumber min={2000} max={2100} value={year} onChange={(v) => setYear(v || dayjs().year())} />
          <Text strong>教员：</Text>
          <Select
            style={{ width: 200 }}
            loading={loadingTeachers}
            options={teachers}
            value={teacherName || undefined}
            onChange={(v) => setTeacherName(v)}
            allowClear
            showSearch
            placeholder={loadingTeachers ? '加载中...' : '请选择教员'}
          />
        </Space>

        <Divider style={{ margin: '12px 0' }} />

        <Table<TableRow>
          bordered
          size="small"
          columns={columns}
          dataSource={tableData}
          pagination={false}
          scroll={{ x: 'max-content', y: 'calc(100vh - 250px)' }}
          rowKey={(r) => r.key}
          sticky
        />

        <div style={{ marginTop: 12 }}>
          <Space>
            <Button type="primary" onClick={handleSave} loading={loading}>
              保存
            </Button>
            <Button onClick={handleLoadLatest} loading={loading}>
              加载最新
            </Button>
            <Button onClick={handleReset}>重置模板</Button>
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
        </div>
        
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
              disabled={!importPreview || importPreview.teachers.length === 0 || !currentCampus}
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
                    <li>每个 Sheet 对应一个教员的听课成绩数据</li>
                    <li>Sheet 名称将作为教员姓名</li>
                    <li>最后一个 Sheet（或名称包含"平均"）将作为汇总数据导入</li>
                    <li>如果教员数据已存在，将会更新覆盖</li>
                  </ul>
                }
                style={{ marginBottom: 16 }}
              />
              
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Text strong>神殿：</Text> {currentCampus || <Text type="danger">请先选择神殿</Text>}
                </Col>
                <Col span={8}>
                  <Text strong>年份：</Text> 
                  <InputNumber
                    size="small"
                    min={2000}
                    max={2100}
                    value={importPreview.year}
                    onChange={(v) => setImportPreview(prev => prev ? { ...prev, year: v || dayjs().year() } : null)}
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
                renderItem={(item) => (
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
                      description={`${item.rows.length} 条评分记录`}
                    />
                  </List.Item>
                )}
              />
              
              {importPreview.summarySheet && (
                <Alert
                  type="success"
                  message={`检测到平均值汇总数据，包含 ${importPreview.summarySheet.rows.length} 位教员的汇总信息，将一并导入`}
                  style={{ marginTop: 16 }}
                />
              )}
            </div>
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default TeacherLectureScoresPage;
