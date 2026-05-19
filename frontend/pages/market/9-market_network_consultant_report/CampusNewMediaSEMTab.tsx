import React, { useState, useEffect } from 'react'
import { App, Table, Button, Space, Select, Segmented, Tag } from 'antd'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { 
  getConsultationRecordsByCampusAndSource,
  type ConsultationRecordForDisplay,
  type PaginatedResponse
} from './api'

const { Option } = Select

// 表格展示记录类型
interface ConsultantRecord {
  key: string
  recordId: number // 记录ID
  date: string // 日期
  time: string // 时间
  totalSequence: number // 总序号
  dailySequence: number // 当日序号
  consultant: string // 咨询师
  studentName: string // 姓名
  age: string | null // 年龄
  gender: string // 性别
  contactMethod: string // 联系方式
  qqWeChat: string // QQ/微信
  education: string // 学历
  status: string // 状态
  region: string // 地域
  source: string // 量来源
  mediaSource: string // 媒体来源
  interest: string // 关键字
  consultResult: string // 咨询结果
  networkSpecialist: string // 网聊专员
}

interface CampusNewMediaSEMTabProps {
  year: string
  month: string
}

type ChannelType = '新媒体' | 'SEM'

const CampusNewMediaSEMTab: React.FC<CampusNewMediaSEMTabProps> = ({ year, month }) => {
  const { message } = App.useApp()
  const [dataSource, setDataSource] = useState<ConsultantRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCampus, setSelectedCampus] = useState<string>('')
  const [selectedChannel, setSelectedChannel] = useState<ChannelType>('新媒体')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 })
  
  const { campuses, loadCampusesFromConfig } = useCampusStore()

  // 加载神殿配置
  useEffect(() => {
    loadCampusesFromConfig()
  }, [loadCampusesFromConfig])

  // 设置默认神殿
  useEffect(() => {
    if (campuses.length > 0 && !selectedCampus) {
      setSelectedCampus(campuses[0].name)
    }
  }, [campuses, selectedCampus])

  // 从咨询量录入系统加载数据
  const loadData = async (page: number = 1, pageSize: number = 50) => {
    if (!selectedCampus) {
      return
    }

    try {
      setLoading(true)
      
      // 计算日期范围
      const startDate = `${year}-${month.padStart(2, '0')}-01`
      const endDate = dayjs(startDate).endOf('month').format('YYYY-MM-DD')
      
      // 根据选择的渠道确定媒体来源
      // 量来源固定为"网络"，媒体来源为"新媒体平台"或"常规SEM平台"
      const mediaSourceMap: Record<ChannelType, string> = {
        '新媒体': '新媒体平台',
        'SEM': '常规SEM平台'
      }
      
      // 调用咨询量录入系统API获取数据
      const response = await getConsultationRecordsByCampusAndSource({
        campus: selectedCampus,
        source: '网络', // 量来源固定为"网络"
        media_source: mediaSourceMap[selectedChannel], // 媒体来源: "新媒体平台" 或 "常规SEM平台"
        start_date: startDate,
        end_date: endDate,
        page: page,
        page_size: pageSize,
      })
      
      // 转换数据格式 - 按日期排序并添加序号
      const sortedData = (response.数据列表 || []).sort((a, b) => {
        const dateA = a.登记日期 || ''
        const dateB = b.登记日期 || ''
        return dateA.localeCompare(dateB)
      })
      
      // 计算序号 - 按日期分组计算当日序号
      let totalSeq = (page - 1) * pageSize
      const dateCountMap: Record<string, number> = {}
      
      const records: ConsultantRecord[] = sortedData.map((item: ConsultationRecordForDisplay) => {
        totalSeq++
        const dateKey = item.登记日期 ? dayjs(item.登记日期).format('YYYY-MM-DD') : ''
        dateCountMap[dateKey] = (dateCountMap[dateKey] || 0) + 1
        
        return {
          key: `${item.记录ID}`,
          recordId: item.记录ID,
          date: item.登记日期 ? dayjs(item.登记日期).format('M月D日') : '',
          time: item.登记时间 || '',
          totalSequence: totalSeq,
          dailySequence: dateCountMap[dateKey],
          consultant: item.咨询师 || '',
          studentName: item.咨询者姓名 || '',
          age: item.年龄,
          gender: item.性别 || '',
          contactMethod: item.电话 || '',
          qqWeChat: item.QQ || item.微信 || '',
          education: item.学历 || '',
          status: item.状态 || '',
          region: item.位置 || '',
          source: item.量来源 || '',
          mediaSource: item.媒体来源 || '',
          interest: item.关键字 || '',
          consultResult: item.咨询结果 || item.备注 || '',
          networkSpecialist: item.网聊专员 || '',
        }
      })
      
      setDataSource(records)
      setPagination({
        current: response.当前页,
        pageSize: response.每页数量,
        total: response.总记录数,
      })
      
      if (records.length > 0) {
        message.success(`${selectedCampus} - ${selectedChannel} 加载了 ${records.length} 条记录`)
      } else {
        message.info(`${selectedCampus} - ${selectedChannel} 暂无数据`)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
      setDataSource([])
    } finally {
      setLoading(false)
    }
  }

  // 初始化数据 - 当年月、神殿或渠道变化时重新加载
  useEffect(() => {
    if (selectedCampus) {
      loadData()
    }
  }, [year, month, selectedCampus, selectedChannel])

  // 刷新数据
  const handleRefresh = () => {
    message.info('正在刷新数据...')
    loadData(pagination.current, pagination.pageSize)
  }

  // 处理分页变化
  const handleTableChange = (paginationInfo: any) => {
    loadData(paginationInfo.current, paginationInfo.pageSize)
  }

  // 导出数据
  const handleExport = () => {
    message.info('导出功能开发中...')
  }

  const columns: ColumnsType<ConsultantRecord> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 80,
      fixed: 'left',
      align: 'center',
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 80,
      align: 'center',
    },
    {
      title: '总序号',
      dataIndex: 'totalSequence',
      key: 'totalSequence',
      width: 70,
      align: 'center',
    },
    {
      title: '当日序号',
      dataIndex: 'dailySequence',
      key: 'dailySequence',
      width: 80,
      align: 'center',
    },
    {
      title: '网聊专员',
      dataIndex: 'networkSpecialist',
      key: 'networkSpecialist',
      width: 90,
      align: 'center',
    },
    {
      title: '咨询师',
      dataIndex: 'consultant',
      key: 'consultant',
      width: 80,
      align: 'center',
    },
    {
      title: '姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 100,
      align: 'center',
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 60,
      align: 'center',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 60,
      align: 'center',
    },
    {
      title: '联系方式',
      dataIndex: 'contactMethod',
      key: 'contactMethod',
      width: 120,
      align: 'center',
    },
    {
      title: 'QQ/微信',
      dataIndex: 'qqWeChat',
      key: 'qqWeChat',
      width: 120,
      align: 'center',
    },
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education',
      width: 80,
      align: 'center',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center',
    },
    {
      title: '地域',
      dataIndex: 'region',
      key: 'region',
      width: 100,
      align: 'center',
      ellipsis: true,
    },
    {
      title: '量来源',
      dataIndex: 'source',
      key: 'source',
      width: 80,
      align: 'center',
      render: (value) => (
        <Tag color={value === '新媒体' ? 'blue' : value === 'SEM' ? 'green' : 'default'}>
          {value}
        </Tag>
      ),
    },
    {
      title: '媒体来源',
      dataIndex: 'mediaSource',
      key: 'mediaSource',
      width: 100,
      align: 'center',
    },
    {
      title: '关键字',
      dataIndex: 'interest',
      key: 'interest',
      width: 150,
      align: 'center',
      ellipsis: true,
    },
    {
      title: '咨询结果',
      dataIndex: 'consultResult',
      key: 'consultResult',
      width: 200,
      align: 'center',
      ellipsis: true,
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Space wrap>
          <span style={{ fontWeight: 'bold' }}>选择神殿：</span>
          <Select
            value={selectedCampus}
            onChange={setSelectedCampus}
            style={{ width: 150 }}
            placeholder="请选择神殿"
          >
            {campuses.map((campus) => (
              <Option key={campus.id} value={campus.name}>
                {campus.name}
              </Option>
            ))}
          </Select>

          <span style={{ fontWeight: 'bold', marginLeft: 16 }}>选择渠道：</span>
          <Segmented
            value={selectedChannel}
            onChange={(value) => setSelectedChannel(value as ChannelType)}
            options={[
              { label: '新媒体', value: '新媒体' },
              { label: 'SEM', value: 'SEM' },
            ]}
          />
        </Space>

        <Space wrap>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
            loading={loading}
          >
            刷新
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleExport}
          >
            导出
          </Button>
        </Space>
      </Space>

      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey={(record) => record.key}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        onChange={handleTableChange}
        bordered
        size="small"
        scroll={{ x: 1800, y: 600 }}
        loading={loading}
        rowClassName={(record, index) => {
          // 根据日期分组，相同日期的行使用相同背景色
          const dateIndex = dataSource.findIndex(item => item.date === record.date)
          const groupIndex = Math.floor(dateIndex / 10)
          return groupIndex % 2 === 0 ? 'even-group' : 'odd-group'
        }}
      />

      <style>{`
        .ant-table-thead > tr > th {
          background-color: #9bc2e6 !important;
          text-align: center !important;
          font-weight: bold !important;
          border: 1px solid #000 !important;
          padding: 8px 4px !important;
          color: #000 !important;
        }
        .ant-table-tbody > tr > td {
          border: 1px solid #d0d0d0 !important;
          padding: 4px 8px !important;
        }
        .ant-table-tbody > tr.even-group > td {
          background-color: #fff !important;
        }
        .ant-table-tbody > tr.odd-group > td {
          background-color: #f0f8ff !important;
        }
        .ant-table-cell {
          white-space: nowrap;
        }
      `}</style>
    </div>
  )
}

export default CampusNewMediaSEMTab