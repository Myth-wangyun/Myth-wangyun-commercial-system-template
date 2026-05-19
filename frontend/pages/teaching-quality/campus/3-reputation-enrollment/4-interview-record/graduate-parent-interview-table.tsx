/**
 * 毕业生家长访谈记录表组件
 * 参考家长访谈的实现，但针对毕业生的家长
 */

import React from 'react';
import { Table, Input, DatePicker, Button, Popconfirm, Space } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';

const { TextArea } = Input;

// 毕业生家长访谈记录接口
export interface GraduateParentInterviewRecord {
  key: string;
  serialNumber: number; // 序号
  studentName: string; // 学员姓名（毕业生姓名）
  visitDate: string; // 访谈时间
  interviewLog: string; // 访谈记录
}

interface GraduateParentInterviewTableProps {
  dataSource: GraduateParentInterviewRecord[];
  loading: boolean;
  onDataSourceChange: (data: GraduateParentInterviewRecord[]) => void;
  onDelete: (key: string) => void;
}

const GraduateParentInterviewTable: React.FC<GraduateParentInterviewTableProps> = ({
  dataSource,
  loading,
  onDataSourceChange,
  onDelete,
}) => {
  // 渲染姓名单元格（可编辑）
  const renderNameCell = (text: string, record: GraduateParentInterviewRecord) => (
    <Input
      value={text}
      onChange={(e) => {
        const v = e.target.value;
        onDataSourceChange(
          dataSource.map((r) => (r.key === record.key ? { ...r, studentName: v } : r))
        );
      }}
    />
  );

  // 渲染访谈时间单元格（日期选择器）
  const renderDateCell = (record: GraduateParentInterviewRecord) => (
    <DatePicker
      value={record.visitDate ? dayjs(record.visitDate) : null}
      onChange={(d) => {
        const v = d ? d.format('YYYY-MM-DD') : '';
        onDataSourceChange(
          dataSource.map((r) => (r.key === record.key ? { ...r, visitDate: v } : r))
        );
      }}
      style={{ width: '100%' }}
    />
  );

  // 渲染访谈记录单元格（文本域）
  const renderLogCell = (text: string, record: GraduateParentInterviewRecord) => (
    <TextArea
      value={text || ''}
      onChange={(e) => {
        const v = e.target.value;
        onDataSourceChange(
          dataSource.map((r) => (r.key === record.key ? { ...r, interviewLog: v } : r))
        );
      }}
      autoSize={{ minRows: 1, maxRows: 4 }}
    />
  );

  // 表格列配置
  const columns: ColumnsType<GraduateParentInterviewRecord> = [
    { title: '序号', dataIndex: 'serialNumber', width: 80, align: 'center' },
    {
      title: '学员姓名',
      dataIndex: 'studentName',
      width: 140,
      align: 'center',
      render: (t, r) => renderNameCell(t as any, r),
    },
    {
      title: '访谈时间',
      dataIndex: 'visitDate',
      width: 150,
      align: 'center',
      render: (_t, r) => renderDateCell(r),
    },
    {
      title: '访谈记录',
      dataIndex: 'interviewLog',
      width: 400,
      render: (t, r) => renderLogCell(t as any, r),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Popconfirm title="确定删除吗？" onConfirm={() => onDelete(record.key)}>
          <Button type="link" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      bordered
      size="small"
      pagination={{ showTotal: (total) => `共 ${total} 条` }}
      scroll={{ x: 1500 }}
      rowKey="key"
    />
  );
};

export default GraduateParentInterviewTable;
