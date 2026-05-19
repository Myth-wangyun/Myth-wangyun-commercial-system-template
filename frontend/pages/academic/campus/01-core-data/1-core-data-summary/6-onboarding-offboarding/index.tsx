import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { App, Card, Table, Button, Space, Typography, InputNumber, Input, DatePicker, Spin } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useCampusStore } from '@/stores/campusStore';
import CampusSelector from '@/components/common/CampusSelector';
import { normalizeCampus } from '@/pages/academic/teaching-content/shared/campusStorage';
import { buildApiUrl } from '@/utils/apiBase';

const { Title, Text } = Typography;

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

interface Row {
  key: number;
  content: string;
  monthly: Record<string, string | number>;
  total?: number;
}

// 构建默认行数据
const buildDefaultRows = (): Row[] => {
  return [
    { key: 1, content: '计划招聘岗位名称', monthly: {}, total: undefined },
    { key: 2, content: '计划招聘人数', monthly: {}, total: 0 },
    { key: 3, content: '实际招聘岗位名称', monthly: {}, total: undefined },
    { key: 4, content: '实际招聘人数', monthly: {}, total: 0 },
    { key: 5, content: '入职者姓名', monthly: {}, total: undefined },
    { key: 6, content: '离职人数', monthly: {}, total: 0 },
    { key: 7, content: '离职者姓名', monthly: {}, total: undefined },
  ];
};

const OnboardingOffboardingSummary: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore();
  const resolvedCampus = normalizeCampus(currentCampus ?? getAllCampuses()[0]?.name ?? '主神殿');
  const [year, setYear] = useState<number>(dayjs().year());
  const [rows, setRows] = useState<Row[]>(buildDefaultRows());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 从后端加载数据
  const fetchRemote = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        buildApiUrl(`/onboarding-offboarding-summary?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`)
      );
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length) {
          const record = list[0];
          const data = record?.['数据'] || record?.数据 || {};
          if (data.rows && Array.isArray(data.rows)) {
            setRows(data.rows);
            console.log('[入职离职汇总] 加载数据成功:', data.rows);
            return;
          }
        }
      }
      // 无数据时重置为默认
      setRows(buildDefaultRows());
    } catch (error) {
      console.error('[入职离职汇总] 加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [resolvedCampus, year]);

  // 保存到后端
  const handleSave = async () => {
    setSaving(true);
    try {
      // 计算合计（计划招聘人数、实际招聘人数、离职人数）
      const updatedRows = rows.map(row => {
        if (row.key === 2 || row.key === 4 || row.key === 6) {
          // 计算合计
          const total = Object.values(row.monthly).reduce<number>((sum, val) => {
            const num = typeof val === 'number' ? val : (typeof val === 'string' ? parseFloat(val) || 0 : 0);
            return sum + num;
          }, 0);
          return { ...row, total };
        }
        return row;
      });

      const payload = {
        神殿: resolvedCampus,
        年份: year,
        数据: {
          rows: updatedRows,
        },
      };

      const res = await fetch(buildApiUrl('/onboarding-offboarding-summary'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[入职离职汇总] 保存失败:', res.status, errorText);
        throw new Error(errorText || `HTTP ${res.status}`);
      }

      const result = await res.json();
      console.log('[入职离职汇总] 保存成功:', result);
      message.success('已保存到后端');
      setRows(updatedRows);
    } catch (error) {
      console.error('[入职离职汇总] 保存失败:', error);
      message.error(`保存失败: ${error instanceof Error ? error.message : '请重试'}`);
    } finally {
      setSaving(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    fetchRemote();
  }, [fetchRemote]);

  // 数据变更处理
  const handleCellChange = (rowKey: number, month: string, value: string | number | null) => {
    setRows(prev => prev.map(row => {
      if (row.key === rowKey) {
        const newMonthly = { ...row.monthly };
        if (value === null || value === '') {
          delete newMonthly[month];
        } else {
          newMonthly[month] = value;
        }
        
        // 如果是数字类型行，自动计算合计
        let newTotal = row.total;
        if (rowKey === 2 || rowKey === 4 || rowKey === 6) {
          newTotal = Object.values(newMonthly).reduce<number>((sum, val) => {
            const num = typeof val === 'number' ? val : (typeof val === 'string' ? parseFloat(val) || 0 : 0);
            return sum + num;
          }, 0);
        }
        
        return { ...row, monthly: newMonthly, total: newTotal };
      }
      return row;
    }));
  };

  // 计算合计
  const totals = useMemo(() => {
    const row2 = rows.find(r => r.key === 2);
    const row4 = rows.find(r => r.key === 4);
    const row6 = rows.find(r => r.key === 6);
    return {
      计划招聘人数: row2?.total || 0,
      实际招聘人数: row4?.total || 0,
      离职人数: row6?.total || 0,
    };
  }, [rows]);

  // 实际招聘人数（4）和离职人数（6）使用黄色背景
  const highlightedKeys = new Set([4, 6]);

  // 表格列定义
  const columns: ColumnsType<Row> = [
    {
      title: '序号',
      dataIndex: 'key',
      key: 'key',
      width: 80,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      width: 180,
      align: 'center',
      fixed: 'left',
    },
    ...MONTHS.map((month) => ({
      title: month,
      key: month,
      width: 120,
      align: 'center' as const,
      render: (_: any, record: Row) => {
        const isNumberRow = record.key === 2 || record.key === 4 || record.key === 6;
        const value = record.monthly[month];
        
        if (isNumberRow) {
          return (
            <InputNumber
              min={0}
              value={typeof value === 'number' ? value : (value ? parseFloat(String(value)) : undefined)}
              onChange={(v) => handleCellChange(record.key, month, v ?? 0)}
              style={{ width: '100%' }}
              placeholder="0"
            />
          );
        } else {
          return (
            <Input
              value={value ? String(value) : ''}
              onChange={(e) => handleCellChange(record.key, month, e.target.value)}
              placeholder=""
              style={{ width: '100%' }}
            />
          );
        }
      },
    })),
    {
      title: '合计',
      key: 'total',
      width: 120,
      align: 'center',
      render: (_: any, record: Row) => {
        if (record.key === 2 || record.key === 4 || record.key === 6) {
          return <strong>{record.total ?? 0}</strong>;
        }
        return '';
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={2}>
          {resolvedCampus}智慧司入职离职汇总表
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
            dataSource={rows}
            pagination={false}
            rowKey="key"
            rowClassName={(record) => (highlightedKeys.has(record.key) ? 'highlight-row' : '')}
            scroll={{ x: 'max-content' }}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={2} align="center">
                  <Text strong>合计</Text>
                </Table.Summary.Cell>
                {MONTHS.map((_, idx) => (
                  <Table.Summary.Cell key={idx} index={idx + 2} />
                ))}
                <Table.Summary.Cell index={14} align="center">
                  <Text strong>
                    计划: {totals.计划招聘人数} | 实际: {totals.实际招聘人数} | 离职: {totals.离职人数}
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
          <style>{`
            .highlight-row td {
              background-color: #fff8b3 !important;
            }
          `}</style>
        </Card>
      </Spin>
    </div>
  );
};

export default OnboardingOffboardingSummary;
