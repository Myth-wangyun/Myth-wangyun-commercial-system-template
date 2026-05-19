// 学术->最高议事厅->口碑招生汇总表
// 口碑招生汇总表主页面 - 从后端API获取所有神殿汇总数据
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { App, 
  Card, 
  Table, 
  Button, 
  Space, 
  Row,
  Col,
  Statistic,
  Tag,
  Select,
  Spin
} from 'antd';
import { 
  ReloadOutlined,
  SoundOutlined,
  UserAddOutlined,
  DollarOutlined
} from '@ant-design/icons';
import api from '@/services/api';
import { useCampusStore, getCampusNamesWithFallback } from '@/stores/campusStore';
import { sortCampuses } from '@/utils/campusSort';

const { Option } = Select;

// 神殿口碑招生汇总数据类型
interface CampusReputationEnrollmentRecord {
  id: string;
  campus: string; // 神殿
  targetReputationCount: number; // 目标口碑量
  actualReputationCount: number; // 实际口碑量
  targetVisitCount: number; // 目标上门量
  actualVisitCount: number; // 实际上门量
  targetEnrollmentCount: number; // 目标招生人数
  actualEnrollmentCount: number; // 实际招生人数
  targetRevenue: number; // 目标收入
  actualRevenue: number; // 实际收入
}

