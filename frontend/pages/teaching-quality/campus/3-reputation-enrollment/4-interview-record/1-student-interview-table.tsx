/**
 * 学员访谈记录表
 */

import React, { useEffect, useMemo, useState } from 'react';
import { App,
  Card,
  Table,
  Button,
  Space,
  Select,
  Input,
  DatePicker,
  Modal,
} from 'antd';
import HomeroomTeacherSelect from '@/components/HomeroomTeacherSelect';
import {
  ReloadOutlined,
  DownloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useCampusStore } from '@/stores/campusStore';
import { useAuthStore } from '@/stores/authStore';
import { useConfigOptions } from '@/hooks/useConfigOptions';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/zh-cn';
import zhCN from 'antd/es/date-picker/locale/zh_CN';

dayjs.locale('zh-cn');

import { buildApiUrl } from '@/utils/apiBase';

const { Option } = Select;
const { TextArea } = Input;

interface InterviewNote {
  id: string;
  label: string;
  content: string;
}

interface StudentInterviewRecord {
  key: string;
  serialNumber: number; // 序号
  studentName: string; // 姓名
  majorName: string; // 专业名称
  className: string; // 班级名称
  counselor: string; // 咨询师
  homeroomTeacher: string; // 班主任（从配置中心读取）
  education: string; // 学历
  nativePlace: string; // 籍贯
  enrollmentDate: string; // 入学时间
  notes: InterviewNote[]; // 访谈记录
}

