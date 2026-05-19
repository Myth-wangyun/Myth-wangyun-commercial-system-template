/**
 * XX神殿教化司口碑招生关键点结果汇总表
 */

import React, { useState, useMemo } from 'react'
import { App,
  Card,
  Table,
  Button,
  Space,
  Select,
  Input,
  Typography,
  Statistic,
  Row,
  Col,
} from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  EditOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'

const { Option } = Select
const { Title } = Typography

// 口碑招生关键点记录接口
interface ReputationKeypointRecord {
  key: string
  serialNumber: number // 序号
  campus: string // 神殿
  teacherName: string // 班主任姓名

  // 线上宣传数量
  wechatMoments: number // 朋友圈数量
  douyin: number // 抖音数量
  kuaishou: number // 快手数量
  xiaohongshu: number // 小红书数量
  onlineTotal: number // 线上宣传合计

  // 学生访谈数量
  currentStudentInterview: number // 在校生访谈
  graduateInterview: number // 毕业生访谈
  parentInterview: number // 家长访谈
  interviewTotal: number // 访谈合计

  // 活动数量
  activityCount: number // 活动次数
  competitionCount: number // 比赛次数
  examRegistrationCount: number // 送喜报人次
  activityTotal: number // 活动合计

  rowType?: 'data' | 'total' // 行类型
}

