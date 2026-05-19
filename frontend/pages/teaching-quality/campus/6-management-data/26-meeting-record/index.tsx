/**
 * 神殿教化司会议记录表页面（已接入后端 API）
 */

import React, { useState, useEffect } from 'react';
import { App,
  Card,
  Table,
  Button,
  Space,
  Select,
  Input,
  DatePicker,
} from 'antd';
import dayjs from 'dayjs';
import {
  ReloadOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useCampusStore } from '@/stores/campusStore';

const { Option } = Select;
const { TextArea } = Input;

import { buildApiUrl } from '@/utils/apiBase';

// 会议记录接口
interface MeetingRecord {
  key: string;
  time: string; // 时间
  location: string; // 地点
  speaker: string; // 主讲
  attendees: string; // 参与人
  agenda: string; // 议题
  problemsSolved: string; // 问题解决
  problemsPending: string; // 问题待解决
}

const CampusMeetingRecordPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore();
  const campuses = getAllCampuses();
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '');
  const [dataSource, setDataSource] = useState<MeetingRecord[]>([
    {
      key: '1',
      time: '',
      location: '',
      speaker: '',
      attendees: '',
      agenda: '',
      problemsSolved: '',
      problemsPending: '',
    },
  ]);
  const [editingKey, setEditingKey] = useState<string>('');
  const [editingField, setEditingField] = useState<string>('');

  // 从后端加载
  const loadData = async () => {
    if (!selectedCampus) {
      message.warning('请先选择神殿');
      return;
    }
    try {
      const res = await fetch(`${buildApiUrl('/teaching-quality/meeting-record')}?campus=${encodeURIComponent(selectedCampus)}`);
      if (!res.ok) throw new Error(await res.text());
      const data: { 神殿名称: string; 记录: Array<{ 时间: string; 地点: string; 主讲: string; 参与人: string; 议题: string; 问题解决: string; 问题待解决: string }>; } = await res.json();
      if (!data.记录 || data.记录.length === 0) {
        setDataSource([{ key: '1', time: '', location: '', speaker: '', attendees: '', agenda: '', problemsSolved: '', problemsPending: '' }]);
      } else {
        setDataSource(
          data.记录.map((r, idx) => ({
            key: String(idx + 1),
            time: r.时间 || '',
            location: r.地点 || '',
            speaker: r.主讲 || '',
            attendees: r.参与人 || '',
            agenda: r.议题 || '',
            problemsSolved: r.问题解决 || '',
            problemsPending: r.问题待解决 || '',
          }))
        );
      }
      message.success('已从后端加载');
    } catch (e: any) {
      console.error(e);
      message.error('加载失败：' + (e?.message || '未知错误'));
    }
  };

  // 保存到后端（覆盖写入当前神殿全部记录）
  const handleSave = async () => {
    if (!selectedCampus) {
      message.warning('请先选择神殿');
      return;
    }
    try {
      const payload = {
        神殿名称: selectedCampus,
        记录: dataSource.map(r => ({
          时间: r.time || '',
          地点: r.location || '',
          主讲: r.speaker || '',
          参与人: r.attendees || '',
          议题: r.agenda || '',
          问题解决: r.problemsSolved || '',
          问题待解决: r.problemsPending || '',
        })),
      };
      const res = await fetch(buildApiUrl('/teaching-quality/meeting-record'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      await loadData();
      message.success('保存成功');
    } catch (e: any) {
      console.error(e);
      message.error('保存失败：' + (e?.message || '未知错误'));
    }
  };

  useEffect(() => { if (selectedCampus) loadData(); }, [selectedCampus]);

  // 定义表格列
  const columns: ColumnsType<MeetingRecord> = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 150,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'time';
        if (isEditing) {
          return (
            <DatePicker
              value={value ? dayjs(value) : null}
              onChange={(date) => {
                const newDataSource = [...dataSource];
                const index = newDataSource.findIndex(item => item.key === record.key);
                if (index !== -1) {
                  newDataSource[index].time = date ? date.format('YYYY-MM-DD') : '';
                  setDataSource(newDataSource);
                }
                // 选择日期后自动关闭编辑状态
                setEditingKey('');
                setEditingField('');
              }}
              format="YYYY-MM-DD"
              placeholder="选择日期"
              autoFocus
              open
            />
          );
        }
        return (
          <div
            onClick={() => {
              setEditingKey(record.key);
              setEditingField('time');
            }}
            style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}
          >
            {value || ''}
          </div>
        );
      },
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'location';
        if (isEditing) {
          return (
            <Input
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource];
                const index = newDataSource.findIndex(item => item.key === record.key);
                if (index !== -1) {
                  newDataSource[index].location = e.target.value;
                  setDataSource(newDataSource);
                }
              }}
              onBlur={() => {
                setEditingKey('');
                setEditingField('');
              }}
              onPressEnter={() => {
                setEditingKey('');
                setEditingField('');
              }}
              autoFocus
            />
          );
        }
        return (
          <div
            onClick={() => {
              setEditingKey(record.key);
              setEditingField('location');
            }}
            style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}
          >
            {value || ''}
          </div>
        );
      },
    },
    {
      title: '主讲',
      dataIndex: 'speaker',
      key: 'speaker',
      width: 120,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'speaker';
        if (isEditing) {
          return (
            <Input
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource];
                const index = newDataSource.findIndex(item => item.key === record.key);
                if (index !== -1) {
                  newDataSource[index].speaker = e.target.value;
                  setDataSource(newDataSource);
                }
              }}
              onBlur={() => {
                setEditingKey('');
                setEditingField('');
              }}
              onPressEnter={() => {
                setEditingKey('');
                setEditingField('');
              }}
              autoFocus
            />
          );
        }
        return (
          <div
            onClick={() => {
              setEditingKey(record.key);
              setEditingField('speaker');
            }}
            style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}
          >
            {value || ''}
          </div>
        );
      },
    },
    {
      title: '参与人',
      dataIndex: 'attendees',
      key: 'attendees',
      width: 150,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'attendees';
        if (isEditing) {
          return (
            <Input
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource];
                const index = newDataSource.findIndex(item => item.key === record.key);
                if (index !== -1) {
                  newDataSource[index].attendees = e.target.value;
                  setDataSource(newDataSource);
                }
              }}
              onBlur={() => {
                setEditingKey('');
                setEditingField('');
              }}
              onPressEnter={() => {
                setEditingKey('');
                setEditingField('');
              }}
              autoFocus
            />
          );
        }
        return (
          <div
            onClick={() => {
              setEditingKey(record.key);
              setEditingField('attendees');
            }}
            style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}
          >
            {value || ''}
          </div>
        );
      },
    },
    {
      title: '议题',
      dataIndex: 'agenda',
      key: 'agenda',
      width: 200,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'agenda';
        if (isEditing) {
          return (
            <TextArea
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource];
                const index = newDataSource.findIndex(item => item.key === record.key);
                if (index !== -1) {
                  newDataSource[index].agenda = e.target.value;
                  setDataSource(newDataSource);
                }
              }}
              onBlur={() => {
                setEditingKey('');
                setEditingField('');
              }}
              autoSize={{ minRows: 2, maxRows: 4 }}
              autoFocus
            />
          );
        }
        return (
          <div
            onClick={() => {
              setEditingKey(record.key);
              setEditingField('agenda');
            }}
            style={{ cursor: 'pointer', minHeight: '32px', padding: '4px', whiteSpace: 'pre-wrap' }}
          >
            {value || ''}
          </div>
        );
      },
    },
    {
      title: '问题解决',
      dataIndex: 'problemsSolved',
      key: 'problemsSolved',
      width: 200,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'problemsSolved';
        if (isEditing) {
          return (
            <TextArea
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource];
                const index = newDataSource.findIndex(item => item.key === record.key);
                if (index !== -1) {
                  newDataSource[index].problemsSolved = e.target.value;
                  setDataSource(newDataSource);
                }
              }}
              onBlur={() => {
                setEditingKey('');
                setEditingField('');
              }}
              autoSize={{ minRows: 2, maxRows: 4 }}
              autoFocus
            />
          );
        }
        return (
          <div
            onClick={() => {
              setEditingKey(record.key);
              setEditingField('problemsSolved');
            }}
            style={{ cursor: 'pointer', minHeight: '32px', padding: '4px', whiteSpace: 'pre-wrap' }}
          >
            {value || ''}
          </div>
        );
      },
    },
    {
      title: '问题待解决',
      dataIndex: 'problemsPending',
      key: 'problemsPending',
      width: 200,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'problemsPending';
        if (isEditing) {
          return (
            <TextArea
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource];
                const index = newDataSource.findIndex(item => item.key === record.key);
                if (index !== -1) {
                  newDataSource[index].problemsPending = e.target.value;
                  setDataSource(newDataSource);
                }
              }}
              onBlur={() => {
                setEditingKey('');
                setEditingField('');
              }}
              autoSize={{ minRows: 2, maxRows: 4 }}
              autoFocus
            />
          );
        }
        return (
          <div
            onClick={() => {
              setEditingKey(record.key);
              setEditingField('problemsPending');
            }}
            style={{ cursor: 'pointer', minHeight: '32px', padding: '4px', whiteSpace: 'pre-wrap' }}
          >
            {value || ''}
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingKey(record.key);
              setEditingField('time');
            }}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              const newDataSource = dataSource.filter(item => item.key !== record.key);
              setDataSource(newDataSource);
              message.success('删除成功');
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 刷新数据
  const handleRefresh = () => { loadData(); };

  // 导出数据
  const handleExport = () => {
    message.info('导出功能开发中...');
  };

  // 添加新记录
  const handleAdd = () => {
    const newKey = `${Date.now()}`;
    const newRecord: MeetingRecord = {
      key: newKey,
      time: '',
      location: '',
      speaker: '',
      attendees: '',
      agenda: '',
      problemsSolved: '',
      problemsPending: '',
    };
    setDataSource([...dataSource, newRecord]);
    setEditingKey(newKey);
    setEditingField('time');
  };

  // 神殿选择变化
  const handleCampusChange = (value: string) => {
    setSelectedCampus(value);
    setCampus(value);
  };

  // 表头样式（浅绿色背景）
  const headerCellStyle: React.CSSProperties = {
    backgroundColor: '#d4edda',
    fontWeight: 'bold',
    textAlign: 'center',
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ 
        marginBottom: 24, 
        textAlign: 'center', 
        fontSize: '20px', 
        fontWeight: 'bold',
        padding: '16px',
        backgroundColor: '#fff1f0',
        borderRadius: 4,
        border: '1px solid #ffccc7',
      }}>
        <CalendarOutlined style={{ marginRight: 8 }} />
        会议记录表
      </div>

      <Card>
        {/* 操作栏 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <span>神殿：</span>
            <Select
              value={selectedCampus}
              onChange={handleCampusChange}
              style={{ width: 200 }}
              placeholder="请选择神殿"
            >
              {campuses.map(campus => (
                <Option key={campus.name} value={campus.name}>{campus.name}</Option>
              ))}
            </Select>
          </Space>
          <Space>
            <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>新增</Button>
            <Button icon={<SaveOutlined />} type="primary" ghost onClick={handleSave}>保存</Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>加载</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>
          </Space>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          scroll={{ x: 'max-content', y: 600 }}
          bordered
          size="small"
          rowKey="key"
          components={{
            header: {
              cell: (props: any) => {
                const mergedProps = {
                  ...props,
                  style: {
                    ...props.style,
                    ...headerCellStyle,
                  },
                };
                return <th {...mergedProps} />;
              },
            },
          }}
        />
        <style>{`
          .ant-table-thead > tr > th {
            background-color: #d4edda !important;
            font-weight: bold;
            text-align: center;
          }
          .ant-table-thead > tr:first-child > th {
            background-color: #d4edda !important;
          }
        `}</style>
      </Card>
    </div>
  );
};

export default CampusMeetingRecordPage;
