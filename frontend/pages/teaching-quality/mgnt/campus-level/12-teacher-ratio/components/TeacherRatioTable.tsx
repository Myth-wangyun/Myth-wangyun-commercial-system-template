/**
 * 神殿教化司师资配比表组件
 */

import React from 'react'
import { App, Card, Table, Button, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined, EditOutlined, TeamOutlined, SaveOutlined } from '@ant-design/icons'
import type { TeacherRatioTableProps, TeacherRatioRecord } from '@/types/teacher-ratio'
import { teacherRatioService } from '@/services/teaching-quality/teacherRatio'

const TeacherRatioTable: React.FC<TeacherRatioTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
  onEdit,
}) => {
  const { message } = App.useApp()
  const [saving, setSaving] = React.useState(false)

  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob = await teacherRatioService.exportTeacherRatioData(campus)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${campus}教化司师资配比表.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  const handleSaveAll = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }
    try {
      setSaving(true)
      const year = new Date().getFullYear()
      const rows = (data || []).filter((r) => !r.isTotal && Number(r.month) >= 1 && Number(r.month) <= 12)
      for (const r of rows) {
        await teacherRatioService.saveTeacherRatioItem(campus, year, Number(r.month), {
          studentTotal: r.studentTotal,
          targetStudentTeacherRatio: r.targetStudentTeacherRatio,
          targetTeacherCount: r.targetTeacherCount,
          actualTeacherCount: r.actualTeacherCount,
          headmasterVacancy: r.headmasterVacancy,
          headmasterRedundancy: r.headmasterRedundancy,
          targetMiddleManagementRatio: r.targetMiddleManagementRatio,
          targetMiddleManagementCount: r.targetMiddleManagementCount,
          actualMiddleManagementCount: r.actualMiddleManagementCount,
          middleManagementVacancy: r.middleManagementVacancy,
          middleManagementRedundancy: r.middleManagementRedundancy,
        })
      }
      message.success(`保存成功（${rows.length} 条）`)
      onRefresh?.()
    } catch (e) {
      console.error(e)
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<TeacherRatioRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      fixed: 'left',
      align: 'center',
      render: (value, record, index) => {
        const isTotal = record.isTotal || index === data.length - 1
        return isTotal ? (
          <span style={{ color: 'red', fontWeight: 'bold' }}>合计/平均</span>
        ) : (
          value
        )
      },
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      align: 'center',
      render: (value, record, index) => {
        // 只有第一行显示神殿；合计行不显示
        if (index === 0) return value
        return ''
      },
    },
    {
      title: '学生总人数',
      dataIndex: 'studentTotal',
      key: 'studentTotal',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        const isTotal = record.isTotal || index === data.length - 1
        return isTotal ? <span style={{ fontWeight: 'bold' }}>{value}</span> : value
      },
    },
    {
      title: '职数分析',
      key: 'positionAnalysis',
      align: 'center',
      children: [
        {
          title: '目标师生配比',
          dataIndex: 'targetStudentTeacherRatio',
          key: 'targetStudentTeacherRatio',
          width: 120,
          align: 'center',
          render: (value, record, index) => (record.isTotal || index === data.length - 1 ? '' : value),
        },
        {
          title: '目标老师总数',
          dataIndex: 'targetTeacherCount',
          key: 'targetTeacherCount',
          width: 120,
          align: 'center',
          render: (value, record, index) => {
            const isTotal = record.isTotal || index === data.length - 1
            return isTotal ? <span style={{ fontWeight: 'bold' }}>{value}</span> : value
          },
        },
        {
          title: '实际老师数量',
          dataIndex: 'actualTeacherCount',
          key: 'actualTeacherCount',
          width: 120,
          align: 'center',
          render: (value, record, index) => {
            const isTotal = record.isTotal || index === data.length - 1
            return isTotal ? <span style={{ fontWeight: 'bold' }}>{value}</span> : value
          },
        },
        {
          title: '班主任空缺职数',
          dataIndex: 'headmasterVacancy',
          key: 'headmasterVacancy',
          width: 130,
          align: 'center',
          render: (value: number, record, index) => {
            const isTotal = record.isTotal || index === data.length - 1
            const color = value > 0 ? '#ff4d4f' : '#52c41a'
            return <span style={{ color, fontWeight: isTotal ? 'bold' : undefined }}>{value}</span>
          },
        },
        {
          title: '班主任冗余职数',
          dataIndex: 'headmasterRedundancy',
          key: 'headmasterRedundancy',
          width: 130,
          align: 'center',
          render: (value: number, record, index) => {
            const isTotal = record.isTotal || index === data.length - 1
            const color = value > 0 ? '#faad14' : '#52c41a'
            return <span style={{ color, fontWeight: isTotal ? 'bold' : undefined }}>{value}</span>
          },
        },
      ],
    },
    {
      title: '干部职数分析',
      key: 'cadrePositionAnalysis',
      align: 'center',
      children: [
        {
          title: '目标中层与班主任配比',
          dataIndex: 'targetMiddleManagementRatio',
          key: 'targetMiddleManagementRatio',
          width: 180,
          align: 'center',
          render: (value, record, index) => (record.isTotal || index === data.length - 1 ? '' : value),
        },
        {
          title: '目标中层人数',
          dataIndex: 'targetMiddleManagementCount',
          key: 'targetMiddleManagementCount',
          width: 130,
          align: 'center',
          render: (value, record, index) => {
            const isTotal = record.isTotal || index === data.length - 1
            return isTotal ? <span style={{ fontWeight: 'bold' }}>{value}</span> : value
          },
        },
        {
          title: '实际中层人数',
          dataIndex: 'actualMiddleManagementCount',
          key: 'actualMiddleManagementCount',
          width: 130,
          align: 'center',
          render: (value, record, index) => {
            const isTotal = record.isTotal || index === data.length - 1
            return isTotal ? <span style={{ fontWeight: 'bold' }}>{value}</span> : value
          },
        },
        {
          title: '中层空缺职数',
          dataIndex: 'middleManagementVacancy',
          key: 'middleManagementVacancy',
          width: 120,
          align: 'center',
          render: (value: number, record, index) => {
            const isTotal = record.isTotal || index === data.length - 1
            const color = value > 0 ? '#ff4d4f' : '#52c41a'
            return <span style={{ color, fontWeight: isTotal ? 'bold' : undefined }}>{value}</span>
          },
        },
        {
          title: '中层冗余职数',
          dataIndex: 'middleManagementRedundancy',
          key: 'middleManagementRedundancy',
          width: 120,
          align: 'center',
          render: (value: number, record, index) => {
            const isTotal = record.isTotal || index === data.length - 1
            const color = value > 0 ? '#faad14' : '#52c41a'
            return <span style={{ color, fontWeight: isTotal ? 'bold' : undefined }}>{value}</span>
          },
        },
      ],
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record, index) => {
        if (record.isTotal || index === data.length - 1) return null
        return (
          <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)} size="small">
            编辑
          </Button>
        )
      },
    },
  ]

  return (
    <Card
      title={
        <span>
          <TeamOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          {campus || '请选择神殿'}教化司师资配比表
        </span>
      }
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
            刷新
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveAll}
            disabled={!campus || data.length === 0}
            loading={saving}
          >
            保存
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            disabled={!campus || data.length === 0}
          >
            导出
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
        bordered
        scroll={{ x: 1820 }}
        rowKey="id"
        size="small"
      />
    </Card>
  )
}

export default TeacherRatioTable
