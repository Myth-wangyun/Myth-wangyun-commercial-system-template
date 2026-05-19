// 学术->神殿 口碑招生明细汇总表
import React, { useMemo, useState, useEffect } from 'react';
import { App,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCampusStore } from '@/stores/campusStore';

const { Option } = Select;

import { buildApiUrl } from '@/utils/apiBase';

// 教员列表接口类型
interface Teacher {
  id: number;
  name: string;
  campus_code: string;
  is_active: boolean;
  participate_kpi: boolean;
}

// 口碑报名登记数据类型
interface ReputationRegistrationRecord {
  id: string;
  month: number;
  instructorName: string;
  registrantName: string;
  registrationTime: string;
  registrationMajor: string;
  registrationDuration: string;
  receivableTuition: number;
  actualTuition: number;
  exceededClassHours: '是' | '否';
  isStable: '稳定' | '不稳定';
  consultant: string;
  introducerName: string;
  reputationRelationship: string;
  reputationSource: string;
  createdAt?: string;
  updatedAt?: string;
}

// 表单数据类型
interface ReputationRegistrationFormData {
  month: number;
  instructorName: string;
  registrantName: string;
  registrationTime: dayjs.Dayjs | null;
  registrationMajor: string;
  registrationDuration: string;
  receivableTuition: number;
  actualTuition: number;
  exceededClassHours: '是' | '否';
  isStable: '稳定' | '不稳定';
  consultant: string;
  introducerName: string;
  reputationRelationship: string;
  reputationSource: string;
}

const ReputationRegistrationPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore();
  const activeCampus = currentCampus ?? getAllCampuses()[0]?.name ?? '主神殿';
  
  const [instructors, setInstructors] = useState<string[]>([]);
  const [dataSource, setDataSource] = useState<ReputationRegistrationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ReputationRegistrationRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm<ReputationRegistrationFormData>();
  const currentYear = new Date().getFullYear();

  // 从配置中心获取教员列表
  useEffect(() => {
    const loadTeachers = async () => {
      setLoadingTeachers(true);
      try {
        // 直接使用 campus_name 参数（后端 API 使用 campus_name 而非 campus_code）
        const params = new URLSearchParams({
          active: 'true',
          participate_kpi: 'true',
          campus_name: activeCampus,
        });
        
        const res = await fetch(`${buildApiUrl('/config/teachers')}?${params.toString()}`);
        if (res.ok) {
          const teachers: Teacher[] = await res.json();
          const names = teachers
            .filter((t) => t.is_active && t.participate_kpi)
            .map((t) => t.name)
            .sort();
          setInstructors(names.length > 0 ? names : ['暂无教员']);
        } else {
          console.error('获取教员列表失败');
          setInstructors(['暂无教员']);
        }
      } catch (error) {
        console.error('获取教员列表失败:', error);
        setInstructors(['暂无教员']);
      } finally {
        setLoadingTeachers(false);
      }
    };
    loadTeachers();
  }, [activeCampus]);

  // 从后端加载数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          campus: activeCampus,
          year: currentYear.toString(),
        });
        const res = await fetch(`${buildApiUrl('/reputation-registration')}?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.行列表 && data.行列表.length > 0) {
            // 转换后端数据格式到前端格式
            const converted = data.行列表.map((row: any, index: number) => ({
              id: `record-${row.月份}-${row.教员姓名}-${row.报名者姓名}-${index}`,
              month: row.月份,
              instructorName: row.教员姓名,
              registrantName: row.报名者姓名,
              registrationTime: row.报名时间,
              registrationMajor: row.报名专业 || '',
              registrationDuration: row.报名学制 || '',
              receivableTuition: Number(row.应收学费) || 0,
              actualTuition: Number(row.实交学费) || 0,
              exceededClassHours: row.是否过课时 === '是' ? '是' : '否',
              isStable: row.是否稳定 === '稳定' ? '稳定' : '不稳定',
              consultant: row.咨询师 || '',
              introducerName: row.介绍人姓名 || '',
              reputationRelationship: row.口碑介绍关系 || '',
              reputationSource: row.口碑来源 || '',
            }));
            setDataSource(converted);
          } else {
            setDataSource([]);
          }
        } else {
          console.error('加载数据失败:', res.status, await res.text());
          setDataSource([]);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        setDataSource([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeCampus, currentYear]);

  // 搜索过滤：只对原始数据做过滤，placeholder/合计行本来就不是 dataSource 成员
  const filteredData = useMemo(() => {
    if (!searchText.trim()) return dataSource;
    const lower = searchText.toLowerCase();
    return dataSource.filter((item) =>
      item.registrantName.toLowerCase().includes(lower) ||
      item.instructorName.toLowerCase().includes(lower) ||
      item.registrationMajor.toLowerCase().includes(lower) ||
      item.consultant.toLowerCase().includes(lower)
    );
  }, [dataSource, searchText]);

  // 构造表格数据（按月份 × 教员，带占位行 + 当月合计行 + rowSpan）
  const tableData = useMemo(() => {
    const data: any[] = [];

    for (let month = 1; month <= 12; month++) {
      const monthDataSource = filteredData.filter((d) => d.month === month);
      let monthRowCount = 0;
      const monthRows: any[] = [];

      instructors.forEach((instructor) => {
        const instructorData = monthDataSource.filter((d) => d.instructorName === instructor);
        const instructorRowCount = Math.max(1, instructorData.length);
        monthRowCount += instructorRowCount;

        if (instructorData.length > 0) {
          instructorData.forEach((record, index) => {
            monthRows.push({
              ...record,
              key: record.id,
              monthRowSpan: 0,
              instructorRowSpan: index === 0 ? instructorRowCount : 0,
            });
          });
        } else {
          // 占位行：保证每个月每位教员至少有一行
          monthRows.push({
            key: `placeholder-${month}-${instructor}`,
            month,
            instructorName: instructor,
            monthRowSpan: 0,
            instructorRowSpan: 1,
            registrantName: '',
          });
        }
      });

      // 当月合计行
      const totalRow = {
        key: `total-${month}`,
        month,
        instructorName: '合计',
        isTotal: true,
        receivableTuition: monthDataSource.reduce((sum, r) => sum + r.receivableTuition, 0),
        actualTuition: monthDataSource.reduce((sum, r) => sum + r.actualTuition, 0),
        monthRowSpan: 0,
        instructorRowSpan: 1,
      };
      monthRows.push(totalRow);
      monthRowCount += 1;

      // 第一行负责合并“月份”列
      if (monthRows.length > 0) {
        monthRows[0].monthRowSpan = monthRowCount;
      }

      data.push(...monthRows);
    }

    return data;
  }, [filteredData, instructors]);

  // 统计数据（基于过滤后的数据，和当前表格视图保持一致）
  const statistics = {
    totalRegistrations: filteredData.length,
    totalReceivableTuition: filteredData.reduce((sum, item) => sum + item.receivableTuition, 0),
    totalActualTuition: filteredData.reduce((sum, item) => sum + item.actualTuition, 0),
    stableRegistrations: filteredData.filter((item) => item.isStable === '稳定').length,
    exceededClassHours: filteredData.filter((item) => item.exceededClassHours === '是').length,
    monthlyRegistrations: new Set(filteredData.map((item) => item.month)).size,
    averageMonthlyTuition:
      filteredData.length > 0
        ? Math.round(
            filteredData.reduce((sum, item) => sum + item.receivableTuition, 0) /
              filteredData.length
          )
        : 0,
  };

  // 表格列定义
  const columns: any[] = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center' as const,
      onCell: (record: any) => ({ rowSpan: record.monthRowSpan }),
      render: (month: number) => (month ? `${month}月` : ''),
    },
    {
      title: '教员姓名',
      dataIndex: 'instructorName',
      key: 'instructorName',
      width: 120,
      align: 'center' as const,
      onCell: (record: any) => ({ rowSpan: record.instructorRowSpan }),
      render: (name: string, record: any) => {
        if (record.isTotal) {
          return <strong style={{ color: '#ff4d4f' }}>{name}</strong>;
        }
        return name;
      },
    },
    {
      title: '报名者姓名',
      dataIndex: 'registrantName',
      key: 'registrantName',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '报名时间',
      dataIndex: 'registrationTime',
      key: 'registrationTime',
      width: 120,
      align: 'center' as const,
      render: (time: string) => (time ? dayjs(time).format('YYYY.MM.DD') : ''),
    },
    {
      title: '报名专业',
      dataIndex: 'registrationMajor',
      key: 'registrationMajor',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '报名学制',
      dataIndex: 'registrationDuration',
      key: 'registrationDuration',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '应收学费',
      dataIndex: 'receivableTuition',
      key: 'receivableTuition',
      width: 120,
      align: 'center' as const,
      render: (amount: number, record: any) => {
        if (record.isTotal) {
          return (
            <strong style={{ color: '#ff4d4f' }}>
              {amount ? amount.toLocaleString() : 0}
            </strong>
          );
        }
        // 只有真实数据行（有报名者姓名）才显示金额
        if (record.registrantName) {
          return amount ? amount.toLocaleString() : '';
        }
        // 占位行不显示
        return '';
      },
    },
    {
      title: '实交学费',
      dataIndex: 'actualTuition',
      key: 'actualTuition',
      width: 120,
      align: 'center' as const,
      render: (amount: number, record: any) => {
        if (record.isTotal) {
          return (
            <strong style={{ color: '#ff4d4f' }}>
              {amount ? amount.toLocaleString() : 0}
            </strong>
          );
        }
        if (record.registrantName) {
          return amount ? amount.toLocaleString() : '';
        }
        return '';
      },
    },
    {
      title: '是否过课时',
      dataIndex: 'exceededClassHours',
      key: 'exceededClassHours',
      width: 100,
      align: 'center' as const,
      render: (value: string) => {
        if (!value) return '';
        return <Tag color={value === '是' ? 'green' : 'red'}>{value}</Tag>;
      },
    },
    {
      title: '是否稳定',
      dataIndex: 'isStable',
      key: 'isStable',
      width: 100,
      align: 'center' as const,
      render: (value: string) => {
        if (!value) return '';
        return <Tag color={value === '稳定' ? 'green' : 'red'}>{value}</Tag>;
      },
    },
    {
      title: '咨询师',
      dataIndex: 'consultant',
      key: 'consultant',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '介绍人姓名',
      dataIndex: 'introducerName',
      key: 'introducerName',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '口碑介绍关系',
      dataIndex: 'reputationRelationship',
      key: 'reputationRelationship',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '口碑来源',
      dataIndex: 'reputationSource',
      key: 'reputationSource',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_: any, record: any) => {
        // 合计行 & 占位行不允许编辑
        if (record.isTotal || (record.key && String(record.key).startsWith('placeholder-'))) {
          return null;
        }
        if (!record.id) return null;
        return (
          <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            >
              编辑
            </Button>
            <Popconfirm
              title="确定要删除这条记录吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" icon={<DeleteOutlined />} danger size="small">
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  // 处理添加
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (record: ReputationRegistrationRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      registrationTime: record.registrationTime ? dayjs(record.registrationTime) : null,
    });
    setModalVisible(true);
  };

  // 处理删除
  const handleDelete = async (id: string) => {
    try {
      // 从 dataSource 中找到要删除的记录
      const record = dataSource.find((item) => item.id === id);
      if (!record) {
        message.error('记录不存在');
        return;
      }

      // 调用后端 API 删除（如果后端支持按记录ID删除）
      // 注意：当前后端是按月份覆盖保存，所以这里先从前端删除，然后重新保存该月份的数据
      const month = record.month;
      const updatedDataSource = dataSource.filter((item) => item.id !== id);
      
      // 获取该月份的所有记录（删除后的）
      const monthRecords = updatedDataSource.filter((item) => item.month === month);
      
      // 保存该月份的数据（覆盖写入）
      if (monthRecords.length > 0) {
        await saveMonthData(month, monthRecords);
      } else {
        // 如果该月份没有记录了，也要保存空数组以清空该月份的数据
        await saveMonthData(month, []);
      }
      
      setDataSource(updatedDataSource);
    message.success('删除成功');
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  // 保存单个月份的数据到后端
  const saveMonthData = async (month: number, monthRecords: ReputationRegistrationRecord[]) => {
    const payload = {
      神殿名称: activeCampus,
      年份: currentYear,
      月份: month,
      行列表: monthRecords.map((record) => ({
        月份: record.month,
        教员姓名: record.instructorName,
        报名者姓名: record.registrantName,
        报名时间: record.registrationTime,
        报名专业: record.registrationMajor || null,
        报名学制: record.registrationDuration || null,
        应收学费: record.receivableTuition || 0,
        实交学费: record.actualTuition || 0,
        是否过课时: record.exceededClassHours || '否',
        是否稳定: record.isStable || '稳定',
        咨询师: record.consultant || null,
        介绍人姓名: record.introducerName || null,
        口碑介绍关系: record.reputationRelationship || null,
        口碑来源: record.reputationSource || null,
      })),
    };

    const res = await fetch(buildApiUrl('/reputation-registration'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`保存失败: ${errorText}`);
    }

    return await res.json();
  };

  // 处理保存（表单提交）
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const formData: ReputationRegistrationRecord = {
        id: editingRecord?.id || Date.now().toString(),
        month: values.month,
        instructorName: values.instructorName,
        registrantName: values.registrantName,
        registrationTime: values.registrationTime?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
        registrationMajor: values.registrationMajor || '',
        registrationDuration: values.registrationDuration || '',
        receivableTuition: Number(values.receivableTuition) || 0,
        actualTuition: Number(values.actualTuition) || 0,
        exceededClassHours: values.exceededClassHours || '否',
        isStable: values.isStable || '稳定',
        consultant: values.consultant || '',
        introducerName: values.introducerName || '',
        reputationRelationship: values.reputationRelationship || '',
        reputationSource: values.reputationSource || '',
      };

      // 更新本地数据源
      let updatedDataSource: ReputationRegistrationRecord[];
      if (editingRecord) {
        // 编辑：替换现有记录
        updatedDataSource = dataSource.map((item) =>
          item.id === editingRecord.id ? formData : item
        );
      } else {
        // 新增：添加到列表
        updatedDataSource = [...dataSource, formData];
      }

      // 获取该月份的所有记录（包括新添加/编辑的）
      const month = formData.month;
      const monthRecords = updatedDataSource.filter((item) => item.month === month);

      // 保存到后端
      await saveMonthData(month, monthRecords);

      // 更新本地状态
      setDataSource(updatedDataSource);
      message.success(editingRecord ? '更新成功' : '添加成功');
      setModalVisible(false);
      form.resetFields();
      setEditingRecord(null);
    } catch (error) {
      console.error('保存失败:', error);
      message.error(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 保存所有月份数据到服务器
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // 按月份分组保存
      const months = Array.from(new Set(dataSource.map((item) => item.month))).sort();
      
      for (const month of months) {
        const monthRecords = dataSource.filter((item) => item.month === month);
        await saveMonthData(month, monthRecords);
      }

      message.success('所有数据已保存到服务器');
    } catch (error) {
      console.error('保存失败:', error);
      message.error(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setSaving(false);
    }
  };

  // 搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // 稳定率
  const stabilityRate =
    statistics.totalRegistrations > 0
      ? ((statistics.stableRegistrations / statistics.totalRegistrations) * 100).toFixed(1)
      : '0';

  return (
    <div style={{ padding: 24 }}>
      <Card>
        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic
              title="总报名数"
              value={statistics.totalRegistrations}
              suffix="人"
              prefix={<UserOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="应收学费总额"
              value={statistics.totalReceivableTuition}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="实交学费总额"
              value={statistics.totalActualTuition}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="稳定率"
              value={stabilityRate}
              suffix="%"
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic
              title="稳定学员"
              value={statistics.stableRegistrations}
              suffix="人"
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="过课时学员"
              value={statistics.exceededClassHours}
              suffix="人"
              prefix={<CalendarOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="有数据月份"
              value={statistics.monthlyRegistrations}
              suffix="个月"
              prefix={<CalendarOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均学费"
              value={statistics.averageMonthlyTuition}
              prefix={<DollarOutlined />}
            />
          </Col>
        </Row>

        {/* 操作区：新增 + 搜索 */}
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加报名
            </Button>
            <Button
              type="default"
              icon={<DollarOutlined />}
              onClick={handleSaveAll}
              loading={saving}
              disabled={dataSource.length === 0}
            >
              保存到服务器(全部月份)
            </Button>
          </Space>

          <Input.Search
            placeholder="搜索报名者姓名、教员或专业"
            style={{ width: 300 }}
            allowClear
            enterButton={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
          />
        </div>

        {/* 数据表格 */}
        <Table
          columns={columns}
          dataSource={tableData}
          rowKey="key"
          loading={loading}
          scroll={{ x: 2000 }}
          pagination={false}
          bordered
          size="small"
          rowClassName={(record: any) => {
            if (record.isTotal) return 'total-row';
            if (record.key && String(record.key).startsWith('placeholder-')) {
              return 'placeholder-row';
            }
            return '';
          }}
          summary={() => {
            const totalReceivable = filteredData.reduce(
              (sum, item) => sum + item.receivableTuition,
              0
            );
            const totalActual = filteredData.reduce(
              (sum, item) => sum + item.actualTuition,
              0
            );

            return (
              <Table.Summary.Row
                style={{ backgroundColor: '#fff1f0', fontWeight: 'bold' }}
              >
                <Table.Summary.Cell index={0} colSpan={6} align="center">
                  总计
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="center">
                  <strong style={{ color: '#ff4d4f' }}>
                    {totalReceivable.toLocaleString()}
                  </strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} align="center">
                  <strong style={{ color: '#ff4d4f' }}>
                    {totalActual.toLocaleString()}
                  </strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      </Card>

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑口碑报名登记' : '添加口碑报名登记'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            exceededClassHours: '是',
            isStable: '稳定',
            reputationRelationship: '亲戚',
            reputationSource: '在校生提供',
          }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="month"
                label="月份"
                rules={[{ required: true, message: '请选择月份' }]}
              >
                <Select placeholder="请选择月份">
                  {Array.from({ length: 12 }, (_, i) => (
                    <Option key={i + 1} value={i + 1}>
                      {i + 1}月
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="instructorName"
                label="教员姓名"
                rules={[{ required: true, message: '请选择教员姓名' }]}
              >
                <Select 
                  placeholder="请选择教员姓名" 
                  showSearch 
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                  loading={loadingTeachers}
                >
                  {instructors.map((name) => (
                    <Option key={name} value={name}>
                      {name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="registrantName"
                label="报名者姓名"
                rules={[{ required: true, message: '请输入报名者姓名' }]}
              >
                <Input placeholder="请输入报名者姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="registrationTime"
                label="报名时间"
                rules={[{ required: true, message: '请选择报名时间' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="registrationMajor"
                label="报名专业"
                rules={[{ required: true, message: '请输入报名专业' }]}
              >
                <Input placeholder="请输入报名专业" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="registrationDuration"
                label="报名学制"
                rules={[{ required: true, message: '请输入报名学制' }]}
              >
                <Input placeholder="例如：20个月" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="receivableTuition"
                label="应收学费"
                rules={[{ required: true, message: '请输入应收学费' }]}
              >
                <Input type="number" placeholder="请输入应收学费" addonBefore="¥" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="actualTuition"
                label="实交学费"
                rules={[{ required: true, message: '请输入实交学费' }]}
              >
                <Input type="number" placeholder="请输入实交学费" addonBefore="¥" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="exceededClassHours"
                label="是否过课时"
                rules={[{ required: true, message: '请选择是否过课时' }]}
              >
                <Select>
                  <Option value="是">是</Option>
                  <Option value="否">否</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="isStable"
                label="是否稳定"
                rules={[{ required: true, message: '请选择是否稳定' }]}
              >
                <Select>
                  <Option value="稳定">稳定</Option>
                  <Option value="不稳定">不稳定</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="consultant"
                label="咨询师"
                rules={[{ required: true, message: '请输入咨询师' }]}
              >
                <Input placeholder="请输入咨询师" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="introducerName"
                label="介绍人姓名"
                rules={[{ required: true, message: '请输入介绍人姓名' }]}
              >
                <Input placeholder="请输入介绍人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="reputationRelationship"
                label="口碑介绍关系"
                rules={[{ required: true, message: '请选择口碑介绍关系' }]}
              >
                <Select>
                  <Option value="亲戚">亲戚</Option>
                  <Option value="朋友">朋友</Option>
                  <Option value="同事">同事</Option>
                  <Option value="同学">同学</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="reputationSource"
            label="口碑来源"
            rules={[{ required: true, message: '请选择口碑来源' }]}
          >
            <Select>
              <Option value="在校生提供">在校生提供</Option>
              <Option value="毕业生推荐">毕业生推荐</Option>
              <Option value="在职员工推荐">在职员工推荐</Option>
              <Option value="家长推荐">家长推荐</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 行样式（借鉴 github/main 的写法） */}
      <style>{`
        :global(.total-row) {
          background-color: #fff2f0 !important;
          font-weight: bold;
        }
        :global(.placeholder-row) {
          color: rgba(0,0,0,0.25);
        }
      `}</style>
    </div>
  );
};

export default ReputationRegistrationPage;
