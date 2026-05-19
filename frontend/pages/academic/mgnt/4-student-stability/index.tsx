// 学术->最高议事厅->新生维稳汇总表
// 新生维稳汇总表主页面 - 从后端API获取所有神殿汇总数据
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { App, 
  Card, 
  Table, 
  Button, 
  Select, 
  Space, 
  Row,
  Col,
  Statistic,
  Tag,
  Spin
} from 'antd';
import { 
  ReloadOutlined,
  UserOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import api from '@/services/api';
import { useCampusStore, getCampusNamesWithFallback } from '@/stores/campusStore';
import { sortCampuses } from '@/utils/campusSort';

const { Option } = Select;

// 神殿新生维稳汇总数据类型
interface CampusNewStudentStabilityRecord {
  id: string;
  serialNumber: number; // 序号
  campus: string; // 神殿
  handoverCount: number; // 交接人数
  enrollmentCount: number; // 入学人数
  refundCount: number; // 退费人数
  refundRate: number; // 退费率
}

const CampusNewStudentStabilityPage: React.FC = () => {
  const { message } = App.useApp()
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  
  // 从后端获取神殿列表
  const campuses = useCampusStore((state) => state.campuses);
  
  // 动态获取神殿名称列表（去掉"神殿"后缀）
  const campusNames = useMemo(() => {
    const campusList = campuses.length > 0
      ? campuses.map(c => c.name)
      : getCampusNamesWithFallback();

    return sortCampuses(campusList).map(name => name.replace(/神殿$/, ''));
  }, [campuses]);

  const [dataSource, setDataSource] = useState<CampusNewStudentStabilityRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // 从后端获取数据
  const fetchData = useCallback(async () => {
    if (campusNames.length === 0) return;
    
    setLoading(true);
    try {
      const response = await api.get('/student-stability-monthly-summary/all-campuses', {
        params: { year }
      });
      
      const backendData = response.data?.数据列表 || [];
      
      // 将后端数据转换为前端格式，并确保所有神殿都有数据
      const records: CampusNewStudentStabilityRecord[] = campusNames.map((campus, index) => {
        const found = backendData.find((item: any) => 
          item.神殿名称 === campus || item.神殿名称 === `${campus}神殿`
        );
        
        return {
          id: `campus-${index + 1}`,
          serialNumber: index + 1,
          campus,
          handoverCount: found?.交接人数 || 0,
          enrollmentCount: found?.入学人数 || 0,
          refundCount: found?.退费人数 || 0,
          refundRate: found?.退费率 || 0,
        };
      });
      
      setDataSource(records);
    } catch (error: any) {
      console.error('获取新生维稳汇总数据失败:', error);
      message.error('获取数据失败: ' + (error.response?.data?.detail || error.message));
      // 无数据时显示空表格
      setDataSource(campusNames.map((campus, index) => ({
        id: `campus-${index + 1}`,
        serialNumber: index + 1,
        campus,
        handoverCount: 0,
        enrollmentCount: 0,
        refundCount: 0,
        refundRate: 0,
      })));
    } finally {
      setLoading(false);
    }
  }, [year, campusNames]);

  // 初始化数据
  useEffect(() => {
    if (campusNames.length > 0) {
      fetchData();
    }
  }, [fetchData, campusNames]);

  // 表格列定义
  const columns = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '交接人数',
      dataIndex: 'handoverCount',
      key: 'handoverCount',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '入学人数',
      dataIndex: 'enrollmentCount',
      key: 'enrollmentCount',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '退费人数',
      dataIndex: 'refundCount',
      key: 'refundCount',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '退费率',
      dataIndex: 'refundRate',
      key: 'refundRate',
      width: 120,
      align: 'center' as const,
      render: (rate: number) => {
        if (isNaN(rate) || !isFinite(rate)) {
          return <Tag color="red">#DIV/0!</Tag>;
        }
        return (
          <Tag color={rate <= 5 ? 'green' : rate <= 10 ? 'orange' : 'red'}>
            {rate.toFixed(1)}%
          </Tag>
        );
      },
    },
  ];

  // 计算统计数据
  const stats = React.useMemo(() => {
    const totalHandover = dataSource.reduce((sum, item) => sum + item.handoverCount, 0);
    const totalEnrollment = dataSource.reduce((sum, item) => sum + item.enrollmentCount, 0);
    const totalRefund = dataSource.reduce((sum, item) => sum + item.refundCount, 0);
    const avgRefundRate = totalEnrollment > 0 ? (totalRefund / totalEnrollment) * 100 : 0;

    return {
      totalHandover,
      totalEnrollment,
      totalRefund,
      avgRefundRate,
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
              title="总交接人数"
              value={stats.totalHandover}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总入学人数"
              value={stats.totalEnrollment}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总退费人数"
              value={stats.totalRefund}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均退费率"
              value={stats.avgRefundRate}
              prefix={<WarningOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
              suffix="%"
              precision={1}
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
            scroll={{ x: 800, y: 600 }}
            sticky
            pagination={false}
            bordered
            summary={() => {
              if (!dataSource.length) return null;
              return (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} align="center">
                      <strong>合计</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} />
                    <Table.Summary.Cell index={2} align="center">
                      <strong>{stats.totalHandover}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="center">
                      <strong>{stats.totalEnrollment}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="center">
                      <strong>{stats.totalRefund}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align="center">
                      {
                        isNaN(stats.avgRefundRate) || !isFinite(stats.avgRefundRate) ? (
                          <Tag color="red">#DIV/0!</Tag>
                        ) : (
                          <Tag color={stats.avgRefundRate <= 5 ? 'green' : stats.avgRefundRate <= 10 ? 'orange' : 'red'}>
                            {stats.avgRefundRate.toFixed(1)}%
                          </Tag>
                        )
                      }
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default CampusNewStudentStabilityPage;
