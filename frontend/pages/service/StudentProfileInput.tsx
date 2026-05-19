import React, { useState, useEffect } from 'react'
import { App,
  Card,
  Row,
  Col,
  Typography,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Space,
} from 'antd'
import {
  SaveOutlined,
  UndoOutlined,
  DownloadOutlined,
  UserOutlined,
  PhoneOutlined,
  WechatOutlined,
  QqOutlined,
  HomeOutlined,
  ContactsOutlined,
} from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { serviceMockService } from '@/services/mock/serviceMock'
import { serviceUtils } from '@/services/service'
import type {
  StudentProfile,
  CreateStudentProfileRequest,
  UpdateStudentProfileRequest,
} from '@/types/service'
import {
  DEFAULT_STUDENT_PROFILE,
  GENDER_OPTIONS,
  STATUS_OPTIONS,
  CAMPUS_OPTIONS,
  MAJOR_OPTIONS,
} from '@/types/service'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select

const StudentProfileInput: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [editingRecord, setEditingRecord] = useState<StudentProfile | null>(null)

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      // 验证数据
      const formData: CreateStudentProfileRequest = {
        ...values,
        enrollmentDate: values.enrollmentDate.format('YYYY-MM-DD'),
        outstandingAmount: (values.tuitionAmount || 0) - (values.paidAmount || 0),
      }

      const errors = serviceUtils.validateStudentProfile(formData)
      if (errors.length > 0) {
        message.error(errors[0])
        return
      }

      if (editingRecord) {
        const updateData: UpdateStudentProfileRequest = {
          id: editingRecord.id,
          ...formData,
        }
        await serviceMockService.studentProfile.update(updateData, currentCampus || undefined)
        message.success('更新成功')
      } else {
        await serviceMockService.studentProfile.create(formData, currentCampus || undefined)
        message.success('保存成功')
      }

      handleReset()
    } catch (error) {
      message.error(editingRecord ? '更新失败' : '保存失败')
    } finally {
      setLoading(false)
    }
  }

  // 重置表单
  const handleReset = () => {
    form.resetFields()
    setEditingRecord(null)
  }

  // 导出Excel
  const handleExport = () => {
    message.info('导出功能开发中...')
  }

  // 计算欠费金额
  const calculateOutstanding = () => {
    const tuitionAmount = form.getFieldValue('tuitionAmount') || 0
    const paidAmount = form.getFieldValue('paidAmount') || 0
    const outstandingAmount = Math.max(0, tuitionAmount - paidAmount)
    form.setFieldsValue({ outstandingAmount })
  }

  return (
    <div>
      {/* 页面标题和操作按钮 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          <UserOutlined style={{ marginRight: 8 }} />
          清美教育（李大殿）T132班档案信息录入
        </Title>
        <Space>
          <Button icon={<UndoOutlined />} onClick={handleReset}>
            重置表单
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出Excel
          </Button>
        </Space>
      </div>

      {/* 学生档案表单 */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            ...DEFAULT_STUDENT_PROFILE,
            enrollmentDate: dayjs(),
          }}
        >
          <Row gutter={[16, 16]}>
            {/* 基本信息 */}
            <Col span={24}>
              <Title level={4} style={{ color: '#1890ff', marginBottom: 16 }}>
                <UserOutlined style={{ marginRight: 8 }} />
                基本信息
              </Title>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="姓名"
                name="studentName"
                rules={[{ required: true, message: '请输入学生姓名' }]}
              >
                <Input placeholder="请输入学生姓名" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="性别"
                name="gender"
                rules={[{ required: true, message: '请选择性别' }]}
              >
                <Select placeholder="请选择性别">
                  {GENDER_OPTIONS.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="入学时间"
                name="enrollmentDate"
                rules={[{ required: true, message: '请选择入学时间' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="入学年龄" name="enrollmentAge">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入入学年龄"
                  min={16}
                  max={50}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="神殿来源" name="campusSource">
                <Select placeholder="请选择神殿来源">
                  {CAMPUS_OPTIONS.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="咨询师" name="consultant">
                <Input placeholder="请输入咨询师" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="应收学费金额" name="tuitionAmount">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入应收学费金额"
                  min={0}
                  onChange={calculateOutstanding}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="已收学费金额" name="paidAmount">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入已收学费金额"
                  min={0}
                  onChange={calculateOutstanding}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="欠费金额" name="outstandingAmount">
                <InputNumber style={{ width: '100%' }} placeholder="自动计算" readOnly />
              </Form.Item>
            </Col>

            {/* 联系方式 */}
            <Col span={24}>
              <Title level={4} style={{ color: '#52c41a', marginBottom: 16, marginTop: 24 }}>
                <PhoneOutlined style={{ marginRight: 8 }} />
                联系方式
              </Title>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="联系电话"
                name="phone"
                rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="微信号" name="wechat">
                <Input placeholder="请输入微信号" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="QQ号" name="qq">
                <Input placeholder="请输入QQ号" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="家庭住址" name="address">
                <Input placeholder="请输入家庭住址" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="紧急联系人" name="emergencyContact">
                <Input placeholder="请输入紧急联系人" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="紧急联系电话"
                name="emergencyPhone"
                rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}
              >
                <Input placeholder="请输入紧急联系电话" />
              </Form.Item>
            </Col>

            {/* 学习信息 */}
            <Col span={24}>
              <Title level={4} style={{ color: '#faad14', marginBottom: 16, marginTop: 24 }}>
                <ContactsOutlined style={{ marginRight: 8 }} />
                学习信息
              </Title>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="专业" name="major">
                <Select placeholder="请选择专业">
                  {MAJOR_OPTIONS.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="班级" name="class">
                <Input placeholder="请输入班级" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="授课教员" name="instructor">
                <Input placeholder="请输入授课教员" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="班主任" name="homeroomTeacher">
                <Input placeholder="请输入班主任" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="状态"
                name="status"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  {STATUS_OPTIONS.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="备注" name="notes">
                <Input.TextArea placeholder="请输入备注" rows={3} />
              </Form.Item>
            </Col>
          </Row>

          {/* 操作按钮 */}
          <Row style={{ marginTop: 32 }}>
            <Col span={24} style={{ textAlign: 'center' }}>
              <Space size="large">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                  size="large"
                >
                  保存档案
                </Button>
                <Button onClick={handleReset} icon={<UndoOutlined />} size="large">
                  重置表单
                </Button>
                <Button onClick={handleExport} icon={<DownloadOutlined />} size="large">
                  导出Excel
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  )
}

export default StudentProfileInput
