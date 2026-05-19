/**
 * 神殿教化司培训计划与成绩汇总表主页面
 * 选择神殿后显示月度统计数据
 */

import React, { useState, useEffect, useMemo } from 'react'
import { App, Card, Select, Button, Row, Col, Statistic } from 'antd'
import {
  PlusOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import CampusTrainingPlanTable from './components/CampusTrainingPlanTable'
import CampusTrainingPlanEditModal from './components/CampusTrainingPlanEditModal'
import type { CampusTrainingPlanRecord } from '@/types/campus-training-plan'
import { campusTrainingPlanService } from '@/services/campusTrainingPlan'

const CampusTrainingPlanPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [data, setData] = useState<CampusTrainingPlanRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CampusTrainingPlanRecord | null>(null)

  // 神殿列表
  const campuses = getAllCampuses().map((campus) => ({
    id: campus.name.replace('神殿', ''),
    name: campus.name,
  }))

  // 获取数据
  const fetchData = async (campus: string) => {
    if (!campus) return

    setLoading(true)
    try {
      const result = await campusTrainingPlanService.getCampusTrainingPlanData(campus)
      setData(result)
    } catch (error) {
      message.error('获取数据失败')
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

  // 初始化选择第一个神殿
  useEffect(() => {
    if (!selectedCampus && campuses.length > 0) {
      setSelectedCampus(campuses[0].name)
    }
  }, [campuses, selectedCampus])

  // 计算关键统计指标
  const statistics = useMemo(() => {
    const dataRecords = data.filter((record) => record.month && record.month !== 0)

    if (dataRecords.length === 0) {
      return {
        totalTrainingCount: 0,
        totalQualifiedCount: 0,
        avgPassRate: 0,
        avgScore: 0,
      }
    }

    const totalTrainingCount = dataRecords.reduce((sum, r) => sum + (r.trainingCount || 0), 0)
    const totalQualifiedCount = dataRecords.reduce((sum, r) => sum + (r.qualifiedCount || 0), 0)

    const avgPassRate =
      totalTrainingCount > 0
        ? parseFloat(((totalQualifiedCount / totalTrainingCount) * 100).toFixed(1))
        : 0

    const avgScore =
      dataRecords.reduce((sum, r) => sum + (r.averageScore || 0), 0) / dataRecords.length

    return {
      totalTrainingCount,
      totalQualifiedCount,
      avgPassRate,
      avgScore: parseFloat(avgScore.toFixed(1)),
    }
  }, [data])

  // 打开新增对话框
  const handleAdd = () => {
    setEditingRecord(null)
    setEditModalVisible(true)
  }

  // 刷新数据
  const handleRefresh = () => {
    if (selectedCampus) {
      fetchData(selectedCampus)
    }
  }

  // 导出数据
  const handleExport = () => {
    message.info('导出功能开发中')
  }

  // 编辑记录
  const handleEdit = (record: CampusTrainingPlanRecord) => {
    setEditingRecord(record)
    setEditModalVisible(true)
  }

  // 保存编辑
  const handleSave = async (updatedRecord: CampusTrainingPlanRecord) => {
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

  return (
    <div style={{ padding: 24 }}>
      {/* 神殿选择卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: 500 }}>选择神殿：</span>
            <Select
              value={selectedCampus}
              onChange={setSelectedCampus}
              placeholder="请选择神殿"
              style={{ width: 200, marginLeft: 8 }}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={campuses.map((campus) => ({
                value: campus.name,
                label: campus.name,
              }))}
            />
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增记录
          </Button>
        </div>
      </Card>

      {/* 关键指标统计卡片 */}
      {selectedCampus && data.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="培训总人数"
                value={statistics.totalTrainingCount}
                suffix="人"
                prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="合格总人数"
                value={statistics.totalQualifiedCount}
                suffix="人"
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均通过率"
                value={statistics.avgPassRate}
                precision={1}
                suffix="%"
                prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均成绩"
                value={statistics.avgScore}
                precision={1}
                suffix="分"
                prefix={<BarChartOutlined style={{ color: '#eb2f96' }} />}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格卡片 */}
      <Card>
        <CampusTrainingPlanTable
          campus={selectedCampus}
          data={data}
          loading={loading}
          onRefresh={handleRefresh}
          onExport={handleExport}
          onEdit={handleEdit}
        />
      </Card>

      <CampusTrainingPlanEditModal
        visible={editModalVisible}
        record={editingRecord}
        onCancel={handleCancel}
        onSave={handleSave}
      />
    </div>
  )
}

export default CampusTrainingPlanPage
