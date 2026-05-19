// 学术->最高议事厅->岗位分析报告汇总表主页面（显示所有神殿数据的汇总表）
// 支持动态添加/删除列，数据持久化到后端

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { App, Card, Typography, Space, Button, InputNumber, Spin, Modal, Input, Popconfirm, Select } from 'antd';
import { DownloadOutlined, ReloadOutlined, SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '@/services/api';
import { useCampusStore, getCampusNamesWithFallback } from '@/stores/campusStore';
import { sortCampuses } from '@/utils/campusSort';

const { Title } = Typography;

// 使用统一的 API 服务，自动处理 baseURL
const API_BASE = '/position-analysis-summary';

interface ColumnConfig {
  key: string;
  label: string;
}

interface RowData {
  campus: string;
  data: Record<string, number>;
}

interface PositionAnalysisData {
  id?: number;
  年份: number;
  columns: ColumnConfig[];
  rows: RowData[];
  创建时间?: string;
  更新时间?: string;
}

// 默认列配置
const defaultColumns: ColumnConfig[] = [
  { key: 'network', label: '网络工程' },
  { key: 'server', label: '服务器运维' },
  { key: 'cloud', label: '云计算' },
  { key: 'ai', label: '人工智能' },
  { key: 'shortVideo', label: '后期短视频' },
  { key: 'indoorOutdoor', label: '室内外效果' },
  { key: 'game', label: '游戏动漫' },
];

const PositionAnalysisPage: React.FC = () => {
  const { message } = App.useApp()
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [newColumnKey, setNewColumnKey] = useState('');
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

  // 创建默认数据的函数
  const createDefaultData = useCallback((yr: number): PositionAnalysisData => ({
    年份: yr,
    columns: [...defaultColumns],
    rows: campusNames.map(campus => ({
      campus,
      data: Object.fromEntries(defaultColumns.map(col => [col.key, 0])),
    })),
  }), [campusNames]);

  const [data, setData] = useState<PositionAnalysisData>(() => ({
    年份: currentYear,
    columns: [...defaultColumns],
    rows: [],
  }));

  // 获取数据
  const fetchData = useCallback(async () => {
    if (campusNames.length === 0) return;
    
    setLoading(true);
    try {
      const response = await api.get(`${API_BASE}/by-year/${year}`, {
        params: { create_if_not_exists: true }
      });
      // 确保数据结构正确
      const responseData = response.data;
      
      // 合并后端数据和本地神殿列表，确保所有神殿都有数据
      const existingRows = responseData.rows || [];
      const mergedRows = campusNames.map(campus => {
        // 尝试多种匹配方式
        let existingRow = existingRows.find((r: RowData) => r.campus === campus);
        if (!existingRow) {
          // 尝试用带"神殿"后缀的名称匹配
          existingRow = existingRows.find((r: RowData) => r.campus === `${campus}神殿`);
        }
        if (!existingRow) {
          // 尝试用不带后缀匹配带后缀的
          existingRow = existingRows.find((r: RowData) => r.campus.replace(/神殿$/, '') === campus);
        }
        if (existingRow) {
          return { ...existingRow, campus }; // 统一使用不带后缀的名称
        }
        // 为新神殿创建空数据
        const columns = responseData.columns || defaultColumns;
        return {
          campus,
          data: Object.fromEntries(columns.map((col: ColumnConfig) => [col.key, 0])),
        };
      });
      
      setData({
        id: responseData.id,
        年份: responseData.年份 || responseData.年份,
        columns: responseData.columns || defaultColumns,
        rows: mergedRows,
        创建时间: responseData.创建时间,
        更新时间: responseData.更新时间,
      });
    } catch (error: any) {
      console.error('获取数据失败:', error);
      message.error('获取数据失败: ' + (error.response?.data?.detail || error.message));
      // 使用默认数据
      setData(createDefaultData(year));
    } finally {
      setLoading(false);
    }
  }, [year, campusNames, createDefaultData]);

  useEffect(() => {
    if (campusNames.length > 0) {
      fetchData();
    }
  }, [fetchData, campusNames]);

  // 保存数据
  const saveData = async () => {
    setSaving(true);
    try {
      const response = await api.post(API_BASE + '/', {
        年份: data.年份,
        columns: data.columns,
        rows: data.rows,
      });
      // 更新 id（如果是新创建的数据）
      if (response.data.id) {
        setData(prev => ({ ...prev, id: response.data.id }));
      }
      message.success('保存成功');
    } catch (error: any) {
      console.error('保存失败:', error);
      message.error('保存失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
    }
  };

  // 处理单元格值变化
  const handleChange = (campus: string, colKey: string, value: number | null) => {
    setData(prev => ({
      ...prev,
      rows: prev.rows.map(row => {
        if (row.campus !== campus) return row;
        return {
          ...row,
          data: { ...row.data, [colKey]: value || 0 },
        };
      }),
    }));
  };

  // 重置为默认数据
  const handleReset = () => {
    setData(createDefaultData(year));
  };

  // 添加新列（立即保存到后端）
  const handleAddColumn = async () => {
    if (!newColumnKey.trim() || !newColumnLabel.trim()) {
      message.warning('请输入列标识和列名称');
      return;
    }
    
    // 检查 key 是否已存在
    if (data.columns.some(col => col.key === newColumnKey)) {
      message.warning('列标识已存在');
      return;
    }

    // 如果没有 id，先保存获取 id
    if (!data.id) {
      try {
        const response = await api.post(API_BASE + '/', {
          年份: data.年份,
          columns: data.columns,
          rows: data.rows,
        });
        setData(prev => ({ ...prev, id: response.data.id }));
      } catch (error: any) {
        message.error('保存失败，无法添加列: ' + (error.response?.data?.detail || error.message));
        return;
      }
    }

    // 更新本地状态
    const updatedData = {
      ...data,
      columns: [...data.columns, { key: newColumnKey, label: newColumnLabel }],
      rows: data.rows.map(row => ({
        ...row,
        data: { ...row.data, [newColumnKey]: 0 },
      })),
    };
    setData(updatedData);

    // 立即保存到后端
    try {
      if (data.id) {
        // 使用添加列 API
        await api.post(`${API_BASE}/${data.id}/columns`, {
          key: newColumnKey,
          label: newColumnLabel,
        });
      } else {
        // 如果没有 id，保存整个数据
        const response = await api.post(API_BASE + '/', {
          年份: updatedData.年份,
          columns: updatedData.columns,
          rows: updatedData.rows,
        });
        setData(prev => ({ ...prev, id: response.data.id }));
      }
      message.success('添加列成功并已保存');
    } catch (error: any) {
      message.error('保存失败: ' + (error.response?.data?.detail || error.message));
      // 回滚本地状态
      setData(data);
      return;
    }

    setNewColumnKey('');
    setNewColumnLabel('');
    setIsAddColumnModalOpen(false);
  };

  // 删除列（立即保存到后端）
  const handleRemoveColumn = async (colKey: string) => {
    if (!data.id) {
      message.warning('数据未保存，无法删除列');
      return;
    }

    // 保存原始数据用于回滚
    const originalData = { ...data };

    // 更新本地状态
    const updatedData = {
      ...data,
      columns: data.columns.filter(col => col.key !== colKey),
      rows: data.rows.map(row => {
        const newData = { ...row.data };
        delete newData[colKey];
        return { ...row, data: newData };
      }),
    };
    setData(updatedData);

    // 立即保存到后端
    try {
      await api.delete(`${API_BASE}/${data.id}/columns/${colKey}`);
      message.success('删除列成功并已保存');
    } catch (error: any) {
      message.error('保存失败: ' + (error.response?.data?.detail || error.message));
      // 回滚本地状态
      setData(originalData);
    }
  };

  // 计算行合计
  const calculateRowTotal = (rowData: Record<string, number>) => {
    return Object.values(rowData).reduce((sum, val) => sum + (val || 0), 0);
  };

  // 计算列合计
  const calculateColumnTotal = (colKey: string) => {
    return data.rows.reduce((sum, row) => sum + (row.data[colKey] || 0), 0);
  };

  // 计算总合计
  const calculateGrandTotal = () => {
    return data.rows.reduce((sum, row) => sum + calculateRowTotal(row.data), 0);
  };

  // 导出 CSV
  const exportCsv = () => {
    const headers = ['序号', '神殿', ...data.columns.map(col => col.label), '合计'];
    const dataRows = data.rows.map((row, index) => [
      index + 1,
      row.campus,
      ...data.columns.map(col => row.data[col.key] || 0),
      calculateRowTotal(row.data),
    ]);
    
    // 添加合计行
    const totalRow = ['', '合计', ...data.columns.map(col => calculateColumnTotal(col.key)), calculateGrandTotal()];
    
    const csv = [headers, ...dataRows, totalRow]
      .map(line => line.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `最高议事厅岗位分析报告汇总_${year}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: '#d9ead3',
    border: '1px solid #000',
    textAlign: 'center',
    padding: '8px 4px',
    fontWeight: 600,
    position: 'relative',
  };

  const cellStyle: React.CSSProperties = {
    border: '1px solid #000',
    textAlign: 'center',
    padding: '6px 4px',
    backgroundColor: '#fff',
  };

  // 生成年份选项
  const yearOptions = [];
  for (let y = currentYear - 5; y <= currentYear + 1; y++) {
    yearOptions.push({ value: y, label: `${y}年` });
  }

  return (
    <Spin spinning={loading}>
      <div style={{ padding: 24 }}>
        <Card>
          <div style={{ marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0, textAlign: 'center' }}>
              <div style={{ background: '#FFD700', color: '#000', padding: '8px 0', borderRadius: 2, fontSize: 18 }}>
                最高议事厅智慧司岗位分析报告汇总表格
              </div>
            </Title>
          </div>

          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <Space wrap>
              <span>年份：</span>
              <Select
                value={year}
                onChange={setYear}
                options={yearOptions}
                style={{ width: 100 }}
              />
              <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
              <Button icon={<DownloadOutlined />} onClick={exportCsv}>导出CSV</Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                onClick={saveData}
                loading={saving}
              >
                保存
              </Button>
            </Space>
            <Space>
              <Button 
                type="dashed" 
                icon={<PlusOutlined />} 
                onClick={() => setIsAddColumnModalOpen(true)}
              >
                添加列
              </Button>
            </Space>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={{ ...headerStyle, width: 60 }}>序号</th>
                  <th style={{ ...headerStyle, width: 80 }}>神殿</th>
                  {data.columns.map((col) => (
                    <th key={col.key} style={headerStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <span>{col.label}</span>
                        {data.columns.length > 1 && (
                          <Popconfirm
                            title="确定删除此列？"
                            description="删除后数据将无法恢复"
                            onConfirm={() => handleRemoveColumn(col.key)}
                            okText="确定"
                            cancelText="取消"
                          >
                            <DeleteOutlined 
                              style={{ 
                                color: '#ff4d4f', 
                                cursor: 'pointer',
                                fontSize: 12,
                              }} 
                            />
                          </Popconfirm>
                        )}
                      </div>
                    </th>
                  ))}
                  <th style={{ ...headerStyle, width: 80 }}>合计</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, index) => (
                  <tr key={row.campus}>
                    <td style={cellStyle}>{index + 1}</td>
                    <td style={cellStyle}>{row.campus}</td>
                    {data.columns.map((col) => (
                      <td key={col.key} style={cellStyle}>
                        <InputNumber
                          min={0}
                          value={row.data[col.key] || undefined}
                          onChange={(val) => handleChange(row.campus, col.key, val)}
                          size="small"
                          style={{ width: '100%', border: 'none' }}
                          controls={false}
                        />
                      </td>
                    ))}
                    <td style={cellStyle}>{calculateRowTotal(row.data)}</td>
                  </tr>
                ))}
                {/* 合计行 */}
                <tr>
                  <td colSpan={2} style={cellStyle}>
                    <strong style={{ color: '#f5222d' }}>合计</strong>
                  </td>
                  {data.columns.map((col) => (
                    <td key={col.key} style={cellStyle}>
                      <strong style={{ color: '#f5222d' }}>{calculateColumnTotal(col.key)}</strong>
                    </td>
                  ))}
                  <td style={cellStyle}>
                    <strong style={{ color: '#f5222d' }}>{calculateGrandTotal()}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* 添加列弹窗 */}
        <Modal
          title="添加新列"
          open={isAddColumnModalOpen}
          onOk={handleAddColumn}
          onCancel={() => {
            setIsAddColumnModalOpen(false);
            setNewColumnKey('');
            setNewColumnLabel('');
          }}
          okText="添加"
          cancelText="取消"
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <label>列标识（英文，用于数据存储）：</label>
              <Input 
                value={newColumnKey} 
                onChange={(e) => setNewColumnKey(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="例如: newMajor"
              />
            </div>
            <div>
              <label>列名称（中文，用于显示）：</label>
              <Input 
                value={newColumnLabel} 
                onChange={(e) => setNewColumnLabel(e.target.value)}
                placeholder="例如: 新专业"
              />
            </div>
          </Space>
        </Modal>
      </div>
    </Spin>
  );
};

export default PositionAnalysisPage;

