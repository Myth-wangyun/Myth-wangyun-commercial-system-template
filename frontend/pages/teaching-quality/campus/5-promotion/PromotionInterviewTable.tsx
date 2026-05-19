/**
 * 升学访谈表页面
 * QMJY-JZ-022 XX神殿教化司XX班升学计划表 - Sheet 2
 */

import React, { useState, useMemo, useEffect } from 'react';
import { App,
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Select,
  Popconfirm,
  DatePicker,
} from 'antd';

import { loadClassFileData } from '@/pages/teaching-quality/campus/2-stu-emmplyment/5-class-file-record/services';
import {
  ReloadOutlined,
  DownloadOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useCampusStore } from '@/stores/campusStore';
import dayjs, { Dayjs } from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

import { buildApiUrl } from '@/utils/apiBase'
import { fetchClasses } from '@/services/configMaster'

// 升学访谈记录接口
interface PromotionInterviewRecord {
  key: string;
  serialNumber: number; // 序号
  studentName: string; // 姓名
  interviewContent: string; // 访谈内容
  resistancePoints: string; // 抗拒点
  isClearAdmission: '是' | '否' | '待定'; // 是否明确升学
}

const PromotionInterviewTable: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const [dataSource, setDataSource] = useState<PromotionInterviewRecord[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PromotionInterviewRecord | null>(null);
  const [className, setClassName] = useState<string>('');
  const [homeroomTeacher, setHomeroomTeacher] = useState<string>('');
  interface ClassItem {
    id: number;
    name?: string;
    '班级名称'?: string;
    // 配置中心/班级列表可能返回的字段
    class_name?: string;
    homeroom_teacher_name?: string;
    班主任?: string;
  }
  const [classList, setClassList] = useState<ClassItem[]>([]);
  const [year, setYear] = useState<Dayjs | null>(dayjs());
  const [month, setMonth] = useState<Dayjs | null>(dayjs());
  const [form] = Form.useForm();

  const filteredData = useMemo(() => {
    if (!searchText) return dataSource;
    return dataSource.filter((item) =>
      Object.values(item).some((value) => String(value).toLowerCase().includes(searchText.toLowerCase()))
    );
  }, [dataSource, searchText]);

  const columns: ColumnsType<PromotionInterviewRecord> = [
    { title: '序号', dataIndex: 'serialNumber', key: 'serialNumber', width: 80, align: 'center' },
    { title: '姓名', dataIndex: 'studentName', key: 'studentName', width: 120, align: 'center' },
    { title: '访谈内容', dataIndex: 'interviewContent', key: 'interviewContent', width: 400, align: 'left' },
    { title: '抗拒点', dataIndex: 'resistancePoints', key: 'resistancePoints', width: 200, align: 'left' },
    {
      title: '是否明确升学', dataIndex: 'isClearAdmission', key: 'isClearAdmission', width: 150, align: 'center',
      render: (text: string) => {
        let color = '#999';
        if (text === '是') color = '#52c41a';
        else if (text === '否') color = '#ff4d4f';
        else if (text === '待定') color = '#faad14';
        return <span style={{ color, fontWeight: 'bold' }}>{text}</span>;
      },
    },
    {
      title: '操作', key: 'action', width: 150, align: 'center', fixed: 'right',
      render: (_: any, record: PromotionInterviewRecord) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定要删除这条记录吗？" onConfirm={() => handleDelete(record.key)} okText="确定" cancelText="取消">
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 新增/编辑
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: PromotionInterviewRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      serialNumber: record.serialNumber,
      studentName: record.studentName,
      interviewContent: record.interviewContent,
      resistancePoints: record.resistancePoints,
      isClearAdmission: record.isClearAdmission,
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
      // 如果没有指定序号，自动生成
      let serialNumber = values.serialNumber as number | undefined;
      if (!serialNumber) {
        const maxSerialNumber = dataSource.length > 0 ? Math.max(...dataSource.map(item => item.serialNumber)) : 0;
        serialNumber = maxSerialNumber + 1;
      }
      const newRecord: PromotionInterviewRecord = {
        key: editingRecord?.key || Date.now().toString(),
        serialNumber: serialNumber!,
        studentName: values.studentName || '',
        interviewContent: values.interviewContent || '',
        resistancePoints: values.resistancePoints || '',
        isClearAdmission: (values.isClearAdmission || '待定') as any,
      };

      if (editingRecord) {
        setDataSource(dataSource.map((item) => (item.key === editingRecord.key ? newRecord : item)));
      } else {
        setDataSource([...dataSource, newRecord]);
      }

      setModalVisible(false);
      form.resetFields();
      setEditingRecord(null);
      message.success('已保存到列表，未提交数据库');
    } catch (error) {
      console.error('验证失败:', error);
    }
  };

  // 后端：加载
  const loadInterview = async () => {
    if (!currentCampus) { message.warning('请先选择神殿'); return }
    try {
      const y = year ? year.year() : undefined
      const m = month ? month.month() + 1 : undefined
      const qs: string[] = [`campus=${encodeURIComponent(currentCampus)}`]
      if (className) qs.push(`class=${encodeURIComponent(className)}`)
      if (y) qs.push(`year=${y}`)
      if (m) qs.push(`month=${m}`)
      const res = await fetch(`${buildApiUrl('/teaching-quality/promotion-interview')}?${qs.join('&')}`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as { 行列表: any[] }
      const rows = (data.行列表 || []).map((r, idx) => ({
        key: String(idx + 1),
        serialNumber: r.序号 || (idx + 1),
        studentName: r.姓名 || '',
        interviewContent: r.访谈内容 || '',
        resistancePoints: r.抗拒点 || '',
        isClearAdmission: (r.是否明确升学 || '待定') as any,
      })) as PromotionInterviewRecord[]
      setDataSource(rows)
      message.success('已加载')
    } catch (e: any) { console.error(e); message.error('加载失败：' + (e?.message || '未知错误')) }
  }

  // 从班级档案导入姓名（只导入：在读/复学/升学）
  const importFromClassFile = async () => {
    if (!currentCampus) {
      message.warning('请先选择神殿');
      return;
    }
    if (!className) {
      message.warning('请先选择班级');
      return;
    }

    setImportLoading(true);
    try {
      const rows = await loadClassFileData(className, currentCampus);
      const allowedStatus = new Set(['在读', '复学', '升学']);

      const candidates = (rows || [])
        // 兼容 studentStatus 为空：此时默认允许导入（否则会导致有数据但导不进来）
        .filter((stu: any) => {
          const status = String(stu?.studentStatus ?? '').trim();
          return !status || allowedStatus.has(status);
        })
        .map((stu: any) => String(stu?.name || '').trim())
        .filter(Boolean);

      if (candidates.length === 0) {
        message.info('班级档案中没有符合条件（在读/复学/升学）的学员');
        return;
      }

      const existingNames = new Set(
        (dataSource || []).map((r) => String(r.studentName || '').trim()).filter(Boolean)
      );

      const toAddNames = candidates.filter((n) => !existingNames.has(n));

      if (toAddNames.length === 0) {
        message.info('没有可导入的新学员（名单已全部存在）');
        return;
      }

      const startSerial = dataSource.length > 0 ? Math.max(...dataSource.map((r) => r.serialNumber || 0)) : 0;

      const toAdd: PromotionInterviewRecord[] = toAddNames.map((name, idx) => ({
        key: `${Date.now()}_${Math.random()}`,
        serialNumber: startSerial + idx + 1,
        studentName: name,
        interviewContent: '',
        resistancePoints: '',
        isClearAdmission: '待定',
      }));

      setDataSource([...dataSource, ...toAdd]);
      message.success(`已从班级档案导入 ${toAdd.length} 名学员（仅在读/复学/升学；重复已跳过）`);
    } catch (e: any) {
      console.error(e);
      message.error('从班级档案导入失败：' + (e?.message || '未知错误'));
    } finally {
      setImportLoading(false);
    }
  };

  // 后端：保存
  const saveInterview = async () => {
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
          姓名: r.studentName || null,
          访谈内容: r.interviewContent || null,
          抗拒点: r.resistancePoints || null,
          是否明确升学: r.isClearAdmission || null,
        }))
      }
      const res = await fetch(buildApiUrl('/teaching-quality/promotion-interview'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error(await res.text())
      await loadInterview()
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

  // 班主任：优先从“班级列表接口”直接取；没有的话再从配置中心（班级管理）兜底
  useEffect(() => {
    const fetchHomeroomTeacher = async () => {
      if (!currentCampus || !className) {
        setHomeroomTeacher('');
        return;
      }

      // 1) 先尝试从 classList 里取（如果接口已经返回班主任字段）
      const matchedInList = (classList || []).find(
        (c: any) => String(c?.班级名称 ?? c?.class_name ?? c?.name ?? '').trim() === String(className).trim(),
      );
      const htFromList = String(
        matchedInList?.班主任 ?? matchedInList?.homeroom_teacher_name ?? '',
      ).trim();
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

  useEffect(() => {
    if (currentCampus) {
      loadInterview();
    }
  }, [currentCampus, className, year, month])

  // 表头样式 - 升学访谈表使用金黄色
  const tableHeaderStyle = { backgroundColor: '#fffbe6', fontWeight: 'bold' as const, textAlign: 'center' as const };

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
            placeholder="搜索姓名、访谈内容、抗拒点等"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        </Space>
        <Space>
          <Button icon={<UploadOutlined />} onClick={importFromClassFile} loading={importLoading}>
            从班级档案导入姓名
          </Button>
          <Button icon={<SaveOutlined />} type="primary" onClick={saveInterview}>保存</Button>
          <Button icon={<ReloadOutlined />} onClick={loadInterview}>刷新</Button>
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
        scroll={{ x: 1200 }}
        components={{ header: { cell: (props: any) => (<th {...props} style={{ ...props.style, ...tableHeaderStyle }} />) } }}
      />

      {/* 编辑/新增弹窗 */}
      <Modal
        title={editingRecord ? '编辑升学访谈记录' : '新增升学访谈记录'}
        open={modalVisible}
        onOk={handleSaveRow}
        onCancel={() => { setModalVisible(false); form.resetFields(); setEditingRecord(null); }}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="serialNumber" label="序号"><Input type="number" placeholder="留空则自动生成" /></Form.Item>
          <Form.Item name="studentName" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}><Input placeholder="请输入姓名" /></Form.Item>
          <Form.Item name="interviewContent" label="访谈内容" rules={[{ required: true, message: '请输入访谈内容' }]}><TextArea rows={4} placeholder="请输入访谈内容" /></Form.Item>
          <Form.Item name="resistancePoints" label="抗拒点"><TextArea rows={3} placeholder="请输入抗拒点" /></Form.Item>
          <Form.Item name="isClearAdmission" label="是否明确升学" rules={[{ required: true, message: '请选择是否明确升学' }]}>
            <Select>
              <Option value="是">是</Option>
              <Option value="否">否</Option>
              <Option value="待定">待定</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PromotionInterviewTable;
