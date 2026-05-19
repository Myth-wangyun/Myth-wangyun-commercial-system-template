/**
 * 缴费记录表单组件
 * 用于添加和编辑缴费记录
 */

import React, { useEffect } from 'react'
import { 
  App,
  Modal, 
  Form, 
  Input, 
  InputNumber,
  DatePicker, 
  Select, 
} from 'antd'
import dayjs from 'dayjs'
import type { PaymentRecord, PaymentSummary, CreatePaymentRequest, UpdatePaymentRequest } from './paymentApi'

interface PaymentRecordFormProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
  recordId: number        // 咨询量记录ID
  objectId: number        // 咨询对象ID
  editingRecord?: PaymentRecord | null  // 编辑时传入
  paymentType?: '首款' | '后续交费'      // 新增时指定类型
  hasFirstPayment?: boolean  // 是否已有首款
  paymentSummary?: PaymentSummary | null  // 缴费汇总信息（包含应交金额）
}

const paymentMethods = [
  '现金',
  '微信',
  '支付宝',
  '银行转账',
  '刷卡',
  '其他'
]

const PaymentRecordForm: React.FC<PaymentRecordFormProps> = ({
  visible,
  onClose,
  onSuccess,
  recordId,
  objectId,
  editingRecord,
  paymentType,
  hasFirstPayment = false,
  paymentSummary
}) => {
  const { message, notification } = App.useApp()
  const [form] = Form.useForm()
  const isEditing = !!editingRecord

  useEffect(() => {
    if (visible) {
      if (editingRecord) {
        // 编辑模式
        form.setFieldsValue({
          ...editingRecord,
          缴费时间: editingRecord.缴费时间 ? dayjs(editingRecord.缴费时间) : undefined,
          // 编辑首款时，设置应交金额
          应交金额: editingRecord.缴费类型 === '首款' ? paymentSummary?.应交金额 : undefined
        })
      } else {
        // 新增模式
        form.resetFields()
        form.setFieldsValue({
          缴费类型: paymentType || (hasFirstPayment ? '后续交费' : '首款'),
          缴费时间: dayjs()
        })
      }
    }
  }, [visible, editingRecord, paymentType, hasFirstPayment, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      const submitData = {
        ...values,
        缴费时间: values.缴费时间?.format('YYYY-MM-DD HH:mm:ss')
      }

      if (isEditing) {
        // 编辑模式：更新首款或后续交费
        if (editingRecord?.缴费类型 === '首款') {
          // 更新首款信息
          const params = new URLSearchParams()
          params.append('首款金额', String(submitData.缴费金额 || 0))
          if (submitData.缴费时间) params.append('首款时间', submitData.缴费时间)
          if (submitData.缴费方式) params.append('首款方式', submitData.缴费方式)
          if (submitData.收款人) params.append('首款收款人', submitData.收款人)
          if (submitData.凭证号) params.append('首款凭证号', submitData.凭证号)
          if (submitData.备注) params.append('首款备注', submitData.备注)
          
          const response = await fetch(`/api/v1/consult/payment/first-payment/${recordId}?${params.toString()}`, {
            method: 'PUT'
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.detail || '更新首款失败')
          }
          
          // 如果设置了应交金额，更新汇总
          if (submitData.应交金额 !== undefined && submitData.应交金额 !== null) {
            const amountResponse = await fetch(`/api/v1/consult/payment/amount/${recordId}?应交金额=${submitData.应交金额}`, {
              method: 'PUT'
            })
            
            if (!amountResponse.ok) {
              console.warn('设置应交金额失败，但首款已更新')
            }
          }
        } else {
          // 更新后续交费明细（暂时不支持，可以删除后重新添加）
          message.warning('暂不支持编辑后续交费，请删除后重新添加')
          return
        }
        
        notification.success({ message: '已保存', description: '缴费记录更新成功', placement: 'topRight', duration: 3 })
      } else {
        // 新增模式
        if (submitData.缴费类型 === '首款') {
          // 添加首款 - 使用 PUT /payment/first-payment/{record_id}
          const params = new URLSearchParams()
          params.append('首款金额', String(submitData.缴费金额 || 0))
          if (submitData.缴费时间) params.append('首款时间', submitData.缴费时间)
          if (submitData.缴费方式) params.append('首款方式', submitData.缴费方式)
          if (submitData.收款人) params.append('首款收款人', submitData.收款人)
          if (submitData.凭证号) params.append('首款凭证号', submitData.凭证号)
          if (submitData.备注) params.append('首款备注', submitData.备注)
          
          const response = await fetch(`/api/v1/consult/payment/first-payment/${recordId}?${params.toString()}`, {
            method: 'PUT'
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.detail || '添加首款失败')
          }
          
          // 如果同时设置了应交金额，更新汇总
          if (submitData.应交金额) {
            const amountResponse = await fetch(`/api/v1/consult/payment/amount/${recordId}?应交金额=${submitData.应交金额}`, {
              method: 'PUT'
            })
            
            if (!amountResponse.ok) {
              console.warn('设置应交金额失败，但首款已添加')
            }
          }
        } else {
          // 添加后续交费 - 使用 POST /payment/subsequent/{record_id}
          const params = new URLSearchParams()
          params.append('缴费金额', String(submitData.缴费金额 || 0))
          params.append('缴费时间', submitData.缴费时间)
          if (submitData.缴费方式) params.append('缴费方式', submitData.缴费方式)
          if (submitData.收款人) params.append('收款人', submitData.收款人)
          if (submitData.凭证号) params.append('凭证号', submitData.凭证号)
          if (submitData.备注) params.append('备注', submitData.备注)
          
          const response = await fetch(`/api/v1/consult/payment/subsequent/${recordId}?${params.toString()}`, {
            method: 'POST'
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.detail || '添加后续交费失败')
          }
        }
        
        notification.success({ message: '已添加', description: '缴费记录添加成功', placement: 'topRight', duration: 3 })
      }
      
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('保存失败:', error)
      notification.error({ message: '保存失败', description: error.message || '请检查网络连接或联系管理员', placement: 'topRight', duration: 4 })
    }
  }

  // 获取可选的缴费类型
  const getPaymentTypeOptions = () => {
    if (isEditing) {
      // 编辑时不能改变类型
      return [
        { value: editingRecord?.缴费类型, label: editingRecord?.缴费类型 }
      ]
    }
    
    if (hasFirstPayment) {
      // 已有首款，只能添加后续交费
      return [
        { value: '后续交费', label: '后续交费' }
      ]
    }
    
    // 没有首款，可以选择首款或后续交费
    return [
      { value: '首款', label: '首款' },
      { value: '后续交费', label: '后续交费' }
    ]
  }

  const currentType = Form.useWatch('缴费类型', form)

  return (
    <Modal
      title={isEditing ? '编辑缴费记录' : '添加缴费记录'}
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEditing ? '保存' : '添加'}
      cancelText="取消"
      width={500}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="缴费类型"
          label="缴费类型"
          rules={[{ required: true, message: '请选择缴费类型' }]}
        >
          <Select 
            options={getPaymentTypeOptions()} 
            disabled={isEditing}
          />
        </Form.Item>

        <Form.Item
          name="缴费金额"
          label="缴费金额（元）"
          rules={[
            { required: true, message: '请输入缴费金额' },
            { type: 'number', min: 0.01, message: '金额必须大于0' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0.01}
            step={100}
            precision={2}
            placeholder="请输入缴费金额"
            formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value!.replace(/¥\s?|(,*)/g, '') as any}
          />
        </Form.Item>

        {/* 首款时可以设置应交金额（新增和编辑都可以） */}
        {currentType === '首款' && (
          <Form.Item
            name="应交金额"
            label="应交总金额（元）"
            tooltip="设置该咨询量的应交总金额"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={1000}
              precision={2}
              placeholder="请输入应交总金额"
              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/¥\s?|(,*)/g, '') as any}
            />
          </Form.Item>
        )}

        <Form.Item
          name="缴费时间"
          label="缴费时间"
          rules={[{ required: true, message: '请选择缴费时间' }]}
        >
          <DatePicker 
            showTime 
            style={{ width: '100%' }}
            format="YYYY-MM-DD HH:mm:ss"
          />
        </Form.Item>

        <Form.Item
          name="缴费方式"
          label="缴费方式"
        >
          <Select 
            placeholder="请选择缴费方式"
            allowClear
          >
            {paymentMethods.map(method => (
              <Select.Option key={method} value={method}>{method}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="收款人"
          label="收款人"
        >
          <Input placeholder="请输入收款人姓名" />
        </Form.Item>

        <Form.Item
          name="凭证号"
          label="凭证号/流水号"
        >
          <Input placeholder="请输入付款凭证号或流水号" />
        </Form.Item>

        <Form.Item
          name="备注"
          label="备注"
        >
          <Input.TextArea 
            rows={3} 
            placeholder="请输入备注信息"
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default PaymentRecordForm
