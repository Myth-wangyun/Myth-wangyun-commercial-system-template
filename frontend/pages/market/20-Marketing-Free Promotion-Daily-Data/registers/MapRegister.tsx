import React, { useState } from 'react'
import { App, Form, InputNumber, DatePicker, Button, Space, Card } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'

interface MapRegisterProps {
  campusId: string
  campusName: string
}

const MapRegister: React.FC<MapRegisterProps> = ({ campusId, campusName }) => {
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
    <Card title={`${campusName}-地图数据登记`}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <DatePicker
          value={selectedDate}
          onChange={(date) => date && setSelectedDate(date)}
          format="YYYY年MM月DD日"
          style={{ width: 200 }}
        />

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Card type="inner" title="新媒体-地图汇总数据" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <Form.Item label="地图实际收入" name="actualIncome">
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
              <Form.Item label="地图总量" name="mapTotal">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="地图消费" name="mapExpense">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>
          </Card>

          <Card type="inner" title="百度地图" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <Form.Item label="评论数" name="baiduComment">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="点赞数" name="baiduLike">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="图片数" name="baiduImage">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="精选案例数" name="baiduCase">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="产品服务数" name="baiduProduct">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="评论分" name="baiduScore">
                <InputNumber min={0} max={5} precision={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="电话/咨询量" name="baiduConsult">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>
          </Card>

          <Card type="inner" title="高德地图" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <Form.Item label="评论数" name="gaodeComment">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="点赞数" name="gaodeLike">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="图片数" name="gaodeImage">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="产品服务数" name="gaodeProduct">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="评论分" name="gaodeScore">
                <InputNumber min={0} max={5} precision={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="电话/咨询量" name="gaodeConsult">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>
          </Card>

          <Card type="inner" title="腾讯地图（微信地图）" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <Form.Item label="评论数" name="tencentComment">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="点赞数" name="tencentLike">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="图片数" name="tencentImage">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="产品服务数" name="tencentProduct">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="评论分" name="tencentScore">
                <InputNumber min={0} max={5} precision={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="电话/咨询量" name="tencentConsult">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>
          </Card>

          <Card type="inner" title="其他地图（360、谷歌等）" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <Form.Item label="评论数" name="otherComment">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="点赞数" name="otherLike">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="图片数" name="otherImage">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="产品服务数" name="otherProduct">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="评论分" name="otherScore">
                <InputNumber min={0} max={5} precision={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="电话/咨询量" name="otherConsult">
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

export default MapRegister

