/**
 * 神殿教化司会议记录表页面
 */

import React, { useState } from 'react'
import { App, Card, Table, Button, Space, Select, Input } from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'

const { Option } = Select
const { TextArea } = Input

// 会议记录接口
interface MeetingRecord {
  key: string
  time: string // 时间
  location: string // 地点
  speaker: string // 主讲
  attendees: string // 参与人
  agenda: string // 议题
  problemsSolved: string // 问题解决
  problemsPending: string // 问题待解决
}

const CampusMeetingRecordPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const campuses = getAllCampuses()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [dataSource, setDataSource] = useState<MeetingRecord[]>([
    {
      key: '1',
      time: '',
      location: '',
      speaker: '',
      attendees: '',
      agenda: '',
      problemsSolved: '',
      problemsPending: '',
    },
  ])
  const [editingKey, setEditingKey] = useState<string>('')
  const [editingField, setEditingField] = useState<string>('')

  // 定义表格列
  const columns: ColumnsType<MeetingRecord> = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 150,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'time'
        if (isEditing) {
          return (
            <Input
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource]
                const index = newDataSource.findIndex((item) => item.key === record.key)
                if (index !== -1) {
                  newDataSource[index].time = e.target.value
                  setDataSource(newDataSource)
                }
              }}
              onBlur={() => {
                setEditingKey('')
                setEditingField('')
              }}
              onPressEnter={() => {
                setEditingKey('')
                setEditingField('')
              }}
              autoFocus
            />
          )
        }
        return (
          <div
            onClick={() => {
              setEditingKey(record.key)
              setEditingField('time')
            }}
            style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}
          >
            {value || ''}
          </div>
        )
      },
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'location'
        if (isEditing) {
          return (
            <Input
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource]
                const index = newDataSource.findIndex((item) => item.key === record.key)
                if (index !== -1) {
                  newDataSource[index].location = e.target.value
                  setDataSource(newDataSource)
                }
              }}
              onBlur={() => {
                setEditingKey('')
                setEditingField('')
              }}
              onPressEnter={() => {
                setEditingKey('')
                setEditingField('')
              }}
              autoFocus
            />
          )
        }
        return (
          <div
            onClick={() => {
              setEditingKey(record.key)
              setEditingField('location')
            }}
            style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}
          >
            {value || ''}
          </div>
        )
      },
    },
    {
      title: '主讲',
      dataIndex: 'speaker',
      key: 'speaker',
      width: 120,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'speaker'
        if (isEditing) {
          return (
            <Input
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource]
                const index = newDataSource.findIndex((item) => item.key === record.key)
                if (index !== -1) {
                  newDataSource[index].speaker = e.target.value
                  setDataSource(newDataSource)
                }
              }}
              onBlur={() => {
                setEditingKey('')
                setEditingField('')
              }}
              onPressEnter={() => {
                setEditingKey('')
                setEditingField('')
              }}
              autoFocus
            />
          )
        }
        return (
          <div
            onClick={() => {
              setEditingKey(record.key)
              setEditingField('speaker')
            }}
            style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}
          >
            {value || ''}
          </div>
        )
      },
    },
    {
      title: '参与人',
      dataIndex: 'attendees',
      key: 'attendees',
      width: 150,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'attendees'
        if (isEditing) {
          return (
            <Input
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource]
                const index = newDataSource.findIndex((item) => item.key === record.key)
                if (index !== -1) {
                  newDataSource[index].attendees = e.target.value
                  setDataSource(newDataSource)
                }
              }}
              onBlur={() => {
                setEditingKey('')
                setEditingField('')
              }}
              onPressEnter={() => {
                setEditingKey('')
                setEditingField('')
              }}
              autoFocus
            />
          )
        }
        return (
          <div
            onClick={() => {
              setEditingKey(record.key)
              setEditingField('attendees')
            }}
            style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}
          >
            {value || ''}
          </div>
        )
      },
    },
    {
      title: '议题',
      dataIndex: 'agenda',
      key: 'agenda',
      width: 200,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'agenda'
        if (isEditing) {
          return (
            <TextArea
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource]
                const index = newDataSource.findIndex((item) => item.key === record.key)
                if (index !== -1) {
                  newDataSource[index].agenda = e.target.value
                  setDataSource(newDataSource)
                }
              }}
              onBlur={() => {
                setEditingKey('')
                setEditingField('')
              }}
              autoSize={{ minRows: 2, maxRows: 4 }}
              autoFocus
            />
          )
        }
        return (
          <div
            onClick={() => {
              setEditingKey(record.key)
              setEditingField('agenda')
            }}
            style={{ cursor: 'pointer', minHeight: '32px', padding: '4px', whiteSpace: 'pre-wrap' }}
          >
            {value || ''}
          </div>
        )
      },
    },
    {
      title: '问题解决',
      dataIndex: 'problemsSolved',
      key: 'problemsSolved',
      width: 200,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'problemsSolved'
        if (isEditing) {
          return (
            <TextArea
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource]
                const index = newDataSource.findIndex((item) => item.key === record.key)
                if (index !== -1) {
                  newDataSource[index].problemsSolved = e.target.value
                  setDataSource(newDataSource)
                }
              }}
              onBlur={() => {
                setEditingKey('')
                setEditingField('')
              }}
              autoSize={{ minRows: 2, maxRows: 4 }}
              autoFocus
            />
          )
        }
        return (
          <div
            onClick={() => {
              setEditingKey(record.key)
              setEditingField('problemsSolved')
            }}
            style={{ cursor: 'pointer', minHeight: '32px', padding: '4px', whiteSpace: 'pre-wrap' }}
          >
            {value || ''}
          </div>
        )
      },
    },
    {
      title: '问题待解决',
      dataIndex: 'problemsPending',
      key: 'problemsPending',
      width: 200,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'problemsPending'
        if (isEditing) {
          return (
            <TextArea
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource]
                const index = newDataSource.findIndex((item) => item.key === record.key)
                if (index !== -1) {
                  newDataSource[index].problemsPending = e.target.value
                  setDataSource(newDataSource)
                }
              }}
              onBlur={() => {
                setEditingKey('')
                setEditingField('')
              }}
              autoSize={{ minRows: 2, maxRows: 4 }}
              autoFocus
            />
          )
        }
        return (
          <div
            onClick={() => {
              setEditingKey(record.key)
              setEditingField('problemsPending')
            }}
            style={{ cursor: 'pointer', minHeight: '32px', padding: '4px', whiteSpace: 'pre-wrap' }}
          >
            {value || ''}
          </div>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingKey(record.key)
              setEditingField('time')
            }}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              const newDataSource = dataSource.filter((item) => item.key !== record.key)
              setDataSource(newDataSource)
              message.success('删除成功')
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  // 刷新数据
  const handleRefresh = () => {
    message.success('数据已刷新')
  }

  // 导出数据
  const handleExport = () => {
    message.info('导出功能开发中...')
  }

  // 添加新记录
  const handleAdd = () => {
    const newKey = `${Date.now()}`
    const newRecord: MeetingRecord = {
      key: newKey,
      time: '',
      location: '',
      speaker: '',
      attendees: '',
      agenda: '',
      problemsSolved: '',
      problemsPending: '',
    }
    setDataSource([...dataSource, newRecord])
    setEditingKey(newKey)
    setEditingField('time')
  }

  // 神殿选择变化
  const handleCampusChange = (value: string) => {
    setSelectedCampus(value)
    setCampus(value)
  }

  // 表头样式（浅绿色背景）
  const headerCellStyle: React.CSSProperties = {
    backgroundColor: '#d4edda',
    fontWeight: 'bold',
    textAlign: 'center',
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 24,
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          padding: '16px',
          backgroundColor: '#fff1f0',
          borderRadius: 4,
          border: '1px solid #ffccc7',
        }}
      >
        <CalendarOutlined style={{ marginRight: 8 }} />
        会议记录表
      </div>

      <Card>
        {/* 操作栏 */}
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space>
            <span>神殿：</span>
            <Select
              value={selectedCampus}
              onChange={handleCampusChange}
              style={{ width: 200 }}
              placeholder="请选择神殿"
            >
              {campuses.map((campus) => (
                <Option key={campus.name} value={campus.name}>
                  {campus.name}
                </Option>
              ))}
            </Select>
          </Space>
          <Space>
            <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>
              新增
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          scroll={{ x: 'max-content', y: 600 }}
          bordered
          size="small"
          rowKey="key"
          components={{
            header: {
              cell: (props: any) => {
                const mergedProps = {
                  ...props,
                  style: {
                    ...props.style,
                    ...headerCellStyle,
                  },
                }
                return <th {...mergedProps} />
              },
            },
          }}
        />
        <style>{`
          .ant-table-thead > tr > th {
            background-color: #d4edda !important;
            font-weight: bold;
            text-align: center;
          }
          .ant-table-thead > tr:first-child > th {
            background-color: #d4edda !important;
          }
        `}</style>
      </Card>
    </div>
  )
}

export default CampusMeetingRecordPage
