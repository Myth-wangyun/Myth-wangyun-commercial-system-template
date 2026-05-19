/**
 * 移动端 - 咨询记录
 *
 * 功能：
 * 1. 左右分栏布局（左侧咨询者列表，右侧沟通记录）
 * 2. 移动端改为上下滑动切换
 * 3. 显示距上次联络天数
 * 4. 快捷拨打电话功能
 * 5. 新增/编辑沟通记录
 */

import React, { useState, useEffect, useCallback } from 'react'
import { App,
  Card,
  List,
  Tag,
  Button,
  Space,
  Input,
  DatePicker,
  Select,
  Spin,
  Empty,
  Drawer,
  Form,
  Radio,
  Badge,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  PhoneOutlined,
  ArrowLeftOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ConsultationRecord } from '@/pages/consult/type-count-system/types'
import type { CommunicationRecord } from '@/pages/consult/type-count-system/phoneStatsApi'
import * as api from '@/pages/consult/type-count-system/api'
import * as phoneApi from '@/pages/consult/type-count-system/phoneStatsApi'
import './MobileConsultationRecords.css'

// 报名意向颜色
const intentionColors: Record<string, string> = {
  强意向: 'success',
  中意向: 'processing',
  弱意向: 'warning',
  无意向: 'default',
  已报名: 'cyan',
  联系不上: 'error',
}

// 沟通方式颜色
const methodColors: Record<string, string> = {
  电话: 'blue',
  网聊: 'green',
  当面: 'orange',
}

