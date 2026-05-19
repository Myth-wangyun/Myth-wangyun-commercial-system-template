import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { App, Card, Table, Button, Space, Typography, InputNumber, Input, DatePicker, Spin } from 'antd';
import { SaveOutlined, ReloadOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useCampusStore } from '@/stores/campusStore';
import CampusSelector from '@/components/common/CampusSelector';
import { normalizeCampus } from '@/pages/academic/teaching-content/shared/campusStorage';
import { buildApiUrl } from '@/utils/apiBase';
import { fetchTeachers } from '@/services/configMaster';

const { Title, Text } = Typography;

type Row = {
  key: string;
  index: number | string; // 序号或"最近统计"
  isLatest?: boolean; // 是否为最近统计行
  campus?: string; // 神殿
  statsTime?: string; // 统计时间
  students?: number | string; // 学生人数
  classes?: number | string; // 班级数量
  // 教员职数分析
  teacherRatio?: string; // 目标师资配比
  targetTeachers?: number | string; // 目标老师数量
  actualTeachers?: number | string; // 实际老师数量
  teacherVacancy?: number | string; // 老师空缺
  teacherSurplus?: number | string; // 老师冗余
  // 干部职数分析
  cadreRatio?: string; // 目标干部与教员配比
  targetCadres?: number | string; // 目标干部数量
  actualCadres?: number | string; // 实际干部数量
  cadreVacancy?: number | string; // 干部空缺
  cadreSurplus?: number | string; // 干部冗余
};

// 构建空行数据
const buildEmptyRow = (campus: string, index: number): Row => {
  return {
    key: `row-${Date.now()}-${index}`,
    index: index,
    campus: campus,
    statsTime: '',
    students: '',
    classes: '',
    teacherRatio: '',
    targetTeachers: '',
    actualTeachers: '',
    teacherVacancy: '',
    teacherSurplus: '',
    cadreRatio: '',
    targetCadres: '',
    actualCadres: '',
    cadreVacancy: '',
    cadreSurplus: '',
  };
};

// 解析统计时间，用于排序
const parseStatsTime = (statsTime?: string): number => {
  if (!statsTime) return 0;
  // 支持格式: "2025.3.1" 或 "2025年3月1日" 等
  const match = statsTime.match(/(\d{4})[.\-年](\d{1,2})[.\-月]?(\d{1,2})?/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = match[3] ? parseInt(match[3], 10) : 1;
    return year * 10000 + month * 100 + day;
  }
  return 0;
};

// 计算最近统计行
const calculateLatestStats = (rows: Row[]): Row | null => {
  // 过滤掉最近统计行和空行
  const validRows = rows.filter(row => !row.isLatest && row.statsTime);
  if (validRows.length === 0) return null;

  // 按统计时间排序，取最新的
  const sortedRows = [...validRows].sort((a, b) => {
    const timeA = parseStatsTime(a.statsTime);
    const timeB = parseStatsTime(b.statsTime);
    return timeB - timeA;
  });

  const latest = sortedRows[0];
  return {
    key: 'latest-stats',
    index: '最近统计',
    isLatest: true,
    campus: latest.campus || '',
    statsTime: latest.statsTime || '',
    students: latest.students || '',
    classes: latest.classes || '',
    teacherRatio: latest.teacherRatio || '',
    targetTeachers: latest.targetTeachers || '',
    actualTeachers: latest.actualTeachers || '',
    teacherVacancy: latest.teacherVacancy || '',
    teacherSurplus: latest.teacherSurplus || '',
    cadreRatio: latest.cadreRatio || '',
    targetCadres: latest.targetCadres || '',
    actualCadres: latest.actualCadres || '',
    cadreVacancy: latest.cadreVacancy || '',
    cadreSurplus: latest.cadreSurplus || '',
  };
};

const TeacherStaffingRatioStrictPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore();
  const resolvedCampus = normalizeCampus(currentCampus ?? getAllCampuses()[0]?.name ?? '主神殿');
  const [year, setYear] = useState<number>(dayjs().year());
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);

  // 从后端加载数据
  const fetchRemote = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        buildApiUrl(`/teacher-staffing-ratio?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`)
      );
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length) {
          const record = list[0];
          const data = record?.['数据'] || record?.数据 || {};
          if (data.rows && Array.isArray(data.rows)) {
            // 更新行的神殿和序号
            const updatedRows = data.rows
              .filter((row: Row) => !row.isLatest) // 排除最近统计行
              .map((row: Row, idx: number) => ({
                ...row,
                index: idx + 1,
                campus: row.campus || resolvedCampus,
              }));
            setRows(updatedRows);
            console.log('[师资配比] 加载数据成功:', updatedRows);
            return;
          }
        }
      }
      // 无数据时重置为空数组
      setRows([]);
    } catch (error) {
      console.error('[师资配比] 加载数据失败:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [resolvedCampus, year]);

  // 保存到后端
  const handleSave = async () => {
    setSaving(true);
    try {
      // 排除最近统计行，更新序号和神殿
      const rowsToSave = rows
        .filter(row => !row.isLatest)
        .map((row, idx) => ({
          ...row,
          index: idx + 1,
          campus: row.campus || resolvedCampus,
        }));

      const payload = {
        神殿: resolvedCampus,
        年份: year,
        数据: {
          rows: rowsToSave,
        },
      };

      const res = await fetch(buildApiUrl('/teacher-staffing-ratio'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[师资配比] 保存失败:', res.status, errorText);
        throw new Error(errorText || `HTTP ${res.status}`);
      }

      const result = await res.json();
      console.log('[师资配比] 保存成功:', result);
      message.success('已保存到后端');
      setRows(rowsToSave);
    } catch (error) {
      console.error('[师资配比] 保存失败:', error);
      message.error(`保存失败: ${error instanceof Error ? error.message : '请重试'}`);
    } finally {
      setSaving(false);
    }
  };

  // 添加新行
  const handleAddRow = () => {
    const newIndex = rows.filter(row => !row.isLatest).length + 1;
    const newRow = buildEmptyRow(resolvedCampus, newIndex);
    setRows(prev => [...prev.filter(row => !row.isLatest), newRow]);
  };

  // 从config.teacher_profiles自动填充实际老师数量
  const handleAutoFillTeachers = useCallback(async () => {
    if (rows.filter(row => !row.isLatest).length === 0) {
      message.warning('请先添加数据行');
      return;
    }

    setAutoFilling(true);
    try {
      // 获取所有不重复的神殿（从rows中的campus字段，如果没有则使用resolvedCampus）
      const dataRows = rows.filter(row => !row.isLatest);
      const campusSet = new Set<string>();
      dataRows.forEach(row => {
        const campus = row.campus || resolvedCampus;
        if (campus) {
          campusSet.add(campus);
        }
      });

      // 为每个神殿统计教员数量
      const campusTeacherCountMap = new Map<string, number>();
      for (const campus of campusSet) {
        try {
          const teachers = await fetchTeachers({ 
            campus_name: campus, 
            active: true 
          });
          campusTeacherCountMap.set(campus, teachers.length);
        } catch (error) {
          console.error(`获取${campus}的教员数量失败:`, error);
          // 如果获取失败，尝试其他神殿名称格式
          try {
            const normalizedCampus = normalizeCampus(campus);
            const teachers1 = await fetchTeachers({ 
              campus_name: normalizedCampus, 
              active: true 
            });
            if (teachers1.length > 0) {
              campusTeacherCountMap.set(campus, teachers1.length);
              continue;
            }
          } catch (e) {
            // 忽略错误
          }
          // 如果都失败，设置为0
          campusTeacherCountMap.set(campus, 0);
        }
      }

      // 更新rows中的actualTeachers字段
      setRows(prev => prev.map(row => {
        if (row.isLatest) {
          return row;
        }
        const campus = row.campus || resolvedCampus;
        const count = campusTeacherCountMap.get(campus) || 0;
        return {
          ...row,
          actualTeachers: count,
        };
      }));

      message.success(`已自动填充${campusSet.size}个神殿的实际老师数量`);
    } catch (error) {
      console.error('自动填充失败:', error);
      message.error('自动填充失败，请稍后重试');
    } finally {
      setAutoFilling(false);
    }
  }, [rows, resolvedCampus]);

  // 初始加载数据
  useEffect(() => {
    fetchRemote();
  }, [fetchRemote]);

  // 数据变更处理
  const handleCellChange = (rowKey: string, field: keyof Row, value: string | number | null) => {
    setRows(prev => prev.map(row => {
      if (row.key === rowKey) {
        return { ...row, [field]: value ?? '' };
      }
      return row;
    }));
  };

  // 计算显示的数据（包含最近统计行）
  const displayRows = useMemo(() => {
    const latestStats = calculateLatestStats(rows);
    const dataRows = rows.filter(row => !row.isLatest);
    if (latestStats) {
      return [...dataRows, latestStats];
    }
    return dataRows;
  }, [rows]);

  // 表格列定义
  const columns: ColumnsType<Row> = [
    { 
      title: '序号', 
      dataIndex: 'index', 
      key: 'index', 
      width: 80, 
      align: 'center',
      fixed: 'left',
      render: (v) => v,
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      align: 'center',
      render: (v, record) => {
        if (record.isLatest) {
          return v;
        }
        return (
          <Input
            value={v || ''}
            onChange={(e) => handleCellChange(record.key, 'campus', e.target.value)}
            placeholder={resolvedCampus}
            style={{ width: '100%' }}
          />
        );
      },
    },
    {
      title: '统计时间',
      dataIndex: 'statsTime',
      key: 'statsTime',
      width: 120,
      align: 'center',
      render: (v, record) => {
        if (record.isLatest) {
          return v;
        }
        return (
          <Input
            value={v || ''}
            onChange={(e) => handleCellChange(record.key, 'statsTime', e.target.value)}
            placeholder={`${year}.M.D`}
            style={{ width: '100%' }}
          />
        );
      },
    },
    { 
      title: '学生人数', 
      dataIndex: 'students', 
      key: 'students', 
      width: 110, 
      align: 'center',
      render: (v, record) => {
        if (record.isLatest) {
          return v || '';
        }
        return (
          <InputNumber
            min={0}
            value={typeof v === 'number' ? v : (v ? parseFloat(String(v)) : undefined)}
            onChange={(val) => handleCellChange(record.key, 'students', val ?? 0)}
            style={{ width: '100%' }}
            placeholder="0"
          />
        );
      },
    },
    { 
      title: '班级数量', 
      dataIndex: 'classes', 
      key: 'classes', 
      width: 110, 
      align: 'center',
      render: (v, record) => {
        if (record.isLatest) {
          return v || '';
        }
        return (
          <InputNumber
            min={0}
            value={typeof v === 'number' ? v : (v ? parseFloat(String(v)) : undefined)}
            onChange={(val) => handleCellChange(record.key, 'classes', val ?? 0)}
            style={{ width: '100%' }}
            placeholder="0"
          />
        );
      },
    },
    {
      title: '教员职数分析',
      children: [
        { 
          title: '目标师资配比', 
          dataIndex: 'teacherRatio', 
          key: 'teacherRatio', 
          width: 110, 
          align: 'center',
          render: (v, record) => {
            if (record.isLatest) {
              return v || '';
            }
            return (
              <Input
                value={v || ''}
                onChange={(e) => handleCellChange(record.key, 'teacherRatio', e.target.value)}
                placeholder="如: 1:30"
                style={{ width: '100%' }}
              />
            );
          },
        },
        { 
          title: '目标老师数量', 
          dataIndex: 'targetTeachers', 
          key: 'targetTeachers', 
          width: 120, 
          align: 'center',
          render: (v, record) => {
            if (record.isLatest) {
              return v || '';
            }
            return (
              <InputNumber
                min={0}
                step={0.1}
                value={typeof v === 'number' ? v : (v ? parseFloat(String(v)) : undefined)}
                onChange={(val) => handleCellChange(record.key, 'targetTeachers', val ?? 0)}
                style={{ width: '100%' }}
                placeholder="0"
              />
            );
          },
        },
        { 
          title: '实际老师数量', 
          dataIndex: 'actualTeachers', 
          key: 'actualTeachers', 
          width: 120, 
          align: 'center',
          render: (v, record) => {
            if (record.isLatest) {
              return v || '';
            }
            return (
              <InputNumber
                min={0}
                value={typeof v === 'number' ? v : (v ? parseFloat(String(v)) : undefined)}
                onChange={(val) => handleCellChange(record.key, 'actualTeachers', val ?? 0)}
                style={{ width: '100%' }}
                placeholder="0"
              />
            );
          },
        },
        { 
          title: '老师空缺', 
          dataIndex: 'teacherVacancy', 
          key: 'teacherVacancy', 
          width: 100, 
          align: 'center',
          render: (v, record) => {
            if (record.isLatest) {
              return v || '';
            }
            return (
              <InputNumber
                min={0}
                value={typeof v === 'number' ? v : (v ? parseFloat(String(v)) : undefined)}
                onChange={(val) => handleCellChange(record.key, 'teacherVacancy', val ?? 0)}
                style={{ width: '100%' }}
                placeholder="0"
              />
            );
          },
        },
        { 
          title: '老师冗余', 
          dataIndex: 'teacherSurplus', 
          key: 'teacherSurplus', 
          width: 100, 
          align: 'center',
          render: (v, record) => {
            if (record.isLatest) {
              return v || '';
            }
            return (
              <InputNumber
                min={0}
                value={typeof v === 'number' ? v : (v ? parseFloat(String(v)) : undefined)}
                onChange={(val) => handleCellChange(record.key, 'teacherSurplus', val ?? 0)}
                style={{ width: '100%' }}
                placeholder="0"
              />
            );
          },
        },
      ],
    },
    {
      title: '干部职数分析',
      children: [
        { 
          title: '目标干部与教员配比', 
          dataIndex: 'cadreRatio', 
          key: 'cadreRatio', 
          width: 160, 
          align: 'center',
          render: (v, record) => {
            if (record.isLatest) {
              return v || '';
            }
            return (
              <Input
                value={v || ''}
                onChange={(e) => handleCellChange(record.key, 'cadreRatio', e.target.value)}
                placeholder="如: 1:3"
                style={{ width: '100%' }}
              />
            );
          },
        },
        { 
          title: '目标干部数量', 
          dataIndex: 'targetCadres', 
          key: 'targetCadres', 
          width: 120, 
          align: 'center',
          render: (v, record) => {
            if (record.isLatest) {
              return v || '';
            }
            return (
              <InputNumber
                min={0}
                step={0.1}
                value={typeof v === 'number' ? v : (v ? parseFloat(String(v)) : undefined)}
                onChange={(val) => handleCellChange(record.key, 'targetCadres', val ?? 0)}
                style={{ width: '100%' }}
                placeholder="0"
              />
            );
          },
        },
        { 
          title: '实际干部数量', 
          dataIndex: 'actualCadres', 
          key: 'actualCadres', 
          width: 120, 
          align: 'center',
          render: (v, record) => {
            if (record.isLatest) {
              return v || '';
            }
            return (
              <InputNumber
                min={0}
                value={typeof v === 'number' ? v : (v ? parseFloat(String(v)) : undefined)}
                onChange={(val) => handleCellChange(record.key, 'actualCadres', val ?? 0)}
                style={{ width: '100%' }}
                placeholder="0"
              />
            );
          },
        },
        { 
          title: '干部空缺', 
          dataIndex: 'cadreVacancy', 
          key: 'cadreVacancy', 
          width: 100, 
          align: 'center',
          render: (v, record) => {
            if (record.isLatest) {
              return v || '';
            }
            return (
              <InputNumber
                min={0}
                value={typeof v === 'number' ? v : (v ? parseFloat(String(v)) : undefined)}
                onChange={(val) => handleCellChange(record.key, 'cadreVacancy', val ?? 0)}
                style={{ width: '100%' }}
                placeholder="0"
              />
            );
          },
        },
        { 
          title: '干部冗余', 
          dataIndex: 'cadreSurplus', 
          key: 'cadreSurplus', 
          width: 100, 
          align: 'center',
          render: (v, record) => {
            if (record.isLatest) {
              return v || '';
            }
            return (
              <InputNumber
                min={0}
                value={typeof v === 'number' ? v : (v ? parseFloat(String(v)) : undefined)}
                onChange={(val) => handleCellChange(record.key, 'cadreSurplus', val ?? 0)}
                style={{ width: '100%' }}
                placeholder="0"
              />
            );
          },
        },
      ],
    },
  ];
  
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={2}>
          {resolvedCampus}智慧司师资配比表
        </Title>
        <Text type="secondary">按神殿+年份独立保存到后端</Text>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <CampusSelector useGlobalState showLabel />
        <Space>
          <span>年份</span>
          <DatePicker
            picker="year"
            value={dayjs().year(year)}
            onChange={(d) => setYear(d ? d.year() : year)}
          />
        </Space>
        <Space>
          <Button icon={<PlusOutlined />} onClick={handleAddRow}>
            添加行
          </Button>
          <Button icon={<ThunderboltOutlined />} onClick={handleAutoFillTeachers} loading={autoFilling}>
            从配置中心自动填充实际老师数量
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchRemote}>
            刷新
          </Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
            保存
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Card bordered={false}>
          <Table
            bordered
            size="small"
            columns={columns}
            dataSource={displayRows}
            pagination={false}
            rowKey="key"
            scroll={{ x: 'max-content' }}
            rowClassName={(record) => (record.isLatest ? 'latest-stats-row' : '')}
          />
        </Card>
      </Spin>
      <style>{`
        .latest-stats-row {
          background-color: #fff1f0 !important;
        }
        .latest-stats-row:hover {
          background-color: #ffe7e5 !important;
        }
      `}</style>
    </div>
  );
};

export default TeacherStaffingRatioStrictPage;
