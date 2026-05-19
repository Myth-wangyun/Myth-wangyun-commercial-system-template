import React, { useState } from 'react'
import { App, Form, InputNumber, DatePicker, Button, Space, Card } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'

interface VideoRegisterProps {
  campusId: string
  campusName: string
}

const VideoRegister: React.FC<VideoRegisterProps> = ({ campusId, campusName }) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
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
    <Card title={`${campusName}-视频平台数据登记`}>
      <style>{`
        .ant-input-number-input {
          text-align: center;
        }
      `}</style>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <DatePicker
          value={selectedDate}
          onChange={(date) => date && setSelectedDate(date)}
          format="YYYY年MM月DD日"
          style={{ width: 200 }}
        />

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Card type="inner" title="新媒体-视频平台汇总数据" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <Form.Item label="视频平台实际收入" name="actualIncome">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="退费数" name="refundCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="净报名" name="netEnrollment">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="毛报总数" name="grossEnrollment">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="订座数" name="reservationCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="上门人数" name="visitCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="视频视频号总量" name="videoTotal">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="视频平台消费" name="expense">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>
          </Card>

          <Card type="inner" title="爱奇艺-基础数据" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <Form.Item label="有效条数" name="iqiyiValidCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="总展现量" name="iqiyiDisplayTotal">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="总播放量" name="iqiyiPlayTotal">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="总播放时长(秒)" name="iqiyiPlayDurationTotal">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="总播放完成率(%)" name="iqiyiCompletionRateTotal">
                <InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="总评论量" name="iqiyiCommentTotal">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="总点赞量" name="iqiyiLikeTotal">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="咨询量" name="iqiyiConsult">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>
          </Card>

          <Card type="inner" title="优酷-基础数据" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <Form.Item label="有效条数" name="youkuValidCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="播放数" name="youkuPlayCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="点赞数" name="youkuLikeCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="评论数" name="youkuCommentCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="分享数" name="youkuShareCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="粉丝数" name="youkuFansCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="咨询量" name="youkuConsult">
                <InputNumber min={0} style={{ width: '100%' }} />
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

export default VideoRegister

