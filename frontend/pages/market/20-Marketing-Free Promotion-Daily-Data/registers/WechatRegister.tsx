import React, { useState } from 'react'
import { App, Form, InputNumber, DatePicker, Button, Space, Card } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'

interface WechatRegisterProps {
  campusId: string
  campusName: string
}

const WechatRegister: React.FC<WechatRegisterProps> = ({ campusId, campusName }) => {
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
    <Card title={`${campusName}-微信平台数据登记`}>
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
          <Card type="inner" title="新媒体-微信平台汇总数据" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <Form.Item label="微信平台实际收入" name="actualIncome">
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
              <Form.Item label="微信视频号总量" name="videoTotal">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="微信平台消费" name="expense">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>
          </Card>

          <Card type="inner" title="微信视频号-播放数据" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <Form.Item label="有效条数" name="videoValidCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="数据诊断结果均值" name="videoDiagnosticAvg">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="播放量" name="videoPlayCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="完播率(%)" name="videoCompletionRate">
                <InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="平均播放时长(秒)" name="videoAvgPlayDuration">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="3s以上播放率(%)" name="video3sPlayRate">
                <InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </div>
          </Card>

          <Card type="inner" title="微信视频号-互动数据" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <Form.Item label="喜欢" name="videoLike">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="点赞" name="videoThumbsUp">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="评论" name="videoComment">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="新增关注" name="videoNewFollow">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="转发总量" name="videoShare">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="咨询量" name="videoConsult">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>
          </Card>

          <Card type="inner" title="微信公众号-互动数据" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <Form.Item label="有效条数" name="articleValidCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="阅读人数" name="articleReadCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="点赞" name="articleLike">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="分享人数" name="articleShareCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="推荐人数" name="articleRecommendCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="留言条数" name="articleCommentCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="咨询量" name="articleConsult">
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

export default WechatRegister

