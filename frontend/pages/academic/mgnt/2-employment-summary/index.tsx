// 最高议事厅 · 智慧司 · 02. 后端学员就业汇总表（按神殿聚合展示）
import React from 'react';
import { App, Card, Table, Button, Space, Tag, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { employmentSummaryService, type CampusEmploymentSummaryRow } from '@/services/academic/employmentSummary';

type Row = CampusEmploymentSummaryRow;

const fmtCurrency = (n: number | null) => (n === null ? '#DIV/0!' : `¥${Math.round(n).toLocaleString()}`);
const fmtRate = (n: number | null) => (n === null ? '#DIV/0!' : `${n.toFixed(1)}%`);

// 标准化神殿名称，用于匹配
const normalizeCampusName = (name: string): string => {
  return name.replace(/神殿$/, '').trim();
};

// 生成年份选项：从2020年到当前年份，加上"历史合计"
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years: { label: string; value: number | 'all' }[] = [
    { label: '历史合计', value: 'all' },
  ];
  for (let year = currentYear; year >= 2020; year--) {
    years.push({ label: `${year}年`, value: year });
  }
  return years;
};

const EmploymentSummaryPage: React.FC = () => {
  const { message } = App.useApp()
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedYear, setSelectedYear] = React.useState<number | 'all'>('all');

  const load = React.useCallback(async (year?: number | 'all') => {
    setLoading(true);
    try {
      // 如果是"历史合计"，则不传年份参数
      const yearParam = year === 'all' ? undefined : year;
      
      // 并行调用两个API
      const [list, highSalaryStats] = await Promise.all([
        employmentSummaryService.fetchAllCampusEmploymentSummary(yearParam),
        employmentSummaryService.fetchHighSalaryStatsByCampus(),
      ]);

      // 合并薪资过万人数到数据中
      const mergedList = list.map(row => {
        const normalizedCampus = normalizeCampusName(row.campus);
        // 尝试多种匹配方式
        const count = highSalaryStats[row.campus] 
          || highSalaryStats[normalizedCampus] 
          || highSalaryStats[`${normalizedCampus}神殿`]
          || 0;
        return {
          ...row,
          salaryOver10kCount: count,
        };
      });

      console.log('[就业汇总] 合并薪资过万统计后:', mergedList);
      setRows(mergedList);
    } catch (error) {
      console.error('加载就业汇总失败:', error);
      message.error('加载就业汇总失败');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load(selectedYear);
  }, [load, selectedYear]);

  const handleYearChange = (value: number | 'all') => {
    setSelectedYear(value);
  };

  const columns: ColumnsType<Row> = [
    { title: '序号', dataIndex: 'serialNumber', key: 'serialNumber', width: 60, align: 'center' },
    { title: '神殿', dataIndex: 'campus', key: 'campus', width: 80, align: 'center' },
    { title: '班级数量', dataIndex: 'classCount', key: 'classCount', width: 90, align: 'center' },
    {
      title: '就业薪资',
      children: [
        {
          title: '目标平均就业薪资',
          dataIndex: 'targetAvgSalary',
          key: 'targetAvgSalary',
          width: 140,
          align: 'center',
          render: (v: number | null) => (v === null ? <span style={{ color: '#cf1322' }}>#DIV/0!</span> : fmtCurrency(v)),
        },
        {
          title: '实际平均就业薪资',
          dataIndex: 'actualAvgSalary',
          key: 'actualAvgSalary',
          width: 140,
          align: 'center',
          render: (v: number | null) => (v === null ? <span style={{ color: '#cf1322' }}>#DIV/0!</span> : fmtCurrency(v)),
        },
        {
          title: '达标率',
          dataIndex: 'attainmentRate',
          key: 'attainmentRate',
          width: 100,
          align: 'center',
          render: (v: number | null) =>
            v === null ? (
              <span style={{ color: '#cf1322' }}>#DIV/0!</span>
            ) : (
              <Tag color={v >= 95 ? 'green' : v >= 90 ? 'orange' : 'red'}>{fmtRate(v)}</Tag>
            ),
        },
      ],
    },
    {
      title: '就业率',
      children: [
        { title: '档案人数', dataIndex: 'archiveCount', key: 'archiveCount', width: 100, align: 'center' },
        { title: '目标就业人数', dataIndex: 'targetEmploymentCount', key: 'targetEmploymentCount', width: 120, align: 'center' },
        { title: '实际就业人数', dataIndex: 'actualEmploymentCount', key: 'actualEmploymentCount', width: 120, align: 'center' },
        {
          title: '就业率',
          dataIndex: 'employmentRate',
          key: 'employmentRate',
          width: 100,
          align: 'center',
          render: (v: number | null) =>
            v === null ? (
              <span style={{ color: '#cf1322' }}>#DIV/0!</span>
            ) : (
              <Tag color={v >= 95 ? 'green' : v >= 90 ? 'orange' : 'red'}>{fmtRate(v)}</Tag>
            ),
        },
      ],
    },
    { title: '薪资过万人数', dataIndex: 'salaryOver10kCount', key: 'salaryOver10kCount', width: 110, align: 'center' },
  ];

  const summaryRow = () => {
    if (!rows.length) return null;
    const sum = rows.reduce(
      (a, r) => ({
        classCount: a.classCount + r.classCount,
        targetAvg: r.targetAvgSalary != null ? a.targetAvg + r.targetAvgSalary : a.targetAvg,
        targetCnt: a.targetCnt + (r.targetAvgSalary != null ? 1 : 0),
        actualAvg: r.actualAvgSalary != null ? a.actualAvg + r.actualAvgSalary : a.actualAvg,
        actualCnt: a.actualCnt + (r.actualAvgSalary != null ? 1 : 0),
        attRate: r.attainmentRate != null ? a.attRate + r.attainmentRate : a.attRate,
        attCnt: a.attCnt + (r.attainmentRate != null ? 1 : 0),
        file: a.file + r.archiveCount,
        targetEmp: a.targetEmp + r.targetEmploymentCount,
        actualEmp: a.actualEmp + r.actualEmploymentCount,
        empRate: r.employmentRate != null ? a.empRate + r.employmentRate : a.empRate,
        empCnt: a.empCnt + (r.employmentRate != null ? 1 : 0),
        over10k: a.over10k + r.salaryOver10kCount,
      }),
      {
        classCount: 0,
        targetAvg: 0,
        targetCnt: 0,
        actualAvg: 0,
        actualCnt: 0,
        attRate: 0,
        attCnt: 0,
        file: 0,
        targetEmp: 0,
        actualEmp: 0,
        empRate: 0,
        empCnt: 0,
        over10k: 0,
      }
    );

    let i = 0;
    return (
      <Table.Summary fixed>
        <Table.Summary.Row>
          <Table.Summary.Cell index={i++} colSpan={2}>
            <strong>合计/平均</strong>
          </Table.Summary.Cell>
          {/* 班级数量 */}
          <Table.Summary.Cell index={i++} align="center">
            <strong>{sum.classCount}</strong>
          </Table.Summary.Cell>
          {/* 就业薪资 3列 */}
          <Table.Summary.Cell index={i++} align="center">
            <strong>{sum.targetCnt ? fmtCurrency(sum.targetAvg / sum.targetCnt) : <span style={{ color: '#cf1322' }}>#DIV/0!</span>}</strong>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={i++} align="center">
            <strong>{sum.actualCnt ? fmtCurrency(sum.actualAvg / sum.actualCnt) : <span style={{ color: '#cf1322' }}>#DIV/0!</span>}</strong>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={i++} align="center">
            <strong>{sum.attCnt ? fmtRate(sum.attRate / sum.attCnt) : <span style={{ color: '#cf1322' }}>#DIV/0!</span>}</strong>
          </Table.Summary.Cell>
          {/* 就业率 4列 */}
          <Table.Summary.Cell index={i++} align="center">
            <strong>{sum.file}</strong>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={i++} align="center">
            <strong>{sum.targetEmp}</strong>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={i++} align="center">
            <strong>{sum.actualEmp}</strong>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={i++} align="center">
            <strong>
              {sum.targetEmp
                ? fmtRate((sum.actualEmp / sum.targetEmp) * 100)
                : <span style={{ color: '#cf1322' }}>#DIV/0!</span>}
            </strong>
          </Table.Summary.Cell>
          {/* 薪资过万人数 */}
          <Table.Summary.Cell index={i++} align="center">
            <strong>{sum.over10k}</strong>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </Table.Summary>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ marginBottom: 12 }}>
          <Space>
            <span>年份：</span>
            <Select
              value={selectedYear}
              onChange={handleYearChange}
              style={{ width: 120 }}
              options={generateYearOptions()}
            />
            <Button onClick={() => load(selectedYear)}>刷新</Button>
          </Space>
        </div>
        <Table<Row>
          columns={columns}
          dataSource={rows}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1600, y: 600 }}
          sticky
          pagination={{ defaultPageSize: 20, showSizeChanger: true, showQuickJumper: true }}
          summary={summaryRow}
        />
      </Card>
    </div>
  );
};

export default EmploymentSummaryPage;
