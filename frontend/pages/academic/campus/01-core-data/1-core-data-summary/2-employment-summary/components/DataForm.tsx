import React, { useEffect } from 'react'
import { Form, InputNumber, Select, DatePicker, Row, Col, Card, Input } from 'antd'
import type { FormInstance } from 'antd'
import type { Dayjs } from 'dayjs'
import type { IEmploymentSummary, IEmploymentSummaryForm } from '../types'
import {
  CAMPUS_LIST,
  MAJOR_LIST,
  PROGRAM_LENGTHS,
} from '@/pages/academic/teaching-content/constants'
import dayjs from 'dayjs'

const { Option } = Select

interface DataFormProps {
  form: FormInstance<EmploymentSummaryFormValues>
  editingRecord: IEmploymentSummary | null
  onSubmit: (values: IEmploymentSummaryForm) => void
}

type EmploymentSummaryFormValues = Omit<IEmploymentSummaryForm, 'graduationTime'> & {
  graduationTime: Dayjs | null
}

const DataForm: React.FC<DataFormProps> = ({ form, editingRecord, onSubmit }) => {
  useEffect(() => {
    if (editingRecord) {
      form.setFieldsValue({
        ...(editingRecord as unknown as EmploymentSummaryFormValues),
        graduationTime: dayjs(editingRecord.graduationTime),
      })
    }
  }, [editingRecord, form])

const handleSubmit = (values: EmploymentSummaryFormValues) => {
    const formData: IEmploymentSummaryForm = {
      ...values,
      graduationTime: (values.graduationTime ?? dayjs()).format('YYYY-MM-DD'),
    }
    onSubmit(formData)
  }

  return (
    <Form<EmploymentSummaryFormValues>
      form={form as unknown as FormInstance<EmploymentSummaryFormValues>}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        graduationTime: dayjs(),
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Card title="基本信息" size="small">
            <Form.Item
              name="campus"
              label="神殿"
              rules={[{ required: true, message: '请选择神殿' }]}
            >
              <Select placeholder="请选择神殿" disabled>
                {CAMPUS_LIST.map((campus) => (
                  <Option key={campus} value={campus}>
                    {campus}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="major"
              label="专业"
              rules={[{ required: true, message: '请选择专业' }]}
            >
              <Select placeholder="请选择专业" disabled>
                {MAJOR_LIST.map((major) => (
                  <Option key={major} value={major}>
                    {major}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="programLength"
              label="学制"
              rules={[{ required: true, message: '请选择学制' }]}
            >
              <Select placeholder="请选择学制" disabled>
                {PROGRAM_LENGTHS.map((length) => (
                  <Option key={length} value={length}>
                    {length}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="className"
              label="班级名称"
              rules={[{ required: true, message: '请输入班级名称' }]}
            >
              <Input placeholder="请输入班级名称" disabled />
            </Form.Item>

            <Form.Item
              name="instructor"
              label="授课教员"
              rules={[{ required: true, message: '请输入授课教员' }]}
            >
              <Input placeholder="请输入授课教员" disabled />
            </Form.Item>

            <Form.Item
              name="classTeacher"
              label="班主任"
              rules={[{ required: true, message: '请输入班主任' }]}
            >
              <Input placeholder="请输入班主任" disabled />
            </Form.Item>

            <Form.Item
              name="graduationTime"
              label="毕业时间"
              rules={[{ required: true, message: '请选择毕业时间' }]}
            >
              <DatePicker style={{ width: '100%' }} disabled />
            </Form.Item>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="就业薪资数据" size="small">
            <Form.Item
              name="targetAvgSalary"
              label="目标平均就业薪资 (元)"
              rules={[
                { required: true, message: '请输入目标平均就业薪资' },
                { type: 'number', min: 0, message: '薪资不能为负数' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入目标平均就业薪资"
                min={0}
                precision={0}
                formatter={(value) =>
                  value == null
                    ? ''
                    : `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
                parser={(value) => Number((value || '').replace(/¥\s?|(,*)/g, '')) as any}
              />
            </Form.Item>

            <Form.Item
              name="actualAvgSalary"
              label="实际平均就业薪资 (元)"
              rules={[
                { required: true, message: '请输入实际平均就业薪资' },
                { type: 'number', min: 0, message: '薪资不能为负数' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入实际平均就业薪资"
                min={0}
                precision={0}
                disabled
                formatter={(value) =>
                  value == null
                    ? ''
                    : `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
                parser={(value) => Number((value || '').replace(/¥\s?|(,*)/g, '')) as any}
              />
            </Form.Item>

            <Form.Item
              name="salaryOver10k"
              label="薪资过万人数"
              rules={[
                { required: true, message: '请输入薪资过万人数' },
                { type: 'number', min: 0, message: '人数不能为负数' },
              ]}
            >
              <InputNumber style={{ width: '100%' }} placeholder="请输入薪资过万人数" min={0} disabled />
            </Form.Item>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="就业人数数据" size="small">
            <Form.Item
              name="archivedCount"
              label="档案人数"
              rules={[
                { required: true, message: '请输入档案人数' },
                { type: 'number', min: 0, message: '人数不能为负数' },
              ]}
            >
              <InputNumber style={{ width: '100%' }} placeholder="请输入档案人数" min={0} disabled />
            </Form.Item>

            <Form.Item
              name="targetEmployment"
              label="目标就业人数"
              rules={[
                { required: true, message: '请输入目标就业人数' },
                { type: 'number', min: 0, message: '人数不能为负数' },
              ]}
            >
              <InputNumber style={{ width: '100%' }} placeholder="请输入目标就业人数" min={0} />
            </Form.Item>

            <Form.Item
              name="actualEmployment"
              label="实际就业人数"
              rules={[
                { required: true, message: '请输入实际就业人数' },
                { type: 'number', min: 0, message: '人数不能为负数' },
              ]}
            >
              <InputNumber style={{ width: '100%' }} placeholder="请输入实际就业人数" min={0} disabled />
            </Form.Item>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="计算说明" size="small">
            <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
              <p>
                <strong>达标率计算公式：</strong>
              </p>
              <p>达标率 = (实际平均就业薪资 ÷ 目标平均就业薪资) × 100%</p>
              <br />
              <p>
                <strong>就业率计算公式：</strong>
              </p>
              <p>就业率 = (实际就业人数 ÷ 档案人数) × 100%</p>
              <br />
              <p style={{ color: '#666', fontSize: '12px' }}>
                * 达标率和就业率将根据输入的数据自动计算
              </p>
              <p style={{ color: '#666', fontSize: '12px' }}>
                * 实际值、班级信息来自教质和配置中心，本页只维护智慧司目标值
              </p>
            </div>
          </Card>
        </Col>
      </Row>
    </Form>
  )
}

export default DataForm
