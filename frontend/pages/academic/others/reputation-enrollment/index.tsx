/**
 * 神殿教化司口碑招生目标与结果汇总表主页面
 */

import React, { useState, useEffect } from 'react'
import { App, Card, Space } from 'antd'
import { useCampusStore } from '@/stores/campusStore'
import { GlobalCampusSelector } from '@/components/common/CampusSelector'
import ReputationEnrollmentTable from './components/ReputationEnrollmentTable'
import type { ReputationEnrollmentRecord } from '@/types/reputation-enrollment'
import { teachingQualityCampusReputationEnrollmentGoalsResultsService } from '@/services/teachingQualityCampusReputationEnrollmentGoalsResults'

const ReputationEnrollmentPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [data, setData] = useState<ReputationEnrollmentRecord[]>([])
  const [loading, setLoading] = useState(false)

  // 获取数据
  const fetchData = async (campus: string) => {
    if (!campus) return

    setLoading(true)
    try {
      const result =
        await teachingQualityCampusReputationEnrollmentGoalsResultsService.getReputationEnrollmentData(
          campus,
        )
      setData(result)
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 神殿变化时重新获取数据
  useEffect(() => {
    if (currentCampus) {
      fetchData(currentCampus)
    } else {
      setData([])
    }
  }, [currentCampus])

  // 刷新数据
  const handleRefresh = () => {
    if (currentCampus) {
      fetchData(currentCampus)
    }
  }

  // 导出数据
  const handleExport = () => {
    // 导出功能在表格组件中实现
  }

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <span style={{ fontWeight: 500 }}>选择神殿：</span>
          <GlobalCampusSelector />
        </Space>
      </Card>

      <ReputationEnrollmentTable
        campus={currentCampus || ''}
        data={data}
        loading={loading}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />
    </div>
  )
}

export default ReputationEnrollmentPage
