/**
 * 神殿教化司学籍统计表主页面
 * 选择神殿后显示月度统计数据
 */

import React, { useState, useEffect, useMemo } from 'react'
import { App, Card, Select, Button, Row, Col, Statistic } from 'antd'
import {
  PlusOutlined,
  BookOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import CampusEnrollmentStatisticsTable from './components/CampusEnrollmentStatisticsTable'
import CampusEnrollmentStatisticsEditModal from './components/CampusEnrollmentStatisticsEditModal'
import type { CampusEnrollmentStatisticsRecord } from '@/types/campus-enrollment-statistics'
import { campusEnrollmentStatisticsService } from '@/services/teaching-quality/campusEnrollmentStatistics'

interface EnrollmentStatisticsPageProps {
  hideCampusSelector?: boolean
}

const EnrollmentStatisticsPage: React.FC<EnrollmentStatisticsPageProps> = ({
  hideCampusSelector = false,
}) => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [data, setData] = useState<CampusEnrollmentStatisticsRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CampusEnrollmentStatisticsRecord | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  // 神殿列表
  const campuses = getAllCampuses().map((campus) => ({
    id: campus.name.replace('神殿', ''),
    name: campus.name,
  }))

  // 在汇总模式下，同步顶部神殿到本页
  useEffect(() => {
    if (hideCampusSelector) {
      setSelectedCampus(currentCampus || '')
    }
  }, [hideCampusSelector, currentCampus])

  // 获取数据
  const fetchData = async (campus: string) => {
    if (!campus) return

    setLoading(true)
    try {
      const result =
        await campusEnrollmentStatisticsService.getCampusEnrollmentStatisticsData(campus)
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
      if (!hideCampusSelector) {
        setCampus(selectedCampus)
      }
    } else {
      setData([])
    }
  }, [selectedCampus, hideCampusSelector])

  // 初始化选择第一个神殿
  useEffect(() => {
    if (!selectedCampus && campuses.length > 0) {
      setSelectedCampus(campuses[0].name)
    }
  }, [campuses, selectedCampus])

  // 计算关键统计指标
  const statistics = useMemo(() => {
    const dataRecords = data.filter((record) => !record.isTotal)

    if (dataRecords.length === 0) {
      return {
        totalVocationalRegistered: 0,
        totalUniversityRegistered: 0,
        totalVocationalTarget: 0,
        totalUniversityTarget: 0,
        vocationalCompletionRate: 0,
        universityCompletionRate: 0,
      }
    }

    const totalVocationalRegistered = dataRecords.reduce(
      (sum, record) => sum + record.vocational3YearRegistered + record.vocational1YearRegistered,
      0,
    )

    const totalUniversityRegistered = dataRecords.reduce(
      (sum, record) => sum + record.adultExamRegistered + record.openUniversityRegistered,
      0,
    )

    const totalVocationalTarget = dataRecords.reduce(
      (sum, record) => sum + record.vocationalTargetCount,
      0,
    )

    const totalUniversityTarget = dataRecords.reduce(
      (sum, record) => sum + record.universityTargetCount,
      0,
    )

    const vocationalCompletionRate =
      totalVocationalTarget > 0
        ? parseFloat(((totalVocationalRegistered / totalVocationalTarget) * 100).toFixed(1))
        : 0

    const universityCompletionRate =
      totalUniversityTarget > 0
        ? parseFloat(((totalUniversityRegistered / totalUniversityTarget) * 100).toFixed(1))
        : 0

    return {
      totalVocationalRegistered,
      totalUniversityRegistered,
      totalVocationalTarget,
      totalUniversityTarget,
      vocationalCompletionRate,
      universityCompletionRate,
    }
  }, [data])

  // 打开新增对话框
  const handleAdd = () => {
    setEditingRecord(null)
    setModalVisible(true)
  }

  // 打开编辑对话框
  const handleEdit = (record: CampusEnrollmentStatisticsRecord) => {
    setEditingRecord(record)
    setModalVisible(true)
  }

  // 删除记录
  const handleDelete = async (key: string) => {
    if (!selectedCampus) return

    setLoading(true)
    try {
      const result = await campusEnrollmentStatisticsService.deleteRecord(selectedCampus, key)
      setData(result)
      message.success('删除成功')
    } catch (error) {
      message.error('删除失败')
    } finally {
      setLoading(false)
    }
  }

  // 保存记录
  const handleSave = async (values: Partial<CampusEnrollmentStatisticsRecord>) => {
    if (!selectedCampus) return

    setLoading(true)
    try {
      let result: CampusEnrollmentStatisticsRecord[]

      if (editingRecord) {
        result = await campusEnrollmentStatisticsService.updateRecord(
          selectedCampus,
          editingRecord.key,
          values,
        )
        message.success('更新成功')
      } else {
        result = await campusEnrollmentStatisticsService.addRecord(selectedCampus, {
          ...values,
          campus: selectedCampus,
        } as Omit<CampusEnrollmentStatisticsRecord, 'key' | 'isTotal'>)
        message.success('添加成功')
      }

      setData(result)
      setModalVisible(false)
      setEditingRecord(null)
    } catch (error) {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  // 神殿切换
  const handleCampusChange = (campus: string) => {
    setSelectedCampus(campus)
  }

  return (
    <div style={{ padding: hideCampusSelector ? 0 : 24 }}>
      {/* 神殿选择卡片（在汇总页隐藏） */}
      {!hideCampusSelector && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 500 }}>选择神殿：</span>
              <Select
                value={selectedCampus}
                onChange={handleCampusChange}
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
      )}

      {/* 关键指标统计卡片 */}
      {selectedCampus && data.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="中专总注册人数"
                value={statistics.totalVocationalRegistered}
                suffix="人"
                prefix={<BookOutlined style={{ color: '#1890ff' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="大学总注册人数"
                value={statistics.totalUniversityRegistered}
                suffix="人"
                prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="中专目标完成率"
                value={statistics.vocationalCompletionRate}
                suffix="%"
                precision={1}
                prefix={<CheckCircleOutlined style={{ color: '#faad14' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="大学目标完成率"
                value={statistics.universityCompletionRate}
                suffix="%"
                precision={1}
                prefix={<FileTextOutlined style={{ color: '#eb2f96' }} />}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格卡片 */}
      <Card>
        <CampusEnrollmentStatisticsTable
          dataSource={data}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>

      {/* 编辑对话框 */}
      <CampusEnrollmentStatisticsEditModal
        visible={modalVisible}
        record={editingRecord}
        onCancel={() => {
          setModalVisible(false)
          setEditingRecord(null)
        }}
        onOk={handleSave}
      />
    </div>
  )
}

export default EnrollmentStatisticsPage
