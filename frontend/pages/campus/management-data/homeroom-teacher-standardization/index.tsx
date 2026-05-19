/**
 * 神殿教化司班主任标准化检查表页面
 */

import React, { useState, useMemo } from 'react'
import { App, Card, Table, Button, Space, Select, Checkbox } from 'antd'
import { ReloadOutlined, DownloadOutlined, CheckCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'

const { Option } = Select

// 项目列表
const projectItems = [
  '日工单',
  '检查出勤',
  '课前五分钟',
  '检查卫生',
  '检查违规',
  '千分制',
  '巡班',
  '检查职业装',
  '搜集宣传素材',
  '学员访谈',
  '家长访谈',
  '催费',
  '日提升',
  '了解作业情况',
  '监督上自习(晚自习)',
  '送住宿',
  '查宿舍',
  '班会',
  '班委会',
  '常规听课',
  '素质训练课',
  '组织小班辅导',
  '监督学习小组',
  '(口碑)班级活动',
  '主题班会',
  '考试',
  '开新班',
  '做月总结计划',
  '提交预算',
  '帮助其他班主任盯班',
  '硬件设施保管(笔记本,椅子)',
  '收手机',
  '特殊学员书面申请',
  '放假前后通知',
  '开学第一课',
  '毕业典礼',
  '班级情况交接',
]

// 班主任标准化检查记录接口
interface StandardizationRecord {
  key: string
  serialNumber: number // 序号
  project: string // 项目
  days: {
    [day: number]: boolean // 日期对应的完成状态
  }
}

const CampusHomeroomTeacherStandardizationPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const campuses = getAllCampuses()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')

  // 初始化数据源函数
  const createInitialDataSource = (): StandardizationRecord[] => {
    return projectItems.map((project, index) => {
      const days: { [day: number]: boolean } = {}
      for (let day = 1; day <= 31; day++) {
        days[day] = false
      }
      return {
        key: `${index + 1}`,
        serialNumber: index + 1,
        project,
        days,
      }
    })
  }

  const [dataSource, setDataSource] = useState<StandardizationRecord[]>(createInitialDataSource)

  // 生成日期列
  const dateColumns = useMemo(() => {
    const days = Array.from({ length: 31 }, (_, i) => i + 1)

    return days.map((day) => ({
      title: day.toString(),
      key: `day-${day}`,
      width: 60,
      align: 'center' as const,
      render: (_: any, record: StandardizationRecord) => {
        const isChecked = record.days[day] || false
        return (
          <Checkbox
            checked={isChecked}
            onChange={(e) => {
              const newDataSource = [...dataSource]
              const index = newDataSource.findIndex((item) => item.key === record.key)
              if (index !== -1) {
                newDataSource[index].days[day] = e.target.checked
                setDataSource(newDataSource)
              }
            }}
          />
        )
      },
    }))
  }, [dataSource])

  // 定义表格列
  const columns: ColumnsType<StandardizationRecord> = useMemo(() => {
    const baseColumns: ColumnsType<StandardizationRecord> = [
      {
        title: '序号',
        dataIndex: 'serialNumber',
        key: 'serialNumber',
        width: 80,
        align: 'center',
        fixed: 'left',
        render: (value) => value,
      },
      {
        title: '项目',
        dataIndex: 'project',
        key: 'project',
        width: 200,
        align: 'left',
        fixed: 'left',
        render: (value) => value,
      },
      {
        title: '日期',
        key: 'date',
        align: 'center' as const,
        children: dateColumns,
      },
    ]
    return baseColumns
  }, [dateColumns])

  // 刷新数据
  const handleRefresh = () => {
    setDataSource(createInitialDataSource())
    message.success('数据已刷新')
  }

  // 导出数据
  const handleExport = () => {
    message.info('导出功能开发中...')
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
        <CheckCircleOutlined style={{ marginRight: 8 }} />
        班主任标准化检查表
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
                const { children, ...restProps } = props
                const mergedProps = {
                  ...restProps,
                  style: {
                    ...props.style,
                    ...headerCellStyle,
                  },
                }
                return <th {...mergedProps}>{children}</th>
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
          .ant-table-thead > tr:last-child > th {
            background-color: #d4edda !important;
          }
        `}</style>
      </Card>
    </div>
  )
}

export default CampusHomeroomTeacherStandardizationPage
