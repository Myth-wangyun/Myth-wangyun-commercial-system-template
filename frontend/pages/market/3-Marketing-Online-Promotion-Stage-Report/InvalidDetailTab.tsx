import React, { useState, useEffect } from 'react'
import { App, Table, Button, Space, Spin } from 'antd'
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { getInvalidDetailRecords } from './api'
import type { ConsultationRecord } from './api'

interface InvalidDetailRecord {
  key: string
  date: string
  dateKey: string  // 用于计算rowSpan的日期key (YYYY-MM-DD)
  totalSeq: number
  dailySeq: number
  onlineTransfer: string
  onlineNewMedia: string
  reputationDoor: string
  channelDoor: string
  consultant: string
  name: string
  age: string
  gender: string
  contact: string
  qqWechat: string
  education: string
  status: string
  region: string
  deviceSource: string
  mediaSource: string
  keyword: string
  consultResult: string
  networkSpecialist: string
}

interface InvalidDetailTabProps {
  campusId: string
  startDate: Dayjs
  endDate: Dayjs
}

const InvalidDetailTab: React.FC<InvalidDetailTabProps> = ({ campusId, startDate, endDate }) => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<InvalidDetailRecord[]>([])

  // 将API返回的数据转换为表格显示格式
  const transformRecords = (records: ConsultationRecord[]): InvalidDetailRecord[] => {
    // 按日期排序
    const sortedRecords = [...records].sort((a, b) => {
      const dateA = a.登记日期 || ''
      const dateB = b.登记日期 || ''
      return dateA.localeCompare(dateB)
    })

    // 按日期分组计算序号
    const dateCountMap: Record<string, number> = {}
    let totalSeq = 0

    return sortedRecords.map((record) => {
      totalSeq++
      const dateKey = record.登记日期 ? dayjs(record.登记日期).format('YYYY-MM-DD') : ''
      dateCountMap[dateKey] = (dateCountMap[dateKey] || 0) + 1
      const dailySeq = dateCountMap[dateKey]
      
      // 只有当日第一条记录显示日期
      const isFirstOfDay = dailySeq === 1
      const displayDate = isFirstOfDay && record.登记日期 
        ? dayjs(record.登记日期).format('M月D日') 
        : ''

      return {
        key: `${record.记录ID}`,
        date: displayDate,
        dateKey,
        totalSeq,
        dailySeq,
        onlineTransfer: record.量来源 === '网络' ? '√' : '',
        onlineNewMedia: record.媒体来源 || '',
        reputationDoor: '',
        channelDoor: '',
        consultant: record.咨询师 || '',
        name: record.咨询者姓名 || '',
        age: record.年龄 || '',
        gender: record.性别 || '',
        contact: record.电话 || '',
        qqWechat: record.QQ || record.微信 || '',
        education: record.学历 || '',
        status: record.状态 || '',
        region: record.位置 || '',
        deviceSource: record.量来源 || '',
        mediaSource: record.媒体来源 || '',
        keyword: record.关键字 || '',
        consultResult: record.无效原因 || record.咨询结果 || '',
        networkSpecialist: record.网聊专员 || '',
      }
    })
  }

  // 加载数据
  const fetchData = async () => {
    try {
      setLoading(true)
      
      const startDateStr = startDate.format('YYYY-MM-DD')
      const endDateStr = endDate.format('YYYY-MM-DD')
      
      // 从咨询系统获取无效量明细数据
      const records = await getInvalidDetailRecords(campusId, startDateStr, endDateStr)
      const transformedData = transformRecords(records)
      
      setDataSource(transformedData)
      
      if (transformedData.length > 0) {
        message.success(`成功加载 ${transformedData.length} 条无效量记录`)
      } else {
        message.info('当前条件下没有无效量记录')
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
      setDataSource([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (campusId) {
      fetchData()
    }
  }, [campusId, startDate, endDate])

  // 表格列定义
  const columns: ColumnsType<InvalidDetailRecord> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      align: 'center',
      render: (text, record) => {
        // 判断是否是当日第一条记录，使用dateKey来正确计算
        if (record.dailySeq === 1 && record.dateKey) {
          // 计算该日期有多少条记录（用于rowSpan）
          const sameDateCount = dataSource.filter(r => r.dateKey === record.dateKey).length
          
          return {
            children: <div style={{ fontWeight: 'bold' }}>{text}</div>,
            props: { rowSpan: sameDateCount }
          }
        }
        
        // 不是第一条记录，rowSpan设为0（被合并）
        return {
          children: text,
          props: { rowSpan: 0 }
        }
      },
    },
    {
      title: '总序号',
      dataIndex: 'totalSeq',
      key: 'totalSeq',
      align: 'center',
      render: (text) => <div style={{ backgroundColor: '#D6EAF8' }}>{text}</div>,
    },
    {
      title: '当日序号',
      dataIndex: 'dailySeq',
      key: 'dailySeq',
      align: 'center',
      render: (text) => <div style={{ backgroundColor: '#D6EAF8' }}>{text}</div>,
    },
    {
      title: '网转上门',
      dataIndex: 'onlineTransfer',
      key: 'onlineTransfer',
      align: 'center',
    },
    {
      title: '网络新媒体',
      dataIndex: 'onlineNewMedia',
      key: 'onlineNewMedia',
      align: 'center',
    },
    {
      title: '口碑上门',
      dataIndex: 'reputationDoor',
      key: 'reputationDoor',
      align: 'center',
    },
    {
      title: '渠道上门',
      dataIndex: 'channelDoor',
      key: 'channelDoor',
      align: 'center',
    },
    {
      title: '咨询师',
      dataIndex: 'consultant',
      key: 'consultant',
      align: 'center',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      align: 'center',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      align: 'center',
    },
    {
      title: '联系方式',
      dataIndex: 'contact',
      key: 'contact',
      align: 'center',
    },
    {
      title: 'QQ/微信',
      dataIndex: 'qqWechat',
      key: 'qqWechat',
      align: 'center',
    },
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education',
      align: 'center',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
    },
    {
      title: '地域',
      dataIndex: 'region',
      key: 'region',
      align: 'center',
    },
    {
      title: '设备来源',
      dataIndex: 'deviceSource',
      key: 'deviceSource',
      align: 'center',
    },
    {
      title: '媒体来源',
      dataIndex: 'mediaSource',
      key: 'mediaSource',
      align: 'center',
    },
    {
      title: '关键字',
      dataIndex: 'keyword',
      key: 'keyword',
      align: 'center',
    },
    {
      title: '咨询结果',
      dataIndex: 'consultResult',
      key: 'consultResult',
      align: 'center',
    },
    {
      title: '网聊专员',
      dataIndex: 'networkSpecialist',
      key: 'networkSpecialist',
      align: 'center',
    },
  ]

  const handleExport = () => {
    message.info('导出功能开发中...')
  }

  const handleRefresh = () => {
    fetchData()
  }

  return (
    <div style={{ padding: '16px' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
          导出Excel
        </Button>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
          刷新数据
        </Button>
      </Space>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={{
            defaultPageSize: 50,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSizeOptions: ['50', '100', '200', '500'],
          }}
          bordered
          size="small"
          scroll={{ y: 600 }}
          rowClassName={(record, index) => {
            // 每5行一组，交替背景色
            const groupIndex = Math.floor(index / 5)
            return groupIndex % 2 === 0 ? 'even-group' : 'odd-group'
          }}
        />
      </Spin>

      <style>{`
        .even-group {
          background-color: #ffffff;
        }
        .odd-group {
          background-color: #fafafa;
        }
        .ant-table-cell {
          padding: 8px 4px !important;
        }
      `}</style>
    </div>
  )
}

export default InvalidDetailTab

