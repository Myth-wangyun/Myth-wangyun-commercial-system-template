import React, { useState } from 'react'
import { App, Form, InputNumber, DatePicker, Button, Space, Card } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'

interface ClassifiedRegisterProps {
  campusId: string
  campusName: string
}

const ClassifiedRegister: React.FC<ClassifiedRegisterProps> = ({ campusId, campusName }) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [loading, setLoading] = useState(false)

  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      // 后续接入API
      message.success('保存成功')
      console.log('提交数据:', {
        campus: campusName,
        date: selectedDate.format('YYYY-MM-DD'),
        ...values
      })
    } catch (error) {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title={`${campusName}-分类信息数据登记`}>
      <style>{`
        .ant-input-number-input {
          text-align: center;
        }
      `}</style>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <DatePicker
          value={selectedDate}
          onChange={handleDateChange}
          format="YYYY年MM月DD日"
          style={{ width: 200 }}
        />

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Card type="inner" title="新媒体-分类信息汇总数据" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <Form.Item label="分类信息实际收入" name="actualIncome">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
              <Form.Item label="退费数" name="refundCount">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
              <Form.Item label="净报名" name="netEnrollment">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
              <Form.Item label="毛报总数" name="grossEnrollment">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
              <Form.Item label="订座数" name="reservationCount">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
              <Form.Item label="上门人数" name="visitCount">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
              <Form.Item label="分类信息咨询量" name="consultationCount">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
              <Form.Item label="分类信息花费" name="expense">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </div>
          </Card>

          <Card type="inner" title="分类信息基础数据" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <Form.Item label="有效分类信息量" name="validClassifiedCount">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
              <Form.Item label="有效量" name="validCount">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
              <Form.Item label="浏览量" name="viewCount">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
              <Form.Item label="点赞量" name="likeCount">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
              <Form.Item label="分享量" name="shareCount">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
              <Form.Item label="咨询量" name="inquiryCount">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </div>
          </Card>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存
              </Button>
              <Button onClick={() => form.resetFields()}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  )
}

export default ClassifiedRegister

