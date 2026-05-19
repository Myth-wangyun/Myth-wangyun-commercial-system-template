//学术->神殿->神殿智慧司核心数据汇总表
import React, { useState, useEffect, useCallback } from 'react'
import { App, Card, Table, Button, Space, Typography, DatePicker } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import CampusSelector from '@/components/common/CampusSelector'
import { normalizeCampus } from '@/pages/academic/teaching-content/shared/campusStorage'
import { buildApiUrl } from '@/utils/apiBase'
import { EmploymentSummaryService } from '../2-employment-summary/service'

const { Title, Text } = Typography

// 数据记录类型定义
interface CampusAcademicCoreDataRecord {
  key: string
  serialNumber: number // 序号
  campus: string // 神殿
  totalStudents: number // 在校生人数
  totalClasses: number // 班级数量
  academicDeptStaff: number // 智慧司人数
  cadreCount: number // 干部人数
  employeeCount: number // 员工人数
  employmentClassCount: number // 就业班级数量
  graduateCount: number // 毕业生人数
  employmentRate: number // 就业率 (0-1)
  averageEmploymentSalary: number // 就业薪资 (平均)
  salaryOverTenThousandCount: number // 薪资过万人数
  reputationEnrollmentCount: number // 口碑招生人数
  reputationEnrollmentRevenue: number // 口碑招生收入
  newStudentEnrollmentCount: number // 新生入学人数
  newStudentLossCount: number // 新生流失人数
}

// 构建初始数据
const buildInitialData = (campus: string): CampusAcademicCoreDataRecord[] => [
  {
    key: `${campus}-1`,
    serialNumber: 1,
    campus: campus,
    totalStudents: 0,
    totalClasses: 0,
    academicDeptStaff: 0,
    cadreCount: 0,
    employeeCount: 0,
    employmentClassCount: 0,
    graduateCount: 0,
    employmentRate: 0,
    averageEmploymentSalary: 0,
    salaryOverTenThousandCount: 0,
    reputationEnrollmentCount: 0,
    reputationEnrollmentRevenue: 0,
    newStudentEnrollmentCount: 0,
    newStudentLossCount: 0,
  },
]

const CampusAcademicCoreDataSummaryPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore()
  const resolvedCampus = normalizeCampus(currentCampus ?? getAllCampuses()[0]?.name ?? '主神殿')
  const [year, setYear] = useState<number>(dayjs().year())
  const [data, setData] = useState<CampusAcademicCoreDataRecord[]>(() => buildInitialData(resolvedCampus))
  const [loading, setLoading] = useState(false)

  // 从后端获取数据并自动填充
  const fetchDataFromBackend = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        buildApiUrl(`/campus-core-data-summary/?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`)
      )
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const backendData = await res.json()
      
      // 更新数据：直接使用后端返回的数据，前端不再进行计算
      setData([
        {
          key: `${resolvedCampus}-1`,
          serialNumber: 1,
          campus: resolvedCampus,
          totalStudents: backendData.在校生人数 || 0,
          totalClasses: backendData.班级数量 || 0,
          academicDeptStaff: backendData.智慧司人数 || 0,
          cadreCount: backendData.干部人数 || 0,
          employeeCount: backendData.员工人数 || 0,
          employmentClassCount: backendData.就业班级数量 || 0,
          graduateCount: backendData.毕业生人数 || 0, // 直接使用后端计算好的“毕业生人数”（即实际就业人数）
          employmentRate: backendData.就业率 || 0,
          averageEmploymentSalary: backendData.就业薪资 || 0,
          salaryOverTenThousandCount: backendData.薪资过万人数 || 0,
          reputationEnrollmentCount: backendData.口碑招生人数 || 0,
          reputationEnrollmentRevenue: backendData.口碑招生收入 || 0,
          newStudentEnrollmentCount: backendData.新生入学人数 || 0,
          newStudentLossCount: backendData.新生流失人数 || 0,
        },
      ])
      
      message.success('数据已自动获取并填充')
    } catch (error) {
      console.error('[核心数据汇总] 获取数据失败:', error)
      message.error('获取数据失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [resolvedCampus, year])

  // 当神殿或年份变化时，自动获取数据
  useEffect(() => {
    fetchDataFromBackend()
  }, [fetchDataFromBackend])

  const handleRefresh = () => {
    fetchDataFromBackend()
  }

  const handleExport = () => {
    try {
      const header = [
        '序号',
        '神殿',
        '在校生人数',
        '班级数量',
        '智慧司人数',
        '干部人数',
        '员工人数',
        '就业班级数量',
        '毕业生人数',
        '就业率',
        '就业薪资',
        '薪资过万人数',
        '口碑招生人数',
        '口碑招生收入',
        '新生入学人数',
        '新生流失人数',
      ]
      const rows = data.map((r) => [
        r.serialNumber,
        r.campus,
        r.totalStudents,
        r.totalClasses,
        r.academicDeptStaff,
        r.cadreCount,
        r.employeeCount,
        r.employmentClassCount,
        r.graduateCount,
        (r.employmentRate * 100).toFixed(2) + '%',
        r.averageEmploymentSalary,
        r.salaryOverTenThousandCount,
        r.reputationEnrollmentCount,
        r.reputationEnrollmentRevenue,
        r.newStudentEnrollmentCount,
        r.newStudentLossCount,
      ])
      const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${resolvedCampus}神殿智慧司核心数据汇总表.csv`
      a.click()
      URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (e) {
      message.error('导出失败')
    }
  }

  const columns = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 70,
      align: 'center' as const,
    },
    { title: '神殿', dataIndex: 'campus', key: 'campus', width: 90, align: 'center' as const },
    {
      title: '在校生人数',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
      width: 110,
      align: 'center' as const,
    },
    {
      title: '班级数量',
      dataIndex: 'totalClasses',
      key: 'totalClasses',
      width: 90,
      align: 'center' as const,
    },
    {
      title: '智慧司人数',
      dataIndex: 'academicDeptStaff',
      key: 'academicDeptStaff',
      width: 110,
      align: 'center' as const,
    },
    {
      title: '干部人数',
      dataIndex: 'cadreCount',
      key: 'cadreCount',
      width: 90,
      align: 'center' as const,
    },
    {
      title: '员工人数',
      dataIndex: 'employeeCount',
      key: 'employeeCount',
      width: 90,
      align: 'center' as const,
    },
    {
      title: '就业班级数量',
      dataIndex: 'employmentClassCount',
      key: 'employmentClassCount',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '毕业生人数',
      dataIndex: 'graduateCount',
      key: 'graduateCount',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '就业率',
      dataIndex: 'employmentRate',
      key: 'employmentRate',
      width: 90,
      align: 'center' as const,
      render: (v: number) => (v * 100).toFixed(2) + '%',
    },
    {
      title: '就业薪资',
      dataIndex: 'averageEmploymentSalary',
      key: 'averageEmploymentSalary',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '薪资过万人数',
      dataIndex: 'salaryOverTenThousandCount',
      key: 'salaryOverTenThousandCount',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '口碑招生人数',
      dataIndex: 'reputationEnrollmentCount',
      key: 'reputationEnrollmentCount',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '口碑招生收入',
      dataIndex: 'reputationEnrollmentRevenue',
      key: 'reputationEnrollmentRevenue',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '新生入学人数',
      dataIndex: 'newStudentEnrollmentCount',
      key: 'newStudentEnrollmentCount',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '新生流失人数',
      dataIndex: 'newStudentLossCount',
      key: 'newStudentLossCount',
      width: 120,
      align: 'center' as const,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={2}>
          {resolvedCampus}智慧司核心数据汇总表
        </Title>
        <Text type="secondary">数据自动从后端获取并填充</Text>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <CampusSelector useGlobalState showLabel />
        <Space>
          <span>年份</span>
          <DatePicker
            picker="year"
            value={dayjs().year(year)}
            onChange={(d) => setYear(d ? d.year() : year)}
          />
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
            刷新
          </Button>
          <Button onClick={handleExport}>导出 CSV</Button>
        </Space>
      </div>

      <Card variant="outlined">
        <Table
          size="small"
          rowKey="key"
          loading={loading}
          dataSource={data}
          columns={columns}
          pagination={false}
          scroll={{ x: 1600 }}
        />
      </Card>
    </div>
  )
}

export default CampusAcademicCoreDataSummaryPage
