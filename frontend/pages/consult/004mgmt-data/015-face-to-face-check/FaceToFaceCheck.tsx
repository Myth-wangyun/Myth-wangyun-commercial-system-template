/**
 * 当面标准化检查表页面
 */

import React, { useState, useEffect } from 'react';
import {
  App,
  Card,
  Button,
  Table,
  Form,
  Input,
  Select,
  Modal,
  DatePicker,
  Space,
  Tag,
  Tabs,
  Row,
  Col,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getCheckList,
  createCheck,
  updateCheck,
  deleteCheck,
  type FaceToFaceCheck,
} from '@/services/consult/faceToFaceCheck';
import { NoCopyContainer } from '@/components/common';

const { TextArea } = Input;
const { Option } = Select;

// 当面复盘的咨询步骤模板（固定结构）
const FACE_TO_FACE_STEPS_TEMPLATE = [
  {
    序号: '1',
    步骤名称: '寒暄暖场',
    默认内容: [
      '1、楼下接解决环境问题',
      '2、填表要求（认真跟选拔相关）',
      '3、转神殿，部分金牌专业',
      '4、带到屋子里（破冰建立信任）',
    ],
  },
  {
    序号: '2',
    步骤名称: '广泛提问挖掘需求',
    默认内容: [
      '1、广泛提问问题',
      '2、咨询者的需求',
      '3、家里或者认识的人建议',
      '4、来这里的目的或者上学的目的',
    ],
  },
  {
    序号: '3',
    步骤名称: '分析诊断总结',
    默认内容: [
      '1、诊断造成现状的原因，刺痛20--50岁以上人；',
      '2、堵退路，添堵无路可走',
      '3、继续下去的危害，停止现状，改变现状',
      '4、及时止损，马上入学的好处和意义',
      '5、学生案例（早行动成功案例）',
    ],
  },
  {
    序号: '4',
    步骤名称: '愿景引领（提升认知）',
    默认内容: [
      '1、绝望中给希望（上学目的：幸福生活或者职场五元法）',
      '2、国家政策',
      '3、学生案例',
      '4、假如你学习的结果和不学习的结果对比',
    ],
  },
  {
    序号: '5',
    步骤名称: '专业引导（打破思维，上台阶）',
    默认内容: [
      '1、他喜欢的专业分析',
      '2、帮他梳理正确选择专业的方法（坚定的责任）',
      '3、择校标准和自身对学校的定位',
    ],
  },
  {
    序号: '6',
    步骤名称: '清美学校定位',
    默认内容: [
      '1、要结果还是要过程',
    ],
  },
  {
    序号: '7',
    步骤名称: '清美适合他专业介绍',
    默认内容: [
      '1、前景；',
      '2、用途；',
      '3、学习内容；',
      '4、师资力量；',
      '5、教学方法；',
    ],
  },
  {
    序号: '8',
    步骤名称: '清美优势（满足需求）',
    默认内容: [
      '1.需求如何满足并提升',
      '2.抗拒点1学历         解决方法1',
      '3.抗拒点2是否就业     解决方法2',
      '4.抗拒点3担心学不会   解决方法3',
    ],
  },
  {
    序号: '9',
    步骤名称: '堵退路（贯穿学生案例）',
    默认内容: [
      '1、退路（别地方的危害）',
      '2、退路（继续下去的危害）',
      '3、退路（选择我们的结果）',
    ],
  },
  {
    序号: '10',
    步骤名称: '谋求认同',
    默认内容: ['1、父母认同，孩子认同'],
  },
  {
    序号: '11',
    步骤名称: '再次解除抗拒',
    默认内容: ['1、现在学', '2、学不会', '3、环境'],
  },
  {
    序号: '12',
    步骤名称: '铺垫价位（投资者重要性）',
    默认内容: ['1、价格价值对比', '2、幸福指数'],
  },
  {
    序号: '13',
    步骤名称: '报价关单',
    默认内容: ['1、关单理由123'],
  },
  {
    序号: '14',
    步骤名称: '再次解除抗拒关单（至少7次）',
    默认内容: ['1、学费贵（其他亲属问题）'],
  },
  {
    序号: '15',
    步骤名称: '远程视频连线',
    默认内容: ['分析规划师跟另一半沟通'],
  },
  {
    序号: '16',
    步骤名称: '成交后交接班主任',
    默认内容: ['表、章、注意事项、入学时间、回款时间'],
  },
];

// 步骤数据类型
interface StepData {
  序号: string;
  步骤名称: string;
  内容: string;
  思路关键点: string;  // 预案使用
  领导指正: string;    // 复盘使用
}

