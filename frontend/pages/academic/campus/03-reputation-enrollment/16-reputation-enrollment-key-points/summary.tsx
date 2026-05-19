/**
 * 口碑招生关键点结果汇总表页面
 * 显示两个表格：按班主任汇总表和按月汇总表
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { App, Card, Table, Button, Space, Input, Select, Row, Col } from 'antd'
import { ReloadOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'
import {
  fetchReputationKeyPoints,
  type ReputationKeyPointDetail,
} from '@/services/reputationKeyPoints'

const { Option } = Select

// 按班主任汇总记录接口
interface TeacherSummaryRecord {
  key: string
  serialNumber: number // 序号
  campus: string // 神殿
  teacherName: string // 班主任姓名
  // 线上宣传数量
  wechatCount: number // 朋友圈数量
  douyinCount: number // 抖音数量
  kuaishouCount: number // 快手数量
  xiaohongshuCount: number // 小红书数量
  onlinePromotionTotal: number // 线上宣传合计
  // 学生访谈数量
  currentStudentInterview: number // 在校生访谈
  graduateInterview: number // 毕业生访谈
  interviewTotal: number // 学生访谈合计
}

const yearOptions = [dayjs().year(), dayjs().year() - 1, dayjs().year() - 2]

const ReputationEnrollmentKeyPointsPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const campuses = getAllCampuses()
  const [selectedCampus, setSelectedCampus] = useState<string>(
    currentCampus || campuses[0]?.name || '',
  )
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year())
  const [detailRecords, setDetailRecords] = useState<ReputationKeyPointDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')

  // 当神殿改变时，更新全局store
  useEffect(() => {
    if (selectedCampus) {
      setCampus(selectedCampus)
    }
  }, [selectedCampus, setCampus])

  useEffect(() => {
    if (currentCampus) {
      setSelectedCampus(currentCampus)
    }
  }, [currentCampus])

  // 神殿切换处理
  const handleCampusChange = (value: string) => {
    setSelectedCampus(value)
    setCampus(value)
  }

  const fetchSummary = useCallback(async () => {
    if (!selectedCampus) return
    setLoading(true)
    try {
      const res = await fetchReputationKeyPoints({ campus: selectedCampus, year: selectedYear })
      setDetailRecords(res.records)
    } catch (error) {
      console.error(error)
      message.error('加载汇总数据失败')
    } finally {
      setLoading(false)
    }
  }, [selectedCampus, selectedYear])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  const teacherSummaryData = useMemo(() => {
    const map = new Map<string, TeacherSummaryRecord>()
    detailRecords.forEach((record) => {
      const teacherName = record.teacher_name || '未填写教员'
      const key = teacherName
      if (!map.has(key)) {
        map.set(key, {
          key,
          serialNumber: 0,
          campus: selectedCampus,
          teacherName,
          wechatCount: 0,
          douyinCount: 0,
          kuaishouCount: 0,
          xiaohongshuCount: 0,
          onlinePromotionTotal: 0,
          currentStudentInterview: 0,
          graduateInterview: 0,
          interviewTotal: 0,
        })
      }
      const entry = map.get(key)!
      entry.wechatCount += record.wechat_moments_count
      entry.douyinCount += record.douyin_count
      entry.kuaishouCount += record.kuaishou_count
      entry.xiaohongshuCount += record.xiaohongshu_count
      entry.currentStudentInterview += record.current_student_interview_count
      entry.graduateInterview += record.graduate_interview_count
    })
    const list = Array.from(map.values()).map((item, index) => {
      const onlineTotal =
        item.wechatCount + item.douyinCount + item.kuaishouCount + item.xiaohongshuCount
      const interviewTotal = item.currentStudentInterview + item.graduateInterview
      return {
        ...item,
        serialNumber: index + 1,
        onlinePromotionTotal: onlineTotal,
        interviewTotal,
      }
    })
    return list
  }, [detailRecords, selectedCampus])

  const filteredTeacherSummary = useMemo(() => {
    if (!searchText.trim()) return teacherSummaryData
    const keyword = searchText.trim().toLowerCase()
    return teacherSummaryData.filter((item) => item.teacherName.toLowerCase().includes(keyword))
  }, [teacherSummaryData, searchText])

  const teacherSummaryWithTotal = useMemo(() => {
    const total = filteredTeacherSummary.reduce(
      (acc, item) => {
        acc.wechatCount += item.wechatCount
        acc.douyinCount += item.douyinCount
        acc.kuaishouCount += item.kuaishouCount
        acc.xiaohongshuCount += item.xiaohongshuCount
        acc.onlinePromotionTotal += item.onlinePromotionTotal
        acc.currentStudentInterview += item.currentStudentInterview
        acc.graduateInterview += item.graduateInterview
        acc.interviewTotal += item.interviewTotal
        return acc
      },
      {
        key: 'total',
        serialNumber: 0,
        campus: '',
        teacherName: '合计',
        wechatCount: 0,
        douyinCount: 0,
        kuaishouCount: 0,
        xiaohongshuCount: 0,
        onlinePromotionTotal: 0,
        currentStudentInterview: 0,
        graduateInterview: 0,
        interviewTotal: 0,
      } as TeacherSummaryRecord,
    )
    return [...filteredTeacherSummary, total]
  }, [filteredTeacherSummary])

  // 按班主任汇总表格列定义

  const teacherSummaryColumns: ColumnsType<TeacherSummaryRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      align: 'center',
      render: (text: number, record: TeacherSummaryRecord) =>
        record.teacherName === '合计' ? '' : text,
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 120,
      align: 'center',
      render: (text: string) => text || '',
    },
    {
      title: '教员姓名',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 150,
      align: 'center',
      render: (text: string, record: TeacherSummaryRecord) => (
        <span style={{ fontWeight: record.teacherName === '合计' ? 'bold' : 'normal' }}>
          {text}
        </span>
      ),
    },
    {
      title: '线上宣传数量',
      key: 'onlinePromotion',
      align: 'center',
      children: [
        {
          title: '朋友圈数量',
          dataIndex: 'wechatCount',
          key: 'wechatCount',
          width: 100,
          align: 'center',
          render: (text: number) => text || 0,
        },
        {
          title: '抖音数量',
          dataIndex: 'douyinCount',
          key: 'douyinCount',
          width: 100,
          align: 'center',
          render: (text: number) => text || 0,
        },
        {
          title: '快手数量',
          dataIndex: 'kuaishouCount',
          key: 'kuaishouCount',
          width: 100,
          align: 'center',
          render: (text: number) => text || 0,
        },
        {
          title: '小红书数量',
          dataIndex: 'xiaohongshuCount',
          key: 'xiaohongshuCount',
          width: 100,
          align: 'center',
          render: (text: number) => text || 0,
        },
        {
          title: '合计',
          dataIndex: 'onlinePromotionTotal',
          key: 'onlinePromotionTotal',
          width: 100,
          align: 'center',
          render: (text: number) => <span style={{ fontWeight: 'bold' }}>{text || 0}</span>,
        },
      ],
    },
    {
      title: '学生访谈数量',
      key: 'interview',
      align: 'center',
      children: [
        {
          title: '在校生访谈',
          dataIndex: 'currentStudentInterview',
          key: 'currentStudentInterview',
          width: 100,
          align: 'center',
          render: (text: number) => text || 0,
        },
        {
          title: '毕业生访谈',
          dataIndex: 'graduateInterview',
          key: 'graduateInterview',
          width: 100,
          align: 'center',
          render: (text: number) => text || 0,
        },
        {
          title: '合计',
          dataIndex: 'interviewTotal',
          key: 'interviewTotal',
          width: 100,
          align: 'center',
          render: (text: number) => <span style={{ fontWeight: 'bold' }}>{text || 0}</span>,
        },
      ],
    },
  ]

  const handleExport = () => {
    message.info('导出功能开发中')
  }

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
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
        {(selectedCampus || 'XX神殿') + '智慧司口碑招生关键点结果汇总表'}
      </div>

      <Card>
        {/* 表头信息 */}
        <Row
          gutter={16}
          style={{ marginBottom: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}
        >
          <Col span={4}>
            <strong>神殿名称：</strong>
            <Select
              value={selectedCampus}
              onChange={handleCampusChange}
              style={{ width: 150, marginLeft: 8 }}
            >
              {campuses.map((campus) => (
                <Option key={campus.id} value={campus.name}>
                  {campus.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <strong>年份：</strong>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              style={{ width: 120, marginLeft: 8 }}
            >
              {yearOptions.map((year) => (
                <Option key={year} value={year}>
                  {year}年
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

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
            <Input
              placeholder="搜索班主任姓名"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
          </Space>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchText('')
                fetchSummary()
              }}
            >
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>
        </div>

        {/* 汇总表格：按班主任汇总 */}
        <div style={{ marginBottom: 32 }}>
          <Table
            columns={teacherSummaryColumns}
            dataSource={teacherSummaryWithTotal}
            pagination={false}
            loading={loading}
            bordered
            size="small"
            scroll={{ x: 'max-content' }}
            rowClassName={(record) => (record.teacherName === '合计' ? 'summary-row' : '')}
          />
        </div>
      </Card>
    </div>
  )
}

export default ReputationEnrollmentKeyPointsPage
