// 企业文化考试成绩表
// 企业文化考试计划表
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { App, Card, Typography, Input, Space, Button, Table, DatePicker, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useCampusStore } from '@/stores/campusStore';
import { buildApiUrl } from '@/utils/apiBase';

const { Title } = Typography;
const { Option } = Select;

type ExamPlanRow = {
  key: string;
  index: number;
  examDate?: string;
  location?: string;
  method?: string;
  topic?: string;
  summary?: string;
  audience?: string;
  proctor?: string;
  arrangement?: string;
  materials?: string;
  remark?: string;
};

const STORAGE_KEY = 'management-center-teaching-quality-culture-exam-plan';
const LEGACY_STORAGE_KEYS = ['management-center-teaching-quality-culture-exam-scores'];

const buildRows = (n = 10): ExamPlanRow[] => Array.from({ length: n }).map((_, i) => ({
  key: String(i + 1),
  index: i + 1,
}));

const hasContent = (row: ExamPlanRow) =>
  Boolean(
    row.examDate ||
      row.location ||
      row.method ||
      row.topic ||
      row.summary ||
      row.audience ||
      row.proctor ||
      row.arrangement ||
      row.materials ||
      row.remark,
  );

const normalizeRows = (rows: ExamPlanRow[], min = 10): ExamPlanRow[] => {
  if (!rows.length) return buildRows(min);
  const maxIndex = Math.max(min, ...rows.map((r) => r.index));
  const base = buildRows(maxIndex);
  const byIndex = new Map<number, ExamPlanRow>();
  rows.forEach((r) => byIndex.set(r.index, { ...r, key: String(r.index) }));
  return base.map((r) => byIndex.get(r.index) ?? r);
};

const mapRows = (savedRows: any[]): ExamPlanRow[] =>
  savedRows.map((row: any, idx: number) => ({
    key: String(row.序号 ?? row.index ?? idx + 1),
    index: Number(row.序号 ?? row.index ?? idx + 1),
    examDate: row.考试时间 || row.examDate || row.time || '',
    location: row.考试地点 || row.location || '',
    method: row.考试方式 || row.method || '',
    topic: row.考试主题 || row.topic || row.scope || '',
    summary: row.考试内容概述 || row.summary || row.content || '',
    audience: row.考试对象 || row.audience || row.examObject || '',
    proctor: row.监考人 || row.proctor || row.invigilator || '',
    arrangement: row.考场布置 || row.arrangement || row.examArrangement || '',
    materials: row.需准备资料 || row.materials || row.preparation || '',
    remark: row.备注 || row.remark || '',
  }));

const ManagementCenterCorporateCultureExamPlanPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore();
  const campusOptions = useMemo(() => {
    const names = getAllCampuses().map((c) => c.name).filter(Boolean);
    if (!names.includes('最高议事厅')) {
      names.unshift('最高议事厅');
    }
    return names;
  }, [getAllCampuses]);
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '最高议事厅');
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [rows, setRows] = useState<ExamPlanRow[]>(() => buildRows());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentCampus && currentCampus !== selectedCampus) {
      setSelectedCampus(currentCampus);
    }
  }, [currentCampus, selectedCampus]);

  const loadFromLocal = useCallback((campus: string, year: number, month: number): ExamPlanRow[] | null => {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY) ??
        LEGACY_STORAGE_KEYS.map(key => localStorage.getItem(key)).find(Boolean) ??
        null;
      if (raw) {
        const obj = JSON.parse(raw);
        const savedRows = Array.isArray(obj)
          ? obj
          : Array.isArray(obj.rows)
            ? obj.rows
            : [];
        if (obj?.campus && obj?.year && obj?.month) {
          if (obj.campus !== campus || obj.year !== year || obj.month !== month) {
            return null;
          }
        }
        if (savedRows.length) {
          return mapRows(savedRows);
        }
      }
    } catch {}
    return null;
  }, []);

  const persist = useCallback((nextRows: ExamPlanRow[], campus: string, year: number, month: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ campus, year, month, rows: nextRows }));
      LEGACY_STORAGE_KEYS.forEach(key => {
        if (key !== STORAGE_KEY) {
          try {
            localStorage.removeItem(key);
          } catch {}
        }
      });
    } catch {}
  }, []);

  const loadFromBackend = useCallback(async () => {
    if (!selectedCampus) return;
    const year = selectedMonth.year();
    const month = selectedMonth.month() + 1;
    setLoading(true);
    try {
      const url = `${buildApiUrl('/teaching-quality/culture-exam-plan')}?campus=${encodeURIComponent(
        selectedCampus,
      )}&year=${year}&month=${month}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { 行列表?: any[] };
      const list = Array.isArray(data.行列表) ? data.行列表 : [];
      if (list.length) {
        const mapped = normalizeRows(mapRows(list));
        setRows(mapped);
        persist(mapped, selectedCampus, year, month);
        return;
      }
      const localRows = loadFromLocal(selectedCampus, year, month);
      if (localRows) {
        setRows(normalizeRows(localRows));
      } else {
        setRows(buildRows());
      }
    } catch (error) {
      const localRows = loadFromLocal(selectedCampus, year, month);
      if (localRows) {
        setRows(normalizeRows(localRows));
      } else {
        setRows(buildRows());
      }
    } finally {
      setLoading(false);
    }
  }, [loadFromLocal, persist, selectedCampus, selectedMonth]);

  useEffect(() => {
    loadFromBackend();
  }, [loadFromBackend]);

  const saveToBackend = async () => {
    if (!selectedCampus) {
      message.warning('请先选择神殿');
      return;
    }
    const year = selectedMonth.year();
    const month = selectedMonth.month() + 1;
    const payloadRows = rows
      .filter(hasContent)
      .map((row) => ({
        序号: row.index,
        考试时间: row.examDate || undefined,
        考试地点: row.location || undefined,
        考试方式: row.method || undefined,
        考试主题: row.topic || undefined,
        考试内容概述: row.summary || undefined,
        考试对象: row.audience || undefined,
        监考人: row.proctor || undefined,
        考场布置: row.arrangement || undefined,
        需准备资料: row.materials || undefined,
        备注: row.remark || undefined,
      }));

    try {
      setSaving(true);
      const res = await fetch(buildApiUrl('/teaching-quality/culture-exam-plan'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          神殿名称: selectedCampus,
          年份: year,
          月份: month,
          行列表: payloadRows,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { 行列表?: any[] };
      const list = Array.isArray(data.行列表) ? data.行列表 : [];
      const mapped = normalizeRows(mapRows(list));
      setRows(mapped);
      persist(mapped, selectedCampus, year, month);
      message.success('保存成功');
    } catch (error) {
      message.error('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const clearAll = () => {
    setRows(buildRows());
  };

  const addRow = () => {
    setRows(prev => {
      const maxIndex = prev.length > 0 ? Math.max(...prev.map(r => r.index)) : 0;
      const newRow: ExamPlanRow = {
        key: String(maxIndex + 1),
        index: maxIndex + 1,
      };
      return [...prev, newRow];
    });
  };

  const columns: ColumnsType<ExamPlanRow> = [
    { title: '序号', dataIndex: 'index', width: 70, fixed: 'left', align: 'center' },
    {
      title: '考试时间',
      dataIndex: 'examDate',
      width: 140,
      align: 'center',
      render: (_v, _r, i) => (
        <DatePicker
          style={{ width: '100%' }}
          value={rows[i].examDate ? dayjs(rows[i].examDate, 'YYYY/M/D') : null}
          onChange={(d: any) =>
            setRows(prev =>
              prev.map((r, idx) => (idx === i ? { ...r, examDate: d ? d.format('YYYY/M/D') : '' } : r))
            )
          }
        />
      ),
    },
    {
      title: '考试地点',
      dataIndex: 'location',
      width: 140,
      render: (_v, _r, i) => (
        <Input
          value={rows[i].location}
          onChange={e =>
            setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, location: e.target.value } : r)))
          }
        />
      ),
    },
    {
      title: '考试方式',
      dataIndex: 'method',
      width: 140,
      render: (_v, _r, i) => (
        <Input
          value={rows[i].method}
          onChange={e =>
            setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, method: e.target.value } : r)))
          }
        />
      ),
    },
    {
      title: '考试主题',
      dataIndex: 'topic',
      width: 180,
      render: (_v, _r, i) => (
        <Input
          value={rows[i].topic}
          onChange={e =>
            setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, topic: e.target.value } : r)))
          }
        />
      ),
    },
    {
      title: '考试内容概述',
      dataIndex: 'summary',
      width: 220,
      render: (_v, _r, i) => (
        <Input
          value={rows[i].summary}
          onChange={e =>
            setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, summary: e.target.value } : r)))
          }
        />
      ),
    },
    {
      title: '考试对象',
      dataIndex: 'audience',
      width: 160,
      render: (_v, _r, i) => (
        <Input
          value={rows[i].audience}
          onChange={e =>
            setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, audience: e.target.value } : r)))
          }
        />
      ),
    },
    {
      title: '监考人',
      dataIndex: 'proctor',
      width: 140,
      render: (_v, _r, i) => (
        <Input
          value={rows[i].proctor}
          onChange={e =>
            setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, proctor: e.target.value } : r)))
          }
        />
      ),
    },
    {
      title: '考场布置',
      dataIndex: 'arrangement',
      width: 200,
      render: (_v, _r, i) => (
        <Input
          value={rows[i].arrangement}
          onChange={e =>
            setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, arrangement: e.target.value } : r)))
          }
        />
      ),
    },
    {
      title: '需准备资料',
      dataIndex: 'materials',
      width: 200,
      render: (_v, _r, i) => (
        <Input
          value={rows[i].materials}
          onChange={e =>
            setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, materials: e.target.value } : r)))
          }
        />
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 200,
      render: (_v, _r, i) => (
        <Input
          value={rows[i].remark}
          onChange={e =>
            setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, remark: e.target.value } : r)))
          }
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card bordered={false} style={{ background: '#f5f7fa' }}>
        <Title level={4} style={{ marginBottom: 12 }}>最高议事厅教化司企业文化考试计划表</Title>

        <Space style={{ marginBottom: 12 }} wrap>
          <Select
            style={{ width: 180 }}
            placeholder="选择神殿"
            value={selectedCampus}
            onChange={setSelectedCampus}
          >
            {campusOptions.map((name) => (
              <Option key={name} value={name}>
                {name}
              </Option>
            ))}
          </Select>
          <DatePicker
            picker="month"
            allowClear={false}
            value={selectedMonth}
            onChange={(d) => d && setSelectedMonth(d)}
          />
          <Button onClick={loadFromBackend} loading={loading}>
            加载
          </Button>
        </Space>

        <Table<ExamPlanRow>
          bordered
          size="small"
          columns={columns}
          dataSource={rows}
          pagination={false}
          scroll={{ x: 'max-content' }}
          loading={loading}
        />

        <Space style={{ marginTop: 12 }}>
          <Button type="primary" onClick={saveToBackend} loading={saving}>
            保存到后端
          </Button>
          <Button onClick={addRow}>新增记录</Button>
          <Button onClick={clearAll}>清空</Button>
        </Space>
      </Card>
    </div>
  );
};

export default ManagementCenterCorporateCultureExamPlanPage;



