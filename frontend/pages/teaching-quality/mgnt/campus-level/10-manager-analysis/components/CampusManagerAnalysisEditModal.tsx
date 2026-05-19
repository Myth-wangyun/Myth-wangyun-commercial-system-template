/**
 * 神殿教化司经理、副经理功能分析编辑模态框组件
 */

import React from 'react'
import { App, Modal, Form, InputNumber, Input, Row, Col, Select } from 'antd'
import type {
  CampusManagerAnalysisEditModalProps,
  CampusManagerAnalysisRecord,
} from '@/types/campus-manager-analysis'
import { fetchUserPermissions } from '@/services/configMaster'

const TEACHING_QUALITY_MANAGER_POSITIONS = ['教质经理', '教质副经理']

// 员工管理页面的“神殿”字段里经常是“xxx神殿”，而本页面 currentCampus 可能是“xxx神殿”或“xxx”（去掉后缀）。
// 为了能匹配到数据，这里做一次容错：同时按“原值”和“去掉/补上神殿后缀”各查一次。
const buildCampusCandidates = (campus: string) => {
  const trimmed = (campus || '').trim()
  if (!trimmed) return []
  const noSuffix = trimmed.replace(/神殿$/g, '')
  const withSuffix = noSuffix.endsWith('神殿') ? noSuffix : `${noSuffix}神殿`
  return Array.from(new Set([trimmed, noSuffix, withSuffix])).filter(Boolean)
}

