/**
 * 班主任选择器组件
 * 从配置中心获取班主任列表，用于表单中的班主任字段
 */

import React, { useEffect, useState } from 'react'
import { Select } from 'antd'
import { fetchHomeroomTeachers, type HomeroomTeacherProfile } from '@/services/configMaster'

interface HomeroomTeacherSelectProps {
  campusName?: string
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  allowClear?: boolean
  disabled?: boolean
}

const HomeroomTeacherSelect: React.FC<HomeroomTeacherSelectProps> = ({
  campusName,
  value,
  onChange,
  placeholder = '请选择班主任',
  allowClear = true,
  disabled = false,
}) => {
  const [teachers, setTeachers] = useState<HomeroomTeacherProfile[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!campusName) {
      setTeachers([])
      return
    }

    const loadTeachers = async () => {
      setLoading(true)
      try {
        const data = await fetchHomeroomTeachers({
          campus_name: campusName,
          active: true, // 只显示在职班主任
        })
        setTeachers(data)
      } catch (error) {
        console.error('Failed to fetch homeroom teachers:', error)
        setTeachers([])
      } finally {
        setLoading(false)
      }
    }

    loadTeachers()
  }, [campusName])

  return (
    <Select
      value={value || undefined}
      onChange={onChange}
      placeholder={placeholder}
      allowClear={allowClear}
      disabled={disabled || loading}
      loading={loading}
      style={{ width: '100%', minWidth: 200 }}
      options={teachers.map((teacher) => ({
        label: teacher.name,
        value: teacher.name,
      }))}
      showSearch
      optionFilterProp="label"
      filterOption={(input, option) =>
        (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
      }
    />
  )
}

export default HomeroomTeacherSelect
