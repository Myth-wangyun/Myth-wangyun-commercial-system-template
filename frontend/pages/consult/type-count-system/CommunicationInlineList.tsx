import React, { useState, useEffect, useCallback } from 'react'
import {
  App,
  Table,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Switch,
  Popconfirm,
  Space,
  Tag,
  Tooltip
} from 'antd'
import {
  SaveOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  PlusOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { CommunicationRecord, CreateCommunicationRequest } from './phoneStatsApi'
import * as api from './phoneStatsApi'
import { useAuthStore } from '@/stores/authStore'

const { Option } = Select
const { TextArea } = Input

interface CommunicationInlineListProps {
  recordId: number
  consultantName?: string // 咨询者姓名
}

// 扩展接口以支持编辑状态
interface EditableCommunicationRecord extends Partial<CommunicationRecord> {
  isNew?: boolean
  isEditing?: boolean
  key: string | number
}

export default function CommunicationInlineList({ recordId, consultantName }: CommunicationInlineListProps) {
  const { message, notification } = App.useApp()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<EditableCommunicationRecord[]>([])
  
  // 默认的新增行数据
  const defaultNewRecord: EditableCommunicationRecord = {
    key: 'new',
    isNew: true,
    沟通时间: dayjs().format('YYYY-MM-DD HH:mm'),
    沟通方式: '电话',
    用时: 0,
    咨询师: user?.name || user?.username || '',
    有需求: 0,
    有钱: 0,
    有时间: 0,
    有支持: 0,
    联系不上: 0,
  }

  // 新增行状态
  const [newRecordState, setNewRecordState] = useState<EditableCommunicationRecord>({ ...defaultNewRecord })

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await api.getCommunicationsByRecordId(recordId)
      if (result.success) {
        // 给每条记录加个 key
        const records = (result.data || []).map((item: CommunicationRecord) => ({
          ...item,
          key: item.沟通ID,
          isEditing: false
        }))
        setData(records)
      }
    } catch (error) {
      console.error('加载沟通记录失败', error)
      message.error('加载沟通记录失败')
    } finally {
      setLoading(false)
    }
  }, [recordId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 处理输入变更 (新增行)
  const handleNewRecordChange = (field: keyof CreateCommunicationRequest, value: any) => {
    setNewRecordState(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 保存新增
  const handleSaveNew = async () => {
    if (!newRecordState.沟通时间) {
      message.error('请选择沟通时间')
      return
    }
    
    try {
      setLoading(true)
      const submitData: CreateCommunicationRequest = {
        记录ID: recordId,
        沟通时间: typeof newRecordState.沟通时间 === 'string' 
          ? newRecordState.沟通时间 
          : dayjs(newRecordState.沟通时间).format('YYYY-MM-DD HH:mm:ss'),
        用时: newRecordState.用时 || 0,
        咨询师: newRecordState.咨询师,
        沟通方式: newRecordState.沟通方式 as any,
        需求点: newRecordState.需求点,
        关注点: newRecordState.关注点,
        抗拒点: newRecordState.抗拒点,
        咨询内容: newRecordState.咨询内容,
        咨询结果: newRecordState.咨询结果,
        报名意愿: newRecordState.报名意愿 as any,
        有需求: newRecordState.有需求,
        有钱: newRecordState.有钱,
        有时间: newRecordState.有时间,
        有支持: newRecordState.有支持,
        具备条件: newRecordState.具备条件,
        课程意向: newRecordState.课程意向,
        联系不上: newRecordState.联系不上,
        预定回访时间: newRecordState.预定回访时间 
          ? (typeof newRecordState.预定回访时间 === 'string' 
              ? newRecordState.预定回访时间 
              : dayjs(newRecordState.预定回访时间).format('YYYY-MM-DD HH:mm:ss'))
          : undefined,
      }

      await api.createCommunicationRecord(submitData)
      notification.success({ message: '已添加', description: '沟通记录添加成功', placement: 'topRight', duration: 3 })
      
      // 重置新增行，保留部分字段方便连续录入
      setNewRecordState({
        ...defaultNewRecord,
        沟通时间: dayjs().format('YYYY-MM-DD HH:mm'),
        咨询师: newRecordState.咨询师, // 保留咨询师
      })
      
      loadData()
    } catch (error: any) {
      notification.error({ message: '保存失败', description: error.message || '请检查网络连接或联系管理员', placement: 'topRight', duration: 4 })
    } finally {
      setLoading(false)
    }
  }

  // 删除记录
  const handleDelete = async (id: number) => {
    try {
      await api.deleteCommunicationRecord(id)
      message.success('删除成功')
      loadData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 列定义
  const columns = [
    {
      title: '时间',
      dataIndex: '沟通时间',
      width: 140,
      render: (text: string, record: EditableCommunicationRecord) => {
        if (record.isNew) {
          return (
            <DatePicker 
              showTime 
              format="MM-DD HH:mm" 
              value={text ? dayjs(text) : undefined}
              onChange={(date) => handleNewRecordChange('沟通时间', date ? date.format('YYYY-MM-DD HH:mm:ss') : '')}
              style={{ width: '100%' }}
              size="small"
              allowClear={false}
            />
          )
        }
        return dayjs(text).format('MM-DD HH:mm')
      }
    },
    {
      title: '方式',
      dataIndex: '沟通方式',
      width: 80,
      render: (text: string, record: EditableCommunicationRecord) => {
        if (record.isNew) {
          return (
            <Select 
              value={text} 
              onChange={(val) => handleNewRecordChange('沟通方式', val)}
              style={{ width: '100%' }}
              size="small"
            >
              <Option value="电话">电话</Option>
              <Option value="网聊">网聊</Option>
              <Option value="当面">当面</Option>
            </Select>
          )
        }
        return <Tag color={text === '电话' ? 'blue' : text === '网聊' ? 'cyan' : 'orange'}>{text}</Tag>
      }
    },
    {
      title: '用时',
      dataIndex: '用时',
      width: 60,
      render: (text: number, record: EditableCommunicationRecord) => {
        if (record.isNew) {
          return (
            <InputNumber 
              value={text} 
              onChange={(val) => handleNewRecordChange('用时', val)}
              min={0}
              style={{ width: '100%' }}
              size="small"
              controls={false}
            />
          )
        }
        return text || '-'
      }
    },
    {
      title: '咨询师',
      dataIndex: '咨询师',
      width: 80,
      render: (text: string, record: EditableCommunicationRecord) => {
        if (record.isNew) {
          return (
            <Input 
              value={text} 
              onChange={(e) => handleNewRecordChange('咨询师', e.target.value)}
              size="small"
            />
          )
        }
        return text
      }
    },
    {
      title: '失联',
      dataIndex: '联系不上',
      width: 50,
      render: (val: number, record: EditableCommunicationRecord) => {
        if (record.isNew) {
          return (
            <Switch 
              checked={val === 1} 
              onChange={(checked) => handleNewRecordChange('联系不上', checked ? 1 : 0)}
              size="small"
            />
          )
        }
        return val === 1 ? <Tag color="red">是</Tag> : null
      }
    },
    {
      title: '内容详情',
      dataIndex: '咨询内容',
      render: (text: string, record: EditableCommunicationRecord) => {
        if (record.isNew) {
          return (
            <Input 
              value={text} 
              onChange={(e) => handleNewRecordChange('咨询内容', e.target.value)}
              placeholder="沟通内容..."
              size="small"
            />
          )
        }
        return (
          <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={text}>
            {text}
          </div>
        )
      }
    },
    {
      title: '意愿',
      dataIndex: '报名意愿',
      width: 70,
      render: (text: string, record: EditableCommunicationRecord) => {
        if (record.isNew) {
          return (
            <Select 
              value={text} 
              onChange={(val) => handleNewRecordChange('报名意愿', val)}
              style={{ width: '100%' }}
              size="small"
              allowClear
              placeholder="无"
            >
              <Option value="A">A</Option>
              <Option value="B">B</Option>
              <Option value="C">C</Option>
              <Option value="D">D</Option>
            </Select>
          )
        }
        const colorMap: any = { A: 'green', B: 'cyan', C: 'orange', D: 'red' }
        return text ? <Tag color={colorMap[text]}>{text}</Tag> : '-'
      }
    },
    {
      title: '四有',
      width: 100,
      render: (_: any, record: EditableCommunicationRecord) => {
        if (record.isNew) {
          return (
            <Space size={2}>
              <Tooltip title="有需求"><Switch size="small" style={{transform: 'scale(0.7)'}} checked={record.有需求 === 1} onChange={c => handleNewRecordChange('有需求', c?1:0)} /></Tooltip>
              <Tooltip title="有钱"><Switch size="small" style={{transform: 'scale(0.7)'}} checked={record.有钱 === 1} onChange={c => handleNewRecordChange('有钱', c?1:0)} /></Tooltip>
              <Tooltip title="有时间"><Switch size="small" style={{transform: 'scale(0.7)'}} checked={record.有时间 === 1} onChange={c => handleNewRecordChange('有时间', c?1:0)} /></Tooltip>
              <Tooltip title="有支持"><Switch size="small" style={{transform: 'scale(0.7)'}} checked={record.有支持 === 1} onChange={c => handleNewRecordChange('有支持', c?1:0)} /></Tooltip>
            </Space>
          )
        }
        return (
          <Space size={2}>
            {record.有需求 === 1 && <Tag color="blue" style={{margin:0, fontSize:10, lineHeight:'18px', padding:'0 2px'}}>需</Tag>}
            {record.有钱 === 1 && <Tag color="gold" style={{margin:0, fontSize:10, lineHeight:'18px', padding:'0 2px'}}>钱</Tag>}
            {record.有时间 === 1 && <Tag color="cyan" style={{margin:0, fontSize:10, lineHeight:'18px', padding:'0 2px'}}>时</Tag>}
            {record.有支持 === 1 && <Tag color="purple" style={{margin:0, fontSize:10, lineHeight:'18px', padding:'0 2px'}}>支</Tag>}
          </Space>
        )
      }
    },
    {
      title: '回访',
      dataIndex: '预定回访时间',
      width: 140,
      render: (text: string, record: EditableCommunicationRecord) => {
        if (record.isNew) {
          return (
            <DatePicker 
              showTime 
              format="MM-DD HH:mm" 
              value={text ? dayjs(text) : undefined}
              onChange={(date) => handleNewRecordChange('预定回访时间', date ? date.format('YYYY-MM-DD HH:mm:ss') : '')}
              style={{ width: '100%' }}
              size="small"
              placeholder="回访时间"
            />
          )
        }
        return text ? dayjs(text).format('MM-DD HH:mm') : '-'
      }
    },
    {
      title: '操作',
      width: 80,
      render: (_: any, record: EditableCommunicationRecord) => {
        if (record.isNew) {
          return (
            <Button 
              type="primary" 
              size="small" 
              icon={<SaveOutlined />} 
              onClick={handleSaveNew}
              loading={loading}
              title="保存"
            />
          )
        }
        return (
          <Popconfirm title="删除此记录?" onConfirm={() => handleDelete(record.沟通ID!)}>
             <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        )
      }
    }
  ]

  // 合并数据：历史记录 + 新增行
  const dataSource = [...data, newRecordState]

  return (
    <div style={{ margin: '0 0 10px 0', background: '#fafafa', padding: '10px', borderRadius: '4px', border: '1px solid #f0f0f0' }}>
      <div style={{ marginBottom: 8, fontWeight: 'bold', fontSize: '13px', color: '#666' }}>
        跟进记录 {consultantName ? `- ${consultantName}` : ''}
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        size="small"
        pagination={false}
        bordered
        rowClassName={(record) => record.isNew ? 'bg-blue-50' : ''}
        style={{ background: '#fff' }}
      />
    </div>
  )
}
