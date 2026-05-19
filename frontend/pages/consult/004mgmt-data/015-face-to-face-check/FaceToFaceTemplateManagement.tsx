/**
 * 当面标准化检查表模板管理页面
 */

import React, { useState, useEffect } from 'react';
import { App,
  Card,
  Button,
  Table,
  Form,
  Input,
  Select,
  Modal,
  Space,
  Tag,
  Switch,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, StarOutlined } from '@ant-design/icons';
import {
  getTemplateList,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
  type TemplateConfig,
} from '@/services/consult/faceToFaceCheck';
import { NoCopyContainer } from '@/components/common';

const { TextArea } = Input;
const { Option } = Select;

// 默认的预案模板配置（基于图片内容）
const DEFAULT_PLAN_STEPS = [
  {
    分类: '寒暄暖场',
    步骤: [
      { 序号: 1, 内容: '楼下接解决环境问题', 可编辑: true },
      { 序号: 2, 内容: '填表要求（认真跟选拔相关）', 可编辑: true },
      { 序号: 3, 内容: '转神殿，部分金牌专业', 可编辑: true },
      { 序号: 4, 内容: '带到屋子里（破冰建立信任）', 可编辑: true },
    ],
  },
  {
    分类: '广泛提问挖掘需求',
    步骤: [
      { 序号: 1, 内容: '广泛提问问题', 可编辑: true },
      { 序号: 2, 内容: '咨询者的需求', 可编辑: true },
      { 序号: 3, 内容: '家里或者认识的人建议', 可编辑: true },
      { 序号: 4, 内容: '来这里的目的或者上学的目的', 可编辑: true },
    ],
  },
  {
    分类: '分析诊断总结',
    步骤: [
      { 序号: 1, 内容: '诊断治病，造成现状原因，刺痛20--50岁以上人；', 可编辑: true },
      { 序号: 2, 内容: '堵退路，添堵无路可走', 可编辑: true },
      { 序号: 3, 内容: '继续下去的危害，停止现状，改变现状', 可编辑: true },
      { 序号: 4, 内容: '及时止损，马上入学的好处和意义', 可编辑: true },
      { 序号: 5, 内容: '学生案例（早行动成功案例）', 可编辑: true },
    ],
  },
  {
    分类: '愿景引领（提升认知）',
    步骤: [
      { 序号: 1, 内容: '绝望中给希望（上学目的：幸福生活或者职场五元法）', 可编辑: true },
      { 序号: 2, 内容: '国家政策', 可编辑: true },
      { 序号: 3, 内容: '学生案例', 可编辑: true },
      { 序号: 4, 内容: '假如你学习的结果和不学习的结果对比', 可编辑: true },
    ],
  },
  {
    分类: '专业引导（打破思维，上台阶）',
    步骤: [
      { 序号: 1, 内容: '他喜欢的专业分析', 可编辑: true },
      { 序号: 2, 内容: '帮他梳理正确选择专业的方法（坚定的责任）', 可编辑: true },
      { 序号: 3, 内容: '择校标准和自身对学校的定位', 可编辑: true },
    ],
  },
  {
    分类: '清美学校定位',
    步骤: [{ 序号: 1, 内容: '要结果还是要过程', 可编辑: true }],
  },
  {
    分类: '清美适合他专业介绍',
    步骤: [
      { 序号: 1, 内容: '前景；', 可编辑: true },
      { 序号: 2, 内容: '用途；', 可编辑: true },
      { 序号: 3, 内容: '学习内容；', 可编辑: true },
      { 序号: 4, 内容: '师资力量；', 可编辑: true },
      { 序号: 5, 内容: '教学方法；', 可编辑: true },
    ],
  },
  {
    分类: '清美优势（满足需求）',
    步骤: [
      { 序号: 1, 内容: '需求如何满足并提升', 可编辑: true },
      { 序号: 2, 内容: '抗拒点1学历         解决方法1', 可编辑: true },
      { 序号: 3, 内容: '抗拒点2是否就业     解决方法2', 可编辑: true },
      { 序号: 4, 内容: '抗拒点3担心学不会   解决方法3', 可编辑: true },
    ],
  },
  {
    分类: '堵退路（贯穿学生案例）',
    步骤: [
      { 序号: 1, 内容: '退路（别地方的危害）', 可编辑: true },
      { 序号: 2, 内容: '退路（继续下去的危害）', 可编辑: true },
      { 序号: 3, 内容: '退路（选择我们的结果）', 可编辑: true },
    ],
  },
  {
    分类: '谋求认同',
    步骤: [{ 序号: 1, 内容: '父母认同，孩子认同', 可编辑: true }],
  },
  {
    分类: '再次解除抗拒',
    步骤: [
      { 序号: 1, 内容: '现在学', 可编辑: true },
      { 序号: 2, 内容: '学不会', 可编辑: true },
      { 序号: 3, 内容: '环境', 可编辑: true },
    ],
  },
  {
    分类: '铺垫价位（投资者重要性）',
    步骤: [
      { 序号: 1, 内容: '价格价值对比', 可编辑: true },
      { 序号: 2, 内容: '幸福指数', 可编辑: true },
    ],
  },
  {
    分类: '报价关单',
    步骤: [{ 序号: 1, 内容: '关单理由123', 可编辑: true }],
  },
  {
    分类: '再次解除抗拒关单（至少7次）',
    步骤: [{ 序号: 1, 内容: '学费贵（其他亲属问题）', 可编辑: true }],
  },
  {
    分类: '远程视频连线',
    步骤: [{ 序号: 1, 内容: '分析规划师跟另一半沟通', 可编辑: true }],
  },
  {
    分类: '成交后交接班主任',
    步骤: [
      { 序号: 1, 内容: '表、章、注意事项、入学时间、回款时间', 可编辑: true },
    ],
  },
];

