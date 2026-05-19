/**
 * 升学计划表页面
 * QMJY-JZ-022 XX神殿教化司XX班升学计划表 - Sheet 1
 */

import React, { useState, useMemo, useEffect } from 'react';
import { App,
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  DatePicker,
  Select,
  Popconfirm,
} from 'antd';
import {
  ReloadOutlined,
  DownloadOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,

} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useCampusStore } from '@/stores/campusStore';
import dayjs, { Dayjs } from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

import { buildApiUrl } from '@/utils/apiBase'
import { fetchClasses } from '@/services/configMaster'

// 提升升学计划记录接口
interface PromotionEducationRecord {
  key: string;
  date: string; // 日期 YYYY-MM-DD
  dayOfWeek: string; // 星期
  coreTask: '活动' | '访谈' | '班会'; // 核心任务
  specificOperation: string; // 具体操作和说明
  location: string; // 实施地点
  implementer: string; // 实施者
  deliverables: string; // 交付内容
  supervisor: string; // 监督人
  completionStatus: '已完成' | '进行中' | '未开始'; // 完成情况
}

// 默认模板（无后端数据时也可编辑）
const defaultRows: PromotionEducationRecord[] = []

const PromotionPlanTable: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const [dataSource, setDataSource] = useState<PromotionEducationRecord[]>(defaultRows);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PromotionEducationRecord | null>(null);
  const [className, setClassName] = useState<string>('');
  const [homeroomTeacher, setHomeroomTeacher] = useState<string>('');
  interface ClassItem {
    id: number;
    name?: string;
    '班级名称'?: string;
    // 可能存在于班级列表接口返回
    班主任?: string;
    homeroom_teacher_name?: string;
    class_name?: string;
  }
  const [classList, setClassList] = useState<ClassItem[]>([]);
  const [year, setYear] = useState<Dayjs | null>(dayjs());
  const [month, setMonth] = useState<Dayjs | null>(dayjs());
  const [form] = Form.useForm();

  // 根据日期获取星期
  const getDayOfWeek = (date: Dayjs | null): string => {
    if (!date) return '';
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return weekdays[date.day()];
  };

  const filteredData = useMemo(() => {
    if (!searchText) return dataSource;
    return dataSource.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchText.toLowerCase())
      )
    );
  }, [dataSource, searchText]);

  const getCoreTaskRowSpan = (record: PromotionEducationRecord) => {
    const sameCategoryRecords = dataSource.filter((item) => item.coreTask === record.coreTask);
    const firstIndex = dataSource.findIndex((item) => item.coreTask === record.coreTask);
    const index = dataSource.indexOf(record)
    if (index === firstIndex) {
      return sameCategoryRecords.length;
    }
    return 0;
  };

  const columns: ColumnsType<PromotionEducationRecord> = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 120, align: 'center' },
    { title: '星期', dataIndex: 'dayOfWeek', key: 'dayOfWeek', width: 100, align: 'center' },
    {
      title: '核心任务 (what)', dataIndex: 'coreTask', key: 'coreTask', width: 120, align: 'center',
      render: (text: string, record: PromotionEducationRecord) => {
        const rowSpan = getCoreTaskRowSpan(record);
        return { children: text, props: { rowSpan } } as any;
      },
    },
    { title: '具体操作和说明 (how)', dataIndex: 'specificOperation', key: 'specificOperation', width: 250, align: 'left' },
    { title: '实施地点', dataIndex: 'location', key: 'location', width: 150, align: 'center' },
    { title: '实施者 (who)', dataIndex: 'implementer', key: 'implementer', width: 120, align: 'center' },
    { title: '交付内容', dataIndex: 'deliverables', key: 'deliverables', width: 200, align: 'left' },
    { title: '监督人', dataIndex: 'supervisor', key: 'supervisor', width: 120, align: 'center' },
    {
      title: '完成情况', dataIndex: 'completionStatus', key: 'completionStatus', width: 120, align: 'center',
      render: (text: string) => {
        let color = '#999';
        if (text === '已完成') color = '#52c41a';
        else if (text === '进行中') color = '#1890ff';
        else if (text === '未开始') color = '#faad14';
        return <span style={{ color }}>{text}</span>;
      },
    },
    {
      title: '操作', key: 'action', width: 150, align: 'center', fixed: 'right',
      render: (_: any, record: PromotionEducationRecord) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定要删除这条记录吗？" onConfirm={() => handleDelete(record.key)} okText="确定" cancelText="取消">
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();

    // 新增时：实施者默认预填为班主任（可手动修改）
    if (homeroomTeacher) {
      form.setFieldsValue({ implementer: homeroomTeacher });
    }

    setModalVisible(true);
  };

  const handleEdit = (record: PromotionEducationRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      date: record.date ? dayjs(record.date) : null,
      dayOfWeek: record.dayOfWeek,
      coreTask: record.coreTask,
      specificOperation: record.specificOperation,
      location: record.location,
      implementer: record.implementer,
      deliverables: record.deliverables,
      supervisor: record.supervisor,
      completionStatus: record.completionStatus,
    });
    setModalVisible(true);
  };

  const handleDelete = (key: string) => {
    setDataSource(dataSource.filter((item) => item.key !== key));
    message.success('删除成功');
  };

  const handleSaveRow = async () => {
    try {
      const values = await form.validateFields();
      const dateValue = values.date as Dayjs;
      const newRecord: PromotionEducationRecord = {
        key: editingRecord?.key || Date.now().toString(),
        date: dateValue ? dateValue.format('YYYY-MM-DD') : '',
        dayOfWeek: values.dayOfWeek || getDayOfWeek(dateValue),
        coreTask: values.coreTask,
        specificOperation: values.specificOperation || '',
        location: values.location || '',
        implementer: values.implementer || homeroomTeacher || '',
        deliverables: values.deliverables || '',
        supervisor: values.supervisor || '',
        completionStatus: values.completionStatus || '未开始',
      } as PromotionEducationRecord;

      if (editingRecord) {
        setDataSource(dataSource.map((item) => (item.key === editingRecord.key ? newRecord : item)));
        message.success('更新成功');
      } else {
        setDataSource([...dataSource, newRecord]);
        message.success('新增成功');
      }

      setModalVisible(false);
      form.resetFields();
      setEditingRecord(null);
    } catch (error) {
      console.error('验证失败:', error);
    }
  };

  // 后端：加载
  const loadPlan = async () => {
    if (!currentCampus) { message.warning('请先选择神殿'); return }
    try {
      const y = year ? year.year() : undefined
      const m = month ? month.month() + 1 : undefined
      const qs: string[] = [`campus=${encodeURIComponent(currentCampus)}`]
      if (className) qs.push(`class=${encodeURIComponent(className)}`)
      if (y) qs.push(`year=${y}`)
      if (m) qs.push(`month=${m}`)
      const res = await fetch(`${buildApiUrl('/teaching-quality/promotion-plan')}?${qs.join('&')}`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as { 行列表: any[] }
      const rows = (data.行列表 || []).map((r, idx) => ({
        key: String(idx + 1),
        date: r.记录日期 || '',
        dayOfWeek: r.星期 || (r.记录日期 ? getDayOfWeek(dayjs(r.记录日期)) : ''),
        coreTask: r.核心任务 || '活动',
        specificOperation: r.具体操作 || '',
        location: r.实施地点 || '',
        implementer: r.实施者 || homeroomTeacher || '',
        deliverables: r.交付内容 || '',
        supervisor: r.监督人 || '',
        completionStatus: (r.完成情况 || '未开始') as any,
      })) as PromotionEducationRecord[]
      setDataSource(rows)
      message.success('已加载')
    } catch (e: any) { console.error(e); message.error('加载失败：' + (e?.message || '未知错误')) }
  }

  // 后端：保存
  const savePlan = async () => {
    if (!currentCampus) { message.warning('请先选择神殿'); return }
    try {
      const y = year ? year.year() : null
      const m = month ? month.month() + 1 : null
      const payload = {
        神殿名称: currentCampus,
        班级名称: className || null,
        年份: y,
        月份: m,
        行列表: dataSource.map((r, i) => ({
          序号: i + 1,
          记录日期: r.date || null,
          星期: r.dayOfWeek || null,
          核心任务: r.coreTask || null,
          具体操作: r.specificOperation || null,
          实施地点: r.location || null,
          实施者: r.implementer || null,
          交付内容: r.deliverables || null,
          监督人: r.supervisor || null,
          完成情况: r.completionStatus || null,
        }))
      }
      const res = await fetch(buildApiUrl('/teaching-quality/promotion-plan'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error(await res.text())
      await loadPlan()
      message.success('保存成功')
    } catch (e: any) { console.error(e); message.error('保存失败：' + (e?.message || '未知错误')) }
  }

  useEffect(() => {
    // 获取班级列表
    const fetchClassList = async () => {
      if (!currentCampus) return;
      try {
        const res = await fetch(buildApiUrl(`/teaching-quality/class-list?campus=${currentCampus}`));
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setClassList(data || []);
      } catch (e) {
        console.error('获取班级列表失败:', e);
      }
    };
    fetchClassList();
  }, [currentCampus]);

  // 班主任：班级变化时自动获取，并将“实施者 (who)”默认填为班主任
  useEffect(() => {
    const fetchHomeroomTeacher = async () => {
      if (!currentCampus || !className) {
        setHomeroomTeacher('');
        return;
      }

      // 1) 先从 classList 里取（如果后端 class-list 已带班主任字段）
      const matchedInList = (classList || []).find(
        (c: any) => String(c?.班级名称 ?? c?.class_name ?? c?.name ?? '').trim() === String(className).trim(),
      );
      const htFromList = String(matchedInList?.班主任 ?? matchedInList?.homeroom_teacher_name ?? '').trim();
      if (htFromList) {
        setHomeroomTeacher(htFromList);
        return;
      }

      // 2) 配置中心兜底
      try {
        const classes = await fetchClasses({ campus_name: currentCampus, active: true });
        const matched = (classes || []).find(
          (c: any) => String(c?.class_name || '').trim() === String(className).trim(),
        );
        setHomeroomTeacher(String(matched?.homeroom_teacher_name || '').trim());
      } catch (e) {
        console.error('获取班主任失败:', e);
        setHomeroomTeacher('');
      }
    };

    fetchHomeroomTeacher();
  }, [currentCampus, className, classList]);

  // 当班主任变化时，把每行的实施者自动设置为班主任（仅覆盖空值，避免把用户手填的实施者覆盖掉）
  useEffect(() => {
    if (!homeroomTeacher) return;
    setDataSource((prev) =>
      (prev || []).map((r) => ({
        ...r,
        implementer: r.implementer ? r.implementer : homeroomTeacher,
      })),
    );
  }, [homeroomTeacher]);

  useEffect(() => {
    if (currentCampus) {
      loadPlan();
    }
  }, [currentCampus, className, year, month])

  // 表头样式 - 升学计划表使用浅绿色
  const tableHeaderStyle = {
    backgroundColor: '#d9f7be',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  };

  return (
    <div>
      {/* 操作栏 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <DatePicker picker="year" value={year} onChange={(d)=> setYear(d)} style={{ width: 120 }} />
          <DatePicker picker="month" value={month} onChange={(d)=> setMonth(d)} style={{ width: 140 }} />
          <div style={{ color: '#666', minWidth: 160 }}>
            班主任：{homeroomTeacher || '-'}
          </div>
          <Select
            placeholder="选择班级（可选）"
            value={className}
            onChange={(value) => setClassName(value)}
            style={{ width: 200 }}
            allowClear
          >
            {classList.map((c) => (
              <Option key={c.id} value={c.班级名称}>
                {c.班级名称}
              </Option>
            ))}
          </Select>
          <Input
            placeholder="搜索日期、核心任务、实施者、监督人等"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        </Space>
        <Space>
          <Button icon={<SaveOutlined />} type="primary" onClick={savePlan}>保存</Button>
          <Button icon={<ReloadOutlined />} onClick={loadPlan}>刷新</Button>
          <Button icon={<DownloadOutlined />} onClick={() => message.info('导出功能开发中...')}>导出</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增记录</Button>
        </Space>
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={filteredData}
        pagination={{ defaultPageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 条记录` }}
        bordered
        scroll={{ x: 1500 }}
        components={{ header: { cell: (props: any) => (<th {...props} style={{ ...props.style, ...tableHeaderStyle }} />) } }}
      />

      {/* 编辑/新增弹窗 */}
      <Modal
        title={editingRecord ? '编辑升学计划记录' : '新增升学计划记录'}
        open={modalVisible}
        onOk={handleSaveRow}
        onCancel={() => { setModalVisible(false); form.resetFields(); setEditingRecord(null); }}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="date" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} onChange={(date) => { if (date) { form.setFieldsValue({ dayOfWeek: getDayOfWeek(date) }); } }} />
          </Form.Item>
          <Form.Item name="dayOfWeek" label="星期"><Input readOnly /></Form.Item>
          <Form.Item name="coreTask" label="核心任务 (what)" rules={[{ required: true, message: '请选择核心任务' }]}>
            <Select>
              <Option value="活动">活动</Option>
              <Option value="访谈">访谈</Option>
              <Option value="班会">班会</Option>
            </Select>
          </Form.Item>
          <Form.Item name="specificOperation" label="具体操作和说明 (how)" rules={[{ required: true, message: '请输入具体操作和说明' }]}>
            <TextArea rows={3} placeholder="请输入具体操作和说明" />
          </Form.Item>
          <Form.Item name="location" label="实施地点"><Input placeholder="请输入实施地点" /></Form.Item>
          <Form.Item name="implementer" label="实施者 (who)"><Input placeholder="请输入实施者" /></Form.Item>
          <Form.Item name="deliverables" label="交付内容"><TextArea rows={2} placeholder="请输入交付内容" /></Form.Item>
          <Form.Item name="supervisor" label="监督人"><Input placeholder="请输入监督人" /></Form.Item>
          <Form.Item name="completionStatus" label="完成情况" rules={[{ required: true, message: '请选择完成情况' }]}>
            <Select>
              <Option value="已完成">已完成</Option>
              <Option value="进行中">进行中</Option>
              <Option value="未开始">未开始</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PromotionPlanTable;
