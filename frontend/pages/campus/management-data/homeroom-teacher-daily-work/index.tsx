/**
 * 神殿教化司班主任日工单页面
 */

import React, { useState } from 'react'
import { App, Card, Table, Button, Space, Select, Input, DatePicker } from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'

const { Option } = Select
const { TextArea } = Input

// 班主任日工单记录接口
interface DailyWorkRecord {
  key: string
  date: string // 日期
  dayOfWeek: string // 星期
  executor: string // 执行人
  serialNumber: number // 序号
  taskName: string // 任务名称
  taskDescription: string // 任务描述
  taskGoal: string // 任务目标
  executionTime: string // 执行时间
  weight: string // 权重
  result: string // 结果
  groupId: string // 用于合并单元格的分组ID
}

const CampusHomeroomTeacherDailyWorkPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const campuses = getAllCampuses()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs())
  const [dataSource, setDataSource] = useState<DailyWorkRecord[]>([
    {
      key: '1',
      date: '',
      dayOfWeek: '',
      executor: '',
      serialNumber: 1,
      taskName: '',
      taskDescription: '',
      taskGoal: '',
      executionTime: '',
      weight: '',
      result: '',
      groupId: 'group1',
    },
    {
      key: '2',
      date: '',
      dayOfWeek: '',
      executor: '',
      serialNumber: 2,
      taskName: '',
      taskDescription: '',
      taskGoal: '',
      executionTime: '',
      weight: '',
      result: '',
      groupId: 'group1',
    },
    {
      key: '3',
      date: '',
      dayOfWeek: '',
      executor: '',
      serialNumber: 3,
      taskName: '',
      taskDescription: '',
      taskGoal: '',
      executionTime: '',
      weight: '',
      result: '',
      groupId: 'group1',
    },
    {
      key: '4',
      date: '',
      dayOfWeek: '',
      executor: '',
      serialNumber: 4,
      taskName: '',
      taskDescription: '',
      taskGoal: '',
      executionTime: '',
      weight: '',
      result: '',
      groupId: 'group1',
    },
    {
      key: '5',
      date: '',
      dayOfWeek: '',
      executor: '',
      serialNumber: 5,
      taskName: '',
      taskDescription: '',
      taskGoal: '',
      executionTime: '',
      weight: '',
      result: '',
      groupId: 'group1',
    },
    {
      key: '6',
      date: '',
      dayOfWeek: '',
      executor: '',
      serialNumber: 6,
      taskName: '',
      taskDescription: '',
      taskGoal: '',
      executionTime: '',
      weight: '',
      result: '',
      groupId: 'group1',
    },
  ])
  const [editingKey, setEditingKey] = useState<string>('')
  const [editingField, setEditingField] = useState<string>('')

  // 计算日期列的rowSpan
  const getDateRowSpan = (record: DailyWorkRecord, index: number) => {
    const dataRows = [...dataSource]
    const currentIndex = dataRows.findIndex((item) => item.key === record.key)
    if (currentIndex === -1) return 0

    // 检查是否是同一分组的第一行
    if (currentIndex > 0) {
      const prevRecord = dataRows[currentIndex - 1]
      if (prevRecord.groupId === record.groupId) {
        return 0 // 不是第一行，不显示
      }
    }

    // 计算同一分组有多少行
    let sameGroupCount = 1
    for (let i = currentIndex + 1; i < dataRows.length; i++) {
      if (dataRows[i].groupId === record.groupId) {
        sameGroupCount++
      } else {
        break
      }
    }

    return sameGroupCount
  }

  // 计算星期列的rowSpan
  const getDayOfWeekRowSpan = (record: DailyWorkRecord, index: number) => {
    return getDateRowSpan(record, index)
  }

  // 计算执行人列的rowSpan
  const getExecutorRowSpan = (record: DailyWorkRecord, index: number) => {
    return getDateRowSpan(record, index)
  }

  // 定义表格列
  const columns: ColumnsType<DailyWorkRecord> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        const rowSpan = getDateRowSpan(record, index)
        const isEditing = editingKey === record.key && editingField === 'date'

        if (isEditing) {
          return {
            children: (
              <Input
                value={value}
                onChange={(e) => {
                  const newDataSource = [...dataSource]
                  const index = newDataSource.findIndex((item) => item.key === record.key)
                  if (index !== -1) {
                    // 更新同一分组的所有记录的日期
                    const groupId = newDataSource[index].groupId
                    newDataSource.forEach((item) => {
                      if (item.groupId === groupId) {
                        item.date = e.target.value
                      }
                    })
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
            ),
            props: {
              rowSpan: rowSpan > 0 ? rowSpan : 0,
            },
          }
        }

        return {
          children: (
            <div
              onClick={() => {
                setEditingKey(record.key)
                setEditingField('date')
              }}
              style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}
            >
              {value || ''}
            </div>
          ),
          props: {
            rowSpan: rowSpan > 0 ? rowSpan : 0,
          },
        }
      },
    },
    {
      title: '星期',
      dataIndex: 'dayOfWeek',
      key: 'dayOfWeek',
      width: 100,
      align: 'center',
      render: (value, record, index) => {
        const rowSpan = getDayOfWeekRowSpan(record, index)
        const isEditing = editingKey === record.key && editingField === 'dayOfWeek'

        if (isEditing) {
          return {
            children: (
              <Input
                value={value}
                onChange={(e) => {
                  const newDataSource = [...dataSource]
                  const index = newDataSource.findIndex((item) => item.key === record.key)
                  if (index !== -1) {
                    const groupId = newDataSource[index].groupId
                    newDataSource.forEach((item) => {
                      if (item.groupId === groupId) {
                        item.dayOfWeek = e.target.value
                      }
                    })
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
            ),
            props: {
              rowSpan: rowSpan > 0 ? rowSpan : 0,
            },
          }
        }

        return {
          children: (
            <div
              onClick={() => {
                setEditingKey(record.key)
                setEditingField('dayOfWeek')
              }}
              style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}
            >
              {value || ''}
            </div>
          ),
          props: {
            rowSpan: rowSpan > 0 ? rowSpan : 0,
          },
        }
      },
    },
    {
      title: '执行人',
      dataIndex: 'executor',
      key: 'executor',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        const rowSpan = getExecutorRowSpan(record, index)
        const isEditing = editingKey === record.key && editingField === 'executor'

        if (isEditing) {
          return {
            children: (
              <Input
                value={value}
                onChange={(e) => {
                  const newDataSource = [...dataSource]
                  const index = newDataSource.findIndex((item) => item.key === record.key)
                  if (index !== -1) {
                    const groupId = newDataSource[index].groupId
                    newDataSource.forEach((item) => {
                      if (item.groupId === groupId) {
                        item.executor = e.target.value
                      }
                    })
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
            ),
            props: {
              rowSpan: rowSpan > 0 ? rowSpan : 0,
            },
          }
        }

        return {
          children: (
            <div
              onClick={() => {
                setEditingKey(record.key)
                setEditingField('executor')
              }}
              style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}
            >
              {value || ''}
            </div>
          ),
          props: {
            rowSpan: rowSpan > 0 ? rowSpan : 0,
          },
        }
      },
    },
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      align: 'center',
      render: (value) => value,
    },
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 150,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'taskName'
        if (isEditing) {
          return (
            <Input
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource]
                const index = newDataSource.findIndex((item) => item.key === record.key)
                if (index !== -1) {
                  newDataSource[index].taskName = e.target.value
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
              setEditingField('taskName')
            }}
            style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}
          >
            {value || ''}
          </div>
        )
      },
    },
    {
      title: '任务描述',
      dataIndex: 'taskDescription',
      key: 'taskDescription',
      width: 200,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'taskDescription'
        if (isEditing) {
          return (
            <TextArea
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource]
                const index = newDataSource.findIndex((item) => item.key === record.key)
                if (index !== -1) {
                  newDataSource[index].taskDescription = e.target.value
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
              setEditingField('taskDescription')
            }}
            style={{ cursor: 'pointer', minHeight: '32px', padding: '4px', whiteSpace: 'pre-wrap' }}
          >
            {value || ''}
          </div>
        )
      },
    },
    {
      title: '任务目标',
      dataIndex: 'taskGoal',
      key: 'taskGoal',
      width: 150,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'taskGoal'
        if (isEditing) {
          return (
            <Input
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource]
                const index = newDataSource.findIndex((item) => item.key === record.key)
                if (index !== -1) {
                  newDataSource[index].taskGoal = e.target.value
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
              setEditingField('taskGoal')
            }}
            style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}
          >
            {value || ''}
          </div>
        )
      },
    },
    {
      title: '执行时间',
      dataIndex: 'executionTime',
      key: 'executionTime',
      width: 150,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'executionTime'
        if (isEditing) {
          return (
            <Input
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource]
                const index = newDataSource.findIndex((item) => item.key === record.key)
                if (index !== -1) {
                  newDataSource[index].executionTime = e.target.value
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
              setEditingField('executionTime')
            }}
            style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}
          >
            {value || ''}
          </div>
        )
      },
    },
    {
      title: '权重',
      dataIndex: 'weight',
      key: 'weight',
      width: 100,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'weight'
        if (isEditing) {
          return (
            <Input
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource]
                const index = newDataSource.findIndex((item) => item.key === record.key)
                if (index !== -1) {
                  newDataSource[index].weight = e.target.value
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
              setEditingField('weight')
            }}
            style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}
          >
            {value || ''}
          </div>
        )
      },
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      width: 200,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'result'
        if (isEditing) {
          return (
            <TextArea
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource]
                const index = newDataSource.findIndex((item) => item.key === record.key)
                if (index !== -1) {
                  newDataSource[index].result = e.target.value
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
              setEditingField('result')
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
              setEditingField('date')
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
              // 重新编号
              newDataSource.forEach((item, index) => {
                item.serialNumber = index + 1
              })
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
    const newRecord: DailyWorkRecord = {
      key: newKey,
      date: '',
      dayOfWeek: '',
      executor: '',
      serialNumber: dataSource.length + 1,
      taskName: '',
      taskDescription: '',
      taskGoal: '',
      executionTime: '',
      weight: '',
      result: '',
      groupId: `group${Date.now()}`,
    }
    setDataSource([...dataSource, newRecord])
    setEditingKey(newKey)
    setEditingField('date')
  }

  // 神殿选择变化
  const handleCampusChange = (value: string) => {
    setSelectedCampus(value)
    setCampus(value)
  }

  // 表头样式（浅蓝色背景）
  const headerCellStyle: React.CSSProperties = {
    backgroundColor: '#e6f7ff',
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
        <FileTextOutlined style={{ marginRight: 8 }} />
        班主任日工单
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
            <span>日期：</span>
            <DatePicker
              value={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              format="YYYY-MM-DD"
              style={{ width: 200 }}
              placeholder="请选择日期"
            />
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
            background-color: #e6f7ff !important;
            font-weight: bold;
            text-align: center;
          }
          .ant-table-thead > tr:first-child > th {
            background-color: #e6f7ff !important;
          }
        `}</style>
      </Card>
    </div>
  )
}

export default CampusHomeroomTeacherDailyWorkPage
