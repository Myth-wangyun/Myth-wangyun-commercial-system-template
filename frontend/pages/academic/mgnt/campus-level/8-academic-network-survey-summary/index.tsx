//学术->最高议事厅->神殿 网络调查汇总表 - 支持动态平台和城市
import React, { useMemo, useState, useEffect } from 'react';
import { App, Card, Table, Typography, Space, Button, InputNumber, Tag, Select, Input, Modal, Spin, Popconfirm } from 'antd';
import { DownloadOutlined, ReloadOutlined, GlobalOutlined, SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useCampusStore } from '@/stores/campusStore';
import CampusSelector from '@/components/common/CampusSelector';
import api from '@/services/api';
import { fetchMajors } from '@/services/configMaster';

const { Title, Text } = Typography;

interface PlatformConfig {
  key: string;
  label: string;
}

interface CityConfig {
  key: string;
  label: string;
}

interface RowData {
  campus: string;
  major?: string;
  data: Record<string, number>;
}

interface NetworkSurveyRecord {
  id: string;
  serialNumber: number;
  campus: string;
  major: string;
  [key: string]: string | number;
}

const shortCampusName = (campus: string): string => {
  return campus.replace(/神殿$/, '');
};

// 用于和配置中心的 campus_name 对齐：优先补全“神殿”后缀
const normalizeCampusNameForConfig = (campus: string): string => {
  const name = (campus || '').trim();
  if (!name) return '';
  return /神殿$/.test(name) ? name : `${name}神殿`;
};

const NetworkSurveyPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const campusLabel = useMemo(() => shortCampusName(currentCampus || '主神殿'), [currentCampus]);

  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);
  const [cities, setCities] = useState<CityConfig[]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const [data, setData] = useState<NetworkSurveyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 添加平台/城市模态框状态
  const [addPlatformModalOpen, setAddPlatformModalOpen] = useState(false);
  const [addCityModalOpen, setAddCityModalOpen] = useState(false);
  const [newPlatformLabel, setNewPlatformLabel] = useState('');
  const [newCityLabel, setNewCityLabel] = useState('');

  // 从配置中心加载“当前神殿”的专业列表
  useEffect(() => {
    const loadMajors = async () => {
      try {
        const res = await fetchMajors({ campus_name: normalizeCampusNameForConfig(campusLabel), active: true });
        const list = (res || []).map(m => (m.name || '').trim()).filter(Boolean);
        const nextMajors = Array.from(new Set(list)).sort();
        setMajors(nextMajors);
      } catch (e) {
        console.error('[网络调查汇总] 加载配置中心专业失败:', e);
        message.warning('加载配置中心专业失败');
        setMajors([]);
      }
    };

    loadMajors();
  }, [campusLabel]);

  // 加载数据（majors/platforms/cities 都要用）
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, campusLabel, majors.join('|')]);

  const buildRecord = (
    serialNumber: number,
    major: string,
    rowData: Record<string, number>,
    pfs: PlatformConfig[],
    cts: CityConfig[],
  ): NetworkSurveyRecord => {
    const record: NetworkSurveyRecord = {
      id: `${campusLabel}-${major || 'empty'}`,
      serialNumber,
      campus: campusLabel,
      major: major || '',
    };

    (pfs || []).forEach((platform: PlatformConfig) => {
      (cts || []).forEach((city: CityConfig) => {
        const key = `${platform.key}_${city.key}`;
        record[key] = rowData?.[key] || 0;
      });
    });

    return record;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 确保 majors 已加载（否则首次进入会拿到空 majors）
      let currentMajors = majors;
      if (!currentMajors || currentMajors.length === 0) {
        try {
          const resMajors = await fetchMajors({ campus_name: normalizeCampusNameForConfig(campusLabel), active: true });
          const list = (resMajors || []).map(m => (m.name || '').trim()).filter(Boolean);
          currentMajors = Array.from(new Set(list)).sort();
          setMajors(currentMajors);
        } catch {
          // ignore
        }
      }

      const res = await api.get(`/network-survey-summary/by-year/${year}`, {
        params: { create_if_not_exists: true },
      });
      const { platforms: pfs, cities: cts, rows } = res.data;

      setPlatforms(pfs || []);
      setCities(cts || []);

      // 需求：配置中心该神殿有几个专业，就显示几行（一专业一行）
      // 若该神殿没有配置专业，则至少显示 1 行空专业，避免表格空白
      const majorsToRender = (currentMajors && currentMajors.length > 0) ? currentMajors : [''];

      // 重要：数据库 rows 已支持 {campus, major, data}，因此按“神殿+专业”读取
      const tableData = majorsToRender.map((m, idx) => {
        const row = (rows || []).find((r: RowData) => (r?.campus || '') === campusLabel && String(r?.major || '') === String(m || ''));
        const rowData = row?.data || {};
        return buildRecord(idx + 1, m, rowData, pfs || [], cts || []);
      });

      setData(tableData);
    } catch (error) {
      console.error('[网络调查汇总] 加载数据失败:', error);

      // fallback：保持专业行结构
      const defaultPlatforms = [
        { key: 'boss', label: 'Boss直聘' },
        { key: 'zhilian', label: '智联招聘' },
      ];
      const defaultCities = [
        { key: 'beijing', label: '北京' },
        { key: 'shanghai', label: '上海' },
        { key: 'guangzhou', label: '广州' },
        { key: 'shijiazhuang', label: '石家庄' },
        { key: 'taiyuan', label: '太原' },
        { key: 'nanning', label: '南宁' },
      ];

      setPlatforms(defaultPlatforms);
      setCities(defaultCities);

      const majorsToRender = majors.length > 0 ? majors : [''];
      const tableData = majorsToRender.map((m, idx) => buildRecord(idx + 1, m, {}, defaultPlatforms, defaultCities));
      setData(tableData);
    } finally {
      setLoading(false);
    }
  };

  // 保存数据（写入 DB JSONB rows：按神殿+专业分别存储）
  const saveData = async () => {
    setSaving(true);
    try {
      // 先获取完整数据
      let existingRows: RowData[] = [];
      try {
        const res = await api.get(`/network-survey-summary/by-year/${year}`, {
          params: { create_if_not_exists: true },
        });
        existingRows = res.data.rows || [];
      } catch {
        // ignore
      }

      // 先移除当前神殿所有旧行（避免重复）
      const rowsWithoutCurrentCampus = (existingRows || []).filter((r: RowData) => (r?.campus || '') !== campusLabel);

      // 再追加当前神殿“每个专业一行”
      const newCampusRows: RowData[] = data.map((record) => {
        const rowData: Record<string, number> = {};
        platforms.forEach(platform => {
          cities.forEach(city => {
            const key = `${platform.key}_${city.key}`;
            rowData[key] = Number(record[key]) || 0;
          });
        });
        return { campus: campusLabel, major: record.major || '', data: rowData };
      });

      const newRows = [...rowsWithoutCurrentCampus, ...newCampusRows];

      await api.post('/network-survey-summary/', {
        年份: year,
        platforms,
        cities,
        rows: newRows,
      });

      message.success('保存成功');
      loadData();
    } catch (error) {
      console.error('[网络调查汇总] 保存失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 添加平台
  const handleAddPlatform = () => {
    if (!newPlatformLabel.trim()) {
      message.warning('请输入平台名称');
      return;
    }

    const key = `platform_${Date.now()}`;
    const newPlatform: PlatformConfig = { key, label: newPlatformLabel.trim() };

    setPlatforms(prev => [...prev, newPlatform]);

    // 更新数据，添加新平台的所有城市数据
    setData(prev => prev.map(record => {
      const newRecord = { ...record };
      cities.forEach(city => {
        newRecord[`${key}_${city.key}`] = 0;
      });
      return newRecord;
    }));

    setNewPlatformLabel('');
    setAddPlatformModalOpen(false);
    message.success('平台已添加，请点击保存按钮保存更改');
  };

  // 删除平台
  const handleRemovePlatform = (platformKey: string) => {
    setPlatforms(prev => prev.filter(p => p.key !== platformKey));

    // 删除该平台的所有数据
    setData(prev => prev.map(record => {
      const newRecord = { ...record };
      cities.forEach(city => {
        delete newRecord[`${platformKey}_${city.key}`];
      });
      return newRecord;
    }));

    message.success('平台已删除，请点击保存按钮保存更改');
  };

  // 添加城市
  const handleAddCity = () => {
    if (!newCityLabel.trim()) {
      message.warning('请输入城市名称');
      return;
    }

    const key = `city_${Date.now()}`;
    const newCity: CityConfig = { key, label: newCityLabel.trim() };

    setCities(prev => [...prev, newCity]);

    // 更新数据，添加新城市的所有平台数据
    setData(prev => prev.map(record => {
      const newRecord = { ...record };
      platforms.forEach(platform => {
        newRecord[`${platform.key}_${key}`] = 0;
      });
      return newRecord;
    }));

    setNewCityLabel('');
    setAddCityModalOpen(false);
    message.success('城市已添加，请点击保存按钮保存更改');
  };

  // 删除城市
  const handleRemoveCity = (cityKey: string) => {
    setCities(prev => prev.filter(c => c.key !== cityKey));

    // 删除该城市的所有数据
    setData(prev => prev.map(record => {
      const newRecord = { ...record };
      platforms.forEach(platform => {
        delete newRecord[`${platform.key}_${cityKey}`];
      });
      return newRecord;
    }));

    message.success('城市已删除，请点击保存按钮保存更改');
  };

  // 计算合计（当前行）
  const computeTotal = (record: NetworkSurveyRecord) => {
    let total = 0;
    platforms.forEach(platform => {
      cities.forEach(city => {
        total += Number(record[`${platform.key}_${city.key}`]) || 0;
      });
    });
    return total;
  };

  const onChange = (id: string, key: string, v: number | null) => {
    setData(prev => prev.map(x => x.id === id ? { ...x, [key]: Number(v || 0) } : x));
  };

  // 动态生成表格列
  const tableColumns: ColumnsType<NetworkSurveyRecord> = useMemo(() => {
    const cols: ColumnsType<NetworkSurveyRecord> = [
      {
        title: '序号',
        dataIndex: 'serialNumber',
        key: 'serialNumber',
        width: 60,
        align: 'center',
        fixed: 'left',
        onHeaderCell: () => ({ style: { backgroundColor: '#52c41a', color: '#fff' } }),
      },
      {
        title: '神殿',
        dataIndex: 'campus',
        key: 'campus',
        width: 80,
        align: 'center',
        fixed: 'left',
        onHeaderCell: () => ({ style: { backgroundColor: '#52c41a', color: '#fff' } }),
      },
      {
        title: '专业',
        dataIndex: 'major',
        key: 'major',
        width: 140,
        align: 'center',
        fixed: 'left',
        render: (v: unknown) => <span>{String(v || '')}</span>,
        onHeaderCell: () => ({ style: { backgroundColor: '#52c41a', color: '#fff' } }),
      },
    ];

    // 添加每个平台的列组
    platforms.forEach(platform => {
      const platformCol: any = {
        title: (
          <Space>
            {platform.label}
            <Popconfirm
              title="确定删除此平台？"
              onConfirm={() => handleRemovePlatform(platform.key)}
              okText="确定"
              cancelText="取消"
            >
              <DeleteOutlined style={{ color: '#fff', cursor: 'pointer', fontSize: 12 }} />
            </Popconfirm>
          </Space>
        ),
        align: 'center' as const,
        onHeaderCell: () => ({ style: { backgroundColor: '#52c41a', color: '#fff' } }),
        children: cities.map(city => ({
          title: (
            <Space size={2}>
              {city.label}
              <Popconfirm
                title="确定删除此城市？"
                onConfirm={() => handleRemoveCity(city.key)}
                okText="确定"
                cancelText="取消"
              >
                <DeleteOutlined style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 10 }} />
              </Popconfirm>
            </Space>
          ),
          dataIndex: `${platform.key}_${city.key}`,
          key: `${platform.key}_${city.key}`,
          width: 90,
          align: 'center' as const,
          render: (_: unknown, r: NetworkSurveyRecord) => (
            <InputNumber
              min={0}
              value={r[`${platform.key}_${city.key}`] as number}
              onChange={v => onChange(r.id, `${platform.key}_${city.key}`, v)}
              className="centered-input"
              style={{ width: '100%' }}
              bordered={false}
            />
          ),
          onHeaderCell: () => ({ style: { backgroundColor: '#52c41a', color: '#fff' } }),
        })),
      };
      cols.push(platformCol);
    });

    // 合计列
    cols.push({
      title: '合计',
      key: 'total',
      width: 100,
      align: 'center' as const,
      fixed: 'right',
      render: (_: unknown, r: NetworkSurveyRecord) => <Tag color="blue">{computeTotal(r)}</Tag>,
      onHeaderCell: () => ({ style: { backgroundColor: '#52c41a', color: '#fff' } }),
    });

    return cols;
  }, [platforms, cities, data]);

  // 汇总（所有专业行求和）
  const total = useMemo(() => data.reduce((sum, r) => sum + computeTotal(r), 0), [data, platforms, cities]);

  const exportCsv = () => {
    if (!data || data.length === 0) return;

    const headers = ['序号', '神殿', '专业'];
    platforms.forEach(p => {
      cities.forEach(c => {
        headers.push(`${p.label}-${c.label}`);
      });
    });
    headers.push('合计');

    const rows = data.map(r => {
      const row: (string | number)[] = [r.serialNumber, r.campus, r.major || ''];
      platforms.forEach(p => {
        cities.forEach(c => {
          row.push(Number(r[`${p.key}_${c.key}`]) || 0);
        });
      });
      row.push(computeTotal(r));
      return row;
    });

    const totalRow: (string | number)[] = ['合计', '', ''];
    platforms.forEach(p => {
      cities.forEach(c => {
        totalRow.push(data.reduce((sum, r) => sum + (Number(r[`${p.key}_${c.key}`]) || 0), 0));
      });
    });
    totalRow.push(total);

    const csv = [headers, ...rows, totalRow].map(x => x.map(y => `"${y}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `网络调查汇总_${campusLabel}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // 生成年份选项
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear - 5; y <= currentYear + 1; y++) {
    yearOptions.push({ value: y, label: `${y}年` });
  }

  return (
    <Spin spinning={loading}>
      <div style={{ padding: 24 }}>
        <style>{`
          .centered-input .ant-input-number-input {
            text-align: center;
          }
        `}</style>
        <div className="mb-4">
          <Title level={2}><GlobalOutlined className="me-2" />{campusLabel}神殿智慧司网络调查汇总表格</Title>
          <Text type="secondary">统计不同平台与城市的网络调查数量（专业来自配置中心：一专业一行，按神殿+专业存库）</Text>
        </div>

        <div className="mb-4"><CampusSelector /></div>

        <Space className="mb-4" wrap>
          <Select
            value={year}
            onChange={setYear}
            style={{ width: 120 }}
            options={yearOptions}
          />
          <Button type="primary" icon={<SaveOutlined />} onClick={saveData} loading={saving}>
            保存
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => setAddPlatformModalOpen(true)}>
            添加平台
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => setAddCityModalOpen(true)}>
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
                <Table.Summary.Cell index={0} colSpan={3}>
                  <strong style={{ color: '#ff4d4f' }}>合计</strong>
                </Table.Summary.Cell>
                {platforms.map((platform, pIdx) => (
                  cities.map((city, cIdx) => (
                    <Table.Summary.Cell key={`${platform.key}_${city.key}`} index={3 + pIdx * cities.length + cIdx}>
                      <strong style={{ color: '#ff4d4f' }}>
                        {data.reduce((sum, r) => sum + (Number(r[`${platform.key}_${city.key}`]) || 0), 0)}
                      </strong>
                    </Table.Summary.Cell>
                  ))
                ))}
                <Table.Summary.Cell index={3 + platforms.length * cities.length}>
                  <strong style={{ color: '#ff4d4f' }}>{total}</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </Card>

        {/* 添加平台模态框 */}
        <Modal
          title="添加新平台"
          open={addPlatformModalOpen}
          onOk={handleAddPlatform}
          onCancel={() => { setAddPlatformModalOpen(false); setNewPlatformLabel(''); }}
          okText="添加"
          cancelText="取消"
        >
          <Input
            placeholder="请输入平台名称（如：前程无忧）"
            value={newPlatformLabel}
            onChange={e => setNewPlatformLabel(e.target.value)}
            onPressEnter={handleAddPlatform}
          />
        </Modal>

        {/* 添加城市模态框 */}
        <Modal
          title="添加新城市"
          open={addCityModalOpen}
          onOk={handleAddCity}
          onCancel={() => { setAddCityModalOpen(false); setNewCityLabel(''); }}
          okText="添加"
          cancelText="取消"
        >
          <Input
            placeholder="请输入城市名称（如：深圳）"
            value={newCityLabel}
            onChange={e => setNewCityLabel(e.target.value)}
            onPressEnter={handleAddCity}
          />
        </Modal>
      </div>
    </Spin>
  );
};

export default NetworkSurveyPage;