// 默认的复盘模板配置
const DEFAULT_REVIEW_STEPS = [
  {
    分类: '寒暄暖场',
    步骤: [
      { 序号: 1, 内容: '楼下接解决环境问题', 可编辑: true, 领导指正: '' },
      { 序号: 2, 内容: '填表要求（认真跟选拔相关）', 可编辑: true, 领导指正: '' },
      { 序号: 3, 内容: '转神殿，部分金牌专业', 可编辑: true, 领导指正: '' },
      { 序号: 4, 内容: '带到屋子里（破冰建立信任）', 可编辑: true, 领导指正: '' },
    ],
  },
  {
    分类: '广泛提问挖掘需求',
    步骤: [
      { 序号: 1, 内容: '广泛提问问题', 可编辑: true, 领导指正: '' },
      { 序号: 2, 内容: '咨询者的需求', 可编辑: true, 领导指正: '' },
      { 序号: 3, 内容: '家里或者认识的人建议', 可编辑: true, 领导指正: '' },
      { 序号: 4, 内容: '来这里的目的或者上学的目的', 可编辑: true, 领导指正: '' },
    ],
  },
  {
    分类: '分析诊断总结',
    步骤: [
      { 序号: 1, 内容: '诊断治病，造成现状原因，刺痛20--50岁以上人；', 可编辑: true, 领导指正: '' },
      { 序号: 2, 内容: '堵退路，添堵无路可走', 可编辑: true, 领导指正: '' },
      { 序号: 3, 内容: '继续下去的危害，停止现状，改变现状', 可编辑: true, 领导指正: '' },
      { 序号: 4, 内容: '及时止损，马上入学的好处和意义', 可编辑: true, 领导指正: '' },
      { 序号: 5, 内容: '学生案例（早行动成功案例）', 可编辑: true, 领导指正: '' },
    ],
  },
  {
    分类: '愿景引领（提升认知）',
    步骤: [
      { 序号: 1, 内容: '绝望中给希望（上学目的：幸福生活或者职场五元法）', 可编辑: true, 领导指正: '' },
      { 序号: 2, 内容: '国家政策', 可编辑: true, 领导指正: '' },
      { 序号: 3, 内容: '学生案例', 可编辑: true, 领导指正: '' },
      { 序号: 4, 内容: '假如你学习的结果和不学习的结果对比', 可编辑: true, 领导指正: '' },
    ],
  },
  {
    分类: '专业引导（打破思维，上台阶）',
    步骤: [
      { 序号: 1, 内容: '他喜欢的专业分析', 可编辑: true, 领导指正: '' },
      { 序号: 2, 内容: '帮他梳理正确选择专业的方法（坚定的责任）', 可编辑: true, 领导指正: '' },
      { 序号: 3, 内容: '择校标准和自身对学校的定位', 可编辑: true, 领导指正: '' },
    ],
  },
  {
    分类: '清美学校定位',
    步骤: [{ 序号: 1, 内容: '要结果还是要过程', 可编辑: true, 领导指正: '' }],
  },
  {
    分类: '清美适合他专业介绍',
    步骤: [
      { 序号: 1, 内容: '前景；', 可编辑: true, 领导指正: '' },
      { 序号: 2, 内容: '用途；', 可编辑: true, 领导指正: '' },
      { 序号: 3, 内容: '学习内容；', 可编辑: true, 领导指正: '' },
      { 序号: 4, 内容: '师资力量；', 可编辑: true, 领导指正: '' },
      { 序号: 5, 内容: '教学方法；', 可编辑: true, 领导指正: '' },
    ],
  },
  {
    分类: '清美优势（满足需求）',
    步骤: [
      { 序号: 1, 内容: '需求如何满足并提升', 可编辑: true, 领导指正: '' },
      { 序号: 2, 内容: '抗拒点1学历         解决方法1', 可编辑: true, 领导指正: '' },
      { 序号: 3, 内容: '抗拒点2是否就业     解决方法2', 可编辑: true, 领导指正: '' },
      { 序号: 4, 内容: '抗拒点3担心学不会   解决方法3', 可编辑: true, 领导指正: '' },
    ],
  },
  {
    分类: '堵退路（贯穿学生案例）',
    步骤: [
      { 序号: 1, 内容: '退路（别地方的危害）', 可编辑: true, 领导指正: '' },
      { 序号: 2, 内容: '退路（继续下去的危害）', 可编辑: true, 领导指正: '' },
      { 序号: 3, 内容: '退路（选择我们的结果）', 可编辑: true, 领导指正: '' },
    ],
  },
  {
    分类: '谋求认同',
    步骤: [{ 序号: 1, 内容: '父母认同，孩子认同', 可编辑: true, 领导指正: '' }],
  },
  {
    分类: '再次解除抗拒',
    步骤: [
      { 序号: 1, 内容: '现在学', 可编辑: true, 领导指正: '' },
      { 序号: 2, 内容: '学不会', 可编辑: true, 领导指正: '' },
      { 序号: 3, 内容: '环境', 可编辑: true, 领导指正: '' },
    ],
  },
  {
    分类: '铺垫价位（投资者重要性）',
    步骤: [
      { 序号: 1, 内容: '价格价值对比', 可编辑: true, 领导指正: '' },
      { 序号: 2, 内容: '幸福指数', 可编辑: true, 领导指正: '' },
    ],
  },
  {
    分类: '报价关单',
    步骤: [{ 序号: 1, 内容: '关单理由123', 可编辑: true, 领导指正: '' }],
  },
  {
    分类: '再次解除抗拒关单（至少7次）',
    步骤: [{ 序号: 1, 内容: '学费贵（其他亲属问题）', 可编辑: true, 领导指正: '' }],
  },
  {
    分类: '远程视频连线',
    步骤: [{ 序号: 1, 内容: '分析规划师跟另一半沟通', 可编辑: true, 领导指正: '' }],
  },
  {
    分类: '成交后交接班主任',
    步骤: [
      { 序号: 1, 内容: '表、章、注意事项、入学时间、回款时间', 可编辑: true, 领导指正: '' },
    ],
  },
];

