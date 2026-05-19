import React, { useState, useEffect, useCallback } from 'react';
import { App, Card, Table, Space, Typography, DatePicker, Button, Spin } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useCampusStore } from '@/stores/campusStore';
import CampusSelector from '@/components/common/CampusSelector';
import { normalizeCampus } from '@/pages/academic/teaching-content/shared/campusStorage';
import { buildApiUrl } from '@/utils/apiBase';

const { Title, Text } = Typography;

type MonthlySummaryRow = {
  key: string;
  月份: number;
  神殿: string;
  交接人数: number;
  入学人数: number;
  退费人数: number;
  退费率: number | string; // 计算得出
};

type MonthlySummaryData = {
  神殿名称: string;
  年份: number;
  行列表: Array<{
    月份: number;
    交接人数: number;
    入学人数: number;
    退费人数: number;
  }>;
  总数: number;
};

const StudentStabilitySummaryPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore();
  const resolvedCampus = normalizeCampus(currentCampus ?? getAllCampuses()[0]?.name ?? '主神殿');
  const [year, setYear] = useState<number>(dayjs().year());
  const [rows, setRows] = useState<MonthlySummaryRow[]>([]);
  const [loading, setLoading] = useState(false);

  // 计算退费率
  const calculateRefundRate = (退费人数: number, 入学人数: number): number | string => {
    if (!入学人数 || 入学人数 === 0) {
      return '#DIV/0!';
    }
    return Number(((退费人数 / 入学人数) * 100).toFixed(2));
  };

  // 从后端获取数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        buildApiUrl(`/student-stability-monthly-summary?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`)
      );
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: MonthlySummaryData = await res.json();
      
      // 转换为表格行数据
      const tableRows: MonthlySummaryRow[] = (data.行列表 || []).map((item) => ({
        key: `month-${item.月份}`,
        月份: item.月份,
        神殿: resolvedCampus,
        交接人数: item.交接人数 || 0,
        入学人数: item.入学人数 || 0,
        退费人数: item.退费人数 || 0,
        退费率: calculateRefundRate(item.退费人数 || 0, item.入学人数 || 0),
      }));

      // 添加合计行
      const totalRow: MonthlySummaryRow = {
        key: 'total',
        月份: 0,
        神殿: '',
        交接人数: tableRows.reduce((sum, row) => sum + row.交接人数, 0),
        入学人数: tableRows.reduce((sum, row) => sum + row.入学人数, 0),
        退费人数: tableRows.reduce((sum, row) => sum + row.退费人数, 0),
        退费率: calculateRefundRate(
          tableRows.reduce((sum, row) => sum + row.退费人数, 0),
          tableRows.reduce((sum, row) => sum + row.入学人数, 0)
        ),
      };

      setRows([...tableRows, totalRow]);
    } catch (error) {
      console.error('[新生维稳汇总] 获取数据失败:', error);
      message.error('获取新生维稳数据失败');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [resolvedCampus, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: ColumnsType<MonthlySummaryRow> = [
    {
      title: '月份',
      dataIndex: '月份',
      key: '月份',
      width: 80,
      align: 'center',
      render: (value, _record, index) => {
        if (index === rows.length - 1) {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span>;
        }
        return value;
      },
    },
    {
      title: '神殿',
      dataIndex: '神殿',
      key: '神殿',
      width: 120,
      align: 'center',
      render: (value, _record, index) => (index === 0 ? value || resolvedCampus : ''),
    },
    {
      title: '交接人数',
      dataIndex: '交接人数',
      key: '交接人数',
      width: 120,
      align: 'center',
    },
    {
      title: '入学人数',
      dataIndex: '入学人数',
      key: '入学人数',
      width: 120,
      align: 'center',
    },
    {
      title: '退费人数',
      dataIndex: '退费人数',
      key: '退费人数',
      width: 120,
      align: 'center',
    },
    {
      title: '退费率',
      dataIndex: '退费率',
      key: '退费率',
      width: 120,
      align: 'center',
      render: (value) => {
        if (value === '#DIV/0!') {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>#DIV/0!</span>;
        }
        return `${value}%`;
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={2}>
          {resolvedCampus}智慧司新生维稳汇总表
        </Title>
        <Text type="secondary">按神殿+年份从后端自动获取数据</Text>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <CampusSelector useGlobalState showLabel />
        <Space>
          <span>年份</span>
          <DatePicker
            picker="year"
            value={dayjs().year(year)}
            onChange={(d) => setYear(d ? d.year() : year)}
          />
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            刷新
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Card bordered={false}>
          <Table
            bordered
            size="small"
            columns={columns}
            dataSource={rows}
            pagination={false}
            rowKey="key"
            scroll={{ x: 600 }}
          />
        </Card>
      </Spin>
    </div>
  );
};

export default StudentStabilitySummaryPage;
