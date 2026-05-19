import { useState, useCallback } from 'react'
import { App } from 'antd'

export interface FormState<T> {
  visible: boolean
  loading: boolean
  editingRecord: T | null
  formData: Partial<T>
}

export interface FormActions<T> {
  setVisible: (visible: boolean) => void
  setLoading: (loading: boolean) => void
  setEditingRecord: (record: T | null) => void
  setFormData: (data: Partial<T>) => void
  handleAdd: (defaultData?: Partial<T>) => void
  handleEdit: (record: T) => void
  handleSubmit: (
    submitFn: (data: Partial<T>) => Promise<void>,
    validateFn?: (data: Partial<T>) => string[],
  ) => Promise<void>
  handleCancel: () => void
  resetForm: () => void
}

export const useForm = <T extends Record<string, unknown>>(
  defaultFormData: Partial<T>,
): [FormState<T>, FormActions<T>] => {
  const { message } = App.useApp()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingRecord, setEditingRecord] = useState<T | null>(null)
  const [formData, setFormData] = useState<Partial<T>>(defaultFormData)

  const handleAdd = useCallback(
    (defaultData?: Partial<T>) => {
      setEditingRecord(null)
      setFormData({ ...defaultFormData, ...defaultData })
      setVisible(true)
    },
    [defaultFormData],
  )

  const handleEdit = useCallback((record: T) => {
    setEditingRecord(record)
    setFormData(record)
    setVisible(true)
  }, [])

  const handleSubmit = useCallback(
    async (
      submitFn: (data: Partial<T>) => Promise<void>,
      validateFn?: (data: Partial<T>) => string[],
    ) => {
      try {
        // 验证数据
        if (validateFn) {
          const errors = validateFn(formData)
          if (errors.length > 0) {
            message.error(errors[0])
            return
          }
        }

        setLoading(true)
        await submitFn(formData)
        message.success(editingRecord ? '更新成功' : '保存成功')
        setVisible(false)
      } catch {
        message.error(editingRecord ? '更新失败' : '保存失败')
      } finally {
        setLoading(false)
      }
    },
    [formData, editingRecord],
  )

  const handleCancel = useCallback(() => {
    setVisible(false)
    setEditingRecord(null)
    setFormData(defaultFormData)
  }, [defaultFormData])

  const resetForm = useCallback(() => {
    setFormData(defaultFormData)
    setEditingRecord(null)
  }, [defaultFormData])

  const state: FormState<T> = {
    visible,
    loading,
    editingRecord,
    formData,
  }

  const actions: FormActions<T> = {
    setVisible,
    setLoading,
    setEditingRecord,
    setFormData,
    handleAdd,
    handleEdit,
    handleSubmit,
    handleCancel,
    resetForm,
  }

  return [state, actions]
}
