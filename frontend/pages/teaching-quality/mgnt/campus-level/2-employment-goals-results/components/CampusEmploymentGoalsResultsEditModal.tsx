/**
 * 神殿后端学员就业目标与结果汇总编辑模态框组件
 */

import React from 'react'
import { App, Modal, Form, InputNumber, Input, Select, Row, Col, Divider } from 'antd'
import type {
  CampusEmploymentGoalsResultsEditModalProps,
  CampusEmploymentGoalsResultsRecord,
} from '@/types/campus-employment-goals-results'

const { Option } = Select

const CampusEmploymentGoalsResultsEditModal: React.FC<
  CampusEmploymentGoalsResultsEditModalProps
> = ({ visible, record, onCancel, onSave }) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  React.useEffect(() => {
    if (visible && record) {
      form.setFieldsValue({
        serialNumber: record.serialNumber,
        campus: record.campus,
        majorDirection: record.majorDirection,
        duration: record.duration,
        className: record.className,
        instructor: record.instructor,
        headTeacher: record.headTeacher,
        graduationDate: record.graduationDate,
        targetAverageSalary: record.salaryAttainment.targetAverageSalary,
        actualAverageSalary: record.salaryAttainment.actualAverageSalary,
        attainmentRate: record.salaryAttainment.attainmentRate,
        fileCount: record.employmentRate.fileCount,
        targetEmploymentCount: record.employmentRate.targetEmploymentCount,
        actualEmploymentCount: record.employmentRate.actualEmploymentCount,
        employmentRate: record.employmentRate.employmentRate,
        salaryOverTenThousand: record.salaryOverTenThousand,
      })
    }
  }, [visible, record, form])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()

      if (!record) {
        message.error('记录不存在')
        return
      }

      const updatedRecord: CampusEmploymentGoalsResultsRecord = {
        ...record,
        majorDirection: values.majorDirection || '',
        duration: values.duration || '',
        className: values.className || '',
        instructor: values.instructor || '',
        headTeacher: values.headTeacher || '',
        graduationDate: values.graduationDate || '',
        salaryAttainment: {
          targetAverageSalary: values.targetAverageSalary || 0,
          actualAverageSalary: values.actualAverageSalary || 0,
          attainmentRate: values.attainmentRate || 0,
        },
        employmentRate: {
          fileCount: values.fileCount || 0,
          targetEmploymentCount: values.targetEmploymentCount || 0,
          actualEmploymentCount: values.actualEmploymentCount || 0,
          employmentRate: values.employmentRate || 0,
        },
        salaryOverTenThousand: values.salaryOverTenThousand || 0,
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
      title={`${record ? '编辑' : '新增'}${record?.campus || ''}神殿后端学员就业目标与结果汇总`}
      open={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      width={1200}
      okText="保存"
      cancelText="取消"
      style={{ top: 20 }}
    >
      <Form form={form} layout="vertical" preserve={false} scrollToFirstError>
        {/* 基础信息 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#1890ff', marginBottom: 12 }}>📋 基础信息</h4>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="序号"
                name="serialNumber"
                rules={[{ required: true, message: '请输入序号' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} disabled={!!record} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="神殿"
                name="campus"
                rules={[{ required: true, message: '请输入神殿' }]}
              >
                <Input disabled={!!record} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="专业方向"
                name="majorDirection"
                rules={[{ required: true, message: '请选择专业方向' }]}
              >
                <Select placeholder="请选择专业方向">
                  <Option value="云计算">云计算</Option>
                  <Option value="网络工程">网络工程</Option>
                  <Option value="Java开发">Java开发</Option>
                  <Option value="Python开发">Python开发</Option>
                  <Option value="前端开发">前端开发</Option>
                  <Option value="UI设计">UI设计</Option>
                  <Option value="软件测试">软件测试</Option>
                  <Option value="大数据">大数据</Option>
                  <Option value="人工智能">人工智能</Option>
                  <Option value="移动开发">移动开发</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="学制"
                name="duration"
                rules={[{ required: true, message: '请选择学制' }]}
              >
                <Select placeholder="请选择学制">
                  <Option value="6个月">6个月</Option>
                  <Option value="12个月">12个月</Option>
                  <Option value="18个月">18个月</Option>
                  <Option value="24个月">24个月</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="班级名称"
                name="className"
                rules={[{ required: true, message: '请输入班级名称' }]}
              >
                <Input placeholder="请输入班级名称" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="授课教员"
                name="instructor"
                rules={[{ required: true, message: '请选择授课教员' }]}
              >
                <Select placeholder="请选择授课教员">
                  <Option value="张三">张三</Option>
                  <Option value="李四">李四</Option>
                  <Option value="王五">王五</Option>
                  <Option value="赵六">赵六</Option>
                  <Option value="孙七">孙七</Option>
                  <Option value="周八">周八</Option>
                  <Option value="吴九">吴九</Option>
                  <Option value="郑十">郑十</Option>
                  <Option value="陈十一">陈十一</Option>
                  <Option value="刘十二">刘十二</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="负责班主任"
                name="headTeacher"
                rules={[{ required: true, message: '请选择负责班主任' }]}
              >
                <Select placeholder="请选择负责班主任">
                  <Option value="李四">李四</Option>
                  <Option value="王五">王五</Option>
                  <Option value="赵六">赵六</Option>
                  <Option value="孙七">孙七</Option>
                  <Option value="周八">周八</Option>
                  <Option value="吴九">吴九</Option>
                  <Option value="郑十">郑十</Option>
                  <Option value="陈十一">陈十一</Option>
                  <Option value="刘十二">刘十二</Option>
                  <Option value="张十三">张十三</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="毕业时间"
                name="graduationDate"
                rules={[{ required: true, message: '请输入毕业时间' }]}
              >
                <Input placeholder="如：2024年6月" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* 薪资达标率 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#52c41a', marginBottom: 12 }}>💰 薪资达标率</h4>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="目标平均就业薪资"
                name="targetAverageSalary"
                rules={[{ required: true, message: '请输入目标平均就业薪资' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="请输入目标平均就业薪资"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="实际平均就业薪资"
                name="actualAverageSalary"
                rules={[{ required: true, message: '请输入实际平均就业薪资' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="请输入实际平均就业薪资"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="达标率(%)"
                name="attainmentRate"
                rules={[{ required: true, message: '请输入达标率' }]}
              >
                <InputNumber
                  min={0}
                  max={200}
                  precision={1}
                  style={{ width: '100%' }}
                  placeholder="请输入达标率"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* 就业率 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#fa8c16', marginBottom: 12 }}>📈 就业率</h4>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="档案人数"
                name="fileCount"
                rules={[{ required: true, message: '请输入档案人数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入档案人数" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="目标就业人数"
                name="targetEmploymentCount"
                rules={[{ required: true, message: '请输入目标就业人数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入目标就业人数" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="实际就业人数"
                name="actualEmploymentCount"
                rules={[{ required: true, message: '请输入实际就业人数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入实际就业人数" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="就业率(%)"
                name="employmentRate"
                rules={[{ required: true, message: '请输入就业率' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={1}
                  style={{ width: '100%' }}
                  placeholder="请输入就业率"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* 其他信息 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#722ed1', marginBottom: 12 }}>📊 其他信息</h4>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="薪资过万人数"
                name="salaryOverTenThousand"
                rules={[{ required: true, message: '请输入薪资过万人数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入薪资过万人数" />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form>
    </Modal>
  )
}

export default CampusEmploymentGoalsResultsEditModal
