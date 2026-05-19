import React from 'react'
import { Typography, Space, Segmented } from 'antd'
import { getCampusOptions } from '@/config/campusConfig'
import { useCampusStore } from '@/stores/campusStore'
import LazySection from '@/pages/academic/mgnt/LazySection'

const { Title, Text } = Typography

// 自动收集本目录下的所有页面（递归），排除当前整合页
const modules = import.meta.glob('./**/*.tsx')

type Entry = {
  key: string
  path: string
  label: string
  order: number
  component: React.LazyExoticComponent<React.ComponentType<any>>
}

const TITLE_MAP: Record<string, string> = {
  '1-campus-core-summary': '1. 神殿核心数据汇总',
  '2-employment-goals-results': '2. 就业目标与结果',
  '3-reputation-enrollment-goals-results': '3. 口碑招生目标与结果',
  '4-student-stability': '4. 新生维稳',
  '5-teacher-staffing-ratio': '5. 师资配比',
  '6-onboarding-offboarding': '6. 入职离职',
  '7-training-summary': '7. 培训汇总',
  '8-academic-network-survey-summary': '8. 网络调查汇总表',
  '9-enterprise-survey-summary': '9. 企业调研汇总',
  '10-position-analysis': '10. 岗位分析报告汇总表',
  '11-courseware-writing': '11. 课件编写',
  '12-questionbank-writing': '12. 题库编写汇总表',
}

const toTitle = (s: string) => {
  // 从路径中提取文件夹名（如 "./5-teacher-staffing-ratio/index.tsx" -> "5-teacher-staffing-ratio"）
  const pathParts = s
    .replace(/^\.\//, '') // 移除开头的 ./
    .replace(/\.tsx$/, '') // 移除 .tsx
    .replace(/\/index$/i, '') // 移除 /index
    .split('/')
    .filter(Boolean)

  // 获取第一层目录名（带序号的部分）
  const folderName = pathParts[0] || ''

  // 在 TITLE_MAP 中查找对应的中文标题
  return TITLE_MAP[folderName] || folderName.replace(/[-_]/g, ' ')
}

const buildEntries = (): Entry[] => {
  const entries: Entry[] = []
  Object.entries(modules).forEach(([path, loader]) => {
    if (path.endsWith('AllCampusLevelPages.tsx')) return
    // 忽略组件子目录，防止将表格/选择器等子组件当作独立页面渲染
    if (path.includes('/components/')) return

    const key = path
      .replace(/^\.\//, '')
      .replace(/\//g, '-')
      .replace(/\.tsx$/, '')
    const label = toTitle(path)

    // 从文件夹名中提取顺序号
    // 优先从第一层目录名提取（如 "./5-teacher-staffing-ratio/index.tsx" -> "5-teacher-staffing-ratio"）
    const pathParts = path
      .replace(/^\.\//, '')
      .replace(/\.tsx$/, '')
      .split('/')
      .filter(Boolean)

    // 获取第一层目录名（带序号的部分）
    const folderName = pathParts[0] || ''
    const orderMatch = folderName.match(/^(\d+)/)
    const order = orderMatch ? parseInt(orderMatch[1], 10) : Number.POSITIVE_INFINITY

    // 关键修复：在构建阶段包一层 React.lazy，从而保持组件引用稳定，避免每次渲染重复创建导致的反复卸载/重挂载与"频繁加载"
    const component = React.lazy(loader as () => Promise<any>)

    entries.push({ key, path, label, order, component })
  })
  // 稳定排序：先按数字顺序，再按标签回退
  entries.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))

  // 调试：打印排序结果
  console.log(
    '📊 AllCampusLevelPages entries:',
    entries.map((e) => ({ label: e.label, order: e.order, path: e.path })),
  )

  return entries
}

const ENTRIES = buildEntries()

const AllCampusLevelPages: React.FC = () => {
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
          最高议事厅 · 智慧司 · 神殿层级整合
        </Title>
        {/* 神殿标签切换 */}
        <Segmented
          options={campusOptions}
          value={currentCampus || campusOptions[0]?.value}
          onChange={(val) => setCampus(String(val))}
        />
      </Space>

      {/* 按 mgnt 根页样式：整页分段懒加载显示所有子页 */}
      {ENTRIES.map((entry) => (
        <LazySection
          key={entry.key}
          id={entry.key}
          title={entry.label}
          component={entry.component}
        />
      ))}
    </div>
  )
}

export default AllCampusLevelPages
