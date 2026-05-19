// 口碑招生汇总表表单组件
import React, { useEffect, useMemo } from 'react'
import { Form, Input, InputNumber, Select, Row, Col } from 'antd'
import type { IEnrollmentSummary, IEnrollmentSummaryForm } from './types'
import { MONTHS } from '@/pages/academic/teaching-content/constants'
import { getCampusOptions } from '@/config/campusConfig'

const { Option } = Select

interface EnrollmentFormProps {
  form: any
  initialValues?: IEnrollmentSummary
  onSubmit?: (values: IEnrollmentSummaryForm) => void
  onCancel?: () => void
  loading?: boolean
}

const EnrollmentForm: React.FC<EnrollmentFormProps> = ({
  form,
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const campusOptions = useMemo(() => {
    return getCampusOptions().map(({ label }) => ({
      value: label.replace(/神殿$/, ''),
      label,
    }))
  }, [])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues)
    } else {
      form.resetFields()
      // 设置默认年份为当前年份
      form.setFieldsValue({
        year: new Date().getFullYear(),
      })
    }
  }, [form, initialValues])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const formData: IEnrollmentSummaryForm = {
        ...values,
      }
      onSubmit?.(formData)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="campus" label="神殿" rules={[{ required: true, message: '请选择神殿' }]}>
            <Select placeholder="请选择神殿" allowClear>
              {campusOptions.map(({ value, label }) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="month" label="月份" rules={[{ required: true, message: '请选择月份' }]}>
            <Select placeholder="请选择月份" allowClear>
              {MONTHS.map((month, index) => (
                <Option key={index + 1} value={index + 1}>
                  {month}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="year"
            label="年份"
            rules={[
              { required: true, message: '请输入年份' },
              { type: 'number', min: 2020, max: 2030, message: '年份应在2020-2030之间' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入年份"
              min={2020}
              max={2030}
              precision={0}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="targetWOM"
            label="目标口碑量"
            rules={[
              { required: true, message: '请输入目标口碑量' },
              { type: 'number', min: 0, message: '口碑量不能为负数' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入目标口碑量"
              min={0}
              precision={0}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="actualWOM"
            label="实际口碑量"
            rules={[
              { required: true, message: '请输入实际口碑量' },
              { type: 'number', min: 0, message: '口碑量不能为负数' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入实际口碑量"
              min={0}
              precision={0}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="targetWalkin"
            label="目标上门量"
            rules={[
              { required: true, message: '请输入目标上门量' },
              { type: 'number', min: 0, message: '上门量不能为负数' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入目标上门量"
              min={0}
              precision={0}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="actualWalkin"
            label="实际上门量"
            rules={[
              { required: true, message: '请输入实际上门量' },
              { type: 'number', min: 0, message: '上门量不能为负数' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入实际上门量"
              min={0}
              precision={0}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="targetEnrollment"
            label="目标招生人数"
            rules={[
              { required: true, message: '请输入目标招生人数' },
              { type: 'number', min: 0, message: '人数不能为负数' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入目标招生人数"
              min={0}
              precision={0}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="actualEnrollment"
            label="实际招生人数"
            rules={[
              { required: true, message: '请输入实际招生人数' },
              { type: 'number', min: 0, message: '人数不能为负数' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入实际招生人数"
              min={0}
              precision={0}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="targetRevenue"
            label="目标收入"
            rules={[
              { required: true, message: '请输入目标收入' },
              { type: 'number', min: 0, message: '收入不能为负数' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入目标收入"
              min={0}
              precision={0}
              addonBefore="¥"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="actualRevenue"
            label="实际收入"
            rules={[
              { required: true, message: '请输入实际收入' },
              { type: 'number', min: 0, message: '收入不能为负数' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入实际收入"
              min={0}
              precision={0}
              addonBefore="¥"
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  )
}

export default EnrollmentForm
