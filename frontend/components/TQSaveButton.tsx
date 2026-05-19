/**
 * 教学质量模块 - 通用保存按钮组件
 * 用于所有教学质量数据表单的保存操作
 */
import React, { useState } from 'react'
import { App, Button, Spin } from 'antd'
import { SaveOutlined } from '@ant-design/icons'

interface TQSaveButtonProps {
  /**
   * 保存处理函数
   * @returns Promise<boolean> - 返回 true 表示保存成功，false 表示失败
   */
  onSave: () => Promise<boolean>
  
  /**
   * 按钮文本（默认：保存）
   */
  text?: string
  
  /**
   * 按钮类型（默认：primary）
   */
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link'
  
  /**
   * 按钮大小（默认：middle）
   */
  size?: 'large' | 'middle' | 'small'
  
  /**
   * 是否禁用按钮
   */
  disabled?: boolean
  
  /**
   * 自定义样式
   */
  style?: React.CSSProperties
  
  /**
   * 成功提示文本
   */
  successMessage?: string
  
  /**
   * 失败提示文本
   */
  failureMessage?: string
  
  /**
   * 保存成功后的回调
   */
  onSuccess?: () => void
  
  /**
   * 保存失败后的回调
   */
  onFailure?: (error?: Error) => void
}

/**
 * 教学质量模块通用保存按钮组件
 * 
 * 使用示例：
 * ```tsx
 * <TQSaveButton
 *   onSave={async () => {
 *     const response = await api.saveData(formData);
 *     return response.success;
 *   }}
 *   successMessage="数据保存成功"
 *   onSuccess={() => {
 *     // 刷新列表等操作
 *   }}
 * />
 * ```
 */
export const TQSaveButton: React.FC<TQSaveButtonProps> = ({
  onSave,
  text = '保存',
  type = 'primary',
  size = 'middle',
  disabled = false,
  style,
  successMessage = '保存成功',
  failureMessage = '保存失败',
  onSuccess,
  onFailure,
}) => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    try {
      setLoading(true)
      const success = await onSave()
      
      if (success) {
        message.success(successMessage)
        onSuccess?.()
      } else {
        message.error(failureMessage)
        onFailure?.()
      }
    } catch (error) {
      console.error('保存失败:', error)
      message.error(failureMessage)
      onFailure?.(error instanceof Error ? error : undefined)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Spin spinning={loading}>
      <Button
        type={type}
        size={size}
        disabled={disabled || loading}
        onClick={handleSave}
        icon={<SaveOutlined />}
        style={style}
      >
        {text}
      </Button>
    </Spin>
  )
}

export default TQSaveButton

