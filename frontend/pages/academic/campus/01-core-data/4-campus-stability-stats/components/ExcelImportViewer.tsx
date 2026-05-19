/**
 * Excel导入和展示组件 - 新生维稳统计
 * 支持导入包含三个表格的Excel文件并完整展示
 */

import React, { useState } from 'react';
import { App, Card, Button, Upload, Space, Typography, Divider, Input, Tabs, Select, InputNumber } from 'antd';
import { UploadOutlined, DeleteOutlined, CopyOutlined, SaveOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import api from '@/services/api';
import dayjs from 'dayjs';
import { useCampusStore } from '@/stores/campusStore';
import CampusSelector from '@/components/common/CampusSelector';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Excel风格的单元格样式
const cellStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '6px 8px',
  textAlign: 'center',
  fontSize: 13,
  minWidth: 80,
};

const headerCellStyle: React.CSSProperties = {
  ...cellStyle,
  backgroundColor: '#90EE90', // 浅绿色
  fontWeight: 'bold',
};

const titleCellStyle: React.CSSProperties = {
  ...cellStyle,
  backgroundColor: '#FFD700', // 金黄色
  fontWeight: 'bold',
  textAlign: 'center',
};

const totalRowStyle: React.CSSProperties = {
  ...cellStyle,
  backgroundColor: '#FFFACD', // 浅黄色
  fontWeight: 'bold',
  color: '#c00',
};

interface MonthlyRow {
  序号: number;
  神殿: string;
  交接人数: number;
  入学人数: number;
  退费人数: number;
  退费率: string;
}

interface PersonalRow {
  序号: number;
  教员姓名: string;
  交接人数: number;
  入学人数: number;
  退费人数: number;
  退费率: string;
}

interface PersonalMonthlyRow {
  月份: number | string;
  教员姓名: string;
  交接人数: number;
  入学人数: number;
  退费人数: number;
  退费率: string;
  rowType?: 'data' | 'subtotal' | 'total';
}

interface ImportedData {
  monthlyData: MonthlyRow[];
  personalData: PersonalRow[];
  personalMonthlyData: PersonalMonthlyRow[];
  // 表格元信息
  tableInfo: {
    monthly?: { title: string; campus: string };
    personal?: { title: string; campus: string };
    personalMonthly?: { title: string; campus: string };
  };
}

