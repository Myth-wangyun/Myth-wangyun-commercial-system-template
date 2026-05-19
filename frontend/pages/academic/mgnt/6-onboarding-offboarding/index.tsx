// 学术->最高议事厅->入职离职汇总表主页面
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { App, Card, Table, Typography, InputNumber, Button, Space, Spin } from 'antd';
import { ReloadOutlined, SaveOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { buildApiUrl } from '@/utils/apiBase';
import { getCampusOptions } from '@/config/campusConfig';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// 从配置获取神殿列表
const CAMPUS_LIST = getCampusOptions().map(c => c.label.replace(/神殿$/, ''));

// 数据类型定义
interface OnboardingOffboardingRecord {
  key: string;
  serialNumber: number;
  campus: string;
  type: 'recruitment' | 'offboarding'; // 实际招聘人数 或 离职人数
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;
}

const MONTH_COLUMNS = [
  { key: 'january', title: '1月' },
  { key: 'february', title: '2月' },
  { key: 'march', title: '3月' },
  { key: 'april', title: '4月' },
  { key: 'may', title: '5月' },
  { key: 'june', title: '6月' },
  { key: 'july', title: '7月' },
  { key: 'august', title: '8月' },
  { key: 'september', title: '9月' },
  { key: 'october', title: '10月' },
  { key: 'november', title: '11月' },
  { key: 'december', title: '12月' },
] as const;

const ManagementOnboardingSummary: React.FC = () => {
  const { message } = App.useApp()
  const [year, setYear] = useState<number>(dayjs().year());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 初始化数据：每个神殿有2行（实际招聘人数、离职人数）
  const createEmptyData = useCallback(() => {
    const data: OnboardingOffboardingRecord[] = [];
    CAMPUS_LIST.forEach((campus, index) => {
      const baseKey = `${campus}-recruitment`;
      const offboardingKey = `${campus}-offboarding`;
      
      // 实际招聘人数行
      data.push({
        key: baseKey,
        serialNumber: index + 1,
        campus,
        type: 'recruitment',
        january: 0,
        february: 0,
        march: 0,
        april: 0,
        may: 0,
        june: 0,
        july: 0,
        august: 0,
        september: 0,
        october: 0,
        november: 0,
        december: 0,
      });
      
      // 离职人数行
      data.push({
        key: offboardingKey,
        serialNumber: index + 1,
        campus,
        type: 'offboarding',
        january: 0,
        february: 0,
        march: 0,
        april: 0,
        may: 0,
        june: 0,
        july: 0,
        august: 0,
        september: 0,
        october: 0,
        november: 0,
        december: 0,
      });
    });
    return data;
  }, []);

  const [data, setData] = useState<OnboardingOffboardingRecord[]>(createEmptyData());

  // 从后端获取数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl(`/onboarding-offboarding-summary/by-year/${year}`));
      if (res.ok) {
        const list = await res.json();
        // 初始化空数据
        const newData = createEmptyData();
        
        // 填充后端数据
        if (Array.isArray(list) && list.length > 0) {
          list.forEach((item: any) => {
            const campusName = item.神殿?.replace(/神殿$/, '') || '';
            const campusData = item.数据 || {};
            
            // 神殿层级格式：数据.rows 数组
            if (campusData.rows && Array.isArray(campusData.rows)) {
              // 从 rows 格式转换
              const recruitmentRow = campusData.rows.find((r: any) => r.key === 4); // 实际招聘人数
              const offboardingRow = campusData.rows.find((r: any) => r.key === 6); // 离职人数
              
              newData.forEach(row => {
                if (row.campus === campusName) {
                  if (row.type === 'recruitment' && recruitmentRow) {
                    // 将 "1月" -> "january" 等映射
                    const monthMap: Record<string, string> = {
                      '1月': 'january', '2月': 'february', '3月': 'march', '4月': 'april',
                      '5月': 'may', '6月': 'june', '7月': 'july', '8月': 'august',
                      '9月': 'september', '10月': 'october', '11月': 'november', '12月': 'december'
                    };
                    Object.entries(recruitmentRow.monthly || {}).forEach(([cnMonth, value]) => {
                      const enMonth = monthMap[cnMonth];
                      if (enMonth) {
                        (row as any)[enMonth] = Number(value) || 0;
                      }
                    });
                  } else if (row.type === 'offboarding' && offboardingRow) {
                    const monthMap: Record<string, string> = {
                      '1月': 'january', '2月': 'february', '3月': 'march', '4月': 'april',
                      '5月': 'may', '6月': 'june', '7月': 'july', '8月': 'august',
                      '9月': 'september', '10月': 'october', '11月': 'november', '12月': 'december'
                    };
                    Object.entries(offboardingRow.monthly || {}).forEach(([cnMonth, value]) => {
                      const enMonth = monthMap[cnMonth];
                      if (enMonth) {
                        (row as any)[enMonth] = Number(value) || 0;
                      }
                    });
                  }
                }
              });
            }
            // 最高议事厅格式：数据.recruitment / 数据.offboarding
            else {
              // 找到对应神殿的行并更新
              newData.forEach(row => {
                if (row.campus === campusName) {
                  const typeKey = row.type === 'recruitment' ? 'recruitment' : 'offboarding';
                  const rowData = campusData[typeKey] || {};
                  
                  MONTH_COLUMNS.forEach(({ key }) => {
                    (row as any)[key] = rowData[key] || 0;
                  });
                }
              });
            }
          });
        }
        
        setData(newData);
      } else {
        setData(createEmptyData());
      }
    } catch (error) {
      console.error('[入职离职汇总] 加载数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [year, createEmptyData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 保存数据到后端
  const handleSave = async () => {
    setSaving(true);
    try {
      // 按神殿分组保存
      const campusDataMap: Record<string, any> = {};
      
      data.forEach(row => {
        if (!campusDataMap[row.campus]) {
          campusDataMap[row.campus] = { recruitment: {}, offboarding: {} };
        }
        
        const typeKey = row.type === 'recruitment' ? 'recruitment' : 'offboarding';
        MONTH_COLUMNS.forEach(({ key }) => {
          campusDataMap[row.campus][typeKey][key] = (row as any)[key] || 0;
        });
      });
      
      // 批量保存每个神殿的数据
      const savePromises = Object.entries(campusDataMap).map(([campus, campusData]) => 
        fetch(buildApiUrl('/onboarding-offboarding-summary'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            神殿: `${campus}神殿`,
            年份: year,
            数据: campusData,
          }),
        })
      );
      
      await Promise.all(savePromises);
      message.success('保存成功');
    } catch (error) {
      console.error('[入职离职汇总] 保存失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 导出CSV
  const handleExport = () => {
    const headers = ['序号', '神殿', '招聘及离职', ...MONTH_COLUMNS.map(m => m.title), '合计'];
    const rows = data.map(row => [
      row.serialNumber,
      row.campus,
      row.type === 'recruitment' ? '实际招聘人数' : '离职人数',
      ...MONTH_COLUMNS.map(({ key }) => (row as any)[key] || 0),
      rowTotal(row),
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `最高议事厅智慧司入职离职汇总表_${year}.csv`;
    link.click();
    message.success('导出成功');
  };

  const handleValueChange = (
    rowKey: string,
    monthKey: keyof OnboardingOffboardingRecord,
    value: number | null
  ) => {
    setData((prev) =>
      prev.map((row) => {
        if (row.key !== rowKey) return row;
        return {
          ...row,
          [monthKey]: typeof value === 'number' ? value : 0,
        };
      })
    );
  };

  // 计算每行合计
  const rowTotal = (record: OnboardingOffboardingRecord) => {
    return MONTH_COLUMNS.reduce((sum, { key }) => sum + (record[key] || 0), 0);
  };

  // 计算每月合计（按“实际招聘人数”和“离职人数”分开）
  const monthlyTotalsByType = useMemo(() => {
    const recruitment = Array(MONTH_COLUMNS.length).fill(0);
    const offboarding = Array(MONTH_COLUMNS.length).fill(0);

    data.forEach((record) => {
      MONTH_COLUMNS.forEach(({ key }, index) => {
        const value = record[key] || 0;
        if (record.type === 'recruitment') {
          recruitment[index] += value;
        } else {
          offboarding[index] += value;
        }
      });
    });

    return { recruitment, offboarding };
  }, [data]);

  const columns: ColumnsType<OnboardingOffboardingRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      align: 'center',
      width: 70,
      fixed: 'left',
      render: (value: number, record: OnboardingOffboardingRecord) => {
        // 只在实际招聘人数行显示序号
        if (record.type === 'recruitment') {
          return <Text>{value}</Text>;
        }
        return '';
      },
      onCell: (record: OnboardingOffboardingRecord) => {
        // 合并单元格：实际招聘人数和离职人数共享序号单元格
        if (record.type === 'recruitment') {
          return { rowSpan: 2 };
        }
        return { rowSpan: 0 };
      },
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      align: 'center',
      width: 120,
      fixed: 'left',
      render: (value: string, record: OnboardingOffboardingRecord) => {
        // 只在实际招聘人数行显示神殿名
        if (record.type === 'recruitment') {
          return <Text>{value}</Text>;
        }
        return '';
      },
      onCell: (record: OnboardingOffboardingRecord) => {
        // 合并单元格：实际招聘人数和离职人数共享神殿单元格
        if (record.type === 'recruitment') {
          return { rowSpan: 2 };
        }
        return { rowSpan: 0 };
      },
    },
    {
      title: '招聘及离职',
      key: 'type',
      width: 120,
      align: 'center',
      render: (_: unknown, record: OnboardingOffboardingRecord) => {
        return (
          <Text>
            {record.type === 'recruitment' ? '实际招聘人数' : '离职人数'}
          </Text>
        );
      },
    },
    ...MONTH_COLUMNS.map(({ key, title }) => ({
      title,
      dataIndex: key,
      key,
      width: 110,
      align: 'center' as const,
      render: (value: number, record: OnboardingOffboardingRecord) => (
        <InputNumber
          value={value}
          min={0}
          precision={0}
          controls={false}
          className="centered-input"
          style={{ width: '100%' }}
          onChange={(val) => handleValueChange(record.key, key, val)}
        />
      ),
    })),
    {
      title: '合计',
      key: 'total',
      width: 120,
      align: 'center',
      fixed: 'right',
      render: (_: unknown, record: OnboardingOffboardingRecord) => (
        <Text strong>{rowTotal(record)}</Text>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <style>{`
        .centered-input .ant-input-number-input {
          text-align: center;
        }
      `}</style>
      <Card
        bordered={false}
        style={{
          marginBottom: 16,
          background: '#f7b500',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          最高议事厅智慧司入职离职汇总表
        </Title>
        <Text style={{ color: '#fff' }}>
          统计各神殿入职离职情况，数据保存到后端数据库
        </Text>
      </Card>

      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Space>
          <span>年份</span>
          <InputNumber
            min={2000}
            max={2100}
            value={year}
            onChange={(v) => setYear(Number(v || dayjs().year()))}
            style={{ width: 100 }}
          />
        </Space>
        <Space>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
            保存数据
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出数据
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            刷新数据
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Card bordered>
          <Table
          columns={columns}
          dataSource={data}
          pagination={false}
          bordered
          scroll={{ x: 1700, y: 600 }}
          sticky
          summary={() => (
            <Table.Summary fixed>
              {/* 第一行：合计 - 实际招聘人数 */}
              <Table.Summary.Row>
                {/* “合计”两行合并显示 */}
                <Table.Summary.Cell index={0} align="center" rowSpan={2}>
                  <Text type="danger" strong>
                    合计
                  </Text>
                </Table.Summary.Cell>
                {/* 神殿列留空，同样合并两行 */}
                <Table.Summary.Cell index={1} rowSpan={2} />
                {/* 招聘及离职列：实际招聘人数 */}
                <Table.Summary.Cell index={2} align="center">
                  <Text>实际招聘人数</Text>
                </Table.Summary.Cell>
                {MONTH_COLUMNS.map(({ key }, index) => (
                  <Table.Summary.Cell index={index + 3} align="center" key={`recruitment-${key}`}>
                    <Text type="danger">
                      {monthlyTotalsByType.recruitment[index] || 0}
                    </Text>
                  </Table.Summary.Cell>
                ))}
                <Table.Summary.Cell index={MONTH_COLUMNS.length + 3} align="center">
                  <Text type="danger">
                    {monthlyTotalsByType.recruitment.reduce((sum, val) => sum + val, 0)}
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>

              {/* 第二行：合计 - 离职人数 */}
              <Table.Summary.Row>
                {/* 与上行合并的单元格占位 */}
                <Table.Summary.Cell index={0} rowSpan={0} />
                <Table.Summary.Cell index={1} rowSpan={0} />
                {/* 招聘及离职列：离职人数 */}
                <Table.Summary.Cell index={2} align="center">
                  <Text>离职人数</Text>
                </Table.Summary.Cell>
                {MONTH_COLUMNS.map(({ key }, index) => (
                  <Table.Summary.Cell index={index + 3} align="center" key={`offboarding-${key}`}>
                    <Text type="danger">
                      {monthlyTotalsByType.offboarding[index] || 0}
                    </Text>
                  </Table.Summary.Cell>
                ))}
                <Table.Summary.Cell index={MONTH_COLUMNS.length + 3} align="center">
                  <Text type="danger">
                    {monthlyTotalsByType.offboarding.reduce((sum, val) => sum + val, 0)}
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
        </Card>
      </Spin>
    </div>
  );
};

export default ManagementOnboardingSummary;
