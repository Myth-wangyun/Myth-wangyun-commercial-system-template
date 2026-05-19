import React, { memo, useCallback, useMemo } from 'react'
import { Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'

interface OptimizedUploadProps {
  action?: string
  accept?: string
  multiple?: boolean
  disabled?: boolean
  showUploadList?: boolean
  maxCount?: number
  fileList?: UploadFile[]
  beforeUpload?: UploadProps['beforeUpload']
  onChange?: UploadProps['onChange']
  onRemove?: UploadProps['onRemove']
  onPreview?: UploadProps['onPreview']
  style?: React.CSSProperties
  className?: string
}

const OptimizedUpload: React.FC<OptimizedUploadProps> = memo(
  ({
    action,
    accept,
    multiple = false,
    disabled = false,
    showUploadList = true,
    maxCount = 1,
    fileList,
    beforeUpload,
    onChange,
    onRemove,
    onPreview,
    style,
    className,
  }) => {
    const handleChange = useCallback<NonNullable<UploadProps['onChange']>>(
      (info) => {
        onChange?.(info)
      },
      [onChange],
    )

    const handleRemove = useCallback<NonNullable<UploadProps['onRemove']>>(
      (file) => {
        onRemove?.(file)
        return true
      },
      [onRemove],
    )

    const handlePreview = useCallback<NonNullable<UploadProps['onPreview']>>(
      (file) => {
        onPreview?.(file)
      },
      [onPreview],
    )

    const uploadProps = useMemo(
      () => ({
        action,
        accept,
        multiple,
        disabled,
        showUploadList,
        maxCount,
        fileList,
        beforeUpload,
        onChange: handleChange,
        onRemove: handleRemove,
        onPreview: handlePreview,
        style,
        className,
      }),
      [
        action,
        accept,
        multiple,
        disabled,
        showUploadList,
        maxCount,
        fileList,
        beforeUpload,
        handleChange,
        handleRemove,
        handlePreview,
        style,
        className,
      ],
    )

    return (
      <Upload {...uploadProps}>
        <button type="button" style={{ border: 0, background: 'none' }}>
          <UploadOutlined /> 点击上传
        </button>
      </Upload>
    )
  },
)

OptimizedUpload.displayName = 'OptimizedUpload'

export default OptimizedUpload