export default function MobileConsultationRecords() {
  const { message } = App.useApp()
  // 主表数据
  const [records, setRecords] = useState<ConsultationRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // 筛选
  const [searchText, setSearchText] = useState('')
  const [intentionFilter, setIntentionFilter] = useState<string | undefined>()
  const [dateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)

  // 选中的咨询者 & 其沟通记录
  const [selectedRecord, setSelectedRecord] = useState<ConsultationRecord | null>(null)
  const [commRecords, setCommRecords] = useState<CommunicationRecord[]>([])
  const [commLoading, setCommLoading] = useState(false)

  // 新增/编辑沟通记录
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [editingComm, setEditingComm] = useState<CommunicationRecord | null>(null)
  const [form] = Form.useForm()

  // 加载咨询量列表
  const loadData = useCallback(
    async (isRefresh: boolean = false) => {
      if (loading) return

      const currentPage = isRefresh ? 1 : page
      setLoading(true)

      try {
        const params: Record<string, unknown> = {
          page: currentPage,
          page_size: pageSize,
        }
        if (searchText) params.keyword = searchText
        if (intentionFilter) params.intention = intentionFilter
        if (dateRange) {
          params.start_date = dateRange[0].format('YYYY-MM-DD')
          params.end_date = dateRange[1].format('YYYY-MM-DD')
        }

        const result = await api.getMyConsultations(params)
        if (result.data?.数据列表) {
          const newRecords = result.data.数据列表
          if (isRefresh) {
            setRecords(newRecords)
            setPage(1)
          } else {
            setRecords((prev) => [...prev, ...newRecords])
          }
          setTotal(result.data.总记录数 || result.data.数据列表.length)
          setHasMore(newRecords.length === pageSize)
        }
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        setLoading(false)
      }
    },
    [loading, page, pageSize, searchText, intentionFilter, dateRange],
  )

  useEffect(() => {
    loadData(true)
  }, [searchText, intentionFilter, dateRange])

  // 加载沟通记录
  const loadCommRecords = useCallback(async (记录ID: number) => {
    setCommLoading(true)
    try {
      const result = await phoneApi.getCommunicationsByRecordId(记录ID)
      if (result.success) {
        setCommRecords(result.data || [])
      }
    } catch (error) {
      console.error('加载沟通记录失败:', error)
    } finally {
      setCommLoading(false)
    }
  }, [])

  // 点击选中咨询者
  const handleSelectRecord = (record: ConsultationRecord) => {
    setSelectedRecord(record)
    loadCommRecords(record.记录ID)
  }

  // 返回列表
  const handleBackToList = () => {
    setSelectedRecord(null)
    setCommRecords([])
  }

  // 计算距上次联络天数
  const getDaysSinceLastContact = () => {
    if (commRecords.length === 0) return null
    const sorted = [...commRecords].sort(
      (a, b) => dayjs(b.沟通时间).valueOf() - dayjs(a.沟通时间).valueOf(),
    )
    const lastTime = dayjs(sorted[0].沟通时间)
    return dayjs().diff(lastTime, 'day')
  }

  // 拨打电话
  const handleCall = (phone: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`
    } else {
      message.warning('无电话号码')
    }
  }

  // 新增沟通记录
  const handleAddComm = () => {
    if (!selectedRecord) return
    setEditingComm(null)
    form.resetFields()
    form.setFieldsValue({
      记录ID: selectedRecord.记录ID,
      沟通时间: dayjs(),
      沟通方式: '电话',
    })
    setDrawerVisible(true)
  }

  // 编辑沟通记录
  const handleEditComm = (comm: CommunicationRecord) => {
    setEditingComm(comm)
    form.setFieldsValue({
      ...comm,
      沟通时间: dayjs(comm.沟通时间),
    })
    setDrawerVisible(true)
  }

  // 保存沟通记录
  const handleSaveComm = async () => {
    try {
      const values = await form.validateFields()
      const data = {
        ...values,
        沟通时间: values.沟通时间.format('YYYY-MM-DD HH:mm:ss'),
        记录ID: selectedRecord?.记录ID,
      }

      if (editingComm) {
        await phoneApi.updateCommunicationRecord(editingComm.沟通ID, data)
        message.success('更新成功')
      } else {
        await phoneApi.createCommunicationRecord(data)
        message.success('添加成功')
      }

      setDrawerVisible(false)
      if (selectedRecord) {
        loadCommRecords(selectedRecord.记录ID)
      }
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  // 删除沟通记录
  const handleDeleteComm = async (沟通ID: number) => {
    if (!selectedRecord) return
    try {
      await phoneApi.deleteCommunicationRecord(沟通ID)
      message.success('删除成功')
      loadCommRecords(selectedRecord.记录ID)
    } catch {
      message.error('删除失败')
    }
  }

  // 加载更多
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1)
      setTimeout(() => loadData(false), 100)
    }
  }

  // 渲染咨询者列表
  const renderRecordList = () => (
    <div className="m-consult-records-list">
      <div className="list-header">
        <Input
          placeholder="搜索姓名、电话"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <Space style={{ marginTop: 12, width: '100%' }}>
          <Select
            placeholder="报名意向"
            value={intentionFilter}
            onChange={setIntentionFilter}
            style={{ flex: 1, minWidth: 120 }}
            allowClear
          >
            <Select.Option value="强意向">强意向</Select.Option>
            <Select.Option value="中意向">中意向</Select.Option>
            <Select.Option value="弱意向">弱意向</Select.Option>
            <Select.Option value="无意向">无意向</Select.Option>
            <Select.Option value="已报名">已报名</Select.Option>
            <Select.Option value="联系不上">联系不上</Select.Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={() => loadData(true)}>
            刷新
          </Button>
        </Space>
      </div>

      <div className="list-content">
        {loading && page === 1 ? (
          <div className="loading-wrapper">
            <Spin size="large" tip="加载中..." />
          </div>
        ) : records.length === 0 ? (
          <Empty description="暂无数据" />
        ) : (
          <>
            {records.map((record) => (
              <Card
                key={record.记录ID}
                size="small"
                className="record-card"
                onClick={() => handleSelectRecord(record)}
                hoverable
              >
                <div className="card-header">
                  <span className="name">{record.咨询者姓名 || '未知'}</span>
                  <Tag color={intentionColors[record.报名意向 || '无意向']}>
                    {record.报名意向 || '无意向'}
                  </Tag>
                </div>
                <div className="card-body">
                  <div className="info-row">
                    <PhoneOutlined /> {record.电话}
                  </div>
                  {record.位置 && (
                    <div className="info-row">
                      <EnvironmentOutlined /> {record.位置}
                    </div>
                  )}
                  <div className="info-row">
                    <UserOutlined /> {record.咨询师 || '未分配'}
                    <span className="separator">•</span>
                    {dayjs(record.登记日期).format('MM-DD')}
                  </div>
                </div>
              </Card>
            ))}

            {hasMore && (
              <Button block onClick={handleLoadMore} loading={loading} style={{ margin: '16px 0' }}>
                {loading ? '加载中...' : '加载更多'}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )

  // 渲染沟通记录详情
  const renderCommDetail = () => {
    if (!selectedRecord) return null

    const daysSince = getDaysSinceLastContact()

    return (
      <div className="m-consult-comm-detail">
        <div className="detail-header">
          <Button icon={<ArrowLeftOutlined />} onClick={handleBackToList}>
            返回
          </Button>
          <Space>
            <Button
              type="primary"
              icon={<PhoneOutlined />}
              onClick={() => handleCall(selectedRecord.电话)}
            >
              拨打
            </Button>
            <Button icon={<PlusOutlined />} onClick={handleAddComm}>
              新增
            </Button>
          </Space>
        </div>

        <Card size="small" className="person-info">
          <div className="info-header">
            <h3>{selectedRecord.咨询者姓名 || '未知'}</h3>
            <Tag color={intentionColors[selectedRecord.报名意向 || '无意向']}>
              {selectedRecord.报名意向 || '无意向'}
            </Tag>
          </div>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <PhoneOutlined /> {selectedRecord.电话}
            </div>
            {selectedRecord.微信 && <div>微信：{selectedRecord.微信}</div>}
            {selectedRecord.QQ && <div>QQ：{selectedRecord.QQ}</div>}
            {selectedRecord.位置 && (
              <div>
                <EnvironmentOutlined /> {selectedRecord.位置}
              </div>
            )}
            {daysSince !== null && (
              <div style={{ color: daysSince > 7 ? '#ff4d4f' : '#52c41a' }}>
                <ClockCircleOutlined /> 距上次联络 {daysSince} 天
              </div>
            )}
          </Space>
        </Card>

        <div className="comm-list">
          <h4>沟通记录 ({commRecords.length})</h4>
          {commLoading ? (
            <Spin />
          ) : commRecords.length === 0 ? (
            <Empty description="暂无沟通记录" />
          ) : (
            <List
              dataSource={commRecords.sort(
                (a, b) => dayjs(b.沟通时间).valueOf() - dayjs(a.沟通时间).valueOf(),
              )}
              renderItem={(comm) => (
                <List.Item
                  key={comm.沟通ID}
                  actions={[
                    <Button size="small" type="link" onClick={() => handleEditComm(comm)}>
                      编辑
                    </Button>,
                    <Button
                      size="small"
                      type="link"
                      danger
                      onClick={() => handleDeleteComm(comm.沟通ID)}
                    >
                      删除
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color={methodColors[comm.沟通方式]}>{comm.沟通方式}</Tag>
                        <span>{dayjs(comm.沟通时间).format('YYYY-MM-DD HH:mm')}</span>
                      </Space>
                    }
                    description={comm.咨询内容 || '无'}
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-consultation-records">
      <div className="m-records-header">
        <h2>咨询记录</h2>
        <Badge count={total} overflowCount={999} style={{ backgroundColor: '#52c41a' }}>
          <span style={{ color: 'white' }}>总数</span>
        </Badge>
      </div>

      {selectedRecord ? renderCommDetail() : renderRecordList()}

      {/* 新增/编辑沟通记录抽屉 */}
      <Drawer
        title={editingComm ? '编辑沟通记录' : '新增沟通记录'}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleSaveComm}>
              保存
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="沟通时间" label="沟通时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="沟通方式" label="沟通方式" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="电话">电话</Radio>
              <Radio value="网聊">网聊</Radio>
              <Radio value="当面">当面</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="沟通内容" label="沟通内容">
            <Input.TextArea rows={4} placeholder="请输入沟通内容" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}
