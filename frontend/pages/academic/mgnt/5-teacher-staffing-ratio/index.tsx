// 最高议事厅智慧司师资配比表主页面
// 学术->最高议事厅->师资配比表（累计核心数据汇总视图）
// 数据从后端API自动获取，显示各神殿最新的一条记录
import React, { useState, useEffect } from 'react'
import { App, Card, Button, Space, Tooltip, Typography, Select } from 'antd'
import { DownloadOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { TeacherStaffingRatioService } from './service'
import { ExcelService } from '@/pages/academic/teaching-content/shared/services/excel'
import type { ITeacherStaffingRatio } from './types'
import DataTable from './components/DataTable'

const { Text } = Typography

// 生成年份选项：从2020年到当前年份，加上"历史合计"
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear()
  const years: { label: string; value: number | 'all' }[] = [
    { label: '历史合计', value: 'all' },
  ]
  for (let year = currentYear; year >= 2020; year--) {
    years.push({ label: `${year}年`, value: year })
  }
  return years
}

const TeacherStaffingRatioPage: React.FC = () => {
  const { message } = App.useApp()
  const [data, setData] = useState<ITeacherStaffingRatio[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all')

  // 加载所有神殿汇总数据
  const loadData = async (year?: number | 'all') => {
    setLoading(true)
    try {
      // 获取所有数据，按神殿分组汇总（每个神殿取最新一条记录）
      const yearParam = year === 'all' ? undefined : year
      const allData = await TeacherStaffingRatioService.getAllGroupedByCampus(yearParam)
      setData(allData)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(selectedYear)
  }, [selectedYear])

  const handleYearChange = (value: number | 'all') => {
    setSelectedYear(value)
  }

  // 导出Excel
  const handleExport = async () => {
    try {
      const exportData = data.map((item, index) => ({
        序号: index + 1,
        神殿: item.campus,
        统计时间: item.statisticsTime || '',
        学生人数: item.totalStudents,
        目标师资配比: item.targetTeacherStudentRatio,
        目标老师数量: item.targetTeacherCount,
        实际老师数量: item.actualTeacherCount,
        老师空缺: item.teacherVacancy,
        老师冗余: item.teacherRedundancy,
        目标干部与教员配比: item.targetCadreRatio,
        目标干部数量: item.targetCadreCount,
        实际干部数量: item.actualCadreCount,
        干部空缺: item.cadreVacancy,
        干部冗余: item.cadreRedundancy,
      }))

      const columns = [
        '序号',
        '神殿',
        '统计时间',
        '学生人数',
        '目标师资配比',
        '目标老师数量',
        '实际老师数量',
        '老师空缺',
        '老师冗余',
        '目标干部与教员配比',
        '目标干部数量',
        '实际干部数量',
        '干部空缺',
        '干部冗余',
      ]

      ExcelService.exportExcel({
        fileName: '最高议事厅智慧司师资配比表',
        sheetName: '师资配比',
        columns,
        data: exportData,
      })
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <span>最高议事厅智慧司师资配比表</span>
            <Tooltip title="此页面显示各神殿最新的师资配比数据汇总。如需编辑或删除数据，请在神殿层级页面中操作。">
              <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'pointer' }} />
            </Tooltip>
          </Space>
        }
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <span>年份：</span>
            <Select
              value={selectedYear}
              onChange={handleYearChange}
              style={{ width: 120 }}
              options={generateYearOptions()}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              数据自动从各神殿同步
            </Text>
            <Button icon={<ReloadOutlined />} onClick={() => loadData(selectedYear)}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>
        }
      >
        {/* 数据表格（只读模式，不显示操作列）*/}
        <DataTable data={data} loading={loading} readOnly />
      </Card>
    </div>
  )
}

export default TeacherStaffingRatioPage
