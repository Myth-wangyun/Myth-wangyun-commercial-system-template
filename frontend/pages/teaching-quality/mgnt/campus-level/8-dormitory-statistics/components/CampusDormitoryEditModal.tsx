import React, { useEffect } from 'react'
import { App, Modal, Form, Input, InputNumber, Select, Row, Col, Divider } from 'antd'
import type { CampusDormitoryRecord, CampusDormitoryEditModalProps } from '@/types/campus-dormitory'

const { Option } = Select

const CampusDormitoryEditModal: React.FC<CampusDormitoryEditModalProps> = ({
  visible,
  record,
  onCancel,
  onSave,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  useEffect(() => {
    if (visible && record) {
      form.setFieldsValue(record)
    } else if (visible && !record) {
      form.resetFields()
    }
  }, [visible, record, form])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()

      // 自动计算住宿率
      const occupancyRate =
        values.enrolledStudentCount > 0
          ? (values.totalResidentCount / values.enrolledStudentCount) * 100
          : 0

      // 自动计算空床位数（假设每个宿舍4个床位）
      const maleVacantBedCount = Math.max(
        0,
        values.maleDormitoryCount * 4 - values.maleResidentCount,
      )
      const femaleVacantBedCount = Math.max(
        0,
        values.femaleDormitoryCount * 4 - values.femaleResidentCount,
      )

      // 自动计算适合新生床位数（预留20%缓冲）
      const maleNewStudentBedCount = Math.floor(maleVacantBedCount * 0.8)
      const femaleNewStudentBedCount = Math.floor(femaleVacantBedCount * 0.8)

      const updatedRecord: CampusDormitoryRecord = {
        key: record?.key || `${values.campus}-${values.month}`,
        month: values.month,
        campus: values.campus,
        enrolledStudentCount: values.enrolledStudentCount,
        totalDormitoryCount: values.totalDormitoryCount,
        totalResidentCount: values.totalResidentCount,
        occupancyRate,
        maleDormitoryCount: values.maleDormitoryCount,
        maleResidentCount: values.maleResidentCount,
        maleVacantBedCount,
        maleNewStudentBedCount,
        femaleDormitoryCount: values.femaleDormitoryCount,
        femaleResidentCount: values.femaleResidentCount,
        femaleVacantBedCount,
        femaleNewStudentBedCount,
        plannedRentCount: values.plannedRentCount,
        actualRentCount: values.actualRentCount,
        plannedVacateCount: values.plannedVacateCount,
        actualVacateCount: values.actualVacateCount,
        remarks: values.remarks,
      }

      onSave(updatedRecord)
      message.success(record ? '更新成功' : '创建成功')
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title={`${record ? '编辑' : '新增'}${record?.campus || ''}神殿宿舍统计记录`}
      open={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      width={1000}
      okText="保存"
      cancelText="取消"
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="月份"
              name="month"
              rules={[{ required: true, message: '请选择月份' }]}
            >
              <Select placeholder="请选择月份" disabled={!!record}>
                {Array.from({ length: 12 }, (_, i) => (
                  <Option key={i + 1} value={i + 1}>
                    {i + 1}月
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="神殿"
              name="campus"
              rules={[{ required: true, message: '请输入神殿' }]}
            >
              <Input disabled={true} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">基础数据</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="在校生数"
              name="enrolledStudentCount"
              rules={[{ required: true, message: '请输入在校生数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入在校生数" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="宿舍总数量"
              name="totalDormitoryCount"
              rules={[{ required: true, message: '请输入宿舍总数量' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入宿舍总数量" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="住宿总人数"
              name="totalResidentCount"
              rules={[{ required: true, message: '请输入住宿总人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入住宿总人数" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">男宿情况</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="男宿总数量"
              name="maleDormitoryCount"
              rules={[{ required: true, message: '请输入男宿总数量' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入男宿总数量" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="男宿总人数"
              name="maleResidentCount"
              rules={[{ required: true, message: '请输入男宿总人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入男宿总人数" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">女宿情况</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="女宿总数量"
              name="femaleDormitoryCount"
              rules={[{ required: true, message: '请输入女宿总数量' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入女宿总数量" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="女宿总人数"
              name="femaleResidentCount"
              rules={[{ required: true, message: '请输入女宿总人数' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入女宿总人数" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">租宿舍情况</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="计划租宿舍数量"
              name="plannedRentCount"
              rules={[{ required: true, message: '请输入计划租宿舍数量' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入计划租宿舍数量" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="实际租宿舍数量"
              name="actualRentCount"
              rules={[{ required: true, message: '请输入实际租宿舍数量' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入实际租宿舍数量" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">退宿舍情况</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="计划退宿舍数量"
              name="plannedVacateCount"
              rules={[{ required: true, message: '请输入计划退宿舍数量' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入计划退宿舍数量" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="实际退宿舍数量"
              name="actualVacateCount"
              rules={[{ required: true, message: '请输入实际退宿舍数量' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入实际退宿舍数量" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">备注</Divider>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="备注" name="remarks">
              <Input.TextArea rows={3} placeholder="请输入备注信息" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">计算说明</Divider>
        <div
          style={{
            background: '#f6ffed',
            padding: 12,
            borderRadius: 6,
            border: '1px solid #b7eb8f',
          }}
        >
          <p style={{ margin: 0, color: '#52c41a', fontWeight: 'bold' }}>📊 自动计算公式：</p>
          <p style={{ margin: '4px 0 0 0', color: '#666' }}>
            • 住宿率 = 住宿总人数 ÷ 在校生数 × 100%
          </p>
          <p style={{ margin: '4px 0 0 0', color: '#666' }}>• 空床位数 = 宿舍数量 × 4 - 住宿人数</p>
          <p style={{ margin: '4px 0 0 0', color: '#666' }}>
            • 适合新生床位数 = 空床位数 × 80%（预留20%缓冲）
          </p>
        </div>
      </Form>
    </Modal>
  )
}

export default CampusDormitoryEditModal
