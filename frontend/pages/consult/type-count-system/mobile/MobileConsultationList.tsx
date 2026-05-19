/**
 * 移动端 - 咨询量列表
 *
 * 卡片式列表，支持下拉筛选、上滑加载更多。
 */
import React, { useState, useEffect, useCallback } from 'react'
import { App,
  Card, Tag, Space, Input, Select, DatePicker, Button,
  Empty, Spin, Badge, Drawer, Descriptions, Divider,
} from 'antd'
import {
  SearchOutlined, FilterOutlined, PhoneOutlined,
  UserOutlined, CalendarOutlined, EnvironmentOutlined,
  ReloadOutlined, EyeOutlined, CloseOutlined,
} from '@ant-design/icons'
import { getConsultantNames } from '@/services/consult/consultantList'
import { useCampusStore } from '@/stores/campusStore'
import type { ConsultationRecord, ConsultationQueryParams } from '../types'
import * as api from '../api'
import dayjs from 'dayjs'

import './MobileConsultationList.css'

interface Props {
  refreshKey?: number
  campus?: string
}

export default function MobileConsultationList({ refreshKey, campus }: Props) {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<ConsultationRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20

  // 筛选
  const [showFilters, setShowFilters] = useState(false)
  const [searchPhone, setSearchPhone] = useState('')
  const [filterConsultant, setFilterConsultant] = useState<string | undefined>()
  const [filterSource, setFilterSource] = useState<string | undefined>()
  const [consultantOptions, setConsultantOptions] = useState<string[]>([])
  const [sourceOptions, setSourceOptions] = useState<string[]>([])

  // 详情
  const [detailVisible, setDetailVisible] = useState(false)
  const [detailRecord, setDetailRecord] = useState<ConsultationRecord | null>(null)

  // 加载选项
  useEffect(() => {
    getConsultantNames(campus).then(setConsultantOptions).catch(console.error)
    api.getSourceOptions().then(r => setSourceOptions(r.data)).catch(console.error)
  }, [campus])

  // 加载列表
  const loadData = useCallback(async (p = 1, append = false) => {
    setLoading(true)
    try {
      const params: ConsultationQueryParams = {
        campus,
        phone: searchPhone || undefined,
        consultant: filterConsultant,
        source: filterSource,
        page: p,
        page_size: pageSize,
      }
      const result = await api.getConsultationRecords(params)
      setRecords(prev => append ? [...prev, ...result.数据列表] : result.数据列表)
      setTotal(result.总记录数)
      setPage(p)
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [campus, searchPhone, filterConsultant, filterSource])

  useEffect(() => { loadData(1) }, [refreshKey, campus, filterConsultant, filterSource])

  const handleSearch = () => loadData(1)
  const handleLoadMore = () => loadData(page + 1, true)

  // 量来源颜色
  const sourceColor = (s?: string) => {
    if (!s) return 'default'
    if (s.includes('网络')) return 'blue'
    if (s.includes('口碑')) return 'green'
    if (s.includes('渠道')) return 'orange'
    return 'default'
  }

  return (
    <div className="m-list-page">
      {/* 搜索栏 */}
      <div className="m-list-search">
        <Input
          placeholder="搜索电话 / 姓名"
          prefix={<SearchOutlined />}
          value={searchPhone}
          onChange={e => setSearchPhone(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
          className="m-search-input"
        />
        <Button
          icon={<FilterOutlined />}
          onClick={() => setShowFilters(!showFilters)}
          type={showFilters ? 'primary' : 'default'}
          className="m-filter-btn"
        />
        <Button icon={<ReloadOutlined />} onClick={() => loadData(1)} />
      </div>

      {/* 筛选区 */}
      {showFilters && (
        <div className="m-list-filters">
          <Select
            placeholder="咨询师"
            value={filterConsultant}
            onChange={setFilterConsultant}
            allowClear
            showSearch
            optionFilterProp="children"
            style={{ width: '48%' }}
          >
            {consultantOptions.map(o => <Select.Option key={o} value={o}>{o}</Select.Option>)}
          </Select>
          <Select
            placeholder="量来源"
            value={filterSource}
            onChange={setFilterSource}
            allowClear
            style={{ width: '48%' }}
          >
            {sourceOptions.map(o => <Select.Option key={o} value={o}>{o}</Select.Option>)}
          </Select>
        </div>
      )}

      {/* 统计栏 */}
      <div className="m-list-stats">
        <span>共 <b>{total}</b> 条记录</span>
        {filterConsultant && <Tag closable onClose={() => setFilterConsultant(undefined)}>{filterConsultant}</Tag>}
        {filterSource && <Tag closable onClose={() => setFilterSource(undefined)} color={sourceColor(filterSource)}>{filterSource}</Tag>}
      </div>

      {/* 列表 */}
      <div className="m-list-cards">
        {records.map(r => (
          <div
            key={r.记录ID}
            className="m-record-card"
            onClick={() => { setDetailRecord(r); setDetailVisible(true) }}
          >
            <div className="m-card-header">
              <div className="m-card-name">
                <UserOutlined style={{ marginRight: 4 }} />
                {r.咨询者姓名 || '未填姓名'}
                {r.性别 && <span className="m-gender">({r.性别})</span>}
              </div>
              <Tag color={sourceColor(r.量来源)}>{r.量来源 || '-'}</Tag>
            </div>

            <div className="m-card-body">
              <div className="m-card-row">
                <PhoneOutlined className="m-card-icon" />
                <span>{r.电话 || '-'}</span>
              </div>
              <div className="m-card-row">
                <CalendarOutlined className="m-card-icon" />
                <span>{r.登记日期 ? dayjs(r.登记日期).format('MM-DD HH:mm') : '-'}</span>
              </div>
              <div className="m-card-row">
                <UserOutlined className="m-card-icon" />
                <span>咨询师: {r.咨询师 || '未分配'}</span>
              </div>
            </div>

            <div className="m-card-footer">
              <Space size={4} wrap>
                {r.是否上门 === 1 && <Tag color="cyan" bordered={false}>上门</Tag>}
                {r.是否报名 === 1 && <Tag color="green" bordered={false}>报名</Tag>}
                {r.是否订座 === 1 && <Tag color="purple" bordered={false}>订座</Tag>}
                {r.是否无效量 === 1 && <Tag color="red" bordered={false}>无效</Tag>}
                {r.是否不算量 === 1 && <Tag color="orange" bordered={false}>不算</Tag>}
              </Space>
              <EyeOutlined className="m-card-detail-icon" />
            </div>
          </div>
        ))}

        {records.length === 0 && !loading && (
          <Empty description="暂无数据" style={{ marginTop: 60 }} />
        )}

        {loading && (
          <div className="m-list-loading">
            <Spin />
          </div>
        )}

        {records.length < total && records.length > 0 && (
          <Button
            block
            onClick={handleLoadMore}
            loading={loading}
            className="m-load-more"
          >
            加载更多 ({records.length}/{total})
          </Button>
        )}
      </div>

      {/* 详情抽屉 */}
      <Drawer
        title="咨询详情"
        placement="bottom"
        height="80vh"
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        className="m-detail-drawer"
      >
        {detailRecord && (
          <div className="m-detail-content">
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="姓名">{detailRecord.咨询者姓名}</Descriptions.Item>
              <Descriptions.Item label="性别">{detailRecord.性别}</Descriptions.Item>
              <Descriptions.Item label="电话" span={2}>{detailRecord.电话}</Descriptions.Item>
              {detailRecord.QQ && (
                <Descriptions.Item label="QQ" span={2}>{detailRecord.QQ}</Descriptions.Item>
              )}
              <Descriptions.Item label="年龄">{detailRecord.年龄}</Descriptions.Item>
              <Descriptions.Item label="学历">{detailRecord.学历}</Descriptions.Item>
              <Descriptions.Item label="神殿" span={2}>{detailRecord.神殿}</Descriptions.Item>
              <Descriptions.Item label="状态">{detailRecord.状态}</Descriptions.Item>
              <Descriptions.Item label="报名意向">{detailRecord.报名意向}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" plain>来源信息</Divider>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="量来源">{detailRecord.量来源}</Descriptions.Item>
              <Descriptions.Item label="来源类别">{detailRecord.来源类别}</Descriptions.Item>
              <Descriptions.Item label="媒体来源" span={2}>{detailRecord.媒体来源}</Descriptions.Item>
              <Descriptions.Item label="关键字" span={2}>{detailRecord.关键字}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" plain>分配信息</Divider>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="咨询师">{detailRecord.咨询师}</Descriptions.Item>
              <Descriptions.Item label="分量人">{detailRecord.分量人}</Descriptions.Item>
              <Descriptions.Item label="登记日期" span={2}>
                {detailRecord.登记日期 ? dayjs(detailRecord.登记日期).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="咨询次数">{detailRecord.咨询次数}</Descriptions.Item>
              <Descriptions.Item label="代咨">{detailRecord.代咨}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" plain>标记</Divider>
            <Space wrap>
              {detailRecord.是否上门 === 1 && <Tag color="cyan">上门</Tag>}
              {detailRecord.是否报名 === 1 && <Tag color="green">报名</Tag>}
              {detailRecord.是否订座 === 1 && <Tag color="purple">订座</Tag>}
              {detailRecord.是否无效量 === 1 && <Tag color="red">无效量</Tag>}
              {detailRecord.是否不算量 === 1 && <Tag color="orange">不算量</Tag>}
              {detailRecord.是否校园量 === 1 && <Tag color="blue">校园量</Tag>}
            </Space>

            {detailRecord.咨询结果 && (
              <>
                <Divider orientation="left" plain>咨询结果</Divider>
                <p>{detailRecord.咨询结果}</p>
              </>
            )}
            {detailRecord.备注 && (
              <>
                <Divider orientation="left" plain>备注</Divider>
                <p>{detailRecord.备注}</p>
              </>
            )}

            {/* 联系方式 */}
            {(detailRecord.微信 || detailRecord.QQ || detailRecord.抖音 || detailRecord.快手) && (
              <>
                <Divider orientation="left" plain>其他联系方式</Divider>
                <Descriptions column={2} size="small" bordered>
                  {detailRecord.微信 && <Descriptions.Item label="微信">{detailRecord.微信}</Descriptions.Item>}
                  {detailRecord.QQ && <Descriptions.Item label="QQ">{detailRecord.QQ}</Descriptions.Item>}
                  {detailRecord.抖音 && <Descriptions.Item label="抖音">{detailRecord.抖音}</Descriptions.Item>}
                  {detailRecord.快手 && <Descriptions.Item label="快手">{detailRecord.快手}</Descriptions.Item>}
                </Descriptions>
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