const TemplateManagement: React.FC = () => {
  const { message } = App.useApp()
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateConfig | null>(null);
  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    template_type: undefined as string | undefined,
    is_enabled: undefined as number | undefined,
  });

  // 加载模板列表
  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await getTemplateList({
        ...filters,
        page,
        page_size: pageSize,
      });
      if (response.code === 0) {
        setTemplates(response.data.数据列表);
        setTotal(response.data.总记录数);
      }
    } catch (error) {
      message.error('加载模板列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [page, pageSize, filters]);

  // 打开新建/编辑模态框
  const handleOpenModal = (template?: TemplateConfig) => {
    if (template) {
      setEditingTemplate(template);
      form.setFieldsValue(template);
    } else {
      setEditingTemplate(null);
      form.resetFields();
      // 设置默认值
      form.setFieldsValue({
        是否启用: 1,
        是否默认: 0,
        排序序号: 0,
      });
    }
    setModalVisible(true);
  };

  // 关闭模态框
  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingTemplate(null);
    form.resetFields();
  };

  // 保存模板
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // 根据模板类型设置默认配置
      if (!values.咨询步骤配置 || values.咨询步骤配置.length === 0) {
        if (values.模板类型 === '预案') {
          values.咨询步骤配置 = DEFAULT_PLAN_STEPS;
        } else {
          values.咨询步骤配置 = DEFAULT_REVIEW_STEPS;
        }
      }

      if (editingTemplate) {
        // 更新
        await updateTemplate({
          ...values,
          模板ID: editingTemplate.模板ID,
        });
        message.success('更新成功');
      } else {
        // 新建
        await createTemplate(values);
        message.success('创建成功');
      }

      handleCloseModal();
      loadTemplates();
    } catch (error) {
      message.error('保存失败');
    }
  };

  // 删除模板
  const handleDelete = async (templateId: number) => {
    try {
      await deleteTemplate(templateId);
      message.success('删除成功');
      loadTemplates();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '删除失败');
    }
  };

  // 设置默认模板
  const handleSetDefault = async (templateId: number) => {
    try {
      await setDefaultTemplate(templateId);
      message.success('设置成功');
      loadTemplates();
    } catch (error) {
      message.error('设置失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '模板名称',
      dataIndex: '模板名称',
      key: '模板名称',
    },
    {
      title: '模板类型',
      dataIndex: '模板类型',
      key: '模板类型',
      render: (type: string) => (
        <Tag color={type === '预案' ? 'blue' : 'green'}>{type}</Tag>
      ),
    },
    {
      title: '是否启用',
      dataIndex: '是否启用',
      key: '是否启用',
      render: (enabled: number) => (
        <Tag color={enabled === 1 ? 'success' : 'default'}>
          {enabled === 1 ? '已启用' : '已禁用'}
        </Tag>
      ),
    },
    {
      title: '是否默认',
      dataIndex: '是否默认',
      key: '是否默认',
      render: (isDefault: number, record: TemplateConfig) => (
        <Space>
          {isDefault === 1 ? (
            <Tag color="gold" icon={<StarOutlined />}>
              默认模板
            </Tag>
          ) : (
            <Button
              size="small"
              icon={<StarOutlined />}
              onClick={() => handleSetDefault(record.模板ID!)}
            >
              设为默认
            </Button>
          )}
        </Space>
      ),
    },
    {
      title: '排序序号',
      dataIndex: '排序序号',
      key: '排序序号',
    },
    {
      title: '神殿',
      dataIndex: '神殿',
      key: '神殿',
      render: (campus: string) => campus || '全部',
    },
    {
      title: '创建人',
      dataIndex: '创建人姓名',
      key: '创建人姓名',
    },
    {
      title: '创建时间',
      dataIndex: '创建时间',
      key: '创建时间',
      render: (time: string) => time ? new Date(time).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TemplateConfig) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该模板吗？"
            onConfirm={() => handleDelete(record.模板ID!)}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <div className="template-management">
        <Card
          title="当面标准化检查表模板管理"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
              新建模板
            </Button>
          }
        >
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="模板类型"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, template_type: value })}
          >
            <Option value="预案">预案</Option>
            <Option value="复盘">复盘</Option>
          </Select>
          <Select
            placeholder="启用状态"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, is_enabled: value })}
          >
            <Option value={1}>已启用</Option>
            <Option value={0}>已禁用</Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={templates}
          rowKey="模板ID"
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            },
          }}
        />
      </Card>

      <Modal
        title={editingTemplate ? '编辑模板' : '新建模板'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={handleCloseModal}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="模板名称"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="请输入模板名称" />
          </Form.Item>

          <Form.Item
            name="模板类型"
            label="模板类型"
            rules={[{ required: true, message: '请选择模板类型' }]}
          >
            <Select placeholder="请选择模板类型">
              <Option value="预案">预案</Option>
              <Option value="复盘">复盘</Option>
            </Select>
          </Form.Item>

          <Form.Item name="是否启用" label="是否启用" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item name="是否默认" label="是否默认模板" valuePropName="checked">
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>

          <Form.Item name="排序序号" label="排序序号">
            <Input type="number" placeholder="排序序号，数字越小越靠前" />
          </Form.Item>

          <Form.Item name="备注" label="备注">
            <TextArea rows={3} placeholder="备注信息" />
          </Form.Item>

          <div style={{ color: '#999', fontSize: 12, marginTop: 16 }}>
            提示：咨询步骤配置将使用默认模板，您可以在创建后进行详细编辑。
          </div>
        </Form>
      </Modal>
      </div>
    </NoCopyContainer>
  );
};

export default TemplateManagement;
