import React from 'react'
import { Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'

interface CustomUploadProps {
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

const CustomUpload: React.FC<CustomUploadProps> = ({
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
  return (
    <Upload
      action={action}
      accept={accept}
      multiple={multiple}
      disabled={disabled}
      showUploadList={showUploadList}
      maxCount={maxCount}
      fileList={fileList}
      beforeUpload={beforeUpload}
      onChange={onChange}
      onRemove={onRemove}
      onPreview={onPreview}
      style={style}
      className={className}
    >
      <button type="button" style={{ border: 0, background: 'none' }}>
        <UploadOutlined /> 点击上传
      </button>
    </Upload>
  )
}

export default CustomUpload
