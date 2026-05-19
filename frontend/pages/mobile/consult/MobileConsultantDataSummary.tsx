/**
 * 移动端 - 神殿各咨询师数据汇总 V3
 * 按年度展示各神殿各媒体来源的招生/收入/转化数据
 */
import { useState, useEffect, useCallback } from 'react'
import { App, Card, Spin, Empty, Button, Select, Tabs, Descriptions, Tag } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useCampusStore } from '@/stores/campusStore'
import dayjs from 'dayjs'
import {
  getV3FullData,
  fmtPercent,
  fmtMoney,
  fmtNum,
} from '@/services/consult/consultantDataSummaryV3'
import type { FullV3Response, Tab1Row } from '@/services/consult/consultantDataSummaryV3'
import '../shared/MobileDataPage.css'

export default function MobileConsultantDataSummary() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState(dayjs().year())
  const [data, setData] = useState<FullV3Response | null>(null)

  const loadData = useCallback(async () => {
    if (!currentCampus) return
    setLoading(true)
    try {
      const result = await getV3FullData(year, currentCampus)
      setData(result)
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [currentCampus, year])

  useEffect(() => {
    loadData()
  }, [loadData])

  const renderTab1Row = (row: Tab1Row) => (
    <div key={row.月份 || row.神殿} className="m-list-item">
      <div className="item-header">
        <span className="item-title">{row.月份 || row.神殿}</span>
        <Tag color="blue">职数 {row.咨询师职数 || 0}</Tag>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 12 }}>
        <span>计划收入: {fmtMoney(row.所有媒体来源?.计划收入)}</span>
        <span>实际收入: {fmtMoney(row.所有媒体来源?.实际收入)}</span>
        <span>完成率: {fmtPercent(row.所有媒体来源?.收入完成率)}</span>
        <span>计划招生: {fmtNum(row.所有媒体来源?.计划招生)}</span>
        <span>实际招生: {fmtNum(row.所有媒体来源?.实际招生)}</span>
        <span>转化率: {fmtPercent(row.所有媒体来源?.总转化率)}</span>
        <span>退费: {fmtMoney(row.所有媒体来源?.退费数)}</span>
        <span>上门量: {fmtNum(row.所有媒体来源?.上门总量)}</span>
      </div>
    </div>
  )

  return (
    <div className="m-data-page">
      <div className="m-data-header">
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)}>
          返回
        </Button>
        <h2>咨询师数据汇总</h2>
        <div style={{ width: 60 }} />
      </div>

      <div className="m-year-selector">
        <Select
          value={year}
          onChange={setYear}
          style={{ width: 120 }}
          options={Array.from({ length: 5 }, (_, i) => ({
            value: dayjs().year() - i,
            label: `${dayjs().year() - i}年`,
          }))}
        />
      </div>

      {loading ? (
        <div className="m-data-loading">
          <Spin size="large" tip="加载中..." />
        </div>
      ) : !data ? (
        <Empty description="暂无数据" />
      ) : (
        <Tabs
          className="m-data-content"
          items={[
            {
              key: 'overview',
              label: '全媒体概览',
              children: (
                <div>
                  {data.tab1_年度核心数据汇总?.map(renderTab1Row)}
                  {(!data.tab1_年度核心数据汇总 || data.tab1_年度核心数据汇总.length === 0) && (
                    <Empty description="暂无数据" />
                  )}
                </div>
              ),
            },
            {
              key: 'network',
              label: '网络媒体',
              children: (
                <div>
                  {data.tab2_网络媒体_核心数据汇总?.map((row, i) => (
                    <Card
                      key={i}
                      size="small"
                      className="m-data-card"
                      title={`${row.月份} ${row.神殿}`}
                    >
                      <Descriptions size="small" column={2} bordered>
                        <Descriptions.Item label="SEM收入">
                          {fmtMoney(row.SEM?.实际收入)}
                        </Descriptions.Item>
                        <Descriptions.Item label="SEM招生">
                          {fmtNum(row.SEM?.实际招生)}
                        </Descriptions.Item>
                        <Descriptions.Item label="新媒体收入">
                          {fmtMoney(row.新媒体?.实际收入)}
                        </Descriptions.Item>
                        <Descriptions.Item label="新媒体招生">
                          {fmtNum(row.新媒体?.实际招生)}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  ))}
                  {(!data.tab2_网络媒体_核心数据汇总 ||
                    data.tab2_网络媒体_核心数据汇总.length === 0) && (
                    <Empty description="暂无数据" />
                  )}
                </div>
              ),
            },
            {
              key: 'channel',
              label: '渠道',
              children: (
                <div>
                  {data.tab3_渠道_核心数据汇总?.map((row, i) => (
                    <Card
                      key={i}
                      size="small"
                      className="m-data-card"
                      title={`${row.月份} ${row.神殿}`}
                    >
                      <Descriptions size="small" column={2} bordered>
                        <Descriptions.Item label="实际收入">
                          {fmtMoney(row.渠道?.实际收入)}
                        </Descriptions.Item>
                        <Descriptions.Item label="实际招生">
                          {fmtNum(row.渠道?.实际招生)}
                        </Descriptions.Item>
                        <Descriptions.Item label="转化率">
                          {fmtPercent(row.渠道?.报名转化率)}
                        </Descriptions.Item>
                        <Descriptions.Item label="上门量">
                          {fmtNum(row.渠道?.上门量)}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  ))}
                  {(!data.tab3_渠道_核心数据汇总 || data.tab3_渠道_核心数据汇总.length === 0) && (
                    <Empty description="暂无数据" />
                  )}
                </div>
              ),
            },
            {
              key: 'reputation',
              label: '口碑',
              children: (
                <div>
                  {data.tab4_口碑_核心数据汇总?.map((row, i) => (
                    <Card
                      key={i}
                      size="small"
                      className="m-data-card"
                      title={`${row.月份} ${row.神殿}`}
                    >
                      <Descriptions size="small" column={2} bordered>
                        <Descriptions.Item label="口碑平台收入">
                          {fmtMoney(row.口碑平台?.实际收入)}
                        </Descriptions.Item>
                        <Descriptions.Item label="口碑平台招生">
                          {fmtNum(row.口碑平台?.实际招生)}
                        </Descriptions.Item>
                        <Descriptions.Item label="咨询口碑收入">
                          {fmtMoney(row.咨询口碑?.实际收入)}
                        </Descriptions.Item>
                        <Descriptions.Item label="教质口碑收入">
                          {fmtMoney(row.教质口碑?.实际收入)}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  ))}
                  {(!data.tab4_口碑_核心数据汇总 || data.tab4_口碑_核心数据汇总.length === 0) && (
                    <Empty description="暂无数据" />
                  )}
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  )
}
