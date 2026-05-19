import React, { useEffect, useMemo, useState } from 'react';
import { App, Card, Table, Space, Button, InputNumber, Select } from 'antd';
import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'
import { fetchHomeroomTeachers } from '@/services/configMaster'
import type { HomeroomTeacherProfile } from '@/services/configMaster'

interface PersonalStabilityRow {
  key: string;
  serialNumber: number;
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
  isSummary?: boolean;
}

const createInitialRows = (teachers: string[]): PersonalStabilityRow[] => {
  const rows: PersonalStabilityRow[] = teachers.map((name, index) => ({
    key: String(index + 1),
    serialNumber: index + 1,
    teacherName: name,
    transferCount: 0,
    reportedCount: 0,
    stableCount: 0,
    unstableCount: 0,
    fullRefundCount: 0,
    arrearsCount: 0,
    arrearsAmount: 0,
    refundCount: 0,
    refundNote: '',
  }));

  return rows;
};

const recomputeSummary = (
  rows: PersonalStabilityRow[],
): PersonalStabilityRow => {
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
    serialNumber: 0,
    teacherName: '',
    refundNote: '',
    ...total,
    isSummary: true,
  };
};

const formatRefundRate = (refundCount: number, reportedCount: number) => {
  if (!reportedCount || reportedCount === 0) return '0%';
  const rate = (refundCount / reportedCount) * 100;
  const fixed = rate.toFixed(1);
  const text = fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
  return `${text}%`;
};

