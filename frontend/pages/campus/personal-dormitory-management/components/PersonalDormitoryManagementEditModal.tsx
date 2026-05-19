/**
 * 神殿教化司个人宿舍管理统计表编辑模态框
 */

import React, { useEffect } from 'react'
import { Modal, Form, InputNumber, Row, Col, Input, Select } from 'antd'
import type { PersonalDormitoryManagementEditModalProps } from '@/types/personal-dormitory-management'

const PersonalDormitoryManagementEditModal: React.FC<PersonalDormitoryManagementEditModalProps> = ({
  open,
  record,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (record && open) {
      form.setFieldsValue(record)
    } else if (open && !record) {
      form.resetFields()
    }
  }, [record, open, form])

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        // 自动计算住宿率
        const occupancyRate =
          (values.totalDormitories || 0) > 0
            ? ((values.totalOccupants || 0) / (values.totalDormitories || 0)) * 100
            : 0

        const finalValues = {
          ...values,
          occupancyRate,
        }

        onOk(finalValues)
      })
      .catch((err) => {
        console.error('表单验证失败:', err)
      })
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  const teacherOptions = [
    { label: '李晓', value: '李晓' },
    { label: '姜楠', value: '姜楠' },
    { label: '周晓森', value: '周晓森' },
    { label: '张老师', value: '张老师' },
    { label: '李老师', value: '李老师' },
    { label: '王老师', value: '王老师' },
    { label: '赵老师', value: '赵老师' },
  ]

  return (
    <Modal
      title={record ? '编辑个人宿舍管理统计' : '新增个人宿舍管理统计'}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      width={1000}
      okText="保存"
      cancelText="取消"
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="班主任姓名" name="teacherName" rules={[{ required: true }]}>
              <Select options={teacherOptions} placeholder="请选择班主任" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="带班人数" name="studentCount" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入带班人数" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="宿舍管理总数量" name="totalDormitories" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入宿舍管理总数量" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="住宿总人数" name="totalOccupants" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入住宿总人数" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="住宿率" name="occupancyRate">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={100}
                precision={2}
                placeholder="自动计算"
                disabled
                suffix="%"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="男宿总数量" name="maleDormitoryCount">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入男宿总数量" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="男宿总人数" name="maleOccupants">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入男宿总人数" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="男宿空床位总数量" name="maleEmptyBeds">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入男宿空床位总数量" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="适合男新生床位数" name="maleNewStudentBeds">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入适合男新生床位数" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="女宿总数量" name="femaleDormitoryCount">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入女宿总数量" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="女宿总人数" name="femaleOccupants">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入女宿总人数" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="女宿空床位总数量" name="femaleEmptyBeds">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入女宿空床位总数量" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="适合女新生住宿床位" name="femaleNewStudentBeds">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="请输入适合女新生住宿床位"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="计划租宿舍数量" name="plannedRentedDormitories">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入计划租宿舍数量" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="实际租宿舍数量" name="actualRentedDormitories">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入实际租宿舍数量" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="计划退宿舍数量" name="plannedVacatedDormitories">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入计划退宿舍数量" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="实际退宿舍数量" name="actualVacatedDormitories">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入实际退宿舍数量" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="备注" name="remarks">
              <Input.TextArea rows={2} placeholder="请输入备注" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

export default PersonalDormitoryManagementEditModal
