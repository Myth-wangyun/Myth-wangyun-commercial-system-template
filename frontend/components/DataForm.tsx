import React, { useState, useEffect } from 'react'
import type { DataRecord, FormMode } from '../types'
import { validateFormData } from '../utils'
import { X, Save } from 'lucide-react'

interface DataFormProps {
  mode: FormMode
  data?: DataRecord
  onSubmit: (data: Partial<DataRecord>) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const DataForm: React.FC<DataFormProps> = ({ mode, data, onSubmit, onCancel, loading = false }) => {
  const [formData, setFormData] = useState<Partial<DataRecord>>({
    name: '',
    category: '',
    value: 0,
    status: 'active',
    description: '',
  })
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (data) {
      setFormData({
        name: data.name,
        category: data.category,
        value: data.value,
        status: data.status,
        description: data.description || '',
      })
    } else {
      setFormData({
        name: '',
        category: '',
        value: 0,
        status: 'active',
        description: '',
      })
    }
    setErrors([])
  }, [data, mode])

  const handleInputChange = <K extends keyof DataRecord>(field: K, value: DataRecord[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // 清除相关错误
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validateFormData(formData)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      await onSubmit(formData)
    } catch {
      setErrors(['提交失败，请重试'])
    }
  }

  const isReadOnly = mode === 'view'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' && '新增数据'}
            {mode === 'edit' && '编辑数据'}
            {mode === 'view' && '查看数据'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 错误信息 */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <ul className="text-sm text-red-600 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="请输入名称"
            />
          </div>

          {/* 类别 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              类别 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category || ''}
              onChange={(e) => handleInputChange('category', e.target.value)}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">请选择类别</option>
              <option value="开发">开发</option>
              <option value="测试">测试</option>
              <option value="维护">维护</option>
              <option value="设计">设计</option>
              <option value="运营">运营</option>
            </select>
          </div>

          {/* 数值 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              数值 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.value || 0}
              onChange={(e) => handleInputChange('value', parseFloat(e.target.value) || 0)}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="请输入数值"
            />
          </div>

          {/* 状态 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              状态 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status || 'active'}
              onChange={(e) =>
                handleInputChange('status', e.target.value as 'active' | 'inactive' | 'pending')
              }
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="active">活跃</option>
              <option value="inactive">非活跃</option>
              <option value="pending">待处理</option>
            </select>
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isReadOnly}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
              placeholder="请输入描述（可选）"
            />
          </div>

          {/* 按钮 */}
          {!isReadOnly && (
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {mode === 'create' ? '创建' : '保存'}
              </button>
            </div>
          )}

          {isReadOnly && (
            <div className="flex items-center justify-end pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                关闭
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default DataForm