const ExcelImportViewer: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore();
  const [importedData, setImportedData] = useState<ImportedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [year, setYear] = useState<number>(dayjs().year());
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || getAllCampuses()[0]?.name || '主神殿');

  // 计算退费率
  const calcRefundRate = (退费: number, 入学: number): string => {
    if (!入学 || 入学 === 0) return '#DIV/0!';
    return ((退费 / 入学) * 100).toFixed(2) + '%';
  };

  // 从标题中提取神殿名称
  const extractCampusFromTitle = (title: string): string => {
    // 匹配格式：如"主神殿后端新生维稳月度汇总表" -> "主神殿"
    // 或"主神殿后端新生维稳个人汇总表" -> "主神殿"
    const match = title.match(/^(.+?神殿)/);
    if (match) {
      return match[1];
    }
    // 如果没有匹配到，尝试从当前选择的神殿
    return selectedCampus;
  };

  // 识别表格类型（根据标题完全匹配）
  const identifyTableType = (title: string): 'monthly' | 'personal' | 'personalMonthly' | null => {
    const normalizedTitle = title.trim();
    
    // 完全匹配：月度汇总表
    if (normalizedTitle.includes('月度汇总表') && !normalizedTitle.includes('个人')) {
      return 'monthly';
    }
    
    // 完全匹配：个人按月汇总表（包含"按月"或"月份"）
    if (normalizedTitle.includes('个人汇总表') && 
        (normalizedTitle.includes('按月') || normalizedTitle.includes('月份'))) {
      return 'personalMonthly';
    }
    
    // 完全匹配：个人汇总表（不包含"按月"）
    if (normalizedTitle.includes('个人汇总表') && !normalizedTitle.includes('按月')) {
      return 'personal';
    }
    
    return null;
  };

  // 解析Excel文件
  const handleFileUpload = async (file: File) => {
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          // 尝试找到包含数据的三个工作表
          let monthlyData: MonthlyRow[] = [];
          let personalData: PersonalRow[] = [];
          let personalMonthlyData: PersonalMonthlyRow[] = [];
          const tableInfo: ImportedData['tableInfo'] = {};

          // 遍历所有工作表
          for (const sheetName of workbook.SheetNames) {
            let currentTableTitle = '';
            let currentTableCampus = selectedCampus;
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

            if (jsonData.length < 2) continue;

            // 智能查找表头行（跳过标题行）
            let headerRow = -1;
            let headerMap: Record<string, number> = {};

            // 在前5行中查找表头和标题
            for (let rowIdx = 0; rowIdx < Math.min(5, jsonData.length); rowIdx++) {
              const row = jsonData[rowIdx] || [];
              const firstCell = String(row[0] || '').trim();
              
              // 记录标题行（包含"汇总表"等关键词）
              if (firstCell.includes('汇总表') || firstCell.includes('统计表')) {
                currentTableTitle = firstCell;
                currentTableCampus = extractCampusFromTitle(firstCell);
                continue;
              }

              // 检查这一行是否包含表头关键词
              const tempHeaderMap: Record<string, number> = {};
              let headerCount = 0;

              row.forEach((cell: any, index: number) => {
                const cellStr = String(cell || '').trim();
                if (cellStr.includes('序号')) {
                  tempHeaderMap['serial'] = index;
                  headerCount++;
                }
                if (cellStr.includes('月份') || (cellStr === '月' && index === 0)) {
                  tempHeaderMap['month'] = index;
                  headerCount++;
                }
                if (cellStr.includes('神殿')) {
                  tempHeaderMap['campus'] = index;
                  headerCount++;
                }
                if (cellStr.includes('教员姓名') || (cellStr.includes('姓名') && !cellStr.includes('神殿'))) {
                  tempHeaderMap['name'] = index;
                  headerCount++;
                }
                if (cellStr.includes('交接人数') || cellStr.includes('交接')) {
                  tempHeaderMap['handover'] = index;
                  headerCount++;
                }
                if (cellStr.includes('入学人数') || cellStr.includes('入学')) {
                  tempHeaderMap['enrollment'] = index;
                  headerCount++;
                }
                if (cellStr.includes('退费人数') && !cellStr.includes('退费率')) {
                  tempHeaderMap['refund'] = index;
                  headerCount++;
                }
                if (cellStr.includes('退费率')) {
                  tempHeaderMap['rate'] = index;
                  headerCount++;
                }
              });

              // 如果找到至少3个表头关键词，认为这是表头行
              if (headerCount >= 3) {
                headerRow = rowIdx;
                headerMap = tempHeaderMap;
                break;
              }
            }

            if (headerRow === -1 || Object.keys(headerMap).length < 3) {
              console.warn(`工作表 ${sheetName} 未找到有效的表头行`);
              continue;
            }

            // 判断表格类型并解析（从表头行的下一行开始）
            const tableType = currentTableTitle ? identifyTableType(currentTableTitle) : 
                            (headerMap['month'] !== undefined && headerMap['name'] !== undefined ? 'personalMonthly' :
                            (headerMap['campus'] !== undefined ? 'monthly' :
                            (headerMap['name'] !== undefined && headerMap['serial'] !== undefined ? 'personal' : null)));

            if (tableType === 'personalMonthly' || (headerMap['month'] !== undefined && headerMap['name'] !== undefined)) {
              // 个人按月汇总表
              const monthMap = new Map<number, PersonalMonthlyRow[]>();
              let currentMonth = 0;
              
              for (let i = headerRow + 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || row.every((cell: any) => !cell)) continue;
                
                // 跳过标题行和表头行
                const firstCell = String(row[0] || '').trim();
                if (firstCell.includes('汇总表') || firstCell.includes('统计表')) continue;

                const monthValue = row[headerMap['month']];
                const name = String(row[headerMap['name']] || '').trim();
                
                // 更新当前月份（如果月份列有值）
                if (monthValue !== undefined && monthValue !== null && monthValue !== '') {
                  const monthNum = Number(monthValue);
                  if (monthNum >= 1 && monthNum <= 12) {
                    currentMonth = monthNum;
                  }
                }

                if (!name || name === '合计' || name === '总计') {
                  if (name === '合计' && currentMonth > 0) {
                    // 月度小计 - 计算当前月份的所有数据行
                    const monthRows = monthMap.get(currentMonth) || [];
                    const subtotal: PersonalMonthlyRow = {
                      月份: currentMonth,
                      教员姓名: '合计',
                      交接人数: monthRows.reduce((sum, r) => sum + (r.交接人数 || 0), 0),
                      入学人数: monthRows.reduce((sum, r) => sum + (r.入学人数 || 0), 0),
                      退费人数: monthRows.reduce((sum, r) => sum + (r.退费人数 || 0), 0),
                      退费率: '',
                      rowType: 'subtotal',
                    };
                    subtotal.退费率 = calcRefundRate(subtotal.退费人数, subtotal.入学人数);
                    personalMonthlyData.push(subtotal);
                  } else if (name === '总计') {
                    // 总计行 - 在最后添加
                    continue; // 稍后统一处理
                  }
                  continue;
                }

                if (currentMonth >= 1 && currentMonth <= 12 && name) {
                  // 更严格的数据提取：确保是数字类型
                  const handoverValue = row[headerMap['handover']];
                  const enrollmentValue = row[headerMap['enrollment']];
                  const refundValue = row[headerMap['refund']];
                  
                  const handover = typeof handoverValue === 'number' ? handoverValue : (Number(handoverValue) || 0);
                  const enrollment = typeof enrollmentValue === 'number' ? enrollmentValue : (Number(enrollmentValue) || 0);
                  const refund = typeof refundValue === 'number' ? refundValue : (Number(refundValue) || 0);
                  
                  // 跳过明显不是数据的行（如果所有数值都是0且名字看起来不像人名）
                  if (handover === 0 && enrollment === 0 && refund === 0 && 
                      (name.length < 2 || name.includes('序号') || name.includes('汇总表'))) {
                    continue;
                  }

                  const record: PersonalMonthlyRow = {
                    月份: currentMonth,
                    教员姓名: name,
                    交接人数: handover,
                    入学人数: enrollment,
                    退费人数: refund,
                    退费率: calcRefundRate(refund, enrollment),
                    rowType: 'data',
                  };

                  if (!monthMap.has(currentMonth)) {
                    monthMap.set(currentMonth, []);
                  }
                  monthMap.get(currentMonth)!.push(record);
                  personalMonthlyData.push(record);
                }
              }
              
              // 为每个月份添加小计（如果还没有）
              Array.from(monthMap.keys())
                .sort((a, b) => a - b)
                .forEach((month) => {
                  const monthRows = monthMap.get(month) || [];
                  const hasSubtotal = personalMonthlyData.some(
                    (r) => r.rowType === 'subtotal' && r.月份 === month
                  );
                  if (!hasSubtotal && monthRows.length > 0) {
                    const subtotal: PersonalMonthlyRow = {
                      月份: month,
                      教员姓名: '合计',
                      交接人数: monthRows.reduce((sum, r) => sum + (r.交接人数 || 0), 0),
                      入学人数: monthRows.reduce((sum, r) => sum + (r.入学人数 || 0), 0),
                      退费人数: monthRows.reduce((sum, r) => sum + (r.退费人数 || 0), 0),
                      退费率: '',
                      rowType: 'subtotal',
                    };
                    subtotal.退费率 = calcRefundRate(subtotal.退费人数, subtotal.入学人数);
                    personalMonthlyData.push(subtotal);
                  }
                });
              
              // 添加总计行
              const allDataRows = personalMonthlyData.filter((r) => r.rowType === 'data');
              const total: PersonalMonthlyRow = {
                月份: '总计',
                教员姓名: '',
                交接人数: allDataRows.reduce((sum, r) => sum + (r.交接人数 || 0), 0),
                入学人数: allDataRows.reduce((sum, r) => sum + (r.入学人数 || 0), 0),
                退费人数: allDataRows.reduce((sum, r) => sum + (r.退费人数 || 0), 0),
                退费率: '',
                rowType: 'total',
              };
              total.退费率 = calcRefundRate(total.退费人数, total.入学人数);
              personalMonthlyData.push(total);
              
              // 记录表格信息
              if (currentTableTitle) {
                tableInfo.personalMonthly = {
                  title: currentTableTitle,
                  campus: currentTableCampus,
                };
              }
            } else if (tableType === 'monthly' || headerMap['campus'] !== undefined) {
              // 月度汇总表
              for (let i = headerRow + 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || row.every((cell: any) => !cell)) continue;
                
                // 跳过标题行
                const firstCell = String(row[0] || '').trim();
                if (firstCell.includes('汇总表') || firstCell.includes('统计表')) continue;

                const serialValue = headerMap['serial'] !== undefined ? row[headerMap['serial']] : i;
                const serial = typeof serialValue === 'number' ? serialValue : (Number(serialValue) || i);
                const campus = String(row[headerMap['campus']] || '').trim();
                if (!campus || campus === '合计' || campus === '序号' || campus.includes('汇总表')) continue;

                // 更严格的数据提取
                const handoverValue = row[headerMap['handover']];
                const enrollmentValue = row[headerMap['enrollment']];
                const refundValue = row[headerMap['refund']];
                
                const handover = typeof handoverValue === 'number' ? handoverValue : (Number(handoverValue) || 0);
                const enrollment = typeof enrollmentValue === 'number' ? enrollmentValue : (Number(enrollmentValue) || 0);
                const refund = typeof refundValue === 'number' ? refundValue : (Number(refundValue) || 0);
                
                // 跳过明显不是数据的行
                if (handover === 0 && enrollment === 0 && refund === 0 && 
                    (campus.length < 2 || campus === serial.toString())) {
                  continue;
                }

                monthlyData.push({
                  序号: serial,
                  神殿: campus,
                  交接人数: handover,
                  入学人数: enrollment,
                  退费人数: refund,
                  退费率: calcRefundRate(refund, enrollment),
                });
              }
              
              // 记录表格信息
              if (currentTableTitle) {
                tableInfo.monthly = {
                  title: currentTableTitle,
                  campus: currentTableCampus,
                };
              }
            } else if (tableType === 'personal' || (headerMap['name'] !== undefined && headerMap['serial'] !== undefined)) {
              // 个人汇总表
              for (let i = headerRow + 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || row.every((cell: any) => !cell)) continue;
                
                // 跳过标题行
                const firstCell = String(row[0] || '').trim();
                if (firstCell.includes('汇总表') || firstCell.includes('统计表')) continue;

                const serialValue = row[headerMap['serial']];
                const serial = typeof serialValue === 'number' ? serialValue : (Number(serialValue) || i);
                const name = String(row[headerMap['name']] || '').trim();
                if (!name || name === '合计' || name === '序号' || name.includes('汇总表')) continue;

                // 更严格的数据提取
                const handoverValue = row[headerMap['handover']];
                const enrollmentValue = row[headerMap['enrollment']];
                const refundValue = row[headerMap['refund']];
                
                const handover = typeof handoverValue === 'number' ? handoverValue : (Number(handoverValue) || 0);
                const enrollment = typeof enrollmentValue === 'number' ? enrollmentValue : (Number(enrollmentValue) || 0);
                const refund = typeof refundValue === 'number' ? refundValue : (Number(refundValue) || 0);
                
                // 跳过明显不是数据的行
                if (handover === 0 && enrollment === 0 && refund === 0 && 
                    (name.length < 2 || name === serial.toString())) {
                  continue;
                }

                personalData.push({
                  序号: serial,
                  教员姓名: name,
                  交接人数: handover,
                  入学人数: enrollment,
                  退费人数: refund,
                  退费率: calcRefundRate(refund, enrollment),
                });
              }
              
              // 记录表格信息
              if (currentTableTitle) {
                tableInfo.personal = {
                  title: currentTableTitle,
                  campus: currentTableCampus,
                };
              }
            }
          }

          setImportedData({
            monthlyData,
            personalData,
            personalMonthlyData,
            tableInfo,
          });

          message.success('Excel文件导入成功');
        } catch (error) {
          console.error('Excel解析失败:', error);
          message.error('Excel文件解析失败，请检查文件格式');
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        message.error('文件读取失败');
        setLoading(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('导入失败:', error);
      message.error('导入失败，请稍后重试');
      setLoading(false);
    }
    return false; // 阻止自动上传
  };

  const handleClear = () => {
    setImportedData(null);
    setPasteText('');
    message.info('已清空导入数据');
  };

  // 解析粘贴的文本数据（制表符分隔或空格分隔）
  const parsePastedText = (text: string) => {
    setLoading(true);
    try {
      // 按行分割（保留空行用于分隔表格）
      const lines = text.split(/\r?\n/);
      if (lines.length < 2) {
        message.error('粘贴的数据至少需要包含表头和数据行');
        setLoading(false);
        return;
      }

      // 解析每一行（支持制表符和多个空格分隔）
      const rows = lines.map(line => {
        if (!line.trim()) return []; // 空行返回空数组
        // 先尝试制表符分隔，如果没有则用多个空格分隔
        if (line.includes('\t')) {
          return line.split('\t').map(cell => cell.trim());
        } else {
          return line.split(/\s{2,}/).map(cell => cell.trim());
        }
      });

      let monthlyData: MonthlyRow[] = [];
      let personalData: PersonalRow[] = [];
      let personalMonthlyData: PersonalMonthlyRow[] = [];
      const tableInfo: ImportedData['tableInfo'] = {};

      // 按表格分组（通过标题行或空行分隔）
      const tableSections: { start: number; end: number; title?: string }[] = [];
      let currentSection: { start: number; end: number; title?: string } | null = null;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const firstCell = String(row[0] || '').trim();
        
        // 检测表格标题行
        if (firstCell.includes('汇总表') || firstCell.includes('统计表')) {
          // 结束上一个表格
          if (currentSection) {
            currentSection.end = i - 1;
            tableSections.push(currentSection);
          }
          // 开始新表格
          currentSection = { start: i, end: rows.length - 1, title: firstCell };
        } else if (row.length === 0 && currentSection) {
          // 空行可能表示表格结束
          currentSection.end = i - 1;
          tableSections.push(currentSection);
          currentSection = null;
        }
      }
      
      // 如果没有找到明确的表格分隔，将整个内容作为一个表格
      if (tableSections.length === 0 && rows.some(r => r.length > 0)) {
        tableSections.push({ start: 0, end: rows.length - 1 });
      } else if (currentSection) {
        tableSections.push(currentSection);
      }

      // 解析每个表格部分
      for (const section of tableSections) {
        const sectionRows = rows.slice(section.start, section.end + 1).filter(r => r.length > 0);
        if (sectionRows.length < 2) continue;

        const currentTableTitle = section.title || '';
        const currentTableCampus = currentTableTitle ? extractCampusFromTitle(currentTableTitle) : selectedCampus;

        // 查找表头行
        let headerRow = -1;
        let headerMap: Record<string, number> = {};

        for (let rowIdx = 0; rowIdx < Math.min(5, sectionRows.length); rowIdx++) {
          const row = sectionRows[rowIdx] || [];
          const firstCell = String(row[0] || '').trim();
          
          // 跳过标题行（但已记录）
          if (firstCell.includes('汇总表') || firstCell.includes('统计表')) {
            continue;
          }

          // 检查是否包含表头关键词
          const tempHeaderMap: Record<string, number> = {};
          let headerCount = 0;

          row.forEach((cell: any, index: number) => {
            const cellStr = String(cell || '').trim();
            if (cellStr.includes('序号')) {
              tempHeaderMap['serial'] = index;
              headerCount++;
            }
            if (cellStr.includes('月份') || (cellStr === '月' && index === 0)) {
              tempHeaderMap['month'] = index;
              headerCount++;
            }
            if (cellStr.includes('神殿')) {
              tempHeaderMap['campus'] = index;
              headerCount++;
            }
            if (cellStr.includes('教员姓名') || (cellStr.includes('姓名') && !cellStr.includes('神殿'))) {
              tempHeaderMap['name'] = index;
              headerCount++;
            }
            if (cellStr.includes('交接人数') || cellStr.includes('交接')) {
              tempHeaderMap['handover'] = index;
              headerCount++;
            }
            if (cellStr.includes('入学人数') || cellStr.includes('入学')) {
              tempHeaderMap['enrollment'] = index;
              headerCount++;
            }
            if (cellStr.includes('退费人数') && !cellStr.includes('退费率')) {
              tempHeaderMap['refund'] = index;
              headerCount++;
            }
            if (cellStr.includes('退费率')) {
              tempHeaderMap['rate'] = index;
              headerCount++;
            }
          });

          if (headerCount >= 3) {
            headerRow = rowIdx;
            headerMap = tempHeaderMap;
            break;
          }
        }

        if (headerRow === -1 || Object.keys(headerMap).length < 3) {
          continue; // 跳过无法识别的表格
        }

        // 判断表格类型并解析
        const tableType = currentTableTitle ? identifyTableType(currentTableTitle) : 
                        (headerMap['month'] !== undefined && headerMap['name'] !== undefined ? 'personalMonthly' :
                        (headerMap['campus'] !== undefined ? 'monthly' :
                        (headerMap['name'] !== undefined && headerMap['serial'] !== undefined ? 'personal' : null)));

        if (tableType === 'personalMonthly' || (headerMap['month'] !== undefined && headerMap['name'] !== undefined)) {
          // 个人按月汇总表
          const monthMap = new Map<number, PersonalMonthlyRow[]>();
          let currentMonth = 0;

          for (let i = headerRow + 1; i < sectionRows.length; i++) {
            const row = sectionRows[i];
            if (!row || row.every((cell: any) => !cell)) continue;

            const firstCell = String(row[0] || '').trim();
            if (firstCell.includes('汇总表') || firstCell.includes('统计表')) continue;

            const monthValue = row[headerMap['month']];
            const name = String(row[headerMap['name']] || '').trim();

            if (monthValue !== undefined && monthValue !== null && monthValue !== '') {
              const monthNum = Number(monthValue);
              if (monthNum >= 1 && monthNum <= 12) {
                currentMonth = monthNum;
              }
            }

            if (!name || name === '合计' || name === '总计') {
              if (name === '合计' && currentMonth > 0) {
                const monthRows = monthMap.get(currentMonth) || [];
                const subtotal: PersonalMonthlyRow = {
                  月份: currentMonth,
                  教员姓名: '合计',
                  交接人数: monthRows.reduce((sum, r) => sum + (r.交接人数 || 0), 0),
                  入学人数: monthRows.reduce((sum, r) => sum + (r.入学人数 || 0), 0),
                  退费人数: monthRows.reduce((sum, r) => sum + (r.退费人数 || 0), 0),
                  退费率: '',
                  rowType: 'subtotal',
                };
                subtotal.退费率 = calcRefundRate(subtotal.退费人数, subtotal.入学人数);
                personalMonthlyData.push(subtotal);
              }
              continue;
            }

            if (currentMonth >= 1 && currentMonth <= 12 && name) {
              const handoverValue = row[headerMap['handover']];
              const enrollmentValue = row[headerMap['enrollment']];
              const refundValue = row[headerMap['refund']];
              
              const handover = typeof handoverValue === 'number' ? handoverValue : (Number(handoverValue) || 0);
              const enrollment = typeof enrollmentValue === 'number' ? enrollmentValue : (Number(enrollmentValue) || 0);
              const refund = typeof refundValue === 'number' ? refundValue : (Number(refundValue) || 0);

              if (handover === 0 && enrollment === 0 && refund === 0 && 
                  (name.length < 2 || name.includes('序号') || name.includes('汇总表'))) {
                continue;
              }

              const record: PersonalMonthlyRow = {
                月份: currentMonth,
                教员姓名: name,
                交接人数: handover,
                入学人数: enrollment,
                退费人数: refund,
                退费率: calcRefundRate(refund, enrollment),
                rowType: 'data',
              };

              if (!monthMap.has(currentMonth)) {
                monthMap.set(currentMonth, []);
              }
              monthMap.get(currentMonth)!.push(record);
              personalMonthlyData.push(record);
            }
          }
          
          // 添加小计和总计
          Array.from(monthMap.keys())
            .sort((a, b) => a - b)
            .forEach((month) => {
              const monthRows = monthMap.get(month) || [];
              const hasSubtotal = personalMonthlyData.some(
                (r) => r.rowType === 'subtotal' && r.月份 === month
              );
              if (!hasSubtotal && monthRows.length > 0) {
                const subtotal: PersonalMonthlyRow = {
                  月份: month,
                  教员姓名: '合计',
                  交接人数: monthRows.reduce((sum, r) => sum + (r.交接人数 || 0), 0),
                  入学人数: monthRows.reduce((sum, r) => sum + (r.入学人数 || 0), 0),
                  退费人数: monthRows.reduce((sum, r) => sum + (r.退费人数 || 0), 0),
                  退费率: '',
                  rowType: 'subtotal',
                };
                subtotal.退费率 = calcRefundRate(subtotal.退费人数, subtotal.入学人数);
                personalMonthlyData.push(subtotal);
              }
            });

          const allDataRows = personalMonthlyData.filter((r) => r.rowType === 'data');
          const total: PersonalMonthlyRow = {
            月份: '总计',
            教员姓名: '',
            交接人数: allDataRows.reduce((sum, r) => sum + (r.交接人数 || 0), 0),
            入学人数: allDataRows.reduce((sum, r) => sum + (r.入学人数 || 0), 0),
            退费人数: allDataRows.reduce((sum, r) => sum + (r.退费人数 || 0), 0),
            退费率: '',
            rowType: 'total',
          };
          total.退费率 = calcRefundRate(total.退费人数, total.入学人数);
          personalMonthlyData.push(total);
          
          // 记录表格信息
          if (currentTableTitle) {
            tableInfo.personalMonthly = {
              title: currentTableTitle,
              campus: currentTableCampus,
            };
          }
        } else if (tableType === 'monthly' || headerMap['campus'] !== undefined) {
          // 月度汇总表
          for (let i = headerRow + 1; i < sectionRows.length; i++) {
            const row = sectionRows[i];
            if (!row || row.every((cell: any) => !cell)) continue;

            const firstCell = String(row[0] || '').trim();
            if (firstCell.includes('汇总表') || firstCell.includes('统计表')) continue;

            const serialValue = headerMap['serial'] !== undefined ? row[headerMap['serial']] : i;
            const serial = typeof serialValue === 'number' ? serialValue : (Number(serialValue) || i);
            const campus = String(row[headerMap['campus']] || '').trim();
            if (!campus || campus === '合计' || campus === '序号' || campus.includes('汇总表')) continue;

            const handoverValue = row[headerMap['handover']];
            const enrollmentValue = row[headerMap['enrollment']];
            const refundValue = row[headerMap['refund']];
            
            const handover = typeof handoverValue === 'number' ? handoverValue : (Number(handoverValue) || 0);
            const enrollment = typeof enrollmentValue === 'number' ? enrollmentValue : (Number(enrollmentValue) || 0);
            const refund = typeof refundValue === 'number' ? refundValue : (Number(refundValue) || 0);

            if (handover === 0 && enrollment === 0 && refund === 0 && 
                (campus.length < 2 || campus === serial.toString())) {
              continue;
            }

            monthlyData.push({
              序号: serial,
              神殿: campus,
              交接人数: handover,
              入学人数: enrollment,
              退费人数: refund,
              退费率: calcRefundRate(refund, enrollment),
            });
          }
          
          // 记录表格信息
          if (currentTableTitle) {
            tableInfo.monthly = {
              title: currentTableTitle,
              campus: currentTableCampus,
            };
          }
        } else if (tableType === 'personal' || (headerMap['name'] !== undefined && headerMap['serial'] !== undefined)) {
          // 个人汇总表
          for (let i = headerRow + 1; i < sectionRows.length; i++) {
            const row = sectionRows[i];
            if (!row || row.every((cell: any) => !cell)) continue;

            const firstCell = String(row[0] || '').trim();
            if (firstCell.includes('汇总表') || firstCell.includes('统计表')) continue;

            const serialValue = row[headerMap['serial']];
            const serial = typeof serialValue === 'number' ? serialValue : (Number(serialValue) || i);
            const name = String(row[headerMap['name']] || '').trim();
            if (!name || name === '合计' || name === '序号' || name.includes('汇总表')) continue;

            const handoverValue = row[headerMap['handover']];
            const enrollmentValue = row[headerMap['enrollment']];
            const refundValue = row[headerMap['refund']];
            
            const handover = typeof handoverValue === 'number' ? handoverValue : (Number(handoverValue) || 0);
            const enrollment = typeof enrollmentValue === 'number' ? enrollmentValue : (Number(enrollmentValue) || 0);
            const refund = typeof refundValue === 'number' ? refundValue : (Number(refundValue) || 0);

            if (handover === 0 && enrollment === 0 && refund === 0 && 
                (name.length < 2 || name === serial.toString())) {
              continue;
            }

            personalData.push({
              序号: serial,
              教员姓名: name,
              交接人数: handover,
              入学人数: enrollment,
              退费人数: refund,
              退费率: calcRefundRate(refund, enrollment),
            });
          }
          
          // 记录表格信息
          if (currentTableTitle) {
            tableInfo.personal = {
              title: currentTableTitle,
              campus: currentTableCampus,
            };
          }
        }
      }

      if (monthlyData.length === 0 && personalData.length === 0 && personalMonthlyData.length === 0) {
        message.error('未能解析出有效数据，请检查数据格式');
        setLoading(false);
        return;
      }

      setImportedData({
        monthlyData,
        personalData,
        personalMonthlyData,
        tableInfo,
      });

      const successMsg = [
        monthlyData.length > 0 && `月度汇总 ${monthlyData.length} 条`,
        personalData.length > 0 && `个人汇总 ${personalData.length} 条`,
        personalMonthlyData.length > 0 && `个人按月汇总 ${personalMonthlyData.filter(r => r.rowType === 'data').length} 条`,
      ].filter(Boolean).join('，');
      
      message.success(`粘贴数据解析成功：${successMsg}`);
    } catch (error) {
      console.error('解析粘贴数据失败:', error);
      message.error('解析粘贴数据失败，请检查数据格式');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = () => {
    if (!pasteText.trim()) {
      message.warning('请先粘贴表格数据');
      return;
    }
    parsePastedText(pasteText);
  };

  // 保存数据到后端
  const handleSaveToBackend = async () => {
    if (!importedData) {
      message.warning('没有可保存的数据');
      return;
    }

    setSaving(true);
    const saveResults: string[] = [];
    const errors: string[] = [];

    try {
      // 1. 保存月度汇总表
      if (importedData.monthlyData.length > 0) {
        const tableInfo = importedData.tableInfo.monthly;
        const campus = tableInfo?.campus || selectedCampus;
        
        // 验证标题完全匹配：必须包含"月度汇总表"且不包含"个人"
        if (tableInfo?.title) {
          if (!tableInfo.title.includes('月度汇总表') || tableInfo.title.includes('个人')) {
            errors.push(`月度汇总表标题不匹配: ${tableInfo.title}（期望包含"月度汇总表"且不包含"个人"）`);
          } else {
            try {
              const payload = {
                神殿名称: campus,
                年份: year,
                行列表: importedData.monthlyData
                  .filter(row => row.序号 > 0 && row.神殿) // 过滤有效数据
                  .map(row => ({
                    月份: row.序号, // 月度汇总表中序号就是月份
                    交接人数: row.交接人数,
                    入学人数: row.入学人数,
                    退费人数: row.退费人数,
                  })),
              };
              
              if (payload.行列表.length > 0) {
                await api.post('/student-stability-monthly-summary', payload);
                saveResults.push(`月度汇总表: ${payload.行列表.length} 条`);
              }
            } catch (error: any) {
              errors.push(`月度汇总表保存失败: ${error?.response?.data?.detail || error.message}`);
            }
          }
        } else {
          // 如果没有标题信息，根据数据结构判断（有神殿列且没有月份列）
          try {
            const payload = {
              神殿名称: campus,
              年份: year,
              行列表: importedData.monthlyData
                .filter(row => row.序号 > 0 && row.神殿 && row.序号 >= 1 && row.序号 <= 12) // 序号应该是月份
                .map(row => ({
                  月份: row.序号, // 月度汇总表中序号就是月份
                  交接人数: row.交接人数,
                  入学人数: row.入学人数,
                  退费人数: row.退费人数,
                })),
            };
            
            if (payload.行列表.length > 0) {
              await api.post('/student-stability-monthly-summary', payload);
              saveResults.push(`月度汇总表: ${payload.行列表.length} 条`);
            }
          } catch (error: any) {
            errors.push(`月度汇总表保存失败: ${error?.response?.data?.detail || error.message}`);
          }
        }
      }

      // 2. 保存个人汇总表
      if (importedData.personalData.length > 0) {
        const tableInfo = importedData.tableInfo.personal;
        const campus = tableInfo?.campus || selectedCampus;
        
        // 验证标题完全匹配：必须包含"个人汇总表"且不包含"按月"和"月份"
        if (tableInfo?.title) {
          if (!tableInfo.title.includes('个人汇总表') || 
              tableInfo.title.includes('按月') || 
              tableInfo.title.includes('月份')) {
            errors.push(`个人汇总表标题不匹配: ${tableInfo.title}（期望包含"个人汇总表"且不包含"按月"或"月份"）`);
          } else {
            try {
              const payload = {
                神殿名称: campus,
                年份: year,
                行列表: importedData.personalData
                  .filter(row => row.序号 > 0 && row.教员姓名) // 过滤有效数据
                  .map(row => ({
                    教员序号: row.序号,
                    教员姓名: row.教员姓名,
                    交接人数: row.交接人数,
                    入学人数: row.入学人数,
                    退费人数: row.退费人数,
                  })),
              };
              
              if (payload.行列表.length > 0) {
                await api.post('/student-stability-personal-summary', payload);
                saveResults.push(`个人汇总表: ${payload.行列表.length} 条`);
              }
            } catch (error: any) {
              errors.push(`个人汇总表保存失败: ${error?.response?.data?.detail || error.message}`);
            }
          }
        } else {
          // 如果没有标题信息，根据数据结构判断
          try {
            const payload = {
              神殿名称: campus,
              年份: year,
              行列表: importedData.personalData
                .filter(row => row.序号 > 0 && row.教员姓名)
                .map(row => ({
                  教员序号: row.序号,
                  教员姓名: row.教员姓名,
                  交接人数: row.交接人数,
                  入学人数: row.入学人数,
                  退费人数: row.退费人数,
                })),
            };
            
            if (payload.行列表.length > 0) {
              await api.post('/student-stability-personal-summary', payload);
              saveResults.push(`个人汇总表: ${payload.行列表.length} 条`);
            }
          } catch (error: any) {
            errors.push(`个人汇总表保存失败: ${error?.response?.data?.detail || error.message}`);
          }
        }
      }

      // 3. 保存个人按月汇总表
      if (importedData.personalMonthlyData.length > 0) {
        const tableInfo = importedData.tableInfo.personalMonthly;
        const campus = tableInfo?.campus || selectedCampus;
        
        // 验证标题完全匹配：必须包含"个人汇总表"，且包含"按月"或"月份"，或者数据结构中有月份列
        let shouldSave = false;
        if (tableInfo?.title) {
          const hasMonthKeyword = tableInfo.title.includes('按月') || tableInfo.title.includes('月份');
          if (!tableInfo.title.includes('个人汇总表')) {
            errors.push(`个人按月汇总表标题不匹配: ${tableInfo.title}（期望包含"个人汇总表"）`);
          } else if (!hasMonthKeyword) {
            // 如果没有"按月"或"月份"关键词，但数据结构中有月份列，仍然允许保存
            console.warn(`标题中没有"按月"或"月份"关键词，但数据结构包含月份列，将尝试保存`);
            shouldSave = true;
          } else {
            shouldSave = true;
          }
        } else {
          // 如果没有标题信息，根据数据结构判断（有月份列）
          shouldSave = true;
        }
        
        if (shouldSave) {
          try {
            // 提取数据行（排除小计和总计）
            const dataRows = importedData.personalMonthlyData.filter(r => r.rowType === 'data');
            
            // 为每个教员按月分配序号（同一月份内的同一教员使用相同序号）
            const teacherSerialMap = new Map<string, number>(); // key: "月份-教员姓名", value: 序号
            let maxSerial = 0;
            
            // 先遍历所有数据，为每个唯一的"月份-教员姓名"组合分配序号
            dataRows.forEach(row => {
              if (typeof row.月份 === 'number' && row.月份 >= 1 && row.月份 <= 12 && row.教员姓名) {
                const key = `${row.月份}-${row.教员姓名}`;
                if (!teacherSerialMap.has(key)) {
                  // 检查该月份是否已有其他教员，如果有则使用最大序号+1，否则从1开始
                  const monthKeys = Array.from(teacherSerialMap.keys()).filter(k => k.startsWith(`${row.月份}-`));
                  if (monthKeys.length > 0) {
                    const monthSerials = monthKeys.map(k => teacherSerialMap.get(k)!).filter(Boolean);
                    const newSerial = monthSerials.length > 0 ? Math.max(...monthSerials) + 1 : 1;
                    teacherSerialMap.set(key, newSerial);
                    maxSerial = Math.max(maxSerial, newSerial);
                  } else {
                    teacherSerialMap.set(key, 1);
                    maxSerial = Math.max(maxSerial, 1);
                  }
                }
              }
            });
            
            const payload = {
              神殿名称: campus,
              年份: year,
              行列表: dataRows
                .filter(row => typeof row.月份 === 'number' && row.月份 >= 1 && row.月份 <= 12 && row.教员姓名)
                .map(row => {
                  const key = `${row.月份}-${row.教员姓名}`;
                  return {
                    月份: row.月份 as number,
                    教员序号: teacherSerialMap.get(key) || 1,
                    教员姓名: row.教员姓名,
                    交接人数: row.交接人数,
                    入学人数: row.入学人数,
                    退费人数: row.退费人数,
                  };
                }),
            };
            
            if (payload.行列表.length > 0) {
              await api.post('/student-stability-personal-monthly', payload);
              saveResults.push(`个人按月汇总表: ${payload.行列表.length} 条`);
            }
          } catch (error: any) {
            errors.push(`个人按月汇总表保存失败: ${error?.response?.data?.detail || error.message}`);
          }
        }
      }

      if (saveResults.length > 0) {
        message.success(`保存成功：${saveResults.join('；')}`);
      }
      if (errors.length > 0) {
        message.warning(`部分保存失败：${errors.join('；')}`);
      }
      if (saveResults.length === 0 && errors.length === 0) {
        message.warning('没有有效数据可保存');
      }
    } catch (error: any) {
      console.error('保存失败:', error);
      message.error(`保存失败: ${error?.response?.data?.detail || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 渲染月度汇总表
  const renderMonthlyTable = () => {
    if (!importedData?.monthlyData || importedData.monthlyData.length === 0) return null;

    const totals = importedData.monthlyData.reduce(
      (acc, row) => ({
        交接人数: acc.交接人数 + (row.交接人数 || 0),
        入学人数: acc.入学人数 + (row.入学人数 || 0),
        退费人数: acc.退费人数 + (row.退费人数 || 0),
      }),
      { 交接人数: 0, 入学人数: 0, 退费人数: 0 }
    );

    // 从表格信息中获取神殿名称，如果没有则使用选择的神殿
    const campus = importedData.tableInfo.monthly?.campus || selectedCampus;
    const campusShort = campus.replace(/神殿$/, '');

    return (
      <div style={{ marginBottom: 32 }}>
        <div style={titleCellStyle}>{campus}后端新生维稳月度汇总表</div>
        <table
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            minWidth: 700,
            backgroundColor: '#fff',
          }}
        >
          <thead>
            <tr>
              <th style={headerCellStyle}>序号</th>
              <th style={headerCellStyle}>神殿</th>
              <th style={headerCellStyle}>交接人数</th>
              <th style={headerCellStyle}>入学人数</th>
              <th style={headerCellStyle}>退费人数</th>
              <th style={headerCellStyle}>退费率</th>
            </tr>
          </thead>
          <tbody>
            {importedData.monthlyData.map((row, idx) => (
              <tr key={idx}>
                <td style={cellStyle}>{row.序号}</td>
                <td style={cellStyle}>{row.神殿}</td>
                <td style={cellStyle}>{row.交接人数 || 0}</td>
                <td style={cellStyle}>{row.入学人数 || 0}</td>
                <td style={cellStyle}>{row.退费人数 || 0}</td>
                <td style={cellStyle}>{row.退费率}</td>
              </tr>
            ))}
            <tr>
              <td style={totalRowStyle}>合计</td>
              <td style={totalRowStyle}></td>
              <td style={totalRowStyle}>{totals.交接人数}</td>
              <td style={totalRowStyle}>{totals.入学人数}</td>
              <td style={totalRowStyle}>{totals.退费人数}</td>
              <td style={totalRowStyle}>{calcRefundRate(totals.退费人数, totals.入学人数)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // 渲染个人汇总表
  const renderPersonalTable = () => {
    if (!importedData?.personalData || importedData.personalData.length === 0) return null;

    // 从表格信息中获取神殿名称
    const campus = importedData.tableInfo.personal?.campus || selectedCampus;

    const totals = importedData.personalData.reduce(
      (acc, row) => ({
        交接人数: acc.交接人数 + (row.交接人数 || 0),
        入学人数: acc.入学人数 + (row.入学人数 || 0),
        退费人数: acc.退费人数 + (row.退费人数 || 0),
      }),
      { 交接人数: 0, 入学人数: 0, 退费人数: 0 }
    );

    return (
      <div style={{ marginBottom: 32 }}>
        <div style={titleCellStyle}>{campus}后端新生维稳个人汇总表</div>
        <table
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            minWidth: 700,
            backgroundColor: '#fff',
          }}
        >
          <thead>
            <tr>
              <th style={headerCellStyle}>序号</th>
              <th style={headerCellStyle}>教员姓名</th>
              <th style={headerCellStyle}>交接人数</th>
              <th style={headerCellStyle}>入学人数</th>
              <th style={headerCellStyle}>退费人数</th>
              <th style={headerCellStyle}>退费率</th>
            </tr>
          </thead>
          <tbody>
            {importedData.personalData.map((row, idx) => (
              <tr key={idx}>
                <td style={cellStyle}>{row.序号}</td>
                <td style={cellStyle}>{row.教员姓名}</td>
                <td style={cellStyle}>{row.交接人数 || 0}</td>
                <td style={cellStyle}>{row.入学人数 || 0}</td>
                <td style={cellStyle}>{row.退费人数 || 0}</td>
                <td style={cellStyle}>{row.退费率}</td>
              </tr>
            ))}
            <tr>
              <td style={totalRowStyle}>合计</td>
              <td style={totalRowStyle}></td>
              <td style={totalRowStyle}>{totals.交接人数}</td>
              <td style={totalRowStyle}>{totals.入学人数}</td>
              <td style={totalRowStyle}>{totals.退费人数}</td>
              <td style={totalRowStyle}>{calcRefundRate(totals.退费人数, totals.入学人数)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // 渲染个人按月汇总表
  const renderPersonalMonthlyTable = () => {
    if (!importedData?.personalMonthlyData || importedData.personalMonthlyData.length === 0) return null;

    // 从表格信息中获取神殿名称
    const campus = importedData.tableInfo.personalMonthly?.campus || selectedCampus;

    // 按月份分组数据
    const monthGroups = new Map<number, PersonalMonthlyRow[]>();
    const subtotals = new Map<number, PersonalMonthlyRow>();
    let grandTotal: PersonalMonthlyRow | null = null;

    importedData.personalMonthlyData.forEach((row) => {
      if (row.rowType === 'data' && typeof row.月份 === 'number') {
        if (!monthGroups.has(row.月份)) {
          monthGroups.set(row.月份, []);
        }
        monthGroups.get(row.月份)!.push(row);
      } else if (row.rowType === 'subtotal' && typeof row.月份 === 'number') {
        subtotals.set(row.月份, row);
      } else if (row.rowType === 'total') {
        grandTotal = row;
      }
    });

    // 计算总计（如果没有从Excel中读取）
    if (!grandTotal) {
      const allDataRows = importedData.personalMonthlyData.filter((r) => r.rowType === 'data');
      grandTotal = {
        月份: '总计',
        教员姓名: '',
        交接人数: allDataRows.reduce((sum, r) => sum + (r.交接人数 || 0), 0),
        入学人数: allDataRows.reduce((sum, r) => sum + (r.入学人数 || 0), 0),
        退费人数: allDataRows.reduce((sum, r) => sum + (r.退费人数 || 0), 0),
        退费率: '',
        rowType: 'total',
      };
      grandTotal.退费率 = calcRefundRate(grandTotal.退费人数, grandTotal.入学人数);
    }

    return (
      <div style={{ marginBottom: 32 }}>
        <div style={titleCellStyle}>{campus}后端新生维稳个人汇总表</div>
        <table
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            minWidth: 700,
            backgroundColor: '#fff',
          }}
        >
          <thead>
            <tr>
              <th style={headerCellStyle}>月份</th>
              <th style={headerCellStyle}>教员姓名</th>
              <th style={headerCellStyle}>交接人数</th>
              <th style={headerCellStyle}>入学人数</th>
              <th style={headerCellStyle}>退费人数</th>
              <th style={headerCellStyle}>退费率</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(monthGroups.entries())
              .sort((a, b) => a[0] - b[0])
              .map(([month, rows]) => (
                <React.Fragment key={month}>
                  {rows.map((row, idx) => (
                    <tr key={`${month}-${idx}`}>
                      <td style={cellStyle}>{idx === 0 ? month : ''}</td>
                      <td style={cellStyle}>{row.教员姓名}</td>
                      <td style={cellStyle}>{row.交接人数 || 0}</td>
                      <td style={cellStyle}>{row.入学人数 || 0}</td>
                      <td style={cellStyle}>{row.退费人数 || 0}</td>
                      <td style={cellStyle}>{row.退费率}</td>
                    </tr>
                  ))}
                  {subtotals.has(month) && (
                    <tr key={`subtotal-${month}`}>
                      <td style={totalRowStyle}></td>
                      <td style={totalRowStyle}>合计</td>
                      <td style={totalRowStyle}>{subtotals.get(month)!.交接人数}</td>
                      <td style={totalRowStyle}>{subtotals.get(month)!.入学人数}</td>
                      <td style={totalRowStyle}>{subtotals.get(month)!.退费人数}</td>
                      <td style={totalRowStyle}>{subtotals.get(month)!.退费率}</td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            {grandTotal && (
              <tr>
                <td style={totalRowStyle}>总计</td>
                <td style={totalRowStyle}></td>
                <td style={totalRowStyle}>{grandTotal.交接人数}</td>
                <td style={totalRowStyle}>{grandTotal.入学人数}</td>
                <td style={totalRowStyle}>{grandTotal.退费人数}</td>
                <td style={totalRowStyle}>{grandTotal.退费率}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Card
      style={{
        marginBottom: 24,
        border: '1px solid #d9d9d9',
      }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'upload',
            label: '上传Excel文件',
            children: (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <Space>
                    <Upload
                      accept=".xlsx,.xls"
                      beforeUpload={handleFileUpload}
                      showUploadList={false}
                    >
                      <Button type="primary" icon={<UploadOutlined />} loading={loading}>
                        选择Excel文件
                      </Button>
                    </Upload>
                    {importedData && (
                      <Button icon={<DeleteOutlined />} onClick={handleClear}>
                        清空
                      </Button>
                    )}
                  </Space>
                  <Text type="secondary" style={{ marginLeft: 16, display: 'block', marginTop: 8 }}>
                    支持导入包含月度汇总、个人汇总、个人按月汇总三个表格的Excel文件
                  </Text>
                </div>
              </div>
            ),
          },
          {
            key: 'paste',
            label: '粘贴表格数据',
            children: (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                    从Excel或其他表格中复制数据，然后粘贴到下方文本框。支持制表符分隔或空格分隔的数据。
                  </Text>
                  <TextArea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="请粘贴表格数据（从Excel中复制后直接粘贴）&#10;例如：&#10;序号	神殿	交接人数	入学人数	退费人数	退费率&#10;1	盛邦	35	35	0	0"
                    rows={8}
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                  />
                  <Space style={{ marginTop: 8 }}>
                    <Button type="primary" icon={<CopyOutlined />} onClick={handlePaste} loading={loading}>
                      解析并展示
                    </Button>
                    <Button onClick={() => setPasteText('')}>
                      清空
                    </Button>
                    {importedData && (
                      <Button icon={<DeleteOutlined />} onClick={handleClear}>
                        清空所有数据
                      </Button>
                    )}
                  </Space>
                </div>
              </div>
            ),
          },
        ]}
      />

      {importedData && (
        <div style={{ marginTop: 16 }}>
          {/* 保存配置区域 */}
          <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}>
            <Space wrap>
              <span>年份：</span>
              <InputNumber
                min={2000}
                max={2100}
                value={year}
                onChange={(v) => setYear(Number(v || dayjs().year()))}
                style={{ width: 100 }}
              />
              <span>神殿：</span>
              <CampusSelector
                value={selectedCampus}
                onChange={setSelectedCampus}
                campuses={getAllCampuses()}
                style={{ width: 200 }}
              />
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveToBackend}
                loading={saving}
                size="large"
              >
                保存到后端服务器
              </Button>
            </Space>
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              <Text type="secondary">
                提示：系统会根据表格标题自动识别表格类型和神殿。如果标题中包含神殿名称，将自动使用该神殿；否则使用上方选择的神殿。
              </Text>
            </div>
          </Card>

          {/* 表格展示区域 */}
          <div style={{ overflowX: 'auto' }}>
            {renderMonthlyTable()}
            {renderPersonalTable()}
            {renderPersonalMonthlyTable()}
          </div>
        </div>
      )}

      {!importedData && activeTab === 'upload' && (
        <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
          请上传Excel文件以查看表格内容
        </div>
      )}

      {!importedData && activeTab === 'paste' && (
        <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
          请在上方文本框中粘贴表格数据，然后点击"解析并展示"
        </div>
      )}
    </Card>
  );
};

export default ExcelImportViewer;