// 初始化步骤内容
const initializeSteps = (): StepData[] => {
  return FACE_TO_FACE_STEPS_TEMPLATE.map((step) => ({
    序号: step.序号,
    步骤名称: step.步骤名称,
    内容: step.默认内容.join('\n'),
    思路关键点: '',
    领导指正: '',
  }));
};

const FaceToFaceCheckPage: React.FC = () => {
  const { message, notification, modal } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingCheck, setEditingCheck] = useState<FaceToFaceCheck | null>(null);
  const [viewingCheck, setViewingCheck] = useState<FaceToFaceCheck | null>(null);
  const [checks, setChecks] = useState<FaceToFaceCheck[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [activeTab, setActiveTab] = useState<'预案' | '复盘'>('复盘');
  const [stepsData, setStepsData] = useState<StepData[]>(initializeSteps());
  const [filters, setFilters] = useState({
    student_name: undefined as string | undefined,
    start_date: undefined as string | undefined,
    end_date: undefined as string | undefined,
  });

  // 加载检查表列表
  const loadChecks = async () => {
    setLoading(true);
    try {
      const response = await getCheckList({
        record_type: activeTab,
        ...filters,
        page,
        page_size: pageSize,
      });
      if (response.code === 0) {
        setChecks(response.data.数据列表);
        setTotal(response.data.总记录数);
      }
    } catch (error) {
      message.error('加载列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChecks();
  }, [page, pageSize, activeTab, filters]);

  // 打开新建/编辑模态框
  const handleOpenModal = async (check?: FaceToFaceCheck, type: '预案' | '复盘' = '复盘') => {
    if (check) {
      setEditingCheck(check);
      form.setFieldsValue({
        ...check,
        咨询日期: check.咨询日期 ? dayjs(check.咨询日期) : undefined,
      });
      // 使用保存的步骤内容，如果没有则使用默认模板
      if (check.咨询步骤内容 && check.咨询步骤内容.length > 0) {
        setStepsData(check.咨询步骤内容 as StepData[]);
      } else {
        setStepsData(initializeSteps());
      }
    } else {
      setEditingCheck(null);
      form.resetFields();
      form.setFieldsValue({
        记录类型: type,
        咨询日期: dayjs(),
      });
      setStepsData(initializeSteps());
    }
    setModalVisible(true);
  };

  // 关闭模态框
  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingCheck(null);
    form.resetFields();
    setStepsData(initializeSteps());
  };

  // 查看详情
  const handleView = (check: FaceToFaceCheck) => {
    setViewingCheck(check);
    setViewModalVisible(true);
  };

  // 保存检查表
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      const data = {
        ...values,
        咨询日期: values.咨询日期.format('YYYY-MM-DD HH:mm:ss'),
        咨询步骤内容: stepsData,
      };

      if (editingCheck) {
        await updateCheck({
          ...data,
          记录ID: editingCheck.记录ID,
        });
        notification.success({ message: '已保存', description: '记录更新成功', placement: 'topRight', duration: 3 });
      } else {
        await createCheck(data);
        notification.success({ message: '已创建', description: '记录创建成功', placement: 'topRight', duration: 3 });
      }

      handleCloseModal();
      loadChecks();
    } catch (error) {
      notification.error({ message: '保存失败', description: '请检查网络连接或联系管理员', placement: 'topRight', duration: 4 });
    }
  };

  // 删除检查表
  const handleDelete = async (recordId: number) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      onOk: async () => {
        try {
          await deleteCheck(recordId);
          message.success('删除成功');
          loadChecks();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  // 更新步骤内容
  const handleStepChange = (index: number, field: '内容' | '思路关键点' | '领导指正', value: string) => {
    const newSteps = [...stepsData];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setStepsData(newSteps);
  };

  // 表格列定义
  const columns = [
    {
      title: '咨询日期',
      dataIndex: '咨询日期',
      key: '咨询日期',
      width: 150,
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '学员姓名',
      dataIndex: '学员姓名',
      key: '学员姓名',
      width: 100,
    },
    {
      title: '性别',
      dataIndex: '性别',
      key: '性别',
      width: 60,
    },
    {
      title: '年龄',
      dataIndex: '年龄',
      key: '年龄',
      width: 60,
    },
    {
      title: '状态',
      dataIndex: '状态',
      key: '状态',
      width: 80,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          在读: 'blue',
          应届: 'green',
          待业: 'orange',
          在职: 'purple',
        };
        return status ? <Tag color={colorMap[status] || 'default'}>{status}</Tag> : '-';
      },
    },
    {
      title: '记录类型',
      dataIndex: '记录类型',
      key: '记录类型',
      width: 90,
      render: (type: string) => <Tag color={type === '预案' ? 'blue' : 'green'}>{type}</Tag>,
    },
    {
      title: '创建人',
      dataIndex: '创建人姓名',
      key: '创建人姓名',
      width: 100,
    },
    {
      title: '神殿',
      dataIndex: '神殿',
      key: '神殿',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: '创建时间',
      key: '创建时间',
      width: 150,
      render: (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: unknown, record: FaceToFaceCheck) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenModal(record)}>
            编辑
          </Button>
          {record.记录类型 === '预案' && (
            <Button
              size="small"
              type="primary"
              icon={<FileTextOutlined />}
              onClick={() => handleOpenModal(undefined, '复盘')}
            >
              创建复盘
            </Button>
          )}
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.记录ID!)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 渲染咨询步骤表格（编辑模式）
  const renderStepsTable = () => {
    const stepColumns = [
      {
        title: '咨询步骤',
        dataIndex: '步骤名称',
        key: '步骤名称',
        width: 220,
        render: (text: string, record: StepData) => (
          <div style={{ fontWeight: 500 }}>
            {record.序号}. {text}
          </div>
        ),
      },
      {
        title: '内容',
        dataIndex: '内容',
        key: '内容',
        render: (text: string, _: StepData, index: number) => (
          <TextArea
            value={text}
            onChange={(e) => handleStepChange(index, '内容', e.target.value)}
            autoSize={{ minRows: 2, maxRows: 8 }}
            style={{ width: '100%' }}
          />
        ),
      },
      // 预案模式显示"思路关键点"，复盘模式显示"领导指正"
      {
        title: activeTab === '预案' ? '思路关键点' : '领导指正',
        dataIndex: activeTab === '预案' ? '思路关键点' : '领导指正',
        key: activeTab === '预案' ? '思路关键点' : '领导指正',
        width: 280,
        render: (text: string, _: StepData, index: number) => (
          <TextArea
            value={text}
            onChange={(e) => handleStepChange(index, activeTab === '预案' ? '思路关键点' : '领导指正', e.target.value)}
            autoSize={{ minRows: 2, maxRows: 8 }}
            placeholder={activeTab === '预案' ? '请输入思路关键点' : '领导指正内容'}
            style={{ width: '100%' }}
          />
        ),
      },
    ];

    return (
      <Table
        columns={stepColumns}
        dataSource={stepsData}
        rowKey="序号"
        pagination={false}
        size="small"
        bordered
        style={{ marginTop: 16 }}
      />
    );
  };

  // 渲染查看详情内容
  const renderViewContent = () => {
    if (!viewingCheck) return null;

    const viewStepsData = viewingCheck.咨询步骤内容 || [];
    const stepColumns = [
      {
        title: '咨询步骤',
        dataIndex: '步骤名称',
        key: '步骤名称',
        width: 220,
        render: (text: string, record: StepData) => (
          <div style={{ fontWeight: 500 }}>
            {record.序号}. {text}
          </div>
        ),
      },
      {
        title: '内容',
        dataIndex: '内容',
        key: '内容',
        render: (text: string) => (
          <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div>
        ),
      },
      // 预案显示"思路关键点"，复盘显示"领导指正"
      {
        title: viewingCheck.记录类型 === '预案' ? '思路关键点' : '领导指正',
        dataIndex: viewingCheck.记录类型 === '预案' ? '思路关键点' : '领导指正',
        key: viewingCheck.记录类型 === '预案' ? '思路关键点' : '领导指正',
        width: 280,
        render: (text: string) => (
          <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div>
        ),
      },
    ];

    return (
      <div>
        <Divider orientation="left">基本信息</Divider>
        <Row gutter={[16, 16]}>
          <Col span={8}>咨询日期：{dayjs(viewingCheck.咨询日期).format('YYYY-MM-DD HH:mm')}</Col>
          <Col span={8}>学员姓名：{viewingCheck.学员姓名}</Col>
          <Col span={8}>性别：{viewingCheck.性别 || '-'}</Col>
          <Col span={8}>年龄：{viewingCheck.年龄 || '-'}</Col>
          <Col span={8}>状态：{viewingCheck.状态 || '-'}</Col>
          <Col span={8}>地区：{viewingCheck.地区 || '-'}</Col>
          <Col span={8}>陪同人：{viewingCheck.陪同人 || '-'}</Col>
          <Col span={8}>决策人：{viewingCheck.决策人 || '-'}</Col>
          <Col span={8}>记录类型：{viewingCheck.记录类型}</Col>
          <Col span={12}>需求：{viewingCheck.需求 || '-'}</Col>
          <Col span={12}>关注点：{viewingCheck.关注点 || '-'}</Col>
          <Col span={24}>抗拒点：{viewingCheck.抗拒点 || '-'}</Col>
        </Row>

        <Divider orientation="left">咨询步骤内容</Divider>
        <Table
          columns={stepColumns}
          dataSource={viewStepsData as StepData[]}
          rowKey="序号"
          pagination={false}
          size="small"
          bordered
        />

        {viewingCheck.自我总结 && (
          <>
            <Divider orientation="left">自我总结</Divider>
            <div style={{ whiteSpace: 'pre-wrap' }}>{viewingCheck.自我总结}</div>
          </>
        )}

        {viewingCheck.领导指正 && (
          <>
            <Divider orientation="left">领导总体指正</Divider>
            <div style={{ whiteSpace: 'pre-wrap' }}>{viewingCheck.领导指正}</div>
          </>
        )}
      </div>
    );
  };

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <div className="face-to-face-check-page">
        <Card
          title="当面标准化检查表"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal(undefined, activeTab)}
            >
              新建{activeTab}
            </Button>
          }
        >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as '预案' | '复盘')}
          items={[
            { key: '预案', label: '当面预案' },
            { key: '复盘', label: '当面复盘' },
          ]}
        />

        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="学员姓名"
            style={{ width: 200 }}
            allowClear
            onChange={(e) => setFilters({ ...filters, student_name: e.target.value })}
          />
          <DatePicker
            placeholder="开始日期"
            onChange={(date) => setFilters({ ...filters, start_date: date?.format('YYYY-MM-DD') })}
          />
          <DatePicker
            placeholder="结束日期"
            onChange={(date) => setFilters({ ...filters, end_date: date?.format('YYYY-MM-DD') })}
          />
          <Button type="primary" onClick={loadChecks}>
            搜索
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={checks}
          rowKey="记录ID"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      {/* 新建/编辑模态框 */}
      <Modal
        title={editingCheck ? `编辑${activeTab}` : `新建${activeTab}`}
        open={modalVisible}
        onOk={handleSave}
        onCancel={handleCloseModal}
        width={1200}
        destroyOnClose
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        <Form form={form} layout="vertical">
          <Divider orientation="left">基本信息</Divider>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="咨询日期"
                label="咨询日期"
                rules={[{ required: true, message: '请选择咨询日期' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="学员姓名"
                label="学员姓名"
                rules={[{ required: true, message: '请输入学员姓名' }]}
              >
                <Input placeholder="请输入学员姓名" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="性别" label="性别">
                <Select placeholder="请选择性别">
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="年龄" label="年龄">
                <Input placeholder="年龄" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="状态" label="状态">
                <Select placeholder="请选择状态">
                  <Option value="在读">在读</Option>
                  <Option value="应届">应届</Option>
                  <Option value="待业">待业</Option>
                  <Option value="在职">在职</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="需求" label="需求">
                <Input placeholder="需求" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="关注点" label="关注点">
                <Input placeholder="关注点" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="抗拒点" label="抗拒点">
                <Input placeholder="抗拒点" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="陪同人" label="陪同人">
                <Input placeholder="陪同人" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="决策人" label="决策人">
                <Input placeholder="决策人" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="地区" label="地区">
                <Input placeholder="地区" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="记录类型" hidden>
            <Input />
          </Form.Item>

          <Divider orientation="left">
            咨询步骤（第一列固定，第二列内容可编辑，{activeTab === '预案' ? '第三列填写思路关键点' : '第三列填写领导指正'}）
          </Divider>
          {renderStepsTable()}

          <Divider orientation="left">总结</Divider>
          <Row gutter={16}>
            <Col span={activeTab === '复盘' ? 12 : 24}>
              <Form.Item name="自我总结" label="自我总结">
                <TextArea rows={3} placeholder="自我总结" />
              </Form.Item>
            </Col>
            {activeTab === '复盘' && (
              <Col span={12}>
                <Form.Item name="领导指正" label="领导总体指正">
                  <TextArea rows={3} placeholder="领导总体指正" />
                </Form.Item>
              </Col>
            )}
          </Row>
        </Form>
      </Modal>

      {/* 查看详情模态框 */}
      <Modal
        title="查看详情"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={1200}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {renderViewContent()}
      </Modal>
      </div>
    </NoCopyContainer>
  );
};

export default FaceToFaceCheckPage;
