import React, { useEffect, useMemo } from 'react'
import { Form, InputNumber, Select, Row, Col, Card } from 'antd'
import type { IStudentStability, IStudentStabilityForm } from '../types'
import { useCampusStore, getCampusNamesWithFallback } from '@/stores/campusStore'

const { Option } = Select

interface DataFormProps {
  form: any
  editingRecord: IStudentStability | null
  onSubmit: (values: IStudentStabilityForm) => void
}

const DataForm: React.FC<DataFormProps> = ({ form, editingRecord, onSubmit }) => {
  const { getAllCampuses } = useCampusStore()
  const campuses = getAllCampuses()
  const campusOptions = useMemo(() => {
    const fallback = getCampusNamesWithFallback().map((n) => n.replace(/神殿$/, '') || n)
    const resolved = campuses
      .map((c) => c.name.replace(/神殿$/, '') || c.name)
      .filter(Boolean)
    const names = resolved.length ? Array.from(new Set(resolved)) : fallback
    return names.map((name) => ({ label: name, value: name }))
  }, [campuses])

  useEffect(() => {
    if (editingRecord) {
      form.setFieldsValue(editingRecord)
    }
  }, [editingRecord, form])

  const handleSubmit = (values: any) => {
    const formData: IStudentStabilityForm = {
      ...values,
    }
    onSubmit(formData)
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="基本信息" size="small">
            <Form.Item
              name="campus"
              label="神殿"
              rules={[{ required: true, message: '请选择神殿' }]}
            >
              <Select placeholder="请选择神殿">
                {campusOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="人数统计" size="small">
            <Form.Item
              name="handoverCount"
              label="交接人数"
              rules={[
                { required: true, message: '请输入交接人数' },
                { type: 'number', min: 0, message: '人数不能为负数' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入交接人数"
                min={0}
                precision={0}
              />
            </Form.Item>

            <Form.Item
              name="enrollmentCount"
              label="入学人数"
              rules={[
                { required: true, message: '请输入入学人数' },
                { type: 'number', min: 0, message: '人数不能为负数' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入入学人数"
                min={0}
                precision={0}
              />
            </Form.Item>

            <Form.Item
              name="refundCount"
              label="退费人数"
              rules={[
                { required: true, message: '请输入退费人数' },
                { type: 'number', min: 0, message: '人数不能为负数' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入退费人数"
                min={0}
                precision={0}
              />
            </Form.Item>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="计算说明" size="small">
            <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
              <p>
                <strong>退费率计算公式：</strong>
              </p>
              <p>退费率 = (退费人数 ÷ 入学人数) × 100%</p>
              <br />
              <p>
                <strong>维稳率计算公式：</strong>
              </p>
              <p>维稳率 = 100% - 退费率</p>
              <br />
              <p style={{ color: '#666', fontSize: '12px' }}>* 退费率将根据输入的数据自动计算</p>
              <p style={{ color: '#666', fontSize: '12px' }}>
                * 当入学人数为0时，退费率显示为0%，避免除零错误
              </p>
            </div>
          </Card>
        </Col>
      </Row>
    </Form>
  )
}

export default DataForm
