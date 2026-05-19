import React, { useEffect, useState } from 'react'
import { App, Button, Card, DatePicker, Input, Modal, Space, Table, Typography, Upload } from 'antd'
import { ExclamationCircleOutlined, UploadOutlined, FileTextOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { UploadFile } from 'antd/es/upload/interface'
import { DeleteOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { apiService, api } from '@/services/api'

const { Title } = Typography
const { TextArea } = Input
const { confirm } = Modal

// 数据类型
interface MeetingRecord {
  id: number | string
  index: number
  meeting_time: string
  location: string
  host: string
  important_leader: string
  participants: string
  agenda: string
  issues_resolved: string
  issues_pending: string
  file_path?: string
  file_name?: string
}

const emptyRow = (index: number): MeetingRecord => ({
  id: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  index,
  meeting_time: dayjs().format('YYYY-MM-DD'),
  location: '',
  host: '',
  important_leader: '',
  participants: '',
  agenda: '',
  issues_resolved: '',
  issues_pending: '',
  file_path: '',
  file_name: '',
})

const MeetingRecordPage: React.FC = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [tableData, setTableData] = useState<MeetingRecord[]>([])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await apiService.get<{
        items: Array<{
          id: number
          meeting_time: string
          location: string
          host: string
          important_leader: string
          participants: string
          agenda: string
          issues_resolved: string
          issues_pending: string
          file_path?: string
          file_name?: string
          created_at: string
          updated_at: string
        }>
      }>('/market/meeting-record')
      
      const resData = response as any
      const items = resData?.items || []
      const normalized = items.map((r: any, idx: number) => ({
        id: r.id,
        index: idx + 1,
        meeting_time: r.meeting_time || '',
        location: r.location || '',
        host: r.host || '',
        important_leader: r.important_leader || '',
        participants: r.participants || '',
        agenda: r.agenda || '',
        issues_resolved: r.issues_resolved || '',
        issues_pending: r.issues_pending || '',
        file_path: r.file_path || '',
        file_name: r.file_name || '',
      }))

      setTableData(normalized)
      setDirty(false)
    } catch (e) {
      console.error('加载数据失败:', e)
      setTableData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const saveData = async () => {
    setSaving(true)
    try {
      const rows = tableData.map((r) => ({
        meeting_time: r.meeting_time,
        location: r.location,
        host: r.host,
        important_leader: r.important_leader,
        participants: r.participants,
        agenda: r.agenda,
        issues_resolved: r.issues_resolved,
        issues_pending: r.issues_pending,
        file_path: r.file_path || '',
        file_name: r.file_name || '',
      }))

      const response = await apiService.post<{
        saved_count: number
        items: Array<{
          id: number
          meeting_time: string
          location: string
          host: string
          important_leader: string
          participants: string
          agenda: string
          issues_resolved: string
          issues_pending: string
          file_path?: string
          file_name?: string
          created_at: string
          updated_at: string
        }>
      }>('/market/meeting-record/bulk-save', { rows })

      const resData = response as any
      const items = resData?.items || []
      const normalized = items.map((r: any, idx: number) => ({
        id: r.id,
        index: idx + 1,
        meeting_time: r.meeting_time || '',
        location: r.location || '',
        host: r.host || '',
        important_leader: r.important_leader || '',
        participants: r.participants || '',
        agenda: r.agenda || '',
        issues_resolved: r.issues_resolved || '',
        issues_pending: r.issues_pending || '',
        file_path: r.file_path || '',
        file_name: r.file_name || '',
      }))

      setTableData(normalized)
      setDirty(false)
      message.success('保存成功')
    } catch (e: any) {
      console.error('保存失败:', e)
      message.error(e?.response?.data?.detail || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const updateCell = (
    rowId: number | string,
    key: keyof Omit<MeetingRecord, 'id' | 'index'>,
    value: string,
  ) => {
    setTableData((prev) => 
      prev.map((r) => (r.id === rowId ? { ...r, [key]: value } : r))
    )
    setDirty(true)
  }

  const handleAddRow = () => {
    setTableData((prev) => [...prev, emptyRow(prev.length + 1)])
    setDirty(true)
  }

  const handleDeleteRow = (row: MeetingRecord) => {
    setTableData((prev) =>
      prev
        .filter((r) => r.id !== row.id)
        .map((r, idx) => ({ ...r, index: idx + 1 })),
    )
    setDirty(true)
  }

  // 处理文件上传
  const handleFileUpload = async (rowId: number | string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('record_id', String(rowId))

    try {
      const response = await api.post('/market/meeting-record/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const data = response.data as any
      if (data.file_path) {
        setTableData((prev) =>
          prev.map((r) =>
            r.id === rowId
              ? { ...r, file_path: data.file_path, file_name: data.file_name }
              : r
          )
        )
        setDirty(true)
        message.success('文件上传成功')
      }
    } catch (e: any) {
      console.error('文件上传失败:', e)
      message.error(e?.response?.data?.detail || '文件上传失败')
    }
  }

  // 处理文件下载
  const handleFileDownload = (filePath: string, fileName: string) => {
    const downloadUrl = `/api/v1/market/meeting-record/download?file_path=${encodeURIComponent(filePath)}`
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 处理文件删除
  const handleFileDelete = (e: React.MouseEvent, rowId: number | string, filePath: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('删除按钮被点击', { rowId, filePath })
    console.log('confirm 函数:', confirm)
    console.log('Modal:', Modal)
    
    // 测试：先用原生确认框
    if (window.confirm('确定要删除这个文件吗？')) {
      // 用户点击了确定
      deleteFile(rowId, filePath)
    }
  }

  // 实际删除文件的函数
  const deleteFile = async (rowId: number | string, filePath: string) => {
    try {
      console.log('开始删除文件:', filePath)
      await apiService.delete(`/market/meeting-record/delete-file?file_path=${encodeURIComponent(filePath)}`)
      
      // 清空该行的文件信息
      setTableData((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? { ...r, file_path: '', file_name: '' }
            : r
        )
      )
      setDirty(true)
      message.success('文件删除成功')
    } catch (e: any) {
      console.error('文件删除失败:', e)
      message.error(e?.response?.data?.detail || '文件删除失败')
    }
  }

  // 表格标题样式 - 模拟图片中的黄色表头
  const headerStyle: React.CSSProperties = {
    backgroundColor: '#E8B830',
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  }

  const columns: ColumnsType<MeetingRecord> = [
    {
      title: '时间',
      dataIndex: 'meeting_time',
      width: 100,
      align: 'center' as const,
      onHeaderCell: () => ({ style: headerStyle }),
      render: (_, record) => (
        <DatePicker
          value={record.meeting_time ? dayjs(record.meeting_time, 'YYYY-MM-DD') : null}
          onChange={(date) => updateCell(record.id, 'meeting_time', date ? date.format('YYYY-MM-DD') : '')}
          placeholder="请选择日期"
          format="YYYY-MM-DD"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '地点',
      dataIndex: 'location',
      width: 120,
      align: 'center' as const,
      onHeaderCell: () => ({ style: headerStyle }),
      render: (_, record) => (
        <Input
          value={record.location}
          onChange={(e) => updateCell(record.id, 'location', e.target.value)}
          placeholder="请输入"
        />
      ),
    },
    {
      title: '主持人',
      dataIndex: 'host',
      width: 100,
      align: 'center' as const,
      onHeaderCell: () => ({ style: headerStyle }),
      render: (_, record) => (
        <Input
          value={record.host}
          onChange={(e) => updateCell(record.id, 'host', e.target.value)}
          placeholder="请输入"
        />
      ),
    },
    {
      title: '重要领导',
      dataIndex: 'important_leader',
      width: 120,
      align: 'center' as const,
      onHeaderCell: () => ({ style: headerStyle }),
      render: (_, record) => (
        <Input
          value={record.important_leader}
          onChange={(e) => updateCell(record.id, 'important_leader', e.target.value)}
          placeholder="请输入"
        />
      ),
    },
    {
      title: '参与人',
      dataIndex: 'participants',
      width: 140,
      align: 'center' as const,
      onHeaderCell: () => ({ style: headerStyle }),
      render: (_, record) => (
        <TextArea
          value={record.participants}
          onChange={(e) => updateCell(record.id, 'participants', e.target.value)}
          placeholder="请输入"
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      ),
    },
    {
      title: '议题',
      dataIndex: 'agenda',
      width: 200,
      align: 'center' as const,
      onHeaderCell: () => ({ style: headerStyle }),
      render: (_, record) => (
        <TextArea
          value={record.agenda}
          onChange={(e) => updateCell(record.id, 'agenda', e.target.value)}
          placeholder="请输入"
          autoSize={{ minRows: 1, maxRows: 4 }}
        />
      ),
    },
    {
      title: '会议记录人',
      dataIndex: 'issues_resolved',
      width: 180,
      align: 'center' as const,
      onHeaderCell: () => ({ style: headerStyle }),
      render: (_, record) => (
        <TextArea
          value={record.issues_resolved}
          onChange={(e) => updateCell(record.id, 'issues_resolved', e.target.value)}
          placeholder="请输入"
          autoSize={{ minRows: 1, maxRows: 4 }}
        />
      ),
    },
    {
      title: '会议纪要上传',
      dataIndex: 'file_path',
      width: 220,
      align: 'center' as const,
      onHeaderCell: () => ({ style: headerStyle }),
      render: (_, record) => (
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Upload
            beforeUpload={(file) => {
              handleFileUpload(record.id, file)
              return false
            }}
            showUploadList={false}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
          >
            <Button icon={<UploadOutlined />} size="small" type="primary" block>
              上传会议记录
            </Button>
          </Upload>
          {record.file_name && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Button
                icon={<FileTextOutlined />}
                size="small"
                type="link"
                onClick={() => handleFileDownload(record.file_path || '', record.file_name || '')}
                block
                style={{ textAlign: 'left', padding: '0 4px', height: 'auto', whiteSpace: 'normal', wordBreak: 'break-all' }}
              >
                {record.file_name}
              </Button>
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={(e) => handleFileDelete(e, record.id, record.file_path || '')}
                block
              >
                删除文件
              </Button>
            </div>
          )}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      align: 'center' as const,
      onHeaderCell: () => ({ style: headerStyle }),
      render: (_, record) => (
        <Button
          danger
          type="link"
          icon={<DeleteOutlined />}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDeleteRow(record)
          }}
        >
          删除
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          市场部会议记录表
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRow}>
            新增一行
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={saveData} disabled={!dirty} loading={saving}>
            保存
          </Button>
        </Space>
      </div>

      <Card>
        {/* 表格标题栏 - 模拟图片中的绿色标题 */}
        <div
          style={{
            backgroundColor: '#C5D9A4',
            padding: '12px 16px',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '16px',
            borderBottom: '1px solid #d9d9d9',
            marginBottom: 16,
          }}
        >
          会议记录表
        </div>
        <Table
          columns={columns}
          dataSource={tableData}
          rowKey="id"
          pagination={false}
          bordered
          size="small"
          loading={loading}
          scroll={{ x: 1200, y: 600 }}
        />
      </Card>
    </div>
  )
}

export default MeetingRecordPage
