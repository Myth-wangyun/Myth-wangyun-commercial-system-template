/**
 * 神殿教化司师资配比编辑模态框组件
 */

import React from 'react'
import { App, Modal, Form, InputNumber, Input, Row, Col } from 'antd'
import type { TeacherRatioEditModalProps, TeacherRatioRecord } from '@/types/teacher-ratio'

const num = (v: any): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const computeVacancyRedundancy = (target: number, actual: number) => {
  const t = num(target)
  const a = num(actual)
  return {
    vacancy: Math.max(0, t - a),
    redundancy: Math.max(0, a - t),
  }
}

const TeacherRatioEditModal: React.FC<TeacherRatioEditModalProps> = ({
  visible,
  record,
  onCancel,
  onSave,
  defaultCampus,
  defaultMonth,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  React.useEffect(() => {
    if (!visible) return
    if (record) {
      form.setFieldsValue({
        month: record.month,
        campus: record.campus || defaultCampus || '',  // 优先使用record.campus，为空时使用defaultCampus
        studentTotal: record.studentTotal,
        targetStudentTeacherRatio: record.targetStudentTeacherRatio,
        targetTeacherCount: record.targetTeacherCount,
        actualTeacherCount: record.actualTeacherCount,
        headmasterVacancy: record.headmasterVacancy,
        headmasterRedundancy: record.headmasterRedundancy,
        targetMiddleManagementRatio: record.targetMiddleManagementRatio,
        targetMiddleManagementCount: record.targetMiddleManagementCount,
        actualMiddleManagementCount: record.actualMiddleManagementCount,
        middleManagementVacancy: record.middleManagementVacancy,
        middleManagementRedundancy: record.middleManagementRedundancy,
      })
    } else {
      form.setFieldsValue({
        month: defaultMonth ?? undefined,
        campus: defaultCampus ?? '',
        // 默认目标师生配比：1:50（可修改）
        targetStudentTeacherRatio: '1:50',
        // 默认目标中层与班主任配比（保持为空，按业务可手动填）
        targetMiddleManagementRatio: '',
        studentTotal: 0,
        targetTeacherCount: 0,
        actualTeacherCount: 0,
        headmasterVacancy: 0,
        headmasterRedundancy: 0,
        targetMiddleManagementCount: 0,
        actualMiddleManagementCount: 0,
        middleManagementVacancy: 0,
        middleManagementRedundancy: 0,
      })
    }
  }, [visible, record, form, defaultCampus, defaultMonth])

  const recomputeDerivedFields = (values: any) => {
    const headmaster = computeVacancyRedundancy(values.targetTeacherCount, values.actualTeacherCount)
    const middle = computeVacancyRedundancy(
      values.targetMiddleManagementCount,
      values.actualMiddleManagementCount,
    )

    const next = {
      ...values,
      headmasterVacancy: headmaster.vacancy,
      headmasterRedundancy: headmaster.redundancy,
      middleManagementVacancy: middle.vacancy,
      middleManagementRedundancy: middle.redundancy,
    }

    form.setFieldsValue({
      headmasterVacancy: next.headmasterVacancy,
      headmasterRedundancy: next.headmasterRedundancy,
      middleManagementVacancy: next.middleManagementVacancy,
      middleManagementRedundancy: next.middleManagementRedundancy,
    })

    return next
  }

  const handleValuesChange = (_changed: any, allValues: any) => {
    recomputeDerivedFields(allValues)
  }

  const handleSave = async () => {
    try {
      const values0 = await form.validateFields()
      const values = recomputeDerivedFields(values0)

      const updatedRecord: TeacherRatioRecord = record
        ? { ...record, ...values }
        : {
            id: `${values.campus}-${values.month}`,
            month: values.month,
            campus: values.campus,
            studentTotal: num(values.studentTotal),
            targetStudentTeacherRatio: values.targetStudentTeacherRatio || '1:50',
            targetTeacherCount: num(values.targetTeacherCount),
            actualTeacherCount: num(values.actualTeacherCount),
            headmasterVacancy: num(values.headmasterVacancy),
            headmasterRedundancy: num(values.headmasterRedundancy),
            targetMiddleManagementRatio: values.targetMiddleManagementRatio || '',
            targetMiddleManagementCount: num(values.targetMiddleManagementCount),
            actualMiddleManagementCount: num(values.actualMiddleManagementCount),
            middleManagementVacancy: num(values.middleManagementVacancy),
            middleManagementRedundancy: num(values.middleManagementRedundancy),
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
      title={`${record ? '编辑' : '新增'}${record?.campus ? record.campus + '神殿' : ''}教化司师资配比${record ? ' - ' + (record?.month || '') + '月' : ''}`}
      open={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      width={800}
      okText="保存"
      cancelText="取消"
    >
      <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="月份" name="month" rules={[{ required: true }]}>
              <InputNumber min={1} max={12} style={{ width: '100%' }} disabled={!!record} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="神殿" name="campus" rules={[{ required: true, message: '请输入神殿' }]}> 
              <Input disabled placeholder="自动获取" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="学生总人数"
              name="studentTotal"
              rules={[{ required: true, message: '请输入学生总人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="学生总人数" />
            </Form.Item>
          </Col>
        </Row>

        <h4 style={{ marginTop: 16, marginBottom: 12 }}>职数分析</h4>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="目标师生配比"
              name="targetStudentTeacherRatio"
              rules={[{ required: true }]}
            >
              <Input placeholder="如: 1:60" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="目标老师总数" name="targetTeacherCount" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="实际老师数量" name="actualTeacherCount" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="班主任空缺职数" name="headmasterVacancy" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="班主任冗余职数"
              name="headmasterRedundancy"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="目标中层与班主任配比"
              name="targetMiddleManagementRatio"
              rules={[{ required: true }]}
            >
              <Input placeholder="如: 1:8" />
            </Form.Item>
          </Col>
        </Row>

        <h4 style={{ marginTop: 16, marginBottom: 12 }}>干部职数分析</h4>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="目标中层人数"
              name="targetMiddleManagementCount"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="实际中层人数"
              name="actualMiddleManagementCount"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="中层空缺职数"
              name="middleManagementVacancy"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="中层冗余职数"
              name="middleManagementRedundancy"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

export default TeacherRatioEditModal
