//学术->最高议事厅->神殿 题库编写汇总表 - 支持动态列
import React, { useMemo, useState, useEffect } from 'react';
import { App, Card, Table, Typography, Space, Button, InputNumber, Tag, Select, Input, Modal, Spin, Popconfirm } from 'antd';
import { DownloadOutlined, ReloadOutlined, SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useCampusStore } from '@/stores/campusStore';
import CampusSelector from '@/components/common/CampusSelector';
import api from '@/services/api';

const { Title, Text } = Typography;

interface ColumnConfig {
  key: string;
  label: string;
}

interface RowData {
  campus: string;
  data: Record<string, number>;
}

interface QuestionbankWritingRecord {
  id: string;
  serialNumber: number;
  campus: string;
  [key: string]: string | number; // 动态字段
}

const QuestionbankWritingPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const campusLabel = currentCampus || '测试神殿';
  
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [recordId, setRecordId] = useState<number | null>(null);
  const [dynamicColumns, setDynamicColumns] = useState<ColumnConfig[]>([]);
  const [data, setData] = useState<QuestionbankWritingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addColumnModalOpen, setAddColumnModalOpen] = useState(false);
  const [newColumnLabel, setNewColumnLabel] = useState('');

  // 加载数据
  useEffect(() => {
    loadData();
  }, [year, campusLabel]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/questionbank-writing-summary/by-year/${year}`);
      const { id, columns, rows } = res.data;
      
      setRecordId(id);
      setDynamicColumns(columns || []);
      
      // 只显示当前神殿的数据（单行）
      const row = rows?.find((r: RowData) => r.campus === campusLabel);
      const rowData = row?.data || {};
      
      // 构建单行记录
      const record: QuestionbankWritingRecord = {
        id: 'campus-1',
        serialNumber: 1,
        campus: campusLabel,
      };
      
      // 添加每列的新编和修改数据
      (columns || []).forEach((col: ColumnConfig) => {
        record[`${col.key}_new`] = rowData[`${col.key}_new`] || 0;
        record[`${col.key}_edit`] = rowData[`${col.key}_edit`] || 0;
      });
      
      setData([record]);
    } catch (error) {
      console.error('[题库编写汇总] 加载数据失败:', error);
      // 使用默认空数据
      const defaultColumns = [
        { key: 'network', label: '网络云运维' },
        { key: 'ai', label: '人工智能' },
        { key: 'aigc', label: 'AIGC' },
        { key: 'media', label: 'AI数媒' },
      ];
      setDynamicColumns(defaultColumns);
      setData([{
        id: 'campus-1',
        serialNumber: 1,
        campus: campusLabel,
        network_new: 0, network_edit: 0,
        ai_new: 0, ai_edit: 0,
        aigc_new: 0, aigc_edit: 0,
        media_new: 0, media_edit: 0,
      }]);
    } finally {
      setLoading(false);
    }
  };

  // 保存数据 - 需要获取完整数据后更新当前神殿的行
  const saveData = async () => {
    setSaving(true);
    try {
      // 先获取完整数据
      let existingColumns = dynamicColumns;
      let existingRows: RowData[] = [];
      
      try {
        const res = await api.get(`/questionbank-writing-summary/by-year/${year}`);
        existingColumns = res.data.columns || dynamicColumns;
        existingRows = res.data.rows || [];
      } catch {
        // 如果没有数据，使用当前columns
      }
      
      // 更新当前神殿的行数据
      const currentRecord = data[0];
      const rowData: Record<string, number> = {};
      dynamicColumns.forEach(col => {
        rowData[`${col.key}_new`] = Number(currentRecord[`${col.key}_new`]) || 0;
        rowData[`${col.key}_edit`] = Number(currentRecord[`${col.key}_edit`]) || 0;
      });
      
      // 构建新的rows数组
      const rowExists = existingRows.find((r: RowData) => r.campus === campusLabel);
      let newRows: RowData[];
      
      if (rowExists) {
        newRows = existingRows.map((row: RowData) => {
          if (row.campus === campusLabel) {
            return { campus: campusLabel, data: rowData };
          }
          return row;
        });
      } else {
        newRows = [...existingRows, { campus: campusLabel, data: rowData }];
      }

      await api.post('/questionbank-writing-summary/', {
        年份: year,
        columns: dynamicColumns,
        rows: newRows,
      });
      
      message.success('保存成功');
      loadData();
    } catch (error) {
      console.error('[题库编写汇总] 保存失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 添加列
  const handleAddColumn = async () => {
    if (!newColumnLabel.trim()) {
      message.warning('请输入列名称');
      return;
    }
    
    const key = `col_${Date.now()}`;
    const newCol: ColumnConfig = { key, label: newColumnLabel.trim() };
    
    setDynamicColumns(prev => [...prev, newCol]);
    setData(prev => prev.map(record => ({
      ...record,
      [`${key}_new`]: 0,
      [`${key}_edit`]: 0,
    })));
    
    setNewColumnLabel('');
    setAddColumnModalOpen(false);
    message.success('列已添加，请点击保存按钮保存更改');
  };

  // 删除列
  const handleRemoveColumn = (key: string) => {
    setDynamicColumns(prev => prev.filter(col => col.key !== key));
    setData(prev => prev.map(record => {
      const newRecord = { ...record };
      delete newRecord[`${key}_new`];
      delete newRecord[`${key}_edit`];
      return newRecord;
    }));
    message.success('列已删除，请点击保存按钮保存更改');
  };

  // 计算合计
  const computeTotals = (record: QuestionbankWritingRecord) => {
    let totalNew = 0;
    let totalEdit = 0;
    dynamicColumns.forEach(col => {
      totalNew += Number(record[`${col.key}_new`]) || 0;
      totalEdit += Number(record[`${col.key}_edit`]) || 0;
    });
    return { totalNew, totalEdit };
  };

  const onChange = (id: string, key: string, v: number | null) => {
    setData(prev => prev.map(x => x.id === id ? { ...x, [key]: Number(v || 0) } : x));
  };

  // 动态生成表格列
  const tableColumns: ColumnsType<QuestionbankWritingRecord> = useMemo(() => {
    const cols: ColumnsType<QuestionbankWritingRecord> = [
      {
        title: '序号',
        dataIndex: 'serialNumber',
        key: 'serialNumber',
        width: 60,
        align: 'center',
        onHeaderCell: () => ({ style: { backgroundColor: '#e6f7ff' } }),
      },
      {
        title: '神殿',
        dataIndex: 'campus',
        key: 'campus',
        width: 100,
        align: 'center',
        onHeaderCell: () => ({ style: { backgroundColor: '#e6f7ff' } }),
      },
    ];

    // 添加动态列
    dynamicColumns.forEach(col => {
      cols.push({
        title: (
          <Space>
            {col.label}
            <Popconfirm
              title="确定删除此列？"
              onConfirm={() => handleRemoveColumn(col.key)}
              okText="确定"
              cancelText="取消"
            >
              <DeleteOutlined style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 12 }} />
            </Popconfirm>
          </Space>
        ),
        align: 'center' as const,
        children: [
          {
            title: '新编',
            dataIndex: `${col.key}_new`,
            key: `${col.key}_new`,
            width: 100,
            align: 'center' as const,
            render: (_: unknown, r: QuestionbankWritingRecord) => (
              <InputNumber
                min={0}
                value={r[`${col.key}_new`] as number}
                onChange={v => onChange(r.id, `${col.key}_new`, v)}
                className="centered-input"
                style={{ width: '100%' }}
                bordered={false}
              />
            ),
            onHeaderCell: () => ({ style: { backgroundColor: '#e6f7ff' } }),
          },
          {
            title: '修改',
            dataIndex: `${col.key}_edit`,
            key: `${col.key}_edit`,
            width: 100,
            align: 'center' as const,
            render: (_: unknown, r: QuestionbankWritingRecord) => (
              <InputNumber
                min={0}
                value={r[`${col.key}_edit`] as number}
                onChange={v => onChange(r.id, `${col.key}_edit`, v)}
                className="centered-input"
                style={{ width: '100%' }}
                bordered={false}
              />
            ),
            onHeaderCell: () => ({ style: { backgroundColor: '#e6f7ff' } }),
          },
        ],
        onHeaderCell: () => ({ style: { backgroundColor: '#fffbe6' } }),
      });
    });

    // 合计列
    cols.push({
      title: '合计',
      align: 'center' as const,
      children: [
        {
          title: '新编',
          key: 'total_new',
          width: 80,
          align: 'center' as const,
          render: (_: unknown, r: QuestionbankWritingRecord) => <Tag color="blue">{computeTotals(r).totalNew}</Tag>,
          onHeaderCell: () => ({ style: { backgroundColor: '#e6f7ff' } }),
        },
        {
          title: '修改',
          key: 'total_edit',
          width: 80,
          align: 'center' as const,
          render: (_: unknown, r: QuestionbankWritingRecord) => <Tag color="geekblue">{computeTotals(r).totalEdit}</Tag>,
          onHeaderCell: () => ({ style: { backgroundColor: '#e6f7ff' } }),
        },
      ],
      onHeaderCell: () => ({ style: { backgroundColor: '#fffbe6' } }),
    });

    return cols;
  }, [dynamicColumns, data]);

  const totals = useMemo(() => data[0] ? computeTotals(data[0]) : { totalNew: 0, totalEdit: 0 }, [data, dynamicColumns]);

  const exportCsv = () => {
    if (!data || data.length === 0) return;
    const r = data[0];
    const headers = ['序号', '神殿', ...dynamicColumns.flatMap(col => [`${col.label}新编`, `${col.label}修改`]), '新编合计', '修改合计'];
    const row = [
      r.serialNumber,
      r.campus,
      ...dynamicColumns.flatMap(col => [r[`${col.key}_new`], r[`${col.key}_edit`]]),
      totals.totalNew,
      totals.totalEdit,
    ];
    const csv = [headers, row].map(x => x.map(y => `"${y}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `题库编写汇总_${campusLabel}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <Spin spinning={loading}>
      <div style={{ padding: 24 }}>
        <style>{`
          .centered-input .ant-input-number-input {
            text-align: center;
          }
        `}</style>
        <div className="mb-4">
          <Title level={2}>12. {campusLabel}智慧司题库编写汇总表格</Title>
          <Text type="secondary">统计不同方向题库的新编与修改数量（支持动态添加列）</Text>
        </div>
        
        <div className="mb-4"><CampusSelector /></div>

        <Space className="mb-4" wrap>
          <Select
            value={year}
            onChange={setYear}
            style={{ width: 120 }}
            options={[2023, 2024, 2025, 2026].map(y => ({ label: `${y}年`, value: y }))}
          />
          <Button type="primary" icon={<SaveOutlined />} onClick={saveData} loading={saving}>
            保存
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => setAddColumnModalOpen(true)}>
            添加列
          </Button>
          <Button icon={<DownloadOutlined />} onClick={exportCsv}>
            导出CSV
          </Button>
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            刷新
          </Button>
        </Space>

        <Card>
          <Table
            columns={tableColumns}
            dataSource={data}
            rowKey="id"
            pagination={false}
            scroll={{ x: 'max-content', y: 600 }}
            sticky
            bordered
            summary={() => (
              <Table.Summary.Row style={{ textAlign: 'center' }}>
                <Table.Summary.Cell index={0} colSpan={2}>
                  <strong style={{ color: '#ff4d4f' }}>合计</strong>
                </Table.Summary.Cell>
                {dynamicColumns.map((col, idx) => (
                  <React.Fragment key={col.key}>
                    <Table.Summary.Cell index={2 + idx * 2}>
                      <strong style={{ color: '#ff4d4f' }}>{data[0] ? data[0][`${col.key}_new`] : 0}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3 + idx * 2}>
                      <strong style={{ color: '#ff4d4f' }}>{data[0] ? data[0][`${col.key}_edit`] : 0}</strong>
                    </Table.Summary.Cell>
                  </React.Fragment>
                ))}
                <Table.Summary.Cell index={2 + dynamicColumns.length * 2}>
                  <strong style={{ color: '#ff4d4f' }}>{totals.totalNew}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3 + dynamicColumns.length * 2}>
                  <strong style={{ color: '#ff4d4f' }}>{totals.totalEdit}</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </Card>

        <Modal
          title="添加新列"
          open={addColumnModalOpen}
          onOk={handleAddColumn}
          onCancel={() => { setAddColumnModalOpen(false); setNewColumnLabel(''); }}
          okText="添加"
          cancelText="取消"
        >
          <Input
            placeholder="请输入列名称（如：大数据）"
            value={newColumnLabel}
            onChange={e => setNewColumnLabel(e.target.value)}
            onPressEnter={handleAddColumn}
          />
        </Modal>
      </div>
    </Spin>
  );
};

export default QuestionbankWritingPage;

