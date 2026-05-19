// 学术 -> 企业文化 -> 企业文化考试计划表（后端持久化）
import React, { useEffect, useMemo, useState } from 'react';
import { App, Card, Typography, Row, Col, Input, Space, Button, Table, DatePicker, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useCampusStore } from '@/stores/campusStore';
import { getExamPlan, saveExamPlan } from '@/services/cultureExam';
import { GlobalYearSelector } from '@/components/common';

const { Title, Text } = Typography;
const { Option } = Select;

type PlanRow = {
  key: string;
  index: number;
  time?: string;
  location?: string;
  method?: string; // 考试方式
  topic?: string; // 考试主题
  content?: string; // 考试内容概述
  audience?: string; // 考试对象
  proctor?: string; // 监考人
  venue?: string; // 考场布置
  materials?: string; // 需准备资料
  remark?: string;
};

const buildRows = (n = 10): PlanRow[] => Array.from({ length: n }).map((_, i) => ({ key: String(i + 1), index: i + 1 }));

const CultureExamPlan: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const now = new Date();
  const [meta, setMeta] = useState({ campusName: '石美' });
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [rows, setRows] = useState<PlanRow[]>(() => buildRows());
  const [loading, setLoading] = useState(false);

  // 与顶部神殿选择器保持同步
  useEffect(() => {
    if (currentCampus) setMeta({ campusName: currentCampus });
  }, [currentCampus]);

  const campusName = useMemo(() => currentCampus || meta.campusName, [currentCampus, meta.campusName]);

  const mapFromApiRows = (apiRows: any[]): PlanRow[] =>
    (apiRows || []).map((item) => ({
      key: String(item.序号),
      index: item.序号,
      time: item.考试时间 || '',
      location: item.考试地点 || '',
      method: item.考试方式 || '',
      topic: item.考试主题 || '',
      content: item.考试内容概述 || '',
      audience: item.考试对象 || '',
      proctor: item.监考人 || '',
      venue: item.考场布置 || '',
      materials: item.需准备资料 || '',
      remark: item.备注 || '',
    }));

  const loadPlan = async () => {
    setLoading(true);
    try {
      const data = await getExamPlan(campusName, selectedYear, selectedMonth);
      if (data.行数据 && data.行数据.length > 0) {
        setRows(mapFromApiRows(data.行数据));
      } else {
        setRows(buildRows());
      }
    } catch (error) {
      message.error('获取考试计划失败');
      setRows(buildRows());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campusName, selectedYear, selectedMonth]);

  const clearAll = () => {
    setRows(buildRows());
  };

  const persist = async () => {
    setLoading(true);
    try {
      const saved = await saveExamPlan(campusName, selectedYear, selectedMonth, rows);
      setRows(mapFromApiRows(saved.行数据));
      message.success('保存成功');
    } catch (error) {
      console.error('保存考试计划失败:', error);
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<PlanRow> = [
    { title: '序号', dataIndex: 'index', width: 70, fixed: 'left', align: 'center' },
    { title: '考试时间', dataIndex: 'time', width: 140, align: 'center', render: (_v, _r, i) => (
      <DatePicker
        style={{ width: '100%' }}
        value={rows[i]?.time ? dayjs(rows[i].time) : null}
        onChange={(d:any)=> setRows(prev=> prev.map((r,idx)=> idx===i? { ...r, time: d? d.format('YYYY-MM-DD'): '' }: r))}
      />
    )},
    { title: '考试地点', dataIndex: 'location', width: 140, render: (_v, _r, i) => (
      <Input value={rows[i].location} onChange={e=> setRows(prev=> prev.map((r,idx)=> idx===i? { ...r, location: e.target.value }: r))} />
    )},
    { title: '考试方式', dataIndex: 'method', width: 140, render: (_v, _r, i) => (
      <Input value={rows[i].method} onChange={e=> setRows(prev=> prev.map((r,idx)=> idx===i? { ...r, method: e.target.value }: r))} />
    )},
    { title: '考试主题', dataIndex: 'topic', width: 160, render: (_v, _r, i) => (
      <Input value={rows[i].topic} onChange={e=> setRows(prev=> prev.map((r,idx)=> idx===i? { ...r, topic: e.target.value }: r))} />
    )},
    { title: '考试内容概述', dataIndex: 'content', width: 200, render: (_v, _r, i) => (
      <Input value={rows[i].content} onChange={e=> setRows(prev=> prev.map((r,idx)=> idx===i? { ...r, content: e.target.value }: r))} />
    )},
    { title: '考试对象', dataIndex: 'audience', width: 140, render: (_v, _r, i) => (
      <Input value={rows[i].audience} onChange={e=> setRows(prev=> prev.map((r,idx)=> idx===i? { ...r, audience: e.target.value }: r))} />
    )},
    { title: '监考人', dataIndex: 'proctor', width: 120, render: (_v, _r, i) => (
      <Input value={rows[i].proctor} onChange={e=> setRows(prev=> prev.map((r,idx)=> idx===i? { ...r, proctor: e.target.value }: r))} />
    )},
    { title: '考场布置', dataIndex: 'venue', width: 140, render: (_v, _r, i) => (
      <Input value={rows[i].venue} onChange={e=> setRows(prev=> prev.map((r,idx)=> idx===i? { ...r, venue: e.target.value }: r))} />
    )},
    { title: '需准备资料', dataIndex: 'materials', width: 160, render: (_v, _r, i) => (
      <Input value={rows[i].materials} onChange={e=> setRows(prev=> prev.map((r,idx)=> idx===i? { ...r, materials: e.target.value }: r))} />
    )},
    { title: '备注', dataIndex: 'remark', width: 160, render: (_v, _r, i) => (
      <Input value={rows[i].remark} onChange={e=> setRows(prev=> prev.map((r,idx)=> idx===i? { ...r, remark: e.target.value }: r))} />
    )},
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card bordered={false} style={{ background: '#f5f7fa' }}>
        <Title level={4} style={{ marginBottom: 12 }}>清美教育集团智慧司企业文化考试计划表</Title>

        <Row gutter={[12,8]}>
          <Col span={8}><Space><Text strong>神殿名称</Text><Input disabled value={campusName} /></Space></Col>
          <Col span={8}><Space><Text strong>年份</Text>
            <GlobalYearSelector 
              value={selectedYear} 
              onChange={setSelectedYear}
              width={120}
            />
            <Text strong>月份</Text>
            <Select value={selectedMonth} onChange={setSelectedMonth} style={{ width: 120 }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
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
          loading={loading}
          scroll={{ x: 'max-content' }}
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
          <Button type="primary" onClick={persist}>保存</Button>
          <Button onClick={clearAll}>清空</Button>
          <Text type="secondary">当前：{selectedYear}年{selectedMonth}月</Text>
        </Space>
      </Card>
    </div>
  );
};

export default CultureExamPlan;
