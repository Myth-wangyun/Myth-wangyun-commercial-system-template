import React, { useEffect, useMemo, useState } from 'react';
import { App, Card, Table, InputNumber, Input, Space, Button, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl, apiFetch } from '@/utils/apiBase'
import { fetchHomeroomTeachers } from '@/services/configMaster'

interface MonthlyPersonalPromotionRow {
  key: string;
  month: number;
  name: string;
  classCount: number;
  fileCount: number;
  expectedPromotionCount: number;
  actualPromotionCount: number;
  receivableAmount: number;
  expectedPromotionRevenue: number;
  actualPromotionRevenue: number;
  isMonthSummary?: boolean;
}

const createInitialDetailRows = (names: string[]): MonthlyPersonalPromotionRow[] => {
  const rows: MonthlyPersonalPromotionRow[] = [];

  for (let month = 1; month <= 12; month += 1) {
    names.forEach((name) => {
      rows.push({
        key: `${month}-${name}`,
        month,
        name,
        classCount: 0,
        fileCount: 0,
        expectedPromotionCount: 0,
        actualPromotionCount: 0,
        receivableAmount: 0,
        expectedPromotionRevenue: 0,
        actualPromotionRevenue: 0,
      });
    });
  }

  return rows;
};

const computeMonthSummary = (
  monthRows: MonthlyPersonalPromotionRow[],
  month: number,
): MonthlyPersonalPromotionRow => {
  const total = monthRows.reduce(
    (acc, r) => {
      if (r.isMonthSummary) return acc;
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
    key: `${month}-summary`,
    month,
    name: '合计',
    ...total,
    isMonthSummary: true,
  };
};

const formatRate = (numerator: number, denominator: number) => {
  if (!denominator || denominator === 0) return '0%';
  const rate = (numerator / denominator) * 100;
  const fixed = rate.toFixed(1);
  const text = fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
  return `${text}%`;
};

const ShengbangMonthlyPersonalPromotionGoalsResults: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [names, setNames] = useState<string[]>([])
  const [detailRows, setDetailRows] = useState<MonthlyPersonalPromotionRow[]>([]);
  const [loadingNames, setLoadingNames] = useState(false)
  const [selectedNames, setSelectedNames] = useState<string[]>([])

  const canIO = useMemo(() => Boolean(currentCampus && year), [currentCampus, year])

  // 从配置中心加载班主任名单
  useEffect(() => {
    const loadHomeroomTeacherNames = async () => {
      if (!currentCampus) return
      try {
        setLoadingNames(true)
        const homeroomTeachers = await fetchHomeroomTeachers({ campus_name: currentCampus })
        const homeroomTeacherNames = homeroomTeachers.map(t => t.name).sort()
        setNames(homeroomTeacherNames)
      } catch (error) {
        console.error('加载班主任名单失败:', error)
        message.error('加载班主任名单失败')
        setNames([])
      } finally {
        setLoadingNames(false)
      }
    }
    loadHomeroomTeacherNames()
  }, [currentCampus])

  // 当教师名单改变时，重新初始化详细行
  useEffect(() => {
    if (names.length > 0) {
      setDetailRows(createInitialDetailRows(names))
    }
  }, [names])

  // 筛选后的姓名列表
  const filteredNames = useMemo(() => {
    if (selectedNames.length === 0) return names
    return names.filter(name => selectedNames.includes(name))
  }, [names, selectedNames])

  const dataSource: MonthlyPersonalPromotionRow[] = useMemo(() => {
    const ordered: MonthlyPersonalPromotionRow[] = [];
    const displayNames = filteredNames.length > 0 ? filteredNames : names

    for (let month = 1; month <= 12; month += 1) {
      // 只显示筛选后的姓名
      const monthDetails = detailRows.filter(
        (r) => r.month === month && !r.isMonthSummary && displayNames.includes(r.name),
      );
      monthDetails.sort(
        (a, b) => displayNames.indexOf(a.name) - displayNames.indexOf(b.name),
      );
      const monthSummary = computeMonthSummary(monthDetails, month);
      ordered.push(...monthDetails, monthSummary);
    }

    return ordered;
  }, [detailRows, names, filteredNames]);

  const handleNumberChange = (
    key: string,
    field: keyof Omit<
      MonthlyPersonalPromotionRow,
      'key' | 'month' | 'name' | 'isMonthSummary'
    >,
    value: number | null,
  ) => {
    const v = typeof value === 'number' ? value : 0;
    console.log(`[handleNumberChange] key=${key}, field=${field}, value=${value}, v=${v}`);
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
  };

  const handleNameChange = (key: string, value: string) => {
    setDetailRows((prev) =>
      prev.map((row) =>
        row.key === key
          ? {
              ...row,
              name: value,
            }
          : row,
      ),
    );
  };

  const fetchFromServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    try {
      // 不传month参数，后端会返回全年12个月的数据，每条数据带有month字段
      const res = await apiFetch(
        buildApiUrl(`/teaching-quality/campus-monthly-personal-promotion-goals-results?campus=${encodeURIComponent(
          currentCampus!
        )}&year=${year}`),
      )
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const serverRows = (data?.行列表 || []) as any[]

      // 只保留有数据的记录（至少有一个字段非0）
      const validRows = serverRows.filter((r: any) => 
        (r.classCount || 0) > 0 ||
        (r.fileCount || 0) > 0 ||
        (r.expectedPromotionCount || 0) > 0 ||
        (r.actualPromotionCount || 0) > 0 ||
        (r.receivableAmount || 0) > 0 ||
        (r.expectedPromotionRevenue || 0) > 0 ||
        (r.actualPromotionRevenue || 0) > 0
      )

      // 从服务器数据中提取存在的姓名
      const serverNames = Array.from(new Set(validRows.map((r: any) => String(r.name || '')).filter(Boolean)))
      
      // 合并配置中心的姓名和服务器返回的姓名
      const allNames = Array.from(new Set([...names, ...serverNames])).sort()
      
      const base = createInitialDetailRows(allNames)
      validRows.forEach((r: any) => {
        const m = Number(r.month || 0)
        const n = String(r.name || '')
        if (m >= 1 && m <= 12 && n) {
          const idx = base.findIndex((x) => x.month === m && x.name === n)
          if (idx >= 0) {
            base[idx] = {
              ...base[idx],
              classCount: Number(r.classCount || 0),
              fileCount: Number(r.fileCount || 0),
              expectedPromotionCount: Number(r.expectedPromotionCount || 0),
              actualPromotionCount: Number(r.actualPromotionCount || 0),
              receivableAmount: Number(r.receivableAmount || 0),
              expectedPromotionRevenue: Number(r.expectedPromotionRevenue || 0),
              actualPromotionRevenue: Number(r.actualPromotionRevenue || 0),
            }
          }
        }
      })
      
      // 更新姓名列表
      if (allNames.length > names.length) {
        setNames(allNames)
      }
      
      setDetailRows(base)
      message.success(`已加载${validRows.length}条有效数据记录（来自神殿升学计划汇总表）`)
    } catch (e) {
      console.error(e)
      message.error('刷新失败')
    }
  }

  const saveToServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    try {
      const payload = {
        神殿名称: currentCampus!,
        年份: year,
        行列表: detailRows
          .filter((r) => !r.isMonthSummary && r.name)
          .map((r) => ({
            month: r.month,
            name: r.name,
            classCount: r.classCount,
            fileCount: r.fileCount,
            expectedPromotionCount: r.expectedPromotionCount,
            actualPromotionCount: r.actualPromotionCount,
            receivableAmount: r.receivableAmount,
            expectedPromotionRevenue: r.expectedPromotionRevenue,
            actualPromotionRevenue: r.actualPromotionRevenue,
          })),
      }
      console.log('[saveToServer] 准备保存的数据:', JSON.stringify(payload, null, 2));
      const res = await apiFetch(buildApiUrl('/teaching-quality/campus-monthly-personal-promotion-goals-results'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      message.success('保存成功')
      await fetchFromServer()
    } catch (e) {
      console.error(e)
      message.error('保存失败')
    }
  }

  // 当神殿或年份变化时自动刷新
  useEffect(() => {
    if (currentCampus) {
      fetchFromServer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year])

  // 组件挂载时自动刷新一次
  useEffect(() => {
    if (currentCampus) {
      fetchFromServer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 监听班升学明细表保存事件，自动刷新
  useEffect(() => {
    const handleDataUpdate = () => {
      if (currentCampus) {
        fetchFromServer();
      }
    };
    window.addEventListener('promotionDataUpdated', handleDataUpdate);
    return () => {
      window.removeEventListener('promotionDataUpdated', handleDataUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus]);

  const columns: ColumnsType<MonthlyPersonalPromotionRow> = useMemo(() => [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      onCell: (record) => {
        // 月合计行隐藏月份单元格
        if (record.isMonthSummary) {
          return { rowSpan: 0, style: { textAlign: 'center' } };
        }
        // 使用筛选后的名单
        const displayNames = filteredNames.length > 0 ? filteredNames : names;
        // 每月第一条明细（以 displayNames[0] 为首）合并该月明细 + 合计行
        const month = record.month;
        const isFirstRowOfMonth = displayNames.length > 0 && record.key === `${month}-${displayNames[0]}`;
        if (isFirstRowOfMonth) {
          return { rowSpan: displayNames.length + 1, style: { textAlign: 'center' } };
        }
        // 其他明细行隐藏月份单元格
        return { rowSpan: 0, style: { textAlign: 'center' } };
      },
      render: (value: number, record) =>
        record.isMonthSummary ? '' : value,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 140,
      align: 'center',
      render: (text: string, record) =>
        record.isMonthSummary ? (
          <span style={{ color: 'red', fontWeight: 'bold' }}>{text}</span>
        ) : (
          <Input
            value={text}
            onChange={(e) => handleNameChange(record.key, e.target.value)}
          />
        ),
    },
    {
      title: '升学班级总数',
      dataIndex: 'classCount',
      key: 'classCount',
      width: 130,
      align: 'center',
      render: (value: number, record) => {
        if (record.isMonthSummary) return value || 0;
        return (
          <InputNumber
            min={0}
            value={value || 0}
            style={{ width: '100%' }}
            onChange={(v) =>
              handleNumberChange(record.key, 'classCount', v ?? 0)
            }
          />
        );
      },
    },
    {
      title: '在档总人数',
      dataIndex: 'fileCount',
      key: 'fileCount',
      width: 130,
      align: 'center',
      render: (value: number, record) => {
        if (record.isMonthSummary) return value || 0;
        return (
          <InputNumber
            min={0}
            value={value || 0}
            style={{ width: '100%' }}
            onChange={(v) =>
              handleNumberChange(record.key, 'fileCount', v ?? 0)
            }
          />
        );
      },
    },
    {
      title: '预计升学总人数',
      dataIndex: 'expectedPromotionCount',
      key: 'expectedPromotionCount',
      width: 150,
      align: 'center',
      render: (value: number, record) => {
        if (record.isMonthSummary) return value || 0;
        return (
          <InputNumber
            min={0}
            value={value || 0}
            style={{ width: '100%' }}
            onChange={(v) =>
              handleNumberChange(
                record.key,
                'expectedPromotionCount',
                v ?? 0,
              )
            }
          />
        );
      },
    },
    {
      title: '实际升学总人数',
      dataIndex: 'actualPromotionCount',
      key: 'actualPromotionCount',
      width: 150,
      align: 'center',
      render: (value: number, record) => {
        if (record.isMonthSummary) return value || 0;
        return (
          <InputNumber
            min={0}
            value={value || 0}
            style={{ width: '100%' }}
            onChange={(v) =>
              handleNumberChange(
                record.key,
                'actualPromotionCount',
                v ?? 0,
              )
            }
          />
        );
      },
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
      render: (value: number, record) => {
        if (record.isMonthSummary) return value || 0;
        return (
          <InputNumber
            min={0}
            value={value || 0}
            style={{ width: '100%' }}
            onChange={(v) =>
              handleNumberChange(record.key, 'receivableAmount', v ?? 0)
            }
          />
        );
      },
    },
    {
      title: '预计升学收入',
      dataIndex: 'expectedPromotionRevenue',
      key: 'expectedPromotionRevenue',
      width: 150,
      align: 'center',
      render: (value: number, record) => {
        if (record.isMonthSummary) return value || 0;
        return (
          <InputNumber
            min={0}
            value={value || 0}
            style={{ width: '100%' }}
            onChange={(v) =>
              handleNumberChange(
                record.key,
                'expectedPromotionRevenue',
                v ?? 0,
              )
            }
          />
        );
      },
    },
    {
      title: '实际升学收入',
      dataIndex: 'actualPromotionRevenue',
      key: 'actualPromotionRevenue',
      width: 150,
      align: 'center',
      render: (value: number, record) => {
        if (record.isMonthSummary) return value || 0;
        return (
          <InputNumber
            min={0}
            value={value || 0}
            style={{ width: '100%' }}
            onChange={(v) =>
              handleNumberChange(
                record.key,
                'actualPromotionRevenue',
                v ?? 0,
              )
            }
          />
        );
      },
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
  ], [names, filteredNames, handleNumberChange, handleNameChange]);

  return (
    <div style={{ padding: 24 }}>
      <Card title="06-2XX神殿教化司月度个人升学目标与结果汇总表" extra={
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
            mode="multiple"
            placeholder="筛选班主任"
            value={selectedNames}
            onChange={setSelectedNames}
            style={{ minWidth: 200, maxWidth: 400 }}
            maxTagCount="responsive"
            allowClear
            showSearch
            optionFilterProp="label"
          >
            {names.map(name => (
              <Select.Option key={name} value={name} label={name}>
                {name}
              </Select.Option>
            ))}
          </Select>
          <Button onClick={fetchFromServer} disabled={!canIO}>刷新</Button>
          <Button type="primary" onClick={saveToServer} disabled={!canIO}>保存</Button>
        </Space>
      }>
        <Table<MonthlyPersonalPromotionRow>
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

export default ShengbangMonthlyPersonalPromotionGoalsResults;
