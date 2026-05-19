/**
 * 学术->最高议事厅->神殿层级 师资配比表
 * 自动从神殿核心数据API获取数据并显示
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { App,
  Card,
  Table,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  InputNumber,
  Input,
  Spin,
} from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  PlusOutlined,
  SaveOutlined,
  TeamOutlined,
  UserOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import CampusSelector from '@/components/common/CampusSelector'
import { normalizeCampus } from '@/pages/academic/teaching-content/shared/campusStorage'
import { buildApiUrl } from '@/utils/apiBase'

const { Title, Text } = Typography

// 数据行类型（与神殿核心数据页面保持一致）
interface Row {
  key: string
  index: number | string
  isLatest?: boolean
  campus?: string
  statsTime?: string
  students?: number | string
  teacherRatio?: string
  targetTeachers?: number | string
  actualTeachers?: number | string
  teacherVacancy?: number | string
  teacherSurplus?: number | string
  cadreRatio?: string
  targetCadres?: number | string
  actualCadres?: number | string
  cadreVacancy?: number | string
  cadreSurplus?: number | string
}

// 构建空行数据
const buildEmptyRow = (campus: string, index: number): Row => ({
  key: `row-${Date.now()}-${index}`,
  index: index,
  campus: campus,
  statsTime: '',
  students: '',
  teacherRatio: '',
  targetTeachers: '',
  actualTeachers: '',
  teacherVacancy: '',
  teacherSurplus: '',
  cadreRatio: '',
  targetCadres: '',
  actualCadres: '',
  cadreVacancy: '',
  cadreSurplus: '',
})

// 解析统计时间用于排序
const parseStatsTime = (statsTime?: string): number => {
  if (!statsTime) return 0
  const match = statsTime.match(/(\d{4})[.\-年](\d{1,2})[.\-月]?(\d{1,2})?/)
  if (match) {
    const year = parseInt(match[1], 10)
    const month = parseInt(match[2], 10)
    const day = match[3] ? parseInt(match[3], 10) : 1
    return year * 10000 + month * 100 + day
  }
  return 0
}

// 计算最近统计行
const calculateLatestStats = (rows: Row[]): Row | null => {
  const validRows = rows.filter(row => !row.isLatest && row.statsTime)
  if (validRows.length === 0) return null

  const sortedRows = [...validRows].sort((a, b) => {
    const timeA = parseStatsTime(a.statsTime)
    const timeB = parseStatsTime(b.statsTime)
    return timeB - timeA
  })

  const latest = sortedRows[0]
  return {
    key: 'latest-stats',
    index: '最近统计',
    isLatest: true,
    campus: latest.campus || '',
    statsTime: latest.statsTime || '',
    students: latest.students || '',
    teacherRatio: latest.teacherRatio || '',
    targetTeachers: latest.targetTeachers || '',
    actualTeachers: latest.actualTeachers || '',
    teacherVacancy: latest.teacherVacancy || '',
    teacherSurplus: latest.teacherSurplus || '',
    cadreRatio: latest.cadreRatio || '',
    targetCadres: latest.targetCadres || '',
    actualCadres: latest.actualCadres || '',
    cadreVacancy: latest.cadreVacancy || '',
    cadreSurplus: latest.cadreSurplus || '',
  }
}

// 统计数据类型
interface Summary {
  totalRecords: number
  totalStudents: number
  totalTargetTeachers: number
  totalActualTeachers: number
  totalTeacherVacancy: number
  totalTeacherSurplus: number
  totalTargetCadres: number
  totalActualCadres: number
  totalCadreVacancy: number
  totalCadreSurplus: number
}

const FacultyRatioPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore()
  const resolvedCampus = normalizeCampus(currentCampus ?? getAllCampuses()[0]?.name ?? '主神殿')
  const campusLabel = resolvedCampus.replace(/神殿$/, '')

  const [year, setYear] = useState<number>(dayjs().year())
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 从后端获取数据
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        buildApiUrl(`/teacher-staffing-ratio?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`)
      )
      if (res.ok) {
        const list = await res.json()
        if (Array.isArray(list) && list.length > 0) {
          const record = list[0]
          const data = record?.['数据'] || record?.数据 || {}
          if (data.rows && Array.isArray(data.rows)) {
            const updatedRows = data.rows
              .filter((row: Row) => !row.isLatest)
              .map((row: Row, idx: number) => ({
                ...row,
                index: idx + 1,
                campus: row.campus || campusLabel,
              }))
            setRows(updatedRows)
            return
          }
        }
      }
      setRows([])
    } catch (error) {
      console.error('[师资配比] 加载数据失败:', error)
      message.error('加载数据失败')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [resolvedCampus, year, campusLabel])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 保存数据到后端
  const handleSave = async () => {
    setSaving(true)
    try {
      const rowsToSave = rows
        .filter(row => !row.isLatest)
        .map((row, idx) => ({
          ...row,
          index: idx + 1,
          campus: row.campus || campusLabel,
        }))

      const payload = {
        神殿: resolvedCampus,
        年份: year,
        数据: { rows: rowsToSave },
      }

      const res = await fetch(buildApiUrl('/teacher-staffing-ratio'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(await res.text())
      message.success('保存成功')
      setRows(rowsToSave)
    } catch (error) {
      console.error('[师资配比] 保存失败:', error)
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 添加新行
  const handleAddRow = () => {
    const newIndex = rows.filter(row => !row.isLatest).length + 1
    const newRow = buildEmptyRow(campusLabel, newIndex)
    setRows(prev => [...prev.filter(row => !row.isLatest), newRow])
  }

  // 删除行
  const handleDeleteRow = (rowKey: string) => {
    setRows(prev => {
      const filtered = prev.filter(row => row.key !== rowKey && !row.isLatest)
      return filtered.map((row, idx) => ({ ...row, index: idx + 1 }))
    })
  }

  // 单元格值变化
  const handleCellChange = (rowKey: string, field: keyof Row, value: string | number | null) => {
    setRows(prev =>
      prev.map(row => {
        if (row.key === rowKey) {
          return { ...row, [field]: value ?? '' }
        }
        return row
      })
    )
  }

  // 导出CSV
  const handleExport = () => {
    const headers = [
      '序号', '神殿', '统计时间', '学生人数',
      '目标师资配比', '目标老师数量', '实际老师数量', '老师空缺', '老师冗余',
      '目标干部配比', '目标干部数量', '实际干部数量', '干部空缺', '干部冗余',
    ]
    const csvRows = displayRows.map(row => [
      row.index,
      row.campus ?? '',
      row.statsTime ?? '',
      row.students ?? '',
      row.teacherRatio ?? '',
      row.targetTeachers ?? '',
      row.actualTeachers ?? '',
      row.teacherVacancy ?? '',
      row.teacherSurplus ?? '',
      row.cadreRatio ?? '',
      row.targetCadres ?? '',
      row.actualCadres ?? '',
      row.cadreVacancy ?? '',
      row.cadreSurplus ?? '',
    ])

    const csv = [headers, ...csvRows]
      .map(line => line.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${campusLabel}神殿智慧司师资配比表_${year}.csv`
    a.click()
    message.success('导出成功')
  }

  // 计算显示的数据（包含最近统计行）
  const displayRows = useMemo(() => {
    const latestStats = calculateLatestStats(rows)
    const dataRows = rows.filter(row => !row.isLatest)
    if (latestStats) {
      return [...dataRows, latestStats]
    }
    return dataRows
  }, [rows])

  // 计算统计数据
  const summary = useMemo<Summary>(() => {
    const dataRows = rows.filter(row => !row.isLatest)
    return {
      totalRecords: dataRows.length,
      totalStudents: dataRows.reduce((sum, row) => sum + (Number(row.students) || 0), 0),
      totalTargetTeachers: dataRows.reduce((sum, row) => sum + (Number(row.targetTeachers) || 0), 0),
      totalActualTeachers: dataRows.reduce((sum, row) => sum + (Number(row.actualTeachers) || 0), 0),
      totalTeacherVacancy: dataRows.reduce((sum, row) => sum + (Number(row.teacherVacancy) || 0), 0),
      totalTeacherSurplus: dataRows.reduce((sum, row) => sum + (Number(row.teacherSurplus) || 0), 0),
      totalTargetCadres: dataRows.reduce((sum, row) => sum + (Number(row.targetCadres) || 0), 0),
      totalActualCadres: dataRows.reduce((sum, row) => sum + (Number(row.actualCadres) || 0), 0),
      totalCadreVacancy: dataRows.reduce((sum, row) => sum + (Number(row.cadreVacancy) || 0), 0),
      totalCadreSurplus: dataRows.reduce((sum, row) => sum + (Number(row.cadreSurplus) || 0), 0),
    }
  }, [rows])

  // 表格列定义
  const columns: ColumnsType<Row> = [
    {
      title: '序号',
      dataIndex: 'index',
      width: 70,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      width: 100,
      align: 'center',
      render: (v, record) => {
        if (record.isLatest) return v
        return (
          <Input
            value={v as string}
            size="small"
            onChange={e => handleCellChange(record.key, 'campus', e.target.value)}
            style={{ width: '100%' }}
          />
        )
      },
    },
    {
      title: '统计时间',
      dataIndex: 'statsTime',
      width: 120,
      align: 'center',
      render: (v, record) => {
        if (record.isLatest) return v
        return (
          <Input
            value={v as string}
            placeholder="如2025.3.1"
            size="small"
            onChange={e => handleCellChange(record.key, 'statsTime', e.target.value)}
            style={{ width: '100%' }}
          />
        )
      },
    },
    {
      title: '学生人数',
      dataIndex: 'students',
      width: 100,
      align: 'center',
      render: (v, record) => {
        if (record.isLatest) return v
        return (
          <InputNumber
            value={v as number}
            min={0}
            size="small"
            onChange={val => handleCellChange(record.key, 'students', val)}
            style={{ width: '100%' }}
          />
        )
      },
    },
    {
      title: '教员职数分析',
      children: [
        {
          title: '目标师资配比',
          dataIndex: 'teacherRatio',
          width: 110,
          align: 'center',
          render: (v, record) => {
            if (record.isLatest) return v
            return (
              <Input
                value={v as string}
                placeholder="如1:30"
                size="small"
                onChange={e => handleCellChange(record.key, 'teacherRatio', e.target.value)}
                style={{ width: '100%' }}
              />
            )
          },
        },
        {
          title: '目标老师数量',
          dataIndex: 'targetTeachers',
          width: 110,
          align: 'center',
          render: (v, record) => {
            if (record.isLatest) return v
            return (
              <InputNumber
                value={v as number}
                min={0}
                size="small"
                onChange={val => handleCellChange(record.key, 'targetTeachers', val)}
                style={{ width: '100%' }}
              />
            )
          },
        },
        {
          title: '实际老师数量',
          dataIndex: 'actualTeachers',
          width: 110,
          align: 'center',
          render: (v, record) => {
            if (record.isLatest) return v
            return (
              <InputNumber
                value={v as number}
                min={0}
                size="small"
                onChange={val => handleCellChange(record.key, 'actualTeachers', val)}
                style={{ width: '100%' }}
              />
            )
          },
        },
        {
          title: '老师空缺',
          dataIndex: 'teacherVacancy',
          width: 90,
          align: 'center',
          render: (v, record) => {
            if (record.isLatest) {
              const val = Number(v) || 0
              return val > 0 ? <Tag color="red">{val}</Tag> : '-'
            }
            return (
              <InputNumber
                value={v as number}
                min={0}
                size="small"
                onChange={val => handleCellChange(record.key, 'teacherVacancy', val)}
                style={{ width: '100%' }}
              />
            )
          },
        },
        {
          title: '老师冗余',
          dataIndex: 'teacherSurplus',
          width: 90,
          align: 'center',
          render: (v, record) => {
            if (record.isLatest) {
              const val = Number(v) || 0
              return val > 0 ? <Tag color="orange">{val}</Tag> : '-'
            }
            return (
              <InputNumber
                value={v as number}
                min={0}
                size="small"
                onChange={val => handleCellChange(record.key, 'teacherSurplus', val)}
                style={{ width: '100%' }}
              />
            )
          },
        },
      ],
    },
    {
      title: '干部职数分析',
      children: [
        {
          title: '目标干部配比',
          dataIndex: 'cadreRatio',
          width: 110,
          align: 'center',
          render: (v, record) => {
            if (record.isLatest) return v
            return (
              <Input
                value={v as string}
                placeholder="如1:3"
                size="small"
                onChange={e => handleCellChange(record.key, 'cadreRatio', e.target.value)}
                style={{ width: '100%' }}
              />
            )
          },
        },
        {
          title: '目标干部数量',
          dataIndex: 'targetCadres',
          width: 110,
          align: 'center',
          render: (v, record) => {
            if (record.isLatest) return v
            return (
              <InputNumber
                value={v as number}
                min={0}
                size="small"
                onChange={val => handleCellChange(record.key, 'targetCadres', val)}
                style={{ width: '100%' }}
              />
            )
          },
        },
        {
          title: '实际干部数量',
          dataIndex: 'actualCadres',
          width: 110,
          align: 'center',
          render: (v, record) => {
            if (record.isLatest) return v
            return (
              <InputNumber
                value={v as number}
                min={0}
                size="small"
                onChange={val => handleCellChange(record.key, 'actualCadres', val)}
                style={{ width: '100%' }}
              />
            )
          },
        },
        {
          title: '干部空缺',
          dataIndex: 'cadreVacancy',
          width: 90,
          align: 'center',
          render: (v, record) => {
            if (record.isLatest) {
              const val = Number(v) || 0
              return val > 0 ? <Tag color="red">{val}</Tag> : '-'
            }
            return (
              <InputNumber
                value={v as number}
                min={0}
                size="small"
                onChange={val => handleCellChange(record.key, 'cadreVacancy', val)}
                style={{ width: '100%' }}
              />
            )
          },
        },
        {
          title: '干部冗余',
          dataIndex: 'cadreSurplus',
          width: 90,
          align: 'center',
          render: (v, record) => {
            if (record.isLatest) {
              const val = Number(v) || 0
              return val > 0 ? <Tag color="orange">{val}</Tag> : '-'
            }
            return (
              <InputNumber
                value={v as number}
                min={0}
                size="small"
                onChange={val => handleCellChange(record.key, 'cadreSurplus', val)}
                style={{ width: '100%' }}
              />
            )
          },
        },
      ],
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_, record) => {
        if (record.isLatest) return null
        return (
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDeleteRow(record.key)}
          />
        )
      },
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <style>{`
        .teacher-staffing-title-bar {
          background-color: #ffd700;
          padding: 16px 24px;
          margin: -24px -24px 24px -24px;
          text-align: center;
          border-bottom: 2px solid #d4af37;
        }
        .teacher-staffing-title-bar .ant-typography {
          margin: 0;
          color: #000;
          font-weight: bold;
        }
        .teacher-staffing-table .ant-table-thead > tr > th {
          background-color: #52c41a !important;
          color: #fff !important;
          font-weight: bold;
          text-align: center;
          border: 1px solid #389e0d;
        }
        .teacher-staffing-table .ant-table-thead > tr > th[colspan] {
          background-color: #52c41a !important;
        }
        .teacher-staffing-table .ant-table {
          border: 1px solid #d9d9d9;
        }
        .teacher-staffing-table .ant-table-tbody > tr > td {
          border: 1px solid #d9d9d9;
        }
      `}</style>

      <div className="teacher-staffing-title-bar">
        <Title level={2} style={{ color: '#000', margin: 0 }}>
          {campusLabel}神殿智慧司师资配比表
        </Title>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 16 }}>
        <Space>
          <span>年份</span>
          <InputNumber
            min={2000}
            max={2100}
            value={year}
            onChange={v => setYear(Number(v || dayjs().year()))}
            style={{ width: 100 }}
          />
        </Space>
        <CampusSelector showLabel />
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic title="总记录数" value={summary.totalRecords} prefix={<ReloadOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic title="总学生人数" value={summary.totalStudents} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="教员空缺总数"
              value={summary.totalTeacherVacancy}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="干部空缺总数"
              value={summary.totalCadreVacancy}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作按钮 */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
            保存数据
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            刷新数据
          </Button>
          <Button icon={<PlusOutlined />} onClick={handleAddRow}>
            添加行
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出CSV
          </Button>
        </Space>
      </div>

      <Card>
        <Spin spinning={loading}>
          <Table
            className="teacher-staffing-table"
            columns={columns}
            dataSource={displayRows}
            rowKey="key"
            scroll={{ x: 1600 }}
            bordered
            size="small"
            pagination={false}
          />
        </Spin>
      </Card>
    </div>
  )
}

export default FacultyRatioPage
