/**
 * Tab3: 03入职离职明细表
 * 记录每个员工的入职和离职详细信息
 */

import React, { useState, useEffect, useCallback } from 'react';
import { App, Table, Button, Input, DatePicker, Space, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import api from '@/services/api';

const { TextArea } = Input;

// 入职离职明细行类型
interface DetailRow {
  key: string;
  序号: number;
  记录ID?: number;
  板块: string;
  岗位: string;
  类别: string;
  姓名: string;
  入职时间: string;
  离职时间: string;
  备注: string;
}

interface Tab3EntryExitDetailProps {
  year: string;
}

const Tab3EntryExitDetail: React.FC<Tab3EntryExitDetailProps> = ({ year }) => {
  const { message, notification } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dataSource, setDataSource] = useState<DetailRow[]>([]);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/consult/entry-exit-detail/${year}`);
      if (response.data && response.data.data) {
        const records = response.data.data;
        setDataSource(
          records.map((record: any, index: number) => ({
            key: record.记录ID ? String(record.记录ID) : `new-${index}`,
            序号: index + 1,
            记录ID: record.记录ID,
            板块: record.板块 || '',
            岗位: record.岗位 || '',
            类别: record.类别 || '',
            姓名: record.姓名 || '',
            入职时间: record.入职时间 || '',
            离职时间: record.离职时间 || '',
            备注: record.备注 || '',
          }))
        );
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // 没有数据，初始化空表格
        setDataSource([]);
      } else {
        message.error('加载数据失败');
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 添加新行
  const handleAddRow = () => {
    const newRow: DetailRow = {
      key: `new-${Date.now()}`,
      序号: dataSource.length + 1,
      板块: '',
      岗位: '',
      类别: '',
      姓名: '',
      入职时间: '',
      离职时间: '',
      备注: '',
    };
    setDataSource([...dataSource, newRow]);
  };

  // 删除行
  const handleDeleteRow = (key: string) => {
    const newData = dataSource
      .filter((row) => row.key !== key)
      .map((row, index) => ({ ...row, 序号: index + 1 }));
    setDataSource(newData);
  };

  // 更新字段值
  const updateField = (key: string, field: keyof DetailRow, value: string) => {
    setDataSource((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    );
  };

  // 更新日期字段
  const updateDateField = (key: string, field: '入职时间' | '离职时间', date: Dayjs | null) => {
    setDataSource((prev) =>
      prev.map((row) =>
        row.key === key ? { ...row, [field]: date ? date.format('YYYY-MM-DD') : '' } : row
      )
    );
  };

  // 保存数据
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        年份: parseInt(year),
        明细列表: dataSource.map((row) => ({
          记录ID: row.记录ID,
          板块: row.板块,
          岗位: row.岗位,
          类别: row.类别,
          姓名: row.姓名,
          入职时间: row.入职时间,
          离职时间: row.离职时间,
          备注: row.备注,
        })),
      };

      await api.post(`/consult/entry-exit-detail/batch-save`, payload);
      notification.success({ message: '已保存', description: '明细记录保存成功', placement: 'topRight', duration: 3 });
      await loadData();
    } catch (error) {
      notification.error({ message: '保存失败', description: '请检查网络连接或联系管理员', placement: 'topRight', duration: 4 });
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // 定义表格列
  const columns: ColumnsType<DetailRow> = [
    {
      title: '序号',
      dataIndex: '序号',
      key: '序号',
      width: 60,
      align: 'center',
    },
    {
      title: '板块',
      dataIndex: '板块',
      key: '板块',
      width: 120,
      render: (val: string, record: DetailRow) => (
        <Input
          value={val}
          onChange={(e) => updateField(record.key, '板块', e.target.value)}
          size="small"
          placeholder="板块"
        />
      ),
    },
    {
      title: '岗位',
      dataIndex: '岗位',
      key: '岗位',
      width: 120,
      render: (val: string, record: DetailRow) => (
        <Input
          value={val}
          onChange={(e) => updateField(record.key, '岗位', e.target.value)}
          size="small"
          placeholder="岗位"
        />
      ),
    },
    {
      title: '类别',
      dataIndex: '类别',
      key: '类别',
      width: 100,
      render: (val: string, record: DetailRow) => (
        <Input
          value={val}
          onChange={(e) => updateField(record.key, '类别', e.target.value)}
          size="small"
          placeholder="类别"
        />
      ),
    },
    {
      title: '姓名',
      dataIndex: '姓名',
      key: '姓名',
      width: 100,
      render: (val: string, record: DetailRow) => (
        <Input
          value={val}
          onChange={(e) => updateField(record.key, '姓名', e.target.value)}
          size="small"
          placeholder="姓名"
        />
      ),
    },
    {
      title: '入职时间',
      dataIndex: '入职时间',
      key: '入职时间',
      width: 150,
      render: (val: string, record: DetailRow) => (
        <DatePicker
          value={val ? dayjs(val, 'YYYY-MM-DD') : null}
          onChange={(date) => updateDateField(record.key, '入职时间', date)}
          size="small"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '离职时间',
      dataIndex: '离职时间',
      key: '离职时间',
      width: 150,
      render: (val: string, record: DetailRow) => (
        <DatePicker
          value={val ? dayjs(val, 'YYYY-MM-DD') : null}
          onChange={(date) => updateDateField(record.key, '离职时间', date)}
          size="small"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '备注',
      dataIndex: '备注',
      key: '备注',
      width: 200,
      render: (val: string, record: DetailRow) => (
        <TextArea
          value={val}
          onChange={(e) => updateField(record.key, '备注', e.target.value)}
          size="small"
          placeholder="备注"
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_: any, record: DetailRow) => (
        <Popconfirm
          title="确定删除这条记录吗？"
          onConfirm={() => handleDeleteRow(record.key)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" danger size="small" icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="default" icon={<PlusOutlined />} onClick={handleAddRow}>
          添加记录
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
        >
          保存
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={false}
        bordered
        size="small"
        scroll={{ x: 1200 }}
      />
    </div>
  );
};

export default Tab3EntryExitDetail;
