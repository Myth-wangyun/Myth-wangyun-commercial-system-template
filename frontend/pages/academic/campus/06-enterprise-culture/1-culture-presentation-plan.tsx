// 学术 -> 企业文化 -> 企业文化宣讲计划表（后端API持久化)
import React, { useEffect, useState } from 'react';
import { App, Card, Typography, Row, Col, Input, Space, Button, Table, DatePicker, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { useCampusStore } from '@/stores/campusStore';
import { getPresentationPlan, savePresentationPlan, type PlanRow } from '@/services/culturePresentation';
import { GlobalYearSelector } from '@/components/common';

const { Title, Text } = Typography;
const { Option } = Select;

const buildRows = (n = 10): PlanRow[] => Array.from({ length: n }).map((_, i) => ({
  key: String(i + 1),
  index: i + 1,
}));

const CulturePresentationPlan: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [rows, setRows] = useState<PlanRow[]>(() => buildRows());

  const campusName = currentCampus || '主神殿';

  // 加载数据
  const loadData = async () => {
    if (!campusName) return;
    
    setLoading(true);
    try {
      const plan = await getPresentationPlan(campusName, selectedYear, selectedMonth);
      
      // 转换后端数据格式到前端格式
      if (plan.行数据 && plan.行数据.length > 0) {
        const convertedRows: PlanRow[] = plan.行数据.map((row) => ({
          key: String(row.序号),
          index: row.序号,
          time: row.宣讲时间 || undefined,
          location: row.宣讲地点 || undefined,
          method: row.宣讲方式 || undefined,
          topic: row.宣讲主题 || undefined,
          summary: row.宣讲内容概述 || undefined,
          audience: row.宣讲对象 || undefined,
          speaker: row.主讲人 || undefined,
          materials: row.需准备资料 || undefined,
          remark: row.备注 || undefined,
        }));
        setRows(convertedRows);
      } else {
        // 如果没有数据，使用默认的10行
        setRows(buildRows());
      }
    } catch (error: any) {
      console.error('加载数据失败:', error);
      // 如果加载失败，使用默认数据
      setRows(buildRows());
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和年份/月份变化时重新加载
  useEffect(() => {
    loadData();
  }, [campusName, selectedYear, selectedMonth]);

  // 保存数据
  const persist = async () => {
    if (!campusName) {
      message.warning('请选择神殿');
      return;
    }

    setLoading(true);
    try {
      await savePresentationPlan(campusName, selectedYear, selectedMonth, rows);
      message.success('保存成功');
    } catch (error: any) {
      console.error('保存失败:', error);
      message.error(error.response?.data?.detail || '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setRows(buildRows());
  };

  const columns: ColumnsType<PlanRow> = [
    { title: '序号', dataIndex: 'index', width: 70, fixed: 'left', align: 'center' },
    {
      title: '宣讲时间', dataIndex: 'time', width: 140, align: 'center', 
      render: (_v, _r, i) => (
        <DatePicker 
          style={{ width: '100%' }} 
          value={rows[i].time ? dayjs(rows[i].time, 'YYYY-MM-DD') : null}
          onChange={(d: Dayjs | null) => {
            setRows(prev => prev.map((r, idx) => 
              idx === i ? { ...r, time: d ? d.format('YYYY-MM-DD') : undefined } : r
            ));
          }} 
        />
      )
    },
    {
      title: '宣讲地点', dataIndex: 'location', width: 140, render: (_v, _r, i) => (
        <Input value={rows[i].location} onChange={e => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, location: e.target.value } : r))} />
      )
    },
    {
      title: '宣讲方式', dataIndex: 'method', width: 140, render: (_v, _r, i) => (
        <Input value={rows[i].method} onChange={e => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, method: e.target.value } : r))} />
      )
    },
    {
      title: '宣讲主题', dataIndex: 'topic', width: 180, render: (_v, _r, i) => (
        <Input value={rows[i].topic} onChange={e => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, topic: e.target.value } : r))} />
      )
    },
    {
      title: '宣讲内容概述', dataIndex: 'summary', width: 220, render: (_v, _r, i) => (
        <Input value={rows[i].summary} onChange={e => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, summary: e.target.value } : r))} />
      )
    },
    {
      title: '宣讲对象', dataIndex: 'audience', width: 160, render: (_v, _r, i) => (
        <Input value={rows[i].audience} onChange={e => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, audience: e.target.value } : r))} />
      )
    },
    {
      title: '主讲人', dataIndex: 'speaker', width: 120, render: (_v, _r, i) => (
        <Input value={rows[i].speaker} onChange={e => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, speaker: e.target.value } : r))} />
      )
    },
    {
      title: '需准备资料', dataIndex: 'materials', width: 180, render: (_v, _r, i) => (
        <Input value={rows[i].materials} onChange={e => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, materials: e.target.value } : r))} />
      )
    },
    {
      title: '备注', dataIndex: 'remark', width: 180, render: (_v, _r, i) => (
        <Input value={rows[i].remark} onChange={e => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, remark: e.target.value } : r))} />
      )
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card bordered={false} style={{ background: '#f5f7fa' }}>
        <Title level={4} style={{ marginBottom: 12 }}>清美教育集团智慧司企业文化宣讲计划表</Title>

        <Row gutter={[12, 8]}>
          <Col span={8}><Space><Text strong>神殿名称</Text><Input disabled value={campusName} /></Space></Col>
          <Col span={8}><Space><Text strong>年份</Text>
            <GlobalYearSelector 
              value={selectedYear} 
              onChange={setSelectedYear}
              width={120}
            />
          </Space></Col>
          <Col span={8}><Space><Text strong>月份</Text>
            <Select value={selectedMonth} onChange={setSelectedMonth} style={{ width: 120 }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <Option key={m} value={m}>{m}月</Option>
              ))}
            </Select>
          </Space></Col>
        </Row>

        <div style={{ margin: '12px 0' }} />

        <Table<PlanRow>
          bordered
          size="small"
          columns={columns}
          dataSource={rows}
          pagination={false}
          scroll={{ x: 'max-content' }}
          loading={loading}
          rowKey="key"
        />

        <Space style={{ marginTop: 12 }}>
          <Button
            onClick={() =>
              setRows((prev) => {
                const nextIndex = prev.length + 1;
                return [...prev, { key: String(nextIndex), index: nextIndex }];
              })
            }
            disabled={loading}
          >
            新增
          </Button>
          <Button type="primary" onClick={persist} loading={loading}>保存</Button>
          <Button onClick={clearAll} disabled={loading}>清空</Button>
          <Text type="secondary">当前：{selectedYear}年{selectedMonth}月</Text>
        </Space>
      </Card>
    </div>
  );
};

export default CulturePresentationPlan;