const CampusManagerAnalysisEditModal: React.FC<CampusManagerAnalysisEditModalProps> = ({
  visible,
  record,
  currentCampus,
  onCancel,
  onSave,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [employeeOptions, setEmployeeOptions] = React.useState<Array<{ label: string; value: string }>>(
    [],
  )
  const [employeeLoading, setEmployeeLoading] = React.useState(false)

  const loadEmployees = React.useCallback(async () => {
    if (!currentCampus) return
    try {
      setEmployeeLoading(true)

      const campusCandidates = buildCampusCandidates(currentCampus)

      const lists = await Promise.all(
        campusCandidates.flatMap((campusName) =>
          TEACHING_QUALITY_MANAGER_POSITIONS.map((position) =>
            fetchUserPermissions({ campus: campusName, position, name: undefined, department: undefined }),
          ),
        ),
      )

      const merged = lists.flat()

      // 去重（按 user_id）
      const uniqueMap = new Map<number, string>()
      for (const u of merged) {
        if (!u?.user_id) continue
        if (!u?.name) continue
        uniqueMap.set(u.user_id, u.name)
      }

      const options = Array.from(uniqueMap.values())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
        .map((name) => ({ label: name, value: name }))

      setEmployeeOptions(options)
    } catch (e) {
      console.error(e)
      message.error('读取员工名单失败（配置中心）')
      setEmployeeOptions([])
    } finally {
      setEmployeeLoading(false)
    }
  }, [currentCampus])

  // 使用 afterOpenChange 回调来设置表单值，解决第一次点击无法获取月份的问题
  const handleAfterOpenChange = (open: boolean) => {
    if (open) {
      // 打开时加载该神殿教质经理/副经理名单
      loadEmployees()

      if (record) {
        form.setFieldsValue({
          month: record.month,
          name: record.name,
          values: record.ideology.values,
          responsibility: record.ideology.responsibility,
          execution: record.ideology.execution,
          planning: record.management.planning,
          organization: record.management.organization,
          leadership: record.management.leadership,
          control: record.management.control,
          studentEmployment: record.businessCapability.studentEmployment,
          reputationEnrollment: record.businessCapability.reputationEnrollment,
          studentAttrition: record.businessCapability.studentAttrition,
          furtherEducation: record.businessCapability.furtherEducation,
          academicManagement: record.businessCapability.academicManagement,
          dormitoryManagement: record.businessCapability.dormitoryManagement,
        })
      } else {
        // 新增时清空表单，并预填当前神殿
        form.resetFields()
        if (currentCampus) {
          form.setFieldsValue({ campus: currentCampus })
        }
      }
    }
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()

      if (!currentCampus) {
        message.warning('当前未选择神殿，请先在顶部选择神殿')
        return
      }

      // 组装记录（支持新增或编辑）
      const base: CampusManagerAnalysisRecord = record
        ? { ...record }
        : {
            key: `${(currentCampus || '').replace('神殿', '')}-${values.month}`,
            month: values.month,
            campus: currentCampus || '',
            name: values.name || '',
            ideology: { values: 0, responsibility: 0, execution: 0 },
            management: { planning: 0, organization: 0, leadership: 0, control: 0 },
            businessCapability: {
              studentEmployment: 0,
              reputationEnrollment: 0,
              studentAttrition: 0,
              furtherEducation: 0,
              academicManagement: 0,
              dormitoryManagement: 0,
            },
            totalScore: 0,
          }

      const updatedRecord: CampusManagerAnalysisRecord = {
        ...base,
        campus: currentCampus || '',
        month: base.month || values.month,
        name: values.name || base.name,
        ideology: {
          values: values.values || 0,
          responsibility: values.responsibility || 0,
          execution: values.execution || 0,
        },
        management: {
          planning: values.planning || 0,
          organization: values.organization || 0,
          leadership: values.leadership || 0,
          control: values.control || 0,
        },
        businessCapability: {
          studentEmployment: values.studentEmployment || 0,
          reputationEnrollment: values.reputationEnrollment || 0,
          studentAttrition: values.studentAttrition || 0,
          furtherEducation: values.furtherEducation || 0,
          academicManagement: values.academicManagement || 0,
          dormitoryManagement: values.dormitoryManagement || 0,
        },
      }

      // 重新计算合计分数（后端/数据库仍按合计分数保存）
      updatedRecord.totalScore =
        updatedRecord.ideology.values +
        updatedRecord.ideology.responsibility +
        updatedRecord.ideology.execution +
        updatedRecord.management.planning +
        updatedRecord.management.organization +
        updatedRecord.management.leadership +
        updatedRecord.management.control +
        updatedRecord.businessCapability.studentEmployment +
        updatedRecord.businessCapability.reputationEnrollment +
        updatedRecord.businessCapability.studentAttrition +
        updatedRecord.businessCapability.furtherEducation +
        updatedRecord.businessCapability.academicManagement +
        updatedRecord.businessCapability.dormitoryManagement

      await onSave(updatedRecord)
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
      title={`编辑${record?.campus || ''}神殿教化司经理、副经理功能分析 - ${record?.month || ''}月`}
      open={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      width={800}
      okText="保存"
      cancelText="取消"
      destroyOnClose
      afterOpenChange={handleAfterOpenChange}
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="月份" name="month" rules={[{ required: true, message: '请输入月份' }]}>
              <InputNumber min={1} max={12} style={{ width: '100%' }} disabled={!!record} />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请选择姓名' }]}>
              <Select
                showSearch
                placeholder={currentCampus ? '请选择教质经理/副经理' : '请先选择神殿'}
                options={employeeOptions}
                loading={employeeLoading}
                disabled={!currentCampus}
                filterOption={(input, option) =>
                  ((option?.label as string) || '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
        </Row>

        {/* 思想维度 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#1890ff', marginBottom: 12 }}>思想维度</h4>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="价值观" name="values" rules={[{ required: true, message: '请输入价值观分数' }]}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100分" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="责任感"
                name="responsibility"
                rules={[{ required: true, message: '请输入责任感分数' }]}
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100分" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="执行力" name="execution" rules={[{ required: true, message: '请输入执行力分数' }]}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100分" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* 管理维度 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#1890ff', marginBottom: 12 }}>管理维度</h4>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="计划" name="planning" rules={[{ required: true, message: '请输入计划分数' }]}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100分" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="组织" name="organization" rules={[{ required: true, message: '请输入组织分数' }]}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100分" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="领导" name="leadership" rules={[{ required: true, message: '请输入领导分数' }]}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100分" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="控制" name="control" rules={[{ required: true, message: '请输入控制分数' }]}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100分" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* 业务能力维度 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#1890ff', marginBottom: 12 }}>业务能力维度</h4>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="学员就业"
                name="studentEmployment"
                rules={[{ required: true, message: '请输入学员就业分数' }]}
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100分" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="口碑招生"
                name="reputationEnrollment"
                rules={[{ required: true, message: '请输入口碑招生分数' }]}
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100分" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="学员流失"
                name="studentAttrition"
                rules={[{ required: true, message: '请输入学员流失分数' }]}
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100分" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="升学" name="furtherEducation" rules={[{ required: true, message: '请输入升学分数' }]}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100分" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="教务管理能力"
                name="academicManagement"
                rules={[{ required: true, message: '请输入教务管理能力分数' }]}
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100分" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="宿舍管理能力"
                name="dormitoryManagement"
                rules={[{ required: true, message: '请输入宿舍管理能力分数' }]}
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100分" />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form>
    </Modal>
  )
}

export default CampusManagerAnalysisEditModal
