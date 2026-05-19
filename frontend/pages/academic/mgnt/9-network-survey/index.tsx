// 学术->最高议事厅 网络调查汇总表主页面 - 从后端API获取数据
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { App, Card, Table, Typography, Space, Button, InputNumber, Tag, Spin, Select } from 'antd';
import { DownloadOutlined, ReloadOutlined, GlobalOutlined, SaveOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '@/services/api';
import { useCampusStore, getCampusNamesWithFallback } from '@/stores/campusStore';
import { sortCampuses } from '@/utils/campusSort';
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
  serialNumber: number; // 同一神殿共享一个序号
  rowSpan?: number; // 神殿首行用于合并单元格
  campus: string;
  major: string;
  isCampusSummary?: boolean;
  [key: string]: string | number | boolean | undefined;
}

// 默认平台配置
const defaultPlatforms: PlatformConfig[] = [
  { key: 'boss', label: 'Boss直聘' },
  { key: 'zhilian', label: '智联招聘' },
];

// 默认城市配置
const defaultCities: CityConfig[] = [
  { key: 'beijing', label: '北京' },
  { key: 'shanghai', label: '上海' },
  { key: 'guangzhou', label: '广州' },
  { key: 'shijiazhuang', label: '石家庄' },
  { key: 'taiyuan', label: '太原' },
  { key: 'nanning', label: '南宁' },
];

