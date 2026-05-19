import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { App, Button, Card, Input, InputNumber, Spin, Table, Select } from 'antd'
import { FileTextOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons'
import api from '@/services/api'

interface CampusStaffingDetailProps {
  campusName: string
  year: string
}

// 顶部汇总数据类型
type SummaryData = {
  consultTotal: number | null
  consultManager: number | null
  consultStaff: number | null
  channelTotal: number | null
  countyOffice: number | null
  townOffice: number | null
  informer: number | null
}

// 咨询师明细行类型
type ConsultantRow = {
  key: string
  index: number
  name: string
  position: string
  ideology: string
  management: string
  business: string
}

// 渠道人资明细行类型
type ChannelRow = {
  key: string
  index: number
  name: string
  position: string
  ideology: string
  management: string
  business: string
}

/**
 * 单神殿人员职数明细组件
 * 数据存储到后端数据库
 */
export default function CampusStaffingDetail({ campusName, year }: CampusStaffingDetailProps) {
  const { notification } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // 顶部汇总数据
  const [summaryData, setSummaryData] = useState<SummaryData>({
    consultTotal: null,
    consultManager: null,
    consultStaff: null,
    channelTotal: null,
    countyOffice: null,
    townOffice: null,
    informer: null,
  })

  // 咨询师明细数据（13行）
  const initialConsultants = useMemo<ConsultantRow[]>(() => {
    return Array.from({ length: 13 }, (_, i) => ({
      key: String(i + 1),
      index: i + 1,
      name: '',
      position: '',
      ideology: '',
      management: '',
      business: '',
    }))
  }, [])

  const [consultants, setConsultants] = useState<ConsultantRow[]>(initialConsultants)

  // 渠道人资明细数据（5行初始）
  const initialChannels = useMemo<ChannelRow[]>(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      key: String(i + 1),
      index: i + 1,
      name: '',
      position: '',
      ideology: '',
      management: '',
      business: '',
    }))
  }, [])

  const [channels, setChannels] = useState<ChannelRow[]>(initialChannels)

  // 从后端加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get(`/consult/staffing/detail/${year}/${campusName}`)
      const data = response.data
      
      if (data) {
        // 加载汇总数据
        if (data.汇总数据) {
          setSummaryData({
            consultTotal: data.汇总数据.咨询总职数 ?? null,
            consultManager: data.汇总数据.咨询干部职数 ?? null,
            consultStaff: data.汇总数据.咨询员工职数 ?? null,
            channelTotal: data.汇总数据.渠道总职数 ?? null,
            countyOffice: data.汇总数据.县办 ?? null,
            townOffice: data.汇总数据.乡办 ?? null,
            informer: data.汇总数据.信息员 ?? null,
          })
        }
        
        // 加载咨询师明细
        if (data.咨询师明细 && data.咨询师明细.length > 0) {
          setConsultants(prev => prev.map((row, idx) => {
            const dbRow = data.咨询师明细.find((r: any) => r.序号 === idx + 1)
            if (dbRow) {
              return {
                ...row,
                name: dbRow.姓名 || '',
                position: dbRow.岗位 || '',
                ideology: dbRow.思想 || '',
                management: dbRow.管理 || '',
                business: dbRow.业务 || '',
              }
            }
            return row
          }))
        }
        
        // 加载渠道人员明细
        if (data.渠道人员明细 && data.渠道人员明细.length > 0) {
          setChannels(prev => prev.map((row, idx) => {
            const dbRow = data.渠道人员明细.find((r: any) => r.序号 === idx + 1)
            if (dbRow) {
              return {
                ...row,
                name: dbRow.姓名 || '',
                position: dbRow.岗位 || '',
                ideology: dbRow.思想 || '',
                management: dbRow.管理 || '',
                business: dbRow.业务 || '',
              }
            }
            return row
          }))
        }
      }
    } catch (error: any) {
      // 404表示还没有数据，属于正常情况，不需要显示错误
      if (error.response?.status !== 404) {
        console.error('加载数据失败:', error)
      }
    } finally {
      setLoading(false)
    }
  }, [year, campusName])

  // 保存数据到后端
  const saveData = async () => {
    setSaving(true)
    try {
      // 构造保存请求
      const request = {
        年份: parseInt(year),
        神殿: campusName,
        汇总数据: {
          咨询总职数: summaryData.consultTotal,
          咨询干部职数: summaryData.consultManager,
          咨询员工职数: summaryData.consultStaff,
          渠道总职数: summaryData.channelTotal,
          县办: summaryData.countyOffice,
          乡办: summaryData.townOffice,
          信息员: summaryData.informer,
        },
        咨询师明细: consultants.map(c => ({
          年份: parseInt(year),
          神殿: campusName,
          序号: c.index,
          姓名: c.name || null,
          岗位: c.position || null,
          思想: c.ideology || null,
          管理: c.management || null,
          业务: c.business || null,
        })),
        渠道人员明细: channels.map(c => ({
          年份: parseInt(year),
          神殿: campusName,
          序号: c.index,
          姓名: c.name || null,
          岗位: c.position || null,
          思想: c.ideology || null,
          管理: c.management || null,
          业务: c.business || null,
        })),
      }
      
      await api.post(`/consult/staffing/detail/${year}/${campusName}`, request)
      notification.success({ message: '已保存', description: '各神殿人员职数明细保存成功', placement: 'topRight', duration: 3 })
    } catch (error: any) {
      console.error('保存失败:', error)
      notification.error({ message: '保存失败', description: error.response?.data?.detail || error.message || '请检查网络连接或联系管理员', placement: 'topRight', duration: 4 })
    } finally {
      setSaving(false)
    }
  }

  // 初始加载数据 - 只在year和campusName变化时加载
  useEffect(() => {
    if (year && campusName) {
      loadData()
    }
  }, [year, campusName]) // 移除loadData依赖，防止无限循环

  // 监听明细表变化，自动计算汇总数据
  useEffect(() => {
    const consultManagerCount = consultants.filter(c => c.position === '咨询干部').length
    const consultStaffCount = consultants.filter(c => c.position === '咨询员工').length
    const countyOfficeCount = channels.filter(c => c.position === '县办').length
    const townOfficeCount = channels.filter(c => c.position === '乡办').length
    const informerCount = channels.filter(c => c.position === '信息员').length

    setSummaryData(prev => ({
      ...prev,
      consultManager: consultManagerCount,
      consultStaff: consultStaffCount,
      consultTotal: consultManagerCount + consultStaffCount,
      countyOffice: countyOfficeCount,
      townOffice: townOfficeCount,
      informer: informerCount,
      channelTotal: countyOfficeCount + townOfficeCount + informerCount
    }))
  }, [consultants, channels])

  // 更新汇总数据 (手动修改目前已被自动计算覆盖，但保留函数签名兼容性)
  const updateSummary = (field: keyof SummaryData, value: number | null) => {
    // 自动计算逻辑已经接管了所有汇总更新，这里不再手动更新summaryData
    // 如果需要手动调整，需要解除上面的useEffect或者增加模式切换
    // 根据需求描述"自动统计自动填写"，这里应该留空或打印日志
    console.log('Summary is auto-calculated from details.')
  }

  // 更新咨询师明细
  const updateConsultant = (index: number, field: keyof ConsultantRow, value: string) => {
    setConsultants(prev => {
      const next = [...prev]
      ;(next[index] as any)[field] = value
      return next
    })
  }

  // 更新渠道人资明细
  const updateChannel = (index: number, field: keyof ChannelRow, value: string) => {
    setChannels(prev => {
      const next = [...prev]
      ;(next[index] as any)[field] = value
      return next
    })
  }

  // 顶部汇总表列配置
  const summaryColumns = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 50,
      align: 'center' as const,
      render: () => 1,
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 70,
      render: () => campusName,
    },
    {
      title: '咨询师',
      children: [
        {
          title: '咨询总职数',
          dataIndex: 'consultTotal',
          key: 'consultTotal',
          width: 90,
          align: 'center' as const,
          render: () => (
            <InputNumber
              value={summaryData.consultTotal}
              disabled
              style={{ width: '100%', color: '#000', backgroundColor: '#f5f5f5', fontWeight: 'bold' }}
              size="small"
              min={0}
            />
          ),
        },
        {
          title: '咨询干部职数',
          dataIndex: 'consultManager',
          key: 'consultManager',
          width: 90,
          align: 'center' as const,
          render: () => (
            <InputNumber
              value={summaryData.consultManager}
              disabled
              style={{ width: '100%' }}
              size="small"
              min={0}
            />
          ),
        },
        {
          title: '咨询员工职数',
          dataIndex: 'consultStaff',
          key: 'consultStaff',
          width: 90,
          align: 'center' as const,
          render: () => (
            <InputNumber
              value={summaryData.consultStaff}
              disabled
              style={{ width: '100%' }}
              size="small"
              min={0}
            />
          ),
        },
      ],
    },
    {
      title: '渠道职数',
      children: [
        {
          title: '渠道总职数',
          dataIndex: 'channelTotal',
          key: 'channelTotal',
          width: 80,
          align: 'center' as const,
          render: () => (
            <InputNumber
              value={summaryData.channelTotal}
              disabled
              style={{ width: '100%', color: '#000', backgroundColor: '#f5f5f5', fontWeight: 'bold' }}
              size="small"
              min={0}
            />
          ),
        },
        {
          title: '县办',
          dataIndex: 'countyOffice',
          key: 'countyOffice',
          width: 70,
          align: 'center' as const,
          render: () => (
            <InputNumber
              value={summaryData.countyOffice}
              disabled
              style={{ width: '100%' }}
              size="small"
              min={0}
            />
          ),
        },
        {
          title: '乡办',
          dataIndex: 'townOffice',
          key: 'townOffice',
          width: 70,
          align: 'center' as const,
          render: () => (
            <InputNumber
              value={summaryData.townOffice}
              disabled
              style={{ width: '100%' }}
              size="small"
              min={0}
            />
          ),
        },
        {
          title: '信息员',
          dataIndex: 'informer',
          key: 'informer',
          width: 70,
          align: 'center' as const,
          render: () => (
            <InputNumber
              value={summaryData.informer}
              disabled
              style={{ width: '100%' }}
              size="small"
              min={0}
            />
          ),
        },
      ],
    },
  ]

  // 咨询师明细表列配置
  const consultantColumns = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 50,
      align: 'center' as const,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 80,
      render: (_: any, record: ConsultantRow, index: number) => (
        <Input
          value={record.name}
          onChange={(e) => updateConsultant(index, 'name', e.target.value)}
          size="small"
        />
      ),
    },
    {
      title: '咨询师',
      children: [
        {
          title: '岗位',
          dataIndex: 'position',
          key: 'position',
          width: 100,
          render: (_: any, record: ConsultantRow, index: number) => (
            <Select
              value={record.position}
              onChange={(val) => updateConsultant(index, 'position', val)}
              size="small"
              style={{ width: '100%' }}
              options={[
                { value: '咨询干部', label: '咨询干部' },
                { value: '咨询员工', label: '咨询员工' },
                { value: '其他', label: '其他' },
              ]}
            />
          ),
        },
        {
          title: '思想',
          dataIndex: 'ideology',
          key: 'ideology',
          width: 100,
          render: (_: any, record: ConsultantRow, index: number) => (
            <Input
              value={record.ideology}
              onChange={(e) => updateConsultant(index, 'ideology', e.target.value)}
              size="small"
            />
          ),
        },
        {
          title: '管理',
          dataIndex: 'management',
          key: 'management',
          width: 100,
          render: (_: any, record: ConsultantRow, index: number) => (
            <Input
              value={record.management}
              onChange={(e) => updateConsultant(index, 'management', e.target.value)}
              size="small"
            />
          ),
        },
        {
          title: '业务',
          dataIndex: 'business',
          key: 'business',
          width: 100,
          render: (_: any, record: ConsultantRow, index: number) => (
            <Input
              value={record.business}
              onChange={(e) => updateConsultant(index, 'business', e.target.value)}
              size="small"
            />
          ),
        },
      ],
    },
  ]

  // 渠道人资明细表列配置
  const channelColumns = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 50,
      align: 'center' as const,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 80,
      render: (_: any, record: ChannelRow, index: number) => (
        <Input
          value={record.name}
          onChange={(e) => updateChannel(index, 'name', e.target.value)}
          size="small"
        />
      ),
    },
    {
      title: '渠道人资',
      children: [
        {
          title: '岗位',
          dataIndex: 'position',
          key: 'position',
          width: 100,
          render: (_: any, record: ChannelRow, index: number) => (
            <Select
              value={record.position}
              onChange={(val) => updateChannel(index, 'position', val)}
              size="small"
              style={{ width: '100%' }}
              options={[
                { value: '县办', label: '县办' },
                { value: '乡办', label: '乡办' },
                { value: '信息员', label: '信息员' },
                { value: '其他', label: '其他' },
              ]}
            />
          ),
        },
        {
          title: '思想',
          dataIndex: 'ideology',
          key: 'ideology',
          width: 100,
          render: (_: any, record: ChannelRow, index: number) => (
            <Input
              value={record.ideology}
              onChange={(e) => updateChannel(index, 'ideology', e.target.value)}
              size="small"
            />
          ),
        },
        {
          title: '管理',
          dataIndex: 'management',
          key: 'management',
          width: 100,
          render: (_: any, record: ChannelRow, index: number) => (
            <Input
              value={record.management}
              onChange={(e) => updateChannel(index, 'management', e.target.value)}
              size="small"
            />
          ),
        },
        {
          title: '业务',
          dataIndex: 'business',
          key: 'business',
          width: 100,
          render: (_: any, record: ChannelRow, index: number) => (
            <Input
              value={record.business}
              onChange={(e) => updateChannel(index, 'business', e.target.value)}
              size="small"
            />
          ),
        },
      ],
    },
  ]

  return (
    <Spin spinning={loading} tip="加载中...">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 顶部汇总表 */}
        <Card bodyStyle={{ padding: '8px 12px' }}>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: '#c00000',
              }}
            >
              <FileTextOutlined style={{ marginRight: 6 }} />
              {campusName}{year}年前端人员职数
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadData}
                loading={loading}
              >
                刷新
              </Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                onClick={saveData}
                loading={saving}
              >
                保存
              </Button>
            </div>
          </div>
          {/* 第一个表加上标题咨询师 */}
          <div style={{ fontWeight: 'bold', marginBottom: 5 }}>咨询师</div>
          <Table
            columns={summaryColumns as any}
            dataSource={[{ key: '1' }]}
            pagination={false}
            bordered
            size="small"
          />
        </Card>

        {/* 咨询师明细表 */}
        <Card bodyStyle={{ padding: '8px 12px' }}>
          {/* 第二个表加上标题咨询师 */}
          <div style={{ fontWeight: 'bold', marginBottom: 5 }}>咨询师</div>
          <Table
            columns={consultantColumns as any}
            dataSource={consultants}
            pagination={false}
            bordered
            size="small"
          />
        </Card>

        {/* 渠道人资明细表 */}
        <Card bodyStyle={{ padding: '8px 12px' }}>
          {/* 第三个表加上标题渠道人资 */}
          <div style={{ fontWeight: 'bold', marginBottom: 5 }}>渠道人资</div>
          <Table
            columns={channelColumns as any}
            dataSource={channels}
            pagination={false}
            bordered
            size="small"
          />
        </Card>

        <style>{`
          .ant-table-thead > tr > th {
            background-color: #fce4d6 !important;
            text-align: center !important;
            font-weight: bold !important;
            border: 1px solid #d0d0d0 !important;
            padding: 2px 4px !important;
            font-size: 11px !important;
            line-height: 1.2 !important;
            white-space: normal !important;
            vertical-align: middle !important;
          }
          .ant-table-tbody > tr > td {
            border: 1px solid #d0d0d0 !important;
            padding: 2px 4px !important;
            font-size: 11px !important;
            line-height: 1.3 !important;
          }
          .ant-input-number, .ant-input {
            font-size: 11px !important;
          }
          .ant-input-number-input, .ant-input {
            padding: 0 4px !important;
            height: 22px !important;
          }
        `}</style>
      </div>
    </Spin>
  )
}
