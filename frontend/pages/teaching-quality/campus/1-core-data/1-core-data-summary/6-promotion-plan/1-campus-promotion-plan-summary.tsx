import React, { useEffect, useMemo, useState } from 'react';
import { App, Card, Table, InputNumber, Space, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCampusStore } from '@/stores/campusStore';
import { buildApiUrl } from '@/utils/apiBase';

interface MonthRow {
  key: string;
  month: number;
  campus: string;
  classCount: number;
  fileCount: number;
  expectedPromotionCount: number;
  actualPromotionCount: number;
  receivablePromotionRevenue: number;
  expectedPromotionRevenue: number;
  actualPromotionRevenue: number;
}

interface TableRow extends MonthRow {
  isSummary?: boolean;
}

const createInitialRows = (campus: string): MonthRow[] =>
  Array.from({ length: 12 }, (_, idx) => {
    const month = idx + 1;
    return {
      key: String(month),
      month,
      campus: month === 1 ? campus : '',
      classCount: 0,
      fileCount: 0,
      expectedPromotionCount: 0,
      actualPromotionCount: 0,
      receivablePromotionRevenue: 0,
      expectedPromotionRevenue: 0,
      actualPromotionRevenue: 0,
    };
  });

const formatRate = (numerator: number, denominator: number) => {
  if (!denominator || denominator === 0) return '0%';
  const rate = (numerator / denominator) * 100;
  const fixed = rate.toFixed(1);
  const text = fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
  return `${text}%`;
};

const CampusPromotionPlanSummary: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [rows, setRows] = useState<MonthRow[]>([]);

  const canIO = useMemo(() => Boolean(currentCampus && year), [currentCampus, year]);

  const summaryRow: TableRow = useMemo(() => {
    const total = rows.reduce(
      (acc, r) => {
        acc.classCount += r.classCount || 0;
        acc.fileCount += r.fileCount || 0;
        acc.expectedPromotionCount += r.expectedPromotionCount || 0;
        acc.actualPromotionCount += r.actualPromotionCount || 0;
        acc.receivablePromotionRevenue += r.receivablePromotionRevenue || 0;
        acc.expectedPromotionRevenue += r.expectedPromotionRevenue || 0;
        acc.actualPromotionRevenue += r.actualPromotionRevenue || 0;
        return acc;
      },
      {
        classCount: 0,
        fileCount: 0,
        expectedPromotionCount: 0,
        actualPromotionCount: 0,
        receivablePromotionRevenue: 0,
        expectedPromotionRevenue: 0,
        actualPromotionRevenue: 0,
      },
    );

    return {
      key: 'summary',
      month: 0,
      campus: '',
      ...total,
      isSummary: true,
    };
  }, [rows]);

  const dataSource: TableRow[] = [...rows, summaryRow];

  const fetchFromServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿和年份');
      return;
    }
    try {
      const res = await fetch(
        buildApiUrl(`/teaching-quality/campus-promotion-plan-summary?campus=${encodeURIComponent(
          currentCampus!
        )}&year=${year}`),
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const serverRows = (data?.行列表 || []) as any[];

      const newRows = createInitialRows(currentCampus!);
      serverRows.forEach((r: any) => {
        const month = Number(r.month);
        if (month >= 1 && month <= 12) {
          const idx = month - 1;
          newRows[idx] = {
            ...newRows[idx],
            classCount: Number(r.classCount || 0),
            fileCount: Number(r.fileCount || 0),
            expectedPromotionCount: Number(r.expectedPromotionCount || 0),
            actualPromotionCount: Number(r.actualPromotionCount || 0),
            receivablePromotionRevenue: Number(r.receivablePromotionRevenue || 0),
            expectedPromotionRevenue: Number(r.expectedPromotionRevenue || 0),
            actualPromotionRevenue: Number(r.actualPromotionRevenue || 0),
          };
        }
      });
      setRows(newRows);
      message.success('数据已刷新');
    } catch (e) {
      console.error(e);
      setRows(createInitialRows(currentCampus!));
      message.error('数据加载失败');
    }
  };

  useEffect(() => {
    if (canIO) {
      fetchFromServer();
    } else {
      setRows([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year]);

  // 监听班升学明细表保存事件，自动刷新
  useEffect(() => {
    const handleDataUpdate = (event: any) => {
      if (canIO) {
        console.log('清美教育各神殿升学计划收到数据更新事件:', event.detail);
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


  const columns: ColumnsType<TableRow> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      render: (value: number, record) =>
        record.isSummary ? (
          <span style={{ color: 'red', fontWeight: 'bold' }}>合计/平均</span>
        ) : (
          value
        ),
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      align: 'center',
      render: (text: string, record) =>
        record.isSummary ? '' : text || '',
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
      title: '应收升学收入',
      dataIndex: 'receivablePromotionRevenue',
      key: 'receivablePromotionRevenue',
      width: 150,
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
        const denominator = record.receivablePromotionRevenue;
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
        const denominator = record.receivablePromotionRevenue;
        const numerator = record.actualPromotionRevenue;
        return formatRate(numerator, denominator);
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title="06XX神殿教化司升学计划" extra={
        <Space>
          <span>年份:</span>
          <InputNumber
            min={2000}
            max={2100}
            value={year}
            onChange={(v) => setYear(v || new Date().getFullYear())}
          />
          <Button onClick={fetchFromServer} disabled={!canIO}>刷新</Button>
        </Space>
      }>
        <Table<TableRow>
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

export default CampusPromotionPlanSummary;
