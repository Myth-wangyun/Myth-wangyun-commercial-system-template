/**
 * 祈福司入职离职汇总表页面
 * 数据自动从03明细表统计获取
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Select, Spin, Tabs, Button, App } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';
import Tab2EntryExitBreakdown from './Tab2EntryExitBreakdown';
import Tab3EntryExitDetail from './Tab3EntryExitDetail';
import { NoCopyContainer } from '@/components/common';

const { Option } = Select;

// 月份配置
const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
// 汇总表岗位
const positions = ['咨询干部', '咨询', '咨询助理', '渠道'];

// 表格数据行接口
interface TableRow {
  key: string;
  序号: number | string;
  岗位: string;
  招聘及离职: string;
  isTotal?: boolean;
  [key: string]: any; // 月份数据
}

const ConsultEntryExitSummaryPage: React.FC = () => {
  const { message } = App.useApp()
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<TableRow[]>([]);

  // 创建空行
  const createEmptyRow = (序号: number | string, 岗位: string, 招聘及离职: string, isTotal = false): TableRow => {
    const row: TableRow = { key: `${序号}-${岗位}-${招聘及离职}`, 序号, 岗位, 招聘及离职, isTotal };
    months.forEach(m => { row[m] = null; });
    row['合计'] = null;
    return row;
  };

  // 初始化空数据
  const initEmptyRows = useCallback(() => {
    const rows: TableRow[] = [];
    positions.forEach((position, index) => {
      rows.push(createEmptyRow(index + 1, position, '实际招聘人数'));
      rows.push(createEmptyRow(index + 1, position, '离职人数'));
    });
    // 添加总合计行
    rows.push(createEmptyRow('总合计', '', '实际招聘人数', true));
    rows.push(createEmptyRow('总合计', '', '离职人数', true));
    setDataSource(rows);
  }, []);

  // 从明细表加载统计数据
  const loadStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/v1/consult/entry-exit-detail/statistics/${year}`);
      if (response.data?.code === 0 && response.data?.data?.汇总表数据) {
        const statsData = response.data.data.汇总表数据;
        
        const newRows: TableRow[] = [];
        
        positions.forEach((position, index) => {
          const 入职数据 = statsData.find((d: any) => d.岗位 === position && d.类型 === '实际招聘人数');
          const 离职数据 = statsData.find((d: any) => d.岗位 === position && d.类型 === '离职人数');
          
          // 入职行
          const recruitRow = createEmptyRow(index + 1, position, '实际招聘人数');
          if (入职数据) {
            months.forEach(m => { recruitRow[m] = 入职数据[m] || null; });
            recruitRow['合计'] = 入职数据['合计'] || null;
          }
          newRows.push(recruitRow);
          
          // 离职行
          const exitRow = createEmptyRow(index + 1, position, '离职人数');
          if (离职数据) {
            months.forEach(m => { exitRow[m] = 离职数据[m] || null; });
            exitRow['合计'] = 离职数据['合计'] || null;
          }
          newRows.push(exitRow);
        });
        
        // 添加总合计行
        const recruitmentTotal = createEmptyRow('总合计', '', '实际招聘人数', true);
        const exitTotal = createEmptyRow('总合计', '', '离职人数', true);
        
        // 计算总合计
        months.forEach(month => {
          let recruitSum = 0;
          let exitSum = 0;
          newRows.forEach(row => {
            if (row.招聘及离职 === '实际招聘人数') {
              recruitSum += row[month] || 0;
            } else {
              exitSum += row[month] || 0;
            }
          });
          recruitmentTotal[month] = recruitSum || null;
          exitTotal[month] = exitSum || null;
        });
        
        recruitmentTotal['合计'] = months.reduce((sum, m) => sum + (recruitmentTotal[m] || 0), 0) || null;
        exitTotal['合计'] = months.reduce((sum, m) => sum + (exitTotal[m] || 0), 0) || null;
        
        newRows.push(recruitmentTotal);
        newRows.push(exitTotal);
        
        setDataSource(newRows);
      } else {
        initEmptyRows();
      }
    } catch (error: any) {
      console.error('加载统计数据失败:', error);
      initEmptyRows();
    } finally {
      setLoading(false);
    }
  }, [year, initEmptyRows]);

  // 页面加载和年份变化时自动加载数据
  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  // 年份变更
  const handleYearChange = (newYear: number) => {
    setYear(newYear);
  };

  // 渲染数值单元格
  const renderValueCell = (value: number | null, record: TableRow) => {
    const style: React.CSSProperties = {};
    if (record.isTotal) {
      style.fontWeight = 'bold';
      style.color = '#1890ff';
    }
    return <span style={style}>{value ?? ''}</span>;
  };

  // 定义表格列
  const columns: ColumnsType<TableRow> = [
    {
      title: '序号',
      dataIndex: '序号',
      key: '序号',
      width: 70,
      fixed: 'left',
      align: 'center',
      onCell: (record, index) => {
        if (record.isTotal) {
          return { colSpan: 2 };
        }
        // 合并序号列（每个岗位2行）
        if (index !== undefined) {
          const dataRows = dataSource.filter(r => !r.isTotal);
          const dataIndex = dataRows.findIndex(r => r.key === record.key);
          if (dataIndex % 2 === 0) {
            return { rowSpan: 2 };
          }
          return { rowSpan: 0 };
        }
        return {};
      },
      render: (val: number | string, record: TableRow) => {
        if (record.isTotal) {
          return <strong style={{ background: '#FFA500', color: '#fff', padding: '2px 8px' }}>{val}</strong>;
        }
        return val;
      },
    },
    {
      title: '岗位',
      dataIndex: '岗位',
      key: '岗位',
      width: 100,
      fixed: 'left',
      align: 'center',
      onCell: (record, index) => {
        if (record.isTotal) {
          return { colSpan: 0 };
        }
        // 合并岗位列（每个岗位2行）
        if (index !== undefined) {
          const dataRows = dataSource.filter(r => !r.isTotal);
          const dataIndex = dataRows.findIndex(r => r.key === record.key);
          if (dataIndex % 2 === 0) {
            return { rowSpan: 2 };
          }
          return { rowSpan: 0 };
        }
        return {};
      },
      render: (val: string) => <span style={{ fontWeight: 500 }}>{val}</span>,
    },
    {
      title: '招聘及离职',
      dataIndex: '招聘及离职',
      key: '招聘及离职',
      width: 120,
      fixed: 'left',
      align: 'center',
      render: (val: string, record: TableRow) => {
        const style: React.CSSProperties = {
          color: val === '实际招聘人数' ? '#52c41a' : '#ff4d4f',
          fontWeight: 500,
        };
        if (record.isTotal) {
          style.background = '#FFA500';
          style.color = '#fff';
          style.padding = '2px 8px';
        }
        return <span style={style}>{val}</span>;
      },
    },
    ...months.map(month => ({
      title: month,
      dataIndex: month,
      key: month,
      width: 80,
      align: 'center' as const,
      render: (val: number | null, record: TableRow) => renderValueCell(val, record),
    })),
    {
      title: '合计',
      dataIndex: '合计',
      key: '合计',
      width: 90,
      fixed: 'right',
      align: 'center' as const,
      render: (val: number | null, record: TableRow) => (
        <strong style={{ 
          color: record.isTotal ? '#1890ff' : record.招聘及离职 === '实际招聘人数' ? '#52c41a' : '#ff4d4f',
          fontSize: record.isTotal ? '14px' : '13px'
        }}>
          {val ?? ''}
        </strong>
      ),
    },
  ];

  // TAB配置
  const tabItems = [
    {
      key: '1',
      label: '01入职离职汇总表',
      children: (
        <div>
          <div
            style={{
              background: '#FFA500',
              color: '#fff',
              padding: '8px 16px',
              fontWeight: 'bold',
              fontSize: '14px',
              marginBottom: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>01最高议事厅_祈福司-入职离职汇总表</span>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              size="small"
              onClick={loadStatistics}
              loading={loading}
              style={{ background: '#fff', color: '#FFA500', borderColor: '#fff' }}
            >
              刷新统计
            </Button>
          </div>
          <Spin spinning={loading} tip="正在从明细表统计数据...">
            <Table
              columns={columns}
              dataSource={dataSource}
              pagination={false}
              bordered
              size="small"
              scroll={{ x: 1400 }}
              rowClassName={(record) => (record.isTotal ? 'total-row' : '')}
            />
          </Spin>
        </div>
      ),
    },
    {
      key: '2',
      label: '02入职离职分解表',
      children: <Tab2EntryExitBreakdown year={year.toString()} />,
    },
    {
      key: '3',
      label: '03入职离职明细表',
      children: <Tab3EntryExitDetail year={year.toString()} />,
    },
  ];

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <Card
        title={`最高议事厅祈福司-入职离职表`}
        extra={
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span>年份:</span>
            <Select
              value={year}
              style={{ width: 120 }}
              onChange={handleYearChange}
            >
              {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map((y) => (
                <Option key={y} value={y}>
                  {y}
                </Option>
              ))}
            </Select>
          </div>
        }
      >
        <Tabs items={tabItems} defaultActiveKey="1" />
      </Card>

      <style>
        {`
          .total-row {
            background-color: #fffbe6;
          }
          .total-row td {
            background-color: #fffbe6 !important;
            font-weight: bold;
          }
          .ant-table-cell {
            padding: 8px !important;
          }
        `}
      </style>
    </NoCopyContainer>
  );
};

export default ConsultEntryExitSummaryPage;