const ReputationEnrollmentKeypointSummary: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore()
  const campuses = getAllCampuses()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [selectedYear, setSelectedYear] = useState<number>(2024)
  const [selectedMonth, setSelectedMonth] = useState<number>(10)
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)

  // 初始化数据
  const [dataSource, setDataSource] = useState<ReputationKeypointRecord[]>([
    {
      key: '1',
      serialNumber: 1,
      campus: '',
      teacherName: '张三',
      wechatMoments: 0,
      douyin: 0,
      kuaishou: 0,
      xiaohongshu: 0,
      onlineTotal: 0,
      currentStudentInterview: 0,
      graduateInterview: 0,
      parentInterview: 0,
      interviewTotal: 0,
      activityCount: 0,
      competitionCount: 0,
      examRegistrationCount: 0,
      activityTotal: 0,
      rowType: 'data',
    },
    {
      key: '2',
      serialNumber: 2,
      campus: '',
      teacherName: '李四',
      wechatMoments: 0,
      douyin: 0,
      kuaishou: 0,
      xiaohongshu: 0,
      onlineTotal: 0,
      currentStudentInterview: 0,
      graduateInterview: 0,
      parentInterview: 0,
      interviewTotal: 0,
      activityCount: 0,
      competitionCount: 0,
      examRegistrationCount: 0,
      activityTotal: 0,
      rowType: 'data',
    },
  ])

  // 计算合计行
  const totalRow = useMemo((): ReputationKeypointRecord => {
    const dataRows = dataSource.filter((r) => r.rowType === 'data')

    return {
      key: 'total',
      serialNumber: 0,
      campus: '',
      teacherName: '合计',
      wechatMoments: dataRows.reduce((sum, r) => sum + r.wechatMoments, 0),
      douyin: dataRows.reduce((sum, r) => sum + r.douyin, 0),
      kuaishou: dataRows.reduce((sum, r) => sum + r.kuaishou, 0),
      xiaohongshu: dataRows.reduce((sum, r) => sum + r.xiaohongshu, 0),
      onlineTotal: dataRows.reduce((sum, r) => sum + r.onlineTotal, 0),
      currentStudentInterview: dataRows.reduce((sum, r) => sum + r.currentStudentInterview, 0),
      graduateInterview: dataRows.reduce((sum, r) => sum + r.graduateInterview, 0),
      parentInterview: dataRows.reduce((sum, r) => sum + r.parentInterview, 0),
      interviewTotal: dataRows.reduce((sum, r) => sum + r.interviewTotal, 0),
      activityCount: dataRows.reduce((sum, r) => sum + r.activityCount, 0),
      competitionCount: dataRows.reduce((sum, r) => sum + r.competitionCount, 0),
      examRegistrationCount: dataRows.reduce((sum, r) => sum + r.examRegistrationCount, 0),
      activityTotal: dataRows.reduce((sum, r) => sum + r.activityTotal, 0),
      rowType: 'total',
    }
  }, [dataSource])

  // 包含合计行的完整数据
  const fullDataSource = useMemo(() => {
    return [...dataSource, totalRow]
  }, [dataSource, totalRow])

  // 自动计算每行的合计
  const calculateRowTotals = (record: ReputationKeypointRecord): ReputationKeypointRecord => {
    return {
      ...record,
      onlineTotal: record.wechatMoments + record.douyin + record.kuaishou + record.xiaohongshu,
      interviewTotal:
        record.currentStudentInterview + record.graduateInterview + record.parentInterview,
      activityTotal: record.activityCount + record.competitionCount + record.examRegistrationCount,
    }
  }

  // 处理单元格编辑
  const handleCellChange = (key: string, field: keyof ReputationKeypointRecord, value: any) => {
    const newData = dataSource.map((item) => {
      if (item.key === key) {
        const updated = { ...item, [field]: value }
        return calculateRowTotals(updated)
      }
      return item
    })
    setDataSource(newData)
  }

  // 渲染可编辑数字单元格
  const renderEditableNumberCell = (
    value: number,
    record: ReputationKeypointRecord,
    field: keyof ReputationKeypointRecord,
  ) => {
    if (!editMode || record.rowType === 'total') {
      return value
    }

    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => handleCellChange(record.key, field, Number(e.target.value) || 0)}
        style={{ width: '100%' }}
        min={0}
      />
    )
  }

  // 渲染可编辑文本单元格
  const renderEditableTextCell = (
    value: string,
    record: ReputationKeypointRecord,
    field: keyof ReputationKeypointRecord,
  ) => {
    if (!editMode || record.rowType === 'total') {
      return value
    }

    return (
      <Input
        value={value}
        onChange={(e) => handleCellChange(record.key, field, e.target.value)}
        style={{ width: '100%' }}
      />
    )
  }

  // 添加新行
  const handleAddRow = () => {
    const newKey = `${Date.now()}`
    const newRecord: ReputationKeypointRecord = {
      key: newKey,
      serialNumber: dataSource.length + 1,
      campus: selectedCampus || '',
      teacherName: '',
      wechatMoments: 0,
      douyin: 0,
      kuaishou: 0,
      xiaohongshu: 0,
      onlineTotal: 0,
      currentStudentInterview: 0,
      graduateInterview: 0,
      parentInterview: 0,
      interviewTotal: 0,
      activityCount: 0,
      competitionCount: 0,
      examRegistrationCount: 0,
      activityTotal: 0,
      rowType: 'data',
    }
    setDataSource([...dataSource, newRecord])
    message.success('已添加新行')
  }

  // 删除行
  const handleDeleteRow = (key: string) => {
    const newData = dataSource.filter((item) => item.key !== key)
    // 重新编号
    const reNumbered = newData.map((item, index) => ({
      ...item,
      serialNumber: index + 1,
    }))
    setDataSource(reNumbered)
    message.success('已删除')
  }

  // 生成表格列配置
  const columns: ColumnsType<ReputationKeypointRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 60,
      align: 'center',
      fixed: 'left',
      render: (value, record) => (record.rowType === 'total' ? '' : value),
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      align: 'center',
      fixed: 'left',
      render: (value, record) => renderEditableTextCell(value, record, 'campus'),
    },
    {
      title: '班主任姓名',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 120,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '线上宣传数量',
      children: [
        {
          title: '朋友圈数量',
          dataIndex: 'wechatMoments',
          key: 'wechatMoments',
          width: 100,
          align: 'center',
          render: (value, record) => renderEditableNumberCell(value, record, 'wechatMoments'),
        },
        {
          title: '抖音数量',
          dataIndex: 'douyin',
          key: 'douyin',
          width: 100,
          align: 'center',
          render: (value, record) => renderEditableNumberCell(value, record, 'douyin'),
        },
        {
          title: '快手数量',
          dataIndex: 'kuaishou',
          key: 'kuaishou',
          width: 100,
          align: 'center',
          render: (value, record) => renderEditableNumberCell(value, record, 'kuaishou'),
        },
        {
          title: '小红书数量',
          dataIndex: 'xiaohongshu',
          key: 'xiaohongshu',
          width: 110,
          align: 'center',
          render: (value, record) => renderEditableNumberCell(value, record, 'xiaohongshu'),
        },
        {
          title: '合计',
          dataIndex: 'onlineTotal',
          key: 'onlineTotal',
          width: 80,
          align: 'center',
          render: (value) => <strong>{value}</strong>,
        },
      ],
    },
    {
      title: '学生访谈数量',
      children: [
        {
          title: '在校生访谈',
          dataIndex: 'currentStudentInterview',
          key: 'currentStudentInterview',
          width: 110,
          align: 'center',
          render: (value, record) =>
            renderEditableNumberCell(value, record, 'currentStudentInterview'),
        },
        {
          title: '毕业生访谈',
          dataIndex: 'graduateInterview',
          key: 'graduateInterview',
          width: 110,
          align: 'center',
          render: (value, record) => renderEditableNumberCell(value, record, 'graduateInterview'),
        },
        {
          title: '家长访谈',
          dataIndex: 'parentInterview',
          key: 'parentInterview',
          width: 100,
          align: 'center',
          render: (value, record) => renderEditableNumberCell(value, record, 'parentInterview'),
        },
        {
          title: '合计',
          dataIndex: 'interviewTotal',
          key: 'interviewTotal',
          width: 80,
          align: 'center',
          render: (value) => <strong>{value}</strong>,
        },
      ],
    },
    {
      title: '活动数量',
      children: [
        {
          title: '活动次数',
          dataIndex: 'activityCount',
          key: 'activityCount',
          width: 100,
          align: 'center',
          render: (value, record) => renderEditableNumberCell(value, record, 'activityCount'),
        },
        {
          title: '比赛次数',
          dataIndex: 'competitionCount',
          key: 'competitionCount',
          width: 100,
          align: 'center',
          render: (value, record) => renderEditableNumberCell(value, record, 'competitionCount'),
        },
        {
          title: '送喜报人次',
          dataIndex: 'examRegistrationCount',
          key: 'examRegistrationCount',
          width: 110,
          align: 'center',
          render: (value, record) =>
            renderEditableNumberCell(value, record, 'examRegistrationCount'),
        },
        {
          title: '合计',
          dataIndex: 'activityTotal',
          key: 'activityTotal',
          width: 80,
          align: 'center',
          render: (value) => <strong>{value}</strong>,
        },
      ],
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'center',
      fixed: 'right',
      render: (_, record) => {
        if (record.rowType === 'total' || !editMode) {
          return null
        }
        return (
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteRow(record.key)}
          >
            删除
          </Button>
        )
      },
    },
  ]

  // 处理刷新
  const handleRefresh = () => {
    setLoading(true)
    message.success('数据已刷新')
    setLoading(false)
  }

  // 处理导出
  const handleExport = () => {
    message.info('导出功能开发中...')
  }

  // 处理保存
  const handleSave = () => {
    setEditMode(false)
    message.success('保存成功')
  }

  // 处理编辑模式切换
  const handleEditToggle = () => {
    setEditMode(!editMode)
  }

  // 处理神殿切换
  const handleCampusChange = (value: string) => {
    setSelectedCampus(value)
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Title level={4} style={{ margin: 0 }}>
            {selectedCampus || 'XX神殿'}教化司口碑招生关键点结果汇总表
          </Title>
        }
        extra={
          <Space>
            <Select
              style={{ width: 150 }}
              value={selectedCampus}
              onChange={handleCampusChange}
              placeholder="选择神殿"
            >
              {campuses.map((campus) => (
                <Option key={campus.id} value={campus.name}>
                  {campus.name}
                </Option>
              ))}
            </Select>
            <Select
              style={{ width: 120 }}
              value={selectedYear}
              onChange={(value) => setSelectedYear(value)}
            >
              <Option value={2023}>2023年</Option>
              <Option value={2024}>2024年</Option>
              <Option value={2025}>2025年</Option>
            </Select>
            <Select
              style={{ width: 100 }}
              value={selectedMonth}
              onChange={(value) => setSelectedMonth(value)}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <Option key={i + 1} value={i + 1}>
                  {i + 1}月
                </Option>
              ))}
            </Select>
            {editMode && (
              <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddRow}>
                添加
              </Button>
            )}
            {editMode ? (
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                保存
              </Button>
            ) : (
              <Button icon={<EditOutlined />} onClick={handleEditToggle}>
                编辑
              </Button>
            )}
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>
        }
      >
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={6}>
            <Card>
              <Statistic title="线上宣传总计" value={totalRow.onlineTotal} suffix="次" />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="学生访谈总计" value={totalRow.interviewTotal} suffix="次" />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="活动总计" value={totalRow.activityTotal} suffix="次" />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="参与教师数" value={dataSource.length} suffix="人" />
            </Card>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={fullDataSource}
          loading={loading}
          pagination={false}
          bordered
          scroll={{ x: 1800 }}
          size="small"
          rowKey="key"
          rowClassName={(record) => (record.rowType === 'total' ? 'total-row' : '')}
        />

        <style>{`
          .ant-table-cell {
            padding: 8px 4px !important;
            font-size: 12px;
          }
          .total-row {
            background-color: #f0f9ff !important;
            font-weight: bold;
          }
          .total-row td {
            background-color: #f0f9ff !important;
          }
        `}</style>
      </Card>
    </div>
  )
}

export default ReputationEnrollmentKeypointSummary