const NetworkSurveyPage: React.FC = () => {
  const { message } = App.useApp()
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [data, setData] = useState<NetworkSurveyRecord[]>([]);
  const [platforms, setPlatforms] = useState<PlatformConfig[]>(defaultPlatforms);
  const [cities, setCities] = useState<CityConfig[]>(defaultCities);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [majorsByCampus, setMajorsByCampus] = useState<Record<string, string[]>>({});

  // 从后端获取神殿列表
  const campuses = useCampusStore((state) => state.campuses);

  // 保留完整神殿名称用于数据匹配
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

  // 从配置中心加载“神殿-专业”映射
  useEffect(() => {
    const loadMajors = async () => {
      try {
        const majors = await fetchMajors({ active: true });
        const map: Record<string, string[]> = {};
        majors.forEach(m => {
          const campusName = (m.campus_name || '').replace(/神殿$/, '');
          if (!campusName) return;
          if (!map[campusName]) map[campusName] = [];
          map[campusName].push(m.name);
        });
        // 去重+排序
        Object.keys(map).forEach(k => {
          map[k] = Array.from(new Set(map[k])).sort();
        });
        setMajorsByCampus(map);
      } catch (e) {
        console.error('[网络调研汇总] 加载配置中心专业失败:', e);
        message.warning('加载配置中心专业失败，将仅展示已有数据');
        setMajorsByCampus({});
      }
    };

    loadMajors();
  }, []);

  // 加载数据
  const loadData = useCallback(async () => {
    if (campusNames.length === 0) return;

    setLoading(true);
    try {
      const res = await api.get(`/network-survey-summary/by-year/${year}`, {
        params: { create_if_not_exists: true },
      });
      const { platforms: resPlatforms, cities: resCities, rows } = res.data;

      setPlatforms(resPlatforms || defaultPlatforms);
      setCities(resCities || defaultCities);

      const currentPlatforms = resPlatforms || defaultPlatforms;
      const currentCities = resCities || defaultCities;

      // 转换为表格数据格式（每神殿多专业 + 每神殿一行汇总）
      // 需求：序号对应神殿，相同神殿合并一行大格（序号/神殿列 rowSpan）
      const tableData: NetworkSurveyRecord[] = [];

      campusNames.forEach((campus, campusIndex) => {
        const majorsFromConfig = majorsByCampus[campus] || [];

        // 找到该神殿的所有行（兼容 campus / campus神殿 / 全名）
        const campusRows = (rows || []).filter((r: any) => {
          const rc = (r?.campus || '').replace(/神殿$/, '');
          return rc === campus;
        });

        // 该神殿“可用专业集合” = 配置中心专业 ∪ 现有数据里带回来的专业
        const majorsFromData = campusRows
          .map((r: any) => (r?.major || '').trim())
          .filter((x: string) => !!x);

        const mergedMajors = Array.from(new Set([...majorsFromConfig, ...majorsFromData])).filter(Boolean);

        // 若配置中心/数据都没有专业，则至少渲染一行空专业，避免整神殿空白
        const majorsToRender = mergedMajors.length > 0 ? mergedMajors : [''];

        const campusSerialNumber = campusIndex + 1;
        const campusRowSpan = majorsToRender.length + 1; // +1 为“汇总”行

        // 专业行
        majorsToRender.forEach((major, majorIndex) => {
          const row =
            campusRows.find((r: any) => (r?.major || '') === major) ||
            campusRows.find((r: any) => !r?.major && major === '');
          const rowData = row?.data || {};

          const record: NetworkSurveyRecord = {
            id: `campus-${campusIndex + 1}-major-${majorIndex + 1}`,
            serialNumber: campusSerialNumber,
            rowSpan: majorIndex === 0 ? campusRowSpan : 0, // 只有首行显示并合并
            campus,
            major: major || '',
            isCampusSummary: false,
          };

          currentPlatforms.forEach((platform: PlatformConfig) => {
            currentCities.forEach((city: CityConfig) => {
              const key = `${platform.key}_${city.key}`;
              record[key] = rowData[key] || 0;
            });
          });

          let total = 0;
          currentPlatforms.forEach((platform: PlatformConfig) => {
            currentCities.forEach((city: CityConfig) => {
              total += Number(rowData[`${platform.key}_${city.key}`]) || 0;
            });
          });
          record.total = total;

          tableData.push(record);
        });

        // 神殿汇总行（也要被 rowSpan 合并包含在内；因此序号/神殿在此行 rowSpan=0）
        const summary: NetworkSurveyRecord = {
          id: `campus-${campusIndex + 1}-summary`,
          serialNumber: campusSerialNumber,
          rowSpan: 0,
          campus,
          major: '汇总',
          isCampusSummary: true,
        };

        currentPlatforms.forEach((platform: PlatformConfig) => {
          currentCities.forEach((city: CityConfig) => {
            const key = `${platform.key}_${city.key}`;
            summary[key] = tableData
              .filter(r => r.campus === campus && !r.isCampusSummary)
              .reduce((sum, r) => sum + (Number(r[key]) || 0), 0);
          });
        });
        summary.total = tableData
          .filter(r => r.campus === campus && !r.isCampusSummary)
          .reduce((sum, r) => sum + (Number(r.total) || 0), 0);

        tableData.push(summary);
      });

      setData(tableData);
    } catch (error) {
      console.error('[网络调研汇总] 加载数据失败:', error);
      message.error('加载数据失败');

      // 使用默认空数据（按神殿合并单元格的结构兜底）
      const tableData: NetworkSurveyRecord[] = [];
      campusNames.forEach((campus, campusIndex) => {
        const record: NetworkSurveyRecord = {
          id: `campus-${campusIndex + 1}-major-1`,
          serialNumber: campusIndex + 1,
          rowSpan: 2,
          campus,
          major: '',
          total: 0,
          isCampusSummary: false,
        };
        defaultPlatforms.forEach(platform => {
          defaultCities.forEach(city => {
            record[`${platform.key}_${city.key}`] = 0;
          });
        });
        tableData.push(record);

        const summary: NetworkSurveyRecord = {
          id: `campus-${campusIndex + 1}-summary`,
          serialNumber: campusIndex + 1,
          rowSpan: 0,
          campus,
          major: '汇总',
          total: 0,
          isCampusSummary: true,
        };
        defaultPlatforms.forEach(platform => {
          defaultCities.forEach(city => {
            summary[`${platform.key}_${city.key}`] = 0;
          });
        });
        tableData.push(summary);
      });
      setData(tableData);
    } finally {
      setLoading(false);
    }
  }, [year, campusNames, majorsByCampus]);

  useEffect(() => {
    if (campusNames.length > 0) {
      loadData();
    }
  }, [loadData, campusNames, majorsByCampus]);

  // 保存数据
  const saveData = async () => {
    setSaving(true);
    try {
      const rows: RowData[] = data
        .filter(r => !r.isCampusSummary)
        .map((record) => {
          const rowData: Record<string, number> = {};
          platforms.forEach(platform => {
            cities.forEach(city => {
              const key = `${platform.key}_${city.key}`;
              rowData[key] = Number(record[key]) || 0;
            });
          });
          // 保存时使用完整的神殿名称：优先从 campusFullNames 匹配
          const fullCampusName = campusFullNames.find(n => n.replace(/神殿$/, '') === record.campus) || `${record.campus}神殿`;
          return { campus: fullCampusName, major: record.major || '', data: rowData };
        });

      await api.post('/network-survey-summary/', {
        年份: year,
        platforms,
        cities,
        rows,
      });

      message.success('保存成功');
    } catch (error) {
      console.error('[网络调研汇总] 保存失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 计算行合计（专业行）；神殿汇总行由 loadData 统一计算
  const recompute = (record: NetworkSurveyRecord): NetworkSurveyRecord => {
    if (record.isCampusSummary) return record;
    let total = 0;
    platforms.forEach(platform => {
      cities.forEach(city => {
        total += Number(record[`${platform.key}_${city.key}`]) || 0;
      });
    });
    return { ...record, total };
  };

  const onChangeField = (id: string, key: string, value: number | null) => {
    setData(prev => prev.map(r => {
      if (r.id !== id) return r;
      const next = { ...r, [key]: Number(value || 0) };
      return recompute(next);
    }));
  };

  // 计算列合计
  const totals = useMemo(() => {
    const result: Record<string, number> = { total: 0 };
    platforms.forEach(platform => {
      cities.forEach(city => {
        const key = `${platform.key}_${city.key}`;
        result[key] = data.reduce((sum, r) => sum + (Number(r[key]) || 0), 0);
      });
    });
    result.total = data.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
    return result;
  }, [data, platforms, cities]);

  // 动态生成表格列
  const columns: ColumnsType<NetworkSurveyRecord> = useMemo(() => {
    const cols: ColumnsType<NetworkSurveyRecord> = [
      {
        title: '序号',
        dataIndex: 'serialNumber',
        key: 'serialNumber',
        width: 60,
        align: 'center',
        fixed: 'left',
        onHeaderCell: () => ({ style: { backgroundColor: '#e6f7ff' } }),
        render: (v: any, r: NetworkSurveyRecord) => ({
          children: v,
          props: { rowSpan: r.rowSpan ?? 1 },
        }),
      },
      {
        title: '神殿',
        dataIndex: 'campus',
        key: 'campus',
        width: 80,
        fixed: 'left',
        onHeaderCell: () => ({ style: { backgroundColor: '#e6f7ff' } }),
        render: (v: any, r: NetworkSurveyRecord) => ({
          children: v,
          props: { rowSpan: r.rowSpan ?? 1 },
        }),
      },
      {
        title: '专业',
        dataIndex: 'major',
        key: 'major',
        width: 120,
        fixed: 'left',
        render: (v: any, r: NetworkSurveyRecord) => {
          if (r.isCampusSummary) {
            return <Tag color="gold">神殿汇总</Tag>;
          }
          return <span>{String(v || '')}</span>;
        },
        onHeaderCell: () => ({ style: { backgroundColor: '#e6f7ff' } }),
      },
    ];

    // 为每个平台添加城市子列
    platforms.forEach(platform => {
      cols.push({
        title: platform.label,
        align: 'center',
        children: cities.map(city => ({
          title: city.label,
          dataIndex: `${platform.key}_${city.key}`,
          key: `${platform.key}_${city.key}`,
          width: 90,
          align: 'center' as const,
          render: (_: any, r: NetworkSurveyRecord) => {
            if (r.isCampusSummary) {
              return <Text strong>{Number(r[`${platform.key}_${city.key}`]) || 0}</Text>;
            }
            return (
              <InputNumber
                min={0}
                value={r[`${platform.key}_${city.key}`] as number}
                onChange={v => onChangeField(r.id, `${platform.key}_${city.key}`, v)}
                className="centered-input"
                style={{ width: '100%' }}
                bordered={false}
              />
            );
          },
          onHeaderCell: () => ({ style: { backgroundColor: '#e6f7ff' } }),
        })),
        onHeaderCell: () => ({ style: { backgroundColor: '#e6f7ff' } }),
      });
    });

    // 合计列
    cols.push({
      title: '合计',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      align: 'center',
      render: (v) => <Tag color="blue">{v}</Tag>,
      onHeaderCell: () => ({ style: { backgroundColor: '#e6f7ff' } }),
    });

    return cols;
  }, [platforms, cities]);

  const exportCsv = () => {
    const headers = ['序号', '神殿', '专业'];
    platforms.forEach(platform => {
      cities.forEach(city => {
        headers.push(`${platform.label}-${city.label}`);
      });
    });
    headers.push('合计');

    const rows = data.map(r => {
      const row: (string | number)[] = [r.serialNumber, r.campus, r.major];
      platforms.forEach(platform => {
        cities.forEach(city => {
          row.push(Number(r[`${platform.key}_${city.key}`]) || 0);
        });
      });
      row.push(Number(r.total) || 0);
      return row;
    });

    const totalRow: (string | number)[] = ['合计', '', ''];
    platforms.forEach(platform => {
      cities.forEach(city => {
        totalRow.push(totals[`${platform.key}_${city.key}`] || 0);
      });
    });
    totalRow.push(totals.total || 0);

    const csv = [headers, ...rows, totalRow].map(x => x.map(y => `"${y}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `最高议事厅智慧司网络调查汇总表_${year}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // 年份选项
  const yearOptions = [];
  for (let y = new Date().getFullYear() - 5; y <= new Date().getFullYear() + 1; y++) {
    yearOptions.push({ value: y, label: `${y}年` });
  }

  return (
    <div style={{ padding: 24 }}>
      <style>{`
        .centered-input .ant-input-number-input {
          text-align: center;
        }
      `}</style>
      <div className="mb-4">
        <Title level={2}>
          <GlobalOutlined className="me-2" />
          最高议事厅智慧司网络调查汇总表格
        </Title>
        <Text type="secondary">统计所有神殿不同平台与城市的网络调查数量（序号/神殿列按神殿合并）</Text>
      </div>

      <Space className="mb-4" wrap>
        <span>年份：</span>
        <Select
          value={year}
          onChange={setYear}
          options={yearOptions}
          style={{ width: 100 }}
        />
        <Button type="primary" icon={<SaveOutlined />} onClick={saveData} loading={saving}>
          保存
        </Button>
        <Button icon={<DownloadOutlined />} onClick={exportCsv}>
          导出CSV
        </Button>
        <Button icon={<ReloadOutlined />} onClick={loadData}>
          刷新
        </Button>
      </Space>

      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={false}
            scroll={{ x: 'max-content', y: 600 }}
            sticky
            bordered
            locale={{ emptyText: loading ? '加载中...' : '暂无数据' }}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <div style={{ textAlign: 'center', fontWeight: 600, color: '#ff4d4f' }}>
                    合计
                  </div>
                </Table.Summary.Cell>
                {platforms.map(platform =>
                  cities.map(city => (
                    <Table.Summary.Cell
                      key={`${platform.key}_${city.key}`}
                      index={0}
                      align="center"
                    >
                      <span style={{ color: '#ff4d4f' }}>
                        {totals[`${platform.key}_${city.key}`] || 0}
                      </span>
                    </Table.Summary.Cell>
                  )),
                )}
                <Table.Summary.Cell index={0} align="center">
                  <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{totals.total || 0}</span>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default NetworkSurveyPage;
