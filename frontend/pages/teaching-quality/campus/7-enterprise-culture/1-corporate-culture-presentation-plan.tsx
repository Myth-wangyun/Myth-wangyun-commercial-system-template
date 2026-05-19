// 企业文化宣讲计划表
import React, { useCallback, useEffect, useState } from 'react';
import { App, Card, Typography, Input, Space, Button, Table, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useCampusStore } from '@/stores/campusStore';
import { buildApiUrl } from '@/utils/apiBase';

const { Title } = Typography;

type PlanRow = {
  key: string;
  index: number;
  time?: string;
  location?: string;
  method?: string;
  topic?: string;
  summary?: string;
  audience?: string;
  speaker?: string;
  materials?: string;
  remark?: string;
};

const STORAGE_KEY = 'management-center-teaching-quality-culture-presentation-plan';

const buildRows = (n = 10): PlanRow[] => Array.from({ length: n }).map((_, i) => ({
  key: String(i + 1),
  index: i + 1,
}));

const hasContent = (row: PlanRow) =>
  Boolean(
    row.time ||
      row.location ||
      row.method ||
      row.topic ||
      row.summary ||
      row.audience ||
      row.speaker ||
      row.materials ||
      row.remark,
  );

const normalizeRows = (rows: PlanRow[], min = 10): PlanRow[] => {
  if (!rows.length) return buildRows(min);
  const maxIndex = Math.max(min, ...rows.map((r) => r.index));
  const base = buildRows(maxIndex);
  const byIndex = new Map<number, PlanRow>();
  rows.forEach((r) => byIndex.set(r.index, { ...r, key: String(r.index) }));
  return base.map((r) => byIndex.get(r.index) ?? r);
};

const ManagementCenterCorporateCulturePresentationPlanPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const [rows, setRows] = useState<PlanRow[]>(() => buildRows());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [year] = useState<number>(dayjs().year());
  const [month] = useState<number>(dayjs().month() + 1);
  const campus = currentCampus || '最高议事厅';

  const loadFromLocal = useCallback((): PlanRow[] | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        if (Array.isArray(obj)) return obj as PlanRow[];
        if (Array.isArray(obj.rows)) return obj.rows as PlanRow[];
      }
    } catch {}
    return null;
  }, []);

  const loadFromBackend = useCallback(async () => {
    if (!campus) return;
    setLoading(true);
    try {
      const url = `${buildApiUrl('/teaching-quality/culture-presentation-plan')}?campus=${encodeURIComponent(
        campus,
      )}&year=${year}&month=${month}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { 行列表?: any[] };
      const list = Array.isArray(data.行列表) ? data.行列表 : [];
      const mapped = list.map((row, idx) => ({
        key: String(row.序号 ?? idx + 1),
        index: Number(row.序号 ?? idx + 1),
        time: row.宣讲时间 || '',
        location: row.宣讲地点 || '',
        method: row.宣讲方式 || '',
        topic: row.宣讲主题 || '',
        summary: row.宣讲内容概述 || '',
        audience: row.宣讲对象 || '',
        speaker: row.主讲人 || '',
        materials: row.需准备资料 || '',
        remark: row.备注 || '',
      }));
      if (mapped.length) {
        setRows(normalizeRows(mapped));
        return;
      }
      const localRows = loadFromLocal();
      if (localRows) setRows(normalizeRows(localRows));
    } catch (error) {
      const localRows = loadFromLocal();
      if (localRows) setRows(normalizeRows(localRows));
    } finally {
      setLoading(false);
    }
  }, [campus, loadFromLocal, month, year]);

  useEffect(() => {
    loadFromBackend();
  }, [loadFromBackend]);

  const persist = (nextRows: PlanRow[] = rows) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows: nextRows }));
    } catch {}
  };

  const saveToBackend = async () => {
    if (!campus) {
      message.warning('请先选择神殿');
      return;
    }
    const payloadRows = rows
      .filter(hasContent)
      .map((row) => ({
        序号: row.index,
        宣讲时间: row.time || undefined,
        宣讲地点: row.location || undefined,
        宣讲方式: row.method || undefined,
        宣讲主题: row.topic || undefined,
        宣讲内容概述: row.summary || undefined,
        宣讲对象: row.audience || undefined,
        主讲人: row.speaker || undefined,
        需准备资料: row.materials || undefined,
        备注: row.remark || undefined,
      }));

    try {
      setSaving(true);
      const res = await fetch(buildApiUrl('/teaching-quality/culture-presentation-plan'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          神殿名称: campus,
          年份: year,
          月份: month,
          行列表: payloadRows,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { 行列表?: any[] };
      const list = Array.isArray(data.行列表) ? data.行列表 : [];
      const mapped = list.map((row, idx) => ({
        key: String(row.序号 ?? idx + 1),
        index: Number(row.序号 ?? idx + 1),
        time: row.宣讲时间 || '',
        location: row.宣讲地点 || '',
        method: row.宣讲方式 || '',
        topic: row.宣讲主题 || '',
        summary: row.宣讲内容概述 || '',
        audience: row.宣讲对象 || '',
        speaker: row.主讲人 || '',
        materials: row.需准备资料 || '',
        remark: row.备注 || '',
      }));
      const normalized = normalizeRows(mapped);
      setRows(normalized);
      persist(normalized);
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
      const newRow: PlanRow = {
        key: String(maxIndex + 1),
        index: maxIndex + 1,
      };
      return [...prev, newRow];
    });
  };

  const columns: ColumnsType<PlanRow> = [
    { title: '序号', dataIndex: 'index', width: 70, fixed: 'left', align: 'center' },
    {
      title: '宣讲时间',
      dataIndex: 'time',
      width: 140,
      align: 'center',
      render: (_v, _r, i) => (
        <DatePicker
          style={{ width: '100%' }}
          value={rows[i].time ? dayjs(rows[i].time, 'YYYY/M/D') : null}
          onChange={(d: any) =>
            setRows(prev =>
              prev.map((r, idx) => (idx === i ? { ...r, time: d ? d.format('YYYY/M/D') : '' } : r))
            )
          }
        />
      ),
    },
    {
      title: '宣讲地点',
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
      title: '宣讲方式',
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
      title: '宣讲主题',
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
      title: '宣讲内容概述',
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
      title: '宣讲对象',
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
      title: '主讲人',
      dataIndex: 'speaker',
      width: 120,
      render: (_v, _r, i) => (
        <Input
          value={rows[i].speaker}
          onChange={e =>
            setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, speaker: e.target.value } : r)))
          }
        />
      ),
    },
    {
      title: '需准备资料',
      dataIndex: 'materials',
      width: 180,
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
      width: 180,
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
        <Title level={4} style={{ marginBottom: 12 }}>最高议事厅教化司企业文化宣讲计划表</Title>

        <div style={{ marginBottom: 12 }} />

        <Table<PlanRow>
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

export default ManagementCenterCorporateCulturePresentationPlanPage;

