import React from 'react'
import { Typography, Space, Segmented } from 'antd'
import { getCampusOptions } from '@/config/campusConfig'
import { useCampusStore } from '@/stores/campusStore'
import LazySection from '@/pages/academic/mgnt/LazySection'

const { Title } = Typography

// 自动收集当前目录下的所有页面入口（排除组件与本文件）
const modules = import.meta.glob('./**/*.tsx')

type Entry = {
  key: string
  path: string
  label: string
  order: number
  component: React.LazyExoticComponent<React.ComponentType<any>>
}

const TITLE_MAP: Record<string, string> = {
  '1-02-01campus-core-data-summary': '1. 神殿核心数据汇总',
  '2-employment-goals-results': '2. 就业目标与结果',
  '3-contract-goals-results': '3. 企业签约目标与结果',
  '4-reputation-summary': '4. 口碑统计汇总',
  '5-new-student-stability': '5. 新生维稳',
  '6-promotion-plan': '6. 升学计划',
  '7-student-fluctuation': '7. 学员异动',
  '8-dormitory-statistics': '8. 宿舍管理统计表',
  '9-enrollment-statistics': '9. 学籍统计',
  '10-manager-analysis': '10. 经理功能分析表',
  '11-training-plan-performance': '11. 培训计划与成绩',
  '12-teacher-ratio': '12. 师资配比表',
  '13-recruitment-summary': '13. 招聘计划与总结汇总表',
}

const toTitle = (p: string) => {
  // 从路径中提取文件夹名 (如 "./8-dormitory-statistics/index.tsx" -> "8-dormitory-statistics")
  const parts = p
    .replace(/^\.\//, '') // 移除开头的 ./
    .replace(/\.tsx$/, '') // 移除 .tsx
    .replace(/\/index$/i, '') // 移除 /index
    .split('/')
    .filter(Boolean)

  const base = parts[0] || '' // 取第一层目录名
  // console.log('🔍 toTitle 调试:', { path: p, base, mapped: TITLE_MAP[base] });
  return TITLE_MAP[base] || base.replace(/[-_]/g, ' ')
}

const buildEntries = (): Entry[] => {
  const entries: Entry[] = []
  Object.entries(modules).forEach(([path, loader]) => {
    if (path.endsWith('AllCampusLevelPages.tsx')) return
    if (path.includes('/components/')) return
    if (!path.endsWith('/index.tsx')) return
    const key = path
      .replace(/^\.\//, '')
      .replace(/\//g, '-')
      .replace(/\.tsx$/, '')
    const label = toTitle(path)
    const base = path
      .replace(/\.tsx$/, '')
      .replace(/index$/i, '')
      .split('/')
      .filter(Boolean)
      .slice(-1)[0]
    const num = parseInt(base.split(/[-_]/)[0], 10)
    const order = isNaN(num) ? Number.MAX_SAFE_INTEGER : num
    // 关键修复：在构建阶段用 React.lazy 包装，确保组件引用稳定，避免每次渲染反复卸载/重挂载导致"频繁加载"
    const component = React.lazy(loader as () => Promise<any>)
    entries.push({ key, path, label, order, component })
  })
  // 按文件名数字前缀排序（1..12..13），而不是字典序
  entries.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
  console.log(
    '📊 教化司 AllCampusLevelPages entries:',
    entries.map((e) => ({ label: e.label, order: e.order, path: e.path })),
  )
  return entries
}

const ENTRIES = buildEntries()

interface AllCampusLevelPagesProps {
  hideCampusSelector?: boolean
}

const AllCampusLevelPagesATQ: React.FC<AllCampusLevelPagesProps> = ({ hideCampusSelector }) => {
  const { currentCampus, setCampus } = useCampusStore()
  const campusOptions = React.useMemo(() => {
    return getCampusOptions().map(({ label }) => ({
      label: label.replace(/神殿$/, ''),
      value: label,
    }))
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          教化司 · 神殿层级整合
        </Title>
        {!hideCampusSelector && (
          <Segmented
            options={campusOptions}
            value={currentCampus || campusOptions[0]?.value}
            onChange={(val) => setCampus(String(val))}
          />
        )}
      </Space>

      {ENTRIES.map((entry) => (
        <LazySection
          key={entry.key}
          id={entry.key}
          title={entry.label}
          component={entry.component}
          componentProps={hideCampusSelector ? { hideCampusSelector: true } : undefined}
        />
      ))}
    </div>
  )
}

export default AllCampusLevelPagesATQ
