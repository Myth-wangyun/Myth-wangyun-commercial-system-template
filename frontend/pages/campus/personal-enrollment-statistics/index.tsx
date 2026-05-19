/**
 * 神殿教化司个人负责学籍统计表主页面
 * 选择神殿后显示人员汇总数据
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
import CampusPersonalEnrollmentStatisticsTable from './components/CampusPersonalEnrollmentStatisticsTable'
import CampusPersonalEnrollmentStatisticsEditModal from './components/CampusPersonalEnrollmentStatisticsEditModal'
import type { CampusPersonalEnrollmentStatisticsRecord } from '@/types/campus-personal-enrollment-statistics'
import { campusPersonalEnrollmentStatisticsService } from '@/services/campusPersonalEnrollmentStatistics'

const PersonalEnrollmentStatisticsPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [data, setData] = useState<CampusPersonalEnrollmentStatisticsRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editingRecord, setEditingRecord] =
    useState<CampusPersonalEnrollmentStatisticsRecord | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

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
      const result =
        await campusPersonalEnrollmentStatisticsService.getPersonalEnrollmentStatisticsData(campus)
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
  const handleEdit = (record: CampusPersonalEnrollmentStatisticsRecord) => {
    setEditingRecord(record)
    setModalVisible(true)
  }

  // 删除记录
  const handleDelete = async (key: string) => {
    if (!selectedCampus) return

    setLoading(true)
    try {
      const result = await campusPersonalEnrollmentStatisticsService.deleteRecord(
        selectedCampus,
        key,
      )
      setData(result)
      message.success('删除成功')
    } catch (error) {
      message.error('删除失败')
    } finally {
      setLoading(false)
    }
  }

  // 保存记录
  const handleSave = async (values: Partial<CampusPersonalEnrollmentStatisticsRecord>) => {
    if (!selectedCampus) return

    setLoading(true)
    try {
      let result: CampusPersonalEnrollmentStatisticsRecord[]

      if (editingRecord) {
        result = await campusPersonalEnrollmentStatisticsService.updateRecord(
          selectedCampus,
          editingRecord.key,
          values,
        )
        message.success('更新成功')
      } else {
        result = await campusPersonalEnrollmentStatisticsService.addRecord(selectedCampus, {
          ...values,
        } as Omit<CampusPersonalEnrollmentStatisticsRecord, 'key' | 'isTotal'>)
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
        <CampusPersonalEnrollmentStatisticsTable
          dataSource={data}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>

      {/* 编辑对话框 */}
      <CampusPersonalEnrollmentStatisticsEditModal
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

export default PersonalEnrollmentStatisticsPage
