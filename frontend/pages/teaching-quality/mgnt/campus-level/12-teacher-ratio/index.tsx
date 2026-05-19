/**
 * 神殿教化司师资配比表主页面
 * 选择神殿后显示月度统计数据
 */

import React, { useState, useEffect, useMemo } from 'react'
import { App, Card, AutoComplete, Button, Row, Col, Statistic } from 'antd'
import {
  PlusOutlined,
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import TeacherRatioTable from './components/TeacherRatioTable'
import TeacherRatioEditModal from './components/TeacherRatioEditModal'
import type { TeacherRatioRecord } from '@/types/teacher-ratio'
import { teacherRatioService } from '@/services/teaching-quality/teacherRatio'

interface TeacherRatioPageProps {
  hideCampusSelector?: boolean
}

const TeacherRatioPage: React.FC<TeacherRatioPageProps> = ({ hideCampusSelector = false }) => {
  const { message } = App.useApp()
  const hideByRoute = typeof window !== 'undefined' && window.location?.pathname?.includes('/teaching-quality/core-data')
  const hide = hideCampusSelector || !!hideByRoute
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [data, setData] = useState<TeacherRatioRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TeacherRatioRecord | null>(null)

  // 神殿列表
  // 说明：保存/查询接口侧的 campus 口径是“xx神殿”（例如“河北主神殿”）。
  // 之前这里把“神殿”去掉会导致保存时写入“河北盛邦”而不是“河北主神殿”。
  const campuses = getAllCampuses().map((campus) => ({
    id: campus.name,
    name: campus.name,
  }))

  // 获取数据
  const fetchData = async (campus: string) => {
    if (!campus) return

    setLoading(true)
    try {
      const result = await teacherRatioService.getTeacherRatioData(campus)
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
      // 独立页面才回写全局神殿
      if (!hide) {
        setCampus(selectedCampus)
      }
    } else {
      setData([])
    }
  }, [selectedCampus, hide])

  // 在汇总页嵌入时，随顶部神殿联动
  useEffect(() => {
    if (hide && currentCampus) {
      setSelectedCampus(currentCampus)
    }
  }, [hide, currentCampus])

  // 初始化选择第一个神殿（独立页）
  useEffect(() => {
    if (!hideCampusSelector && !selectedCampus && campuses.length > 0) {
      setSelectedCampus(campuses[0].name)
    }
  }, [hideCampusSelector, campuses, selectedCampus])

  // 计算关键统计指标
  const statistics = useMemo(() => {
    const dataRecords = data.filter((record: any) => record.id && !record.isTotal)

    if (dataRecords.length === 0) {
      return {
        totalStudents: 0,
        totalTeachers: 0,
        avgRatio: 0,
        totalClasses: 0,
      }
    }

    // 学生总数：取所有记录中最大的 studentTotal（因为是同一个神殿的总人数）
    const totalStudents = Math.max(...dataRecords.map((r: any) => r.studentTotal || 0), 0)
    const totalTeachers = dataRecords.reduce(
      (sum: number, r: any) => sum + (r.actualTeacherCount || 0),
      0,
    )
    const totalClasses = dataRecords.reduce((sum: number, r: any) => sum + (r.classCount || 0), 0)

    const avgRatio = totalTeachers > 0 ? parseFloat((totalStudents / totalTeachers).toFixed(1)) : 0

    return {
      totalStudents,
      totalTeachers,
      avgRatio,
      totalClasses,
    }
  }, [data])

  // 打开新增对话框
  const handleAdd = () => {
    if (!selectedCampus) {
      message.warning('请先选择神殿')
      return
    }
    setEditingRecord(null)
    setEditModalVisible(true)
  }

  const getNextAvailableMonth = (): number | undefined => {
    const used = new Set<number>(data.filter((r: any) => !r.isTotal && r.month).map((r: any) => r.month))
    for (let m = 1; m <= 12; m++) {
      if (!used.has(m)) return m
    }
    return undefined
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
  const handleEdit = (record: TeacherRatioRecord) => {
    setEditingRecord(record)
    setEditModalVisible(true)
  }

  // 保存编辑
  const handleSave = async (updatedRecord: TeacherRatioRecord) => {
    try {
      setData((prevData) => {
        const idx = prevData.findIndex((item: any) => (item as any).id === (updatedRecord as any).id)
        if (idx >= 0) {
          // 更新现有
          return prevData.map((item: any, i: number) => (i === idx ? updatedRecord : item))
        }
        // 新增：插入到合计行之前
        if (prevData.length === 0) return [updatedRecord]
        const last = prevData[prevData.length - 1]
        const body = prevData.slice(0, -1)
        return [...body, updatedRecord, last]
      })

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
      {/* 神殿选择卡片（在汇总页隐藏） */}
      {!hide && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 500 }}>选择神殿：</span>
              <AutoComplete
                value={selectedCampus}
                onChange={setSelectedCampus}
                onSelect={setSelectedCampus}
                placeholder="请选择或输入神殿"
                style={{ width: 200, marginLeft: 8 }}
                allowClear
                options={campuses.map((campus) => ({
                  value: campus.name,
                  label: campus.name,
                }))}
                filterOption={(inputValue, option) =>
                  (option?.label as string || '').toLowerCase().includes(inputValue.toLowerCase())
                }
              />
              <Button 
                type="primary" 
                style={{ marginLeft: 8 }}
                onClick={handleRefresh}
              >
                确定
              </Button>
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
                title="学生总数"
                value={statistics.totalStudents}
                suffix="人"
                prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="教师总数"
                value={statistics.totalTeachers}
                suffix="人"
                prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="师生比"
                value={`1:${statistics.avgRatio}`}
                prefix={<BarChartOutlined style={{ color: '#faad14' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="班级总数"
                value={statistics.totalClasses}
                suffix="个"
                prefix={<BookOutlined style={{ color: '#eb2f96' }} />}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格卡片 */}
      <Card>
        <TeacherRatioTable
          campus={selectedCampus}
          data={data}
          loading={loading}
          onRefresh={handleRefresh}
          onExport={handleExport}
          onEdit={handleEdit}
        />
      </Card>

      <TeacherRatioEditModal
        visible={editModalVisible}
        record={editingRecord}
        onCancel={handleCancel}
        onSave={handleSave}
        defaultCampus={selectedCampus}
        defaultMonth={getNextAvailableMonth()}
      />
    </div>
  )
}

export default TeacherRatioPage
