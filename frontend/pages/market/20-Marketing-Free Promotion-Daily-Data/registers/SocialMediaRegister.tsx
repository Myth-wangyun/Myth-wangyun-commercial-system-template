import React, { useState, useEffect } from 'react'
import { App, Form, InputNumber, DatePicker, Button, Space, Card } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import axios from 'axios'

interface SocialMediaRegisterProps {
  campusId: string
  campusName: string
}

const SocialMediaRegister: React.FC<SocialMediaRegisterProps> = ({ campusId, campusName }) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [loading, setLoading] = useState(false)

  // 加载指定日期的数据
  const loadData = async (date: Dayjs) => {
    if (!campusName) return
    
    try {
      const dateStr = date.format('YYYY-MM-DD')
      const month = date.format('YYYY-MM')
      
      const response = await axios.get('/api/v1/market/free-promotion-daily/social-media/list', {
        params: {
          campus: campusName,
          month: month,
        }
      })
      
      if (response.data?.code === 0) {
        const items = response.data.data?.items || []
        const dataItem = items.find((item: any) => item.date === dateStr)
        
        if (dataItem) {
          form.setFieldsValue({
            actualIncome: dataItem.actualIncome,
            refundCount: dataItem.refundCount,
            netSignup: dataItem.netSignup,
            grossTotal: dataItem.grossTotal,
            orderCount: dataItem.orderCount,
            visitCount: dataItem.visitCount,
            consultCount: dataItem.consultCount,
            consumption: dataItem.consumption,
            // 抖音数据
            douyinValidCount: dataItem.douyinValidCount,
            douyinPlayCount: dataItem.douyinPlayCount,
            douyinLikeCount: dataItem.douyinLikeCount,
            douyinCommentCount: dataItem.douyinCommentCount,
            douyinShareCount: dataItem.douyinShareCount,
            douyinCollectCount: dataItem.douyinCollectCount,
            douyinConsultCount: dataItem.douyinConsultCount,
            // 快手数据
            kuaishouValidCount: dataItem.kuaishouValidCount,
            kuaishouPlayCount: dataItem.kuaishouPlayCount,
            kuaishouLikeCount: dataItem.kuaishouLikeCount,
            kuaishouCommentCount: dataItem.kuaishouCommentCount,
            kuaishouShareCount: dataItem.kuaishouShareCount,
            kuaishouCollectCount: dataItem.kuaishouCollectCount,
            kuaishouFansGrowth: dataItem.kuaishouFansGrowth,
          })
        } else {
          form.resetFields()
        }
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  useEffect(() => {
    loadData(selectedDate)
  }, [campusName, selectedDate])

  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const data = {
        campus: campusName,
        date: selectedDate.format('YYYY-MM-DD'),
        ...values,
      }
      
      const response = await axios.post('/api/v1/market/free-promotion-daily/social-media/save', data)
      
      if (response.data?.code === 0) {
        message.success('保存成功')
      } else {
        message.error(response.data?.message || '保存失败')
      }
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="社交新媒体数据登记">
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

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Card type="inner" title="汇总数据" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <Form.Item label="实际收入" name="actualIncome">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="退费数" name="refundCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="净报名" name="netSignup">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="毛报总数" name="grossTotal">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="订座数" name="orderCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="上门人数" name="visitCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="咨询量" name="consultCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="消耗" name="consumption">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>
          </Card>

          <Card type="inner" title="抖音数据" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <Form.Item label="有效条数" name="douyinValidCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="播放量" name="douyinPlayCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="点赞量" name="douyinLikeCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="评论量" name="douyinCommentCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="分享量" name="douyinShareCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="收藏量" name="douyinCollectCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="咨询量" name="douyinConsultCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>
          </Card>

          <Card type="inner" title="快手数据" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <Form.Item label="有效条数" name="kuaishouValidCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="播放量" name="kuaishouPlayCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="点赞量" name="kuaishouLikeCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="评论量" name="kuaishouCommentCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="分享量" name="kuaishouShareCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="收藏量" name="kuaishouCollectCount">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="涨粉量" name="kuaishouFansGrowth">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>
          </Card>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} size="large">
              保存数据
            </Button>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  )
}

export default SocialMediaRegister