const CampusReputationEnrollmentPage: React.FC = () => {
  const { message } = App.useApp()
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [dataSource, setDataSource] = useState<CampusReputationEnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // 从后端获取神殿列表
  const campuses = useCampusStore((state) => state.campuses);
  
  // 动态获取神殿名称列表（去掉"神殿"后缀）
  const campusNames = useMemo(() => {
    const campusList = campuses.length > 0
      ? campuses.map(c => c.name)
      : getCampusNamesWithFallback();

    return sortCampuses(campusList).map(name => name.replace(/神殿$/, ''));
  }, [campuses]);

  // 从后端获取数据
  const fetchData = useCallback(async () => {
    if (campusNames.length === 0) return;
    
    setLoading(true);
    try {
      const response = await api.get('/reputation-campus-summary/all-campuses', {
        params: { year }
      });
      
      const backendData = response.data?.数据列表 || [];
      
      // 将后端数据转换为前端格式，并确保所有神殿都有数据
      const records: CampusReputationEnrollmentRecord[] = campusNames.map((campus, index) => {
        const found = backendData.find((item: any) => 
          item.神殿名称 === campus || item.神殿名称 === `${campus}神殿`
        );
        
        return {
          id: `campus-${index + 1}`,
          campus,
          targetReputationCount: found?.目标口碑量 || 0,
          actualReputationCount: found?.实际口碑量 || 0,
          targetVisitCount: found?.目标上门量 || 0,
          actualVisitCount: found?.实际上门量 || 0,
          targetEnrollmentCount: found?.目标招生人数 || 0,
          actualEnrollmentCount: found?.实际招生人数 || 0,
          targetRevenue: found?.目标口碑收入 || 0,
          actualRevenue: found?.实际口碑收入 || 0,
        };
      });
      
      setDataSource(records);
    } catch (error: any) {
      console.error('获取口碑招生汇总数据失败:', error);
      message.error('获取数据失败: ' + (error.response?.data?.detail || error.message));
      // 无数据时显示空表格
      setDataSource(campusNames.map((campus, index) => ({
        id: `campus-${index + 1}`,
        campus,
        targetReputationCount: 0,
        actualReputationCount: 0,
        targetVisitCount: 0,
        actualVisitCount: 0,
        targetEnrollmentCount: 0,
        actualEnrollmentCount: 0,
        targetRevenue: 0,
        actualRevenue: 0,
      })));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, campusNames]);

  // 初始化数据 - 只在 year 或 campusNames 变化时重新获取
  useEffect(() => {
    if (campusNames.length > 0) {
      fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, campusNames]);

  // 表格列定义（严格实现合并列）
  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 70,
      align: 'center' as const,
      fixed: 'left' as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      align: 'center' as const,
      fixed: 'left' as const,
    },
    {
      title: '口碑量',
      key: 'reputationGroup',
      children: [
        {
          title: '目标口碑量',
          dataIndex: 'targetReputationCount',
          key: 'targetReputationCount',
          width: 120,
          align: 'center' as const,
        },
        {
          title: '实际口碑量',
          dataIndex: 'actualReputationCount',
          key: 'actualReputationCount',
          width: 120,
          align: 'center' as const,
          render: (count: number, record: CampusReputationEnrollmentRecord) => {
            const base = record.targetReputationCount || 0;
            const achievement = base > 0 ? (count / base) * 100 : NaN;
            return Number.isNaN(achievement) ? (
              <span>{count}</span>
            ) : (
              <Tag color={achievement >= 100 ? 'green' : achievement >= 80 ? 'orange' : 'red'}>
                {count}
              </Tag>
            );
          },
        },
      ],
    },
    {
      title: '上门量',
      key: 'visitGroup',
      children: [
        {
          title: '目标上门量',
          dataIndex: 'targetVisitCount',
          key: 'targetVisitCount',
          width: 120,
          align: 'center' as const,
        },
        {
          title: '实际上门量',
          dataIndex: 'actualVisitCount',
          key: 'actualVisitCount',
          width: 120,
          align: 'center' as const,
          render: (count: number, record: CampusReputationEnrollmentRecord) => {
            const base = record.targetVisitCount || 0;
            const achievement = base > 0 ? (count / base) * 100 : NaN;
            return Number.isNaN(achievement) ? (
              <span>{count}</span>
            ) : (
              <Tag color={achievement >= 100 ? 'green' : achievement >= 80 ? 'orange' : 'red'}>
                {count}
              </Tag>
            );
          },
        },
      ],
    },
    {
      title: '招生人数',
      key: 'enrollmentGroup',
      children: [
        {
          title: '目标人数',
          dataIndex: 'targetEnrollmentCount',
          key: 'targetEnrollmentCount',
          width: 120,
          align: 'center' as const,
        },
        {
          title: '实际人数',
          dataIndex: 'actualEnrollmentCount',
          key: 'actualEnrollmentCount',
          width: 120,
          align: 'center' as const,
          render: (count: number, record: CampusReputationEnrollmentRecord) => {
            const base = record.targetEnrollmentCount || 0;
            const achievement = base > 0 ? (count / base) * 100 : NaN;
            return Number.isNaN(achievement) ? (
              <span>{count}</span>
            ) : (
              <Tag color={achievement >= 100 ? 'green' : achievement >= 80 ? 'orange' : 'red'}>
                {count}
              </Tag>
            );
          },
        },
      ],
    },
    {
      title: '口碑收入',
      key: 'revenueGroup',
      children: [
        {
          title: '目标收入',
          dataIndex: 'targetRevenue',
          key: 'targetRevenue',
          width: 140,
          align: 'center' as const,
          render: (revenue: number) => `¥${revenue.toLocaleString()}`,
        },
        {
          title: '实际收入',
          dataIndex: 'actualRevenue',
          key: 'actualRevenue',
          width: 140,
          align: 'center' as const,
          render: (revenue: number, record: CampusReputationEnrollmentRecord) => {
            const base = record.targetRevenue || 0;
            const achievement = base > 0 ? (revenue / base) * 100 : NaN;
            return Number.isNaN(achievement) ? (
              <span>¥{revenue.toLocaleString()}</span>
            ) : (
              <Tag color={achievement >= 100 ? 'green' : achievement >= 80 ? 'orange' : 'red'}>
                ¥{revenue.toLocaleString()}
              </Tag>
            );
          },
        },
      ],
    },
  ];

  // 计算统计数据
  const stats = useMemo(() => {
    const totalTargetReputation = dataSource.reduce((sum, item) => sum + item.targetReputationCount, 0);
    const totalActualReputation = dataSource.reduce((sum, item) => sum + item.actualReputationCount, 0);
    const totalTargetVisit = dataSource.reduce((sum, item) => sum + item.targetVisitCount, 0);
    const totalActualVisit = dataSource.reduce((sum, item) => sum + item.actualVisitCount, 0);
    const totalTargetEnrollment = dataSource.reduce((sum, item) => sum + item.targetEnrollmentCount, 0);
    const totalActualEnrollment = dataSource.reduce((sum, item) => sum + item.actualEnrollmentCount, 0);
    const totalTargetRevenue = dataSource.reduce((sum, item) => sum + item.targetRevenue, 0);
    const totalActualRevenue = dataSource.reduce((sum, item) => sum + item.actualRevenue, 0);

    return {
      totalTargetReputation,
      totalActualReputation,
      totalTargetVisit,
      totalActualVisit,
      totalTargetEnrollment,
      totalActualEnrollment,
      totalTargetRevenue,
      totalActualRevenue,
    };
  }, [dataSource]);

  // 年份选项
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear - 5; y <= currentYear + 1; y++) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  return (
    <div style={{ padding: 24 }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="实际口碑量"
              value={stats.totalActualReputation}
              prefix={<SoundOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="实际上门量"
              value={stats.totalActualVisit}
              prefix={<UserAddOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="实际招生人数"
              value={stats.totalActualEnrollment}
              prefix={<UserAddOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="实际收入"
              value={stats.totalActualRevenue}
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
              formatter={(value) => `¥${value?.toLocaleString()}`}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        {/* 操作栏 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <span>年份：</span>
            <Select 
              value={year} 
              onChange={setYear} 
              style={{ width: 120 }}
            >
              {yearOptions.map(y => (
                <Option key={y} value={y}>{y}年</Option>
              ))}
            </Select>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchData}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </div>

        {/* 数据表格 */}
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 1200, y: 600 }}
            sticky
            pagination={false}
            bordered
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} align="center">
                    <strong>合计</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <strong></strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="center">
                    <span style={{ color: '#cf1322' }}>{stats.totalTargetReputation}</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="center">
                    <span style={{ color: '#cf1322' }}>{stats.totalActualReputation}</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="center">
                    <span style={{ color: '#cf1322' }}>{stats.totalTargetVisit}</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="center">
                    <span style={{ color: '#cf1322' }}>{stats.totalActualVisit}</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} align="center">
                    <span style={{ color: '#cf1322' }}>{stats.totalTargetEnrollment}</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7} align="center">
                    <span style={{ color: '#cf1322' }}>{stats.totalActualEnrollment}</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8} align="center">
                    <span style={{ color: '#cf1322' }}>¥{stats.totalTargetRevenue.toLocaleString()}</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={9} align="center">
                    <span style={{ color: '#cf1322' }}>¥{stats.totalActualRevenue.toLocaleString()}</span>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default CampusReputationEnrollmentPage;
