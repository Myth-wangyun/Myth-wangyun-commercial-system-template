import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { App, Card, Table, Input, InputNumber, Space, Button, Select, Spin, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'

interface ClassPromotionRow {
  key: string;
  serialNumber: number;
  teacherName: string;
  className: string;
  promotionPeriod: string;
  fileCount: number;
  expectedPromotionCount: number;
  actualPromotionCount: number;
  receivableAmount: number;
  expectedPromotionRevenue: number;
  actualPromotionRevenue: number;
  isSummary?: boolean;
}

const createInitialRows = (): ClassPromotionRow[] => {
  const rows: ClassPromotionRow[] = [];
  for (let i = 1; i <= 10; i += 1) {
    rows.push({
      key: String(i),
      serialNumber: i,
      teacherName: '',
      className: '',
      promotionPeriod: '',
      fileCount: 0,
      expectedPromotionCount: 0,
      actualPromotionCount: 0,
      receivableAmount: i === 1 ? 200000 : 0,
      expectedPromotionRevenue: i === 1 ? 190000 : 0,
      actualPromotionRevenue: 0,
    });
  }
  return rows;
};

const recomputeSummary = (rows: ClassPromotionRow[]): ClassPromotionRow => {
  const total = rows.reduce(
    (acc, r) => {
      acc.fileCount += r.fileCount || 0;
      acc.expectedPromotionCount += r.expectedPromotionCount || 0;
      acc.actualPromotionCount += r.actualPromotionCount || 0;
      acc.receivableAmount += r.receivableAmount || 0;
      acc.expectedPromotionRevenue += r.expectedPromotionRevenue || 0;
      acc.actualPromotionRevenue += r.actualPromotionRevenue || 0;
      return acc;
    },
    {
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
    teacherName: '',
    className: '',
    promotionPeriod: '',
    ...total,
    isSummary: true,
  };
};

const formatRate = (numerator: number, denominator: number) => {
  if (!denominator || denominator === 0) return '0%';
  const rate = numerator / denominator;
  const percent = rate * 100;
  const fixed = percent.toFixed(1);
  const text = fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
  return `${text}%`;
};

const ShengbangMonthlyClassPromotionGoalsResults: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [classOptions, setClassOptions] = useState<string[]>([])
  const [classTeacherMap, setClassTeacherMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const [rows, setRows] = useState<ClassPromotionRow[]>(() => {
    const base = createInitialRows();
    return [...base, recomputeSummary(base)];
  });

  const canIO = useMemo(() => Boolean(currentCampus && year && month), [currentCampus, year, month])

  // 从神殿升学计划汇总表获取单个班级数据
  const fetchClassDetailData = async (className: string): Promise<{
    teacherName: string;
    fileCount: number;
    expectedPromotionCount: number;
    actualPromotionCount: number;
    receivableAmount: number;
    expectedPromotionRevenue: number;
    actualPromotionRevenue: number;
  } | null> => {
    if (!className) return null;
    try {
      // 从"清美教育各神殿升学计划"（神殿升学计划汇总表）获取数据
      // API: /teaching-quality/campus-class-promotion-summary
      // 添加升学月份参数，确保获取正确月份的数据
      const promotionMonth = `${year}年${String(month).padStart(2, '0')}月`;
      const url = buildApiUrl(
        `/teaching-quality/campus-class-promotion-summary?classId=${encodeURIComponent(className)}&promotionMonth=${encodeURIComponent(promotionMonth)}`
      );
      console.log(`正在请求班级 ${className} 的汇总数据 (${promotionMonth}): ${url}`);
      const res = await fetch(url);
      console.log(`班级 ${className} 响应状态: ${res.status}`);
      
      if (!res.ok) {
        console.log(`班级 ${className} 请求失败，状态码: ${res.status}`);
        return null;
      }
      
      const data = await res.json();
      console.log(`班级 ${className} 返回数据:`, data);
      
      const list = data?.行列表 || [];
      if (list.length === 0) {
        console.log(`班级 ${className} 没有汇总数据`);
        return null;
      }

      // 筛选匹配当前月份的记录，如果没有则取第一条
      let record = list.find((r: any) => r.promotionMonth === promotionMonth);
      if (!record) {
        console.log(`未找到 ${promotionMonth} 的数据，使用第一条记录`);
        record = list[0];
      }
      
      // 从汇总表中提取数据
      const fileCount = record.studentsOnFile?.total || 0; // 在档人数
      const expectedPromotionCount = record.targetStudents?.total || 0; // 预计升学人数
      const actualPromotionCount = record.actualPromotionCount || 0; // 实际升学人数
      const receivableAmount = record.receivable?.total || 0; // 应收
      const expectedPromotionRevenue = record.projectedPromotionAmount?.total || 0; // 预计升学收入
      const actualPromotionRevenue = record.actualPromotionAmount || 0; // 实际升学收入（修复：使用正确的字段名 actualPromotionAmount）
      const teacherName = record.headTeacher || '';

      console.log(`班级 ${className} 汇总数据:`, {
        fileCount,
        expectedPromotionCount,
        actualPromotionCount,
        receivableAmount,
        expectedPromotionRevenue,
        actualPromotionRevenue,
        teacherName,
      });

      return {
        teacherName,
        fileCount,
        expectedPromotionCount,
        actualPromotionCount,
        receivableAmount,
        expectedPromotionRevenue,
        actualPromotionRevenue,
      };
    } catch (e) {
      console.error(`获取班级 ${className} 汇总数据失败:`, e);
      return null;
    }
  };

  // 从神殿升学计划汇总表同步所有班级的数值数据（保留升学周期）
  const syncFromClassDetail = async (baseRows?: ClassPromotionRow[]) => {
    if (!currentCampus) {
      message.warning('请先选择神殿');
      return;
    }
    setLoading(true);
    try {
      // 使用传入的基础数据或当前行数据
      const base = baseRows || rows.filter(r => !r.isSummary);
      
      // 对每个已有班级名称的行，从汇总表获取数值数据
      const updatedRows = await Promise.all(
        base.map(async (row) => {
          if (!row.className) {
            return row; // 没有班级名称的行保持不变
          }
          
          const classData = await fetchClassDetailData(row.className);
          if (classData) {
            // 保留升学周期，只更新数值数据
            return {
              ...row,
              teacherName: classData.teacherName || row.teacherName,
              fileCount: classData.fileCount,
              expectedPromotionCount: classData.expectedPromotionCount,
              actualPromotionCount: classData.actualPromotionCount,
              receivableAmount: classData.receivableAmount,
              expectedPromotionRevenue: classData.expectedPromotionRevenue,
              actualPromotionRevenue: classData.actualPromotionRevenue,
            };
          }
          return row;
        })
      );

      setRows([...updatedRows, recomputeSummary(updatedRows)]);
      const syncedCount = updatedRows.filter(r => r.className).length;
      message.success(`已从神殿升学计划汇总表同步 ${syncedCount} 个班级的数据`);
    } catch (e) {
      console.error(e);
      message.error('同步失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassOptions = async () => {
    try {
      const campusParam = (currentCampus || '').replace(/神殿$/, '').trim()
      const url = campusParam
        ? buildApiUrl(`/teaching-quality/class-list?campus=${encodeURIComponent(campusParam)}`)
        : buildApiUrl('/teaching-quality/class-list')
      const res = await fetch(url)
      if (!res.ok) throw new Error(await res.text())
      let data = await res.json()
      // 若指定神殿但按神殿为空，则回退到全量再本地筛选一次
      if (campusParam && (!Array.isArray(data) || data.length === 0)) {
        const resAll = await fetch(buildApiUrl('/teaching-quality/class-list'))
        if (resAll.ok) {
          data = await resAll.json()
          data = (data || []).filter(
            (c: any) => String(c.神殿 || '').replace(/神殿$/, '').trim() === campusParam,
          )
        }
      }
      const names: string[] = []
      const map: Record<string, string> = {}
      ;(Array.isArray(data) ? data : []).forEach((c: any) => {
        const name = String(c.班级名称 || '')
        if (!name) return
        names.push(name)
        map[name] = String(c.班主任 || '')
      })
      setClassOptions(names)
      setClassTeacherMap(map)
    } catch (e) {
      console.error(e)
      message.error('班级列表获取失败')
    }
  }

  // 从数据库加载已保存的数据（仅加载升学周期等基本信息）
  const fetchFromServer = async (): Promise<ClassPromotionRow[]> => {
    if (!canIO) {
      return createInitialRows()
    }
    try {
      const res = await fetch(
        buildApiUrl(`/teaching-quality/campus-monthly-class-promotion-goals-results?campus=${encodeURIComponent(
          currentCampus!
        )}&year=${year}&month=${month}`),
      )
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const list = (data?.行列表 || []) as any[]

      const base = createInitialRows()
      
      // 从数据库只加载班级名称、班主任、升学周期
      // 数值数据将从汇总表自动获取
      for (let i = 0; i < list.length; i++) {
        const r = list[i];
        const sn = Number(r.serialNumber || 0);
        if (sn >= 1 && sn <= base.length) {
          const idx = sn - 1;
          base[idx] = {
            ...base[idx],
            teacherName: String(r.teacherName || ''),
            className: String(r.className || ''),
            promotionPeriod: String(r.promotionPeriod || ''),
            // 数值数据不从数据库读取，将从汇总表自动获取
          };
        }
      }
      
      return base
    } catch (e) {
      console.error('加载数据失败:', e)
      return createInitialRows()
    }
  }

  const saveToServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年月')
      return
    }
    try {
      const bodies = rows.filter((r) => !r.isSummary)
      const payload = {
        神殿名称: currentCampus!,
        年份: year,
        月份: month,
        行列表: bodies.map((r) => ({
          serialNumber: r.serialNumber,
          teacherName: r.teacherName,
          className: r.className,
          promotionPeriod: r.promotionPeriod,
          fileCount: r.fileCount,
          expectedPromotionCount: r.expectedPromotionCount,
          actualPromotionCount: r.actualPromotionCount,
          receivableAmount: r.receivableAmount,
          expectedPromotionRevenue: r.expectedPromotionRevenue,
          actualPromotionRevenue: r.actualPromotionRevenue,
        })),
      }
      const res = await fetch(buildApiUrl('/teaching-quality/campus-monthly-class-promotion-goals-results'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      message.success('保存成功')
      // 保存后不自动刷新，保持当前编辑的数据
    } catch (e) {
      console.error(e)
      message.error('保存失败')
    }
  }

  // 加载数据：从数据库加载升学周期，从汇总表获取数值数据
  const initData = async () => {
    if (!currentCampus) return;
    setLoading(true)
    try {
      // 先加载班级列表
      await fetchClassOptions()
      
      // 从数据库加载基本信息（班级名称、班主任、升学周期）
      const baseRows = await fetchFromServer()
      
      // 从汇总表同步数值数据
      await syncFromClassDetail(baseRows)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year, month])

  // 监听班升学明细表保存事件，自动刷新
  useEffect(() => {
    const handleDataUpdate = async (event: any) => {
      if (currentCampus) {
        console.log('收到数据更新事件，提示用户刷新');
        message.info('检测到升学数据更新，可点击"刷新数据"按钮获取最新数据');
      }
    };
    window.addEventListener('promotionDataUpdated', handleDataUpdate);
    return () => {
      window.removeEventListener('promotionDataUpdated', handleDataUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year, month]);

  const columns: ColumnsType<ClassPromotionRow> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      align: 'center',
      render: (value, record) =>
        record.isSummary ? (
          <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span>
        ) : (
          value
        ),
    },
    {
      title: '班主任',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 120,
      align: 'center',
      render: (text: string, record) =>
        record.isSummary ? (
          ''
        ) : (
          <Input
            value={text}
            onChange={(e) =>
              handleTextChange(record.key, 'teacherName', e.target.value)
            }
          />
        ),
    },
    {
      title: '升学班级名称',
      dataIndex: 'className',
      key: 'className',
      width: 160,
      align: 'center',
      render: (text: string, record) =>
        record.isSummary ? (
          ''
        ) : (
          <Select
            value={text || undefined}
            style={{ width: '100%' }}
            showSearch
            placeholder="请选择班级"
            optionFilterProp="label"
            options={classOptions.map((n) => ({ label: n, value: n }))}
            onChange={async (v) => {
              const teacher = v ? classTeacherMap[v] || '' : ''
              // 先设置班级名称和班主任
              setRows((prev) => {
                const bodies = prev.filter((r) => !r.isSummary)
                const nextBodies = bodies.map((row) =>
                  row.key === record.key ? { ...row, className: v || '', teacherName: teacher } : row,
                )
                return [...nextBodies, recomputeSummary(nextBodies)]
              })
              // 然后从班升学计划明细获取数值数据
              if (v) {
                const detailData = await fetchClassDetailData(v);
                if (detailData) {
                  setRows((prev) => {
                    const bodies = prev.filter((r) => !r.isSummary)
                    const nextBodies = bodies.map((row) =>
                      row.key === record.key ? {
                        ...row,
                        className: v,
                        teacherName: detailData.teacherName || teacher,
                        // 保留升学周期，只更新数值数据
                        fileCount: detailData.fileCount,
                        expectedPromotionCount: detailData.expectedPromotionCount,
                        actualPromotionCount: detailData.actualPromotionCount,
                        receivableAmount: detailData.receivableAmount,
                        expectedPromotionRevenue: detailData.expectedPromotionRevenue,
                        actualPromotionRevenue: detailData.actualPromotionRevenue,
                      } : row,
                    )
                    return [...nextBodies, recomputeSummary(nextBodies)]
                  })
                }
              }
            }}
            allowClear
          />
        ),
    },
    {
      title: '升学周期',
      dataIndex: 'promotionPeriod',
      key: 'promotionPeriod',
      width: 220,
      align: 'center',
      render: (text: string, record) =>
        record.isSummary ? (
          ''
        ) : (
          <DatePicker.RangePicker
            allowClear
            style={{ width: '100%' }}
            value={(() => {
              const raw = String(text || '').trim()
              if (!raw) return null
              const m = raw.match(/(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})/)
              if (!m) return null
              const start = dayjs(m[1])
              const end = dayjs(m[2])
              if (!start.isValid() || !end.isValid()) return null
              return [start, end]
            })() as any}
            onChange={(dates) => {
              const v = dates && dates[0] && dates[1]
                ? `${dates[0].format('YYYY-MM-DD')} ~ ${dates[1].format('YYYY-MM-DD')}`
                : ''
              handleTextChange(record.key, 'promotionPeriod', v)
            }}
          />
        ),
    },
    {
      title: '在档总人数',
      dataIndex: 'fileCount',
      key: 'fileCount',
      width: 130,
      align: 'center',
      render: (value: number, record) =>
        record.isSummary ? (
          (rows.find((r) => r.isSummary)?.fileCount || 0)
        ) : (
          <InputNumber
            min={0}
            value={value || 0}
            style={{ width: '100%' }}
            onChange={(v) =>
              handleNumberChange(record.key, 'fileCount', v ?? 0)
            }
          />
        ),
    },
    {
      title: '预计升学总人数',
      dataIndex: 'expectedPromotionCount',
      key: 'expectedPromotionCount',
      width: 150,
      align: 'center',
      render: (value: number, record) =>
        record.isSummary ? (
          (rows.find((r) => r.isSummary)?.expectedPromotionCount || 0)
        ) : (
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
        ),
    },
    {
      title: '实际升学总人数',
      dataIndex: 'actualPromotionCount',
      key: 'actualPromotionCount',
      width: 150,
      align: 'center',
      render: (value: number, record) =>
        record.isSummary ? (
          (rows.find((r) => r.isSummary)?.actualPromotionCount || 0)
        ) : (
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
        ),
    },
    {
      title: '预计升学率（人数）',
      dataIndex: 'expectedRateCount',
      key: 'expectedRateCount',
      width: 150,
      align: 'center',
      render: (_: unknown, record) => {
        const summary = rows.find((r) => r.isSummary)
        const denominator = record.isSummary
          ? summary?.fileCount || 0
          : record.fileCount;
        const numerator = record.isSummary
          ? summary?.expectedPromotionCount || 0
          : record.expectedPromotionCount;
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
        const summary = rows.find((r) => r.isSummary)
        const denominator = record.isSummary
          ? summary?.fileCount || 0
          : record.fileCount;
        const numerator = record.isSummary
          ? summary?.actualPromotionCount || 0
          : record.actualPromotionCount;
        return formatRate(numerator, denominator);
      },
    },
    {
      title: '应收',
      dataIndex: 'receivableAmount',
      key: 'receivableAmount',
      width: 120,
      align: 'center',
      render: (value: number, record) =>
        record.isSummary ? (
          (rows.find((r) => r.isSummary)?.receivableAmount || 0)
        ) : (
          <InputNumber
            min={0}
            value={value || 0}
            style={{ width: '100%' }}
            onChange={(v) =>
              handleNumberChange(
                record.key,
                'receivableAmount',
                v ?? 0,
              )
            }
          />
        ),
    },
    {
      title: '预计升学收入',
      dataIndex: 'expectedPromotionRevenue',
      key: 'expectedPromotionRevenue',
      width: 150,
      align: 'center',
      render: (value: number, record) =>
        record.isSummary ? (
          (rows.find((r) => r.isSummary)?.expectedPromotionRevenue || 0)
        ) : (
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
        ),
    },
    {
      title: '实际升学收入',
      dataIndex: 'actualPromotionRevenue',
      key: 'actualPromotionRevenue',
      width: 150,
      align: 'center',
      render: (value: number, record) =>
        record.isSummary ? (
          (rows.find((r) => r.isSummary)?.actualPromotionRevenue || 0)
        ) : (
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
        ),
    },
    {
      title: '预计升学率（金额）',
      dataIndex: 'expectedRateAmount',
      key: 'expectedRateAmount',
      width: 160,
      align: 'center',
      render: (_: unknown, record) => {
        const summary = rows.find((r) => r.isSummary)
        const denominator = record.isSummary
          ? summary?.receivableAmount || 0
          : record.receivableAmount;
        const numerator = record.isSummary
          ? summary?.expectedPromotionRevenue || 0
          : record.expectedPromotionRevenue;
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
        const summary = rows.find((r) => r.isSummary)
        const denominator = record.isSummary
          ? summary?.receivableAmount || 0
          : record.receivableAmount;
        const numerator = record.isSummary
          ? summary?.actualPromotionRevenue || 0
          : record.actualPromotionRevenue;
        return formatRate(numerator, denominator);
      },
    },
  ];

  const handleNumberChange = (
    key: string,
    field: keyof Omit<
      ClassPromotionRow,
      'key' | 'serialNumber' | 'teacherName' | 'className' | 'promotionPeriod' | 'isSummary'
    >,
    value: number | null,
  ) => {
    const v = typeof value === 'number' ? value : 0;
    const bodies = rows.filter((r) => !r.isSummary)
    const nextBodies = bodies.map((row) =>
      row.key === key
        ? {
            ...row,
            [field]: v,
          }
        : row,
    );
    setRows([...nextBodies, recomputeSummary(nextBodies)]);
  };

  const handleTextChange = (
    key: string,
    field: keyof Pick<
      ClassPromotionRow,
      'teacherName' | 'className' | 'promotionPeriod'
    >,
    value: string,
  ) => {
    const bodies = rows.filter((r) => !r.isSummary)
    const nextBodies = bodies.map((row) =>
      row.key === key
        ? {
            ...row,
            [field]: value,
          }
        : row,
    );
    setRows([...nextBodies, recomputeSummary(nextBodies)]);
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title="06-3XX神殿教化司月度班级升学目标与结果汇总表" extra={
        <Space>
          <span>年份</span>
          <InputNumber
            min={2000}
            max={2100}
            value={year}
            onChange={(v) => setYear(typeof v === 'number' ? v : new Date().getFullYear())}
            style={{ width: 100 }}
          />
          <span>月份</span>
          <Select
            value={month}
            onChange={(v) => setMonth(v)}
            style={{ width: 100 }}
            options={Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }))}
          />
          <Button onClick={() => syncFromClassDetail()} loading={loading} disabled={!currentCampus} title="从神殿升学计划汇总表重新获取数值数据（保留升学周期）">
            刷新数据
          </Button>
          <Button type="primary" onClick={saveToServer} disabled={!canIO}>保存</Button>
        </Space>
      }>
        <Spin spinning={loading}>
          <Table<ClassPromotionRow>
            bordered
            size="small"
            columns={columns}
            dataSource={rows}
            pagination={false}
            rowKey="key"
            scroll={{ x: 'max-content' }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default ShengbangMonthlyClassPromotionGoalsResults;
