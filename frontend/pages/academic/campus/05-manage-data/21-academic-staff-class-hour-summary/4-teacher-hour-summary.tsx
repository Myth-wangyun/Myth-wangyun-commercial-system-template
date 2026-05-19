// 学术->学术经理->管理表格 教员课时汇总表（自动聚合）
import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Typography, Space, Alert, Spin, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { useCampusStore } from '@/stores/campusStore'
import { fetchTeacherHourStats } from '@/services/teacherHourStats'
import { fetchTeachers } from '@/services/configMaster'

const { Title, Text } = Typography

type Props = { year: number; month: number }

const RATE = {
  regular: 25,
  makeup: 15,
  intensive: 10,
  tutoring: 8,
} as const

interface SummaryRow {
  key: string
  teacher: string
  regularCourse: number
  makeupCourse: number
  intensiveCourse: number
  tutoringCourse: number
}

interface ScheduleData {
  weeks: Array<{ id: string }>
  rows: Record<
    string,
    Array<{
      rowKey: string
      [key: string]: string | number
    }>
  >
  totals?: {
    regular?: number
    makeup?: number
    project?: number
    tutoring?: number
  }
}

const computeTotalsFromSchedule = (schedule: ScheduleData | undefined) => {
  if (!schedule) {
    return { regular: 0, makeup: 0, project: 0, tutoring: 0 }
  }
  if (schedule.totals) {
    return {
      regular: Number(schedule.totals.regular || 0),
      makeup: Number(schedule.totals.makeup || 0),
      project: Number(schedule.totals.project || 0),
      tutoring: Number(
        schedule.totals.tutoring ?? (schedule.totals as any).tutor ?? 0,
      ),
    }
  }
  const totals = { regular: 0, makeup: 0, project: 0, tutoring: 0 }
  schedule.weeks?.forEach((week) => {
    const rows = schedule.rows?.[week.id] || []
    const summary = rows.find((row) => row.rowKey === 'summary')
    if (summary) {
      totals.regular += Number(summary['weekly-regular-total'] || 0)
      totals.makeup += Number(summary['weekly-makeup-total'] || 0)
      totals.project += Number(summary['weekly-project-total'] || 0)
      totals.tutoring += Number(summary['weekly-tutor-total'] || 0)
    }
  })
  return totals
}

interface TeacherOption {
  label: string
  value: string
}

const TeacherHourSummaryPage: React.FC<Props> = ({ year, month }) => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const campusName = currentCampus || '主神殿'

  const [summaryRows, setSummaryRows] = useState<SummaryRow[]>([])
  const [loading, setLoading] = useState(false)
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<string | undefined>(undefined)

  const loadSummary = async () => {
    if (!selectedTeacher) {
      return
    }
    setLoading(true)
    try {
      const res = await fetchTeacherHourStats({
        campus: campusName,
        year,
        month,
        teacher: selectedTeacher,
      })
      const scheduleData = (res.schedule || {}) as ScheduleData
      if (!res.schedule || !Object.keys(res.schedule).length) {
        setSummaryRows([])
      } else {
        const totals = computeTotalsFromSchedule(scheduleData)
        setSummaryRows([
          {
            key: 'summary',
            teacher: selectedTeacher,
            regularCourse: totals.regular,
            makeupCourse: totals.makeup,
            intensiveCourse: totals.project,
            tutoringCourse: totals.tutoring,
          },
        ])
      }
    } catch (error) {
      console.error('加载课时汇总失败', error)
      message.error('加载课时汇总失败')
      setSummaryRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const list = await fetchTeachers({ active: true })
        const options = list.map((teacher) => ({
          label: teacher.name,
          value: teacher.name,
        }))
        setTeacherOptions(options)
        if (!selectedTeacher && options.length) {
          setSelectedTeacher(options[0].value)
        }
      } catch (error) {
        console.warn('加载教员列表失败', error)
      }
    }
    loadTeachers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campusName, year, month, selectedTeacher])

  const columns: ColumnsType<SummaryRow> = [
    {
      title: '教员',
      dataIndex: 'teacher',
      key: 'teacher',
      width: 180,
      align: 'center',
    },
    {
      title: `正课（${RATE.regular}元/节）`,
      dataIndex: 'regularCourse',
      align: 'center',
      width: 160,
    },
    {
      title: `新生补课（${RATE.makeup}元/节）`,
      dataIndex: 'makeupCourse',
      align: 'center',
      width: 180,
    },
    {
      title: `强化课（${RATE.intensive}元/节）`,
      dataIndex: 'intensiveCourse',
      align: 'center',
      width: 160,
    },
    {
      title: `辅导课（${RATE.tutoring}元/节）`,
      dataIndex: 'tutoringCourse',
      align: 'center',
      width: 160,
    },
    {
      title: '课时费合计（元）',
      key: 'totalPayment',
      align: 'center',
      width: 200,
      render: (_value, record) =>
        record.regularCourse * RATE.regular +
        record.makeupCourse * RATE.makeup +
        record.intensiveCourse * RATE.intensive +
        record.tutoringCourse * RATE.tutoring,
    },
  ]

  const totals = useMemo(() => {
    return summaryRows.reduce(
      (acc, row) => {
        acc.regular += row.regularCourse
        acc.makeup += row.makeupCourse
        acc.intensive += row.intensiveCourse
        acc.tutoring += row.tutoringCourse
        acc.money +=
          row.regularCourse * RATE.regular +
          row.makeupCourse * RATE.makeup +
          row.intensiveCourse * RATE.intensive +
          row.tutoringCourse * RATE.tutoring
        return acc
      },
      { regular: 0, makeup: 0, intensive: 0, tutoring: 0, money: 0 },
    )
  }, [summaryRows])

  return (
    <Card bordered={false} style={{ backgroundColor: '#f5f7fa' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Title level={4} style={{ marginBottom: 8 }}>
          教员课时汇总表
        </Title>
        <Space>
          <Select
            allowClear
            placeholder="选择教员"
            value={selectedTeacher}
            onChange={(value) => setSelectedTeacher(value || undefined)}
            options={teacherOptions}
            style={{ minWidth: 200 }}
            showSearch
            optionFilterProp="label"
          />
          <Text type="secondary">
            {year}年{month}月
          </Text>
        </Space>
      </Space>
      <Text type="secondary">数据来源：教员课时统计表（自动聚合）</Text>

      <Spin spinning={loading} style={{ width: '100%' }}>
        {summaryRows.length === 0 ? (
          <Alert
            style={{ marginTop: 16 }}
            message="当前月份没有可汇总的数据，请先在课时统计表中录入并保存。"
            type="info"
          />
        ) : (
          <Table<SummaryRow>
            bordered
            columns={columns}
            dataSource={summaryRows}
            pagination={false}
            scroll={{ x: 'max-content' }}
            style={{ marginTop: 16 }}
            rowKey="key"
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}>
                    <Text strong>总计</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="center">
                    {totals.regular}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="center">
                    {totals.makeup}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="center">
                    {totals.intensive}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="center">
                    {totals.tutoring}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="center">
                    {totals.money}
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        )}
      </Spin>
    </Card>
  )
}

export default TeacherHourSummaryPage
