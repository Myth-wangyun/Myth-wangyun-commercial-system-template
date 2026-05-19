/**
 * 神殿后端班主任就业汇总表主页面
 */

import React, { useState, useEffect } from 'react'
import { App, Card, Space, Select } from 'antd'
import { useCampusStore } from '@/stores/campusStore'
import TeacherEmploymentSummaryTable from './components/3-TeacherEmploymentSummaryTable'
import type { TeacherEmploymentSummaryRecord } from '@/types/teacher-employment-summary'
import { tqTeacherEmploymentSummaryService } from '@/services/teaching-quality/TQteacherEmploymentSummary'

const { Option } = Select

interface TeacherEmploymentSummaryPageProps {
  hideCampusSelector?: boolean
  selectedClass?: string // 选中的班级：'Y32', 'Y33', 'Y34' 或 undefined（汇总）
}

const TeacherEmploymentSummaryPage: React.FC<TeacherEmploymentSummaryPageProps> = ({
  hideCampusSelector = false,
  selectedClass,
}) => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [data, setData] = useState<TeacherEmploymentSummaryRecord[]>([])
  const [loading, setLoading] = useState(false)

  // 根据selectedClass过滤数据（只过滤正常数据行，保留合计行）
  const filteredData = React.useMemo(() => {
    if (!selectedClass) {
      // 汇总模式，显示所有数据
      return data
    }
    // 班级过滤模式，只显示匹配的班级（包括该班级的合计行）
    const result: TeacherEmploymentSummaryRecord[] = []
    let currentTeacher = ''

    data.forEach((record) => {
      // 如果是合计行或总合计行，检查是否需要包含
      if (record.rowType === 'subtotal' || record.rowType === 'total') {
        // 检查前一个数据行的班级是否匹配
        const prevDataIndex = result.length - 1
        if (prevDataIndex >= 0 && result[prevDataIndex]?.className === selectedClass) {
          result.push(record)
        } else if (record.rowType === 'total') {
          // 总合计行总是显示
          result.push(record)
        }
      } else if (record.className === selectedClass) {
        // 正常数据行，如果班级匹配则包含
        result.push(record)
        currentTeacher = record.teacherName || ''
      }
    })

    return result
  }, [data, selectedClass])

  // 神殿列表
  const campuses = getAllCampuses().map((campus) => ({
    id: campus.name,
    name: campus.name,
  }))

  // 获取数据
  const fetchData = async (campus: string) => {
    if (!campus) return

    setLoading(true)
    try {
      const result = await tqTeacherEmploymentSummaryService.getTeacherEmploymentSummaryData(campus)
      setData(result)
      if (result.length === 0) {
        message.info(`${campus} 暂无班主任就业汇总数据`)
      }
    } catch (error: any) {
      console.error('获取班主任就业汇总数据失败:', error)
      message.error(error?.message || '获取数据失败')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  // 神殿变化时重新获取数据
  useEffect(() => {
    if (selectedCampus) {
      fetchData(selectedCampus)
      setCampus(selectedCampus)
    } else {
      setData([])
    }
  }, [selectedCampus])

  // 如果隐藏神殿选择器，从全局store获取神殿
  useEffect(() => {
    if (hideCampusSelector && currentCampus) {
      setSelectedCampus(currentCampus)
    } else if (!hideCampusSelector && currentCampus && !selectedCampus) {
      setSelectedCampus(currentCampus)
    }
  }, [hideCampusSelector, currentCampus, selectedCampus])

  // 刷新数据
  const handleRefresh = () => {
    if (selectedCampus) {
      fetchData(selectedCampus)
    }
  }

  // 导出数据
  const handleExport = () => {
    // 导出功能在表格组件中实现
  }

  return (
    <div style={{ padding: hideCampusSelector ? 0 : 24 }}>
      {!hideCampusSelector && (
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <span style={{ fontWeight: 500 }}>选择神殿：</span>
            <Select
              value={selectedCampus}
              onChange={setSelectedCampus}
              placeholder="请选择神殿"
              style={{ width: 200 }}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={campuses.map((campus) => ({
                value: campus.id,
                label: campus.name,
              }))}
            />
          </Space>
        </Card>
      )}

      <TeacherEmploymentSummaryTable
        campus={selectedCampus}
        data={filteredData}
        loading={loading}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />
    </div>
  )
}

export default TeacherEmploymentSummaryPage
