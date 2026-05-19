import React, { useEffect, useMemo, useState } from 'react';
import { App, Card, Table, InputNumber, Input, Space, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'

interface MonthRow {
  key: string;
  month: number; // 1-12
  campus: string;
  transferCount: number; // 交接人数
  reportedCount: number; // 报道人数
  stableCount: number; // 稳定过课时人数
  unstableCount: number; // 未过课时人数
  fullRefundCount: number; // 回全款人数
  arrearsCount: number; // 仍欠费人数
  arrearsAmount: number; // 欠费总金额
  refundCount: number; // 退费人数
  refundNote: string; // 退费学员情况说明
}

interface TableRow extends MonthRow {
  isSummary?: boolean;
}

const createEmptyYearRows = (campus: string): MonthRow[] =>
  Array.from({ length: 12 }, (_, idx) => {
    const month = idx + 1;
    return {
      key: String(month),
      month,
      campus,
      transferCount: 0,
      reportedCount: 0,
      stableCount: 0,
      unstableCount: 0,
      fullRefundCount: 0,
      arrearsCount: 0,
      arrearsAmount: 0,
      refundCount: 0,
      refundNote: '',
    };
  });

const formatRefundRate = (refundCount: number, reportedCount: number) => {
  if (!reportedCount || reportedCount === 0) return '0%';
  const rate = (refundCount / reportedCount) * 100;
  const fixed = rate.toFixed(1);
  const text = fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
  return `${text}%`;
};

const CampusNewStuStabilitySummary: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [rows, setRows] = useState<MonthRow[]>(createEmptyYearRows(currentCampus || ''));

  useEffect(() => {
    setRows(createEmptyYearRows(currentCampus || ''))
  }, [currentCampus])

  // 打开页面时自动刷新一次（以及神殿/年份变化时也刷新）
  useEffect(() => {
    if (!currentCampus || !year) return
    fetchFromServer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year])

  // 监听“月度个人统计表保存”事件，自动刷新一次
  useEffect(() => {
    const handler = () => {
      fetchFromServer()
    }
    window.addEventListener('newStudentStabilityDataUpdated', handler as EventListener)
    return () => {
      window.removeEventListener('newStudentStabilityDataUpdated', handler as EventListener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year])

  const summaryRow: TableRow = useMemo(() => {
    const total = rows.reduce(
      (acc, r) => {
        acc.transferCount += r.transferCount || 0;
        acc.reportedCount += r.reportedCount || 0;
        acc.stableCount += r.stableCount || 0;
        acc.unstableCount += r.unstableCount || 0;
        acc.fullRefundCount += r.fullRefundCount || 0;
        acc.arrearsCount += r.arrearsCount || 0;
        acc.arrearsAmount += r.arrearsAmount || 0;
        acc.refundCount += r.refundCount || 0;
        return acc;
      },
      {
        transferCount: 0,
        reportedCount: 0,
        stableCount: 0,
        unstableCount: 0,
        fullRefundCount: 0,
        arrearsCount: 0,
        arrearsAmount: 0,
        refundCount: 0,
      },
    );

    return {
      key: 'summary',
      month: 0,
      campus: '',
      refundNote: '',
      ...total,
      isSummary: true,
    };
  }, [rows]);

  const dataSource: TableRow[] = [...rows, summaryRow];

  const applyServerRows = (list: any[]) => {
    const base = createEmptyYearRows(currentCampus || '')
    list.forEach((r: any) => {
      const m = Number(r.month || 0)
      const idx = base.findIndex((x) => x.month === m)
      if (idx >= 0) {
        base[idx] = {
          ...base[idx],
          transferCount: Number(r.transferCount || 0),
          reportedCount: Number(r.reportedCount || 0),
          stableCount: Number(r.stableCount || 0),
          unstableCount: Number(r.unstableCount || 0),
          fullRefundCount: Number(r.fullRefundCount || 0),
          arrearsCount: Number(r.arrearsCount || 0),
          arrearsAmount: Number(r.arrearsAmount || 0),
          refundCount: Number(r.refundCount || 0),
          refundNote: String(r.refundNote || ''),
        }
      }
    })
    setRows(base)
  }

  const fetchFromServer = async () => {
    if (!currentCampus || !year) {
      message.warning('请先选择神殿/年份')
      return
    }
    try {
      const res = await fetch(buildApiUrl(`/teaching-quality/campus-monthly-new-stu-stability-summary?campus=${encodeURIComponent(currentCampus)}&year=${year}`))
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      applyServerRows(data?.行列表 || [])
      message.success('已刷新')
    } catch (e) {
      console.error(e)
      message.error('刷新失败')
    }
  }

  const columns: ColumnsType<TableRow> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      render: (value: number, record) =>
        record.isSummary ? (
          <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span>
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
      render: (text: string, record) => (record.isSummary ? '' : (currentCampus || '')),
    },
    {
      title: '交接人数',
      dataIndex: 'transferCount',
      key: 'transferCount',
      width: 120,
      align: 'center',
      render: (value: number, record) => (value || 0),
    },
    {
      title: '报道新生',
      children: [
        {
          title: '报到人数',
          dataIndex: 'reportedCount',
          key: 'reportedCount',
          width: 120,
          align: 'center',
          render: (value: number) => (value || 0),
        },
        {
          title: '稳定过课时人数',
          dataIndex: 'stableCount',
          key: 'stableCount',
          width: 140,
          align: 'center',
          render: (value: number) => (value || 0),
        },
        {
          title: '未过课时人数',
          dataIndex: 'unstableCount',
          key: 'unstableCount',
          width: 140,
          align: 'center',
          render: (value: number) => (value || 0),
        },
        {
          title: '回全款人数',
          dataIndex: 'fullRefundCount',
          key: 'fullRefundCount',
          width: 120,
          align: 'center',
          render: (value: number) => (value || 0),
        },
        {
          title: '仍欠费人数',
          dataIndex: 'arrearsCount',
          key: 'arrearsCount',
          width: 120,
          align: 'center',
          render: (value: number) => (value || 0),
        },
        {
          title: '欠费总金额',
          dataIndex: 'arrearsAmount',
          key: 'arrearsAmount',
          width: 140,
          align: 'center',
          render: (value: number) => (value || 0),
        },
        {
          title: '退费人数',
          dataIndex: 'refundCount',
          key: 'refundCount',
          width: 120,
          align: 'center',
          render: (value: number) => (value || 0),
        },
        {
          title: '新生退费率',
          dataIndex: 'refundRate',
          key: 'refundRate',
          width: 120,
          align: 'center',
          render: (_: unknown, record) => {
            const reported = record.isSummary
              ? summaryRow.reportedCount
              : record.reportedCount;
            const refund = record.isSummary
              ? summaryRow.refundCount
              : record.refundCount;
            return formatRefundRate(refund, reported);
          },
        },
        {
          title: '退费学员情况说明',
          dataIndex: 'refundNote',
          key: 'refundNote',
          width: 240,
          align: 'left',
          render: (text: string, record) => (record.isSummary ? '' : (text || '')),
        },
      ],
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title={currentCampus ? `${currentCampus}教化司新生当月维稳统计表` : '教化司新生当月维稳统计表'} extra={
        <Space>
          <span>年份</span>
          <InputNumber
            min={2000}
            max={2100}
            value={year}
            onChange={(v) => setYear(typeof v === 'number' ? v : new Date().getFullYear())}
            style={{ width: 100 }}
          />
          <Button onClick={fetchFromServer} disabled={!currentCampus}>刷新</Button>
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
          rowClassName={(record) => (record.isSummary ? 'summary-row' : '')}
        />
        <style>{`
          .summary-row {
            color: #cf1322;
            font-weight: 600;
          }
        `}</style>
      </Card>
    </div>
  );
};

export default CampusNewStuStabilitySummary;

