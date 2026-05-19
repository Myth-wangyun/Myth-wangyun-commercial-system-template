// 学术->最高议事厅->神殿 培训计划与成绩汇总表
import React, { useState, useEffect, useCallback } from 'react';
import { App,
  Card,
  Table,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Tag,
  InputNumber,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Spin,
  AutoComplete,
} from 'antd';
import {
  ReloadOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  UserOutlined,
  TrophyOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useCampusStore } from '@/stores/campusStore';
import CampusSelector from '@/components/common/CampusSelector';
import { normalizeCampus } from '@/pages/academic/teaching-content/shared/campusStorage';
import { buildApiUrl } from '@/utils/apiBase';

const { Title, Text } = Typography;

interface TrainingSummaryRecord {
  id: string;
  serialNumber: number;
  campus: string;
  month: string;
  trainingObjective: string;
  mainContent: string;
  trainingMethod: string;
  personInCharge: string;
  traineeCount: number;
  qualifiedCount: number;
  passRate: number;
  averageScore: number;
}

interface TrainingSummaryStats {
  totalRecords: number;
  totalTrainees: number;
  totalQualified: number;
  overallPassRate: number;
  averageScore: number;
  totalTrainingHours: number;
}

const CampusTrainingSummaryPage: React.FC = () => {
  const { message } = App.useApp()
  const [data, setData] = useState<TrainingSummaryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TrainingSummaryRecord | null>(null);
  const [form] = Form.useForm();
  const [year, setYear] = useState<number>(dayjs().year());
  const { currentCampus, getAllCampuses } = useCampusStore();
  const resolvedCampus = normalizeCampus(currentCampus ?? getAllCampuses()[0]?.name ?? '主神殿');

  // 从后端加载数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        buildApiUrl(`/training-plan-summary?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`)
      );
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length) {
          const records: TrainingSummaryRecord[] = list.map((item: any, idx: number) => ({
            id: String(item.id),
            serialNumber: idx + 1,
            campus: item.神殿名称,
            month: item.月份,
            trainingObjective: item.培训目标 || '',
            mainContent: item.主要内容 || '',
            trainingMethod: item.培训方式 || '',
            personInCharge: item.负责人 || '',
            traineeCount: item.培训人数 || 0,
            qualifiedCount: item.合格人数 || 0,
            passRate: item.考试合格率 || 0,
            averageScore: item.平均成绩 || 0,
          }));
          setData(records);
          return;
        }
      }
      setData([]);
    } catch (error) {
      console.error('[培训计划] 加载数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [resolvedCampus, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculateStats = (): TrainingSummaryStats => {
    if (data.length === 0) {
      return {
        totalRecords: 0,
        totalTrainees: 0,
        totalQualified: 0,
        overallPassRate: 0,
        averageScore: 0,
        totalTrainingHours: 0,
      };
    }

    const totalTrainees = data.reduce((sum, record) => sum + record.traineeCount, 0);
    const totalQualified = data.reduce((sum, record) => sum + record.qualifiedCount, 0);
    const totalScore = data.reduce(
      (sum, record) => sum + record.averageScore * record.traineeCount,
      0,
    );
    const overallPassRate = totalTrainees > 0 ? (totalQualified / totalTrainees) * 100 : 0;
    const averageScore = totalTrainees > 0 ? totalScore / totalTrainees : 0;

    return {
      totalRecords: data.length,
      totalTrainees,
      totalQualified,
      overallPassRate: Number(overallPassRate.toFixed(1)),
      averageScore: Number(averageScore.toFixed(1)),
      totalTrainingHours: data.length * 8,
    };
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      campus: resolvedCampus,
      trainingMethod: '理论+实践',
    });
    setModalVisible(true);
  };

  const handleEdit = (record: TrainingSummaryRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      month: record.month ? dayjs(record.month) : null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(buildApiUrl(`/training-plan-summary/${id}`), {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('删除失败');
      setData(prev => prev.filter(item => item.id !== id));
      message.success('删除成功');
    } catch (error) {
      console.error('[培训计划] 删除失败:', error);
      message.error('删除失败');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const monthStr = values.month ? values.month.format('YYYY-MM') : '';
      const yearNum = monthStr ? parseInt(monthStr.split('-')[0], 10) : year;

      const passRate = values.traineeCount > 0
        ? (values.qualifiedCount / values.traineeCount) * 100
        : 0;

      const payload = {
        神殿名称: resolvedCampus,
        年份: yearNum,
        月份: monthStr,
        培训目标: values.trainingObjective || '',
        主要内容: values.mainContent || '',
        培训方式: values.trainingMethod || '',
        负责人: values.personInCharge || '',
        培训人数: values.traineeCount || 0,
        合格人数: values.qualifiedCount || 0,
        考试合格率: Number(passRate.toFixed(1)),
        平均成绩: values.averageScore || 0,
      };

      let res;
      if (editingRecord) {
        // 更新
        res = await fetch(buildApiUrl(`/training-plan-summary/${editingRecord.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // 创建
        res = await fetch(buildApiUrl('/training-plan-summary'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error(await res.text());
      message.success(editingRecord ? '更新成功' : '添加成功');
      
      // 重新加载数据
      fetchData();

      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    }
  };

  const handleExport = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${resolvedCampus}智慧司培训计划与成绩汇总表_${year}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('导出成功');
  };

  const generateCSV = (): string => {
    const headers = [
      '序号',
      '神殿',
      '月份',
      '培训目标',
      '主要内容',
      '培训方式',
      '负责人',
      '培训人数',
      '合格人数',
      '考试合格率(%)',
      '平均成绩',
    ];

    const rows = data.map(record => [
      record.serialNumber,
      record.campus,
      record.month,
      record.trainingObjective,
      record.mainContent,
      record.trainingMethod,
      record.personInCharge,
      record.traineeCount,
      record.qualifiedCount,
      record.passRate,
      record.averageScore,
    ]);

    const stats = calculateStats();
    const summaryRow = [
      '合计',
      '',
      '',
      '',
      '',
      '',
      '',
      stats.totalTrainees,
      stats.totalQualified,
      stats.overallPassRate,
      stats.averageScore,
    ];

    return [headers, ...rows, summaryRow]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  };

  const columns: ColumnsType<TrainingSummaryRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 60,
      align: 'center',
    },
    { title: '神殿', dataIndex: 'campus', key: 'campus', width: 80, align: 'center' },
    { title: '月份', dataIndex: 'month', key: 'month', width: 100, align: 'center' },
    {
      title: '培训目标',
      dataIndex: 'trainingObjective',
      key: 'trainingObjective',
      width: 150,
      ellipsis: true,
      align: 'center',
    },
    {
      title: '主要内容',
      dataIndex: 'mainContent',
      key: 'mainContent',
      width: 200,
      ellipsis: true,
      align: 'center',
    },
    {
      title: '培训方式',
      dataIndex: 'trainingMethod',
      key: 'trainingMethod',
      width: 120,
      align: 'center',
    },
    { title: '负责人', dataIndex: 'personInCharge', key: 'personInCharge', width: 100, align: 'center' },
    {
      title: '培训人数',
      dataIndex: 'traineeCount',
      key: 'traineeCount',
      width: 100,
      align: 'center',
    },
    {
      title: '合格人数',
      dataIndex: 'qualifiedCount',
      key: 'qualifiedCount',
      width: 100,
      align: 'center',
    },
    {
      title: '考试合格率',
      dataIndex: 'passRate',
      key: 'passRate',
      width: 120,
      align: 'center',
      render: value => (
        <Tag color={value >= 90 ? 'green' : value >= 80 ? 'orange' : 'red'}>{value}%</Tag>
      ),
    },
    {
      title: '平均成绩',
      dataIndex: 'averageScore',
      key: 'averageScore',
      width: 100,
      align: 'center',
      render: value => (
        <Tag color={value >= 90 ? 'green' : value >= 80 ? 'orange' : 'red'}>{value}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            size="small"
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const stats = calculateStats();

  return (
    <div style={{ padding: 24 }}>
      <div className="mb-4">
        <Title level={2}>
          <BookOutlined className="me-2" />
          {resolvedCampus}智慧司培训计划与成绩汇总表
        </Title>
        <Text type="secondary">管理智慧司门培训计划、实施情况和成绩统计，数据保存到后端数据库</Text>
      </div>

      <div className="mb-4" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <CampusSelector useGlobalState showLabel />
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
      </div>

      <Row gutter={[16, 16]} className="mb-4">
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
                color:
                  stats.overallPassRate >= 90
                    ? '#3f8600'
                    : stats.overallPassRate >= 80
                    ? '#fa8c16'
                    : '#cf1322',
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
                color:
                  stats.averageScore >= 90
                    ? '#3f8600'
                    : stats.averageScore >= 80
                    ? '#fa8c16'
                    : '#cf1322',
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
      />

      <div className="mb-4">
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加培训记录
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出数据
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => fetchData()}>
            刷新数据
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1500 }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条记录`,
          }}
          summary={() => {
            if (data.length === 0) return null;
            return (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                  <Table.Summary.Cell index={0} colSpan={7}>
                    <div style={{ textAlign: 'center', color: '#ff4d4f', fontWeight: 'bold' }}>
                      合计
                    </div>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7} align="right">
                    {stats.totalTrainees}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8} align="right">
                    {stats.totalQualified}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={9} align="right">
                    <Tag color={stats.overallPassRate >= 90 ? 'green' : stats.overallPassRate >= 80 ? 'orange' : 'red'}>
                      {stats.overallPassRate}%
                    </Tag>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={10} align="right">
                    <Tag color={stats.averageScore >= 90 ? 'green' : stats.averageScore >= 80 ? 'orange' : 'red'}>
                      {stats.averageScore}
                    </Tag>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={11} colSpan={1} />
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Card>
      </Spin>

      <Modal
        title={editingRecord ? '编辑培训记录' : '添加培训记录'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={800}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            campus: resolvedCampus,
            trainingMethod: '理论+实践',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="campus"
                label="神殿"
                rules={[{ required: true, message: '请输入神殿' }]}
              >
                <Input placeholder="请输入神殿" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="month"
                label="月份"
                rules={[{ required: true, message: '请选择月份' }]}
              >
                <DatePicker picker="month" style={{ width: '100%' }} placeholder="请选择月份" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="trainingObjective" label="培训目标" rules={[{ required: true, message: '请输入培训目标' }]}> 
            <Input placeholder="请输入培训目标" />
          </Form.Item>

          <Form.Item name="mainContent" label="主要内容" rules={[{ required: true, message: '请输入主要内容' }]}> 
            <Input.TextArea rows={3} placeholder="请输入培训的主要内容" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="trainingMethod"
                label="培训方式"
                rules={[{ required: true, message: '请输入或选择培训方式' }]}
              >
                <AutoComplete
                  placeholder="请输入或选择培训方式"
                  options={[
                    { value: '理论+实践' },
                    { value: '集中培训' },
                    { value: '在线培训' },
                    { value: '分组讨论' },
                    { value: '案例分析' },
                    { value: '实操演练' },
                    { value: '现场教学' },
                  ]}
                  filterOption={(inputValue, option) =>
                    option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="personInCharge"
                label="负责人"
                rules={[{ required: true, message: '请输入负责人' }]}
              >
                <Input placeholder="请输入负责人姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="traineeCount"
                label="培训人数"
                rules={[{ required: true, message: '请输入培训人数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入培训人数" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="qualifiedCount"
                label="合格人数"
                rules={[{ required: true, message: '请输入合格人数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入合格人数" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="averageScore"
                label="平均成绩"
                rules={[{ required: true, message: '请输入平均成绩' }]}
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="请输入平均成绩" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default CampusTrainingSummaryPage;

