/**
 * 神殿后端学员就业目标与结果汇总表主页面
 */

import React, { useState, useEffect, useMemo } from 'react'
import { App, Card, Space, Select } from 'antd'
import { useCampusStore } from '@/stores/campusStore'
import CoreDataTabs from '../../../../../components/common/CoreDataTabs'
import CampusEmploymentGoalsResultsTable from './components/CampusEmploymentGoalsResultsTable'
import CampusEmploymentGoalsResultsEditModal from './components/CampusEmploymentGoalsResultsEditModal'
import type { CampusEmploymentGoalsResultsRecord } from '@/types/campus-employment-goals-results'
import { campusEmploymentGoalsResultsService } from '@/services/campusEmploymentGoalsResults'


interface EmploymentGoalsResultsPageProps {
  hideCampusSelector?: boolean
}

const EmploymentGoalsResultsPage: React.FC<EmploymentGoalsResultsPageProps> = ({
  hideCampusSelector = false,
}) => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  // 初始化：如果隐藏选择器，直接使用 currentCampus，否则使用 currentCampus 或空字符串
  const [selectedCampus, setSelectedCampus] = useState<string>(
    hideCampusSelector ? currentCampus || '' : currentCampus || '',
  )
  const [data, setData] = useState<CampusEmploymentGoalsResultsRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CampusEmploymentGoalsResultsRecord | null>(
    null,
  )

  // 神殿列表
  const campuses = getAllCampuses().map((campus) => ({
    id: campus.name.replace('神殿', ''),
    name: campus.name,
  }))

  // 获取数据
  const fetchData = async (campus: string) => {
    if (!campus) {
      return
    }

    setLoading(true)
    try {
      // API 需要去掉"神殿"后缀的格式
      const campusForApi = campus.includes('神殿') ? campus.replace('神殿', '') : campus
      const result =
        await campusEmploymentGoalsResultsService.getCampusEmploymentGoalsResultsData(campusForApi)
      const list = Array.isArray(result) ? result : []
      // 不在这里额外补空行/占位合计行；合计/平均行在 dataWithSummary 中统一计算生成
      setData(list)
    } catch (error) {
      console.error('获取数据失败:', error)
      message.error('获取数据失败')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  // 初始化神殿选择：如果隐藏神殿选择器，从全局store获取神殿并保持同步
  useEffect(() => {
    if (hideCampusSelector) {
      // 隐藏选择器时，始终使用 currentCampus
      if (currentCampus && selectedCampus !== currentCampus) {
        setSelectedCampus(currentCampus)
      }
    } else {
      // 显示选择器时，只在 selectedCampus 为空且 currentCampus 存在时初始化
      if (currentCampus && !selectedCampus) {
        setSelectedCampus(currentCampus)
      }
    }
  }, [hideCampusSelector, currentCampus, selectedCampus])

  // 神殿变化时重新获取数据
  useEffect(() => {
    if (selectedCampus) {
      fetchData(selectedCampus)
      // 如果不在隐藏模式下，同步到全局store
      if (!hideCampusSelector) {
        setCampus(selectedCampus)
      }
    } else {
      setData([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampus])

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

  // 编辑记录
  const handleEdit = (record: CampusEmploymentGoalsResultsRecord) => {
    setEditingRecord(record)
    setEditModalVisible(true)
  }

  // 新增记录
  const handleAdd = () => {
    message.info('新增记录功能开发中')
  }

  // 保存编辑
  const handleSave = async (updatedRecord: CampusEmploymentGoalsResultsRecord) => {
    try {
      setData((prevData) =>
        prevData.map((item) => (item.key === updatedRecord.key ? updatedRecord : item)),
      )

      setEditModalVisible(false)
      setEditingRecord(null)
      message.success('保存成功')
    } catch (error) {
      message.error('保存失败')
    }
  }

  // 取消编辑
  const handleCancel = () => {
    setEditModalVisible(false)
    setEditingRecord(null)
  }

  // 计算带合计行的数据
  const dataWithSummary = useMemo(() => {
    // 过滤掉可能已包含在数据里的合计/平均/汇总行，避免出现“多一行”
    const normalRows = data.filter(
      (item) => item.key !== '__total__' && item.key !== 'summary-row' && item.campus !== '合计/平均',
    )

    if (normalRows.length === 0) return []

    // 计算合计/平均值
    const totalFileCount = normalRows.reduce((sum, item) => sum + item.employmentRate.fileCount, 0)
    const totalTargetEmployment = normalRows.reduce(
      (sum, item) => sum + item.employmentRate.targetEmploymentCount,
      0,
    )
    const totalActualEmployment = normalRows.reduce(
      (sum, item) => sum + item.employmentRate.actualEmploymentCount,
      0,
    )
    const totalSalaryOverTenThousand = normalRows.reduce(
      (sum, item) => sum + item.salaryOverTenThousand,
      0,
    )

    const avgTargetSalary =
      normalRows.reduce((sum, item) => sum + item.salaryAttainment.targetAverageSalary, 0) /
      normalRows.length
    const avgActualSalary =
      normalRows.reduce((sum, item) => sum + item.salaryAttainment.actualAverageSalary, 0) /
      normalRows.length
    const avgAttainmentRate =
      normalRows.reduce((sum, item) => sum + item.salaryAttainment.attainmentRate, 0) /
      normalRows.length
    const avgEmploymentRate = totalFileCount > 0 ? (totalActualEmployment / totalFileCount) * 100 : 0
    
    const summaryRow: CampusEmploymentGoalsResultsRecord = {
      key: 'summary-row',
      serialNumber: 0,
      campus: '',
      majorDirection: '',
      duration: '',
      className: '',
      instructor: '',
      headTeacher: '',
      graduationDate: '',
      salaryAttainment: {
        targetAverageSalary: Math.round(avgTargetSalary),
        actualAverageSalary: Math.round(avgActualSalary),
        attainmentRate: Math.round(avgAttainmentRate * 100) / 100,
      },
      employmentRate: {
        fileCount: totalFileCount,
        targetEmploymentCount: totalTargetEmployment,
        actualEmploymentCount: totalActualEmployment,
        employmentRate: Math.round(avgEmploymentRate * 100) / 100,
      },
      salaryOverTenThousand: totalSalaryOverTenThousand,
    }
    
    return [...normalRows, summaryRow]
  }, [data])

  return (
    <div style={{ padding: hideCampusSelector ? 0 : 24 }}>
      {/* 功能标签栏 - 仅在非隐藏模式下显示 */}
      {!hideCampusSelector && <CoreDataTabs />}

      {/* 使用更严格的条件渲染，确保在 hideCampusSelector 为 true 时完全不渲染 */}
      {hideCampusSelector ? null : (
        <Card style={{ marginBottom: 16 }} data-hide-campus-selector="true">
          <Space>
            <span style={{ fontWeight: 500 }}>选择神殿：</span>
            <Select
              value={selectedCampus || undefined}
              onChange={(value) => {
                // 找到完整的神殿名称
                const fullCampusName = campuses.find((c) => c.id === value)?.name || value
                setSelectedCampus(fullCampusName)
              }}
              placeholder="请选择神殿"
              style={{ width: 200 }}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={campuses.map((campus) => ({
                value: campus.name, // 使用完整神殿名称作为value
                label: campus.name,
              }))}
            />
          </Space>
        </Card>
      )}

      {/* 即使 selectedCampus 为空也渲染表格，显示加载状态或空状态 */}
      <CampusEmploymentGoalsResultsTable
        campus={selectedCampus || currentCampus || ''}
        data={dataWithSummary}
        loading={loading}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onEdit={handleEdit}
        onAdd={handleAdd}
      />

      <CampusEmploymentGoalsResultsEditModal
        visible={editModalVisible}
        record={editingRecord}
        onCancel={handleCancel}
        onSave={handleSave}
      />
    </div>
  )
}

export default EmploymentGoalsResultsPage
