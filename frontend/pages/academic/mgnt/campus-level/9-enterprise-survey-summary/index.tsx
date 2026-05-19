//学术->最高议事厅->神殿 企业调查汇总表 - 支持动态列
import React, { useMemo, useState, useEffect } from 'react';
import { App, Card, Table, Typography, Space, Button, InputNumber, Tag, Select, Input, Modal, Spin, Popconfirm } from 'antd';
import { DownloadOutlined, ReloadOutlined, ApartmentOutlined, SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
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

interface EnterpriseSurveyRecord {
  id: string;
  serialNumber: number;
  campus: string;
  [key: string]: string | number; // 动态字段
}

const EnterpriseSurveyPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const campusLabel = currentCampus || '测试神殿';
  
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [recordId, setRecordId] = useState<number | null>(null);
  const [dynamicColumns, setDynamicColumns] = useState<ColumnConfig[]>([]);
  const [data, setData] = useState<EnterpriseSurveyRecord[]>([]);
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
      const res = await api.get(`/enterprise-survey-summary/by-year/${year}`);
      const { id, columns, rows } = res.data;
      
      setRecordId(id);
      setDynamicColumns(columns || []);
      
      // 只显示当前神殿的数据（单行）
      const row = rows?.find((r: RowData) => r.campus === campusLabel);
      const rowData = row?.data || {};
      
      // 构建单行记录
      const record: EnterpriseSurveyRecord = {
        id: 'campus-1',
        serialNumber: 1,
        campus: campusLabel,
      };
      
      // 添加每列的数据
      (columns || []).forEach((col: ColumnConfig) => {
        record[col.key] = rowData[col.key] || 0;
      });
      
      setData([record]);
    } catch (error) {
      console.error('[企业调研汇总] 加载数据失败:', error);
      // 使用默认空数据
      const defaultColumns = [
        { key: 'beijing', label: '北京' },
        { key: 'shanghai', label: '上海' },
        { key: 'guangzhou', label: '广州' },
        { key: 'shijiazhuang', label: '石家庄' },
        { key: 'taiyuan', label: '太原' },
        { key: 'nanning', label: '南宁' },
      ];
      setDynamicColumns(defaultColumns);
      setData([{
        id: 'campus-1',
        serialNumber: 1,
        campus: campusLabel,
        beijing: 0, shanghai: 0, guangzhou: 0, shijiazhuang: 0, taiyuan: 0, nanning: 0,
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
        const res = await api.get(`/enterprise-survey-summary/by-year/${year}`);
        existingColumns = res.data.columns || dynamicColumns;
        existingRows = res.data.rows || [];
      } catch {
        // 如果没有数据，使用当前columns
      }
      
      // 更新当前神殿的行数据
      const currentRecord = data[0];
      const rowData: Record<string, number> = {};
      dynamicColumns.forEach(col => {
        rowData[col.key] = Number(currentRecord[col.key]) || 0;
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

      await api.post('/enterprise-survey-summary/', {
        年份: year,
        columns: dynamicColumns,
        rows: newRows,
      });
      
      message.success('保存成功');
      loadData();
    } catch (error) {
      console.error('[企业调研汇总] 保存失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 添加列（城市）
  const handleAddColumn = async () => {
    if (!newColumnLabel.trim()) {
      message.warning('请输入城市名称');
      return;
    }
    
    const key = `city_${Date.now()}`;
    const newCol: ColumnConfig = { key, label: newColumnLabel.trim() };
    
    setDynamicColumns(prev => [...prev, newCol]);
    setData(prev => prev.map(record => ({
      ...record,
      [key]: 0,
    })));
    
    setNewColumnLabel('');
    setAddColumnModalOpen(false);
    message.success('城市已添加，请点击保存按钮保存更改');
  };

  // 删除列
  const handleRemoveColumn = (key: string) => {
    setDynamicColumns(prev => prev.filter(col => col.key !== key));
    setData(prev => prev.map(record => {
      const newRecord = { ...record };
      delete newRecord[key];
      return newRecord;
    }));
    message.success('城市已删除，请点击保存按钮保存更改');
  };

  // 计算合计
  const computeTotal = (record: EnterpriseSurveyRecord) => {
    let total = 0;
    dynamicColumns.forEach(col => {
      total += Number(record[col.key]) || 0;
    });
    return total;
  };

  const onChange = (id: string, key: string, v: number | null) => {
    setData(prev => prev.map(x => x.id === id ? { ...x, [key]: Number(v || 0) } : x));
  };

  // 动态生成表格列
  const tableColumns: ColumnsType<EnterpriseSurveyRecord> = useMemo(() => {
    const cols: ColumnsType<EnterpriseSurveyRecord> = [
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

    // 添加动态列（城市）
    dynamicColumns.forEach(col => {
      cols.push({
        title: (
          <Space>
            {col.label}
            <Popconfirm
              title="确定删除此城市？"
              onConfirm={() => handleRemoveColumn(col.key)}
              okText="确定"
              cancelText="取消"
            >
              <DeleteOutlined style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 12 }} />
            </Popconfirm>
          </Space>
        ),
        dataIndex: col.key,
        key: col.key,
        width: 100,
        align: 'center' as const,
        render: (_: unknown, r: EnterpriseSurveyRecord) => (
          <InputNumber
            min={0}
            value={r[col.key] as number}
            onChange={v => onChange(r.id, col.key, v)}
            className="centered-input"
            style={{ width: '100%' }}
            bordered={false}
          />
        ),
        onHeaderCell: () => ({ style: { backgroundColor: '#fffbe6' } }),
      });
    });

    // 合计列
    cols.push({
      title: '合计',
      key: 'total',
      width: 100,
      align: 'center' as const,
      render: (_: unknown, r: EnterpriseSurveyRecord) => <Tag color="blue">{computeTotal(r)}</Tag>,
      onHeaderCell: () => ({ style: { backgroundColor: '#e6f7ff' } }),
    });

    return cols;
  }, [dynamicColumns, data]);

  const total = useMemo(() => data[0] ? computeTotal(data[0]) : 0, [data, dynamicColumns]);

  const exportCsv = () => {
    if (!data || data.length === 0) return;
    const r = data[0];
    const headers = ['序号', '神殿', ...dynamicColumns.map(col => col.label), '合计'];
    const row = [
      r.serialNumber,
      r.campus,
      ...dynamicColumns.map(col => r[col.key]),
      total,
    ];
    const csv = [headers, row].map(x => x.map(y => `"${y}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `企业调研汇总_${campusLabel}_${new Date().toISOString().split('T')[0]}.csv`;
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
          <Title level={2}><ApartmentOutlined className="me-2" />9. {campusLabel}智慧司企业调研汇总表格</Title>
          <Text type="secondary">统计企业调研数量（支持动态添加城市）</Text>
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
            添加城市
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
                  <Table.Summary.Cell key={col.key} index={2 + idx}>
                    <strong style={{ color: '#ff4d4f' }}>{data[0] ? data[0][col.key] : 0}</strong>
                  </Table.Summary.Cell>
                ))}
                <Table.Summary.Cell index={2 + dynamicColumns.length}>
                  <strong style={{ color: '#ff4d4f' }}>{total}</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </Card>

        <Modal
          title="添加新城市"
          open={addColumnModalOpen}
          onOk={handleAddColumn}
          onCancel={() => { setAddColumnModalOpen(false); setNewColumnLabel(''); }}
          okText="添加"
          cancelText="取消"
        >
          <Input
            placeholder="请输入城市名称（如：深圳）"
            value={newColumnLabel}
            onChange={e => setNewColumnLabel(e.target.value)}
            onPressEnter={handleAddColumn}
          />
        </Modal>
      </div>
    </Spin>
  );
};

export default EnterpriseSurveyPage;