const StudentInterviewTable: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore();
  const { user } = useAuthStore();
  const campuses = getAllCampuses();

  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '');
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());
  const [selectedMonth, setSelectedMonth] = useState<number>(dayjs().month() + 1);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteTargetRecordKey, setNoteTargetRecordKey] = useState<string | null>(null);
  const [noteDate, setNoteDate] = useState<Dayjs | null>(dayjs());

  // 从配置中心获取专业、班级选项
  const { majors: majorOptions, classes: classOptions, loading: configLoading } = useConfigOptions({
    campusName: selectedCampus,
  });

  const [dataSource, setDataSource] = useState<StudentInterviewRecord[]>([
    {
      key: '1',
      serialNumber: 1,
      studentName: '赵文婷',
      majorName: '',
      className: '',
      counselor: '石军亮',
      education: '初中学历',
      nativePlace: '邯郸鸡泽',
      enrollmentDate: '2022-10-07',
      homeroomTeacher: '',
      notes: [
        {
          id: 'note-2022-10-24',
          label: '2022年10月24日',
          content:
            '学生表示能够听懂课堂内容，但偶尔注意力不集中。提醒其如果再出现走神情况就站着听课；同时了解班级情况，学生反馈上课聊天声音较大，希望能担任班委帮助管理班级。了解成考准备情况，目前已看完四个课程视频，整体态度积极。',
        },
      ],
    },
  ]);

  const handleCellChange = (
    key: string,
    field: keyof StudentInterviewRecord,
    value: string
  ) => {
    setDataSource(prev =>
      prev.map(item => (item.key === key ? { ...item, [field]: value } : item))
    );
  };

  const handleNoteContentChange = (recordKey: string, noteId: string, value: string) => {
    setDataSource(prev =>
      prev.map(item => {
        if (item.key !== recordKey) return item;
        return {
          ...item,
          notes: item.notes.map(note =>
            note.id === noteId ? { ...note, content: value } : note
          ),
        };
      })
    );
  };

  const renderEditableCell = (
    text: string,
    record: StudentInterviewRecord,
    field: keyof StudentInterviewRecord,
    isTextArea = false
  ) => {
    if (!editMode) {
      return <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div>;
    }

    if (isTextArea) {
      return (
        <TextArea
          value={text}
          onChange={e => handleCellChange(record.key, field, e.target.value)}
          autoSize={{ minRows: 2, maxRows: 6 }}
          style={{ fontSize: 12 }}
        />
      );
    }

    return (
      <Input
        value={text}
        onChange={e => handleCellChange(record.key, field, e.target.value)}
        style={{ fontSize: 12 }}
      />
    );
  };

  const handleRemoveNote = (recordKey: string, noteId: string) => {
    setDataSource(prev =>
      prev.map(item => {
        if (item.key !== recordKey) return item;
        return { ...item, notes: item.notes.filter(note => note.id !== noteId) };
      })
    );
    message.success('已删除该记录');
  };

  const renderNotesCell = (record: StudentInterviewRecord) => {
    if (!record.notes.length && !editMode) {
      return <div style={{ color: '#aaa' }}>-</div>;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {record.notes.map(note => (
          <div
            key={note.id}
            style={{
              border: '1px solid #f0c240',
              borderRadius: 4,
              padding: 8,
              background: '#fffdf0',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              <span>{note.label}</span>
              {editMode && (
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  danger
                  onClick={() => handleRemoveNote(record.key, note.id)}
                />
              )}
            </div>
            {editMode ? (
              <TextArea
                value={note.content}
                onChange={e => handleNoteContentChange(record.key, note.id, e.target.value)}
                autoSize={{ minRows: 6, maxRows: 12 }}
                style={{ fontSize: 12 }}
              />
            ) : (
              <div style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{note.content || '-'}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const fixedColumns = useMemo<ColumnsType<StudentInterviewRecord>>(
    () => [
      {
        title: '序号',
        dataIndex: 'serialNumber',
        key: 'serialNumber',
        width: 60,
        align: 'center',
        fixed: 'left',
      },
      {
        title: '姓名',
        dataIndex: 'studentName',
        key: 'studentName',
        width: 120,
        align: 'center',
        fixed: 'left',
        render: (text, record) => renderEditableCell(text, record, 'studentName'),
      },
      {
        title: '专业名称',
        dataIndex: 'majorName',
        key: 'majorName',
        width: 140,
        align: 'center',
        render: (text, record) =>
          editMode ? (
            <Select
              value={text || undefined}
              onChange={(value) => handleCellChange(record.key, 'majorName', value || '')}
              placeholder="请选择专业"
              allowClear
              showSearch
              style={{ width: '100%' }}
              options={majorOptions}
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              loading={configLoading}
            />
          ) : (
            <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div>
          ),
      },
      {
        title: '班级名称',
        dataIndex: 'className',
        key: 'className',
        width: 140,
        align: 'center',
        render: (text, record) =>
          editMode ? (
            <Select
              value={text || undefined}
              onChange={(value) => handleCellChange(record.key, 'className', value || '')}
              placeholder="请选择班级"
              allowClear
              showSearch
              style={{ width: '100%' }}
              options={classOptions}
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              loading={configLoading}
            />
          ) : (
            <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div>
          ),
      },
      {
        title: '咨询师',
        dataIndex: 'counselor',
        key: 'counselor',
        width: 120,
        align: 'center',
        render: (text, record) => renderEditableCell(text, record, 'counselor'),
      },
      {
        title: '班主任',
        dataIndex: 'homeroomTeacher',
        key: 'homeroomTeacher',
        width: 140,
        align: 'center',
        render: (text, record) =>
          editMode ? (
            <HomeroomTeacherSelect
              campusName={selectedCampus}
              value={text}
              onChange={(value) => handleCellChange(record.key, 'homeroomTeacher', value)}
              placeholder="请选择班主任（配置中心）"
              allowClear
            />
          ) : (
            <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div>
          ),
      },
      {
        title: '学历',
        dataIndex: 'education',
        key: 'education',
        width: 120,
        align: 'center',
        render: (text, record) => renderEditableCell(text, record, 'education'),
      },
      {
        title: '籍贯',
        dataIndex: 'nativePlace',
        key: 'nativePlace',
        width: 140,
        align: 'center',
        render: (text, record) => renderEditableCell(text, record, 'nativePlace'),
      },
      {
        title: '入学时间',
        dataIndex: 'enrollmentDate',
        key: 'enrollmentDate',
        width: 140,
        align: 'center',
        render: (text, record) => renderEditableCell(record.enrollmentDate, record, 'enrollmentDate'),
      },
    ],
    [editMode, majorOptions, classOptions, configLoading, selectedCampus]
  );

  const notesColumn = useMemo<ColumnsType<StudentInterviewRecord>>(
    () => [
      {
        title: '访谈记录',
        key: 'notes',
        width: 600,
        render: (_, record) => renderNotesCell(record),
      },
    ],
    [editMode, dataSource]
  );

  const tableColumns = useMemo<ColumnsType<StudentInterviewRecord>>(
    () => [
      ...fixedColumns,
      ...notesColumn,
      {
        title: '操作',
        key: 'action',
        width: 140,
        fixed: 'right',
        align: 'center',
        render: (_, record) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => openAddNoteModal(record.key)}
            >
              新增记录
            </Button>
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.key)}
            >
              删除
            </Button>
          </Space>
        ),
      },
    ],
    [fixedColumns, notesColumn]
  );

  const openAddNoteModal = (recordKey: string) => {
    setNoteTargetRecordKey(recordKey);
    setNoteDate(dayjs(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`));
    setNoteModalVisible(true);
  };

  const handleAddNoteConfirm = () => {
    if (!noteTargetRecordKey || !noteDate) {
      message.warning('请选择记录时间');
      return;
    }

    const label = noteDate.format('YYYY年M月D日');
    const newNote: InterviewNote = {
      id: `${noteTargetRecordKey}-${noteDate.valueOf()}`,
      label,
      content: '',
    };

    setDataSource(prev =>
      prev.map(item =>
        item.key === noteTargetRecordKey ? { ...item, notes: [...item.notes, newNote] } : item
      )
    );

    setEditMode(true);
    message.success(`已新增 ${label} 记录`);
    setNoteModalVisible(false);
    setNoteTargetRecordKey(null);
  };

  const handleCancelNoteModal = () => {
    setNoteModalVisible(false);
    setNoteTargetRecordKey(null);
  };

  const handleAdd = () => {
    const currentTeacher = user?.name || '';
    
    if (!currentTeacher) {
      message.error('无法获取当前用户信息，请重新登录');
      return;
    }

    // 计算当前班主任已有的记录数，新记录序号为 count + 1
    const currentTeacherRecords = dataSource.filter(item => item.homeroomTeacher === currentTeacher);
    const nextSerialNumber = currentTeacherRecords.length + 1;

    const newRecord: StudentInterviewRecord = {
      key: `${currentTeacher}-${Date.now()}`,
      serialNumber: nextSerialNumber,
      studentName: '',
      majorName: '',
      className: '',
      counselor: '',
      education: '',
      nativePlace: '',
      enrollmentDate: '',
      notes: [],
      homeroomTeacher: currentTeacher, // 自动填充当前用户为班主任
    };

    setDataSource(prev => [...prev, newRecord]);
    setEditMode(true);
    message.success('已添加新行');
  };

  const handleDelete = (key: string) => {
    const filtered = dataSource.filter(item => item.key !== key);
    
    // 按班主任分组重新编号
    const groupedByTeacher: { [key: string]: StudentInterviewRecord[] } = {};
    filtered.forEach(item => {
      const teacher = item.homeroomTeacher || '未分配';
      if (!groupedByTeacher[teacher]) {
        groupedByTeacher[teacher] = [];
      }
      groupedByTeacher[teacher].push(item);
    });

    // 重新编号
    const renumbered: StudentInterviewRecord[] = [];
    Object.keys(groupedByTeacher).sort().forEach(teacher => {
      groupedByTeacher[teacher].forEach((item, index) => {
        renumbered.push({
          ...item,
          serialNumber: index + 1,
        });
      });
    });

    setDataSource(renumbered);
    message.success('已删除');
  };

  const loadData = async () => {
    if (!selectedCampus || !selectedYear || !selectedMonth) return;
    setLoading(true);
    try {
      // 不传递班主任参数，加载所有班主任的数据
      const params = new URLSearchParams({
        campus: selectedCampus,
        year: String(selectedYear),
        month: String(selectedMonth),
        type: '学员访谈',
      });
      const res = await fetch(`${buildApiUrl('/teaching-quality/student-interview-record')}?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as {
        神殿名称: string;
        年份: number;
        月份: number;
        访谈类型: string;
        行列表: Array<{ 序号: number; 姓名?: string; 专业名称?: string; 班级?: string; 咨询师?: string; 班主任?: string; 学历?: string; 籍贯?: string; 入学时间?: string; 访谈记录?: string }>
      };

      // 按班主任分组，每个班主任的数据独立编号
      const groupedByTeacher: { [key: string]: any[] } = {};
      (data.行列表 || []).forEach(r => {
        const teacher = r.班主任 || '未分配';
        if (!groupedByTeacher[teacher]) {
          groupedByTeacher[teacher] = [];
        }
        groupedByTeacher[teacher].push(r);
      });

      // 重新组合数据，每个班主任的序号从1开始
      const rows: StudentInterviewRecord[] = [];
      Object.keys(groupedByTeacher).sort().forEach(teacher => {
        groupedByTeacher[teacher].forEach((r, index) => {
          rows.push({
            key: `${teacher}-${index + 1}`, // 使用班主任+序号作为唯一key
            serialNumber: index + 1, // 每个班主任的序号从1开始
            studentName: r.姓名 || '',
            majorName: r.专业名称 || '',
            className: r.班级 || '',
            counselor: r.咨询师 || '',
            homeroomTeacher: teacher,
            education: r.学历 || '',
            nativePlace: r.籍贯 || '',
            enrollmentDate: r.入学时间 || '',
            notes: r.访谈记录 ? [{ id: `db-${teacher}-${index + 1}`, label: '数据库记录', content: r.访谈记录 }] : [],
          });
        });
      });

      setDataSource(rows);
    } catch (e: any) {
      console.error(e);
      message.error('加载数据失败: ' + (e?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCampus, selectedYear, selectedMonth]);

  const handleRefresh = () => {
    loadData();
    message.success('数据已刷新');
  };

  const handleExport = () => {
    message.info('导出功能开发中...');
  };

  const handleSave = async () => {
    if (!selectedCampus || !selectedYear || !selectedMonth) {
      message.error('请选择神殿、年份和月份');
      return;
    }

    // 获取当前用户姓名作为班主任标识
    const currentTeacher = user?.name || '';
    
    if (!currentTeacher) {
      message.error('无法获取当前用户信息，请重新登录');
      return;
    }

    setLoading(true);
    try {
      // 只保存当前班主任的数据
      const teacherData = dataSource.filter(item => item.homeroomTeacher === currentTeacher);
      
      if (teacherData.length === 0) {
        message.warning('没有属于您的访谈记录需要保存');
        setEditMode(false);
        setLoading(false);
        return;
      }

      // 重新编号：每个班主任的序号从1开始独立编号
      const payload = {
        神殿名称: selectedCampus,
        年份: selectedYear,
        月份: selectedMonth,
        访谈类型: '学员访谈',
        班主任: currentTeacher, // 传递班主任参数，确保只覆盖当前班主任的数据
        行列表: teacherData.map((item, index) => ({
          序号: index + 1, // 每个班主任的序号从1开始独立编号
          姓名: item.studentName,
          专业名称: item.majorName,
          班级: item.className,
          咨询师: item.counselor,
          班主任: item.homeroomTeacher,
          学历: item.education,
          籍贯: item.nativePlace,
          入学时间: item.enrollmentDate,
          访谈记录: item.notes.map(n => `${n.label}\n${n.content}`).join('\n\n'),
        })),
      };

      const res = await fetch(`${buildApiUrl('/teaching-quality/student-interview-record')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || '保存失败');
      }

      message.success('保存成功');
      setEditMode(false);
      // 重新加载数据以显示所有班主任的记录
      await loadData();
    } catch (e: any) {
      console.error(e);
      message.error('保存失败: ' + (e?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    setEditMode(prev => !prev);
  };

  return (
    <Card
      title={`${selectedCampus || 'XX神殿'}学员访谈记录表`}
      extra={
        <Space>
          <Select
            style={{ width: 160 }}
            value={selectedCampus}
            onChange={setSelectedCampus}
            placeholder="选择神殿"
          >
            {campuses.map(campus => (
              <Option key={campus.id} value={campus.name}>
                {campus.name}
              </Option>
            ))}
          </Select>
          <Select style={{ width: 120 }} value={selectedYear} onChange={setSelectedYear}>
            <Option value={2023}>2023年</Option>
            <Option value={2024}>2024年</Option>
            <Option value={2025}>2025年</Option>
          </Select>
          <Select style={{ width: 100 }} value={selectedMonth} onChange={setSelectedMonth}>
            {Array.from({ length: 12 }, (_, i) => (
              <Option key={i + 1} value={i + 1}>
                {i + 1}月
              </Option>
            ))}
          </Select>
          <Button type="dashed" icon={<PlusOutlined />} onClick={handleAdd}>
            添加
          </Button>
          {editMode ? (
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
              保存
            </Button>
          ) : (
            <Button icon={<EditOutlined />} onClick={handleEditToggle}>
              编辑
            </Button>
          )}
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
            刷新
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出
          </Button>
        </Space>
      }
    >
      <Table
        columns={tableColumns}
        dataSource={dataSource}
        loading={loading}
        pagination={false}
        bordered
        scroll={{ x: 'max-content' }}
        size="small"
        rowKey="key"
      />

      <style>{`
        .ant-table-cell {
          padding: 8px 4px !important;
          font-size: 12px;
        }
      `}</style>

      <Modal
        title="新增访谈记录"
        open={noteModalVisible}
        onOk={handleAddNoteConfirm}
        onCancel={handleCancelNoteModal}
        okText="确定"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <span>请选择记录时间</span>
          <DatePicker
            value={noteDate}
            onChange={value => setNoteDate(value)}
            style={{ width: '100%' }}
            format="YYYY年M月D日"
            locale={zhCN}
          />
          <div style={{ fontSize: 12, color: '#888' }}>
            将为当前学员新增 {noteDate?.format('YYYY年M月D日') || ''} 的访谈记录。
          </div>
        </Space>
      </Modal>
    </Card>
  );
};

export default StudentInterviewTable;
