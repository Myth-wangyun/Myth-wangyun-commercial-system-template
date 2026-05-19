import React, { useEffect, useState, useCallback } from 'react';
import { App, Card, Table, Button, Form, Modal, Input, InputNumber, Select, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useCampusStore } from '@/stores/campusStore';
import CampusSelector from '@/components/common/CampusSelector';
import { normalizeCampus } from '@/pages/academic/teaching-content/shared/campusStorage';
import { buildApiUrl } from '@/utils/apiBase';

interface TrainingPlanRecord {
  id: number;
  key: string;
  month: string;
  trainingGoal: string;
  mainContent: string;
  trainingMethod: string;
  responsiblePerson: string;
  traineesCount: number;
  passedCount: number;
  passRate: number; // 后端存储的是数字
  averageScore: number;
}

// 专用于"核心数据-神殿-培训计划与成绩汇总表"的页面
// 标题要求：{神殿名称}智慧司培训计划与成绩汇总表

const CampusTrainingPlanPerformanceCorePage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const resolvedCampus = normalizeCampus(currentCampus ?? '主神殿');
  
  const [data, setData] = useState<TrainingPlanRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState<number>(dayjs().year());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TrainingPlanRecord | null>(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(`/training-plan-summary?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`));
      if (!response.ok) {
        throw new Error('获取数据失败');
      }
      const result = await response.json();
      const formatted = result.map((item: any) => ({
        id: item.id,
        key: `${item.id}`,
        month: item.月份,
        trainingGoal: item.培训目标,
        mainContent: item.主要内容,
        trainingMethod: item.培训方式,
        responsiblePerson: item.负责人,
        traineesCount: item.培训人数,
        passedCount: item.合格人数,
        passRate: item.考试合格率,
        averageScore: item.平均成绩,
      }));
      setData(formatted);
    } catch (error) {
      console.error('获取培训计划数据失败:', error);
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [resolvedCampus, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: TrainingPlanRecord) => {
    setEditingRecord(record);
    // 解析月份，如 "2月" -> 2
    const monthStr = record.month || '';
    const monthNum = parseInt(monthStr.replace('月', ''));
    
    // 先打开 Modal，再延迟设置表单值（确保 Form 已挂载）
    setIsModalOpen(true);
    
    setTimeout(() => {
      form.setFieldsValue({
        month: isNaN(monthNum) ? undefined : monthNum,
        trainingGoal: record.trainingGoal || undefined,
        mainContent: record.mainContent || undefined,
        trainingMethod: record.trainingMethod || undefined,
        responsiblePerson: record.responsiblePerson || undefined,
        traineesCount: record.traineesCount ?? undefined,
        passedCount: record.passedCount ?? undefined,
        passRate: record.passRate ?? undefined,
        averageScore: record.averageScore ?? undefined,
      });
    }, 0);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(buildApiUrl(`/training-plan-summary/${id}`), {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('删除失败');
      }
      message.success('删除成功');
      fetchData();
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  const handleSave = async () => {
    try {
      // 只获取表单值，不强制验证所有字段
      const values = form.getFieldsValue();
      
      // 只验证月份是否填写
      if (!values.month) {
        message.warning('请至少选择月份');
        return;
      }

      const payload = {
        神殿名称: resolvedCampus,
        年份: year,
        月份: `${values.month}月`,
        培训目标: values.trainingGoal || '',
        主要内容: values.mainContent || '',
        培训方式: values.trainingMethod || '',
        负责人: values.responsiblePerson || '',
        培训人数: values.traineesCount ?? 0,
        合格人数: values.passedCount ?? 0,
        考试合格率: values.passRate ?? 0,
        平均成绩: values.averageScore ?? 0,
      };

      let response;
      if (editingRecord) {
        response = await fetch(buildApiUrl(`/training-plan-summary/${editingRecord.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(buildApiUrl('/training-plan-summary'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        throw new Error('保存失败');
      }

      message.success('保存成功');
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    }
  };

  const columns: ColumnsType<TrainingPlanRecord> = [
    { title: '月份', dataIndex: 'month', key: 'month', width: 80, align: 'center' },
    { title: '培训目标', dataIndex: 'trainingGoal', key: 'trainingGoal', width: 180 },
    { title: '主要内容', dataIndex: 'mainContent', key: 'mainContent', width: 200 },
    { title: '培训方式', dataIndex: 'trainingMethod', key: 'trainingMethod', width: 100, align: 'center' },
    { title: '负责人', dataIndex: 'responsiblePerson', key: 'responsiblePerson', width: 80, align: 'center' },
    { title: '培训人数', dataIndex: 'traineesCount', key: 'traineesCount', width: 80, align: 'center' },
    { title: '合格人数', dataIndex: 'passedCount', key: 'passedCount', width: 80, align: 'center' },
    { title: '考试合格率', dataIndex: 'passRate', key: 'passRate', width: 100, align: 'center', render: (v) => v != null ? `${v}%` : '' },
    { title: '平均成绩', dataIndex: 'averageScore', key: 'averageScore', width: 80, align: 'center' },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除吗?" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={`${resolvedCampus}智慧司培训计划与成绩汇总表`}
        extra={
          <Space>
            <span>年份:</span>
            <InputNumber
              value={year}
              onChange={(v) => v && setYear(v)}
              min={2020}
              max={2100}
              style={{ width: 100 }}
            />
            <CampusSelector />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增</Button>
          </Space>
        }
        bordered={false}
      >
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑记录' : '新增记录'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        width={700}
        okText="保存"
        cancelText="取消"
        forceRender
      >
        <Form form={form} layout="vertical">
          <Form.Item label="月份" name="month">
            <Select placeholder="请选择月份">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <Select.Option key={m} value={m}>{m}月</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="培训目标" name="trainingGoal">
            <Input.TextArea rows={2} placeholder="请输入培训目标" />
          </Form.Item>
          <Form.Item label="主要内容" name="mainContent">
            <Input.TextArea rows={2} placeholder="请输入主要内容" />
          </Form.Item>
          <Form.Item label="培训方式" name="trainingMethod">
            <Input placeholder="请输入培训方式" />
          </Form.Item>
          <Form.Item label="负责人" name="responsiblePerson">
            <Input placeholder="请输入负责人" />
          </Form.Item>
          <Form.Item label="培训人数" name="traineesCount">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入培训人数" />
          </Form.Item>
          <Form.Item label="合格人数" name="passedCount">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入合格人数" />
          </Form.Item>
          <Form.Item label="考试合格率(%)" name="passRate">
            <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="请输入合格率数值，如85" />
          </Form.Item>
          <Form.Item label="平均成绩" name="averageScore">
            <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="请输入平均成绩" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CampusTrainingPlanPerformanceCorePage;
