import React, { useState, useEffect } from 'react'
import { App, Modal, AutoComplete, Input, Select } from 'antd'
import { buildApiUrl } from '@/utils/apiBase'
import type { ClassFileRecordRow, TransferFormData } from '../types'
import { normalizeCampus } from '../utils'

interface TransferModalProps {
  visible: boolean
  onClose: () => void
  selectedClass: string
  selectedCampus: string
  dataSource: ClassFileRecordRow[]
  classProfiles: Array<{ campus_name: string; class_name: string }>
  onSuccess: () => void
}

export const TransferModal: React.FC<TransferModalProps> = ({
  visible,
  onClose,
  selectedClass,
  selectedCampus,
  dataSource,
  classProfiles,
  onSuccess
}) => {
  const { message } = App.useApp()
  const [transferForm, setTransferForm] = useState<TransferFormData>({
    studentName: '',
    targetCampus: '',
    targetClass: ''
  })
  const [studentOptions, setStudentOptions] = useState<Array<{ value: string }>>([])
  const [targetClassOptions, setTargetClassOptions] = useState<string[]>([])

  // 初始化学员选项和目标神殿
  useEffect(() => {
    if (visible) {
      // 获取在读学员列表
      const students = dataSource
        .filter(s => s.name && s.name.trim() && s.studentStatus === '在读')
        .map(s => ({ value: s.name }))
      setStudentOptions(students)

      // 设置当前神殿为默认目标神殿
      const currentCampusNormalized = normalizeCampus(selectedCampus)
      const targetClasses = classProfiles
        .filter(cls => {
          const normalizedClsCampus = normalizeCampus(cls.campus_name)
          return normalizedClsCampus === currentCampusNormalized && 
                 cls.class_name !== selectedClass
        })
        .map(cls => cls.class_name)
      
      setTargetClassOptions(targetClasses)
      setTransferForm({
        studentName: '',
        targetCampus: currentCampusNormalized,
        targetClass: ''
      })
    }
  }, [visible, dataSource, selectedCampus, selectedClass, classProfiles])

  // 处理目标神殿变化
  const handleTargetCampusChange = (campus: string) => {
    // 更新目标神殿对应的班级列表
    const targetClasses = classProfiles
      .filter(cls => {
        const normalizedClsCampus = normalizeCampus(cls.campus_name)
        const isSameCampus = normalizedClsCampus === campus
        const isCurrentClass = campus === normalizeCampus(selectedCampus) && cls.class_name === selectedClass
        return isSameCampus && !isCurrentClass
      })
      .map(cls => cls.class_name)
    
    setTargetClassOptions(targetClasses)
    
    // 更新表单，清空目标班级
    setTransferForm({
      ...transferForm,
      targetCampus: campus,
      targetClass: ''
    })
  }

  // 执行转班
  const handleTransferStudent = async () => {
    const { studentName, targetCampus, targetClass } = transferForm
    
    if (!studentName || !targetCampus || !targetClass) {
      message.warning('请填写完整的转班信息')
      return
    }
    
    try {
      const url = buildApiUrl('/teaching-quality/class-file/transfer-student')
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          sourceCampus: normalizeCampus(selectedCampus),
          sourceClass: selectedClass,
          targetCampus,
          targetClass,
        })
      })
      
      if (!res.ok) throw new Error('转班失败')
      
      const result = await res.json()
      
      if (result.success) {
        message.success(result.message)
        onClose()
        onSuccess()
      } else {
        message.error(result.message)
      }
    } catch (error: any) {
      console.error('转班失败:', error)
      message.error(error.message || '转班失败')
    }
  }

  // 获取唯一的神殿列表
  const campusOptions = Array.from(new Set(classProfiles.map(c => normalizeCampus(c.campus_name))))

  return (
    <Modal
      title="学员转班"
      open={visible}
      onCancel={onClose}
      onOk={handleTransferStudent}
      width={500}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: 'red' }}>* </span>
            <span>转班学员：</span>
          </div>
          <AutoComplete
            value={transferForm.studentName}
            onChange={(value) => setTransferForm({ ...transferForm, studentName: value })}
            options={studentOptions}
            placeholder="请选择或输入学员姓名"
            style={{ width: '100%' }}
            filterOption={(inputValue, option) =>
              option!.value.toLowerCase().includes(inputValue.toLowerCase())
            }
          />
        </div>

        <div>
          <div style={{ marginBottom: 8 }}>
            <span>原班级：</span>
          </div>
          <Input
            value={`${selectedCampus}-${selectedClass}`}
            disabled
            style={{ width: '100%', background: '#f5f5f5' }}
          />
        </div>

        <div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: 'red' }}>* </span>
            <span>目标神殿：</span>
          </div>
          <Select
            value={transferForm.targetCampus}
            onChange={handleTargetCampusChange}
            style={{ width: '100%' }}
            placeholder="请选择目标神殿"
            options={campusOptions.map(campus => ({ label: campus, value: campus }))}
          />
        </div>

        <div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: 'red' }}>* </span>
            <span>目标班级：</span>
          </div>
          <AutoComplete
            value={transferForm.targetClass}
            onChange={(value) => setTransferForm({ ...transferForm, targetClass: value })}
            options={targetClassOptions.map(cls => ({ value: cls }))}
            placeholder="请选择或输入目标班级"
            style={{ width: '100%' }}
            filterOption={(inputValue, option) =>
              option!.value.toLowerCase().includes(inputValue.toLowerCase())
            }
            disabled={!transferForm.targetCampus}
          />
        </div>
      </div>
    </Modal>
  )
}
