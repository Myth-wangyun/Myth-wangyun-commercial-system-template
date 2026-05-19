import React, { memo, useCallback, useMemo } from 'react'
import { Modal, Form } from 'antd'

type FormValues = Record<string, unknown>

interface OptimizedFormModalProps<T extends FormValues = FormValues> {
  title: string
  visible: boolean
  loading?: boolean
  onCancel: () => void
  onOk: (values: T) => void
  children: React.ReactNode
  width?: number
  okText?: string
  cancelText?: string
  destroyOnHidden?: boolean
  maskClosable?: boolean
  centered?: boolean
  zIndex?: number
}

function OptimizedFormModalInner<T extends FormValues = FormValues>({
  title,
  visible,
  loading = false,
  onCancel,
  onOk,
  children,
  width = 600,
  okText = '确定',
  cancelText = '取消',
  destroyOnHidden = true,
  maskClosable = false,
  centered = false,
  zIndex = 1000,
}: OptimizedFormModalProps<T>) {
  const [form] = Form.useForm<T>()

  const handleCancel = useCallback(() => {
    form.resetFields()
    onCancel()
  }, [form, onCancel])

  const handleOk = useCallback(async () => {
    try {
      const values = await form.validateFields()
      onOk(values)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }, [form, onOk])

  const modalProps = useMemo(
    () => ({
      title,
      open: visible,
      onCancel: handleCancel,
      onOk: handleOk,
      width,
      destroyOnHidden,
      maskClosable,
      confirmLoading: loading,
      centered,
      zIndex,
      okText,
      cancelText,
    }),
    [
      title,
      visible,
      handleCancel,
      handleOk,
      width,
      destroyOnHidden,
      maskClosable,
      loading,
      centered,
      zIndex,
      okText,
      cancelText,
    ],
  )

  return (
    <Modal {...modalProps}>
      <Form form={form} layout="vertical">
        {children}
      </Form>
    </Modal>
  )
}

const OptimizedFormModal = memo(OptimizedFormModalInner) as typeof OptimizedFormModalInner

export default OptimizedFormModal
