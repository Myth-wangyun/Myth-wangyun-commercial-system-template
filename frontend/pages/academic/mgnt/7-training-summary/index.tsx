//学术 最高议事厅 培训计划与成绩汇总表主页面
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { App, Card, Table, Typography, InputNumber, Button, Space, Spin, Row, Col, Statistic, Alert } from 'antd';
import { SaveOutlined, ReloadOutlined, DownloadOutlined, BookOutlined, UserOutlined, TrophyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getCampusOptions } from '@/config/campusConfig';
import { buildApiUrl } from '@/utils/apiBase';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

type TrainingMetricKey = 'trainingTimes' | 'traineeCount' | 'qualifiedCount' | 'averageScore';

interface CampusTrainingRecord {
  key: string;
  serialNumber: number;
  campus: string;
  trainingTimes: number;
  traineeCount: number;
  qualifiedCount: number;
  averageScore: number;
}

const ManagementTrainingSummary: React.FC = () => {
  const { message } = App.useApp()
  const [year, setYear] = useState<number>(dayjs().year());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<CampusTrainingRecord[]>([]);

  // 初始化神殿行
  const campusOptions = useMemo(() => getCampusOptions(), []);

  // 从后端获取所有神殿的培训数据，并按神殿汇总
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 获取所有神殿的数据
      const results: CampusTrainingRecord[] = [];
      
      for (let i = 0; i < campusOptions.length; i++) {
        const campusName = campusOptions[i].label;
        try {
          const res = await fetch(
            buildApiUrl(`/training-plan-summary?campus=${encodeURIComponent(campusName)}&year=${year}`)
          );
          if (res.ok) {
            const list = await res.json();
            // 汇总该神殿的所有培训记录
            const trainingTimes = list.length;
            const traineeCount = list.reduce((sum: number, item: any) => sum + (item.培训人数 || 0), 0);
            const qualifiedCount = list.reduce((sum: number, item: any) => sum + (item.合格人数 || 0), 0);
            const totalScore = list.reduce((sum: number, item: any) => sum + (item.平均成绩 || 0) * (item.培训人数 || 0), 0);
            const averageScore = traineeCount > 0 ? Number((totalScore / traineeCount).toFixed(1)) : 0;
            
            results.push({
              key: campusName,
              serialNumber: i + 1,
              campus: campusName.replace(/神殿$/, ''),
              trainingTimes,
              traineeCount,
              qualifiedCount,
              averageScore,
            });
          } else {
            // 没有数据时使用默认值
            results.push({
              key: campusName,
              serialNumber: i + 1,
              campus: campusName.replace(/神殿$/, ''),
              trainingTimes: 0,
              traineeCount: 0,
              qualifiedCount: 0,
              averageScore: 0,
            });
          }
        } catch {
          results.push({
            key: campusName,
            serialNumber: i + 1,
            campus: campusName.replace(/神殿$/, ''),
            trainingTimes: 0,
            traineeCount: 0,
            qualifiedCount: 0,
            averageScore: 0,
          });
        }
      }
      
      setData(results);
    } catch (error) {
      console.error('[培训汇总] 加载数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [campusOptions, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleValueChange = (
    recordKey: string,
    field: TrainingMetricKey,
    value: number | null,
  ) => {
    setData(prev =>
      prev.map(row => {
        if (row.key !== recordKey) return row;
        return {
          ...row,
          [field]: typeof value === 'number' ? value : 0,
        };
      }),
    );
  };

  const passRate = (record: CampusTrainingRecord) => {
    const { traineeCount, qualifiedCount } = record;
    if (!traineeCount) return 0;
    return Number(((qualifiedCount / traineeCount) * 100).toFixed(1));
  };

  // 计算统计数据
  const stats = useMemo(() => {
    const totalRecords = data.reduce((sum, row) => sum + row.trainingTimes, 0);
    const totalTrainees = data.reduce((sum, row) => sum + row.traineeCount, 0);
    const totalQualified = data.reduce((sum, row) => sum + row.qualifiedCount, 0);
    const overallPassRate = totalTrainees > 0 ? Number(((totalQualified / totalTrainees) * 100).toFixed(1)) : 0;
    const totalScore = data.reduce((sum, row) => sum + row.averageScore * row.traineeCount, 0);
    const averageScore = totalTrainees > 0 ? Number((totalScore / totalTrainees).toFixed(1)) : 0;
    
    return { totalRecords, totalTrainees, totalQualified, overallPassRate, averageScore };
  }, [data]);

  const averages = useMemo(() => {
    const campusCount = data.length || 1;
    const sum = data.reduce(
      (acc, row) => {
        acc.trainingTimes += row.trainingTimes;
        acc.traineeCount += row.traineeCount;
        acc.qualifiedCount += row.qualifiedCount;
        acc.passRate += passRate(row);
        acc.averageScore += row.averageScore;
        return acc;
      },
      { trainingTimes: 0, traineeCount: 0, qualifiedCount: 0, passRate: 0, averageScore: 0 },
    );

    return {
      trainingTimes: Number((sum.trainingTimes / campusCount).toFixed(1)),
      traineeCount: Number((sum.traineeCount / campusCount).toFixed(1)),
      qualifiedCount: Number((sum.qualifiedCount / campusCount).toFixed(1)),
      passRate: Number((sum.passRate / campusCount).toFixed(1)),
      averageScore: Number((sum.averageScore / campusCount).toFixed(1)),
    };
  }, [data]);

  // 导出CSV
  const handleExport = () => {
    const headers = ['序号', '神殿', '培训次数', '培训人数', '合格人数', '考试合格率(%)', '平均成绩'];
    const rows = data.map(row => [
      row.serialNumber,
      row.campus,
      row.trainingTimes,
      row.traineeCount,
      row.qualifiedCount,
      passRate(row),
      row.averageScore,
    ]);
    const summaryRow = ['平均', '', averages.trainingTimes, averages.traineeCount, averages.qualifiedCount, averages.passRate, averages.averageScore];
    
    const csvContent = [headers, ...rows, summaryRow]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `最高议事厅智慧司培训计划与成绩汇总表_${year}.csv`;
    link.click();
    message.success('导出成功');
  };

  const columns: ColumnsType<CampusTrainingRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 70,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 120,
      fixed: 'left',
      render: value => <Text>{value}</Text>,
    },
    {
      title: '培训次数',
      dataIndex: 'trainingTimes',
      key: 'trainingTimes',
      width: 140,
      align: 'center',
      render: (value) => <Text>{value}</Text>,
    },
    {
      title: '培训人数',
      dataIndex: 'traineeCount',
      key: 'traineeCount',
      width: 140,
      align: 'center',
      render: (value) => <Text>{value}</Text>,
    },
    {
      title: '合格人数',
      dataIndex: 'qualifiedCount',
      key: 'qualifiedCount',
      width: 140,
      align: 'center',
      render: (value) => <Text>{value}</Text>,
    },
    {
      title: '考试合格率',
      key: 'passRate',
      width: 160,
      align: 'center',
      render: (_: unknown, record) => {
        const rate = passRate(record);
        return (
          <Text style={{ color: rate >= 90 ? '#3f8600' : rate >= 80 ? '#fa8c16' : '#cf1322' }}>
            {rate}%
          </Text>
        );
      },
    },
    {
      title: '平均成绩',
      dataIndex: 'averageScore',
      key: 'averageScore',
      width: 160,
      align: 'center',
      render: (value) => (
        <Text style={{ color: value >= 90 ? '#3f8600' : value >= 80 ? '#fa8c16' : '#cf1322' }}>
          {value}
        </Text>
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
        }}
      >
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          <BookOutlined className="me-2" />
          最高议事厅智慧司培训计划与成绩汇总表
        </Title>
        <Text style={{ color: '#fff' }}>
          统计各神殿培训计划实施情况及考试成绩，数据从各神殿自动汇总
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
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出数据
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            刷新数据
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic title="培训记录数" value={stats.totalRecords} prefix={<BookOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic title="总培训人数" value={stats.totalTrainees} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="整体合格率"
              value={stats.overallPassRate}
              suffix="%"
              valueStyle={{
                color: stats.overallPassRate >= 90 ? '#3f8600' : stats.overallPassRate >= 80 ? '#fa8c16' : '#cf1322',
              }}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="平均成绩"
              value={stats.averageScore}
              valueStyle={{
                color: stats.averageScore >= 90 ? '#3f8600' : stats.averageScore >= 80 ? '#fa8c16' : '#cf1322',
              }}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Alert
        style={{ marginBottom: 16 }}
        message="提示"
        description="培训人数与合格人数会自动同步合格率与平均成绩统计"
        type="info"
        showIcon
      />

      <Spin spinning={loading}>
        <Card bordered>
          <Table
            columns={columns}
            dataSource={data}
            pagination={false}
            bordered
            scroll={{ x: 900, y: 600 }}
            sticky
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} align="center">
                    <Text type="danger" strong>
                      平均
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="center">
                    <Text type="danger">&nbsp;</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="center">
                    <Text type="danger">{averages.trainingTimes}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="center">
                    <Text type="danger">{averages.traineeCount}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="center">
                    <Text type="danger">{averages.qualifiedCount}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="center">
                    <Text type="danger">{averages.passRate}%</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} align="center">
                    <Text type="danger">{averages.averageScore}</Text>
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

export default ManagementTrainingSummary;

