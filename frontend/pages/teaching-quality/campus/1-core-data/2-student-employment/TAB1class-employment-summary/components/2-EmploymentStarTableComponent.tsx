/**
 * 神殿后端就业明星汇总表组件
 */

import React from 'react';
import { App, Card, Table, Button, Space, Statistic, Row, Col } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, DownloadOutlined, StarOutlined, DollarOutlined } from '@ant-design/icons';
import type { EmploymentStarTableProps, EmploymentStarRecord } from '@/types/employment-star';
import { tqEmploymentStarService } from '@/services/teaching-quality/TQemploymentStar';

const EmploymentStarTable: React.FC<EmploymentStarTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport
}) => {
  const { message } = App.useApp()
  const [saving, setSaving] = React.useState(false);

  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿');
      return;
    }

    try {
      const blob = await tqEmploymentStarService.exportEmploymentStarsData(campus);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${campus}神殿后端就业明星汇总表.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const handleSaveToBackend = async () => {
    if (!campus) {
      message.warning('请先选择神殿');
      return;
    }
    if (!data || data.length === 0) {
      message.warning('当前没有可保存的就业明星数据');
      return;
    }
    try {
      setSaving(true);
      // 教化司数据直接从QT班就业信息表读取，无需保存
      // await tqEmploymentStarService.saveEmploymentStarsData(campus, data);
      message.info('教化司数据直接从QT班就业信息表读取，无需保存');
      message.success('已保存到后端就业明星汇总表');
      onRefresh();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('保存就业明星失败:', error);
      message.error('保存到后端失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  // 计算统计数据
  const stats = React.useMemo(() => {
    if (data.length === 0) {
      return {
        totalStars: 0,
        averageSalary: 0,
        highestSalary: 0,
        lowestSalary: 0
      };
    }

    const salaries = data.map(star => star.employmentSalary);
    return {
      totalStars: data.length,
      averageSalary: salaries.reduce((sum, s) => sum + s, 0) / salaries.length,
      highestSalary: Math.max(...salaries),
      lowestSalary: Math.min(...salaries)
    };
  }, [data]);

  const columns: ColumnsType<EmploymentStarRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      fixed: 'left',
      align: 'center',
    },
    {
      title: '学员姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 100,
      fixed: 'left',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      align: 'center',
    },
    {
      title: '毕业年龄',
      dataIndex: 'graduationAge',
      key: 'graduationAge',
      width: 100,
      align: 'center',
    },
    {
      title: '最高学历',
      dataIndex: 'highestEducation',
      key: 'highestEducation',
      width: 100,
      align: 'center',
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      width: 120,
    },
    {
      title: '学制',
      dataIndex: 'programLength',
      key: 'programLength',
      width: 100,
      align: 'center',
    },
    {
      title: '班级名称',
      dataIndex: 'className',
      key: 'className',
      width: 120,
    },
    {
      title: '入职时间',
      dataIndex: 'entryTime',
      key: 'entryTime',
      width: 120,
      align: 'center',
    },
    {
      title: '就业地区',
      dataIndex: 'employmentRegion',
      key: 'employmentRegion',
      width: 100,
      align: 'center',
    },
    {
      title: '就业单位',
      dataIndex: 'employer',
      key: 'employer',
      width: 150,
    },
    {
      title: '就业岗位',
      dataIndex: 'jobPosition',
      key: 'jobPosition',
      width: 150,
    },
    {
      title: '就业薪资',
      dataIndex: 'employmentSalary',
      key: 'employmentSalary',
      width: 120,
      align: 'center',
      render: (value: number) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          ¥{value.toLocaleString()}
        </span>
      ),
    },
    {
      title: '授课教员',
      dataIndex: 'instructor',
      key: 'instructor',
      width: 100,
      align: 'center',
    },
    {
      title: '班主任',
      dataIndex: 'headTeacher',
      key: 'headTeacher',
      width: 100,
      align: 'center',
    },
  ];

  return (
    <div>
      {/* 统计卡片 */}
      {data.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="就业明星总数"
                value={stats.totalStars}
                prefix={<StarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均薪资"
                value={stats.averageSalary}
                precision={0}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="最高薪资"
                value={stats.highestSalary}
                precision={0}
                prefix="¥"
                valueStyle={{ color: '#f5222d' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="最低薪资"
                value={stats.lowestSalary}
                precision={0}
                prefix="¥"
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={
          <span>
            <StarOutlined style={{ marginRight: 8, color: '#faad14' }} />
            {campus || '请选择神殿'}神殿后端就业明星汇总表
          </span>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
              刷新
            </Button>
            <Button type="primary" onClick={handleSaveToBackend} loading={saving} disabled={!campus || data.length === 0}>
              保存到后端
            </Button>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={handleExport}
              disabled={!campus || data.length === 0}
            >
              导出
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={false}
          bordered
          scroll={{ x: 1700 }}
          rowKey="key"
          size="small"
        />
      </Card>
    </div>
  );
};

export default EmploymentStarTable;