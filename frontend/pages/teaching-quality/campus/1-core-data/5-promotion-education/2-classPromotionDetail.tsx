import React, { useEffect, useMemo, useState } from 'react'
import { Card, Select, Space, Tabs } from 'antd'
import ClassPromotionDetail from '@/pages/teaching-quality/campus/1-core-data/1-core-data-summary/1-core-data/006-promotion-plan/ClassPromotionDetail'
import { useCampusStore } from '@/stores/campusStore'

// 从配置中心神殿名称中解析“地区”
// 约定：名称格式形如 "河北主神殿" / "广西神恩殿"，则地区为前缀 "河北"/"广西"
// 若无法解析（如"测试神殿"），归入“其他”
const parseRegionFromCampusName = (name: string): string => {
  const trimmed = (name || '').trim()
  if (!trimmed) return '其他'

  // 期望格式："河北主神殿" / "广西神恩殿" 这种“省/地区 + 神殿名 + 神殿”
  // 处理方法：
  // - 去掉末尾"神殿"
  // - 在剩余字符串里，找到第一个"省"或"市"或"自治区"或"特别行政区"的位置
  // - 若找到：取其之前（含该词）作为地区（如"广西"+"自治区" -> "广西自治区"，也可按需改为"广西"）
  // - 若未找到：回退为前2个中文

  const base = trimmed.replace(/神殿$/, '')

  // 常见行政区关键字
  const idxProvince = base.indexOf('省')
  const idxCity = base.indexOf('市')
  const idxAuto = base.indexOf('自治区')
  const idxSar = base.indexOf('特别行政区')

  let region = ''
  if (idxSar >= 0) {
    region = base.slice(0, idxSar) // 不包含“特别行政区”四字前的内容
    // 例如“香港特别行政区XX” -> region = “香港”
    region = region || base.slice(0, 2)
  } else if (idxAuto >= 0) {
    // 例如“广西自治区桂美”/“广西壮族自治区桂美”
    // 这里取“广西”或“广西壮族”都可能，需要更稳：取“自治区”前面的前2~6个字，最终回退2字
    const pre = base.slice(0, idxAuto)
    region = pre.length >= 2 ? pre.slice(0, 2) : pre
  } else if (idxProvince >= 0) {
    region = base.slice(0, idxProvince) || base.slice(0, 2)
  } else if (idxCity >= 0) {
    region = base.slice(0, idxCity) || base.slice(0, 2)
  } else {
    const m2 = trimmed.match(/^([\u4e00-\u9fa5]{2})/)
    region = m2?.[1] || ''
  }

  region = (region || '').trim()
  return region || '其他'
}

const CampusClassPromotionDetailPage: React.FC = () => {
  const [activeRegion, setActiveRegion] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  const { getAllCampuses, loadCampusesFromConfig } = useCampusStore()

  // 确保进入页面时刷新一次配置中心神殿（支持新增神殿实时反映）
  useEffect(() => {
    loadCampusesFromConfig()
  }, [loadCampusesFromConfig])

  const allCampuses = getAllCampuses()

  // 计算：地区 -> 神殿名称列表（完全由配置中心驱动）
  const regionCampusMap = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const c of allCampuses) {
      const region = parseRegionFromCampusName(c.name)
      const list = map.get(region) || []
      list.push(c.name)
      map.set(region, list)
    }
    // 去重并排序，保证UI稳定
    const obj: Record<string, string[]> = {}
    Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0], 'zh-Hans-CN'))
      .forEach(([region, names]) => {
        obj[region] = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
      })
    return obj
  }, [allCampuses])

  const regionOptions = useMemo(() => {
    const preferredOrder = ['河北', '山西', '广西', '贵州']
    const keys = Object.keys(regionCampusMap)

    const preferred = preferredOrder.filter((k) => keys.includes(k))
    const others = keys
      .filter((k) => !preferredOrder.includes(k) && k !== '其他')
      .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))

    // 其他始终放最后（如果存在）
    const tail = keys.includes('其他') ? ['其他'] : []

    return [...preferred, ...others, ...tail]
  }, [regionCampusMap])

  // 默认激活第一个地区 Tab
  useEffect(() => {
    if (!activeRegion && regionOptions.length > 0) {
      setActiveRegion(regionOptions[0])
    }
  }, [activeRegion, regionOptions])

  const yearOptions = [selectedYear - 1, selectedYear, selectedYear + 1].map((y) => ({ label: `${y}年`, value: y }))

  return (
    <div style={{ padding: 24 }}>
      <Card title="年份" style={{ marginBottom: 12 }} styles={{ body: { padding: 12 } }}>
        <Space size={16} wrap>
          <Select value={selectedYear} style={{ width: 120 }} options={yearOptions} onChange={(val) => setSelectedYear(val)} />
        </Space>
      </Card>

      <Tabs
        activeKey={activeRegion}
        onChange={(key) => setActiveRegion(key)}
        items={regionOptions.map((region) => ({
          key: region,
          label: region,
          children: (
            <ClassPromotionDetail
              classNum={1}
              hideCampusSelector
              campusFilter={regionCampusMap[region] || []}
              year={selectedYear}
            />
          ),
        }))}
      />
    </div>
  )
}

export default CampusClassPromotionDetailPage
