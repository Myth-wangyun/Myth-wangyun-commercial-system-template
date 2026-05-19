import React, { memo, useCallback, useMemo } from 'react'
import { Form } from 'antd'
import type { FormInstance, FormProps } from 'antd'

type FormValue = Record<string, unknown>

interface OptimizedFormProps<T extends FormValue = FormValue> {
  form?: FormInstance<T>
  children: React.ReactNode
  onFinish?: FormProps<T>['onFinish']
  onFinishFailed?: FormProps<T>['onFinishFailed']
  initialValues?: Partial<T>
  layout?: 'horizontal' | 'vertical' | 'inline'
  labelCol?: FormProps<T>['labelCol']
  wrapperCol?: FormProps<T>['wrapperCol']
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
  style?: React.CSSProperties
  className?: string
}

function OptimizedFormInner<T extends FormValue = FormValue>({
  form,
  children,
  onFinish,
  onFinishFailed,
  initialValues,
  layout = 'vertical',
  labelCol,
  wrapperCol,
  size = 'middle',
  disabled = false,
  style,
  className,
}: OptimizedFormProps<T>) {
  const handleFinish = useCallback(
    (values: T) => {
      onFinish?.(values)
    },
    [onFinish],
  )

  const handleFinishFailed = useCallback(
    (errorInfo: Parameters<NonNullable<FormProps<T>['onFinishFailed']>>[0]) => {
      onFinishFailed?.(errorInfo)
    },
    [onFinishFailed],
  )

  const formProps = useMemo(
    () => ({
      form,
      onFinish: handleFinish,
      onFinishFailed: handleFinishFailed,
      initialValues,
      layout,
      labelCol,
      wrapperCol,
      size,
      disabled,
      style,
      className,
    }),
    [
      form,
      handleFinish,
      handleFinishFailed,
      initialValues,
      layout,
      labelCol,
      wrapperCol,
      size,
      disabled,
      style,
      className,
    ],
  )

  return <Form {...formProps}>{children}</Form>
}

const OptimizedForm = memo(OptimizedFormInner) as typeof OptimizedFormInner

export default OptimizedForm
