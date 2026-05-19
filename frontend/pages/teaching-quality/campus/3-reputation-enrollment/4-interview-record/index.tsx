/**
 * 学员、家长、毕业生访谈记录表页面（已接入后端）
 */

import React, { useState, useMemo, useEffect } from 'react';
import { App,
  Card,
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Select,
  Popconfirm,
  DatePicker,
  Tabs,
  Checkbox,
} from 'antd';
import { fetchClasses } from '@/services/configMaster';
import { loadClassFileData } from '@/pages/teaching-quality/campus/2-stu-emmplyment/5-class-file-record/services';
import type { ClassFileRecordRow } from '@/pages/teaching-quality/campus/2-stu-emmplyment/5-class-file-record/types';
import {
  ReloadOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import HomeroomTeacherSelect from '@/components/HomeroomTeacherSelect';
import type { ColumnsType } from 'antd/es/table';
import { useCampusStore } from '@/stores/campusStore';
import dayjs, { Dayjs } from 'dayjs';
import GraduateParentInterviewTable, { type GraduateParentInterviewRecord } from './graduate-parent-interview-table';

const { Option } = Select;
const { TextArea } = Input;

import { buildApiUrl } from '@/utils/apiBase';

// 访谈记录接口
interface InterviewRecord {
  key: string;
  serialNumber: number; // 序号
  studentName: string; // 姓名
  className?: string; // 班级（毕业生）
  counselor?: string; // 咨询师（学员/毕业生）
  education?: string; // 学历（学员/毕业生）
  hometown?: string; // 籍贯（学员/毕业生）
  enrollmentDate?: string; // 入学时间（学员/毕业生）
  interviewLog?: string; // 访谈记录（学员/毕业生）
  monthNotes?: string[]; // 家长访谈：12个月备注（旧）
  visitDate?: string; // 访谈时间（学员/家长/毕业生/其他）
}

const InterviewRecordPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore();
  const campusList = useMemo(() => getAllCampuses(), [getAllCampuses]);
  const [dataSource, setDataSource] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<InterviewRecord | null>(null);
  const [form] = Form.useForm();

  // 筛选条件
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '');
    const [month, setMonth] = useState<Dayjs | null>(dayjs());
  const [activeTab, setActiveTab] = useState<string>('家长访谈');
  const isParent = activeTab === '家长访谈'; // 家长访谈：姓名可编辑，访谈时间用日历
  const isGraduateParent = activeTab === '毕业生家长访谈'; // 毕业生家长访谈：类似家长访谈
  const isOther = activeTab === '其他访谈';
  const isGraduate = activeTab === '毕业生访谈';

  // 学员访谈：页面级班主任筛选（从配置中心读取）
  const [selectedHomeroomTeacher, setSelectedHomeroomTeacher] = useState<string>('');

  // 学员访谈：从班级档案导入
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importClassOptions, setImportClassOptions] = useState<string[]>([]);
  const [importSelectedClasses, setImportSelectedClasses] = useState<string[]>([]);
  const [importLoading, setImportLoading] = useState(false);

  // 根据 Tab 获取对应的 API endpoint
  const getApiEndpoint = (tab: string) => {
    switch (tab) {
      case '家长访谈':
        return 'parent-interview-record';
      case '毕业生家长访谈':
        return 'graduate-parent-interview-record';
      case '毕业生访谈':
        return 'graduate-interview-record';
      case '其他访谈':
        return 'other-interview-record';
      case '学员访谈':
      default:
        return 'student-interview-record';
    }
  };

  // 加载数据
  const loadData = async () => {
    if (!selectedCampus || !month) return;

    // 班主任筛选：当"学员访谈/家长访谈/毕业生家长访谈"未选择班主任时，表格不显示任何数据
    //（避免默认加载全量数据造成误解/误操作）
    const needHomeroomTeacher = ['学员访谈', '家长访谈', '毕业生家长访谈'].includes(activeTab);
    if (needHomeroomTeacher && !selectedHomeroomTeacher) {
      setDataSource([]);
      return;
    }

    // 在“学员访谈/家长访谈”Tab下生效
    // “其他访谈”也支持按班主任筛选（若未选择则不传参，沿用后端默认行为）
    const pageHomeroomTeacher = ['学员访谈', '家长访谈', '其他访谈', '毕业生访谈'].includes(activeTab)
      ? selectedHomeroomTeacher
      : '';

    setLoading(true);
    try {
      const endpoint = getApiEndpoint(activeTab);
      const params = new URLSearchParams({
        campus: selectedCampus,
        year: month.year().toString(),
        month: (month.month() + 1).toString(),
        ...(isGraduate ? {} : { type: activeTab }), // 仅学员访谈接口需要 type
        ...(pageHomeroomTeacher ? { homeroom_teacher: pageHomeroomTeacher } : {}),
      });
      const res = await fetch(`${buildApiUrl(`/teaching-quality/${endpoint}`)}?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const rows = (data.行列表 || []).map((r: any, idx: number) => {
        if (isParent || isGraduateParent || isOther) {
          return {
            key: String(idx + 1),
            serialNumber: r.序号 || idx + 1,
            studentName: r.姓名 || '',
            visitDate: r.访谈时间 || '',
            interviewLog: r.访谈记录 || '',
          } as InterviewRecord;
        }
        return {
          key: String(idx + 1),
          serialNumber: r.序号 || idx + 1,
          studentName: r.姓名 || '',
          className: r.班级 || '',
          counselor: r.咨询师 || '',
          education: r.学历 || '',
          hometown: r.籍贯 || '',
          enrollmentDate: r.入学时间 || '',
          visitDate: r.访谈时间 || '',
          interviewLog: r.访谈记录 || '',
        } as InterviewRecord;
      });
      setDataSource(rows);
    } catch (e: any) {
      message.error('加载失败: ' + (e?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 保存数据
  const saveData = async () => {
    if (!selectedCampus || !month) {
      message.warning('请选择神殿和年月');
      return;
    }
    setLoading(true);
    try {
      const endpoint = getApiEndpoint(activeTab);
      const base = {
        神殿名称: selectedCampus,
        年份: month.year(),
        月份: month.month() + 1,
        访谈类型: activeTab,
      } as any;

      const payload = (isParent || isGraduateParent)
        ? {
            ...base,
            班主任: selectedHomeroomTeacher || null, // 添加顶层班主任字段，确保只覆盖当前班主任的数据
            行列表: dataSource.map((r, i) => ({
              序号: i + 1,
              姓名: r.studentName,
              班主任: selectedHomeroomTeacher || null,
              // DatePicker 未选择时 visitDate 可能是 ''，统一转成 null
              访谈时间: (r.visitDate && String(r.visitDate).trim()) ? String(r.visitDate).trim() : null,
              访谈记录: r.interviewLog || '',
            })),
          }
        : {
            ...base,
            班主任: selectedHomeroomTeacher || null, // 添加顶层班主任字段，确保只覆盖当前班主任的数据
            行列表: dataSource.map((r, i) => ({
              序号: i + 1,
              姓名: r.studentName,
              班级: r.className,
              咨询师: r.counselor,
              班主任: selectedHomeroomTeacher || null,
              学历: r.education,
              籍贯: r.hometown,
              入学时间: r.enrollmentDate,
              // DatePicker 未选择时 visitDate 可能是 ''，统一转成 null
              访谈时间: (r.visitDate && String(r.visitDate).trim()) ? String(r.visitDate).trim() : null,
              访谈记录: r.interviewLog,
            })),
          };

      const res = await fetch(buildApiUrl(`/teaching-quality/${endpoint}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      message.success('保存成功');
      await loadData(); // 保存后自动刷新
    } catch (e: any) {
      message.error('保存失败: ' + (e?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCampus, month, activeTab, selectedHomeroomTeacher]);

  // 家长访谈：单元格渲染（姓名、访谈时间、访谈记录）
  const renderParentNameCell = (text: string, record: InterviewRecord) => (
    <Input
      value={text}
      onChange={(e) => {
        const v = e.target.value;
        setDataSource((prev) => prev.map((r) => (r.key === record.key ? { ...r, studentName: v } : r)));
      }}
    />
  );
  const renderParentDateCell = (record: InterviewRecord) => (
    <DatePicker
      value={record.visitDate ? dayjs(record.visitDate) : null}
      onChange={(d) => {
        const v = d ? d.format('YYYY-MM-DD') : '';
        setDataSource((prev) => prev.map((r) => (r.key === record.key ? { ...r, visitDate: v } : r)));
      }}
      style={{ width: '100%' }}
    />
  );
  const renderParentLogCell = (text: string, record: InterviewRecord) => (
    <TextArea
      value={text || ''}
      onChange={(e) => {
        const v = e.target.value;
        setDataSource((prev) => prev.map((r) => (r.key === record.key ? { ...r, interviewLog: v } : r)));
      }}
      autoSize={{ minRows: 1, maxRows: 4 }}
    />
  );

  // 按标签构建列
  const columns: ColumnsType<InterviewRecord> = (isParent || isGraduateParent || isOther)
    ? [
        { title: '序号', dataIndex: 'serialNumber', width: 80, align: 'center' },
        { title: '姓名', dataIndex: 'studentName', width: 140, align: 'center', render: (t, r) => renderParentNameCell(t as any, r) },
        { title: '访谈时间', dataIndex: 'visitDate', width: 150, align: 'center', render: (_t, r) => renderParentDateCell(r) },
        { title: '访谈记录', dataIndex: 'interviewLog', width: 400, render: (t, r) => renderParentLogCell(t as any, r) },
        {
          title: '操作', key: 'action', width: 120, align: 'center', fixed: 'right',
          render: (_, record) => (
            <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.key)}>
              <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          ),
        },
      ]
    : [
        { title: '序号', dataIndex: 'serialNumber', width: 80, align: 'center' },
        { title: '姓名', dataIndex: 'studentName', width: 120, align: 'center' },
        { title: '班级', dataIndex: 'className', width: 120, align: 'center' },
        { title: '咨询师', dataIndex: 'counselor', width: 120, align: 'center' },
        { title: '学历', dataIndex: 'education', width: 120, align: 'center' },
        { title: '籍贯', dataIndex: 'hometown', width: 150, align: 'center' },
        { title: '入学时间', dataIndex: 'enrollmentDate', width: 150, align: 'center' },
        { title: '访谈时间', dataIndex: 'visitDate', width: 150, align: 'center' },
        { title: '访谈记录', dataIndex: 'interviewLog', width: 400, render: (text) => <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{text}</pre> },
        {
          title: '操作', key: 'action', width: 180, align: 'center', fixed: 'right',
          render: (_, record) => (
            <Space>
              <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
              <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.key)}>
                <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            </Space>
          ),
        },
      ];

  const handleAdd = () => {
    if (isParent || isGraduateParent) {
      const key = Date.now().toString();
      setDataSource(prev => [
        ...prev,
        { key, serialNumber: prev.length + 1, studentName: '', monthNotes: Array(12).fill('') },
      ]);
    } else {
      setEditingRecord(null);
      form.resetFields();
      setModalVisible(true);
    }
  };

  const handleEdit = (record: InterviewRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      enrollmentDate: record.enrollmentDate ? dayjs(record.enrollmentDate) : null,
      visitDate: record.visitDate ? dayjs(record.visitDate) : null,
    });
    setModalVisible(true);
  };

  const handleDelete = (key: string) => {
    setDataSource(dataSource.filter(item => item.key !== key).map((item, i) => ({ ...item, serialNumber: i + 1 })));
  };

  const dedupeKeyOfRecord = (r: InterviewRecord) =>
    `${(r.studentName || '').trim()}__${(r.className || '').trim()}`;

  const openImportModal = async () => {
    if (!['学员访谈', '家长访谈', '毕业生家长访谈'].includes(activeTab)) return;
    if (!selectedCampus) {
      message.warning('请先选择神殿');
      return;
    }
    if (!selectedHomeroomTeacher) {
      message.warning('请先选择班主任');
      return;
    }

    setImportLoading(true);
    try {
      // 从配置中心班级管理读取：筛选“当前神殿 + 班主任”
      const classes = await fetchClasses({ campus_name: selectedCampus });
      const matched = (classes || [])
        .filter((c: any) => (c.homeroom_teacher_name || '') === selectedHomeroomTeacher)
        .map((c: any) => c.class_name)
        .filter(Boolean);

      const unique = Array.from(new Set(matched)).sort();

      if (unique.length === 0) {
        message.warning('该班主任在配置中心未配置任何班级');
        setImportClassOptions([]);
        setImportSelectedClasses([]);
        setImportModalOpen(true);
        return;
      }

      setImportClassOptions(unique);
      setImportSelectedClasses(unique); // 默认全选
      setImportModalOpen(true);
    } catch (e: any) {
      console.error(e);
      message.error('读取配置中心班级失败: ' + (e?.message || '未知错误'));
    } finally {
      setImportLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!['学员访谈', '家长访谈', '毕业生家长访谈'].includes(activeTab)) return;
    if (!selectedCampus || !month) {
      message.warning('请先选择神殿和年月');
      return;
    }
    if (!selectedHomeroomTeacher) {
      message.warning('请先选择班主任');
      return;
    }
    if (importSelectedClasses.length === 0) {
      message.warning('请至少选择一个班级');
      return;
    }

    setImportLoading(true);
    try {
      // 1) 拉取所选班级的班级档案（并行）
      const results = await Promise.all(
        importSelectedClasses.map(async (className) => {
          const rows = await loadClassFileData(className, selectedCampus);
          return { className, rows };
        }),
      );

      // 2) 构造导入行：
      // - 学员访谈：姓名/班级/咨询师/学历/籍贯/入学时间
      // - 家长访谈：姓名（同学员姓名即可）、访谈时间/记录置空
      // - 毕业生家长访谈：只导入学员状态为"毕业"的学生
      const existing = new Set(dataSource.map(dedupeKeyOfRecord));
      const toAdd: InterviewRecord[] = [];

      for (const { className, rows } of results) {
        (rows || []).forEach((stu: ClassFileRecordRow) => {
          const name = (stu as any).name || '';
          if (!name.trim()) return;
          
          // 毕业生家长访谈：只导入学员状态为"毕业"的学生
          if (activeTab === '毕业生家长访谈') {
            const studentStatus = (stu as any).studentStatus || '';
            if (studentStatus !== '毕业') {
              return; // 跳过非毕业状态的学生
            }
          }

          const base: InterviewRecord = {
            key: `${Date.now()}_${Math.random()}`,
            serialNumber: 0, // 稍后统一重排
            studentName: name,
            className,
          };

          const record: InterviewRecord =
            (activeTab === '家长访谈' || activeTab === '毕业生家长访谈')
              ? {
                  ...base,
                  visitDate: '',
                  interviewLog: '',
                }
              : {
                  ...base,
                  counselor: (stu as any).consultant || '',
                  education: (stu as any).education || '',
                  hometown: (stu as any).address || '',
                  enrollmentDate: (stu as any).enrollmentDate || '',
                  visitDate: '',
                  interviewLog: '',
                };

          const k = dedupeKeyOfRecord(record);
          if (existing.has(k)) return; // 已存在则跳过
          existing.add(k);
          toAdd.push(record);
        });
      }

      if (toAdd.length === 0) {
        message.info('没有可导入的新学员（已全部存在或班级档案为空）');
        setImportModalOpen(false);
        return;
      }

      // 3) 合并并重排序号
      const merged = [...dataSource, ...toAdd].map((r, idx) => ({
        ...r,
        serialNumber: idx + 1,
        key: r.key || String(idx + 1),
      }));

      setDataSource(merged);
      setImportModalOpen(false);
      message.success(`已导入 ${toAdd.length} 条学员记录（重复已自动跳过）`);

      // 4) 自动保存
      await (async () => {
        setLoading(true);
        try {
          const endpoint = getApiEndpoint(activeTab);
          const base = {
            神殿名称: selectedCampus,
            年份: month.year(),
            月份: month.month() + 1,
            访谈类型: activeTab,
          } as any;

          const payload =
            (activeTab === '家长访谈' || activeTab === '毕业生家长访谈')
              ? {
                  ...base,
                  班主任: selectedHomeroomTeacher || null, // 添加顶层班主任字段
                  行列表: merged.map((r, i) => ({
                    序号: i + 1,
                    姓名: r.studentName,
                    班主任: selectedHomeroomTeacher || null,
                    访谈时间: (r.visitDate && String(r.visitDate).trim()) ? String(r.visitDate).trim() : null,
                    访谈记录: r.interviewLog || '',
                  })),
                }
              : {
                  ...base,
                  班主任: selectedHomeroomTeacher || null, // 添加顶层班主任字段
                  行列表: merged.map((r, i) => ({
                    序号: i + 1,
                    姓名: r.studentName,
                    班级: r.className,
                    咨询师: r.counselor,
                    班主任: selectedHomeroomTeacher || null,
                    学历: r.education,
                    籍贯: r.hometown,
                    入学时间: r.enrollmentDate,
                    访谈时间: (r.visitDate && String(r.visitDate).trim()) ? String(r.visitDate).trim() : null,
                    访谈记录: r.interviewLog,
                  })),
                };

          const res = await fetch(buildApiUrl(`/teaching-quality/${endpoint}`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(await res.text());
          message.success('导入后已自动保存');
          await loadData();
        } catch (e: any) {
          console.error(e);
          message.error('自动保存失败: ' + (e?.message || '未知错误'));
        } finally {
          setLoading(false);
        }
      })();
    } catch (e: any) {
      console.error(e);
      message.error('导入失败: ' + (e?.message || '未知错误'));
    } finally {
      setImportLoading(false);
    }
  };

  const handleSaveRow = async () => {
    try {
      const values = await form.validateFields();
      const newRecord: Omit<InterviewRecord, 'key' | 'serialNumber'> = {
        studentName: values.studentName,
        className: values.className,
        counselor: values.counselor,
        education: values.education,
        hometown: values.hometown,
        enrollmentDate: values.enrollmentDate ? (values.enrollmentDate as Dayjs).format('YYYY-MM-DD') : '',
        visitDate: values.visitDate ? (values.visitDate as Dayjs).format('YYYY-MM-DD') : '',
        interviewLog: values.interviewLog,
      };

      if (editingRecord) {
        setDataSource(dataSource.map(item => item.key === editingRecord.key ? { ...editingRecord, ...newRecord } : item));
      } else {
        const key = Date.now().toString();
        setDataSource([...dataSource, { ...newRecord, key, serialNumber: dataSource.length + 1 }]);
      }
      setModalVisible(false);
    } catch (e) {
      console.error('Validation failed:', e);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title={`${selectedCampus || 'XX'}神殿教化司学员访谈记录表`}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: '学员访谈', label: '学员访谈' },
            { key: '家长访谈', label: '家长访谈' },
            { key: '毕业生家长访谈', label: '毕业生家长访谈' },
            { key: '毕业生访谈', label: '毕业生访谈' },
            { key: '其他访谈', label: '其他访谈' },
          ]}
        />

        <div style={{ marginTop: 16, marginBottom: 16 }}>
          <Space wrap>
            <Select value={selectedCampus} onChange={setSelectedCampus} style={{ width: 150 }}>
              {campusList.map(c => <Option key={c.id} value={c.name}>{c.name}</Option>)}
            </Select>
            <DatePicker picker="month" value={month} onChange={setMonth} />
            {['学员访谈', '家长访谈', '毕业生家长访谈', '毕业生访谈', '其他访谈'].includes(activeTab) ? (
              <HomeroomTeacherSelect
                campusName={selectedCampus}
                value={selectedHomeroomTeacher}
                onChange={(v) => setSelectedHomeroomTeacher(v)}
                placeholder="班主任（配置中心）"
                allowClear
              />
            ) : null}
            <Button icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
            {['学员访谈', '家长访谈'].includes(activeTab) ? (
              <Button onClick={openImportModal} loading={importLoading}>
                从班级档案导入
              </Button>
            ) : null}
            <Button type="primary" icon={<SaveOutlined />} onClick={saveData} loading={loading}>保存</Button>
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>刷新</Button>
            <Button icon={<DownloadOutlined />} onClick={() => message.info('导出功能开发中...')}>导出</Button>
          </Space>
        </div>

        {isGraduateParent ? (
          <GraduateParentInterviewTable
            dataSource={dataSource as any}
            loading={loading}
            onDataSourceChange={(data) => setDataSource(data as any)}
            onDelete={handleDelete}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            bordered
            size="small"
            pagination={{ showTotal: (total) => `共 ${total} 条` }}
            scroll={{ x: 1500 }}
          />
        )}
      </Card>

      <Modal
        title={editingRecord ? '编辑访谈记录' : '新增访谈记录'}
        open={modalVisible}
        onOk={handleSaveRow}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical" initialValues={{ enrollmentDate: dayjs() }}>
          <Form.Item name="studentName" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="className" label="班级"><Input /></Form.Item>
          <Form.Item name="counselor" label="咨询师"><Input /></Form.Item>
          <Form.Item name="education" label="学历"><Input /></Form.Item>
          <Form.Item name="hometown" label="籍贯"><Input /></Form.Item>
          <Form.Item name="enrollmentDate" label="入学时间"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="visitDate" label="访谈时间"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="interviewLog" label="访谈记录"><TextArea rows={5} /></Form.Item>
        </Form>
      </Modal>

      <Modal
        title="选择要导入的班级"
        open={importModalOpen}
        onOk={handleConfirmImport}
        onCancel={() => setImportModalOpen(false)}
        okText="开始导入"
        cancelText="取消"
        confirmLoading={importLoading}
        width={520}
      >
        <div style={{ marginBottom: 12, color: '#666' }}>
          当前神殿：{selectedCampus || '-'}；班主任：{selectedHomeroomTeacher || '-'}。
          <br />
          说明：将从所选班级的“班级档案”读取学员信息，重复（同姓名+同班级）会自动跳过，并在导入后自动保存。
        </div>
        {importClassOptions.length === 0 ? (
          <div style={{ color: '#999' }}>暂无可导入班级</div>
        ) : (
          <Checkbox.Group
            style={{ width: '100%' }}
            value={importSelectedClasses}
            onChange={(vals) => setImportSelectedClasses(vals as string[])}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {importClassOptions.map((cls) => (
                <Checkbox key={cls} value={cls}>
                  {cls}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        )}
      </Modal>
    </div>
  );
};

export default InterviewRecordPage;
