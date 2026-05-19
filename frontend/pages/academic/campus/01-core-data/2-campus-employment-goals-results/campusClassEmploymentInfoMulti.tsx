// 二级-校长表格02QMJY-XS-003 XX神殿智慧司就业目标与结果汇总表
// 清美教育（主神殿）Y32班就业信息表
import React, { useState, useEffect } from 'react';
import { App, 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Space, 
  Popconfirm,
  Row,
  Col,
  Statistic,
  Alert,
  InputNumber,
  Typography,
  DatePicker
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  TeamOutlined,
  DollarOutlined,
  FileTextOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import { type CampusClassEmploymentInfo, type ClassInfo } from '@/types/campusClassEmploymentInfo';
import { 
  fetchClassListByCampus,
  getCampusClassEmploymentInfo, 
  addOrUpdateEmploymentInfo,
  deleteEmploymentInfo,
  getClassInfo
} from '@/services/academic/campusClassEmploymentInfo';
import { getAllCampusNames } from '@/config/campusConfig';
import { useCampusStore } from '@/stores/campusStore';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const CampusClassEmploymentInfoPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, setCampus } = useCampusStore();
  const [classData, setClassData] = useState<Record<string, CampusClassEmploymentInfo[]>>({});
  const [loading, setLoading] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState(currentCampus || '主神殿');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [classList, setClassList] = useState<ClassInfo[]>([]);
  const [editingRecord, setEditingRecord] = useState<CampusClassEmploymentInfo | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (currentCampus && currentCampus !== selectedCampus) {
      setSelectedCampus(currentCampus);
    }
  }, [currentCampus]);

  const loadClassList = async () => {
    try {
      // 从配置中心（后端）获取班级列表，包含“学制”等字段
      const classes = await fetchClassListByCampus(selectedCampus);
      setClassList(classes);
      
      if (classes.length > 0) {
        const validClasses = selectedClasses.filter(cls => classes.some(c => c.name === cls));
        if (validClasses.length === 0) {
          setSelectedClasses([classes[0].name]);
        } else {
          setSelectedClasses(validClasses);
        }
      } else {
        setSelectedClasses([]);
      }
    } catch (error) {
      message.error('加载班级列表失败');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const newData: Record<string, CampusClassEmploymentInfo[]> = {};
      for (const className of selectedClasses) {
        const data = await getCampusClassEmploymentInfo(selectedCampus, className);
        newData[className] = data.map(d => ({ ...d, className }));
      }
      setClassData(newData);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassList();
  }, [selectedCampus]);

  useEffect(() => {
    if (selectedCampus && selectedClasses.length > 0) {
      loadData();
    } else {
      setClassData({});
    }
  }, [selectedCampus, selectedClasses]);

  const handleCampusChange = (campus: string) => {
    setSelectedCampus(campus);
    setCampus(campus);
  };

  const handleClassChange = (classNames: string[]) => {
    if (classNames.includes('select-all')) {
      if (selectedClasses.length === classList.length) {
        setSelectedClasses([]);
      } else {
        setSelectedClasses(classList.map(c => c.name));
      }
      return;
    }
    setSelectedClasses(classNames);
  };

  const handleAddOrEdit = (record?: CampusClassEmploymentInfo) => {
    setEditingRecord(record || null);
    if (record) {
      form.setFieldsValue({
        ...record,
        startDate: record.startDate ? dayjs(record.startDate) : null,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        campus: selectedCampus,
        className: selectedClasses.length === 1 ? selectedClasses[0] : undefined,
        serialNumber: (classData[selectedClasses[0]]?.length || 0) + 1
      });
    }
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const newData = {
        ...values,
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : '',
        campus: selectedCampus,
        className: values.className
      };
      
      addOrUpdateEmploymentInfo(newData);
      message.success(editingRecord ? '更新成功' : '添加成功');
      setIsModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      deleteEmploymentInfo(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const currentClassInfos = selectedClasses.map(className => getClassInfo(selectedCampus, className)).filter((info): info is ClassInfo => info !== null);

  const allStudents = Object.values(classData).flat();
  const stats = {
    totalStudents: allStudents.length,
    averageProbationarySalary: allStudents.length > 0 ? allStudents.reduce((sum, item) => sum + (item.probationarySalary || 0), 0) / allStudents.length : 0,
    averageRegularSalary: allStudents.length > 0 ? allStudents.reduce((sum, item) => sum + (item.regularSalary || 0), 0) / allStudents.length : 0,
    averageFollowUpSalary: allStudents.length > 0 ? allStudents.reduce((sum, item) => sum + (item.followUpAssessmentSalary || 0), 0) / allStudents.length : 0,
  };

  const columns: ColumnsType<CampusClassEmploymentInfo> = [
    { title: '序号', dataIndex: 'serialNumber', key: 'serialNumber', width: 80 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '性别', dataIndex: 'gender', key: 'gender', width: 80 },
    { title: '年龄', dataIndex: 'age', key: 'age', width: 80 },
    { title: '所报专业', dataIndex: 'majorApplied', key: 'majorApplied', width: 120 },
    { title: '学历', dataIndex: 'educationLevel', key: 'educationLevel', width: 100 },
    { title: '过往专业', dataIndex: 'major', key: 'major', width: 150 },
    { title: '毕业学校', dataIndex: 'graduatedSchool', key: 'graduatedSchool', width: 150 },
    { title: '目前所获最高学历证书及性质', dataIndex: 'highestDegreeCertificate', key: 'highestDegreeCertificate', width: 200 },
    { title: '联系电话', dataIndex: 'contactPhone', key: 'contactPhone', width: 120 },
    { title: '通信地址', dataIndex: 'mailingAddress', key: 'mailingAddress', width: 150 },
    { title: '入职时间', dataIndex: 'startDate', key: 'startDate', width: 120 },
    { title: '就业地区', dataIndex: 'employmentRegion', key: 'employmentRegion', width: 100 },
    { title: '就业单位', dataIndex: 'employer', key: 'employer', width: 150 },
    { title: '就业岗位', dataIndex: 'jobPosition', key: 'jobPosition', width: 150 },
    { title: '试用期薪资', dataIndex: 'probationarySalary', key: 'probationarySalary', width: 120, render: (value: number) => value ? `¥${value}` : '-' },
    { title: '转正薪资', dataIndex: 'regularSalary', key: 'regularSalary', width: 120, render: (value: number) => value ? `¥${value}` : '-' },
    { title: '回访情况入职公司', dataIndex: 'followUpCompany', key: 'followUpCompany', width: 150 },
    { title: '回访考核薪资', dataIndex: 'followUpAssessmentSalary', key: 'followUpAssessmentSalary', width: 120, render: (value: number) => value ? `¥${value}` : '-' },
    { title: '操作', key: 'action', width: 120, fixed: 'right', render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleAddOrEdit(record)}>编辑</Button>
          <Popconfirm title="确定要删除这条记录吗？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          {selectedCampus} 就业信息总览
        </Title>
      </div>

      <Card style={{ marginBottom: 16 }}>
        {selectedClasses.length > 1 && (
          <Alert
            message={`当前已选择 ${selectedClasses.length} 个班级，表格将同时展示所有选中班级的数据`}
            type="info"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Space>
              <span>神殿：</span>
              <Select value={selectedCampus} onChange={handleCampusChange} style={{ width: 120 }}>
                {getAllCampusNames().map(campus => (
                  <Option key={campus} value={campus}>{campus}</Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col span={12}>
            <Space>
              <span>班级：</span>
              <Select
                mode="multiple"
                value={selectedClasses}
                onChange={handleClassChange}
                style={{ minWidth: 200, maxWidth: 400 }}
                placeholder="请选择班级（可多选）"
                maxTagCount="responsive"
              >
                <Option key="select-all" value="select-all">全选</Option>
                {classList.map(cls => (
                  <Option key={cls.name} value={cls.name}>{cls.name}</Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => handleAddOrEdit()}
                disabled={selectedClasses.length !== 1}
                title={selectedClasses.length !== 1 ? '添加数据时请只选择一个班级' : ''}
              >
                添加学生就业信息
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card><Statistic title="学生总数" value={stats.totalStudents} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="平均试用期薪资" value={stats.averageProbationarySalary} prefix={<DollarOutlined />} precision={0} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="平均转正薪资" value={stats.averageRegularSalary} prefix={<DollarOutlined />} precision={0} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="平均回访薪资" value={stats.averageFollowUpSalary} prefix={<DollarOutlined />} precision={0} /></Card>
        </Col>
      </Row>

      <div>
        {selectedClasses.map(className => {
          const classInfo = currentClassInfos.find(info => info.name === className);
          const dataSource = classData[className] || [];
          return (
            <Card 
              key={className} 
              title={`${className}班 就业信息表`} 
              style={{ marginBottom: 16 }}
              extra={classInfo ? `学制：${classInfo.programLength || '未设置'} | 专业：${classInfo.major} | 授课教员：${classInfo.instructor} | 班主任：${classInfo.classAdvisor} | 毕业时间：${classInfo.graduationTime || '未设置'}` : ''}
            >
              <Table
                columns={columns}
                dataSource={dataSource}
                loading={loading && dataSource.length === 0}
                pagination={{ pageSize: 10, simple: true }}
                rowKey={(record) => `${record.campus}-${record.className}-${record.id}`}
                scroll={{ x: 2100 }}
                size="small"
                bordered
              />
            </Card>
          );
        })}
      </div>

      <Modal
        title={editingRecord ? '编辑学生就业信息' : '添加学生就业信息'}
        maskClosable={false}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => { setIsModalVisible(false); form.resetFields(); }}
        width={1000}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="className" label="班级" rules={[{ required: true, message: '请选择班级' }]}>
                <Select placeholder="请选择班级" disabled={!!editingRecord}>
                  {classList.map(cls => (
                    <Option key={cls.name} value={cls.name}>{cls.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="serialNumber" label="序号" rules={[{ required: true, message: '请输入序号' }]}>
                <InputNumber min={1} style={{ width: '100%' }} disabled={!!editingRecord} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="gender" label="性别" rules={[{ required: true, message: '请选择性别' }]}>
                <Select placeholder="请选择性别">
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="age" label="年龄" rules={[{ required: true, message: '请输入年龄' }]}>
                <InputNumber min={16} max={50} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="majorApplied" label="所报专业" rules={[{ required: true, message: '请输入所报专业' }]}>
                <Input placeholder="请输入所报专业" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="educationLevel" label="学历" rules={[{ required: true, message: '请选择学历' }]}>
                <Select placeholder="请选择学历">
                  <Option value="专科">专科</Option>
                  <Option value="本科">本科</Option>
                  <Option value="硕士">硕士</Option>
                  <Option value="博士">博士</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="major" label="专业" rules={[{ required: true, message: '请输入专业' }]}>
                <Input placeholder="请输入专业" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="graduatedSchool" label="毕业学校" rules={[{ required: true, message: '请输入毕业学校' }]}>
                <Input placeholder="请输入毕业学校" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="highestDegreeCertificate" label="目前所获最高学历证书及性质" rules={[{ required: true, message: '请输入学历证书信息' }]}>
                <Input placeholder="请输入学历证书信息" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contactPhone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]}>
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="mailingAddress" label="通信地址" rules={[{ required: true, message: '请输入通信地址' }]}>
            <Input placeholder="请输入通信地址" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="startDate" label="入职时间" rules={[{ required: true, message: '请选择入职时间' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="employmentRegion" label="就业地区" rules={[{ required: true, message: '请输入就业地区' }]}>
                <Input placeholder="请输入就业地区" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="employer" label="就业单位" rules={[{ required: true, message: '请输入就业单位' }]}>
                <Input placeholder="请输入就业单位" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="jobPosition" label="就业岗位" rules={[{ required: true, message: '请输入就业岗位' }]}>
                <Input placeholder="请输入就业岗位" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="probationarySalary" label="试用期薪资" rules={[{ required: true, message: '请输入试用期薪资' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="regularSalary" label="转正薪资" rules={[{ required: true, message: '请输入转正薪资' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="followUpCompany" label="回访情况入职公司" rules={[{ required: true, message: '请输入回访情况入职公司' }]}>
                <Input placeholder="请输入回访情况入职公司" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="followUpAssessmentSalary" label="回访考核薪资" rules={[{ required: true, message: '请输入回访考核薪资' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default CampusClassEmploymentInfoPage;
