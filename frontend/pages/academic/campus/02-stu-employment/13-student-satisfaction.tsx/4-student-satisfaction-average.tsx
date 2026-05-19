import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, Table, Typography, InputNumber, Space, Empty, Spin, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { studentSatisfactionDetailService } from '@/services/service'
import type { StudentSatisfactionAvg } from '@/types/service'

const { Text, Title } = Typography

const avg = (arr: (number | null | undefined)[]) => {
  const vals = arr
    .map((v) => (typeof v === 'string' ? Number(v) : v))
    .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v))
  if (!vals.length) return undefined
  const s = vals.reduce((a, b) => a + b, 0)
  return Math.round((s / vals.length) * 100) / 100
}

const SatisfactionAverage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<StudentSatisfactionAvg[]>([])

  const load = async (targetYear = year) => {
    setLoading(true)
    try {
      const data = await studentSatisfactionDetailService.getAvg(currentCampus, targetYear)
      setRows(
        (data || []).map((item, idx) => ({
          ...item,
          teacherName: item.teacherName || (item as any).teacher_name || `教员${idx + 1}`,
        })),
      )
    } catch (err) {
      console.error('加载平均成绩失败', err)
      message.error('加载平均成绩失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [currentCampus, year])

  const columns: ColumnsType<StudentSatisfactionAvg> = [
    { title: '教员姓名', dataIndex: 'teacherName', width: 140, fixed: 'left' },
    ...Array.from({ length: 12 }).map((_, i) => ({
      title: `${i + 1}月`,
      dataIndex: `m${i + 1}`,
      width: 110,
      align: 'center' as const,
      render: (v: number | null) => (v ?? v === 0 ? Number(v).toFixed(2) : '-'),
    })),
    {
      title: '平均',
      key: 'avg',
      width: 110,
      align: 'center',
      render: (_: any, r: StudentSatisfactionAvg) => {
        const v = avg([r.m1, r.m2, r.m3, r.m4, r.m5, r.m6, r.m7, r.m8, r.m9, r.m10, r.m11, r.m12])
        return v ?? '-'
      },
    },
  ]

  const monthAvgs = useMemo(() => {
    const list: (number | undefined)[] = []
    for (let i = 1; i <= 12; i++) {
      const vals = rows.map((r) => (r as any)[`m${i}`] as number | undefined)
      list.push(avg(vals))
    }
    return list
  }, [rows])

  const overall = useMemo(() => avg(monthAvgs), [monthAvgs])

  return (
    <Card bordered={false} style={{ background: '#f5f7fa' }}>
      <Title level={5} style={{ marginBottom: 8 }}>
        平均成绩表
      </Title>

      <Space style={{ marginBottom: 12 }}>
        <Text strong>神殿</Text>
        <Text>{currentCampus || '-'}</Text>
        <Text strong>年份</Text>
        <InputNumber
          min={2000}
          max={2100}
          value={year}
          onChange={(v) => {
            const y = Number(v || new Date().getFullYear())
            setYear(y)
            load(y)
          }}
        />
        <Button onClick={() => load()} loading={loading}>
          刷新
        </Button>
      </Space>

      <Spin spinning={loading}>
        {rows.length ? (
          <Table<StudentSatisfactionAvg>
            bordered
            size="small"
            columns={columns}
            dataSource={rows.map((r, idx) => ({ ...r, key: `${r.teacherName}-${idx}` }))}
            pagination={false}
            scroll={{ x: 'max-content' }}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}>
                    <Text strong>平均</Text>
                  </Table.Summary.Cell>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Table.Summary.Cell index={i + 1} key={i} align="center">
                      {monthAvgs[i] ?? '-'}
                    </Table.Summary.Cell>
                  ))}
                  <Table.Summary.Cell index={13} align="center">
                    {overall ?? '-'}
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        ) : (
          <Empty description="暂无数据，请先填写个人详细后再查看" />
        )}
      </Spin>
    </Card>
  )
}

export default SatisfactionAverage
