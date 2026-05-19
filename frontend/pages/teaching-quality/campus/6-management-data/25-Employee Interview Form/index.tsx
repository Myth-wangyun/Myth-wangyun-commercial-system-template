/**
 * 神殿教质部员工访谈表页面（按 年 + 月 存储，每行只有“访谈时间、访谈内容”两个字段）
 */

import React, { useState, useMemo, useEffect } from 'react';
import { App,
  Card,
  Table,
  Button,
  Space,
  Select,
  Input,
  DatePicker,
} from 'antd';
import {
  ReloadOutlined,
  DownloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileTextOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useCampusStore } from '@/stores/campusStore';
import dayjs, { Dayjs } from 'dayjs';

const { TextArea } = Input;

import { buildApiUrl } from '@/utils/apiBase';

// 前端行结构 - 存储12个月的数据
interface MonthData {
  interviewTime?: string;
  interviewContent?: string;
}

interface EmployeeInterviewRecord {
  key: string;
  serialNumber: number; // 序号
  interviewSubject: string; // 访谈对象
  monthsData: MonthData[]; // 12个月的数据 (索引 0-11 对应 1月-12月)
}

// 后端结构
interface RowInput {
  序号: number;
  访谈对象: string;
  访谈时间?: string | null;
  访谈内容?: string | null;
}
interface ListOutput {
  神殿名称: string;
  年份: number;
  月份: number;
  行列表: RowInput[];
}

const createEmptyRow = (index: number): EmployeeInterviewRecord => ({
  key: String(index),
  serialNumber: index,
  interviewSubject: '',
  monthsData: Array(12).fill(null).map(() => ({ interviewTime: '', interviewContent: '' })),
});

const CampusEmployeeInterviewPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore();
  const campuses = getAllCampuses();
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '');
  const [selectedYear, setSelectedYear] = useState<Dayjs>(dayjs());
  const [dataSource, setDataSource] = useState<EmployeeInterviewRecord[]>([createEmptyRow(1)]);
  const [editingKey, setEditingKey] = useState<string>('');
  const [editingField, setEditingField] = useState<string>('');

  const yearNumber = selectedYear.year();

  // 生成月份列 - 显示12个月
  const generateMonthColumns = (): ColumnsType<EmployeeInterviewRecord> => {
    const monthColumns: ColumnsType<EmployeeInterviewRecord> = [];
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    months.forEach((monthLabel, monthIndex) => {
      monthColumns.push({
        title: monthLabel,
        key: `month-${monthIndex}`,
        align: 'center' as const,
        children: [
          {
            title: '访谈时间',
            key: `interviewTime-${monthIndex}`,
            width: 160,
            align: 'center' as const,
            render: (_, record) => {
              const fieldKey = `interviewTime-${monthIndex}`;
              const isEditing = editingKey === record.key && editingField === fieldKey;
              const value = record.monthsData[monthIndex]?.interviewTime || '';
              const dateValue = value ? dayjs(value, 'YYYY-MM-DD') : null;
              
              if (isEditing) {
                return (
                  <DatePicker
                    value={dateValue}
                    onChange={(date) => {
                      const newDataSource = [...dataSource];
                      const index = newDataSource.findIndex(item => item.key === record.key);
                      if (index !== -1) {
                        newDataSource[index].monthsData[monthIndex].interviewTime = date ? date.format('YYYY-MM-DD') : '';
                        setDataSource(newDataSource);
                        // 选择后直接退出编辑，显示结果
                        setTimeout(() => {
                          setEditingKey('');
                          setEditingField('');
                        }, 0);
                      }
                    }}
                    allowClear
                    autoFocus
                    size="small"
                    format="YYYY-MM-DD"
                    getPopupContainer={() => document.body}
                    style={{ width: '100%' }}
                  />
                );
              }
              return (
                <div onClick={() => { 
                      setEditingKey(record.key); 
                      setEditingField(fieldKey);
                    }}
                     style={{ cursor: 'pointer', minHeight: '32px', padding: '4px', fontSize: '12px' }}>
                  {value}
                </div>
              );
            },
          },
          {
            title: '访谈内容',
            key: `interviewContent-${monthIndex}`,
            width: 180,
            align: 'center' as const,
            render: (_, record) => {
              const fieldKey = `interviewContent-${monthIndex}`;
              const isEditing = editingKey === record.key && editingField === fieldKey;
              const value = record.monthsData[monthIndex]?.interviewContent || '';
              
              if (isEditing) {
                return (
                  <TextArea
                    value={value}
                    onChange={(e) => {
                      const newDataSource = [...dataSource];
                      const index = newDataSource.findIndex(item => item.key === record.key);
                      if (index !== -1) {
                        newDataSource[index].monthsData[monthIndex].interviewContent = e.target.value;
                        setDataSource(newDataSource);
                      }
                    }}
                    onBlur={() => { setEditingKey(''); setEditingField(''); }}
                    autoSize={{ minRows: 2, maxRows: 3 }}
                    autoFocus
                    size="small"
                  />
                );
              }
              return (
                <div onClick={() => { setEditingKey(record.key); setEditingField(fieldKey); }}
                     style={{ cursor: 'pointer', minHeight: '32px', padding: '4px', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                  {value}
                </div>
              );
            },
          },
        ],
      });
    });
    
    return monthColumns;
  };

  // 定义表格列（显示12个月的访谈时间与访谈内容）
  const columns: ColumnsType<EmployeeInterviewRecord> = useMemo(() => {
    const baseColumns: ColumnsType<EmployeeInterviewRecord> = [
      {
        title: '序号',
        dataIndex: 'serialNumber',
        key: 'serialNumber',
        width: 60,
        align: 'center',
        render: (value) => value,
        fixed: 'left',
      },
      {
        title: '访谈对象',
        dataIndex: 'interviewSubject',
        key: 'interviewSubject',
        width: 140,
        align: 'center',
        fixed: 'left',
        render: (value, record) => {
          const isEditing = editingKey === record.key && editingField === 'interviewSubject';
          if (isEditing) {
            return (
              <Input
                value={value}
                onChange={(e) => {
                  const newDataSource = [...dataSource];
                  const index = newDataSource.findIndex(item => item.key === record.key);
                  if (index !== -1) {
                    newDataSource[index].interviewSubject = e.target.value;
                    setDataSource(newDataSource);
                  }
                }}
                onBlur={() => { setEditingKey(''); setEditingField(''); }}
                onPressEnter={() => { setEditingKey(''); setEditingField(''); }}
                autoFocus
                size="small"
              />
            );
          }
          return (
            <div onClick={() => { setEditingKey(record.key); setEditingField('interviewSubject'); }}
                 style={{ cursor: 'pointer', minHeight: '32px', padding: '4px', fontSize: '12px' }}>
              {value}
            </div>
          );
        },
      },
      ...generateMonthColumns(),
      {
        title: '操作',
        key: 'action',
        width: 100,
        align: 'center',
        fixed: 'right',
        render: (_: any, record) => (
          <Space size="small">
            <Button type="link" size="small" icon={<DeleteOutlined />} onClick={() => {
              const newDataSource = dataSource.filter(item => item.key !== record.key);
              newDataSource.forEach((item, index) => { item.serialNumber = index + 1; });
              setDataSource(newDataSource);
              message.success('删除成功');
            }}>删除</Button>
          </Space>
        ),
      },
    ];
    return baseColumns;
  }, [dataSource, editingKey, editingField]);

  // 加载 - 加载整年的数据
  const loadData = async () => {
    if (!selectedCampus) {
      message.warning('请先选择神殿');
      return;
    }
    try {
      // 加载整年的数据（12个月）
      const allMonthsData: EmployeeInterviewRecord[] = [];
      
      for (let month = 1; month <= 12; month++) {
        const url = `${buildApiUrl('/teaching-quality/employee-interview')}?campus=${encodeURIComponent(selectedCampus)}&year=${yearNumber}&month=${month}`;
        const res = await fetch(url);
        if (!res.ok) continue;
        
        const data: ListOutput = await res.json();
        if (data.行列表 && data.行列表.length > 0) {
          data.行列表.forEach((r) => {
            let existingRecord = allMonthsData.find(item => item.serialNumber === r.序号);
            if (!existingRecord) {
              existingRecord = {
                key: String(r.序号),
                serialNumber: r.序号,
                interviewSubject: r.访谈对象 || '',
                monthsData: Array(12).fill(null).map(() => ({ interviewTime: '', interviewContent: '' })),
              };
              allMonthsData.push(existingRecord);
            }
            // 填充该月份的数据
            existingRecord.monthsData[month - 1] = {
              interviewTime: r.访谈时间 || '',
              interviewContent: r.访谈内容 || '',
            };
          });
        }
      }
      
      if (allMonthsData.length === 0) {
        setDataSource([createEmptyRow(1)]);
      } else {
        allMonthsData.sort((a, b) => a.serialNumber - b.serialNumber);
        setDataSource(allMonthsData);
      }
      message.success('已加载');
    } catch (e: any) {
      console.error(e);
      message.error('加载失败：' + (e?.message || '未知错误'));
    }
  };

  // 保存 - 保存整年的数据
  const handleSave = async () => {
    if (!selectedCampus) {
      message.warning('请先选择神殿');
      return;
    }
    try {
      // 为每个月份分别保存数据
      for (let month = 1; month <= 12; month++) {
        const monthData = dataSource.map((r) => ({
          序号: r.serialNumber,
          访谈对象: r.interviewSubject || '',
          访谈时间: r.monthsData[month - 1]?.interviewTime || null,
          访谈内容: r.monthsData[month - 1]?.interviewContent || null,
        }));
        
        const payload = {
          神殿名称: selectedCampus,
          年份: yearNumber,
          月份: month,
          行列表: monthData,
        };
        
        const res = await fetch(buildApiUrl('/teaching-quality/employee-interview'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      
      await loadData();
      message.success('保存成功');
    } catch (e: any) {
      console.error(e);
      message.error('保存失败：' + (e?.message || '未知错误'));
    }
  };

  // 刷新数据
  const handleRefresh = () => { loadData(); };

  // 导出数据（占位）
  const handleExport = () => { message.info('导出功能开发中...'); };

  // 添加新记录
  const handleAdd = () => {
    const newKey = `${Date.now()}`;
    const newRecord: EmployeeInterviewRecord = createEmptyRow(dataSource.length + 1);
    newRecord.key = newKey;
    setDataSource([...dataSource, newRecord]);
    setEditingKey(newKey);
    setEditingField('interviewSubject');
  };

  // 神殿选择变化
  const handleCampusChange = (value: string) => { setSelectedCampus(value); setCampus(value); };

  // 首次、切换神殿/年份时自动加载
  useEffect(() => { if (selectedCampus) loadData(); }, [selectedCampus, yearNumber]);

  // 表头样式
  const headerCellStyle: React.CSSProperties = {
    backgroundColor: '#fffacd',
    fontWeight: 'bold',
    textAlign: 'center',
  };
  const monthHeaderCellStyle: React.CSSProperties = {
    backgroundColor: '#d4edda',
    fontWeight: 'bold',
    textAlign: 'center',
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ 
        marginBottom: 24, 
        textAlign: 'center', 
        fontSize: '20px', 
        fontWeight: 'bold',
        padding: '16px',
        backgroundColor: '#fff1f0',
        borderRadius: 4,
        border: '1px solid #ffccc7',
      }}>
        <FileTextOutlined style={{ marginRight: 8 }} />
        员工访谈情况表
      </div>

      <Card>
        {/* 操作栏 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <span>神殿：</span>
            <Select
              value={selectedCampus}
              onChange={handleCampusChange}
              style={{ width: 180 }}
              placeholder="请选择神殿"
              options={campuses.map((campus) => ({ value: campus.name, label: campus.name }))}
            />
            <span>年份：</span>
            <DatePicker picker="year" value={selectedYear} onChange={(d)=> d && setSelectedYear(d)} style={{ width: 120 }} />
          </Space>
          <Space>
            <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>新增</Button>
            <Button icon={<SaveOutlined />} type="primary" ghost onClick={handleSave}>保存</Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>加载</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>
          </Space>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          scroll={{ x: 'max-content', y: 600 }}
          bordered
          size="small"
          rowKey="key"
          components={{
            header: {
              cell: (props: any) => {
                const { children, ...restProps } = props;
                const isMonthHeader = children && typeof children === 'string' && /月$/.test(children);
                const mergedProps = {
                  ...restProps,
                  style: {
                    ...props.style,
                    ...(isMonthHeader ? monthHeaderCellStyle : headerCellStyle),
                  },
                };
                return <th {...mergedProps}>{children}</th>;
              },
            },
          }}
        />
        <style>{`
          .ant-table-thead > tr > th { background-color: #fffacd !important; font-weight: bold; text-align: center; }
          .ant-table-thead > tr:first-child > th { background-color: #fffacd !important; }
          .ant-table-thead > tr:first-child > th[colspan] { background-color: #d4edda !important; }
          .ant-table-thead > tr:last-child > th { background-color: #fff !important; }
          .ant-table-cell { padding: 8px 4px !important; }
        `}</style>
      </Card>
    </div>
  );
};

export default CampusEmployeeInterviewPage;
