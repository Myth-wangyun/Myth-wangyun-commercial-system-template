import React, { useState, useEffect } from 'react'
import { App, Modal, Select, DatePicker, Button, Space } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ClassFileRecordRow, FormerHeadTeacher } from '../types'

interface FormerTeacherModalProps {
  visible: boolean
  onClose: () => void
  record: ClassFileRecordRow | null
  homeroomTeachers: string[]
  onSave: (recordKey: string, teachers: FormerHeadTeacher[]) => void
}

export const FormerTeacherModal: React.FC<FormerTeacherModalProps> = ({
  visible,
  onClose,
  record,
  homeroomTeachers,
  onSave
}) => {
  const { message } = App.useApp()
  const [editingTeachers, setEditingTeachers] = useState<FormerHeadTeacher[]>([])

  // 初始化编辑数据
  useEffect(() => {
    if (visible && record) {
      setEditingTeachers(record.formerHeadTeachers || [])
    }
  }, [visible, record])

  // 添加往任班主任
  const handleAdd = () => {
    setEditingTeachers(prev => [
      ...prev,
      { name: '', startDate: '', endDate: '' }
    ])
  }

  // 删除往任班主任
  const handleRemove = (index: number) => {
    setEditingTeachers(prev => prev.filter((_, i) => i !== index))
  }

  // 修改往任班主任字段
  const handleChange = (index: number, field: keyof FormerHeadTeacher, value: string) => {
    setEditingTeachers(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value }
      }
      return item
    }))
  }

  // 保存
  const handleSave = () => {
    if (!record) return
    onSave(record.key, editingTeachers)
    message.success('保存成功')
    onClose()
  }

  return (
    <Modal
      title="编辑往任班主任"
      open={visible}
      onCancel={onClose}
      onOk={handleSave}
      width={700}
    >
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {editingTeachers.map((teacher, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 12,
              alignItems: 'center'
            }}
          >
            <Select
              value={teacher.name || undefined}
              onChange={(value) => handleChange(index, 'name', value)}
              placeholder="选择班主任"
              style={{ flex: 1 }}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={homeroomTeachers.map(t => ({ label: t, value: t }))}
            />
            <DatePicker
              value={teacher.startDate ? dayjs(teacher.startDate) : null}
              onChange={(date) => handleChange(index, 'startDate', date ? date.format('YYYY-MM-DD') : '')}
              placeholder="开始日期"
              style={{ flex: 1 }}
            />
            <DatePicker
              value={teacher.endDate ? dayjs(teacher.endDate) : null}
              onChange={(date) => handleChange(index, 'endDate', date ? date.format('YYYY-MM-DD') : '')}
              placeholder="结束日期"
              style={{ flex: 1 }}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemove(index)}
            />
          </div>
        ))}
        <Button type="dashed" onClick={handleAdd} style={{ width: '100%' }}>
          + 添加往任班主任
        </Button>
      </div>
    </Modal>
  )
}
