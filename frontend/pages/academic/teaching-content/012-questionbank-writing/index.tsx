// 题库编写汇总表
import React, { useMemo, useState } from 'react'
import { Card, Table, Typography, Space, Button, InputNumber, Tag } from 'antd'
import { DownloadOutlined, ReloadOutlined, ProfileOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { STORAGE_KEYS } from '../constants'
import CampusSelector from '@/components/common/CampusSelector'
import { loadCampusData, saveCampusData } from '../shared/campusStorage'

const { Title, Text } = Typography

interface QuestionbankWritingRecord {
  id: string
  serialNumber: number
  campus: string
  net_new: number
  net_edit: number
  ai_new: number
  ai_edit: number
  aigc_new: number
  aigc_edit: number
  media_new: number
  media_edit: number
  total_new: number
  total_edit: number
}

const QuestionbankWritingPage: React.FC = () => {
  const { currentCampus } = useCampusStore()
  const [data, setData] = useState<QuestionbankWritingRecord[]>([
    {
      id: '1',
      serialNumber: 1,
      campus: '盛邦',
      net_new: 0,
      net_edit: 0,
      ai_new: 0,
      ai_edit: 0,
      aigc_new: 0,
      aigc_edit: 0,
      media_new: 0,
      media_edit: 0,
      total_new: 0,
      total_edit: 0,
    },
  ])

  React.useEffect(() => {
    const loaded = loadCampusData<QuestionbankWritingRecord[]>(
      STORAGE_KEYS.QUESTION_BANK,
      currentCampus,
      data,
    )
    setData(loaded)
  }, [currentCampus])

  React.useEffect(() => {
    saveCampusData(STORAGE_KEYS.QUESTION_BANK, currentCampus, data)
  }, [data, currentCampus])

  const recompute = (r: QuestionbankWritingRecord) => ({
    ...r,
    total_new: r.net_new + r.ai_new + r.aigc_new + r.media_new,
    total_edit: r.net_edit + r.ai_edit + r.aigc_edit + r.media_edit,
  })

  const onChange = (id: string, key: keyof QuestionbankWritingRecord, v: number | null) => {
    setData((prev) =>
      prev.map((x) =>
        x.id === id ? recompute({ ...x, [key]: Number(v || 0) } as QuestionbankWritingRecord) : x,
      ),
    )
  }

  const columns: ColumnsType<QuestionbankWritingRecord> = [
    { title: '序号', dataIndex: 'serialNumber', key: 'serialNumber', width: 60, align: 'center' },
    { title: '神殿', dataIndex: 'campus', key: 'campus', width: 80 },
    {
      title: '网络云运维-新编',
      dataIndex: 'net_new',
      key: 'net_new',
      width: 130,
      align: 'right',
      render: (_, r) => (
        <InputNumber
          min={0}
          value={r.net_new}
          onChange={(v) => onChange(r.id, 'net_new', v)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '网络云运维-修改',
      dataIndex: 'net_edit',
      key: 'net_edit',
      width: 130,
      align: 'right',
      render: (_, r) => (
        <InputNumber
          min={0}
          value={r.net_edit}
          onChange={(v) => onChange(r.id, 'net_edit', v)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '人工智能-新编',
      dataIndex: 'ai_new',
      key: 'ai_new',
      width: 120,
      align: 'right',
      render: (_, r) => (
        <InputNumber
          min={0}
          value={r.ai_new}
          onChange={(v) => onChange(r.id, 'ai_new', v)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '人工智能-修改',
      dataIndex: 'ai_edit',
      key: 'ai_edit',
      width: 120,
      align: 'right',
      render: (_, r) => (
        <InputNumber
          min={0}
          value={r.ai_edit}
          onChange={(v) => onChange(r.id, 'ai_edit', v)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'AIGC-新编',
      dataIndex: 'aigc_new',
      key: 'aigc_new',
      width: 100,
      align: 'right',
      render: (_, r) => (
        <InputNumber
          min={0}
          value={r.aigc_new}
          onChange={(v) => onChange(r.id, 'aigc_new', v)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'AIGC-修改',
      dataIndex: 'aigc_edit',
      key: 'aigc_edit',
      width: 100,
      align: 'right',
      render: (_, r) => (
        <InputNumber
          min={0}
          value={r.aigc_edit}
          onChange={(v) => onChange(r.id, 'aigc_edit', v)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'AI数媒-新编',
      dataIndex: 'media_new',
      key: 'media_new',
      width: 110,
      align: 'right',
      render: (_, r) => (
        <InputNumber
          min={0}
          value={r.media_new}
          onChange={(v) => onChange(r.id, 'media_new', v)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'AI数媒-修改',
      dataIndex: 'media_edit',
      key: 'media_edit',
      width: 110,
      align: 'right',
      render: (_, r) => (
        <InputNumber
          min={0}
          value={r.media_edit}
          onChange={(v) => onChange(r.id, 'media_edit', v)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '新编合计',
      dataIndex: 'total_new',
      key: 'total_new',
      width: 110,
      align: 'right',
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '修改合计',
      dataIndex: 'total_edit',
      key: 'total_edit',
      width: 110,
      align: 'right',
      render: (v) => <Tag color="geekblue">{v}</Tag>,
    },
  ]

  const totals = useMemo(
    () => ({ new: data[0]?.total_new || 0, edit: data[0]?.total_edit || 0 }),
    [data],
  )

  const exportCsv = () => {
    const r = data[0]
    const headers = [
      '序号',
      '神殿',
      '网络新编',
      '网络修改',
      'AI新编',
      'AI修改',
      'AIGC新编',
      'AIGC修改',
      'AI数媒新编',
      'AI数媒修改',
      '新编合计',
      '修改合计',
    ]
    const row = [
      r.serialNumber,
      r.campus,
      r.net_new,
      r.net_edit,
      r.ai_new,
      r.ai_edit,
      r.aigc_new,
      r.aigc_edit,
      r.media_new,
      r.media_edit,
      r.total_new,
      r.total_edit,
    ]
    const csv = [headers, row].map((x) => x.map((y) => `"${y}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `题库编写汇总_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div style={{ padding: 24 }}>
      <div className="mb-4">
        <Title level={2}>
          <ProfileOutlined className="me-2" />
          主神殿智慧司题库编写汇总表格
        </Title>
        <Text type="secondary">统计不同方向题库的新编与修改数量</Text>
      </div>
      <div className="mb-4">
        <CampusSelector />
      </div>

      <Space className="mb-4">
        <Button type="primary" icon={<DownloadOutlined />} onClick={exportCsv}>
          导出CSV
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => setData((d) => d.map(recompute))}>
          重新计算
        </Button>
      </Space>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1500 }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={columns.length - 2}>
                <div style={{ textAlign: 'right', fontWeight: 600 }}>合计</div>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <Tag color="blue">{totals.new}</Tag>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">
                <Tag color="geekblue">{totals.edit}</Tag>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>
    </div>
  )
}

export default QuestionbankWritingPage
