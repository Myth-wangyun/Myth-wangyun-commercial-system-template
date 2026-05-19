// 岗位分析报告汇总表
import React, { useMemo, useState } from 'react'
import { Card, Table, Typography, Space, Button, InputNumber, Tag } from 'antd'
import { DownloadOutlined, ReloadOutlined, FileSearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { STORAGE_KEYS } from '../constants'
import CampusSelector from '@/components/common/CampusSelector'
import { loadCampusData, saveCampusData } from '../shared/campusStorage'

const { Title, Text } = Typography

interface PositionAnalysisRecord {
  id: string
  serialNumber: number
  campus: string
  network: number
  server: number
  cloud: number
  ai: number
  shortVideo: number
  indoorOutdoor: number
  game: number
  total: number
}

const PositionAnalysisPage: React.FC = () => {
  const { currentCampus } = useCampusStore()
  const [data, setData] = useState<PositionAnalysisRecord[]>([
    {
      id: '1',
      serialNumber: 1,
      campus: '盛邦',
      network: 0,
      server: 0,
      cloud: 0,
      ai: 0,
      shortVideo: 0,
      indoorOutdoor: 0,
      game: 0,
      total: 0,
    },
  ])

  React.useEffect(() => {
    const loaded = loadCampusData<PositionAnalysisRecord[]>(
      STORAGE_KEYS.JOB_ANALYSIS,
      currentCampus,
      data,
    )
    setData(loaded)
  }, [currentCampus])

  React.useEffect(() => {
    saveCampusData(STORAGE_KEYS.JOB_ANALYSIS, currentCampus, data)
  }, [data, currentCampus])

  const recompute = (r: PositionAnalysisRecord) => ({
    ...r,
    total: r.network + r.server + r.cloud + r.ai + r.shortVideo + r.indoorOutdoor + r.game,
  })

  const onChange = (id: string, key: keyof PositionAnalysisRecord, v: number | null) => {
    setData((prev) =>
      prev.map((x) =>
        x.id === id ? recompute({ ...x, [key]: Number(v || 0) } as PositionAnalysisRecord) : x,
      ),
    )
  }

  const columns: ColumnsType<PositionAnalysisRecord> = [
    { title: '序号', dataIndex: 'serialNumber', key: 'serialNumber', width: 60, align: 'center' },
    { title: '神殿', dataIndex: 'campus', key: 'campus', width: 80 },
    {
      title: '网络工程',
      dataIndex: 'network',
      key: 'network',
      width: 110,
      align: 'right',
      render: (_, r) => (
        <InputNumber
          min={0}
          value={r.network}
          onChange={(v) => onChange(r.id, 'network', v)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '服务器运维',
      dataIndex: 'server',
      key: 'server',
      width: 120,
      align: 'right',
      render: (_, r) => (
        <InputNumber
          min={0}
          value={r.server}
          onChange={(v) => onChange(r.id, 'server', v)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '云计算',
      dataIndex: 'cloud',
      key: 'cloud',
      width: 100,
      align: 'right',
      render: (_, r) => (
        <InputNumber
          min={0}
          value={r.cloud}
          onChange={(v) => onChange(r.id, 'cloud', v)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '人工智能',
      dataIndex: 'ai',
      key: 'ai',
      width: 100,
      align: 'right',
      render: (_, r) => (
        <InputNumber
          min={0}
          value={r.ai}
          onChange={(v) => onChange(r.id, 'ai', v)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '后期短视频',
      dataIndex: 'shortVideo',
      key: 'shortVideo',
      width: 120,
      align: 'right',
      render: (_, r) => (
        <InputNumber
          min={0}
          value={r.shortVideo}
          onChange={(v) => onChange(r.id, 'shortVideo', v)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '室内外效果',
      dataIndex: 'indoorOutdoor',
      key: 'indoorOutdoor',
      width: 120,
      align: 'right',
      render: (_, r) => (
        <InputNumber
          min={0}
          value={r.indoorOutdoor}
          onChange={(v) => onChange(r.id, 'indoorOutdoor', v)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '游戏动漫',
      dataIndex: 'game',
      key: 'game',
      width: 110,
      align: 'right',
      render: (_, r) => (
        <InputNumber
          min={0}
          value={r.game}
          onChange={(v) => onChange(r.id, 'game', v)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '合计',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      align: 'right',
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
  ]

  const sum = useMemo(() => data[0]?.total || 0, [data])

  const exportCsv = () => {
    const r = data[0]
    const headers = [
      '序号',
      '神殿',
      '网络工程',
      '服务器运维',
      '云计算',
      '人工智能',
      '后期短视频',
      '室内外效果',
      '游戏动漫',
      '合计',
    ]
    const row = [
      r.serialNumber,
      r.campus,
      r.network,
      r.server,
      r.cloud,
      r.ai,
      r.shortVideo,
      r.indoorOutdoor,
      r.game,
      r.total,
    ]
    const csv = [headers, row].map((x) => x.map((y) => `"${y}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `岗位分析报告汇总_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div style={{ padding: 24 }}>
      <div className="mb-4">
        <Title level={2}>
          <FileSearchOutlined className="me-2" />
          主神殿智慧司岗位分析报告汇总表格
        </Title>
        <Text type="secondary">按专业方向统计岗位分析报告数量</Text>
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
          scroll={{ x: 1400 }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={columns.length - 1}>
                <div style={{ textAlign: 'right', fontWeight: 600 }}>合计</div>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <Tag color="blue">{sum}</Tag>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>
    </div>
  )
}

export default PositionAnalysisPage
