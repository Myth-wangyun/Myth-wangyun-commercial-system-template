/**
 * 神殿教化司新生当月维稳明细表组件
 * 显示每个学生的详细信息
 */

import React from 'react';
import { App, Card, Table, Button, Space, Statistic, Row, Col, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  ReloadOutlined, 
  DownloadOutlined, 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  DollarOutlined
} from '@ant-design/icons';
import type { 
  NewStudentStabilityDetailTableProps, 
  NewStudentStabilityDetailRecord 
} from '@/types/new-student-stability-detail';

const NewStudentStabilityDetailTable: React.FC<NewStudentStabilityDetailTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
  onEdit,
  onAdd,
  onDelete
}) => {
  const { message } = App.useApp()
  // 计算统计数据
  const stats = React.useMemo(() => {
    if (data.length === 0) {
      return {
        totalStudents: 0,
        totalTuition: 0,
        totalRefund: 0,
        averageTuition: 0
      };
    }

    const totalStudents = data.length;
    const totalTuition = data.reduce((sum, record) => sum + (record.tuitionFee || 0), 0);
    const totalRefund = data.filter(record => record.refundTime).length;
    const averageTuition = totalStudents > 0 ? totalTuition / totalStudents : 0;

    return {
      totalStudents,
      totalTuition,
      totalRefund,
      averageTuition
    };
  }, [data]);

  const columns: ColumnsType<NewStudentStabilityDetailRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 60,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '班主任姓名',
      dataIndex: 'headTeacherName',
      key: 'headTeacherName',
      width: 100,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '新生姓名',
      dataIndex: 'newStudentName',
      key: 'newStudentName',
      width: 100,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '入学时间',
      dataIndex: 'enrollmentDate',
      key: 'enrollmentDate',
      width: 120,
      align: 'center',
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      width: 120,
      align: 'center',
    },
    {
      title: '学费',
      dataIndex: 'tuitionFee',
      key: 'tuitionFee',
      width: 100,
      align: 'right',
      render: (value) => value ? `¥${value.toLocaleString()}` : '-',
    },
    {
      title: '启航学费',
      dataIndex: 'qihangFee',
      key: 'qihangFee',
      width: 100,
      align: 'right',
      render: (value) => value ? `¥${value.toLocaleString()}` : '-',
    },
    {
      title: '联名发票金额',
      dataIndex: 'unionInvoiceAmount',
      key: 'unionInvoiceAmount',
      width: 120,
      align: 'right',
      render: (value) => value ? `¥${value.toLocaleString()}` : '-',
    },
    {
      title: '补资金额',
      dataIndex: 'supplementAmount',
      key: 'supplementAmount',
      width: 100,
      align: 'right',
      render: (value) => value ? `¥${value.toLocaleString()}` : '-',
    },
    {
      title: '防火责金额',
      dataIndex: 'firePreventionAmount',
      key: 'firePreventionAmount',
      width: 110,
      align: 'right',
      render: (value) => value ? `¥${value.toLocaleString()}` : '-',
    },
    {
      title: '生存金额',
      dataIndex: 'survivalAmount',
      key: 'survivalAmount',
      width: 100,
      align: 'right',
      render: (value) => value ? `¥${value.toLocaleString()}` : '-',
    },
    {
      title: '定存保息',
      dataIndex: 'fixedDepositInterest',
      key: 'fixedDepositInterest',
      width: 100,
      align: 'right',
      render: (value) => value ? `¥${value.toLocaleString()}` : '-',
    },
    {
      title: '定存注资时间',
      dataIndex: 'fixedDepositTime',
      key: 'fixedDepositTime',
      width: 120,
      align: 'center',
      render: (value) => value || '-',
    },
    {
      title: '送考周期',
      dataIndex: 'dormitoryPeriod',
      key: 'dormitoryPeriod',
      width: 100,
      align: 'center',
      render: (value) => value || '-',
    },
    {
      title: '送考延迟',
      dataIndex: 'dormitoryDelay',
      key: 'dormitoryDelay',
      width: 100,
      align: 'center',
      render: (value) => value || '-',
    },
    {
      title: '退费时间',
      dataIndex: 'refundTime',
      key: 'refundTime',
      width: 120,
      align: 'center',
      render: (value) => value || '-',
    },
    {
      title: '退费情况说明',
      dataIndex: 'refundDescription',
      key: 'refundDescription',
      width: 200,
      render: (value) => value || '-',
    },
    {
      title: '定名住宿',
      dataIndex: 'accommodation1',
      key: 'accommodation1',
      width: 100,
      align: 'center',
      render: (value) => value || '-',
    },
    {
      title: '留宿住',
      dataIndex: 'accommodation2',
      key: 'accommodation2',
      width: 100,
      align: 'center',
      render: (value) => value || '-',
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 150,
      render: (value) => value || '-',
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => {
              onDelete(record.key);
              message.success('删除成功');
            }}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
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
                title="总学生数"
                value={stats.totalStudents}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总学费"
                value={stats.totalTuition}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="退费人数"
                value={stats.totalRefund}
                valueStyle={{ color: '#f5222d' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均学费"
                value={stats.averageTuition}
                precision={2}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {campus || '请选择神殿'}神殿教化司新生当月维稳明细表
          </span>
        }
        extra={
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={onAdd}
              disabled={!campus}
            >
              新增
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={onRefresh} 
              loading={loading}
            >
              刷新
            </Button>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={onExport}
              disabled={!campus || data.length === 0}
            >
              导出
            </Button>
          </Space>
        }
        styles={{
          header: {
            backgroundColor: '#ffd700',
            borderBottom: '2px solid #ccc'
          }
        }}
      >
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          bordered
          scroll={{ x: 2500, y: 600 }}
          rowKey="key"
          size="small"
        />
      </Card>
      
      <style>{`
        .ant-card-head {
          background-color: #ffd700 !important;
        }
        .ant-table-thead > tr > th {
          background-color: #ffd700 !important;
          font-weight: bold;
          text-align: center;
          border: 1px solid #d9d9d9;
        }
        .ant-table-tbody > tr > td {
          border: 1px solid #f0f0f0;
        }
        .ant-table-tbody > tr:hover > td {
          background-color: #e6f7ff;
        }
      `}</style>
    </div>
  );
};

export default NewStudentStabilityDetailTable;












