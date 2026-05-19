import React, { useEffect, useState, useMemo } from 'react'
import { App, Card, Table, Typography, Spin, Select, Space, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { fetchCampuses, type CampusProfile, fetchUserPermissions, type UserPermissionInfo } from '@/services/configMaster'
import { fetchAllManagerFunctionEvaluation, type ManagerFunctionEvaluationOut, type EvaluatorScores } from '@/services/staffFunctionAnalysis'

const { Title, Text } = Typography

interface ManagerFunctionAnalysisRecord {
  key: string
  serialNumber: number
  campus: string
  name: string
  values: number
  businessAbility: number
  teamBuilding: number
  managementAbility: number
  total: number
}

const columns: ColumnsType<ManagerFunctionAnalysisRecord> = [
  { title: '序号', dataIndex: 'serialNumber', align: 'center', width: 70 },
  { title: '神殿', dataIndex: 'campus', align: 'center', width: 100 },
  { title: '姓名', dataIndex: 'name', align: 'center', width: 110 },
  { title: '价值观', dataIndex: 'values', align: 'center', width: 100 },
  { title: '业务能力', dataIndex: 'businessAbility', align: 'center', width: 110 },
  { title: '团队建设', dataIndex: 'teamBuilding', align: 'center', width: 110 },
  { title: '管理能力', dataIndex: 'managementAbility', align: 'center', width: 110 },
  { title: '合计', dataIndex: 'total', align: 'center', width: 100 },
]

const ManagerAnalysisPage: React.FC = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState<number | 'all'>('all')
  const [month, setMonth] = useState<number | 'all'>('all')
  const [campuses, setCampuses] = useState<CampusProfile[]>([])
  const [analysisData, setAnalysisData] = useState<ManagerFunctionEvaluationOut[]>([])
  const [userCampusMap, setUserCampusMap] = useState<Map<string, string>>(new Map())

  // 年份选项
  const yearOptions = useMemo(() => {
    const currentYear = dayjs().year()
    const years: { value: number | 'all'; label: string }[] = [
      { value: 'all', label: '历史合计' }
    ]
    for (let y = currentYear; y >= currentYear - 5; y--) {
      years.push({ value: y, label: `${y}年` })
    }
    return years
  }, [])

  // 月份选项
  const monthOptions = useMemo(() => {
    const months: { value: number | 'all'; label: string }[] = [
      { value: 'all', label: '全部月份' }
    ]
    for (let m = 1; m <= 12; m++) {
      months.push({ value: m, label: `${m}月` })
    }
    return months
  }, [])

  // 从后端加载数据
  const loadData = async () => {
    try {
      setLoading(true)
      // 如果是"历史合计"，则不传年份参数
      const yearParam = year === 'all' ? undefined : year
      // 构建月份参数：格式为 YYYY-MM
      let monthParam: string | undefined = undefined
      if (year !== 'all' && month !== 'all') {
        monthParam = `${year}-${String(month).padStart(2, '0')}`
      }
      // 并行获取神殿列表、经理功能评价数据和用户信息（用于获取神殿）
      // 注意：fetchUserPermissions 不支持 position 参数的多值过滤，需要获取所有用户后过滤
      const [campusList, analysisResults, allUsers] = await Promise.all([
        fetchCampuses(),
        fetchAllManagerFunctionEvaluation(yearParam, monthParam),
        fetchUserPermissions(),
      ])
      
      // 过滤出学术经理和学术副经理
      const userPermissions = allUsers.filter((user: UserPermissionInfo) => 
        user.position === '学术经理' || user.position === '学术副经理'
      )
      setCampuses(campusList)
      setAnalysisData(analysisResults)
      
      // 建立姓名到神殿的映射（从 users 表读取 campus 字段）
      const nameToCampusMap = new Map<string, string>()
      userPermissions.forEach((user: UserPermissionInfo) => {
        if (user.name && user.campus) {
          nameToCampusMap.set(user.name, user.campus)
        }
      })
      setUserCampusMap(nameToCampusMap)
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败，请刷新页面重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [year, month])

  // 当年份变为"历史合计"时，重置月份为"全部月份"
  useEffect(() => {
    if (year === 'all') {
      setMonth('all')
    }
  }, [year])

  // 构建神殿名称映射（去掉"神殿"后缀用于显示）
  const campusNameMap = useMemo(() => {
    const map = new Map<string, string>()
    campuses.forEach((c) => {
      const shortName = c.name.replace(/神殿$/, '')
      map.set(c.name, shortName)
      map.set(shortName, shortName)
      if (c.code) {
        map.set(c.code, shortName)
      }
    })
    return map
  }, [campuses])

  // 神殿排序顺序（按照指定顺序）
  const campusOrder = useMemo(() => {
    const order = ['河北盛邦', '河北冀美', '河北石美', '山西晋美', '山西原美', '山西太美', '广西桂美', '广西邕美', '贵州黔美']
    const orderMap = new Map<string, number>()
    order.forEach((campus, index) => {
      orderMap.set(campus, index)
      // 也支持带"神殿"后缀的格式
      orderMap.set(campus + '神殿', index)
    })
    return orderMap
  }, [])

  // 将后端数据转换为表格数据
  const tableData: ManagerFunctionAnalysisRecord[] = useMemo(() => {
    const records: ManagerFunctionAnalysisRecord[] = []
    let serialNumber = 1

    // 遍历每个神殿的分析数据
    analysisData.forEach((item) => {
      // 获取该神殿的评估人员数据
      const evaluators: EvaluatorScores[] = item.数据?.evaluators || []
      
      evaluators.forEach((evaluator) => {
        // 从 users 表的 campus 字段获取神殿（优先使用 users 表的 campus）
        let campusFromUser = userCampusMap.get(evaluator.name) || ''
        
        // 如果 users 表有神殿信息，使用 users 表的神殿；否则使用记录中的神殿
        let campusDisplay = campusFromUser
        if (!campusDisplay) {
          // 如果 users 表没有神殿信息，使用记录中的神殿（兼容旧数据）
          campusDisplay = campusNameMap.get(item.神殿) || item.神殿.replace(/神殿$/, '')
        } else {
          // 使用 users 表的神殿，但需要通过 campusNameMap 格式化显示
          campusDisplay = campusNameMap.get(campusFromUser) || campusFromUser.replace(/神殿$/, '')
        }
        
        records.push({
          key: `${item.id}-${evaluator.name}`,
          serialNumber: serialNumber++,
          campus: campusDisplay,
          name: evaluator.name,
          values: evaluator.价值观 || 0,
          businessAbility: evaluator.业务能力 || 0,
          teamBuilding: evaluator.团队建设 || 0,
          managementAbility: evaluator.管理能力 || 0,
          total: evaluator.合计 || (
            (evaluator.价值观 || 0) + 
            (evaluator.业务能力 || 0) + 
            (evaluator.团队建设 || 0) + 
            (evaluator.管理能力 || 0)
          ),
        })
      })
    })

    // 按神殿排序（按照指定顺序），再按姓名排序
    records.sort((a, b) => {
      if (a.campus !== b.campus) {
        const orderA = campusOrder.get(a.campus) ?? 999
        const orderB = campusOrder.get(b.campus) ?? 999
        if (orderA !== orderB) {
          return orderA - orderB
        }
        // 如果都不在排序列表中，按字母顺序排序
        return a.campus.localeCompare(b.campus, 'zh-CN')
      }
      return a.name.localeCompare(b.name, 'zh-CN')
    })

    // 重新编号
    records.forEach((r, idx) => {
      r.serialNumber = idx + 1
    })

    return records
  }, [analysisData, campusNameMap, userCampusMap, campusOrder])

  // 计算合计行
  const summaryRow = useMemo(() => {
    const sum = {
      values: 0,
      businessAbility: 0,
      teamBuilding: 0,
      managementAbility: 0,
      total: 0,
    }
    tableData.forEach((r) => {
      sum.values += r.values
      sum.businessAbility += r.businessAbility
      sum.teamBuilding += r.teamBuilding
      sum.managementAbility += r.managementAbility
      sum.total += r.total
    })
    return sum
  }, [tableData])

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>08. 最高议事厅智慧司经理、副经理功能分析表</Title>
        <Space>
          <span>年份:</span>
          <Select
            value={year}
            onChange={setYear}
            options={yearOptions}
            style={{ width: 110 }}
          />
          <span>月份:</span>
          <Select
            value={month}
            onChange={setMonth}
            options={monthOptions}
            style={{ width: 110 }}
            disabled={year === 'all'}
          />
          <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
        </Space>
      </div>

      {tableData.length === 0 && !loading && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          暂无数据。请先在"经理评估"页面填写并提交评估数据。
        </Text>
      )}

      <Card>
        <Spin spinning={loading}>
          <Table
            bordered
            pagination={false}
            rowKey="key"
            columns={columns}
            dataSource={tableData}
            scroll={{ x: 900, y: 600 }}
            sticky
            locale={{ emptyText: loading ? '加载中...' : '暂无数据，请先在经理评估页面提交数据' }}
            summary={() => tableData.length > 0 ? (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3} align="center">
                  <Text strong>合计</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="center">
                  <Text strong>{summaryRow.values}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="center">
                  <Text strong>{summaryRow.businessAbility}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="center">
                  <Text strong>{summaryRow.teamBuilding}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="center">
                  <Text strong>{summaryRow.managementAbility}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} align="center">
                  <Text strong>{summaryRow.total}</Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            ) : null}
          />
        </Spin>
      </Card>
    </div>
  )
}

export default ManagerAnalysisPage
