/**
 * 电话标准化检查表模板管理页面
 * 重点：允许用户配置次子结构
 */

import React, { useState, useEffect } from 'react';
import { App,
  Card,
  Button,
  Table,
  Form,
  Input,
  Modal,
  Space,
  Select,
  Tag,
  Switch,
  Popconfirm,
  Collapse,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  getPhoneTemplateList,
  createPhoneTemplate,
  updatePhoneTemplate,
  deletePhoneTemplate,
  setDefaultPhoneTemplate,
  type PhoneTemplate,
} from '@/services/consult/phoneCheck';

const { TextArea } = Input;
const { Panel } = Collapse;

const PhoneTemplateManagement: React.FC = () => {
  const { message } = App.useApp()
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editStructModalVisible, setEditStructModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PhoneTemplate | null>(null);
  const [templates, setTemplates] = useState<PhoneTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [templateContent, setTemplateContent] = useState<any[]>([]);
  const [editingStep, setEditingStep] = useState<any>(null);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [filters, setFilters] = useState({
    is_enabled: undefined as number | undefined,
  });

  // 加载模板列表
  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await getPhoneTemplateList({
        ...filters,
        page,
        page_size: pageSize,
      });
      const payload = response?.data || response;
      if (payload?.code === 0) {
        setTemplates(payload.data?.数据列表 || []);
        setTotal(payload.data?.总记录数 || 0);
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
  const handleOpenModal = (template?: PhoneTemplate) => {
    if (template) {
      setEditingTemplate(template);
      form.setFieldsValue(template);
      setTemplateContent(template.模板内容 || []);
    } else {
      setEditingTemplate(null);
      form.resetFields();
      form.setFieldsValue({
        是否启用: 1,
        是否默认: 0,
        排序序号: 0,
      });
      setTemplateContent([]);
    }
    setModalVisible(true);
  };

  // 关闭模态框
  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingTemplate(null);
    form.resetFields();
    setTemplateContent([]);
  };

  // 保存模板
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      const data = {
        ...values,
        模板内容: templateContent,
      };

      if (editingTemplate) {
        await updatePhoneTemplate(editingTemplate.模板ID!, data);
        message.success('更新成功');
      } else {
        await createPhoneTemplate(data);
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
      await deletePhoneTemplate(templateId);
      message.success('删除成功');
      loadTemplates();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '删除失败');
    }
  };

  // 设置默认模板
  const handleSetDefault = async (templateId: number) => {
    try {
      await setDefaultPhoneTemplate(templateId);
      message.success('设置成功');
      loadTemplates();
    } catch (error) {
      message.error('设置失败');
    }
  };

  // 添加步骤
  const handleAddStep = () => {
    setTemplateContent([
      ...templateContent,
      {
        步骤: `步${templateContent.length + 1}`,
        子结构: [],
        完成情况: false,
        完成情况对比: false,
        备注: '',
      },
    ]);
  };

  // 删除步骤
  const handleDeleteStep = (index: number) => {
    const newContent = [...templateContent];
    newContent.splice(index, 1);
    setTemplateContent(newContent);
  };

  // 添加子结构
  const handleAddSubStruct = (stepIndex: number) => {
    const newContent = [...templateContent];
    if (!newContent[stepIndex].子结构) {
      newContent[stepIndex].子结构 = [];
    }
    newContent[stepIndex].子结构.push({
      名称: '新子结构',
      是否必选: true,
      次子结构: [],
      完成情况: false,
    });
    setTemplateContent(newContent);
  };

  // 打开次子结构编辑对话框
  const handleOpenEditStruct = (step: any, sub: any) => {
    setEditingStep(step);
    setEditingSub(sub);
    setEditStructModalVisible(true);
  };

  // 添加次子结构
  const handleAddSubSubStruct = () => {
    if (!editingSub) return;

    const newContent = [...templateContent];
    const stepIndex = newContent.findIndex((s) => s.步骤 === editingStep.步骤);
    if (stepIndex >= 0) {
      const subIndex = newContent[stepIndex].子结构.findIndex(
        (s: any) => s.名称 === editingSub.名称
      );
      if (subIndex >= 0) {
        if (!newContent[stepIndex].子结构[subIndex].次子结构) {
          newContent[stepIndex].子结构[subIndex].次子结构 = [];
        }
        newContent[stepIndex].子结构[subIndex].次子结构.push({
          名称: '新次子结构',
          是否必选: true,
          可编辑: true,
          完成情况: false,
        });
        setTemplateContent(newContent);
      }
    }
  };

  // 删除次子结构
  const handleDeleteSubSubStruct = (subSubIndex: number) => {
    if (!editingSub) return;

    const newContent = [...templateContent];
    const stepIndex = newContent.findIndex((s) => s.步骤 === editingStep.步骤);
    if (stepIndex >= 0) {
      const subIndex = newContent[stepIndex].子结构.findIndex(
        (s: any) => s.名称 === editingSub.名称
      );
      if (subIndex >= 0) {
        newContent[stepIndex].子结构[subIndex].次子结构.splice(subSubIndex, 1);
        setTemplateContent(newContent);
      }
    }
  };

  // 更新次子结构名称
  const handleUpdateSubSubName = (subSubIndex: number, value: string) => {
    if (!editingSub) return;

    const newContent = [...templateContent];
    const stepIndex = newContent.findIndex((s) => s.步骤 === editingStep.步骤);
    if (stepIndex >= 0) {
      const subIndex = newContent[stepIndex].子结构.findIndex(
        (s: any) => s.名称 === editingSub.名称
      );
      if (subIndex >= 0) {
        newContent[stepIndex].子结构[subIndex].次子结构[subSubIndex].名称 = value;
        setTemplateContent(newContent);
      }
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
      render: (isDefault: number, record: PhoneTemplate) => (
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
      title: '步骤数量',
      key: '步骤数',
      render: (_: any, record: PhoneTemplate) => record.模板内容?.length || 0,
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
      render: (time: string) => (time ? new Date(time).toLocaleString() : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: PhoneTemplate) => (
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
    <div className="phone-template-management">
      <Card
        title="电话标准化检查表模板管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            新建模板
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="启用状态"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, is_enabled: value })}
          >
            <Select.Option value={1}>已启用</Select.Option>
            <Select.Option value={0}>已禁用</Select.Option>
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

      {/* 新建/编辑模态框 */}
      <Modal
        title={editingTemplate ? '编辑模板' : '新建模板'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={handleCloseModal}
        width={1000}
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
            <TextArea rows={2} placeholder="备注信息" />
          </Form.Item>

          <Divider orientation="left">模板内容配置</Divider>

          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={handleAddStep}
            style={{ marginBottom: 16 }}
          >
            添加步骤
          </Button>

          <Collapse>
            {templateContent.map((step: any, stepIndex: number) => (
              <Panel
                key={stepIndex}
                header={
                  <Space>
                    <Input
                      value={step.步骤}
                      onChange={(e) => {
                        const newContent = [...templateContent];
                        newContent[stepIndex].步骤 = e.target.value;
                        setTemplateContent(newContent);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: 200 }}
                      placeholder="步骤名称"
                    />
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStep(stepIndex);
                      }}
                    >
                      删除步骤
                    </Button>
                  </Space>
                }
              >
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={() => handleAddSubStruct(stepIndex)}
                  style={{ marginBottom: 12 }}
                >
                  添加子结构
                </Button>

                {step.子结构?.map((sub: any, subIndex: number) => (
                  <Card
                    key={subIndex}
                    size="small"
                    style={{ marginBottom: 12 }}
                    title={
                      <Space>
                        <Input
                          value={sub.名称}
                          onChange={(e) => {
                            const newContent = [...templateContent];
                            newContent[stepIndex].子结构[subIndex].名称 = e.target.value;
                            setTemplateContent(newContent);
                          }}
                          style={{ width: 200 }}
                          placeholder="子结构名称"
                        />
                        <Button
                          size="small"
                          icon={<SettingOutlined />}
                          onClick={() => handleOpenEditStruct(step, sub)}
                        >
                          配置次子结构
                        </Button>
                      </Space>
                    }
                  >
                    <div>次子结构数量：{sub.次子结构?.length || 0}</div>
                  </Card>
                ))}
              </Panel>
            ))}
          </Collapse>
        </Form>
      </Modal>

      {/* 次子结构编辑模态框 */}
      <Modal
        title={`配置次子结构 - ${editingSub?.名称}`}
        open={editStructModalVisible}
        onOk={() => setEditStructModalVisible(false)}
        onCancel={() => setEditStructModalVisible(false)}
        width={600}
      >
        <Button
          type="dashed"
          block
          icon={<PlusOutlined />}
          onClick={handleAddSubSubStruct}
          style={{ marginBottom: 16 }}
        >
          添加次子结构项
        </Button>

        {editingSub?.次子结构?.map((item: any, index: number) => (
          <div key={index} style={{ marginBottom: 12 }}>
            <Space style={{ width: '100%' }}>
              <Input
                value={item.名称}
                onChange={(e) => handleUpdateSubSubName(index, e.target.value)}
                style={{ width: 400 }}
                placeholder="次子结构名称"
              />
              <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteSubSubStruct(index)}>
                删除
              </Button>
            </Space>
          </div>
        ))}
      </Modal>
    </div>
  );
};

export default PhoneTemplateManagement;
