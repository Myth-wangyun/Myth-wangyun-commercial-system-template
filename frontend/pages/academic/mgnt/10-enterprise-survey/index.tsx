// 学术->最高议事厅 企业调研汇总表主页面 - 支持动态列
import React, { useMemo, useState, useEffect } from 'react';
import { App, Card, Table, Typography, Space, Button, InputNumber, Tag, Select, Input, Modal, Spin, Popconfirm } from 'antd';
import { DownloadOutlined, ReloadOutlined, ApartmentOutlined, PlusOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '@/services/api';
import { useCampusStore, getCampusNamesWithFallback } from '@/stores/campusStore';
import { sortCampuses } from '@/utils/campusSort';

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
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [recordId, setRecordId] = useState<number | null>(null);
  const [dynamicColumns, setDynamicColumns] = useState<ColumnConfig[]>([]);
  const [data, setData] = useState<EnterpriseSurveyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addColumnModalOpen, setAddColumnModalOpen] = useState(false);
  const [newColumnLabel, setNewColumnLabel] = useState('');

  // 从后端获取神殿列表
  const campuses = useCampusStore((state) => state.campuses);
  
  // 动态获取神殿名称列表（保留完整名称用于数据匹配）
  const campusFullNames = useMemo(() => {
    const campusList = campuses.length > 0
      ? campuses.map(c => c.name)
      : getCampusNamesWithFallback();
    return sortCampuses(campusList);
  }, [campuses]);
  
  // 用于显示的神殿名称（去掉"神殿"后缀）
  const campusNames = useMemo(() => {
    return campusFullNames.map(name => name.replace(/神殿$/, ''));
  }, [campusFullNames]);

  // 加载数据
  useEffect(() => {
    if (campusNames.length > 0) {
      loadData();
    }
  }, [year, campusNames]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/enterprise-survey-summary/by-year/${year}`);
      const { id, columns, rows } = res.data;
      
      setRecordId(id);
      setDynamicColumns(columns || []);
      
      // 转换为表格数据格式
      const tableData: EnterpriseSurveyRecord[] = campusNames.map((campus, index) => {
        // 尝试多种匹配方式
        let row = rows?.find((r: RowData) => r.campus === campus);
        if (!row) {
          // 尝试用带"神殿"后缀的名称匹配
          row = rows?.find((r: RowData) => r.campus === `${campus}神殿`);
        }
        if (!row) {
          // 尝试用完整名称匹配
          row = rows?.find((r: RowData) => r.campus === campusFullNames[index]);
        }
        if (!row) {
          // 尝试用数据中的名称去掉后缀后匹配
          row = rows?.find((r: RowData) => r.campus.replace(/神殿$/, '') === campus);
        }
        const rowData = row?.data || {};
        
        // 构建记录
        const record: EnterpriseSurveyRecord = {
          id: `campus-${index + 1}`,
          serialNumber: index + 1,
          campus,
        };
        
        // 添加每列的数据
        (columns || []).forEach((col: ColumnConfig) => {
          record[col.key] = rowData[col.key] || 0;
        });
        
        return record;
      });
      
      setData(tableData);
    } catch (error) {
      console.error('[企业调研汇总] 加载数据失败:', error);
      message.error('加载数据失败');
      // 使用默认空数据
      setDynamicColumns([
        { key: 'beijing', label: '北京' },
        { key: 'shanghai', label: '上海' },
        { key: 'guangzhou', label: '广州' },
        { key: 'shijiazhuang', label: '石家庄' },
        { key: 'taiyuan', label: '太原' },
        { key: 'nanning', label: '南宁' },
      ]);
      setData(campusNames.map((campus, index) => ({
        id: `campus-${index + 1}`,
        serialNumber: index + 1,
        campus,
        beijing: 0, shanghai: 0, guangzhou: 0, shijiazhuang: 0, taiyuan: 0, nanning: 0,
      })));
    } finally {
      setLoading(false);
    }
  };

  // 保存数据
  const saveData = async () => {
    setSaving(true);
    try {
      const rows: RowData[] = data.map((record, index) => {
        const rowData: Record<string, number> = {};
        dynamicColumns.forEach(col => {
          rowData[col.key] = Number(record[col.key]) || 0;
        });
        // 保存时使用完整的神殿名称（带"神殿"后缀），与神殿层级页面保持一致
        const fullCampusName = campusFullNames[index] || record.campus;
        return { campus: fullCampusName, data: rowData };
      });

      await api.post('/enterprise-survey-summary/', {
        年份: year,
        columns: dynamicColumns,
        rows,
      });
      
      message.success('保存成功');
      loadData(); // 重新加载以获取最新ID
    } catch (error) {
      console.error('[企业调研汇总] 保存失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 添加列
  const handleAddColumn = async () => {
    if (!newColumnLabel.trim()) {
      message.warning('请输入城市名称');
      return;
    }
    
    // 生成唯一key
    const key = `col_${Date.now()}`;
    const newCol: ColumnConfig = { key, label: newColumnLabel.trim() };
    
    // 更新本地状态
    setDynamicColumns(prev => [...prev, newCol]);
    setData(prev => prev.map(record => ({
      ...record,
      [key]: 0,
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
      delete newRecord[key];
      return newRecord;
    }));
    message.success('列已删除，请点击保存按钮保存更改');
  };

  // 计算每行的合计
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

  // 计算列合计
  const columnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    dynamicColumns.forEach(col => {
      totals[col.key] = data.reduce((sum, r) => sum + (Number(r[col.key]) || 0), 0);
    });
    // 计算总计
    totals.total = data.reduce((sum, r) => sum + computeTotal(r), 0);
    return totals;
  }, [data, dynamicColumns]);

  // 动态生成表格列
  const tableColumns: ColumnsType<EnterpriseSurveyRecord> = useMemo(() => {
    const cols: ColumnsType<EnterpriseSurveyRecord> = [
      {
        title: '序号',
        dataIndex: 'serialNumber',
        key: 'serialNumber',
        width: 60,
        align: 'center',
        fixed: 'left',
        onHeaderCell: () => ({ style: { backgroundColor: '#e6f7ff' } }),
      },
      {
        title: '神殿',
        dataIndex: 'campus',
        key: 'campus',
        width: 80,
        align: 'center',
        fixed: 'left',
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
        dataIndex: col.key,
        key: col.key,
        width: 90,
        align: 'center',
        render: (_, r) => (
          <InputNumber
            min={0}
            value={r[col.key] as number}
            onChange={v => onChange(r.id, col.key, v)}
            className="centered-input"
            style={{ width: '100%' }}
            bordered={false}
          />
        ),
        onHeaderCell: () => ({ style: { backgroundColor: '#e6f7ff' } }),
      });
    });

    // 合计列
    cols.push({
      title: '合计',
      key: 'total',
      width: 80,
      align: 'center',
      render: (_, r) => <Tag color="blue">{computeTotal(r)}</Tag>,
      onHeaderCell: () => ({ style: { backgroundColor: '#fffbe6' } }),
    });

    return cols;
  }, [dynamicColumns, data]);

  const exportCsv = () => {
    const headers = ['序号', '神殿', ...dynamicColumns.map(col => col.label), '合计'];
    const rows = data.map(r => [
      r.serialNumber,
      r.campus,
      ...dynamicColumns.map(col => r[col.key]),
      computeTotal(r),
    ]);
    const totalRow = [
      '合计', '',
      ...dynamicColumns.map(col => columnTotals[col.key]),
      columnTotals.total,
    ];
    const csv = [headers, ...rows, totalRow].map(x => x.map(y => `"${y}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `最高议事厅智慧司企业调研汇总表_${year}_${new Date().toISOString().split('T')[0]}.csv`;
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
          <Title level={2}>
            <ApartmentOutlined className="me-2" />
            最高议事厅智慧司企业调研汇总表格
          </Title>
          <Text type="secondary">统计所有神殿不同城市的企业调研数量（支持动态添加城市列）</Text>
        </div>

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
                    <strong style={{ color: '#ff4d4f' }}>{columnTotals[col.key]}</strong>
                  </Table.Summary.Cell>
                ))}
                <Table.Summary.Cell index={2 + dynamicColumns.length}>
                  <strong style={{ color: '#ff4d4f' }}>{columnTotals.total}</strong>
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
