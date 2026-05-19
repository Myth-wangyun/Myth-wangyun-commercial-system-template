import React, { useEffect, useMemo } from 'react'
import { Form, InputNumber, Select, Row, Col, Card, Typography, DatePicker } from 'antd'
import type { ITeacherStaffingRatio, ITeacherStaffingRatioForm } from '../types'
import dayjs from 'dayjs'
import { useCampusStore, getCampusNamesWithFallback } from '@/stores/campusStore'

const { Option } = Select
const { Title } = Typography

interface DataFormProps {
  form: any
  editingRecord: ITeacherStaffingRatio | null
  onSubmit: (values: ITeacherStaffingRatioForm) => void
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
    // 延迟执行，确保 Form 组件已经挂载
    const timer = setTimeout(() => {
      if (editingRecord) {
        form.setFieldsValue({
          ...editingRecord,
          statisticsTime: editingRecord.statisticsTime ? dayjs(editingRecord.statisticsTime) : null,
        })
      } else {
        form.resetFields()
        // 设置默认值
        form.setFieldsValue({
          statisticsTime: dayjs(),
        })
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [editingRecord, form])

  const handleSubmit = (values: any) => {
    const formData: ITeacherStaffingRatioForm = {
      ...values,
      statisticsTime: values.statisticsTime ? values.statisticsTime.format('YYYY-MM') : '',
    }
    onSubmit(formData)
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="campus" label="神殿" rules={[{ required: true, message: '请选择神殿' }]}>
            <Select placeholder="请选择神殿">
              {campusOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="statisticsTime"
            label="统计时间"
            rules={[{ required: true, message: '请选择统计时间' }]}
          >
            <DatePicker picker="month" placeholder="选择统计时间" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="month" label="月份" rules={[{ required: true, message: '请选择月份' }]}>
            <Select placeholder="请选择月份">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <Option key={month} value={month}>
                  {month}月
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
            <Form.Item
              name="totalStudents"
              label="学生人数"
              rules={[
                { required: true, message: '请输入学生人数' },
                { type: 'number', min: 0, message: '人数不能为负数' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入学生人数"
                min={0}
                precision={0}
              />
            </Form.Item>
          </Card>
        </Col>
      </Row>

      <Title level={5}>教员职数分析</Title>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="targetTeacherStudentRatio"
            label="目标师资配比"
            rules={[{ required: true, message: '请输入目标师资配比' }]}
          >
            <Select placeholder="选择配比">
              <Option value="1:30">1:30</Option>
              <Option value="1:50">1:50</Option>
              <Option value="1:60">1:60</Option>
              <Option value="1:70">1:70</Option>
              <Option value="1:80">1:80</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="targetTeacherCount"
            label="目标老师数量"
            rules={[
              { required: true, message: '请输入目标老师数量' },
              { type: 'number', min: 0, message: '数量不能为负数' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入目标老师数量"
              min={0}
              precision={1}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="actualTeacherCount"
            label="实际老师数量"
            rules={[
              { required: true, message: '请输入实际老师数量' },
              { type: 'number', min: 0, message: '数量不能为负数' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入实际老师数量"
              min={0}
              precision={0}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="teacherVacancy"
            label="老师空缺"
            rules={[
              { required: true, message: '请输入老师空缺' },
              { type: 'number', min: 0, message: '空缺不能为负数' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入老师空缺"
              min={0}
              precision={0}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="teacherRedundancy"
            label="老师冗余"
            rules={[
              { required: true, message: '请输入老师冗余' },
              { type: 'number', min: 0, message: '冗余不能为负数' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入老师冗余"
              min={0}
              precision={0}
            />
          </Form.Item>
        </Col>
      </Row>

      <Title level={5}>干部职数分析</Title>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="targetCadreRatio"
            label="目标干部与教员配比"
            rules={[{ required: true, message: '请输入目标干部与教员配比' }]}
          >
            <Select placeholder="选择配比">
              <Option value="1:2">1:2</Option>
              <Option value="1:3">1:3</Option>
              <Option value="1:4">1:4</Option>
              <Option value="1:5">1:5</Option>
              <Option value="1:8">1:8</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="targetCadreCount"
            label="目标干部数量"
            rules={[
              { required: true, message: '请输入目标干部数量' },
              { type: 'number', min: 0, message: '数量不能为负数' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入目标干部数量"
              min={0}
              precision={1}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="actualCadreCount"
            label="实际干部数量"
            rules={[
              { required: true, message: '请输入实际干部数量' },
              { type: 'number', min: 0, message: '数量不能为负数' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入实际干部数量"
              min={0}
              precision={0}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="cadreVacancy"
            label="干部空缺"
            rules={[
              { required: true, message: '请输入干部空缺' },
              { type: 'number', min: 0, message: '空缺不能为负数' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入干部空缺"
              min={0}
              precision={0}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="cadreRedundancy"
            label="干部冗余"
            rules={[
              { required: true, message: '请输入干部冗余' },
              { type: 'number', min: 0, message: '冗余不能为负数' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入干部冗余"
              min={0}
              precision={0}
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  )
}

export default DataForm
