/**
 * 神殿教化司企业签约目标与结果汇总编辑模态框组件
 */

import React, { useState, useEffect } from 'react'
import { App, Modal, Form, InputNumber, Select, Row, Col, Divider, Spin } from 'antd'
import type {
  CampusContractGoalsResultsEditModalProps,
  CampusContractGoalsResultsRecord,
} from '@/types/campus-contract-goals-results'
import { fetchCampuses, type CampusProfile } from '@/services/configMaster'

const { Option } = Select

const CampusContractGoalsResultsEditModal: React.FC<CampusContractGoalsResultsEditModalProps> = ({
  visible,
  record,
  onCancel,
  onSave,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [campusList, setCampusList] = useState<CampusProfile[]>([])
  const [loadingCampuses, setLoadingCampuses] = useState(false)

  // 加载神殿列表
  useEffect(() => {
    const loadCampuses = async () => {
      setLoadingCampuses(true)
      try {
        const data = await fetchCampuses()
        // 只显示启用的神殿，排除最高议事厅
        const activeCampuses = data.filter(
          (c) => c.is_active && c.name !== '最高议事厅'
        )
        setCampusList(activeCampuses)
      } catch (error) {
        console.error('加载神殿列表失败:', error)
        message.error('加载神殿列表失败')
      } finally {
        setLoadingCampuses(false)
      }
    }
    if (visible) {
      loadCampuses()
    }
  }, [visible])

  useEffect(() => {
    if (visible && record) {
      form.setFieldsValue({
        month: record.month,
        campus: record.campus,
        targetContractCount: record.targetContractCount,
        actualContractCount: record.actualContractCount,
      })
    }
  }, [visible, record, form])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()

      const updatedRecord: CampusContractGoalsResultsRecord = {
        key: record?.key || `new-${Date.now()}`,
        month: values.month || 0,
        campus: values.campus || '',
        targetContractCount: values.targetContractCount || 0,
        actualContractCount: values.actualContractCount || 0,
      }

      onSave(updatedRecord)
      message.success('保存成功')
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title={`${record ? '编辑' : '新增'}${record?.campus || ''}神殿企业签约目标与结果`}
      open={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      width={600}
      okText="保存"
      cancelText="取消"
      style={{ top: 20 }}
    >
      <Form form={form} layout="vertical" preserve={false} scrollToFirstError>
        {/* 基础信息 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#fa8c16', marginBottom: 12 }}>📋 基础信息</h4>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="月份"
                name="month"
                rules={[{ required: true, message: '请选择月份' }]}
              >
                <Select placeholder="请选择月份" disabled={!!record}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <Option key={i + 1} value={i + 1}>
                      {i + 1}月
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="神殿"
                name="campus"
                rules={[{ required: true, message: '请选择神殿' }]}
              >
                <Select 
                  placeholder="请选择神殿" 
                  disabled={!!record}
                  loading={loadingCampuses}
                  notFoundContent={loadingCampuses ? <Spin size="small" /> : '暂无数据'}
                >
                  {campusList.map((campus) => (
                    <Option key={campus.code} value={campus.short_name || campus.name.replace('神殿', '')}>
                      {campus.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* 签约数据 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#52c41a', marginBottom: 12 }}>📊 签约数据</h4>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="签约目标数量"
                name="targetContractCount"
                rules={[{ required: true, message: '请输入签约目标数量' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入签约目标数量" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="实际签约数量"
                name="actualContractCount"
                rules={[{ required: true, message: '请输入实际签约数量' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入实际签约数量" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* 提示信息 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#1890ff', marginBottom: 12 }}>💡 填写说明</h4>
          <div
            style={{
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '14px',
              color: '#52c41a',
            }}
          >
            <p style={{ margin: 0, marginBottom: '8px' }}>
              • <strong>签约目标数量</strong>：该月计划签约的企业数量
            </p>
            <p style={{ margin: 0, marginBottom: '8px' }}>
              • <strong>实际签约数量</strong>：该月实际完成签约的企业数量
            </p>
            <p style={{ margin: 0 }}>
              • <strong>完成率</strong>：系统将自动计算完成率 = 实际签约数量 ÷ 签约目标数量 × 100%
            </p>
          </div>
        </div>
      </Form>
    </Modal>
  )
}

export default CampusContractGoalsResultsEditModal
