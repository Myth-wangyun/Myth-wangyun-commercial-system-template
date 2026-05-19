import React, { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { App, Card, Table, InputNumber, Input, Space, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'
import { fetchHomeroomTeachers } from '@/services/configMaster'
import type { HomeroomTeacherProfile } from '@/services/configMaster'

interface MonthlyPersonalStabilityRow {
  key: string;
  month: number;
  teacherName: string;
  transferCount: number;
  reportedCount: number;
  stableCount: number;
  unstableCount: number;
  fullRefundCount: number;
  arrearsCount: number;
  arrearsAmount: number;
  refundCount: number;
  refundNote: string;
  isMonthSummary?: boolean;
  isGrandSummary?: boolean;
}

// Memoized editable cells
const EditableNumberCell = memo<{
  rowKey: string
  field: string
  value: number
  onUpdate: (key: string, field: string, value: number | null) => void
}>(({ rowKey, field, value, onUpdate }) => {
  const [local, setLocal] = React.useState<number>(value || 0)
  React.useEffect(() => { setLocal(value || 0) }, [value])

  const handleChange = useCallback((v: number | null) => {
    setLocal(typeof v === 'number' ? v : 0)
  }, [])

  const handleBlur = useCallback(() => {
    if (local !== (value || 0)) onUpdate(rowKey, field, local)
  }, [local, value, rowKey, field, onUpdate])
  
  return (
    <InputNumber
      min={0}
      value={local}
      style={{ width: '100%' }}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
})
EditableNumberCell.displayName = 'EditableNumberCell'

const EditableTextCell = memo<{
  rowKey: string
  value: string
  onUpdate: (key: string, value: string) => void
}>(({ rowKey, value, onUpdate }) => {
  const [local, setLocal] = React.useState(value)
  React.useEffect(() => { setLocal(value) }, [value])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocal(e.target.value)
  }, [])

  const handleBlur = useCallback(() => {
    if (local !== value) onUpdate(rowKey, local)
  }, [local, value, rowKey, onUpdate])
  
  return <Input value={local} onChange={handleChange} onBlur={handleBlur} />
})
EditableTextCell.displayName = 'EditableTextCell'

const createInitialDetailRows = (teachers: string[]): MonthlyPersonalStabilityRow[] => {
  const rows: MonthlyPersonalStabilityRow[] = [];

  for (let month = 1; month <= 12; month += 1) {
    teachers.forEach((teacherName) => {
      rows.push({
        key: `${month}-${teacherName}`,
        month,
        teacherName,
        transferCount: 0,
        reportedCount: 0,
        stableCount: 0,
        unstableCount: 0,
        fullRefundCount: 0,
        arrearsCount: 0,
        arrearsAmount: 0,
        refundCount: 0,
        refundNote: '',
      });
    });
  }

  return rows;
};

const computeMonthSummary = (
  rows: MonthlyPersonalStabilityRow[],
  month: number,
): MonthlyPersonalStabilityRow => {
  const monthRows = rows.filter(
    (r) => r.month === month && !r.isMonthSummary && !r.isGrandSummary,
  );

  const total = monthRows.reduce(
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
    key: `${month}-summary`,
    month,
    teacherName: '合计',
    refundNote: '',
    ...total,
    isMonthSummary: true,
  };
};

const computeGrandSummary = (
  rows: MonthlyPersonalStabilityRow[],
): MonthlyPersonalStabilityRow => {
  const total = rows.reduce(
    (acc, r) => {
      if (r.isMonthSummary || r.isGrandSummary) return acc;
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
    key: 'grand-summary',
    month: 0,
    teacherName: '',
    refundNote: '',
    ...total,
    isGrandSummary: true,
  };
};

const formatRefundRate = (refundCount: number, reportedCount: number) => {
  if (!reportedCount || reportedCount === 0) return '0%';
  const rate = (refundCount / reportedCount) * 100;
  const fixed = rate.toFixed(1);
  const text = fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
  return `${text}%`;
};

const ShengbangNewStuStabilityMonthlyPersonalSummary: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [homeroomTeachers, setHomeroomTeachers] = useState<HomeroomTeacherProfile[]>([])
  const teacherNames = useMemo(() => homeroomTeachers.map(t => t.name), [homeroomTeachers])
  const [detailRows, setDetailRows] = useState<MonthlyPersonalStabilityRow[]>([]);

  const canIO = useMemo(() => Boolean(currentCampus && year), [currentCampus, year])

  const dataSource: MonthlyPersonalStabilityRow[] = useMemo(() => {
    const ordered: MonthlyPersonalStabilityRow[] = [];

    for (let month = 1; month <= 12; month += 1) {
      const monthDetails = detailRows.filter(
        (r) => r.month === month && !r.isMonthSummary && !r.isGrandSummary,
      );
      // 按配置中心的班主任顺序排序
      monthDetails.sort(
        (a, b) => teacherNames.indexOf(a.teacherName) - teacherNames.indexOf(b.teacherName),
      );
      const monthSummary = computeMonthSummary(detailRows, month);
      ordered.push(...monthDetails, monthSummary);
    }

    const grandSummary = computeGrandSummary(detailRows);
    ordered.push(grandSummary);

    return ordered;
  }, [detailRows, teacherNames]);

  // Single update handler for all number fields
  const handleNumberUpdate = useCallback((key: string, field: string, value: number | null) => {
    const v = typeof value === 'number' ? value : 0;
    setDetailRows((prev) =>
      prev.map((row) =>
        row.key === key
          ? {
              ...row,
              [field]: v,
            }
          : row,
      ),
    );
  }, []);

  // Single update handler for text field (refundNote)
  const handleTextUpdate = useCallback((key: string, value: string) => {
    setDetailRows((prev) =>
      prev.map((row) =>
        row.key === key
          ? {
              ...row,
              refundNote: value,
            }
          : row,
      ),
    );
  }, []);

  const fetchFromServer = useCallback(async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    if (teacherNames.length === 0) {
      message.warning('当前神殿没有配置班主任')
      return
    }
    try {
      const teacherParam = encodeURIComponent(teacherNames.join(','))
      const res = await fetch(
        buildApiUrl(`/teaching-quality/campus-monthly-personal-new-stu-stability?campus=${encodeURIComponent(
          currentCampus!
        )}&year=${year}&teacher_names=${teacherParam}`),
      )
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const rows = (data?.行列表 || []) as any[]

      const base = createInitialDetailRows(teacherNames)
      rows.forEach((r: any) => {
        const m = Number(r.month || 0)
        const n = String(r.name || '')
        const idx = base.findIndex((x) => x.month === m && x.teacherName === n)
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
      setDetailRows(base)
      message.success('已刷新')
    } catch (e) {
      console.error(e)
      message.error('刷新失败')
    }
  }, [canIO, currentCampus, year, teacherNames])

  const saveToServer = useCallback(async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    try {
      const payload = {
        神殿名称: currentCampus!,
        年份: year,
        行列表: detailRows
          .filter((r) => !r.isMonthSummary && !r.isGrandSummary && r.teacherName)
          .map((r) => ({
            month: r.month,
            name: r.teacherName,
            transferCount: r.transferCount,
            reportedCount: r.reportedCount,
            stableCount: r.stableCount,
            unstableCount: r.unstableCount,
            fullRefundCount: r.fullRefundCount,
            arrearsCount: r.arrearsCount,
            arrearsAmount: r.arrearsAmount,
            refundCount: r.refundCount,
            refundNote: r.refundNote,
          })),
      }
      const res = await fetch(buildApiUrl('/teaching-quality/campus-monthly-personal-new-stu-stability'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      message.success('保存成功')
      await fetchFromServer()

      // 通知其他汇总表刷新（个人统计表、当月维稳统计表）
      window.dispatchEvent(new CustomEvent('newStudentStabilityDataUpdated'))
    } catch (e) {
      console.error(e)
      message.error('保存失败')
    }
  }, [canIO, currentCampus, year, detailRows, fetchFromServer])

  // 加载班主任数据
  useEffect(() => {
    const loadHomeroomTeachers = async () => {
      if (!currentCampus) return
      try {
        const teachers = await fetchHomeroomTeachers({
          campus_name: currentCampus,
          active: true,
        })
        setHomeroomTeachers(teachers)
      } catch (error) {
        console.error('加载班主任数据失败', error)
        message.error('加载班主任数据失败')
      }
    }
    loadHomeroomTeachers()
  }, [currentCampus])

  // 当班主任列表加载完成后，初始化数据
  useEffect(() => {
    if (currentCampus && teacherNames.length > 0) {
      setDetailRows(createInitialDetailRows(teacherNames))
      fetchFromServer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year, teacherNames])

  const columns: ColumnsType<MonthlyPersonalStabilityRow> = useMemo(() => [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      onCell: (record) => {
        // 总合计单独一行，不与任何月份合并
        if (record.isGrandSummary) return { rowSpan: 1 };
        // 每个月的第一条明细（按“配置中心班主任顺序”的第一位）负责合并：老师数量 + 当月合计 这一共 teacherNames.length + 1 行
        if (!record.isMonthSummary && teacherNames.length > 0 && record.teacherName === teacherNames[0]) {
          return { rowSpan: teacherNames.length + 1 };
        }
        // 其他同月的行（包括当月合计行）隐藏该单元格
        return { rowSpan: 0 };
      },
      render: (value: number, record) => {
        if (record.isGrandSummary) {
          return (
            <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span>
          );
        }
        if (record.isMonthSummary) {
          return null;
        }
        return value;
      },
    },
    {
      title: '班主任姓名',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 140,
      align: 'center',
      render: (text: string, record) => {
        if (record.isGrandSummary) return '';
        if (record.isMonthSummary) {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>{text}</span>;
        }
        return text;
      },
    },
    {
      title: '交接人数',
      dataIndex: 'transferCount',
      key: 'transferCount',
      width: 120,
      align: 'center',
      shouldCellUpdate: (record, prev) => record.transferCount !== prev.transferCount || record.isMonthSummary !== prev.isMonthSummary || record.isGrandSummary !== prev.isGrandSummary,
      render: (value: number, record) => {
        if (record.isMonthSummary || record.isGrandSummary) {
          return value || 0;
        }
        return (
          <EditableNumberCell
            rowKey={record.key}
            field="transferCount"
            value={value}
            onUpdate={handleNumberUpdate}
          />
        );
      },
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
          shouldCellUpdate: (record, prev) => record.reportedCount !== prev.reportedCount || record.isMonthSummary !== prev.isMonthSummary || record.isGrandSummary !== prev.isGrandSummary,
          render: (value: number, record) => {
            if (record.isMonthSummary || record.isGrandSummary) {
              return value || 0;
            }
            return (
              <EditableNumberCell
                rowKey={record.key}
                field="reportedCount"
                value={value}
                onUpdate={handleNumberUpdate}
              />
            );
          },
        },
        {
          title: '稳定过课时人数',
          dataIndex: 'stableCount',
          key: 'stableCount',
          width: 140,
          align: 'center',
          render: (value: number, record) => {
            if (record.isMonthSummary || record.isGrandSummary) {
              return value || 0;
            }
            return (
              <EditableNumberCell
                rowKey={record.key}
                field="stableCount"
                value={value}
                onUpdate={handleNumberUpdate}
              />
            );
          },
        },
        {
          title: '未过课时人数',
          dataIndex: 'unstableCount',
          key: 'unstableCount',
          width: 140,
          align: 'center',
          render: (value: number, record) => {
            if (record.isMonthSummary || record.isGrandSummary) {
              return value || 0;
            }
            return (
              <EditableNumberCell
                rowKey={record.key}
                field="unstableCount"
                value={value}
                onUpdate={handleNumberUpdate}
              />
            );
          },
        },
        {
          title: '回全款人数',
          dataIndex: 'fullRefundCount',
          key: 'fullRefundCount',
          width: 120,
          align: 'center',
          render: (value: number, record) => {
            if (record.isMonthSummary || record.isGrandSummary) {
              return value || 0;
            }
            return (
              <EditableNumberCell
                rowKey={record.key}
                field="fullRefundCount"
                value={value}
                onUpdate={handleNumberUpdate}
              />
            );
          },
        },
        {
          title: '仍欠费人数',
          dataIndex: 'arrearsCount',
          key: 'arrearsCount',
          width: 120,
          align: 'center',
          render: (value: number, record) => {
            if (record.isMonthSummary || record.isGrandSummary) {
              return value || 0;
            }
            return (
              <EditableNumberCell
                rowKey={record.key}
                field="arrearsCount"
                value={value}
                onUpdate={handleNumberUpdate}
              />
            );
          },
        },
        {
          title: '欠费总金额',
          dataIndex: 'arrearsAmount',
          key: 'arrearsAmount',
          width: 140,
          align: 'center',
          render: (value: number, record) => {
            if (record.isMonthSummary || record.isGrandSummary) {
              return value || 0;
            }
            return (
              <EditableNumberCell
                rowKey={record.key}
                field="arrearsAmount"
                value={value}
                onUpdate={handleNumberUpdate}
              />
            );
          },
        },
        {
          title: '退费人数',
          dataIndex: 'refundCount',
          key: 'refundCount',
          width: 120,
          align: 'center',
          render: (value: number, record) => {
            if (record.isMonthSummary || record.isGrandSummary) {
              return value || 0;
            }
            return (
              <EditableNumberCell
                rowKey={record.key}
                field="refundCount"
                value={value}
                onUpdate={handleNumberUpdate}
              />
            );
          },
        },
        {
          title: '新生退费率',
          dataIndex: 'refundRate',
          key: 'refundRate',
          width: 120,
          align: 'center',
          render: (_: unknown, record) => {
            const reported = record.reportedCount;
            const refund = record.refundCount;
            return formatRefundRate(refund, reported);
          },
        },
        {
          title: '退费学员情况说明',
          dataIndex: 'refundNote',
          key: 'refundNote',
          width: 240,
          align: 'left',
          render: (text: string, record) => {
            if (record.isMonthSummary || record.isGrandSummary) {
              return '';
            }
            return (
              <EditableTextCell
                rowKey={record.key}
                value={text}
                onUpdate={handleTextUpdate}
              />
            );
          },
        },
      ],
    },
  ], [handleNumberUpdate, handleTextUpdate, teacherNames]);

  return (
    <div style={{ padding: 24 }}>
      <Card title={currentCampus ? `${currentCampus}教化司新生维稳月度个人统计表` : '教化司新生维稳月度个人统计表'} extra={
        <Space>
          <span>年份</span>
          <InputNumber
            min={2000}
            max={2100}
            value={year}
            onChange={(v) => setYear(typeof v === 'number' ? v : new Date().getFullYear())}
            style={{ width: 100 }}
          />
          <Button onClick={fetchFromServer} disabled={!canIO}>刷新</Button>
          <Button type="primary" onClick={saveToServer} disabled={!canIO}>保存</Button>
        </Space>
      }>
        <Table<MonthlyPersonalStabilityRow>
          bordered
          size="small"
          tableLayout="fixed"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
          rowClassName={(record) => (record.isMonthSummary || record.isGrandSummary ? 'summary-row' : '')}
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

export default ShengbangNewStuStabilityMonthlyPersonalSummary;
