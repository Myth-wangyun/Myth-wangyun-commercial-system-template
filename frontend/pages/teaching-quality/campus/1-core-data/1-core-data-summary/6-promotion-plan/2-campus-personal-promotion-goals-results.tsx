/**
 * 06-1XX神殿教化司个人升学目标与结果汇总表 (只读)
 * 数据来源：teaching_quality.神殿升学计划汇总表（按班主任和年份汇总）
 * 通过后端视图 v_personal_promotion_summary 自动计算。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { App, Card, Table, InputNumber, Space, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCampusStore } from '@/stores/campusStore';
import { buildApiUrl, apiFetch } from '@/utils/apiBase';

interface PersonalPromotionRow {
  key: string;
  serialNumber: number;
  name: string;
  classCount: number;
  fileCount: number;
  expectedPromotionCount: number;
  actualPromotionCount: number;
  receivableAmount: number;
  expectedPromotionRevenue: number;
  actualPromotionRevenue: number;
  isSummary?: boolean;
}

const recomputeSummary = (
  rows: PersonalPromotionRow[],
): PersonalPromotionRow => {
  const total = rows.reduce(
    (acc, r) => {
      if (r.isSummary) return acc;
      acc.classCount += r.classCount || 0;
      acc.fileCount += r.fileCount || 0;
      acc.expectedPromotionCount += r.expectedPromotionCount || 0;
      acc.actualPromotionCount += r.actualPromotionCount || 0;
      acc.receivableAmount += r.receivableAmount || 0;
      acc.expectedPromotionRevenue += r.expectedPromotionRevenue || 0;
      acc.actualPromotionRevenue += r.actualPromotionRevenue || 0;
      return acc;
    },
    {
      classCount: 0,
      fileCount: 0,
      expectedPromotionCount: 0,
      actualPromotionCount: 0,
      receivableAmount: 0,
      expectedPromotionRevenue: 0,
      actualPromotionRevenue: 0,
    },
  );

  return {
    key: 'summary',
    serialNumber: 0,
    name: '合计',
    ...total,
    isSummary: true,
  };
};

const formatRate = (numerator: number, denominator: number) => {
  if (!denominator || denominator === 0) return '0%';
  const rate = (numerator / denominator) * 100;
  const fixed = rate.toFixed(1);
  const text = fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
  return `${text}%`;
};

const ShengbangPersonalPromotionGoalsResults: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [rows, setRows] = useState<PersonalPromotionRow[]>([]);

  const canIO = useMemo(() => Boolean(year), [year]);

  const summaryRow = useMemo(() => recomputeSummary(rows), [rows]);
  const dataSource = useMemo(() => [...rows, summaryRow], [rows, summaryRow]);

  const fetchFromServer = async () => {
    if (!year) {
      message.warning('请先选择年份');
      return;
    }
    try {
      const res = await apiFetch(
        buildApiUrl(`/teaching-quality/campus-personal-promotion-goals-results?year=${year}`),
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const serverRows = ((data?.行列表 || []) as any[]).map((r, index) => ({
        key: String(index + 1),
        serialNumber: index + 1,
        name: r.name || '',
        classCount: Number(r.classCount || 0),
        fileCount: Number(r.fileCount || 0),
        expectedPromotionCount: Number(r.expectedPromotionCount || 0),
        actualPromotionCount: Number(r.actualPromotionCount || 0),
        receivableAmount: Number(r.receivableAmount || 0),
        expectedPromotionRevenue: Number(r.expectedPromotionRevenue || 0),
        actualPromotionRevenue: Number(r.actualPromotionRevenue || 0),
      }));
      setRows(serverRows);
      message.success(`已加载${serverRows.length}位教师的年度汇总数据（来自神殿升学计划汇总表）`);
    } catch (e) {
      console.error(e);
      setRows([]);
      message.error('数据加载失败');
    }
  };

  useEffect(() => {
    if (canIO) {
      fetchFromServer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  // 监听班升学明细表保存事件，自动刷新
  useEffect(() => {
    const handleDataUpdate = () => {
      if (canIO) {
        fetchFromServer();
      }
    };
    window.addEventListener('promotionDataUpdated', handleDataUpdate);
    return () => {
      window.removeEventListener('promotionDataUpdated', handleDataUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canIO]);

  // 定期自动刷新（每30秒）
  useEffect(() => {
    if (!canIO) return;
    const interval = setInterval(() => {
      fetchFromServer();
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canIO]);

  const columns: ColumnsType<PersonalPromotionRow> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      align: 'center',
      onCell: (record) => {
        if (record.isSummary) {
          return { colSpan: 2, style: { textAlign: 'center' } };
        }
        return { colSpan: 1, style: { textAlign: 'center' } };
      },
      render: (value, record) =>
        record.isSummary ? (
          <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span>
        ) : (
          value
        ),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 140,
      align: 'center',
      onCell: (record) => {
        if (record.isSummary) {
          return { colSpan: 0, style: { textAlign: 'center' } };
        }
        return { colSpan: 1, style: { textAlign: 'center' } };
      },
      render: (text: string, record) =>
        record.isSummary ? (
          <span style={{ color: 'red', fontWeight: 'bold' }}>{text}</span>
        ) : (
          text
        ),
    },
    {
      title: '升学班级总数',
      dataIndex: 'classCount',
      key: 'classCount',
      width: 130,
      align: 'center',
    },
    {
      title: '在档总人数',
      dataIndex: 'fileCount',
      key: 'fileCount',
      width: 130,
      align: 'center',
    },
    {
      title: '预计升学总人数',
      dataIndex: 'expectedPromotionCount',
      key: 'expectedPromotionCount',
      width: 150,
      align: 'center',
    },
    {
      title: '实际升学总人数',
      dataIndex: 'actualPromotionCount',
      key: 'actualPromotionCount',
      width: 150,
      align: 'center',
    },
    {
      title: '预计升学率（人数）',
      dataIndex: 'expectedRateCount',
      key: 'expectedRateCount',
      width: 150,
      align: 'center',
      render: (_: unknown, record) => {
        const denominator = record.fileCount;
        const numerator = record.expectedPromotionCount;
        return formatRate(numerator, denominator);
      },
    },
    {
      title: '实际升学率（人数）',
      dataIndex: 'actualRateCount',
      key: 'actualRateCount',
      width: 150,
      align: 'center',
      render: (_: unknown, record) => {
        const denominator = record.fileCount;
        const numerator = record.actualPromotionCount;
        return formatRate(numerator, denominator);
      },
    },
    {
      title: '应收',
      dataIndex: 'receivableAmount',
      key: 'receivableAmount',
      width: 120,
      align: 'center',
    },
    {
      title: '预计升学收入',
      dataIndex: 'expectedPromotionRevenue',
      key: 'expectedPromotionRevenue',
      width: 150,
      align: 'center',
    },
    {
      title: '实际升学收入',
      dataIndex: 'actualPromotionRevenue',
      key: 'actualPromotionRevenue',
      width: 150,
      align: 'center',
    },
    {
      title: '预计升学率（金额）',
      dataIndex: 'expectedRateAmount',
      key: 'expectedRateAmount',
      width: 160,
      align: 'center',
      render: (_: unknown, record) => {
        const denominator = record.receivableAmount;
        const numerator = record.expectedPromotionRevenue;
        return formatRate(numerator, denominator);
      },
    },
    {
      title: '实际升学率（金额）',
      dataIndex: 'actualRateAmount',
      key: 'actualRateAmount',
      width: 160,
      align: 'center',
      render: (_: unknown, record) => {
        const denominator = record.receivableAmount;
        const numerator = record.actualPromotionRevenue;
        return formatRate(numerator, denominator);
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <div>
            <div>06-1XX神殿教化司个人升学目标与结果汇总表</div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
              数据来源：teaching_quality.每月个人升学目标与结果表（按姓名汇总全年12个月）
            </div>
          </div>
        }
        extra={
          <Space>
            <span>年份:</span>
            <InputNumber
              min={2000}
              max={2100}
              value={year}
              onChange={(v) => setYear(v || new Date().getFullYear())}
            />
            <Button onClick={fetchFromServer} disabled={!canIO}>从月度表汇总</Button>
          </Space>
        }
      >
        <Table<PersonalPromotionRow>
          bordered
          size="small"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};

export default ShengbangPersonalPromotionGoalsResults;
