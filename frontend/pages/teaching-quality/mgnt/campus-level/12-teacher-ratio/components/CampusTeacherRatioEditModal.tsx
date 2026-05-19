/**
 * 神殿教化司师资配比编辑模态框组件
 */

import React from 'react'
import { App, Modal, Form, InputNumber, Input, Select, Row, Col } from 'antd'
import type { FormInstance } from 'antd'
import type {
  CampusTeacherRatioEditModalProps,
  CampusTeacherRatioRecord,
} from '@/types/campus-teacher-ratio'

const { Option } = Select

const CampusTeacherRatioEditModal: React.FC<CampusTeacherRatioEditModalProps> = ({
  visible,
  record,
  onCancel,
  onSave,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const recalcDerivedFields = React.useCallback(
    (f: FormInstance) => {
      const targetTeacherCount = Number(f.getFieldValue('targetTeacherCount') ?? 0)
      const actualTeacherCount = Number(f.getFieldValue('actualTeacherCount') ?? 0)
      const targetMiddleManagementCount = Number(
        f.getFieldValue('targetMiddleManagementCount') ?? 0,
      )
      const actualMiddleManagementCount = Number(
        f.getFieldValue('actualMiddleManagementCount') ?? 0,
      )

      f.setFieldsValue({
        homeroomTeacherVacancies: Math.max(0, targetTeacherCount - actualTeacherCount),
        homeroomTeacherSurplus: Math.max(0, actualTeacherCount - targetTeacherCount),
        middleManagementVacancies: Math.max(
          0,
          targetMiddleManagementCount - actualMiddleManagementCount,
        ),
        middleManagementSurplus: Math.max(
          0,
          actualMiddleManagementCount - targetMiddleManagementCount,
        ),
      })
    },
    [],
  )

  React.useEffect(() => {
    if (visible && record) {
      form.setFieldsValue({
        month: record.month,
        statisticsTime: record.statisticsTime,
        campus: record.campus,
        totalStudents: record.totalStudents,
        targetTeacherStudentRatio: record.positionAnalysis.targetTeacherStudentRatio,
        targetTeacherCount: record.positionAnalysis.targetTeacherCount,
        actualTeacherCount: record.positionAnalysis.actualTeacherCount,
        // 以下四项支持自动计算（也会在打开弹窗时重算一次）
        homeroomTeacherVacancies: record.positionAnalysis.homeroomTeacherVacancies,
        homeroomTeacherSurplus: record.positionAnalysis.homeroomTeacherSurplus,
        targetMiddleManagementRatio: record.cadrePositionAnalysis.targetMiddleManagementRatio,
        targetMiddleManagementCount: record.cadrePositionAnalysis.targetMiddleManagementCount,
        actualMiddleManagementCount: record.cadrePositionAnalysis.actualMiddleManagementCount,
        middleManagementVacancies: record.cadrePositionAnalysis.middleManagementVacancies,
        middleManagementSurplus: record.cadrePositionAnalysis.middleManagementSurplus,
      })

      // 打开弹窗时，根据“目标/实际”重算一次衍生字段，避免历史数据不一致
      recalcDerivedFields(form)
    }
  }, [visible, record, form, recalcDerivedFields])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()

      // 保存前兜底重算一次，确保衍生字段一定正确
      recalcDerivedFields(form)

      if (!record) {
        message.error('记录不存在')
        return
      }

      const updatedRecord: CampusTeacherRatioRecord = {
        ...record,
        statisticsTime: values.statisticsTime || '',
        totalStudents: values.totalStudents || 0,
        positionAnalysis: {
          targetTeacherStudentRatio: values.targetTeacherStudentRatio || '',
          targetTeacherCount: values.targetTeacherCount || 0,
          actualTeacherCount: values.actualTeacherCount || 0,
          homeroomTeacherVacancies: values.homeroomTeacherVacancies || 0,
          homeroomTeacherSurplus: values.homeroomTeacherSurplus || 0,
        },
        cadrePositionAnalysis: {
          targetMiddleManagementRatio: values.targetMiddleManagementRatio || '',
          targetMiddleManagementCount: values.targetMiddleManagementCount || 0,
          actualMiddleManagementCount: values.actualMiddleManagementCount || 0,
          middleManagementVacancies: values.middleManagementVacancies || 0,
          middleManagementSurplus: values.middleManagementSurplus || 0,
        },
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
      title={`编辑${record?.campus || ''}神殿教化司师资配比 - ${record?.month || ''}月`}
      open={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      width={1000}
      okText="保存"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        onValuesChange={(changedValues) => {
          const shouldRecalc =
            Object.prototype.hasOwnProperty.call(changedValues, 'targetTeacherCount') ||
            Object.prototype.hasOwnProperty.call(changedValues, 'actualTeacherCount') ||
            Object.prototype.hasOwnProperty.call(changedValues, 'targetMiddleManagementCount') ||
            Object.prototype.hasOwnProperty.call(changedValues, 'actualMiddleManagementCount')

          if (shouldRecalc) {
            recalcDerivedFields(form)
          }
        }}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="月份"
              name="month"
              rules={[{ required: true, message: '请输入月份' }]}
            >
              <InputNumber min={1} max={12} style={{ width: '100%' }} disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="统计时间"
              name="statisticsTime"
              rules={[{ required: true, message: '请输入统计时间' }]}
            >
              <Input placeholder="如：2024年1月" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="神殿"
              name="campus"
              rules={[{ required: true, message: '请输入神殿' }]}
            >
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="学生总人数"
              name="totalStudents"
              rules={[{ required: true, message: '请输入学生总人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入学生总人数" />
            </Form.Item>
          </Col>
        </Row>

        {/* 职数分析 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#1890ff', marginBottom: 12 }}>职数分析</h4>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="目标师生配比"
                name="targetTeacherStudentRatio"
                rules={[{ required: true, message: '请选择目标师生配比' }]}
              >
                <Select placeholder="请选择师生配比">
                  <Option value="1:50">1:50</Option>
                  <Option value="1:55">1:55</Option>
                  <Option value="1:60">1:60</Option>
                  <Option value="1:65">1:65</Option>
                  <Option value="1:70">1:70</Option>
                  <Option value="1:75">1:75</Option>
                  <Option value="1:80">1:80</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="目标老师总数"
                name="targetTeacherCount"
                rules={[{ required: true, message: '请输入目标老师总数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入目标老师总数" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="实际老师数量"
                name="actualTeacherCount"
                rules={[{ required: true, message: '请输入实际老师数量' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入实际老师数量" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="班主任空缺职数"
                name="homeroomTeacherVacancies"
                rules={[{ required: true, message: '请输入班主任空缺职数' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="自动计算"
                  disabled
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="班主任冗余职数"
                name="homeroomTeacherSurplus"
                rules={[{ required: true, message: '请输入班主任冗余职数' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="自动计算"
                  disabled
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* 干部职数分析 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#1890ff', marginBottom: 12 }}>干部职数分析</h4>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="目标中层与班主任配比"
                name="targetMiddleManagementRatio"
                rules={[{ required: true, message: '请选择目标中层与班主任配比' }]}
              >
                <Select placeholder="请选择中层配比">
                  <Option value="1:3">1:3</Option>
                  <Option value="1:4">1:4</Option>
                  <Option value="1:5">1:5</Option>
                  <Option value="1:6">1:6</Option>
                  <Option value="1:7">1:7</Option>
                  <Option value="1:8">1:8</Option>
                  <Option value="1:9">1:9</Option>
                  <Option value="1:10">1:10</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="目标中层人数"
                name="targetMiddleManagementCount"
                rules={[{ required: true, message: '请输入目标中层人数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入目标中层人数" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="实际中层人数"
                name="actualMiddleManagementCount"
                rules={[{ required: true, message: '请输入实际中层人数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入实际中层人数" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="中层空缺职数"
                name="middleManagementVacancies"
                rules={[{ required: true, message: '请输入中层空缺职数' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="自动计算"
                  disabled
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="中层冗余职数"
                name="middleManagementSurplus"
                rules={[{ required: true, message: '请输入中层冗余职数' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="自动计算"
                  disabled
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form>
    </Modal>
  )
}

export default CampusTeacherRatioEditModal