const ShengbangNewStuStabilityPersonalSummary: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [sortField, setSortField] = useState<'default' | 'refundRate' | 'arrearsRate' | 'stableRate'>('default')
  const [homeroomTeachers, setHomeroomTeachers] = useState<HomeroomTeacherProfile[]>([])
  const teacherNames = useMemo(() => homeroomTeachers.map(t => t.name), [homeroomTeachers])
  const [rows, setRows] = useState<PersonalStabilityRow[]>([])

  const bodyRows = useMemo(
    () => rows.filter((r) => !r.isSummary),
    [rows],
  );

  // 率类字段计算
  const calcRefundRate = (r: PersonalStabilityRow) => (r.reportedCount > 0 ? (r.refundCount || 0) / r.reportedCount : -1)
  const calcArrearsRate = (r: PersonalStabilityRow) => (r.reportedCount > 0 ? (r.arrearsCount || 0) / r.reportedCount : -1)
  const calcStableRate = (r: PersonalStabilityRow) => (r.reportedCount > 0 ? (r.stableCount || 0) / r.reportedCount : -1)

  const sortedBodyRows = useMemo(() => {
    // 默认：按配置中心班主任顺序（teacherNames）
    if (sortField === 'default') {
      const list = [...bodyRows]
      list.sort((a, b) => teacherNames.indexOf(a.teacherName) - teacherNames.indexOf(b.teacherName))
      return list.map((r, idx) => ({ ...r, serialNumber: idx + 1 }))
    }

    const list = [...bodyRows]
    const getter =
      sortField === 'refundRate'
        ? calcRefundRate
        : sortField === 'arrearsRate'
          ? calcArrearsRate
          : calcStableRate

    // 从高到低排序；reportedCount=0 的置底（getter 返回 -1）
    list.sort((a, b) => getter(b) - getter(a))

    // 重排序号
    return list.map((r, idx) => ({ ...r, serialNumber: idx + 1 }))
  }, [bodyRows, sortField, teacherNames])
  const summaryRow = useMemo(
    () => rows.find((r) => r.isSummary) as PersonalStabilityRow,
    [rows],
  );

  const displayRows = useMemo(() => {
    if (!summaryRow) return sortedBodyRows
    return [...sortedBodyRows, summaryRow]
  }, [sortedBodyRows, summaryRow])

  const canFetch = useMemo(() => Boolean(currentCampus && year), [currentCampus, year])

  const applyServerRows = (serverRows: any[], teachers: string[]) => {
    const baseBodies: PersonalStabilityRow[] = teachers.map((name, idx) => ({
      key: String(idx + 1),
      serialNumber: idx + 1,
      teacherName: name,
      transferCount: 0,
      reportedCount: 0,
      stableCount: 0,
      unstableCount: 0,
      fullRefundCount: 0,
      arrearsCount: 0,
      arrearsAmount: 0,
      refundCount: 0,
      refundNote: '',
    }))
    serverRows.forEach((r: any) => {
      const name = String(r.name || '')
      const idx = baseBodies.findIndex(b => b.teacherName === name)
      if (idx >= 0) {
        baseBodies[idx] = {
          ...baseBodies[idx],
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
    const summary = recomputeSummary(baseBodies)
    setRows([...baseBodies, summary])
  }

  const fetchFromServer = async () => {
    if (!canFetch) {
      message.warning('请先选择神殿/年份')
      return
    }
    if (teacherNames.length === 0) {
      message.warning('当前神殿没有配置班主任')
      return
    }
    try {
      const res = await fetch(
        buildApiUrl(`/teaching-quality/campus-personal-new-stu-stability-summary?campus=${encodeURIComponent(currentCampus!)}&year=${year}`)
      )
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const list = (data?.行列表 || []) as any[]
      applyServerRows(list, teacherNames)
      message.success('已刷新')
    } catch (e) {
      console.error(e)
      message.error('刷新失败')
    }
  }

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
      const base = createInitialRows(teacherNames)
      setRows([...base, recomputeSummary(base)])
      fetchFromServer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year, teacherNames])

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
  }, [currentCampus, year, teacherNames])

  const columns: ColumnsType<PersonalStabilityRow> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      align: 'center',
      onCell: (record) => (record.isSummary ? { colSpan: 2, style: { textAlign: 'center' } } : { colSpan: 1, style: { textAlign: 'center' } }),
      render: (value, record) =>
        record.isSummary ? (
          <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span>
        ) : (
          value
        ),
    },
    {
      title: '班主任姓名',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 140,
      align: 'center',
      onCell: (record) => (record.isSummary ? { colSpan: 0, style: { textAlign: 'center' } } : { colSpan: 1, style: { textAlign: 'center' } }),
      render: (text: string, record) => (record.isSummary ? null : text),
    },
    {
      title: '交接人数',
      dataIndex: 'transferCount',
      key: 'transferCount',
      width: 120,
      align: 'center',
      render: (value: number, record) => (record.isSummary ? summaryRow.transferCount || 0 : (value || 0)),
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
          render: (value: number, record) => (record.isSummary ? summaryRow.reportedCount || 0 : (value || 0)),
        },
        {
          title: '稳定过课时人数',
          dataIndex: 'stableCount',
          key: 'stableCount',
          width: 140,
          align: 'center',
          render: (value: number, record) => (record.isSummary ? summaryRow.stableCount || 0 : (value || 0)),
        },
        {
          title: '未过课时人数',
          dataIndex: 'unstableCount',
          key: 'unstableCount',
          width: 140,
          align: 'center',
          render: (value: number, record) => (record.isSummary ? summaryRow.unstableCount || 0 : (value || 0)),
        },
        {
          title: '回全款人数',
          dataIndex: 'fullRefundCount',
          key: 'fullRefundCount',
          width: 120,
          align: 'center',
          render: (value: number, record) => (record.isSummary ? summaryRow.fullRefundCount || 0 : (value || 0)),
        },
        {
          title: '仍欠费人数',
          dataIndex: 'arrearsCount',
          key: 'arrearsCount',
          width: 120,
          align: 'center',
          render: (value: number, record) => (record.isSummary ? summaryRow.arrearsCount || 0 : (value || 0)),
        },
        {
          title: '欠费总金额',
          dataIndex: 'arrearsAmount',
          key: 'arrearsAmount',
          width: 140,
          align: 'center',
          render: (value: number, record) => (record.isSummary ? summaryRow.arrearsAmount || 0 : (value || 0)),
        },
        {
          title: '退费人数',
          dataIndex: 'refundCount',
          key: 'refundCount',
          width: 120,
          align: 'center',
          render: (value: number, record) => (record.isSummary ? summaryRow.refundCount || 0 : (value || 0)),
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
      <Card title={currentCampus ? `${currentCampus}教化司新生维稳个人统计表` : '教化司新生维稳个人统计表'} extra={
        <Space>
          <span>年份</span>
          <InputNumber
            min={2000}
            max={2100}
            value={year}
            onChange={(v) => setYear(typeof v === 'number' ? v : new Date().getFullYear())}
            style={{ width: 100 }}
          />

          <Select
            value={sortField}
            onChange={(v) => setSortField(v)}
            style={{ width: 180 }}
            options={[
              { value: 'default', label: '默认顺序' },
              { value: 'refundRate', label: '按新生退费率(高→低)' },
              { value: 'arrearsRate', label: '按仍欠费率(高→低)' },
              { value: 'stableRate', label: '按稳定率(高→低)' },
            ]}
          />
          <Button onClick={fetchFromServer} disabled={!canFetch}>刷新</Button>
        </Space>
      }>
        <Table<PersonalStabilityRow>
          bordered
          size="small"
          columns={columns}
          dataSource={displayRows}
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

export default ShengbangNewStuStabilityPersonalSummary;
